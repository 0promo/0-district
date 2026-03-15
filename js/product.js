/* ═══════════════════════════════════════════════════════════════
   0 DISTRICT — PRODUCT LAYER
   Player · Modal · Toast · Interactions · Data
   ═══════════════════════════════════════════════════════════════ */

/* ── TRACK LIBRARY ── */
var TRACKS = [
  { id:'t1',  title:'Accra Nights',      artist:'Kofi Manu',      city:'ACCRA · GH',       art:'art-red',    label:'KM', badge:'LIVE',   duration:'3:47', genre:'Afrobeats'  },
  { id:'t2',  title:'Dakar Frequency',   artist:'DJ Senegal',     city:'DAKAR · SN',       art:'art-blue',   label:'DS', badge:'NEW',    duration:'4:12', genre:'Afro House' },
  { id:'t3',  title:'Lagos Ritual',      artist:'Zara.B',         city:'LAGOS · NG',       art:'art-purple', label:'ZB', badge:'REMIX',  duration:'3:28', genre:'Afro Soul'  },
  { id:'t4',  title:'Midnight Lagos',    artist:'Ofo Beats',      city:'LAGOS · NG',       art:'art-green',  label:'OB', badge:'SINGLE', duration:'4:55', genre:'Afrobeats'  },
  { id:'t5',  title:'Joburg Grid',       artist:'Echo Delta',     city:'JOHANNESBURG · ZA',art:'art-amber',  label:'ED', badge:'EP',     duration:'5:01', genre:'Electronic' },
  { id:'t6',  title:'Nairobi Rise',      artist:'Yemi.K',         city:'NAIROBI · KE',     art:'art-teal',   label:'YK', badge:'TRACK',  duration:'3:33', genre:'Afropop'    },
  { id:'t7',  title:'Afro Pulse',        artist:'Amara X Pulse',  city:'ABIDJAN · CI',     art:'art-purple', label:'AP', badge:'ALBUM',  duration:'4:08', genre:'Afrobeats'  },
  { id:'t8',  title:'Nile Blue',         artist:'Cairo Sound',    city:'CAIRO · EG',       art:'art-red',    label:'NB', badge:'SINGLE', duration:'3:52', genre:'Electronic' },
  { id:'t9',  title:'Third Wave',        artist:'Pulse Network',  city:'KINSHASA · CD',    art:'art-mono',   label:'TW', badge:'REMIX',  duration:'6:14', genre:'Amapiano'   },
  { id:'t10', title:'Signal Void',       artist:'Freq District',  city:'NAIROBI · KE',     art:'art-teal',   label:'SV', badge:'EP',     duration:'4:44', genre:'Electronic' },
  { id:'t11', title:'Gold Shore',        artist:'Tema Coast',     city:'ACCRA · GH',       art:'art-amber',  label:'GS', badge:'SINGLE', duration:'3:19', genre:'Highlife'   },
  { id:'t12', title:'Kinshasa Wake',     artist:'River Bloc',     city:'KINSHASA · CD',    art:'art-green',  label:'KW', badge:'TRACK',  duration:'5:28', genre:'Afro House' },
];

/* ── PLAYER STATE ── */
var player = {
  currentIdx: 0,
  playing:    false,
  progress:   22,
  elapsed:    35,
  total:      227,
  interval:   null,
  shuffle:    false,
  loop:       false,
  muted:      false,
  volume:     70,
  likedTracks: {}
};

function getTrack(idx) { return TRACKS[((idx % TRACKS.length) + TRACKS.length) % TRACKS.length]; }

/* ── LOAD TRACK ── */
function playerLoad(idx, autoPlay) {
  player.currentIdx = idx;
  player.elapsed    = 0;
  var t = getTrack(idx);
  var $ = function(id) { return document.getElementById(id); };

  if ($('playerTitle'))    $('playerTitle').textContent    = t.title;
  if ($('playerArtist'))   $('playerArtist').textContent   = t.artist;
  if ($('playerArtLabel')) $('playerArtLabel').textContent = t.label;
  if ($('playerGenre'))    $('playerGenre').textContent    = t.genre;
  if ($('playerCity'))     $('playerCity').textContent     = t.city;
  if ($('playerTimeTotal'))$('playerTimeTotal').textContent= t.duration;

  // Queue counter
  var qEl = $('playerQueueNum');
  if (qEl) {
    var num = String(idx + 1).padStart(2, '0');
    var tot = String(TRACKS.length).padStart(2, '0');
    qEl.textContent = num + ' / ' + tot;
  }

  // Artwork
  var artBg = $('playerArtBg');
  if (artBg) {
    artBg.className = t.art;
    artBg.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;';
  }

  // Like state
  var likeBtn = $('playerLikeBtn');
  if (likeBtn) {
    likeBtn.classList.toggle('liked', !!player.likedTracks[t.id]);
  }

  // Parse duration
  var parts  = t.duration.split(':');
  player.total = parseInt(parts[0]) * 60 + parseInt(parts[1]);

  updateProgress(0);
  updateNowPlayingCards(idx);

  // Increment play count in data layer
  if (typeof DistrictAPI !== 'undefined') DistrictAPI.incrementPlay(t.id);

  if (autoPlay) playerPlay();
  else playerPause();
}

/* ── PLAY / PAUSE ── */
function playerPlay() {
  player.playing = true;
  var btn = document.getElementById('playerPlayBtn');
  if (btn) {
    btn.classList.add('playing');
    btn.innerHTML = '<svg width="11" height="13" viewBox="0 0 11 13"><rect x="0" y="0" width="3.5" height="13" fill="currentColor" rx="0.5"/><rect x="7.5" y="0" width="3.5" height="13" fill="currentColor" rx="0.5"/></svg>';
  }
  clearInterval(player.interval);
  player.interval = setInterval(function() {
    if (!player.playing) return;
    player.elapsed++;
    if (player.elapsed >= player.total) {
      if (player.loop) { player.elapsed = 0; }
      else { playerNext(); return; }
    }
    updateProgress((player.elapsed / player.total) * 100);
  }, 1000);
}

function playerPause() {
  player.playing = false;
  clearInterval(player.interval);
  var btn = document.getElementById('playerPlayBtn');
  if (btn) {
    btn.classList.remove('playing');
    btn.innerHTML = '<svg width="11" height="13" viewBox="0 0 11 13"><polygon points="0,0 11,6.5 0,13" fill="currentColor"/></svg>';
  }
}

function playerToggle() {
  if (player.playing) playerPause(); else playerPlay();
}

/* ── PREV / NEXT ── */
function playerNext() {
  var next = player.shuffle
    ? Math.floor(Math.random() * TRACKS.length)
    : (player.currentIdx + 1) % TRACKS.length;
  playerLoad(next, player.playing);
}

function playerPrev() {
  if (player.elapsed > 3) {
    player.elapsed = 0; updateProgress(0); return;
  }
  var prev = player.shuffle
    ? Math.floor(Math.random() * TRACKS.length)
    : (player.currentIdx - 1 + TRACKS.length) % TRACKS.length;
  playerLoad(prev, player.playing);
}

/* ── SHUFFLE / LOOP ── */
function playerShuf(btn) {
  player.shuffle = !player.shuffle;
  if (btn) btn.classList.toggle('active', player.shuffle);
}
function playerLoop(btn) {
  player.loop = !player.loop;
  if (btn) btn.classList.toggle('active', player.loop);
}

/* ── LIKE ── */
function playerLike() {
  var t   = getTrack(player.currentIdx);
  var btn = document.getElementById('playerLikeBtn');
  player.likedTracks[t.id] = !player.likedTracks[t.id];
  var liked = player.likedTracks[t.id];
  if (btn) btn.classList.toggle('liked', liked);
  showToast(liked ? ('♥ ' + t.title + ' — saved to your likes') : ('Removed from likes'), liked ? 'success' : '');
}

/* ── MUTE ── */
function playerMute() {
  player.muted = !player.muted;
  var btn  = document.getElementById('playerMuteBtn');
  var fill = document.getElementById('playerVolFill');
  if (btn)  btn.classList.toggle('muted', player.muted);
  if (fill) fill.style.width = player.muted ? '0%' : player.volume + '%';
  // Update mute icon
  var icon = document.getElementById('muteIcon');
  if (icon) {
    icon.innerHTML = player.muted
      ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>'
      : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>';
  }
}

/* ── VOLUME BAR CLICK ── */
function initVolBar() {
  var bar = document.getElementById('playerVolBar');
  if (!bar) return;
  bar.addEventListener('click', function(e) {
    var rect = bar.getBoundingClientRect();
    player.volume = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    player.volume = Math.max(0, Math.min(100, player.volume));
    player.muted = player.volume === 0;
    var fill = document.getElementById('playerVolFill');
    if (fill) fill.style.width = player.volume + '%';
    var muteBtn = document.getElementById('playerMuteBtn');
    if (muteBtn) muteBtn.classList.toggle('muted', player.muted);
  });
}

/* ── PROGRESS ── */
function updateProgress(pct) {
  player.progress = pct;
  // Both progress elements
  ['progressStrip','progressFill2'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.width = pct + '%';
  });
  document.querySelectorAll('.player-progress-inner,.player-progress-fill').forEach(function(el) {
    el.style.width = pct + '%';
  });
  document.querySelectorAll('.player-progress-handle').forEach(function(el) {
    el.style.left = pct + '%';
  });
  // Time display
  var mins = Math.floor(player.elapsed / 60);
  var secs = player.elapsed % 60;
  var el = document.getElementById('playerTimeCur');
  if (el) el.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
}

function initProgressSeek() {
  // Strip at top
  var strip = document.querySelector('.player-progress-strip');
  if (strip) {
    strip.addEventListener('click', function(e) {
      var rect  = strip.getBoundingClientRect();
      var pct   = ((e.clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      player.elapsed = Math.round((pct / 100) * player.total);
      updateProgress(pct);
    });
  }
  // Main progress bar
  var wrap = document.getElementById('playerProgressWrap');
  if (wrap) {
    wrap.addEventListener('click', function(e) {
      var rect = wrap.getBoundingClientRect();
      var pct  = ((e.clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      player.elapsed = Math.round((pct / 100) * player.total);
      updateProgress(pct);
    });
  }
}

/* ── NOW PLAYING CARD HIGHLIGHT ── */
function updateNowPlayingCards(idx) {
  var t = getTrack(idx);
  document.querySelectorAll('.track-card').forEach(function(card) {
    var isPlaying = card.dataset.trackId === t.id;
    card.classList.toggle('now-playing', isPlaying);
  });
}

/* ── WIRE TRACK CARDS ── */
function initTrackCards() {
  document.querySelectorAll('.track-card').forEach(function(card, i) {
    var tid = card.dataset.trackId;
    var idx = tid ? TRACKS.findIndex(function(t) { return t.id === tid; }) : i % TRACKS.length;
    if (idx < 0) idx = i % TRACKS.length;
    card.addEventListener('click', function() { playerLoad(idx, true); });
  });
}

/* ── SIGN IN MODAL ── */
function openSignIn() {
  var m = document.getElementById('signInModal');
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeSignIn() {
  var m = document.getElementById('signInModal');
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}
function switchTab(tab) {
  document.querySelectorAll('.modal-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.modal-panel').forEach(function(p) { p.style.display = 'none'; });
  tab.classList.add('active');
  var panel = document.getElementById('panel-' + tab.dataset.tab);
  if (panel) panel.style.display = 'block';
}

/* ── TOAST ── */
function showToast(msg, type) {
  var t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast'; t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'toast ' + (type || '');
  void t.offsetWidth;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 3200);
}

/* ── FORMS ── */
function handleJoinForm(e) {
  if (e) e.preventDefault();
  var input = document.querySelector('.join-form input');
  if (!input || !input.value.trim()) { showToast('Enter your email address', 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) { showToast('Enter a valid email address', 'error'); return; }
  input.value = '';
  showToast('Welcome to the District — check your inbox', 'success');
}

function handleModalSubmit() {
  var activeTab = document.querySelector('.modal-tab.active');
  var isSignIn  = activeTab && activeTab.dataset.tab === 'signin';
  closeSignIn();
  showToast(isSignIn ? 'Welcome back to the District' : 'Account created — welcome', 'success');
}

/* ── BROADCAST LOG ── */
var BROADCAST_EVENTS = [
  { badge:'track',  label:'TRACK',  text:'<strong>AMARA X PULSE</strong> → DROPPED "AFRO PULSE" · 47 PLAYS' },
  { badge:'join',   label:'JOIN',   text:'<strong>TEMA COAST</strong> → JOINED THE DISTRICT · PRODUCER' },
  { badge:'live',   label:'LIVE',   text:'<strong>YEMI.K</strong> → STARTED LIVE SESSION "NAIROBI RITUAL"' },
  { badge:'collab', label:'COLLAB', text:'<strong>FREQ DISTRICT × RIVER BLOC</strong> → OPENED REMIX CHALLENGE' },
  { badge:'track',  label:'TRACK',  text:'<strong>CAIRO SOUND</strong> → RELEASED "NILE BLUE" · 89 PLAYS' },
  { badge:'join',   label:'JOIN',   text:'<strong>OFO BEATS</strong> → UPLOADED 3 NEW TRACKS TO THE DISTRICT' },
  { badge:'live',   label:'LIVE',   text:'<strong>DJ SENEGAL</strong> → LIVE NOW · DAKAR NIGHTS VOL.4' },
  { badge:'system', label:'SYSTEM', text:'<strong>SYSTEM</strong> → 2,906 MEMBERS ONLINE · SIGNAL STABLE' },
];
var broadcastIdx = 0;

function addBroadcastEntry() {
  var log = document.querySelector('.broadcast-log');
  if (!log) return;
  var ev  = BROADCAST_EVENTS[broadcastIdx % BROADCAST_EVENTS.length];
  broadcastIdx++;
  var row = document.createElement('div');
  row.className = 'broadcast-row';
  row.innerHTML =
    '<span class="broadcast-time">JUST NOW</span>' +
    '<span class="broadcast-badge ' + ev.badge + '">' + ev.label + '</span>' +
    '<span class="broadcast-text">' + ev.text + '</span>' +
    '<span class="broadcast-action">VIEW →</span>';
  log.insertBefore(row, log.firstChild);
  setTimeout(function() { row.classList.add('visible'); }, 50);
  var rows = log.querySelectorAll('.broadcast-row');
  if (rows.length > 9) log.removeChild(rows[rows.length - 1]);
}

/* ── SIGN IN BUTTON WIRING ── */
function initSignInButtons() {
  document.querySelectorAll('.btn-nav, .btn-nav-mobile').forEach(function(btn) {
    btn.addEventListener('click', openSignIn);
  });
  var joinForm   = document.querySelector('.join-form');
  var joinSubmit = document.querySelector('.join-submit');
  if (joinSubmit) joinSubmit.addEventListener('click', handleJoinForm);
  if (joinForm)   joinForm.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleJoinForm(e); });
}

/* ── KEYBOARD SHORTCUTS ── */
function initKeyboard() {
  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') { e.preventDefault(); playerToggle(); }
    if (e.code === 'ArrowRight') { player.elapsed = Math.min(player.elapsed + 10, player.total); updateProgress((player.elapsed/player.total)*100); }
    if (e.code === 'ArrowLeft')  { player.elapsed = Math.max(player.elapsed - 10, 0); updateProgress((player.elapsed/player.total)*100); }
    if (e.code === 'ArrowUp')    { player.volume = Math.min(player.volume + 10, 100); var f=document.getElementById('playerVolFill'); if(f) f.style.width=player.volume+'%'; }
    if (e.code === 'ArrowDown')  { player.volume = Math.max(player.volume - 10, 0);   var f=document.getElementById('playerVolFill'); if(f) f.style.width=player.volume+'%'; }
    if (e.code === 'Escape') { closeSignIn(); if (typeof closeSearch === 'function') closeSearch(); }
  });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', function() {
  initTrackCards();
  initProgressSeek();
  initSignInButtons();
  initVolBar();
  initKeyboard();

  // Load first track without autoplay
  playerLoad(0, false);

  // Broadcast auto-updates
  if (document.querySelector('.broadcast-log')) {
    setTimeout(addBroadcastEntry, 6000);
    setInterval(addBroadcastEntry, 12000);
  }

  // Modal close on backdrop
  var modal = document.getElementById('signInModal');
  if (modal) modal.addEventListener('click', function(e) { if (e.target === modal) closeSignIn(); });
});
