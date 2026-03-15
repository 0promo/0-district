import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─────────────────────────────────────────────────────────────────────────────
//  MISC — Email signups, search across entities, email list
// ─────────────────────────────────────────────────────────────────────────────

// ── CAPTURE email from Join section ──────────────────────────────────────────
export const captureEmail = mutation({
  args: {
    email:  v.string(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, { email, source = "homepage_join" }) => {
    const existing = await ctx.db
      .query("emailSignups")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) return existing._id; // idempotent

    return ctx.db.insert("emailSignups", { email, source });
  },
});

// ── GLOBAL SEARCH (artist, track, genre) ─────────────────────────────────────
export const globalSearch = query({
  args: { q: v.string() },
  handler: async (ctx, { q: searchQuery }) => {
    const lower = searchQuery.toLowerCase().trim();
    if (!lower || lower.length < 2) return { tracks: [], artists: [] };

    const [allTracks, allArtists] = await Promise.all([
      ctx.db
        .query("tracks")
        .filter((q) => q.eq(q.field("status"), "LIVE"))
        .collect(),
      ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "creator"))
        .collect(),
    ]);

    const tracks = allTracks
      .filter((t) =>
        t.title.toLowerCase().includes(lower) ||
        t.artistName.toLowerCase().includes(lower) ||
        t.genre.toLowerCase().includes(lower) ||
        t.tags.some((tag) => tag.toLowerCase().includes(lower))
      )
      .slice(0, 10);

    const artists = allArtists
      .filter((a) =>
        a.displayName.toLowerCase().includes(lower) ||
        a.city.toLowerCase().includes(lower) ||
        a.genres.some((g) => g.toLowerCase().includes(lower))
      )
      .slice(0, 5);

    return { tracks, artists };
  },
});

// ── GET trending search terms ─────────────────────────────────────────────────
export const getTrendingSearchTerms = query({
  args: {},
  handler: async (ctx) => {
    // Returns the titles of the top-5 most-played tracks as trending terms
    const tracks = await ctx.db
      .query("tracks")
      .withIndex("by_play_count")
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "LIVE"))
      .take(5);

    return tracks.map((t) => t.title.toUpperCase());
  },
});
