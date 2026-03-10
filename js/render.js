// ══════════════════════════════════════════════════
//  RENDER.JS — All DOM rendering / UI building
// ══════════════════════════════════════════════════

const Render = {

  // ── HUD (shared header) ─────────────────────────
  hud(targetId, G) {
    const p = G.p;
    const pips = Array.from({ length: 10 }, (_, i) => {
      let c = 'pip';
      if (i + 1 < p.lvl) c += ' done';
      else if (i + 1 === p.lvl) c += ' now';
      return `<div class="${c}" title="Level ${i + 1}"></div>`;
    }).join('');

    $(targetId).innerHTML = `
      <div class="hud-stat gold">💰 <span class="v">${fmt(p.bankroll)}</span></div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
        <div style="font-size:9px;color:var(--dim)">LVL ${p.lvl}/10</div>
        <div class="level-pip-row">${pips}</div>
      </div>
      <div style="display:flex;gap:6px;">
        <div class="hud-stat purple">🍀<span class="v">${p.luck}</span></div>
        <div class="hud-stat red">🌡️<span class="v">${p.heat}</span></div>
      </div>`;
  },

  // ── CHARACTER SELECT ────────────────────────────
  charSelect(G) {
    const grid = $('char-grid');
    grid.innerHTML = '';
    Object.entries(ARCHETYPES).forEach(([k, a]) => {
      const bars = Object.entries(a.stats).map(([sn, sv]) => `
        <div class="cstat">
          <div class="cstat-lbl">${sn}</div>
          <div class="cstat-bar">
            <div class="cstat-fill" style="width:${sv * 10}%;background:${a.statColors[sn]}"></div>
          </div>
          <div style="font-size:9px;color:${a.statColors[sn]};width:22px;text-align:right">${sv}</div>
        </div>`).join('');

      const c = document.createElement('div');
      c.className = 'char-card';
      c.dataset.k = k;
      c.innerHTML = `
        <div class="char-icon">${a.icon}</div>
        <div class="char-name">${a.name}</div>
        <div class="char-bio">${a.bio.replace(/\n/g, '<br>')}</div>
        <div class="char-stats">${bars}</div>
        <div class="char-perk">
          <div class="perk-title">⭐ ${a.perk}</div>
          <div class="perk-text">${a.perkDesc.replace(/\n/g, '<br>')}</div>
        </div>
        <div class="char-foot">START: ${fmt(a.bankroll)} · LUCK: ${a.luck}/10</div>`;
      c.onclick = () => G.selChar(k, c);
      grid.appendChild(c);
    });
  },

  // ── BETTING BOARD ───────────────────────────────
  bettingBoard(G) {
    const p = G.p;
    this.hud('hud-bet', G);

    // Round dots (3 rounds per level)
    $('rdots').innerHTML = [0, 1, 2].map(i => {
      let c = 'rdot';
      if (i < p.ril) c += ' done';
      else if (i === p.ril) c += ' now';
      return `<div class="${c}"></div>`;
    }).join('');

    // Joker slots
    $('jslots').innerHTML = Array.from({ length: 3 }, (_, i) => {
      const jk = p.jokers[i];
      const jd = jk ? JOKERS[jk] : null;
      return `<div class="jslot ${jd ? 'on' : ''}" title="${jd ? jd.n + ': ' + jd.desc : 'Empty joker slot'}">${jd ? jd.ico : ''}</div>`;
    }).join('');

    // Ante display
    const ante = ANTES[p.lvl] || 0;
    $('ante-val').textContent = ante > 0 ? fmt(ante) : '—';
    $('ante-req').textContent = ante > 0 ? `TARGET: ${fmt(ante)}` : 'BOSS LEVEL';

    // Interest message
    const hasLS = p.jokers.includes('loan_shark');
    const int = G.calcInterest(p.bankroll, hasLS);
    const note = $('int-note');
    if (int > 0) {
      note.style.display = 'block';
      note.textContent = `💰 INTEREST EARNED: +${fmt(int)}  (BANKROLL: ${fmt(p.bankroll)})`;
    } else {
      note.style.display = 'none';
    }

    // Bet grid
    this.betGrid(G);

    // Reset panels
    $('wager-panel').style.display = 'none';
    $('hand-bar').style.display = 'none';
    $('place-btn').style.opacity = '0.35';
    $('place-btn').style.pointerEvents = 'none';
  },

  // ── BET GRID ────────────────────────────────────
  betGrid(G) {
    const grid = $('bet-grid');
    grid.innerHTML = '';
    G.p.currentBets.forEach((b, i) => {
      const oddsStr = b.risk === 'UNKNOWN' ? '???×' : b.odds.toFixed(1) + '×';
      const d = document.createElement('div');
      d.className = 'bet-card';
      d.innerHTML = `
        <div class="bico">${b.ico}</div>
        <div class="bname">${b.n}</div>
        <div class="bodds">${oddsStr}</div>
        <div class="bdesc">${b.desc}</div>
        <div class="brisk brisk-${b.risk}">${b.risk}</div>`;
      d.onclick = () => G.selBet(i, d);
      grid.appendChild(d);
    });
  },

  // ── WAGER PANEL ─────────────────────────────────
  updateWager(G) {
    const p = G.p;
    $('wnum').textContent = fmt(p.wager);
    if (p.bet) {
      const ch = calcChance(G);
      const pm = p.pm || 1;
      const grudge = p.jokers.includes('bookies_grudge') && p.bet.odds >= 4 ? 2 : 1;
      const winAmt = Math.floor(p.wager * p.bet.odds * pm * grudge);
      const showOdds = p.bet.risk === 'UNKNOWN' && !p.iia;

      $('pv-win').textContent  = `+${fmt(winAmt)}`;
      $('pv-lose').textContent = `-${fmt(p.wager)}`;
      $('pv-ch').textContent   = showOdds ? '???%' : `${ch}%`;
    }
  },

  // ── HAND / CARDS ────────────────────────────────
  hand(G, containerId = 'hand-scroll') {
    const p = G.p;
    const el = $(containerId);
    if (!el) return;

    if (!p.hand.length) {
      el.innerHTML = '<div class="empty-hand">NO CARDS IN HAND</div>';
      return;
    }

    el.innerHTML = p.hand.map((cid, i) => {
      const c = CARDS[cid];
      if (!c) return '';
      const active = p.playedCard === i;
      return `
        <div class="hcard ${active ? 'active' : ''}" onclick="G.playCard(${i})">
          <div class="hcico">${c.ico}</div>
          <div class="hcname">${c.n}</div>
          <div class="hcfx">${c.fx.replace(/\n/g, '<br>')}</div>
          ${active ? '<div class="hcactive">✔ ACTIVE</div>' : ''}
        </div>`;
    }).join('');
  },

  // ── SHOP ─────────────────────────────────────────
  shop(G) {
    const p = G.p;
    this.hud('hud-shop', G);
    $('shop-br').textContent = fmt(p.bankroll);
    $('rr-cost').textContent = G._shop.rc + (p.rce || 0);

    this.shopSection('shop-cards',  G._shop.cards,  'card',  G);
    this.shopSection('shop-jokers', G._shop.jokers, 'joker', G);
  },

  shopSection(containerId, items, type, G) {
    const p = G.p;
    const el = $(containerId);
    el.innerHTML = '';

    if (!items.length) {
      el.innerHTML = '<div style="font-size:10px;color:var(--dim);padding:8px">— SOLD OUT —</div>';
      return;
    }

    items.forEach((id, idx) => {
      const data = type === 'card' ? CARDS[id] : JOKERS[id];
      if (!data) return;

      const sold  = G._shop.sold.has(type + '_' + idx);
      const broke = p.bankroll < data.cost;
      const full  = type === 'joker' && p.jokers.length >= 3 && !sold;

      const d = document.createElement('div');
      d.className = `sitem ${sold ? 'sold' : ''} ${(!sold && broke) ? 'broke' : ''}`;
      d.innerHTML = `
        <div class="sitem-tag tag-${type}">${type.toUpperCase()}</div>
        <div class="sico">${data.ico}</div>
        <div class="sname">${data.n}</div>
        <div class="sdesc">${data.desc}</div>
        <div class="sprice">${sold ? 'SOLD' : data.cost === 0 ? 'FREE' : fmt(data.cost)}</div>
        ${full ? '<div style="font-size:9px;color:var(--red);margin-top:3px">JOKER SLOTS FULL</div>' : ''}`;

      if (!sold && !broke && !full) {
        d.onclick = () => G.buyItem(type, id, idx);
      }
      el.appendChild(d);
    });
  },

  // ── PAYOUT ──────────────────────────────────────
  payout(res, payout, G) {
    const p = G.p;
    const lr = p.lastRes;
    const el = $('pay-res');
    el.className = 'pay-result';

    if (res === 'WIN') {
      el.textContent = '🏆 WIN!';
      el.classList.add('win');
      $('pay-amt').textContent = `+${fmt(payout)}`;
      $('pay-amt').style.color = 'var(--green)';
    } else if (res === 'LOSS') {
      el.textContent = '💀 LOSS';
      el.classList.add('loss');
      $('pay-amt').textContent = `-${fmt(lr.wager)}`;
      $('pay-amt').style.color = 'var(--red)';
    } else {
      el.textContent = '🤝 PUSH';
      el.classList.add('push');
      $('pay-amt').textContent = `${fmt(0)} (wager returned)`;
      $('pay-amt').style.color = 'var(--gold)';
    }

    // Breakdown
    const pm = (lr.pm > 1) ? `<div class="pline"><span>Payout Multiplier</span><span style="color:var(--purple)">×${lr.pm.toFixed(2)}</span></div>` : '';
    $('pay-bd').innerHTML = `
      <div class="pline"><span>Event</span><span>${lr.bet.ico} ${lr.bet.n}</span></div>
      <div class="pline"><span>Wager</span><span>${fmt(lr.wager)}</span></div>
      <div class="pline"><span>Odds</span><span>${lr.bet.odds.toFixed(1)}×</span></div>
      ${pm}
      <div class="pline"><span>Win Chance</span><span>${lr.ch}%</span></div>
      <div class="pline tot"><span>RESULT</span><span style="color:${res === 'WIN' ? 'var(--green)' : res === 'LOSS' ? 'var(--red)' : 'var(--gold)'}">${res === 'WIN' ? '+' + fmt(payout) : res === 'LOSS' ? '-' + fmt(lr.wager) : fmt(0)}</span></div>`;

    $('pay-br').textContent = `NEW BANKROLL: ${fmt(p.bankroll)}`;
  },

  // ── BOSS FIGHT ─────────────────────────────────
  boss(G) {
    const b = G._boss;
    const p = G.p;
    this.bossHP(G);
    $('boss-nm').textContent = `👑 BOSS FIGHT — ${b.n}`;
    $('boss-ico').textContent = b.ico;
    $('boss-rd').textContent = b.crd + 1;
    this.hand(G, 'boss-hand');
  },

  bossHP(G) {
    const b = G._boss;
    $('php').style.width = b.php + '%';
    $('bhp').style.width = (b.chp / b.mhp * 100) + '%';
    $('php-t').textContent = `${Math.round(b.php)}%`;
    $('bhp-t').textContent = `${b.chp}/${b.mhp}`;
  },

  bossQ(G) {
    const b  = G._boss;
    const bq = b.bets[b.crd % b.bets.length];
    $('boss-q').textContent = bq.q;
    $('boss-st').textContent = fmt(G.p.wager);
    $('boss-opts').innerHTML = `
      <button class="btn btn-cyan" onclick="G.bossBet('Y')">${bq.Y.l}</button>
      <button class="btn btn-pink" onclick="G.bossBet('N')">${bq.N.l}</button>`;
  },

  // ── GOON SCREEN ─────────────────────────────────
  goon(goon) {
    $('goon-ico').textContent = goon.ico;
    $('goon-nm').textContent  = goon.n;
    $('goon-dlg').textContent = goon.dlg;
    $('goon-con').textContent = goon.con;
  },

  // ── STATS BOX ───────────────────────────────────
  statsBox(targetId, G) {
    const p = G.p;
    $(targetId).innerHTML = `
      <div class="srow"><span>ARCHETYPE</span><span class="sv">${ARCHETYPES[p.arch].name}</span></div>
      <div class="srow"><span>FINAL BANKROLL</span><span class="sv">${fmt(p.bankroll)}</span></div>
      <div class="srow"><span>TOTAL WINNINGS</span><span class="sv" style="color:var(--green)">+${fmt(p.tw)}</span></div>
      <div class="srow"><span>TOTAL LOSSES</span><span class="sv" style="color:var(--red)">-${fmt(p.tl)}</span></div>
      <div class="srow"><span>BETS WON</span><span class="sv">${p.bw}</span></div>
      <div class="srow"><span>BETS LOST</span><span class="sv">${p.bl}</span></div>
      <div class="srow"><span>PEAK LUCK</span><span class="sv">${p.luck}/10</span></div>
      <div class="srow"><span>LEVEL REACHED</span><span class="sv">${p.lvl}/10</span></div>`;
  },
};
