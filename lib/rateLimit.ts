/**
 * Minimal in-memory sliding-window rate limiter (Task P5).
 *
 * Threat model: the Graha AI chat endpoint streams user input to Gemini with
 * no input cap and no throttle — a pasted 100k-char message is a large token
 * bill per request, repeatable without limit. `createChartAction` similarly
 * does unthrottled ephemeris compute + DB inserts. This file provides a
 * small, dependency-free counter to bound both.
 *
 * ── SINGLE-INSTANCE LIMITER ───────────────────────────────────────────────
 * Counts live in process memory: they reset on every server restart and each
 * instance of a multi-instance / serverless deployment keeps its own count
 * (effective limit = max × instances, or never fires on serverless). This is
 * proportionate for a personal project; a future agent should swap the body
 * of `checkRateLimit` for a shared store (e.g. Upstash Ratelimit) before
 * deploying to more than one instance. The public API is designed to make
 * that swap painless: callers only depend on `checkRateLimit(key, limit,
 * windowMs) -> { allowed, retryAfter }`.
 * ──────────────────────────────────────────────────────────────────────────
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the oldest slot frees up (0 when `allowed` is true). */
  retryAfter: number;
}

/** Shared cap for Graha AI chat messages (server-enforced, client-hinted). */
export const MAX_GRAHA_MESSAGE_CHARS = 2000;

/** At most 10 Graha AI requests per owner token (or IP) per 60s. */
export const GRAHA_AI_RATE_LIMIT = { prefix: "graha-ai", limit: 10, windowMs: 60_000 };

/** At most 5 chart creations per owner token (or IP) per 10 minutes. */
export const CREATE_CHART_RATE_LIMIT = { prefix: "create-chart", limit: 5, windowMs: 10 * 60_000 };

// Timestamps (Date.now()) of recent hits, per key. Arrays stay in
// chronological order because hits are always appended.
const buckets = new Map<string, number[]>();

// The longest window any caller has used; the lazy sweep uses it so keys
// whose window fully expired are dropped instead of growing the map forever.
let longestWindowMsSeen = 0;
let checksSinceSweep = 0;
const SWEEP_EVERY = 256;

function sweep(now: number) {
  const cutoff = now - longestWindowMsSeen;
  for (const [key, hits] of buckets) {
    if (hits.length === 0 || hits[hits.length - 1] <= cutoff) {
      buckets.delete(key);
    }
  }
}

/**
 * Sliding-window check. Returns `{ allowed: true, retryAfter: 0 }` and
 * records the hit when the key is under its limit; otherwise returns
 * `{ allowed: false, retryAfter }` without recording the hit, so a blocked
 * caller can't extend its own lockout by hammering.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  if (windowMs > longestWindowMsSeen) longestWindowMsSeen = windowMs;

  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    buckets.set(key, hits); // keep the pruned list
    // Oldest surviving hit is hits[0] (chronological order).
    const retryAfter = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
    return { allowed: false, retryAfter };
  }

  hits.push(now);
  buckets.set(key, hits);

  if (++checksSinceSweep >= SWEEP_EVERY) {
    checksSinceSweep = 0;
    sweep(now);
  }
  return { allowed: true, retryAfter: 0 };
}

/**
 * Stable limiter identity: the anonymous `kx_owner` cookie first (survives
 * IP changes, matches chart ownership), then the client IP, then a shared
 * "anon" bucket as a last resort.
 */
export function rateLimitKey(
  prefix: string,
  ownerToken: string | undefined | null,
  ip: string | undefined | null
): string {
  if (ownerToken) return `${prefix}:owner:${ownerToken}`;
  if (ip) return `${prefix}:ip:${ip}`;
  return `${prefix}:anon`;
}

/** Client IP from proxy headers: `x-forwarded-for` first, then `x-real-ip`. */
export function ipFromHeaders(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  return realIp || null;
}

/** Test-only escape hatch: clear all buckets (also resets the sweep state). */
export function resetRateLimits(): void {
  buckets.clear();
  longestWindowMsSeen = 0;
  checksSinceSweep = 0;
}
