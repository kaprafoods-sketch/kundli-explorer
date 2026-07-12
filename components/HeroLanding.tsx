"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import BirthForm from "@/components/BirthForm";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import ProfilesGrid from "@/components/ProfilesGrid";
import type { ChartRow } from "@/lib/supabase";

const ClientSolarSystem = dynamic(() => import("@/components/ClientSolarSystem"), { ssr: false });

// ── Control pill ──────────────────────────────────────────────────────────────

function OrbitControls({
  paused,
  speed,
  onTogglePause,
  onSpeed,
  onReset,
}: {
  paused: boolean;
  speed: number;
  onTogglePause: () => void;
  onSpeed: (v: number) => void;
  onReset: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 999,
        background: "rgba(11,16,38,.72)",
        border: "1px solid rgba(199,162,76,.2)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      {/* Pause / play */}
      <button
        onClick={onTogglePause}
        aria-label={paused ? "Resume orbit" : "Pause orbit"}
        style={{
          flexShrink: 0,
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: "1px solid rgba(199,162,76,.35)",
          background: "rgba(199,162,76,.1)",
          color: "var(--brass-bright)",
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {paused ? "▶" : "❚❚"}
      </button>

      {/* Speed slider */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "9.5px",
            fontFamily: "var(--font-mono)",
            letterSpacing: ".08em",
            color: "var(--muted)",
          }}
        >
          <span>ORBIT SPEED</span>
          <span style={{ color: "var(--brass)" }}>{speed.toFixed(1)}×</span>
        </div>
        <input
          type="range"
          min={0.2}
          max={3}
          step={0.1}
          value={speed}
          onChange={(e) => onSpeed(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "#C7A24C", height: 3, cursor: "pointer" }}
          aria-label="Orbit speed"
        />
      </div>

      {/* Reset view */}
      <button
        onClick={onReset}
        aria-label="Reset orbit speed"
        style={{
          flexShrink: 0,
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: "1px solid rgba(139,150,178,.25)",
          background: "rgba(139,150,178,.08)",
          color: "var(--sand)",
          fontSize: 15,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ⟳
      </button>
    </div>
  );
}

// ── Birth form overlay ────────────────────────────────────────────────────────

function FormOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 12,
        background: "linear-gradient(180deg, rgba(9,13,28,.9) 0%, rgba(6,11,24,.98) 40%)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        display: "flex",
        flexDirection: "column",
        animation: "gr-sheetIn .32s cubic-bezier(0.16,1,0.3,1)",
        overflowY: "auto",
      }}
    >
      <style>{`
        @keyframes gr-sheetIn {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Back button row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "calc(16px + var(--safe-top, 0px)) 22px 8px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Back to solar system"
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: 11,
            border: "1px solid rgba(255,255,255,.1)",
            background: "rgba(255,255,255,.04)",
            color: "var(--sand)",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          ←
        </button>
        <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontFamily: "var(--font-mono)", letterSpacing: ".08em" }}>
          New Kundli
        </span>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 0 32px" }}>
        <BirthForm />
      </div>
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function HeroLanding({ profiles }: { profiles: ChartRow[] }) {
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const togglePause = useCallback(() => setPaused((p) => !p), []);
  const handleSpeed = useCallback((v: number) => setSpeed(v), []);
  const handleReset = useCallback(() => { setSpeed(1); setPaused(false); }, []);

  return (
    <main
      style={{
        position: "relative",
        minHeight: "100dvh",
        background: "var(--ink)",
        overflow: "hidden",
      }}
    >
      {/* ── 3D solar system ── */}
      <div
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: showForm ? "none" : "auto" }}
      >
        <ClientSolarSystem paused={paused || showForm} speed={speed} />
      </div>

      {/* ── Hero overlay ── */}
      {!showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 5,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Language switcher */}
          <div
            style={{
              position: "absolute",
              top: "calc(12px + var(--safe-top, 0px))",
              right: "max(12px, var(--safe-right, 0px))",
              zIndex: 10,
              pointerEvents: "auto",
            }}
          >
            <LanguageSwitcher withLabel={false} compact />
          </div>

          {/* Brand — top center */}
          <div
            style={{
              padding: "calc(52px + var(--safe-top, 0px)) 26px 0",
              pointerEvents: "none",
              textAlign: "center",
            }}
          >
            <div style={{ display: "inline-flex", justifyContent: "center" }}>
              <Logo
                variant="lockup"
                size={72}
                animated
                style={{ filter: "drop-shadow(0 2px 24px rgba(6,11,24,0.9))" }}
              />
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Bottom stack */}
          <div
            style={{
              padding: "0 22px calc(28px + var(--safe-bottom, 0px))",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              pointerEvents: "auto",
            }}
          >
            <p
              style={{
                margin: 0,
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "10.5px",
                letterSpacing: ".16em",
                textTransform: "uppercase",
                color: "var(--muted)",
                textShadow: "0 1px 8px var(--ink)",
                pointerEvents: "none",
              }}
            >
              Tap a graha · drag to orbit
            </p>

            {/* Control pill */}
            <OrbitControls
              paused={paused}
              speed={speed}
              onTogglePause={togglePause}
              onSpeed={handleSpeed}
              onReset={handleReset}
            />

            {/* Welcome-back chips */}
            {profiles.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: "0.78rem", color: "var(--brass)" }}>✦ Welcome back —</span>
                {profiles.slice(0, 3).map((p) => (
                  <a
                    key={p.id}
                    href={`/chart/${p.id}`}
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--parchment)",
                      textDecoration: "none",
                      background: "rgba(200,162,74,0.1)",
                      border: "1px solid rgba(200,162,74,0.25)",
                      borderRadius: 6,
                      padding: "3px 10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.name}
                  </a>
                ))}
                {profiles.length > 3 && (
                  <a href="#my-kundlis" style={{ fontSize: "0.78rem", color: "var(--brass)", textDecoration: "none", padding: "3px 6px" }}>
                    +{profiles.length - 3} more
                  </a>
                )}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={() => setShowForm(true)}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                borderRadius: 16,
                background: "linear-gradient(135deg, var(--brass) 0%, #E8B84B 100%)",
                color: "#0A1020",
                fontFamily: "var(--font-ui)",
                fontSize: "15.5px",
                fontWeight: 700,
                letterSpacing: ".02em",
                cursor: "pointer",
                boxShadow: "0 8px 30px rgba(199,162,76,.32)",
              }}
            >
              Begin your kundli  ✦
            </button>

            <p style={{ margin: 0, textAlign: "center", fontSize: "11px", color: "var(--faint)" }}>
              Curious how it looks?{" "}
              <Link
                href="/chart/sample"
                style={{ color: "var(--brass)", textDecoration: "none", fontWeight: 600 }}
              >
                See a sample →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* ── Birth form overlay ── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 12 }}>
          <FormOverlay onClose={() => setShowForm(false)} />
        </div>
      )}

      {/* ── Saved kundlis — below fold ── */}
      {profiles.length > 0 && !showForm && (
        <section
          id="my-kundlis"
          style={{
            position: "relative",
            zIndex: 10,
            marginTop: "100dvh",
            padding: "48px 16px 64px",
            background: "rgba(10,15,36,0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div style={{ maxWidth: 1024, margin: "0 auto" }}>
            <ProfilesGrid initialProfiles={profiles} />
          </div>
        </section>
      )}
    </main>
  );
}
