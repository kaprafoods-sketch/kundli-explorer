"use client";

import WheelPicker from "./WheelPicker";

const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" },
  { value: 3, label: "March" },   { value: 4, label: "April" },
  { value: 5, label: "May" },     { value: 6, label: "June" },
  { value: 7, label: "July" },    { value: 8, label: "August" },
  { value: 9, label: "September"},{ value: 10, label: "October" },
  { value: 11, label: "November"},{ value: 12, label: "December" },
];

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => {
  const y = CURRENT_YEAR - i;
  return { value: y, label: String(y) };
});

export interface DateValue { day: number; month: number; year: number; }

interface Props {
  value: DateValue;
  onChange: (v: DateValue) => void;
}

export default function DateWheelPicker({ value, onChange }: Props) {
  const totalDays = daysInMonth(value.month, value.year);
  const DAYS = Array.from({ length: totalDays }, (_, i) => ({
    value: i + 1,
    label: String(i + 1).padStart(2, "0"),
  }));

  function set(patch: Partial<DateValue>) {
    const next = { ...value, ...patch };
    // Clamp day if month/year changed
    const maxDay = daysInMonth(next.month, next.year);
    if (next.day > maxDay) next.day = maxDay;
    onChange(next);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      {/* Column headers */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <ColLabel width={72}>Day</ColLabel>
        <ColLabel width={148}>Month</ColLabel>
        <ColLabel width={88}>Year</ColLabel>
      </div>

      {/* Wheels row */}
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
          items={DAYS}
          value={value.day}
          onChange={(v) => set({ day: Number(v) })}
          width={72}
        />

        <div style={{ width: 1, height: 80, background: "rgba(200,162,74,0.12)" }} />

        <WheelPicker
          items={MONTHS}
          value={value.month}
          onChange={(v) => set({ month: Number(v) })}
          width={148}
        />

        <div style={{ width: 1, height: 80, background: "rgba(200,162,74,0.12)" }} />

        <WheelPicker
          items={YEARS}
          value={value.year}
          onChange={(v) => set({ year: Number(v) })}
          width={88}
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
