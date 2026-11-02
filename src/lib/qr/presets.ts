import type { QrDesign } from "./types";
import { defaultDesign } from "./types";

export type Preset = { id: string; name: string; note: string; colors: [string, string, string]; design: Partial<QrDesign> };

export const PRESETS: Preset[] = [
  { id: "minimal", name: "Minimal", note: "Quiet ink, generous space", colors: ["#14121F", "#FFFFFF", "#E2DCCF"], design: { foreground: "#14121F", background: "#FFFFFF", gradientType: "none", dotStyle: "rounded", cornerSquareStyle: "extra-rounded", cornerDotStyle: "dot", frame: "none", errorCorrection: "M" } },
  { id: "neon", name: "Neon", note: "Electric indigo after dark", colors: ["#7A73FF", "#0D0F1E", "#FF4FA3"], design: { foreground: "#7A73FF", gradientColor: "#FF4FA3", background: "#0D0F1E", gradientType: "linear", dotStyle: "dots", cornerSquareStyle: "dot", cornerDotStyle: "dot", errorCorrection: "H" } },
  { id: "sunset", name: "Sunset", note: "Tangerine meets hot pink", colors: ["#B72B68", "#FFF4DF", "#FF8A3D"], design: { foreground: "#B72B68", gradientColor: "#C34B22", background: "#FFF4DF", gradientType: "linear", gradientRotation: 120, dotStyle: "classy", cornerSquareStyle: "rounded", errorCorrection: "Q" } },
  { id: "ocean", name: "Ocean", note: "Deep blue, aqua current", colors: ["#164B9B", "#F1FCFA", "#087F78"], design: { foreground: "#164B9B", gradientColor: "#087F78", background: "#F1FCFA", gradientType: "radial", dotStyle: "extra-rounded", cornerSquareStyle: "extra-rounded", errorCorrection: "Q" } },
  { id: "forest", name: "Forest", note: "Botanical two-tone ink", colors: ["#174C3B", "#F4F3E7", "#57752A"], design: { foreground: "#174C3B", gradientColor: "#405F1F", background: "#F4F3E7", gradientType: "linear", dotStyle: "classy", cornerSquareStyle: "classy", errorCorrection: "Q" } },
  { id: "midnight", name: "Midnight", note: "Soft light on night navy", colors: ["#A7A5FF", "#11152E", "#5B64B8"], design: { foreground: "#A7A5FF", gradientColor: "#7279D9", background: "#11152E", gradientType: "radial", dotStyle: "rounded", cornerSquareStyle: "rounded", errorCorrection: "H" } },
  { id: "retro", name: "Retro", note: "Riso poster overprint", colors: ["#8D2455", "#FFF2C6", "#B84B21"], design: { foreground: "#8D2455", gradientColor: "#B84B21", background: "#FFF2C6", gradientType: "linear", gradientRotation: 20, dotStyle: "square", cornerSquareStyle: "square", cornerDotStyle: "square", frame: "postage", frameText: "SCAN FOR MORE" } },
  { id: "candy", name: "Candy", note: "Playful berry modules", colors: ["#9E2364", "#FFF1F7", "#5939A8"], design: { foreground: "#9E2364", gradientColor: "#5939A8", background: "#FFF1F7", gradientType: "radial", dotStyle: "dots", cornerSquareStyle: "dot", cornerDotStyle: "dot", errorCorrection: "H" } },
  { id: "mono", name: "Mono", note: "One precise black ink", colors: ["#000000", "#FFFFFF", "#777777"], design: { foreground: "#000000", background: "#FFFFFF", gradientType: "none", dotStyle: "square", cornerSquareStyle: "square", cornerDotStyle: "square", frame: "outline", frameColor: "#000000", errorCorrection: "M" } },
  { id: "gold", name: "Gold", note: "Warm metallic-inspired ink", colors: ["#76520A", "#FFFDF5", "#A56B12"], design: { foreground: "#76520A", gradientColor: "#9A6210", background: "#FFFDF5", gradientType: "linear", dotStyle: "classy", cornerSquareStyle: "classy", frame: "arch", frameColor: "#76520A", frameText: "DISCOVER", errorCorrection: "H" } },
  { id: "glass", name: "Glass", note: "Cool translucent studio", colors: ["#30356E", "#F3F7FF", "#5364A8"], design: { foreground: "#30356E", gradientColor: "#5364A8", background: "#F3F7FF", gradientType: "radial", dotStyle: "extra-rounded", cornerSquareStyle: "extra-rounded", frame: "bubble", frameText: "HELLO", errorCorrection: "Q" } },
  { id: "print-safe", name: "Print-safe", note: "Maximum production margin", colors: ["#000000", "#FFFFFF", "#1DB97D"], design: { foreground: "#000000", background: "#FFFFFF", gradientType: "none", dotStyle: "square", cornerSquareStyle: "square", cornerDotStyle: "square", errorCorrection: "H", margin: 6, logo: "", frame: "none" } },
];

export function applyPreset(id: string): QrDesign {
  const preset = PRESETS.find((p) => p.id === id) ?? PRESETS[0];
  return { ...defaultDesign, ...preset.design, preset: preset.name };
}

export const FRAME_TEMPLATES = [
  { id: "none", name: "No frame", note: "Quiet zone only" },
  { id: "sticker", name: "Studio sticker", note: "Rounded label with CTA" },
  { id: "ticket", name: "Event ticket", note: "Perforated admission stub" },
  { id: "arch", name: "Gallery arch", note: "Editorial arched border" },
  { id: "caption", name: "Bold caption", note: "Solid bottom banner" },
  { id: "postage", name: "Postage", note: "Perforated postal edge" },
  { id: "circle", name: "Orbit", note: "Circular sticker border" },
  { id: "bubble", name: "Speech bubble", note: "Friendly pointer label" },
  { id: "tab", name: "Index tab", note: "Top-mounted label" },
  { id: "pill", name: "Pill label", note: "Compact call-to-action" },
  { id: "outline", name: "Double rule", note: "Precision print outline" },
] as const;
