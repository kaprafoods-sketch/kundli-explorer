import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { kb } from "@/lib/kb";
import type { NatalChart } from "@/lib/astro/computeChart";
import type { GrahaId } from "@/lib/kb";

export const runtime = "nodejs";

const SYSTEM_PROMPT = (chart: NatalChart): string => {
  const placements = chart.placements
    .filter((p) => p.body !== "lagna")
    .map((p) => {
      const g = kb.grahas[p.body as GrahaId];
      const r = kb.rashis[p.sign];
      return `- ${g?.sanskrit ?? p.body} (${g?.en ?? p.body}): House ${p.house}, ${r?.sanskrit ?? p.sign} (${r?.en ?? p.sign}), ${p.dignity}${p.retrograde ? ", retrograde" : ""}`;
    })
    .join("\n");

  return `You are an Jyotish (Vedic astrology) tutor. Your role is to TEACH the user to understand their birth chart — not to make predictions.

CHART: ${chart.meta.name}, born ${chart.meta.dob} (${chart.meta.tz})
Ayanamsha: Lahiri (${chart.meta.ayanamshaValue?.toFixed(2) ?? "~23.65"}°) | House system: Whole-sign
Lagna (Ascendant): ${chart.ascendant.sign} (sign ${chart.lagnaSign})

PLACEMENTS:
${placements}

Dasha: Currently in ${chart.dasha.current.maha.lord} Mahadasha / ${chart.dasha.current.antar.lord} Antardasha
(${new Date(chart.dasha.current.maha.start).toDateString()} – ${new Date(chart.dasha.current.maha.end).toDateString()})

TEACHING RULES (non-negotiable):
1. Always TEACH the reasoning. Explain WHY — cite the actual placement, sign, dignity, and house in your answer. E.g., "Your Saturn is in Scorpio, an enemy sign for Saturn, in the 12th house of losses — this is why it expresses with friction."
2. NEVER make fatalistic statements ("you will suffer", "bad luck", "danger"). This is an educational tool.
3. If asked for future predictions, explain what the dasha/transit placement MEANS and how the person can work with its energy — redirect to understanding and agency.
4. Follow the Planet + House + Sign + Dignity + Aspects formula when interpreting.
5. Cite the dignity explicitly (exalted / own / friend / neutral / enemy / debilitated).
6. Keep answers concise but complete. Use paragraph breaks, not bullet lists by default.
7. Use Sanskrit names alongside English on first mention (Shani/Saturn).

Be warm, grounded, and intellectually honest — this is astrology as a tool for self-understanding, not fortune-telling.`;
};

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return new Response("ANTHROPIC_API_KEY not configured", { status: 503 });
  }

  let chartId: string;
  let message: string;

  try {
    const body = await req.json();
    chartId = body.chartId;
    message = body.message;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!chartId || !message?.trim()) {
    return new Response("Missing chartId or message", { status: 400 });
  }

  const record = await db.chart.findUnique({ where: { id: chartId } });
  if (!record) return new Response("Chart not found", { status: 404 });

  const chart = record.data as unknown as NatalChart;

  // Fetch recent history (last 20 turns)
  const history = await db.tutorMessage.findMany({
    where: { chartId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  // Persist user message
  await db.tutorMessage.create({
    data: { chartId, role: "user", content: message },
  });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT(chart),
    messages: [
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: message },
    ],
  });

  // Collect the full response to persist
  let fullResponse = "";

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            fullResponse += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
        }
      } finally {
        controller.close();
        // Persist assistant response after stream ends
        if (fullResponse) {
          await db.tutorMessage.create({
            data: { chartId, role: "assistant", content: fullResponse },
          }).catch(console.error);
        }
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
