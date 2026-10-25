// node tests/obstacles.js : per stage, count placements, destroy each obstacle type with real shooting, chain explosions, screenshots
const {launch,serve,W8,watch}=require('./lib');(async()=>{const port=serve(),b=await launch(),p=await b.newPage(),e=[],fail=[],out={};watch(p,e);await p.setViewport({width:960,height:720});
await p.goto(`http://localhost:${port}/index.html`);for(let i=0;i<40;i++){if(await p.evaluate(()=>window.FF&&FF.Game.loaded))break;await W8(250)}
await p.evaluate(()=>{window.PAD={connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};FF.E.fakePads=[PAD];window.pb=(i,v)=>{PAD.buttons[i].pressed=!!v;PAD.buttons[i].value=v?1:0}});
for(const st of (process.env.ST?process.env.ST.split(',').map(Number):[1,2,3,4,5,6])){
 const cnt=await p.evaluate(st=>{FF.Game.newRun(false,['raze'],st);FF.Game.startStage();const c={};for(const s of FF.Run.spawns)c[s.type]=(c[s.type]||0)+1;return c},st);out[st]={spawns:cnt};
 if(cnt.turret||cnt.box)fail.push('stage '+st+' still has old turret/box');
 for(const k of (process.env.K?process.env.K.split(','):['bunker','gunpod','mortar','crate','chain'])){
  const r=await p.evaluate((k,st)=>{const R=FF.Run;R.spawns=[];R.en=[];R.eb=[];R.items=[];R.lock=null;const P=R.pl[0];P.inv=99999;P.x=R.cx+60;P.y=R.groundAt(P.x);P.vx=0;P.face=1;P.aim=0;
   const gx=R.cx+170;const gy=R.groundAt(gx);if(gy>900)return{skip:1};
   if(k=='chain'){R.spawn({type:'barrel',x:gx,n:3});R.spawn({type:'bunker',x:gx+50,y:gy})}else R.spawn({type:k,x:gx,y:gy});
   window._tg=R.en.filter(q=>q.k==(k=='chain'?'barrel':k))[0];window._all=R.en.slice();FF.E.dbg.fast=1;pb(2,1);return{n:R.en.length}},k,st);
  if(r.skip){continue}
  let t0=Date.now(),done=null;while(Date.now()-t0<15000){await W8(100);const s=await p.evaluate(()=>{FF.Run.pl[0].inv=9999;FF.Run.pl[0].x=Math.min(FF.Run.pl[0].x,FF.Run.cx+60);return{g:_tg.gone,hp:_tg.hp,left:_all.filter(q=>!q.gone).map(q=>q.k+':'+Math.round(q.hp)),ph:_tg.ph,tel:_tg.tel}});
if(s.g){done=s;break}
   if(st==(k=='mortar'?4:1)&&!out['shot_'+k]&&(s.tel>0||s.ph==1)){out['shot_'+k]=1;await p.screenshot({path:`/workspace/qa/fatalfront/v3/telegraph_${k}_s${st}.png`})}}
  await p.evaluate(()=>pb(2,0));
  if(!done){fail.push(`stage ${st} ${k} not destroyed`);continue}
  if(k=='chain'){await W8(400);const c=await p.evaluate(()=>_all.filter(q=>q.k=='barrel'&&q.gone).length+'/'+_all.filter(q=>q.k=='barrel').length+' bunkerhp '+Math.round(_all.find(q=>q.k=='bunker').hp)+'/'+_all.find(q=>q.k=='bunker').hp0);out[st].chain=c;if(!c.startsWith('3/3'))fail.push('chain '+st+' '+c)}
  else{await W8(150);out[st][k]=Math.round((Date.now()-t0)/100)/10+'s';if(st==2||st==5)await p.screenshot({path:`/workspace/qa/fatalfront/v3/destroy_${k}_s${st}.png`})}
 }
 // gallery shot of all types damaged
 await p.evaluate(()=>{const R=FF.Run;R.en=[];R.eb=[];const P=R.pl[0];P.x=R.cx+40;let x=R.cx+90;for(const k of['crate','barrel','bunker','gunpod','mortar']){const gy=R.groundAt(x);if(gy<900)R.spawn({type:k,x:k=='mortar'?x-140:x,y:gy});x+=k=='mortar'?0:48}R.en.forEach((q,i)=>{if(q.k=='bunker'){q.hp=q.hp0*0.5}if(q.k=='gunpod'){q.ph=2;q.open=1;q.pt=60}});FF.E.dbg.fast=0});
 await W8(900);await p.screenshot({path:`/workspace/qa/fatalfront/v3/gallery_s${st}.png`});
}
console.log(JSON.stringify(out,null,0));console.log(fail.length?'FAIL\n'+fail.join('\n'):'pass');console.log(e.join('\n')||'noerr');await b.close();process.exit(0)})();
