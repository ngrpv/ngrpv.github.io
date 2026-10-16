'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function deskHarness(){
  const classes=()=>({values:new Set(),toggle(k,on){if(on)this.values.add(k);else this.values.delete(k)}});
  const car={clientWidth:390,clientHeight:460,children:[],addEventListener(){}};
  const tabs=Array.from({length:3},()=>({classList:classes(),setAttribute(){}}));
  const context={document:{},store:{get:()=>null},$:s=>s==='#car'?car:{},$$:()=>tabs,clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),setTimeout(){}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/desk.js'),'utf8')+'\nthis.api={deskPosition,raiseDocument,placeDocument};',context);
  const paper=(z)=>({parentElement:car,style:{zIndex:z},dataset:{},classList:classes(),offsetWidth:350,offsetHeight:600});
  car.children=[paper(3),paper(2),paper(1)];return{...context.api,car,tabs};
}
test('длинный лист можно поднять до нижнего края и нельзя целиком потерять за столом',()=>{
  const {deskPosition}=deskHarness();
  for(const [width,height,pw,ph] of [[390,460,354,600],[360,300,324,710],[412,530,376,260]]){
    for(const x of [-10000,-50,0,9000])for(const y of [-10000,-30,0,9000]){
      const p=deskPosition(x,y,width,height,pw,ph);
      assert.ok(Math.min(p.x+pw,width)-Math.max(p.x,0)>=96,'остался доступный край бумаги');
      assert.ok(Math.min(p.y+ph,height)-Math.max(p.y,0)>=80,'осталась доступная часть листа');
    }
    const top=deskPosition(0,-10000,width,height,pw,ph);
    assert.ok(top.y+ph<=height,'можно прочитать конец длинного документа');
  }
});
test('последний выбранный лист выше остальных, остальные сохраняют порядок',()=>{
  const {raiseDocument,car}=deskHarness();const [app,passport,receipt]=car.children;
  for(let i=0;i<100;i++){raiseDocument(receipt,false);raiseDocument(passport,false)}
  assert.ok(+passport.style.zIndex>+receipt.style.zIndex);assert.ok(+receipt.style.zIndex>+app.style.zIndex);
  assert.equal(Math.max(...car.children.map(p=>+p.style.zIndex)),3,'ранги не растут бесконечно');
  assert.equal(passport.classList.values.has('front'),true);assert.equal(app.classList.values.has('front'),false);
});
test('поднятие листа наверх сохраняет раскладку, явный переход достаёт его на стол',()=>{
  const {raiseDocument,car}=deskHarness(),paper=car.children[1];paper.dataset={x:-140,y:-80};paper.style.left='-140px';paper.style.top='-80px';
  raiseDocument(paper,false);assert.equal(paper.style.left,'-140px');assert.equal(paper.style.top,'-80px');
  raiseDocument(paper,true);assert.equal(paper.style.left,'20px');assert.equal(paper.style.top,'8px');
});
