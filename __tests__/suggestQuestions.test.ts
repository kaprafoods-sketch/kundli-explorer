/**
 * AGENT-SUGGEST Wave 1 — suggestQuestions engine tests.
 *
 * Uses a fixed, hand-built chart fixture (no sweph, no DB) since the engine
 * itself is pure. Verifies: dasha-lord boost ranks its questions first,
 * the diversity constraint (top-4 spans >= 3 life areas) holds, and the
 * ranking is fully deterministic across repeated calls.
 */

import { describe, it, expect } from "vitest";
import { suggestQuestions } from "@/lib/suggestQuestions";
import type { NatalChart, Placement } from "@/lib/astro/computeChart";
import type { GrahaId } from "@/lib/kb";

// ── Fixture ──────────────────────────────────────────────────────────────────

function placement(body: GrahaId | "lagna", house: number, dignity = "neutral", retrograde = false): Placement {
  return {
    body,
    lon: (house - 1) * 30 + 5,
    signNum: house,
    sign: "aries" as never, // not used by the engine
    house,
    degInSign: 5,
    retrograde,
    nakshatra: "ashwini",
    nakshatraIndex: 0,
    pada: 1,
    dignity,
  };
}

// Saturn is the current Mahadasha lord in this fixture, placed in the 10th
// house — that should light up every career question grounded in Saturn or
// house 10.
const FIXED_CHART: NatalChart = {
  meta: {
    name: "Fixture",
    dob: "1990-06-15T08:00",
    tobUTC: "1990-06-15T02:30:00.000Z",
    lat: 28.6139,
    lon: 77.209,
    tz: "Asia/Kolkata",
    ayanamsha: "LAHIRI" as never,
    lagnaUncertain: false,
    ayanamshaValue: 23.9,
  },
  lagnaSign: 1,
  ascendant: { lon: 5, sign: "aries" as never, degInSign: 5 },
  placements: [
    placement("sun", 1),
    placement("moon", 5),
    placement("mars", 7),
    placement("mercury", 3),
    placement("jupiter", 9),
    placement("venus", 7),
    placement("saturn", 10),
    placement("rahu", 6),
    placement("ketu", 12),
    placement("lagna", 1),
  ],
  navamsha: [],
  dasha: {
    order: ["ketu", "venus", "sun", "moon", "mars", "rahu", "jupiter", "saturn", "mercury"],
    years: { ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7, rahu: 18, jupiter: 16, saturn: 19, mercury: 17 },
    timeline: [],
    current: {
      maha: { lord: "saturn", start: "2020-01-01", end: "2039-01-01" },
      antar: { lord: "mercury", start: "2023-01-01", end: "2024-06-01" },
    },
  },
};

const PROFILE = { interests: [] as never[] };

describe("suggestQuestions (AGENT-SUGGEST Wave 1)", () => {
  it("boosts questions linked to the current Mahadasha lord to the top", () => {
    const chips = suggestQuestions(FIXED_CHART, PROFILE, {}, 4);
    // Saturn is the maha lord and sits in the 10th house (a STRONG_HOUSE), so
    // career questions grounded in Saturn/house-10 should rank highly.
    const careerNearTop = chips.some((c) => c.lifeAreas.includes("career" as never));
    expect(careerNearTop).toBe(true);

    // Directly confirm a Saturn/house-10-linked question outranks a
    // completely ungrounded, non-timing question when both are otherwise
    // interest-neutral. Take the full ranked pool via a large topN.
    const all = suggestQuestions(FIXED_CHART, PROFILE, {}, 100);
    const saturnQIdx = all.findIndex((q) => q.id === "career-saturn" || q.id === "qb-career-2");
    const spiritKetuIdxNoBoost = all.findIndex((q) => q.id === "spirit-12th" || q.id === "qb-spiritual-3");
    expect(saturnQIdx).toBeGreaterThanOrEqual(0);
    expect(spiritKetuIdxNoBoost).toBeGreaterThanOrEqual(0);
    expect(saturnQIdx).toBeLessThan(spiritKetuIdxNoBoost);
  });

  it("keeps the top-4 spanning at least 3 distinct life areas (diversity constraint)", () => {
    const chips = suggestQuestions(FIXED_CHART, PROFILE, {}, 4);
    const areas = new Set(chips.flatMap((c) => c.lifeAreas));
    expect(chips.length).toBe(4);
    expect(areas.size).toBeGreaterThanOrEqual(3);
  });

  it("is fully deterministic — repeated calls with identical inputs deep-equal", () => {
    const ctx = { today: new Date("2024-03-01T00:00:00.000Z") };
    const first = suggestQuestions(FIXED_CHART, PROFILE, ctx, 4);
    const second = suggestQuestions(FIXED_CHART, PROFILE, ctx, 4);
    expect(second).toEqual(first);

    // Same holds for the full ranked pool, not just the top slice.
    const firstAll = suggestQuestions(FIXED_CHART, PROFILE, ctx, 100);
    const secondAll = suggestQuestions(FIXED_CHART, PROFILE, ctx, 100);
    expect(secondAll).toEqual(firstAll);
  });

  it("never returns a question that promises timing of a fated event (spot-check bank voice)", () => {
    const all = suggestQuestions(FIXED_CHART, PROFILE, {}, 100);
    for (const q of all) {
      expect(q.text.toLowerCase()).not.toMatch(/when will i|will i (get|be|marry)/);
    }
  });
});
