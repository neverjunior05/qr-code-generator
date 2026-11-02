import { NextResponse } from "next/server";
import { getCurrentUser, userClient } from "@/lib/auth";

export async function GET() { const user = await getCurrentUser(); return NextResponse.json({ user: user ? userClient(user) : null }, { headers: { "Cache-Control": "no-store" } }); }
