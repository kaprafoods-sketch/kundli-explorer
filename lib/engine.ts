/**
 * engine.ts — Pure computation module for GRAHA Kundli Explorer.
 * No Next.js imports. No side effects.
 */

import { kb, resolveDignity, GRAHA_IDS, type GrahaId, type SignId } from "@/lib/kb";

// ── Dignity ──────────────────────────────────────────────────────────────────

export interface DignityResult {
  key: string;     // exalted | moolatrikona | own | friend | neutral | enemy | debilitated
  label: string;   // beginner-friendly English label
  strength: number; // 0..1
}

const DIGNITY_STRENGTH: Record<string, number> = {
  exalted:      1.0,
  moolatrikona: 0.85,
  own:          0.75,
  friend:       0.6,
  neutral:      0.45,
  enemy:        0.3,
  debilitated:  0.1,
};

const DIGNITY_LABELS: Record<string, string> = {
  exalted:      "Exalted — peak power",
  moolatrikona: "Mooltrikona — very strong, like a king in court",
  own:          "Own sign — at home, stable",
  friend:       "Friendly sign — welcomed, performs well",
  neutral:      "Neutral sign — neither boosted nor blocked",
  enemy:        "Enemy sign — works against friction, results take effort",
  debilitated:  "Debilitated — works harder here, but can be redeemed",
};

export function computeDignity(planetId: GrahaId, signId: SignId): DignityResult {
  const key = resolveDignity(planetId, signId);
  return {
    key,
    label: DIGNITY_LABELS[key] ?? "Neutral sign — neither boosted nor blocked",
    strength: DIGNITY_STRENGTH[key] ?? 0.45,
  };
}

// ── Aspects ──────────────────────────────────────────────────────────────────

export function computeAspects(planetId: GrahaId, fromHouse: number): number[] {
  const specialOffsets: number[] = kb.aspect_rules.special[planetId] ?? [];
  const allOffsets = [7, ...specialOffsets];

  const aspected = allOffsets.map(
    (offset) => ((fromHouse - 1 + offset - 1) % 12) + 1
  );

  return [...new Set(aspected)].sort((a, b) => a - b);
}

// ── Reading composition ───────────────────────────────────────────────────────

export interface ReadingResult {
  headline: string;
  what: string;
  where: string;
  how: string;
  dignityLine: string;
  aspectsLine?: string;
  summary: string;
  dignity: DignityResult;
}

export function composeReading(args: {
  planetId: GrahaId;
  house: number;
  signId: SignId;
  level?: 1 | 2 | 3;
}): ReadingResult {
  const { planetId, house, signId, level = 1 } = args;

  const graha = kb.grahas[planetId];
  const bhava = kb.bhavas[String(house)];
  const rashi = kb.rashis[signId];

  const planetName =
    level >= 2
      ? `${graha.en} (${graha.sanskrit})`
      : graha.en;

  const signName =
    level >= 2
      ? `${rashi.en} (${rashi.sanskrit})`
      : rashi.en;

  const houseName =
    level >= 2
      ? `${bhava.en} (${bhava.sanskrit.join(" / ")})`
      : bhava.en;

  // what — planet karakas
  const karakaList = graha.karaka_of.slice(0, 6).join(", ");
  const what = `${planetName} is the planet of ${karakaList}.`;

  // where — house
  const signifiesList = bhava.signifies.slice(0, 5).join(", ");
  const where = `In your ${house}${ordinalSuffix(house)} house (${houseName}), it activates the area of ${signifiesList}.`;

  // how — sign
  const keywordList = rashi.keywords.join(", ");
  const how = `In ${signName}, it expresses through: ${keywordList}.`;

  // dignity
  const dignity = computeDignity(planetId, signId);
  const dignityLine = `Strength: ${dignity.label}.`;

  // aspects
  const aspectedHouses = computeAspects(planetId, house);
  const specialOffsets: number[] = kb.aspect_rules.special[planetId] ?? [];
  const hasSpecial = specialOffsets.length > 0;
  let aspectsLine: string | undefined;
  if (hasSpecial) {
    aspectsLine = `${planetName} casts its influence on houses ${aspectedHouses.join(", ")}.`;
  }

  // headline
  const headline = `${graha.en} in House ${house} (${bhava.en}), ${rashi.en}`;

  // summary
  const parts = [what, where, how, dignityLine];
  if (aspectsLine) parts.push(aspectsLine);
  const summary = parts.join(" ");

  return { headline, what, where, how, dignityLine, aspectsLine, summary, dignity };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function ordinalSuffix(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  if (mod10 === 1) return "st";
  if (mod10 === 2) return "nd";
  if (mod10 === 3) return "rd";
  return "th";
}

// Re-export types used across the feature
export type { GrahaId, SignId };
export { GRAHA_IDS };
