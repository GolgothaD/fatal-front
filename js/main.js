'use strict';
// ===== screens & flow =====
const ROSTER=['raze','brick','nova','kazan'];
const BIO={raze:['COMMANDO','RIFLE  ·  RISING TALON','FRAG TOSS'],brick:['HEAVY','SCATTERGUN  ·  QUAKE','BULL RUSH'],nova:['INFILTRATOR','TWIN SMG  ·  GHOST STEP','KNIFE FAN'],kazan:['MONK','EMBER CANNON  ·  INFERNO','DRAGON PALM']};
const MOVELIST={raze:['↓→ + Y  FRAG TOSS','→↓→ + Y  RISING TALON'],brick:['↓↓ + Y  QUAKE STOMP','←→ + Y  BULL RUSH'],nova:['↓→ + Y  KNIFE FAN','↓← + Y  GHOST STEP'],kazan:['↓→ + Y  DRAGON PALM','→↓→ + Y  INFERNO']};
const LADDER=[null,'hask','lockjaw','silk','varga','spec9','dread','khan'];
const Game={scene:'boot',t:0,sel:0,
 go(s,o={}){const g=this;g.scene=s;g.t=0;g.sel=o.sel||0;Object.assign(g,o);FX.list=[];FX.flash=0;FX.shake=0;E.paused=false;g.onTapScene=null},
 // ---- run state ----
 newRun(coop,ids,startStage=1){const g=this;g.coop=coop;g.players=ids.map((id,i)=>({pl:i,id,lives:SV.easy?4:2,score:0,continues:3,out:false}));g.stage=startStage;g.loop=0;g.fatals=0;
  E.padMap=coop&&E.pads<2?[1,0]:[0,1]},
 startStage(){const g=this;if(g.stage>=7){g.toDuel();return}g.go('run');Run.start({stage:g.stage,players:g.players.filter(p=>!p.out),onEnd:r=>g.stageEnd(r)});SV.furthest[g.players[0].id]=Math.max(SV.furthest[g.players[0].id]||0,g.stage);save()},
 stageEnd(r){const g=this;if(r.result=='clear'){setTimeout(()=>g.toDuel(),0)}},
 onPlayerOut(p,revive){const g=this;const others=g.players.filter(q=>q!==p&&!q.out&&q.lives>=0);const anyAlive=Run.pl.some(x=>x.alive&&x.p!==p);
  if(anyAlive){if(p.continues>0){g.coopCont={p,revive,t:600}}else p.out=true;return}
  g.contFor={p,revive,from:'run'};g.go('continue',{cd:10*60})},
 toDuel(){const g=this;const boss=LADDER[Math.min(7,g.stage)];g.go('vs',{boss});AU.stopMusic(0.4);AU.vo('boss')},
 startDuel(){const g=this;g.go('duel');Duel.start({stage:Math.min(7,g.stage),boss:g.boss,players:g.players.filter(p=>!p.out).map(p=>({pl:p.pl,id:p.id})),loop:g.loop,onEnd:r=>g.duelEnd(r)})},
 duelEnd(r){const g=this;if(r.result=='win'){if(r.fatal)g.fatals++;g.players.forEach(p=>{if(!p.out)p.score+=r.fatal?30000:15000});
   const id=g.players[0].id;SV.wins[id]=SV.wins[id]||0;SV.stageUnlocked=Math.max(SV.stageUnlocked,Math.min(6,g.stage+1));SV.best=Math.max(SV.best,...g.players.map(p=>p.score));
   if(g.stage>=7){SV.wins[id]++;save();g.go('ending');AU.playMusic('title');return}save();g.stage++;g.go('ladder',{next:1});return}
  const p=g.players.find(q=>q.pl==r.loserPl)||g.players[0];p.lives--;if(p.lives>=0){g.go('vs',{boss:g.boss,retry:1});return}
  g.contFor={p,revive:()=>{p.lives=SV.easy?3:2},from:'duel'};g.go('continue',{cd:600})},
 // ---- per-frame ----
 update(){const g=this;g.t++;const S=g.scene;if(!SV.shake)FX.shake=0;
  if((S=='run'||S=='duel')){if(pressed('start')&&!g.pauseLock){E.paused=!E.paused;E.autoPaused=false;E.pauseSel=0;AU.sfx('ui');if(E.paused)AU.suspendMusic?.();}
   if(E.paused){g.pauseUpd();return}}
  g.pauseLock=false;
  const f=g['u_'+S];f&&f.call(g)},
 draw(){const g=this,S=g.scene,ctx=G;const f=g['d_'+S];f&&f.call(g,ctx);if(E.paused&&(S=='run'||S=='duel'))g.pauseDraw(ctx);if(g.coopCont&&S=='run')g.coopContDraw(ctx)},
 // ---- boot ----
 u_boot(){if(Game.loaded&&(pressed('start')||pressed('a')||pressed('x')||Game.tapped)){Game.tapped=0;AU.unlock();AU.sfx('coin');Game.go('title')}},
 d_boot(g){g.fillStyle='#000';g.fillRect(0,0,VW,VH);if(IMG.title){g.globalAlpha=0.35;g.drawImage(IMG.title,0,0);g.globalAlpha=1}
  big(g,'FATAL FRONT',160,70,4,{c1:'#ffe060',c2:'#e02010'});
  if(!this.loaded){const p=this.loadP||0;g.fillStyle='#333';g.fillRect(80,150,160,6);g.fillStyle='#e04020';g.fillRect(81,151,158*p,4);txt(g,'LOADING',160,162,'#aaa',{a:'c'})}
  else if((this.t>>5)%2==0)txt(g,E.touch?'TAP TO START':'PRESS START',160,156,'#fff',{a:'c'});
  txt(g,'© 1995 STYLE  ·  ORIGINAL GAME',160,222,'#777',{a:'c'})},
 // ---- title / menu ----
 MENU:['ARCADE','CO-OP','STAGE SELECT','HOW TO PLAY','OPTIONS','CREDITS'],
 u_title(){const g=this;if(g.t==1){AU.playMusic('title');if(!g.saidTitle){g.saidTitle=1;AU.vo('title')}}
  const n=g.MENU.length;if(menuDir('u'))g.sel=(g.sel+n-1)%n,AU.sfx('ui');if(menuDir('d'))g.sel=(g.sel+1)%n,AU.sfx('ui');
  if(pressed('a')||pressed('start')||pressed('x'))g.menuPick(g.sel)},
 menuPick(i){const g=this;AU.sfx('uisel');const m=g.MENU[i];if(m=='ARCADE')g.go('select',{coop:false,cur:[0,1],ready:[0,0],st0:1});if(m=='CO-OP')g.go('select',{coop:true,cur:[0,2],ready:[0,0],st0:1});if(m=='STAGE SELECT')g.go('stagesel',{sel:0});if(m=='OPTIONS')g.go('options',{back:'title'});if(m=='CREDITS')g.go('credits');if(m=='HOW TO PLAY')g.go('howto')},
 d_title(g){const T=this;if(IMG.title)g.drawImage(IMG.title,0,0);else{g.fillStyle='#200';g.fillRect(0,0,VW,VH)}
  g.fillStyle='rgba(0,0,0,0.35)';g.fillRect(0,0,VW,VH);const wob=Math.sin(T.t*0.05)*1.5;
  big(g,'FATAL',160,18+wob,5,{c1:'#ffe880',c2:'#e01810'});big(g,'FRONT',160,58-wob,5,{c1:'#ffffff',c2:'#3a80ff',ol:'#000820'});
  const y0=110;g.fillStyle='rgba(0,0,0,0.6)';g.fillRect(96,y0-6,128,T.MENU.length*14+8);
  T.MENU.forEach((m,i)=>{const s=i==T.sel;if(s){g.fillStyle=(T.t>>3)%2?'#e02010':'#a01008';g.fillRect(98,y0-3+i*14,124,12)}txt(g,m,160,y0+i*14,s?'#fff':'#c0c0c0',{a:'c'})});
  txt(g,'BEST '+String(SV.best).padStart(8,'0'),160,206,'#ffd040',{a:'c'});txt(g,E.pads?'PAD READY':'KEYS: ARROWS Z X C V SHIFT',160,218,'#8a8a8a',{a:'c'});
  T.taps(y0,T.MENU.length,i=>{if(T.sel==i)T.menuPick(i);else{T.sel=i;AU.sfx('ui')}})},
 taps(y0,n,fn,x0=96,w=128){this.tapRows={y0:y0-3,n,fn,x0,w,h:14}},
 // ---- how to play ----
 u_howto(){if(pressed('a')||pressed('back')||pressed('start')||this.tapped){this.tapped=0;AU.sfx('ui');this.go('title',{sel:3})}},
 d_howto(g){g.fillStyle='#0a0810';g.fillRect(0,0,VW,VH);big(g,'HOW TO PLAY',160,8,2);const L=[['STAGES','#ffd040'],['MOVE / AIM 8-WAY   STICK OR D-PAD'],['JUMP A   SHOOT X   GRENADE Y'],['HOLD B  LOCK AIM   RB  SWAP GUN'],['DOWN = PRONE   DOWN+A ON LEDGE = DROP'],['PODS DROP  S SPREAD  L LASER  F FLAME  R RAPID'],['BOSS DUELS','#ffd040'],['X PUNCH  B KICK  Y SPECIAL  RB BLOCK'],['↓+X UPPERCUT   ↓+B SWEEP   →+X THROW'],['A JUMP   ↑ BACK = FLIP AWAY'],['WIN 2 ROUNDS. AT "END IT!" INPUT'],['→ → ↓ + Y  FOR THE FATAL STRIKE','#ff6040'],['TOUCH: EASY SPECIALS = Y + DIRECTION','#8ac0ff']];
  L.forEach(([s,c],i)=>txt(g,s,160,38+i*14,c||'#e0e0e0',{a:'c'}));txt(g,'A / TAP: BACK',160,226,'#888',{a:'c'})},
 // ---- stage select ----
 u_stagesel(){const g=this,n=SV.stageUnlocked;if(menuDir('u'))g.sel=(g.sel+n-1)%n,AU.sfx('ui');if(menuDir('d'))g.sel=(g.sel+1)%n,AU.sfx('ui');if(pressed('back')||pressed('b')){g.go('title',{sel:2});return}
  if(pressed('a')||pressed('start')||pressed('x')){AU.sfx('uisel');g.go('select',{coop:false,cur:[0,1],ready:[0,0],st0:g.sel+1})}},
 d_stagesel(g){const T=this;g.fillStyle='#08060c';g.fillRect(0,0,VW,VH);big(g,'STAGE SELECT',160,8,2);
  for(let i=0;i<6;i++){const y=40+i*28,un=i<SV.stageUnlocked,s=i==T.sel;const bg=IMG['bg'+(i+1)];if(bg){g.globalAlpha=un?1:0.25;g.drawImage(bg,0,90,bg.width,60,40,y,120,24);g.globalAlpha=1}
   g.strokeStyle=s?'#ffd040':'#333';g.lineWidth=s?2:1;g.strokeRect(40,y,120,24);txt(g,(i+1)+'  '+(un?STAGES[i+1].name:'LOCKED'),170,y+4,un?(s?'#fff':'#bbb'):'#555');if(un)txt(g,'VS '+SPR.C[LADDER[i+1]].name,170,y+14,'#e06040')}
  txt(g,'CLEAR A STAGE TO UNLOCK THE NEXT',160,214,'#777',{a:'c'});T.taps(40+3,6,i=>{if(i>=SV.stageUnlocked)return;if(T.sel==i){AU.sfx('uisel');T.go('select',{coop:false,cur:[0,1],ready:[0,0],st0:i+1})}else T.sel=i},40,260);T.tapRows.h=28},
 // ---- character select ----
 u_select(){const g=this;if(g.t==1){AU.vo('choose');AU.playMusic('title')}
  const np=g.coop?2:1;
  for(let pl=0;pl<np;pl++){if(g.ready[pl])continue;if(menuDir('l',pl)){g.cur[pl]=(g.cur[pl]+3)%4;AU.sfx('ui')}if(menuDir('r',pl)){g.cur[pl]=(g.cur[pl]+1)%4;AU.sfx('ui')}
   if(menuDir('u',pl)||menuDir('d',pl)){g.cur[pl]=(g.cur[pl]+2)%4;AU.sfx('ui')}
   if(pressed('a',pl)||pressed('x',pl)||(pl==0&&pressed('start',0))){g.ready[pl]=1;AU.sfx('uisel');AU.vo(ROSTER[g.cur[pl]])}}
  if(pressed('back')||pressed('b',0)&&!g.ready[0]){g.go('title');return}
  if(g.coop&&!E.pads&&!g.kbWarn)g.kbWarn=1;
  if(g.ready.slice(0,np).every(x=>x)){g.readyT=(g.readyT||0)+1;if(g.readyT>50){g.readyT=0;const ids=[ROSTER[g.cur[0]]];if(g.coop)ids.push(ROSTER[g.cur[1]]);g.newRun(g.coop,ids,g.st0);g.go('ladder',{next:0})}}},
 d_select(g){const T=this;g.fillStyle='#100406';g.fillRect(0,0,VW,VH);const grd=g.createLinearGradient(0,0,0,VH);grd.addColorStop(0,'#3a0a08');grd.addColorStop(1,'#000');g.fillStyle=grd;g.fillRect(0,0,VW,VH);
  big(g,'CHOOSE YOUR FIGHTER',160,4,2);
  // portraits row
  ROSTER.forEach((id,i)=>{const x=20+i*72,y=26;g.fillStyle='#000';g.fillRect(x,y,64,78);const s=SPR.render(id,ANIM.A.idle.f[Math.floor(T.t/10)%ANIM.A.idle.f.length],0.55,false,'sel'+(Math.floor(T.t/10)%ANIM.A.idle.f.length));g.save();g.beginPath();g.rect(x,y,64,78);g.clip();g.drawImage(s.c,x+32-s.ox,y+112-s.oy);g.restore();
   const c0=T.cur[0]==i,c1=T.coop&&T.cur[1]==i;if(c0||c1){g.strokeStyle=c0&&c1?'#ff40ff':c0?'#40a0ff':'#ff6040';g.lineWidth=2;g.strokeRect(x-1,y-1,66,80);if(c0)txt(g,'1P',x+2,y+2,'#60c0ff');if(c1)txt(g,'2P',x+50,y+2,'#ff8060')}else{g.fillStyle='rgba(0,0,0,0.45)';g.fillRect(x,y,64,78)}txt(g,SPR.C[id].name,x+32,y+82,'#fff',{a:'c'})});
  // big preview(s)
  const show=(pl,x,fl)=>{const id=ROSTER[T.cur[pl]];const A=T.ready[pl]?ANIM.A.win:ANIM.A.idle;const fi=Math.floor(T.t/(T.ready[pl]?8:10))%A.f.length;const s=SPR.render(id,A.f[fi],0.82,fl,(T.ready[pl]?'win':'idle')+fi+'big');g.drawImage(s.c,Math.round(x-s.ox),Math.round(236-s.oy));
   const b=BIO[id];const tx=fl?x-120:x+40;txt(g,SPR.C[id].name,tx,124,pl?'#ff8060':'#60c0ff',{s:2});txt(g,b[0],tx,142,'#ffd040');txt(g,MOVELIST[id][0],tx,156,'#ccc');txt(g,MOVELIST[id][1],tx,166,'#ccc');if(T.ready[pl])txt(g,'READY!',tx,184,(T.t>>3)%2?'#fff':'#ffd040',{s:2})};
  if(T.coop){show(0,60,false);show(1,262,true)}else show(0,90,false);
  if(T.coop&&E.pads<1)txt(g,'2P NEEDS A GAMEPAD',160,226,'#ff8060',{a:'c'});
  T.tapSel=1},
 // ---- ladder ----
 u_ladder(){const g=this;if(g.t>150||(g.t>30&&(pressed('a')||pressed('start')||g.tapped))){g.tapped=0;g.startStage()}},
 d_ladder(g){const T=this;g.fillStyle='#000';g.fillRect(0,0,VW,VH);big(g,T.stage>=7?'FINAL BATTLE':'STAGE '+T.stage,160,8,3);
  for(let i=1;i<=7;i++){const y=200-(i-1)*26,x=160+(i%2?-30:30);const id=LADDER[i];const done=i<T.stage,cur=i==T.stage;g.fillStyle=cur?'#401010':'#141414';g.fillRect(x-60,y,120,22);g.strokeStyle=cur?((T.t>>3)%2?'#ffd040':'#e02010'):'#333';g.strokeRect(x-60,y,120,22);
   const s=SPR.render(id,ANIM.A.idle.f[0],0.2,false,'lad');g.save();g.beginPath();g.rect(x-58,y+1,24,20);g.clip();g.drawImage(s.c,x-46-s.ox,y+52-s.oy);g.restore();txt(g,SPR.C[id].name,x-30,y+4,done?'#666':'#fff');txt(g,i==7?'FORTRESS':STAGES[i].name,x-30,y+13,'#a08060',{s:1});if(done){g.strokeStyle='#e02010';g.lineWidth=2;g.beginPath();g.moveTo(x-58,y+2);g.lineTo(x+58,y+20);g.stroke()}}
  const p=T.players;txt(g,'LIVES '+p.map(q=>q.lives).join('/')+'   CREDITS '+p.map(q=>q.continues).join('/'),160,226,'#ccc',{a:'c'})},
 // ---- VS card ----
 u_vs(){const g=this;if(g.t==1)AU.sfx('stamp');if(g.t>130||(g.t>40&&(pressed('a')||pressed('start')||g.tapped))){g.tapped=0;g.startDuel()}},
 d_vs(g){const T=this;g.fillStyle='#000';g.fillRect(0,0,VW,VH);const k=Math.min(1,T.t/20);const bg=IMG['bg'+Math.min(7,T.stage)];if(bg){g.globalAlpha=0.4;g.drawImage(bg,0,0);g.globalAlpha=1}
  g.fillStyle='#e02010';g.beginPath();g.moveTo(0,90);g.lineTo(320,70);g.lineTo(320,170);g.lineTo(0,190);g.fill();
  const p=T.players.find(q=>!q.out)||T.players[0];const a=SPR.render(p.id,ANIM.A.idle.f[0],0.8,false,'vsL'),b=SPR.render(T.boss,ANIM.A.idle.f[0],0.8*((SPR.C[T.boss].hScale)||1),true,'vsR');
  g.drawImage(a.c,Math.round(-120+k*200-a.ox),236-a.oy);g.drawImage(b.c,Math.round(440-k*200-b.ox),236-b.oy);
  if(T.t>20)big(g,'VS',160,100,6,{c1:'#ffffff',c2:'#ffd040'});txt(g,SPR.C[p.id].name,10,200,'#60c0ff',{s:2});txt(g,SPR.C[T.boss].name,310,200,'#ff6040',{s:2,a:'r'});if(T.retry)txt(g,'REMATCH',160,40,'#fff',{a:'c',s:2})},
 // ---- run / duel ----
 u_run(){Run.update();const c=this.coopCont;if(c){c.t--;if(pressed('start',c.p.pl)&&c.p.continues>0){c.p.continues--;c.p.score=0;this.coopCont=null;c.revive();AU.sfx('coin')}else if(c.t<=0){c.p.out=true;this.coopCont=null}}},
 d_run(g){Run.draw(g)},
 coopContDraw(g){const c=this.coopCont;txt(g,(c.p.pl?'2P':'1P')+' CONTINUE? '+Math.ceil(c.t/60)+'  PRESS START',160,30,'#ffd040',{a:'c'})},
 u_duel(){Duel.update()},d_duel(g){Duel.draw(g)},
 hudExtra(g){},
 // ---- continue ----
 u_continue(){const g=this;if(g.t==1){AU.stopMusic(0.5);AU.vo('continue')}if(g.t%60==0&&g.cd>0)AU.sfx('ui',{rate:0.8});g.cd--;const c=g.contFor;
  if((pressed('start')||pressed('a')||g.tapped)&&c.p.continues>0){g.tapped=0;c.p.continues--;c.p.score=0;AU.sfx('coin');c.revive();if(c.from=='run'){g.go('run');Run.done=0;Run.over=0;Run.pl.forEach(x=>{if(x.p===c.p){x.alive=true}});c.p.lives=SV.easy?3:2;Run.respawn2(Run.pl.find(x=>x.p===c.p));AU.playMusic(Run.S.mus)}else g.go('vs',{boss:g.boss,retry:1});return}
  if(g.cd<=0||c.p.continues<=0&&g.t>90){g.go('gameover')}},
 d_continue(g){const T=this;g.fillStyle='#000';g.fillRect(0,0,VW,VH);const id=T.contFor.p.id;const s=SPR.render(id,ANIM.A.dizzy?ANIM.A.dizzy.f[Math.floor(T.t/10)%ANIM.A.dizzy.f.length]:ANIM.A.idle.f[0],0.7,false,'cont'+(Math.floor(T.t/10)%4));g.drawImage(s.c,100-s.ox,230-s.oy);
  big(g,'CONTINUE?',200,40,3);big(g,String(Math.max(0,Math.ceil(T.cd/60))),200,90,8,{c1:'#ffffff',c2:'#e02010'});txt(g,'CREDITS LEFT '+T.contFor.p.continues,200,170,'#ccc',{a:'c'});txt(g,E.touch?'TAP TO CONTINUE':'PRESS START',200,184,(T.t>>4)%2?'#fff':'#ffd040',{a:'c'})},
 // ---- game over / ending ----
 u_gameover(){const g=this;if(g.t==1){AU.vo('gameover');AU.playMusic('title');SV.best=Math.max(SV.best,...g.players.map(p=>p.score));save()}if(g.t>120&&(pressed('a')||pressed('start')||g.tapped)){g.tapped=0;g.go('title')}},
 d_gameover(g){g.fillStyle='#000';g.fillRect(0,0,VW,VH);big(g,'GAME OVER',160,80,5,{c1:'#ffffff',c2:'#900000'});txt(g,'SCORE '+this.players.map(p=>p.score).join(' / '),160,140,'#ffd040',{a:'c'});txt(g,'BEST '+SV.best,160,154,'#aaa',{a:'c'})},
 u_ending(){const g=this;if(g.t==30)AU.vo('victory');if(g.t>400&&(pressed('a')||pressed('start')||g.tapped)){g.tapped=0;g.go('credits')}},
 d_ending(g){const T=this;const bg=IMG.bg7;if(bg)g.drawImage(bg,-Math.min(bg.width-320,T.t*0.2),0);g.fillStyle='rgba(0,0,0,0.5)';g.fillRect(0,0,VW,VH);const id=T.players[0].id;const A=ANIM.A.win;const fi=Math.floor(T.t/8)%A.f.length;const s=SPR.render(id,A.f[fi],0.8,false,'win'+fi+'big');g.drawImage(s.c,90-s.ox,236-s.oy);
  if(T.coop&&T.players[1]){const s2=SPR.render(T.players[1].id,A.f[fi],0.8,true,'win'+fi+'bigf');g.drawImage(s2.c,230-s2.ox,236-s2.oy)}
  big(g,'VICTORY',160,14,4);const L=['IRON KHAN HAS FALLEN.','THE FRONT IS QUIET... FOR NOW.','',`FATAL STRIKES: ${T.fatals}`,'SCORE '+T.players.map(p=>p.score).join(' / ')];L.forEach((s,i)=>{if(T.t>60+i*40)txt(g,s,200,70+i*12,'#fff',{a:'c'})})},
 u_credits(){if(this.t>30&&(pressed('a')||pressed('start')||pressed('back')||this.tapped)){this.tapped=0;this.go('title',{sel:5})}},
 d_credits(g){g.fillStyle='#050505';g.fillRect(0,0,VW,VH);big(g,'CREDITS',160,8,3);const L=[['FATAL FRONT','#ffd040'],['AN ORIGINAL GAME BY GOLGOTHAD'],[''],['MUSIC','#ffd040'],['KEVIN MACLEOD (INCOMPETECH.COM)'],['LICENSED UNDER CC BY 4.0'],[''],['ANNOUNCER','#ffd040'],['PIPER TTS VOICE'],[''],['ART, CODE, SFX','#ffd040'],['PROCEDURAL + GENERATED ART'],[''],['NO AFFILIATION WITH ANY 90S','#888'],['ARCADE PUBLISHER. JUST LOVE.','#888']];L.forEach(([s,c],i)=>txt(g,s,160,40+i*12,c||'#ddd',{a:'c'}))},
 // ---- options ----
 OPTS:['MUSIC','SFX','VOICE','BLOOD','CRT','DIFFICULTY','EASY SPECIALS','SCREEN SHAKE','BACK'],
 optVal(k){switch(k){case'MUSIC':return SV.music;case'SFX':return SV.sfx;case'VOICE':return SV.voice;case'BLOOD':return SV.blood?'ON':'OFF';case'CRT':return['OFF','SOFT','STRONG'][SV.crt];case'DIFFICULTY':return SV.easy?'EASY':'NORMAL';case'EASY SPECIALS':return String(SV.easySpecials).toUpperCase();case'SCREEN SHAKE':return SV.shake?'ON':'OFF';default:return''}},
 optAdj(k,d){const v=x=>Math.round(clamp(x+d*0.05,0,1)*100)/100;switch(k){case'MUSIC':SV.music=v(SV.music);break;case'SFX':SV.sfx=v(SV.sfx);AU.sfx('punch1');break;case'VOICE':SV.voice=v(SV.voice);AU.vo('fight');break;case'BLOOD':SV.blood=!SV.blood;break;case'CRT':SV.crt=(SV.crt+(d>0?1:2))%3;layout();break;case'DIFFICULTY':SV.easy=!SV.easy;break;case'EASY SPECIALS':{const L=['touch','on','off'];SV.easySpecials=L[(L.indexOf(SV.easySpecials)+(d>0?1:2))%3];break}case'SCREEN SHAKE':SV.shake=!SV.shake;break}AU.applyVol();save()},
 optsUpd(onBack){const g=this,n=g.OPTS.length;if(menuDir('u'))g.osel=((g.osel||0)+n-1)%n,AU.sfx('ui');if(menuDir('d'))g.osel=((g.osel||0)+1)%n,AU.sfx('ui');const k=g.OPTS[g.osel||0];
  if(menuDir('l'))g.optAdj(k,-1);if(menuDir('r'))g.optAdj(k,1);if(pressed('a')||pressed('x')){if(k=='BACK'){AU.sfx('uisel');onBack()}else if(!/MUSIC|SFX|VOICE/.test(k))g.optAdj(k,1)}if(pressed('back')||pressed('b')){AU.sfx('ui');onBack()}},
 optsDraw(g,y0){const T=this;T.OPTS.forEach((k,i)=>{const y=y0+i*15,s=i==(T.osel||0);if(s){g.fillStyle='#401010';g.fillRect(40,y-3,240,13)}txt(g,k,48,y,s?'#fff':'#bbb');const v=T.optVal(k);
   if(typeof v=='number'){g.fillStyle='#222';g.fillRect(170,y,90,7);g.fillStyle=s?'#ffd040':'#a08030';g.fillRect(171,y+1,Math.round(88*v),5);txt(g,String(Math.round(v*100)),266,y,'#fff')}else txt(g,v,170,y,s?'#ffd040':'#999')});
  txt(g,'←→ ADJUST   A SELECT   B BACK',160,y0+T.OPTS.length*15+6,'#777',{a:'c'});
  T.optTap={y0,n:T.OPTS.length}},
 u_options(){this.optsUpd(()=>this.go(this.back||'title',{sel:4}))},
 d_options(g){g.fillStyle='#0a0608';g.fillRect(0,0,VW,VH);big(g,'OPTIONS',160,8,3);this.optsDraw(g,44)},
 // ---- pause ----
 PAUSE:['RESUME','OPTIONS','MOVE LIST','QUIT'],
 pauseUpd(){const g=this;if(g.pmode=='opts'){g.optsUpd(()=>{g.pmode=null});return}if(g.pmode=='moves'){if(pressed('a')||pressed('b')||pressed('back')||g.tapped){g.tapped=0;g.pmode=null}return}
  const n=g.PAUSE.length;if(menuDir('u'))E.pauseSel=(E.pauseSel+n-1)%n,AU.sfx('ui');if(menuDir('d'))E.pauseSel=(E.pauseSel+1)%n,AU.sfx('ui');
  if(pressed('b')||pressed('back')){E.paused=false;AU.resume();return}
  if(pressed('a')||pressed('x'))g.pausePick(E.pauseSel)},
 pausePick(i){const g=this,m=g.PAUSE[i];AU.sfx('uisel');if(m=='RESUME'){E.paused=false;E.autoPaused=false;AU.resume()}if(m=='OPTIONS'){g.pmode='opts';g.osel=0}if(m=='MOVE LIST')g.pmode='moves';if(m=='QUIT'){E.paused=false;AU.resume();AU.stopMusic(0.3);g.go('title')}},
 pauseDraw(g){const T=this;g.fillStyle='rgba(0,0,0,0.72)';g.fillRect(0,0,VW,VH);
  if(T.pmode=='opts'){big(g,'OPTIONS',160,8,3);T.optsDraw(g,44);return}
  if(T.pmode=='moves'){big(g,'MOVE LIST',160,10,3);const ids=T.players.filter(p=>!p.out).map(p=>p.id);ids.forEach((id,j)=>{const y=50+j*70;txt(g,SPR.C[id].name,160,y,'#ffd040',{a:'c',s:2});MOVELIST[id].forEach((s,i)=>txt(g,s,160,y+20+i*11,'#fff',{a:'c'}))});txt(g,'↓+X UPPERCUT   ↓+B SWEEP   →→↓+Y FATAL',160,200,'#aaa',{a:'c'});return}
  big(g,'PAUSED',160,50,4);T.PAUSE.forEach((m,i)=>{const s=i==E.pauseSel;if(s){g.fillStyle='#a01008';g.fillRect(110,104+i*16,100,13)}txt(g,m,160,107+i*16,s?'#fff':'#aaa',{a:'c'})});
  if(E.autoPaused)txt(g,'AUTO-PAUSED',160,180,'#888',{a:'c'})},
};
// ---- taps on the game canvas ----
E.onTap=e=>{const r=view.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*VW,y=(e.clientY-r.top)/r.height*VH;const g=Game,S=g.scene;
 if(E.paused&&(S=='run'||S=='duel')){if(g.pmode=='opts'||g.scene=='options'){}else if(g.pmode=='moves'){g.pmode=null;return}else{const i=Math.floor((y-104)/16);if(i>=0&&i<g.PAUSE.length&&x>100&&x<220){E.pauseSel=i;g.pausePick(i)}return}}
 if((S=='options'||g.pmode=='opts')&&g.optTap){const i=Math.floor((y-g.optTap.y0+3)/15);if(i>=0&&i<g.OPTS.length){g.osel=i;const k=g.OPTS[i];if(k=='BACK'){if(g.pmode)g.pmode=null;else g.go(g.back||'title',{sel:4});return}if(/MUSIC|SFX|VOICE/.test(k)){const v=clamp((x-171)/88,0,1);SV[k.toLowerCase()]=Math.round(v*20)/20;AU.applyVol();save()}else g.optAdj(k,1)}return}
 if(S=='select'){const i=Math.floor((x-20)/72);if(y>20&&y<112&&i>=0&&i<4){if(g.cur[0]==i&&!g.ready[0]){g.ready[0]=1;AU.sfx('uisel');AU.vo(ROSTER[i])}else if(!g.ready[0]){g.cur[0]=i;AU.sfx('ui')}}else if(!g.ready[0]){g.ready[0]=1;AU.sfx('uisel');AU.vo(ROSTER[g.cur[0]])}return}
 if(g.tapRows&&(S=='title'||S=='stagesel')){const t=g.tapRows;const i=Math.floor((y-t.y0)/t.h);if(x>=t.x0&&x<=t.x0+t.w&&i>=0&&i<t.n)t.fn(i);return}
 g.tapped=1};
E.canPause=()=>Game.scene=='run'||Game.scene=='duel';
// ---- boot ----
(async function boot(){view=document.getElementById('view');layout();setupTouch();addEventListener('resize',layout);if(screen.orientation)screen.orientation.addEventListener?.('change',()=>setTimeout(layout,50));
 if(window.visualViewport)visualViewport.addEventListener('resize',layout);
 let last=performance.now(),acc=0;const step=1000/60;
 function frame(now){acc+=Math.min(100,now-last);last=now;let n=0;while(acc>=step&&n<4){pollInput();if(E.dbg.fast){for(let i=0;i<E.dbg.fast;i++)Game.update()}else Game.update();acc-=step;n++;E.frame++}if(n)Game.draw(),present();requestAnimationFrame(frame)}
 requestAnimationFrame(frame);
 const imgs=[['title','art/title.png'],...[1,2,3,4,5,6,7].map(i=>['bg'+i,'art/bg'+i+'.png'])];
 const auds=[...SFX_LIST.map(n=>['s_'+n,'audio/sfx/'+n+'.ogg']),...VO_LIST.map(n=>['v_'+n,'audio/vo/'+n+'.ogg']),...MUS_LIST.map(n=>['m_'+n,'audio/music/'+n+'.ogg'])];
 let done=0;const tot=imgs.length+1;await Promise.all(imgs.map(([n,u])=>loadImg(n,u).then(()=>{done++;Game.loadP=done/tot})));
 AU.init();await AU.load(auds,p=>{Game.loadP=(imgs.length+p)/tot});Game.loaded=true;
 if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
 // test hook
 window.FF={Game,Run,Duel,SV,E,IN,AU};})();
