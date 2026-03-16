import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─────────────────────────────────────────────────────────────────────────────
//  TRACKS — All tracks curated onto 0 District.
//
//  Audio model:
//    No audio is hosted on 0 District. Tracks embed DSP players:
//      - SoundCloud → SoundCloud Widget API (primary: full playback control)
//      - YouTube    → YouTube iFrame API    (fallback: full playback control)
//      - Spotify / Apple Music / Tidal      → "Also on" links (drives streams)
//
//    Curators add a SoundCloud or YouTube URL when adding a track.
//    All other platform links are supplementary.
// ─────────────────────────────────────────────────────────────────────────────

// ── LIST live tracks (carousels, radio) ───────────────────────────────────────
export const listLive = query({
  args: {
    genre: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { genre, limit = 20 }) => {
    const tracks = await ctx.db
      .query("tracks")
      .withIndex("by_status", (q) => q.eq("status", "LIVE"))
      .order("desc")
      .take(limit * 4);

    if (!genre || genre === "ALL") return tracks.slice(0, limit);
    return tracks
      .filter((t) => t.genre.toUpperCase() === genre.toUpperCase())
      .slice(0, limit);
  },
});

// ── LIST new additions (recently curated onto the platform) ───────────────────
export const listNew = query({
  args: {
    releaseType: v.optional(v.string()),
    limit:       v.optional(v.number()),
  },
  handler: async (ctx, { releaseType, limit = 20 }) => {
    const tracks = await ctx.db
      .query("tracks")
      .withIndex("by_added_at")
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "LIVE"))
      .take(limit * 4);

    if (!releaseType || releaseType === "ALL") return tracks.slice(0, limit);
    return tracks
      .filter((t) => t.releaseType === releaseType.toUpperCase())
      .slice(0, limit);
  },
});

// ── LIST featured tracks ───────────────────────────────────────────────────────
export const listFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 6 }) => {
    return ctx.db
      .query("tracks")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .filter((q) => q.eq(q.field("status"), "LIVE"))
      .order("desc")
      .take(limit);
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

// ── LIST tracks by artist ──────────────────────────────────────────────────────
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

// ── LIST pending submissions (curator review queue) ───────────────────────────
export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const me = await ctx.db.get(userId);
    if (!me || (me.role !== "curator" && me.role !== "admin")) return [];

    return ctx.db
      .query("tracks")
      .withIndex("by_status", (q) => q.eq("status", "PENDING"))
      .order("desc")
      .collect();
  },
});

// ── CURATOR: add track to platform ───────────────────────────────────────────
// Curators add tracks that exist on DSPs. No audio hosting.
export const curatorAdd = mutation({
  args: {
    artistId:    v.id("users"),
    artistName:  v.string(),
    title:       v.string(),
    genre:       v.string(),
    subGenre:    v.optional(v.string()),
    releaseType: v.union(
                   v.literal("SINGLE"), v.literal("EP"),
                   v.literal("ALBUM"),  v.literal("REMIX"), v.literal("TRACK")
                 ),
    city:        v.string(),
    country:     v.string(),
    countryCode: v.string(),
    artColor:    v.string(),
    artInitials: v.string(),
    streamingLinks: v.object({
      soundcloud: v.optional(v.string()),  // Widget API primary
      youtube:    v.optional(v.string()),  // iFrame API fallback
      spotify:    v.optional(v.string()),  // "Also on" link
      apple:      v.optional(v.string()),  // "Also on" link
      tidal:      v.optional(v.string()),  // "Also on" link
    }),
    description:  v.optional(v.string()),
    tags:         v.optional(v.array(v.string())),
    releaseDate:  v.optional(v.number()),  // original DSP release date
    isFeatured:   v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const curatorId = await getAuthUserId(ctx);
    if (!curatorId) throw new Error("Not authenticated");
    const curator = await ctx.db.get(curatorId);
    if (!curator || (curator.role !== "curator" && curator.role !== "admin")) {
      throw new Error("Only curators can add tracks");
    }

    // Must have at least one playable DSP link
    if (!args.streamingLinks.soundcloud && !args.streamingLinks.youtube) {
      throw new Error("A SoundCloud or YouTube link is required for playback");
    }

    const slug = `${args.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

    const trackId = await ctx.db.insert("tracks", {
      artistId:    args.artistId,
      artistName:  args.artistName,
      curatorId,
      curatorName: curator.displayName,
      title:       args.title,
      slug,
      genre:       args.genre,
      subGenre:    args.subGenre,
      releaseType: args.releaseType,
      status:      "LIVE",           // curator adds → goes live immediately
      city:        args.city,
      country:     args.country,
      countryCode: args.countryCode,
      artColor:    args.artColor,
      artInitials: args.artInitials,
      streamingLinks: args.streamingLinks,
      description: args.description,
      tags:        args.tags ?? [],
      label:       "0PROMO",
      isFeatured:  args.isFeatured ?? false,
      clickCount:  0,
      saveCount:   0,
      playlistCount: 0,
      releaseDate: args.releaseDate ?? Date.now(),
      addedAt:     Date.now(),
    });

    // Increment artist's track count
    const artist = await ctx.db.get(args.artistId);
    if (artist) {
      await ctx.db.patch(args.artistId, {
        trackCount: (artist.trackCount ?? 0) + 1,
      });
    }

    // Broadcast log entry
    await ctx.db.insert("broadcastLog", {
      type:        "TRACK",
      actorName:   args.artistName,
      actorId:     args.artistId,
      content:     `${args.artistName.toUpperCase()} → NEW ${args.releaseType} · "${args.title.toUpperCase()}"`,
      actionLabel: "PLAY →",
      timestamp:   Date.now(),
    });

    return trackId;
  },
});

// ── ARTIST: submit track for curator review ───────────────────────────────────
export const artistSubmit = mutation({
  args: {
    title:       v.string(),
    genre:       v.string(),
    city:        v.string(),
    country:     v.string(),
    countryCode: v.string(),
    releaseType: v.string(),
    description: v.optional(v.string()),
    streamingLinks: v.object({
      soundcloud: v.optional(v.string()),
      youtube:    v.optional(v.string()),
      spotify:    v.optional(v.string()),
      apple:      v.optional(v.string()),
      tidal:      v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const me = await ctx.db.get(userId);
    if (!me || (me.role !== "artist" && me.role !== "curator" && me.role !== "admin")) {
      throw new Error("Must be an artist to submit tracks");
    }

    return ctx.db.insert("trackSubmissions", {
      artistId:    userId,
      artistName:  me.displayName,
      title:       args.title,
      genre:       args.genre,
      city:        args.city,
      country:     args.country,
      countryCode: args.countryCode,
      releaseType: args.releaseType,
      description: args.description,
      streamingLinks: args.streamingLinks,
      status:      "pending",
      submittedAt: Date.now(),
    });
  },
});

// ── CURATOR: approve artist submission → create track ─────────────────────────
export const approveSubmission = mutation({
  args: {
    submissionId: v.id("trackSubmissions"),
    artColor:     v.string(),
    artInitials:  v.string(),
    isFeatured:   v.optional(v.boolean()),
  },
  handler: async (ctx, { submissionId, artColor, artInitials, isFeatured }) => {
    const curatorId = await getAuthUserId(ctx);
    if (!curatorId) throw new Error("Not authenticated");
    const curator = await ctx.db.get(curatorId);
    if (!curator || (curator.role !== "curator" && curator.role !== "admin")) {
      throw new Error("Unauthorised");
    }

    const sub = await ctx.db.get(submissionId);
    if (!sub) throw new Error("Submission not found");

    await ctx.db.patch(submissionId, {
      status:     "approved",
      reviewedBy: curatorId,
    });

    const slug = `${sub.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

    const trackId = await ctx.db.insert("tracks", {
      artistId:    sub.artistId,
      artistName:  sub.artistName,
      curatorId,
      curatorName: curator.displayName,
      title:       sub.title,
      slug,
      genre:       sub.genre,
      releaseType: (sub.releaseType as any) ?? "TRACK",
      status:      "LIVE",
      city:        sub.city,
      country:     sub.country,
      countryCode: sub.countryCode,
      artColor,
      artInitials,
      streamingLinks: sub.streamingLinks,
      description: sub.description,
      tags:        [],
      label:       "0PROMO",
      isFeatured:  isFeatured ?? false,
      clickCount:  0,
      saveCount:   0,
      playlistCount: 0,
      releaseDate: Date.now(),
      addedAt:     Date.now(),
    });

    // Notify artist
    await ctx.db.insert("notifications", {
      userId:     sub.artistId,
      type:       "track_live",
      title:      "Your track is now LIVE",
      message:    `"${sub.title}" has been approved and is now on 0 District`,
      isRead:     false,
      linkedId:   trackId,
      linkedType: "track",
    });

    return trackId;
  },
});

// ── CURATOR: reject submission ────────────────────────────────────────────────
export const rejectSubmission = mutation({
  args: {
    submissionId: v.id("trackSubmissions"),
    note:         v.optional(v.string()),
  },
  handler: async (ctx, { submissionId, note }) => {
    const curatorId = await getAuthUserId(ctx);
    if (!curatorId) throw new Error("Not authenticated");
    const curator = await ctx.db.get(curatorId);
    if (!curator || (curator.role !== "curator" && curator.role !== "admin")) {
      throw new Error("Unauthorised");
    }

    const sub = await ctx.db.get(submissionId);
    if (!sub) throw new Error("Not found");

    await ctx.db.patch(submissionId, {
      status:      "rejected",
      curatorNote: note,
      reviewedBy:  curatorId,
    });

    await ctx.db.insert("notifications", {
      userId:     sub.artistId,
      type:       "track_rejected",
      title:      "Track not approved",
      message:    note ?? `"${sub.title}" was not approved at this time`,
      isRead:     false,
    });
  },
});

// ── LOG a streaming click (when user clicks "Play on SoundCloud" etc.) ─────────
export const recordStreamingClick = mutation({
  args: {
    trackId:  v.id("tracks"),
    platform: v.union(
                v.literal("soundcloud"), v.literal("youtube"),
                v.literal("spotify"),   v.literal("apple"),
                v.literal("tidal")
              ),
    source:   v.union(
                v.literal("radio"),    v.literal("home"),
                v.literal("playlist"), v.literal("search"),
                v.literal("collab"),   v.literal("direct")
              ),
  },
  handler: async (ctx, { trackId, platform, source }) => {
    const userId = await getAuthUserId(ctx);
    const track = await ctx.db.get(trackId);
    if (!track) return;

    // Increment track click count
    await ctx.db.patch(trackId, { clickCount: track.clickCount + 1 });

    // Increment artist's total clicks
    const artist = await ctx.db.get(track.artistId);
    if (artist) {
      await ctx.db.patch(track.artistId, {
        totalClicks: (artist.totalClicks ?? 0) + 1,
      });
    }

    // Log the click
    await ctx.db.insert("streamingClicks", {
      trackId,
      artistId:  track.artistId,
      userId:    userId ?? undefined,
      platform,
      source,
      timestamp: Date.now(),
    });
  },
});

// ── SAVE / unsave a track ─────────────────────────────────────────────────────
export const toggleSave = mutation({
  args: { trackId: v.id("tracks") },
  handler: async (ctx, { trackId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to save tracks");

    const existing = await ctx.db
      .query("trackSaves")
      .withIndex("by_track", (q) => q.eq("trackId", trackId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .unique();

    const track = await ctx.db.get(trackId);
    if (!track) return false;

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(trackId, { saveCount: Math.max(0, track.saveCount - 1) });
      return false; // unsaved
    } else {
      await ctx.db.insert("trackSaves", { trackId, userId });
      await ctx.db.patch(trackId, { saveCount: track.saveCount + 1 });
      return true; // saved
    }
  },
});

// ── GET user's saved tracks ────────────────────────────────────────────────────
export const listSaved = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const saves = await ctx.db
      .query("trackSaves")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return Promise.all(saves.map((s) => ctx.db.get(s.trackId)));
  },
});

// ── SEARCH tracks ─────────────────────────────────────────────────────────────
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query: q }) => {
    if (!q || q.length < 2) return [];
    const lower = q.toLowerCase().trim();
    const all = await ctx.db
      .query("tracks")
      .filter((r) => r.eq(r.field("status"), "LIVE"))
      .collect();
    return all
      .filter(
        (t) =>
          t.title.toLowerCase().includes(lower) ||
          t.artistName.toLowerCase().includes(lower) ||
          t.genre.toLowerCase().includes(lower) ||
          t.city?.toLowerCase().includes(lower)
      )
      .slice(0, 20);
  },
});
