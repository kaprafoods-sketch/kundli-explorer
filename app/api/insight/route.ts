import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import { kb } from "@/lib/kb";
import {
  composePlanetInterpretation,
  composeHouseReading,
  composeLagnaReading,
} from "@/lib/interpret";
import type { NatalChart, Placement } from "@/lib/astro/computeChart";
import type { GrahaId } from "@/lib/kb";

export const runtime = "nodejs";

// ── Prompt builders ───────────────────────────────────────────────────────────

const RULES = `TEACHING RULES (non-negotiable):
1. Teach WHY — cite the actual placement, dignity, house, and sign in every insight
2. NO fatalism. Never say "you will suffer", "bad luck", "danger", "loss", "death", "failure", "struggle ahead"
3. This is an educational tool for self-understanding — not fortune-telling or prediction
4. Cite dignity explicitly in the opening synthesis paragraph
5. Sanskrit + English on first mention: e.g. "Shani/Saturn", "Karka/Cancer", "Tula/Libra"
6. Agency-focused: "this placement gives you the capacity for X" — never "this will make you Y"
7. Ground every insight in the authoritative facts above — invent nothing`;

const OUTPUT_RULES_NO_AXIS = `OUTPUT FORMAT — write exactly this markdown structure, nothing else:

[synthesis paragraph — 2-3 sentences naming the actual planet/placement, dignity, sign, and house. Make it vivid and educational, not generic.]

## What this gives you
1. [Insight grounded in a specific karaka × house signification × sign flavor × dignity — be concrete]
2. [Another insight from a different angle]
3. [Third insight]
4. [Optional 4th insight — only if genuinely distinct]
5. [Optional 5th insight — only if genuinely distinct]

## Long-term potential
[1-2 sentences: how to consciously work with this placement's energy; forward-looking and agency-focused]

Do NOT add "## Why this matters for you". Do NOT add any other sections.`;

const OUTPUT_RULES_WITH_AXIS = (rahuHouse: number, ketuHouse: number) =>
  `OUTPUT FORMAT — write exactly this markdown structure, nothing else:

[synthesis paragraph — 2-3 sentences naming the actual node, sign, and house. Vivid and educational.]

## What this gives you
1. [Insight about this node's house/sign themes × its karaka role — concrete]
2. [Another insight from a different angle]
3. [Third insight]
4. [Optional 4th insight — only if genuinely distinct]

## The Rahu–Ketu axis
[One paragraph on the soul-level pull between House ${rahuHouse} (Rahu/North Node) and House ${ketuHouse} (Ketu/South Node). Frame as a tension between two sets of life themes the person is navigating — educational and non-fatalistic.]

## Long-term potential
[1-2 sentences: how to consciously work with this nodal axis's energy; agency-focused]

Do NOT add "## Why this matters for you". Do NOT add any other sections.`;

function buildPlanetPrompt(placement: Placement, chart: NatalChart): string {
  const grahaId = placement.body as GrahaId;
  const graha = kb.grahas[grahaId];
  const rashi = kb.rashis[placement.sign];
  const bhava = kb.bhavas[String(placement.house)];
  const ruler = kb.grahas[rashi?.ruler as GrahaId];
  const interp = composePlanetInterpretation(placement, chart.placements);

  const isNode = grahaId === "rahu" || grahaId === "ketu";
  const oppositeId = grahaId === "rahu" ? "ketu" : grahaId === "ketu" ? "rahu" : null;
  const oppPlacement = oppositeId
    ? chart.placements.find((p) => p.body === oppositeId)
    : null;
  const oppGraha = oppositeId ? kb.grahas[oppositeId as GrahaId] : null;
  const oppRashi = oppPlacement ? kb.rashis[oppPlacement.sign] : null;
  const oppBhava = oppPlacement ? kb.bhavas[String(oppPlacement.house)] : null;

  const axisBlock = isNode && oppPlacement
    ? `
NODAL AXIS (for the Rahu–Ketu axis section):
${oppGraha?.sanskrit}/${oppGraha?.en} sits in House ${oppPlacement.house} — ${oppBhava?.en} (${oppRashi?.sanskrit}/${oppRashi?.en})
The axis spans House ${placement.house} ↔ House ${oppPlacement.house}.`
    : "";

  const rahuHouse = grahaId === "rahu" ? placement.house : (oppPlacement?.house ?? 0);
  const ketuHouse = grahaId === "ketu" ? placement.house : (oppPlacement?.house ?? 0);

  return `You are a Jyotish (Vedic astrology) educator composing a deep reading for one placement in a student's birth chart.

AUTHORITATIVE GROUND TRUTH — derived from Swiss Ephemeris, Lahiri ayanamsha:
Planet: ${graha?.sanskrit} (${graha?.en})
House: ${placement.house} — ${bhava?.en}
House signifies: ${bhava?.signifies?.slice(0, 7).join(", ")}
Sign: ${rashi?.sanskrit} (${rashi?.en}), ${rashi?.modality} ${rashi?.element}, ruled by ${ruler?.sanskrit}/${ruler?.en}
Dignity: ${interp.dignityLabel}
Dignity detail: ${interp.pillars.dignity}
House class: ${interp.houseClass.join(", ") || "standard"}
Retrograde (Vakri): ${placement.retrograde ? "Yes — energy turns inward, reviewing rather than projecting" : "No"}
Nakshatra: ${placement.nakshatra?.replace(/_/g, " ")}, Pada ${placement.pada}
Aspects & conjunctions: ${interp.pillars.aspects}
${graha?.en}'s karakas (significations): ${graha?.karaka_of?.join(", ")}
${graha?.en} keywords: ${graha?.keywords?.join(", ")}
Sign (${rashi?.en}) keywords: ${rashi?.keywords?.join(", ")}${axisBlock}

${RULES}

${isNode && oppPlacement ? OUTPUT_RULES_WITH_AXIS(rahuHouse, ketuHouse) : OUTPUT_RULES_NO_AXIS}`;
}

function buildHousePrompt(houseNum: number, chart: NatalChart): string {
  const data = composeHouseReading(houseNum, chart.lagnaSign, chart.placements);
  const bhava = kb.bhavas[String(houseNum)];
  const rashi = kb.rashis[data.sign.id];
  const ruler = kb.grahas[rashi?.ruler as GrahaId];
  const planetsInHouse = data.planets
    .map((g) => {
      const gr = kb.grahas[g];
      return gr ? `${gr.sanskrit}/${gr.en} (${kb.rashis[chart.placements.find(p => p.body === g)?.sign ?? "aries"]?.en ?? ""})` : g;
    })
    .join(", ");

  return `You are a Jyotish (Vedic astrology) educator composing a reading for one house in a student's birth chart.

AUTHORITATIVE GROUND TRUTH:
House: ${houseNum} — ${bhava?.en}
House signifies: ${bhava?.signifies?.slice(0, 7).join(", ")}
House keywords: ${bhava?.keywords?.slice(0, 5).join(", ")}
House class: ${data.houseClass.join(", ") || "standard"}
Sign occupying this house: ${data.sign.sanskrit} (${data.sign.en}), ${rashi?.modality ?? ""} ${rashi?.element ?? ""}
Sign ruler: ${data.sign.ruler}
Sign keywords: ${rashi?.keywords?.join(", ")}
Planets in this house: ${data.planets.length > 0 ? planetsInHouse : "none — themes express through sign and ruler's condition"}
Ruler placement note: ${ruler?.sanskrit}/${ruler?.en} is the lord of this house; its condition shapes how powerfully these themes manifest.

${RULES}

OUTPUT FORMAT — write exactly this markdown structure, nothing else:

[synthesis paragraph — 2-3 sentences on what this house's sign placement means for the person's experience of these life themes. Be concrete and educational, not generic.]

## What this gives you
1. [Insight grounded in the sign's qualities × this house's significations — concrete]
2. [Another angle: what the house class means for timing or strength]
3. [Third insight — about the ruler or any occupying planets]
4. [Optional 4th insight — only if genuinely distinct]

## Long-term potential
[1-2 sentences: how to consciously develop and work with these house themes; agency-focused]

Do NOT add "## Why this matters for you". Do NOT add any other sections.`;
}

function buildLagnaPrompt(chart: NatalChart): string {
  const data = composeLagnaReading(chart.lagnaSign, chart.placements);
  const signId = chart.ascendant.sign;
  const rashi = kb.rashis[signId];
  const ruler = kb.grahas[rashi?.ruler as GrahaId];
  const rulerPlacement = chart.placements.find((p) => p.body === rashi?.ruler);
  const rulerBhava = rulerPlacement ? kb.bhavas[String(rulerPlacement.house)] : null;
  const rulerRashi = rulerPlacement ? kb.rashis[rulerPlacement.sign] : null;

  return `You are a Jyotish (Vedic astrology) educator composing a reading for the Lagna (Ascendant) of a student's birth chart.

AUTHORITATIVE GROUND TRUTH:
Lagna (Ascendant): ${rashi?.sanskrit} (${rashi?.en}) — the foundational lens and identity of the entire chart
Sign qualities: ${rashi?.modality} ${rashi?.element}
Sign keywords: ${rashi?.keywords?.join(", ")}
Lagna lord: ${ruler?.sanskrit}/${ruler?.en}
Lagna lord placement: House ${rulerPlacement?.house ?? "unknown"} — ${rulerBhava?.en ?? ""}, in ${rulerRashi?.sanskrit ?? ""}/${rulerRashi?.en ?? ""}
Lagna lord dignity: ${rulerPlacement?.dignity ?? "unknown"}
The 1st house (Lagna) is simultaneously kendra AND trikona — the most powerful position in the chart.
Pillars from the reading: ${data.pillars.planet} | ${data.pillars.sign}

${RULES}

OUTPUT FORMAT — write exactly this markdown structure, nothing else:

[synthesis paragraph — 2-3 sentences on what this Lagna sign means as the chart's foundational energy. Name the sign, its qualities, and the lagna lord's placement. Vivid and educational.]

## What this gives you
1. [Insight about how ${rashi?.en} rising shapes personality, body, and life orientation — concrete]
2. [Insight about the Lagna lord's house placement and what it directs energy toward]
3. [Third insight — element/modality of the sign and what that means in practice]
4. [Optional 4th insight — only if genuinely distinct]

## Long-term potential
[1-2 sentences: how to consciously work with this Ascendant's energy and develop its highest expression]

Do NOT add "## Why this matters for you". Do NOT add any other sections.`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return new Response("ANTHROPIC_API_KEY not configured", { status: 503 });
  }

  let chartId: string;
  let target: { kind: "planet" | "house" | "lagna"; id: string | number };

  try {
    const body = await req.json();
    chartId = body.chartId;
    target = body.target;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!chartId || !target?.kind) {
    return new Response("Missing chartId or target", { status: 400 });
  }

  const { data: record } = await supabase
    .from("Chart")
    .select("*")
    .eq("id", chartId)
    .single();

  if (!record) return new Response("Chart not found", { status: 404 });

  const chart = record.data as NatalChart;

  // Compute ground truth server-side — never trust the client
  let systemPrompt: string;

  if (target.kind === "planet") {
    const grahaId = String(target.id) as GrahaId;
    const placement = chart.placements.find(
      (p) => p.body === grahaId
    );
    if (!placement) return new Response("Planet not found in chart", { status: 400 });
    systemPrompt = buildPlanetPrompt(placement, chart);
  } else if (target.kind === "house") {
    const houseNum = Number(target.id);
    if (houseNum < 1 || houseNum > 12 || isNaN(houseNum)) {
      return new Response("Invalid house number", { status: 400 });
    }
    systemPrompt = buildHousePrompt(houseNum, chart);
  } else if (target.kind === "lagna") {
    systemPrompt = buildLagnaPrompt(chart);
  } else {
    return new Response("Invalid target kind", { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 900,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: "Please compose my reading now.",
      },
    ],
  });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
