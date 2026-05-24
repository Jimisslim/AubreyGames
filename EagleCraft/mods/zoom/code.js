// EagleCraft/mods/zoom/code.js
(function () {

  var ZOOM_FACTOR  = 4;
  var SMOOTH_SPEED = 0.18;

  var current = 1;
  var target  = 1;

  // AML handles the frame loop — no need for our own RAF
  AML.onFrame(function () {
    var canvas = document.querySelector('canvas');
    if (!canvas) return;

    if (Math.abs(current - target) < 0.001) {
      current = target;
      canvas.style.transform = current === 1 ? '' : 'scale(' + current + ')';
      return;
    }

    current += (target - current) * SMOOTH_SPEED;
    canvas.style.transform = 'scale(' + current.toFixed(4) + ')';
  });

  // AML handles keybinds — no capture-phase listener conflicts
  AML.addKeybind('KeyC', function (e) {
    if (e.type === 'keydown' && !e.repeat) target = ZOOM_FACTOR;
  });

  // addKeybind only does keydown, so we need keyup separately
  document.addEventListener('keyup', function (e) {
    if (e.code === 'KeyC') target = 1;
  });

  console.log('[ZoomMod] Ready — hold C to zoom');

}());