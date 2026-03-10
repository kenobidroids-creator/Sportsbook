// ══════════════════════════════════════════════════
//  BOSS.JS — Boss fight flow, HP system, rewards
// ══════════════════════════════════════════════════

const Boss = {

  // ── SHOW BOSS INTRO ──────────────────────────────
  show(G) {
    const b = G._boss;
    const p = G.p;

    SFX.boss();
    flashScreen('#ff2d78', 500);
    showToast(`⚠ BOSS FIGHT: ${b.n}`, 'tl');

    // Init boss state
    b.crd  = 0;
    b.chp  = b.hp;
    b.mhp  = b.hp;
    b.php  = 100;
    b.mphp = 100;

    // Player wager for boss rounds (fixed at 10% of current bankroll, min 50)
    p.bossWager = Math.max(Math.floor(p.bankroll * 0.1), 50);

    Render.boss(G);
    Render.bossQ(G);
    screen('boss');
  },

  // ── BOSS BET ─────────────────────────────────────
  bet(choice, G) {
    const b  = G._boss;
    const p  = G.p;
    const bq = b.bets[b.crd % b.bets.length];
    const opt = choice === 'Y' ? bq.Y : bq.N;

    // Disable buttons during resolution
    $('boss-opts').innerHTML = '<div style="font-size:8px;color:var(--dim)">RESOLVING...</div>';

    // Win chance influenced by luck + cards
    const baseChance = 40 + p.luck * 3 + (p.wcb || 0);
    const ch = clamp(baseChance, 15, 85);
    const roll = rnd(1, 100);
    const won = roll <= ch;

    setTimeout(() => {
      if (won) {
        // Player damages boss
        const dmg = Math.floor(opt.o * 8 + rnd(5, 15));
        b.chp = Math.max(b.chp - dmg, 0);
        const cashGain = Math.floor(p.bossWager * (opt.o - 1));
        p.bankroll += cashGain;
        p.tw += cashGain;
        SFX.win();
        flashScreen('#00e676');
        showToast(`✅ CORRECT! −${dmg} Boss HP · +${fmt(cashGain)}`, 'tw');
        coins(window.innerWidth / 2, 200, 7);
      } else {
        // Boss damages player
        const pdmg = rnd(10, 20);
        b.php = Math.max(b.php - pdmg, 0);
        const cashLoss = Math.floor(p.bossWager * 0.5);
        p.bankroll = Math.max(p.bankroll - cashLoss, 0);
        SFX.loss();
        flashScreen('#ff1744');
        showToast(`❌ WRONG! −${pdmg}% Player HP · −${fmt(cashLoss)}`, 'tl');
      }

      // Clear round card effects
      p.wcb = 0;

      Render.bossHP(G);
      b.crd++;

      // Check end conditions
      setTimeout(() => {
        if (b.chp <= 0) {
          this.win(G);
        } else if (b.php <= 0) {
          this.lose(G);
        } else if (b.crd >= b.rds) {
          // Tie-break: whoever has more HP wins
          if (b.chp < b.mhp * 0.5) {
            this.win(G);
          } else {
            this.lose(G);
          }
        } else {
          $('boss-rd').textContent = b.crd + 1;
          Render.bossQ(G);
          Render.hand(G, 'boss-hand');
        }
      }, 800);
    }, 600);
  },

  // ── BOSS WIN ─────────────────────────────────────
  win(G) {
    const b = G._boss;
    const p = G.p;
    const r = b.reward;

    SFX.bigwin();
    flashScreen('#ffc400', 800);

    p.bankroll += r.cash;
    if (r.card && CARDS[r.card]) p.hand.push(r.card);
    if (r.joker && JOKERS[r.joker] && p.jokers.length < 3) {
      p.jokers.push(r.joker);
      if (JOKERS[r.joker].onEquip) JOKERS[r.joker].onEquip(G);
    }

    coins(window.innerWidth / 2, window.innerHeight / 3, 18);

    const rewardStr = [
      `+${fmt(r.cash)}`,
      r.card  ? `Card: ${CARDS[r.card].n}`   : null,
      r.joker ? `Joker: ${JOKERS[r.joker].n}` : null,
    ].filter(Boolean).join(' · ');

    showToast(`🏆 BOSS DEFEATED! ${rewardStr}`, 'tw');

    // If this is final boss — WIN
    if (b.lvl === 10) {
      setTimeout(() => G.winGame(), 1500);
    } else {
      setTimeout(() => {
        p.lvl++;
        G._fixerUsed = false;
        Shop.generate(G);
        Render.shop(G);
        screen('shop');
      }, 1500);
    }
  },

  // ── BOSS LOSE ────────────────────────────────────
  lose(G) {
    SFX.goon();
    showToast("💀 Boss fight lost — taking a hit...", 'tl');
    const p = G.p;

    // Penalty: lose 30% bankroll
    const pen = Math.floor(p.bankroll * 0.3);
    p.bankroll = Math.max(p.bankroll - pen, 0);
    showToast(`Boss penalty: −${fmt(pen)}`, 'tl');

    // Check if broke
    setTimeout(() => {
      if (p.bankroll <= 0) {
        G.gameOver("The boss broke you. Completely.");
      } else {
        // Retry same boss or push to next level
        p.lvl++;
        G._fixerUsed = false;
        G._boss = null;
        G.startLevel();
      }
    }, 1200);
  },
};
