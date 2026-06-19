import { NextRequest, NextResponse } from "next/server";
import { computeTransits } from "@/lib/astro/transits";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const lagnaSign = parseInt(req.nextUrl.searchParams.get("lagnaSign") ?? "1", 10);
  const dateParam = req.nextUrl.searchParams.get("date"); // ISO "YYYY-MM-DD" or full ISO
  const date = dateParam ? new Date(dateParam) : undefined;

  // Validate date if provided
  if (date && isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date parameter" }, { status: 400 });
  }

  try {
    const transits = await computeTransits(lagnaSign, "LAHIRI", date);
    const isToday = !dateParam;
    return NextResponse.json({ transits, date: date?.toISOString() ?? new Date().toISOString() }, {
      headers: isToday
        ? { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" }
        : { "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (err) {
    console.error("Transit computation error:", err);
    return NextResponse.json({ error: "Failed to compute transits" }, { status: 500 });
  }
}
