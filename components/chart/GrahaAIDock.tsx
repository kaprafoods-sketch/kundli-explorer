"use client";

/**
 * GrahaAIDock — the single, unified GRAHA AI control.
 *
 * One floating button in the thumb zone opens a bottom sheet (phone) / floating
 * panel (desktop) offering two modes:
 *   • AI Astrologer — chart-grounded streamed chat (GrahaAIChat)
 *   • Astro Guru    — the educational KB browser (GrahaAI, embedded)
 *
 * Replaces the two previously-colliding controls (GrahaAILauncher + GrahaAI FAB).
 */

import { useState, useEffect } from "react";
import GrahaAIChat from "./GrahaAIChat";
import GrahaAI, { type ChartPlacements } from "@/components/GrahaAI";
import type { SuggestedQuestion } from "@/lib/suggestQuestions";
import { useLang } from "@/components/i18n/LanguageProvider";
import type { MessageKey } from "@/lib/i18n/messages";

type Mode = "astrologer" | "guru";

interface Props {
  chartId: string;
  placements: ChartPlacements;
  /** Onboarding life-area ids — rank the chat's cold-start chips. */
  interests?: string[];
  /** Server-ranked starter questions (merit-based). */
  suggested?: SuggestedQuestion[];
}

const MODES: { id: Mode; labelKey: MessageKey; subKey: MessageKey; glyph: string }[] = [
  { id: "astrologer", labelKey: "ai.astrologer", subKey: "ai.astrologerSub", glyph: "✦" },
  { id: "guru",       labelKey: "ai.guru",       subKey: "ai.guruSub",       glyph: "📖" },
];

export default function GrahaAIDock({ chartId, placements, interests, suggested }: Props) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("astrologer");

  // Lock background scroll while the sheet is open (phones).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <style>{`
        @keyframes dock-fab-pulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(0,0,0,0.45), 0 0 0 0 rgba(200,162,74,0.4); }
          50%      { box-shadow: 0 4px 24px rgba(0,0,0,0.45), 0 0 0 8px rgba(200,162,74,0); }
        }
        @keyframes dock-scrim-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dock-sheet-in { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .dock-fab { animation: none !important; }
          .dock-sheet, .dock-scrim { animation-duration: 0.01ms !important; }
        }
      `}</style>

      {/* Single FAB — thumb zone, safe-area aware */}
      {!open && (
        <button
          className="dock-fab press"
          onClick={() => setOpen(true)}
          aria-label="Open GRAHA AI"
          style={{
            position: "fixed",
            right: "max(20px, var(--safe-right))",
            /* Clear the fixed bottom tab bar on phones (~56px); on desktop the
               tabs are top-anchored so the FAB drops to the corner (CSS below). */
            bottom: "calc(84px + var(--safe-bottom))",
            zIndex: 62,
            display: "flex",
            alignItems: "center",
            gap: 8,
            minHeight: 52,
            padding: "0 20px",
            borderRadius: 999,
            background: "var(--brass)",
            color: "var(--bg)",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-ui), system-ui",
            fontSize: "0.95rem",
            fontWeight: 700,
            letterSpacing: "0.02em",
            boxShadow: "0 4px 24px rgba(0,0,0,0.45), 0 0 16px rgba(200,162,74,0.2)",
            animation: "dock-fab-pulse 2.6s ease-in-out infinite",
          }}
        >
          <span style={{ fontSize: "1.05rem" }}>✦</span>
          {t("ai.ask")}
        </button>
      )}

      {open && (
        <>
          {/* Scrim */}
          <div
            className="dock-scrim"
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 60,
              background: "rgba(3,6,14,0.6)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
              animation: "dock-scrim-in 200ms var(--ease-out, ease-out)",
            }}
          />

          {/* Sheet (phone: bottom sheet full-width; desktop: floating right panel) */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="GRAHA AI"
            className="dock-sheet"
            style={{
              position: "fixed",
              zIndex: 61,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              background: "var(--panel)",
              borderTop: "1px solid var(--faint)",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              height: "min(88vh, 720px)",
              paddingBottom: "var(--safe-bottom)",
              overflow: "hidden",
              boxShadow: "0 -12px 56px rgba(0,0,0,0.6)",
              animation: "dock-sheet-in 320ms cubic-bezier(0.05,0.7,0.1,1)",
            }}
          >
            {/* Grabber */}
            <div
              style={{
                width: 36, height: 4, borderRadius: 2,
                background: "var(--faint)", margin: "10px auto 6px",
                flexShrink: 0,
              }}
            />

            {/* Header: title + close */}
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "4px 16px 12px", flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--parchment)",
                  fontFamily: "var(--font-ui), system-ui",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <span style={{ color: "var(--brass)" }}>✦</span> {t("ai.title")}
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label={t("common.close")}
                className="press"
                style={{
                  background: "none", border: "none", color: "var(--muted)",
                  cursor: "pointer", fontSize: "1.4rem", lineHeight: 1,
                  minWidth: 44, minHeight: 44, borderRadius: 8,
                  display: "grid", placeItems: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Mode switcher (segmented control) */}
            <div
              className="screen-x"
              style={{ display: "flex", gap: 8, paddingBottom: 12, flexShrink: 0 }}
            >
              {MODES.map((m) => {
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    aria-pressed={active}
                    className="press"
                    style={{
                      flex: 1,
                      minHeight: 56,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      gap: 2,
                      padding: "8px 14px",
                      borderRadius: 12,
                      cursor: "pointer",
                      textAlign: "left",
                      background: active ? "var(--brass)" : "var(--panel-2)",
                      border: active ? "1px solid var(--brass)" : "1px solid var(--faint)",
                      color: active ? "var(--bg)" : "var(--parchment)",
                      transition: "background 0.18s var(--ease-out), color 0.18s var(--ease-out)",
                      fontFamily: "var(--font-ui), system-ui",
                    }}
                  >
                    <span style={{ fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <span aria-hidden>{m.glyph}</span> {t(m.labelKey)}
                    </span>
                    <span style={{ fontSize: "0.8rem", opacity: active ? 0.85 : 0.7 }}>{t(m.subKey)}</span>
                  </button>
                );
              })}
            </div>

            {/* Active mode body */}
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              {mode === "astrologer" ? (
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "0 16px 12px" }}>
                  <GrahaAIChat chartId={chartId} interests={interests} suggested={suggested} />
                </div>
              ) : (
                <GrahaAI chart={placements} embedded />
              )}
            </div>
          </div>
        </>
      )}

      {/* Desktop: drop the FAB to the corner + widen the sheet into a panel */}
      <style>{`
        @media (min-width: 1024px) {
          .dock-fab { bottom: calc(24px + var(--safe-bottom)) !important; }
          .dock-sheet {
            left: auto !important;
            right: 24px !important;
            bottom: 24px !important;
            width: 420px !important;
            height: min(78vh, 680px) !important;
            border-radius: 16px !important;
            border: 1px solid var(--faint) !important;
          }
          .dock-scrim { background: rgba(3,6,14,0.35) !important; }
        }
      `}</style>
    </>
  );
}
