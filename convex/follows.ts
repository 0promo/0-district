import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── FOLLOW / unfollow a user ──────────────────────────────────────────────────
export const toggle = mutation({
  args: {
    followerId:  v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, { followerId, followingId }) => {
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", followerId).eq("followingId", followingId)
      )
      .unique();

    if (existing) {
      // Unfollow
      await ctx.db.delete(existing._id);
      const [follower, following] = await Promise.all([
        ctx.db.get(followerId),
        ctx.db.get(followingId),
      ]);
      if (follower) await ctx.db.patch(followerId,  { followingCount: Math.max(0, follower.followingCount - 1) });
      if (following) await ctx.db.patch(followingId, { followerCount: Math.max(0, following.followerCount - 1) });
      return false;
    } else {
      // Follow
      await ctx.db.insert("follows", { followerId, followingId });
      const [follower, following] = await Promise.all([
        ctx.db.get(followerId),
        ctx.db.get(followingId),
      ]);
      if (follower) await ctx.db.patch(followerId,  { followingCount: follower.followingCount + 1 });
      if (following) await ctx.db.patch(followingId, { followerCount: following.followerCount + 1 });

      // Notify the followed user
      const followerUser = await ctx.db.get(followerId);
      await ctx.db.insert("notifications", {
        userId:     followingId,
        type:       "follow",
        title:      "New Follower",
        message:    `${followerUser?.displayName ?? "Someone"} followed you`,
        isRead:     false,
        linkedId:   followerId,
        linkedType: "user",
      });

      // Broadcast log
      await ctx.db.insert("broadcastLog", {
        type:        "JOIN",
        actorName:   followerUser?.displayName ?? "Unknown",
        actorId:     followerId,
        content:     `${followerUser?.displayName ?? "A member"} → NOW FOLLOWING ${following?.displayName ?? "an artist"}`,
        actionLabel: "VIEW →",
        timestamp:   Date.now(),
      });

      return true;
    }
  },
});

// ── CHECK if following ────────────────────────────────────────────────────────
export const isFollowing = query({
  args: {
    followerId:  v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, { followerId, followingId }) => {
    const f = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", followerId).eq("followingId", followingId)
      )
      .unique();
    return !!f;
  },
});

// ── LIST followers of a user ──────────────────────────────────────────────────
export const listFollowers = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit = 50 }) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", userId))
      .take(limit);
    return Promise.all(follows.map((f) => ctx.db.get(f.followerId)));
  },
});

// ── LIST who a user is following ──────────────────────────────────────────────
export const listFollowing = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit = 50 }) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .take(limit);
    return Promise.all(follows.map((f) => ctx.db.get(f.followingId)));
  },
});
