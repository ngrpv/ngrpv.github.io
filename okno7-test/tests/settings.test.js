'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('../tools/game-loader');
test('режим интерфейса переключается в обе стороны, неизвестный режим не применяется',()=>{
  const g=loadGame();assert.equal(g.uiMode(),'free');
  assert.equal(g.setInterfaceMode('classic'),true);assert.equal(g.uiMode(),'classic');
  assert.equal(g.setInterfaceMode('invalid'),false);assert.equal(g.uiMode(),'classic');
  assert.equal(g.setInterfaceMode('classic'),false);
  assert.equal(g.setInterfaceMode('free'),true);assert.equal(g.uiMode(),'free');
});
test('переключение не меняет кампанию, посетителя, принятые решения и случайную последовательность',()=>{
  const g=loadGame();g.S=g.freshState('young');g.setupRun();g.setDayCtx();
  const visitor=g.genVisitor({flaws:['R_FIO']});
  g.W={v:visitor,sel:[],processed:4,errors:1,bribes:0,paused:1};
  const campaign=JSON.stringify(g.S),v=JSON.stringify(visitor);
  for(let i=0;i<4;i++){g.setInterfaceMode('classic');g.setInterfaceMode('free')}
  assert.equal(JSON.stringify(g.S),campaign);assert.equal(JSON.stringify(visitor),v);
  assert.equal(g.W.processed,4);assert.equal(g.W.errors,1);assert.equal(g.W.paused,1);
  assert.equal(g.W.sel.length,0);
});
