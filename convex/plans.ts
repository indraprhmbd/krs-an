import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Save a generated plan to the archive
 */
export const savePlan = mutation({
  args: {
    name: v.string(),
    data: v.string(), // JSON string of the plan
    isSmartGenerated: v.optional(v.boolean()),
    generatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    // Check plan limit
    const existingPlans = await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (existingPlans.length >= 30) {
      throw new Error(
        "Maximum limit of 30 plans reached. Please delete some plans to save a new one.",
      );
    }

    const planId = await ctx.db.insert("plans", {
      userId: user._id,
      name: args.name,
      data: args.data,
      createdAt: Date.now(),
      isSmartGenerated: args.isSmartGenerated,
      generatedBy: args.generatedBy,
    });

    return planId;
  },
});

/**
 * List all archived plans for the current user
 */
export const listPlans = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return [];

    const plans = await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // SECURITY FIX: Add error handling for JSON parsing
    return plans.map((p) => {
      try {
        return {
          ...p,
          data: JSON.parse(p.data),
        };
      } catch (error) {
        console.error(`Failed to parse plan ${p._id}:`, error);
        return {
          ...p,
          data: null,
        };
      }
    });
  },
});

/**
 * Remove a plan from the archive
 */
export const deletePlan = mutation({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== user._id) {
      throw new Error("Plan not found or unauthorized");
    }

    await ctx.db.delete(args.planId);
  },
});

/**
 * Rename an archived plan
 */
export const renamePlan = mutation({
  args: { planId: v.id("plans"), newName: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== user._id) {
      throw new Error("Plan not found or unauthorized");
    }

    await ctx.db.patch(args.planId, { name: args.newName });
  },
});

/**
 * Create a shareable ID for a plan
 */
export const createShareLink = mutation({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== user._id) {
      throw new Error("Plan not found or unauthorized");
    }

    if (plan.shareId) return plan.shareId;

    // Generate a clean 10-char slug
    const shareId = Math.random().toString(36).substring(2, 12);
    await ctx.db.patch(args.planId, { shareId });
    return shareId;
  },
});

/**
 * Get a public shared plan by its shareId
 */
export const getSharedPlan = query({
  args: { shareId: v.string() },
  handler: async (ctx, args) => {
    const plan = await ctx.db
      .query("plans")
      .withIndex("by_shareId", (q) => q.eq("shareId", args.shareId))
      .unique();

    if (!plan) return null;

    try {
      return {
        ...plan,
        data: JSON.parse(plan.data),
      };
    } catch (e) {
      return null;
    }
  },
});
