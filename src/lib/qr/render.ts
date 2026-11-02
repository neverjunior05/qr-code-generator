import QRCode from "qrcode";
import type { CornerStyle, DotStyle, QrDesign } from "./types";

export type QrMatrix = { size: number; data: Uint8Array; get: (x: number, y: number) => boolean };

export function createMatrix(data: string, errorCorrection: QrDesign["errorCorrection"]): QrMatrix {
  const qr = QRCode.create(data, { errorCorrectionLevel: errorCorrection });
  const source = qr.modules;
  return { size: source.size, data: source.data, get: (x, y) => Boolean(source.data[y * source.size + x]) };
}

const esc = (value: string) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
const f = (n: number) => Number(n.toFixed(3));

function roundedRect(x: number, y: number, w: number, h: number, radii: [number, number, number, number]) {
  const [tl, tr, br, bl] = radii;
  return `M${f(x + tl)},${f(y)}H${f(x + w - tr)}Q${f(x + w)},${f(y)} ${f(x + w)},${f(y + tr)}V${f(y + h - br)}Q${f(x + w)},${f(y + h)} ${f(x + w - br)},${f(y + h)}H${f(x + bl)}Q${f(x)},${f(y + h)} ${f(x)},${f(y + h - bl)}V${f(y + tl)}Q${f(x)},${f(y)} ${f(x + tl)},${f(y)}Z`;
}

function modulePath(x: number, y: number, style: DotStyle) {
  const pad = style === "dots" ? 0.11 : 0.025;
  const w = 1 - pad * 2;
  if (style === "dots") {
    const cx = x + 0.5; const cy = y + 0.5; const r = 0.39;
    return `M${f(cx - r)},${f(cy)}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 ${-r * 2},0Z`;
  }
  if (style === "square") return `M${x},${y}h1v1h-1Z`;
  if (style === "classy") return roundedRect(x + pad, y + pad, w, w, [0.06, 0.48, 0.06, 0.48]);
  const r = style === "extra-rounded" ? 0.48 : 0.22;
  return roundedRect(x + pad, y + pad, w, w, [r, r, r, r]);
}

function cornerRadii(style: CornerStyle, outer = false): [number, number, number, number] {
  if (style === "square") return [0, 0, 0, 0];
  if (style === "rounded") return [1.15, 1.15, 1.15, 1.15];
  if (style === "extra-rounded") return [2.4, 2.4, 2.4, 2.4];
  if (style === "classy") return outer ? [0.3, 2.4, 0.3, 2.4] : [0.15, 0.9, 0.15, 0.9];
  return [3.5, 3.5, 3.5, 3.5];
}

function finderPath(x: number, y: number, outerStyle: CornerStyle, dotStyle: CornerStyle) {
  const outer = roundedRect(x, y, 7, 7, cornerRadii(outerStyle, true));
  const hole = roundedRect(x + 1, y + 1, 5, 5, cornerRadii(outerStyle).map((r) => Math.max(0.3, r * 0.65)) as [number, number, number, number]);
  const dot = roundedRect(x + 2, y + 2, 3, 3, cornerRadii(dotStyle));
  return `${outer}${hole}${dot}`;
}

function safeLogo(logo: string) {
  if (/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(logo)) return logo;
  try { const url = new URL(logo); if (["https:", "http:"].includes(url.protocol)) return esc(url.toString()); } catch { /* ignored invalid logo */ }
  return "";
}

export function renderMatrixSvg(matrix: QrMatrix, design: QrDesign, options: { animated?: boolean; title?: string; description?: string } = {}) {
  const count = matrix.size; const quiet = design.margin; const total = count + quiet * 2;
  const paths: string[] = [];
  for (let y = 0; y < count; y++) {
    for (let x = 0; x < count; x++) {
      const inFinder = (x < 7 && y < 7) || (x >= count - 7 && y < 7) || (x < 7 && y >= count - 7);
      if (!inFinder && matrix.get(x, y)) paths.push(modulePath(x + quiet, y + quiet, design.dotStyle));
    }
  }
  const finders = finderPath(quiet, quiet, design.cornerSquareStyle, design.cornerDotStyle)
    + finderPath(total - quiet - 7, quiet, design.cornerSquareStyle, design.cornerDotStyle)
    + finderPath(quiet, total - quiet - 7, design.cornerSquareStyle, design.cornerDotStyle);
  const gradient = design.gradientType === "none" ? "" : design.gradientType === "radial"
    ? `<radialGradient id="qf-fill" cx="35%" cy="30%" r="85%"><stop offset="0" stop-color="${esc(design.gradientColor)}"/><stop offset="1" stop-color="${esc(design.foreground)}"/></radialGradient>`
    : `<linearGradient id="qf-fill" gradientTransform="rotate(${design.gradientRotation} .5 .5)"><stop offset="0" stop-color="${esc(design.foreground)}"/><stop offset="1" stop-color="${esc(design.gradientColor)}"/></linearGradient>`;
  const fill = design.gradientType === "none" ? esc(design.foreground) : "url(#qf-fill)";
  const logo = safeLogo(design.logo);
  const logoWidth = logo ? total * Math.max(0.1, Math.min(0.3, design.logoSize / 100)) : 0;
  const logoX = (total - logoWidth) / 2;
  const animation = options.animated ? `<style>.qf-modules{transform-box:fill-box;transform-origin:center;animation:qf-settle .22s cubic-bezier(.2,.8,.2,1)}@keyframes qf-settle{from{opacity:.45;transform:scale(.96)}to{opacity:1;transform:scale(1)}}@media(prefers-reduced-motion:reduce){.qf-modules{animation:none}}</style>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${total} ${total}" role="img" aria-label="${esc(options.title ?? "QR code")}"><title>${esc(options.title ?? "QR code")}</title><desc>${esc(options.description ?? "Scannable QR code generated locally by QRForge")}</desc>${animation}<defs>${gradient}</defs><path fill="${esc(design.background)}" d="M0 0h${total}v${total}H0Z"/><g class="qf-modules" fill="${fill}"><path fill-rule="evenodd" d="${finders}"/><path d="${paths.join("")}"/></g>${logo ? `<rect x="${f(logoX - 0.6)}" y="${f(logoX - 0.6)}" width="${f(logoWidth + 1.2)}" height="${f(logoWidth + 1.2)}" rx="${f(logoWidth * 0.18)}" fill="${esc(design.background)}"/><image x="${f(logoX)}" y="${f(logoX)}" width="${f(logoWidth)}" height="${f(logoWidth)}" preserveAspectRatio="xMidYMid meet" href="${logo}" xlink:href="${logo}"/>` : ""}</svg>`;
}

function frameWrap(inner: string, design: QrDesign) {
  if (design.frame === "none") return inner;
  const id = design.frame; const ink = esc(design.foreground); const paper = esc(design.background); const accent = esc(design.frameColor);
  const cta = esc((design.frameText || "SCAN ME").slice(0, 28).toUpperCase());
  const text = (x: number, y: number, size = 30, color = paper) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Space Grotesk,Arial,sans-serif" font-weight="700" font-size="${size}" letter-spacing="3" fill="${color}">${cta}</text>`;
  let height = 1080; let qrX = 110; let qrY = 85; let qrSize = 780; let decorations = "";
  if (id === "sticker") { height = 1120; decorations = `<rect x="30" y="30" width="940" height="1060" rx="90" fill="${paper}" stroke="${ink}" stroke-width="10"/><rect x="245" y="950" width="510" height="92" rx="46" fill="${accent}"/>${text(500, 1010)}`; }
  else if (id === "ticket") { height = 1130; qrY = 105; decorations = `<path d="M50 30H950V430a28 28 0 0 0 0 56v594H50V486a28 28 0 0 0 0-56Z" fill="${paper}" stroke="${ink}" stroke-width="9"/><path d="M75 920H925" stroke="${ink}" stroke-width="5" stroke-dasharray="15 12"/>${text(500, 1015, 30, ink)}<circle cx="105" cy="82" r="12" fill="${accent}"/><circle cx="895" cy="82" r="12" fill="${accent}"/>`; }
  else if (id === "arch") { height = 1140; qrY = 150; decorations = `<path d="M65 1090V390C65 150 260 45 500 45s435 105 435 345v700Z" fill="${paper}" stroke="${accent}" stroke-width="14"/><path d="M100 920H900" stroke="${accent}" stroke-width="4"/>${text(500, 1020, 30, ink)}`; }
  else if (id === "caption") { height = 1130; decorations = `<rect x="35" y="35" width="930" height="1060" rx="30" fill="${paper}" stroke="${ink}" stroke-width="9"/><path d="M35 920H965V1065Q965 1095 935 1095H65Q35 1095 35 1065Z" fill="${accent}"/>${text(500, 1030)}`; }
  else if (id === "postage") { height = 1100; decorations = `<rect x="42" y="42" width="916" height="1016" rx="12" fill="${paper}" stroke="${ink}" stroke-width="7" stroke-dasharray="6 13"/><rect x="68" y="68" width="864" height="964" fill="none" stroke="${accent}" stroke-width="3"/>${text(500, 1000, 28, ink)}`; }
  else if (id === "circle") { height = 1110; qrX = 150; qrY = 90; qrSize = 700; decorations = `<circle cx="500" cy="500" r="465" fill="${paper}" stroke="${accent}" stroke-width="15"/><circle cx="500" cy="500" r="435" fill="none" stroke="${ink}" stroke-width="3" stroke-dasharray="4 12"/><rect x="230" y="950" width="540" height="105" rx="53" fill="${accent}"/>${text(500, 1020)}`; }
  else if (id === "bubble") { height = 1160; decorations = `<path d="M90 30H910Q960 30 960 80V950Q960 1000 910 1000H590L500 1120 410 1000H90Q40 1000 40 950V80Q40 30 90 30Z" fill="${paper}" stroke="${ink}" stroke-width="9"/><rect x="255" y="890" width="490" height="82" rx="41" fill="${accent}"/>${text(500, 944, 27)}`; }
  else if (id === "tab") { height = 1130; qrY = 180; decorations = `<path d="M40 150Q40 110 80 110H260L310 40H690L740 110H920Q960 110 960 150V1050Q960 1090 920 1090H80Q40 1090 40 1050Z" fill="${paper}" stroke="${ink}" stroke-width="9"/>${text(500, 115, 27, ink)}<path d="M150 1010H850" stroke="${accent}" stroke-width="12" stroke-linecap="round"/>`; }
  else if (id === "pill") { height = 1110; decorations = `<rect x="45" y="45" width="910" height="1020" rx="160" fill="${paper}" stroke="${ink}" stroke-width="9"/><rect x="265" y="935" width="470" height="94" rx="47" fill="${accent}"/>${text(500, 996, 28)}`; }
  else { height = 1100; decorations = `<rect x="40" y="40" width="920" height="1020" fill="${paper}" stroke="${ink}" stroke-width="9"/><rect x="65" y="65" width="870" height="970" fill="none" stroke="${accent}" stroke-width="4"/>${text(500, 1005, 28, ink)}<path d="M150 940H300M700 940H850" stroke="${accent}" stroke-width="6"/>`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 ${height}" role="img" aria-label="Framed QR code"><rect width="1000" height="${height}" fill="none"/>${decorations}<svg x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" viewBox="0 0 ${/viewBox="0 0 (\d+)/.exec(inner)?.[1] ?? 40} ${/viewBox="0 0 \d+ (\d+)/.exec(inner)?.[1] ?? 40}">${inner.replace(/<svg[^>]*>|<\/svg>/g, "")}</svg></svg>`;
}

export function renderQrSvg(data: string, design: QrDesign, options: { animated?: boolean; title?: string; framed?: boolean } = {}) {
  const matrix = createMatrix(data, design.errorCorrection);
  const inner = renderMatrixSvg(matrix, design, { animated: options.animated, title: options.title, description: `Encoded content: ${data.slice(0, 500)}` });
  return options.framed === false ? inner : frameWrap(inner, design);
}

export function autoFixDesign(design: QrDesign): QrDesign {
  return { ...design, foreground: "#000000", background: "#FFFFFF", gradientType: "none", dotStyle: design.dotStyle === "dots" ? "rounded" : design.dotStyle, errorCorrection: "H", margin: Math.max(4, design.margin), size: Math.max(1024, design.size), logoSize: Math.min(18, design.logoSize), preset: "Custom · print fixed" };
}
