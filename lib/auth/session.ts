import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

export interface SessionUser {
  id: string; // Supabase auth uid
  email: string | null;
}

/**
 * The single way every route/action reads identity.
 *
 * Returns `{ user: null }` for anonymous visitors — callers must handle the
 * anonymous case (anonymous chart creation keeps working; auth is prompted
 * only at save / second-chart / paywall boundaries).
 *
 * Uses `getUser()` (not `getSession()`) so the token is verified against the
 * Supabase auth server rather than trusted from the cookie.
 */
export async function getSession(): Promise<{ user: SessionUser | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { user: null };
    return { user: { id: user.id, email: user.email ?? null } };
  } catch {
    return { user: null };
  }
}
