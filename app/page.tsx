import { cookies } from "next/headers";
import HeroLanding from "@/components/HeroLanding";
import { listMyProfiles } from "@/app/actions/profiles";
import type { ChartRow } from "@/lib/supabase";

export default async function Home() {
  const jar = await cookies();
  const hasToken = !!jar.get("kx_owner")?.value;
  const profiles: ChartRow[] = hasToken ? await listMyProfiles() : [];

  return <HeroLanding profiles={profiles} />;
}
