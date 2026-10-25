'use strict';
// ===== FATAL FRONT engine: screen, layout, input, audio, save, font =====
const VW=320,VH=240,RS=2;// RS: render supersample (logic stays 320x240, pixels are 640x480)
// images flagged with _rs are hi-res: their natural size in logical units is width/_rs
const _di=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(im,...a){const r=im&&im._rs;if(r){if(a.length==2)return _di.call(this,im,a[0],a[1],im.width/r,im.height/r);if(a.length==8)return _di.call(this,im,a[0]*r,a[1]*r,a[2]*r,a[3]*r,a[4],a[5],a[6],a[7])}return _di.call(this,im,...a)};
const E={t:0,frame:0,paused:false,autoPaused:false,touch:false,dbg:{}};
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t, rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rnd(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)], sgn=v=>v<0?-1:1;
// ---------- save ----------
const SAVE_KEY='fatalfront-save-v1';
const DEF={music:0.8,sfx:0.85,voice:0.9,blood:true,crt:1,easy:false,easySpecials:'touch',shake:true,v2:0,best:0,wins:{},furthest:{},stageUnlocked:1,runs:0,clears:0};
let SV=Object.assign({},DEF);try{Object.assign(SV,JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'))}catch(e){}
// v2: CRT/scanlines default off on touch devices (one-time migration)
if(!SV.v2){SV.v2=1;if(matchMedia('(pointer:coarse)').matches)SV.crt=0}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(SV))}catch(e){}}
// ---------- screen ----------
const scr=document.createElement('canvas');scr.width=VW*RS;scr.height=VH*RS;const G=scr.getContext('2d');G.setTransform(RS,0,0,RS,0,0);G.imageSmoothingEnabled=false;
let view,vg,crtLayer=null,K=1;
function makeCRT(w,h,k,mode){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');if(!mode)return null;
 k=Math.max(2,k);for(let y=0;y<h;y++){const ph=(y%k)/k;const a=ph>0.6?(mode==2?0.42:0.26):ph<0.12?(mode==2?0.15:0.08):0;if(a){g.fillStyle=`rgba(0,0,0,${a})`;g.fillRect(0,y,w,1)}}
 if(mode==2&&k>=3){for(let x=0;x<w;x++){const m=x%3;g.fillStyle=m==0?'rgba(255,0,0,0.06)':m==1?'rgba(0,255,0,0.05)':'rgba(0,0,255,0.07)';g.fillRect(x,0,1,h)}}
 const R=g.createRadialGradient(w/2,h/2,Math.min(w,h)*0.35,w/2,h/2,Math.hypot(w,h)*0.56);R.addColorStop(0,'rgba(0,0,0,0)');R.addColorStop(1,`rgba(0,0,0,${mode==2?0.55:0.3})`);g.fillStyle=R;g.fillRect(0,0,w,h);return c}
function safeInsets(){const p=document.getElementById('safe');if(!p)return{t:0,r:0,b:0,l:0};const c=getComputedStyle(p);return{t:parseFloat(c.paddingTop)||0,r:parseFloat(c.paddingRight)||0,b:parseFloat(c.paddingBottom)||0,l:parseFloat(c.paddingLeft)||0}}
// foldable hinge (Viewport Segments API) -> {x,w} vertical fold or {y,h} horizontal fold
function hingeRect(){try{const sg=(window.viewport&&window.viewport.segments)||(window.visualViewport&&visualViewport.segments);if(sg&&sg.length==2){const a=sg[0],b=sg[1];if(Math.abs(a.top-b.top)<2&&b.left>=a.right-1)return{x:a.right,w:Math.max(0,b.left-a.right)};return{y:a.bottom,h:Math.max(0,b.top-a.bottom)}}}catch(e){}return null}
function layout(){const W=innerWidth,H=innerHeight,dpr=devicePixelRatio||1;
 E.touch=E.touch||matchMedia('(pointer:coarse)').matches;const portrait=H>W*1.05;document.body.classList.toggle('portrait',portrait);document.body.classList.toggle('landscape',!portrait);document.body.classList.toggle('hastouch',E.touch);
 const si=safeInsets(),hg=hingeRect();const AW=W-si.l-si.r,AH=H-si.t-si.b;const fit=(w,h)=>{const f=Math.max(0.1,Math.min(w/VW,h/VH));return[VW*f,VH*f]};
 let mode='full',gw,gh;
 if(E.touch){// bottom control band or side bands, whichever leaves the bigger picture
  const band=clamp(AH-AW*0.75,230,AH*0.46),B=fit(AW,AH-band);const side=clamp(AW*0.19,168,250),S=fit(AW-2*side,AH);
  if(B[0]>=S[0]){mode='bottom';[gw,gh]=B}else{mode='sides';[gw,gh]=S}}
 else [gw,gh]=fit(AW,AH);
 // snap to an exact integer pixel multiple when it costs little, for perfectly even pixels
 const dev=gw*dpr/VW,ki=Math.floor(dev);if(ki>=2&&ki/dev>0.86){gw=VW*ki/dpr;gh=VH*ki/dpr}
 const gx=si.l+(AW-gw)/2,gy=mode=='bottom'?si.t+Math.max(4,Math.min(24,(AH-gh-230)/2)):si.t+(AH-gh)/2;
 const vw=Math.round(gw*dpr),vh=Math.round(gh*dpr);if(view.width!==vw||view.height!==vh){view.width=vw;view.height=vh}view.style.width=gw+'px';view.style.height=gh+'px';view.style.left=gx+'px';view.style.top=gy+'px';
 vg=view.getContext('2d');vg.imageSmoothingEnabled=false;K=vh/VH;
 crtLayer=makeCRT(view.width,view.height,K,SV.crt);E.layout={W,H,dpr,portrait,mode,si,hg,gx,gy,gw,gh,k:K,cssW:gw,cssH:gh,top:gy};if(typeof TC!='undefined')TC.place()}
function present(){vg.drawImage(scr,0,0,view.width,view.height);if(crtLayer){if(SV.crt==2){vg.globalCompositeOperation='lighter';vg.globalAlpha=0.12;vg.filter='blur('+Math.max(1,K)+'px)';vg.drawImage(scr,0,0,view.width,view.height);vg.filter='none';vg.globalAlpha=1;vg.globalCompositeOperation='source-over'}vg.drawImage(crtLayer,0,0)}}
// ---------- input ----------
const BTN=['l','r','u','d','a','x','b','y','rb','start','back'];
function mkPad(){const o={};BTN.forEach(k=>{o[k]=0;o['_'+k]=0});o.ax=0;o.ay=0;return o}
const IN=[mkPad(),mkPad()];IN.src=['kb','none'];
const kbState={};const KB1={ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r',ArrowUp:'u',KeyW:'u',ArrowDown:'d',KeyS:'d',KeyZ:'a',Space:'a',KeyX:'x',KeyJ:'x',KeyC:'b',KeyK:'b',KeyV:'y',KeyL:'y',ShiftLeft:'rb',ShiftRight:'rb',Enter:'start',Escape:'start',Backspace:'back'};
addEventListener('keydown',e=>{if(KB1[e.code]){kbState[KB1[e.code]]=1;e.preventDefault();E.lastInput='kb';AU.unlock()}});
addEventListener('keyup',e=>{if(KB1[e.code]){kbState[KB1[e.code]]=0}});
const touchState={};let stick={id:null,x:0,y:0};// driven by touch.js (TC)
let padPrev=[[],[]];E.pads=0;E.fakePads=null;
function readPads(){const ps=(E.fakePads||(navigator.getGamepads?navigator.getGamepads():[])||[]);const out=[];for(const p of ps)if(p&&p.connected!==false)out.push(p);E.pads=out.length;return out}
function pollInput(){const pads=readPads();
 // P1: keyboard + touch + first pad; P2: second pad (or first pad if P1 uses keyboard and co-op chose that)
 const s=[{},{}];BTN.forEach(k=>{s[0][k]=(kbState[k]||touchState[k])?1:0;s[1][k]=0});let ax=[0,0],ay=[0,0];
 if(stick.id!==null){ax[0]=stick.x;ay[0]=stick.y}
 const map=E.padMap||[0,1];
 pads.forEach((p,i)=>{const pl=map.indexOf(i);if(pl<0)return;const b=j=>p.buttons[j]&&(p.buttons[j].pressed||p.buttons[j].value>0.5)?1:0;const t=s[pl];
  const x=p.axes[0]||0,y=p.axes[1]||0;if(Math.hypot(x,y)>0.3){ax[pl]=x;ay[pl]=y}
  t.a|=b(0);t.b|=b(1);t.x|=b(2);t.y|=b(3);t.rb|=b(5)|b(4)|b(7);t.start|=b(9);t.back|=b(8);t.u|=b(12);t.d|=b(13);t.l|=b(14);t.r|=b(15);
  if(BTN.some(k=>t[k])||Math.hypot(x,y)>0.3){E.lastInput='pad';AU.unlock()}});
 for(let pl=0;pl<2;pl++){const t=s[pl];if(Math.hypot(ax[pl],ay[pl])>(pl==0&&stick.id!==null?0.05:0.35)){const a=Math.atan2(ay[pl],ax[pl]),oct=Math.round(a/(Math.PI/4));const dx=Math.round(Math.cos(oct*Math.PI/4)),dy=Math.round(Math.sin(oct*Math.PI/4));if(dx<0)t.l=1;if(dx>0)t.r=1;if(dy<0)t.u=1;if(dy>0)t.d=1}
  const I=IN[pl];BTN.forEach(k=>{const v=t[k]?1:0;I['_'+k]=v&&!I[k]?1:0;I['r_'+k]=!v&&I[k]?1:0;I[k]=v});I.ax=ax[pl];I.ay=ay[pl]}}
const pressed=(k,pl)=>pl===undefined?(IN[0]['_'+k]||IN[1]['_'+k]):IN[pl]['_'+k];
const held=(k,pl)=>pl===undefined?(IN[0][k]||IN[1][k]):IN[pl][k];
// menu auto-repeat for directions
const rep={};function menuDir(k,pl){const id=k+(pl||0);const h=pl===undefined?held(k):held(k,pl);if(!h){rep[id]=0;return 0}rep[id]=(rep[id]||0)+1;return rep[id]==1||(rep[id]>18&&rep[id]%5==0)}
// ---------- audio ----------
const AU={ctx:null,buf:{},bus:{},last:{},music:null,musicName:null,ok:false,
 init(){if(this.ctx)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=this.ctx=new C({latencyHint:'interactive'});
  const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=8;comp.ratio.value=2.5;comp.attack.value=0.006;comp.release.value=0.18;
  const lim=c.createDynamicsCompressor();lim.threshold.value=-4;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=0.001;lim.release.value=0.08;
  const out=c.createGain();out.gain.value=0.94;comp.connect(lim);lim.connect(out);out.connect(c.destination);
  // gentle high-shelf cut on the SFX bus so nothing gets shrill
  const shelf=c.createBiquadFilter();shelf.type='highshelf';shelf.frequency.value=6500;shelf.gain.value=-3;shelf.connect(comp);
  for(const b of['music','sfx','voice']){const gn=c.createGain();gn.connect(b=='sfx'?shelf:comp);this.bus[b]=gn}
  this.duck=c.createGain();this.duck.connect(this.bus.music);this.applyVol();this.ok=true},
 applyVol(){if(!this.ctx)return;const t=this.ctx.currentTime;const f=v=>Math.pow(v,1.6);this.bus.music.gain.setTargetAtTime(f(SV.music),t,0.03);this.bus.sfx.gain.setTargetAtTime(f(SV.sfx),t,0.03);this.bus.voice.gain.setTargetAtTime(f(SV.voice),t,0.03)},
 unlock(){this.init();if(this.ctx&&this.ctx.state!=='running'&&!E.paused&&!document.hidden&&document.hasFocus())this.ctx.resume()},
 async load(list,onp){this.init();let n=0;await Promise.all(list.map(async([name,url])=>{try{const r=await fetch(url);const ab=await r.arrayBuffer();this.buf[name]=await new Promise((res,rej)=>this.ctx.decodeAudioData(ab,res,rej))}catch(e){console.warn('audio',name,e&&e.message)}n++;onp&&onp(n/list.length)}))},
 sfx(name,o={}){const b=this.buf['s_'+name];if(!b||!this.ctx||this.ctx.state!=='running')return;const now=this.ctx.currentTime;const gap=o.gap??0.04;if(this.last[name]&&now-this.last[name]<gap)return;this.last[name]=now;
  const s=this.ctx.createBufferSource();s.buffer=b;s.playbackRate.value=(o.rate||1)*(o.vary===false?1:1+(Math.random()-0.5)*0.06);const g=this.ctx.createGain();g.gain.value=o.vol??1;let n=g;
  if(o.pan&&this.ctx.createStereoPanner){const p=this.ctx.createStereoPanner();p.pan.value=clamp(o.pan,-1,1);g.connect(p);n=p}n.connect(this.bus.sfx);s.connect(g);s.start()},
 vo(name){const b=this.buf['v_'+name];if(!b||!this.ctx||this.ctx.state!=='running')return;if(this.curVo)try{this.curVo.stop()}catch(e){}const s=this.ctx.createBufferSource();s.buffer=b;s.connect(this.bus.voice);s.start();this.curVo=s;
  const t=this.ctx.currentTime;this.duck.gain.cancelScheduledValues(t);this.duck.gain.setTargetAtTime(0.55,t,0.04);this.duck.gain.setTargetAtTime(1,t+b.duration,0.25)},
 playMusic(name,fade=0.6){if(!this.ctx)return;if(this.musicName===name&&this.music)return;this.stopMusic(fade);const b=this.buf['m_'+name];this.musicName=name;if(!b)return;
  const s=this.ctx.createBufferSource();s.buffer=b;s.loop=true;const g=this.ctx.createGain();const t=this.ctx.currentTime;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1,t+0.25);s.connect(g);g.connect(this.duck);s.start();this.music={s,g}},
 stopMusic(fade=0.6){if(!this.music)return;const{s,g}=this.music;const t=this.ctx.currentTime;g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.linearRampToValueAtTime(0,t+fade);try{s.stop(t+fade+0.05)}catch(e){}this.music=null;this.musicName=null},
 suspend(){if(this.ctx&&this.ctx.state==='running')this.ctx.suspend()},resume(){if(this.ctx&&this.ctx.state!=='running')this.ctx.resume()}};
const SFX_LIST=['alarm','bigboom','block','boom','coin','eshot','fall','flame','grenade','gun','hitf','hitm','hurt','jump','kick0','kick1','land','laser','pickup','punch0','punch1','punch2','shotgun','smallboom','sp_charge','sp_fire','sp_shock','sp_teleport','splat','spread','stamp','swing','swingh','turret','ui','uisel','upper'];
const VO_LIST=['boss','brick','brutal','choose','continue','endit','excellent','fight','final','flame','gameover','go','kazan','laser','life','nova','perfect','rapid','raze','round1','round2','round3','spread','stage','strike','title','victory','warning','wins','youlose','youwin'];
const MUS_LIST=['title','s1','s2','s3','s4','s5','s6','fight','final'];
// pause audio + game when hidden / unfocused
function autoPause(on){if(on){AU.suspend();if(!E.paused&&E.canPause&&E.canPause()){E.paused=true;E.autoPaused=true;E.pauseSel=0}}else{if(!E.paused)AU.resume()}}
document.addEventListener('visibilitychange',()=>autoPause(document.hidden));addEventListener('blur',()=>autoPause(true));addEventListener('focus',()=>autoPause(false));addEventListener('pagehide',()=>autoPause(true));
// ---------- bitmap font ----------
const FONT={};(function(){const d={A:'0e11111f111111',B:'1e11111e11111e',C:'0e11101010110e',D:'1e11111111111e',E:'1f10101e10101f',F:'1f10101e101010',G:'0e111017111 10f',H:'1111111f111111',I:'0e04040404040e',J:'07020202021 20c',K:'11121418141211',L:'1010101010101f',M:'111b1515111111',N:'11111915131111',O:'0e11111111110e',P:'1e11111e101010',Q:'0e111111151 20d',R:'1e11111e141211',S:'0f10100e01011e',T:'1f040404040404',U:'1111111111110e',V:'1111111111 0a04',W:'1111111515150a',X:'11110a040a1111',Y:'1111110a040404',Z:'1f01020408101f',
 0:'0e111315191 10e',1:'040c040404040e',2:'0e11010204081f',3:'1f02040201110e',4:'02060a121f0202',5:'1f101e0101110e',6:'0608101e11110e',7:'1f010204080808',8:'0e11110e11110e',9:'0e11110f01020c','.':'00000000000c0c',',':'000000000c0408','!':'04040404040004','?':'0e110102040004',':':'000c0c000c0c00','-':'0000001f000000','+':'0004041f040400',"'":'0c040800000000','/':'00010204081000','%':'1819020408 1303','(':'02040808080402',')':'08040202020408','<':'02040810080402','>':'08040201020408','*':'0004150e150400','=':'00001f001f0000','#':'0a0a1f0a1f0a0a','&':'0c121408151 20d','↑':'040e1504040404','↓':'0404040415 0e04','→':'0004021f020400','←':'0004081f080400','"':'0a0a0000000000','©':'0e111d191d110e'};
 for(const k in d){const h=d[k].replace(/ /g,'');FONT[k]=[0,1,2,3,4,5,6].map(i=>parseInt(h.substr(i*2,2),16))}})();
const glyphCache=new Map();
function glyph(ch,col){const key=ch+col;let c=glyphCache.get(key);if(c)return c;const rows=FONT[ch];c=document.createElement('canvas');c.width=5;c.height=7;const g=c.getContext('2d');g.fillStyle=col;if(rows)rows.forEach((r,y)=>{for(let x=0;x<5;x++)if(r&(16>>x))g.fillRect(x,y,1,1)});glyphCache.set(key,c);return c}
function textW(s,sc=1){return s.length*6*sc-sc}
function txt(g,s,x,y,col='#fff',o={}){s=String(s).toUpperCase();const sc=o.s||1;let w=textW(s,sc);if(o.a=='c')x-=w/2;else if(o.a=='r')x-=w;x=Math.round(x);y=Math.round(y);
 if(o.sh!==false){const sh=o.shc||'#000';const off=[[sc,sc],[-0.5,0],[0.5,0],[0,-0.5],[0,0.5]];for(const[ox,oy]of off)for(let i=0;i<s.length;i++){if(s[i]!==' ')g.drawImage(glyph(s[i],sh),x+i*6*sc+ox,y+oy,5*sc,7*sc)}}
 for(let i=0;i<s.length;i++)if(s[i]!==' ')g.drawImage(glyph(s[i],col),x+i*6*sc,y,5*sc,7*sc);return w}
// big gradient arcade lettering with chunky outline
const bigCache=new Map();
function bigText(s,sc,c1='#fff6a0',c2='#e01810',ol='#200000'){const key=s+sc+c1+c2+ol;let c=bigCache.get(key);if(c)return c;s=s.toUpperCase();const w=textW(s,sc)+4,h=7*sc+4;c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
 const m=document.createElement('canvas');m.width=w;m.height=h;const mg=m.getContext('2d');for(let i=0;i<s.length;i++)if(s[i]!==' ')mg.drawImage(glyph(s[i],'#fff'),2+i*6*sc,2,5*sc,7*sc);
 // outline
 for(const[dx,dy]of[[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,1],[-1,1],[1,-1],[2,2]]){g.drawImage(m,dx,dy)}g.globalCompositeOperation='source-in';g.fillStyle=ol;g.fillRect(0,0,w,h);g.globalCompositeOperation='source-over';
 const f=document.createElement('canvas');f.width=w;f.height=h;const fg=f.getContext('2d');fg.drawImage(m,0,0);fg.globalCompositeOperation='source-in';const L=fg.createLinearGradient(0,2,0,2+7*sc);L.addColorStop(0,'#ffffff');L.addColorStop(0.18,c1);L.addColorStop(0.62,c2);L.addColorStop(1,'#300800');fg.fillStyle=L;fg.fillRect(0,0,w,h);
 // pixel bevel stripe
 fg.globalCompositeOperation='source-atop';fg.fillStyle='rgba(255,255,255,0.35)';fg.fillRect(0,2+Math.round(sc*1.5),w,Math.max(1,sc>>1));g.drawImage(f,0,0);bigCache.set(key,c);return c}
function big(g,s,x,y,sc,o={}){const c=bigText(s,sc,o.c1,o.c2,o.ol);const X=o.a=='l'?x:o.a=='r'?x-c.width:x-c.width/2;if(o.sx){g.drawImage(c,Math.round(X+c.width*(1-o.sx)/2),Math.round(y),Math.round(c.width*o.sx),c.height)}else g.drawImage(c,Math.round(X),Math.round(y));return c}
// ---------- images ----------
const IMG={};function loadImg(n,u){return new Promise(r=>{const i=new Image();i.onload=()=>{IMG[n]=i;r()};i.onerror=()=>{console.warn('img',u);r()};i.src=u})}
// soft additive glow used by bullets / pickups (radial sprite cached per colour)
const glowCache=new Map();function glow(g,x,y,r,col,a=0.5){let c=glowCache.get(col);if(!c){c=document.createElement('canvas');c.width=c.height=64;const q=c.getContext('2d');const R=q.createRadialGradient(32,32,0,32,32,32);R.addColorStop(0,col);R.addColorStop(0.35,col);R.addColorStop(1,'rgba(0,0,0,0)');q.fillStyle=R;q.fillRect(0,0,64,64);glowCache.set(col,c)}
 const o=g.globalCompositeOperation,ga=g.globalAlpha;g.globalCompositeOperation='lighter';g.globalAlpha=a;g.imageSmoothingEnabled=true;g.drawImage(c,x-r,y-r,r*2,r*2);g.imageSmoothingEnabled=false;g.globalAlpha=ga;g.globalCompositeOperation=o}
// background depth: desaturate, flatten contrast, darken and add cool atmospheric haze so the action reads on top
function haze(img,sat,con,dark,ha){const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);const im=g.getImageData(0,0,c.width,c.height),d=im.data;const hz=[96,110,140];
 for(let i=0;i<d.length;i+=4){const r=d[i],gg=d[i+1],b=d[i+2],l=0.3*r+0.59*gg+0.11*b;const yf=1-Math.floor(i/4/c.width)/c.height;const h=ha*(0.6+0.8*yf);
  for(let k=0;k<3;k++){let v=l+((k==0?r:k==1?gg:b)-l)*sat;v=128+(v-128)*con;v*=dark;d[i+k]=v+(hz[k]-v)*h}}g.putImageData(im,0,0);return c}
// ---------- particles / fx shared ----------
const FX={list:[],shake:0,flash:0,flashC:'#fff',hitstop:0,
 add(p){if(this.list.length<700)this.list.push(p);return p},
 burst(x,y,n,o){for(let i=0;i<n;i++){const a=(o.a??-Math.PI/2)+(Math.random()-0.5)*(o.spread??6.28),v=rnd(o.v0||0.5,o.v1||3);this.add({x,y,vx:Math.cos(a)*v+(o.vx||0),vy:Math.sin(a)*v+(o.vy||0),g:o.g??0.12,life:rnd(o.l0||20,o.l1||40),t:0,c:Array.isArray(o.c)?pick(o.c):o.c,s:o.s||1,type:o.type||'p',floor:o.floor,stick:o.stick})}},
 update(){for(const p of this.list){p.t++;if(p.type=='ring'){continue}p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;if(p.floor!==undefined&&p.y>=p.floor){p.y=p.floor;if(p.stick){p.vx=p.vy=0;p.g=0;p.stuck=1}else{p.vy*=-0.3;p.vx*=0.6}}if(p.drag){p.vx*=p.drag;p.vy*=p.drag}}this.list=this.list.filter(p=>p.t<p.life);if(this.shake>0)this.shake*=0.85;if(this.shake<0.3)this.shake=0;if(this.flash>0)this.flash--},
 draw(g,cx=0,cy=0){for(const p of this.list){const x=Math.round(p.x-cx),y=Math.round(p.y-cy);const f=p.t/p.life;
  if(p.type=='ring'){g.strokeStyle=p.c;g.globalAlpha=1-f;g.lineWidth=2;g.beginPath();g.arc(x,y,p.r0+(p.r1-p.r0)*f,0,7);g.stroke();g.globalAlpha=1;continue}
  if(p.type=='smoke'){g.globalAlpha=(1-f)*0.55;g.fillStyle=p.c;const r=p.s*(1+f*2);g.fillRect(x-r,y-r,r*2,r*2);g.globalAlpha=1;continue}
  if(p.type=='fire'){const c=f<0.25?'#fff8c0':f<0.5?'#ffc030':f<0.75?'#e05010':'#5a2a20';g.fillStyle=c;const r=Math.max(1,Math.round(p.s*(1-f*0.5)));g.fillRect(x-r,y-r,r*2,r*2);continue}
  if(p.type=='chunk'){g.fillStyle=p.c;g.fillRect(x-p.s,y-p.s,p.s*2,p.s*2);g.fillStyle='rgba(0,0,0,0.35)';g.fillRect(x-p.s,y,p.s*2,p.s);continue}
  g.fillStyle=p.c;g.fillRect(x,y,p.s,p.stuck?1:p.s)}}};
function boom(x,y,size=1,snd='boom'){FX.burst(x,y,Math.round(10*size),{c:['#fff8c0','#ffd040','#ff8020'],v0:0.5,v1:2.6*size,g:-0.02,l0:14,l1:28,type:'fire',s:2+size});FX.burst(x,y,Math.round(6*size),{c:['#4a4040','#2a2424','#6a5a50'],v0:0.2,v1:1.2*size,g:-0.03,l0:30,l1:50,type:'smoke',s:2+size*1.5});
 FX.burst(x,y,Math.round(8*size),{c:['#ffe080','#a08060','#3a3030'],v0:1.5,v1:4*size,g:0.2,l0:20,l1:40,s:1});FX.add({type:'ring',x,y,r0:2,r1:14*size,c:'#ffe8a0',life:12,t:0});FX.shake=Math.max(FX.shake,2+size*2);if(snd)AU.sfx(snd,{vol:Math.min(1,0.6+size*0.2)})}
