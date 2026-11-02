import type { Metadata } from "next";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
export const metadata: Metadata = { title: "Scan analytics", robots: { index: false, follow: false } };
export default async function CodeAnalyticsPage({ params }: { params: Promise<{ id: string }> }) { return <AnalyticsView codeId={(await params).id} />; }
