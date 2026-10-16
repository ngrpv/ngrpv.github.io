'use strict';
/* =========================================================
   ДАРИНА САФОНОВА: студентка, администратор, бывшая практикантка.
   Три обычных обращения. Основания отказа — только действующий регламент.
   ========================================================= */
const DARINA_FACE={hair:'waves',hc:'#574235',hairShine:'#785e49',hat:'none',gl:'none',clo:'tee',cc:'#f1efea',
  skin:'#f0c7b3',w:-5,h:-1,eye:1,bw:2.5,brow:'arched',nose:'line',mw:11,ear:'stud',lip:true,lipColor:'#b47777',lipWidth:3.5,mouthCurve:4,
  blush:false,mole:null,beard:'none',must:'none',print:null};
const DARINA_TEXT=[
  {service:'Регистрация медицинской справки для деканата',h:'Объяснительная для деканата',
    intro:'Здравствуйте. Дарина Сафонова. Мне зарегистрировать медицинскую справку для деканата.',
    question:'Почему деканат запросил ещё одну объяснительную?',
    explain:'Я неделю болела, потом неделю собирала справки. Теперь просят объяснить, где я была вторую неделю.',
    ok:['Спасибо. Отнесу в деканат. Надеюсь, теперь успею на пары.'],
    no:['Понятно. Обновлю справку. Хорошо хоть талон из очереди сохранила.']},
  {service:'Регистрация ответа фитнес-клуба на претензию',h:'Претензия и журнал посещений',
    intro:'Нужно зарегистрировать ответ клиенту фитнес-клуба. Он недоволен результатом тренировок.',
    question:'Что случилось с клиентом и датой заявления?',
    explain:'Клиент требует вернуть деньги: за год не похудел. Пришёл к нам первый раз — сразу с жалобой.',
    ok:['Спасибо. Вернусь на смену, там уже следующий клиент ждёт.'],
    no:['Хорошо. Укажите, что исправить. Саму претензию мы уже получили.']},
  {service:'Исправление записи о завершённой практике',h:'Приказ и ответы кадровой службы',
    intro:'Практику я закончила, но в кадровой базе всё ещё числюсь сотрудником. Нужно исправить запись.',
    question:'Почему запись о практике до сих пор не закрыли?',
    explain:'Из базы не убирают, пока не сдам пропуск. Пропуск не принимают, пока не уберут из базы.',
    ok:['Спасибо. А то практика закончилась, а мне всё ещё говорят выходить на работу.'],
    no:['Понятно. Дайте письменный отказ, пожалуйста. Приложу к остальным ответам.']}
];
function darinaAnnex(v,st){
  const n=v.step,T=DARINA_TEXT[n],first=dayDate(st.days[0]);let rows,fine='';
  if(n===0){
    rows=['Студентка юридического факультета: Дарина Андреевна Сафонова.',
      'Медицинская справка: освобождение от занятий с '+dd(addDays(first,-14))+' по '+dd(addDays(first,-8))+'.',
      'Первоначальная причина отсутствия: болезнь.',
      'Последующая причина отсутствия: оформление документов, подтверждающих болезнь.',
      'Для подтверждения последующих пропусков предоставить отдельную объяснительную.'];
    if(v.docs.zhiv)rows.push('Дополнительная справка 0-ЖИВ выдана '+dd(v.docs.zhiv.issued)+'.');
    fine='Талоны из очередей приложены. Посещением учебных занятий не считаются.';
  }else if(n===1){
    rows=['Заявитель: Дарина Андреевна Сафонова, администратор фитнес-клуба «Прогресс».',
      'Абонемент: годовой. Дата покупки: '+dd(addYears(G.today,-1))+'.',
      'Требование клиента: вернуть деньги, поскольку за год не похудел.',
      'Посещено тренировок: 0. Посещений клуба: 1.',
      'Цель единственного посещения: подача претензии.',
      'Просьба клуба: зарегистрировать ответ на обращение.'];
    if(v.viol.includes('R_APPDATE'))rows.push('Автозаполнение: дата покупки абонемента перенесена в дату заявления.');
    else if(st.clubFixed)rows.push('Дата обращения исправлена заявителем по текущей дате.');
    const r=S.run.arcs.includes('razan')?S.arcs.razan:null;
    if(r&&r.plus&&S.day>=r.plus)rows.push('Проверено агентом №4. Замечаний нет.');
    fine='Автозаполнение: Р. Гапиров. Черновик сформирован локально; автоматическая отправка не использовалась.';
  }else{
    rows=['Заявитель: Дарина Андреевна Сафонова, студентка юридического факультета.',
      'Приказ: учебную практику считать завершённой с '+dd(addDays(first,-60))+'.',
      'Кадровая база: действующий сотрудник. Запись создана при оформлении практики.',
      'Ответ кадровой службы: «Для снятия с учёта необходимо сдать пропуск».',
      'Ответ бюро пропусков: «Пропуск не принят: заявитель числится действующим сотрудником».',
      'Рекомендация: сдать пропуск после снятия с учёта.',
      'Просьба заявителя: исправить ошибочную запись на основании приказа об окончании практики.'];
    fine='Учебная практика зачтена. Прекращение практики в кадровой базе не зачтено.';
  }
  return{label:n===0?'Деканат':n===1?'Претензия':'Приказ',html:'<div class="doc d-annex"><div class="an-h">'+esc(T.h)+'</div><ul>'+rows.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul><div class="an-fine">'+esc(fine)+'</div></div>'};
}
function darinaFlaw(n){
  const seed=S.daily?S.daily.seed:S.run.seed!=null?seedHash(S.run.seed):null;
  return seed==null?chance(.65):withSeed(hash(seed,208,n),()=>chance(.65));
}
function darinaRazanRemark(){
  const r=S.run.arcs.includes('razan')?S.arcs.razan:null;
  return r&&r.lost?'Заявление заполнила сама. Разан сейчас тоже заполняет от руки.':r&&r.restored
    ?'Разан доступ к проекту вернул. Обещал исправить форму. Пока попросил ничего не нажимать.'
    :'Разан мне эту форму настроил. Вечером покажу ему, что получилось.';
}
function darinaAsk(v,rule,st){
  if(v.step===1&&v.viol.includes('R_APPDATE')&&(!rule||rule==='R_APPDATE')){
    v.docs.application.date=G.today;recheck(v);v.noted.delete('R_APPDATE');st.clubFixed=true;v.annex=darinaAnnex(v,st);
    return{kind:'fix',rule:'R_APPDATE',line:'Форма взяла дату покупки абонемента. Сейчас исправлю на сегодняшнюю. '+darinaRazanRemark()};
  }
  if(v.step===0&&rule==='R_ZHIV_OLD')return{kind:'dodge',line:'Когда мне её выдали, срок был нормальный. Потом меня отправили ещё в два кабинета.',expr:'neutral'};
  let line=DARINA_TEXT[v.step].explain;
  if(v.step===1)line+=' '+darinaRazanRemark();
  return{kind:'dodge',line,expr:'neutral'};
}
function makeDarina(st,n){
  const T=DARINA_TEXT[n],identity=st.identity;let intro=T.intro;
  if(n===1)intro=(st.results[0]==='ok'?'Со справкой разобралась. Сегодня я по работе. ':st.results[0]==='no'
    ?'Со справкой ещё разбираюсь. Сегодня я по работе. '
    :'Дарина Сафонова, администратор фитнес-клуба. ')+intro;
  if(n===2)intro=(st.met?'Снова я, Дарина. ':'Здравствуйте. Дарина Сафонова. ')+intro;
  const v=genVisitor({arch:'student',arc:'darina',named:true,noBribe:true,sex:'f',age:22,
    fio:['Сафонова','Дарина','Андреевна'],sig:2004,birth:identity?new Date(identity.birth):undefined,
    place:identity?identity.place:undefined,reg:identity?identity.reg:REGION[0],face:identity?identity.face:DARINA_FACE,
    service:T.service,flaws:[],intro});
  if(!st.identity)st.identity={birth:v.birth.getTime(),pass:v.pass,snils:v.snilsNo,place:v.place,reg:v.reg,
    face:{...v.face},issued:v.docs.passport.issued.getTime(),until:v.docs.passport.until.getTime()};
  const p=st.identity;v.pass=p.pass;v.snilsNo=p.snils;
  Object.assign(v.docs.passport,{pass:p.pass,issued:new Date(p.issued),until:new Date(p.until)});
  v.docs.application.pass=p.pass;v.docs.application.snils=p.snils;
  if(v.docs.snils)v.docs.snils.num=p.snils;
  v.photoFace={...p.face};
  if(n===1)v.face={...v.face,clo:'shirt',cc:'#2d665b',badge:'ДАРИНА'};
  if(n===0&&isActive('R_ZHIV_OLD')&&v.docs.zhiv&&darinaFlaw(0)){
    v.docs.zhiv.issued=addDays(G.today,-ri(4,7));v.flaws=['R_ZHIV_OLD'];
  }else if(n===1&&isActive('R_APPDATE')&&darinaFlaw(1)){
    v.docs.application.date=addYears(G.today,-1);v.flaws=['R_APPDATE'];
  }
  recheck(v);v.step=n;v.annex=darinaAnnex(v,st);v.askAlways=true;v.askPrompt=T.question;
  v.onAsk=rule=>darinaAsk(v,rule,st);
  v.pleadFor=rule=>n===0&&rule==='R_ZHIV_OLD'?'Когда получила справку, она была действительна. Пока собирала остальные документы, срок закончился.'
    :n===1&&rule==='R_APPDATE'?'Это дата покупки абонемента. Форма подставила её в заявление. Можно исправить?'
    :'Покажите, пожалуйста, что не соответствует регламенту.';
  v.lines.ok=T.ok;v.lines.no=n===0&&!v.viol.length?['Укажите основание отказа, пожалуйста. Я сверю со списком деканата.']:T.no;
  return v;
}
ARCS.darina={t:'Дарина Сафонова',
  setup(st){const d=ri(2,4);st.days=[d,d+3,d+6];st.results=[null,null,null];st.clubFixed=false},
  visits(day,st){const n=st.days.indexOf(day);return n<0?[]:[{make:()=>makeDarina(st,n)}]},
  decide(v,acc,ok,st,N){
    st.results[v.step]=acc?'ok':'no';
    if(v.step===0)N.push(acc?'Медицинскую справку Дарины Сафоновой зарегистрировали. Она успела вернуться на занятия.'
      :ok?'Дарина ушла обновлять дополнительную справку. Деканат пока ждёт документы.'
      :'Дарине отказали, хотя документы были в порядке. Она попросила письменное основание для деканата.');
    else if(v.step===1)N.push(acc?'Ответ фитнес-клуба зарегистрирован. Дарина вернулась на смену. Вопрос о возврате денег клуб рассмотрит отдельно.'
      :'Ответ фитнес-клуба не зарегистрирован. Дарина записала основание отказа и вернётся к документам после смены.');
    else N.push(acc?'Ошибочную запись о трудоустройстве Дарины исправили. Пропуск теперь можно сдать.'
      :'Запись о практике Дарины осталась открытой. Она взяла письменный отказ и приложила к ответам кадровой службы.');
  },
  miss(st){const n=st.days.indexOf(S.day);if(n>=0&&!st.results[n])st.results[n]='missed'},
  stat:st=>['Дарина Сафонова',st.results[2]==='ok'?'закрыла запись о практике':st.results[2]==='no'?'добивается исправления записи':
    st.results[1]==='ok'?'зарегистрировала ответ клуба':st.results[0]==='ok'?'оформила справку для деканата':'собирает документы']
};
