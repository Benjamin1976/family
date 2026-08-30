const http=require('http');
const fs=require('fs');
const path=require('path');
const port=process.env.PORT||3000;
const root=path.join(__dirname,'public');
const mime={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.ico':'image/x-icon'};

const VERSION='20260830c';

const galleryCss=`
.locationGallery{width:min(1180px,calc(100% - 40px));margin:28px auto 34px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
.locationPhoto{position:relative;min-height:280px;border-radius:20px;overflow:hidden;background:#0b3556;box-shadow:0 12px 30px #082c4c18}
.locationPhoto img{width:100%;height:100%;position:absolute;inset:0;object-fit:cover;display:block}
.locationPhoto .photoShade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 48%,#061f35d9)}
.locationPhoto .photoCaption{position:absolute;left:18px;right:18px;bottom:16px;color:white;font-size:14px;z-index:2}
.locationPhoto .photoCaption b{display:block;font-family:Georgia,serif;font-size:23px;margin-bottom:2px}
.locationCredits{grid-column:1/-1;color:#68747c;font-size:10px;line-height:1.4;padding:0 4px}
.locationCredits a{color:#386b87}
@media(max-width:700px){.locationGallery{grid-template-columns:1fr;margin-top:18px}.locationPhoto{min-height:230px}}
`;

const galleries={
  bali:`<div class="locationGallery" aria-label="Bali location photography">
    <figure class="locationPhoto"><img loading="lazy" src="https://upload.wikimedia.org/wikipedia/commons/2/2e/NusaDuaBeach.jpg" alt="Nusa Dua Beach, Bali"><span class="photoShade"></span><figcaption class="photoCaption"><b>Nusa Dua Beach</b>The actual coastline around our Bali resort shortlist.</figcaption></figure>
    <figure class="locationPhoto"><img loading="lazy" src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Nusa%20Dua%20Beach.jpg" alt="Nusa Dua beach in Bali"><span class="photoShade"></span><figcaption class="photoCaption"><b>Southern Bali</b>Warm water, sand and the relaxed resort zone we would be staying in.</figcaption></figure>
    <div class="locationCredits">Location photography: Wikimedia Commons — <a target="_blank" rel="noopener" href="https://commons.wikimedia.org/wiki/File:NusaDuaBeach.jpg">NusaDuaBeach.jpg</a> and <a target="_blank" rel="noopener" href="https://commons.wikimedia.org/wiki/File:Nusa_Dua_Beach.jpg">Nusa Dua Beach.jpg</a>. See source pages for authors and Creative Commons licence terms.</div>
  </div>`,
  fiji:`<div class="locationGallery" aria-label="Fiji location photography">
    <figure class="locationPhoto"><img loading="lazy" src="https://upload.wikimedia.org/wikipedia/commons/d/d1/Korotogo.jpg" alt="Korotogo beach on Fiji's Coral Coast"><span class="photoShade"></span><figcaption class="photoCaption"><b>Korotogo • Coral Coast</b>This is the same stretch of Fiji where Outrigger is located.</figcaption></figure>
    <figure class="locationPhoto"><img loading="lazy" src="https://upload.wikimedia.org/wikipedia/commons/5/59/Fiji%20Resort.jpg" alt="Fiji tropical resort coastline"><span class="photoShade"></span><figcaption class="photoCaption"><b>Fiji resort life</b>Tropical resort scenery and the easy island pace that makes Fiji so appealing with young kids.</figcaption></figure>
    <div class="locationCredits">Location photography: Wikimedia Commons — <a target="_blank" rel="noopener" href="https://commons.wikimedia.org/wiki/File:Korotogo.jpg">Korotogo.jpg</a> and <a target="_blank" rel="noopener" href="https://commons.wikimedia.org/wiki/File:Fiji_Resort.jpg">Fiji Resort.jpg</a>. See source pages for authors and licence terms.</div>
  </div>`,
  phuket:`<div class="locationGallery" aria-label="Phuket location photography">
    <figure class="locationPhoto"><img loading="lazy" src="https://upload.wikimedia.org/wikipedia/commons/f/f3/KataNoiBeach.jpg" alt="Kata Noi Beach in Phuket"><span class="photoShade"></span><figcaption class="photoCaption"><b>Kata Noi Beach</b>The beach directly associated with our Katathani resort choice.</figcaption></figure>
    <figure class="locationPhoto"><img loading="lazy" src="https://upload.wikimedia.org/wikipedia/commons/3/3d/Katathani%20Phuket%20Beach%20Resort%20-%20panoramio.jpg" alt="Katathani Phuket Beach Resort area"><span class="photoShade"></span><figcaption class="photoCaption"><b>Katathani area</b>A real view from the resort area rather than an illustrative render.</figcaption></figure>
    <div class="locationCredits">Location photography: Wikimedia Commons — <a target="_blank" rel="noopener" href="https://commons.wikimedia.org/wiki/File:KataNoiBeach.jpg">KataNoiBeach.jpg</a> and <a target="_blank" rel="noopener" href="https://commons.wikimedia.org/wiki/File:Katathani_Phuket_Beach_Resort_-_panoramio.jpg">Katathani Phuket Beach Resort</a>. See source pages for authors and licence terms.</div>
  </div>`
};

function injectGallery(html,id,markup){
  const start=html.indexOf(`<section id="${id}" class="dest">`);
  if(start<0) return html;
  const marker='<div class="wrap two">';
  const at=html.indexOf(marker,start);
  if(at<0) return html;
  return html.slice(0,at)+markup+html.slice(at);
}

function enhanceIndex(html){
  html=html.replace('</style>',galleryCss+'</style>');
  html=html.replaceAll('assets/cover.svg',`assets/cover.svg?v=${VERSION}`)
           .replaceAll('assets/bali.svg',`assets/bali.svg?v=${VERSION}`)
           .replaceAll('assets/fiji.svg',`assets/fiji.svg?v=${VERSION}`)
           .replaceAll('assets/phuket.svg',`assets/phuket.svg?v=${VERSION}`);
  html=injectGallery(html,'bali',galleries.bali);
  html=injectGallery(html,'fiji',galleries.fiji);
  html=injectGallery(html,'phuket',galleries.phuket);
  return html;
}

const server=http.createServer((req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(url.pathname==='/health'){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});return res.end('{"ok":true}');}
  let rel=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
  rel=path.normalize(rel);
  if(rel.startsWith('..')||path.isAbsolute(rel)){res.writeHead(400);return res.end('Bad request');}
  let file=path.join(root,rel);
  fs.stat(file,(e,s)=>{
    if(e||!s.isFile()) file=path.join(root,'index.html');
    fs.readFile(file,(err,data)=>{
      if(err){res.writeHead(500);return res.end('Server error');}
      const ext=path.extname(file).toLowerCase();
      const cache=(ext==='.html'||ext==='.svg')?'no-store, max-age=0':'public, max-age=3600';
      res.writeHead(200,{'content-type':mime[ext]||'application/octet-stream','cache-control':cache});
      if(ext==='.html') return res.end(enhanceIndex(data.toString('utf8')));
      res.end(data);
    });
  });
});
server.listen(port,'0.0.0.0',()=>console.log(`Family site listening on ${port}`));
