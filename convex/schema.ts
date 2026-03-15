import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ─────────────────────────────────────────────────────────────────────────────
//  0 DISTRICT — Convex Database Schema
//  Platform: African music city / 0PromoRecords
//  Tables: users, tracks, radio, collabs, challenges, community, playlists,
//          follows, notifications, analytics, cities, broadcastLog
// ─────────────────────────────────────────────────────────────────────────────

export default defineSchema({

  // ── USERS ──────────────────────────────────────────────────────────────────
  // All platform members: artists, fans, label reps, admins
  users: defineTable({
    // Identity
    clerkId:        v.string(),          // Clerk auth provider ID
    email:          v.string(),
    name:           v.string(),          // Full name
    displayName:    v.string(),          // Stage name / public handle (e.g. "KOFI MANU")
    avatarInitials: v.string(),          // e.g. "KM"
    avatarColor:    v.string(),          // e.g. "art-red", "art-blue"
    avatarStorageId: v.optional(v.id("_storage")), // uploaded photo

    // Role & status
    role:           v.union(
                      v.literal("fan"),
                      v.literal("creator"),
                      v.literal("label"),
                      v.literal("admin")
                    ),
    isVerified:     v.boolean(),
    isLive:         v.boolean(),

    // Location
    city:           v.string(),          // e.g. "ACCRA"
    country:        v.string(),          // e.g. "Ghana"
    countryCode:    v.string(),          // e.g. "GH"

    // Profile
    bio:            v.optional(v.string()),
    genres:         v.array(v.string()), // e.g. ["Afrobeats", "Afro Soul"]
    websiteUrl:     v.optional(v.string()),
    socialLinks:    v.optional(v.object({
                      instagram: v.optional(v.string()),
                      twitter:   v.optional(v.string()),
                      tiktok:    v.optional(v.string()),
                      youtube:   v.optional(v.string()),
                    })),

    // Cached counters (updated by mutations, read fast)
    followerCount:  v.number(),
    followingCount: v.number(),
    trackCount:     v.number(),
    totalPlays:     v.number(),
    revenueCents:   v.number(),          // lifetime earnings in cents

    // Live session ref
    liveSessionId:  v.optional(v.id("liveSessions")),
  })
    .index("by_clerk_id",   ["clerkId"])
    .index("by_email",      ["email"])
    .index("by_role",       ["role"])
    .index("by_city",       ["city"])
    .index("by_total_plays",["totalPlays"]),

  // ── TRACKS ─────────────────────────────────────────────────────────────────
  // All music uploaded by creators
  tracks: defineTable({
    // Ownership
    artistId:       v.id("users"),
    artistName:     v.string(),          // denormalised for fast reads

    // Metadata
    title:          v.string(),
    slug:           v.string(),          // url-safe, unique
    genre:          v.string(),          // e.g. "Afrobeats"
    subGenre:       v.optional(v.string()),
    releaseType:    v.union(
                      v.literal("SINGLE"),
                      v.literal("EP"),
                      v.literal("ALBUM"),
                      v.literal("REMIX"),
                      v.literal("TRACK")
                    ),
    status:         v.union(
                      v.literal("DRAFT"),
                      v.literal("REVIEW"),
                      v.literal("LIVE"),
                      v.literal("REMOVED")
                    ),

    // Geography
    city:           v.string(),
    country:        v.string(),
    countryCode:    v.string(),

    // Art
    artColor:       v.string(),          // e.g. "art-red"
    artInitials:    v.string(),          // e.g. "KM"
    artStorageId:   v.optional(v.id("_storage")),

    // Audio
    audioStorageId: v.optional(v.id("_storage")),
    duration:       v.optional(v.number()),   // seconds
    format:         v.optional(v.string()),   // e.g. "WAV 320kbps"
    bpm:            v.optional(v.number()),

    // Content
    description:    v.optional(v.string()),
    lyrics:         v.optional(v.string()),
    label:          v.string(),          // default "0PROMO"
    tags:           v.array(v.string()),

    // Stats (cached)
    playCount:      v.number(),
    revenueCents:   v.number(),
    saveCount:      v.number(),
    completionRate: v.optional(v.number()), // 0-100 %
    avgListenSecs:  v.optional(v.number()),

    // Dates
    releaseDate:    v.number(),          // Unix timestamp
  })
    .index("by_artist",       ["artistId"])
    .index("by_status",       ["status"])
    .index("by_genre",        ["genre"])
    .index("by_slug",         ["slug"])
    .index("by_release_type", ["releaseType"])
    .index("by_play_count",   ["playCount"])
    .index("by_city",         ["city"])
    .index("by_release_date", ["releaseDate"]),

  // ── RADIO QUEUE ────────────────────────────────────────────────────────────
  // Current live broadcast queue (ordered by position)
  radioQueue: defineTable({
    trackId:        v.id("tracks"),
    trackTitle:     v.string(),          // denormalised
    artistName:     v.string(),          // denormalised
    artColor:       v.string(),
    artInitials:    v.string(),
    position:       v.number(),
    type:           v.union(v.literal("NEXT"), v.literal("QUEUE")),
    addedBy:        v.string(),          // "system" | userId
  })
    .index("by_position", ["position"]),

  // ── RADIO HISTORY ──────────────────────────────────────────────────────────
  // Log of every track played on the radio
  radioHistory: defineTable({
    trackId:        v.id("tracks"),
    trackTitle:     v.string(),
    artistName:     v.string(),
    artColor:       v.string(),
    artInitials:    v.string(),
    playedAt:       v.number(),
    listenerCount:  v.number(),
    durationSecs:   v.optional(v.number()),
  })
    .index("by_played_at", ["playedAt"]),

  // ── BROADCASTS ─────────────────────────────────────────────────────────────
  // Scheduled and past takeover / live broadcast events
  broadcasts: defineTable({
    artistId:       v.id("users"),
    artistName:     v.string(),
    title:          v.string(),          // e.g. "DJ SENEGAL TAKEOVER"
    description:    v.string(),          // e.g. "3HR LIVE SET · AFRO HOUSE"
    genre:          v.string(),
    scheduledAt:    v.number(),          // Unix timestamp
    durationMins:   v.number(),
    status:         v.union(
                      v.literal("UPCOMING"),
                      v.literal("LIVE"),
                      v.literal("ENDED")
                    ),
    listenerCount:  v.number(),
    isFeatured:     v.boolean(),
    reminderCount:  v.number(),
  })
    .index("by_artist",       ["artistId"])
    .index("by_status",       ["status"])
    .index("by_scheduled_at", ["scheduledAt"])
    .index("by_featured",     ["isFeatured"]),

  // ── BROADCAST REMINDERS ────────────────────────────────────────────────────
  broadcastReminders: defineTable({
    broadcastId:    v.id("broadcasts"),
    userId:         v.id("users"),
  })
    .index("by_broadcast", ["broadcastId"])
    .index("by_user",      ["userId"]),

  // ── LIVE SESSIONS ──────────────────────────────────────────────────────────
  // Real-time listening rooms (community sidebar "LIVE NOW")
  liveSessions: defineTable({
    artistId:       v.id("users"),
    artistName:     v.string(),
    title:          v.string(),          // e.g. "DAKAR NIGHTS VOL.3"
    genre:          v.string(),
    listenerCount:  v.number(),
    status:         v.union(v.literal("active"), v.literal("ended")),
    startedAt:      v.number(),
    endedAt:        v.optional(v.number()),
  })
    .index("by_status",     ["status"])
    .index("by_artist",     ["artistId"])
    .index("by_started_at", ["startedAt"]),

  // ── COLLABS ────────────────────────────────────────────────────────────────
  // Open collaboration requests (collab board)
  collabs: defineTable({
    creatorId:      v.id("users"),
    creatorName:    v.string(),

    title:          v.string(),          // e.g. "Need Female Vocalist"
    type:           v.union(
                      v.literal("vocals"),
                      v.literal("production"),
                      v.literal("remix"),
                      v.literal("songwriting"),
                      v.literal("mixing"),
                      v.literal("mastering")
                    ),
    status:         v.union(
                      v.literal("open"),
                      v.literal("in_progress"),
                      v.literal("closed")
                    ),

    description:    v.string(),
    genre:          v.string(),
    bpm:            v.optional(v.number()),
    deadline:       v.optional(v.number()),

    // Spots
    spotsTotal:     v.optional(v.number()),  // null = unlimited
    spotsFilled:    v.number(),

    // Art
    artColor:       v.string(),
    artInitials:    v.string(),

    // Optional linked track (for remix collabs)
    trackId:        v.optional(v.id("tracks")),
    stemStorageId:  v.optional(v.id("_storage")),
  })
    .index("by_creator",  ["creatorId"])
    .index("by_type",     ["type"])
    .index("by_status",   ["status"])
    .index("by_genre",    ["genre"]),

  // ── COLLAB APPLICATIONS ────────────────────────────────────────────────────
  collabApplications: defineTable({
    collabId:       v.id("collabs"),
    applicantId:    v.id("users"),
    applicantName:  v.string(),
    message:        v.string(),
    portfolioUrl:   v.optional(v.string()),
    status:         v.union(
                      v.literal("pending"),
                      v.literal("accepted"),
                      v.literal("rejected")
                    ),
  })
    .index("by_collab",    ["collabId"])
    .index("by_applicant", ["applicantId"])
    .index("by_status",    ["status"]),

  // ── CHALLENGES ─────────────────────────────────────────────────────────────
  // Remix challenges (collab page)
  challenges: defineTable({
    artistId:       v.id("users"),
    artistName:     v.string(),

    title:          v.string(),          // e.g. "JOBURG GRID"
    slug:           v.string(),
    description:    v.string(),
    genre:          v.string(),

    trackId:        v.id("tracks"),      // the original track to remix
    stemStorageId:  v.optional(v.id("_storage")),

    // Prize
    prizeAmountCents: v.number(),        // e.g. 50000 = $500
    prizeDescription: v.string(),

    deadline:       v.number(),          // Unix timestamp
    status:         v.union(
                      v.literal("active"),
                      v.literal("judging"),
                      v.literal("closed")
                    ),
    entryCount:     v.number(),
    isFeatured:     v.boolean(),

    artColor:       v.string(),
  })
    .index("by_artist",   ["artistId"])
    .index("by_status",   ["status"])
    .index("by_slug",     ["slug"])
    .index("by_featured", ["isFeatured"])
    .index("by_deadline", ["deadline"]),

  // ── CHALLENGE SUBMISSIONS ──────────────────────────────────────────────────
  challengeSubmissions: defineTable({
    challengeId:    v.id("challenges"),
    submitterId:    v.id("users"),
    submitterName:  v.string(),

    title:          v.string(),
    description:    v.optional(v.string()),
    audioStorageId: v.id("_storage"),

    status:         v.union(
                      v.literal("pending"),
                      v.literal("shortlisted"),
                      v.literal("winner"),
                      v.literal("disqualified")
                    ),
    voteCount:      v.number(),
    submittedAt:    v.number(),
  })
    .index("by_challenge",  ["challengeId"])
    .index("by_submitter",  ["submitterId"])
    .index("by_status",     ["status"])
    .index("by_vote_count", ["voteCount"]),

  // ── POSTS ──────────────────────────────────────────────────────────────────
  // Community feed posts / threads (network page)
  posts: defineTable({
    authorId:       v.id("users"),
    authorName:     v.string(),
    authorInitials: v.string(),
    authorColor:    v.string(),

    content:        v.string(),
    tags:           v.array(v.string()),  // e.g. ["#NEWRELEASE", "#AFROBEATS"]
    type:           v.union(
                      v.literal("post"),
                      v.literal("release"),
                      v.literal("collab_request"),
                      v.literal("challenge"),
                      v.literal("sample_drop")
                    ),

    // Flags
    isPinned:       v.boolean(),
    isHot:          v.boolean(),

    // Counts (cached)
    voteCount:      v.number(),
    replyCount:     v.number(),
    saveCount:      v.number(),

    // Optional links to other entities
    linkedTrackId:     v.optional(v.id("tracks")),
    linkedCollabId:    v.optional(v.id("collabs")),
    linkedChallengeId: v.optional(v.id("challenges")),
  })
    .index("by_author",     ["authorId"])
    .index("by_type",       ["type"])
    .index("by_pinned",     ["isPinned"])
    .index("by_vote_count", ["voteCount"])
    .index("by_hot",        ["isHot"]),

  // ── POST REPLIES ───────────────────────────────────────────────────────────
  postReplies: defineTable({
    postId:         v.id("posts"),
    authorId:       v.id("users"),
    authorName:     v.string(),
    authorInitials: v.string(),
    authorColor:    v.string(),
    content:        v.string(),
    voteCount:      v.number(),
  })
    .index("by_post",       ["postId"])
    .index("by_author",     ["authorId"]),

  // ── POST VOTES ─────────────────────────────────────────────────────────────
  postVotes: defineTable({
    postId:         v.id("posts"),
    userId:         v.id("users"),
  })
    .index("by_post",            ["postId"])
    .index("by_user",            ["userId"])
    .index("by_post_and_user",   ["postId", "userId"]),

  // ── POST SAVES ─────────────────────────────────────────────────────────────
  postSaves: defineTable({
    postId:         v.id("posts"),
    userId:         v.id("users"),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"]),

  // ── FOLLOWS ────────────────────────────────────────────────────────────────
  follows: defineTable({
    followerId:     v.id("users"),       // the user doing the following
    followingId:    v.id("users"),       // the user being followed
  })
    .index("by_follower",           ["followerId"])
    .index("by_following",          ["followingId"])
    .index("by_follower_following", ["followerId", "followingId"]),

  // ── PLAYLISTS ──────────────────────────────────────────────────────────────
  playlists: defineTable({
    creatorId:      v.optional(v.id("users")),  // null = editorial/system
    title:          v.string(),
    artColor:       v.string(),
    description:    v.optional(v.string()),
    type:           v.union(
                      v.literal("community"),
                      v.literal("editorial"),
                      v.literal("artist")
                    ),
    isEditorial:    v.boolean(),
    trackCount:     v.number(),
    saveCount:      v.number(),
  })
    .index("by_creator",   ["creatorId"])
    .index("by_type",      ["type"])
    .index("by_editorial", ["isEditorial"]),

  // ── PLAYLIST TRACKS ────────────────────────────────────────────────────────
  playlistTracks: defineTable({
    playlistId:     v.id("playlists"),
    trackId:        v.id("tracks"),
    position:       v.number(),
    addedAt:        v.number(),
    addedBy:        v.id("users"),
  })
    .index("by_playlist",          ["playlistId"])
    .index("by_track",             ["trackId"])
    .index("by_playlist_position", ["playlistId", "position"]),

  // ── PLAYLIST SAVES ─────────────────────────────────────────────────────────
  playlistSaves: defineTable({
    playlistId:     v.id("playlists"),
    userId:         v.id("users"),
  })
    .index("by_playlist", ["playlistId"])
    .index("by_user",     ["userId"]),

  // ── NOTIFICATIONS ──────────────────────────────────────────────────────────
  notifications: defineTable({
    userId:         v.id("users"),
    type:           v.union(
                      v.literal("play"),
                      v.literal("follow"),
                      v.literal("collab_accept"),
                      v.literal("collab_request"),
                      v.literal("challenge_new"),
                      v.literal("review_complete"),
                      v.literal("revenue"),
                      v.literal("mention"),
                      v.literal("reply"),
                      v.literal("challenge_win")
                    ),
    title:          v.string(),
    message:        v.string(),
    isRead:         v.boolean(),
    linkedId:       v.optional(v.string()),
    linkedType:     v.optional(v.string()),  // "track" | "collab" | "post" | "challenge"
  })
    .index("by_user",          ["userId"])
    .index("by_user_unread",   ["userId", "isRead"]),

  // ── BROADCAST LOG ──────────────────────────────────────────────────────────
  // Real-time activity feed (homepage "BROADCAST LOG" section)
  broadcastLog: defineTable({
    type:           v.union(
                      v.literal("TRACK"),
                      v.literal("LIVE"),
                      v.literal("JOIN"),
                      v.literal("COLLAB"),
                      v.literal("SYSTEM"),
                      v.literal("CHALLENGE"),
                      v.literal("RELEASE")
                    ),
    actorName:      v.string(),
    actorId:        v.optional(v.id("users")),
    content:        v.string(),
    actionLabel:    v.string(),
    actionUrl:      v.optional(v.string()),
    timestamp:      v.number(),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_type",      ["type"]),

  // ── CITIES (AFRICA MAP) ────────────────────────────────────────────────────
  // The 8 District Signal Map cities + expansion cities
  cities: defineTable({
    name:           v.string(),          // e.g. "CAIRO"
    country:        v.string(),          // e.g. "Egypt"
    countryCode:    v.string(),          // e.g. "EG"
    lat:            v.number(),
    lng:            v.number(),
    isActive:       v.boolean(),
    districtCode:   v.optional(v.string()),  // e.g. "D-01-ACC"

    // Cached stats
    artistCount:    v.number(),
    trackCount:     v.number(),
    liveCount:      v.number(),
  })
    .index("by_country",  ["countryCode"])
    .index("by_active",   ["isActive"]),

  // ── PLAY ANALYTICS ─────────────────────────────────────────────────────────
  // Per-play records for detailed analytics (studio dashboard)
  playEvents: defineTable({
    trackId:        v.id("tracks"),
    artistId:       v.id("users"),
    listenerId:     v.optional(v.id("users")),  // null = anonymous
    country:        v.optional(v.string()),
    city:           v.optional(v.string()),
    completedPct:   v.number(),          // 0-100
    durationSecs:   v.number(),
    source:         v.union(
                      v.literal("radio"),
                      v.literal("direct"),
                      v.literal("playlist"),
                      v.literal("search")
                    ),
    timestamp:      v.number(),
  })
    .index("by_track",     ["trackId"])
    .index("by_artist",    ["artistId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_country",   ["country"]),

  // ── PLATFORM STATS ─────────────────────────────────────────────────────────
  // Singleton row — cached global stats for the homepage stats strip
  platformStats: defineTable({
    artistCount:      v.number(),
    trackCount:       v.number(),
    activeDistricts:  v.number(),
    liveCount:        v.number(),
    memberCount:      v.number(),
    updatedAt:        v.number(),
  }),

  // ── TRACK SAVES ────────────────────────────────────────────────────────────
  trackSaves: defineTable({
    trackId:        v.id("tracks"),
    userId:         v.id("users"),
  })
    .index("by_track", ["trackId"])
    .index("by_user",  ["userId"]),

  // ── EMAIL SIGNUPS ──────────────────────────────────────────────────────────
  // Join section email capture (pre-registration)
  emailSignups: defineTable({
    email:          v.string(),
    source:         v.string(),          // e.g. "homepage_join"
    convertedAt:    v.optional(v.number()),
  })
    .index("by_email", ["email"]),

});
