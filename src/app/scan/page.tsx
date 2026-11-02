import type { Metadata } from "next";
import { QrReader } from "@/components/reader/QrReader";
export const metadata: Metadata = { title: "Private QR reader & link checker", description: "Decode QR codes with your camera or an image entirely in your browser, with readable payload parsing and suspicious-link warnings." };
export default function ScanPage() { return <QrReader />; }
