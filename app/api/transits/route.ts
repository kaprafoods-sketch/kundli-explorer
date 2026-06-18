import { NextRequest, NextResponse } from "next/server";
import { computeTransits } from "@/lib/astro/transits";

export const runtime = "nodejs";
export const revalidate = 3600; // cache 1 hour

export async function GET(req: NextRequest) {
  const lagnaSign = parseInt(req.nextUrl.searchParams.get("lagnaSign") ?? "1", 10);

  try {
    const transits = await computeTransits(lagnaSign);
    return NextResponse.json({ transits }, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    console.error("Transit computation error:", err);
    return NextResponse.json({ error: "Failed to compute transits" }, { status: 500 });
  }
}
