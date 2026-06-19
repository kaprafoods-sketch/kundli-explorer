import { createClient } from "@supabase/supabase-js";
import type { NatalChart } from "@/lib/astro/computeChart";

export interface ChartRow {
  id: string;
  name: string;
  dob: string;
  lat: number;
  lon: number;
  tz: string;
  ayanamsha: string;
  data: NatalChart;
  createdAt: string;
  ownerToken?: string | null;
  relation?: string | null;
  // ── Engagement engine ──────────────────────────────────────────
  interests: string[]; // life-area ids the user cares about
  depth: string; // "quick" | "deep"
  intentNote?: string | null;
}

export interface TutorMessageRow {
  id: string;
  chartId: string;
  role: string;
  content: string;
  createdAt: string;
  // ── Per-message feedback (analytics / KB-gap / dataset only) ─────
  rating?: string | null; // "true" | "not_quite"
  ratingReason?: string | null; // "too_generic" | "doesnt_match" | "too_vague"
  useful?: boolean | null;
}

// Server-side only — uses the service key (or anon key when RLS is disabled)
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);
