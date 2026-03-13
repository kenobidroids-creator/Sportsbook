// ══════════════════════════════════════════════════
//  TUTORIAL.JS — Scripted 12-step tutorial system
// ══════════════════════════════════════════════════

const Tutorial = {

  active:          false,
  step:            0,
  _origMethods:    {},
  _origCalcChance: null,
  _overrideTarget: null,
  _guaranteeWin:   false,

  // ── STEPS ────────────────────────────────────────
  // spotlight: element ID to highlight (null = dark overlay, centred tooltip)
  // unlock:    CSS selector(s) the player is ALLOWED to interact with this step
  //            (null = action-only, tooltip Next/Skip always work regardless)
  STEPS: [
    {
      title:   '🎲 WELCOME TO THE SPREAD & THE SHRED',
      body:    'A betting roguelike where you wager on absurd events, manage your Heat, and try not to get shaken down by goons.\n\nThis tutorial walks you through your first run.',
      advance: 'button',
      spotlight: null,
      unlock:    null,
    },
    {
      title:   '▶ PLACE YOUR BETS',
      body:    'This button starts a run. Each run: pick an archetype, survive 10 levels of bets, beat the Final Bookie.\n\nTap PLACE YOUR BETS to continue.',
      advance: 'action',
      spotlight: null,
      unlock:    '#s-title .btn-cyan',
      setup(T) { T._overrideTarget = document.querySelector('#s-title .btn-cyan'); },
    },
    {
      title:   '🧮 PICK YOUR ARCHETYPE',
      body:    'Each archetype has different bankroll, luck, and starting cards.\n\nMATH WHIZ: $300 start, Inside Info + Sure Thing in hand, the Tipster joker. Best for learning.',
      advance: 'button',
      spotlight: null,
      unlock:    null,
      setup(T) {
        Render.charSelect(G);
        screen('charselect');
        setTimeout(() => {
          document.querySelectorAll('.char-card').forEach(c => {
            if (c.dataset.k === 'mathwhiz') T._overrideTarget = c;
          });
          T._refreshSpotlight();
        }, 80);
      },
    },
    {
      title:   '🐦 SELECT A BET',
      body:    'Six events are offered each round. Each shows payout odds, a win chance, and a risk tier.\n\nPigeon Race is LOW risk — highest base win chance. Tap it.',
      advance: 'action',
      spotlight: null,
      unlock:    '.bet-card',
      setup(T) { T._setupBettingStep(); },
    },
    {
      title:   '💰 SET YOUR WAGER',
      body:    'Use ±5 / ±10 to size your bet. ½ bets half your bankroll. MAX goes all-in.\n\nThe CHANCE % is your real probability of winning right now.',
      advance: 'button',
      spotlight: 'wager-panel',
      unlock:    '#wager-panel button',
    },
    {
      title:   '🃏 YOUR HAND',
      body:    'Cards are one-time boosts played before each bet.\n\nWe\'ve given you BLUFF (+25% win) and POCKET SAND (turns a loss into a push).\n\nTap BLUFF to stage it.',
      advance: 'action',
      spotlight: 'hand-bar',
      unlock:    '.hcard',
      setup(T) {
        G.p.hand = ['bluff', 'pocket_sand'];
        G.p.playedCard = null;
        Render.hand(G, 'hand-scroll');
        Render.updateWager(G);
      },
    },
    {
      title:   '📊 WATCH THE ODDS SHIFT',
      body:    'See that? Bluff pushed your win chance up by 25 points.\n\nCards are the difference between a coin-flip and a sure thing. One per round — use them wisely.',
      advance: 'button',
      spotlight: 'pv-ch',
      unlock:    null,
    },
    {
      title:   '🔒 LOCK IT IN',
      body:    'Happy with your wager and staged card? Place the bet. The wager is deducted immediately.',
      advance: 'action',
      spotlight: 'place-btn',
      unlock:    '#place-btn',
      setup(T) {
        // The game sets pointer-events:none + opacity inline — must override directly
        // Also remove it from the CSS lock list by setting inline to beat specificity
        const btn = document.getElementById('place-btn');
        if (btn) {
          btn.style.setProperty('pointer-events', 'auto', 'important');
          btn.style.setProperty('opacity', '1', 'important');
          btn.style.setProperty('filter', 'none', 'important');
          btn.classList.add('tut-unlocked');
        }
      },
    },
    {
      title:   '🏁 THE SIMULATION',
      body:    'The event plays out in real time. EXTREME events are slow. LOW risk resolves fast.\n\nNothing to do here — just watch.',
      advance: 'action',
      spotlight: null,
      unlock:    null,
    },
    {
      title:   '🏆 THE PAYOUT BREAKDOWN',
      body:    'Win or lose, this shows exactly what happened: wager, odds, card multiplier, final bankroll.\n\nThe WIN CHANCE was your real probability when you placed.',
      advance: 'button',
      spotlight: 'pay-bd',
      unlock:    '#s-payout button',
    },
    {
      title:   '💰 INTEREST',
      body:    'Every round you earn passive interest on your bankroll. The richer you are, the more you earn.\n\nThe LOAN SHARK joker doubles this. Holding cash is a strategy.',
      advance: 'button',
      spotlight: 'int-note',
      unlock:    null,
      setup(T) { T._setupInterestStep(); },
    },
    {
      title:   '🏪 THE UNDERGROUND SHOP',
      body:    'Between levels: buy Cards (one-use, go into your hand) or Jokers (passive, up to 3).\n\nJokers fire every round and compound fast. The TIPSTER reveals true win % on every bet.',
      advance: 'button',
      spotlight: 'shop-jokers',
      unlock:    null,
      setup(T) { T._setupShopStep(); },
    },
    {
      title:   '✅ TUTORIAL COMPLETE',
      body:    'You know the loop:\n\n① Pick a bet  ② Size the wager  ③ Play a card  ④ Survive the sim  ⑤ Shop between levels\n\nBeat all 10 levels to clear your debt. Hit 100 Heat and the Goons visit.\n\nGood luck.',
      advance: 'finish',
      spotlight: null,
      unlock:    null,
    },
  ],

  // ── STYLES ───────────────────────────────────────
  _injectStyles() {
    if (document.getElementById('tut-style')) return;
    const s = document.createElement('style');
    s.id = 'tut-style';
    s.textContent = `
      /* ── First-run prompt ── */
      #tut-prompt {
        position:fixed; inset:0; z-index:10010;
        display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,.8); padding:16px; pointer-events:auto;
      }
      .tp-box {
        background:var(--bg2); border:2px solid var(--cyan);
        padding:28px 22px; max-width:340px; width:100%; text-align:center;
        clip-path:polygon(10px 0%,calc(100% - 10px) 0%,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0% calc(100% - 10px),0% 10px);
        box-shadow:0 0 50px rgba(0,229,255,.3);
        animation:tpIn .25s ease forwards;
      }
      @keyframes tpIn { from{opacity:0;transform:scale(.95) translateY(8px)} to{opacity:1;transform:none} }
      .tp-title { font-size:clamp(12px,3vw,14px); color:var(--cyan); letter-spacing:3px; margin-bottom:14px; }
      .tp-sub   { font-size:clamp(9px,2vw,10px); color:var(--text); line-height:2; margin-bottom:22px; }
      .tp-btns  { display:flex; flex-direction:column; gap:10px; align-items:center; }
      .tp-btns .btn { width:100%; max-width:220px; }

      /* ── Interaction lock ── */
      /* All tappable game elements become inert during the tutorial… */
      body.tut-active .bet-card,
      body.tut-active .hcard,
      body.tut-active .char-card,
      body.tut-active #confirm-btn,
      body.tut-active .wager-btns .btn,
      body.tut-active .shop-actions .btn,
      body.tut-active .sitem,
      body.tut-active .htab,
      body.tut-active .help-btn,
      body.tut-active #s-payout .btn {
        pointer-events:none !important;
        opacity:0.35 !important;
        filter:grayscale(0.6) !important;
        transition:opacity .2s, filter .2s !important;
      }
      /* …except elements explicitly unlocked for this step */
      body.tut-active .tut-unlocked,
      body.tut-active .tut-unlocked * {
        pointer-events:auto !important;
        opacity:1 !important;
        filter:none !important;
      }

      /* ── Overlay (very soft - ring does the highlighting work) ── */
      #tut-overlay {
        position:fixed; inset:0; z-index:9994; pointer-events:none;
      }

      /* ── Scroll lock: disable user scroll on all scroll containers ── */
      body.tut-active .scroll-body {
        overflow:hidden !important;
        overscroll-behavior:none !important;
      }

      /* ── Spotlight ring ── */
      #tut-ring {
        position:fixed; z-index:9996; display:none; pointer-events:none;
        border:2px solid var(--cyan);
        box-shadow:0 0 16px rgba(0,229,255,.6), inset 0 0 12px rgba(0,229,255,.07);
        animation:tutRing 1.4s ease-in-out infinite;
      }
      @keyframes tutRing {
        0%,100% { box-shadow:0 0 14px rgba(0,229,255,.6); }
        50%      { box-shadow:0 0 32px rgba(0,229,255,1); }
      }

      /* ── Tooltip ── */
      #tut-tooltip {
        position:fixed; z-index:9999;
        width:290px; max-width:calc(100vw - 20px);
        background:var(--bg2); border:2px solid var(--cyan);
        padding:15px 15px 13px;
        box-shadow:0 0 28px rgba(0,229,255,.25), 0 8px 32px rgba(0,0,0,.75);
        clip-path:polygon(8px 0%,calc(100% - 8px) 0%,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0% calc(100% - 8px),0% 8px);
        pointer-events:auto;
        animation:ttIn .2s ease forwards;
        /* Never let it go off-screen */
        max-height:calc(100vh - 24px);
        overflow-y:auto;
        box-sizing:border-box;
      }
      @keyframes ttIn { from{opacity:0;transform:translateY(-6px) scale(.97)} to{opacity:1;transform:none} }
      .tt-step  { font-size:8px; color:var(--dim); letter-spacing:2px; margin-bottom:6px; }
      .tt-title { font-size:clamp(10px,2.2vw,11px); color:var(--cyan); margin-bottom:9px; line-height:1.5; }
      .tt-body  { font-size:clamp(8px,1.8vw,9px); color:var(--text); line-height:1.95; margin-bottom:13px; }
      .tt-btns  { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
      .tt-btns .btn { font-size:clamp(8px,1.5vw,9px) !important; padding:7px 11px !important; flex-shrink:0; }
      .tt-hint {
        font-size:8px; color:var(--gold); letter-spacing:1px; flex:1; min-width:100%;
        animation:ttHint 1.2s ease infinite;
      }
      @keyframes ttHint { 0%,100%{opacity:1} 50%{opacity:.3} }

      /* ── Replay button in Help titlebar ── */
      .tut-replay-help {
        background:transparent; border:1px solid var(--cyan);
        color:var(--cyan); font-family:'Press Start 2P',monospace;
        font-size:9px; padding:6px 10px; cursor:pointer;
        letter-spacing:1px; white-space:nowrap;
        transition:background .15s;
      }
      .tut-replay-help:hover { background:rgba(0,229,255,.1); }
    `;
    document.head.appendChild(s);
  },

  // ── BOOT ──────────────────────────────────────────
  boot() {
    this._injectStyles();
    if (localStorage.getItem('tsats_tutorialDone')) return;
    this._showPrompt();
  },

  // ── REPLAY (called from Help modal) ───────────────
  replay() {
    Help.close();
    localStorage.removeItem('tsats_tutorialDone');
    setTimeout(() => this.start(), 120);
  },

  // ── PROMPT ────────────────────────────────────────
  _showPrompt() {
    const el = document.createElement('div');
    el.id = 'tut-prompt';
    el.innerHTML = `
      <div class="tp-box">
        <div class="tp-title">FIRST TIME?</div>
        <div class="tp-sub">Play the 2-minute tutorial to learn the betting loop, cards &amp; shop before your run.</div>
        <div class="tp-btns">
          <button class="btn btn-cyan" id="tut-yes">▶ PLAY TUTORIAL</button>
          <button class="btn btn-ghost" id="tut-no">SKIP &amp; START</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    document.getElementById('tut-yes').onclick = () => { el.remove(); this.start(); };
    document.getElementById('tut-no').onclick  = () => {
      el.remove();
      localStorage.setItem('tsats_tutorialDone', '1');
    };
  },

  // ── START ──────────────────────────────────────────
  start() {
    this.active          = true;
    this.step            = 0;
    this._overrideTarget = null;
    this._guaranteeWin   = false;
    document.body.classList.add('tut-active');
    this._patchGameMethods();
    this._buildOverlay();
    this._showStep(0);
  },

  // ── NEXT ───────────────────────────────────────────
  next() {
    if (!this.active) return;
    this.step++;
    if (this.step >= this.STEPS.length) { this.finish(); return; }
    this._overrideTarget = null;
    this._showStep(this.step);
  },

  // ── FINISH / SKIP ──────────────────────────────────
  finish() {
    localStorage.setItem('tsats_tutorialDone', '1');
    this._end();
    showToast('🎓 Tutorial done! Pick your archetype and start for real.', 'ti');
  },

  skip() {
    localStorage.setItem('tsats_tutorialDone', '1');
    this._end();
  },

  _end() {
    this.active = false;
    document.body.classList.remove('tut-active');
    this._clearUnlocks();
    this._teardownOverlay();
    this._restoreGameMethods();
    // Hard-reset any inline styles the tutorial may have forced onto game elements
    // so the real game starts with a completely clean slate
    const placBtn = document.getElementById('place-btn');
    if (placBtn) {
      placBtn.style.removeProperty('pointer-events');
      placBtn.style.removeProperty('opacity');
      placBtn.style.removeProperty('filter');
    }
    const confirmBtn = document.getElementById('confirm-btn');
    if (confirmBtn) {
      confirmBtn.style.removeProperty('pointer-events');
      confirmBtn.style.removeProperty('opacity');
      confirmBtn.style.removeProperty('filter');
    }
    // Restore scroll on any locked scroll containers
    clearTimeout(this._scrollLockTimer);
    document.querySelectorAll('.scroll-body').forEach(el => {
      el.style.removeProperty('overflow');
    });
    G.restart();
  },

  // ── SHOW STEP ──────────────────────────────────────
  _showStep(i) {
    const s = this.STEPS[i];
    if (!s) return;
    if (s.setup) s.setup(this);
    this._applyUnlock(s);
    this._updateTooltip(s, i);
    this._updateSpotlight(s);
  },

  // ── INTERACTION LOCK ───────────────────────────────
  _applyUnlock(s) {
    this._clearUnlocks();
    if (s.unlock) {
      document.querySelectorAll(s.unlock).forEach(el => el.classList.add('tut-unlocked'));
    }
  },

  _clearUnlocks() {
    document.querySelectorAll('.tut-unlocked').forEach(el => el.classList.remove('tut-unlocked'));
  },

  // ── TOOLTIP ────────────────────────────────────────
  _updateTooltip(s, i) {
    const box      = document.getElementById('tut-tooltip');
    const total    = this.STEPS.length;
    const bodyHtml = s.body.replace(/\n/g, '<br>');
    const isFinish = s.advance === 'finish';
    const isAction = s.advance === 'action';

    box.innerHTML = `
      <div class="tt-step">${i + 1} / ${total}</div>
      <div class="tt-title">${s.title}</div>
      <div class="tt-body">${bodyHtml}</div>
      <div class="tt-btns">
        ${isFinish
          ? `<button class="btn btn-cyan" id="tt-next">🎰 START MY RUN</button>`
          : isAction
          ? `<div class="tt-hint">↑ Do the action above to continue</div>
             <button class="btn btn-ghost" id="tt-skip-all">SKIP TUTORIAL</button>`
          : `<button class="btn btn-cyan" id="tt-next">NEXT ▶</button>
             <button class="btn btn-ghost" id="tt-skip-all">SKIP</button>`
        }
      </div>`;

    const nb = document.getElementById('tt-next');
    if (nb) nb.onclick = () => this.next();
    const sb = document.getElementById('tt-skip-all');
    if (sb) sb.onclick = () => this.skip();

    // Position AFTER content is set so we can measure real height
    requestAnimationFrame(() => this._positionTooltip(s));
  },

  // ── SMART POSITIONING ─────────────────────────────
  // Tries: below target → above target → best-fit centre
  // Never lets the tooltip clip off any edge.
  _positionTooltip(s) {
    const box = document.getElementById('tut-tooltip');
    if (!box) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const GAP = 12;
    const PAD = 10;

    const bw = Math.min(290, vw - PAD * 2);
    box.style.width = bw + 'px';
    box.style.transform = 'none';

    const bh = box.offsetHeight; // real height now content is rendered

    const targetEl = this._overrideTarget || (s.spotlight ? document.getElementById(s.spotlight) : null);

    if (!targetEl) {
      // Centre of screen
      box.style.left   = Math.round((vw - bw) / 2) + 'px';
      box.style.top    = Math.round((vh - bh) / 2) + 'px';
      box.style.bottom = 'auto';
      return;
    }

    const rect = targetEl.getBoundingClientRect();

    // Horizontal: centre on target, clamped to viewport
    const rawLeft = rect.left + rect.width / 2 - bw / 2;
    const left    = Math.round(clamp(rawLeft, PAD, vw - bw - PAD));
    box.style.left = left + 'px';

    const spaceBelow = vh - rect.bottom - GAP;
    const spaceAbove = rect.top        - GAP;

    if (spaceBelow >= bh + PAD) {
      // Below fits — preferred
      box.style.top    = Math.round(rect.bottom + GAP) + 'px';
      box.style.bottom = 'auto';
    } else if (spaceAbove >= bh + PAD) {
      // Above fits
      box.style.top    = Math.round(rect.top - GAP - bh) + 'px';
      box.style.bottom = 'auto';
    } else {
      // Neither fits cleanly — pin to wherever there's more room, clamped
      if (spaceBelow >= spaceAbove) {
        const top = Math.round(rect.bottom + GAP);
        box.style.top    = clamp(top, PAD, vh - bh - PAD) + 'px';
        box.style.bottom = 'auto';
      } else {
        const top = Math.round(rect.top - GAP - bh);
        box.style.top    = clamp(top, PAD, vh - bh - PAD) + 'px';
        box.style.bottom = 'auto';
      }
    }
  },

  // ── SPOTLIGHT ──────────────────────────────────────
  _updateSpotlight(s) { this._refreshSpotlight(s); },

  _refreshSpotlight(s) {
    const overlay = document.getElementById('tut-overlay');
    const ring    = document.getElementById('tut-ring');
    if (!overlay) return;

    const step     = s || this.STEPS[this.step];
    const targetEl = this._overrideTarget
      || (step && step.spotlight ? document.getElementById(step.spotlight) : null);

    if (!targetEl) {
      overlay.style.background      = 'rgba(0,0,0,0.45)';
      overlay.style.backgroundImage = 'none';
      if (ring) ring.style.display  = 'none';
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const pad  = 10;
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const rx   = rect.width  / 2 + pad + 6;
    const ry   = rect.height / 2 + pad + 6;
    const W    = window.innerWidth;
    const H    = window.innerHeight;

    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'>`
      + `<defs><mask id='m'>`
      + `<rect width='100%' height='100%' fill='white'/>`
      + `<ellipse cx='${cx}' cy='${cy}' rx='${rx}' ry='${ry}' fill='black'/>`
      + `</mask></defs>`
      + `<rect width='100%' height='100%' fill='rgba(0,0,0,0.45)' mask='url(#m)'/>`
      + `</svg>`;

    overlay.style.background      = 'transparent';
    overlay.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    overlay.style.backgroundSize  = '100% 100%';

    // Auto-scroll the target into view (temporarily re-enable scroll)
    try {
      const scrollParent = targetEl.closest('.scroll-body');
      if (scrollParent) {
        scrollParent.style.overflow = 'auto';
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        clearTimeout(this._scrollLockTimer);
        this._scrollLockTimer = setTimeout(() => {
          if (this.active) scrollParent.style.overflow = 'hidden';
        }, 600);
      }
    } catch(e) {}

    if (ring) {
      ring.style.display      = 'block';
      ring.style.left         = (rect.left   - pad) + 'px';
      ring.style.top          = (rect.top    - pad) + 'px';
      ring.style.width        = (rect.width  + pad * 2) + 'px';
      ring.style.height       = (rect.height + pad * 2) + 'px';
      ring.style.borderRadius = '6px';
    }
  },

  // ── BUILD / TEARDOWN ───────────────────────────────
  _buildOverlay() {
    ['tut-overlay', 'tut-ring', 'tut-tooltip'].forEach(id => {
      if (!document.getElementById(id)) {
        const el = document.createElement('div');
        el.id = id;
        document.body.appendChild(el);
      }
    });
  },

  _teardownOverlay() {
    ['tut-overlay', 'tut-ring', 'tut-tooltip'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  },

  // ── GAME METHOD PATCHES ────────────────────────────
  _patchGameMethods() {
    const T = this;

    // G.nav: advance step 1 when player taps PLACE YOUR BETS → charselect
    T._origMethods.nav = G.nav.bind(G);
    G.nav = function(s) {
      T._origMethods.nav(s);
      // Only advance if tutorial is genuinely active at step 1
      if (T.active && T.step === 1 && s === 'charselect') {
        setTimeout(() => { if (T.active) T.next(); }, 100);
      }
    };

    // Step 3: bet selected
    T._origMethods.selBet = G.selBet.bind(G);
    G.selBet = function(i, el) {
      T._origMethods.selBet(i, el);
      if (T.active && T.step === 3) setTimeout(() => T.next(), 400);
    };

    // Step 5: card played
    T._origMethods.playCard = G.playCard.bind(G);
    G.playCard = function(i) {
      T._origMethods.playCard(i);
      if (T.active && T.step === 5) setTimeout(() => T.next(), 400);
    };

    // Step 7: place bet → guarantee win, jump to sim step
    T._origMethods.placeBet = G.placeBet.bind(G);
    G.placeBet = function() {
      if (T.active && T.step === 7) T._guaranteeWin = true;
      T._origMethods.placeBet();
      if (T.active && T.step === 7) {
        T.step = 8;
        T._overrideTarget = null;
        T._showStep(8);
      }
    };

    // Sim resolve: force win + advance to payout
    // Must accept all 4 args and pass them through
    T._origMethods.simResolve = Sim.resolve.bind(Sim);
    Sim.resolve = function(gRef, preRes, preCh, intChoice) {
      if (T.active && T._guaranteeWin) {
        gRef.p._tutForceWin = true;
        T._guaranteeWin = false;
      }
      T._origMethods.simResolve(gRef, preRes, preCh, intChoice);
      if (T.active && T.step === 8) setTimeout(() => T.next(), 300);
    };

    // After payout: tutorial drives this flow
    T._origMethods.afterPayout = G.afterPayout.bind(G);
    G.afterPayout = function() {
      if (T.active) {
        if (T.step === 9) T.next();
        return;
      }
      T._origMethods.afterPayout();
    };

    // calcChance: return 99 when forced win is flagged
    T._origCalcChance = window.calcChance;
    window.calcChance = function(gRef) {
      if (T.active && gRef.p && gRef.p._tutForceWin) {
        gRef.p._tutForceWin = false;
        return 99;
      }
      return T._origCalcChance(gRef);
    };
  },

  _restoreGameMethods() {
    if (this._origMethods.nav)         G.nav            = this._origMethods.nav;
    if (this._origMethods.selBet)      G.selBet         = this._origMethods.selBet;
    if (this._origMethods.playCard)    G.playCard        = this._origMethods.playCard;
    if (this._origMethods.placeBet)    G.placeBet        = this._origMethods.placeBet;
    if (this._origMethods.simResolve)  Sim.resolve       = this._origMethods.simResolve;
    if (this._origMethods.afterPayout) G.afterPayout     = this._origMethods.afterPayout;
    if (this._origCalcChance)          window.calcChance = this._origCalcChance;
    this._origMethods    = {};
    this._origCalcChance = null;
  },

  // ── STEP SETUP HELPERS ─────────────────────────────
  _setupBettingStep() {
    if (!G.p) {
      const a = ARCHETYPES['mathwhiz'];
      G._arch = 'mathwhiz';
      G.p = {
        arch: 'mathwhiz', bankroll: a.bankroll, luck: a.luck, cred: a.cred,
        heat: 0, hand: ['bluff', 'pocket_sand'], jokers: [...a.jokers],
        wins: 0, bet: null, betIdx: null, wager: 25, playedCard: null,
        wcb: 0, pm: 1, psa: false, coa: false, iia: false, hedge: false,
        debuff: 0, lvl: 1, ril: 0, tw: 0, tl: 0, bw: 0, bl: 0, rce: 0,
        lastRes: null,
      };
      G.p.jokers.forEach(j => { const jd = JOKERS[j]; if (jd?.onEquip) jd.onEquip(G); });
      G._rrcount   = 0;
      G._fixerUsed = false;
    }
    const pigeon = { ...BETS.find(b => b.id === 'pigeon') };
    const others = BETS.filter(b => b.id !== 'pigeon').sort(() => Math.random() - 0.5).slice(0, 5);
    G.p.currentBets = [pigeon, ...others].map(b => ({ ...b }));
    G.p.bet = null; G.p.betIdx = null;
    G.p.wager = 25; G.p.playedCard = null; G.p.wcb = 0;
    Render.bettingBoard(G);
    screen('betting');
    setTimeout(() => {
      const cards = document.querySelectorAll('.bet-card');
      if (cards[0]) {
        this._overrideTarget = cards[0];
        // Also unlock all bet cards for this step
        cards.forEach(c => c.classList.add('tut-unlocked'));
      }
      this._refreshSpotlight();
    }, 80);
  },

  _setupInterestStep() {
    G.p.ril = 0; G.p.bet = null; G.p.betIdx = null;
    G.p.playedCard = null; G.p.wcb = 0;
    G.p.bankroll = Math.max(G.p.bankroll, 300);
    const interest = G.calcInterest(G.p.bankroll, G.p.jokers.includes('loan_shark'));
    G.p.bankroll += interest;
    G.p.currentBets = [...BETS].sort(() => Math.random() - 0.5).slice(0, 6).map(b => ({ ...b }));
    Render.bettingBoard(G);
    screen('betting');
    setTimeout(() => {
      const note = document.getElementById('int-note');
      if (note) {
        note.style.display = 'block';
        note.textContent   = `💰 INTEREST EARNED: +$${interest}  (BANKROLL: $${Math.round(G.p.bankroll)})`;
        this._overrideTarget = note;
      }
      this._refreshSpotlight();
    }, 100);
  },

  _setupShopStep() {
    Shop.generate(G);
    Render.shop(G);
    screen('shop');
    setTimeout(() => {
      this._overrideTarget = document.getElementById('shop-jokers');
      this._refreshSpotlight();
    }, 80);
  },
};

// ── BOOT ─────────────────────────────────────────────
// Shows first-run prompt if 'tsats_tutorialDone' is not in localStorage.
// To re-trigger during testing: localStorage.removeItem('tsats_tutorialDone')
// Or call: Tutorial.replay()
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => Tutorial.boot(), 200);
});
