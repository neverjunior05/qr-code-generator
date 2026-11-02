"use client";

import { useEffect, useMemo, useState } from "react";
import { useBuilderStore } from "@/store/useBuilderStore";
import { encodeContent } from "@/lib/qr/encoders";
import { createMatrix, type QrMatrix } from "@/lib/qr/render";
import { scoreScannability, type ScanReport } from "@/lib/qr/scannability";

export function useQrBuilder(liveSlug?: string | null) {
  const content = useBuilderStore((s) => s.content); const design = useBuilderStore((s) => s.design); const dynamic = useBuilderStore((s) => s.dynamic);
  const [debounced, setDebounced] = useState({ content, design, dynamic, liveSlug });
  useEffect(() => { const timer = window.setTimeout(() => setDebounced({ content, design, dynamic, liveSlug }), 140); return () => window.clearTimeout(timer); }, [content, design, dynamic, liveSlug]);
  return useMemo(() => {
    const encoded = encodeContent(debounced.content);
    let data = encoded.text; let matrix: QrMatrix | null = null; let renderError = "";
    if (debounced.dynamic) {
      const base = typeof window === "undefined" ? "https://qrforge.test" : window.location.origin;
      const slug = debounced.liveSlug || "save-to-activate";
      data = `${base}/q/${slug}`;
    }
    if (data && !encoded.errors.length) {
      try { matrix = createMatrix(data, debounced.design.errorCorrection); } catch (error) { renderError = error instanceof Error ? "This content exceeds QR capacity. Shorten it or use a dynamic link." : "Unable to encode this content."; }
    }
    const bytes = new TextEncoder().encode(data).length;
    const report: ScanReport = scoreScannability(debounced.design, bytes, matrix?.size ?? 0);
    return { ...debounced, encoded, data, matrix, renderError, report, bytes };
  }, [debounced]);
}
