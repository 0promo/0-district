/* ═══════════════════════════════════════════════════════════════
   0 DISTRICT — SUPABASE DATA LAYER
   ═══════════════════════════════════════════════════════════════
   Replaces convex-layer.js mock data with real Supabase calls.
   Uses the PostgREST REST API — no SDK needed.
   Depends on DistrictAuth (product.js) for session tokens.
   ═══════════════════════════════════════════════════════════════ */

var _DB_BASE = 'https://awmvfkekwrjcrfllcepl.supabase.co/rest/v1';
var _DB_KEY  = 'sb_publishable_Gpr3sOBF49RxB6xWUwO_PA_I7vk9enI';

var DistrictDB = {

  /* ── HELPERS ──────────────────────────────────────────────── */

  _headers: function(method) {
    var s = (typeof DistrictAuth !== 'undefined') ? DistrictAuth.session() : null;
    var h = {
      'apikey':       _DB_KEY,
      'Content-Type': 'application/json'
    };
    if (s && s.t) h['Authorization'] = 'Bearer ' + s.t;
    if (method === 'POST') h['Prefer'] = 'return=representation';
    if (method === 'PATCH') h['Prefer'] = 'return=representation';
    return h;
  },

  _req: function(method, table, params, body) {
    var url = _DB_BASE + '/' + table;
    if (params) url += '?' + params;
    var opts = { method: method, headers: DistrictDB._headers(method) };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function(r) {
      if (r.status === 204) return [];
      return r.json().then(function(d) {
        if (!r.ok) {
          var msg = (d && (d.message || d.hint || d.error)) || ('HTTP ' + r.status);
          throw new Error(msg);
        }
        return Array.isArray(d) ? d : [d];
      });
    });
  },

  _userId: function() {
    var s = (typeof DistrictAuth !== 'undefined') ? DistrictAuth.session() : null;
    return s && s.u ? s.u.id : null;
  },

  /* ── PROFILE ──────────────────────────────────────────────── */

  getProfile: function() {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.resolve(null);
    return DistrictDB._req('GET', 'profiles', 'id=eq.' + uid + '&select=*')
      .then(function(rows) { return rows[0] || null; });
  },

  upsertProfile: function(data) {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.reject(new Error('Not logged in'));
    data.id = uid;
    return fetch(_DB_BASE + '/profiles?on_conflict=id', {
      method: 'POST',
      headers: Object.assign({}, DistrictDB._headers('POST'), { 'Prefer': 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify(data)
    }).then(function(r) { return r.json(); });
  },

  /* ── TRACKS ───────────────────────────────────────────────── */

  getTracks: function() {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.resolve([]);
    return DistrictDB._req('GET', 'tracks',
      'user_id=eq.' + uid + '&order=created_at.desc&select=*');
  },

  addTrack: function(data) {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.reject(new Error('Not logged in'));
    data.user_id = uid;
    data.status  = data.status || 'review';
    return DistrictDB._req('POST', 'tracks', null, data)
      .then(function(rows) { return rows[0] || rows; });
  },

  deleteTrack: function(id) {
    return DistrictDB._req('DELETE', 'tracks', 'id=eq.' + id);
  },

  /* ── COLLABS ──────────────────────────────────────────────── */

  getMyCollabs: function() {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.resolve([]);
    return DistrictDB._req('GET', 'collabs',
      'user_id=eq.' + uid + '&order=created_at.desc&select=*');
  },

  addCollab: function(data) {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.reject(new Error('Not logged in'));
    data.user_id = uid;
    return DistrictDB._req('POST', 'collabs', null, data)
      .then(function(rows) { return rows[0] || rows; });
  },

  /* ── NOTIFICATIONS ────────────────────────────────────────── */

  getNotifications: function() {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.resolve([]);
    return DistrictDB._req('GET', 'notifications',
      'user_id=eq.' + uid + '&order=created_at.desc&limit=20&select=*');
  },

  markRead: function(id) {
    return DistrictDB._req('PATCH', 'notifications', 'id=eq.' + id, { read: true });
  },

  addNotification: function(userId, type, message, actor) {
    return DistrictDB._req('POST', 'notifications', null,
      { user_id: userId, type: type, message: message, actor: actor || '0 DISTRICT' });
  },

  /* ── LABEL ROSTER ─────────────────────────────────────────── */

  getRoster: function() {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.resolve([]);
    return DistrictDB._req('GET', 'label_roster',
      'label_user_id=eq.' + uid + '&order=created_at.desc&select=*');
  },

  addToRoster: function(data) {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.reject(new Error('Not logged in'));
    data.label_user_id = uid;
    return DistrictDB._req('POST', 'label_roster', null, data)
      .then(function(rows) { return rows[0] || rows; });
  },

  /* ── RELEASES ─────────────────────────────────────────────── */

  getReleases: function() {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.resolve([]);
    return DistrictDB._req('GET', 'releases',
      'label_user_id=eq.' + uid + '&order=release_date.asc&select=*');
  },

  addRelease: function(data) {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.reject(new Error('Not logged in'));
    data.label_user_id = uid;
    return DistrictDB._req('POST', 'releases', null, data)
      .then(function(rows) { return rows[0] || rows; });
  },

  /* ── DEALS ────────────────────────────────────────────────── */

  getDeals: function() {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.resolve([]);
    return DistrictDB._req('GET', 'deals',
      'label_user_id=eq.' + uid + '&order=created_at.desc&select=*');
  },

  addDeal: function(data) {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.reject(new Error('Not logged in'));
    data.label_user_id = uid;
    return DistrictDB._req('POST', 'deals', null, data)
      .then(function(rows) { return rows[0] || rows; });
  },

  /* ── EDITORIAL QUEUE ──────────────────────────────────────── */

  getEditorialQueue: function() {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.resolve([]);
    return DistrictDB._req('GET', 'editorial_queue',
      'curator_user_id=eq.' + uid + '&order=created_at.desc&select=*');
  },

  updateQueueItem: function(id, data) {
    return DistrictDB._req('PATCH', 'editorial_queue', 'id=eq.' + id, data);
  },

  /* ── FEATURED PICKS ───────────────────────────────────────── */

  getFeaturedPicks: function() {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.resolve([]);
    return DistrictDB._req('GET', 'featured_picks',
      'curator_user_id=eq.' + uid + '&order=created_at.desc&select=*');
  },

  addFeaturedPick: function(data) {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.reject(new Error('Not logged in'));
    data.curator_user_id = uid;
    return DistrictDB._req('POST', 'featured_picks', null, data)
      .then(function(rows) { return rows[0] || rows; });
  },

  removeFeaturedPick: function(id) {
    return DistrictDB._req('PATCH', 'featured_picks', 'id=eq.' + id, { status: 'removed' });
  },

  /* ── ESSAY SUBMISSIONS ────────────────────────────────────── */

  getEssaySubmissions: function() {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.resolve([]);
    return DistrictDB._req('GET', 'essay_submissions',
      'curator_user_id=eq.' + uid + '&order=created_at.desc&select=*');
  },

  updateEssaySubmission: function(id, status) {
    return DistrictDB._req('PATCH', 'essay_submissions', 'id=eq.' + id, { status: status });
  },

  /* ── ESSAYS ───────────────────────────────────────────────── */

  getEssays: function() {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.resolve([]);
    return DistrictDB._req('GET', 'essays',
      'curator_user_id=eq.' + uid + '&order=created_at.desc&select=*');
  },

  addEssay: function(data) {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.reject(new Error('Not logged in'));
    data.curator_user_id = uid;
    return DistrictDB._req('POST', 'essays', null, data)
      .then(function(rows) { return rows[0] || rows; });
  },

  updateEssay: function(id, data) {
    return DistrictDB._req('PATCH', 'essays', 'id=eq.' + id, data);
  },

  /* ── PLAYLISTS ────────────────────────────────────────────── */

  getPlaylists: function() {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.resolve([]);
    return DistrictDB._req('GET', 'playlists',
      'curator_user_id=eq.' + uid + '&order=created_at.desc&select=*');
  },

  addPlaylist: function(data) {
    var uid = DistrictDB._userId();
    if (!uid) return Promise.reject(new Error('Not logged in'));
    data.curator_user_id = uid;
    return DistrictDB._req('POST', 'playlists', null, data)
      .then(function(rows) { return rows[0] || rows; });
  }

};


/* ════════════════════════════════════════════════════════════════
   PANEL RENDERERS
   Each function loads data and injects HTML into a panel,
   or leaves the empty state untouched if no rows exist.
   ════════════════════════════════════════════════════════════════ */

/* ── HELPERS ────────────────────────────────────────────────────── */
function _statusPill(status) {
  var cls = { live:'live', active:'active', review:'review', draft:'draft',
              featured:'featured', pending:'review', open:'active',
              confirmed:'active', in_progress:'review', closed:'draft' };
  return '<span class="status-pill ' + (cls[status] || 'draft') + '">'
    + status.toUpperCase().replace('_',' ') + '</span>';
}

function _fmtDate(d) {
  if (!d) return '—';
  var dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

function _num(n) { return (n == null || n === '') ? '—' : Number(n).toLocaleString(); }

function _initials(name) {
  if (!name) return '??';
  var parts = name.trim().split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : parts[0][1] || '')).toUpperCase();
}

function _artGrad(index) {
  var grads = [
    'linear-gradient(135deg,#5a0808,#c41818)',
    'linear-gradient(135deg,#08085a,#1818c4)',
    'linear-gradient(135deg,#084a08,#12a012)',
    'linear-gradient(135deg,#5a2800,#c47800)',
    'linear-gradient(135deg,#1e1e1e,#3a3a3a)',
    'linear-gradient(135deg,#3a083a,#9418c4)',
    'linear-gradient(135deg,#08454a,#18aac4)'
  ];
  return grads[index % grads.length];
}

/* ── TRACKS PANEL ───────────────────────────────────────────────── */
function dbRenderTracks(panelId) {
  DistrictDB.getTracks().then(function(rows) {
    var panel = document.getElementById(panelId);
    if (!panel || rows.length === 0) return;

    var totalPlays   = rows.reduce(function(s,r){ return s + (r.plays||0); }, 0);
    var totalRevenue = rows.reduce(function(s,r){ return s + (r.revenue||0); }, 0);
    var liveCount    = rows.filter(function(r){ return r.status === 'live'; }).length;

    var html = '<div class="stat-grid">'
      + '<div class="stat-card"><div class="stat-card-val">' + _num(totalPlays) + '</div><div class="stat-card-label">Total Plays</div></div>'
      + '<div class="stat-card"><div class="stat-card-val">' + rows.length + '</div><div class="stat-card-label">Tracks</div></div>'
      + '<div class="stat-card"><div class="stat-card-val">' + liveCount + '</div><div class="stat-card-label">Live</div></div>'
      + '<div class="stat-card"><div class="stat-card-val">$' + totalRevenue.toFixed(2) + '</div><div class="stat-card-label">Revenue MTD</div></div>'
      + '</div>';

    html += '<table class="' + (panelId.indexOf('cr-') >= 0 || panelId.indexOf('artist') >= 0 ? 'cr-table' : 'track-table') + '">'
      + '<thead><tr><th></th><th>TITLE</th><th>GENRE</th><th>PLAYS</th><th>REVENUE</th><th>STATUS</th><th>DATE</th></tr></thead><tbody>';

    rows.forEach(function(r, i) {
      html += '<tr>'
        + '<td><div class="cr-table-art"><div style="width:34px;height:34px;' + _artGrad(i) + ';background-image:' + _artGrad(i) + ';display:flex;align-items:center;justify-content:center;font-family:\'Barlow Condensed\',sans-serif;font-weight:900;font-size:12px;">'
        + _initials(r.artist_name || r.title) + '</div></div></td>'
        + '<td><div class="cr-table-title">' + (r.title || '—') + '</div><div class="cr-table-sub">' + (r.artist_name || '') + '</div></td>'
        + '<td style="color:var(--steel);font-size:9px;">' + (r.genre || '—') + '</td>'
        + '<td>' + _num(r.plays) + '</td>'
        + '<td style="color:' + (r.revenue > 0 ? '#48bb78' : 'var(--steel)') + ';">$' + Number(r.revenue || 0).toFixed(2) + '</td>'
        + '<td>' + _statusPill(r.status) + '</td>'
        + '<td style="color:var(--steel);font-size:9px;">' + _fmtDate(r.release_date || r.created_at) + '</td>'
        + '</tr>';
    });

    html += '</tbody></table>';
    panel.innerHTML = html;
  }).catch(function(e) { console.warn('[DistrictDB] tracks:', e.message); });
}

/* ── COLLABS PANEL ──────────────────────────────────────────────── */
function dbRenderCollabs(panelId) {
  DistrictDB.getMyCollabs().then(function(rows) {
    var panel = document.getElementById(panelId);
    if (!panel || rows.length === 0) return;

    var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';
    rows.forEach(function(r) {
      var statusColor = r.status === 'open' ? '#48bb78' : r.status === 'in_progress' ? '#ed8936' : 'var(--steel)';
      html += '<div style="background:var(--bg2);border:1px solid var(--border);padding:24px;">'
        + '<div style="display:flex;gap:8px;margin-bottom:12px;">'
        + '<span style="font-size:8px;letter-spacing:0.12em;text-transform:uppercase;border:1px solid var(--red);color:var(--red);padding:3px 7px;">' + (r.type || 'OPEN') + '</span>'
        + '<span style="font-size:8px;letter-spacing:0.12em;text-transform:uppercase;border:1px solid ' + statusColor + ';color:' + statusColor + ';padding:3px 7px;">' + (r.status || 'open').toUpperCase() + '</span>'
        + '</div>'
        + '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:900;font-size:20px;text-transform:uppercase;margin-bottom:6px;">' + (r.title || '—') + '</div>'
        + '<div style="font-size:10px;color:var(--steel);line-height:1.8;margin-bottom:16px;">' + (r.description || '') + (r.deadline ? ' · Deadline: ' + _fmtDate(r.deadline) : '') + '</div>'
        + '</div>';
    });
    html += '</div>'
      + '<div style="margin-top:28px;"><a href="collab.html" style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:var(--red);text-decoration:none;">BROWSE COLLAB BOARD &#8594;</a></div>';

    panel.innerHTML = html;
  }).catch(function(e) { console.warn('[DistrictDB] collabs:', e.message); });
}

/* ── NOTIFICATIONS PANEL ────────────────────────────────────────── */
function dbRenderNotifications(panelId) {
  DistrictDB.getNotifications().then(function(rows) {
    var panel = document.getElementById(panelId);
    if (!panel || rows.length === 0) return;

    var typeClass = { PLAY:'track', FOLLOW:'join', COLLAB:'collab', REVIEW:'system', REVENUE:'track' };
    var html = '';
    rows.forEach(function(r) {
      var ago = _timeAgo(r.created_at);
      var cls = typeClass[r.type] || 'system';
      html += '<div class="notif-row">'
        + '<span class="broadcast-time">' + ago + '</span>'
        + '<span class="broadcast-badge ' + cls + '">' + (r.type || 'INFO') + '</span>'
        + '<span class="broadcast-text">' + (r.message || '') + '</span>'
        + '</div>';
    });
    panel.innerHTML = html;
  }).catch(function(e) { console.warn('[DistrictDB] notifs:', e.message); });
}

/* ── ROSTER PANEL ───────────────────────────────────────────────── */
function dbRenderRoster(panelId) {
  DistrictDB.getRoster().then(function(rows) {
    var panel = document.getElementById(panelId);
    if (!panel || rows.length === 0) return;

    var totalArtists = rows.length;
    var totalPlays   = rows.reduce(function(s,r){ return s + (r.monthly_plays||0); }, 0);
    var totalTracks  = rows.reduce(function(s,r){ return s + (r.track_count||0); }, 0);

    var html = '<div class="stat-grid">'
      + '<div class="stat-card"><div class="stat-card-val">' + totalArtists + '</div><div class="stat-card-label">Signed Artists</div></div>'
      + '<div class="stat-card"><div class="stat-card-val">' + _num(totalTracks) + '</div><div class="stat-card-label">Total Tracks</div></div>'
      + '<div class="stat-card"><div class="stat-card-val">' + _num(totalPlays) + '</div><div class="stat-card-label">Monthly Plays</div></div>'
      + '<div class="stat-card"><div class="stat-card-val">—</div><div class="stat-card-label">Revenue MTD</div></div>'
      + '</div>';

    html += '<table class="cr-table"><thead><tr><th></th><th>ARTIST</th><th>GENRE</th><th>CITY</th><th>TRACKS</th><th>MONTHLY PLAYS</th><th>STATUS</th></tr></thead><tbody>';
    rows.forEach(function(r, i) {
      html += '<tr>'
        + '<td><div class="cr-table-art"><div style="width:34px;height:34px;' + _artGrad(i) + ';background-image:' + _artGrad(i) + ';display:flex;align-items:center;justify-content:center;font-family:\'Barlow Condensed\',sans-serif;font-weight:900;font-size:13px;">' + _initials(r.artist_name) + '</div></div></td>'
        + '<td><div class="cr-table-title">' + (r.artist_name || '—') + '</div><div class="cr-table-sub">Since ' + _fmtDate(r.created_at) + '</div></td>'
        + '<td style="color:var(--steel);font-size:9px;">' + (r.genre || '—') + '</td>'
        + '<td style="color:var(--steel);font-size:9px;">' + (r.city ? r.city + (r.country ? ', ' + r.country : '') : '—') + '</td>'
        + '<td>' + _num(r.track_count) + '</td>'
        + '<td>' + _num(r.monthly_plays) + '</td>'
        + '<td>' + _statusPill(r.status) + '</td>'
        + '</tr>';
    });
    html += '</tbody></table>';
    panel.innerHTML = html;
  }).catch(function(e) { console.warn('[DistrictDB] roster:', e.message); });
}

/* ── RELEASES PANEL ─────────────────────────────────────────────── */
function dbRenderReleases(panelId) {
  DistrictDB.getReleases().then(function(rows) {
    var panel = document.getElementById(panelId);
    if (!panel || rows.length === 0) return;

    var live     = rows.filter(function(r){ return r.status === 'live'; });
    var upcoming = rows.filter(function(r){ return r.status !== 'live'; });
    var html = '';

    if (upcoming.length > 0) {
      html += '<div class="cr-section-title">UPCOMING RELEASES</div>';
      upcoming.forEach(function(r) {
        html += '<div class="submission-row">'
          + '<div style="width:40px;height:40px;background:var(--bg2);border:1px solid var(--border);"></div>'
          + '<div><div class="submission-title">' + (r.title || '—') + (r.artist_name ? ' — ' + r.artist_name : '') + '</div>'
          + '<div class="submission-meta">' + (r.release_date ? 'Release: ' + _fmtDate(r.release_date) : 'Date TBC') + (r.genre ? ' · ' + r.genre : '') + (r.track_count ? ' · ' + r.track_count + ' tracks' : '') + '</div></div>'
          + '<div class="submission-actions">' + _statusPill(r.status) + '</div></div>';
      });
    }

    if (live.length > 0) {
      html += '<div class="cr-section-title">LIVE RELEASES</div>';
      live.forEach(function(r) {
        html += '<div class="submission-row">'
          + '<div style="width:40px;height:40px;background:var(--bg2);border:1px solid var(--border);"></div>'
          + '<div><div class="submission-title">' + (r.title || '—') + (r.artist_name ? ' — ' + r.artist_name : '') + '</div>'
          + '<div class="submission-meta">Live since ' + _fmtDate(r.release_date) + (r.genre ? ' · ' + r.genre : '') + (r.dsps ? ' · ' + r.dsps : '') + '</div></div>'
          + '<div class="submission-actions">' + _statusPill('live') + '</div></div>';
      });
    }

    panel.innerHTML = html;
  }).catch(function(e) { console.warn('[DistrictDB] releases:', e.message); });
}

/* ── DEALS PANEL ────────────────────────────────────────────────── */
function dbRenderDeals(panelId) {
  DistrictDB.getDeals().then(function(rows) {
    var panel = document.getElementById(panelId);
    if (!panel || rows.length === 0) return;

    var html = '<table class="cr-table"><thead><tr><th>ARTIST</th><th>TYPE</th><th>TERRITORY</th><th>STAGE</th><th>VALUE</th><th>STATUS</th></tr></thead><tbody>';
    rows.forEach(function(r) {
      html += '<tr>'
        + '<td><div class="cr-table-title">' + (r.artist_name || '—') + '</div></td>'
        + '<td style="color:var(--steel);font-size:9px;">' + (r.deal_type || '—') + '</td>'
        + '<td style="color:var(--steel);font-size:9px;">' + (r.territory || '—') + '</td>'
        + '<td style="font-size:9px;">' + (r.stage || '—') + '</td>'
        + '<td style="color:#48bb78;">' + (r.value || '—') + '</td>'
        + '<td>' + _statusPill(r.status) + '</td>'
        + '</tr>';
    });
    html += '</tbody></table>'
      + '<div style="margin-top:20px;"><a href="about.html#contact" style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:var(--red);text-decoration:none;">SUBMIT NEW DEAL &#8594;</a></div>';
    panel.innerHTML = html;
  }).catch(function(e) { console.warn('[DistrictDB] deals:', e.message); });
}

/* ── EDITORIAL QUEUE PANEL ──────────────────────────────────────── */
function dbRenderEditorialQueue(panelId) {
  DistrictDB.getEditorialQueue().then(function(rows) {
    var panel = document.getElementById(panelId);
    if (!panel || rows.length === 0) return;

    var html = '';
    rows.forEach(function(r, i) {
      html += '<div class="submission-row">'
        + '<span class="submission-num">' + String(i+1).padStart(2,'0') + '</span>'
        + '<div><div class="submission-title">' + (r.title || '—') + (r.artist_name ? ' — ' + r.artist_name : '') + '</div>'
        + '<div class="submission-meta">' + (r.genre || '') + (r.read_time ? ' · ' + r.read_time + ' read' : '') + ' · ' + _statusPill(r.status).replace(/<[^>]*>/g,' ').trim() + '</div></div>'
        + '<div class="submission-actions">'
        + (r.status !== 'published' ? '<button class="btn-sm primary" onclick="dbPublishQueueItem(\'' + r.id + '\',this)">PUBLISH</button>' : '')
        + '<button class="btn-sm" onclick="dbReviseQueueItem(\'' + r.id + '\',this)">REVISE</button>'
        + '</div></div>';
    });
    panel.innerHTML = html;
  }).catch(function(e) { console.warn('[DistrictDB] queue:', e.message); });
}

function dbPublishQueueItem(id, btn) {
  if (btn) { btn.textContent = '...'; btn.disabled = true; }
  DistrictDB.updateQueueItem(id, { status: 'published' })
    .then(function() { showToast('Published to District editorial', 'success'); dbRenderEditorialQueue('panel-curator-queue'); })
    .catch(function(e) { showToast('Error: ' + e.message, 'error'); if (btn) { btn.textContent = 'PUBLISH'; btn.disabled = false; } });
}

function dbReviseQueueItem(id, btn) {
  if (btn) { btn.textContent = '...'; btn.disabled = true; }
  DistrictDB.updateQueueItem(id, { status: 'pending' })
    .then(function() { showToast('Sent back for revision', 'info'); dbRenderEditorialQueue('panel-curator-queue'); })
    .catch(function(e) { showToast('Error: ' + e.message, 'error'); if (btn) { btn.textContent = 'REVISE'; btn.disabled = false; } });
}

/* ── FEATURED PICKS PANEL ───────────────────────────────────────── */
function dbRenderFeaturedPicks(panelId) {
  DistrictDB.getFeaturedPicks().then(function(rows) {
    var panel = document.getElementById(panelId);
    if (!panel || rows.length === 0) return;

    var featured = rows.filter(function(r){ return r.status === 'featured'; });
    var queued   = rows.filter(function(r){ return r.status === 'queued'; });
    var html = '';

    if (featured.length > 0) {
      html += '<div class="cr-section-title">CURRENTLY FEATURED</div>';
      featured.forEach(function(r) {
        html += '<div class="submission-row">'
          + '<div style="width:40px;height:40px;background:var(--bg2);border:1px solid var(--red);"></div>'
          + '<div><div class="submission-title">' + (r.title || '—') + (r.artist_name ? ' — ' + r.artist_name : '') + '</div>'
          + '<div class="submission-meta">Featured since ' + _fmtDate(r.featured_from || r.created_at) + (r.genre ? ' · ' + r.genre : '') + '</div></div>'
          + '<div class="submission-actions">' + _statusPill('featured')
          + '<button class="btn-sm" onclick="dbRemovePick(\'' + r.id + '\',this)">REMOVE</button></div></div>';
      });
    }

    if (queued.length > 0) {
      html += '<div class="cr-section-title">QUEUE FOR FEATURE</div>';
      queued.forEach(function(r) {
        html += '<div class="submission-row">'
          + '<div style="width:40px;height:40px;background:var(--bg2);border:1px solid var(--border);"></div>'
          + '<div><div class="submission-title">' + (r.title || '—') + (r.artist_name ? ' — ' + r.artist_name : '') + '</div>'
          + '<div class="submission-meta">' + (r.genre || '') + (r.notes ? ' · ' + r.notes : '') + '</div></div>'
          + '<div class="submission-actions">'
          + '<button class="btn-sm primary" onclick="dbSetNextFeature(\'' + r.id + '\',this)">SET NEXT</button></div></div>';
      });
    }

    panel.innerHTML = html;
  }).catch(function(e) { console.warn('[DistrictDB] picks:', e.message); });
}

function dbRemovePick(id, btn) {
  if (btn) { btn.disabled = true; }
  DistrictDB.removeFeaturedPick(id)
    .then(function() { showToast('Removed from feature', 'info'); dbRenderFeaturedPicks('panel-curator-picks'); })
    .catch(function(e) { showToast('Error: ' + e.message, 'error'); if (btn) btn.disabled = false; });
}

function dbSetNextFeature(id, btn) {
  if (btn) { btn.disabled = true; }
  DistrictDB._req('PATCH', 'featured_picks', 'id=eq.' + id, { status: 'featured', featured_from: new Date().toISOString().split('T')[0] })
    .then(function() { showToast('Set as next feature', 'success'); dbRenderFeaturedPicks('panel-curator-picks'); })
    .catch(function(e) { showToast('Error: ' + e.message, 'error'); if (btn) btn.disabled = false; });
}

/* ── ESSAY SUBMISSIONS PANEL ────────────────────────────────────── */
function dbRenderEssaySubmissions(panelId) {
  DistrictDB.getEssaySubmissions().then(function(rows) {
    var panel = document.getElementById(panelId);
    if (!panel || rows.length === 0) return;

    var html = '';
    rows.forEach(function(r, i) {
      html += '<div class="submission-row">'
        + '<span class="submission-num">' + String(i+1).padStart(2,'0') + '</span>'
        + '<div><div class="submission-title">' + (r.title || '—') + (r.author_name ? ' — ' + r.author_name : '') + '</div>'
        + '<div class="submission-meta">' + (r.author_email ? 'From: ' + r.author_email + ' · ' : '') + _fmtDate(r.created_at) + (r.genre ? ' · ' + r.genre : '') + (r.read_time ? ' · ' + r.read_time : '') + '</div></div>'
        + '<div class="submission-actions">'
        + (r.status === 'pending' ? '<button class="btn-sm primary" onclick="dbAcceptSubmission(\'' + r.id + '\',this)">ACCEPT</button><button class="btn-sm" onclick="dbDeclineSubmission(\'' + r.id + '\',this)">DECLINE</button>' : _statusPill(r.status))
        + '</div></div>';
    });
    panel.innerHTML = html;
  }).catch(function(e) { console.warn('[DistrictDB] essay subs:', e.message); });
}

function dbAcceptSubmission(id, btn) {
  if (btn) { btn.disabled = true; }
  DistrictDB.updateEssaySubmission(id, 'accepted')
    .then(function() { showToast('Accepted for review', 'success'); dbRenderEssaySubmissions('panel-curator-submissions'); })
    .catch(function(e) { showToast('Error: ' + e.message, 'error'); if (btn) btn.disabled = false; });
}

function dbDeclineSubmission(id, btn) {
  if (btn) { btn.disabled = true; }
  DistrictDB.updateEssaySubmission(id, 'declined')
    .then(function() { showToast('Declined', 'info'); dbRenderEssaySubmissions('panel-curator-submissions'); })
    .catch(function(e) { showToast('Error: ' + e.message, 'error'); if (btn) btn.disabled = false; });
}

/* ── ESSAYS PANEL ───────────────────────────────────────────────── */
function dbRenderEssays(panelId) {
  DistrictDB.getEssays().then(function(rows) {
    var panel = document.getElementById(panelId);
    if (!panel || rows.length === 0) return;

    var html = '';
    rows.forEach(function(r, i) {
      html += '<div class="submission-row">'
        + '<span class="submission-num">' + String(i+1).padStart(2,'0') + '</span>'
        + '<div><div class="submission-title">' + (r.title || '—') + '</div>'
        + '<div class="submission-meta">' + _fmtDate(r.created_at) + (r.genre ? ' · ' + r.genre : '') + (r.read_time ? ' · ' + r.read_time + ' read' : '') + (r.reads ? ' · ' + _num(r.reads) + ' reads' : '') + '</div></div>'
        + '<div class="submission-actions">' + _statusPill(r.status)
        + '<button class="btn-sm" onclick="showToast(\'Edit mode\',\'info\')">EDIT</button></div></div>';
    });
    html += '<div style="margin-top:20px;"><a href="about.html#contact" style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:var(--red);text-decoration:none;">+ NEW ESSAY</a></div>';
    panel.innerHTML = html;
  }).catch(function(e) { console.warn('[DistrictDB] essays:', e.message); });
}

/* ── SUBMIT TRACK FORM ──────────────────────────────────────────── */
function submitTrack() {
  if (typeof DistrictAuth === 'undefined' || !DistrictAuth.isLoggedIn()) {
    if (typeof openSignIn === 'function') openSignIn();
    return;
  }

  var panelId  = document.getElementById('panel-artist-upload') ? 'panel-artist-upload' : 'panel-upload';
  var panel    = document.getElementById(panelId);
  if (!panel) return;

  var fields = panel.querySelectorAll('.form-input');
  var data   = {};
  // Order must match .form-input DOM order in panel-artist-upload:
  // 0:title, 1:artist_name, 2:genre, 3:release_date, 4:soundcloud, 5:youtube, 6:spotify, 7:description
  var labels = ['title','artist_name','genre','release_date','soundcloud','youtube','spotify','description'];

  fields.forEach(function(f, i) {
    if (labels[i]) data[labels[i]] = f.value.trim();
  });

  if (!data.title) {
    showToast('Track title is required', 'error');
    return;
  }

  var btn = panel.querySelector('.btn-submit');
  if (btn) { btn.textContent = 'SUBMITTING...'; btn.disabled = true; }

  DistrictDB.addTrack(data)
    .then(function() {
      showToast('Track submitted — pending editorial review', 'success');
      if (btn) { btn.textContent = 'SUBMIT TRACK →'; btn.disabled = false; }
      fields.forEach(function(f) { f.value = ''; });
      // Reload music panel
      dbRenderTracks('panel-artist-music');
      dbRenderTracks('panel-music');
    })
    .catch(function(e) {
      showToast('Submit failed: ' + e.message, 'error');
      if (btn) { btn.textContent = 'SUBMIT TRACK →'; btn.disabled = false; }
    });
}

/* ── ANALYTICS PANEL (computed from tracks) ─────────────────────── */
function dbRenderAnalytics(panelId) {
  DistrictDB.getTracks().then(function(rows) {
    var panel = document.getElementById(panelId);
    if (!panel || rows.length === 0) return;

    var totalPlays = rows.reduce(function(s,r){ return s + (r.plays||0); }, 0);
    if (totalPlays === 0) return; // keep empty state if no play data

    // Build simple stats display
    var html = '<div class="analytics-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">'
      + '<div>'
      + '<div class="chart-wrap"><p class="chart-title">TRACK PERFORMANCE</p>';

    var maxPlays = Math.max.apply(null, rows.map(function(r){ return r.plays||0; })) || 1;
    html += '<div class="bar-chart">';
    rows.slice(0,7).forEach(function(r) {
      var h = Math.round(((r.plays||0) / maxPlays) * 95);
      html += '<div class="bar-col"><div class="bar-fill" style="height:' + Math.max(h,2) + '%;"></div>'
        + '<div class="bar-label">' + (r.title || '').split(' ')[0].toUpperCase().slice(0,4) + '</div></div>';
    });
    html += '</div></div></div>';

    html += '<div><div class="chart-wrap" style="height:100%;"><p class="chart-title">CATALOG STATS</p>'
      + '<div style="display:flex;flex-direction:column;gap:0;">';
    rows.slice(0,5).forEach(function(r) {
      var pct = Math.round(((r.plays||0) / totalPlays) * 100);
      html += '<div class="submission-row" style="grid-template-columns:1fr 80px 36px;">'
        + '<span style="font-size:10px;letter-spacing:0.06em;text-transform:uppercase;">' + (r.title || '—') + '</span>'
        + '<div style="height:2px;background:rgba(245,245,245,0.1);"><div style="height:100%;width:' + pct + '%;background:var(--red);"></div></div>'
        + '<span style="font-size:10px;color:var(--steel);">' + pct + '%</span></div>';
    });
    html += '</div></div></div></div>';

    panel.innerHTML = html;
  }).catch(function(e) { console.warn('[DistrictDB] analytics:', e.message); });
}

/* ── TIME AGO HELPER ────────────────────────────────────────────── */
function _timeAgo(ts) {
  if (!ts) return '—';
  var diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 3600)  return Math.round(diff / 60)  + 'M AGO';
  if (diff < 86400) return Math.round(diff / 3600) + 'H AGO';
  return Math.round(diff / 86400) + 'D AGO';
}

/* ── LOAD ALL PANELS FOR CURRENT PAGE ───────────────────────────── */
function dbLoadAllPanels() {
  if (typeof DistrictAuth === 'undefined' || !DistrictAuth.isLoggedIn()) return;

  // Studio page
  dbRenderTracks('panel-music');
  dbRenderAnalytics('panel-analytics');
  dbRenderCollabs('panel-collab');
  dbRenderNotifications('panel-notifs');

  // Control room page
  dbRenderTracks('panel-artist-music');
  dbRenderAnalytics('panel-artist-analytics');
  dbRenderCollabs('panel-artist-collabs');
  dbRenderNotifications('panel-artist-notifs');
  dbRenderRoster('panel-label-roster');
  dbRenderReleases('panel-label-releases');
  dbRenderDeals('panel-label-deals');
  dbRenderEditorialQueue('panel-curator-queue');
  dbRenderFeaturedPicks('panel-curator-picks');
  dbRenderEssaySubmissions('panel-curator-submissions');
  dbRenderEssays('panel-curator-essays');
}

document.addEventListener('DOMContentLoaded', function() {
  // Small delay so DistrictAuth.session() is ready
  setTimeout(dbLoadAllPanels, 300);
});

/* ── SIDEBAR PROFILE INIT ────────────────────────────────────────── */
function dbInitSidebar() {
  if (typeof DistrictAuth === 'undefined' || !DistrictAuth.isLoggedIn()) return;

  var displayName = DistrictAuth.displayName();
  var user        = DistrictAuth.user();

  // Studio sidebar
  var studioName = document.querySelector('.sidebar-name');
  var studioAv   = document.querySelector('.sidebar-avatar-text');
  if (studioName && displayName) {
    studioName.textContent = displayName;
    if (studioAv) studioAv.textContent = displayName.slice(0,2).toUpperCase();
  }

  // Control room sidebar (crName is set by switchRole() in heroData)
  // Override the initial YOUR ACCOUNT with real name
  var crNameEl = document.getElementById('crName');
  if (crNameEl && displayName) crNameEl.textContent = displayName;
  var crAvEl = document.getElementById('crAvatarText');
  if (crAvEl && displayName) crAvEl.textContent = displayName.slice(0,2).toUpperCase();

  // Update heroData names with real display name
  var artistRole = document.querySelector('[data-role="artist"]');
  // Reflect real name in heroData JS if loaded
  if (typeof heroData !== 'undefined') {
    heroData.artist.name  = displayName;
    heroData.label.name   = displayName;
    heroData.curator.name = displayName;
  }

  // Load real profile stats for studio sidebar
  DistrictDB.getTracks().then(function(rows) {
    var totalPlays = rows.reduce(function(s,r){ return s + (r.plays||0); }, 0);
    var statEls = document.querySelectorAll('.sidebar-stat-val');
    if (statEls.length >= 3) {
      statEls[0].textContent = rows.length || '0';
      statEls[1].textContent = totalPlays >= 1000 ? (totalPlays/1000).toFixed(1)+'K' : totalPlays || '0';
      statEls[2].textContent = '—';
    }
    // Control room profile stats
    var crStats = document.getElementById('crProfileStats');
    if (crStats && rows.length > 0) {
      crStats.innerHTML = '<div><div class="cr-pstat-val">' + rows.length + '</div><div class="cr-pstat-label">Tracks</div></div>'
        + '<div><div class="cr-pstat-val">' + (totalPlays >= 1000 ? (totalPlays/1000).toFixed(1)+'K' : totalPlays) + '</div><div class="cr-pstat-label">Plays</div></div>'
        + '<div><div class="cr-pstat-val">—</div><div class="cr-pstat-label">Fans</div></div>';
    }
  }).catch(function(){});
}

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(dbInitSidebar, 400);
});
