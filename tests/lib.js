const puppeteer=require('/workspace/qa/node_modules/puppeteer-core');const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
exports.serve=()=>{const port=9300+Math.floor(Math.random()*300);http.createServer((q,r)=>{let p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(p.endsWith('/'))p+='index.html';fs.readFile(p,(e,d)=>{if(e){r.statusCode=404;return r.end()}r.setHeader('content-type',{'.js':'text/javascript','.html':'text/html','.json':'application/json','.png':'image/png','.webp':'image/webp','.ogg':'audio/ogg'}[path.extname(p)]||'application/octet-stream');r.end(d)})}).listen(port);return port};
exports.launch=()=>puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
exports.W8=ms=>new Promise(r=>setTimeout(r,ms));
exports.watch=(page,errs)=>{page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});page.on('pageerror',e=>errs.push('PAGEERR '+e.message));page.on('requestfailed',r=>{const t=r.failure()&&r.failure().errorText||'';if(!/ABORTED/.test(t))errs.push('REQFAIL '+r.url()+' '+t)})};
