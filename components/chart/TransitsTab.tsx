"use client";

import { useEffect, useState } from "react";
import type { NatalChart } from "@/lib/astro/computeChart";
import type { TransitPlanet } from "@/lib/astro/transits";
import { kb, GRAHA_GLYPHS, type GrahaId } from "@/lib/kb";

interface Props {
  chart: NatalChart;
}

export default function TransitsTab({ chart }: Props) {
  const [transits, setTransits] = useState<TransitPlanet[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/transits?lagnaSign=${chart.lagnaSign}`)
      .then((r) => r.json())
      .then((d) => { setTransits(d.transits); setLoading(false); })
      .catch(() => setLoading(false));
  }, [chart.lagnaSign]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-baseline gap-3 mb-2">
        <h2 className="font-display text-2xl font-semibold" style={{ color: "var(--parchment)" }}>
          Current Transits
        </h2>
        <span className="text-xs" style={{ color: "var(--faint)" }}>
          {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </span>
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Where the planets are <em>right now</em> — mapped to your natal whole-sign houses.
      </p>

      {loading && (
        <div className="flex items-center gap-2" style={{ color: "var(--faint)" }}>
          <span className="animate-pulse">◌</span> Computing today&apos;s positions…
        </div>
      )}

      {!loading && transits && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {transits.map((t) => {
            const graha = kb.grahas[t.body as GrahaId];
            const natalHouseData = kb.bhavas[String(t.natalHouse)];
            const sign = kb.rashis[t.sign];

            return (
              <div key={t.body} className="card p-4 flex items-start gap-3">
                <span className="text-3xl leading-none mt-0.5" style={{ color: "var(--brass)" }}>
                  {GRAHA_GLYPHS[t.body as GrahaId]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm" style={{ color: "var(--parchment)" }}>
                      {graha?.sanskrit}/{graha?.en}
                    </span>
                    {t.retrograde && (
                      <span className="text-xs" style={{ color: "var(--weak)" }}>℞</span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                    in {sign?.sanskrit} ({sign?.en}) — {t.degInSign.toFixed(1)}°
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--faint)" }}>
                    Activating your{" "}
                    <span style={{ color: "var(--brass)" }}>
                      {t.natalHouse}{ordinal(t.natalHouse)} house
                    </span>
                    {natalHouseData ? ` (${natalHouseData.en})` : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !transits && (
        <p className="text-sm" style={{ color: "var(--weak)" }}>
          Could not compute transits. Check server logs.
        </p>
      )}

      {/* STUB: timeline scrubber */}
      <div
        className="mt-8 p-4 rounded-lg border text-sm"
        style={{ borderColor: "var(--faint)", color: "var(--faint)" }}
      >
        📅 <strong>Timeline scrubber</strong> — Phase 2 TODO: animated slider to scrub transit positions forward/back in time.
      </div>
    </div>
  );
}

function ordinal(n: number): string {
  if (n === 1) return "st";
  if (n === 2) return "nd";
  if (n === 3) return "rd";
  return "th";
}
