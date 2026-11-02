import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { recordScan } from "@/lib/analytics";

export async function POST(request: Request) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = z.object({ codeId: z.string().uuid() }).safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid code." }, { status: 400 });
  const [code] = await db.select().from(qrCodes).where(and(eq(qrCodes.id, parsed.data.codeId), eq(qrCodes.userId, user.id))); if (!code?.dynamic) return NextResponse.json({ error: "Demo scans can only target dynamic codes." }, { status: 400 });
  const result = await recordScan(request, code, true); return NextResponse.json({ ...result, demo: true });
}
