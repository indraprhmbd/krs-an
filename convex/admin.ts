import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { logAudit } from "./audit";
import { requireAdmin } from "./lib";

// checkAdmin used to be defined here (and duplicated in users.ts). It is now
// requireAdmin in ./lib. Re-exported under the old name so existing importers
// (convex/ai.ts) keep working without a rename.
export { requireAdmin as checkAdmin } from "./lib";

export const pingAdmin = query({
  args: {},
  handler: async () => {
    return "Architecture Core Online";
  },
});

// Master Schedule Operations
export const getPaginatedMasterCourses = query({
  args: {
    prodi: v.optional(v.string()),
    search: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    if (args.search) {
      let q = ctx.db
        .query("master_courses")
        .withSearchIndex("search_courses", (q) => {
          let searchQ = q.search("name", args.search!);
          if (args.prodi && args.prodi !== "all") {
            searchQ = searchQ.eq("prodi", args.prodi!);
          }
          return searchQ;
        });

      const results = await q.take(50); // Limit to top 50 results for speed/efficiency
      return {
        page: results,
        isDone: true,
        continueCursor: "",
      };
    }

    if (args.prodi && args.prodi !== "all") {
      return await ctx.db
        .query("master_courses")
        .withIndex("by_prodi", (q) => q.eq("prodi", args.prodi!))
        .paginate(args.paginationOpts);
    }

    // Standard pagination without prodi filter
    return await ctx.db.query("master_courses").paginate(args.paginationOpts);
  },
});

export const getMasterCoursesCount = query({
  args: {
    prodi: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // A search term used to trigger a full-table `.collect()` re-filtered by
    // hand in JS, on every debounced keystroke. Route through the same search
    // index getPaginatedMasterCourses uses instead: it also keeps the count in
    // sync with what that query actually displays (both name-matched), where
    // before this also matched on `code` and could disagree with the list.
    if (args.search) {
      const results = await ctx.db
        .query("master_courses")
        .withSearchIndex("search_courses", (q) => {
          let searchQ = q.search("name", args.search!);
          if (args.prodi && args.prodi !== "all") {
            searchQ = searchQ.eq("prodi", args.prodi!);
          }
          return searchQ;
        })
        .collect();
      return results.length;
    }

    if (args.prodi && args.prodi !== "all") {
      const items = await ctx.db
        .query("master_courses")
        .withIndex("by_prodi", (q) => q.eq("prodi", args.prodi!))
        .collect();
      return items.length;
    }

    const items = await ctx.db.query("master_courses").collect();
    return items.length;
  },
});

export const listMasterCourses = query({
  args: { prodi: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.prodi) {
      return await ctx.db
        .query("master_courses")
        .withIndex("by_prodi", (q) => q.eq("prodi", args.prodi!))
        .collect();
    }
    return await ctx.db.query("master_courses").collect();
  },
});

export const bulkImportMaster = mutation({
  args: {
    courses: v.array(
      v.object({
        code: v.string(),
        name: v.string(),
        sks: v.number(),
        prodi: v.string(),
        class: v.string(),
        lecturer: v.string(),
        room: v.string(),
        capacity: v.optional(v.number()),
        schedule: v.array(
          v.object({
            day: v.string(),
            start: v.string(),
            end: v.string(),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);

    const inputs = args.courses.map((c) => ({
      ...c,
      prodi: c.prodi.toUpperCase().trim().replace(/\.$/, ""),
    }));
    const results = await Promise.all(
      inputs.map(async (course) => {
        // Check for existing course to prevent duplicates (basic check by code + class)
        // We use 'first()' instead of unique() because there might be bad data already.
        const existing = await ctx.db
          .query("master_courses")
          .withIndex("by_code", (q) => q.eq("code", course.code))
          .filter((q) => q.eq(q.field("class"), course.class))
          .first();

        if (existing) {
          // Update existing? Or Skip? For import, usually update or skip.
          // Let's UPDATE to ensure fresh data.
          await ctx.db.patch(existing._id, course);
          return { status: "updated", id: existing._id };
        } else {
          const id = await ctx.db.insert("master_courses", course);
          return { status: "inserted", id };
        }
      }),
    );

    await logAudit(ctx, {
      user: user.tokenIdentifier,
      action: "bulk_import",
      details: `Imported/Updated ${results.length} courses`,
    });

    return { success: true, count: results.length };
  },
});

export const clearMasterData = mutation({
  args: { prodi: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    let items;
    if (args.prodi) {
      items = await ctx.db
        .query("master_courses")
        .withIndex("by_prodi", (q) => q.eq("prodi", args.prodi!))
        .collect();
    } else {
      items = await ctx.db.query("master_courses").collect();
    }

    // Batch delete
    await Promise.all(items.map((item) => ctx.db.delete(item._id)));

    await logAudit(ctx, {
      user: user.tokenIdentifier,
      action: "clear_master_data",
      details: args.prodi ? `Cleared ${args.prodi}` : "Cleared ALL",
    });
  },
});

export const updateMasterCourse = mutation({
  args: {
    id: v.id("master_courses"),
    updates: v.object({
      code: v.optional(v.string()),
      name: v.optional(v.string()),
      sks: v.optional(v.number()),
      prodi: v.optional(v.string()),
      class: v.optional(v.string()),
      lecturer: v.optional(v.string()),
      room: v.optional(v.string()),
      capacity: v.optional(v.number()),
      schedule: v.optional(
        v.array(
          v.object({
            day: v.string(),
            start: v.string(),
            end: v.string(),
          }),
        ),
      ),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, args.updates);
  },
});

export const deleteMasterCourse = mutation({
  args: { id: v.id("master_courses") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const batchDeleteMaster = mutation({
  args: { ids: v.array(v.id("master_courses")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await Promise.all(args.ids.map((id) => ctx.db.delete(id)));
    return { success: true, count: args.ids.length };
  },
});

// Curriculum Operations
export const listCurriculum = query({
  args: { prodi: v.string(), semester: v.optional(v.number()) },
  handler: async (ctx, args) => {
    if (args.semester !== undefined) {
      return await ctx.db
        .query("curriculum")
        .withIndex("by_prodi_semester", (q) =>
          q.eq("prodi", args.prodi).eq("semester", args.semester!),
        )
        .collect();
    }
    return await ctx.db
      .query("curriculum")
      .filter((q) => q.eq(q.field("prodi"), args.prodi))
      .collect();
  },
});

export const addCurriculumItem = mutation({
  args: {
    prodi: v.string(),
    semester: v.number(),
    code: v.string(),
    name: v.string(),
    sks: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("curriculum", args);
  },
});

/**
 * One-off cleanup: strip the deprecated `term` field from curriculum rows.
 *
 * Run once from the dashboard, then `term` can leave convex/schema.ts. Until
 * then the schema must keep it optional, because Convex rejects a push when a
 * stored document carries a field the schema does not declare.
 */
export const dropCurriculumTerm = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("curriculum").collect();
    let cleaned = 0;
    for (const row of rows) {
      if (row.term !== undefined) {
        await ctx.db.patch(row._id, { term: undefined });
        cleaned++;
      }
    }
    return { scanned: rows.length, cleaned };
  },
});

export const removeCurriculumItem = mutation({
  args: { id: v.id("curriculum") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const batchDeleteCurriculum = mutation({
  args: { ids: v.array(v.id("curriculum")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
    return { success: true, deletedCount: args.ids.length };
  },
});

export const fixProdiFormatting = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const masterItems = await ctx.db.query("master_courses").collect();
    const curriculumItems = await ctx.db.query("curriculum").collect();

    let count = 0;
    for (const item of masterItems) {
      const normalized = item.prodi.toUpperCase().trim().replace(/\.$/, "");
      if (item.prodi !== normalized) {
        await ctx.db.patch(item._id, { prodi: normalized });
        count++;
      }
    }

    for (const item of curriculumItems) {
      const normalized = item.prodi.toUpperCase().trim().replace(/\.$/, "");
      if (item.prodi !== normalized) {
        await ctx.db.patch(item._id, { prodi: normalized });
        count++;
      }
    }

    return { success: true, fixedCount: count };
  },
});
