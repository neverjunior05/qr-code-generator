import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, qrCodes } from "@/db/schema";
import { authenticateApiKey } from "@/lib/apiKeys";
import { checkDestination } from "@/lib/urlSafety";
const clean = (code: typeof qrCodes.$inferSelect) => { const { passwordHash: _, ...safe } = code; return { ...safe, hasPassword: Boolean(code.passwordHash) }; };
async function context(request: Request, id: string, scope: string) { const key = await authenticateApiKey(request, scope); if (!key) return {}; const [code] = await db.select().from(qrCodes).where(and(eq(qrCodes.id, id), eq(qrCodes.userId, key.userId), eq(qrCodes.dynamic, true))); return { key, code }; }
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { const { code } = await context(request, (await params).id, "codes:read"); return code ? NextResponse.json({ data: clean(code) }) : NextResponse.json({ error: "Code not found or invalid API key." }, { status: 404 }); }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id; const { key, code } = await context(request, id, "codes:write"); if (!code || !key) return NextResponse.json({ error: "Code not found or invalid API key." }, { status: 404 });
  const parsed = z.object({ name: z.string().trim().min(1).max(100).optional(), destination: z.string().max(2048).optional(), status: z.enum(["active", "paused", "archived"]).optional(), expiresAt: z.string().datetime().nullable().optional(), scanLimit: z.number().int().positive().nullable().optional() }).safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const input = parsed.data; const values: Partial<typeof qrCodes.$inferInsert> = { updatedAt: new Date(), name: input.name, status: input.status, expiresAt: input.expiresAt === undefined ? undefined : input.expiresAt ? new Date(input.expiresAt) : null, scanLimit: input.scanLimit };
  if (input.destination) { const safety = await checkDestination(input.destination, { external: true }); if (safety.level === "blocked") return NextResponse.json({ error: "Destination blocked", reasons: safety.reasons }, { status: 400 }); if (safety.normalized.includes(`/q/${code.slug}`)) return NextResponse.json({ error: "Self-referencing redirect blocked" }, { status: 400 }); values.destination = safety.normalized; values.flagged = safety.level === "caution"; values.flagReason = safety.reasons.join(" ") || null; }
  const [updated] = await db.update(qrCodes).set(values).where(eq(qrCodes.id, id)).returning(); await db.insert(auditLogs).values({ userId: key.userId, action: "api.code.updated", target: id, meta: { keyPrefix: key.prefix } }); return NextResponse.json({ data: clean(updated) });
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) { const id = (await params).id; const { key, code } = await context(request, id, "codes:write"); if (!code || !key) return NextResponse.json({ error: "Code not found or invalid API key." }, { status: 404 }); await db.update(qrCodes).set({ status: "trashed", trashedAt: new Date() }).where(eq(qrCodes.id, id)); await db.insert(auditLogs).values({ userId: key.userId, action: "api.code.trashed", target: id, meta: {} }); return NextResponse.json({ data: { id, status: "trashed", restoreDays: 30 } }); }
