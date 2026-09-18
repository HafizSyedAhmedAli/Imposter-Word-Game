/**
 * Minimal in-memory fixed-window rate limiter, keyed by client IP.
 *
 * This is intentionally simple rather than reaching for Vercel KV/Upstash:
 * it needs no new service, no signup, and no env vars, and it directly
 * stops the threat that matters here -- a single script hammering
 * /api/round/generate from one IP and burning Gemini API quota. Because
 * state lives in the Node process, it resets on cold start and isn't
 * shared across concurrent serverless instances, so it's not a hard
 * global cap. That's an acceptable tradeoff for this endpoint: a failed
 * request here just falls back to the app's local word list (see the
 * route's own doc comment), so under-limiting in rare multi-instance
 * bursts is harmless to gameplay -- it only bounds the failure mode this
 * was added for (one IP scripting requests against a discovered URL).
 * If usage grows enough that this stops being good enough, swap this
 * module for Upstash Redis's rate limiter without changing the route's
 * call site.
 */

type Bucket = {
  count: number;
  windowStartMs: number;
};

const buckets = new Map<string, Bucket>();

// Cap how many distinct IPs we track at once so a distributed flood
// can't grow this Map without bound and leak memory across the
// lambda's lifetime.
const MAX_TRACKED_IPS = 5000;

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the caller may retry, only set when `allowed` is false. */
  retryAfterSeconds?: number;
};

/**
 * Fixed-window limiter: `limit` requests per `windowMs` per key.
 * Not sliding/token-bucket -- deliberately simple, since precise fairness
 * doesn't matter for this use case, only bounding worst-case volume.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStartMs >= windowMs) {
    // Evict oldest entries if we're at capacity and this is a new key,
    // rather than letting the Map grow unbounded.
    if (!existing && buckets.size >= MAX_TRACKED_IPS) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey !== undefined) buckets.delete(oldestKey);
    }
    buckets.set(key, { count: 1, windowStartMs: now });
    return { allowed: true };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.ceil(
      (existing.windowStartMs + windowMs - now) / 1000,
    );
    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true };
}

/**
 * Best-effort client IP extraction for a Vercel-hosted Next.js route.
 * Vercel sets x-forwarded-for; the first entry is the original client.
 * Falls back to a constant so requests without the header still share
 * one bucket rather than bypassing the limit entirely.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
