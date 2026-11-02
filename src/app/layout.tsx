import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "QRForge — Make every scan beautifully useful", template: "%s · QRForge" },
  description: "A private, precise QR design studio. Create, style, print, scan, and manage static or dynamic QR codes with local PNG, SVG and PDF exports.",
  keywords: ["QR code generator", "Wi-Fi QR code", "SVG QR code", "private QR designer", "bulk QR codes"],
  openGraph: { title: "QRForge — The print studio for QR codes", description: "Design scan-safe codes. Export anywhere. Track only what matters.", type: "website", images: [{ url: "/og-image.svg", width: 1200, height: 630 }] },
  robots: { index: true, follow: true }, manifest: "/manifest.json",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: light)", color: "#FBF9F4" }, { media: "(prefers-color-scheme: dark)", color: "#0D0F1E" }] };

const themeScript = `try{const t=localStorage.getItem('qrforge-theme')||'auto';const d=t==='dark'||(t==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);const r=localStorage.getItem('qrforge-reduce-motion');if(r)document.documentElement.dataset.reduceMotion=r}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" suppressHydrationWarning>
    <head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" /><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
    <body><AppProviders><SiteHeader />{children}<SiteFooter /></AppProviders><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "QRForge", applicationCategory: "DesignApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Independent local-first QR code generator and print design studio." }) }} /></body>
  </html>;
}
