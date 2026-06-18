"use client";

import type { NatalChart } from "@/lib/astro/computeChart";
import { kb, type GrahaId } from "@/lib/kb";

interface Props {
  dasha: NatalChart["dasha"];
}

export default function DashaCard({ dasha }: Props) {
  const { current } = dasha;
  const mahaGraha = kb.grahas[current.maha.lord as GrahaId];
  const antarGraha = kb.grahas[current.antar.lord as GrahaId];

  function fmt(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  }

  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--faint)" }}>
        Vimshottari Dasha — current period
      </p>
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="text-xs" style={{ color: "var(--muted)" }}>Mahadasha</p>
          <p className="font-display text-lg font-semibold mt-0.5" style={{ color: "var(--brass)" }}>
            {mahaGraha?.sanskrit}/{mahaGraha?.en}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--faint)" }}>
            {fmt(current.maha.start)} – {fmt(current.maha.end)}
          </p>
        </div>
        <div className="w-px self-stretch" style={{ background: "var(--faint)" }} />
        <div className="flex-1">
          <p className="text-xs" style={{ color: "var(--muted)" }}>Antardasha</p>
          <p className="font-display text-lg font-semibold mt-0.5" style={{ color: "var(--parchment)" }}>
            {antarGraha?.sanskrit}/{antarGraha?.en}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--faint)" }}>
            {fmt(current.antar.start)} – {fmt(current.antar.end)}
          </p>
        </div>
      </div>
    </div>
  );
}
