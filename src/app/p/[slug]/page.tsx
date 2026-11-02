import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowUpRight, QrCode } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/db";
import { qrCodes } from "@/db/schema";
import { contentSummary } from "@/lib/qr/encoders";

export const metadata: Metadata = { title: "Hosted QR links", robots: { index: false } };
function safeHttp(value: string) { try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.toString() : null; } catch { return null; } }
export default async function MultiLinkPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug; const [code] = await db.select().from(qrCodes).where(eq(qrCodes.slug, slug));
  if (!code || code.status === "trashed") return <main className="grid min-h-screen place-items-center p-6 text-center"><div><QrCode size={54} className="mx-auto text-muted" /><h1 className="mt-4 font-display text-3xl font-bold">This hosted page was removed.</h1><Link href="/" className="btn btn-secondary mt-6">Visit QRForge</Link></div></main>;
  const links = code.content.type === "multilink" ? code.content.values.links.map((link) => ({ ...link, safe: safeHttp(link.url) })).filter((link) => link.safe) : [];
  return <main className="min-h-screen bg-paper px-4 py-10"><div className="mx-auto max-w-lg"><div className="mb-8 flex items-center justify-between"><span className="font-display text-lg font-bold">QRForge<span className="text-riso-pink">.</span></span><span className="pill">Hosted dynamic page</span></div><section className="print-card overflow-hidden"><div className="bg-indigo p-7 text-white"><p className="micro !text-white/70">Shared with a QR code</p><h1 className="mt-3 font-display text-3xl font-bold tracking-[-.04em]">{code.name}</h1><p className="mt-3 text-sm text-white/80">{contentSummary(code.content.type as never, code.content.values)}</p></div><div className="grid gap-3 p-5">{links.length ? links.map((link) => <a key={link.id} href={link.safe!} rel="noopener noreferrer" className="btn btn-secondary justify-between !px-5">{link.label}<ArrowUpRight size={19} /></a>) : <><p className="text-sm leading-7 text-muted">This dynamic code points to a hosted content page rather than a website redirect.</p><pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-[10px] bg-paper p-4 font-mono text-xs leading-6 text-muted">{code.encoded.startsWith("http") ? contentSummary(code.content.type as never, code.content.values) : code.encoded}</pre></>}</div></section><p className="mt-5 text-center text-xs leading-6 text-muted">Content is supplied by the code owner. QRForge is an independent demo and does not endorse it. <Link className="font-semibold text-indigo-deep" href={`/q/${slug}/warning?state=flagged`}>Safety & report</Link></p></div></main>;
}
