'use strict';
/* --- сверка --- */
function setInsp(on,keepLens){W&&(W.insp=on);if(on){tut(2);if(!keepLens&&W&&W.lens)setLens(null,true)}$('#app').classList.toggle('inspect',on);$('#b-insp').setAttribute('aria-pressed',on);if(!on)clearSel()}
$('#b-insp').onclick=()=>{if(!W)return;setInsp(!W.insp);if(W.insp)toast('Сверка: выберите два поля или поле и пункт регламента',null,2200)};
const FIELD_LABELS={fio:'ФИО',birth:'Дата рождения',passnum:'Номер паспорта',snilsnum:'СНИЛС',sig:'Подпись',photo:'Фотография',expiry:'Срок паспорта',appdate:'Дата заявления',issued:'Дата справки',paydate:'Дата оплаты',paytime:'Время оплаты',sum:'Сумма',stamp:'Печать',holo:'Голограмма',qr:'QR-код',font:'Шрифт',reg:'Регистрация',phone:'Телефон',email:'Эл. почта',notify:'Уведомления',gosu:'Госуслуги',service:'Услуга',method:'Способ оплаты',ip:'IP-адрес',doctor:'Врач',ink:'Чернила',caps:'Заполнение'};
function fieldLabel(kinds){return FIELD_LABELS[Object.keys(FIELD_LABELS).find(k=>kinds.includes(k))]||'Поле документа'}
function differingParts(value,other){
  const a=Array.from(String(value)),b=Array.from(String(other));let start=0,end=0;
  while(start<a.length&&start<b.length&&a[start]===b[start])start++;
  while(end<a.length-start&&end<b.length-start&&a[a.length-end-1]===b[b.length-end-1])end++;
  return[a.slice(0,start).join(''),a.slice(start,a.length-end).join(''),end?a.slice(-end).join(''):''];
}
function clearSel(){
  $$('.f.sel,.rules li.sel,.citizen.sel').forEach(e=>e.classList.remove('sel'));
  if(W){W.sel=[];W.compareResult=null}
  renderComparison();
}
function comparisonCaption(tok){
  if(tok.t==='field'){
    const f=W.v.fields[tok.fid],doc=tok.el.closest('.docwrap');return(doc?doc.dataset.label+' · ':'')+fieldLabel(f.kinds);
  }
  return tok.t==='rule'?'Регламент':tok.t==='today'?'Сегодня':tok.t==='face'?'Посетитель':'Образец';
}
function comparisonFragment(tok){
  const el=document.createElement('div');el.className='comparison-fragment';
  if(tok.t==='field'){
    const f=W.v.fields[tok.fid];
    if(!f.kinds.some(k=>['sig','photo','stamp','qr','holo','font'].includes(k))){
      el.textContent=f.value==null?'Не заполнено':String(f.value);
      if(tok.el.querySelector('.hand')){el.classList.add('hand');el.style.color=getComputedStyle(tok.el.querySelector('.hand')).color}
      return el;
    }
  }else if(tok.t==='rule'){el.textContent=ruleText(tok.id);return el}
  else if(tok.t==='today'){el.textContent=dd(G.today);return el}
  const copy=tok.el.cloneNode(true);
  [copy,...copy.querySelectorAll('*')].forEach(n=>{
    ['id','data-fid','data-rule','data-sample','data-today','tabindex','role','aria-label','aria-pressed'].forEach(a=>n.removeAttribute(a));
    n.classList.remove('sel','coach','okflash');
  });
  copy.querySelectorAll('.pen').forEach(n=>n.remove());copy.classList.remove('f','citizen','sample');
  el.classList.add('comparison-art');if(tok.t==='face')el.classList.add('comparison-face');el.appendChild(copy);return el;
}
function renderComparison(){
  const panel=$('#comparison'),pair=$('#comparison-pair'),r=W&&W.compareResult;
  const show=!!(freeDesk()&&W&&W.insp&&W.v&&!W.v.done&&W.sel.length);
  panel.hidden=!show;if(!show)return;
  pair.replaceChildren();
  W.sel.forEach(tok=>{const card=document.createElement('div'),cap=document.createElement('b');card.className='comparison-card';cap.textContent=comparisonCaption(tok);card.appendChild(cap);card.appendChild(comparisonFragment(tok));pair.appendChild(card)});
  if(r&&r.bad&&W.sel.length===2&&W.sel.every(t=>t.t==='field')){
    const fields=W.sel.map(t=>W.v.fields[t.fid]);
    if(fields.every(f=>typeof f.value==='string')&&['fio','birth','passnum','snilsnum'].some(k=>fields.every(f=>f.kinds.includes(k)))){
      [...pair.children].forEach((card,i)=>{const el=card.querySelector('.comparison-fragment'),p=differingParts(fields[i].value,fields[1-i].value),mark=document.createElement('mark');mark.textContent=p[1]||'∅';el.replaceChildren(document.createTextNode(p[0]),mark,document.createTextNode(p[2]))});
    }
  }
  if(W.sel.length===1&&!r){const empty=document.createElement('div');empty.className='comparison-card comparison-empty';empty.textContent='Выберите второе поле или пункт регламента';pair.appendChild(empty)}
  panel.dataset.result=r?(r.bad?'bad':r.ok?'good':'info'):'';
  $('#comparison-result').textContent=r?r.msg:W.sel.length===2?'Фрагменты готовы к сверке':'Первый фрагмент выбран';
  const b=$('#b-compare');b.disabled=W.sel.length!==2||!!r;b.textContent=r?'Сверено':'Сверить';
}
$('#b-compare-clear').onclick=()=>clearSel();
$('#b-compare').onclick=()=>{if(W&&W.v&&!W.v.done&&W.sel.length===2&&!W.compareResult)finishEval(evalPair(W.sel[0],W.sel[1]))};
$('#app').addEventListener('keydown',e=>{
  if(!e.target.matches('[data-fid]')||!['Enter','Space'].includes(e.code))return;
  e.preventDefault();e.stopPropagation();if(W&&!W.insp)setInsp(true);inspPick(e,e.target);
});
$('#app').addEventListener('click',e=>inspPick(e,e.target));
function inspPick(e,target){
  if(!W||!W.insp||!W.v||W.v.done)return;
  if(target.closest('[data-tab],#comparison'))return;
  const fe=target.closest('[data-fid],[data-rule],[data-today],[data-sample],#cit');if(!fe)return;
  let tok;
  if(fe.id==='cit')tok={t:'face',el:fe};
  else if(fe.dataset.rule)tok={t:'rule',id:fe.dataset.rule,el:fe};
  else if(fe.dataset.sample)tok={t:'sample',s:fe.dataset.sample,el:fe};
  else if(fe.hasAttribute('data-today'))tok={t:'today',el:fe};
  else{if(!W.v.fields[fe.dataset.fid])return;tok={t:'field',fid:fe.dataset.fid,el:fe}}
  e.preventDefault();
  if(W.compareResult)clearSel();
  const ix=W.sel.findIndex(s=>s.el===fe);
  if(ix>=0){fe.classList.remove('sel');W.sel.splice(ix,1);renderComparison();return}
  if(W.sel.length===2)clearSel();
  if(tok.t==='field')setDeskFocus(true);
  fe.classList.add('sel');W.sel.push(tok);SND.play('tick');if(W.sel.length===1&&tok.t==='field')tut(3);
  if(W.sel.length===1&&tok.t==='rule'&&RULES[tok.id].req){closeSheet();finishEval(evalReq(tok.id));return}
  const inSheet=!!fe.closest('#sheet');
  if(W.sel.length===2){if(inSheet)closeSheet();if(freeDesk())renderComparison();else finishEval(evalPair(W.sel[0],W.sel[1]));return}
  renderComparison();
  if(inSheet){closeSheet();toast(tok.t==='rule'?'Пункт выбран. Теперь нажмите поле документа':tok.t==='sample'?'Образец выбран. Теперь нажмите то же место в документе':'Дата выбрана. Теперь нажмите дату в документе',null,2000)}
}
function evalReq(id){const v=W.v;if(RULES[id].check(v))return{bad:true,rule:id,msg:'Документа нет: '+RULES[id].reason.toLowerCase()};return{ok:true,msg:'Документ на месте'}}
const TODAY_OK={R_EXP:'Паспорт действителен',R_ZHIV_OLD:'Справка свежая',R_PAYDATE:'Квитанция свежая',R_APPDATE:'Заявление сегодняшнее',R_SCH:'С датой всё в порядке'};
function mism(rule,msg){if(rule&&isActive(rule))return{bad:true,rule,msg:msg||RULES[rule].reason};return{info:true,msg:'Расхождение есть, но в регламенте об этом пока ни слова'}}
function evalPair(a,b){
  const v=W.v,order={field:0,face:1,today:2,sample:3,rule:4};if(order[a.t]>order[b.t])[a,b]=[b,a];
  const F=t=>v.fields[t.fid];
  if(a.t==='field'&&b.t==='field'){
    const fa=F(a),fb=F(b);if(a.fid===b.fid)return{msg:'Это одно и то же поле'};
    const k=['fio','birth','passnum','snilsnum','sig'].find(k=>fa.kinds.includes(k)&&fb.kinds.includes(k));
    if(!k)return{msg:'Эти данные нельзя сравнить'};
    if(k==='sig'){if(fa.value==null||fb.value==null)return mism('R_SIGN','Подписи нет');return fa.value===fb.value?{ok:true,msg:'Подписи совпадают'}:mism('R_SIGMATCH','Подписи различаются')}
    if(String(fa.value)===String(fb.value))return{ok:true,msg:{fio:'ФИО совпадает',birth:'Даты рождения совпадают',passnum:'Номера паспортов совпадают',snilsnum:'Номера СНИЛС совпадают'}[k]||'Совпадает'};
    return mism({fio:'R_FIO',birth:'R_BIRTH',passnum:'R_PASSNUM',snilsnum:'R_SNILSNUM'}[k],{fio:'ФИО не совпадает',birth:'Даты рождения различаются',passnum:'Номер паспорта различается',snilsnum:'Номер СНИЛС различается'}[k]);
  }
  if(a.t==='field'&&b.t==='face'){if(!F(a).kinds.includes('photo'))return{msg:'Лицо сравнивают с фотографией в паспорте'};return v.photoDiff?mism('R_PHOTO','Лицо не похоже на фото'):{ok:true,msg:v.sex==='f'?'Похожа. Вроде бы.':'Похож. Вроде бы.'}}
  if(a.t==='field'&&b.t==='today'){const fa=F(a);
    const ids=POOL_ORDER.filter(id=>RULES[id].today&&RULES[id].kinds.some(k=>fa.kinds.includes(k)));
    if(!ids.length)return{msg:'С сегодняшней датой сверяют сроки и даты'};
    const bad=ids.find(id=>RULES[id].check(v));if(bad)return mism(bad);
    const id=ids.find(isActive)||ids[0];return{ok:true,msg:TODAY_OK[id]||'С датой всё в порядке'}}
  if(a.t==='field'&&b.t==='sample'){const fa=F(a);const ids=POOL_ORDER.filter(id=>RULES[id].sample===b.s&&RULES[id].kinds.some(k=>fa.kinds.includes(k)));
    if(!ids.length)return{msg:'С этим образцом сверяют другое место документа'};
    const bad=ids.find(id=>RULES[id].check(v));if(bad)return mism(bad);return{ok:true,msg:'Совпадает с образцом'}}
  if(a.t==='face'&&b.t==='rule')return b.id==='R_PHOTO'?{msg:'Сравните лицо с фото в паспорте'}:{msg:'Пункт не про лицо'};
  if(a.t==='field'&&b.t==='rule'){const fa=F(a),r=RULES[b.id];
    if(r.req)return evalReq(b.id);
    if(!r.kinds.some(k=>fa.kinds.includes(k)))return{msg:'Этот пункт регламента не относится к полю'};
    if(b.id==='R_PHOTO')return{msg:'Фото сверяют с лицом заявителя'};
    return r.check(v)?mism(b.id):{ok:true,msg:'Соответствует регламенту'}}
  if(a.t==='today'&&b.t==='rule'&&RULES[b.id].today&&b.id==='R_SCH')return RULES.R_SCH.check(v)?mism('R_SCH'):{ok:true,msg:'Правило к заявителю не применимо'};
  if(b.t==='rule'&&RULES[b.id].req)return evalReq(b.id);
  return{msg:'Нечего сравнивать'};
}
function finishEval(r){
  tut(4);
  const v=W.v,sel=W.sel.slice();
  W.compareResult=r;renderComparison();
  if(r.bad){
    SND.play('buzz');vib([20,40,20]);toast('Расхождение: '+r.msg,'bad',2200);
    sel.forEach(s=>{if(s.t==='field')s.el.insertAdjacentHTML('beforeend',penSVG())});
    const first=!v.noted.size;v.noted.add(r.rule);W.lastBad=r.rule;
    say(pleadLine(v,r.rule),v.special==='shopper'?'sly':'sad',v);
    if(!v.asked)showAsk();
    if(first&&v.bribe&&!v.bribe.upfront)setTimeout(()=>{if(W.v===v&&!v.done)offerBribe(v)},1400);
  }else if(r.ok){toast(r.msg,'good',1400);sel.forEach(s=>{s.el.classList.add('okflash');setTimeout(()=>s.el.classList.remove('okflash'),900)})}
  else toast(r.msg,null,1800);
  if(!freeDesk()){
    const work=W;
    setTimeout(()=>{if(W===work&&W.v===v&&!freeDesk()&&W.compareResult===r)clearSel()},700);
  }
}
function pleadLine(v,rule){if(v.pleadFor)return v.pleadFor(rule);if(v.named||v.special)return sx(pick(v.lines.plead.length?v.lines.plead:['Ну как же так...']),v.sex);const own=PLEAD[rule];return sx(pick(own&&chance(.55)?own:v.lines.plead.length?v.lines.plead:['Ну как же так...']),v.sex)}

/* --- допрос --- */
const CONFESS=['Ладно. Ваша правда. Я надеял{ся|ась}, не заметите.','Да, это не моё. Соседка дала, сказала — прокатит.','Признаю. Не ругайте, и так тошно.','Ну да. Ну ошибся. Ошиблась. Неважно. Признаю.','Мне в интернете сказали, что у вас не проверяют.'];
const DODGE=['Не знаю. Мне так выдали.','Это не ко мне вопрос, это к ним.','А в соседнем окне такое принимают!','Я не понимаю, что вы от меня хотите.','Мне некогда разбираться, я с шести утра стою.'];
const FORGE_TELLS=['Это мне так выдали. Не спрашивайте, кто.','А что, у вас каждую печать смотрят?','Печать как печать. Круглая. Почти.','Мне сказали, у вас не проверяют. Видимо, обманули.','Это не ко мне. Это к тому, кто делал.'];
const ASKS=['Это что такое?','Объясните, пожалуйста.','Как вы это объясните?','И откуда это?'];
function showAsk(){const b=$('#b-ask');if(!W||!W.v||W.v.done||W.v.asked)return;const v=W.v;
  if(v.storyStep!=null&&!W.lastBad&&v.storyAsked)return;
  b.textContent=v.askLabel||(v.storyStep!=null&&!W.lastBad?'Поговорить':W.lastBad&&RULES[W.lastBad]&&RULES[W.lastBad].fix?'Попросить исправить':'Спросить');b.hidden=false}
function hideAsk(){$('#b-ask').hidden=true}
$('#b-ask').onclick=async()=>{
  const v=W&&W.v;if(!v||v.done||v.asked)return;
  const rule=W.lastBad,r=RULES[rule],personal=v.storyStep!=null&&!rule;
  if(personal){if(v.storyAsked)return;v.storyAsked=true}else v.asked=true;
  hideAsk();W.time=Math.min(W.time+(rule&&r&&r.fix&&!personal?5:10),1079);hud();
  toast('Вы: «'+(rule&&v.storyStep!=null?pick(ASKS):v.askPrompt||pick(ASKS))+'»',null,2200);await sleep(900);if(W.v!==v||v.done)return;
  const out=interrogate(v,rule);
  if(out.refreshDocs&&out.kind!=='fix')rerenderDocs(v);
  if(out.kind==='fix'){const fixed=RULES[out.rule||rule]||r;rerenderDocs(v);await say(sx(out.line,v.sex),'happy',v);toast(fixed?'Исправлено на месте: '+fixed.reason.toLowerCase():'Заявление исправлено','good',2200);SND.play('rustle')}
  else if(out.kind==='bribe'){await say(sx(out.line,v.sex),'sly',v);offerBribe(v)}
  else if(out.kind==='confess'){await say(sx(out.line,v.sex),'sad',v);toast('Признание: отказ не вызовет жалобы',null,2200)}
  else await say(sx(out.line,v.sex),out.expr||'neutral',v);
};
function interrogate(v,rule){
  const r=RULES[rule],roll=rnd();
  if(v.special==='shopper')return{kind:'dodge',line:'Обычный гражданин на такой вопрос пожал бы плечами.',expr:'sly'};
  if(v.onAsk){const out=v.onAsk(rule);if(out)return out}
  if(v.askLine)return{kind:'dodge',line:v.askLine,expr:'neutral'};
  if(v.callWant)return{kind:'dodge',line:pick(v.lines.plead),expr:'angry'};
  if(r&&r.fix&&(!v.named||roll<.45)){const line=r.fix(v);if(line){recheck(v);v.noted.delete(rule);v.fixedOnSpot=true;return{kind:'fix',line}}}
  if(r&&r.forg&&!v.named){v.tell=true;if(v.bribe&&!v.bribeShown)return{kind:'bribe',line:'Слушайте, давайте решим вопрос по-взрослому.'};return{kind:'dodge',line:pick(FORGE_TELLS),expr:'sly'}}
  if(v.bribe&&!v.bribeShown&&roll<.72)return{kind:'bribe',line:v.arch==='biznes'?'Слушайте, давайте решим вопрос по-взрослому.':'Может, договоримся как-нибудь?'};
  if(!v.named&&roll<.85){v.confessed=true;return{kind:'confess',line:pick(CONFESS)}}
  return{kind:'dodge',line:v.named?pleadLine(v,rule):pick(DODGE)};
}

/* --- регламент и основания --- */
function openSheet(title,html,passthru){$('#sheet-t').textContent=title;$('#sheet-b').innerHTML=html;$('#sheet').hidden=false;$('#sheet').classList.toggle('passthru',!!passthru);$('#scrim').hidden=!!passthru}
function closeSheet(){$('#sheet').hidden=true;$('#scrim').hidden=!$('#modal').hidden?false:true;if(W&&W.pend&&!(W.v&&W.v.done))W.pend=null}
$('#sheet-x').onclick=closeSheet;
$('#scrim').onclick=()=>{if(!$('#modal').hidden)return;closeSheet()};
function bookSamples(){const ids=activeIds().filter(id=>RULES[id].forg);const ss=[...new Set(ids.map(id=>RULES[id].sample))];
  if(!ss.length)return '<p class="book-note">Образцов пока нет. Они появятся вместе с распоряжениями о подделках.</p>';
  const art={stamp:()=>CLINIC_STAMP(),photo:()=>'<span class="smp-photo">'+faceSVG(ROLES.young.face,'neutral')+'</span>',holo:()=>'<span class="smp-holo"><i class="holo-i"></i></span>',font:()=>'<span class="smp-font">ГОСБАНК<br>ЧЕК ПО ОПЕРАЦИИ<br>ИТОГО 350 ₽</span>',qr:()=>'<span class="smp-qr">'+qrSVG(5)+'</span>',uv:()=>'<span class="smp-uv">'+UV_MARK+'</span>',micro:()=>CLINIC_STAMP(undefined,false,MICRO_OK)};
  return `<div class="samples">${ss.map(s=>LENS_SAMPLES.includes(s)?`<div class="sample lens-s"><span class="smp-art">${art[s]()}</span><span class="smp-cap">${SAMPLES[s]}</span></div>`:`<div class="sample f" data-sample="${s}"><span class="smp-art">${art[s]()}</span><span class="smp-cap">${SAMPLES[s]}</span></div>`).join('')}</div><div class="book-note">${W.insp?'Режим сверки: нажмите образец, затем то же место в документе.':'Включите «Сверку», чтобы сравнивать документы с образцами.'}${ss.some(s=>LENS_SAMPLES.includes(s))?' Образцы под УФ и лупой смотрят кнопкой «Осмотр», без сверки.':''}</div>`}
let bookTab='rules';
$('#sheet-b').addEventListener('click',e=>{const t=e.target.closest('[data-tab]');if(!t)return;bookTab=t.dataset.tab;openBook()});
$('#b-book').onclick=()=>{bookTab='rules';openBook()};
function openBook(){
  if(!W)return;const act=activeIds();const hasS=act.some(id=>RULES[id].forg);
  const tabs=`<div class="booktabs"><button data-tab="rules" aria-pressed="${bookTab==='rules'}">Пункты</button><button data-tab="samples" aria-pressed="${bookTab==='samples'}">Образцы${hasS?'':' (нет)'}</button></div>`;
  if(bookTab==='samples'){openSheet('Регламент окна №7',tabs+bookSamples());return}
  openSheet('Регламент окна №7',tabs+`<div class="book-sub">ред. распоряжения № ${S.day} · сегодня <span class="f" data-today>${dd(G.today)}</span></div>
  <ol class="rules">${act.map((id,i)=>`<li data-rule="${id}" class="${S.run.rules[id]===S.day&&S.day>1?'new':''}"><span class="rn">п.${i+1}</span><span>${ruleText(id)}</span></li>`).join('')}</ol>
  ${G.suspend.length?`<div class="book-note" style="margin-bottom:8px">Сегодня не применяется: ${G.suspend.map(id=>'«'+ruleText(id)+'»').join(', ')}</div>`:''}
  ${S.run.wanted&&S.run.wanted.day===S.day?`<div class="book-note" style="margin-bottom:8px"><b>Ориентировка.</b> ${esc(wantedFlyer())}</div>`:''}
  <div class="book-note">${W.insp?'Режим сверки: нажмите пункт, а затем поле документа на столе. Пункты об обязательных документах проверяются одним нажатием.':'Включите «Сверку», чтобы сопоставлять пункты регламента с полями документов.'}<br>Перерыв: 13:00–14:00. Штраф за ошибки сверх ${G.freeErr} в день: ${diff().fine*G.fineMul} ₽.</div>
  <button class="linkbtn" data-help>Как играть и горячие клавиши</button>`);
};
function openReasons(){
  const act=activeIds();
  openSheet('Основание для отказа',`<div class="reasons">${act.map(id=>`<button data-reason="${id}"><span>${RULES[id].reason}</span>${W.v.noted.has(id)?'<em>отмечено</em>':''}</button>`).join('')}</div>`);
}
$('#sheet-b').addEventListener('click',e=>{const b=e.target.closest('[data-reason]');if(!b)return;const pt=W.pend;W.pend=null;$('#sheet').hidden=true;$('#scrim').hidden=$('#modal').hidden;decide(false,b.dataset.reason,pt&&pt.pt)});
