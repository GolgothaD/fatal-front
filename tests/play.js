const {launch,serve,W8,watch}=require('./lib');(async()=>{const port=serve(),b=await launch(['--autoplay-policy=no-user-gesture-required']),p=await b.newPage();const e=[];watch(p,e);await p.setViewport({width:960,height:720});
await p.goto(`http://localhost:${port}/index.html`);for(let i=0;i<40;i++){if(await p.evaluate(()=>window.FF&&FF.Game.loaded))break;await W8(250)}
const res={};const shot=n=>p.screenshot({path:'/workspace/qa/fatalfront/'+n});
await p.evaluate(()=>{window.PAD={connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};FF.E.fakePads=[PAD];
 window.pb=(i,v)=>{PAD.buttons[i].pressed=!!v;PAD.buttons[i].value=v?1:0};window.dir=(x,y)=>{PAD.axes[0]=x;PAD.axes[1]=y}});
// ---- RUN ----
for(const st of (process.env.ST?[+process.env.ST]:[1,4])){
await p.evaluate(st=>{FF.Game.newRun(false,['raze'],st);FF.Game.startStage();FF.E.dbg.fast=3;window._lock=0;window._iv=setInterval(()=>{const R=FF.Run;if(R.pl)R.pl.forEach(q=>q.inv=99);FF.Game.players.forEach(q=>q.lives=Math.max(q.lives,2));if(FF.Game.scene=='continue')pb(9,Math.random()<0.5);if(R.lock)_lock=1;if(R.lock&&R.sp&&!R.sp.dead){const t=R.sp.parts.find(q=>!q.gone),P=R.pl[0];if(t&&P){const dx=t.x-P.x,dy=(t.y)-(P.y-24);dir(Math.abs(dx)>14?Math.sign(dx):0,dy<-20?-1:0);pb(4,Math.abs(dx)<60&&Math.random()<0.1)}}else dir(1,0);pb(2,1);pb(0,Math.random()<0.3)},30)},st);
let t0=Date.now(),info;while(Date.now()-t0<150000){info=await p.evaluate(()=>({parts:FF.Run.sp&&FF.Run.sp.parts.map(q=>[q.sub,Math.round(q.x),Math.round(q.y),Math.round(q.hp),q.gone?1:0]),sc:FF.Game.scene,cx:Math.round(FF.Run.cx),L:FF.Run.L,lock:_lock,en:FF.Run.en.length,endT:FF.Run.endT,rl:FF.Run.lock,done:FF.Run.done,pz:FF.E.paused,hs:FX.hitstop,al:FF.Run.pl.map(q=>[q.alive,q.dead,Math.round(q.x)])}));if(info.sc!='run'&&info.sc!='continue')break;if(process.env.V)console.log(JSON.stringify(info));if(Date.now()-t0>20000&&!res['mid'+st]){res['mid'+st]=1;await shot('u_run'+st+'_mid.png')}await W8(1000)}
await p.evaluate(()=>{clearInterval(_iv);FF.E.dbg.fast=0;dir(0,0);pb(2,0);pb(0,0)});res['run'+st]=info;}
// ---- DUEL ----
await p.evaluate(()=>{FF.Game.newRun(false,['raze'],1);FF.Game.boss='hask';FF.Game.startDuel()});
for(let i=0;i<40;i++){if(await p.evaluate(()=>FF.Duel.state=='fight'))break;await W8(200)}
const seq=async(dirs,btn)=>{for(const [x,y] of dirs){await p.evaluate((x,y)=>dir(x,y),x,y);await W8(70)}await p.evaluate(b=>pb(b,1),btn);await W8(70);await p.evaluate(b=>{pb(b,0);dir(0,0)},btn);await W8(400)};
const frz=()=>p.evaluate(()=>{FF.Duel.boss.freeze=999;FF.Duel.lastSpecial=null});
await frz();await seq([[0,1],[1,1],[1,0]],3);res.qcf=await p.evaluate(()=>FF.Duel.lastSpecial&&FF.Duel.lastSpecial.fn);
for(let k=0;k<3&&!res.dp;k++){await W8(900);await frz();await seq([[1,0],[0,1],[1,1],[1,0]],3);res.dp=await p.evaluate(()=>FF.Duel.lastSpecial&&FF.Duel.lastSpecial.fn);res.dpTries=k+1}
await shot('u_duel_special.png');
await p.evaluate(()=>pb(2,1));await W8(80);await p.evaluate(()=>pb(2,0));await p.evaluate(()=>pb(1,1));await W8(80);await p.evaluate(()=>pb(1,0));
await W8(800);await p.evaluate(()=>{const D=FF.Duel;D.state='endit';D.endIt=300;D.boss.dizzy=300;D.boss.hp=0});await W8(300);
for(let k=0;k<3&&!res.fatal;k++){await p.evaluate(()=>{const D=FF.Duel;D.state='endit';D.endIt=300;D.p.freeze=0});await W8(300);const fc=await p.evaluate(()=>FF.Duel.p.face);await seq([[fc,0],[0,0],[fc,0],[0,1]],3);res.fatal=await p.evaluate(()=>!!FF.Duel.finisher);res.fTries=k+1}await W8(1500);await shot('u_fatal.png');
// ---- audio pause ----
await p.evaluate(()=>FF.AU.unlock());await W8(300);
res.aud=await p.evaluate(async()=>{const a=FF.AU.ctx&&FF.AU.ctx.state;dispatchEvent(new Event('blur'));await new Promise(r=>setTimeout(r,300));return [a,FF.AU.ctx&&FF.AU.ctx.state,FF.E.paused]});
console.log(JSON.stringify(res));console.log(e.join('\n')||'noerr');await b.close();process.exit(0)})();
