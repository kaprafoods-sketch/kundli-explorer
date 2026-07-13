"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client — used only for auth flows (OAuth sign-in, magic
 * link, sign-out) from Client Components. Uses the public anon key. No
 * application data is ever read through this client.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
