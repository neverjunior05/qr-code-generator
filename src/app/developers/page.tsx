import type { Metadata } from "next";
import { DeveloperDocs } from "@/components/layout/DeveloperDocs";
export const metadata: Metadata = { title: "Developer API & QR image endpoint", description: "Interactive QRForge REST documentation, public local QR image generation, scoped API keys, dynamic code CRUD, and privacy-friendly analytics." };
export default function DevelopersPage() { return <DeveloperDocs />; }
