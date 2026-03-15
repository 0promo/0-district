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

/* PLAYER BAR — PLAY/PAUSE TOGGLE */
const playBtn = document.querySelector('.player-btn-play');
let isPlaying = true;
if (playBtn) {
  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playBtn.innerHTML = isPlaying
      ? `<svg width="10" height="12" viewBox="0 0 10 12"><polygon points="0,0 10,6 0,12" fill="currentColor"/></svg>`
      : `<svg width="10" height="12" viewBox="0 0 10 12"><rect x="0" y="0" width="3.5" height="12" fill="currentColor"/><rect x="6.5" y="0" width="3.5" height="12" fill="currentColor"/></svg>`;
    const waveform = document.querySelector('.player-waveform');
    if (waveform) {
      waveform.querySelectorAll('.waveform-bar').forEach(bar => {
        bar.style.animationPlayState = isPlaying ? 'running' : 'paused';
      });
    }
  });
}

/* PLAYER PROGRESS */
let progress = 35;
const progressFill   = document.querySelector('.player-progress-fill');
const progressHandle = document.querySelector('.player-progress-handle');
setInterval(() => {
  if (!isPlaying) return;
  progress = progress >= 100 ? 0 : progress + 0.04;
  if (progressFill)   progressFill.style.width = progress + '%';
  if (progressHandle) progressHandle.style.left = progress + '%';
}, 200);

/* BROADCAST LOG — LIVE FEED INJECTION */
const broadcastLog = document.querySelector('.broadcast-log');
const broadcastData = [
  { time: 'NOW', type: 'track', text: '<strong>KOFI MANU</strong> → DROPPED NEW SINGLE "ACCRA NIGHTS"' },
  { time: '1m', type: 'join',  text: '<strong>ZARA.B</strong> → JOINED THE DISTRICT' },
  { time: '2m', type: 'live',  text: '<strong>DJ SENEGAL</strong> → STARTED LIVE SESSION' },
  { time: '4m', type: 'collab',text: '<strong>AMARA X PULSE</strong> → OPENED COLLAB REQUEST' },
  { time: '5m', type: 'track', text: '<strong>OFO BEATS</strong> → PUBLISHED "MIDNIGHT LAGOS" [REMIX]' },
  { time: '7m', type: 'system',text: '<strong>SYSTEM</strong> → BROADCAST SIGNAL STABLE · UPTIME 99.9%' },
  { time: '9m', type: 'join',  text: '<strong>YEMI.K</strong> → JOINED THE DISTRICT' },
  { time: '11m', type: 'track',text: '<strong>ECHO DELTA</strong> → RELEASED EP "JOHANNESBURG GRID"' },
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

/* TRACK CARD PLAY BUTTONS */
document.querySelectorAll('.track-card').forEach(card => {
  card.addEventListener('click', () => {
    const title  = card.querySelector('.track-card-title')?.textContent || '';
    const artist = card.querySelector('.track-card-artist')?.textContent || '';
    const titleEl  = document.querySelector('.player-title');
    const artistEl = document.querySelector('.player-artist');
    if (titleEl)  titleEl.textContent  = title;
    if (artistEl) artistEl.textContent = artist;
  });
});

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
  btn.closest('.section-filters')?.querySelectorAll('.fp').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
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
      animateCount(document.getElementById('statArtists'),  1247, 1600);
      animateCount(document.getElementById('statTracks'),   8432, 2000);
      animateCount(document.getElementById('statDistricts'),   6,  800);
      animateCount(document.getElementById('statLive'),       94, 1200);
      statsObserver.disconnect();
    }
  }, { threshold: 0.5 });
  statsObserver.observe(statsSection);
}

// ── Africa District Signal Map — D3 + TopoJSON ──────────────────────────
(function renderAfricaMap() {
  const AFRICA_IDS = new Set([
    12,24,204,72,854,108,120,140,148,174,178,180,262,818,232,231,266,270,
    288,324,624,384,404,426,430,434,450,454,466,478,480,504,508,516,562,
    566,646,678,686,694,706,710,728,729,748,834,768,788,800,732,894,716
  ]);

  const cities = [
    { name: 'CAIRO',        lng: 31.24,  lat: 30.04  },
    { name: 'DAKAR',        lng: -17.44, lat: 14.69  },
    { name: 'ACCRA',        lng: -0.19,  lat:  5.56  },
    { name: 'LAGOS',        lng:  3.38,  lat:  6.52  },
    { name: 'ADDIS ABABA',  lng: 38.75,  lat:  9.03  },
    { name: 'NAIROBI',      lng: 36.82,  lat: -1.29  },
    { name: 'KINSHASA',     lng: 15.27,  lat: -4.32  },
    { name: 'JOHANNESBURG', lng: 28.05,  lat:-26.20  }
  ];

  const wrap = document.getElementById('africaWrap');
  const svgEl = document.getElementById('africaMapSvg');
  if (!wrap || !svgEl || typeof d3 === 'undefined' || typeof topojson === 'undefined') return;

  const PAD = 28;
  const W = wrap.offsetWidth || 680;

  const svg = d3.select(svgEl);

  /* ── Filters ── */
  const defs = svg.append('defs');
  function makeGlow(id, blur) {
    const f = defs.append('filter').attr('id', id)
      .attr('x', '-60%').attr('y', '-60%').attr('width', '220%').attr('height', '220%');
    f.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', blur).attr('result', 'blur');
    const fm = f.append('feMerge');
    fm.append('feMergeNode').attr('in', 'blur');
    fm.append('feMergeNode').attr('in', 'SourceGraphic');
  }
  makeGlow('afRedGlow',   1.8);
  makeGlow('afWhiteGlow', 2.5);
  makeGlow('afPinGlow',   3.5);

  const projection = d3.geoMercator();
  const pathGen = d3.geoPath().projection(projection);

  d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(function(world) {
      const allGeos = world.objects.countries.geometries.filter(function(g) {
        return AFRICA_IDS.has(+g.id);
      });
      const countries = topojson.feature(world, { type: 'GeometryCollection', geometries: allGeos });
      const border  = topojson.mesh(world, world.objects.countries, function(a, b) {
        return a !== b && AFRICA_IDS.has(+a.id) && AFRICA_IDS.has(+b.id);
      });
      const outline = topojson.merge(world, allGeos);

      /* ── Step 1: fit width only, get actual pixel height from bounding box ── */
      projection.fitSize([W - PAD * 2, W * 2], outline); // generous height
      const bb = pathGen.bounds(outline);
      const H = Math.ceil(bb[1][1] - bb[0][1]) + PAD * 2;

      /* ── Step 2: refit to exact container ── */
      projection.fitExtent([[PAD, PAD], [W - PAD, H - PAD]], outline);

      svg.attr('viewBox', '0 0 ' + W + ' ' + H).attr('height', H);

      /* 1 — landmass fill */
      svg.append('g').selectAll('path')
        .data(countries.features)
        .enter().append('path')
        .attr('d', pathGen)
        .attr('fill', '#0d0d0d')
        .attr('stroke', 'none');

      /* 2 — country borders (red) */
      svg.append('path')
        .datum(border)
        .attr('d', pathGen)
        .attr('fill', 'none')
        .attr('stroke', '#D62828')
        .attr('stroke-width', 0.75)
        .attr('filter', 'url(#afRedGlow)');

      /* 3 — coastal outline (red, brighter/thicker than interior borders) */
      svg.append('path')
        .datum(outline)
        .attr('d', pathGen)
        .attr('fill', 'none')
        .attr('stroke', '#D62828')
        .attr('stroke-width', 1.8)
        .attr('filter', 'url(#afRedGlow)');

      /* 4 — city pins — placed by actual lat/lng via projection */
      cities.forEach(function(city) {
        var pos = projection([city.lng, city.lat]);
        if (!pos) return;
        var cx = +pos[0].toFixed(1);
        var cy = +pos[1].toFixed(1);
        var g = svg.append('g').attr('transform', 'translate(' + cx + ',' + cy + ')');

        g.append('circle').attr('class', 'af-ring af-ring1')
          .attr('r', 14).attr('fill', 'none')
          .attr('stroke', '#D62828').attr('stroke-width', 0.8);
        g.append('circle').attr('class', 'af-ring af-ring2')
          .attr('r', 14).attr('fill', 'none')
          .attr('stroke', '#D62828').attr('stroke-width', 0.8);

        g.append('circle').attr('r', 3.8)
          .attr('fill', '#D62828').attr('filter', 'url(#afPinGlow)');
        g.append('circle').attr('r', 1.6).attr('fill', '#ff5555');

        g.append('text')
          .attr('x', 0).attr('y', -11)
          .attr('text-anchor', 'middle')
          .attr('font-family', "'IBM Plex Mono', monospace")
          .attr('font-size', '6.5px')
          .attr('letter-spacing', '0.12em')
          .attr('fill', 'rgba(245,245,245,0.78)')
          .text(city.name);
      });
    })
    .catch(function(err) {
      console.warn('[0District] Africa map load error:', err);
    });
})();

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
