import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "qf_session";
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function hashPassword(password: string) { return bcrypt.hash(password, 10); }
export async function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash); }

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url"); const expiresAt = new Date(Date.now() + 30 * 86400_000);
  await db.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt });
}

export async function destroySession() {
  const jar = await cookies(); const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  jar.set(SESSION_COOKIE, "", { httpOnly: true, expires: new Date(0), path: "/" });
}

export async function getCurrentUser() {
  const jar = await cookies(); const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db.select({ user: users }).from(sessions).innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date()))).limit(1);
  return rows[0]?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function userClient(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan, verified: user.verified, brandKit: user.brandKit, settings: user.settings, deleteAt: user.deleteAt };
}
