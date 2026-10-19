'use strict';
/* =========================================================
   КОНЦОВКИ
   ========================================================= */
function recordEnding(id){const A=archive();const a=A[id]||{d:S.day,n:0,t:Date.now()};a.n++;A[id]=a;store.set('archive',A);return a.n===1}
const HELP_EPILOGUE={babushka:'На стене общей кухни висит список жертвователей. В нём строчка: «Специалист окна №7 — 1 500 ₽ и ни одного пирожка». Зинаида Павловна считает, что это хороший баланс.',it:'Юрист, которого вы оплатили, нашёл у Глеба пункт об «удалённой работе из любой точки мира, кроме места проживания». Пункт вычеркнули. Глеб до сих пор пытается вернуть вам три тысячи, отец считает, что надо принять.',student:'Про оплаченную повторную справку Лиза узнала от секретаря деканата. Та описала вас как «человека с лицом, которое всё понимает». Макет в коробке от микроволновки подписан: «Спасибо окну №7».'};
const helpEpilogue=id=>S.flags&&S.flags.helped&&S.flags.helped[id]&&HELP_EPILOGUE[id]?[HELP_EPILOGUE[id]]:[];
function ending(id){
  clearInterval(clockI);AMB.stop();
  const e=ENDINGS[id],today=dayDate(S.day),fresh=recordEnding(id);
  if(!e.fail)store.del('save');
  const reachedFinal=S.day>=12&&!e.fail;
  const got=[...checkAch('end'),...(reachedFinal?checkAch('final'):[])];
  if(S.daily)store.set('daily',{key:S.daily.key,end:id,heading:e.h,days:S.day,errors:S.tot.errors,money:S.money,final:reachedFinal});
  const arcRows=S.run.arcs.filter(a=>S.arcs[a].met).map(a=>ARCS[a].stat(S.arcs[a])).map(([k,v])=>`<span>${k}</span><b>${v}</b>`).join('');
  $('#end').innerHTML=`<div class="paperfront"><div class="mast">Верхнеберёзовский вестник</div><div class="meta"><span>№ ${200+S.day}</span><span>${dd(today)}</span><span>Цена: 15 ₽</span></div>
    <div class="kick">${e.k}</div><h1>${e.h}</h1>${[...e.p,...helpEpilogue(id)].map(p=>`<p>${p}</p>`).join('')}
    ${id==='promo'?promoComposer():''}
    <div class="stats"><span>Должность</span><b>${role().t.toLowerCase()}</b><span>Отработано дней</span><b>${S.day}</b><span>Рассмотрено заявлений</span><b>${S.tot.processed}</b><span>Ошибок в протоколах</span><b>${S.tot.errors}</b><span>Конвертов</span><b>${S.tot.bribes}${S.tot.bribeSum?` (${money(S.tot.bribeSum)})`:''}</b><span>На счету</span><b>${money(S.money)}</b>${arcRows}</div>
  </div>
  ${reviewHtml()}
  ${got.length?`<div class="achnew"><b>Новые знаки отличия</b>${got.map(a=>`<span>★ ${a.t}<small>${a.d}</small></span>`).join('')}</div>`:''}
  <p class="foundline">${fresh?'Новая вырезка в архиве! ':''}Найдено концовок: <b>${foundCount()} из ${END_ORDER.length}</b>${nextHint()}</p>`;
  $('#b-share').hidden=!S.daily;
  $('#b-replay').hidden=!e.fail||!DAYSTART;$('#b-replay').textContent=`Переиграть день ${S.day}`;
  show('s-end');$('#end').scrollTop=0;SND.play(e.fail?'thump':'good');
  if(id==='promo')bindPromo();
}
/* разбор прохождения: где ошибались и что не открыто */
function reviewHtml(){
  const st=S.stats;if(!st||!st.seen)return '';
  const miss=Object.entries(st.miss).sort((a,b)=>b[1]-a[1]).slice(0,3).filter(([id])=>RULES[id]);
  const missSum=Object.values(st.miss).reduce((a,b)=>a+b,0),pct=Math.round(st.ok/st.seen*100);
  return `<div class="review"><b>Разбор смен</b>
    <div class="stats"><span>Верных решений</span><b>${st.ok} из ${st.seen} (${pct}%)</b><span>Лучшая серия</span><b>${st.best}</b><span>Упущено нарушений</span><b>${missSum}</b><span>Необоснованных отказов</span><b>${st.fals||0}</b><span>Дней без ошибок</span><b>${st.flawless||0}</b></div>
    ${miss.length?`<p>Чаще всего упускали: ${miss.map(([id,n])=>`«${esc(RULES[id].reason)}» (${n})`).join(', ')}.</p>`:'<p>Нарушений не упустили. Так держать.</p>'}</div>`;
}
function nextHint(){const left=END_ORDER.filter(id=>!archive()[id]);if(!left.length)return '';const e=ENDINGS[left[(S.day*7+S.tot.processed)%left.length]];return `<br><small>Подсказка к неоткрытой концовке: ${esc(e.hint)}.</small>`}
const PROMO=[['В целях',['снижения нагрузки на граждан','повышения доступности услуг','цифровой трансформации','укрепления традиционных ценностей']],['ввести',['справку о наличии справок','обязательное стояние в очереди','госпошлину за вход в МФЦ','подтверждение подтверждённой учётной записи']],['для',['всех граждан','граждан на букву «Ж»','пенсионеров по средам','лиц, не имеющих справки']]];
function promoComposer(){return `<div id="promo">${PROMO.map((g,i)=>`<div class="lbl">${g[0]}</div><div class="chips" data-g="${i}">${g[1].map((o,j)=>`<button aria-pressed="false" data-o="${j}">${o}</button>`).join('')}</div>`).join('')}<button class="btn primary" id="b-decree" style="width:100%" disabled>Подписать распоряжение</button><div id="decree"></div></div>`}
function bindPromo(){const ch=[null,null,null];$$('#promo .chips').forEach(c=>c.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const g=+c.dataset.g;ch[g]=+b.dataset.o;$$('button',c).forEach(x=>x.setAttribute('aria-pressed',x===b));$('#b-decree').disabled=ch.some(x=>x==null)}));
  $('#b-decree').onclick=()=>{const t=`${PROMO[0][0]} ${PROMO[0][1][ch[0]]} с ${dd(addDays(dayDate(S.day),1))} ${PROMO[1][0]} ${PROMO[1][1][ch[1]]} ${PROMO[2][0]} ${PROMO[2][1][ch[2]]}.`;
    $('#decree').innerHTML=`<div class="decree"><b>РАСПОРЯЖЕНИЕ № 1</b><br>${t}<br>Распоряжение вступает в силу немедленно.<div class="signrow" style="min-height:60px">Начальник отдела ${sigSVG(S.sig,'#2443a6',true)}</div>${MFC_STAMP().replace('class="stamp ','class="stamp imprint ')}</div><p style="margin-top:10px">Завтра в окне №7 будет новый специалист. Он будет очень стараться.</p>`;
    $('#b-decree').hidden=true;$$('#promo .chips').forEach(c=>c.style.pointerEvents='none');setTimeout(()=>{SND.play('thump');vib(40)},900)}}
