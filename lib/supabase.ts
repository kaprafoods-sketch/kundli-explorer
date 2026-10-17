import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY: this module embeds the Supabase service-role key — never import from "use client" code.

// Server-side only — uses the service key (or anon key when RLS is disabled)
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);
