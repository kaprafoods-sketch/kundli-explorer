// lib/suggestQuestions.ts
//
// Merit-based question ranking for GRAHA AI.
//
// PREREQUISITE: lib/lifeAreas must already include the two new ids "spiritual"
// and "learning" (added in Phase 1A). This file imports LifeAreaId from there.
//
// PURITY: this module is pure — it does NOT import sweph or compute transits
// itself. Transits are server-computed (see /api/transits) and passed in via
// `context.transits`, so the ranked chips can be produced on the server and
// sent to the client. Keep it that way.
//
// USAGE (server side, e.g. in the chart page or a route):
//   const transits = await computeTransits(chart.lagnaSign, "LAHIRI");
//   const chips = suggestQuestions(chart, { interests: chart.interests }, {
//     transits,
//     explored,   // string[] of element keys the user has already opened
//     askedIds,   // string[] of question ids already asked in this thread
//   });
//   // pass `chips` to GrahaAIChat as starter chips

import type { NatalChart, Placement } from "@/lib/astro/computeChart";
import type { TransitPlanet } from "@/lib/astro/transits";
import type { LifeAreaId } from "@/lib/lifeAreas";

// ── Types ─────────────────────────────────────────────────────────────────────

type ElementRef =
  | { kind: "planet"; id: string }
  | { kind: "house"; id: number }
  | { kind: "sign"; id: string };

export interface SuggestedQuestion {
  id: string;
  text: string;
  lifeAreas: LifeAreaId[];
  /** Chart element this question is "about" — drives liveness + novelty. */
  element?: ElementRef;
  /** Dasha-driven: relevant whenever there's a current period (always). */
  timing?: boolean;
  /** Only enters the pool when its calendar hook fires. */
  contextHook?: "birthday" | "saturn_return";
}

export interface SuggestProfile {
  interests: LifeAreaId[];
}

export interface SuggestContext {
  /** Element keys already opened, e.g. ["planet:saturn", "house:10"]. */
  explored?: string[];
  /** Question ids already asked in this thread. */
  askedIds?: string[];
  /** Server-computed transits — enables transit-based liveness. */
  transits?: TransitPlanet[];
  today?: Date;
}

// ── Scoring weights (match the master-prompt formula exactly) ─────────────────

const W_INTEREST = 1.0;
const W_LIVENESS = 1.2;
const W_NOVELTY = 0.6;
const W_HOOK = 0.8;
const W_REPETITION = 0.5;

const TIMING_LIVENESS = 0.85; // evergreen dasha questions rank just below a genuinely-live placement

// Slow movers whose transit through a natal house makes that house "live".
const SLOW_PLANETS = new Set(["saturn", "jupiter", "rahu", "ketu"]);
const NOTABLE_DIGNITY = new Set(["exalted", "own", "moolatrikona", "debilitated"]);
const STRONG_HOUSES = new Set([1, 4, 5, 7, 9, 10]); // kendra + trikona

// ── The question bank ─────────────────────────────────────────────────────────
// Voice: educational, agency-framed, never fatalistic. Chips invite the chart to
// TEACH — they never predict events ("when will I…", "will I be…"). Grounding and
// Sanskrit happen in the answer, per the GRAHA AI system prompt; chips stay warm
// and readable.

export const QUESTION_BANK: SuggestedQuestion[] = [
  // ── Personality / Self ──
  { id: "self-ascendant", text: "What does my Ascendant say about how I meet the world?", lifeAreas: ["personality"], element: { kind: "house", id: 1 } },
  { id: "self-sun-moon", text: "How do my Sun and Moon pull in different directions?", lifeAreas: ["personality"], element: { kind: "planet", id: "sun" } },
  { id: "self-strongest", text: "Which planet shapes my chart the most?", lifeAreas: ["personality", "learning"] },
  { id: "self-core", text: "What's the core temperament my chart keeps returning to?", lifeAreas: ["personality"] },
  { id: "self-moon-weather", text: "How does my Moon shape my inner weather?", lifeAreas: ["personality", "health"], element: { kind: "planet", id: "moon" } },

  // ── Career ──
  { id: "career-built-for", text: "What kind of work is my chart built for?", lifeAreas: ["career"], element: { kind: "house", id: 10 } },
  { id: "career-saturn", text: "What is Saturn asking of me in my work?", lifeAreas: ["career"], element: { kind: "planet", id: "saturn" } },
  { id: "career-authority", text: "What's my natural way of earning authority?", lifeAreas: ["career"], element: { kind: "planet", id: "sun" } },
  { id: "career-ambition", text: "Where does my chart point my ambition?", lifeAreas: ["career", "money"], element: { kind: "house", id: 10 } },
  { id: "career-mercury", text: "How does Mercury shape the way I think and work?", lifeAreas: ["career", "learning"], element: { kind: "planet", id: "mercury" } },

  // ── Money ──
  { id: "money-build", text: "How does my chart shape the way I build wealth?", lifeAreas: ["money"], element: { kind: "house", id: 2 } },
  { id: "money-gains", text: "Where do my gains come from, by my chart?", lifeAreas: ["money"], element: { kind: "house", id: 11 } },
  { id: "money-jupiter", text: "How does Jupiter shape what I grow toward?", lifeAreas: ["money", "spiritual"], element: { kind: "planet", id: "jupiter" } },
  { id: "money-effort", text: "Where do resources come easily, and where do they ask for effort?", lifeAreas: ["money"], element: { kind: "house", id: 2 } },

  // ── Love / Relationships ──
  { id: "love-partnership", text: "What does my chart show about how I relate in partnership?", lifeAreas: ["love"], element: { kind: "house", id: 7 } },
  { id: "love-venus", text: "How does Venus shape what I'm drawn to?", lifeAreas: ["love"], element: { kind: "planet", id: "venus" } },
  { id: "love-bring", text: "What do I bring to a close relationship?", lifeAreas: ["love"], element: { kind: "house", id: 7 } },
  { id: "love-moon-secure", text: "What makes me feel secure with someone, by my Moon?", lifeAreas: ["love", "personality"], element: { kind: "planet", id: "moon" } },
  { id: "love-mars", text: "How does Mars show up in the way I bond?", lifeAreas: ["love"], element: { kind: "planet", id: "mars" } },

  // ── Health / Energy ──
  { id: "health-energy", text: "Where does my energy run high — and where does it drain?", lifeAreas: ["health"], element: { kind: "house", id: 1 } },
  { id: "health-tend", text: "What does my chart suggest I tend to for steady wellbeing?", lifeAreas: ["health"], element: { kind: "house", id: 6 } },
  { id: "health-vitality", text: "Which planet most colours my vitality?", lifeAreas: ["health", "personality"], element: { kind: "planet", id: "sun" } },

  // ── Spiritual / Life-meaning ──
  { id: "spirit-path", text: "What does my chart point to as my deeper path?", lifeAreas: ["spiritual"], element: { kind: "house", id: 9 } },
  { id: "spirit-ketu", text: "What is Ketu's placement here to release?", lifeAreas: ["spiritual"], element: { kind: "planet", id: "ketu" } },
  { id: "spirit-9th", text: "What does my 9th house say about meaning and belief?", lifeAreas: ["spiritual", "learning"], element: { kind: "house", id: 9 } },
  { id: "spirit-12th", text: "Where does my chart turn inward, toward letting go?", lifeAreas: ["spiritual"], element: { kind: "house", id: 12 } },

  // ── Timing / Dasha (evergreen — a current period always exists) ──
  { id: "time-maha", text: "What is my current Mahadasha really about?", lifeAreas: ["learning", "personality"], timing: true },
  { id: "time-maha-antar", text: "How do my Mahadasha and Antardasha work together now?", lifeAreas: ["learning"], timing: true },
  { id: "time-chapter", text: "What chapter does my chart say I'm in?", lifeAreas: ["personality", "learning"], timing: true },
  { id: "time-focus", text: "What does this period ask me to focus on?", lifeAreas: ["career", "personality"], timing: true },

  // ── Learning (the student persona) ──
  { id: "learn-read-one", text: "Teach me to read one placement in my chart.", lifeAreas: ["learning"] },
  { id: "learn-first", text: "What's the first thing in my chart I should understand?", lifeAreas: ["learning", "personality"] },
  { id: "learn-fit", text: "How do my planets, signs, and houses fit together?", lifeAreas: ["learning"] },

  // ── Context hooks (only surface when their calendar moment is live) ──
  { id: "hook-solar-return", text: "It's near my solar return — what does my chart highlight for the year ahead?", lifeAreas: ["personality", "spiritual"], contextHook: "birthday" },
  { id: "hook-saturn-return", text: "Am I in a Saturn return — and what is it asking of me?", lifeAreas: ["personality", "career", "spiritual"], contextHook: "saturn_return" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function elementKey(el: ElementRef): string {
  return `${el.kind}:${el.id}`;
}

function intersects(a: readonly string[], b: readonly string[]): boolean {
  return a.some((x) => b.includes(x));
}

function dobParts(dob: string): { year: number; month: number; day: number } | null {
  const m = dob.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return { year: +m[1], month: +m[2], day: +m[3] };
}

function ageFrom(dob: string, today: Date): number | null {
  const p = dobParts(dob);
  if (!p) return null;
  let age = today.getFullYear() - p.year;
  const m = today.getMonth() + 1;
  const hadBirthday = m > p.month || (m === p.month && today.getDate() >= p.day);
  if (!hadBirthday) age--;
  return age;
}

function hookFires(
  hook: NonNullable<SuggestedQuestion["contextHook"]>,
  chart: NatalChart,
  today: Date
): boolean {
  const dob = chart?.meta?.dob;
  if (!dob) return false;

  if (hook === "birthday") {
    const p = dobParts(dob);
    if (!p) return false;
    const bday = new Date(today.getFullYear(), p.month - 1, p.day);
    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.abs((bday.getTime() - now.getTime()) / 86_400_000);
    return diffDays <= 5; // solar-return window
  }

  if (hook === "saturn_return") {
    const age = ageFrom(dob, today);
    if (age == null) return false;
    return (age >= 28 && age <= 31) || (age >= 57 && age <= 60); // 1st / 2nd return
  }

  return false;
}

function placementOf(chart: NatalChart, planetId: string): Placement | undefined {
  return chart?.placements?.find((p) => p.body === planetId);
}

function planetIsLive(planetId: string, chart: NatalChart, transits?: TransitPlanet[]): boolean {
  const maha = chart?.dasha?.current?.maha?.lord;
  const antar = chart?.dasha?.current?.antar?.lord;
  if (planetId === maha || planetId === antar) return true;

  const pl = placementOf(chart, planetId);
  if (pl) {
    if (NOTABLE_DIGNITY.has((pl.dignity ?? "").toLowerCase())) return true;
    if (pl.retrograde) return true;
  }

  if (transits) {
    const tr = transits.find((t) => t.body === planetId);
    if (tr && STRONG_HOUSES.has(tr.natalHouse)) return true;
  }
  return false;
}

function houseIsLive(houseNum: number, transits?: TransitPlanet[]): boolean {
  if (!transits) return false;
  return transits.some((t) => SLOW_PLANETS.has(t.body) && t.natalHouse === houseNum);
}

function livenessScore(q: SuggestedQuestion, chart: NatalChart, ctx: SuggestContext): number {
  const today = ctx.today ?? new Date();
  if (q.contextHook && hookFires(q.contextHook, chart, today)) return 1;
  if (q.timing && chart?.dasha?.current) return TIMING_LIVENESS;

  const el = q.element;
  if (!el) return 0;
  if (el.kind === "planet") return planetIsLive(el.id, chart, ctx.transits) ? 1 : 0;
  if (el.kind === "house") return houseIsLive(el.id, ctx.transits) ? 1 : 0;
  return 0; // signs don't carry liveness in v1
}

function noveltyScore(q: SuggestedQuestion, explored: Set<string>): number {
  if (!q.element) return 0.5; // elementless (timing/learning) get mild novelty
  return explored.has(elementKey(q.element)) ? 0 : 1;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function suggestQuestions(
  chart: NatalChart,
  profile: SuggestProfile,
  context: SuggestContext = {},
  topN = 4
): SuggestedQuestion[] {
  const today = context.today ?? new Date();
  const interests = profile?.interests ?? [];
  const explored = new Set(context.explored ?? []);
  const asked = new Set(context.askedIds ?? []);

  // Context-hook questions only enter the pool when their moment is live.
  const pool = QUESTION_BANK.filter(
    (q) => !q.contextHook || hookFires(q.contextHook, chart, today)
  );

  const scored = pool.map((q, idx) => {
    const interestMatch = intersects(q.lifeAreas, interests) ? 1 : 0;
    const liveness = livenessScore(q, chart, context);
    const novelty = noveltyScore(q, explored);
    const hook = q.contextHook && hookFires(q.contextHook, chart, today) ? 1 : 0;
    const repetition = asked.has(q.id) ? 1 : 0;

    const score =
      W_INTEREST * interestMatch +
      W_LIVENESS * liveness +
      W_NOVELTY * novelty +
      W_HOOK * hook -
      W_REPETITION * repetition;

    return { q, idx, score };
  });

  scored.sort((a, b) => (b.score - a.score) || (a.idx - b.idx)); // stable tiebreak by bank order
  return scored.slice(0, topN).map((s) => s.q);
}
