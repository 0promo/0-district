import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// ── GET current user by Clerk ID (called on every page load) ─────────────────
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});

// ── GET public profile by user ID ────────────────────────────────────────────
export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

// ── LIST top artists (homepage, sorted by plays) ─────────────────────────────
export const listTopArtists = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 12 }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_total_plays")
      .order("desc")
      .filter((q) => q.eq(q.field("role"), "creator"))
      .take(limit);
  },
});

// ── LIST artists by city (Africa map pin click) ───────────────────────────────
export const listByCity = query({
  args: { city: v.string() },
  handler: async (ctx, { city }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_city", (q) => q.eq("city", city))
      .filter((q) => q.eq(q.field("role"), "creator"))
      .collect();
  },
});

// ── CREATE user (called from Clerk webhook after sign-up) ────────────────────
export const create = internalMutation({
  args: {
    clerkId:        v.string(),
    email:          v.string(),
    name:           v.string(),
    displayName:    v.string(),
    avatarInitials: v.string(),
    avatarColor:    v.string(),
    city:           v.optional(v.string()),
    country:        v.optional(v.string()),
    countryCode:    v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      ...args,
      city:           args.city        ?? "",
      country:        args.country     ?? "",
      countryCode:    args.countryCode ?? "",
      role:           "fan",
      isVerified:     false,
      isLive:         false,
      genres:         [],
      followerCount:  0,
      followingCount: 0,
      trackCount:     0,
      totalPlays:     0,
      revenueCents:   0,
    });
  },
});

// ── UPDATE profile ────────────────────────────────────────────────────────────
export const updateProfile = mutation({
  args: {
    userId:      v.id("users"),
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
  handler: async (ctx, { userId, ...patch }) => {
    await ctx.db.patch(userId, patch);
  },
});

// ── UPGRADE role to creator ───────────────────────────────────────────────────
export const upgradeToCreator = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { role: "creator" });
  },
});

// ── SEARCH users by display name ─────────────────────────────────────────────
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query: q }) => {
    const all = await ctx.db.query("users").collect();
    const lower = q.toLowerCase();
    return all
      .filter((u) => u.displayName.toLowerCase().includes(lower))
      .slice(0, 20);
  },
});
