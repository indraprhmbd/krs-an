# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Hard rules (non-negotiable)

- **NO emojis** anywhere: UI copy, code, comments, commits.
- **NO em dashes or en dashes** (`—` / `–`). Use a plain hyphen or reword.
- **ALWAYS use the design tokens.** Never a numbered palette colour (`bg-slate-100`), never an arbitrary type size (`text-[9px]`), never a raw colour value at a call site. Semantic utilities and role tokens only. See Design tokens and Typography.

## Project

KRSan — course schedule (KRS) planner for Indonesian university students. Users pick courses; the app generates conflict-free schedule permutations, either locally (backtracking search) or via AI (Groq/LangChain in a Convex action).

## Commands

```bash
npm run dev              # Vite dev server (frontend only)
npx convex dev           # Backend sync + codegen — MUST run in a second terminal
npm run build            # tsc -b && vite build
npm run lint             # eslint .
npm run check:contrast   # WCAG guard on the colour tokens (see Design tokens)
npm run check:typography # guards the type scale (see Typography)
npm run check:i18n       # guards the translation maps (see i18n)
npm run gen:icons        # regenerate src/components/ui/icon.tsx
npm run preview          # serve dist/
```

`npm run build` and `npx convex dev` typecheck through **different tsconfigs** and do not catch the same errors. `tsconfig.app.json` covers `src` + `convex` for the bundle; `convex/tsconfig.json` is what Convex itself enforces. A `convex/` type error can pass `npm run build` and still fail `npx convex dev`. Run both.

No test framework is configured. There is no test runner, so "run the tests" is not currently possible.

`convex/_generated/` is produced by `npx convex dev` — never edit it by hand. If `api.*` types look stale or missing, the Convex dev process isn't running.

## Environment

`.env.local` needs `VITE_CONVEX_URL` and `VITE_CLERK_PUBLISHABLE_KEY` — `src/main.tsx` throws at startup if either is missing. `VITE_AI_API_URL` points at an external AI-cleanup service used only by the Intelligence Scraper. Note the README says `NEXT_PUBLIC_CONVEX_URL`; that is wrong — the code reads `VITE_CONVEX_URL`.

`GROQ_API_KEY` is a **Convex deployment env var** (set via the Convex dashboard, not `.env.local`) — it's read inside the `convex/ai.ts` action, which runs server-side.

`SUMOPOD_API_KEY`, `SUMOPOD_BASE_URL`, `SUMOPOD_MODEL` are also Convex deployment env vars, read inside `convex/ai.ts`. They front an OpenAI-SDK-compatible aggregator (SumoPod) as the first tier of Smart Generate, ahead of Groq. Leaving any of the three unset disables that tier and the action falls straight to Groq — none of them are ever hardcoded.

Clerk JWT issuer domains are hardcoded in `convex/auth.config.ts` (dev + `clerk.krsan.web.id`). A new Clerk instance needs its domain added there.

## Architecture

### Provider chain

`main.tsx`: Clerk → `ConvexProviderWithClerk` → React Query → BrowserRouter → LanguageProvider → App. Convex auth is driven by Clerk's `useAuth`, so any Convex query gated on auth must use `useConvexAuth()`'s `isAuthenticated`, not Clerk's `isSignedIn` — they resolve at different times, and querying too early sends an unauthenticated request. Pass `"skip"` as args until authenticated.

`App.tsx` calls `api.users.ensureUser` on every auth transition. That mutation is the user lifecycle: it creates the row, resets daily credits (5/day, keyed to **WIB = UTC+7** date strings), and contains a three-tier identity-recovery path (by `tokenIdentifier` → by `email` → by Clerk subject suffix of `issuer|subject`) so that migrating Clerk domains doesn't orphan existing users. Preserve all three tiers when touching it.

### Public by default

**The app is not behind a login wall.** Configuring, selecting courses, generating schedules (`src/lib/scheduler.ts`) and the plan archive all work anonymously. `admin.ts`'s `listMasterCourses` / `listCurriculum` have no auth check by design.

Only three things need an account, and each is gated at its call site via `useRequireAuth()` (`src/hooks/useRequireAuth.ts`), never by hiding UI:

- sharing a plan (needs a server row for the link to target)
- Smart Generate (spends a credit)
- expanding the plan limit (spends a credit)

Do not reintroduce a global auth gate. If you add a feature, assume anonymous unless it spends a credit or needs a server-side identity.

`usePlanArchive()` (`src/hooks/usePlanArchive.ts`) is the archive for both cases: Convex when signed in, `localStorage` (`krs-local-archive`, same 30 cap) when not. **Call sites should not branch on auth** — they read `plans` and call `savePlan`/`deletePlan`/`renamePlan`. On sign-in, `App.tsx` offers to import local plans via `migrateLocalPlans()`. The offer is always prompted, never automatic: the plans are the user's.

**The hook filters unreadable rows, and that is load-bearing.** Plans are stored as a JSON string, and `convex/plans.ts` returns `data: null` for a row that fails to parse rather than throwing. `ArchivedPlan` used to declare `data: Plan` while the hook cast the query result to match, so the null was laundered away and `plan.data.courses` threw a TypeError that took down the entire archive screen — the two backends agreed on the happy path and disagreed on the failure. The types are split now: `RawArchivedPlan` (`data: Plan | null`) is what a backend returns; `ArchivedPlan` is what the hook emits after `isUsable()`. **Consume `ArchivedPlan`; never cast a query result to it.** `corruptCount` reports what was dropped so it can be surfaced rather than silently vanishing, and migration skips corrupt rows instead of copying the problem into Convex.

### Two schedule generators

1. **Local** — `src/lib/scheduler.ts`. Groups courses by `code`, shuffles each group, backtracks with early conflict pruning via `checkConflicts` (`src/lib/rules.ts`), collects `limit * 4` candidates, scores them (day spread, max daily load, 07:00 classes, ≤8 SKS/day heuristic), returns the top `limit`. Free — no credits.
2. **AI** — `convex/ai.ts` `smartGenerate` action. Costs 1 credit, 30s DB-backed rate limit. Flow: auth → credit check → payload minification (fields shortened to `n`/`s`/`c`/`k`/`l`/`t` to cut tokens) → MD5 cache lookup in `ai_cache` → `groq-sdk` call with native `response_format: { type: "json_schema" }`, schema generated by zod 4's `z.toJSONSchema()` → `PRIMARY_MODEL` with fallback to `FALLBACK_MODEL` → **server-side reconstruction**: the model returns only course IDs, and the server maps them back through a courseMap, so a hallucinated ID is dropped rather than trusted. Credit is only consumed if ≥1 plan survives reconstruction.

Model IDs are constants at the top of `convex/ai.ts`. Groq shut down the previous `llama-3.3-70b-versatile` / `llama-3.1-8b-instant` pair on **2026-08-16**; they are now `openai/gpt-oss-120b` and `openai/gpt-oss-20b`. Keep primary and fallback in different model families so one deprecation cannot kill both. Check <https://console.groq.com/docs/deprecations> before assuming a model still exists.

There is a third, earlier tier: SumoPod (an OpenAI-SDK-compatible aggregator, `SUMOPOD_BASE_URL`/`SUMOPOD_MODEL`/`SUMOPOD_API_KEY`), tried before the Groq pair. **It is deliberately called via a forced tool call (`tools` + `tool_choice`), never `response_format`.** MiniMax's M2.x model family (what SumoPod fronts here) has a documented, recurring gap where `response_format: json_schema`/`json_object` is silently ignored on its OpenAI-compatible endpoint — no error, just unconstrained free text that may not even be JSON. A single strict-mode tool call gets the same schema-constrained result reliably. Do not "simplify" this back to `response_format` to match the Groq path; they are different providers with different structured-output guarantees. Any failure at this tier (missing env var, bad key, malformed tool call) falls through silently to the Groq pair, so the feature never hard-fails just because SumoPod is unreachable.

`ai_cache` has two access paths, and the split is deliberate. `checkCache`/`saveCache` are `internalQuery`/`internalMutation` reachable only from the `smartGenerate` action. `checkScraperCache`/`saveScraperCache` are public but call `checkAdmin` — they exist for the Intelligence Scraper, which caches results from the external AI service. Do not make the cache publicly writable; an anonymous writer could poison it for every user.

`convex/ai.ts` uses `groq-sdk` directly, not LangChain. LangChain was removed: it was 30 MB to serve one API call, its `ChatPromptTemplate` interpolated nothing, and it was the sole reason the file needed a `globalThis.performance` polyfill in the Convex runtime. Do not reintroduce it without a reason that outweighs that.

### Data model (`convex/schema.ts`)

- `master_courses` — every offered class section (one row per code+class). Has a search index `search_courses` on `name` filtered by `prodi`.
- `curriculum` — which course codes belong to which `prodi`+`semester`; drives the selection UI.
- `plans` — saved plans stored as a **JSON string** in `data`. Every read site must `JSON.parse` inside try/catch (see `convex/plans.ts`); a corrupt row returns `data: null` rather than throwing.
- `ai_cache`, `audit_logs`, `usage_logs` — cache by MD5 hash, admin audit trail, credit-spend log.

`prodi` is a free-text string used as a key everywhere. It is normalized as `.toUpperCase().trim().replace(/\.$/, "")` at every write path (`bulkImportMaster`, `getProdiConfig`, `fixProdiFormatting`). Any new prodi write must apply the same normalization or the row becomes invisible to the `by_prodi` index lookups.

### Academic period

`src/lib/period.ts` declares the running term (`ACADEMIC_YEAR`, `CURRENT_TERM`). **Update it at the start of each term.** It replaced `2025/2026` hardcoded in three places that could drift (both `LanguageContext` maps and an inline string in `ScheduleSelector`).

Indonesian universities run Ganjil (Odd: semesters 1/3/5/7) and Genap (Even: 2/4/6/8). **The semester number already encodes the parity**, so there is no separate fact to store. `curriculum.term` tried to store it anyway, derived as `semester % 2`, and was never filtered or indexed — only shown in one admin column. It is deprecated and `v.optional`; run `admin.dropCurriculumTerm` once, then it can leave the schema. It cannot simply be deleted: Convex validates stored documents on push and rejects the deploy if one carries a field the schema does not declare.

The **student** planner offers only `validSemesters()`; the **admin** dropdowns deliberately keep all 1-8, because an admin imports next term's curriculum before it starts. Do not "fix" the admin ones.

`coerceSemester()` is not optional. A returning user has a semester persisted in `krs-session-profile` from a previous term, so changing the default only affects first-time visitors; a stored `2` during an Odd term matches no `SelectItem` and Radix renders the Select empty. Read through the coercion rather than writing back, so a student's stored choice is not silently rewritten by a page load.

### Limits

Credits 5/day (WIB reset). Plan archive cap 30. `planLimit` starts at 12, `type: "expand"` on `generateServiceToken` grows it +12 up to 36. Smart Generate rate limit 30s. These are enforced server-side; the UI mirrors them.

### Admin

`checkAdmin(ctx)` is duplicated in both `convex/admin.ts` and `convex/users.ts` — every admin mutation must call it; there is no automatic gating. The **first user ever created becomes admin** (`firstUser` check in `ensureUser`). `makeAdmin` requires an existing admin. Admin mutations should `logAudit` (`convex/audit.ts`).

Admin data flows live in `src/components/admin/hooks/` (`useMasterData`, `useCurriculumData`) — paginated Convex queries with a 300ms debounced search, not inline in the components.

### Design tokens

All theme values live in `src/index.css`. There are three parts and the order matters:

1. `:root` / `.dark` hold the raw OKLCH values. This is the only place a colour is decided.
2. `@theme inline` maps them onto Tailwind utilities.
3. `@custom-variant dark (&:where(.dark, .dark *))` switches the dark variant from Tailwind v4's `prefers-color-scheme` default to class-based, so `next-themes` can drive it.

**`inline` is load-bearing, not stylistic.** It compiles `bg-card` to `background-color: var(--card)` instead of `var(--color-card)`. Without it the value resolves once at `:root` and `.dark` silently never applies. If dark mode "does nothing", check this first.

Naming follows shadcn because the primitives in `src/components/ui/` already speak it. **`accent` means "subtle hover surface", not the brand colour** — the brand is `primary`. Do not alias `--color-accent` to the brand.

Component code must use semantic utilities (`bg-card`, `text-muted-foreground`) and never a numbered palette colour (`bg-slate-100`, `text-blue-700`). The migration off the ~400 hardcoded `slate-*` is complete; `src/` has none left outside comments. They predated the token layer: before it existed, `bg-card` and `text-primary-foreground` generated no CSS, so every call site hand-rolled a workaround. Do not add more.

The one deliberate exception is `emerald-600`, kept in `ShareDialog` for the "copied" state: it is the only colour still carrying meaning (success) rather than brand, and mapping it to `primary` would lose that.

A scrim is a neutral shade, not brand. `DialogOverlay` and `TutorialModal` both use `bg-foreground/40`; `bg-primary/70` washes the page blue. Likewise `ring-ring` is the focus colour and should not be used as a permanent decorative ring.

Print styles re-point the tokens rather than naming utilities. `ScheduleViewer`'s `@media print` block overrides `--card`, `--muted` etc. inside `:root`, which reaches every surface at once precisely because `@theme inline` compiles `bg-card` to `var(--card)`. The rules it replaced targeted `.bg-slate-50` / `.shadow-xl` / `.rounded-2xl` and had silently gone dead when those classes stopped being emitted.

`npm run check:contrast` parses the OKLCH values out of `index.css` and asserts WCAG 2.1 (4.5:1 text, 3:1 UI). It exits non-zero on failure. Run it after touching any colour token. Note `--input` is deliberately much darker than `--border`: an input's border is the sole identifier of the field, so it needs 3:1 (WCAG 1.4.11), while `--border` is decorative and does not. Do not "tidy" them to match.

### Typography

All type is expressed as **role tokens** in the `@theme` block of `src/index.css`. Each token bundles size + line-height + weight + letter-spacing, so a call site names what a thing **is** (`text-body`, `text-caps`) and never re-picks those four values by hand. The roles: `display`, `headline`, `title`, `body`, `body-sm`, `label`, `caption`, `caps`, `data`, `data-sm`, `grid`, `grid-meta`.

This layer did not exist before. The result was 14 ad-hoc sizes, **183 arbitrary sub-12px values** outnumbering the 134 on-scale ones, and one `uppercase + tracking-widest + font-mono + text-[9px]` treatment applied identically to table headers, buttons, badges, field labels and empty states. One style for every role means nothing has rank, which is precisely what reads as "AI-generated" and as "too airy". The scale was also bimodal (headings 24-48px, labels 8-11px, almost nothing between) — reading happens in the middle, so that is where the weight now sits.

**`text-caps` is ONE role, for technical metadata only** (table headers, record badges). Wide tracking belongs on short uppercase strings and nowhere else. It is not the house style. A form label is a question addressed to a human, not metadata: it gets `label`, sentence case, via the `Label` primitive.

**Primitives own their role; call sites pass no type classes.** `Label`, `Button`, `Badge`, `CardTitle`, `CardDescription`, `DialogTitle`, `Input`, `Textarea`, `SelectTrigger`, `SelectItem` all carry theirs. Before this, `Label` declared `text-sm font-medium leading-none` and 16 of its 19 call sites overrode all three — the default was dead code.

**`Input`/`Textarea`/`SelectTrigger` keep a literal `text-base` below `md:`.** That is not a stray stock size: iOS Safari zooms the page when a focused field's text is under 16px. Only the `md:` half uses a role. `check:typography` allowlists exactly these three.

**Fonts are two variable families, latin-gated**: Plus Jakarta Sans (Tokotype, SIL OFL) + JetBrains Mono, via `@fontsource-variable/*`. Do not add a third, and do not go back to static per-weight imports — that was 62 `@font-face` rules (45 of them Cyrillic/Greek/Vietnamese for an Indonesian app); it is 10 now. `font-black` is banned: the axis stops at 800, so 900 clamps and renders *lighter*, not heavier. Previously it was synthesized, because nothing loaded above 700.

`--font-display` is a no-op alias kept only so nothing breaks; one family serves everything. Do not add uses.

`npm run check:typography` enforces all of the above (no arbitrary `text-[Npx]`, no `font-display`, no `font-black`, no stock t-shirt sizes, no loose tracking outside `text-caps`). It exits non-zero. Without it the arbitrary sizes grow straight back, because nothing else catches them.

### Icons

No `lucide-react`. `src/components/ui/icon.tsx` is a local set of 36 icons: `<Icon name="check" />`, typed via the `IconName` union, stroke 1.5, default size 16.

The file is **generated** by `npm run gen:icons` (`scripts/gen-icons.mjs`), which reads the real `__iconNode` data out of an installed `lucide-react` and vendors the paths (ISC, attributed in the file header). Editing `icon.tsx` by hand is fine for a one-off, but adding to the `MAP` in the generator is preferred. The generator needs `lucide-react` present, so `npm i -D lucide-react` first if it has been removed.

The set is deliberately smaller than what it replaced: `Brain`/`Sparkles`/`Wand2`/`Zap` were four different icons for one "AI" concept across 13 sites and are now just `sparkles`. Same for `Trash`/`Trash2`, `Plus`/`PlusCircle`, `Edit3`/`Pencil`, `RotateCcw`/`RefreshCw`, `Shield`/`ShieldCheck`, `Bookmark`/`BookmarkPlus`, `Check`/`CheckCircle2`. Prefer reusing a name over adding a synonym.

Pass `label` only for icons that carry meaning alone; without it the icon is `aria-hidden`, which is correct next to a text label.

`Button` deliberately has **no** `[&_svg]:size-4`. It was there to cap lucide's 24px default while screens were still un-migrated. As a CSS rule it beat the `width`/`height` attributes `Icon` sets, so every `size={12}` and `size={14}` call site inside a Button was silently forced back to 16. Do not reintroduce it.

### Frontend conventions

- `@/` aliases `./src` (set in both `vite.config.ts` and `tsconfig.app.json`).
- shadcn/ui + Radix in `src/components/ui/`; `components.json` configures the generator.
- **`cn()` is an extended tailwind-merge** (`src/lib/utils.ts`), not the stock one. tailwind-merge only knows Tailwind's own scales, so custom tokens (`rounded-panel`, `shadow-card`) must be registered in its `classGroups` or it keeps both conflicting classes and lets CSS source order decide. Register any new custom token that shares a property with a stock utility.
- **The `font-size` registration in `cn()` is load-bearing and the failure is silent.** tailwind-merge validates that group against an anchored t-shirt regex (`xs|sm|md|lg|xl`), so a role name like `text-body` fails it and falls through to the `text-color` group, whose validator accepts *anything*. The role is then treated as a colour and dropped by the next colour class: `cn("text-body", "text-muted-foreground")` returns just `text-muted-foreground`. Build and lint both pass; the type role simply never applies. Every primitive merges a `className`, so this presents as "the type tokens randomly do not work". **Every new `--text-*` role must be added to the `font-size` group in `src/lib/utils.ts`.** Verify with a real `twMerge()` call, not by reading.
- **Never put a `sm:`-prefixed class in a component's default variants.** tailwind-merge treats `sm:max-w-lg` and `max-w-4xl` as different properties, so a prefixed default does not merge with a caller's unprefixed override and silently wins above the breakpoint. `DialogContent`'s `size` and `padded` variants are unprefixed for exactly this reason; the mobile cap is done with `w-[calc(100vw-2rem)]` instead.
- `DialogContent` takes `size` (`sm`..`4xl`) and `padded`. Its defaults are correct now, so call sites should not re-specify surface, radius, border or shadow. Use `DialogBody` plus `className="flex flex-col overflow-hidden"` when a dialog needs a pinned header/footer with a scrolling middle.
- `ScheduleMaker.tsx` is the orchestrator: a 4-step state machine (`config` → `select` → `view` → `archive`) whose step is lifted into `App.tsx` so the Navbar can drive it. Sub-views live in `src/components/maker/`.
- Session config persists to localStorage via `useLocalStorage("krs-session-profile", …)`. That hook is built on `useSyncExternalStore` with a module-level registry, **not** `useState` — deliberately. A `useState`-based version gives each component its own copy seeded at mount, so two components reading the same key silently diverge. That is not hypothetical: `ScheduleMaker` writes `krs-local-archive` while `App` reads it to decide whether to offer migration, and with per-instance state the prompt never fired and anonymous users' plans were orphaned. Nothing catches this at build time. Keep the shared registry.
- **i18n** is a hand-rolled dict in `src/context/LanguageContext.tsx` (ID/EN) — `t("key")`, or `t("key", { count })` to fill a `{placeholder}`. New user-facing strings go in both maps, **including toasts**: they were 41 hardcoded English strings, so switching language changed the page and not one notification. `t` is memoised on `lang`, so it is stable in a dependency array; keep it that way.
  **`t` returns the key itself when it is missing**, so a typo renders literal `selector.no_subjects` to the user. That shipped, because it compiles, lints and builds cleanly. `npm run check:i18n` is the only thing that catches it: it asserts every used key exists in both maps, that the maps have identical key sets, and that every `{placeholder}` is actually supplied. Run it when touching strings.
  Note the guard reads `t("literal")` call sites, so a computed key (`t(cond ? "a" : "b")`) is invisible to it and will look "unused".
- `src/lib/prodi.ts` holds per-prodi UI overrides (e.g. `isCourseCentric` hides lecturer for TEKNIK PERTAMBANGAN).
- `vite.config.ts` hand-splits vendor chunks (react/ui/clerk/convex) via Rolldown's `build.rolldownOptions.output.advancedChunks.groups`. Rolldown deprecates the `manualChunks` object form, so groups match on a `test` regex against the module path — use `[\\/]` for the separator so it works on Windows. Verify a chunking change by checking `dist/assets/` sizes; the old object-map config silently matched nothing and built `convex-vendor` at 0.08 kB.
- Tailwind is wired through `@tailwindcss/vite` in `vite.config.ts`, not PostCSS. There is no `postcss.config.js` and no `tailwind.config.js` — v4 config lives in the `@theme` block in `src/index.css`. `components.json` has `tailwind.config: ""` for this reason. The build warns `SOURCEMAP_BROKEN` because `@tailwindcss/vite` emits no CSS sourcemap under Rolldown; it is cosmetic.

### Dead / stale code

Gemini is referenced in the schema (`preferredAiModel`) and `smartGenerate` throws `"Gemini is currently unavailable"` — only Groq works. The UI picker for it is gone: `SmartGenerateDialog` used to render two cards, one permanently disabled and struck through, with a `useEffect` forcing `"groq"` on every open. It now passes `model: "groq"` directly. The schema field and the action's Gemini branch remain.

`curriculum.term` is deprecated and unwritten; see Academic period for how to finish removing it.

`checkAdmin(ctx)` is exported from `convex/admin.ts` and imported by `convex/ai.ts`. `convex/users.ts` still has its own duplicate copy. If you touch it, prefer importing the `admin.ts` one over adding a third.
