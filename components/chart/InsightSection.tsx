"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "./Markdown";

// Set to false to show a "Reveal deeper reading" button instead of auto-streaming
const AUTO_INSIGHT = true;

interface Target {
  kind: "planet" | "house" | "lagna";
  id: string | number;
}

interface Props {
  chartId: string;
  target: Target;
}

type Status = "idle" | "loading" | "streaming" | "done" | "error";

function cacheKeyFor(target: Target): string {
  return target.kind === "lagna" ? "lagna:" : `${target.kind}:${target.id}`;
}

export default function InsightSection({ chartId, target }: Props) {
  const cacheRef = useRef<Map<string, string>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [content, setContent] = useState("");

  const cacheKey = cacheKeyFor(target);

  // Check key availability once on mount
  useEffect(() => {
    fetch("/api/tutor/check")
      .then((r) => r.json())
      .then((d: { available: boolean }) => setHasKey(d.available))
      .catch(() => setHasKey(false));
  }, []);

  // Fetch / serve from cache whenever target or key availability changes
  useEffect(() => {
    if (hasKey === null) return; // wait for key check

    // Cancel any in-flight stream from the previous target
    abortRef.current?.abort();

    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setContent(cached);
      setStatus("done");
      return;
    }

    if (!hasKey) {
      setStatus("idle");
      setContent("");
      return;
    }

    if (!AUTO_INSIGHT) {
      setStatus("idle");
      setContent("");
      return;
    }

    // Auto-stream
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let mounted = true;

    setStatus("loading");
    setContent("");

    (async () => {
      try {
        const res = await fetch("/api/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chartId, target }),
          signal: ctrl.signal,
        });

        if (!mounted) return;

        if (res.status === 503) {
          setHasKey(false);
          setStatus("idle");
          return;
        }

        if (!res.ok) {
          setStatus("error");
          return;
        }

        setStatus("streaming");
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let text = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            text += decoder.decode(value, { stream: true });
            if (mounted) setContent(text);
          }
        }

        if (mounted) {
          cacheRef.current.set(cacheKey, text);
          setStatus("done");
        }
      } catch (err) {
        if (!mounted) return;
        if ((err as Error).name !== "AbortError") setStatus("error");
      }
    })();

    return () => {
      mounted = false;
      ctrl.abort();
    };
  }, [cacheKey, hasKey, chartId]); // target captured via cacheKey

  // ── No API key ───────────────────────────────────────────────────────────────

  if (hasKey === false) {
    return (
      <div
        style={{
          borderTop: "1px solid rgba(200,162,74,0.2)",
          paddingTop: 18, marginTop: 4,
        }}
      >
        <SectionLabel />
        <div
          style={{
            background: "rgba(200,162,74,0.06)",
            border: "1px solid rgba(200,162,74,0.18)",
            borderRadius: 8, padding: "12px 16px",
          }}
        >
          <p style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.6 }}>
            Add an{" "}
            <span style={{ color: "var(--brass)" }}>ANTHROPIC_API_KEY</span>
            {" "}to your environment to unlock AI-composed deep readings.
            The deterministic reading above works fully without it.
          </p>
        </div>
      </div>
    );
  }

  // ── Manual trigger (AUTO_INSIGHT = false) ────────────────────────────────────

  if (!AUTO_INSIGHT && status === "idle" && hasKey) {
    return (
      <div style={{ borderTop: "1px solid rgba(200,162,74,0.2)", paddingTop: 18, marginTop: 4 }}>
        <SectionLabel />
        <button
          onClick={() => {
            const ctrl = new AbortController();
            abortRef.current = ctrl;
            let mounted = true;
            setStatus("loading");
            setContent("");

            (async () => {
              try {
                const res = await fetch("/api/insight", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ chartId, target }),
                  signal: ctrl.signal,
                });
                if (!mounted) return;
                if (!res.ok) { setStatus("error"); return; }
                setStatus("streaming");
                const reader = res.body?.getReader();
                const decoder = new TextDecoder();
                let text = "";
                if (reader) {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    text += decoder.decode(value, { stream: true });
                    if (mounted) setContent(text);
                  }
                }
                if (mounted) { cacheRef.current.set(cacheKey, text); setStatus("done"); }
              } catch (err) {
                if (!mounted) return;
                if ((err as Error).name !== "AbortError") setStatus("error");
              }
            })();
            return () => { mounted = false; ctrl.abort(); };
          }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(200,162,74,0.08)",
            border: "1px solid rgba(200,162,74,0.3)",
            borderRadius: 6, padding: "7px 14px",
            fontSize: "0.8rem", color: "var(--brass)",
            cursor: "pointer", fontFamily: "var(--font-ui), system-ui",
          }}
        >
          <span style={{ fontSize: "1rem" }}>✦</span> Reveal deeper reading
        </button>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (status === "loading") {
    return (
      <div style={{ borderTop: "1px solid rgba(200,162,74,0.2)", paddingTop: 18, marginTop: 4 }}>
        <SectionLabel />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="animate-pulse"
            style={{ color: "var(--brass)", fontSize: "1.1rem" }}
          >
            ✦
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--faint)" }}>
            Composing your reading…
          </span>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────

  if (status === "error") {
    return (
      <div style={{ borderTop: "1px solid rgba(200,162,74,0.2)", paddingTop: 18, marginTop: 4 }}>
        <SectionLabel />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.82rem", color: "var(--weak)" }}>
            Could not load reading.
          </span>
          <button
            onClick={() => setStatus("idle")}
            style={{
              background: "none", border: "none", fontSize: "0.78rem",
              color: "var(--brass)", cursor: "pointer", textDecoration: "underline",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Streaming / done ─────────────────────────────────────────────────────────

  if ((status === "streaming" || status === "done") && content) {
    return (
      <div style={{ borderTop: "1px solid rgba(200,162,74,0.2)", paddingTop: 18, marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <SectionLabel />
          {status === "streaming" && (
            <span
              className="animate-pulse"
              style={{ fontSize: "0.7rem", color: "var(--faint)" }}
            >
              ●
            </span>
          )}
        </div>
        <div
          aria-live="polite"
          aria-label="AI reading"
          style={{
            background: "rgba(200,162,74,0.04)",
            border: "1px solid rgba(200,162,74,0.12)",
            borderRadius: 8,
            padding: "14px 16px",
          }}
        >
          <Markdown text={content} />
        </div>
      </div>
    );
  }

  return null;
}

function SectionLabel() {
  return (
    <p
      style={{
        fontSize: "0.7rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--brass)",
        fontFamily: "var(--font-ui), system-ui",
        marginBottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span>✦</span> AI Reading
    </p>
  );
}
