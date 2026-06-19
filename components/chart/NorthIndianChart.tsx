"use client";

import { useMemo } from "react";
import type { Placement } from "@/lib/astro/computeChart";
import { GRAHA_GLYPHS, type GrahaId } from "@/lib/kb";

// ── Geometry constants from spec §6 ──────────────────────────────────────────

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

function signForHouse(lagnaSign: number, house: number): number {
  return ((lagnaSign - 1 + house - 1) % 12) + 1;
}

const SIGN_SANSKRIT_SHORT = [
  "", "Mes", "Vrs", "Mit", "Kar", "Sim", "Kan",
  "Tul", "Vri", "Dha", "Mak", "Kum", "Mee",
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  placements: Placement[];
  lagnaSign: number;
  selectedHouse: number | null;
  selectedBody: string | null;
  onHouseClick: (house: number) => void;
  onBodyClick: (body: string) => void;
  size?: number;
}

export default function NorthIndianChart({
  placements, lagnaSign,
  selectedHouse, selectedBody, onHouseClick, onBodyClick,
  size = 440,
}: Props) {
  const PAD = 8;
  const S = size - PAD * 2;
  const ox = PAD, oy = PAD;

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

  function toSvg(ux: number, uy: number): [number, number] {
    return [ox + ux * S, oy + uy * S];
  }

  function polyPoints(poly: [number, number][]): string {
    return poly.map(([x, y]) => toSvg(x, y).join(",")).join(" ");
  }

  const isSelected = (h: number) => selectedHouse === h;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label="North Indian birth chart"
      role="img"
      style={{ display: "block", maxWidth: "100%" }}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* House polygons */}
      {Object.entries(HOUSE_POLYS).map(([hStr, poly]) => {
        const h = Number(hStr);
        const cx = CENTROID[h];
        const [svgCx, svgCy] = toSvg(cx[0], cx[1]);
        const signNum = signForHouse(lagnaSign, h);
        const planets = housePlanets[h] ?? [];
        const sel = isSelected(h);

        return (
          <g
            key={h}
            role="button"
            aria-label={`House ${h}`}
            tabIndex={0}
            style={{ cursor: "pointer" }}
            onClick={() => onHouseClick(h)}
            onKeyDown={(e) => e.key === "Enter" && onHouseClick(h)}
          >
            {/* House fill */}
            <polygon
              points={polyPoints(poly)}
              fill={sel ? "rgba(200,162,74,0.12)" : "transparent"}
              stroke={sel ? "var(--brass-bright)" : "var(--faint)"}
              strokeWidth={sel ? 1.5 : 0.8}
              filter={sel ? "url(#glow)" : undefined}
            />

            {/* Sign label */}
            <text
              x={svgCx}
              y={svgCy - (planets.length > 0 ? 10 : 2)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fontFamily="var(--font-ui), system-ui"
              fill={sel ? "var(--brass-bright)" : "var(--muted)"}
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              {SIGN_SANSKRIT_SHORT[signNum]}
            </text>

            {/* House number (small) */}
            <text
              x={svgCx + (h <= 6 ? -14 : 14)}
              y={svgCy - (planets.length > 0 ? 10 : 2)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={7}
              fontFamily="var(--font-ui), system-ui"
              fill="var(--faint)"
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              {h}
            </text>

            {/* Planet glyphs */}
            {planets.map((p, i) => {
              const gid = p.body as GrahaId;
              const glyph = GRAHA_GLYPHS[gid] ?? "?";
              const isSel = selectedBody === p.body;
              const row = Math.floor(i / 2);
              const col = i % 2;
              const py = svgCy + 8 + row * 14;
              const px = svgCx + (col === 0 ? -8 : 8);

              return (
                <g
                  key={p.body}
                  role="button"
                  aria-label={`${p.body} in house ${p.house}`}
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => { e.stopPropagation(); onBodyClick(p.body); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onBodyClick(p.body); } }}
                >
                  {isSel && (
                    <circle cx={px} cy={py} r={9} fill="rgba(200,162,74,0.2)" filter="url(#glow)" />
                  )}
                  <text
                    x={px}
                    y={py}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={p.retrograde ? 11 : 13}
                    fontFamily="serif"
                    fill={
                      isSel
                        ? "var(--brass-bright)"
                        : p.dignity === "debilitated"
                        ? "var(--weak)"
                        : p.dignity === "exalted" || p.dignity === "own" || p.dignity === "moolatrikona"
                        ? "var(--brass)"
                        : "var(--parchment)"
                    }
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {glyph}{p.retrograde ? "℞" : ""}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Structural lines: outer square */}
      {[
        [toSvg(0,0), toSvg(1,0)], [toSvg(1,0), toSvg(1,1)],
        [toSvg(1,1), toSvg(0,1)], [toSvg(0,1), toSvg(0,0)],
        // diagonals
        [toSvg(0,0), toSvg(1,1)], [toSvg(1,0), toSvg(0,1)],
        // inner diamond
        [toSvg(.5,0), toSvg(1,.5)], [toSvg(1,.5), toSvg(.5,1)],
        [toSvg(.5,1), toSvg(0,.5)], [toSvg(0,.5), toSvg(.5,0)],
      ].map(([a, b], i) => (
        <line
          key={i}
          x1={a[0]} y1={a[1]}
          x2={b[0]} y2={b[1]}
          stroke="var(--brass)"
          strokeWidth={0.6}
          opacity={0.4}
          style={{ pointerEvents: "none" }}
        />
      ))}

      {/* Lagna mark (Asc) in house 1 centroid */}
      {(() => {
        const [cx, cy] = toSvg(CENTROID[1][0], CENTROID[1][1]);
        return (
          <text
            x={cx + 16}
            y={cy - 10}
            fontSize={8}
            fontFamily="var(--font-ui)"
            fill="var(--brass)"
            textAnchor="middle"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            Asc
          </text>
        );
      })()}
    </svg>
  );
}
