import type { Metadata } from "next";
import { GeneratorStudio } from "@/components/generator/GeneratorStudio";

export const metadata: Metadata = { title: "Instant QR design studio", description: "Create and style a scan-safe QR code locally. Export PNG, true vector SVG, or print-ready PDF without an account." };
export default function CreatePage() { return <GeneratorStudio />; }
