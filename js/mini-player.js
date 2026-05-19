/* ═══════════════════════════════════════════════════════════════
   0PROMORECORDS — FLOATING MINI PLAYER (v39)
   ═══════════════════════════════════════════════════════════════
   Single audio source: reuses #main-audio from product.js
   Shows on ALL non-radio pages, including the home page.
   Appears when music starts OR when navigating back with saved state.
   Draggable. ↗ FULL expands to radio.html.
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  /* Never run on the radio page — it IS the full player */
  if (window.location.pathname.indexOf('/radio') !== -1) return;

  var _mini      = null;   /* DOM: the mini player bar element */
  var _audio     = null;   /* Shared: #main-audio element from product.js */
  var _visible   = false;
  var _isDrag    = false;
  var _dragOX    = 0;
  var _dragOY    = 0;
  var _posLocked = false;  /* Prevent position reset while dragging */

  /* ── READ / WRITE SESSION STATE ────────────────────────────── */
  function _read() {
    try { return JSON.parse(sessionStorage.getItem('_0d_mini') || '{}'); } catch(e) { return {}; }
  }
  function _write(patch) {
    try {
      var s = _read();
      Object.keys(patch).forEach(function(k){ s[k] = patch[k]; });
      sessionStorage.setItem('_0d_mini', JSON.stringify(s));
    } catch(e) {}
  }

  /* ── TRACK CATALOGUE (same as spotify.js) ───────────────────── */
  var MINI_TRACKS = [
    { _id:'milla-letmeknow', title:'LET ME KNOW', artist:'MILLA', artUrl:'/assets/milla-i-and-i.jpg', audioUrl:'/assets/audio/milla-let-me-know.mp3' },
    { _id:'milla-healer',    title:'HEALER',       artist:'MILLA', artUrl:'/assets/milla-i-and-i.jpg', audioUrl:'/assets/audio/milla-healer.mp3' },
    { _id:'milla-addicted',  title:'ADDICTED',     artist:'MILLA', artUrl:'/assets/milla-i-and-i.jpg', audioUrl:'/assets/audio/milla-addicted.mp3' }
  ];

  /* ── CSS ─────────────────────────────────────────────────────── */
  function _injectCSS() {
    if (document.getElementById('_mp_css')) return;
    var s = document.createElement('style');
    s.id = '_mp_css';
    s.textContent = [
      /* Global: kill the bottom player bar on all non-radio pages */
      '#playerBar { display:none !important; }',

      '#miniPlayerBar {',
      '  position:fixed; bottom:20px; right:20px; z-index:9999;',
      '  width:288px;',
      '  background:rgba(10,10,10,0.96);',
      '  border:1px solid rgba(255,255,255,0.09);',
      '  box-shadow:0 12px 48px rgba(0,0,0,0.7),0 2px 8px rgba(214,40,40,0.12);',
      '  backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);',
      '  transform:translateY(calc(100% + 32px));',
      '  opacity:0;',
      '  transition:transform 0.42s cubic-bezier(.22,.68,0,1.2), opacity 0.3s ease;',
      '  will-change:transform,opacity;',
      '  user-select:none; -webkit-user-select:none;',
      '}',
      '#miniPlayerBar.mp-visible {',
      '  transform:translateY(0); opacity:1;',
      '}',
      '#miniPlayerBar.mp-hidden { display:none; }',

      /* Top red drag handle */
      '.mp-handle {',
      '  height:3px;',
      '  background:linear-gradient(90deg,#d62828,rgba(214,40,40,0.3));',
      '  cursor:grab; flex-shrink:0;',
      '}',
      '.mp-handle:active { cursor:grabbing; }',

      /* Art + info + controls row */
      '.mp-body {',
      '  display:flex; align-items:center; gap:10px;',
      '  padding:11px 13px;',
      '  position:relative;',
      '}',

      /* Album art square */
      '.mp-art {',
      '  width:44px; height:44px; flex-shrink:0; position:relative;',
      '  background:linear-gradient(135deg,#1a0303,#3d0b0b);',
      '  overflow:hidden;',
      '  background-size:cover; background-position:center;',
      '}',
      /* Animated bars overlay when playing */
      '.mp-art-bars {',
      '  position:absolute; inset:0; display:flex;',
      '  align-items:flex-end; justify-content:center;',
      '  gap:2px; padding:5px 6px;',
      '  background:rgba(0,0,0,0.48);',
      '  opacity:0; transition:opacity 0.25s;',
      '}',
      '#miniPlayerBar.mp-playing .mp-art-bars { opacity:1; }',
      '.mp-bar {',
      '  width:2px; background:#F5F5F5; border-radius:1px;',
      '  animation:mpbar 1s ease-in-out infinite alternate;',
      '}',
      '.mp-bar:nth-child(1){height:30%;animation-delay:0s}',
      '.mp-bar:nth-child(2){height:75%;animation-delay:.18s}',
      '.mp-bar:nth-child(3){height:50%;animation-delay:.36s}',
      '.mp-bar:nth-child(4){height:88%;animation-delay:.09s}',
      '.mp-bar:nth-child(5){height:40%;animation-delay:.27s}',
      '@keyframes mpbar{0%{transform:scaleY(0.35)}100%{transform:scaleY(1)}}',

      /* Track info */
      '.mp-info { flex:1; min-width:0; }',
      '.mp-title {',
      '  font-family:"Barlow Condensed",sans-serif; font-weight:700;',
      '  font-size:13px; text-transform:uppercase; color:#F5F5F5;',
      '  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;',
      '  letter-spacing:0.01em;',
      '}',
      '.mp-artist {',
      '  font-family:"IBM Plex Mono",monospace; font-size:8px;',
      '  letter-spacing:0.12em; text-transform:uppercase;',
      '  color:rgba(245,245,245,0.38); margin-top:2px;',
      '}',

      /* Controls */
      '.mp-btns { display:flex; align-items:center; gap:4px; }',
      '.mp-iconbtn {',
      '  background:transparent; border:none; padding:5px;',
      '  color:rgba(245,245,245,0.45); cursor:pointer;',
      '  display:flex; align-items:center; justify-content:center;',
      '  transition:color 0.15s;',
      '}',
      '.mp-iconbtn:hover { color:#F5F5F5; }',
      '.mp-playbtn {',
      '  background:transparent;',
      '  border:1.5px solid rgba(245,245,245,0.45);',
      '  color:#F5F5F5; width:30px; height:30px;',
      '  display:flex; align-items:center; justify-content:center;',
      '  cursor:pointer; transition:all 0.15s; padding:0;',
      '}',
      '.mp-playbtn:hover { background:#F5F5F5; color:#0a0a0a; border-color:#F5F5F5; }',

      /* Expand link */
      '.mp-expand {',
      '  font-family:"IBM Plex Mono",monospace; font-size:7px;',
      '  letter-spacing:0.14em; text-transform:uppercase;',
      '  color:rgba(214,40,40,0.75); background:transparent; border:none;',
      '  cursor:pointer; padding:4px 2px; transition:color 0.15s; white-space:nowrap;',
      '}',
      '.mp-expand:hover { color:#d62828; }',

      /* Close × */
      '.mp-close {',
      '  position:absolute; top:7px; right:10px;',
      '  background:transparent; border:none;',
      '  color:rgba(245,245,245,0.25); font-size:15px;',
      '  cursor:pointer; line-height:1; padding:0;',
      '  transition:color 0.15s;',
      '}',
      '.mp-close:hover { color:#F5F5F5; }',

      /* Progress bar */
      '.mp-prog {',
      '  height:2px; background:rgba(255,255,255,0.07); cursor:pointer;',
      '  position:relative; margin:0 0 1px;',
      '}',
      '.mp-prog-fill { height:100%; background:#d62828; width:0%; pointer-events:none; }',

      /* Times */
      '.mp-times {',
      '  font-family:"IBM Plex Mono",monospace; font-size:7px;',
      '  letter-spacing:0.08em; color:rgba(245,245,245,0.22);',
      '  display:flex; justify-content:space-between;',
      '  padding:0 13px 9px;',
      '}',

      /* Autoplay blocked nudge */
      '.mp-tap-nudge {',
      '  font-family:"IBM Plex Mono",monospace; font-size:8px;',
      '  letter-spacing:0.1em; color:rgba(214,40,40,0.7);',
      '  text-align:center; padding:0 13px 8px; text-transform:uppercase;',
      '  animation:blink 1.4s ease-in-out infinite;',
      '}',
      '@keyframes blink{0%,100%{opacity:1}50%{opacity:0.4}}',
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ── HTML ─────────────────────────────────────────────────────── */
  function _injectHTML() {
    if (document.getElementById('miniPlayerBar')) { _mini = document.getElementById('miniPlayerBar'); return; }
    var div = document.createElement('div');
    div.id  = 'miniPlayerBar';
    div.innerHTML = [
      '<div class="mp-handle" id="_mpHandle"></div>',
      '<button class="mp-close" id="_mpClose" aria-label="Close">×</button>',
      '<div class="mp-body">',
      '  <div class="mp-art" id="_mpArt">',
      '    <div class="mp-art-bars">',
      '      <div class="mp-bar"></div><div class="mp-bar"></div>',
      '      <div class="mp-bar"></div><div class="mp-bar"></div>',
      '      <div class="mp-bar"></div>',
      '    </div>',
      '  </div>',
      '  <div class="mp-info">',
      '    <div class="mp-title" id="_mpTitle">—</div>',
      '    <div class="mp-artist" id="_mpArtist">0PROMORECORDS</div>',
      '  </div>',
      '  <div class="mp-btns">',
      '    <button class="mp-iconbtn" id="_mpPrev" aria-label="Previous">',
      '      <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><path d="M3 2h2v12H3zm2 6l8 6V2z"/></svg>',
      '    </button>',
      '    <button class="mp-playbtn" id="_mpPlay" aria-label="Play/Pause">',
      '      <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" id="_mpPlayIcon"><path d="M4 2l12 6-12 6z"/></svg>',
      '    </button>',
      '    <button class="mp-iconbtn" id="_mpNext" aria-label="Next">',
      '      <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><path d="M11 2h2v12h-2zM3 2l8 6-8 6z"/></svg>',
      '    </button>',
      '    <button class="mp-expand" id="_mpExpand">↗ FULL</button>',
      '  </div>',
      '</div>',
      '<div class="mp-prog" id="_mpProg"><div class="mp-prog-fill" id="_mpFill"></div></div>',
      '<div class="mp-times"><span id="_mpCur">0:00</span><span id="_mpTot">0:00</span></div>',
    ].join('');
    document.body.appendChild(div);
    _mini = div;
  }

  /* ── FORMAT TIME ─────────────────────────────────────────────── */
  function _fmt(s) {
    if (!s || isNaN(s) || !isFinite(s)) return '0:00';
    var m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  /* ── UPDATE UI FROM AUDIO ─────────────────────────────────────── */
  function _syncUI() {
    if (!_audio) return;
    /* Progress */
    var dur = _audio.duration || 0;
    var ct  = _audio.currentTime || 0;
    var pct = dur > 0 ? (ct / dur) * 100 : 0;
    var fill = document.getElementById('_mpFill');
    var cur  = document.getElementById('_mpCur');
    var tot  = document.getElementById('_mpTot');
    if (fill) fill.style.width = pct + '%';
    if (cur)  cur.textContent  = _fmt(ct);
    if (tot)  tot.textContent  = _fmt(dur);
    /* Play icon */
    _setPlayState(!_audio.paused);
  }

  function _setPlayState(playing) {
    if (!_mini) return;
    _mini.classList.toggle('mp-playing', playing);
    var icon = document.getElementById('_mpPlayIcon');
    if (!icon) return;
    icon.innerHTML = playing
      ? '<path d="M3 2h4v12H3zm6 0h4v12H9z"/>'   /* pause bars */
      : '<path d="M4 2l12 6-12 6z"/>';             /* play triangle */
  }

  /* ── POPULATE FROM TRACK DATA ─────────────────────────────────── */
  function _populate(title, artist, artUrl) {
    var titleEl  = document.getElementById('_mpTitle');
    var artistEl = document.getElementById('_mpArtist');
    var artEl    = document.getElementById('_mpArt');
    if (titleEl)  titleEl.textContent  = title  || '—';
    if (artistEl) artistEl.textContent = artist || '0PROMORECORDS';
    if (artEl && artUrl) {
      /* Set background directly — works from cache without waiting for onload */
      artEl.style.backgroundImage    = 'url(' + artUrl + ')';
      artEl.style.backgroundSize     = 'cover';
      artEl.style.backgroundPosition = 'center';
      /* Verify image loads; clear on hard failure */
      var _verifyImg = new Image();
      _verifyImg.onerror = function() {
        artEl.style.backgroundImage = 'linear-gradient(135deg,#1a0303,#3d0b0b)';
      };
      _verifyImg.src = artUrl;
    }
  }

  /* ── SHOW MINI PLAYER ─────────────────────────────────────────── */
  function _show() {
    if (_visible || !_mini) return;
    _visible = true;
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        _mini.classList.remove('mp-hidden');
        _mini.classList.add('mp-visible');
      });
    });
  }

  /* ── AUDIO CONTROLS ───────────────────────────────────────────── */
  function _toggle() {
    if (!_audio) return;
    if (_audio.paused) {
      var p = _audio.play();
      if (p && p.catch) p.catch(function(e) {
        /* Autoplay blocked — show nudge */
        var nudge = document.getElementById('_mpNudge');
        if (!nudge) {
          nudge = document.createElement('div');
          nudge.id        = '_mpNudge';
          nudge.className = 'mp-tap-nudge';
          nudge.textContent = '↑ TAP TO LISTEN';
          if (_mini) _mini.insertBefore(nudge, _mini.querySelector('.mp-times'));
        }
        nudge.style.display = '';
      });
    } else {
      _audio.pause();
      var nudge2 = document.getElementById('_mpNudge');
      if (nudge2) nudge2.style.display = 'none';
    }
  }

  /* Jump to next/prev track in catalogue */
  function _jump(dir) {
    /* Try using product.js player if available */
    if (dir > 0 && typeof playerNext === 'function') { playerNext(); return; }
    if (dir < 0 && typeof playerPrev === 'function') { playerPrev(); return; }
    /* Fallback: manage MINI_TRACKS directly */
    var s   = _read();
    var idx = ((s.idx || 0) + dir + MINI_TRACKS.length) % MINI_TRACKS.length;
    var t   = MINI_TRACKS[idx];
    _write({ idx: idx, title: t.title, artist: t.artist, artUrl: t.artUrl, audioUrl: t.audioUrl, currentTime: 0 });
    _populate(t.title, t.artist, t.artUrl);
    if (_audio) {
      _audio.src = t.audioUrl;
      _audio.load();
      _audio.play().catch(function(){});
    }
  }

  /* ── DRAG ─────────────────────────────────────────────────────── */
  function _initDrag() {
    var handle = document.getElementById('_mpHandle');
    if (!handle || !_mini) return;
    handle.addEventListener('mousedown', function(e) {
      _isDrag    = true;
      _posLocked = true;
      var rect = _mini.getBoundingClientRect();
      _dragOX = e.clientX - rect.left;
      _dragOY = e.clientY - rect.top;
      _mini.style.transition = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
      if (!_isDrag || !_mini) return;
      var x = Math.max(0, Math.min(e.clientX - _dragOX, window.innerWidth  - _mini.offsetWidth));
      var y = Math.max(0, Math.min(e.clientY - _dragOY, window.innerHeight - _mini.offsetHeight));
      _mini.style.right  = 'auto';
      _mini.style.bottom = 'auto';
      _mini.style.left   = x + 'px';
      _mini.style.top    = y + 'px';
    });
    document.addEventListener('mouseup', function() {
      if (_isDrag) {
        _isDrag = false;
        if (_mini) _mini.style.transition = '';
        setTimeout(function() { _posLocked = false; }, 200);
      }
    });
    /* Touch drag */
    handle.addEventListener('touchstart', function(e) {
      var t = e.touches[0];
      _isDrag    = true;
      _posLocked = true;
      var rect = _mini.getBoundingClientRect();
      _dragOX = t.clientX - rect.left;
      _dragOY = t.clientY - rect.top;
      _mini.style.transition = 'none';
    }, {passive:true});
    document.addEventListener('touchmove', function(e) {
      if (!_isDrag || !_mini) return;
      var t = e.touches[0];
      var x = Math.max(0, Math.min(t.clientX - _dragOX, window.innerWidth  - _mini.offsetWidth));
      var y = Math.max(0, Math.min(t.clientY - _dragOY, window.innerHeight - _mini.offsetHeight));
      _mini.style.right = 'auto'; _mini.style.bottom = 'auto';
      _mini.style.left  = x + 'px'; _mini.style.top = y + 'px';
    }, {passive:true});
    document.addEventListener('touchend', function() {
      if (_isDrag) {
        _isDrag = false;
        if (_mini) _mini.style.transition = '';
        setTimeout(function() { _posLocked = false; }, 200);
      }
    });
  }

  /* ── SEEK ─────────────────────────────────────────────────────── */
  function _initSeek() {
    var bar = document.getElementById('_mpProg');
    if (!bar) return;
    bar.addEventListener('click', function(e) {
      if (!_audio || !_audio.duration) return;
      var r = bar.getBoundingClientRect();
      _audio.currentTime = ((e.clientX - r.left) / r.width) * _audio.duration;
    });
  }

  /* ── CLOSE ────────────────────────────────────────────────────── */
  function _initClose() {
    var btn = document.getElementById('_mpClose');
    if (!btn) return;
    btn.addEventListener('click', function() {
      if (_audio) _audio.pause();
      if (_mini) _mini.classList.add('mp-hidden');
      _visible = false;
      _write({ playing: false });
    });
  }

  /* ── WIRE BUTTONS ─────────────────────────────────────────────── */
  function _wireButtons() {
    var playBtn = document.getElementById('_mpPlay');
    var prevBtn = document.getElementById('_mpPrev');
    var nextBtn = document.getElementById('_mpNext');
    var expBtn  = document.getElementById('_mpExpand');
    if (playBtn) playBtn.addEventListener('click', _toggle);
    if (prevBtn) prevBtn.addEventListener('click', function(){ _jump(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function(){ _jump(1); });
    if (expBtn)  expBtn.addEventListener('click', function() {
      /* Save state before navigating */
      if (_audio) _write({ currentTime: _audio.currentTime, playing: !_audio.paused });
      window.location.href = '/radio';
    });
  }

  /* ── WIRE AUDIO EVENTS ────────────────────────────────────────── */
  function _wireAudio() {
    if (!_audio) return;

    _audio.addEventListener('timeupdate', _syncUI);

    _audio.addEventListener('play', function() {
      _setPlayState(true);
      _show();
      _write({ playing: true, currentTime: _audio.currentTime });
      var nudge = document.getElementById('_mpNudge');
      if (nudge) nudge.style.display = 'none';
    });

    _audio.addEventListener('pause', function() {
      _setPlayState(false);
      _write({ playing: false, currentTime: _audio.currentTime });
    });

    _audio.addEventListener('loadedmetadata', function() {
      var s   = _read();
      var tot = document.getElementById('_mpTot');
      if (tot) tot.textContent = _fmt(_audio.duration);
      /* Restore position when resuming from another page */
      if (s.currentTime && s.currentTime > 1 && Math.abs(_audio.currentTime - s.currentTime) > 2) {
        _audio.currentTime = s.currentTime;
      }
    });

    _audio.addEventListener('ended', function() {
      _jump(1);
    });

    /* Sync immediately if audio is already loaded */
    if (_audio.readyState >= 1) {
      var s = _read();
      var tot = document.getElementById('_mpTot');
      if (tot && _audio.duration) tot.textContent = _fmt(_audio.duration);
    }
  }

  /* ── LISTEN FOR playerLoad CALLS from product.js ──────────────── */
  /* product.js dispatches 'trackloaded' CustomEvent after loading a track */
  window.addEventListener('trackloaded', function(e) {
    if (!e || !e.detail) return;
    _populate(e.detail.title, e.detail.artist, e.detail.artUrl);
    _write({
      title:    e.detail.title,
      artist:   e.detail.artist,
      artUrl:   e.detail.artUrl  || '',
      audioUrl: e.detail.audioUrl || '',
      idx:      e.detail.idx || 0
    });
    _show();
  });

  /* ── BOOT ─────────────────────────────────────────────────────── */
  function _boot() {
    _injectCSS();
    _injectHTML();

    /* Get the shared audio element — product.js initialises it on DOMContentLoaded.
       Since both handlers fire in script-load order, product.js's runs first.
       If somehow it's not ready yet, a small retry handles it. */
    _audio = document.getElementById('main-audio');
    if (!_audio) {
      /* Fallback: brief retry in case product.js hasn't initialised yet */
      setTimeout(function() {
        _audio = document.getElementById('main-audio');
        _wireAudio();
      }, 80);
    } else {
      _wireAudio();
    }

    /* Restore saved state */
    var s = _read();

    if (s.title || (s.audioUrl && s.audioUrl.length > 4)) {
      _populate(s.title || '', s.artist || '', s.artUrl || '');

      /* If audio has no src yet, load from saved state */
      if (_audio && (!_audio.src || _audio.src === window.location.href) && s.audioUrl) {
        _audio.src = s.audioUrl;
        _audio.load();
      }

      _show();

      /* Auto-resume if was playing when user left the previous page */
      if (s.playing && _audio && _audio.src && _audio.src !== window.location.href) {
        setTimeout(function() {
          var p = _audio.play();
          if (p && p.catch) p.catch(function() {
            var nudge = document.getElementById('_mpNudge') || document.createElement('div');
            nudge.id        = '_mpNudge';
            nudge.className = 'mp-tap-nudge';
            nudge.textContent = '↑ TAP ▶ TO RESUME';
            if (_mini && !document.getElementById('_mpNudge')) {
              _mini.insertBefore(nudge, _mini.querySelector('.mp-times'));
            }
          });
        }, 500);
      }
    }

    _initDrag();
    _initSeek();
    _initClose();
    _wireButtons();

    /* Save state when navigating away */
    window.addEventListener('beforeunload', function() {
      if (_audio) _write({ currentTime: _audio.currentTime, playing: !_audio.paused });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _boot);
  } else {
    setTimeout(_boot, 50);
  }

})();
