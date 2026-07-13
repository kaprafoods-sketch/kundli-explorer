"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-browser";
import { authConfigured } from "@/lib/auth/config";

/**
 * Minimal auth affordance. Logged out → "Sign in" link to /login. Logged in →
 * shows the email + a sign-out button. Reads auth state client-side via the
 * public anon key and subscribes to auth changes, so it stays in sync without
 * any prop wiring from the server page.
 */
export default function AuthButton() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const configured = authConfigured();

  useEffect(() => {
    if (!configured) return;
    const supabase = createSupabaseBrowserClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setEmail(null);
    router.refresh();
  }

  // Key-later: auth env vars not set → no affordance at all (app stays anonymous).
  if (!configured) return null;
  if (!ready) return null;

  const pill: React.CSSProperties = {
    fontSize: "0.82rem",
    padding: "0.4rem 0.85rem",
    borderRadius: 999,
    border: "1px solid var(--line-brass)",
    background: "var(--panel, rgba(0,0,0,0.3))",
    color: "var(--foreground)",
    textDecoration: "none",
    cursor: "pointer",
    lineHeight: 1.2,
  };

  if (!email) {
    return (
      <Link href="/login" style={pill}>
        Sign in
      </Link>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
      <span
        style={{
          fontSize: "0.78rem",
          color: "var(--muted)",
          maxWidth: 160,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={email}
      >
        {email}
      </span>
      <button type="button" onClick={signOut} style={pill}>
        Sign out
      </button>
    </span>
  );
}
