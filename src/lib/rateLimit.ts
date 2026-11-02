type Bucket = { count: number; resetAt: number };
const globalBuckets = globalThis as typeof globalThis & { __qrForgeRateLimits?: Map<string, Bucket> };
const buckets = globalBuckets.__qrForgeRateLimits ?? new Map<string, Bucket>();
globalBuckets.__qrForgeRateLimits = buckets;

export function rateLimit(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now(); const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  current.count += 1;
  if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  return { allowed: current.count <= limit, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt };
}

export function requestKey(request: Request, scope: string) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return `${scope}:${ip}`;
}

export function rateHeaders(result: ReturnType<typeof rateLimit>) {
  return { "X-RateLimit-Remaining": String(result.remaining), "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)) };
}
