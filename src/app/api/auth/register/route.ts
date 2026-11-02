import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword, userClient } from "@/lib/auth";
import { emailSchema, passwordSchema } from "@/lib/validations";
import { rateLimit, requestKey } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (!rateLimit(requestKey(request, "register"), 5, 60_000).allowed) return NextResponse.json({ error: "Too many accounts created from this connection." }, { status: 429 });
  const parsed = z.object({ name: z.string().trim().min(2).max(80), email: emailSchema, password: passwordSchema }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Use a name, valid email, and password of at least 8 characters." }, { status: 400 });
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email));
  if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  const [user] = await db.insert(users).values({ name: parsed.data.name, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password), verified: false, avatar: `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(parsed.data.name)}` }).returning();
  const expires = Date.now() + 86400_000; const token = createHmac("sha256", process.env.AUTH_SECRET || "qrforge-demo-secret").update(`verify:${user.id}:${expires}`).digest("hex");
  console.info(`[QRForge mock email] Verify ${user.email}: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/verify?uid=${user.id}&expires=${expires}&token=${token}`);
  await createSession(user.id); return NextResponse.json({ user: userClient(user), message: "Account created. A mock verification link was logged to the server console." });
}
