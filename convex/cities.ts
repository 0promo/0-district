import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// ── GET all active cities for Africa Signal Map ────────────────────────────────
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("cities")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// ── GET city by name ──────────────────────────────────────────────────────────
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const cities = await ctx.db.query("cities").collect();
    return cities.find((c) => c.name.toUpperCase() === name.toUpperCase()) ?? null;
  },
});

// ── SEED the 8 launch cities ──────────────────────────────────────────────────
// Run once: npx convex run cities:seed
export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("cities").collect();
    if (existing.length > 0) return "Already seeded";

    const launchCities = [
      { name: "CAIRO",        country: "Egypt",        countryCode: "EG", lat: 30.04, lng: 31.24 },
      { name: "DAKAR",        country: "Senegal",      countryCode: "SN", lat: 14.69, lng: -17.44 },
      { name: "ACCRA",        country: "Ghana",        countryCode: "GH", lat:  5.56, lng: -0.19 },
      { name: "LAGOS",        country: "Nigeria",      countryCode: "NG", lat:  6.52, lng:  3.38 },
      { name: "ADDIS ABABA",  country: "Ethiopia",     countryCode: "ET", lat:  9.03, lng: 38.75 },
      { name: "NAIROBI",      country: "Kenya",        countryCode: "KE", lat: -1.29, lng: 36.82 },
      { name: "KINSHASA",     country: "DR Congo",     countryCode: "CD", lat: -4.32, lng: 15.27 },
      { name: "JOHANNESBURG", country: "South Africa", countryCode: "ZA", lat:-26.20, lng: 28.05 },
    ];

    for (const city of launchCities) {
      await ctx.db.insert("cities", {
        ...city,
        isActive:     true,
        artistCount:  0,
        trackCount:   0,
        liveCount:    0,
      });
    }

    return `Seeded ${launchCities.length} cities`;
  },
});

// ── UPDATE city stats (called when artist registers city) ────────────────────
export const updateStats = mutation({
  args: {
    cityName:     v.string(),
    artistDelta:  v.optional(v.number()),
    trackDelta:   v.optional(v.number()),
    liveDelta:    v.optional(v.number()),
  },
  handler: async (ctx, { cityName, artistDelta = 0, trackDelta = 0, liveDelta = 0 }) => {
    const cities = await ctx.db.query("cities").collect();
    const city = cities.find((c) => c.name.toUpperCase() === cityName.toUpperCase());
    if (!city) return;

    await ctx.db.patch(city._id, {
      artistCount: Math.max(0, city.artistCount + artistDelta),
      trackCount:  Math.max(0, city.trackCount  + trackDelta),
      liveCount:   Math.max(0, city.liveCount   + liveDelta),
    });
  },
});
