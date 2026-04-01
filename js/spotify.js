/* ════════════════════════════════════════════════════════════════
   0 DISTRICT × SPOTIFY WEB PLAYBACK SDK
   ────────────────────────────────────────────────────────────────
   Enables in-browser Spotify Premium playback.
   Uses OAuth 2.0 PKCE (no backend server required).

   SETUP (one-time — takes 5 minutes):
   ────────────────────────────────────
   1. Go to https://developer.spotify.com/dashboard
   2. Create an app — "0 District" — set redirect URI to:
      http://localhost:5500/spotify-callback.html  (local)
      https://yourdomain.com/spotify-callback.html  (production)
   3. Copy your Client ID below.
   4. Deploy spotify-callback.html alongside your other pages.
   ════════════════════════════════════════════════════════════════ */

const SPOTIFY = {
  clientId:    'cc71e7e671e04d2d89becefa461a64d6',
  redirectUri: `${window.location.origin}/spotify-callback.html`,
  scopes: [
    'streaming',                      // Web Playback SDK — in-browser audio
    'user-read-email',                // identify the account
    'user-read-private',              // Premium check
    'user-read-playback-state',       // read what's playing
    'user-modify-playback-state',     // play / pause / seek / volume
    'user-read-currently-playing',    // now playing data
    'playlist-read-private',          // user's private playlists
    'playlist-read-collaborative',    // collaborative playlists
    'user-library-read',              // liked songs / saved albums
  ].join(' '),

  // Token storage keys
  TOKEN_KEY:   '_0d_sp_token',
  EXPIRY_KEY:  '_0d_sp_expiry',
  VERIFIER_KEY:'_0d_sp_verifier',
};

/* ─────────────────────────────────────────────────────────────────
   PKCE HELPERS
───────────────────────────────────────────────────────────────── */

function _generateVerifier(len = 64) {
  const chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const arr    = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(x => chars[x % chars.length]).join('');
}

async function _generateChallenge(verifier) {
  const data    = new TextEncoder().encode(verifier);
  const digest  = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/* ─────────────────────────────────────────────────────────────────
   AUTH FLOW
───────────────────────────────────────────────────────────────── */

async function spotifyLogin() {
  if (SPOTIFY.clientId === 'YOUR_SPOTIFY_CLIENT_ID') {
    showToast('ADD YOUR SPOTIFY CLIENT ID TO js/spotify.js FIRST', 'error');
    return;
  }

  const verifier   = _generateVerifier();
  const challenge  = await _generateChallenge(verifier);

  // Persist verifier, client ID, and the page to return to after auth
  sessionStorage.setItem(SPOTIFY.VERIFIER_KEY, verifier);
  sessionStorage.setItem('_0d_sp_return', window.location.pathname + window.location.search);
  localStorage.setItem('_0d_sp_client_id', SPOTIFY.clientId);

  const params = new URLSearchParams({
    client_id:             SPOTIFY.clientId,
    response_type:         'code',
    redirect_uri:          SPOTIFY.redirectUri,
    code_challenge_method: 'S256',
    code_challenge:        challenge,
    scope:                 SPOTIFY.scopes,
    state:                 crypto.randomUUID(),
  });

  window.location.href = 'https://accounts.spotify.com/authorize?' + params.toString();
}

async function spotifyHandleCallback(code) {
  const verifier = sessionStorage.getItem(SPOTIFY.VERIFIER_KEY);
  if (!verifier) return null;

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  SPOTIFY.redirectUri,
      client_id:     SPOTIFY.clientId,
      code_verifier: verifier,
    }),
  });

  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem(SPOTIFY.TOKEN_KEY,  data.access_token);
    localStorage.setItem(SPOTIFY.EXPIRY_KEY, Date.now() + data.expires_in * 1000);
    sessionStorage.removeItem(SPOTIFY.VERIFIER_KEY);
    return data.access_token;
  }
  return null;
}

async function spotifyRefreshToken() {
  const refreshToken = localStorage.getItem('_0d_sp_refresh');
  if (!refreshToken) return null;

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      client_id:     SPOTIFY.clientId,
    }),
  });
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem(SPOTIFY.TOKEN_KEY,  data.access_token);
    localStorage.setItem(SPOTIFY.EXPIRY_KEY, Date.now() + data.expires_in * 1000);
    return data.access_token;
  }
  return null;
}

function spotifyGetToken() {
  const token  = localStorage.getItem(SPOTIFY.TOKEN_KEY);
  const expiry = parseInt(localStorage.getItem(SPOTIFY.EXPIRY_KEY) || '0', 10);
  if (token && expiry > Date.now() + 30000) return token;
  return null;
}

function spotifyIsConnected() {
  return !!spotifyGetToken();
}

function spotifyDisconnect() {
  localStorage.removeItem(SPOTIFY.TOKEN_KEY);
  localStorage.removeItem(SPOTIFY.EXPIRY_KEY);
  localStorage.removeItem('_0d_sp_refresh');
  _sdkPlayer = null;
  _deviceId   = null;
  updateSpotifyNavState(false);
  showToast('AUDIO DISCONNECTED', 'info');
}

/* ─────────────────────────────────────────────────────────────────
   WEB PLAYBACK SDK
───────────────────────────────────────────────────────────────── */

let _sdkPlayer   = null;
let _deviceId    = null;
let _sdkReady    = false;
let _sdkLoading  = false;

function loadSpotifySDK() {
  return new Promise((resolve) => {
    if (window.Spotify) { resolve(); return; }
    if (_sdkLoading)    { window._spotifySDKResolve = resolve; return; }
    _sdkLoading = true;

    window.onSpotifyWebPlaybackSDKReady = () => {
      _sdkReady = true;
      resolve();
      if (window._spotifySDKResolve) { window._spotifySDKResolve(); window._spotifySDKResolve = null; }
    };

    const script  = document.createElement('script');
    script.src    = 'https://sdk.scdn.co/spotify-player.js';
    script.async  = true;
    document.head.appendChild(script);
  });
}

async function initSpotifyPlayer(token) {
  if (_sdkPlayer) return _sdkPlayer;
  await loadSpotifySDK();

  _sdkPlayer = new Spotify.Player({
    name:    '0 District · Radio',
    getOAuthToken: async (cb) => {
      let t = spotifyGetToken();
      if (!t) t = await spotifyRefreshToken();
      cb(t || token);
    },
    volume: 0.8,
  });

  // Event listeners
  _sdkPlayer.addListener('ready', ({ device_id }) => {
    _deviceId = device_id;
    console.log('[0D Spotify] Ready on device:', device_id);
    updateSpotifyNavState(true);
    showToast('0 DISTRICT RADIO · AUDIO READY', 'success');
    _transferPlaybackHere(device_id, token);
    // Reveal user playlists in radio page if present
    if (typeof renderSpotifyPlaylists === 'function') renderSpotifyPlaylists('spotifyPlaylistsMount');
  });

  _sdkPlayer.addListener('not_ready', ({ device_id }) => {
    console.log('[0D Spotify] Device offline:', device_id);
  });

  _sdkPlayer.addListener('player_state_changed', (state) => {
    if (state) updatePlayerUI(state);
  });

  _sdkPlayer.addListener('authentication_error', ({ message }) => {
    showToast('AUDIO AUTH ERROR — RECONNECT TO ENABLE RADIO', 'error');
    spotifyDisconnect();
  });

  _sdkPlayer.addListener('account_error', () => {
    showToast('SPOTIFY PREMIUM REQUIRED · UPGRADE TO ENABLE RADIO AUDIO', 'error');
  });

  await _sdkPlayer.connect();
  return _sdkPlayer;
}

async function _transferPlaybackHere(deviceId, token) {
  await fetch('https://api.spotify.com/v1/me/player', {
    method:  'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ device_ids: [deviceId], play: false }),
  });
}

/* ─────────────────────────────────────────────────────────────────
   PLAYBACK CONTROLS
───────────────────────────────────────────────────────────────── */

/**
 * Play a track by Spotify URI or URL.
 * Examples:
 *   spotifyPlay('spotify:track:4uLU6hMCjMI75M1A2tKUQC')
 *   spotifyPlay('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC')
 */
async function spotifyPlay(trackUriOrUrl) {
  const token = spotifyGetToken();
  if (!token) {
    spotifyLogin();
    return;
  }

  if (!_sdkPlayer || !_deviceId) {
    await initSpotifyPlayer(token);
    // Wait for ready
    await new Promise(r => setTimeout(r, 1200));
  }

  const uri = _toSpotifyUri(trackUriOrUrl);
  if (!uri) { showToast('INVALID SPOTIFY LINK', 'error'); return; }

  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${_deviceId}`, {
    method:  'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ uris: [uri] }),
  });
}

async function spotifyPause() {
  if (_sdkPlayer) await _sdkPlayer.pause();
}

async function spotifyResume() {
  if (_sdkPlayer) await _sdkPlayer.resume();
}

async function spotifyToggle() {
  if (_sdkPlayer) await _sdkPlayer.togglePlay();
}

async function spotifyNextTrack() {
  if (_sdkPlayer) await _sdkPlayer.nextTrack();
}

async function spotifyPrevTrack() {
  if (_sdkPlayer) await _sdkPlayer.previousTrack();
}

async function spotifySetVolume(pct) {
  if (_sdkPlayer) await _sdkPlayer.setVolume(Math.max(0, Math.min(1, pct / 100)));
}

async function spotifySeek(posMs) {
  if (_sdkPlayer) await _sdkPlayer.seek(posMs);
}

/* Play a context (album, playlist) by URI */
async function spotifyPlayContext(contextUri, offsetIndex = 0) {
  const token = spotifyGetToken();
  if (!token || !_deviceId) return;

  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${_deviceId}`, {
    method:  'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ context_uri: contextUri, offset: { position: offsetIndex } }),
  });
}

/* ─────────────────────────────────────────────────────────────────
   CURRENT TRACK INFO
───────────────────────────────────────────────────────────────── */

async function spotifyGetCurrentState() {
  const token = spotifyGetToken();
  if (!token) return null;
  const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok || res.status === 204) return null;
  return res.json().catch(() => null);
}

async function spotifySearch(query, type = 'track', limit = 10) {
  const token = spotifyGetToken();
  if (!token) return null;
  const params = new URLSearchParams({ q: query, type, limit });
  const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json().catch(() => null);
}

/* ─────────────────────────────────────────────────────────────────
   UI UPDATE HOOKS
───────────────────────────────────────────────────────────────── */

function updatePlayerUI(state) {
  if (!state) return;

  const track    = state.track_window?.current_track;
  const isPaused = state.paused;

  if (!track) return;

  // Update player bar elements if they exist
  const titleEl  = document.querySelector('.player-title');
  const artistEl = document.querySelector('.player-artist');
  const artEl    = document.querySelector('.player-art-img, .player-art');
  const playBtn  = document.querySelector('.player-btn-play, [data-player-play]');
  const progressEl = document.querySelector('.player-progress-fill, [data-progress-fill]');

  if (titleEl)  titleEl.textContent  = track.name || '';
  if (artistEl) artistEl.textContent = (track.artists || []).map(a => a.name).join(', ');

  if (artEl && track.album?.images?.[0]?.url) {
    if (artEl.tagName === 'IMG') {
      artEl.src = track.album.images[0].url;
    } else {
      artEl.style.backgroundImage = `url(${track.album.images[0].url})`;
    }
  }

  if (playBtn) {
    playBtn.dataset.playing = isPaused ? '0' : '1';
    playBtn.setAttribute('aria-label', isPaused ? 'Play' : 'Pause');
    const icon = playBtn.querySelector('svg, .play-icon');
    if (icon) icon.innerHTML = isPaused
      ? '<polygon points="0,0 11,6.5 0,13" fill="currentColor"/>'
      : '<rect x="1" y="0" width="4" height="13" fill="currentColor"/><rect x="8" y="0" width="4" height="13" fill="currentColor"/>';
  }

  // Progress
  if (progressEl && state.duration) {
    const pct = (state.position / state.duration) * 100;
    progressEl.style.width = `${pct}%`;
  }

  // Start progress ticker
  if (!isPaused) _startProgressTick(state.position, state.duration);
}

let _progressInterval = null;
let _progressPos = 0;
let _progressDur = 0;

function _startProgressTick(startPos, duration) {
  clearInterval(_progressInterval);
  _progressPos = startPos;
  _progressDur = duration;
  const startTime = Date.now();

  _progressInterval = setInterval(() => {
    _progressPos = startPos + (Date.now() - startTime);
    const pct = Math.min((_progressPos / _progressDur) * 100, 100);

    const fillEl = document.querySelector('.player-progress-fill, [data-progress-fill]');
    const timeEl = document.querySelector('.player-time-current, [data-time-current]');

    if (fillEl) fillEl.style.width = `${pct}%`;
    if (timeEl) timeEl.textContent = _fmtMs(_progressPos);

    if (pct >= 100) clearInterval(_progressInterval);
  }, 500);
}

function updateSpotifyNavState(connected) {
  const connectBtn = document.querySelectorAll('[data-spotify-connect]');
  const statusEl   = document.querySelectorAll('[data-spotify-status]');

  connectBtn.forEach(btn => {
    btn.textContent   = connected ? '● AUDIO ON' : 'ENABLE AUDIO';
    btn.dataset.state = connected ? 'on' : 'off';
    btn.onclick       = connected ? spotifyDisconnect : spotifyLogin;
  });

  statusEl.forEach(el => {
    el.textContent = connected ? '● STREAMING ACTIVE' : 'AUDIO OFFLINE · ENABLE TO STREAM';
    el.style.color = connected ? '#1DB954' : 'var(--steel)';
  });

  // Show/hide the linked playlists section on radio page
  const plSection = document.getElementById('spotifyPlaylistsSection');
  if (plSection) {
    plSection.style.display = connected ? 'block' : 'none';
    if (connected) renderSpotifyPlaylists('spotifyPlaylistsMount');
  }
}

/* ─────────────────────────────────────────────────────────────────
   TRACK CARD WIRING
   Automatically enhances track cards that have a spotify URL/URI
───────────────────────────────────────────────────────────────── */

function wireSpotifyTrackCards() {
  document.querySelectorAll('[data-spotify], .track-card[data-spotify-url]').forEach(card => {
    const spotifyUrl = card.dataset.spotify || card.dataset.spotifyUrl;
    if (!spotifyUrl) return;

    const playBtn = card.querySelector('.track-play-circle, .track-card-play');
    if (!playBtn) return;

    // Replace default click with Spotify playback
    playBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (!spotifyIsConnected()) {
        showToast('CONNECTING TO SPOTIFY...', 'info');
        spotifyLogin();
        return;
      }

      // Visual: mark as playing
      document.querySelectorAll('.track-card.sp-playing').forEach(c => c.classList.remove('sp-playing'));
      card.classList.add('sp-playing');

      await spotifyPlay(spotifyUrl);
    });

    // Add Spotify badge
    if (!card.querySelector('.sp-badge')) {
      const badge = document.createElement('div');
      badge.className = 'sp-badge';
      badge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="#1DB954"><circle cx="12" cy="12" r="12" fill="#1DB954"/><path fill="#000" d="M17.9 10.9C14.7 9 9.35 8.8 6.3 9.75c-.5.15-1-.15-1.15-.6-.15-.5.15-1 .6-1.15 3.55-1.05 9.4-.85 13.1 1.35.45.25.6.85.35 1.3-.25.35-.85.5-1.3.25zm-.1 2.8c-.25.4-.75.5-1.15.25-2.65-1.65-6.7-2.1-9.85-1.15-.4.1-.85-.1-.95-.5-.1-.4.1-.85.5-.95 3.6-1.1 8.05-.55 11.1 1.35.4.2.5.75.25 1.15zm-1.25 2.75c-.2.3-.6.4-.9.2-2.3-1.4-5.2-1.7-8.6-.95-.35.1-.65-.15-.75-.45-.1-.35.15-.65.45-.75 3.75-.85 6.95-.5 9.5 1.1.3.15.4.55.2.85z"/></svg>`;
      badge.style.cssText = 'position:absolute;bottom:6px;right:6px;opacity:0.8;';
      card.querySelector('.track-card-art')?.appendChild(badge);
    }
  });
}

/* ─────────────────────────────────────────────────────────────────
   RADIO PAGE INTEGRATION
   Call this on radio.html to enable full radio queue playback
───────────────────────────────────────────────────────────────── */

async function initRadioSpotify() {
  const token = spotifyGetToken();
  if (!token) return; // Not connected yet

  await initSpotifyPlayer(token);

  // Wire the main play/pause button
  const mainPlayBtn = document.querySelector('[data-player-play], .player-btn-play');
  if (mainPlayBtn) {
    mainPlayBtn.addEventListener('click', () => spotifyToggle());
  }

  const nextBtn = document.querySelector('[data-player-next], .player-btn-next');
  const prevBtn = document.querySelector('[data-player-prev], .player-btn-prev');
  if (nextBtn) nextBtn.addEventListener('click', spotifyNextTrack);
  if (prevBtn) prevBtn.addEventListener('click', spotifyPrevTrack);

  // Wire volume slider
  const volSlider = document.querySelector('.player-vol-slider, [data-volume]');
  if (volSlider) {
    volSlider.addEventListener('input', () => spotifySetVolume(parseInt(volSlider.value, 10)));
  }

  // Wire seek bar
  const seekBar = document.querySelector('.player-progress-bar, [data-seek-bar]');
  if (seekBar) {
    seekBar.addEventListener('click', (e) => {
      const pct = e.offsetX / seekBar.offsetWidth;
      if (_progressDur) spotifySeek(Math.round(pct * _progressDur));
    });
  }

  // Wire all track cards on this page
  wireSpotifyTrackCards();

  // Poll current state to sync UI on load
  const state = await spotifyGetCurrentState();
  if (state?.item) {
    updatePlayerUI({
      track_window: { current_track: state.item },
      paused: !state.is_playing,
      position: state.progress_ms,
      duration: state.item.duration_ms,
    });
  }
}

/* ─────────────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────────────── */

function _toSpotifyUri(input) {
  if (!input) return null;
  // Already a URI
  if (input.startsWith('spotify:')) return input;
  // Extract from URL like https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC
  const match = input.match(/spotify\.com\/(track|album|playlist|artist)\/([A-Za-z0-9]+)/);
  if (match) return `spotify:${match[1]}:${match[2]}`;
  return null;
}

function _fmtMs(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/* ─────────────────────────────────────────────────────────────────
   LINKED ACCOUNT — USER PLAYLISTS
   Fetches the connected user's Spotify playlists and renders them
   inside 0 District's own UI. The platform stays the product;
   Spotify is purely the audio delivery layer underneath.
───────────────────────────────────────────────────────────────── */

async function spotifyGetUserPlaylists(limit = 20) {
  const token = spotifyGetToken();
  if (!token) return [];
  try {
    const res  = await fetch(`https://api.spotify.com/v1/me/playlists?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch { return []; }
}

async function spotifyGetPlaylistTracks(playlistId, limit = 50) {
  const token = spotifyGetToken();
  if (!token) return [];
  try {
    const res  = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&fields=items(track(name,artists,uri,duration_ms,album(images)))`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map(i => i.track).filter(Boolean);
  } catch { return []; }
}

async function spotifyGetLikedSongsCount() {
  const token = spotifyGetToken();
  if (!token) return 0;
  try {
    const res = await fetch('https://api.spotify.com/v1/me/tracks?limit=1', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.total || 0;
  } catch { return 0; }
}

async function spotifyGetLikedSongs(limit = 50) {
  const token = spotifyGetToken();
  if (!token) return [];
  try {
    const res = await fetch(`https://api.spotify.com/v1/me/tracks?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return (data.items || []).map(i => i.track).filter(Boolean);
  } catch { return []; }
}

async function renderSpotifyPlaylists(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  mount.innerHTML = '<p style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;letter-spacing:0.15em;color:var(--steel);text-transform:uppercase;">LOADING YOUR PLAYLISTS...</p>';

  const [playlists, likedCount] = await Promise.all([
    spotifyGetUserPlaylists(24),
    spotifyGetLikedSongsCount(),
  ]);

  if (!playlists.length && !likedCount) {
    mount.innerHTML = '<p style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;letter-spacing:0.12em;color:var(--steel);text-transform:uppercase;">NO PLAYLISTS FOUND ON LINKED ACCOUNT.</p>';
    return;
  }

  // Liked Songs card first
  const likedCard = likedCount ? `
    <div class="sp-pl-card" onclick="openLinkedLikedSongs()">
      <div class="sp-pl-art" style="background:linear-gradient(135deg,#450af5,#c4efd9);">
        <div class="sp-pl-overlay">
          <button class="sp-pl-play-btn" title="Play Liked Songs in 0 District Radio">
            <svg width="10" height="12" viewBox="0 0 10 12"><polygon points="0,0 10,6 0,12" fill="currentColor"/></svg>
          </button>
        </div>
        <svg style="position:absolute;bottom:10px;left:10px;" width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      </div>
      <div class="sp-pl-info">
        <p class="sp-pl-name">LIKED SONGS</p>
        <p class="sp-pl-meta">${likedCount} TRACKS</p>
      </div>
    </div>` : '';

  mount.innerHTML = likedCard + playlists.map(pl => {
    const img    = pl.images?.[0]?.url || '';
    const count  = pl.tracks?.total || 0;
    const owner  = pl.owner?.display_name || '';
    return `
      <div class="sp-pl-card" onclick="openLinkedPlaylist('${pl.id}','${_esc(pl.name)}')">
        <div class="sp-pl-art" style="${img ? `background-image:url(${img});background-size:cover;background-position:center;` : 'background:var(--bg2);'}">
          ${!img ? `<span class="sp-pl-mono">${pl.name.slice(0,2).toUpperCase()}</span>` : ''}
          <div class="sp-pl-overlay">
            <button class="sp-pl-play-btn" title="Play in 0 District Radio">
              <svg width="10" height="12" viewBox="0 0 10 12"><polygon points="0,0 10,6 0,12" fill="currentColor"/></svg>
            </button>
          </div>
        </div>
        <div class="sp-pl-info">
          <p class="sp-pl-name">${_esc(pl.name)}</p>
          <p class="sp-pl-meta">${count} TRACKS${owner ? ' · ' + owner.toUpperCase() : ''}</p>
        </div>
      </div>`;
  }).join('');
}

/* Open a linked Spotify playlist into 0 District's radio queue */
async function openLinkedPlaylist(playlistId, playlistName) {
  const token = spotifyGetToken();
  if (!token) { spotifyLogin(); return; }

  if (typeof showToast === 'function') showToast('LOADING ' + playlistName.toUpperCase() + '...', 'info');

  const tracks = await spotifyGetPlaylistTracks(playlistId);
  if (!tracks.length) {
    if (typeof showToast === 'function') showToast('NO PLAYABLE TRACKS IN THIS PLAYLIST', 'info');
    return;
  }

  // Merge into RADIO_TRACKS at position 0 so queue rebuilds immediately
  if (typeof RADIO_TRACKS !== 'undefined' && typeof _rebuildQueueUI === 'function') {
    const mapped = tracks.map(t => ({
      title:   t.name,
      artist:  (t.artists || []).map(a => a.name).join(', '),
      meta:    t.artists?.[0]?.name || '',
      spotify: t.uri,
      art:     t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || null,
    }));
    RADIO_TRACKS = mapped;
    _rebuildQueueUI();

    // Update playlist-section heading
    const headEl = document.getElementById('spotifyPlaylistsActiveLabel');
    if (headEl) headEl.textContent = 'NOW QUEUED: ' + playlistName.toUpperCase();
  }

  // Play first track
  if (tracks[0]?.uri) {
    await spotifyPlay(tracks[0].uri);
    // Update hero display
    const t = tracks[0];
    const titleEl  = document.getElementById('track-title');
    const artistEl = document.getElementById('track-artist');
    if (titleEl)  titleEl.textContent  = t.name;
    if (artistEl) artistEl.textContent = (t.artists || []).map(a => a.name).join(', ');
  }

  if (typeof showToast === 'function') showToast(playlistName.toUpperCase() + ' QUEUED IN 0 DISTRICT RADIO', 'success');
}

/* Load Liked Songs into the 0 District queue */
async function openLinkedLikedSongs() {
  const token = spotifyGetToken();
  if (!token) { spotifyLogin(); return; }

  if (typeof showToast === 'function') showToast('LOADING YOUR LIKED SONGS...', 'info');

  const tracks = await spotifyGetLikedSongs(50);
  if (!tracks.length) {
    if (typeof showToast === 'function') showToast('NO LIKED SONGS FOUND', 'info');
    return;
  }

  if (typeof RADIO_TRACKS !== 'undefined' && typeof _rebuildQueueUI === 'function') {
    RADIO_TRACKS = tracks.map(t => ({
      title:   t.name,
      artist:  (t.artists || []).map(a => a.name).join(', '),
      meta:    t.artists?.[0]?.name || '',
      spotify: t.uri,
      art:     t.album?.images?.[1]?.url || null,
    }));
    _rebuildQueueUI();
    const headEl = document.getElementById('spotifyPlaylistsActiveLabel');
    if (headEl) headEl.textContent = 'NOW QUEUED: LIKED SONGS (' + tracks.length + ' TRACKS)';
  }

  if (tracks[0]?.uri) {
    await spotifyPlay(tracks[0].uri);
    const titleEl  = document.getElementById('track-title');
    const artistEl = document.getElementById('track-artist');
    if (titleEl)  titleEl.textContent  = tracks[0].name;
    if (artistEl) artistEl.textContent = (tracks[0].artists || []).map(a => a.name).join(', ');
  }

  if (typeof showToast === 'function') showToast('LIKED SONGS QUEUED IN 0 DISTRICT RADIO', 'success');
}

function _esc(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ─────────────────────────────────────────────────────────────────
   AUTO-INIT
───────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
  const token = spotifyGetToken();

  // Update nav state
  updateSpotifyNavState(!!token);

  // If already connected, init player
  if (token) {
    await initSpotifyPlayer(token);
    wireSpotifyTrackCards();

    // Radio page: full init + reveal linked playlists
    if (window.location.pathname.includes('radio')) {
      await initRadioSpotify();
      const plSection = document.getElementById('spotifyPlaylistsSection');
      if (plSection) {
        plSection.style.display = 'block';
        renderSpotifyPlaylists('spotifyPlaylistsMount');
      }
    }
  }

  // Wire any "Connect Spotify" buttons on the page
  document.querySelectorAll('[data-spotify-connect]').forEach(btn => {
    btn.onclick = token ? spotifyDisconnect : spotifyLogin;
  });
});
