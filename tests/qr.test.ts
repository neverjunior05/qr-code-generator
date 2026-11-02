import { describe, expect, it } from "vitest";
import { defaultContent, defaultDesign } from "@/lib/qr/types";
import { encodeContent, foldLine, normalizeHttpUrl } from "@/lib/qr/encoders";
import { scoreScannability } from "@/lib/qr/scannability";
import { inspectReaderDestination } from "@/lib/qr/readerSafety";
import { classifyRequest } from "@/lib/botFilter";
import { rateLimit } from "@/lib/rateLimit";

const content = (type: typeof defaultContent.type, patch: Record<string, unknown>) => ({ type, values: { ...structuredClone(defaultContent.values), ...patch } });

describe("payload encoders", () => {
  it("escapes Wi-Fi delimiters and hidden-network flags", () => {
    const result = encodeContent(content("wifi", { ssid: "Paper;Lab:5G", password: "p\\ass,word\"", hidden: true }));
    expect(result.errors).toEqual([]);
    expect(result.text).toBe('WIFI:T:WPA;S:Paper\\;Lab\\:5G;P:p\\\\ass\\,word\\";H:true;;');
  });
  it("normalizes URLs and rejects dangerous schemes", () => {
    expect(normalizeHttpUrl("example.com/menu")).toBe("https://example.com/menu");
    expect(() => normalizeHttpUrl("javascript:alert(1)")).toThrow(/Only http/);
    expect(() => normalizeHttpUrl("file:///etc/passwd")).toThrow(/Only http/);
  });
  it("folds UTF-8 vCard/iCalendar lines without splitting characters", () => {
    const folded = foldLine(`DESCRIPTION:${" café🙂".repeat(30)}`);
    for (const line of folded.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(folded).toContain("\r\n ");
  });
  it("creates escaped vCard 3.0 and UTC VEVENT payloads", () => {
    const card = encodeContent(content("vcard", { firstName: "Avery", lastName: "Stone", company: "Paper; Pine", email: "avery@example.com" }));
    expect(card.text).toContain("VERSION:3.0");
    expect(card.text).toContain("ORG:Paper\\; Pine");
    expect(card.text).toMatch(/\r\nEND:VCARD\r\n$/);
    const event = encodeContent(content("event", { subject: "Print; Night", start: "2026-08-14T18:00", end: "2026-08-14T20:00" }));
    expect(event.errors).toEqual([]);
    expect(event.text).toContain("BEGIN:VEVENT");
    expect(event.text).toContain("SUMMARY:Print\\; Night");
    expect(event.text).toMatch(/DTSTART:\d{8}T\d{6}Z/);
  });
  it("validates geo ranges and URI-encodes SMS/email components", () => {
    expect(encodeContent(content("geo", { latitude: "91", longitude: "0" })).errors.length).toBeGreaterThan(0);
    expect(encodeContent(content("geo", { latitude: "45.5", longitude: "-122.6" })).text).toBe("geo:45.500000,-122.600000");
    expect(encodeContent(content("sms", { number: "+12025550147", message: "hello & goodbye" })).text).toBe("sms:+12025550147?body=hello%20%26%20goodbye");
    expect(encodeContent(content("email", { to: "hello@example.com", subject: "Paper & ink", body: "Line 1\nLine 2" })).text).toContain("subject=Paper%20%26%20ink");
  });
});

describe("scannability and reader safety", () => {
  it("penalizes low contrast, tiny quiet zones, and excessive logos", () => {
    const good = scoreScannability(defaultDesign, 40, 25);
    const bad = scoreScannability({ ...defaultDesign, foreground: "#EEEEEE", background: "#FFFFFF", margin: 0, logo: "data:image/png;base64,AAAA", logoSize: 30, errorCorrection: "L" }, 900, 77);
    expect(good.score).toBeGreaterThan(85);
    expect(bad.score).toBeLessThan(35);
    expect(bad.issues.map((issue) => issue.id)).toEqual(expect.arrayContaining(["contrast", "quiet", "logo", "density"]));
  });
  it("flags shorteners, lookalikes, IP hosts, and non-HTTPS destinations", () => {
    expect(inspectReaderDestination("http://192.0.2.4/login").level).toBe("caution");
    expect(inspectReaderDestination("https://bit.ly/example").level).toBe("caution");
    expect(inspectReaderDestination("https://paypa1.example.com").level).toBe("caution");
    expect(inspectReaderDestination("http://127.0.0.1/admin").level).toBe("blocked");
    expect(inspectReaderDestination("javascript:alert(1)").level).toBe("blocked");
  });
});

describe("abuse controls", () => {
  it("blocks literal SSRF private ranges", async () => {
    process.env.DATABASE_URL ||= "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
    const { isPrivateIp } = await import("@/lib/urlSafety");
    for (const ip of ["127.0.0.1", "10.0.0.4", "172.16.4.2", "192.168.1.4", "169.254.1.2", "::1", "fd00::1"]) expect(isPrivateIp(ip)).toBe(true);
    expect(isPrivateIp("192.0.2.1")).toBe(true); // Documentation ranges are blocked too: they are never valid public destinations.
    for (const ip of ["8.8.8.8", "203.0.113.4"]) expect(isPrivateIp(ip)).toBe(false);
  });
  it("filters bots and honors rate windows", () => {
    expect(classifyRequest(new Headers({ "user-agent": "Slackbot-LinkExpanding 1.0" })).counted).toBe(false);
    expect(classifyRequest(new Headers({ "user-agent": "Mozilla/5.0 Chrome/120.0", purpose: "prefetch" })).counted).toBe(false);
    expect(classifyRequest(new Headers({ "user-agent": "Mozilla/5.0 Chrome/120.0" })).counted).toBe(true);
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, 2, 1000).allowed).toBe(true);
    expect(rateLimit(key, 2, 1000).allowed).toBe(true);
    expect(rateLimit(key, 2, 1000).allowed).toBe(false);
  });
});
