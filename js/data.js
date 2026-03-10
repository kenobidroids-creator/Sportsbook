// ══════════════════════════════════════════════════
//  DATA.JS — All static game data
// ══════════════════════════════════════════════════

const ARCHETYPES = {
  degenerate: {
    name: "THE DEGENERATE",
    icon: "🎰",
    bio: "High impulse, no strategy.\nLives for the thrill of the longshot.",
    bankroll: 75,
    luck: 1,
    cred: 100,
    cards: ['free_parlay', 'double_down'],
    jokers: [],
    perk: "Free Parlay",
    perkDesc: "Starts each level with a free Parlay Slip. Always a longshot.",
    stats: { LUCK: 1, BANKROLL: 2, IMPULSE: 10, STRAT: 1 },
    statColors: { LUCK: '#c044ff', BANKROLL: '#ffc400', IMPULSE: '#ff2d78', STRAT: '#00e5ff' }
  },
  mathwhiz: {
    name: "THE MATH WHIZ",
    icon: "🧮",
    bio: "Calculated, cold. Never bets without\nknowing the expected value.",
    bankroll: 300,
    luck: 4,
    cred: 200,
    cards: ['inside_info', 'sure_thing'],
    jokers: ['the_tipster'],
    perk: "Odds Calculator",
    perkDesc: "Reveals true win % on all bets.\n+5% win chance on LOW & MED risk bets.",
    stats: { LUCK: 4, BANKROLL: 8, IMPULSE: 2, STRAT: 9 },
    statColors: { LUCK: '#c044ff', BANKROLL: '#ffc400', IMPULSE: '#ff2d78', STRAT: '#00e5ff' }
  },
  luckyidiot: {
    name: "THE LUCKY IDIOT",
    icon: "🤞",
    bio: "No knowledge. No strategy.\nJust pure, undeserved luck.",
    bankroll: 100,
    luck: 10,
    cred: 150,
    cards: ['lucky_charm', 'pocket_sand'],
    jokers: ['lucky_socks'],
    perk: "Beginner's Luck",
    perkDesc: "Wins pay x1.5–x3.0 random multiplier.\nIgnorance is truly bliss.",
    stats: { LUCK: 10, BANKROLL: 3, IMPULSE: 6, STRAT: 1 },
    statColors: { LUCK: '#c044ff', BANKROLL: '#ffc400', IMPULSE: '#ff2d78', STRAT: '#00e5ff' }
  }
};

// ── BETS ─────────────────────────────────────────
const BETS = [
  { id: 'pigeon',   n: "Pigeon Race",         ico: "🐦",  desc: "City pigeons. Not rigged. Probably.", odds: 2.0, win: 52, risk: "LOW"     },
  { id: 'snail',    n: "Snail Derby",          ico: "🐌",  desc: "Underground circuit. Salt available.", odds: 5.0, win: 18, risk: "HIGH"    },
  { id: 'robot',    n: "Robot Boxing",         ico: "🤖",  desc: "Automated fists. Real stakes.",       odds: 1.5, win: 60, risk: "LOW"     },
  { id: 'cook',     n: "Cooking Contest",      ico: "👨‍🍳", desc: "Gordon vs. the underdog.",           odds: 3.0, win: 34, risk: "MED"     },
  { id: 'myst',     n: "Mystery Matchup",      ico: "❓",  desc: "Even we don't know. Sign here.",     odds: 0,   win: 0,  risk: "UNKNOWN"  },
  { id: 'eat',      n: "Competitive Eating",   ico: "🍔",  desc: "Hot dog champ. Ref is bribed.",      odds: 2.5, win: 41, risk: "MED"     },
  { id: 'chess',    n: "Underground Chess",    ico: "♟️",  desc: "Speed chess. Physical stakes.",      odds: 4.0, win: 24, risk: "HIGH"    },
  { id: 'crick',    n: "Cyber Cricket",        ico: "🦗",  desc: "AI-enhanced insect athletics.",      odds: 3.5, win: 28, risk: "MED"     },
  { id: 'dign',     n: "Wager Your Dignity",   ico: "😤",  desc: "You don't need it. Risk: self-worth.", odds: 1.2, win: 66, risk: "DIGNITY" },
  { id: 'glad',     n: "Gladiator Snails",     ico: "🏟️", desc: "Rome wasn't built in a day.",        odds: 8.0, win: 11, risk: "EXTREME" },
  { id: 'duck',     n: "Duck Bowling",         ico: "🦆",  desc: "Exactly what it sounds like.",       odds: 2.8, win: 36, risk: "MED"     },
  { id: 'ferret',   n: "Ferret Racing",        ico: "🐾",  desc: "Fast, unpredictable, caffeinated.",  odds: 3.2, win: 30, risk: "MED"     },
  { id: 'llama',    n: "Llama Spelling Bee",   ico: "🦙",  desc: "That llama knows 'prestidigitation'.", odds: 6.0, win: 15, risk: "HIGH"   },
  { id: 'fish',     n: "Fish Parkour",         ico: "🐟",  desc: "Gravity-defying marine athletics.",  odds: 4.5, win: 21, risk: "HIGH"    },
  { id: 'wheel',    n: "Wheel of Misfortune",  ico: "🎡",  desc: "Spin. Nobody knows what lands.",     odds: 0,   win: 0,  risk: "UNKNOWN"  },
  { id: 'bear',     n: "Bear Market Fight",    ico: "🐻",  desc: "Finance. Physical. Don't ask.",      odds: 3.8, win: 26, risk: "HIGH"    },
  { id: 'bees',     n: "Competitive Beekeeping",ico:"🐝",  desc: "Most stings wins. Technically.",    odds: 5.5, win: 17, risk: "EXTREME" },
  { id: 'crab',     n: "Crab Rave Race",       ico: "🦀",  desc: "Sideways athletics. Oddly tense.",   odds: 2.2, win: 44, risk: "LOW"     },
];

// ── CARDS (Active — played from hand) ──────────────
const CARDS = {
  double_down: {
    n: "Double Down", ico: "⚡",
    fx: "2× wager before reveal",
    desc: "Doubles your current wager.",
    cost: 35,
    apply(G) {
      G.p.wager = Math.min(G.p.wager * 2, G.p.bankroll);
      return "Wager doubled!";
    }
  },
  bluff: {
    n: "Bluff", ico: "🎭",
    fx: "+25% win chance",
    desc: "+25% win probability this round.",
    cost: 40,
    apply(G) {
      G.p.wcb = (G.p.wcb || 0) + 25;
      return "+25% win chance applied!";
    }
  },
  pocket_sand: {
    n: "Pocket Sand", ico: "✋",
    fx: "Loss → Push (wager back)",
    desc: "Converts a loss into a push. Wager returned.",
    cost: 30,
    apply(G) {
      G.p.psa = true;
      return "Pocket Sand armed! Loss → Push.";
    }
  },
  lucky_charm: {
    n: "Lucky Charm", ico: "🍀",
    fx: "+1 Luck (permanent)",
    desc: "Permanently +1 Luck stat.",
    cost: 50,
    apply(G) {
      G.p.luck = Math.min(G.p.luck + 1, 10);
      return "+1 Luck — permanently!";
    }
  },
  cash_out: {
    n: "Cash Out", ico: "💵",
    fx: "Grab 40% profit pre-reveal",
    desc: "Collect 40% of potential profit early regardless of result.",
    cost: 25,
    apply(G) {
      G.p.coa = true;
      return "Cashing out 40% pre-reveal!";
    }
  },
  inside_info: {
    n: "Inside Info", ico: "🕵️",
    fx: "Reveal true win odds",
    desc: "Shows real win probability for selected bet.",
    cost: 20,
    apply(G) {
      G.p.iia = true;
      const ch = calcChance(G);
      return `Intel acquired! True odds: ${ch}%`;
    }
  },
  sure_thing: {
    n: "Sure Thing", ico: "✅",
    fx: "+20% win, −0.5 odds",
    desc: "−0.5 payout odds but +20% win chance.",
    cost: 30,
    apply(G) {
      if (G.p.bet) G.p.bet.odds = Math.max(G.p.bet.odds - 0.5, 1.1);
      G.p.wcb = (G.p.wcb || 0) + 20;
      return "Bet secured, odds trimmed.";
    }
  },
  parlay_slip: {
    n: "Parlay Slip", ico: "📋",
    fx: "×1.5 payout multiplier",
    desc: "Multiplies winnings by 1.5×.",
    cost: 45,
    apply(G) {
      G.p.pm = (G.p.pm || 1) * 1.5;
      return "Parlay locked in! ×1.5 payout.";
    }
  },
  free_parlay: {
    n: "Free Parlay", ico: "🎫",
    fx: "×1.5 payout (free card!)",
    desc: "Free parlay slip from the Degenerate perk.",
    cost: 0,
    apply(G) {
      G.p.pm = (G.p.pm || 1) * 1.5;
      return "Free Parlay! ×1.5 payout!";
    }
  },
  the_hedge: {
    n: "The Hedge", ico: "🌿",
    fx: "Lose only 50% of wager on loss",
    desc: "Cuts your losses in half.",
    cost: 55,
    apply(G) {
      G.p.hedge = true;
      return "Hedged! Max loss is 50%.";
    }
  },
  big_brain: {
    n: "Big Brain", ico: "🧠",
    fx: "+15% win on HIGH+ bets",
    desc: "+15% win chance on HIGH or EXTREME bets only.",
    cost: 38,
    apply(G) {
      if (G.p.bet && (G.p.bet.risk === 'HIGH' || G.p.bet.risk === 'EXTREME')) {
        G.p.wcb = (G.p.wcb || 0) + 15;
        return "+15% on HIGH/EXTREME bet!";
      }
      return "No HIGH bet selected — card wasted!";
    }
  },
  bribe: {
    n: "Bribe", ico: "💴",
    fx: "−$20, +30% win chance",
    desc: "Pay $20 to buy 30% extra win chance.",
    cost: 0,
    apply(G) {
      if (G.p.bankroll < 20) return "Can't afford the bribe!";
      G.p.bankroll -= 20;
      G.p.wcb = (G.p.wcb || 0) + 30;
      return "Bribed the official! +30% win.";
    }
  },
};

// ── JOKERS (Passive — equipped, max 3) ─────────────
const JOKERS = {
  the_tipster: {
    n: "The Tipster", ico: "🎩",
    desc: "+5% win chance on every bet.",
    cost: 100,
    tick(G) { G.p.wcb = (G.p.wcb || 0) + 5; }
  },
  loan_shark: {
    n: "Loan Shark Pal", ico: "🦈",
    desc: "Interest pays 2× when bankroll ≥ $200.",
    cost: 120,
    isPassive: true
  },
  the_fixer: {
    n: "The Fixer", ico: "🔧",
    desc: "Once per level: auto Pocket Sand on a loss.",
    cost: 150,
    tick() {}
  },
  lucky_socks: {
    n: "Lucky Socks", ico: "🧦",
    desc: "+2 Luck on equip.",
    cost: 110,
    onEquip(G) { G.p.luck = Math.min(G.p.luck + 2, 10); }
  },
  hot_streak: {
    n: "Hot Streak", ico: "🔥",
    desc: "+0.5× payout per consecutive win.",
    cost: 130,
    tick(G) { if (G.p.wins > 0) G.p.pm = (G.p.pm || 1) + G.p.wins * 0.5; }
  },
  bookies_grudge: {
    n: "Bookie's Grudge", ico: "📖",
    desc: "Longshots (4×+ odds) pay double.",
    cost: 160,
    isPassive: true
  },
  brass_knuckles: {
    n: "Brass Knuckles", ico: "🥊",
    desc: "+10% win chance. +20 Heat.",
    cost: 90,
    tick(G) {
      G.p.wcb = (G.p.wcb || 0) + 10;
      G.p.heat = clamp(G.p.heat + 20, 0, 100);
    }
  },
  loaded_dice: {
    n: "Loaded Dice", ico: "🎲",
    desc: "All bet odds +0.3×.",
    cost: 140,
    isPassive: true
  },
  sunglasses: {
    n: "Deal Shades", ico: "🕶️",
    desc: "Heat gains halved.",
    cost: 80,
    isPassive: true
  },
  inside_man: {
    n: "Inside Man", ico: "🤝",
    desc: "First bet of each level always reveals true odds.",
    cost: 115,
    isPassive: true
  },
};

// ── GOONS ────────────────────────────────────────
const GOONS = [
  {
    n: "TINY", ico: "💪",
    dlg: '"You got something nice in that hand, pal. HAD."',
    con: "⚠ Takes your best card from hand.",
    apply(G) {
      if (G.p.hand.length) {
        const r = G.p.hand.shift();
        G.showToast(`Tiny took your ${CARDS[r]?.n || r}!`, 'tl');
      }
    }
  },
  {
    n: "THE REPO-WIZARD", ico: "🧙",
    dlg: '"Interesting joker selection you had there. HAD."',
    con: "⚠ Removes one random joker.",
    apply(G) {
      if (G.p.jokers.length) {
        const i = rnd(0, G.p.jokers.length - 1);
        const r = G.p.jokers.splice(i, 1)[0];
        G.showToast(`Repo-Wizard took the ${JOKERS[r]?.n || r}!`, 'tl');
      } else {
        G.showToast("No jokers to take. He sighs.", 'ti');
      }
    }
  },
  {
    n: "KNUCKLES", ico: "🦴",
    dlg: '"Consider this a 20% administrative fee on your poor choices."',
    con: "⚠ Lose 20% of bankroll (minimum $15).",
    apply(G) {
      const l = Math.max(Math.floor(G.p.bankroll * 0.2), 15);
      G.p.bankroll = Math.max(G.p.bankroll - l, 0);
      G.showToast(`Knuckles took ${fmt(l)}!`, 'tl');
    }
  },
  {
    n: "THE ACCOUNTANT", ico: "🧾",
    dlg: '"I filed some... corrections. On your credit. Permanently."',
    con: "⚠ Shop rerolls cost +$10 for the rest of the run.",
    apply(G) {
      G.p.rce = (G.p.rce || 0) + 10;
      G.showToast("Bad credit filed. Rerolls now cost more.", 'tl');
    }
  },
  {
    n: "CLOWN SHOES McGEE", ico: "🤡",
    dlg: '"You\'re a funny guy. A REAL funny guy."',
    con: "⚠ Heat +30. Your next win chance is −15%.",
    apply(G) {
      G.p.heat = clamp(G.p.heat + 30, 0, 100);
      G.p.debuff = (G.p.debuff || 0) + 15;
      G.showToast("Heat +30 and cursed with Clown Shoes!", 'tl');
    }
  },
];

// ── BOSSES ───────────────────────────────────────
const BOSSES = [
  {
    lvl: 5,
    n: "BOOKIE JUNIOR",
    ico: "👺",
    hp: 60, mhp: 60,
    rds: 4,
    bossOdds: 2.5,
    reward: { cash: 200, card: 'bluff', joker: null },
    bets: [
      { q: "Will Bookie Jr. sneeze in the next 30 seconds?",  Y: { l: "YES  (+250%)", o: 2.5 }, N: { l: "NO  (−400%)", o: 4.0 } },
      { q: "Is Bookie Jr. going to cry when you win?",        Y: { l: "DEFINITELY  (+200%)", o: 2.0 }, N: { l: "DOUBT IT  (−300%)", o: 3.0 } },
      { q: "Is Bookie Jr. lying to your face right now?",     Y: { l: "100%  (+180%)", o: 1.8 }, N: { l: "Maybe not  (−220%)", o: 2.2 } },
      { q: "Will Bookie Jr. actually honour the bet?",        Y: { l: "TRUST HIM  (+500%)", o: 5.0 }, N: { l: "NOPE  (−150%)", o: 1.5 } },
    ]
  },
  {
    lvl: 10,
    n: "THE BIG BOOKIE",
    ico: "👹",
    hp: 100, mhp: 100,
    rds: 5,
    bossOdds: 3.0,
    reward: { cash: 600, card: null, joker: 'loaded_dice' },
    bets: [
      { q: "Can you actually beat the house?",                Y: { l: "BET ON IT  (+300%)", o: 3.0 }, N: { l: "SURRENDER  (−500%)", o: 5.0 } },
      { q: "Will the Big Bookie sweat when you win?",         Y: { l: "DEFINITELY  (+200%)", o: 2.0 }, N: { l: "NEVER  (−300%)", o: 3.0 } },
      { q: "Is the entire sportsbook system rigged?",         Y: { l: "100%  (+150%)", o: 1.5 }, N: { l: "Trust me  (−250%)", o: 2.5 } },
      { q: "Will you walk out of here richer than you came?", Y: { l: "BET ON IT  (+400%)", o: 4.0 }, N: { l: "DOUBT IT  (−600%)", o: 6.0 } },
      { q: "Does the Big Bookie fear you?",                   Y: { l: "CLEARLY  (+350%)", o: 3.5 }, N: { l: "LAUGHABLE  (−450%)", o: 4.5 } },
    ]
  },
];

// Antes per level (0 = boss level — no ante needed)
const ANTES = [0, 100, 175, 280, 420, 0, 630, 920, 1300, 1900, 0];

// ── SIM COMMENTARY ───────────────────────────────
const COMMENTS = {
  "🐦": ["Feathers everywhere — your pick is surging!", "One pigeon veered into a hotdog cart!", "The lead pigeon is pecking the competition!", "INCREDIBLE burst of speed from lane 3!"],
  "🐌": ["The snails are... moving. Slowly.", "Official race time: 3–7 business days.", "Your snail appears to be napping.", "A snail has mysteriously accelerated."],
  "🤖": ["CLANG! Robot 7 lands a haymaker!", "Error 404: Dodge Not Found.", "Oil leak detected — CRITICAL!", "The crowd chants OVERCLOCK! OVERCLOCK!"],
  "👨‍🍳": ["The soufflé is either genius or a crime.", "Gordon was seen crying. Unclear why.", "Secret ingredient: love? Suspicious.", "Judges conferring. Stakes are dangerously high."],
  "🍔": ["Contestant 3 is on hot dog #47!", "Performance enhancers strongly suspected.", "The hot dog run speeds UP!", "RECORD PACE! The crowd is losing its mind!"],
  "♟️": ["BRUTAL SPEED CHESS — 0.3 seconds per move!", "A piece was thrown at the spectators!", "Board flipped. Someone is losing badly.", "Checkmate threatened! Unbearable tension!"],
  "🦗": ["The cyber-crickets have left the track.", "One is chewing the finish-line wires.", "Bionic mandibles of #4: terrifying.", "AI-enhanced cricket detected at 40mph."],
  "❓": ["Nobody knows what is happening.", "Even the officials look confused.", "Something exploded. Intentional? Unclear.", "You have absolutely no idea what you bet on."],
  "😤": ["Your dignity hangs in the balance.", "Someone in the crowd recognises you.", "A pigeon judged you. You felt it.", "The announcer mispronounced your name."],
  "🏟️": ["The snails circle each other menacingly.", "One snail produced a tiny shield.", "The crowd is asleep. The snails do not care.", "This is taking an unseemly amount of time."],
  "🦆": ["DUCK BOWL! DUCK BOWL! DUCK BOWL!", "A duck has gone completely rogue.", "Strike! The remaining ducks are FURIOUS.", "The referee is a duck. Nobody is objecting."],
  "🐾": ["The ferrets are moving too fast to track!", "Ferret #2 stole the trophy preemptively.", "Someone fed the ferrets espresso. Classic.", "They're ALL going the wrong way!"],
  "🦙": ["The llama spelled PRESTIDIGITATION.", "The llama is staring down the judges.", "An alpaca caught impersonating a contestant.", "The llama won't stop spelling. It's unstoppable."],
  "🐟": ["THE FISH IS AIRBORNE!", "A goldfish cleared a 4-metre wall.", "Bioluminescent fins: engaged!", "The fish has no concept of physics and uses that."],
  "🎡": ["The wheel is spinning...", "It's going... and going...", "A number appears... or did it?", "The wheel knows something you don't."],
  "🐻": ["Bear market analysts are sweating.", "Hedge fund manager eliminated in round 2.", "Volatility! Everything is on fire!", "The bear just shorted its opponent."],
  "🐝": ["Contestant #3 has 47 stings and counting.", "The bees appear to have chosen a side.", "Officials attempt to call a timeout. Bees disagree.", "The beekeeper crowd goes absolutely wild."],
  "🦀": ["SIDEWAYS ATHLETICISM! Unprecedented!", "Crab #7 going diagonally to glory!", "The other crabs are rave-dancing?", "Fastest sideways 40-yard dash ever recorded."],
};
