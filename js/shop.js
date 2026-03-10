// ══════════════════════════════════════════════════
//  SHOP.JS — Shop generation, buy logic, rerolls
// ══════════════════════════════════════════════════

const Shop = {

  // ── GENERATE SHOP INVENTORY ──────────────────────
  generate(G) {
    const p = G.p;

    // All card IDs except ones already in hand × 2 (to avoid too many dupes)
    const allCards  = Object.keys(CARDS).filter(c => c !== 'free_parlay');
    const allJokers = Object.keys(JOKERS).filter(j => !p.jokers.includes(j));

    // Weighted selection: prefer cards the player doesn't already have
    const owned = new Set(p.hand);
    const cardPool = shuffle(allCards).sort((a, b) => {
      const aHas = owned.has(a) ? 1 : 0;
      const bHas = owned.has(b) ? 1 : 0;
      return aHas - bHas;
    });

    // Scale shop prices slightly up with level
    const priceScale = 1 + (p.lvl - 1) * 0.1;

    const cards = cardPool.slice(0, 4).map(id => {
      const c = { ...CARDS[id] };
      c.cost = Math.round(c.cost * priceScale);
      return id;
    });

    const jokers = shuffle(allJokers).slice(0, 3).map(id => {
      const j = { ...JOKERS[id] };
      j.cost = Math.round(j.cost * priceScale);
      return id;
    });

    G._shop = {
      cards,
      jokers,
      sold: new Set(),
      rc: 10,
      _priceScale: priceScale,
    };

    // Reset reroll count for this shop visit
    G._rrcount = 0;
  },

  // ── BUY ITEM ─────────────────────────────────────
  buy(type, id, idx, G) {
    const p  = G.p;
    const data = type === 'card' ? CARDS[id] : JOKERS[id];
    if (!data) return;

    const scaledCost = Math.round(data.cost * (G._shop._priceScale || 1));
    if (p.bankroll < scaledCost) {
      showToast("Not enough bankroll!", 'tl');
      return;
    }
    if (type === 'joker' && p.jokers.length >= 3) {
      showToast("Joker slots full! (Max 3)", 'tl');
      return;
    }

    p.bankroll -= scaledCost;
    G._shop.sold.add(type + '_' + idx);
    SFX.buy();

    if (type === 'card') {
      p.hand.push(id);
      showToast(`🃏 ${data.n} added to hand!`, 'ti');
    } else {
      p.jokers.push(id);
      // Trigger onEquip effects
      if (data.onEquip) data.onEquip(G);
      showToast(`♾️ ${data.n} equipped!`, 'ti');
    }

    Render.shop(G);
  },

  // ── REROLL SHOP ──────────────────────────────────
  reroll(G) {
    const p  = G.p;
    const rc = G._shop.rc + (p.rce || 0);

    if (p.bankroll < rc) {
      showToast(`Need ${fmt(rc)} to reroll!`, 'tl');
      return;
    }

    p.bankroll -= rc;
    // Reroll cost increases each time
    G._shop.rc = rc + 5;
    G._rrcount = (G._rrcount || 0) + 1;
    SFX.click();

    // Regenerate unsold sections
    const allCards  = shuffle(Object.keys(CARDS).filter(c => c !== 'free_parlay'));
    const allJokers = shuffle(Object.keys(JOKERS).filter(j => !p.jokers.includes(j)));

    // Keep sold items, replace unsold
    const newCards  = [];
    const newJokers = [];

    for (let i = 0; i < 4; i++) {
      if (G._shop.sold.has('card_' + i)) {
        newCards.push(G._shop.cards[i]);
      } else {
        const next = allCards.find(c => !newCards.includes(c) && !G._shop.sold.has(c));
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

    showToast(`🔄 Shop rerolled! (Cost: ${fmt(G._shop.rc + (p.rce || 0))} next)`, 'ti');
    Render.shop(G);
  },
};
