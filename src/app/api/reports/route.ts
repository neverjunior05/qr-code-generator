import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { qrCodes, reports } from "@/db/schema";
import { rateLimit, requestKey } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (!rateLimit(requestKey(request, "report"), 5, 3600_000).allowed) return NextResponse.json({ error: "Report limit reached. Please try again later." }, { status: 429 });
  const parsed = z.object({ slug: z.string().trim().min(1).max(50), reason: z.enum(["Suspicious destination", "Broken destination", "Unexpected content", "Possible impersonation", "Spam", "Other"]), details: z.string().trim().max(1500).optional(), contact: z.string().trim().max(180).optional() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a reason and keep details under 1,500 characters." }, { status: 400 });
  const [code] = await db.select({ id: qrCodes.id }).from(qrCodes).where(eq(qrCodes.slug, parsed.data.slug));
  await db.insert(reports).values({ ...parsed.data, codeId: code?.id }); return NextResponse.json({ ok: true, message: "Report received. The demo admin queue has been updated." }, { status: 201 });
}
