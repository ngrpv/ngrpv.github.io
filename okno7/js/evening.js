'use strict';
/* =========================================================
   ВЕЧЕР
   ========================================================= */
let E=null;
const PIECE=100,PLAN_BONUS=600;
/* вечерние выборы: у каждого варианта своя цена и последствия; «decline» — отказ, он всегда доступен */
const upg=()=>S.upg||(S.upg={});
const flagSet=k=>S.flags[k]||(S.flags[k]={});
const eveCash=()=>S.money+eveTotal();
const NO={k:'c',t:'Пока не надо',s:'Деньги останутся при вас',decline:true};
function toolOpts(m){
  const o=[],u=upg(),c=n=>Math.round(n*m/10)*10;
  if(!u.sver)o.push({k:'a',t:'«ГосСверка (бета)»',s:`−${nf(c(1800))} ₽ · сама сверяет ФИО, дату рождения, паспорт и СНИЛС`,cost:c(1800),run(){u.sver=1}});
  if(!u.teeth)o.push({k:'b',t:'Зубы маме',s:`−${nf(c(1800))} ₽ · лекарства дешевле, давление в норме`,cost:c(1800),run(){u.teeth=1;u.teethDay=S.day;S.mamaSick=false;S.conscience+=3}});
  o.push({...NO});return o;
}
const help=(arc,t,p,cost,yes)=>({t,p,help:arc,opts:()=>[{k:'a',t:yes,s:`−${nf(cost)} ₽ из своих`,cost,run(){flagSet('helped')[arc]=1;S.conscience+=2}},{...NO,t:'Не в этот раз',s:'Ничего не изменится'}]});
const DILEMMAS={
  op:{t:'Маме нужна операция',p:'Мама звонит тихим голосом: врач сказал, нужна операция на глаза. По ОМС очередь до весны. Платно — 8 000 ₽. Рассрочка есть, но с наценкой.',
    opts:()=>{const dep=Math.min(3000,Math.max(0,eveCash()));return[
      {k:'a',t:'Оплатить сразу',s:'−8 000 ₽ · без процентов',cost:8000,run(){S.conscience+=5;S.flags.op='paid';S.flags.opCash=1}},
      {k:'b',t:'Взнос и рассрочка',s:`−${nf(dep)} ₽ сегодня, дальше по 500 ₽ в день · всего 8 400 ₽`,cost:dep,run(){S.debt={left:8400-dep};S.conscience+=4;S.flags.op='paid'}},
      {k:'c',t:'Сказать, что денег нет',s:'Мама подождёт по ОМС',decline:true,run(){S.conscience-=6;S.mamaSick=true;S.flags.op='refused'}}]}},
  vet:{t:'Барсик заболел',p:'Барсик не ест и смотрит в одну точку. Ветеринар на Садовой берёт 1 500 ₽ за приём.',
    opts:()=>[{k:'a',t:'Отвезти к ветеринару',s:'−1 500 ₽',run(){S.money-=1500;S.catSick=false}},{k:'b',t:'Само пройдёт',s:'Барсику понадобится лечебный корм',decline:true,run(){S.catSick=true;S.conscience-=2}}]},
  flood:{t:'Соседи сверху затопили',p:'С потолка течёт. Соседи предлагают «решить по-соседски»: половина ремонта с вас, 2 000 ₽.',
    opts:()=>[{k:'a',t:'Заплатить 2 000 ₽',s:'Мир дороже',run(){S.money-=2000}},{k:'b',t:'Пусть платят сами',s:'Жалоба «куда надо», а через два дня опять потечёт',decline:true,run(){S.complaints+=15;if(S.day<=10)S.flags.leakDay=S.day+2}}]},
  lend:{t:'Коллега просит в долг',p:'Коллега из окна №6 просит 1 000 ₽ до зарплаты. Говорит, на лекарства. Пахнет пивом.',
    opts:()=>[{k:'a',t:'Дать 1 000 ₽',s:'Может, вернёт',run(){S.money-=1000;if(rnd()<.6)S.flags.lendBack=S.day+2}},{k:'b',t:'Отказать',s:'Коллега обидится и нажалуется',decline:true,run(){S.loyalty-=3}}]},
  tool:{t:'Предложение хозяйственного отдела',k:'Предложение',p:'Хозяйственный отдел закупает «ГосСверку (бета)»: программа сама сравнивает ФИО, дату рождения, паспорт и СНИЛС. Закупка за ваш счёт, бюджет ушёл на отчётность. Е и Ё бета не различает. Заодно звонит мама: стоматолог берёт 1 800 ₽.',opts:()=>toolOpts(1)},
  tool2:{t:'Предложение хозяйственного отдела',k:'Предложение',p:'Цены в хозяйственном отделе проиндексированы на 20% «в связи с инфляцией». Предложение остаётся в силе.',opts:()=>toolOpts(1.2)},
  helpZ:help('babushka','Зинаида Павловна и общая кухня','Соседи собирают на аренду бывшей столовой. Зинаида Павловна идёт по этажу с коробкой из-под печенья и на вас не смотрит из вежливости. Не хватает 1 500 ₽.',1500,'Скинуться'),
  helpG:help('it','Глебу нужен юрист','У Глеба в договоре «удалённая работа из любой точки мира, кроме места проживания». Консультация юриста стоит 3 000 ₽, и Глеб её не просил: он сказал, что разберётся сам.',3000,'Оплатить юриста'),
  helpL:help('student','Лизе нужна повторная справка','Лиза уронила ту самую справку в лужу у деканата. Платная повторная выдача стоит 1 200 ₽. Лиза об этом не знает и пока ищет, где занять.',1200,'Оплатить справку')
};
const dilOpts=id=>DILEMMAS[id].opts();
function helpFor(){
  const asked=S.flags.helpAsked||{},A=S.arcs||{},on=id=>S.run.arcs.includes(id)&&!asked[id];
  if(on('babushka')&&(A.babushka.n||0)>=2)return'helpZ';
  if(on('it')&&(A.it.n||0)>=1&&!A.it.left)return'helpG';
  if(on('student')&&(A.student.n||0)>=1&&!A.student.expelled)return'helpL';
  return null;
}
const MAMA_POOL=['Ты хоть поужинать успеваешь? Не ври мне.','Тётя Валя спрашивает, можешь ли ты ей справку сделать без очереди. Я сказала, что ты честный человек.','По телевизору сказали, что в МФЦ теперь всё за пять минут. Это правда?','Я пыталась записаться к врачу через Госуслуги. Записалась в МФЦ. Наверное, к тебе.','Соседка говорит, ты теперь государственный человек. Я ей так и сказала: да, государственный.','Купила тебе шарф. Не спорь. Зима скоро, а у вас в МФЦ дует.','Мне на почту пришло письмо, что я выиграла миллион. Это же правда, раз на почту?','Папа бы тобой гордился. Только не задерживайся на работе, как он.','Я тут пирогов напекла. Приезжай в субботу. Справку о приезде не надо.','Я смотрела по телевизору про гололёд. Надень шапку. Шапка у тебя есть? Я вязала.','Звонила тётя Валя. Говорит, у неё теперь тоже есть справка. Какая, не помнит, но гордится.','Я записалась на Госуслугах. Пришло: «Запись подтверждена». Куда и зачем, не сказали.','Приходил мужчина от газовой. Я сказала, что газ у нас от тебя. Он ушёл.','Нашла твою детскую справку о прививках. Там написано «ребёнок здоров». Сохраню на всякий случай.','В магазине опять подорожало. Я купила на сдачу яйца, и то не сразу нашла сдачу.','По радио сказали, что всё хорошо. Я выключила и позвонила тебе.','Смотрю сериал, там тоже стоят в очереди. Но у них хотя бы красиво.','Тебе звонила женщина, спрашивала про кредит. Я сказала, что ты работаешь на государство и кредитов не берёшь.','Дядя Коля спрашивает, нельзя ли оформить пенсию заранее. Я сказала: спроси у сына.','Сегодня сама дошла до аптеки, сорок минут. Лекарства, оказывается, выдают без очереди, если громко вздыхать.','Мне пришла открытка от управляющей компании: «Поздравляем с наступлением осени». Я не поняла: это угроза?','В субботу приеду к тебе с борщом. Не готовь ничего. Тем более справку.','Во дворе поставили новую лавочку. На ней уже написали. Не буду тебе читать, что.','Участковый зашёл узнать, всё ли у меня в порядке. Я сказала: в полном. Он удивился.','Ты там смотри, не болей. А если заболеешь, не бери справку в своём МФЦ, там очередь.'];
function mamaLine(){
  const f=S.flags,d=S.day;
  if(S.upg&&S.upg.teeth&&d===S.upg.teethDay+1)return'Зубы как новые. Съела яблоко целиком и прослезилась. Не от зубов, от яблока.';
  if(f.opDay===d-1&&f.op==='paid')return'Врач сказал, операция прошла хорошо. Вижу теперь лучше, чем хотела бы. Спасибо тебе.';
  if(f.opDay===d-1&&f.op==='refused')return'Ничего, я по ОМС. Там всего до весны. Ты не переживай, я и одним глазом всё вижу.';
  if(S.mamaSick)return'Давление скачет. Врач говорит — нервы. Я говорю — пенсия.';
  if(S.mamaSkip>=1)return'Лекарства закончились. Ничего, я травки заварю. Ромашка от всего.';
  if(S.catGone)return'Барсик у меня. Спит на твоём старом свитере. Ест хорошо. Передаёт, что обижен.';
  return MAMA_POOL[(d*7+(S.run.params.banned||'').length)%MAMA_POOL.length];
}
/* сцена дома: кухня вечером, кот у миски */
function homeSVG(state){
  const lit=[];for(let i=0;i<14;i++){const x=34+(i%5)*13,y=26+Math.floor(i/5)*16;if((i*7+S.day*3)%5<3)lit.push(`<rect x="${x}" y="${y}" width="7" height="9" fill="#ffd56b" opacity="${(.55+((i*13)%5)/12).toFixed(2)}"/>`)}
  const full=state==='fed',fur='#8d8a86',str='#5d5a57',O='#2b2420';
  const bowl=`<ellipse cx="300" cy="156" rx="22" ry="6" fill="#b4222f" stroke="${O}" stroke-width="2"/><path d="M278 156 q22 12 44 0" fill="#8e1b26" stroke="${O}" stroke-width="2"/>${full?'<g fill="#6b4226"><circle cx="292" cy="153" r="2.4"/><circle cx="299" cy="151" r="2.4"/><circle cx="306" cy="153" r="2.4"/><circle cx="302" cy="155" r="2"/><circle cx="295" cy="155" r="2"/></g>':''}`;
  let cat='';
  if(state==='fed')cat=`<path d="M214 140 q-18 -10 -12 -38" fill="none" stroke="${fur}" stroke-width="8" stroke-linecap="round"/><ellipse cx="244" cy="140" rx="34" ry="17" fill="${fur}" stroke="${O}" stroke-width="2.5"/><path d="M232 126 q4 14 0 28 M246 124 q4 16 0 32 M258 126 q3 14 0 28" stroke="${str}" stroke-width="3" fill="none"/><circle cx="282" cy="149" r="13" fill="${fur}" stroke="${O}" stroke-width="2.5"/><path d="M274 139 l3 -11 l7 8 Z M286 137 l7 -8 l2 11 Z" fill="${fur}" stroke="${O}" stroke-width="2"/><path d="M276 151 q3 2 6 0 M284 151 q3 2 6 0" stroke="${O}" stroke-width="1.6" fill="none"/>`;
  else if(state==='hungry')cat=`<path d="M246 160 q-30 2 -30 -14" fill="none" stroke="${fur}" stroke-width="8" stroke-linecap="round"/><ellipse cx="252" cy="136" rx="21" ry="27" fill="${fur}" stroke="${O}" stroke-width="2.5"/><path d="M240 124 q6 4 12 0 M238 136 q8 4 16 0" stroke="${str}" stroke-width="3" fill="none"/><circle cx="252" cy="101" r="16" fill="${fur}" stroke="${O}" stroke-width="2.5"/><path d="M239 92 l1 -14 l10 9 Z M255 87 l10 -9 l1 14 Z" fill="${fur}" stroke="${O}" stroke-width="2"/><circle cx="246" cy="101" r="4" fill="#f2e45c" stroke="${O}" stroke-width="1.5"/><circle cx="258" cy="101" r="4" fill="#f2e45c" stroke="${O}" stroke-width="1.5"/><path d="M246 99 v4 M258 99 v4" stroke="${O}" stroke-width="2"/><path d="M249 108 l3 2 l3 -2" stroke="${O}" stroke-width="1.6" fill="none"/><text x="206" y="88" font-family="Bad Script,cursive" font-size="14" fill="#f3efe2">мяу?</text>`;
  else cat=`<rect x="226" y="112" width="40" height="30" rx="2" fill="#fbf8f0" transform="rotate(-6 246 127)"/><text x="246" y="124" text-anchor="middle" font-family="Bad Script,cursive" font-size="8.5" fill="#28306e" transform="rotate(-6 246 127)">Барсик</text><text x="246" y="135" text-anchor="middle" font-family="Bad Script,cursive" font-size="8.5" fill="#28306e" transform="rotate(-6 246 127)">у мамы</text>`;
  return `<svg viewBox="0 0 360 172" aria-hidden="true"><rect width="360" height="172" fill="#2f4741"/>
    <g opacity=".14" stroke="#cfe3da">${Array.from({length:18},(_,i)=>`<path d="M${i*20+10} 0 v118"/>`).join('')}</g>
    <rect x="20" y="12" width="96" height="86" fill="#14203a" stroke="#e7e4d9" stroke-width="5"/><circle cx="96" cy="30" r="9" fill="#f6efc9"/><circle cx="92" cy="27" r="9" fill="#14203a"/>
    <rect x="28" y="20" width="70" height="78" fill="#22304a"/>${lit.join('')}<path d="M68 12 v86 M20 55 h96" stroke="#e7e4d9" stroke-width="3"/>
    <path d="M178 0 v22" stroke="#222" stroke-width="2"/><path d="M162 22 h32 l10 20 h-52z" fill="#3d6b58" stroke="#222" stroke-width="2"/><path d="M152 42 L118 120 h120 L204 42z" fill="#ffe9a8" opacity=".12"/>
    <rect x="0" y="118" width="360" height="54" fill="#6f5a45"/><path d="M0 118 h360" stroke="#4a3b2d" stroke-width="3"/>
    <rect x="120" y="100" width="118" height="10" rx="2" fill="#9c7b58" stroke="#4a3b2d" stroke-width="2"/><rect x="128" y="110" width="6" height="40" fill="#7a5f45"/><rect x="224" y="110" width="6" height="40" fill="#7a5f45"/>
    <rect x="146" y="86" width="20" height="14" rx="2" fill="#d8cdb4" stroke="#222" stroke-width="1.5"/><rect x="149" y="80" width="14" height="7" rx="3" fill="#333"/>
    <rect x="186" y="84" width="12" height="16" rx="2" fill="#fbf8f0" stroke="#222" stroke-width="1.5"/><path d="M198 88 q5 2 0 7" fill="none" stroke="#222" stroke-width="1.5"/>
    ${bowl}${cat}</svg>`;
}
function calcEvening(){
  const day=S.day,R=role(),f=S.flags||{};
  E={salary:R.salary,piece:W.processed*PIECE,plan:W.processed>=G.plan?PLAN_BONUS:0,fines:-W.fines,bribes:W.bribes,mortgage:-600,util:day>=5?-230:-200,food:W.pirozhki?0:-250,cat:S.catGone?0:S.catSick?-180:-100,mama:(S.upg&&S.upg.teeth)?-100:-250,payCat:!S.catGone,payMama:true,
    loan:S.debt?(S.debt.left>0?-Math.min(500,S.debt.left):0):(S.loan>0?-500:0),rep:f.leakDay===day?-1500:0,back:f.lendBack===day?1000:0,dil:(S.run.dilemmas&&S.run.dilemmas[day])||null,dilDone:false};
  if(E.dil==='tool2'&&upg().sver&&upg().teeth)E.dil=null;
  if(!E.dil&&day>=9&&day<=10)E.dil=helpFor();
  E.loyD=W.processed>=G.plan?3:-10;
  /* честный заработок: премия за день без ошибок и за первую неделю */
  E.quality=W.errors===0&&W.processed>=G.plan?diff().bonus:0;
  E.week=day===6&&S.tot.errors<=diff().wk?1500:0;
  return E;
}
function evening(){calcEvening();show('s-eve');renderEve(W.processed>=G.plan)}
function eveTotal(){return E.salary+E.piece+E.plan+E.fines+E.bribes+E.quality+E.week+E.mortgage+E.util+E.food+E.loan+E.rep+E.back+(E.payCat?E.cat:0)+(E.payMama?E.mama:0)}
function eveNotes(planOk){const n=[...(planOk?[W.early?`План выполнен, окно закрыто в ${pad(Math.floor(W.time/60))}:${pad(Math.floor(W.time%60))}. Начальство кивнуло.`:'План выполнен. Начальство кивнуло.']:[`План не выполнен (${W.processed} из ${G.plan}). Начальство вздохнуло.`]),...W.notes];
  if(S.catSkip>=1&&!S.catGone)n.push('Барсик смотрит на вас с укором. Миска пустая со вчера.');
  if(E.back)n.push('Коллега из окна №6 вернул долг. Удивительно.');
  if(E.rep)n.push('Соседи сверху снова залили кухню. Ремонт за ваш счёт: «мы же договорились».');
  return n}
function pickDilemma(id,key){const d=DILEMMAS[id],list=d.opts(),o=list.find(x=>x.k===key)||list[0];if(o.cost)S.money-=o.cost;o.run&&o.run();
  if(id==='op'){S.flags.opDay=S.day;if(S.day<11)S.flags.envDay=S.day+1}
  if(d.help)flagSet('helpAsked')[d.help]=1;
  E.dilDone=true;return o}
function renderEve(planOk){
  const day=S.day,row=(l,v,cls,id)=>`<tr><td>${l}</td><td${id?` id="${id}"`:''} class="${v<0?'neg':''} ${cls||''}">${v<0?'−':v>0?'+':''}${nf(v)} ₽</td></tr>`;
  const ck=(id,label,v,on,dis)=>`<tr><td><label><input type="checkbox" id="${id}" ${on?'checked':''} ${dis?'disabled':''}><span class="ck">${CHECK}</span>${label}</label></td><td class="neg">−${nf(-v)} ₽</td></tr>`;
  const total=eveTotal(),after=S.money+total;
  const pp=S.flags.paper&&S.flags.paper.d===day?[S.flags.paper.h,S.flags.paper.p]:null;
  const nw=pp||(day===1?NEWS_FIRST:day===12?NEWS_LAST:NEWS_POOL[S.run.news[day]]);
  const notes=eveNotes(planOk),dl=E.dil&&DILEMMAS[E.dil];
  const catState=()=>S.catGone?'gone':E.payCat?'fed':'hungry';
  const sb=(lbl,val,bad,d)=>`<span>${lbl}</span><i class="${bad?'bad':''}"><u style="width:${clamp(val,0,100)}%"></u></i><small>${Math.round(clamp(val,0,100))}${d?` (${d>0?'+':''}${d})`:''}</small>`;
  const clock=`${19+day%3}:${pad((day*17)%60)}`;
  $('#eve').innerHTML=`<div class="home"><div class="home-scene" id="home-scene">${homeSVG(catState())}</div>
    <div class="callcard"><div class="cc-who"><svg viewBox="0 0 26 24" aria-hidden="true"><path d="M3 9 Q13 2 23 9 L21 12 L17 10 L17 8 Q13 6.5 9 8 L9 10 L5 12Z" fill="#3a3a3a"/><path d="M5 13 h16 l2 9 h-20z" fill="#d8cdb4" stroke="#25242b" stroke-width="1.4"/></svg><b>Звонит мама</b><span>${clock}</span></div>
    <p id="mama-t">${dl&&E.dil==='op'?'Ты только не волнуйся. Тут такое дело...':dl&&/^tool/.test(E.dil)&&!upg().teeth?'Зуб ноет третий день. Ты не думай, я потерплю.':mamaLine()}</p></div></div>
  ${dl?`<div class="dilemma" id="dilemma"><span class="dl-k">${dl.k||'Решить до утра'}</span><h4>${dl.t}</h4><p>${dl.p}</p><div class="dl-opts">${dl.opts().map(o=>`<button data-opt="${o.k}" aria-pressed="false"${o.cost>eveCash()?' disabled':''}><b>${o.t}</b><small>${o.s}</small></button>`).join('')}</div></div>`:''}
  <div class="sheetpaper">
    <div class="lh">${emblem()}<div><div class="lh-t">Расчётный листок<br>специалист окна №7</div><div class="lh-n">День ${day} · ${dd(G.today)}</div></div></div>
    <table class="ledger" style="margin-top:10px">
      ${row('Оклад',E.salary)}${row(`Сдельно: ${W.processed} × ${PIECE} ₽`,E.piece)}${E.plan?row('Премия за выполнение плана',E.plan):''}${E.fines?row(`Штрафы (${W.errors} ош.)`,E.fines):''}${E.bribes?row('«Благодарности»',E.bribes):''}${E.quality?row('Премия «Безупречное окно»',E.quality):''}${E.week?row('Премия по итогам первой недели',E.week):''}${E.back?row('Вернули долг',E.back):''}
      ${row('Ипотека (21% годовых)',E.mortgage)}${row(day>=5?'Коммуналка (после индексации)':'Коммуналка',E.util)}${row(W.pirozhki?'Ужин: пирожки':'Продукты',E.food)}
      <tr id="loanrow"${E.loan?'':' hidden'}><td>Рассрочка за операцию мамы</td><td class="neg">−${nf(E.loan)} ₽</td></tr>${E.rep?row('Опять потекло: ремонт',E.rep):''}
      ${S.catGone?'':ck('c-cat',S.catSick?'Лечебный корм для Барсика':'Корм для Барсика',E.cat,E.payCat)}
      ${ck('c-mama','Лекарства для мамы',E.mama,E.payMama)}
      <tr class="total"><td>Итого за день</td><td id="e-total" class="${total<0?'neg':''}">${total<0?'−':'+'}${nf(total)} ₽</td></tr>
      <tr><td>На счету будет</td><td id="e-after" class="${after<0?'neg':''}">${money(after)}</td></tr>
    </table>
    <div class="statrow">${sb('Начальство',S.loyalty+E.loyD,S.loyalty<30,E.loyD)}${sb('Жалобы',S.complaints,S.complaints>60)}${sb('ОБЭП',S.suspicion,S.suspicion>50)}</div>
    <ul class="notes">${notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>
  </div>
  ${nw?`<div class="news"><div class="mast"><span>Верхнеберёзовский вестник</span><span>${dd(G.today)}</span></div><h4>${nw[0]}</h4><p>${nw[1]}</p></div>`:''}`;
  const c1=$('#c-cat'),c2=$('#c-mama');
  const upd=()=>{E.payCat=c1?c1.checked:false;E.payMama=c2.checked;const t=eveTotal(),a=S.money+t;$('#e-total').textContent=(t<0?'−':'+')+nf(t)+' ₽';$('#e-total').className=t<0?'neg':'';$('#e-after').textContent=money(a);$('#e-after').className=a<0?'neg':'';
    $('#home-scene').innerHTML=homeSVG(catState());$('#loanrow').hidden=!E.loan;const bd=$('#b-day');if(bd)bd.classList.toggle('wait',!!dl&&!E.dilDone)};
  c1&&c1.addEventListener('change',upd);c2.addEventListener('change',upd);
  const dlel=$('#dilemma');
  dlel&&dlel.addEventListener('click',e=>{const b=e.target.closest('[data-opt]');if(!b||E.dilDone)return;pickDilemma(E.dil,b.dataset.opt);
    $$('[data-opt]',dlel).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));dlel.classList.add('done');SND.play('thump');
    if(E.dil==='op')$('#mama-t').textContent=S.flags.op==='paid'?(S.flags.opCash?'Сразу всё?! Ну ты даёшь. Я отдам, как пенсию проиндексируют.':'Спасибо тебе. Я отдам, как пенсию проиндексируют.'):'Да я понимаю, понимаю. Подожду. Ничего.';
    if(/^tool/.test(E.dil)&&S.upg&&S.upg.teethDay===S.day)$('#mama-t').textContent='Ой, спасибо, родной. Завтра яблоко съем.';
    upd()});
  const bar=$('#eve-bar');
  if(day<12)bar.innerHTML=`<button class="btn primary" id="b-day">Домой, спать</button>`;
  else{bar.innerHTML=`${S.money+eveTotal()>=FLY_PRICE?'<button class="btn" id="b-fly">Билет в Ереван</button>':''}<button class="btn primary" id="b-day">Подвести итоги</button>`}
  $('#b-day').classList.toggle('wait',!!dl);
  $('#b-day').onclick=()=>{if(dl&&!E.dilDone){toast('Сначала решите: '+dl.t.toLowerCase(),'bad');$('#dilemma').scrollIntoView({behavior:'smooth',block:'center'});return}applyEvening(false)};
  const fl=$('#b-fly');fl&&(fl.onclick=()=>applyEvening(true));
  $('#eve').scrollTop=0;
}
const FLY_PRICE=12000;
function settleEvening(){
  const t=eveTotal();S.money+=t;S.loyalty=clamp(S.loyalty+E.loyD,-50,100);
  if(E.loan){if(S.debt)S.debt.left+=E.loan;else if(S.loan>0)S.loan--}
  if(!S.catGone){if(E.payCat)S.catSkip=0;else{S.catSkip++;if(S.catSkip>=(S.catSick?1:2)){S.catGone=true;S.conscience-=5}}}
  if(E.payMama)S.mamaSkip=0;else{S.mamaSkip++;S.conscience-=2;if(S.mamaSkip>=2&&!S.mamaSick){S.mamaSick=true;S.conscience-=8}}
  const hs=S.stats||(S.stats=newStats());hs.hist.push({d:S.day,e:W.errors,n:W.processed,p:G.plan});if(E.quality)hs.flawless++;
  S.complaints=clamp(S.complaints-4,0,150);if(!W.bribes)S.suspicion=clamp(S.suspicion-6,0,150);
  S.loyalty=clamp(S.loyalty,-50,100);
}
function applyEvening(fly){
  settleEvening();announceAch(checkAch('day'));
  if(fly){ending('fly');return}
  const end=checkEnd();if(end){ending(end);return}
  if(S.day>=12){ending(finalEnding());return}
  S.day++;startDay();
}
function checkEnd(){
  if(S.suspicion>=100)return'arrest';
  if(S.suspicion>=60&&rnd()<.3)return'arrest';
  for(const id of S.run.arcs){const f=ARCS[id].fail&&ARCS[id].fail(S.arcs[id]);if(f)return f}
  if(S.loyalty<=0)return'fired';
  if(S.complaints>=100)return'viral';
  if(S.money<-3000)return'debt';
  return null;
}
function finalEnding(){
  for(const id of FINAL_ORDER){if(!S.run.arcs.includes(id))continue;const f=ARCS[id].final(S.arcs[id]);if(f)return f}
  if(S.loyalty>=75&&S.suspicion<50)return'promo';
  return'gpt';
}
