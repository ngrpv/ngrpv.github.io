'use strict';
/* --- сверка --- */
function setInsp(on){W&&(W.insp=on);if(on)tut(2);$('#app').classList.toggle('inspect',on);$('#b-insp').setAttribute('aria-pressed',on);if(!on)clearSel()}
$('#b-insp').onclick=()=>{if(!W)return;setInsp(!W.insp);if(W.insp)toast('Сверка: выберите два поля или поле и пункт регламента',null,2200)};
function clearSel(){$$('.f.sel,.rules li.sel,.citizen.sel').forEach(e=>e.classList.remove('sel'));if(W)W.sel=[]}
$('#app').addEventListener('click',e=>inspPick(e,e.target));
function inspPick(e,target){
  if(!W||!W.insp||!W.v||W.v.done)return;
  if(target.closest('[data-tab]'))return;
  const fe=target.closest('[data-fid],[data-rule],[data-today],[data-sample],#cit');if(!fe)return;
  let tok;
  if(fe.id==='cit')tok={t:'face',el:fe};
  else if(fe.dataset.rule)tok={t:'rule',id:fe.dataset.rule,el:fe};
  else if(fe.dataset.sample)tok={t:'sample',s:fe.dataset.sample,el:fe};
  else if(fe.hasAttribute('data-today'))tok={t:'today',el:fe};
  else{if(!W.v.fields[fe.dataset.fid])return;tok={t:'field',fid:fe.dataset.fid,el:fe}}
  e.preventDefault();
  const ix=W.sel.findIndex(s=>s.el===fe);
  if(ix>=0){fe.classList.remove('sel');W.sel.splice(ix,1);return}
  fe.classList.add('sel');W.sel.push(tok);SND.play('tick');if(W.sel.length===1&&tok.t==='field')tut(3);
  if(W.sel.length===1&&tok.t==='rule'&&RULES[tok.id].req){closeSheet();finishEval(evalReq(tok.id));return}
  const inSheet=!!fe.closest('#sheet');
  if(W.sel.length===2){if(inSheet)closeSheet();finishEval(evalPair(W.sel[0],W.sel[1]));return}
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
    if(String(fa.value)===String(fb.value))return{ok:true,msg:'Совпадает'};
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
  if(r.bad){
    SND.play('buzz');vib([20,40,20]);toast('Расхождение: '+r.msg,'bad',2200);
    sel.forEach(s=>{if(s.t==='field')s.el.insertAdjacentHTML('beforeend',penSVG())});
    const first=!v.noted.size;v.noted.add(r.rule);W.lastBad=r.rule;
    say(pleadLine(v,r.rule),v.special==='shopper'?'sly':'sad',v);
    if(!v.asked)showAsk();
    if(first&&v.bribe&&!v.bribe.upfront)setTimeout(()=>{if(W.v===v&&!v.done)offerBribe(v)},1400);
  }else if(r.ok){toast(r.msg,'good',1400);sel.forEach(s=>{s.el.classList.add('okflash');setTimeout(()=>s.el.classList.remove('okflash'),900)})}
  else toast(r.msg,null,1800);
  setTimeout(()=>{sel.forEach(s=>s.el.classList.remove('sel'));if(W)W.sel=W.sel.filter(s=>!sel.includes(s))},700);
}
function pleadLine(v,rule){if(v.pleadFor)return v.pleadFor(rule);if(v.named||v.special)return sx(pick(v.lines.plead.length?v.lines.plead:['Ну как же так...']),v.sex);const own=PLEAD[rule];return sx(pick(own&&chance(.55)?own:v.lines.plead.length?v.lines.plead:['Ну как же так...']),v.sex)}

/* --- допрос --- */
const CONFESS=['Ладно. Ваша правда. Я надеял{ся|ась}, не заметите.','Да, это не моё. Соседка дала, сказала — прокатит.','Признаю. Не ругайте, и так тошно.','Ну да. Ну ошибся. Ошиблась. Неважно. Признаю.','Мне в интернете сказали, что у вас не проверяют.'];
const DODGE=['Не знаю. Мне так выдали.','Это не ко мне вопрос, это к ним.','А в соседнем окне такое принимают!','Я не понимаю, что вы от меня хотите.','Мне некогда разбираться, я с шести утра стою.'];
const ASKS=['Это что такое?','Объясните, пожалуйста.','Как вы это объясните?','И откуда это?'];
function showAsk(){const b=$('#b-ask');if(!W||!W.v||W.v.done||W.v.asked)return;b.hidden=false}
function hideAsk(){$('#b-ask').hidden=true}
$('#b-ask').onclick=async()=>{
  const v=W&&W.v;if(!v||v.done||v.asked)return;v.asked=true;hideAsk();
  const rule=W.lastBad,r=RULES[rule];W.time=Math.min(W.time+10,1079);hud();
  toast('Вы: «'+pick(ASKS)+'»',null,1400);await sleep(900);if(W.v!==v||v.done)return;
  const out=interrogate(v,rule);
  if(out.kind==='fix'){rerenderDocs(v);await say(sx(out.line,v.sex),'happy',v);toast('Исправлено на месте: '+r.reason.toLowerCase(),'good',2200);SND.play('rustle')}
  else if(out.kind==='bribe'){await say(sx(out.line,v.sex),'sly',v);offerBribe(v)}
  else if(out.kind==='confess'){await say(sx(out.line,v.sex),'sad',v);toast('Признание: отказ не вызовет жалобы',null,2200)}
  else await say(sx(out.line,v.sex),out.expr||'neutral',v);
};
function interrogate(v,rule){
  const r=RULES[rule],roll=rnd();
  if(v.special==='shopper')return{kind:'dodge',line:'Обычный гражданин на такой вопрос пожал бы плечами.',expr:'sly'};
  if(v.callWant)return{kind:'dodge',line:pick(v.lines.plead),expr:'angry'};
  if(r&&r.fix&&roll<.45){const line=r.fix(v);if(line){recheck(v);v.noted.delete(rule);return{kind:'fix',line}}}
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
  const art={stamp:()=>CLINIC_STAMP(),photo:()=>'<span class="smp-photo">'+faceSVG(ROLES.young.face,'neutral')+'</span>',holo:()=>'<span class="smp-holo"><i class="holo-i"></i></span>',font:()=>'<span class="smp-font">ГОСБАНК<br>ЧЕК ПО ОПЕРАЦИИ<br>ИТОГО 350 ₽</span>',qr:()=>'<span class="smp-qr">'+qrSVG(5)+'</span>'};
  return `<div class="samples">${ss.map(s=>`<div class="sample f" data-sample="${s}"><span class="smp-art">${art[s]()}</span><span class="smp-cap">${SAMPLES[s]}</span></div>`).join('')}</div><div class="book-note">${W.insp?'Режим сверки: нажмите образец, затем то же место в документе.':'Включите «Сверку», чтобы сравнивать документы с образцами.'}</div>`}
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
  <div class="book-note">${W.insp?'Режим сверки: нажмите пункт, а затем поле документа на столе. Пункты об обязательных документах проверяются одним нажатием.':'Включите «Сверку», чтобы сопоставлять пункты регламента с полями документов.'}<br>Перерыв: 13:00–14:00. Штраф за ошибки сверх ${G.freeErr} в день: ${diff().fine*G.fineMul} ₽.</div>
  <button class="linkbtn" data-help>Как играть и горячие клавиши</button>`);
};
function openReasons(){
  const act=activeIds();
  openSheet('Основание для отказа',`<div class="reasons">${act.map(id=>`<button data-reason="${id}"><span>${RULES[id].reason}</span>${W.v.noted.has(id)?'<em>отмечено</em>':''}</button>`).join('')}</div>`);
}
$('#sheet-b').addEventListener('click',e=>{const b=e.target.closest('[data-reason]');if(!b)return;const pt=W.pend;W.pend=null;$('#sheet').hidden=true;$('#scrim').hidden=$('#modal').hidden;decide(false,b.dataset.reason,pt&&pt.pt)});
