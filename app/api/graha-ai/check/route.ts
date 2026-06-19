import { NextResponse } from "next/server";
import { hasGeminiKey } from "@/lib/gemini";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ available: hasGeminiKey() });
}
