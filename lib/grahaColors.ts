/**
 * Navagraha gem color system — single source of truth.
 *
 * CSS variables in app/globals.css :root mirror these exact hex values.
 * SolarSystemHero and PlanetsTab import from here; do not hardcode colors
 * in those files.
 *
 * Gem mapping:
 *   Surya  → Ruby            #D8453E
 *   Chandra→ Pearl           #D7DEEC
 *   Mangala→ Red Coral       #E66A3C
 *   Budha  → Emerald         #2FA06B
 *   Guru   → Yellow Sapphire #E4B23E
 *   Shukra → Diamond         #E6C3CE
 *   Shani  → Blue Sapphire   #3E63C9
 *   Rahu   → Hessonite       #B5702F
 *   Ketu   → Cat's Eye       #8F948C
 */

export const GRAHA_COLORS = {
  sun:     { core: "#D8453E", accent: "#F08080", emissive: "#A01A15" }, // Ruby
  moon:    { core: "#D7DEEC", accent: "#FFFFFF", emissive: "#8890A8" }, // Pearl
  mars:    { core: "#E66A3C", accent: "#F4A882", emissive: "#A03A18" }, // Red Coral
  mercury: { core: "#2FA06B", accent: "#7DD4A8", emissive: "#1A5E3F" }, // Emerald
  jupiter: { core: "#E4B23E", accent: "#F5D380", emissive: "#9A7020" }, // Yellow Sapphire
  venus:   { core: "#E6C3CE", accent: "#F5E0E8", emissive: "#A8707E" }, // Diamond
  saturn:  { core: "#3E63C9", accent: "#7A9AE8", emissive: "#1E3A7A" }, // Blue Sapphire
  rahu:    { core: "#B5702F", accent: "#D4A06A", emissive: "#7A4A18" }, // Hessonite
  ketu:    { core: "#8F948C", accent: "#C0C4C0", emissive: "#555A53" }, // Cat's Eye
} as const;

export type GrahaColorKey = keyof typeof GRAHA_COLORS;
