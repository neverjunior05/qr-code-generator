import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { createSession, userClient, verifyPassword } from "@/lib/auth";
import { emailSchema, passwordSchema } from "@/lib/validations";
import { rateLimit, requestKey } from "@/lib/rateLimit";

export async function POST(request: Request) {
  await ensureSeed();
  if (!rateLimit(requestKey(request, "login"), 12, 60_000).allowed) return NextResponse.json({ error: "Too many sign-in attempts. Wait a minute." }, { status: 429 });
  const parsed = z.object({ email: emailSchema, password: passwordSchema }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and a password of at least 8 characters." }, { status: 400 });
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (!user || user.deleteAt || !(await verifyPassword(parsed.data.password, user.passwordHash))) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  await createSession(user.id); return NextResponse.json({ user: userClient(user) });
}
