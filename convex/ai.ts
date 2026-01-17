import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const checkCache = query({
  args: { hash: v.string() },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("ai_cache")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .first();
    return cached ? cached.response : null;
  },
});

export const saveCache = mutation({
  args: { hash: v.string(), response: v.any() },
  handler: async (ctx, args) => {
    // Basic check to avoid duplicates if multiple clients write same cache
    const existing = await ctx.db
      .query("ai_cache")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .first();

    if (!existing) {
      await ctx.db.insert("ai_cache", {
        hash: args.hash,
        response: args.response,
      });
    }
  },
});
