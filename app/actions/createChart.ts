"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { computeChart, type ChartInput } from "@/lib/astro/computeChart";

export async function createChartAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim() || "Chart";
  const dateStr = formData.get("date") as string;
  const timeStr = formData.get("time") as string;
  const timeKnown = formData.get("timeKnown") !== "false";
  const lat = parseFloat(formData.get("lat") as string);
  const lon = parseFloat(formData.get("lon") as string);

  if (!dateStr || isNaN(lat) || isNaN(lon)) {
    throw new Error("Missing required fields: date, latitude, longitude.");
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  let hour = 12;
  let minute = 0;

  if (timeKnown && timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    hour = h ?? 12;
    minute = m ?? 0;
  }

  const input: ChartInput = { name, year, month, day, hour, minute, lat, lon, timeKnown };
  const chart = await computeChart(input);

  // Get or create the anonymous owner token (cookie persists 5 years)
  const jar = await cookies();
  let ownerToken = jar.get("kx_owner")?.value;
  if (!ownerToken) {
    ownerToken = crypto.randomUUID();
    jar.set("kx_owner", ownerToken, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 5,
      sameSite: "lax",
    });
  }

  const { data: record, error } = await supabase
    .from("Chart")
    .insert({
      name,
      dob: chart.meta.dob,
      lat,
      lon,
      tz: chart.meta.tz,
      ayanamsha: chart.meta.ayanamsha,
      data: chart,
      ownerToken,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createChartAction] insert failed:", error);
    throw new Error(error.message);
  }

  redirect(`/chart/${record.id}`);
}
