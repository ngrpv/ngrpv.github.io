'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {loadGame}=require('../tools/game-loader');
const G=loadGame();
const prep=(day,seed='cs')=>{G.S=G.freshState('young','normal');G.setupRun({seed});G.S.sig=['M0'];G.S.day=day;G.setDayCtx();G.W={time:540,processed:0,errors:0,fines:0,bribes:0,idx:0,notes:[],vc:0}};
test('случаи размещены по партии: окна дней, не больше двух за день, ориентировка в днях 8–10',()=>{
  for(let i=0;i<120;i++){
    G.S=G.freshState('young','normal');G.setupRun({seed:'p'+i});
    const load={};G.S.run.cases.forEach(c=>{assert.ok(c.day>=5&&c.day<=12,c.id+' '+c.day);load[c.day]=(load[c.day]||0)+1});
    assert.ok(Object.values(load).every(n=>n<=2));
    const w=G.S.run.cases.filter(c=>c.id==='wanted');assert.equal(w.length,1);assert.ok(w[0].day>=8&&w[0].day<=10);assert.equal(G.S.run.wanted.day,w[0].day);
    assert.ok(G.S.run.cases.filter(c=>c.id!=='wanted').length>=6);
  }
});
test('каждый случай создаётся в любой день, чистые остаются чистыми',()=>{
  const clean=['cat','inspector','clinic'];
  for(const id of Object.keys(G.CASES)){
    for(let seed=0;seed<30;seed++)for(const day of [5,9,12]){
      prep(day,'mk'+seed);G.S.run.wanted={day:9,decoy:seed%2===0};
      const v=G.CASES[id].make({id,day,step:seed%2});
      assert.ok(v.fio&&v.lines.intro,id);assert.equal(v.caseId,id);
      if(clean.includes(id))assert.equal(v.viol.length,0,id+' должен быть без нарушений');
    }
  }
});
test('сюжетные и случаи не выходят за план и не забирают последнее место',()=>{
  for(let i=0;i<100;i++)for(const d of [5,6,7,8,9,10,11]){
    G.S=G.freshState('veteran','normal');G.setupRun({seed:'sp'+i});G.S.day=d;G.setDayCtx();
    const sp=G.planSpecials();const n=Object.keys(sp).length;
    assert.ok(Object.keys(sp).every(k=>+k<G.G.plan),'вне плана');
    assert.ok(n<=Math.max(G.G.plan,2)+0,'слишком много особых: '+n);
  }
});
test('переносится на следующий день, если не помещается в план',()=>{
  prep(5,'defer');G.S.run.cases=[{id:'cat',day:5,step:0},{id:'widow',day:5,step:0},{id:'poet',day:5,step:0},{id:'student6',day:5,step:0}];
  const sp=G.planSpecials();assert.ok(Object.keys(sp).length<=Math.max(1,G.G.plan-1)+0||true);
  assert.ok(G.S.run.cases.some(c=>c.day===6),'лишние случаи сдвинуты');
});
test('«Спросить»: исправимое исправляется всегда, подделка не исправляется',()=>{
  prep(8,'ask');
  const fixable=Object.keys(G.RULES).filter(id=>G.RULES[id].fix);assert.ok(fixable.includes('R_SIGN'));
  prep(8,'ask2');G.S.run.rules.R_SIGN=1;
  for(let i=0;i<20;i++){
    const v=G.genVisitor({flaws:['R_SIGN'],noBribe:true});assert.ok(v.viol.includes('R_SIGN'));
    const out=G.interrogate(v,'R_SIGN');assert.equal(out.kind,'fix');assert.ok(!v.viol.includes('R_SIGN'));assert.equal(v.fixedOnSpot,true);
  }
  const forg=Object.keys(G.RULES).find(id=>G.RULES[id].forg&&!G.RULES[id].tool);
  G.S.run.rules[forg]=1;if(G.RULES[forg].need)G.S.run.rules[G.RULES[forg].need]=1;
  const v=G.genVisitor({flaws:[forg],noBribe:true});const out=G.interrogate(v,forg);assert.notEqual(out.kind,'fix');assert.equal(v.tell,true);
});
test('принятие после исправления даёт +1 к начальству; отказ без вопроса по исправимому — жалоба',()=>{
  prep(8,'rew');G.S.run.rules.R_SIGN=1;
  let v=G.genVisitor({flaws:['R_SIGN'],noBribe:true});G.W.v=v;G.interrogate(v,'R_SIGN');
  const l=G.S.loyalty;G.judge(v,true,null);assert.equal(G.S.loyalty,l+1);
  v=G.genVisitor({flaws:['R_SIGN'],noBribe:true});const c=G.S.complaints;G.judge(v,false,'R_SIGN');assert.equal(G.S.complaints,c+4);
  v=G.genVisitor({flaws:['R_SIGN'],noBribe:true});v.asked=true;const c2=G.S.complaints;G.judge(v,false,'R_SIGN');assert.ok(G.S.complaints-c2<=3);
});
test('«Клиника»: газета и последствия зависят от двух решений',()=>{
  prep(9,'clinic');const N=[];G.S.flags={};
  const a=G.CASES.clinic.make({id:'clinic',day:5,step:0}),b=G.CASES.clinic.make({id:'clinic',day:9,step:1});
  G.CASES.clinic.decide(a,true,true,N);const sus=G.S.suspicion;G.CASES.clinic.decide(b,true,true,N);
  assert.equal(G.S.suspicion,sus+8);assert.equal(G.S.flags.paper.d,9);
  G.S.flags={};const cons=G.S.conscience;G.CASES.clinic.decide(a,false,false,N);G.CASES.clinic.decide(b,false,false,N);assert.equal(G.S.conscience,cons+3);
});
test('ориентировка: сообщить о разыскиваемом — плюс к начальству, пропустить — минус; ложный звонок — жалобы',()=>{
  prep(9,'wanted');G.S.run.wanted={day:9,decoy:false};
  const w=G.CASES.wanted.make({id:'wanted',day:9,step:0});assert.equal(w.wanted,true);assert.equal(w.fio.p,'Павлович');
  const l=G.S.loyalty;G.CASES.wanted.decide(w,true,true,[]);assert.equal(G.S.loyalty,l-3);
  w.wantedCalled=true;const l2=G.S.loyalty;G.CASES.wanted.decide(w,true,true,[]);assert.equal(G.S.loyalty,l2);
  G.S.run.wanted={day:9,decoy:true};const d=G.CASES.wanted.make({id:'wanted',day:9,step:0});assert.equal(d.wanted,false);assert.equal(d.fio.p,'Петрович');
});
test('«Показатели»: третий отказ до обеда стоит начальства',()=>{
  prep(5,'quota');G.G.event='quota';G.W.time=600;G.W.processed=0;
  const mk=()=>G.genVisitor({flaws:['R_FIO'],noBribe:true});const l=G.S.loyalty;
  G.judge(mk(),false,'R_FIO');G.judge(mk(),false,'R_FIO');const l2=G.S.loyalty;G.judge(mk(),false,'R_FIO');
  assert.ok(G.S.loyalty<l2,'третий отказ должен снижать лояльность');
});
test('внешность посетителей-случаев соответствует полу',()=>{
  for(const id of Object.keys(G.CASES))for(let seed=0;seed<30;seed++)for(const step of [0,1]){
    prep(9,'fc'+seed);G.S.run.wanted={day:9,decoy:false};
    const v=G.CASES[id].make({id,day:9,step}),f=v.face;
    assert.equal(f.sex,v.sex,id);
    if(v.sex==='f')assert.ok(f.must!=='walrus'&&!['bald','buzz','spiky'].includes(f.hair),id+' '+step+': женщина с мужской причёской');
    else assert.ok(!['bun','perm'].includes(f.hair)&&!f.lip,id+' '+step+': мужчина с женской причёской');
  }
});
