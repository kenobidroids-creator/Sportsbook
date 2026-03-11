// ══════════════════════════════════════════════════
//  HELP.JS — In-game help modal (open/close/tabs)
// ══════════════════════════════════════════════════

const Help = {
  _current: 'overview',

  open(tab) {
    $('help-overlay').classList.add('open');
    this.tab(tab || this._current);
    SFX.click();
  },

  close() {
    $('help-overlay').classList.remove('open');
    SFX.click();
  },

  tab(id) {
    // Deactivate all panels and tabs
    document.querySelectorAll('.hpanel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.htab').forEach(t => t.classList.remove('active'));

    // Activate selected
    const panel = $('hp-' + id);
    if (panel) panel.classList.add('active');

    // Activate matching tab button
    document.querySelectorAll('.htab').forEach(t => {
      if (t.getAttribute('onclick') === `Help.tab('${id}')`) {
        t.classList.add('active');
      }
    });

    // Reset scroll to top
    const body = document.querySelector('.help-body');
    if (body) body.scrollTop = 0;

    this._current = id;
  },
};

// ── KEYBOARD SHORTCUT ────────────────────────────
// Press ? or F1 to toggle help from anywhere in the game
document.addEventListener('keydown', e => {
  if (e.key === '?' || e.key === 'F1') {
    e.preventDefault();
    const overlay = $('help-overlay');
    if (overlay.classList.contains('open')) {
      Help.close();
    } else {
      Help.open();
    }
  }
  // Escape closes
  if (e.key === 'Escape') {
    $('help-overlay').classList.remove('open');
  }
});

// ── CLICK OUTSIDE TO CLOSE ───────────────────────
$('help-overlay').addEventListener('click', e => {
  if (e.target === $('help-overlay')) Help.close();
});
