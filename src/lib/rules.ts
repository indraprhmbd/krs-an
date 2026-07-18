import type { Course, TimeSlot, DayOfWeek } from "../types";

export const DAYS: DayOfWeek[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function isOverlapping(slot1: TimeSlot, slot2: TimeSlot): boolean {
  if (slot1.day !== slot2.day) return false;
  const start1 = parseTime(slot1.start);
  const end1 = parseTime(slot1.end);
  const start2 = parseTime(slot2.start);
  const end2 = parseTime(slot2.end);
  // Returns true if there is any overlap
  return Math.max(start1, start2) < Math.min(end1, end2);
}

export function checkConflicts(courses: Course[]): {
  valid: boolean;
  messages: string[];
  pairs: [Course, Course][];
} {
  const messages: string[] = [];
  const pairs: [Course, Course][] = [];
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const c1 = courses[i];
      const c2 = courses[j];

      // Ignore if same course code (you can't take the same course twice usually, but let's assume valid selection logic handles that.
      // Actually, we should flag same-course duplicates too? No, usually that's valid if user selected them, but here we want VALID schedule.)
      // Actually, conflict check is strictly time check.

      let hasOverlap = false;
      for (const s1 of c1.schedule) {
        for (const s2 of c2.schedule) {
          if (isOverlapping(s1, s2)) {
            hasOverlap = true;
            break;
          }
        }
        if (hasOverlap) break;
      }
      if (hasOverlap) {
        messages.push(
          `Conflict: ${c1.name} (${c1.class}) overlaps with ${c2.name} (${c2.class})`,
        );
        pairs.push([c1, c2]);
      }
    }
  }
  return { valid: messages.length === 0, messages, pairs };
}

/**
 * Resolve conflicts one course at a time instead of rebuilding the whole
 * plan. For each conflicting pair, try swapping just one side to another
 * class/section of the same course code that reduces the conflict count;
 * every course not involved in a conflict is left untouched. A pair that no
 * single-course swap can fix is reported in `unresolvedPairs` rather than
 * blocking the rest of the plan from being cleaned up.
 */
export function resolveConflictsMinimally(
  courses: Course[],
  alternativesByCode: Record<string, Course[]>,
): { courses: Course[]; resolved: boolean; unresolvedPairs: [Course, Course][] } {
  let current = courses;
  const stuckPairKeys = new Set<string>();

  const pairKey = (a: Course, b: Course) =>
    [a.id, b.id].sort().join("::");

  for (let pass = 0; pass < courses.length + 1; pass++) {
    const { valid, pairs } = checkConflicts(current);
    if (valid) {
      return { courses: current, resolved: true, unresolvedPairs: [] };
    }

    const target = pairs.find(([a, b]) => !stuckPairKeys.has(pairKey(a, b)));
    if (!target) break; // every remaining pair is already known-stuck

    const [a, b] = target;
    const baselineConflicts = pairs.length;

    const trySwap = (toReplace: Course): Course[] | null => {
      const alternatives = (alternativesByCode[toReplace.code] || []).filter(
        (alt) => alt.id !== toReplace.id,
      );
      for (const alt of alternatives) {
        const candidate = current.map((c) => (c.id === toReplace.id ? alt : c));
        const { pairs: nextPairs } = checkConflicts(candidate);
        if (nextPairs.length < baselineConflicts) return candidate;
      }
      return null;
    };

    const swapped = trySwap(a) ?? trySwap(b);
    if (swapped) {
      current = swapped;
    } else {
      stuckPairKeys.add(pairKey(a, b));
    }
  }

  const { valid, pairs: remaining } = checkConflicts(current);
  return { courses: current, resolved: valid, unresolvedPairs: remaining };
}
