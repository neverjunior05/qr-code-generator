import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { qrCodes, scanEvents } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { analyticsCsv, analyticsFor } from "@/lib/analytics";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const id = (await params).id; const [code] = await db.select().from(qrCodes).where(and(eq(qrCodes.id, id), eq(qrCodes.userId, user.id))); if (!code) return NextResponse.json({ error: "Code not found." }, { status: 404 });
  const url = new URL(request.url);
  if (url.searchParams.get("format") === "csv") { const events = await db.select().from(scanEvents).where(eq(scanEvents.codeId, id)).orderBy(desc(scanEvents.scannedAt)); return new Response(analyticsCsv(events), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${code.slug || "qr"}-analytics.csv"`, "Cache-Control": "no-store" } }); }
  const days = Math.min(365, Math.max(7, Number(url.searchParams.get("days")) || 30)); return NextResponse.json({ analytics: await analyticsFor(id, days), code: { id: code.id, name: code.name, slug: code.slug, scanCount: code.scanCount } }, { headers: { "Cache-Control": "no-store" } });
}
