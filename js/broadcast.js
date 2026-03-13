// ══════════════════════════════════════════════════
//  BROADCAST.JS — v4: room + CRT TV layout
//  TV pixel scenes handled by tv.js
//  Fans drawn on canvas elements in bc-fans
// ══════════════════════════════════════════════════

const Broadcast = {

  _iv:              null,
  _tickIv:          null,
  _skipRequested:   false,
  _paused:          false,
  _interruptShown:  false,
  _interruptChoice: null,
  _lastLabelMom:    -999,
  _lastJitterTs:    0,
  _displayMom:      50,
  _logLines:        [],
  _logStart:        0,
  _crowdPool:       0,
  _crowdTarget:     0,
  _crowdWager:      0,
  _featuredIncidents: [],
  _incidentsFired:  [],
  _chartPoints:     [],
  _intCountdown:    null,
  _fanFrame:        0,
  _fanLastTs:       0,

  // ── ARENA TYPE ───────────────────────────────────
  _arenaType(ico) {
    const t = {
      race:    ['🐦','🐌','🐾','🦀','🐟'],
      fight:   ['🤖','🏟️'],
      contest: ['👨‍🍳','🍔','♟️','🐝','🦆'],
      spin:    ['🎡'],
      market:  ['🐻'],
      dignity: ['😤'],
    };
    for (const [type, icons] of Object.entries(t)) {
      if (icons.includes(ico)) return type;
    }
    return 'mystery';
  },

  _momColor(mom) {
    if (mom >= 70) return '#00e676';
    if (mom >= 55) return '#b2ff59';
    if (mom >= 45) return '#ffc400';
    if (mom >= 30) return '#ff9100';
    return '#ff1744';
  },

  _momLabel(mom) {
    if (mom >= 72) return '🔥 SURGING';
    if (mom >= 58) return '📈 AHEAD';
    if (mom >= 46) return '⚖️ EVEN';
    if (mom >= 34) return '📉 BEHIND';
    return '💀 IN TROUBLE';
  },

  // ── RENDER INITIAL SCREEN ────────────────────────
  renderScreen(G) {
    const p  = G.p;
    const b  = p.bet;
    const riskColors = { LOW:'#00e676', MED:'#ffc400', HIGH:'#ff9100', EXTREME:'#ff1744', UNKNOWN:'#c044ff', DIGNITY:'#b2ff59', FEATURED:'#00e5ff' };
    const rc = riskColors[b.risk] || 'var(--dim)';

    // Header in centre column
    $('bc-header').innerHTML = `
      <div class="bc-ev-name">${b.ico} ${b.n.toUpperCase()}${b.featured ? ' <span class="bc-feat-badge">★ FEATURED</span>' : ''}</div>
      <div class="bc-meta">
        <span style="color:${rc}">${b.risk}</span>
        <span style="color:var(--dim)"> · </span>
        <span>LVL ${p.lvl} · R${p.ril + 1}/3</span>
      </div>`;

    // Stake row
    $('bc-stake').innerHTML = `
      <div class="bc-stake-row">
        <div class="bc-sitem"><span class="bc-sl">WAGER</span><span class="bc-sv">${fmt(p.wager)}</span></div>
        <div class="bc-sitem"><span class="bc-sl">ODDS</span><span class="bc-sv" style="color:var(--gold)">${b.odds > 0 ? b.odds.toFixed(1) + '×' : '???'}</span></div>
        <div class="bc-sitem"><span class="bc-sl">IF WIN</span><span class="bc-sv" id="bc-ifwin" style="color:var(--green)">${b.odds > 0 ? '+' + fmt(Math.floor(p.wager * b.odds)) : '???'}</span></div>
        <div class="bc-sitem"><span class="bc-sl">IF LOSE</span><span class="bc-sv" style="color:var(--red)">-${fmt(p.wager)}</span></div>
      </div>`;

    // Room live text + bankroll
    const liveTxt = $('bc-room-live-txt');
    if (liveTxt) liveTxt.textContent = b.n.toUpperCase();
    // Show bankroll remaining after wager deduction, with a label
    const brEl    = $('bc-room-br');
    const brLblEl = document.querySelector('.bc-room-br-lbl');
    if (brEl) brEl.textContent = fmt(p.bankroll);
    if (brLblEl) brLblEl.textContent = p.bankroll === 0 ? 'ALL IN' : 'BANKROLL';

    // ── Broadcast room imagery ─────────────────────────────────────────────
    // Event location art → bc-viewer-bg (atmospheric background in main view)
    // Character portrait  → tv-expand-viewer (shown behind TV in fullscreen only)

    // Map bet id → location image path (add more as assets arrive)
    const _eventImages = {
      pigeon: 'img/event_pigeon.png',
      // snail, robot, cook, etc. — add here when ready
    };

    // Back-of-head viewer images — one per archetype
    const _viewerImages = {
      degenerate: 'img/degenerate_viewer.png',
      mathwhiz:   'img/mathwhiz_viewer.png',
      luckyidiot: 'img/luckyidiot_viewer.png',
    };

    const eventImgSrc  = _eventImages[p.bet?.id] || '';
    const viewerImgSrc = _viewerImages[p.arch]   || 'img/broadcast_viewer.png';

    // Background: event location art
    const viewerBgEl = document.getElementById('bc-viewer-bg');
    if (viewerBgEl) {
      if (eventImgSrc) {
        viewerBgEl.src   = eventImgSrc;
        viewerBgEl.alt   = p.bet?.n || '';
        viewerBgEl.style.display = 'block';
      } else {
        viewerBgEl.style.display = 'none';
      }
    }

    // Main room viewer — transparent PNG in front of TV
    const viewerEl = document.getElementById('bc-viewer');
    if (viewerEl) {
      if (viewerImgSrc) {
        viewerEl.src   = viewerImgSrc;
        viewerEl.alt   = p.arch;
        viewerEl.style.display = 'block';
      } else {
        viewerEl.style.display = 'none';
      }
    }

    // Expand overlay: back-of-head viewer image in front of fullscreen TV
    const expandViewer = document.getElementById('tv-expand-viewer');
    if (expandViewer) {
      expandViewer.src = viewerImgSrc;
      expandViewer.alt = p.arch;
    }

    // Crowd pool
    this._crowdWager  = p.wager;
    this._crowdPool   = p.wager * rnd(8, 20);
    this._crowdTarget = this._crowdPool;
    $('bc-crowd-pool').textContent = fmt(this._crowdPool);
    $('bc-crowd-bar-fill').style.width = '50%';

    // Init TV
    const tvCanvas = $('bc-tv-canvas');
    if (tvCanvas) {
      TV.init(tvCanvas);
      TV.setScene(this._arenaType(b.ico), b);
    }
    // Sync big canvas size
    const big = $('tv-big-canvas');
    if (big) { big.width = 320; big.height = 240; }

    // Reset state
    this._displayMom  = 50;
    this._logLines    = [];
    this._logStart    = Date.now();
    this._renderLog();
    this._lastLabelMom = -999;

    const cmtEl = $('bc-comment');
    if (cmtEl) { cmtEl.textContent = '...'; cmtEl.style.color = 'var(--dim)'; }

    this._startTicker(b);
    this._drawFans(50, 0);
  },

  // ── FAN SPRITES ──────────────────────────────────
  // Five little pixel fan canvases below the TV
  _fanColors: ['#ff2d78','#00e5ff','#ffc400','#00e676','#c044ff'],
  _fanBob:    [0, 2, 1, 3, 0], // stagger offsets

  _drawFans(mom, ts) {
    if (ts - this._fanLastTs < 100) return;
    this._fanLastTs = ts;
    this._fanFrame++;
    const f = this._fanFrame;
    const excited = mom > 65;
    const deflated = mom < 35;

    for (let i = 0; i < 5; i++) {
      const el = document.getElementById(`bc-fan-${i}`);
      if (!el) continue;
      const ctx = el.getContext('2d');
      const W = el.width, H = el.height;
      ctx.clearRect(0, 0, W, H);
      const color = this._fanColors[i % this._fanColors.length];

      // Bob animation
      const bobPhase = (f + this._fanBob[i]) % 4;
      const bob = excited ? (bobPhase < 2 ? 3 : 0) : deflated ? 0 : (bobPhase < 2 ? 1 : 0);

      // Body
      ctx.fillStyle = color + 'cc';
      ctx.fillRect(6, H - 14 - bob, 8, 10);
      // Head
      ctx.fillStyle = '#e0d0c0';
      ctx.fillRect(7, H - 20 - bob, 6, 6);
      // Arms raised if excited
      if (excited) {
        ctx.fillStyle = color + 'cc';
        ctx.fillRect(2, H - 22 - bob, 4, 5);
        ctx.fillRect(14, H - 22 - bob, 4, 5);
      } else {
        ctx.fillStyle = color + 'cc';
        ctx.fillRect(2, H - 16 - bob, 4, 4);
        ctx.fillRect(14, H - 16 - bob, 4, 4);
      }
      // Sign (if excited)
      if (excited && i % 2 === 0) {
        ctx.fillStyle = color + '80';
        ctx.fillRect(3, H - 30 - bob, 8, 6);
        ctx.fillStyle = '#ffffff40';
        ctx.fillRect(4, H - 29 - bob, 6, 1);
      }
    }
  },

  // ── EVENT LOG ────────────────────────────────────
  _addLog(text, color) {
    const ts = this._logLines.length > 0
      ? ((Date.now() - this._logStart) / 1000).toFixed(1) + 's'
      : '0.0s';
    this._logLines.push({ ts, text, color: color || 'var(--dim)', fresh: true });
    if (this._logLines.length > 50) this._logLines.shift();
    this._renderLog();
    // Unfresh after a moment
    setTimeout(() => {
      const line = this._logLines[this._logLines.length - 1];
      if (line) line.fresh = false;
    }, 1500);
  },

  _renderLog() {
    const el = $('bc-log-inner');
    if (!el) return;
    el.innerHTML = this._logLines.slice().reverse().map(l =>
      `<div class="bc-log-line${l.fresh ? ' fresh' : ''}">
        <span class="bc-log-ts">${l.ts}</span>
        <span class="bc-log-txt" style="color:${l.color}">${l.text}</span>
      </div>`
    ).join('');
  },

  // ── CROWD POOL ───────────────────────────────────
  _updateCrowd(mom) {
    const tickGrowth  = Math.round(this._crowdWager * rndF(0.3, 1.2));
    this._crowdTarget += tickGrowth;
    this._crowdPool   += Math.round((this._crowdTarget - this._crowdPool) * 0.06);

    const yourPct = Math.round(40 + mom * 0.2);
    const yourAmt = Math.round(this._crowdPool * yourPct / 100);

    const el  = $('bc-crowd-pool');
    const bar = $('bc-crowd-bar-fill');
    if (el)  el.textContent = fmt(this._crowdPool);
    if (bar) { bar.style.width = yourPct + '%'; bar.style.background = this._momColor(mom); }
    const lbl = $('bc-crowd-you-pct');
    if (lbl) lbl.textContent = `${yourPct}% on you (${fmt(yourAmt)})`;
  },

  // ── MOMENTUM ─────────────────────────────────────
  _updateMomentum(mom) {
    this._displayMom += (mom - this._displayMom) * 0.12;
    const d = this._displayMom;

    const marker = $('bc-mom-marker');
    if (!marker) return;
    const color = this._momColor(d);
    marker.style.left       = d.toFixed(1) + '%';
    marker.style.background = color;
    marker.style.boxShadow  = `0 0 8px ${color}`;

    const rounded = Math.round(d / 3) * 3;
    if (Math.abs(rounded - this._lastLabelMom) >= 3) {
      this._lastLabelMom = rounded;
      const label = $('bc-mom-label');
      const pct   = $('bc-mom-pct');
      if (label) { label.textContent = this._momLabel(d); label.style.color = color; }
      if (pct)   { pct.textContent = Math.round(d) + '% YOUR FAVOR'; pct.style.color = color; }
    }
  },

  // ── PATH B INTERRUPT ─────────────────────────────
  _showInterrupt(G, won, momentum) {
    if (this._interruptShown) return;
    this._interruptShown = true;

    // If player has TV expanded, collapse it so they can see the decision buttons
    const overlay = $('tv-expand-overlay');
    if (overlay && overlay.classList.contains('open')) {
      TV.collapse();
      showToast('⚡ LIVE DECISION — check broadcast screen!', 'ti');
    }

    const p      = G.p;
    const canDD  = p.bankroll >= p.wager;
    const winAmt = Math.floor(p.wager * p.bet.odds);

    const el = $('bc-interrupt');
    if (!el) return;

    el.innerHTML = `
      <div class="bc-int-title">⚡ LIVE DECISION</div>
      <div class="bc-int-desc">${momentum >= 50 ? "You're ahead. Press the advantage?" : "Momentum shifted. Cut losses?"}</div>
      <div class="bc-int-btns">
        ${canDD ? `<button class="bc-int-btn bc-int-dd" onclick="Broadcast._chooseInterrupt('double',this)">
          <span class="bc-int-btn-lbl">DOUBLE DOWN</span>
          <span class="bc-int-btn-sub">+${fmt(p.wager)} → win +${fmt(winAmt*2)}</span>
        </button>` : ''}
        <button class="bc-int-btn bc-int-co" onclick="Broadcast._chooseInterrupt('cashout',this)">
          <span class="bc-int-btn-lbl">CASH OUT 40%</span>
          <span class="bc-int-btn-sub">Take ${fmt(Math.floor(winAmt*.4))} now</span>
        </button>
        <button class="bc-int-btn bc-int-ig" onclick="Broadcast._chooseInterrupt(null,this)">
          <span class="bc-int-btn-lbl">HOLD POSITION</span>
          <span class="bc-int-btn-sub">Ride out the original bet</span>
        </button>
      </div>`;

    el.classList.add('open');
    this._paused = true;
    this._addLog('⚡ LIVE DECISION — broadcast paused', 'var(--gold)');
  },

  _chooseInterrupt(choice, btn) {
    this._interruptChoice = choice;
    if (btn) { btn.style.borderColor = 'var(--cyan)'; btn.style.color = 'var(--cyan)'; }
    const msg = choice === 'double'  ? '⚡ DOUBLED DOWN'
              : choice === 'cashout' ? '⚡ CASHING OUT 40%'
              : '⚡ HOLDING POSITION';
    this._addLog(msg, 'var(--gold)');
    setTimeout(() => this._dismissInterrupt(), 350);
  },

  _dismissInterrupt() {
    const el = $('bc-interrupt');
    if (el) el.classList.remove('open');
    this._paused = false;
  },

  // ── PATH D INCIDENT ──────────────────────────────
  _triggerIncident(G, idx, momentum) {
    const incidents = [
      { label: 'MOMENTUM SHIFT',  text: 'Unexpected development! Odds recalculate.', momShift: -20, color: 'var(--red)'   },
      { label: 'SURGE DETECTED',  text: 'Your pick finds a second wind!',            momShift: +18, color: 'var(--green)' },
    ];
    const inc = incidents[idx % incidents.length];
    this._addLog(`⚠ ${inc.label}: ${inc.text}`, inc.color);
    const hdr = $('bc-header');
    if (hdr) {
      hdr.style.background = `linear-gradient(90deg,${inc.color}22,transparent)`;
      setTimeout(() => { if(hdr) hdr.style.background = ''; }, 1200);
    }
    return inc.momShift;
  },

  // ── TICKER ───────────────────────────────────────
  _tickerLines: [
    "UNDERGROUND MARKETS: ALL BETS FINAL ONCE CONFIRMED",
    "HEAT ABOVE 70: GOON RISK ACTIVE — WIN TO COOL DOWN",
    "INTEREST PAID EACH ROUND — HOLD CASH TO COMPOUND",
    "THE BOOKIE KNOWS YOU'RE HERE",
    "ODDS ARE LIVE — MOMENTUM IS REAL — BREATHE",
    "NO REFUNDS. NO APPEALS. NO LAWYERS.",
    "SPREAD & SHRED SPORTSBOOK: PROBABLY LEGIT",
    "SNAIL RACE OFFICIALS STILL WAITING FOR LAST YEAR'S RESULTS",
  ],

  _startTicker(b) {
    const el = $('bc-ticker-inner');
    if (!el) return;
    const lines = [
      `LIVE: ${b.n.toUpperCase()} — ODDS ${b.odds > 0 ? b.odds.toFixed(1)+'×' : '???'}`,
      ...this._tickerLines.sort(() => Math.random() - 0.5).slice(0, 5),
    ];
    el.textContent = lines.join('   ◆   ') + '   ◆   ';
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'tickerScroll 22s linear infinite';
  },

  // ── MAIN RUN ─────────────────────────────────────
  run(G, precomputedResult, precomputedCh) {
    const p   = G.p;
    const b   = p.bet;
    const ph  = PHASES[b.ico];
    const won = precomputedResult === 'WIN';

    const targetMom    = won ? 62 + rnd(0, 25) : 38 - rnd(0, 25);
    const isFeatured   = !!b.featured;
    const dur = isFeatured      ? 22000
              : b.risk==='HIGH' ? 12000
              : b.risk==='MED'  ? 9000
              : 6500;

    // Reset
    this._skipRequested    = false;
    this._paused           = false;
    this._interruptShown   = false;
    this._interruptChoice  = null;
    this._logStart         = Date.now();
    this._featuredIncidents = isFeatured ? [0.35, 0.65] : [];
    this._incidentsFired   = [];
    this._chartPoints      = [];
    this._displayMom       = 50;
    this._lastLabelMom     = -999;

    const skipBtn = $('bc-skip');
    if (skipBtn) { skipBtn.style.display = 'block'; skipBtn.onclick = () => this.skip(); }

    let momentum = 50;
    let elapsed  = 0;
    let phaseIdx = -1;
    let lastTs   = null;

    if (ph) this._addLog(pick(ph.open), 'var(--cyan)');

    const tick = (ts) => {
      if (!this._iv) return;

      if (lastTs === null) lastTs = ts;
      const delta = Math.min(ts - lastTs, 100);
      lastTs = ts;

      if (this._paused) { lastTs = ts; return; }

      if (this._skipRequested) {
        this._skipRequested = false;
        elapsed = dur * 0.92;
      }
      elapsed += delta;
      const progress = Math.min(elapsed / dur, 1);

      // Momentum physics
      let bias = 0, noiseMag = 18;
      if (progress >= 0.90)      { momentum = momentum * 0.6 + targetMom * 0.4; noiseMag = 2; }
      else if (progress >= 0.70) { bias = (targetMom-50)*((progress-0.70)/0.20)*1.4; noiseMag = 10; }
      else if (progress >= 0.35) { bias = (targetMom-50)*((progress-0.35)/0.35)*0.6; noiseMag = 20; }
      const noise = (Math.random()-0.5)*noiseMag*2;
      momentum = progress < 0.90
        ? Math.max(5, Math.min(95, 50 + bias + noise))
        : Math.max(5, Math.min(95, momentum));

      // Featured incidents
      for (const incProg of this._featuredIncidents) {
        if (!this._incidentsFired.includes(incProg) && progress >= incProg) {
          this._incidentsFired.push(incProg);
          const shift = this._triggerIncident(G, this._featuredIncidents.indexOf(incProg), momentum);
          momentum = Math.max(5, Math.min(95, momentum + shift));
        }
      }

      // Path B interrupt at ~40%
      if (!this._interruptShown && progress >= 0.40 && progress < 0.50) {
        this._showInterrupt(G, won, momentum);
      }

      // Commentary phases
      const newPhaseIdx = progress < 0.25 ? 0 : progress < 0.60 ? 1 : progress < 0.85 ? 2 : 3;
      if (ph && newPhaseIdx !== phaseIdx) {
        phaseIdx = newPhaseIdx;
        let line = newPhaseIdx === 0 ? pick(ph.open)
                 : newPhaseIdx <= 2  ? pick(momentum >= 50 ? ph.mid_w : ph.mid_l)
                 : pick(won ? ph.close_w : ph.close_l);
        const cmtEl = $('bc-comment');
        if (cmtEl) {
          cmtEl.style.opacity = '0';
          setTimeout(() => { if (cmtEl) { cmtEl.textContent = line; cmtEl.style.opacity = '1'; }}, 180);
        }
        this._addLog(line, newPhaseIdx === 3 ? (won ? 'var(--green)' : 'var(--red)') : 'var(--dim)');
      }

      // Update visuals
      this._updateMomentum(momentum);
      this._updateCrowd(momentum);
      this._drawFans(this._displayMom, ts);

      // Tick TV canvas
      TV.tick(this._displayMom, progress, ts);
      // Mirror to big canvas if overlay open
      const overlay = $('tv-expand-overlay');
      if (overlay && overlay.classList.contains('open')) {
        const big   = $('tv-big-canvas');
        const small = $('bc-tv-canvas');
        if (big && small) {
          const bctx = big.getContext('2d');
          bctx.imageSmoothingEnabled = false;
          bctx.clearRect(0, 0, big.width, big.height);
          bctx.drawImage(small, 0, 0, big.width, big.height);
        }
      }

      // Progress bar
      const pb = $('bc-progress-fill');
      if (pb) pb.style.width = (progress * 100).toFixed(1) + '%';

      // Bankroll live update
      const brEl = $('bc-room-br');
      if (brEl) brEl.textContent = fmt(G.p.bankroll);

      if (progress >= 1) {
        cancelAnimationFrame(this._iv);
        this._iv = null;
        if (skipBtn) { skipBtn.style.display = 'none'; skipBtn.style.opacity = '1'; }
        this._dismissInterrupt();

        // Result panel will appear in expand overlay (if open) or in bc-room
        // No forced collapse — let the player click VIEW PAYOUT to proceed

        const cmtEl = $('bc-comment');
        if (cmtEl) cmtEl.style.color = won ? 'var(--green)' : 'var(--red)';
        this._addLog(won ? '🏆 RESULT: WIN' : '💀 RESULT: LOSS', won ? 'var(--green)' : 'var(--red)');

        // Show result on TV — holds until player clicks
        TV.showResult(won);
        // Mirror final frame immediately
        const big   = $('tv-big-canvas');
        const small = $('bc-tv-canvas');
        if (big && small) {
          const bctx = big.getContext('2d');
          bctx.imageSmoothingEnabled = false;
          bctx.drawImage(small, 0, 0, big.width, big.height);
        }

        // Resolve after short delay (let result screen render one frame)
        setTimeout(() => Sim.resolve(G, precomputedResult, precomputedCh, this._interruptChoice), 600);
        return;
      }
    };

    const rafLoop = (ts) => { tick(ts); if (this._iv) this._iv = requestAnimationFrame(rafLoop); };
    this._iv = requestAnimationFrame(rafLoop);
  },

  skip() {
    this._skipRequested = true;
    const skipBtn = $('bc-skip');
    if (skipBtn) skipBtn.style.opacity = '0.3';
  },

  stop() {
    if (this._iv)          { cancelAnimationFrame(this._iv); this._iv = null; }
    if (this._tickIv)      { clearInterval(this._tickIv);    this._tickIv = null; }
    if (this._intCountdown){ clearInterval(this._intCountdown); this._intCountdown = null; }
    this._chartPoints     = [];
    this._skipRequested   = false;
    this._paused          = false;
    this._interruptShown  = false;
    this._interruptChoice = null;
    this._logLines        = [];
    this._displayMom      = 50;
    this._lastLabelMom    = -999;
    const skipBtn = $('bc-skip');
    if (skipBtn) { skipBtn.style.display = 'none'; skipBtn.style.opacity = '1'; }
    this._dismissInterrupt();
  },
};
