"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-browser";
import { authConfigured } from "@/lib/auth/config";

export default function LoginPage() {
  const params = useSearchParams();
  const nextPath = params.get("next") ?? "/";
  const initialError = params.get("error")
    ? "Something went wrong signing you in. Please try again."
    : null;

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(initialError);

  const redirectTo = () => {
    const url = new URL("/auth/callback", window.location.origin);
    url.searchParams.set("next", nextPath);
    return url.toString();
  };

  async function signInWithGoogle() {
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) setError(error.message);
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "2rem 1.25rem",
        background: "var(--bg)",
        color: "var(--foreground)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--panel)",
          border: "1px solid var(--line-brass)",
          borderRadius: 16,
          padding: "2rem 1.75rem",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-wordmark, var(--font-display))",
            fontSize: "1.5rem",
            color: "var(--brass)",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: "0.35rem",
          }}
        >
          Graha
        </Link>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.35rem",
            margin: "0.5rem 0 0.25rem",
          }}
        >
          Sign in
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0 }}>
          Save your charts and pick up where you left off.
        </p>

        {/* Key-later: auth env vars not yet configured → friendly notice, no crash */}
        {!authConfigured() && (
          <p
            style={{
              marginTop: "1.5rem",
              padding: "0.85rem 1rem",
              borderRadius: 10,
              border: "1px dashed var(--line-brass)",
              color: "var(--muted)",
              fontSize: "0.85rem",
              lineHeight: 1.5,
            }}
          >
            Sign-in isn&apos;t configured yet on this deployment. You can still
            compute and explore charts anonymously —{" "}
            <Link href="/" style={{ color: "var(--brass)" }}>
              start here
            </Link>
            .
          </p>
        )}

        {authConfigured() && (
        <>
        <button
          type="button"
          onClick={signInWithGoogle}
          style={{
            marginTop: "1.5rem",
            width: "100%",
            padding: "0.7rem 1rem",
            borderRadius: 10,
            border: "1px solid var(--line-brass)",
            background: "var(--panel-2)",
            color: "var(--foreground)",
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          Continue with Google
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            margin: "1.25rem 0",
            color: "var(--faint)",
            fontSize: "0.75rem",
          }}
        >
          <span style={{ flex: 1, height: 1, background: "var(--line-brass)" }} />
          or
          <span style={{ flex: 1, height: 1, background: "var(--line-brass)" }} />
        </div>

        {status === "sent" ? (
          <p style={{ color: "var(--brass)", fontSize: "0.9rem" }}>
            Check your inbox — we sent a magic link to{" "}
            <strong>{email}</strong>.
          </p>
        ) : (
          <form onSubmit={sendMagicLink}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "0.8rem",
                color: "var(--muted)",
                marginBottom: "0.4rem",
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: 10,
                border: "1px solid var(--line-brass)",
                background: "var(--bg)",
                color: "var(--foreground)",
                fontSize: "0.95rem",
              }}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              style={{
                marginTop: "0.85rem",
                width: "100%",
                padding: "0.7rem 1rem",
                borderRadius: 10,
                border: "none",
                background: "var(--brass)",
                color: "var(--bg)",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: status === "sending" ? "default" : "pointer",
                opacity: status === "sending" ? 0.7 : 1,
              }}
            >
              {status === "sending" ? "Sending…" : "Email me a magic link"}
            </button>
          </form>
        )}

        {error && (
          <p
            style={{
              color: "var(--error, #e06c6c)",
              fontSize: "0.82rem",
              marginTop: "1rem",
            }}
          >
            {error}
          </p>
        )}
        </>
        )}
      </div>
    </main>
  );
}
