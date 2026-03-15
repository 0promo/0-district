import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// ── LIST live tracks (NOW PLAYING / NEW RELEASES carousels) ──────────────────
export const listLive = query({
  args: {
    genre:  v.optional(v.string()),
    limit:  v.optional(v.number()),
  },
  handler: async (ctx, { genre, limit = 20 }) => {
    let q = ctx.db
      .query("tracks")
      .withIndex("by_status", (q) => q.eq("status", "LIVE"))
      .order("desc");

    const tracks = await q.take(limit * 3); // over-fetch for genre filter

    if (!genre || genre === "ALL") return tracks.slice(0, limit);
    return tracks.filter((t) => t.genre.toUpperCase() === genre).slice(0, limit);
  },
});

// ── LIST new releases (sorted by release date) ────────────────────────────────
export const listNewReleases = query({
  args: {
    releaseType: v.optional(v.string()),
    limit:       v.optional(v.number()),
  },
  handler: async (ctx, { releaseType, limit = 20 }) => {
    const tracks = await ctx.db
      .query("tracks")
      .withIndex("by_release_date")
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "LIVE"))
      .take(limit * 3);

    if (!releaseType || releaseType === "ALL") return tracks.slice(0, limit);
    return tracks
      .filter((t) => t.releaseType === releaseType.toUpperCase())
      .slice(0, limit);
  },
});

// ── GET single track ──────────────────────────────────────────────────────────
export const get = query({
  args: { trackId: v.id("tracks") },
  handler: async (ctx, { trackId }) => ctx.db.get(trackId),
});

// ── GET by slug ───────────────────────────────────────────────────────────────
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("tracks")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

// ── LIST tracks by artist (Studio panel) ─────────────────────────────────────
export const listByArtist = query({
  args: { artistId: v.id("users") },
  handler: async (ctx, { artistId }) => {
    return ctx.db
      .query("tracks")
      .withIndex("by_artist", (q) => q.eq("artistId", artistId))
      .order("desc")
      .collect();
  },
});

// ── UPLOAD / CREATE track (Studio > Upload panel) ────────────────────────────
export const create = mutation({
  args: {
    artistId:       v.id("users"),
    artistName:     v.string(),
    title:          v.string(),
    genre:          v.string(),
    releaseType:    v.union(
                      v.literal("SINGLE"), v.literal("EP"),
                      v.literal("ALBUM"),  v.literal("REMIX"), v.literal("TRACK")
                    ),
    city:           v.string(),
    country:        v.string(),
    countryCode:    v.string(),
    artColor:       v.string(),
    artInitials:    v.string(),
    description:    v.optional(v.string()),
    bpm:            v.optional(v.number()),
    audioStorageId: v.optional(v.id("_storage")),
    tags:           v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Generate URL-safe slug
    const baseSlug = args.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const slug = `${baseSlug}-${Date.now()}`;

    const trackId = await ctx.db.insert("tracks", {
      ...args,
      slug,
      status:      "REVIEW",
      label:       "0PROMO",
      tags:        args.tags ?? [],
      playCount:   0,
      revenueCents: 0,
      saveCount:   0,
      releaseDate: Date.now(),
    });

    // Increment artist's track count
    const artist = await ctx.db.get(args.artistId);
    if (artist) {
      await ctx.db.patch(args.artistId, { trackCount: (artist.trackCount ?? 0) + 1 });
    }

    // Write to broadcast log
    await ctx.db.insert("broadcastLog", {
      type:        "RELEASE",
      actorName:   args.artistName,
      actorId:     args.artistId,
      content:     `${args.artistName} → SUBMITTED "${args.title.toUpperCase()}" FOR REVIEW`,
      actionLabel: "VIEW →",
      timestamp:   Date.now(),
    });

    return trackId;
  },
});

// ── RECORD a play event ───────────────────────────────────────────────────────
export const recordPlay = mutation({
  args: {
    trackId:      v.id("tracks"),
    listenerId:   v.optional(v.id("users")),
    country:      v.optional(v.string()),
    city:         v.optional(v.string()),
    completedPct: v.number(),
    durationSecs: v.number(),
    source:       v.union(
                    v.literal("radio"), v.literal("direct"),
                    v.literal("playlist"), v.literal("search")
                  ),
  },
  handler: async (ctx, args) => {
    const track = await ctx.db.get(args.trackId);
    if (!track) return;

    // Increment track play count
    await ctx.db.patch(args.trackId, { playCount: track.playCount + 1 });

    // Increment artist total plays
    const artist = await ctx.db.get(track.artistId);
    if (artist) {
      await ctx.db.patch(track.artistId, { totalPlays: artist.totalPlays + 1 });
    }

    // Write play event for analytics
    await ctx.db.insert("playEvents", {
      trackId:     args.trackId,
      artistId:    track.artistId,
      listenerId:  args.listenerId,
      country:     args.country,
      city:        args.city,
      completedPct: args.completedPct,
      durationSecs: args.durationSecs,
      source:      args.source,
      timestamp:   Date.now(),
    });
  },
});

// ── APPROVE track (admin) ────────────────────────────────────────────────────
export const approve = mutation({
  args: { trackId: v.id("tracks") },
  handler: async (ctx, { trackId }) => {
    const track = await ctx.db.get(trackId);
    if (!track) return;
    await ctx.db.patch(trackId, { status: "LIVE" });

    // Broadcast log entry
    await ctx.db.insert("broadcastLog", {
      type:        "TRACK",
      actorName:   track.artistName,
      actorId:     track.artistId,
      content:     `${track.artistName} → RELEASED "${track.title.toUpperCase()}"`,
      actionLabel: "VIEW →",
      timestamp:   Date.now(),
    });
  },
});

// ── SAVE / unsave a track ─────────────────────────────────────────────────────
export const toggleSave = mutation({
  args: { trackId: v.id("tracks"), userId: v.id("users") },
  handler: async (ctx, { trackId, userId }) => {
    const existing = await ctx.db
      .query("trackSaves")
      .withIndex("by_track", (q) => q.eq("trackId", trackId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      const t = await ctx.db.get(trackId);
      if (t) await ctx.db.patch(trackId, { saveCount: Math.max(0, t.saveCount - 1) });
      return false;
    } else {
      await ctx.db.insert("trackSaves", { trackId, userId });
      const t = await ctx.db.get(trackId);
      if (t) await ctx.db.patch(trackId, { saveCount: t.saveCount + 1 });
      return true;
    }
  },
});

// ── SEARCH tracks ─────────────────────────────────────────────────────────────
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query: q }) => {
    const all = await ctx.db
      .query("tracks")
      .filter((r) => r.eq(r.field("status"), "LIVE"))
      .collect();
    const lower = q.toLowerCase();
    return all
      .filter((t) =>
        t.title.toLowerCase().includes(lower) ||
        t.artistName.toLowerCase().includes(lower) ||
        t.genre.toLowerCase().includes(lower)
      )
      .slice(0, 20);
  },
});
