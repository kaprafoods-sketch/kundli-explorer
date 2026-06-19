import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Per-message feedback capture for GRAHA AI.
 *
 * GUARDRAIL: this data is for analytics, KB-gap flagging, and a future fine-tune
 * dataset ONLY. Nothing here conditions or optimizes model responses — doing so
 * would train toward generic Barnum statements, which the KB architecture
 * deliberately avoids.
 *
 * TODO (robustness): correlate feedback to a specific message id returned by the
 * /api/graha-ai stream. For v1 we update the most-recent assistant row for the
 * chart, which is correct because feedback is given immediately after a reply.
 */

const VALID_RATING = new Set(["true", "not_quite"]);
const VALID_REASON = new Set(["too_generic", "doesnt_match", "too_vague"]);

export async function POST(req: NextRequest) {
  let body: {
    chartId?: string;
    content?: string;
    rating?: string;
    ratingReason?: string;
    useful?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { chartId, rating, ratingReason, useful } = body;

  if (!chartId) {
    return NextResponse.json({ error: "Missing chartId" }, { status: 400 });
  }
  if (rating !== undefined && !VALID_RATING.has(rating)) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }
  if (ratingReason !== undefined && ratingReason !== null && !VALID_REASON.has(ratingReason)) {
    return NextResponse.json({ error: "Invalid ratingReason" }, { status: 400 });
  }

  // Most recent assistant message for this chart.
  const { data: rows, error: selErr } = await supabase
    .from("TutorMessage")
    .select("id, role")
    .eq("chartId", chartId)
    .eq("role", "assistant")
    .order("createdAt", { ascending: false })
    .limit(1);

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 });
  }
  const target = rows?.[0];
  if (!target || target.role !== "assistant") {
    return NextResponse.json({ error: "No assistant message to rate" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  if (rating !== undefined) update.rating = rating;
  if (ratingReason !== undefined) update.ratingReason = ratingReason ?? null;
  if (useful !== undefined) update.useful = useful;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error: updErr } = await supabase
    .from("TutorMessage")
    .update(update)
    .eq("id", target.id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
