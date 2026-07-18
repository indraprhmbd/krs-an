import type { DayOfWeek, TimeSlot } from "@/types";

/**
 * Single source of truth for day-name handling.
 *
 * Source schedule data is scraped from real university timetables and mixes
 * Indonesian and English, full and abbreviated ("Senin", "senin", "Mon",
 * "mon"). Nothing normalized this on write, so `master_courses.schedule[].day`
 * ended up holding whatever string a given import path happened to produce,
 * and every render site (ScheduleSelector, ScheduleViewer, SharePage) printed
 * that raw value -- hence the same course showing "Senin" in one place and
 * "Mon" in another. ScheduleGrid.tsx had already grown its own local
 * DAY_ALIASES/normalizeDay to defend against this for grid-cell matching;
 * this consolidates that logic into one normalizer reused for both matching
 * and display, and adds the Indonesian display labels the app's UI now uses
 * exclusively (see CLAUDE.md: UI is Indonesian-only, codebase stays English).
 */

const DAY_ALIASES: Record<string, DayOfWeek> = {
  mon: "Mon",
  senin: "Mon",
  tue: "Tue",
  selasa: "Tue",
  wed: "Wed",
  rabu: "Wed",
  thu: "Thu",
  kamis: "Thu",
  fri: "Fri",
  jumat: "Fri",
  "jum'at": "Fri",
  jum: "Fri",
  sat: "Sat",
  sabtu: "Sat",
  sun: "Sun",
  minggu: "Sun",
};

/** Normalizes any raw day string (Indonesian/English, full/abbreviated) to
 * the canonical `DayOfWeek` form. Falls back to the first three letters
 * (capitalized) for anything unrecognized, so a typo degrades gracefully
 * instead of throwing. */
export function normalizeDayOfWeek(raw: string): DayOfWeek {
  const lower = (raw || "").toLowerCase().trim();
  const alias =
    DAY_ALIASES[lower] ||
    DAY_ALIASES[lower.slice(0, 3)] ||
    (lower.includes("jum") ? "Fri" : undefined);
  if (alias) return alias;
  const fallback = lower.slice(0, 3);
  return (fallback.charAt(0).toUpperCase() + fallback.slice(1)) as DayOfWeek;
}

/** Indonesian display label for each canonical day. The only dictionary the
 * UI needs now that it is Indonesian-only. */
export const DAY_LABEL_ID: Record<DayOfWeek, string> = {
  Mon: "Senin",
  Tue: "Selasa",
  Wed: "Rabu",
  Thu: "Kamis",
  Fri: "Jumat",
  Sat: "Sabtu",
  Sun: "Minggu",
};

function dayLabel(day: string): string {
  return DAY_LABEL_ID[normalizeDayOfWeek(day)];
}

/** One schedule slot as "{Hari} start-end", e.g. "Senin 07:00-09:00". Shows
 * both ends of the time range -- the previously reported gap was start-only. */
export function formatSlot(slot: TimeSlot): string {
  return `${dayLabel(slot.day)} ${slot.start}-${slot.end}`;
}

/** Every slot in a course's weekly schedule, joined -- not just the first.
 * A course meeting twice a week used to only ever show slot 0 in collapsed
 * views, with the rest hidden behind opening a dropdown. */
export function formatSchedule(schedule: TimeSlot[]): string {
  return schedule.map(formatSlot).join(", ");
}
