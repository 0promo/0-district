import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── LIST collab requests (collab board) ───────────────────────────────────────
export const list = query({
  args: {
    type:   v.optional(v.string()),
    status: v.optional(v.string()),
    limit:  v.optional(v.number()),
  },
  handler: async (ctx, { type, status, limit = 24 }) => {
    let results = await ctx.db
      .query("collabs")
      .order("desc")
      .take(limit * 3);

    if (type && type !== "all") {
      results = results.filter((c) => c.type === type);
    }
    if (status && status !== "all") {
      results = results.filter((c) => c.status === status);
    }

    return results.slice(0, limit);
  },
});

// ── GET single collab ─────────────────────────────────────────────────────────
export const get = query({
  args: { collabId: v.id("collabs") },
  handler: async (ctx, { collabId }) => ctx.db.get(collabId),
});

// ── LIST collabs by creator (Studio panel) ────────────────────────────────────
export const listByCreator = query({
  args: { creatorId: v.id("users") },
  handler: async (ctx, { creatorId }) => {
    return ctx.db
      .query("collabs")
      .withIndex("by_creator", (q) => q.eq("creatorId", creatorId))
      .order("desc")
      .collect();
  },
});

// ── CREATE collab request ─────────────────────────────────────────────────────
export const create = mutation({
  args: {
    creatorId:    v.id("users"),
    creatorName:  v.string(),
    title:        v.string(),
    type:         v.union(
                    v.literal("vocals"), v.literal("production"),
                    v.literal("remix"),  v.literal("songwriting"),
                    v.literal("mixing"), v.literal("mastering")
                  ),
    description:  v.string(),
    genre:        v.string(),
    bpm:          v.optional(v.number()),
    deadline:     v.optional(v.number()),
    spotsTotal:   v.optional(v.number()),
    artColor:     v.string(),
    artInitials:  v.string(),
    trackId:      v.optional(v.id("tracks")),
  },
  handler: async (ctx, args) => {
    const collabId = await ctx.db.insert("collabs", {
      ...args,
      status:      "open",
      spotsFilled: 0,
    });

    // Broadcast log entry
    await ctx.db.insert("broadcastLog", {
      type:        "COLLAB",
      actorName:   args.creatorName,
      actorId:     args.creatorId,
      content:     `${args.creatorName} → OPENED COLLAB REQUEST "${args.title.toUpperCase()}"`,
      actionLabel: "VIEW →",
      timestamp:   Date.now(),
    });

    return collabId;
  },
});

// ── APPLY to collab ───────────────────────────────────────────────────────────
export const apply = mutation({
  args: {
    collabId:     v.id("collabs"),
    applicantId:  v.id("users"),
    applicantName: v.string(),
    message:      v.string(),
    portfolioUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check for duplicate application
    const existing = await ctx.db
      .query("collabApplications")
      .withIndex("by_collab", (q) => q.eq("collabId", args.collabId))
      .filter((q) => q.eq(q.field("applicantId"), args.applicantId))
      .unique();
    if (existing) throw new Error("Already applied");

    const collab = await ctx.db.get(args.collabId);
    if (!collab || collab.status === "closed") throw new Error("Collab is closed");

    await ctx.db.insert("collabApplications", {
      collabId:     args.collabId,
      applicantId:  args.applicantId,
      applicantName: args.applicantName,
      message:      args.message,
      portfolioUrl: args.portfolioUrl,
      status:       "pending",
    });
  },
});

// ── ACCEPT application ────────────────────────────────────────────────────────
export const acceptApplication = mutation({
  args: { applicationId: v.id("collabApplications") },
  handler: async (ctx, { applicationId }) => {
    const app = await ctx.db.get(applicationId);
    if (!app) return;

    await ctx.db.patch(applicationId, { status: "accepted" });

    // Update spots and status
    const collab = await ctx.db.get(app.collabId);
    if (collab) {
      const spotsFilled = collab.spotsFilled + 1;
      const isFull = collab.spotsTotal != null && spotsFilled >= collab.spotsTotal;
      await ctx.db.patch(app.collabId, {
        spotsFilled,
        status: isFull ? "in_progress" : collab.status,
      });
    }

    // Notify applicant
    await ctx.db.insert("notifications", {
      userId:     app.applicantId,
      type:       "collab_accept",
      title:      "Collab Request Accepted",
      message:    `Your application to "${collab?.title}" was accepted!`,
      isRead:     false,
      linkedId:   app.collabId,
      linkedType: "collab",
    });
  },
});

// ── CLOSE collab ──────────────────────────────────────────────────────────────
export const close = mutation({
  args: { collabId: v.id("collabs") },
  handler: async (ctx, { collabId }) => {
    await ctx.db.patch(collabId, { status: "closed" });
  },
});

// ── LIST applications for a collab (creator view) ────────────────────────────
export const listApplications = query({
  args: { collabId: v.id("collabs") },
  handler: async (ctx, { collabId }) => {
    return ctx.db
      .query("collabApplications")
      .withIndex("by_collab", (q) => q.eq("collabId", collabId))
      .collect();
  },
});
