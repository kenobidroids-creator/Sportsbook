// ══════════════════════════════════════════════════
//  SHOP.JS — Shop generation, buy/sell, preview, rerolls
// ══════════════════════════════════════════════════

const Shop = {

  // ── GENERATE SHOP INVENTORY ──────────────────────
  generate(G) {
    const p = G.p;

    const allCards  = Object.keys(CARDS).filter(c => c !== 'free_parlay');
    const allJokers = Object.keys(JOKERS).filter(j => !p.jokers.includes(j));

    const owned = new Set(p.hand);
    const cardPool = shuffle(allCards).sort((a, b) => {
      return (owned.has(a) ? 1 : 0) - (owned.has(b) ? 1 : 0);
    });

    const priceScale = 1 + (p.lvl - 1) * 0.1;

    const cards  = cardPool.slice(0, 4);
    let   jokers = shuffle(allJokers).slice(0, 3);

    // ── GUARANTEED JOKER SLOT AT LEVEL 1 ────────────
    // If this is the first shop visit (after level 1) and no jokers yet,
    // guarantee at least one joker appears and is affordable
    if (p.lvl === 2 && p.jokers.length === 0 && jokers.length > 0) {
      // Sort so cheapest joker is first
      jokers = jokers.sort((a, b) => (JOKERS[a]?.cost || 999) - (JOKERS[b]?.cost || 999));
    }

    G._shop = {
      cards,
      jokers,
      sold:        new Set(),
      rc:          10,
      _priceScale: priceScale,
    };

    G._rrcount = 0;
  },

  // ── BUY ITEM ─────────────────────────────────────
  buy(type, id, idx, G) {
    const p    = G.p;
    const data = type === 'card' ? CARDS[id] : JOKERS[id];
    if (!data) return;

    const scaledCost = Math.round(data.cost * (G._shop._priceScale || 1));
    if (p.bankroll < scaledCost) { showToast('Not enough bankroll!', 'tl'); return; }
    if (type === 'joker' && p.jokers.length >= 3) { showToast('Joker slots full! (Max 3)', 'tl'); return; }

    p.bankroll -= scaledCost;
    G._shop.sold.add(type + '_' + idx);
    SFX.buy();

    if (type === 'card') {
      p.hand.push(id);
      showToast(`🃏 ${data.n} added to hand!`, 'ti');
    } else {
      p.jokers.push(id);
      if (data.onEquip) data.onEquip(G);
      showToast(`♾️ ${data.n} equipped!`, 'ti');
    }

    Render.shop(G);
  },

  // ── SELL JOKER FROM SLOTS ────────────────────────
  sellJoker(idx, G) {
    const p   = G.p;
    const jid = p.jokers[idx];
    if (!jid) return;
    const data = JOKERS[jid];
    if (!data) return;

    // Sell for 50% of base cost (min $10)
    const sellVal = Math.max(10, Math.floor((data.cost || 50) * 0.5));
    p.bankroll += sellVal;
    p.jokers.splice(idx, 1);
    SFX.buy();
    showToast(`💸 Sold ${data.n} for ${fmt(sellVal)}`, 'ti');
    Render.shop(G);
  },
  sellCard(idx, G) {
    const p   = G.p;
    const cid = p.hand[idx];
    if (!cid) return;
    const data = CARDS[cid];
    if (!data) return;

    // Sell for 40% of base cost (min $5)
    const sellVal = Math.max(5, Math.floor((data.cost || 20) * 0.4));
    p.bankroll += sellVal;
    p.hand.splice(idx, 1);
    SFX.buy();
    showToast(`💸 Sold ${data.n} for ${fmt(sellVal)}`, 'ti');
    Render.shop(G);
  },

  // ── PREVIEW ITEM ─────────────────────────────────
  preview(type, id) {
    const data = type === 'card' ? CARDS[id] : JOKERS[id];
    if (!data) return;
    const overlay = $('shop-preview');
    if (!overlay) return;

    const tag   = type === 'card' ? 'CARD' : 'JOKER';
    const tagCl = type === 'card' ? 'tag-card' : 'tag-joker';
    overlay.innerHTML = `
      <div class="sprv-box">
        <div class="sprv-tag ${tagCl}">${tag}</div>
        <div class="sprv-ico">${data.ico}</div>
        <div class="sprv-name">${data.n}</div>
        <div class="sprv-desc">${data.desc}</div>
        ${type === 'card' ? `<div class="sprv-fx">${data.fx}</div>` : ''}
        <div class="sprv-cost">${data.cost === 0 ? 'FREE' : fmt(data.cost)}</div>
        <button class="sprv-close btn-ghost" onclick="Shop.closePreview()">✕ CLOSE</button>
      </div>`;
    overlay.classList.add('open');
  },

  closePreview() {
    const overlay = $('shop-preview');
    if (overlay) overlay.classList.remove('open');
  },

  // ── REROLL SHOP ──────────────────────────────────
  reroll(G) {
    const p  = G.p;
    const rc = G._shop.rc + (p.rce || 0);
    if (p.bankroll < rc) { showToast(`Need ${fmt(rc)} to reroll!`, 'tl'); return; }

    p.bankroll  -= rc;
    G._shop.rc   = rc + 5;
    G._rrcount   = (G._rrcount || 0) + 1;
    SFX.click();

    const allCards  = shuffle(Object.keys(CARDS).filter(c => c !== 'free_parlay'));
    const allJokers = shuffle(Object.keys(JOKERS).filter(j => !p.jokers.includes(j)));

    const newCards  = [];
    const newJokers = [];

    for (let i = 0; i < 4; i++) {
      if (G._shop.sold.has('card_' + i)) {
        newCards.push(G._shop.cards[i]);
      } else {
        const next = allCards.find(c => !newCards.includes(c));
        newCards.push(next || allCards[rnd(0, allCards.length - 1)]);
      }
    }
    for (let i = 0; i < 3; i++) {
      if (G._shop.sold.has('joker_' + i)) {
        newJokers.push(G._shop.jokers[i]);
      } else {
        const next = allJokers.find(j => !newJokers.includes(j));
        newJokers.push(next || allJokers[rnd(0, allJokers.length - 1)]);
      }
    }

    G._shop.cards  = newCards;
    G._shop.jokers = newJokers;
    showToast(`🔄 Rerolled! (Next: ${fmt(G._shop.rc + (p.rce || 0))})`, 'ti');
    Render.shop(G);
  },
};
