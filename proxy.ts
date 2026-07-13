import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next.js 16 Proxy (the renamed `middleware` convention — see
 * node_modules/next/dist/docs/.../proxy.md). Refreshes the Supabase auth
 * session on each request so Server Components always see a fresh token.
 *
 * It ONLY refreshes auth cookies — no route protection here (anonymous chart
 * creation must keep working; auth is gated per-action, not per-route).
 * Proxy defaults to the Node.js runtime in Next 16.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Key-later guard: until the Supabase publishable env vars are set (manual
  // dashboard/Vercel step), skip session refresh entirely — the app runs fully
  // anonymous instead of 500ing on every request.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  ) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touch the user to trigger a token refresh when needed. Must run before any
  // response is returned. Never throws the request.
  try {
    await supabase.auth.getUser();
  } catch {
    // ignore — an unrefreshable session simply reads as anonymous downstream
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on all paths except static assets and image optimization, so auth
     * cookies stay fresh on navigations without blocking CSS/JS/images.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
