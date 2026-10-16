'use strict';
/* =========================================================
   УТИЛИТЫ
   ========================================================= */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let rnd=Math.random;
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
const pick=a=>a[Math.floor(rnd()*a.length)];
const chance=p=>rnd()<p;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const pad=n=>String(n).padStart(2,'0');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* хеш из нескольких чисел: для воспроизводимых «смены дня» и посетителей */
const hash=(...a)=>{let h=2166136261;for(const x of a){h^=x|0;h=Math.imul(h,16777619)}return h>>>0};
const REDUCED=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function withSeed(seed,fn){const old=rnd;rnd=mulberry32(seed);try{return fn()}finally{rnd=old}}
function wpick(obj){let t=0;for(const k in obj)t+=obj[k];let x=rnd()*t;for(const k in obj){x-=obj[k];if(x<=0)return k}return Object.keys(obj)[0]}
const nf=n=>Math.abs(Math.round(n)).toLocaleString('ru-RU');
const plural=(n,a,b,c)=>{const m=Math.abs(n)%100,k=m%10;return m>10&&m<20?c:k===1?a:k>=2&&k<=4?b:c};
const money=n=>(n<0?'−':'')+nf(n)+' ₽';
const rub=n=>(Number.isInteger(n)?n.toLocaleString('ru-RU'):n.toFixed(2).replace('.',','))+' ₽';
const sx=(s,sex)=>s.replace(/\{([^|}]*)\|([^}]*)\}/g,(_,m,f)=>sex==='f'?f:m);
function shade(hex,p){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const t=p<0?0:255,a=Math.abs(p);r=Math.round(r+(t-r)*a);g=Math.round(g+(t-g)*a);b=Math.round(b+(t-b)*a);return '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}
const vib=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};

/* даты */
const START=new Date(2026,9,19);
function addDays(d,n){const x=new Date(d.getTime());x.setDate(x.getDate()+n);return x}
function addYears(d,n){const x=new Date(d.getTime());x.setFullYear(x.getFullYear()+n);return x}
const dayDate=d=>addDays(START,d-1);
const dd=d=>pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear();
const dayDiff=(a,b)=>Math.round((Date.UTC(a.getFullYear(),a.getMonth(),a.getDate())-Date.UTC(b.getFullYear(),b.getMonth(),b.getDate()))/864e5);
const WD=['вс','пн','вт','ср','чт','пт','сб'];
const MON=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const longDate=d=>`«${d.getDate()}» ${MON[d.getMonth()]} ${d.getFullYear()} г.`;

/* хранилище: личный документ игрока в db артефакта (data/users/<id>/okno7), localStorage — запасной слой.
   Пишем только при изменении, по одной записи за раз; при отказе db молча остаёмся на localStorage. */
const LS={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const STORE_KEYS=['save','archive','muted','tutDone','ach','diff','daily','interfaceMode'];
const store={mem:{},ref:null,busy:false,again:false,
  get(k){return this.mem[k]!=null?this.mem[k]:null},
  set(k,v){this.mem[k]=v==null?null:JSON.parse(JSON.stringify(v));LS.set('okno7-test.'+k,this.mem[k]);this.flush()},
  del(k){this.mem[k]=null;LS.del('okno7-test.'+k);this.flush()},
  load(){STORE_KEYS.forEach(k=>{const v=LS.get('okno7-test.'+k);if(v!=null)this.mem[k]=v});LS.del('okno7-test.save.v1')},
  body(){const b={v:2,at:Date.now()};STORE_KEYS.forEach(k=>b[k]=this.mem[k]==null?null:this.mem[k]);return b},
  async connect(){
    try{
      const c=typeof window!=='undefined'&&window.claude;if(!c||typeof c.use!=='function')return false;
      const [db,user]=await Promise.all([c.use('db'),c.use('user')]);if(!db||!user)return false;
      const id=await user.id();if(!id)return false;
      const ref=db.doc('data/users/'+id+'/okno7-test'),snap=await ref.get();
      const before=JSON.stringify(STORE_KEYS.map(k=>this.mem[k]));let remote='[]';
      if(snap.exists){const d=snap.data()||{};remote=JSON.stringify(STORE_KEYS.map(k=>d[k]==null?null:d[k]));
        const A={...(d.archive||{})},L=this.mem.archive||{};for(const k in L)A[k]=A[k]?{...A[k],n:Math.max(A[k].n||1,L[k].n||1)}:L[k];this.mem.archive=Object.keys(A).length?A:null;
        const rs=d.save,ls=this.mem.save;this.mem.save=rs?(ls&&(ls.savedAt||0)>(rs.savedAt||0)?ls:rs):(ls&&(ls.savedAt||0)>(d.at||0)?ls:null);
        if(d.muted!=null)this.mem.muted=d.muted;
        STORE_KEYS.forEach(k=>this.mem[k]==null?LS.del('okno7-test.'+k):LS.set('okno7-test.'+k,this.mem[k]));
      }
      this.ref=ref;
      if(JSON.stringify(STORE_KEYS.map(k=>this.mem[k]==null?null:this.mem[k]))!==remote)await this.flush();
      return JSON.stringify(STORE_KEYS.map(k=>this.mem[k]))!==before;
    }catch(e){this.ref=null;return false}},
  async flush(){
    if(!this.ref)return;if(this.busy){this.again=true;return}this.busy=true;
    try{do{this.again=false;await this.ref.set(this.body())}while(this.again)}
    catch(e){if(e&&e.code==='unavailable'&&!this.retried){this.retried=true;this.busy=false;setTimeout(()=>this.flush(),1200+Math.random()*1200);return}this.ref=null}
    this.busy=false}
};
