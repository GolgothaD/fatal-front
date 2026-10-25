const {launch,serve,W8,watch}=require('./lib');(async()=>{const port=serve(),b=await launch(),p=await b.newPage();const e=[];watch(p,e);await p.setViewport({width:960,height:720});
await p.goto(`http://localhost:${port}/index.html`);for(let i=0;i<40;i++){if(await p.evaluate(()=>window.FF&&FF.Game.loaded))break;await W8(250)}
const shot=async n=>{await p.screenshot({path:'/workspace/qa/fatalfront/'+n})};
await shot('u_boot.png');await p.evaluate(()=>{FF.Game.go('title')});await W8(600);await shot('u_title.png');
await p.evaluate(()=>{FF.Game.go('select',{coop:false,cur:[0,1],ready:[0,0],st0:1})});await W8(500);await shot('u_select.png');
await p.evaluate(()=>{FF.Game.newRun(false,['raze'],1);FF.Game.startStage()});await W8(2500);await shot('u_run1.png');
await p.evaluate(()=>{FF.Game.boss='hask';FF.Game.startDuel()});await W8(2500);await shot('u_duel1.png');
console.log(e.join('\n')||'noerr');await b.close();process.exit(0)})();
