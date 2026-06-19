"use client";

import dynamic from "next/dynamic";

// Dynamic import with ssr:false must live in a Client Component (Next.js 16 rule)
const SolarSystemHero = dynamic(() => import("@/components/SolarSystemHero"), { ssr: false });

export default function ClientSolarSystem() {
  return <SolarSystemHero />;
}
