import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GeneratorStudio } from "@/components/generator/GeneratorStudio";
import { CONTENT_TYPES, typeMeta, type ContentType } from "@/lib/qr/types";

export function generateStaticParams() { return CONTENT_TYPES.map((type) => ({ type })); }
export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params; if (!CONTENT_TYPES.includes(type as ContentType)) return {};
  const meta = typeMeta[type as ContentType]; return { title: `${meta.label} QR code generator`, description: `${meta.description} Design locally, check scannability, and export PNG, SVG, or PDF with QRForge.` };
}
export default async function TypedCreatePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params; if (!CONTENT_TYPES.includes(type as ContentType)) notFound();
  return <><GeneratorStudio initialType={type as ContentType} /><section className="mx-auto max-w-4xl px-6 py-16"><p className="micro">Encoding notes</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.04em]">{typeMeta[type as ContentType].label} QR codes, without the guesswork.</h1><div className="prose-qf mt-6 grid gap-5 text-sm"><p>{typeMeta[type as ContentType].description} QRForge assembles the payload on your device and displays its exact text equivalent beside the preview. Use the scannability report to check contrast, quiet zone, data density, and logo coverage before exporting.</p><h2 className="text-xl">Static or dynamic?</h2><p>A static code contains the final payload itself and works without QRForge after printing. It cannot be edited or tracked. A dynamic code contains a short link managed in your library, so its destination can change and scans can be measured with privacy controls. Dynamic links depend on the host service and plan.</p><h2 className="text-xl">Print with confidence</h2><p>Start with Print-safe, keep at least four modules of quiet zone, and use SVG for production. For small labels, reduce the payload before reducing module size. Always scan a physical proof at the expected distance and lighting.</p></div></section></>;
}
