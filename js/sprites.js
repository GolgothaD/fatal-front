'use strict';
// ===== Procedural "digitized" fighter renderer =====
// Skeleton poses (units: 100 = full height, origin at feet centre, y up = negative) are drawn with gradient-shaded
// limbs onto an offscreen canvas, then alpha-thresholded, posterized with ordered dither (that scanned-actor look),
// and outlined. Every frame is cached, so runtime cost is a drawImage.
const SPR=(()=>{
const hex=h=>{h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]};
const sh=(c,k)=>{const a=hex(c);return`rgb(${a.map(v=>Math.max(0,Math.min(255,Math.round(k>1?v+(255-v)*(k-1)*0.6+v*(k-1)*0.4:v*k)))).join(',')})`};
const rad=d=>d*Math.PI/180;
const rot=(x,y,a)=>{const c=Math.cos(rad(a)),s=Math.sin(rad(a));return[x*c-y*s,x*s+y*c]};
function ik(ax,ay,tx,ty,l1,l2,bend){let dx=tx-ax,dy=ty-ay,d=Math.hypot(dx,dy);d=Math.max(Math.abs(l1-l2)+0.01,Math.min(l1+l2-0.01,d));
 const a=Math.atan2(dy,dx),al=Math.acos((l1*l1+d*d-l2*l2)/(2*l1*d));const b=a+bend*al;const jx=ax+Math.cos(b)*l1,jy=ay+Math.sin(b)*l1;
 const e=Math.atan2(ty-jy,tx-jx);return[jx,jy,jx+Math.cos(e)*l2,jy+Math.sin(e)*l2]}
// ---------- costumes ----------
const C={
 raze:{name:'RAZE',skin:'#e0a77c',hair:'band',hairC:'#e8c860',band:'#c81e1e',top:'vest',topC:'#8a2a22',top2:'#3a3a32',pants:'#5a3a2a',boots:'#2a2220',belt:'#2a2a20',w:1,arm:1,gun:'rifle'},
 brick:{name:'BRICK',skin:'#6b4630',hair:'bald',hairC:'#3a2a20',top:'vest',topC:'#2e3328',top2:'#1c1e18',pants:'#3a3c30',boots:'#1a1816',belt:'#3a3020',w:1.18,arm:1.2,gun:'shotgun',beard:'stubble'},
 nova:{name:'NOVA',skin:'#e7b490',hair:'pony',hairC:'#5a2c8a',top:'crop',topC:'#4a4a48',top2:'#2a2a2c',pants:'#3a3036',boots:'#1e1a1e',belt:'#5a2c8a',w:0.88,arm:0.85,gun:'smg',fem:1,band:'#5a2c8a'},
 kazan:{name:'KAZAN',skin:'#c48a62',hair:'band',hairC:'#2a1a12',band:'#b41818',top:'gi',topC:'#7a1616',top2:'#3a0e0e',pants:'#5a1414',boots:'#2a1810',belt:'#1a1a1a',w:1.08,arm:1.1,gun:'ember',beard:'full',glowFist:1},
 hask:{name:'MAJOR HASK',skin:'#b58560',hair:'beret',hairC:'#2c4a22',top:'vest',topC:'#4a5a2a',top2:'#2e3a1a',pants:'#3e4a26',boots:'#1e1a14',belt:'#3a2a1a',w:1.05,arm:1.05,weapon:'machete',beard:'mous',eyepatch:1},
 lockjaw:{name:'LOCKJAW',skin:'#c99878',hair:'mohawk',hairC:'#8a1a1a',top:'bare',topC:'#5a3a2a',top2:'#2a2a2a',pants:'#2a2a30',boots:'#141414',belt:'#6a6a70',w:1.3,arm:1.32,weapon:'chain',jaw:1},
 silk:{name:'SILK',skin:'#f0c8a8',hair:'bob',hairC:'#141018',top:'suit',topC:'#1a1a22',top2:'#a01848',pants:'#1a1a22',boots:'#0e0e12',belt:'#a01848',w:0.86,arm:0.84,weapon:'blades',fem:1,mask:'#a01848'},
 varga:{name:'VARGA',skin:'#d8b8a0',hair:'helmet',hairC:'#9ab8d0',top:'armor',topC:'#6a8aa8',top2:'#2a3a50',pants:'#3a4a60',boots:'#1a2230',belt:'#9ab8d0',w:1.1,arm:1.1,visor:'#7af0ff',weapon:'cryo'},
 spec9:{name:'SPECIMEN 9',skin:'#7aa060',hair:'none',hairC:'#4a6a3a',top:'bare',topC:'#5a7a48',top2:'#3a5a2a',pants:'#3a3a3a',boots:'#2a2a2a',belt:'#6a6a6a',w:1.22,arm:1.4,claws:1,veins:1,eyes:'#ffe23a'},
 dread:{name:'COLONEL DREAD',skin:'#c8a088',hair:'cap',hairC:'#2a2a2a',top:'coat',topC:'#3a3a40',top2:'#8a1a1a',pants:'#2a2a30',boots:'#121214',belt:'#8a7a3a',w:1.1,arm:1.08,metalArm:1,eyes:'#ff3030'},
 khan:{name:'IRON KHAN',skin:'#a87858',hair:'horns',hairC:'#3a3a3e',top:'armor',topC:'#4a4a52',top2:'#8a1010',pants:'#2a2a2e',boots:'#18181c',belt:'#b08a2a',w:1.3,arm:1.25,cape:'#6a0c0c',eyes:'#ff5a1a',hScale:1.12},
 grunt:{name:'',skin:'#c99070',hair:'helmetG',hairC:'#4a5236',top:'vest',topC:'#5a6040',top2:'#3a3e2a',pants:'#4a4e36',boots:'#1e1c16',belt:'#2a2a1a',w:1,arm:1,gun:'rifle'},
 gruntR:{name:'',skin:'#b88060',hair:'helmetG',hairC:'#6a2a2a',top:'vest',topC:'#7a3a32',top2:'#3a1e1a',pants:'#4a3030',boots:'#1e1616',belt:'#2a1a1a',w:1,arm:1,gun:'rifle'},
 gruntS:{name:'',skin:'#d0b8a8',hair:'helmetG',hairC:'#d8dce4',top:'vest',topC:'#a8b0bc',top2:'#6a7280',pants:'#8a92a0',boots:'#2a2e36',belt:'#3a3e46',w:1,arm:1,gun:'rifle'},
 gruntL:{name:'',skin:'#6a9060',hair:'none',hairC:'#4a6a3a',top:'bare',topC:'#5a7a48',top2:'#3a5a2a',pants:'#3a3a3a',boots:'#2a2a2a',belt:'#6a6a6a',w:1.05,arm:1.2,claws:1,eyes:'#ffe23a'},
 gruntC:{name:'',skin:'#c99070',hair:'helmetG',hairC:'#1e2230',top:'coat',topC:'#2a3040',top2:'#c02a6a',pants:'#22242e',boots:'#121216',belt:'#3a3a4a',w:1,arm:1,gun:'rifle',visor:'#ff3a8a'},
};
// ---------- primitives ----------
function grad(g,x0,y0,x1,y1,base,lo=0.5,hi=1.28){const L=g.createLinearGradient(x0,y0,x1,y1);L.addColorStop(0,sh(base,lo));L.addColorStop(0.4,sh(base,0.92));L.addColorStop(0.72,sh(base,hi));L.addColorStop(1,sh(base,0.78));return L}
function cap(g,ax,ay,bx,by,wa,wb,col,lo,hi){const dx=bx-ax,dy=by-ay,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;const w=(wa+wb)/2;
 g.fillStyle=grad(g,(ax+bx)/2-nx*w,(ay+by)/2-ny*w,(ax+bx)/2+nx*w,(ay+by)/2+ny*w,col,lo,hi);g.beginPath();g.moveTo(ax+nx*wa,ay+ny*wa);g.lineTo(bx+nx*wb,by+ny*wb);g.lineTo(bx-nx*wb,by-ny*wb);g.lineTo(ax-nx*wa,ay-ny*wa);g.closePath();g.fill();
 g.beginPath();g.arc(ax,ay,wa,0,7);g.fill();g.beginPath();g.arc(bx,by,wb,0,7);g.fill()}
function blob(g,x,y,rx,ry,col,a=0,lo=0.55,hi=1.3){g.save();g.translate(x,y);g.rotate(rad(a));const R=g.createRadialGradient(-rx*0.35,-ry*0.4,0.5,0,0,Math.max(rx,ry)*1.15);R.addColorStop(0,sh(col,hi));R.addColorStop(0.55,sh(col,0.95));R.addColorStop(1,sh(col,lo));g.fillStyle=R;g.beginPath();g.ellipse(0,0,rx,ry,0,0,Math.PI*2);g.fill();g.restore()}
function poly(g,pts,fill){g.fillStyle=fill;g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.closePath();g.fill()}
// ---------- skeleton ----------
function solve(P,cs){const S=cs.hScale||1;const hip=[P.hip[0],P.hip[1]];const lean=P.lean||0;
 const [sx,sy]=rot(0,-30*S,lean);const sho=[hip[0]+sx,hip[1]+sy];const [nx,ny]=rot(0,-9.6*S,lean+(P.head||0));const head=[sho[0]+nx*0.95,sho[1]+ny];
 const L1=25*S,L2=25*S,A1=18*S,A2=17*S;
 const hb=[hip[0]-2.5,hip[1]],hf=[hip[0]+2.5,hip[1]];
 const sb=[sho[0]-3+ rot(0,3,lean)[0],sho[1]+3],sf=[sho[0]+2+rot(0,3,lean)[0],sho[1]+3];
 const legB=ik(hb[0],hb[1],P.f1[0],P.f1[1],L1,L2,P.kb1??-1),legF=ik(hf[0],hf[1],P.f2[0],P.f2[1],L1,L2,P.kb2??-1);
 const armB=ik(sb[0],sb[1],P.h1[0],P.h1[1],A1,A2,P.eb1??1),armF=ik(sf[0],sf[1],P.h2[0],P.h2[1],A1,A2,P.eb2??1);
 return{hip,sho,head,hb,hf,sb,sf,legB,legF,armB,armF,lean,S}}
// ---------- part painters ----------
function leg(g,cs,h,L,back,P){const d=back?0.72:1;const w=cs.w;const pc=cs.pants;const k=[L[0],L[1]],f=[L[2],L[3]];
 cap(g,h[0],h[1],k[0],k[1],6.2*w,4.8*w,sh(pc,d).replace('rgb(','#').startsWith('#')?pc:pc,0.45*d,1.2*d);
 if(back){g.globalAlpha=0.28;cap(g,h[0],h[1],k[0],k[1],6.2*w,4.8*w,'#000000');g.globalAlpha=1}
 cap(g,k[0],k[1],f[0],f[1],4.8*w,3.8*w,pc,0.45,1.2);if(back){g.globalAlpha=0.28;cap(g,k[0],k[1],f[0],f[1],4.8*w,3.8*w,'#000000');g.globalAlpha=1}
 // boot
 const a=Math.atan2(f[1]-k[1],f[0]-k[0]);const bt=cs.boots;const t=P.toe??0;
 const bx=f[0]-Math.cos(a)*6,by=f[1]-Math.sin(a)*6;cap(g,bx,by,f[0],f[1],4.4*w,4.2*w,bt,0.5,1.5);
 g.save();g.translate(f[0],f[1]);g.rotate(rad(t)+ (a-Math.PI/2));const B=g.createLinearGradient(0,-3,0,3);B.addColorStop(0,sh(bt,1.5));B.addColorStop(1,sh(bt,0.5));g.fillStyle=B;g.beginPath();g.moveTo(-4.5*w,-3);g.lineTo(7.5*w,-1.5);g.lineTo(8*w,2.2);g.lineTo(-4.5*w,2.5);g.closePath();g.fill();g.restore();
 if(back){g.globalAlpha=0.3;g.fillStyle='#000';g.beginPath();g.arc(f[0],f[1],4.5*w,0,7);g.fill();g.globalAlpha=1}}
function arm(g,cs,s,A,back,P){const w=cs.arm;const e=[A[0],A[1]],hd=[A[2],A[3]];const sk=cs.skin;const met=cs.metalArm&&!back;
 const sleeve=(cs.top==='coat'||cs.top==='suit'||cs.top==='armor'||cs.top==='gi');
 const uc=met?'#8a8e98':(sleeve?cs.topC:sk), fc=met?'#9aa0aa':(cs.top==='coat'||cs.top==='suit'||cs.top==='armor'?cs.top2:sk);
 cap(g,s[0],s[1],e[0],e[1],5*w,4*w,uc,0.42,1.3);cap(g,e[0],e[1],hd[0],hd[1],4.1*w,3.4*w,fc,0.42,1.3);
 if(!sleeve&&!met){ // bicep highlight
  g.globalAlpha=0.25;blob(g,(s[0]*0.55+e[0]*0.45),(s[1]*0.55+e[1]*0.45),2.2*w,3.5*w,'#ffffff',Math.atan2(e[1]-s[1],e[0]-s[0])*57-90);g.globalAlpha=1}
 if(cs.top==='vest'||cs.top==='crop'){g.globalAlpha=0.9;cap(g,s[0],s[1],s[0]*0.8+e[0]*0.2,s[1]*0.8+e[1]*0.2,5.3*w,5*w,cs.topC);g.globalAlpha=1}
 if(cs.band&&cs.name==='KAZAN'){cap(g,e[0]*0.3+hd[0]*0.7,e[1]*0.3+hd[1]*0.7,hd[0],hd[1],3.8*w,3.6*w,'#d8cfc0',0.5,1.2)}
 if(met){g.fillStyle='#3a3e48';for(let i=1;i<4;i++){const x=e[0]+(hd[0]-e[0])*i/4,y=e[1]+(hd[1]-e[1])*i/4;g.fillRect(x-2,y-0.6,4,1.2)}}
 // fist
 const fist=met?'#b0b6c0':(cs.claws?sk:(cs.top==='gi'||cs.name==='RAZE'||cs.name==='BRICK'||cs.name==='NOVA'?'#2a2622':sk));
 blob(g,hd[0],hd[1],3.9*w,3.6*w,fist,0,0.45,1.5);
 if(cs.claws){g.strokeStyle='#e8e0c8';g.lineWidth=1.1;const a=Math.atan2(hd[1]-e[1],hd[0]-e[0]);for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(hd[0]+Math.cos(a)*3,hd[1]+Math.sin(a)*3+i*1.8);g.lineTo(hd[0]+Math.cos(a+i*0.25)*9,hd[1]+Math.sin(a+i*0.25)*9);g.stroke()}}
 if(back){g.globalAlpha=0.32;g.fillStyle='#000';cap(g,s[0],s[1],e[0],e[1],5*w,4*w,'#000000');cap(g,e[0],e[1],hd[0],hd[1],4.1*w,3.6*w,'#000000');g.globalAlpha=1}
 if(cs.glowFist&&!back&&P.glow){g.globalAlpha=0.55;blob(g,hd[0],hd[1],7,7,'#ffb020',0,0.8,1.6);g.globalAlpha=1}}
function torso(g,cs,K){const w=cs.w;const {hip,sho,lean}=K;const p=(x,y)=>{const[a,b]=rot(x,y,lean);return[hip[0]+a,hip[1]+b]};const S=K.S;
 const sw=12*w,ww=8.5*w, H=30*S;
 const pts=[...p(-ww,0),...p(-sw*0.95,-H*0.72),...p(-sw*0.8,-H*1.02),...p(sw*0.85,-H*1.02),...p(sw,-H*0.7),...p(ww+1,0)];
 const [gx0,gy0]=p(-sw,-H*0.6),[gx1,gy1]=p(sw,-H*0.6);
 const skin=cs.top==='bare'||cs.top==='vest'||cs.top==='crop';
 poly(g,pts,grad(g,gx0,gy0,gx1,gy1,skin?cs.skin:cs.topC,0.45,1.3));
 if(skin){// pecs and abs shading
  const [cx,cy]=p(2*w,-H*0.78);g.globalAlpha=0.22;blob(g,cx+2,cy-1,6*w,4,'#ffffff');g.globalAlpha=0.35;g.fillStyle='#2a140a';
  const [ax,ay]=p(2,-H*0.6);if(!cs.fem){for(let i=0;i<3;i++){const[q,r]=p(3*w,-H*(0.52-i*0.13));g.fillRect(q-3,r,6,0.9)}g.fillRect(...p(1,-H*0.82),0.9,H*0.2)}g.globalAlpha=1;
  if(cs.veins){g.strokeStyle='#3a5a22';g.lineWidth=0.8;g.beginPath();g.moveTo(...p(-4,-H*0.3));g.lineTo(...p(2,-H*0.6));g.lineTo(...p(-1,-H*0.85));g.stroke()}}
 if(cs.top==='vest'){const v=cs.topC;poly(g,[...p(-ww,0),...p(-sw*0.95,-H*0.72),...p(-sw*0.8,-H*1.02),...p(-sw*0.1,-H*1.02),...p(-1,-H*0.45),...p(1,0)],grad(g,gx0,gy0,gx1,gy1,v,0.45,1.2));
  poly(g,[...p(ww+1,0),...p(sw,-H*0.7),...p(sw*0.85,-H*1.02),...p(sw*0.45,-H*1.02),...p(5,-H*0.5),...p(5,0)],grad(g,gx0,gy0,gx1,gy1,v,0.5,1.25));
  g.fillStyle=sh(cs.top2,1);for(let i=0;i<3;i++){const[q,r]=p(-sw*0.6,-H*(0.25+i*0.18));g.fillRect(q,r,4,3)}}
 if(cs.top==='crop'){poly(g,[...p(-sw*0.9,-H*0.62),...p(-sw*0.8,-H*1.02),...p(sw*0.85,-H*1.02),...p(sw*0.95,-H*0.62)],grad(g,gx0,gy0,gx1,gy1,cs.topC,0.45,1.3))}
 if(cs.top==='gi'){g.fillStyle=sh(cs.skin,0.9);poly(g,[...p(-1,-H*1.0),...p(6*w,-H*1.02),...p(2,-H*0.45)],grad(g,gx0,gy0,gx1,gy1,cs.skin,0.5,1.3))}
 if(cs.top==='armor'||cs.top==='coat'){g.fillStyle=sh(cs.top2,1);const[a,b]=p(-sw*0.2,-H*0.95);g.fillRect(a,b,3,H*0.8);
  blob(g,...p(-sw*0.7,-H*0.98),7*w,5*w,cs.top==='armor'?cs.topC:cs.top2,lean,0.4,1.5)}
 if(cs.top==='suit'){g.fillStyle=cs.top2;const[a,b]=p(-2,-H*1.0);g.save();g.translate(a,b);g.rotate(rad(lean+12));g.fillRect(0,0,2,H*0.95);g.restore()}
 if(cs.top==='bare'&&cs.weapon==='chain'){g.strokeStyle='#8a8a90';g.lineWidth=1.6;g.setLineDash([2,1]);g.beginPath();g.moveTo(...p(-sw*0.8,-H*1));g.lineTo(...p(sw*0.9,-H*0.15));g.stroke();g.setLineDash([])}
 // belt
 const bt=[...p(-ww-0.5,1),...p(-ww-0.5,-4.5),...p(ww+1.5,-4.5),...p(ww+1.5,1)];poly(g,bt,grad(g,gx0,gy0,gx1,gy1,cs.belt,0.5,1.5));
 g.fillStyle='#c8b070';const[bx,by]=p(3,-3.5);g.fillRect(bx,by,2.5,3)}
function headP(g,cs,K,P){const S=K.S;const [x,y]=K.head;const a=K.lean+(P.head||0);const sk=cs.skin;g.save();g.translate(x,y);g.rotate(rad(a));
 // neck
 cap(g,0,10*S,0.5,3,3.6*cs.w,3.4,sk,0.4,1.1);
 if(cs.hair==='pony'){cap(g,-4,-5,-12+(P.hairX||0),3+(P.hairY||0),3,2,cs.hairC,0.5,1.4)}
 if(cs.cape&&0){}
 blob(g,0.5,0,6.4,7.6,sk,0,0.5,1.3);
 // jaw / face
 poly(g,[1,2,7,1,6.5,5,3,7.5,-1,7],sk);if(cs.jaw){g.fillStyle='#9aa0a8';g.fillRect(1,3,6.5,4);g.fillStyle='#5a5e66';g.fillRect(2,4.5,5,0.8)}
 const hc=cs.hairC;
 switch(cs.hair){
  case'band':blob(g,-1,-3,6.8,5.5,hc,0,0.5,1.5);g.fillStyle=cs.band;g.fillRect(-6.5,-3.5,13.4,2.6);cap(g,-6,-2.5,-11+(P.hairX||0)*0.6,1+(P.hairY||0)*0.5,1.3,0.8,cs.band);
   if(cs.name==='RAZE'){g.fillStyle=sh(hc,1.3);poly(g,[-6,-4,-3,-9,1,-8,5,-7,7,-4],sh(hc,1.15))}break;
  case'pony':blob(g,-0.5,-3,6.8,5.5,hc,0,0.5,1.5);g.fillStyle=cs.band;g.fillRect(-7,-2,2.5,2.5);poly(g,[2,-7,7.5,-3.5,6.5,0,3,-4],sh(hc,1.1));break;
  case'bob':blob(g,-0.5,-2,7.2,6.5,hc,0,0.5,1.6);poly(g,[-7,-1,-7,6,-3,6,-3,0],sh(hc,0.8));break;
  case'mohawk':poly(g,[-6,-6,-3,-12,2,-11,5,-7,1,-6],sh(hc,1.1));break;
  case'beret':blob(g,-0.5,-6,7.4,3.4,hc,-8,0.5,1.4);g.fillStyle='#c8b040';g.fillRect(3,-7,1.6,1.6);break;
  case'helmet':blob(g,0,-2.5,7.5,7,hc,0,0.4,1.6);g.fillStyle=cs.visor||'#7af0ff';g.fillRect(1.5,-1.5,6.2,2.4);break;
  case'helmetG':blob(g,0,-3.5,7.4,5.5,hc,0,0.45,1.5);g.fillStyle=sh(hc,0.6);g.fillRect(-7,-1,14.5,1.4);if(cs.visor){g.fillStyle=cs.visor;g.fillRect(2,-0.5,5.5,2)}break;
  case'cap':blob(g,-0.5,-5,7,3.6,hc,0,0.5,1.4);g.fillStyle=sh(hc,0.5);g.fillRect(1,-3,9,1.5);g.fillStyle='#c8a830';g.fillRect(2,-6.5,2,2);break;
  case'horns':blob(g,0,-2,7.6,7.4,hc,0,0.35,1.6);g.fillStyle='#e8dcc0';poly(g,[-4,-7,-10,-14,-11,-11,-5,-4],'#d8ccb0');poly(g,[3,-8,6,-16,8,-14,6,-6],'#e8dcc0');g.fillStyle=cs.eyes;g.fillRect(2,-1,5.5,1.8);break;
  case'bald':g.globalAlpha=0.3;blob(g,-1,-4,4,2.4,'#ffffff');g.globalAlpha=1;break;
 }
 // face details
 if(cs.hair!=='helmet'&&cs.hair!=='horns'){
  g.fillStyle=cs.eyes||'#1a0e08';g.fillRect(3.2,-1.4,2,1.4);g.fillStyle=sh(sk,0.55);g.fillRect(2.4,-2.6,4.2,0.9);// brow
  g.fillStyle=sh(sk,0.6);g.fillRect(6.6,0,1.1,2.2);g.fillRect(4,4.4,2.6,0.7);// nose, mouth
  if(cs.eyepatch){g.fillStyle='#111';g.fillRect(2.8,-2,3,2.6);g.fillRect(-6,-3.2,9,0.7)}
  if(cs.mask){g.fillStyle=cs.mask;g.fillRect(1,1.6,7.2,5)}
  if(cs.beard==='full'){poly(g,[-1,2,7.5,2.5,6.5,7,2,9.5,-2,6],sh(cs.hairC,1));g.fillStyle=sh(sk,0.5);g.fillRect(4,4.2,2.6,0.7)}
  if(cs.beard==='stubble'){g.globalAlpha=0.35;poly(g,[0,3,7.5,3,6.5,7,2,8,-1,6],'#000');g.globalAlpha=1}
  if(cs.beard==='mous'){g.fillStyle=cs.hairC;g.fillRect(3.5,3.2,4,1.3)}
  if(cs.fem){g.fillStyle='#a03040';g.fillRect(4.2,4.3,2.2,0.8)}}
 g.restore()}
function gun(g,cs,K,P){if(P.gun==null)return;const t=cs.gun||'rifle';const hd=[K.armF[2],K.armF[3]];g.save();g.translate(hd[0],hd[1]);g.rotate(rad(P.gun));
 const m=g.createLinearGradient(0,-3,0,3);m.addColorStop(0,'#8a8e96');m.addColorStop(0.5,'#3a3c42');m.addColorStop(1,'#16161a');g.fillStyle=m;
 if(t==='rifle'){g.fillRect(-8,-2,24,3.6);g.fillRect(-11,-1,4,5);g.fillRect(-1,1.5,3,5);g.fillStyle='#5a3a22';g.fillRect(-13,-1.5,5,4)}
 else if(t==='shotgun'){g.fillRect(-8,-2.5,26,4.4);g.fillStyle='#6a4a2a';g.fillRect(-12,-2,7,5);g.fillRect(5,2,8,2)}
 else if(t==='smg'){g.fillRect(-4,-2,15,3.6);g.fillRect(0,1,2.6,6);g.fillRect(-5,-1,2,2)}
 else if(t==='ember'){g.fillRect(-8,-3,22,6);g.fillStyle='#c84a18';g.fillRect(12,-3.5,4,7);g.fillStyle='#ffb020';g.fillRect(15,-1.5,1.5,3)}
 g.restore()}
// ---------- full figure ----------
function draw(g,cs,P){const K=solve(P,cs);
 if(cs.cape){const[a,b]=K.sho;g.save();const cp=cs.cape;poly(g,[a-4,b+2,a-14+(P.hairX||0),b+48,a-2,b+50,a+3,b+3],grad(g,a-14,b,a+3,b,cp,0.4,1.3));g.restore()}
 arm(g,cs,K.sb,K.armB,1,P);leg(g,cs,K.hb,K.legB,1,P);leg(g,cs,K.hf,K.legF,0,P);torso(g,cs,K);headP(g,cs,K,P);
 if(cs.weapon==='machete'&&P.wpn!==0){const hd=[K.armF[2],K.armF[3]];g.save();g.translate(hd[0],hd[1]);g.rotate(rad(P.wa??-60));g.fillStyle='#3a2a1a';g.fillRect(-1.5,-5,3,7);const B=g.createLinearGradient(-2,0,2,0);B.addColorStop(0,'#e0e4ea');B.addColorStop(1,'#7a808a');g.fillStyle=B;poly(g,[-1.8,-5,-2.2,-24,1.5,-26,2,-5],B);g.restore()}
 if(cs.weapon==='blades'){for(const A of[K.armF,K.armB]){g.save();g.translate(A[2],A[3]);g.rotate(rad(P.wa??-30));poly(g,[-1,0,0,-13,1.5,0],'#d8dce4');g.restore()}}
 if(cs.weapon==='cryo'&&P.gun==null){const A=K.armF;g.fillStyle='#7af0ff';g.globalAlpha=0.6;g.fillRect(A[2]-2,A[3]-2,4,4);g.globalAlpha=1}
 if(cs.metalArm){g.fillStyle='#ff4040';g.fillRect(K.armF[0]-1,K.armF[1]-1,2,2)}
 gun(g,cs,K,P);arm(g,cs,K.sf,K.armF,0,P);
 if(P.gun!=null&&cs.gun==='smg'){}
 return K}
// ---------- post: threshold + posterize + outline ----------
const BY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function post(cv,levels=7,outline='#0c0806'){const g=cv.getContext('2d');const W=cv.width,H=cv.height;const im=g.getImageData(0,0,W,H),d=im.data;
 const st=255/(levels-1);const o=hex(outline);const mask=new Uint8Array(W*H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(d[i+3]<120){d[i+3]=0;continue}mask[y*W+x]=1;const b=(BY[(y&3)*4+(x&3)]/16-0.5)*st*0.55;
  for(let c=0;c<3;c++){const v=Math.round((d[i+c]+b)/st)*st;d[i+c]=Math.max(0,Math.min(255,v))}d[i+3]=255}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(mask[y*W+x])continue;if((x>0&&mask[y*W+x-1])||(x<W-1&&mask[y*W+x+1])||(y>0&&mask[(y-1)*W+x])||(y<H-1&&mask[(y+1)*W+x])){const i=(y*W+x)*4;d[i]=o[0];d[i+1]=o[1];d[i+2]=o[2];d[i+3]=255}}
 g.putImageData(im,0,0);return cv}
const cache=new Map();
// render a pose at scale s (pixels per unit). returns {c:canvas, ox, oy} where (ox,oy)=feet origin within canvas
function render(id,P,s,flip,key){const k=key&&(id+'|'+key+'|'+s+'|'+(flip?1:0));if(k&&cache.has(k))return cache.get(k);
 const cs=C[id];const S=(cs.hScale||1);const W=Math.ceil(150*s*S),H=Math.ceil(150*s*S);const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
 const ox=Math.round(W/2),oy=Math.round(H*0.82);g.translate(ox,oy);if(flip)g.scale(-1,1);g.scale(s,s);if(P.rot){g.translate(0,-48);g.rotate(rad(P.rot));g.translate(0,48)}
 draw(g,cs,P);post(cv,s>0.7?11:8);let oyy=oy;if(P.ground){const d=g.getImageData(0,0,W,H).data;let lb=0;for(let y=H-1;y>=0&&!lb;y--)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]){lb=y+1;break}oyy=lb||oy}const r={c:cv,ox,oy:oyy};if(k)cache.set(k,r);return r}
return{C,render,cache,hex,sh,rot}})();
