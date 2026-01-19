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

/**
 * Shuffle helper for randomized sampling
 */
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Check if a daily load exceeds a threshold
 */
function checkDailySksLimit(courses: Course[], limit: number = 8): boolean {
  const daySks: Record<string, number> = {};
  courses.forEach((c) => {
    c.schedule.forEach((s) => {
      daySks[s.day] = (daySks[s.day] || 0) + (c.sks || 0);
    });
  });
  return Object.values(daySks).every((sks) => sks <= limit);
}

export function generatePlans(
  allCourses: Course[],
  selectedCodes: string[],
  limit: number = 12,
  maxDailySks: number = 8,
): Plan[] {
  // 1. Group by code and Shuffle
  const groups: Record<string, Course[]> = {};
  const relevantCourses = allCourses.filter((c) =>
    selectedCodes.includes(c.code),
  );

  if (relevantCourses.length === 0) return [];

  // Important: Use selectedCodes order to pick groups
  selectedCodes.forEach((code) => {
    const options = relevantCourses.filter((c) => c.code === code);
    if (options.length > 0) {
      groups[code] = shuffle(options); // SHUFFLE for random sampling
    }
  });

  const keys = Object.keys(groups);
  const foundPlans: Course[][] = [];
  const maxSearchCandidates = limit * 4; // Find enough valid schedules to pick from

  // 2. Backtracking Search
  function backtrack(index: number, currentCombo: Course[]) {
    if (foundPlans.length >= maxSearchCandidates) return;

    // Base case: Full plan found
    if (index === keys.length) {
      foundPlans.push([...currentCombo]);
      return;
    }

    const currentKey = keys[index];
    const options = groups[currentKey];

    for (const option of options) {
      // Early Pruning: Conflict Check
      const { valid } = checkConflicts([...currentCombo, option]);
      if (!valid) continue;

      // Optional: Add branch for Daily Load Heuristic (8 SKS)
      // We still want to find plans even if they exceed 8 SKS, but we prefer those that don't.
      // For now, let's just use it in the final scoring.

      backtrack(index + 1, [...currentCombo, option]);

      if (foundPlans.length >= maxSearchCandidates) break;
    }
  }

  // Start search
  backtrack(0, []);

  // 3. Scoring and Sorting
  // We prioritize:
  // 1. Daily SKS <= 8
  // 2. High Analysis Score
  const scoredPlans = foundPlans.map((combo) => {
    const stats = calculateScore(combo);
    const passesDailyHeuristic = checkDailySksLimit(combo, maxDailySks);

    // Heuristic boost
    const finalSafe = stats.safe + (passesDailyHeuristic ? 15 : 0);

    return {
      combo,
      stats,
      passesDailyHeuristic,
      totalScore: finalSafe + stats.optimal - stats.risky,
    };
  });

  // Take top limit
  return scoredPlans
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit)
    .map((item, idx) => {
      const isComplete = keys.length === selectedCodes.length;
      const labels = [...item.stats.labels];
      if (item.passesDailyHeuristic)
        labels.push(`Balanced daily SKS (<${maxDailySks})`);

      return {
        id: crypto.randomUUID(),
        name: isComplete
          ? `Optimal Plan ${idx + 1}`
          : `Partial Plan ${idx + 1}`,
        courses: item.combo,
        score: {
          safe: item.stats.safe,
          risky: item.stats.risky,
          optimal: item.stats.optimal,
        },
        analysis: isComplete
          ? labels.join(", ")
          : `Missing ${selectedCodes.length - keys.length} subjects. ${labels.join(", ")}`,
      };
    });
}
