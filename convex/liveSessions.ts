import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── LIST active live sessions (sidebar LIVE NOW) ──────────────────────────────
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("liveSessions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();
  },
});

// ── START a live session ──────────────────────────────────────────────────────
export const start = mutation({
  args: {
    artistId:   v.id("users"),
    artistName: v.string(),
    title:      v.string(),
    genre:      v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("liveSessions", {
      ...args,
      listenerCount: 0,
      status:        "active",
      startedAt:     Date.now(),
    });

    // Mark user as live
    await ctx.db.patch(args.artistId, {
      isLive:        true,
      liveSessionId: sessionId,
    });

    // Broadcast log
    await ctx.db.insert("broadcastLog", {
      type:        "LIVE",
      actorName:   args.artistName,
      actorId:     args.artistId,
      content:     `${args.artistName} → STARTED LIVE SESSION "${args.title.toUpperCase()}"`,
      actionLabel: "JOIN →",
      timestamp:   Date.now(),
    });

    return sessionId;
  },
});

// ── END a live session ────────────────────────────────────────────────────────
export const end = mutation({
  args: {
    sessionId: v.id("liveSessions"),
    artistId:  v.id("users"),
  },
  handler: async (ctx, { sessionId, artistId }) => {
    await ctx.db.patch(sessionId, {
      status:  "ended",
      endedAt: Date.now(),
    });
    await ctx.db.patch(artistId, {
      isLive:        false,
      liveSessionId: undefined,
    });
  },
});

// ── UPDATE listener count (called every 30s from client) ─────────────────────
export const updateListenerCount = mutation({
  args: {
    sessionId:     v.id("liveSessions"),
    listenerCount: v.number(),
  },
  handler: async (ctx, { sessionId, listenerCount }) => {
    await ctx.db.patch(sessionId, { listenerCount });
  },
});
