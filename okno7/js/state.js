'use strict';
/* =========================================================
   СОСТОЯНИЕ
   ========================================================= */
let S=null,DAYSTART=null;
const clone=o=>JSON.parse(JSON.stringify(o));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const role=()=>ROLES[S.role]||ROLES.young;
function freshState(r){const R=ROLES[r]||ROLES.young;return{v:2,role:r,day:1,money:1500,loyalty:R.loyalty,complaints:10,suspicion:R.susp,conscience:0,flags:{},loan:0,catGone:false,catSkip:0,catSick:!!R.sickCat,mamaSkip:0,mamaSick:false,ticket:40,sig:null,tot:{processed:0,errors:0,bribes:0,bribeSum:0},run:null,arcs:{}}}
function save(){S.savedAt=Date.now();store.set('save',S)}

/* --- партия: какие правила, сюжеты и события выпали --- */
const ARC_W={dubov:1.6,student:1,kuzmin:1,zhanna:1,it:1,babushka:1,deputy:1};
function setupRun(){
  const run={rules:{},params:{banned:pick(SERVICES_ALL),doctor:pick(DOCTORS),tariffDay:0},events:{},news:{},arcs:[]};
  S.run=run;S.arcs={};
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
  const fk=shuffle(POOL_ORDER.filter(id=>RULES[id].forg));let fdays=shuffle([4,5,6,7,8,9,10,11]),nf=ri(3,4);
  for(const id of fk){if(!nf)break;const need=RULES[id].need;const d=fdays.find(d=>!need||(run.rules[need]&&run.rules[need]<=d));
    if(d==null)continue;if(RULES[id].sample==='stamp'&&Object.keys(run.rules).some(x=>RULES[x].sample==='stamp'))continue;run.rules[id]=d;fdays=fdays.filter(x=>x!==d);nf--}
  /* сюжетные линии */
  const w={...ARC_W},n=chance(.6)?3:2;
  for(let i=0;i<n;i++){const id=wpick(w);delete w[id];run.arcs.push(id);S.arcs[id]={};ARCS[id].setup(S.arcs[id])}
  /* события смены */
  /* трудные выборы вечером */
  run.dilemmas={};const dfree=shuffle([3,4,5,6,7,8,9,10]);if(chance(.75))run.dilemmas[ri(4,8)]='op';shuffle(['vet','flood','lend']).slice(0,ri(1,2)).forEach(id=>{const d=dfree.find(x=>!run.dilemmas[x]);if(d)run.dilemmas[d]=id});
  let prev=null,shop=false;
  for(let d=2;d<=11;d++){if(!chance(.45))continue;const ew={...EVENT_W};if(prev)delete ew[prev];if(shop)delete ew.shopper;const e=wpick(ew);run.events[d]=e;prev=e;if(e==='shopper')shop=true}
  /* газета */
  const ns=shuffle(NEWS_POOL.map((_,i)=>i));for(let d=2;d<=11;d++)run.news[d]=ns[d-2];
}
const tariffFor=day=>S.run.params.tariffDay&&day>=S.run.params.tariffDay?412.5:350;
