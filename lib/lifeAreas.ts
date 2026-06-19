/**
 * lifeAreas.ts — Data-driven life area resolution from the Jyotish KB.
 * No Next.js imports. No side effects.
 */

import { kb, GRAHA_IDS, type GrahaId } from "@/lib/kb";

// ── Types ────────────────────────────────────────────────────────────────────

export const LIFE_AREA_IDS = [
  "love",
  "career",
  "health",
  "money",
  "personality",
  "family",
  "education",
  "travel",
  "spirituality",
] as const;

export type LifeAreaId = (typeof LIFE_AREA_IDS)[number];

export interface LifeAreaResult {
  id: LifeAreaId;
  label: string;
  emoji: string;
  planets: GrahaId[];
  houses: number[];
  why: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

interface AreaConfig {
  label: string;
  emoji: string;
  keywords: string[];
}

const AREA_CONFIG: Record<LifeAreaId, AreaConfig> = {
  love: {
    label: "Love & Relationships",
    emoji: "♀",
    keywords: [
      "love",
      "marriage",
      "spouse",
      "wife",
      "husband",
      "relationship",
      "partner",
      "romance",
      "passion",
    ],
  },
  career: {
    label: "Career & Status",
    emoji: "♄",
    keywords: [
      "career",
      "profession",
      "status",
      "authority",
      "reputation",
      "government",
      "public life",
      "action",
    ],
  },
  health: {
    label: "Health & Vitality",
    emoji: "☉",
    keywords: [
      "vitality",
      "health",
      "disease",
      "body",
      "longevity",
      "energy",
      "illness",
    ],
  },
  money: {
    label: "Money & Wealth",
    emoji: "♃",
    keywords: [
      "wealth",
      "money",
      "gains",
      "fortune",
      "income",
      "accumulated wealth",
      "savings",
    ],
  },
  personality: {
    label: "Personality & Self",
    emoji: "☽",
    keywords: [
      "self",
      "soul",
      "mind",
      "ego",
      "identity",
      "personality",
      "appearance",
      "temperament",
    ],
  },
  family: {
    label: "Family & Home",
    emoji: "☽",
    keywords: [
      "family",
      "mother",
      "father",
      "children",
      "sibling",
      "home",
      "nurturing",
    ],
  },
  education: {
    label: "Education & Learning",
    emoji: "☿",
    keywords: [
      "education",
      "learning",
      "intelligence",
      "wisdom",
      "knowledge",
      "higher education",
      "intellect",
    ],
  },
  travel: {
    label: "Travel & Foreign",
    emoji: "☊",
    keywords: ["travel", "foreign", "journey", "pilgrimage"],
  },
  spirituality: {
    label: "Spirituality & Liberation",
    emoji: "☋",
    keywords: [
      "spirituality",
      "liberation",
      "moksha",
      "occult",
      "meditation",
      "religion",
    ],
  },
};

// ── Resolution ────────────────────────────────────────────────────────────────

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

export function resolveLifeArea(areaId: LifeAreaId): LifeAreaResult {
  const config = AREA_CONFIG[areaId];
  const { label, emoji, keywords } = config;

  // ── Planets: graha.karaka_of must match at least one keyword ──
  const matchedPlanets: GrahaId[] = [];
  for (const gId of GRAHA_IDS) {
    const graha = kb.grahas[gId];
    const matches = graha.karaka_of.some((k) => matchesKeywords(k, keywords));
    if (matches) matchedPlanets.push(gId);
    if (matchedPlanets.length >= 4) break;
  }

  // ── Houses: bhava.signifies matches OR natural_karaka is a matched planet ──
  const matchedHouses: number[] = [];
  for (let h = 1; h <= 12; h++) {
    const bhava = kb.bhavas[String(h)];

    const signifiesMatch = bhava.signifies.some((s) =>
      matchesKeywords(s, keywords)
    );

    const nk = bhava.natural_karaka;
    const nkList: string[] = Array.isArray(nk) ? nk : [nk];
    const karakaMatch = nkList.some((k) =>
      matchedPlanets.includes(k as GrahaId)
    );

    if (signifiesMatch || karakaMatch) {
      matchedHouses.push(h);
    }
    if (matchedHouses.length >= 4) break;
  }

  // ── Why: compose from matched planets + houses ──
  const planetParts = matchedPlanets.map((pId) => {
    const g = kb.grahas[pId];
    const karakas = g.karaka_of.slice(0, 3).join(", ");
    return `${g.en} governs ${karakas}`;
  });

  const houseParts = matchedHouses.map((h) => {
    const bhava = kb.bhavas[String(h)];
    const signifies = bhava.signifies.slice(0, 3).join(", ");
    return `House ${h} (${bhava.en}) signifies ${signifies}`;
  });

  const allParts = [...planetParts, ...houseParts];
  const why =
    allParts.length > 0
      ? allParts.join(". ") + "."
      : `${label} is shaped by multiple planetary and house factors.`;

  return { id: areaId, label, emoji, planets: matchedPlanets, houses: matchedHouses, why };
}
