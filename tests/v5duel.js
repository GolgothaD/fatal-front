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
await p.evaluate(()=>{FF.E.editing=true;idleAI()});await W8(100);
const R={};const ev=f=>p.evaluate(f);
// 1. latency: press X from neutral -> move starts the same frame
R.latency=await ev(()=>{reset();st(1,{btn:[2]});return S().pm});
// 2. buffer: whiff jab far away, press X 5 frames before it ends -> next jab comes out right after
R.buffer=await ev(()=>{reset(200);st(1,{btn:[2]});const m=FF.Duel.p.move;const tot=m.st+m.act+m.rec;st(tot-6);st(1,{btn:[2]});let k=0;const t0=FF.Duel.p.atkId;while(FF.Duel.p.atkId===t0&&k<20){st(1);k++}return{framesLate:k,tot}});
R.bufferTooEarly=await ev(()=>{reset(200);st(1,{btn:[2]});st(1);st(1,{btn:[2]});const id=FF.Duel.p.atkId;st(30);return FF.Duel.p.atkId-id});
// 3. chain combo jab > jab > cross > upper (each pressed once, mid-move)
R.combo=await ev(()=>{reset(30);const seq=[[2,0],[2,0],[2,1],[2,0,1]];const out=[];st(1,{btn:[2]});for(const [k,x,d] of seq.slice(1)){st(5);st(1,{btn:[k],x:x||0,y:d?1:0});out.push(S().pm)}st(60);return{moves:LOG,combo:FF.Duel.chud&&FF.Duel.chud.n,dmg:FF.Duel.chud&&FF.Duel.chud.dmg,bhp:S().bhp}});
// 4. special cancel: jab then Y
R.cancel=await ev(()=>{reset(30);st(1,{btn:[2]});st(5);st(1,{btn:[3]});const r={sp:S().psp,cancel:FF.Duel.lastSpecial&&FF.Duel.lastSpecial.cancel};st(80);r.log=LOG;r.combo=FF.Duel.chud&&FF.Duel.chud.n;return r});
// 5. no chain on whiff
R.noWhiffChain=await ev(()=>{reset(200);st(1,{btn:[2]});st(4);st(1,{btn:[1]});return S().pm});
// 6. blocking by holding back: boss cross
R.blockHigh=await ev(()=>{reset(30);FF.Duel.doMove(FF.Duel.boss,'cross');let bs=0;for(let i=0;i<14;i++){st(1,{x:'b'});bs=Math.max(bs,FF.Duel.p.blockstun)}return{blocked:bs>0,php:S().php}});
R.lowHitsStanding=await ev(()=>{reset(30);FF.Duel.doMove(FF.Duel.boss,'sweep');for(let i=0;i<16;i++)st(1,{x:'b'});return{hit:S().php<FF.Duel.p.maxhp}});
R.lowBlockCrouch=await ev(()=>{reset(30);FF.Duel.doMove(FF.Duel.boss,'sweep');let bs=0;for(let i=0;i<16;i++){st(1,{x:'b',y:1});bs=Math.max(bs,FF.Duel.p.blockstun)}return{blocked:bs>0,php:S().php}});
R.rbBlock=await ev(()=>{reset(30);FF.Duel.doMove(FF.Duel.boss,'jab');let bs=0;for(let i=0;i<10;i++){st(1,{hold:[5]});bs=Math.max(bs,FF.Duel.p.blockstun)}return bs>0});
// 7. chip on blocked special
R.chip=await ev(()=>{reset(40);const B=FF.Duel.boss,sp=FF.Duel.bdef.sp;FF.Duel.doSpecial(B,sp[0]);for(let i=0;i<70;i++)st(1,{x:'b'});return{sp:sp[0],php:S().php,max:FF.Duel.p.maxhp}});
// 8. throw
R.throw=await ev(()=>{reset(26);st(1,{x:'f',btn:[2]});const m=S().pm;st(40);return{m,bhp:S().bhp,bst:S().bst}});
// 9. dash: double tap and LB; backdash
R.dashTap=await ev(()=>{reset(150);st(2,{x:'f'});st(3);st(1,{x:'f'});return S().pdash});
R.dashLB=await ev(()=>{reset(150);st(1,{btn:[4]});const a=S().pdash;st(20);reset(150);st(1,{btn:[4],x:'b'});return[a,S().pdash]});
// 10. jumps
R.jumps=await ev(()=>{const out={};for(const [n,x] of[['neutral',0],['fwd','f'],['back','b']]){reset(150);st(1,{btn:[0],x});st(3,{x});out[n]={vx:+S().pvx.toFixed(2),air:S().py<0};let air=0;while(FF.Duel.p.y<0&&air<120){st(1);air++}out[n].frames=air+3}return out});
// 11. juggle limit: keep launching
R.juggle=await ev(()=>{reset(26);const B=FF.Duel.boss;st(1,{btn:[2],y:1});let i=0;while(i<60&&!(B.state=='knock'&&B.y<-5))st(1),i++;st(6,{x:'f'});let mj=0;for(let n=0;n<6;n++){st(1,{btn:[2],y:1});for(let q=0;q<40&&(FF.Duel.p.move);q++)st(1);mj=Math.max(mj,B.jug||0);st(2,{x:'f'})}return{maxJug:mj,hits:FF.Duel.chud&&FF.Duel.chud.n,limitOK:mj<=3,log:LOG.join('>')}});
console.log(JSON.stringify(R,null,1));console.log(e.join('\n')||'noerr');await b.close();process.exit(0)})();
