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
}

export interface TutorMessageRow {
  id: string;
  chartId: string;
  role: string;
  content: string;
  createdAt: string;
}

// Server-side only — uses the service key (or anon key when RLS is disabled)
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);
