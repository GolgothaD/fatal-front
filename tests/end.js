const {launch,serve,W8,watch}=require('./lib');(async()=>{const port=serve(),b=await launch(),p=await b.newPage();const e=[];watch(p,e);
await p.goto(`http://localhost:${port}/index.html`);for(let i=0;i<40;i++){if(await p.evaluate(()=>window.FF&&FF.Game.loaded))break;await W8(250)}
await p.evaluate(()=>{FF.Game.newRun(false,['raze'],1);FF.Game.startStage();const R=FF.Run;R.spawns=[];R.cx=R.L-330;R.pl[0].x=R.cx+200;R.pl[0].y=0});
for(let i=0;i<8;i++){await W8(1000);console.log(await p.evaluate(()=>JSON.stringify({sc:FF.Game.scene,cx:FF.Run.cx,L:FF.Run.L,lock:FF.Run.lock,endT:FF.Run.endT,hs:FX.hitstop,boss:FF.Game.boss,px:FF.Run.pl[0].x})))}
console.log(e.join('\n')||'noerr');await b.close();process.exit(0)})();
