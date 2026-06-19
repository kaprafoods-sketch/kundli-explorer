"use client";

/**
 * PlanetReadingSheet — shared planet detail UI.
 * Used by both the Chart tab (inside ExplorePanel) and the Planets tab
 * (replaces the local ReadingPanel). Single source of truth for planet detail.
 */

import { useMemo } from "react";
import type { Placement, NatalChart } from "@/lib/astro/computeChart";
import { composePlanetInterpretation } from "@/lib/interpret";
import { kb, GRAHA_GLYPHS, type GrahaId } from "@/lib/kb";
import { GRAHA_COLORS } from "@/lib/grahaColors";
import GrahaAIChat from "./GrahaAIChat";

interface Props {
  placement: Placement;
  chart: NatalChart;
  chartId?: string;
  /** Rendered inside an orrery canvas overlay (dark bg, slide-in) */
  variant?: "orrery" | "panel";
  onBack?: () => void;
  backLabel?: string;
}

export default function PlanetReadingSheet({
  placement,
  chart,
  chartId,
  variant = "panel",
  onBack,
  backLabel = "← Back",
}: Props) {
  const gid = placement.body as GrahaId;
  const graha = kb.grahas[gid];
  const bhava = kb.bhavas[String(placement.house)];
  const rashi = kb.rashis[placement.sign];
  const color = GRAHA_COLORS[gid as keyof typeof GRAHA_COLORS]?.core ?? "#C8A24A";

  const interp = useMemo(
    () => composePlanetInterpretation(placement, chart.placements),
    [placement, chart.placements]
  );

  const pillars = [
    { label: "The Planet — what it brings", text: interp.pillars.planet },
    { label: "The House — where it acts",   text: interp.pillars.house  },
    { label: "The Sign — how it expresses", text: interp.pillars.sign   },
    { label: "Dignity — strength dial",     text: interp.pillars.dignity },
    ...(interp.pillars.aspects ? [{ label: "Conjunctions & Aspects", text: interp.pillars.aspects }] : []),
  ];

  const isOrrery = variant === "orrery";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: isOrrery ? "22px 20px" : undefined,
        ...(isOrrery ? {
          position: "absolute",
          top: 0, right: 0,
          width: "clamp(300px, 40%, 420px)",
          height: "100%",
          background: "rgba(7,6,13,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: `1px solid ${color}38`,
          overflowY: "auto",
          zIndex: 20,
          animation: "sheetIn 0.28s cubic-bezier(0.34,1.36,0.64,1)",
        } : {}),
      }}
    >
      {isOrrery && (
        <style>{`
          @keyframes sheetIn {
            from { transform: translateX(32px); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>
      )}

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            alignSelf: "flex-start",
            background: "none",
            border: "1px solid var(--faint)",
            borderRadius: 6,
            padding: "4px 12px",
            cursor: "pointer",
            color: "var(--muted)",
            fontSize: "0.78rem",
            fontFamily: "var(--font-ui), system-ui",
          }}
        >
          {backLabel}
        </button>
      )}

      {/* Header: glyph + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 54, height: 54,
          borderRadius: "50%",
          border: `1.5px solid ${color}55`,
          background: `${color}12`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.9rem", color, flexShrink: 0,
          boxShadow: `0 0 18px ${color}22`,
        }}>
          {GRAHA_GLYPHS[gid]}
        </div>
        <div>
          <h2 style={{
            fontSize: "1.3rem",
            color: "var(--parchment)",
            fontFamily: "var(--font-display), Georgia, serif",
            fontWeight: 600,
            lineHeight: 1.15,
            margin: 0,
          }}>
            {graha?.sanskrit}
            <span style={{
              fontStyle: "italic", fontWeight: 400,
              fontSize: "0.72em", color, marginLeft: "0.4em",
            }}>
              / {graha?.en}
            </span>
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 3 }}>
            House {placement.house} · {bhava?.en} · {rashi?.en}
          </p>
        </div>
      </div>

      {/* Dignity + house-class badges */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span className={`badge ${interp.dignityClass}`}>{interp.dignityLabel}</span>
        {interp.houseClass.map((c) => (
          <span key={c} className="badge badge-neutral" style={{ textTransform: "capitalize" }}>{c}</span>
        ))}
        {placement.retrograde && (
          <span className="badge" style={{ color: "var(--weak)", borderColor: "var(--weak)" }}>℞ Retrograde</span>
        )}
        {/* TODO retrograde indicator hook */}
      </div>

      <div style={{ height: 1, background: `${color}22` }} />

      {/* Pillar readings */}
      {pillars.map(({ label, text }) => (
        <div key={label}>
          <p style={{
            fontSize: "0.68rem", textTransform: "uppercase",
            letterSpacing: "0.14em", color: "var(--faint)", marginBottom: 4,
          }}>
            {label}
          </p>
          <p style={{ fontSize: "0.83rem", lineHeight: 1.65, color: "var(--parchment)" }}>
            {text}
          </p>
        </div>
      ))}

      {/* Nakshatra */}
      <div>
        <p style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--faint)", marginBottom: 4 }}>
          Nakshatra
        </p>
        <p style={{ fontSize: "0.83rem", color: "var(--parchment)", textTransform: "capitalize" }}>
          {placement.nakshatra?.replace(/_/g, " ")} · Pada {placement.pada}
        </p>
      </div>

      {/* Karaka chips */}
      <div>
        <p style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--faint)", marginBottom: 6 }}>
          Signifies
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {graha?.karaka_of?.slice(0, 6).map((k) => (
            <span key={k} style={{
              fontSize: "0.73rem",
              padding: "3px 10px",
              borderRadius: 100,
              background: `${color}12`,
              border: `1px solid ${color}38`,
              color,
              textTransform: "capitalize",
            }}>
              {k}
            </span>
          ))}
        </div>
      </div>

      {/* GRAHA AI — only when chart is saved (chartId present) */}
      {chartId && (
        <GrahaAIChat
          chartId={chartId}
          focus={{ kind: "planet", id: placement.body }}
          compact
        />
      )}
    </div>
  );
}
