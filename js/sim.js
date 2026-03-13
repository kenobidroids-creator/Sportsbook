// ══════════════════════════════════════════════════
//  SIM.JS — Bet simulation, resolution, payout flow
// ══════════════════════════════════════════════════

const Sim = {

  // ── PRE-COMPUTE RESULT SECRETLY ──────────────────
  _precompute(G) {
    const p = G.p;
    const b = p.bet;

    let ch = calcChance(G);

    // Unknown bets resolved here
    if (b.risk === 'UNKNOWN' && !p._ukwRoll) p._ukwRoll = rnd(5, 55);
    if (p._ukwRoll) ch = p._ukwRoll + (p.wcb || 0) + (p.luck - 5) * 1.5;

    ch = clamp(Math.round(ch), 5, 95);
    const roll = rnd(1, 100);
    let res    = roll <= ch ? 'WIN' : 'LOSS';

    // Fixer joker
    if (res === 'LOSS' && p.jokers.includes('the_fixer') && !G._fixerUsed) {
      res = 'PUSH';
      G._fixerUsed = true;
    }
    // Pocket Sand
    if (res === 'LOSS' && p.psa) res = 'PUSH';
    // Cash Out always wins
    if (p.coa) res = 'WIN';

    return { res, ch };
  },

  // ── MAIN ENTRY — START BROADCAST ─────────────────
  run(G) {
    const p = G.p;

    // Pre-compute result before any animation
    const { res, ch } = this._precompute(G);

    screen('sim');
    Broadcast.stop();
    Broadcast.renderScreen(G);
    Broadcast.run(G, res, ch);
  },

  // ── OUTCOME LINES ─────────────────────────────────
  _outcomeLines: {
    WIN: {
      "🐦": ["Your pigeon DOMINATED. Wings of gold.", "First place by a beak. You absolute genius.", "The other pigeons wept. You did not."],
      "🐌": ["YOUR SNAIL WON. Against all odds and biology.", "Slow and steady, and also you're rich now.", "The snail left the competition in the slime."],
      "🤖": ["KNOCKOUT! Your bot obliterated the competition.", "Critical hit. Oil everywhere. You win.", "Robot victorious. Engineers are baffled."],
      "👨‍🍳": ["PERFECT SCORE. Judges are weeping. Beautifully.", "First place. Gordon is reportedly sobbing.", "The dish was transcendent. So is your wallet."],
      "🍔": ["RECORD. Your champ consumed 74 dogs. Glorious.", "A new legend is born. And full. Very full.", "The crowd erupts. Your wallet fattens."],
      "♟️": ["CHECKMATE IN 4 MOVES. Ruthless. Profitable.", "Speed chess victory. The loser flipped the board.", "Dominant performance. Violence implied."],
      "🦗": ["YOUR CRICKET TOOK GOLD. Bionic and beautiful.", "The cyber-cricket crossed first. You're rich.", "AI-assisted win. Worth every penny."],
      "❓": ["Whatever happened, you won. Don't overthink it.", "Somehow, impossibly, you called it.", "Victory achieved. No further questions."],
      "😤": ["Your dignity? Intact. Your bankroll? Growing.", "Turns out you didn't need dignity. Money's better.", "You wagered your pride. You kept it AND got paid."],
      "🏟️": ["YOUR SNAIL DESTROYED THE COMPETITION. Literally.", "Gladiator Snail victorious. Rome is shook.", "Tiny champion. Massive payout."],
      "🦆": ["STRIKE! Ducks enraged. You enriched.", "Perfect form. The ducks bow to you.", "Duck Bowling royalty. Collect your crown."],
      "🐾": ["YOUR FERRET IS FASTEST. Also most caffeinated.", "First place! The ferret is already gone.", "Lightning ferret. Lightning bankroll."],
      "🦙": ["The llama spelled PRESTIDIGITATION. Flawlessly.", "Llama wins. You win. Everyone wins except losers.", "Linguistic llama delivers. You're up."],
      "🐟": ["THE FISH DEFIED GRAVITY AND PHYSICS. For you.", "Gold medal fish parkour. Unprecedented.", "Aquatic athletics. Aquatic riches."],
      "🎡": ["The wheel landed perfectly. As you suspected.", "Fortune favours the bold. And you, specifically.", "Wheel of Fortune: ACTIVATED."],
      "🐻": ["Bull market energy. Bear market loser. You win.", "Financial combat: decisive victory.", "The bear capitulated. Your position: profitable."],
      "🐝": ["Most stings. Most glory. Most money.", "Your beekeeper was unstoppable. And unwell.", "Victory by a landslide of stings. Collect."],
      "🦀": ["Sideways to glory. Your crab: champion.", "Fastest sideways 40-yard dash in history.", "Crab Rave Race: your crab was RAVING."],
    },
    LOSS: {
      "🐦": ["Your pigeon stopped to eat garbage. Classic.", "Dead last. The pigeon didn't even try.", "Eliminated in round 1. By a city bird."],
      "🐌": ["Your snail appears to have dissolved.", "The snail napped. For the entire race.", "Last place. It took four hours. You lost."],
      "🤖": ["SYSTEM FAILURE. Your bot fell over immediately.", "Error 404: Winning Not Found.", "Your robot punched itself. Repeatedly."],
      "👨‍🍳": ["Undercooked. Literally and financially.", "The judges left. No score given. Just silence.", "Catastrophic soufflé collapse. You're out."],
      "🍔": ["Your guy choked on hot dog 3. Medics called.", "29 dogs. Rookie numbers. Rookie results.", "DNF. Disqualified for excessive mustard."],
      "♟️": ["Checkmated in 2 moves. Humiliating.", "The board was flipped. Onto your hopes.", "Speed chess: you moved slow and lost fast."],
      "🦗": ["Your cricket chewed through the power cables.", "Malfunction at the start line. Painful.", "The AI had a bug. So did you. Loss."],
      "❓": ["You lost at something. You'll never know what.", "The mystery event ended badly. As expected.", "Whatever this was — you lost it."],
      "😤": ["Dignity gone. Bankroll gone. Rough day.", "You wagered your pride and lost both.", "The crowd judged. Harshly. Wallet empty."],
      "🏟️": ["Your snail surrendered immediately. Coward.", "Shell cracked. Spirit broken. Wallet too.", "Gladiator Snail down in round one."],
      "🦆": ["Gutter ball. The ducks are laughing at you.", "Zero pins. The ducks revolt.", "Disqualified for disturbing the ducks."],
      "🐾": ["Your ferret escaped. Into the stands. Into freedom.", "Wrong direction. Full speed. Away from winning.", "The ferret retired mid-race. Unretired somewhere else."],
      "🦙": ["The llama refused to spell anything today.", "Misspelled 'the'. Disqualified immediately.", "The llama spat on the judges. You lose."],
      "🐟": ["The fish landed on dry land and stayed there.", "Gravity won. Fish lost. You lost.", "Physics reasserted itself. Dramatically."],
      "🎡": ["The wheel mocked you. Openly.", "Bad luck. Worse timing. Worst result.", "Wheel of Misfortune: activated specifically for you."],
      "🐻": ["Bear market brutality. You were the market.", "Margin called. On your soul.", "The bear ate your position for breakfast."],
      "🐝": ["Fewest stings. Most shame. No money.", "Your beekeeper quit after sting two.", "Medical evacuation. Financial evacuation."],
      "🦀": ["Wrong direction. Impressive confidence. Wrong.", "Your crab went sideways into the crowd.", "Crab Rave Race: your crab was just raving."],
    },
  },

  _outcomeComment(res, ico) {
    const pool = this._outcomeLines[res]?.[ico];
    return pool ? pick(pool) : (res === 'WIN' ? 'You won.' : 'You lost.');
  },

  // ── RESOLUTION — receives pre-computed result ─────
  resolve(G, precomputedRes, precomputedCh, interruptChoice) {
    const p  = G.p;
    const b  = p.bet;
    let res  = precomputedRes;
    const ch = precomputedCh;

    // Show toast for special card triggers
    if (res === 'PUSH' && p.psa)   showToast('✋ Pocket Sand! Loss → Push!', 'ti');
    if (res === 'PUSH' && G._fixerUsed && !p.psa) showToast('🔧 The Fixer saved you!', 'ti');
    if (p.coa) showToast('💵 Cash Out triggered!', 'ti');

    let payout = 0;
    const pm     = p.pm || 1;
    const grudge = p.jokers.includes('bookies_grudge') && b.odds >= 4 ? 2 : 1;

    // Apply interrupt choice from broadcast
    if (interruptChoice === 'double' && p.bankroll >= p.wager) {
      p.wager    *= 2;
      p.bankroll -= p.wager / 2; // deduct the extra wager
      showToast('⚡ DOUBLED DOWN!', 'ti');
    } else if (interruptChoice === 'cashout') {
      // Cash out pays 40% of potential win — result of event is irrelevant
      const earlyPay = Math.floor(p.wager * b.odds * 0.4);
      p.bankroll += p.wager + earlyPay; // wager returned + early profit
      p._earlyOut = earlyPay;
      p.tw += earlyPay;
      p.bw++;
      p.wins++;
      p.heat = clamp(p.heat - 5, 0, 100);
      SFX.win();
      coins(window.innerWidth / 2, window.innerHeight / 3, 6);
      flashScreen('#00e5ff');
      showToast(`⚡ Cashed out: +${fmt(earlyPay)}`, 'ti');

      // Skip the normal WIN/LOSS/PUSH block entirely
      p._ukwRoll = null;
      p._earlyOut = null;
      p.lastRes = {
        res: 'WIN', payout: earlyPay, wager: p.wager, bet: { ...b }, pm, ch,
        earlyOut: true,
        outcomeComment: this._outcomeComment('WIN', b.ico),
      };
      this._pendingResolution = { res: 'WIN', payout: earlyPay, G };
      this._showResultOverlay('WIN', earlyPay, G);
      return;
    }

    if (res === 'WIN') {
      const mult       = p.coa ? 0.4 : 1;
      const idiotBonus = p.arch === 'luckyidiot' ? rndF(1.5, 3.0) : 1;
      payout           = p.coa ? Math.floor(p.wager * b.odds * mult) : Math.floor(p.wager * b.odds * pm * grudge * idiotBonus);
      p.bankroll      += p.wager + payout;
      p.tw            += payout;
      p.bw++;
      p.wins++;
      p.heat           = clamp(p.heat - 5, 0, 100);
      SFX.win();
      if (payout > 500) SFX.bigwin();
      coins(window.innerWidth / 2, window.innerHeight / 3, payout > 300 ? 14 : 8);
      flashScreen('#00e676');

    } else if (res === 'PUSH') {
      p.bankroll += p.wager;
      payout      = 0;
      p.wins      = 0;

    } else {
      let lossAmt  = p.wager;
      if (p.hedge) lossAmt = Math.floor(p.wager * 0.5);
      payout       = -lossAmt;
      p.tl        += lossAmt;
      p.bl++;
      p.wins       = 0;
      p.heat       = clamp(p.heat + 10, 0, 100);
      if (p.hedge) p.bankroll += p.wager - lossAmt;
      SFX.loss();
      flashScreen('#ff1744');
      document.body.classList.remove('shake');
      void document.body.offsetWidth;
      document.body.classList.add('shake');
      setTimeout(() => document.body.classList.remove('shake'), 500);
    }

    p._ukwRoll = null;
    p._earlyOut = null;
    p.lastRes  = {
      res, payout, wager: p.wager, bet: { ...b }, pm, ch,
      earlyOut: false,
      outcomeComment: this._outcomeComment(res, b.ico),
    };

    // Show result overlay on sim screen — player must click continue
    this._pendingResolution = { res, payout, G };
    this._showResultOverlay(res, payout, G);
  },

  _showResultOverlay(res, payout, G) {
    // Remove any existing
    const old = document.getElementById('sim-result-overlay');
    if (old) old.remove();

    const won    = res === 'WIN';
    const isPush = res === 'PUSH';

    const overlay = document.createElement('div');
    overlay.id = 'sim-result-overlay';

    const color   = won ? 'var(--green)' : isPush ? 'var(--gold)' : 'var(--red)';
    const label   = won ? '🏆 WIN' : isPush ? '↩ PUSH' : '💀 LOSS';
    const payTxt  = won ? `+${fmt(payout)}` : isPush ? `±${fmt(0)}` : `-${fmt(Math.abs(payout))}`;
    const comment = G.p.lastRes?.outcomeComment || '';

    overlay.innerHTML = `
      <div class="sro-inner">
        <div class="sro-result" style="color:${color}">${label}</div>
        <div class="sro-pay"    style="color:${color}">${payTxt}</div>
        <div class="sro-comment">${comment}</div>
        <button class="sro-btn" onclick="Sim._continueFromResult()">
          VIEW PAYOUT ▶
        </button>
      </div>`;

    // Mount centered over TV inside bc-room
    const bcRoom = document.querySelector('.bc-room');
    if (bcRoom) {
      overlay.classList.add('sro-tv-mount');
      bcRoom.appendChild(overlay);
    } else {
      const simScreen = document.getElementById('s-sim');
      if (simScreen) simScreen.appendChild(overlay);
    }

    // If expand overlay is open, inject result panel there too so fullscreen players see it
    const expandOverlay = document.getElementById('tv-expand-overlay');
    if (expandOverlay && expandOverlay.classList.contains('open')) {
      const expandCopy = document.createElement('div');
      expandCopy.id = 'sim-result-overlay-big';
      expandCopy.className = 'sro-expand-copy';
      expandCopy.innerHTML = `
        <div class="sro-result" style="color:${color}">${label}</div>
        <div class="sro-pay"   style="color:${color}">${payTxt}</div>
        <div class="sro-comment">${comment}</div>
        <button class="sro-btn" onclick="TV.collapse(); Sim._continueFromResult()">
          VIEW PAYOUT ▶
        </button>`;
      expandOverlay.appendChild(expandCopy);
    }
  },

  _continueFromResult() {
    const overlay = document.getElementById('sim-result-overlay');
    if (overlay) overlay.remove();
    const bigCopy = document.getElementById('sim-result-overlay-big');
    if (bigCopy) bigCopy.remove();
    TV.collapse(); // ensure expand is closed when proceeding
    if (!this._pendingResolution) return;
    const { res, payout, G } = this._pendingResolution;
    this._pendingResolution = null;
    Render.payout(res, payout, G);
    screen('payout');
  },
};
