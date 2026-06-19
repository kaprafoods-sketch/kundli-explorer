"use client";

/**
 * AnimatedIcon — premium CSS-animated SVG icons for the onboarding wizard.
 * Matches the brass/indigo celestial design system.
 * Respects prefers-reduced-motion: renders static first frame when motion is off.
 */

import { useEffect, useState } from "react";

type IconName = "sparkle" | "clock" | "globe" | "focus";

interface Props {
  name: IconName;
  size?: number;
  "aria-label"?: string;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

// ── Sparkle ───────────────────────────────────────────────────────────────────
function SparkleIcon({ size, reduced }: { size: number; reduced: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="sparkle-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F0CE7A" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#C8A24A" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#C8A24A" stopOpacity="0" />
        </radialGradient>
        <filter id="sparkle-blur">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {!reduced && (
          <style>{`
            @keyframes sparkle-pulse {
              0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
              50% { opacity: 0.75; transform: scale(0.92) rotate(15deg); }
            }
            @keyframes sparkle-twinkle-a {
              0%, 100% { opacity: 0.5; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1.2); }
            }
            @keyframes sparkle-twinkle-b {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.3; transform: scale(0.6); }
            }
            .sparkle-main { animation: sparkle-pulse 3.6s ease-in-out infinite; transform-origin: 24px 24px; }
            .sparkle-dot-a { animation: sparkle-twinkle-a 2.2s ease-in-out infinite 0.4s; transform-origin: 10px 10px; }
            .sparkle-dot-b { animation: sparkle-twinkle-b 2.8s ease-in-out infinite 1.1s; transform-origin: 38px 12px; }
            .sparkle-dot-c { animation: sparkle-twinkle-a 3.1s ease-in-out infinite 0.7s; transform-origin: 36px 36px; }
          `}</style>
        )}
      </defs>
      {/* Outer glow */}
      <circle cx="24" cy="24" r="20" fill="url(#sparkle-glow)" opacity="0.3" />
      {/* Main 4-pointed star */}
      <g className={reduced ? undefined : "sparkle-main"} filter="url(#sparkle-blur)">
        <path
          d="M24 6 L26.5 21.5 L42 24 L26.5 26.5 L24 42 L21.5 26.5 L6 24 L21.5 21.5 Z"
          fill="#F0CE7A"
          opacity="0.95"
        />
        {/* Bright center */}
        <circle cx="24" cy="24" r="3.5" fill="white" opacity="0.85" />
      </g>
      {/* Small accent dots */}
      <circle className={reduced ? undefined : "sparkle-dot-a"} cx="10" cy="10" r="2.2" fill="#C8A24A" opacity="0.7" />
      <circle className={reduced ? undefined : "sparkle-dot-b"} cx="38" cy="12" r="1.6" fill="#F0CE7A" opacity="0.85" />
      <circle className={reduced ? undefined : "sparkle-dot-c"} cx="36" cy="36" r="2" fill="#C8A24A" opacity="0.6" />
    </svg>
  );
}

// ── Clock ─────────────────────────────────────────────────────────────────────
function ClockIcon({ size, reduced }: { size: number; reduced: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="clock-face" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#2A3260" />
          <stop offset="100%" stopColor="#0E1430" />
        </radialGradient>
        <radialGradient id="clock-rim" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F0CE7A" />
          <stop offset="100%" stopColor="#8B6D1E" />
        </radialGradient>
        <filter id="clock-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.45" />
        </filter>
        {!reduced && (
          <style>{`
            @keyframes clock-minute {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
            @keyframes clock-hour {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
            @keyframes clock-float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-2px); }
            }
            .clock-body { animation: clock-float 4s ease-in-out infinite; }
            .clock-minute-hand { animation: clock-minute 8s linear infinite; transform-origin: 24px 24px; }
            .clock-hour-hand { animation: clock-hour 96s linear infinite; transform-origin: 24px 24px; }
          `}</style>
        )}
      </defs>
      <g className={reduced ? undefined : "clock-body"} filter="url(#clock-shadow)">
        {/* Outer rim */}
        <circle cx="24" cy="24" r="19" fill="url(#clock-rim)" />
        {/* 3D highlight on rim */}
        <circle cx="19" cy="17" r="4" fill="white" opacity="0.12" />
        {/* Clock face */}
        <circle cx="24" cy="24" r="16.5" fill="url(#clock-face)" />
        {/* Hour marks */}
        {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const r1 = i % 3 === 0 ? 12 : 13;
          const r2 = 15.5;
          const round = (n: number) => Math.round(n * 1e4) / 1e4;
          return (
            <line
              key={i}
              x1={round(24 + r1 * Math.cos(angle))}
              y1={round(24 + r1 * Math.sin(angle))}
              x2={round(24 + r2 * Math.cos(angle))}
              y2={round(24 + r2 * Math.sin(angle))}
              stroke={i % 3 === 0 ? "#F0CE7A" : "#C8A24A"}
              strokeWidth={i % 3 === 0 ? 1.8 : 1}
              strokeLinecap="round"
              opacity={i % 3 === 0 ? 0.9 : 0.5}
            />
          );
        })}
        {/* Hour hand */}
        <line
          className={reduced ? undefined : "clock-hour-hand"}
          x1="24" y1="24" x2="24" y2="15"
          stroke="#F0CE7A" strokeWidth="2.2" strokeLinecap="round"
          opacity="0.9"
        />
        {/* Minute hand */}
        <line
          className={reduced ? undefined : "clock-minute-hand"}
          x1="24" y1="24" x2="24" y2="11"
          stroke="#ECE7D7" strokeWidth="1.5" strokeLinecap="round"
          opacity="0.95"
        />
        {/* Center cap */}
        <circle cx="24" cy="24" r="2.2" fill="#F0CE7A" />
        <circle cx="24" cy="24" r="1" fill="white" opacity="0.8" />
      </g>
    </svg>
  );
}

// ── Globe ─────────────────────────────────────────────────────────────────────
function GlobeIcon({ size, reduced }: { size: number; reduced: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="globe-bg" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#3A5BA0" />
          <stop offset="55%" stopColor="#1A2E6A" />
          <stop offset="100%" stopColor="#0A1240" />
        </radialGradient>
        <radialGradient id="globe-highlight" cx="32%" cy="25%" r="45%">
          <stop offset="0%" stopColor="white" stopOpacity="0.22" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <clipPath id="globe-clip">
          <circle cx="24" cy="24" r="18" />
        </clipPath>
        <filter id="globe-shadow">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
        </filter>
        {!reduced && (
          <style>{`
            @keyframes globe-spin {
              from { transform: translateX(0px); }
              to   { transform: translateX(-96px); }
            }
            @keyframes globe-float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-2px) rotate(2deg); }
            }
            .globe-body { animation: globe-float 5s ease-in-out infinite; }
            .globe-lines { animation: globe-spin 12s linear infinite; }
          `}</style>
        )}
      </defs>
      <g className={reduced ? undefined : "globe-body"} filter="url(#globe-shadow)">
        {/* Globe base */}
        <circle cx="24" cy="24" r="18" fill="url(#globe-bg)" />
        {/* Latitude / longitude lines */}
        <g clipPath="url(#globe-clip)">
          <g className={reduced ? undefined : "globe-lines"}>
            {/* Repeated meridians for seamless scroll illusion */}
            {[-96,-72,-48,-24,0,24,48,72,96].map((x) => (
              <ellipse
                key={x}
                cx={24 + x} cy="24" rx="10" ry="18"
                stroke="#C8A24A" strokeWidth="0.7" fill="none" opacity="0.35"
              />
            ))}
            {/* Parallels */}
            {[-12,-6,0,6,12].map((dy) => (
              <ellipse key={dy} cx="24" cy={24 + dy} rx="18" ry={Math.max(1, 5 - Math.abs(dy * 0.3))}
                stroke="#C8A24A" strokeWidth="0.6" fill="none" opacity="0.3" />
            ))}
            {/* Land masses (simplified blobs) */}
            {[0, 48, 96].map((ox) => (
              <g key={ox}>
                <ellipse cx={18 + ox} cy="20" rx="5" ry="4" fill="#2A6A3A" opacity="0.65" />
                <ellipse cx={30 + ox} cy="26" rx="4" ry="3" fill="#2A6A3A" opacity="0.55" />
                <ellipse cx={8 + ox} cy="28" rx="3" ry="2.5" fill="#3A7A4A" opacity="0.5" />
              </g>
            ))}
          </g>
        </g>
        {/* Rim */}
        <circle cx="24" cy="24" r="18" stroke="#C8A24A" strokeWidth="1.5" fill="none" opacity="0.6" />
        {/* Specular highlight */}
        <circle cx="24" cy="24" r="18" fill="url(#globe-highlight)" />
        {/* Bright spot */}
        <ellipse cx="18" cy="18" rx="4" ry="3" fill="white" opacity="0.12" />
        {/* Pin dot */}
        <circle cx="24" cy="24" r="2.5" fill="#F0CE7A" opacity="0.9" />
        <circle cx="24" cy="24" r="1.2" fill="white" opacity="0.8" />
      </g>
    </svg>
  );
}

// ── Focus / gem star ──────────────────────────────────────────────────────────
function FocusIcon({ size, reduced }: { size: number; reduced: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="focus-gem" cx="38%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="50%" stopColor="#6D3FA0" />
          <stop offset="100%" stopColor="#2D1A5A" />
        </radialGradient>
        <radialGradient id="focus-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
        </radialGradient>
        <filter id="focus-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6D3FA0" floodOpacity="0.6" />
        </filter>
        {!reduced && (
          <style>{`
            @keyframes focus-rotate {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
            @keyframes focus-glow-pulse {
              0%, 100% { opacity: 0.5; r: 18; }
              50% { opacity: 0.9; r: 22; }
            }
            @keyframes focus-float {
              0%, 100% { transform: translateY(0px) scale(1); }
              50% { transform: translateY(-2.5px) scale(1.04); }
            }
            .focus-body { animation: focus-float 4.2s ease-in-out infinite; }
            .focus-orbit { animation: focus-rotate 6s linear infinite; transform-origin: 24px 24px; }
          `}</style>
        )}
      </defs>
      {/* Outer glow ring */}
      <circle cx="24" cy="24" r="20" fill="url(#focus-glow)" opacity="0.6" />
      <g className={reduced ? undefined : "focus-body"} filter="url(#focus-shadow)">
        {/* Diamond gem shape */}
        <path
          d="M24 8 L34 20 L24 40 L14 20 Z"
          fill="url(#focus-gem)"
        />
        {/* Facet lines */}
        <line x1="14" y1="20" x2="34" y2="20" stroke="white" strokeWidth="0.8" opacity="0.3" />
        <line x1="24" y1="8" x2="14" y2="20" stroke="white" strokeWidth="0.8" opacity="0.25" />
        <line x1="24" y1="8" x2="34" y2="20" stroke="white" strokeWidth="0.8" opacity="0.2" />
        <line x1="24" y1="8" x2="24" y2="40" stroke="white" strokeWidth="0.6" opacity="0.15" />
        {/* Specular highlight */}
        <path d="M24 8 L29 17 L24 15 Z" fill="white" opacity="0.35" />
        {/* Orbiting sparkle dot */}
        <g className={reduced ? undefined : "focus-orbit"}>
          <circle cx="40" cy="24" r="2.5" fill="#F0CE7A" opacity="0.9" />
        </g>
        {/* Small static stars */}
        <circle cx="10" cy="14" r="1.5" fill="#C8A24A" opacity="0.6" />
        <circle cx="37" cy="36" r="1.2" fill="#A78BFA" opacity="0.7" />
      </g>
    </svg>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export default function AnimatedIcon({ name, size = 48, "aria-label": ariaLabel }: Props) {
  const reduced = useReducedMotion();

  const label = ariaLabel ?? name.charAt(0).toUpperCase() + name.slice(1);

  const icon = (() => {
    switch (name) {
      case "sparkle": return <SparkleIcon size={size} reduced={reduced} />;
      case "clock":   return <ClockIcon   size={size} reduced={reduced} />;
      case "globe":   return <GlobeIcon   size={size} reduced={reduced} />;
      case "focus":   return <FocusIcon   size={size} reduced={reduced} />;
    }
  })();

  return (
    <span
      role="img"
      aria-label={label}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 0 }}
    >
      {icon}
    </span>
  );
}
