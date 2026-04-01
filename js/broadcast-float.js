/* ════════════════════════════════════════════════════════════════
   0 DISTRICT — BROADCAST CHANNEL  (Floating Widget)
   A persistent floating message bar showing live District activity.
   Appears on all pages. Dismissable per session.
   ════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  const DISMISS_KEY = '_0d_bc_dismissed';
  const MESSAGES = [
    { type: 'join',   text: 'NEW OPERATOR ENTERED THE DISTRICT', sub: 'Just now' },
    { type: 'track',  text: 'KOFI MANU → "ACCRA NIGHTS" NOW LIVE', sub: '2 min ago' },
    { type: 'live',   text: 'DJ SENEGAL STARTED A LIVE SESSION', sub: 'NOW' },
    { type: 'collab', text: 'ECHO DELTA OPENED A REMIX CHALLENGE', sub: '5 min ago' },
    { type: 'track',  text: 'ZARA.B DROPPED A NEW SINGLE', sub: '8 min ago' },
    { type: 'system', text: '0 DISTRICT · SIGNAL NOMINAL · 99.97% UPTIME', sub: 'System' },
    { type: 'join',   text: 'TEMA COAST JOINED THE DISTRICT', sub: '12 min ago' },
    { type: 'collab', text: 'OFO BEATS SEEKING VOCALIST — AFROBEATS', sub: '15 min ago' },
    { type: 'track',  text: 'AMARA.K → "IVORY SIGNAL" HITS 1K PLAYS', sub: '20 min ago' },
    { type: 'system', text: 'EDITORIAL QUEUE OPEN — SUBMIT YOUR MUSIC', sub: 'District' },
  ];

  let currentIdx = 0;
  let interval   = null;
  let dismissed  = false;

  function init() {
    // Don't show if user dismissed it this session
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const bc = document.createElement('div');
    bc.id = 'broadcastFloat';
    bc.innerHTML = `
      <div class="bc-inner">
        <div class="bc-signal"><div class="bc-dot"></div>LIVE</div>
        <div class="bc-content">
          <span class="bc-badge" id="bcBadge">SYSTEM</span>
          <span class="bc-text" id="bcText">0 DISTRICT · SIGNAL LOCKED</span>
        </div>
        <div class="bc-sub" id="bcSub">Now</div>
        <button class="bc-close" id="bcClose" aria-label="Dismiss">✕</button>
      </div>`;
    document.body.appendChild(bc);

    // Animate in
    requestAnimationFrame(() => {
      setTimeout(() => bc.classList.add('bc-visible'), 1500);
    });

    // Wire close button
    document.getElementById('bcClose').onclick = () => {
      bc.classList.remove('bc-visible');
      sessionStorage.setItem(DISMISS_KEY, '1');
      dismissed = true;
      clearInterval(interval);
    };

    // Wire click → control room
    bc.querySelector('.bc-content').onclick = () => {
      window.location.href = 'control-room.html';
    };

    // Start cycling
    updateMessage();
    interval = setInterval(() => {
      if (!dismissed) {
        currentIdx = (currentIdx + 1) % MESSAGES.length;
        updateMessage();
      }
    }, 6000);
  }

  function updateMessage() {
    const msg     = MESSAGES[currentIdx];
    const badgeEl = document.getElementById('bcBadge');
    const textEl  = document.getElementById('bcText');
    const subEl   = document.getElementById('bcSub');

    if (!badgeEl || !textEl) return;

    // Fade out
    [badgeEl, textEl].forEach(el => el.style.opacity = '0');

    setTimeout(() => {
      badgeEl.textContent  = msg.type.toUpperCase();
      badgeEl.className    = `bc-badge bc-badge-${msg.type}`;
      textEl.textContent   = msg.text;
      if (subEl) subEl.textContent = msg.sub || '';

      // Fade in
      [badgeEl, textEl].forEach(el => el.style.opacity = '1');
    }, 250);
  }

  // Init after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
