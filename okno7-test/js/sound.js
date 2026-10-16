'use strict';
/* =========================================================
   ЗВУК (WebAudio, синтез)
   ========================================================= */
const SND={ctx:null,muted:false,
  init(){if(this.ctx)return;try{this.ctx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){this.ctx=null}},
  noise(dur){const c=this.ctx,b=c.createBuffer(1,Math.max(1,c.sampleRate*dur|0),c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=c.createBufferSource();s.buffer=b;return s},
  g(t,a,peak,dec){const g=this.ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec);g.connect(this.ctx.destination);return g},
  play(n){if(this.muted||!this.ctx)return;try{this['_'+n]&&this['_'+n](this.ctx.currentTime)}catch(e){}},
  _thump(t){const c=this.ctx;const s=this.noise(.18),f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=700;s.connect(f);f.connect(this.g(t,.004,.9,.13));s.start(t);const o=c.createOscillator();o.frequency.setValueAtTime(95,t);o.frequency.exponentialRampToValueAtTime(38,t+.18);o.connect(this.g(t,.004,.8,.2));o.start(t);o.stop(t+.3)},
  _rustle(t){const c=this.ctx;const s=this.noise(.35),f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=2600+Math.random()*1200;f.Q.value=.8;s.connect(f);f.connect(this.g(t,.04,.12,.26));s.start(t)},
  _ding(t){const c=this.ctx;[[1046,0],[784,.28]].forEach(([fq,dt])=>{const o=c.createOscillator();o.type='sine';o.frequency.value=fq;o.connect(this.g(t+dt,.01,.22,.7));o.start(t+dt);o.stop(t+dt+.9)})},
  _ring(t){const c=this.ctx;for(let k=0;k<2;k++){for(let i=0;i<18;i++){const o=c.createOscillator();o.type='triangle';o.frequency.value=i%2?1250:1500;const st=t+k*1.1+i*.04;o.connect(this.g(st,.004,.09,.03));o.start(st);o.stop(st+.05)}}},
  _buzz(t){const c=this.ctx;const o=c.createOscillator();o.type='square';o.frequency.value=118;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=900;o.connect(f);f.connect(this.g(t,.01,.14,.3));o.start(t);o.stop(t+.4)},
  _tick(t){const c=this.ctx;const s=this.noise(.02),f=c.createBiquadFilter();f.type='highpass';f.frequency.value=3500;s.connect(f);f.connect(this.g(t,.002,.05,.015));s.start(t)},
  _print(t){const c=this.ctx;for(let i=0;i<14;i++){const o=c.createOscillator();o.type='square';o.frequency.value=700+Math.random()*300;const st=t+i*.055;o.connect(this.g(st,.002,.035,.03));o.start(st);o.stop(st+.05)}},
  _good(t){const c=this.ctx;[523,659,784].forEach((fq,i)=>{const o=c.createOscillator();o.frequency.value=fq;o.connect(this.g(t+i*.08,.01,.12,.3));o.start(t+i*.08);o.stop(t+i*.08+.4)})}
};
document.addEventListener('pointerdown',()=>{SND.init();if(SND.ctx&&SND.ctx.state==='suspended')SND.ctx.resume()},{passive:true});
