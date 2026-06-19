"use client";

/**
 * Logo — Graha brand mark system.
 *
 * Variants:
 *   icon       — mark only (nav, favicon, spinner)
 *   horizontal — mark + "Graha" + tagline side-by-side (default for header)
 *   lockup     — mark centered, "Graha" below, tagline beneath with gold rules
 *   wordmark   — "Graha" text only (+ optional tagline)
 *
 * Props:
 *   animated   — SMIL planets orbit + sun breathes (default true)
 *                auto-disabled when prefers-reduced-motion is set
 *   mono       — single-colour gold version; no gradients (tight placements)
 *   size       — px height of the mark; text scales relative
 *   title      — accessible name
 */

import { useId, useEffect, useRef } from "react";

export interface LogoProps {
  variant?: "icon" | "horizontal" | "lockup" | "wordmark";
  size?: number;
  animated?: boolean;
  mono?: boolean;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

// ── Mark SVG ─────────────────────────────────────────────────────────────────

function GrahaOrbit({
  uid,
  size,
  animated,
  mono,
  titleText,
  descId,
}: {
  uid: string;
  size: number;
  animated: boolean;
  mono: boolean;
  titleText: string;
  descId: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Pause when offscreen or reduced-motion
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const shouldAnimate = animated && !mq.matches;

    if (!shouldAnimate) {
      svg.pauseAnimations();
      return;
    }
    svg.unpauseAnimations();

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) svg.unpauseAnimations();
        else svg.pauseAnimations();
      },
      { threshold: 0 }
    );
    obs.observe(svg);

    const mqHandler = (e: MediaQueryListEvent) => {
      if (e.matches) svg.pauseAnimations();
      else svg.unpauseAnimations();
    };
    mq.addEventListener("change", mqHandler);

    return () => {
      obs.disconnect();
      mq.removeEventListener("change", mqHandler);
    };
  }, [animated]);

  const g = (id: string) => `${uid}-${id}`;

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-labelledby={`${g("title")} ${descId}`}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      style={{ display: "block", flexShrink: 0 }}
    >
      <title id={g("title")}>{titleText}</title>
      <desc id={descId}>A luminous golden sun with three planets orbiting on tilted rings.</desc>

      <defs>
        {!mono ? (
          <>
            <radialGradient id={g("gCore")} cx="38%" cy="34%" r="72%">
              <stop offset="0%" stopColor="#fff7df"/>
              <stop offset="46%" stopColor="#f3c75f"/>
              <stop offset="100%" stopColor="#c9892b"/>
            </radialGradient>
            <radialGradient id={g("gHalo")} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e9c46a" stopOpacity="0.55"/>
              <stop offset="55%" stopColor="#e9c46a" stopOpacity="0.13"/>
              <stop offset="100%" stopColor="#e9c46a" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id={g("pGlow")} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffe9a8" stopOpacity="0.5"/>
              <stop offset="55%" stopColor="#e9c46a" stopOpacity="0.16"/>
              <stop offset="100%" stopColor="#e9c46a" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id={g("pGold")} cx="35%" cy="32%" r="75%">
              <stop offset="0%" stopColor="#fff7df"/>
              <stop offset="55%" stopColor="#e9c46a"/>
              <stop offset="100%" stopColor="#9c6f24"/>
            </radialGradient>
            <radialGradient id={g("pPale")} cx="35%" cy="32%" r="75%">
              <stop offset="0%" stopColor="#ffffff"/>
              <stop offset="55%" stopColor="#cdd8ff"/>
              <stop offset="100%" stopColor="#8a97c8"/>
            </radialGradient>
            <radialGradient id={g("pAmber")} cx="35%" cy="32%" r="75%">
              <stop offset="0%" stopColor="#ffd9a0"/>
              <stop offset="55%" stopColor="#e0922f"/>
              <stop offset="100%" stopColor="#7d4d12"/>
            </radialGradient>
          </>
        ) : null}
      </defs>

      {/* ── Sun halo ── */}
      <circle cx="100" cy="100" r="38" fill={mono ? "#E9C46A" : `url(#${g("gHalo")})`} opacity={mono ? 0.18 : 1}>
        {animated && !mono && (
          <>
            <animate attributeName="opacity" values="0.7;1;0.7" dur="5s" repeatCount="indefinite"/>
            <animate attributeName="r" values="36;40;36" dur="5s" repeatCount="indefinite"/>
          </>
        )}
      </circle>

      {/* ── Orbit 1 (tilted −18°) ── */}
      <g transform="rotate(-18 100 100)">
        <path id={g("o1")} d="M34,100 a66,24 0 1,0 132,0 a66,24 0 1,0 -132,0"
          fill="none" stroke="#e9c46a" strokeOpacity="0.42" strokeWidth="1"/>
        <circle r="9" fill={mono ? "#E9C46A" : `url(#${g("pGlow")})`} opacity={mono ? 0.25 : 1}>
          <animateMotion dur="17s" repeatCount="indefinite" rotate="0">
            <mpath xlinkHref={`#${g("o1")}`}/>
          </animateMotion>
        </circle>
        <circle r="5" fill={mono ? "#E9C46A" : `url(#${g("pGold")})`}>
          <animateMotion dur="17s" repeatCount="indefinite" rotate="0">
            <mpath xlinkHref={`#${g("o1")}`}/>
          </animateMotion>
        </circle>
      </g>

      {/* ── Orbit 2 (tilted +52°) ── */}
      <g transform="rotate(52 100 100)">
        <path id={g("o2")} d="M42,100 a58,30 0 1,0 116,0 a58,30 0 1,0 -116,0"
          fill="none" stroke="#e9c46a" strokeOpacity="0.3" strokeWidth="1"/>
        <circle r="8" fill={mono ? "#E9C46A" : `url(#${g("pGlow")})`} opacity={mono ? 0.2 : 1}>
          <animateMotion dur="25s" begin="-7s" repeatCount="indefinite" rotate="0">
            <mpath xlinkHref={`#${g("o2")}`}/>
          </animateMotion>
        </circle>
        <circle r="4" fill={mono ? "#E9C46A" : `url(#${g("pPale")})`}>
          <animateMotion dur="25s" begin="-7s" repeatCount="indefinite" rotate="0">
            <mpath xlinkHref={`#${g("o2")}`}/>
          </animateMotion>
        </circle>
      </g>

      {/* ── Orbit 3 (tilted +108°) ── */}
      <g transform="rotate(108 100 100)">
        <path id={g("o3")} d="M50,100 a50,26 0 1,0 100,0 a50,26 0 1,0 -100,0"
          fill="none" stroke="#e9c46a" strokeOpacity="0.36" strokeWidth="1"/>
        <circle r="7" fill={mono ? "#E9C46A" : `url(#${g("pGlow")})`} opacity={mono ? 0.2 : 1}>
          <animateMotion dur="12s" begin="-3s" repeatCount="indefinite" rotate="0">
            <mpath xlinkHref={`#${g("o3")}`}/>
          </animateMotion>
        </circle>
        <circle r="3.6" fill={mono ? "#E9C46A" : `url(#${g("pAmber")})`}>
          <animateMotion dur="12s" begin="-3s" repeatCount="indefinite" rotate="0">
            <mpath xlinkHref={`#${g("o3")}`}/>
          </animateMotion>
        </circle>
      </g>

      {/* ── Corona ring ── */}
      <circle cx="100" cy="100" r="20" fill="none" stroke="#ffe9a8"
        strokeOpacity={mono ? 0.28 : 0.28} strokeWidth="1">
        {animated && !mono && (
          <animate attributeName="stroke-opacity" values="0.18;0.38;0.18" dur="5s" repeatCount="indefinite"/>
        )}
      </circle>

      {/* ── Sun core ── */}
      <circle cx="100" cy="100" r="15" fill={mono ? "#E9C46A" : `url(#${g("gCore")})`}>
        {animated && (
          <animate attributeName="r" values="14.5;15.8;14.5" dur="5s" repeatCount="indefinite"/>
        )}
      </circle>

      {/* ── Specular highlight (full colour only) ── */}
      {!mono && <circle cx="95" cy="95" r="4.6" fill="#fff7df" opacity="0.85"/>}
    </svg>
  );
}

// ── Wordmark ──────────────────────────────────────────────────────────────────

function Wordmark({ fontSize, mono }: { fontSize: number; mono: boolean }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-wordmark, Georgia, serif)",
        fontSize,
        letterSpacing: "0.05em",
        color: mono ? "var(--graha-gold, #E9C46A)" : "var(--parchment, #ECE7D7)",
        lineHeight: 1,
        fontWeight: 400,
      }}
    >
      Graha
    </span>
  );
}

function Tagline({ fontSize, mono }: { fontSize: number; mono: boolean }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-ui, system-ui, sans-serif)",
        fontSize,
        letterSpacing: "0.34em",
        textTransform: "uppercase" as const,
        color: mono ? "var(--graha-gold, #E9C46A)" : "var(--graha-gold, #E9C46A)",
        opacity: mono ? 0.7 : 0.8,
        lineHeight: 1,
        fontWeight: 400,
      }}
    >
      Read Your Universe
    </span>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export default function Logo({
  variant = "horizontal",
  size = 40,
  animated = true,
  mono = false,
  title = "Graha",
  className,
  style,
}: LogoProps) {
  const uid = useId().replace(/:/g, "");
  const descId = `${uid}-desc`;

  const mark = (markSize: number) => (
    <GrahaOrbit
      uid={uid}
      size={markSize}
      animated={animated}
      mono={mono}
      titleText={title}
      descId={descId}
    />
  );

  if (variant === "icon") {
    return (
      <span className={className} style={style} aria-label={title}>
        {mark(size)}
      </span>
    );
  }

  if (variant === "wordmark") {
    const fs = Math.round(size * 0.7);
    return (
      <span
        className={className}
        style={{ display: "inline-flex", flexDirection: "column", gap: Math.round(size * 0.12), alignItems: "flex-start", ...style }}
        aria-label={title}
      >
        <Wordmark fontSize={fs} mono={mono} />
        <Tagline fontSize={Math.round(fs * 0.38)} mono={mono} />
      </span>
    );
  }

  if (variant === "lockup") {
    const wordFs = Math.round(size * 0.55);
    const tagFs  = Math.round(size * 0.19);
    const ruleW  = Math.round(size * 0.9);

    return (
      <div
        className={className}
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: Math.round(size * 0.14),
          ...style,
        }}
        role="img"
        aria-label={title}
      >
        {mark(size)}
        <Wordmark fontSize={wordFs} mono={mono} />
        {/* Tagline with flanking rules */}
        <div style={{ display: "flex", alignItems: "center", gap: Math.round(size * 0.18) }}>
          <div style={{ width: ruleW / 2 - 4, height: 1, background: mono ? "var(--graha-gold,#E9C46A)" : "var(--graha-gold,#E9C46A)", opacity: 0.35 }} />
          <Tagline fontSize={tagFs} mono={mono} />
          <div style={{ width: ruleW / 2 - 4, height: 1, background: mono ? "var(--graha-gold,#E9C46A)" : "var(--graha-gold,#E9C46A)", opacity: 0.35 }} />
        </div>
      </div>
    );
  }

  // horizontal (default)
  const wordFs = Math.round(size * 0.55);
  const tagFs  = Math.round(size * 0.2);

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(size * 0.28),
        lineHeight: 1,
        ...style,
      }}
      role="img"
      aria-label={title}
    >
      {mark(size)}
      <span style={{ display: "flex", flexDirection: "column", gap: Math.round(size * 0.06) }}>
        <Wordmark fontSize={wordFs} mono={mono} />
        <Tagline fontSize={tagFs} mono={mono} />
      </span>
    </span>
  );
}
