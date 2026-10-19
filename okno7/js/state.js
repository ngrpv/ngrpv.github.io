'use strict';
/* =========================================================
   СОСТОЯНИЕ
   ========================================================= */
let S=null,DAYSTART=null;
const clone=o=>JSON.parse(JSON.stringify(o));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const role=()=>ROLES[S.role]||ROLES.young;
/* сложность: бесплатные ошибки, размер штрафа, частота подделок, план, подозрительность ОБЭП, премии */
const DIFFS={
  easy:{t:'Новичок',d:'На одну ошибку больше без штрафа, подделок меньше.',free:1,fine:300,flaw:-.08,dbl:[11,.1],plan:0,sus:1,bonus:350,wk:6,clk:1},
  normal:{t:'Обычная',d:'Как задумано.',free:0,fine:300,flaw:0,dbl:[10,.2],plan:0,sus:1,bonus:250,wk:4,clk:1.25},
  hard:{t:'Строгая',d:'На одну бесплатную ошибку меньше, штраф 450 ₽, подделок больше, план выше на одно заявление, часы идут быстрее, ОБЭП внимательнее.',free:-1,fine:450,flaw:.08,dbl:[7,.3],plan:1,sus:1.25,bonus:250,wk:3,clk:1.5}
};
const DIFF_ORDER=['easy','normal','hard'];
const diff=()=>DIFFS[S&&S.diff]||DIFFS.normal;
const newStats=()=>({seen:0,ok:0,wrong:0,fals:0,miss:{},streak:0,best:0,flawless:0,pies:0,hist:[]});
function freshState(r,d){const R=ROLES[r]||ROLES.young;return{v:2,role:r,diff:DIFFS[d]?d:'normal',stats:newStats(),day:1,money:1500,loyalty:R.loyalty,complaints:10,suspicion:R.susp,conscience:0,flags:{},loan:0,catGone:false,catSkip:0,catSick:!!R.sickCat,upg:{},mamaSkip:0,mamaSick:false,ticket:40,sig:null,tot:{processed:0,errors:0,bribes:0,bribeSum:0},run:null,arcs:{}}}
function save(){S.savedAt=Date.now();store.set('save',S)}

/* --- партия: какие правила, сюжеты и события выпали --- */
const ARC_W={dubov:1.6,student:1,kuzmin:1,zhanna:1,it:1,babushka:1,deputy:1,notary:1,razan:1,darina:1};
// Числовые и строковые сиды задают всю партию; состояние генератора сохраняется вместе с ней.
function seedHash(value){let h=2166136261;for(const c of String(value)){h^=c.codePointAt(0);h=Math.imul(h,16777619)}return h>>>0}
function campaignRandom(){
  const run=S&&S.run;
  if(!run||run.seed==null)return Math.random();
  let t=run.rng=(run.rng+0x6D2B79F5)>>>0;
  t=Math.imul(t^t>>>15,1|t);t^=t+Math.imul(t^t>>>7,61|t);
  return((t^t>>>14)>>>0)/4294967296;
}
rnd=campaignRandom;
function readRunOptions(search){
  const query=search===undefined?(typeof window!=='undefined'&&window.location?window.location.search:''):search;
  const p=new URLSearchParams(query||'');
  return{seed:p.get('seed'),arcs:p.getAll('arcs').flatMap(s=>s.split(','))};
}

function setupRun(options){
  const opt=S&&S.daily?{seed:null,arcs:[]}:(options||readRunOptions());
  const seed=opt.seed==null||String(opt.seed).trim()===''?null:String(opt.seed).trim().slice(0,80);
  const forced=[...new Set((Array.isArray(opt.arcs)?opt.arcs:[]).map(s=>String(s).trim().toLowerCase()))].filter(id=>Object.prototype.hasOwnProperty.call(ARC_W,id)).slice(0,3);
  const run={seed,rng:seed==null?null:seedHash(seed),rules:{},params:{},events:{},news:{},arcs:[]};
  S.run=run;S.arcs={};
  if(seed!=null)rnd=campaignRandom;
  run.params={banned:pick(SERVICES_ALL),doctor:pick(DOCTORS),tariffDay:0};
  CORE.forEach(id=>run.rules[id]=1);
  const cand=shuffle(POOL_ORDER.filter(id=>!RULES[id].core&&!RULES[id].forg));
  const ok=(c,d)=>!run.rules[c]&&(!RULES[c].need||(run.rules[RULES[c].need]&&run.rules[RULES[c].need]<=d))&&(!RULES[c].odd||d%2===1);
  for(let d=2;d<=11;d++)for(let k=0;k<DAY_SLOTS[d];k++){
    let id=d<=4&&!run.rules.R_RECEIPT&&chance(.45)?'R_RECEIPT':null;
    if(!id)id=cand.find(c=>ok(c,d));
    if(id)run.rules[id]=d;
  }
  if(run.rules.R_SUM)run.params.tariffDay=ri(Math.max(run.rules.R_SUM+2,7),11);
  /* подделки: 3–4 признака, каждый в свой день, не раньше нужного документа */
  let fk=shuffle(POOL_ORDER.filter(id=>RULES[id].forg));const tl=fk.filter(id=>RULES[id].tool);if(tl.length)fk=[tl[0],...fk.filter(id=>id!==tl[0])];let fdays=shuffle([4,5,6,7,8,9,10,11]),nf=ri(3,4);
  for(const id of fk){if(!nf)break;const need=RULES[id].need;const d=fdays.find(d=>!need||(run.rules[need]&&run.rules[need]<=d));
    if(d==null)continue;if(RULES[id].sample==='stamp'&&Object.keys(run.rules).some(x=>RULES[x].sample==='stamp'))continue;run.rules[id]=d;fdays=fdays.filter(x=>x!==d);nf--}
  /* сюжетные линии */
  const w={...ARC_W},n=Math.max(forced.length,chance(.6)?3:2);
  const addArc=id=>{delete w[id];run.arcs.push(id);S.arcs[id]={};ARCS[id].setup(S.arcs[id])};
  forced.forEach(addArc);for(let i=forced.length;i<n;i++)addArc(wpick(w));
  /* события смены */
  /* трудные выборы вечером */
  run.dilemmas={};const dfree=shuffle([3,4,5,6,7,8,9,10]);if(chance(.75))run.dilemmas[ri(4,8)]='op';shuffle(['vet','flood','lend']).slice(0,ri(1,2)).forEach(id=>{const d=dfree.find(x=>!run.dilemmas[x]);if(d)run.dilemmas[d]=id});
  /* улучшения и операция маме стоят на фиксированных вечерах, прочие выборы уступают место */
  {const D=run.dilemmas,out=[],opd=+Object.keys(D).find(d=>D[d]==='op');
   if(opd){delete D[opd];const nd=opd<=6?6:8;if(D[nd])out.push(D[nd]);D[nd]='op'}
   [4,7].forEach(d=>{if(D[d]){out.push(D[d]);delete D[d]}});D[4]='tool';D[7]='tool2';
   out.forEach(id=>{const d=[3,5,9,10,8,6].find(x=>!D[x]);if(d)D[d]=id})}
  let prev=null,shop=false;
  for(let d=2;d<=11;d++){if(!chance(.45))continue;const ew={...EVENT_W};if(prev)delete ew[prev];if(shop)delete ew.shopper;const e=wpick(ew);run.events[d]=e;prev=e;if(e==='shopper')shop=true}
  /* погода: к концу октября холоднее */
  run.weather=rollWeather();
  /* газета */
  const ns=shuffle(NEWS_POOL.map((_,i)=>i));for(let d=2;d<=11;d++)run.news[d]=ns[d-2];
  /* случаи, сбой «ГосСверки» и «Показатели» разыгрываются после прежних бросков, чтобы старые сиды не сдвинулись */
  run.cases=pickCases();run.glitchDay=ri(8,10);
  {const qd=[3,4,5,6,7,9,10,11].filter(d=>!run.events[d]);if(qd.length&&chance(.6))run.events[pick(qd)]='quota'}
}
const tariffFor=day=>S.run.params.tariffDay&&day>=S.run.params.tariffDay?412.5:350;
