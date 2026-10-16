'use strict';
/* =========================================================
   СМЕНА ДНЯ: у всех в этот день одинаковые правила, события, сюжеты и посетители
   ========================================================= */
const dailyKey=(d=new Date())=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const dailySeed=key=>hash(...key.split('-').map(Number));
const dailyLabel=key=>key.slice(8)+'.'+key.slice(5,7);
function dailyResult(){const r=store.get('daily');return r&&r.key===dailyKey()?r:null}
function startDaily(){
  const key=dailyKey();
  S=freshState('young','normal');S.daily={key,seed:dailySeed(key)};
  withSeed(S.daily.seed,setupRun);
  SND.play('thump');openContract();
}
$('#b-daily').onclick=()=>{
  const sv=store.get('save');
  if(sv&&sv.run&&!sv.daily){modal(`<h3>Смена дня</h3><p>Сохранённая игра (день ${sv.day}) будет заменена. «Смена дня» — молодой специалист, обычная сложность, у всех сегодня одна и та же партия.</p><div class="row"><button class="btn" data-m="no">Не надо</button><button class="btn primary" data-m="yes">Начать</button></div>`,m=>{if(m==='yes')startDaily()});return}
  startDaily();
};
/* результат для пересылки */
function dailyShareText(r){
  const url=/^https?:/.test(location.href)?location.origin+location.pathname:'';
  return `«Следующий!» · Смена дня ${dailyLabel(r.key)}\nКонцовка: «${r.heading}»\nДней: ${r.days} из 12 · ошибок: ${r.errors} · на счету: ${money(r.money)}${url?'\n'+url:''}`;
}
async function shareDaily(){
  const r=store.get('daily');if(!r)return;
  const text=dailyShareText(r);
  try{if(navigator.share){await navigator.share({text});return}}catch(e){if(e&&e.name==='AbortError')return}
  try{await navigator.clipboard.writeText(text);toast('Результат скопирован','good',2200);return}catch(e){}
  infoModal(`<h3>Результат</h3><p style="white-space:pre-wrap;user-select:text;-webkit-user-select:text">${esc(text)}</p>`);
}
$('#b-share').onclick=()=>shareDaily();
