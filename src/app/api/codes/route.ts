import { NextResponse } from "next/server";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, qrCodes } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { encodeContent } from "@/lib/qr/encoders";
import { PLANS } from "@/config/plans";
import { uniqueSlug } from "@/lib/slug";
import { checkDestination } from "@/lib/urlSafety";
import { parseContent, saveCodeSchema } from "@/lib/validations";
import { rateLimit, requestKey } from "@/lib/rateLimit";
import { toClientCode } from "@/lib/serializers";

export async function GET() {
  await ensureSeed(); const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const codes = await db.select().from(qrCodes).where(eq(qrCodes.userId, user.id)).orderBy(qrCodes.updatedAt);
  return NextResponse.json({ codes: codes.reverse().map(toClientCode) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!rateLimit(requestKey(request, `create:${user.id}`), 30, 60_000).allowed) return NextResponse.json({ error: "Creation rate limit reached. Try again in a minute." }, { status: 429 });
  const parsed = saveCodeSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid code or design data.", issues: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  const input = parsed.data; const content = parseContent(input.content); const dynamic = content.type === "multilink" ? true : input.dynamic;
  const encoded = encodeContent(content); if (encoded.errors.length) return NextResponse.json({ error: encoded.errors.join(" ") }, { status: 400 });
  if (dynamic) {
    const [{ value }] = await db.select({ value: count() }).from(qrCodes).where(and(eq(qrCodes.userId, user.id), eq(qrCodes.dynamic, true), ne(qrCodes.status, "trashed")));
    if (value >= PLANS[user.plan].dynamicCodes) return NextResponse.json({ error: `Your ${user.plan} plan allows ${PLANS[user.plan].dynamicCodes} dynamic codes. Pause or remove one, or export this as static.` }, { status: 403 });
  }
  let destination: string | null = null; let flagged = false; let flagReason: string | null = null;
  if (dynamic && ["url", "appstore"].includes(content.type)) {
    const safety = await checkDestination(content.type === "appstore" ? content.values.iosUrl : content.values.url, { external: true });
    if (safety.level === "blocked") return NextResponse.json({ error: `Destination blocked: ${safety.reasons.join(" ")}` }, { status: 400 });
    destination = safety.normalized; flagged = safety.level === "caution"; flagReason = flagged ? safety.reasons.join(" ") : null;
  }
  const slug = dynamic ? await uniqueSlug(input.customSlug) : null;
  const origin = new URL(request.url).origin;
  const finalEncoded = dynamic ? `${origin}/q/${slug}` : encoded.text;
  const [code] = await db.insert(qrCodes).values({ userId: user.id, folderId: input.folderId, name: input.name, type: content.type, content, design: input.design, encoded: finalEncoded, dynamic, slug, destination, passwordHash: input.password ? await hashPassword(input.password) : null, tags: input.tags || [], flagged, flagReason }).returning();
  await db.insert(auditLogs).values({ userId: user.id, action: "code.created", target: code.id, meta: { dynamic, type: content.type } });
  return NextResponse.json({ code: toClientCode(code) }, { status: 201 });
}
