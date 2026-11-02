"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Clipboard, DownloadSimple, FileText, LockKey } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { copyQrToClipboard, exportPdf, exportPng, exportSvg, exportTextEquivalent } from "@/lib/qr/export";
import type { QrDesign } from "@/lib/qr/types";
import { useToast } from "@/components/providers";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Status = "idle" | "working" | "done";

export function ExportPanel({ data, design, name, dynamic, liveSlug }: { data: string; design: QrDesign; name: string; dynamic: boolean; liveSlug?: string | null }) {
  const [format, setFormat] = useState<"png" | "svg" | "pdf">("png"); const [scale, setScale] = useState("1024"); const [custom, setCustom] = useState(1200);
  const [unit, setUnit] = useState<"mm" | "in">("mm"); const [physicalSize, setPhysicalSize] = useState(35); const [bleed, setBleed] = useState(true);
  const [status, setStatus] = useState<Status>("idle"); const [message, setMessage] = useState(""); const toast = useToast(); const [reduced] = useReducedMotion();
  const run = useCallback(async (action: "download" | "copy", forcedFormat?: "png" | "svg" | "pdf") => {
    if (!data) { toast("Enter valid content before exporting.", "error"); return; }
    setStatus("working"); setMessage(action === "copy" ? "Copying to clipboard" : `Preparing ${(forcedFormat || format).toUpperCase()}`);
    try {
      if (action === "copy") { const result = await copyQrToClipboard(data, design); toast(result); }
      else {
        const selected = forcedFormat || format;
        if (selected === "svg") await exportSvg(data, design, name);
        else if (selected === "png") { const size = scale === "custom" ? custom : Number(scale); if (size < 64 || size > 8192) throw new Error("Choose a PNG size between 64 and 8192 pixels."); await exportPng(data, design, name, size); }
        else await exportPdf(data, design, name, { unit, physicalSize, bleed });
        toast(`${selected.toUpperCase()} exported locally`);
        if (!localStorage.getItem("qrforge-first-export")) { localStorage.setItem("qrforge-first-export", "true"); if (!reduced) { const confetti = (await import("canvas-confetti")).default; confetti({ particleCount: 45, spread: 60, origin: { y: .75 }, colors: ["#4F46FF", "#FF4FA3", "#FFD23F", "#2ED6C9"], disableForReducedMotion: true }); } }
      }
      setStatus("done"); setMessage(action === "copy" ? "Copied" : "Export complete"); window.setTimeout(() => setStatus("idle"), 1600);
    } catch (error) { setStatus("idle"); setMessage(""); toast(error instanceof Error ? error.message : "Export failed.", "error"); }
  }, [bleed, custom, data, design, format, name, physicalSize, reduced, scale, toast, unit]);
  useEffect(() => {
    const download = () => void run("download", "png"); const copy = () => void run("copy");
    window.addEventListener("qrforge-download", download); window.addEventListener("qrforge-copy", copy);
    return () => { window.removeEventListener("qrforge-download", download); window.removeEventListener("qrforge-copy", copy); };
  }, [run]);
  return <div className="grid gap-6">
    <div><p className="micro">03 · Export</p><h2 className="mt-1 font-display text-xl font-bold">Ready for the real world.</h2><p className="mt-2 text-xs leading-5 text-muted">Files are rendered in this browser. Your content and logo are not uploaded to an export service.</p></div>
    <div className="segmented" role="tablist" aria-label="Export format">{(["png", "svg", "pdf"] as const).map((item) => <button role="tab" aria-selected={format === item} aria-pressed={format === item} key={item} onClick={() => setFormat(item)}>{item.toUpperCase()}</button>)}</div>
    <AnimatePresence mode="wait" initial={false}><motion.div key={format} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: .14 }} className="grid gap-4">
      {format === "png" && <><div className="field"><label>Pixel dimensions</label><div className="grid grid-cols-4 gap-2">{[["512", "1×"], ["1024", "2×"], ["2048", "4×"], ["custom", "Custom"]].map(([value, label]) => <button key={value} className={`min-h-11 rounded-[9px] border text-xs font-semibold ${scale === value ? "border-indigo bg-[#E9E8FF] text-[#2E26C9] dark:bg-[#242750] dark:text-[#C8C5FF]" : "border-hairline"}`} onClick={() => setScale(value)}>{label}<span className="block font-mono text-[.58rem] text-muted">{value === "custom" ? "PX" : `${value}px`}</span></button>)}</div></div>{scale === "custom" && <div className="field"><label>Custom width (64–8192 px)</label><input className="input font-mono" type="number" min="64" max="8192" value={custom} onChange={(e) => setCustom(Number(e.target.value))} /></div>}<p className="help">Height follows the selected frame ratio. Use 2048 px or more for large-format print.</p></>}
      {format === "svg" && <div className="rounded-[12px] border border-hairline bg-paper p-4"><FileText size={28} className="text-indigo" /><h3 className="mt-3 text-sm font-bold">True vector artwork</h3><p className="mt-1 text-xs leading-5 text-muted">Module paths, gradients, finder patterns, frames, and text remain scalable. Remote logo URLs stay linked; upload a logo for a self-contained file.</p></div>}
      {format === "pdf" && <><div className="grid grid-cols-2 gap-3"><div className="field"><label>Print unit</label><select className="input" value={unit} onChange={(e) => { const next = e.target.value as "mm" | "in"; setUnit(next); setPhysicalSize(next === "mm" ? 35 : 1.4); }}><option value="mm">Millimeters</option><option value="in">Inches</option></select></div><div className="field"><label>Code width</label><input className="input font-mono" type="number" min={unit === "mm" ? 15 : .6} max={unit === "mm" ? 180 : 7} step={unit === "mm" ? 1 : .1} value={physicalSize} onChange={(e) => setPhysicalSize(Number(e.target.value))} /></div></div><label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-hairline p-3 text-xs font-semibold"><input type="checkbox" className="h-5 w-5 accent-[#4F46FF]" checked={bleed} onChange={(e) => setBleed(e.target.checked)} /> Add 3 mm bleed & crop marks</label><div className="rounded-[10px] bg-elevated p-3 text-xs leading-5 text-muted">The QR is rasterized at 300 DPI and placed at the exact physical size. SVG is the better choice for infinitely vector-based production.</div></>}
    </motion.div></AnimatePresence>
    <button className={`btn relative overflow-hidden ${status === "done" ? "!bg-[#1DB97D] !text-white" : "btn-primary"} min-h-[50px]`} disabled={status === "working"} onClick={() => void run("download")}>
      {status === "working" ? <><motion.span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: .7, ease: "linear" }} /> {format === "pdf" ? "Feeding paper…" : "Rendering…"}</> : status === "done" ? <><Check size={20} weight="bold" /> Done</> : <><DownloadSimple size={20} weight="bold" /> Download {format.toUpperCase()}</>}
    </button>
    <button className="btn btn-secondary" onClick={() => void run("copy")}><Clipboard size={18} /> Copy to clipboard</button>
    <button className="btn btn-ghost text-xs" onClick={() => void exportTextEquivalent(data, name)}><FileText size={17} /> Download accessible text equivalent</button>
    <div className="sr-only" aria-live="assertive">{message}</div>
    {dynamic && <div className="grid gap-3 border-t border-hairline pt-5"><h3 className="text-xs font-bold">Dynamic embed</h3>{liveSlug ? <><textarea readOnly className="input min-h-24 font-mono text-[.68rem]" value={`<a href="${window.location.origin}/q/${liveSlug}"><img src="${window.location.origin}/api/v1/qr?data=${encodeURIComponent(`${window.location.origin}/q/${liveSlug}`)}&format=svg&size=512" alt="QR code for ${name}" /></a>`} onFocus={(e) => e.currentTarget.select()} /><p className="help">Embed requests are rate-limited and cached. Keep the destination editable in Library.</p></> : <p className="flex gap-2 text-xs leading-5 text-muted"><LockKey size={17} className="shrink-0" /> Save this dynamic code to activate its short link and embed snippet.</p>}</div>}
  </div>;
}
