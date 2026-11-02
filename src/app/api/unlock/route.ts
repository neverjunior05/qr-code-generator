import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
import { verifyPassword } from "@/lib/auth";
import { rateLimit, requestKey } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (!rateLimit(requestKey(request, "unlock"), 10, 60_000).allowed) return NextResponse.json({ error: "Too many password attempts." }, { status: 429 });
  const parsed = z.object({ slug: z.string().max(40), password: z.string().max(100) }).safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const [code] = await db.select().from(qrCodes).where(eq(qrCodes.slug, parsed.data.slug)); if (!code?.passwordHash || !(await verifyPassword(parsed.data.password, code.passwordHash))) return NextResponse.json({ error: "That password does not match." }, { status: 403 });
  const signature = createHmac("sha256", process.env.AUTH_SECRET || "qrforge-demo-secret").update(`unlock:${code.id}:${code.passwordHash}`).digest("hex"); const jar = await cookies();
  jar.set(`qf_unlock_${code.id}`, signature, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 3600, path: "/" });
  return NextResponse.json({ ok: true });
}
