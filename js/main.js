/* ============================================================
   0 DISTRICT — SHARED JAVASCRIPT
   ============================================================ */

/* PAGE FADE IN */
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.remove('page-loading');
});

/* PAGE TRANSITIONS ON LINK CLICK */
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
  e.preventDefault();
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.35s ease';
  setTimeout(() => { window.location.href = href; }, 350);
});

/* NAV SCROLL BEHAVIOR */
const nav = document.querySelector('.nav');
if (nav) {
  const updateNav = () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();
}

/* HERO SLIDESHOW */
const heroSlides = document.querySelectorAll('.hero-slide');
const heroDots   = document.querySelectorAll('.hero-dot');
let currentSlide = 0;
let slideInterval;

function goToSlide(index) {
  heroSlides[currentSlide]?.classList.remove('active');
  heroDots[currentSlide]?.classList.remove('active');
  currentSlide = index;
  heroSlides[currentSlide]?.classList.add('active');
  heroDots[currentSlide]?.classList.add('active');
}

if (heroSlides.length > 1) {
  heroSlides[0]?.classList.add('active');
  heroDots[0]?.classList.add('active');
  slideInterval = setInterval(() => {
    goToSlide((currentSlide + 1) % heroSlides.length);
  }, 6000);
  heroDots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      clearInterval(slideInterval);
      goToSlide(i);
      slideInterval = setInterval(() => {
        goToSlide((currentSlide + 1) % heroSlides.length);
      }, 6000);
    });
  });
} else if (heroSlides.length === 1) {
  heroSlides[0]?.classList.add('active');
  heroDots[0]?.classList.add('active');
}

/* SCROLL REVEAL (IntersectionObserver) */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .broadcast-row').forEach(el => {
  revealObserver.observe(el);
});

/* CAROUSEL ARROWS */
document.querySelectorAll('.carousel-arrow').forEach(btn => {
  btn.addEventListener('click', () => {
    const trackId = btn.dataset.target;
    const track = document.getElementById(trackId);
    if (!track) return;
    const dir = btn.dataset.dir;
    const step = track.offsetWidth * 0.75;
    track.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' });
  });
});

/* PLAYER BAR — play/pause and progress are handled by product.js (real DSP engine) */

/* BROADCAST LOG — LIVE FEED INJECTION */
const broadcastLog = document.querySelector('.broadcast-log');
const broadcastData = [
  { time: 'NOW', type: 'system', text: '<strong>0 DISTRICT</strong> → SIGNAL LOCKED · BROADCAST LIVE' },
  { time: '2m',  type: 'track',  text: '<strong>0PROMO RECORDS</strong> → NEW MUSIC NOW STREAMING' },
  { time: '5m',  type: 'system', text: '<strong>SYSTEM</strong> → UPLINK STABLE · AFRICA + DIASPORA ONLINE' },
  { time: '8m',  type: 'join',   text: '<strong>NEW ARTIST</strong> → ENTERED THE DISTRICT' },
  { time: '12m', type: 'track',  text: '<strong>0 DISTRICT</strong> → CATALOG EXPANDING · WATCH THIS SPACE' },
  { time: '15m', type: 'system', text: '<strong>SYSTEM</strong> → BROADCAST SIGNAL NOMINAL · UPTIME 99.9%' },
];

if (broadcastLog) {
  let idx = 0;
  setInterval(() => {
    const data = broadcastData[idx % broadcastData.length];
    const row = document.createElement('div');
    row.className = 'broadcast-row';
    row.innerHTML = `
      <span class="broadcast-time">${data.time} AGO</span>
      <span class="broadcast-badge ${data.type}">${data.type.toUpperCase()}</span>
      <span class="broadcast-text">${data.text}</span>
      <span class="broadcast-action">VIEW →</span>
    `;
    broadcastLog.insertBefore(row, broadcastLog.firstChild);
    setTimeout(() => row.classList.add('visible'), 50);
    // Keep max 8 rows
    const rows = broadcastLog.querySelectorAll('.broadcast-row');
    if (rows.length > 8) rows[rows.length - 1].remove();
    idx++;
  }, 5000);
}

/* TRACK CARD PLAY BUTTONS — handled by product.js (links tracks to DSP player) */

/* UPTIME COUNTER */
const uptimeEl = document.getElementById('uptime');
if (uptimeEl) {
  let seconds = 0;
  setInterval(() => {
    seconds++;
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    uptimeEl.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

/* HERO SLIDE COUNTER */
const slideNumEl = document.getElementById('slideNum');
const origGoToSlide = goToSlide;
// Patch goToSlide to also update counter
if (slideNumEl) {
  document.querySelectorAll('.hero-dot').forEach((dot, i) => {
    const obs = new MutationObserver(() => {
      if (dot.classList.contains('active')) {
        slideNumEl.textContent = String(i + 1).padStart(2, '0');
      }
    });
    obs.observe(dot, { attributes: true, attributeFilter: ['class'] });
  });
}

/* SEARCH OVERLAY */
function openSearch() {
  document.getElementById('searchOverlay').classList.add('open');
  setTimeout(() => document.getElementById('searchInput')?.focus(), 100);
}
function closeSearch() {
  document.getElementById('searchOverlay').classList.remove('open');
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSearch();
  if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
    e.preventDefault(); openSearch();
  }
});

/* GENRE / FILTER PILL TOGGLE */
function togglePill(btn) {
  btn.closest('.search-genre-row')?.querySelectorAll('.sg-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
}
function filterPill(btn) {
  const filterRow = btn.closest('.section-filters');
  filterRow?.querySelectorAll('.fp').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');

  const filter = btn.textContent.trim().toUpperCase();
  const section = btn.closest('section, .section');
  const cards = section?.querySelectorAll('.track-card');
  if (!cards || !cards.length) return;

  cards.forEach(card => {
    if (filter === 'ALL') {
      card.style.display = '';
      return;
    }
    const genre = (card.dataset.genre || '').toUpperCase();
    const badge = (card.querySelector('.track-card-badge')?.textContent || '').trim().toUpperCase();
    // match genre tag OR badge text (handles both genre-mode and type-mode pills)
    const visible = genre.includes(filter) || badge.includes(filter) ||
                    filter.replace(/S$/, '') === badge.replace(/S$/, ''); // ALBUMS ↔ ALBUM etc
    card.style.display = visible ? '' : 'none';
  });
}

/* MODAL TAB SWITCHER */
function switchTab(btn) {
  const modal = btn.closest('.modal-box');
  if (!modal) return;
  modal.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const tabId = btn.dataset.tab;
  modal.querySelectorAll('.modal-panel').forEach(p => {
    p.style.display = p.id === 'panel-' + tabId ? '' : 'none';
  });
}

/* OPEN REGISTER TAB */
function openRegister() {
  if (typeof openSignIn === 'function') openSignIn();
  // Switch to register tab after modal opens
  setTimeout(() => {
    const regTab = document.querySelector('[data-tab="register"]');
    if (regTab) switchTab(regTab);
  }, 50);
}

/* JOIN FORM SUBMIT */
function joinSubmit(btn) {
  const input = btn.previousElementSibling;
  const email = (input?.value || '').trim();
  if (!email || !email.includes('@')) {
    if (input) { input.style.borderColor = 'var(--red)'; setTimeout(() => input.style.borderColor = '', 1200); }
    return;
  }
  // Open registration modal and pre-fill email
  openRegister();
  setTimeout(() => {
    const regEmail = document.querySelector('#panel-register input[type="email"]');
    if (regEmail) regEmail.value = email;
  }, 100);
}

/* STATS COUNTER ANIMATION */
function animateCount(el, target, duration) {
  if (!el) return;
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(eased * target);
    el.textContent = value >= 1000 ? value.toLocaleString() : value;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const statsSection = document.querySelector('.stats-strip');
if (statsSection) {
  const statsObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animateCount(document.getElementById('statArtists'),    12, 1600);
      animateCount(document.getElementById('statTracks'),     38, 2000);
      animateCount(document.getElementById('statDistricts'),   4,  800);
      animateCount(document.getElementById('statLive'),        6, 1200);
      statsObserver.disconnect();
    }
  }, { threshold: 0.5 });
  statsObserver.observe(statsSection);
}



/* ── Mobile Menu ────────────────────────────────────── */
function toggleMobileMenu() {
  var btn  = document.getElementById('navMenuBtn');
  var menu = document.getElementById('navMobileMenu');
  if (!btn || !menu) return;
  var isOpen = menu.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

// Close mobile menu on link click
document.addEventListener('DOMContentLoaded', function() {
  var links = document.querySelectorAll('.nav-mobile-links a');
  links.forEach(function(link) {
    link.addEventListener('click', function() {
      var menu = document.getElementById('navMobileMenu');
      var btn  = document.getElementById('navMenuBtn');
      if (menu) menu.classList.remove('open');
      if (btn)  btn.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
});

// Close mobile menu on resize back to desktop
window.addEventListener('resize', function() {
  if (window.innerWidth > 900) {
    var menu = document.getElementById('navMobileMenu');
    var btn  = document.getElementById('navMenuBtn');
    if (menu) menu.classList.remove('open');
    if (btn)  btn.classList.remove('open');
    document.body.style.overflow = '';
  }
});

/* ── COLLAB FILTER ──────────────────────────────────────── */
function setFilter(btn, type) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const cards = document.querySelectorAll('.collab-card');
  cards.forEach(card => {
    if (type === 'all') {
      card.style.display = '';
      return;
    }
    // match against badge class names inside the card
    const badges = card.querySelectorAll('.collab-badge');
    let match = false;
    badges.forEach(b => {
      const cls = Array.from(b.classList).join(' ').toLowerCase();
      const txt = b.textContent.trim().toLowerCase();
      if (cls.includes(type) || txt.includes(type)) match = true;
    });
    // also check data-type if present
    if ((card.dataset.type || '').toLowerCase() === type) match = true;
    card.style.display = match ? '' : 'none';
  });
  // also filter challenge cards if present
  const challenges = document.querySelectorAll('.challenge-card');
  challenges.forEach(card => {
    if (type === 'all' || type === 'challenges') {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

/* ── LIVE SEARCH (track cards + collab cards) ─────────── */
(function wireSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.addEventListener('input', function() {
    const q = this.value.trim().toLowerCase();
    if (!q) {
      // clear — show everything
      document.querySelectorAll('.track-card, .collab-card').forEach(c => c.style.display = '');
      return;
    }
    document.querySelectorAll('.track-card').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? '' : 'none';
    });
    document.querySelectorAll('.collab-card').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? '' : 'none';
    });
  });
  // pressing Enter closes overlay after search
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') closeSearch();
  });
})();

/* ── COMMUNITY VOTE TOGGLE ─────────────────────────────── */
function toggleVote(btn) {
  const countEl = btn.querySelector('span');
  if (!countEl) return;
  const current = parseInt(countEl.textContent.replace(/\D/g, ''), 10) || 0;
  const voted = btn.classList.toggle('voted');
  countEl.textContent = voted ? current + 1 : current - 1;
  btn.style.color = voted ? 'var(--red)' : '';
  btn.style.borderColor = voted ? 'var(--red)' : '';
}

/* ── COMMUNITY POST SUBMIT ─────────────────────────────── */
function communityPost(btn) {
  const compose  = btn.closest('#compose-form, .compose-form');
  const textarea = compose ? compose.querySelector('textarea') : document.querySelector('.compose-area');
  const text     = textarea ? textarea.value.trim() : '';
  if (!text) {
    if (textarea) { textarea.style.borderColor = 'var(--red)'; setTimeout(() => { textarea.style.borderColor = ''; }, 1200); }
    return;
  }

  // Get active tags
  const activeTags = [];
  (compose || document).querySelectorAll('.tag-btn.active').forEach(function(t) { activeTags.push(t.textContent.trim()); });

  // Get author name from session
  var authorName = 'YOU';
  var authorInitials = 'ME';
  try {
    if (typeof DistrictAuth !== 'undefined' && DistrictAuth.displayName) {
      var dn = DistrictAuth.displayName();
      if (dn) { authorName = dn; authorInitials = dn.slice(0,2); }
    }
  } catch(e) {}

  // Build thread card HTML
  var tagHtml = activeTags.map(function(t) { return '<span class="thread-tag">' + t + '</span>'; }).join('');
  var thread = document.createElement('div');
  thread.className = 'thread';
  thread.style.cssText = 'animation: fadeIn 0.4s ease; border-left: 2px solid var(--red);';
  thread.innerHTML =
    '<div class="thread-avatar" style="background:var(--red);">'
    + '<div class="thread-avatar-text">' + authorInitials.toUpperCase() + '</div></div>'
    + '<div class="thread-content">'
    + '<div class="thread-header"><span class="thread-author">' + authorName + '</span>'
    + '<span class="thread-time">JUST NOW</span><span class="thread-badge" style="border-color:var(--red);color:var(--red);">NEW</span></div>'
    + '<div class="thread-body">' + text.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>'
    + (tagHtml ? '<div class="thread-tags">' + tagHtml + '</div>' : '')
    + '<div class="thread-actions">'
    + '<button class="thread-action" onclick="toggleVote(this)">&#8679; <span>1</span></button>'
    + '<button class="thread-action">&#8617; <span>0 REPLIES</span></button>'
    + '<button class="thread-action">&#9734; <span>SAVE</span></button>'
    + '</div></div>';

  // Insert before first thread
  var firstThread = document.querySelector('.thread');
  if (firstThread && firstThread.parentNode) {
    firstThread.parentNode.insertBefore(thread, firstThread);
  }

  // Clear compose and reset tags
  if (textarea) textarea.value = '';
  (compose || document).querySelectorAll('.tag-btn.active').forEach(function(t) { t.classList.remove('active'); });

  if (typeof showToast === 'function') showToast('Posted to the District', 'success');
}

/* ── PLAYLIST BUILDER — functional add/remove ────────── */
(function wirePlaylistBuilder() {
  document.addEventListener('click', function(e) {
    const addBtn = e.target.closest('.playlist-item-add');
    if (!addBtn) return;
    const item = addBtn.closest('.playlist-item');
    if (!item || addBtn.textContent.trim() === '✓') return;

    // Clone into current playlist panel
    const panel = addBtn.closest('.cr-panel');
    if (!panel) return;
    const playlistPanel = panel.querySelector('div > div:last-child');
    if (!playlistPanel) return;

    // Build mini row
    const titleEl = item.querySelector('.playlist-item-title');
    const metaEl  = item.querySelector('.playlist-item-meta');
    const artEl   = item.querySelector('.playlist-item-art');
    const title   = titleEl ? titleEl.textContent : '';
    const meta    = metaEl  ? metaEl.textContent  : '';
    const artHTML = artEl   ? artEl.innerHTML      : '';

    const row = document.createElement('div');
    row.className = 'playlist-item';
    row.style.cssText = 'border-top:1px solid var(--border);margin-top:8px;padding-top:8px;';
    row.innerHTML = '<div class="playlist-item-art">' + artHTML + '</div>'
      + '<div><div class="playlist-item-title">' + title + '</div>'
      + '<div class="playlist-item-meta">' + meta + '</div></div>'
      + '<span class="playlist-item-add" style="color:var(--steel);cursor:pointer;" onclick="this.closest(\'.playlist-item\').remove();_updatePlaylistCount(this);">✕</span>';

    // Insert before the publish button
    const publishBtn = playlistPanel.querySelector('.btn-submit');
    if (publishBtn) {
      playlistPanel.insertBefore(row, publishBtn);
    } else {
      playlistPanel.appendChild(row);
    }

    // Mark source as added
    addBtn.textContent = '✓';
    addBtn.style.color = 'var(--red)';
    addBtn.style.cursor = 'default';
    addBtn.onclick = null;

    _updatePlaylistCount(row);
  });
})();

function _updatePlaylistCount(el) {
  const countEl = document.getElementById('playlistCount');
  if (!countEl) return;
  // count playlist items in the current playlist side (right panel), not the pool
  const panel = countEl.closest('.cr-panel');
  if (!panel) return;
  const rightPanel = panel.querySelector('.playlist-builder > div:last-child');
  const rows = rightPanel ? rightPanel.querySelectorAll('.playlist-item') : [];
  countEl.textContent = rows.length + ' TRACKS ADDED';
}

/* ── UPLOAD ZONE — file input wiring ─────────────────── */
(function wireUploadZone() {
  document.addEventListener('DOMContentLoaded', function() {
    const zone = document.querySelector('.upload-zone');
    if (!zone) return;

    // Create hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/wav,audio/aiff,audio/flac,audio/mpeg,.wav,.aiff,.flac,.mp3';
    input.style.display = 'none';
    zone.appendChild(input);

    zone.style.cursor = 'pointer';
    zone.addEventListener('click', () => input.click());

    input.addEventListener('change', function() {
      if (!this.files.length) return;
      const f = this.files[0];
      const mb = (f.size / 1048576).toFixed(1);
      zone.querySelector('.upload-title').textContent = f.name;
      zone.querySelector('.upload-sub').textContent = mb + ' MB — ready to submit';
      zone.style.borderColor = 'var(--red)';
      // Auto-fill track title from filename
      const titleInput = document.querySelector('#panel-artist-upload input[placeholder="UNTITLED TRACK"]');
      if (titleInput && !titleInput.value) {
        titleInput.value = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').toUpperCase();
      }
    });

    // Drag and drop
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.background = 'var(--bg2)'; });
    zone.addEventListener('dragleave', () => { zone.style.background = ''; });
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.style.background = '';
      if (e.dataTransfer.files.length) {
        const f = e.dataTransfer.files[0];
        const mb = (f.size / 1048576).toFixed(1);
        zone.querySelector('.upload-title').textContent = f.name;
        zone.querySelector('.upload-sub').textContent = mb + ' MB — ready to submit';
        zone.style.borderColor = 'var(--red)';
        const titleInput = document.querySelector('#panel-artist-upload input[placeholder="UNTITLED TRACK"]');
        if (titleInput && !titleInput.value) {
          titleInput.value = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').toUpperCase();
        }
      }
    });
  });
})();
