// ══════════════════════════════════════════════════
//  UTILS.JS — Helpers, audio, DOM, effects
// ══════════════════════════════════════════════════

// ── MATH HELPERS ────────────────────────────────
const rnd    = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const rndF   = (a, b) => Math.random() * (b - a) + a;
const clamp  = (v, a, b) => Math.max(a, Math.min(b, v));
const pick   = arr => arr[rnd(0, arr.length - 1)];
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

// ── DOM SHORTCUTS ────────────────────────────────
const $  = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const fmt = n => `$${Math.abs(Math.round(n)).toLocaleString()}`;

// ── WIN CHANCE CALCULATOR ────────────────────────
// Centralised so jokers/cards/luck all feed into one number
function calcChance(G) {
  const p = G.p;
  if (!p.bet) return 50;

  let base = p.bet.win;

  // Unknown bets
  if (p.bet.risk === 'UNKNOWN') base = rnd(10, 60);

  // Luck: each point = +1.5%
  base += (p.luck - 5) * 1.5;

  // Card/joker bonuses accumulated into wcb
  base += (p.wcb || 0);

  // Debuff (Clown Shoes etc.)
  base -= (p.debuff || 0);

  // Math Whiz perk bonus
  if (p.arch === 'mathwhiz' && p._mwBonus) base += p._mwBonus;

  // Inside Man joker on first bet of level
  if (p.jokers.includes('inside_man') && p.ril === 0) base += 5;

  // Level scaling — harder each level
  base -= (p.lvl - 1) * 1.2;

  return clamp(Math.round(base), 5, 95);
}

// ── SCREEN TRANSITIONS ───────────────────────────
function screen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  const s = $('s-' + id);
  if (s) {
    s.classList.add('active');
    s.classList.add('fadein');
    setTimeout(() => s.classList.remove('fadein'), 500);
    // reset scroll
    const scroll = s.querySelector('.scroll-body');
    if (scroll) scroll.scrollTop = 0;
  }
}

// ── TOAST ────────────────────────────────────────
let _toastTimer;
function showToast(msg, cls = 'ti') {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = cls + ' show';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.className = '', 2800);
}

// ── COIN PARTICLE BURST ──────────────────────────
function coins(x, y, n = 10) {
  const emojis = ['💰', '🪙', '💵', '💴'];
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div');
    d.className = 'coin';
    d.textContent = pick(emojis);
    d.style.left = (x + rnd(-80, 80)) + 'px';
    d.style.top  = (y - rnd(0, 60)) + 'px';
    d.style.animationDelay = rnd(0, 400) + 'ms';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1600);
  }
}

// ── SCREEN FLASH ─────────────────────────────────
function flashScreen(color = '#00e676', dur = 300) {
  const d = document.createElement('div');
  d.style.cssText = `position:fixed;inset:0;background:${color};opacity:0.12;pointer-events:none;z-index:9999;
    animation:flashFade ${dur}ms ease forwards;`;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), dur + 100);
}

// ── AUDIO ─────────────────────────────────────────
let _AC;
function _beep(freq = 440, dur = 0.12, type = 'square', vol = 0.07) {
  try {
    if (!_AC) _AC = new (window.AudioContext || window.webkitAudioContext)();
    const o = _AC.createOscillator();
    const g = _AC.createGain();
    o.connect(g);
    g.connect(_AC.destination);
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, _AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, _AC.currentTime + dur);
    o.start();
    o.stop(_AC.currentTime + dur);
  } catch (e) { /* silent fail */ }
}

const SFX = {
  click()  { _beep(660, 0.05, 'square', 0.05); },
  win()    { _beep(880, 0.08, 'square', 0.08); setTimeout(() => _beep(1100, 0.1, 'square', 0.08), 90); setTimeout(() => _beep(1320, 0.15, 'square', 0.08), 200); },
  bigwin() { _beep(880, 0.08, 'square', 0.1); setTimeout(() => _beep(1100, 0.1, 'square', 0.1), 80); setTimeout(() => _beep(1320, 0.12, 'square', 0.1), 170); setTimeout(() => _beep(1760, 0.25, 'square', 0.1), 270); },
  loss()   { _beep(220, 0.15, 'sawtooth', 0.07); setTimeout(() => _beep(180, 0.2, 'sawtooth', 0.07), 160); },
  goon()   { _beep(120, 0.3, 'sawtooth', 0.08); },
  boss()   { _beep(80, 0.4, 'sawtooth', 0.09); setTimeout(() => _beep(60, 0.6, 'sawtooth', 0.09), 300); },
  select() { _beep(440, 0.06, 'triangle', 0.05); },
  buy()    { _beep(550, 0.08, 'square', 0.06); setTimeout(() => _beep(770, 0.1, 'square', 0.06), 80); },
};
