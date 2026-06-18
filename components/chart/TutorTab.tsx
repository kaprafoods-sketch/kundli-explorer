"use client";

import { useEffect, useRef, useState } from "react";
import type { NatalChart } from "@/lib/astro/computeChart";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  chart: NatalChart;
  chartId: string;
}

export default function TutorTab({ chart, chartId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Check if tutor is available
  useEffect(() => {
    fetch("/api/tutor/check").then((r) => r.json()).then((d) => setHasKey(d.available));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function sendMessage() {
    if (!input.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    let assistantContent = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, message: userMsg.content }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: assistantContent };
          return next;
        });
      }
    } catch (err) {
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

  if (hasKey === false) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
        <div className="text-5xl mb-6" style={{ color: "var(--faint)" }}>✦</div>
        <h2 className="font-display text-2xl font-semibold mb-3" style={{ color: "var(--parchment)" }}>
          AI Tutor
        </h2>
        <p className="text-sm max-w-sm mb-6" style={{ color: "var(--muted)" }}>
          The AI Tutor answers chart-specific questions grounded in your real placements —
          teaching you to understand your kundli, not making predictions.
        </p>
        <div
          className="card p-5 max-w-sm text-left"
          style={{ border: "1px solid var(--brass)", background: "rgba(200,162,74,0.06)" }}
        >
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--brass)" }}>
            To enable the AI Tutor:
          </p>
          <ol className="text-sm space-y-1.5" style={{ color: "var(--muted)" }}>
            <li>1. Get an API key from <span style={{ color: "var(--parchment)" }}>console.anthropic.com</span></li>
            <li>2. Add it to your <code className="text-xs" style={{ color: "var(--brass)" }}>.env</code> file:</li>
          </ol>
          <pre
            className="mt-2 p-3 rounded text-xs"
            style={{ background: "var(--panel-2)", color: "var(--brass)", fontFamily: "monospace" }}
          >
            ANTHROPIC_API_KEY=sk-ant-...
          </pre>
          <p className="text-xs mt-2" style={{ color: "var(--faint)" }}>Then restart the dev server.</p>
        </div>
      </div>
    );
  }

  const STARTERS = [
    "Why is my Saturn difficult?",
    "What does my Moon placement mean?",
    "Which house is strongest in my chart?",
    "What does Rahu in my chart indicate?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-110px)] max-w-3xl mx-auto">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center pt-8">
            <div className="text-4xl mb-4" style={{ color: "var(--brass)" }}>✦</div>
            <h2 className="font-display text-xl font-semibold mb-2" style={{ color: "var(--parchment)" }}>
              Ask your AI Astrology Tutor
            </h2>
            <p className="text-sm max-w-sm mb-8" style={{ color: "var(--muted)" }}>
              Grounded in your real chart — teaches the reasoning, never makes fatalistic predictions.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {STARTERS.map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="px-3 py-1.5 rounded-full text-xs border transition-colors hover:border-brass"
                  style={{ borderColor: "var(--faint)", color: "var(--muted)" }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[85%] px-4 py-3 rounded-xl text-sm leading-relaxed"
              style={
                m.role === "user"
                  ? { background: "var(--brass)", color: "var(--bg)" }
                  : { background: "var(--panel)", color: "var(--parchment)", border: "1px solid var(--faint)" }
              }
            >
              {m.content || (
                <span className="animate-pulse" style={{ color: "var(--faint)" }}>
                  thinking…
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="border-t p-4 flex gap-3"
        style={{ borderColor: "var(--faint)", background: "var(--panel)" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask about any placement in your chart…"
          disabled={streaming}
          className="flex-1 input-field"
        />
        <button
          onClick={sendMessage}
          disabled={streaming || !input.trim()}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
          style={{ background: "var(--brass)", color: "var(--bg)" }}
        >
          {streaming ? "…" : "Ask"}
        </button>
      </div>
    </div>
  );
}
