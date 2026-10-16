'use strict';
/* =========================================================
   РАБОЧАЯ СМЕНА
   ========================================================= */
/* фон зала: гул очереди (шум через полосовой фильтр с медленной «волной») и жужжание лампы 100 Гц */
const AMB={on:false,n:null,fl:0,
  start(){
    if(this.on||SND.muted||!SND.ctx)return;const c=SND.ctx;
    try{
      const master=c.createGain();master.gain.value=0.0001;master.connect(c.destination);
      const len=c.sampleRate*4,buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);let l=0;
      for(let i=0;i<len;i++){l=(l+0.02*(Math.random()*2-1))/1.02;d[i]=l*3.5}
      const src=c.createBufferSource();src.buffer=buf;src.loop=true;
      const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=380;bp.Q.value=.6;
      const crowd=c.createGain();crowd.gain.value=.4;
      const lfo=c.createOscillator();lfo.frequency.value=.11;const lg=c.createGain();lg.gain.value=.18;lfo.connect(lg);lg.connect(crowd.gain);
      src.connect(bp);bp.connect(crowd);crowd.connect(master);
      const hum=c.createOscillator();hum.type='sawtooth';hum.frequency.value=100;
      const hf=c.createBiquadFilter();hf.type='lowpass';hf.frequency.value=420;const hg=c.createGain();hg.gain.value=.035;
      hum.connect(hf);hf.connect(hg);hg.connect(master);
      src.start();lfo.start();hum.start();
      master.gain.exponentialRampToValueAtTime(.07,c.currentTime+2);
      this.n={master,src,lfo,hum,crowd,hg};this.on=true;
      this.fl=setInterval(()=>{if(!this.on||!W||W.paused)return;if(Math.random()<.18){const t=c.currentTime;hg.gain.setValueAtTime(.035,t);hg.gain.linearRampToValueAtTime(.11,t+.06);hg.gain.linearRampToValueAtTime(.035,t+.35);
        const sc=$('#scene');sc.classList.remove('flick');void sc.offsetWidth;sc.classList.add('flick')}},2200);
    }catch(e){this.on=false}
  },
  level(q){if(!this.on)return;try{this.n.crowd.gain.setTargetAtTime(.2+q*.8,SND.ctx.currentTime,1.2)}catch(e){}},
  quiet(on){if(!this.on)return;try{this.n.master.gain.setTargetAtTime(on?.012:.07,SND.ctx.currentTime,.4)}catch(e){}},
  stop(){if(!this.on)return;this.on=false;clearInterval(this.fl);const n=this.n;
    try{n.master.gain.setTargetAtTime(0.0001,SND.ctx.currentTime,.25);setTimeout(()=>{try{n.src.stop();n.lfo.stop();n.hum.stop();n.master.disconnect()}catch(e){}},1200)}catch(e){}}
};
document.addEventListener('visibilitychange',()=>{if(!SND.ctx)return;try{document.hidden?SND.ctx.suspend():SND.ctx.resume()}catch(e){}});
/* голос табло: speechSynthesis ru-RU, без русского голоса — тишина */
const VOICE={v:null,ok:typeof speechSynthesis!=='undefined',
  pick(){if(!this.ok)return null;const vs=speechSynthesis.getVoices()||[];return this.v=vs.find(x=>/^ru/i.test(x.lang))||null}};
if(VOICE.ok)try{speechSynthesis.addEventListener('voiceschanged',()=>VOICE.pick());VOICE.pick()}catch(e){VOICE.ok=false}
function announce(n){
  if(SND.muted||!VOICE.ok)return;const v=VOICE.v||VOICE.pick();if(!v)return;
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(`Талон А ${n}. Окно номер семь.`);u.voice=v;u.lang=v.lang;u.rate=1.02;u.pitch=.85;u.volume=.9;setTimeout(()=>speechSynthesis.speak(u),550)}catch(e){}
}
/* очередь за стеклом: растёт к обеду, после обеда — второй прилив, к вечеру тает */
function queueSize(t){let q;if(t<780)q=3+(t-540)/240*7;else if(t<840)q=10;else if(t<960)q=4+(t-840)/120*3;else q=7-(t-960)/120*5;
  if(G.event==='noqueue'||G.event==='gosu')q*=1.4;return Math.max(1,Math.min(14,Math.round(q-(W?W.processed*.15:0))))}
let QN=-1;
function renderQueue(force){
  const n=queueSize(W?W.time:540);if(n===QN&&!force)return;QN=n;
  const sp=[];for(let i=0;i<n;i++){const r=mulberry32(i*977+31),depth=r();const sc=(.58+depth*.4).toFixed(2);
    const tone=shade("#4f7c6b",-(.07+depth*.22)),far=1-depth;
    sp.push({z:depth,h:`<span style="left:${(2+r()*60).toFixed(1)}%;bottom:${(far*16).toFixed(0)}px;transform:scale(${sc});z-index:${Math.round(depth*10)};background:${tone};filter:blur(${(far*.8).toFixed(1)}px)"></span>`})}
  $('#queue').innerHTML=sp.sort((a,b)=>a.z-b.z).map(x=>x.h).join('');
  AMB.level(n/14);
}
let W=null,clockI=0;
function openWindow(){
  W={time:540,processed:0,errors:0,fines:0,bribes:0,idx:0,v:null,busy:false,lunchDone:false,notes:[],pirozhki:false,running:true,paused:0,sel:[],insp:false,ended:false,hintStep:-1,tut:S.day===1&&!store.get('tutDone')?0:-1,specials:planSpecials(),ret:null,pend:null,blogNote:false};
  show('s-work');
  $('#b-ok').innerHTML=dStamp('ПРИНЯТО','#4b3fa3');$('#b-no').innerHTML=dStamp('ОТКАЗАНО','#b4222f');
  $('#b-book').innerHTML=`<svg viewBox="0 0 26 24"><path d="M2 4 Q8 2 13 5 Q18 2 24 4 V21 Q18 19 13 22 Q8 19 2 21Z" fill="#fbf8f0" stroke="#25242b" stroke-width="1.6" stroke-linejoin="round"/><path d="M13 5 V22" stroke="#25242b" stroke-width="1.4"/><path d="M5 8 h5 M5 11 h5 M5 14 h4 M16 8 h5 M16 11 h5" stroke="#8a8790" stroke-width="1.2"/></svg>Регламент`;
  $('#b-insp').innerHTML=`<svg viewBox="0 0 26 24"><circle cx="10" cy="10" r="7" fill="rgba(180,220,255,.5)" stroke="#25242b" stroke-width="2"/><path d="M15 15 L23 22" stroke="#25242b" stroke-width="3.4" stroke-linecap="round"/></svg>Сверка`;
  $('#b-phone').innerHTML=`<svg viewBox="0 0 26 24"><path d="M3 9 Q13 2 23 9 L21 12 L17 10 L17 8 Q13 6.5 9 8 L9 10 L5 12Z" fill="#3a3a3a"/><path d="M5 13 h16 l2 9 h-20z" fill="#d8cdb4" stroke="#25242b" stroke-width="1.4"/><g fill="#25242b"><circle cx="10" cy="16" r="1"/><circle cx="13" cy="16" r="1"/><circle cx="16" cy="16" r="1"/><circle cx="10" cy="19" r="1"/><circle cx="13" cy="19" r="1"/><circle cx="16" cy="19" r="1"/></g></svg>Телефон`;
  const gpt=S.day>=10;$('#poster').classList.toggle('gpt',gpt);$('#poster').innerHTML=gpt?'ГосГПТ — уже скоро!'+GPT_FACE:'Госуслуги — это просто!'+qrSVG(77);
  QN=-1;renderQueue(true);AMB.start();
  if(!$('#wticks').childElementCount){let t='';for(let i=0;i<12;i++){const a=i*30*Math.PI/180;t+=`<line x1="${22+16*Math.sin(a)}" y1="${22-16*Math.cos(a)}" x2="${22+18*Math.sin(a)}" y2="${22-18*Math.cos(a)}"/>`}$('#wticks').innerHTML=t}
  $('#cit').className='citizen out-r';$('#cit').innerHTML='';
  $('#car').innerHTML='';$('#tabs').innerHTML='';$('#env').hidden=true;bubble(null);hideAsk();
  setInsp(false);setLens(null,true);setEmpty(true);showReturn(false);
  $('#blinds').classList.remove('down');
  $('#scene').classList.toggle('dark',G.event==='dark');$('#scene').dataset.w=G.season?G.season.w:'sun';$('#blogger').hidden=G.event!=='blogger';
  led(`А-${pad3(S.ticket)} → ОКНО 7`);
  hud();showNext(true);
  clearInterval(clockI);clockI=setInterval(tickClock,250);
  if(W.tut===0&&!W.specials[0])W.specials[0]={make:()=>genVisitor({arch:'pensioner',flaws:['R_FIO'],noBribe:true})};
  tut(0);
}
const GPT_FACE='<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" fill="#fff"/><circle cx="9" cy="12" r="2" fill="#1b2b4a"/><circle cx="15" cy="12" r="2" fill="#1b2b4a"/><path d="M9 16 h6" stroke="#1b2b4a" stroke-width="1.5"/><path d="M12 5 V2" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="2" r="1.3" fill="#ff5a5a"/></svg>';
const pad3=n=>String(n).padStart(3,'0');
function led(t){$('#led').textContent=t}
function tickClock(){
  if(!W||!W.running)return;
  if(W.paused>0||document.hidden)return;
  W.time+=0.5;
  if(!W.lunchDone&&W.time>=780&&W.time<840&&!W.v&&!W.busy){callLunch();}
  if(W.time>=1080){W.time=1080;hud();endShift();return}
  if(Math.floor(W.time*2)%2===0)hud();
}
function hud(){
  if(!W)return;const t=Math.floor(W.time),h=Math.floor(t/60),m=t%60;
  $('#h-clock').textContent=`${pad(h)}:${pad(m)}`;
  $('#hh').setAttribute('transform',`rotate(${(h%12+m/60)*30} 22 22)`);$('#mh').setAttribute('transform',`rotate(${m*6} 22 22)`);
  $('#h-day').textContent=`День ${S.day}`;$('#h-date').textContent=`${WD[G.today.getDay()]} ${pad(G.today.getDate())}.${pad(G.today.getMonth()+1)}${G.season?' · '+G.season.weather.s:''}`;
  $('#h-money').textContent=money(S.money+W.bribes);$('#h-plan').textContent=`план ${W.processed}/${G.plan}`;
  const m1=(id,val,bad)=>{const e=$(id);e.querySelector('u').style.width=clamp(val,0,100)+'%';e.classList.toggle('bad',bad)};
  renderQueue();
  m1('#m-loy',S.loyalty,S.loyalty<30);m1('#m-com',S.complaints,S.complaints>60);m1('#m-sus',S.suspicion,S.suspicion>50);
}
function setEmpty(on){const e=$('#desk-empty');e.hidden=!on;if(on)e.innerHTML=`<svg class="mug" viewBox="0 0 64 64"><ellipse cx="30" cy="54" rx="22" ry="5" fill="rgba(0,0,0,.15)"/><path d="M14 18 h32 v26 a10 10 0 0 1 -10 10 h-12 a10 10 0 0 1 -10 -10z" fill="#fbf8f0" stroke="#25242b" stroke-width="2"/><path d="M46 24 a8 8 0 0 1 0 16" fill="none" stroke="#25242b" stroke-width="2.5"/><ellipse cx="30" cy="18" rx="16" ry="4" fill="#6b4226" stroke="#25242b" stroke-width="2"/><text x="30" y="38" text-anchor="middle" font-family="PT Sans Narrow,sans-serif" font-weight="700" font-size="7.5" fill="#b4222f">ЛУЧШИЙ</text><text x="30" y="46" text-anchor="middle" font-family="PT Sans Narrow,sans-serif" font-weight="700" font-size="7.5" fill="#b4222f">СОТРУДНИК</text><path d="M24 12 q3 -5 0 -9 M33 12 q3 -5 0 -9" stroke="#aaa" stroke-width="1.5" fill="none"/></svg><span>Окно свободно. В очереди ещё человек ${Math.max(3,30-W.processed*2-(W.time-540)/40|0)}.</span>`}
function showNext(on){$('#b-next').hidden=!on;$('#stamps').hidden=on||!!(W&&W.ret)}
function showReturn(on){$('#b-ret').hidden=!on;$('#tray').classList.toggle('on',on);$('#retcue').hidden=!on;if(on){$('#stamps').hidden=true;$('#b-next').hidden=true}}
function stampsEnabled(on){$('#b-ok').disabled=!on;$('#b-no').disabled=!on}
function hint(t){const h=$('#hint');if(!t){h.hidden=true;h.classList.remove('top');return}$('#hint-t').textContent=t;h.hidden=false}
$('#hint-x').onclick=()=>{hint(null);if(W&&W.tut>=0){W.tut=-1;store.set('tutDone',true);$$('.coach').forEach(e=>e.classList.remove('coach'))}};
/* обучение в первый день: подсветка того, куда нажать */
const TUT=[
  {t:'Нажмите «Следующий!» — пригласите первого посетителя.',el:()=>$('#b-next')},
  {t:'Включите «Сверку»: в этом режиме данные в документах сравниваются между собой.',el:()=>$('#b-insp')},
  {t:'Нажмите ФИО в заявлении.',el:()=>fieldEl(0,'fio')},
  {t:'Теперь ФИО в паспорте: листните документы влево или нажмите вкладку «Паспорт».',el:()=>fieldEl(1,'fio')},
  {t:'Нашли расхождение — перетащите печать «Отказано» на графу «Отметка МФЦ» в заявлении. Всё сходится — «Принято».',el:()=>$('#stamps')},
  {t:'Смахните документы вверх, в лоток. Или нажмите «Вернуть».',el:()=>$('#b-ret')},
  {t:'Дальше — сами. Сроки сверяйте с сегодняшней датой в шапке, пункты — с регламентом.',el:()=>$('#b-book'),end:true}
];
function fieldEl(i,kind){const v=W&&W.v;if(!v||!v.docEls||!v.docEls[i])return null;return[...v.docEls[i].querySelectorAll('[data-fid]')].find(e=>v.fields[e.dataset.fid]&&v.fields[e.dataset.fid].kinds.includes(kind))||null}
function tut(step){
  if(!W||W.tut==null||W.tut<0||step<W.tut)return;W.tut=step;$$('.coach').forEach(e=>e.classList.remove('coach'));
  const s=TUT[step];if(!s){W.tut=-1;hint(null);return}
  const el=s.el();if(el)el.classList.add('coach');hint(s.t);$('#hint').classList.add('top');
  if(s.end){store.set('tutDone',true);setTimeout(()=>{if(W&&W.tut===step){$$('.coach').forEach(e=>e.classList.remove('coach'));hint(null);W.tut=-1}},6000)}
}

/* --- реплики --- */
let sayT=0,sayToken=0;
function bubble(text){const b=$('#bubble');if(!text){b.classList.add('hidden');$('#cit').classList.remove('talking');return}b.classList.remove('hidden')}
function say(text,expr,v){
  v=v||W.v;if(!v)return Promise.resolve();
  if(expr)setFace(v,expr);
  const my=++sayToken;bubble(true);const el=$('#bubble-t');el.textContent='';
  const cit=$('#cit');cit.classList.add('talking');
  return new Promise(res=>{let i=0;clearInterval(sayT);sayT=setInterval(()=>{if(my!==sayToken){clearInterval(sayT);res();return}i+=1;el.textContent=text.slice(0,i);if(i%3===0)SND.play('tick');if(i>=text.length){clearInterval(sayT);cit.classList.remove('talking');res()}},22)});
}
function setFace(v,expr){$('#cit').innerHTML=faceSVG(v.face,expr);}

/* --- вызов следующего --- */
$('#b-next').onclick=()=>callNext();
async function callNext(){
  if(!W||W.busy||W.ended)return;W.busy=true;showNext(false);stampsEnabled(false);
  if(!W.lunchDone&&W.time>=780){await lunch()}
  if(W.ended){W.busy=false;return}
  S.ticket++;SND.play('ding');led(`А-${pad3(S.ticket)} → ОКНО 7`);announce(S.ticket);
  const sp=W.specials[W.idx];W.idx++;
  if(sp&&sp.call)await phoneCall(sp.call);
  const v=sp?sp.make():genVisitor();
  if(sp){sp.done=true;if(sp.call)v.called=true}
  W.v=v;W.sel=[];
  await enter(v);
  W.busy=false;
}
function callLunch(){if(W.busy)return;W.busy=true;showNext(false);lunch().then(()=>{W.busy=false;showNext(true)})}
async function lunch(){
  W.lunchDone=true;AMB.quiet(true);$('#blinds-t').innerHTML='Перерыв<br>13:00–14:00';$('#blinds').classList.add('down');led('ПЕРЕРЫВ 13-14');SND.play('rustle');
  await sleep(2400);W.time=Math.max(W.time,840);hud();AMB.quiet(false);$('#blinds').classList.remove('down');led(`А-${pad3(S.ticket)} → ОКНО 7`);await sleep(600);
}
function mountDocs(v,keep){
  const docs=renderDocs(v);v.docEls=[];
  const car=$('#car'),idx=keep?activeDocIdx():0;car.innerHTML='';
  $('#tabs').innerHTML=docs.map((d,i)=>`<button class="tab${i===idx?' on':''}" data-i="${i}">${d.label}</button>`).join('');
  return docs.map((d,i)=>{const w=document.createElement('div');w.className='docwrap'+(keep?' still':'');w.dataset.k=d.k;w.innerHTML=d.html;
    if(G.event==='dark'){const sh=document.createElement('div');sh.className='shade '+(chance(.5)?'top':'bot');w.querySelector('.doc').appendChild(sh)}
    v.docEls.push(w);return w});
}
function activeDocIdx(){const t=$$('#tabs .tab');const i=t.findIndex(x=>x.classList.contains('on'));return i<0?0:i}
async function enter(v){
  const cit=$('#cit');setFace(v,'neutral');cit.className='citizen out-r';void cit.offsetWidth;cit.className='citizen';
  await sleep(450);
  const sp=say(v.lines.intro,'neutral',v);
  if(v.role==='finale'){await sp;await sleep(600);
    const st=S.arcs.dubov;if(st.helped){await giftModal()}else{await sleep(900);await leave(v,'sad');W.notes.push('Иван Петрович Дубов больше не придёт.')}
    if(st.helped){await say('Спасибо вам. Дай вам бог.','happy',v);await leave(v,null)}showNext(true);return}
  setEmpty(false);
  const car=$('#car');car.scrollLeft=0;
  for(const w of mountDocs(v)){car.appendChild(w);SND.play('rustle');await sleep(160)}
  stampsEnabled(true);
  await sp;
  if(v.bribe&&v.bribe.upfront)setTimeout(()=>{if(W.v===v&&!v.done)offerBribe(v)},700);
  tut(1);
  if(W.hintStep>=0&&W.hintStep<3){hint(['Листайте документы влево-вправо. Включите «Сверку» и нажмите на ФИО в заявлении, потом на ФИО в паспорте.','Сравнивайте не только ФИО: дату «Действителен до» сверяйте с сегодняшней датой (она в шапке и в регламенте). Пустая графа подписи — тоже нарушение.','Решили? Перетащите печать «Принято» или «Отказано» на графу «Отметка МФЦ» в заявлении.'][W.hintStep]);W.hintStep++}
  else if(W.hintStep>=3)hint(null);
}
function rerenderDocs(v){const idx=activeDocIdx();const car=$('#car');car.innerHTML='';mountDocs(v,true).forEach(w=>car.appendChild(w));const w=car.children[idx];if(w)car.scrollLeft=w.offsetLeft-(car.clientWidth-w.clientWidth)/2;W.sel=[]}
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('.tab');if(!b)return;const w=$('#car').children[+b.dataset.i];if(w)scrollToDoc(w)});
function scrollToDoc(w){const car=$('#car');car.scrollTo({left:w.offsetLeft-(car.clientWidth-w.clientWidth)/2,behavior:'smooth'})}
$('#car').addEventListener('scroll',()=>{const car=$('#car'),c=car.scrollLeft+car.clientWidth/2;let best=0,bd=1e9;[...car.children].forEach((w,i)=>{const d=Math.abs(w.offsetLeft+w.clientWidth/2-c);if(d<bd){bd=d;best=i}});$$('#tabs .tab').forEach((t,i)=>t.classList.toggle('on',i===best))},{passive:true});
/* свет: тёмная половина листа */
$('#car').addEventListener('click',e=>{const sh=e.target.closest('.shade');if(!sh)return;e.stopPropagation();
  /* в сверке касание тёмной части и двигает лист к свету, и сразу выбирает поле под пальцем */
  const under=W&&W.insp?document.elementsFromPoint(e.clientX,e.clientY).find(n=>!n.closest('.shade')&&n.closest('[data-fid]')):null;
  sh.classList.toggle('top');sh.classList.toggle('bot');SND.play('rustle');
  if(under)inspPick(e,under)});
async function leave(v,expr){
  const line=expr==='happy'?pick(v.lines.ok.length?v.lines.ok:['Спасибо.']):(expr==='angry'||expr==='sad')?pick(v.lines.no.length?v.lines.no:['Ну и ладно.']):null;
  if(line)await say(sx(line,v.sex),expr,v);
  await sleep(300);
  if(v.docEls&&!v.returned){v.docEls.forEach((w,i)=>{w.style.animationDelay=i*60+'ms';w.classList.add('leave')});await sleep(400)}
  $('#env').hidden=true;hideAsk();
  $('#cit').className='citizen out-l';bubble(null);
  await sleep(600);
  $('#car').innerHTML='';$('#tabs').innerHTML='';setEmpty(true);
  W.v=null;W.sel=[];
}
