import type { Metadata } from "next";
import { BulkGenerator } from "@/components/bulk/BulkGenerator";
export const metadata: Metadata = { title: "Bulk QR generator from CSV", description: "Validate CSV rows and generate up to 200 QR codes as a PNG/SVG ZIP or a 3×8 printable PDF sheet, locally in your browser." };
export default function BulkPage() { return <BulkGenerator />; }
