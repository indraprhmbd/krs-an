# Indonesian-only UI + canonical day data + verbose inventory

## Context

Two real bugs reported against the Course Inventory / course list, researched and confirmed:

1. **Day-naming inconsistency.** No render site (`ScheduleSelector.tsx`, `ScheduleViewer.tsx`,
   `SharePage.tsx`) ever formats `schedule[].day` -- they interpolate whatever string is
   stored, raw. `schedule[].day` is `v.string()` in `convex/schema.ts` with **no normalization
   on write**: `convex/admin.ts`'s bulk import and most of
   `IntelligenceScraperDialog.tsx`'s AI-cleaning path accept any string; only its *manual*
   parse path runs a Indonesian->English `dayMap`. Real-world scraped source data is
   Indonesian ("Senin 07:00-09:00" per `IntelligenceScraperDialog.tsx:293`), so the DB ends up
   with a mix of Indonesian, English, and abbreviated day values depending on which import path
   touched a row. `ScheduleGrid.tsx` already has to defend against this with its own
   `DAY_ALIASES`/`normalizeDay()` (used only for grid-cell matching, never for display).
   `src/types/index.ts`'s `DayOfWeek = "Mon"|"Tue"|...` is the canonical form
   `src/lib/mock-data.ts` and `src/lib/rules.ts` already assume.

2. **Inventory verbosity.** `ScheduleSelector.tsx` and `ScheduleViewer.tsx`'s per-course rows
   show only `schedule[0].start` (never `.end`), only `lecturer.split(",")[0]` (drops
   co-lecturers), and only `schedule[0]` for courses that meet multiple times a week (the full
   list only surfaces if a `<Select>` is opened). `ScheduleGrid.tsx` already computes full
   start+end+day correctly for the visual grid -- the list views just never adopted the same
   completeness.

Locked decisions with the user:

- **UI goes Indonesian-only.** Target users are Indonesian college students; maintaining a
  day-name translation layer across two languages for something this data-shaped was not worth
  it, and neither is maintaining a full duplicate EN string map going forward. Remove the
  ID/EN toggle and the `LanguageContext` EN map; all user-facing copy is Indonesian, single
  source of truth (no more `t("key")` branching by `lang`, though the `t()` call *shape* can
  stay if it reduces churn -- see Part 3).
- **Codebase stays English.** Source identifiers, comments, the `DayOfWeek` canonical type
  (`"Mon".."Sun"`), i18n *key names* (e.g. `help.slider_title`), and technical/common naming
  conventions do not change -- only the strings a user actually reads become Indonesian-only.
  This is a display-layer change, not a rename of the codebase's working vocabulary.
- **Verbosity fix scope**: show end time, full lecturer list, and all weekly meeting slots by
  default (not hidden behind opening a dropdown).

## Part 1: Canonicalize day data at every write path

Single source of truth already exists: `DayOfWeek` (`src/types/index.ts`) plus the
Indonesian->English `dayMap` pattern already proven in
`IntelligenceScraperDialog.tsx:48-68`. Extract that into a shared, reused normalizer:

- New `normalizeDayOfWeek(raw: string): DayOfWeek` in `src/lib/schedule-format.ts` (new file),
  handling Indonesian full names, English full names, and abbreviations (superset of
  `ScheduleGrid.tsx`'s `DAY_ALIASES` -- consolidate rather than keep two copies; `ScheduleGrid`
  imports this instead of its local `normalizeDay`).
- Apply it at every write path that accepts a `day` string: `convex/admin.ts` bulk import
  (`bulkImportMaster`, `updateMasterCourse`), `IntelligenceScraperDialog.tsx`'s AI-cleaning
  path (today only the manual-parse path normalizes), and `CourseEditor.tsx`'s manual slot
  editor. Normalizing at the server boundary (`convex/admin.ts`) is the load-bearing fix --
  it means every future import path is safe by construction, not just the two client dialogs
  that currently remember to call it.
- One-off cleanup mutation (mirroring the existing `dropCurriculumTerm` pattern in
  `convex/admin.ts`) to normalize `day` on existing `master_courses` rows, run once from the
  dashboard -- do not silently mutate production data without the user running it explicitly.

## Part 2: One formatter, reused everywhere, verbose by default

New `src/lib/schedule-format.ts` also exports:

- `DAY_LABEL_ID: Record<DayOfWeek, string>` -- canonical `"Mon"->"Senin"` etc, single
  Indonesian dictionary (no per-language branching now).
- `formatSchedule(schedule: TimeSlot[]): string` -- renders **every** slot (not just index 0),
  each as `"{Hari} {start}-{end}"` (both start AND end, closing the reported gap), joined with
  `", "`.
- `formatSlot(slot: TimeSlot): string` -- single-slot version for row summaries that need one
  line, still start-end not start-only.

Reuse at every site the research identified: `ScheduleSelector.tsx:267-333`,
`ScheduleViewer.tsx:170-320` (`renderInventory` and the collapsed summary), `SharePage.tsx:243`.
Lecturer truncation (`lecturer.split(",")[0]`) is removed at these same sites -- render the
full string (existing `truncate`/`line-clamp` classes already handle overflow, per CLAUDE.md's
"trust primitives" pattern already in place there).

## Part 3: Drop the language toggle

- `src/context/LanguageContext.tsx`: delete the EN map, the `lang` state, and `setLang`; `t()`
  keeps its signature (`t("key", vars?)`) but is now a flat single-language lookup -- this
  minimizes churn across ~140 call sites rather than ripping out `t()` entirely.
- `src/components/layout/Navbar.tsx`: remove the language toggle UI (`languageToggle` block)
  and its popover section.
- `npm run check:i18n`: update the guard script to stop asserting "both maps have identical
  key sets" (there is only one map now); keep the "every used key exists" and
  "every placeholder is supplied" checks, which still matter.
- Do not touch `src/lib/period.ts`'s `periodLabel(lang)` signature by force -- simplify it to
  take no argument (always Indonesian) since the only caller no longer has a `lang` to pass.

## Files

- New: `src/lib/schedule-format.ts`.
- Rewritten call sites: `ScheduleSelector.tsx`, `ScheduleViewer.tsx`, `SharePage.tsx`,
  `ScheduleGrid.tsx` (switch to the shared normalizer), `CourseEditor.tsx`.
- `convex/admin.ts`: normalize on `bulkImportMaster`/`updateMasterCourse`, add a one-off
  `normalizeMasterCourseDays` cleanup mutation (not auto-run).
- `IntelligenceScraperDialog.tsx`: normalize on both parse paths, not just manual.
- `src/context/LanguageContext.tsx`, `src/components/layout/Navbar.tsx`, `src/lib/period.ts`,
  `scripts/check-i18n.mjs`: language-toggle removal.

## Verification

- `npx tsc -b --force`, `npx convex codegen`, `npm run build`, `npm run lint` (baseline 106),
  `check:contrast`/`check:typography`, updated `check:i18n`.
- Grep sweep: zero remaining `.split(",")[0]` on lecturer, zero remaining raw `schedule[0].day`
  interpolation outside the new formatter, zero references to `lang`/`setLang`/EN map.
- Manual: a course with 2 weekly meetings shows both slots with end times in both the Selector
  row and the Viewer inventory; a course with multiple co-lecturers shows all of them; day
  labels read consistently Indonesian regardless of what was originally scraped.
