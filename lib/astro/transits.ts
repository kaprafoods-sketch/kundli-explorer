"use server";

import path from "path";
import { DateTime } from "luxon";
import { GRAHA_IDS, signFromNumber, type GrahaId } from "@/lib/kb";
import type { SignId } from "@/lib/kb";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let swe: any;

function getSwe() {
  if (!swe) {
    swe = require("sweph");
    swe.set_ephe_path(path.join(process.cwd(), "ephe"));
  }
  return swe;
}

export interface TransitPlanet {
  body: GrahaId;
  lon: number;
  sign: SignId;
  signNum: number;
  degInSign: number;
  retrograde: boolean;
  /** House relative to the natal Lagna (whole-sign) */
  natalHouse: number;
}

/**
 * Compute today's sidereal transit positions and map them to natal whole-sign houses.
 * Lahiri ayanamsha (matches natal chart default).
 */
export async function computeTransits(
  natalLagnaSign: number,
  ayanamsha: "LAHIRI" | "RAMAN" | "KP" = "LAHIRI"
): Promise<TransitPlanet[]> {
  const AYANAMSHA_MODES: Record<string, number> = { LAHIRI: 1, RAMAN: 3, KP: 36 };

  const s = getSwe();
  const c = s.constants;
  s.set_sid_mode(AYANAMSHA_MODES[ayanamsha] ?? 1, 0, 0);

  const now = DateTime.utc();
  const jd: number = s.julday(
    now.year, now.month, now.day,
    now.hour + now.minute / 60 + now.second / 3600,
    c.SE_GREG_CAL
  );

  const FLAGS = c.SEFLG_SWIEPH | c.SEFLG_SIDEREAL | c.SEFLG_SPEED;

  const BODY_IDS: Record<string, number> = {
    sun: c.SE_SUN, moon: c.SE_MOON, mars: c.SE_MARS,
    mercury: c.SE_MERCURY, jupiter: c.SE_JUPITER,
    venus: c.SE_VENUS, saturn: c.SE_SATURN, rahu: c.SE_TRUE_NODE,
  };

  const results: TransitPlanet[] = [];

  for (const gid of GRAHA_IDS.filter((g) => g !== "ketu")) {
    const r = s.calc_ut(jd, BODY_IDS[gid], FLAGS);
    const lon: number = ((r.data[0] % 360) + 360) % 360;
    const speed: number = r.data[3];
    const signNum = Math.floor(lon / 30) + 1;
    const sign = signFromNumber(signNum);
    const natalHouse = ((signNum - natalLagnaSign + 12) % 12) + 1;

    results.push({
      body: gid,
      lon,
      sign,
      signNum,
      degInSign: lon % 30,
      retrograde: speed < 0,
      natalHouse,
    });
  }

  // Ketu
  const rahu = results.find((p) => p.body === "rahu")!;
  const ketuLon = (rahu.lon + 180) % 360;
  const ketuSignNum = Math.floor(ketuLon / 30) + 1;
  results.push({
    body: "ketu",
    lon: ketuLon,
    sign: signFromNumber(ketuSignNum),
    signNum: ketuSignNum,
    degInSign: ketuLon % 30,
    retrograde: rahu.retrograde,
    natalHouse: ((ketuSignNum - natalLagnaSign + 12) % 12) + 1,
  });

  return results;
}
