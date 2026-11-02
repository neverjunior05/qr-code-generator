import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { folders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 }); return NextResponse.json({ folders: await db.select().from(folders).where(eq(folders.userId, user.id)) }); }
export async function POST(request: Request) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = z.object({ name: z.string().trim().min(1).max(60), color: z.string().regex(/^#[0-9a-f]{6}$/i).default("#4F46FF") }).safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Enter a folder name." }, { status: 400 });
  const [folder] = await db.insert(folders).values({ ...parsed.data, userId: user.id }).returning(); return NextResponse.json({ folder }, { status: 201 });
}
export async function DELETE(request: Request) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "Folder ID required." }, { status: 400 });
  await db.delete(folders).where(and(eq(folders.id, id), eq(folders.userId, user.id))); return NextResponse.json({ ok: true });
}
