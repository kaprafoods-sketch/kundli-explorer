"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import type { Placement } from "@/lib/astro/computeChart";
import { GRAHA_GLYPHS, kb, type GrahaId } from "@/lib/kb";
import { GRAHA_COLORS } from "@/lib/grahaColors";

// ── Animation config ──────────────────────────────────────────────────────────
// Change this one constant to switch animation modes globally.
const CHART_ANIMATION: "in-place" | "orbit-ring-only" | "off" = "in-place";

// ── Planet display names (short Sanskrit, matches the app's aesthetic) ────────
const GRAHA_SHORT: Record<string, string> = {
  sun:     "Surya",
  moon:    "Chandra",
  mars:    "Mangal",
  mercury: "Budha",
  jupiter: "Guru",
  venus:   "Shukra",
  saturn:  "Shani",
  rahu:    "Rahu",
  ketu:    "Ketu",
};

// ── Geometry constants ────────────────────────────────────────────────────────

const HOUSE_POLYS: Record<number, [number, number][]> = {
  1:  [[.5,0],[.75,.25],[.5,.5],[.25,.25]],
  2:  [[.5,0],[0,0],[.25,.25]],
  3:  [[0,0],[0,.5],[.25,.25]],
  4:  [[0,.5],[.25,.25],[.5,.5],[.25,.75]],
  5:  [[0,.5],[0,1],[.25,.75]],
  6:  [[0,1],[.5,1],[.25,.75]],
  7:  [[.5,1],[.25,.75],[.5,.5],[.75,.75]],
  8:  [[.5,1],[1,1],[.75,.75]],
  9:  [[1,1],[1,.5],[.75,.75]],
  10: [[1,.5],[.75,.75],[.5,.5],[.75,.25]],
  11: [[1,.5],[1,0],[.75,.25]],
  12: [[1,0],[.5,0],[.75,.25]],
};

const CENTROID: Record<number, [number, number]> = {
  1: [.5,.25],  2: [.25,.083], 3: [.083,.25], 4: [.25,.5],
  5: [.083,.75],6: [.25,.917], 7: [.5,.75],   8: [.75,.917],
  9: [.917,.75],10:[.75,.5],   11:[.917,.25],  12:[.75,.083],
};

const HOUSE_SIGNIFIES: Record<number, string> = {
  1:  "Self & Personality",   2:  "Wealth & Speech",
  3:  "Courage & Siblings",   4:  "Home & Mother",
  5:  "Creativity & Children",6:  "Health & Daily Work",
  7:  "Partnership & Marriage",8:  "Transformation & Secrets",
  9:  "Fortune & Dharma",     10: "Career & Status",
  11: "Gains & Desires",      12: "Moksha & Foreign Lands",
};

const SIGN_SANSKRIT_SHORT = [
  "", "Mes", "Vrs", "Mit", "Kar", "Sim", "Kan",
  "Tul", "Vri", "Dha", "Mak", "Kum", "Mee",
];

const SIGN_EN_SHORT = [
  "", "Ari", "Tau", "Gem", "Can", "Leo", "Vir",
  "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis",
];

const STRUCT_LINES: [[number, number], [number, number]][] = [
  [[0,0],[1,0]], [[1,0],[1,1]], [[1,1],[0,1]], [[0,1],[0,0]],
  [[0,0],[1,1]], [[1,0],[0,1]],
  [[.5,0],[1,.5]], [[1,.5],[.5,1]], [[.5,1],[0,.5]], [[0,.5],[.5,0]],
];

function signForHouse(lagnaSign: number, house: number): number {
  return ((lagnaSign - 1 + house - 1) % 12) + 1;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  placements: Placement[];
  lagnaSign: number;
  selectedHouse: number | null;
  selectedBody: string | null;
  onHouseClick: (house: number) => void;
  onBodyClick: (body: string) => void;
  size?: number;
}

interface TooltipState {
  body: string;
  x: number;
  y: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NorthIndianChart({
  placements, lagnaSign,
  selectedHouse, selectedBody, onHouseClick, onBodyClick,
  size = 440,
}: Props) {
  const PAD = size * 0.018;
  const S = size - PAD * 2;
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [mounted, setMounted] = useState(false);
  const [animPaused, setAnimPaused] = useState(false);

  // Entry animation
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // prefers-reduced-motion + visibilitychange
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAnimPaused(mq.matches);
    update();
    mq.addEventListener("change", update);

    const onVis = () => {
      if (document.hidden) {
        setAnimPaused(true);
      } else {
        const mq2 = window.matchMedia("(prefers-reduced-motion: reduce)");
        setAnimPaused(mq2.matches);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      mq.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Pause when chart is offscreen (IntersectionObserver)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        setAnimPaused(true);
      } else {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setAnimPaused(mq.matches);
      }
    }, { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // House → planets map
  const housePlanets = useMemo(() => {
    const map: Record<number, Placement[]> = {};
    for (let h = 1; h <= 12; h++) map[h] = [];
    for (const p of placements) {
      if (p.body === "lagna") continue;
      map[p.house]?.push(p);
    }
    return map;
  }, [placements]);

  // Coordinate helpers
  function toSvgPx(ux: number, uy: number): [number, number] {
    return [PAD + ux * S, PAD + uy * S];
  }
  function toPct(ux: number, uy: number): [string, string] {
    return [
      `${((PAD + ux * S) / size * 100).toFixed(3)}%`,
      `${((PAD + uy * S) / size * 100).toFixed(3)}%`,
    ];
  }
  function clipPath(poly: [number, number][]): string {
    return `polygon(${poly.map(([x, y]) => toPct(x, y).join(" ")).join(", ")})`;
  }
  function centroidPct(h: number): [number, number] {
    const [cx, cy] = CENTROID[h];
    return [
      (PAD + cx * S) / size * 100,
      (PAD + cy * S) / size * 100,
    ];
  }

  const shouldSpin = CHART_ANIMATION === "in-place" && !animPaused;

  return (
    <>
      <style>{`
        /* Line draw-in */
        @keyframes drawLine {
          from { stroke-dashoffset: var(--line-len); }
          to   { stroke-dashoffset: 0; }
        }
        /* House fade-in */
        @keyframes houseIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        /* Planet pop-in */
        @keyframes planetPop {
          0%   { transform: translate(-50%,-50%) scale(0);    opacity: 0; }
          70%  { transform: translate(-50%,-50%) scale(1.18); opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(1);    opacity: 1; }
        }
        /* Glyph slow spin (in-place) */
        @keyframes glyphSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        /* Ascendant pulse */
        @keyframes ascPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,162,74,0); }
          50%       { box-shadow: 0 0 0 6px rgba(200,162,74,0.18); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
        /* Shared house button behavior */
        .chart-house { position: absolute; inset: 0; cursor: pointer;
          -webkit-tap-highlight-color: transparent; }
        .chart-house:focus-visible { outline: 2px solid var(--brass-bright); outline-offset: 2px; }
        .chart-house:hover .house-bg,
        .chart-house.selected .house-bg { background: rgba(200,162,74,0.08); }
        .chart-house.selected .house-bg { background: rgba(200,162,74,0.14); }
        .house-bg { position: absolute; inset: 0; transition: background 0.18s ease; }
        /* Planet token */
        .planet-token-btn {
          position: absolute;
          transform: translate(-50%, -50%);
          cursor: pointer;
          background: none;
          border: none;
          padding: 4px; /* extends hit area beyond visual token */
          min-width: 40px;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
          z-index: 10;
          -webkit-tap-highlight-color: transparent;
        }
        .planet-token-btn:focus-visible { outline: 2px solid var(--brass-bright); outline-offset: 2px; border-radius: 8px; }
        .planet-token-btn:hover .planet-token-visual { filter: brightness(1.25) drop-shadow(0 0 6px currentColor); transform: scale(1.12); }
        .planet-token-btn.planet-selected .planet-token-visual { transform: scale(1.15); filter: brightness(1.35) drop-shadow(0 0 10px currentColor); }
        .planet-token-visual { transition: transform 0.14s ease, filter 0.14s ease; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 6px; border-radius: 8px; }
        /* Glyph rotation — respects animPaused via inline animationPlayState */
        .planet-glyph { display: block; will-change: transform; line-height: 1; }
        /* House label pill */
        .house-label-pill { pointer-events: none; display: flex; align-items: center; gap: 3px;
          padding: 2px 6px; border-radius: 99px; background: rgba(11,15,35,0.72);
          border: 1px solid rgba(200,162,74,0.18); font-family: var(--font-ui,system-ui);
          font-size: 9px; line-height: 1.2; white-space: nowrap; backdrop-filter: blur(3px); }
        .chart-house.selected .house-label-pill,
        .chart-house:hover   .house-label-pill { border-color: rgba(200,162,74,0.42); background: rgba(11,15,35,0.92); }
        .h-num  { color: var(--faint); font-weight: 700; }
        .h-sign { color: var(--muted); }
        .chart-house.selected .h-num,
        .chart-house:hover    .h-num  { color: var(--brass-bright); }
        .chart-house.selected .h-sign,
        .chart-house:hover    .h-sign { color: var(--parchment); }
        /* Hide webkit scrollbar inherited */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div
        ref={containerRef}
        style={{ position: "relative", width: size, height: size, maxWidth: "100%", userSelect: "none" }}
        aria-label="North Indian birth chart"
      >
        {/* ── SVG: structural lines only ──────────────────────────────── */}
        <svg
          width={size} height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
        >
          <defs>
            <filter id="nic-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {STRUCT_LINES.map(([a, b], i) => {
            const [x1, y1] = toSvgPx(a[0], a[1]);
            const [x2, y2] = toSvgPx(b[0], b[1]);
            const len = Math.hypot(x2 - x1, y2 - y1);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="var(--brass)" strokeWidth={0.7} opacity={0.5}
                style={{
                  "--line-len": `${len}`,
                  strokeDasharray: len,
                  strokeDashoffset: mounted ? 0 : len,
                  transition: mounted
                    ? `stroke-dashoffset 0.55s cubic-bezier(0.4,0,0.2,1) ${i * 0.045}s`
                    : "none",
                } as React.CSSProperties}
              />
            );
          })}
        </svg>

        {/* ── HTML layer: house buttons ────────────────────────────────── */}
        <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
          {Object.entries(HOUSE_POLYS).map(([hStr, poly]) => {
            const h = Number(hStr);
            const signNum = signForHouse(lagnaSign, h);
            const sel = selectedHouse === h;
            const isAsc = h === 1;
            const [cxPct, cyPct] = centroidPct(h);

            return (
              <button
                key={h}
                className={`chart-house${sel ? " selected" : ""}`}
                style={{
                  clipPath: clipPath(poly),
                  border: "none",
                  background: "none",
                  padding: 0,
                  opacity: mounted ? 1 : 0,
                  transition: mounted
                    ? `opacity 0.35s ease ${0.5 + (h - 1) * 0.04}s`
                    : "none",
                  ...(isAsc && sel ? { animation: "ascPulse 2.4s ease-in-out infinite" } : {}),
                }}
                aria-label={`House ${h} — ${HOUSE_SIGNIFIES[h]}`}
                aria-pressed={sel}
                onClick={() => onHouseClick(h)}
              >
                <div className="house-bg" />

                {/* Selected glow border */}
                {sel && (
                  <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                    <polygon
                      points={poly.map(([x, y]) => {
                        const [px, py] = toSvgPx(x, y);
                        return `${px},${py}`;
                      }).join(" ")}
                      fill="none"
                      stroke="var(--brass-bright)"
                      strokeWidth={1.5}
                      filter="url(#nic-glow)"
                      style={{ animation: isAsc ? "glowPulse 2.4s ease-in-out infinite" : undefined }}
                    />
                  </svg>
                )}

                {/* House label pill */}
                <div style={{
                  position: "absolute",
                  left: `${cxPct}%`, top: `${cyPct}%`,
                  transform: "translate(-50%, -50%)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  pointerEvents: "none",
                }}>
                  <span className="house-label-pill">
                    <span className="h-num">{h}</span>
                    <span className="h-sign">{SIGN_SANSKRIT_SHORT[signNum]}</span>
                  </span>
                  {sel && (
                    <span style={{
                      fontSize: 8, color: "var(--brass)",
                      fontFamily: "var(--font-ui,system-ui)",
                      textAlign: "center", maxWidth: 60, lineHeight: 1.3,
                      padding: "2px 4px",
                      background: "rgba(11,15,35,0.88)", borderRadius: 4,
                      whiteSpace: "nowrap",
                    }}>
                      {HOUSE_SIGNIFIES[h]}
                    </span>
                  )}
                </div>

                {isAsc && (
                  <span style={{
                    position: "absolute",
                    left: `${cxPct + 4}%`, top: `${cyPct - 6}%`,
                    transform: "translate(-50%, -50%)",
                    fontSize: 7, color: "var(--brass)",
                    fontFamily: "var(--font-ui,system-ui)", letterSpacing: "0.05em",
                    pointerEvents: "none", opacity: 0.85,
                  }}>Asc</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Planet tokens — outside clip-path to prevent clipping ────── */}
        <div
          style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}
          aria-label="Chart planets"
        >
          {Object.entries(housePlanets).map(([hStr, planets]) => {
            const h = Number(hStr);
            if (planets.length === 0) return null;
            const [cxPct, cyPct] = centroidPct(h);

            return planets.map((p, i) => {
              const gid = p.body as GrahaId;
              const glyph = GRAHA_GLYPHS[gid] ?? "?";
              const shortName = GRAHA_SHORT[gid] ?? gid;
              const graha = kb.grahas[gid];
              const isSel = selectedBody === p.body;

              // Color from GRAHA_COLORS (single source of truth)
              const colors = GRAHA_COLORS[gid as keyof typeof GRAHA_COLORS];
              const color = colors?.core ?? "#C8A24A";

              // Position tokens below the pill label
              // Single planet: centered; multiple: 2-column grid
              const isSingle = planets.length === 1;
              const row = Math.floor(i / 2);
              const colDir = isSingle ? 0 : (i % 2 === 0 ? -1 : 1);
              const px = cxPct + colDir * 4.5;
              const py = cyPct + 7.5 + row * 7;

              // Staggered pop-in
              const popDelay = `${1.1 + h * 0.025 + i * 0.06}s`;

              // Text shadow for legibility on any house background (critical for Moon/Venus)
              const textShadow = `0 0 8px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,0.9), 0 0 20px ${color}55`;

              return (
                <button
                  key={p.body}
                  className={`planet-token-btn${isSel ? " planet-selected" : ""}`}
                  aria-label={`${graha?.en ?? shortName} — view details`}
                  style={{
                    left: `${px}%`,
                    top: `${py}%`,
                    pointerEvents: "auto",
                    opacity: mounted ? 1 : 0,
                    animation: mounted
                      ? `planetPop 0.4s cubic-bezier(0.34,1.56,0.64,1) ${popDelay} both`
                      : "none",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBodyClick(p.body);
                  }}
                  onMouseEnter={() => setTooltip({ body: p.body, x: px, y: Math.max(py - 9, 5) })}
                  onMouseLeave={() => setTooltip(null)}
                  onFocus={() => setTooltip({ body: p.body, x: px, y: Math.max(py - 9, 5) })}
                  onBlur={() => setTooltip(null)}
                >
                  <div
                    className="planet-token-visual"
                    style={{
                      background: `${color}14`,
                      border: isSel ? `1.5px solid ${color}70` : `1px solid ${color}35`,
                      boxShadow: isSel ? `0 0 12px ${color}40, inset 0 0 8px ${color}10` : "none",
                    }}
                  >
                    {/* Glyph — spins in-place when CHART_ANIMATION=in-place */}
                    <span
                      className="planet-glyph"
                      style={{
                        fontSize: size < 320 ? 11 : 14,
                        color,
                        textShadow,
                        fontFamily: "serif",
                        animation: shouldSpin
                          ? `glyphSpin ${45 + (Object.keys(GRAHA_COLORS).indexOf(gid) * 5)}s linear infinite`
                          : "none",
                        animationPlayState: animPaused ? "paused" : "running",
                      }}
                    >
                      {glyph}
                    </span>
                    {/* Short name label */}
                    <span style={{
                      fontSize: size < 320 ? 6 : 7.5,
                      color,
                      fontFamily: "var(--font-ui,system-ui)",
                      fontWeight: 700,
                      letterSpacing: "0.03em",
                      lineHeight: 1,
                      textShadow: `0 1px 4px rgba(0,0,0,0.95)`,
                      whiteSpace: "nowrap",
                    }}>
                      {shortName}
                    </span>
                    {/* Retrograde indicator hook */}
                    {p.retrograde && (
                      <span style={{ fontSize: 6, color: "var(--weak)", lineHeight: 1 }}>℞</span>
                    )}
                  </div>
                </button>
              );
            });
          })}
        </div>

        {/* ── Planet tooltip (outside clip-path, no clipping) ──────────── */}
        {tooltip && (() => {
          const gid = tooltip.body as GrahaId;
          const graha = kb.grahas[gid];
          const pl = placements.find((p) => p.body === tooltip.body);
          const signNum = pl?.sign ? Number(pl.sign) : 0;
          const color = GRAHA_COLORS[gid as keyof typeof GRAHA_COLORS]?.core ?? "#C8A24A";
          return (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: `${tooltip.x}%`,
                top: `${tooltip.y}%`,
                transform: "translate(-50%, -100%)",
                zIndex: 30,
                background: "rgba(11,15,35,0.97)",
                border: `1px solid ${color}50`,
                borderRadius: 8,
                padding: "6px 10px",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                boxShadow: `0 4px 18px rgba(0,0,0,0.6), 0 0 12px ${color}18`,
              }}
            >
              <p style={{ fontSize: 12, color: "var(--parchment)", fontFamily: "var(--font-ui,system-ui)", margin: 0, fontWeight: 700 }}>
                <span style={{ color, marginRight: 5 }}>{GRAHA_GLYPHS[gid]}</span>
                {graha?.sanskrit} / {graha?.en}
              </p>
              {pl && (
                <p style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-ui,system-ui)", margin: "3px 0 0", lineHeight: 1.4 }}>
                  House {pl.house} · {SIGN_EN_SHORT[signNum]}
                  {pl.retrograde && <span style={{ color: "var(--weak)", marginLeft: 4 }}>℞</span>}
                  {pl.dignity && (
                    <span style={{ color, marginLeft: 5, textTransform: "capitalize", opacity: 0.8 }}>
                      {pl.dignity === "own" ? "own sign" : pl.dignity}
                    </span>
                  )}
                </p>
              )}
            </div>
          );
        })()}
      </div>
    </>
  );
}
