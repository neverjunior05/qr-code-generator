"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChartLineUp, FolderOpen, House, Plus, QrCode, Scan, SquaresFour, UserCircle, X, List } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { MEDIA_CREDITS } from "@/config/media";
import { ThemeControls } from "@/components/providers";

const nav = [{ href: "/create", label: "Create" }, { href: "/templates", label: "Templates" }, { href: "/scan", label: "Scan" }, { href: "/bulk", label: "Bulk" }, { href: "/developers", label: "API" }];

export function Logo() {
  return <Link href="/" className="flex items-center gap-2.5" aria-label="QRForge home"><span className="relative grid h-9 w-9 grid-cols-3 gap-[2px] rounded-[8px] border-2 border-ink bg-surface p-1.5 shadow-[2px_2px_0_var(--ink)]">{[0,1,2,3,4,5,6,7,8].map((n) => <span key={n} className={`${[0,2,4,6,8].includes(n) ? "bg-indigo" : "bg-transparent"} rounded-[1px]`} />)}</span><span className="font-display text-[1.2rem] font-bold tracking-[-.04em]">QRForge<span className="text-riso-pink">.</span></span></Link>;
}

export function SiteHeader() {
  const pathname = usePathname(); const [open, setOpen] = useState(false); const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  useEffect(() => { fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user)).catch(() => undefined); }, [pathname]);
  useEffect(() => setOpen(false), [pathname]);
  if (pathname.startsWith("/q/") || pathname.startsWith("/p/")) return null;
  return <>
    <header className="sticky top-0 z-50 border-b border-hairline bg-paper/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <Logo /><nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">{nav.map((item) => <Link key={item.href} href={item.href} className={`rounded-lg px-3 py-2 text-[.82rem] font-semibold transition-colors hover:bg-elevated ${pathname.startsWith(item.href) ? "bg-elevated text-indigo-deep" : "text-muted"}`}>{item.label}</Link>)}</nav>
        <div className="hidden items-center gap-2 md:flex"><Link className="btn btn-ghost" href={user ? "/library" : "/login"}>{user ? <><FolderOpen size={18} weight="bold" /> Library</> : "Sign in"}</Link><Link className="btn btn-primary" href="/create"><Plus size={18} weight="bold" /> New code</Link>{user?.role === "admin" && <Link className="icon-btn" href="/admin" aria-label="Admin"><SquaresFour size={20} /></Link>}</div>
        <button className="icon-btn md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle navigation">{open ? <X size={22} /> : <List size={22} />}</button>
      </div>
      <AnimatePresence>{open && <motion.nav initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-hairline bg-surface px-4 md:hidden" aria-label="Mobile navigation"><div className="grid gap-1 py-3">{nav.map((item) => <Link key={item.href} href={item.href} className="flex min-h-11 items-center rounded-lg px-3 font-semibold hover:bg-elevated">{item.label}</Link>)}<Link href={user ? "/library" : "/login"} className="flex min-h-11 items-center rounded-lg px-3 font-semibold">{user ? "Library" : "Sign in"}</Link></div></motion.nav>}</AnimatePresence>
    </header>
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-hairline bg-surface/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Quick navigation">
      {[{ href: "/create", label: "Create", icon: Plus }, { href: "/library", label: "Library", icon: FolderOpen }, { href: "/scan", label: "Scan", icon: Scan }, { href: "/analytics", label: "Analytics", icon: ChartLineUp }, { href: user ? "/settings" : "/login", label: "Account", icon: UserCircle }].map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex min-h-[62px] flex-col items-center justify-center gap-1 text-[.62rem] font-semibold ${pathname.startsWith(href) ? "text-indigo" : "text-muted"}`}><Icon size={22} weight={pathname.startsWith(href) ? "fill" : "bold"} /><span>{label}</span></Link>)}
    </nav>
  </>;
}

export function SiteFooter() {
  const pathname = usePathname(); const [credits, setCredits] = useState(false);
  if (pathname.startsWith("/q/") || pathname.startsWith("/p/")) return null;
  return <footer className="mt-20 border-t border-hairline bg-surface">
    <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-12 md:grid-cols-[1.3fr_.7fr_.7fr] lg:px-8">
      <div><Logo /><p className="mt-5 max-w-lg text-sm leading-7 text-muted">A precision design tool crossed with a playful print studio. Static encoding, decoding, and exports happen on your device.</p><p className="mt-4 max-w-xl text-xs leading-6 text-muted"><strong className="text-ink">Independent demo & learning project.</strong> QRForge and its visuals are original and are not affiliated with any existing QR service. All seeded people, codes, scans, and reports are fictional. QR Code is a registered trademark of Denso Wave Incorporated.</p></div>
      <div><p className="micro">Print studio</p><div className="mt-4 grid gap-3 text-sm text-muted">{[["Create a code", "/create"], ["Print templates", "/templates"], ["Bulk CSV", "/bulk"], ["Safety scanner", "/scan"], ["Pricing & limits", "/pricing"], ["Policies", "/policies"]].map(([label, href]) => <Link key={href} href={href} className="hover:text-ink">{label}</Link>)}</div></div>
      <div><p className="micro">Trust & tools</p><div className="mt-4 grid gap-3 text-sm text-muted">{[["Developer API", "/developers"], ["Privacy settings", "/settings#privacy"], ["Report a code", "/q/flagged-demo/warning"], ["Media credits", "#credits"]].map(([label, href]) => <Link key={label} href={href} className="hover:text-ink" onClick={label === "Media credits" ? (e) => { e.preventDefault(); setCredits(!credits); } : undefined}>{label}</Link>)}</div><div className="mt-5"><ThemeControls compact /></div></div>
    </div>
    <AnimatePresence>{credits && <motion.div id="credits" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-hairline"><div className="mx-auto grid max-w-[1400px] gap-3 px-5 py-7 text-xs text-muted md:grid-cols-3 lg:px-8">{MEDIA_CREDITS.map((credit) => <a key={credit.name} href={credit.url} target="_blank" rel="noreferrer" className="panel p-4 hover:border-indigo"><strong className="block text-ink">{credit.name}</strong><span className="mt-1 block">{credit.use}</span><span className="mt-2 block font-mono text-[.65rem]">{credit.license}</span></a>)}</div></motion.div>}</AnimatePresence>
    <div className="border-t border-hairline px-5 py-5 text-center font-mono text-[.65rem] uppercase tracking-[.12em] text-muted">Made for paper, pixels & privacy · No raw IPs stored · Demo data only</div>
  </footer>;
}
