/**
 * Key-later guard for Supabase Auth — same pattern as the OpenRouter key check.
 * Until NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are set (a
 * manual dashboard/Vercel step), every auth surface degrades gracefully instead
 * of crashing: the proxy skips session refresh, getSession() reads anonymous,
 * AuthButton renders nothing, and /login shows a friendly notice.
 *
 * NEXT_PUBLIC_* vars are inlined at build time, so this works in both server
 * and client bundles.
 */
export function authConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}
