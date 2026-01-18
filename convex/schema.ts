import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(), // Clerk ID
    credits: v.number(), // Remaining generation credits
    lastResetDate: v.string(), // ISO date for daily reset
    isAdmin: v.optional(v.boolean()),
    lastSmartGenerateTime: v.optional(v.number()), // Timestamp of last AI usage
    planLimit: v.optional(v.number()), // Persistence for expanded generation limit
    preferredAiModel: v.optional(v.string()), // "groq" | "gemini"
  }).index("by_token", ["tokenIdentifier"]),

  plans: defineTable({
    userId: v.id("users"),
    name: v.string(),
    data: v.string(), // JSON string of the plan
    createdAt: v.number(),
    isSmartGenerated: v.optional(v.boolean()),
    generatedBy: v.optional(v.string()), // "ai" | "manual"
    shareId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "generatedBy"])
    .index("by_shareId", ["shareId"]),

  // Every single available class from the university
  master_courses: defineTable({
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
  })
    .index("by_code", ["code"])
    .index("by_prodi", ["prodi"])
    .searchIndex("search_courses", {
      searchField: "name",
      filterFields: ["prodi"],
    }),

  curriculum: defineTable({
    prodi: v.string(),
    semester: v.number(), // 1-8
    term: v.string(), // "odd" | "even"
    code: v.string(),
    name: v.string(),
    sks: v.number(),
  }).index("by_prodi_semester", ["prodi", "semester"]),

  // AI Caching to reduce API costs
  ai_cache: defineTable({
    hash: v.string(),
    response: v.any(), // JSON result from Gemini
  }).index("by_hash", ["hash"]),

  // Audit Logging for security
  audit_logs: defineTable({
    user: v.string(), // User Token or Email
    action: v.string(),
    details: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),

  usage_logs: defineTable({
    userId: v.id("users"),
    type: v.string(), // "generate_plan" | "analyze"
    timestamp: v.number(),
  }).index("by_user", ["userId"]),
});
