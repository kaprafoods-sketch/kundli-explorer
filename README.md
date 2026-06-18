# Kundli Explorer

> **"Learn astrology through your own kundli."**  
> An educational Vedic astrology tool — not a prediction service.

## Tech stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS 4** + CSS custom properties design token layer
- **Prisma** + **Supabase Postgres** (single provider)
- **Swiss Ephemeris** (`sweph` 2.10) — server-side only, Lahiri ayanamsha
- `geo-tz` + `luxon` — timezone/DST-correct UTC conversion
- Open-Meteo geocoding API — free city search
- **Anthropic** `claude-sonnet-4-6` — streamed AI tutor grounded in the chart

## Setup

### 1. Prerequisites

- Node 20+
- Supabase project `kundli-explorer` (already provisioned: id `wquhomkjpqzzpysvmoaz`, region `ap-south-1`)

### 2. Get your database password

Go to [Supabase Dashboard](https://supabase.com/dashboard) → kundli-explorer project → **Settings → Database → Connection string**.

Copy the password and fill in `.env`:

```
DATABASE_URL="postgresql://postgres.wquhomkjpqzzpysvmoaz:[YOUR_DB_PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[YOUR_DB_PASSWORD]@db.wquhomkjpqzzpysvmoaz.supabase.co:5432/postgres"
```

The database schema is **already applied** via Supabase MCP. You only need `migrate dev` if you change the Prisma schema.

### 3. AI Tutor (optional)

Add to `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```
Without it, the tutor shows a friendly "add your API key" message instead of erroring.

### 4. Run

```bash
npm install
npx prisma generate
npm run dev
```

## Engine validation

```bash
npm test
```

Asserts:
- (a) Every sidereal longitude differs from tropical by **23–25°** — proves Lahiri is applied (the #1 silent bug is shipping a tropical chart).
- (b) Reference birth placements match precomputed expected values.
- (c) Full D1 is printed to stdout for manual spot-check.

**Manual verification:** compare the printed reference chart against [AstroSage](https://www.astrosage.com/free/online-birth-chart.asp) with Lahiri ayanamsha.

## Reference chart (engine spot-check)

| Field | Value |
|-------|-------|
| Name | Reference |
| Date | 1985-01-01 |
| Time | 08:00 |
| Place | New Delhi (28.6139°N, 77.2090°E) |

## Route map

| Route | Description |
|-------|-------------|
| `/` | Landing + birth-data form |
| `/chart/[id]` | Chart Explorer — Chart · Learn · Transits · Tutor |
| `/explore-3d` | **[STUB]** Phase-2 three.js orbital hook |

## Licensing

See `LICENSING.md` — Swiss Ephemeris is AGPL/commercial dual-licensed. Resolve before monetising.

## Architecture notes

- Engine runs **server-side only** — client never sees `sweph`.
- Interpretations are **composed at runtime** from `jyotish-knowledge-base.json`. No canned 1296-combination lookup.
- Ephemeris data files (`ephe/*.se1`) are bundled into Vercel functions via `outputFileTracingIncludes`.
