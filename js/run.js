'use strict';
// ===== Run & gun stages =====
const PS=0.42;// stage sprite scale
const GUNS={
 rifle:{rate:9,spd:5.2,dmg:1,snd:'gun',col:'#fff4c0',r:2},
 shotgun:{rate:17,spd:4.6,dmg:1,snd:'shotgun',col:'#ffd080',r:2,pellets:[-0.22,-0.1,0,0.1,0.22],life:26},
 smg:{rate:5,spd:5.6,dmg:0.6,snd:'gun',col:'#e0c0ff',r:1.5,twin:1,jit:0.06},
 ember:{rate:15,spd:3.6,dmg:2.2,snd:'sp_fire',col:'#ff9030',r:4,pierce:1,fire:1},
 S:{rate:12,spd:4.8,dmg:1,snd:'spread',col:'#ff5050',r:2.5,pellets:[-0.3,-0.15,0,0.15,0.3],big:1},
 L:{rate:22,spd:7.5,dmg:2.5,snd:'laser',col:'#80e8ff',r:2,laser:1,pierce:99},
 F:{rate:14,spd:3.6,dmg:2,snd:'flame',col:'#ff8020',r:4,spiral:1,pierce:2,fire:1},
};
const BASEGUN={raze:'rifle',brick:'shotgun',nova:'smg',kazan:'ember'};
const STAGES={
 1:{name:'BURNING JUNGLE',boss:'hask',grunt:'grunt',mus:'s1',len:3300,ground:['#3a5a20','#2a3a14','#5a4a2a','#1a1408'],deco:'jungle',fx:'embers',set:'gunboat',sky:'#2a1a10'},
 2:{name:'BLACK RIVER DAM',boss:'lockjaw',grunt:'gruntR',mus:'s2',len:3400,ground:['#6a6a64','#4a4a46','#5a5a54','#222220'],deco:'dam',fx:'mist',set:'tank',sky:'#1a1e24'},
 3:{name:'NEON SLUMS',boss:'silk',grunt:'gruntC',mus:'s3',len:3400,ground:['#3a3440','#24202a','#4a4050','#0e0c12'],deco:'city',fx:'rain',set:'heli',sky:'#100818'},
 4:{name:'FROSTLINE FORTRESS',boss:'varga',grunt:'gruntS',mus:'s4',len:3500,ground:['#e8f0f8','#a8b8c8','#8a98a8','#3a4250'],deco:'snow',fx:'snow',set:'train',sky:'#b0c0d0'},
 5:{name:'HIVE LAB',boss:'spec9',grunt:'gruntL',mus:'s5',len:3500,ground:['#3a4a3a','#2a342a','#4a5a48','#0e140e'],deco:'lab',fx:'spores',set:'breach',sky:'#081008'},
 6:{name:'SKY CARRIER',boss:'dread',grunt:'grunt',mus:'s6',len:3600,ground:['#5a5e66','#3a3e46','#6a6e76','#18191c'],deco:'carrier',fx:'wind',set:'deckgun',sky:'#304060'},
};
const OBS_BUNK={1:0.8,2:0.3,3:0.6,4:0.75,5:0.2,6:0.4};
const OBS_PAL={1:{bag:'#a08a5a',bagD:'#6a5a38',metal:'#4a5a3a',drum:'#c04020',band:'#ffd040'},2:{bag:'#8a8a80',bagD:'#5a5a52',metal:'#5a6470',drum:'#d06020',band:'#202020'},3:{bag:'#6a6070',bagD:'#3a3440',metal:'#4a4458',drum:'#d03080',band:'#40e0ff'},4:{bag:'#d8e0e8',bagD:'#8a98a8',metal:'#5a6a7a',drum:'#c02020',band:'#f0f0f0'},5:{bag:'#5a6a50',bagD:'#2a3a2a',metal:'#3a4a44',drum:'#40c040',band:'#e0ff40'},6:{bag:'#7a7e86',bagD:'#4a4e56',metal:'#5a5e66',drum:'#e0a020',band:'#202020'}};
const DROPS=['S','L','F','R','H','H'];
function seeded(s){return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const Run={
 start(cfg){// cfg:{stage, players:[{pl,id,lives,score}], onEnd}
  const R=this;R.cfg=cfg;R.n=cfg.stage;R.S=STAGES[cfg.stage];R.L=R.S.len;R.t=0;R.cx=0;R.lock=null;R.ground=[];R.plats=[];R.spawns=[];R.en=[];R.pb=[];R.eb=[];R.items=[];R.decor=[];R.dead=false;R.done=0;R.over=0;R.endT=0;R.msg=[];R.bg=IMG['bgh'+cfg.stage]||IMG['bg'+cfg.stage];
  R.build();R.mkTiles();R.mkMid();
  R.pl=cfg.players.map((p,i)=>R.newPlayer(p,40+i*24));
  AU.playMusic(R.S.mus);R.say('STAGE '+R.n,0,90,2);R.say(R.S.name,0,90,1,118);AU.vo('stage');setTimeout(()=>AU.vo('go'),1300);
  // pre-render stage frames
  R.warm=[];const ids=[...new Set([...cfg.players.map(p=>p.id),R.S.grunt])];for(const id of ids)for(const a in ANIM.A){if(!(a.startsWith('aim_')||a.startsWith('run_')||a=='prone'||a=='die'||a=='flip'||a=='runplain'))continue;ANIM.A[a].f.forEach((P,i)=>{R.warm.push([id,P,a+i,false],[id,P,a+i,true])})}},
 newPlayer(p,x){return{p,pl:p.pl,id:p.id,x,y:120,vx:0,vy:0,face:1,on:false,prone:false,aim:0,gun:BASEGUN[p.id],pick:null,rapid:0,swap:0,cool:0,inv:120,dead:0,hp:SV.easy?3:1,gren:3,anim:'flip',at:0,drop:0,alive:true}},
 say(s,t,life,sc,y=96){this.msg.push({s,t0:this.t+t,life,sc,y})},
 // ---------- level building ----------
 build(){const R=this,n=R.n,L=R.L,rnd2=seeded(n*7919+13),r=(a,b)=>a+rnd2()*(b-a);const G=(x0,x1,y)=>R.ground.push({x0,x1,y}),Pl=(x0,x1,y,k)=>R.plats.push({x0,x1,y,k:k||'ledge'}),S=(x,type,o={})=>R.spawns.push(Object.assign({x,type},o));
  let x=0,y=200;const setX=Math.round(L*0.55);
  while(x<L){let w=Math.round(r(220,420));if(x<300)w=420;
   if(x>setX-300&&x<setX+360){w=setX+360-x+Math.round(r(60,140))}
   const x1=Math.min(L+400,x+w);G(x,x1,y);
   // features on this segment
   const nx=x1;if(x>200){const k=rnd2();
    if(k<0.28){Pl(x+40,x+140,y-46);S(x+90,'rifle',{y:y-46,plat:1})}
    else if(k<0.48){Pl(x+30,x+100,y-42);Pl(x+120,x+200,y-84);S(x+160,'sniper',{y:y-84,plat:1})}
    else if(k<0.8){const gk=rnd2()<OBS_BUNK[n]?'bunker':'gunpod';S(x+w*0.5,gk,{});if(rnd2()<0.6)S(x+w*0.5-34,'barrel',{n:rnd2()<0.5?2:1})}
    else{S(x+w*0.6,'crate',{});S(x+w*0.6+26,'barrel',{n:2})}}
   if(x1>=L+400)break;
   // gap or step
   const gk=rnd2();if(x>300&&!(x1>setX-300&&x1<setX+400)&&x1<L-500&&gk<0.45){const gw=Math.round(r(36,60));Pl(x1+4,x1+gw-4,y-30,'bridge');x=x1+gw}else{x=x1;y=clamp(y+(rnd2()<0.5?-16:16),168,208)}}
  // waves of runners
  for(let wx=360;wx<L-400;wx+=Math.round(r(150,260))){if(Math.abs(wx-setX)<260)continue;S(wx,'wave',{n:ri(2,3+Math.floor(n/2))})}
  for(let px=500;px<L-500;px+=Math.round(r(520,700)))S(px,'pod',{item:pick(['S','L','F','R','S','R'])});
  if(n>=2)for(let gx=800;gx<L-400;gx+=Math.round(r(700,900)))S(gx,'grenadier',{});
  if(n==3||n==6)for(let dx=700;dx<L-500;dx+=Math.round(r(500,700)))S(dx,'drones',{n:3});
  if(n==5)for(let dx=600;dx<L-500;dx+=Math.round(r(380,520)))S(dx,'crawlers',{n:3});
  if(n>=4)for(let mx=1000;mx<L-400;mx+=Math.round(r(900,1200)))S(mx,'mortar',{});
  {let c=R.spawns.filter(q=>q.type=='bunker'||q.type=='gunpod').length;for(const f of[0.3,0.8,0.4,0.7]){if(c>=3)break;const gx=Math.round(L*f);if(R.groundAt(gx)>900||R.groundAt(gx+40)>900)continue;S(gx,rnd2()<OBS_BUNK[n]?'bunker':'gunpod',{});S(gx-32,'barrel',{n:1});c++}}
  S(setX,'setpiece',{});R.setX=setX;
  R.spawns.sort((a,b)=>a.x-b.x)},
 groundAt(x){for(const s of this.ground)if(x>=s.x0&&x<s.x1)return s.y;return 999},
 mkTiles(){const R=this,c=document.createElement('canvas');c.width=32;c.height=64;const g=c.getContext('2d');const[a,b,d,e]=R.S.ground;const rr=seeded(R.n*31);
  const L=g.createLinearGradient(0,0,0,64);L.addColorStop(0,b);L.addColorStop(1,e);g.fillStyle=L;g.fillRect(0,0,32,64);
  for(let i=0;i<70;i++){g.fillStyle=rr()<0.5?'rgba(0,0,0,0.25)':'rgba(255,255,255,0.08)';const s=1+Math.floor(rr()*3);g.fillRect(Math.floor(rr()*32),6+Math.floor(rr()*58),s,s)}
  const deco=R.S.deco;if(deco=='dam'||deco=='carrier'||deco=='lab'){g.fillStyle='rgba(0,0,0,0.35)';g.fillRect(0,20,32,1);g.fillRect(0,44,32,1);g.fillRect(15,6,1,14);g.fillRect(3,21,1,23);g.fillStyle='rgba(255,255,255,0.1)';g.fillRect(0,21,32,1);g.fillRect(0,45,32,1);g.fillStyle='rgba(0,0,0,0.4)';g.fillRect(6,12,2,2);g.fillRect(24,32,2,2)}
  else if(deco=='city'){for(let y=8;y<64;y+=8)for(let x=(y/8%2)*4;x<32;x+=8){g.fillStyle='rgba(0,0,0,0.3)';g.fillRect(x,y,8,1);g.fillRect(x,y,1,8)}}
  // top lip
  g.fillStyle=a;g.fillRect(0,0,32,5);g.fillStyle='rgba(255,255,255,0.3)';g.fillRect(0,0,32,1);g.fillStyle=d;for(let x=0;x<32;x+=2){const h=deco=='jungle'?2+Math.floor(rr()*4):deco=='snow'?2+Math.floor(rr()*3):2;g.fillRect(x,4,2,h)}
  if(deco=='jungle'){g.fillStyle='#6a8a2a';for(let x=0;x<32;x+=3)g.fillRect(x,-1+Math.floor(rr()*2),1,3)}
  if(deco=='snow'){g.fillStyle='#ffffff';g.fillRect(0,0,32,3)}
  R.tile=G.createPattern(c,'repeat-x');R.tileC=c},
 mkMid(){// mid parallax silhouette strip (repeating 320 wide)
  const R=this,c=document.createElement('canvas');c.width=320;c.height=240;const g=c.getContext('2d');const rr=seeded(R.n*101);const d=R.S.deco;
  const sil=(col)=>{g.fillStyle=col};
  if(d=='jungle'){for(let i=0;i<7;i++){const x=rr()*320,h=90+rr()*70,b=210;sil('#140c06');g.fillRect(x,b-h,3,h);for(let k=0;k<6;k++){const a=k/6*Math.PI*2;g.beginPath();g.moveTo(x+1,b-h);g.quadraticCurveTo(x+Math.cos(a)*18,b-h-10,x+Math.cos(a)*26,b-h+12+Math.abs(Math.sin(a))*6);g.lineTo(x+Math.cos(a)*22,b-h+14);g.closePath();g.fill()}}g.fillStyle='#1a1008';for(let x=0;x<320;x+=4)g.fillRect(x,190+Math.sin(x*0.1)*5+rr()*4,4,60)}
  if(d=='dam'){g.fillStyle='#22262c';for(let x=0;x<320;x+=80){g.fillRect(x+10,60,26,180);g.fillStyle='#2c3038';g.fillRect(x+12,60,4,180);g.fillStyle='#22262c'}g.fillRect(0,56,320,10);g.fillStyle='#ffd040';for(let x=0;x<320;x+=40)g.fillRect(x+4,62,3,2)}
  if(d=='city'){for(let x=0;x<320;){const w=30+rr()*40,h=60+rr()*110;g.fillStyle='#120c1c';g.fillRect(x,210-h,w,h+30);for(let wy=210-h+6;wy<205;wy+=7)for(let wx=x+4;wx<x+w-4;wx+=6)if(rr()<0.35){g.fillStyle=pick(['#ff3a8a','#3af0ff','#ffd040','#6a4a8a']);g.fillRect(wx,wy,3,3)}if(rr()<0.5){g.fillStyle=pick(['#ff2a7a','#2ae8ff']);g.fillRect(x+4,210-h+10,w-8,4)}x+=w+2}}
  if(d=='snow'){for(let i=0;i<14;i++){const x=rr()*320,h=40+rr()*50,b=212;g.fillStyle='#4a5a6a';g.beginPath();g.moveTo(x,b-h);g.lineTo(x-14,b);g.lineTo(x+14,b);g.fill();g.fillStyle='#e8f0f8';g.beginPath();g.moveTo(x,b-h);g.lineTo(x-5,b-h+14);g.lineTo(x+5,b-h+14);g.fill()}}
  if(d=='lab'){for(let x=0;x<320;x+=64){g.fillStyle='#14201a';g.fillRect(x+8,70,40,140);g.fillStyle='rgba(80,255,120,0.18)';g.fillRect(x+12,80,32,120);g.fillStyle='#2a3a30';g.fillRect(x+6,66,44,8);g.fillRect(x+6,200,44,10);g.fillStyle='#0a120c';g.beginPath();g.ellipse(x+28,140,8,18,0,0,7);g.fill()}g.fillStyle='#1a2a20';g.fillRect(0,40,320,6);for(let x=0;x<320;x+=20)g.fillRect(x,46,2,30)}
  if(d=='carrier'){g.fillStyle='#2a3240';g.fillRect(40,90,90,130);g.fillRect(70,50,30,40);g.fillRect(82,20,4,30);g.fillStyle='#ffd040';for(let y=100;y<200;y+=14)for(let x=46;x<126;x+=12)g.fillRect(x,y,4,3);g.fillStyle='#384050';g.fillRect(200,150,120,70);g.fillRect(240,130,40,20)}
  R.mid=c},
 // ---------- update ----------
 update(){const R=this;R.t++;
  if(R.warm.length){const t0=performance.now();while(R.warm.length&&performance.now()-t0<6){const[id,P,k,fl]=R.warm.shift();SPR.render(id,P,PS,fl,k)}}
  if(FX.hitstop>0){FX.hitstop--;return}
  // camera
  const alive=R.pl.filter(p=>p.alive&&!p.dead);const lead=alive.length?Math.max(...alive.map(p=>p.x)):R.cx+100;
  let target=lead-140;if(R.lock!==null)target=Math.min(target,R.lock);target=Math.min(target,R.L-320);if(target>R.cx)R.cx=Math.min(target,R.cx+2.2);
  // spawns
  while(R.spawns.length&&R.spawns[0].x<R.cx+340){R.spawn(R.spawns.shift())}
  for(const p of R.pl)R.updPlayer(p);
  for(const e of R.en)R.updEnemy(e);
  R.updBullets();R.updItems();FX.update();
  R.en=R.en.filter(e=>!e.gone);
  // end of stage
  if(R.cx>=R.L-320-1&&!R.endT&&!R.lock){R.endT=1;AU.stopMusic(1.2);AU.sfx('alarm',{vol:0.6});AU.vo('boss');R.say('WARNING',0,100,4,70)}
  if(R.endT){R.endT++;if(R.endT==130){const b=R.S.boss;R.say(SPR.C[b].name,0,140,2,124)}if(R.endT==270)R.finish('clear')}
  // all players out?
  if(!R.over&&R.pl.every(p=>!p.alive)){R.over=1;R.finish('dead')}
  R.weather()},
 finish(res){if(this.done)return;this.done=1;this.cfg.onEnd&&this.cfg.onEnd({result:res,players:this.pl})},
 weather(){const R=this,fx=R.S.fx;if(fx=='rain'&&R.t%1==0)for(let i=0;i<2;i++)FX.add({x:R.cx+rnd(0,360),y:-4,vx:-1.2,vy:7,g:0,life:40,t:0,c:'rgba(160,180,255,0.55)',s:1,type:'p',floor:R.groundAt(R.cx+160)});
  if(fx=='snow'&&R.t%3==0)FX.add({x:R.cx+rnd(0,380),y:-4,vx:rnd(-0.8,-0.2),vy:rnd(0.4,0.9),g:0,life:300,t:0,c:'#ffffff',s:pick([1,1,2]),type:'p'});
  if(fx=='embers'&&R.t%6==0)FX.add({x:R.cx+rnd(0,340),y:244,vx:rnd(-0.3,0.3),vy:rnd(-0.9,-0.4),g:0,life:240,t:0,c:pick(['#ffa030','#ff6010','#ffe060']),s:1,type:'p'});
  if(fx=='spores'&&R.t%8==0)FX.add({x:R.cx+rnd(0,340),y:rnd(40,220),vx:rnd(-0.2,0.2),vy:rnd(-0.3,-0.1),g:0,life:200,t:0,c:'#80ff60',s:1,type:'p'});
  if(fx=='wind'&&R.t%4==0)FX.add({x:R.cx+340,y:rnd(10,200),vx:-6,vy:0,g:0,life:70,t:0,c:'rgba(255,255,255,0.35)',s:1,type:'p'})},
 // ---------- player ----------
 updPlayer(p){const R=this,I=IN[p.pl]||mkPad();p.at++;
  if(!p.alive)return;
  if(p.dead){p.dead++;p.vy+=0.2;p.x+=p.vx;p.y+=p.vy;const gy=R.groundAt(p.x);if(p.y>=gy&&gy<900){p.y=gy;p.vx*=0.8;p.vy=0}if(p.dead>90)R.respawn(p);return}
  if(p.inv>0)p.inv--;
  const lock=I.b;let dx=(I.r?1:0)-(I.l?1:0),dy=(I.d?1:0)-(I.u?1:0);
  if(dx)p.face=dx;
  // prone
  p.prone=p.on&&I.d&&!dx&&!lock;
  // jump / drop through
  if(I._a&&p.on){if(I.d&&p.onPlat){p.drop=12;p.on=false;p.y+=2}else{p.vy=-4.7;p.on=false;AU.sfx('jump',{vol:0.35})}}
  p.vx=(!lock&&!p.prone)?dx*1.3:0;
  // aim angle
  let ax=dx||0,ay=dy;if(!ax&&!ay)ax=p.face;if(p.on&&ay>0&&!ax)ax=p.face,ay=0;if(p.on&&ay>0&&ax&&!lock)ay=1;
  p.aim=Math.atan2(ay,ax);
  // physics
  p.vy+=0.2;if(p.vy>5)p.vy=5;const ny=p.y+p.vy;p.x+=p.vx;p.x=clamp(p.x,R.cx+8,R.cx+312);if(R.lock!==null&&R.sp&&!R.sp.dead&&!R.sp.fly){const xs=R.sp.parts.filter(q=>!q.gone&&q.hp>0).map(q=>q.x);if(xs.length)p.x=Math.min(p.x,Math.min(...xs)-30)}
  if(p.drop>0)p.drop--;p.on=false;p.onPlat=false;
  if(p.vy>=0){const gy=R.groundAt(p.x);if(p.y<=gy&&ny>=gy){p.y=gy;p.vy=0;p.on=true}else if(p.drop<=0)for(const s of R.plats){if(p.x>=s.x0&&p.x<s.x1&&p.y<=s.y+1&&ny>=s.y){p.y=s.y;p.vy=0;p.on=true;p.onPlat=true;break}}}
  if(!p.on)p.y=ny;
  // wall: can't walk into higher ground
  const gy2=R.groundAt(p.x+p.face*4);if(p.on&&gy2<p.y-10){p.x-=p.vx}
  if(p.y>260){R.kill(p,true);return}
  // weapons
  if(I._rb&&p.pick){p.swap=!p.swap;AU.sfx('uisel',{vol:0.5})}
  const gk=p.pick&&!p.swap?p.pick:p.gun;const gd=GUNS[gk];
  if(p.cool>0)p.cool--;if(I.x&&p.cool<=0){R.fire(p,gd,gk);p.cool=Math.round(gd.rate*(p.rapid?Math.pow(0.7,p.rapid):1))}
  if(I._y&&p.gren>0){p.gren--;R.pb.push({x:p.x,y:p.y-24,vx:p.face*2.4+p.vx,vy:-3.2,g:0.16,dmg:8,r:3,gren:1,life:200,t:0,col:'#3a4a2a',owner:p});AU.sfx('grenade',{vol:0.6})}
  // anim
  const aimK=Math.abs(ay)>0&&ax?(ay<0?'uf':'df'):ay<0?'u':ay>0?'d':'f';
  if(!p.on){p.anim='flip'}else if(p.prone){p.anim='prone'}else if(p.vx){p.anim='run_'+(aimK=='u'?'uf':aimK=='d'?'df':aimK)}else p.anim='aim_'+(aimK=='d'?'df':aimK);
  // pickups
  for(const it of R.items){if(!it.dead&&Math.abs(it.x-p.x)<12&&Math.abs(it.y-(p.y-14))<18){it.dead=1;R.getItem(p,it.k)}}},
 muzzle(p){if(p.prone)return[p.x+p.face*22,p.y-5];if(!p.on)return[p.x,p.y-20];const a=p.aim;const sx=p.x+p.face*1,sy=p.y-74*PS;return[sx+Math.cos(a)*36*PS,sy+Math.sin(a)*36*PS+2]},
 fire(p,gd,gk){const R=this;const[mx,my]=R.muzzle(p);const a=p.prone?(p.face>0?0:Math.PI):p.aim;const mk=(ang,o={})=>R.pb.push(Object.assign({x:mx,y:my,vx:Math.cos(ang)*gd.spd,vy:Math.sin(ang)*gd.spd,dmg:gd.dmg,r:gd.r,col:gd.col,life:gd.life||90,t:0,pierce:gd.pierce||0,laser:gd.laser,fire:gd.fire,spiral:gd.spiral,ang,owner:p,hit:new Set()},o));
  if(gd.pellets)gd.pellets.forEach(d=>mk(a+d));else if(gd.twin){mk(a+rnd(-gd.jit,gd.jit),{y:my-1.5});mk(a+rnd(-gd.jit,gd.jit),{y:my+1.5})}else mk(a);
  AU.sfx(gd.snd,{vol:gk=='smg'?0.4:0.55,gap:gk=='smg'?0.07:0.05});FX.add({x:mx,y:my,vx:0,vy:0,g:0,life:3,t:0,c:'#fff8c0',s:3,type:'p'})},
 getItem(p,k){const R=this;AU.sfx('pickup');if(k=='H'){p.hp=Math.min((SV.easy?3:1)+1,p.hp+1);p.p.score+=500;R.say('ARMOR +1',0,50,1,60);return}if(k=='R'){p.rapid=Math.min(2,p.rapid+1);AU.vo('rapid')}else{p.pick=k;p.swap=false;AU.vo({S:'spread',L:'laser',F:'flame'}[k])}p.p.score+=500;R.say({S:'SPREAD GUN',L:'LASER',F:'FLAME GUN',R:'RAPID FIRE'}[k],0,50,1,60)},
 hitPlayer(p){if(p.inv>0||p.dead||!p.alive)return;p.hp--;AU.sfx('hurt',{vol:0.7});if(p.hp>0){p.inv=60;FX.flash=3;FX.flashC='#ff2000';return}this.kill(p)},
 kill(p,pit){const R=this;if(p.dead)return;p.dead=1;p.vy=pit?0:-3;p.vx=-p.face*1.2;p.anim='die';p.at=0;AU.sfx('hurt');AU.sfx(SPR.C[p.id].fem?'hitf':'hitm',{vol:0.8});if(!pit&&SV.blood)Duel.blood(p.x,p.y-20,-p.face,10);FX.shake=4;p.pick=null;p.rapid=0;p.swap=false},
 respawn(p){const R=this;p.p.lives--;if(p.p.lives<0){p.alive=false;p.p.lives=0;Game.onPlayerOut&&Game.onPlayerOut(p.p,()=>{p.alive=true;p.p.lives=2;R.respawn2(p)});return}R.respawn2(p)},
 respawn2(p){const R=this;p.dead=0;p.x=R.cx+50;p.y=40;p.vy=0;p.inv=150;p.hp=SV.easy?3:1;p.gren=3;p.anim='flip'},
 // ---------- enemies ----------
 spawn(s){const R=this,gid=R.S.grunt,n=R.n;const base={t:0,hp:1,face:-1,vx:0,vy:0};const gy=s.y??R.groundAt(s.x);
  switch(s.type){
   case'wave':for(let i=0;i<s.n;i++)R.en.push(Object.assign({},base,{k:'runner',x:R.cx+330+i*22,y:R.groundAt(R.cx+330+i*22)<900?R.groundAt(R.cx+330+i*22):200,id:gid,spd:1.0+n*0.06+rnd(0,0.3),fireT:ri(60,160)}));if(Math.random()<0.25)R.en.push(Object.assign({},base,{k:'runner',x:R.cx-12,y:R.groundAt(R.cx+10),id:gid,spd:1.1,face:1,fireT:999}));break;
   case'rifle':R.en.push(Object.assign({},base,{k:'rifle',x:s.x,y:gy,id:gid,hp:1,fireT:ri(40,90)}));break;
   case'sniper':R.en.push(Object.assign({},base,{k:'sniper',x:s.x,y:gy,id:gid,hp:2,fireT:ri(30,70)}));R.decor.push({k:'tower',x:s.x,y:gy});break;
   case'bunker':R.en.push(Object.assign({},base,{k:'bunker',obs:1,x:s.x,y:gy,hp:14+2*n,fireT:ri(50,90),tel:0,rows:3,drop:Math.random()<0.5?pick(DROPS):null}));break;
   case'gunpod':R.en.push(Object.assign({},base,{k:'gunpod',obs:1,x:s.x,y:gy,hp:12+2*n,ph:0,pt:ri(30,70),open:0,drop:Math.random()<0.45?pick(DROPS):null}));break;
   case'crate':R.en.push(Object.assign({},base,{k:'crate',obs:1,x:s.x,y:gy,hp:4,drop:pick(DROPS)}));break;
   case'barrel':for(let i=0;i<(s.n||1);i++){const bx=s.x+i*14;R.en.push(Object.assign({},base,{k:'barrel',obs:1,x:bx,y:R.groundAt(bx)<900?R.groundAt(bx):gy,hp:3}))}break;
   case'pod':R.en.push(Object.assign({},base,{k:'pod',x:R.cx-10,y:70,y0:rnd(50,90),hp:1,item:s.item,vx:1.6}));break;
   case'grenadier':R.en.push(Object.assign({},base,{k:'gren',x:s.x+120,y:R.groundAt(s.x+120)<900?R.groundAt(s.x+120):200,id:gid,hp:2,fireT:60}));break;
   case'drones':for(let i=0;i<s.n;i++)R.en.push(Object.assign({},base,{k:'drone',x:R.cx+340+i*30,y:40+i*14,hp:2,ph:i}));break;
   case'crawlers':for(let i=0;i<s.n;i++)R.en.push(Object.assign({},base,{k:'crawler',x:R.cx+330+i*26,y:R.groundAt(R.cx+330)<900?R.groundAt(R.cx+330):200,hp:2,jumpT:ri(20,60)}));break;
   case'mortar':{const mx=s.x+140,my=R.groundAt(mx)<900?R.groundAt(mx):200;R.en.push(Object.assign({},base,{k:'mortar',obs:1,x:mx,y:my,hp:12+n,fireT:80,tel:0,drop:Math.random()<0.4?pick(DROPS):null}));R.en.push(Object.assign({},base,{k:'barrel',obs:1,x:mx+26,y:my,hp:3}));break}
   case'setpiece':R.setpiece();break;
  }for(const e of R.en)if(e.obs&&!e.hp0)e.hp0=e.hp},
 setpiece(){const R=this,n=R.n,x=R.setX;R.lock=x-40;AU.sfx('alarm',{vol:0.6});AU.vo('warning');R.say('WARNING',0,80,3,60);const parts=[];
  const P=(o)=>{const e=Object.assign({k:'part',t:0,hp:12,fireT:ri(40,90),face:-1,vx:0,vy:0,big:1},o);R.en.push(e);parts.push(e);return e};
  const sp=R.S.set;R.sp={kind:sp,x,parts,t:0};
  if(sp=='gunboat'){const by=R.groundAt(x+200);R.sp.base={x:x+230,y:by};P({sub:'cannon',x:x+200,y:by-34,hp:16});P({sub:'cannon',x:x+252,y:by-34,hp:16});P({sub:'core',x:x+226,y:by-16,hp:30})}
  if(sp=='tank'){const by=R.groundAt(x+200);R.sp.base={x:x+420,y:by};R.sp.move=1;P({sub:'cannon',x:0,y:0,hp:24,rel:[-26,-30]});P({sub:'light',x:0,y:0,hp:16,rel:[8,-40]});P({sub:'core',x:0,y:0,hp:34,rel:[0,-14]})}
  if(sp=='heli'){R.sp.base={x:x+240,y:70};R.sp.fly=1;P({sub:'cannon',x:0,y:0,hp:24,rel:[-24,14]});P({sub:'rotor',x:0,y:0,hp:20,rel:[10,-12]});P({sub:'core',x:0,y:0,hp:36,rel:[0,0]})}
  if(sp=='train'){const by=R.groundAt(x+200);R.sp.base={x:x+480,y:by};R.sp.move=1;R.sp.train=1;for(let i=0;i<3;i++)P({sub:'cannon',x:0,y:0,hp:14,rel:[-40+i*40,-34]});P({sub:'core',x:0,y:0,hp:30,rel:[60,-20]})}
  if(sp=='breach'){const by=R.groundAt(x+200);R.sp.base={x:x+240,y:by};P({sub:'core',x:x+240,y:by-60,hp:44});P({sub:'cannon',x:x+204,y:by-90,hp:16});P({sub:'cannon',x:x+276,y:by-90,hp:16})}
  if(sp=='deckgun'){const by=R.groundAt(x+200);R.sp.base={x:x+240,y:by};P({sub:'cannon',x:x+230,y:by-40,hp:30});P({sub:'core',x:x+260,y:by-18,hp:34});R.sp.jets=1}
  for(const e of parts){e.hp*=1+(n-1)*0.12;e.hp0=e.hp}},
 updEnemy(e){const R=this;e.t++;const tgts=R.pl.filter(p=>p.alive&&!p.dead);const T=tgts.length?tgts.reduce((a,b)=>Math.abs(a.x-e.x)<Math.abs(b.x-e.x)?a:b):null;
  const shoot=(sx,sy,spd=1.6,ang)=>{if(!T&&ang===undefined)return;const a=ang??Math.atan2(T.y-16-sy,T.x-sx);R.eb.push({x:sx,y:sy,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,t:0,life:240});AU.sfx('eshot',{vol:0.35,gap:0.08})};
  const onscreen=e.x>R.cx-30&&e.x<R.cx+350;if(e.x<R.cx-60&&e.k!='pod'&&!e.big)e.gone=1;
  const diff=1+R.n*0.08;
  switch(e.k){
   case'runner':{e.x+=e.face*e.spd;const gy=R.groundAt(e.x);if(gy>900){e.vy+=0.2;e.y+=e.vy;if(e.y>260)e.gone=1}else if(gy<e.y-12){e.vy=-3.6;e.y+=e.vy;}else{if(e.y<gy){e.vy+=0.2;e.y=Math.min(gy,e.y+e.vy)}else{e.y=gy;e.vy=0}}
    if(e.vy<0){e.vy+=0.2;e.y+=e.vy}
    if(--e.fireT<=0&&T&&onscreen&&Math.sign(T.x-e.x)==e.face){shoot(e.x+e.face*10,e.y-26,1.8,e.face>0?0:Math.PI);e.fireT=ri(120,220)/diff}e.anim='runplain';break}
   case'rifle':case'sniper':{if(T)e.face=T.x<e.x?-1:1;const a=T?Math.atan2(T.y-16-(e.y-30),T.x-e.x):Math.PI;const k=Math.round(a/(Math.PI/4));e.aim=k*Math.PI/4;
    const ak=Math.abs(k)==4||k==0?'f':(k<0?(Math.abs(k)==2?'u':'uf'):(Math.abs(k)==2?'df':'df'));e.anim='aim_'+ak;
    if(--e.fireT<=0&&onscreen&&T){shoot(e.x+Math.cos(e.aim)*16,e.y-31+Math.sin(e.aim)*16,e.k=='sniper'?2.2:1.7,e.aim+(e.k=='sniper'?0:0));e.fireT=(e.k=='sniper'?ri(50,90):ri(80,140))/diff}break}
   case'gren':{if(T)e.face=T.x<e.x?-1:1;e.anim='aim_uf';if(--e.fireT<=0&&onscreen&&T){const dx=T.x-e.x;R.eb.push({x:e.x,y:e.y-34,vx:clamp(dx/70,-2.5,2.5),vy:-3.5,g:0.1,t:0,life:200,gren:1});AU.sfx('grenade',{vol:0.4});e.fireT=ri(90,150)/diff}break}
   case'bunker':{if(T)e.face=T.x<e.x?-1:1;if(!onscreen||!T)break;if(e.tel>0){if(--e.tel==0){const a=Math.atan2(T.y-16-(e.y-24),T.x-e.x);for(let i=0;i<3;i++)setTimeout(()=>{if(!e.gone)shoot(e.x+e.face*10,e.y-24,1.8,a)},i*130);AU.sfx('turret',{vol:0.45});e.fireT=ri(90,140)/diff}}
    else if(--e.fireT<=0){e.tel=36;AU.sfx('uisel',{vol:0.25,rate:0.6,gap:0.2})}break}
   case'gunpod':{if(!onscreen||!T)break;e.pt--;if(e.ph==0&&e.pt<=0){e.ph=1;e.pt=32;AU.sfx('uisel',{vol:0.25,rate:0.5,gap:0.2})}
    else if(e.ph==1){e.open=Math.min(1,e.open+0.035);if(e.pt<=0){e.ph=2;e.pt=70;e.shots=0}}
    else if(e.ph==2){if(e.pt%28==0){const a=Math.atan2(T.y-16-(e.y-22),T.x-e.x);for(let i=-1;i<=1;i++)shoot(e.x,e.y-22,1.6,a+i*0.2);AU.sfx('turret',{vol:0.45})}if(e.pt<=0){e.ph=3}}
    else if(e.ph==3){e.open=Math.max(0,e.open-0.05);if(e.open<=0){e.ph=0;e.pt=ri(80,120)/diff}}break}
   case'crate':case'barrel':break;
   case'pod':{e.x+=e.vx;e.y=e.y0+Math.sin(e.t*0.05)*22;if(e.x>R.cx+360)e.gone=1;break}
   case'drone':{const tx=T?T.x:R.cx+100;e.x+=clamp((tx+Math.sin(e.t*0.03+e.ph)*60)-e.x,-1.6,1.6)*0.6-0.2;e.y=50+Math.sin(e.t*0.05+e.ph)*26+e.ph*8;if(e.t%120==60+e.ph*20&&onscreen&&T)shoot(e.x,e.y+4,1.8);break}
   case'crawler':{const gy=R.groundAt(e.x);if(e.y<gy||e.vy<0){e.vy+=0.2;e.y+=e.vy;e.x+=e.vx;if(e.y>=gy){e.y=gy;e.vy=0;e.vx=0}}else{e.x-=0.7;if(--e.jumpT<=0&&T){e.vy=-4;e.vx=clamp((T.x-e.x)/40,-2.2,2.2);e.jumpT=ri(60,110);AU.sfx('jump',{rate:0.6,vol:0.4})}}if(e.y>260)e.gone=1;break}
   case'mortar':{if(!onscreen||!T)break;if(e.tel>0){if(--e.tel==0){R.eb.push({x:e.x,y:e.y-30,vx:clamp((e.tx-e.x)/111,-2,2),vy:-5,g:0.09,t:0,life:240,gren:1,mortar:1});AU.sfx('boom',{vol:0.3,rate:1.3});FX.burst(e.x,e.y-34,6,{c:['#8a8a8a','#5a5a5a'],v0:0.3,v1:1,g:-0.03,l0:20,l1:40,type:'smoke',s:3});e.fireT=ri(110,170)/diff}}
    else if(--e.fireT<=0){e.tel=48;e.tx=T.x;AU.sfx('uisel',{vol:0.25,rate:0.5,gap:0.2})}break}
   case'part':{const sp=R.sp;if(e.rel){e.x=sp.base.x+e.rel[0];e.y=sp.base.y+e.rel[1]}
    if(--e.fireT<=0&&T){if(e.sub=='cannon'){const a=Math.atan2(T.y-16-e.y,T.x-e.x);for(let i=-1;i<=1;i++)shoot(e.x,e.y,1.7,a+i*0.18);AU.sfx('turret',{vol:0.6});e.fireT=ri(80,120)/diff}
     else if(e.sub=='light'||e.sub=='rotor'){R.eb.push({x:e.x,y:e.y,vx:-1.6,vy:-3,g:0.1,t:0,life:200,gren:1});e.fireT=ri(90,140)/diff}
     else if(e.sub=='core'){shoot(e.x,e.y,1.4);e.fireT=ri(60,100)/diff}}
    break}
  }
  // set-piece movement
  if(e.k=='part'&&R.sp&&e===R.sp.parts.find(q=>!q.gone)){const sp=R.sp;sp.t++;
   if(sp.move){const tx=R.setX+200+Math.sin(sp.t*0.01)*30;sp.base.x+=clamp(tx-sp.base.x,-0.8,0.8)}
   if(sp.fly){sp.base.x=R.setX+180+Math.sin(sp.t*0.012)*90;sp.base.y=70+Math.sin(sp.t*0.031)*16}
   if(sp.jets&&sp.t%240==120){R.en.push({k:'jet',x:R.cx+380,y:40,t:0,hp:3,vx:-4,face:-1,vy:0})}
   if(R.n==5&&sp.t%150==75)R.en.push({k:'crawler',x:sp.base.x,y:sp.base.y,t:0,hp:2,jumpT:20,face:-1,vx:0,vy:0})}
  if(e.k=='jet'){e.x+=e.vx;if(e.t%10==0&&e.x>R.cx&&e.x<R.cx+320)R.eb.push({x:e.x,y:e.y+6,vx:-1,vy:2.2,t:0,life:120});if(e.x<R.cx-60)e.gone=1}
  if(e.obs&&e.hp0&&e.k!='barrel'&&e.k!='crate'){const f=e.hp/e.hp0;if(f<0.6&&e.t%7==0)FX.add({x:e.x+rnd(-8,8),y:e.y-18,vx:rnd(-0.2,0.2),vy:-0.6,g:-0.01,life:40,t:0,c:f<0.3?'#2a2424':'#6a6460',s:3,type:'smoke'});if(f<0.35&&e.t%11==0)FX.burst(e.x+rnd(-10,10),e.y-rnd(8,20),3,{c:['#fff','#ffd040'],v0:0.6,v1:1.8,g:0.15,l0:6,l1:12})}
  if(e.k=='barrel'&&e.fuse>0&&--e.fuse==0&&!e.gone)R.killEnemy(e,e.fuseBy);
  if(e.k=='bunker'){const rows=Math.max(1,Math.ceil(e.hp/e.hp0*3));if(rows<e.rows){e.rows=rows;FX.burst(e.x,e.y-6-rows*7,14,{c:[OBS_PAL[R.n].bag,OBS_PAL[R.n].bagD,'#3a3020'],v0:1,v1:3,g:0.2,l0:20,l1:40,s:2});FX.shake=Math.max(FX.shake,2);AU.sfx('block',{vol:0.4,rate:0.7})}}
  // touch damage
  if(T&&e.k!='part'&&e.k!='pod'&&!e.obs){for(const p of tgts){const h=p.prone?10:30;if(Math.abs(p.x-e.x)<10&&p.y-h<e.y&&p.y>e.y-30)R.hitPlayer(p)}}},
 enemyBox(e){switch(e.k){case'bunker':return[e.x-16,e.x+16,e.y-30,e.y];case'gunpod':return[e.x-14,e.x+14,e.y-32,e.y];case'crate':return[e.x-12,e.x+12,e.y-32,e.y];case'barrel':return[e.x-8,e.x+8,e.y-32,e.y];case'pod':return[e.x-8,e.x+8,e.y-6,e.y+6];case'drone':return[e.x-8,e.x+8,e.y-6,e.y+6];case'jet':return[e.x-14,e.x+14,e.y-5,e.y+5];case'crawler':return[e.x-9,e.x+9,e.y-12,e.y];case'mortar':return[e.x-16,e.x+16,e.y-34,e.y];
  case'part':return e.sub=='core'?[e.x-12,e.x+12,e.y-12,e.y+12]:[e.x-10,e.x+10,e.y-10,e.y+10];default:return[e.x-6,e.x+6,e.y-34,e.y]}},
 killEnemy(e,by){const R=this;e.gone=1;const sc={runner:100,rifle:150,sniper:300,gren:200,bunker:600,gunpod:700,crate:200,barrel:100,pod:100,drone:200,crawler:200,mortar:600,part:1500,jet:800}[e.k]||100;if(by&&by.p)by.p.score+=sc;
  if(e.k=='runner'||e.k=='rifle'||e.k=='sniper'||e.k=='gren'){R.corpses=R.corpses||[];R.corpses.push({id:e.id,x:e.x,y:e.y,face:e.face,t:0});AU.sfx('hitm',{vol:0.45,gap:0.1});if(SV.blood)Duel.blood(e.x,e.y-20,-e.face,8);else FX.burst(e.x,e.y-20,6,{c:['#fff','#ffd060'],v0:1,v1:2,g:0.1,l0:8,l1:14})}
  else if(e.k=='crawler'){AU.sfx('splat',{vol:0.6});FX.burst(e.x,e.y-8,12,{c:SV.blood?['#60d020','#a0ff40','#2a6a10']:['#fff','#ccc'],v0:1,v1:3,g:0.2,l0:20,l1:50,floor:e.y,stick:1,s:2})}
  else if(e.obs){R.obsDie(e,by)}
  else{boom(e.x,e.y-(e.k=='part'?0:10),e.k=='part'?1.6:0.8,e.k=='part'?'bigboom':'boom')}
  if(sc&&e.k!='runner')R.pop(e.x,e.y-36,sc);
  if(e.k=='pod')R.items.push({k:e.item,x:e.x,y:e.y,vx:1,vy:-3,t:0});
  if(e.k=='part'&&R.sp&&R.sp.parts.every(q=>q.gone)){// set piece destroyed
   for(let i=0;i<8;i++)setTimeout(()=>boom(R.sp.base.x+rnd(-50,50),R.sp.base.y-rnd(0,50),1.4,'bigboom'),i*140);FX.flash=8;FX.flashC='#fff';R.lock=null;R.en.forEach(q=>{if(q.k=='jet')q.gone=1});R.say('DESTROYED',40,80,3,90);AU.vo('excellent');R.cfg.players.forEach(p=>p.score+=5000);R.sp.dead=1}},
 obsDie(e,by){const R=this,P=OBS_PAL[R.n];const big=e.k=='barrel'?1.3:e.k=='crate'?0.7:1.4;
  boom(e.x,e.y-12,big,e.k=='crate'?'smallboom':'boom');FX.shake=Math.max(FX.shake,e.k=='crate'?2:5);
  const deb=e.k=='bunker'?[P.bag,P.bagD,'#2a2018']:e.k=='barrel'?[P.drum,P.band,'#2a2a2a']:e.k=='crate'?['#a07a40','#6a4a20']:[P.metal,'#2a2a2e','#8a8a90'];
  FX.burst(e.x,e.y-12,e.k=='barrel'?10:18,{c:deb,v0:1.5,v1:4.5,g:0.22,l0:30,l1:60,s:3,floor:e.y,stick:1});
  if(e.k!='crate'){FX.flash=Math.max(FX.flash,2);FX.flashC='#ffe0a0'}
  if(e.drop)R.items.push({k:e.drop,x:e.x,y:e.y-20,vx:-0.6,vy:-3.2,t:0});
  if(e.k=='crate')return;
  // blast: chains barrels, hurts nearby enemies and players
  const rad=e.k=='barrel'?46:30,dmg=e.k=='barrel'?8:3;
  for(const q of R.en){if(q===e||q.gone)continue;const bx=R.enemyBox(q);if(!bx)continue;const d=Math.hypot((bx[0]+bx[1])/2-e.x,(bx[2]+bx[3])/2-(e.y-8));if(d>rad)continue;
   if(q.k=='barrel'){if(!q.fuse){q.fuse=8;q.fuseBy=by}}else{q.hp-=dmg;q.flash=6;if(q.hp<=0)R.killEnemy(q,by)}}
  if(e.k=='barrel')for(const p of R.pl)if(Math.abs(p.x-e.x)<24&&Math.abs(p.y-e.y)<30)R.hitPlayer(p)},
 pop(x,y,n){(this.pops=this.pops||[]).push({x,y,s:String(n),t:0})},
 updBullets(){const R=this;
  for(const b of R.pb){b.t++;if(b.spiral){const perp=b.ang+Math.PI/2;const w=Math.sin(b.t*0.45)*1.6;b.x+=Math.cos(b.ang)*3.6+Math.cos(perp)*w;b.y+=Math.sin(b.ang)*3.6+Math.sin(perp)*w}else{b.vy+=b.g||0;b.x+=b.vx;b.y+=b.vy}
   if(b.fire&&b.t%2==0)FX.add({x:b.x,y:b.y,vx:0,vy:-0.2,g:0,life:10,t:0,c:'#ff8020',s:2,type:'fire'});
   if(b.gren){const gy=R.groundAt(b.x);if(b.y>=gy){b.dead=1;boom(b.x,gy-6,1.4,'boom');for(const e of R.en){const bx=R.enemyBox(e);if(bx&&Math.abs((bx[0]+bx[1])/2-b.x)<34&&Math.abs((bx[2]+bx[3])/2-b.y)<40){e.hp-=b.dmg;if(e.hp<=0)R.killEnemy(e,b.owner)}}continue}}
   if(b.x<R.cx-20||b.x>R.cx+340||b.y<-20||b.y>260||b.t>b.life){b.dead=1;continue}
   for(const e of R.en){if(e.gone||b.hit&&b.hit.has(e))continue;const bx=R.enemyBox(e);if(!bx)continue;const r=b.r+(b.laser?6:0);if(b.x+r>bx[0]&&b.x-r<bx[1]&&b.y+r>bx[2]&&b.y-r<bx[3]){
     if(b.gren){b.y=999;continue}e.hp-=b.dmg;e.flash=4;if(b.hit)b.hit.add(e);if(b.pierce>0)b.pierce--;else b.dead=1;
     FX.burst(b.x,b.y,3,{c:['#fff','#ffe080'],v0:0.5,v1:1.6,g:0,l0:4,l1:8});if(e.k=='gunpod'&&e.open<0.6){e.hp+=b.dmg*0.55;FX.burst(b.x,b.y,3,{c:['#fff','#9ad0ff'],v0:1,v1:2.5,g:0.1,l0:5,l1:10})}if(e.big||e.k=='bunker'||e.k=='gunpod'||e.k=='mortar')AU.sfx('block',{vol:0.3,rate:1.5,gap:0.06});
     if(e.hp<=0)R.killEnemy(e,b.owner);if(b.dead)break}}}
  R.pb=R.pb.filter(b=>!b.dead);
  for(const b of R.eb){b.t++;b.vy+=b.g||0;b.x+=b.vx;b.y+=b.vy;if(b.gren){const gy=R.groundAt(b.x);if(b.y>=gy){b.dead=1;boom(b.x,gy-4,b.mortar?1.1:0.9,'smallboom');for(const p of R.pl)if(Math.abs(p.x-b.x)<20&&Math.abs(p.y-gy)<16)R.hitPlayer(p);continue}}
   if(b.t>b.life||b.x<R.cx-20||b.x>R.cx+340||b.y>260){b.dead=1;continue}
   for(const p of R.pl){if(!p.alive||p.dead)continue;const h=p.prone?10:!p.on?20:32;const top=p.y-h,w=p.prone?14:5;if(b.x>p.x-w&&b.x<p.x+w&&b.y>top&&b.y<p.y){b.dead=1;R.hitPlayer(p);break}}}
  R.eb=R.eb.filter(b=>!b.dead)},
 updItems(){const R=this;for(const it of R.items){it.t++;it.vy+=0.15;it.x+=it.vx;it.y+=it.vy;const gy=R.groundAt(it.x);if(it.y>=gy-6){it.y=gy-6;it.vy=0;it.vx=0}if(it.t>900||it.x<R.cx-20)it.dead=1}R.items=R.items.filter(i=>!i.dead);if(R.pops){for(const q of R.pops)q.t++;R.pops=R.pops.filter(q=>q.t<50)}},
 // ---------- draw ----------
 draw(g){const R=this,sh=FX.shake?rnd(-FX.shake,FX.shake):0;const cx=Math.round(R.cx+sh),cy=Math.round(sh*0.5);
  g.fillStyle=R.S.sky;g.fillRect(0,0,VW,VH);
  if(R.bg){const f=(R.bg.width-320)/Math.max(1,R.L-320);g.drawImage(R.bg,-Math.round(R.cx*f),cy-8)}
  // mid parallax
  const mx=-Math.round(cx*0.45)%320;g.globalAlpha=0.8;g.drawImage(R.mid,mx,cy);g.drawImage(R.mid,mx+320,cy);g.globalAlpha=0.16;g.fillStyle='#7080a0';g.fillRect(0,0,VW,VH);g.globalAlpha=1;
  // decor (towers)
  for(const d of R.decor){if(d.x<cx-40||d.x>cx+360)continue;const x=d.x-cx;g.fillStyle='#2a1e14';g.fillRect(x-14,d.y+cy,3,240);g.fillRect(x+11,d.y+cy,3,240);for(let y=d.y+10;y<240;y+=14){g.fillRect(x-14,y+cy,28,2)}}
  // ground
  g.save();g.translate(-cx,cy);g.fillStyle=R.tile;for(const s of R.ground){if(s.x1<cx||s.x0>cx+320)continue;g.save();g.translate(0,s.y);g.fillRect(s.x0,0,s.x1-s.x0,250-s.y);g.restore();g.fillStyle='rgba(0,0,0,0.4)';g.fillRect(s.x1-2,s.y,2,250);g.fillRect(s.x0,s.y,2,250);g.fillStyle=R.tile}
  // pits: water/void
  for(const p of R.plats){if(p.x1<cx||p.x0>cx+320)continue;const w=p.x1-p.x0;if(p.k=='bridge'){g.fillStyle='#4a3420';g.fillRect(p.x0,p.y,w,4);g.fillStyle='#6a4a2a';for(let x=p.x0;x<p.x1;x+=6)g.fillRect(x,p.y,5,2);g.fillStyle='#2a1a10';g.fillRect(p.x0,p.y+4,w,1)}else{g.fillStyle=R.S.ground[2];g.fillRect(p.x0,p.y,w,5);g.fillStyle='rgba(255,255,255,0.3)';g.fillRect(p.x0,p.y,w,1);g.fillStyle='rgba(0,0,0,0.5)';g.fillRect(p.x0,p.y+5,w,1);g.fillStyle=R.S.ground[3];g.fillRect(p.x0+4,p.y+6,2,8);g.fillRect(p.x1-6,p.y+6,2,8)}}
  g.restore();
  // set piece base
  if(R.sp&&!R.sp.dead)R.drawSet(g,cx,cy);
  // corpses
  if(R.corpses){for(const c of R.corpses){c.t++;const A=ANIM.A.die;const fi=Math.min(2,Math.floor(c.t/7));const s=SPR.render(c.id,A.f[fi],PS,c.face<0,'die'+fi);if(c.t<120||c.t%4<2)g.drawImage(s.c,Math.round(c.x-cx-s.ox),Math.round(c.y+cy-s.oy))}R.corpses=R.corpses.filter(c=>c.t<150)}
  // enemies
  for(const e of R.en)R.drawEnemy(g,e,cx,cy);
  // items
  for(const it of R.items){const x=Math.round(it.x-cx),y=Math.round(it.y+cy);const pu=0.5+0.5*Math.sin(it.t*0.2);glow(g,x,y,13+pu*4,'#ffd040',0.22+pu*0.18);g.fillStyle='#fff';g.fillRect(x-9,y-8,18,16);g.fillStyle='#000';g.fillRect(x-8,y-7,16,14);g.fillStyle=it.t%16<8?'#e02020':'#ff5030';g.fillRect(x-7,y-6,14,12);g.fillStyle='#ffd040';g.fillRect(x-7,y-6,14,2);g.fillStyle='#8a0808';g.fillRect(x-7,y+4,14,2);txt(g,it.k,x-2,y-3,'#fff',{shc:'#400000'})}
  if(R.pops)for(const q of R.pops){txt(g,q.s,Math.round(q.x-cx-q.s.length*2),Math.round(q.y+cy-q.t*0.5),q.t%8<4?'#fff':'#ffe060',{shc:'#000'})}
  // players
  for(const p of R.pl){if(!p.alive)continue;if(p.inv>0&&!p.dead&&R.t%4<2)continue;const A=ANIM.A[p.anim];const fi=A.loop?Math.floor(p.at/60*A.fps)%A.f.length:Math.min(A.f.length-1,Math.floor((p.dead?p.dead:p.at)/60*A.fps));
   const s=SPR.render(p.id,A.f[fi],PS,p.face<0,p.anim+fi);const x=Math.round(p.x-cx-s.ox),y=Math.round(p.y+cy-s.oy+(p.anim=='flip'?-8:0));g.drawImage(s.c,x,y);
   if(R.pl.length>1){txt(g,p.pl==0?'1P':'2P',p.x-cx-5,y-8,p.pl==0?'#60c0ff':'#ff8060')}}
  // bullets
  for(const b of R.pb){const x=Math.round(b.x-cx),y=Math.round(b.y+cy);if(b.laser){g.strokeStyle='#40c0ff';g.lineWidth=3;g.beginPath();g.moveTo(x-b.vx*2.2,y-b.vy*2.2);g.lineTo(x+b.vx*0.6,y+b.vy*0.6);g.stroke();g.strokeStyle='#e0faff';g.lineWidth=1;g.stroke();continue}
   if(b.gren){g.fillStyle='#000';g.fillRect(x-3,y-3,6,6);g.fillStyle='#4a6a2a';g.fillRect(x-2,y-2,4,4);continue}
   const r=Math.ceil(b.r);glow(g,x,y,r*3.2,b.col,0.5);g.strokeStyle=b.col;g.globalAlpha=0.55;g.lineWidth=r;g.beginPath();g.moveTo(x-b.vx*1.6,y-b.vy*1.6);g.lineTo(x,y);g.stroke();g.globalAlpha=1;g.fillStyle=b.fire?'#a02008':'#000';g.fillRect(x-r-1,y-r,r*2+2,r*2);g.fillRect(x-r,y-r-1,r*2,r*2+2);g.fillStyle=b.col;g.fillRect(x-r,y-r,r*2,r*2);g.fillStyle='#fff';g.fillRect(x-r+0.5,y-r+0.5,r*2-1,r*2-1)}
  for(const b of R.eb){const x=Math.round(b.x-cx),y=Math.round(b.y+cy);if(b.gren){g.fillStyle='#000';g.fillRect(x-3,y-3,6,6);g.fillStyle=b.mortar?'#8a8a8a':'#3a3a2a';g.fillRect(x-2,y-2,4,4);continue}glow(g,x,y,8,'#ff3070',0.55);g.fillStyle='#000';g.fillRect(x-3.5,y-2.5,7,5);g.fillRect(x-2.5,y-3.5,5,7);g.fillStyle=R.t%6<3?'#ff4080':'#ff90b8';g.fillRect(x-3,y-2,6,4);g.fillRect(x-2,y-3,4,6);g.fillStyle='#fff';g.fillRect(x-1.5,y-1.5,3,3)}
  FX.draw(g,cx,-cy);
  R.hud(g);
  for(const m of R.msg){const age=R.t-m.t0;if(age<0||age>m.life)continue;if(m.sc==1)txt(g,m.s,160,m.y,'#ffe060',{a:'c'});else big(g,m.s,160,m.y-m.sc*3.5,m.sc,{sx:age<8?0.3+age/8*0.7:1,c1:'#ffffff',c2:m.s=='WARNING'?'#ff2000':'#40a0ff'})}
  if(FX.flash>0){g.globalAlpha=Math.min(1,FX.flash/8);g.fillStyle=FX.flashC;g.fillRect(0,0,VW,VH);g.globalAlpha=1}
  if(R.endT>200){g.globalAlpha=Math.min(1,(R.endT-200)/60);g.fillStyle='#000';g.fillRect(0,0,VW,VH);g.globalAlpha=1}},
 drawEnemy(g,e,cx,cy){const R=this,x=Math.round(e.x-cx),y=Math.round(e.y+cy);if(e.flash>0){e.flash--}
  if(e.id&&(e.k=='runner'||e.k=='rifle'||e.k=='sniper'||e.k=='gren')){const A=ANIM.A[e.anim||'aim_f'];const fi=A.loop?Math.floor(e.t/60*A.fps)%A.f.length:0;const s=SPR.render(e.id,A.f[fi],PS,e.face<0,(e.anim||'aim_f')+fi);g.drawImage(s.c,x-s.ox,y-s.oy);if(e.flash>0){g.globalAlpha=0.9;g.drawImage(SPR.flash(s),x-s.ox,y-s.oy);g.globalAlpha=1}return}
  switch(e.k){
   case'bunker':case'gunpod':case'crate':case'barrel':case'mortar':R.drawObs(g,e,x,y);break;
   case'pod':g.fillStyle='#000';g.fillRect(x-9,y-5,18,10);g.fillStyle=e.flash?'#fff':'#a0a0a8';g.fillRect(x-8,y-4,16,8);g.fillStyle='#e02020';g.fillRect(x-3,y-4,6,8);g.fillStyle='#fff';g.fillRect(x-8,y-4,16,1);g.fillStyle='#606068';g.fillRect(x-12+(e.t%6<3?0:1),y-1,4,2);g.fillRect(x+8,y-1,4,2);break;
   case'drone':g.fillStyle='#000';g.fillRect(x-9,y-4,18,8);g.fillStyle=e.flash?'#fff':'#3a4048';g.fillRect(x-8,y-3,16,6);g.fillStyle='#ff3030';g.fillRect(x-2,y-1,4,2);g.fillStyle='#8a9098';g.fillRect(x-11,y-6,8,1);g.fillRect(x+3,y-6,8,1);break;
   case'jet':g.fillStyle='#000';g.fillRect(x-16,y-3,32,7);g.fillStyle='#5a6070';g.fillRect(x-15,y-2,30,5);g.fillStyle='#3a4048';g.beginPath();g.moveTo(x+4,y);g.lineTo(x+14,y-10);g.lineTo(x+16,y);g.fill();g.fillStyle=R.t%4<2?'#ffe060':'#ff6020';g.fillRect(x+15,y-1,4,3);break;
   case'crawler':{g.fillStyle='#000';g.fillRect(x-10,y-12,20,12);g.fillStyle=e.flash?'#fff':'#5a8a3a';g.fillRect(x-9,y-11,18,10);g.fillStyle='#3a5a2a';for(let i=0;i<3;i++)g.fillRect(x-8+i*6,y-3+((e.t>>2)+i)%2,3,4);g.fillStyle='#ffe23a';g.fillRect(x-7,y-9,2,2);g.fillRect(x-3,y-9,2,2);break}
   case'part':R.drawPart(g,e,x,y);break;
  }},
 drawObs(g,e,x,y){const R=this,P=OBS_PAL[R.n],F=e.flash>0,C=c=>F?'#fff':c,f=e.hp0?e.hp/e.hp0:1;
  const box=(x0,y0,w,h,c)=>{g.fillStyle='#000';g.fillRect(x0-1,y0-1,w+2,h+2);g.fillStyle=C(c);g.fillRect(x0,y0,w,h)};
  const cracks=n=>{if(F)return;g.strokeStyle='rgba(0,0,0,0.75)';g.lineWidth=1;for(let i=0;i<n;i++){const sx=x-10+((i*37+e.x)%20),sy=y-22+((i*13)%14);g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+3,sy+4);g.lineTo(sx+1,sy+8);g.stroke()}};
  const tele=(tx,ty,k)=>{if(k<=0)return;const on=(k>>2)%2;glow(g,tx,ty,10+on*4,'#ff3020',0.5+on*0.3);g.fillStyle=on?'#fff':'#ff3020';g.fillRect(tx-1,ty-14,3,7);g.fillRect(tx-1,ty-5,3,3)};
  switch(e.k){
   case'bunker':{// gunner behind sandbags
    const up=e.tel>0?1:0.6;const gy=y-22-Math.round(up*6);box(x-6,gy,12,10,'#3a3a2a');g.fillStyle=C(P.metal);g.fillRect(x-7,gy-3,14,4);g.fillStyle='#000';g.fillRect(x-4,gy+3,8,2);
    box(x+(e.face>0?4:-16),gy+5,12,3,'#2a2a2e');if(e.tel>0)tele(x+e.face*14,gy+6,e.tel);
    for(let r=0;r<e.rows;r++){const ry=y-8-r*7,n=4-(r==2?1:0),w=34-(r==2?8:0);for(let i=0;i<n;i++){const bx=x-w/2+i*(w/n);box(Math.round(bx),ry,Math.round(w/n)-1,6,(i+r)%2?P.bag:P.bagD);if(!F){g.fillStyle='rgba(255,255,255,0.18)';g.fillRect(Math.round(bx),ry,Math.round(w/n)-1,1)}}}
    if(f<0.66)cracks(f<0.33?4:2);break}
   case'gunpod':{const o=e.open;box(x-14,y-10,28,10,'#2a2a30');g.fillStyle=C(P.band);for(let i=0;i<4;i++)g.fillRect(x-12+i*7,y-9,3,2);
    // dome halves slide apart to reveal glowing weak point
    const core=y-22;if(o>0.05){glow(g,x,core,8+o*6,'#ff4020',0.35+o*0.4);box(x-5,core-5,10,10,(R.t>>2)%2?'#ff3020':'#ffb040');g.save();g.translate(x,core);const T=R.pl.find(p=>p.alive);g.rotate(T?Math.atan2(T.y-16-core,T.x-x):Math.PI);g.fillStyle='#000';g.fillRect(3,-3,13*o,6);g.fillStyle=C('#5a5e66');g.fillRect(3,-2,13*o,4);g.restore()}
    const sh=Math.round(o*10);box(x-13-sh,y-31,13,21,P.metal);box(x+sh,y-31,13,21,P.metal);if(!F){g.fillStyle='rgba(255,255,255,0.25)';g.fillRect(x-13-sh,y-31,13,2);g.fillRect(x+sh,y-31,13,2);g.fillStyle='rgba(0,0,0,0.35)';g.fillRect(x-13-sh,y-20,13,2);g.fillRect(x+sh,y-20,13,2)}
    if(e.ph==1)tele(x,y-36,e.pt);if(f<0.66)cracks(f<0.33?4:2);break}
   case'mortar':{box(x-16,y-12,32,12,P.bagD);for(let i=0;i<4;i++)box(x-16+i*8,y-18,7,6,i%2?P.bag:P.bagD);
    g.save();g.translate(x,y-16);g.rotate(-0.5);g.fillStyle='#000';g.fillRect(-4,-20,8,20);const hot=e.tel>0?1-e.tel/48:0;g.fillStyle=C(hot>0?`rgb(${100+hot*155|0},${90+hot*40|0},80)`:'#6a6a6a');g.fillRect(-3,-19,6,18);g.restore();
    if(e.tel>0){tele(x+8,y-40,e.tel);const tx=Math.round(e.tx-(R.cx|0)),ty=Math.round(R.groundAt(e.tx));if(ty<900){const on=(e.tel>>2)%2;g.strokeStyle=on?'#ff3020':'#ffd040';g.lineWidth=1.5;g.beginPath();g.arc(tx,ty-3,6+e.tel/4,0,7);g.stroke();g.beginPath();g.moveTo(tx-10,ty-3);g.lineTo(tx+10,ty-3);g.moveTo(tx,ty-13);g.lineTo(tx,ty+5);g.stroke()}}
    if(f<0.66)cracks(f<0.33?4:2);break}
   case'crate':{box(x-12,y-4,24,4,'#4a3418');box(x-11,y-30,22,26,'#8a6a34');if(!F){g.fillStyle='#5a4220';g.fillRect(x-11,y-18,22,2);g.fillRect(x-1,y-30,2,26);g.fillStyle='rgba(255,255,255,0.25)';g.fillRect(x-11,y-30,22,1)}g.fillStyle=C('#ffd040');g.fillRect(x-5,y-27,10,5);g.fillStyle='#000';g.fillRect(x-1,y-26,2,3);if(e.hp<e.hp0)cracks(e.hp<2?3:1);break}
   case'barrel':{const hot=e.fuse>0&&(e.fuse>>1)%2;box(x-7,y-22,14,22,hot?'#fff':P.drum);g.fillStyle=C(P.band);g.fillRect(x-7,y-17,14,2);g.fillRect(x-7,y-7,14,2);if(!F){g.fillStyle='rgba(255,255,255,0.3)';g.fillRect(x-5,y-21,2,20);g.fillStyle='#000';g.fillRect(x-2,y-14,4,4);g.fillStyle='#ffd040';g.fillRect(x-1,y-13,2,2)}if(e.hp<e.hp0&&R.t%6<3)FX.add({x:e.x+rnd(-2,2),y:e.y-23,vx:0,vy:-0.4,g:0,life:12,t:0,c:'#ff8020',s:2,type:'fire'});break}
  }
  if(e.k!='barrel'&&e.hp<e.hp0){const w=24;g.fillStyle='#000';g.fillRect(x-w/2-1,y-(e.k=='mortar'?44:e.k=='crate'?36:38),w+2,4);g.fillStyle=f>0.5?'#60e040':f>0.25?'#ffd040':'#ff3020';g.fillRect(x-w/2,y-(e.k=='mortar'?43:e.k=='crate'?35:37),Math.max(1,Math.round(w*f)),2)}},
 drawSet(g,cx,cy){const R=this,sp=R.sp,b=sp.base,x=Math.round(b.x-cx),y=Math.round(b.y+cy);
  switch(sp.kind){
   case'gunboat':g.fillStyle='#2a3a4a';g.fillRect(x-80,y-6,160,20);g.fillStyle='#3a3a30';g.beginPath();g.moveTo(x-74,y-22);g.lineTo(x+70,y-22);g.lineTo(x+60,y);g.lineTo(x-64,y);g.fill();g.fillStyle='#4a4a3e';g.fillRect(x-40,y-46,70,24);g.fillStyle='#22221c';for(let i=0;i<5;i++)g.fillRect(x-34+i*13,y-40,8,4);break;
   case'tank':g.fillStyle='#2a2a26';g.fillRect(x-56,y-24,112,24);g.fillStyle='#4a4a40';g.fillRect(x-44,y-46,80,24);g.fillStyle='#14140f';for(let i=0;i<8;i++)g.fillRect(x-52+i*14,y-10,10,10);g.fillStyle='#ffffa0';g.globalAlpha=0.18;g.beginPath();g.moveTo(x+8,y-40);g.lineTo(x-200,y+10);g.lineTo(x-140,y+30);g.fill();g.globalAlpha=1;break;
   case'heli':g.fillStyle='#2a3038';g.beginPath();g.ellipse(x,y,36,14,0,0,7);g.fill();g.fillRect(x+20,y-4,60,6);g.fillStyle='#80c0e0';g.fillRect(x-30,y-6,14,8);g.fillStyle='#14181c';g.fillRect(x-60+(R.t*13%40),y-18,120-((R.t*13)%40),2);g.fillRect(x-2,y-18,4,6);break;
   case'train':for(let i=-1;i<2;i++){g.fillStyle='#3a4250';g.fillRect(x-60+i*0+i*40-20,y-30,38,26)}g.fillStyle='#2a303a';g.fillRect(x-90,y-34,190,6);g.fillStyle='#14161a';for(let i=0;i<9;i++){g.beginPath();g.arc(x-80+i*22,y-4,5,0,7);g.fill()}g.fillStyle='#4a5260';g.fillRect(x+40,y-48,46,44);break;
   case'breach':g.fillStyle='#1a2a20';g.fillRect(x-40,y-120,80,120);g.fillStyle='rgba(80,255,120,0.3)';g.fillRect(x-32,y-110,64,90);g.fillStyle='#2a3a30';g.fillRect(x-46,y-124,92,10);g.fillStyle='#0e1a12';g.fillRect(x-46,y-12,92,12);if(R.t%30<15){g.fillStyle='#ff3020';g.fillRect(x-4,y-122,8,4)}break;
   case'deckgun':g.fillStyle='#3a3e46';g.fillRect(x-60,y-30,120,30);g.fillStyle='#4a4e58';g.fillRect(x-30,y-54,60,26);g.fillStyle='#ffd040';for(let i=0;i<6;i++)g.fillRect(x-56+i*20,y-28,10,2);break;
  }},
 drawPart(g,e,x,y){const R=this;const T=R.pl.find(p=>p.alive);const a=T?Math.atan2(T.y-16-e.y,T.x-e.x):Math.PI;
  if(e.sub=='core'){const pulse=(R.t>>3)%2;g.fillStyle='#000';g.fillRect(x-13,y-13,26,26);g.fillStyle=e.flash?'#fff':pulse?'#ff3020':'#c01810';g.fillRect(x-11,y-11,22,22);g.fillStyle='#ffd0a0';g.fillRect(x-4,y-4,8,8);g.fillStyle='rgba(255,255,255,0.5)';g.fillRect(x-11,y-11,22,2)}
  else if(e.sub=='rotor'){g.fillStyle=e.flash?'#fff':'#5a6068';g.fillRect(x-8,y-6,16,12);g.fillStyle='#ff4030';g.fillRect(x-3,y-2,6,4)}
  else{g.fillStyle='#000';g.fillRect(x-11,y-9,22,18);g.fillStyle=e.flash?'#fff':'#5a5e66';g.fillRect(x-10,y-8,20,16);g.save();g.translate(x,y);g.rotate(a);g.fillStyle='#2a2a2e';g.fillRect(2,-3,16,6);g.restore();g.fillStyle='#e04020';g.fillRect(x-3,y-3,6,6)}
  // hp pip
  const f=e.hp/e.hp0;g.fillStyle='#000';g.fillRect(x-10,y-16,20,3);g.fillStyle=f>0.5?'#60e040':f>0.25?'#ffd040':'#ff3020';g.fillRect(x-9,y-15,Math.round(18*f),1)},
 hud(g){const R=this;R.pl.forEach((p,i)=>{const x=i==0?6:220;txt(g,(i==0?'1P ':'2P ')+String(p.p.score).padStart(7,'0'),x,5,i==0?'#80d0ff':'#ffa080');
   for(let k=0;k<Math.min(6,p.p.lives);k++){g.fillStyle='#000';g.fillRect(x+k*8,15,6,9);g.fillStyle=i==0?'#4080ff':'#ff6040';g.fillRect(x+k*8+1,16,4,7);g.fillStyle='#fff';g.fillRect(x+k*8+1,16,4,1)}
   const gk=p.pick&&!p.swap?p.pick:null;txt(g,gk?{S:'S',L:'L',F:'F'}[gk]:'-',x+52,15,gk?'#ff6060':'#888');if(p.pick&&p.swap)txt(g,'('+p.pick+')',x+60,15,'#aa6060');if(p.rapid)txt(g,'R'+p.rapid,x+80,15,'#60ff60');
   for(let k=0;k<p.gren;k++){g.fillStyle='#000';g.fillRect(x+k*6,26,5,5);g.fillStyle='#5a7a3a';g.fillRect(x+k*6+1,27,3,3)}
   if(SV.easy){for(let k=0;k<p.hp;k++){g.fillStyle='#ff4060';g.fillRect(x+24+k*5,27,4,3)}}});
  txt(g,'STAGE '+R.n,160,5,'#ffffff',{a:'c'});
  if(R.sp&&!R.sp.dead&&R.lock!==null){const tot=R.sp.parts.reduce((a,q)=>a+(q.gone?0:q.hp),0),max=R.sp.parts.reduce((a,q)=>a+q.hp0,0);g.fillStyle='#000';g.fillRect(110,15,100,5);g.fillStyle='#ff4020';g.fillRect(111,16,Math.round(98*tot/max),3)}},
};
