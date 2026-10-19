'use strict';
/* =========================================================
   ЭКРАНЫ
   ========================================================= */
function show(id){$$('.screen').forEach(s=>s.hidden=s.id!==id);if(id!=='s-work')AMB.stop()}
let toastT=0;
function toast(msg,kind,ms){const t=$('#toast');t.textContent=msg;t.className='toast'+(kind?' '+kind:'');t.hidden=false;t.style.animation='none';void t.offsetWidth;t.style.animation='';clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,ms||1800)}
const archive=()=>store.get('archive')||{};
const foundCount=()=>END_ORDER.filter(id=>archive()[id]).length;

/* --- титул --- */
function initTitle(){
  applyInterfaceMode();
  const sv=store.get('save');
  const c=$('#b-cont');if(sv&&sv.v===2&&sv.day&&sv.run){c.hidden=false;c.textContent=`Продолжить: день ${sv.day} из 12`}else c.hidden=true;
  const fc=foundCount();$('#b-arch').textContent=`Архив · ${fc}/${END_ORDER.length}`;
  const dr=dailyResult();$('#b-daily').textContent='Смена дня · '+dailyLabel(dailyKey())+(dr&&dr.final?' ✓':'');
  const ac=achDone();$('#b-ach').textContent=`Знаки · ${ACH.filter(a=>ac[a.id]).length}/${ACH.length}`;
  SND.muted=!!store.get('muted');$('#b-mute').textContent='Звук: '+(SND.muted?'выкл.':'вкл.');
  show('s-title');
}
$('#b-mute').onclick=()=>{SND.muted=!SND.muted;store.set('muted',SND.muted);$('#b-mute').textContent='Звук: '+(SND.muted?'выкл.':'вкл.');if(SND.muted)AMB.stop()};
$('#b-new').onclick=()=>openRoles();
$('#b-cont').onclick=()=>{const sv=store.get('save');if(!sv||!sv.run){initTitle();return}S=clone(sv);startDay()};
$('#b-arch').onclick=()=>openArchive('s-title');
$('#b-ach').onclick=()=>openAchievements();
$('#b-restart').onclick=()=>{store.del('save');DAYSTART=null;initTitle()};
$('#b-replay').onclick=()=>{if(!DAYSTART)return;S=clone(DAYSTART);startDay()};
$('#b-endarch').onclick=()=>openArchive('s-end');

/* --- выбор персонажа --- */
function openRoles(){
  $('#roles').innerHTML=`<h2 class="pick-h">Кем вы устраиваетесь?</h2><p class="pick-sub">Анкета соискателя, графа 7 «Кем вы себя видите через пять лет»</p>`+diffBar()+Object.keys(ROLES).map(k=>{const R=ROLES[k];return `<button class="rolecard" data-role="${k}">
    <span class="rc-face">${faceSVG(R.face,'neutral')}</span>
    <span class="rc-body"><b>${R.t}</b><span class="rc-d">${R.d}</span>
    ${R.plus.map(t=>`<span class="rc-p">+ ${freeErrText(t,R)}</span>`).join('')}${R.minus.map(t=>`<span class="rc-m">− ${t}</span>`).join('')}</span></button>`}).join('');
  show('s-role');$('#roles').scrollTop=0;
}
const freeErrText=(t,R)=>/ошибк\S* в день без штрафа/.test(t)?`${Math.max(1,R.freeErr+DIFFS[pickedDiff()].free)} ${plural(Math.max(1,R.freeErr+DIFFS[pickedDiff()].free),'ошибка','ошибки','ошибок')} в день без штрафа`:t;
function pickedDiff(){const d=store.get('diff');return DIFFS[d]?d:'normal'}
function diffBar(){const cur=pickedDiff();return `<div class="diffbar" role="group" aria-label="Сложность"><span class="lbl">Сложность</span>${DIFF_ORDER.map(k=>`<button data-diff="${k}" aria-pressed="${k===cur}">${DIFFS[k].t}</button>`).join('')}<small id="diff-d">${DIFFS[cur].d}</small></div>`}
$('#roles').addEventListener('click',e=>{
  const d=e.target.closest('[data-diff]');
  if(d){store.set('diff',d.dataset.diff);SND.play('tick');openRoles();return}
  const b=e.target.closest('[data-role]');if(!b)return;S=freshState(b.dataset.role,pickedDiff());setupRun();SND.play('thump');openContract()});
$('#b-roleback').onclick=()=>initTitle();

/* --- архив газет --- */
let archBack='s-title';
function openArchive(back){
  archBack=back||'s-title';const A=archive(),fc=foundCount();
  $('#arch').innerHTML=`<div class="arch-h"><div class="mast">Подшивка «Верхнеберёзовского вестника»</div><p>Найдено концовок: <b>${fc} из ${END_ORDER.length}</b></p></div>
  <div class="clips">${END_ORDER.map((id,i)=>{const e=ENDINGS[id],a=A[id];return a?`<div class="clip${e.fail?' bad':''}" style="--r:${((i*37)%7-3)*.5}deg"><span class="kick">${e.k}</span><b>${e.h}</b><small>День ${a.d} · найдено ${a.n>1?a.n+' раза':'1 раз'}</small></div>`
    :`<div class="clip none" style="--r:${((i*37)%7-3)*.5}deg"><span class="kick">${e.fail?'Происшествия':'?'}</span><b>Вырезка утеряна</b><small>${e.hint}</small></div>`}).join('')}</div>`;
  show('s-arch');$('#arch').scrollTop=0;
}
$('#b-archback').onclick=()=>{if(archBack==='s-end')show('s-end');else initTitle()};

/* --- договор и подпись --- */
const ERR_WORDS={1:'одной',2:'двух',3:'трёх',4:'четырёх',5:'пяти'};
let pad2=null;
function openContract(){
  const R=role();
  show('s-sign');
  $('#contract').innerHTML=`<div class="lh">${emblem()}<div><div class="lh-t">МФЦ «Мои справки»<br>г. Верхнеберёзовска</div><div class="lh-n">${longDate(dayDate(0))}</div></div></div>
  <h2>Трудовой договор № 7/26</h2><p class="subj">со специалистом окна №7 (${R.t.toLowerCase()})</p>
  <p>1. Работник обязуется принимать граждан строго по регламенту, который ежедневно уточняется распоряжениями руководства.</p>
  <p>2. Оплата труда: оклад <b>${R.salary} ₽</b> в день плюс <b>${PIECE} ₽</b> за каждое рассмотренное заявление и <b>${PLAN_BONUS} ₽</b> за выполнение дневного плана. Ошибки сверх ${ERR_WORDS[Math.max(1,R.freeErr+diff().free)]} в день — штраф ${diff().fine} ₽.</p>
  <p>3. Работник не принимает подарков, конвертов, пирожков и иных форм благодарности, кроме устной.</p>
  <p>4. Работник улыбается в соответствии с приказом №12 «Об улыбке», но без фанатизма.</p>
  ${S.role==='nephew'?'<p>5. Рекомендация: П. П. Ступин (дядя). Родство в отделе кадров не выявлено.</p>':S.role==='veteran'?'<p>5. Стаж: 30 лет. Предыдущие места работы: «Мои документы», «Мои бумаги», «Моё окно», «Окно».</p>':''}
  <div class="signrow"><span>Работодатель</span>${sigSVG(4242,'#2443a6')}<span>П. П. Ступин</span>${MFC_STAMP()}</div>
  <div class="sigpad-wrap"><span class="lbl">Подпись работника — распишитесь пальцем</span><canvas id="sigpad" aria-label="Поле для подписи"></canvas>
  <div class="sig-actions"><button class="linkbtn" id="sp-clear">Стереть</button><button class="linkbtn" id="sp-auto">Расписаться за меня</button></div></div>`;
  pad2=sigPad($('#sigpad'));
  $('#sp-clear').onclick=()=>pad2.clear();
  $('#sp-auto').onclick=()=>pad2.auto();
}
function sigPad(cv){
  const strokes=[];let cur=null;const ctx=cv.getContext('2d');
  function size(){const r=cv.getBoundingClientRect(),dpr=window.devicePixelRatio||1;cv.width=r.width*dpr;cv.height=r.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);redraw()}
  function pt(e){const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*240,(e.clientY-r.top)/r.height*100]}
  function redraw(){const r=cv.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);ctx.strokeStyle='#2443a6';ctx.lineWidth=2.4;ctx.lineCap='round';ctx.lineJoin='round';const sx2=r.width/240,sy2=r.height/100;strokes.forEach(s=>{ctx.beginPath();s.forEach((p,i)=>i?ctx.lineTo(p[0]*sx2,p[1]*sy2):ctx.moveTo(p[0]*sx2,p[1]*sy2));ctx.stroke()})}
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);cur=[pt(e)];strokes.push(cur);redraw()});
  cv.addEventListener('pointermove',e=>{if(!cur)return;const p=pt(e),l=cur[cur.length-1];if(Math.hypot(p[0]-l[0],p[1]-l[1])>1.5){cur.push(p);redraw()}});
  const end=e=>{if(cur&&e&&e.clientX!=null){const p=pt(e),l=cur[cur.length-1];if(Math.hypot(p[0]-l[0],p[1]-l[1])>0.5){cur.push(p);redraw()}}cur=null};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  requestAnimationFrame(size);
  return{clear(){strokes.length=0;this.seed=null;redraw()},count(){let L=0;strokes.forEach(s=>{for(let i=1;i<s.length;i++)L+=Math.hypot(s[i][0]-s[i-1][0],s[i][1]-s[i-1][1])});return L},
    auto(){strokes.length=0;const seed=ri(1,1e7);this.seed=seed;const r=cv.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);const p=new Path2D();sigOf(seed).forEach(d=>p.addPath(new Path2D(d)));ctx.save();ctx.scale(r.width/240,r.height/100);ctx.strokeStyle='#2443a6';ctx.lineWidth=2.4;ctx.lineCap='round';ctx.stroke(p);ctx.restore()},
    paths(){if(this.seed&&!strokes.length)return sigOf(this.seed);return strokes.filter(s=>s.length>1).map(s=>{let d=`M${s[0][0].toFixed(1)} ${s[0][1].toFixed(1)}`;for(let i=1;i<s.length-1;i++){const m=[(s[i][0]+s[i+1][0])/2,(s[i][1]+s[i+1][1])/2];d+=` Q${s[i][0].toFixed(1)} ${s[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`}const l=s[s.length-1];d+=` L${l[0].toFixed(1)} ${l[1].toFixed(1)}`;return d})},
    _strokes:strokes};
}
$('#b-signed').onclick=()=>{
  if(!pad2)return;const ps=pad2.paths();
  if(!ps.length||(!pad2.seed&&pad2.count()<60)){toast('Распишитесь, пожалуйста. Без подписи нельзя.','bad');SND.play('buzz');return}
  S.sig=ps;SND.play('thump');vib(30);startDay();
};
function emblem(){return `<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="27" fill="none" stroke="#25242b" stroke-width="2"/><path d="M12 40 q18 14 36 0" fill="none" stroke="#2e7a48" stroke-width="3" stroke-dasharray="3 2"/><rect x="17" y="14" width="10" height="16" rx="2" fill="#4b3fa3" transform="rotate(-25 22 22)"/><rect x="33" y="14" width="10" height="16" rx="2" fill="#b4222f" transform="rotate(25 38 22)"/><path d="M22 34 v-6 a8 8 0 0 1 16 0 v10 a5 5 0 0 1 -10 0 v-9" fill="none" stroke="#25242b" stroke-width="2.2" stroke-linecap="round"/></svg>`}

/* --- утренняя планёрка --- */
function setDayCtx(){
  const day=S.day;let ev=S.run.events[day]||null;
  S.run.arcs.forEach(id=>{const e=ARCS[id].event&&ARCS[id].event(day,S.arcs[id]);if(e)ev=e});
  if(!ev&&day===S.run.glitchDay&&S.upg&&S.upg.sver)ev='glitch';
  G={today:dayDate(day),tariff:tariffFor(day),plan:PLAN[day]+(day>=3?diff().plan:0),event:ev,suspend:[],fineMul:day===12?2:1,freeErr:Math.max(1,role().freeErr+diff().free),season:seasonFor(day)};
  G.clockMul=ev==='noqueue'?1.25:1;
  if(ev==='gosu')G.suspend=['R_GOSU'];
  if(ev==='audit')G.fineMul=2;
}
function seasonStrip(){const s=G.season;if(!s)return '';const c=s.cal;return `<div class="seasonbar"><span class="sb-k">За окном · ${WD[G.today.getDay()]} ${pad(G.today.getDate())}.${pad(G.today.getMonth()+1)}</span><b>${s.weather.t}</b><span>${s.weather.p}</span>${c?`<b class="sb-cal">${c.t}</b><span>${c.p}</span>`:''}</div>`}
const newRulesOn=day=>POOL_ORDER.filter(id=>S.run.rules[id]===day&&day>1);
function directive(day){
  if(day===1)return DIR1;if(day===12)return DIR12;
  const ds=newRulesOn(day).map(ruleDir);
  const t=ds.length===1?ds[0][0]:ds.length?'О внесении изменений в регламент':'О неукоснительном соблюдении';
  let p=ds.length?ds.map(d=>d[1]).join(' '):'Регламент окна №7 признан совершенным. Изменений не вносить.';
  if(S.run.params.tariffDay===day)p+=' Кроме того, в целях снижения нагрузки на граждан госпошлина повышается до 412,50 ₽.';
  return{t,p};
}
function startDay(){
  setDayCtx();DAYSTART=clone(S);save();
  const D=directive(S.day),newR=newRulesOn(S.day),ev=G.event&&EVENTS[G.event];
  const tariffLine=isActive('R_SUM')||isActive('R_RECEIPT')?`<span>Госпошлина: <b>${rub(G.tariff)}</b>${S.run.params.tariffDay===S.day?' (было 350 ₽)':''}</span>`:'';
  $('#brief').innerHTML=`${NOTES[S.day]?`<div class="sticky">${NOTES[S.day]}</div>`:''}
  ${seasonStrip()}
  ${S.run.wanted&&S.run.wanted.day===S.day?`<div class="evcard"><span class="ev-k">Ориентировка · дежурная часть</span><h3>Разыскивается</h3><p>${esc(wantedFlyer())}</p></div>`:''}
  ${ev?`<div class="evcard"><span class="ev-k">Телефонограмма · срочно</span><h3>${ev.t}</h3><p>${ev.p}</p></div>`:''}
  <div class="sheetpaper">
    <div class="lh">${emblem()}<div><div class="lh-t">Министерство цифрового развития, связи и справок<br>МФЦ «Мои справки» г. Верхнеберёзовска</div><div class="lh-n">Исх. № ${S.day*37+104}-ДИР от ${dd(G.today)} · ${WD[G.today.getDay()]}</div></div></div>
    <h2>Распоряжение № ${S.day}</h2><p class="subj">«${D.t}»</p>
    <p>${D.p}</p>
    ${newR.length?`<p>С сегодняшнего дня в регламент окна №7 вносятся следующие пункты:</p><ol class="newrules">${newR.map(id=>`<li>${ruleText(id)}</li>`).join('')}</ol>`:S.day===1?`<p>Действующий регламент:</p><ol class="newrules">${CORE.map(id=>`<li>${ruleText(id)}</li>`).join('')}</ol>`:'<p>Новых пунктов нет. Действующий регламент соблюдать неукоснительно.</p>'}
    <div class="planbox"><span>План на день: <b>${G.plan}</b> ${plural(G.plan,"заявление","заявления","заявлений")}</span>${tariffLine}<span>День ${S.day} из 12</span></div>
    ${S.day===1?'<p style="font:13px/1.45 var(--f-ui);background:#efe9d6;padding:8px 10px">Как работать: '+(freeDesk()?'раскладывайте сами бумаги по столу, касайтесь листа, чтобы поднять его наверх. Включите <b>«Сверку»</b>, выберите два поля (или поле и пункт регламента) и нажмите <b>«Сверить»</b>.':'листайте документы или выбирайте вкладку. Включите <b>«Сверку»</b> и выберите два поля (или поле и пункт регламента) — результат появится сразу.')+' Затем <b>перетащите печать</b> на графу «Отметка МФЦ» в заявлении и <b>смахните документы вверх</b> — вернуть гражданину.</p>':''}
    <div class="signrow"><span>Начальник отдела</span>${sigSVG(4242,'#2443a6',true,.2)}<span>П. П. Ступин</span><span id="brief-stamp"></span></div>
  </div>`;
  show('s-brief');$('#brief').scrollTop=0;
  setTimeout(()=>{const s=$('#brief-stamp');if(!s)return;s.outerHTML=MFC_STAMP().replace('class="stamp ','class="stamp imprint ');const st=$('#brief .signrow .stamp');if(st)st.style.setProperty('--r',(Math.random()*20-10).toFixed(1)+'deg');SND.play('thump');vib(25)},900);
}
$('#b-open').onclick=()=>openWindow();
