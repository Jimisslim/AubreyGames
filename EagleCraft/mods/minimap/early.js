/**
 * MiniMap — early.js (stable build)
 * Collects matrix votes per animation frame, picks the winner,
 * and rejects any position that jumps too far (entity/hand matrices).
 */
(function () {

  window.__eagleMinimap = {
    x: 0, y: 64, z: 0,
    trail: [],
    maxTrail: 4000,
    _lastTrail: 0,
    _frameVotes: {},
    _locked: false,   // true once we have a first real fix
    _prev: null
  };

  var mm = window.__eagleMinimap;

  function isValidWorld(x, y, z) {
    return isFinite(x) && isFinite(y) && isFinite(z) &&
           Math.abs(x) < 29999999 &&
           Math.abs(z) < 29999999 &&
           y > -200 && y < 500;
  }

  // ── Per-frame vote flush via rAF ─────────────────────────────────────────
  function flush() {
    requestAnimationFrame(flush);

    var votes = mm._frameVotes;
    mm._frameVotes = {};

    // Find the key with the most votes this frame
    var best = null, bestCount = 0;
    for (var k in votes) {
      if (votes[k] > bestCount) { bestCount = votes[k]; best = k; }
    }

    // Need at least 4 agreeing submissions — rules out lone entity matrices
    if (!best || bestCount < 4) return;

    var parts = best.split('|');
    var nx = parseFloat(parts[0]);
    var ny = parseFloat(parts[1]);
    var nz = parseFloat(parts[2]);

    // ── Reject teleports ────────────────────────────────────────────────
    if (mm._prev) {
      var dx = nx - mm._prev.x;
      var dz = nz - mm._prev.z;
      // Players move at most ~10 blocks between frames at sprint speed
      if (Math.sqrt(dx * dx + dz * dz) > 10) return;
    }

    mm.x = nx;
    mm.y = ny;
    mm.z = nz;
    mm._prev   = { x: nx, z: nz };
    mm._locked = true;

    // Record trail point every 1 s
    var now = performance.now();
    if (now - mm._lastTrail > 1000) {
      mm.trail.push({ x: nx, z: nz });
      if (mm.trail.length > mm.maxTrail) mm.trail.shift();
      mm._lastTrail = now;
    }
  }

  requestAnimationFrame(flush);

  // ── Hook WebGL matrix uploads ────────────────────────────────────────────
  function hookCtx(proto) {
    var _orig = proto.uniformMatrix4fv;
    proto.uniformMatrix4fv = function (loc, transpose, value) {
      if (value && value.length === 16) {
        // Column-major mat4: camera translation = -[12], -[13], -[14]
        var tx = -value[12];
        var ty = -value[13];
        var tz = -value[14];

        if (isValidWorld(tx, ty, tz) &&
            // Ignore pure-identity-ish matrices (GUI, HUD)
            (Math.abs(tx) + Math.abs(tz)) > 1) {

          // Round to 1 block so nearby submissions cluster into the same key
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