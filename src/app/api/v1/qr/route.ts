import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { defaultDesign } from "@/lib/qr/types";
import { renderQrSvg } from "@/lib/qr/render";
import { rateHeaders, rateLimit, requestKey } from "@/lib/rateLimit";

export async function GET(request: Request) {
  const limited = rateLimit(requestKey(request, "public-image"), 120, 60_000); const headers = { ...rateHeaders(limited), "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400", "X-Content-Type-Options": "nosniff" };
  if (!limited.allowed) return NextResponse.json({ error: "Public image rate limit exceeded.", retryAfter: 60 }, { status: 429, headers });
  const url = new URL(request.url); const data = url.searchParams.get("data") || ""; const format = url.searchParams.get("format") || "svg"; const size = Math.min(2048, Math.max(64, Number(url.searchParams.get("size")) || 512));
  if (!data || new TextEncoder().encode(data).length > 2000) return NextResponse.json({ error: "Provide 1–2,000 UTF-8 bytes in the data query parameter." }, { status: 400, headers });
  if (!["svg", "png"].includes(format)) return NextResponse.json({ error: "format must be svg or png." }, { status: 400, headers });
  const foreground = /^#[0-9a-f]{6}$/i.test(url.searchParams.get("color") || "") ? url.searchParams.get("color")! : "#14121F"; const background = /^#[0-9a-f]{6}$/i.test(url.searchParams.get("bg") || "") ? url.searchParams.get("bg")! : "#FFFFFF";
  try {
    if (format === "svg") { const svg = renderQrSvg(data, { ...defaultDesign, foreground, background, margin: 4, frame: "none", size }); return new Response(svg, { headers: { ...headers, "Content-Type": "image/svg+xml; charset=utf-8", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data: https:;" } }); }
    const png = await QRCode.toBuffer(data, { type: "png", width: size, margin: 4, errorCorrectionLevel: "M", color: { dark: `${foreground}FF`, light: `${background}FF` } });
    return new Response(new Uint8Array(png), { headers: { ...headers, "Content-Type": "image/png", "Content-Length": String(png.length) } });
  } catch { return NextResponse.json({ error: "Data exceeds QR capacity or could not be encoded." }, { status: 422, headers }); }
}
