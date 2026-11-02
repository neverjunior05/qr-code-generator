import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { emailSchema, passwordSchema } from "@/lib/validations";

const tokenFor = (uid: string, expires: number) => createHmac("sha256", process.env.AUTH_SECRET || "qrforge-demo-secret").update(`reset:${uid}:${expires}`).digest("hex");
export async function POST(request: Request) {
  const parsed = z.object({ email: emailSchema }).safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email));
  if (user) { const expires = Date.now() + 3600_000; console.info(`[QRForge mock email] Reset password: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login?reset=1&uid=${user.id}&expires=${expires}&token=${tokenFor(user.id, expires)}`); }
  return NextResponse.json({ message: "If that account exists, a mock reset link has been logged to the server console." });
}
export async function PUT(request: Request) {
  const parsed = z.object({ uid: z.string().uuid(), expires: z.number(), token: z.string(), password: passwordSchema }).safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid reset request." }, { status: 400 });
  const { uid, expires, token, password } = parsed.data; const expected = tokenFor(uid, expires);
  if (expires < Date.now() || token.length !== expected.length || !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 });
  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, uid)); return NextResponse.json({ ok: true });
}
