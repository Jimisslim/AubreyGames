(function () {

  var ZOOM_FACTOR  = 4;
  var SMOOTH_SPEED = 0.18;

  var current = 1;
  var target  = 1;

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

  AML.addKeybind('KeyC', function (e) {
    if (e.type === 'keydown' && !e.repeat) target = ZOOM_FACTOR;
  });

  document.addEventListener('keyup', function (e) {
    if (e.code === 'KeyC') target = 1;
  });

  console.log('hold C to zoom');

}());