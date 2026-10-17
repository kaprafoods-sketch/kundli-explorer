"use client";

/**
 * Error boundary for the 3D hero (SolarSystemHero).
 *
 * Root cause it guards: drei's `<Environment preset="night"/>` fetches
 * `dikhololo_night_1k.hdr` from the pmndrs CDN (raw.githack) at runtime.
 * When that fetch fails (CDN blocked/down), the error propagates through
 * Suspense and — with no boundary — takes down the whole page (white screen).
 *
 * With this boundary, the failure is contained to the hero layer: the page
 * content stays usable and a static, intentional-looking 2D night-sky
 * fallback (SVG starfield + stylized graha dots) replaces the 3D scene.
 * The 3D hero is untouched and keeps working whenever the CDN is healthy.
 */

import { Component, useMemo, type ErrorInfo, type ReactNode } from "react";
import { GRAHA_COLORS, type GrahaColorKey } from "@/lib/grahaColors";

// ── Deterministic PRNG (stable stars across renders, no hydration drift) ─────

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Static fallback: stylized night-sky hero (no WebGL, no network) ──────────

const STAR_COLORS = ["#E2E8F4", "#C5CEDF", "#8B96B2", "#E6C56A"];

// Mirror of the 3D scene's graha layout: orbit radii in viewBox units (0–100).
const FALLBACK_GRAHAS: Array<{ key: GrahaColorKey; orbit: number }> = [
  { key: "sun",     orbit: 0 },
  { key: "moon",    orbit: 8 },
  { key: "mercury", orbit: 11 },
  { key: "venus",   orbit: 14 },
  { key: "mars",    orbit: 17.5 },
  { key: "rahu",    orbit: 21 },
  { key: "ketu",    orbit: 21 },
  { key: "jupiter", orbit: 26 },
  { key: "saturn",  orbit: 32 },
];

function SolarSystemFallback() {
  const { stars, grahas } = useMemo(() => {
    const rand = mulberry32(20261017);
    const stars = Array.from({ length: 150 }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      r: 0.12 + rand() * 0.3,
      color: STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)],
      delay: rand() * 6,
      duration: 2.5 + rand() * 4,
      opacity: 0.35 + rand() * 0.6,
    }));
    const grahas = FALLBACK_GRAHAS.map(({ key, orbit }) => {
      const angle = rand() * Math.PI * 2 + (key === "ketu" ? Math.PI : 0);
      return {
        key,
        orbit,
        x: 50 + Math.cos(angle) * orbit,
        y: 50 + Math.sin(angle) * orbit * 0.82, // slight elliptical squash, like the 3D camera tilt
        r: key === "sun" ? 2.4 : key === "jupiter" ? 1.6 : key === "saturn" ? 1.5 : 1.1,
        color: GRAHA_COLORS[key].core,
      };
    });
    return { stars, grahas };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}
    >
      <style>{`
        @keyframes kexStarTwinkle {
          0%, 100% { opacity: 0.25; }
          50%      { opacity: 1; }
        }
        .kex-fallback-star { animation: kexStarTwinkle var(--tw, 4s) ease-in-out infinite; animation-delay: var(--td, 0s); }
        @media (prefers-reduced-motion: reduce) {
          .kex-fallback-star { animation: none; }
        }
      `}</style>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: "block" }}
      >
        <defs>
          <radialGradient id="kex-fb-bg" cx="50%" cy="46%" r="75%">
            <stop offset="0%" stopColor="#0A0F24" />
            <stop offset="55%" stopColor="#060B18" />
            <stop offset="100%" stopColor="#04070F" />
          </radialGradient>
          <radialGradient id="kex-fb-sunglow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C7A24C" stopOpacity="0.5" />
            <stop offset="45%" stopColor="#C7A24C" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#C7A24C" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="100" height="100" fill="url(#kex-fb-bg)" />

        {stars.map((s, i) => (
          <circle
            key={`s-${i}`}
            className="kex-fallback-star"
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={s.color}
            style={{ "--tw": `${s.duration}s`, "--td": `${s.delay}s`, opacity: s.opacity } as React.CSSProperties}
          />
        ))}

        {/* Sun glow */}
        <circle cx="50" cy="46" r="14" fill="url(#kex-fb-sunglow)" />

        {/* Orbit rings */}
        {FALLBACK_GRAHAS.filter((g) => g.orbit > 0).map((g) => (
          <ellipse
            key={`ring-${g.key}`}
            cx="50"
            cy="46"
            rx={g.orbit}
            ry={g.orbit * 0.82}
            fill="none"
            stroke="#C7A24C"
            strokeOpacity="0.14"
            strokeWidth="0.12"
          />
        ))}

        {/* Grahas */}
        {grahas.map((g) => (
          <g key={`g-${g.key}`}>
            {g.key === "sun" && <circle cx={g.x} cy={g.y - 4} r={g.r * 2.6} fill="#C7A24C" opacity="0.18" />}
            <circle cx={g.x} cy={g.y - 4} r={g.r} fill={g.color} />
            <circle cx={g.x} cy={g.y - 4} r={g.r} fill="#FFFFFF" opacity="0.25" />
            {g.key === "saturn" && (
              <ellipse
                cx={g.x}
                cy={g.y - 4}
                rx={g.r * 2.1}
                ry={g.r * 0.7}
                fill="none"
                stroke="#C7A24C"
                strokeOpacity="0.55"
                strokeWidth="0.22"
                transform={`rotate(-18 ${g.x} ${g.y - 4})`}
              />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── The boundary itself ─────────────────────────────────────────────────────

interface SolarSystemErrorBoundaryProps {
  children: ReactNode;
}

interface SolarSystemErrorBoundaryState {
  hasError: boolean;
}

export default class SolarSystemErrorBoundary extends Component<
  SolarSystemErrorBoundaryProps,
  SolarSystemErrorBoundaryState
> {
  constructor(props: SolarSystemErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SolarSystemErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Permanent instrumentation: log the failure; the page itself stays usable.
    // eslint-disable-next-line no-console
    console.error(
      "[SolarSystemHero] 3D scene failed to render (likely the pmndrs CDN HDR fetch); showing static fallback.",
      error,
      errorInfo
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <SolarSystemFallback />;
    }
    return this.props.children;
  }
}
