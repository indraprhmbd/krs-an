import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { logAudit } from "./audit";
import { getAuthedUser, requireUser, requireAdmin } from "./lib";

// Helper to get current user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const user = await getAuthedUser(ctx);

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
    const user = await requireUser(ctx);
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
      // Combine the email-refresh and daily-reset patches into one write:
      // this runs on every auth transition, so the common case (returning
      // user, new day) used to cost two patches instead of one.
      const patch: { email?: string; credits?: number; lastResetDate?: string } =
        {};
      if (user.email !== identity.email) patch.email = identity.email;
      if (user.lastResetDate !== wibDate) {
        patch.credits = 5;
        patch.lastResetDate = wibDate;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(user._id, patch);
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
    const user = await requireUser(ctx);

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
    // Only an existing admin may promote another user.
    const admin = await requireAdmin(ctx);

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
        user: admin.tokenIdentifier,
        action: "promote_admin",
        details: `Promoted user ${args.tokenIdentifier} to admin`,
      });
    }
  },
});
