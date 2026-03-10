// ══════════════════════════════════════════════════
//  GAME.JS — Main game controller & state machine
// ══════════════════════════════════════════════════

const G = {
  p:          null,
  _arch:      null,
  _boss:      null,
  _shop:      { cards: [], jokers: [], sold: new Set(), rc: 10 },
  _rrcount:   0,
  _fixerUsed: false,

  // ─────────────────────────────────────────────
  //  NAVIGATION
  // ─────────────────────────────────────────────
  nav(s) {
    SFX.click();
    if (s === 'charselect') Render.charSelect(this);
    screen(s);
  },

  // ─────────────────────────────────────────────
  //  CHARACTER SELECT
  // ─────────────────────────────────────────────
  selChar(k, el) {
    SFX.select();
    $$('.char-card').forEach(c => c.classList.remove('sel'));
    el.classList.add('sel');
    this._arch = k;
    $('confirm-btn').style.opacity = '1';
    $('confirm-btn').style.pointerEvents = 'auto';
  },

  confirmChar() {
    if (!this._arch) return;
    SFX.click();
    const a = ARCHETYPES[this._arch];

    this.p = {
      arch: this._arch,
      bankroll: a.bankroll,
      luck:     a.luck,
      cred:     a.cred,
      heat:     0,
      hand:     [...a.cards],
      jokers:   [...a.jokers],
      wins:     0,

      // Round-scope (reset each round)
      bet:        null,
      betIdx:     null,
      wager:      25,
      playedCard: null,
      wcb:        0,
      pm:         1,
      psa:        false,
      coa:        false,
      iia:        false,
      hedge:      false,
      debuff:     0,

      // Run stats
      lvl: 1,
      ril: 0,
      tw:  0,
      tl:  0,
      bw:  0,
      bl:  0,
      rce: 0,

      lastRes: null,
    };

    // Fire onEquip for starting jokers
    this.p.jokers.forEach(j => {
      const jd = JOKERS[j];
      if (jd?.onEquip) jd.onEquip(this);
    });

    this._rrcount   = 0;
    this._fixerUsed = false;
    this.startLevel();
  },

  // ─────────────────────────────────────────────
  //  LEVEL / ROUND FLOW
  // ─────────────────────────────────────────────
  startLevel() {
    const p = this.p;

    // Boss levels
    const boss = BOSSES.find(b => b.lvl === p.lvl);
    if (boss) {
      this._boss = { ...boss };
      Boss.show(this);
      return;
    }

    p.ril        = 0;
    this._fixerUsed = false;
    this.startRound();
  },

  startRound() {
    const p = this.p;

    // Joker passive ticks (reset per-round bonuses first)
    p.wcb   = 0;
    p.pm    = 1;
    p.hedge = false;
    p.psa   = false;
    p.coa   = false;
    p.iia   = false;
    p._ukwRoll = null;

    p.jokers.forEach(j => {
      const jd = JOKERS[j];
      if (jd?.tick) jd.tick(this);
    });

    // Degenerate perk: free parlay at start of each level
    if (p.arch === 'degenerate' && p.ril === 0 && !p.hand.includes('free_parlay')) {
      p.hand.push('free_parlay');
      showToast('🎫 Free Parlay added to hand!', 'ti');
    }

    // Interest
    p.bankroll += this.calcInterest(p.bankroll, p.jokers.includes('loan_shark'));

    // Generate fresh bets
    p.bet     = null;
    p.betIdx  = null;
    p.wager   = clamp(Math.min(25, p.bankroll), 1, p.bankroll);
    p.currentBets = this.genBets(6);

    Render.bettingBoard(this);
    screen('betting');
  },

  calcInterest(br, loanShark) {
    let base = 0;
    if (br >= 50)   base = 3;
    if (br >= 150)  base = 6;
    if (br >= 300)  base = 12;
    if (br >= 600)  base = 22;
    if (br >= 1000) base = 35;
    return loanShark && br >= 200 ? base * 2 : base;
  },

  genBets(n) {
    const p = this.p;
    let pool = shuffle(BETS);
    return pool.slice(0, n).map(t => {
      const b = { ...t };

      // Resolve UNKNOWN odds
      if (b.risk === 'UNKNOWN') {
        b.odds = +rndF(1.5, 9).toFixed(1);
        b.win  = rnd(8, 55);
      }

      // Loaded Dice joker: all odds +0.3
      if (p.jokers.includes('loaded_dice')) b.odds = +(b.odds + 0.3).toFixed(1);

      // Level difficulty scaling
      b.win = Math.max(8, b.win - (p.lvl - 1) * 1.5);

      // Math Whiz perk bonus flag
      if (p.arch === 'mathwhiz' && (b.risk === 'LOW' || b.risk === 'MED')) {
        b._mwBonus = 5;
      }

      return b;
    });
  },

  // ─────────────────────────────────────────────
  //  BETTING INTERACTIONS
  // ─────────────────────────────────────────────
  selBet(i, el) {
    SFX.select();
    $$('.bet-card').forEach(c => c.classList.remove('sel'));
    el.classList.add('sel');

    const p = this.p;
    p.betIdx = i;
    p.bet    = { ...p.currentBets[i] };
    p.wager  = clamp(p.wager, 1, p.bankroll);

    $('wager-panel').style.display  = 'block';
    $('hand-bar').style.display     = 'block';
    $('place-btn').style.opacity    = '1';
    $('place-btn').style.pointerEvents = 'auto';

    Render.updateWager(this);
    Render.hand(this, 'hand-scroll');

    // Scroll the wager panel into view so the user sees it immediately
    setTimeout(() => {
      $('wager-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);

    // Inside Man joker: auto-reveal on first bet
    if (p.jokers.includes('inside_man') && p.ril === 0 && !p._insideManUsed) {
      p._insideManUsed = true;
      const ch = calcChance(this);
      showToast(`🤝 Inside Man: True odds ${ch}%`, 'ti');
    }
  },

  aw(d) {
    const p = this.p;
    if (d === 'max')  p.wager = p.bankroll;
    else if (d === 'half') p.wager = Math.max(1, Math.floor(p.bankroll / 2));
    else p.wager = clamp(p.wager + d, 1, p.bankroll);
    SFX.click();
    Render.updateWager(this);
  },

  playCard(i) {
    const p = this.p;

    // Deselect if same card tapped again — no effect has fired yet, safe to cancel
    if (p.playedCard === i) {
      p.playedCard = null;
      Render.hand(this, 'hand-scroll');
      Render.updateWager(this);
      showToast('Card deselected.', 'ti');
      return;
    }
    if (p.playedCard !== null) {
      showToast("Only 1 card per round!", 'tl');
      return;
    }

    SFX.click();
    p.playedCard = i;
    const card = CARDS[p.hand[i]];

    // inside_info is the one card that's useful to preview immediately
    // (it just sets a flag + shows odds — no stacking side-effect)
    if (p.hand[i] === 'inside_info') {
      p.iia = true;
      const ch = calcChance(this);
      showToast(`${card.ico} Intel: true odds are ${ch}%`, 'ti');
    } else {
      // All other cards: just show what WILL happen — apply() fires at placeBet
      showToast(`${card.ico} ${card.n} staged — fires when you place bet`, 'ti');
    }

    Render.hand(this, 'hand-scroll');
    Render.updateWager(this);
  },

  placeBet() {
    const p = this.p;
    if (!p.bet || p.wager <= 0 || p.wager > p.bankroll) {
      showToast("Invalid wager!", 'tl');
      return;
    }
    SFX.click();

    // Apply the staged card effect NOW (exactly once, right before the bet locks in)
    if (p.playedCard !== null) {
      const card = CARDS[p.hand[p.playedCard]];
      if (card && p.hand[p.playedCard] !== 'inside_info') {
        // inside_info already applied its flag above; skip re-applying
        const msg = card.apply(this);
        showToast(`${card.ico} ${msg}`, 'ti');
      }
      p.hand.splice(p.playedCard, 1);
      p.playedCard = null;
    }

    // Deduct wager (returned on push/win)
    p.bankroll -= p.wager;
    Sim.run(this);
  },

  // ─────────────────────────────────────────────
  //  POST-PAYOUT FLOW
  // ─────────────────────────────────────────────
  afterPayout() {
    SFX.click();
    const p = this.p;

    // Dead?
    if (p.bankroll <= 0) {
      this.gameOver("You ran out of money. The goons got everything else.");
      return;
    }

    // Heat check — goon visit?
    if (p.heat >= 70 && rnd(1, 100) <= 55) {
      this.goonVisit();
      return;
    }

    // Round progression
    p.ril++;
    const ante = ANTES[p.lvl] || 0;

    if (p.ril >= 3) {
      // Level complete — did player meet ante?
      if (ante > 0 && p.bankroll < ante) {
        this.goonVisit(); // Goon for missing ante
        return;
      }
      // Shop between levels
      p.lvl++;
      p.ril = 0;
      p._insideManUsed = false;
      this._fixerUsed  = false;

      if (p.lvl > 10) {
        this.winGame();
        return;
      }

      Shop.generate(this);
      Render.shop(this);
      screen('shop');
    } else {
      this.startRound();
    }
  },

  // ─────────────────────────────────────────────
  //  SHOP
  // ─────────────────────────────────────────────
  buyItem(type, id, idx) {
    Shop.buy(type, id, idx, this);
  },

  reroll() {
    Shop.reroll(this);
  },

  leaveShop() {
    SFX.click();
    this.startLevel();
  },

  // ─────────────────────────────────────────────
  //  GOON SYSTEM
  // ─────────────────────────────────────────────
  goonVisit() {
    SFX.goon();
    const goon = pick(GOONS);
    this._goon = goon;
    flashScreen('#ff1744', 400);
    Render.goon(goon);
    screen('goon');
  },

  acceptGoon() {
    SFX.click();
    if (this._goon) {
      this._goon.apply(this);
      this._goon = null;
    }
    const p = this.p;
    p.heat = clamp(p.heat - 20, 0, 100);

    if (p.bankroll <= 0) {
      this.gameOver("The goons took everything. You're done.");
      return;
    }

    // After goon: continue normal round progression
    p.ril++;
    if (p.ril >= 3) {
      p.lvl++;
      p.ril = 0;
      p._insideManUsed = false;
      Shop.generate(this);
      Render.shop(this);
      screen('shop');
    } else {
      this.startRound();
    }
  },

  // ─────────────────────────────────────────────
  //  BOSS BRIDGE
  // ─────────────────────────────────────────────
  bossBet(choice) {
    Boss.bet(choice, this);
  },

  // ─────────────────────────────────────────────
  //  GAME OVER / WIN
  // ─────────────────────────────────────────────
  gameOver(reason) {
    SFX.loss();
    $('over-sub').textContent = reason;
    Render.statsBox('over-stats', this);
    screen('over');
  },

  winGame() {
    SFX.bigwin();
    coins(window.innerWidth / 2, window.innerHeight / 3, 22);
    $('win-sub').textContent = `${ARCHETYPES[this.p.arch].name} — Walked out with ${fmt(this.p.bankroll)}`;
    Render.statsBox('win-stats', this);
    screen('win');
  },

  restart() {
    SFX.click();
    this.p          = null;
    this._arch      = null;
    this._boss      = null;
    this._shop      = { cards: [], jokers: [], sold: new Set(), rc: 10 };
    this._rrcount   = 0;
    this._fixerUsed = false;
    this.nav('charselect');
  },

  // ─────────────────────────────────────────────
  //  TOAST PASSTHROUGH (for data.js callbacks)
  // ─────────────────────────────────────────────
  showToast(msg, cls) {
    showToast(msg, cls);
  },
};
