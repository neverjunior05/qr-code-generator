"use client";

import type { PrintTemplate } from "@/config/templates";
import { applyPreset } from "./presets";
import { renderQrSvg } from "./render";
import { blobToDataUrl, safeFilename, svgToPngBlob } from "./export";

export async function exportTemplatePdf(template: PrintTemplate, data: string, heading: string, subheading: string, cta: string) {
  const { jsPDF } = await import("jspdf"); const design = { ...applyPreset(template.preset), frameText: cta };
  const dimensions = template.format === "card" ? [85, 55] : template.format === "label" ? [70, 45] : template.format === "ticket" ? [105, 148] : template.format === "a5" ? [148, 210] : [210, 297];
  const [w, h] = dimensions; const pdf = new jsPDF({ unit: "mm", format: [w, h], compress: true });
  const ink = template.preset === "midnight" || template.preset === "neon" ? [241, 240, 250] : [20, 18, 31];
  pdf.setFillColor(template.paper); pdf.rect(0, 0, w, h, "F"); pdf.setTextColor(ink[0], ink[1], ink[2]);
  const qrSize = template.format === "card" ? 30 : template.format === "label" ? 30 : template.format === "a4" ? 64 : 52;
  const pixels = Math.round(qrSize / 25.4 * 300); const png = await svgToPngBlob(renderQrSvg(data, { ...design, frame: "none" }), pixels, "#FFFFFF"); const image = await blobToDataUrl(png);
  const accent = hexRgb(template.accent); pdf.setDrawColor(accent[0], accent[1], accent[2]); pdf.setLineWidth(.6);
  const addText = (text: string, x: number, y: number, width: number, size: number, bold = false) => { pdf.setFont("helvetica", bold ? "bold" : "normal"); pdf.setFontSize(size); pdf.text(pdf.splitTextToSize(text, width), x, y); };
  if (template.format === "card") {
    addText(heading, 6, 10, 43, 13, true); addText(subheading, 6, 16, 43, 7); addText(template.details.join("\n"), 6, 25, 42, 6.5);
    pdf.addImage(image, "PNG", 51, 8, 30, 30); addText(cta, 51, 44, 30, 5.5, true); pdf.line(6, 49, 79, 49);
  } else if (template.format === "label") {
    pdf.addImage(image, "PNG", 35, 6, 30, 30); addText(heading, 4, 8, 28, 10, true); addText(subheading, 4, 14, 28, 6); addText(template.details.join("\n"), 4, 21, 28, 5.5); addText(cta, 4, 39, 28, 5.5, true); pdf.rect(2, 2, w - 4, h - 4);
  } else if (template.format === "ticket") {
    addText("ADMIT ONE", 8, 12, 88, 7, true); addText(heading, 8, 25, 88, 20, true); addText(subheading, 8, 37, 88, 8); pdf.addImage(image, "PNG", 26, 49, 52, 52); addText(cta, 26, 108, 52, 9, true); addText(template.details.join("  ·  "), 8, 120, 88, 6); pdf.setLineDashPattern([2, 2], 0); pdf.line(5, 130, 100, 130); pdf.setLineDashPattern([], 0); addText("TICKET-001  ·  KEEP THIS STUB", 8, 139, 88, 6);
  } else if (template.slug === "table-tent") {
    pdf.addImage(image, "PNG", 22, 55, 64, 64); addText(heading, 97, 66, 92, 24, true); addText(subheading, 97, 83, 92, 10); addText(cta, 97, 101, 92, 12, true); addText(template.details.join("\n"), 97, 114, 92, 8);
    pdf.setLineDashPattern([3, 3], 0); pdf.line(0, h / 2, w, h / 2); pdf.setLineDashPattern([], 0); addText("FOLD HERE", 6, h / 2 - 3, 50, 6);
    pdf.saveGraphicsState(); // Second panel is intentionally upright after the physical fold.
    addText(heading, 20, 175, 170, 24, true); addText(subheading, 20, 192, 170, 10); pdf.addImage(image, "PNG", 73, 207, 64, 64); addText(cta, 20, 282, 170, 12, true);
  } else {
    const isA4 = template.format === "a4"; addText(heading, 12, 20, w - 24, isA4 ? 27 : 20, true); addText(subheading, 12, 32, w - 24, isA4 ? 10 : 8); pdf.line(12, 40, w - 12, 40);
    const qrX = (w - qrSize) / 2; const qrY = isA4 ? 75 : 55; pdf.addImage(image, "PNG", qrX, qrY, qrSize, qrSize); addText(cta, 12, qrY + qrSize + 13, w - 24, isA4 ? 14 : 11, true); addText(template.details.join("\n"), 12, qrY + qrSize + 28, w - 24, isA4 ? 10 : 8);
    pdf.line(12, h - 22, w - 12, h - 22); addText("Generated locally with QRForge · Test a physical proof before production", 12, h - 14, w - 24, 6);
  }
  pdf.save(`${safeFilename(template.name)}-print-layout.pdf`);
}
function hexRgb(hex: string): [number, number, number] { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
