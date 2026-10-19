'use strict';
/* =========================================================
   ГЕНЕРАЦИЯ ПОСЕТИТЕЛЕЙ
   ========================================================= */
let VID=0;
/* в «смене дня» посетитель зависит только от даты, дня, номера в очереди и порядка вызова внутри него */
function visitorSeed(){if(S&&S.daily&&W){W.vc=(W.vc||0)+1;return hash(S.daily.seed,S.day*100+W.idx,W.vc)}return ri(1,1e9)}
const ruTel=()=>`+7 9${ri(10,99)} ${ri(100,999)}-${pad(ri(0,99))}-${pad(ri(0,99))}`;
const foreignTel=()=>`${pick(FOREIGN_TEL)} ${ri(10,99)} ${ri(100,999)}-${ri(100,999)}`;
const snilsNum=()=>`${ri(100,999)}-${ri(100,999)}-${ri(100,999)} ${pad(ri(0,99))}`;
function makeReceipt(v){const A=isActive,T=G.today;const ru=A('R_VPN')||chance(.85);const f=pick(FOREIGN_IP);
  v.docs.receipt={fio:{...v.fio},sum:G.tariff,method:A('R_MIR')?pick(['МИР','СБП']):pick(['МИР','СБП','VISA','Mastercard']),date:addDays(T,-(A('R_PAYDATE')?ri(0,5):ri(0,12))),time:`${pad(A('R_PAYTIME')?ri(8,19):ri(7,23))}:${pad(ri(0,59))}`,
    ip:ru?`${ri(77,95)}.${ri(10,250)}.${ri(1,254)}.${ri(1,254)}`:`${f[0]}.${ri(1,254)}.${ri(1,254)}`,cc:ru?'RU':f[1],qr:ri(1,1e9),card:ri(1000,9999),op:ri(100000,999999)}}
function makeSnils(v){v.docs.snils={fio:{...v.fio},birth:v.birth,sex:v.sex,place:v.place,num:v.snilsNo,reg:addDays(addYears(v.birth,ri(16,20)),ri(0,300))}}
function buildDocs(v){
  const T=G.today,A=isActive,fio=v.fio;
  const earliest=addYears(v.birth,14),floor=addYears(T,-9);const from=earliest>floor?earliest:floor;const span=Math.max(30,dayDiff(addDays(T,-30),from));
  const issued=addDays(from,ri(0,span));
  v.docs={};
  const dom=A('R_EMAIL')||chance(.7)?pick(RU_MAIL):pick(FOREIGN_MAIL);
  v.docs.application={fio:{...fio},birth:v.birth,pass:v.pass,service:v.service,ink:A('R_INK')?'blue':pick(['blue','blue','black','green']),sig:v.sig,
    gosu:A('R_GOSU')?'подтверждённая':pick(['подтверждённая','упрощённая','стандартная']),date:A('R_APPDATE')||chance(.75)?T:addDays(T,-ri(1,4)),
    tel:A('R_PHONE')||chance(.75)?ruTel():foreignTel(),mail:`${translit(v.n)[0]}.${translit(v.s)}${chance(.4)?ri(1,99):''}@${dom}`,
    notify:A('R_NOTIFY')?'«Макс»':pick(NOTIFY),caps:A('R_CAPS')?true:chance(.3),snils:A('R_SNILSNUM')||chance(.75)?v.snilsNo:snilsNum()};
  v.docs.passport={fio:{...fio},birth:v.birth,sex:v.sex,place:v.place,reg:v.reg,pass:v.pass,issued,until:addYears(issued,10),sig:v.sig};
  if(A('R_RECEIPT'))makeReceipt(v);
  if(A('R_SNILS'))makeSnils(v);
  if(A('R_ZHIV'))v.docs.zhiv={fio:{...fio},birth:v.birth,sex:v.sex,issued:addDays(T,-(A('R_ZHIV_OLD')?ri(0,3):ri(0,9))),stamp:A('R_TRI')?'round':pick(['round','tri']),scol:'violet',doc:A('R_DOCTOR')?P().doctor:pick(DOCTORS),dsig:ri(1,1e6),no:ri(100,9999)};
}
/* мелкие «атрибутные» нарушения: к концу кампании встречаются реже, чтобы не копилась рутина */
const ATTR_RULES=['R_INK','R_CAPS','R_MIR','R_VPN','R_PHONE','R_EMAIL','R_NOTIFY','R_PAYTIME','R_SUM','R_GOSU','R_SERVICE','R_REG','R_DOCTOR','R_TRI'];
function pickFlaws(opt){
  if(opt.flaws)return opt.flaws;const flaws=[];const act=activeIds().filter(id=>!(opt.named&&NAMED_SKIP.includes(id)));
  if(act.length&&chance(opt.pFlaw!=null?opt.pFlaw:.38+S.day*.025+diff().flaw)){const w={};act.forEach(id=>{let x=S.run.rules[id]===S.day?3:1;if(S.day>=8&&ATTR_RULES.includes(id)&&S.run.rules[id]<=S.day-4)x*=.5;w[id]=x});flaws.push(wpick(w));
    if(S.day>=diff().dbl[0]&&chance(diff().dbl[1])){const id2=wpick(w);if(id2!==flaws[0])flaws.push(id2)}}
  return flaws;
}
function genVisitor(opt){
  opt=opt||{};
  const v={id:++VID,seed:visitorSeed(),noted:new Set(),special:opt.special||null,arc:opt.arc||null,role:opt.role||null,named:!!opt.named};
  return withSeed(v.seed,()=>{
    const arch=opt.arch||wpick(archWeights()),A=ARCH[arch];
    const sex=opt.sex||A.sex||(chance(.5)?'m':'f');const age=opt.age||ri(A.age[0],A.age[1]);
    v.arch=arch;v.sex=sex;v.age=age;
    let s=pick(SURN);if(!opt.named&&isActive('R_SCH')&&chance(.1))s=pick(SURN_SCH);
    v.s=sex==='f'?s+'а':s;v.n=pick(sex==='f'?NAMES_F:NAMES_M);const pp=pick(PATR);v.p=sex==='f'?pp[1]:pp[0];
    if(opt.fio)[v.s,v.n,v.p]=opt.fio;
    v.fio={s:v.s,n:v.n,p:v.p};
    v.birth=opt.birth||addDays(addYears(G.today,-age),-ri(1,360));
    v.pass=`${ri(10,99)} ${pad(ri(0,24))} ${ri(100000,999999)}`;
    v.snilsNo=snilsNum();
    v.sig=opt.sig||ri(1,1e7);
    v.face=baseFace(sex,age);A.gen(v.face);if(opt.face)Object.assign(v.face,opt.face);
    v.photoFace=v.face;v.photoDiff=false;if(opt.arc&&S.arcs[opt.arc])S.arcs[opt.arc].met=true;
    let svc=opt.service||pick(A.services);if(!opt.service&&isActive('R_SERVICE')&&svc===P().banned){const alt=A.services.filter(x=>x!==svc);svc=alt.length?pick(alt):'Справка о составе семьи'}
    v.service=svc;v.place=opt.place||pick(TOWNS);
    v.reg=opt.reg||(isActive('R_REG')||chance(.6)?(REGION.includes(v.place)&&chance(.6)?v.place:pick(REGION)):pick(REG_OUT));
    const storyState=opt.named&&opt.arc&&Object.hasOwn(ARC_STORIES,opt.arc)?S.arcs[opt.arc]:null;
    const identity=storyState&&storyState.identity;
    if(identity){
      v.birth=new Date(identity.birth);v.pass=identity.pass;v.snilsNo=identity.snils;v.place=identity.place;v.reg=identity.reg;
      Object.assign(v.face,identity.face,opt.face);v.photoFace={...v.face};
    }else if(storyState&&!REGION.includes(v.reg))v.reg=REGION[0];
    buildDocs(v);
    if(identity)Object.assign(v.docs.passport,{issued:new Date(identity.issued),until:new Date(identity.until)});
    else if(storyState)storyState.identity={birth:+v.birth,pass:v.pass,snils:v.snilsNo,place:v.place,reg:v.reg,face:{...v.face},
      issued:+v.docs.passport.issued,until:+v.docs.passport.until};
    const flaws=pickFlaws(opt);
    v.flaws=flaws.filter(id=>RULES[id].inject(v)!==false);
    if(opt.after)opt.after(v);
    v.viol=activeIds().filter(id=>RULES[id].check(v));
    const L=k=>(A[k]&&A[k].length?A[k]:['Здравствуйте.']);
    v.lines={intro:sx(opt.intro||seasonIntro(arch)||pick(L('intro')),sex),plead:A.plead,ok:A.ok,no:A.no};
    if(!v.viol.length&&!opt.intro&&!opt.named&&chance(.35))v.lines.intro+=' '+pick(QUIRKS);
    if(!opt.noBribe&&v.viol.length){const bp={biznes:[.6,'cash',[3000,5000],true],babushka:[.45,'food',[0,0],false],worker:[.25,'cash',[1000,1000],false],student:[.15,'cash',[500,500],false],it:[.1,'cash',[2000,2000],false],courier:[.1,'cash',[500,500],false]}[arch];if(bp&&chance(bp[0]))v.bribe={kind:bp[1],amount:pick(bp[2]),upfront:bp[3],pie:'с капустой'}}
    return v;
  });
}
function makeEnvelope(){const v=genVisitor({arch:'biznes',noBribe:true,flaws:arcFlaws(1),intro:'Добрый день. Я слышал, у вас мама болеет. Здесь ровно восемь тысяч. На лечение.'});v.bribe={kind:'cash',amount:8000,upfront:true,susp:30};v.lines.ok=['Здоровья маме.'];v.lines.no=['Зря вы так. Мама бы поняла.'];return v}
const recheck=v=>{v.viol=activeIds().filter(id=>RULES[id].check(v))};
function makeShopper(){const v=genVisitor({special:'shopper',arch:'shopper',fio:['Обычный','Иван','Иванович'],flaws:arcFlaws(1),noBribe:true,named:true,intro:'Здравствуйте. Я самый обычный гражданин. Совершенно обычный.'});
  v.bribe={kind:'cash',amount:5000,upfront:true,shopper:true};v.lines.plead=['Обычный гражданин в такой ситуации расстроился бы.','Интересно, а что у вас в регламенте на этот счёт?'];v.lines.ok=['Благодарю. Я всё запомнил.'];v.lines.no=['Интересно. Очень интересно.'];return v}

// Выбор ошибки и создание сюжетного посетителя тоже входят в воспроизводимую очередь.
function makeQueuedVisitor(sp){
  W.vc=0;
  const seed=S.daily?S.daily.seed:S.run.seed!=null?seedHash(S.run.seed):null;
  const make=()=>sp?sp.make():genVisitor();
  return seed==null?make():withSeed(hash(seed,S.day*100+W.idx,101),make);
}
/* --- расписание особых посетителей на день --- */
function planSpecials(){
  const day=S.day,list=[];
  S.run.arcs.forEach(id=>{(ARCS[id].visits(day,S.arcs[id])||[]).forEach(x=>list.push({...x,arc:id}))});
  if(S.flags&&S.flags.envDay===day)list.push({make:makeEnvelope});
  if(G.event==='shopper')list.push({make:makeShopper,idx:ri(2,4)});
  /* эпизодические случаи занимают места внутри плана; не поместились — переносятся на следующий день */
  const room=Math.max(1,(G&&G.plan||3)-1)+(day===12?1:0);
  (S.run.cases||[]).filter(c=>c.day===day).sort((a,b)=>(b.id==='wanted')-(a.id==='wanted')).forEach(c=>{
    if(c.id!=='wanted'&&list.length>=room){if(c.day<12)c.day++;return}
    const C=CASES[c.id];if(C)list.push({make:()=>C.make(c),call:C.call||null,case:c.id})});
  /* сюжетные посетители занимают места внутри плана: после выполнения плана их уже не остаётся */
  const map={},taken=new Set(),plan=Math.max(1,G&&G.plan||0);
  const slot=want=>{const top=Math.min(want,plan-1);for(let i=top;i>=0;i--)if(!taken.has(i))return i;let i=top+1;while(taken.has(i))i++;return i};
  list.filter(x=>x.idx!=null).forEach(x=>{const i=slot(x.idx);taken.add(i);map[i]=x});
  list.filter(x=>x.idx==null).forEach(x=>{const free=Array.from({length:plan},(_,i)=>i).filter(i=>!taken.has(i));const i=free.length?pick(free.slice(0,3)):Math.max(-1,...taken)+1;taken.add(i);map[i]=x});
  return map;
}
