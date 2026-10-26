// v5 duel mechanics: frame-stepped, deterministic checks
const {launch,serve,W8,watch}=require('./lib');(async()=>{const port=serve(),b=await launch(),p=await b.newPage();const e=[];watch(p,e);await p.setViewport({width:960,height:720});
await p.goto(`http://localhost:${port}/index.html`);for(let i=0;i<40;i++){if(await p.evaluate(()=>window.FF&&FF.Game.loaded))break;await W8(250)}
await p.evaluate(()=>{window.PAD={connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};FF.E.fakePads=[PAD];
 window.pb=(i,v)=>{PAD.buttons[i].pressed=!!v;PAD.buttons[i].value=v?1:0};window.dir=(x,y)=>{PAD.axes[0]=x;PAD.axes[1]=y};
 window.rel=()=>{for(let i=0;i<17;i++)pb(i,0);dir(0,0)};
 // step n frames; s = {x,y (stick in screen dir, 'f' = toward boss), btn:[...] pressed on first frame only, hold:[...]}
 window.st=(n,s={})=>{const D=FF.Duel;for(let i=0;i<n;i++){const f=D.p.x<D.boss.x?1:-1;let x=s.x==='f'?f:s.x==='b'?-f:(s.x||0);dir(x,s.y||0);for(const k of(s.hold||[]))pb(k,1);for(const k of(s.btn||[]))pb(k,i==0);pollInput();FF.Game.update()}rel();pollInput()};
 window.idleAI=()=>{FF.Duel._ai=FF.Duel._ai||FF.Duel.aiInput;FF.Duel.aiInput=()=>mkPad()};window.realAI=()=>{if(FF.Duel._ai)FF.Duel.aiInput=FF.Duel._ai};
 window.reset=(gap=34)=>{LOG=[];const D=FF.Duel,P=D.p,B=D.boss;for(const f of[P,B]){f.move=null;f.special=null;f.hitstun=f.blockstun=0;f.state=null;f.vx=f.vy=0;f.y=0;f.dash=null;f.jsq=0;f.buf={};f.combo=0;f.jug=0;f.inv=0;f.freeze=0;f.dizzy=0;f.tellT=0;f.aiSpecial=null;f.set('idle')}
  P.hp=P.maxhp;B.hp=B.maxhp;const c=D.cam+160;P.x=c-gap/2;B.x=c+gap/2;P.face=1;B.face=-1;D.timer=60;FX.hitstop=0;D.proj=[]};
 window.LOG=[];window.st0=window.st;window.st=(n,s)=>{const D=FF.Duel;for(let i=0;i<n;i++){const a=D.p.atkId;st0(1,i==0?s:Object.assign({},s,{btn:[]}));if(D.p.atkId!==a)LOG.push(D.p.move?D.p.move.name:D.p.special?D.p.special.fn:'?')}};window.S=()=>{const D=FF.Duel,P=D.p,B=D.boss;return{pm:P.move&&P.move.name,pmt:P.mt,psp:P.special&&P.special.fn,bhp:B.hp,php:P.hp,bs:B.blockstun,hs:B.hitstun,bst:B.state,pbs:P.blockstun,pc:P.combo,pdash:P.dash&&P.dash.dir,px:P.x,bx:B.x,py:P.y,pvx:P.vx,jug:B.jug,ch:D.chud&&D.chud.n}}});
await p.evaluate(()=>{FF.Game.newRun(false,['raze'],1);FF.Game.boss='hask';FF.Game.startDuel()});
for(let i=0;i<60;i++){if(await p.evaluate(()=>FF.Duel.state=='fight'&&!FF.Duel.warm.length))break;await W8(200)}
await p.evaluate(()=>{FF.E.editing=true});await W8(100);

const ev=f=>p.evaluate(f);
// bot: walks in, blocks when boss is attacking, chains jab>cross>upper, sweeps sometimes, anti-airs
await ev(()=>{window.bot=()=>{const D=FF.Duel,P=D.p,B=D.boss,d=Math.abs(B.x-P.x);const bAtk=(B.move&&B.mt<B.move.st+B.move.act)||B.special||(D.proj&&D.proj.length)||B.tellT;
 const bid=B.atkId+'/'+(B.tellT?1:0);if(bAtk&&window._bid!==bid){window._bid=bid;window._bok=Math.random()<0.65}if(bAtk&&d<130&&window._bok)return{x:'b',y:B.move&&B.move.low?1:0};
 if(B.y<-20&&d<70)return{btn:[2],y:1};
 if(d>46)return{x:'f'};
 if(B.blockstun||B.hitstun)return{btn:[Math.random()<.5?2:1],x:Math.random()<.4?'f':0};
 return Math.random()<.25?{btn:[1],y:1}:{btn:[2]}};
window.fight=(mode,max)=>{const D=FF.Duel;let f=0;while(f<max&&D.state!=='done'&&D.state!=='fatal'&&D.state!=='endit'){if(D.state=='fight'&&mode=='bot'&&!(D.p.move||D.p.special)){st0(1,bot())}else st0(1,mode=='bot'&&D.state=='fight'?bot().x?{x:bot().x,y:bot().y}:{}:{});f++}
 return{frames:f,sec:+(f/60).toFixed(1),state:D.state,result:D.result,wins:D.wins.slice(),php:Math.round(D.p.hp),bhp:Math.round(D.boss.hp)}}});
const R={};
R.idle=await ev(()=>fight('idle',60*400));
await p.evaluate(()=>{FF.Game.newRun(false,['raze'],1);FF.Game.boss='hask';FF.E.editing=false;FF.Game.startDuel()});
for(let i=0;i<60;i++){if(await p.evaluate(()=>FF.Duel.state=='fight'&&!FF.Duel.warm.length))break;await W8(200)}
await ev(()=>{FF.E.editing=true});
R.bot=await ev(()=>fight('bot',60*400));
console.log(JSON.stringify(R));console.log(e.length?e:'noerr');await b.close();process.exit(0)})();
