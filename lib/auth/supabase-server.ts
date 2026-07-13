import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server-side Supabase client bound to the Next.js request cookie jar.
 * Used inside Server Components, Server Actions, and Route Handlers to read
 * the authenticated session. Auth cookies are the ONLY thing this client
 * touches — all application data still flows through the server-only
 * service-key client (`lib/supabase.ts`) / Prisma (`lib/db.ts`).
 *
 * Uses NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY. The anon key
 * is a public, RLS-scoped identity key (safe in the browser) — it is NOT the
 * service key and grants no data access here (RLS-off tables are never read
 * through it).
 */
export async function createSupabaseServerClient() {
  const jar = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return jar.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              jar.set(name, value, options);
            });
          } catch {
            // `setAll` from a Server Component is a no-op (cookies are
            // read-only there). Session refresh happens in proxy.ts, so this
            // is safe to swallow.
          }
        },
      },
    },
  );
}
