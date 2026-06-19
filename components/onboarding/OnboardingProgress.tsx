"use client";

const STEPS = [
  { icon: "☀️", label: "Date" },
  { icon: "🕒", label: "Time" },
  { icon: "🪐", label: "Place" },
];

interface Props {
  step: number; // 0-indexed
  total?: number;
}

export default function OnboardingProgress({ step, total = 3 }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {/* Planet icons + connecting track */}
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              {/* Planet dot */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    background: active
                      ? "rgba(200,162,74,0.15)"
                      : done
                      ? "rgba(200,162,74,0.08)"
                      : "rgba(255,255,255,0.03)",
                    border: active
                      ? "1.5px solid rgba(200,162,74,0.6)"
                      : done
                      ? "1.5px solid rgba(200,162,74,0.3)"
                      : "1.5px solid rgba(255,255,255,0.08)",
                    transition: "all 0.3s ease",
                    boxShadow: active ? "0 0 14px rgba(200,162,74,0.25)" : "none",
                  }}
                >
                  {done ? (
                    <span style={{ fontSize: 14, color: "var(--brass)" }}>✓</span>
                  ) : (
                    s.icon
                  )}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "var(--font-ui, system-ui)",
                    fontWeight: active ? 700 : 400,
                    color: active
                      ? "var(--brass)"
                      : done
                      ? "rgba(142,151,184,0.7)"
                      : "rgba(142,151,184,0.35)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    transition: "color 0.3s ease",
                  }}
                >
                  {s.label}
                </span>
              </div>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    width: 48,
                    height: 2,
                    margin: "0 4px",
                    marginBottom: 18, // offset for label below
                    borderRadius: 2,
                    background: i < step
                      ? "rgba(200,162,74,0.5)"
                      : "rgba(255,255,255,0.07)",
                    transition: "background 0.4s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Animated fill when transitioning */}
                  {i === step - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(200,162,74,0.5)",
                        animation: "fillRight 0.4s ease forwards",
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step label */}
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: "rgba(142,151,184,0.45)",
          fontFamily: "var(--font-ui, system-ui)",
          letterSpacing: "0.05em",
        }}
      >
        Step {step + 1} of {total}
      </p>
    </div>
  );
}
