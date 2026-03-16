# 0 DISTRICT — PRODUCT PLAN (FINAL)
## Decisions locked · Building now

---

## WHAT 0 DISTRICT IS

A **music curation and discovery platform** for African artists and genres.
Curators and label operatives manage what appears on the platform — they add tracks
that already exist on Spotify / Apple Music / Tidal etc., enriching them with metadata,
playlists, and editorial content. When a user presses play, they're sent to the streaming
platform — every click drives a real stream.

No audio is hosted. No files are uploaded by anyone.

---

## PLATFORM ROLES

| Role | Who | What they can do |
|---|---|---|
| `fan` | General public, registered members | Browse, like tracks, follow artists, post to community, save playlists |
| `artist` | Musicians on the platform | Profile management, view their own track stats + playlist appearances |
| `curator` | Label operatives, playlist curators | Add tracks (metadata + streaming links), create/manage playlists, manage broadcasts schedule, approve artist submissions |
| `admin` | 0Promo staff | Everything — full platform control, manage all roles |

---

## AUTH
- **Convex Auth** (built-in, no third party)
- Sign-in methods: Email + password, Google OAuth
- On first sign-in: user picks their role type (fan / artist / applying to curator)
- Curator / admin roles are granted manually by admin (not self-serve)

---

## TRACK MODEL
Every track on 0 District is curated from a streaming platform.

A track record contains:
- Title, artist name, genre, subgenre
- City / country of origin
- Release type (SINGLE / EP / ALBUM / REMIX)
- Art colour + initials (platform art style, no image upload needed)
- **Streaming links**: Spotify, Apple Music, Tidal, SoundCloud, YouTube (any combination)
- Editorial tags, description, curator notes
- Cached stats: play-click count, saves, playlist appearances

There is no `audioStorageId`. There are no audio file uploads.

The **play button** on 0 District opens a "Listen on" modal showing all available streaming links for that track. Primary link (Spotify if available) is highlighted.

---

## PAGE-BY-PAGE FUNCTIONALITY

### index.html — HOME
- Live stats strip: artist count, track count, active districts, members (real from DB)
- District carousels: curated track cards (from Convex `tracks` table, status=LIVE)
- Broadcast log: real-time activity feed (new tracks added, artists joining, live sessions)
- Africa signal map: city pins with real artist/track counts (from `cities` table)
- Top artists strip: sorted by track saves / playlist appearances
- Join section: email capture → `emailSignups` table

### radio.html — RADIO
- Now playing: currently featured/pinned track (from `radioQueue` table)
- Playlist: full 12-track list (from `radioQueue` / curator-managed)
- Recently played: broadcast history
- Upcoming broadcasts / takeover events
- Play button → streaming links modal

### studio.html — STUDIO (Artist view)
- Artist sees their own tracks on 0 District (added by curator)
- Stats: how many saves, playlist appearances, streaming link clicks for each track
- Profile editor: bio, city, genres, social links
- Submission form: artist can submit a track for curator review (metadata + streaming links they provide)
- No file upload, no dashboard for people other than the logged-in artist

### collab.html — COLLAB
- Open collab board: curators/artists post collaboration requests
- Remix challenges: prize-based challenges (metadata, deadline, prize info)
- Apply to collab: logged-in users fill a short form
- Challenge submissions: link to submitted work (external URL, not file upload)

### community.html — NETWORK / COMMUNITY
- Live sessions sidebar: who's currently live on streaming platforms
- Post feed: text posts, release announcements, sample drops
- Vote / reply / save posts
- Follow / unfollow artists
- Notification feed for logged-in users

---

## BUILD PHASES

### PHASE 1 — Schema + Auth setup (code-ready, you run 1 command)
- Update `convex/schema.ts`: remove audioStorageId, add streamingLinks, fix roles to fan/artist/curator/admin
- Install and configure `@convex-dev/auth`
- **You run:** `npm install convex @convex-dev/auth` then `npx convex dev`

### PHASE 2 — Seed database
- `convex/seed.ts` with all 12 demo tracks (streaming links to real Spotify/Apple pages), 7 artists, 8 cities, platform stats, broadcast log entries, demo collabs and posts

### PHASE 3 — Frontend wired to Convex
- Load Convex browser client via CDN
- Replace mock `DistrictAPI` with real queries
- All 5 pages pull live data

### PHASE 4 — Real-time subscriptions
- Broadcast log, stats strip, community feed, radio queue — all live via Convex subscriptions

### PHASE 5 — Auth UI
- Replace fake modal with real Convex Auth sign-in (email + Google)
- Nav shows logged-in state (name, avatar initials, role badge)

### PHASE 6 — Interactive actions
- Like/save tracks, follow artists, post to community, apply to collab — all write to DB

### PHASE 7 — Curator dashboard
- Dedicated curator view on studio.html (role-gated)
- Add track form: fill metadata + paste streaming links
- Playlist manager: create playlist, drag-order tracks
- Broadcast scheduler: set upcoming live events
- Content queue: review artist submissions (approve → LIVE / reject)

### PHASE 8 — Artist dashboard
- Artist view on studio.html (role-gated, different from curator)
- See their tracks, stats (saves, playlist appearances, streaming clicks)
- Edit profile, submit new track for review

### PHASE 9 — Search
- Global search bar wired to `misc:globalSearch`
- Returns tracks, artists, genres, collabs

### PHASE 10 — Deploy
- Convex URL into Netlify env variable
- Final push → live on 0promorecords.com

---

## WHAT WAS REMOVED
- ~~Audio file hosting~~ — not needed
- ~~Revenue / payments / Stripe~~ — not in scope
- ~~Artist audio upload~~ — curators add track metadata only
- ~~Clerk auth~~ — using Convex Auth instead
- ~~Challenge audio submission uploads~~ — submissions link to external URLs

---
*Last updated: decisions finalised*
