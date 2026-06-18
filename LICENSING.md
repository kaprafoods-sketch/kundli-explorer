# Licensing — Swiss Ephemeris

This app uses **Swiss Ephemeris** (via the `sweph` npm package) for astronomical calculations.

Swiss Ephemeris is dual-licensed by Astrodienst AG:

## Option A — Open Source (AGPL / GPL)
If this repository is published as open source under **AGPL v3 or GPL v2+**, Swiss Ephemeris may be
used at no cost. This means users who receive the software must also be able to receive its source code
under the same licence terms.

## Option B — Commercial Licence
If this product is deployed as a **closed-source or proprietary** service (including SaaS), you need
to purchase a commercial licence from Astrodienst:
→ https://www.astro.com/swisseph/swephinfo_e.htm#licencing

## Option C — Swap the engine
Replace `sweph` with an MIT-licensed ephemeris (e.g., `astronomia`, `ephem.js`) or a hosted
calculation API (e.g., AstrologyAPI.com, Prokerala API). This avoids the GPL copyleft entirely.

---

**TODO (must resolve before monetising):** Decide which path this repo takes. Currently the code
compiles and runs without a commercial licence, but deploying a paid product without choosing Option B
or C would be a licence violation.

Swiss Ephemeris authors: Dieter Koch & Alois Treindl, Astrodienst AG.
