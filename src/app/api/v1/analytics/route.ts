import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
import { authenticateApiKey } from "@/lib/apiKeys";
import { analyticsFor } from "@/lib/analytics";
export async function GET(request: Request) { const key = await authenticateApiKey(request, "analytics:read"); if (!key) return NextResponse.json({ error: "Valid analytics:read API key required" }, { status: 401 }); const id = new URL(request.url).searchParams.get("id") || ""; const [code] = await db.select().from(qrCodes).where(and(eq(qrCodes.id, id), eq(qrCodes.userId, key.userId))); if (!code) return NextResponse.json({ error: "Code not found" }, { status: 404 }); return NextResponse.json({ data: await analyticsFor(id, 30) }); }
