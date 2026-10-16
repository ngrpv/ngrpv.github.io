'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {scriptList,ROOT}=require('../tools/game-loader');
function speechHarness(){
  const nodes=new Map(),timers=new Map();let serial=0;
  function element(){return new Proxy(function(){},{get(t,k){if(k===Symbol.toPrimitive)return()=>'';if(k==='then')return undefined;return k in t?t[k]:(t[k]=element())},set(t,k,v){t[k]=v;return true},apply(){return element()}})}
  const document=element();document.querySelector=s=>{if(!nodes.has(s))nodes.set(s,element());return nodes.get(s)};document.querySelectorAll=()=>[];
  const window={__OKNO_SIM__:{}};
  const source=scriptList().map(f=>fs.readFileSync(path.join(ROOT,f),'utf8')).join('\n');
  vm.runInNewContext('(()=>{'+source+'\n})();',{window,document,navigator:{},URLSearchParams,console,
    setInterval:fn=>{const id=++serial;timers.set(id,fn);return id},clearInterval:id=>timers.delete(id),setTimeout:()=>0,clearTimeout:()=>{},requestAnimationFrame:()=>0});
  const game=window.__OKNO_SIM__;game.S=game.freshState('young');game.setupRun();game.S.day=1;game.setDayCtx();game.W={};
  const visitor=game.genVisitor({flaws:[]});game.W.v=visitor;
  return{game,visitor,nodes,timers};
}
test('новая реплика завершает ожидание предыдущей и оставляет один таймер',async()=>{
  const {game,visitor,timers}=speechHarness();let completed=false;
  const first=game.say('Длинная реплика, которую прервали сверкой.','neutral',visitor).then(()=>{completed=true});
  const second=game.say('Да.','neutral',visitor);await first;
  assert.equal(completed,true);assert.equal(timers.size,1);
  for(let i=0;i<3;i++)for(const tick of [...timers.values()])tick();
  await second;assert.equal(timers.size,0);
});
test('досрочное раскрытие реплики показывает весь текст и разблокирует ожидающий переход',async()=>{
  const {game,visitor,nodes,timers}=speechHarness();
  const line='Полная реплика посетителя.';const pending=game.say(line,'neutral',visitor);
  game.finishSpeech(true);await pending;
  assert.equal(nodes.get('#bubble-t').textContent,line);assert.equal(timers.size,0);
});
test('README не раскрывает имена, идентификаторы арок и сюжетные сиды',()=>{
  const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
  assert.doesNotMatch(readme,/разан|дарин|гапиров|сафонов|razan|darina|90201|21967|arcs=/i);
});
