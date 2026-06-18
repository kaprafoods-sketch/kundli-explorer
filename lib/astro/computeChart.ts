"use server";

import { find as geoTzFind } from "geo-tz";
import { DateTime } from "luxon";
import path from "path";
import {
  kb,
  GRAHA_IDS,
  SIGN_NAMES,
  signFromNumber,
  resolveDignity,
  type GrahaId,
  type SignId,
} from "@/lib/kb";

// ── Swiss Ephemeris setup ──────────────────────────────────────────────────

let sweInitialized = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let swe: any;

function getSwe() {
  if (!swe) {
    swe = require("sweph");
    if (!sweInitialized) {
      const ephePath = path.join(process.cwd(), "ephe");
      swe.set_ephe_path(ephePath);
      sweInitialized = true;
    }
  }
  return swe;
}

// ── Ayanamsha config ─────────────────────────────────────────────────────────

export type Ayanamsha = "LAHIRI" | "RAMAN" | "KP";

const AYANAMSHA_MODES: Record<Ayanamsha, number> = {
  LAHIRI: 1,  // SE_SIDM_LAHIRI
  RAMAN: 3,   // SE_SIDM_RAMAN
  KP: 36,     // SE_SIDM_KRISHNAMURTI
};

// ── Types ──────────────────────────────────────────────────────────────────

export interface Placement {
  body: GrahaId | "lagna";
  lon: number;          // sidereal 0–360
  signNum: number;      // 1–12
  sign: SignId;
  house: number;        // 1–12 whole-sign
  degInSign: number;    // 0–30
  retrograde: boolean;
  nakshatra: string;
  nakshatraIndex: number; // 0–26
  pada: number;         // 1–4
  dignity: string;      // exalted | moolatrikona | own | friend | neutral | enemy | debilitated
  neechaBhanga?: boolean;
}

export interface DashaEntry {
  lord: GrahaId;
  start: string; // ISO date
  end: string;
}

export interface NatalChart {
  meta: {
    name: string;
    dob: string;         // "YYYY-MM-DDTHH:mm" local
    tobUTC: string;      // ISO UTC
    lat: number;
    lon: number;
    tz: string;          // IANA timezone
    ayanamsha: Ayanamsha;
    lagnaUncertain: boolean;
    ayanamshaValue: number; // degrees at birth
  };
  lagnaSign: number;          // 1–12
  ascendant: {
    lon: number;
    sign: SignId;
    degInSign: number;
  };
  placements: Placement[];    // D1 — Sun…Ketu + Lagna
  navamsha: Placement[];      // D9
  dasha: {
    order: GrahaId[];
    years: Record<GrahaId, number>;
    timeline: DashaEntry[];
    current: {
      maha: DashaEntry;
      antar: DashaEntry;
    };
  };
}

// ── Nakshatra data ─────────────────────────────────────────────────────────

const NAKSHATRA_LORDS: GrahaId[] = [
  "ketu", "venus", "sun", "moon", "mars",
  "rahu", "jupiter", "saturn", "mercury",
  "ketu", "venus", "sun", "moon", "mars",
  "rahu", "jupiter", "saturn", "mercury",
  "ketu", "venus", "sun", "moon", "mars",
  "rahu", "jupiter", "saturn", "mercury",
];

const NAKSHATRA_NAMES = [
  "ashwini", "bharani", "krittika", "rohini", "mrigashira",
  "ardra", "punarvasu", "pushya", "ashlesha", "magha",
  "purva_phalguni", "uttara_phalguni", "hasta", "chitra", "swati",
  "vishakha", "anuradha", "jyeshtha", "mula", "purva_ashadha",
  "uttara_ashadha", "shravana", "dhanishta", "shatabhisha",
  "purva_bhadrapada", "uttara_bhadrapada", "revati",
];

const NAK_SPAN = 40 / 3;  // 13°20′
const PADA_SPAN = 10 / 3; // 3°20′

function nakshatraOf(lon: number): { name: string; index: number; pada: number } {
  const idx = Math.floor(lon / NAK_SPAN);
  const posInNak = lon % NAK_SPAN;
  const pada = Math.floor(posInNak / PADA_SPAN) + 1;
  return {
    name: NAKSHATRA_NAMES[idx] ?? "unknown",
    index: idx,
    pada: Math.min(pada, 4),
  };
}

// ── D9 Navamsha ───────────────────────────────────────────────────────────

function navamshaSign(lon: number): number {
  return (Math.floor(lon / PADA_SPAN) % 12) + 1;
}

// ── Vimshottari Dasha ────────────────────────────────────────────────────────

function computeDasha(
  moonLon: number,
  birthUTC: string,
  dashaOrder: GrahaId[],
  dashaYears: Record<GrahaId, number>
): NatalChart["dasha"] {
  const nak = nakshatraOf(moonLon);
  const startLord = NAKSHATRA_LORDS[nak.index];

  // How far is Moon through the nakshatra?
  const posInNak = moonLon % NAK_SPAN;
  const elapsedFraction = posInNak / NAK_SPAN;
  const startLordIdx = dashaOrder.indexOf(startLord);

  const birthDate = DateTime.fromISO(birthUTC, { zone: "utc" });
  const timeline: DashaEntry[] = [];

  let cursor = birthDate;

  // Remaining portion of start lord's dasha at birth
  const startYearsRemaining =
    dashaYears[startLord] * (1 - elapsedFraction);

  for (let i = 0; i < dashaOrder.length; i++) {
    const lordIdx = (startLordIdx + i) % dashaOrder.length;
    const lord = dashaOrder[lordIdx];
    const years = i === 0 ? startYearsRemaining : dashaYears[lord];
    const end = cursor.plus({ years });
    timeline.push({
      lord,
      start: cursor.toISO()!,
      end: end.toISO()!,
    });
    cursor = end;
  }

  // Repeat to cover full 120 years (in case of late birth dasha)
  let maxEnd = DateTime.fromISO(timeline[timeline.length - 1].end, { zone: "utc" });
  let loopStart = maxEnd;
  if (maxEnd.diff(birthDate, "years").years < 110) {
    let lordIdx = (startLordIdx + dashaOrder.length) % dashaOrder.length;
    for (let rep = 0; rep < dashaOrder.length; rep++) {
      const lord = dashaOrder[lordIdx];
      const end = loopStart.plus({ years: dashaYears[lord] });
      timeline.push({ lord, start: loopStart.toISO()!, end: end.toISO()! });
      loopStart = end;
      lordIdx = (lordIdx + 1) % dashaOrder.length;
    }
  }

  // Current maha + antar
  const now = DateTime.utc();
  const currentMaha = timeline.find(
    (d) =>
      DateTime.fromISO(d.start, { zone: "utc" }) <= now &&
      now < DateTime.fromISO(d.end, { zone: "utc" })
  ) ?? timeline[0];

  // Compute antardashas for the current maha
  const mahaStart = DateTime.fromISO(currentMaha.start, { zone: "utc" });
  const mahaEnd = DateTime.fromISO(currentMaha.end, { zone: "utc" });
  const mahaDurationYears = mahaEnd.diff(mahaStart, "years").years;
  const mahaLordIdx = dashaOrder.indexOf(currentMaha.lord);
  const antars: DashaEntry[] = [];
  let antarCursor = mahaStart;
  for (let i = 0; i < dashaOrder.length; i++) {
    const aLord = dashaOrder[(mahaLordIdx + i) % dashaOrder.length];
    const aYears = (dashaYears[currentMaha.lord] / 120) * dashaYears[aLord];
    const aEnd = antarCursor.plus({ years: aYears });
    antars.push({ lord: aLord, start: antarCursor.toISO()!, end: aEnd.toISO()! });
    antarCursor = aEnd;
  }
  const currentAntar = antars.find(
    (a) =>
      DateTime.fromISO(a.start, { zone: "utc" }) <= now &&
      now < DateTime.fromISO(a.end, { zone: "utc" })
  ) ?? antars[0];

  return {
    order: dashaOrder,
    years: dashaYears,
    timeline,
    current: { maha: currentMaha, antar: currentAntar },
  };
}

// ── Body constants ────────────────────────────────────────────────────────────

// sweph body IDs — resolved lazily from swe.constants
const BODY_IDS: Record<GrahaId, number> = {} as Record<GrahaId, number>;

function getBodyIds() {
  const c = getSwe().constants;
  if (!BODY_IDS.sun) {
    BODY_IDS.sun = c.SE_SUN;
    BODY_IDS.moon = c.SE_MOON;
    BODY_IDS.mars = c.SE_MARS;
    BODY_IDS.mercury = c.SE_MERCURY;
    BODY_IDS.jupiter = c.SE_JUPITER;
    BODY_IDS.venus = c.SE_VENUS;
    BODY_IDS.saturn = c.SE_SATURN;
    BODY_IDS.rahu = c.SE_TRUE_NODE;
  }
  return BODY_IDS;
}

// ── Main: computeChart ───────────────────────────────────────────────────────

export interface ChartInput {
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  lat: number;
  lon: number;
  timeKnown: boolean;
  ayanamsha?: Ayanamsha;
}

export async function computeChart(input: ChartInput): Promise<NatalChart> {
  const {
    name, year, month, day, lat, lon, timeKnown,
    ayanamsha = "LAHIRI",
  } = input;
  let { hour, minute } = input;

  const lagnaUncertain = !timeKnown;
  if (!timeKnown) { hour = 12; minute = 0; } // noon chart

  // 1. Timezone-aware local → UTC
  const tzList = geoTzFind(lat, lon);
  const tz = tzList[0] ?? "UTC";
  const localDt = DateTime.fromObject(
    { year, month, day, hour, minute, second: 0 },
    { zone: tz }
  );
  const utcDt = localDt.toUTC();
  const tobUTC = utcDt.toISO()!;
  const dob = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  // 2. Julian Day (UT)
  const s = getSwe();
  const c = s.constants;
  const jd: number = s.julday(
    utcDt.year,
    utcDt.month,
    utcDt.day,
    utcDt.hour + utcDt.minute / 60 + utcDt.second / 3600,
    c.SE_GREG_CAL
  );

  // 3. Sidereal mode
  s.set_sid_mode(AYANAMSHA_MODES[ayanamsha], 0, 0);
  const ayanamshaValue: number = s.get_ayanamsa_ut(jd);

  const FLAGS = c.SEFLG_SWIEPH | c.SEFLG_SIDEREAL | c.SEFLG_SPEED;
  const bodyIds = getBodyIds();

  // 4. Compute planets Sun–Saturn + Rahu
  const rawPlanets: Record<GrahaId, { lon: number; speed: number }> = {} as never;

  for (const gid of GRAHA_IDS.filter((g) => g !== "ketu")) {
    const bodyId = bodyIds[gid];
    const result = s.calc_ut(jd, bodyId, FLAGS);
    rawPlanets[gid] = {
      lon: ((result.data[0] % 360) + 360) % 360,
      speed: result.data[3],
    };
  }

  // Ketu = Rahu + 180
  rawPlanets.ketu = {
    lon: (rawPlanets.rahu.lon + 180) % 360,
    speed: rawPlanets.rahu.speed,
  };

  // 5. Ascendant via whole-sign house system
  const housesResult = s.houses_ex(jd, c.SEFLG_SIDEREAL, lat, lon, "W");
  const ascLon: number = ((housesResult.data.points[0] % 360) + 360) % 360;

  const lagnaSign = Math.floor(ascLon / 30) + 1;
  const ascSign = signFromNumber(lagnaSign);
  const ascDegInSign = ascLon % 30;

  // 6. Build D1 placements
  const placements: Placement[] = [];

  for (const gid of GRAHA_IDS) {
    const raw = rawPlanets[gid];
    const signNum = Math.floor(raw.lon / 30) + 1;
    const sign = signFromNumber(signNum);
    const house = ((signNum - lagnaSign + 12) % 12) + 1;
    const degInSign = raw.lon % 30;
    const nak = nakshatraOf(raw.lon);
    const dignity = gid === "rahu" || gid === "ketu"
      ? "neutral"
      : resolveDignity(gid, sign);

    // Neecha Bhanga check (flag only — engine does not auto-resolve)
    let neechaBhanga = false;
    if (dignity === "debilitated" && gid !== "rahu" && gid !== "ketu") {
      const g = kb.grahas[gid];
      const debSign = signFromNumber(signNum);
      const debSignRashi = kb.rashis[debSign];
      const dispositorId = debSignRashi?.ruler as GrahaId;
      if (dispositorId) {
        const dispositorRaw = rawPlanets[dispositorId];
        if (dispositorRaw) {
          const dispositorHouse = ((Math.floor(dispositorRaw.lon / 30) + 1 - lagnaSign + 12) % 12) + 1;
          // Neecha Bhanga if dispositor is in a kendra (1,4,7,10) from lagna
          if ([1, 4, 7, 10].includes(dispositorHouse)) neechaBhanga = true;
          // Or if the exaltation lord of the debilitated planet is in a kendra
          const exaltSign = signFromNumber(Math.floor(g.exaltation?.sign ?
            SIGN_NAMES.indexOf(g.exaltation.sign as SignId) + 1 : 0) || 1);
          const exaltSignRashi = kb.rashis[exaltSign as SignId];
          if (exaltSignRashi) {
            const exaltLord = rawPlanets[exaltSignRashi.ruler as GrahaId];
            if (exaltLord) {
              const exaltLordHouse = ((Math.floor(exaltLord.lon / 30) + 1 - lagnaSign + 12) % 12) + 1;
              if ([1, 4, 7, 10].includes(exaltLordHouse)) neechaBhanga = true;
            }
          }
        }
      }
    }

    placements.push({
      body: gid,
      lon: raw.lon,
      signNum,
      sign,
      house,
      degInSign,
      retrograde: raw.speed < 0,
      nakshatra: nak.name,
      nakshatraIndex: nak.index,
      pada: nak.pada,
      dignity,
      ...(neechaBhanga ? { neechaBhanga } : {}),
    });
  }

  // Lagna placement
  const lagnaPlacement: Placement = {
    body: "lagna",
    lon: ascLon,
    signNum: lagnaSign,
    sign: ascSign,
    house: 1,
    degInSign: ascDegInSign,
    retrograde: false,
    nakshatra: nakshatraOf(ascLon).name,
    nakshatraIndex: nakshatraOf(ascLon).index,
    pada: nakshatraOf(ascLon).pada,
    dignity: "own",
  };
  placements.push(lagnaPlacement);

  // 7. D9 Navamsha
  const navamsha: Placement[] = placements
    .filter((p) => p.body !== "lagna")
    .map((p) => {
      const navSignNum = navamshaSign(p.lon);
      const navSign = signFromNumber(navSignNum);
      const navHouse = ((navSignNum - lagnaSign + 12) % 12) + 1;
      const gid = p.body as GrahaId;
      return {
        ...p,
        signNum: navSignNum,
        sign: navSign,
        house: navHouse,
        degInSign: (p.lon % PADA_SPAN) * (30 / PADA_SPAN),
        dignity:
          gid === "rahu" || gid === "ketu"
            ? "neutral"
            : resolveDignity(gid, navSign),
        retrograde: p.retrograde,
        neechaBhanga: undefined,
      };
    });

  // Navamsha lagna
  const navLagnaSignNum = navamshaSign(ascLon);
  navamsha.push({
    body: "lagna",
    lon: ascLon,
    signNum: navLagnaSignNum,
    sign: signFromNumber(navLagnaSignNum),
    house: 1,
    degInSign: ascDegInSign,
    retrograde: false,
    nakshatra: lagnaPlacement.nakshatra,
    nakshatraIndex: lagnaPlacement.nakshatraIndex,
    pada: lagnaPlacement.pada,
    dignity: "own",
  });

  // 8. Vimshottari dasha
  const moonPlacement = placements.find((p) => p.body === "moon")!;
  const dashaOrder = kb.vimshottari.order as GrahaId[];
  const dashaYears = kb.vimshottari.years as Record<GrahaId, number>;
  const dasha = computeDasha(moonPlacement.lon, tobUTC, dashaOrder, dashaYears);

  return {
    meta: {
      name,
      dob,
      tobUTC,
      lat,
      lon,
      tz,
      ayanamsha,
      lagnaUncertain,
      ayanamshaValue,
    },
    lagnaSign,
    ascendant: {
      lon: ascLon,
      sign: ascSign,
      degInSign: ascDegInSign,
    },
    placements,
    navamsha,
    dasha,
  };
}

/** Compute tropical positions for validation comparison (no sidereal flag) */
export async function computeTropicalPositions(
  year: number, month: number, day: number,
  hour: number, minute: number, lat: number, lon: number
): Promise<Record<GrahaId, number>> {
  const s = getSwe();
  const c = s.constants;
  const jd: number = s.julday(year, month, day, hour + minute / 60, c.SE_GREG_CAL);
  const FLAGS = c.SEFLG_SWIEPH | c.SEFLG_SPEED; // no SIDEREAL
  const ids = getBodyIds();
  const result: Record<GrahaId, number> = {} as never;
  for (const gid of GRAHA_IDS.filter((g) => g !== "ketu")) {
    const r = s.calc_ut(jd, ids[gid], FLAGS);
    result[gid] = ((r.data[0] % 360) + 360) % 360;
  }
  result.ketu = (result.rahu + 180) % 360;
  return result;
}
