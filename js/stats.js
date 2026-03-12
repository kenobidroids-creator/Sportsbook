// ══════════════════════════════════════════════════
//  STATS.JS — Run history, high scores, localStorage
// ══════════════════════════════════════════════════

const Stats = {
  _key: 'tsats_stats',

  // ── DEFAULT STATE ────────────────────────────────
  _default() {
    return {
      totalRuns:    0,
      totalWins:    0,
      bestBankroll: 0,
      bestLevel:    0,
      totalBetsWon: 0,
      totalBetsLost:0,
      archetypeWins:{ degenerate: 0, mathwhiz: 0, luckyidiot: 0 },
      archetypeRuns:{ degenerate: 0, mathwhiz: 0, luckyidiot: 0 },
      lastRun:      null,
      history:      [],   // last 10 runs
    };
  },

  // ── LOAD ─────────────────────────────────────────
  load() {
    try {
      const raw = localStorage.getItem(this._key);
      return raw ? { ...this._default(), ...JSON.parse(raw) } : this._default();
    } catch { return this._default(); }
  },

  // ── SAVE ─────────────────────────────────────────
  save(data) {
    try { localStorage.setItem(this._key, JSON.stringify(data)); } catch {}
  },

  // ── RECORD RUN ───────────────────────────────────
  record(G, won) {
    const p   = G.p;
    const s   = this.load();

    s.totalRuns++;
    if (won) {
      s.totalWins++;
      s.archetypeWins[p.arch] = (s.archetypeWins[p.arch] || 0) + 1;
    }
    s.archetypeRuns[p.arch] = (s.archetypeRuns[p.arch] || 0) + 1;
    s.bestBankroll = Math.max(s.bestBankroll, p.bankroll);
    s.bestLevel    = Math.max(s.bestLevel,    p.lvl);
    s.totalBetsWon  += p.bw;
    s.totalBetsLost += p.bl;

    const entry = {
      arch:     p.arch,
      won,
      bankroll: p.bankroll,
      level:    p.lvl,
      bw:       p.bw,
      bl:       p.bl,
      date:     Date.now(),
    };
    s.lastRun = entry;
    s.history = [entry, ...(s.history || [])].slice(0, 10);

    this.save(s);
    return s;
  },

  // ── RESET ────────────────────────────────────────
  reset() {
    try { localStorage.removeItem(this._key); } catch {}
  },

  // ── RENDER TITLE PANEL ───────────────────────────
  renderTitle() {
    const el = $('stats-panel');
    if (!el) return;
    const s = this.load();

    if (s.totalRuns === 0) {
      el.innerHTML = `<div class="stitle-row" style="justify-content:center;color:var(--dim);font-size:9px">NO RUNS YET — PLACE YOUR FIRST BET</div>`;
      return;
    }

    const winRate = s.totalRuns > 0 ? Math.round(s.totalWins / s.totalRuns * 100) : 0;
    const betRate = (s.totalBetsWon + s.totalBetsLost) > 0
      ? Math.round(s.totalBetsWon / (s.totalBetsWon + s.totalBetsLost) * 100) : 0;

    // Best archetype
    let bestArch = '—', bestWins = -1;
    Object.entries(s.archetypeWins).forEach(([k, v]) => {
      if (v > bestWins) { bestWins = v; bestArch = ARCHETYPES[k]?.name || k; }
    });

    // Last run tag
    let lastTag = '';
    if (s.lastRun) {
      const ago = this._timeAgo(s.lastRun.date);
      const icon = s.lastRun.won ? '🏆' : '💀';
      const aName = ARCHETYPES[s.lastRun.arch]?.name || s.lastRun.arch;
      lastTag = `<div class="stitle-row"><span>LAST RUN</span><span>${icon} ${aName} · LVL ${s.lastRun.level} · ${ago}</span></div>`;
    }

    el.innerHTML = `
      <div class="stats-title-bar">
        <span class="stlbl">📊 CAREER STATS</span>
        <button class="btn-ghost" style="font-size:8px;padding:3px 8px;border:1px solid var(--border);background:var(--bg3);color:var(--dim);cursor:pointer;font-family:'Press Start 2P',monospace" onclick="Stats._confirmReset()">RESET</button>
      </div>
      <div class="stitle-grid">
        <div class="sstat"><div class="sstat-v">${s.totalRuns}</div><div class="sstat-l">RUNS</div></div>
        <div class="sstat"><div class="sstat-v" style="color:var(--green)">${s.totalWins}</div><div class="sstat-l">WINS</div></div>
        <div class="sstat"><div class="sstat-v" style="color:var(--cyan)">${winRate}%</div><div class="sstat-l">WIN RATE</div></div>
        <div class="sstat"><div class="sstat-v" style="color:var(--gold)">${fmt(s.bestBankroll)}</div><div class="sstat-l">BEST ROLL</div></div>
        <div class="sstat"><div class="sstat-v" style="color:var(--purple)">${s.bestLevel}/10</div><div class="sstat-l">BEST LVL</div></div>
        <div class="sstat"><div class="sstat-v" style="color:var(--dim)">${betRate}%</div><div class="sstat-l">BET W/R</div></div>
      </div>
      ${lastTag}`;
  },

  _timeAgo(ts) {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60)   return 'just now';
    if (sec < 3600) return Math.floor(sec / 60) + 'm ago';
    if (sec < 86400) return Math.floor(sec / 3600) + 'h ago';
    return Math.floor(sec / 86400) + 'd ago';
  },

  _confirmReset() {
    if (confirm('Reset all career stats? This cannot be undone.')) {
      this.reset();
      this.renderTitle();
      showToast('Stats reset.', 'ti');
    }
  },
};
