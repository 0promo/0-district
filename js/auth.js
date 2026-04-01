/* ════════════════════════════════════════════════════════════════
   0 DISTRICT — AUTH SYSTEM  v2.0
   Supabase Auth via native fetch — no SDK required
   Handles: Sign In · Sign Up (role + artist name) · Sign Out
            Password Reset · Session Persistence · Nav State
   ════════════════════════════════════════════════════════════════ */

const _SB = {
  url: 'https://awmvfkekwrjcrfllcepl.supabase.co',
  key: 'sb_publishable_Gpr3sOBF49RxB6xWUwO_PA_I7vk9enI',
  get auth() { return this.url + '/auth/v1'; },
  get rest() { return this.url + '/rest/v1'; },
};

const SESSION_KEY = '_0d_session';

/* ── ROLE LABELS ────────────────────────────────────────────────── */
const ROLE_LABELS = {
  artist:  'District Artist',
  label:   'Label Operative',
  curator: 'Editorial Curator',
};

/* ─────────────────────────────────────────────────────────────────
   CORE FETCH HELPERS
───────────────────────────────────────────────────────────────── */
function _headers(extraAuth) {
  const session = getSession();
  const token = extraAuth || session?.access_token || _SB.key;
  return {
    'apikey': _SB.key,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

async function _authFetch(path, method = 'GET', body = null, token = null) {
  const opts = { method, headers: _headers(token) };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(_SB.auth + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.msg || data.error_description || data.message || data.error || 'Auth failed';
    throw new Error(msg);
  }
  return data;
}

async function _restFetch(table, method = 'GET', params = '', body = null) {
  const session = getSession();
  const headers = {
    'apikey': _SB.key,
    'Authorization': `Bearer ${session?.access_token || _SB.key}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Prefer': method === 'GET' ? 'return=representation' : 'return=representation',
  };
  const url = `${_SB.rest}/${table}${params ? '?' + params : ''}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `DB error ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

/* ─────────────────────────────────────────────────────────────────
   SESSION MANAGEMENT
───────────────────────────────────────────────────────────────── */
function saveSession(data) {
  if (!data?.access_token) return null;
  const session = {
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    Date.now() + ((data.expires_in || 3600) * 1000),
    user:          data.user,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Legacy compatibility for control-room gate
  localStorage.setItem('_ds', JSON.stringify({ t: data.access_token, e: session.expires_at, u: data.user }));
  return session;
}

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    // Add 60s grace period
    if (s.expires_at < Date.now() - 60000) {
      if (s.refresh_token) _silentRefresh(s.refresh_token);
      return null;
    }
    return s;
  } catch { return null; }
}

async function _silentRefresh(refreshToken) {
  try {
    const data = await _authFetch('/token?grant_type=refresh_token', 'POST', { refresh_token: refreshToken });
    saveSession(data);
  } catch { clearSession(); }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('_ds');
}

function getCurrentUser() {
  return getSession()?.user || null;
}

function getUserMeta(key) {
  const user = getCurrentUser();
  return user?.user_metadata?.[key] || null;
}

/* ─────────────────────────────────────────────────────────────────
   SIGN UP
───────────────────────────────────────────────────────────────── */
async function signUp(email, password, displayName, role, artistName) {
  const meta = {
    full_name:    displayName,
    display_name: displayName,
    role:         role || 'artist',
    artist_name:  artistName || displayName,
  };

  const data = await _authFetch('/signup', 'POST', { email, password, data: meta });

  // If email confirmation disabled → auto session
  if (data.access_token) {
    saveSession(data);
    // Upsert profile
    await _upsertProfile(data.user, meta);
    return { confirmed: true, user: data.user };
  }

  // Email confirmation required → user.id present but no token
  return { confirmed: false, email };
}

async function _upsertProfile(user, meta) {
  if (!user?.id) return;
  const initials = (meta.display_name || user.email)
    .split(' ').map(w => w[0] || '').join('').substring(0, 2).toUpperCase() || '0D';

  try {
    await _restFetch('profiles', 'POST', '', [{
      id:             user.id,
      full_name:      meta.full_name,
      display_name:   meta.display_name,
      role:           meta.role,
      artist_name:    meta.artist_name,
      avatar_initials: initials,
    }]);
  } catch (e) {
    // Profile trigger may have already created it — try PATCH
    try {
      await _restFetch('profiles', 'PATCH', `id=eq.${user.id}`, {
        full_name:    meta.full_name,
        display_name: meta.display_name,
        role:         meta.role,
        artist_name:  meta.artist_name,
      });
    } catch { /* silently ok */ }
  }
}

/* ─────────────────────────────────────────────────────────────────
   SIGN IN
───────────────────────────────────────────────────────────────── */
async function signIn(email, password) {
  const data = await _authFetch('/token?grant_type=password', 'POST', { email, password });
  saveSession(data);
  return data;
}

/* ─────────────────────────────────────────────────────────────────
   SIGN OUT
───────────────────────────────────────────────────────────────── */
async function signOut() {
  const session = getSession();
  if (session?.access_token) {
    try { await _authFetch('/logout', 'POST', {}, session.access_token); } catch {}
  }
  clearSession();
  updateNavForAuth(null);
  window.location.href = 'index.html';
}

/* ─────────────────────────────────────────────────────────────────
   PASSWORD RESET
───────────────────────────────────────────────────────────────── */
async function resetPassword(email) {
  return _authFetch('/recover', 'POST', {
    email,
    gotrue_meta_security: {},
  });
}

/* ─────────────────────────────────────────────────────────────────
   PROFILE FETCH
───────────────────────────────────────────────────────────────── */
async function getProfile() {
  const user = getCurrentUser();
  if (!user?.id) return null;
  try {
    const rows = await _restFetch('profiles', 'GET', `id=eq.${user.id}&select=*`);
    return Array.isArray(rows) ? rows[0] : null;
  } catch { return null; }
}

/* ─────────────────────────────────────────────────────────────────
   NAV UPDATE
───────────────────────────────────────────────────────────────── */
function updateNavForAuth(user) {
  const signInBtns  = document.querySelectorAll('.btn-nav, .btn-nav-mobile');
  const signOutBtns = document.querySelectorAll('[data-signout]');
  const navUserEl   = document.getElementById('navUserChip');

  if (user) {
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'OPERATOR';
    const role = user.user_metadata?.role || 'artist';

    signInBtns.forEach(b => { b.style.display = 'none'; });
    signOutBtns.forEach(b => {
      b.style.display = 'block';
      b.onclick = (e) => { e.preventDefault(); signOut(); };
    });

    if (navUserEl) {
      navUserEl.innerHTML = `<span class="nav-user-dot"></span>${name.toUpperCase().split(' ')[0]} · ${role.toUpperCase()}`;
      navUserEl.style.display = 'flex';
    }
  } else {
    signInBtns.forEach(b => { b.style.display = ''; });
    signOutBtns.forEach(b => { b.style.display = 'none'; });
    if (navUserEl) navUserEl.style.display = 'none';
  }
}

/* ─────────────────────────────────────────────────────────────────
   MODAL FUNCTIONS
───────────────────────────────────────────────────────────────── */

// Track selected role in register panel
window._selectedRole = 'artist';

function openSignIn() {
  const m = document.getElementById('signInModal');
  if (m) {
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Default to sign-in tab
    const siTab = document.querySelector('.modal-tab[data-tab="signin"]');
    if (siTab) switchTab(siTab);
  }
}

function closeSignIn() {
  const m = document.getElementById('signInModal');
  if (m) {
    m.classList.remove('open');
    document.body.style.overflow = '';
  }
  clearModalErrors();
}

function openRegister() {
  openSignIn();
  const regTab = document.querySelector('.modal-tab[data-tab="register"]');
  if (regTab) setTimeout(() => switchTab(regTab), 50);
}

function switchTab(btn) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const tab = btn.dataset.tab;
  document.querySelectorAll('.modal-panel').forEach(p => p.style.display = 'none');
  const panel = document.getElementById('panel-' + tab);
  if (panel) panel.style.display = 'block';
  clearModalErrors();
}

function selectRole(btn) {
  document.querySelectorAll('.role-select-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  window._selectedRole = btn.dataset.role;

  // Show/hide artist name field
  const artistNameWrap = document.getElementById('artistNameWrap');
  if (artistNameWrap) {
    artistNameWrap.style.display = window._selectedRole === 'artist' ? '' : 'none';
  }

  // Update register button label
  const regBtn = document.getElementById('btnRegister');
  if (regBtn) {
    const labels = { artist: 'JOIN AS AN ARTIST →', label: 'JOIN AS A LABEL →', curator: 'JOIN AS A CURATOR →' };
    regBtn.textContent = labels[window._selectedRole] || 'BECOME AN OPERATOR →';
  }

  // Update subtext
  const roleHint = document.getElementById('roleHint');
  if (roleHint) {
    const hints = {
      artist:  'Upload tracks, track plays, find collabs, pitch to editorial.',
      label:   'Manage your full roster, schedule releases, track deals.',
      curator: 'Build playlists, manage editorial queue, publish essays.',
    };
    roleHint.textContent = hints[window._selectedRole] || '';
  }
}

/* ── FORM SUBMISSION ──────────────────────────────────────────── */

async function handleModalSubmit() {
  const activeTab = document.querySelector('.modal-tab.active')?.dataset?.tab;

  if (activeTab === 'signin') {
    await _handleSignIn();
  } else {
    await _handleRegister();
  }
}

async function _handleSignIn() {
  const emailEl = document.querySelector('#panel-signin .modal-input[type="email"]');
  const passEl  = document.querySelector('#panel-signin .modal-input[type="password"]');
  const btn     = document.querySelector('#panel-signin .btn-modal-submit');

  if (!emailEl || !passEl) return;
  const email    = emailEl.value.trim();
  const password = passEl.value;

  if (!email || !password) { return showModalError('Enter your email and password.'); }

  setModalLoading(btn, true);
  clearModalErrors();

  try {
    const data = await signIn(email, password);
    const user = data.user;
    updateNavForAuth(user);
    closeSignIn();
    showToast('WELCOME BACK, OPERATOR ↗', 'success');

    // Redirect to control room if on index
    setTimeout(() => {
      if (window.location.pathname.includes('control-room')) {
        window.location.reload();
      } else {
        window.location.href = 'control-room.html';
      }
    }, 800);
  } catch (err) {
    showModalError(_friendlyAuthError(err.message));
  } finally {
    setModalLoading(btn, false);
  }
}

async function _handleRegister() {
  const nameEl       = document.querySelector('#panel-register .modal-input[type="text"]');
  const artistNameEl = document.getElementById('inputArtistName');
  const emailEl      = document.querySelector('#panel-register .modal-input[type="email"]');
  const passEl       = document.querySelector('#panel-register .modal-input[type="password"]');
  const btn          = document.getElementById('btnRegister');

  if (!nameEl || !emailEl || !passEl) return;

  const displayName  = nameEl.value.trim();
  const artistName   = artistNameEl?.value?.trim() || displayName;
  const email        = emailEl.value.trim();
  const password     = passEl.value;
  const role         = window._selectedRole || 'artist';

  if (!displayName) return showModalError('Enter your name or label name.');
  if (!email)       return showModalError('Enter your email address.');
  if (password.length < 8) return showModalError('Password must be at least 8 characters.');

  setModalLoading(btn, true);
  clearModalErrors();

  try {
    const result = await signUp(email, password, displayName, role, artistName);

    if (result.confirmed) {
      updateNavForAuth(getCurrentUser());
      closeSignIn();
      showToast('WELCOME TO THE DISTRICT, OPERATOR ↗', 'success');
      setTimeout(() => { window.location.href = 'control-room.html'; }, 800);
    } else {
      // Email confirmation needed
      closeSignIn();
      showToast('CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT', 'info');
    }
  } catch (err) {
    showModalError(_friendlyAuthError(err.message));
  } finally {
    setModalLoading(btn, false);
  }
}

async function forgotPassword() {
  const emailEl = document.querySelector('#panel-signin .modal-input[type="email"]');
  const email = emailEl?.value?.trim();
  if (!email) return showModalError('Enter your email address above first.');

  try {
    await resetPassword(email);
    showToast('RESET LINK SENT — CHECK YOUR INBOX', 'success');
  } catch (err) {
    showModalError('Could not send reset email. Try again.');
  }
}

/* ── ERROR HELPERS ────────────────────────────────────────────── */

function _friendlyAuthError(msg) {
  msg = (msg || '').toLowerCase();
  if (msg.includes('invalid login') || msg.includes('invalid credentials'))
    return 'Incorrect email or password. Try again.';
  if (msg.includes('email not confirmed'))
    return 'Please confirm your email before signing in.';
  if (msg.includes('already registered') || msg.includes('already exists'))
    return 'This email is already registered. Sign in instead.';
  if (msg.includes('rate limit'))
    return 'Too many attempts. Wait a moment and try again.';
  if (msg.includes('password') && msg.includes('short'))
    return 'Password must be at least 8 characters.';
  return msg || 'Something went wrong. Try again.';
}

function showModalError(msg) {
  clearModalErrors();
  const errEl = document.createElement('p');
  errEl.className = 'modal-error-msg';
  errEl.textContent = msg;
  const activePanel = document.querySelector('.modal-panel[style*="block"]') ||
                      document.querySelector('.modal-panel:not([style*="none"])');
  if (activePanel) activePanel.prepend(errEl);
}

function clearModalErrors() {
  document.querySelectorAll('.modal-error-msg').forEach(e => e.remove());
}

function setModalLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = 'CONNECTING...';
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalText || 'SUBMIT →';
    btn.disabled = false;
  }
}

/* ── TOAST (shared across pages) ─────────────────────────────── */
function showToast(msg, type = 'info') {
  let t = document.getElementById('_toast0d');
  if (!t) {
    t = document.createElement('div');
    t.id = '_toast0d';
    document.body.appendChild(t);
  }
  t.className = `toast0d toast-${type}`;
  t.textContent = msg;
  t.classList.add('visible');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('visible'), 3200);
}

/* ── PAGE INIT ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  updateNavForAuth(user);

  // Wire sign-out buttons
  document.querySelectorAll('[data-signout]').forEach(btn => {
    btn.onclick = (e) => { e.preventDefault(); signOut(); };
  });
});
