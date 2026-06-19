# GRAHA — Brand & Design System

**Version 1.0 · 2026-06-19**

---

## 1. Name & Identity

**GRAHA** (ग्रह) — Sanskrit for "planet" / "that which grasps". The nine classical planets of Vedic astrology.

**Tagline:** Read Your Universe

**Previous name:** Lagna → retired.

---

## 2. Aesthetic Direction

**70% scientific instrument · 20% ancient precision · 10% wonder**

A deep-space observatory at Jantar Mantar. Instruments made of cold metal and glass, not warm parchment. The UI reads like an engraved brass reticle on a dark field — precise, calibrated, purposeful.

- **Not:** mystical, purple haze, magic symbols, fortune-teller energy
- **Yes:** measurement tools, Sanskrit scholarship, star charts, orreries

---

## 3. Color System

### Neutrals — Deep Space Cool

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#060B18` | True void / page background |
| `--ink-1` | `#0A1020` | Base page surface |
| `--ink-2` | `#111827` | Cards / panels |
| `--ink-3` | `#1A2436` | Elevated surfaces / hover |
| `--ink-4` | `#222E42` | Active / selected |
| `--line` | `rgba(139,150,178,0.15)` | Hairlines — cool slate |
| `--line-brass` | `rgba(199,162,76,0.18)` | Brass hairlines — use sparingly |

### Accent — Interactive States

| Token | Hex | Use |
|---|---|---|
| `--accent` | `#6B7FDB` | Links, focus rings, interactive affordances |
| `--accent-bright` | `#8A9AE8` | Hover state |
| `--accent-deep` | `#4A5CB8` | Active/pressed |

### Brass — One Restrained Warm Accent

| Token | Hex | Use |
|---|---|---|
| `--brass` | `#C7A24C` | Chart lines, data labels, decorative flourishes |
| `--brass-bright` | `#E6C56A` | Selected planet, active state in chart |
| `--brass-deep` | `#9C7C34` | Muted variant |

Brass is **one accent**, not the primary interactive color. Do not use it for buttons or focus states.

### Text Scale

| Token | Hex | Use |
|---|---|---|
| `--parchment` | `#E2E8F4` | Primary text — cool near-white |
| `--sand` | `#C5CEDF` | Secondary text |
| `--sand-2` | `#B0BBCE` | Tertiary text |
| `--muted` | `#8B96B2` | Muted / supporting copy |
| `--muted-2` | `#5E6883` | Faint text |

### Navagraha Gem Colors

Sourced from `lib/grahaColors.ts` — single source of truth for all 9 planets.

| Planet (Sanskrit) | Gem | Core | Accent | Emissive |
|---|---|---|---|---|
| Surya / Sun | Ruby | `#D8453E` | `#F08080` | `#A01A15` |
| Chandra / Moon | Pearl | `#D7DEEC` | `#FFFFFF` | `#8890A8` |
| Mangala / Mars | Red Coral | `#E66A3C` | `#F4A882` | `#A03A18` |
| Budha / Mercury | Emerald | `#2FA06B` | `#7DD4A8` | `#1A5E3F` |
| Guru / Jupiter | Yellow Sapphire | `#E4B23E` | `#F5D380` | `#9A7020` |
| Shukra / Venus | Diamond | `#E6C3CE` | `#F5E0E8` | `#A8707E` |
| Shani / Saturn | Blue Sapphire | `#3E63C9` | `#7A9AE8` | `#1E3A7A` |
| Rahu | Hessonite | `#B5702F` | `#D4A06A` | `#7A4A18` |
| Ketu | Cat's Eye | `#8F948C` | `#C0C4C0` | `#555A53` |

> CSS vars `--surya`, `--chandra`, … `--ketu` in `globals.css` mirror these. Keep in sync manually.

---

## 4. Typography

| Role | Font | Weight | Variable |
|---|---|---|---|
| Display / headings | Fraunces (serif) | 300–600 | `var(--font-display)` |
| UI / body | Hanken Grotesk (sans) | 400–800 | `var(--font-ui)` |
| Monospace / labels | IBM Plex Mono | 400–500 | `var(--font-mono)` |
| Sanskrit / Devanagari | Tiro Devanagari Sanskrit | 400 | `var(--font-sanskrit)` |

**Wordmark:** Hanken Grotesk, weight 700, tracking `0.12em`, uppercase — `GRAHA`

**Sanskrit callout:** Tiro Devanagari, color `var(--brass)` — "ग्रह" shown sparingly alongside the wordmark.

---

## 5. Logo

Defined in `components/Logo.tsx`.

### Logo Mark (GrahaMark)

32×32 viewBox. Three painted layers (back-to-front):
1. Back orbital arc — `Q 16 10` — opacity 0.22 (dim, behind planet)
2. Planet circle — cx=16 cy=13 r=6.5 filled (covers back arc)
3. Front orbital arc — `Q 16 24.5` — opacity 0.75 (visible in front)

`currentColor`-driven — works on any background.

### Variants

| Variant | Use |
|---|---|
| `"full"` | Hero / landing — mark + wordmark + optional Sanskrit |
| `"mark"` | Favicon / app icon / small contexts |
| `"wordmark"` | Header nav — compact wordmark without mark |

### Props

```tsx
<Logo
  variant="full"       // "full" | "mark" | "wordmark"
  size={32}            // controls mark height; wordmark scales proportionally
  showSanskrit         // shows "ग्रह" in brass below wordmark (full variant only)
  style={{ color: "var(--parchment)" }}
/>
```

---

## 6. Icon System

### GrahaIcon — 9 Planet Icons

`components/icons/GrahaIcon.tsx`

- 24×24 viewBox, 1.5px stroke, round linecap/linejoin
- Variants: `"outlined"` (default) | `"filled"`
- Use for DOM contexts ≥16px where classical Unicode glyphs (☉☽♂☿♃♀♄☊☋) are too small or semantically unclear

**Keep classical glyphs** (`GRAHA_GLYPHS` in `lib/kb.ts`) for the North-Indian chart SVG where glyph sizes are 13px and space is very tight.

### HouseIcon — 12 Bhava Icons

`components/icons/HouseIcon.tsx`

- Same grid/stroke as GrahaIcon
- Each icon encodes the bhava's primary signification visually

---

## 7. Type Scale & Spacing

### Type Scale

| Token | Size |
|---|---|
| `--text-2xl` | `clamp(2rem, 4.5vw, 3.5rem)` |
| `--text-xl` | `clamp(1.5rem, 3vw, 2.25rem)` |
| `--text-lg` | `1.25rem` |
| `--text-md` | `1rem` |
| `--text-base` | `0.9375rem` |
| `--text-sm` | `0.8125rem` |
| `--text-xs` | `0.75rem` |
| `--text-2xs` | `0.6875rem` |

### Spacing Scale (`--sp-*`)

`4px · 8px · 12px · 16px · 20px · 24px · 32px · 40px · 48px · 64px · 80px · 96px`

### Radius

`--r-xs: 3px` · `--r-sm: 5px` · `--r-md: 8px` · `--r-lg: 12px` · `--r-xl: 16px` · `--r-2xl: 24px` · `--r-pill: 9999px`

### Shadows

```
--shadow-brass: 0 0 20px rgba(199,162,76,0.22)   ← chart / data emphasis
--shadow-accent: 0 0 20px rgba(107,127,219,0.28)  ← interactive focus glow
```

### Motion

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | 100ms | Micro-interactions |
| `--dur-normal` | 180ms | Most transitions |
| `--dur-slow` | 320ms | Panel opens |
| `--dur-gentle` | 480ms | Scroll reveals |
| `--dur-orbital` | 700ms | Hero entrances |

Easings: `--ease-out`, `--ease-in`, `--ease-inout`, `--ease-spring` (bounce), `--ease-decel`

---

## 8. Writing Voice

- **Educational, never fatalistic.** "Saturn in the 7th house activates partnership themes" — not "Saturn will damage your marriage."
- **Sanskrit first, English second.** "Shani / Saturn", "Guru / Jupiter"
- **Precision over mysticism.** Cite actual placements, dignities, house meanings — always grounded in the knowledge base.
- **Hedged.** The chart is a map, not a verdict.

---

## 9. Dark-Only

No light mode. `prefers-reduced-motion` must be respected throughout (zero/near-zero animations when set).

---

## 10. Deferred (Phase 2)

- GrahaIcon wiring into NorthIndianChart, ExplorePanel, ProfileCard, TransitsTab
- Button primitive + design system components
- GSAP motion system (orchestrated/scroll-driven sequences — `gsap` 3.15 is already installed)
- Lesson card component
- Onboarding reveal flow
- `/explore-3d` full implementation
- `lib/three/grahaMaterials.ts` — shared 3D material config
- Non-Lahiri ayanamsha selection UI
