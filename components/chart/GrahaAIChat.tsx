"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "./Markdown";

export type GrahaFocus =
  | { kind: "planet"; id: string }
  | { kind: "house"; id: number }
  | { kind: "lagna"; id?: string };

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  chartId: string;
  focus?: GrahaFocus;
  compact?: boolean;
}

const STARTERS: Record<string, string[]> = {
  general: [
    "Which planet is strongest in my chart?",
    "Explain my current dasha",
    "What stands out about my chart?",
  ],
  planet: [
    "Read this placement",
    "Is it strong or weak, and why?",
    "How do I work with this energy?",
  ],
  house: [
    "Read this house",
    "What shapes this house in my chart?",
    "Which planets affect it?",
  ],
  lagna: [
    "What does my Ascendant say about me?",
    "Why does my Lagna lord matter?",
    "How does my rising sign shape me?",
  ],
};

export default function GrahaAIChat({ chartId, focus, compact }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/graha-ai/check")
      .then((r) => r.json())
      .then((d: { available: boolean }) => setHasKey(d.available))
      .catch(() => setHasKey(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    let accumulated = "";

    try {
      const res = await fetch("/api/graha-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, message: trimmed, focus }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: accumulated };
          return next;
        });
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  // ── No key ───────────────────────────────────────────────────────────────────

  if (hasKey === false) {
    return (
      <div
        style={{
          borderTop: "1px solid rgba(200,162,74,0.2)",
          paddingTop: 14,
          marginTop: 4,
        }}
      >
        <SectionLabel />
        <div
          style={{
            background: "rgba(200,162,74,0.06)",
            border: "1px solid rgba(200,162,74,0.18)",
            borderRadius: 8,
            padding: "12px 16px",
          }}
        >
          <p style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.6 }}>
            Add a{" "}
            <span style={{ color: "var(--brass)" }}>GEMINI_API_KEY</span>
            {" "}from{" "}
            <span style={{ color: "var(--parchment)" }}>aistudio.google.com/app/apikey</span>
            {" "}to your <code style={{ color: "var(--brass)", fontSize: "0.78rem" }}>.env</code> to unlock GRAHA AI.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading key check ────────────────────────────────────────────────────────

  if (hasKey === null) return null;

  // ── Compact chat (embedded in ExplorePanel) ──────────────────────────────────

  const starters = STARTERS[focus?.kind ?? "general"];

  const wrapStyle: React.CSSProperties = compact
    ? {
        borderTop: "1px solid rgba(200,162,74,0.2)",
        paddingTop: 14,
        marginTop: 4,
        display: "flex",
        flexDirection: "column",
        maxHeight: 360,
      }
    : {
        display: "flex",
        flexDirection: "column",
        height: "100%",
      };

  return (
    <div style={wrapStyle}>
      {compact && <SectionLabel />}

      {/* Message thread */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          paddingBottom: 8,
        }}
      >
        {messages.length === 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {starters.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                style={{
                  padding: "5px 11px",
                  borderRadius: 999,
                  fontSize: "0.75rem",
                  border: "1px solid var(--faint)",
                  color: "var(--muted)",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font-ui), system-ui",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--brass)";
                  (e.target as HTMLElement).style.color = "var(--brass)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--faint)";
                  (e.target as HTMLElement).style.color = "var(--muted)";
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {m.role === "user" ? (
              <div
                style={{
                  maxWidth: "85%",
                  padding: "7px 12px",
                  borderRadius: 10,
                  fontSize: "0.82rem",
                  lineHeight: 1.5,
                  background: "var(--brass)",
                  color: "var(--bg)",
                }}
              >
                {m.content}
              </div>
            ) : (
              <div
                style={{
                  maxWidth: "95%",
                  padding: "10px 13px",
                  borderRadius: 10,
                  border: "1px solid var(--faint)",
                  background: "rgba(200,162,74,0.04)",
                }}
              >
                {m.content ? (
                  <Markdown text={m.content} />
                ) : (
                  <span
                    className="animate-pulse"
                    style={{ fontSize: "0.78rem", color: "var(--faint)" }}
                  >
                    thinking…
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          paddingTop: 8,
          borderTop: "1px solid var(--faint)",
          marginTop: 6,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder={compact ? "Ask about this placement…" : "Ask about any placement in your chart…"}
          disabled={streaming}
          className="flex-1 input-field"
          style={{ fontSize: "0.82rem" }}
        />
        <button
          onClick={() => send(input)}
          disabled={streaming || !input.trim()}
          style={{
            padding: "6px 14px",
            borderRadius: 7,
            fontSize: "0.8rem",
            fontWeight: 600,
            background: "var(--brass)",
            color: "var(--bg)",
            border: "none",
            cursor: streaming || !input.trim() ? "not-allowed" : "pointer",
            opacity: streaming || !input.trim() ? 0.4 : 1,
            fontFamily: "var(--font-ui), system-ui",
          }}
        >
          {streaming ? "…" : "Ask"}
        </button>
      </div>
    </div>
  );
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
      <span>✦</span> GRAHA AI
    </p>
  );
}
