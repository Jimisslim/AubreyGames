(function () {

  AML.on('glReady', function (gl) {
    var _uniform1f = gl.uniform1f.bind(gl);
    gl.uniform1f = function (loc, val) {

      _uniform1f(loc, val < 0.1 ? val * 0.3 : val);
    };
    console.log('[OptiFog] GL hooked');
  });

}());