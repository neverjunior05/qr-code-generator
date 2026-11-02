import { NextResponse } from "next/server";
import { and, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, qrCodes, users } from "@/db/schema";
import { authenticateApiKey } from "@/lib/apiKeys";
import { defaultContent, defaultDesign } from "@/lib/qr/types";
import { uniqueSlug } from "@/lib/slug";
import { checkDestination } from "@/lib/urlSafety";
import { PLANS } from "@/config/plans";
import { rateLimit } from "@/lib/rateLimit";

const createSchema = z.object({ name: z.string().trim().min(1).max(100), destination: z.string().max(2048), slug: z.string().max(31).optional(), expiresAt: z.string().datetime().nullable().optional(), scanLimit: z.number().int().positive().max(10000000).nullable().optional() });
const clean = (code: typeof qrCodes.$inferSelect) => { const { passwordHash: _, ...safe } = code; return { ...safe, hasPassword: Boolean(code.passwordHash) }; };
export async function GET(request: Request) {
  const key = await authenticateApiKey(request, "codes:read"); if (!key) return NextResponse.json({ error: "Provide a valid API key with codes:read scope." }, { status: 401 });
  if (!rateLimit(`api:${key.id}`, 120).allowed) return NextResponse.json({ error: "API rate limit exceeded" }, { status: 429 });
  const codes = await db.select().from(qrCodes).where(and(eq(qrCodes.userId, key.userId), eq(qrCodes.dynamic, true))); return NextResponse.json({ data: codes.map(clean) });
}
export async function POST(request: Request) {
  const key = await authenticateApiKey(request, "codes:write"); if (!key) return NextResponse.json({ error: "Provide a valid API key with codes:write scope." }, { status: 401 });
  if (!rateLimit(`api:${key.id}`, 120).allowed) return NextResponse.json({ error: "API rate limit exceeded" }, { status: 429 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid code input", issues: parsed.error.issues }, { status: 400 });
  const safety = await checkDestination(parsed.data.destination, { external: true }); if (safety.level === "blocked") return NextResponse.json({ error: "Destination blocked", reasons: safety.reasons }, { status: 400 });
  const [user] = await db.select().from(users).where(eq(users.id, key.userId)); if (!user) return NextResponse.json({ error: "Key owner unavailable" }, { status: 401 });
  const [{ value }] = await db.select({ value: count() }).from(qrCodes).where(and(eq(qrCodes.userId, user.id), eq(qrCodes.dynamic, true), ne(qrCodes.status, "trashed"))); if (value >= PLANS[user.plan].dynamicCodes) return NextResponse.json({ error: "Dynamic code plan limit reached" }, { status: 403 });
  const slug = await uniqueSlug(parsed.data.slug); const content = { ...defaultContent, values: { ...defaultContent.values, url: safety.normalized } }; const origin = new URL(request.url).origin;
  const [code] = await db.insert(qrCodes).values({ userId: user.id, name: parsed.data.name, type: "url", content, design: { ...defaultDesign }, encoded: `${origin}/q/${slug}`, dynamic: true, slug, destination: safety.normalized, flagged: safety.level === "caution", flagReason: safety.reasons.join(" ") || null, expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null, scanLimit: parsed.data.scanLimit }).returning();
  await db.insert(auditLogs).values({ userId: user.id, action: "api.code.created", target: code.id, meta: { keyPrefix: key.prefix } }); return NextResponse.json({ data: clean(code) }, { status: 201 });
}
