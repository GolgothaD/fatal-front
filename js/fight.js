'use strict';
// ===== Duel (versus-fighter) =====
const FLOOR=214;
const MOVES={
 jab:{anim:'jab',st:4,act:3,rec:9,dmg:40,box:[10,42,-86,-64],kb:1.6,sfx:'swing',hs:'punch0',stun:14},
 cross:{anim:'punch',st:7,act:3,rec:15,dmg:70,box:[10,46,-88,-64],kb:3,sfx:'swingh',hs:'punch1',stun:18},
 upper:{anim:'upper',st:6,act:5,rec:24,dmg:140,box:[0,30,-128,-40],launch:-6.6,kb:2.2,knock:1,sfx:'swingh',hs:'upper',stun:30,big:1},
 kick:{anim:'kick',st:6,act:4,rec:13,dmg:70,box:[12,52,-66,-40],kb:3,sfx:'swing',hs:'kick0',stun:16},
 round:{anim:'round',st:9,act:4,rec:18,dmg:100,box:[8,48,-96,-66],kb:4,knock:1,launch:-2.5,sfx:'swingh',hs:'kick1',stun:26},
 sweep:{anim:'sweep',st:7,act:4,rec:20,dmg:70,box:[8,52,-14,0],low:1,knock:1,kb:1.5,sfx:'swing',hs:'kick0',stun:26,crouch:1},
 lowpunch:{anim:'lowpunch',st:4,act:3,rec:9,dmg:35,box:[10,40,-62,-44],kb:1.2,sfx:'swing',hs:'punch0',stun:12,crouch:1},
 airkick:{anim:'airkick',st:4,act:30,rec:0,dmg:80,box:[6,42,-50,-16],kb:2.5,air:1,over:1,sfx:'swing',hs:'kick1',stun:20},
 airpunch:{anim:'airpunch',st:4,act:30,rec:0,dmg:60,box:[6,38,-66,-36],kb:2,air:1,over:1,sfx:'swing',hs:'punch1',stun:18},
 throw:{anim:'throw',st:3,act:3,rec:22,dmg:120,box:[4,34,-90,-20],throw:1,knock:1,kb:3.5,launch:-4,sfx:'swingh',hs:'punch2',stun:30},
};
// specials: per character [motion, handler]. Motions are numpad tokens relative to facing (6=toward, 4=back, 2=down)
const SPECIALS={
 raze:[{n:'RISING TALON',m:'626',fn:'talon'},{n:'FRAG TOSS',m:'26',fn:'frag'}],
 brick:[{n:'QUAKE SLAM',m:'22',fn:'quake'},{n:'BULL RUSH',m:'46',fn:'rush'}],
 nova:[{n:'GHOST STEP',m:'24',fn:'ghost'},{n:'ARC KNIFE',m:'26',fn:'knife'}],
 kazan:[{n:'INFERNO KICK',m:'626',fn:'inferno'},{n:'DRAGON FIST',m:'26',fn:'dragon'}],
};
const BOSS={
 hask:{st:'MAJOR HASK',sp:['machete','smoke'],agg:0.45,blk:0.25,spc:0.18,aa:0.25,spd:1},
 lockjaw:{st:'LOCKJAW',sp:['chain','hook'],agg:0.5,blk:0.3,spc:0.22,aa:0.3,spd:0.9,hp:1150},
 silk:{st:'SILK',sp:['fans','dive'],agg:0.6,blk:0.38,spc:0.25,aa:0.4,spd:1.2},
 varga:{st:'VARGA',sp:['frost','slide'],agg:0.55,blk:0.45,spc:0.26,aa:0.45,spd:1.05},
 spec9:{st:'SPECIMEN 9',sp:['acid','leap'],agg:0.7,blk:0.4,spc:0.28,aa:0.5,spd:1.15,hp:1150},
 dread:{st:'COLONEL DREAD',sp:['rocket','shock'],agg:0.65,blk:0.55,spc:0.3,aa:0.6,spd:1.1},
 khan:{st:'IRON KHAN',sp:['firewave','cannon','teleport'],agg:0.72,blk:0.6,spc:0.34,aa:0.7,spd:1.1,hp:1300},
};
const PLAYER_AI={raze:{sp:['frag','talon']},brick:{sp:['rush','quake']},nova:{sp:['knife','ghost']},kazan:{sp:['dragon','inferno']}};
function scaleOf(id){return 0.95*(SPR.C[id].hScale||1)}
class Fighter{
 constructor(id,x,face,ctl){this.id=id;this.cs=SPR.C[id];this.name=this.cs.name;this.x=x;this.y=0;this.vx=0;this.vy=0;this.face=face;this.ctl=ctl;// ctl: player index or 'ai'
  this.maxhp=(BOSS[id]&&BOSS[id].hp)||1000;this.hp=this.maxhp;this.trail=this.hp;this.S=scaleOf(id);this.set('idle');this.hist=[];this.hcount=0;this.combo=0;this.freeze=0;this.inv=0;this.phase=1;this.ai={t:0,think:0,plan:null}}
 set(a,keep){if(this.anim===a&&keep)return;this.anim=a;this.at=0}
 get air(){return this.y<0||this.vy<0}
 frame(){const A=ANIM.A[this.anim];if(this.move){const m=this.move,t=this.mt;const n=A.f.length;let i;
   if(m.st!==undefined){const hi=A.hit||Math.min(1,n-1);if(t<m.st)i=Math.min(hi-1,Math.floor(t/m.st*hi));else if(t<m.st+m.act)i=hi;else i=Math.min(n-1,hi+1+Math.floor((t-m.st-m.act)/Math.max(1,m.rec)*(n-hi-1)))}else i=Math.min(n-1,Math.floor(t/60*A.fps));return clamp(i,0,n-1)}
  const i=Math.floor(this.at/60*A.fps);return A.loop?i%A.f.length:Math.min(A.f.length-1,i)}
 sprite(){const fi=this.frame();const P=ANIM.A[this.anim].f[fi];return SPR.render(this.id,this.glowP?Object.assign({},P,{glow:1}):P,this.S,this.face<0,this.anim+fi+(this.glowP?'g':''))}
 hurt(){const S=this.S;if(this.state=='down'||this.state=='knock'&&this.y>=-4)return null;let top=this.crouch?-62:this.air?-80:-94;if(this.anim=='flip'||this.anim=='jump')top=-80;return[this.x-12*S,this.x+12*S,this.y+top*S,this.y]}
}
const Duel={
 start(cfg){// cfg:{stage, boss, players:[{pl,id}], onEnd}
  const D=this;D.cfg=cfg;D.stage=cfg.stage;D.bg=IMG['bg'+cfg.stage];D.W=Math.max(400,D.bg?D.bg.width:427);D.round=0;D.wins=[0,0];D.proj=[];D.fxText=[];D.splats=[];
  D.boss=new Fighter(cfg.boss,D.W/2+60,-1,'ai');D.bdef=BOSS[cfg.boss]||{sp:(PLAYER_AI[cfg.boss]||{sp:[]}).sp,agg:0.5,blk:0.4,spc:0.2,aa:0.4,spd:1};
  D.diff=clamp(0.35+cfg.stage*0.09+(cfg.loop||0)*0.15,0,1.1);if(SV.easy)D.diff*=0.75;
  D.newRound();AU.playMusic(cfg.stage==7?'final':'fight');D.warm=[];[cfg.boss,...cfg.players.map(p=>p.id)].forEach(id=>{for(const a in ANIM.A){if(a.startsWith('aim_')||a.startsWith('run_')||a=='prone'||a=='die')continue;ANIM.A[a].f.forEach((P,i)=>{D.warm.push([id,P,a+i,false],[id,P,a+i,true])})}})},
 activePlayer(){const ps=this.cfg.players.filter(p=>!p.out);return ps.length?ps[this.round%ps.length]:this.cfg.players[0]},
 newRound(){const D=this;D.round++;D.ap=D.activePlayer();const p=D.ap;
  D.p=new Fighter(p.id,D.W/2-60,1,p.pl);D.boss.x=D.W/2+60;D.boss.y=0;D.boss.vx=D.boss.vy=0;D.boss.hp=D.boss.trail=D.boss.maxhp;D.boss.face=-1;D.boss.move=null;D.boss.state=null;D.boss.set('idle');D.boss.freeze=0;D.boss.phase=1;D.boss.dizzy=0;D.boss.glowP=0;D.boss.speedK=1;
  D.cam=D.W/2-160;D.timer=60;D.tick=0;D.state='intro';D.st=0;D.proj=[];D.slowmo=0;D.koBy=null;D.endIt=0;D.finisher=null;D.p.combo=D.boss.combo=0;
  D.say(D.round>=3&&D.wins[0]==1&&D.wins[1]==1?'FINAL ROUND':'ROUND '+D.round,0);setTimeout(()=>{},0)},
 say(s,t,o={}){this.fxText.push(Object.assign({s,t0:t,life:o.life||70,sc:o.sc||4,c1:o.c1,c2:o.c2,y:o.y??86},o))},
 // ---------- input -> intents ----------
 dirTok(f,I){const fw=f.face>0?I.r:I.l,bk=f.face>0?I.l:I.r;const d=I.d,u=I.u;if(d&&fw)return 3;if(d&&bk)return 1;if(u&&fw)return 9;if(u&&bk)return 7;if(d)return 2;if(u)return 8;if(fw)return 6;if(bk)return 4;return 5},
 pushHist(f,tok){const h=f.hist;f.hcount++;if(!h.length||h[h.length-1].d!==tok)h.push({d:tok,t:f.hcount});if(h.length>16)h.shift()},
 matchMotion(f,pat,win){const h=f.hist,now=f.hcount;let j=h.length-1;const tm=(tok,d)=>tok=='2'?(d==1||d==2||d==3):tok=='6'?(d==6||d==3||d==9):tok=='4'?(d==4||d==1||d==7):tok=='5'?d==5:false;
  for(let k=pat.length-1;k>=0;k--){while(j>=0&&!tm(pat[k],h[j].d))j--;if(j<0)return false;if(k==pat.length-1&&now-h[j].t>8&&j==h.length-1&&false)return false;
   while(j-1>=0&&tm(pat[k],h[j-1].d)&&h[j-1].d!==5)j--;if(now-h[j].t>win)return false;j--}return true},
 detectSpecial(f,I,easy){const list=SPECIALS[f.id]||[];for(const s of list){if(this.matchMotion(f,s.m,s.m.length>2?24:16))return s.fn}
  if(easy){const tok=this.dirTok(f,I);if(tok==2||tok==1||tok==3||tok==4)return list[0]&&list[0].fn;return list[1]&&list[1].fn}return null},
 // ---------- moves ----------
 canAct(f){return !f.move&&!f.hitstun&&!f.blockstun&&f.state!='down'&&f.state!='knock'&&f.state!='getup'&&!f.freeze&&!f.dizzy&&!f.special},
 doMove(f,name){const m=MOVES[name];f.move=Object.assign({name},m);f.mt=0;f.hitDone=false;f.set(m.anim);if(m.sfx)setTimeout(()=>{},0);f.sfxAt=m.st-2},
 // ---------- specials ----------
 doSpecial(f,fn){const D=this,o=f===D.p?D.boss:D.p,S=f.S,fx=f.face;f.special={fn,t:0};f.move=null;AU.sfx('sp_charge',{vol:0.7});
  const sp=f.special;const proj=(o2)=>D.proj.push(Object.assign({owner:f,x:f.x+fx*30*S,y:f.y-74*S,vx:fx*3,vy:0,g:0,t:0,dmg:90,life:200,r:6},o2));
  const H={
   frag:()=>{f.set('throw');sp.dur=26;sp.at=8;sp.go=()=>{proj({type:'frag',vx:fx*2.6,vy:-3.6,g:0.16,dmg:110,knock:1,y:f.y-90*S});AU.sfx('grenade')}},
   talon:()=>{f.set('upper');sp.dur=40;sp.inv=8;sp.at=4;sp.go=()=>{f.vy=-7;f.vx=fx*1.8;AU.sfx('upper');f.glowP=1};sp.hit={box:[0,34,-130,-30],dmg:130,launch:-6,knock:1,hs:'upper',from:4,to:22}},
   rush:()=>{f.set('charge');sp.dur=30;sp.at=4;sp.go=()=>{AU.sfx('sp_charge')};sp.tick=(t)=>{if(t>4&&t<26)f.vx=fx*4.6};sp.hit={box:[0,30,-90,-20],dmg:120,knock:1,kb:5,launch:-3,hs:'punch2',from:5,to:26}},
   quake:()=>{f.set('slam');sp.dur=34;sp.at=14;sp.go=()=>{proj({type:'quake',y:f.y,vx:fx*3.2,dmg:100,low:1,knock:1,launch:-4,life:90});FX.shake=6;AU.sfx('bigboom',{vol:0.7});AU.sfx('sp_shock',{vol:0.6})}},
   knife:()=>{f.set('special');sp.dur=24;sp.at=7;sp.go=()=>{proj({type:'knife',vx:fx*5.2,dmg:80,y:f.y-78*S});AU.sfx('sp_shock',{vol:0.6,rate:1.4})}},
   ghost:()=>{f.set('crouch');sp.dur=26;sp.inv=26;sp.at=8;sp.go=()=>{FX.burst(f.x,FLOOR+f.y-40,18,{c:['#c080ff','#6040a0','#fff'],v0:0.3,v1:2,g:-0.02,type:'smoke',s:3,l0:20,l1:35});f.x=clamp(o.x-o.face*40,D.cam+14,D.cam+306);f.face=f.x<o.x?1:-1;AU.sfx('sp_teleport');FX.burst(f.x,FLOOR+f.y-40,14,{c:['#c080ff','#fff'],v0:0.3,v1:2,g:-0.02,type:'smoke',s:3,l0:20,l1:35})}},
   dragon:()=>{f.set('special');f.glowP=1;sp.dur=28;sp.at=9;sp.go=()=>{proj({type:'fire',vx:fx*3.4,dmg:100,r:8,y:f.y-76*S});AU.sfx('sp_fire')}},
   inferno:()=>{f.set('airkick');f.glowP=1;sp.dur=34;sp.at=5;sp.go=()=>{f.vy=-3.2;f.vx=fx*5;AU.sfx('sp_fire')};sp.tick=t=>{if(t>5&&t%2==0)FX.burst(f.x,FLOOR+f.y-30,2,{c:'#ffa020',type:'fire',v0:0.2,v1:0.8,g:-0.05,l0:10,l1:18,s:2})};sp.hit={box:[4,44,-60,-10],dmg:120,knock:1,kb:4,launch:-3,hs:'kick1',from:6,to:30}},
   // ----- bosses -----
   machete:()=>{f.set('punch');sp.dur=30;sp.at=8;sp.go=()=>AU.sfx('swingh');sp.tick=t=>{if(t>8&&t<22)f.vx=fx*4};sp.hit={box:[6,52,-96,-40],dmg:110,kb:4,knock:1,hs:'hitf',from:9,to:22,blood:2}},
   smoke:()=>H.ghost(),
   chain:()=>{f.set('punch');sp.dur=36;sp.at=14;sp.go=()=>AU.sfx('swingh',{rate:0.8});sp.hit={box:[20,120,-84,-60],dmg:100,kb:4,knock:1,hs:'hitm',from:14,to:22,chain:1}},
   hook:()=>{f.set('punch');sp.dur=40;sp.at=12;sp.go=()=>{AU.sfx('swingh',{rate:0.7})};sp.hit={box:[20,130,-84,-56],dmg:60,pull:1,hs:'hitm',from:12,to:20,chain:1,stun:40}},
   fans:()=>{f.set('special');sp.dur=26;sp.at=8;sp.go=()=>{for(const vy of[-0.9,0,0.9])proj({type:'fan',vx:fx*3.6,vy,dmg:50,y:f.y-74*S});AU.sfx('swing',{rate:1.4})}},
   dive:()=>{f.set('jump');sp.dur=60;sp.at=2;sp.go=()=>{f.vy=-6;f.vx=fx*1.2};sp.tick=t=>{if(t==22){f.set('airkick');f.vy=4.5;f.vx=fx*4.2;AU.sfx('swingh')}};sp.hit={box:[4,42,-50,-10],dmg:100,knock:1,kb:3,hs:'kick1',from:22,to:60,over:1}},
   frost:()=>{f.set('special');sp.dur=28;sp.at=10;sp.go=()=>{proj({type:'frost',vx:fx*3.2,dmg:60,freeze:70,y:f.y-74*S});AU.sfx('laser',{rate:0.7})}},
   slide:()=>{f.set('sweep');sp.dur=34;sp.at=4;sp.tick=t=>{if(t>4&&t<26)f.vx=fx*4.8};sp.go=()=>AU.sfx('swing');sp.hit={box:[6,52,-16,0],dmg:90,knock:1,low:1,kb:2,hs:'kick0',from:5,to:26}},
   acid:()=>{f.set('throw');sp.dur=28;sp.at=9;sp.go=()=>{proj({type:'acid',vx:fx*2.8,vy:-2.6,g:0.12,dmg:80,knock:0,y:f.y-80*S});AU.sfx('splat')}},
   leap:()=>{f.set('jump');sp.dur=70;sp.at=4;sp.go=()=>{f.vy=-7.5;f.vx=clamp((o.x-f.x)/58,-4,4);AU.sfx('jump')};sp.land=()=>{FX.shake=7;AU.sfx('bigboom',{vol:0.6});proj({type:'quake',y:0,x:f.x+12,vx:3,dmg:70,low:1,knock:1,launch:-3,life:40});proj({type:'quake',y:0,x:f.x-12,vx:-3,dmg:70,low:1,knock:1,launch:-3,life:40})}},
   rocket:()=>{f.set('special');sp.dur=30;sp.at=10;sp.go=()=>{proj({type:'rocket',vx:fx*4.4,dmg:110,knock:1,y:f.y-78*S});AU.sfx('grenade',{rate:0.8})}},
   shock:()=>{f.set('charge');sp.dur=34;sp.at=4;sp.tick=t=>{if(t>4&&t<20)f.vx=fx*3.6};sp.go=()=>AU.sfx('sp_shock');sp.hit={box:[0,34,-96,-20],dmg:130,kb:2,hs:'sp_shock',from:5,to:20,freeze:40,knock:1}},
   firewave:()=>{f.set('slam');sp.dur=36;sp.at=14;sp.go=()=>{proj({type:'firewave',y:0,vx:fx*3,dmg:110,low:1,knock:1,launch:-4,life:100});AU.sfx('sp_fire');FX.shake=5}},
   cannon:()=>{f.set('special');sp.dur=30;sp.at=10;sp.go=()=>{proj({type:'shell',vx:fx*4.8,dmg:120,knock:1,y:f.y-88*S,r:6});AU.sfx('boom',{vol:0.6});FX.shake=3}},
   teleport:()=>H.ghost(),
   meteor:()=>{f.set('win');sp.dur=50;sp.at=10;sp.go=()=>{AU.sfx('alarm',{vol:0.5});for(let i=0;i<4;i++)D.proj.push({owner:f,type:'meteor',x:o.x+(i-1.5)*34+rnd(-6,6),y:-260-i*40,vx:0,vy:3.2,g:0.05,t:0,dmg:90,knock:1,life:220,r:7})}},
  };(H[fn]||H.knife)();sp.name=fn},
 // ---------- update ----------
 update(){const D=this;D.st++;
  if(D.warm.length){const t0=performance.now();while(D.warm.length&&performance.now()-t0<7){const[id,P,k,fl]=D.warm.shift();SPR.render(id,P,scaleOf(id),fl,k)}}
  if(FX.hitstop>0){FX.hitstop--;FX.update();return}
  if(D.slowmo>0){D.slowmo--;if(D.slowmo%3)return}
  const P=D.p,B=D.boss;
  // intro
  if(D.state=='intro'){if(D.st==2)AU.vo(D.round>=3&&D.wins[0]==1&&D.wins[1]==1?'round3':'round'+Math.min(3,D.round));if(D.st==70){D.say('FIGHT!',D.st,{sc:6,c1:'#ffe060',c2:'#ff2000',life:45});AU.vo('fight')}if(D.st>=95&&!D.warm.length){D.state='fight';D.st=0}}
  const fighting=D.state=='fight';
  if(fighting){D.tick++;if(D.tick%60==0&&D.timer>0){D.timer--;if(D.timer==0)D.timeUp()}}
  // controls
  for(const f of[P,B]){const o=f===P?B:P;const I=f.ctl==='ai'?D.aiInput(f,o,fighting):IN[f.ctl]||mkPad();D.control(f,o,I,fighting||D.state=='endit')}
  for(const f of[P,B])D.physics(f,f===P?B:P);
  // push apart
  const dx=B.x-P.x,min=22*(P.S+B.S)/2;if(Math.abs(dx)<min&&Math.abs(P.y-B.y)<60){const push=(min-Math.abs(dx))/2*sgn(dx||1);P.x-=push;B.x+=push}
  // camera
  const mid=(P.x+B.x)/2;D.cam=clamp(lerp(D.cam,mid-160,0.15),0,D.W-320);for(const f of[P,B])f.x=clamp(f.x,D.cam+12,D.cam+308);
  // attacks
  if(D.state=='fight'||D.state=='endit'){D.resolve(P,B);D.resolve(B,P)}
  D.updProj();FX.update();
  for(const f of[P,B]){if(f.trail>f.hp)f.trail=Math.max(f.hp,f.trail-(D.st%2?6:3))}
  // KO
  if(D.state=='fight'&&(P.hp<=0||B.hp<=0))D.ko(P.hp<=0?P:B);
  if(D.state=='ko'){if(D.st==60){const w=D.koWinner;w.set('win');w.move=null;w.special=null;D.say(w.name+' WINS',D.st,{sc:2,life:120,y:92,c1:'#ffffff',c2:'#c0c0ff'});AU.vo(w===P?'wins':'youlose');if(w===P&&w.hp>=w.maxhp)setTimeout(()=>{D.say('PERFECT',D.st,{sc:3,y:116,life:90,c1:'#a0ffa0',c2:'#20a040'});AU.vo('perfect')},900)}
   if(D.st==170)D.afterRound()}
  if(D.state=='endit'){D.endIt--;if(D.endIt<=0&&!D.finisher){D.state='ko';D.st=59;B.dizzy=0;B.state='knock';B.vy=-3;B.vx=-B.face*-2;B.set('knock')}}
  if(D.state=='fatal'){D.fatalUpd()}
  if(D.state=='done'){D.st>110&&D.finish()}
  if(D.state=='intro'&&D.st==1&&D.round==1){D.say(B.name,0,{sc:2,y:58,life:90,c1:'#fff',c2:'#ff8080'})}
 },
 control(f,o,I,live){const D=this;f.face0=f.face;const tok=D.dirTok(f,I);D.pushHist(f,tok);
  if(f.freeze>0){f.freeze--;return}
  if(D.state=='endit'&&f===D.p&&I._y&&D.matchMotion(f,'662',40)){D.startFatal();return}
  if(!live){if(!f.air&&!f.move&&f.state!='down'&&f.state!='knock'&&f.anim!='win'&&f.anim!='dizzy'&&f.anim!='getup')f.set(f.anim=='idle'?'idle':'idle',1);return}
  if(f.dizzy){f.set('dizzy',1);return}
  // facing
  if(!f.air&&!f.move&&!f.special&&!f.hitstun)f.face=o.x>f.x?1:-1;
  const fw=tok==6||tok==3||tok==9,bk=tok==4||tok==1||tok==7,dn=tok==1||tok==2||tok==3,up=tok>=7;
  // finisher
  if(I._y&&D.canAct(f)&&!f.air){const sp=D.detectSpecial(f,I,f.ctl!=='ai'&&(SV.easySpecials===true||SV.easySpecials==='on'||(SV.easySpecials!=='off'&&E.lastInput=='touch')));if(sp){D.doSpecial(f,sp);D.lastSpecial={who:f.id,fn:sp,t:D.st};return}}
  if(f.ctl==='ai'&&f.aiSpecial&&D.canAct(f)&&!f.air){D.doSpecial(f,f.aiSpecial);f.aiSpecial=null;return}
  if(!D.canAct(f))return f.blocking=f.blocking&&(f.blockstun>0);
  f.blocking=!!I.rb&&!f.air;f.crouch=dn&&!f.air;
  if(f.air){if(I._x&&!f.airAtk){f.airAtk=1;D.doMove(f,'airpunch')}else if(I._b&&!f.airAtk){f.airAtk=1;D.doMove(f,'airkick')}return}
  const dist=Math.abs(o.x-f.x);
  if(I._x){if(dn)return D.doMove(f,'upper');if(fw&&dist<34&&!o.air&&o.state!='down'&&o.state!='knock'&&!o.hitstun)return D.startThrow(f,o);return D.doMove(f,fw?'cross':'jab')}
  if(I._b){if(dn)return D.doMove(f,'sweep');return D.doMove(f,fw?'round':'kick')}
  if(I._a||up&&I._u){f.vy=-5.7*(f.speedK||1)**0.3;f.vx=fw?1.9:bk?-1.9:0;f.vx*=f.face;f.set(f.vx?'flip':'jump');f.airAtk=0;AU.sfx('jump',{vol:0.5});return}
  if(f.blocking){f.set(f.crouch?'cblock':'block',1);f.vx=0;return}
  if(f.crouch){f.set('crouch',1);f.vx=0;return}
  const sp=(f.ctl==='ai'?(D.bdef.spd||1):1)*(f.speedK||1);
  if(fw){f.vx=1.35*sp*f.face;f.set('walk',1)}else if(bk){f.vx=-1.1*sp*f.face;f.set('walkb',1)}else{f.vx=0;f.set('idle',1)}},
 startThrow(f,o){const D=this;D.doMove(f,'throw');f.throwT=o},
 physics(f,o){const D=this;f.at++;
  if(f.inv>0)f.inv--;if(f.hitstun>0){f.hitstun--;if(!f.hitstun&&!f.air&&f.state!='knock'&&f.state!='down')f.set('idle')}if(f.blockstun>0)f.blockstun--;
  if(f.move){const m=f.move;f.mt++;if(f.mt==f.sfxAt&&m.sfx)AU.sfx(m.sfx,{vol:0.55});if(!m.air&&f.mt>=m.st+m.act+m.rec){f.move=null;f.set(m.crouch&&f.crouch?'crouch':'idle')}if(!m.air&&!f.air)f.vx*=0.6}
  if(f.special){const s=f.special;s.t++;if(s.t==s.at&&s.go)s.go();if(s.tick)s.tick(s.t);if(s.t<(s.inv||0))f.inv=2;
   if(s.t>=s.dur&&!f.air){f.special=null;f.glowP=0;f.set('idle');f.vx=0}}
  if(f.state=='knock'){if(!f.air&&f.vy>=0){f.state='down';f.set('down');f.downT=f.hp<=0?9999:34;f.vx=0;AU.sfx('fall',{vol:0.7});FX.burst(f.x,FLOOR,8,{c:['#8a7a6a','#5a4a3a'],v0:0.5,v1:1.6,g:0.05,l0:14,l1:24,type:'smoke',s:2});FX.shake=Math.max(FX.shake,3)}}
  else if(f.state=='down'){f.downT--;if(f.downT<=0){f.state='getup';f.set('getup');f.getT=26;f.inv=26}}
  else if(f.state=='getup'){f.getT--;if(f.getT<=0){f.state=null;f.set('idle')}}
  // gravity
  if(f.air||f.vy<0){f.vy+=0.24;f.y+=f.vy;if(f.y>=0){f.y=0;const wasAir=f.vy>1;f.vy=0;if(f.special&&f.special.land){f.special.land();f.special.land=null}if(f.move&&f.move.air){f.move=null}if(wasAir&&f.state!='knock'){AU.sfx('land',{vol:0.4});if(!f.special&&!f.hitstun)f.set('idle')}if(f.state!='knock'&&!f.special)f.vx=0}}
  f.x+=f.vx;if(!f.air&&!f.special&&f.state!='knock'&&!f.move)f.vx*=0.8;
  if(f.dizzy>0){f.dizzy--}
 },
 boxW(f,b){const S=f.S;const x0=f.x+f.face*b[0]*S,x1=f.x+f.face*b[1]*S;return[Math.min(x0,x1),Math.max(x0,x1),f.y+b[2]*S,f.y+b[3]*S]},
 ov(a,b){return a&&b&&a[0]<b[1]&&a[1]>b[0]&&a[2]<b[3]&&a[3]>b[2]},
 resolve(f,o){const D=this;let hb=null,m=null;
  if(f.move&&!f.hitDone){m=f.move;if(f.mt>=m.st&&f.mt<m.st+m.act)hb=D.boxW(f,m.box)}
  else if(f.special&&f.special.hit&&!f.special.hitDone){const h=f.special.hit,t=f.special.t;if(t>=h.from&&t<=h.to){m=h;hb=D.boxW(f,h.box)}}
  if(!hb)return;const hu=o.hurt();if(!hu||o.inv>0)return;if(!D.ov(hb,hu))return;
  if(f.move)f.hitDone=true;else f.special.hitDone=true;
  if(m.throw){if(o.air||o.state)return;o.face=-f.face;D.applyHit(f,o,Object.assign({},m,{kb:-3.2,launch:-4.5}),false);f.face=-f.face;o.x+=f.face*-0;return}
  // blocking: standing blocks everything but lows; crouching blocks everything but overheads
  const blocked=o.blocking&&!o.air&&((o.crouch&&!m.over)||(!o.crouch&&!m.low));
  D.applyHit(f,o,m,blocked)},
 applyHit(f,o,m,blocked,px,py){const D=this;const isSp=!MOVES[m.name]&&!m.throw;let dmg=m.dmg;if(o.ctl!=='ai'&&SV.easy)dmg*=0.7;if(o.ctl==='ai')dmg*=1;if(f.ctl==='ai')dmg*=0.75+D.diff*0.35;
  const hx=px??(o.x-f.face*6),hy=py??(FLOOR+o.y+((m.box?m.box[2]+m.box[3]:-120)/2)*o.S);
  if(blocked){const chip=isSp?dmg*0.15:0;o.hp=Math.max(o.hp>1?1:0,o.hp-chip);o.blockstun=10;o.vx=f.face*1.6;AU.sfx('block',{vol:0.7});FX.burst(hx,hy,6,{c:['#fff','#a0c0ff'],v0:1,v1:2.5,g:0,l0:6,l1:12});FX.hitstop=3;return}
  o.hp=Math.max(0,o.hp-dmg);o.move=null;o.special=null;o.glowP=0;o.blocking=false;o.dizzy=0;
  f.combo=(o.hitstun>0||o.state=='knock')?f.combo+1:1;if(f.combo>=3)D.say(f.combo+' HIT COMBO',D.st,{sc:1,life:50,y:46,x:f===D.p?56:264,small:1});
  const knock=m.knock||o.hp<=0||o.air;
  if(m.freeze&&o.hp>0){o.freeze=m.freeze;o.frozenT=m.freeze;AU.sfx('laser',{rate:0.5});}
  if(m.pull){o.x=f.x+f.face*30*f.S;o.hitstun=m.stun||30;o.set('hit');}
  else if(knock){o.state='knock';o.vy=m.launch||-3.2;o.vx=f.face*(m.kb||2)*0.8;o.y=Math.min(o.y,-1);o.set('knock');o.hitstun=0}
  else{o.hitstun=m.stun||16;o.vx=f.face*(m.kb||2);o.set(m.low||(m.box&&m.box[2]>-50)?'hitlow':'hit')}
  FX.hitstop=m.big||knock?7:5;FX.shake=Math.max(FX.shake,knock?4:2);AU.sfx(m.hs||'punch1',{vol:0.85});AU.sfx(o.cs.fem?'hitf':'hitm',{vol:0.6,gap:0.12});
  D.blood(hx,hy,f.face,(m.big||knock?14:7)*(m.blood||1));
  FX.burst(hx,hy,5,{c:['#ffffff','#ffe080'],v0:1.5,v1:3,g:0,l0:4,l1:8,s:2})},
 blood(x,y,dir,n){if(!SV.blood){FX.burst(x,y,Math.ceil(n/2),{c:['#ffffff','#ffd060','#ff9020'],v0:1,v1:3,g:0.05,l0:8,l1:16});return}
  FX.burst(x,y,n,{a:dir>0?-0.6:-2.5,spread:1.8,c:['#c00010','#8a0008','#e01818','#600006'],v0:1.2,v1:3.6,g:0.2,l0:60,l1:200,floor:FLOOR+rnd(-3,6),stick:1,s:2});FX.burst(x,y,Math.ceil(n/2),{c:['#a00010','#d01020'],v0:0.3,v1:1.4,g:0.15,l0:30,l1:60,s:1})},
 updProj(){const D=this;for(const p of D.proj){p.t++;p.vy+=p.g||0;p.x+=p.vx;p.y+=p.vy;const o=p.owner===D.p?D.boss:D.p;
  if(p.type=='fire'||p.type=='firewave')FX.burst(p.x,FLOOR+p.y-(p.type=='firewave'?6:0),2,{c:'#ffa020',type:'fire',v0:0.2,v1:0.9,g:-0.06,l0:8,l1:16,s:p.type=='firewave'?3:2});
  if(p.type=='quake'&&p.t%3==0)FX.burst(p.x,FLOOR,3,{c:['#9a8a7a','#6a5a4a'],v0:1,v1:2.6,a:-Math.PI/2,spread:0.8,g:0.15,l0:14,l1:22,s:2});
  if(p.type=='rocket'||p.type=='shell')FX.burst(p.x-p.vx*2,FLOOR+p.y,1,{c:'#8a8a8a',type:'smoke',v0:0,v1:0.3,g:-0.02,l0:16,l1:26,s:2});
  if(p.type=='meteor'){if(p.t%2==0)FX.burst(p.x,FLOOR+p.y,2,{c:'#ff6020',type:'fire',v0:0.2,v1:0.6,g:-0.05,l0:8,l1:14,s:3})}
  // hit
  const hu=o.hurt();const r=p.r||6;const pb=p.type=='quake'||p.type=='firewave'?[p.x-8,p.x+8,-16,0]:[p.x-r,p.x+r,p.y-r,p.y+r];
  if(hu&&o.inv<=0&&D.ov(pb,hu)&&(D.state=='fight'||D.state=='endit')){p.dead=1;const blocked=o.blocking&&!o.air&&((o.crouch)||(!o.crouch&&!p.low));D.applyHit(p.owner,o,Object.assign({name:'proj',box:null},p,{hs:p.type=='fire'||p.type=='firewave'?'sp_fire':p.type=='knife'||p.type=='fan'?'hitf':'boom'}),blocked,p.x,FLOOR+p.y);
   if(p.type=='frag'||p.type=='rocket'||p.type=='shell'||p.type=='meteor')boom(p.x,FLOOR+p.y,1,'smallboom')}
  if((p.type=='frag'||p.type=='acid'||p.type=='meteor')&&p.y>=0){p.dead=1;boom(p.x,FLOOR,p.type=='acid'?0.6:1.1,p.type=='acid'?'splat':'boom');if(p.type!='acid'&&Math.abs(o.x-p.x)<26&&o.y>-30&&o.inv<=0&&!p.hit){D.applyHit(p.owner,o,Object.assign({name:'proj'},p),o.blocking,p.x,FLOOR-10)}}
  if(p.t>p.life||p.x<D.cam-40||p.x>D.cam+360)p.dead=1}
  // projectile clash
  for(const a of D.proj)for(const b of D.proj)if(a!==b&&a.owner!==b.owner&&!a.dead&&!b.dead&&Math.abs(a.x-b.x)<10&&Math.abs(a.y-b.y)<14){a.dead=b.dead=1;boom((a.x+b.x)/2,FLOOR+a.y,0.7,'smallboom')}
  D.proj=D.proj.filter(p=>!p.dead)},
 ko(loser){const D=this;D.state='ko';D.st=0;D.koWinner=loser===D.p?D.boss:D.p;D.slowmo=40;AU.sfx('bigboom',{vol:0.5});FX.flash=6;FX.flashC='#fff';
  const wi=loser===D.p?1:0;D.wins[wi]++;
  // final round won by player -> END IT
  if(wi==0&&D.wins[0]>=2){loser.hp=1;loser.state=null;loser.y=0;loser.vy=0;loser.vx=0;loser.dizzy=99999;loser.set('dizzy');loser.inv=0;D.state='endit';D.endIt=300;D.st=0;D.slowmo=0;D.say('END IT!',0,{sc:5,c1:'#ffffff',c2:'#c00000',life:110});AU.vo('endit');AU.stopMusic(1.5)}
  else if(wi==1&&loser===D.p){}},
 timeUp(){const D=this;const P=D.p,B=D.boss;D.say('TIME',D.st,{sc:4,life:60});if(P.hp/P.maxhp>=B.hp/B.maxhp){B.hp=0}else{P.hp=0}},
 afterRound(){const D=this;if(D.wins[1]>=2){D.result='lose';D.state='done';D.st=0;AU.vo('youlose');return}if(D.wins[0]>=2){D.result='win';D.state='done';D.st=0;return}D.newRound()},
 startFatal(){const D=this;D.finisher={t:0};D.state='fatal';D.st=0;AU.sfx('sp_charge');D.p.set('special');D.p.glowP=1;D.p.move=null;FX.flash=8;FX.flashC='#000'},
 fatalUpd(){const D=this,P=D.p,B=D.boss,F=D.finisher;F.t++;
  if(F.t==30){AU.sfx('sp_fire');P.x=B.x-B.face*-0-P.face*28}
  if(F.t==40){P.set('upper');AU.sfx('upper')}
  if(F.t==48){FX.flash=10;FX.flashC=SV.blood?'#ff2010':'#ffffff';FX.shake=10;AU.sfx('bigboom');AU.sfx('splat',{vol:0.9});B.gone=1;
   const cx=B.x,cy=FLOOR-50*B.S;
   if(SV.blood){for(let i=0;i<10;i++)FX.add({type:'chunk',x:cx+rnd(-8,8),y:cy+rnd(-30,30),vx:rnd(-3,3)+P.face*1.5,vy:rnd(-5,-1.5),g:0.22,life:400,t:0,c:pick([B.cs.skin,B.cs.topC,B.cs.pants,'#8a0010']),s:ri(2,4),floor:FLOOR+rnd(-2,4),stick:1});
    D.blood(cx,cy,P.face,60);D.blood(cx,cy+20,-P.face,40)}
   else{for(let i=0;i<70;i++)FX.add({x:cx+rnd(-14,14),y:cy+rnd(-44,44),vx:rnd(-0.6,0.6)+P.face*0.6,vy:rnd(-1.2,0.2),g:0.02,life:rnd(60,120),t:0,c:pick(['#8a8a8a','#6a6a6a','#b0b0b0','#4a4a4a']),s:2,type:'smoke'})}}
  if(F.t==70){D.say('FATAL STRIKE',D.st,{sc:3,c1:'#ff8080',c2:'#900000',life:150,y:70});AU.vo('strike')}
  if(F.t==130){AU.vo(pick(['brutal','excellent']));P.set('win');P.glowP=0}
  if(F.t==230){D.result='win';D.fatal=true;D.state='done';D.st=100}},
 finish(){const D=this;if(D.ended)return;D.ended=1;D.cfg.onEnd&&D.cfg.onEnd({result:D.result,fatal:!!D.fatal,perfect:false,loserPl:D.ap.pl,stage:D.stage})},
 // ---------- AI ----------
 aiInput(f,o,live){const D=this,I=mkPad(),a=f.ai,d=D.diff,bd=D.bdef;if(!live||f.freeze)return I;const dist=Math.abs(o.x-f.x),fw=f.face>0?'r':'l',bk=f.face>0?'l':'r';
  a.t++;// keep plan for a few frames
  // khan phase 2
  if(f.id=='khan'&&f.phase==1&&f.hp<f.maxhp*0.5){f.phase=2;f.speedK=1.25;D.say('IRON KHAN UNLEASHED',D.st,{sc:1,life:90,y:56});AU.vo('warning');FX.flash=6;FX.flashC='#ff3000';f.inv=30;f.glowP=1}
  // defence: react to attacks
  const threat=(o.move&&o.mt<o.move.st+o.move.act)||(o.special&&o.special.hit&&o.special.t<o.special.hit.to);const pj=D.proj.find(p=>p.owner===o&&Math.abs(p.x-f.x)<90&&sgn(f.x-p.x)==sgn(p.vx));
  if((threat&&dist<70||pj)&&D.canAct(f)){if(!a.defRoll||a.t-a.defT>20){a.defT=a.t;a.defRoll=Math.random()}
   if(a.defRoll<bd.blk*(0.6+d*0.6)){I.rb=1;if((o.move&&o.move.low)||(pj&&pj.low))I.d=1;if(pj&&pj.low&&a.defRoll<0.15){I.rb=0;I.a=I._a=1}return I}}
  // anti-air
  if(o.air&&dist<75&&o.vy>-2&&D.canAct(f)&&Math.random()<bd.aa*0.25*(0.5+d)){I.d=1;I.x=I._x=1;return I}
  if(a.wait>0){a.wait--;if(a.plan=='walk')I[fw]=1;if(a.plan=='back')I[bk]=1;if(a.plan=='crouch')I.d=1;if(a.plan=='block')I.rb=1;return I}
  if(!D.canAct(f))return I;
  const agg=bd.agg*(0.7+d*0.5),r=Math.random();
  // punish recovering opponent
  if(o.move&&o.mt>o.move.st+o.move.act&&dist<50&&Math.random()<0.25+d*0.4){I.d=dist<36;I.x=I._x=1;return I}
  if(o.state=='getup'||o.state=='down'){a.plan='walk';a.wait=dist>60?10:0;if(dist<=60){a.plan='back';a.wait=8}return I}
  if(dist>110){if(r<bd.spc*0.12*(0.6+d)){f.aiSpecial=pick(bd.sp.filter(s=>s!='shock'||dist<90));return I}if(r<0.05+agg*0.08){a.plan='walk';a.wait=ri(12,30);return I}if(r<0.08){I.a=I._a=1;I[fw]=1;return I}return I}
  if(dist>48){if(r<bd.spc*0.06){f.aiSpecial=pick(bd.sp);return I}if(r<agg*0.06){a.plan='walk';a.wait=ri(8,20);return I}if(r<agg*0.08){I.b=I._b=1;I[fw]=1;return I}if(r<agg*0.1){I.a=I._a=1;I[fw]=1;a.jumpAtk=1;return I}if(r<0.11){a.plan='back';a.wait=ri(6,16)}return I}
  // close range
  if(f.air){if(a.jumpAtk){I.b=I._b=1;a.jumpAtk=0}return I}
  const c=Math.random();if(c<agg*0.08){I.x=I._x=1;if(Math.random()<0.4)I[fw]=1}else if(c<agg*0.13){I.b=I._b=1;if(Math.random()<0.4)I.d=1}else if(c<agg*0.15){I.d=1;I.x=I._x=1}else if(c<agg*0.16+0.01){if(bd.sp.includes('shock')||bd.sp.includes('machete')||bd.sp.includes('slide')||bd.sp.includes('rush'))f.aiSpecial=pick(bd.sp)}else if(c<0.2){I[fw]=1;I.x=I._x=1}else if(c<0.23){a.plan='block';a.wait=ri(8,20)}else if(c<0.26){a.plan='back';a.wait=ri(6,14)}
  return I},
 // ---------- draw ----------
 draw(g){const D=this,cx=Math.round(D.cam+(FX.shake?rnd(-FX.shake,FX.shake):0)),cy=FX.shake?Math.round(rnd(-FX.shake,FX.shake)*0.6):0;
  // background (parallax: painting moves at 0.6)
  if(D.bg){const bx=-Math.round(cx*((D.bg.width-320)/Math.max(1,D.W-320)));g.drawImage(D.bg,bx,cy-6)}else{g.fillStyle='#202030';g.fillRect(0,0,VW,VH)}
  D.drawFloor(g,cx,cy);
  // shadows
  for(const f of[D.p,D.boss]){if(f.gone)continue;const w=Math.max(8,22*f.S-(-f.y)*0.12);g.fillStyle='rgba(0,0,0,0.35)';g.beginPath();g.ellipse(Math.round(f.x-cx),FLOOR+1+cy,w,3,0,0,7);g.fill()}
  // fighters (attacker on top)
  const order=[D.p,D.boss].sort((a,b)=>(a.move||a.special?1:0)-(b.move||b.special?1:0));
  for(const f of order){if(f.gone)continue;const s=f.sprite();const x=Math.round(f.x-cx-s.ox),y=Math.round(FLOOR+f.y+cy-s.oy);
   if(f.inv>0&&f.state!='getup'&&D.st%4<2&&f.special&&f.special.fn=='ghost'){g.globalAlpha=0.4}
   g.drawImage(s.c,x,y);g.globalAlpha=1;
   if(f.freeze>0){g.globalAlpha=0.45;g.fillStyle='#a0e8ff';g.globalCompositeOperation='source-atop';g.globalCompositeOperation='source-over';g.fillRect(x+s.ox-14,y+s.oy-92*f.S,28,92*f.S);g.globalAlpha=1}
   if(f.phase==2&&D.st%6<3){g.globalAlpha=0.25;g.globalCompositeOperation='lighter';g.drawImage(s.c,x,y);g.globalCompositeOperation='source-over';g.globalAlpha=1}
   if(f.dizzy&&D.state=='endit'){for(let i=0;i<3;i++){const a=D.st*0.1+i*2.1;txt(g,'*',f.x-cx+Math.cos(a)*10-2,FLOOR+f.y-100*f.S+Math.sin(a)*3,'#ffe040',{sh:false})}}}
  // projectiles
  for(const p of D.proj)D.drawProj(g,p,cx,cy);
  FX.draw(g,cx,-cy);
  D.hud(g);
  for(const t of D.fxText){const age=D.st-t.t0;if(age<0)continue;if(age>t.life){t.dead=1;continue}
   if(t.small){txt(g,t.s,t.x,t.y,'#ffe040',{a:'c'});continue}
   const sx=age<8?0.3+age/8*0.7:1;big(g,t.s,160,t.y-(t.sc*7)/2,t.sc,{c1:t.c1,c2:t.c2,sx})}
  D.fxText=D.fxText.filter(t=>!t.dead);
  if(D.state=='endit'){const s=Math.ceil(D.endIt/60);if(D.st%30<20)txt(g,'F F ↓ + Y',160,148,'#ffffff',{a:'c'});}
  if(FX.flash>0){g.globalAlpha=Math.min(1,FX.flash/8);g.fillStyle=FX.flashC;g.fillRect(0,0,VW,VH);g.globalAlpha=1}},
 drawFloor(g,cx,cy){const D=this;const pal=FLOORS[D.stage]||FLOORS[1];const y0=FLOOR-14+cy;
  const L=g.createLinearGradient(0,y0,0,VH);L.addColorStop(0,pal[0]);L.addColorStop(1,pal[1]);g.fillStyle=L;g.fillRect(0,y0,VW,VH-y0);
  g.fillStyle=pal[2];for(let i=-2;i<14;i++){const wx=i*48-(cx%48);// perspective tile seams
   g.beginPath();g.moveTo(wx+24*0.6,y0);g.lineTo(wx+1+24*0.6,y0);g.lineTo(wx+(wx-160)*0.5+1,VH);g.lineTo(wx+(wx-160)*0.5,VH);g.fill()}
  for(const yy of[6,15,27]){g.fillRect(0,y0+yy,VW,1)}g.fillStyle='rgba(0,0,0,0.35)';g.fillRect(0,y0,VW,2);g.fillStyle=pal[3];g.fillRect(0,y0+2,VW,1)},
 drawProj(g,p,cx,cy){const x=Math.round(p.x-cx),y=Math.round(FLOOR+p.y+cy),d=sgn(p.vx),t=p.t;
  switch(p.type){
   case'frag':g.fillStyle='#2a3a1a';g.fillRect(x-3,y-3,6,6);g.fillStyle='#5a6a3a';g.fillRect(x-2,y-3,3,2);if(t%8<4){g.fillStyle='#ff3020';g.fillRect(x,y-4,1,1)}break;
   case'knife':g.fillStyle='rgba(120,200,255,0.4)';g.fillRect(x-d*14,y-2,d*14,4);g.fillStyle='#d0f0ff';g.beginPath();g.moveTo(x+d*7,y);g.lineTo(x-d*4,y-3);g.lineTo(x-d*4,y+3);g.fill();g.fillStyle='#fff';g.fillRect(x-d*4,y-1,d*9,1);break;
   case'fire':{const r=7+Math.sin(t*0.5);g.fillStyle='#a02008';g.beginPath();g.arc(x,y,r+2,0,7);g.fill();g.fillStyle='#ff8020';g.beginPath();g.arc(x+d,y,r,0,7);g.fill();g.fillStyle='#ffe080';g.beginPath();g.arc(x+d*2,y-1,r*0.55,0,7);g.fill();g.fillStyle='#fff';g.fillRect(x+d*3-1,y-2,3,3);break}
   case'quake':g.fillStyle='#9a8a7a';for(let i=0;i<4;i++){const h=8+((t*3+i*7)%12);g.fillRect(x-6+i*3,y-h,3,h)}break;
   case'fan':g.save();g.translate(x,y);g.rotate(t*0.6);g.fillStyle='#ff4a9a';g.fillRect(-6,-1,12,2);g.fillRect(-1,-6,2,12);g.fillStyle='#fff';g.fillRect(-1,-1,2,2);g.restore();break;
   case'frost':g.fillStyle='rgba(160,230,255,0.5)';g.fillRect(x-d*12,y-3,d*12,6);g.fillStyle='#e0f8ff';g.beginPath();g.moveTo(x+d*8,y);g.lineTo(x,y-4);g.lineTo(x-d*3,y);g.lineTo(x,y+4);g.fill();break;
   case'acid':g.fillStyle='#60d020';g.beginPath();g.arc(x,y,4,0,7);g.fill();g.fillStyle='#d0ff80';g.fillRect(x-1,y-2,2,2);break;
   case'rocket':case'shell':g.fillStyle='#6a6a70';g.fillRect(x-6,y-2,12,5);g.fillStyle='#c03020';g.fillRect(x+d*4,y-2,3,5);g.fillStyle=t%4<2?'#ffe060':'#ff8020';g.fillRect(x-d*9-2,y-1,4,3);break;
   case'firewave':for(let i=0;i<3;i++){const h=10+Math.sin(t*0.4+i)*4;g.fillStyle=i==1?'#ffe060':'#ff6010';g.fillRect(x-5+i*3,y-h,3,h)}break;
   case'meteor':g.fillStyle='#401008';g.beginPath();g.arc(x,y,7,0,7);g.fill();g.fillStyle='#ff6020';g.beginPath();g.arc(x,y,5,0,7);g.fill();g.fillStyle='#ffe0a0';g.fillRect(x-1,y-2,3,3);break;
  }},
 hud(g){const D=this,P=D.p,B=D.boss;
  const bar=(x,f,right)=>{const w=128;g.fillStyle='#000';g.fillRect(x-1,7,w+2,11);g.fillStyle='#600';g.fillRect(x,8,w,9);
   const tw=Math.round(w*f.trail/f.maxhp),hw=Math.round(w*f.hp/f.maxhp);g.fillStyle='#e02010';right?g.fillRect(x+w-tw,8,tw,9):g.fillRect(x,8,tw,9);
   const L=g.createLinearGradient(0,8,0,17);L.addColorStop(0,'#fff8a0');L.addColorStop(0.4,'#f0d020');L.addColorStop(1,'#a07000');g.fillStyle=L;right?g.fillRect(x+w-hw,8,hw,9):g.fillRect(x,8,hw,9);
   g.fillStyle='rgba(255,255,255,0.35)';g.fillRect(x,8,w,1);txt(g,f.name,right?x+w:x,20,'#fff',{a:right?'r':'l'})};
  bar(8,P,false);bar(184,B,true);
  const tt=String(D.timer).padStart(2,'0');big(g,tt,160,4,2,{c1:'#ffffff',c2:'#a0a0c0',ol:'#000'});
  for(let i=0;i<D.wins[0];i++)D.medal(g,10+i*12,30);for(let i=0;i<D.wins[1];i++)D.medal(g,302-i*12,30);
  if(D.cfg.players.length>1)txt(g,(D.ap.pl==0?'P1':'P2')+' FIGHTS',8,40,'#a0e0ff',{s:1});
  if(Game.hudExtra)Game.hudExtra(g)},
 medal(g,x,y){g.fillStyle='#000';g.fillRect(x-1,y-1,10,10);g.fillStyle='#e8e0c8';g.fillRect(x,y,8,6);g.fillRect(x+1,y+6,6,2);g.fillStyle='#000';g.fillRect(x+1,y+2,2,2);g.fillRect(x+5,y+2,2,2);g.fillRect(x+3,y+5,2,1)},
};
const FLOORS={1:['#4a3a20','#1a1408','#2a2010','#7a6a40'],2:['#4a4a48','#1a1a1a','#2a2a28','#7a7a70'],3:['#2a2030','#0a0810','#1a1020','#ff3a8a'],4:['#c8d0d8','#6a7080','#a0a8b8','#ffffff'],5:['#2a3a2a','#0a1008','#1a2418','#80ff60'],6:['#3a3e44','#14161a','#24262a','#c8b040'],7:['#3a2020','#100606','#200c0c','#d06020']};
