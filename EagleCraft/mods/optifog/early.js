/**
 * OptiFog — early.js
 * Patches WebGL1 + WebGL2 uniform1f to reduce fog density.
 * Runs before classes.js so the patch is in place when the GL context is created.
 */
(function () {
  function patchCtx(proto) {
    const _u1f = proto.uniform1f;
    proto.uniform1f = function (loc, val) {
      // Eaglercraft passes fog density as a small positive float (typically 0.003–0.05).
      // Reducing it makes fog thinner / smoother.
      if (typeof val === 'number' && val > 0.001 && val < 0.1) {
        val = val * 0.6;
      }
      return _u1f.call(this, loc, val);
    };
  }

  if (window.WebGLRenderingContext)  patchCtx(WebGLRenderingContext.prototype);
  if (window.WebGL2RenderingContext) patchCtx(WebGL2RenderingContext.prototype);

  console.log('[OptiFog] Fog density patch active');
}());