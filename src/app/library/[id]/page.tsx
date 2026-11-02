import type { Metadata } from "next";
import { CodeEditor } from "@/components/library/CodeEditor";
export const metadata: Metadata = { title: "Edit code", robots: { index: false, follow: false } };
export default async function CodePage({ params }: { params: Promise<{ id: string }> }) { return <CodeEditor id={(await params).id} />; }
