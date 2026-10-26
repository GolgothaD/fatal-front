// node tests/touch4.js : iPhone-emulated responsiveness (taps, multitouch, latency, stuck inputs, buffer/coyote)
const {launch,serve,W8,watch}=require('./lib');(async()=>{const port=serve(),b=await launch(),e=[],fail=[],log=[];const ok=(c,m)=>{(c?log:fail).push((c?'ok  ':'FAIL ')+m)};
const p=await b.newPage();watch(p,e);await p.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1');
await p.setViewport({width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:3});const cdp=await p.target().createCDPSession();
const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(([x,y,id])=>({x,y,id}))});
await p.goto(`http://localhost:${port}/index.html`);await p.evaluate(()=>localStorage.clear());await p.reload();for(let i=0;i<40;i++){if(await p.evaluate(()=>window.FF&&FF.Game.loaded))break;await W8(250)}
await p.evaluate(()=>{FF.Game.newRun(false,['raze'],1);FF.Game.startStage()});await W8(1500);
const C=k=>p.evaluate(k=>{const r=document.querySelector(k=="stick"?"#touch .tc-stick":`#touch [data-k=${k}]`).getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,r.width]},k);
const P=()=>p.evaluate(()=>{const q=FF.Run.pl[0];return{x:q.x,y:q.y,vy:q.vy,on:q.on,f:FF.E.frame,pb:FF.Run.pb.length,inv:q.inv}});
const st=await C('stick'),A=await C('a'),X=await C('x');
// 1) instant tap (down+up in same JS turn, between game ticks) must still jump
let s0=await P();await T('touchStart',[[A[0],A[1],1]]);await T('touchEnd',[]);await W8(120);let s1=await P();ok(s1.y<s0.y-3||s1.vy<0,`quick tap jump (y ${s0.y.toFixed(1)}->${s1.y.toFixed(1)})`);await W8(900);
// 2) quick tap on SHOOT fires
s0=await P();await T('touchStart',[[X[0],X[1],2]]);await T('touchEnd',[]);await W8(60);s1=await P();ok(s1.pb>s0.pb,`quick tap shoot (bullets ${s0.pb}->${s1.pb})`);await W8(400);
// 3) edge-of-button tap (1.3x radius off center) registers
await T('touchStart',[[A[0]+A[2]/2*1.3,A[1]+6,3]]);let ed=await p.evaluate(()=>touchState.a);await T('touchEnd',[]);ok(ed==1,'edge tap on JUMP counts');await W8(700);
// 4) latency stick->movement: count ticks until x changes
await p.evaluate(()=>{window.__lat=null;const q=FF.Run.pl[0],x0=q.x;let f0=null,t0=0;addEventListener('pointerdown',()=>{f0=1},{once:true,capture:true});(function w(){if(f0!==null&&q.x>x0+0.3){window.__lat={ticks:FF.E.frame-window.__f0,ms:performance.now()-window.__t0};return}requestAnimationFrame(w)})()});
await T('touchStart',[[st[0],st[1],4]]);await W8(40);await p.evaluate(()=>{window.__f0=FF.E.frame;window.__t0=performance.now()});await T('touchMove',[[st[0]+40,st[1]+4,4]]);await W8(300);const L=await p.evaluate(()=>window.__lat);ok(L&&L.ticks<=3,`stick->move latency ${L&&L.ticks} tick(s), ${L&&L.ms.toFixed(0)}ms`);
// 5) simultaneous move + jump + shoot (3 fingers)
await W8(200);s0=await P();await T('touchStart',[[st[0]+40,st[1]+4,4],[A[0],A[1],5],[X[0],X[1],6]]);let maxUp=0,pb0=s0.pb,pbMax=0;for(let i=0;i<25;i++){const s=await P();maxUp=Math.max(maxUp,s0.y-s.y);pbMax=Math.max(pbMax,s.pb);await W8(16)}
s1=await P();await p.screenshot({path:'/workspace/qa/fatalfront/v4/multitouch_run_jump_shoot.png'});
ok(s1.x>s0.x+5&&maxUp>8&&pbMax>pb0+1,`3-finger move+jump+shoot (dx ${(s1.x-s0.x).toFixed(1)}, rise ${maxUp.toFixed(1)}, bullets +${pbMax-pb0})`);
// 6) diagonal-ish run (25° below horizontal) must not crouch
await T('touchMove',[[st[0]+40,st[1]+18,4],[A[0],A[1],5],[X[0],X[1],6]]);await W8(100);let ci=await p.evaluate(()=>({r:FF.IN[0].r,d:FF.IN[0].d}));ok(ci.r&&!ci.d,'shallow-angle push = run, not crouch '+JSON.stringify(ci));
// 7) release all -> nothing stuck
await T('touchEnd',[]);await W8(80);let rs=await p.evaluate(()=>({t:JSON.stringify(touchState),sid:stick.id,in:['l','r','u','d','a','x','b'].some(k=>FF.IN[0][k])}));ok(rs.sid===null&&!rs.in&&!/:1/.test(rs.t),'no stuck inputs after release '+rs.t);
// 8) touchcancel mid-hold
await T('touchStart',[[st[0]+40,st[1],7],[X[0],X[1],8]]);await W8(50);await T('touchCancel',[]);await W8(60);rs=await p.evaluate(()=>({sid:stick.id,in:['l','r','x'].some(k=>FF.IN[0][k])}));ok(rs.sid===null&&!rs.in,'touchcancel releases');
// 9) visibility change
await T('touchStart',[[X[0],X[1],9]]);await W8(40);await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'))});await W8(40);ok(await p.evaluate(()=>!touchState.x),'visibilitychange releases');await T('touchEnd',[]);
await p.evaluate(()=>{delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'))});
// 10) slide SHOOT->LOCK must not lock
await T('touchStart',[[X[0],X[1],10]]);const B=await C('b');await T('touchMove',[[B[0],B[1],10]]);await W8(40);ok(await p.evaluate(()=>!touchState.b&&touchState.x),'sliding off SHOOT onto LOCK does not lock');await T('touchEnd',[]);
// 11) jump buffer: press A just before landing
await W8(600);await T('touchStart',[[A[0],A[1],11]]);await T('touchEnd',[]);let landed=false;for(let i=0;i<120;i++){const s=await P();if(s.vy>2)break;await W8(8)}
const yb=await p.evaluate(()=>{const q=FF.Run.pl[0];return q.y});let jb=false;for(let i=0;i<200;i++){const s=await p.evaluate(()=>{const q=FF.Run.pl[0];const gy=FF.Run.groundAt(q.x);return{d:gy-q.y,vy:q.vy}});if(s.d<10&&s.vy>0){await T('touchStart',[[A[0],A[1],12]]);await T('touchEnd',[]);break}await W8(2)}
await W8(250);const s12=await P();ok(s12.y<(await p.evaluate(()=>FF.Run.groundAt(FF.Run.pl[0].x)))-6||s12.vy<0,'jump pressed ~before landing is buffered');
// 12) 120Hz vs 60Hz consistency: game ticks per wall second
const r=await p.evaluate(async()=>{const f0=FF.E.frame,t0=performance.now();await new Promise(r=>setTimeout(r,1000));return (FF.E.frame-f0)/((performance.now()-t0)/1000)});ok(r>55&&r<65,'fixed 60Hz sim rate '+r.toFixed(1));
await p.screenshot({path:'/workspace/qa/fatalfront/v4/iphone_landscape.png'});
await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:3});await W8(600);await p.screenshot({path:'/workspace/qa/fatalfront/v4/iphone_portrait.png'});
console.log(log.join('\n'));console.log(fail.length?fail.join('\n'):'ALL PASS');console.log(e.join('\n')||'noerr');await b.close();process.exit(0)})();
