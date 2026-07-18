import {
  action,
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { checkAdmin } from "./admin";
import { requireUser } from "./lib";
import { v } from "convex/values";
import Groq from "groq-sdk";
import { z } from "zod";
import MD5 from "crypto-js/md5";

// Groq shut down llama-3.3-70b-versatile and llama-3.1-8b-instant on
// 2026-08-16. Both replacements below are production tier. Keep primary and
// fallback in different size classes so a fallback is actually meaningful.
const PRIMARY_MODEL = "openai/gpt-oss-120b";
const FALLBACK_MODEL = "openai/gpt-oss-20b";

// Schema for Structured Output
const SchedulePlanSchema = z.object({
  plans: z
    .array(
      z.object({
        name: z
          .string()
          .describe("Name of the strategy (e.g., 'Balanced', 'Free Fridays')"),
        courseIds: z
          .array(z.string())
          .describe("List of EXACT course IDs from the input data"),
      }),
    )
    .describe("Exactly 3 distinct schedule variations"),
});

async function readCache(ctx: QueryCtx, hash: string) {
  const cached = await ctx.db
    .query("ai_cache")
    .withIndex("by_hash", (q) => q.eq("hash", hash))
    .first();
  return cached ? cached.response : null;
}

async function writeCache(ctx: MutationCtx, hash: string, response: unknown) {
  // Avoid duplicates if two callers write the same hash concurrently.
  const existing = await ctx.db
    .query("ai_cache")
    .withIndex("by_hash", (q) => q.eq("hash", hash))
    .first();

  if (!existing) {
    await ctx.db.insert("ai_cache", { hash, response });
  }
}

// Internal cache access for the smartGenerate action below. Not reachable
// from the client.
export const checkCache = internalQuery({
  args: { hash: v.string() },
  handler: async (ctx, args) => readCache(ctx, args.hash),
});

export const saveCache = internalMutation({
  args: { hash: v.string(), response: v.any() },
  handler: async (ctx, args) => writeCache(ctx, args.hash, args.response),
});

// Public cache access for the Intelligence Scraper, which caches results from
// the external AI cleanup service. Admin-gated: an unauthenticated writer could
// otherwise poison ai_cache for every user.
export const checkScraperCache = query({
  args: { hash: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    return readCache(ctx, args.hash);
  },
});

export const saveScraperCache = mutation({
  args: { hash: v.string(), response: v.any() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    return writeCache(ctx, args.hash, args.response);
  },
});

// Rate limiting helper
const RATE_LIMIT_MS = 30000; // 30 seconds
const PLAN_ARCHIVE_CAP = 30;

/**
 * Atomically reserve a credit for a Smart Generate run.
 *
 * The credit was previously checked at the start of the action but only
 * consumed at the very end, with `lastSmartGenerateTime` armed only then too.
 * An action is not transactional, so two rapid or concurrent calls both passed
 * the start check (credits = 1), both hit Groq, and the 30s limit never fired
 * because the timestamp was still unset. Doing the check-and-decrement in a
 * single mutation closes that window: the second caller sees credits = 0 (or a
 * fresh timestamp) and is rejected before any model call.
 *
 * Internal: only reachable from the smartGenerate action below.
 */
export const reserveSmartCredit = internalMutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    if (user.credits <= 0) {
      throw new Error(
        "Insufficient credits. You need 1 token for Smart Generate.",
      );
    }

    if (user.lastSmartGenerateTime) {
      const diff = Date.now() - user.lastSmartGenerateTime;
      if (diff < RATE_LIMIT_MS) {
        const waitTime = Math.ceil((RATE_LIMIT_MS - diff) / 1000);
        throw new Error(
          `Please wait ${waitTime} seconds before generating again`,
        );
      }
    }

    await ctx.db.patch(user._id, {
      credits: user.credits - 1,
      lastSmartGenerateTime: Date.now(),
    });

    await ctx.db.insert("usage_logs", {
      userId: user._id,
      type: "generate_plan",
      timestamp: Date.now(),
    });

    return { userId: user._id };
  },
});

/**
 * Give back a credit reserved by reserveSmartCredit when the run produced no
 * usable plan. The rate-limit timestamp is deliberately left armed, so a failed
 * attempt still cannot be hammered.
 */
export const refundSmartCredit = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    await ctx.db.patch(args.userId, { credits: user.credits + 1 });
  },
});

/**
 * Persist the reconstructed plans in one shot. Replaces the old loop of up to
 * three `api.plans.savePlan` calls (each re-authing and re-collecting the whole
 * archive to check the cap). One user lookup, one cap check, N inserts. Saves
 * only what fits under the archive cap and returns how many landed, so the
 * caller can refund the credit if nothing did.
 */
export const commitSmartPlans = internalMutation({
  args: {
    userId: v.id("users"),
    plans: v.array(v.object({ name: v.string(), data: v.string() })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const room = PLAN_ARCHIVE_CAP - existing.length;
    if (room <= 0) return { saved: 0 };

    const toSave = args.plans.slice(0, room);
    for (const p of toSave) {
      await ctx.db.insert("plans", {
        userId: args.userId,
        name: p.name,
        data: p.data,
        createdAt: Date.now(),
        isSmartGenerated: true,
        generatedBy: "ai",
      });
    }
    return { saved: toSave.length };
  },
});

export const smartGenerate = action({
  args: {
    courses: v.array(v.any()),
    selectedCodes: v.array(v.string()),
    maxSks: v.number(),
    preferences: v.object({
      preferredLecturers: v.array(v.string()),
      preferredDaysOff: v.array(v.string()),
      customInstructions: v.string(),
      maxDailySks: v.optional(v.number()),
      model: v.optional(v.string()),
    }),
    model: v.optional(v.string()), // "groq"
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; count: number }> => {
    // 1. Auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // 2. Atomically reserve a credit and arm the 30s rate limit before any
    // model call (see reserveSmartCredit). Refunded in the catch below if the
    // run yields no usable plan, preserving "a credit is spent only when at
    // least one plan is saved".
    const { userId }: { userId: Id<"users"> } = await ctx.runMutation(
      internal.ai.reserveSmartCredit,
      {},
    );

    try {
      // 3. Payload minification: shorten field names to cut tokens.
      const optimizedCourses = args.courses.reduce((acc: any, c: any) => {
        if (!args.selectedCodes.includes(c.code)) return acc;

        if (!acc[c.code]) {
          acc[c.code] = {
            n: c.name, // n = name
            s: c.sks, // s = sks
            c: [], // c = classes
          };
        }
        acc[c.code].c.push({
          id: c.id,
          k: c.class, // k = kelas
          l: c.lecturer, // l = lecturer
          t: c.schedule
            .map((s: any) => `${s.day.substring(0, 3)} ${s.start}-${s.end}`)
            .join(", "),
        });
        return acc;
      }, {});

      const systemPrompt = `You are a university schedule optimizer. Create 3 diverse, high-quality schedules.
    CRITICAL RULES:
    1. Total SKS should be <= ${args.maxSks}. If impossible, prioritize mandatory subjects.
    2. MINIMIZE time conflicts. While conflict-free is ideal, providing a plan with a minor conflict is better than no plan.
    3. Try to respect preferences:
       - Lecturers: ${args.preferences.preferredLecturers.join(", ") || "Any"}
       - Days Off: ${args.preferences.preferredDaysOff.join(", ") || "None"}
    4. You may drop subjects ONLY if they cannot be scheduled at all, but try to keep as many as possible.
    5. Max ${args.preferences.maxDailySks || 8} SKS per day.
    6. ALWAYS return 3 plans unless the input data is extremely limited.
    `;

      const userInput = `DATA: ${JSON.stringify(optimizedCourses)}
    SELECTED CODES: ${args.selectedCodes.join(", ")}
    USER NOTE: ${args.preferences.customInstructions || "None"}`;

      const modelToUse = args.model || "groq";

      // Hash input for cache
      const hashInput = JSON.stringify({
        optimizedCourses,
        selectedCodes: args.selectedCodes,
        maxSks: args.maxSks,
        preferences: args.preferences,
        model: modelToUse,
      });
      const cacheHash = MD5(hashInput).toString();

      let aiResult: any;

      // 4. Check cache
      const cachedResponse = await ctx.runQuery(internal.ai.checkCache, {
        hash: cacheHash,
      });

      if (cachedResponse) {
        console.log("Serving from AI Cache (Hash: " + cacheHash + ")");
        aiResult = cachedResponse;
      } else {
        if (modelToUse === "gemini") {
          throw new Error("Gemini is currently unavailable. Please use Groq.");
        }

        // 5. Groq execution with fallback.
        // Primary: high intelligence. Fallback: faster and cheaper.
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const runChain = async (modelName: string) => {
          const completion = await groq.chat.completions.create({
            model: modelName,
            temperature: 0.6,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userInput },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "schedule_plans",
                schema: z.toJSONSchema(SchedulePlanSchema) as Record<
                  string,
                  unknown
                >,
              },
            },
          });

          const raw = completion.choices[0]?.message?.content;
          if (!raw) throw new Error("Model returned an empty response");

          // Parse through zod rather than trusting the model. Combined with the
          // courseId reconstruction below, a malformed plan is dropped, not used.
          return SchedulePlanSchema.parse(JSON.parse(raw));
        };

        try {
          console.log(`Attempting generation with ${PRIMARY_MODEL}...`);
          aiResult = await runChain(PRIMARY_MODEL);
        } catch (primaryError: any) {
          console.warn(
            `Primary model failed, falling back to ${FALLBACK_MODEL}...`,
            primaryError.message,
          );
          try {
            aiResult = await runChain(FALLBACK_MODEL);
          } catch (fallbackError: any) {
            console.error("Fallback model also failed:", fallbackError);
            throw new Error(
              `AI Generation Failed (Both Primary & Fallback): ${fallbackError.message}`,
            );
          }
        }

        // Save to cache if successful (regardless of which model won)
        if (aiResult) {
          await ctx.runMutation(internal.ai.saveCache, {
            hash: cacheHash,
            response: aiResult,
          });
        }
      }

      if (!aiResult || !aiResult.plans || aiResult.plans.length === 0) {
        throw new Error("AI generated no valid plans sections.");
      }

      const aiPlans = aiResult.plans;

      // 6. Server-side reconstruction: map the model's courseIds back through
      // the real course data, dropping any hallucinated id.
      const courseMap = new Map();
      args.courses.forEach((c: any) => courseMap.set(c.id, c));

      const planPayloads: { name: string; data: string }[] = [];
      for (let i = 0; i < Math.min(aiPlans.length, 3); i++) {
        const aiPlan = aiPlans[i];
        const fullCourses = (aiPlan.courseIds || [])
          .map((id: string) => courseMap.get(id))
          .filter(Boolean);

        if (fullCourses.length === 0) continue;

        const name = aiPlan.name || `AI Plan ${i + 1}`;
        planPayloads.push({
          name,
          data: JSON.stringify({
            id: crypto.randomUUID(),
            name,
            courses: fullCourses,
            score: { safe: 80, risky: 5, optimal: 15 },
            analysis: "AI-optimized schedule",
          }),
        });
      }

      if (planPayloads.length === 0) {
        throw new Error(
          "AI failed to generate a valid schedule. Token was not consumed.",
        );
      }

      // 7. Persist every surviving plan in one mutation (one user lookup, one
      // cap check) instead of a savePlan call per plan.
      const { saved }: { saved: number } = await ctx.runMutation(
        internal.ai.commitSmartPlans,
        {
          userId,
          plans: planPayloads,
        },
      );

      if (saved === 0) {
        throw new Error(
          "Your plan archive is full (30). Delete some to save new ones. Token was not consumed.",
        );
      }

      return { success: true, count: saved };
    } catch (err) {
      // Any failure after the reserve refunds the credit. The rate-limit
      // timestamp stays armed, so a failing attempt still cannot be hammered.
      await ctx.runMutation(internal.ai.refundSmartCredit, { userId });
      throw err;
    }
  },
});
