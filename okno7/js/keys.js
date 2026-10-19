'use strict';
/* =========================================================
   КЛАВИШИ (на телефоне не мешают, на компьютере ускоряют)
   ========================================================= */
const press=id=>{const b=$(id);if(b&&!b.hidden&&!b.disabled){b.click();return true}return false};
function goDoc(i){const c=$('#car').children;if(!c.length)return;scrollToDoc(c[Math.max(0,Math.min(c.length-1,i))])}
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||e.isComposing||e.repeat)return;
  const t=e.target,tag=t&&t.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(t&&t.isContentEditable))return;
  const onBtn=tag==='BUTTON'||tag==='A',k=e.code,modalOpen=!$('#modal').hidden,sheetOpen=!$('#sheet').hidden;
  const done=()=>{e.preventDefault();e.stopPropagation()};
  if(k==='Escape'){if(sheetOpen){closeSheet();done()}return}
  if(k==='KeyM'){$('#b-mute').click();toast('Звук: '+(SND.muted?'выкл.':'вкл.'),null,1200);done();return}
  if(k==='KeyH'||(k==='Slash'&&e.shiftKey)){if(!modalOpen){openHelp();done()}return}
  if(modalOpen)return;                      /* в окнах Enter и Пробел нажимают кнопку сами */
  const work=!$('#s-work').hidden&&W&&!W.ended;
  if(!work){
    if((k==='Enter'||k==='Space')&&!onBtn){const b=$$('.screen:not([hidden]) .btn.primary').find(x=>!x.hidden&&!x.disabled);if(b){b.click();done()}}
    return;
  }
  if(sheetOpen){                            /* основание для отказа: цифрой */
    const m=/^Digit([1-9])$/.exec(k);if(m){const r=$$('#sheet [data-reason]')[+m[1]-1];if(r){r.click();done()}}
    return;
  }
  if((k==='Space'||k==='Enter')&&!onBtn){if(press('#b-next')||press('#b-ret'))done();return}
  if(k==='KeyE'&&!onBtn&&press('#b-end')){done();return}
  switch(k){
    case'ArrowLeft':goDoc(activeDocIdx()-1);done();break;
    case'ArrowRight':goDoc(activeDocIdx()+1);done();break;
    case'KeyS':press('#b-insp');done();break;
    case'KeyB':press('#b-book');done();break;
    case'KeyT':press('#b-phone');done();break;
    case'KeyY':if(!$('#stamps').hidden&&press('#b-ok'))done();break;
    case'KeyN':if(!$('#stamps').hidden&&press('#b-no'))done();break;
    default:{const m=/^Digit([1-9])$/.exec(k);if(m){goDoc(+m[1]-1);done()}}
  }
});
