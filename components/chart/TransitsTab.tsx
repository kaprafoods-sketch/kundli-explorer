"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { NatalChart } from "@/lib/astro/computeChart";
import type { TransitPlanet } from "@/lib/astro/transits";
import { kb, GRAHA_GLYPHS, type GrahaId } from "@/lib/kb";

interface Props {
  chart: NatalChart;
}

// Days offset from today. Range: -365 (1 yr past) → +365 (1 yr future)
const RANGE = 365;

function offsetToDate(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function ordinal(n: number): string {
  if (n === 1) return "st";
  if (n === 2) return "nd";
  if (n === 3) return "rd";
  return "th";
}

// ── Scrubber ─────────────────────────────────────────────────────────────────

function TimeScrubber({ offset, onChange }: {
  offset: number;
  onChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLButtonElement>(null);
  const dragging = useRef(false);
  const pct = (offset + RANGE) / (RANGE * 2);
  const activeDate = offsetToDate(offset);

  const clamp = (v: number) => Math.max(-RANGE, Math.min(RANGE, Math.round(v)));

  const pointerToOffset = useCallback((clientX: number) => {
    if (!trackRef.current) return offset;
    const rect = trackRef.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return clamp(p * RANGE * 2 - RANGE);
  }, [offset]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      onChange(pointerToOffset(e.clientX));
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [pointerToOffset, onChange]);

  const step = (delta: number) => onChange(clamp(offset + delta));

  return (
    <div
      style={{
        padding: "20px 24px 16px",
        borderRadius: 12,
        background: "rgba(14,20,48,0.9)",
        border: "1px solid rgba(200,162,74,0.22)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Date display */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
        <span
          style={{
            fontFamily: "Georgia,serif", fontSize: "1.1rem",
            color: "var(--brass-bright)", fontWeight: 600,
          }}
        >
          {formatDate(activeDate)}
        </span>
        {offset === 0 && (
          <span style={{ fontSize: "0.72rem", color: "var(--brass)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Today
          </span>
        )}
        {offset !== 0 && (
          <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
            {offset > 0 ? `+${offset}` : offset} days
          </span>
        )}
      </div>

      {/* Track */}
      <div style={{ position: "relative", paddingBottom: 8 }}>
        <div
          ref={trackRef}
          onClick={(e) => { if (!dragging.current) onChange(pointerToOffset(e.clientX)); }}
          style={{
            position: "relative", height: 3, borderRadius: 2,
            background: "rgba(200,162,74,0.15)", cursor: "pointer",
          }}
        >
          {/* Filled portion */}
          <div style={{
            position: "absolute", left: 0, top: 0, height: "100%",
            width: `${pct * 100}%`,
            background: "linear-gradient(90deg, rgba(200,162,74,0.4) 0%, #C8A24A 100%)",
            borderRadius: 2,
          }} />
          {/* "Today" tick */}
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-50%,-50%)",
            width: 2, height: 10, background: "var(--faint)", borderRadius: 1,
          }} />
          {/* Draggable thumb */}
          <button
            ref={thumbRef}
            onPointerDown={(e) => {
              e.preventDefault();
              dragging.current = true;
              thumbRef.current?.setPointerCapture(e.pointerId);
            }}
            style={{
              position: "absolute", top: "50%",
              left: `${pct * 100}%`,
              transform: "translate(-50%, -50%)",
              width: 18, height: 18, borderRadius: "50%",
              background: "#F0CE7A",
              boxShadow: "0 0 10px rgba(240,206,122,0.7), 0 0 22px rgba(240,206,122,0.3)",
              border: "2px solid #0A0F24",
              cursor: "grab", zIndex: 10, outline: "none",
            }}
            aria-label={`Timeline: ${formatDate(activeDate)}`}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft")  step(-1);
              if (e.key === "ArrowRight") step(1);
              if (e.key === "ArrowDown")  step(-7);
              if (e.key === "ArrowUp")    step(7);
            }}
          />
        </div>

        {/* Time labels */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          <span style={{ fontSize: 10, color: "var(--faint)" }}>
            {formatDate(offsetToDate(-RANGE))}
          </span>
          <span style={{ fontSize: 10, color: "var(--faint)" }}>Today</span>
          <span style={{ fontSize: 10, color: "var(--faint)" }}>
            {formatDate(offsetToDate(RANGE))}
          </span>
        </div>
      </div>

      {/* Step buttons */}
      <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
        {([
          { label: "−1y", delta: -365 }, { label: "−1m", delta: -30 }, { label: "−1w", delta: -7 },
          { label: "−1d", delta: -1 },
        ] as const).map(({ label, delta }) => (
          <button key={label} onClick={() => step(delta)} style={stepBtnStyle}>{label}</button>
        ))}
        <button
          onClick={() => onChange(0)}
          style={{ ...stepBtnStyle, color: "var(--brass)", borderColor: "rgba(200,162,74,0.4)", fontWeight: 600 }}
        >
          Today
        </button>
        {([
          { label: "+1d", delta: 1 }, { label: "+1w", delta: 7 }, { label: "+1m", delta: 30 },
          { label: "+1y", delta: 365 },
        ] as const).map(({ label, delta }) => (
          <button key={label} onClick={() => step(delta)} style={stepBtnStyle}>{label}</button>
        ))}
      </div>
    </div>
  );
}

const stepBtnStyle: React.CSSProperties = {
  background: "rgba(200,162,74,0.08)",
  border: "1px solid rgba(200,162,74,0.18)",
  borderRadius: 5, padding: "4px 10px",
  fontSize: "0.72rem", color: "var(--muted)", cursor: "pointer",
  fontFamily: "var(--font-ui), system-ui",
  letterSpacing: "0.05em",
};

// ── Planet card ───────────────────────────────────────────────────────────────

function TransitCard({ t, flash }: { t: TransitPlanet; flash: boolean }) {
  const graha = kb.grahas[t.body as GrahaId];
  const natalHouseData = kb.bhavas[String(t.natalHouse)];
  const sign = kb.rashis[t.sign];
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!flash || !cardRef.current) return;
    const el = cardRef.current;
    el.style.transition = "none";
    el.style.opacity = "0.3";
    el.style.transform = "translateY(5px)";
    requestAnimationFrame(() => {
      el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
  }, [t.sign, t.natalHouse, flash]);

  return (
    <div ref={cardRef} className="card p-4 flex items-start gap-3">
      <span className="text-3xl leading-none mt-0.5" style={{ color: "var(--brass)" }}>
        {GRAHA_GLYPHS[t.body as GrahaId]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-sm" style={{ color: "var(--parchment)" }}>
            {graha?.sanskrit}/{graha?.en}
          </span>
          {t.retrograde && (
            <span className="text-xs" style={{ color: "var(--weak)" }}>℞</span>
          )}
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
          in {sign?.sanskrit} ({sign?.en}) — {t.degInSign.toFixed(1)}°
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--faint)" }}>
          Activating your{" "}
          <span style={{ color: "var(--brass)" }}>
            {t.natalHouse}{ordinal(t.natalHouse)} house
          </span>
          {natalHouseData ? ` (${natalHouseData.en})` : ""}
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TransitsTab({ chart }: Props) {
  const [offset, setOffset] = useState(0);
  const [transits, setTransits] = useState<TransitPlanet[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTransits = useCallback((off: number) => {
    setLoading(true);
    const d = offsetToDate(off);
    const url = `/api/transits?lagnaSign=${chart.lagnaSign}${off !== 0 ? `&date=${isoDate(d)}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setTransits(data.transits);
        setLoading(false);
        setFlash(true);
        setTimeout(() => setFlash(false), 400);
      })
      .catch(() => setLoading(false));
  }, [chart.lagnaSign]);

  useEffect(() => {
    fetchTransits(0);
  }, [fetchTransits]);

  const handleOffsetChange = (v: number) => {
    setOffset(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchTransits(v), 280);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-baseline gap-3 mb-2">
        <h2 className="font-display text-2xl font-semibold" style={{ color: "var(--parchment)" }}>
          Planetary Transits
        </h2>
        <span className="text-xs" style={{ color: "var(--faint)" }}>
          {formatDate(offsetToDate(offset))}
        </span>
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Where the planets stand on any date — mapped to your natal whole-sign houses.
        Scrub the timeline to travel forward or backward in time.
      </p>

      {/* Time scrubber */}
      <div className="mb-8">
        <TimeScrubber offset={offset} onChange={handleOffsetChange} />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 mb-4" style={{ color: "var(--faint)" }}>
          <span className="animate-pulse">◌</span>
          <span>Computing positions for {formatDate(offsetToDate(offset))}…</span>
        </div>
      )}

      {/* Planet cards */}
      {!loading && transits && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {transits.map((t) => (
            <TransitCard key={t.body} t={t} flash={flash} />
          ))}
        </div>
      )}

      {!loading && !transits && (
        <p className="text-sm" style={{ color: "var(--weak)" }}>
          Could not compute transits. Check server logs.
        </p>
      )}
    </div>
  );
}
