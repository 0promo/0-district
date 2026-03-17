/**
 * home.js — 0 District homepage data loader
 * Fetches live data from Supabase and injects into the page.
 * Falls back gracefully: if DB is empty or network fails, static HTML stays.
 */

import { getFeaturedTracks, getLatestTracks, getEditorialPosts } from './supabase.js';

/* ─── HELPERS ─────────────────────────────────────────────────────── */

function fmtDuration(secs) {
  if (!secs) return '';
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function fmtPlays(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function skeletonCard() {
  return `<div class="track-card skeleton">
    <div class="track-card-art skeleton-block" style="aspect-ratio:1;width:100%"></div>
    <div class="track-card-info" style="padding-top:12px">
      <div class="skeleton-line w70"></div>
      <div class="skeleton-line w50"></div>
    </div>
  </div>`;
}

/* ─── BUILD A TRACK CARD (matches existing .track-card structure) ──── */

function buildTrackCard(track, badge = '') {
  // Art block — colour coded placeholder if no cover
  const artColours = ['art-red','art-blue','art-purple','art-green','art-amber','art-teal','art-mono'];
  const artClass   = artColours[Math.floor(Math.random() * artColours.length)];
  const initials   = (track.artist_name || track.title || 'XX')
    .split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  const artInner = track.cover_url
    ? `<img src="${track.cover_url}" alt="${track.title}" loading="lazy"
         style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">`
    : `<div class="${artClass}" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><div class="art-label">${initials}</div></div>`;

  const badgeEl = badge
    ? `<div class="track-card-badge">${badge}</div>`
    : `<div class="track-card-badge">${track.genre || 'TRACK'}</div>`;

  const dur = fmtDuration(track.duration_sec);

  return `<div class="track-card" data-track-id="${track.id}" data-audio="${track.audio_url || ''}">
    <div class="track-card-art">
      ${artInner}
      ${badgeEl}
      <div class="track-card-play">
        <div class="track-play-circle">
          <svg width="8" height="10" viewBox="0 0 8 10"><polygon points="0,0 8,5 0,10" fill="#F5F5F5"/></svg>
        </div>
      </div>
    </div>
    <div class="track-card-info">
      <div class="track-card-title">${track.title}</div>
      <div class="track-card-artist">${track.artist_name || 'Unknown'}</div>
      ${dur ? `<div class="track-card-city">${dur} &middot; ${fmtPlays(track.plays)} plays</div>` : ''}
    </div>
  </div>`;
}

/* ─── BUILD A BTT CARD (matches .btt-card structure) ─────────────── */

function buildBttCard(post, idx = 0) {
  const artColours = ['art-red','art-blue','art-purple'];
  const artClass   = artColours[idx % artColours.length];
  const initials   = (post.author || '0D').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const tags       = (post.tags || []).slice(0,2).map(t => t.toUpperCase()).join(' · ');
  const slug       = post.slug || '#';

  return `<article class="btt-card${idx > 0 ? ' reveal reveal-delay-' + idx : ' reveal'}">
    <div class="btt-card-art ${artClass}">
      <div class="btt-card-art-label">${initials}</div>
      <div class="btt-card-play-tag">
        <svg width="8" height="9" viewBox="0 0 8 9"><polygon points="0,0 8,4.5 0,9" fill="currentColor"/></svg>
        PLAY
      </div>
    </div>
    <div class="btt-card-body">
      <p class="btt-card-eyebrow">${tags || 'EDITORIAL'}</p>
      <h3 class="btt-card-title">${post.title}</h3>
      <p class="btt-card-excerpt">${post.excerpt || ''}</p>
      <div class="btt-card-footer">
        <span class="btt-card-curator">by <strong>${post.author || '0 District'}</strong></span>
        <a href="/editorial/${slug}" class="btt-card-link">READ
          <svg width="14" height="7" viewBox="0 0 14 7">
            <line x1="0" y1="3.5" x2="12" y2="3.5" stroke="currentColor" stroke-width="1.5"/>
            <polyline points="8,1 12,3.5 8,6" fill="none" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </a>
      </div>
    </div>
  </article>`;
}

/* ─── LOAD NOW PLAYING CAROUSEL ───────────────────────────────────── */

async function loadNowPlaying() {
  const carousel = document.querySelector('#now-playing');
  if (!carousel) return;

  const staticHTML = carousel.innerHTML; // save fallback
  carousel.innerHTML = Array(4).fill(skeletonCard()).join('');

  try {
    const tracks = await getFeaturedTracks(8);
    if (!tracks.length) {
      carousel.innerHTML = staticHTML; // DB empty → keep placeholders
      return;
    }
    carousel.innerHTML = tracks.map((t, i) =>
      buildTrackCard(t, i === 0 ? '&#9679; LIVE' : (t.genre || 'TRACK'))
    ).join('');
    bindPlayCards(carousel);
  } catch (err) {
    console.warn('[0 District] Now Playing load failed:', err);
    carousel.innerHTML = staticHTML; // network fail → keep placeholders
  }
}

/* ─── LOAD NEW RELEASES CAROUSEL ──────────────────────────────────── */

async function loadNewReleases() {
  const carousel = document.querySelector('#new-releases');
  if (!carousel) return;

  const staticHTML = carousel.innerHTML;

  try {
    const tracks = await getLatestTracks(8);
    if (!tracks.length) { carousel.innerHTML = staticHTML; return; }
    carousel.innerHTML = tracks.map(t => buildTrackCard(t, t.genre || 'NEW')).join('');
    bindPlayCards(carousel);
  } catch (err) {
    console.warn('[0 District] New Releases load failed:', err);
    carousel.innerHTML = staticHTML;
  }
}

/* ─── LOAD EDITORIAL (BTT) ────────────────────────────────────────── */

async function loadEditorial() {
  const grid = document.querySelector('.btt-grid, [data-section="editorial"]');
  if (!grid) return;

  const staticHTML = grid.innerHTML;

  try {
    const posts = await getEditorialPosts(3);
    if (!posts.length) { grid.innerHTML = staticHTML; return; }
    grid.innerHTML = posts.map((p, i) => buildBttCard(p, i)).join('');
  } catch (err) {
    console.warn('[0 District] Editorial load failed:', err);
    grid.innerHTML = staticHTML;
  }
}

/* ─── LIVE STATS FROM SUPABASE ────────────────────────────────────── */

async function loadStats() {
  try {
    const SUPABASE_URL = 'https://awmvfkekwrjcrfllcepl.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_Gpr3sOBF49RxB6xWUwO_PA_I7vk9enI';
    const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'count=exact', 'Accept': 'application/json' };

    const [artistRes, trackRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/artists?select=id&limit=1`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/tracks?select=id&limit=1`, { headers }),
    ]);

    const artists = parseInt(artistRes.headers.get('Content-Range')?.split('/')[1] || '0', 10);
    const tracks  = parseInt(trackRes.headers.get('Content-Range')?.split('/')[1] || '0', 10);

    if (artists > 0) animateStat('statArtists', artists);
    if (tracks  > 0) animateStat('statTracks',  tracks);
  } catch (err) {
    // Stats stay at their animated placeholder values — no user-visible error
  }
}

function animateStat(id, target) {
  const el = document.getElementById(id);
  if (!el || target === 0) return;
  const duration = 1400;
  const start    = performance.now();
  const from     = 0;
  const ease     = t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
  function step(now) {
    const t   = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(from + (target - from) * ease(t)).toLocaleString();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ─── CARD CLICK → PLAYER ─────────────────────────────────────────── */

let currentAudio = null;
let currentCard  = null;

function bindPlayCards(container) {
  container.querySelectorAll('.track-card').forEach(card => {
    card.addEventListener('click', () => {
      const src = card.dataset.audio;
      if (!src) return;

      if (currentAudio && currentCard === card) {
        currentAudio.pause(); currentAudio = null; currentCard = null;
        card.classList.remove('is-playing');
        return;
      }
      if (currentAudio) { currentAudio.pause(); currentCard?.classList.remove('is-playing'); }

      currentAudio = new Audio(src);
      currentAudio.play().catch(() => {});
      currentAudio.addEventListener('ended', () => { card.classList.remove('is-playing'); currentAudio = null; currentCard = null; });
      card.classList.add('is-playing');
      currentCard = card;
    });
  });
}

/* ─── INIT ────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  loadNowPlaying();
  loadNewReleases();
  loadEditorial();
  loadStats();
});
