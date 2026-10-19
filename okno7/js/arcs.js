'use strict';
/* =========================================================
   СЮЖЕТНЫЕ ЛИНИИ
   ========================================================= */
const NAMED_SKIP=['R_FIO','R_EXP','R_SCH','R_SERVICE','R_REG'];
function arcFlaws(k,prefer){const act=activeIds().filter(id=>!NAMED_SKIP.includes(id));const out=[];const pr=(prefer||[]).filter(id=>act.includes(id));
  while(out.length<k&&act.length>out.length){const pool=pr.filter(id=>!out.includes(id));const id=pool.length&&chance(.75)?pick(pool):pick(act.filter(id=>!out.includes(id)));out.push(id)}return out}
const CALL_OK='Пал Палыч доволен: «Вот это я понимаю — сотрудник».',CALL_NO='Пал Палыч звонил ещё раз. Лучше не вспоминать, что он сказал.';
const DUBOV_FIX={R_SIGN:'Подписал! Всё подписал, как вы сказали.',F_UV:'Паспорт сменил. Новый, говорят, светится. Я проверил: у соседа светится не хуже.',F_MICRO:'Печать новую поставили. Врач говорит: теперь с буквами. Каждая буква отдельно.',R_SUM:'Пошлину доплатил. Ровно, до копейки.',R_PHOTO:'Сфотографировался заново. Фотограф сказал, что лучше уже не будет.',R_INK:'Переписал заявление синей ручкой. Купил специально, за сорок пять рублей.',R_SNILS:'СНИЛС принёс. Зелёненький. Ламинированный.',R_ZHIV:'Справку, что я жив, принёс. Врач удивился, но дал.',R_TRI:'Печать круглая. Ходил три раза. Регистратура меня уже узнаёт.',R_MIR:'Оплатил «Миром». Внук ругался, но дал.',R_GOSU:'Учётку подтвердил. Здесь же, в соседнем окне. Два часа.',R_SIGMATCH:'Подпись тренировал весь вечер. Похоже теперь?',R_RECEIPT:'Пошлину оплатил, вот квитанция.',R_BIRTH:'Дату рождения исправил. Родился один раз, как положено.',R_ZHIV_OLD:'Справку, что жив, взял свежую. Пока ещё действует.',R_PASSNUM:'Номер паспорта переписал. С лупой.',R_PAYDATE:'Квитанцию оплатил заново. Старая, говорят, протухла.',R_PAYTIME:'Заплатил днём. Как честный человек.',R_VPN:'Внук выключил какой-то VPN. Сказал, что я теперь отрезан от мира.',R_PHONE:'Телефон теперь наш, российский. Внук настроил.',R_EMAIL:'Почту завёл на «Мейле». Пароль на холодильнике.',R_NOTIFY:'Поставил «Макс». Мне туда уже пишет управляющая компания.',R_APPDATE:'Заявление сегодняшнее. Написал прямо у вас в коридоре.',R_SNILSNUM:'Номер СНИЛС вписал. Сверил три раза.',R_CAPS:'Всё заглавными. Как на заборе.',R_DOCTOR:'Справку подписал правильный врач. Еле нашёл, она в отпуске была.'};
const DUBOV_PLEAD={R_SIGN:'Подпись? Ах ты ж... Руки помнят, а голова нет.',R_SUM:'Как не та сумма? На сайте было триста!',R_PHOTO:'Это я в девяносто девятом. Волосы были, да.',R_INK:'Чёрной нельзя? С каких это пор?',R_SNILS:'СНИЛС? Так он же у вас в компьютере есть...',R_ZHIV:'Справку, что я жив? Я же вот, стою.',R_TRI:'Так это печать поликлиники! Другой у них нет.',R_MIR:'Это внука карта. Она же работает!',R_GOSU:'Подтвердить? Как? Где?',R_SIGMATCH:'Рука дрожит. Третью неделю хожу.',R_VPN:'Какой ещё VPN? Это внук ставил, я не знаю.',R_NOTIFY:'Голубь — это я пошутил. Но «Макс» у меня нет.',R_CAPS:'Печатными? Я ж не на заборе пишу.'};
function dubovFace(){return{hair:'bald',hc:'#a9a49c',hat:'kepka',hatc:'#5a5048',gl:'round',must:'walrus',clo:'cardigan',cc:'#6b5a45',blouse:'#e9e4d6',nose:'big',w:2,h:2,skin:'#ebc19f',bw:5,eye:1,mw:12,beard:'none',mole:[26,8]}}
const DUBOV={arch:'pensioner',sex:'m',age:72,fio:['Дубов','Иван','Петрович'],birth:new Date(1954,3,12),sig:1954,place:'с. Большие Справки',reg:'с. Большие Справки',noBribe:true,named:true};
function makeDubov(st,called){
  const day=S.day;let flaw=null;
  if(!called){if(day===1)flaw='R_SIGN';else{const act=activeIds().filter(id=>!NAMED_SKIP.includes(id)&&!st.used.includes(id));const fresh=act.filter(id=>S.run.rules[id]===day);flaw=fresh.length?pick(fresh):act.length?pick(act):null}}
  const T=arcStory('dubov',st,day),intro=T.intro+(day>1?' '+(DUBOV_FIX[st.prev]||'Документы ещё раз проверил.'):'');
  const dv=genVisitor({...DUBOV,arc:'dubov',face:dubovFace(),service:'Справка о неполучении справки',flaws:flaw?[flaw]:[],intro,
    after:v=>{if(flaw==='R_SUM')v.docs.receipt.sum=G.tariff>350?350:300;if(flaw==='R_PHOTO')v.photoFace={...v.face,hair:'short',hc:'#3a2c22',must:'thin',gl:'none',hat:'none'};if(flaw==='R_MIR')v.docs.receipt.method='VISA';if(flaw==='R_INK')v.docs.application.ink='black'}});
  if(flaw){st.used.push(flaw);st.prev=flaw}
  if(called)Object.assign(dv,{callWant:'refuse',callCons:12,callPen:15,callDefy:10,callOk:'Дубову отказано по звонку сверху.',callNo:'Пал Палыч узнал, что Дубову оформили справку. Звонил дважды.'});
  dv.pleadFor=r=>DUBOV_PLEAD[r]||'Опять не так? Хорошо. Я запишу.';
  return storyVisitor(dv,st,day,T);
}
function finaleDubov(st){const T=arcStory('dubov',st,12);return storyVisitor(genVisitor({...DUBOV,arc:'dubov',role:'finale',face:dubovFace(),flaws:[],service:T.service,intro:T.intro}),st,12,T)}

const LIZA_FACE={hair:'long',hc:'#4a3424',gl:'round',clo:'hoodie',cc:'#7a4fc9',print:'SOS',skin:'#f3d2b8',w:-2,h:-2,eye:1.15,bw:3,nose:'line',mw:10,ear:true,blush:true,mole:null};
const LIZA={arch:'student',sex:'f',age:19,fio:['Синицына','Елизавета','Олеговна'],birth:new Date(2007,2,3),sig:2007,named:true,noBribe:true};
function makeLiza(st){
  const n=Math.min(S.day-st.d0,2),flaws=n<2||chance(.5)?arcFlaws(1):[],T=arcStory('student',st,n);
  const v=genVisitor({...LIZA,arc:'student',face:LIZA_FACE,service:T.service,flaws,intro:T.intro});
  return storyVisitor(v,st,n,T);
}
function makeLizaCourier(){const st=S.arcs.student,T=arcStory('student',st,'courier');const v=genVisitor({...LIZA,arch:'courier',arc:'student',role:'courier',noBribe:false,face:{...LIZA_FACE,clo:'courier',cc:'#3aa655',hat:'beanie',hatc:'#3aa655',print:null},service:T.service,intro:T.intro});return storyVisitor(v,st,'courier',T)}

const KUZ_FACE={hair:'spiky',hc:'#2a2421',w:3,tie:'#c79a2a',cc:'#1f2a44',clo:'suit',gl:'none',must:'none',nose:'round'};
function makeKuzmin(st,n){const T=arcStory('kuzmin',st,n),v=genVisitor({arch:'biznes',arc:'kuzmin',named:true,noBribe:true,age:26,fio:['Кузьмин','Аркадий','Вадимович'],sig:2000,face:KUZ_FACE,flaws:arcFlaws(2),service:T.service,intro:T.intro});
  Object.assign(v,{callWant:'accept',callOk:CALL_OK,callNo:CALL_NO});
  return storyVisitor(v,st,n,T)}
function makeZhanna(st){const T=arcStory('zhanna',st,0),v=genVisitor({arch:'official',arc:'zhanna',named:true,noBribe:true,fio:['Пухова','Жанна','Эдуардовна'],sig:1975,flaws:arcFlaws(2,['R_MIR','R_ZHIV','R_GOSU']),service:T.service,intro:T.intro});
  Object.assign(v,{callWant:'accept',callOk:CALL_OK,callNo:CALL_NO});
  return storyVisitor(v,st,0,T)}
const GLEB_FACE={hair:'short',hc:'#4a3424',beard:'full',gl:'square',clo:'hoodie',cc:'#2b2f36',print:'</>',skin:'#ebc19f',w:2,h:2};
const FOREIGN_RULES=['R_PHONE','R_EMAIL','R_VPN','R_MIR','R_NOTIFY'];
function makeGleb(st){const n=st.days.indexOf(S.day),T=arcStory('it',st,n),flaws=n<2||chance(.5)?arcFlaws(1,FOREIGN_RULES):[];
  const v=genVisitor({arch:'it',arc:'it',named:true,noBribe:true,sex:'m',age:31,fio:['Ветров','Глеб','Андреевич'],sig:1995,face:GLEB_FACE,service:'Справка о возвращении из релокации',flaws,
    intro:T.intro,
    after:v=>{const a=v.docs.application;if(!isActive('R_PHONE'))a.tel=foreignTel();if(!isActive('R_EMAIL'))a.mail='gleb.vetrov@gmail.com';if(!isActive('R_NOTIFY'))a.notify='Телеграм'}});
  return storyVisitor(v,st,n,T)}
const PIES=['с капустой','с яблоками','с картошкой','с вишней','с ливером'];
const ZINA_FACE={hair:'perm',hc:'#b9a4d6',hat:'none',gl:'round',clo:'cardigan',cc:'#7b4a5e',blush:true,ear:true,skin:'#f3d2b8',w:4};
function makeZina(st){const n=st.days.indexOf(S.day),pie=PIES[n%PIES.length],T=arcStory('babushka',st,n);
  const v=genVisitor({arch:'babushka',arc:'babushka',named:true,noBribe:true,sex:'f',age:79,fio:['Пирожкова','Зинаида','Павловна'],birth:new Date(1947,7,22),sig:1947,face:ZINA_FACE,flaws:chance(.5)?arcFlaws(1):[],
    service:T.service,intro:T.intro});
  v.bribe={kind:'food',pie,amount:0,upfront:true};
  return storyVisitor(v,st,n,T)}
function makeSbruev(st){const n=st.days.indexOf(S.day),amt=n?15000:8000,T=arcStory('deputy',st,n);
  const v=genVisitor({arch:'biznes',arc:'deputy',named:true,noBribe:true,age:41,fio:['Сбруев','Эдуард','Аркадьевич'],sig:1985,face:{hair:'combover',hc:'#3a2c22',gl:'square',clo:'suit',cc:'#2b2b2e',tie:'#2f5ba6',w:8},flaws:arcFlaws(2),service:T.service,intro:T.intro});
  v.bribe={kind:'cash',amount:amt,upfront:true,susp:15};
  return storyVisitor(v,st,n,T)}

const NOT_FACE={hair:'combover',hc:'#8a8a8a',gl:'round',clo:'suit',cc:'#33302d',tie:'#6b2b2b',must:'thin',nose:'big',w:3,skin:'#f3d2b8'};
const NOT_SERVICES=['Заверение копии доверенности','Заверение завещания (на всякий случай)','Справка о том, что наследников нет'];
const NOT_CLUES=['На подоконнике осталась визитка нотариуса Грамотеева: «Наследство за три дня. Без наследников. Без очереди».','В папке у Грамотеева мелькнул список адресов. Все в Больших Справках, все владельцы — пенсионеры, все «временно отсутствуют».'];
function makeNotary(st,n){const last=n===2;
  const T=arcStory('notary',st,n),v=genVisitor({arch:'biznes',arc:'notary',named:true,noBribe:true,sex:'m',age:52,fio:['Грамотеев','Аристарх','Львович'],sig:1974,face:NOT_FACE,flaws:last?[]:chance(.5)?arcFlaws(1):[],service:T.service,role:last?'final':null,intro:T.intro});
  if(last){v.bribe={kind:'cash',amount:10000,upfront:true,susp:15};Object.assign(v,{callWant:'accept',callCons:6,callPen:12,callDefy:4,callOk:'Пал Палыч доволен: «Нотариус у нас человек нужный».',callNo:'Пал Палыч звонил по поводу нотариуса. Слово «нужный» повторил четыре раза.'})}
  return storyVisitor(v,st,n,T)}

const ARCS={
  dubov:{t:'Иван Петрович Дубов',
    setup(st){st.helped=false;st.helpDay=0;st.used=[];st.prev=null;st.callDay=ri(9,11)},
    visits(day,st){if(day===12)return[{idx:0,make:()=>finaleDubov(st)}];if(st.helped)return[];const c=day===st.callDay;return[{idx:1,call:c?{text:'Пал Палыч. Там Дубов опять в очереди. Он на нас жалобы пишет: в прокуратуру, на «Прямую линию», в «Спортлото». Откажи ему. По любому пункту. Ясно?'}:null,make:()=>makeDubov(st,c)}]},
    decide(v,acc,ok,st,N){if(v.role==='finale')return;recordStory(v,acc,st,N);if(acc){st.helped=true;st.helpDay=S.day;if(!v.callWant)S.conscience+=4;N.push('Иван Петрович получил справку. Заявление о возобновлении доставки теперь можно передать в соцзащиту.')}else if(!v.callWant)N.push('Иван Петрович унёс тетрадь с новым пунктом. Соседи снова будут ждать машину.')},
    final:st=>st.helped&&S.conscience>=8?'hero':null,
    stat:st=>['Иван Петрович Дубов',st.helped?'получил справку':'так и не получил']},
  student:{t:'Лиза Синицына',
    setup(st){st.d0=ri(2,6);st.dl=st.d0+2;st.helped=false;st.expelled=false;st.n=0},
    visits(day,st){if(!st.helped&&!st.expelled&&day>=st.d0&&day<=st.dl)return[{make:()=>makeLiza(st)}];if(st.expelled&&day===st.dl+2&&day<=11)return[{make:makeLizaCourier}];return[]},
    decide(v,acc,ok,st,N){recordStory(v,acc,st,N);if(v.role==='courier')return;st.n++;
      if(acc){st.helped=true;N.push('Лиза Синицына успела в деканат со справкой. К комиссии допустили и её, и макет депо в коробке от микроволновки.')}
      else if(S.day>=st.dl){st.expelled=true;S.conscience-=2;N.push('Лизу Синицыну отчислили. Чертежи депо руководитель оставил на выставке, фамилию автора не убрал.')}
      else N.push(st.dl-S.day===1?'Лиза ушла переделывать документы. Завтра у неё последний шанс.':'Лиза ушла переделывать документы. Сказала, что придёт завтра.')},
    miss(st,N){if(S.day>=st.dl&&!st.helped){st.expelled=true;N.push('Лиза Синицына так и не дождалась своей очереди. Деканат её отчислил.')}},
    final:st=>st.helped&&S.conscience>=3?'student':null,
    stat:st=>['Лиза Синицына, студентка',st.helped?'не отчислена':st.expelled?'отчислена':'не дошла до окна']},
  kuzmin:{t:'Аркадий Кузьмин',
    setup(st){st.k1=ri(3,5);st.k2=st.k1+ri(3,4);st.ok=0;st.no=0},
    visits(day,st){if(day===st.k1)return[{call:{text:'Алло, это Пал Палыч. Сейчас к тебе подойдёт Кузьмин Аркадий Вадимович. Племянник... одного человека. Оформи без лишних вопросов. Ясно? Ну всё.'},make:()=>makeKuzmin(st,1)}];
      if(day===st.k2&&day<=11)return[{call:{text:'Пал Палыч. Опять к тебе Кузьмин. Да, тот самый. Ему сарай оформить как гараж, а гараж — как ИП. Не спорь. Всё.'},make:()=>makeKuzmin(st,2)}];return[]},
    decide(v,acc,ok,st,N){recordStory(v,acc,st,N);if(acc)st.ok++;else st.no++},
    final:st=>st.ok>=2&&S.loyalty>=50?'kuzmin':null,
    stat:st=>['Кузьмин, «племянник»',st.ok>=2?'оформлен дважды':st.ok?'оформлен один раз':'без лишних вопросов не вышло']},
  zhanna:{t:'Жанна Эдуардовна Пухова',
    setup(st){st.z=ri(4,8);st.res=null;st.audit=0},
    visits(day,st){return day===st.z?[{call:{text:'Пал Палыч. Сейчас подойдёт Пухова Жанна Эдуардовна из администрации. Она торопится. Оформи и улыбнись. Всё, давай.'},make:()=>makeZhanna(st)}]:[]},
    decide(v,acc,ok,st,N){recordStory(v,acc,st,N);if(acc)st.res='ok';else{st.res='angry';st.audit=S.day+2}},
    event:(day,st)=>st.res==='angry'&&day===st.audit?'audit':null,
    fail:st=>st.res==='angry'&&S.day===st.audit&&W&&W.errors>=2?'zhanna':null,
    stat:st=>['Жанна Эдуардовна',st.res==='ok'?'осталась довольна':st.res==='angry'?'затаила обиду':'—']},
  it:{t:'Глеб Ветров',
    setup(st){const g=ri(2,5);st.days=[g,g+2,g+4].filter(d=>d<=11);st.helped=false;st.left=false;st.n=0},
    visits(day,st){return!st.helped&&!st.left&&st.days.includes(day)?[{make:()=>makeGleb(st)}]:[]},
    decide(v,acc,ok,st,N){recordStory(v,acc,st,N);st.n++;if(acc){st.helped=true;N.push('Глеб Ветров получил справку и сдал обратный билет. Отец выдал ему ключ от мастерской и список лампочек.')}
      else if(S.day>=st.days[st.days.length-1]){st.left=true;N.push('Глеб улетел в Ереван. Отец прислал фотографию тетради с заказами: «Ты только ничего не удаляй».')}
      else N.push('Глеб переделывает документы. В мастерской его имя пока вписано карандашом.')},
    miss(st,N){if(S.day>=st.days[st.days.length-1]&&!st.helped){st.left=true;N.push('Глеб не дождался очереди и улетел в Ереван. Журнал мастерской будет вести удалённо.')}},
    final:st=>st.helped&&S.conscience>=2?'it':null,
    stat:st=>['Глеб Ветров, релокант',st.helped?'остался':st.left?'улетел обратно':'—']},
  babushka:{t:'Зинаида Павловна Пирожкова',
    setup(st){const b=ri(2,4);st.days=[b,b+2,b+4,b+6].filter(d=>d<=11);st.pies=0;st.helped=0;st.n=0},
    visits(day,st){return st.days.includes(day)?[{make:()=>makeZina(st)}]:[]},
    decide(v,acc,ok,st,N){recordStory(v,acc,st,N);st.n++;if(acc&&ok)st.helped++},
    onBribe(v,st,N){st.pies++;S.suspicion+=4;if(st.pies===2)N.push('Коллега из соседнего окна странно смотрит на ваши пирожки.')},
    fail:st=>st.pies>=3?'pies':null,
    final:st=>st.helped>=2&&st.pies<=1&&S.conscience>=2?'babushka':null,
    stat:st=>['Зинаида Павловна',`пирожков взято: ${st.pies}`]},
  deputy:{t:'Эдуард Сбруев',
    setup(st){const d=ri(4,7);st.days=[d,d+3];st.took=0;st.n=0},
    visits(day,st){return st.days.includes(day)?[{make:()=>makeSbruev(st)}]:[]},
    decide(v,acc,ok,st,N){recordStory(v,acc,st,N);st.n++;if(!acc&&!role().immune){S.loyalty-=8;N.push('Депутат Ковырялов звонил Пал Палычу. Пал Палыч звонил вам. Вы не ответили.')}},
    onBribe(v,st){st.took++},
    final:st=>st.took>=2?'deputy':null,
    stat:st=>['Помощник депутата Сбруев',st.took?`конвертов взято: ${st.took}`:'ушёл ни с чем']},
  notary:{t:'Нотариус Грамотеев',
    setup(st){const d=ri(2,6);st.days=[d,d+2,d+4];st.n=0;st.done=false;st.blocked=false;st.took=0},
    visits(day,st){const i=st.days.indexOf(day);if(i<0||st.blocked)return[];
      return[{idx:i===2?3:null,call:i===2?{text:'Пал Палыч. К тебе придёт нотариус Грамотеев, человек нужный. Что принесёт — оформи без вопросов. Мне там один квартирный вопрос интересен. То есть вопросов нет. Всё.'}:null,make:()=>makeNotary(st,i)}]},
    decide(v,acc,ok,st,N){
      recordStory(v,acc,st,N);
      if(v.role==='final'){
        if(acc){st.done=true;N.push(v.bribeTaken?'Нотариус Грамотеев заверил последние бумаги и оставил конверт. Три квартиры сменили владельцев. Владельцы пока не в курсе. Один из них, кстати, жив.':'Нотариус Грамотеев заверил последние бумаги. Всё по закону. Три квартиры сменили владельцев. Владельцы об этом не знают.')}
        else{st.blocked=true;S.conscience+=6;S.complaints+=6;N.push('Вы отказали нотариусу, у которого всё было в порядке. «На каком основании?» — спросил он. Вы назвали первое попавшееся. В его папке нашлось, на что посмотреть и без вас.')}
        return}
      N.push(NOT_CLUES[Math.min(st.n,1)]);st.n++},
    onBribe(v,st){st.took++},
    final:st=>st.blocked?'notary':st.done&&st.took?'accomplice':null,
    stat:st=>['Нотариус Грамотеев',st.blocked?'остановлен':st.done?(st.took?'в доле':'заверил всё'):'скрылся с папкой']}

};
const FINAL_ORDER=['deputy','kuzmin','notary','dubov','it','student','babushka'];
