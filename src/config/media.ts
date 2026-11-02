export const MEDIA = {
  landing: {
    heroFallback: "paper-gradient-qr",
    useCases: [
      { id: "menu", src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80", alt: "Restaurant table prepared for a printed menu", credit: "Unsplash — restaurant table photography" },
      { id: "cafe", src: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80", alt: "Independent cafe counter for a Wi-Fi sign", credit: "Unsplash — cafe interior photography" },
      { id: "event", src: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=80", alt: "Crowd at an event for check-in code mockups", credit: "Unsplash — event photography" },
      { id: "packaging", src: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80", alt: "Product packaging for a label template", credit: "Unsplash — packaging photography" },
    ],
  },
  templates: { fallback: "paper-gradient-qr", mockups: "Original inline SVG/CSS print layouts; no proprietary artwork." },
  avatars: { provider: "https://api.dicebear.com/9.x/shapes/svg", license: "DiceBear Shapes — MIT / CC0 depending on style; see dicebear.com" },
  maps: { tiles: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "&copy; OpenStreetMap contributors", license: "ODbL 1.0" },
  fonts: {
    headings: "https://fonts.google.com/specimen/Space+Grotesk",
    body: "https://fonts.google.com/specimen/Inter",
    mono: "https://fonts.google.com/specimen/JetBrains+Mono",
    license: "SIL Open Font License 1.1",
  },
  geo: { mode: "Deterministic local demo lookup", license: "No external IP API is called. Replace with DB-IP Lite (CC BY 4.0) or licensed GeoLite2 for production." },
  sounds: { enabledByDefault: false, source: "No audio bundled; optional CC0 Pixabay/Freesound hooks are intentionally disabled." },
} as const;

export const MEDIA_CREDITS = [
  { name: "OpenStreetMap", use: "Geo picker map tiles", license: "ODbL 1.0", url: "https://www.openstreetmap.org/copyright" },
  { name: "Unsplash contributors", use: "Use-case photography with CSS paper fallbacks", license: "Unsplash License", url: "https://unsplash.com/license" },
  { name: "Google Fonts", use: "Space Grotesk, Inter, JetBrains Mono", license: "SIL OFL 1.1", url: "https://fonts.google.com/" },
  { name: "Phosphor Icons", use: "Original interface iconography", license: "MIT", url: "https://phosphoricons.com/" },
  { name: "Denso Wave", use: "QR trademark acknowledgment only; no assets used", license: "QR Code is a registered trademark of Denso Wave Incorporated", url: "https://www.qrcode.com/en/faq.html" },
];
