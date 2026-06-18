"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { computeChart, type ChartInput, type Ayanamsha } from "@/lib/astro/computeChart";

export async function createChartAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim() || "Chart";
  const dateStr = formData.get("date") as string;
  const timeStr = formData.get("time") as string;
  const timeKnown = formData.get("timeKnown") !== "false";
  const lat = parseFloat(formData.get("lat") as string);
  const lon = parseFloat(formData.get("lon") as string);
  const tz = (formData.get("tz") as string) || "UTC";

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

  const input: ChartInput = {
    name,
    year, month, day,
    hour, minute,
    lat, lon,
    timeKnown,
  };

  const chart = await computeChart(input);

  const record = await db.chart.create({
    data: {
      name,
      dob: chart.meta.dob,
      lat,
      lon,
      tz: chart.meta.tz,
      ayanamsha: chart.meta.ayanamsha,
      data: chart as unknown as Parameters<typeof db.chart.create>[0]["data"]["data"],
    },
  });

  redirect(`/chart/${record.id}`);
}
