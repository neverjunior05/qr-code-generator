import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url); const jar = await cookies(); const state = jar.get("qf_google_state")?.value;
  if (!state || state !== url.searchParams.get("state") || !url.searchParams.get("code")) return NextResponse.redirect(`${url.origin}/login?google=state`);
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code: url.searchParams.get("code")!, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: `${url.origin}/api/auth/google/callback`, grant_type: "authorization_code" }) });
    if (!tokenResponse.ok) throw new Error("Token exchange failed"); const tokens = await tokenResponse.json() as { access_token: string };
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } }); if (!profileResponse.ok) throw new Error("Profile request failed");
    const profile = await profileResponse.json() as { email: string; name?: string; picture?: string; email_verified?: boolean };
    let [user] = await db.select().from(users).where(eq(users.email, profile.email.toLowerCase()));
    if (!user) [user] = await db.insert(users).values({ email: profile.email.toLowerCase(), name: profile.name || profile.email.split("@")[0], passwordHash: await hashPassword(randomBytes(32).toString("hex")), avatar: profile.picture, verified: Boolean(profile.email_verified) }).returning();
    await createSession(user.id); jar.delete("qf_google_state"); return NextResponse.redirect(`${url.origin}/library`);
  } catch { return NextResponse.redirect(`${url.origin}/login?google=failed`); }
}
