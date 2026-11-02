import { eq } from "drizzle-orm";
import { db } from "@/db";
import { qrCodes, type RoutingRules } from "@/db/schema";
import { checkDestination } from "./urlSafety";
import { lookupRegion } from "./geo";
import { parseUserAgent } from "./botFilter";

export async function applyDueSchedules(code: typeof qrCodes.$inferSelect) {
  const now = Date.now(); let destination = code.destination; let changed = false;
  const schedules = [...(code.schedules || [])].sort((a, b) => +new Date(a.at) - +new Date(b.at)).map((schedule) => {
    if (!schedule.appliedAt && +new Date(schedule.at) <= now) { destination = schedule.destination; changed = true; return { ...schedule, appliedAt: new Date().toISOString() }; }
    return schedule;
  });
  if (changed) { const [updated] = await db.update(qrCodes).set({ destination, schedules, updatedAt: new Date() }).where(eq(qrCodes.id, code.id)).returning(); return updated; }
  return code;
}

export async function routeDestination(code: typeof qrCodes.$inferSelect, request: Request) {
  const routing = (code.routing || {}) as RoutingRules; const ua = request.headers.get("user-agent") || ""; const agent = parseUserAgent(ua);
  let destination = code.destination;
  if (agent.os === "iOS" && routing.ios) destination = routing.ios; else if (agent.os === "Android" && routing.android) destination = routing.android; else if (agent.device === "Desktop" && routing.desktop) destination = routing.desktop;
  const minutes = new Date().getHours() * 60 + new Date().getMinutes();
  for (const rule of routing.time || []) { const [fh, fm] = rule.from.split(":").map(Number); const [th, tm] = rule.to.split(":").map(Number); const from = fh * 60 + fm; const to = th * 60 + tm; if (from <= to ? minutes >= from && minutes <= to : minutes >= from || minutes <= to) destination = rule.destination; }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local"; const country = lookupRegion(ip).country;
  const regionRule = routing.regions?.find((r) => r.country.toLowerCase() === country.toLowerCase()); if (regionRule) destination = regionRule.destination;
  if (routing.ab?.length) { const roll = Math.random() * 100; let cumulative = 0; for (const variant of routing.ab) { cumulative += Math.max(0, Math.min(100, variant.weight)); if (roll <= cumulative) { destination = variant.destination; break; } } }
  if (!destination) return { destination: null, safety: null };
  const safety = await checkDestination(destination); return { destination: safety.normalized, safety };
}
