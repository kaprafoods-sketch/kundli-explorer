import { NextResponse } from "next/server";
import { hasOpenRouterKey } from "@/lib/openrouter";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ available: hasOpenRouterKey() });
}
