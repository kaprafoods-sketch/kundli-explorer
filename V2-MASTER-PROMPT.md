# GRAHA v2 — Claude Code Master Prompt (Multi-Agent Build)

> Reconciled against feat/i18n-language-switcher @ 4fdab18 on 2026-07-13. §2 and §3 facts verified by direct file read, not assumed. Where the Wave-0.5 reconciliation patch and this document once conflicted, the patch won and its corrections are now folded in here.

**Repo:** `kaprafoods-sketch/kundli-explorer` · branch `feat/i18n-language-switcher` · HEAD `4fdab18`
**Mode:** Orchestrator + parallel subagents. You (the top-level Claude Code session) are the ORCHESTRATOR. Spawn subagents with the Task tool using the agent charters below, verbatim. Run agents within a wave **in parallel** — their file manifests are disjoint by design. Never let two live agents edit the same file.

---

## 0. How to run

1. Read `AGENTS.md` first and obey it: this Next.js 16 version differs from training data — read the relevant guide in `node_modules/next/dist/docs/` before writing any route, middleware, or server-action code.
2. Execute waves in order: **Wave 0 → Wave 1 → Gate → Wave 2 → Gate → Wave 3 → Final Gate.**
3. Wave gate = on `main` (or the integration branch) after merging all wave branches:
   ```bash
   npm run lint && npm run build && npm test
   ```
   All three must pass before the next wave starts. If a merge breaks the gate, fix forward inside the offending agent's scope — do not disable checks.
4. Each agent works on its own branch `v2/<agent>` (or worktree if you parallelize across terminals). Orchestrator merges in the order given in §6.
5. Each agent must end its run with: list of files created/modified/deleted, migration commands run, and a 5-line summary of what a reviewer should check.

---

## 1. Encoded decisions (flip these lines if Reshav disagrees — everything downstream assumes them)

| # | Decision | Value |
|---|---|---|
| D1 | Swiss Ephemeris licensing | **Unresolved — business action, not code.** Build all payments code but ship it behind `PAYMENTS_ENABLED=false` env flag. No live payments until Reshav picks Option B (commercial license) or C (engine swap). `sweph` stays confined to `lib/astro/*`, server-only, so Option C remains a one-directory swap. |
| D2 | Auth method | **Google OAuth (primary) + email magic link (fallback)** via Supabase Auth. Zero marginal cost, highest conversion on Indian Android. Phone OTP = post-revenue fast-follow, do not build now. |
| D3 | Free tier | Anonymous: 1 chart + 3 GRAHA AI questions (cookie-tracked). Free (authed): 3 charts, 10 questions/month. Plus ₹299/mo: unlimited questions, unlimited profiles, all future divisional charts. All numbers live in `lib/plans.ts` as one exported const — nothing hardcodes limits elsewhere. |
| D4 | Question bank storage | **In-code**, versioned next to the KB (`lib/questionBank.ts`), not a DB table. Same principle as the KB: curated content ships with the repo. |
| D5 | Monetization model | **Flat subscription via Razorpay Subscriptions.** No coin/wallet/per-message metering — per-message pricing structurally rewards vague re-engagement-bait answers, which is the Engine A failure mode this product explicitly rejects. |
| D6 | i18n library | **None.** Light homegrown: React context + `graha_lang` cookie + string dict. Only chrome strings + KB name resolution are needed; next-intl is overkill and Next 16 compat is unverified. |
| D7 | Schema strategy | **One schema event.** AGENT-AUTH lands the entire v2 Prisma schema in Wave 1 (User, Conversation, Message, Feedback, plan fields) even though Feedback/plan consumers arrive in Wave 2. One migration, zero wave-2 schema conflicts. |

---

## 2. Global invariants — every agent obeys these, no exceptions

1. **Runtime composition, never hardcoding.** All astrological meaning is composed at runtime from `jyotish-knowledge-base.json` via `lib/kb.ts` / `lib/interpret.ts`. No interpretation strings in components. No planet/sign/house name literals in JSX — resolve through the KB.
2. **Deterministic first, LLM second — and the LLM is OpenRouter.** (I-1) The AI layer is OpenRouter; client is `lib/openrouter.ts`; single endpoint `/api/graha-ai`. All prior Gemini invariants are void — do not import, reference, or recreate `lib/gemini.ts`. The model is only the conversational layer: it receives composed interpretations in its prompt and never invents placements, dignities, or aspects. (I-2) `GrahaAIChat` is the **only** AI surface in the application; any second component that makes a model call is a defect.
3. **`sweph` never leaves `lib/astro/*`** and never runs client-side.
4. **API keys server-side only.** `GEMINI_API_KEY`, Razorpay secrets, Supabase service key: server. Only `NEXT_PUBLIC_*` vars reach the client.
5. **KB is the single source of truth; terms flow through the i18n accessor.** (I-3) No astrological name may be hardcoded in a component or in `lib/` — interpretations are composed at runtime from the KB. (I-4) Every user-visible astrological term must be reachable through the i18n accessor (`getName`); string-munging a slug for display is a bug, not a shortcut. (I-5) Sidereal only — Lahiri ayanamsha, whole-sign houses, non-negotiable. (I-6) No fabricated probabilities, percentages, or confidence claims; composed signals only, and the banned-lexicon CI test stays green.
6. **No public PostgREST / Supabase REST surface.** All data access goes through server actions or Next API routes. (Competitor exposes their whole schema this way — we do not.)
7. **Sanskrit UI chrome policy:** established Sanskrit terms only; if none exists, fall back to English and mark `// TODO sa`. Fabricated pseudo-Sanskrit is prohibited. Sanskrit renders in Roman transliteration; Hindi renders in Devanagari.
8. **Voice:** educational, agency-focused, anti-fatalist. "This placement gives you the capacity for…" — never "this will make you…". Applies to question bank copy, UI microcopy, and prompts.
9. **Dark-only. `prefers-reduced-motion` respected** in any animation you touch.
10. **Design tokens only** — colors/spacing/type via the CSS custom properties in `globals.css` per `BRAND.md`. No raw hex in components.
11. **Data-preserving migrations.** Never let Prisma drop-and-recreate a table that has rows. Hand-edit migration SQL where renames/backfills are needed.
12. **Idempotency check before building:** if a file you're about to create already exists (e.g. someone landed `lib/suggestQuestions.ts` from a local branch), read it, reconcile, and extend — don't overwrite blind.

---

## 3. Repo facts (verified by direct file read on `feat/i18n-language-switcher@4fdab18` — trust these over the earlier master-prompt claims, over training priors, and over any inference)

**Corrections to the original (main@f9dba06) draft — each is a verified reversal:**

| Original draft claimed | Verified reality |
|---|---|
| `GrahaAI.tsx` — 1,479 lines, a **second competing chat surface**, rendered in `ChartExplorer` next to `GrahaAILauncher` | **1,514 lines. Not a chat surface.** Repurposed as the "Astro Guru" deterministic KB browser. **Renamed to `components/KnowledgeBrowser.tsx`** in Wave 0.5, rendered inside `components/chart/GrahaAIDock.tsx`. `ChartExplorer` imports only the *type* `ChartPlacements`. |
| `GrahaAILauncher` exists | **Does not exist.** Already refactored away into `GrahaAIDock`. |
| Two competing AI chat implementations coexist | **Already resolved.** `GrahaAIDock` is a single unified dock with two tabs: "AI Astrologer" (`GrahaAIChat` — the *only* AI surface) and "Astro Guru" (`KnowledgeBrowser` — deterministic KB browser, zero model calls). |
| KB has no `hi` fields | KB has **`hi` on all 9 grahas + 12 rashis + 12 bhavas**, plus (as of Wave 0.5) a new ordered **`nakshatras`** collection of 27 with `en`/`sanskrit`/`hi`. |
| `lib/i18n/*` and `LanguageSwitcher` are net-new (AGENT-I18N) | **Already built:** `components/i18n/LanguageProvider.tsx`, `components/i18n/LanguageSwitcher.tsx`, `lib/i18n/config.ts`, `lib/i18n/messages.ts`, and `getName()` in `lib/kb.ts`. |
| `lib/suggestQuestions.ts` is net-new (AGENT-SUGGEST) | **Already exists.** |
| Feedback is net-new in Wave 2 (AGENT-FEEDBACK) | `components/chart/ReadingFeedback.tsx` — **already exists** (148 lines). |
| AI layer is Google Gemini; client is `lib/gemini.ts` | **False. Swapped to OpenRouter.** `/api/graha-ai` imports `lib/openrouter.ts`. `lib/gemini.ts` is dead. |

**Standing repo facts (verified current):**

- Routes: `/` (landing + BirthForm + SolarSystemHero, via `HeroLanding`), `/chart/[id]` (ChartExplorer: Chart · Planets · Transits tabs), `/chart/sample`, `/explore-3d` (**static stub — still the only stub**), `app/api/graha-ai` (+`/check`, +`/feedback`), `app/api/transits`.
- **DB access is server-only via `lib/supabase.ts`** using `SUPABASE_SERVICE_KEY` (a service-role key, **not** `NEXT_PUBLIC_*`). Client components import **types only** (`import type { ChartRow }`), never the runtime client. No anon/publishable key reaches the browser; the service key bypasses RLS, so RLS-off is not a client-exposure risk. All reads/writes go through server components, server actions, or API routes.
- Prisma models: `Chart` (has `ownerToken`, no `userId`), `TutorMessage`. `// TODO [STUB] User model + auth`. Note the runtime data path is supabase-js, not Prisma queries — AGENT-AUTH must reconcile this.
- Identity today: `kx_owner` cookie set by `app/actions/profiles.ts` / `createChart.ts`.
- 3D planets tab **already exists** inside the chart page (`PlanetsTab.tsx`, R3F) — `/explore-3d` is the only stub.
- `lib/lifeAreas.ts` exists — key the question bank off it.
- Nakshatras now live in the KB (`kb.nakshatras`, ordered 27). `NAKSHATRA_NAMES`/`NAKSHATRA_LORDS` literals were removed from `lib/astro/computeChart.ts`; lords are derived from `kb.vimshottari.order` × 3.
- Tests: `__tests__/engine.test.ts` via vitest (ayanamsha sanity + reference chart + nakshatra/lord-drift guards).
- `gsap` is installed but unused for orchestrated sequences.

---

## 4. Execution DAG

```
WAVE 0 (serial)      AGENT-STABILIZE
                          │
WAVE 1 (4 parallel)  AGENT-AUTH   AGENT-I18N   AGENT-SUGGEST   AGENT-3D
                          │  (AUTH is the long pole / critical path)
                        gate
WAVE 2 (2 parallel)  AGENT-PAY    AGENT-FEEDBACK
                        gate
WAVE 3 (serial)      AGENT-DESIGN
                     final gate
```

---

## 5. Agent charters

Spawn each as a subagent with its charter below as the full task description. Charters are self-contained.

> **Wave 0.5 D5 — RECONCILE-AND-EXTEND, not CREATE (binding for AGENT-I18N, AGENT-SUGGEST, AGENT-FEEDBACK).** Each of these targets a module that **already exists** on this branch: `lib/i18n/{config,messages}.ts` + `components/i18n/{LanguageProvider,LanguageSwitcher}.tsx` + `getName()` in `lib/kb.ts` (I18N); `lib/suggestQuestions.ts` (SUGGEST); `components/chart/ReadingFeedback.tsx` (FEEDBACK). Any "(new)" marker below for one of these paths is stale — read the existing implementation first, diff it against the brief, and add only what is missing. **Do not** rewrite a working module to match a brief written before it existed, and **do not** create a parallel file under the brief's original name (e.g. do not create `FeedbackBar.tsx` alongside `ReadingFeedback.tsx`, or `strings.ts`/`LangProvider.tsx`/`useLang.ts` alongside the existing i18n files — extend the existing ones). AGENT-3D is unaffected (`/explore-3d` really is a stub).

---

### AGENT-STABILIZE (Wave 0, serial, must complete before anything else)

**Mission:** One AI surface. Zero new features.

**Owns:** `components/GrahaAI.tsx` (delete), `components/chart/ChartExplorer.tsx`, `components/chart/GrahaAILauncher.tsx` (verify only).

**Tasks:**
1. `ChartExplorer.tsx` imports `type ChartPlacements` from the legacy file — relocate that type into `components/chart/ChartExplorer.tsx` (or a small `lib/types/chart.ts` if other files import it; grep first).
2. Remove the `<GrahaAI …/>` render and import from `ChartExplorer.tsx`. Delete `components/GrahaAI.tsx`.
3. Before deleting, diff the legacy component against `GrahaAIChat` for any capability that exists only in the legacy one (e.g. lesson content, specific focus modes). If found, port it into `GrahaAIChat` — do not silently drop features. List what you ported or confirmed redundant.
4. Verify `GrahaAILauncher` + `GrahaAIChat` cover planet / house / lagna focus contexts end-to-end against `app/api/graha-ai/route.ts`.
5. `grep -rn "GrahaAI\b"` must return only Chat/Launcher references.

**Acceptance:** lint + build + test pass; chart page renders with exactly one chat entry point; sample chart (`/chart/sample`) still renders with AI disabled.

---

### AGENT-AUTH (Wave 1 — critical path)

**Mission:** Supabase Auth (Google OAuth + magic link) and the complete v2 data model, with zero data loss for existing charts and messages.

**Owns (exclusive):** `prisma/schema.prisma` + migrations, `lib/auth/*` (new), `lib/db.ts`, `middleware.ts` (new), `app/(auth)/login/page.tsx` (new), `app/auth/callback/route.ts` (new), `app/actions/profiles.ts`, `app/actions/createChart.ts`, `app/api/graha-ai/route.ts` (DB-persistence code paths only), `app/page.tsx` (auth affordance in header only), `components/AuthButton.tsx` (new), `.env.example`.

**Must not touch:** `app/chart/[id]/page.tsx`, `GrahaAIChat.tsx`, `PlanetsTab.tsx`, `jyotish-knowledge-base.json` (other Wave-1 agents own these).

**Schema v2 (this block is the eventual TARGET shape; Wave 1 lands only the additive subset permitted by the T4 migration policy below — `Message` keeps `@@map("TutorMessage")` and its existing `chartId`; the `Conversation` cutover and any NOT-NULL constraints come in a later, separate migration):**
```prisma
model User {
  id           String   @id            // = Supabase auth uid
  email        String?  @unique
  planTier     String   @default("free") // 'free' | 'plus'
  locale       String   @default("en")
  razorpayCustomerId String?
  razorpaySubscriptionId String?
  planRenewsAt DateTime?
  createdAt    DateTime @default(now())
  charts       Chart[]
}

model Chart {           // existing — additive changes only
  // + userId String?  @index, relation to User
  // keep ownerToken String? during migration window
}

model Conversation {
  id        String   @id @default(cuid())
  chartId   String   @unique          // one thread per chart (matches current product behavior)
  createdAt DateTime @default(now())
  chart     Chart    @relation(fields: [chartId], references: [id], onDelete: Cascade)
  messages  Message[]
}

model Message {         // renamed from TutorMessage — DATA-PRESERVING
  id             String   @id @default(cuid())
  conversationId String   @index
  role           String
  content        String
  createdAt      DateTime @default(now())
  feedback       Feedback?
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
}

model Feedback {        // consumed by Wave-2 AGENT-FEEDBACK — create table now
  id        String   @id @default(cuid())
  messageId String   @unique
  resonance String?             // 'rings_true' | 'not_quite'
  utility   Boolean?
  reason    String?             // required in UI when resonance = 'not_quite'
  createdAt DateTime @default(now())
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
}
```

**Migration — ADDITIVE-ONLY (Wave 0.5 T4 supersedes the original destructive plan; this is binding):**
1. **`TutorMessage → Message` is a Prisma model rename ONLY, via `@@map("TutorMessage")`.** The database table stays `TutorMessage`; zero rows move; code gets `prisma.message`. Reversible by editing one line. **Do not** `ALTER TABLE ... RENAME`.
2. Everything else is **additive and nullable**: new `User` table; `userId String?` (nullable, FK) on `Chart` and `Message`; nullable rating fields on `Message`; nullable `interests` / `depth` / `intentNote` on `Chart`. The `Conversation` model and any move of messages under a NOT-NULL `conversationId` (with backfill and `chartId` drop) is **deferred to a separate, later migration** — Message retains its existing `chartId` for now.
3. **Forbidden in this migration:** `NOT NULL`, `DROP COLUMN`, `DROP TABLE`, `RENAME`, and any data backfill. Constraints tighten later, separately, after a backfill is run and verified.
4. **Before any DDL touches the live DB, print the generated SQL and STOP for human approval (hard stop S1):**
   ```bash
   npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script
   ```
   If that output contains `RENAME`, `DROP`, or `NOT NULL`, the schema is wrong — fix the schema, do not approve the SQL. Approval is of *that SQL*, not of the concept.
5. Runtime data path today is **supabase-js with the service key**, not Prisma queries. Reconcile: either wire Prisma for the new reads/writes or extend the supabase-js layer — but keep all DB access server-only (invariant §2.6).

**Auth implementation:**
- Use **`@supabase/ssr`** (NOT the deprecated auth-helpers): `createServerClient` / `createBrowserClient`, session refresh in `middleware.ts` per current Supabase Next.js App Router docs.
- Providers: Google OAuth + email magic link. `/login` page on brand tokens, minimal.
- On first authenticated request: upsert Prisma `User` keyed by Supabase uid.
- **Chart claiming:** if a signed-in user carries a `kx_owner` cookie, attach all charts with that `ownerToken` to their `userId` (one-time, then clear cookie). Anonymous chart creation stays fully working — auth is prompted at save/second-chart/paywall boundaries, never before the first chart. Do not break the sample-chart flow.
- `lib/auth/session.ts`: `getSession()` server helper returning `{ user | null }` — the single way every route reads identity.

**Gotchas:** raw-SQL backfill inside a Prisma migration file; Next 16 middleware conventions (read the bundled docs first); `pg` adapter already in use via `@prisma/adapter-pg` — keep it.

**Manual steps for Reshav (list in summary, do not attempt):** enable Google provider in Supabase dashboard + redirect URL; add `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel.

**Acceptance:** login/logout works locally with magic link (Google needs dashboard config — code path complete); existing dev-DB TutorMessage rows survive as Message rows under Conversations; anonymous chart → sign in → chart appears under the account; gate passes.

---

### AGENT-I18N (Wave 1)

**Mission:** en / hi / sa language layer — two-layer architecture, zero new dependencies (D6).

**Owns (exclusive):** `jyotish-knowledge-base.json`, `lib/kb.ts` (`getName` already exists — extend only), `lib/i18n/*` (**already exists** — `config.ts`, `messages.ts`; reconcile/extend, do not create `strings.ts`/`LangProvider.tsx`/`useLang.ts` as parallels), `components/i18n/LanguageSwitcher.tsx` + `components/i18n/LanguageProvider.tsx` (**already exist** — extend), `app/chart/[id]/page.tsx` (switcher already mounted — verify), `components/chart/NorthIndianChart.tsx` (label resolution only), `components/chart/ExplorePanel.tsx` (headings/labels only), `app/layout.tsx` (LangProvider already wrapped — verify).

**Tasks:**
1. **KB extension** — add `"hi"` (Devanagari) to all 9 grahas, 12 rashis, 12 bhavas. Use these exact strings, do not improvise spellings:
   - Grahas: Surya सूर्य · Chandra चन्द्र · Mangala मंगल · Budha बुध · Guru गुरु · Shukra शुक्र · Shani शनि · Rahu राहु · Ketu केतु
   - Rashis: Mesha मेष · Vrishabha वृषभ · Mithuna मिथुन · Karka कर्क · Simha सिंह · Kanya कन्या · Tula तुला · Vrishchika वृश्चिक · Dhanu धनु · Makara मकर · Kumbha कुम्भ · Meena मीन
   - Bhavas 1–12: लग्न भाव · धन भाव · पराक्रम भाव · सुख भाव · संतान भाव · रिपु भाव · विवाह भाव · आयु भाव · भाग्य भाव · कर्म भाव · लाभ भाव · व्यय भाव
2. `getName(entity, lang)` in `lib/kb.ts`: `en` → `.en`; `hi` → `.hi`; `sa` → `.sanskrit` (Roman transliteration — existing field). Fallback chain → `en`. Typed, unit-tested.
3. Chrome dict `lib/i18n/strings.ts`: keys for tab labels, form labels, buttons, section headings currently visible on `/` and `/chart/[id]`. `en` complete; `hi` complete in Devanagari; `sa` **only where an established Sanskrit term exists** — otherwise the value falls back to English and carries `// TODO sa` (invariant 7).
4. `LangProvider` (context) + `graha_lang` cookie persistence + `LanguageSwitcher` pill (EN / हि / SA) in the chart page header. Devanagari renders in the already-loaded Tiro Devanagari font.
5. Wire `getName` into `NorthIndianChart` planet/sign labels and `ExplorePanel` headings. Do not translate composed interpretation prose in this wave — names and chrome only.
6. Tests: `getName` fallback chain; dict has no missing `en` keys.

**Acceptance:** switcher flips graha/rashi/bhava names + chrome live without reload; no fabricated Sanskrit; gate passes.

---

### AGENT-SUGGEST (Wave 1)

**Mission:** `lib/suggestQuestions.ts` — deterministic, pure, unit-tested question-suggestion engine + starter chips in chat.

**Owns (exclusive):** `lib/suggestQuestions.ts` (**already exists** — reconcile/extend, do not recreate), `lib/questionBank.ts` (new), `lib/lifeAreas.ts` (extend only), `components/chart/GrahaAIChat.tsx` (starter-chip section only), `__tests__/suggestQuestions.test.ts` (new).

**Tasks:**
1. **Question bank (D4):** 35 questions, 5 per life area keyed to `lib/lifeAreas.ts`. Each entry: `{ id, areaId, text, entities: { houses?: number[], planets?: GrahaId[] } }`. Voice = Engine B (invariant 8). Calibration:
   - ✅ "What does my 10th house say about the kind of work that energizes me?"
   - ✅ "How does my Venus placement shape what I need in a partnership?"
   - ❌ "When will I get married?" → rewrite as "What does my 7th house suggest about how I approach commitment?"
   No question promises prediction, timing of fated events, or flattery.
2. **Scoring engine** — pure function `suggestQuestions(chart: NatalChart, opts?): RankedQuestion[]`:
   - Base score per question from its linked entities.
   - Liveness boosts: current mahadasha lord match (strong), antardasha lord (medium), dignity extreme on a linked planet (exalted/debilitated), retrograde linked planet, active transit conjunct/aspecting a linked natal placement (reuse `lib/astro/transits.ts` output — accept transits as an input param; do not import sweph here).
   - Diversity constraint: top-4 output spans ≥3 life areas.
   - Deterministic: same inputs → same order. No randomness, no Date.now() inside scoring (current dasha/transits arrive as inputs).
3. Replace the current hardcoded starter chips in `GrahaAIChat` with top-4 from the engine (focus-aware: when a planet/house focus is set, bias its linked questions).
4. Tests against a fixed chart fixture: dasha-lord boost ranks its questions first; diversity constraint holds; determinism (two calls, deep-equal).

**Acceptance:** engine is import-pure (no DB, no fetch, no sweph); chips render from it; tests green; gate passes.

---

### AGENT-3D (Wave 1)

**Mission:** Kill the `/explore-3d` stub. Promote the existing 3D planets experience into a standalone explorer + finish click-to-focus bhava insight flow.

**Owns (exclusive):** `app/explore-3d/page.tsx`, `components/chart/PlanetsTab.tsx`, `components/chart/ClientPlanetsTab.tsx`, `components/chart/PlanetReadingSheet.tsx`, `lib/three/*` (new, if scene extraction is needed). **Read-only:** `SolarSystemHero.tsx`, `lib/interpret.ts`, `lib/grahaColors.ts`.

**Tasks:**
1. Rebuild `/explore-3d` as a real page: renders the PlanetsTab experience on the **sample chart** (same computation as `/chart/sample`) for logged-out visitors, with a persistent CTA "Compute your own chart →". This is a marketing surface — it must work with zero auth, zero saved data.
2. In `PlanetsTab`: click planet → GSAP/drei camera fly-to → open `PlanetReadingSheet` fed by `composePlanetInterpretation`; add a bhava (house) focus mode fed by `composeHouseReading`. **One interpretation source, three surfaces** (2D chart, chat, 3D) — do not create a second interpretation path or any local meaning strings.
3. When a chartId exists (real chart, not sample), sync the 3D focus into `GrahaAILauncher`'s focus context so "Ask GRAHA AI about this" opens the chat pre-focused. Wire via the existing focus prop contract — read `GrahaAILauncher.tsx` before assuming its API.
4. Performance: lazy-load Three bundles (`next/dynamic`, `ssr:false` where required by Next 16 — check bundled docs), cap pixel ratio, `prefers-reduced-motion` → static camera + no idle orbit animation.
5. `drei` r-note: use `CameraControls`/`OrbitControls` from drei (installed), not raw THREE examples imports.

**Acceptance:** `/explore-3d` loads logged-out with interactive planets + composed readings; chart-page Planets tab has working fly-to + reading sheet + AI focus handoff; no interpretation literals; gate passes.

---

### AGENT-PAY (Wave 2 — starts after Wave 1 gate)

**Mission:** Subscription monetization (D3/D5), fully built, feature-flagged off (D1).

**Owns (exclusive):** `lib/plans.ts` (new), `lib/entitlements.ts` (new), `app/pricing/page.tsx` (new), `app/api/checkout/route.ts` (new), `app/api/webhooks/razorpay/route.ts` (new), `components/PaywallGate.tsx` (new), `app/api/graha-ai/route.ts` (quota enforcement insertion), `.env.example` (append).

**Tasks:**
1. `lib/plans.ts` — the only place limits exist:
   ```ts
   export const PLANS = {
     anon: { charts: 1, questionsTotal: 3 },
     free: { charts: 3, questionsPerMonth: 10 },
     plus: { charts: Infinity, questionsPerMonth: Infinity, priceInr: 299 },
   } as const;
   ```
2. `lib/entitlements.ts` server helper: `getEntitlements(session, req)` → `{ plan, questionsUsed, questionsLimit, canAsk, canCreateChart }`. Authed usage = count `Message` rows with `role='user'` this calendar month across the user's charts. Anonymous usage = signed `kx_q` cookie counter (soft limit — acceptable; the auth wall is the real gate).
3. Enforce in `app/api/graha-ai/route.ts` **before** the Gemini call: over-limit → `402` with a typed JSON body the chat UI renders as an upsell card (chat UI change is one small conditional in `GrahaAIChat` — coordinate: this is your only allowed touch outside your manifest, and only if AGENT-FEEDBACK hasn't started; otherwise hand the payload spec to the orchestrator for AGENT-FEEDBACK to wire).
4. **Razorpay Subscriptions** (not one-time orders): `app/api/checkout/route.ts` creates a subscription via server SDK using `RAZORPAY_PLAN_ID_PLUS`; client opens Checkout.js with `subscription_id`. Load checkout.js via script tag on `/pricing` only.
5. **Webhook** `app/api/webhooks/razorpay/route.ts`: read **raw body** (`await req.text()`), verify `X-Razorpay-Signature` = HMAC-SHA256(raw body, `RAZORPAY_WEBHOOK_SECRET`), constant-time compare. Handle `subscription.activated` / `subscription.charged` → `planTier='plus'`, set `planRenewsAt`; `subscription.halted|cancelled|completed` → downgrade to `free`. Idempotent by event id.
6. `/pricing`: transparent 2-column Free vs Plus on brand tokens, ₹ pricing, honest copy (invariant 8) — no dark patterns, no fake urgency. Visible link in landing header/footer.
7. **Feature flag:** `PAYMENTS_ENABLED` env (default `false`). When false: pricing page renders with "Coming soon" on the CTA; checkout + webhook routes return `503`; quota enforcement still active (quotas are product, payments are billing — decouple them).
8. Never store card data. Only Razorpay ids on `User`.

**Manual steps for Reshav (list, don't attempt):** create Plus plan in Razorpay dashboard → `RAZORPAY_PLAN_ID_PLUS`; set webhook URL + secret; add keys to Vercel; **resolve sweph licensing before flipping `PAYMENTS_ENABLED=true`**.

**Acceptance:** with flag off — pricing renders, quota enforced, 402 upsell path works, checkout/webhook return 503; with flag on + test keys — subscription lifecycle updates `planTier` (verified via Razorpay test webhook payloads replayed locally); gate passes.

---

### AGENT-FEEDBACK (Wave 2)

**Mission:** Resonance + utility feedback loop on AI answers (Feedback table already exists from Wave 1 — consume, don't migrate).

**Owns (exclusive):** `app/api/graha-ai/feedback/route.ts` (**already exists** — reconcile/extend), `components/chart/ReadingFeedback.tsx` (**already exists, 148 lines** — extend; do NOT create a parallel `FeedbackBar.tsx`), `components/chart/GrahaAIChat.tsx` (feedback wiring + 402 upsell card if handed off by AGENT-PAY).

**Tasks:**
1. `FeedbackBar` under each completed assistant message: step 1 — "Rings true" / "Not quite". Step 2 (only after step 1) — utility: "Did this help you understand or decide something?" yes/no.
2. **"Not quite" requires a reason** (highest-value training signal — never optional): reason chips `too vague · doesn't match me · confusing · wrong tone` + optional free text. Persist chip value into `Feedback.reason` (append free text).
3. `POST /api/feedback`: zod-validated `{ messageId, resonance?, utility?, reason? }`, upsert by `messageId`, ownership check (message → conversation → chart → user/ownerToken must match caller).
4. Optimistic UI, silent failure-retry, no layout shift, brand tokens, ~28px touch targets minimum.
5. If AGENT-PAY handed off the 402 payload spec: render the upsell card in `GrahaAIChat` linking to `/pricing`.

**Acceptance:** feedback persists and survives reload; "not quite" cannot submit without a reason; ownership enforced; gate passes.

---

### AGENT-DESIGN (Wave 3, serial — runs last because it touches shared surfaces)

**Mission:** The BRAND.md "Deferred" list + mobile-first pass + integration QA. No new features.

**Owns:** `components/ui/Button.tsx` (new), icon wiring in `NorthIndianChart` / `ExplorePanel` / `ProfileCard` / `TransitsTab` (GrahaIcon/HouseIcon replace text glyphs), `globals.css` (motion tokens usage only — no token value changes), chart-page header (add auth affordance deferred from Wave 1), plus surgical mobile fixes anywhere.

**Tasks:**
1. `Button` primitive (primary/secondary/ghost sizes sm/md) on brand tokens; sweep raw `<button>`/`<a>` CTAs on `/`, `/pricing`, `/login`, chart header onto it.
2. Wire `GrahaIcon`/`HouseIcon` per BRAND.md §6 into the four components listed.
3. GSAP motion pass using the `--dur-*`/`--ease-*` tokens: chart-page section reveals, sheet open/close, launcher entrance. Every animation gated on `prefers-reduced-motion`.
4. Mobile-first pass at 390px across `/`, `/chart/[id]` (all tabs), `/explore-3d`, `/pricing`, `/login`: no horizontal scroll, ≥44px touch targets on primary actions, language switcher + launcher don't collide, wheel pickers usable.
5. Integration QA sweep (report, fix in-scope, escalate out-of-scope): full journey anonymous → chart → 3 questions → auth wall → login → claim → 10/month quota → 402 → pricing; language switch on every surface; sample chart unaffected by quotas.

**Acceptance:** journey clean at 390px and 1440px; reduced-motion audit passes; final gate green.

---

## 6. Merge order & gates

1. `v2/stabilize` → gate.
2. Wave 1: merge `v2/auth` **first**, then `v2/i18n`, `v2/suggest`, `v2/3d` (rebase each on the growing integration state; manifests are disjoint so conflicts should be near-zero — if one appears, the later-merging agent resolves within its own files). → gate.
3. Wave 2: `v2/pay` then `v2/feedback` (both touch `GrahaAIChat` — PAY only if handoff triggered; otherwise zero overlap). → gate.
4. `v2/design` → **final gate**.

---

## 7. Definition of done (orchestrator verifies every line)

- [ ] `lint`, `build`, `test` green on final integration.
- [ ] `grep -rn "GrahaAI\b"` → only `GrahaAIChat`/`GrahaAILauncher`.
- [ ] Existing charts + tutor messages intact post-migration (row counts reported).
- [ ] Login (magic link) → chart claiming works; anonymous first-chart flow unbroken; `/chart/sample` unaffected.
- [ ] EN/हि/SA switcher live on chart page; zero fabricated Sanskrit; `// TODO sa` markers where applicable.
- [ ] Starter chips come from `suggestQuestions` and are deterministic + tested.
- [ ] `/explore-3d` is a real interactive page, logged-out safe.
- [ ] Quotas enforced per `lib/plans.ts`; 402 → upsell → `/pricing`; `PAYMENTS_ENABLED=false` everywhere by default.
- [ ] Feedback persists; "not quite" reason is mandatory.
- [ ] `.env.example` documents every new var: Supabase (2), Razorpay (4 incl. plan id + webhook secret), `PAYMENTS_ENABLED`.
- [ ] Manual-steps list for Reshav compiled from all agents (Supabase Google provider, Razorpay dashboard, Vercel envs, **sweph license decision before payments go live**).
