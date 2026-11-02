const BOT_PATTERN = /bot|crawler|spider|preview|fetcher|slackbot|discordbot|whatsapp|facebookexternalhit|twitterbot|linkedinbot|headless|lighthouse|pingdom|uptime|curl|wget|python-requests/i;
const PREFETCH_PATTERN = /prefetch|prerender|preview/i;

export function classifyRequest(headers: Headers) {
  const ua = headers.get("user-agent") || "";
  const purpose = `${headers.get("purpose") || ""} ${headers.get("sec-purpose") || ""} ${headers.get("x-purpose") || ""}`;
  if (BOT_PATTERN.test(ua)) return { counted: false, reason: "Known crawler or link-preview client" };
  if (PREFETCH_PATTERN.test(purpose) || headers.get("sec-fetch-mode") === "navigate" && headers.get("sec-fetch-dest") === "empty") return { counted: false, reason: "Prefetch or preview request" };
  if (!ua) return { counted: false, reason: "Missing browser user agent" };
  return { counted: true, reason: "Regular browser navigation" };
}

export function parseUserAgent(ua: string) {
  const device = /ipad|tablet/i.test(ua) ? "Tablet" : /mobile|iphone|android/i.test(ua) ? "Mobile" : "Desktop";
  const os = /windows/i.test(ua) ? "Windows" : /android/i.test(ua) ? "Android" : /iphone|ipad|ios/i.test(ua) ? "iOS" : /mac os|macintosh/i.test(ua) ? "macOS" : /linux/i.test(ua) ? "Linux" : "Other";
  const browser = /edg\//i.test(ua) ? "Edge" : /chrome|crios/i.test(ua) ? "Chrome" : /firefox|fxios/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Other";
  return { device, os, browser };
}
