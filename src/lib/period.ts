/**
 * The current academic period.
 *
 * This is the one place the running term is declared. It replaces the year
 * hardcoded in three places that could drift apart (both LanguageContext maps
 * and an inline string in ScheduleSelector).
 *
 * Indonesian universities run two terms: Ganjil (Odd) covers semesters 1/3/5/7,
 * Genap (Even) covers 2/4/6/8. A student's semester number therefore already
 * encodes the parity; there is no separate fact to store. The `curriculum.term`
 * field tried to store it anyway, derived as `semester % 2`, and was never read.
 *
 * Update this at the start of each term.
 */
export type Term = "odd" | "even";

export const ACADEMIC_YEAR = "2026/2027";
export const CURRENT_TERM: Term = "odd";

/** Human label, e.g. "2026/2027 Ganjil". UI is Indonesian-only. */
export function periodLabel(): string {
  const isOdd = CURRENT_TERM === "odd";
  return `${ACADEMIC_YEAR} ${isOdd ? "Ganjil" : "Genap"}`;
}

/**
 * The semesters actually running this term. Offering all of 1-8 lets a student
 * pick a semester with no schedule data behind it and get an empty result with
 * no explanation.
 */
export function validSemesters(term: Term = CURRENT_TERM): number[] {
  const wantOdd = term === "odd";
  return [1, 2, 3, 4, 5, 6, 7, 8].filter((s) => (s % 2 === 1) === wantOdd);
}

export function isValidSemester(
  semester: number,
  term: Term = CURRENT_TERM,
): boolean {
  return validSemesters(term).includes(semester);
}

/**
 * Coerce a semester to one that runs this term.
 *
 * Returning users have a semester persisted in localStorage from a previous
 * term. Without this, a stored 2 during an Odd term leaves the Select with a
 * value no option matches, which Radix renders as empty. Moving up one keeps
 * the student's year: a student who finished semester 2 is now in 3.
 */
export function coerceSemester(
  semester: number,
  term: Term = CURRENT_TERM,
): number {
  const valid = validSemesters(term);
  if (valid.includes(semester)) return semester;
  // Bump by one: a student who finished semester 2 is now in semester 3.
  // Past the end of the programme (stored 8 during an Odd term) there is no
  // sensible next, so fall back to the last valid one rather than sending a
  // final-year student to semester 1.
  const bumped = semester + 1;
  if (valid.includes(bumped)) return bumped;
  return valid[valid.length - 1];
}

export const DEFAULT_SEMESTER = validSemesters()[0];
