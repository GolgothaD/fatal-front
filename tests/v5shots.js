// v5: fight touch layouts on phones/Fold, editor toggle, combo HUD, gamepad LB/RB
const {launch,serve,W8,watch}=require('./lib');const O='/workspace/qa/fatalfront/v5/';
(async()=>{const port=serve(),b=await launch(),R={};const e=[];
for(const [n,w,h,m] of [['iphone_land',844,390,1],['cover_portrait',412,915,1],['cover_landscape',915,412,1],['inner',820,910,1],['pc',1280,800,0]]){
 const p=await b.newPage();watch(p,e);await p.setViewport({width:w,height:h,isMobile:!!m,hasTouch:!!m,deviceScaleFactor:m?2:1});
 await p.goto(`http://localhost:${port}/index.html`);await p.evaluate(()=>localStorage.clear());await p.reload();
 for(let i=0;i<40;i++){if(await p.evaluate(()=>window.FF&&FF.Game.loaded))break;await W8(250)}
 await p.evaluate(()=>{FF.Game.newRun(false,['raze'],1);FF.Game.boss='hask';FF.Game.startDuel()});
 for(let i=0;i<80;i++){if(await p.evaluate(()=>FF.Duel.state=='fight'&&!FF.Duel.warm.length))break;await W8(200)}
 const geo=()=>p.evaluate(()=>{const o={};for(const el of document.querySelectorAll('#touch [data-k], #touch .tc-stick')){const r=el.getBoundingClientRect();const k=el.dataset.k||'stick';if(r.width&&getComputedStyle(el).display!='none')o[k]=[r.x,r.y,r.width,r.height].map(Math.round)}return o});
 const chk=g=>{const k=Object.keys(g).filter(k=>k!='stick'&&k!='start'&&k!='back');let ov=[];for(let i=0;i<k.length;i++)for(let j=i+1;j<k.length;j++){const a=g[k[i]],c=g[k[j]];if(a[0]<c[0]+c[2]&&c[0]<a[0]+a[2]&&a[1]<c[1]+c[3]&&c[1]<a[1]+a[3])ov.push(k[i]+'/'+k[j])}const off=Object.entries(g).filter(([k,r])=>r[0]<0||r[1]<0||r[0]+r[2]>w||r[1]+r[3]>h).map(x=>x[0]);return{keys:Object.keys(g).join(' '),ov,off}};
 const r={};await W8(1500);
 // a real hit moment: freeze and play a combo so the counter shows
 await p.evaluate(()=>{FF.E.editing=true;const PAD={connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};FF.E.fakePads=[PAD];const D=FF.Duel,P=D.p,B=D.boss;P.x=D.cam+150;B.x=D.cam+180;B.ai.plan='hold';B.ai.wait=99;
  const st=(k,n)=>{for(let i=0;i<n;i++){PAD.buttons[2].pressed=i==0&&k;pollInput();FF.Game.update()}};st(1,7);st(1,7);st(1,6);st(0,1);FF.E.fakePads=[];FF.E.editing=false});
 await p.screenshot({path:O+n+'_fight.png'});
 if(m){r.fight=chk(await geo());
  await p.evaluate(()=>TC.edit(true));await W8(300);r.editFight=chk(await geo());await p.screenshot({path:O+n+'_editor_fights.png'});
  await p.click('#tc-lrun');await W8(300);r.editStages=chk(await geo());await p.screenshot({path:O+n+'_editor_stages.png'});
  await p.click('#tc-lduel');await W8(200);await p.evaluate(()=>TC.edit(false));await W8(200);r.after=chk(await geo())}
 else{ // gamepad: LB+forward dash, LB+back backdash, RB hold = block
  r.pad=await p.evaluate(()=>{FF.E.editing=true;const PAD={connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};FF.E.fakePads=[PAD];const D=FF.Duel,P=D.p,B=D.boss;const st=n=>{for(let i=0;i<n;i++){pollInput();FF.Game.update()}};
   const f=()=>P.x<B.x?1:-1;P.x=D.cam+80;B.x=D.cam+260;B.ai.plan='hold';B.ai.wait=999;st(30);
   PAD.axes[0]=f();PAD.buttons[4].pressed=true;st(1);const d1=P.dash&&P.dash.dir;PAD.buttons[4].pressed=false;PAD.axes[0]=0;st(30);
   PAD.axes[0]=-f();PAD.buttons[4].pressed=true;st(1);const d2=P.dash&&P.dash.dir;PAD.buttons[4].pressed=false;PAD.axes[0]=0;st(30);
   PAD.buttons[5].pressed=true;st(3);const blk=!!(P.blocking||P.anim=='block'||P.guard);PAD.buttons[5].pressed=false;st(3);FF.E.fakePads=[];FF.E.editing=false;return{lbFwd:d1,lbBack:d2,rbBlock:blk,anim:P.anim}})}
 R[n]=r;await p.close()}
console.log(JSON.stringify(R,null,1));console.log(e.length?e:'noerr');await b.close();process.exit(0)})();
