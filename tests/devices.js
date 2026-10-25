const {launch,serve,W8,watch}=require('./lib');(async()=>{const port=serve(),b=await launch();const e=[];const out={};
const V=[['fold_cover',412,915,1],['fold_inner',820,910,1],['pc',1920,1080,0]];
for(const [n,w,h,m] of V){const p=await b.newPage();watch(p,e);await p.setViewport({width:w,height:h,isMobile:!!m,hasTouch:!!m,deviceScaleFactor:m?2.6:1});
await p.goto(`http://localhost:${port}/index.html`);for(let i=0;i<40;i++){if(await p.evaluate(()=>window.FF&&FF.Game.loaded))break;await W8(250)}
if(m)await p.evaluate(()=>{const t=document.querySelector('#touch [data-k=a]');if(t){const r=t.getBoundingClientRect(),o={bubbles:true,pointerId:5,clientX:r.x+r.width/2,clientY:r.y+r.height/2,pointerType:'touch'};t.dispatchEvent(new PointerEvent('pointerdown',o));t.dispatchEvent(new PointerEvent('pointerup',o))}});
await p.evaluate(()=>FF.Game.go('title'));await W8(600);await p.screenshot({path:`/workspace/qa/fatalfront/${n}_title.png`});
await p.evaluate(()=>{FF.Game.newRun(false,['nova'],2);FF.Game.startStage()});await W8(2500);await p.screenshot({path:`/workspace/qa/fatalfront/${n}_run.png`});
await p.evaluate(()=>{FF.Game.boss='lockjaw';FF.Game.startDuel()});await W8(3000);await p.screenshot({path:`/workspace/qa/fatalfront/${n}_duel.png`});
out[n]=await p.evaluate(()=>{const c=document.getElementById('view').getBoundingClientRect(),t=document.getElementById('touch');return {canvas:[c.x,c.y,c.width,c.height].map(Math.round),touch:t&&getComputedStyle(t).display}});
if(n=='fold_cover'){await p.setViewport({width:820,height:910,isMobile:true,hasTouch:true,deviceScaleFactor:2.6});await W8(800);out.relayout=await p.evaluate(()=>{const c=document.getElementById('view').getBoundingClientRect();return [c.width,c.height].map(Math.round)});await p.screenshot({path:'/workspace/qa/fatalfront/fold_relayout.png'})}
await p.close()}
console.log(JSON.stringify(out));console.log(e.join('\n')||'noerr');await b.close();process.exit(0)})();
