import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
import { applyDueSchedules, routeDestination } from "@/lib/redirect";
import { recordScan } from "@/lib/analytics";
import { rateLimit, requestKey } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
const unlockSignature = (id: string, passwordHash: string) => createHmac("sha256", process.env.AUTH_SECRET || "qrforge-demo-secret").update(`unlock:${id}:${passwordHash}`).digest("hex");

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const slug = (await params).code; const url = new URL(request.url); const warning = (state: string) => NextResponse.redirect(new URL(`/q/${encodeURIComponent(slug)}/warning?state=${state}`, url.origin), 307);
  const limited = rateLimit(requestKey(request, "redirect"), 180, 60_000); if (!limited.allowed) return warning("rate-limit");
  let [code] = await db.select().from(qrCodes).where(eq(qrCodes.slug, slug)).limit(1);
  if (!code || !code.dynamic || code.status === "trashed") return warning("removed");
  if (code.status === "paused" || code.status === "archived") return warning("paused");
  if (code.expiresAt && code.expiresAt < new Date()) return warning("expired");
  if (code.scanLimit && code.scanCount >= code.scanLimit) return warning("limit");
  if (code.passwordHash) {
    const supplied = request.headers.get("cookie")?.match(new RegExp(`qf_unlock_${code.id}=([^;]+)`))?.[1] || "";
    const expected = unlockSignature(code.id, code.passwordHash);
    if (!supplied || supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return warning("password");
  }
  code = await applyDueSchedules(code);
  if (!["url", "appstore"].includes(code.type)) {
    await recordScan(request, code); return NextResponse.redirect(new URL(`/p/${code.slug}`, url.origin), 307);
  }
  const routed = await routeDestination(code, request);
  if (!routed.destination || !routed.safety) return warning("removed");
  if (routed.destination.includes(`/q/${code.slug}`)) return warning("loop");
  if (routed.safety.level === "blocked") { await db.update(qrCodes).set({ flagged: true, flagReason: routed.safety.reasons.join(" ") }).where(eq(qrCodes.id, code.id)); return warning("blocked"); }
  if ((routed.safety.level === "caution" || code.flagged) && url.searchParams.get("confirm") !== "1") return warning("flagged");
  await recordScan(request, code);
  return NextResponse.redirect(routed.destination, { status: 307, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex", "Referrer-Policy": "no-referrer" } });
}
