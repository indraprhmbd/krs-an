# KRSan pivot — flow, personal visual identity, custom icons, backend hardening

## Context

The typography + academic-period work shipped and is committed. The remaining user feedback
is broader than visuals and spans four areas, all confirmed against the code:

1. **Flow / state.** "page flow very confusing... lack of consistency... poor state management
   and system design laziness." Verified: `ScheduleMaker.tsx` is an 832-line god component;
   the flow step is prop-drilled `App -> Navbar` + `App -> ScheduleMaker` with a dual
   `externalStep || internalStep` fork and a `lastArchitectStep` shadow copy; a
   `window.dispatchEvent(new CustomEvent("trigger-tutorial"))` (`Navbar.tsx:79`) crosses a
   boundary the props already span; the tutorial sync effect is unfinished (`// For now`,
   `// Edge case`).
2. **Visual identity.** Still "feels AI-generated... not personal yet cohesive and niche."
   The token/type layer fixed the mechanics but the app made no aesthetic *decision* — the
   generic-slop tell.
3. **Icons.** Wants a personal, **multicolor-filled** ("startup app") icon voice, not the
   vendored-lucide mono look.
4. **Backend.** "spaghetti code... optimize Convex... less function invocation, no db
   performance issue, no security issue." Verified: a repeated auth block duplicated ~10x, a
   real **credit double-spend / rate-limit-bypass** in `smartGenerate`, and a hot public
   `.collect()` on every mount.

**Verdict: refactor on the existing stack, do not rebuild.** The backend (Convex schema,
identity recovery, credits, AI cache, server-side reconstruction), Clerk, `scheduler.ts`/
`rules.ts`, and the guarded design-token system are sound and costly to reproduce. The rot is
the frontend orchestration layer + specific backend hotspots. **Stisla v3 was evaluated and
rejected as a dependency** (it is a parallel OKLCH/BEM design system + vanilla-JS interactivity
that would duplicate the existing `@theme`+Tailwind+Radix layer and fight React); its concepts
— one-root-override theming, preset wrappers — are mined below, not installed.

## Decisions (locked with the user)

| Area | Decision |
|---|---|
| Flow | Keep the `config -> select -> view -> archive` flow. Restructure plumbing only; no IA redesign. |
| Visual | **Warm playful character** identity. Palette **fully open** — retune tokens to serve it, re-run the contrast guard. |
| Icons | **Two-tier**: `<Icon>` stays mono/duotone for UI chrome (theme-correct, legible small); new `<SpotIcon>` renders full **multicolor Flat Color Icons (MIT)** for spot/feature/empty-state art. Both driven by `scripts/gen-icons.mjs`. |
| Backend | Extract auth helpers, fix the credit race, cut invocations, scope the hot query, type + de-dupe. No schema breakage. |

## Non-goals

- No IA/navigation redesign; the four steps + Architect/Archive toggle stay.
- No new runtime UI dependency (no Stisla, no icon library at runtime — SVGs are vendored).
- No breaking Convex schema change. Contrast/typography/i18n guards must stay green; lint
  baseline 106.

---

## Workstream A: Flow + state (structural fix)

**A1. One session store.** New `src/context/SessionContext.tsx` (context + reducer) becomes the
single owner of flow + live session. Replaces the prop-drill, the `internalStep/externalStep`
fork, `App`'s `lastArchitectStep`, and the `window` CustomEvent.

Owns: `step` + `lastArchitectStep` (+ a `requestTutorial()` action replacing the window event);
live session `courses`, `plans`, `currentPlanIndex`, `viewSource`, `planLimit`, `maxDailySks`,
`isGenerating`, `isManualMode`; dialog flags (`isMasterSearchOpen`, `isSmartDialogOpen`,
`isShareDialogOpen`, `activeShareId`, `activeSharePlanName`).

Stays put: persisted config in `useLocalStorage` (`krs-session-profile`, `krs-selected-codes`,
`krs-locked-courses`) — keep the `useSyncExternalStore` shared-registry hook (CLAUDE.md documents
why). Server hooks (`useQuery`/`useMutation`/`useAction`, `usePlanArchive`) stay called by the
feature components, not proxied through the store.

Provider wraps inside `App`'s `/*` route so `Navbar` + orchestrator share one instance; `App`
passes no `step`/`setStep` props. **Delete both** the `dispatchEvent` (`Navbar.tsx:79`) and the
`addEventListener` (`ScheduleMaker.tsx:268`).

**A2. Dissolve the god component.** `ScheduleMaker.tsx` becomes a thin orchestrator (<150 lines):
read `step`, render the matching view, mount dialogs. Extract fat handlers into feature hooks
(mirrors `admin/hooks/`): `useGeneratePlans` (`:391-480`), `useSmartGenerate` (`:309-389`),
`useSharePlan` (`:274-305`), `useArchiveActions` (`:150-188`). The four step views already exist
in `src/components/maker/`; rewire them to read the store instead of ~15 props each.

**A3. Consistency pass.** One shared **`<StepShell>`** (header slot + scroll body + action
footer) framing all four views so rhythm is identical step-to-step — the biggest lever on
"confusing flow" without changing the flow. Every dialog uses `DialogContent` `size`/`padded`
defaults + `DialogBody` (no per-call surface/radius/border/shadow). Preset variants on the shell
(dense / feature) are the "one-line wrapper" idea mined from Stisla.

## Workstream B: Warm-playful visual identity (palette open)

**B1. Palette retune.** In `src/index.css` `:root`/`.dark`, retune the OKLCH tokens toward a warm,
friendly, cohesive character (warmer neutrals, a confident playful primary, disciplined accent =
subtle-hover-surface per CLAUDE.md, not brand). One-root-override model already in place via
`@theme inline`. **Re-run `npm run check:contrast`** after every change; note `--input` must stay
darker than `--border` (WCAG 1.4.11). Keep the `emerald-600` "copied" success exception.

**B2. Character, not just colour.** Warmth comes from: rounded friendly radii, a small consistent
motion language (gentle transitions, no gratuitous animation), generous-but-intentional spacing
(fix the airiness without going generic), and the spot-icon art (Workstream C). Encode any new
decision as a token, never a call-site one-off.

**B3. Personal touches.** A light illustration/voice on empty states and onboarding (Indonesian,
friendly copy through `t()`), and the schedule grid treated as the signature surface. No mascot
commitment unless the user asks; keep it type + colour + spot-art driven.

## Workstream C: Two-tier custom icons

**C1. `<Icon>` (chrome) unchanged in API.** Keep the typed mono set, `currentColor`, stroke 1.5,
theme-correct at 14-16px. Optionally shift to a duotone treatment later; not required.

**C2. New `<SpotIcon>` (multicolor).** New primitive rendering vendored **Flat Color Icons
(icons8, MIT)** full-colour SVG markup — decorative, `aria-hidden` by default, large sizes only
(empty states, feature cards, onboarding, hero). Fixed multicolour fills; **do not** use for small
controls (muddy + dark-mode-fixed). MIT = vendor freely with a LICENSE header, no attribution.

**C3. Pipeline.** Extend `scripts/gen-icons.mjs` to emit both `icon.tsx` (existing) and a new
`spot-icon.tsx` from a curated `SPOT_MAP`, vendoring the Flat Color Icons markup + license header.
`npm run gen:icons` regenerates both. Add a `SpotIconName` union. Once fully off vendored lucide,
`lucide-react` can leave devDependencies.

## Workstream D: Convex backend hardening

**D1. Kill the auth spaghetti.** New `convex/lib.ts` (or `convex/model/`): `getAuthedUser(ctx)` /
`requireUser(ctx)` typed with `QueryCtx`/`MutationCtx`, replacing the identity->by_token->unique->
null-check block duplicated in `updatePreferences`, `ensureUser`, `generateServiceToken`,
`savePlan`, `listPlans`, `deletePlan`, `renamePlan`, `createShareLink`. Consolidate the two
`checkAdmin` copies (`admin.ts` + `users.ts`) into one, typed (drop `ctx: any`).

**D2. Fix the credit double-spend (real bug).** In `convex/ai.ts` `smartGenerate`, credit + rate
limit are checked at the start but only consumed at the end via `generateServiceToken`, and
`lastSmartGenerateTime` is armed only at the end — so two rapid/concurrent calls both pass the
check, both hit Groq, and can double-run / bypass the 30s limit. Fix: **reserve atomically up
front** — one mutation that re-checks credits + sets `lastSmartGenerateTime` + decrements before
the Groq call; **refund** if zero plans survive reconstruction (preserve the current
"credit only spent if >=1 plan" guarantee). Actions are not transactional; the reserve must be a
mutation.

**D3. Cut invocations in `smartGenerate`.** It currently fans out ~5-7 sequential calls
(`getCurrentUser` + `checkCache` + up to 3x `savePlan` + `saveCache` + `generateServiceToken`),
and each `savePlan` re-auths and re-`.collect()`s all plans for the 30-cap. Collapse the
save+consume into **one internal mutation** that writes all surviving plans and settles the credit
atomically (one user lookup, one cap check).

**D4. Scope the hot public query.** `listMasterCourses` (`admin.ts:99`) does `.collect()` of the
entire prodi catalog (full docs incl. schedule arrays) on every `ScheduleMaker` mount for every
anonymous visitor. Scope it to the selected curriculum's code set (or trim returned fields) so the
public reactive payload shrinks. Keep it auth-free (public by design). Also `getMasterCoursesCount`
(`:70`) full-scans + client-filters on every debounced admin keystroke — derive count from the
paginated query or index rather than `.collect()`.

**D5. Small cleanups.** Combine `ensureUser`'s double `patch` (email + daily reset) into one;
remove the stale `"LangChain Verified"` string written into saved plan data (`ai.ts:285`); finish
`curriculum.term` retirement (run `dropCurriculumTerm`, then drop the field) per CLAUDE.md.

---

## Sequencing (each a self-contained, verifiable commit)

1. **D1 + D2** — auth helpers + credit-race fix. Backend correctness/security first, lowest UI risk.
2. **D3 + D4 + D5** — invocation + query-scope + cleanups.
3. **A1** — session store; delete window event + prop-drill.
4. **A2 + A3** — dissolve god component; `<StepShell>` consistency pass.
5. **B1 + B2 + B3** — palette retune + warm-playful character (contrast guard each step).
6. **C1-C3** — two-tier icons + `gen:icons` pipeline; drop `lucide-react`.

## Verification

- After each commit: `npx tsc -b --force` **and** `npx convex codegen` (different tsconfigs),
  `npm run build`, `npm run lint` (baseline 106), `npm run check:contrast`,
  `npm run check:typography`, `npm run check:i18n`.
- Backend, live: exercise Smart Generate against real Groq (`GROQ_API_KEY` is a Convex env var) —
  confirm one credit spent per success, refund on zero-plan, 30s limit armed immediately; hammer
  two rapid clicks to prove the race is closed. Confirm `listMasterCourses` payload shrank
  (network tab) and the planner still finds all sections for selected codes.
- Grep sweeps: zero `window.dispatchEvent`/`addEventListener("trigger-tutorial")`, zero
  `externalStep`, no duplicated identity-lookup block, `checkAdmin` single definition, no English
  string literals in `.tsx` handler bodies, `as any` count down.
- Manual, both auth states (app is public-by-default): anonymous config->select->generate(free)->
  view->save-to-local->Architect/Archive toggle->tutorial from Navbar (proves store replaced the
  window event)->language flip changes toasts. Signed-in: Smart Generate spends a credit and lands
  in archive; share; expand limit; local->Convex migration prompt on sign-in. Returning user with a
  stale-parity stored `semester` lands on a valid Select.
- Visual: every screen at 360px + desktop, light + dark; `<SpotIcon>` art only at large sizes;
  `lucide-react` gone from the runtime bundle.
