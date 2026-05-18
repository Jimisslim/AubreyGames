/**
 * MiniMap — code.js (fixed)
 * Waits for EagleCraft's canvas to be created, then appends
 * the overlay as the last child of <html> so it's always on top.
 */
(function () {

  var mm = window.__eagleMinimap;
  if (!mm) { console.warn('[MiniMap] early.js not loaded!'); return; }

  var SIZE   = 180;
  var RADIUS = SIZE / 2;
  var SCALE  = 5;
  var DOT_R  = 3;

  // ── Build overlay ────────────────────────────────────────────────────────
  var wrap = document.createElement('div');
  wrap.style.cssText = [
    'position:fixed',
    'bottom:12px',
    'right:12px',
    'z-index:2147483647',   // absolute max
    'pointer-events:none',
    'filter:drop-shadow(0 2px 8px rgba(0,0,0,0.8))',
  ].join(';');

  var cv = document.createElement('canvas');
  cv.width  = SIZE;
  cv.height = SIZE;
  cv.style.cssText = 'display:block;border-radius:50%;';
  wrap.appendChild(cv);

  var label = document.createElement('div');
  label.style.cssText = [
    'text-align:center',
    'color:rgba(255,255,255,0.8)',
    'font:bold 10px monospace',
    'margin-top:4px',
    'text-shadow:0 1px 4px #000',
  ].join(';');
  wrap.appendChild(label);

  // ── Append AFTER game canvas exists ─────────────────────────────────────
  // EagleCraft creates its canvas dynamically. We poll until we detect it,
  // then append to <html> (not body) so we're always the topmost element.
  function attach() {
    var gameCanvas = document.querySelector('canvas');
    if (gameCanvas) {
      // Append to documentElement so nothing the game does to <body> can bury us
      document.documentElement.appendChild(wrap);
      console.log('[MiniMap] Overlay attached on top of game canvas');
      return true;
    }
    return false;
  }

  if (!attach()) {
    var poll = setInterval(function () {
      if (attach()) clearInterval(poll);
    }, 200);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  var ctx = cv.getContext('2d');

  function trailColor(i, total) {
    var t   = i / total;
    var a   = 0.2 + t * 0.7;
    var r   = Math.round(20  + (1 - t) * 20);
    var g   = Math.round(180 + t * 55);
    var b   = Math.round(180 - t * 130);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(2) + ')';
  }

  function render() {
    var px = mm.x, pz = mm.z;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(RADIUS, RADIUS, RADIUS, 0, Math.PI * 2);
    ctx.clip();

    // background
    ctx.fillStyle = 'rgba(10,14,10,0.88)';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // chunk grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth   = 0.5;
    var step = 16 * SCALE;
    var ox = ((px % 16) * SCALE + step) % step;
    var oz = ((pz % 16) * SCALE + step) % step;
    for (var gx = RADIUS - ox; gx < SIZE; gx += step) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, SIZE); ctx.stroke();
    }
    for (var gx2 = RADIUS - ox; gx2 > 0; gx2 -= step) {
      ctx.beginPath(); ctx.moveTo(gx2, 0); ctx.lineTo(gx2, SIZE); ctx.stroke();
    }
    for (var gz = RADIUS - oz; gz < SIZE; gz += step) {
      ctx.beginPath(); ctx.moveTo(0, gz); ctx.lineTo(SIZE, gz); ctx.stroke();
    }
    for (var gz2 = RADIUS - oz; gz2 > 0; gz2 -= step) {
      ctx.beginPath(); ctx.moveTo(0, gz2); ctx.lineTo(SIZE, gz2); ctx.stroke();
    }

    // trail
    var trail = mm.trail;
    var tLen  = trail.length;
    if (tLen > 1) {
      for (var i = 1; i < tLen; i++) {
        var a = trail[i - 1], b = trail[i];
        ctx.strokeStyle = trailColor(i, tLen);
        ctx.lineWidth   = 2;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(RADIUS + (a.x - px) * SCALE, RADIUS + (a.z - pz) * SCALE);
        ctx.lineTo(RADIUS + (b.x - px) * SCALE, RADIUS + (b.z - pz) * SCALE);
        ctx.stroke();
      }
    }

    // player glow
    var grd = ctx.createRadialGradient(RADIUS, RADIUS, 0, RADIUS, RADIUS, DOT_R * 3.5);
    grd.addColorStop(0,   'rgba(255,255,255,0.9)');
    grd.addColorStop(0.4, 'rgba(100,230,180,0.5)');
    grd.addColorStop(1,   'rgba(100,230,180,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(RADIUS, RADIUS, DOT_R * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // player dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(RADIUS, RADIUS, DOT_R, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // border ring
    ctx.beginPath();
    ctx.arc(RADIUS, RADIUS, RADIUS - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(78,207,165,0.5)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // coords label
    label.textContent = 'X ' + Math.floor(px) +
                        '  Y ' + Math.floor(mm.y) +
                        '  Z ' + Math.floor(pz);
  }

  setInterval(render, 50);
  console.log('[MiniMap] Render loop started');

}());