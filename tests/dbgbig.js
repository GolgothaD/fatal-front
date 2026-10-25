const {launch,serve,W8,watch}=require('./lib');(async()=>{const port=serve(),b=await launch(),p=await b.newPage();const e=[];watch(p,e);
await p.goto(`http://localhost:${port}/index.html`);await W8(1500);
console.log(await p.evaluate(()=>{const w=30,h=32;const m=document.createElement('canvas');m.width=w;m.height=h;const mg=m.getContext('2d');mg.drawImage(glyph('A','#fff'),2,2,20,28);
const f=document.createElement('canvas');f.width=w;f.height=h;const fg=f.getContext('2d');fg.drawImage(m,0,0);const a=[...fg.getImageData(4,12,1,1).data];fg.globalCompositeOperation='source-in';const L=fg.createLinearGradient(0,2,0,30);L.addColorStop(0,'#ffffff');L.addColorStop(1,'#300800');fg.fillStyle=L;fg.fillRect(0,0,w,h);return a+' / '+[...fg.getImageData(4,12,1,1).data]+' / '+bigText.toString().slice(0,50)}));
console.log(e.join('\n'));await b.close();process.exit(0)})();
