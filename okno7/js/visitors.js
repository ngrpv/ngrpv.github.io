'use strict';
/* =========================================================
   ГЕНЕРАЦИЯ ПОСЕТИТЕЛЕЙ
   ========================================================= */
let VID=0;
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
function pickFlaws(opt){
  if(opt.flaws)return opt.flaws;const flaws=[];const act=activeIds().filter(id=>!(opt.named&&NAMED_SKIP.includes(id)));
  if(act.length&&chance(opt.pFlaw!=null?opt.pFlaw:.38+S.day*.025)){const w={};act.forEach(id=>{w[id]=S.run.rules[id]===S.day?3:1});flaws.push(wpick(w));
    if(S.day>=8&&chance(.2)){const id2=wpick(w);if(id2!==flaws[0])flaws.push(id2)}}
  return flaws;
}
function genVisitor(opt){
  opt=opt||{};
  const v={id:++VID,seed:(Math.random()*1e9)|0,noted:new Set(),special:opt.special||null,arc:opt.arc||null,role:opt.role||null,named:!!opt.named};
  return withSeed(v.seed,()=>{
    const arch=opt.arch||wpick(ARCH_W),A=ARCH[arch];
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
    buildDocs(v);
    const flaws=pickFlaws(opt);
    v.flaws=flaws.filter(id=>RULES[id].inject(v)!==false);
    if(opt.after)opt.after(v);
    v.viol=activeIds().filter(id=>RULES[id].check(v));
    const L=k=>(A[k]&&A[k].length?A[k]:['Здравствуйте.']);
    v.lines={intro:sx(opt.intro||pick(L('intro')),sex),plead:A.plead,ok:A.ok,no:A.no};
    if(!opt.noBribe&&v.viol.length){const bp={biznes:[.6,'cash',[3000,5000],true],babushka:[.45,'food',[0,0],false],worker:[.25,'cash',[1000,1000],false],student:[.15,'cash',[500,500],false],it:[.1,'cash',[2000,2000],false],courier:[.1,'cash',[500,500],false]}[arch];if(bp&&chance(bp[0]))v.bribe={kind:bp[1],amount:pick(bp[2]),upfront:bp[3],pie:'с капустой'}}
    return v;
  });
}
function makeEnvelope(){const v=genVisitor({arch:'biznes',noBribe:true,flaws:arcFlaws(1),intro:'Добрый день. Я слышал, у вас мама болеет. Здесь ровно восемь тысяч. На лечение.'});v.bribe={kind:'cash',amount:8000,upfront:true,susp:30};v.lines.ok=['Здоровья маме.'];v.lines.no=['Зря вы так. Мама бы поняла.'];return v}
const recheck=v=>{v.viol=activeIds().filter(id=>RULES[id].check(v))};
function makeShopper(){const v=genVisitor({special:'shopper',arch:'shopper',fio:['Обычный','Иван','Иванович'],flaws:arcFlaws(1),noBribe:true,named:true,intro:'Здравствуйте. Я самый обычный гражданин. Совершенно обычный.'});
  v.bribe={kind:'cash',amount:5000,upfront:true,shopper:true};v.lines.plead=['Обычный гражданин в такой ситуации расстроился бы.','Интересно, а что у вас в регламенте на этот счёт?'];v.lines.ok=['Благодарю. Я всё запомнил.'];v.lines.no=['Интересно. Очень интересно.'];return v}

/* --- расписание особых посетителей на день --- */
function planSpecials(){
  const day=S.day,list=[];
  S.run.arcs.forEach(id=>{(ARCS[id].visits(day,S.arcs[id])||[]).forEach(x=>list.push({...x,arc:id}))});
  if(S.flags&&S.flags.envDay===day)list.push({make:makeEnvelope});
  if(G.event==='shopper')list.push({make:makeShopper,idx:ri(2,4)});
  const map={},taken=new Set();
  list.filter(x=>x.idx!=null).forEach(x=>{let i=x.idx;while(taken.has(i))i++;taken.add(i);map[i]=x});
  list.filter(x=>x.idx==null).forEach(x=>{const free=[0,2,3,4,5,6].filter(i=>!taken.has(i));const i=free.length?pick(free.slice(0,3)):Math.max(...taken)+1;taken.add(i);map[i]=x});
  return map;
}
