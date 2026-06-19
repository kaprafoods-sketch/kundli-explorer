"use client";

import { useMemo } from "react";
import type { NatalChart, Placement } from "@/lib/astro/computeChart";
import {
  composePlanetInterpretation,
  composeHouseReading,
  composeLagnaReading,
} from "@/lib/interpret";
import { kb, GRAHA_GLYPHS, type GrahaId } from "@/lib/kb";
import GrahaAIChat from "./GrahaAIChat";

interface Props {
  chart: NatalChart;
  placements: Placement[];
  selectedBody: string | null;
  selectedHouse: number | null;
  chartId?: string;
  interests?: string[];
}

export default function ExplorePanel({
  chart, placements, selectedBody, selectedHouse, chartId, interests,
}: Props) {
  const result = useMemo(() => {
    if (selectedBody === "lagna" || selectedBody === null && selectedHouse === null) {
      if (selectedBody === "lagna") {
        return { type: "lagna" as const, data: composeLagnaReading(chart.lagnaSign, placements) };
      }
      return null;
    }

    if (selectedBody && selectedBody !== "lagna") {
      const p = placements.find((pl) => pl.body === selectedBody);
      if (!p) return null;
      return {
        type: "planet" as const,
        placement: p,
        data: composePlanetInterpretation(p, placements),
      };
    }

    if (selectedHouse !== null) {
      return {
        type: "house" as const,
        house: selectedHouse,
        data: composeHouseReading(selectedHouse, chart.lagnaSign, placements),
      };
    }

    return null;
  }, [selectedBody, selectedHouse, placements, chart.lagnaSign]);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
        <p className="font-display text-4xl mb-4" style={{ color: "var(--faint)" }}>✦</p>
        <p className="text-lg font-display" style={{ color: "var(--muted)" }}>
          Tap a planet or house to learn
        </p>
        <p className="text-sm mt-2 max-w-xs" style={{ color: "var(--faint)" }}>
          Each placement tells a story — select anything on the chart to see its reading.
        </p>
        <div className="mt-8 text-left max-w-xs">
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--faint)" }}>
            Planet guide
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(["sun","moon","mars","mercury","jupiter","venus","saturn","rahu","ketu"] as GrahaId[]).map((g) => {
              const gr = kb.grahas[g];
              return (
                <div key={g} className="flex items-center gap-1.5">
                  <span className="text-lg" style={{ color: "var(--brass)" }}>
                    {GRAHA_GLYPHS[g]}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {gr?.sanskrit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (result.type === "planet") {
    const { data, placement } = result;
    const graha = kb.grahas[placement.body as GrahaId];
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <span className="text-5xl leading-none" style={{ color: "var(--brass)" }}>
            {GRAHA_GLYPHS[placement.body as GrahaId]}
          </span>
          <div>
            <h2 className="font-display text-2xl font-semibold" style={{ color: "var(--parchment)" }}>
              {graha?.sanskrit} / {graha?.en}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
              House {placement.house} · {kb.rashis[placement.sign]?.sanskrit} ({kb.rashis[placement.sign]?.en})
              {placement.retrograde && (
                <span className="ml-2" style={{ color: "var(--weak)" }}>℞ Retrograde</span>
              )}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge ${data.dignityClass}`}>{data.dignityLabel}</span>
              {placement.neechaBhanga && (
                <span className="badge" style={{ background: "rgba(200,162,74,0.15)", color: "var(--brass)", border: "1px solid var(--brass)" }}>
                  Neecha Bhanga?
                </span>
              )}
              {data.houseClass.map((c) => (
                <span key={c} className="badge badge-neutral capitalize">{c}</span>
              ))}
            </div>
          </div>
        </div>

        <Divider />

        <ReadingSection label="The Planet — what it brings">
          {data.pillars.planet}
        </ReadingSection>
        <ReadingSection label="The House — where it acts">
          {data.pillars.house}
        </ReadingSection>
        <ReadingSection label="The Sign — how it expresses">
          {data.pillars.sign}
        </ReadingSection>
        <ReadingSection label="Dignity — strength dial">
          {data.pillars.dignity}
        </ReadingSection>
        {data.pillars.aspects && (
          <ReadingSection label="Conjunctions &amp; Aspects">
            {data.pillars.aspects}
          </ReadingSection>
        )}

        <Divider />

        {/* Nakshatra */}
        <div>
          <span className="text-xs uppercase tracking-widest" style={{ color: "var(--faint)" }}>Nakshatra</span>
          <p className="text-sm mt-1 capitalize" style={{ color: "var(--parchment)" }}>
            {placement.nakshatra.replace(/_/g, " ")} · Pada {placement.pada}
          </p>
        </div>

        {/* Karaka chips */}
        <div>
          <span className="text-xs uppercase tracking-widest" style={{ color: "var(--faint)" }}>Signifies</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {graha?.karaka_of?.map((k) => (
              <span
                key={k}
                className="px-2 py-0.5 rounded text-xs capitalize"
                style={{ background: "var(--panel-2)", color: "var(--muted)", border: "1px solid var(--faint)" }}
              >
                {k}
              </span>
            ))}
          </div>
        </div>

        {/* GRAHA AI — focused on this placement */}
        {chartId && (
          <GrahaAIChat
            chartId={chartId}
            focus={{ kind: "planet", id: placement.body }}
            interests={interests}
            compact
          />
        )}
      </div>
    );
  }

  if (result.type === "house") {
    const { data, house } = result;
    return (
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--faint)" }}>
            House {house}
          </p>
          <h2 className="font-display text-2xl font-semibold" style={{ color: "var(--parchment)" }}>
            {data.headline.replace(`House ${house} — `, "")}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            {data.sign.sanskrit} ({data.sign.en}) · ruled by {data.sign.ruler}
          </p>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {data.houseClass.map((c) => (
              <span key={c} className="badge badge-neutral capitalize">{c}</span>
            ))}
          </div>
        </div>

        <Divider />

        <p className="text-sm leading-relaxed" style={{ color: "var(--parchment)" }}>
          {data.body}
        </p>

        {data.planets.length > 0 && (
          <div>
            <span className="text-xs uppercase tracking-widest" style={{ color: "var(--faint)" }}>Planets in this house</span>
            <div className="flex gap-2 mt-2 flex-wrap">
              {data.planets.map((gid) => {
                const g = kb.grahas[gid];
                return (
                  <span
                    key={gid}
                    className="flex items-center gap-1 px-3 py-1 rounded text-sm"
                    style={{ background: "var(--panel-2)", color: "var(--brass)", border: "1px solid var(--faint)" }}
                  >
                    {GRAHA_GLYPHS[gid]} {g?.sanskrit}/{g?.en}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <span className="text-xs uppercase tracking-widest" style={{ color: "var(--faint)" }}>House signifies</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {data.significations.map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 rounded text-xs capitalize"
                style={{ background: "var(--panel-2)", color: "var(--muted)", border: "1px solid var(--faint)" }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* GRAHA AI — focused on this house */}
        {chartId && (
          <GrahaAIChat
            chartId={chartId}
            focus={{ kind: "house", id: house }}
            interests={interests}
            compact
          />
        )}
      </div>
    );
  }

  if (result.type === "lagna") {
    const { data } = result;
    return (
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--faint)" }}>Ascendant</p>
          <h2 className="font-display text-2xl font-semibold" style={{ color: "var(--parchment)" }}>
            {data.headline}
          </h2>
          <div className="flex gap-2 mt-2">
            <span className="badge badge-own">Lagna</span>
            <span className="badge badge-neutral">Kendra</span>
            <span className="badge badge-neutral">Trikona</span>
          </div>
        </div>
        <Divider />
        <p className="text-sm leading-relaxed" style={{ color: "var(--parchment)" }}>
          {data.body}
        </p>
        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--faint)" }}>Lagna lord</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>{data.pillars.planet}</p>
        </div>

        {/* GRAHA AI — focused on Lagna */}
        {chartId && (
          <GrahaAIChat
            chartId={chartId}
            focus={{ kind: "lagna" }}
            interests={interests}
            compact
          />
        )}
      </div>
    );
  }

  return null;
}

function ReadingSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-widest" style={{ color: "var(--faint)" }}>
        {label}
      </span>
      <p className="text-sm leading-relaxed" style={{ color: "var(--parchment)" }}>
        {children}
      </p>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full" style={{ background: "var(--faint)", opacity: 0.4 }} />;
}
