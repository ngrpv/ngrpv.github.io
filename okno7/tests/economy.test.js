'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {loadGame}=require('../tools/game-loader');
const G=loadGame();
function evening(day,money=3000,role='young'){
  G.S=G.freshState(role,'normal');G.setupRun({seed:'eco'+day});G.S.day=day;G.S.money=money;G.setDayCtx();
  G.W={time:540,processed:G.G.plan,errors:0,fines:0,bribes:0,idx:0,notes:[]};
  return G.calcEvening();
}
test('улучшения предлагаются на 4 и 7 вечер, операция — на 6 или 8, ничто не делит вечер',()=>{
  for(let i=0;i<80;i++){
    G.S=G.freshState('young','normal');G.setupRun({seed:'sch'+i});
    const D=G.S.run.dilemmas;assert.equal(D[4],'tool');assert.equal(D[7],'tool2');
    const op=Object.keys(D).filter(d=>D[d]==='op');assert.ok(op.length<=1);if(op.length)assert.ok(['6','8'].includes(op[0]));
    Object.keys(D).forEach(d=>assert.ok(+d>=3&&+d<=10,'день '+d));
  }
});
test('покупка вычитает деньги, зубы маме снижают расход на лекарства',()=>{
  evening(4);assert.equal(G.E.dil,'tool');
  const before=G.S.money;G.pickDilemma('tool','b');
  assert.equal(G.S.money,before-1800);assert.equal(G.S.upg.teeth,1);
  assert.equal(G.calcEvening().mama,-100);
});
test('второй вечер предлагает только то, чего ещё нет, и дороже на 20%',()=>{
  evening(4);G.pickDilemma('tool','a');
  G.S.day=7;G.setDayCtx();G.W={time:540,processed:4,errors:0,fines:0,bribes:0,idx:0,notes:[]};G.calcEvening();
  const o=G.dilOpts('tool2');assert.deepEqual(o.map(x=>x.k),['b','c']);assert.equal(o[0].cost,2160);
  G.pickDilemma('tool2','b');G.calcEvening();assert.equal(G.E.dil,null,'всё куплено — предложения нет');
});
test('операция: сразу без наценки, рассрочка — 8 400 ₽ с взносом, отказ ничего не стоит',()=>{
  evening(6,9000);G.S.run.dilemmas[6]='op';G.calcEvening();
  const m=G.S.money;G.pickDilemma('op','a');assert.equal(G.S.money,m-8000);assert.ok(!G.S.debt);
  evening(6,2000);G.S.run.dilemmas[6]='op';G.calcEvening();
  G.pickDilemma('op','b');const dep=G.S.debt.left;assert.ok(G.S.money<2000&&dep>0);assert.equal(dep+(2000-G.S.money),8400);
  G.S.day=7;G.setDayCtx();G.W={time:540,processed:4,errors:0,fines:0,bribes:0,idx:0,notes:[]};assert.equal(G.calcEvening().loan,-500);
  G.settleEvening();assert.equal(G.S.debt.left,dep-500);
  evening(6,2000);G.S.run.dilemmas[6]='op';G.calcEvening();const m2=G.S.money;G.pickDilemma('op','c');assert.equal(G.S.money,m2);assert.equal(G.S.mamaSick,true);
});
test('старая рассрочка из прежних сохранений продолжает списывать по 500 ₽',()=>{
  evening(5);G.S.loan=99;delete G.S.debt;assert.equal(G.calcEvening().loan,-500);G.settleEvening();assert.equal(G.S.loan,98);
});
test('отказ платить соседям возвращается ремонтом через два дня',()=>{
  evening(5);G.S.run.dilemmas[5]='flood';G.calcEvening();G.pickDilemma('flood','b');
  assert.equal(G.S.flags.leakDay,7);G.S.day=7;G.setDayCtx();G.W={time:540,processed:4,errors:0,fines:0,bribes:0,idx:0,notes:[]};
  assert.equal(G.calcEvening().rep,-1500);
});
test('помощь знакомым: только для виденных арок, один раз, не дороже кошелька; влияет на эпилог',()=>{
  G.S=G.freshState('young','normal');G.setupRun({seed:'help',arcs:['babushka']});G.S.run.arcs=['babushka'];G.S.arcs.babushka.n=1;
  assert.equal(G.helpFor(),null);G.S.arcs.babushka.n=2;assert.equal(G.helpFor(),'helpZ');
  G.S.day=9;G.S.money=500;G.setDayCtx();G.W={time:540,processed:4,errors:0,fines:0,bribes:0,idx:0,notes:[]};G.calcEvening();
  assert.equal(G.E.dil,'helpZ');assert.ok(G.dilOpts('helpZ')[0].cost>G.eveCash(),'на счету не хватает — кнопка недоступна');
  G.S.money=5000;const c=G.S.conscience;G.pickDilemma('helpZ','a');assert.equal(G.S.flags.helped.babushka,1);assert.equal(G.S.conscience,c+2);assert.equal(G.helpFor(),null);
});
test('ГосСверка: ✓ у совпавших реквизитов, ? у разошедшихся, Е и Ё не различает',()=>{
  const src=require('fs').readFileSync(require('path').join(__dirname,'..','js','shift.js'),'utf8');
  assert.ok(/replace\(\/ё\/g,'е'\)/.test(src)&&/bt-ok/.test(src)&&/bt-bad/.test(src));
});
test('ГосСверка: нормализация склеивает пробелы и не трогает латинскую s',()=>{
  assert.equal(G.svNorm('Пётр  Иванов\t'),'петр иванов');
  assert.equal(G.svNorm('Ss'),'ss');
});
