# Minimal-change "Fix Conflicts" for the manual plan editor

## Context

`ScheduleViewer.tsx`'s manual-edit "Fix Conflicts" button (`handleQuickFix`, lines 111-130)
is not a targeted fix. It throws away the entire current plan and rebuilds it from scratch,
walking every course code in catalog order (`uniqueCodes`, derived from `allPossibleCourses`
insertion order, not from the plan) and greedily picking the first class variation that
doesn't conflict with what's already been accumulated, falling back to the first variation if
none is conflict-free. Confirmed by reading the function in full: it never looks at which two
courses are actually conflicting, so it routinely swaps out courses that had zero conflicts
just because of greedy accumulation order. That's the "lazy approach" the user means.

What "minimal" should mean instead: **identify the specific conflicting pair(s), and change
only one course in each pair** -- ideally the smallest possible edit that clears the plan,
not a full rebuild.

Everything needed for this already exists in the codebase, confirmed via inspection:

- `checkConflicts` (`src/lib/rules.ts:28-60`) already does the pairwise O(n^2) overlap check
  over `courses`, but only returns human-readable `messages: string[]`, not which two `Course`
  objects conflicted. That's the one real gap -- there is no structured pair data today.
- Every alternative class/section for a code is already loaded client-side, no fetch needed:
  `groupedVariations` (`ScheduleViewer.tsx:81-92`) groups `allPossibleCourses` (=
  `session.courses`, populated up front by curriculum auto-load or manual add) by `code`.
- The single-course swap primitive already exists and is already wired to the manual
  per-course `<Select>`: `handleUpdateCourse(code, newVariation)`
  (`ScheduleViewer.tsx:98-103`) filters out the old entry for that code and pushes the new one.
  A minimal-fix implementation reuses exactly this pattern instead of rebuilding the array.
- `onUpdatePlan` -> `session.handleUpdateManualPlan` (`useScheduleSession.ts:295-306`) just
  replaces `plans[currentPlanIndex].courses` wholesale with whatever array it's given -- it
  does not care whether the caller changed one course or all of them, so nothing downstream
  needs to change to support a smaller diff.
- Overlap comparison (`isOverlapping`, `rules.ts:18-26`) only looks at `day`/`start`/`end`
  inside `schedule[]`; `room`/`lecturer` are irrelevant to conflict detection, confirming any
  other `Course` sharing the same `code` is a valid swap candidate as long as its `schedule`
  doesn't overlap the rest of the plan.

## Design

### 1. Make conflicts structured, not just stringified

Extend `checkConflicts` in `src/lib/rules.ts` to also return the actual conflicting pairs,
additively (existing `valid`/`messages` stay, so the three other call sites --
`ScheduleViewer.tsx`, `ScheduleGrid.tsx`, `scheduler.ts` -- are unaffected):

```ts
export function checkConflicts(courses: Course[]): {
  valid: boolean;
  messages: string[];
  pairs: [Course, Course][];
}
```

Populate `pairs` in the same double loop that already builds `messages`, no algorithmic change
to the O(n^2) scan itself.

### 2. A minimal-fix resolver, not a full rebuild

New function in `src/lib/rules.ts` (co-located with `checkConflicts`, which it depends on
directly):

```ts
export function resolveConflictsMinimally(
  courses: Course[],
  alternativesByCode: Record<string, Course[]>,
): { courses: Course[]; resolved: boolean; unresolvedPairs: [Course, Course][] }
```

Algorithm, run iteratively since fixing one pair can surface or clear others:

1. Run `checkConflicts(courses)`. If `valid`, return immediately (nothing to do).
2. Take the first conflicting pair `[a, b]` from `pairs`.
3. Try every alternative in `alternativesByCode[a.code]` (excluding `a` itself, i.e. every
   other class/section for that same course): swap it in for `a`, keeping every other course
   in the plan untouched, and re-run `checkConflicts` on the resulting array. Take the first
   alternative that yields strictly fewer conflicts than before (ideally zero, but "fewer" so
   a plan with 3+ mutual conflicts still makes forward progress one swap at a time rather than
   requiring a single alternative to fix everything at once).
4. If no alternative for `a` helps, try the same for `b`'s alternatives instead.
5. If neither side has a helpful alternative, this pair cannot be resolved by a single swap
   (e.g. every section of both courses collides with the rest of the plan) -- record it in
   `unresolvedPairs` and move on to the next conflicting pair rather than giving up entirely.
6. Repeat from step 1 (re-check the whole plan) until either no conflicts remain, or a full
   pass produces no further progress (guards against an infinite loop when nothing more can be
   done).

This changes at most one `Course` entry per resolved pair -- the rest of the plan, including
courses that were never in conflict, is left completely untouched. That is the actual "minimal
step" the user is asking for, as opposed to `handleQuickFix`'s full-plan rebuild.

### 3. Rewire the button

`ScheduleViewer.tsx`'s `handleQuickFix` (lines 111-130) is replaced with a call into
`resolveConflictsMinimally(currentPlan.courses, groupedVariations)` (both already computed in
this component), then `onUpdatePlan(result.courses)`.

Toast feedback needs to distinguish three outcomes, since a minimal fix does not always fully
succeed the way "rebuild everything" implicitly always "succeeded" (even if it changed courses
the user didn't expect):
- Fully resolved: keep the existing `toast.success(t("toast.quick_fix"))`.
- Partially resolved (some pairs fixed, `unresolvedPairs.length > 0`): a new toast/copy telling
  the user N conflicts remain and naming the courses, since those need a manual class change
  the automated pass couldn't find.
- No conflicts existed to begin with: button should probably be disabled rather than shown,
  mirroring how other conditional footer actions in this file are gated (e.g. `onExpand`,
  `onShuffle` in `ScheduleMaker.tsx`).

New i18n key needed for the partial-resolution case in `src/context/LanguageContext.tsx`,
covered by the existing `npm run check:i18n` guard.

## Files

- `src/lib/rules.ts`: extend `checkConflicts` to also return `pairs`; add
  `resolveConflictsMinimally`.
- `src/components/maker/ScheduleViewer.tsx`: replace `handleQuickFix`'s body to call the new
  resolver instead of the greedy rebuild; branch the toast on the result; consider gating the
  button's visibility/disabled state on whether `checkConflicts(currentPlan.courses).valid` is
  already true.
- `src/context/LanguageContext.tsx`: new key(s) for the partial-resolution toast copy.

## Out of scope

- Not touching `handleUpdateCourse`, the per-course manual `<Select>`, or
  `handleUpdateManualPlan` -- all three are reused as-is.
- Not touching the local/AI generators (`src/lib/scheduler.ts`, `convex/ai.ts`) -- this is
  specific to the manual-edit "Fix Conflicts" action inside `ScheduleViewer.tsx`.
- Not attempting multi-course simultaneous re-optimization (e.g. swapping 2 courses at once to
  resolve a conflict neither could resolve alone) -- out of scope for "minimal step"; those
  cases surface in `unresolvedPairs` for the user to resolve by hand via the existing
  per-course selector.

## Verification

- `npx tsc -b --force`, `npm run build`, `npm run lint`, `npm run check:i18n`.
- Manual: build a plan with exactly 2 conflicting courses where an alternative class exists
  for one of them with no new conflicts -- confirm only that one course changes (compare course
  `id`s before/after) and every other course in the plan is untouched (currently every course
  is at risk of being swapped).
- Manual: a plan with a conflicting pair where no alternative resolves it -- confirm the toast
  reports it as unresolved rather than silently leaving a corrupted-looking plan, and that
  other, unrelated conflicts elsewhere in the same plan still get fixed in the same pass.
- Manual: a plan with zero conflicts -- confirm the button either does nothing harmless or is
  disabled, and no courses are altered.
