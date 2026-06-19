"use client";

/**
 * InterestStep — Step 4 of the onboarding wizard: "What brings you here?"
 * Captures interests (2–3 life areas), answer depth, and an optional intent note.
 *
 * DECISION FLAG: this is built as wizard Step 4 (writes to the Chart row at
 * creation). If product later wants a post-chart "personalize" card on
 * /chart/[id] instead, the same three fields move to a new server action that
 * updates the existing Chart row — the InterestValue shape can be reused as-is.
 */

import {
  ONBOARDING_INTEREST_IDS,
  resolveLifeArea,
  type LifeAreaId,
} from "@/lib/lifeAreas";

// prefers-reduced-motion is honored globally in app/globals.css (it clamps all
// transition-durations), so transitions below degrade gracefully on their own.

export interface InterestValue {
  interests: LifeAreaId[];
  depth: "quick" | "deep";
  intentNote: string;
}

export const DEFAULT_INTEREST: InterestValue = {
  interests: [],
  depth: "deep",
  intentNote: "",
};

const MAX_INTERESTS = 3;
const MIN_INTERESTS = 2;

// Short, friendly labels for the onboarding chips (KB labels can be long).
const CHIP_LABEL: Partial<Record<LifeAreaId, string>> = {
  love: "Love & Relationships",
  career: "Career & Status",
  health: "Health & Vitality",
  money: "Money & Wealth",
  personality: "Personality & Self",
  spiritual: "Meaning & Spirit",
  learning: "Learn Astrology",
};

interface Props {
  value: InterestValue;
  onChange: (v: InterestValue) => void;
}

export default function InterestStep({ value, onChange }: Props) {
  function toggleInterest(id: LifeAreaId) {
    const has = value.interests.includes(id);
    let next: LifeAreaId[];
    if (has) {
      next = value.interests.filter((x) => x !== id);
    } else {
      if (value.interests.length >= MAX_INTERESTS) return; // cap at 3
      next = [...value.interests, id];
    }
    onChange({ ...value, interests: next });
  }

  const remaining = MIN_INTERESTS - value.interests.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 6px", fontSize: 28 }}>✨</p>
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: "var(--parchment)",
            fontFamily: "var(--font-ui, system-ui)",
          }}
        >
          What brings you here?
        </h2>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(142,151,184,0.7)", fontFamily: "var(--font-ui, system-ui)", lineHeight: 1.5 }}>
          Pick 2–3 — we&apos;ll surface the parts of your chart that speak to them.
        </p>
      </div>

      {/* Interests — multi-select chips */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={labelStyle}>
          Your focus
          <span style={{ marginLeft: 8, color: "rgba(142,151,184,0.5)", textTransform: "none", letterSpacing: 0 }}>
            {remaining > 0 ? `choose ${remaining} more` : `${value.interests.length}/${MAX_INTERESTS} selected`}
          </span>
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ONBOARDING_INTEREST_IDS.map((id) => {
            const area = resolveLifeArea(id);
            const label = CHIP_LABEL[id] ?? area.label;
            const selected = value.interests.includes(id);
            const atCap = !selected && value.interests.length >= MAX_INTERESTS;
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleInterest(id)}
                aria-pressed={selected}
                disabled={atCap}
                className={atCap ? undefined : "press"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  minHeight: 44,
                  padding: "9px 14px",
                  borderRadius: 12,
                  cursor: atCap ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontFamily: "var(--font-ui, system-ui)",
                  fontWeight: selected ? 700 : 500,
                  background: selected ? "rgba(200,162,74,0.16)" : "rgba(255,255,255,0.03)",
                  border: selected ? "1.5px solid var(--brass)" : "1.5px solid rgba(255,255,255,0.08)",
                  color: selected ? "var(--brass-bright)" : "var(--parchment)",
                  opacity: atCap ? 0.4 : 1,
                  transition: "background 0.18s ease, border-color 0.18s ease, color 0.18s ease",
                }}
              >
                <span aria-hidden style={{ color: selected ? "var(--brass)" : "var(--muted)", fontSize: 15 }}>
                  {area.emoji}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Depth — segmented control */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={labelStyle}>How should we answer?</label>
        <div style={{ display: "flex", gap: 8 }}>
          {([
            { id: "quick", title: "Quick insight", sub: "Lead with the takeaway" },
            { id: "deep", title: "Teach me the why", sub: "Full reasoning" },
          ] as const).map((opt) => {
            const active = value.depth === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ ...value, depth: opt.id })}
                aria-pressed={active}
                className="press"
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 2,
                  minHeight: 56,
                  padding: "10px 14px",
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  background: active ? "rgba(200,162,74,0.16)" : "rgba(255,255,255,0.03)",
                  border: active ? "1.5px solid var(--brass)" : "1.5px solid rgba(255,255,255,0.08)",
                  color: active ? "var(--brass-bright)" : "var(--parchment)",
                  transition: "background 0.18s ease, border-color 0.18s ease, color 0.18s ease",
                  fontFamily: "var(--font-ui, system-ui)",
                }}
              >
                <span style={{ fontSize: 14.5, fontWeight: 700 }}>{opt.title}</span>
                <span style={{ fontSize: 12.5, color: active ? "rgba(230,197,106,0.8)" : "rgba(142,151,184,0.7)" }}>
                  {opt.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Intent note — optional */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={labelStyle}>
          Anything on your mind?
          <span style={{ marginLeft: 8, color: "rgba(142,151,184,0.5)", textTransform: "none", letterSpacing: 0 }}>optional</span>
        </label>
        <input
          type="text"
          value={value.intentNote}
          onChange={(e) => onChange({ ...value, intentNote: e.target.value })}
          placeholder="e.g. a decision I'm weighing, a phase I'm in…"
          maxLength={140}
          autoComplete="off"
          style={{
            padding: "13px 16px",
            borderRadius: 13,
            border: "1.5px solid rgba(200,162,74,0.18)",
            background: "rgba(255,255,255,0.04)",
            color: "var(--parchment)",
            fontSize: 16,
            fontFamily: "var(--font-ui, system-ui)",
            outline: "none",
            transition: "border-color 0.18s ease",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(200,162,74,0.5)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(200,162,74,0.18)")}
        />
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10.5,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(142,151,184,0.55)",
  fontFamily: "var(--font-ui, system-ui)",
};
