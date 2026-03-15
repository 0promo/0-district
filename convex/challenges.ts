import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── LIST active challenges (collab page) ──────────────────────────────────────
export const listActive = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 12 }) => {
    return ctx.db
      .query("challenges")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(limit);
  },
});

// ── GET featured challenge (featured block) ───────────────────────────────────
export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("challenges")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
  },
});

// ── GET single challenge ──────────────────────────────────────────────────────
export const get = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, { challengeId }) => ctx.db.get(challengeId),
});

// ── GET by slug ───────────────────────────────────────────────────────────────
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("challenges")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

// ── CREATE challenge ──────────────────────────────────────────────────────────
export const create = mutation({
  args: {
    artistId:         v.id("users"),
    artistName:       v.string(),
    title:            v.string(),
    description:      v.string(),
    genre:            v.string(),
    trackId:          v.id("tracks"),
    prizeAmountCents: v.number(),
    prizeDescription: v.string(),
    deadline:         v.number(),
    artColor:         v.string(),
    isFeatured:       v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const slug = args.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const challengeId = await ctx.db.insert("challenges", {
      ...args,
      slug,
      status:     "active",
      entryCount: 0,
      isFeatured: args.isFeatured ?? false,
    });

    // Broadcast log
    await ctx.db.insert("broadcastLog", {
      type:        "CHALLENGE",
      actorName:   args.artistName,
      actorId:     args.artistId,
      content:     `${args.artistName} → OPENED REMIX CHALLENGE "${args.title.toUpperCase()}" · $${(args.prizeAmountCents / 100).toFixed(0)} PRIZE`,
      actionLabel: "ENTER →",
      timestamp:   Date.now(),
    });

    return challengeId;
  },
});

// ── SUBMIT remix entry ────────────────────────────────────────────────────────
export const submitEntry = mutation({
  args: {
    challengeId:    v.id("challenges"),
    submitterId:    v.id("users"),
    submitterName:  v.string(),
    title:          v.string(),
    description:    v.optional(v.string()),
    audioStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || challenge.status !== "active") {
      throw new Error("Challenge is not accepting entries");
    }
    if (challenge.deadline < Date.now()) {
      throw new Error("Challenge deadline has passed");
    }

    const submissionId = await ctx.db.insert("challengeSubmissions", {
      ...args,
      status:      "pending",
      voteCount:   0,
      submittedAt: Date.now(),
    });

    // Increment entry count
    await ctx.db.patch(args.challengeId, { entryCount: challenge.entryCount + 1 });

    return submissionId;
  },
});

// ── LIST submissions for a challenge ─────────────────────────────────────────
export const listSubmissions = query({
  args: {
    challengeId: v.id("challenges"),
    limit:       v.optional(v.number()),
  },
  handler: async (ctx, { challengeId, limit = 50 }) => {
    return ctx.db
      .query("challengeSubmissions")
      .withIndex("by_challenge", (q) => q.eq("challengeId", challengeId))
      .order("desc")
      .take(limit);
  },
});

// ── VOTE on a submission ──────────────────────────────────────────────────────
export const voteSubmission = mutation({
  args: {
    submissionId: v.id("challengeSubmissions"),
  },
  handler: async (ctx, { submissionId }) => {
    const sub = await ctx.db.get(submissionId);
    if (!sub) return;
    await ctx.db.patch(submissionId, { voteCount: sub.voteCount + 1 });
  },
});

// ── PICK WINNER (admin/creator) ───────────────────────────────────────────────
export const pickWinner = mutation({
  args: {
    challengeId:  v.id("challenges"),
    submissionId: v.id("challengeSubmissions"),
  },
  handler: async (ctx, { challengeId, submissionId }) => {
    await ctx.db.patch(submissionId, { status: "winner" });
    await ctx.db.patch(challengeId,  { status: "closed" });

    const submission = await ctx.db.get(submissionId);
    if (submission) {
      await ctx.db.insert("notifications", {
        userId:     submission.submitterId,
        type:       "challenge_win",
        title:      "You Won the Challenge! 🏆",
        message:    `Your remix "${submission.title}" was selected as the winner!`,
        isRead:     false,
        linkedId:   challengeId,
        linkedType: "challenge",
      });
    }
  },
});

// ── GET days remaining until deadline ─────────────────────────────────────────
export const getDaysRemaining = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, { challengeId }) => {
    const challenge = await ctx.db.get(challengeId);
    if (!challenge) return null;
    const ms = challenge.deadline - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  },
});
