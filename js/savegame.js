// ══════════════════════════════════════════════════
//  SAVEGAME.JS — Persistent run save / resume / forfeit
// ══════════════════════════════════════════════════

const SaveGame = {
  _KEY:      'tsats_run',
  _META_KEY: 'tsats_run_meta',
  _TTL:      3 * 24 * 60 * 60 * 1000, // 3 days

  // ── SAVE ─────────────────────────────────────────
  save(G) {
    if (!G.p) return;
    const p = G.p;

    try {
      const data = {
        ts: Date.now(),
        p: {
          arch:      p.arch,
          bankroll:  p.bankroll,
          lvl:       p.lvl,
          ril:       p.ril,
          luck:      p.luck,
          heat:      p.heat,
          hand:      [...p.hand],
          jokers:    [...p.jokers],
          tw:        p.tw,
          tl:        p.tl,
          bw:        p.bw,
          bl:        p.bl,
          wins:      p.wins,
          pm:        p.pm,
          psa:       p.psa,
          coa:       p.coa,
          hedge:     p.hedge,
          wcb:       p.wcb,
          debuff:    p.debuff,
          rce:       p.rce,
          _mwBonus:  p._mwBonus,
        },
        shop: G._shop ? {
          cards:       G._shop.cards  || [],
          jokers:      G._shop.jokers || [],
          sold:        [...(G._shop.sold || [])],
          rc:          G._shop.rc || 10,
          _priceScale: G._shop._priceScale || 1,
        } : null,
        boss:       G._boss      || null,
        rrcount:    G._rrcount   || 0,
        fixerUsed:  G._fixerUsed || false,
        screen:     _currentScreen(),
      };

      localStorage.setItem(this._KEY, JSON.stringify(data));

      const meta = {
        ts:       data.ts,
        arch:     p.arch,
        lvl:      p.lvl,
        bankroll: p.bankroll,
      };
      localStorage.setItem(this._META_KEY, JSON.stringify(meta));
    } catch (e) {
      console.warn('SaveGame.save failed:', e);
    }
  },

  // ── LOAD ─────────────────────────────────────────
  load() {
    try {
      const raw = localStorage.getItem(this._KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data.ts > this._TTL) { this.clear(); return null; }
      return data;
    } catch { return null; }
  },

  loadMeta() {
    try {
      const raw = localStorage.getItem(this._META_KEY);
      if (!raw) return null;
      const meta = JSON.parse(raw);
      if (Date.now() - meta.ts > this._TTL) return null;
      return meta;
    } catch { return null; }
  },

  // ── CLEAR ────────────────────────────────────────
  clear() {
    try {
      localStorage.removeItem(this._KEY);
      localStorage.removeItem(this._META_KEY);
    } catch {}
  },

  // ── RESTORE ──────────────────────────────────────
  restore(G, data) {
    G.p = { ...data.p, hand: [...data.p.hand], jokers: [...data.p.jokers] };

    if (data.shop) {
      G._shop = {
        cards:       data.shop.cards,
        jokers:      data.shop.jokers,
        sold:        new Set(data.shop.sold),
        rc:          data.shop.rc,
        _priceScale: data.shop._priceScale,
      };
    } else {
      G._shop = { cards: [], jokers: [], sold: new Set(), rc: 10, _priceScale: 1 };
    }

    G._boss       = data.boss      || null;
    G._rrcount    = data.rrcount   || 0;
    G._fixerUsed  = data.fixerUsed || false;

    // Re-fire onEquip for jokers with side effects
    G.p.jokers.forEach(jid => {
      const j = JOKERS[jid];
      if (j && j.onEquip) j.onEquip(G);
    });
  },

  // ── RESUME ───────────────────────────────────────
  resume(G) {
    const data = this.load();
    if (!data) return false;

    this.restore(G, data);

    const s = data.screen;
    if (s === 'shop') {
      Render.shop(G);
      screen('shop');
    } else if (s === 'boss') {
      Boss.show(G);
    } else {
      // betting/sim/payout states all safely restart the level
      G.p.ril = 0;
      G.startLevel();
    }

    return true;
  },

  // ── CONTINUE PROMPT ──────────────────────────────
  showContinuePrompt(G) {
    const el = $('continue-prompt');
    if (!el) return;

    const meta = this.loadMeta();
    if (!meta) {
      el.innerHTML = '';
      const nr = $('new-run-btn');
      if (nr) nr.style.display = '';
      return;
    }

    const arch   = ARCHETYPES[meta.arch];
    const archIco = arch ? arch.icon : '?';
    const archNm  = arch ? arch.name : meta.arch;
    const ago     = Stats._timeAgo(meta.ts);

    el.innerHTML = `
      <div class="cp-box">
        <div class="cp-title">◈ RESUME RUN</div>
        <div class="cp-info">
          <span class="cp-arch">${archIco} ${archNm}</span>
          <span class="cp-sep">·</span>
          <span class="cp-lvl">LVL ${meta.lvl}</span>
          <span class="cp-sep">·</span>
          <span class="cp-br">${fmt(meta.bankroll)}</span>
          <br><span class="cp-ago">${ago}</span>
        </div>
        <div class="cp-btns">
          <button class="btn btn-cyan cp-yes" onclick="SaveGame.resume(G)">▶ CONTINUE</button>
          <button class="btn btn-ghost cp-no"  onclick="SaveGame._discardAndNew(G)">✕ NEW RUN</button>
        </div>
      </div>`;

    // Hide standalone new-run button when save exists
    const nr = $('new-run-btn');
    if (nr) nr.style.display = 'none';
  },

  _discardAndNew(G) {
    if (confirm('Discard your saved run and start fresh?')) {
      this.clear();
      const el = $('continue-prompt');
      if (el) el.innerHTML = '';
      const nr = $('new-run-btn');
      if (nr) nr.style.display = '';
      G.nav('charselect');
    }
  },
};

// ── FORFEIT ──────────────────────────────────────
const Forfeit = {
  open() {
    const el = $('forfeit-overlay');
    if (el) el.style.display = 'flex';
  },
  close() {
    const el = $('forfeit-overlay');
    if (el) el.style.display = 'none';
  },
  confirm() {
    SaveGame.clear();
    this.close();
    G.restart();
  },
};

// ── HELPER ───────────────────────────────────────
function _currentScreen() {
  const active = document.querySelector('.screen.active');
  if (!active) return 'betting';
  return active.id.replace('s-', '');
}
