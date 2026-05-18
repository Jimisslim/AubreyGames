/**
 * eaglemods_bootstrap.js
 * Place as the FIRST <script> in EagleCraft/index.html.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'eaglemods_active';

  var mods = [];
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    mods = JSON.parse(raw);
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) { return; }

  if (!Array.isArray(mods) || !mods.length) return;

  function injectScript(name, code, phase) {
    try {
      var el = document.createElement('script');
      el.type = 'text/javascript';
      el.text = '(function(){\n' + code + '\n})();';
      el.setAttribute('data-eaglemod', name);
      el.setAttribute('data-phase', phase);
      (document.head || document.documentElement).appendChild(el);
    } catch (e) {}
  }

  // Early phase — synchronous, before classes.js runs
  mods.forEach(function (mod) {
    if (mod.earlyCode) injectScript(mod.name, mod.earlyCode, 'early');
  });

  // Code phase — after DOM ready
  var lateInject = function () {
    mods.forEach(function (mod) {
      if (mod.code) injectScript(mod.name, mod.code, 'code');
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', lateInject);
  } else {
    lateInject();
  }

}());