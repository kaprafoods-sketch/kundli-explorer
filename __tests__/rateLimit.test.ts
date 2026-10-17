/**
 * Rate limiter contract for Task P5.
 *
 * Exercises the sliding-window logic in isolation with fake timers:
 * allow-until-limit, 429 semantics (allowed=false + retryAfter>0), window
 * expiry, per-key isolation, lockout not extended by hammering, and the
 * identity/IP helpers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkRateLimit,
  rateLimitKey,
  ipFromHeaders,
  resetRateLimits,
  GRAHA_AI_RATE_LIMIT,
  CREATE_CHART_RATE_LIMIT,
  MAX_GRAHA_MESSAGE_CHARS,
} from "@/lib/rateLimit";

beforeEach(() => {
  resetRateLimits();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-17T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("checkRateLimit", () => {
  it("allows up to the limit, then denies with a Retry-After", () => {
    const { limit, windowMs } = GRAHA_AI_RATE_LIMIT;
    for (let i = 0; i < limit; i++) {
      const r = checkRateLimit("k", limit, windowMs);
      expect(r.allowed).toBe(true);
      expect(r.retryAfter).toBe(0);
    }
    const blocked = checkRateLimit("k", limit, windowMs);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.retryAfter).toBeLessThanOrEqual(60);
  });

  it("frees slots once the window expires", () => {
    const { limit, windowMs } = GRAHA_AI_RATE_LIMIT;
    for (let i = 0; i < limit; i++) checkRateLimit("k", limit, windowMs);
    expect(checkRateLimit("k", limit, windowMs).allowed).toBe(false);

    vi.advanceTimersByTime(windowMs + 1);
    const r = checkRateLimit("k", limit, windowMs);
    expect(r.allowed).toBe(true);
    expect(r.retryAfter).toBe(0);
  });

  it("frees slots gradually as hits age out (sliding, not fixed window)", () => {
    const { limit, windowMs } = GRAHA_AI_RATE_LIMIT; // 10 per 60s
    for (let i = 0; i < limit; i++) checkRateLimit("k", limit, windowMs);

    // 30s in: all 10 original hits still inside the 60s window → still blocked.
    vi.advanceTimersByTime(30_000);
    expect(checkRateLimit("k", limit, windowMs).allowed).toBe(false);

    // 61s in: all 10 original hits aged out → full window available again.
    vi.advanceTimersByTime(31_000);
    for (let i = 0; i < limit; i++) {
      expect(checkRateLimit("k", limit, windowMs).allowed).toBe(true);
    }
  });

  it("does not extend the lockout while blocked (denied hits are not recorded)", () => {
    const { limit, windowMs } = GRAHA_AI_RATE_LIMIT;
    for (let i = 0; i < limit; i++) checkRateLimit("k", limit, windowMs);
    for (let i = 0; i < 50; i++) checkRateLimit("k", limit, windowMs); // hammer

    vi.advanceTimersByTime(windowMs + 1);
    expect(checkRateLimit("k", limit, windowMs).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const { limit, windowMs } = GRAHA_AI_RATE_LIMIT;
    for (let i = 0; i < limit; i++) checkRateLimit("alice", limit, windowMs);
    expect(checkRateLimit("alice", limit, windowMs).allowed).toBe(false);
    expect(checkRateLimit("bob", limit, windowMs).allowed).toBe(true);
  });

  it("retryAfter shrinks as the window elapses", () => {
    const { limit, windowMs } = GRAHA_AI_RATE_LIMIT;
    for (let i = 0; i < limit; i++) checkRateLimit("k", limit, windowMs);
    const first = checkRateLimit("k", limit, windowMs).retryAfter;
    vi.advanceTimersByTime(30_000);
    const later = checkRateLimit("k", limit, windowMs).retryAfter;
    expect(later).toBeLessThan(first);
  });
});

describe("chart-creation limits", () => {
  it("uses 5 per 10 minutes", () => {
    expect(CREATE_CHART_RATE_LIMIT.limit).toBe(5);
    expect(CREATE_CHART_RATE_LIMIT.windowMs).toBe(10 * 60_000);
    for (let i = 0; i < 5; i++) {
      expect(
        checkRateLimit("c", CREATE_CHART_RATE_LIMIT.limit, CREATE_CHART_RATE_LIMIT.windowMs)
          .allowed
      ).toBe(true);
    }
    expect(
      checkRateLimit("c", CREATE_CHART_RATE_LIMIT.limit, CREATE_CHART_RATE_LIMIT.windowMs).allowed
    ).toBe(false);
  });
});

describe("rateLimitKey", () => {
  it("prefers the owner token, falls back to IP, then a shared anon bucket", () => {
    expect(rateLimitKey("p", "tok-123", "1.2.3.4")).toBe("p:owner:tok-123");
    expect(rateLimitKey("p", undefined, "1.2.3.4")).toBe("p:ip:1.2.3.4");
    expect(rateLimitKey("p", null, null)).toBe("p:anon");
  });

  it("prefixes keep the two endpoints in separate buckets", () => {
    const { limit, windowMs } = GRAHA_AI_RATE_LIMIT;
    const aiKey = rateLimitKey(GRAHA_AI_RATE_LIMIT.prefix, "tok", null);
    const chartKey = rateLimitKey(CREATE_CHART_RATE_LIMIT.prefix, "tok", null);
    expect(aiKey).not.toBe(chartKey);
    for (let i = 0; i < limit; i++) checkRateLimit(aiKey, limit, windowMs);
    expect(checkRateLimit(aiKey, limit, windowMs).allowed).toBe(false);
    expect(checkRateLimit(chartKey, limit, windowMs).allowed).toBe(true);
  });
});

describe("ipFromHeaders", () => {
  it("takes the first x-forwarded-for entry", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.9, 70.41.3.18" });
    expect(ipFromHeaders(h)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip", () => {
    const h = new Headers({ "x-real-ip": "198.51.100.7" });
    expect(ipFromHeaders(h)).toBe("198.51.100.7");
  });

  it("returns null when neither header is present", () => {
    expect(ipFromHeaders(new Headers())).toBeNull();
  });
});

describe("message cap constant", () => {
  it("is 2000 chars", () => {
    expect(MAX_GRAHA_MESSAGE_CHARS).toBe(2000);
  });
});
