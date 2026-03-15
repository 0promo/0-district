import { v } from "convex/values";
import { query } from "./_generated/server";

// ── STUDIO DASHBOARD STATS for an artist ─────────────────────────────────────
export const getArtistDashboard = query({
  args: { artistId: v.id("users") },
  handler: async (ctx, { artistId }) => {
    const user = await ctx.db.get(artistId);
    if (!user) return null;

    // Plays last 7 days, grouped by day
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const recentPlays = await ctx.db
      .query("playEvents")
      .withIndex("by_artist", (q) => q.eq("artistId", artistId))
      .filter((q) => q.gte(q.field("timestamp"), sevenDaysAgo))
      .collect();

    // Group by day-of-week
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const dayMap: Record<string, number> = {};
    for (const play of recentPlays) {
      const day = dayNames[new Date(play.timestamp).getDay()];
      dayMap[day] = (dayMap[day] ?? 0) + 1;
    }

    // Top regions from play events
    const regionMap: Record<string, number> = {};
    for (const play of recentPlays) {
      if (play.country) {
        regionMap[play.country] = (regionMap[play.country] ?? 0) + 1;
      }
    }
    const topRegions = Object.entries(regionMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([country, count]) => ({
        country,
        count,
        pct: Math.round((count / recentPlays.length) * 100),
      }));

    // Avg completion rate
    const completionRates = recentPlays.map((p) => p.completedPct);
    const avgCompletion = completionRates.length
      ? Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length)
      : 0;

    // Avg listen time in seconds
    const durations = recentPlays.map((p) => p.durationSecs);
    const avgDuration = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    return {
      totalPlays:    user.totalPlays,
      followerCount: user.followerCount,
      trackCount:    user.trackCount,
      revenueCents:  user.revenueCents,
      playsLast7Days: dayNames.map((day) => ({
        day,
        count: dayMap[day] ?? 0,
      })),
      topRegions,
      avgCompletionPct: avgCompletion,
      avgListenSecs:    avgDuration,
    };
  },
});

// ── PLATFORM STATS (homepage stats strip) ────────────────────────────────────
export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    // Try cached stats first
    const cached = await ctx.db.query("platformStats").first();
    if (cached) return cached;

    // Compute live if no cache
    const [artists, tracks, liveSessions] = await Promise.all([
      ctx.db.query("users")
        .filter((q) => q.eq(q.field("role"), "creator"))
        .collect()
        .then((u) => u.length),
      ctx.db.query("tracks")
        .filter((q) => q.eq(q.field("status"), "LIVE"))
        .collect()
        .then((t) => t.length),
      ctx.db.query("liveSessions")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect()
        .then((s) => s.length),
    ]);

    return {
      artistCount:     artists,
      trackCount:      tracks,
      activeDistricts: 4,
      liveCount:       liveSessions,
      memberCount:     artists,
      updatedAt:       Date.now(),
    };
  },
});

// ── TOP TRACKS by play count ──────────────────────────────────────────────────
export const getTopTracks = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    return ctx.db
      .query("tracks")
      .withIndex("by_play_count")
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "LIVE"))
      .take(limit);
  },
});

// ── PLAY BREAKDOWN by source ──────────────────────────────────────────────────
export const getPlaysBySource = query({
  args: {
    artistId: v.id("users"),
    days:     v.optional(v.number()),
  },
  handler: async (ctx, { artistId, days = 30 }) => {
    const since = Date.now() - days * 86400000;
    const plays = await ctx.db
      .query("playEvents")
      .withIndex("by_artist", (q) => q.eq("artistId", artistId))
      .filter((q) => q.gte(q.field("timestamp"), since))
      .collect();

    const sourceMap: Record<string, number> = {
      radio: 0, direct: 0, playlist: 0, search: 0,
    };
    for (const p of plays) sourceMap[p.source]++;
    return sourceMap;
  },
});

// ── AFRICA MAP stats per city ─────────────────────────────────────────────────
export const getCityStats = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("cities")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});
