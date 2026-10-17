/**
 * Validation contract for createChartAction (Task P4).
 *
 * Tests the exported zod schema in isolation: the heavy server-side deps
 * (next/navigation, next/headers, supabase, computeChart) are mocked so
 * these tests run fast with no DB, no ephemeris, and no Next context.
 */

import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: {} }));
vi.mock("@/lib/astro/computeChart", () => ({ computeChart: vi.fn() }));

import { createChartInputSchema } from "@/app/actions/createChart";

const VALID = {
  name: "Aarav Sharma",
  date: "1990-05-15",
  time: "08:30",
  timeKnown: true,
  lat: 28.6139,
  lon: 77.209,
  interests: ["career", "health"],
  depth: "deep" as const,
  intentNote: "Wanted a quick career check.",
};

function fails(input: object) {
  const r = createChartInputSchema.safeParse(input);
  expect(r.success).toBe(false);
  return r;
}

describe("createChartInputSchema", () => {
  it("accepts a fully valid input", () => {
    expect(createChartInputSchema.safeParse(VALID).success).toBe(true);
  });

  it("accepts unknown birth time without a time value", () => {
    const r = createChartInputSchema.safeParse({
      ...VALID,
      timeKnown: false,
      time: undefined,
    });
    expect(r.success).toBe(true);
  });

  // ── Latitude / longitude ──────────────────────────────────────────
  it("rejects latitude above 90", () => fails({ ...VALID, lat: 999 }));
  it("rejects latitude below −90", () => fails({ ...VALID, lat: -90.1 }));
  it("rejects longitude above 180", () => fails({ ...VALID, lon: 181 }));
  it("rejects longitude below −180", () => fails({ ...VALID, lon: -200 }));
  it("rejects NaN latitude / longitude", () => {
    fails({ ...VALID, lat: NaN });
    fails({ ...VALID, lon: NaN });
  });
  it("accepts boundary coordinates", () => {
    expect(
      createChartInputSchema.safeParse({ ...VALID, lat: 90, lon: -180 }).success
    ).toBe(true);
  });

  // ── Calendar date ─────────────────────────────────────────────────
  it("rejects month 13", () => fails({ ...VALID, date: "1990-13-15" }));
  it("rejects day 32", () => fails({ ...VALID, date: "1990-01-32" }));
  it("rejects Feb 30", () => fails({ ...VALID, date: "2021-02-30" }));
  it("rejects Feb 29 in a non-leap year", () =>
    fails({ ...VALID, date: "2021-02-29" }));
  it("accepts Feb 29 in a leap year", () =>
    expect(
      createChartInputSchema.safeParse({ ...VALID, date: "2020-02-29" }).success
    ).toBe(true));
  it("rejects wrong date format", () => fails({ ...VALID, date: "15-05-1990" }));
  it("rejects missing date", () => fails({ ...VALID, date: undefined }));
  it("rejects a year outside the supported ephemeris range", () =>
    fails({ ...VALID, date: "1800-05-15" }));

  // ── Time of day ───────────────────────────────────────────────────
  it("rejects hour 25", () => fails({ ...VALID, time: "25:00" }));
  it("rejects minute 60", () => fails({ ...VALID, time: "08:60" }));
  it("rejects non-numeric time", () => fails({ ...VALID, time: "ab:cd" }));
  it("rejects missing time when timeKnown is true", () =>
    fails({ ...VALID, time: undefined }));
  it("accepts 23:59", () =>
    expect(
      createChartInputSchema.safeParse({ ...VALID, time: "23:59" }).success
    ).toBe(true));

  // ── Name / intent note ────────────────────────────────────────────
  it("rejects a name longer than 100 chars", () =>
    fails({ ...VALID, name: "a".repeat(101) }));
  it("accepts a 100-char name", () =>
    expect(
      createChartInputSchema.safeParse({ ...VALID, name: "a".repeat(100) })
        .success
    ).toBe(true));
  it("rejects an intent note longer than 500 chars", () =>
    fails({ ...VALID, intentNote: "a".repeat(501) }));
  it("accepts a 500-char intent note", () =>
    expect(
      createChartInputSchema.safeParse({ ...VALID, intentNote: "a".repeat(500) })
        .success
    ).toBe(true));
  it("accepts a null intent note", () =>
    expect(
      createChartInputSchema.safeParse({ ...VALID, intentNote: null }).success
    ).toBe(true));

  // ── Interests / depth ─────────────────────────────────────────────
  it("rejects more than 10 interests", () =>
    fails({ ...VALID, interests: Array.from({ length: 11 }, (_, i) => `i${i}`) }));
  it("accepts 10 interests", () =>
    expect(
      createChartInputSchema.safeParse({
        ...VALID,
        interests: Array.from({ length: 10 }, (_, i) => `i${i}`),
      }).success
    ).toBe(true));
  it("rejects an interest longer than 50 chars", () =>
    fails({ ...VALID, interests: ["a".repeat(51)] }));
  it("rejects an invalid depth value", () =>
    fails({ ...VALID, depth: "extreme" }));
  it("accepts depth 'quick'", () =>
    expect(
      createChartInputSchema.safeParse({ ...VALID, depth: "quick" }).success
    ).toBe(true));

  // ── Error messages are user-safe ──────────────────────────────────
  it("exposes plain, user-readable messages (no internals)", () => {
    const r = fails({ ...VALID, lat: 999 });
    if (!r.success) {
      for (const issue of r.error.issues) {
        expect(issue.message).not.toMatch(/stack|undefined|NaN|ZodError/i);
        expect(issue.message.length).toBeGreaterThan(0);
      }
    }
  });
});
