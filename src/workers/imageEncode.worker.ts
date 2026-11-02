/// <reference lib="webworker" />

type EncodeRequest = { svg: string; size: number; background: string };
self.onmessage = async (event: MessageEvent<EncodeRequest>) => {
  try {
    const { svg, size, background } = event.data; const match = /viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/.exec(svg); const ratio = match ? Number(match[2]) / Number(match[1]) : 1;
    const bitmap = await createImageBitmap(new Blob([svg], { type: "image/svg+xml;charset=utf-8" })); const canvas = new OffscreenCanvas(Math.max(32, Math.round(size)), Math.max(32, Math.round(size * ratio)));
    const context = canvas.getContext("2d"); if (!context) throw new Error("Offscreen canvas unavailable"); context.fillStyle = background; context.fillRect(0, 0, canvas.width, canvas.height); context.imageSmoothingEnabled = true; context.imageSmoothingQuality = "high"; context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    const blob = await canvas.convertToBlob({ type: "image/png" }); self.postMessage({ blob });
  } catch (error) { self.postMessage({ error: error instanceof Error ? error.message : "Worker PNG encoding failed" }); }
};
