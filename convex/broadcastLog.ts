import { v } from "convex/values";
import { query } from "./_generated/server";

// ── GET latest broadcast log entries (homepage live feed) ─────────────────────
export const getLatest = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    return ctx.db
      .query("broadcastLog")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
  },
});

// ── GET log by type ───────────────────────────────────────────────────────────
export const getByType = query({
  args: {
    type:  v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { type, limit = 10 }) => {
    return ctx.db
      .query("broadcastLog")
      .withIndex("by_type", (q) => q.eq("type", type as any))
      .order("desc")
      .take(limit);
  },
});
