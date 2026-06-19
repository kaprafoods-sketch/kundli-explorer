import { NextRequest } from "next/server";
import { getGemini, GEMINI_MODEL } from "@/lib/gemini";
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

// ── System prompt ─────────────────────────────────────────────────────────────

function buildBaseInstruction(chart: NatalChart): string {
  const placements = chart.placements
    .filter((p) => p.body !== "lagna")
    .map((p) => {
      const g = kb.grahas[p.body as GrahaId];
      const r = kb.rashis[p.sign];
      return `- ${g?.sanskrit ?? p.body} (${g?.en ?? p.body}): House ${p.house}, ${r?.sanskrit ?? p.sign} (${r?.en ?? p.sign}), ${p.dignity}${p.retrograde ? ", retrograde" : ""}`;
    })
    .join("\n");

  return `You are GRAHA AI, a Jyotish (Vedic astrology) educator. Your role is to TEACH the user to understand their birth chart — not to make predictions.

CHART: ${chart.meta.name}, born ${chart.meta.dob} (${chart.meta.tz})
Ayanamsha: Lahiri (${chart.meta.ayanamshaValue?.toFixed(2) ?? "~23.65"}°) | House system: Whole-sign
Lagna (Ascendant): ${chart.ascendant.sign} (sign ${chart.lagnaSign})

PLACEMENTS:
${placements}

Dasha: Currently in ${chart.dasha.current.maha.lord} Mahadasha / ${chart.dasha.current.antar.lord} Antardasha
(${new Date(chart.dasha.current.maha.start).toDateString()} – ${new Date(chart.dasha.current.maha.end).toDateString()})

TEACHING RULES (non-negotiable):
1. Always TEACH the reasoning — cite the actual placement, sign, dignity, and house in every answer.
2. NEVER make fatalistic statements: "you will suffer", "bad luck", "danger", "loss", "failure". This is an educational tool for self-understanding.
3. Follow the Planet + House + Sign + Dignity + Aspects formula when interpreting.
4. Cite the dignity explicitly (exalted / own / friend / neutral / enemy / debilitated).
5. Use Sanskrit names alongside English on first mention: Shani/Saturn, Guru/Jupiter, Karka/Cancer.
6. Agency-focused language: "this placement gives you the capacity for…" — never "this will make you…".
7. If asked for predictions, explain what the dasha/placement MEANS and how to consciously work with its energy.

Be warm, grounded, and intellectually honest — this is astrology as a tool for self-understanding.`;
}

function buildFocusBlock(
  focus: { kind: "planet" | "house" | "lagna"; id?: string | number },
  chart: NatalChart
): string {
  try {
    if (focus.kind === "planet" && focus.id) {
      const grahaId = String(focus.id) as GrahaId;
      const placement = chart.placements.find((p) => p.body === grahaId);
      if (!placement) return "";
      const interp = composePlanetInterpretation(placement, chart.placements);
      const graha = kb.grahas[grahaId];
      return `
FOCUSED PLACEMENT (user is looking at this):
${graha?.sanskrit ?? grahaId} (${graha?.en ?? grahaId}) in House ${placement.house} — ${kb.rashis[placement.sign]?.sanskrit} (${kb.rashis[placement.sign]?.en}), ${interp.dignityLabel}
${interp.pillars.planet}
${interp.pillars.house}
${interp.pillars.sign}
${interp.pillars.dignity}
${interp.pillars.aspects ? interp.pillars.aspects : ""}

Center your answers on this placement unless the user explicitly asks about something else.`;
    }

    if (focus.kind === "house" && focus.id) {
      const houseNum = Number(focus.id);
      const reading = composeHouseReading(houseNum, chart.lagnaSign, chart.placements);
      return `
FOCUSED HOUSE (user is looking at this):
${reading.headline}
Sign: ${reading.sign.sanskrit} (${reading.sign.en}), ruled by ${reading.sign.ruler}
Signifies: ${reading.significations.slice(0, 6).join(", ")}
${reading.body}

Center your answers on this house unless the user explicitly asks about something else.`;
    }

    if (focus.kind === "lagna") {
      const reading = composeLagnaReading(chart.lagnaSign, chart.placements);
      return `
FOCUSED ON LAGNA (user is looking at the Ascendant):
${reading.headline}
${reading.body}
${reading.pillars.planet}

Center your answers on the Lagna/Ascendant unless the user explicitly asks about something else.`;
    }
  } catch {
    // composer errors must never 500 the request
  }
  return "";
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ai = getGemini();
  if (!ai) return new Response("GEMINI_API_KEY not configured", { status: 503 });

  let chartId: string;
  let message: string;
  let focus: { kind: "planet" | "house" | "lagna"; id?: string | number } | undefined;

  try {
    const body = await req.json();
    chartId = body.chartId;
    message = body.message;
    focus = body.focus;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!chartId || !message?.trim()) {
    return new Response("Missing chartId or message", { status: 400 });
  }

  const { data: record } = await supabase
    .from("Chart")
    .select("*")
    .eq("id", chartId)
    .single();

  if (!record) return new Response("Chart not found", { status: 404 });

  const chart = record.data as NatalChart;

  const systemInstruction =
    buildBaseInstruction(chart) +
    (focus ? buildFocusBlock(focus, chart) : "");

  // Load thread history
  const { data: history } = await supabase
    .from("TutorMessage")
    .select("*")
    .eq("chartId", chartId)
    .order("createdAt", { ascending: true })
    .limit(30);

  // Persist user message before streaming
  await supabase
    .from("TutorMessage")
    .insert({ chartId, role: "user", content: message });

  const contents = [
    ...((history ?? []).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content as string }],
    }))),
    { role: "user", parts: [{ text: message }] },
  ];

  const response = await ai.models.generateContentStream({
    model: GEMINI_MODEL,
    contents,
    config: { systemInstruction, maxOutputTokens: 1024 },
  });

  let fullReply = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of response) {
          const text = chunk.text;
          if (text) {
            fullReply += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
        }
      } finally {
        controller.close();
        if (fullReply) {
          await supabase
            .from("TutorMessage")
            .insert({ chartId, role: "assistant", content: fullReply })
            .then(({ error }) => {
              if (error) console.error("graha-ai persist:", error);
            });
        }
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
