"use client";

/**
 * PlanetReadingSheet — shared planet detail UI.
 * Used by both the Chart tab (inside ExplorePanel) and the Planets tab
 * (replaces the local ReadingPanel). Single source of truth for planet detail.
 */

import { useMemo } from "react";
import type { Placement, NatalChart } from "@/lib/astro/computeChart";
import { composePlanetInterpretation, composeHouseReading } from "@/lib/interpret";
import { kb, GRAHA_GLYPHS, getName, type GrahaId } from "@/lib/kb";
import { GRAHA_COLORS } from "@/lib/grahaColors";
import GrahaAIChat from "./GrahaAIChat";
import { useLang } from "@/components/i18n/LanguageProvider";

interface Props {
  /** Planet-focus mode — provide `placement`. Mutually exclusive with `houseNum`. */
  placement?: Placement;
  /** Bhava/house-focus mode — provide `houseNum` (1–12) instead of `placement`. */
  houseNum?: number;
  chart: NatalChart;
  chartId?: string;
  interests?: string[];
  /** Rendered inside an orrery canvas overlay (dark bg, slide-in) */
  variant?: "orrery" | "panel";
  onBack?: () => void;
  backLabel?: string;
}

export default function PlanetReadingSheet({
  placement,
  houseNum,
  chart,
  chartId,
  interests,
  variant = "panel",
  onBack,
  backLabel = "← Back",
}: Props) {
  const { lang } = useLang();
  const isOrrery = variant === "orrery";

  // Hooks must run unconditionally on every render — compute the planet
  // interpretation whenever a placement is present, and branch to the house
  // (bhava) reading body only in the returned JSX below.
  const interp = useMemo(
    () => (placement ? composePlanetInterpretation(placement, chart.placements) : null),
    [placement, chart.placements]
  );

  if (houseNum != null && !placement) {
    return (
      <HouseReadingBody
        houseNum={houseNum}
        chart={chart}
        chartId={chartId}
        interests={interests}
        isOrrery={isOrrery}
        onBack={onBack}
        backLabel={backLabel}
        lang={lang}
      />
    );
  }

  if (!placement || !interp) return null;

  const gid = placement.body as GrahaId;
  const graha = kb.grahas[gid];
  const bhava = kb.bhavas[String(placement.house)];
  const rashi = kb.rashis[placement.sign];
  const color = GRAHA_COLORS[gid as keyof typeof GRAHA_COLORS]?.core ?? "#C8A24A";

  const pillars = [
    { label: "The Planet — what it brings", text: interp.pillars.planet },
    { label: "The House — where it acts",   text: interp.pillars.house  },
    { label: "The Sign — how it expresses", text: interp.pillars.sign   },
    { label: "Dignity — strength dial",     text: interp.pillars.dignity },
    ...(interp.pillars.aspects ? [{ label: "Conjunctions & Aspects", text: interp.pillars.aspects }] : []),
  ];

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
            {getName(graha, lang)}
            {lang !== "en" && (
              <span style={{
                fontStyle: "italic", fontWeight: 400,
                fontSize: "0.72em", color, marginLeft: "0.4em",
              }}>
                / {graha?.en}
              </span>
            )}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 3 }}>
            House {placement.house} · {getName(bhava, lang)} · {getName(rashi, lang)}
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
        <p style={{ fontSize: "0.83rem", color: "var(--parchment)" }}>
          {getName(kb.nakshatras.find((n) => n.id === placement.nakshatra), lang) || placement.nakshatra} · Pada {placement.pada}
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
          interests={interests}
          compact
        />
      )}
    </div>
  );
}

// ── Bhava (house) focus mode — fed by composeHouseReading ──────────────────────

function HouseReadingBody({
  houseNum,
  chart,
  chartId,
  interests,
  isOrrery,
  onBack,
  backLabel,
  lang,
}: {
  houseNum: number;
  chart: NatalChart;
  chartId?: string;
  interests?: string[];
  isOrrery: boolean;
  onBack?: () => void;
  backLabel: string;
  lang: Parameters<typeof getName>[1];
}) {
  const bhava = kb.bhavas[String(houseNum)];
  const color = "#C8A24A"; // neutral brass — houses have no single karaka color

  const reading = useMemo(
    () => composeHouseReading(houseNum, chart.lagnaSign, chart.placements),
    [houseNum, chart.lagnaSign, chart.placements]
  );

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

      {/* Header: house number + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 54, height: 54,
          borderRadius: "50%",
          border: `1.5px solid ${color}55`,
          background: `${color}12`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.3rem", fontWeight: 700, color, flexShrink: 0,
          boxShadow: `0 0 18px ${color}22`,
        }}>
          {houseNum}
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
            {getName(bhava, lang)}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 3 }}>
            House {houseNum} · {reading.sign.en} ({reading.sign.ruler})
          </p>
        </div>
      </div>

      {/* House-class badges */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {reading.houseClass.map((c) => (
          <span key={c} className="badge badge-neutral" style={{ textTransform: "capitalize" }}>{c}</span>
        ))}
      </div>

      <div style={{ height: 1, background: `${color}22` }} />

      {/* Composed reading */}
      <div>
        <p style={{
          fontSize: "0.68rem", textTransform: "uppercase",
          letterSpacing: "0.14em", color: "var(--faint)", marginBottom: 4,
        }}>
          Reading
        </p>
        <p style={{ fontSize: "0.83rem", lineHeight: 1.65, color: "var(--parchment)" }}>
          {reading.body}
        </p>
      </div>

      {/* Significations */}
      {reading.significations.length > 0 && (
        <div>
          <p style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--faint)", marginBottom: 6 }}>
            Signifies
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {reading.significations.slice(0, 8).map((s) => (
              <span key={s} style={{
                fontSize: "0.73rem",
                padding: "3px 10px",
                borderRadius: 100,
                background: `${color}12`,
                border: `1px solid ${color}38`,
                color,
                textTransform: "capitalize",
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Planets occupying this house */}
      {reading.planets.length > 0 && (
        <div>
          <p style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--faint)", marginBottom: 6 }}>
            Planets here
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {reading.planets.map((gid) => (
              <span key={gid} style={{
                fontSize: "0.73rem",
                padding: "3px 10px",
                borderRadius: 100,
                background: "rgba(200,162,74,0.1)",
                border: "1px solid rgba(200,162,74,0.3)",
                color: "var(--parchment)",
              }}>
                {GRAHA_GLYPHS[gid]} {getName(kb.grahas[gid], lang)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* GRAHA AI — only when chart is saved (chartId present) */}
      {chartId && (
        <GrahaAIChat
          chartId={chartId}
          focus={{ kind: "house", id: houseNum }}
          interests={interests}
          compact
        />
      )}
    </div>
  );
}
