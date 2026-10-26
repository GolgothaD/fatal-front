'use strict';
// ===== Touch controls: multi-touch input, per-device saved layouts, and an in-game layout editor =====
const TC=(()=>{
const KEY='fatalfront-touch-v2';
const IDS=['stick','a','x','b','y','rb','start'];
const NAME={stick:'MOVE STICK',a:'A · JUMP',x:'X · SHOOT / PUNCH',b:'B · KICK / LOCK',y:'Y · SPECIAL / GRENADE',rb:'RB · SWAP / BLOCK',start:'PAUSE'};
const LBL={run:{a:'JUMP',x:'SHOOT',b:'LOCK',y:'GRENADE',rb:'SWAP',start:'❚❚'},duel:{a:'JUMP',x:'PUNCH',b:'KICK',y:'SPECIAL',rb:'BLOCK',start:'❚❚'},menu:{a:'OK',x:'OK',b:'BACK',y:'',rb:'',start:'❚❚'}};
const COL={a:'40,170,70',x:'50,110,235',b:'225,55,45',y:'235,185,25',rb:'120,120,135',start:'120,120,135'};
let cfg={stickMode:'floating',dead:0.1,haptics:true,layouts:{},v4:1};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s=='object')cfg=Object.assign(cfg,s);if(!cfg.layouts||typeof cfg.layouts!='object')cfg.layouts={};if(!cfg.v4){cfg.v4=1;cfg.stickMode='floating';cfg.dead=Math.min(cfg.dead,0.1)}}catch(e){}
let saveT=0;function persist(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(cfg))}catch(e){}},120)}
function persistNow(){clearTimeout(saveT);try{localStorage.setItem(KEY,JSON.stringify(cfg))}catch(e){}}
let root,els={},panel,cur={},editing=false,sel='a',mode='run',lkey='';
const ptr=new Map();// pointerId -> {kind,k,sx,sy,ox,oy}
// ---------- geometry ----------
function key(){const L=E.layout;const m=Math.min(L.W,L.H);const dev=m<560?'cover':matchMedia('(pointer:coarse)').matches||E.touch?'inner':'big';return dev+(L.portrait?'-p':'-l')}
function region(){const L=E.layout,si=L.si,W=L.W,H=L.H;
 if(L.mode=='bottom'){const y=L.gy+L.gh+6;return{one:{x:si.l,y,w:W-si.l-si.r,h:H-si.b-y}}}
 if(L.mode=='sides')return{left:{x:si.l,y:si.t,w:L.gx-si.l,h:H-si.t-si.b},right:{x:L.gx+L.gw,y:si.t,w:W-si.r-L.gx-L.gw,h:H-si.t-si.b}};
 const w=Math.min(W*0.3,340);return{left:{x:si.l,y:H*0.45,w,h:H*0.55-si.b},right:{x:W-si.r-w,y:H*0.45,w,h:H*0.55-si.b}}}
function defaults(){const L=E.layout,R=region(),o={};const op=0.85;
 const diamond=(cx,cy,b)=>{const d=b*1.06;o.y={x:cx,y:cy-d,s:b,o:op};o.a={x:cx,y:cy+d,s:b,o:op};o.x={x:cx-d,y:cy,s:b,o:op};o.b={x:cx+d,y:cy,s:b,o:op};o.rb={x:cx-d,y:cy-d,s:b*0.72,o:op}};
 if(R.one){const r=R.one;let b=clamp(Math.min(r.w*0.19,r.h*0.27),60,100);const st=clamp(Math.min(r.w*0.42,r.h*0.62),120,200);
  const d=b*1.06,cx=r.x+r.w-14-b/2-d,cy=r.y+clamp(r.h*0.42,d+b/2+10,r.h-d-b/2-10);diamond(cx,cy,b);
  o.stick={x:r.x+Math.max(st/2+18,r.w*0.25),y:r.y+clamp(r.h*0.6,st/2+46,r.h-st/2-12),s:st,o:op};o.start={x:r.x+46,y:r.y+24,s:Math.max(46,b*0.62),o:op}}
 else{const l=R.left,r=R.right;const st=clamp(Math.min(l.w*0.86,l.h*0.48),104,200);o.stick={x:l.x+l.w/2,y:l.y+l.h*0.62,s:st,o:op};o.start={x:l.x+l.w/2,y:l.y+30,s:46,o:op};
  let b=clamp(Math.min((r.w-12)/3.05,r.h*0.2),54,96);const cx=r.x+r.w/2,cy=r.y+r.h*0.6;diamond(cx,cy,b);o.rb={x:r.x+r.w/2,y:r.y+32,s:Math.max(46,b*0.72),o:op}}
 // never overlap: shrink everything a little until clear
 for(let it=0;it<8;it++){let hit=false;for(let i=0;i<IDS.length;i++)for(let j=i+1;j<IDS.length;j++){const p=o[IDS[i]],q=o[IDS[j]];if(Math.hypot(p.x-q.x,p.y-q.y)<(p.s+q.s)/2+4)hit=true}if(!hit)break;for(const k of IDS)o[k].s*=0.93}
 const out={};for(const k of IDS){const c=o[k];out[k]={x:c.x/L.W,y:c.y/L.H,s:Math.round(c.s),o:c.o}}return out}
function fix(c){const L=E.layout,si=L.si,r=c.s/2;c.x=clamp(c.x,si.l+r,L.W-si.r-r);c.y=clamp(c.y,si.t+r,L.H-si.b-r);
 const h=L.hg;if(h){if(h.w!==undefined&&Math.abs(c.x-(h.x+h.w/2))<r+h.w/2+6){c.x=c.x<h.x+h.w/2?h.x-r-6:h.x+h.w+r+6}if(h.h!==undefined&&Math.abs(c.y-(h.y+h.h/2))<r+h.h/2+6){c.y=c.y<h.y+h.h/2?h.y-r-6:h.y+h.h+r+6}}return c}
function place(){if(!root||!E.layout)return;lkey=key();const L=E.layout;const lay=cfg.layouts[lkey]||defaults();cur={};
 for(const k of IDS){const s=lay[k]||defaults()[k];cur[k]=fix({x:s.x*L.W,y:s.y*L.H,s:clamp(s.s,36,260),o:clamp(s.o,0.15,1)})}
 for(const k of IDS){const c=cur[k],el=els[k];el.style.left=c.x+'px';el.style.top=c.y+'px';el.style.width=el.style.height=c.s+'px';el.style.opacity=c.o;if(k!='stick')el.style.fontSize=Math.round(c.s*(k=='rb'||k=='start'?0.24:0.2))+'px'}
 if(panel)panelSync()}
function store(){const L=E.layout,o={};for(const k of IDS){const c=cur[k];o[k]={x:c.x/L.W,y:c.y/L.H,s:Math.round(c.s),o:Math.round(c.o*100)/100}}cfg.layouts[lkey]=o;persist()}
// ---------- input ----------
// generous hit areas: nearest button (relative to its size) within 1.45x its radius
function hitBtn(x,y,only){let best=null,bd=1e9;for(const k of IDS){if(k=='stick'||only&&!only.includes(k))continue;const c=cur[k];const d=Math.hypot(x-c.x,y-c.y)/(c.s/2);if(d<1.45&&d<bd){bd=d;best=k}}return best}
function inStick(x,y){const c=cur.stick;if(!c)return false;const d=Math.hypot(x-c.x,y-c.y);return cfg.stickMode=='floating'?d<c.s*0.75*1.5:d<c.s/2*1.3}
function buzz(){if(cfg.haptics&&navigator.vibrate)try{navigator.vibrate(12)}catch(e){}}
function recompute(){for(const k of['a','x','b','y','rb','start'])touchState[k]=0;for(const p of ptr.values())if(p.kind=='btn'&&p.k)touchState[p.k]=1;touchState.back=mode=='menu'?touchState.b:0;
 for(const k of['a','x','b','y','rb','start'])els[k].classList.toggle('on',!!touchState[k])}
function stickMove(p,x,y){const c=cur.stick,R=c.s*0.42;let dx=x-p.ox,dy=y-p.oy;let m=Math.hypot(dx,dy);if(m>R){const k=(m-R)/m;p.ox+=dx*k;p.oy+=dy*k;dx=x-p.ox;dy=y-p.oy;m=R;if(cfg.stickMode=='floating'){els.stick.style.left=p.ox+'px';els.stick.style.top=p.oy+'px'}}const n=Math.min(1,m/R),dz=cfg.dead;const v=n<dz?0:(n-dz)/(1-dz);const a=Math.atan2(dy,dx);stick.x=m?Math.cos(a)*v:0;stick.y=m?Math.sin(a)*v:0;
 if(!stickRaf){stickRaf=requestAnimationFrame(()=>{stickRaf=0;els.knob.style.transform=`translate(calc(-50% + ${kdx}px),calc(-50% + ${kdy}px))`})}kdx=dx;kdy=dy}
let stickRaf=0,kdx=0,kdy=0;
function down(e){if(!root||e.target.closest&&e.target.closest('#tcpanel'))return;const x=e.clientX,y=e.clientY;
 if(editing){editDown(e);return}
 if(!document.body.classList.contains('hastouch')&&e.pointerType!='touch')return;
 if(ptr.has(e.pointerId))return;
 const k=hitBtn(x,y);if(k){E.touch=true;E.lastInput='touch';AU.unlock();ptr.set(e.pointerId,{kind:'btn',k});touchLatch[k]=1;if(k=='b'&&mode=='menu')touchLatch.back=1;buzz();recompute();e.preventDefault();e.stopPropagation();return}
 if(stick.id===null&&inStick(x,y)&&(e.pointerType=='touch'||E.touch)){E.touch=true;E.lastInput='touch';AU.unlock();const c=cur.stick;const fl=cfg.stickMode=='floating';const p={kind:'stick',ox:fl?x:c.x,oy:fl?y:c.y};ptr.set(e.pointerId,p);stick.id=e.pointerId;
  if(fl){els.stick.style.left=x+'px';els.stick.style.top=y+'px'}els.stick.classList.add('on');stickMove(p,x,y);e.preventDefault();e.stopPropagation()}}
function move(e){if(editing){editMove(e);return}const p=ptr.get(e.pointerId);if(!p)return;e.preventDefault();
 if(p.kind=='stick'){stickMove(p,e.clientX,e.clientY);return}
 // slide between JUMP and SHOOT only (sliding onto LOCK/BLOCK/SWAP by accident froze the player)
 if(p.k!='a'&&p.k!='x')return;const k=hitBtn(e.clientX,e.clientY,['a','x']);if(k&&k!==p.k){p.k=k;touchLatch[k]=1;buzz();recompute()}}
function up(e){if(editing){editUp(e);return}const p=ptr.get(e.pointerId);if(!p)return;ptr.delete(e.pointerId);
 if(p.kind=='stick'){stick.id=null;stick.x=stick.y=0;kdx=kdy=0;els.knob.style.transform='translate(-50%,-50%)';els.stick.classList.remove('on');if(cfg.stickMode=='floating'){els.stick.style.left=cur.stick.x+'px';els.stick.style.top=cur.stick.y+'px'}}recompute()}
function releaseAll(){ptr.clear();stick.id=null;for(const k in touchLatch)touchLatch[k]=0;kdx=kdy=0;if(els.stick)els.stick.classList.remove('on');stick.x=stick.y=0;if(els.knob)els.knob.style.transform='translate(-50%,-50%)';if(root)recompute()}
// ---------- editor ----------
const ed=new Map();let pinch=null;
function pickAny(x,y){let best=null,bd=1e9;for(const k of IDS){const c=cur[k];const d=Math.hypot(x-c.x,y-c.y);if(d<Math.max(c.s/2*1.1,28)&&d<bd){bd=d;best=k}}return best}
function editDown(e){e.preventDefault();e.stopPropagation();const x=e.clientX,y=e.clientY;
 if(ed.size==1&&!pinch){const [id0,p0]=[...ed.entries()][0];if(p0.k){pinch={a:id0,b:e.pointerId,d0:0,s0:cur[p0.k].s,k:p0.k};ed.set(e.pointerId,{x,y});const q=ed.get(id0);pinch.d0=Math.max(20,Math.hypot(x-q.x,y-q.y));return}}
 const k=pickAny(x,y);ed.set(e.pointerId,{k,x,y,dx:k?cur[k].x-x:0,dy:k?cur[k].y-y:0});if(k){sel=k;markSel();panelSync()}}
function editMove(e){const p=ed.get(e.pointerId);if(!p)return;e.preventDefault();p.x=e.clientX;p.y=e.clientY;
 if(pinch&&(e.pointerId==pinch.a||e.pointerId==pinch.b)){const A=ed.get(pinch.a),B=ed.get(pinch.b);if(A&&B){const d=Math.hypot(A.x-B.x,A.y-B.y);setSize(pinch.k,pinch.s0*d/pinch.d0)}return}
 if(p.k){const c=cur[p.k];c.x=e.clientX+p.dx;c.y=e.clientY+p.dy;fix(c);const el=els[p.k];el.style.left=c.x+'px';el.style.top=c.y+'px'}}
function editUp(e){if(!ed.has(e.pointerId))return;ed.delete(e.pointerId);if(pinch&&(e.pointerId==pinch.a||e.pointerId==pinch.b)){pinch=null;if(ed.size){const [id,p]=[...ed.entries()][0];if(p.k){p.dx=cur[p.k].x-p.x;p.dy=cur[p.k].y-p.y}}}store()}
function setSize(k,s){const c=cur[k];c.s=clamp(Math.round(s),36,260);fix(c);store();place()}
function setOp(k,o){cur[k].o=clamp(o,0.15,1);store();place()}
function markSel(){for(const k of IDS)els[k].classList.toggle('sel',editing&&k==sel)}
function panelSync(){if(!panel)return;const q=s=>panel.querySelector(s);const L=E.layout;
 q('#tc-key').textContent=(lkey.startsWith('cover')?'Cover screen':lkey.startsWith('inner')?'Inner screen':'Large screen')+' · '+(L.portrait?'portrait':'landscape');
 q('#tc-fixed').classList.toggle('act',cfg.stickMode=='fixed');q('#tc-float').classList.toggle('act',cfg.stickMode=='floating');
 q('#tc-dead').value=Math.round(cfg.dead*100);q('#tc-deadv').textContent=Math.round(cfg.dead*100)+'%';q('#tc-hap').checked=!!cfg.haptics;
 q('#tc-sel').textContent=NAME[sel];const c=cur[sel];if(c){q('#tc-size').value=Math.round(c.s);q('#tc-sizev').textContent=Math.round(c.s)+'px';q('#tc-op').value=Math.round(c.o*100);q('#tc-opv').textContent=Math.round(c.o*100)+'%'}}
function edit(on){if(!root)return;editing=!!on;E.editing=editing;releaseAll();ed.clear();pinch=null;document.body.classList.toggle('tcedit',editing);document.body.classList.add('hastouch');E.touch=true;
 panel.classList.toggle('show',editing);panel.classList.remove('min');markSel();panelSync();if(!editing){persistNow();for(const k in IN[0])if(typeof IN[0][k]=='number')IN[0][k]=0}}
function reset(){delete cfg.layouts[lkey];persistNow();place();panelSync()}
// ---------- scene labels ----------
function labels(){const S=typeof Game!='undefined'&&Game.scene;const m=(S=='run'||S=='duel')&&!E.paused?S:'menu';if(m===mode)return;mode=m;const t=LBL[m];for(const k of['a','x','b','y','rb','start']){els[k].querySelector('i').textContent=t[k]}}
// ---------- build ----------
function init(){root=document.getElementById('touch');if(!root)return;root.innerHTML='';
 const st=document.createElement('div');st.className='tc tc-stick';st.innerHTML='<div class="ring"></div><div class="knob"></div><span>MOVE</span>';root.appendChild(st);els.stick=st;els.knob=st.querySelector('.knob');
 for(const k of['y','x','b','a','rb','start']){const b=document.createElement('div');b.className='tc tc-btn'+(k=='rb'||k=='start'?' tc-sm':'');b.dataset.k=k;b.style.setProperty('--c',COL[k]);b.innerHTML=`<b>${k=='start'?'':k.toUpperCase()}</b><i></i>`;root.appendChild(b);els[k]=b}
 mode='';labels();setInterval(labels,200);
 panel=document.createElement('div');panel.id='tcpanel';panel.innerHTML=`<div class="hd"><span>TOUCH CONTROLS</span><small id="tc-key"></small><button id="tc-min" aria-label="Collapse panel">▾</button></div>
<div class="bd"><p class="hint">Drag any control to move it. Pinch with two fingers to resize. Tap a control to select it.</p>
<div class="row"><label>Stick</label><span class="seg"><button id="tc-fixed">Fixed</button><button id="tc-float">Floating</button></span></div>
<div class="row"><label>Dead zone</label><input id="tc-dead" type="range" min="0" max="40"><output id="tc-deadv"></output></div>
<div class="row"><label for="tc-hap">Vibrate on press</label><input id="tc-hap" type="checkbox"></div>
<div class="sel"><b id="tc-sel"></b>
<div class="row"><label>Size</label><input id="tc-size" type="range" min="36" max="260"><output id="tc-sizev"></output></div>
<div class="row"><label>Opacity</label><input id="tc-op" type="range" min="15" max="100"><output id="tc-opv"></output></div></div>
<div class="row btns"><button id="tc-reset">Reset to default</button><button id="tc-done" class="pri">Done</button></div></div>`;document.body.appendChild(panel);
 const q=s=>panel.querySelector(s);
 q('#tc-fixed').onclick=()=>{cfg.stickMode='fixed';persist();panelSync()};q('#tc-float').onclick=()=>{cfg.stickMode='floating';persist();panelSync()};
 q('#tc-dead').oninput=e=>{cfg.dead=e.target.value/100;persist();panelSync()};q('#tc-hap').onchange=e=>{cfg.haptics=e.target.checked;persist();if(cfg.haptics)buzz()};
 q('#tc-size').oninput=e=>setSize(sel,+e.target.value);q('#tc-op').oninput=e=>setOp(sel,e.target.value/100);
 q('#tc-reset').onclick=reset;q('#tc-done').onclick=()=>edit(false);q('#tc-min').onclick=()=>panel.classList.toggle('min');
 addEventListener('pointerdown',down,true);addEventListener('pointermove',move,{capture:true,passive:false});addEventListener('pointerup',up,true);addEventListener('pointercancel',up,true);
 addEventListener('blur',releaseAll);addEventListener('pagehide',releaseAll);
 document.addEventListener('touchend',e=>{if(!editing&&e.touches.length==0&&ptr.size)releaseAll()},true);document.addEventListener('touchcancel',e=>{if(!editing&&e.touches.length==0)releaseAll()},true);document.addEventListener('visibilitychange',releaseAll);
 // no browser gestures: scroll, pinch-zoom, double-tap zoom, long-press menus / text selection
 const inPanel=e=>e.target&&e.target.closest&&e.target.closest('#tcpanel');
 document.addEventListener('touchstart',e=>{if(!inPanel(e))e.preventDefault()},{passive:false});document.addEventListener('touchmove',e=>{if(!inPanel(e)||e.touches.length>1)e.preventDefault()},{passive:false});
 for(const ev of['contextmenu','gesturestart','gesturechange','dblclick','selectstart'])document.addEventListener(ev,e=>{if(!inPanel(e))e.preventDefault()},{passive:false});
 view.addEventListener('pointerdown',e=>{AU.unlock();if(!editing&&E.onTap)E.onTap(e)});
 place()}
return{init,place,edit,reset,get cfg(){return cfg},get cur(){return cur},get key(){return lkey},get editing(){return editing},defaults,IDS}})();
