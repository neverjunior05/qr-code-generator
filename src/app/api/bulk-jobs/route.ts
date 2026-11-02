import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { bulkJobs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
export async function POST(request: Request) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ ok: true, saved: false });
  const parsed = z.object({ filename: z.string().max(180), total: z.number().int().min(0).max(100000), valid: z.number().int().min(0).max(200), errors: z.array(z.object({ row: z.number().int(), message: z.string().max(500) })).max(50) }).safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid bulk job summary" }, { status: 400 });
  const [job] = await db.insert(bulkJobs).values({ ...parsed.data, userId: user.id }).returning(); return NextResponse.json({ saved: true, job });
}
