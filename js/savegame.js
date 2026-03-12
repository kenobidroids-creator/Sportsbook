// ══════════════════════════════════════════════════
//  SAVEGAME.JS — Persistent run state (auto-save/load)
//  Saves at: post-payout, post-shop, post-boss
//  Loads on startup with "Continue?" prompt
// ══════════════════════════════════════════════════

const SaveGame = {
  _key:     'tsats_run',
  _metaKey: 'tsats_run_meta',

  // ── SAVE ─────────────────────────────────────────
  save(G) {
    if (!G.p) return;
    try {
      // _shop.sold is a Set — convert for JSON
      const shopData = G._shop ? {
        ...G._shop,
        sold: G._shop.sold ? [...G._shop.sold] : [],
      } : null;

      const payload = {
        p:          { ...G.p },
        _boss:      G._boss ? { ...G._boss } : null,
        _shop:      shopData,
        _rrcount:   G._rrcount,
        _fixerUsed: G._fixerUsed,
        _savedAt:   Date.now(),
        _screen:    this._currentScreen(),
      };
      localStorage.setItem(this._key, JSON.stringify(payload));

      // Light meta for the "continue?" prompt
      localStorage.setItem(this._metaKey, JSON.stringify({
        arch:     G.p.arch,
        lvl:      G.p.lvl,
        bankroll: G.p.bankroll,
        savedAt:  Date.now(),
      }));
    } catch (e) {
      console.warn('SaveGame.save failed:', e);
    }
  },

  // ── LOAD ─────────────────────────────────────────
  load() {
    try {
      const raw = localStorage.getItem(this._key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  // ── META (for continue prompt) ───────────────────
  loadMeta() {
    try {
      const raw = localStorage.getItem(this._metaKey);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  // ── CLEAR ────────────────────────────────────────
  clear() {
    try {
      localStorage.removeItem(this._key);
      localStorage.removeItem(this._metaKey);
    } catch {}
  },

  // ── APPLY SAVE DATA TO G ─────────────────────────
  restore(G, data) {
    // Restore player
    G.p = data.p;

    // Re-hydrate Set from array
    if (data._shop) {
      G._shop = {
        ...data._shop,
        sold: new Set(data._shop.sold || []),
      };
    }
    G._boss      = data._boss || null;
    G._rrcount   = data._rrcount || 0;
    G._fixerUsed = data._fixerUsed || false;

    // Re-fire onEquip for jokers that set persistent flags
    if (G.p.jokers) {
      G.p.jokers.forEach(j => {
        const jd = JOKERS[j];
        if (jd?.onEquip) jd.onEquip(G);
      });
    }
  },

  // ── FIGURE OUT WHERE TO RESUME ───────────────────
  resume(G, savedScreen) {
    const p = G.p;
    // If we were mid-bet or sim, go back to betting board (safest)
    if (savedScreen === 'betting' || savedScreen === 'sim' || savedScreen === 'payout') {
      p.bet = null; p.betIdx = null;
      p.wager = Math.min(25, p.bankroll);
      p.wcb = 0; p.pm = 1;
      p.hedge = false; p.psa = false; p.coa = false; p.iia = false;
      p.playedCard = null;
      G.startLevel();
      return;
    }
    if (savedScreen === 'shop') {
      Render.shop(G);
      screen('shop');
      return;
    }
    if (savedScreen === 'boss') {
      if (G._boss) Boss.show(G);
      else G.startLevel();
      return;
    }
    if (savedScreen === 'goon') {
      // Skip the goon and continue — fairer than a surprise visit on reload
      G.startLevel();
      return;
    }
    // Default: restart level from round 1
    G.startLevel();
  },

  // Detect which screen is active
  _currentScreen() {
    const screens = ['betting', 'sim', 'payout', 'shop', 'boss', 'goon', 'over', 'win'];
    for (const id of screens) {
      const el = document.getElementById('s-' + id);
      if (el?.classList.contains('active')) return id;
    }
    return 'betting';
  },

  // ── SHOW CONTINUE PROMPT ON TITLE ────────────────
  showContinuePrompt(G) {
    const meta = this.loadMeta();
    if (!meta) return;

    // Don't show if run was more than 3 days ago
    if (Date.now() - meta.savedAt > 3 * 24 * 60 * 60 * 1000) {
      this.clear();
      return;
    }

    const arch = ARCHETYPES[meta.arch];
    const ago  = this._timeAgo(meta.savedAt);
    const el   = document.getElementById('continue-prompt');
    if (!el) return;

    el.innerHTML = `
      <div class="cp-box">
        <div class="cp-title">📂 CONTINUE RUN?</div>
        <div class="cp-info">
          <span class="cp-arch">${arch?.icon || '?'} ${arch?.name || meta.arch}</span>
          <span class="cp-sep">·</span>
          <span class="cp-lvl">LVL ${meta.lvl}</span>
          <span class="cp-sep">·</span>
          <span class="cp-br">${fmt(meta.bankroll)}</span>
          <span class="cp-ago">${ago}</span>
        </div>
        <div class="cp-btns">
          <button class="cp-yes btn-primary" onclick="SaveGame._doResume()">▶ CONTINUE</button>
          <button class="cp-no  btn-ghost"   onclick="SaveGame._doDiscard()">✕ NEW RUN</button>
        </div>
      </div>`;
    el.classList.add('open');
  },

  _doResume() {
    const data = this.load();
    if (!data) { this._doDiscard(); return; }
    document.getElementById('continue-prompt')?.classList.remove('open');
    SaveGame.restore(G, data);
    showToast(`▶ Run restored — LVL ${G.p.lvl}`, 'ti');
    SaveGame.resume(G, data._screen);
  },

  _doDiscard() {
    this.clear();
    document.getElementById('continue-prompt')?.classList.remove('open');
  },

  _timeAgo(ts) {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60)    return 'just now';
    if (sec < 3600)  return Math.floor(sec / 60) + 'm ago';
    if (sec < 86400) return Math.floor(sec / 3600) + 'h ago';
    return Math.floor(sec / 86400) + 'd ago';
  },
};

// ── FORFEIT MODAL ─────────────────────────────────
const Forfeit = {
  open() {
    const el = document.getElementById('forfeit-overlay');
    if (el) el.style.display = 'flex';
    SFX.click();
  },
  close() {
    const el = document.getElementById('forfeit-overlay');
    if (el) el.style.display = 'none';
  },
  confirm() {
    SaveGame.clear();
    G.restart();
    this.close();
    showToast('Run forfeited. Starting fresh.', 'tl');
  },
};
