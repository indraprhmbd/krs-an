export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface TimeSlot {
  day: DayOfWeek;
  start: string; // "HH:MM" 24h format
  end: string; // "HH:MM" 24h format
}

export interface Course {
  id: string; // generated unique id
  code: string;
  name: string;
  sks: number;
  class: string;
  lecturer: string;
  room: string;
  schedule: TimeSlot[];
  group?: string; // Optional grouping (e.g., if multiple entries needed for one course)
}

export interface Plan {
  id: string;
  name: string;
  courses: Course[];
  score?: {
    safe: number;
    risky: number;
    optimal: number;
  };
  analysis?: string; // AI explanation
}

export interface UserPreferences {
  maxSks: number;
  excludedDays: DayOfWeek[];
  preferredLecturers: string[];
}

/**
 * A plan row as it comes back from a backend, before validation.
 *
 * `data` is nullable because it genuinely is: plans are stored as a JSON string
 * and `convex/plans.ts` returns `data: null` for a row that fails to parse
 * rather than throwing. The type used to claim `data: Plan`, and usePlanArchive
 * cast the query result to match, so the null was laundered away and every
 * consumer read `plan.data.courses` straight into a TypeError.
 *
 * Do not consume this directly. `usePlanArchive` filters it down to
 * `ArchivedPlan`, which is the shape call sites can trust.
 */
export interface RawArchivedPlan {
  _id: string;
  name: string;
  data: Plan | null;
  createdAt: number;
  isSmartGenerated?: boolean;
  generatedBy?: string;
}

/** A plan whose `data` has been verified readable. */
export interface ArchivedPlan extends RawArchivedPlan {
  data: Plan;
}
