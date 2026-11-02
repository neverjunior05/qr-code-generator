export type ReaderSafety = { level: "safe" | "caution" | "blocked"; reasons: string[]; url: string | null };
const shorteners = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "cutt.ly", "rebrand.ly"];
export function inspectReaderDestination(input: string): ReaderSafety {
  const reasons: string[] = []; let level: ReaderSafety["level"] = "safe"; let url: URL;
  try { url = new URL(/^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`); } catch { return { level: "blocked", reasons: ["This is not a valid URL."], url: null }; }
  if (!["http:", "https:"].includes(url.protocol)) return { level: "blocked", reasons: [`The ${url.protocol} scheme is not opened by QRForge. Only HTTP(S) destinations receive a link.`], url: null };
  const host = url.hostname.toLowerCase(); const caution = (reason: string) => { level = level === "blocked" ? level : "caution"; reasons.push(reason); };
  if (url.protocol === "http:") caution("Non-HTTPS link: network traffic can be observed or modified.");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) caution("IP-address host: there is no domain name to inspect for identity.");
  if (/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.)/.test(host) || host === "::1") { level = "blocked"; reasons.push("Local or private-network destination: do not probe internal services from an unknown code."); }
  if (shorteners.includes(host)) caution("URL shortener: the final destination is hidden behind another redirect.");
  if (host.includes("xn--") || /paypa1|g00gle|faceb00k|micros0ft|app1e/i.test(host) || host.split(".").length > 5) caution("Lookalike or unusual hostname: inspect every letter and subdomain carefully.");
  if (["phishing-example.test", "malware.test", "blocked.example"].includes(host)) { level = "blocked"; reasons.push("This host is on QRForge's local demonstration blocklist."); }
  if (!reasons.length) reasons.push("No local heuristic matched. This is not a guarantee of safety; check the domain and context yourself.");
  return { level, reasons, url: url.toString() };
}
