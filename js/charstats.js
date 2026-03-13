// ══════════════════════════════════════════════════
//  CHARSTATS.JS — Character stats modal (HUD tap)
//  Opens from the Luck pill or Heat bar in HUD.
//  Works on desktop (click) and mobile (touch).
// ══════════════════════════════════════════════════

const CharStats = {

  open() {
    if (!G.p) return;
    this.render();
    $('cstats-overlay').classList.add('open');
    SFX.click();
  },

  close() {
    $('cstats-overlay').classList.remove('open');
  },

  render() {
    const p    = G.p;
    const arch = ARCHETYPES[p.arch];

    // ── Header ───────────────────────────────────
    $('cs-arch-ico').textContent  = arch.icon;
    $('cs-arch-name').textContent = arch.name;
    $('cs-arch-perk').textContent = `⭐ ${arch.perk}`;

    // Portrait strip
    const strip = $('cs-portrait-strip');
    if (strip) {
      const portraitSrc = (typeof Render !== 'undefined' && Render._portraits)
        ? Render._portraits[p.arch] : null;
      if (portraitSrc) {
        strip.src = portraitSrc;
        strip.alt = arch.name;
        strip.style.display = 'block';
      } else {
        strip.style.display = 'none';
      }
    }

    // ── Body ─────────────────────────────────────
    const ante     = ANTES[p.lvl] || 0;
    const anteGap  = ante > 0 ? ante - p.bankroll : 0;
    const anteMet  = anteGap <= 0;

    // Luck math: baseline is 50% for typical bets; each luck point = +0.75%
    const luckBonus  = Math.round(p.luck * 0.75);
    const luckPct    = (p.luck / 10) * 100;

    // Heat thresholds
    const heatColor  = p.heat >= 70 ? '#ff1744'
                     : p.heat >= 45 ? '#ff6d00'
                     : p.heat >= 25 ? '#ffc400'
                     : '#00e676';
    const heatPct    = Math.min(p.heat, 100);
    const heatStatus = p.heat >= 70 ? '⚠ DANGER — goon risk active'
                     : p.heat >= 60 ? '⚠ HIGH — goon risk active'
                     : p.heat >= 45 ? '↑ ELEVATED — approaching danger'
                     : p.heat >= 25 ? '~ WARM — manageable'
                     : '✓ COOL — safe';

    // Win streak bonus (Hot Streak joker)
    const hasHotStreak = p.jokers.includes('hot_streak');
    const streakBonus  = hasHotStreak && p.wins > 0
      ? `+${(p.wins * 0.5).toFixed(1)}× payout (${p.wins} win streak)`
      : null;

    // Total win rate this run
    const totalBets = p.bw + p.bl;
    const winRate   = totalBets > 0 ? Math.round(p.bw / totalBets * 100) : '—';

    // Joker list
    const jokerHTML = p.jokers.length
      ? p.jokers.map(jk => {
          const jd = JOKERS[jk];
          if (!jd) return '';
          return `<div class="cs-joker">
            <div class="cs-joker-ico">${jd.ico}</div>
            <div class="cs-joker-info">
              <div class="cs-joker-name">${jd.n}</div>
              <div class="cs-joker-desc">${jd.desc}</div>
            </div>
          </div>`;
        }).join('')
      : '<div class="cs-joker-empty">No jokers equipped yet — buy them at the shop.</div>';

    // Ante status
    const anteHTML = ante > 0
      ? `<div class="cs-ante">
          <span>LEVEL ${p.lvl} TARGET</span>
          <span style="color:var(--gold)">${fmt(ante)}</span>
          <span>${anteMet
            ? `<span style="color:var(--green)">✓ MET (+${fmt(-anteGap)})</span>`
            : `<span style="color:var(--red)">NEED ${fmt(anteGap)} MORE</span>`
          }</span>
         </div>`
      : `<div class="cs-ante"><span>BOSS FIGHT LEVEL</span><span style="color:var(--pink)">No ante — survive the boss</span></div>`;

    $('cs-body').innerHTML = `

      <!-- ANTE -->
      <div>
        <div class="csect-hdr">🎯 CURRENT TARGET</div>
        ${anteHTML}
      </div>

      <!-- LUCK -->
      <div>
        <div class="csect-hdr">🍀 LUCK  (${p.luck}/10)</div>
        <div class="cs-luck-row">
          <div class="cs-luck-big">${p.luck}</div>
          <div class="cs-luck-detail">
            <div class="cs-luck-bonus">+${luckBonus}% win chance on every bet</div>
            <div class="cs-luck-bar">
              <div class="cs-luck-fill" style="width:${luckPct}%"></div>
            </div>
            <div class="cs-luck-desc">
              Each Luck point adds ~0.75% to your win chance before cards or jokers.<br>
              Increase via: <strong style="color:var(--cyan)">Lucky Charm card · Lucky Socks joker</strong>
              ${p.arch === 'luckyidiot' ? '<br><strong style="color:var(--purple)">Lucky Idiot: wins pay ×1.5–×3.0 randomly</strong>' : ''}
            </div>
          </div>
        </div>
        ${streakBonus ? `<div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--gold);margin-top:6px">🔥 Hot Streak: ${streakBonus}</div>` : ''}
      </div>

      <!-- HEAT -->
      <div>
        <div class="csect-hdr">🌡️ HEAT  (${p.heat}/100)</div>
        <div class="cs-heat-big-bar">
          <div class="cs-heat-fill" style="width:${heatPct}%;background-color:${heatColor}"></div>
        </div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:${heatColor};margin-top:5px">${heatStatus}</div>
        <div class="cs-heat-info">
          <div class="cs-heat-zone ${p.heat >= 25 && p.heat < 60 ? 'active' : ''}">
            <div class="cs-heat-zone-lbl">PER LOSS</div>
            <div class="cs-heat-zone-val">+10 Heat</div>
          </div>
          <div class="cs-heat-zone ${p.heat >= 25 && p.heat < 60 ? 'active' : ''}">
            <div class="cs-heat-zone-lbl">PER WIN</div>
            <div class="cs-heat-zone-val">−5 Heat</div>
          </div>
          <div class="cs-heat-zone ${p.heat >= 60 ? 'danger' : ''}">
            <div class="cs-heat-zone-lbl">GOON RISK AT</div>
            <div class="cs-heat-zone-val" style="color:var(--red)">70+ Heat (55% chance)</div>
          </div>
          <div class="cs-heat-zone">
            <div class="cs-heat-zone-lbl">GOON VISIT</div>
            <div class="cs-heat-zone-val">−20 Heat</div>
          </div>
        </div>
        ${p.jokers.includes('deal_shades')
          ? `<div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--cyan);margin-top:6px">🕶️ Deal Shades: heat gains halved</div>`
          : ''}
        ${p.jokers.includes('brass_knuckles')
          ? `<div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--orange);margin-top:4px">🥊 Brass Knuckles: +20 Heat per loss (but +10% win)</div>`
          : ''}
      </div>

      <!-- JOKERS -->
      <div>
        <div class="csect-hdr">♾️ JOKERS  (${p.jokers.length}/3 slots)</div>
        <div class="cs-joker-list">${jokerHTML}</div>
      </div>

      <!-- RUN TOTALS -->
      <div>
        <div class="csect-hdr">📊 THIS RUN</div>
        <div class="cs-totals">
          <div class="cs-total">
            <div class="cs-total-v" style="color:var(--green)">+${fmt(p.tw)}</div>
            <div class="cs-total-l">TOTAL WON</div>
          </div>
          <div class="cs-total">
            <div class="cs-total-v" style="color:var(--red)">−${fmt(p.tl)}</div>
            <div class="cs-total-l">TOTAL LOST</div>
          </div>
          <div class="cs-total">
            <div class="cs-total-v" style="color:var(--cyan)">${winRate}%</div>
            <div class="cs-total-l">WIN RATE</div>
          </div>
          <div class="cs-total">
            <div class="cs-total-v">${p.bw}</div>
            <div class="cs-total-l">BETS WON</div>
          </div>
          <div class="cs-total">
            <div class="cs-total-v">${p.bl}</div>
            <div class="cs-total-l">BETS LOST</div>
          </div>
          <div class="cs-total">
            <div class="cs-total-v" style="color:${p.wins >= 2 ? 'var(--gold)' : 'var(--dim)'}">${p.wins}</div>
            <div class="cs-total-l">WIN STREAK</div>
          </div>
        </div>
      </div>`;
  },
};

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') CharStats.close();
});
