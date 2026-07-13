import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { getSession } from "@/lib/auth/session";
import { upsertUser, claimChartsForToken, OWNER_COOKIE } from "@/lib/auth/user";
import { authConfigured } from "@/lib/auth/config";

export const runtime = "nodejs";

/**
 * OAuth / magic-link callback. Supabase redirects here with a `code` (PKCE)
 * that we exchange for a session. On success we:
 *   1. upsert the Prisma User (keyed by Supabase uid)
 *   2. one-time claim: attach any anonymous charts (kx_owner cookie) to the user
 *   3. clear the kx_owner cookie
 *   4. redirect to `next` (defaults to `/`)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Key-later guard: unreachable via a real Supabase redirect when auth is
  // unconfigured, but a direct visit must not 500.
  if (!authConfigured()) {
    return NextResponse.redirect(`${origin}/login`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // Session cookies are now set. Upsert the user + claim anonymous charts.
  const { user } = await getSession();
  const jar = await cookies();

  if (user) {
    try {
      await upsertUser(user);
      const ownerToken = jar.get(OWNER_COOKIE)?.value;
      if (ownerToken) {
        await claimChartsForToken(user.id, ownerToken);
        jar.delete(OWNER_COOKIE);
      }
    } catch (e) {
      // Claiming/upsert failure must not block login — log and continue.
      console.error("[auth/callback] post-login setup failed:", e);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
