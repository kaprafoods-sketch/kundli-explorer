"use client";

import dynamic from "next/dynamic";
import type { NatalChart } from "@/lib/astro/computeChart";

const PlanetsTab = dynamic(() => import("./PlanetsTab"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: "calc(100vh - 110px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--faint)",
        fontSize: "0.88rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      Loading star map…
    </div>
  ),
});

interface Props {
  chart: NatalChart;
  chartId: string;
  interests?: string[];
}

export default function ClientPlanetsTab({ chart, chartId, interests }: Props) {
  return <PlanetsTab chart={chart} chartId={chartId} interests={interests} />;
}
