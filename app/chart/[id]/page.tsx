import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import type { NatalChart } from "@/lib/astro/computeChart";
import { computeTransits, type TransitPlanet } from "@/lib/astro/transits";
import { suggestQuestions, type SuggestedQuestion } from "@/lib/suggestQuestions";
import type { LifeAreaId } from "@/lib/lifeAreas";
import ChartExplorer from "@/components/chart/ChartExplorer";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import Logo from "@/components/Logo";
import { listMyProfiles } from "@/app/actions/profiles";
import type { ChartRow } from "@/lib/supabase";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChartPage({ params }: Props) {
  const { id } = await params;

  const [{ data: record, error }, jar] = await Promise.all([
    supabase.from("Chart").select("*").eq("id", id).single(),
    cookies(),
  ]);

  if (error || !record) notFound();

  const chart = record.data as NatalChart;
  const interests = (record.interests ?? []) as LifeAreaId[];

  // ── Merit-based starter chips (Phase 2A) ────────────────────────
  // Transits are computed server-side (sweph is server-only) and passed into the
  // pure ranker; on failure we degrade to dasha + dignity + novelty.
  let transits: TransitPlanet[] | undefined;
  try {
    transits = await computeTransits(chart.lagnaSign, "LAHIRI");
  } catch (e) {
    console.error("[chart] computeTransits failed; ranking without transits:", e);
  }
  // TODO: derive `explored` from this chart's TutorMessage history (which
  // planets/houses the user has already opened) to drive the novelty term.
  // Passing [] for now — the ranker degrades gracefully.
  const suggested: SuggestedQuestion[] = suggestQuestions(
    chart,
    { interests },
    { transits, explored: [] }
  );

  // Load profiles for the switcher (only if the visitor has a token)
  const hasToken = !!jar.get("kx_owner")?.value;
  const profiles: ChartRow[] = hasToken ? await listMyProfiles() : [];

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header
        className="sticky top-0 z-30 flex items-center justify-between border-b gap-4"
        style={{
          background: "var(--panel)",
          borderColor: "var(--faint)",
          paddingTop: "calc(10px + var(--safe-top))",
          paddingBottom: 10,
          paddingLeft: "max(16px, var(--safe-left))",
          paddingRight: "max(16px, var(--safe-right))",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="press transition-opacity hover:opacity-70 shrink-0 inline-grid place-items-center"
          aria-label="GRAHA home"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <Logo variant="horizontal" size={36} animated={false} />
        </Link>

        {/* Chart meta — center */}
        <div className="flex flex-col items-center min-w-0 flex-1">
          <span className="text-sm font-semibold truncate max-w-[180px]" style={{ color: "var(--parchment)" }}>
            {chart.meta.name}
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {record.dob.split("T")[0]} · {chart.meta.tz}
            {chart.meta.lagnaUncertain && (
              <span className="ml-2 text-xs" style={{ color: "var(--weak)" }}>
                (Lagna uncertain)
              </span>
            )}
          </span>
        </div>

        {/* Profile switcher — right */}
        <div className="shrink-0">
          <ProfileSwitcher currentId={id} profiles={profiles} />
        </div>
      </header>

      <ChartExplorer chart={chart} chartId={id} interests={interests} suggested={suggested} />
    </main>
  );
}
