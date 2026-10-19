'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {loadGame}=require('../tools/game-loader');
const G=loadGame();
const newWork=(plan)=>{G.W={time:540,processed:0,errors:0,fines:0,bribes:0,idx:0,notes:[],ended:false,specials:{}};if(plan!=null)G.G.plan=plan;return G.W};

test('план по дням укладывается в согласованные пределы',()=>{
  const p=G.PLAN;assert.equal(p.length,13);
  for(let d=1;d<=12;d++){assert.ok(p[d]>=3&&p[d]<=5,`день ${d}: ${p[d]}`)}
  assert.ok(p.slice(1,4).every(n=>n<=4)&&p.slice(11).every(n=>n<=4),'ранние и последние дни не больше 4');
});
test('скорость часов зависит от сложности и от акции «без очередей»',()=>{
  G.S=G.freshState('young','easy');G.setupRun();G.setDayCtx();assert.equal(G.clockSpeed(),1);
  G.S.diff='normal';G.setDayCtx();assert.equal(G.clockSpeed(),1.25);
  G.S.diff='hard';G.setDayCtx();assert.equal(G.clockSpeed(),1.5);
  G.S.diff='normal';G.S.run.events[5]='noqueue';G.S.day=5;G.setDayCtx();
  assert.equal(G.G.plan,G.PLAN[5],'акция не удваивает план');assert.equal(G.clockSpeed(),1.25*1.25);
});
test('события не меняют размер плана',()=>{
  for(const ev of ['gosu','agents','noqueue']){
    G.S=G.freshState('young','normal');G.setupRun();G.S.run.events[6]=ev;G.S.day=6;G.setDayCtx();
    assert.equal(G.G.plan,G.PLAN[6],ev);
  }
});
test('смену нельзя закончить, пока не выполнен план или остался сюжетный посетитель',()=>{
  G.S=G.freshState('young','normal');G.setupRun();G.S.day=5;G.setDayCtx();
  const w=newWork(4);w.specials={1:{arc:'x',done:true},3:{arc:'y',done:false}};
  assert.equal(G.canFinish(),false);
  w.processed=4;assert.equal(G.canFinish(),false,'сюжетный ещё не был у окна');
  w.specials[3].done=true;assert.equal(G.canFinish(),true);
  w.processed=3;assert.equal(G.canFinish(),false);
  w.processed=4;w.ended=true;assert.equal(G.canFinish(),false);
});
test('сюжетные посетители стоят внутри плана при любых сидах, ролях и сложностях',()=>{
  let checked=0,outside=0;
  for(const diff of ['easy','normal','hard'])for(let seed=0;seed<120;seed++){
    G.S=G.freshState('veteran',diff);G.setupRun({seed:'plan'+seed,arcs:[]});
    for(let day=1;day<=12;day++){
      G.S.day=day;G.setDayCtx();
      const sp=G.planSpecials();const idx=Object.keys(sp).map(Number);
      idx.forEach(i=>{checked++;if(i>=G.G.plan)outside++});
      assert.equal(new Set(idx).size,idx.length,'два посетителя на одном месте');
    }
  }
  assert.ok(checked>500);assert.equal(outside,0,`вне плана: ${outside} из ${checked}`);
});
test('кнопка «Закончить смену» компактная и не выдавливает «Следующий!» на узком экране',()=>{
  const css=require('fs').readFileSync(require('path').join(__dirname,'..','css','style.css'),'utf8');
  const rule=/\.endbtn\{([^}]*)\}/.exec(css);assert.ok(rule);
  assert.match(rule[1],/var\(--f-narrow\)/);assert.match(rule[1],/flex:0 0 clamp\(/);
});
