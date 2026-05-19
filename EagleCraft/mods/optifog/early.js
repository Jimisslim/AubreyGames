(function () {
  function patchCtx(proto) {
    const _u1f = proto.uniform1f;
    proto.uniform1f = function (loc, val) {

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