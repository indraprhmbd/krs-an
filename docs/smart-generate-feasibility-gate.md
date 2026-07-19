# Smart Generate feasibility gate (quick win)

Status: implemented as a stopgap. A more robust approach (e.g. proper
per-user/day attempt caps, richer infeasibility diagnostics, maybe surfacing
*which* course pair conflicts) is intended to be planned separately later --
this only closes the most obvious hole.

## Problem

`smartGenerate` (`convex/ai.ts`) reserves a credit *before* calling the AI
(`reserveSmartCredit`), then refunds it if reconstruction yields zero
surviving plans. That refund-on-failure design means a course selection with
**no conflict-free combination at all** -- structurally impossible, not a
transient AI miss -- can be retried indefinitely at zero net credit cost,
limited only by the 30s cooldown. Every retry still burns a real
Groq/SumoPod API call. The AI cannot succeed where no valid combination
exists in the underlying data; it isn't smarter than an exhaustive search
over the same class options.

`src/lib/scheduler.ts`'s `generatePlans` (the "Susun Cepat" local generator)
is in fact an exhaustive backtracking search with conflict pruning at every
branch -- when it returns `[]` for a non-empty selection, that is a genuine
proof no valid combination exists among the currently available class
options, not a heuristic false negative. That makes it a legitimate, free,
instant gate: if Susun Cepat's own search proves infeasibility, Smart
Generate (drawing from the identical course pool) cannot do better, and
neither can Plotter (manual assembly from the same options).

Separately, reconstruction in `convex/ai.ts` never re-validated the AI's
proposed course list for actual time conflicts -- it only checked that at
least one course ID resolved. A "successful" plan could silently contain real
overlaps and still consume a credit.

## What shipped

1. **`src/lib/scheduler.ts`**: `hasFeasibleSchedule(allCourses, selectedCodes)`
   -- thin wrapper around `generatePlans` capped at 1 result, no new
   algorithm.
2. **`src/hooks/maker/useSmartGenerate.ts`**: hard gate in
   `onInitSmartGenerate` (before the credits/cooldown checks) and again at
   the top of `handleRunSmartGenerate` (selection could change while the
   preferences dialog is open) -- blocks with a toast, never reaches the
   network, no credit reservation touched.
3. **`src/components/maker/ScheduleSelector.tsx`**: Plotter stays a soft
   warning, not a hard block -- it's free and manual override of a
   partial/conflicting schedule is legitimate. Warns, then still opens the
   manual editor.
4. **`convex/lib.ts`**: `hasScheduleConflict`, a self-contained duplicate of
   `src/lib/rules.ts`'s conflict check (same precedent as
   `normalizeDayOfWeek`: convex/ never imports from src/, small pure
   functions are cheaper to keep in both places than to share).
5. **`convex/ai.ts`**: reconstruction now skips (doesn't count as
   "surviving") any AI-proposed plan whose courses have a real conflict,
   alongside the existing hallucinated-ID drop.

## What this does NOT solve

- No cap on retries for a *feasible* selection where the AI keeps failing for
  other reasons (malformed JSON, provider outage, truncation). Still bounded
  only by the 30s cooldown.
- No diagnostics surfaced to the student on *why* a selection is infeasible
  (which specific courses/classes conflict) -- just a generic toast.
- No university/prodi-aware feasibility hinting, no partial-selection
  suggestions ("drop this one course and it becomes feasible").

These are candidates for the more robust follow-up pass.
