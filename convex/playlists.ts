import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── LIST community / editorial playlists ──────────────────────────────────────
export const listCommunity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    return ctx.db
      .query("playlists")
      .withIndex("by_type", (q) => q.eq("type", "community"))
      .order("desc")
      .take(limit);
  },
});

// ── GET playlist with tracks ──────────────────────────────────────────────────
export const getWithTracks = query({
  args: { playlistId: v.id("playlists") },
  handler: async (ctx, { playlistId }) => {
    const playlist = await ctx.db.get(playlistId);
    if (!playlist) return null;

    const entries = await ctx.db
      .query("playlistTracks")
      .withIndex("by_playlist_position", (q) => q.eq("playlistId", playlistId))
      .order("asc")
      .collect();

    const tracks = await Promise.all(entries.map((e) => ctx.db.get(e.trackId)));
    return { ...playlist, tracks: tracks.filter(Boolean) };
  },
});

// ── CREATE playlist ───────────────────────────────────────────────────────────
export const create = mutation({
  args: {
    creatorId:   v.optional(v.id("users")),
    title:       v.string(),
    artColor:    v.string(),
    description: v.optional(v.string()),
    type:        v.union(v.literal("community"), v.literal("editorial"), v.literal("artist")),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("playlists", {
      ...args,
      isEditorial: args.type === "editorial",
      trackCount:  0,
      saveCount:   0,
    });
  },
});

// ── ADD track to playlist ─────────────────────────────────────────────────────
export const addTrack = mutation({
  args: {
    playlistId: v.id("playlists"),
    trackId:    v.id("tracks"),
    addedBy:    v.id("users"),
  },
  handler: async (ctx, { playlistId, trackId, addedBy }) => {
    const entries = await ctx.db
      .query("playlistTracks")
      .withIndex("by_playlist", (q) => q.eq("playlistId", playlistId))
      .collect();

    const maxPos = entries.reduce((m, e) => Math.max(m, e.position), -1);

    await ctx.db.insert("playlistTracks", {
      playlistId,
      trackId,
      position: maxPos + 1,
      addedAt:  Date.now(),
      addedBy,
    });

    const p = await ctx.db.get(playlistId);
    if (p) await ctx.db.patch(playlistId, { trackCount: p.trackCount + 1 });
  },
});

// ── SAVE / unsave a playlist ───────────────────────────────────────────────────
export const toggleSave = mutation({
  args: { playlistId: v.id("playlists"), userId: v.id("users") },
  handler: async (ctx, { playlistId, userId }) => {
    const existing = await ctx.db
      .query("playlistSaves")
      .withIndex("by_playlist", (q) => q.eq("playlistId", playlistId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .unique();

    const p = await ctx.db.get(playlistId);
    if (!p) return false;

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(playlistId, { saveCount: Math.max(0, p.saveCount - 1) });
      return false;
    } else {
      await ctx.db.insert("playlistSaves", { playlistId, userId });
      await ctx.db.patch(playlistId, { saveCount: p.saveCount + 1 });
      return true;
    }
  },
});
