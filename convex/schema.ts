import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// ─────────────────────────────────────────────────────────────────────────────
//  0 DISTRICT — Convex Database Schema
//  Platform: African music curation & discovery / 0PromoRecords
//
//  Roles:
//    fan      — browse, like, follow, post, save playlists
//    artist   — fan + profile editor, track stats, submit tracks for review
//    curator  — artist + add/edit tracks, manage playlists, broadcasts, approvals
//    admin    — full platform control
//
//  Audio model:
//    No audio files are hosted. Tracks have streamingLinks (Spotify / Apple /
//    Tidal / SoundCloud / YouTube). Play button opens the streaming platform.
// ─────────────────────────────────────────────────────────────────────────────

export default defineSchema({
  // Convex Auth tables (sessions, accounts, verificationCodes, etc.)
  ...authTables,

  // ── USERS ──────────────────────────────────────────────────────────────────
  users: defineTable({
    // Identity (linked to Convex Auth)
    email:          v.string(),
    name:           v.string(),
    displayName:    v.string(),          // Stage name / public handle
    avatarInitials: v.string(),          // e.g. "KM"
    avatarColor:    v.string(),          // e.g. "art-red"

    // Role & status
    role:           v.union(
                      v.literal("fan"),
                      v.literal("artist"),
                      v.literal("curator"),
                      v.literal("admin")
                    ),
    isVerified:     v.boolean(),
    isLive:         v.boolean(),

    // Location
    city:           v.optional(v.string()),
    country:        v.optional(v.string()),
    countryCode:    v.optional(v.string()),

    // Profile
    bio:            v.optional(v.string()),
    genres:         v.array(v.string()),
    websiteUrl:     v.optional(v.string()),
    socialLinks:    v.optional(v.object({
                      instagram: v.optional(v.string()),
                      twitter:   v.optional(v.string()),
                      tiktok:    v.optional(v.string()),
                      youtube:   v.optional(v.string()),
                    })),

    // Cached counters
    followerCount:  v.number(),
    followingCount: v.number(),
    trackCount:     v.number(),          // tracks on the platform featuring this artist
    totalClicks:    v.number(),          // total streaming link clicks across all their tracks

    // Live session ref
    liveSessionId:  v.optional(v.id("liveSessions")),
  })
    .index("by_email",        ["email"])
    .index("by_role",         ["role"])
    .index("by_city",         ["city"])
    .index("by_total_clicks", ["totalClicks"]),

  // ── TRACKS ─────────────────────────────────────────────────────────────────
  // All tracks curated onto the platform by curators / label operatives.
  // No audio is hosted — tracks link out to streaming platforms.
  tracks: defineTable({
    // Ownership / curation
    artistId:       v.id("users"),       // the artist on the platform
    artistName:     v.string(),          // denormalised
    curatorId:      v.id("users"),       // who added this to 0 District
    curatorName:    v.string(),

    // Metadata
    title:          v.string(),
    slug:           v.string(),          // url-safe, unique
    genre:          v.string(),
    subGenre:       v.optional(v.string()),
    releaseType:    v.union(
                      v.literal("SINGLE"),
                      v.literal("EP"),
                      v.literal("ALBUM"),
                      v.literal("REMIX"),
                      v.literal("TRACK")
                    ),
    status:         v.union(
                      v.literal("PENDING"),    // submitted, awaiting curator review
                      v.literal("LIVE"),       // visible on platform
                      v.literal("REMOVED")
                    ),

    // Geography
    city:           v.string(),
    country:        v.string(),
    countryCode:    v.string(),

    // Art (platform art style — no image upload)
    artColor:       v.string(),          // e.g. "art-red"
    artInitials:    v.string(),          // e.g. "KM"

    // Streaming links — at least one required to go LIVE
    streamingLinks: v.object({
      spotify:      v.optional(v.string()),   // full Spotify track URL
      apple:        v.optional(v.string()),   // Apple Music URL
      tidal:        v.optional(v.string()),
      soundcloud:   v.optional(v.string()),
      youtube:      v.optional(v.string()),
    }),

    // Editorial
    description:    v.optional(v.string()),
    tags:           v.array(v.string()),
    label:          v.string(),          // default "0PROMO"
    isFeatured:     v.boolean(),

    // Stats (cached — incremented on streaming link click)
    clickCount:     v.number(),          // total streaming platform clicks
    saveCount:      v.number(),
    playlistCount:  v.number(),          // how many playlists it appears in

    // Dates
    releaseDate:    v.number(),          // Unix timestamp (original release)
    addedAt:        v.number(),          // when curator added it to 0 District
  })
    .index("by_artist",       ["artistId"])
    .index("by_curator",      ["curatorId"])
    .index("by_status",       ["status"])
    .index("by_genre",        ["genre"])
    .index("by_slug",         ["slug"])
    .index("by_release_type", ["releaseType"])
    .index("by_click_count",  ["clickCount"])
    .index("by_city",         ["city"])
    .index("by_featured",     ["isFeatured"])
    .index("by_added_at",     ["addedAt"]),

  // ── STREAMING CLICKS ───────────────────────────────────────────────────────
  // Log every time a user clicks through to a streaming platform.
  streamingClicks: defineTable({
    trackId:        v.id("tracks"),
    artistId:       v.id("users"),
    userId:         v.optional(v.id("users")),   // null = anonymous
    platform:       v.union(
                      v.literal("spotify"),
                      v.literal("apple"),
                      v.literal("tidal"),
                      v.literal("soundcloud"),
                      v.literal("youtube")
                    ),
    country:        v.optional(v.string()),
    source:         v.union(
                      v.literal("radio"),
                      v.literal("home"),
                      v.literal("playlist"),
                      v.literal("search"),
                      v.literal("collab"),
                      v.literal("direct")
                    ),
    timestamp:      v.number(),
  })
    .index("by_track",     ["trackId"])
    .index("by_artist",    ["artistId"])
    .index("by_platform",  ["platform"])
    .index("by_timestamp", ["timestamp"]),

  // ── TRACK SUBMISSIONS ──────────────────────────────────────────────────────
  // Artists can submit their tracks for curator review.
  trackSubmissions: defineTable({
    artistId:       v.id("users"),
    artistName:     v.string(),

    title:          v.string(),
    genre:          v.string(),
    city:           v.string(),
    country:        v.string(),
    countryCode:    v.string(),
    releaseType:    v.string(),
    description:    v.optional(v.string()),
    streamingLinks: v.object({
      spotify:      v.optional(v.string()),
      apple:        v.optional(v.string()),
      tidal:        v.optional(v.string()),
      soundcloud:   v.optional(v.string()),
      youtube:      v.optional(v.string()),
    }),

    status:         v.union(
                      v.literal("pending"),
                      v.literal("approved"),
                      v.literal("rejected")
                    ),
    curatorNote:    v.optional(v.string()),
    reviewedBy:     v.optional(v.id("users")),
    submittedAt:    v.number(),
  })
    .index("by_artist",   ["artistId"])
    .index("by_status",   ["status"]),

  // ── RADIO QUEUE ────────────────────────────────────────────────────────────
  // Curator-managed broadcast queue (ordered by position).
  radioQueue: defineTable({
    trackId:        v.id("tracks"),
    trackTitle:     v.string(),
    artistName:     v.string(),
    artColor:       v.string(),
    artInitials:    v.string(),
    position:       v.number(),
    type:           v.union(v.literal("PLAYING"), v.literal("NEXT"), v.literal("QUEUE")),
    addedBy:        v.string(),          // "system" | userId
  })
    .index("by_position", ["position"]),

  // ── RADIO HISTORY ──────────────────────────────────────────────────────────
  radioHistory: defineTable({
    trackId:        v.id("tracks"),
    trackTitle:     v.string(),
    artistName:     v.string(),
    artColor:       v.string(),
    artInitials:    v.string(),
    playedAt:       v.number(),
    clickCount:     v.number(),          // streaming clicks during this broadcast slot
  })
    .index("by_played_at", ["playedAt"]),

  // ── BROADCASTS ─────────────────────────────────────────────────────────────
  broadcasts: defineTable({
    artistId:       v.id("users"),
    artistName:     v.string(),
    title:          v.string(),
    description:    v.string(),
    genre:          v.string(),
    scheduledAt:    v.number(),
    durationMins:   v.number(),
    status:         v.union(
                      v.literal("UPCOMING"),
                      v.literal("LIVE"),
                      v.literal("ENDED")
                    ),
    isFeatured:     v.boolean(),
    reminderCount:  v.number(),
    // streaming link for the live session itself
    streamUrl:      v.optional(v.string()),
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
  liveSessions: defineTable({
    artistId:       v.id("users"),
    artistName:     v.string(),
    title:          v.string(),
    genre:          v.string(),
    listenerCount:  v.number(),
    streamUrl:      v.optional(v.string()),   // link to the live stream
    status:         v.union(v.literal("active"), v.literal("ended")),
    startedAt:      v.number(),
    endedAt:        v.optional(v.number()),
  })
    .index("by_status",     ["status"])
    .index("by_artist",     ["artistId"])
    .index("by_started_at", ["startedAt"]),

  // ── PLAYLISTS ──────────────────────────────────────────────────────────────
  // Created and managed by curators or editorial team.
  playlists: defineTable({
    curatorId:      v.id("users"),
    curatorName:    v.string(),
    title:          v.string(),
    artColor:       v.string(),
    description:    v.optional(v.string()),
    type:           v.union(
                      v.literal("editorial"),   // made by 0Promo curators
                      v.literal("community"),   // made by verified artists/fans
                      v.literal("artist")       // an artist's own selection
                    ),
    isPublished:    v.boolean(),
    trackCount:     v.number(),
    saveCount:      v.number(),
    isFeatured:     v.boolean(),
  })
    .index("by_curator",   ["curatorId"])
    .index("by_type",      ["type"])
    .index("by_published", ["isPublished"])
    .index("by_featured",  ["isFeatured"]),

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

  // ── COLLABS ────────────────────────────────────────────────────────────────
  collabs: defineTable({
    creatorId:      v.id("users"),
    creatorName:    v.string(),
    title:          v.string(),
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
    spotsTotal:     v.optional(v.number()),
    spotsFilled:    v.number(),
    artColor:       v.string(),
    artInitials:    v.string(),
    linkedTrackId:  v.optional(v.id("tracks")),
    // No stemStorageId — collab details link to external references
    referenceUrl:   v.optional(v.string()),   // link to reference track on streaming platform
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
  challenges: defineTable({
    artistId:         v.id("users"),
    artistName:       v.string(),
    title:            v.string(),
    slug:             v.string(),
    description:      v.string(),
    genre:            v.string(),
    linkedTrackId:    v.id("tracks"),
    referenceUrl:     v.optional(v.string()),   // streaming link to original track
    prizeDescription: v.string(),
    deadline:         v.number(),
    status:           v.union(
                        v.literal("active"),
                        v.literal("judging"),
                        v.literal("closed")
                      ),
    entryCount:       v.number(),
    isFeatured:       v.boolean(),
    artColor:         v.string(),
  })
    .index("by_artist",   ["artistId"])
    .index("by_status",   ["status"])
    .index("by_slug",     ["slug"])
    .index("by_featured", ["isFeatured"])
    .index("by_deadline", ["deadline"]),

  // ── CHALLENGE SUBMISSIONS ──────────────────────────────────────────────────
  // Submissions link to external work (SoundCloud, YouTube, Google Drive etc.)
  challengeSubmissions: defineTable({
    challengeId:    v.id("challenges"),
    submitterId:    v.id("users"),
    submitterName:  v.string(),
    title:          v.string(),
    description:    v.optional(v.string()),
    submissionUrl:  v.string(),          // link to submitted work (external)
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
  posts: defineTable({
    authorId:       v.id("users"),
    authorName:     v.string(),
    authorInitials: v.string(),
    authorColor:    v.string(),
    content:        v.string(),
    tags:           v.array(v.string()),
    type:           v.union(
                      v.literal("post"),
                      v.literal("release"),
                      v.literal("collab_request"),
                      v.literal("challenge"),
                      v.literal("sample_drop")
                    ),
    isPinned:       v.boolean(),
    isHot:          v.boolean(),
    voteCount:      v.number(),
    replyCount:     v.number(),
    saveCount:      v.number(),
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
    .index("by_post",   ["postId"])
    .index("by_author", ["authorId"]),

  // ── POST VOTES ─────────────────────────────────────────────────────────────
  postVotes: defineTable({
    postId:  v.id("posts"),
    userId:  v.id("users"),
  })
    .index("by_post",          ["postId"])
    .index("by_user",          ["userId"])
    .index("by_post_and_user", ["postId", "userId"]),

  // ── POST SAVES ─────────────────────────────────────────────────────────────
  postSaves: defineTable({
    postId:  v.id("posts"),
    userId:  v.id("users"),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"]),

  // ── FOLLOWS ────────────────────────────────────────────────────────────────
  follows: defineTable({
    followerId:  v.id("users"),
    followingId: v.id("users"),
  })
    .index("by_follower",           ["followerId"])
    .index("by_following",          ["followingId"])
    .index("by_follower_following", ["followerId", "followingId"]),

  // ── TRACK SAVES ────────────────────────────────────────────────────────────
  trackSaves: defineTable({
    trackId: v.id("tracks"),
    userId:  v.id("users"),
  })
    .index("by_track", ["trackId"])
    .index("by_user",  ["userId"]),

  // ── NOTIFICATIONS ──────────────────────────────────────────────────────────
  notifications: defineTable({
    userId:      v.id("users"),
    type:        v.union(
                   v.literal("follow"),
                   v.literal("collab_accept"),
                   v.literal("collab_request"),
                   v.literal("challenge_new"),
                   v.literal("track_live"),       // curator approved your submission
                   v.literal("track_rejected"),
                   v.literal("mention"),
                   v.literal("reply"),
                   v.literal("challenge_win"),
                   v.literal("broadcast_reminder")
                 ),
    title:       v.string(),
    message:     v.string(),
    isRead:      v.boolean(),
    linkedId:    v.optional(v.string()),
    linkedType:  v.optional(v.string()),
  })
    .index("by_user",        ["userId"])
    .index("by_user_unread", ["userId", "isRead"]),

  // ── BROADCAST LOG ──────────────────────────────────────────────────────────
  // Real-time activity feed — homepage "BROADCAST LOG" section
  broadcastLog: defineTable({
    type:        v.union(
                   v.literal("TRACK"),       // new track added to platform
                   v.literal("LIVE"),        // artist going live
                   v.literal("JOIN"),        // new member joined
                   v.literal("COLLAB"),      // collab posted
                   v.literal("SYSTEM"),      // platform notice
                   v.literal("CHALLENGE"),   // new challenge
                   v.literal("PLAYLIST")     // new playlist published
                 ),
    actorName:   v.string(),
    actorId:     v.optional(v.id("users")),
    content:     v.string(),
    actionLabel: v.string(),
    actionUrl:   v.optional(v.string()),
    timestamp:   v.number(),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_type",      ["type"]),

  // ── CITIES ─────────────────────────────────────────────────────────────────
  cities: defineTable({
    name:          v.string(),
    country:       v.string(),
    countryCode:   v.string(),
    lat:           v.number(),
    lng:           v.number(),
    isActive:      v.boolean(),
    districtCode:  v.optional(v.string()),
    artistCount:   v.number(),
    trackCount:    v.number(),
    liveCount:     v.number(),
  })
    .index("by_country", ["countryCode"])
    .index("by_active",  ["isActive"]),

  // ── PLATFORM STATS ─────────────────────────────────────────────────────────
  // Singleton row — cached global stats for homepage stats strip
  platformStats: defineTable({
    artistCount:     v.number(),
    trackCount:      v.number(),
    activeDistricts: v.number(),
    liveCount:       v.number(),
    memberCount:     v.number(),
    totalClicks:     v.number(),         // total streaming platform clicks all-time
    updatedAt:       v.number(),
  }),

  // ── EMAIL SIGNUPS ──────────────────────────────────────────────────────────
  emailSignups: defineTable({
    email:       v.string(),
    source:      v.string(),
    convertedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"]),

});
