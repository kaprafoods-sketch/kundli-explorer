/**
 * Vimshottari antardasha regression tests.
 *
 * Bug: computeDasha computed antardasha lengths from the mahadasha lord's
 * FULL year span — `(dashaYears[mahaLord] / 120) * dashaYears[antarLord]` —
 * even when the current mahadasha is the PARTIAL birth mahadasha (which only
 * runs from birth to mahaEnd, shorter than the lord's full span). The antar
 * boundaries then spilled past the actual mahadasha end.
 *
 * Fix: derive each antar's length from the ACTUAL mahadasha duration
 * (mahaEnd − mahaStart), proportional to each antar lord's share of the
 * 120-year cycle. For full (non-birth) mahadashas this equals the classic
 * formula, so their output is unchanged.
 *
 * These tests go through the real computeChart (sweph + luxon), the same as
 * production, and read the full antar timeline via dasha.current.antars.
 */

import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { computeChart } from "@/lib/astro/computeChart";

const DELHI = { lat: 28.6139, lon: 77.209 };

// Millisecond tolerance for endpoint comparisons.
// NOTE (pre-existing quirk, out of scope): luxon converts fractional years to
// days when chaining plus({years: fraction}) calls, so a chained antar timeline
// can drift ~1 day from the single plus({years}) that produced the mahadasha
// end — even for full mahadashas on current (buggy) code. The tolerance below
// accommodates that drift; the bug under test spills by YEARS, so the test
// stays decisive.
const TOL_MS = 2 * 86400_000; // 2 days
const MS_PER_YEAR = 365.25 * 86400_000;

function millis(iso: string): number {
  return DateTime.fromISO(iso, { zone: "utc" }).toMillis();
}

function yearsBetween(startIso: string, endIso: string): number {
  return (millis(endIso) - millis(startIso)) / MS_PER_YEAR;
}

describe("computeDasha antardashas", () => {
  it("partial birth mahadasha: antars tile exactly within [birth, mahaEnd]", async () => {
    // 2024-03-20 08:00 New Delhi → birth mahadasha is Saturn with ~10.47 of
    // its 19 years remaining (verified via scratch run). "Now" falls inside
    // it, so current.maha is the partial birth mahadasha — stable until ~2034.
    const chart = await computeChart({
      name: "dasha-partial-test",
      year: 2024, month: 3, day: 20, hour: 8, minute: 0,
      ...DELHI,
      timeKnown: true,
    });
    const { current, timeline, years, order } = chart.dasha;
    const { maha, antars } = current;

    // Sanity: the current mahadasha really is the partial birth mahadasha
    expect(maha.start).toBe(timeline[0].start);
    expect(maha.lord).toBe(timeline[0].lord);
    const actualMahaYears = yearsBetween(maha.start, maha.end);
    expect(actualMahaYears).toBeLessThan(years[maha.lord]); // genuinely partial
    expect(actualMahaYears).toBeGreaterThan(1); // comfortably long-lived test

    // 9 antars, sequence starts with the mahadasha lord
    expect(antars).toHaveLength(order.length);
    expect(antars[0].lord).toBe(maha.lord);

    // Continuous tiling starting exactly at the mahadasha start
    expect(antars[0].start).toBe(maha.start);
    for (let i = 1; i < antars.length; i++) {
      expect(antars[i].lord).toBe(order[(order.indexOf(maha.lord) + i) % order.length]);
      expect(antars[i].start).toBe(antars[i - 1].end);
    }

    // THE BUG: with the full-span base, the last antar ends years past mahaEnd
    const lastEnd = millis(antars[antars.length - 1].end);
    const mahaEnd = millis(maha.end);
    expect(lastEnd).toBeLessThanOrEqual(mahaEnd + TOL_MS);
    expect(Math.abs(lastEnd - mahaEnd)).toBeLessThanOrEqual(TOL_MS);
    for (const a of antars) {
      expect(millis(a.end)).toBeLessThanOrEqual(mahaEnd + TOL_MS);
    }

    // Each antar gets its proportional share of the ACTUAL mahadasha duration
    const totalAntarYears = yearsBetween(antars[0].start, antars[antars.length - 1].end);
    expect(totalAntarYears).toBeCloseTo(actualMahaYears, 1); // bug: 19 vs ~10.47
    for (let i = 0; i < antars.length; i++) {
      const aLord = order[(order.indexOf(maha.lord) + i) % order.length];
      const share = yearsBetween(antars[i].start, antars[i].end) / totalAntarYears;
      expect(share).toBeCloseTo(years[aLord] / 120, 3);
    }
  });

  it("full (non-birth) mahadasha: antars keep the classic full-span boundaries", async () => {
    // Reference birth from engine.test.ts — "now" falls in a later, full
    // mahadasha, so the classic formula must still hold (regression guard).
    const chart = await computeChart({
      name: "dasha-full-test",
      year: 1985, month: 1, day: 1, hour: 8, minute: 0,
      ...DELHI,
      timeKnown: true,
    });
    const { current, timeline, years, order } = chart.dasha;
    const { maha, antars } = current;

    // Sanity: this is a full mahadasha, not the partial birth one
    expect(maha.start).not.toBe(timeline[0].start);
    const actualMahaYears = yearsBetween(maha.start, maha.end);
    expect(actualMahaYears).toBeCloseTo(years[maha.lord], 1);

    expect(antars).toHaveLength(order.length);
    expect(antars[0].start).toBe(maha.start);
    for (let i = 1; i < antars.length; i++) {
      expect(antars[i].start).toBe(antars[i - 1].end);
    }
    const lastEnd = millis(antars[antars.length - 1].end);
    expect(Math.abs(lastEnd - millis(maha.end))).toBeLessThanOrEqual(TOL_MS);

    // Classic formula unchanged: antar = (mahaLordYears / 120) * antarLordYears
    const mahaLordIdx = order.indexOf(maha.lord);
    for (let i = 0; i < antars.length; i++) {
      const aLord = order[(mahaLordIdx + i) % order.length];
      const aYears = yearsBetween(antars[i].start, antars[i].end);
      expect(aYears).toBeCloseTo((years[maha.lord] / 120) * years[aLord], 2);
    }
  });
});
