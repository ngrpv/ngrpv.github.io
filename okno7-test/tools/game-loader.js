// Загружает игровую логику из js/*.js (порядок — по index.html) в Node без браузера.
// Нужен симулятору баланса и тестам: DOM заменён заглушкой, таймеры отключены.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function scriptList() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1].split('?')[0]);
}

// Заглушка DOM: любой элемент принимает любые свойства и вызовы.
function el() {
  const f = function () {};
  return new Proxy(f, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => '';
      if (k === 'then') return undefined;
      if (k in t) return t[k];
      return (t[k] = el());
    },
    set(t, k, v) { t[k] = v; return true; },
    apply() { return el(); },
  });
}

function loadGame(search = '') {
  const script = '(()=>{\n' + scriptList().map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + '\n})();';
  const document = el();
  document.querySelectorAll = () => [];
  const localStore = {};
  const window = { __OKNO_SIM__: {}, location: { search } };
  const navigator = {};
  const noop = () => 0;
  new Function('window', 'document', 'navigator', 'setInterval', 'setTimeout', 'requestAnimationFrame', script)(
    window, document, navigator, noop, noop, noop);
  return window.__OKNO_SIM__;
}

module.exports = { loadGame, scriptList, ROOT };
