import type { ContentType, ContentValues, QrContent } from "./types";

export type EncodedPayload = { text: string; warnings: string[]; errors: string[] };

const clean = (value: unknown) => String(value ?? "").trim();
const result = (text: string, warnings: string[] = [], errors: string[] = []): EncodedPayload => ({ text, warnings, errors });

export function normalizeHttpUrl(input: string): string {
  const raw = clean(input);
  if (!raw) return "";
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withScheme);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Only http:// and https:// destinations are allowed.");
  url.hash = url.hash;
  return url.toString();
}

export function isEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(value)); }
export function isPhone(value: string) { return /^\+?[0-9 ().-]{5,24}$/.test(clean(value)); }
export function escapeWifi(value: string) { return value.replace(/([\\;,:"])/g, "\\$1"); }
export function escapeVCard(value: string) { return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,"); }
export function escapeICal(value: string) { return escapeVCard(value).replace(/\r/g, ""); }

/** Fold content lines to 75 UTF-8 octets as required by vCard/iCalendar. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const lines: string[] = [];
  let current = "";
  let limit = 75;
  for (const char of line) {
    if (encoder.encode(current + char).length > limit) {
      lines.push(current);
      current = ` ${char}`;
      limit = 75;
    } else current += char;
  }
  lines.push(current);
  return lines.join("\r\n");
}

function icalDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Enter a valid event date and time.");
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function encodeUrl(v: ContentValues) {
  if (!clean(v.url)) return result("", [], ["Enter a website URL."]);
  try { return result(normalizeHttpUrl(v.url)); } catch (e) { return result("", [], [e instanceof Error ? e.message : "Enter a valid URL."]); }
}

function encodeWifi(v: ContentValues) {
  if (!clean(v.ssid)) return result("", [], ["Network name (SSID) is required."]);
  const encryption = ["WPA", "WEP", "nopass"].includes(v.encryption) ? v.encryption : "WPA";
  if (encryption !== "nopass" && !v.password) return result("", [], ["A password is required for secured networks."]);
  return result(`WIFI:T:${encryption};S:${escapeWifi(v.ssid)};P:${encryption === "nopass" ? "" : escapeWifi(v.password)};H:${v.hidden ? "true" : "false"};;`);
}

function encodeVCard(v: ContentValues) {
  const fullName = `${clean(v.firstName)} ${clean(v.lastName)}`.trim();
  if (!fullName) return result("", [], ["Enter at least a first or last name."]);
  if (v.email && !isEmail(v.email)) return result("", [], ["Enter a valid contact email."]);
  const address = v.address.split(";").map(escapeVCard);
  while (address.length < 5) address.push("");
  const lines = [
    "BEGIN:VCARD", "VERSION:3.0", `N:${escapeVCard(v.lastName)};${escapeVCard(v.firstName)};;;`,
    `FN:${escapeVCard(fullName)}`, v.company && `ORG:${escapeVCard(v.company)}`,
    v.title && `TITLE:${escapeVCard(v.title)}`, v.phone && `TEL;TYPE=CELL:${escapeVCard(v.phone)}`,
    v.email && `EMAIL;TYPE=INTERNET:${escapeVCard(v.email)}`,
    v.address && `ADR;TYPE=WORK:;;${address.join(";")}`,
    v.website && `URL:${escapeVCard(v.website)}`, "END:VCARD",
  ].filter(Boolean) as string[];
  return result(`${lines.map(foldLine).join("\r\n")}\r\n`);
}

function encodeEmail(v: ContentValues) {
  if (!isEmail(v.to)) return result("", [], ["Enter a valid recipient email."]);
  const query: string[] = [];
  if (v.subject) query.push(`subject=${encodeURIComponent(v.subject)}`);
  if (v.body) query.push(`body=${encodeURIComponent(v.body)}`);
  return result(`mailto:${encodeURIComponent(v.to)}${query.length ? `?${query.join("&")}` : ""}`);
}

function encodeSms(v: ContentValues) {
  if (!isPhone(v.number)) return result("", [], ["Enter a valid phone number."]);
  return result(`sms:${clean(v.number)}${v.message ? `?body=${encodeURIComponent(v.message)}` : ""}`);
}

function encodePhone(v: ContentValues) {
  return isPhone(v.number) ? result(`tel:${clean(v.number).replace(/[ ().-]/g, "")}`) : result("", [], ["Enter a valid phone number."]);
}

function encodeEvent(v: ContentValues) {
  if (!clean(v.subject)) return result("", [], ["Event name is required (use the subject field)."]);
  try {
    const start = icalDate(v.start); const end = icalDate(v.end);
    if (new Date(v.end) <= new Date(v.start)) return result("", [], ["Event end must be after its start."]);
    const uid = `${BufferLikeHash(`${v.subject}${v.start}${v.location}`)}@qrforge.test`;
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//QRForge//Print Studio//EN", "BEGIN:VEVENT",
      `UID:${uid}`, `DTSTAMP:${icalDate(new Date().toISOString())}`, `DTSTART:${start}`, `DTEND:${end}`,
      `SUMMARY:${escapeICal(v.subject)}`, v.location && `LOCATION:${escapeICal(v.location)}`,
      v.description && `DESCRIPTION:${escapeICal(v.description)}`, "END:VEVENT", "END:VCALENDAR"].filter(Boolean) as string[];
    return result(`${lines.map(foldLine).join("\r\n")}\r\n`);
  } catch (e) { return result("", [], [e instanceof Error ? e.message : "Check the event dates."]); }
}

function BufferLikeHash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) { h ^= input.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

function encodeGeo(v: ContentValues) {
  const lat = Number(v.latitude); const lng = Number(v.longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) return result("", [], ["Latitude must be −90…90 and longitude −180…180."]);
  return result(`geo:${lat.toFixed(6)},${lng.toFixed(6)}`);
}

function encodeApp(v: ContentValues) {
  const candidates = [v.iosUrl, v.androidUrl].filter(Boolean);
  if (!candidates.length) return result("", [], ["Add at least one app-store URL."]);
  try {
    const text = normalizeHttpUrl(v.iosUrl || v.androidUrl);
    return result(text, candidates.length > 1 ? ["Static QR uses the iOS URL. Save as dynamic for automatic iOS/Android routing."] : []);
  } catch { return result("", [], ["App-store links must be valid HTTP(S) URLs."]); }
}

function encodePayment(v: ContentValues) {
  if (!clean(v.recipient)) return result("", [], ["Payment recipient is required."]);
  const amount = clean(v.amount);
  if (amount && (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0)) return result("", [], ["Amount must be a positive number with up to two decimals."]);
  if (v.paymentScheme === "bitcoin") {
    if (!/^[a-zA-Z0-9]{20,90}$/.test(v.recipient)) return result("", [], ["Enter a valid payment address (20–90 alphanumeric characters)."]);
    const query = new URLSearchParams(); if (amount) query.set("amount", amount); if (v.note) query.set("label", v.note);
    return result(`bitcoin:${v.recipient}${query.size ? `?${query}` : ""}`, ["Payment text is unverified. Confirm the recipient before scanning or paying."]);
  }
  const query = new URLSearchParams({ pa: v.recipient, pn: v.note || "Payment" });
  if (amount) query.set("am", amount); if (v.note) query.set("tn", v.note);
  return result(`upi://pay?${query}`, ["QRForge only encodes payment text. It does not process or verify payments."]);
}

function encodeMulti(v: ContentValues) {
  const links = v.links.filter((l) => l.label.trim() && l.url.trim());
  if (!links.length) return result("", [], ["Add at least one labelled link."]);
  try { links.forEach((l) => normalizeHttpUrl(l.url)); } catch { return result("", [], ["Every multi-link URL must be a valid HTTP(S) address."]); }
  return result("https://qrforge.test/p/your-page", ["This placeholder becomes your hosted /p/[slug] page when saved as a dynamic code."]);
}

export function encodeContent(content: QrContent): EncodedPayload {
  const v = content.values;
  let encoded: EncodedPayload;
  switch (content.type) {
    case "url": encoded = encodeUrl(v); break;
    case "wifi": encoded = encodeWifi(v); break;
    case "vcard": encoded = encodeVCard(v); break;
    case "email": encoded = encodeEmail(v); break;
    case "sms": encoded = encodeSms(v); break;
    case "phone": encoded = encodePhone(v); break;
    case "event": encoded = encodeEvent(v); break;
    case "geo": encoded = encodeGeo(v); break;
    case "appstore": encoded = encodeApp(v); break;
    case "payment": encoded = encodePayment(v); break;
    case "multilink": encoded = encodeMulti(v); break;
    case "text": encoded = clean(v.text) ? result(v.text) : result("", [], ["Enter some text."]); break;
    default: encoded = result("", [], ["Unsupported content type."]);
  }
  const bytes = new TextEncoder().encode(encoded.text).length;
  if (bytes > 1200) encoded.warnings.push("This payload is very dense. Shorten it or use a dynamic short link for reliable print scanning.");
  else if (bytes > 500) encoded.warnings.push("High data density: print larger and test on both iOS and Android cameras.");
  return encoded;
}

export function contentSummary(type: ContentType, values: ContentValues): string {
  if (type === "wifi") return `Wi-Fi: ${values.ssid}`;
  if (type === "vcard") return `${values.firstName} ${values.lastName}`.trim();
  if (type === "geo") return `${values.latitude}, ${values.longitude}`;
  if (type === "multilink") return `${values.links.length} hosted links`;
  return encodeContent({ type, values }).text.slice(0, 180);
}
