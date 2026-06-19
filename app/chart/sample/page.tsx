import Link from "next/link";
import ChartExplorer from "@/components/chart/ChartExplorer";
import Logo from "@/components/Logo";
import { computeChart } from "@/lib/astro/computeChart";

// Force dynamic — computeChart uses native sweph + geo-tz binaries
export const dynamic = "force-dynamic";

export default async function SampleChartPage() {
  // Sample birth: Oct 2, 1869, 7:45am, Porbandar, India (Gandhi — public domain)
  const chart = await computeChart({
    name: "Sample Kundli",
    year: 1869, month: 10, day: 2,
    hour: 7, minute: 45,
    lat: 21.6422, lon: 69.6093,
    timeKnown: true,
  });

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b"
        style={{ background: "var(--panel)", borderColor: "var(--faint)" }}
      >
        <Link href="/" className="transition-opacity hover:opacity-70" aria-label="GRAHA home">
          <Logo variant="horizontal" size={36} animated={false} />
        </Link>
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold" style={{ color: "var(--parchment)" }}>
            Sample Kundli
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            Enter your own birth details to get your real chart
          </span>
        </div>
      </header>

      {/* Sample notice */}
      <div
        className="flex items-center justify-between px-6 py-2 text-sm"
        style={{
          background: "rgba(200,162,74,0.08)",
          borderBottom: "1px solid rgba(200,162,74,0.2)",
          color: "var(--muted)",
        }}
      >
        <span>
          <span style={{ color: "var(--brass)" }}>✦ Sample chart</span>
          {" — "}explore the features. AI readings are disabled on sample charts.
        </span>
        <Link
          href="/"
          style={{ color: "var(--brass)", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 16 }}
        >
          Compute mine →
        </Link>
      </div>

      {/* chartId omitted → AI reading + tutor are disabled */}
      <ChartExplorer chart={chart} chartId="" />
    </main>
  );
}
