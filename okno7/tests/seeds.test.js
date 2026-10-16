'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {G,load}=require('../balance-sim.js');
function fresh(options){G.S=G.freshState('young');G.setupRun(options);return G.S;}
function visitorSnapshot(v){return{seed:v.seed,fio:v.fio,birth:+v.birth,pass:v.pass,snils:v.snilsNo,face:v.face,docs:v.docs,viol:v.viol,intro:v.lines.intro,annex:v.annex};}
function nextDay(){G.S.day=4;G.setDayCtx();G.W={time:540,processed:0,errors:0,fines:0,bribes:0,idx:0,notes:[]};G.W.specials=G.planSpecials();return G.W;}

test('URL принимает явный выбор арок и сид, включая несколько параметров',()=>{
  assert.deepEqual(G.readRunOptions('?seed=1042&arcs=razan,darina&arcs=student'),{seed:'1042',arcs:['razan','darina','student']});
  assert.deepEqual(G.readRunOptions(''),{seed:null,arcs:[]});
  assert.equal(G.readRunOptions('?seed=0').seed,'0');
});

test('принудительные арки валидируются, не дублируются и сохраняют размер партии',()=>{
  const s=fresh({arcs:[' RAZAN ','darina','darina','missing','__proto__','constructor']});
  assert.ok(s.run.arcs.includes('razan'));assert.ok(s.run.arcs.includes('darina'));
  assert.equal(new Set(s.run.arcs).size,s.run.arcs.length);assert.ok(s.run.arcs.length>=2&&s.run.arcs.length<=3);
  assert.ok(!s.run.arcs.includes('missing'));assert.ok(s.arcs.razan);assert.ok(s.arcs.darina);
  assert.equal(fresh({arcs:['razan','darina','student','dubov']}).run.arcs.length,3);
});

test('одинаковый сид повторяет правила, события, арки и их даты',()=>{
  const first=JSON.stringify(fresh({seed:'10132'}));
  assert.equal(JSON.stringify(fresh({seed:'10132'})),first);
  assert.notEqual(JSON.stringify(fresh({seed:'10133'})),first);
  assert.equal(fresh({seed:0}).run.seed,'0');
});

test('сид повторяет документы посетителей и распределение особых посетителей',()=>{
  function snapshot(){fresh({seed:'10132'});nextDay();return{queue:Object.keys(G.W.specials),visitors:Array.from({length:5},()=>visitorSnapshot(G.genVisitor()))};}
  assert.deepEqual(snapshot(),snapshot());
});

test('сохранение и повтор дня восстанавливают последовательность случайных событий',()=>{
  fresh({seed:'10132'});nextDay();const saved=JSON.parse(JSON.stringify(G.S));
  const expected=[visitorSnapshot(G.genVisitor()),visitorSnapshot(G.genVisitor())];
  G.S=JSON.parse(JSON.stringify(saved));
  const replay=[visitorSnapshot(G.genVisitor()),visitorSnapshot(G.genVisitor())];
  assert.deepEqual(replay,expected);
});

test('старое сохранение без сида продолжает генерировать посетителей',()=>{
  fresh({});delete G.S.run.seed;delete G.S.run.rng;nextDay();
  assert.ok(G.genVisitor().docs.passport);assert.ok(G.planSpecials());
});

test('неподписанные числовые ссылки содержат нужные арки без явного arcs',()=>{
  for(const [seed,includes,excludes] of [
    ['10000',['darina'],['razan']],['10002',['darina'],['razan']],
    ['10005',['razan'],['darina']],['10013',['razan'],['darina']],
    ['10008',['darina','razan'],[]],['10132',['darina','razan'],[]]
  ]){
    const opt=G.readRunOptions('?seed='+seed),s=fresh(opt);assert.deepEqual(opt.arcs,[]);
    for(const id of includes)assert.ok(s.run.arcs.includes(id),seed+' должен включать '+id);
    for(const id of excludes)assert.ok(!s.run.arcs.includes(id),seed+' не должен включать '+id);
  }
});


test('новая игра читает параметры непосредственно из URL окна браузера',()=>{
  for(const [query,expected] of [['?arcs=darina',['darina']],['?arcs=razan,darina',['razan','darina']],['?seed=10132',['razan','darina']]]){
    const game=load(query);game.S=game.freshState('young');game.setupRun();
    for(const id of expected)assert.ok(game.S.run.arcs.includes(id),query);
    if(query.includes('seed'))assert.equal(game.S.run.seed,'10132');
  }
});


test('сюжетный сид 90201 открывает медицинскую ошибку, дату и раннюю развязку Разана',()=>{
  const s=fresh({seed:'90201'}),d=s.arcs.darina,r=s.arcs.razan;
  assert.deepEqual(d.days,[4,7,10]);assert.deepEqual(r.days,[2,4,6]);
  assert.ok(s.run.rules.R_ZHIV<=d.days[0]);assert.ok(s.run.rules.R_ZHIV_OLD<=d.days[0]);
  assert.ok(s.run.rules.R_APPDATE<=d.days[1]);assert.ok(r.days[2]<d.days[1]);
  for(const state of ['restored','lost']){
    G.S=JSON.parse(JSON.stringify(s));G.S.arcs.razan.plus=5;G.S.arcs.razan[state]=true;
    G.S.day=4;G.setDayCtx();G.W={idx:3,notes:[]};
    let v=G.ARCS.darina.visits(4,G.S.arcs.darina)[0].make();assert.ok(v.viol.includes('R_ZHIV_OLD'));
    G.S.day=7;G.setDayCtx();G.W.idx=7;v=G.ARCS.darina.visits(7,G.S.arcs.darina)[0].make();
    assert.ok(v.viol.includes('R_APPDATE'));assert.match(v.annex.html,/агентом №4/);
    const reply=G.interrogate(v,'R_APPDATE');assert.equal(reply.kind,'fix');
    assert.match(reply.line,state==='restored'?/доступ к проекту вернул/:/тоже заполняет от руки/);
  }
});

test('сюжетные ошибки сидов не зависят от роли, позиции в очереди и посторонних случайных действий',()=>{
  for(const seed of ['90201','21967','6220'])for(const role of Object.keys(G.ROLES)){
    G.S=G.freshState(role);G.setupRun({seed});
    for(const n of [0,1]){
      G.S.day=G.S.arcs.darina.days[n];G.setDayCtx();
      G.W={idx:1,notes:[]};const make=()=>G.ARCS.darina.visits(G.S.day,G.S.arcs.darina)[0].make();
      let v=make();assert.ok(v.viol.includes(n===0?'R_ZHIV_OLD':'R_APPDATE'),seed+' '+role+' '+n);
      G.W.idx=8;for(let i=0;i<5;i++)G.genVisitor();
      v=make();assert.ok(v.viol.includes(n===0?'R_ZHIV_OLD':'R_APPDATE'));
    }
  }
});

test('параметры URL не изменяют общую Смену дня',()=>{
  function daily(query){const game=load(query);game.S=game.freshState('young');game.S.daily={key:'2026-10-16',seed:game.dailySeed('2026-10-16')};game.withSeed(game.S.daily.seed,game.setupRun);return JSON.stringify(game.S.run)}
  assert.equal(daily(''),daily('?seed=90201&arcs=razan,darina'));
});
