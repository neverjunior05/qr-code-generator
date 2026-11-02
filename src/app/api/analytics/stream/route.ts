import { scanBus } from "@/lib/analytics";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const codeId = new URL(request.url).searchParams.get("id"); const encoder = new TextEncoder();
  const stream = new ReadableStream({ start(controller) {
    const send = (payload: { codeId: string }) => { if (payload.codeId === codeId) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`)); };
    scanBus.on("scan", send); const heartbeat = setInterval(() => controller.enqueue(encoder.encode(": heartbeat\n\n")), 20_000);
    request.signal.addEventListener("abort", () => { scanBus.off("scan", send); clearInterval(heartbeat); controller.close(); });
  } });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
}
