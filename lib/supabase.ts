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

// ── Resolve connection details ────────────────────────────────────────────────
// The runtime data layer talks to Supabase over supabase-js, which needs the
// project's REST URL + a key. Historically only DATABASE_URL/DIRECT_URL were
// documented (see .env.example), so SUPABASE_URL was frequently unset — and
// `createClient(undefined, ...)` throws "supabaseUrl is required." at import
// time, taking down every server action that touches the DB (chart creation /
// "signup", profile listing, GRAHA AI). To make that robust we derive the REST
// URL from the Postgres connection string when SUPABASE_URL is absent, and fail
// with an actionable message naming the missing variable when we cannot.

/** Extract the Supabase project ref from a Postgres connection string. */
function projectRefFromPgUrl(conn: string | undefined): string | null {
  if (!conn) return null;
  try {
    const u = new URL(conn);
    // Direct connection: host is db.<ref>.supabase.co
    const hostMatch = u.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
    if (hostMatch) return hostMatch[1];
    // Pooled (PgBouncer): username is postgres.<ref>
    const userMatch = decodeURIComponent(u.username).match(/^postgres\.([a-z0-9]+)$/i);
    if (userMatch) return userMatch[1];
  } catch {
    /* not a parseable URL — fall through */
  }
  return null;
}

function resolveSupabaseUrl(): string {
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;
  const ref =
    projectRefFromPgUrl(process.env.DATABASE_URL) ??
    projectRefFromPgUrl(process.env.DIRECT_URL);
  if (ref) return `https://${ref}.supabase.co`;
  throw new Error(
    "Supabase is not configured: set SUPABASE_URL (or a DATABASE_URL/DIRECT_URL " +
      "from which the project ref can be derived). See .env.example.",
  );
}

function resolveSupabaseKey(): string {
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (key) return key;
  throw new Error(
    "Supabase is not configured: set SUPABASE_SERVICE_KEY (service role key) — " +
      "required for server-side writes such as chart creation. See .env.example.",
  );
}

// Server-side only — uses the service key (or anon key when RLS is disabled)
export const supabase = createClient(resolveSupabaseUrl(), resolveSupabaseKey());
