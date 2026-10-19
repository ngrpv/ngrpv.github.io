// Автопрогон кампании «Следующий!» разными стратегиями.
// Берёт игровую логику из js/*.js (порядок — по index.html): генерация посетителей, проверка, решение, вечер, концовки
// и гоняет её без интерфейса. Запуск: node balance-sim.js [число_прогонов] [easy|normal|hard]
'use strict';
// Игра разложена по js/*.js; порядок файлов берём из index.html, как это делает браузер.
const { loadGame } = require('./tools/game-loader');
const load = loadGame;
const G = load();

// Сколько посетителей успевает обслужить игрок за смену (480 игровых минут без обеда).
const MIN_PER_VISITOR = { honest: 55, slow: 75, planOnly: 55, saver: 55, lazy: 160, sloppy: 45, briber: 50, careful: 55, refuseAll: 25, acceptAll: 22, obedient: 55, principled: 55 };

const STRATS = {
  // честно: видит нарушение с вероятностью detect, отказывает по верному пункту, конвертов не берёт
  honest: { detect: 0.92, bribes: false, obey: false },
  // честно, но медленно: 6 посетителей в день
  slow: { detect: 0.92, bribes: false, obey: false },
  // ленивый: 3 посетителя в день (меньше плана с третьего дня)
  lazy: { detect: 0.92, bribes: false, obey: false },
  sloppy: { detect: 0.7, bribes: false, obey: false },
  // честно, 8 человек в день, но ничего не покупает: копит на билет
  saver: { detect: 0.92, bribes: false, obey: false, saver: true },
  // честно, ровно по плану и сразу закрывает окно (досрочное завершение смены)
  planOnly: { detect: 0.92, bribes: false, obey: false },
  // берёт всё, что дают, и пропускает тех, кто дал
  briber: { detect: 0.92, bribes: true, obey: true },
  // осторожный взяточник: берёт конверты, пока ОБЭП ниже 35, пирожки не берёт, тайного покупателя узнаёт
  careful: { detect: 0.92, bribes: 'careful', obey: true },
  // всем отказывать — по первому пункту регламента
  refuseAll: { refuse: true },
  acceptAll: { accept: true },
  // честно, но слушается звонков сверху
  obedient: { detect: 0.92, bribes: false, obey: true },
  // честно, но отказывает нотариусу в последний визит, хотя документы в порядке (концовка notary)
  principled: { detect: 0.92, bribes: false, obey: false, stand: true },
};

function runOne(stratName, roleName, diffName) {
  const st = STRATS[stratName];
  G.S = G.freshState(roleName, diffName);
  G.setupRun();
  G.S.sig = ['M0 0'];
  const trace = [];
  for (let day = 1; day <= 12; day++) {
    G.S.day = day;
    G.setDayCtx();
    G.W = { time: 540, processed: 0, errors: 0, fines: 0, bribes: 0, idx: 0, notes: [], pirozhki: false, blogNote: false };
    G.W.specials = G.planSpecials();
    const n = stratName === 'planOnly' ? Math.max(G.G.plan, Math.max(-1, ...Object.keys(G.W.specials).map(Number)) + 1) : Math.floor(480 / MIN_PER_VISITOR[stratName]);
    for (let i = 0; i < n; i++) {
      const sp = G.W.specials[G.W.idx]; G.W.idx++;
      const v = G.makeQueuedVisitor(sp);
      if (sp) sp.done = true;
      if (v.role === 'finale') continue;
      // подношение
      if (v.bribe && st.bribes) {
        const careful = st.bribes === 'careful';
        if (v.bribe.shopper) { if (!careful || Math.random() < 0.3) return { end: 'shopper', day, trace }; }
        else if (!careful || (v.bribe.kind === 'cash' && (G.S.suspicion < 35 || v.arc === 'deputy'))) G.bribeState(v);
      }
      let accept, reason = null;
      if (st.accept) accept = true;
      else if (st.refuse) { accept = false; reason = G.activeIds()[0]; }
      else {
        const sees = v.viol.length && Math.random() < st.detect;
        accept = !sees;
        // исправимые недочёты честный игрок решает вопросом: заявитель исправляет, заявление принимается
        if (sees && st.detect && v.viol.every(id => G.RULES[id].fix) && !v.callWant) {
          v.asked = true;
          const out = G.interrogate(v, v.viol[0]);
          if (out.kind === 'fix' && !v.viol.length) accept = true;
          else accept = false;
        }
        if (st.obey && v.callWant) accept = v.callWant === 'accept';
        if (st.bribes && v.bribeTaken) accept = true;
        if (st.stand && v.arc === 'notary' && v.role === 'final') accept = false;
        if (!accept) reason = v.viol.length ? v.viol[0] : G.activeIds()[0];
      }
      G.judge(v, accept, reason);
    }
    G.closeMisses();
    const E = G.calcEvening();
    // вечерний выбор: честные платят за маму и кота, «всем отказывать» экономит
    if (E.dil) {
      const opts = G.dilOpts(E.dil), cash = G.eveCash(), decline = opts.find(o => o.decline);
      const pick = st.refuse || st.accept || st.saver ? decline : opts.find(o => !o.decline && !(o.cost > cash)) || decline;
      G.pickDilemma(E.dil, pick.k);
    }
    G.settleEvening();
    const S = G.S;
    trace.push({ day, money: S.money, loy: S.loyalty, com: S.complaints, sus: S.suspicion, con: S.conscience, err: G.W.errors, done: G.W.processed, plan: G.G.plan });
    // последний вечер: берущие конверты покупают билет в Ереван, если хватает
    if (day === 12 && st.bribes && S.money >= G.FLY_PRICE && Math.random() < 0.5) return { end: 'fly', day, trace };
    const end = G.checkEnd();
    if (end) return { end, day, trace };
  }
  return { end: G.finalEnding(), day: 12, trace };
}

function main() {
  const N = +process.argv[2] || 400;
  const DIFF = process.argv[3] || 'normal';
  const rows = [];
  for (const role of Object.keys(G.ROLES)) {
    for (const s of Object.keys(STRATS)) {
      const ends = {}; let money = 0, days = 0, maxSus = 0, minLoy = 0, maxCom = 0, errs = 0;
      for (let i = 0; i < N; i++) {
        const r = runOne(s, role, DIFF);
        ends[r.end] = (ends[r.end] || 0) + 1;
        const last = r.trace[r.trace.length - 1] || { money: 1500, loy: 0, com: 0, sus: 0 };
        money += last.money; days += r.day;
        maxSus += Math.max(...r.trace.map(t => t.sus), 0);
        minLoy += Math.min(...r.trace.map(t => t.loy), 100);
        maxCom += Math.max(...r.trace.map(t => t.com), 0);
        errs += r.trace.reduce((a, t) => a + t.err, 0) / Math.max(1, r.trace.length);
      }
      const top = Object.entries(ends).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${Math.round(v / N * 100)}%`).join(', ');
      rows.push({ role, s, days: (days / N).toFixed(1), money: Math.round(money / N), minLoy: Math.round(minLoy / N), maxCom: Math.round(maxCom / N), maxSus: Math.round(maxSus / N), errPerDay: (errs / N).toFixed(1), ends: top });
    }
  }
  console.log(`Прогонов на ячейку: ${N}, сложность: ${DIFF}`);
  console.log('роль       стратегия   дней  деньги  мин.лоял  макс.жалоб  макс.ОБЭП  ошиб/день  концовки');
  for (const r of rows) console.log(`${r.role.padEnd(10)} ${r.s.padEnd(11)} ${r.days.padStart(4)} ${String(r.money).padStart(7)} ${String(r.minLoy).padStart(9)} ${String(r.maxCom).padStart(11)} ${String(r.maxSus).padStart(10)} ${r.errPerDay.padStart(10)}  ${r.ends}`);
  // какие концовки вообще достижимы
  const seen = new Set(); rows.forEach(r => r.ends.split(', ').forEach(e => seen.add(e.split(' ')[0])));
  const missing = G.END_ORDER.filter(id => !seen.has(id));
  console.log('\nНе встретились ни разу:', missing.join(', ') || 'нет');
}
if (require.main === module) main();
module.exports = { runOne, G, load };
