/**
 * Runtime interpretation composer.
 * Follows the KB's Planet + House + Sign + Dignity + Aspects formula.
 * Zero canned sentences — every reading is composed from KB pillars.
 */

import {
  kb,
  GRAHA_IDS,
  signFromNumber,
  aspectHouses,
  type GrahaId,
  type SignId,
} from "@/lib/kb";
import type { Placement, NatalChart } from "@/lib/astro/computeChart";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InterpretationResult {
  headline: string;
  body: string;
  dignityLabel: string;
  dignityClass: string; // badge CSS class
  houseClass: string[]; // kendra, trikona, dusthana, etc.
  pillars: {
    planet: string;
    house: string;
    sign: string;
    dignity: string;
    aspects: string;
  };
}

export interface HouseReadingResult {
  headline: string;
  significations: string[];
  sign: { id: SignId; en: string; sanskrit: string; ruler: string };
  planets: GrahaId[];
  houseClass: string[];
  body: string;
}

// ── Dignity helpers ────────────────────────────────────────────────────────────

function dignityLabel(d: string): string {
  const map: Record<string, string> = {
    exalted: "Exalted (Uccha)",
    moolatrikona: "Mooltrikona",
    own: "Own Sign (Swakshetra)",
    friend: "Friendly Sign",
    neutral: "Neutral Sign",
    enemy: "Enemy Sign",
    debilitated: "Debilitated (Neecha)",
  };
  return map[d] ?? d;
}

function dignityBadgeClass(d: string): string {
  const map: Record<string, string> = {
    exalted: "badge-exalted",
    moolatrikona: "badge-moolatrikona",
    own: "badge-own",
    friend: "badge-friend",
    neutral: "badge-neutral",
    enemy: "badge-enemy",
    debilitated: "badge-debilitated",
  };
  return map[d] ?? "badge-neutral";
}

function dignityStrength(d: string): string {
  const map: Record<string, string> = {
    exalted: "at its most refined and elevated, expressing the highest version of its significations",
    moolatrikona: "in comfortable authority — strong, stable, and fully expressed",
    own: "at home and self-assured — acting from a place of natural confidence",
    friend: "in supportive territory — generally positive expression with room to breathe",
    neutral: "in neutral territory — neither especially helped nor hindered by the sign",
    enemy: "in uncomfortable territory — some strain or tension in how it expresses",
    debilitated: "under considerable strain — significations may be distorted, delayed, or frustrated (check for Neecha Bhanga)",
  };
  return map[d] ?? "in a mixed position";
}

// ── House class labels ─────────────────────────────────────────────────────────

function getHouseClasses(house: number): string[] {
  const classes: string[] = [];
  const hc = kb.house_classifications;
  for (const [name, data] of Object.entries(hc)) {
    if (name === "purushartha") continue;
    if ("houses" in data && Array.isArray(data.houses) && data.houses.includes(house)) {
      classes.push(name);
    }
  }
  return classes;
}

function houseClassDescription(classes: string[]): string {
  const desc: Record<string, string> = {
    kendra: "an angular house (kendra) — planets here are empowered to act and manifest",
    trikona: "a trine house (trikona) — one of the most auspicious placements, a source of grace and fortune",
    dusthana: "a difficult house (dusthana) — associated with challenge, struggle, and dissolution; also deepens inner work",
    upachaya: "a growing house (upachaya) — results improve steadily over time; effort is rewarded with patience",
    maraka: "a maraka (death-inflicting) house — significant in longevity and timing analysis",
    panapara: "a succedent house — follows the kendras and supports their themes",
    apoklima: "a cadent house — precedes the kendras; a house of preparation and transition",
  };
  const relevant = classes.filter((c) => desc[c]);
  if (relevant.length === 0) return "";
  return "This is " + relevant.map((c) => desc[c]).join(", and also ");
}

// ── Aspect sentence ────────────────────────────────────────────────────────────

function aspectSentence(
  grahaId: GrahaId,
  placement: Placement,
  allPlacements: Placement[]
): string {
  const aspectNums = aspectHouses(grahaId);
  const aspectedHouses = aspectNums.map(
    (offset) => ((placement.house - 1 + offset - 1 + 12) % 12) + 1
  );

  const conjunctions = allPlacements.filter(
    (p) => p.body !== grahaId && p.body !== "lagna" && p.house === placement.house
  );

  const aspectedPlanets = allPlacements.filter(
    (p) =>
      p.body !== grahaId &&
      p.body !== "lagna" &&
      aspectedHouses.includes(p.house)
  );

  const parts: string[] = [];

  if (conjunctions.length > 0) {
    const names = conjunctions.map((p) => {
      const g = kb.grahas[p.body as GrahaId];
      return g ? `${g.sanskrit}/${g.en}` : p.body;
    });
    parts.push(`Conjoined with ${names.join(", ")} in the same house — their energies blend and colour each other.`);
  }

  if (aspectedPlanets.length > 0) {
    const names = aspectedPlanets.map((p) => {
      const g = kb.grahas[p.body as GrahaId];
      return g ? `${g.sanskrit}/${g.en} (house ${p.house})` : p.body;
    });
    parts.push(`Aspects ${names.join(", ")} — modifying those planetary energies.`);
  }

  if (parts.length === 0) {
    return "No major conjunctions or special aspects detected in this chart.";
  }

  return parts.join(" ");
}

// ── Planet interpretation ──────────────────────────────────────────────────────

export function composePlanetInterpretation(
  placement: Placement,
  allPlacements: Placement[]
): InterpretationResult {
  const grahaId = placement.body as GrahaId;
  const graha = kb.grahas[grahaId];
  const rashi = kb.rashis[placement.sign];
  const bhava = kb.bhavas[String(placement.house)];

  if (!graha || !rashi || !bhava) {
    return {
      headline: "Unknown placement",
      body: "Insufficient KB data for this placement.",
      dignityLabel: "unknown",
      dignityClass: "badge-neutral",
      houseClass: [],
      pillars: { planet: "", house: "", sign: "", dignity: "", aspects: "" },
    };
  }

  const dLabel = dignityLabel(placement.dignity);
  const dStrength = dignityStrength(placement.dignity);
  const houseClasses = getHouseClasses(placement.house);
  const houseClassDesc = houseClassDescription(houseClasses);
  const ruler = kb.grahas[rashi.ruler as GrahaId];

  // 1. PLANET pillar
  const planetPillar = `${graha.sanskrit} (${graha.en}) is the karaka of ${graha.karaka_of.slice(0, 4).join(", ")} — bringing its themes of ${graha.keywords.join(", ")}.`;

  // 2. HOUSE pillar
  const housePillar = `In the ${bhava.number}${ordinal(bhava.number)} house (${bhava.en}), it operates in the domain of ${bhava.signifies.slice(0, 5).join(", ")}.`;

  // 3. SIGN pillar
  const signPillar = `In ${rashi.sanskrit} (${rashi.en}), a ${rashi.modality} ${rashi.element} sign ruled by ${ruler?.sanskrit ?? rashi.ruler}/${ruler?.en ?? rashi.ruler}, it expresses through qualities of ${rashi.keywords.join(", ")}.`;

  // 4. DIGNITY pillar
  const dignityPillar = `Dignity: ${dLabel}. Here, ${graha.en} is ${dStrength}.${placement.neechaBhanga ? " A Neecha Bhanga (debilitation cancellation) condition may apply — check for the dispositor or exaltation lord in a kendra." : ""}`;

  // 5. ASPECTS pillar
  const aspectsPillar = aspectSentence(grahaId, placement, allPlacements);

  // Composed reading
  const retroNote = placement.retrograde
    ? ` ${graha.en} is currently retrograde (Vakri) — its energy turns inward, reviewing and refining rather than expressing outwardly.`
    : "";

  const houseClassNote = houseClassDesc ? ` ${houseClassDesc}.` : "";

  const headline = `${graha.sanskrit}/${graha.en} · House ${placement.house} · ${rashi.en}`;

  const body = [
    planetPillar,
    housePillar,
    signPillar,
    dignityPillar,
    retroNote,
    houseClassNote,
    aspectsPillar,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    headline,
    body,
    dignityLabel: dLabel,
    dignityClass: dignityBadgeClass(placement.dignity),
    houseClass: houseClasses,
    pillars: {
      planet: planetPillar,
      house: housePillar,
      sign: signPillar,
      dignity: dignityPillar,
      aspects: aspectsPillar,
    },
  };
}

// ── House interpretation ───────────────────────────────────────────────────────

export function composeHouseReading(
  houseNum: number,
  lagnaSign: number,
  allPlacements: Placement[]
): HouseReadingResult {
  const bhava = kb.bhavas[String(houseNum)];
  const signNum = ((lagnaSign - 1 + houseNum - 1) % 12) + 1;
  const signId = signFromNumber(signNum);
  const rashi = kb.rashis[signId];
  const houseClasses = getHouseClasses(houseNum);
  const houseClassDesc = houseClassDescription(houseClasses);
  const ruler = kb.grahas[rashi?.ruler as GrahaId];

  const planets = allPlacements
    .filter((p) => p.house === houseNum && p.body !== "lagna")
    .map((p) => p.body as GrahaId);

  const signObj = {
    id: signId,
    en: rashi?.en ?? signId,
    sanskrit: rashi?.sanskrit ?? signId,
    ruler: ruler ? `${ruler.sanskrit}/${ruler.en}` : rashi?.ruler ?? "unknown",
  };

  const planet_desc =
    planets.length === 0
      ? "No planets occupy this house in your natal chart — the house themes play out primarily through its sign and the condition of the sign's ruler."
      : `Planets here: ${planets
          .map((g) => {
            const gr = kb.grahas[g];
            return gr ? `${gr.sanskrit}/${gr.en}` : g;
          })
          .join(", ")}. Each planet adds its own karaka layer to these house themes.`;

  const body = [
    `The ${houseNum}${ordinal(houseNum)} house (${bhava?.en ?? ""}) signifies ${bhava?.signifies?.slice(0, 6).join(", ") ?? ""}.`,
    `This house holds ${rashi?.sanskrit} (${rashi?.en}), a ${rashi?.modality ?? ""} ${rashi?.element ?? ""} sign — lending those qualities to how these themes unfold.`,
    `The lord of this house is ${signObj.ruler}, whose condition in your chart determines how strongly these themes manifest.`,
    houseClassDesc ? houseClassDesc + "." : "",
    planet_desc,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    headline: `House ${houseNum} — ${bhava?.en ?? ""}`,
    significations: bhava?.signifies ?? [],
    sign: signObj,
    planets,
    houseClass: houseClasses,
    body,
  };
}

// ── Lagna interpretation ───────────────────────────────────────────────────────

export function composeLagnaReading(
  lagnaSign: number,
  allPlacements: Placement[]
): InterpretationResult {
  const signId = signFromNumber(lagnaSign);
  const rashi = kb.rashis[signId];
  const ruler = kb.grahas[rashi?.ruler as GrahaId];
  const rulerPlacement = allPlacements.find((p) => p.body === rashi?.ruler);
  const houseClasses = getHouseClasses(1);

  const headline = `Lagna — ${rashi?.sanskrit} (${rashi?.en}) Ascendant`;

  const body = [
    `Your Lagna (Ascendant) is ${rashi?.sanskrit} (${rashi?.en}), a ${rashi?.modality} ${rashi?.element} sign. This is the foundation of the chart — the lens through which all other planets express.`,
    `${rashi?.en} rising gives a natural orientation toward ${rashi?.keywords?.join(", ")}.`,
    `The Lagna lord is ${ruler?.sanskrit ?? rashi?.ruler} (${ruler?.en ?? ""}). ${
      rulerPlacement
        ? `In your chart, it sits in house ${rulerPlacement.house} (${kb.bhavas[String(rulerPlacement.house)]?.en ?? ""}) in ${kb.rashis[rulerPlacement.sign]?.en ?? rulerPlacement.sign} — directing the life force of the ascendant toward those themes.`
        : ""
    }`,
    `The 1st house (kendra + trikona) is the most powerful position in the chart — any planet here strongly colours personality, body, and life direction.`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    headline,
    body,
    dignityLabel: "Ascendant",
    dignityClass: "badge-own",
    houseClass: houseClasses,
    pillars: {
      planet: `Lagna lord: ${ruler?.sanskrit ?? ""}/${ruler?.en ?? ""}`,
      house: "1st house — Self, body, personality, life direction",
      sign: `${rashi?.sanskrit} — ${rashi?.keywords?.join(", ")}`,
      dignity: "The Lagna is always the chart's own sign",
      aspects: "",
    },
  };
}

// ── Utility ────────────────────────────────────────────────────────────────────

function ordinal(n: number): string {
  if (n === 1) return "st";
  if (n === 2) return "nd";
  if (n === 3) return "rd";
  return "th";
}

/** Build a per-house summary of which planets are in each house */
export function buildHouseMap(
  placements: Placement[]
): Map<number, Placement[]> {
  const map = new Map<number, Placement[]>();
  for (let h = 1; h <= 12; h++) map.set(h, []);
  for (const p of placements) {
    if (p.body === "lagna") continue;
    const arr = map.get(p.house) ?? [];
    arr.push(p);
    map.set(p.house, arr);
  }
  return map;
}
