"use client";

import { useState } from "react";
import type { NatalChart, Placement } from "@/lib/astro/computeChart";
import NorthIndianChart from "./NorthIndianChart";
import ExplorePanel from "./ExplorePanel";
import TransitsTab from "./TransitsTab";
import TutorTab from "./TutorTab";
import DashaCard from "./DashaCard";

type Tab = "chart" | "transits" | "tutor";
type Mode = "explore" | "simulate";

interface Props {
  chart: NatalChart;
  chartId: string;
}

export default function ChartExplorer({ chart, chartId }: Props) {
  const [tab, setTab] = useState<Tab>("chart");
  const [mode, setMode] = useState<Mode>("explore");
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [selectedBody, setSelectedBody] = useState<string | null>(null);
  const [simulatePlacements, setSimulatePlacements] = useState<Placement[]>(chart.placements);
  const [pickedBody, setPickedBody] = useState<string | null>(null); // simulate: picked up planet

  const isSimulate = mode === "simulate";
  const currentPlacements = isSimulate ? simulatePlacements : chart.placements;

  function handleHouseClick(house: number) {
    if (isSimulate && pickedBody) {
      // Drop the picked planet into this house
      movePlanetToHouse(pickedBody, house);
      setPickedBody(null);
      setSelectedHouse(house);
      setSelectedBody(null);
    } else {
      setSelectedHouse(house);
      setSelectedBody(null);
    }
  }

  function handleBodyClick(body: string) {
    if (isSimulate) {
      if (pickedBody === body) {
        setPickedBody(null); // deselect
      } else {
        setPickedBody(body);
        setSelectedBody(body);
        setSelectedHouse(null);
      }
    } else {
      setSelectedBody(body);
      setSelectedHouse(null);
    }
  }

  function movePlanetToHouse(body: string, targetHouse: number) {
    const lagnaSign = chart.lagnaSign;
    // target sign = the sign that occupies targetHouse (whole-sign)
    const targetSignNum = ((lagnaSign - 1 + targetHouse - 1) % 12) + 1;
    const targetLonBase = (targetSignNum - 1) * 30 + 15; // midpoint of sign

    setSimulatePlacements((prev) => {
      const next = prev.map((p) => {
        if (p.body !== body) return p;

        // For Rahu/Ketu: move as a pair
        if (p.body === "rahu" || p.body === "ketu") return p; // handled below
        const newLon = targetLonBase;
        const newSignNum = targetSignNum;
        const SIGN_NAMES = [
          "aries","taurus","gemini","cancer","leo","virgo",
          "libra","scorpio","sagittarius","capricorn","aquarius","pisces",
        ];
        return {
          ...p,
          lon: newLon,
          signNum: newSignNum,
          sign: SIGN_NAMES[newSignNum - 1] as Placement["sign"],
          house: targetHouse,
          degInSign: 15,
        };
      });

      // Rahu/Ketu special: move as a pair
      if (body === "rahu" || body === "ketu") {
        const oppositeHouse = ((targetHouse - 1 + 6) % 12) + 1;
        const oppositeSignNum = ((lagnaSign - 1 + oppositeHouse - 1) % 12) + 1;
        const SIGN_NAMES = [
          "aries","taurus","gemini","cancer","leo","virgo",
          "libra","scorpio","sagittarius","capricorn","aquarius","pisces",
        ];

        return next.map((p) => {
          if (p.body === "rahu") {
            const isRahuTarget = body === "rahu";
            const sn = isRahuTarget ? targetSignNum : oppositeSignNum;
            const h = isRahuTarget ? targetHouse : oppositeHouse;
            return { ...p, lon: (sn - 1) * 30 + 15, signNum: sn, sign: SIGN_NAMES[sn-1] as Placement["sign"], house: h, degInSign: 15 };
          }
          if (p.body === "ketu") {
            const isKetuTarget = body === "ketu";
            const sn = isKetuTarget ? targetSignNum : oppositeSignNum;
            const h = isKetuTarget ? targetHouse : oppositeHouse;
            return { ...p, lon: (sn - 1) * 30 + 15, signNum: sn, sign: SIGN_NAMES[sn-1] as Placement["sign"], house: h, degInSign: 15 };
          }
          return p;
        });
      }

      return next;
    });
  }

  function resetSimulate() {
    setSimulatePlacements(chart.placements);
    setPickedBody(null);
    setSelectedBody(null);
    setSelectedHouse(null);
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "chart", label: "Chart" },
    { id: "transits", label: "Transits" },
    { id: "tutor", label: "AI Tutor" },
  ];

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
            className="px-6 py-3 text-sm font-medium transition-colors relative"
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
          {/* Left: chart + controls */}
          <div
            className="flex flex-col items-center lg:w-[55%] p-6 border-r"
            style={{ borderColor: "var(--faint)" }}
          >
            {/* Mode toggle */}
            <div
              className="flex items-center gap-1 p-1 rounded-lg mb-4"
              style={{ background: "var(--panel-2)" }}
            >
              {(["explore", "simulate"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); if (m === "explore") { setPickedBody(null); } }}
                  className="px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all"
                  style={{
                    background: mode === m ? (m === "simulate" ? "var(--whatif)" : "var(--brass)") : "transparent",
                    color: mode === m ? "var(--bg)" : "var(--muted)",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* What-if banner */}
            {isSimulate && (
              <div className="whatif-banner rounded-lg px-4 py-2 mb-4 text-sm w-full flex items-center justify-between">
                <span>⚠ Simulate mode — this is a what-if, not your real chart</span>
                <button
                  onClick={resetSimulate}
                  className="ml-4 text-xs font-semibold underline"
                  style={{ color: "var(--whatif)" }}
                >
                  Reset chart
                </button>
              </div>
            )}

            {pickedBody && (
              <div
                className="rounded-lg px-4 py-2 mb-3 text-sm w-full"
                style={{ background: "rgba(95,176,183,0.15)", color: "var(--whatif)", border: "1px solid var(--whatif)" }}
              >
                Picked up: <strong>{pickedBody}</strong> — now tap a house to move it there
              </div>
            )}

            <NorthIndianChart
              placements={currentPlacements}
              lagnaSign={chart.lagnaSign}
              selectedHouse={selectedHouse}
              selectedBody={selectedBody}
              pickedBody={pickedBody}
              isSimulate={isSimulate}
              onHouseClick={handleHouseClick}
              onBodyClick={handleBodyClick}
              size={Math.min(480, typeof window !== "undefined" ? window.innerWidth - 48 : 480)}
            />

            {/* Dasha card */}
            <div className="w-full mt-4 max-w-[480px]">
              <DashaCard dasha={chart.dasha} />
            </div>
          </div>

          {/* Right: interpretation panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            <ExplorePanel
              chart={chart}
              placements={currentPlacements}
              selectedBody={selectedBody}
              selectedHouse={selectedHouse}
              isSimulate={isSimulate}
            />
          </div>
        </div>
      )}

      {tab === "transits" && (
        <TransitsTab chart={chart} />
      )}

      {tab === "tutor" && (
        <TutorTab chart={chart} chartId={chartId} />
      )}
    </div>
  );
}
