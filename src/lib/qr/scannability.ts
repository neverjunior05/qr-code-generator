import type { QrDesign } from "./types";

export type ScanIssue = { id: string; label: string; detail: string; severity: "good" | "info" | "warning" | "error" };
export type ScanReport = { score: number; label: string; issues: ScanIssue[]; contrast: number; modules: number; density: string };

function channel(hex: string, start: number) { return parseInt(hex.slice(start, start + 2), 16) / 255; }
export function luminance(hex: string) {
  const safe = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#000000";
  const values = [channel(safe, 1), channel(safe, 3), channel(safe, 5)].map((v) => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
export function contrastRatio(a: string, b: string) {
  const l1 = luminance(a); const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function scoreScannability(design: QrDesign, byteLength: number, modules = 33): ScanReport {
  const colors = design.gradientType === "none" ? [design.foreground] : [design.foreground, design.gradientColor];
  const contrasts = colors.map((c) => contrastRatio(c, design.background));
  const contrast = Math.min(...contrasts);
  const inverted = luminance(design.background) < Math.max(...colors.map(luminance));
  const issues: ScanIssue[] = [];
  let score = 100;

  if (contrast < 3) { score -= 42; issues.push({ id: "contrast", label: "Contrast is too low", detail: `${contrast.toFixed(1)}:1. Aim for at least 4.5:1; dark modules on a light, quiet background work best.`, severity: "error" }); }
  else if (contrast < 4.5) { score -= 18; issues.push({ id: "contrast", label: "Contrast is marginal", detail: `${contrast.toFixed(1)}:1 at the weakest gradient stop. Auto-fix can restore print contrast.`, severity: "warning" }); }
  else issues.push({ id: "contrast", label: "Strong module contrast", detail: `${contrast.toFixed(1)}:1 minimum contrast across the fill.`, severity: "good" });

  if (inverted) { score -= 20; issues.push({ id: "inverted", label: "Inverted QR colors", detail: "Some camera apps struggle with light modules on dark backgrounds. Test physically before printing.", severity: "warning" }); }
  if (design.gradientType !== "none" && Math.max(...contrasts) - contrast > 5) { score -= 8; issues.push({ id: "gradient", label: "Uneven gradient contrast", detail: "One end of the gradient is much lighter. Use stops with similar luminance.", severity: "warning" }); }
  if (design.margin < 2) { score -= 30; issues.push({ id: "quiet", label: "Quiet zone is too small", detail: "Use at least 4 modules of clear space around every edge.", severity: "error" }); }
  else if (design.margin < 4) { score -= 12; issues.push({ id: "quiet", label: "Quiet zone is tight", detail: `${design.margin} modules detected; 4 or more is recommended.`, severity: "warning" }); }
  else issues.push({ id: "quiet", label: "Quiet zone protected", detail: `${design.margin} modules of clear space surround the code.`, severity: "good" });

  if (design.size < 256) { score -= 12; issues.push({ id: "size", label: "Small export size", detail: "Exports below 256 px can blur when resized. Use 1024 px or vector SVG for print.", severity: "warning" }); }
  if (modules > 65 || byteLength > 700) { score -= 24; issues.push({ id: "density", label: "Very high data density", detail: `${modules}×${modules} modules. Shorten the content or switch to a dynamic short link.`, severity: "error" }); }
  else if (modules > 45 || byteLength > 350) { score -= 12; issues.push({ id: "density", label: "Dense module grid", detail: `${modules}×${modules} modules. Print at least 3 cm wide and test at reading distance.`, severity: "warning" }); }
  else issues.push({ id: "density", label: "Comfortable density", detail: `${modules}×${modules} modules for ${byteLength} UTF-8 bytes.`, severity: "good" });

  const logoArea = design.logo ? (design.logoSize / 100) ** 2 : 0;
  const ecCapacity = { L: 0.07, M: 0.15, Q: 0.25, H: 0.30 }[design.errorCorrection];
  if (design.logo && logoArea > ecCapacity * 0.75) { score -= 25; issues.push({ id: "logo", label: "Logo covers too much data", detail: `The logo occupies about ${Math.round(logoArea * 100)}% of the area. Shrink it or raise error correction to H.`, severity: "error" }); }
  else if (design.logo && design.errorCorrection !== "H" && design.errorCorrection !== "Q") { score -= 10; issues.push({ id: "logo", label: "Logo needs more redundancy", detail: "Use Q or H error correction when covering center modules with a logo.", severity: "warning" }); }
  else if (design.logo) issues.push({ id: "logo", label: "Logo coverage safeguarded", detail: `${Math.round(logoArea * 100)}% estimated area with level ${design.errorCorrection} redundancy.`, severity: "good" });

  if (design.dotStyle === "dots" && modules > 45) { score -= 5; issues.push({ id: "dots", label: "Fine dots at high density", detail: "Square or rounded modules retain more ink in dense prints.", severity: "info" }); }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const label = score >= 85 ? "Excellent" : score >= 70 ? "Good — test print" : score >= 45 ? "Risky" : "Likely to fail";
  const density = modules > 65 ? "Extreme" : modules > 45 ? "High" : modules > 33 ? "Medium" : "Low";
  return { score, label, issues, contrast, modules, density };
}
