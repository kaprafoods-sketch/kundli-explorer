/**
 * i18n gate — AGENT-I18N.
 *
 * Covers:
 *  1. getName() fallback chain (en/hi/sa) for grahas, rashis, bhavas, nakshatras.
 *  2. Nakshatra sa === hi (tatsama, intentional — see DECISIONS.md D4).
 *  3. messages.ts: every MessageKey has a non-empty `en` value (no missing base strings).
 */

import { describe, it, expect } from "vitest";
import { kb, getName, GRAHA_IDS, SIGN_NAMES } from "@/lib/kb";
import { MESSAGES, translate, type MessageKey } from "@/lib/i18n/messages";

describe("getName() fallback chain", () => {
  it("resolves graha names in en / hi / sa", () => {
    const sun = kb.grahas.sun;
    expect(getName(sun, "en")).toBe(sun.en);
    expect(getName(sun, "hi")).toBe(sun.hi);
    expect(getName(sun, "sa")).toBe(sun.sanskrit);
  });

  it("resolves rashi names in en / hi / sa", () => {
    const aries = kb.rashis.aries;
    expect(getName(aries, "en")).toBe(aries.en);
    expect(getName(aries, "hi")).toBe(aries.hi);
    expect(getName(aries, "sa")).toBe(aries.sanskrit);
  });

  it("resolves bhava names in en / hi / sa (sanskrit is an array, joined)", () => {
    const bhava1 = kb.bhavas["1"];
    expect(getName(bhava1, "en")).toBe(bhava1.en);
    expect(getName(bhava1, "hi")).toBe(bhava1.hi);
    expect(getName(bhava1, "sa")).toBe(
      Array.isArray(bhava1.sanskrit) ? bhava1.sanskrit.join(" / ") : bhava1.sanskrit
    );
  });

  it("resolves nakshatra names in en / hi / sa (sa === hi, tatsama by design — D4)", () => {
    const ashwini = kb.nakshatras[0];
    expect(getName(ashwini, "en")).toBe("Ashwini");
    expect(getName(ashwini, "hi")).toBe(ashwini.hi);
    expect(getName(ashwini, "sa")).toBe(ashwini.sanskrit);
    expect(ashwini.sanskrit).toBe(ashwini.hi); // D4: intentional tatsama identity
  });

  it("falls back to en when hi/sanskrit is missing", () => {
    const stub = { en: "Test Entity" };
    expect(getName(stub, "hi")).toBe("Test Entity");
    expect(getName(stub, "sa")).toBe("Test Entity");
  });

  it("returns empty string for null/undefined entity (never throws, never blank-crashes)", () => {
    expect(getName(null, "en")).toBe("");
    expect(getName(undefined, "hi")).toBe("");
  });

  it("every graha/rashi has a non-empty hi field (KB completeness)", () => {
    for (const gid of GRAHA_IDS) {
      expect(kb.grahas[gid].hi, `graha ${gid} missing hi`).toBeTruthy();
    }
    for (const sid of SIGN_NAMES) {
      expect(kb.rashis[sid].hi, `rashi ${sid} missing hi`).toBeTruthy();
    }
  });

  it("all 12 bhavas have a non-empty hi field", () => {
    for (let n = 1; n <= 12; n++) {
      expect(kb.bhavas[String(n)]?.hi, `bhava ${n} missing hi`).toBeTruthy();
    }
  });

  it("KB has exactly 27 ordered nakshatras, each with hi + sanskrit", () => {
    expect(kb.nakshatras).toHaveLength(27);
    kb.nakshatras.forEach((n, i) => {
      expect(n.index).toBe(i);
      expect(n.hi).toBeTruthy();
      expect(n.sanskrit).toBeTruthy();
    });
  });
});

describe("lib/i18n/messages.ts", () => {
  const enKeys = Object.keys(MESSAGES.en) as MessageKey[];

  it("has no missing/empty en values for any declared key", () => {
    for (const key of enKeys) {
      expect(MESSAGES.en[key], `en.${key} is missing/empty`).toBeTruthy();
    }
  });

  it("translate() falls back en -> key for hi/sa when a key is absent", () => {
    // Pick a key we know is TODO-sa (falls back to en).
    expect(translate("sa", "explore.emptyTitle")).toBe(MESSAGES.en["explore.emptyTitle"]);
  });

  it("hi dict has no fabricated keys outside the declared MessageKey union (sanity)", () => {
    const hiKeys = Object.keys(MESSAGES.hi ?? {});
    for (const k of hiKeys) {
      expect(enKeys).toContain(k as MessageKey);
    }
  });
});
