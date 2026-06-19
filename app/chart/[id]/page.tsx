import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import type { NatalChart } from "@/lib/astro/computeChart";
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

  // Load profiles for the switcher (only if the visitor has a token)
  const hasToken = !!jar.get("kx_owner")?.value;
  const profiles: ChartRow[] = hasToken ? await listMyProfiles() : [];

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b gap-4"
        style={{ background: "var(--panel)", borderColor: "var(--faint)" }}
      >
        {/* Logo */}
        <Link href="/" className="transition-opacity hover:opacity-70 shrink-0" aria-label="GRAHA home">
          <Logo size={22} style={{ color: "var(--parchment)" }} />
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

      <ChartExplorer chart={chart} chartId={id} />
    </main>
  );
}
