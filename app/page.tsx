import { cookies } from "next/headers";
import HeroLanding from "@/components/HeroLanding";
import AuthButton from "@/components/AuthButton";
import { listMyProfiles } from "@/app/actions/profiles";
import type { ChartRow } from "@/lib/supabase";

export default async function Home() {
  const jar = await cookies();
  const hasToken = !!jar.get("kx_owner")?.value;
  const profiles: ChartRow[] = hasToken ? await listMyProfiles() : [];

  return (
    <>
      {/* Minimal auth affordance — fixed overlay, does not disturb the hero.
          Top-LEFT: the LanguageSwitcher owns the top-right corner in HeroLanding.
          AGENT-DESIGN moves this into a proper header in Wave 3. */}
      <div
        style={{
          position: "fixed",
          top: "1rem",
          left: "1rem",
          zIndex: 50,
        }}
      >
        <AuthButton />
      </div>
      <HeroLanding profiles={profiles} />
    </>
  );
}
