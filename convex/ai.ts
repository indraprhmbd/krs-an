import { action, query, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    }),
    model: v.optional(v.string()), // "groq" | "gemini"
  },
  handler: async (ctx, args) => {
    // 1. Auth check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.tokenIdentifier;

    const now = Date.now();
    // 2. Rate limiting (Database Based)
    // Fetched in step 3 to save a query

    // 3. Get user and check credits & rate limit
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

    // 4. (Skipped) Token consumption moved to after success

    // OPTIMIZATION: Minify payload to save tokens
    // Group by course code to avoid repeating name/sks/id prefix
    const optimizedCourses = args.courses.reduce((acc: any, c: any) => {
      // Only include courses that are in selectedCodes to save massive space
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
          .join(", "), // Compact schedule string
      });
      return acc;
    }, {});

    const systemPrompt = `You are a university schedule optimizer. Create 3 diverse, conflict-free schedules.`;
    const prompt = `DATA (Minified JSON):
${JSON.stringify(optimizedCourses, null, 2)}

SELECTED CODES (User wants ALL of these):
${args.selectedCodes.join(", ")}

CONSTRAINTS:
- MAX SKS: ${args.maxSks} (CRITICAL: Total SKS MUST NOT exceed this)

USER PREFERENCES:
- Prioritize Lecturers: ${args.preferences.preferredLecturers.join(", ") || "None"}
- Avoid Days: ${args.preferences.preferredDaysOff.join(", ") || "None"}
- Note: ${args.preferences.customInstructions || "None"}

REQUIREMENTS:
1. **CRITICAL:** Total SKS for each plan MUST be ≤ ${args.maxSks}.
2. **FALLBACK:** If mathematically impossible to include all subjects without conflicts or exceeding SKS, you may drop **UP TO TWO (2)** subjects.
3. No time conflicts allowed.
4. Balanced load (≤8 SKS/day).
5. 3 DISTINCT VARIATIONS (different days, times, or lecturers).

THIN OUTPUT FORMAT (JSON ONLY):
{
  "plans": [
    {
      "name": "Strategy Name",
      "courseIds": ["id_from_data_1", "id_from_data_2"]
    }
  ]
}
IMPORTANT:
- Use EXACT IDs from the 'id' field in the DATA provided.
- Do not make up IDs.
- Ensure each plan has NO time overlaps.
- Return ONLY the JSON object.

Return ONLY valid JSON.`;

    let aiResponseText: string | null | undefined;
    const modelToUse = args.model || "groq";

    if (modelToUse === "gemini") {
      // 5a. Call Gemini API with Fallback Logic
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

      try {
        // Try Gemini 2.0 Flash (Experimental) first
        const model = genAI.getGenerativeModel(
          {
            model: "gemini-2.0-flash-exp",
            generationConfig: { responseMimeType: "application/json" },
          },
          { apiVersion: "v1beta" },
        );
        const result = await model.generateContent(
          `${systemPrompt}\n\n${prompt}`,
        );
        aiResponseText = result.response.text();
      } catch (error: any) {
        console.error("Gemini 2.0 Error, falling back to 1.5:", error.message);
        // Fallback to Gemini 1.5 Flash (Stable v1)
        const stableModel = genAI.getGenerativeModel(
          { model: "gemini-1.5-flash" },
          { apiVersion: "v1" },
        );
        const result = await stableModel.generateContent(
          `IMPORTANT: RETURN ONLY JSON.\n\n${systemPrompt}\n\n${prompt}`,
        );
        aiResponseText = result.response.text();
      }
    } else {
      // 5b. Call Groq API
      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        model: "llama-3.3-70b-versatile", // Upgraded to latest 70B for better reasoning
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: 2048,
      });
      aiResponseText = completion.choices[0]?.message?.content;
    }

    try {
      if (!aiResponseText) throw new Error("No response from AI provider");
      const aiResponse = JSON.parse(aiResponseText);
      const aiPlans = aiResponse.plans || [];

      if (aiPlans.length === 0) {
        throw new Error("AI generated no valid plans");
      }

      // 6. SERVER-SIDE RECONSTRUCTION
      // Map IDs back to full objects to ensure data integrity and save tokens
      const courseMap = new Map();
      args.courses.forEach((c: any) => courseMap.set(c.id, c));

      const savedPlanIds: string[] = [];

      for (let i = 0; i < Math.min(aiPlans.length, 3); i++) {
        const aiPlan = aiPlans[i];

        // Reconstruct courses from IDs
        const fullCourses = (aiPlan.courseIds || [])
          .map((id: string) => courseMap.get(id))
          .filter(Boolean);

        // Safety: If reconstruction fails (wrong IDs), skip this plan
        if (fullCourses.length === 0) continue;

        const planId = await ctx.runMutation(api.plans.savePlan, {
          name: aiPlan.name || `AI Plan ${i + 1}`,
          data: JSON.stringify({
            id: crypto.randomUUID(),
            name: aiPlan.name || `AI Plan ${i + 1}`,
            courses: fullCourses,
            score: { safe: 80, risky: 5, optimal: 15 },
            analysis: "AI-optimized schedule with server-side reconstruction",
          }),
          isSmartGenerated: true,
          generatedBy: "ai",
        });
        savedPlanIds.push(planId);
      }

      // 7. FAIR TOKEN REGULATION: Only consume if at least one plan was successfully created
      if (savedPlanIds.length > 0) {
        await ctx.runMutation(api.users.generateServiceToken, {});
      } else {
        throw new Error(
          "AI failed to generate a valid, non-overlapping schedule. Token was not consumed.",
        );
      }

      return {
        success: true,
        planIds: savedPlanIds,
        count: savedPlanIds.length,
      };
    } catch (error: any) {
      console.error("Smart Generate error:", error);
      // Do NOT consume token here
      throw new Error(`AI generation failed: ${error.message}`);
    }
  },
});
