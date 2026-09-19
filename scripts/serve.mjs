import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const base='/haoran-company-website',root=path.resolve(process.argv[2]||'.'),port=Number(process.argv[3]||4173);
http.createServer(async(req,res)=>{try{
 let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(!pathname.startsWith(base))throw Error();
 let file=path.resolve(root,'.'+pathname.slice(base.length));
 if(file!==root&&!file.startsWith(root+path.sep))throw Error();
 if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
 const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.pdf':'application/pdf'};
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
}catch{res.statusCode=404;res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`http://127.0.0.1:${port}${base}/`));
