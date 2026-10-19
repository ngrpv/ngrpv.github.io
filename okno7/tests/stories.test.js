'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('../balance-sim.js');
const G=load();
const CORE={R_FIO:1,R_EXP:1,R_SIGN:1};
const IDS=['dubov','student','it','babushka','kuzmin','zhanna','deputy','notary'];
function campaign(id,rules={}){
  G.S=G.freshState('young');G.setupRun({seed:'stories',arcs:[id]});
  G.S.run.arcs=[id];G.S.run.rules={...CORE,...rules};G.S.run.events={};G.S.sig=['M0 0'];
  return G.S.arcs[id];
}
function days(id,st){return id==='dubov'?[1,2,3]:id==='student'?[st.d0,st.d0+1,st.dl]
  :id==='kuzmin'?[st.k1,st.k2]:id==='zhanna'?[st.z]:st.days;}
function visit(id,day){
  G.S.day=day;G.setDayCtx();G.W={time:540,processed:0,errors:0,fines:0,bribes:0,idx:0,notes:[]};
  G.W.specials=G.planSpecials();
  const entry=Object.values(G.W.specials).find(x=>x.arc===id);assert.ok(entry,id+' day '+day);
  const v=G.makeQueuedVisitor(entry);entry.done=true;G.W.v=v;return v;
}
function decide(v,acc){return G.judge(v,acc,acc?null:v.viol[0]||'R_SIGN')}
function identity(v){return{birth:+v.birth,pass:v.pass,snils:v.snilsNo,place:v.place,reg:v.reg,
  issued:+v.docs.passport.issued,until:+v.docs.passport.until};}

test('все восемь историй доступны через очередь, приложение и личный вопрос',()=>{
  const firstReplies=new Set();
  for(const id of IDS){
    const st=campaign(id),v=visit(id,days(id,st)[0]);
    assert.equal(v.askAlways,true);assert.ok(v.askPrompt);assert.ok(v.annex);
    const docs=G.renderDocs(v);assert.equal(docs.at(-1).k,'annex');assert.match(docs.at(-1).html,/d-annex/);
    const before=JSON.stringify(v.docs),viol=[...v.viol],reply=G.interrogate(v,null);
    assert.equal(reply.kind,'dodge');assert.ok(reply.line.length>80,id);
    assert.equal(JSON.stringify(v.docs),before);assert.deepEqual(v.viol,viol);
    firstReplies.add(reply.line);
  }
  assert.equal(firstReplies.size,IDS.length);
});

test('паспорта повторных посетителей переживают загрузку и постороннюю очередь',()=>{
  for(const id of IDS.filter(x=>x!=='zhanna')){
    const st=campaign(id,{R_SNILS:1,R_REG:1,R_SNILSNUM:1});
    const ds=days(id,st),a=visit(id,ds[0]),expected=identity(a),face=JSON.stringify(a.face);
    decide(a,false);G.S=JSON.parse(JSON.stringify(G.S));
    for(let i=0;i<7;i++)G.genVisitor();
    const b=visit(id,ds[1]);assert.deepEqual(identity(b),expected,id);assert.equal(JSON.stringify(b.face),face,id);
    if(!b.viol.includes('R_PASSNUM'))assert.equal(b.docs.application.pass,expected.pass);
    if(b.docs.snils)assert.equal(b.docs.snils.num,expected.snils);
    else assert.ok(b.viol.includes('R_SNILS'));
    if(!b.viol.includes('R_BIRTH'))assert.equal(+b.docs.application.birth,expected.birth);
  }
});

test('старая партия без новых полей получает историю при следующем визите',()=>{
  for(const id of IDS){
    const st=campaign(id);delete st.storyResults;delete st.identity;
    const ds=days(id,st),v=visit(id,ds.at(-1));
    assert.ok(v.annex);assert.ok(G.interrogate(v,null).line);assert.ok(st.identity);
    decide(v,false);assert.equal(st.storyResults[v.storyStep],'no');
  }
});

test('отказы, принятия и пропуски меняют следующий визит без выдуманной регистрации',()=>{
  for(const id of ['babushka','kuzmin','deputy','notary'])for(const result of ['ok','no','missed']){
    const st=campaign(id),ds=days(id,st);
    if(result!=='missed')decide(visit(id,ds[0]),result==='ok');
    G.S=JSON.parse(JSON.stringify(G.S));
    const v=visit(id,ds[1]),intro=v.lines.intro;
    assert.equal(v.storyStep,id==='kuzmin'?2:1);
    if(result==='ok')assert.match(intro,/приняли|вашей выписке|справке встречу|регистрацию приобщили/);
    else if(result==='no')assert.match(intro,/переделываем|не получили|без вашей справки|отказ обжалуем/);
    else assert.doesNotMatch(intro,/бумагу у нас приняли|вашей выписке|вашей справке|регистрацию приобщили|Предыдущий отказ/);
  }
});

test('первый разговор после пропусков соответствует сроку, а не числу состоявшихся встреч',()=>{
  for(const id of ['student','it','babushka','notary']){
    const st=campaign(id),ds=days(id,st),v=visit(id,ds.at(-1));
    assert.equal(v.storyStep,ds.length-1,id);assert.doesNotMatch(v.lines.intro,/Снова|снова|по тому же доверителю/);
    assert.match(v.lines.intro,id==='student'?/Сегодня комиссия/:id==='it'?/последний слот/:id==='babushka'?/Отчёт/:/Малышеву/);
  }
});

test('Лиза после отчисления сохраняет личность, меняет одежду и продолжает свой проект',()=>{
  const st=campaign('student');let first;
  for(const d of days('student',st)){const v=visit('student',d);first||=identity(v);decide(v,false)}
  assert.equal(st.expelled,true);G.S=JSON.parse(JSON.stringify(G.S));
  const v=visit('student',st.dl+2);assert.equal(v.role,'courier');assert.deepEqual(identity(v),first);
  assert.equal(v.face.clo,'courier');assert.match(v.annex.html,/восстановление|восстановления/);
  assert.match(G.interrogate(v,null).line,/подпись моя/);
  decide(v,true);assert.match(G.W.notes.join(' '),/восстановление/);
});

test('личный вопрос не лишает обычного исправления подписи по найденному нарушению',()=>{
  campaign('dubov');const v=visit('dubov',1);assert.deepEqual(v.viol,['R_SIGN']);
  G.interrogate(v,null);assert.deepEqual(v.viol,['R_SIGN']);
  G.setRnd(()=>.1);const fixed=G.interrogate(v,'R_SIGN');
  assert.equal(fixed.kind,'fix');assert.deepEqual(v.viol,[]);assert.equal(decide(v,true).correct,true);
});

test('сюжетные приложения сохраняют регламент, конверты и давление начальства',()=>{
  for(const id of ['kuzmin','zhanna','deputy','notary']){
    const st=campaign(id),d=days(id,st).at(-1),v=visit(id,d);
    if(id==='notary'){
      assert.deepEqual(v.viol,[]);assert.equal(v.bribe.amount,10000);assert.equal(v.callWant,'accept');
      assert.match(v.annex.html,/дочери/);assert.equal(decide(v,false).correct,false);assert.equal(st.blocked,true);
    }else{
      assert.ok(v.viol.length);if(id==='deputy')assert.equal(v.bribe.amount,15000);
      else assert.equal(v.callWant,'accept');
      assert.equal(decide(v,true).correct,false);
    }
  }
  const st=campaign('babushka'),v=visit('babushka',st.days[0]);
  assert.equal(v.bribe.kind,'food');G.bribeState(v);assert.equal(st.pies,1);assert.equal(G.S.stats.pies,1);
});

test('истории и документы воспроизводятся при одинаковом сиде и после повторного старта',()=>{
  function play(){
    const st=campaign('babushka'),out=[];
    for(const d of st.days){const v=visit('babushka',d);out.push({intro:v.lines.intro,annex:v.annex,docs:v.docs,ask:G.interrogate(v,null)});decide(v,true)}
    return JSON.stringify(out);
  }
  assert.equal(play(),play());
});
