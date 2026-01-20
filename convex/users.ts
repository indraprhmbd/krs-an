import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { logAudit } from "./audit";

// Import checkAdmin helper from admin module
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
      lastSmartGenerateTime: user?.lastSmartGenerateTime,
      planLimit: user?.planLimit ?? 12,
      preferredAiModel: user?.preferredAiModel ?? "groq",
    };
  },
});

export const updatePreferences = mutation({
  args: {
    preferredAiModel: v.optional(v.string()),
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

    await ctx.db.patch(user._id, {
      preferredAiModel: args.preferredAiModel,
    });
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

    const wibDate = new Date(Date.now() + 7 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    if (user !== null) {
      // Security/Safety: Ensure email is always up to date
      if (user.email !== identity.email) {
        await ctx.db.patch(user._id, { email: identity.email });
      }

      // Check for daily reset (WIB: UTC+7)
      if (user.lastResetDate !== wibDate) {
        await ctx.db.patch(user._id, {
          credits: 5,
          lastResetDate: wibDate,
        });
      }
      return user._id;
    }

    // DATA SAFETY NET: If tokenIdentifier not found (e.g. after migration to production domain)
    // Step 1: Check if user exists with the same email
    if (identity.email) {
      const existingUserByEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email))
        .unique();

      if (existingUserByEmail) {
        // Link via Email
        await ctx.db.patch(existingUserByEmail._id, {
          tokenIdentifier: identity.tokenIdentifier,
          credits: 5,
          lastResetDate: wibDate,
        });
        return existingUserByEmail._id;
      }
    }

    // Step 2: Fallback for imported data without email (Check Clerk User ID / Subject)
    // The tokenIdentifier format is "issuer|subject"
    // We can look for any user whose existing tokenIdentifier ENDS with the same subject
    const subject = identity.tokenIdentifier.split("|").pop();
    if (subject) {
      const allUsers = await ctx.db.query("users").collect();
      const existingUserBySubject = allUsers.find((u) =>
        u.tokenIdentifier.endsWith(`|${subject}`),
      );

      if (existingUserBySubject) {
        // Link via stable Clerk User ID (subject)
        await ctx.db.patch(existingUserBySubject._id, {
          tokenIdentifier: identity.tokenIdentifier,
          email: identity.email, // Populate email while we're at it
          credits: 5,
          lastResetDate: wibDate,
        });
        return existingUserBySubject._id;
      }
    }

    // Create new user (Brand new user)
    const firstUser = (await ctx.db.query("users").first()) === null;

    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email,
      credits: 5,
      lastResetDate: wibDate,
      isAdmin: firstUser,
      planLimit: 12,
    });

    return userId;
  },
});

export const generateServiceToken = mutation({
  args: { type: v.optional(v.string()) },
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

    if (user.credits <= 0) {
      throw new Error("Daily limit reached. Come back tomorrow!");
    }

    // Deduct credit
    const update: any = {
      credits: user.credits - 1,
      lastSmartGenerateTime: Date.now(),
    };

    // If expanding, increment the database limit (CAP at 36)
    if (args.type === "expand") {
      const currentLimit = user.planLimit ?? 12;
      if (currentLimit >= 36) {
        throw new Error("Maximum plan limit (36) already reached.");
      }
      update.planLimit = Math.min(currentLimit + 12, 36);
    }

    await ctx.db.patch(user._id, update);

    await ctx.db.insert("usage_logs", {
      userId: user._id,
      type: args.type || "generate_plan",
      timestamp: Date.now(),
    });

    return { allowed: true, remaining: user.credits - 1 };
  },
});

// For initial development: promote first user or specific token to admin
// SECURITY: This endpoint is now protected - only existing admins can promote others
export const makeAdmin = mutation({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    // CRITICAL SECURITY FIX: Require admin authorization
    await checkAdmin(ctx);

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier),
      )
      .unique();
    if (user) {
      await ctx.db.patch(user._id, { isAdmin: true });

      // Log admin promotion for audit trail
      await logAudit(ctx, {
        user: (await ctx.auth.getUserIdentity())!.tokenIdentifier,
        action: "promote_admin",
        details: `Promoted user ${args.tokenIdentifier} to admin`,
      });
    }
  },
});
