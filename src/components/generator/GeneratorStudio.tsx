"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowClockwise, ArrowCounterClockwise, FloppyDisk, Info, Question, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { ContentForm } from "./ContentForm";
import { QrPreview, ScannabilityGauge } from "./QrPreview";
import { DesignPanel } from "@/components/design/DesignPanel";
import { ExportPanel } from "@/components/export/ExportPanel";
import { useQrBuilder } from "@/hooks/useQrBuilder";
import { useBuilderStore } from "@/store/useBuilderStore";
import { useToast } from "@/components/providers";
import type { ContentType } from "@/lib/qr/types";

export function GeneratorStudio({ initialType }: { initialType?: ContentType }) {
  const store = useBuilderStore(); const [rightTab, setRightTab] = useState<"design" | "export">("design"); const [mobileStep, setMobileStep] = useState<"content" | "design" | "export">("content");
  const [liveSlug, setLiveSlug] = useState<string | null>(null); const [customSlug, setCustomSlug] = useState(""); const [saving, setSaving] = useState(false); const [help, setHelp] = useState(false); const [previewPinned, setPreviewPinned] = useState(true);
  const qr = useQrBuilder(liveSlug); const toast = useToast();
  useEffect(() => { if (initialType) store.setType(initialType); const incoming = new URLSearchParams(window.location.search).get("data"); if (incoming && !initialType) { if (/^https?:\/\//i.test(incoming)) { store.setType("url"); store.setValue("url", incoming); } else { store.setType("text"); store.setValue("text", incoming); } } /* Intentional route-driven content selection. */ }, [initialType]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (store.savedId) fetch(`/api/codes/${store.savedId}`).then((r) => r.ok ? r.json() : null).then((body) => { if (body?.code?.slug) setLiveSlug(body.code.slug); }).catch(() => undefined); }, [store.savedId]);
  useEffect(() => { setLiveSlug(null); }, [store.content, store.design, store.dynamic]);
  const save = useCallback(async () => {
    if (qr.encoded.errors.length || !qr.data) { toast("Fix the highlighted content before saving.", "error"); return; }
    setSaving(true);
    try {
      const response = await fetch(store.savedId ? `/api/codes/${store.savedId}` : "/api/codes", { method: store.savedId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: store.name, content: store.content, design: store.design, dynamic: store.content.type === "multilink" ? true : store.dynamic, customSlug: customSlug || undefined }) });
      const body = await response.json();
      if (response.status === 401) { toast("Sign in to save. Your instant design remains on this device.", "info"); return; }
      if (!response.ok) throw new Error(body.error || "Could not save this code.");
      setLiveSlug(body.code.slug); useBuilderStore.setState({ savedId: body.code.id }); toast(body.code.dynamic ? `Dynamic code saved at /q/${body.code.slug}` : "Static code saved to your library");
    } catch (error) { toast(error instanceof Error ? error.message : "Save failed.", "error"); } finally { setSaving(false); }
  }, [qr.data, qr.encoded.errors.length, store.content, store.design, store.dynamic, store.name, store.savedId, customSlug, toast]);
  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement; const typing = /INPUT|TEXTAREA|SELECT/.test(target.tagName);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); void save(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") { event.preventDefault(); window.dispatchEvent(new Event("qrforge-download")); }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "c") { event.preventDefault(); window.dispatchEvent(new Event("qrforge-copy")); }
      if (event.key === "/" && !typing) { event.preventDefault(); document.getElementById("content-primary")?.focus(); }
      if (event.key === "?" && !typing) { event.preventDefault(); setHelp(true); }
      if (event.key === "Escape") setHelp(false);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !typing) { event.preventDefault(); event.shiftKey ? store.redo() : store.undo(); }
    };
    window.addEventListener("keydown", keys); return () => window.removeEventListener("keydown", keys);
  }, [save, store]);
  const valid = Boolean(qr.matrix && !qr.encoded.errors.length && !qr.renderError);
  return <main className="min-h-screen">
    <div className="border-b border-hairline bg-surface">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:h-[68px] lg:flex-nowrap lg:py-0">
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><input aria-label="Code name" className="min-w-0 flex-1 bg-transparent font-display text-base font-bold outline-none sm:text-lg" value={store.name} onChange={(e) => store.setName(e.target.value)} /><span className={`pill shrink-0 ${store.dynamic || store.content.type === "multilink" ? "text-indigo" : ""}`}>{store.dynamic || store.content.type === "multilink" ? "Dynamic" : "Static"}</span></div></div>
        <div className="flex items-center gap-1.5"><button className="icon-btn" onClick={store.undo} disabled={!store.past.length} aria-label="Undo design change" title="Undo (Ctrl+Z)"><ArrowCounterClockwise size={18} /></button><button className="icon-btn" onClick={store.redo} disabled={!store.future.length} aria-label="Redo design change" title="Redo (Ctrl+Shift+Z)"><ArrowClockwise size={18} /></button><button className="icon-btn" onClick={() => setHelp(true)} aria-label="Keyboard shortcuts"><Question size={18} /></button><button className="btn btn-primary" disabled={saving || !valid} onClick={() => void save()}><FloppyDisk size={18} weight="bold" /> {saving ? "Saving…" : "Save"}</button></div>
      </div>
    </div>
    <section className="border-b border-hairline bg-[#E9E8FF]/60 px-4 py-2.5 text-xs leading-5 text-[#2E26C9] dark:bg-[#1D2044] dark:text-[#C8C5FF]"><div className="mx-auto flex max-w-[1600px] items-center gap-2"><Info size={17} className="shrink-0" /><p><strong>Static codes are permanent</strong> and cannot be edited or tracked. Dynamic codes use a QRForge short link, can be edited later, and depend on this demo service staying online.</p></div></section>

    <div className="sticky top-[72px] z-30 border-b border-hairline bg-surface/95 backdrop-blur lg:hidden">
      <button className="flex w-full items-center gap-3 px-4 py-2" onClick={() => setPreviewPinned(!previewPinned)} aria-expanded={previewPinned}><div className={`overflow-hidden transition-all ${previewPinned ? "h-14 w-14" : "h-0 w-14"}`}>{valid && <QrPreview data={qr.data} design={{ ...store.design, frame: "none" }} matrix={qr.matrix} compact />}</div><div className="flex-1 text-left"><span className="block text-xs font-bold">Live preview</span><span className="font-mono text-[.62rem] text-muted">Scan score {qr.report.score}/100 · {previewPinned ? "Tap to collapse" : "Tap to expand"}</span></div></button>
      <div className="segmented mx-3 mb-3">{(["content", "design", "export"] as const).map((step, i) => <button key={step} aria-pressed={mobileStep === step} onClick={() => { setMobileStep(step); if (step !== "content") setRightTab(step); }}>{i + 1}. {step[0].toUpperCase() + step.slice(1)}</button>)}</div>
    </div>

    <div className="mx-auto grid max-w-[1600px] items-start gap-5 p-4 sm:p-6 md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[330px_minmax(340px,1fr)_360px] lg:gap-6 lg:p-7">
      <aside className={`panel p-5 ${mobileStep === "content" ? "block" : "hidden"} md:block`}><ContentForm errors={qr.encoded.errors} /></aside>
      <section className="work-mat hidden rounded-[14px] border border-hairline p-5 md:block lg:sticky lg:top-[92px]" aria-label="Live QR preview on work mat">
        <div className="mx-auto max-w-[590px]"><div className="mb-6 flex items-center justify-between"><span className="micro">Live composition</span><span className="pill"><span className="live-dot" /> Local render</span></div>
          {valid ? <QrPreview data={qr.data} design={store.design} matrix={qr.matrix} name={store.name} scanLine /> : <div className="grid aspect-square place-items-center rounded-[4px] border border-dashed border-muted bg-surface p-10 text-center"><div><span className="font-display text-2xl font-bold">Your sticker awaits.</span><p className="mt-2 text-sm text-muted">{qr.renderError || "Complete the content form to generate a code."}</p></div></div>}
          <div className="mt-8 grid gap-3"><ScannabilityGauge report={qr.report} /><details className="panel p-4 text-xs"><summary className="cursor-pointer font-semibold text-ink">Encoded content · accessible text equivalent</summary><pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-paper p-3 font-mono text-[.65rem] leading-5 text-muted">{qr.data || "No valid payload yet"}</pre></details>
          {(qr.encoded.warnings.length > 0 || store.dynamic && !liveSlug) && <div className="rounded-[10px] border border-[#F5A524]/40 bg-[#F5A524]/10 p-3 text-xs leading-5 text-[#8A5A00] dark:text-[#FFD88A]" aria-live="polite">{store.dynamic && !liveSlug && <p>Dynamic preview uses a placeholder slug. Save to activate the real short link.</p>}{qr.encoded.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>}
          </div>
        </div>
      </section>
      <aside className={`panel p-5 md:col-span-2 lg:col-span-1 ${mobileStep === "content" ? "hidden" : "block"} md:block`}>
        <div className="segmented mb-5 hidden md:flex"><button aria-pressed={rightTab === "design"} onClick={() => setRightTab("design")}>Design studio</button><button aria-pressed={rightTab === "export"} onClick={() => setRightTab("export")}>Export</button></div>
        <div className={`${rightTab === "design" ? "block" : "hidden"} ${mobileStep === "export" ? "hidden md:block" : ""}`}><DesignPanel /></div>
        <div className={`${rightTab === "export" ? "block" : "hidden"} ${mobileStep === "design" ? "hidden md:block" : ""}`}><ExportPanel data={valid ? qr.data : ""} design={store.design} name={store.name} dynamic={store.dynamic || store.content.type === "multilink"} liveSlug={liveSlug} /></div>
        {rightTab === "design" && mobileStep !== "export" && <div className="mt-6 border-t border-hairline pt-5"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 accent-[#4F46FF]" checked={store.dynamic || store.content.type === "multilink"} disabled={store.content.type === "multilink" || Boolean(store.savedId)} onChange={(e) => store.setDynamic(e.target.checked)} /><span><strong className="block text-xs">Save as a dynamic short link</strong><span className="mt-1 block text-[.7rem] leading-5 text-muted">Edit destination, schedule changes, route devices, and collect privacy-friendly scans. Sign-in and plan limits apply.</span></span></label>{(store.dynamic || store.content.type === "multilink") && !store.savedId && <div className="field mt-3"><label>Custom slug <span className="font-normal text-muted">(optional)</span></label><input className="input font-mono text-xs" value={customSlug} onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="spring-menu" maxLength={31} /><p className="help">3–31 lowercase letters, numbers, or hyphens. Leave blank for a cryptographically random slug.</p></div>}</div>}
        {rightTab === "design" && <button className="btn btn-primary mt-5 w-full md:hidden" onClick={() => { setMobileStep("export"); setRightTab("export"); }}>Continue to export</button>}
      </aside>
    </div>
    <AnimatePresence>{help && <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-[#0D0F1E]/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setHelp(false)}><motion.div role="dialog" aria-modal="true" aria-labelledby="shortcuts-title" initial={{ scale: .95, y: 15 }} animate={{ scale: 1, y: 0 }} className="print-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between"><h2 id="shortcuts-title" className="font-display text-xl font-bold">Studio shortcuts</h2><button className="icon-btn" onClick={() => setHelp(false)} aria-label="Close shortcuts"><X size={18} /></button></div><dl className="mt-5 grid gap-3">{[["Save to library", "Ctrl / Cmd + S"], ["Download PNG", "Ctrl / Cmd + D"], ["Copy QR", "Ctrl / Cmd + Shift + C"], ["Focus content", "/"], ["Undo / redo", "Ctrl / Cmd + Z / Shift + Z"], ["Open this help", "?"]].map(([label, key]) => <div key={label} className="flex items-center justify-between gap-4 border-b border-hairline pb-3 text-sm"><dt className="text-muted">{label}</dt><dd className="rounded-md bg-elevated px-2 py-1 font-mono text-xs">{key}</dd></div>)}</dl><Link href="/developers" className="mt-5 inline-block text-xs font-semibold text-indigo-deep">Need automation? Explore the developer API →</Link></motion.div></motion.div>}</AnimatePresence>
  </main>;
}
