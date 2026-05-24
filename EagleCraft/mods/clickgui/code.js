// EagleCraft/mods/clickgui/code.js
(function () {
  'use strict';

  /* ── Config ───────────────────────────────────────────────── */
  var TOGGLE_KEY = 'RShift';
  var PANEL_W    = 580;
  var PANEL_H    = 390;
  var SIDEBAR_W  = 130;
  var CARD_H     = 58;
  var CARD_GAP   = 7;
  var FONT       = 'Inter, system-ui, sans-serif';

  var COLORS = {
    bg:         '#13131a',
    panel:      '#1a1a24',
    card:       '#1e1e2a',
    cardHover:  '#252533',
    sidebar:    '#111118',
    border:     'rgba(255,255,255,0.06)',
    borderOn:   'rgba(139,92,246,0.35)',
    text:       '#e2e2f0',
    textMuted:  '#55556a',
    textDim:    '#888899',
    accent:     '#8b5cf6',
    accentDim:  'rgba(139,92,246,0.2)',
    toggleOn:   '#7c3aed',
    toggleOff:  '#252535',
    tagWebgl:   { bg:'rgba(59,130,246,0.18)',  fg:'#60a5fa' },
    tagHook:    { bg:'rgba(16,185,129,0.18)',  fg:'#34d399' },
    tagOverlay: { bg:'rgba(245,158,11,0.18)',  fg:'#fbbf24' },
  };

  /* ── State ────────────────────────────────────────────────── */
  var open        = false;
  var selectedCat = 'all';
  var mouse       = { x: 0, y: 0 };
  var clickPos    = null;   // consumed each frame
  var scrollY     = 0;     // mod list scroll offset
  var enabled     = {};    // modId -> bool
  var toggleCbs   = {};    // modId -> { enable, disable }

  var CATEGORIES = [
    { id:'all',         label:'All'        },
    { id:'performance', label:'Performance' },
    { id:'hud',         label:'HUD & UI'   },
    { id:'utility',     label:'Utility'    },
    { id:'visual',      label:'Visuals'    },
  ];

  /* ── Public API extensions ────────────────────────────────── */
  AML.registerToggle = function (id, enableFn, disableFn) {
    toggleCbs[id] = { enable: enableFn, disable: disableFn };
  };
  AML.isEnabled = function (id) { return enabled[id] !== false; };

  // Init all mods as enabled
  (AML.mods || []).forEach(function (m) { enabled[m.id] = true; });

  /* ── Open / close ─────────────────────────────────────────── */
  function setOpen(val) {
    open = val;
    AML.setOverlayInteractive(val);
    // Pause/resume game input (prevent WASD moving while GUI is open)
    document.dispatchEvent(new CustomEvent('aml:guiopen', { detail: val }));
  }

  AML.addKeybind(TOGGLE_KEY, function (e) {
    if (e.repeat) return;
    setOpen(!open);
  });

  /* ── Mouse ────────────────────────────────────────────────── */
  // Use capture so we beat the game's listeners
  document.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, true);

  document.addEventListener('mousedown', function (e) {
    if (!open) return;
    clickPos = { x: e.clientX, y: e.clientY };
    e.stopPropagation();
    e.preventDefault();
  }, true);

  document.addEventListener('mouseup', function (e) {
    if (!open) return;
    e.stopPropagation();
  }, true);

  document.addEventListener('wheel', function (e) {
    if (!open) return;
    scrollY = Math.max(0, scrollY + e.deltaY * 0.4);
    e.stopPropagation();
    e.preventDefault();
  }, { capture:true, passive:false });

  /* ── Helpers ──────────────────────────────────────────────── */
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function truncate(ctx, str, maxW) {
    if (ctx.measureText(str).width <= maxW) return str;
    while (str.length && ctx.measureText(str + '…').width > maxW) str = str.slice(0,-1);
    return str + '…';
  }

  function hit(rx, ry, rw, rh) {
    return mouse.x >= rx && mouse.x <= rx + rw &&
           mouse.y >= ry && mouse.y <= ry + rh;
  }

  function clicked(rx, ry, rw, rh) {
    return clickPos &&
           clickPos.x >= rx && clickPos.x <= rx + rw &&
           clickPos.y >= ry && clickPos.y <= ry + rh;
  }

  /* ── Drawing ──────────────────────────────────────────────── */
  AML.onFrame(function () {
    var ctx = AML.overlay();
    var W   = ctx.canvas.width;
    var H   = ctx.canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (!open) { clickPos = null; return; }

    // Dim background
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, W, H);

    var px = Math.floor((W - PANEL_W) / 2);
    var py = Math.floor((H - PANEL_H) / 2);

    drawPanel(ctx, px, py);

    clickPos = null;    // consume click after all hit-tests
  });

  /* ── Panel ────────────────────────────────────────────────── */
  function drawPanel(ctx, px, py) {
    // Drop shadow
    ctx.shadowColor   = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur    = 32;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = COLORS.panel;
    rrect(ctx, px, py, PANEL_W, PANEL_H, 12);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;
    ctx.shadowOffsetY = 0;

    // Sidebar
    ctx.fillStyle = COLORS.sidebar;
    rrect(ctx, px, py, SIDEBAR_W, PANEL_H, 12);
    ctx.fill();
    ctx.fillRect(px + SIDEBAR_W - 12, py, 12, PANEL_H); // square-off right edge

    // Title bar
    ctx.fillStyle = COLORS.accent;
    ctx.font      = '600 13px ' + FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('AML', px + 16, py + 19);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(' ClickGUI', px + 39, py + 19);

    // Mod count badge
    var visCount = filteredMods().length;
    ctx.font = '11px ' + FONT;
    ctx.fillStyle = COLORS.textMuted;
    ctx.textAlign = 'right';
    ctx.fillText(visCount + ' mod' + (visCount !== 1 ? 's' : ''), px + PANEL_W - 14, py + 19);

    // Divider
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(px, py + 34, PANEL_W, 1);

    drawCategories(ctx, px, py);
    drawMods(ctx, px, py);
    drawScrollbar(ctx, px, py);

    // Close hint
    ctx.font      = '10px ' + FONT;
    ctx.fillStyle = COLORS.textMuted;
    ctx.textAlign = 'right';
    ctx.fillText('RShift to close', px + PANEL_W - 12, py + PANEL_H - 10);
  }

  /* ── Sidebar ──────────────────────────────────────────────── */
  function drawCategories(ctx, px, py) {
    var startY = py + 46;
    var itemH  = 30;

    CATEGORIES.forEach(function (cat, i) {
      var cy     = startY + i * itemH;
      var active = selectedCat === cat.id;
      var isHit  = hit(px, cy, SIDEBAR_W, itemH);

      if (active) {
        ctx.fillStyle = COLORS.accentDim;
        rrect(ctx, px + 8, cy + 3, SIDEBAR_W - 16, itemH - 6, 5);
        ctx.fill();
        // Active pill
        ctx.fillStyle = COLORS.accent;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(px + 4, cy + 9, 3, itemH - 18, 2)
                      : ctx.fillRect(px + 4, cy + 9, 3, itemH - 18);
        ctx.fill();
      } else if (isHit) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        rrect(ctx, px + 8, cy + 3, SIDEBAR_W - 16, itemH - 6, 5);
        ctx.fill();
      }

      ctx.font      = (active ? '500' : '400') + ' 12px ' + FONT;
      ctx.fillStyle = active ? COLORS.accent : isHit ? COLORS.text : COLORS.textDim;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(cat.label, px + 18, cy + itemH / 2);

      if (clicked(px, cy, SIDEBAR_W, itemH)) {
        selectedCat = cat.id;
        scrollY = 0;
      }
    });
  }

  /* ── Mod cards ────────────────────────────────────────────── */
  function filteredMods() {
    return (AML.mods || []).filter(function (m) {
      return selectedCat === 'all' || m.category === selectedCat;
    });
  }

  function drawMods(ctx, px, py) {
    var mods    = filteredMods();
    var cx      = px + SIDEBAR_W + 10;
    var cw      = PANEL_W - SIDEBAR_W - 20;
    var listTop = py + 38;
    var listH   = PANEL_H - 50;

    // Clip to list area
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx, listTop, cw, listH);
    ctx.clip();

    var totalH = mods.length * (CARD_H + CARD_GAP);
    var maxScroll = Math.max(0, totalH - listH + 8);
    scrollY = Math.min(scrollY, maxScroll);

    mods.forEach(function (mod, i) {
      var cardY = listTop + i * (CARD_H + CARD_GAP) - scrollY;
      if (cardY + CARD_H < listTop || cardY > listTop + listH) return; // culled

      var on      = enabled[mod.id] !== false;
      var isHit   = hit(cx, cardY, cw, CARD_H);
      var isClick = clicked(cx, cardY, cw, CARD_H);

      // Card bg
      ctx.fillStyle = isHit ? COLORS.cardHover : COLORS.card;
      rrect(ctx, cx, cardY, cw, CARD_H, 7);
      ctx.fill();

      // Border
      ctx.strokeStyle = on ? COLORS.borderOn : COLORS.border;
      ctx.lineWidth   = 1;
      rrect(ctx, cx, cardY, cw, CARD_H, 7);
      ctx.stroke();

      // Left accent bar when on
      if (on) {
        ctx.fillStyle = COLORS.accent;
        rrect(ctx, cx, cardY + 12, 3, CARD_H - 24, 2);
        ctx.fill();
      }

      // Mod name
      ctx.font      = '500 13px ' + FONT;
      ctx.fillStyle = on ? COLORS.text : COLORS.textMuted;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(mod.name, cx + 14, cardY + 18);

      // Tag pill
      var tagCols = { webgl: COLORS.tagWebgl, hook: COLORS.tagHook, overlay: COLORS.tagOverlay };
      var tc = tagCols[mod.tag] || { bg:'rgba(255,255,255,0.08)', fg:'#888' };
      ctx.font = '10px ' + FONT;
      var tagLabel = (mod.tag || '').toUpperCase();
      var tagW  = ctx.measureText(tagLabel).width + 10;
      ctx.fillStyle = tc.bg;
      rrect(ctx, cx + 14, cardY + 32, tagW, 15, 3);
      ctx.fill();
      ctx.fillStyle = tc.fg;
      ctx.textBaseline = 'middle';
      ctx.fillText(tagLabel, cx + 19, cardY + 39);

      // Description (truncated)
      ctx.font      = '11px ' + FONT;
      ctx.fillStyle = on ? COLORS.textMuted : COLORS.textMuted;
      ctx.fillText(truncate(ctx, mod.desc, cw - tagW - 80), cx + 20 + tagW, cardY + 39);

      // Toggle switch
      var tx = cx + cw - 50;
      var ty = cardY + CARD_H / 2 - 9;
      drawToggle(ctx, tx, ty, on);

      // Click — toggle mod
      if (isClick) {
        enabled[mod.id] = !on;
        var cbs = toggleCbs[mod.id];
        if (cbs) {
          try { (enabled[mod.id] ? cbs.enable : cbs.disable)(); } catch (e) {}
        }
      }
    });

    ctx.restore();
  }

  /* ── Toggle switch ────────────────────────────────────────── */
  function drawToggle(ctx, x, y, on) {
    var w = 34, h = 18, r = 9;

    // Track
    ctx.fillStyle = on ? COLORS.toggleOn : COLORS.toggleOff;
    rrect(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.strokeStyle = on ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    rrect(ctx, x, y, w, h, r);
    ctx.stroke();

    // Knob
    var kx = on ? x + w - r - 1 : x + r + 1;
    ctx.fillStyle = on ? '#ffffff' : '#555566';
    ctx.beginPath();
    ctx.arc(kx, y + r, r - 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ── Scrollbar ────────────────────────────────────────────── */
  function drawScrollbar(ctx, px, py) {
    var mods    = filteredMods();
    var listH   = PANEL_H - 50;
    var totalH  = mods.length * (CARD_H + CARD_GAP);
    if (totalH <= listH) return;

    var cx   = px + PANEL_W - 6;
    var cy   = py + 38;
    var barH = Math.max(30, listH * (listH / totalH));
    var barY = cy + (scrollY / (totalH - listH)) * (listH - barH);

    ctx.fillStyle = 'rgba(139,92,246,0.3)';
    rrect(ctx, cx, barY, 3, barH, 2);
    ctx.fill();
  }

  console.log('[ClickGUI] Ready — RShift to open');

}());