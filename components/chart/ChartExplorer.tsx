"use client";

import { useState, useMemo } from "react";
import type { NatalChart } from "@/lib/astro/computeChart";
import NorthIndianChart from "./NorthIndianChart";
import ExplorePanel from "./ExplorePanel";
import TransitsTab from "./TransitsTab";
import DashaCard from "./DashaCard";
import GrahaAILauncher from "./GrahaAILauncher";
import ClientPlanetsTab from "./ClientPlanetsTab";
import GrahaAI, { type ChartPlacements } from "@/components/GrahaAI";

type Tab = "chart" | "planets" | "transits";

interface Props {
  chart: NatalChart;
  chartId: string;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "chart",    label: "Chart" },
  { id: "planets",  label: "Planets" },
  { id: "transits", label: "Transits" },
];

export default function ChartExplorer({ chart, chartId }: Props) {
  const [tab, setTab] = useState<Tab>("chart");
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [selectedBody, setSelectedBody] = useState<string | null>(null);

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
      {/* Tab bar */}
      <div
        className="flex border-b"
        style={{ borderColor: "var(--faint)", background: "var(--panel)" }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-6 py-3 text-sm font-medium transition-colors"
            style={{
              color: tab === t.id ? "var(--brass-bright)" : "var(--muted)",
              borderBottom: tab === t.id ? "2px solid var(--brass)" : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chart tab */}
      {tab === "chart" && (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-110px)]">
          {/* Left: SVG chart */}
          <div
            className="flex flex-col items-center lg:w-[55%] p-6 border-r"
            style={{ borderColor: "var(--faint)" }}
          >
            <NorthIndianChart
              placements={chart.placements}
              lagnaSign={chart.lagnaSign}
              selectedHouse={selectedHouse}
              selectedBody={selectedBody}
              onHouseClick={handleHouseClick}
              onBodyClick={handleBodyClick}
              size={Math.min(480, typeof window !== "undefined" ? window.innerWidth - 48 : 480)}
            />
            <div className="w-full mt-4 max-w-[480px]">
              <DashaCard dasha={chart.dasha} />
            </div>
          </div>

          {/* Right: interpretation panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            <ExplorePanel
              chart={chart}
              placements={chart.placements}
              selectedBody={selectedBody}
              selectedHouse={selectedHouse}
              chartId={chartId}
            />
          </div>
        </div>
      )}

      {tab === "planets" && (
        <ClientPlanetsTab chart={chart} chartId={chartId} />
      )}

      {tab === "transits" && (
        <TransitsTab chart={chart} />
      )}

      {/* GRAHA AI floating launcher — hidden on sample chart (chartId === "") */}
      {chartId && <GrahaAILauncher chartId={chartId} />}

      {/* GRAHA AI educational assistant */}
      <GrahaAI chart={chartId ? placements : undefined} />
    </div>
  );
}
