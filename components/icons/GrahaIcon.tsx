"use client";

import type { GrahaId } from "@/lib/kb";

/**
 * GRAHA planet icon family — original geometric icons replacing Unicode astrology glyphs.
 *
 * Design system:
 *   Grid: 24×24 viewBox
 *   Stroke: 1.5px, round linecap/linejoin
 *   Corner radius: 0 (all circles/curves — no angular elements)
 *   Shared vocabulary: circles, arcs, orbital geometry
 *
 * Variants:
 *   "outlined" (default) — stroke only; for chart cells, chips, badges
 *   "filled"             — filled shapes; for cards, selected states
 *
 * Teaching note: classical Unicode glyphs (☉ ☽ ♂ ☿ ♃ ♀ ♄ ☊ ☋) remain available
 * in lib/kb.ts GRAHA_GLYPHS for use in the compact chart SVG where space is <14px.
 * These icons are for DOM contexts with ≥16px available.
 */

interface GrahaIconProps {
  graha: GrahaId;
  variant?: "outlined" | "filled";
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

// ── Per-graha SVG path data ───────────────────────────────────────────────────

function SuryaOutlined() {
  const rays = [0, 60, 120, 180, 240, 300];
  return (
    <>
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {rays.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={12 + 5.5 * Math.cos(rad)}
            y1={12 + 5.5 * Math.sin(rad)}
            x2={12 + 8.5 * Math.cos(rad)}
            y2={12 + 8.5 * Math.sin(rad)}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
}

function SuryaFilled() {
  const rays = [0, 60, 120, 180, 240, 300];
  return (
    <>
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
      {rays.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={12 + 5.5 * Math.cos(rad)}
            y1={12 + 5.5 * Math.sin(rad)}
            x2={12 + 8.5 * Math.cos(rad)}
            y2={12 + 8.5 * Math.sin(rad)}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
}

// Crescent: outer arc A(7,7 CCW large) then inner arc A(5.5,5.5 CW large)
// Tips at (16,7) and (16,17) — right-facing C crescent
function ChandraOutlined() {
  return <path d="M 16 7 A 7 7 0 1 0 16 17 A 5.5 5.5 0 1 1 16 7 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />;
}
function ChandraFilled() {
  return <path d="M 16 7 A 7 7 0 1 0 16 17 A 5.5 5.5 0 1 1 16 7 Z" fill="currentColor" />;
}

// Circle (body) + arrow at upper-right (action/direction)
function MangalaOutlined() {
  return (
    <>
      <circle cx="9.5" cy="14.5" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="13.8" y1="10.2" x2="20" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="15.5,4 20,4 20,8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  );
}
function MangalaFilled() {
  return (
    <>
      <circle cx="9.5" cy="14.5" r="5.5" fill="currentColor" />
      <line x1="13.8" y1="10.2" x2="20" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="15.5,4 20,4 20,8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  );
}

// Large body circle + small mind circle connected above (messenger / two nodes)
function BudhaOutlined() {
  return (
    <>
      <circle cx="12" cy="15" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="12" y1="9.5" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </>
  );
}
function BudhaFilled() {
  return (
    <>
      <circle cx="12" cy="15" r="5.5" fill="currentColor" />
      <line x1="12" y1="9.5" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="5.5" r="2" fill="currentColor" />
    </>
  );
}

// Large orbit ring + small inner filled planet (expansion / containment)
function GuruOutlined() {
  return (
    <>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </>
  );
}
function GuruFilled() {
  return (
    <>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
    </>
  );
}

// Circle + vertical stem + horizontal crossbar (geometric Venus/beauty)
function ShukraOutlined() {
  return (
    <>
      <circle cx="12" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="12" y1="14.5" x2="12" y2="20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8.5" y1="18" x2="15.5" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}
function ShukraFilled() {
  return (
    <>
      <circle cx="12" cy="9" r="5.5" fill="currentColor" />
      <line x1="12" y1="14.5" x2="12" y2="20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8.5" y1="18" x2="15.5" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

// Planet circle + orbital ring (Saturn's rings — the defining visual)
function ShaniOutlined() {
  return (
    <>
      {/* Ring back arc */}
      <path d="M 2.5 12 A 9.5 3.5 0 0 0 21.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />
      {/* Planet */}
      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Ring front arc */}
      <path d="M 2.5 12 A 9.5 3.5 0 0 1 21.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </>
  );
}
function ShaniArcs() {
  // For filled variant we need the ring in front of filled circle
  // Use same approach but fill the planet first, then draw front ring
  return (
    <>
      <path d="M 2.5 12 A 9.5 3.5 0 0 0 21.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.25" />
      <circle cx="12" cy="12" r="5.5" fill="currentColor" />
      <path d="M 2.5 12 A 9.5 3.5 0 0 1 21.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </>
  );
}

// Omega arch with feet — ascending orbital node (Rahu)
function RahuOutlined() {
  return (
    <>
      {/* Omega arch — CCW from left to right = upward arch */}
      <path d="M 5 16 A 7 7 0 0 0 19 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <line x1="5" y1="16" x2="5" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="16" x2="19" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

// Comet — filled head with trailing wisps (Ketu: liberation, past karma)
function KetuOutlined() {
  return (
    <>
      <circle cx="12" cy="8.5" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="9" y1="12" x2="6.5" y2="18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="12" y1="12.5" x2="12" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="15" y1="12" x2="17.5" y2="18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </>
  );
}
function KetuFilled() {
  return (
    <>
      <circle cx="12" cy="8.5" r="4" fill="currentColor" />
      <line x1="9" y1="12" x2="6.5" y2="18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="12" y1="12.5" x2="12" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="15" y1="12" x2="17.5" y2="18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </>
  );
}

// ── Icon registry ─────────────────────────────────────────────────────────────

const ICONS: Record<GrahaId, { outlined: React.ReactNode; filled: React.ReactNode }> = {
  sun:     { outlined: <SuryaOutlined />,  filled: <SuryaFilled /> },
  moon:    { outlined: <ChandraOutlined />, filled: <ChandraFilled /> },
  mars:    { outlined: <MangalaOutlined />, filled: <MangalaFilled /> },
  mercury: { outlined: <BudhaOutlined />,  filled: <BudhaFilled /> },
  jupiter: { outlined: <GuruOutlined />,   filled: <GuruFilled /> },
  venus:   { outlined: <ShukraOutlined />, filled: <ShukraFilled /> },
  saturn:  { outlined: <ShaniOutlined />,  filled: <ShaniArcs /> },
  rahu:    { outlined: <RahuOutlined />,   filled: <RahuOutlined /> },
  ketu:    { outlined: <KetuOutlined />,   filled: <KetuFilled /> },
};

// Sanskrit names for aria-labels
const GRAHA_NAMES: Record<GrahaId, string> = {
  sun: "Surya/Sun", moon: "Chandra/Moon", mars: "Mangala/Mars",
  mercury: "Budha/Mercury", jupiter: "Guru/Jupiter", venus: "Shukra/Venus",
  saturn: "Shani/Saturn", rahu: "Rahu", ketu: "Ketu",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function GrahaIcon({
  graha,
  variant = "outlined",
  size = 24,
  className,
  style,
  title,
}: GrahaIconProps) {
  const icon = ICONS[graha];
  const label = title ?? GRAHA_NAMES[graha];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={label}
      role="img"
      className={className}
      style={style}
    >
      {variant === "outlined" ? icon.outlined : icon.filled}
    </svg>
  );
}
