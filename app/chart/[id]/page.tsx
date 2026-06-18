import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { NatalChart } from "@/lib/astro/computeChart";
import ChartExplorer from "@/components/chart/ChartExplorer";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChartPage({ params }: Props) {
  const { id } = await params;
  const record = await db.chart.findUnique({ where: { id } });

  if (!record) notFound();

  const chart = record.data as unknown as NatalChart;

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header bar */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b"
        style={{ background: "var(--panel)", borderColor: "var(--faint)" }}
      >
        <a
          href="/"
          className="font-display text-lg font-semibold tracking-wide transition-opacity hover:opacity-70"
          style={{ color: "var(--brass)" }}
        >
          Kundli Explorer
        </a>
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold" style={{ color: "var(--parchment)" }}>
            {chart.meta.name}
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {record.dob} · {chart.meta.tz}
            {chart.meta.lagnaUncertain && (
              <span className="ml-2 text-xs" style={{ color: "var(--weak)" }}>
                (Lagna uncertain — no birth time)
              </span>
            )}
          </span>
        </div>
      </header>

      <ChartExplorer chart={chart} chartId={id} />
    </main>
  );
}
