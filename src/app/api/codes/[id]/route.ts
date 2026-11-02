import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, qrCodes } from "@/db/schema";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { encodeContent } from "@/lib/qr/encoders";
import { checkDestination } from "@/lib/urlSafety";
import { parseContent, updateCodeSchema } from "@/lib/validations";
import { toClientCode } from "@/lib/serializers";

async function owned(id: string, userId: string) { const [code] = await db.select().from(qrCodes).where(and(eq(qrCodes.id, id), eq(qrCodes.userId, userId))).limit(1); return code; }
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const code = await owned((await params).id, user.id); return code ? NextResponse.json({ code: toClientCode(code) }) : NextResponse.json({ error: "Code not found." }, { status: 404 });
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const id = (await params).id; const code = await owned(id, user.id); if (!code) return NextResponse.json({ error: "Code not found." }, { status: 404 });
  const parsed = updateCodeSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid update.", issues: parsed.error.issues }, { status: 400 });
  const input = parsed.data; const values: Partial<typeof qrCodes.$inferInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) values.name = input.name; if (input.status !== undefined) { values.status = input.status; values.trashedAt = input.status === "trashed" ? new Date() : null; }
  if (input.expiresAt !== undefined) values.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  if (input.scanLimit !== undefined) values.scanLimit = input.scanLimit; if (input.folderId !== undefined) values.folderId = input.folderId; if (input.tags !== undefined) values.tags = input.tags;
  if (input.password !== undefined) values.passwordHash = input.password ? await hashPassword(input.password) : null;
  if (input.design) values.design = input.design;
  if (input.content) { const content = parseContent(input.content); const encoded = encodeContent(content); if (encoded.errors.length) return NextResponse.json({ error: encoded.errors.join(" ") }, { status: 400 }); values.content = content; values.type = content.type; if (!code.dynamic) values.encoded = encoded.text; }
  if (input.schedules) { for (const schedule of input.schedules) { const safe = await checkDestination(schedule.destination); if (safe.level === "blocked") return NextResponse.json({ error: `Scheduled destination blocked: ${safe.reasons.join(" ")}` }, { status: 400 }); } values.schedules = input.schedules; }
  if (input.routing) values.routing = input.routing as typeof code.routing;
  let destinationChanged = false;
  if (input.destination !== undefined) {
    if (!code.dynamic) return NextResponse.json({ error: "Static codes have no editable destination." }, { status: 400 });
    if (input.destination) {
      const safety = await checkDestination(input.destination, { external: true }); if (safety.level === "blocked") return NextResponse.json({ error: `Destination blocked: ${safety.reasons.join(" ")}` }, { status: 400 });
      if (code.slug && safety.normalized.includes(`/q/${code.slug}`)) return NextResponse.json({ error: "A short link cannot redirect to itself." }, { status: 400 });
      destinationChanged = safety.normalized !== code.destination; values.destination = safety.normalized; values.flagged = safety.level === "caution"; values.flagReason = safety.reasons.join(" ") || null;
    } else { values.destination = null; values.flagged = false; values.flagReason = null; }
  }
  const [updated] = await db.update(qrCodes).set(values).where(eq(qrCodes.id, id)).returning();
  await db.insert(auditLogs).values({ userId: user.id, action: destinationChanged ? "destination.changed" : "code.updated", target: id, meta: { fields: Object.keys(input), flagged: updated.flagged } });
  return NextResponse.json({ code: toClientCode(updated) });
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const id = (await params).id; const code = await owned(id, user.id); if (!code) return NextResponse.json({ error: "Code not found." }, { status: 404 });
  await db.update(qrCodes).set({ status: "trashed", trashedAt: new Date(), updatedAt: new Date() }).where(eq(qrCodes.id, id));
  await db.insert(auditLogs).values({ userId: user.id, action: "code.trashed", target: id, meta: { restoreBefore: new Date(Date.now() + 30 * 86400_000) } });
  return NextResponse.json({ ok: true, restoreDays: 30 });
}
