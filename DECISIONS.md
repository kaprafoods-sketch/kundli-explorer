# GRAHA v2 — Decisions Log

Rationale, not just outcome. The next session needs to know *why*, or it will undo this.

---

## Wave 0.5 — Reconciliation Patch (feat/i18n-language-switcher @ 4fdab18)

The v2 master prompt was authored against `main@f9dba06`. This branch has diverged.
Verification by direct file read disproved several of its §2 invariants and §3 "repo
facts." The master prompt (`V2-MASTER-PROMPT.md`) was **amended in place** rather than
mentally patched at read time — a spec you must correct while reading is a liability that
compounds with every agent that reads it.

### Divergence table (master-prompt claim → verified reality, at 4fdab18)

| Claimed | Verified |
|---|---|
| `GrahaAI.tsx` 1,479 lines, a 2nd competing **chat** surface in `ChartExplorer` next to `GrahaAILauncher` | 1,514 lines, **not a chat surface** — the "Astro Guru" deterministic KB browser. Renamed → `components/KnowledgeBrowser.tsx`. Rendered in `GrahaAIDock`. `ChartExplorer` imports only the *type*. |
| `GrahaAILauncher` exists | Does not exist — already folded into `GrahaAIDock`. |
| Two competing AI chat impls coexist | Already resolved. `GrahaAIDock` = one dock, two tabs: "AI Astrologer" (`GrahaAIChat`, the only AI surface) + "Astro Guru" (`KnowledgeBrowser`, zero model calls). |
| KB has no `hi` fields | 33 `hi` fields already present (9 grahas + 12 rashis + 12 bhavas). |
| `lib/i18n/*` + `LanguageSwitcher` net-new | Already built: `lib/i18n/{config,messages}.ts`, `components/i18n/{LanguageProvider,LanguageSwitcher}.tsx`, `getName()` in `lib/kb.ts`. |
| `lib/suggestQuestions.ts` net-new | Already exists. |
| Feedback net-new in Wave 2 | `components/chart/ReadingFeedback.tsx` (148 lines) already exists; `app/api/graha-ai/feedback/route.ts` exists. |
| AI layer is Gemini; client `lib/gemini.ts` | Swapped to **OpenRouter** (`lib/openrouter.ts`); `/api/graha-ai` imports it. `lib/gemini.ts` is dead. |

Discovered during verification (not in the master prompt):
- **Nakshatra hole.** No `nakshatras` collection in the KB (still under `_next_layers`).
  `NAKSHATRA_NAMES` + `NAKSHATRA_LORDS` were TS literals in `lib/astro/computeChart.ts`.
  `PlanetReadingSheet` + `ExplorePanel` rendered nakshatras via `slug.replace(/_/g," ")` +
  CSS `capitalize` — structurally unreachable by the language switcher (English slug in HI/SA).

### Decisions

- **D1 — `GrahaAI.tsx` retained, renamed `KnowledgeBrowser.tsx`.** Master-prompt STABILIZE
  task 3 ("delete the duplicate chat") is **void** — the duplicate was already resolved last
  session. The file is the shipped Astro Guru KB browser (makes **zero** AI/network calls —
  verified). Deleting it drops a feature, which STABILIZE's own charter forbids. Rename exists
  so the *next* session does not rediscover this confusion and delete it. The user-facing tab
  label "Astro Guru" is unchanged.

- **D2 — `TutorMessage → Message` is a Prisma `@@map` rename only; no DDL rename.** Prior
  authorization to "apply the migration live" authorized *using the real DB*, not irreversible
  DDL. The DB is live and RLS is off; a cosmetic table rename is maximum risk for zero benefit.
  All AUTH migration work is additive + nullable. The `Conversation` cutover / any NOT NULL /
  backfill is deferred to a separate later migration. See T4 in `V2-MASTER-PROMPT.md`. **Hard
  stop S1 stands: print `prisma migrate diff` SQL and wait for approval of *that SQL* before any
  DDL hits the live DB.**

- **D3 — Nakshatras moved into the KB** as an ordered array of 27 (`index/id/en/sanskrit/hi/
  pada_count`). Order is load-bearing (`nakshatraOf` indexes by position). `id` slugs are
  byte-identical to the old `NAKSHATRA_NAMES` (saved chart rows depend on them). `NAKSHATRA_LORDS`
  is now **derived** `[...vimshottari.order ×3]`, never authored — the old literal was exactly
  that, hand-duplicated. **Guard verified before deletion:** derived array === old literal,
  element-wise (`[ketu,venus,sun,moon,mars,rahu,jupiter,saturn,mercury] ×3`). A new test asserts
  it so `vimshottari.order` edits can't silently drift the dasha start lord.

- **D4 — For nakshatras, `sanskrit` (sa) == `hi`, both Devanagari. INTENTIONAL, not an omission.**
  Nakshatra names are *tatsama* — Hindi borrows them from Sanskrit unchanged. §6 of the patch
  supplied Devanagari for the combined "sa / hi" column; both fields carry it. **Consequence:**
  in SA mode nakshatras render in Devanagari while grahas/rashis render Roman transliteration
  (their `sanskrit` fields are Roman). This is the patch author's explicit choice (D4 + "do not
  generate Devanagari yourself / do not fabricate a field you were not given"). **Do not "fix"
  this by inventing a Roman nakshatra transliteration.**

- **D5 — Wave 1/2 briefs for I18N, SUGGEST, FEEDBACK are reconcile-and-extend, not create.**
  Each targets an existing module. Stale "(new)" markers in the charters were corrected in
  `V2-MASTER-PROMPT.md` §5, with a binding banner. AGENT-3D is unaffected.

- **T5 finding — DB path is server-only; no client-reachable Supabase key.** `lib/supabase.ts`
  uses `SUPABASE_SERVICE_KEY` (service-role, **not** `NEXT_PUBLIC_*`). All 4 client components
  that touch it import **types only** (`import type { ChartRow }`) — erased at build, so no
  runtime client reaches the browser. The runtime data path is supabase-js with the service key,
  server-side (server components / actions / API routes), satisfying invariant §2.6. The service
  key bypasses RLS, so RLS-off is **not** a client-exposure risk (the S3 breach scenario — anon
  key + client-reachable + RLS off — does not exist here). **AUTH may proceed.** When AUTH adds
  per-user charts, ownership must be enforced in server code (userId / ownerToken filters), since
  RLS is not the guard. AGENT-AUTH must also reconcile that the live data path is supabase-js,
  not Prisma queries.

### Judgment calls

- Nakshatra KB entries use field name `sanskrit` (not `sa`) to mirror the existing grahas/rashis
  schema and stay compatible with `getName()` (which reads `.sanskrit` for `lang==="sa"`). The
  patch's "sa" in the field list is shorthand for the Sanskrit field; "mirror the grahas schema"
  and "use the same i18n accessor" both require `sanskrit`.
- Nakshatra display resolves the KB entry by `id` slug (`kb.nakshatras.find(n => n.id === …)`)
  rather than by `nakshatraIndex`, so pre-existing saved chart rows (which may predate the
  `nakshatraIndex` field) still render correctly. Falls back to the raw slug only if lookup fails.
- KB JSON was full-reserialized (`indent=2, ensure_ascii=False`); verified every pre-existing key
  is byte-identical afterward — the only change is the added `nakshatras` block (218 insertions).

### Wave 0.5b — Lint pass (get §8 "lint clean" green before Wave 1)

The 22 lint errors were all pre-existing (verified: identical count at clean HEAD; Wave 0.5 added
zero). Reshav chose "fix lint first." All 22 errors + 15 warnings fixed → lint now **0/0**; build +
9 tests still green; homepage 3D + chart verified in-browser (no console errors). Real fixes, not
suppressions, except three justified per-line disables (native/legitimate patterns):

- **Reduced-motion (4× `set-state-in-effect`)** → extracted shared `lib/hooks/useReducedMotion.ts`
  using `useSyncExternalStore` (React-idiomatic external-store read; SSR-safe; no setState-in-effect).
  Replaced the 4 duplicated inline hooks (AnimatedIcon, KnowledgeBrowser, SolarSystemHero, PlanetsTab).
- **`Math.random` in `useMemo` (9× `purity`)** → added `lib/rng.ts` (`mulberry32` seeded PRNG).
  SolarSystemHero initial angles + PlanetsTab two star-fields now deterministic → pure/idempotent AND
  SSR-stable (no hydration reshuffle). A genuine improvement, not a workaround.
- **PlanetsTab R3F `home` mutation (2× `immutability`)** → rewrote the "earth" element branch to rotate
  from the immutable original position by absolute time `t` instead of mutating `home` each frame.
  Also framerate-independent. No buffer-of-a-hook mutation.
- **GrahaAIChat streaming (1× `immutability`)** → removed the render-captured `accumulated` variable;
  the assistant message now accumulates inside the functional `setMessages` update (append chunk to
  last message content).
- Trivial: `<a href="/">` → `<Link>` (explore-3d, not-found); `let`→`const`; removed unused
  vars/imports and 2 stale eslint-disable directives; dropped the unused `lat/lon` params of the
  callerless `computeTropicalPositions`.
- **Justified per-line disables (3)** — not blanket check-disabling:
  - `computeChart.ts` + `transits.ts`: `require("sweph")` — native CJS addon, lazily loaded
    server-side only. Matches the repo's own precedent (`__tests__/engine.test.ts` already disables
    `no-require-imports` for this exact module). ESM-importing a native binding that must stay
    external + lazy is higher-risk than the established convention.
  - `TransitsTab.tsx`: initial data fetch on mount — the loading flag is genuine external-sync state,
    not derivable; a canonical legitimate effect.

## Wave 1 — Four parallel agents (AUTH · I18N · SUGGEST · 3D)

All four ran as parallel subagents on disjoint manifests; orchestrator integrated + gated.

- **AUTH**: @supabase/ssr (Google OAuth + magic link), `getSession()` single accessor,
  chart claiming on callback (kx_owner → userId, then cookie cleared), ownership enforced
  server-side (userId OR ownerToken). Schema additive-only; `Message = @@map("TutorMessage")`.
  **S1 held: migration SQL printed, NOT applied** (also: sandbox could not reach the DB;
  Prisma 7 dropped --from-url so the diff was produced schema-vs-schema — the pre-edit schema
  is the live shape). Deviations accepted: `proxy.ts` instead of `middleware.ts` (Next 16
  renamed the convention — AGENTS.md says heed deprecations); `Feedback` table included
  (D7: Wave-2 FEEDBACK consumes it; new empty table, zero risk).
- **I18N**: the layer already existed and was correct; the one real gap was that
  LanguageSwitcher was never mounted (now in chart header). ~16 chrome keys added
  (en+hi complete; sa only where established, else `// TODO sa`). New i18n test file (12).
- **SUGGEST**: bank of 35 (5×7 life areas) in lib/questionBank.ts; engine extended
  (multi-entity grounding + ≥3-area diversity constraint); chips were already wired.
  New tests (4). Engine stays pure/deterministic.
- **3D**: /explore-3d is now a real logged-out page (sample chart, AI auto-disabled via
  empty chartId); camera fly-to + 12 bhava sectors → dual-mode PlanetReadingSheet fed by
  composeHouseReading — one interpretation source across 2D/chat/3D.
- **Orchestrator integration fixes**: (1) AuthButton moved top-LEFT (LanguageSwitcher owns
  top-right; they collided). (2) **Key-later guard for auth** (`lib/auth/config.ts:authConfigured()`)
  — proxy.ts skips refresh, AuthButton renders null, /login shows a friendly notice,
  /auth/callback redirects instead of 500ing. Without this the WHOLE APP 500'd when
  NEXT_PUBLIC_SUPABASE_* are unset (proxy runs on every request) — mirrors the OpenRouter
  key-later pattern. (3) Stale "Lagna" brand on /login → "Graha".
- **Open integration item (→ Wave 3 / AGENT-DESIGN)**: 3D `onFocusChange` bubbles focus out of
  PlanetsTab/ClientPlanetsTab, but ChartExplorer doesn't yet pass it into GrahaAIDock (dock has
  no focus prop). Flagged by AGENT-3D; both files were outside its manifest.
- Gate: lint 0/0 · build clean (14 routes incl. /login, /auth/callback, Proxy) · tests 25/25
  (9 engine + 12 i18n + 4 suggest) · browser-verified /, /explore-3d, /login.
