import { EventEmitter } from "node:events";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { qrCodes, scanEvents, users } from "@/db/schema";
import { classifyRequest, parseUserAgent } from "./botFilter";
import { dailyVisitorHash, lookupRegion } from "./geo";

const globalEvents = globalThis as typeof globalThis & { __qrForgeScans?: EventEmitter };
export const scanBus = globalEvents.__qrForgeScans ?? new EventEmitter();
globalEvents.__qrForgeScans = scanBus; scanBus.setMaxListeners(100);

export async function recordScan(request: Request, code: typeof qrCodes.$inferSelect, forcedDemo = false) {
  const [owner] = await db.select({ settings: users.settings }).from(users).where(eq(users.id, code.userId));
  if (owner?.settings?.analyticsEnabled === false) return { counted: false, reason: "Owner disabled scan analytics" };
  const headers = request.headers; const classification = forcedDemo ? { counted: true, reason: "Fictional demo simulation" } : classifyRequest(headers);
  if (!classification.counted || headers.get("dnt") === "1" || headers.get("sec-gpc") === "1") return { counted: false, reason: headers.get("dnt") === "1" ? "Do Not Track honored" : classification.reason };
  const ua = forcedDemo ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1" : headers.get("user-agent") || "";
  const ip = forcedDemo ? `demo-${Math.random()}` : headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const now = new Date(); const day = now.toISOString().slice(0, 10); const agent = parseUserAgent(ua); const region = lookupRegion(ip);
  let referrer = "Direct / print"; const rawReferrer = headers.get("referer");
  if (rawReferrer) { try { referrer = new URL(rawReferrer).origin; } catch { /* invalid referrer becomes direct */ } }
  const visitorHash = dailyVisitorHash(ip, ua, day); // Raw IP and full user agent go out of scope here.
  const [event] = await db.insert(scanEvents).values({ codeId: code.id, scannedAt: now, day, visitorHash, device: agent.device, os: agent.os, browser: agent.browser, country: region.country, city: region.city, referrer, hour: now.getHours() }).returning();
  await db.update(qrCodes).set({ scanCount: sql`${qrCodes.scanCount} + 1` }).where(eq(qrCodes.id, code.id));
  scanBus.emit("scan", { codeId: code.id, event: { ...event, visitorHash: undefined } });
  return { counted: true, reason: classification.reason };
}

function grouped(events: (typeof scanEvents.$inferSelect)[], key: "device" | "os" | "browser" | "country" | "city" | "referrer") {
  const counts = new Map<string, number>(); events.forEach((e) => counts.set(e[key], (counts.get(e[key]) || 0) + 1));
  return Array.from(counts, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export async function analyticsFor(codeId: string, days = 30) {
  const since = new Date(); since.setUTCHours(0, 0, 0, 0); since.setUTCDate(since.getUTCDate() - (days - 1));
  const events = await db.select().from(scanEvents).where(and(eq(scanEvents.codeId, codeId), gte(scanEvents.scannedAt, since))).orderBy(desc(scanEvents.scannedAt));
  const uniqueDaily = new Set(events.map((e) => `${e.day}:${e.visitorHash}`)).size;
  const series = Array.from({ length: days }, (_, i) => { const date = new Date(since); date.setUTCDate(since.getUTCDate() + i); const day = date.toISOString().slice(0, 10); const dayEvents = events.filter((e) => e.day === day); return { day: day.slice(5), scans: dayEvents.length, unique: new Set(dayEvents.map((e) => e.visitorHash)).size }; });
  const heatmap = Array.from({ length: 7 }, (_, weekday) => Array.from({ length: 24 }, (_, hour) => ({ weekday, hour, value: events.filter((e) => e.hour === hour && (new Date(e.scannedAt).getUTCDay() + 6) % 7 === weekday).length }))).flat();
  return { total: events.length, uniqueDaily, series, device: grouped(events, "device"), os: grouped(events, "os"), browser: grouped(events, "browser"), country: grouped(events, "country"), city: grouped(events, "city"), referrer: grouped(events, "referrer"), heatmap, recent: events.slice(0, 12).map((e) => ({ id: e.id, at: e.scannedAt, device: e.device, os: e.os, browser: e.browser, country: e.country, city: e.city, referrer: e.referrer })), privacy: { rawIpsStored: false, crossDayTracking: false, uniqueDefinition: "Sum of distinct salted hashes within each UTC day; not cross-day deduplicated people.", botFilter: true } };
}

export function analyticsCsv(events: (typeof scanEvents.$inferSelect)[]) {
  const escape = (value: unknown) => { const text = String(value instanceof Date ? value.toISOString() : value ?? ""); const safe = /^[=+\-@]/.test(text) ? `'${text}` : text; return `"${safe.replace(/"/g, '""')}"`; };
  return ["scanned_at,device,os,browser,country,city,referrer,daily_visitor_hash", ...events.map((e) => [e.scannedAt, e.device, e.os, e.browser, e.country, e.city, e.referrer, e.visitorHash].map(escape).join(","))].join("\n");
}
