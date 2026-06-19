"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { Placement } from "@/lib/astro/computeChart";
import { GRAHA_GLYPHS, kb, type GrahaId } from "@/lib/kb";

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

// House signification labels (for popup on hover/select)
const HOUSE_SIGNIFIES: Record<number, string> = {
  1:  "Self & Personality",
  2:  "Wealth & Speech",
  3:  "Courage & Siblings",
  4:  "Home & Mother",
  5:  "Creativity & Children",
  6:  "Health & Daily Work",
  7:  "Partnership & Marriage",
  8:  "Transformation & Secrets",
  9:  "Fortune & Dharma",
  10: "Career & Status",
  11: "Gains & Desires",
  12: "Moksha & Foreign Lands",
};

const SIGN_SANSKRIT_SHORT = [
  "", "Mes", "Vrs", "Mit", "Kar", "Sim", "Kan",
  "Tul", "Vri", "Dha", "Mak", "Kum", "Mee",
];

const SIGN_EN_SHORT = [
  "", "Ari", "Tau", "Gem", "Can", "Leo", "Vir",
  "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis",
];

function signForHouse(lagnaSign: number, house: number): number {
  return ((lagnaSign - 1 + house - 1) % 12) + 1;
}

// SVG structural lines (all in unit coords, drawn on top as decorative layer)
const STRUCT_LINES: [[number, number], [number, number]][] = [
  [[0,0],[1,0]], [[1,0],[1,1]], [[1,1],[0,1]], [[0,1],[0,0]],
  [[0,0],[1,1]], [[1,0],[0,1]],
  [[.5,0],[1,.5]], [[1,.5],[.5,1]], [[.5,1],[0,.5]], [[0,.5],[.5,0]],
];

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
  x: number; // percent of container
  y: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NorthIndianChart({
  placements, lagnaSign,
  selectedHouse, selectedBody, onHouseClick, onBodyClick,
  size = 440,
}: Props) {
  const PAD = size * 0.018; // ~8px at 440
  const S = size - PAD * 2;
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // trigger entry animations after first paint
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Build house → planets map
  const housePlanets = useMemo(() => {
    const map: Record<number, Placement[]> = {};
    for (let h = 1; h <= 12; h++) map[h] = [];
    for (const p of placements) {
      if (p.body === "lagna") continue;
      map[p.house]?.push(p);
    }
    return map;
  }, [placements]);

  // Unit → SVG pixel
  function toSvgPx(ux: number, uy: number): [number, number] {
    return [PAD + ux * S, PAD + uy * S];
  }

  // Unit → CSS percentage string (for clip-path and absolute positioning)
  function toPct(ux: number, uy: number): [string, string] {
    const x = ((PAD + ux * S) / size) * 100;
    const y = ((PAD + uy * S) / size) * 100;
    return [`${x.toFixed(3)}%`, `${y.toFixed(3)}%`];
  }

  function clipPath(poly: [number, number][]): string {
    return `polygon(${poly.map(([x, y]) => toPct(x, y).join(" ")).join(", ")})`;
  }

  function centroidPct(h: number): [number, number] {
    const [cx, cy] = CENTROID[h];
    const x = ((PAD + cx * S) / size) * 100;
    const y = ((PAD + cy * S) / size) * 100;
    return [x, y];
  }

  // SVG line points
  function svgLine(a: [number, number], b: [number, number]) {
    const [x1, y1] = toSvgPx(a[0], a[1]);
    const [x2, y2] = toSvgPx(b[0], b[1]);
    return { x1, y1, x2, y2 };
  }

  const totalLineLength = useMemo(() => {
    return STRUCT_LINES.reduce((acc, [a, b]) => {
      const [x1, y1] = toSvgPx(a[0], a[1]);
      const [x2, y2] = toSvgPx(b[0], b[1]);
      return acc + Math.hypot(x2 - x1, y2 - y1);
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  return (
    <>
      {/* Inline keyframes */}
      <style>{`
        @keyframes drawLine {
          from { stroke-dashoffset: var(--line-len); }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes houseIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes planetPop {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          70%  { transform: translate(-50%, -50%) scale(1.25); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes ascPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,162,74,0); }
          50%       { box-shadow: 0 0 0 6px rgba(200,162,74,0.18); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
        .chart-house {
          position: absolute; inset: 0;
          cursor: pointer;
          transition: background 0.18s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .chart-house:focus-visible {
          outline: 2px solid var(--brass-bright);
          outline-offset: 2px;
        }
        .chart-house:hover .house-bg {
          background: rgba(200,162,74,0.07);
        }
        .chart-house.selected .house-bg {
          background: rgba(200,162,74,0.14);
        }
        .house-bg {
          position: absolute; inset: 0;
          transition: background 0.18s ease;
        }
        .planet-btn {
          position: absolute;
          transform: translate(-50%, -50%);
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          line-height: 1;
          font-family: serif;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.15s ease, filter 0.15s ease;
          z-index: 10;
        }
        .planet-btn:hover {
          transform: translate(-50%, -50%) scale(1.4);
          filter: drop-shadow(0 0 6px rgba(200,162,74,0.7));
          z-index: 20;
        }
        .planet-btn.planet-selected {
          transform: translate(-50%, -50%) scale(1.3);
          filter: drop-shadow(0 0 8px rgba(240,206,122,0.9));
        }
        .planet-btn:focus-visible {
          outline: 2px solid var(--brass-bright);
          outline-offset: 3px;
          border-radius: 4px;
        }
        .house-label-pill {
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 2px 5px;
          border-radius: 99px;
          background: rgba(11,15,35,0.7);
          border: 1px solid rgba(200,162,74,0.18);
          font-family: var(--font-ui, system-ui);
          font-size: 9px;
          line-height: 1.2;
          white-space: nowrap;
          backdrop-filter: blur(2px);
        }
        .house-label-pill .h-num {
          color: var(--faint);
          font-weight: 700;
        }
        .house-label-pill .h-sign {
          color: var(--muted);
        }
        .chart-house.selected .house-label-pill,
        .chart-house:hover .house-label-pill {
          border-color: rgba(200,162,74,0.4);
          background: rgba(11,15,35,0.9);
        }
        .chart-house.selected .house-label-pill .h-num,
        .chart-house:hover .house-label-pill .h-num {
          color: var(--brass-bright);
        }
        .chart-house.selected .house-label-pill .h-sign,
        .chart-house:hover .house-label-pill .h-sign {
          color: var(--parchment);
        }
      `}</style>

      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: size,
          height: size,
          maxWidth: "100%",
          flexShrink: 0,
          userSelect: "none",
        }}
        aria-label="North Indian birth chart"
      >
        {/* ── SVG: structural lines only ─────────────────────────────── */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
        >
          <defs>
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Gold structural lines — animated draw-in */}
          {STRUCT_LINES.map(([a, b], i) => {
            const { x1, y1, x2, y2 } = svgLine(a, b);
            const len = Math.hypot(x2 - x1, y2 - y1);
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="var(--brass)"
                strokeWidth={0.7}
                opacity={0.5}
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

        {/* ── HTML layer: interactive house buttons ─────────────────── */}
        <div
          style={{ position: "absolute", inset: 0, zIndex: 2 }}
          aria-label="Chart houses"
        >
          {Object.entries(HOUSE_POLYS).map(([hStr, poly]) => {
            const h = Number(hStr);
            const signNum = signForHouse(lagnaSign, h);
            const planets = housePlanets[h] ?? [];
            const sel = selectedHouse === h;
            const isAsc = h === 1;
            const [cxPct, cyPct] = centroidPct(h);

            // Staggered fade-in for each house
            const houseDelay = `${0.5 + (h - 1) * 0.04}s`;

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
                    ? `opacity 0.35s ease ${houseDelay}`
                    : "none",
                  ...(isAsc && sel
                    ? { animation: "ascPulse 2.4s ease-in-out infinite" }
                    : {}),
                }}
                aria-label={`House ${h} — ${HOUSE_SIGNIFIES[h]}`}
                aria-pressed={sel}
                onClick={() => onHouseClick(h)}
              >
                <div className="house-bg" />

                {/* Selected house: inner glow border via SVG overlay */}
                {sel && (
                  <svg
                    aria-hidden="true"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
                  >
                    <polygon
                      points={poly.map(([x, y]) => {
                        const [px, py] = toSvgPx(x, y);
                        return `${px},${py}`;
                      }).join(" ")}
                      fill="none"
                      stroke="var(--brass-bright)"
                      strokeWidth={1.5}
                      filter="url(#lineGlow)"
                      style={{ animation: isAsc ? "glowPulse 2.4s ease-in-out infinite" : undefined }}
                    />
                  </svg>
                )}

                {/* House label pill (number + sign) */}
                <div
                  style={{
                    position: "absolute",
                    left: `${cxPct}%`,
                    top: `${cyPct}%`,
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    pointerEvents: "none",
                  }}
                >
                  <span className="house-label-pill">
                    <span className="h-num">{h}</span>
                    <span className="h-sign">{SIGN_SANSKRIT_SHORT[signNum]}</span>
                  </span>

                  {/* Hover / selected: show signification below pill */}
                  {sel && (
                    <span
                      style={{
                        fontSize: 8,
                        color: "var(--brass)",
                        fontFamily: "var(--font-ui, system-ui)",
                        textAlign: "center",
                        maxWidth: 60,
                        lineHeight: 1.3,
                        padding: "2px 4px",
                        background: "rgba(11,15,35,0.85)",
                        borderRadius: 4,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {HOUSE_SIGNIFIES[h]}
                    </span>
                  )}
                </div>

                {/* Ascendant marker */}
                {isAsc && (
                  <span
                    style={{
                      position: "absolute",
                      left: `${cxPct + 4}%`,
                      top: `${cyPct - 6}%`,
                      transform: "translate(-50%, -50%)",
                      fontSize: 7,
                      color: "var(--brass)",
                      fontFamily: "var(--font-ui, system-ui)",
                      letterSpacing: "0.05em",
                      pointerEvents: "none",
                      opacity: 0.85,
                    }}
                  >
                    Asc
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Planet buttons — outside clip-path so tooltips aren't cut ─── */}
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
              const graha = kb.grahas[gid];
              const isSel = selectedBody === p.body;

              // Offset planets from centroid: up to 2 per row
              const row = Math.floor(i / 2);
              const col = i % 2 === 0 ? -1 : 1;
              // shift down from the pill label by ~8%
              const px = cxPct + col * 4.5;
              const py = cyPct + 8 + row * 5.5;

              const planetColor = isSel
                ? "var(--brass-bright)"
                : p.dignity === "debilitated"
                ? "var(--weak)"
                : p.dignity === "exalted" || p.dignity === "own" || p.dignity === "moolatrikona"
                ? "var(--brass)"
                : "var(--parchment)";

              // Staggered pop-in
              const popDelay = `${1.1 + h * 0.03 + i * 0.06}s`;

              return (
                <button
                  key={p.body}
                  className={`planet-btn${isSel ? " planet-selected" : ""}`}
                  aria-label={`${graha?.en ?? p.body}${p.retrograde ? " (retrograde)" : ""} in house ${p.house}`}
                  style={{
                    left: `${px}%`,
                    top: `${py}%`,
                    fontSize: size < 300 ? 11 : 14,
                    color: planetColor,
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
                  onMouseEnter={() => {
                    setTooltip({ body: p.body, x: px, y: Math.max(py - 8, 5) });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  onFocus={() => {
                    setTooltip({ body: p.body, x: px, y: Math.max(py - 8, 5) });
                  }}
                  onBlur={() => setTooltip(null)}
                >
                  {glyph}{p.retrograde ? "℞" : ""}
                </button>
              );
            });
          })}
        </div>

        {/* ── Planet tooltip (outside clip-path) ─────────────────────── */}
        {tooltip && (() => {
          const gid = tooltip.body as GrahaId;
          const graha = kb.grahas[gid];
          const pl = placements.find((p) => p.body === tooltip.body);
          const signNum = pl?.sign ? Number(pl.sign) : 0;
          return (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: `${tooltip.x}%`,
                top: `${tooltip.y}%`,
                transform: "translate(-50%, -100%)",
                zIndex: 30,
                background: "rgba(11,15,35,0.96)",
                border: "1px solid rgba(200,162,74,0.4)",
                borderRadius: 7,
                padding: "5px 9px",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 18px rgba(0,0,0,0.55)",
              }}
            >
              <p style={{ fontSize: 11, color: "var(--parchment)", fontFamily: "var(--font-ui, system-ui)", margin: 0, fontWeight: 600 }}>
                {graha?.sanskrit} / {graha?.en}
              </p>
              {pl && (
                <p style={{ fontSize: 9.5, color: "var(--muted)", fontFamily: "var(--font-ui, system-ui)", margin: "2px 0 0", lineHeight: 1.4 }}>
                  House {pl.house} · {SIGN_EN_SHORT[signNum]}
                  {pl.retrograde && <span style={{ color: "var(--weak)", marginLeft: 4 }}>℞</span>}
                  {pl.dignity && (
                    <span style={{ color: "var(--brass)", marginLeft: 4, textTransform: "capitalize" }}>
                      {pl.dignity === "own" ? "own sign" : pl.dignity}
                    </span>
                  )}
                </p>
              )}
            </div>
          );
        })()}

        {/* ── House hover tooltip (shows signification name on hover) ── */}
        {/* House-level hover tooltip is handled via CSS :hover on .house-label-pill above */}
      </div>
    </>
  );
}
