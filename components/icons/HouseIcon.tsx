"use client";

/**
 * GRAHA house icon family — 12 bhava icons.
 *
 * Same grid (24×24), stroke weight (1.5px), and corner-radius language
 * as GrahaIcon. Each icon represents the bhava's primary signification
 * drawn from the knowledge base (lib/kb.ts bhavas).
 *
 * Bhava → Signification → Visual concept:
 *   H1  Tanu     · Self / Identity       → diamond (lagna mark)
 *   H2  Dhana    · Wealth / Speech       → stacked bars
 *   H3  Sahaja   · Communication         → two connected nodes
 *   H4  Sukha    · Home / Mother         → gabled roof
 *   H5  Putra    · Creativity / Children → four-pointed spark
 *   H6  Shatru   · Service / Health      → cross in circle
 *   H7  Yuvati   · Partnership           → two interlocked circles
 *   H8  Mrityu   · Transformation        → spiral arc
 *   H9  Dharma   · Wisdom / Higher mind  → rising path arc
 *   H10 Karma    · Career / Status       → mountain peak
 *   H11 Labha    · Community / Gains     → three-node cluster
 *   H12 Vyaya    · Spirituality / Loss   → dissolving dots
 */

interface HouseIconProps {
  house: number; // 1–12
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const HOUSE_LABELS: Record<number, string> = {
  1: "H1 · Self", 2: "H2 · Wealth", 3: "H3 · Communication",
  4: "H4 · Home", 5: "H5 · Creativity", 6: "H6 · Service",
  7: "H7 · Partnership", 8: "H8 · Transformation", 9: "H9 · Wisdom",
  10: "H10 · Career", 11: "H11 · Community", 12: "H12 · Spirituality",
};

function H1() {
  // Diamond — the lagna mark
  return <polygon points="12,3 21,12 12,21 3,12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />;
}

function H2() {
  // Three horizontal bars (wealth/resources stacked)
  return (
    <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="5" y1="8" x2="19" y2="8" />
      <line x1="5" y1="12" x2="19" y2="12" />
      <line x1="5" y1="16" x2="19" y2="16" />
    </g>
  );
}

function H3() {
  // Two dots connected by an arc (communication / messenger path)
  return (
    <>
      <circle cx="5.5" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="18.5" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M 8 12 Q 12 6 16 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </>
  );
}

function H4() {
  // Gabled roof with base (home / shelter)
  return (
    <>
      <polyline points="2,14 12,5 22,14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <rect x="7" y="14" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </>
  );
}

function H5() {
  // Four-pointed star / spark (creativity)
  return (
    <path
      d="M 12 3 L 13.5 10.5 L 21 12 L 13.5 13.5 L 12 21 L 10.5 13.5 L 3 12 L 10.5 10.5 Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />
  );
}

function H6() {
  // Cross in circle (service / health)
  return (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

function H7() {
  // Two interlocked circles (partnership / union)
  return (
    <>
      <circle cx="8.5" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="15.5" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </>
  );
}

function H8() {
  // Inward spiral arc (transformation / depth)
  return (
    <path
      d="M 20 12 A 8 8 0 1 0 12 20 A 5 5 0 1 1 12 10 A 2.5 2.5 0 1 0 12 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
  );
}

function H9() {
  // Rising arc path (journey / higher wisdom / dharma)
  return (
    <>
      <path d="M 3 18 Q 8 8 12 6 Q 16 4 21 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <polyline points="17.5,5 21,8 18,11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  );
}

function H10() {
  // Mountain peak (career / summit / status)
  return (
    <>
      <polyline points="2,20 12,4 22,20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <line x1="2" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

function H11() {
  // Three connected dots in triangle (community / network / gains)
  return (
    <>
      <circle cx="12" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="5.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="18.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="10" y1="8.5" x2="7" y2="15.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <line x1="14" y1="8.5" x2="17" y2="15.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <line x1="8" y1="17.5" x2="16" y2="17.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    </>
  );
}

function H12() {
  // Dissolving dots — small to large, fading (spirituality / dissolution / release)
  return (
    <>
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="7.5" cy="12" r="2" fill="currentColor" opacity="0.65" />
      <circle cx="16.5" cy="12" r="2" fill="currentColor" opacity="0.65" />
      <circle cx="3.5" cy="12" r="2.5" fill="currentColor" opacity="0.35" />
      <circle cx="20.5" cy="12" r="2.5" fill="currentColor" opacity="0.35" />
    </>
  );
}

const HOUSE_ICONS: Record<number, React.ReactNode> = {
  1: <H1 />, 2: <H2 />, 3: <H3 />, 4: <H4 />,
  5: <H5 />, 6: <H6 />, 7: <H7 />, 8: <H8 />,
  9: <H9 />, 10: <H10 />, 11: <H11 />, 12: <H12 />,
};

export default function HouseIcon({ house, size = 24, className, style }: HouseIconProps) {
  const icon = HOUSE_ICONS[house];
  if (!icon) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={HOUSE_LABELS[house] ?? `House ${house}`}
      role="img"
      className={className}
      style={style}
    >
      {icon}
    </svg>
  );
}
