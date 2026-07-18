# Auto-save the select-step draft + a "Muat dari Kurikulum" entry point on empty state

## Context

The select step (course selection screen) is supposed to be a durable draft: config,
selection, and locked-class choices should survive a refresh until the student explicitly
clears it. Today that's only half true, confirmed via code inspection:

- `sessionProfile`, `selectedCodes` (`"krs-selected-codes"`), and `lockedCourses`
  (`"krs-locked-courses"`) already persist via the shared `useLocalStorage` registry
  (`src/hooks/useLocalStorage.ts`, the `useSyncExternalStore`-based hook CLAUDE.md documents).
- **`courses` -- the actual subject/variant list added to the session -- is plain
  `useState<Course[]>([])`** in `src/hooks/maker/useScheduleSession.ts:39`. It resets to `[]`
  on every refresh, so `ScheduleSelector` falls back to its empty state even though
  `selectedCodes`/`lockedCourses` are still sitting in storage, now pointing at nothing. This
  is the actual bug behind "why did my selection disappear."
- The "load mandatory courses from curriculum" feature the user describes **already exists**:
  `useScheduleSession.ts`'s `handleAutoLoad` intersects `master_courses` against
  `api.admin.listCurriculum` for the student's prodi+semester and treats every returned row as
  mandatory (the schema has no elective/mandatory split -- confirmed in `convex/schema.ts`'s
  `curriculum` table, and not being added here since the user's ask is "match curriculum,"
  which is exactly current behavior). It's wired to `ScheduleConfig`'s "Mulai Rancang" button
  only, not reachable from `ScheduleSelector`'s own empty state.
- `ScheduleSelector.tsx`'s empty state (`courses.length === 0`, ~line 377) already ships an SVG
  (`Empty-course-pana.svg`) + a single "Add" button (`onAddSubject`, opens
  `MasterCatalogDialog`). Its own copy (`selector.no_subjects_desc`) already reads *"Muat mata
  kuliah wajib semester Anda, atau tambah sendiri dari katalog"* -- the UI text already promises
  a second action that doesn't exist yet as a button.
- `clearKRSSession()` (`useLocalStorage.ts:130-146`) wipes exactly
  `krs-session-profile`/`krs-selected-codes`/`krs-locked-courses`, deliberately leaving the plan
  archive (`krs-local-archive`) alone. This is the single "New/Clear" reset point and must be
  extended to also wipe the new `courses` key.

## Design

### 1. Persist `courses` the same way everything else already is

`src/hooks/maker/useScheduleSession.ts:39`:
```ts
const [courses, setCourses] = useState<Course[]>([]);
```
becomes
```ts
const [courses, setCourses] = useLocalStorage<Course[]>("krs-courses", []);
```
Same pattern already used two lines below for `selectedCodes`/`lockedCourses` -- no new
persistence mechanism, just extending the existing one to the field that was missed. This one
line closes the actual bug: full select-step state (profile, courses, selection, locks) now
survives a refresh.

### 2. Add "Muat dari Kurikulum" to the empty state

`ScheduleSelector.tsx`'s empty-state block already has one action button (`onAddSubject`).
Add a second, next to it, calling a new `onLoadCurriculum` prop:
- New prop `onLoadCurriculum?: () => void` on `ScheduleSelectorProps`.
- `ScheduleMaker.tsx` passes `onLoadCurriculum={() => session.handleAutoLoad(curriculum,
  allMasterCourses)}` -- the exact same call `ScheduleConfig`'s `onStart` already makes; no new
  logic needed, just a second call site for logic that already exists.
- Render both buttons side by side in the empty state, "Add" (existing, `plus` icon) and
  "Muat dari Kurikulum" (new, reuse an existing icon such as `sparkles` or `refresh` -- check
  `src/components/ui/icon.tsx`'s `IconName` union for the closest fit already in the 36-icon set
  rather than adding a new one), label via a new i18n key `selector.load_curriculum`
  ("Muat dari Kurikulum") in `src/context/LanguageContext.tsx`'s single translations map.
- `handleAutoLoad` already calls `setStep("select")` unconditionally -- harmless no-op here
  since we're already on the select step when this button is visible.

### 3. Extend the reset point

`useLocalStorage.ts`'s `clearKRSSession()` key list gets `"krs-courses"` added alongside the
three it already wipes. `krs-local-archive` stays untouched, same as today.

## Files

- `src/hooks/maker/useScheduleSession.ts`: swap `courses` from `useState` to `useLocalStorage`.
- `src/hooks/useLocalStorage.ts`: add `"krs-courses"` to `clearKRSSession()`'s wipe list.
- `src/components/maker/ScheduleSelector.tsx`: new `onLoadCurriculum` prop, second button in
  the empty-state block.
- `src/components/ScheduleMaker.tsx`: pass `onLoadCurriculum` through to `ScheduleSelector`
  (curriculum/allMasterCourses queries already live here, reused as-is).
- `src/context/LanguageContext.tsx`: new `selector.load_curriculum` key.
- `scripts/check-i18n.mjs`'s existing guard will catch a missing/typo'd key automatically --
  no script changes needed.

## Out of scope (explicitly not doing)

- No schema change for mandatory/elective distinction within curriculum -- current behavior
  (every curriculum row for a prodi+semester counts as required) already matches what the user
  described ("configured using the admin database repository that match curriculum").
- No change to `ScheduleConfig`'s existing "Mulai Rancang" flow -- it keeps doing
  load-then-navigate exactly as today; the select-step button is an additional entry point for
  when a student ends up on an empty select step by another path (e.g. after Clear, or after
  removing all added courses).

## Verification

- `npx tsc -b --force`, `npx convex codegen` (no convex/ changes expected, but cheap to run),
  `npm run build`, `npm run lint`, `npm run check:i18n`.
- Manual: add courses via curriculum load, refresh the page mid-select-step -> courses,
  selection and locks all still present (currently they'd vanish). Clear session -> select step
  returns to the empty state with both buttons. Trigger "Muat dari Kurikulum" directly from the
  empty state (not via Config's start button) and confirm it populates the same as today's
  Config-driven path.
