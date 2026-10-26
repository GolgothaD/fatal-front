'use strict';
// Pose library. Each anim = {f:[poses], fps, loop}. Poses use units (100 = body height), facing right.
const ANIM=(()=>{
const L=(a,b,t)=>a+(b-a)*t;
function lerpP(A,B,t){const o={};for(const k in A){const a=A[k],b=B[k];if(Array.isArray(a)&&Array.isArray(b))o[k]=[L(a[0],b[0],t),L(a[1],b[1],t)];else if(typeof a==='number'&&typeof b==='number')o[k]=L(a,b,t);else o[k]=t<0.5?a:(b??a)}for(const k in B)if(!(k in o))o[k]=B[k];return o}
const P=(o)=>Object.assign({hip:[0,-47],lean:4,head:0,f1:[-9,0],f2:[10,0],h1:[9,-71],h2:[15,-77]},o);
const seq=(keys,n)=>{const out=[];for(let i=0;i<keys.length-1;i++)for(let j=0;j<n;j++)out.push(lerpP(keys[i],keys[i+1],j/n));out.push(keys[keys.length-1]);return out};
const A={};
// ---------- FIGHT ----------
A.idle={fps:9,loop:1,f:[0,0.5,1,1.5,2,1.5,1,0.5].map(b=>{return P({hip:[0,-47+b],h1:[9,-71+b*1.2],h2:[15,-77+b*1.1],head:-b,hairX:-b*0.8,hairY:b})})};
A.walk={fps:13,loop:1,f:[0,1,2,3,4,5,6,7].map(i=>{const a=i/8*Math.PI*2,s=Math.sin(a),c=Math.cos(a);return P({hip:[0,-47+Math.abs(c)*1.5],f1:[-2+s*-11,Math.min(0,-c*6)],f2:[3+s*11,Math.min(0,c*6)],h1:[8+s*2,-71],h2:[15-s*2,-77],hairX:-2})})};
A.walkb={fps:12,loop:1,f:[...A.walk.f].reverse()};
const crouch=P({hip:[1,-30],lean:16,f1:[-12,0],f2:[12,0],h1:[11,-54],h2:[17,-59],head:-8});
A.crouch={fps:20,loop:0,f:seq([P({}),crouch],2)};
const tuck=P({hip:[0,-52],lean:20,f1:[-4,-24],f2:[6,-28],h1:[10,-62],h2:[14,-58],kb1:-1,kb2:-1,hairX:-5,hairY:4});
A.jump={fps:10,loop:0,f:[P({hip:[0,-50],f1:[-6,-6],f2:[6,-10],h1:[6,-84],h2:[12,-88]}),tuck,tuck]};
A.flip={fps:16,loop:1,f:[0,1,2,3,4,5,6,7].map(i=>Object.assign({},tuck,{rot:i*45}))};
A.fall={fps:8,loop:0,f:[P({hip:[0,-50],f1:[-8,-4],f2:[8,-8],h1:[-4,-80],h2:[20,-84],lean:-4})]};
A.jab={fps:22,loop:0,f:[P({lean:8,h2:[24,-79]}),P({lean:10,h2:[37,-79],eb2:1,hip:[2,-47]}),P({lean:10,h2:[37,-79],hip:[2,-47]}),P({lean:6,h2:[22,-78]})],hit:1};
A.punch={fps:18,loop:0,f:[P({lean:-2,h2:[6,-74],h1:[14,-78]}),P({lean:18,hip:[5,-47],f1:[-12,0],h2:[42,-80],h1:[6,-68]}),P({lean:18,hip:[5,-47],f1:[-12,0],h2:[42,-80],h1:[6,-68]}),P({lean:10,h2:[26,-78]})],hit:1};
A.lowpunch={fps:20,loop:0,f:[crouch,P(Object.assign({},crouch,{h2:[38,-56],lean:22})),P(Object.assign({},crouch,{h2:[38,-56],lean:22})),crouch],hit:1};
A.upper={fps:18,loop:0,f:[P(Object.assign({},crouch,{h2:[6,-46]})),P({hip:[4,-40],lean:10,f1:[-12,0],f2:[10,0],h2:[24,-80]}),P({hip:[4,-51],lean:-8,f1:[-12,0],f2:[12,-6],h2:[18,-122],h1:[2,-66],head:-10}),P({hip:[4,-51],lean:-8,f1:[-12,0],f2:[12,-6],h2:[18,-122],h1:[2,-66],head:-10}),P({lean:0,h2:[16,-90]})],hit:2};
A.kick={fps:18,loop:0,f:[P({lean:-6,f2:[14,-20]}),P({lean:-16,hip:[-2,-48],f1:[-8,0],f2:[46,-56],kb2:-0.1,h1:[-2,-70],h2:[8,-80]}),P({lean:-16,hip:[-2,-48],f1:[-8,0],f2:[46,-56],kb2:-0.1,h1:[-2,-70],h2:[8,-80]}),P({lean:-6,f2:[16,-18]})],hit:1};
A.round={fps:18,loop:0,f:[P({lean:-10,f2:[4,-30],h1:[0,-72]}),P({lean:-30,hip:[-4,-48],f1:[-6,0],f2:[40,-86],kb2:-0.1,h1:[-12,-66],h2:[2,-76],head:10}),P({lean:-30,hip:[-4,-48],f1:[-6,0],f2:[40,-86],kb2:-0.1,h1:[-12,-66],h2:[2,-76],head:10}),P({lean:-10,f2:[18,-30]}),P({})],hit:1};
A.sweep={fps:18,loop:0,f:[crouch,P({hip:[-6,-22],lean:30,f1:[-14,0],f2:[46,-1],kb2:-0.05,h1:[4,-12],h2:[16,-16],head:-15}),P({hip:[-6,-22],lean:30,f1:[-14,0],f2:[46,-1],kb2:-0.05,h1:[4,-12],h2:[16,-16],head:-15}),crouch],hit:1};
A.airkick={fps:14,loop:0,f:[tuck,P({hip:[0,-52],lean:-20,f1:[-6,-26],f2:[36,-36],kb2:-0.1,h1:[-4,-72],h2:[10,-80]})]};
A.airpunch={fps:14,loop:0,f:[tuck,P({hip:[0,-52],lean:20,f1:[-4,-24],f2:[6,-28],h2:[34,-60],h1:[6,-70]})]};
A.block={fps:20,loop:0,f:[P({lean:-6,h1:[13,-84],h2:[17,-74],head:-6,hip:[-1,-47]})]};
A.cblock={fps:20,loop:0,f:[P(Object.assign({},crouch,{h1:[14,-66],h2:[18,-56],head:-12}))]};
A.hit={fps:14,loop:0,f:[P({lean:-22,head:-24,hip:[-4,-47],h1:[-6,-62],h2:[4,-60],hairX:6}),P({lean:-14,head:-12,hip:[-3,-47],h1:[0,-66],h2:[8,-68]})]};
A.hitlow={fps:14,loop:0,f:[P({lean:30,head:20,hip:[-3,-44],h1:[10,-50],h2:[16,-52]}),P({lean:16,hip:[-2,-46]})]};
const lie=P({hip:[0,-47],lean:0,f1:[-3,0],f2:[3,0],h1:[-4,-104],h2:[4,-108],kb1:-0.2,kb2:-0.2,eb1:0.2,eb2:0.2,rot:-90,ground:1});
A.knock={fps:10,loop:0,f:[P({lean:-30,head:-20,hip:[-6,-48],f1:[-6,-4],f2:[14,-10],h1:[-14,-80],h2:[0,-88],rot:-25,ground:1}),P({lean:-10,hip:[-4,-48],f1:[-3,-2],f2:[8,-6],h1:[-10,-96],h2:[2,-100],rot:-60,ground:1}),lie]};
A.down={fps:4,loop:0,f:[lie]};
A.getup={fps:9,loop:0,f:[lie,P({hip:[0,-26],lean:40,f1:[-12,0],f2:[10,0],h1:[16,-6],h2:[22,-6],head:-20}),crouch,P({})]};
A.win={fps:6,loop:1,f:[P({lean:-4,h1:[4,-62],h2:[10,-118],eb2:1,head:-10}),P({lean:-4,h1:[4,-62],h2:[11,-120],eb2:1,head:-12,hip:[0,-48]})]};
A.special={fps:16,loop:0,f:[P({lean:-6,h2:[-2,-66],h1:[-6,-70],glow:1}),P({lean:16,hip:[5,-47],f1:[-13,0],h2:[40,-78],h1:[34,-74],glow:1}),P({lean:16,hip:[5,-47],f1:[-13,0],h2:[40,-78],h1:[34,-74],glow:1}),P({lean:6})],hit:1};
A.charge={fps:12,loop:1,f:[P({lean:30,hip:[6,-42],f1:[-18,0],f2:[16,0],h1:[16,-62],h2:[22,-66],head:-10}),P({lean:30,hip:[6,-42],f1:[-12,-4],f2:[20,0],h1:[16,-62],h2:[22,-66],head:-10})]};
A.slam={fps:12,loop:0,f:[P({hip:[0,-50],h1:[-4,-112],h2:[6,-116],lean:-8}),P({hip:[2,-28],lean:34,f1:[-12,0],f2:[12,0],h1:[22,-2],h2:[28,-2]})]};
A.dizzy={fps:5,loop:1,f:[P({lean:-12,head:-14,h1:[0,-50],h2:[8,-52],hip:[-2,-46]}),P({lean:8,head:12,h1:[6,-52],h2:[14,-50],hip:[2,-46]})]};
A.throw={fps:12,loop:0,f:[P({lean:10,h2:[30,-80],h1:[28,-72]}),P({lean:-18,hip:[-4,-47],h2:[-10,-100],h1:[-6,-96],head:-10}),P({lean:-4})]};
A.thrown={fps:10,loop:0,f:[P({lean:-40,rot:-120,ground:0,h1:[-10,-96],h2:[2,-100]}),lie]};
// v5: in-between frames so attacks read smoothly (hit frame index scales with them)
const smooth=(name,n)=>{const a=A[name];if(!a||a.f.length<2)return;const f=a.f,out=[];for(let i=0;i<f.length-1;i++)for(let j=0;j<n;j++)out.push(j?lerpP(f[i],f[i+1],j/n):f[i]);out.push(f[f.length-1]);
 if(a.hit!==undefined)a.hit*=n;a.f=out;a.fps*=n};
['jab','punch','lowpunch','upper','kick','round','sweep','throw','special','hit','hitlow','getup','slam'].forEach(k=>smooth(k,2));
A.jsq={fps:30,loop:0,f:[P({hip:[0,-40],lean:10,f1:[-10,0],f2:[11,0],h1:[10,-63],h2:[16,-68],head:-4})]};
A.dash={fps:14,loop:0,f:[P({hip:[4,-43],lean:24,f1:[-16,-2],f2:[14,0],h1:[14,-64],h2:[20,-68],hairX:-6}),P({hip:[4,-45],lean:20,f1:[-10,0],f2:[16,-4],h1:[13,-66],h2:[19,-70],hairX:-5}),P({})]};
A.bdash={fps:12,loop:0,f:[P({hip:[-4,-49],lean:-14,f1:[-16,-6],f2:[6,0],h1:[4,-76],h2:[12,-80],head:-6}),P({hip:[-2,-47],lean:-6,f1:[-12,0],f2:[8,0]}),P({})]};
// ---------- STAGE (run & gun) ----------
const SHO=[1,-74];
function aimP(a,base){const c=Math.cos(a*Math.PI/180),s=Math.sin(a*Math.PI/180);const sh=[SHO[0]+(base.lean||0)*0.4,SHO[1]];
 return Object.assign(base,{h2:[sh[0]+c*21,sh[1]+s*21+3],h1:[sh[0]+c*12-s*3,sh[1]+s*12+c*3+4],gun:a,eb1:1,eb2:1})}
const AIMS={f:0,uf:-45,u:-90,df:40,d:90};
for(const k in AIMS){A['aim_'+k]={fps:1,loop:0,f:[aimP(AIMS[k],P({lean:k==='u'?-4:2,f1:[-10,0],f2:[10,0],hip:[0,-48],head:AIMS[k]*0.15}))]}}
for(const k of['f','uf','df']){A['run_'+k]={fps:16,loop:1,f:[0,1,2,3,4,5,6,7].map(i=>{const a=i/8*Math.PI*2,s=Math.sin(a),c=Math.cos(a);
  return aimP(AIMS[k],P({hip:[2,-47+Math.abs(c)*2],lean:10,f1:[-2+s*-15,Math.min(0,-c*9)],f2:[5+s*15,Math.min(0,c*9)],hairX:-4}))})}}
A.prone={fps:1,loop:0,f:[aimP(-90,P({hip:[0,-47],lean:0,f1:[-3,0],f2:[3,0],head:85,rot:90,ground:1}))]};
A.die={fps:9,loop:0,f:[P({lean:-30,head:-20,hip:[-4,-48],f1:[-6,-6],f2:[10,-14],h1:[-14,-84],h2:[4,-92],rot:-40,ground:1}),P({lean:-20,f1:[-4,-6],f2:[8,-10],h1:[-14,-96],h2:[2,-100],rot:-75,ground:1}),lie]};
A.runplain={fps:16,loop:1,f:A.walk.f.map(p=>Object.assign({},p,{lean:12,f1:[p.f1[0]*1.4,p.f1[1]*1.4],f2:[p.f2[0]*1.4,p.f2[1]*1.4],h1:[p.h1[0]-6,p.h1[1]+8],h2:[p.h2[0]+6,p.h2[1]+6]}))};
return{A,lerpP,AIMS}})();
