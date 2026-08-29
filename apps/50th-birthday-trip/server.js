const http=require('http');
const fs=require('fs');
const path=require('path');
const port=process.env.PORT||3000;
const root=path.join(__dirname,'public');
const mime={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(url.pathname==='/health'){res.writeHead(200,{'content-type':'application/json'});return res.end('{"ok":true}');}
  let rel=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
  rel=path.normalize(rel);
  if(rel.startsWith('..')||path.isAbsolute(rel)){res.writeHead(400);return res.end('Bad request');}
  let file=path.join(root,rel);
  fs.stat(file,(e,s)=>{
    if(e||!s.isFile()) file=path.join(root,'index.html');
    fs.readFile(file,(err,data)=>{
      if(err){res.writeHead(500);return res.end('Server error');}
      res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'public, max-age=900'});
      res.end(data);
    });
  });
});
server.listen(port,'0.0.0.0',()=>console.log(`Family site listening on ${port}`));
