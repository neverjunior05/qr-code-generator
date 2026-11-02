"use client";

import Papa from "papaparse";
import { AnimatePresence, motion } from "framer-motion";
import { Check, DownloadSimple, FileCsv, UploadSimple, Warning, X } from "@phosphor-icons/react";
import { useMemo, useRef, useState } from "react";
import { PRESETS, applyPreset } from "@/lib/qr/presets";
import { normalizeHttpUrl } from "@/lib/qr/encoders";
import { renderQrSvg } from "@/lib/qr/render";
import { blobToDataUrl, safeFilename, saveBlob, svgToPngBlob } from "@/lib/qr/export";
import { useToast } from "@/components/providers";

type Row = { row: number; name: string; url: string; preset: string; normalized: string; errors: string[] };
const dangerousHost = (host: string) => /^(localhost|127\.|0\.|10\.|169\.254\.|192\.168\.|::1|\[::1\])/i.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host.endsWith(".local") || host.endsWith(".internal");
const cleanCell = (value: unknown) => { const text = String(value ?? "").trim(); return /^[=+\-@]/.test(text) ? `'${text}` : text; };

export function BulkGenerator() {
  const [rows, setRows] = useState<Row[]>([]); const [headers, setHeaders] = useState<string[]>([]); const [nameColumn, setNameColumn] = useState("name"); const [urlColumn, setUrlColumn] = useState("url"); const [raw, setRaw] = useState<Record<string, string>[]>([]);
  const [format, setFormat] = useState<"png" | "svg">("png"); const [progress, setProgress] = useState(0); const [working, setWorking] = useState<"zip" | "sheet" | null>(null); const [fileName, setFileName] = useState(""); const inputRef = useRef<HTMLInputElement>(null); const toast = useToast();
  const validate = (records: Record<string, string>[], names = nameColumn, urls = urlColumn) => records.map((record, i) => {
    const name = cleanCell(record[names] || `code-${i + 1}`); const url = cleanCell(record[urls]); const preset = cleanCell(record.preset || "Minimal"); const errors: string[] = []; let normalized = "";
    if (!name) errors.push("File name is empty"); if (!url) errors.push("URL is missing");
    if (url) { try { normalized = normalizeHttpUrl(url); const host = new URL(normalized).hostname; if (dangerousHost(host)) errors.push("Local/private destination blocked"); if (host === "phishing-example.test" || host === "malware.test") errors.push("Local blocklist match"); } catch { errors.push("Invalid HTTP(S) URL"); } }
    if (!PRESETS.some((p) => p.name.toLowerCase() === preset.toLowerCase())) errors.push(`Unknown preset: ${preset || "empty"}`);
    return { row: i + 2, name, url, preset, normalized, errors };
  });
  const parseFile = (file?: File) => {
    if (!file) return; if (file.size > 2_000_000) { toast("CSV must be smaller than 2 MB.", "error"); return; }
    setFileName(file.name); Papa.parse<Record<string, string>>(file, { header: true, skipEmptyLines: "greedy", transformHeader: (h) => h.trim().toLowerCase(), complete: (result) => {
      const fields = (result.meta.fields || []).filter(Boolean); setHeaders(fields); const names = fields.includes("name") ? "name" : fields[0] || "name"; const urls = fields.includes("url") ? "url" : fields.includes("destination") ? "destination" : fields[1] || "url";
      setNameColumn(names); setUrlColumn(urls); setRaw(result.data); setRows(validate(result.data, names, urls));
      if (result.errors.length) toast(`${result.errors.length} CSV parser warning${result.errors.length === 1 ? "" : "s"}; inspect the row preview.`, "info");
    }, error: () => toast("The CSV could not be parsed.", "error") });
  };
  const valid = useMemo(() => rows.filter((r) => !r.errors.length).slice(0, 200), [rows]); const invalid = rows.filter((r) => r.errors.length);
  const revalidate = (names: string, urls: string) => { setNameColumn(names); setUrlColumn(urls); setRows(validate(raw, names, urls)); };
  const generateZip = async () => {
    if (!valid.length || working) return; setWorking("zip"); setProgress(0);
    try {
      const { default: JSZip } = await import("jszip"); const zip = new JSZip(); const used = new Set<string>(); const manifest = ["file,name,url,preset"];
      for (let i = 0; i < valid.length; i++) {
        const row = valid[i]; const design = applyPreset(PRESETS.find((p) => p.name.toLowerCase() === row.preset.toLowerCase())?.id || "minimal"); const svg = renderQrSvg(row.normalized, design); let base = safeFilename(row.name); while (used.has(base)) base = `${base}-${i + 1}`; used.add(base);
        if (format === "svg") zip.file(`${base}.svg`, svg); else zip.file(`${base}.png`, await svgToPngBlob(svg, 768, design.background));
        manifest.push([base, row.name, row.normalized, row.preset].map((v) => `"${v.replace(/"/g, '""')}"`).join(",")); setProgress(i + 1);
        if (i % 3 === 0) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
      zip.file("manifest.csv", manifest.join("\n")); saveBlob(await zip.generateAsync({ type: "blob", compression: "DEFLATE" }, (meta) => setProgress(Math.min(valid.length, Math.round(meta.percent / 100 * valid.length)))), `qrforge-${valid.length}-${format}-codes.zip`);
      toast(`${valid.length} ${format.toUpperCase()} codes packaged locally`); void fetch("/api/bulk-jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: fileName, total: rows.length, valid: valid.length, errors: invalid.slice(0, 50).map((r) => ({ row: r.row, message: r.errors.join(", ") })) }) });
    } catch (e) { toast(e instanceof Error ? e.message : "Bulk export failed", "error"); } finally { setWorking(null); }
  };
  const generateSheet = async () => {
    if (!valid.length || working) return; setWorking("sheet"); setProgress(0);
    try {
      const { jsPDF } = await import("jspdf"); const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true }); const perPage = 24;
      for (let i = 0; i < valid.length; i++) {
        if (i && i % perPage === 0) pdf.addPage(); const slot = i % perPage; const col = slot % 3; const line = Math.floor(slot / 3); const x = 8 + col * 65; const y = 8 + line * 35;
        const row = valid[i]; const design = applyPreset(PRESETS.find((p) => p.name.toLowerCase() === row.preset.toLowerCase())?.id || "print-safe"); const png = await svgToPngBlob(renderQrSvg(row.normalized, { ...design, frame: "none" }), 400, "#FFFFFF");
        pdf.addImage(await blobToDataUrl(png), "PNG", x, y, 28, 28); pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(20, 18, 31); pdf.text(pdf.splitTextToSize(row.name.replace(/^'/, ""), 30), x + 31, y + 8); pdf.setFont("helvetica", "normal"); pdf.setFontSize(6); pdf.setTextColor(100, 95, 115); pdf.text(pdf.splitTextToSize(new URL(row.normalized).hostname, 30), x + 31, y + 14); pdf.setDrawColor(226, 220, 207); pdf.rect(x - 2, y - 2, 61, 32);
        setProgress(i + 1); if (i % 3 === 0) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
      pdf.save(`qrforge-label-sheet-3x8-${valid.length}.pdf`); toast("Printable 3×8 label sheet exported");
    } catch (e) { toast(e instanceof Error ? e.message : "Sheet export failed", "error"); } finally { setWorking(null); }
  };
  return <main className="mx-auto max-w-[1300px] px-4 py-10 sm:px-6 lg:px-8">
    <div className="grid items-end gap-6 lg:grid-cols-[1fr_400px]"><div><p className="micro">Production run · local CSV tools</p><h1 className="mt-3 max-w-3xl font-display text-[clamp(2.6rem,6vw,5rem)] font-bold leading-[.98] tracking-[-.055em]">One spreadsheet.<br /><span className="text-indigo">A whole sticker sheet.</span></h1><p className="mt-5 max-w-2xl text-sm leading-7 text-muted">Validate up to 200 codes per run, apply any of the twelve studio presets, then package individual files or impose a 3×8 label sheet. Your CSV is not uploaded.</p></div><div className="print-card p-5"><p className="micro">Expected columns</p><code className="mt-3 block rounded-lg bg-ink px-3 py-3 font-mono text-xs text-[#F1F0FA]">name,url,preset</code><p className="mt-3 text-xs leading-5 text-muted">Names become filenames. Preset is optional and defaults to Minimal. <a href="/samples/bulk.csv" download className="font-semibold text-indigo-deep">Download a valid sample CSV →</a></p></div></div>
    <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_330px]"><div className="panel p-5 sm:p-6"><div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); parseFile(e.dataTransfer.files[0]); }} className="grid min-h-52 place-items-center rounded-[14px] border-2 border-dashed border-hairline bg-paper p-8 text-center"><div><FileCsv size={45} className="mx-auto text-indigo" weight="duotone" /><h2 className="mt-4 font-display text-xl font-bold">{fileName || "Drop your CSV here"}</h2><p className="mt-2 text-xs text-muted">UTF-8 · header row required · max 2 MB</p><button className="btn btn-secondary mt-5" onClick={() => inputRef.current?.click()}><UploadSimple size={18} /> Choose CSV</button><input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => parseFile(e.target.files?.[0])} /></div></div>
      {rows.length > 0 && <><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="field"><label>Filename column</label><select className="input" value={nameColumn} onChange={(e) => revalidate(e.target.value, urlColumn)}>{headers.map((h) => <option key={h}>{h}</option>)}</select></div><div className="field"><label>Destination column</label><select className="input" value={urlColumn} onChange={(e) => revalidate(nameColumn, e.target.value)}>{headers.map((h) => <option key={h}>{h}</option>)}</select></div></div><div className="mt-5 flex flex-wrap gap-2"><span className="pill text-[#12845A]"><Check size={14} /> {valid.length} ready</span><span className={`pill ${invalid.length ? "text-[#C62E45]" : ""}`}><Warning size={14} /> {invalid.length} with errors</span>{rows.length > 200 && <span className="pill text-[#B26A00]">Free cap: first 200 valid rows only</span>}</div><div className="table-wrap mt-4 max-h-[420px] overflow-auto"><table className="data-table"><thead><tr><th>Row</th><th>Name</th><th>Destination</th><th>Preset</th><th>Validation</th></tr></thead><tbody>{rows.slice(0, 30).map((row) => <tr key={row.row}><td className="font-mono">{row.row}</td><td>{row.name}</td><td className="max-w-64 truncate font-mono text-xs">{row.url}</td><td>{row.preset}</td><td className={row.errors.length ? "max-w-56 text-xs text-[#C62E45]" : "text-[#12845A]"}>{row.errors.length ? row.errors.join(" · ") : "Ready"}</td></tr>)}</tbody></table></div>{rows.length > 30 && <p className="mt-2 text-xs text-muted">Showing the first 30 rows. All {rows.length} rows are validated.</p>}</>}
    </div>
    <aside className="panel h-fit p-5 lg:sticky lg:top-24"><p className="micro">Output</p><h2 className="mt-2 font-display text-xl font-bold">Pack the run.</h2><div className="segmented mt-5"><button aria-pressed={format === "png"} onClick={() => setFormat("png")}>PNG · 768px</button><button aria-pressed={format === "svg"} onClick={() => setFormat("svg")}>Vector SVG</button></div><div className="relative mt-6 grid h-40 place-items-center overflow-hidden rounded-[14px] border-2 border-ink bg-elevated"><div className="absolute inset-x-8 bottom-5 h-16 rounded-b-[12px] border-2 border-ink bg-surface" /><div className="absolute bottom-16 left-1/2 flex w-40 -translate-x-1/2 flex-wrap-reverse justify-center gap-1">{Array.from({ length: Math.min(20, Math.ceil(progress / Math.max(1, valid.length) * 20)) }, (_, i) => <motion.span key={i} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="h-5 w-5 rounded-[2px] border border-ink bg-white p-0.5"><span className="block h-full w-full bg-[linear-gradient(90deg,#14121F_35%,transparent_35%,transparent_65%,#14121F_65%),linear-gradient(#14121F_35%,transparent_35%,transparent_65%,#14121F_65%)]" /></motion.span>)}</div><span className="absolute bottom-8 z-10 rounded bg-surface px-2 font-mono text-xs font-semibold">{working ? `${progress} / ${valid.length}` : "ZIP BOX"}</span></div><div aria-live="polite" className="sr-only">{working ? `Generated ${progress} of ${valid.length}` : ""}</div><button className="btn btn-primary mt-5 w-full" disabled={!valid.length || Boolean(working)} onClick={() => void generateZip()}><DownloadSimple size={18} />{working === "zip" ? `Generating ${progress}/${valid.length}` : `Download ${format.toUpperCase()} ZIP`}</button><button className="btn btn-secondary mt-2 w-full" disabled={!valid.length || Boolean(working)} onClick={() => void generateSheet()}><DownloadSimple size={18} />{working === "sheet" ? `Imposing ${progress}/${valid.length}` : "3×8 label sheet PDF"}</button><p className="help mt-4">Large jobs are chunked between frames to keep the page responsive. Duplicated filenames receive a numeric suffix. Malformed or blocked rows are excluded, never silently “fixed.”</p>{invalid.length > 0 && <button className="btn btn-ghost mt-3 w-full text-xs" onClick={() => saveBlob(new Blob([["row,errors", ...invalid.map((r) => `${r.row},"${r.errors.join("; ").replace(/"/g, '""')}"`)].join("\n")], { type: "text/csv" }), "qrforge-validation-errors.csv")}><X size={15} /> Download error report</button>}</aside></section>
    <AnimatePresence>{working && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-x-0 bottom-20 z-40 mx-auto w-fit rounded-full border border-ink bg-surface px-5 py-3 font-mono text-xs shadow-[3px_3px_0_var(--ink)] md:bottom-6">Rendering locally · {progress} / {valid.length}</motion.div>}</AnimatePresence>
  </main>;
}
