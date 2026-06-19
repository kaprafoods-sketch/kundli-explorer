"use client";

import WheelPicker from "./WheelPicker";

const HOURS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1).padStart(2, "0"),
}));

const MINUTES = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, "0"),
}));

const AMPM = [
  { value: "AM", label: "AM" },
  { value: "PM", label: "PM" },
];

export interface TimeValue { hour: number; minute: number; ampm: "AM" | "PM"; }

interface Props {
  value: TimeValue;
  onChange: (v: TimeValue) => void;
}

export default function TimeWheelPicker({ value, onChange }: Props) {
  function set(patch: Partial<TimeValue>) {
    onChange({ ...value, ...patch });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      {/* Column headers */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <ColLabel width={88}>Hour</ColLabel>
        <ColLabel width={88}>Minute</ColLabel>
        <ColLabel width={76}>AM/PM</ColLabel>
      </div>

      {/* Wheels */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 20,
          padding: "0 12px",
          border: "1px solid rgba(200,162,74,0.12)",
        }}
      >
        <WheelPicker
          items={HOURS}
          value={value.hour}
          onChange={(v) => set({ hour: Number(v) })}
          width={88}
        />

        <div style={{ width: 1, height: 80, background: "rgba(200,162,74,0.12)" }} />

        <WheelPicker
          items={MINUTES}
          value={value.minute}
          onChange={(v) => set({ minute: Number(v) })}
          width={88}
        />

        <div style={{ width: 1, height: 80, background: "rgba(200,162,74,0.12)" }} />

        <WheelPicker
          items={AMPM}
          value={value.ampm}
          onChange={(v) => set({ ampm: v as "AM" | "PM" })}
          width={76}
        />
      </div>
    </div>
  );
}

function ColLabel({ children, width }: { children: string; width: number }) {
  return (
    <div
      style={{
        width,
        textAlign: "center",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(142,151,184,0.6)",
        fontFamily: "var(--font-ui, system-ui)",
      }}
    >
      {children}
    </div>
  );
}
