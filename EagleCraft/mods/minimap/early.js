(function () {

  window.__eagleMinimap = {
    x: 0, y: 64, z: 0,
    trail: [],
    maxTrail: 4000,
    _lastTrail: 0,
    _frameVotes: {},
    _locked: false,
    _prev: null
  };

  var mm = window.__eagleMinimap;

  function isValidWorld(x, y, z) {
    return isFinite(x) && isFinite(y) && isFinite(z) &&
           Math.abs(x) < 29999999 &&
           Math.abs(z) < 29999999 &&
           y > -200 && y < 500;
  }

  function flush() {
    requestAnimationFrame(flush);

    var votes = mm._frameVotes;
    mm._frameVotes = {};

    var best = null, bestCount = 0;
    for (var k in votes) {
      if (votes[k] > bestCount) { bestCount = votes[k]; best = k; }
    }

    if (!best || bestCount < 4) return;

    var parts = best.split('|');
    var nx = parseFloat(parts[0]);
    var ny = parseFloat(parts[1]);
    var nz = parseFloat(parts[2]);

    if (mm._prev) {
      var dx = nx - mm._prev.x;
      var dz = nz - mm._prev.z;
      if (Math.sqrt(dx * dx + dz * dz) > 10) return;
    }

    mm.x = nx;
    mm.y = ny;
    mm.z = nz;
    mm._prev   = { x: nx, z: nz };
    mm._locked = true;

    var now = performance.now();
    if (now - mm._lastTrail > 1000) {
      mm.trail.push({ x: nx, z: nz });
      if (mm.trail.length > mm.maxTrail) mm.trail.shift();
      mm._lastTrail = now;
    }
  }

  requestAnimationFrame(flush);

  function hookCtx(proto) {
    var _orig = proto.uniformMatrix4fv;
    proto.uniformMatrix4fv = function (loc, transpose, value) {
      if (value && value.length === 16) {
        var tx = -value[12];
        var ty = -value[13];
        var tz = -value[14];

        if (isValidWorld(tx, ty, tz) &&
            (Math.abs(tx) + Math.abs(tz)) > 1) {

          var key = Math.round(tx) + '|' +
                    Math.round(ty) + '|' +
                    Math.round(tz);

          mm._frameVotes[key] = (mm._frameVotes[key] || 0) + 1;
        }
      }
      return _orig.call(this, loc, transpose, value);
    };
  }

  if (window.WebGL2RenderingContext) hookCtx(WebGL2RenderingContext.prototype);
  if (window.WebGLRenderingContext)  hookCtx(WebGLRenderingContext.prototype);

  console.log('[MiniMap] Position hook active (stable build)');
}());