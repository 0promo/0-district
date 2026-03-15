import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── LIST feed (community page) ────────────────────────────────────────────────
export const listFeed = query({
  args: {
    limit:  v.optional(v.number()),
    cursor: v.optional(v.number()),  // timestamp for pagination
  },
  handler: async (ctx, { limit = 20, cursor }) => {
    let q = ctx.db.query("posts").order("desc");
    const posts = await q.take(limit + 1);

    // Separate pinned posts to the top
    const pinned = posts.filter((p) => p.isPinned);
    const regular = posts.filter((p) => !p.isPinned);

    return [...pinned, ...regular].slice(0, limit);
  },
});

// ── LIST trending posts (hot flag) ────────────────────────────────────────────
export const listHot = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    return ctx.db
      .query("posts")
      .withIndex("by_hot", (q) => q.eq("isHot", true))
      .order("desc")
      .take(limit);
  },
});

// ── GET single post with replies ──────────────────────────────────────────────
export const getWithReplies = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) return null;

    const replies = await ctx.db
      .query("postReplies")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .order("asc")
      .collect();

    return { ...post, replies };
  },
});

// ── CREATE post ───────────────────────────────────────────────────────────────
export const create = mutation({
  args: {
    authorId:          v.id("users"),
    authorName:        v.string(),
    authorInitials:    v.string(),
    authorColor:       v.string(),
    content:           v.string(),
    tags:              v.array(v.string()),
    type:              v.union(
                         v.literal("post"), v.literal("release"),
                         v.literal("collab_request"), v.literal("challenge"),
                         v.literal("sample_drop")
                       ),
    linkedTrackId:     v.optional(v.id("tracks")),
    linkedCollabId:    v.optional(v.id("collabs")),
    linkedChallengeId: v.optional(v.id("challenges")),
  },
  handler: async (ctx, args) => {
    const postId = await ctx.db.insert("posts", {
      ...args,
      isPinned:    false,
      isHot:       false,
      voteCount:   0,
      replyCount:  0,
      saveCount:   0,
    });

    // Broadcast log
    await ctx.db.insert("broadcastLog", {
      type:        "JOIN",
      actorName:   args.authorName,
      actorId:     args.authorId,
      content:     `${args.authorName} → POSTED IN THE NETWORK`,
      actionLabel: "VIEW →",
      timestamp:   Date.now(),
    });

    return postId;
  },
});

// ── REPLY to post ─────────────────────────────────────────────────────────────
export const reply = mutation({
  args: {
    postId:         v.id("posts"),
    authorId:       v.id("users"),
    authorName:     v.string(),
    authorInitials: v.string(),
    authorColor:    v.string(),
    content:        v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("postReplies", {
      ...args,
      voteCount: 0,
    });

    const post = await ctx.db.get(args.postId);
    if (post) {
      await ctx.db.patch(args.postId, { replyCount: post.replyCount + 1 });

      // Notify original post author
      if (post.authorId !== args.authorId) {
        await ctx.db.insert("notifications", {
          userId:     post.authorId,
          type:       "reply",
          title:      "New Reply",
          message:    `${args.authorName} replied to your post`,
          isRead:     false,
          linkedId:   args.postId,
          linkedType: "post",
        });
      }
    }
  },
});

// ── TOGGLE VOTE on post ───────────────────────────────────────────────────────
export const toggleVote = mutation({
  args: { postId: v.id("posts"), userId: v.id("users") },
  handler: async (ctx, { postId, userId }) => {
    const existing = await ctx.db
      .query("postVotes")
      .withIndex("by_post_and_user", (q) =>
        q.eq("postId", postId).eq("userId", userId)
      )
      .unique();

    const post = await ctx.db.get(postId);
    if (!post) return false;

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(postId, { voteCount: Math.max(0, post.voteCount - 1) });
      return false; // unvoted
    } else {
      await ctx.db.insert("postVotes", { postId, userId });
      await ctx.db.patch(postId, { voteCount: post.voteCount + 1 });
      return true; // voted
    }
  },
});

// ── CHECK if user voted ───────────────────────────────────────────────────────
export const hasVoted = query({
  args: { postId: v.id("posts"), userId: v.id("users") },
  handler: async (ctx, { postId, userId }) => {
    const vote = await ctx.db
      .query("postVotes")
      .withIndex("by_post_and_user", (q) =>
        q.eq("postId", postId).eq("userId", userId)
      )
      .unique();
    return !!vote;
  },
});

// ── GET trending topics (sidebar) ─────────────────────────────────────────────
export const getTrendingTopics = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 5 }) => {
    const posts = await ctx.db.query("posts").collect();
    const tagCounts: Record<string, number> = {};

    for (const post of posts) {
      for (const tag of post.tags) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      }
    }

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  },
});

// ── GET community stats (hero section) ────────────────────────────────────────
export const getCommunityStats = query({
  args: {},
  handler: async (ctx) => {
    const [members, postsToday, liveSessions] = await Promise.all([
      ctx.db.query("users").collect().then((u) => u.length),
      ctx.db
        .query("posts")
        .filter((q) => q.gte(q.field("_creationTime"), Date.now() - 86400000))
        .collect()
        .then((p) => p.length),
      ctx.db
        .query("liveSessions")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect()
        .then((s) => s.length),
    ]);
    return { members, postsToday, liveCount: liveSessions };
  },
});
