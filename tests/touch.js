// node tests/touch.js : editor drag, persistence, multi-touch, floating stick, reset
const {launch,serve,W8,watch}=require('./lib');(async()=>{const port=serve(),b=await launch(),e=[],fail=[];const ok=(c,m)=>{if(!c)fail.push(m)};
const p=await b.newPage();watch(p,e);await p.setViewport({width:412,height:915,isMobile:true,hasTouch:true,deviceScaleFactor:2.6});const cdp=await p.target().createCDPSession();
const T=async(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(([x,y],i)=>({x,y,id:i}))});
const load=async()=>{await p.goto(`http://localhost:${port}/index.html`);for(let i=0;i<40;i++){if(await p.evaluate(()=>window.FF&&FF.Game.loaded))break;await W8(250)}await W8(400)};
const C=k=>p.evaluate(k=>{const r=document.querySelector(k=="stick"?"#touch .tc-stick":`#touch [data-k=${k}]`).getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]},k);
await load();await p.evaluate(()=>localStorage.removeItem('fatalfront-touch-v2'));await load();
// open editor via OPTIONS flow
await p.evaluate(()=>{FF.Game.go('options')});await W8(200);await p.evaluate(()=>{const i=FF.Game.OPTS?0:0;TC.edit(true)});await W8(200);
ok(await p.evaluate(()=>TC.editing&&getComputedStyle(document.getElementById('tcpanel')).display!='none'),'editor open');
const a0=await C('a');await T('touchStart',[a0]);for(let i=1;i<=8;i++){await T('touchMove',[[a0[0]-i*10,a0[1]-i*25]]);await W8(16)}await T('touchEnd',[]);await W8(100);
const a1=await C('a');ok(Math.abs(a1[1]-(a0[1]-200))<30,'drag moved A '+a0+' -> '+a1);
await p.screenshot({path:'/workspace/qa/fatalfront/v4/touch_editor.png'});
await p.click('#tc-float');await p.evaluate(()=>{const s=document.getElementById('tc-dead');s.value=30;s.dispatchEvent(new Event('input',{bubbles:true}))});
await p.click('#tc-done');await W8(150);ok(!(await p.evaluate(()=>TC.editing)),'editor closed');
await load();const a2=await C('a');ok(Math.abs(a2[1]-a1[1])<3,'persist across reload '+a1+' vs '+a2);
const cfg=await p.evaluate(()=>TC.cfg);ok(cfg.stickMode=='floating','float saved '+cfg.stickMode);
// multi-touch in run: hold stick right + A + X
await p.evaluate(()=>{FF.Game.newRun(false,['raze'],1);FF.Game.startStage()});await W8(800);
const st=await C('stick'),x0=await C('x'),aa=await C('a');const sp=[st[0]-20,st[1]];
await T('touchStart',[sp]);await T('touchMove',[[sp[0]+60,sp[1]]]);await T('touchStart',[[sp[0]+60,sp[1]],aa]);await T('touchStart',[[sp[0]+60,sp[1]],aa,x0]);await W8(80);
const s1=await p.evaluate(()=>({a:touchState.a,x:touchState.x,ax:FF.IN?FF.IN.x:null,tx:JSON.stringify(touchState)}));ok(s1.a&&s1.x,'multi-touch '+s1.tx);
await T('touchEnd',[]);await W8(80);ok(await p.evaluate(()=>!touchState.a&&!touchState.x),'released');
// small move inside dead zone -> no direction
await T('touchStart',[sp]);await T('touchMove',[[sp[0]+5,sp[1]]]);await W8(50);const dz=await p.evaluate(()=>JSON.stringify(touchState));await T('touchEnd',[]);
ok(!/"right":true/.test(dz),'deadzone '+dz);
await p.evaluate(()=>TC.reset());await W8(100);const a3=await C('a');ok(Math.abs(a3[1]-a0[1])<3,'reset '+a0+' vs '+a3);
// landscape layout separate
await p.setViewport({width:915,height:412,isMobile:true,hasTouch:true,deviceScaleFactor:2.6});await W8(600);console.log(await p.evaluate(()=>innerWidth+' '+FF.E.layout.W));const lk=await p.evaluate(()=>TC.key);ok(/-l$/.test(lk),'landscape key '+lk);
console.log(fail.length?'FAIL\n'+fail.join('\n'):'pass');console.log(e.join('\n')||'noerr');await b.close();process.exit(0)})();
