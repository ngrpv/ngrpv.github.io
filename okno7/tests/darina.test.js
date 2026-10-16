'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {G}=require('../balance-sim.js');
const CORE={R_FIO:1,R_EXP:1,R_SIGN:1};
function campaign(rules={},arcs=['darina']){
  G.setRnd(()=>.25);G.S=G.freshState('young');G.setupRun({arcs});
  G.S.run.rules={...CORE,...rules};G.S.run.events={};G.S.arcs.darina.days=[3,6,9];
  G.S.sig=['M0 0'];return G.S.arcs.darina;
}
function visit(n){
  G.S.day=G.S.arcs.darina.days[n];G.setDayCtx();
  G.W={time:540,processed:0,errors:0,fines:0,bribes:0,idx:0,notes:[],pirozhki:false,blogNote:false};
  G.W.specials=G.planSpecials();const entry=Object.values(G.W.specials).find(sp=>sp.arc==='darina');
  assert.ok(entry);const v=entry.make();entry.done=true;G.W.v=v;return v;
}
function judge(v,accept){return G.judge(v,accept,accept?null:(v.viol[0]||G.activeIds()[0]));}

test('три разных обращения появляются в обычной очереди, без взяток и привилегий',()=>{
  const st=campaign();
  const services=new Set();
  for(const n of [0,1,2]){
    const v=visit(n);services.add(v.service);
    assert.equal(v.s,'Сафонова');assert.equal(v.n,'Дарина');
    assert.equal(v.bribe,undefined);assert.equal(v.callWant,undefined);assert.equal(v.askAlways,true);
    assert.deepEqual(v.viol,[]);assert.equal(judge(v,true).correct,true);
    assert.equal(st.results[n],'ok');
  }
  assert.equal(services.size,3);assert.equal(G.S.conscience,0);
  assert.equal(G.ARCS.darina.final,undefined);assert.equal(G.ARCS.darina.fail,undefined);
});

test('просроченная дополнительная справка обнаруживается только по действующему правилу',()=>{
  campaign({R_ZHIV:1,R_ZHIV_OLD:1});G.setRnd(()=>.1);
  const v=visit(0);assert.deepEqual(v.viol,['R_ZHIV_OLD']);
  assert.match(v.pleadFor('R_ZHIV_OLD'),/собирала остальные документы/);
  const oldDate=+v.docs.zhiv.issued,out=G.interrogate(v,'R_ZHIV_OLD');
  assert.equal(out.kind,'dodge');assert.equal(+v.docs.zhiv.issued,oldDate);
  assert.equal(judge(v,false).correct,true);assert.match(G.W.notes.join(' '),/обновлять/);
  campaign({R_ZHIV:1,R_ZHIV_OLD:8});G.setRnd(()=>.1);
  assert.deepEqual(visit(0).viol,[]);
});

test('дата из карточки клиента исправляется на месте, состояние и приложение обновляются',()=>{
  const st=campaign({R_APPDATE:1});G.setRnd(()=>.1);const v=visit(1);
  assert.deepEqual(v.viol,['R_APPDATE']);assert.match(v.annex.html,/перенесена в дату заявления/);
  assert.match(v.annex.html,/тренировок: 0/);
  const out=G.interrogate(v,'R_APPDATE');assert.equal(out.kind,'fix');assert.equal(out.rule,'R_APPDATE');
  assert.deepEqual(v.viol,[]);assert.equal(st.clubFixed,true);
  assert.equal(+v.docs.application.date,+G.G.today);assert.match(v.annex.html,/исправлена заявителем/);
  assert.equal(judge(v,true).correct,true);
});

test('принятие, отказ и пропуск первого визита учитываются при следующей встрече',()=>{
  for(const accept of [true,false]){
    campaign();judge(visit(0),accept);const v=visit(1);
    assert.match(v.lines.intro,accept?/Со справкой разобралась/:/Со справкой ещё разбираюсь/);
  }
  const st=campaign();G.S.day=3;G.ARCS.darina.miss(st);
  assert.equal(st.results[0],'missed');
  assert.doesNotMatch(visit(1).lines.intro,/Со справкой разобралась/);
  campaign();assert.doesNotMatch(visit(2).lines.intro,/Снова/);
});

test('восемь сочетаний решений сохраняют результаты каждого обращения',()=>{
  for(let mask=0;mask<8;mask++){
    const st=campaign();
    for(const n of [0,1,2]){const v=visit(n);judge(v,!!(mask&(1<<n)))}
    assert.deepEqual(st.results,[0,1,2].map(n=>mask&(1<<n)?'ok':'no'));
    assert.match(G.W.notes.join(' '),mask&4?/запись.*исправили/:/осталась открытой/);
  }
});

test('четвёртый агент упоминается после регистрации и до этого отсутствует',()=>{
  campaign({},['darina','razan']);const r=G.S.arcs.razan;
  r.plus=0;let v=visit(1);assert.doesNotMatch(v.annex.html,/агентом №4/);
  r.plus=7;v=visit(1);assert.doesNotMatch(v.annex.html,/агентом №4/);
  r.plus=5;v=visit(1);assert.match(v.annex.html,/агентом №4/);
});

test('история работает самостоятельно, при отказе Разану и после блокировки его проекта',()=>{
  campaign({R_APPDATE:1});G.setRnd(()=>.99);let v=visit(1);
  assert.match(v.annex.html,/сформирован локально/);assert.match(G.interrogate(v,null).line,/Вечером покажу/);
  campaign({},['darina','razan']);const r=G.S.arcs.razan;r.res0='no';v=visit(1);
  assert.match(v.annex.html,/автоматическая отправка не использовалась/);
  r.lost=true;assert.match(G.interrogate(v,null).line,/тоже заполняет от руки/);
  r.lost=false;r.restored=true;assert.match(G.interrogate(v,null).line,/доступ к проекту вернул/);
});

test('личность сохраняется после загрузки, рабочий бейдж не попадает в паспорт',()=>{
  campaign({R_SNILS:1,R_REG:1});const first=visit(0);
  const identity={pass:first.pass,birth:+first.birth,snils:first.snilsNo,face:JSON.stringify(first.face)};
  G.S=JSON.parse(JSON.stringify(G.S));const work=visit(1);
  assert.equal(work.pass,identity.pass);assert.equal(+work.birth,identity.birth);assert.equal(work.snilsNo,identity.snils);
  assert.equal(work.face.badge,'ДАРИНА');assert.equal(work.photoFace.badge,undefined);
  assert.match(G.faceSVG(work.face),/staff-badge/);assert.match(G.faceSVG(work.face),/АДМИНИСТРАТОР/);
  assert.doesNotMatch(G.faceSVG(work.photoFace),/staff-badge/);
  const third=visit(2);assert.equal(third.face.badge,undefined);assert.equal(JSON.stringify(third.face),identity.face);
  const docs=G.renderDocs(third);assert.equal(docs.at(-1).label,'Приказ');assert.match(docs.at(-1).html,/практику считать завершённой/);
  assert.deepEqual(third.viol,[]);
});

test('дни трёх визитов укладываются в кампанию',()=>{
  for(let seed=0;seed<100;seed++){
    G.S=G.freshState('young');G.setupRun({seed:String(seed),arcs:['darina']});
    const days=G.S.arcs.darina.days;assert.equal(days.length,3);
    assert.ok(days[0]>=2);assert.ok(days[2]<=11);assert.equal(days[1]-days[0],3);assert.equal(days[2]-days[1],3);
  }
});
