"use client";

/**
 * ReadingFeedback — "Did this ring true?" control shown under a completed
 * assistant message. Captures rating + (on "Not quite") a reason, and an
 * optional "Useful?" follow-up on a Yes.
 *
 * GUARDRAIL: this is pure capture for analytics / KB-gap / dataset. It never
 * feeds back into model prompting or response selection.
 */

import { useState } from "react";

interface Props {
  chartId: string;
  /** The assistant message text this feedback refers to (sent for correlation). */
  content: string;
}

type Rating = "true" | "not_quite";

const REASONS: { id: string; label: string }[] = [
  { id: "too_generic", label: "Too generic" },
  { id: "doesnt_match", label: "Doesn't match me" },
  { id: "too_vague", label: "Too vague" },
];

export default function ReadingFeedback({ chartId, content }: Props) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [useful, setUseful] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);

  async function post(payload: Record<string, unknown>) {
    setSending(true);
    try {
      await fetch("/api/graha-ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, content, ...payload }),
      });
    } catch {
      // Silent — feedback is best-effort and must never disrupt the reading.
    } finally {
      setSending(false);
    }
  }

  function choose(r: Rating) {
    if (sending) return;
    setRating(r);
    post({ rating: r });
  }

  function chooseReason(id: string) {
    if (sending) return;
    setReason(id);
    post({ rating: "not_quite", ratingReason: id });
  }

  function chooseUseful(v: boolean) {
    if (sending) return;
    setUseful(v);
    post({ useful: v });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        marginTop: 6,
        paddingTop: 6,
      }}
    >
      {/* Prompt + Yes/Not-quite */}
      {!rating && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={metaStyle}>Did this ring true?</span>
          <button className="press" style={pillStyle(false)} onClick={() => choose("true")}>
            Yes, it did
          </button>
          <button className="press" style={pillStyle(false)} onClick={() => choose("not_quite")}>
            Not quite
          </button>
        </div>
      )}

      {/* After Yes — optional usefulness */}
      {rating === "true" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {useful === null ? (
            <>
              <span style={metaStyle}>Useful?</span>
              <button className="press" style={pillStyle(false)} onClick={() => chooseUseful(true)}>
                Yes
              </button>
              <button className="press" style={pillStyle(false)} onClick={() => chooseUseful(false)}>
                Not really
              </button>
            </>
          ) : (
            <span style={metaStyle}>Thanks — noted ✦</span>
          )}
        </div>
      )}

      {/* After Not quite — reason chips */}
      {rating === "not_quite" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {reason === null ? (
            <>
              <span style={metaStyle}>What was off?</span>
              {REASONS.map((r) => (
                <button key={r.id} className="press" style={pillStyle(false)} onClick={() => chooseReason(r.id)}>
                  {r.label}
                </button>
              ))}
            </>
          ) : (
            <span style={metaStyle}>Thanks — that helps us improve ✦</span>
          )}
        </div>
      )}
    </div>
  );
}

const metaStyle: React.CSSProperties = {
  fontSize: "0.72rem",
  color: "var(--faint)",
  fontFamily: "var(--font-ui), system-ui",
};

function pillStyle(active: boolean): React.CSSProperties {
  return {
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: "0.72rem",
    border: `1px solid ${active ? "var(--brass)" : "var(--faint)"}`,
    color: active ? "var(--brass)" : "var(--muted)",
    background: "transparent",
    cursor: "pointer",
    fontFamily: "var(--font-ui), system-ui",
    minHeight: 28,
  };
}
