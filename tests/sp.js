const {launch,serve,W8,watch}=require('./lib');(async()=>{const port=serve(),b=await launch(),p=await b.newPage();const e=[];watch(p,e);await p.setViewport({width:960,height:720});
await p.goto(`http://localhost:${port}/index.html`);for(let i=0;i<40;i++){if(await p.evaluate(()=>window.FF&&FF.Game.loaded))break;await W8(250)}
await p.evaluate(()=>{FF.Game.newRun(false,['raze'],1);FF.Game.startStage();FF.E.dbg.fast=3;window._iv=setInterval(()=>{const R=FF.Run;R.pl.forEach(q=>q.inv=99)},30)});
await p.keyboard.down('KeyX');await p.keyboard.down('ArrowRight');
for(let i=0;i<120;i++){await p.keyboard.down('KeyZ');await W8(250);await p.keyboard.up('KeyZ');await W8(250);const L=await p.evaluate(()=>FF.Run.lock);if(L!==null)break}
await p.evaluate(()=>FF.E.dbg.fast=1);
for(let i=0;i<30;i++){await W8(1500);console.log(await p.evaluate(()=>{const R=FF.Run,P=R.pl[0];return JSON.stringify({paused:FF.E.paused,cx:Math.round(R.cx),lock:R.lock,px:Math.round(P.x),py:Math.round(P.y),parts:R.sp&&R.sp.parts.map(q=>q.sub+':'+Math.round(q.hp)+'@'+Math.round(q.x)+','+Math.round(q.y)),pb:R.pb.slice(0,3).map(b=>Math.round(b.x)+','+Math.round(b.y))})}));if(i==1)await p.screenshot({path:'/workspace/qa/fatalfront/u_sp2.png'})}
console.log(e.join('\n')||'noerr');await b.close();process.exit(0)})();
