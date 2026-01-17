import type { Course, Plan } from "../types";
import { checkConflicts } from "./rules";

function calculateScore(courses: Course[]): {
  safe: number;
  risky: number;
  optimal: number;
  labels: string[];
} {
  let safe = 50;
  let risky = 0;
  let optimal = 0;
  const labels: string[] = [];

  // Analyze per day
  const dayLoads: Record<string, number> = {};
  courses.forEach((c) => {
    c.schedule.forEach((s) => {
      dayLoads[s.day] = (dayLoads[s.day] || 0) + 1;
    });
  });

  // Check Days
  const days = Object.keys(dayLoads);

  if (days.length <= 3) {
    risky += 30;
    labels.push("Crammed into few days");
  } else if (days.length === 5) {
    safe += 20;
    labels.push("Balanced spread");
  } else {
    optimal += 20;
    labels.push("4-day week possible");
  }

  // Check Max Daily Load
  const maxDaily = Math.max(...Object.values(dayLoads));
  if (maxDaily >= 4) {
    risky += 40;
    labels.push("Heavy daily load (>4 classes)");
  } else {
    safe += 20;
    labels.push("Light daily loads");
  }

  // Check 07:00 classes
  const hasMorning = courses.some((c) =>
    c.schedule.some((s) => s.start.startsWith("07")),
  );
  if (hasMorning) {
    risky += 10;
    labels.push("Early morning classes");
  }

  // Normalize

  return { safe, risky, optimal, labels };
}

export function generatePlans(
  allCourses: Course[],
  selectedCodes: string[],
): Plan[] {
  // 1. Group by code
  const groups: Record<string, Course[]> = {};

  // Filter only relevant courses first
  const relevantCourses = allCourses.filter((c) =>
    selectedCodes.includes(c.code),
  );

  if (relevantCourses.length === 0) return [];

  selectedCodes.forEach((code) => {
    // Exact match on code (watch out for case sensitivity? assumption: normalized)
    const options = relevantCourses.filter((c) => c.code === code);
    if (options.length > 0) {
      groups[code] = options;
    }
  });

  const keys = Object.keys(groups);

  // Strict for now.
  if (keys.length !== selectedCodes.length) {
    console.warn("Some selected codes have no available classes.");
  }

  // 2. Cartesian Product (Iterative)
  let combinations: Course[][] = [[]];

  for (const key of keys) {
    const options = groups[key];
    const newCombinations: Course[][] = [];

    // Safety break if combinations explode
    if (combinations.length * options.length > 20000) {
      // If we can't add another course without exploding, just stop and keep what we have
      // but warn the user. Actually, better to just limit the search space per course.
      console.warn("Combinations space too large, limiting options for", key);
      const limitedOptions = options.slice(
        0,
        Math.floor(20000 / combinations.length),
      );
      for (const combo of combinations) {
        for (const option of limitedOptions) {
          newCombinations.push([...combo, option]);
        }
      }
    } else {
      for (const combo of combinations) {
        for (const option of options) {
          newCombinations.push([...combo, option]);
        }
      }
    }
    combinations = newCombinations;
  }

  // 3. Filter conflicts and create Plans
  const plans: Plan[] = [];
  let validCount = 0;

  // Simple heuristic sort: prefer fewer combinations loop if needed, but here we iterate all

  for (const combo of combinations) {
    if (validCount >= 6) break; // Limit to 6 for clean UI

    // Check internal conflicts
    const { valid } = checkConflicts(combo);

    if (valid) {
      // Calculate Score
      const stats = calculateScore(combo);

      plans.push({
        id: crypto.randomUUID(),
        name: `Plan ${validCount + 1}`,
        courses: combo,
        score: {
          safe: stats.safe,
          risky: stats.risky,
          optimal: stats.optimal,
        },
        analysis: stats.labels.join(", "),
      });
      validCount++;
    }
  }

  return plans;
}
