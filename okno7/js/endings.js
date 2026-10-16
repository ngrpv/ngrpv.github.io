'use strict';
/* =========================================================
   КОНЦОВКИ
   ========================================================= */
function recordEnding(id){const A=archive();const a=A[id]||{d:S.day,n:0,t:Date.now()};a.n++;A[id]=a;store.set('archive',A);return a.n===1}
function ending(id){
  clearInterval(clockI);AMB.stop();
  const e=ENDINGS[id],today=dayDate(S.day),fresh=recordEnding(id);
  if(!e.fail)store.del('save');
  const arcRows=S.run.arcs.filter(a=>S.arcs[a].met).map(a=>ARCS[a].stat(S.arcs[a])).map(([k,v])=>`<span>${k}</span><b>${v}</b>`).join('');
  $('#end').innerHTML=`<div class="paperfront"><div class="mast">Верхнеберёзовский вестник</div><div class="meta"><span>№ ${200+S.day}</span><span>${dd(today)}</span><span>Цена: 15 ₽</span></div>
    <div class="kick">${e.k}</div><h1>${e.h}</h1>${e.p.map(p=>`<p>${p}</p>`).join('')}
    ${id==='promo'?promoComposer():''}
    <div class="stats"><span>Должность</span><b>${role().t.toLowerCase()}</b><span>Отработано дней</span><b>${S.day}</b><span>Рассмотрено заявлений</span><b>${S.tot.processed}</b><span>Ошибок в протоколах</span><b>${S.tot.errors}</b><span>Конвертов</span><b>${S.tot.bribes}${S.tot.bribeSum?` (${money(S.tot.bribeSum)})`:''}</b><span>На счету</span><b>${money(S.money)}</b>${arcRows}</div>
  </div>
  <p class="foundline">${fresh?'Новая вырезка в архиве! ':''}Найдено концовок: <b>${foundCount()} из ${END_ORDER.length}</b></p>`;
  $('#b-replay').hidden=!e.fail||!DAYSTART;$('#b-replay').textContent=`Переиграть день ${S.day}`;
  show('s-end');$('#end').scrollTop=0;SND.play(e.fail?'thump':'good');
  if(id==='promo')bindPromo();
}
const PROMO=[['В целях',['снижения нагрузки на граждан','повышения доступности услуг','цифровой трансформации','укрепления традиционных ценностей']],['ввести',['справку о наличии справок','обязательное стояние в очереди','госпошлину за вход в МФЦ','подтверждение подтверждённой учётной записи']],['для',['всех граждан','граждан на букву «Ж»','пенсионеров по средам','лиц, не имеющих справки']]];
function promoComposer(){return `<div id="promo">${PROMO.map((g,i)=>`<div class="lbl">${g[0]}</div><div class="chips" data-g="${i}">${g[1].map((o,j)=>`<button aria-pressed="false" data-o="${j}">${o}</button>`).join('')}</div>`).join('')}<button class="btn primary" id="b-decree" style="width:100%" disabled>Подписать распоряжение</button><div id="decree"></div></div>`}
function bindPromo(){const ch=[null,null,null];$$('#promo .chips').forEach(c=>c.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const g=+c.dataset.g;ch[g]=+b.dataset.o;$$('button',c).forEach(x=>x.setAttribute('aria-pressed',x===b));$('#b-decree').disabled=ch.some(x=>x==null)}));
  $('#b-decree').onclick=()=>{const t=`${PROMO[0][0]} ${PROMO[0][1][ch[0]]} с ${dd(addDays(dayDate(S.day),1))} ${PROMO[1][0]} ${PROMO[1][1][ch[1]]} ${PROMO[2][0]} ${PROMO[2][1][ch[2]]}.`;
    $('#decree').innerHTML=`<div class="decree"><b>РАСПОРЯЖЕНИЕ № 1</b><br>${t}<br>Распоряжение вступает в силу немедленно.<div class="signrow" style="min-height:60px">Начальник отдела ${sigSVG(S.sig,'#2443a6',true)}</div>${MFC_STAMP().replace('class="stamp ','class="stamp imprint ')}</div><p style="margin-top:10px">Завтра в окне №7 будет новый специалист. Он будет очень стараться.</p>`;
    $('#b-decree').hidden=true;$$('#promo .chips').forEach(c=>c.style.pointerEvents='none');setTimeout(()=>{SND.play('thump');vib(40)},900)}}
