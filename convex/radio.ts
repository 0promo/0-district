import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── GET current queue (ordered by position) ───────────────────────────────────
export const getQueue = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("radioQueue")
      .withIndex("by_position")
      .order("asc")
      .collect();
  },
});

// ── GET now playing (position 0) ──────────────────────────────────────────────
export const getNowPlaying = query({
  args: {},
  handler: async (ctx) => {
    const entry = await ctx.db
      .query("radioQueue")
      .withIndex("by_position", (q) => q.eq("position", 0))
      .unique();
    if (!entry) return null;
    return ctx.db.get(entry.trackId);
  },
});

// ── GET recently played ───────────────────────────────────────────────────────
export const getRecentlyPlayed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    return ctx.db
      .query("radioHistory")
      .withIndex("by_played_at")
      .order("desc")
      .take(limit);
  },
});

// ── ADD track to queue ────────────────────────────────────────────────────────
export const addToQueue = mutation({
  args: {
    trackId:    v.id("tracks"),
    addedBy:    v.string(),
  },
  handler: async (ctx, { trackId, addedBy }) => {
    const track = await ctx.db.get(trackId);
    if (!track) throw new Error("Track not found");

    // Find current max position
    const all = await ctx.db.query("radioQueue").collect();
    const maxPos = all.reduce((max, r) => Math.max(max, r.position), -1);

    await ctx.db.insert("radioQueue", {
      trackId,
      trackTitle:  track.title,
      artistName:  track.artistName,
      artColor:    track.artColor,
      artInitials: track.artInitials,
      position:    maxPos + 1,
      type:        maxPos === -1 ? "NEXT" : "QUEUE",
      addedBy,
    });
  },
});

// ── ADVANCE to next track (remove current, shift positions) ───────────────────
export const advanceQueue = mutation({
  args: { listenerCount: v.optional(v.number()) },
  handler: async (ctx, { listenerCount = 0 }) => {
    const all = await ctx.db
      .query("radioQueue")
      .withIndex("by_position")
      .order("asc")
      .collect();

    if (all.length === 0) return null;

    const [nowPlaying, ...rest] = all;
    const track = await ctx.db.get(nowPlaying.trackId);

    // Log to history
    if (track) {
      await ctx.db.insert("radioHistory", {
        trackId:      nowPlaying.trackId,
        trackTitle:   nowPlaying.trackTitle,
        artistName:   nowPlaying.artistName,
        artColor:     nowPlaying.artColor,
        artInitials:  nowPlaying.artInitials,
        playedAt:     Date.now(),
        listenerCount,
        durationSecs: track.duration ?? 0,
      });
    }

    // Remove current track from queue
    await ctx.db.delete(nowPlaying._id);

    // Re-number remaining tracks and set NEXT type on first
    for (let i = 0; i < rest.length; i++) {
      await ctx.db.patch(rest[i]._id, {
        position: i,
        type:     i === 0 ? "NEXT" : "QUEUE",
      });
    }

    return rest[0] ?? null;
  },
});

// ── GET upcoming broadcasts ───────────────────────────────────────────────────
export const getUpcomingBroadcasts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 5 }) => {
    return ctx.db
      .query("broadcasts")
      .withIndex("by_scheduled_at")
      .order("asc")
      .filter((q) => q.neq(q.field("status"), "ENDED"))
      .take(limit);
  },
});

// ── GET featured broadcast ────────────────────────────────────────────────────
export const getFeaturedBroadcast = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("broadcasts")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .filter((q) => q.neq(q.field("status"), "ENDED"))
      .first();
  },
});

// ── CREATE broadcast event (scheduled takeover) ───────────────────────────────
export const createBroadcast = mutation({
  args: {
    artistId:     v.id("users"),
    artistName:   v.string(),
    title:        v.string(),
    description:  v.string(),
    genre:        v.string(),
    scheduledAt:  v.number(),
    durationMins: v.number(),
    isFeatured:   v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("broadcasts", {
      ...args,
      status:         "UPCOMING",
      listenerCount:  0,
      reminderCount:  0,
      isFeatured:     args.isFeatured ?? false,
    });
  },
});

// ── SET broadcast LIVE ─────────────────────────────────────────────────────────
export const goLive = mutation({
  args: { broadcastId: v.id("broadcasts") },
  handler: async (ctx, { broadcastId }) => {
    const broadcast = await ctx.db.get(broadcastId);
    if (!broadcast) return;

    await ctx.db.patch(broadcastId, { status: "LIVE" });

    // Broadcast log entry
    await ctx.db.insert("broadcastLog", {
      type:        "LIVE",
      actorName:   broadcast.artistName,
      actorId:     broadcast.artistId,
      content:     `${broadcast.artistName} → STARTED LIVE SESSION "${broadcast.title.toUpperCase()}"`,
      actionLabel: "JOIN →",
      timestamp:   Date.now(),
    });
  },
});

// ── ADD broadcast reminder ─────────────────────────────────────────────────────
export const addReminder = mutation({
  args: {
    broadcastId: v.id("broadcasts"),
    userId:      v.id("users"),
  },
  handler: async (ctx, { broadcastId, userId }) => {
    const existing = await ctx.db
      .query("broadcastReminders")
      .withIndex("by_broadcast", (q) => q.eq("broadcastId", broadcastId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .unique();

    if (existing) return; // already set

    await ctx.db.insert("broadcastReminders", { broadcastId, userId });
    const b = await ctx.db.get(broadcastId);
    if (b) await ctx.db.patch(broadcastId, { reminderCount: b.reminderCount + 1 });
  },
});
