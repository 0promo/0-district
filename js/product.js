/* ═══════════════════════════════════════════════════════════════
   0 DISTRICT — PRODUCT ENGINE
   ═══════════════════════════════════════════════════════════════

   AUDIO MODEL:
   - Tracks curated from DSPs. No audio hosted on 0 District.
   - SoundCloud Widget API = primary playback (real SC streams)
   - YouTube iFrame API   = fallback playback (real YT views)
   - Spotify / Apple / Tidal = "Also on" links (drives those streams)
   ═══════════════════════════════════════════════════════════════ */

/* ── TRACK CATALOGUE — loaded dynamically from Supabase live tracks ── */
var TRACKS = [];  // populated by _loadPublicTracks() on DOMContentLoaded

var DSP_META = {
  soundcloud:{ label:'SoundCloud',  colour:'#ff5500', icon:'<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M11.56 8.87V17h8.76c1.49 0 2.68-1.2 2.68-2.68 0-1.37-1.03-2.5-2.36-2.65a4.011 4.011 0 00-3.36-5.18 4.019 4.019 0 00-4.23 2.73c-.17-.03-.33-.05-.49-.35z"/><path d="M0 15.32c0 .93.76 1.68 1.68 1.68.93 0 1.68-.75 1.68-1.68v-1.36c0-.93-.75-1.68-1.68-1.68C.76 12.28 0 13.03 0 15.96v-.64z"/></svg>' },
  youtube:   { label:'YouTube',     colour:'#ff0000', icon:'<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 002.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>' },
  spotify:   { label:'Spotify',     colour:'#1db954', icon:'<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14C9.6 9.9 15 10.56 18.72 12.84c.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38C8.94 5.76 15.96 6 20.58 8.58c.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z"/></svg>' },
  apple:     { label:'Apple Music', colour:'#fc3c44', icon:'<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043A5.022 5.022 0 0019.7.165C19.234.1 18.763.065 18.29.048 17.834.019 17.378 0 16.92 0H7.079C6.62 0 6.164.019 5.708.048 5.236.065 4.764.1 4.3.165 3.502.29 2.845.584 2.246 1.05 1.647 1.515 1.186 2.11.89 2.808c-.175.422-.27.86-.32 1.308C.513 4.47.5 4.83.5 5.195v13.61c0 .366.013.73.07 1.09.05.447.145.885.32 1.308.298.697.758 1.292 1.357 1.758.599.465 1.256.76 2.053.885.464.065.935.1 1.407.118.457.029.913.048 1.37.048h9.842c.457 0 .913-.019 1.37-.048.472-.019.942-.053 1.407-.118.797-.125 1.454-.42 2.053-.885.6-.466 1.06-1.061 1.357-1.758.175-.423.27-.861.32-1.308.058-.36.07-.724.07-1.09V5.195c-.001-.365-.013-.73-.07-1.07z"/></svg>' },
  tidal:     { label:'Tidal',       colour:'#00ffff', icon:'<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M12 3.996L8 7.996 4 3.996 0 7.996l4 4 4-4 4 4 4-4zM8 16.004l4-4 4 4 4-4-4-4-4 4-4-4-4 4z"/></svg>' },
};

/* ── PLAYER STATE ─────────────────────────────────────────────────────────── */
var player = {
  currentIdx: 0, currentTrack: null, playing: false, progress: 0,
  elapsed: 0, total: 0, duration: '--:--',
  shuffle: false, loop: false, muted: false, volume: 80, liked: {},
  scWidget: null, ytPlayer: null, activeEngine: null,
};

/* ── SPOTIFY ENGINE STATE ─────────────────────────────────────────────────── */
var _spotifyController  = null;
var _spotifyReady       = false;
var _spotifyPendingLoad = null; // { uri, play } queued until API ready

/* Called by the Spotify embed script once loaded */
window.onSpotifyIframeApiReady = function(IFrameAPI) {
  window._SpotifyIFrameAPI = IFrameAPI;
  var cont = _ensureDSP();
  var el = document.getElementById('spotify-embed-el');
  if (!el) {
    el = document.createElement('div');
    el.id = 'spotify-embed-el';
    cont.appendChild(el);
  }
  var initUri = (_spotifyPendingLoad && _spotifyPendingLoad.uri) || 'spotify:track:0';
  IFrameAPI.createController(el, { uri: initUri }, function(ctrl) {
    _spotifyController = ctrl;
    _spotifyReady = true;

    ctrl.addListener('playback_update', function(e) {
      if (player.activeEngine !== 'spotify') return;
      var d = e.data;
      if (!d) return;
      player.elapsed  = Math.round((d.position || 0) / 1000);
      player.total    = Math.round((d.duration  || 0) / 1000);
      player.progress = player.total > 0 ? (player.elapsed / player.total) * 100 : 0;
      if (player.total > 0) {
        var te = document.getElementById('playerTimeTotal');
        if (te) te.textContent = _fmt(player.total);
      }
      _syncProgress();
      if (!d.isPaused && !player.playing) { player.playing = true;  _syncPlayBtn(true);  }
      if ( d.isPaused &&  player.playing) { player.playing = false; _syncPlayBtn(false); }
      if (d.position > 0 && d.duration > 0 && d.position >= d.duration - 800) {
        player.loop ? ctrl.seek(0) : playerNext();
      }
    });

    if (_spotifyPendingLoad) {
      var p = _spotifyPendingLoad; _spotifyPendingLoad = null;
      ctrl.loadUri(p.uri);
      if (p.play) setTimeout(function() { ctrl.resume(); }, 800);
    }
  });
};

/* ── DSP CONTAINER ────────────────────────────────────────────────────────── */
function _ensureDSP() {
  var el = document.getElementById('dsp-embed-container');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'dsp-embed-container';
  el.style.cssText = 'position:fixed;bottom:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;z-index:-1;';
  document.body.appendChild(el);
  return el;
}

/* ── SOUNDCLOUD ENGINE ────────────────────────────────────────────────────── */
function _scLoad(url, play) {
  var cont  = _ensureDSP();
  var frame = document.getElementById('sc-iframe');
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = 'sc-iframe';
    frame.setAttribute('width', '1');
    frame.setAttribute('height', '1');
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('frameborder', 'no');
    frame.setAttribute('allow', 'autoplay');
    cont.appendChild(frame);
  }
  frame.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url)
    + '&auto_play=' + (play ? 'true' : 'false')
    + '&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false';
  player.activeEngine = 'soundcloud';

  _waitFor(function() { return typeof SC !== 'undefined' && SC.Widget; }, function() {
    if (player.scWidget) {
      try { player.scWidget.unbind(SC.Widget.Events.READY); } catch(e){}
    }
    player.scWidget = SC.Widget(frame);
    player.scWidget.bind(SC.Widget.Events.READY, function() {
      if (play) { player.scWidget.play(); player.playing = true; _syncPlayBtn(true); }
      player.scWidget.getDuration(function(ms) {
        player.total = Math.round(ms / 1000);
        player.duration = _fmt(player.total);
        var el = document.getElementById('playerTimeTotal');
        if (el) el.textContent = player.duration;
      });
    });
    player.scWidget.bind(SC.Widget.Events.PLAY_PROGRESS, function(e) {
      if (!e) return;
      player.elapsed  = Math.round((e.currentPosition || 0) / 1000);
      player.progress = player.total > 0 ? (player.elapsed / player.total) * 100 : 0;
      _syncProgress();
    });
    player.scWidget.bind(SC.Widget.Events.PLAY,   function() { player.playing = true;  _syncPlayBtn(true);  });
    player.scWidget.bind(SC.Widget.Events.PAUSE,  function() { player.playing = false; _syncPlayBtn(false); });
    player.scWidget.bind(SC.Widget.Events.FINISH, function() { player.loop ? player.scWidget.seekTo(0) && player.scWidget.play() : playerNext(); });
  });
}

/* ── YOUTUBE ENGINE ───────────────────────────────────────────────────────── */
function _ytId(url) {
  var m = (url || '').match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

var _ytPoll = null;

function _ytLoad(url, play) {
  var vid = _ytId(url);
  if (!vid) return;
  var cont  = _ensureDSP();
  var frame = document.getElementById('yt-iframe');
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = 'yt-iframe';
    frame.setAttribute('width', '1');
    frame.setAttribute('height', '1');
    frame.setAttribute('frameborder', '0');
    cont.appendChild(frame);
  }
  frame.src = 'https://www.youtube.com/embed/' + vid
    + '?enablejsapi=1&autoplay=' + (play ? '1' : '0')
    + '&controls=0&rel=0&playsinline=1&origin=' + encodeURIComponent(location.origin);
  player.activeEngine = 'youtube';

  _waitFor(function() { return typeof YT !== 'undefined' && YT.Player; }, function() {
    if (player.ytPlayer && player.ytPlayer.destroy) try { player.ytPlayer.destroy(); } catch(e){}
    player.ytPlayer = new YT.Player('yt-iframe', {
      events: {
        onReady: function(e) {
          player.total = e.target.getDuration() || 0;
          player.duration = _fmt(player.total);
          var el = document.getElementById('playerTimeTotal');
          if (el) el.textContent = player.duration;
          if (play) e.target.playVideo();
          if (_ytPoll) clearInterval(_ytPoll);
          _ytPoll = setInterval(function() {
            try {
              player.elapsed  = Math.round(player.ytPlayer.getCurrentTime());
              player.total    = Math.round(player.ytPlayer.getDuration()) || player.total;
              player.progress = player.total > 0 ? (player.elapsed / player.total) * 100 : 0;
              _syncProgress();
            } catch(e2){}
          }, 1000);
        },
        onStateChange: function(e) {
          if (e.data === YT.PlayerState.PLAYING)        { player.playing = true;  _syncPlayBtn(true);  }
          else if (e.data === YT.PlayerState.PAUSED)    { player.playing = false; _syncPlayBtn(false); }
          else if (e.data === YT.PlayerState.ENDED) {
            if (player.loop) { e.target.seekTo(0); e.target.playVideo(); } else playerNext();
          }
        },
      },
    });
  });
}

/* ── SPOTIFY ENGINE ───────────────────────────────────────────────────────── */
function _spotifyId(url) {
  var m = (url || '').match(/(?:track[\/:])([\w]+)/);
  return m ? m[1] : null;
}

function _spotifyLoad(url, play) {
  var id = _spotifyId(url);
  if (!id) return false;
  var uri = 'spotify:track:' + id;
  player.activeEngine = 'spotify';

  if (_spotifyReady && _spotifyController) {
    _spotifyController.loadUri(uri);
    if (play) setTimeout(function() { _spotifyController.resume(); }, 600);
  } else {
    _spotifyPendingLoad = { uri: uri, play: play };
    if (!document.getElementById('spotify-iframe-api')) {
      var s = document.createElement('script');
      s.id  = 'spotify-iframe-api';
      s.src = 'https://open.spotify.com/embed-podcast/iframe-api/v1';
      s.async = true;
      document.head.appendChild(s);
    }
  }
  return true;
}

function _waitFor(check, cb, tries) {
  tries = tries || 0;
  if (check()) { cb(); return; }
  if (tries > 60) return;
  setTimeout(function() { _waitFor(check, cb, tries + 1); }, 100);
}

/* ── PLAYER CORE ─────────────────────────────────────────────────────────── */
function playerLoad(idx, autoPlay) {
  if (idx < 0 || idx >= TRACKS.length) return;
  player.currentIdx   = idx;
  player.currentTrack = TRACKS[idx];
  var t = TRACKS[idx];

  // --- UI update ---
  var art = document.getElementById('playerArt');
  if (art) {
    art.className = 'player-art ' + t.art;
    art.innerHTML = '<span class="player-art-label">' + t.label + '</span>'
      + (t.badge ? '<span class="player-art-badge">' + t.badge + '</span>' : '');
  }
  _setText('playerTitle',  t.title);
  _setText('playerArtist', t.artist);
  _setText('playerGenre',  t.genre);
  _setText('playerCity',   t.city);

  var qn = document.getElementById('playerQueueNum');
  if (qn) qn.textContent = _pad(idx + 1) + ' / ' + _pad(TRACKS.length);

  player.progress = 0; player.elapsed = 0; player.total = 0;
  _syncProgress();
  _syncPlayBtn(false);
  _buildDSPLinks(t.streamingLinks);

  if (typeof lyricsRender === 'function') lyricsRender(t._id);
  _setText('lyricsHeaderTitle', t.title.toUpperCase() + ' — ' + t.artist.toUpperCase());

  // --- Highlight active cards ---
  document.querySelectorAll('[data-track-id]').forEach(function(el) {
    el.classList.toggle('track-card-active', el.dataset.trackId === t._id);
  });

  // --- Load DSP engine — Spotify first (drives real streams), then SC, then YT ---
  var lnk = t.streamingLinks || {};
  if (lnk.spotify && _spotifyLoad(lnk.spotify, autoPlay !== false)) {
    // Spotify engine loaded
  } else if (lnk.soundcloud) {
    _scLoad(lnk.soundcloud, autoPlay !== false);
  } else if (lnk.youtube) {
    _ytLoad(lnk.youtube, autoPlay !== false);
  } else {
    showToast('No playable link for this track yet', 'info');
  }
}

function playerPlay() {
  if (player.activeEngine === 'spotify' && _spotifyController) {
    _spotifyController.resume();
  } else if (player.activeEngine === 'soundcloud' && player.scWidget) {
    player.scWidget.play();
  } else if (player.activeEngine === 'youtube' && player.ytPlayer) {
    player.ytPlayer.playVideo();
  } else {
    playerLoad(player.currentIdx, true); return;
  }
  player.playing = true; _syncPlayBtn(true);
}

function playerPause() {
  if (player.activeEngine === 'spotify' && _spotifyController) _spotifyController.pause();
  else if (player.activeEngine === 'soundcloud' && player.scWidget) player.scWidget.pause();
  else if (player.activeEngine === 'youtube' && player.ytPlayer) player.ytPlayer.pauseVideo();
  player.playing = false; _syncPlayBtn(false);
}

function playerToggle() { player.playing ? playerPause() : playerPlay(); }

function playerNext() {
  playerLoad(player.shuffle ? Math.floor(Math.random() * TRACKS.length) : (player.currentIdx + 1) % TRACKS.length, true);
}

function playerPrev() {
  if (player.elapsed > 3) {
    if (player.activeEngine === 'soundcloud' && player.scWidget) player.scWidget.seekTo(0);
    else if (player.activeEngine === 'youtube' && player.ytPlayer) player.ytPlayer.seekTo(0);
    return;
  }
  playerLoad((player.currentIdx - 1 + TRACKS.length) % TRACKS.length, true);
}

function playerSeek(pct) {
  var secs = (pct / 100) * player.total;
  if (player.activeEngine === 'spotify' && _spotifyController) _spotifyController.seek(secs * 1000);
  else if (player.activeEngine === 'soundcloud' && player.scWidget) player.scWidget.seekTo(secs * 1000);
  else if (player.activeEngine === 'youtube' && player.ytPlayer) player.ytPlayer.seekTo(secs, true);
}

function playerShuf(btn) { player.shuffle = !player.shuffle; if (btn) btn.classList.toggle('active', player.shuffle); }
function playerLoop(btn) { player.loop    = !player.loop;    if (btn) btn.classList.toggle('active', player.loop);    }

function playerLike() {
  var id = player.currentTrack ? player.currentTrack._id : null;
  if (!id) return;
  player.liked[id] = !player.liked[id];
  var btn = document.getElementById('playerLikeBtn');
  if (btn) btn.classList.toggle('active', player.liked[id]);
  showToast(player.liked[id] ? 'Saved to your library' : 'Removed from library', player.liked[id] ? 'success' : 'info');
}

function playerMute() {
  player.muted = !player.muted;
  var v = player.muted ? 0 : player.volume;
  if (player.activeEngine === 'spotify') { /* Spotify embed doesn't expose volume API */ }
  else if (player.activeEngine === 'soundcloud' && player.scWidget) player.scWidget.setVolume(v);
  else if (player.activeEngine === 'youtube' && player.ytPlayer) {
    if (player.muted) player.ytPlayer.mute(); else player.ytPlayer.unMute();
  }
  var btn = document.getElementById('playerMuteBtn');
  if (!btn) return;
  btn.innerHTML = player.muted
    ? '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 3.5L6 7H3v6h3l4 3.5V3.5z" fill="currentColor"/><line x1="14" y1="9" x2="19" y2="14"/><line x1="19" y1="9" x2="14" y2="14"/></svg>'
    : '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 3.5L6 7H3v6h3l4 3.5V3.5z" fill="currentColor"/><path d="M13 8a3 3 0 010 4M15.5 5.5a7 7 0 010 9" stroke-linecap="round"/></svg>';
}

/* ── DSP LINKS PANEL ─────────────────────────────────────────────────────── */
function _buildDSPLinks(links) {
  var wrap = document.getElementById('playerDSPLinks');
  if (!wrap) return;
  wrap.innerHTML = '';
  ['soundcloud','youtube','spotify','apple','tidal'].forEach(function(key) {
    if (!links || !links[key]) return;
    var m = DSP_META[key];
    if (!m) return;
    var a = document.createElement('a');
    a.href      = links[key];
    a.target    = '_blank';
    a.rel       = 'noopener noreferrer';
    a.className = 'dsp-link dsp-link-' + key;
    var isActive = (key === player.activeEngine);
    a.title     = isActive ? 'Streaming via ' + m.label : 'Also on ' + m.label;
    a.innerHTML = m.icon + '<span>' + m.label + '</span>';
    if (isActive) a.classList.add('dsp-link-active'); // highlight the active engine
    a.addEventListener('click', function(e) {
      if (key !== 'soundcloud' && key !== 'youtube') return; // these open in new tab
      // For SC/YT: we're already playing, just log the click
      e.preventDefault();
    });
    wrap.appendChild(a);
  });
}

/* ── PROGRESS ────────────────────────────────────────────────────────────── */
function _syncProgress() {
  var p = player.progress;
  var s  = document.getElementById('progressStrip');        if (s)  s.style.width  = p + '%';
  var b  = document.getElementById('playerProgressBar');    if (b)  b.style.width  = p + '%';
  var h  = document.getElementById('playerProgressHandle'); if (h)  h.style.left   = p + '%';
  var c  = document.getElementById('playerTimeCur');        if (c)  c.textContent  = _fmt(player.elapsed);
  var _ct = player.currentTrack;
  if (typeof lyricsSync === 'function' && _ct) lyricsSync(player.elapsed, _ct._id);
}

function _syncPlayBtn(playing) {
  var btn = document.getElementById('playerPlayBtn');
  if (!btn) return;
  btn.innerHTML = playing
    ? '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><polygon points="5,3 19,12 5,21"/></svg>';
}

/* ── PROGRESS BAR SEEK ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  var wrap = document.getElementById('playerProgressWrap');
  if (!wrap) return;
  var drag = false;
  function seek(e) {
    var r = wrap.getBoundingClientRect();
    playerSeek(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
  }
  wrap.addEventListener('mousedown',  function(e) { drag = true; seek(e); });
  document.addEventListener('mousemove',  function(e) { if (drag) seek(e); });
  document.addEventListener('mouseup',    function()  { drag = false; });
  wrap.addEventListener('touchstart', function(e) { seek(e.touches[0]); }, {passive:true});
  wrap.addEventListener('touchmove',  function(e) { seek(e.touches[0]); }, {passive:true});
});

/* ── KEYBOARD ────────────────────────────────────────────────────────────── */
function initKeyboard() {
  document.addEventListener('keydown', function(e) {
    var tag = (document.activeElement || {}).tagName || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === ' ')          { e.preventDefault(); playerToggle(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); playerSeek(Math.min(100, player.progress + (10 / (player.total||1)) * 100)); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); playerSeek(Math.max(0,   player.progress - (10 / (player.total||1)) * 100)); }
    else if (e.key === 'n' || e.key === 'N') playerNext();
  });
}

/* ── TRACK CARD CLICK ────────────────────────────────────────────────────── */
function playTrackById(id) {
  var idx = TRACKS.findIndex(function(t) { return t._id === id; });
  if (idx >= 0) playerLoad(idx, true);
}

/* ── TOAST ───────────────────────────────────────────────────────────────── */
function showToast(msg, type) {
  var old = document.querySelector('.toast');
  if (old) old.remove();
  var t = document.createElement('div');
  t.className = 'toast toast-' + (type || 'info');
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(function() { t.classList.add('show'); });
  setTimeout(function() { t.classList.remove('show'); setTimeout(function() { t.remove(); }, 300); }, 2800);
}

/* ── PUBLIC TRACK LOADER — fetches live tracks from Supabase ─────────────── */
var _ART_CLASSES = ['art-red','art-blue','art-purple','art-green','art-amber','art-teal','art-mono'];

function _mapDbTrack(r, idx) {
  var parts = (r.artist_name || 'ZD').trim().split(/\s+/);
  var label = (parts[0][0] + (parts[1] ? parts[1][0] : (parts[0][1] || ''))).toUpperCase();
  return {
    _id:           r.id,
    title:         (r.title        || 'UNTITLED').toUpperCase(),
    artist:        (r.artist_name  || '0 DISTRICT').toUpperCase(),
    city:          '',
    art:           _ART_CLASSES[idx % _ART_CLASSES.length],
    label:         label,
    badge:         r.status === 'live' ? 'LIVE' : 'SINGLE',
    genre:         (r.genre || '').toUpperCase(),
    streamingLinks:{
      spotify:    r.spotify    || '',
      soundcloud: r.soundcloud || '',
      youtube:    r.youtube    || '',
    },
  };
}

function _loadPublicTracks() {
  // Requires RLS policy: CREATE POLICY "tracks_public_live" ON tracks FOR SELECT USING (status = 'live');
  fetch('https://awmvfkekwrjcrfllcepl.supabase.co/rest/v1/tracks?status=eq.live&order=created_at.asc&select=id,title,artist_name,genre,spotify,soundcloud,youtube,status', {
    headers: { 'apikey': _SKEY }
  })
  .then(function(r) { return r.json(); })
  .then(function(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return;
    TRACKS = rows.map(_mapDbTrack);
    playerLoad(0, false); // prime player with first live track (no autoplay)
    // Update track cards on the page if any exist
    document.querySelectorAll('[data-track-id]').forEach(function(el) {
      var match = TRACKS.find(function(t) { return t._id === el.dataset.trackId; });
      if (match) el.classList.remove('track-card-loading');
    });
  })
  .catch(function(err) {
    console.info('[0 District] Public tracks not yet available:', err && err.message);
  });
}

/* ── SUPABASE AUTH ────────────────────────────────────────────────────────── */
var _SURL = 'https://awmvfkekwrjcrfllcepl.supabase.co/auth/v1';
var _SKEY = 'sb_publishable_Gpr3sOBF49RxB6xWUwO_PA_I7vk9enI';

var DistrictAuth = {
  _h: function(tok) {
    var h = { 'apikey': _SKEY, 'Content-Type': 'application/json' };
    if (tok) h['Authorization'] = 'Bearer ' + tok;
    return h;
  },
  _post: function(path, body, tok) {
    return fetch(_SURL + path, { method: 'POST', headers: DistrictAuth._h(tok), body: JSON.stringify(body) })
      .then(function(r) {
        return r.json().then(function(d) {
          if (!r.ok) throw new Error(d.error_description || d.msg || d.message || d.error || 'Request failed');
          return d;
        });
      });
  },
  _saveSession: function(d) {
    var tok = d.access_token || (d.session && d.session.access_token);
    var rtok = d.refresh_token || (d.session && d.session.refresh_token);
    var exp = d.expires_in || (d.session && d.session.expires_in) || 3600;
    if (tok) localStorage.setItem('_ds', JSON.stringify({ t: tok, rt: rtok, u: d.user, e: Date.now() + exp * 1000 }));
  },
  signUp: function(email, pass, name, role) {
    return DistrictAuth._post('/signup', {
      email: email, password: pass,
      data: { full_name: name || '', role: role || 'artist' }
    });
  },
  signIn: function(email, pass) {
    return DistrictAuth._post('/token?grant_type=password', { email: email, password: pass })
      .then(function(d) { DistrictAuth._saveSession(d); return d; });
  },
  signOut: function() {
    var s = DistrictAuth.session();
    var p = s ? fetch(_SURL + '/logout', { method: 'POST', headers: DistrictAuth._h(s.t) }) : Promise.resolve();
    return p.finally(function() { localStorage.removeItem('_ds'); window.location.href = 'index.html'; });
  },
  recover: function(email) {
    return DistrictAuth._post('/recover', { email: email });
  },
  session: function() {
    try { var s = JSON.parse(localStorage.getItem('_ds')); return (s && s.e > Date.now()) ? s : null; } catch(e) { return null; }
  },
  isLoggedIn: function() { return !!DistrictAuth.session(); },
  user: function() { var s = DistrictAuth.session(); return s ? s.u : null; },
  displayName: function() {
    var u = DistrictAuth.user();
    if (!u) return '';
    return (u.user_metadata && u.user_metadata.full_name) ? u.user_metadata.full_name.toUpperCase().split(' ')[0] : u.email.split('@')[0].toUpperCase();
  }
};

/* Handle auth redirect (email confirm / password reset token in URL hash) */
(function() {
  var hash = window.location.hash;
  if (!hash) return;
  var params = {};
  hash.replace('#', '').split('&').forEach(function(p) { var kv = p.split('='); params[kv[0]] = decodeURIComponent(kv[1] || ''); });
  if (params.access_token && params.type === 'signup') {
    localStorage.setItem('_ds', JSON.stringify({ t: params.access_token, rt: params.refresh_token || '', u: null, e: Date.now() + 3600 * 1000 }));
    history.replaceState(null, '', window.location.pathname);
    if (typeof showToast === 'function') showToast('Email confirmed — welcome to the District!', 'success');
    setTimeout(function() { window.location.href = 'control-room.html'; }, 1400);
  } else if (params.access_token && params.type === 'recovery') {
    localStorage.setItem('_ds_reset', params.access_token);
    history.replaceState(null, '', window.location.pathname + '#reset');
  }
})();

/* ── MODAL ───────────────────────────────────────────────────────────────── */
function openSignIn()  { var m = document.getElementById('signInModal'); if (m) { m.classList.add('open');    document.body.style.overflow = 'hidden'; } }
function closeSignIn() { var m = document.getElementById('signInModal'); if (m) { m.classList.remove('open'); document.body.style.overflow = '';       } }

function handleModalSubmit() {
  var modal = document.getElementById('signInModal');
  if (!modal) return;
  var activeTab = modal.querySelector('.modal-tab.active');
  var tabId = activeTab ? activeTab.dataset.tab : 'signin';

  if (tabId === 'register') {
    /* ── SIGN UP ── */
    var nameEl  = modal.querySelector('#panel-register input[type="text"]');
    var emailEl = modal.querySelector('#panel-register input[type="email"]');
    var passEl  = modal.querySelector('#panel-register input[type="password"]');
    var name    = nameEl  ? nameEl.value.trim()  : '';
    var email   = emailEl ? emailEl.value.trim() : '';
    var pass    = passEl  ? passEl.value         : '';
    if (!email || !email.includes('@')) {
      if (emailEl) { emailEl.style.borderColor = 'var(--red)'; setTimeout(function(){ emailEl.style.borderColor=''; }, 1200); }
      showToast('Enter a valid email address', 'error'); return;
    }
    if (!pass || pass.length < 8) {
      if (passEl) { passEl.style.borderColor = 'var(--red)'; setTimeout(function(){ passEl.style.borderColor=''; }, 1200); }
      showToast('Password must be at least 8 characters', 'error'); return;
    }
    // Read selected role from the role selector
    var roleBtn = modal.querySelector('#roleSelectRow .role-select-btn.active');
    var role    = roleBtn ? roleBtn.dataset.role : 'artist';
    var btn = modal.querySelector('#panel-register .btn-modal-submit');
    if (btn) { btn.textContent = 'CREATING...'; btn.disabled = true; }
    DistrictAuth.signUp(email, pass, name, role)
      .then(function(d) {
        if (btn) { btn.textContent = 'BECOME AN OPERATOR →'; btn.disabled = false; }
        DistrictAuth._saveSession(d);
        if (DistrictAuth.isLoggedIn()) {
          closeSignIn();
          showToast('Welcome to the District, Operator', 'success');
          setTimeout(function() { window.location.href = 'control-room.html'; }, 1200);
        } else {
          closeSignIn();
          showToast('Check your email to confirm your account — then sign in', 'success');
        }
      })
      .catch(function(err) {
        if (btn) { btn.textContent = 'BECOME AN OPERATOR →'; btn.disabled = false; }
        var msg = err.message || 'Sign up failed';
        if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) msg = 'Email already in use — sign in instead';
        showToast(msg, 'error');
      });

  } else {
    /* ── SIGN IN ── */
    var emailEl = modal.querySelector('#panel-signin input[type="email"]');
    var passEl  = modal.querySelector('#panel-signin input[type="password"]');
    var email   = emailEl ? emailEl.value.trim() : '';
    var pass    = passEl  ? passEl.value         : '';
    if (!email || !email.includes('@')) {
      if (emailEl) { emailEl.style.borderColor = 'var(--red)'; setTimeout(function(){ emailEl.style.borderColor=''; }, 1200); }
      showToast('Enter your email address', 'error'); return;
    }
    if (!pass) {
      if (passEl) { passEl.style.borderColor = 'var(--red)'; setTimeout(function(){ passEl.style.borderColor=''; }, 1200); }
      showToast('Enter your password', 'error'); return;
    }
    var btn = modal.querySelector('#panel-signin .btn-modal-submit');
    if (btn) { btn.textContent = 'SIGNING IN...'; btn.disabled = true; }
    DistrictAuth.signIn(email, pass)
      .then(function() {
        closeSignIn();
        showToast('Welcome back — entering your Control Room', 'success');
        setTimeout(function() { window.location.href = 'control-room.html'; }, 1200);
      })
      .catch(function(err) {
        if (btn) { btn.textContent = 'SIGN IN →'; btn.disabled = false; }
        var msg = err.message || 'Sign in failed';
        if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials') || msg.toLowerCase().includes('wrong')) msg = 'Incorrect email or password';
        if (msg.toLowerCase().includes('not confirmed')) msg = 'Please confirm your email first — check your inbox';
        showToast(msg, 'error');
      });
  }
}

/* ── ROLE SELECTOR (register panel) ─────────────────────────────────────── */
function selectRole(btn) {
  var row = btn.closest('.role-select-row') || btn.closest('#roleSelectRow');
  if (!row) return;
  row.querySelectorAll('.role-select-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
}

/* ── POST-LOGIN CONTROL ROOM SETUP ───────────────────────────────────────── */
function initControlRoom() {
  var u = DistrictAuth.user();
  if (!u) return;

  var role = (u.user_metadata && u.user_metadata.role) || 'artist';
  var name = DistrictAuth.displayName() || 'OPERATOR';

  // Update profile sidebar
  var avatarEl = document.getElementById('crAvatarText');
  var nameEl   = document.getElementById('crName');
  var roleEl   = document.getElementById('crRoleBadge');
  var emailEl  = document.getElementById('crEmail');
  if (avatarEl) avatarEl.textContent = name.slice(0, 2).toUpperCase();
  if (nameEl)   nameEl.textContent   = name;
  if (roleEl)   roleEl.textContent   = '0 DISTRICT · ' + role.toUpperCase() + ' OPERATOR';
  if (emailEl)  emailEl.textContent  = u.email || '';

  // Switch to the user's role tab automatically
  var roleTab = document.querySelector('.role-tab[onclick*="' + role + '"]');
  if (roleTab) roleTab.click();

  // Load data for the active role
  if (role === 'artist') {
    dbRenderTracks('panel-artist-music');
    dbRenderAnalytics('panel-artist-analytics');
    dbRenderCollabs('panel-artist-collabs');
    dbRenderNotifications('panel-artist-notifs');
  } else if (role === 'label') {
    dbRenderRoster('panel-label-roster');
    dbRenderReleases('panel-label-releases');
    dbRenderAnalytics('panel-label-analytics');
    dbRenderDeals('panel-label-deals');
  } else if (role === 'curator') {
    dbRenderEditorialQueue('panel-curator-queue');
    dbRenderFeaturedPicks('panel-curator-picks');
    dbRenderEssaySubmissions('panel-curator-submissions');
    dbRenderEssays('panel-curator-essays');
  }
}

function forgotPassword() {
  var emailEl = document.querySelector('#panel-signin input[type="email"]');
  var email   = emailEl ? emailEl.value.trim() : '';
  if (!email || !email.includes('@')) { showToast('Enter your email address above first', 'info'); return; }
  DistrictAuth.recover(email)
    .then(function() { showToast('Password reset sent — check your inbox', 'success'); })
    .catch(function()  { showToast('Could not send reset email. Try again.', 'error'); });
}

/* ── NAV SESSION STATE ───────────────────────────────────────────────────── */
function _initNavSession() {
  if (!DistrictAuth.isLoggedIn()) return;
  var name = DistrictAuth.displayName();
  /* Replace any "SIGN IN" / openSignIn buttons in nav with account link */
  document.querySelectorAll('.nav-action, [onclick*="openSignIn"]').forEach(function(el) {
    el.textContent = name + ' ↗';
    el.removeAttribute('onclick');
    el.addEventListener('click', function(e) { e.preventDefault(); window.location.href = 'control-room.html'; });
  });
  /* Show sign-out links if present */
  document.querySelectorAll('[data-signout]').forEach(function(el) {
    el.style.display = '';
    el.addEventListener('click', function(e) { e.preventDefault(); DistrictAuth.signOut(); });
  });
}
document.addEventListener('DOMContentLoaded', _initNavSession);

/* ── HELPERS ─────────────────────────────────────────────────────────────── */
function _fmt(s) { if (!s || isNaN(s)) return '0:00'; var m=Math.floor(s/60),sec=Math.floor(s%60); return m+':'+(sec<10?'0':'')+sec; }
function _pad(n) { return n < 10 ? '0'+n : ''+n; }
function _setText(id, v) { var el=document.getElementById(id); if (el) el.textContent = v; }

/* ── BROADCAST LOG ───────────────────────────────────────────────────────── */
var _bIdx = 0;
var _bLines = [
  { type:'TRACK',     actor:'KOFI MANU',        txt:'STREAM "ACCRA NIGHTS" →',         action:'PLAY'    },
  { type:'JOIN',      actor:'YEMI.K',            txt:'NEW MEMBER JOINED DISTRICT',       action:'FOLLOW'  },
  { type:'LIVE',      actor:'DJ SENEGAL',        txt:'GOING LIVE · DAKAR FREQ VOL.3',    action:'TUNE IN' },
  { type:'TRACK',     actor:'ZARA.B',            txt:'STREAM "LAGOS RITUAL" →',          action:'PLAY'    },
  { type:'COLLAB',    actor:'ECHO DELTA',        txt:'OPEN COLLAB · REMIX CHALLENGE',    action:'APPLY'   },
  { type:'CHALLENGE', actor:'0 DISTRICT',        txt:'NEW CHALLENGE · $500 PRIZE →',     action:'ENTER'   },
  { type:'PLAYLIST',  actor:'DISTRICT CURATOR',  txt:'NEW PLAYLIST · WEST AFRICA HEAT',  action:'LISTEN'  },
  { type:'JOIN',      actor:'OFO BEATS',         txt:'NEW ARTIST JOINED DISTRICT',       action:'FOLLOW'  },
];

function addBroadcastEntry() {
  var list = document.getElementById('broadcastList');
  if (!list) return;
  var e = _bLines[_bIdx++ % _bLines.length];
  var row = document.createElement('div');
  row.className = 'broadcast-row broadcast-row-new';
  row.innerHTML = '<span class="bcast-type bcast-' + e.type.toLowerCase() + '">' + e.type + '</span>'
    + '<span class="bcast-actor">' + e.actor + '</span>'
    + '<span class="bcast-text">' + e.txt + '</span>'
    + '<span class="bcast-action">' + e.action + ' →</span>';
  list.insertBefore(row, list.firstChild);
  setTimeout(function() { row.classList.remove('broadcast-row-new'); }, 50);
  var rows = list.querySelectorAll('.broadcast-row');
  if (rows.length > 8) rows[rows.length - 1].remove();
}

/* ── INIT ────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  // Inject SoundCloud Widget API
  if (!document.getElementById('sc-api')) {
    var sc = document.createElement('script'); sc.id = 'sc-api';
    sc.src = 'https://w.soundcloud.com/player/api.js';
    document.head.appendChild(sc);
  }
  // Inject YouTube iFrame API
  if (!document.getElementById('yt-api')) {
    var yt = document.createElement('script'); yt.id = 'yt-api';
    yt.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(yt);
  }

  initKeyboard();
  _loadPublicTracks(); // Fetch live tracks from Supabase, then prime player

  // Track card clicks
  document.querySelectorAll('[data-track-id]').forEach(function(card) {
    card.addEventListener('click', function() { playTrackById(card.dataset.trackId); });
  });

  // Volume slider
  var vb = document.getElementById('playerVolBar');
  if (vb) {
    vb.addEventListener('click', function(e) {
      var r = vb.getBoundingClientRect();
      player.volume = Math.round(((e.clientX - r.left) / r.width) * 100);
      if (!player.muted) {
        if (player.scWidget) player.scWidget.setVolume(player.volume);
        if (player.ytPlayer && player.ytPlayer.setVolume) player.ytPlayer.setVolume(player.volume);
      }
      var fill = document.getElementById('playerVolFill');
      if (fill) fill.style.width = player.volume + '%';
    });
  }

  addBroadcastEntry();
  setInterval(addBroadcastEntry, 12000);
});
