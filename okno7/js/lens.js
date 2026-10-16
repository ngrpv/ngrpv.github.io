'use strict';
/* --- осмотр: УФ-лампа и лупа ---
   Кнопка «Осмотр» появляется, когда в регламенте есть пункт, который иначе не проверить. Нажатия листают режимы: выкл → УФ → лупа → выкл.
   Режим меняет только картинку документов (классы lens-uv / lens-loupe на #app); решение по-прежнему принимается печатью. */
const LENS_SAMPLES=['uv','micro'];
const LENSES=[
  {id:'uv',rule:'F_UV',t:'УФ',hint:'УФ-лампа: на настоящем паспорте светится герб. Листайте документы.'},
  {id:'loupe',rule:'F_MICRO',t:'Лупа',hint:'Лупа: печать на справке увеличена, по кромке читается микротекст.'}
];
const LENS_ICON={
  off:'<svg viewBox="0 0 26 24"><path d="M4 22 h10" stroke="#25242b" stroke-width="2.4" stroke-linecap="round"/><path d="M9 22 L11 11 L17 6" fill="none" stroke="#25242b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 4 L21 9 L18 13 L10 8Z" fill="#8a5cff" stroke="#25242b" stroke-width="1.7" stroke-linejoin="round"/><path d="M19 15 l3 3 M22 12 l2 1 M16 17 l1 3" stroke="#25242b" stroke-width="1.5" stroke-linecap="round"/></svg>',
  uv:'<svg viewBox="0 0 26 24"><path d="M5 12 h10 l3 -6 h4 v12 h-4 l-3 -6" fill="#8a5cff" stroke="#25242b" stroke-width="1.8" stroke-linejoin="round"/><path d="M2 8 l3 4 -3 4" stroke="#25242b" stroke-width="1.6" fill="none"/></svg>',
  loupe:'<svg viewBox="0 0 26 24"><circle cx="11" cy="11" r="7.5" fill="rgba(255,255,255,.7)" stroke="#25242b" stroke-width="2"/><text x="11" y="14" text-anchor="middle" font-size="9" font-weight="700" fill="#25242b" font-family="PT Sans Narrow,sans-serif">Aa</text><path d="M16.5 16.5 L23 22" stroke="#25242b" stroke-width="3.2" stroke-linecap="round"/></svg>'
};
const lensAvail=()=>LENSES.filter(l=>isActive(l.rule));
function updateLensBtn(){
  const b=$('#b-lens');if(!b)return;const av=W?lensAvail():[];b.hidden=!av.length;
  $('.tools').classList.toggle('four',!!av.length);
  const cur=W&&W.lens;const L=LENSES.find(l=>l.id===cur);
  b.innerHTML=(LENS_ICON[cur||'off'])+(L?L.t:'Осмотр');b.setAttribute('aria-pressed',!!cur);
}
function setLens(id,silent){
  if(W)W.lens=id||null;
  if(id)setInsp(false,true);
  const app=$('#app');app.classList.toggle('lens-uv',id==='uv');app.classList.toggle('lens-loupe',id==='loupe');
  updateLensBtn();
  if(id&&!silent){SND.play('tick');toast(LENSES.find(l=>l.id===id).hint,null,2600)}
}
$('#b-lens').onclick=()=>{
  if(!W)return;const ids=[null,...lensAvail().map(l=>l.id)];
  const i=ids.indexOf(W.lens||null);setLens(ids[(i+1)%ids.length]);
};
