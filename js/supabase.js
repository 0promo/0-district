/**
 * supabase.js — 0 District × Supabase client
 * Uses the native fetch-based REST API (no npm required).
 */

const SUPABASE_URL = 'https://awmvfkekwrjcrfllcepl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Gpr3sOBF49RxB6xWUwO_PA_I7vk9enI';

/**
 * Generic REST query helper
 * @param {string} table   - table name
 * @param {string} params  - PostgREST query string e.g. "featured=eq.true&order=created_at.desc&limit=10"
 * @returns {Promise<Array>}
 */
async function sbFetch(table, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${params ? '?' + params : ''}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Accept': 'application/json',
      'Prefer': 'return=representation',
    },
  });
  if (!res.ok) throw new Error(`Supabase error ${res.status}: ${await res.text()}`);
  return res.json();
}

/* ─── PUBLIC API ─────────────────────────────────────────────────── */

/** Featured tracks for the NOW PLAYING carousel */
export async function getFeaturedTracks(limit = 8) {
  return sbFetch('tracks', `featured=eq.true&order=created_at.desc&limit=${limit}&select=id,title,artist_name,cover_url,audio_url,genre,duration_sec,plays`);
}

/** All tracks, newest first */
export async function getLatestTracks(limit = 20) {
  return sbFetch('tracks', `order=created_at.desc&limit=${limit}&select=id,title,artist_name,cover_url,audio_url,genre,duration_sec,plays`);
}

/** Featured playlists */
export async function getFeaturedPlaylists(limit = 6) {
  return sbFetch('playlists', `featured=eq.true&order=created_at.desc&limit=${limit}`);
}

/** Published editorial posts, newest first */
export async function getEditorialPosts(limit = 3) {
  return sbFetch('editorial_posts', `published=eq.true&order=published_at.desc&limit=${limit}&select=id,title,slug,excerpt,cover_url,author,tags,published_at`);
}

/** Active radio streams */
export async function getRadioStreams() {
  return sbFetch('radio_streams', `active=eq.true&order=created_at.asc`);
}

/** Increment play count for a track */
export async function incrementPlay(trackId) {
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_plays`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ track_id: trackId }),
  });
}
