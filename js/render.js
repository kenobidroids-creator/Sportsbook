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
      return `<div class="${c}"></div>`;
    }).join('');

    // Luck: each point = +0.75% win chance over baseline
    const luckBonus = Math.round(p.luck * 0.75);

    // Heat bar colour and fill
    const heatPct   = Math.min(p.heat, 100);
    const heatColor = p.heat >= 70 ? '#ff1744'
                    : p.heat >= 45 ? '#ff6d00'
                    : p.heat >= 25 ? '#ffc400'
                    : '#00e676';
    const heatStatus = p.heat >= 70 ? 'DANGER'
                     : p.heat >= 45 ? 'HIGH'
                     : p.heat >= 25 ? 'WARM'
                     : 'COOL';
    const heatDanger = p.heat >= 60 ? 'heat-danger' : '';

    const avatarSrc = Render._portraits[p.arch] || '';
    const avatarHTML = avatarSrc
      ? `<img class="hud-avatar" src="${avatarSrc}" alt="${p.arch}" onclick="CharStats.open()" title="View stats">`
      : '';

    $(targetId).innerHTML = `
      <div class="hud-avatar-wrap">
        ${avatarHTML}
        <div class="hud-stat gold" style="cursor:default">💰 <span class="v">${fmt(p.bankroll)}</span></div>
      </div>

      <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
        <div style="font-size:9px;color:var(--dim)">LVL ${p.lvl}/10</div>
        <div class="level-pip-row">${pips}</div>
      </div>

      <div style="display:flex;gap:5px;align-items:center;">
        <div class="luck-pill" onclick="CharStats.open()" role="button" aria-label="Luck ${p.luck} — tap for details">
          <span class="luck-ico">🍀</span>
          <div>
            <div class="luck-val">${p.luck}<span style="font-size:8px;color:var(--dim)">/10</span></div>
            <div class="luck-sub">+${luckBonus}% WIN</div>
          </div>
        </div>

        <div class="heat-widget ${heatDanger}" onclick="CharStats.open()" role="button" aria-label="Heat ${p.heat} — tap for details">
          <div class="heat-top">
            <span class="heat-ico">🌡️</span>
            <div>
              <div class="heat-num" style="color:${heatColor}">${p.heat}</div>
              <div class="heat-lbl">${heatStatus}</div>
            </div>
          </div>
          <div class="heat-track">
            <div class="heat-fill" style="width:${heatPct}%;background:${heatColor}"></div>
          </div>
        </div>

        <button class="help-btn" onclick="Help.open()" title="How to Play (? or F1)">?</button>
        <button class="help-btn" onclick="Forfeit.open()" title="Forfeit run" style="color:var(--red);border-color:rgba(255,23,68,.4)">✕</button>
      </div>`;
  },

  // ── CHARACTER SELECT ────────────────────────────
  // Portrait images — path relative to index.html
  _portraits: {
    degenerate: 'img/arch_degenerate.png',
    mathwhiz:   'img/arch_mathwhiz.png',
    luckyidiot: 'img/arch_luckyidiot.png',
  },

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

      const portrait = this._portraits[k];
      const portraitHTML = portrait
        ? `<img class="char-portrait" src="${portrait}" alt="${a.name}" draggable="false">`
        : '';

      const c = document.createElement('div');
      c.className = 'char-card' + (portrait ? ' has-portrait' : '');
      c.dataset.k = k;
      c.innerHTML = `
        ${portraitHTML}
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

    $('rdots').innerHTML = [0, 1, 2].map(i => {
      let c = 'rdot';
      if (i < p.ril) c += ' done';
      else if (i === p.ril) c += ' now';
      return `<div class="${c}"></div>`;
    }).join('');

    // Joker slots with synergy glow
    const activeSynergies = this._detectSynergies(p);
    $('jslots').innerHTML = Array.from({ length: 3 }, (_, i) => {
      const jk = p.jokers[i];
      const jd = jk ? JOKERS[jk] : null;
      const glow = jd && activeSynergies.has(jk) ? 'synergy' : '';
      return `<div class="jslot ${jd ? 'on' : ''} ${glow}" title="${jd ? jd.n + ': ' + jd.desc : 'Empty joker slot'}">${jd ? jd.ico : ''}</div>`;
    }).join('');

    const ante = ANTES[p.lvl] || 0;
    $('ante-val').textContent = ante > 0 ? fmt(ante) : '—';
    $('ante-req').textContent = ante > 0 ? `TARGET: ${fmt(ante)}` : 'BOSS LEVEL';

    const hasLS = p.jokers.includes('loan_shark');
    const int   = G.calcInterest(p.bankroll, hasLS);
    const note  = $('int-note');
    if (int > 0) {
      note.style.display = 'block';
      note.textContent   = `💰 INTEREST EARNED: +${fmt(int)}  (BANKROLL: ${fmt(p.bankroll)})`;
    } else {
      note.style.display = 'none';
    }

    this.betGrid(G);
    $('wager-panel').style.display = 'none';
    $('hand-bar').style.display    = 'none';
    $('place-btn').style.opacity   = '0.35';
    $('place-btn').style.pointerEvents = 'none';
  },

  // Detect active joker synergy pairs for glow effect
  _detectSynergies(p) {
    const active = new Set();
    const j = p.jokers;
    const pairs = [
      ['the_tipster', 'hot_streak'],
      ['the_tipster', 'lucky_socks'],
      ['hot_streak',  'bookies_grudge'],
      ['loan_shark',  'inside_man'],
      ['brass_knuckles', 'deal_shades'],
      ['bookies_grudge', 'loaded_dice'],
    ];
    pairs.forEach(([a, b]) => {
      if (j.includes(a) && j.includes(b)) { active.add(a); active.add(b); }
    });
    return active;
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
      const baseChance = calcChance(G);
      let previewChance = baseChance;
      let previewPm = p.pm || 1;
      if (p.playedCard !== null) {
        const cid = p.hand[p.playedCard];
        if (cid === 'bluff')       previewChance += 25;
        if (cid === 'sure_thing')  previewChance += 20;
        if (cid === 'big_brain' && (p.bet.risk === 'HIGH' || p.bet.risk === 'EXTREME')) previewChance += 15;
        if (cid === 'bribe')       previewChance += 30;
        if (cid === 'parlay_slip' || cid === 'free_parlay') previewPm *= 1.5;
      }
      previewChance = Math.min(95, Math.max(5, Math.round(previewChance)));
      const grudge  = p.jokers.includes('bookies_grudge') && p.bet.odds >= 4 ? 2 : 1;
      const winAmt  = Math.floor(p.wager * p.bet.odds * previewPm * grudge);
      const showOdds = p.bet.risk === 'UNKNOWN' && !p.iia;
      const hasBonus = previewChance !== baseChance;

      $('pv-win').textContent  = `+${fmt(winAmt)}`;
      $('pv-lose').textContent = `-${fmt(p.wager)}`;
      $('pv-ch').textContent   = showOdds ? '???%'
                               : hasBonus ? `${baseChance}% → ${previewChance}%`
                               : `${baseChance}%`;
    }
  },

  // ── HAND / CARDS ────────────────────────────────
  hand(G, containerId = 'hand-scroll') {
    const p  = G.p;
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
    $('shop-br').textContent  = fmt(p.bankroll);
    $('rr-cost').textContent  = G._shop.rc + (p.rce || 0);

    this.shopSection('shop-cards',  G._shop.cards,  'card',  G);
    this.shopSection('shop-jokers', G._shop.jokers, 'joker', G);
    this.shopHand(G);
  },

  shopSection(containerId, items, type, G) {
    const p  = G.p;
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
      const scaledCost = Math.round(data.cost * (G._shop._priceScale || 1));
      const broke = p.bankroll < scaledCost;
      const full  = type === 'joker' && p.jokers.length >= 3 && !sold;

      const d = document.createElement('div');
      d.className = `sitem ${sold ? 'sold' : ''} ${(!sold && broke) ? 'broke' : ''}`;
      d.innerHTML = `
        <div class="sitem-tag tag-${type}">${type.toUpperCase()}</div>
        <div class="sico">${data.ico}</div>
        <div class="sname">${data.n}</div>
        <div class="sdesc">${data.desc}</div>
        <div class="sprice">${sold ? 'SOLD' : scaledCost === 0 ? 'FREE' : fmt(scaledCost)}</div>
        ${full ? '<div style="font-size:9px;color:var(--red);margin-top:3px">JOKER SLOTS FULL</div>' : ''}`;

      // Long-press / right-click for preview; click to buy
      if (!sold) {
        d.addEventListener('contextmenu', e => { e.preventDefault(); Shop.preview(type, id); });
        d.title = 'Click to buy · Right-click for details';
        if (!broke && !full) d.onclick = () => G.buyItem(type, id, idx);
        else d.onclick = () => Shop.preview(type, id);
      }
      el.appendChild(d);
    });
  },

  // ── HAND IN SHOP (sell section) ──────────────────
  shopHand(G) {
    const p  = G.p;
    const el = $('shop-hand');
    if (!el) return;

    const hasCards  = p.hand.length > 0;
    const hasJokers = p.jokers.length > 0;

    if (!hasCards && !hasJokers) {
      el.innerHTML = '<div style="font-size:9px;color:var(--dim);padding:6px">Nothing to sell.</div>';
      return;
    }

    const cardHTML = p.hand.map((cid, i) => {
      const c = CARDS[cid];
      if (!c) return '';
      const sv = Math.max(5, Math.floor((c.cost || 20) * 0.4));
      return `
        <div class="sitem sell-item" onclick="G.sellCard(${i})" title="Sell for ${fmt(sv)}">
          <div class="sitem-tag tag-sell">CARD</div>
          <div class="sico">${c.ico}</div>
          <div class="sname">${c.n}</div>
          <div class="sdesc">${c.fx}</div>
          <div class="sprice" style="color:var(--green)">+${fmt(sv)}</div>
        </div>`;
    }).join('');

    const jokerHTML = p.jokers.map((jid, i) => {
      const j = JOKERS[jid];
      if (!j) return '';
      const sv = Math.max(10, Math.floor((j.cost || 50) * 0.5));
      return `
        <div class="sitem sell-item sell-joker" onclick="G.sellJoker(${i})" title="Sell for ${fmt(sv)}">
          <div class="sitem-tag tag-sell-joker">JOKER</div>
          <div class="sico">${j.ico}</div>
          <div class="sname">${j.n}</div>
          <div class="sdesc">${j.desc}</div>
          <div class="sprice" style="color:var(--gold)">+${fmt(sv)}</div>
        </div>`;
    }).join('');

    el.innerHTML = cardHTML + jokerHTML;
  },

  // ── PAYOUT ──────────────────────────────────────
  payout(res, payout, G) {
    const p  = G.p;
    const lr = p.lastRes;
    const el = $('pay-res');
    el.className = 'pay-result';

    if (res === 'WIN') {
      if (lr.earlyOut) {
        el.textContent = '⚡ CASHED OUT';
        el.classList.add('push'); // gold-ish styling
        this._animateCount($('pay-amt'), 0, payout, '+', 'var(--cyan)');
      } else {
        el.textContent = '🏆 WIN!';
        el.classList.add('win');
        this._animateCount($('pay-amt'), 0, payout, '+', 'var(--green)');
      }
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

    // Outcome flavour comment
    const cmtEl = $('pay-comment');
    if (cmtEl) {
      cmtEl.textContent = lr.outcomeComment || '';
      cmtEl.style.color = res === 'WIN' ? 'var(--green)' : res === 'LOSS' ? 'var(--red)' : 'var(--gold)';
    }

    const pm = (lr.pm > 1)
      ? `<div class="pline"><span>Payout Multiplier</span><span style="color:var(--purple)">×${lr.pm.toFixed(2)}</span></div>` : '';
    const earlyRow = lr.earlyOut
      ? `<div class="pline"><span>Cash Out (early)</span><span style="color:var(--cyan)">⚡ 40% of win</span></div>` : '';
    const resultLabel = lr.earlyOut ? 'CASHED OUT' : 'RESULT';
    const resultVal   = lr.earlyOut
      ? `<span style="color:var(--cyan)">+${fmt(payout)}</span>`
      : res === 'WIN'  ? `<span style="color:var(--green)">+${fmt(payout)}</span>`
      : res === 'LOSS' ? `<span style="color:var(--red)">-${fmt(lr.wager)}</span>`
      :                  `<span style="color:var(--gold)">${fmt(0)}</span>`;
    $('pay-bd').innerHTML = `
      <div class="pline"><span>Event</span><span>${lr.bet.ico} ${lr.bet.n}</span></div>
      <div class="pline"><span>Wager</span><span>${fmt(lr.wager)}</span></div>
      <div class="pline"><span>Odds</span><span>${lr.bet.odds.toFixed(1)}×</span></div>
      ${pm}${earlyRow}
      <div class="pline"><span>Win Chance</span><span>${lr.ch}%</span></div>
      <div class="pline tot"><span>${resultLabel}</span>${resultVal}</div>`
    $('pay-br').textContent = `NEW BANKROLL: ${fmt(p.bankroll)}`;
  },

  // ── ANIMATED COUNTER ─────────────────────────────
  _animateCount(el, from, to, prefix, color) {
    el.style.color = color;
    const dur    = 900;
    const start  = performance.now();
    const tick   = now => {
      const t   = Math.min((now - start) / dur, 1);
      const val = Math.floor(from + (to - from) * this._easeOut(t));
      el.textContent = `${prefix}${fmt(val)}`;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = `${prefix}${fmt(to)}`;
    };
    requestAnimationFrame(tick);
  },

  _easeOut(t) { return 1 - Math.pow(1 - t, 3); },

  // ── BOSS FIGHT ─────────────────────────────────
  boss(G) {
    const b = G._boss;
    this.bossHP(G);
    $('boss-nm').textContent = `👑 BOSS FIGHT — ${b.n}`;
    $('boss-ico').textContent = b.ico;
    $('boss-rd').textContent  = b.crd + 1;
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
    $('boss-st').textContent = fmt(G.p.bossWager);
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
