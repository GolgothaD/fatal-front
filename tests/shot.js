const {launch,serve,W8,watch}=require('./lib');(async()=>{const port=serve(),b=await launch(),p=await b.newPage();const e=[];watch(p,e);await p.setViewport({width:1200,height:900});
await p.goto(`http://localhost:${port}/${process.argv[2]}`);await W8(+process.argv[4]||800);await p.screenshot({path:process.argv[3]});console.log(e.join('\n')||'noerr');await b.close();process.exit(0)})();
