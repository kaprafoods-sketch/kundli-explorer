"use client";

import { useState } from "react";
import TimeWheelPicker, { type TimeValue } from "./TimeWheelPicker";

export type TimeMode = "exact" | "approx" | "unknown";
export type ApproxSlot = "morning" | "afternoon" | "evening" | "night";

const APPROX_SLOTS: { id: ApproxSlot; emoji: string; label: string; desc: string; hour: number }[] = [
  { id: "morning",   emoji: "☀️",  label: "Morning",   desc: "6 am – 12 pm",  hour: 9  },
  { id: "afternoon", emoji: "🌤",  label: "Afternoon", desc: "12 pm – 6 pm",  hour: 15 },
  { id: "evening",   emoji: "🌆",  label: "Evening",   desc: "6 pm – 10 pm",  hour: 20 },
  { id: "night",     emoji: "🌙",  label: "Night",     desc: "10 pm – 6 am",  hour: 1  },
];

const MODE_OPTIONS: { id: TimeMode; label: string; icon: string }[] = [
  { id: "exact",   label: "Exact Time",       icon: "🎯" },
  { id: "approx",  label: "Approximate",      icon: "〜" },
  { id: "unknown", label: "I Don't Know",     icon: "?" },
];

export interface BirthTimeSelectorValue {
  mode: TimeMode;
  time: TimeValue;
  approxSlot?: ApproxSlot;
}

interface Props {
  value: BirthTimeSelectorValue;
  onChange: (v: BirthTimeSelectorValue) => void;
}

export default function BirthTimeSelector({ value, onChange }: Props) {
  function setMode(mode: TimeMode) {
    onChange({ ...value, mode });
  }
  function setTime(time: TimeValue) {
    onChange({ ...value, time });
  }
  function setApprox(slot: ApproxSlot) {
    onChange({ ...value, approxSlot: slot });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8 }}>
        {MODE_OPTIONS.map((opt) => {
          const sel = value.mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMode(opt.id)}
              style={{
                flex: 1,
                padding: "10px 6px",
                borderRadius: 14,
                border: sel
                  ? "1.5px solid rgba(200,162,74,0.6)"
                  : "1.5px solid rgba(255,255,255,0.08)",
                background: sel
                  ? "rgba(200,162,74,0.1)"
                  : "rgba(255,255,255,0.03)",
                color: sel ? "var(--parchment)" : "rgba(142,151,184,0.7)",
                fontSize: 12,
                fontWeight: sel ? 700 : 500,
                fontFamily: "var(--font-ui, system-ui)",
                cursor: "pointer",
                transition: "all 0.18s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ fontSize: 18 }}>{opt.icon}</span>
              <span style={{ lineHeight: 1.2, textAlign: "center" }}>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conditional content */}
      {value.mode === "exact" && (
        <div
          style={{
            animation: "fadeSlideUp 0.25s ease both",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <TimeWheelPicker value={value.time} onChange={setTime} />
        </div>
      )}

      {value.mode === "approx" && (
        <div
          style={{
            animation: "fadeSlideUp 0.25s ease both",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          {APPROX_SLOTS.map((slot) => {
            const sel = value.approxSlot === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setApprox(slot.id)}
                style={{
                  padding: "14px 12px",
                  borderRadius: 16,
                  border: sel
                    ? "1.5px solid rgba(200,162,74,0.55)"
                    : "1.5px solid rgba(255,255,255,0.08)",
                  background: sel
                    ? "rgba(200,162,74,0.1)"
                    : "rgba(255,255,255,0.03)",
                  color: sel ? "var(--parchment)" : "rgba(142,151,184,0.7)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.18s ease",
                  fontFamily: "var(--font-ui, system-ui)",
                }}
              >
                <span style={{ fontSize: 26 }}>{slot.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: sel ? 700 : 500 }}>{slot.label}</span>
                <span style={{ fontSize: 10, color: "rgba(142,151,184,0.55)" }}>{slot.desc}</span>
              </button>
            );
          })}
        </div>
      )}

      {value.mode === "unknown" && (
        <div
          style={{
            animation: "fadeSlideUp 0.25s ease both",
            background: "rgba(200,162,74,0.06)",
            border: "1px solid rgba(200,162,74,0.18)",
            borderRadius: 16,
            padding: "16px 20px",
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>✨</span>
          <div>
            <p style={{
              margin: 0,
              fontSize: 13.5,
              color: "var(--parchment)",
              lineHeight: 1.55,
              fontFamily: "var(--font-ui, system-ui)",
            }}>
              No problem. We&apos;ll generate your chart using noon as a placeholder and offer birth time rectification later.
            </p>
            <p style={{
              margin: "6px 0 0",
              fontSize: 11.5,
              color: "rgba(142,151,184,0.6)",
              fontFamily: "var(--font-ui, system-ui)",
            }}>
              Planetary houses may vary, but all other placements will be accurate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
