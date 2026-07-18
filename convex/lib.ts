import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

/**
 * Shared auth helpers.
 *
 * Every authed function used to inline the same block: get the Clerk identity,
 * query `users` by_token, `.unique()`, then null-check. It appeared ~10 times
 * across users/plans/admin/ai, and `checkAdmin` was duplicated verbatim in two
 * files. That is the "spaghetti" -- one bug fix had to be made in ten places.
 * These three helpers are the single source now. Import them; do not re-inline.
 */

type AnyCtx = QueryCtx | MutationCtx;

/**
 * The current user's row, or null when unauthenticated or no row exists yet.
 * Use in read paths that tolerate an anonymous caller (return [] / null).
 */
export async function getAuthedUser(
  ctx: AnyCtx,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

/**
 * The current user's row, throwing when unauthenticated or the row is missing.
 * Use in mutations that require an identity.
 */
export async function requireUser(ctx: AnyCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!user) throw new Error("User not found");
  return user;
}

/**
 * The current user, asserted to be an admin. Throws Unauthorized (no identity)
 * or Forbidden (identity but no row / not admin), preserving the messages the
 * old duplicated `checkAdmin` threw. Every admin mutation must call this; there
 * is no automatic gating.
 */
export async function requireAdmin(ctx: AnyCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!user || !user.isAdmin)
    throw new Error("Forbidden: Admin access required");
  return user;
}

/**
 * Canonical day-of-week form ("Mon".."Sun"), mirroring
 * src/lib/schedule-format.ts's normalizeDayOfWeek. Duplicated rather than
 * imported: convex/ never imports from src/ (different tsconfig, different
 * runtime), and this is small enough that keeping one copy per side is
 * cheaper than crossing that boundary. If you change one, change both.
 *
 * Source schedule data is scraped from real timetables and mixes Indonesian
 * and English, full and abbreviated ("Senin", "senin", "Mon", "mon"). Nothing
 * normalized this on write before, so master_courses.schedule[].day ended up
 * holding whatever string a given import path produced, and the UI displayed
 * inconsistent day names for the same canonical day depending on which import
 * path touched the row. Call this at every write path that accepts a day
 * string, not just the ones that remember to.
 */
const DAY_ALIASES: Record<string, string> = {
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

export function normalizeDayOfWeek(raw: string): string {
  const lower = (raw || "").toLowerCase().trim();
  const alias =
    DAY_ALIASES[lower] ||
    DAY_ALIASES[lower.slice(0, 3)] ||
    (lower.includes("jum") ? "Fri" : undefined);
  if (alias) return alias;
  const fallback = lower.slice(0, 3);
  return fallback.charAt(0).toUpperCase() + fallback.slice(1);
}
