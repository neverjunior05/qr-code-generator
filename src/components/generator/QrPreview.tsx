"use client";

import { AnimatePresence, motion } from "framer-motion";
import { WarningCircle, Check, CaretDown, Info, ShieldCheck, Warning } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { QrMatrix } from "@/lib/qr/render";
import { renderMatrixSvg, renderQrSvg } from "@/lib/qr/render";
import type { QrDesign } from "@/lib/qr/types";
import type { ScanReport } from "@/lib/qr/scannability";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function QrPreview({ data, design, matrix, name = "QR code", compact = false, scanLine = false }: { data: string; design: QrDesign; matrix: QrMatrix | null; name?: string; compact?: boolean; scanLine?: boolean }) {
  const [reduced] = useReducedMotion();
  const svg = useMemo(() => {
    if (!matrix || !data) return "";
    try { return design.frame === "none" ? renderMatrixSvg(matrix, design, { animated: !reduced, title: name, description: `Encoded content: ${data}` }) : renderQrSvg(data, design, { animated: !reduced, title: name }); } catch { return ""; }
  }, [data, design, matrix, name, reduced]);
  if (!svg) return <div className="grid aspect-square w-full place-items-center rounded border border-dashed border-hairline bg-surface p-8 text-center text-sm text-muted">Enter valid content to compose your code.</div>;
  return <div className={`relative mx-auto w-full ${compact ? "max-w-[160px]" : "max-w-[510px]"}`}>
    {!compact && <div className="cutting-guide" />}
    <AnimatePresence mode="wait" initial={false}><motion.div key={svg.length + design.dotStyle + design.frame} initial={reduced ? false : { opacity: .55, scale: .992 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .18 }} className="qr-sticker" style={design.frame !== "none" ? { aspectRatio: "1000 / 1140" } : undefined} dangerouslySetInnerHTML={{ __html: svg }} /></AnimatePresence>
    {scanLine && !reduced && <div className="scan-line" />}
  </div>;
}

export function ScannabilityGauge({ report }: { report: ScanReport }) {
  const [open, setOpen] = useState(false);
  const color = report.score >= 85 ? "#1DB97D" : report.score >= 65 ? "#F5A524" : "#F0445A";
  return <section className="panel overflow-hidden" aria-labelledby="scan-score-title">
    <button className="flex w-full items-center gap-4 p-4 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
      <div className="relative h-14 w-14 shrink-0" role="img" aria-label={`Scannability score ${report.score} out of 100: ${report.label}`}>
        <svg viewBox="0 0 56 56" className="h-full w-full -rotate-90"><circle cx="28" cy="28" r="23" fill="none" stroke="var(--elevated)" strokeWidth="6"/><motion.circle cx="28" cy="28" r="23" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={144.5} animate={{ strokeDashoffset: 144.5 * (1 - report.score / 100) }} transition={{ type: "spring", stiffness: 170, damping: 22 }} /></svg>
        <span className="absolute inset-0 grid place-items-center font-mono text-xs font-semibold">{report.score}</span>
      </div>
      <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 id="scan-score-title" className="font-display text-sm font-bold">Scannability</h3><span className="pill !min-h-5 !px-2 !py-0" style={{ color }}>{report.label}</span></div><p className="mt-1 truncate text-xs text-muted">{report.contrast.toFixed(1)}:1 contrast · {report.density} density · {report.modules}² modules</p></div>
      <CaretDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    <div className="sr-only" aria-live="polite">Scannability {report.score} out of 100. {report.label}.</div>
    <AnimatePresence initial={false}>{open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><ul className="grid gap-2 border-t border-hairline p-4">{report.issues.map((issue) => <li key={issue.id} className="flex gap-2.5 text-xs leading-5"><span className="mt-0.5 shrink-0">{issue.severity === "good" ? <Check size={16} weight="bold" color="#1DB97D" /> : issue.severity === "info" ? <Info size={16} color="#3B8BFF" /> : issue.severity === "warning" ? <Warning size={16} weight="fill" color="#F5A524" /> : <WarningCircle size={16} weight="fill" color="#F0445A" />}</span><div><strong className="block text-ink">{issue.label}</strong><span className="text-muted">{issue.detail}</span></div></li>)}</ul><p className="border-t border-hairline px-4 py-3 text-[.68rem] leading-5 text-muted"><ShieldCheck size={14} className="mr-1 inline" /> Automated guidance, not a guarantee. Always test a physical proof with more than one camera.</p></motion.div>}</AnimatePresence>
  </section>;
}
