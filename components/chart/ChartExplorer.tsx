"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { NatalChart } from "@/lib/astro/computeChart";
import NorthIndianChart from "./NorthIndianChart";
import ExplorePanel from "./ExplorePanel";
import TransitsTab from "./TransitsTab";
import DashaCard from "./DashaCard";
import GrahaAIDock from "./GrahaAIDock";
import ClientPlanetsTab from "./ClientPlanetsTab";
import { type ChartPlacements } from "@/components/GrahaAI";

type Tab = "chart" | "planets" | "transits";

interface Props {
  chart: NatalChart;
  chartId: string;
  /** Life-area ids from onboarding — used to rank GRAHA AI starter chips. */
  interests?: string[];
}

const TABS: { id: Tab; label: string; glyph: string }[] = [
  { id: "chart",    label: "Chart",    glyph: "✦" },
  { id: "planets",  label: "Planets",  glyph: "🪐" },
  { id: "transits", label: "Transits", glyph: "☄" },
];

export default function ChartExplorer({ chart, chartId, interests = [] }: Props) {
  const [tab, setTab] = useState<Tab>("chart");
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [selectedBody, setSelectedBody] = useState<string | null>(null);

  // Responsive chart size — measured from the container, no window read at
  // render (avoids SSR/client hydration mismatch) and reacts to resize/rotate.
  const chartBoxRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState(360);
  useEffect(() => {
    const el = chartBoxRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setChartSize(Math.min(480, Math.floor(w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [tab]);

  const placements = useMemo<ChartPlacements>(() => {
    const m: ChartPlacements = {};
    for (const p of chart.placements) {
      if (p.body !== "lagna") {
        m[p.body] = { house: p.house, signId: p.sign };
      }
    }
    return m;
  }, [chart.placements]);

  function handleHouseClick(house: number) {
    setSelectedHouse(house);
    setSelectedBody(null);
  }

  function handleBodyClick(body: string) {
    setSelectedBody(body);
    setSelectedHouse(null);
  }

  return (
    <div className="flex flex-col">
      <style>{`
        /* Tab bar: bottom dock on phones (thumb zone), inline-top on desktop. */
        .ce-tabbar {
          position: fixed;
          left: 0; right: 0; bottom: 0;
          z-index: 40;
          display: flex;
          border-top: 1px solid var(--faint);
          background: var(--panel);
          padding-bottom: var(--safe-bottom);
          box-shadow: 0 -6px 24px rgba(0,0,0,0.35);
        }
        .ce-tab {
          flex: 1;
          min-height: 56px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          background: none;
          border: none;
          border-top: 2px solid transparent;
          cursor: pointer;
          font-family: var(--font-ui), system-ui;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--muted);
          transition: color 0.15s var(--ease-out, ease-out);
        }
        .ce-tab[data-active="true"] { color: var(--brass-bright); border-top-color: var(--brass); }
        .ce-tab-glyph { font-size: 1.05rem; line-height: 1; }
        /* Spacer so fixed bottom bar never hides content on phones. */
        .ce-tabbar-spacer { height: calc(56px + var(--safe-bottom)); }

        @media (min-width: 1024px) {
          .ce-tabbar {
            position: static;
            bottom: auto;
            border-top: none;
            border-bottom: 1px solid var(--faint);
            padding-bottom: 0;
            box-shadow: none;
          }
          .ce-tab {
            flex: 0 0 auto;
            min-height: 48px;
            flex-direction: row;
            gap: 8px;
            padding: 0 24px;
            border-top: none;
            border-bottom: 2px solid transparent;
            font-size: 0.9375rem;
          }
          .ce-tab[data-active="true"] { border-top-color: transparent; border-bottom-color: var(--brass); }
          .ce-tab-glyph { display: none; }
          .ce-tabbar-spacer { display: none; }
        }
      `}</style>

      {/* Tab bar */}
      <div className="ce-tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="ce-tab press"
            data-active={tab === t.id}
            aria-pressed={tab === t.id}
          >
            <span className="ce-tab-glyph" aria-hidden>{t.glyph}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Chart tab */}
      {tab === "chart" && (
        <div className="flex flex-col lg:flex-row lg:min-h-[calc(100vh-110px)]">
          {/* Chart + dasha */}
          <div
            className="flex flex-col items-center lg:w-[55%] lg:border-r"
            style={{ borderColor: "var(--faint)", padding: "16px max(16px, var(--safe-left)) 16px max(16px, var(--safe-right))" }}
          >
            <div ref={chartBoxRef} className="w-full flex justify-center" style={{ maxWidth: 480 }}>
              <NorthIndianChart
                placements={chart.placements}
                lagnaSign={chart.lagnaSign}
                selectedHouse={selectedHouse}
                selectedBody={selectedBody}
                onHouseClick={handleHouseClick}
                onBodyClick={handleBodyClick}
                size={chartSize}
              />
            </div>
            <div className="w-full mt-4" style={{ maxWidth: 480 }}>
              <DashaCard dasha={chart.dasha} />
            </div>
          </div>

          {/* Interpretation panel */}
          <div
            className="flex-1 scroll-area"
            style={{ padding: "16px max(16px, var(--safe-left)) 16px max(16px, var(--safe-right))" }}
          >
            <ExplorePanel
              chart={chart}
              placements={chart.placements}
              selectedBody={selectedBody}
              selectedHouse={selectedHouse}
              chartId={chartId}
              interests={interests}
            />
          </div>
        </div>
      )}

      {tab === "planets" && (
        <ClientPlanetsTab chart={chart} chartId={chartId} interests={interests} />
      )}

      {tab === "transits" && (
        <TransitsTab chart={chart} />
      )}

      {/* Keeps content clear of the fixed bottom tab bar on phones */}
      <div className="ce-tabbar-spacer" aria-hidden />

      {/* Unified GRAHA AI dock — single thumb-zone control with two modes
          (AI Astrologer chat + Astro Guru learn). Hidden on the sample chart. */}
      {chartId && <GrahaAIDock chartId={chartId} placements={placements} interests={interests} />}
    </div>
  );
}
