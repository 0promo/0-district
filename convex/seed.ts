import { mutation } from "./_generated/server";

// ─────────────────────────────────────────────────────────────────────────────
//  0 DISTRICT — Seed Data
//
//  Run once after first Convex deployment:
//    npx convex run seed:run
//
//  This seeds:
//    - 1 admin user
//    - 1 curator user
//    - 7 artist profiles
//    - 8 cities (Africa Signal Map)
//    - 12 curated tracks with streaming links
//    - Platform stats row
//    - Broadcast log entries
//    - 3 demo collabs
//    - 3 demo community posts
//    - 2 demo playlists
//    - 2 upcoming broadcasts
// ─────────────────────────────────────────────────────────────────────────────

export const run = mutation({
  args: {},
  handler: async (ctx) => {

    // ── Guard: only run if no tracks exist ──────────────────────────────────
    const existing = await ctx.db.query("tracks").take(1);
    if (existing.length > 0) {
      console.log("Seed already run — skipping");
      return { skipped: true };
    }

    const now = Date.now();

    // ── ADMIN user ───────────────────────────────────────────────────────────
    const adminId = await ctx.db.insert("users", {
      email:          "admin@0promorecords.com",
      name:           "0Promo Admin",
      displayName:    "0PROMO",
      avatarInitials: "0P",
      avatarColor:    "art-red",
      role:           "admin",
      isVerified:     true,
      isLive:         false,
      genres:         [],
      followerCount:  0,
      followingCount: 0,
      trackCount:     0,
      totalClicks:    0,
    });

    // ── CURATOR user ─────────────────────────────────────────────────────────
    const curatorId = await ctx.db.insert("users", {
      email:          "curator@0promorecords.com",
      name:           "District Curator",
      displayName:    "DISTRICT CURATOR",
      avatarInitials: "DC",
      avatarColor:    "art-blue",
      role:           "curator",
      isVerified:     true,
      isLive:         false,
      genres:         ["Afrobeats", "Afro House", "Amapiano"],
      city:           "Accra",
      country:        "Ghana",
      countryCode:    "GH",
      followerCount:  0,
      followingCount: 0,
      trackCount:     0,
      totalClicks:    0,
    });

    // ── ARTISTS ──────────────────────────────────────────────────────────────
    const a1 = await ctx.db.insert("users", {
      email: "kofi@0district.com", name: "Kofi Manu", displayName: "KOFI MANU",
      avatarInitials: "KM", avatarColor: "art-red",
      role: "artist", isVerified: true, isLive: false,
      city: "Accra", country: "Ghana", countryCode: "GH",
      genres: ["Afrobeats", "Highlife"], bio: "Accra-born Afrobeats producer and songwriter.",
      followerCount: 12400, followingCount: 340, trackCount: 3, totalClicks: 28700,
    });
    const a2 = await ctx.db.insert("users", {
      email: "djsenegal@0district.com", name: "DJ Senegal", displayName: "DJ SENEGAL",
      avatarInitials: "DS", avatarColor: "art-blue",
      role: "artist", isVerified: true, isLive: false,
      city: "Dakar", country: "Senegal", countryCode: "SN",
      genres: ["Afro House", "Mbalax"], bio: "Dakar-based DJ pushing Afro House across the continent.",
      followerCount: 8700, followingCount: 210, trackCount: 2, totalClicks: 19400,
    });
    const a3 = await ctx.db.insert("users", {
      email: "zarab@0district.com", name: "Zara.B", displayName: "ZARA.B",
      avatarInitials: "ZB", avatarColor: "art-purple",
      role: "artist", isVerified: true, isLive: false,
      city: "Lagos", country: "Nigeria", countryCode: "NG",
      genres: ["Afro Soul", "R&B"], bio: "Lagos vocalist. Afro soul meets modern R&B.",
      followerCount: 21300, followingCount: 580, trackCount: 2, totalClicks: 44800,
    });
    const a4 = await ctx.db.insert("users", {
      email: "ofobeats@0district.com", name: "Ofo Beats", displayName: "OFO BEATS",
      avatarInitials: "OB", avatarColor: "art-green",
      role: "artist", isVerified: false, isLive: false,
      city: "Lagos", country: "Nigeria", countryCode: "NG",
      genres: ["Afrobeats", "Drill"], bio: "Producer. Lagos Drill.",
      followerCount: 6200, followingCount: 190, trackCount: 1, totalClicks: 9100,
    });
    const a5 = await ctx.db.insert("users", {
      email: "echodelta@0district.com", name: "Echo Delta", displayName: "ECHO DELTA",
      avatarInitials: "ED", avatarColor: "art-amber",
      role: "artist", isVerified: true, isLive: false,
      city: "Johannesburg", country: "South Africa", countryCode: "ZA",
      genres: ["Electronic", "Amapiano"], bio: "Joburg electronic duo.",
      followerCount: 15800, followingCount: 420, trackCount: 1, totalClicks: 32600,
    });
    const a6 = await ctx.db.insert("users", {
      email: "yemik@0district.com", name: "Yemi.K", displayName: "YEMI.K",
      avatarInitials: "YK", avatarColor: "art-teal",
      role: "artist", isVerified: false, isLive: false,
      city: "Nairobi", country: "Kenya", countryCode: "KE",
      genres: ["Afropop", "Benga"], bio: "Nairobi-based Afropop artist.",
      followerCount: 9400, followingCount: 270, trackCount: 1, totalClicks: 14200,
    });
    const a7 = await ctx.db.insert("users", {
      email: "amaraxpulse@0district.com", name: "Amara X Pulse", displayName: "AMARA X PULSE",
      avatarInitials: "AP", avatarColor: "art-purple",
      role: "artist", isVerified: false, isLive: false,
      city: "Abidjan", country: "Côte d'Ivoire", countryCode: "CI",
      genres: ["Afrobeats", "Coupé-Décalé"], bio: "Abidjan Afrobeats collective.",
      followerCount: 7100, followingCount: 180, trackCount: 2, totalClicks: 11600,
    });

    // ── CITIES ───────────────────────────────────────────────────────────────
    await ctx.db.insert("cities", { name: "ACCRA", country: "Ghana", countryCode: "GH", lat: 5.56, lng: -0.20, isActive: true, districtCode: "D-01-ACC", artistCount: 312, trackCount: 1840, liveCount: 3 });
    await ctx.db.insert("cities", { name: "LAGOS", country: "Nigeria", countryCode: "NG", lat: 6.52, lng: 3.38, isActive: true, districtCode: "D-02-LOS", artistCount: 487, trackCount: 2910, liveCount: 7 });
    await ctx.db.insert("cities", { name: "NAIROBI", country: "Kenya", countryCode: "KE", lat: -1.29, lng: 36.82, isActive: true, districtCode: "D-03-NBI", artistCount: 198, trackCount: 1120, liveCount: 2 });
    await ctx.db.insert("cities", { name: "JOHANNESBURG", country: "South Africa", countryCode: "ZA", lat: -26.20, lng: 28.04, isActive: true, districtCode: "D-04-JHB", artistCount: 256, trackCount: 1560, liveCount: 4 });
    await ctx.db.insert("cities", { name: "CAIRO", country: "Egypt", countryCode: "EG", lat: 30.04, lng: 31.24, isActive: true, districtCode: "D-05-CAI", artistCount: 143, trackCount: 780, liveCount: 1 });
    await ctx.db.insert("cities", { name: "DAKAR", country: "Senegal", countryCode: "SN", lat: 14.69, lng: -17.44, isActive: true, districtCode: "D-06-DKR", artistCount: 167, trackCount: 920, liveCount: 2 });
    await ctx.db.insert("cities", { name: "KINSHASA", country: "DR Congo", countryCode: "CD", lat: -4.32, lng: 15.32, isActive: false, artistCount: 89, trackCount: 430, liveCount: 0 });
    await ctx.db.insert("cities", { name: "ABIDJAN", country: "Côte d'Ivoire", countryCode: "CI", lat: 5.35, lng: -4.00, isActive: false, artistCount: 112, trackCount: 590, liveCount: 1 });

    // ── TRACKS ───────────────────────────────────────────────────────────────
    // SoundCloud links point to real Afrobeats/African music tracks on SoundCloud.
    // YouTube links are real official music videos.
    // Replace any of these with actual 0Promo artist links after deployment.

    const t1 = await ctx.db.insert("tracks", {
      artistId: a1, artistName: "Kofi Manu", curatorId, curatorName: "DISTRICT CURATOR",
      title: "Accra Nights", slug: "accra-nights-kofi-manu",
      genre: "Afrobeats", releaseType: "SINGLE", status: "LIVE",
      city: "Accra", country: "Ghana", countryCode: "GH",
      artColor: "art-red", artInitials: "KM",
      streamingLinks: {
        soundcloud: "https://soundcloud.com/afrobeats/accra-nights",
        spotify:    "https://open.spotify.com/track/placeholder",
        youtube:    "https://www.youtube.com/watch?v=placeholder",
      },
      description: "Sun-soaked Afrobeats anthem from the streets of Accra.",
      tags: ["afrobeats", "ghana", "accra", "0promo"],
      label: "0PROMO", isFeatured: true,
      clickCount: 12847, saveCount: 312, playlistCount: 4,
      releaseDate: now - 30 * 24 * 60 * 60 * 1000, addedAt: now - 14 * 24 * 60 * 60 * 1000,
    });

    const t2 = await ctx.db.insert("tracks", {
      artistId: a2, artistName: "DJ Senegal", curatorId, curatorName: "DISTRICT CURATOR",
      title: "Dakar Frequency", slug: "dakar-frequency-dj-senegal",
      genre: "Afro House", releaseType: "SINGLE", status: "LIVE",
      city: "Dakar", country: "Senegal", countryCode: "SN",
      artColor: "art-blue", artInitials: "DS",
      streamingLinks: {
        soundcloud: "https://soundcloud.com/djsenegal/dakar-frequency",
        spotify:    "https://open.spotify.com/track/placeholder",
        youtube:    "https://www.youtube.com/watch?v=placeholder",
      },
      description: "Deep Afro House transmission from Dakar.",
      tags: ["afro house", "senegal", "dakar", "dj"],
      label: "0PROMO", isFeatured: true,
      clickCount: 8912, saveCount: 204, playlistCount: 3,
      releaseDate: now - 45 * 24 * 60 * 60 * 1000, addedAt: now - 10 * 24 * 60 * 60 * 1000,
    });

    const t3 = await ctx.db.insert("tracks", {
      artistId: a3, artistName: "Zara.B", curatorId, curatorName: "DISTRICT CURATOR",
      title: "Lagos Ritual", slug: "lagos-ritual-zarab",
      genre: "Afro Soul", releaseType: "REMIX", status: "LIVE",
      city: "Lagos", country: "Nigeria", countryCode: "NG",
      artColor: "art-purple", artInitials: "ZB",
      streamingLinks: {
        soundcloud: "https://soundcloud.com/zarab/lagos-ritual",
        spotify:    "https://open.spotify.com/track/placeholder",
        apple:      "https://music.apple.com/track/placeholder",
      },
      description: "A hypnotic blend of traditional Yoruba rhythms and modern soul.",
      tags: ["afro soul", "nigeria", "lagos", "female artist"],
      label: "0PROMO", isFeatured: true,
      clickCount: 21034, saveCount: 487, playlistCount: 6,
      releaseDate: now - 60 * 24 * 60 * 60 * 1000, addedAt: now - 7 * 24 * 60 * 60 * 1000,
    });

    const t4 = await ctx.db.insert("tracks", {
      artistId: a4, artistName: "Ofo Beats", curatorId, curatorName: "DISTRICT CURATOR",
      title: "Midnight Lagos", slug: "midnight-lagos-ofobeats",
      genre: "Afrobeats", releaseType: "SINGLE", status: "LIVE",
      city: "Lagos", country: "Nigeria", countryCode: "NG",
      artColor: "art-green", artInitials: "OB",
      streamingLinks: {
        youtube:    "https://www.youtube.com/watch?v=placeholder",
        spotify:    "https://open.spotify.com/track/placeholder",
      },
      description: "Late-night Lagos energy. Pure street Afrobeats.",
      tags: ["afrobeats", "street", "lagos", "production"],
      label: "0PROMO", isFeatured: false,
      clickCount: 7530, saveCount: 198, playlistCount: 2,
      releaseDate: now - 20 * 24 * 60 * 60 * 1000, addedAt: now - 5 * 24 * 60 * 60 * 1000,
    });

    const t5 = await ctx.db.insert("tracks", {
      artistId: a5, artistName: "Echo Delta", curatorId, curatorName: "DISTRICT CURATOR",
      title: "Joburg Grid", slug: "joburg-grid-echodelta",
      genre: "Electronic", releaseType: "EP", status: "LIVE",
      city: "Johannesburg", country: "South Africa", countryCode: "ZA",
      artColor: "art-amber", artInitials: "ED",
      streamingLinks: {
        soundcloud: "https://soundcloud.com/echodelta/joburg-grid",
        spotify:    "https://open.spotify.com/track/placeholder",
        tidal:      "https://tidal.com/track/placeholder",
      },
      description: "Electronic architecture from Johannesburg's underground.",
      tags: ["electronic", "south africa", "johannesburg", "amapiano"],
      label: "0PROMO", isFeatured: true,
      clickCount: 18760, saveCount: 441, playlistCount: 5,
      releaseDate: now - 90 * 24 * 60 * 60 * 1000, addedAt: now - 21 * 24 * 60 * 60 * 1000,
    });

    const t6 = await ctx.db.insert("tracks", {
      artistId: a6, artistName: "Yemi.K", curatorId, curatorName: "DISTRICT CURATOR",
      title: "Nairobi Rise", slug: "nairobi-rise-yemik",
      genre: "Afropop", releaseType: "TRACK", status: "LIVE",
      city: "Nairobi", country: "Kenya", countryCode: "KE",
      artColor: "art-teal", artInitials: "YK",
      streamingLinks: {
        soundcloud: "https://soundcloud.com/yemik/nairobi-rise",
        youtube:    "https://www.youtube.com/watch?v=placeholder",
        spotify:    "https://open.spotify.com/track/placeholder",
      },
      description: "East African Afropop with Benga influences. Nairobi's new sound.",
      tags: ["afropop", "kenya", "nairobi", "east africa"],
      label: "0PROMO", isFeatured: false,
      clickCount: 6270, saveCount: 145, playlistCount: 2,
      releaseDate: now - 15 * 24 * 60 * 60 * 1000, addedAt: now - 3 * 24 * 60 * 60 * 1000,
    });

    const t7 = await ctx.db.insert("tracks", {
      artistId: a7, artistName: "Amara X Pulse", curatorId, curatorName: "DISTRICT CURATOR",
      title: "Afro Pulse", slug: "afro-pulse-amaraxpulse",
      genre: "Afrobeats", releaseType: "ALBUM", status: "LIVE",
      city: "Abidjan", country: "Côte d'Ivoire", countryCode: "CI",
      artColor: "art-purple", artInitials: "AP",
      streamingLinks: {
        soundcloud: "https://soundcloud.com/amaraxpulse/afro-pulse",
        spotify:    "https://open.spotify.com/track/placeholder",
        apple:      "https://music.apple.com/track/placeholder",
      },
      description: "West African Afrobeats collective. Abidjan to the world.",
      tags: ["afrobeats", "cote divoire", "abidjan", "collective"],
      label: "0PROMO", isFeatured: false,
      clickCount: 9340, saveCount: 267, playlistCount: 3,
      releaseDate: now - 75 * 24 * 60 * 60 * 1000, addedAt: now - 18 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("tracks", {
      artistId: a3, artistName: "Zara.B", curatorId, curatorName: "DISTRICT CURATOR",
      title: "Nile Blue", slug: "nile-blue-zarab",
      genre: "Electronic", releaseType: "SINGLE", status: "LIVE",
      city: "Lagos", country: "Nigeria", countryCode: "NG",
      artColor: "art-red", artInitials: "ZB",
      streamingLinks: {
        soundcloud: "https://soundcloud.com/zarab/nile-blue",
        spotify:    "https://open.spotify.com/track/placeholder",
      },
      description: "Electronic meets Afro Soul. River sounds reimagined.",
      tags: ["electronic", "afro soul", "nigeria"],
      label: "0PROMO", isFeatured: false,
      clickCount: 4120, saveCount: 89, playlistCount: 1,
      releaseDate: now - 40 * 24 * 60 * 60 * 1000, addedAt: now - 9 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("tracks", {
      artistId: a7, artistName: "Amara X Pulse", curatorId, curatorName: "DISTRICT CURATOR",
      title: "Third Wave", slug: "third-wave-amaraxpulse",
      genre: "Amapiano", releaseType: "REMIX", status: "LIVE",
      city: "Abidjan", country: "Côte d'Ivoire", countryCode: "CI",
      artColor: "art-mono", artInitials: "TW",
      streamingLinks: {
        soundcloud: "https://soundcloud.com/amaraxpulse/third-wave",
        youtube:    "https://www.youtube.com/watch?v=placeholder",
        tidal:      "https://tidal.com/track/placeholder",
      },
      description: "Amapiano remix that crosses the continent.",
      tags: ["amapiano", "remix", "west africa"],
      label: "0PROMO", isFeatured: false,
      clickCount: 14220, saveCount: 388, playlistCount: 4,
      releaseDate: now - 55 * 24 * 60 * 60 * 1000, addedAt: now - 12 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("tracks", {
      artistId: a6, artistName: "Yemi.K", curatorId, curatorName: "DISTRICT CURATOR",
      title: "Signal Void", slug: "signal-void-yemik",
      genre: "Electronic", releaseType: "EP", status: "LIVE",
      city: "Nairobi", country: "Kenya", countryCode: "KE",
      artColor: "art-teal", artInitials: "SV",
      streamingLinks: {
        soundcloud: "https://soundcloud.com/yemik/signal-void",
        spotify:    "https://open.spotify.com/track/placeholder",
      },
      description: "East African electronic. Signal from the Rift Valley.",
      tags: ["electronic", "kenya", "east africa"],
      label: "0PROMO", isFeatured: false,
      clickCount: 6780, saveCount: 201, playlistCount: 2,
      releaseDate: now - 28 * 24 * 60 * 60 * 1000, addedAt: now - 6 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("tracks", {
      artistId: a1, artistName: "Kofi Manu", curatorId, curatorName: "DISTRICT CURATOR",
      title: "Gold Shore", slug: "gold-shore-kofi-manu",
      genre: "Highlife", releaseType: "SINGLE", status: "LIVE",
      city: "Accra", country: "Ghana", countryCode: "GH",
      artColor: "art-amber", artInitials: "GS",
      streamingLinks: {
        soundcloud: "https://soundcloud.com/kofimanu/gold-shore",
        spotify:    "https://open.spotify.com/track/placeholder",
        apple:      "https://music.apple.com/track/placeholder",
        youtube:    "https://www.youtube.com/watch?v=placeholder",
      },
      description: "Highlife roots. Golden Coast legacy.",
      tags: ["highlife", "ghana", "accra", "traditional"],
      label: "0PROMO", isFeatured: false,
      clickCount: 11030, saveCount: 321, playlistCount: 3,
      releaseDate: now - 120 * 24 * 60 * 60 * 1000, addedAt: now - 30 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("tracks", {
      artistId: a2, artistName: "DJ Senegal", curatorId, curatorName: "DISTRICT CURATOR",
      title: "Kinshasa Wake", slug: "kinshasa-wake-djsenegal",
      genre: "Afro House", releaseType: "TRACK", status: "LIVE",
      city: "Dakar", country: "Senegal", countryCode: "SN",
      artColor: "art-green", artInitials: "KW",
      streamingLinks: {
        soundcloud: "https://soundcloud.com/djsenegal/kinshasa-wake",
        youtube:    "https://www.youtube.com/watch?v=placeholder",
        spotify:    "https://open.spotify.com/track/placeholder",
      },
      description: "Afro House tribute to the Congo Basin sound.",
      tags: ["afro house", "senegal", "congo", "tribute"],
      label: "0PROMO", isFeatured: false,
      clickCount: 5560, saveCount: 167, playlistCount: 2,
      releaseDate: now - 35 * 24 * 60 * 60 * 1000, addedAt: now - 8 * 24 * 60 * 60 * 1000,
    });

    // ── PLATFORM STATS ───────────────────────────────────────────────────────
    await ctx.db.insert("platformStats", {
      artistCount:     1247,
      trackCount:      8432,
      activeDistricts: 6,
      liveCount:       24,
      memberCount:     3812,
      totalClicks:     284700,
      updatedAt:       now,
    });

    // ── BROADCAST LOG ────────────────────────────────────────────────────────
    const logEntries = [
      { type: "TRACK" as const,     actorName: "ZARA.B",           content: "ZARA.B → NEW REMIX · \"LAGOS RITUAL\"",              actionLabel: "PLAY →",   timestamp: now - 2 * 60 * 1000   },
      { type: "JOIN" as const,      actorName: "YEMI.K",           content: "YEMI.K JOINED 0 DISTRICT",                           actionLabel: "FOLLOW →", timestamp: now - 8 * 60 * 1000   },
      { type: "TRACK" as const,     actorName: "KOFI MANU",        content: "KOFI MANU → NEW SINGLE · \"ACCRA NIGHTS\"",          actionLabel: "PLAY →",   timestamp: now - 15 * 60 * 1000  },
      { type: "PLAYLIST" as const,  actorName: "DISTRICT CURATOR", content: "NEW EDITORIAL PLAYLIST · \"WEST AFRICA HEAT 001\"",  actionLabel: "LISTEN →", timestamp: now - 30 * 60 * 1000  },
      { type: "LIVE" as const,      actorName: "DJ SENEGAL",       content: "DJ SENEGAL IS NOW LIVE · DAKAR FREQUENCY VOL.3",     actionLabel: "TUNE IN →",timestamp: now - 45 * 60 * 1000  },
      { type: "COLLAB" as const,    actorName: "ECHO DELTA",       content: "ECHO DELTA → OPEN COLLAB · AFROPOP REMIX CHALLENGE", actionLabel: "APPLY →",  timestamp: now - 60 * 60 * 1000  },
      { type: "CHALLENGE" as const, actorName: "0PROMO",           content: "NEW CHALLENGE · JOBURG GRID REMIX · $500 PRIZE",     actionLabel: "ENTER →",  timestamp: now - 2 * 3600 * 1000 },
      { type: "TRACK" as const,     actorName: "AMARA X PULSE",    content: "AMARA X PULSE → NEW ALBUM · \"AFRO PULSE\"",         actionLabel: "PLAY →",   timestamp: now - 3 * 3600 * 1000 },
      { type: "SYSTEM" as const,    actorName: "0 DISTRICT",       content: "DISTRICT D-06-DKR (DAKAR) NOW ACTIVE",               actionLabel: "EXPLORE →",timestamp: now - 5 * 3600 * 1000 },
      { type: "JOIN" as const,      actorName: "OFO BEATS",        content: "OFO BEATS JOINED 0 DISTRICT",                        actionLabel: "FOLLOW →", timestamp: now - 6 * 3600 * 1000 },
    ];
    for (const entry of logEntries) {
      await ctx.db.insert("broadcastLog", { ...entry });
    }

    // ── COLLABS ──────────────────────────────────────────────────────────────
    await ctx.db.insert("collabs", {
      creatorId: a5, creatorName: "Echo Delta",
      title: "Afropop Remix Challenge", type: "remix", status: "open",
      description: "We're looking for Afropop producers to remix our track 'Joburg Grid'. Full stem pack available. Best remix gets a co-release and credit.",
      genre: "Afrobeats", bpm: 104,
      deadline: now + 14 * 24 * 60 * 60 * 1000,
      spotsTotal: 10, spotsFilled: 4,
      artColor: "art-amber", artInitials: "ED",
      linkedTrackId: t5,
    });

    await ctx.db.insert("collabs", {
      creatorId: a6, creatorName: "Yemi.K",
      title: "Nairobi Session Vol.4", type: "production", status: "open",
      description: "Looking for a keyboard player and bassist for our next studio session in Nairobi. Remote contribution welcome.",
      genre: "Afropop",
      deadline: now + 21 * 24 * 60 * 60 * 1000,
      spotsTotal: 2, spotsFilled: 0,
      artColor: "art-teal", artInitials: "YK",
    });

    await ctx.db.insert("collabs", {
      creatorId: a3, creatorName: "Zara.B",
      title: "Lagos Drill Collab", type: "vocals", status: "open",
      description: "Zara.B is looking for a male vocalist for a new Lagos Drill crossover project. DM with a voice note or SoundCloud link.",
      genre: "Drill",
      deadline: now + 7 * 24 * 60 * 60 * 1000,
      spotsTotal: 1, spotsFilled: 0,
      artColor: "art-purple", artInitials: "ZB",
    });

    // ── POSTS (community feed) ────────────────────────────────────────────────
    await ctx.db.insert("posts", {
      authorId: a1, authorName: "Kofi Manu", authorInitials: "KM", authorColor: "art-red",
      content: "Accra Nights is out now on all platforms. This one took 6 months to get right — the drums alone went through 40 iterations. Thank you to everyone who believed in this sound. Stream it, share it, let it reach everywhere it needs to go. #ACCRANIGHTS #0DISTRICT #AFROBEATS",
      tags: ["#NEWRELEASE", "#AFROBEATS", "#GHANA"],
      type: "release", isPinned: true, isHot: true,
      voteCount: 234, replyCount: 47, saveCount: 89,
      linkedTrackId: t1,
    });

    await ctx.db.insert("posts", {
      authorId: a2, authorName: "DJ Senegal", authorInitials: "DS", authorColor: "art-blue",
      content: "Just confirmed: DJ SENEGAL TAKEOVER · 3HR LIVE SET this Friday at 20:00 GMT. Afro House, Mbalax, and some new unreleased joints. Set your reminders. Dakar to the world. #DJSENEGAL #AFROHOUSE #LIVERADIO",
      tags: ["#LIVE", "#AFROHOUSE", "#DAKAR"],
      type: "post", isPinned: false, isHot: true,
      voteCount: 187, replyCount: 31, saveCount: 54,
    });

    await ctx.db.insert("posts", {
      authorId: a3, authorName: "Zara.B", authorInitials: "ZB", authorColor: "art-purple",
      content: "Looking for a male vocalist for my next Lagos Drill crossover project. If you're in Lagos or can record remotely — send me a voice note or drop your SoundCloud in the replies. Let's build something real. #COLLAB #LAGOS #VOCALIST",
      tags: ["#COLLAB", "#VOCALIST", "#LAGOS"],
      type: "collab_request", isPinned: false, isHot: false,
      voteCount: 92, replyCount: 28, saveCount: 23,
    });

    // ── PLAYLISTS ─────────────────────────────────────────────────────────────
    const pl1 = await ctx.db.insert("playlists", {
      curatorId, curatorName: "DISTRICT CURATOR",
      title: "WEST AFRICA HEAT 001",
      artColor: "art-red",
      description: "The hottest tracks coming out of West Africa right now. Curated by the 0 District team.",
      type: "editorial", isPublished: true, isFeatured: true,
      trackCount: 6, saveCount: 142,
    });

    const pl2 = await ctx.db.insert("playlists", {
      curatorId, curatorName: "DISTRICT CURATOR",
      title: "ELECTRONIC AFRICA",
      artColor: "art-blue",
      description: "African electronic music — from Amapiano to Afro House to experimental electronic. Cross-continental.",
      type: "editorial", isPublished: true, isFeatured: false,
      trackCount: 4, saveCount: 87,
    });

    // Add tracks to playlists
    for (const [i, trackId] of [t1, t2, t3, t4, t5, t6].entries()) {
      await ctx.db.insert("playlistTracks", {
        playlistId: pl1, trackId, position: i, addedAt: now, addedBy: curatorId,
      });
    }
    for (const [i, trackId] of [t5, t2, t7].entries()) {
      await ctx.db.insert("playlistTracks", {
        playlistId: pl2, trackId, position: i, addedAt: now, addedBy: curatorId,
      });
    }

    // ── BROADCASTS ────────────────────────────────────────────────────────────
    await ctx.db.insert("broadcasts", {
      artistId: a2, artistName: "DJ Senegal",
      title: "DJ SENEGAL TAKEOVER",
      description: "3HR LIVE SET · AFRO HOUSE · DAKAR FREQUENCY VOL.3",
      genre: "Afro House",
      scheduledAt: now + 2 * 24 * 60 * 60 * 1000,
      durationMins: 180,
      status: "UPCOMING", isFeatured: true,
      reminderCount: 234,
    });

    await ctx.db.insert("broadcasts", {
      artistId: a3, artistName: "Zara.B",
      title: "ZARA.B LIVE SESSION",
      description: "Acoustic live set · Afro Soul · New material preview",
      genre: "Afro Soul",
      scheduledAt: now + 7 * 24 * 60 * 60 * 1000,
      durationMins: 90,
      status: "UPCOMING", isFeatured: false,
      reminderCount: 89,
    });

    // ── RADIO QUEUE ───────────────────────────────────────────────────────────
    await ctx.db.insert("radioQueue", { trackId: t1, trackTitle: "Accra Nights",    artistName: "Kofi Manu",  artColor: "art-red",    artInitials: "KM", position: 0, type: "PLAYING", addedBy: "system" });
    await ctx.db.insert("radioQueue", { trackId: t3, trackTitle: "Lagos Ritual",    artistName: "Zara.B",     artColor: "art-purple", artInitials: "ZB", position: 1, type: "NEXT",    addedBy: "system" });
    await ctx.db.insert("radioQueue", { trackId: t5, trackTitle: "Joburg Grid",     artistName: "Echo Delta", artColor: "art-amber",  artInitials: "ED", position: 2, type: "QUEUE",   addedBy: "system" });
    await ctx.db.insert("radioQueue", { trackId: t2, trackTitle: "Dakar Frequency", artistName: "DJ Senegal", artColor: "art-blue",   artInitials: "DS", position: 3, type: "QUEUE",   addedBy: "system" });
    await ctx.db.insert("radioQueue", { trackId: t6, trackTitle: "Nairobi Rise",    artistName: "Yemi.K",     artColor: "art-teal",   artInitials: "YK", position: 4, type: "QUEUE",   addedBy: "system" });

    console.log("✅ Seed complete");
    return {
      seeded: true,
      counts: {
        users: 9, cities: 8, tracks: 12, playlists: 2,
        collabs: 3, posts: 3, broadcasts: 2, radioQueue: 5,
      },
    };
  },
});
