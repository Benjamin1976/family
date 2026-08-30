const http=require('http');
const fs=require('fs');
const path=require('path');
const port=process.env.PORT||3000;
const root=path.join(__dirname,'public');
const mime={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.ico':'image/x-icon'};

const VERSION='20260830d';

const carouselCss=`
#compare .grid3.carousel-ready{display:block;max-width:760px;margin:32px auto 0;position:relative}
#compare .carousel-ready>.card{display:none}
#compare .carousel-ready>.card.active{display:block;animation:tripFade .35s ease}
@keyframes tripFade{from{opacity:.25;transform:translateX(10px)}to{opacity:1;transform:none}}
.carouselControls{max-width:760px;margin:14px auto 0;display:flex;align-items:center;justify-content:center;gap:12px}
.carouselArrow{width:44px;height:44px;border-radius:50%;border:1px solid #cfd5d9;background:#fff;color:#082c4c;font-size:22px;font-weight:900;cursor:pointer}
.carouselArrow:hover{background:#082c4c;color:#fff}
.carouselDots{display:flex;gap:9px;align-items:center}
.carouselDot{width:11px;height:11px;border-radius:50%;border:0;background:#c8cdd1;padding:0;cursor:pointer}
.carouselDot.active{background:#c89538;transform:scale(1.25)}
.carouselStatus{font-size:11px;color:#6a747c;min-width:54px;text-align:center}
.ratingGrid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:16px 0 18px}
.ratingItem{background:#f7f5f0;border:1px solid #ece6dc;border-radius:12px;padding:10px 11px}
.ratingItem small{display:block;color:#68747c;text-transform:uppercase;letter-spacing:.5px;font-size:9px;font-weight:700;margin-bottom:3px}
.ratingStars{color:#d39a25;letter-spacing:1px;font-size:18px;white-space:nowrap}
.ratingItem b{display:block;color:#082c4c;font-size:11px;margin-top:2px}
.cardGalleryBtn{margin-left:3px}
@media(max-width:850px){#compare .grid3.carousel-ready{max-width:100%}.ratingGrid{grid-template-columns:1fr 1fr}.carouselControls{max-width:100%}}
@media(max-width:430px){.ratingStars{font-size:16px}.ratingItem{padding:9px}.carouselArrow{width:42px;height:42px}}
@media(prefers-reduced-motion:reduce){#compare .carousel-ready>.card.active{animation:none}}
`;

const carouselJs=`
<script>
(function(){
  const grid=document.querySelector('#compare .grid3');
  if(!grid) return;
  const cards=Array.from(grid.children).filter(el=>el.classList.contains('card'));
  if(cards.length<2) return;

  const info={
    Bali:{flight:4,cost:5,weather:5,kids:5,gallery:'https://balinusadua.holidayinnresorts.com/en/gallery',label:'Bali'},
    Fiji:{flight:5,cost:2,weather:5,kids:5,gallery:'https://www.outrigger.com/fiji/fiji-beach-resort/gallery',label:'Fiji'},
    Phuket:{flight:3,cost:4,weather:3,kids:5,gallery:'https://www.katathani.com/gallery/',label:'Phuket'}
  };
  const labels=[['flight','Flight duration'],['cost','Cost / value'],['weather','Oct weather'],['kids','Kids suited']];
  const stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);

  cards.forEach((card,i)=>{
    const title=(card.querySelector('h3')||{}).textContent||'';
    const key=title.includes('Bali')?'Bali':title.includes('Fiji')?'Fiji':'Phuket';
    const d=info[key];
    const score=card.querySelector('.score');
    if(score&&!card.querySelector('.ratingGrid')){
      const ratings=document.createElement('div');
      ratings.className='ratingGrid';
      ratings.innerHTML=labels.map(([k,label])=>'<div class="ratingItem"><small>'+label+'</small><span class="ratingStars" aria-label="'+d[k]+' out of 5 stars">'+stars(d[k])+'</span><b>'+d[k]+' / 5</b></div>').join('');
      score.insertAdjacentElement('afterend',ratings);
    }
    const body=card.querySelector('.body');
    if(body&&!body.querySelector('.cardGalleryBtn')){
      const a=document.createElement('a');
      a.className='btn alt cardGalleryBtn';
      a.href=d.gallery;
      a.target='_blank';
      a.rel='noopener';
      a.textContent='Hotel photos ↗';
      body.appendChild(a);
    }
    card.classList.toggle('active',i===0);
    card.setAttribute('aria-hidden',i===0?'false':'true');
  });

  grid.classList.add('carousel-ready');
  grid.setAttribute('aria-live','polite');

  const controls=document.createElement('div');
  controls.className='carouselControls';
  controls.innerHTML='<button class="carouselArrow prev" type="button" aria-label="Previous destination">‹</button><div class="carouselDots"></div><span class="carouselStatus">1 / '+cards.length+'</span><button class="carouselArrow next" type="button" aria-label="Next destination">›</button>';
  grid.insertAdjacentElement('afterend',controls);
  const dots=controls.querySelector('.carouselDots');
  cards.forEach((_,i)=>{
    const dot=document.createElement('button');
    dot.type='button';
    dot.className='carouselDot'+(i===0?' active':'');
    dot.setAttribute('aria-label','Show destination '+(i+1));
    dot.addEventListener('click',()=>{show(i);restart();});
    dots.appendChild(dot);
  });

  let index=0;
  let timer=null;
  const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function show(next){
    index=(next+cards.length)%cards.length;
    cards.forEach((c,i)=>{const on=i===index;c.classList.toggle('active',on);c.setAttribute('aria-hidden',on?'false':'true');});
    Array.from(dots.children).forEach((d,i)=>d.classList.toggle('active',i===index));
    controls.querySelector('.carouselStatus').textContent=(index+1)+' / '+cards.length;
  }
  function stop(){if(timer){clearInterval(timer);timer=null;}}
  function start(){if(!reduced){stop();timer=setInterval(()=>show(index+1),6000);}}
  function restart(){start();}
  controls.querySelector('.prev').addEventListener('click',()=>{show(index-1);restart();});
  controls.querySelector('.next').addEventListener('click',()=>{show(index+1);restart();});

  let touchX=null;
  grid.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX;},{passive:true});
  grid.addEventListener('touchend',e=>{if(touchX===null)return;const dx=e.changedTouches[0].clientX-touchX;touchX=null;if(Math.abs(dx)>45){show(index+(dx<0?1:-1));restart();}},{passive:true});
  grid.addEventListener('mouseenter',stop);
  grid.addEventListener('mouseleave',start);
  grid.addEventListener('focusin',stop);
  grid.addEventListener('focusout',start);
  start();
})();
</script>`;

function enhanceIndex(html){
  html=html.replace('</style>',carouselCss+'</style>');
  html=html.replaceAll('assets/cover.svg',`assets/cover.svg?v=${VERSION}`)
           .replaceAll('assets/bali.svg',`assets/bali.svg?v=${VERSION}`)
           .replaceAll('assets/fiji.svg',`assets/fiji.svg?v=${VERSION}`)
           .replaceAll('assets/phuket.svg',`assets/phuket.svg?v=${VERSION}`);
  html=html.replace('</body>',carouselJs+'</body>');
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
