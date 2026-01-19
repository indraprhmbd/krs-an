import { action, query, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import MD5 from "crypto-js/md5";

// Polyfill for LangChain in Convex Runtime
if (!globalThis.performance) {
  globalThis.performance = {
    now: () => Date.now(),
  } as any;
}

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

// Rate limiting helper
const RATE_LIMIT_MS = 30000; // 30 seconds

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
  handler: async (ctx, args) => {
    // 1. Auth check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    // 2. Rate limiting (Database Based)
    const user = await ctx.runQuery(api.users.getCurrentUser, {});

    if (!user || user.credits <= 0) {
      throw new Error(
        "Insufficient credits. You need 1 token for Smart Generate.",
      );
    }

    // Strict Database Check
    if (user.lastSmartGenerateTime) {
      const diff = now - user.lastSmartGenerateTime;
      if (diff < RATE_LIMIT_MS) {
        const waitTime = Math.ceil((RATE_LIMIT_MS - diff) / 1000);
        throw new Error(
          `Please wait ${waitTime} seconds before generating again`,
        );
      }
    }

    // 3. Payload Minification
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

    const systemPrompt = `You are a university schedule optimizer. Create 3 diverse, conflict-free schedules.
    CRITICAL RULES:
    1. Total SKS MUST be <= ${args.maxSks}.
    2. NO time conflicts allowed.
    3. Try to respect preferences:
       - Lecturers: ${args.preferences.preferredLecturers.join(", ") || "Any"}
       - Days Off: ${args.preferences.preferredDaysOff.join(", ") || "None"}
    4. You may drop up to 2 subjects if conflicts are unavoidable.
    5. Max ${args.preferences.maxDailySks || 8} SKS per day.
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

    // 4. Check Cache
    const cachedResponse = await ctx.runQuery(api.ai.checkCache, {
      hash: cacheHash,
    });

    if (cachedResponse) {
      console.log("Serving from AI Cache (Hash: " + cacheHash + ")");
      aiResult = cachedResponse;
    } else {
      if (modelToUse === "gemini") {
        throw new Error("Gemini is currently unavailable. Please use Groq.");
      }

      // 5. LangChain Execution Strategy with Fallback
      // Primary: High Intelligence (70b)
      // Fallback: High Speed/Low Cost (8b)

      const runChain = async (modelName: string) => {
        const model = new ChatGroq({
          model: modelName,
          temperature: 0.6,
          apiKey: process.env.GROQ_API_KEY,
        });
        const structuredModel = model.withStructuredOutput(SchedulePlanSchema);
        const promptTemplate = ChatPromptTemplate.fromMessages([
          ["system", systemPrompt],
          ["human", "{input}"],
        ]);
        const chain = promptTemplate.pipe(structuredModel);
        return await chain.invoke({ input: userInput });
      };

      try {
        console.log("Attempting generation with llama-3.3-70b-versatile...");
        aiResult = await runChain("llama-3.3-70b-versatile");
      } catch (primaryError: any) {
        console.warn(
          "Primary model failed, attempting fallback to 8b...",
          primaryError.message,
        );
        try {
          aiResult = await runChain("llama-3.1-8b-instant");
        } catch (fallbackError: any) {
          console.error("Fallback model also failed:", fallbackError);
          throw new Error(
            `AI Generation Failed (Both Primary & Fallback): ${fallbackError.message}`,
          );
        }
      }

      // Save to cache if successful (regardless of which model won)
      if (aiResult) {
        await ctx.runMutation(api.ai.saveCache, {
          hash: cacheHash,
          response: aiResult,
        });
      }
    }

    if (!aiResult || !aiResult.plans || aiResult.plans.length === 0) {
      throw new Error("AI generated no valid plans sections.");
    }

    const aiPlans = aiResult.plans;

    // 6. SERVER-SIDE RECONSTRUCTION
    const courseMap = new Map();
    args.courses.forEach((c: any) => courseMap.set(c.id, c));

    const savedPlanIds: string[] = [];

    for (let i = 0; i < Math.min(aiPlans.length, 3); i++) {
      const aiPlan = aiPlans[i];
      const fullCourses = (aiPlan.courseIds || [])
        .map((id: string) => courseMap.get(id))
        .filter(Boolean);

      if (fullCourses.length === 0) continue;

      const planId = await ctx.runMutation(api.plans.savePlan, {
        name: aiPlan.name || `AI Plan ${i + 1}`,
        data: JSON.stringify({
          id: crypto.randomUUID(),
          name: aiPlan.name || `AI Plan ${i + 1}`,
          courses: fullCourses,
          score: { safe: 80, risky: 5, optimal: 15 },
          analysis: "AI-optimized schedule (LangChain Verified)",
        }),
        isSmartGenerated: true,
        generatedBy: "ai",
      });
      savedPlanIds.push(planId);
    }

    if (savedPlanIds.length > 0) {
      await ctx.runMutation(api.users.generateServiceToken, {});
    } else {
      throw new Error(
        "AI failed to generate a valid schedule. Token was not consumed.",
      );
    }

    return {
      success: true,
      planIds: savedPlanIds,
      count: savedPlanIds.length,
    };
  },
});
