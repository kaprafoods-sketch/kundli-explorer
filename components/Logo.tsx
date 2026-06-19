"use client";

interface LogoProps {
  /** "full" = mark + wordmark + optional Sanskrit; "mark" = SVG only; "wordmark" = text only */
  variant?: "full" | "mark" | "wordmark";
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  showSanskrit?: boolean;
}

/**
 * GRAHA logo system.
 *
 * Mark: a planet (filled circle) with a split orbital arc — back arc dim,
 * front arc at full opacity. Works at 16px–128px. currentColor-driven.
 *
 * Construction (32×32 grid):
 *   Planet: cx=16 cy=13 r=6.5
 *   Orbit points: (4,18) and (28,18)
 *   Back arc: Q 16 10 — passes behind planet, opacity 0.22
 *   Front arc: Q 16 24.5 — curves below planet, opacity 0.75
 */
function GrahaMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Back arc — orbital path behind planet */}
      <path
        d="M 4 18 Q 16 10 28 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.22"
      />
      {/* Planet body */}
      <circle cx="16" cy="13" r="6.5" fill="currentColor" />
      {/* Front arc — orbital path in front of planet */}
      <path
        d="M 4 18 Q 16 24.5 28 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
    </svg>
  );
}

export default function Logo({
  variant = "full",
  size = 28,
  className,
  style,
  showSanskrit = false,
}: LogoProps) {
  if (variant === "mark") {
    return (
      <span className={className} style={style}>
        <GrahaMark size={size} />
      </span>
    );
  }

  if (variant === "wordmark") {
    return (
      <span
        className={className}
        style={{
          fontFamily: "var(--font-ui)",
          fontWeight: 700,
          fontSize: size,
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          lineHeight: 1,
          ...style,
        }}
      >
        GRAHA
      </span>
    );
  }

  // full: mark + wordmark + optional Sanskrit
  const markSize = Math.round(size * 1.15);
  const wordSize = Math.round(size * 0.9);

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(size * 0.3),
        lineHeight: 1,
        ...style,
      }}
    >
      <GrahaMark size={markSize} />
      <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontWeight: 700,
            fontSize: wordSize,
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            lineHeight: 1,
          }}
        >
          GRAHA
        </span>
        {showSanskrit && (
          <span
            style={{
              fontFamily: "var(--font-sanskrit)",
              fontSize: Math.round(wordSize * 0.65),
              color: "var(--brass)",
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}
          >
            ग्रह
          </span>
        )}
      </span>
    </span>
  );
}
