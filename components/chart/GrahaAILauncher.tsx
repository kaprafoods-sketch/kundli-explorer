"use client";

import { useState } from "react";
import GrahaAIChat from "./GrahaAIChat";

interface Props {
  chartId: string;
}

export default function GrahaAILauncher({ chartId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open GRAHA AI"
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 18px",
            borderRadius: 999,
            background: "var(--brass)",
            color: "var(--bg)",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-ui), system-ui",
            fontSize: "0.85rem",
            fontWeight: 700,
            boxShadow: "0 4px 24px rgba(0,0,0,0.45), 0 0 16px rgba(200,162,74,0.2)",
            letterSpacing: "0.03em",
          }}
        >
          <span style={{ fontSize: "1rem" }}>✦</span>
          Ask GRAHA AI
        </button>
      )}

      {/* Slide-up panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 50,
            width: 400,
            maxWidth: "calc(100vw - 32px)",
            height: "70vh",
            maxHeight: 600,
            display: "flex",
            flexDirection: "column",
            background: "var(--panel)",
            border: "1px solid var(--faint)",
            borderRadius: 14,
            boxShadow: "0 8px 48px rgba(0,0,0,0.6), 0 0 24px rgba(200,162,74,0.1)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid var(--faint)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--brass)", fontSize: "1rem" }}>✦</span>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--parchment)",
                  fontFamily: "var(--font-ui), system-ui",
                }}
              >
                GRAHA AI
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close GRAHA AI"
              style={{
                background: "none",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                fontSize: "1.2rem",
                lineHeight: 1,
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              ×
            </button>
          </div>

          {/* Chat fills the rest — GrahaAIChat manages its own scroll + input */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "14px 16px" }}>
            <GrahaAIChat chartId={chartId} />
          </div>
        </div>
      )}
    </>
  );
}
