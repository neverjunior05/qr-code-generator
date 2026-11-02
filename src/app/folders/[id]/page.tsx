import type { Metadata } from "next";
import { LibraryView } from "@/components/library/LibraryView";
export const metadata: Metadata = { title: "Folder", robots: { index: false } };
export default async function FolderPage({ params }: { params: Promise<{ id: string }> }) { return <LibraryView initialFolder={(await params).id} />; }
