(function () {

  var lines = [];
  var MAX   = 12;

  function log(msg) {
    lines.push('[' + Date.now() % 100000 + '] ' + msg);
    if (lines.length > MAX) lines.shift();
  }

  log('DEBUG mod loaded');

  if (!window.AML) { lines.push('ERROR: window.AML missing!'); return; }
  log('AML found');

  log('AML.mods count: ' + (AML.mods || []).length);

  try {
    var ctx = AML.overlay();
    log('Overlay canvas: ' + ctx.canvas.width + 'x' + ctx.canvas.height);
  } catch(e) {
    log('ERROR overlay: ' + e.message);
  }

  document.addEventListener('keydown', function(e) {
    log('keydown: ' + e.code);
  }, true);

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