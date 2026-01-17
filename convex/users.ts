import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to get current user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    return {
      ...user,
      tokenIdentifier: identity.tokenIdentifier,
      isAdmin: !!user?.isAdmin,
      credits: user?.credits ?? 0,
    };
  },
});

export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called ensureUser without authentication present");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (user !== null) {
      // Check for daily reset
      const today = new Date().toISOString().split("T")[0];
      if (user.lastResetDate !== today) {
        await ctx.db.patch(user._id, { credits: 5, lastResetDate: today });
      }
      return user._id;
    }

    // Create new user
    const firstUser = (await ctx.db.query("users").first()) === null;
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      credits: 5, // Daily limit
      lastResetDate: new Date().toISOString().split("T")[0],
      isAdmin: firstUser, // First user is architect
    });

    return userId;
  },
});

export const generateServiceToken = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    if (user.credits <= 0) {
      throw new Error("Daily limit reached. Come back tomorrow!");
    }

    // Deduct credit
    await ctx.db.patch(user._id, { credits: user.credits - 1 });
    await ctx.db.insert("usage_logs", {
      userId: user._id,
      type: "generate_plan",
      timestamp: Date.now(),
    });

    // Return a "signed" token for the backend (Simple implementation: just the user ID + secret for now)
    // In prod, use JWT. For MVP, we'll send the Clerk Token to backend and verify there.
    // Actually, let's just return success and let frontend call backend with Clerk Token.
    // Wait, backend needs to know if credits were deducted?
    // Architecture Refinement: Frontend calls Backend -> Backend calls *Convex Action* to check/deduct credits?
    // Simpler: Frontend calls ensureUser/generateServiceToken. If success, proceeds to call Backend service.

    return { allowed: true, remaining: user.credits - 1 };
  },
});

// For initial development: promote first user or specific token to admin
export const makeAdmin = mutation({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier),
      )
      .unique();
    if (user) {
      await ctx.db.patch(user._id, { isAdmin: true });
    }
  },
});
