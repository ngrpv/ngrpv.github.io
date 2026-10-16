'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {G}=require('../balance-sim.js');

const CORE={R_FIO:1,R_EXP:1,R_SIGN:1};
function campaign(rules={},game=G){
  game.setRnd(()=>.25);
  game.S=game.freshState('young');game.setupRun();
  game.S.run.arcs=['razan'];game.S.run.rules={...CORE,...rules};game.S.run.events={};
  game.S.arcs={razan:{}};game.ARCS.razan.setup(game.S.arcs.razan);
  game.S.arcs.razan.days=[2,5,8];game.S.sig=['M0 0'];
  return game.S.arcs.razan;
}
function visit(n,game=G){
  game.S.day=game.S.arcs.razan.days[n];game.setDayCtx();
  game.W={time:540,processed:0,errors:0,fines:0,bribes:0,idx:0,notes:[],pirozhki:false,blogNote:false};
  game.W.specials=game.planSpecials();
  const entry=Object.values(game.W.specials).find(sp=>sp.arc==='razan');
  assert.ok(entry,'Разан должен попасть в обычную очередь');
  const v=entry.make();entry.done=true;game.W.v=v;return v;
}
function judge(v,accept){return G.judge(v,accept,accept?null:(v.viol[0]||G.activeIds()[0]));}

test('личное подтверждение позволяет законно принять первое заявление',()=>{
  const st=campaign();const v=visit(0);
  assert.deepEqual(v.viol,['R_SIGN']);assert.equal(v.bribe,undefined);
  assert.equal(v.askAlways,true);assert.match(v.askPrompt,/лично/);
  const out=G.interrogate(v,null);
  assert.equal(out.kind,'fix');assert.equal(out.rule,'R_SIGN');assert.deepEqual(v.viol,[]);
  assert.equal(st.confirmed[0],true);assert.match(v.annex.html,/подтверждено.*лично/);
  assert.equal(judge(v,true).correct,true);assert.equal(G.W.errors,0);
});

test('все восемь сочетаний решений имеют согласованные последствия',()=>{
  for(let mask=0;mask<8;mask++){
    const st=campaign({R_APPDATE:1,R_SIGMATCH:1});
    const first=visit(0);judge(first,!!(mask&1));
    const second=visit(1);
    assert.match(second.lines.intro,mask&1?/разрешение.*получили/i:/после вашего отказа.*локальном/i);
    assert.match(second.annex.html,mask&1?/Заявления отправлены в ведомства/:/12 000 заявлений остались внутри/);
    judge(second,!!(mask&2));
    G.S.day=6;G.setDayCtx();
    assert.equal(G.G.event,mask&2?'agents':null);
    const third=visit(2);
    assert.match(third.annex.html,mask&2?/Расследование провёл зарегистрированный Агент №4/:/В регистрации Агента №4 отказано/);
    if(mask&4)G.interrogate(third,null);
    const conscience=G.S.conscience;
    assert.equal(judge(third,!!(mask&4)).correct,true);
    assert.equal(st.restored,!!(mask&4));assert.equal(st.lost,!(mask&4));
    assert.equal(G.S.conscience,conscience,'У персонажа нет особой награды, влияющей на концовку');
    assert.doesNotMatch(G.W.notes.join(' '),/не смог доказать, что человек необходим/);
    assert.equal(G.checkEnd(),null);
  }
});

test('ошибки тематические и исправляются лично при разных наборах правил',()=>{
  const sets=[{}, {R_APPDATE:1}, {R_PASSNUM:1}, {R_SNILS:1,R_SNILSNUM:1}, {R_SIGMATCH:1},
    {R_APPDATE:1,R_PASSNUM:1,R_SNILS:1,R_SNILSNUM:1,R_SIGMATCH:1}];
  const allowed=['R_SIGN','R_APPDATE','R_PASSNUM','R_SNILSNUM','R_SIGMATCH'];
  for(const rules of sets)for(const n of [1,2]){
    campaign(rules);G.setRnd(()=>.1);const v=visit(n);
    assert.equal(v.viol.length,1);assert.ok(allowed.includes(v.viol[0]));
    const rule=v.viol[0],out=G.interrogate(v,rule);
    assert.equal(out.rule,rule);assert.equal(out.kind,'fix');assert.deepEqual(v.viol,[]);
    assert.equal(judge(v,true).correct,true);
  }
});

test('подтверждение доступно и при правильных документах',()=>{
  const st=campaign({R_APPDATE:1,R_SIGMATCH:1});G.setRnd(()=>.99);
  const v=visit(1);assert.deepEqual(v.viol,[]);assert.equal(v.askAlways,true);
  const out=G.interrogate(v,null);
  assert.equal(out.kind,'dodge');assert.equal(out.refreshDocs,true);assert.deepEqual(v.viol,[]);
  assert.equal(st.confirmed[1],true);assert.equal(judge(v,true).correct,true);
});

test('необоснованный отказ не превращается в оценку полезности человека',()=>{
  campaign();G.setRnd(()=>.99);const v=visit(2);assert.deepEqual(v.viol,[]);
  assert.equal(judge(v,false).correct,false);
  assert.match(G.W.notes.join(' '),/документы позволяли его принять/);
  assert.match(v.lines.no.join(' '),/ручку/);
});

test('паспорт, СНИЛС и внешность сохраняются между визитами и после загрузки',()=>{
  campaign({R_SNILS:1,R_REG:1,R_PASSNUM:1,R_SIGMATCH:1});
  const first=visit(0),p=first.docs.passport;
  const identity={pass:p.pass,birth:+p.birth,issued:+p.issued,until:+p.until,snils:first.docs.snils.num,face:JSON.stringify(first.face)};
  G.interrogate(first,null);judge(first,true);
  G.S=JSON.parse(JSON.stringify(G.S));
  for(const n of [1,2]){
    const v=visit(n);G.interrogate(v,null);
    assert.equal(v.docs.passport.pass,identity.pass);assert.equal(+v.docs.passport.birth,identity.birth);
    assert.equal(+v.docs.passport.issued,identity.issued);assert.equal(+v.docs.passport.until,identity.until);
    assert.equal(v.docs.snils.num,identity.snils);assert.equal(v.docs.application.pass,identity.pass);
    assert.equal(JSON.stringify(v.face),identity.face);assert.deepEqual(v.viol,[]);
  }
});

test('старое сохранение с четвёртым агентом продолжает работать',()=>{
  campaign();G.S.arcs.razan={days:[2,5,8],res0:'ok',plus:6,restored:false,lost:false,met:true};
  const v=visit(2);assert.match(v.annex.html,/зарегистрированный Агент №4/);
  G.interrogate(v,null);assert.ok(G.S.arcs.razan.identity);assert.equal(G.S.arcs.razan.confirmed[2],true);
});

test('пропущенные визиты не создают выдуманного разрешения или встречи',()=>{
  campaign();const second=visit(1);
  assert.match(second.lines.intro,/Я Разан Гапиров/);assert.doesNotMatch(second.lines.intro,/вашего отказа/);
  assert.match(second.annex.html,/локальный стенд/);
  campaign();const third=visit(2);
  assert.doesNotMatch(third.lines.intro,/снова/);assert.match(third.annex.html,/Отдельный агент.*не зарегистрирован/);
  assert.match(third.annex.html,/локальном стенде/);
});

test('арка не добавляет собственной концовки кампании',()=>{
  const st=campaign();G.S.loyalty=80;G.S.suspicion=0;
  assert.equal(G.ARCS.razan.final,undefined);assert.equal(G.ARCS.razan.fail,undefined);
  for(const flag of ['restored','lost']){st[flag]=true;assert.equal(G.finalEnding(),'promo');st[flag]=false;}
});


// Настоящий обработчик кнопки запускается с заглушками отрисовки и таймеров.
// Проверяем путь без найденного нарушения: раньше RULES[rule] здесь отсутствовал.
function interfaceHarness(){
  const fs=require('node:fs'),path=require('node:path');
  const nodes=new Map();
  function element(){
    const target=function(){};
    return new Proxy(target,{
      get(t,k){if(k===Symbol.toPrimitive)return()=>'';if(k==='then')return undefined;if(k in t)return t[k];return t[k]=element()},
      set(t,k,v){t[k]=v;return true},apply(){return element()}
    });
  }
  const document=element();
  document.querySelector=selector=>{if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector)};
  document.querySelectorAll=()=>[];
  const srcs=require('../tools/game-loader').scriptList();
  const code=srcs.map(file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8')).join('\n');
  const instrumentation='\nsay=async line=>{window.__OKNO_SIM__.spoken=line};hud=()=>{};setFace=()=>{};mountDocs=()=>[];rerenderDocs=()=>{window.__OKNO_SIM__.renders=(window.__OKNO_SIM__.renders||0)+1};Object.assign(window.__OKNO_SIM__,{enter,showAsk});\n';
  const window={__OKNO_SIM__:{}};
  new Function('window','document','navigator','setInterval','setTimeout','requestAnimationFrame','(()=>{\n'+code+instrumentation+'})();')(
    window,document,{},()=>0,fn=>{fn();return 0},()=>0);
  return{game:window.__OKNO_SIM__,button:document.querySelector('#b-ask')};
}

test('кнопка появляется при входе, исправляет без сверки и работает с чистым заявлением',async()=>{
  const {game,button}=interfaceHarness();campaign({},game);
  const first=visit(0,game);await game.enter(first);
  assert.equal(button.hidden,false);assert.equal(button.textContent,'Подтвердить лично');
  await button.onclick();
  assert.equal(button.hidden,true);assert.deepEqual(first.viol,[]);
  assert.equal(game.renders,1);assert.equal(game.S.arcs.razan.confirmed[0],true);
  game.setRnd(()=>.99);const clean=visit(1,game);assert.deepEqual(clean.viol,[]);
  await game.enter(clean);await button.onclick();
  assert.equal(game.renders,2);assert.match(clean.annex.html,/Теперь проверялось/);
  game.W.v={done:false,asked:false};game.showAsk();
  assert.equal(button.textContent,'Спросить','У остальных посетителей сохраняется обычная кнопка');
});
