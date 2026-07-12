"use client";

import dynamic from "next/dynamic";

// Dynamic import with ssr:false must live in a Client Component (Next.js 16 rule)
const SolarSystemHero = dynamic(() => import("@/components/SolarSystemHero"), { ssr: false });

export default function ClientSolarSystem({
  paused = false,
  speed = 1,
}: {
  paused?: boolean;
  speed?: number;
}) {
  return <SolarSystemHero paused={paused} speed={speed} />;
}
