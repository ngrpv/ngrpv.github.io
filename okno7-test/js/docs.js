'use strict';
/* =========================================================
   ОТРИСОВКА ДОКУМЕНТОВ
   ========================================================= */
const MRZMAP={А:'A',Б:'B',В:'V',Г:'G',Д:'D',Е:'E',Ё:'2',Ж:'J',З:'Z',И:'I',Й:'Q',К:'K',Л:'L',М:'M',Н:'N',О:'O',П:'P',Р:'R',С:'S',Т:'T',У:'U',Ф:'F',Х:'H',Ц:'C',Ч:'3',Ш:'4',Щ:'W',Ъ:'X',Ы:'Y',Ь:'9',Э:'6',Ю:'7',Я:'8'};
const mz=s=>[...s.toUpperCase()].map(c=>MRZMAP[c]!=null?MRZMAP[c]:(c===' '?'<':c)).join('');
function chk(s){const w=[7,3,1];let t=0;[...s].forEach((c,i)=>{let v=c==='<'?0:/\d/.test(c)?+c:c.charCodeAt(0)-55;t+=v*w[i%3]});return String(t%10)}
function mrz(p){const ymd=d=>String(d.getFullYear()).slice(2)+pad(d.getMonth()+1)+pad(d.getDate());const num=p.pass.replace(/\D/g,'');
  const l1=('PNRUS'+mz(p.fio.s)+'<<'+mz(p.fio.n)+'<'+mz(p.fio.p)).padEnd(44,'<').slice(0,44);
  const a=num.slice(0,3)+num.slice(4);const l2=(a+chk(a)+'RUS'+ymd(p.birth)+chk(ymd(p.birth))+(p.sex==='f'?'F':'M')+'<<<<<<<'+num[3]+ymd(p.issued)+'770001<0').padEnd(44,'<').slice(0,44);
  return esc(l1)+'<br>'+esc(l2)}
const INK={blue:'#2443a6',black:'#1d1c22',green:'#1f7a43'};
function payLogo(m){if(m==='МИР')return '<span class="pl mir">МИР</span>';if(m==='СБП')return '<span class="pl sbp">СБП</span>';if(m==='VISA')return '<span class="pl visa">VISA</span>';return '<span class="pl"><svg viewBox="0 0 24 15"><circle cx="8" cy="7.5" r="7" fill="#eb001b"/><circle cx="16" cy="7.5" r="7" fill="#f79e1b" opacity=".9"/></svg></span>'}
const UV_MARK='<i class="uv-wm"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/><path d="M50 22 l5 11 12 2 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -2z" fill="currentColor"/><path d="M26 66 q24 16 48 0" fill="none" stroke="currentColor" stroke-width="2.5"/><text x="50" y="82" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">РФ</text></svg></i>';
const snilsEra=()=>inPool('R_SNILSNUM')&&S.run.rules.R_SNILS&&S.day>=S.run.rules.R_SNILS;
function renderDocs(v){
  v.fields={};let n=0;
  const F=(kinds,value,html,cls)=>{const id='f'+(n++);v.fields[id]={kinds,value};const label=fieldLabel(kinds)+(typeof value==='string'&&!kinds.some(k=>['sig','photo','stamp','holo','qr','font'].includes(k))?': '+value:'');return `<span class="f ${cls||''}" data-fid="${id}" role="button" tabindex="0" aria-label="${esc(label)}">${html}</span>`};
  const tilt=()=>`--tilt:${(Math.random()*2.2-1.1).toFixed(2)}deg`;
  const out=[];const d=v.docs;
  const a=d.application,ic=INK[a.ink],H=t=>`<span class="hand">${esc(t)}</span>`;
  const boxes=(opts,val)=>opts.map(g=>`<span class="gbox"><i>${val===g?CHECK:''}</i>${g}</span>`).join(' ');
  const fioT=a.caps?`<span class="hand caps">${esc(fioS(a.fio).toUpperCase())}</span>`:H(fioS(a.fio));
  out.push({k:'app',label:'Заявление',html:`<div class="doc d-app" style="${tilt()};--ink-c:${ic}">
    <div class="app-to">Руководителю МФЦ «Мои справки» г. Верхнеберёзовска<br>от ${F(['fio','ink','caps'],fioS(a.fio),fioT)}</div>
    <div class="app-h">Заявление</div>
    <p class="app-row">Прошу предоставить услугу: ${F(['ink','service'],a.service,H(a.service))}</p>
    <p class="app-row">Дата рождения: ${F(['birth','ink'],dd(a.birth),H(dd(a.birth)))}</p>
    <p class="app-row">Паспорт: ${F(['passnum','ink'],a.pass,H(a.pass))}</p>
    ${snilsEra()?`<p class="app-row">СНИЛС: ${F(['snilsnum','ink'],a.snils,H(a.snils))}</p>`:''}
    ${inPool('R_PHONE')?`<p class="app-row">Телефон: ${F(['phone','ink'],a.tel,H(a.tel))}</p>`:''}
    ${inPool('R_EMAIL')?`<p class="app-row">Эл. почта: ${F(['email','ink'],a.mail,H(a.mail))}</p>`:''}
    ${inPool('R_NOTIFY')?`<div class="app-gosu"><span class="lbl">Уведомлять через</span>${F(['notify'],a.notify,boxes(NOTIFY,a.notify))}</div>`:''}
    <div class="app-gosu"><span class="lbl">Учётная запись Госуслуг</span>${F(['gosu'],a.gosu,boxes(['упрощённая','стандартная','подтверждённая'],a.gosu))}</div>
    <div class="app-sign"><span class="lbl">Подпись</span>${F(['sig'],a.sig,a.sig?sigSVG(a.sig,ic):'<span class="sig-empty"></span>','fsig')}<span class="lbl">Дата</span> ${F(['appdate'],dd(a.date),H(dd(a.date)))}</div>
    <div class="stampzone"><span>Отметка МФЦ о приёме</span></div>
  </div>`});
  const p=d.passport;
  out.push({k:'pass',label:'Паспорт',html:`<div class="doc d-pass" style="${tilt()}">
    ${F(['passnum'],p.pass,p.pass,'pp-num')}
    <div class="pp-top">Паспорт гражданина Российской Федерации</div>
    <div class="pp-issued"><span class="lbl">Выдан</span> ГУ МВД России по Верхнеберёзовской обл.<br><span class="lbl">Дата выдачи</span> <b>${dd(p.issued)}</b> · <span class="lbl">Действителен до</span> ${F(['expiry'],dd(p.until),`<b>${dd(p.until)}</b>`)}</div>
    <div class="pp-main">
      <div>${F(['photo'],'photo',faceSVG(v.photoFace,'neutral')+(p.tape?'<i class="tape t1"></i><i class="tape t2"></i>':''),'fphoto')}</div>
      <div class="pp-data">
        ${F(['fio'],fioS(p.fio),`<span class="lbl">Фамилия</span><b>${esc(p.fio.s)}</b><span class="lbl">Имя</span><b>${esc(p.fio.n)}</b><span class="lbl">Отчество</span><b>${esc(p.fio.p)}</b>`,'blk')}
        <div class="row2"><div><span class="lbl">Пол</span><b>${p.sex==='f'?'Жен.':'Муж.'}</b></div><div><span class="lbl">Дата рождения</span>${F(['birth'],dd(p.birth),`<b>${dd(p.birth)}</b>`,'blk')}</div></div>
        <span class="lbl">Место рождения</span><b style="font-size:11px">${esc(p.place)}</b>
        ${inPool('R_REG')?`<span class="lbl">Регистрация</span>${F(['reg'],p.reg,`<b style="font-size:11px">${esc(p.reg)}</b>`,'blk')}`:''}
      </div>
    </div>
    <div class="pp-sig"><span class="lbl">Личная подпись</span>${F(['sig'],p.sig,sigSVG(p.sig,'#2443a6'),'fsig')}</div>
    ${F(['holo'],p.noholo?'нет':'есть',p.noholo?'':'<i class="holo-i"></i>','holo-f')}
    ${inPool('F_UV')&&!p.nouv?UV_MARK:''}
    <div class="mrz">${mrz(p)}</div>
  </div>`});
  if(d.receipt){const r=d.receipt;out.push({k:'rec',label:'Квитанция',html:`<div class="doc d-rec${r.font==='fake'?' ffake':''}" style="${tilt()}">
    ${F(['font'],r.font||'mono','ГОСБАНК','blk rc-bank')}<div class="rc-c">ЧЕК ПО ОПЕРАЦИИ</div><div class="rc-c">${F(['paydate'],dd(r.date),dd(r.date))} ${F(['paytime'],r.time,r.time)} · №${r.op}</div>
    <div class="rc-sep"></div>
    <div class="rc-row"><span>Операция</span><span>Госпошлина</span></div>
    <div class="rc-row"><span>Получатель</span><span>УФК по Верхнеберёз. обл.</span></div>
    <div class="rc-row"><span>Плательщик</span>${F(['fio'],fioS(r.fio),esc(fioS(r.fio).toUpperCase()))}</div>
    <div class="rc-row"><span>Карта</span>${F(['method'],r.method,payLogo(r.method)+' ••'+r.card)}</div>
    ${inPool('R_VPN')?`<div class="rc-row"><span>IP</span>${F(['ip'],r.cc,`${r.ip} (${r.cc})`)}</div>`:''}
    <div class="rc-sep"></div>
    <div class="rc-sum"><span>ИТОГО</span>${F(['sum'],r.sum,rub(r.sum))}</div>
    <div class="rc-qr">${F(['qr'],r.qrSample?'образец':'чистый',qrSVG(r.qr)+(r.qrSample?'<span class="qr-obr">ОБРАЗЕЦ</span>':''),'qrf')}</div><div class="rc-c">СТАТУС: ИСПОЛНЕН</div>
  </div>`})}
  if(d.snils){const s=d.snils;out.push({k:'snils',label:'СНИЛС',html:`<div class="doc d-snils" style="${tilt()}">
    <div class="sn-h">Страховое свидетельство<br>обязательного пенсионного страхования</div>
    <div class="sn-num">${F(['snilsnum'],s.num,s.num)}</div>
    ${F(['fio'],fioS(s.fio),`<span class="lbl">Ф. И. О.</span><b>${esc(s.fio.s)}<br>${esc(s.fio.n)}<br>${esc(s.fio.p)}</b>`,'blk')}
    <div style="margin-top:4px"><span class="lbl">Дата рождения</span> ${F(['birth'],dd(s.birth),`<b>${dd(s.birth)}</b>`)}</div>
    <div><span class="lbl">Место рождения</span> <b>${esc(s.place)}</b></div>
    <div><span class="lbl">Пол</span> <b>${s.sex==='f'?'женский':'мужской'}</b></div>
    <div class="sn-reg">Дата регистрации ${dd(s.reg)}</div>
  </div>`})}
  if(d.zhiv){const z=d.zhiv,f=z.sex==='f';out.push({k:'zhiv',label:'Справка 0-ЖИВ',html:`<div class="doc d-zhiv" style="${tilt()}">
    <div class="zh-top"><div class="zh-corner">Минздрав<br>ГБУЗ «Гор. поликлиника №3»<br>г. Верхнеберёзовск</div><div class="zh-form">Медицинская документация<br>Форма № 0-ЖИВ/у<br>утв. приказом<br>от 01.04.2026 № 404н</div></div>
    <h3>Справка № ${z.no}</h3>
    <p>Дана ${F(['fio'],fioS(z.fio),`<u>${esc(fioS(z.fio))}</u>`)}, ${F(['birth'],dd(z.birth),`<u>${dd(z.birth)}</u>`)} г. р., в том, что ${f?'она':'он'} на момент осмотра действительно ${f?'жива':'жив'}.</p>
    <p>Признаки жизни: дыхание, пульс, недовольство очередью.</p>
    <p>Выдана для предъявления по месту требования.</p>
    <div class="zh-bottom">Дата выдачи: ${F(['issued'],dd(z.issued),`<u>${dd(z.issued)}</u>`)}<br>Врач ${sigSVG(z.dsig,'#2443a6')} ${F(['doctor'],z.doc,esc(z.doc))}
      ${F(['stamp'],z.stamp,z.stamp==='tri'?triStamp('#3d3aa0'):CLINIC_STAMP(STAMP_COL[z.scol||'violet'],z.nostar,inPool('F_MICRO')?z.badmicro||MICRO_OK:null),'zh-stampf')}</div>
  </div>`})}
  if(v.annex)out.push({k:"annex",label:v.annex.label,html:v.annex.html});
  return out;
}
