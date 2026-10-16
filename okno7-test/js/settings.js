'use strict';
const UI_MODES=[
  {id:'classic',t:'Классический',d:'Перелистывание бумаг и вкладки. Сверка сразу после выбора двух полей.'},
  {id:'free',t:'Свободный стол',d:'Раскладывайте бумаги сами. Увеличивайте стол и сверяйте фрагменты рядом.'}
];
function applyInterfaceMode(){
  const app=$('#app'),mode=uiMode(),previous=app.dataset.interfaceMode;
  const idx=activeDocIdx(),hasPapers=!!(W&&W.v&&W.v.docEls&&$('#car').children.length);
  if(previous===mode){app.classList.toggle('classic-ui',mode==='classic');return}
  if(hasPapers&&previous==='free')W.freeLayout=documentLayout();
  app.dataset.interfaceMode=mode;app.classList.toggle('classic-ui',mode==='classic');
  setDeskFocus(false);clearSel();
  if(!hasPapers)return;
  const car=$('#car');car.scrollLeft=0;
  if(mode==='free'){
    layoutDocuments(W.freeLayout);raiseDocument(W.v.docEls[idx],false);
  }else centerClassicDocument(W.v.docEls[idx]||car.children[0]);
}
function setInterfaceMode(mode){
  if(!UI_MODES.some(m=>m.id===mode))return false;
  if(mode===uiMode())return false;
  store.set('interfaceMode',mode);applyInterfaceMode();return true;
}
function openSettings(){
  if(!$('#modal').hidden)return;
  closeSheet();
  infoModal(`<h3>Настройки</h3><div class="mode-options" role="radiogroup" aria-label="Интерфейс игры">${UI_MODES.map(m=>`<button class="mode-option" role="radio" aria-checked="${uiMode()===m.id}" data-ui-mode="${m.id}"><b>${m.t}</b><span>${m.d}</span></button>`).join('')}</div><p class="settings-note">Можно переключать во время смены. Выбор сохраняется.</p><p class="settings-status" id="settings-status" role="status" aria-live="polite"></p>`,()=>{delete $('#modal').dataset.settings});
  $('#modal').dataset.settings='true';
}
$('#b-settings').onclick=openSettings;$('#b-work-settings').onclick=openSettings;
$('#modal').addEventListener('click',e=>{
  const b=e.target.closest('[data-ui-mode]');if(!b)return;
  const hadSelection=!!(W&&W.sel&&W.sel.length);
  if(!setInterfaceMode(b.dataset.uiMode))return;
  $$('#modal [data-ui-mode]').forEach(x=>x.setAttribute('aria-checked',String(x.dataset.uiMode===uiMode())));
  $('#settings-status').textContent='Режим включён.'+(hadSelection?' Выберите поля для новой сверки.':'');
});
$('#modal').addEventListener('keydown',e=>{
  const m=$('#modal');if(m.dataset.settings!=='true')return;
  if(e.code==='Escape'){e.preventDefault();e.stopPropagation();m.querySelector('[data-m]').click();return}
  const choices=$$('#modal [data-ui-mode]'),idx=choices.indexOf(e.target);
  if(idx>=0&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){
    e.preventDefault();e.stopPropagation();const next=choices[(idx+(/Up|Left/.test(e.code)?choices.length-1:1))%choices.length];next.focus();next.click();return;
  }
  if(e.code==='Tab'){
    const buttons=$$('#modal button');
    if(e.shiftKey&&e.target===buttons[0]){e.preventDefault();buttons[buttons.length-1].focus()}
    else if(!e.shiftKey&&e.target===buttons[buttons.length-1]){e.preventDefault();buttons[0].focus()}
  }
});
