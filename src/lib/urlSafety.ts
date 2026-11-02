import { isIP } from "node:net";
import { db } from "@/db";
import { blocklist } from "@/db/schema";
import { normalizeHttpUrl } from "./qr/encoders";

export type SafetyLevel = "safe" | "caution" | "blocked";
export type SafetyResult = { level: SafetyLevel; normalized: string; reasons: string[]; host?: string; checkedAt: string };

const STATIC_BLOCKLIST = [/^(www\.)?malware\.test$/i, /^(www\.)?phishing-example\.test$/i, /^blocked\.example$/i];
const SHORTENERS = new Set(["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "cutt.ly", "rebrand.ly"]);

export function isPrivateIp(host: string) {
  const ip = host.replace(/^\[|\]$/g, "");
  const version = isIP(ip);
  if (version === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
  }
  if (version === 6) return /^(::|::1|fc|fd|fe80|ff|2001:db8)/i.test(ip);
  return false;
}

function looksLikeLookalike(host: string) {
  const labels = host.split(".");
  return host.includes("xn--") || /(paypa1|g00gle|faceb00k|micros0ft|app1e)/i.test(host) || labels.length > 5 || /(?:login|verify|wallet|secure).*[.-].*(?:com|net|org)$/i.test(host) && labels.length > 3;
}

export async function checkDestination(input: string, options: { external?: boolean } = {}): Promise<SafetyResult> {
  const reasons: string[] = []; let level: SafetyLevel = "safe"; let normalized = "";
  try { normalized = normalizeHttpUrl(input); } catch (error) {
    return { level: "blocked", normalized: "", reasons: [error instanceof Error ? error.message : "Invalid destination URL"], checkedAt: new Date().toISOString() };
  }
  const url = new URL(normalized); const host = url.hostname.toLowerCase();
  const caution = (reason: string) => { reasons.push(reason); if (level === "safe") level = "caution"; };
  const block = (reason: string) => { reasons.push(reason); level = "blocked"; };
  if (url.username || url.password) block("Credentials embedded in a destination URL are not allowed.");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host === "metadata.google.internal") block("Local or internal hostnames are blocked to prevent internal-network probing.");
  if (isPrivateIp(host)) block("Private, loopback, link-local, multicast, and reserved internal IP ranges are blocked.");
  if (STATIC_BLOCKLIST.some((pattern) => pattern.test(host))) block("This host appears on the local abuse blocklist.");
  try {
    const rows = await db.select().from(blocklist);
    for (const row of rows) {
      try { if (row.pattern.startsWith("/") ? new RegExp(row.pattern.slice(1, row.pattern.lastIndexOf("/")), row.pattern.slice(row.pattern.lastIndexOf("/") + 1)).test(host) : host === row.pattern || host.endsWith(`.${row.pattern}`)) block(`Blocklist match: ${row.reason}`); } catch { /* invalid admin regex cannot break redirects */ }
    }
  } catch { /* safety heuristics still work if the database is unavailable */ }
  if (url.protocol === "http:") caution("Destination is not encrypted with HTTPS.");
  if (isIP(host)) caution("The destination uses a raw IP address instead of a recognizable domain.");
  if (SHORTENERS.has(host)) caution("Another URL shortener hides the final destination.");
  if (looksLikeLookalike(host)) caution("The hostname contains a lookalike, punycode, or unusual multi-subdomain pattern.");
  if (/qrforge\.(test|local)$/i.test(host) && /\/q\//.test(url.pathname)) caution("Short-link chaining can hide redirects and create loops.");

  if (options.external && process.env.GOOGLE_SAFE_BROWSING_API_KEY) {
    try {
      const response = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", signal: AbortSignal.timeout(2500),
        body: JSON.stringify({ client: { clientId: "qrforge-independent-demo", clientVersion: "1.0" }, threatInfo: { threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"], platformTypes: ["ANY_PLATFORM"], threatEntryTypes: ["URL"], threatEntries: [{ url: normalized }] } }),
      });
      if (response.ok) { const body = await response.json() as { matches?: unknown[] }; if (body.matches?.length) block("Google Safe Browsing reported this destination."); }
      else caution("External Safe Browsing was unavailable; local checks were used.");
    } catch { reasons.push("External Safe Browsing timed out; local heuristics and blocklist were used."); }
  }
  return { level, normalized, reasons, host, checkedAt: new Date().toISOString() };
}

export function checkReaderUrl(input: string): SafetyResult {
  const reasons: string[] = []; let level: SafetyLevel = "safe"; let normalized = input;
  try {
    normalized = normalizeHttpUrl(input); const url = new URL(normalized); const host = url.hostname.toLowerCase();
    if (url.protocol === "http:") { level = "caution"; reasons.push("Non-HTTPS link: traffic can be read or modified on the network."); }
    if (isIP(host) || isPrivateIp(host)) { level = "caution"; reasons.push("IP-address host: there is no domain identity to inspect."); }
    if (SHORTENERS.has(host)) { level = "caution"; reasons.push("URL shortener: the final destination is hidden behind another redirect."); }
    if (looksLikeLookalike(host)) { level = "caution"; reasons.push("Lookalike domain pattern: inspect every letter before continuing."); }
    if (STATIC_BLOCKLIST.some((p) => p.test(host))) { level = "blocked"; reasons.push("This host is on QRForge's local demonstration blocklist."); }
    if (!reasons.length) reasons.push("No local heuristic matched. This is not a guarantee that the site is safe.");
  } catch { level = "blocked"; reasons.push("Only HTTP and HTTPS links are supported for safety inspection."); normalized = ""; }
  return { level, normalized, reasons, checkedAt: new Date().toISOString() };
}
