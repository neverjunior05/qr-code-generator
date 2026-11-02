import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, qrCodes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slug";
import { toClientCode } from "@/lib/serializers";

const schema = z.object({ ids: z.array(z.string().uuid()).min(1).max(200), action: z.enum(["pause", "activate", "trash", "restore", "move", "duplicate"]), folderId: z.string().uuid().nullable().optional() });
export async function POST(request: Request) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Select between 1 and 200 codes and a valid action." }, { status: 400 });
  const { ids, action, folderId } = parsed.data; const owned = await db.select().from(qrCodes).where(and(eq(qrCodes.userId, user.id), inArray(qrCodes.id, ids)));
  if (!owned.length) return NextResponse.json({ error: "No owned codes found." }, { status: 404 });
  const ownedIds = owned.map((c) => c.id);
  if (action === "duplicate") {
    const copies = [];
    for (const code of owned.slice(0, 50)) { const slug = code.dynamic ? await uniqueSlug() : null; copies.push({ ...code, id: undefined, name: `${code.name} — copy`, slug, encoded: code.dynamic && code.slug ? code.encoded.replace(`/q/${code.slug}`, `/q/${slug}`) : code.encoded, status: "active" as const, scanCount: 0, createdAt: undefined, updatedAt: undefined, trashedAt: null }); }
    const inserted = await db.insert(qrCodes).values(copies).returning(); return NextResponse.json({ codes: inserted.map(toClientCode) });
  }
  const values: Partial<typeof qrCodes.$inferInsert> = { updatedAt: new Date() };
  if (action === "pause") values.status = "paused"; if (action === "activate") values.status = "active";
  if (action === "trash") { values.status = "trashed"; values.trashedAt = new Date(); }
  if (action === "restore") { values.status = "active"; values.trashedAt = null; }
  if (action === "move") values.folderId = folderId ?? null;
  await db.update(qrCodes).set(values).where(and(eq(qrCodes.userId, user.id), inArray(qrCodes.id, ownedIds)));
  await db.insert(auditLogs).values({ userId: user.id, action: `code.bulk.${action}`, target: ownedIds.join(","), meta: { count: ownedIds.length } });
  return NextResponse.json({ ok: true, count: ownedIds.length });
}
