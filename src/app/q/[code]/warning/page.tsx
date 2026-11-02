import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
import { ShortLinkWarning } from "@/components/layout/ShortLinkWarning";
export const metadata: Metadata = { title: "Short link safety notice", robots: { index: false, follow: false } };
export default async function WarningPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ state?: string }> }) {
  const slug = (await params).code; const requestedState = (await searchParams).state; const [code] = await db.select().from(qrCodes).where(eq(qrCodes.slug, slug)); const state = requestedState || (code?.flagged ? "flagged" : "removed");
  return <ShortLinkWarning slug={slug} state={state} codeName={code?.name || ""} destination={code?.destination || null} flagReason={code?.flagReason || null} />;
}
