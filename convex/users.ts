import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── GET currently logged-in user ──────────────────────────────────────────────
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db.get(userId);
  },
});

// ── GET public profile ────────────────────────────────────────────────────────
export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => ctx.db.get(userId),
});

// ── LIST top artists (sorted by total streaming clicks) ───────────────────────
export const listTopArtists = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 12 }) => {
    return ctx.db
      .query("users")
      .withIndex("by_total_clicks")
      .order("desc")
      .filter((q) => q.eq(q.field("role"), "artist"))
      .take(limit);
  },
});

// ── LIST artists by city (Africa signal map) ──────────────────────────────────
export const listByCity = query({
  args: { city: v.string() },
  handler: async (ctx, { city }) => {
    return ctx.db
      .query("users")
      .withIndex("by_city", (q) => q.eq("city", city))
      .filter((q) => q.eq(q.field("role"), "artist"))
      .collect();
  },
});

// ── CREATE / initialise user on first sign-in via Convex Auth ────────────────
// Call this mutation right after authentication to ensure user record exists.
export const ensureUser = mutation({
  args: {
    name:  v.string(),
    email: v.string(),
  },
  handler: async (ctx, { name, email }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(userId);
    if (existing) {
      // Refresh name/email in case they changed in auth provider
      if (existing.name !== name || existing.email !== email) {
        await ctx.db.patch(userId, { name, email });
      }
      return { userId, isNew: false };
    }

    // First sign-in — build initials and assign a colour
    const initials = name
      .trim()
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "?";

    const colours = ["art-red", "art-blue", "art-purple", "art-green", "art-amber", "art-teal"];
    const colour  = colours[Math.floor(Math.random() * colours.length)];

    await ctx.db.insert("users", {
      email,
      name,
      displayName:    name,
      avatarInitials: initials,
      avatarColor:    colour,
      role:           "fan",       // everyone starts as fan
      isVerified:     false,
      isLive:         false,
      genres:         [],
      followerCount:  0,
      followingCount: 0,
      trackCount:     0,
      totalClicks:    0,
    });

    // Broadcast log — new member joined
    await ctx.db.insert("broadcastLog", {
      type:        "JOIN",
      actorName:   name,
      content:     `${name.toUpperCase()} JOINED 0 DISTRICT`,
      actionLabel: "WELCOME →",
      timestamp:   Date.now(),
    });

    return { userId, isNew: true };
  },
});

// ── UPDATE own profile ────────────────────────────────────────────────────────
export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    bio:         v.optional(v.string()),
    city:        v.optional(v.string()),
    country:     v.optional(v.string()),
    countryCode: v.optional(v.string()),
    genres:      v.optional(v.array(v.string())),
    websiteUrl:  v.optional(v.string()),
    socialLinks: v.optional(v.object({
      instagram: v.optional(v.string()),
      twitter:   v.optional(v.string()),
      tiktok:    v.optional(v.string()),
      youtube:   v.optional(v.string()),
    })),
  },
  handler: async (ctx, patch) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, patch);
    return userId;
  },
});

// ── ADMIN: set role ───────────────────────────────────────────────────────────
export const setRole = mutation({
  args: {
    targetUserId: v.id("users"),
    role: v.union(
      v.literal("fan"),
      v.literal("artist"),
      v.literal("curator"),
      v.literal("admin")
    ),
  },
  handler: async (ctx, { targetUserId, role }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const me = await ctx.db.get(userId);
    if (!me || me.role !== "admin") throw new Error("Admin only");
    await ctx.db.patch(targetUserId, { role });
  },
});

// ── SEARCH users ──────────────────────────────────────────────────────────────
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query: q }) => {
    if (!q || q.length < 2) return [];
    const lower = q.toLowerCase().trim();
    const all = await ctx.db.query("users").collect();
    return all
      .filter(
        (u) =>
          u.displayName.toLowerCase().includes(lower) ||
          u.name.toLowerCase().includes(lower)
      )
      .slice(0, 20);
  },
});
