"use client";

/**
 * Route-level error boundary for the homepage segment (Next.js 16 file convention).
 *
 * Catches unexpected render errors anywhere in the route that escape the
 * component-level boundaries (e.g. the 3D hero's own SolarSystemErrorBoundary)
 * and shows a graceful fallback in the app's dark aesthetic instead of a
 * white screen. `unstable_retry` re-renders the segment, which recovers from
 * transient failures such as a flaky CDN fetch.
 *
 * Self-contained inline styles: this must render even if the layout or global
 * CSS failed to load. Palette mirrors BRAND.md tokens.
 */

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[app/error] Uncaught route error:", error);
  }, [error]);

  return (
    <main
      role="alert"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background:
          "radial-gradient(ellipse 80% 60% at 50% 40%, #0A0F24 0%, #060B18 70%)",
        color: "#E2E8F4",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          textAlign: "center",
          background: "rgba(10,16,32,0.92)",
          border: "1px solid rgba(199,162,76,0.28)",
          borderRadius: 14,
          padding: "2.5rem 2rem",
        }}
      >
        <div style={{ fontSize: "2.5rem", lineHeight: 1 }} aria-hidden="true">
          ☉
        </div>
        <h1
          style={{
            margin: "1rem 0 0.5rem",
            fontSize: "1.5rem",
            fontFamily: "Georgia, serif",
            letterSpacing: "0.02em",
            color: "#ECE7D7",
          }}
        >
          Something went wrong
        </h1>
        <p style={{ color: "#8B96B2", fontSize: "0.95rem", lineHeight: 1.6 }}>
          The page couldn&apos;t be displayed. Your saved charts are safe —
          this is a display error, not a data loss.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          style={{
            marginTop: "1.5rem",
            padding: "0.7rem 2rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "#060B18",
            background: "#C7A24C",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
