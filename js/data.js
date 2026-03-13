// ══════════════════════════════════════════════════
//  DATA.JS — All static game data
// ══════════════════════════════════════════════════

const ARCHETYPES = {
  degenerate: {
    name: "THE DEGENERATE",
    icon: "🎰",
    bio: "High impulse, no strategy.\nLives for the thrill of the longshot.",
    bankroll: 100,
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
    bankroll: 220,
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
  { id: 'pigeon',   n: "Pigeon Race",         ico: "🐦",  desc: "City pigeons. Not rigged. Probably.", odds: 2.0, win: 52, risk: "LOW",  featuredEligible: true },
  { id: 'snail',    n: "Snail Derby",          ico: "🐌",  desc: "Underground circuit. Salt available.", odds: 5.0, win: 18, risk: "HIGH"    },
  { id: 'robot',    n: "Robot Boxing",         ico: "🤖",  desc: "Automated fists. Real stakes.",       odds: 1.5, win: 60, risk: "LOW",  featuredEligible: true },
  { id: 'cook',     n: "Cooking Contest",      ico: "👨‍🍳", desc: "Gordon vs. the underdog.",           odds: 3.0, win: 34, risk: "MED"     },
  { id: 'myst',     n: "Mystery Matchup",      ico: "❓",  desc: "Even we don't know. Sign here.",     odds: 0,   win: 0,  risk: "UNKNOWN"  },
  { id: 'eat',      n: "Competitive Eating",   ico: "🍔",  desc: "Hot dog champ. Ref is bribed.",      odds: 2.5, win: 41, risk: "MED"     },
  { id: 'chess',    n: "Underground Chess",    ico: "♟️",  desc: "Speed chess. Physical stakes.",      odds: 4.0, win: 24, risk: "HIGH",  featuredEligible: true },
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

// ── BROADCAST PHASES ─────────────────────────────
// Per-event commentary for each simulation phase.
// open: shown at event start (random pick)
// mid_w / mid_l: cycling during mid-phase (player winning / losing in momentum)
// close_w / close_l: final stretch commentary
const PHASES = {
  "🐦": {
    open:    ["GATES OPEN — the pigeons are AIRBORNE!", "City birds. Sky high stakes. Let's GO.", "Lane assignments confirmed. Your pick is in lane 2."],
    mid_w:   ["YOUR BIRD is pulling clear of the pack!", "Gap widening — the crowd ERUPTS!", "Incredible form. Clean air. Coming through FAST."],
    mid_l:   ["The pack is pulling away...", "Your pigeon stopped to eat something. MOVE IT!", "Losing ground in the back third. Not ideal."],
    close_w: ["FINAL STRETCH — YOUR BIRD IN FRONT — COME ON—",],
    close_l: ["Closing in on the finish. This isn't looking good.",],
  },
  "🐌": {
    open:    ["They're off. Technically.", "The snails have begun to accelerate. Slowly.", "Race officials confirm: movement has occurred."],
    mid_w:   ["YOUR SNAIL is... ahead? Actually ahead.", "Remarkable. Your snail hasn't stopped once.", "The competition is struggling. Your pick glides."],
    mid_l:   ["Your snail appears to be napping.", "Momentum reversed. Your snail took a left turn.", "Officials checking if your snail is still alive."],
    close_w: ["PHOTO FINISH TERRITORY — your snail inching forward—",],
    close_l: ["The end approaches. Your snail is not at it.",],
  },
  "🤖": {
    open:    ["BELL RINGS — circuits engaged — FIGHT!", "Robots enter the ring. Crowd goes silent.", "Power levels: maximum. Objective: destroy opponent."],
    mid_w:   ["YOUR BOT lands a BRUTAL haymaker — sparks flying!", "Opponent staggering — your robot is DOMINANT!", "Oil leak on opponent unit — critical damage!"],
    mid_l:   ["Your robot took a hit it did NOT recover from.", "Error 404: Dodge Not Found. On your unit.", "Your bot is in pieces. Metaphorically. Actually literally."],
    close_w: ["FINAL ROUND — YOUR ROBOT IS UP ON POINTS—",],
    close_l: ["The judges are tallying. You already know.",],
  },
  "👨‍🍳": {
    open:    ["Aprons on. Knives out. The clock is running.", "Gordon looks nervous. Your pick looks focused.", "Judges seated. Score cards ready. This is it."],
    mid_w:   ["PERFECT plating — judges are WEEPING with joy!", "The flavour profile. Immaculate. Unprecedented.", "A standing ovation from the prep station. Remarkable."],
    mid_l:   ["The soufflé has... deflated.", "Judges exchanging concerned looks. Not good.", "Burning smell detected from your station. Very not good."],
    close_w: ["FINAL JUDGING — the crowd holds its breath—",],
    close_l: ["The presentation round is not going in your favour.",],
  },
  "🍔": {
    open:    ["BUZZER SOUNDS — they're eating!", "45 hot dogs on the table. One minute on the clock.", "The crowd is chanting. The competitors are focused. This is sport."],
    mid_w:   ["YOUR CHAMP is at hot dog #38 — RECORD PACE!", "The competition can't keep up — gap is WIDENING!", "The crowd losing its mind. Absolutely clinical eating."],
    mid_l:   ["Your competitor just hit dog #41. Your pick is behind.", "Pace has fallen off. The mustard is not helping.", "Medical team on standby. For your champ. That's bad."],
    close_w: ["FINAL COUNTDOWN — YOUR PICK LEADING BY 6 DOGS—",],
    close_l: ["The clock is running out. The hot dogs are not helping.",],
  },
  "♟️": {
    open:    ["CLOCKS SET — speed chess commences — 0.4 seconds per move!", "Two grandmasters. One board. Infinite grudges.", "The pieces are set. The violence is implied."],
    mid_w:   ["YOUR PLAYER sacrifices a queen — GENIUS MOVE!", "The opponent is visibly panicking. Beautiful.", "Three moves from checkmate. You can feel it."],
    mid_l:   ["A critical blunder on move 7. Catastrophic.", "Your player stared at a pawn for 3 whole seconds. Costly.", "The board has turned. Irrevocably."],
    close_w: ["ENDGAME — your player has a decisive advantage—",],
    close_l: ["The position is lost. The player is debating flipping the board.",],
  },
  "🦗": {
    open:    ["Cyber-crickets calibrated. Track electrified. Go.", "AI-enhanced mandibles ready. Bionic legs: engaged.", "The starting grid of insects. This is completely normal."],
    mid_w:   ["YOUR CRICKET is clicking at MAXIMUM velocity!", "Bionic legs of #4 are operating perfectly — SURGE!", "Pulling away from the pack — the algorithm is working!"],
    mid_l:   ["Your cricket chewed through the sensor wire.", "The AI module appears to have recommended a nap.", "Falling behind the field. Firmware update needed."],
    close_w: ["FINAL CIRCUIT — your cricket is in the lead—",],
    close_l: ["The finish line is close. Your cricket is not.",],
  },
  "❓": {
    open:    ["Something has started happening.", "Officials confirm: the event is occurring.", "We have begun. What we have begun is unclear."],
    mid_w:   ["Based on nothing, you appear to be winning.", "Something has gone in your favour. Somehow.", "Your investment in the unknown is paying off. Maybe."],
    mid_l:   ["Things appear to be going against you. In some way.", "Momentum has shifted toward the other thing.", "You have no idea what's happening. Neither do we."],
    close_w: ["APPROACHING CONCLUSION — signals are positive—",],
    close_l: ["Whatever this was, it isn't going your way.",],
  },
  "😤": {
    open:    ["The dignity scales are calibrated. Stakes: self-worth.", "Judges assessing composure, poise, and social standing.", "Round 1 of 3. Your dignity enters the ring."],
    mid_w:   ["Composed. Unbothered. Your dignity is INTACT!", "The judges nod approvingly. Rare. Valuable.", "Someone in the crowd respects you. First time today."],
    mid_l:   ["A pigeon has landed on your shoulder. Judgementally.", "Your name was mispronounced. Three times. Intentionally.", "The crowd is... tittering. That's bad."],
    close_w: ["FINAL ASSESSMENT — your dignity holding strong—",],
    close_l: ["The judges look away. That's never a good sign.",],
  },
  "🏟️": {
    open:    ["Two snails. One arena. Infinite menace.", "The gladiator snails circle each other. Slowly. Ominously.", "The crowd woke up for this. Barely."],
    mid_w:   ["YOUR SNAIL produced a tiny shield — TACTICAL GENIUS!", "Shell-to-shell combat — your pick is DOMINATING!", "The crowd woke up. They're into this. Somehow."],
    mid_l:   ["Your snail retreated into its shell. Strategically cowardly.", "The opponent snail is on the offensive. Aggressively so.", "Slime trail analysis: you are losing."],
    close_w: ["FINAL CLASH — shells locked — your snail pushing forward—",],
    close_l: ["The gladiatorial outcome is becoming apparent.",],
  },
  "🦆": {
    open:    ["Ducks positioned. Pins standing. Bowl.", "The lane has been de-feathered. Mostly.", "The duck-bowling association welcomes you. Don't ask questions."],
    mid_w:   ["STRIKE! The ducks are INCENSED!", "Your bowler is ON FIRE — perfect form!", "Second frame: even better. The ducks stage a protest."],
    mid_l:   ["Gutter ball. The ducks are delighted.", "Your bowler slipped. On a duck. Somehow.", "A duck stole the ball. Officials are consulting the rulebook."],
    close_w: ["FINAL FRAME — leading the scorecard—",],
    close_l: ["The scorecard is not in your favour. The ducks are pleased.",],
  },
  "🐾": {
    open:    ["FERRETS RELEASED — they're MOVING!", "These ferrets have been caffeinated. All of them.", "Starting gun fired. The ferrets ignored it. Then ran anyway."],
    mid_w:   ["YOUR FERRET is UNCATCHABLE — maximum ferret velocity!", "Pulling away from the pack. No one can match this pace.", "The ferret found an optimal line. Incredibly."],
    mid_l:   ["Your ferret went the wrong way. Confidently.", "Ferret #3 is overtaking. Your pick is touring the stands.", "Someone's ferret escaped. It was yours."],
    close_w: ["FINAL METRES — your ferret is in the lead—",],
    close_l: ["The finish line. Your ferret hasn't seen it.",],
  },
  "🦙": {
    open:    ["The llama approaches the podium. Confidently.", "Round 1: PRESTIDIGITATION. The crowd gasps.", "The spelling bee begins. The llama looks ready."],
    mid_w:   ["CORRECT! The llama NAILED it! Judges stunned!", "Your llama spells ONOMATOPOEIA flawlessly. FLAWLESSLY.", "The audience is SILENT in awe. Your llama: focused."],
    mid_l:   ["The llama has been distracted by a shiny object.", "A misspelling. Contested. Also wrong.", "The judges are shaking their heads. The llama doesn't care."],
    close_w: ["CHAMPIONSHIP WORD — your llama steps forward—",],
    close_l: ["Final word incoming. The llama looks confused.",],
  },
  "🐟": {
    open:    ["The fish approach the starting platform. Defiantly.", "Judges in place. Physics: suspended briefly.", "Fish parkour. Officially a sport. Right now."],
    mid_w:   ["YOUR FISH is AIRBORNE — cleared a 4-metre barrier!", "Bioluminescent fins: ENGAGED — it's magnificent!", "The fish has no respect for gravity. Beautiful."],
    mid_l:   ["Your fish attempted a wall run. Immediately fell.", "Gravity reasserted itself. Onto your fish.", "The fish looked at the obstacle and chose not to."],
    close_w: ["FINAL OBSTACLE — your fish lines up the approach—",],
    close_l: ["The fish parkour course. Your fish: not completing it.",],
  },
  "🎡": {
    open:    ["The wheel is set in motion...", "Sectors mapped. Fate: randomised.", "The Wheel of Misfortune turns. As it does."],
    mid_w:   ["It's slowing... hovering near your sector!", "The pointer is wavering. Right where you need it.", "Coming to rest... right there... hold on..."],
    mid_l:   ["The pointer is drifting... away from where you need it.", "It's slowing in entirely the wrong sector.", "The wheel mocks you. Visibly."],
    close_w: ["ALMOST STOPPED — right on the edge of your sector—",],
    close_l: ["Final rotations. Not looking lucky.",],
  },
  "🐻": {
    open:    ["Trading floor opens. Bear vs Bull: the grudge match.", "Market forces squared up. Volatility: extreme.", "Analysts sweating. Positions entered. God help you."],
    mid_w:   ["YOUR POSITION is UP — the bears are RETREATING!", "Bull run confirmed — your call was right!", "Portfolio in the green. The crowd of analysts STUNNED."],
    mid_l:   ["The bear market is asserting dominance.", "Your position is down 40%. On paper. Soon in reality.", "Margin call incoming. The bear laughs."],
    close_w: ["MARKET CLOSE APPROACHING — you're in positive territory—",],
    close_l: ["Final bell approaching. The numbers are bad.",],
  },
  "🐝": {
    open:    ["Protective gear: optional. Courage: mandatory.", "The hive has been agitated. Intentionally.", "Sting count begins. The bees have strong opinions."],
    mid_w:   ["YOUR BEEKEEPER has 47 stings and is STILL GOING!", "The bees have chosen a side. Your side. Painfully.", "Remarkable pain tolerance. The crowd is horrified. In awe."],
    mid_l:   ["Your beekeeper retreated at sting 12. Amateur.", "The competitor absorbed 60 stings without blinking. Terrifying.", "Medical team mobilised. For your pick. Not great."],
    close_w: ["FINAL COUNT — your beekeeper still standing—",],
    close_l: ["The sting count is in. Your contestant: departed.",],
  },
  "🦀": {
    open:    ["The crabs are positioned sideways. As always.", "100-metre sideways sprint. Officially timed.", "The Crab Rave Race begins. The music is already going."],
    mid_w:   ["YOUR CRAB is going SIDEWAYS TO GLORY!", "The diagonal line is the optimal line — YOUR CRAB FOUND IT!", "Fastest sideways 40-metre ever recorded. Right now. Your crab."],
    mid_l:   ["Your crab went into the crowd. Sideways. Confidently.", "The competition is pulling away. Also sideways.", "Your crab stopped to rave. This is not that race."],
    close_w: ["FINAL METRES — your crab cutting a clean diagonal—",],
    close_l: ["The finish approaches. Your crab is raving somewhere.",],
  },
};
