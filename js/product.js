/* ═══════════════════════════════════════════════════════════════
   0 DISTRICT — PRODUCT LAYER
   Player · Modal · Toast · Interactions · Data
   ═══════════════════════════════════════════════════════════════ */

/* ── TRACK LIBRARY (Mock data — replace with Convex queries once deployed) ── */
var TRACKS = [
  { id:'t1', title:'Accra Nights',      artist:'Kofi Manu',      city:'ACCRA · GH',       art:'art-red',   label:'KM', badge:'LIVE',   duration:'3:47', genre:'Afrobeats' },
  { id:'t2', title:'Dakar Frequency',   artist:'DJ Senegal',     city:'DAKAR · SN',       art:'art-blue',  label:'DS', badge:'NEW',    duration:'4:12', genre:'Afro House' },
  { id:'t3', title:'Lagos Ritual',      artist:'Zara.B',         city:'LAGOS · NG',       art:'art-purple',label:'ZB', badge:'REMIX',  duration:'3:28', genre:'Afro Soul' },
  { id:'t4', title:'Midnight Lagos',    artist:'Ofo Beats',      city:'LAGOS · NG',       art:'art-green', label:'OB', badge:'SINGLE', duration:'4:55', genre:'Afrobeats' },
  { id:'t5', title:'Joburg Grid',       artist:'Echo Delta',     city:'JOHANNESBURG · ZA',art:'art-amber', label:'ED', badge:'EP',     duration:'5:01', genre:'Electronic' },
  { id:'t6', title:'Nairobi Rise',      artist:'Yemi.K',         city:'NAIROBI · KE',     art:'art-teal',  label:'YK', badge:'TRACK',  duration:'3:33', genre:'Afropop' },
  { id:'t7', title:'Afro Pulse',        artist:'Amara X Pulse',  city:'ABIDJAN · CI',     art:'art-purple',label:'AP', badge:'ALBUM',  duration:'4:08', genre:'Afrobeats' },
  { id:'t8', title:'Nile Blue',         artist:'Cairo Sound',    city:'CAIRO · EG',       art:'art-red',   label:'NB', badge:'SINGLE', duration:'3:52', genre:'Electronic' },
  { id:'t9', title:'Third Wave',        artist:'Pulse Network',  city:'KINSHASA · CD',    art:'art-mono',  label:'TW', badge:'REMIX',  duration:'6:14', genre:'Amapiano' },
  { id:'t10',title:'Signal Void',       artist:'Freq District',  city:'NAIROBI · KE',     art:'art-teal',  label:'SV', badge:'EP',     duration:'4:44', genre:'Electronic' },
  { id:'t11',title:'Gold Shore',        artist:'Tema Coast',     city:'ACCRA · GH',       art:'art-amber', label:'GS', badge:'SINGLE', duration:'3:19', genre:'Highlife' },
  { id:'t12',title:'Kinshasa Wake',     artist:'River Bloc',     city:'KINSHASA · CD',    art:'art-green', label:'KW', badge:'TRACK',  duration:'5:28', genre:'Afro House' },
];

/* ── PLAYER STATE ── */
var player = {
  currentIdx: 0,
  playing: false,
  progress: 22,       // percent
  elapsed: 35,        // seconds
  total: 227,         // seconds
  interval: null,
  shuffle: false,
  loop: false
};

function getTrack(idx) { return TRACKS[idx % TRACKS.length]; }

function playerLoad(idx, autoPlay) {
  player.currentIdx = idx;
  player.progress = 0;
  player.elapsed = 0;
  var t = getTrack(idx);

  // Update player bar
  var el = function(id) { return document.getElementById(id); };
  if (el('playerTitle'))    el('playerTitle').textContent  = t.title;
  if (el('playerArtist'))   el('playerArtist').textContent = t.artist;
  if (el('playerArtLabel')) el('playerArtLabel').textContent = t.label;
  if (el('playerArt')) {
    el('playerArt').querySelector('div').className = '';
    el('playerArt').querySelector('div').style.cssText =
      'width:100%;height:100%;display:flex;align-items:center;justify-content:center;';
    el('playerArt').querySelector('div').classList.add(t.art.replace('art-',''),'art-'+t.art.split('-')[1]);
    // simpler: just set background via class
    var artDiv = el('playerArt').firstElementChild;
    artDiv.className = t.art;
    artDiv.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;';
  }
  if (el('playerTimeTotal')) el('playerTimeTotal').textContent = t.duration;

  // Parse total seconds from duration string
  var parts = t.duration.split(':');
  player.total = parseInt(parts[0]) * 60 + parseInt(parts[1]);

  updateProgress(0);
  updateNowPlayingCards(idx);
  if (autoPlay) playerPlay();
}

function playerPlay() {
  player.playing = true;
  var btn = document.getElementById('playerPlayBtn');
  if (btn) {
    btn.classList.add('playing');
    btn.innerHTML = '<svg width="10" height="12" viewBox="0 0 10 12"><rect x="0" y="0" width="3.5" height="12" fill="currentColor"/><rect x="6.5" y="0" width="3.5" height="12" fill="currentColor"/></svg>';
  }
  clearInterval(player.interval);
  player.interval = setInterval(function() {
    if (!player.playing) return;
    player.elapsed++;
    if (player.elapsed >= player.total) {
      if (player.loop) { player.elapsed = 0; }
      else { playerNext(); return; }
    }
    var pct = (player.elapsed / player.total) * 100;
    updateProgress(pct);
  }, 1000);
}

function playerPause() {
  player.playing = false;
  clearInterval(player.interval);
  var btn = document.getElementById('playerPlayBtn');
  if (btn) {
    btn.classList.remove('playing');
    btn.innerHTML = '<svg width="10" height="12" viewBox="0 0 10 12"><polygon points="0,0 10,6 0,12" fill="currentColor"/></svg>';
  }
}

function playerToggle() {
  if (player.playing) playerPause(); else playerPlay();
}

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

function updateProgress(pct) {
  player.progress = pct;
  ['progressFill','progressStrip','player-progress-fill'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.width = pct + '%';
  });
  var strip = document.querySelector('.player-progress-inner');
  if (strip) strip.style.width = pct + '%';
  var fill = document.querySelector('.player-progress-fill');
  if (fill) fill.style.width = pct + '%';
  var handle = document.querySelector('.player-progress-handle');
  if (handle) handle.style.left = pct + '%';

  // Update time
  var mins = Math.floor(player.elapsed / 60);
  var secs = player.elapsed % 60;
  var timeStr = mins + ':' + (secs < 10 ? '0' : '') + secs;
  var curEl = document.getElementById('playerTimeCur');
  if (curEl) curEl.textContent = timeStr;
}

function updateNowPlayingCards(idx) {
  var t = getTrack(idx);
  document.querySelectorAll('.track-card').forEach(function(card) {
    card.classList.remove('now-playing');
    if (card.dataset.trackId === t.id) card.classList.add('now-playing');
  });
}

/* ── Wire up track cards ── */
function initTrackCards() {
  document.querySelectorAll('.track-card').forEach(function(card, i) {
    var tid = card.dataset.trackId;
    var idx = tid ? TRACKS.findIndex(function(t) { return t.id === tid; }) : i % TRACKS.length;
    if (idx < 0) idx = i % TRACKS.length;
    card.addEventListener('click', function() {
      playerLoad(idx, true);
    });
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
  if (!input || !input.value.trim()) {
    showToast('Enter your email address', 'error'); return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
    showToast('Enter a valid email address', 'error'); return;
  }
  input.value = '';
  showToast('Welcome to the District — check your inbox', 'success');
}

function handleModalSubmit(e) {
  if (e) e.preventDefault();
  var activeTab = document.querySelector('.modal-tab.active');
  var isSignIn = activeTab && activeTab.dataset.tab === 'signin';
  closeSignIn();
  showToast(isSignIn ? 'Welcome back to the District' : 'Account created — welcome', 'success');
}

/* ── PROGRESS BAR SEEK ── */
function initProgressSeek() {
  var strip = document.querySelector('.player-progress-strip');
  if (strip) {
    strip.addEventListener('click', function(e) {
      var rect = strip.getBoundingClientRect();
      var pct = ((e.clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      player.elapsed = Math.round((pct / 100) * player.total);
      updateProgress(pct);
    });
  }
  var wrap = document.querySelector('.player-progress-wrap');
  if (wrap) {
    wrap.addEventListener('click', function(e) {
      var rect = wrap.getBoundingClientRect();
      var pct = ((e.clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      player.elapsed = Math.round((pct / 100) * player.total);
      updateProgress(pct);
    });
  }
}

/* ── SHUFFLE / LOOP BUTTONS ── */
function initPlayerButtons() {
  document.querySelectorAll('.player-btn').forEach(function(btn) {
    var txt = btn.textContent.trim();
    if (txt === 'SHUF') btn.addEventListener('click', function() {
      player.shuffle = !player.shuffle;
      btn.classList.toggle('active', player.shuffle);
    });
    if (txt === 'LOOP') btn.addEventListener('click', function() {
      player.loop = !player.loop;
      btn.classList.toggle('active', player.loop);
    });
    if (txt === 'PREV') btn.addEventListener('click', playerPrev);
    if (txt === 'NEXT') btn.addEventListener('click', playerNext);
  });
}

/* ── SIGN IN BUTTON ── */
function initSignInButtons() {
  document.querySelectorAll('.btn-nav, .btn-nav-mobile, .btn-modal-google').forEach(function(btn) {
    if (btn.classList.contains('btn-modal-google')) return; // handled separately
    btn.addEventListener('click', openSignIn);
  });
  // Join form submit
  var joinForm = document.querySelector('.join-form');
  if (joinForm) {
    var submitBtn = joinForm.querySelector('.join-submit');
    if (submitBtn) submitBtn.addEventListener('click', handleJoinForm);
    joinForm.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') handleJoinForm(e);
    });
  }
  // Create account btn
  document.querySelectorAll('[data-action="create-account"]').forEach(function(btn) {
    btn.addEventListener('click', function(e) { e.preventDefault(); openSignIn(); });
  });
}

/* ── BROADCAST LOG: auto-add entries ── */
var BROADCAST_EVENTS = [
  { badge:'track',  label:'TRACK',  text:'<strong>AMARA X PULSE</strong> → DROPPED "AFRO PULSE" · 47 PLAYS' },
  { badge:'join',   label:'JOIN',   text:'<strong>TEMA COAST</strong> → JOINED THE DISTRICT · PRODUCER' },
  { badge:'live',   label:'LIVE',   text:'<strong>YEMI.K</strong> → STARTED LIVE SESSION "NAIROBI RITUAL"' },
  { badge:'collab', label:'COLLAB', text:'<strong>FREQ DISTRICT × RIVER BLOC</strong> → OPENED REMIX CHALLENGE' },
  { badge:'track',  label:'TRACK',  text:'<strong>CAIRO SOUND</strong> → RELEASED "NILE BLUE" · 89 PLAYS' },
  { badge:'join',   label:'JOIN',   text:'<strong>OFO BEATS</strong> → UPLOADED 3 NEW TRACKS' },
];
var broadcastIdx = 0;

function addBroadcastEntry() {
  var log = document.querySelector('.broadcast-log');
  if (!log) return;
  var ev = BROADCAST_EVENTS[broadcastIdx % BROADCAST_EVENTS.length];
  broadcastIdx++;
  var times = ['JUST NOW','1 MIN AGO','2 MIN AGO'];
  var row = document.createElement('div');
  row.className = 'broadcast-row';
  row.innerHTML =
    '<span class="broadcast-time">' + times[0] + '</span>' +
    '<span class="broadcast-badge ' + ev.badge + '">' + ev.label + '</span>' +
    '<span class="broadcast-text">' + ev.text + '</span>' +
    '<span class="broadcast-action">VIEW →</span>';
  log.insertBefore(row, log.firstChild);
  setTimeout(function() { row.classList.add('visible'); }, 50);
  // Remove oldest if too many
  var rows = log.querySelectorAll('.broadcast-row');
  if (rows.length > 8) log.removeChild(rows[rows.length - 1]);
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', function() {
  initTrackCards();
  initProgressSeek();
  initPlayerButtons();
  initSignInButtons();

  // Auto-update broadcast log every 12s
  if (document.querySelector('.broadcast-log')) {
    setTimeout(addBroadcastEntry, 5000);
    setInterval(addBroadcastEntry, 12000);
  }

  // Join form enter
  var joinInput = document.querySelector('.join-form input');
  if (joinInput) {
    joinInput.form && joinInput.form.addEventListener('submit', handleJoinForm);
  }

  // Modal close on backdrop click
  var modal = document.getElementById('signInModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeSignIn();
    });
  }

  // ESC closes modal and search
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { closeSignIn(); if (typeof closeSearch === 'function') closeSearch(); }
  });
});
