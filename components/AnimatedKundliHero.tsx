// Decorative animated North-Indian kundli chart — SVG, pure CSS animations.
// Uses the same HOUSE_POLYS + CENTROID geometry as NorthIndianChart.tsx.
// Reduced-motion: globals.css sets animation-duration: 0.01ms so all
// animations become instant, showing the fully-drawn final state.

const SIZE = 300;
const PAD = 10;
const S = SIZE - PAD * 2;
const OX = PAD;
const OY = PAD;

function px(ux: number): number { return OX + ux * S; }
function py(uy: number): number { return OY + uy * S; }
function pt(ux: number, uy: number): string { return `${px(ux)},${py(uy)}`; }

// ── Sample chart ──────────────────────────────────────────────────────────────
// Lagna = Mesha (1 / Aries). Planets spread attractively for visual richness.
const SAMPLE_LAGNA = 1;

const SIGN_SHORT = [
  "", "Mes", "Vrs", "Mit", "Kar", "Sim", "Kan",
  "Tul", "Vri", "Dha", "Mak", "Kum", "Mee",
];

const SAMPLE_PLANETS: { glyph: string; color: string; house: number }[] = [
  { glyph: "☉", color: "#F59E0B", house: 1 },
  { glyph: "♂", color: "#EF4444", house: 1 },
  { glyph: "☿", color: "#4ADE80", house: 1 },
  { glyph: "☋", color: "#8B5CF6", house: 3 },
  { glyph: "♀", color: "#F472B6", house: 7 },
  { glyph: "♃", color: "#FCD34D", house: 9 },
  { glyph: "☊", color: "#9CA3AF", house: 9 },
  { glyph: "☽", color: "#D4D4D8", house: 10 },
  { glyph: "♄", color: "#818CF8", house: 10 },
];

// Group planets by house
const PLANETS_BY_HOUSE: Record<number, typeof SAMPLE_PLANETS> = {};
for (const p of SAMPLE_PLANETS) {
  (PLANETS_BY_HOUSE[p.house] ??= []).push(p);
}

// ── Geometry (verbatim from NorthIndianChart.tsx) ─────────────────────────────
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
  1: [.5,.25],   2: [.25,.083],  3: [.083,.25],  4: [.25,.5],
  5: [.083,.75], 6: [.25,.917],  7: [.5,.75],    8: [.75,.917],
  9: [.917,.75], 10: [.75,.5],   11: [.917,.25], 12: [.75,.083],
};

const STRUCTURAL_LINES: [[number, number], [number, number]][] = [
  [[0,0],[1,0]], [[1,0],[1,1]], [[1,1],[0,1]], [[0,1],[0,0]],
  [[0,0],[1,1]], [[1,0],[0,1]],
  [[.5,0],[1,.5]], [[1,.5],[.5,1]], [[.5,1],[0,.5]], [[0,.5],[.5,0]],
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function AnimatedKundliHero({
  size = SIZE,
  className,
  style,
}: Props) {
  const scale = size / SIZE;
  const viewBox = `0 0 ${SIZE} ${SIZE}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      aria-hidden="true"
      className={className}
      style={{
        display: "block",
        animation: "kundliPulse 6s ease-in-out infinite",
        ...style,
      }}
    >
      <defs>
        <filter id="kh-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Structural lines — draw in sequentially */}
      {STRUCTURAL_LINES.map(([[x1, y1], [x2, y2]], i) => {
        const delay = (i * 0.1).toFixed(2);
        const isOuter = i < 4;
        return (
          <line
            key={i}
            x1={px(x1)} y1={py(y1)}
            x2={px(x2)} y2={py(y2)}
            stroke="var(--brass)"
            strokeWidth={isOuter ? 1 : 0.7}
            opacity={isOuter ? 0.55 : 0.4}
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
            style={{
              animation: `kundliLine 0.7s ease ${delay}s forwards`,
            }}
          />
        );
      })}

      {/* House polygons (fills) + sign labels */}
      {Object.entries(HOUSE_POLYS).map(([hStr, poly]) => {
        const h = Number(hStr);
        const [cx, cy] = CENTROID[h];
        const signNum = ((SAMPLE_LAGNA - 1 + h - 1) % 12) + 1;
        const label = SIGN_SHORT[signNum];
        const planets = PLANETS_BY_HOUSE[h];
        const lineDelay = 1.2;
        const signDelay = (lineDelay + 0.1 * (h - 1)).toFixed(2);

        const polyPoints = poly.map(([x, y]) => pt(x, y)).join(" ");

        return (
          <g key={h}>
            {/* Subtle fill for house 1 (lagna) */}
            {h === 1 && (
              <polygon
                points={polyPoints}
                fill="rgba(200,162,74,0.06)"
                strokeWidth={0}
              />
            )}

            {/* Sign label */}
            <text
              x={px(cx)}
              y={py(cy) - (planets ? 10 : 2)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9 * Math.min(scale, 1)}
              fontFamily="var(--font-ui), system-ui"
              fill={h === 1 ? "var(--brass)" : "var(--muted)"}
              opacity="0"
              style={{
                animation: `kundliFade 0.5s ease ${signDelay}s forwards`,
                userSelect: "none",
              }}
            >
              {label}
            </text>

            {/* Lagna marker */}
            {h === 1 && (
              <text
                x={px(cx) + 14 * Math.min(scale, 1)}
                y={py(cy) - 12 * Math.min(scale, 1)}
                fontSize={7 * Math.min(scale, 1)}
                fontFamily="var(--font-ui), system-ui"
                fill="var(--brass)"
                textAnchor="middle"
                opacity="0"
                style={{
                  animation: `kundliFade 0.5s ease ${signDelay}s forwards`,
                  userSelect: "none",
                }}
              >
                Asc
              </text>
            )}

            {/* Planet glyphs */}
            {planets?.map((p, i) => {
              const total = planets.length;
              const cols = Math.min(total, 3);
              const col = i % cols;
              const row = Math.floor(i / cols);
              const startX = px(cx) - ((cols - 1) * 12) / 2;
              const glyphX = startX + col * 12;
              const glyphY = py(cy) + 8 + row * 13;
              const glyphDelay = (lineDelay + 0.5 + 0.07 * (h - 1) + 0.05 * i).toFixed(2);

              return (
                <text
                  key={p.glyph + i}
                  x={glyphX}
                  y={glyphY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={13 * Math.min(scale, 1)}
                  fontFamily="serif"
                  fill={p.color}
                  opacity="0"
                  filter="url(#kh-glow)"
                  style={{
                    animation: `kundliGlyphIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${glyphDelay}s forwards`,
                    userSelect: "none",
                    transformOrigin: `${glyphX}px ${glyphY}px`,
                    transformBox: "fill-box",
                  }}
                >
                  {p.glyph}
                </text>
              );
            })}
          </g>
        );
      })}

      {/* Center diamond shimmer accent */}
      <polygon
        points={`${pt(.5,0)} ${pt(1,.5)} ${pt(.5,1)} ${pt(0,.5)}`}
        fill="none"
        stroke="var(--brass-bright)"
        strokeWidth={0.5}
        opacity={0.2}
      />
    </svg>
  );
}
