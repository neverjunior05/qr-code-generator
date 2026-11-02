import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function GET(request: Request) {
  const url = new URL(request.url); const uid = url.searchParams.get("uid") || ""; const expires = Number(url.searchParams.get("expires")); const token = url.searchParams.get("token") || "";
  const expected = createHmac("sha256", process.env.AUTH_SECRET || "qrforge-demo-secret").update(`verify:${uid}:${expires}`).digest("hex");
  const valid = token.length === expected.length && timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  if (!valid || expires < Date.now()) return NextResponse.json({ error: "Verification link is invalid or expired." }, { status: 400 });
  await db.update(users).set({ verified: true }).where(eq(users.id, uid));
  return NextResponse.redirect(new URL("/settings?verified=1", url.origin));
}
