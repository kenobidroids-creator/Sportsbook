// ══════════════════════════════════════════════════
//  TV.JS — CRT pixel-art TV renderer
//  Draws pixel-art scenes on a 160×120 canvas.
//  Called each rAF frame from broadcast.js
// ══════════════════════════════════════════════════

const TV = {

  _canvas:   null,
  _ctx:      null,
  _W:        160,
  _H:        120,
  _scene:    null,   // current scene type
  _event:    null,   // event data { ico, n, risk }
  _state:    'running', // 'running' | 'result'
  _won:      false,
  _resultTs: 0,
  _frame:    0,      // integer frame counter for sprite animation
  _lastFrameTs: 0,

  // ── PALETTE ─────────────────────────────────────
  C: {
    bg:       '#040810',
    bgLight:  '#0a1428',
    floor:    '#0d1f3c',
    wall:     '#091428',
    track:    '#0a1e10',
    trackAlt: '#0b2412',
    ring:     '#1a0a28',
    ringRope: '#c044ff',
    sky:      '#040c20',
    crowd:    '#1a0a28',
    // characters
    pYou:     '#00e5ff',  // player's pick — cyan
    pField:   '#ff2d78',  // the field — pink
    pNeutral: '#ffc400',  // neutral / judge / ball
    // ui
    green:    '#00e676',
    red:      '#ff1744',
    gold:     '#ffc400',
    dim:      '#1e3050',
    white:    '#e0f0ff',
    black:    '#000408',
  },

  // ── INIT ────────────────────────────────────────
  init(canvas) {
    this._canvas = canvas;
    this._ctx    = canvas.getContext('2d');
    this._ctx.imageSmoothingEnabled = false;
    canvas.width  = this._W;
    canvas.height = this._H;
    this._ctx.clearRect(0, 0, this._W, this._H);
  },

  // ── SET SCENE ────────────────────────────────────
  setScene(type, eventData) {
    this._scene = type;
    this._event = eventData;
    this._state = 'running';
    this._frame = 0;
    this._lastFrameTs = 0;
    this._ctx.clearRect(0, 0, this._W, this._H);
  },

  // ── TICK — called every rAF frame ────────────────
  tick(momentum, progress, ts) {
    if (!this._ctx) return;

    // Advance frame counter at ~8fps for sprite animation
    if (ts - this._lastFrameTs > 125) {
      this._frame++;
      this._lastFrameTs = ts;
    }

    if (this._state === 'result') {
      this._drawResult();
      return;
    }

    const d = momentum; // smoothed momentum from broadcast
    switch (this._scene) {
      case 'race':    this._drawRace(d, progress);    break;
      case 'fight':   this._drawFight(d, progress);   break;
      case 'contest': this._drawContest(d, progress); break;
      case 'spin':    this._drawSpin(d, progress);    break;
      case 'market':  this._drawMarket(d, progress);  break;
      case 'dignity': this._drawDignity(d, progress); break;
      default:        this._drawMystery(d, progress); break;
    }

    this._drawCRT();
  },

  // ── SHOW RESULT ──────────────────────────────────
  showResult(won) {
    this._won      = won;
    this._state    = 'result';
    this._resultTs = this._frame;
  },

  // ═══════════════════════════════════════════════
  //  SCENE RENDERERS
  // ═══════════════════════════════════════════════

  // ── RACE ────────────────────────────────────────
  _drawRace(mom, prog) {
    const C = this.C, W = this._W, H = this._H, f = this._frame;
    const ctx = this._ctx;

    // Sky + ground
    ctx.fillStyle = C.sky;    ctx.fillRect(0, 0, W, H * 0.45);
    ctx.fillStyle = C.track;  ctx.fillRect(0, H * 0.45, W, H * 0.55);

    // Scrolling lane lines
    ctx.fillStyle = C.trackAlt;
    for (let i = 0; i < 4; i++) {
      const y = H * 0.5 + i * 14;
      ctx.fillRect(0, y, W, 2);
    }

    // Scrolling background hills (parallax)
    ctx.fillStyle = C.bgLight;
    for (let i = 0; i < 5; i++) {
      const x = ((i * 40 - (f * 1) % 40)) % W;
      this._drawHill(ctx, x, H * 0.3, 30, 14, C.bgLight);
    }

    // Finish flag (right side)
    ctx.fillStyle = C.white;
    ctx.fillRect(W - 8, H * 0.42, 2, 20);
    // Checkerboard flag
    for (let fx = 0; fx < 2; fx++)
      for (let fy = 0; fy < 2; fy++)
        if ((fx+fy) % 2 === 0) {
          ctx.fillStyle = C.white;
          ctx.fillRect(W - 6 + fx * 3, H * 0.42 + fy * 3, 3, 3);
        }

    // YOUR PICK position — top lane
    const px = 10 + (mom / 100) * (W - 40);
    // FIELD position — bottom lane
    const fx2 = 10 + ((100 - mom) / 100) * (W - 40);

    // Lane labels
    ctx.fillStyle = C.dim;
    ctx.fillRect(0, H * 0.47, 9, 7);
    ctx.fillRect(0, H * 0.62, 9, 7);
    ctx.fillStyle = C.pYou;
    this._text(ctx, 'YOU', 1, H * 0.47 + 1, 1);
    ctx.fillStyle = C.pField;
    this._text(ctx, 'FLD', 1, H * 0.62 + 1, 1);

    // Draw runners
    this._drawRunner(ctx, px, H * 0.46, C.pYou,   f, mom < 40);
    this._drawRunner(ctx, fx2, H * 0.61, C.pField, f, false);

    // Speed lines when surging
    if (mom > 70) {
      ctx.fillStyle = C.pYou + '60';
      for (let i = 0; i < 3; i++)
        ctx.fillRect(px - 8 - i * 5, H * 0.46 + 2 + i * 2, 6, 1);
    }
    if (mom < 30) {
      ctx.fillStyle = C.pField + '60';
      for (let i = 0; i < 3; i++)
        ctx.fillRect(fx2 - 8 - i * 5, H * 0.61 + 2 + i * 2, 6, 1);
    }

    // Progress text
    this._drawHUD(ctx, `${Math.round(prog * 100)}%`, mom);
  },

  _drawRunner(ctx, x, y, color, f, stumbling) {
    // Body
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 5, 5);
    // Head
    ctx.fillRect(x + 1, y - 3, 3, 3);
    // Legs — alternate
    const legPhase = f % 4;
    ctx.fillStyle = color + 'cc';
    if (stumbling) {
      ctx.fillRect(x,     y + 5, 2, 2);
      ctx.fillRect(x + 2, y + 4, 2, 3);
    } else if (legPhase < 2) {
      ctx.fillRect(x,     y + 5, 2, 3);
      ctx.fillRect(x + 3, y + 5, 2, 2);
    } else {
      ctx.fillRect(x,     y + 5, 2, 2);
      ctx.fillRect(x + 3, y + 5, 2, 3);
    }
  },

  _drawHill(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < w; i++) {
      const ht = Math.round(h * Math.sin((i / w) * Math.PI));
      ctx.fillRect(x + i, y - ht, 1, ht);
    }
  },

  // ── FIGHT ────────────────────────────────────────
  _drawFight(mom, prog) {
    const C = this.C, W = this._W, H = this._H, f = this._frame;
    const ctx = this._ctx;

    // Ring floor
    ctx.fillStyle = C.ring;
    ctx.fillRect(0, 0, W, H);

    // Ring boundary (overhead view)
    ctx.fillStyle = C.ringRope;
    ctx.strokeStyle = C.ringRope;
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, W - 28, H - 34);

    // Corner posts
    [14,W-14].forEach(cx => [14, H-20].forEach(cy => {
      ctx.fillStyle = C.gold;
      ctx.fillRect(cx - 2, cy - 2, 4, 4);
    }));

    // Centre line
    ctx.fillStyle = C.dim;
    ctx.fillRect(W/2 - 1, 16, 2, H - 36);

    // Crowd in background (rows of colored pixels)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 20; col++) {
        const cx = col * 8 + 2;
        const cy = H - 20 + row * 4 + 2;
        const colors = [C.pYou + '80', C.pField + '80', C.gold + '60'];
        ctx.fillStyle = colors[(cx + cy + f) % 3];
        ctx.fillRect(cx, cy, 3, 3);
      }
    }

    // Fighter positions — they approach centre based on momentum
    const youX   = 30  + (mom / 100) * 20;
    const fieldX = W - 30 - ((100 - mom) / 100) * 20;
    const fightY = H / 2 - 8;

    // Flash on big momentum swing
    const impact = (f % 4 === 0) && (mom > 65 || mom < 35);

    this._drawFighter(ctx, youX,   fightY, C.pYou,   f, mom > 62,  mom < 38, impact && mom > 65);
    this._drawFighter(ctx, fieldX, fightY, C.pField, f, mom < 38,  mom > 62, impact && mom < 35);

    // Impact flash
    if (impact) {
      ctx.fillStyle = C.white + '40';
      ctx.fillRect(W/2 - 8, fightY - 4, 16, 16);
      ctx.fillStyle = C.gold;
      this._text(ctx, mom > 65 ? 'HIT!' : 'OOF!', W/2 - 4, fightY - 6, 1);
    }

    this._drawHUD(ctx, `${Math.round(prog * 100)}%`, mom);
  },

  _drawFighter(ctx, x, y, color, f, winning, losing, impact) {
    const C = this.C;
    // Body
    ctx.fillStyle = color;
    ctx.fillRect(x - 3, y, 6, 8);
    // Head
    ctx.fillRect(x - 2, y - 5, 4, 4);
    // Arms — boxing gloves
    const armBob = (f % 2) * 1;
    ctx.fillStyle = color;
    if (winning) {
      // raised arms
      ctx.fillRect(x - 6, y - 2 + armBob, 3, 3);
      ctx.fillRect(x + 4, y - 2 - armBob, 3, 3);
    } else if (losing) {
      // drooping arms
      ctx.fillRect(x - 6, y + 3, 3, 2);
      ctx.fillRect(x + 4, y + 3, 3, 2);
    } else {
      ctx.fillRect(x - 6, y + armBob, 3, 3);
      ctx.fillRect(x + 4, y - armBob, 3, 3);
    }
    // Impact stars
    if (impact) {
      ctx.fillStyle = C.gold;
      ctx.fillRect(x, y - 8, 2, 2);
      ctx.fillRect(x - 3, y - 7, 2, 2);
      ctx.fillRect(x + 2, y - 7, 2, 2);
    }
  },

  // ── CONTEST (cooking/chess/eating/bowling/beekeeping) ─
  _drawContest(mom, prog) {
    const C = this.C, W = this._W, H = this._H, f = this._frame;
    const ctx = this._ctx;
    const ico = this._event?.ico || '👨‍🍳';

    // Room
    ctx.fillStyle = C.floor;
    ctx.fillRect(0, 0, W, H);
    // Back wall
    ctx.fillStyle = C.wall;
    ctx.fillRect(0, 0, W, H * 0.35);
    // Floor line
    ctx.fillStyle = C.dim;
    ctx.fillRect(0, H * 0.35, W, 1);

    // Counters / stations — YOUR PICK left, FIELD right
    this._drawStation(ctx, 14, H * 0.4, C.pYou,   mom,      f, ico);
    this._drawStation(ctx, W - 46, H * 0.4, C.pField, 100 - mom, f, ico);

    // Score tally on wall
    const sYou   = Math.round(mom);
    const sField = Math.round(100 - mom);
    ctx.fillStyle = C.bgLight;
    ctx.fillRect(W/2 - 14, 6, 28, 16);
    ctx.fillStyle = sYou > sField ? C.green : C.red;
    this._text(ctx, `${sYou}`, W/2 - 11, 9, 1);
    ctx.fillStyle = C.dim;
    this._text(ctx, '-', W/2 - 2, 9, 1);
    ctx.fillStyle = sField > sYou ? C.green : C.red;
    this._text(ctx, `${sField}`, W/2 + 3, 9, 1);

    // Judge sprite (neutral, centre)
    const judgeY = H * 0.38;
    ctx.fillStyle = C.pNeutral;
    ctx.fillRect(W/2 - 2, judgeY, 4, 6);
    ctx.fillRect(W/2 - 1, judgeY - 4, 3, 3);
    // Judge waves notepad
    ctx.fillStyle = C.white;
    ctx.fillRect(W/2 + 3, judgeY + (f % 2), 4, 3);

    this._drawHUD(ctx, `${Math.round(prog * 100)}%`, mom);
  },

  _drawStation(ctx, x, y, color, score, f, ico) {
    const C = this.C;
    // Counter
    ctx.fillStyle = C.bgLight;
    ctx.fillRect(x, y + 10, 32, 8);
    // Cook/contestant
    ctx.fillStyle = color;
    ctx.fillRect(x + 8,  y,      6, 8);  // body
    ctx.fillRect(x + 9,  y - 5,  4, 4);  // head
    // Working animation
    const workBob = Math.round(score / 100 * 3);
    ctx.fillRect(x + 14, y + 2 - (f % 2) * workBob, 3, 3); // tool
    // Glow if winning
    if (score > 60) {
      ctx.fillStyle = color + '30';
      ctx.fillRect(x, y - 6, 32, 26);
    }
  },

  // ── SPIN ─────────────────────────────────────────
  _drawSpin(mom, prog) {
    const C = this.C, W = this._W, H = this._H, f = this._frame;
    const ctx = this._ctx;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // Wheel — drawn as segmented polygon approximation
    const cx = W / 2, cy = H / 2 + 4;
    const r  = 36;
    const speed = Math.max(0.05, (1 - prog) * 0.25);
    const angle = (f * speed * 20) % (Math.PI * 2);
    const segments = 8;

    for (let i = 0; i < segments; i++) {
      const a1 = angle + (i / segments) * Math.PI * 2;
      const a2 = angle + ((i + 1) / segments) * Math.PI * 2;
      const segColors = [C.pYou, C.pField, C.gold, C.green, C.pYou+'aa', C.pField+'aa', C.gold+'aa', C.white+'44'];
      ctx.fillStyle = segColors[i % segColors.length];
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      // Pixel-art arc approximation
      for (let t = 0; t <= 8; t++) {
        const ta = a1 + (a2 - a1) * (t / 8);
        ctx.lineTo(cx + Math.cos(ta) * r, cy + Math.sin(ta) * r);
      }
      ctx.closePath();
      ctx.fill();

      // Segment dividers
      ctx.strokeStyle = C.bg;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
      ctx.stroke();
    }

    // Centre hub
    ctx.fillStyle = C.white;
    ctx.fillRect(cx - 3, cy - 3, 6, 6);

    // Pointer at top
    ctx.fillStyle = C.gold;
    ctx.fillRect(cx - 2, cy - r - 6, 4, 6);

    // Slowing label
    if (prog > 0.7) {
      ctx.fillStyle = C.gold + 'cc';
      this._text(ctx, prog > 0.9 ? 'STOPPING...' : 'SLOWING...', 2, H - 10, 1);
    }

    this._drawHUD(ctx, `${Math.round(prog * 100)}%`, mom);
  },

  // ── MARKET ───────────────────────────────────────
  _drawMarket(mom, prog) {
    const C = this.C, W = this._W, H = this._H, f = this._frame;
    const ctx = this._ctx;

    // Trading floor
    ctx.fillStyle = C.floor;
    ctx.fillRect(0, 0, W, H);
    // Back wall with screens
    ctx.fillStyle = C.wall;
    ctx.fillRect(0, 0, W, H * 0.3);

    // Wall screens (tiny charts)
    for (let i = 0; i < 4; i++) {
      const sx = 10 + i * 36;
      ctx.fillStyle = C.bgLight;
      ctx.fillRect(sx, 4, 28, 18);
      // Mini chart line
      ctx.fillStyle = mom > 50 ? C.green : C.red;
      for (let px = 0; px < 24; px++) {
        const py = 14 - Math.round(Math.sin((px / 24 + f * 0.05 + i) * Math.PI * 2) * 5 * (mom / 100));
        ctx.fillRect(sx + 2 + px, py, 1, 2);
      }
    }

    // Analyst sprites — run toward exit when losing
    const panicState = mom < 35;
    for (let i = 0; i < 5; i++) {
      const ax = panicState
        ? Math.min(W - 5, 20 + i * 26 + (f * 2) % 40)
        : 20 + i * 26 + Math.round(Math.sin(f * 0.2 + i) * 3);
      const ay = H * 0.4 + (i % 2) * 14;
      const aColor = i % 2 === 0 ? C.pYou : C.pField;
      // Body
      ctx.fillStyle = aColor;
      ctx.fillRect(ax, ay, 4, 6);
      ctx.fillRect(ax + 1, ay - 4, 3, 3);
      if (panicState) {
        // Arms up in panic
        ctx.fillRect(ax - 2, ay - 2, 2, 4);
        ctx.fillRect(ax + 4, ay - 2, 2, 4);
      }
    }

    // Big price display
    const pctChange = ((mom - 50) * 0.8).toFixed(1);
    ctx.fillStyle = mom > 50 ? C.green : C.red;
    ctx.fillRect(W/2 - 20, H * 0.65, 40, 14);
    ctx.fillStyle = C.bg;
    this._text(ctx, (pctChange >= 0 ? '+' : '') + pctChange + '%', W/2 - 17, H * 0.65 + 4, 1);

    this._drawHUD(ctx, `${Math.round(prog * 100)}%`, mom);
  },

  // ── DIGNITY ──────────────────────────────────────
  _drawDignity(mom, prog) {
    const C = this.C, W = this._W, H = this._H, f = this._frame;
    const ctx = this._ctx;

    // Stage
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    // Stage platform
    ctx.fillStyle = C.bgLight;
    ctx.fillRect(20, H * 0.55, W - 40, H * 0.45);
    // Spotlights
    ctx.fillStyle = `rgba(255,196,0,0.08)`;
    this._fillTriangle(ctx, W/2, 0, W/2 - 30, H*0.55, W/2 + 30, H*0.55);

    // Audience (front row of heads)
    for (let i = 0; i < 12; i++) {
      const hx = 8 + i * 12;
      const hy = H * 0.7 + (i % 3) * 4;
      const reacting = (i + f) % 6 === 0;
      ctx.fillStyle = reacting ? C.gold : C.dim;
      ctx.fillRect(hx, hy, 5, 4);
      ctx.fillRect(hx + 1, hy - 3, 3, 3);
    }

    // Performer (centre stage)
    const stage = H * 0.5;
    const bob = mom > 60 ? (f % 2) * 2 : 0;
    ctx.fillStyle = C.pYou;
    ctx.fillRect(W/2 - 3, stage - bob, 6, 8);
    ctx.fillRect(W/2 - 2, stage - 5 - bob, 4, 4);
    // Arms — raised if winning
    if (mom > 65) {
      ctx.fillRect(W/2 - 7, stage - 4 - bob, 3, 4);
      ctx.fillRect(W/2 + 5, stage - 4 - bob, 3, 4);
    } else if (mom < 35) {
      // Slouch
      ctx.fillRect(W/2 - 7, stage + 2, 3, 2);
      ctx.fillRect(W/2 + 5, stage + 2, 3, 2);
    } else {
      ctx.fillRect(W/2 - 7, stage - 1 - (f%2), 3, 3);
      ctx.fillRect(W/2 + 5, stage - 1 + (f%2), 3, 3);
    }

    // Dignity meter on wall
    const digW = Math.round((mom / 100) * 60);
    ctx.fillStyle = C.bgLight;
    ctx.fillRect(W/2 - 30, 8, 60, 8);
    ctx.fillStyle = mom > 60 ? C.green : mom > 35 ? C.gold : C.red;
    ctx.fillRect(W/2 - 30, 8, digW, 8);
    ctx.fillStyle = C.white;
    this._text(ctx, 'DIGNITY', W/2 - 14, 10, 1);

    this._drawHUD(ctx, `${Math.round(prog * 100)}%`, mom);
  },

  // ── MYSTERY ──────────────────────────────────────
  _drawMystery(mom, prog) {
    const C = this.C, W = this._W, H = this._H, f = this._frame;
    const ctx = this._ctx;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // Static noise
    for (let i = 0; i < 200; i++) {
      const nx = Math.random() * W | 0;
      const ny = Math.random() * H | 0;
      const lum = Math.random() * 60 | 0;
      ctx.fillStyle = `rgb(${lum},${lum},${lum})`;
      ctx.fillRect(nx, ny, 1 + (Math.random() * 2 | 0), 1);
    }

    // Faint silhouette
    const alpha = 0.3 + Math.sin(f * 0.3) * 0.2;
    ctx.fillStyle = `rgba(0,229,255,${alpha})`;
    ctx.fillRect(W/2 - 8, H/2 - 14, 16, 24); // body
    ctx.fillRect(W/2 - 5, H/2 - 20, 10, 8);  // head

    // Question marks
    ctx.fillStyle = `rgba(255,196,0,${0.5 + Math.sin(f * 0.5) * 0.3})`;
    this._text(ctx, '?', W/2 - 2, H/2 - 22, 1);

    this._drawHUD(ctx, '???', mom);
  },

  // ── RESULT SCREEN ────────────────────────────────
  _drawResult() {
    const C = this.C, W = this._W, H = this._H, f = this._frame - this._resultTs;
    const ctx = this._ctx;
    const won = this._won;

    // Background flash then settle
    const alpha = Math.max(0, 1 - f * 0.05);
    ctx.fillStyle = won ? `rgba(0,230,118,${alpha * 0.4})` : `rgba(255,23,68,${alpha * 0.4})`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    if (won) {
      // Confetti
      for (let i = 0; i < 20; i++) {
        const cx2 = (i * 37 + f * 3) % W;
        const cy  = (f * 2 + i * 19) % H;
        const confColors = [C.gold, C.green, C.pYou, C.white];
        ctx.fillStyle = confColors[i % confColors.length];
        ctx.fillRect(cx2, cy, 2, 2);
      }
      // Trophy
      ctx.fillStyle = C.gold;
      ctx.fillRect(W/2 - 8, H/2 - 18, 16, 12);
      ctx.fillRect(W/2 - 5, H/2 - 6,  10, 4);
      ctx.fillRect(W/2 - 10, H/2 - 2, 20, 4);
      ctx.fillRect(W/2 - 3, H/2 + 2, 6, 6);
      ctx.fillRect(W/2 - 7, H/2 + 8, 14, 3);
      // WIN text
      ctx.fillStyle = C.green;
      this._text(ctx, 'WIN!', W/2 - 8, H/2 - 26, 2);
    } else {
      // Broken lines
      ctx.fillStyle = C.red + '60';
      for (let i = 0; i < 8; i++) {
        const lx = (i * 23 + 5) % W;
        ctx.fillRect(lx, 0, 1, H);
      }
      // X mark
      ctx.fillStyle = C.red;
      for (let i = 0; i < 12; i++) {
        ctx.fillRect(W/2 - 8 + i, H/2 - 8 + i, 3, 3);
        ctx.fillRect(W/2 + 4 - i, H/2 - 8 + i, 3, 3);
      }
      // LOSS text
      ctx.fillStyle = C.red;
      this._text(ctx, 'LOSS', W/2 - 8, H/2 - 22, 2);
    }

    // Bouncing arrow — press to continue
    const bounce = Math.abs(Math.sin(f * 0.15)) * 3 | 0;
    ctx.fillStyle = C.white + 'aa';
    this._text(ctx, '▼ CONTINUE', W/2 - 18, H - 10 - bounce, 1);

    this._drawCRT();
  },

  // ═══════════════════════════════════════════════
  //  SHARED HELPERS
  // ═══════════════════════════════════════════════

  _drawHUD(ctx, progressTxt, mom) {
    const C = this.C, W = this._W, H = this._H;
    // Bottom strip
    ctx.fillStyle = C.black + 'cc';
    ctx.fillRect(0, H - 12, W, 12);
    // Momentum mini-bar
    const barW = Math.round(W * 0.55);
    ctx.fillStyle = C.dim;
    ctx.fillRect(2, H - 7, barW, 4);
    const fillW = Math.round((mom / 100) * barW);
    const barColor = mom >= 60 ? C.green : mom >= 40 ? C.gold : C.red;
    ctx.fillStyle = barColor;
    ctx.fillRect(2, H - 7, fillW, 4);
    // Progress text
    ctx.fillStyle = C.white + 'aa';
    this._text(ctx, progressTxt, W - 18, H - 10, 1);
  },

  // Minimal 1px bitmap font — 3×5 characters
  _text(ctx, str, x, y, scale) {
    const s = scale || 1;
    const glyphs = {
      'A':'01101001111001001',  'B':'11001100111001110',  'C':'01101000100000110',
      'D':'11001100110011100',  'E':'11101100111001110',  'F':'11101100110001000',
      'G':'01101000101101110',  'H':'10011001111010010',  'I':'11100100010001110',
      'J':'00100010001001010',  'K':'10011010110010010',  'L':'10001000100001110',
      'M':'10011011101010010',  'N':'10011101101110010',  'O':'01101001100101100',
      'P':'11001100111001000',  'Q':'01101001101100011',  'R':'11001100111010010',
      'S':'01101000010001100',  'T':'11100100010000100',  'U':'10011001100101100',
      'V':'10011001100100100',  'W':'10011001101111010',  'X':'10010101001010010',
      'Y':'10010101001000100',  'Z':'11100010101001110',
      '0':'01101011101101100',  '1':'01000100010000100',  '2':'01101000010101110',
      '3':'11000100110001110',  '4':'10011001011100010',  '5':'11101000011001110',
      '6':'01101000111101100',  '7':'11100010001000100',  '8':'01101001011101100',
      '9':'01101001011100100',
      '.':'00000000000000100',  ',':'00000000000000110',  ':':'00001000000001000',
      '-':'00000001110000000',  '%':'10100010001001010',  '+':'00000101110010100',
      '!':'01000100010000100',  '?':'01100010010000100',  ' ':'00000000000000000',
      '/':'00001001001010000',  '*':'00001010111010100',  '#':'01011111010111110',
      '>':'10001000010000100',  '<':'00100010001000010',  '▼':'00011111010000100',
      '↑':'00100111000100000',  '↓':'00001000111000100',  '=':'00011100011100000',
    };
    const C = this.C;
    for (let ci = 0; ci < str.length; ci++) {
      const ch = str[ci].toUpperCase();
      const glyph = glyphs[ch];
      if (!glyph) { continue; }
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 3; col++) {
          if (glyph[row * 3 + col] === '1') {
            ctx.fillRect(x + ci * (3 * s + s) + col * s, y + row * s, s, s);
          }
        }
      }
    }
  },

  _fillTriangle(ctx, x1, y1, x2, y2, x3, y3) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill();
  },

  // ── CRT POST-EFFECT ──────────────────────────────
  _drawCRT() {
    const ctx = this._ctx, W = this._W, H = this._H;
    // Scanlines — draw every 2px
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < H; y += 2) {
      ctx.fillRect(0, y, W, 1);
    }
    // Vignette (dark edges)
    const vig = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.8);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  },

  // ── EXPAND / COLLAPSE MODAL ──────────────────────
  expand() {
    const overlay = $('tv-expand-overlay');
    const bigCanvas = $('tv-big-canvas');
    if (!overlay || !bigCanvas) return;
    overlay.classList.add('open');
    // Draw current TV frame immediately so screen isn't blank on open
    const small = $('bc-tv-canvas');
    if (small && small.width > 0) {
      const bctx = bigCanvas.getContext('2d');
      bctx.imageSmoothingEnabled = false;
      bctx.clearRect(0, 0, bigCanvas.width, bigCanvas.height);
      bctx.drawImage(small, 0, 0, bigCanvas.width, bigCanvas.height);
    }
    // Continuous refresh via rAF while overlay is open
    const refresh = () => {
      if (!overlay.classList.contains('open')) return;
      const s = $('bc-tv-canvas');
      if (s && s.width > 0) {
        const c = bigCanvas.getContext('2d');
        c.imageSmoothingEnabled = false;
        c.clearRect(0, 0, bigCanvas.width, bigCanvas.height);
        c.drawImage(s, 0, 0, bigCanvas.width, bigCanvas.height);
      }
      requestAnimationFrame(refresh);
    };
    requestAnimationFrame(refresh);
  },

  collapse() {
    const overlay = $('tv-expand-overlay');
    if (overlay) overlay.classList.remove('open');
  },
};
