'use strict';
/* =========================================================
   ЗНАКИ ОТЛИЧИЯ
   ========================================================= */
/* when: day — после вечера, final — дошли до финала (12-й день без провальной концовки), end — после любой концовки */
const ACH=[
  {id:'flawless',t:'Безупречное окно',d:'Закрыть день без единой ошибки и выполнить план.',when:'day',test:()=>!!(E&&E.quality>0)},
  {id:'streak12',t:'Рука не дрогнула',d:'Принять 12 верных решений подряд.',when:'day',test:()=>!!(S.stats&&S.stats.best>=12)},
  {id:'incorruptible',t:'Неподкупный',d:'Дойти до финала, не взяв ни конверта, ни пирожка.',when:'final',test:()=>S.tot.bribes===0&&!(S.stats&&S.stats.pies)},
  {id:'honest_rich',t:'Честным трудом',d:'Закончить игру с 9 000 ₽ и больше, не взяв ни одного конверта.',when:'final',test:()=>S.money>=9000&&S.tot.bribes===0},
  {id:'clean',t:'Чистый протокол',d:'Дойти до финала не больше чем с шестью ошибками за все смены.',when:'final',test:()=>S.tot.errors<=6},
  {id:'hard',t:'Строгий режим',d:'Дойти до финала на строгой сложности.',when:'final',test:()=>S.diff==='hard'},
  {id:'daily',t:'Смена дня',d:'Дойти до финала в «Смене дня».',when:'final',test:()=>!!S.daily},
  {id:'archive5',t:'Подшивка',d:'Найти пять концовок.',when:'end',test:()=>foundCount()>=5},
  {id:'archive_all',t:'Весь вестник',d:'Найти все концовки.',when:'end',test:()=>foundCount()>=END_ORDER.length}
];
const achDone=()=>store.get('ach')||{};
/* проверить знаки данного момента, вернуть только что полученные */
function checkAch(when){
  const have=achDone(),got=[];
  ACH.forEach(a=>{if(a.when===when&&!have[a.id]&&a.test())got.push(a)});
  if(got.length){const n={...have};got.forEach(a=>n[a.id]={t:Date.now()});store.set('ach',n)}
  return got;
}
function announceAch(list){if(!list.length)return;toast('Знак отличия: «'+list.map(a=>a.t).join('», «')+'»','good',3200);SND.play('good')}
function openAchievements(){
  const have=achDone();
  infoModal(`<h3>Знаки отличия</h3><p style="font-size:13px;color:var(--ink-soft)">Получено: ${ACH.filter(a=>have[a.id]).length} из ${ACH.length}</p>
  <ul class="achlist">${ACH.map(a=>`<li class="${have[a.id]?'got':''}"><b>${have[a.id]?'★':'☆'} ${a.t}</b><span>${a.d}</span></li>`).join('')}</ul>`);
}
