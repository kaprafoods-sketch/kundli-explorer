import Link from "next/link";
import Logo from "@/components/Logo";
import ClientPlanetsTab from "@/components/chart/ClientPlanetsTab";
import { computeChart } from "@/lib/astro/computeChart";

// Force dynamic — computeChart uses native sweph + geo-tz binaries, and this
// page must work with zero auth / zero saved data for logged-out visitors.
export const dynamic = "force-dynamic";

export default async function Explore3D() {
  // Same sample birth used by /chart/sample (Gandhi — public domain), so the
  // marketing 3D explorer shows the identical computation as the real product.
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
            3D Planet Explorer
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            A sample kundli — tap a planet or bhava to open its reading
          </span>
        </div>
      </header>

      {/* Persistent CTA — this is a marketing surface, not a saved chart */}
      <div
        className="flex items-center justify-between px-6 py-2 text-sm"
        style={{
          background: "rgba(200,162,74,0.08)",
          borderBottom: "1px solid rgba(200,162,74,0.2)",
          color: "var(--muted)",
        }}
      >
        <span>
          <span style={{ color: "var(--brass)" }}>✦ Sample orrery</span>
          {" — "}explore the 3D view. AI readings are disabled on sample charts.
        </span>
        <Link
          href="/"
          style={{ color: "var(--brass)", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 16 }}
        >
          Compute your own chart →
        </Link>
      </div>

      {/* chartId omitted → zero auth, zero saved data; AI reading is disabled
          on the reading sheet (PlanetReadingSheet only renders GrahaAIChat
          when chartId is present). */}
      <ClientPlanetsTab chart={chart} chartId="" />

      {/* Bottom CTA — repeats the hook after visitors explore the scene */}
      <div
        className="flex items-center justify-center px-6 py-4 text-center"
        style={{ borderTop: "1px solid var(--faint)", background: "var(--panel)" }}
      >
        <Link
          href="/"
          className="px-6 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: "var(--brass)", color: "var(--bg)" }}
        >
          Compute your own chart →
        </Link>
      </div>
    </main>
  );
}
