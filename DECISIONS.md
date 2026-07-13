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
