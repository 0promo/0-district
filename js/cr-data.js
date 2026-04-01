/* ════════════════════════════════════════════════════════════════
   0 DISTRICT — CONTROL ROOM DATA LAYER  v2.0
   Fetches + renders live Supabase data into CR panels
   Depends on: auth.js (for getSession, _restFetch helpers)
   ════════════════════════════════════════════════════════════════ */

const SB_URL_CR = 'https://awmvfkekwrjcrfllcepl.supabase.co';
const SB_KEY_CR = 'sb_publishable_Gpr3sOBF49RxB6xWUwO_PA_I7vk9enI';

/* ── REST helper (self-contained so cr-data.js can work standalone) */
async function crFetch(table, method = 'GET', params = '', body = null) {
  const session = getSession ? getSession() : null;
  const token   = session?.access_token || SB_KEY_CR;
  const url     = `${SB_URL_CR}/rest/v1/${table}${params ? '?' + params : ''}`;
  const headers = {
    'apikey': SB_KEY_CR,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Prefer': method !== 'GET' ? 'return=representation' : '',
  };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`DB ${res.status}`);
  return res.json().catch(() => ({}));
}

/* ── USER ID helper ────────────────────────────────────────────── */
function uid() {
  const session = getSession ? getSession() : null;
  return session?.user?.id || null;
}

/* ── PANEL RENDERING UTILITIES ──────────────────────────────────── */

function panelLoading(panelId) {
  const p = document.getElementById('panel-' + panelId);
  if (!p) return;
  p.innerHTML = `<div class="cr-loading"><div class="cr-load-dot"></div><div class="cr-load-dot"></div><div class="cr-load-dot"></div></div>`;
}

function panelEmpty(panelId, code, headline, sub, cta = null) {
  const p = document.getElementById('panel-' + panelId);
  if (!p) return;
  p.innerHTML = `
    <div class="cr-empty-state">
      <div class="cr-empty-code">${code}</div>
      <div class="cr-empty-headline">${headline}</div>
      <div class="cr-empty-sub">${sub}</div>
      ${cta ? `<button class="cr-empty-cta" onclick="${cta.fn}">${cta.label}</button>` : ''}
    </div>`;
}

function panelError(panelId) {
  const p = document.getElementById('panel-' + panelId);
  if (!p) return;
  p.innerHTML = `<div class="cr-empty-state"><div class="cr-empty-code">/ ERR</div><div class="cr-empty-headline">SIGNAL LOST.</div><div class="cr-empty-sub">Could not connect to the District. Check your connection.</div></div>`;
}

/* ════════════════════════════════════════════════════════════════
   ARTIST PANELS
════════════════════════════════════════════════════════════════ */

/* A-00: MY MUSIC ─────────────────────────────────────────────── */
async function dbRenderTracks(panelId = 'artist-music') {
  panelLoading(panelId);
  const p = document.getElementById('panel-' + panelId);
  if (!p) return;

  const userId = uid();

  try {
    const tracks = userId
      ? await crFetch('tracks', 'GET', `user_id=eq.${userId}&order=created_at.desc`)
      : [];

    if (!tracks.length) {
      p.innerHTML = `
        <div class="cr-empty-state">
          <div class="cr-empty-code">/ A-00 · MY MUSIC</div>
          <div class="cr-empty-headline">NOTHING<br>IN THE VAULT.</div>
          <div class="cr-empty-sub">Your tracks, plays, and revenue live here once you drop music into the District. Upload your first track to begin.</div>
          <button class="cr-empty-cta" onclick="switchPanel('artist-upload',document.querySelector('#nav-artist .cr-nav-item:nth-child(3)'))">UPLOAD A TRACK →</button>
        </div>`;
      return;
    }

    p.innerHTML = `
      <div class="cr-panel-header">
        <div class="cr-panel-title">MY MUSIC <span class="cr-count">${tracks.length} TRACKS</span></div>
        <button class="cr-action-btn" onclick="switchPanel('artist-upload',null)">+ UPLOAD TRACK</button>
      </div>
      <div class="cr-table">
        <div class="cr-table-head">
          <span>TITLE</span><span>GENRE</span><span>STATUS</span><span>PLAYS</span><span>REVENUE</span><span>ACTIONS</span>
        </div>
        <div class="cr-table-body">
          ${tracks.map(t => `
            <div class="cr-table-row">
              <span class="cr-cell-title">${t.title || 'Untitled'}</span>
              <span class="cr-cell-meta">${t.genre || '—'}</span>
              <span><span class="cr-status cr-status-${t.status || 'draft'}">${(t.status || 'draft').toUpperCase()}</span></span>
              <span class="cr-cell-num">${fmtNum(t.plays || 0)}</span>
              <span class="cr-cell-num">$${(t.revenue || 0).toFixed(2)}</span>
              <span class="cr-cell-actions">
                <button class="cr-row-btn" onclick="editTrack('${t.id}')">EDIT</button>
                <button class="cr-row-btn cr-row-btn-del" onclick="deleteTrack('${t.id}')">DEL</button>
              </span>
            </div>`).join('')}
        </div>
      </div>`;
  } catch (err) {
    panelError(panelId);
    console.warn('[CR] tracks load failed:', err);
  }
}

/* A-01: ANALYTICS ────────────────────────────────────────────── */
async function dbRenderAnalytics(panelId = 'artist-analytics') {
  panelLoading(panelId);
  const p = document.getElementById('panel-' + panelId);
  if (!p) return;

  const userId = uid();

  try {
    const tracks = userId
      ? await crFetch('tracks', 'GET', `user_id=eq.${userId}&select=title,plays,revenue,status`)
      : [];

    if (!tracks.length) {
      p.innerHTML = `
        <div class="cr-empty-state">
          <div class="cr-empty-code">/ A-01 · ANALYTICS</div>
          <div class="cr-empty-headline">NO SIGNAL<br>TO READ.</div>
          <div class="cr-empty-sub">Analytics activate when your music is live in the District. Plays, regions, listener depth — all visible once the catalog moves.</div>
        </div>`;
      return;
    }

    const totalPlays   = tracks.reduce((s, t) => s + (t.plays || 0), 0);
    const totalRevenue = tracks.reduce((s, t) => s + (t.revenue || 0), 0);
    const liveTracks   = tracks.filter(t => t.status === 'live').length;

    p.innerHTML = `
      <div class="cr-panel-header">
        <div class="cr-panel-title">ANALYTICS</div>
      </div>
      <div class="cr-stat-grid">
        <div class="cr-stat-card">
          <div class="cr-stat-val">${fmtNum(totalPlays)}</div>
          <div class="cr-stat-label">TOTAL PLAYS</div>
        </div>
        <div class="cr-stat-card">
          <div class="cr-stat-val">$${totalRevenue.toFixed(2)}</div>
          <div class="cr-stat-label">REVENUE MTD</div>
        </div>
        <div class="cr-stat-card">
          <div class="cr-stat-val">${liveTracks}</div>
          <div class="cr-stat-label">LIVE TRACKS</div>
        </div>
        <div class="cr-stat-card">
          <div class="cr-stat-val">${tracks.length}</div>
          <div class="cr-stat-label">TOTAL CATALOG</div>
        </div>
      </div>
      <div class="cr-panel-header" style="margin-top:28px;">
        <div class="cr-panel-title" style="font-size:9px;">TRACK BREAKDOWN</div>
      </div>
      <div class="cr-table">
        <div class="cr-table-head"><span>TITLE</span><span>STATUS</span><span>PLAYS</span><span>REVENUE</span></div>
        <div class="cr-table-body">
          ${tracks.map(t => `
            <div class="cr-table-row">
              <span class="cr-cell-title">${t.title}</span>
              <span><span class="cr-status cr-status-${t.status || 'draft'}">${(t.status||'DRAFT').toUpperCase()}</span></span>
              <span class="cr-cell-num">${fmtNum(t.plays || 0)}</span>
              <span class="cr-cell-num">$${(t.revenue || 0).toFixed(2)}</span>
            </div>`).join('')}
        </div>
      </div>`;
  } catch { panelError(panelId); }
}

/* A-02: UPLOAD — form is static HTML, this wires the submit */
async function submitTrack() {
  const userId = uid();
  if (!userId) { showToast('SIGN IN TO UPLOAD', 'info'); openSignIn && openSignIn(); return; }

  const get = (sel) => document.querySelector(sel)?.value?.trim() || '';
  const title       = get('#panel-artist-upload .form-input[placeholder="UNTITLED TRACK"]');
  const artistName  = get('#panel-artist-upload .form-input[placeholder="YOUR NAME"]');
  const genre       = get('#panel-artist-upload .form-input[placeholder="AFROBEATS"]');
  const description = get('#panel-artist-upload textarea');
  const soundcloud  = get('#panel-artist-upload .form-input[placeholder*="soundcloud"]');
  const youtube     = get('#panel-artist-upload .form-input[placeholder*="youtube"]');
  const spotify     = get('#panel-artist-upload .form-input[placeholder*="spotify"]');

  if (!title) { showToast('ADD A TRACK TITLE FIRST', 'info'); return; }

  const btn = document.querySelector('#panel-artist-upload .btn-submit');
  if (btn) { btn.textContent = 'SUBMITTING...'; btn.disabled = true; }

  try {
    await crFetch('tracks', 'POST', '', [{
      user_id:     userId,
      title,
      artist_name: artistName || getUserMeta('artist_name') || '',
      genre,
      description,
      soundcloud:  soundcloud || null,
      youtube:     youtube || null,
      spotify:     spotify || null,
      status:      'draft',
    }]);

    showToast('TRACK SUBMITTED TO THE DISTRICT ✓', 'success');
    // Refresh music panel
    await dbRenderTracks('artist-music');
    switchPanel('artist-music', document.querySelector('#nav-artist .cr-nav-item'));
  } catch (err) {
    showToast('SUBMISSION FAILED — TRY AGAIN', 'error');
    console.error(err);
  } finally {
    if (btn) { btn.textContent = 'SUBMIT TRACK →'; btn.disabled = false; }
  }
}

/* A-03: COLLABS */
async function dbRenderCollabs(panelId = 'artist-collabs') {
  panelLoading(panelId);
  const p = document.getElementById('panel-' + panelId);
  if (!p) return;

  const userId = uid();

  try {
    const collabs = userId
      ? await crFetch('collabs', 'GET', `user_id=eq.${userId}&order=created_at.desc`)
      : [];

    if (!collabs.length) {
      p.innerHTML = `
        <div class="cr-empty-state">
          <div class="cr-empty-code">/ A-03 · COLLABS</div>
          <div class="cr-empty-headline">NO ACTIVE<br>COLLABS.</div>
          <div class="cr-empty-sub">The District connects artists, producers, and vocalists across the continent. Post what you need — let the talent come to you.</div>
          <button class="cr-empty-cta" onclick="showNewCollabForm()">+ POST A COLLAB REQUEST</button>
        </div>`;
      return;
    }

    p.innerHTML = `
      <div class="cr-panel-header">
        <div class="cr-panel-title">COLLABS <span class="cr-count">${collabs.length}</span></div>
        <button class="cr-action-btn" onclick="showNewCollabForm()">+ NEW COLLAB</button>
      </div>
      <div class="cr-table">
        <div class="cr-table-head"><span>TITLE</span><span>TYPE</span><span>GENRE</span><span>STATUS</span></div>
        <div class="cr-table-body">
          ${collabs.map(c => `
            <div class="cr-table-row">
              <span class="cr-cell-title">${c.title}</span>
              <span class="cr-cell-meta">${c.type || '—'}</span>
              <span class="cr-cell-meta">${c.genre || '—'}</span>
              <span><span class="cr-status cr-status-${c.status}">${c.status.toUpperCase()}</span></span>
            </div>`).join('')}
        </div>
      </div>`;
  } catch { panelError(panelId); }
}

/* A-04: NOTIFICATIONS */
async function dbRenderNotifs(panelId = 'artist-notifs') {
  panelLoading(panelId);
  const p = document.getElementById('panel-' + panelId);
  if (!p) return;

  const userId = uid();

  try {
    const notifs = userId
      ? await crFetch('notifications', 'GET', `user_id=eq.${userId}&order=created_at.desc&limit=20`)
      : [];

    if (!notifs.length) {
      p.innerHTML = `
        <div class="cr-empty-state">
          <div class="cr-empty-code">/ A-04 · NOTIFICATIONS</div>
          <div class="cr-empty-headline">NOTHING<br>YET.</div>
          <div class="cr-empty-sub">Activity from plays, follows, collabs, editorial reviews, and revenue will surface here. Make your move first.</div>
        </div>`;
      return;
    }

    // Mark all as read
    if (userId) {
      crFetch('notifications', 'PATCH', `user_id=eq.${userId}&read=eq.false`, { read: true }).catch(() => {});
    }

    p.innerHTML = `
      <div class="cr-panel-header">
        <div class="cr-panel-title">NOTIFICATIONS <span class="cr-count">${notifs.filter(n=>!n.read).length} NEW</span></div>
      </div>
      <div class="cr-notif-list">
        ${notifs.map(n => `
          <div class="cr-notif-row ${n.read ? '' : 'cr-notif-unread'}">
            <span class="cr-notif-badge cr-notif-${(n.type||'system').toLowerCase()}">${(n.type||'SYS').toUpperCase()}</span>
            <div class="cr-notif-content">
              <div class="cr-notif-msg">${n.message || ''}</div>
              ${n.actor ? `<div class="cr-notif-actor">from ${n.actor}</div>` : ''}
            </div>
            <span class="cr-notif-time">${timeAgo(n.created_at)}</span>
          </div>`).join('')}
      </div>`;
  } catch { panelError(panelId); }
}

/* ════════════════════════════════════════════════════════════════
   LABEL PANELS
════════════════════════════════════════════════════════════════ */

/* L-00: ROSTER */
async function dbRenderRoster(panelId = 'label-roster') {
  panelLoading(panelId);
  const p = document.getElementById('panel-' + panelId);
  if (!p) return;

  const userId = uid();

  try {
    const roster = userId
      ? await crFetch('label_roster', 'GET', `label_user_id=eq.${userId}&order=created_at.desc`)
      : [];

    if (!roster.length) {
      p.innerHTML = `
        <div class="cr-empty-state">
          <div class="cr-empty-code">/ L-00 · ROSTER</div>
          <div class="cr-empty-headline">YOUR ROSTER<br>IS EMPTY.</div>
          <div class="cr-empty-sub">Sign artists, build your lineup. Every act in the District belongs here once they're in your camp.</div>
          <button class="cr-empty-cta" onclick="showAddArtistForm()">+ ADD AN ARTIST</button>
        </div>`;
      return;
    }

    p.innerHTML = `
      <div class="cr-panel-header">
        <div class="cr-panel-title">ROSTER <span class="cr-count">${roster.length} ARTISTS</span></div>
        <button class="cr-action-btn" onclick="showAddArtistForm()">+ ADD ARTIST</button>
      </div>
      <div class="cr-table">
        <div class="cr-table-head"><span>ARTIST NAME</span><span>GENRE</span><span>CITY</span><span>MONTHLY PLAYS</span><span>STATUS</span></div>
        <div class="cr-table-body">
          ${roster.map(a => `
            <div class="cr-table-row">
              <span class="cr-cell-title">${a.artist_name}</span>
              <span class="cr-cell-meta">${a.genre || '—'}</span>
              <span class="cr-cell-meta">${a.city || '—'}</span>
              <span class="cr-cell-num">${fmtNum(a.monthly_plays || 0)}</span>
              <span><span class="cr-status cr-status-${a.status}">${a.status.toUpperCase()}</span></span>
            </div>`).join('')}
        </div>
      </div>`;
  } catch { panelError(panelId); }
}

/* L-01: RELEASES */
async function dbRenderReleases(panelId = 'label-releases') {
  panelLoading(panelId);
  const p = document.getElementById('panel-' + panelId);
  if (!p) return;

  const userId = uid();

  try {
    const releases = userId
      ? await crFetch('releases', 'GET', `label_user_id=eq.${userId}&order=release_date.desc`)
      : [];

    if (!releases.length) {
      p.innerHTML = `
        <div class="cr-empty-state">
          <div class="cr-empty-code">/ L-01 · RELEASES</div>
          <div class="cr-empty-headline">NO RELEASES<br>SCHEDULED.</div>
          <div class="cr-empty-sub">Queue up drops, confirm release dates, and push to DSPs from here. Add music to the District to see the pipeline build.</div>
          <button class="cr-empty-cta" onclick="showNewReleaseForm()">+ SCHEDULE A RELEASE</button>
        </div>`;
      return;
    }

    p.innerHTML = `
      <div class="cr-panel-header">
        <div class="cr-panel-title">RELEASES <span class="cr-count">${releases.length}</span></div>
        <button class="cr-action-btn" onclick="showNewReleaseForm()">+ NEW RELEASE</button>
      </div>
      <div class="cr-table">
        <div class="cr-table-head"><span>TITLE</span><span>ARTIST</span><span>RELEASE DATE</span><span>DSPS</span><span>STATUS</span></div>
        <div class="cr-table-body">
          ${releases.map(r => `
            <div class="cr-table-row">
              <span class="cr-cell-title">${r.title}</span>
              <span class="cr-cell-meta">${r.artist_name || '—'}</span>
              <span class="cr-cell-meta">${r.release_date || '—'}</span>
              <span class="cr-cell-meta">${r.dsps || '—'}</span>
              <span><span class="cr-status cr-status-${r.status}">${r.status.toUpperCase()}</span></span>
            </div>`).join('')}
        </div>
      </div>`;
  } catch { panelError(panelId); }
}

/* L-02: LABEL ANALYTICS */
async function dbRenderLabelAnalytics(panelId = 'label-analytics') {
  panelLoading(panelId);
  const p = document.getElementById('panel-' + panelId);
  if (!p) return;

  const userId = uid();

  try {
    const [roster, releases] = await Promise.all([
      userId ? crFetch('label_roster', 'GET', `label_user_id=eq.${userId}&select=monthly_plays,track_count,status`) : Promise.resolve([]),
      userId ? crFetch('releases', 'GET', `label_user_id=eq.${userId}&select=status`) : Promise.resolve([]),
    ]);

    const totalPlays = roster.reduce((s, a) => s + (a.monthly_plays || 0), 0);
    const totalTracks = roster.reduce((s, a) => s + (a.track_count || 0), 0);

    if (!roster.length && !releases.length) {
      p.innerHTML = `
        <div class="cr-empty-state">
          <div class="cr-empty-code">/ L-02 · LABEL ANALYTICS</div>
          <div class="cr-empty-headline">NO LABEL<br>DATA.</div>
          <div class="cr-empty-sub">Revenue, territory reach, and catalog performance — all visible once your roster is active and music is moving in the District.</div>
        </div>`;
      return;
    }

    p.innerHTML = `
      <div class="cr-panel-header"><div class="cr-panel-title">LABEL ANALYTICS</div></div>
      <div class="cr-stat-grid">
        <div class="cr-stat-card"><div class="cr-stat-val">${roster.length}</div><div class="cr-stat-label">ARTISTS SIGNED</div></div>
        <div class="cr-stat-card"><div class="cr-stat-val">${fmtNum(totalPlays)}</div><div class="cr-stat-label">MONTHLY PLAYS</div></div>
        <div class="cr-stat-card"><div class="cr-stat-val">${totalTracks}</div><div class="cr-stat-label">CATALOG TRACKS</div></div>
        <div class="cr-stat-card"><div class="cr-stat-val">${releases.filter(r=>r.status==='live').length}</div><div class="cr-stat-label">LIVE RELEASES</div></div>
      </div>`;
  } catch { panelError(panelId); }
}

/* L-03: SUBMISSIONS INBOX */
async function dbRenderSubmissionsInbox(panelId = 'label-submissions') {
  const p = document.getElementById('panel-' + panelId);
  if (!p) return;
  // This panel is passive — show instructions
  p.innerHTML = `
    <div class="cr-empty-state">
      <div class="cr-empty-code">/ L-03 · SUBMISSIONS INBOX</div>
      <div class="cr-empty-headline">INBOX<br>IS CLEAR.</div>
      <div class="cr-empty-sub">Demo pitches from artists across the continent land here. When word is out about your label, this fills up fast. Share your label page to start receiving.</div>
    </div>`;
}

/* L-04: DEAL PIPELINE */
async function dbRenderDeals(panelId = 'label-deals') {
  panelLoading(panelId);
  const p = document.getElementById('panel-' + panelId);
  if (!p) return;

  const userId = uid();

  try {
    const deals = userId
      ? await crFetch('deals', 'GET', `label_user_id=eq.${userId}&order=created_at.desc`)
      : [];

    if (!deals.length) {
      p.innerHTML = `
        <div class="cr-empty-state">
          <div class="cr-empty-code">/ L-04 · DEAL PIPELINE</div>
          <div class="cr-empty-headline">NO DEALS<br>IN PIPELINE.</div>
          <div class="cr-empty-sub">Distribution pacts, remix licenses, and territory deals are tracked here. Start a conversation in the District to initiate.</div>
          <button class="cr-empty-cta" onclick="showNewDealForm()">+ ADD A DEAL</button>
        </div>`;
      return;
    }

    p.innerHTML = `
      <div class="cr-panel-header">
        <div class="cr-panel-title">DEAL PIPELINE <span class="cr-count">${deals.length}</span></div>
        <button class="cr-action-btn" onclick="showNewDealForm()">+ NEW DEAL</button>
      </div>
      <div class="cr-table">
        <div class="cr-table-head"><span>ARTIST</span><span>TYPE</span><span>TERRITORY</span><span>STAGE</span><span>STATUS</span></div>
        <div class="cr-table-body">
          ${deals.map(d => `
            <div class="cr-table-row">
              <span class="cr-cell-title">${d.artist_name}</span>
              <span class="cr-cell-meta">${d.deal_type || '—'}</span>
              <span class="cr-cell-meta">${d.territory || 'GLOBAL'}</span>
              <span class="cr-cell-meta">${d.stage || '—'}</span>
              <span><span class="cr-status cr-status-${d.status}">${d.status.toUpperCase()}</span></span>
            </div>`).join('')}
        </div>
      </div>`;
  } catch { panelError(panelId); }
}

/* ════════════════════════════════════════════════════════════════
   CURATOR PANELS
════════════════════════════════════════════════════════════════ */

/* C-00: EDITORIAL QUEUE */
async function dbRenderEditorialQueue(panelId = 'curator-queue') {
  panelLoading(panelId);
  const p = document.getElementById('panel-' + panelId);
  if (!p) return;

  const userId = uid();

  try {
    const queue = userId
      ? await crFetch('editorial_queue', 'GET', `curator_user_id=eq.${userId}&order=created_at.desc`)
      : [];

    if (!queue.length) {
      p.innerHTML = `
        <div class="cr-empty-state">
          <div class="cr-empty-code">/ C-00 · EDITORIAL QUEUE</div>
          <div class="cr-empty-headline">THE QUEUE<br>IS EMPTY.</div>
          <div class="cr-empty-sub">Tracks and essays submitted for editorial placement and review will surface here. Open submissions to the District and the queue fills.</div>
          <button class="cr-empty-cta" onclick="showAddToQueueForm()">+ ADD TO QUEUE</button>
        </div>`;
      return;
    }

    p.innerHTML = `
      <div class="cr-panel-header">
        <div class="cr-panel-title">EDITORIAL QUEUE <span class="cr-count">${queue.length}</span></div>
        <button class="cr-action-btn" onclick="showAddToQueueForm()">+ ADD ITEM</button>
      </div>
      <div class="cr-table">
        <div class="cr-table-head"><span>TITLE</span><span>ARTIST</span><span>GENRE</span><span>READ TIME</span><span>STATUS</span></div>
        <div class="cr-table-body">
          ${queue.map(q => `
            <div class="cr-table-row">
              <span class="cr-cell-title">${q.title}</span>
              <span class="cr-cell-meta">${q.artist_name || '—'}</span>
              <span class="cr-cell-meta">${q.genre || '—'}</span>
              <span class="cr-cell-meta">${q.read_time || '—'}</span>
              <span><span class="cr-status cr-status-${q.status}">${q.status.toUpperCase()}</span>
                <button class="cr-row-btn" style="margin-left:8px;" onclick="updateQueueStatus('${q.id}','published')">PUB</button>
              </span>
            </div>`).join('')}
        </div>
      </div>`;
  } catch { panelError(panelId); }
}

/* C-01: FEATURED PICKS */
async function dbRenderFeaturedPicks(panelId = 'curator-picks') {
  panelLoading(panelId);
  const p = document.getElementById('panel-' + panelId);
  if (!p) return;

  const userId = uid();

  try {
    const picks = userId
      ? await crFetch('featured_picks', 'GET', `curator_user_id=eq.${userId}&order=created_at.desc`)
      : [];

    if (!picks.length) {
      p.innerHTML = `
        <div class="cr-empty-state">
          <div class="cr-empty-code">/ C-01 · FEATURED PICKS</div>
          <div class="cr-empty-headline">NOTHING ON<br>THE BOARD.</div>
          <div class="cr-empty-sub">The District editorial slot is yours. Curate what matters — the sounds that define this moment in African music. Put something up.</div>
          <button class="cr-empty-cta" onclick="showNewPickForm()">+ ADD FEATURED PICK</button>
        </div>`;
      return;
    }

    p.innerHTML = `
      <div class="cr-panel-header">
        <div class="cr-panel-title">FEATURED PICKS <span class="cr-count">${picks.length}</span></div>
        <button class="cr-action-btn" onclick="showNewPickForm()">+ NEW PICK</button>
      </div>
      <div class="cr-table">
        <div class="cr-table-head"><span>TITLE</span><span>ARTIST</span><span>GENRE</span><span>FEATURED FROM</span><span>STATUS</span></div>
        <div class="cr-table-body">
          ${picks.map(pick => `
            <div class="cr-table-row">
              <span class="cr-cell-title">${pick.title}</span>
              <span class="cr-cell-meta">${pick.artist_name || '—'}</span>
              <span class="cr-cell-meta">${pick.genre || '—'}</span>
              <span class="cr-cell-meta">${pick.featured_from || '—'}</span>
              <span><span class="cr-status cr-status-${pick.status}">${pick.status.toUpperCase()}</span></span>
            </div>`).join('')}
        </div>
      </div>`;
  } catch { panelError(panelId); }
}

/* C-02: ESSAY SUBMISSIONS */
async function dbRenderEssaySubmissions(panelId = 'curator-submissions') {
  panelLoading(panelId);
  const p = document.getElementById('panel-' + panelId);
  if (!p) return;

  const userId = uid();

  try {
    const subs = userId
      ? await crFetch('essay_submissions', 'GET', `curator_user_id=eq.${userId}&order=created_at.desc`)
      : [];

    if (!subs.length) {
      p.innerHTML = `
        <div class="cr-empty-state">
          <div class="cr-empty-code">/ C-02 · SUBMISSION INBOX</div>
          <div class="cr-empty-headline">NO ESSAY<br>PITCHES YET.</div>
          <div class="cr-empty-sub">When artists and writers send editorial pitches for the District, they arrive here. Accept the ones that belong — pass on the rest.</div>
        </div>`;
      return;
    }

    p.innerHTML = `
      <div class="cr-panel-header">
        <div class="cr-panel-title">SUBMISSION INBOX <span class="cr-count">${subs.length}</span></div>
      </div>
      <div class="cr-table">
        <div class="cr-table-head"><span>TITLE</span><span>AUTHOR</span><span>GENRE</span><span>STATUS</span><span>ACTIONS</span></div>
        <div class="cr-table-body">
          ${subs.map(s => `
            <div class="cr-table-row">
              <span class="cr-cell-title">${s.title}</span>
              <span class="cr-cell-meta">${s.author_name || '—'}</span>
              <span class="cr-cell-meta">${s.genre || '—'}</span>
              <span><span class="cr-status cr-status-${s.status}">${s.status.toUpperCase()}</span></span>
              <span class="cr-cell-actions">
                <button class="cr-row-btn" onclick="updateSubStatus('${s.id}','accepted')">ACCEPT</button>
                <button class="cr-row-btn cr-row-btn-del" onclick="updateSubStatus('${s.id}','declined')">PASS</button>
              </span>
            </div>`).join('')}
        </div>
      </div>`;
  } catch { panelError(panelId); }
}

/* C-04: MY ESSAYS */
async function dbRenderEssays(panelId = 'curator-essays') {
  panelLoading(panelId);
  const p = document.getElementById('panel-' + panelId);
  if (!p) return;

  const userId = uid();

  try {
    const essays = userId
      ? await crFetch('essays', 'GET', `curator_user_id=eq.${userId}&order=created_at.desc`)
      : [];

    if (!essays.length) {
      p.innerHTML = `
        <div class="cr-empty-state">
          <div class="cr-empty-code">/ C-04 · MY ESSAYS</div>
          <div class="cr-empty-headline">NO ESSAYS<br>PUBLISHED.</div>
          <div class="cr-empty-sub">Your editorial work lives here. Draft pieces, review incoming pitches, and push culture forward in print. Start writing.</div>
          <button class="cr-empty-cta" onclick="showNewEssayForm()">+ START AN ESSAY</button>
        </div>`;
      return;
    }

    p.innerHTML = `
      <div class="cr-panel-header">
        <div class="cr-panel-title">MY ESSAYS <span class="cr-count">${essays.length}</span></div>
        <button class="cr-action-btn" onclick="showNewEssayForm()">+ NEW ESSAY</button>
      </div>
      <div class="cr-table">
        <div class="cr-table-head"><span>TITLE</span><span>GENRE</span><span>READ TIME</span><span>READS</span><span>STATUS</span></div>
        <div class="cr-table-body">
          ${essays.map(e => `
            <div class="cr-table-row">
              <span class="cr-cell-title">${e.title}</span>
              <span class="cr-cell-meta">${e.genre || '—'}</span>
              <span class="cr-cell-meta">${e.read_time || '—'}</span>
              <span class="cr-cell-num">${fmtNum(e.reads || 0)}</span>
              <span><span class="cr-status cr-status-${e.status}">${e.status.toUpperCase()}</span></span>
            </div>`).join('')}
        </div>
      </div>`;
  } catch { panelError(panelId); }
}

/* ════════════════════════════════════════════════════════════════
   QUICK ACTION FORMS  (inline modals)
════════════════════════════════════════════════════════════════ */

function showQuickForm(title, fields, onSubmit) {
  let overlay = document.getElementById('crQuickForm');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'crQuickForm';
    document.body.appendChild(overlay);
  }
  overlay.className = 'cr-quick-form-overlay';
  overlay.innerHTML = `
    <div class="cr-quick-form-box">
      <button class="cr-quick-close" onclick="document.getElementById('crQuickForm').style.display='none'">✕</button>
      <div class="cr-quick-title">${title}</div>
      <div class="cr-quick-fields" id="crQFields">
        ${fields.map(f => `
          <div class="form-field">
            <label class="form-label">${f.label}</label>
            ${f.type === 'select'
              ? `<select class="form-input" id="qf_${f.key}">${f.options.map(o=>`<option value="${o.v}">${o.l}</option>`).join('')}</select>`
              : f.type === 'textarea'
              ? `<textarea class="form-input" id="qf_${f.key}" rows="3" placeholder="${f.placeholder||''}"></textarea>`
              : `<input class="form-input" id="qf_${f.key}" type="${f.type||'text'}" placeholder="${f.placeholder||''}">`
            }
          </div>`).join('')}
      </div>
      <button class="btn-submit" style="margin-top:20px;width:100%;" id="crQSubmitBtn">SUBMIT →</button>
    </div>`;
  overlay.style.display = 'flex';

  document.getElementById('crQSubmitBtn').onclick = async () => {
    const vals = {};
    fields.forEach(f => {
      const el = document.getElementById('qf_' + f.key);
      vals[f.key] = el?.value?.trim() || '';
    });
    const btn = document.getElementById('crQSubmitBtn');
    btn.textContent = 'SAVING...'; btn.disabled = true;
    try {
      await onSubmit(vals);
      overlay.style.display = 'none';
    } catch (e) {
      btn.textContent = 'ERROR — TRY AGAIN'; btn.disabled = false;
      showToast('SUBMISSION FAILED', 'error');
    }
  };
}

function showNewCollabForm() {
  showQuickForm('/ NEW COLLAB REQUEST', [
    { key:'title',       label:'Collab Title',   type:'text', placeholder:'UNTITLED COLLAB' },
    { key:'type',        label:'Type',           type:'select', options:[{v:'VOCALS',l:'VOCALS'},{v:'PRODUCTION',l:'PRODUCTION'},{v:'MIXING',l:'MIXING'},{v:'REMIX',l:'REMIX'},{v:'WRITING',l:'WRITING'}] },
    { key:'genre',       label:'Genre',          type:'text', placeholder:'AFROBEATS' },
    { key:'description', label:'Description',    type:'textarea', placeholder:'What are you looking for?' },
  ], async (vals) => {
    await crFetch('collabs','POST','', [{ user_id: uid(), ...vals, status:'open' }]);
    showToast('COLLAB POSTED ✓', 'success');
    dbRenderCollabs('artist-collabs');
  });
}

function showAddArtistForm() {
  showQuickForm('/ ADD ARTIST TO ROSTER', [
    { key:'artist_name', label:'Artist Name',    type:'text', placeholder:'ARTIST NAME' },
    { key:'genre',       label:'Genre',          type:'text', placeholder:'AFROBEATS' },
    { key:'city',        label:'City',           type:'text', placeholder:'ACCRA' },
    { key:'country',     label:'Country',        type:'text', placeholder:'GH' },
    { key:'status',      label:'Status',         type:'select', options:[{v:'active',l:'ACTIVE'},{v:'in_talks',l:'IN TALKS'},{v:'inactive',l:'INACTIVE'}] },
  ], async (vals) => {
    await crFetch('label_roster','POST','', [{ label_user_id: uid(), ...vals }]);
    showToast('ARTIST ADDED TO ROSTER ✓', 'success');
    dbRenderRoster('label-roster');
  });
}

function showNewReleaseForm() {
  showQuickForm('/ SCHEDULE RELEASE', [
    { key:'title',        label:'Release Title',   type:'text',  placeholder:'UNTITLED' },
    { key:'artist_name',  label:'Artist Name',     type:'text',  placeholder:'ARTIST' },
    { key:'release_date', label:'Release Date',    type:'date'  },
    { key:'genre',        label:'Genre',           type:'text',  placeholder:'AFROBEATS' },
    { key:'dsps',         label:'DSPs (comma sep)', type:'text', placeholder:'Spotify,Apple Music,Tidal' },
    { key:'status',       label:'Status',          type:'select', options:[{v:'pending',l:'PENDING'},{v:'confirmed',l:'CONFIRMED'},{v:'live',l:'LIVE'}] },
  ], async (vals) => {
    await crFetch('releases','POST','', [{ label_user_id: uid(), ...vals }]);
    showToast('RELEASE SCHEDULED ✓', 'success');
    dbRenderReleases('label-releases');
  });
}

function showNewDealForm() {
  showQuickForm('/ ADD DEAL TO PIPELINE', [
    { key:'artist_name', label:'Artist Name', type:'text', placeholder:'ARTIST' },
    { key:'deal_type',   label:'Deal Type',   type:'select', options:[{v:'Distribution',l:'DISTRIBUTION'},{v:'Remix License',l:'REMIX LICENSE'},{v:'Licensing',l:'LICENSING'},{v:'Publishing',l:'PUBLISHING'}] },
    { key:'territory',   label:'Territory',   type:'text', placeholder:'GLOBAL' },
    { key:'stage',       label:'Stage',       type:'text', placeholder:'NEGOTIATION' },
    { key:'status',      label:'Status',      type:'select', options:[{v:'early',l:'EARLY'},{v:'pending',l:'PENDING'},{v:'review',l:'IN REVIEW'},{v:'closed',l:'CLOSED'}] },
  ], async (vals) => {
    await crFetch('deals','POST','', [{ label_user_id: uid(), ...vals }]);
    showToast('DEAL ADDED ✓', 'success');
    dbRenderDeals('label-deals');
  });
}

function showAddToQueueForm() {
  showQuickForm('/ ADD TO EDITORIAL QUEUE', [
    { key:'title',       label:'Title',       type:'text',   placeholder:'TRACK OR ESSAY TITLE' },
    { key:'artist_name', label:'Artist Name', type:'text',   placeholder:'ARTIST' },
    { key:'genre',       label:'Genre',       type:'text',   placeholder:'AFROBEATS' },
    { key:'read_time',   label:'Read Time',   type:'text',   placeholder:'5 MIN' },
    { key:'notes',       label:'Notes',       type:'textarea', placeholder:'Editorial context...' },
  ], async (vals) => {
    await crFetch('editorial_queue','POST','', [{ curator_user_id: uid(), ...vals, status:'pending' }]);
    showToast('ADDED TO QUEUE ✓', 'success');
    dbRenderEditorialQueue('curator-queue');
  });
}

function showNewPickForm() {
  showQuickForm('/ ADD FEATURED PICK', [
    { key:'title',        label:'Track / Essay Title', type:'text', placeholder:'TITLE' },
    { key:'artist_name',  label:'Artist Name',         type:'text', placeholder:'ARTIST' },
    { key:'genre',        label:'Genre',               type:'text', placeholder:'AFROBEATS' },
    { key:'featured_from',label:'Feature Date',        type:'date' },
    { key:'notes',        label:'Notes',               type:'textarea', placeholder:'Why this pick?' },
  ], async (vals) => {
    await crFetch('featured_picks','POST','', [{ curator_user_id: uid(), ...vals, status:'queued' }]);
    showToast('PICK ADDED ✓', 'success');
    dbRenderFeaturedPicks('curator-picks');
  });
}

function showNewEssayForm() {
  showQuickForm('/ START NEW ESSAY', [
    { key:'title',     label:'Essay Title', type:'text', placeholder:'ESSAY TITLE' },
    { key:'genre',     label:'Genre',       type:'text', placeholder:'AFROBEATS' },
    { key:'read_time', label:'Read Time',   type:'text', placeholder:'8 MIN READ' },
  ], async (vals) => {
    await crFetch('essays','POST','', [{ curator_user_id: uid(), ...vals, status:'draft', reads:0 }]);
    showToast('ESSAY DRAFT CREATED ✓', 'success');
    dbRenderEssays('curator-essays');
  });
}

/* ── STATUS UPDATES ─────────────────────────────────────────── */
async function updateQueueStatus(id, status) {
  try {
    await crFetch('editorial_queue', 'PATCH', `id=eq.${id}`, { status });
    showToast('STATUS UPDATED ✓', 'success');
    dbRenderEditorialQueue('curator-queue');
  } catch { showToast('UPDATE FAILED', 'error'); }
}

async function updateSubStatus(id, status) {
  try {
    await crFetch('essay_submissions', 'PATCH', `id=eq.${id}`, { status });
    showToast('STATUS UPDATED ✓', 'success');
    dbRenderEssaySubmissions('curator-submissions');
  } catch { showToast('UPDATE FAILED', 'error'); }
}

async function deleteTrack(id) {
  if (!confirm('Delete this track from the District?')) return;
  try {
    await crFetch('tracks', 'DELETE', `id=eq.${id}`);
    showToast('TRACK REMOVED', 'success');
    dbRenderTracks('artist-music');
  } catch { showToast('DELETE FAILED', 'error'); }
}

function editTrack(id) {
  showToast('EDIT COMING SOON — FULL STUDIO PANEL IN NEXT BUILD', 'info');
}

/* ── UTILS ───────────────────────────────────────────────────── */
function fmtNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'NOW';
  if (mins < 60) return `${mins}M AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}H AGO`;
  return `${Math.floor(hrs / 24)}D AGO`;
}

/* ── SIDEBAR PROFILE POPULATE ─────────────────────────────────── */
async function populateCRProfile() {
  const user = getCurrentUser ? getCurrentUser() : null;
  if (!user) return;

  const meta      = user.user_metadata || {};
  const name      = meta.full_name || user.email?.split('@')[0] || 'OPERATOR';
  const role      = meta.role || 'artist';
  const initials  = name.split(' ').map(w => w[0] || '').join('').substring(0,2).toUpperCase() || '0D';

  const nameEl   = document.getElementById('crName');
  const avatarEl = document.getElementById('crAvatarText');
  const badgeEl  = document.getElementById('crRoleBadge');

  if (nameEl)   nameEl.textContent   = name.toUpperCase();
  if (avatarEl) avatarEl.textContent = initials;
  if (badgeEl)  badgeEl.textContent  = ROLE_LABELS_CR[role] || 'District Operator';

  // Auto-switch to user's role tab
  const roleTabEl = document.querySelector(`.role-tab[onclick*="'${role}'"]`);
  if (roleTabEl && typeof switchRole === 'function') {
    setTimeout(() => roleTabEl.click(), 100);
  }

  // Load data for default role
  setTimeout(() => {
    if (role === 'artist') {
      dbRenderTracks('artist-music');
      dbRenderAnalytics('artist-analytics');
      dbRenderCollabs('artist-collabs');
      dbRenderNotifs('artist-notifs');
    } else if (role === 'label') {
      dbRenderRoster('label-roster');
      dbRenderReleases('label-releases');
      dbRenderLabelAnalytics('label-analytics');
      dbRenderDeals('label-deals');
      dbRenderSubmissionsInbox('label-submissions');
    } else if (role === 'curator') {
      dbRenderEditorialQueue('curator-queue');
      dbRenderFeaturedPicks('curator-picks');
      dbRenderEssaySubmissions('curator-submissions');
      dbRenderEssays('curator-essays');
    }
  }, 200);
}

const ROLE_LABELS_CR = {
  artist:  'District Artist',
  label:   'Label Operative',
  curator: 'Editorial Curator',
};

/* ── INIT ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', populateCRProfile);
