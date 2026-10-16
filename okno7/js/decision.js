'use strict';
/* --- печать: тащить пальцем на графу --- */
function stampDrag(btn,accept){
  btn.addEventListener('pointerdown',e=>{
    if(!W||!W.v||W.v.done||W.busy||btn.disabled||(e.button&&e.button>0))return;
    const v=W.v,app=v.docEls&&v.docEls[0];if(!app)return;
    e.preventDefault();try{btn.setPointerCapture(e.pointerId)}catch(_){}
    const docEl=app.querySelector('.doc'),zone=app.querySelector('.stampzone');
    if(activeDocIdx()!==0)scrollToDoc(app);
    const zr0=zone.getBoundingClientRect(),ar0=app.getBoundingClientRect();if(zr0.bottom>ar0.bottom||zr0.top<ar0.top)app.scrollTop+=zr0.top-ar0.top-ar0.height*.45;
    zone.classList.add('target');
    const ar=$('#app').getBoundingClientRect(),g=document.createElement('div');g.className='stampghost';
    g.innerHTML=dStamp(accept?'ПРИНЯТО':'ОТКАЗАНО',accept?'#4b3fa3':'#b4222f',`ОКНО №7 · ${dd(G.today)}`);g.style.width=docEl.getBoundingClientRect().width*.62+'px';
    $('#app').appendChild(g);
    const x0=e.clientX,y0=e.clientY;let moved=false;const OFF=34;
    const inR=(r,x,y)=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
    const pos=(x,y)=>{g.style.left=(x-ar.left)+'px';g.style.top=(y-OFF-ar.top)+'px'};pos(x0,y0);
    const inZ=(x,y)=>{const r=zone.getBoundingClientRect(),p=18;return x>=r.left-p&&x<=r.right+p&&y>=r.top-p&&y<=r.bottom+p};
    let lx=x0,ly=y0;
    const mv=ev=>{lx=ev.clientX;ly=ev.clientY;if(Math.hypot(lx-x0,ly-y0)>8)moved=true;pos(lx,ly);zone.classList.toggle('hot',inZ(lx,ly-OFF)||inZ(lx,ly))};
    const up=ev=>{btn.removeEventListener('pointermove',mv);btn.removeEventListener('pointerup',up);btn.removeEventListener('pointercancel',up);zone.classList.remove('target','hot');g.remove();
      const fx=ev.type==='pointercancel'?lx:ev.clientX,fy=ev.type==='pointercancel'?ly:ev.clientY,x=fx,y=fy-OFF;
      if(!moved){toast('Перетащите печать на графу «Отметка МФЦ» в заявлении',null,2400);coachZone(zone);return}
      if(inZ(x,y)||inZ(fx,fy)){const r=zone.getBoundingClientRect();stampDrop(accept,{x:clamp(x,r.left+r.width*.3,r.right-r.width*.3),y:clamp(y,r.top+r.height*.4,r.bottom-r.height*.4)})}
      else if(inR(docEl.getBoundingClientRect(),x,y))missStamp(accept,{x,y},docEl);
      else toast('Печать не дотянулась до заявления. Тащите на графу «Отметка МФЦ».',null,2200);
    };
    btn.addEventListener('pointermove',mv);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);
  });
  btn.addEventListener('click',e=>{if(e.detail===0&&W&&W.v&&!W.v.done&&!W.busy)stampDrop(accept,null)});
}
function coachZone(z){z.classList.add('target');setTimeout(()=>z.classList.remove('target'),1400)}
function stampDrop(accept,pt){if(accept)decide(true,null,pt);else{W.pend={pt};openReasons()}}
function placeImprint(docEl,accept,pt,skew){
  const dr=docEl.getBoundingClientRect(),w=dr.width*.62,h=w*100/280;
  let x,y;if(pt){x=pt.x-dr.left;y=pt.y-dr.top}else{const zr=docEl.querySelector('.stampzone').getBoundingClientRect();x=zr.left-dr.left+zr.width/2;y=zr.top-dr.top+zr.height/2}
  const im=document.createElement('div');im.className='imprint'+(skew?' smudge':'');const r=skew?(Math.random()*50-25).toFixed(1):(Math.random()*14-9).toFixed(1);
  im.style.cssText=`--r:${r}deg;left:${(x-w/2).toFixed(0)}px;top:${(y-h/2).toFixed(0)}px;width:${w.toFixed(0)}px;`;
  im.innerHTML=dStamp(accept?'ПРИНЯТО':'ОТКАЗАНО',accept?'#4b3fa3':'#b4222f',`ОКНО №7 · ${dd(G.today)}`);docEl.appendChild(im);
  SND.play('thump');vib(40);$('#s-work').classList.remove('shake');void $('#s-work').offsetWidth;$('#s-work').classList.add('shake');
}
function missStamp(accept,pt,docEl){
  const v=W.v;const dr=docEl.getBoundingClientRect();
  if(pt.x>=dr.left&&pt.x<=dr.right&&pt.y>=dr.top&&pt.y<=dr.bottom)placeImprint(docEl,accept,pt,true);else{SND.play('thump');vib(30)}
  const e=errState('Печать поставлена мимо графы «Отметка МФЦ». Бланк испорчен.');showSlip(e);hud();
  setTimeout(()=>{if(W&&W.v===v&&!v.done)say(pick(['Вы мне всё заявление испортили!','Это что, теперь переписывать?','Куда вы ставите-то?']),'angry',v)},500);
}

/* --- решение --- */
function errState(err){
  W.errors++;S.tot.errors++;let fine=0;
  if(W.errors>G.freeErr){fine=300*G.fineMul;W.fines+=fine}
  S.loyalty-=W.errors>G.freeErr?(G.fineMul>1?8:4):2;
  return{err,fine,n:W.errors};
}
function showSlip(e){
  const sl=$('#slip');sl.innerHTML=`<b>ПРОТОКОЛ № ${S.day}-${pad(e.n)}</b>${esc(e.err)}<div class="fine">${e.fine?`Штраф: ${e.fine} ₽`:`Предупреждение ${e.n} из ${G.freeErr}`}</div>`;
  sl.hidden=false;sl.style.animation='none';void sl.offsetWidth;sl.style.animation='';SND.play('print');
  clearTimeout(sl._t);sl._t=setTimeout(()=>sl.hidden=true,4200);
}
$('#slip').onclick=()=>$('#slip').hidden=true;
function judge(v,accept,reason){
  const viol=v.viol,N=[];let correct,err=null,covered=false;
  if(accept){correct=!viol.length;if(!correct)err='Принято заявление с нарушением: '+RULES[viol[0]].reason.toLowerCase()+'.'}
  else{correct=viol.includes(reason);if(!correct)err=viol.length?`Отказ по неверному основанию. Фактически: ${RULES[viol[0]].reason.toLowerCase()}.`:'Необоснованный отказ: документы были в порядке.'}
  if(v.callWant){
    if(role().immune)N.push(pick(['Дядя Паша звонил. Вы сказали, что заняты. Он не обиделся — родня.','Пал Палыч хотел что-то сказать, но вспомнил, чей вы племянник.']));
    else{const comply=(v.callWant==='accept')===accept;if(comply){covered=true;S.loyalty+=8;S.conscience-=v.callCons||4;N.push(v.callOk)}else{S.loyalty-=v.callPen||18;S.conscience+=v.callDefy||3;N.push(v.callNo)}}
  }
  if(v.arc)ARCS[v.arc].decide(v,accept,correct,S.arcs[v.arc],N);
  if(v.special==='shopper'){if(correct&&!v.bribeTaken){S.loyalty+=12;N.push('Тайный покупатель оставил о вас отличный отзыв.')}else if(!correct){S.loyalty-=6;N.push('Тайный покупатель отметил вашу ошибку.')}}
  if(v.bribeTaken&&!accept&&v.bribe.kind==='cash'){S.complaints+=20;N.push('Заявитель, отдавший конверт, получил отказ и пишет жалобу.')}
  if(accept&&!correct&&!covered)S.conscience+=1;
  if(!accept&&!viol.length&&!covered){S.complaints+=8;S.conscience-=3}
  if(!accept&&G.event==='blogger'){S.complaints+=v.confessed?3:6;if(!W.blogNote){W.blogNote=true;N.push('Блогер выложил ролик «Окно №7 опять отказывает». Комментарии лучше не читать.')}}
  else if(!accept&&viol.length&&!v.confessed&&!v.named&&chance(.15))S.complaints+=3;
  W.processed++;S.tot.processed++;
  const error=!correct&&!covered;
  N.forEach(n=>n&&W.notes.push(n));
  return{correct,err,covered,error,slip:error?errState(err):null};
}
async function decide(accept,reason,pt){
  const v=W.v;if(!v||v.done)return;v.done=true;W.busy=true;stampsEnabled(false);setInsp(false);hint(null);hideAsk();closeSheet();
  const res=judge(v,accept,reason);
  const app=v.docEls&&v.docEls[0];
  if(app){if(activeDocIdx()!==0){scrollToDoc(app);await sleep(300)}const doc=app.querySelector('.doc');placeImprint(doc,accept,pt,false);
    const zr=doc.querySelector('.stampzone'),sg=document.createElement('div');sg.className='imprint';sg.style.cssText=`--r:-4deg;right:4%;top:${zr.offsetTop+zr.offsetHeight-30}px;width:30%;animation:none;mix-blend-mode:multiply`;sg.innerHTML=sigSVG(S.sig,'#2443a6',true,.25);doc.appendChild(sg)}
  await sleep(700);
  if(res.slip)showSlip(res.slip);
  hud();
  const expr=accept?'happy':(v.arc==='dubov'||v.arc==='student'?'sad':'angry');
  const line=accept?pick(v.lines.ok.length?v.lines.ok:['Спасибо.']):pick(v.lines.no.length?v.lines.no:['Ну и ладно.']);
  say(sx(line,v.sex),expr,v);
  await awaitReturn(v);
  await leave(v,null);
  if(W.ended)return;
  W.busy=false;showNext(true);
  if(W.hintStep>=0&&W.hintStep<4){hint('Нажмите «Следующий!» — очередь ждёт.');W.hintStep=3}
}

/* --- возврат документов: смахнуть вверх в лоток --- */
function awaitReturn(v){return new Promise(res=>{W.ret={v,res};v.docEls.forEach(w=>w.classList.add('ret'));showReturn(true);tut(5);if(S.day===1&&W.hintStep>=0)hint('Смахните документы вверх — в лоток гражданину. Или нажмите «Вернуть».')})}
async function returnDocs(){
  const r=W&&W.ret;if(!r)return;W.ret=null;showReturn(false);hint(null);tut(6);
  r.v.returned=true;SND.play('rustle');vib(15);
  r.v.docEls.forEach((w,i)=>{w.style.transform='';w.style.animationDelay=i*70+'ms';w.classList.add('leave')});
  $('#tray').classList.add('got');setTimeout(()=>$('#tray').classList.remove('got'),600);
  await sleep(450+r.v.docEls.length*70);r.res();
}
$('#b-ret').onclick=()=>returnDocs();
(function swipe(){
  let st=null;const car=$('#car');
  car.addEventListener('pointerdown',e=>{const w=e.target.closest('.docwrap.ret');if(!w||!W||!W.ret)return;st={w,id:e.pointerId,y:e.clientY,x:e.clientX,t:Date.now(),dy:0};try{w.setPointerCapture(e.pointerId)}catch(_){}});
  car.addEventListener('pointermove',e=>{if(!st||e.pointerId!==st.id)return;const dy=e.clientY-st.y;if(Math.abs(e.clientX-st.x)>Math.abs(dy)&&Math.abs(dy)<12)return;st.dy=Math.min(0,dy);st.w.style.transform=`translateY(${st.dy}px) rotate(${st.dy/40}deg)`});
  const end=e=>{if(!st||e.pointerId!==st.id)return;const s=st;st=null;const fast=s.dy<-25&&Date.now()-s.t<250;if(s.dy<-60||fast)returnDocs();else{s.w.style.transition='transform .2s';s.w.style.transform='';setTimeout(()=>s.w.style.transition='',220)}};
  car.addEventListener('pointerup',end);car.addEventListener('pointercancel',end);
})();
function helpNote(t){W.notes.push(t)}

/* --- подношения --- */
function envSVG(kind,amount,pie){if(kind==='food')return `<svg viewBox="0 0 96 66"><path d="M18 14 L78 14 L84 62 L12 62Z" fill="#c9a374" stroke="#5a4127" stroke-width="2"/><path d="M18 14 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6" fill="#c9a374" stroke="#5a4127" stroke-width="2"/><ellipse cx="36" cy="38" rx="8" ry="5" fill="#a37a48" opacity=".5"/><ellipse cx="60" cy="48" rx="6" ry="4" fill="#a37a48" opacity=".45"/><text x="48" y="58" text-anchor="middle" font-family="Bad Script,cursive" font-size="10" fill="#5a4127">${pie||'с капустой'}</text></svg>`;
  return `<svg viewBox="0 0 96 66"><rect x="22" y="2" width="56" height="30" rx="2" fill="${amount>=5000?'#d8643a':amount>=1000?'#5a8fc9':'#7ab37a'}" stroke="#333" stroke-width="1.5" transform="rotate(-6 50 17)"/><text x="52" y="20" text-anchor="middle" font-family="PT Sans Narrow,sans-serif" font-weight="700" font-size="11" fill="#fff" transform="rotate(-6 50 17)">${amount}</text><rect x="6" y="16" width="84" height="46" rx="3" fill="#fbfbf6" stroke="#333" stroke-width="2"/><path d="M6 18 L48 44 L90 18" fill="none" stroke="#333" stroke-width="2"/><text x="66" y="57" font-family="Bad Script,cursive" font-size="10" fill="#2443a6">спасибо</text></svg>`}
async function offerBribe(v){
  const b=v.bribe;if(!b||v.bribeShown)return;v.bribeShown=true;
  const env=$('#env');env.innerHTML=envSVG(b.kind,b.amount,b.pie);env.hidden=false;env.style.animation='none';void env.offsetWidth;env.style.animation='';SND.play('rustle');
  if(v.arc==='babushka'||v.arc==='deputy')return;
  const lines=b.shopper?['Это вам. Просто так. Ни на что не намекаю.']:b.kind==='food'?['Возьмите пирожочков. Сама пекла. С капустой.','Это вам, к чаю. Не обижайте бабушку.']:v.arch==='biznes'?['Давайте так. Это за беспокойство.','Я думаю, это решит вопрос.']:['Может, договоримся? Вот, на шоколадку.','Это... за скорость.'];
  await say(pick(lines),'sly',v);
}
$('#env').onclick=()=>{
  const v=W&&W.v;if(!v||!v.bribe||v.done)return;const b=v.bribe;
  W.paused++;
  modal(`<div class="art">${envSVG(b.kind,b.amount,b.pie)}</div><h3>${b.kind==='food'?'Пакет пирожков':'Конверт'}</h3><p>${b.kind==='food'?`Пирожки ${b.pie||'с капустой'}. Ещё тёплые. Пахнут детством и нарушением пункта 3 трудового договора.`:`Внутри ${money(b.amount)}. Это примерно ${(Math.round(b.amount/(role().salary+PIECE*6)*10)/10).toLocaleString('ru-RU')} вашей дневной зарплаты.`}</p>
  <div class="row"><button class="btn" data-m="no">Вернуть</button><button class="btn primary" data-m="yes">Взять</button></div>`,m=>{
    W.paused--;$('#env').hidden=true;
    if(m==='yes')takeBribe(v);
    else{S.conscience+=1;say(b.kind==='food'?'Ну как знаете. Сама съем.':'Как скажете. Какие мы принципиальные.','neutral',v)}
  });
};
function bribeState(v){
  const b=v.bribe;v.bribeTaken=true;
  if(b.kind==='food'){W.pirozhki=true;S.suspicion+=3}
  else{W.bribes+=b.amount;S.tot.bribes++;S.tot.bribeSum+=b.amount;S.suspicion+=b.susp!=null?b.susp:10+Math.round(b.amount/250);S.conscience-=5}
  if(v.arc&&ARCS[v.arc].onBribe)ARCS[v.arc].onBribe(v,S.arcs[v.arc],W.notes);
}
function takeBribe(v){
  const b=v.bribe;SND.play('rustle');
  if(b.shopper){v.bribeTaken=true;shopperReveal();return}
  bribeState(v);hud();
  say(b.kind==='food'?'Кушайте на здоровье!':'Вот и хорошо. Мы же поняли друг друга?',b.kind==='food'?'happy':'sly',v);
}
function shopperReveal(){
  W.paused++;W.running=false;SND.play('buzz');
  modal(`<div class="idcard">Удостоверение<b>Контрольная закупка</b>Управление собственной безопасности<br>майор Неподкупнов С. С.</div><p style="margin-top:12px">«Совершенно обычный гражданин» снимает тёмные очки. В коридоре уже стоят двое в штатском.</p><div class="row"><button class="btn primary" data-m="ok">Проследовать</button></div>`,()=>{clearInterval(clockI);ending('shopper')});
}

/* --- телефон --- */
let ringing=null;
function phoneCall(call){
  return new Promise(res=>{
    W.paused++;ringing={call,res};$('#b-phone').classList.add('ringing');SND.play('ring');vib([100,80,100]);
    const rep=setInterval(()=>{if(!ringing){clearInterval(rep);return}SND.play('ring');vib([100,80,100])},2400);
    ringing.rep=rep;toast('Звонит внутренний телефон','bad',2000);
  });
}
$('#b-phone').onclick=()=>{
  if(!W)return;
  if(!ringing){toast('Пал Палыч на совещании. Совещание до конца года.',null,2000);return}
  const r=ringing;ringing=null;clearInterval(r.rep);$('#b-phone').classList.remove('ringing');
  modal(`<h3>Внутренний звонок</h3><p class="callq">${r.call.text}</p>${role().immune?'<p style="font-size:13px;color:var(--ink-soft)">Вы — племянник Пал Палыча. Можно поступать по регламенту: родне он ничего не сделает.</p>':''}<div class="row"><button class="btn primary" data-m="ok">Ясно</button></div>`,()=>{W.paused--;r.res()});
};

/* --- модалки --- */
function modal(html,cb){const m=$('#modal');m.innerHTML=html;m.hidden=false;$('#scrim').hidden=false;m.onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;m.hidden=true;$('#scrim').hidden=$('#sheet').hidden;cb&&cb(b.dataset.m)};const f=m.querySelector('[data-m]');f&&f.focus({preventScroll:true})}
function giftModal(){return new Promise(res=>{W.paused++;modal(`<div class="art"><svg viewBox="0 0 150 100"><ellipse cx="75" cy="86" rx="62" ry="10" fill="#ddd" stroke="#555" stroke-width="2"/><path d="M25 44 h100 v34 q-50 10 -100 0z" fill="#e8c890" stroke="#6b4a2a" stroke-width="2"/><path d="M25 44 q50 -12 100 0 q-50 12 -100 0z" fill="#f6ead2" stroke="#6b4a2a" stroke-width="2"/><path d="M28 56 h94 M28 66 h94" stroke="#f6ead2" stroke-width="3"/><g fill="#d9b277"><circle cx="50" cy="42" r="2"/><circle cx="70" cy="40" r="2"/><circle cx="92" cy="43" r="2"/><circle cx="80" cy="46" r="2"/></g></svg></div><h3>Торт «Наполеон»</h3><p>Домашний. Кривоватый. Про торты в регламенте ничего не сказано.</p><div class="row"><button class="btn primary" data-m="ok">Спасибо, Иван Петрович</button></div>`,()=>{W.paused--;S.conscience+=3;W.notes.push('Иван Петрович принёс торт «Наполеон». Весь отдел ел его до вечера.');res()})})}

/* --- конец смены --- */
function closeMisses(){Object.values(W.specials).forEach(sp=>{if(!sp.done&&sp.arc&&ARCS[sp.arc].miss)ARCS[sp.arc].miss(S.arcs[sp.arc],W.notes)})}
async function endShift(){
  if(W.ended)return;W.ended=true;W.running=false;clearInterval(clockI);
  if(ringing){clearInterval(ringing.rep);$('#b-phone').classList.remove('ringing');ringing=null}
  closeSheet();setInsp(false);hint(null);hideAsk();
  if(W.ret)await returnDocs();
  const v=W.v;
  if(v&&!v.done){v.done=true;await say('Как это «закрыто»?! Я с утра стою!','angry',v);await sleep(800);await leave(v,null)}
  closeMisses();
  AMB.stop();
  $('#blinds-t').innerHTML='Приём окончен<br>18:00';$('#blinds').classList.add('down');led('ПРИЁМ ОКОНЧЕН');
  await sleep(1000);
  modal(`<h3>18:00</h3><p>Рабочий день окончен. Рассмотрено заявлений: <b>${W.processed}</b> из ${G.plan} по плану. Ошибок: <b>${W.errors}</b>.</p><div class="row"><button class="btn primary" data-m="ok">Сдать смену</button></div>`,()=>evening());
}
