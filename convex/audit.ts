import { MutationCtx } from "./_generated/server";

export async function logAudit(
  ctx: MutationCtx,
  data: {
    user: string;
    action: string;
    details?: string;
  },
) {
  await ctx.db.insert("audit_logs", {
    user: data.user,
    action: data.action,
    details: data.details,
    timestamp: Date.now(),
  });
}
