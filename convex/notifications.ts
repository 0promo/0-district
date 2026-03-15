import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── GET unread count (nav badge) ──────────────────────────────────────────────
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", userId).eq("isRead", false)
      )
      .collect();
    return unread.length;
  },
});

// ── LIST notifications (Studio panel) ────────────────────────────────────────
export const list = query({
  args: {
    userId: v.id("users"),
    limit:  v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 30 }) => {
    return ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

// ── MARK all as read ──────────────────────────────────────────────────────────
export const markAllRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", userId).eq("isRead", false)
      )
      .collect();
    await Promise.all(unread.map((n) => ctx.db.patch(n._id, { isRead: true })));
  },
});

// ── MARK single notification read ────────────────────────────────────────────
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    await ctx.db.patch(notificationId, { isRead: true });
  },
});
