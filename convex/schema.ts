import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(), // Clerk ID
    email: v.optional(v.string()), // For production migration safety
    credits: v.number(), // Remaining generation credits
    lastResetDate: v.string(), // ISO date for daily reset
    isAdmin: v.optional(v.boolean()),
    lastSmartGenerateTime: v.optional(v.number()), // Timestamp of last AI usage
    planLimit: v.optional(v.number()), // Persistence for expanded generation limit
    preferredAiModel: v.optional(v.string()), // "groq" | "gemini"
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"]),

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
    semester: v.number(), // 1-8; parity IS the term (see src/lib/period.ts)
    // DEPRECATED, do not write. Was `semester % 2` stored as a string, so it
    // held no fact the semester number did not already carry. It was never
    // filtered or indexed, only displayed in one admin column, and it wrote
    // "Odd"/"Even" while this comment claimed "odd"/"even" -- nothing noticed,
    // because nothing read it.
    // Optional rather than removed: Convex validates existing documents on
    // push, and every current row still has this field, so deleting it outright
    // rejects the deploy. Drop it once the rows are cleaned.
    term: v.optional(v.string()),
    code: v.string(),
    name: v.string(),
    sks: v.number(),
  }).index("by_prodi_semester", ["prodi", "semester"]),

  // AI Caching to reduce API costs
  ai_cache: defineTable({
    hash: v.string(),
    response: v.any(), // JSON result from Gemini
  }).index("by_hash", ["hash"]),

  // Audit Logging for security. Write-only today (logAudit inserts, nothing
  // reads it back) -- no index until an admin log viewer actually queries it.
  audit_logs: defineTable({
    user: v.string(), // User Token or Email
    action: v.string(),
    details: v.optional(v.string()),
    timestamp: v.number(),
  }),

  // Write-only today (ai.ts/users.ts insert, nothing reads it back) -- no
  // index until a usage-analytics screen actually queries it.
  usage_logs: defineTable({
    userId: v.id("users"),
    type: v.string(), // "generate_plan" | "analyze"
    timestamp: v.number(),
  }),

  // Admin-managed source of truth for the prodi dropdowns. Replaces two
  // hardcoded arrays (ScheduleConfig.tsx, CurriculumTab.tsx) that had already
  // drifted apart, and let adding a prodi require a code change + redeploy.
  prodi_options: defineTable({
    name: v.string(), // normalized: .toUpperCase().trim().replace(/\.$/, "")
    comingSoon: v.optional(v.boolean()),
    // Which university this prodi belongs to. Undefined = the home institution
    // (UPN "Veteran" Yogyakarta), matching sessionProfile.university's
    // "UPN_VETERAN_YOGYAKARTA" value in ScheduleConfig.tsx. Set to a university
    // code (e.g. "UGM") for anything else, so the config screen's Prodi
    // dropdown can be filtered by the chosen University.
    university: v.optional(v.string()),
  }).index("by_name", ["name"]),
});
