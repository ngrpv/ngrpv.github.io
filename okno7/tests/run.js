// Проверки игры «Следующий!» без браузера и зависимостей. Запуск: node tests/run.js
// Не заменяют игру руками (вёрстка, жесты, звук), но ловят поломку логики, порядка скриптов и баланса.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGame, scriptList, ROOT } = require('../tools/game-loader');
const { runOne, G: SIM } = require('../balance-sim');

const failures = [];
let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n').join('\n       ')); }
}
function assert(c, msg) { if (!c) throw new Error(msg || 'assertion failed'); }
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* детерминированные прогоны: подменяем и Math.random, и rnd внутри игры */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function seeded(seed, fn) {
  const old = Math.random; const r = mulberry32(seed);
  Math.random = r; SIM.setRnd(r);
  try { return fn(); } finally { Math.random = old; SIM.setRnd(old); }
}
function batch(strat, role, diff, n, seed) {
  return seeded(seed, () => {
    const o = { n, days: 0, money: 0, err: 0, ends: {}, final: 0 };
    for (let i = 0; i < n; i++) {
      const r = runOne(strat, role, diff);
      o.days += r.day; o.ends[r.end] = (o.ends[r.end] || 0) + 1;
      const last = r.trace[r.trace.length - 1] || { money: 1500 };
      o.money += last.money;
      o.err += r.trace.reduce((a, t) => a + t.err, 0) / Math.max(1, r.trace.length);
      if (r.day >= 12 && !SIM.ENDINGS[r.end].fail) o.final++;
    }
    return { ...o, days: o.days / n, money: o.money / n, err: o.err / n, final: o.final / n };
  });
}

console.log('Структура');
test('все js/*.js подключены в index.html, лишних файлов нет', () => {
  const listed = scriptList().sort();
  const onDisk = fs.readdirSync(path.join(ROOT, 'js')).map(f => 'js/' + f).sort();
  assert(JSON.stringify(listed) === JSON.stringify(onDisk), 'подключено: ' + listed.join(',') + '\nна диске: ' + onDisk.join(','));
});
test('каждый скрипт — обычный (не модуль), валидный и начинается с \'use strict\'', () => {
  for (const f of scriptList()) {
    const src = read(f);
    assert(src.startsWith("'use strict';"), f + ': нет use strict в первой строке');
    new vm.Script(src, { filename: f });
  }
});
test('все файлы шрифтов из css/fonts.css существуют', () => {
  const css = read('css/fonts.css');
  const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map(m => m[1]);
  assert(urls.length >= 20, 'шрифтов подозрительно мало: ' + urls.length);
  urls.forEach(u => assert(fs.existsSync(path.join(ROOT, 'css', u)), 'нет файла ' + u));
});
test('игра не обращается к внешним серверам (только ссылки og:)', () => {
  const files = ['index.html', 'css/style.css', 'css/fonts.css', ...scriptList()];
  files.forEach(f => {
    const bad = (read(f).match(/https?:\/\/[^\s"'<>)]+/g) || []).filter(u => !/^https?:\/\/(ngrpv\.github\.io|www\.w3\.org)/.test(u));
    assert(!bad.length, f + ': ' + bad.join(', '));
  });
});
test('в index.html есть doctype, lang, viewport и описание для превью', () => {
  const h = read('index.html');
  assert(/^<!doctype html>/i.test(h) && /<html lang="ru">/.test(h) && /name="viewport"/.test(h));
  assert(/property="og:title"/.test(h) && /property="og:image"/.test(h) && /name="description"/.test(h));
});
test('картинки превью и иконка существуют', () => {
  ['og.png', 'apple-touch-icon.png'].forEach(f => assert(fs.existsSync(path.join(ROOT, f)), 'нет ' + f));
});

console.log('Данные');
test('у каждой концовки есть текст, заголовок и подсказка; порядок архива без дыр', () => {
  const E = SIM.ENDINGS;
  assert(SIM.END_ORDER.length === Object.keys(E).length, 'END_ORDER и ENDINGS расходятся');
  SIM.END_ORDER.forEach(id => { const e = E[id]; assert(e && e.k && e.h && Array.isArray(e.p) && e.p.length && e.hint, 'неполная концовка ' + id); });
});
test('у каждого пункта регламента есть формулировка и основание отказа', () => {
  Object.entries(SIM.RULES).forEach(([id, r]) => assert(r.text && r.reason, 'пункт ' + id));
});
test('знаки отличия: уникальные id, описание, проверка', () => {
  const ids = SIM.ACH.map(a => a.id);
  assert(new Set(ids).size === ids.length, 'повтор id');
  SIM.ACH.forEach(a => assert(a.t && a.d && typeof a.test === 'function' && ['day', 'final', 'end'].includes(a.when), a.id));
});
test('сложности заданы по порядку лёгкая → строгая', () => {
  const D = SIM.DIFFS;
  assert(D.easy.free > D.normal.free && D.normal.free > D.hard.free, 'free');
  assert(D.easy.fine <= D.normal.fine && D.normal.fine < D.hard.fine, 'fine');
  assert(D.easy.flaw < D.normal.flaw && D.normal.flaw < D.hard.flaw, 'flaw');
});

console.log('Смена дня');
test('одна дата — одна и та же партия (правила, события, сюжеты, газета)', () => {
  const mk = () => { SIM.S = SIM.freshState('young', 'normal'); SIM.S.daily = { key: '2026-10-16', seed: SIM.dailySeed('2026-10-16') }; SIM.withSeed(SIM.S.daily.seed, SIM.setupRun); return JSON.stringify(SIM.S.run); };
  const a = seeded(1, mk), b = seeded(999, mk);
  assert(a === b, 'партии разные');
  SIM.S.daily = { key: '2026-10-17', seed: SIM.dailySeed('2026-10-17') };
  assert(a !== seeded(1, () => { SIM.S = SIM.freshState('young', 'normal'); SIM.withSeed(SIM.dailySeed('2026-10-17'), SIM.setupRun); return JSON.stringify(SIM.S.run); }), 'разные даты дали одну партию');
});
test('одни и те же посетители у всех игроков в этот день', () => {
  const seq = rnd => seeded(rnd, () => {
    SIM.S = SIM.freshState('young', 'normal'); SIM.S.daily = { key: '2026-10-16', seed: SIM.dailySeed('2026-10-16') };
    SIM.withSeed(SIM.S.daily.seed, SIM.setupRun);
    SIM.S.day = 5; SIM.setDayCtx();
    SIM.W = { time: 540, processed: 0, errors: 0, fines: 0, bribes: 0, idx: 0, notes: [], pirozhki: false, blogNote: false };
    const out = [];
    for (let i = 1; i <= 8; i++) { SIM.W.idx = i; const v = SIM.genVisitor(); out.push([v.fio.s, v.fio.n, v.service, v.viol.join('+'), v.birth.getTime()].join('|')); }
    return out.join('\n');
  });
  assert(seq(11) === seq(22), 'посетители отличаются');
});

console.log('Разбор и знаки отличия');
test('прогон собирает статистику, разбор строится', () => {
  seeded(5, () => { runOne('sloppy', 'young', 'normal'); });
  const st = SIM.S.stats; assert(st && st.seen > 0 && st.ok + st.wrong === st.seen, 'статистика не сходится: ' + JSON.stringify(st));
  assert(st.best >= 1);
  assert(/Разбор смен/.test(SIM.reviewHtml()), 'нет блока разбора');
});
test('«Неподкупный» и «Честным трудом» не выдаются взяточнику', () => {
  const byId = id => SIM.ACH.find(a => a.id === id);
  SIM.S = SIM.freshState('young', 'normal'); SIM.S.money = 9500; SIM.S.tot.bribes = 0;
  assert(byId('incorruptible').test() && byId('honest_rich').test(), 'честный игрок знаки не получил');
  SIM.S.tot.bribes = 1; assert(!byId('incorruptible').test() && !byId('honest_rich').test(), 'взятка не отменила знаки');
  SIM.S.tot.bribes = 0; SIM.S.stats.pies = 1; assert(!byId('incorruptible').test(), 'пирожки не отменили «Неподкупного»');
});

console.log('Прохождение (детерминированные прогоны)');
const N = 60;
test('честный игрок доживает до финала почти всегда, на любой роли и сложности', () => {
  for (const role of Object.keys(SIM.ROLES)) for (const d of SIM.DIFF_ORDER) {
    const r = batch('honest', role, d, N, 100 + role.length * 7);
    assert(r.days >= 11.4, `${role}/${d}: в среднем только ${r.days.toFixed(1)} дн.`);
    assert(Number.isFinite(r.money), `${role}/${d}: деньги не число`);
  }
});
test('ленивый и «принимать всё» проигрывают, «отказывать всем» тоже', () => {
  ['lazy', 'acceptAll', 'refuseAll'].forEach(s => { const r = batch(s, 'young', 'normal', N, 7); assert(r.final < .05, `${s}: дошёл до финала в ${Math.round(r.final * 100)}%`); });
});
test('взятки платят больше, но заметно чаще заканчиваются провалом', () => {
  const h = batch('honest', 'young', 'normal', N * 4, 21), c = batch('careful', 'young', 'normal', N * 4, 21);
  assert(c.money > h.money, 'взятки не выгодны: ' + Math.round(c.money) + ' против ' + Math.round(h.money));
  assert(h.final - c.final >= .2, `честный доходит до финала в ${Math.round(h.final * 100)}%, осторожный взяточник в ${Math.round(c.final * 100)}%`);
});
test('честный труд приносит деньги (премии работают)', () => {
  const r = batch('honest', 'young', 'normal', N * 2, 33);
  assert(r.money > 7000, 'честный игрок в среднем только ' + Math.round(r.money) + ' ₽');
});
test('чем строже сложность, тем больше ошибок и меньше денег у небрежного игрока', () => {
  const e = batch('sloppy', 'young', 'easy', N * 3, 5), n = batch('sloppy', 'young', 'normal', N * 3, 5), h = batch('sloppy', 'young', 'hard', N * 3, 5);
  assert(e.err < n.err && n.err < h.err, `ошибок в день: ${e.err.toFixed(2)} / ${n.err.toFixed(2)} / ${h.err.toFixed(2)}`);
  assert(e.money > n.money && n.money > h.money, `деньги: ${Math.round(e.money)} / ${Math.round(n.money)} / ${Math.round(h.money)}`);
});
test('каждая концовка достижима', () => {
  const seen = new Set();
  const strats = ['honest', 'slow', 'lazy', 'sloppy', 'briber', 'careful', 'refuseAll', 'acceptAll', 'obedient', 'principled'];
  for (const role of Object.keys(SIM.ROLES)) for (const s of strats) for (const d of ['normal', 'hard'])
    Object.keys(batch(s, role, d, 70, 3 + role.length).ends).forEach(e => seen.add(e));
  const missing = SIM.END_ORDER.filter(id => !seen.has(id));
  assert(!missing.length, 'не встретились: ' + missing.join(', '));
});

console.log(`\nПройдено: ${passed}, провалено: ${failures.length}`);
if (failures.length) { console.log('Провалены:\n - ' + failures.join('\n - ')); process.exit(1); }
