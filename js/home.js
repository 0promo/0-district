/**
 * home.js — 0 District homepage data loader
 * Fetches live data from Supabase and injects it into the page.
 * Falls back gracefully if the network fails (static HTML stays visible).
 */

import { getFeaturedTracks, getEditorialPosts, getFeaturedPlaylists } from './supabase.js';

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

/** Skeleton card shown while loading */
function skeletonCard() {
  return `<div class="track-card skeleton">
    <div class="track-cover skeleton-block"></div>
    <div class="track-info">
      <div class="skeleton-line w70"></div>
      <div class="skeleton-line w50"></div>
    </div>
  </div>`;
}

/* ─── TRACK CARD ──────────────────────────────────────────────────── */

function buildTrackCard(track) {
  const cover = track.cover_url
    ? `<img src="${track.cover_url}" alt="${track.title}" loading="lazy">`
    : `<div class="track-cover-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16"/></svg></div>`;

  const dur = fmtDuration(track.duration_sec);
  const plays = fmtPlays(track.plays);

  return `<div class="track-card" data-track-id="${track.id}" data-audio="${track.audio_url || ''}">
    <div class="track-cover">
      ${cover}
      <button class="track-play-btn" aria-label="Play ${track.title}">
        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
      </button>
    </div>
    <div class="track-info">
      <p class="track-title">${track.title}</p>
      <p class="track-artist">${track.artist_name || 'Unknown'}</p>
      <div class="track-meta">
        ${track.genre ? `<span class="track-genre">${track.genre}</span>` : ''}
        ${dur ? `<span class="track-dur">${dur}</span>` : ''}
        <span class="track-plays">${plays} plays</span>
      </div>
    </div>
  </div>`;
}

/* ─── EDITORIAL CARD ──────────────────────────────────────────────── */

function buildBttCard(post) {
  const bgStyle = post.cover_url ? `background-image:url(${post.cover_url})` : '';
  const tags = (post.tags || []).map(t => `<span>${t.toUpperCase()}</span>`).join('');
  return `<article class="btt-card">
    <div class="btt-card-art" style="${bgStyle}"></div>
    <div class="btt-card-body">
      ${tags ? `<div class="btt-card-tags">${tags}</div>` : ''}
      <h3 class="btt-card-title">${post.title}</h3>
      <p class="btt-card-excerpt">${post.excerpt || ''}</p>
      <div class="btt-card-footer">
        <span class="btt-card-curator">${post.author || '0 District'}</span>
        <a href="/editorial/${post.slug}" class="btt-card-link">READ <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg></a>
      </div>
    </div>
  </article>`;
}

/* ─── INJECT NOW PLAYING ──────────────────────────────────────────── */

async function loadNowPlaying() {
  // Matches the existing carousel-track container
  const carousel = document.querySelector('#now-playing, .now-playing-carousel, [data-carousel="now-playing"]');
  if (!carousel) return;

  // show skeletons
  carousel.innerHTML = Array(4).fill(skeletonCard()).join('');

  try {
    const tracks = await getFeaturedTracks(8);
    if (!tracks.length) return; // keep static HTML if DB is empty

    carousel.innerHTML = tracks.map(buildTrackCard).join('');
    bindPlayerButtons(carousel);
  } catch (err) {
    console.warn('[0 District] Could not load tracks:', err);
    carousel.innerHTML = ''; // fall back to static HTML already in DOM
  }
}

/* ─── INJECT EDITORIAL ────────────────────────────────────────────── */

async function loadEditorial() {
  const grid = document.querySelector('.btt-grid, [data-section="editorial"]');
  if (!grid) return;

  try {
    const posts = await getEditorialPosts(3);
    if (!posts.length) return;

    grid.innerHTML = posts.map(buildBttCard).join('');
  } catch (err) {
    console.warn('[0 District] Could not load editorial:', err);
  }
}

/* ─── MINI PLAYER BINDINGS ────────────────────────────────────────── */

let currentAudio = null;
let currentBtn   = null;

function bindPlayerButtons(container) {
  container.querySelectorAll('.track-play-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const card = btn.closest('.track-card');
      const src  = card?.dataset.audio;

      // Stop current track
      if (currentAudio) {
        currentAudio.pause();
        currentBtn?.classList.remove('playing');
      }

      if (currentBtn === btn) {
        // Toggle off
        currentAudio = null;
        currentBtn   = null;
        return;
      }

      if (src) {
        currentAudio = new Audio(src);
        currentAudio.play().catch(() => {});
        currentAudio.addEventListener('ended', () => {
          btn.classList.remove('playing');
          currentAudio = null;
          currentBtn   = null;
        });
      }

      btn.classList.add('playing');
      currentBtn = btn;
    });
  });
}

/* ─── INIT ────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  loadNowPlaying();
  loadEditorial();
});
