// ══════════════════════════════════════════════════
//  SIM.JS — Bet simulation, resolution, payout flow
// ══════════════════════════════════════════════════

const Sim = {

  // ── RUN SIMULATION SCREEN ────────────────────────
  run(G) {
    const p = G.p;
    const b = p.bet;
    screen('sim');

    $('sim-ev').textContent  = b.n.toUpperCase();
    $('sim-ico').textContent = b.ico;
    $('sim-odds').textContent = `ODDS: ${b.odds.toFixed(1)}× · WAGER: ${fmt(p.wager)}`;

    const fill = $('sim-fill');
    const lbl  = $('sim-lbl');
    const com  = $('sim-com');

    fill.style.width = '0%';
    fill.style.transition = 'none';

    const lines = COMMENTS[b.ico] || [
      "Something is happening...",
      "Results pending...",
      "Dramatic tension building...",
      "Almost there...",
    ];

    let ci = 0;
    com.textContent = lines[0];
    const comTimer = setInterval(() => {
      ci = (ci + 1) % lines.length;
      com.textContent = lines[ci];
    }, 700);

    let prog = 0;
    // Random speed — snails are slow, robots are fast
    const baseSpeed = b.risk === 'EXTREME' ? rnd(2, 4) : b.risk === 'HIGH' ? rnd(2, 6) : rnd(3, 8);

    const iv = setInterval(() => {
      prog += rnd(1, baseSpeed);
      fill.style.transition = 'width 0.1s linear';
      fill.style.width = Math.min(prog, 100) + '%';
      lbl.textContent = prog < 100
        ? b.n.toUpperCase() + '  IN PROGRESS...'
        : 'COUNTING THE RESULTS...';

      if (prog >= 100) {
        clearInterval(iv);
        clearInterval(comTimer);
        com.textContent = this._finalLine(b);
        setTimeout(() => this.resolve(G), 600);
      }
    }, rnd(30, 60));
  },

  _finalLine(b) {
    const finals = {
      "🐦": "The pigeons have crossed the finish line!",
      "🐌": "After 47 minutes, a winner is declared.",
      "🤖": "Final bell! Judges tally the damage.",
      "👨‍🍳": "Plates presented. Judges deliberate.",
      "🍔": "Final hot dog consumed. Official count in.",
      "♟️": "Checkmate or collapse — it's over.",
      "🦗": "The cyber-crickets have finished the circuit.",
      "❓": "Whatever just happened... has concluded.",
      "😤": "Your dignity status: under review.",
      "🏟️": "The snail combat has reached its conclusion.",
      "🦆": "Final pin count recorded. Ducks dispute it.",
      "🐾": "The ferrets have been corralled.",
      "🦙": "The llama awaits the judges' verdict.",
      "🐟": "Fish have landed. Distances measured.",
      "🎡": "The wheel has stopped.",
      "🐻": "The bear market has spoken.",
      "🐝": "Sting count complete. Medics on standby.",
      "🦀": "Crabs have crossed. Sideways.",
    };
    return finals[b.ico] || "The event has concluded. Results incoming...";
  },

  // ── RESOLUTION LOGIC ─────────────────────────────
  resolve(G) {
    const p = G.p;
    const b = p.bet;

    // Base chance
    let ch = calcChance(G);

    // Unknown bets finalized here for consistency
    if (b.risk === 'UNKNOWN' && !p._ukwRoll) {
      p._ukwRoll = rnd(5, 55);
    }
    if (p._ukwRoll) ch = p._ukwRoll + (p.wcb || 0) + (p.luck - 5) * 1.5;

    ch = clamp(Math.round(ch), 5, 95);
    const roll = rnd(1, 100);
    let res = roll <= ch ? 'WIN' : 'LOSS';

    // Fixer joker (once per level)
    if (res === 'LOSS' && p.jokers.includes('the_fixer') && !G._fixerUsed) {
      res = 'PUSH';
      G._fixerUsed = true;
      showToast('🔧 The Fixer intervened! Loss → Push!', 'ti');
    }

    // Pocket Sand card
    if (res === 'LOSS' && p.psa) {
      res = 'PUSH';
      showToast('✋ Pocket Sand! Loss → Push!', 'ti');
    }

    // Cash Out card — always a mini-win
    if (p.coa) {
      res = 'WIN';
      showToast('💵 Cashed out 40% early!', 'ti');
    }

    // Calculate payout
    let payout = 0;
    const pm     = p.pm || 1;
    const grudge = p.jokers.includes('bookies_grudge') && b.odds >= 4 ? 2 : 1;

    if (res === 'WIN') {
      let mult = p.coa ? 0.4 : 1;
      // Lucky Idiot random multiplier
      const idiotBonus = p.arch === 'luckyidiot' ? rndF(1.5, 3.0) : 1;
      payout = Math.floor(p.wager * b.odds * pm * grudge * mult * idiotBonus);

      // Hedge partial protection
      p.bankroll += p.wager + payout;
      p.tw       += payout;
      p.bw++;
      p.wins++;
      p.heat = clamp(p.heat - 5, 0, 100);
      SFX.win();
      if (payout > 500) SFX.bigwin();
      coins(window.innerWidth / 2, window.innerHeight / 3, payout > 300 ? 14 : 8);
      flashScreen('#00e676');

    } else if (res === 'PUSH') {
      p.bankroll += p.wager;
      payout = 0;
      p.wins = 0;

    } else {
      // LOSS
      let lossAmt = p.wager;
      if (p.hedge) lossAmt = Math.floor(p.wager * 0.5); // The Hedge card
      payout    = -lossAmt;
      p.tl      += lossAmt;
      p.bl++;
      p.wins    = 0;
      p.heat    = clamp(p.heat + 10, 0, 100);
      // Return unused wager if hedge
      if (p.hedge) p.bankroll += p.wager - lossAmt;
      SFX.loss();
      flashScreen('#ff1744');
    }

    // Clear per-round state
    p._ukwRoll = null;

    // Store last result for payout screen
    p.lastRes = { res, payout, wager: p.wager, bet: { ...b }, pm, ch };

    Render.payout(res, payout, G);
    screen('payout');
  },
};
