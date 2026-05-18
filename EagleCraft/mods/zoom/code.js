/**
 * ZoomMod — code.js
 * Hold C to zoom in, release to zoom out.
 * Works by scaling the game canvas with CSS transform.
 */
(function () {

  var ZOOM_FACTOR  = 4;    // how much to zoom in (4x)
  var SMOOTH_SPEED = 0.18; // interpolation speed (0–1, higher = snappier)

  var canvas   = null;
  var current  = 1;        // current scale
  var target   = 1;        // target scale
  var zooming  = false;
  var rafId    = null;

  // ── Wait for game canvas ─────────────────────────────────────────────────
  function findCanvas() {
    canvas = document.querySelector('canvas');
    if (!canvas) { setTimeout(findCanvas, 200); return; }
    canvas.style.transformOrigin = 'center center';
    canvas.style.transition      = 'none';
    startLoop();
    bindKeys();
    console.log('[ZoomMod] Ready — hold C to zoom');
  }

  // ── Smooth scale loop ────────────────────────────────────────────────────
  function startLoop() {
    function tick() {
      rafId = requestAnimationFrame(tick);
      if (Math.abs(current - target) < 0.001) {
        current = target;
        canvas.style.transform = current === 1
          ? '' : 'scale(' + current + ')';
        return;
      }
      current += (target - current) * SMOOTH_SPEED;
      canvas.style.transform = 'scale(' + current.toFixed(4) + ')';
    }
    tick();
  }

  // ── Key bindings ─────────────────────────────────────────────────────────
  function bindKeys() {
    document.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      if (e.code === 'KeyC' || e.key === 'c' || e.key === 'C') {
        target  = ZOOM_FACTOR;
        zooming = true;
      }
    }, true);

    document.addEventListener('keyup', function (e) {
      if (e.code === 'KeyC' || e.key === 'c' || e.key === 'C') {
        target  = 1;
        zooming = false;
      }
    }, true);
  }

  findCanvas();

}());