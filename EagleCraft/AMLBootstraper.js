var _log = window.console.log.bind(window.console);
var _warn = window.console.warn.bind(window.console);
window.__amlLog = _log;

(function () {
  'use strict';

  var STORAGE_KEY = 'eaglemods_active';

  /* ── Load mod payload ─────────────────────────────────────── */
  var mods = [];
try {
  var raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  mods = JSON.parse(raw);
  // ADD THIS ↓
  AML.mods = mods;
  localStorage.removeItem(STORAGE_KEY);
} catch (e) { return; }
if (!Array.isArray(mods) || !mods.length) return;

  /* ── AML API surface ──────────────────────────────────────── */
  var _frameCallbacks  = [];
  var _keyBindings     = {};   // 'KeyW' -> [fn, ...]
  var _eventListeners  = {};   // 'chat' | 'tick' -> [fn, ...]
  var _glCtx           = null;
  var _overlayCanvas   = null;
  var _overlayCtx      = null;

  window.AML = {

    /** Register a callback that fires every animation frame.
     *  cb(deltaMs: number, totalMs: number) */
    onFrame: function (cb) { _frameCallbacks.push(cb); },

    /** Get the live WebGL context (null until the game creates its canvas). */
    gl: function () { return _glCtx; },

    /** Register a keybind.  key = KeyboardEvent.code string e.g. 'KeyF'.
     *  cb fires on keydown.  Returns an unregister fn. */
    addKeybind: function (key, cb) {
      if (!_keyBindings[key]) _keyBindings[key] = [];
      _keyBindings[key].push(cb);
      return function () {
        _keyBindings[key] = _keyBindings[key].filter(function (f) { return f !== cb; });
      };
    },

    /** Subscribe to named AML events: 'chat', 'tick', 'glReady', 'modLoaded'.
     *  Returns an unsubscribe fn. */
    on: function (event, cb) {
      if (!_eventListeners[event]) _eventListeners[event] = [];
      _eventListeners[event].push(cb);
      return function () {
        _eventListeners[event] = (_eventListeners[event] || []).filter(function (f) { return f !== cb; });
      };
    },

    /** Get (or lazily create) a 2-D overlay canvas that sits on top of the game. */
    overlay: function () {
      if (_overlayCtx) return _overlayCtx;
      _overlayCanvas = document.createElement('canvas');
      _overlayCanvas.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'pointer-events:none;z-index:9999;';
      document.body.appendChild(_overlayCanvas);
      function resize() {
        _overlayCanvas.width  = window.innerWidth;
        _overlayCanvas.height = window.innerHeight;
      }
      resize();
      window.addEventListener('resize', resize);
      _overlayCtx = _overlayCanvas.getContext('2d');
      return _overlayCtx;
    },

    /** Emit an AML event (mods can talk to each other). */
    emit: function (event, data) {
      (_eventListeners[event] || []).forEach(function (cb) {
        try { cb(data); } catch (e) { console.warn('[AML] event error:', e); }
      });
    },

    /** Tiny mod-to-mod shared store. */
    store: {},
    mods: [],
    setOverlayInteractive: function (on) {
    if (_overlayCanvas) _overlayCanvas.style.pointerEvents = on ? 'auto' : 'none';
  },
  };

  /* ── Hook: WebGL context capture ─────────────────────────── */
  var _origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, opts) {
    var ctx = _origGetContext.call(this, type, opts);
    if (ctx && !_glCtx && (type === 'webgl' || type === 'experimental-webgl' || type === 'webgl2')) {
      _glCtx = ctx;
      AML.emit('glReady', ctx);
    }
    return ctx;
  };

  /* ── Hook: Frame loop ─────────────────────────────────────── */
  var _startTime = null;
  var _lastTime  = null;
  var _origRAF   = window.requestAnimationFrame;
  window.requestAnimationFrame = function (cb) {
    return _origRAF.call(window, function (ts) {
      if (!_startTime) { _startTime = ts; _lastTime = ts; }
      var delta = ts - _lastTime;
      _lastTime = ts;
      _frameCallbacks.forEach(function (fn) {
        try { fn(delta, ts - _startTime); } catch (e) {}
      });
      cb(ts);
    });
  };

  /* ── Hook: Keyboard input ─────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    (_keyBindings[e.code] || []).forEach(function (fn) {
      try { fn(e); } catch (err) {}
    });
  }, true);   // capture phase — fires before the game sees it

  /* ── Inject scripts ───────────────────────────────────────── */
  function injectScript(name, code, phase) {
    try {
      var el = document.createElement('script');
      el.type = 'text/javascript';
      el.text = '(function(){\n' + code + '\n})();';
      el.setAttribute('data-eaglemod', name);
      el.setAttribute('data-phase', phase);
      (document.head || document.documentElement).appendChild(el);
      AML.emit('modLoaded', { name: name, phase: phase });
    } catch (e) {
      console.warn('[AML] Failed to inject', name, e);
    }
  }

  // Early phase — runs synchronously now, before classes.js
  mods.forEach(function (mod) {
    if (mod.earlyCode) injectScript(mod.name, mod.earlyCode, 'early');
  });

  // Code phase — after DOM ready
  function lateInject() {
    mods.forEach(function (mod) {
      if (mod.code) injectScript(mod.name, mod.code, 'code');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', lateInject);
  } else {
    lateInject();
  }

}());