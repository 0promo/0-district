# 0 DISTRICT — Backend Architecture
## 0PromoRecords · Convex.dev · African Music Platform

---

## Stack Overview

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML / CSS / Vanilla JS (current) → React/Next.js (v2) | UI |
| **Backend / DB** | Convex.dev | Realtime DB, functions, file storage |
| **Auth** | Clerk | Sign-in, user sessions, webhooks |
| **File Storage** | Convex Storage (built-in) | Audio, cover art, stems |
| **Domain** | Namecheap → Convex custom domain | 0district.com |
| **Deployment** | Convex cloud (auto-scales) | Serverless |

---

## Database Tables (18 tables)

### Core Entities

#### `users`
All platform members — fans, creators, labels, admins.
Key fields: `clerkId`, `displayName`, `role`, `city`, `totalPlays`, `revenueCents`, `isLive`
Indexes: `by_clerk_id`, `by_email`, `by_role`, `by_city`, `by_total_plays`

#### `tracks`
All music uploaded by creators.
Key fields: `artistId`, `title`, `slug`, `genre`, `status` (DRAFT→REVIEW→LIVE), `playCount`, `audioStorageId`
Indexes: `by_artist`, `by_status`, `by_genre`, `by_play_count`, `by_release_date`

---

### Radio District (D-01)

#### `radioQueue`
The current live broadcast queue, ordered by `position`.
Position 0 = NOW PLAYING, position 1 = NEXT, 2+ = QUEUE.

#### `radioHistory`
Immutable log of every track that played on the radio.

#### `broadcasts`
Scheduled takeover events (e.g., "DJ SENEGAL TAKEOVER · 20:00 GMT").
Status flow: `UPCOMING → LIVE → ENDED`

#### `broadcastReminders`
Users who clicked "SET REMINDER" on an upcoming broadcast.

#### `liveSessions`
Real-time artist live rooms — drives the community sidebar "LIVE NOW" widget.

---

### Studio District (D-02)

#### `playEvents`
Every individual play, with country/city, completion%, source (radio/direct/playlist/search).
Used for the studio analytics dashboard (plays per day, top regions, avg completion).

---

### Collaboration District (D-03)

#### `collabs`
Open collab requests on the board.
Type: `vocals | production | remix | songwriting | mixing | mastering`
Status: `open → in_progress → closed`

#### `collabApplications`
Artist applications to join a collab.
Status: `pending → accepted | rejected`

#### `challenges`
Remix challenges with prize pools.
Status: `active → judging → closed`

#### `challengeSubmissions`
Remix entries submitted by artists.
Status: `pending → shortlisted → winner | disqualified`

---

### Network District (D-04)

#### `posts`
Community feed posts, with type classification (`release | collab_request | challenge | sample_drop`).

#### `postReplies`
Threaded replies to posts.

#### `postVotes` / `postSaves`
Join tables for upvotes and saved posts.

---

### Cross-Platform

#### `follows`
Bidirectional follow relationship between users.
Denormalized counters on `users.followerCount` / `followingCount` for speed.

#### `playlists` + `playlistTracks` + `playlistSaves`
Community, editorial, and artist playlists.

#### `notifications`
In-app notification inbox per user. Types: play, follow, collab_accept, revenue, challenge_win, etc.

#### `broadcastLog`
Real-time activity feed powering the homepage "BROADCAST LOG" section.
Auto-written by mutations across all domains.

#### `cities`
The 8 Africa Signal Map cities (seeded via `cities:seed`).
Stores lat/lng (used by D3 map), plus live artist/track/live counts.

#### `platformStats`
Cached singleton row — powers the homepage stats strip (557 artists, 3,128 tracks, 4 districts, 53 live).

#### `emailSignups`
Email capture from the homepage "JOIN THE DISTRICT" section.

---

## Function Structure

```
convex/
  schema.ts          ← Full type-safe schema (Convex v1)
  users.ts           ← getByClerkId, listTopArtists, create, updateProfile
  tracks.ts          ← listLive, listNewReleases, create, recordPlay, toggleSave
  radio.ts           ← getQueue, getNowPlaying, addToQueue, advanceQueue, createBroadcast
  collabs.ts         ← list, create, apply, acceptApplication, close
  challenges.ts      ← listActive, getFeatured, create, submitEntry, pickWinner
  posts.ts           ← listFeed, create, reply, toggleVote, getTrendingTopics
  analytics.ts       ← getArtistDashboard, getPlatformStats, getCityStats
  follows.ts         ← toggle, isFollowing, listFollowers, listFollowing
  notifications.ts   ← getUnreadCount, list, markAllRead
  broadcastLog.ts    ← getLatest, getByType
  cities.ts          ← listActive, seed, updateStats
  playlists.ts       ← listCommunity, getWithTracks, create, addTrack, toggleSave
  liveSessions.ts    ← listActive, start, end, updateListenerCount
  misc.ts            ← captureEmail, globalSearch, getTrendingSearchTerms
```

---

## Real-Time Data Flow (Convex Subscriptions)

Convex queries are **reactive by default** — the frontend subscribes and gets live updates automatically. Key real-time feeds:

| Feature | Convex query | Update trigger |
|---|---|---|
| Radio NOW PLAYING | `radio.getNowPlaying` | `radio.advanceQueue` mutation |
| Queue | `radio.getQueue` | `radio.addToQueue` mutation |
| Listener count | `liveSessions.listActive` | `liveSessions.updateListenerCount` |
| Broadcast log | `broadcastLog.getLatest` | Any content mutation |
| Platform stats | `analytics.getPlatformStats` | `tracks.approve`, `users.create` |
| Community feed | `posts.listFeed` | `posts.create`, `posts.reply` |
| Notifications | `notifications.getUnreadCount` | Any notification insert |

---

## File Storage (Convex Storage)

All binary files stored in Convex's built-in S3-backed storage:

| File type | Table field | Upload flow |
|---|---|---|
| Audio track | `tracks.audioStorageId` | Studio > Upload panel → `storage.generateUploadUrl()` |
| Cover art | `tracks.artStorageId` | Studio > Upload panel |
| Profile photo | `users.avatarStorageId` | Profile settings |
| Remix stems | `challenges.stemStorageId` | Challenge create |
| Challenge entry | `challengeSubmissions.audioStorageId` | Challenge submit |

Upload flow:
1. Client calls `storage.generateUploadUrl()` → gets a signed URL
2. Client POSTs file directly to Convex storage
3. Client calls mutation with the returned `storageId`

---

## Auth Flow (Clerk + Convex)

1. User clicks **SIGN IN** → Clerk modal
2. After auth, Clerk fires a webhook to Convex HTTP action
3. HTTP action calls `users.create` (internal mutation) to create/sync the user
4. All Convex queries/mutations receive `ctx.auth` with the Clerk user identity
5. Sensitive mutations check `ctx.auth.getUserIdentity()` before executing

---

## Revenue Model (Track Monetisation)

Revenue tracked in **cents** (`revenueCents`) on both `tracks` and `users`.
Current model: streaming micro-payments simulated via `playEvents` records.
Future: Stripe Connect integration for actual payouts to artists.

---

## Seed Data

Run once after project init:
```bash
npx convex run cities:seed
```

This seeds the 8 Africa Signal Map cities with real lat/lng coordinates.

---

## Performance Notes

- **Denormalized counters** on `users` (`followerCount`, `trackCount`, `totalPlays`) avoid expensive aggregate queries on every page load.
- **Cached `platformStats`** row avoids counting all users/tracks on every homepage load.
- **Indexes on every common query path** — see `schema.ts` index definitions.
- Convex automatically handles **connection pooling**, **edge caching**, and **WebSocket management**.
