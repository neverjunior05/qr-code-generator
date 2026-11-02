import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin; const id = process.env.GOOGLE_CLIENT_ID; const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) return NextResponse.redirect(`${origin}/login?google=unavailable`);
  const state = randomBytes(20).toString("base64url"); const jar = await cookies(); jar.set("qf_google_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
  const params = new URLSearchParams({ client_id: id, redirect_uri: `${origin}/api/auth/google/callback`, response_type: "code", scope: "openid email profile", state, prompt: "select_account" });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
