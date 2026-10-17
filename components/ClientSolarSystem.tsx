"use client";

import dynamic from "next/dynamic";
import SolarSystemErrorBoundary from "@/components/SolarSystemErrorBoundary";

// Dynamic import with ssr:false must live in a Client Component (Next.js 16 rule)
const SolarSystemHero = dynamic(() => import("@/components/SolarSystemHero"), { ssr: false });

export default function ClientSolarSystem() {
  // The boundary contains any 3D-scene failure (e.g. drei's <Environment>
  // preset="night"/> HDR fetch from the pmndrs CDN) to the hero layer:
  // on error it swaps in a static starfield instead of white-screening.
  return (
    <SolarSystemErrorBoundary>
      <SolarSystemHero />
    </SolarSystemErrorBoundary>
  );
}
