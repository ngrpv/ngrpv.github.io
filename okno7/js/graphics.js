'use strict';
/* =========================================================
   ГРАФИКА: подписи, печати, лица, QR, гильош
   ========================================================= */
function catmull(p){const f=v=>v[0].toFixed(1)+' '+v[1].toFixed(1);let d='M'+f(p[0]);for(let i=0;i<p.length-1;i++){const p0=p[i-1]||p[i],p1=p[i],p2=p[i+1],p3=p[i+2]||p2;const c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];d+=' C'+f(c1)+' '+f(c2)+' '+f(p2)}return d}
const SIGC={};
function sigOf(seed){if(Array.isArray(seed))return seed;if(SIGC[seed])return SIGC[seed];const r=mulberry32(seed*7919+13),R=(a,b)=>a+r()*(b-a);const pts=[];let x=R(8,16);const base=R(54,62);
  pts.push([x,base+R(4,10)]);pts.push([x+R(10,18),base-R(32,44)]);pts.push([x+R(2,8),base+R(8,14)]);pts.push([x+R(20,30),base-R(14,24)]);x+=R(28,36);
  const n=Math.floor(R(4,8));for(let i=0;i<n;i++){const tall=r()<.25,desc=r()<.15;pts.push([x+R(3,6),base-(tall?R(26,38):R(8,16))]);pts.push([x+R(7,12),base+(desc?R(16,24):R(0,5))]);x+=R(9,15)}
  pts.push([x+R(10,22),base-R(4,14)]);pts.push([x+R(22,36),base+R(4,10)]);pts.push([R(40,80),base+R(16,24)]);
  const out=[catmull(pts)];if(r()<.5){const y=base-R(10,20);out.push(`M${(R(12,30)).toFixed(1)} ${y.toFixed(1)} q${R(10,20).toFixed(1)} ${R(-6,2).toFixed(1)} ${R(26,40).toFixed(1)} ${R(-3,3).toFixed(1)}`)}
  return SIGC[seed]=out}
function sigSVG(seed,color,anim,delay){const ds=sigOf(seed);return `<svg class="sig${anim?' anim':''}" viewBox="0 0 240 100" preserveAspectRatio="xMidYMid meet" style="color:${color||'#2443a6'}${delay?';--d:'+delay+'s':''}">${ds.map((d,i)=>`<path d="${d}" pathLength="1" style="--i:${i}"/>`).join('')}</svg>`}

let SID=0;
function roundStamp(ring,lines,color,cls,nostar,micro){const id='cp'+(++SID);const star='M100 56 l5.9 12 13.2 1.9 -9.6 9.3 2.3 13.2 -11.8 -6.2 -11.8 6.2 2.3 -13.2 -9.6 -9.3 13.2 -1.9z';
  return `<svg class="stamp ${cls||''}" viewBox="0 0 200 200" style="color:${color}"><g filter="url(#ink)"><circle cx="100" cy="100" r="93" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="100" cy="100" r="61" fill="none" stroke="currentColor" stroke-width="2.5"/><path id="${id}" d="M100,100 m-73,0 a73,73 0 1,1 146,0 a73,73 0 1,1 -146,0" fill="none"/><text fill="currentColor" font-weight="700" font-size="16.5" letter-spacing="1"><textPath href="#${id}" textLength="452" lengthAdjust="spacingAndGlyphs">${ring}</textPath></text>${nostar?"":`<path d="${star}" fill="currentColor"/>`}${lines.map((l,i)=>`<text x="100" y="${118+i*17}" text-anchor="middle" fill="currentColor" font-weight="700" font-size="${i?12:15}">${l}</text>`).join('')}</g>${micro?`<path id="${id}m" d="M100,100 m-87,0 a87,87 0 1,1 174,0 a87,87 0 1,1 -174,0" fill="none"/><text class="micro" fill="currentColor"><textPath href="#${id}m" textLength="543" lengthAdjust="spacing">${(micro+" · ").repeat(22)}</textPath></text>`:""}</svg>`}
function triStamp(color){return `<svg class="stamp" viewBox="0 0 200 180" style="color:${color}"><g filter="url(#ink)" fill="currentColor"><polygon points="100,8 192,172 8,172" fill="none" stroke="currentColor" stroke-width="5"/><polygon points="100,32 170,158 30,158" fill="none" stroke="currentColor" stroke-width="1.6"/><text x="100" y="104" text-anchor="middle" font-weight="700" font-size="17">ДЛЯ</text><text x="100" y="126" text-anchor="middle" font-weight="700" font-size="19">СПРАВОК</text><text x="100" y="148" text-anchor="middle" font-size="11.5">ПОЛИКЛИНИКА №3</text></g></svg>`}
function dStamp(word,color,date,cls){return `<svg class="${cls||''}" viewBox="0 0 280 100" style="color:${color}"><g filter="url(#inkH)"><rect x="5" y="5" width="270" height="90" rx="9" fill="none" stroke="currentColor" stroke-width="6"/><rect x="14" y="14" width="252" height="72" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><text x="140" y="60" text-anchor="middle" font-family="PT Sans Narrow,Arial Narrow,sans-serif" font-weight="700" font-size="46" letter-spacing="4" fill="currentColor">${word}</text><text x="140" y="79" text-anchor="middle" font-family="PT Sans Narrow,Arial Narrow,sans-serif" font-weight="700" font-size="11.5" letter-spacing="1.5" fill="currentColor">${date||'МФЦ «МОИ СПРАВКИ» · ОКНО №7'}</text></g></svg>`}
const MFC_STAMP=c=>roundStamp('МФЦ «МОИ СПРАВКИ» ✶ Г. ВЕРХНЕБЕРЁЗОВСК ✶ ДЛЯ ДОКУМЕНТОВ ✶',['ОКНО №7','ОГРН 1026600000007'],c||'#4b3fa3');
const CLINIC_STAMP=(c,nostar,micro)=>roundStamp('ГБУЗ «ГОРОДСКАЯ ПОЛИКЛИНИКА №3» ✶ ВЕРХНЕБЕРЁЗОВСК ✶',['ДЛЯ СПРАВОК','ОГРН 1027700000003'],c||"#3d3aa0","",nostar,micro);
function qrSVG(seed){const r=mulberry32(seed|0),n=25;let d='';const inF=(x,y)=>(x<8&&y<8)||(x>16&&y<8)||(x<8&&y>16);for(let y=0;y<n;y++)for(let x=0;x<n;x++){if(inF(x,y))continue;if(r()<.48)d+=`M${x} ${y}h1v1h-1z`}let f='';[[0,0],[18,0],[0,18]].forEach(([x,y])=>{f+=`M${x} ${y}h7v7h-7z M${x+1} ${y+1}v5h5v-5z M${x+2} ${y+2}h3v3h-3z`});return `<svg viewBox="-1 -1 27 27" shape-rendering="crispEdges"><rect x="-1" y="-1" width="27" height="27" fill="#fff"/><path d="${d}" fill="#111"/><path d="${f}" fill="#111" fill-rule="evenodd"/></svg>`}
function penSVG(){const r=Math.random;return `<svg class="pen" viewBox="0 0 100 100" preserveAspectRatio="none"><path pathLength="1" vector-effect="non-scaling-stroke" d="M ${6+r()*4} ${46+r()*8} C ${2} ${8+r()*6}, ${96} ${2+r()*8}, ${98} ${46+r()*8} S ${12} ${100-r()*4}, ${3+r()*5} ${44+r()*6} S ${30} ${4+r()*6} ${54} ${7+r()*6}"/></svg>`}
const CHECK='<svg viewBox="0 0 24 24"><path d="M3 13 Q7 16 9 21 Q13 9 23 2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* фоновые текстуры */
(function textures(){
  const noise=`url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35  0 0 0 0 .3  0 0 0 0 .2  0 0 0 .09 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>").replace(/%2523/g,'%23')}")`;
  const speck=`url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.6' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .2  0 0 0 0 .22  0 0 0 0 .22  0 0 0 .16 0'/></filter><rect width='180' height='180' filter='url(%23n)'/></svg>").replace(/%2523/g,'%23')}")`;
  let p='';for(let k=0;k<16;k++){let d='';for(let x=0;x<=200;x+=4){const y=50+Math.sin(x/200*Math.PI*4+k*.42)*16*Math.cos(k*.35)+(k-8)*1.6;d+=(x?'L':'M')+x+' '+y.toFixed(1)}p+=`<path d='${d}' fill='none' stroke='%23c98f98' stroke-width='.6' opacity='.55'/>`}
  const guil=`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100'>${p}</svg>`).replace(/%2523/g,'%23')}")`;
  const s=document.documentElement.style;s.setProperty('--noise',noise);s.setProperty('--speckle',speck);s.setProperty('--guil-pink',guil);
})();

/* ---------- лица ---------- */
const SKIN=['#f3d2b8','#ebc19f','#e0aa84','#d39570','#f6dccb'];
const HAIR_Y=['#2a2421','#4a3424','#7a5233','#b88a55','#2a2421'];
const HAIR_O=['#8d8a86','#cfcac2','#a9a49c'];
// Контуры длинных волн; отдельные слои сохраняют лицо и бейдж читаемыми.
const HAIR_WAVES={
  "back": "M48 82 C40 56 50 27 77 24 C91 11 120 18 132 28 C151 42 157 63 152 89 C151 110 146 124 156 142 C174 160 164 179 172 191 Q162 190 151 183 C165 208 143 225 125 224 Q136 211 131 199 C118 205 88 209 74 199 Q65 223 47 220 C57 207 46 197 40 184 Q29 165 41 147 C54 127 42 106 48 82Z",
  "sides": [
    "M57 78 C48 101 60 121 48 143 C37 163 47 179 42 192 Q59 184 64 168 C68 151 60 133 66 115 L68 76Z",
    "M137 65 C157 82 136 105 149 127 C163 149 147 165 157 185 C168 208 153 224 138 223 Q149 208 142 195 C130 178 136 165 130 151 C120 130 133 110 133 87Z"
  ],
  "front": "M48 95 C43 73 43 51 55 35 C64 20 76 20 85 24 C96 13 120 19 135 31 C153 48 157 70 149 96 L141 109 C142 88 133 69 116 61 Q93 55 85 40 C83 57 71 70 59 78 L57 104Z",
  "shine": "M52 72 Q56 39 77 32 M94 29 C126 29 147 54 146 77 M58 118 Q65 143 54 163 M142 130 Q150 146 142 164 M146 184 Q159 208 147 215"
};
function faceSVG(f,expr,cls){
  expr=expr||'neutral';
  const O='#2b2420',cx=100,cy=98,rx=50+f.w,ry=60+f.h,top=cy-ry,ey=cy-4,my=ey+40,mw=f.mw,hc=f.hc,sd=shade(f.skin,-.13);
  const st=`stroke="${O}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const S=[],cover=['platok','ushanka','beanie'].includes(f.hat);
  /* задний план: волосы, платок */
  if(f.hat==='platok')S.push(`<path d="M${cx-rx-14} ${cy+34} C${cx-rx-22} ${top-34} ${cx+rx+22} ${top-34} ${cx+rx+14} ${cy+34} Q${cx+rx} ${cy+ry+6} ${cx} ${cy+ry+18} Q${cx-rx} ${cy+ry+6} ${cx-rx-14} ${cy+34}Z" fill="${f.hatc}" ${st}/>`);
  else if(!cover){
    if(f.hair==='waves')S.push(`<path d="${HAIR_WAVES.back}" fill="${hc}" ${st}/>`);
    if(f.hair==='long')S.push(`<path d="M${cx-rx-8} ${cy} C${cx-rx-12} ${top-20} ${cx+rx+12} ${top-20} ${cx+rx+8} ${cy} L${cx+rx+12} ${cy+76} Q${cx} ${cy+92} ${cx-rx-12} ${cy+76}Z" fill="${hc}" ${st}/>`);
    if(f.hair==='bun')S.push(`<circle cx="${cx+8}" cy="${top-8}" r="20" fill="${hc}" ${st}/>`);
    if(f.hair==='perm')for(let a=160;a<=380;a+=15){const r=a*Math.PI/180;S.push(`<circle cx="${(cx+(rx+5)*Math.cos(r)).toFixed(1)}" cy="${(cy-4+(ry+5)*Math.sin(r)).toFixed(1)}" r="14" fill="${hc}" ${st}/>`)}
  }
  /* шея, тело, одежда */
  S.push(`<path d="M${cx-17} ${cy+ry-26} L${cx-17} ${cy+ry+16} L${cx+17} ${cy+ry+16} L${cx+17} ${cy+ry-26}" fill="${sd}" ${st}/>`);
  const by=cy+ry+8,bw=76+f.w,cc=f.cc;
  S.push(`<path d="M${cx-bw-26} 236 C${cx-bw-20} ${by+16} ${cx-46} ${by} ${cx} ${by} C${cx+46} ${by} ${cx+bw+20} ${by+16} ${cx+bw+26} 236Z" fill="${cc}" ${st}/>`);
  const dk=shade(cc,-.25);
  switch(f.clo){
    case'tee':S.push(`<path d="M${cx-20} ${by} Q${cx} ${by+18} ${cx+20} ${by}" fill="none" stroke="#d0c8bf" stroke-width="3"/>`);break;
    case'suit':S.push(`<path d="M${cx-18} ${by-1} L${cx} ${by+42} L${cx+18} ${by-1}Z" fill="#f3f1ea" ${st}/>`);if(f.tie)S.push(`<path d="M${cx-6} ${by+5} L${cx+6} ${by+5} L${cx+9} ${by+48} L${cx} ${by+60} L${cx-9} ${by+48}Z" fill="${f.tie}" ${st}/>`);S.push(`<path d="M${cx-18} ${by} L${cx-34} ${by+24} L${cx-8} ${by+66} M${cx+18} ${by} L${cx+34} ${by+24} L${cx+8} ${by+66}" fill="none" ${st}/>`);break;
    case'cardigan':S.push(`<path d="M${cx-20} ${by-1} L${cx} ${by+46} L${cx+20} ${by-1}Z" fill="${f.blouse||'#efe6d6'}" ${st}/><circle cx="${cx}" cy="${by+54}" r="3.2" fill="${O}"/><circle cx="${cx}" cy="${by+68}" r="3.2" fill="${O}"/>`);break;
    case'hoodie':S.push(`<path d="M${cx-46} ${by+2} Q${cx} ${by+34} ${cx+46} ${by+2}" fill="none" stroke="${dk}" stroke-width="11" stroke-linecap="round"/><path d="M${cx-10} ${by+16} L${cx-13} ${by+48} M${cx+10} ${by+16} L${cx+13} ${by+48}" ${st} fill="none" stroke-width="2.4"/>`);if(f.print)S.push(`<text x="${cx}" y="${by+56}" text-anchor="middle" font-family="PT Sans Narrow,sans-serif" font-weight="700" font-size="11" fill="#fff" opacity=".85">${f.print}</text>`);break;
    case'puffer':case'courier':S.push(`<path d="M${cx-bw} ${by+32} Q${cx} ${by+44} ${cx+bw} ${by+32} M${cx-bw-10} ${by+58} Q${cx} ${by+70} ${cx+bw+10} ${by+58}" fill="none" stroke="${dk}" stroke-width="2.5"/><path d="M${cx-27} ${by-16} L${cx-27} ${by+8} Q${cx} ${by+16} ${cx+27} ${by+8} L${cx+27} ${by-16} Q${cx} ${by-8} ${cx-27} ${by-16}Z" fill="${cc}" ${st}/><path d="M${cx} ${by+12} L${cx} 232" stroke="${dk}" stroke-width="2.5"/>`);if(f.clo==='courier')S.push(`<path d="M${cx-56} ${by+8} L${cx+44} 234" stroke="#222" stroke-width="10"/><text x="${cx+42}" y="${by+50}" font-family="PT Sans Narrow,sans-serif" font-weight="700" font-size="10" fill="#222" transform="rotate(-8 ${cx+42} ${by+50})">ДОСТАВКА</text>`);break;
    case'sport':S.push(`<path d="M${cx-12} ${by-2} L${cx} ${by+12} L${cx+12} ${by-2}" fill="none" ${st}/><path d="M${cx} ${by+12} L${cx} 232" stroke="#ddd" stroke-width="2"/><path d="M${cx-50} ${by+8} L${cx-84} 234 M${cx-59} ${by+11} L${cx-93} 234 M${cx-68} ${by+15} L${cx-102} 234 M${cx+50} ${by+8} L${cx+84} 234 M${cx+59} ${by+11} L${cx+93} 234 M${cx+68} ${by+15} L${cx+102} 234" stroke="#f4f4f4" stroke-width="3.5"/>`);break;
    case'shirt':S.push(`<path d="M${cx-20} ${by-4} L${cx-4} ${by+16} L${cx-26} ${by+14}Z M${cx+20} ${by-4} L${cx+4} ${by+16} L${cx+26} ${by+14}Z" fill="${shade(cc,.35)}" ${st}/><circle cx="${cx}" cy="${by+30}" r="2.4" fill="${O}"/><circle cx="${cx}" cy="${by+48}" r="2.4" fill="${O}"/>`);break;
    case'fur':for(let i=-4;i<=4;i++)S.push(`<circle cx="${cx+i*13}" cy="${by+2+Math.abs(i)*3}" r="12" fill="${f.fur}" ${st} stroke-width="2"/>`);break;
  }
  if(!cover&&f.hair==='waves')S.push(`<g class="hair-waves" fill="${hc}" ${st}>${HAIR_WAVES.sides.map(d=>`<path d="${d}"/>`).join('')}</g>`);
  /* уши и голова */
  if(f.hat!=='platok'){S.push(`<ellipse cx="${cx-rx+1}" cy="${cy+4}" rx="9" ry="13" fill="${f.skin}" ${st}/><ellipse cx="${cx+rx-1}" cy="${cy+4}" rx="9" ry="13" fill="${f.skin}" ${st}/>`);if(f.ear==='stud')S.push(`<circle cx="${cx-rx+1}" cy="${cy+19}" r="1.9" fill="#eeeae4" stroke="#8e8781" stroke-width=".9"/><circle cx="${cx+rx-1}" cy="${cy+19}" r="1.9" fill="#eeeae4" stroke="#8e8781" stroke-width=".9"/>`);else if(f.ear)S.push(`<circle cx="${cx-rx+1}" cy="${cy+19}" r="3.4" fill="#e3b341" stroke="${O}" stroke-width="1.5"/><circle cx="${cx+rx-1}" cy="${cy+19}" r="3.4" fill="#e3b341" stroke="${O}" stroke-width="1.5"/>`)}
  S.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f.skin}" ${st}/>`);
  if(f.age>52)S.push(`<path d="M${cx-18} ${top+ry*.36} q18 -5 36 0 M${cx-14} ${top+ry*.36+8} q14 -4 28 0" fill="none" stroke="${sd}" stroke-width="2"/><path d="M${cx-16} ${ey+18} q-6 10 -2 20 M${cx+16} ${ey+18} q6 10 2 20" fill="none" stroke="${sd}" stroke-width="2"/>`);
  if(f.blush)S.push(`<circle cx="${cx-32}" cy="${ey+22}" r="9" fill="#ff7f7f" opacity=".3"/><circle cx="${cx+32}" cy="${ey+22}" r="9" fill="#ff7f7f" opacity=".3"/>`);
  if(f.nose==='red')S.push(`<circle cx="${cx}" cy="${ey+20}" r="9" fill="#e07070" opacity=".55"/>`);
  if(f.mole)S.push(`<circle cx="${cx+f.mole[0]}" cy="${cy+f.mole[1]}" r="2.6" fill="#5a3a2a"/>`);
  /* глаза, брови */
  if(f.gl!=='sun'){S.push(`<g class="eyes"><ellipse cx="${cx-21}" cy="${ey}" rx="${(3.6*f.eye).toFixed(1)}" ry="${(4.8*f.eye).toFixed(1)}" fill="${O}"/><ellipse cx="${cx+21}" cy="${ey}" rx="${(3.6*f.eye).toFixed(1)}" ry="${(4.8*f.eye).toFixed(1)}" fill="${O}"/></g>`);if(f.age>55)S.push(`<path d="M${cx-29} ${ey+9} Q${cx-21} ${ey+14} ${cx-13} ${ey+9} M${cx+13} ${ey+9} Q${cx+21} ${ey+14} ${cx+29} ${ey+9}" fill="none" stroke="${sd}" stroke-width="2"/>`)}
  const bo={neutral:[0,0],happy:[-3,-3],angry:[6,-3],sad:[-5,3],sly:[3,-5]}[expr]||[0,0],b0=ey-15,bc=(f.hair==='bald'||f.age>60)?'#8d8a86':hc;
  const brow=f.brow==='arched'?`M${cx-32} ${b0+bo[1]} Q${cx-21} ${b0-4+(bo[0]+bo[1])/2} ${cx-11} ${b0+bo[0]} M${cx+11} ${b0+(expr==='sly'?-4:bo[0])} Q${cx+21} ${b0-4+(bo[0]+bo[1])/2} ${cx+32} ${b0+bo[1]}`:`M${cx-33} ${b0+bo[1]} L${cx-11} ${b0+bo[0]} M${cx+11} ${b0+(expr==='sly'?-4:bo[0])} L${cx+33} ${b0+bo[1]}`;
  S.push(`<path d="${brow}" stroke="${bc}" stroke-width="${f.bw}" stroke-linecap="round" fill="none"/>`);
  /* нос */
  const nz={line:`<path d="M${cx+2} ${ey+4} Q${cx-8} ${ey+21} ${cx+3} ${ey+25}" fill="none" ${st} stroke-width="2.5"/>`,round:`<ellipse cx="${cx}" cy="${ey+20}" rx="8" ry="6.5" fill="${sd}" ${st} stroke-width="2.2"/>`,big:`<path d="M${cx-4} ${ey+2} Q${cx-13} ${ey+22} ${cx-11} ${ey+27} Q${cx} ${ey+33} ${cx+11} ${ey+27} Q${cx+13} ${ey+22} ${cx+4} ${ey+2}" fill="${f.skin}" ${st} stroke-width="2.5"/>`,hook:`<path d="M${cx-1} ${ey} Q${cx+13} ${ey+20} ${cx+4} ${ey+27} L${cx-5} ${ey+25}" fill="none" ${st} stroke-width="2.5"/>`};
  S.push(nz[f.nose]||nz.line);
  /* борода */
  if(f.beard==='full')S.push(`<path d="M${cx-rx+5} ${cy+4} Q${cx-rx+6} ${cy+ry+6} ${cx} ${cy+ry+14} Q${cx+rx-6} ${cy+ry+6} ${cx+rx-5} ${cy+4} Q${cx+rx-14} ${my+2} ${cx+mw+6} ${my+8} Q${cx} ${my+16} ${cx-mw-6} ${my+8} Q${cx-rx+14} ${my+2} ${cx-rx+5} ${cy+4}Z" fill="${hc}" ${st} stroke-width="2.5"/>`);
  if(f.beard==='goatee')S.push(`<path d="M${cx-12} ${my+8} Q${cx} ${my+30} ${cx+12} ${my+8} Q${cx} ${my+14} ${cx-12} ${my+8}Z" fill="${hc}" ${st} stroke-width="2"/>`);
  if(f.beard==='stubble'&&f.stub)S.push(`<g fill="${shade(f.skin,-.45)}" opacity=".55">${f.stub.map(([x,y])=>`<circle cx="${cx+x}" cy="${cy+y}" r="1.1"/>`).join('')}</g>`);
  /* рот */
  const lc=f.lip?(f.lipColor||'#b5333f'):O,lw=f.lip?(f.lipWidth||4):3;
  const mouths={neutral:`<path d="M${cx-mw} ${my} Q${cx} ${my+(f.mouthCurve==null?2:f.mouthCurve)} ${cx+mw} ${my}" fill="none" stroke="${lc}" stroke-width="${lw}" stroke-linecap="round"/>`,
    happy:`<path d="M${cx-mw-3} ${my-3} Q${cx} ${my+17} ${cx+mw+3} ${my-3} Q${cx} ${my+3} ${cx-mw-3} ${my-3}Z" fill="#fff" stroke="${lc}" stroke-width="${lw-.5}" stroke-linejoin="round"/>`,
    angry:`<path d="M${cx-mw} ${my+5} Q${cx} ${my-7} ${cx+mw} ${my+5}" fill="none" stroke="${lc}" stroke-width="${lw}" stroke-linecap="round"/>`,
    sad:`<path d="M${cx-mw+2} ${my+4} Q${cx} ${my-3} ${cx+mw-2} ${my+4}" fill="none" stroke="${lc}" stroke-width="${lw}" stroke-linecap="round"/>`,
    sly:`<path d="M${cx-mw} ${my+2} Q${cx+2} ${my+5} ${cx+mw+3} ${my-6}" fill="none" stroke="${lc}" stroke-width="${lw}" stroke-linecap="round"/>`};
  S.push(`<g class="m-shut">${mouths[expr]||mouths.neutral}</g><g class="m-open"><ellipse cx="${cx}" cy="${my+3}" rx="${mw*.55}" ry="6" fill="#5b1f22" stroke="${lc}" stroke-width="2.5"/></g>`);
  /* усы */
  if(f.must==='walrus')S.push(`<path d="M${cx-24} ${my-2} Q${cx-14} ${my-17} ${cx} ${my-12} Q${cx+14} ${my-17} ${cx+24} ${my-2} Q${cx+11} ${my-6} ${cx} ${my-4} Q${cx-11} ${my-6} ${cx-24} ${my-2}Z" fill="${f.age>60?'#a9a49c':hc}" ${st} stroke-width="2.2"/>`);
  if(f.must==='thin')S.push(`<path d="M${cx-15} ${my-7} Q${cx} ${my-12} ${cx+15} ${my-7}" fill="none" stroke="${hc}" stroke-width="3.5" stroke-linecap="round"/>`);
  /* передние волосы */
  const cap=(fy,sy,fill,op)=>`<path d="M${cx-rx-3} ${sy} C${cx-rx-6} ${top-30-(f.hairLift||0)} ${cx+rx+6} ${top-30-(f.hairLift||0)} ${cx+rx+3} ${sy} Q${cx+rx*.55} ${fy-4} ${cx+rx*.1} ${fy} Q${cx-rx*.45} ${fy+5} ${cx-rx+2} ${sy+6}Z" fill="${fill}" ${op?`opacity="${op}"`:''} ${st}/>`;
  const tufts=`<path d="M${cx-rx} ${cy+6} Q${cx-rx-6} ${cy-20} ${cx-rx+12} ${cy-34} M${cx+rx} ${cy+6} Q${cx+rx+6} ${cy-20} ${cx+rx-12} ${cy-34}" stroke="${hc}" stroke-width="10" fill="none" stroke-linecap="round"/>`;
  if(!cover&&f.hat!=='platok'){
    switch(f.hair){
      case'waves':S.push(`<g class="hair-waves" fill="${hc}" ${st}><path d="${HAIR_WAVES.front}"/></g><path d="${HAIR_WAVES.shine}" fill="none" stroke="${f.hairShine||shade(hc,.35)}" stroke-width="2" stroke-linecap="round"/>`);break;
      case'short':case'long':S.push(cap(top+ry*.42,cy-8,hc));break;
      case'bun':S.push(cap(top+24,cy-8,hc));break;
      case'buzz':S.push(cap(top+20,cy-12,hc,.6));break;
      case'spiky':{let d=`M${cx-rx-3} ${cy-8} C${cx-rx-6} ${top-30} ${cx+rx+6} ${top-30} ${cx+rx+3} ${cy-8}`;for(let x=cx+rx-4,i=0;x>cx-rx;x-=12,i++)d+=` L${x} ${top+(i%2?14:30)}`;S.push(`<path d="${d}Z" fill="${hc}" ${st}/>`);break}
      case'perm':S.push(cap(top+20,cy-14,hc));for(let x=cx-rx+10;x<=cx+rx-10;x+=15)S.push(`<circle cx="${x}" cy="${top+12+((x/15|0)%2)*5}" r="11" fill="${hc}" ${st} stroke-width="2.4"/>`);break;
      case'combover':S.push(tufts+`<path d="M${cx-rx+8} ${top+26} Q${cx} ${top-4} ${cx+rx-10} ${top+16} M${cx-rx+12} ${top+32} Q${cx} ${top+4} ${cx+rx-6} ${top+24} M${cx-rx+14} ${top+38} Q${cx} ${top+12} ${cx+rx-4} ${top+32}" stroke="${hc}" stroke-width="3" fill="none" stroke-linecap="round"/>`);break;
      case'bald':S.push(tufts+`<ellipse cx="${cx-16}" cy="${top+16}" rx="13" ry="5" fill="#fff" opacity=".45" transform="rotate(-18 ${cx-16} ${top+16})"/>`);break;
    }
  }
  /* головные уборы */
  if(f.hat==='kepka')S.push(`<path d="M${cx-rx-4} ${top+38} C${cx-rx-6} ${top-14} ${cx+rx+12} ${top-18} ${cx+rx+8} ${top+34}Z" fill="${f.hatc}" ${st}/><path d="M${cx-rx+6} ${top+36} Q${cx+20} ${top+54} ${cx+rx+26} ${top+30} L${cx+rx+6} ${top+33} Q${cx} ${top+44} ${cx-rx+6} ${top+36}Z" fill="${shade(f.hatc,-.2)}" ${st}/><circle cx="${cx+6}" cy="${top+2}" r="4" fill="${shade(f.hatc,-.2)}" ${st} stroke-width="2"/>`);
  if(f.hat==='platok'){S.push(`<path d="M${cx-rx-5} ${cy+16} C${cx-rx-12} ${top-24} ${cx+rx+12} ${top-24} ${cx+rx+5} ${cy+16} L${cx+rx-6} ${cy+12} C${cx+rx-6} ${top+4} ${cx-rx+6} ${top+4} ${cx-rx+6} ${cy+12}Z" fill="${f.hatc}" ${st}/>`);for(let i=0;i<9;i++){const a=(200+i*17.5)*Math.PI/180;S.push(`<circle cx="${(cx+(rx-2)*Math.cos(a)).toFixed(1)}" cy="${(cy-2+(ry-4)*Math.sin(a)).toFixed(1)}" r="3.2" fill="#fff" opacity=".85"/>`)}S.push(`<path d="M${cx-6} ${cy+ry+6} l-16 18 l14 3Z M${cx+6} ${cy+ry+6} l16 18 l-14 3Z" fill="${f.hatc}" ${st} stroke-width="2.4"/><circle cx="${cx}" cy="${cy+ry+8}" r="7" fill="${f.hatc}" ${st} stroke-width="2.4"/>`)}
  if(f.hat==='ushanka')S.push(`<rect x="${cx-rx-13}" y="${cy-14}" width="24" height="58" rx="11" fill="${f.hatc}" ${st}/><rect x="${cx+rx-11}" y="${cy-14}" width="24" height="58" rx="11" fill="${f.hatc}" ${st}/><path d="M${cx-rx-6} ${top+34} C${cx-rx-8} ${top-32} ${cx+rx+8} ${top-32} ${cx+rx+6} ${top+34}Z" fill="${shade(f.hatc,-.18)}" ${st}/><rect x="${cx-rx-10}" y="${top+16}" width="${2*rx+20}" height="26" rx="13" fill="${f.hatc}" ${st}/>`);
  if(f.hat==='beanie'){S.push(`<circle cx="${cx}" cy="${top-24}" r="12" fill="${shade(f.hatc,.3)}" ${st}/><path d="M${cx-rx-4} ${top+36} C${cx-rx-6} ${top-36} ${cx+rx+6} ${top-36} ${cx+rx+4} ${top+36}Z" fill="${f.hatc}" ${st}/><rect x="${cx-rx-6}" y="${top+20}" width="${2*rx+12}" height="20" rx="6" fill="${shade(f.hatc,-.15)}" ${st}/>`);let rb='';for(let x=cx-rx;x<cx+rx;x+=7)rb+=`M${x} ${top+23} v14 `;S.push(`<path d="${rb}" stroke="${shade(f.hatc,-.35)}" stroke-width="1.5"/>`)}
  if(f.badge)S.push('<g class="staff-badge"><path d="M'+(cx+34)+' '+(by+8)+' v24" stroke="#d9d8d2" stroke-width="3"/><rect x="'+(cx+12)+'" y="'+(by+32)+'" width="44" height="25" rx="3" fill="#f8f5eb" stroke="'+O+'" stroke-width="1.5"/><text x="'+(cx+34)+'" y="'+(by+43)+'" text-anchor="middle" font-family="PT Sans Narrow,sans-serif" font-size="8" font-weight="700" fill="'+O+'">'+esc(f.badge)+'</text><text x="'+(cx+34)+'" y="'+(by+51)+'" text-anchor="middle" font-family="PT Sans Narrow,sans-serif" font-size="6" fill="'+O+'">АДМИНИСТРАТОР</text></g>');
  /* очки */
  if(f.gl==='round')S.push(`<g fill="rgba(255,255,255,.18)" stroke="${O}" stroke-width="2.6"><circle cx="${cx-21}" cy="${ey}" r="13"/><circle cx="${cx+21}" cy="${ey}" r="13"/></g><path d="M${cx-8} ${ey-2} Q${cx} ${ey-7} ${cx+8} ${ey-2} M${cx-34} ${ey-2} L${cx-rx+3} ${ey-6} M${cx+34} ${ey-2} L${cx+rx-3} ${ey-6}" stroke="${O}" stroke-width="2.6" fill="none"/>`);
  if(f.gl==='square')S.push(`<g fill="rgba(255,255,255,.15)" stroke="${O}" stroke-width="2.8"><rect x="${cx-36}" y="${ey-10}" width="29" height="21" rx="4"/><rect x="${cx+7}" y="${ey-10}" width="29" height="21" rx="4"/></g><path d="M${cx-7} ${ey-3} L${cx+7} ${ey-3} M${cx-36} ${ey-4} L${cx-rx+3} ${ey-7} M${cx+36} ${ey-4} L${cx+rx-3} ${ey-7}" stroke="${O}" stroke-width="2.8"/>`);
  if(f.gl==='sun')S.push(`<g stroke="${O}" stroke-width="2.6"><rect x="${cx-38}" y="${ey-10}" width="32" height="20" rx="7" fill="#18181c"/><rect x="${cx+6}" y="${ey-10}" width="32" height="20" rx="7" fill="#18181c"/></g><path d="M${cx-6} ${ey-3} L${cx+6} ${ey-3} M${cx-38} ${ey-4} L${cx-rx+3} ${ey-7} M${cx+38} ${ey-4} L${cx+rx-3} ${ey-7}" stroke="${O}" stroke-width="2.6"/><path d="M${cx-32} ${ey-5} l9 0 M${cx+12} ${ey-5} l9 0" stroke="#fff" stroke-width="2" opacity=".55"/>`);
  return `<svg class="${cls||''}" viewBox="0 0 200 230" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><g class="bob">${S.join('')}</g></svg>`;
}
function baseFace(sex,age){const f={sex,age,skin:pick(SKIN),w:ri(-4,8),h:ri(-4,6),eye:pick([.85,1,1.15]),bw:ri(3,6),nose:pick(['line','round','big','hook']),mw:ri(10,15),hc:age>58?pick(HAIR_O):pick(HAIR_Y),hair:'short',hat:'none',gl:'none',must:'none',beard:'none',clo:'shirt',cc:'#6b7a8f',blush:false,lip:false,ear:false,mole:chance(.18)?[ri(-30,30),ri(-6,30)]:null};f.stub=[];for(let i=0;i<70;i++){const a=rnd()*Math.PI,r=.55+rnd()*.42;f.stub.push([Math.round(Math.cos(a)*(46)*r),Math.round(20+Math.sin(a)*48*r)])}return f}
function mutateFace(f){const g=JSON.parse(JSON.stringify(f));const ops=[()=>{g.hair=g.hair==='bald'?'short':(g.hair==='short'||g.hair==='buzz'?'long':'bald');g.hc=pick(HAIR_Y)},()=>{g.gl=g.gl==='none'?pick(['round','square']):'none'},()=>{g.must=g.must==='none'?'walrus':'none'},()=>{g.beard=g.beard==='none'?'full':'none'},()=>{g.nose=pick(['line','round','big','hook'].filter(n=>n!==g.nose));g.w=g.w>2?-4:8},()=>{g.skin=pick(SKIN.filter(s=>s!==g.skin))}];
  if(f.sex==='f'){ops[2]=()=>{g.hair=g.hair==='long'?'bun':'long';g.hc=pick(HAIR_Y)};ops[3]=()=>{g.lip=!g.lip;g.ear=!g.ear}}
  const idx=[0,1,2,3,4,5].sort(()=>rnd()-.5).slice(0,2);idx.forEach(i=>ops[i]());if(JSON.stringify(g)===JSON.stringify(f))ops[1]();return g}
