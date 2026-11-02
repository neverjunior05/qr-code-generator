import type { Metadata } from "next";
import { LibraryView } from "@/components/library/LibraryView";
export const metadata: Metadata = { title: "Your code library", robots: { index: false, follow: false } };
export default function LibraryPage() { return <LibraryView />; }
