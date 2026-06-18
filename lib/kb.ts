import kbRaw from "@/jyotish-knowledge-base.json";

// ── Types ────────────────────────────────────────────────────────────────────

export type GrahaId =
  | "sun" | "moon" | "mars" | "mercury" | "jupiter"
  | "venus" | "saturn" | "rahu" | "ketu";

export type SignId =
  | "aries" | "taurus" | "gemini" | "cancer" | "leo" | "virgo"
  | "libra" | "scorpio" | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export interface Graha {
  id: GrahaId;
  en: string;
  sanskrit: string;
  alt_sanskrit?: string;
  glyph: string;
  gender: string;
  nature: string;
  element: string;
  guna: string;
  karaka_of: string[];
  exaltation: { sign: SignId; degree: number | null };
  debilitation: { sign: SignId; degree: number | null };
  own_signs: SignId[];
  mooltrikona: { sign: SignId; range: [number, number] };
  relationships: {
    friends?: string[];
    enemies?: string[];
    neutral?: string[];
    _note?: string;
  };
  aspects_special: number[];
  nakshatras_ruled: string[];
  vimshottari_years: number;
  keywords: string[];
  gemstone?: string;
  metal?: string;
  color?: string;
}

export interface Rashi {
  number: number;
  en: string;
  sanskrit: string;
  symbol: string;
  ruler: GrahaId;
  co_ruler?: GrahaId;
  element: string;
  modality: string;
  gender: string;
  body_part: string;
  keywords: string[];
}

export interface Bhava {
  number: number;
  sanskrit: string[];
  en: string;
  natural_karaka: string | string[];
  purushartha: string;
  class: string[];
  signifies: string[];
  keywords: string[];
}

export interface KB {
  meta: Record<string, unknown>;
  grahas: Record<GrahaId, Graha>;
  rashis: Record<SignId, Rashi>;
  bhavas: Record<string, Bhava>;
  dignity_rules: {
    order: string[];
    [key: string]: unknown;
  };
  aspect_rules: {
    all_planets_aspect: number[];
    special: Record<string, number[]>;
  };
  house_classifications: Record<string, { houses: number[]; meaning: string }>;
  vimshottari: {
    order: GrahaId[];
    years: Record<GrahaId, number>;
    total_years: number;
  };
  interpretation_model: {
    composition: string[];
    example: Record<string, unknown>;
  };
}

// ── Singleton ────────────────────────────────────────────────────────────────

export const kb = kbRaw as unknown as KB;

// ── Convenience lookups ──────────────────────────────────────────────────────

export const SIGN_NAMES: SignId[] = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

export const GRAHA_IDS: GrahaId[] = [
  "sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu",
];

export const GRAHA_GLYPHS: Record<GrahaId, string> = {
  sun: "☉", moon: "☽", mars: "♂", mercury: "☿", jupiter: "♃",
  venus: "♀", saturn: "♄", rahu: "☊", ketu: "☋",
};

/** 1-indexed sign number → SignId */
export function signFromNumber(n: number): SignId {
  return SIGN_NAMES[(n - 1 + 12) % 12];
}

/** SignId → 1-indexed sign number */
export function signToNumber(s: SignId): number {
  return SIGN_NAMES.indexOf(s) + 1;
}

/** Resolve dignity label for a planet in a sign using KB rules */
export function resolveDignity(
  grahaId: GrahaId,
  signId: SignId
): string {
  const g = kb.grahas[grahaId];
  if (!g) return "neutral";

  if (g.exaltation.sign === signId) return "exalted";
  if (g.debilitation.sign === signId) return "debilitated";

  const mlt = g.mooltrikona;
  if (mlt && mlt.sign === signId) return "moolatrikona";

  if (g.own_signs.includes(signId)) return "own";

  // Friendship-based dignity — look at sign's ruler
  const rashi = kb.rashis[signId];
  if (!rashi) return "neutral";
  const dispositorId = rashi.ruler as GrahaId;

  const rel = g.relationships;
  if (!rel || rel._note) return "neutral"; // shadow planets

  const friends = (rel.friends ?? []) as string[];
  const enemies = (rel.enemies ?? []) as string[];
  const neutral = (rel.neutral ?? []) as string[];

  if (friends.includes(dispositorId)) return "friend";
  if (enemies.includes(dispositorId)) return "enemy";
  if (neutral.includes(dispositorId)) return "neutral";

  return "neutral";
}

/** Which houses does a planet aspect (1-indexed relative to its position) */
export function aspectHouses(grahaId: GrahaId): number[] {
  const special = kb.aspect_rules.special[grahaId] ?? [];
  return [7, ...special];
}
