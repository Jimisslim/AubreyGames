// EagleCraft/mods/debug/code.js
(function () {

  var lines = [];
  var MAX   = 12;

  function log(msg) {
    lines.push('[' + Date.now() % 100000 + '] ' + msg);
    if (lines.length > MAX) lines.shift();
  }

  // Check 1 — did this script even run?
  log('DEBUG mod loaded');

  // Check 2 — is AML present?
  if (!window.AML) { lines.push('ERROR: window.AML missing!'); return; }
  log('AML found');

  // Check 3 — did mods load?
  log('AML.mods count: ' + (AML.mods || []).length);

  // Check 4 — is overlay working?
  try {
    var ctx = AML.overlay();
    log('Overlay canvas: ' + ctx.canvas.width + 'x' + ctx.canvas.height);
  } catch(e) {
    log('ERROR overlay: ' + e.message);
  }

  // Check 5 — is RShift firing?
  document.addEventListener('keydown', function(e) {
    log('keydown: ' + e.code);
  }, true);

  // Draw debug panel every frame
  AML.onFrame(function () {
    var ctx = AML.overlay();
    var y   = 10;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(8, 8, 320, lines.length * 16 + 10);

    ctx.font      = '11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    lines.forEach(function (line) {
      ctx.fillStyle = line.indexOf('ERROR') >= 0 ? '#ff5555'
                    : line.indexOf('keydown') >= 0 ? '#ffcc00'
                    : '#88ff88';
      ctx.fillText(line, 14, y);
      y += 16;
    });
    ctx.restore();
  });

}());