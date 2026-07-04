/* ============================================================
   GLOBAL JS — Birthday Experience
   Audio · Cursor · Transitions · Storage · Utilities
   ============================================================ */

'use strict';

/* ============================================================
   STORAGE MANAGER
   ============================================================ */
const Store = {
  KEY: 'raaani_birthday_2026',

  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || this._defaults(); }
    catch { return this._defaults(); }
  },

  set(updates) {
    try { localStorage.setItem(this.KEY, JSON.stringify({ ...this.get(), ...updates })); }
    catch {}
  },

  _defaults: () => ({
    currentPage:    1,
    musicOn:        true,
    volume:         0.55,
    completedPages: [],
    discoveries:    [],
    openedLetters:  [],
    gameStates:     {},
    candlesBlown:   false,
    puzzleDone:     false,
    scratchDone:    false,
    giftOpened:     false
  }),

  pageComplete(n) {
    const s = this.get();
    if (!s.completedPages.includes(n)) {
      s.completedPages.push(n);
      this.set(s);
    }
  },

  discover(id) {
    const s = this.get();
    if (!s.discoveries.includes(id)) {
      s.discoveries.push(id);
      this.set(s);
    }
    return !this.get().discoveries.includes(id); // true if new
  },

  hasDiscovered(id) { return this.get().discoveries.includes(id); }
};

/* ============================================================
   AUDIO MANAGER
   ============================================================ */
const Audio$ = {
  el:         null,
  playing:    false,
  vol:        0.55,
  _fadeTimer: null,

  init() {
    this.el = document.createElement('audio');
    this.el.src   = 'audio/wada-karo.mp3';
    this.el.loop  = true;
    this.el.volume = 0;
    document.body.appendChild(this.el);

    const saved = Store.get();
    this.vol = saved.volume || 0.55;

    // Try autoplay on first user gesture
    if (saved.musicOn !== false) {
      document.addEventListener('click', () => this._startOnce(), { once: true });
    }
    return this;
  },

  _startOnce() {
    if (this.playing) return;
    this.el.play().then(() => {
      this.playing = true;
      this._fadeIn(this.vol, 3500);
      this._updateUI();
      Store.set({ musicOn: true });
    }).catch(() => this._showInvite());
  },

  play() {
    this.el.play().then(() => {
      this.playing = true;
      this._fadeIn(this.vol, 2500);
      this._updateUI();
      Store.set({ musicOn: true });
      this._hideInvite();
    }).catch(() => this._showInvite());
  },

  pause() {
    this._fadeOut(1200, () => this.el.pause());
    this.playing = false;
    Store.set({ musicOn: false });
    this._updateUI();
  },

  toggle() { this.playing ? this.pause() : this.play(); },

  _fadeIn(target, ms) {
    clearInterval(this._fadeTimer);
    const steps = 50, inc = target / steps, interval = ms / steps;
    let v = 0;
    this._fadeTimer = setInterval(() => {
      v = Math.min(v + inc, target);
      this.el.volume = v;
      if (v >= target) clearInterval(this._fadeTimer);
    }, interval);
  },

  _fadeOut(ms, cb) {
    clearInterval(this._fadeTimer);
    const start = this.el.volume, steps = 40, dec = start / steps, interval = ms / steps;
    let v = start;
    this._fadeTimer = setInterval(() => {
      v = Math.max(v - dec, 0);
      this.el.volume = v;
      if (v <= 0) { clearInterval(this._fadeTimer); if (cb) cb(); }
    }, interval);
  },

  setVol(v) {
    this.vol = Math.max(0, Math.min(1, v));
    this.el.volume = this.vol;
    Store.set({ volume: this.vol });
  },

  _updateUI() {
    const player = document.querySelector('.music-player');
    const disc   = document.querySelector('.vinyl-disc-wrap');
    const btn    = document.getElementById('music-toggle');
    if (player) player.classList.add('visible');
    if (disc)   disc.classList.toggle('playing', this.playing);
    if (btn)    btn.textContent = this.playing ? '⏸' : '▶';
  },

  _showInvite() {
    const inv = document.getElementById('music-invite');
    if (inv) inv.classList.add('visible');
  },
  _hideInvite() {
    const inv = document.getElementById('music-invite');
    if (inv) { inv.style.opacity = '0'; setTimeout(() => inv.remove(), 600); }
  }
};

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
function initCursor() {
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  document.body.append(cursor, dot);

  let mx = -200, my = -200, dx = -200, dy = -200;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.cssText += `left:${mx}px;top:${my}px;`;
  });

  // Dot lags behind cursor for trail effect
  (function animDot() {
    dx += (mx - dx) * 0.16;
    dy += (my - dy) * 0.16;
    dot.style.cssText = `left:${dx}px;top:${dy}px;`;
    requestAnimationFrame(animDot);
  })();

  // Hover state on interactive elements
  document.addEventListener('mouseover', e => {
    if (e.target.closest('button,[onclick],[data-click],a,.polaroid,.flip-photo,.book-item,.candle-wrap,.cat-wrap,.coffee-wrap')) {
      cursor.classList.add('hovering');
    }
  });
  document.addEventListener('mouseout', () => cursor.classList.remove('hovering'));
}

/* ============================================================
   DUST / AMBIENT PARTICLES (canvas)
   ============================================================ */
function initDust(canvasId, count = 28) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize(); addEventListener('resize', resize);

  const particles = Array.from({ length: count }, () => ({
    x:  Math.random() * innerWidth,
    y:  Math.random() * innerHeight,
    r:  Math.random() * 1.8 + 0.4,
    vx: (Math.random() - 0.5) * 0.25,
    vy: -(Math.random() * 0.35 + 0.08),
    life: Math.random()
  }));

  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life += 0.0025;
      if (p.life > 1) {
        p.life = 0; p.x = Math.random() * canvas.width; p.y = canvas.height + 5;
      }
      const alpha = Math.sin(p.life * Math.PI) * 0.45;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(196,168,98,${alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  })();
}

/* ============================================================
   RAIN GENERATOR
   ============================================================ */
function initRain(containerId, count = 45) {
  const c = document.getElementById(containerId);
  if (!c) return;
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'rain-drop';
    d.style.setProperty('--x',     Math.random() * 100 + '%');
    d.style.setProperty('--dur',   (Math.random() * 0.7 + 0.75) + 's');
    d.style.setProperty('--delay', (-Math.random() * 2.5) + 's');
    d.style.setProperty('--h',     (Math.random() * 9 + 8) + 'px');
    d.style.setProperty('--op',    (Math.random() * 0.35 + 0.25).toFixed(2));
    c.appendChild(d);
  }
}

/* ============================================================
   PARTICLE BURST (wax seal, discoveries)
   ============================================================ */
function burst(x, y, opts = {}) {
  const { count = 22, colors = ['#C4A862','#C9B8E8','#E8B4B8','#9CAF88','#F5EDD8'] } = opts;
  const canvas = document.getElementById('particle-canvas') || (() => {
    const c = document.createElement('canvas');
    c.id = 'particle-canvas';
    c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99992;';
    c.width = innerWidth; c.height = innerHeight;
    document.body.appendChild(c);
    return c;
  })();
  const ctx = canvas.getContext('2d');

  const ps = Array.from({ length: count }, () => ({
    x, y,
    vx: (Math.random() - 0.5) * 9,
    vy: (Math.random() - 0.5) * 9 - 3,
    r:  Math.random() * 4 + 1.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 1
  }));

  (function animate() {
    ps.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.life -= 0.025;
    });
    ctx.clearRect(x - 120, y - 120, 240, 240);
    ps.filter(p => p.life > 0).forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    if (ps.some(p => p.life > 0)) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  })();
}

/* ============================================================
   TEXT REVEAL — handwriting simulation
   ============================================================ */
function writeText(el, text, opts = {}) {
  const { speed = 50, variance = 30, delay = 200, onDone } = opts;
  el.innerHTML = '';
  let i = 0;

  const next = () => {
    if (i >= text.length) { onDone && setTimeout(onDone, 400); return; }
    const ch = text[i++];
    if (ch === '\n') { el.appendChild(document.createElement('br')); }
    else {
      const s = document.createElement('span');
      s.textContent = ch;
      s.style.animation = 'ink-bloom 0.18s ease forwards';
      el.appendChild(s);
    }
    const wait = ch === ' ' ? speed * 0.6
               : '.,:!?'.includes(ch) ? speed * 5
               : speed + (Math.random() - 0.5) * variance;
    setTimeout(next, Math.max(12, wait));
  };

  setTimeout(next, delay);
}

/* ============================================================
   PAGE NAVIGATION
   ============================================================ */
function goTo(url) {
  const overlay = document.getElementById('page-transition');
  if (overlay) {
    overlay.classList.add('exiting');
    setTimeout(() => { window.location.href = url; }, 860);
  } else {
    window.location.href = url;
  }
}

/* ============================================================
   PETALS EFFECT
   ============================================================ */
function launchPetals(count = 20, color = '#E8B4B8') {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.style.cssText = `
        position:fixed; pointer-events:none; z-index:9991;
        width:${6+Math.random()*8}px; height:${4+Math.random()*6}px;
        background:${color}; border-radius:60% 40% 60% 40%;
        left:${Math.random()*100}vw; top:-12px; opacity:0.85;
        --drift:${(Math.random()-0.5)*140}px;
        animation: petal-fall ${2.8+Math.random()*2.5}s linear forwards;
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 6000);
    }, i * 160 + Math.random() * 200);
  }
}

/* ============================================================
   HEARTS EFFECT
   ============================================================ */
function launchHearts(x, y, count = 6) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const h = document.createElement('div');
      h.textContent = '♡';
      h.style.cssText = `
        position:fixed; pointer-events:none; z-index:9991;
        left:${x + (Math.random()-0.5)*60}px;
        top:${y}px; font-size:${14+Math.random()*14}px;
        color:var(--rose); opacity:1;
        --rot:${(Math.random()-0.5)*30}deg;
        --rot2:${(Math.random()-0.5)*60}deg;
        animation: heart-float ${1.4+Math.random()*0.8}s ease-out forwards;
      `;
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 2400);
    }, i * 80);
  }
}

/* ============================================================
   HELPER: show a secret message tooltip
   ============================================================ */
function secretMessage(msg, x, y, opts = {}) {
  const { color = '#F0EBFA', duration = 3000 } = opts;
  const tip = document.createElement('div');
  tip.style.cssText = `
    position:fixed; left:${x}px; top:${y}px; transform:translateX(-50%);
    background:${color}; border:1px solid var(--lavender);
    padding:10px 16px; border-radius:20px; font-family:var(--font-hand);
    font-size:14px; color:var(--text-dark); pointer-events:none;
    z-index:9996; opacity:0; transition:opacity 0.4s ease;
    box-shadow:var(--shadow-warm); white-space:nowrap;
  `;
  tip.textContent = msg;
  document.body.appendChild(tip);
  requestAnimationFrame(() => tip.style.opacity = '1');
  setTimeout(() => {
    tip.style.opacity = '0';
    setTimeout(() => tip.remove(), 450);
  }, duration);
}

/* ============================================================
   VINYL SVG (inline, reused everywhere)
   ============================================================ */
function vinylSVG() {
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <g class="vinyl-rotate">
      <circle cx="20" cy="20" r="19" fill="#1A0E06"/>
      <circle cx="20" cy="20" r="15" fill="none" stroke="#2E1E10" stroke-width="1" opacity="0.8"/>
      <circle cx="20" cy="20" r="12" fill="none" stroke="#2E1E10" stroke-width="0.8" opacity="0.6"/>
      <circle cx="20" cy="20" r="9"  fill="none" stroke="#2E1E10" stroke-width="0.8" opacity="0.5"/>
      <circle cx="20" cy="20" r="5.5" fill="#C4A862"/>
      <circle cx="20" cy="20" r="2.5" fill="#1A0E06"/>
      <circle cx="20" cy="20" r="1"   fill="#C4A862"/>
    </g>
  </svg>`;
}

/* ============================================================
   INIT ON DOM READY
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Cursor
  initCursor();

  // Audio
  Audio$.init();

  // Music toggle
  const btn = document.getElementById('music-toggle');
  if (btn) btn.addEventListener('click', e => { e.stopPropagation(); Audio$.toggle(); });

  // Music invite click
  const inv = document.getElementById('music-invite');
  if (inv) inv.addEventListener('click', () => Audio$.play());

  // Inject vinyl SVG
  document.querySelectorAll('.vinyl-disc-wrap').forEach(el => { el.innerHTML = vinylSVG(); });

  // Dust
  initDust('dust-canvas');

  // Rain
  initRain('rain-container');

  // Page transition overlay
  const ov = document.getElementById('page-transition');
  if (!ov) {
    const d = document.createElement('div');
    d.id = 'page-transition';
    document.body.appendChild(d);
  }

  // Fade-in the page
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.85s ease';
  requestAnimationFrame(() => { document.body.style.opacity = '1'; });
});

/* Expose globally */
window.Store    = Store;
window.Audio$   = Audio$;
window.goTo     = goTo;
window.burst    = burst;
window.writeText = writeText;
window.launchPetals = launchPetals;
window.launchHearts = launchHearts;
window.secretMessage = secretMessage;

/* ============================================================
   UNIVERSAL PAGE NAV — auto-shows continue after 18s
   ============================================================ */
(function() {
  const PAGE_ROUTES = {
    'index.html': null,
    'page2.html': 'page3.html',
    'page3.html': 'page4.html',
    'page4.html': 'page5.html',
    'page5.html': 'page6.html',
    'page6.html': 'page8.html',
    'page7.html': 'page8.html',
    'page8.html': 'page9.html',
    'page9.html': 'page10.html',
    'page10.html': null
  };

  const PAGE_LABELS = {
    'page2.html': 'open our scrapbook ✦',
    'page3.html': 'our little world ✦',
    'page4.html': 'the letter 💌',
    'page5.html': 'our tomorrows ✦',
    'page6.html': 'happy birthday my raaaani ✦',
    'page7.html': null,
    'page8.html': 'one last thing...',
    'page9.html': 'come home ✦',
    'page10.html': null
  };
})();

  document.addEventListener('DOMContentLoaded', () => {
    const file = window.location.pathname.split('/').pop() || 'index.html';
    const next = PAGE_ROUTES[file];
    if (!next) return;

    // Create floating nav that always appears after 18s
    const nav = document.createElement('div');
    nav.id = 'universal-nav';
    nav.style.cssText = `
      position:fixed; bottom:32px; right:36px; z-index:9000;
      opacity:0; transition:opacity 0.9s ease; pointer-events:none;
      display:flex; flex-direction:column; align-items:flex-end; gap:8px;
    `;
    const hint = document.createElement('div');
    hint.style.cssText = `font-family:var(--font-hand);font-size:13px;color:rgba(255,240,220,0.45);text-align:right;`;
    hint.textContent = 'explore then continue...';
    const btn = document.createElement('button');
    btn.style.cssText = `
      background:var(--coffee);color:var(--cream);border:none;
      padding:15px 36px;border-radius:40px;
      font-family:var(--font-hand);font-size:clamp(16px,2vw,20px);
      cursor:none;box-shadow:0 4px 20px rgba(107,66,38,0.35);
      transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);
      display:flex;align-items:center;gap:10px;
    `;
    btn.textContent = PAGE_LABELS[next] || 'continue ✦';
    btn.addEventListener('mouseover', () => btn.style.transform = 'scale(1.06) translateY(-3px)');
    btn.addEventListener('mouseout',  () => btn.style.transform = 'scale(1)');
    btn.addEventListener('click', () => goTo(next));
    nav.append(hint, btn);
    document.body.appendChild(nav);

    // Show after 18s — always
    setTimeout(() => {
      nav.style.opacity = '1';
      nav.style.pointerEvents = 'auto';
    }, 18000);

    // Also show if any existing ".show" class is added to existing continue elements
    const observer = new MutationObserver(() => {
      const shown = document.querySelector('[class*="continue"].show, [class*="cont"].show');
      if (shown) {
        nav.style.opacity = '1';
        nav.style.pointerEvents = 'auto';
      }
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
  });
})();
