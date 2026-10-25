// usage: node tests/shots.js <prefix>  -> before/after comparison shots
const {launch,serve,W8,watch}=require('./lib');const pre=process.argv[2]||'after';(async()=>{const port=serve(),b=await launch();const e=[];
const V=[['cover_portrait',412,915,1],['cover_landscape',915,412,1],['inner',820,910,1],['pc',1920,1080,0]];
for(const [n,w,h,m] of V){const p=await b.newPage();watch(p,e);await p.setViewport({width:w,height:h,isMobile:!!m,hasTouch:!!m,deviceScaleFactor:m?2.6:1});
await p.goto(`http://localhost:${port}/index.html`);for(let i=0;i<40;i++){if(await p.evaluate(()=>window.FF&&FF.Game.loaded))break;await W8(250)}
await p.evaluate(()=>{FF.Game.newRun(false,['raze'],1);FF.Game.startStage();FF.E.dbg.fast=1});await W8(300);
await p.evaluate(()=>{const R=FF.Run;R.cx=300;const P=R.pl[0];P.x=380;});await W8(2200);await p.screenshot({path:`/workspace/qa/fatalfront/v2/${pre}_${n}_run.png`});
await p.evaluate(()=>{FF.Game.boss='lockjaw';FF.Game.startDuel()});await W8(3200);await p.screenshot({path:`/workspace/qa/fatalfront/v2/${pre}_${n}_duel.png`});await p.close()}
console.log(e.join('\n')||'noerr');await b.close();process.exit(0)})();
