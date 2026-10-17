"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { computeChart, type ChartInput } from "@/lib/astro/computeChart";
import {
  checkRateLimit,
  rateLimitKey,
  ipFromHeaders,
  CREATE_CHART_RATE_LIMIT,
} from "@/lib/rateLimit";

/** True only for real calendar dates (handles leap years and month lengths). */
function isRealCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

/**
 * Server-boundary input validation for chart creation.
 * Every external (FormData) value is checked here; downstream code
 * (computeChart, supabase) only ever sees the parsed, typed value.
 */
export const createChartInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter a name.")
    .max(100, "Name must be 100 characters or fewer."),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid birth date.")
    .refine(
      (s) => {
        const [y, m, d] = s.split("-").map(Number);
        // Year bound keeps dates inside the ephemeris' supported range.
        return y >= 1900 && y <= 2100 && isRealCalendarDate(y, m, d);
      },
      "Please enter a real calendar date."
    ),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Please enter a valid birth time (HH:MM).")
    .optional(),
  timeKnown: z.boolean(),
  lat: z
    .number({ error: "Latitude must be a number." })
    .min(-90, "Latitude must be between −90 and 90.")
    .max(90, "Latitude must be between −90 and 90."),
  lon: z
    .number({ error: "Longitude must be a number." })
    .min(-180, "Longitude must be between −180 and 180.")
    .max(180, "Longitude must be between −180 and 180."),
  interests: z
    .array(z.string().trim().min(1).max(50, "Each interest must be 50 characters or fewer."))
    .max(10, "Choose at most 10 interests."),
  depth: z.enum(["quick", "deep"]),
  intentNote: z
    .string()
    .trim()
    .max(500, "Your note must be 500 characters or fewer.")
    .nullable(),
}).refine((v) => !v.timeKnown || v.time !== undefined, {
  message: "Please enter your birth time, or mark it as unknown.",
  path: ["time"],
});

export type CreateChartInput = z.infer<typeof createChartInputSchema>;

export async function createChartAction(formData: FormData) {
  // ── Rate limit (P5): at most 5 chart creations per owner token (or client
  // IP when the cookie is absent) per 10 minutes — each call runs the
  // ephemeris and a DB insert. Server actions can't return HTTP headers, so a
  // denied request throws a user-safe error that BirthForm displays exactly
  // like the validation errors below (no Retry-After transport here; the
  // message carries the wait instruction).
  const rlCookieJar = await cookies();
  const rl = checkRateLimit(
    rateLimitKey(
      CREATE_CHART_RATE_LIMIT.prefix,
      rlCookieJar.get("kx_owner")?.value,
      ipFromHeaders(await headers())
    ),
    CREATE_CHART_RATE_LIMIT.limit,
    CREATE_CHART_RATE_LIMIT.windowMs
  );
  if (!rl.allowed) {
    throw new Error("Too many charts created. Please wait a few minutes and try again.");
  }

  const interests = ((formData.get("interests") as string) || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const depthRaw = (formData.get("depth") as string) || "deep";
  const timeStr = (formData.get("time") as string) || undefined;

  // ── Validate at the server boundary: reject bad input with a clean,
  // user-safe error instead of letting invalid data crash the action. ──
  const parsed = createChartInputSchema.safeParse({
    name: ((formData.get("name") as string) ?? "").trim() || "Chart",
    date: formData.get("date"),
    time: timeStr,
    timeKnown: formData.get("timeKnown") !== "false",
    lat: parseFloat(formData.get("lat") as string),
    lon: parseFloat(formData.get("lon") as string),
    interests,
    depth: depthRaw === "quick" ? "quick" : "deep",
    intentNote: ((formData.get("intentNote") as string) ?? "").trim() || null,
  });

  if (!parsed.success) {
    // BirthForm catches thrown Errors and displays the message; keep it
    // plain and user-facing — never internals, stack traces, or raw input.
    const message = parsed.error.issues[0]?.message ?? "Please check your details and try again.";
    throw new Error(message);
  }

  const {
    name,
    date: dateStr,
    time: validTime,
    timeKnown,
    lat,
    lon,
    interests: validInterests,
    depth,
    intentNote,
  } = parsed.data;

  const [year, month, day] = dateStr.split("-").map(Number);
  let hour = 12;
  let minute = 0;

  if (timeKnown && validTime) {
    const [h, m] = validTime.split(":").map(Number);
    hour = h;
    minute = m;
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
      secure: process.env.NODE_ENV === "production",
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
      interests: validInterests,
      depth,
      intentNote,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createChartAction] insert failed:", error);
    throw new Error(error.message);
  }

  redirect(`/chart/${record.id}`);
}
