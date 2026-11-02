"use client";

import { renderQrSvg } from "./render";
import type { QrDesign } from "./types";

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function safeFilename(name: string) {
  return (name || "qrforge-code").normalize("NFKD").replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "-").slice(0, 80) || "qrforge-code";
}

async function encodeInWorker(svg: string, size: number, background: string): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const worker = new Worker(new URL("../../workers/imageEncode.worker.ts", import.meta.url), { type: "module" });
    const timeout = window.setTimeout(() => { worker.terminate(); reject(new Error("Worker timed out")); }, 12_000);
    worker.onmessage = (event: MessageEvent<{ blob?: Blob; error?: string }>) => { window.clearTimeout(timeout); worker.terminate(); if (event.data.blob) resolve(event.data.blob); else reject(new Error(event.data.error || "Worker failed")); };
    worker.onerror = () => { window.clearTimeout(timeout); worker.terminate(); reject(new Error("Worker unavailable")); };
    worker.postMessage({ svg, size, background });
  });
}

export async function svgToPngBlob(svg: string, size: number, background = "#FFFFFF"): Promise<Blob> {
  if ("Worker" in window && "OffscreenCanvas" in window) {
    try { return await encodeInWorker(svg, size, background); } catch { /* Main-thread canvas fallback for Safari/older SVG bitmap implementations. */ }
  }
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("The SVG could not be rasterized. Check the logo URL.")); image.src = url; });
    const canvas = document.createElement("canvas");
    const viewBox = /viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/.exec(svg);
    const ratio = viewBox ? Number(viewBox[2]) / Number(viewBox[1]) : 1;
    canvas.width = Math.max(32, Math.round(size)); canvas.height = Math.max(32, Math.round(size * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable in this browser.");
    context.fillStyle = background; context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG encoding failed.")), "image/png"));
  } finally { URL.revokeObjectURL(url); }
}

export async function exportSvg(data: string, design: QrDesign, name: string) {
  saveBlob(new Blob([renderQrSvg(data, design)], { type: "image/svg+xml" }), `${safeFilename(name)}.svg`);
}

export async function exportPng(data: string, design: QrDesign, name: string, size = design.size) {
  const blob = await svgToPngBlob(renderQrSvg(data, design), size, design.background);
  saveBlob(blob, `${safeFilename(name)}-${size}px.png`);
}

export type PdfOptions = { unit: "mm" | "in"; physicalSize: number; bleed: boolean; title?: string; subtitle?: string; template?: "plain" | "menu" | "wifi" | "business" | "ticket" | "label" | "tent" | "feedback" };

export async function exportPdf(data: string, design: QrDesign, name: string, options: PdfOptions) {
  const { jsPDF } = await import("jspdf");
  const unit = options.unit; const physical = Math.max(unit === "mm" ? 15 : 0.6, Math.min(unit === "mm" ? 180 : 7, options.physicalSize));
  const bleed = options.bleed ? (unit === "mm" ? 3 : 0.118) : 0;
  const pageW = unit === "mm" ? 210 : 8.27; const pageH = unit === "mm" ? 297 : 11.69;
  const pdf = new jsPDF({ orientation: "portrait", unit, format: [pageW, pageH], compress: true });
  const pixels = Math.min(4096, Math.max(600, Math.round((physical / (unit === "mm" ? 25.4 : 1)) * 300)));
  const blob = await svgToPngBlob(renderQrSvg(data, design), pixels, design.background);
  const dataUrl = await blobToDataUrl(blob);
  const ink = [20, 18, 31] as const;
  pdf.setFillColor(251, 249, 244); pdf.rect(0, 0, pageW, pageH, "F");
  const centerX = pageW / 2; let y = pageH * 0.23;
  if (options.template && options.template !== "plain") {
    pdf.setTextColor(...ink); pdf.setFont("helvetica", "bold"); pdf.setFontSize(unit === "mm" ? 28 : 28);
    pdf.text((options.title || "SCAN TO EXPLORE").toUpperCase(), centerX, unit === "mm" ? 30 : 1.18, { align: "center", maxWidth: pageW - 30 });
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(11); pdf.setTextColor(80, 75, 96);
    pdf.text(options.subtitle || "Point your camera at the code", centerX, unit === "mm" ? 42 : 1.65, { align: "center", maxWidth: pageW - 40 });
    y = unit === "mm" ? 58 : 2.3;
  }
  const x = centerX - physical / 2 - bleed; const qrY = y - bleed;
  if (bleed) { pdf.setFillColor(255, 255, 255); pdf.rect(x, qrY, physical + bleed * 2, physical + bleed * 2, "F"); }
  pdf.addImage(dataUrl, "PNG", centerX - physical / 2, y, physical, physical, undefined, "FAST");
  if (options.bleed) drawCropMarks(pdf, x, qrY, physical + bleed * 2, physical + bleed * 2, unit);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(80, 75, 96);
  const footerY = Math.min(pageH - 15, y + physical + 15);
  pdf.text(`${physical} ${unit} · ${design.errorCorrection} error correction · Generated locally by QRForge`, centerX, footerY, { align: "center" });
  if (options.template === "tent") {
    pdf.setDrawColor(180, 175, 165); pdf.setLineDashPattern([3, 3], 0); pdf.line(0, pageH / 2, pageW, pageH / 2); pdf.setLineDashPattern([], 0);
    pdf.text("FOLD HERE", 8, pageH / 2 - 3);
  }
  pdf.save(`${safeFilename(name)}-${physical}${unit}.pdf`);
}

function drawCropMarks(pdf: import("jspdf").jsPDF, x: number, y: number, w: number, h: number, unit: "mm" | "in") {
  const len = unit === "mm" ? 4 : 0.16; const gap = unit === "mm" ? 1 : 0.04;
  pdf.setDrawColor(20, 18, 31); pdf.setLineWidth(unit === "mm" ? 0.25 : 0.01);
  [[x, y, -1, -1], [x + w, y, 1, -1], [x, y + h, -1, 1], [x + w, y + h, 1, 1]].forEach(([cx, cy, sx, sy]) => {
    pdf.line(cx + sx * gap, cy, cx + sx * (gap + len), cy); pdf.line(cx, cy + sy * gap, cx, cy + sy * (gap + len));
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
}

export async function copyQrToClipboard(data: string, design: QrDesign) {
  const svg = renderQrSvg(data, design);
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      const blob = await svgToPngBlob(svg, 1024, design.background);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); return "PNG copied to clipboard";
    } catch { /* fall through to SVG text */ }
  }
  await navigator.clipboard.writeText(svg); return "SVG markup copied (PNG clipboard unavailable)";
}

export async function exportTextEquivalent(data: string, name: string) {
  saveBlob(new Blob([`QRForge accessible text equivalent\n\nEncoded content:\n${data}\n`], { type: "text/plain;charset=utf-8" }), `${safeFilename(name)}-content.txt`);
}
