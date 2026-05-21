/**
 * Token-bucket rate limiter, in-memory. Single-region Vercel friendly.
 *
 * Each (key, bucket-name) pair gets its own bucket. The bucket holds `limit`
 * tokens that refill linearly over `windowMs`. Calling `checkRateLimit` consumes
 * one token; if the bucket is empty, returns ok:false with a `retryAfterMs`.
 *
 * Buckets are auto-pruned after their resetAt + windowMs to keep the Map small.
 *
 * NOT durable across deploys / restarts — fine for soft abuse-prevention.
 * For multi-region or strict billing, swap for Upstash Redis with the same API.
 */

interface Bucket {
  tokens: number;
  resetAt: number;
}

interface CheckOptions {
  /** Bucket name — e.g. "api-agents", "feed". Combined with `key` to form the map key. */
  name: string;
  /** Identifier — usually the IP. */
  key: string;
  /** Number of requests permitted per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

const buckets = new Map<string, Bucket>();
const PRUNE_AFTER_MS = 60 * 60 * 1000;
let lastPrune = 0;

function pruneIfStale(now: number): void {
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  for (const [k, b] of buckets) {
    if (now - b.resetAt > PRUNE_AFTER_MS) buckets.delete(k);
  }
}

export function checkRateLimit(opts: CheckOptions): RateLimitResult {
  const now = Date.now();
  pruneIfStale(now);

  const mapKey = `${opts.name}:${opts.key}`;
  let bucket = buckets.get(mapKey);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { tokens: opts.limit, resetAt: now + opts.windowMs };
    buckets.set(mapKey, bucket);
  }

  if (bucket.tokens <= 0) {
    return {
      ok: false,
      limit: opts.limit,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterMs: Math.max(0, bucket.resetAt - now),
    };
  }

  bucket.tokens -= 1;
  return {
    ok: true,
    limit: opts.limit,
    remaining: bucket.tokens,
    resetAt: bucket.resetAt,
    retryAfterMs: 0,
  };
}

/**
 * Extract a stable client identifier from a Next.js Request.
 * Reads x-forwarded-for (Vercel proxy chain), x-real-ip, then falls back to
 * a static "unknown" so same-origin local dev still works.
 */
export function clientKeyFromRequest(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    // First entry is the original client (Vercel appends downstream proxies)
    return xff.split(",")[0].trim();
  }
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri.trim();
  return "unknown";
}

/** Test-only — reset all buckets between cases. */
export function _resetRateLimitBuckets(): void {
  buckets.clear();
  lastPrune = 0;
}

/** Test-only — return the number of tracked buckets. */
export function _bucketCount(): number {
  return buckets.size;
}
