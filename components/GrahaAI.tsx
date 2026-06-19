"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  kb,
  GRAHA_IDS,
  SIGN_NAMES,
  GRAHA_GLYPHS,
  type GrahaId,
  type SignId,
} from "@/lib/kb";
import { GRAHA_COLORS } from "@/lib/grahaColors";
import {
  computeDignity,
  computeAspects,
  composeReading,
} from "@/lib/engine";
import {
  LIFE_AREA_IDS,
  resolveLifeArea,
  type LifeAreaId,
} from "@/lib/lifeAreas";

// ── Exported types ────────────────────────────────────────────────────────────

export interface ChartPlacements {
  [planetId: string]: { house: number; signId: SignId };
}

// ── Internal types ────────────────────────────────────────────────────────────

type View =
  | { kind: "home" }
  | { kind: "lifeArea"; id: LifeAreaId }
  | { kind: "lesson"; target: LessonTarget }
  | { kind: "search" };

type LessonTarget =
  | { kind: "planet"; id: GrahaId }
  | { kind: "house"; id: number }
  | { kind: "sign"; id: SignId };

type BottomTab = "topics" | "planets" | "houses" | "signs";

interface Props {
  chart?: ChartPlacements;
}

// ── Atom card ────────────────────────────────────────────────────────────────

interface AtomCardProps {
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

function AtomCard({ onClick, children, style }: AtomCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--panel-2)",
        border: `1px solid ${hovered ? "var(--brass)" : "var(--faint)"}`,
        borderRadius: 8,
        padding: "10px 12px",
        cursor: "pointer",
        transition: "border-color 0.15s",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Keyword chip ─────────────────────────────────────────────────────────────

function Chip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        background: "var(--panel-2)",
        border: "1px solid var(--faint)",
        fontSize: "0.72rem",
        color: "var(--muted)",
        marginRight: 4,
        marginBottom: 4,
      }}
    >
      {label}
    </span>
  );
}

// ── Strength bar ─────────────────────────────────────────────────────────────

function StrengthBar({ strength, dignityKey }: { strength: number; dignityKey: string }) {
  let color = "var(--brass)";
  if (dignityKey === "exalted" || dignityKey === "moolatrikona") color = "#2FA06B";
  if (dignityKey === "debilitated") color = "#D8453E";

  return (
    <div
      style={{
        height: 4,
        borderRadius: 2,
        background: "var(--faint)",
        marginTop: 6,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.round(strength * 100)}%`,
          background: color,
          borderRadius: 2,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

// ── HOME view ─────────────────────────────────────────────────────────────────

const HOME_AREAS: LifeAreaId[] = [
  "love",
  "career",
  "health",
  "money",
  "personality",
];

interface HomeViewProps {
  onArea: (id: LifeAreaId) => void;
  onTab: (tab: BottomTab) => void;
}

function HomeView({ onArea, onTab }: HomeViewProps) {
  const areas = useMemo(
    () => HOME_AREAS.map((id) => resolveLifeArea(id)),
    []
  );

  return (
    <div style={{ padding: "16px 14px" }}>
      <p
        style={{
          fontSize: "1.05rem",
          fontFamily: "var(--font-display, serif)",
          color: "var(--parchment)",
          marginBottom: 4,
        }}
      >
        Your chart, in plain words.
      </p>
      <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 16 }}>
        Tap a life area or browse the building blocks below.
      </p>

      {/* Life-area chips */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
          marginBottom: 20,
        }}
      >
        {areas.map((area) => (
          <button
            key={area.id}
            onClick={() => onArea(area.id)}
            style={{
              flexShrink: 0,
              padding: "7px 14px",
              borderRadius: 999,
              border: "1px solid var(--brass)",
              background: "transparent",
              color: "var(--brass-bright)",
              fontSize: "0.8rem",
              cursor: "pointer",
              fontFamily: "var(--font-ui, system-ui)",
              whiteSpace: "nowrap",
            }}
          >
            {area.emoji} {area.label}
          </button>
        ))}
      </div>

      {/* Building blocks */}
      <p
        style={{
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          color: "var(--muted)",
          marginBottom: 10,
        }}
      >
        Learn the building blocks
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        {(["planets", "houses", "signs"] as BottomTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => onTab(tab)}
            style={{
              flex: 1,
              padding: "9px 6px",
              borderRadius: 8,
              border: "1px solid var(--faint)",
              background: "var(--panel-2)",
              color: "var(--parchment)",
              fontSize: "0.8rem",
              cursor: "pointer",
              textTransform: "capitalize",
              fontFamily: "var(--font-ui, system-ui)",
            }}
          >
            {tab} →
          </button>
        ))}
      </div>
    </div>
  );
}

// ── LIFE-AREA view ────────────────────────────────────────────────────────────

interface LifeAreaViewProps {
  id: LifeAreaId;
  chart?: ChartPlacements;
  sanskrit: boolean;
  onBack: () => void;
  onLesson: (target: LessonTarget) => void;
}

function LifeAreaView({ id, chart, sanskrit, onBack, onLesson }: LifeAreaViewProps) {
  const area = useMemo(() => resolveLifeArea(id), [id]);

  return (
    <div style={{ padding: "14px 14px" }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "var(--brass-bright)",
          cursor: "pointer",
          fontSize: "0.82rem",
          padding: 0,
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        ← {area.label}
      </button>

      {/* Why callout */}
      <div
        style={{
          border: "1px solid var(--brass)",
          borderRadius: 8,
          padding: "10px 12px",
          marginBottom: 16,
          fontSize: "0.8rem",
          color: "var(--muted)",
          lineHeight: 1.55,
        }}
      >
        <span style={{ color: "var(--brass)", fontWeight: 600 }}>
          {area.label} in Jyotish:
        </span>{" "}
        {area.why}
      </div>

      {/* Planets */}
      <SectionLabel>Planets that govern this</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {area.planets.map((pId) => {
          const g = kb.grahas[pId];
          const placement = chart?.[pId];
          const name = sanskrit ? `${g.sanskrit}/${g.en}` : g.en;
          return (
            <AtomCard key={pId} onClick={() => onLesson({ kind: "planet", id: pId })}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: "1.1rem",
                    color: GRAHA_COLORS[pId as keyof typeof GRAHA_COLORS]?.core ?? "var(--brass)",
                    minWidth: 20,
                  }}
                >
                  {GRAHA_GLYPHS[pId]}
                </span>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--parchment)", fontWeight: 600 }}>
                    {name}
                  </div>
                  {placement && (
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 1 }}>
                      Your {g.en}: House {placement.house},{" "}
                      {kb.rashis[placement.signId]?.en ?? placement.signId}
                    </div>
                  )}
                </div>
              </div>
            </AtomCard>
          );
        })}
      </div>

      {/* Houses */}
      <SectionLabel>Houses that shape this</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {area.houses.map((h) => {
          const bhava = kb.bhavas[String(h)];
          // Find sign in this house from chart
          const signInHouse = chart
            ? Object.values(chart).find((p) => p.house === h)?.signId
            : undefined;
          return (
            <AtomCard key={h} onClick={() => onLesson({ kind: "house", id: h })}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontFamily: "var(--font-display, serif)",
                    fontSize: "1.1rem",
                    color: "var(--brass)",
                    minWidth: 24,
                  }}
                >
                  {h}
                </span>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--parchment)", fontWeight: 600 }}>
                    {bhava.en}
                  </div>
                  {signInHouse && (
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 1 }}>
                      {kb.rashis[signInHouse]?.en ?? signInHouse} in your chart
                    </div>
                  )}
                </div>
              </div>
            </AtomCard>
          );
        })}
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--muted)", fontStyle: "italic", lineHeight: 1.5 }}>
        Once you recognise these pieces, you can read your own chart above.
      </p>
    </div>
  );
}

// ── LESSON — planet ───────────────────────────────────────────────────────────

interface PlanetLessonProps {
  id: GrahaId;
  chart?: ChartPlacements;
  sanskrit: boolean;
  onBack: () => void;
}

function PlanetLesson({ id, chart, sanskrit, onBack }: PlanetLessonProps) {
  const g = kb.grahas[id];
  const color = GRAHA_COLORS[id as keyof typeof GRAHA_COLORS]?.core ?? "var(--brass)";
  const placement = chart?.[id];

  const name = sanskrit ? `${g.en} / ${g.sanskrit}` : g.en;

  const exaltSign = kb.rashis[g.exaltation.sign];
  const debilSign = kb.rashis[g.debilitation.sign];
  const ownSigns = g.own_signs.map((s) => kb.rashis[s]?.en ?? s);

  const specialOffsets: number[] = kb.aspect_rules.special[id] ?? [];
  const hasSpecial = specialOffsets.length > 0;
  const specialAspects = placement
    ? computeAspects(id, placement.house)
    : null;

  let reading = null;
  if (placement) {
    reading = composeReading({
      planetId: id,
      house: placement.house,
      signId: placement.signId,
      level: 1,
    });
  }

  return (
    <div style={{ padding: "14px 14px" }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "var(--brass-bright)",
          cursor: "pointer",
          fontSize: "0.82rem",
          padding: 0,
          marginBottom: 12,
        }}
      >
        ← Back
      </button>

      {/* Glyph + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: "2.2rem", color, lineHeight: 1 }}>
          {GRAHA_GLYPHS[id]}
        </span>
        <div>
          <div
            style={{
              fontFamily: "var(--font-display, serif)",
              fontSize: "1.2rem",
              color: "var(--parchment)",
            }}
          >
            {name}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 }}>
            {g.nature === "malefic" ? "Tough teacher" : g.nature === "benefic" ? "Natural benefic" : "Conditional nature"}
          </div>
        </div>
      </div>

      {/* Karakas */}
      <p style={{ fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.55, marginBottom: 14 }}>
        {g.en} is the planet of{" "}
        <span style={{ color: "var(--parchment)" }}>
          {g.karaka_of.slice(0, 6).join(", ")}
        </span>
        .
      </p>

      {/* Malefic note */}
      {g.nature === "malefic" && (
        <div
          style={{
            border: "1px solid var(--faint)",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 14,
            fontSize: "0.78rem",
            color: "var(--muted)",
            lineHeight: 1.55,
          }}
        >
          <span style={{ color: "var(--brass)", fontWeight: 600 }}>Tough ≠ bad. </span>
          {g.en} tests through delay and restriction — and rewards those who persist.
          &apos;Malefic&apos; means it pushes, not punishes.
        </div>
      )}

      {/* Dignities */}
      <SectionLabel>Dignities</SectionLabel>
      <div style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.7, marginBottom: 14 }}>
        <div>
          Strongest in:{" "}
          <span style={{ color: "var(--parchment)" }}>
            {exaltSign?.en ?? g.exaltation.sign} (exalted)
          </span>
          {ownSigns.length > 0 && (
            <span>, {ownSigns.join(", ")} (own sign{ownSigns.length > 1 ? "s" : ""})</span>
          )}
        </div>
        <div>
          Weakest in:{" "}
          <span style={{ color: "var(--parchment)" }}>
            {debilSign?.en ?? g.debilitation.sign}
          </span>
        </div>
        {hasSpecial && (
          <div>
            Special aspects:{" "}
            <span style={{ color: "var(--parchment)" }}>
              Houses {specialOffsets.join(", ")} (in addition to the 7th)
            </span>
          </div>
        )}
      </div>

      {/* Personalized card */}
      {placement && reading && (
        <div
          style={{
            border: "1px solid var(--brass)",
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--brass)",
              marginBottom: 8,
            }}
          >
            Your {g.en}
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--parchment)", marginBottom: 6, fontWeight: 600 }}>
            House {placement.house} ({kb.bhavas[String(placement.house)]?.en}),{" "}
            {kb.rashis[placement.signId]?.en ?? placement.signId}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.55, marginBottom: 8 }}>
            {reading.summary}
          </p>
          <StrengthBar strength={reading.dignity.strength} dignityKey={reading.dignity.key} />
          <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: 4 }}>
            {reading.dignity.label}
          </div>
          {specialAspects && specialAspects.length > 0 && (
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 6 }}>
              Aspects houses: {specialAspects.join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── LESSON — house ────────────────────────────────────────────────────────────

interface HouseLessonProps {
  id: number;
  chart?: ChartPlacements;
  sanskrit: boolean;
  onBack: () => void;
}

function HouseLesson({ id, chart, sanskrit, onBack }: HouseLessonProps) {
  const bhava = kb.bhavas[String(id)];
  const houseClasses = bhava.class ?? [];

  const CLASS_PLAIN: Record<string, string> = {
    kendra:    "power seat — planets here gain strength to act",
    trikona:   "lucky house — sources of fortune and grace",
    dusthana:  "tough house — challenges that teach and temper",
    upachaya:  "grows with time — results improve as you mature",
    maraka:    "life-span house — significant in longevity readings",
    panapara:  "succedent — follows the power seats",
    apoklima:  "cadent — precedes the power seats",
  };

  const nk = bhava.natural_karaka;
  const nkList: string[] = Array.isArray(nk) ? nk : [nk];

  // Find planets in this house from chart
  const planetsInHouse = chart
    ? (Object.entries(chart)
        .filter(([, v]) => v.house === id)
        .map(([k]) => k as GrahaId))
    : [];

  // Sign in this house (infer from any planet placement)
  const signInHouse = chart
    ? Object.values(chart).find((p) => p.house === id)?.signId
    : undefined;

  const houseName = sanskrit
    ? `${bhava.en} (${bhava.sanskrit.join(" / ")})`
    : bhava.en;

  return (
    <div style={{ padding: "14px 14px" }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "var(--brass-bright)",
          cursor: "pointer",
          fontSize: "0.82rem",
          padding: 0,
          marginBottom: 12,
        }}
      >
        ← Back
      </button>

      {/* Number + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span
          style={{
            fontFamily: "var(--font-display, serif)",
            fontSize: "2.4rem",
            color: "var(--brass)",
            lineHeight: 1,
          }}
        >
          {id}
        </span>
        <div>
          <div
            style={{
              fontFamily: "var(--font-display, serif)",
              fontSize: "1.1rem",
              color: "var(--parchment)",
            }}
          >
            {houseName}
          </div>
        </div>
      </div>

      {/* House classes */}
      {houseClasses.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {houseClasses.map((cls) => (
            <div key={cls} style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 4 }}>
              <span style={{ color: "var(--brass-bright)", fontWeight: 600, textTransform: "capitalize" }}>
                {cls}
              </span>{" "}
              — {CLASS_PLAIN[cls] ?? ""}
            </div>
          ))}
        </div>
      )}

      {/* Signifies */}
      <SectionLabel>Signifies</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 14 }}>
        {bhava.signifies.map((s) => (
          <Chip key={s} label={s} />
        ))}
      </div>

      {/* Natural karaka */}
      <SectionLabel>Natural significator</SectionLabel>
      <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 14 }}>
        {nkList.map((k) => {
          const g = kb.grahas[k as GrahaId];
          return g ? `${g.en} (${GRAHA_GLYPHS[k as GrahaId]})` : k;
        }).join(", ")}
      </p>

      <p style={{ fontSize: "0.78rem", color: "var(--muted)", fontStyle: "italic", marginBottom: 16, lineHeight: 1.55 }}>
        Planets here gain strength to act on {bhava.en} themes.
      </p>

      {/* Personalized */}
      {chart && (
        <div
          style={{
            border: "1px solid var(--brass)",
            borderRadius: 8,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--brass)",
              marginBottom: 8,
            }}
          >
            In your chart
          </div>
          {signInHouse ? (
            <p style={{ fontSize: "0.82rem", color: "var(--parchment)", marginBottom: 8 }}>
              House {id} holds{" "}
              <strong>{kb.rashis[signInHouse]?.en ?? signInHouse}</strong>.
            </p>
          ) : (
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: 8 }}>
              No planets placed in House {id}.
            </p>
          )}
          {planetsInHouse.map((pId) => {
            const g = kb.grahas[pId];
            const placement = chart[pId];
            if (!placement) return null;
            const reading = composeReading({
              planetId: pId,
              house: id,
              signId: placement.signId,
              level: 1,
            });
            return (
              <div key={pId} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: "0.82rem", color: "var(--brass-bright)", fontWeight: 600, marginBottom: 2 }}>
                  {GRAHA_GLYPHS[pId]} {g.en} sits here
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.55 }}>
                  {reading.where} {reading.dignityLine}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── LESSON — sign ─────────────────────────────────────────────────────────────

interface SignLessonProps {
  id: SignId;
  chart?: ChartPlacements;
  sanskrit: boolean;
  onBack: () => void;
}

function SignLesson({ id, chart, sanskrit, onBack }: SignLessonProps) {
  const rashi = kb.rashis[id];
  const ruler = kb.grahas[rashi.ruler];

  const signName = sanskrit ? `${rashi.en} / ${rashi.sanskrit}` : rashi.en;

  // Planets in this sign from chart
  const planetsInSign = chart
    ? (Object.entries(chart)
        .filter(([, v]) => v.signId === id)
        .map(([k, v]) => ({ id: k as GrahaId, house: v.house })))
    : [];

  return (
    <div style={{ padding: "14px 14px" }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "var(--brass-bright)",
          cursor: "pointer",
          fontSize: "0.82rem",
          padding: 0,
          marginBottom: 12,
        }}
      >
        ← Back
      </button>

      {/* Symbol + name */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontFamily: "var(--font-display, serif)",
            fontSize: "1.3rem",
            color: "var(--parchment)",
          }}
        >
          {rashi.symbol}
        </div>
        <div
          style={{
            fontFamily: "var(--font-display, serif)",
            fontSize: "1.1rem",
            color: "var(--parchment)",
            marginTop: 2,
          }}
        >
          {signName}
        </div>
        {sanskrit && (
          <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 }}>
            Sanskrit: {rashi.sanskrit}
          </div>
        )}
      </div>

      {/* Ruler */}
      <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 10 }}>
        Ruler:{" "}
        <span style={{ color: "var(--parchment)" }}>
          {ruler ? `${ruler.en} (${GRAHA_GLYPHS[rashi.ruler]})` : rashi.ruler}
        </span>
      </div>

      {/* Element + Modality */}
      <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 14 }}>
        <span style={{ color: "var(--parchment)", textTransform: "capitalize" }}>
          {rashi.element}
        </span>
        {" · "}
        <span style={{ color: "var(--parchment)", textTransform: "capitalize" }}>
          {rashi.modality}
        </span>
      </div>

      {/* Keywords */}
      <SectionLabel>Keywords</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 14 }}>
        {rashi.keywords.map((k) => (
          <Chip key={k} label={k} />
        ))}
      </div>

      {/* Plain text */}
      <p style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.55, marginBottom: 16 }}>
        {rashi.en} adds{" "}
        <span style={{ color: "var(--parchment)" }}>
          {rashi.keywords.slice(0, 3).join(", ")}
        </span>{" "}
        flavor to any planet placed here.
      </p>

      {/* Personalized */}
      {planetsInSign.length > 0 && (
        <div
          style={{
            border: "1px solid var(--brass)",
            borderRadius: 8,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--brass)",
              marginBottom: 8,
            }}
          >
            In your chart
          </div>
          {planetsInSign.map(({ id: pId, house }) => {
            const g = kb.grahas[pId];
            return (
              <div key={pId} style={{ fontSize: "0.82rem", color: "var(--parchment)", marginBottom: 4 }}>
                {GRAHA_GLYPHS[pId]} {g.en} sits in {rashi.en} (House {house})
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── SEARCH view ───────────────────────────────────────────────────────────────

interface SearchViewProps {
  query: string;
  chart?: ChartPlacements;
  sanskrit: boolean;
  onLesson: (target: LessonTarget) => void;
  onArea: (id: LifeAreaId) => void;
}

function SearchView({ query, sanskrit, onLesson, onArea }: SearchViewProps) {
  const q = query.toLowerCase().trim();

  const matchedAreas = LIFE_AREA_IDS.filter((id) => {
    const area = resolveLifeArea(id);
    return area.label.toLowerCase().includes(q);
  });

  const matchedPlanets = GRAHA_IDS.filter((pId) => {
    const g = kb.grahas[pId];
    return (
      g.en.toLowerCase().includes(q) ||
      g.sanskrit.toLowerCase().includes(q) ||
      (g.alt_sanskrit ?? "").toLowerCase().includes(q)
    );
  });

  const matchedHouses: number[] = [];
  for (let h = 1; h <= 12; h++) {
    const bhava = kb.bhavas[String(h)];
    if (
      String(h).includes(q) ||
      bhava.en.toLowerCase().includes(q) ||
      bhava.signifies.some((s) => s.toLowerCase().includes(q))
    ) {
      matchedHouses.push(h);
    }
  }

  const matchedSigns = SIGN_NAMES.filter((sId) => {
    const r = kb.rashis[sId];
    return r.en.toLowerCase().includes(q) || r.sanskrit.toLowerCase().includes(q);
  });

  const total =
    matchedAreas.length +
    matchedPlanets.length +
    matchedHouses.length +
    matchedSigns.length;

  if (total === 0) {
    return (
      <div style={{ padding: "24px 14px", color: "var(--muted)", fontSize: "0.82rem" }}>
        No results for &ldquo;{query}&rdquo;
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 14px" }}>
      {matchedAreas.length > 0 && (
        <>
          <SectionLabel>Life Areas</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {matchedAreas.map((id) => {
              const area = resolveLifeArea(id);
              return (
                <AtomCard key={id} onClick={() => onArea(id)}>
                  <span style={{ color: "var(--parchment)", fontSize: "0.85rem" }}>
                    {area.emoji} {area.label}
                  </span>
                </AtomCard>
              );
            })}
          </div>
        </>
      )}

      {matchedPlanets.length > 0 && (
        <>
          <SectionLabel>Planets</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {matchedPlanets.map((pId) => {
              const g = kb.grahas[pId];
              const name = sanskrit ? `${g.en} / ${g.sanskrit}` : g.en;
              return (
                <AtomCard key={pId} onClick={() => onLesson({ kind: "planet", id: pId })}>
                  <span style={{ color: "var(--brass)", marginRight: 8 }}>{GRAHA_GLYPHS[pId]}</span>
                  <span style={{ color: "var(--parchment)", fontSize: "0.85rem" }}>{name}</span>
                </AtomCard>
              );
            })}
          </div>
        </>
      )}

      {matchedHouses.length > 0 && (
        <>
          <SectionLabel>Houses</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {matchedHouses.map((h) => {
              const bhava = kb.bhavas[String(h)];
              return (
                <AtomCard key={h} onClick={() => onLesson({ kind: "house", id: h })}>
                  <span style={{ color: "var(--brass)", fontFamily: "var(--font-display, serif)", marginRight: 8 }}>
                    {h}
                  </span>
                  <span style={{ color: "var(--parchment)", fontSize: "0.85rem" }}>{bhava.en}</span>
                </AtomCard>
              );
            })}
          </div>
        </>
      )}

      {matchedSigns.length > 0 && (
        <>
          <SectionLabel>Signs</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {matchedSigns.map((sId) => {
              const r = kb.rashis[sId];
              const name = sanskrit ? `${r.en} / ${r.sanskrit}` : r.en;
              return (
                <AtomCard key={sId} onClick={() => onLesson({ kind: "sign", id: sId })}>
                  <span style={{ color: "var(--muted)", marginRight: 8 }}>{r.symbol}</span>
                  <span style={{ color: "var(--parchment)", fontSize: "0.85rem" }}>{name}</span>
                </AtomCard>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── PLANET library ────────────────────────────────────────────────────────────

function PlanetLibrary({ onLesson, sanskrit }: { onLesson: (t: LessonTarget) => void; sanskrit: boolean }) {
  return (
    <div style={{ padding: "12px 14px" }}>
      <SectionLabel>All Planets</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {GRAHA_IDS.map((pId) => {
          const g = kb.grahas[pId];
          const color = GRAHA_COLORS[pId as keyof typeof GRAHA_COLORS]?.core ?? "var(--brass)";
          const name = sanskrit ? `${g.en} / ${g.sanskrit}` : g.en;
          return (
            <AtomCard key={pId} onClick={() => onLesson({ kind: "planet", id: pId })}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.2rem", color, minWidth: 22 }}>{GRAHA_GLYPHS[pId]}</span>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--parchment)", fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 1 }}>
                    {g.karaka_of.slice(0, 3).join(", ")}
                  </div>
                </div>
              </div>
            </AtomCard>
          );
        })}
      </div>
    </div>
  );
}

// ── HOUSE library ─────────────────────────────────────────────────────────────

function HouseLibrary({ onLesson }: { onLesson: (t: LessonTarget) => void }) {
  return (
    <div style={{ padding: "12px 14px" }}>
      <SectionLabel>All Houses</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
          const bhava = kb.bhavas[String(h)];
          return (
            <AtomCard key={h} onClick={() => onLesson({ kind: "house", id: h })}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontFamily: "var(--font-display, serif)",
                    fontSize: "1.1rem",
                    color: "var(--brass)",
                    minWidth: 22,
                  }}
                >
                  {h}
                </span>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--parchment)", fontWeight: 600 }}>{bhava.en}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 1 }}>
                    {bhava.signifies.slice(0, 3).join(", ")}
                  </div>
                </div>
              </div>
            </AtomCard>
          );
        })}
      </div>
    </div>
  );
}

// ── SIGN library ──────────────────────────────────────────────────────────────

function SignLibrary({ onLesson, sanskrit }: { onLesson: (t: LessonTarget) => void; sanskrit: boolean }) {
  return (
    <div style={{ padding: "12px 14px" }}>
      <SectionLabel>All Signs</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {SIGN_NAMES.map((sId) => {
          const r = kb.rashis[sId];
          const name = sanskrit ? `${r.en} / ${r.sanskrit}` : r.en;
          return (
            <AtomCard key={sId} onClick={() => onLesson({ kind: "sign", id: sId })}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "var(--muted)", minWidth: 22 }}>{r.symbol}</span>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--parchment)", fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 1 }}>
                    {r.element} · {r.modality}
                  </div>
                </div>
              </div>
            </AtomCard>
          );
        })}
      </div>
    </div>
  );
}

// ── Section label helper ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "0.7rem",
        textTransform: "uppercase",
        letterSpacing: "0.09em",
        color: "var(--muted)",
        marginBottom: 8,
        marginTop: 4,
      }}
    >
      {children}
    </p>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GrahaAI({ chart }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ kind: "home" });
  const [prevView, setPrevView] = useState<View>({ kind: "home" });
  const [activeTab, setActiveTab] = useState<BottomTab>("topics");
  const [sanskrit, setSanskrit] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleTab = useCallback((tab: BottomTab) => {
    setActiveTab(tab);
    setSearchQuery("");
    // Always reset to home so renderBody's library-tab checks fire
    setView({ kind: "home" });
  }, []);

  const handleArea = useCallback((id: LifeAreaId) => {
    setView({ kind: "lifeArea", id });
    setActiveTab("topics");
    setSearchQuery("");
  }, []);

  const handleLesson = useCallback((target: LessonTarget) => {
    setView({ kind: "lesson", target });
    setSearchQuery("");
  }, []);

  const handleBack = useCallback(() => {
    if (view.kind === "lesson" || view.kind === "lifeArea") {
      setView({ kind: "home" });
      setActiveTab("topics");
    } else {
      setView({ kind: "home" });
    }
  }, [view]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setSearchQuery(q);
      if (q.trim()) {
        if (view.kind !== "search") setPrevView(view);
        setView({ kind: "search" });
      } else {
        setView(prevView);
      }
    },
    [view, prevView]
  );

  // Derive which view to render in body
  const bodyView: View = useMemo(() => {
    if (view.kind !== "search" && activeTab !== "topics" && view.kind !== "lifeArea" && view.kind !== "lesson") {
      // Library tabs
      return { kind: "home" };
    }
    return view;
  }, [view, activeTab]);

  const renderBody = () => {
    // Library tabs override when not in a lesson/life-area/search
    if (
      activeTab === "planets" &&
      view.kind === "home"
    ) {
      return (
        <PlanetLibrary
          onLesson={handleLesson}
          sanskrit={sanskrit}
        />
      );
    }
    if (activeTab === "houses" && view.kind === "home") {
      return <HouseLibrary onLesson={handleLesson} />;
    }
    if (activeTab === "signs" && view.kind === "home") {
      return <SignLibrary onLesson={handleLesson} sanskrit={sanskrit} />;
    }

    switch (bodyView.kind) {
      case "home":
        return (
          <HomeView
            onArea={handleArea}
            onTab={(tab) => {
              handleTab(tab);
              setView({ kind: "home" });
            }}
          />
        );
      case "lifeArea":
        return (
          <LifeAreaView
            id={bodyView.id}
            chart={chart}
            sanskrit={sanskrit}
            onBack={handleBack}
            onLesson={handleLesson}
          />
        );
      case "lesson": {
        const t = bodyView.target;
        if (t.kind === "planet") {
          return (
            <PlanetLesson
              id={t.id}
              chart={chart}
              sanskrit={sanskrit}
              onBack={handleBack}
            />
          );
        }
        if (t.kind === "house") {
          return (
            <HouseLesson
              id={t.id}
              chart={chart}
              sanskrit={sanskrit}
              onBack={handleBack}
            />
          );
        }
        if (t.kind === "sign") {
          return (
            <SignLesson
              id={t.id}
              chart={chart}
              sanskrit={sanskrit}
              onBack={handleBack}
            />
          );
        }
        return null;
      }
      case "search":
        return (
          <SearchView
            query={searchQuery}
            chart={chart}
            sanskrit={sanskrit}
            onLesson={handleLesson}
            onArea={handleArea}
          />
        );
      default:
        return null;
    }
  };

  const TABS: { id: BottomTab; label: string }[] = [
    { id: "topics",  label: "Topics"  },
    { id: "planets", label: "Planets" },
    { id: "houses",  label: "Houses"  },
    { id: "signs",   label: "Signs"   },
  ];

  return (
    <>
      {/* Inject pulse animation */}
      <style>{`
        @keyframes graha-pulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(0,0,0,0.45), 0 0 0 0 rgba(200,162,74,0.4); }
          50%        { box-shadow: 0 4px 24px rgba(0,0,0,0.45), 0 0 0 8px rgba(200,162,74,0); }
        }
      `}</style>

      {/* FAB */}
      <button
        aria-label="Open GRAHA AI educational assistant"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 96,
          right: 28,
          zIndex: 60,
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: "var(--brass)",
          color: "var(--bg)",
          border: "none",
          cursor: "pointer",
          fontSize: "1.3rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.45), 0 0 16px rgba(200,162,74,0.2)",
          animation: reducedMotion ? "none" : "graha-pulse 2.5s ease-in-out infinite",
        }}
      >
        ✦
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="GRAHA AI educational assistant"
          style={{
            position: "fixed",
            bottom: 90,
            right: 24,
            zIndex: 60,
            width: 390,
            maxWidth: "calc(100vw - 16px)",
            height: "72vh",
            maxHeight: 620,
            display: "flex",
            flexDirection: "column",
            background: "var(--panel)",
            border: "1px solid var(--faint)",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 12px 56px rgba(0,0,0,0.65), 0 0 32px rgba(200,162,74,0.08)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderBottom: "1px solid var(--faint)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ color: "var(--brass)" }}>✦</span>
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--parchment)",
                  fontFamily: "var(--font-ui, system-ui)",
                }}
              >
                GRAHA AI
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>· plain words</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Sanskrit toggle */}
              <button
                onClick={() => setSanskrit((s) => !s)}
                title={sanskrit ? "Sanskrit on" : "Sanskrit off"}
                style={{
                  background: sanskrit ? "var(--brass)" : "var(--panel-2)",
                  border: "1px solid var(--faint)",
                  borderRadius: 4,
                  padding: "3px 7px",
                  fontSize: "0.7rem",
                  color: sanskrit ? "var(--bg)" : "var(--muted)",
                  cursor: "pointer",
                  fontFamily: "var(--font-ui, system-ui)",
                  letterSpacing: "0.03em",
                }}
              >
                San {sanskrit ? "◉" : "○"}
              </button>
              {/* Close */}
              <button
                aria-label="Close GRAHA AI"
                onClick={() => setOpen(false)}
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
                ✕
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div
            style={{
              padding: "8px 14px",
              borderBottom: "1px solid var(--faint)",
              flexShrink: 0,
            }}
          >
            <input
              ref={searchRef}
              type="text"
              placeholder="Search planets, houses, life areas…"
              value={searchQuery}
              onChange={handleSearchChange}
              style={{
                width: "100%",
                background: "var(--panel-2)",
                border: "1px solid var(--faint)",
                borderRadius: 6,
                padding: "7px 10px",
                fontSize: "0.82rem",
                color: "var(--parchment)",
                outline: "none",
                fontFamily: "var(--font-ui, system-ui)",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Body */}
          <div
            style={{ flex: 1, overflowY: "auto" }}
            className="overflow-y-auto"
          >
            {renderBody()}
          </div>

          {/* Bottom tab bar */}
          <div
            style={{
              display: "flex",
              borderTop: "1px solid var(--faint)",
              flexShrink: 0,
              background: "var(--panel)",
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: "10px 4px",
                    background: "none",
                    border: "none",
                    borderTop: isActive ? "2px solid var(--brass)" : "2px solid transparent",
                    color: isActive ? "var(--brass-bright)" : "var(--muted)",
                    fontSize: "0.74rem",
                    cursor: "pointer",
                    fontFamily: "var(--font-ui, system-ui)",
                    transition: "color 0.15s",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
