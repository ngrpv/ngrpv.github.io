'use strict';
/* Бумаги на столе: независимая раскладка, верхний лист и место для чтения. */
function uiMode(){return store.get('interfaceMode')==='classic'?'classic':'free'}
function freeDesk(){return uiMode()==='free'}
function setDeskFocus(on){
  on=!!on&&freeDesk();
  $('#s-work').classList.toggle('desk-focus',!!on);
  const b=$('#b-desk');b.setAttribute('aria-expanded',String(!!on));
  b.setAttribute('aria-label',on?'Вернуться к посетителю':'Поднять документы');
  b.querySelector('span').textContent=on?'К посетителю ↓':'Документы ближе ↑';
}
$('#b-desk').onclick=()=>setDeskFocus(!$('#s-work').classList.contains('desk-focus'));
/* Можно выдвинуть низ длинного листа, но нельзя потерять бумагу за краем стола. */
function deskPosition(x,y,width,height,paperWidth,paperHeight){
  const edge=Math.min(96,paperWidth,width),vertical=Math.min(80,paperHeight,height);
  return{x:clamp(x,edge-paperWidth,Math.max(0,width-edge)),y:clamp(y,Math.min(0,height-paperHeight-8),Math.max(0,height-vertical))};
}
function placeDocument(w,x,y){
  const car=$('#car'),p=deskPosition(x,y,car.clientWidth,car.clientHeight,w.offsetWidth,w.offsetHeight);
  w.dataset.x=p.x;w.dataset.y=p.y;
  w.style.left=p.x+'px';w.style.top=p.y+'px';
}
function raiseDocument(w,reveal){
  if(!w||!w.parentElement)return;
  const car=$('#car'),papers=[...car.children];
  if(!freeDesk()){
    if(reveal)car.scrollTo({left:w.offsetLeft-(car.clientWidth-w.clientWidth)/2,behavior:REDUCED?'auto':'smooth'});
    selectDocumentTab(papers.indexOf(w));return;
  }
  /* Компактные ранги не растут всю смену и не пересекают слои интерфейса. */
  const order=papers.filter(p=>p!==w).sort((a,b)=>(+a.style.zIndex||0)-(+b.style.zIndex||0));order.push(w);
  order.forEach((p,i)=>{p.style.zIndex=i+1;p.classList.toggle('front',p===w)});
  selectDocumentTab(papers.indexOf(w));
  if(reveal)placeDocument(w,(car.clientWidth-w.offsetWidth)/2,8);
}
function selectDocumentTab(idx){$$('#tabs .tab').forEach((t,i)=>{t.classList.toggle('on',i===idx);t.setAttribute('aria-pressed',String(i===idx))})}
function centerClassicDocument(w){const car=$('#car');car.scrollLeft=w.offsetLeft-(car.clientWidth-w.clientWidth)/2;selectDocumentTab([...car.children].indexOf(w))}
function layoutDocuments(saved){
  const papers=[...$('#car').children],count=papers.length;
  if(!freeDesk()){const w=papers[activeDocIdx()];if(w)centerClassicDocument(w);return}
  papers.forEach((w,i)=>{
    const old=saved&&saved[w.dataset.k],rank=count-i;
    placeDocument(w,old?old.x:12+(i%3)*8,old?old.y:(count-1-i)*38+8);
    w.style.zIndex=old?old.z:rank;
  });
  const front=papers.reduce((a,w)=>!a||+w.style.zIndex>+a.style.zIndex?w:a,null);
  if(front)raiseDocument(front,false);
}
function documentLayout(){
  const saved={};[...$('#car').children].forEach(w=>{saved[w.dataset.k]={x:+w.dataset.x||0,y:+w.dataset.y||0,z:+w.style.zIndex||0}});return saved;
}
/* При изменении доступной высоты листы остаются под рукой, раскладка не сбрасывается. */
if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{
  if(!freeDesk())return;
  [...$('#car').children].forEach(w=>placeDocument(w,+w.dataset.x||0,+w.dataset.y||0));
}).observe($('#car'));
function prepareDocument(w,label){
  w.dataset.label=label;
  w.tabIndex=0;w.setAttribute('role','group');w.setAttribute('aria-label',label+' на столе');
  const body=document.createElement('div');body.className='docbody';
  while(w.firstChild)body.appendChild(w.firstChild);
  w.appendChild(body);
  w.addEventListener('keydown',e=>{
    if(e.target!==w||!freeDesk())return;
    const d={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]}[e.code];
    if(!d)return;e.preventDefault();e.stopPropagation();setDeskFocus(true);raiseDocument(w,false);
    placeDocument(w,(+w.dataset.x||0)+d[0],(+w.dataset.y||0)+d[1]);
  });
}
(function paperGestures(){
  const car=$('#car');let drag=null,suppressClick=false;
  car.addEventListener('pointerdown',e=>{
    if(!freeDesk())return;
    const w=e.target.closest('.docwrap');if(!w||e.button>0)return;
    raiseDocument(w,false);
    if(W&&W.ret)return;
    w.classList.add('still');
    drag={w,id:e.pointerId,x:e.clientX,y:e.clientY,left:+w.dataset.x||0,top:+w.dataset.y||0,moved:false};
  });
  car.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!drag.moved&&Math.hypot(dx,dy)<7)return;
    if(!drag.moved){drag.moved=true;if(W&&W.v&&!W.v.done)setDeskFocus(true);drag.w.classList.add('dragging');try{drag.w.setPointerCapture(e.pointerId)}catch(_){}SND.play('rustle')}
    placeDocument(drag.w,drag.left+dx,drag.top+dy);
  });
  const end=e=>{
    if(!drag||drag.id!==e.pointerId)return;
    suppressClick=drag.moved;drag.w.classList.remove('dragging');drag=null;
    setTimeout(()=>suppressClick=false,0);
  };
  car.addEventListener('pointerup',end);car.addEventListener('pointercancel',end);
  car.addEventListener('wheel',e=>{
    if(!freeDesk())return;
    const w=e.target.closest('.docwrap');if(!w||W&&W.ret)return;
    e.preventDefault();raiseDocument(w,false);w.classList.add('still');
    placeDocument(w,(+w.dataset.x||0)-e.deltaX,(+w.dataset.y||0)-e.deltaY);
  },{passive:false});
  car.addEventListener('click',e=>{
    if(!freeDesk())return;
    if(suppressClick){e.preventDefault();e.stopPropagation();return}
    const w=e.target.closest('.docwrap');if(w){raiseDocument(w,false);if(W&&W.v&&!W.v.done)setDeskFocus(true)}
  },true);
  car.addEventListener('scroll',()=>{
    if(freeDesk())return;
    const c=car.scrollLeft+car.clientWidth/2;let best=0,dist=Infinity;
    [...car.children].forEach((w,i)=>{const d=Math.abs(w.offsetLeft+w.clientWidth/2-c);if(d<dist){dist=d;best=i}});
    if(car.scrollLeft>0&&car.scrollLeft+car.clientWidth>=car.scrollWidth-2)best=car.children.length-1;
    selectDocumentTab(best);
  },{passive:true});
})();
function revealStampZone(w){
  if(!freeDesk()){
    centerClassicDocument(w);const zone=w.querySelector('.stampzone'),r=zone.getBoundingClientRect(),bounds=w.getBoundingClientRect();
    if(r.bottom>bounds.bottom||r.top<bounds.top)w.scrollTop+=r.top-bounds.top-bounds.height*.45;
    return;
  }
  scrollToDoc(w);const zone=w.querySelector('.stampzone'),car=$('#car').getBoundingClientRect(),r=zone.getBoundingClientRect();
  placeDocument(w,+w.dataset.x||0,(+w.dataset.y||0)+car.top+car.height*.58-(r.top+r.height/2));
}
