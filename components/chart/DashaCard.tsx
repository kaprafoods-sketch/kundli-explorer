"use client";

import type { NatalChart } from "@/lib/astro/computeChart";
import { kb, getName, type GrahaId } from "@/lib/kb";
import { useLang } from "@/components/i18n/LanguageProvider";

interface Props {
  dasha: NatalChart["dasha"];
}

export default function DashaCard({ dasha }: Props) {
  const { lang } = useLang();
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
            {getName(mahaGraha, lang)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--faint)" }}>
            {fmt(current.maha.start)} – {fmt(current.maha.end)}
          </p>
        </div>
        <div className="w-px self-stretch" style={{ background: "var(--faint)" }} />
        <div className="flex-1">
          <p className="text-xs" style={{ color: "var(--muted)" }}>Antardasha</p>
          <p className="font-display text-lg font-semibold mt-0.5" style={{ color: "var(--parchment)" }}>
            {getName(antarGraha, lang)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--faint)" }}>
            {fmt(current.antar.start)} – {fmt(current.antar.end)}
          </p>
        </div>
      </div>
    </div>
  );
}
