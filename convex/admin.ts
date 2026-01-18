import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { logAudit } from "./audit";

// Helper to verify admin status
async function checkAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user || !user.isAdmin)
    throw new Error("Forbidden: Admin access required");
  return user;
}

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
    // Simplified count for diagnostic purposes and search support
    let items;
    if (args.prodi && args.prodi !== "all") {
      items = await ctx.db
        .query("master_courses")
        .withIndex("by_prodi", (q) => q.eq("prodi", args.prodi!))
        .collect();
    } else {
      items = await ctx.db.query("master_courses").collect();
    }

    if (args.search) {
      const s = args.search.toLowerCase();
      items = items.filter(
        (c) =>
          c.code.toLowerCase().includes(s) || c.name.toLowerCase().includes(s),
      );
    }

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
    const user = await checkAdmin(ctx);

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
    const user = await checkAdmin(ctx);
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
    await checkAdmin(ctx);
    await ctx.db.patch(args.id, args.updates);
  },
});

export const deleteMasterCourse = mutation({
  args: { id: v.id("master_courses") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const batchDeleteMaster = mutation({
  args: { ids: v.array(v.id("master_courses")) },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
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
    term: v.string(),
    code: v.string(),
    name: v.string(),
    sks: v.number(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    return await ctx.db.insert("curriculum", args);
  },
});

export const removeCurriculumItem = mutation({
  args: { id: v.id("curriculum") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const fixProdiFormatting = mutation({
  args: {},
  handler: async (ctx) => {
    await checkAdmin(ctx);
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
