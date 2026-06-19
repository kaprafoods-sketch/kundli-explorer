"use client";

import { useState } from "react";
import { createChartAction } from "@/app/actions/createChart";
import DateWheelPicker, { type DateValue } from "./onboarding/DateWheelPicker";
import BirthTimeSelector, { type BirthTimeSelectorValue } from "./onboarding/BirthTimeSelector";
import PlaceSearch, { type PlaceValue } from "./onboarding/PlaceSearch";
import OnboardingProgress from "./onboarding/OnboardingProgress";

// ── Helpers ───────────────────────────────────────────────────────────────────

function to24h(hour: number, ampm: "AM" | "PM"): number {
  if (ampm === "AM") return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
}

const APPROX_HOURS: Record<string, number> = {
  morning: 9, afternoon: 15, evening: 20, night: 1,
};

// ── Component ─────────────────────────────────────────────────────────────────

const today = new Date();
const DEFAULT_DATE: DateValue = {
  day: today.getDate(),
  month: today.getMonth() + 1,
  year: today.getFullYear() - 25,
};

const DEFAULT_TIME: BirthTimeSelectorValue = {
  mode: "exact",
  time: { hour: 6, minute: 30, ampm: "AM" },
  approxSlot: undefined,
};

export default function BirthForm() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [date, setDate] = useState<DateValue>(DEFAULT_DATE);
  const [timeVal, setTimeVal] = useState<BirthTimeSelectorValue>(DEFAULT_TIME);
  const [place, setPlace] = useState<PlaceValue | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  function goNext() {
    setDirection("forward");
    setStep((s) => s + 1);
  }
  function goBack() {
    setDirection("back");
    setStep((s) => s - 1);
  }

  // Assemble form data and submit
  async function submit() {
    if (!place) { setError("Please select a birth place."); return; }
    setError("");

    const dateStr = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;

    let hour24 = 12, minute = 0;
    let timeKnown = false;

    if (timeVal.mode === "exact") {
      hour24 = to24h(timeVal.time.hour, timeVal.time.ampm);
      minute = timeVal.time.minute;
      timeKnown = true;
    } else if (timeVal.mode === "approx" && timeVal.approxSlot) {
      hour24 = APPROX_HOURS[timeVal.approxSlot] ?? 12;
      minute = 0;
      timeKnown = true;
    } else {
      hour24 = 12; minute = 0; timeKnown = false;
    }

    const timeStr = `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    const fd = new FormData();
    fd.set("name", name.trim() || "My Chart");
    fd.set("date", dateStr);
    fd.set("time", timeStr);
    fd.set("timeKnown", String(timeKnown));
    fd.set("lat", String(place.lat));
    fd.set("lon", String(place.lon));

    setPending(true);
    try {
      await createChartAction(fd);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("NEXT_REDIRECT")) {
        setError(msg);
        setPending(false);
      }
    }
  }

  const SCREENS = [
    <Screen1
      key="s1"
      name={name}
      onName={setName}
      date={date}
      onDate={setDate}
      onNext={goNext}
    />,
    <Screen2
      key="s2"
      timeVal={timeVal}
      onTimeVal={setTimeVal}
      onNext={goNext}
      onBack={goBack}
    />,
    <Screen3
      key="s3"
      place={place}
      onPlace={setPlace}
      onBack={goBack}
      onSubmit={submit}
      pending={pending}
      error={error}
    />,
  ];

  return (
    <>
      {/* Keyframe definitions */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-40px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { transform: translateY(10px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fillRight {
          from { transform: scaleX(0); transform-origin: left; }
          to   { transform: scaleX(1); transform-origin: left; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { scrollbar-width: none; }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          padding: "28px 24px 24px",
        }}
      >
        {/* Progress */}
        <OnboardingProgress step={step} total={3} />

        {/* Screen (animated) */}
        <div
          key={step}
          style={{
            animation: `${direction === "forward" ? "slideInRight" : "slideInLeft"} 0.3s cubic-bezier(0.34,1.2,0.64,1) both`,
          }}
        >
          {SCREENS[step]}
        </div>
      </div>
    </>
  );
}

// ── Screen 1: Date ────────────────────────────────────────────────────────────

interface S1Props {
  name: string;
  onName: (v: string) => void;
  date: DateValue;
  onDate: (v: DateValue) => void;
  onNext: () => void;
}

function Screen1({ name, onName, date, onDate, onNext }: S1Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hero copy */}
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 6px", fontSize: 28 }}>✨</p>
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: "var(--parchment)",
            fontFamily: "var(--font-ui, system-ui)",
            lineHeight: 1.3,
          }}
        >
          Let&apos;s discover your<br />cosmic blueprint
        </h2>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(142,151,184,0.7)", fontFamily: "var(--font-ui, system-ui)", lineHeight: 1.5 }}>
          Just three details and we&apos;ll map your planets.
        </p>
      </div>

      {/* Name input */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(142,151,184,0.55)", fontFamily: "var(--font-ui, system-ui)" }}
        >
          Your name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Enter your name"
          autoComplete="given-name"
          style={{
            padding: "13px 16px",
            borderRadius: 13,
            border: "1.5px solid rgba(200,162,74,0.18)",
            background: "rgba(255,255,255,0.04)",
            color: "var(--parchment)",
            fontSize: 15,
            fontFamily: "var(--font-ui, system-ui)",
            outline: "none",
            transition: "border-color 0.18s ease",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(200,162,74,0.5)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(200,162,74,0.18)")}
        />
      </div>

      {/* Date picker */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label
          style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(142,151,184,0.55)", fontFamily: "var(--font-ui, system-ui)" }}
        >
          Date of Birth
        </label>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <DateWheelPicker value={date} onChange={onDate} />
        </div>
      </div>

      {/* CTA */}
      <CTAButton onClick={onNext}>Continue →</CTAButton>

      <p style={{ textAlign: "center", margin: 0, fontSize: 10.5, color: "rgba(142,151,184,0.3)", fontFamily: "var(--font-ui, system-ui)" }}>
        Scroll wheels to select your birth date
      </p>
    </div>
  );
}

// ── Screen 2: Time ────────────────────────────────────────────────────────────

interface S2Props {
  timeVal: BirthTimeSelectorValue;
  onTimeVal: (v: BirthTimeSelectorValue) => void;
  onNext: () => void;
  onBack: () => void;
}

function Screen2({ timeVal, onTimeVal, onNext, onBack }: S2Props) {
  const canContinue = timeVal.mode !== "approx" || !!timeVal.approxSlot;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 6px", fontSize: 28 }}>🕒</p>
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: "var(--parchment)",
            fontFamily: "var(--font-ui, system-ui)",
          }}
        >
          Do you know your birth time?
        </h2>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(142,151,184,0.7)", fontFamily: "var(--font-ui, system-ui)" }}>
          Your birth time determines your rising sign and house positions.
        </p>
      </div>

      <BirthTimeSelector value={timeVal} onChange={onTimeVal} />

      <div style={{ display: "flex", gap: 10 }}>
        <BackButton onClick={onBack} />
        <CTAButton onClick={onNext} disabled={!canContinue} style={{ flex: 1 }}>
          Continue →
        </CTAButton>
      </div>
    </div>
  );
}

// ── Screen 3: Place ───────────────────────────────────────────────────────────

interface S3Props {
  place: PlaceValue | null;
  onPlace: (v: PlaceValue) => void;
  onBack: () => void;
  onSubmit: () => void;
  pending: boolean;
  error: string;
}

function Screen3({ place, onPlace, onBack, onSubmit, pending, error }: S3Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 6px", fontSize: 28 }}>📍</p>
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: "var(--parchment)",
            fontFamily: "var(--font-ui, system-ui)",
          }}
        >
          Where were you born?
        </h2>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(142,151,184,0.7)", fontFamily: "var(--font-ui, system-ui)" }}>
          Search for your birth city — we&apos;ll find the exact coordinates.
        </p>
      </div>

      <PlaceSearch value={place} onChange={onPlace} />

      {error && (
        <p style={{ margin: 0, fontSize: 12.5, color: "#E07070", fontFamily: "var(--font-ui, system-ui)", textAlign: "center" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <BackButton onClick={onBack} />
        <CTAButton
          onClick={onSubmit}
          disabled={!place || pending}
          loading={pending}
          style={{ flex: 1 }}
        >
          {pending ? "Computing…" : "Reveal My Kundli ✦"}
        </CTAButton>
      </div>

      <p style={{ textAlign: "center", margin: 0, fontSize: 10.5, color: "rgba(142,151,184,0.3)", fontFamily: "var(--font-ui, system-ui)" }}>
        Swiss Ephemeris · Lahiri ayanamsha · Whole-sign houses
      </p>
    </div>
  );
}

// ── Shared UI atoms ───────────────────────────────────────────────────────────

function CTAButton({
  children,
  onClick,
  disabled,
  loading,
  style,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "14px 20px",
        borderRadius: 14,
        border: "none",
        background: disabled
          ? "rgba(200,162,74,0.25)"
          : "linear-gradient(135deg, var(--brass) 0%, #e8b84b 100%)",
        color: disabled ? "rgba(11,16,38,0.5)" : "var(--bg)",
        fontSize: 14.5,
        fontWeight: 700,
        letterSpacing: "0.02em",
        fontFamily: "var(--font-ui, system-ui)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.18s ease",
        boxShadow: disabled ? "none" : "0 4px 20px rgba(200,162,74,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        ...style,
      }}
    >
      {loading && (
        <div
          style={{
            width: 14,
            height: 14,
            border: "2px solid rgba(11,16,38,0.3)",
            borderTopColor: "var(--bg)",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
      )}
      {children}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "14px 16px",
        borderRadius: 14,
        border: "1.5px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        color: "rgba(142,151,184,0.6)",
        fontSize: 14,
        fontFamily: "var(--font-ui, system-ui)",
        cursor: "pointer",
        transition: "all 0.18s ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
        e.currentTarget.style.color = "var(--parchment)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.color = "rgba(142,151,184,0.6)";
      }}
    >
      ← Back
    </button>
  );
}
