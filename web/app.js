/* NASA Space Apps | Planet X: all scripts */
/* ===== Shared: starfield, effects ===== */
/* ---------- Starfield (identical on every page) ---------- */
(function(){
  var canvas=document.getElementById('spaceCanvas'),ctx=canvas.getContext('2d');
  var countEl=document.getElementById('particleCount');
  var width,height,dpr=Math.min(window.devicePixelRatio||1,2);
  var stars=[],bursts=[],mouse={x:-9999,y:-9999},MAX=600,CELL=75,paused=false,running=false;
  function star(x,y,boost){
    return{x:x!==undefined?x:Math.random()*width,y:y!==undefined?y:Math.random()*height,
      r:boost?Math.random()*2.2+.8:Math.random()*1.7+.35,
      vx:boost?(Math.random()-.5)*1.1:(Math.random()-.5)*.22,
      vy:boost?(Math.random()-.5)*1.1:(Math.random()-.5)*.22,
      alpha:boost?1:Math.random()*.7+.25,twinkle:Math.random()*.025+.008,glow:boost?1:0};
  }
  function size(){
    width=innerWidth;height=innerHeight;
    canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    if(!stars.length){for(var i=0;i<140;i++)stars.push(star());if(countEl)countEl.textContent=stars.length}
  }
  addEventListener('resize',size);size();
  addEventListener('pointermove',function(e){mouse.x=e.clientX;mouse.y=e.clientY},{passive:true});
  document.documentElement.addEventListener('pointerleave',function(){mouse.x=mouse.y=-9999});
  var BLOCK='a,button,input,select,textarea,label,summary,details,form,nav,header,.stage,#md,#film,#hall,.member-card,.article-card,.hall-card,.reader-panel,.modal';
  addEventListener('click',function(e){
    if(e.target.closest&&e.target.closest(BLOCK))return;
    for(var i=0;i<18;i++){if(stars.length>=MAX)stars.shift();stars.push(star(e.clientX+(Math.random()-.5)*70,e.clientY+(Math.random()-.5)*70,true))}
    if(countEl)countEl.textContent=stars.length;
    bursts.push({x:e.clientX,y:e.clientY,radius:6,alpha:.75});
  });
  function frame(){
    ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);
    if(mouse.x>0&&mouse.y>0){
      var g=ctx.createRadialGradient(mouse.x,mouse.y,0,mouse.x,mouse.y,240);
      g.addColorStop(0,'rgba(208,214,249,.09)');g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
    }
    var cols=Math.ceil(width/CELL)||1,rows=Math.ceil(height/CELL)||1,cells=new Array(cols*rows),i,s;
    for(i=0;i<stars.length;i++){
      s=stars[i];s.x+=s.vx;s.y+=s.vy;
      if(Math.abs(s.vx)>.25)s.vx*=.97;if(Math.abs(s.vy)>.25)s.vy*=.97;
      if(s.glow>0)s.glow=Math.max(0,s.glow-.015);
      if(s.x<0)s.x=width;if(s.x>width)s.x=0;if(s.y<0)s.y=height;if(s.y>height)s.y=0;
      s.alpha+=s.twinkle;if(s.alpha>1||s.alpha<.2)s.twinkle*=-1;
      var dx=mouse.x-s.x,dy=mouse.y-s.y,d=Math.hypot(dx,dy);
      if(d<155){
        ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(mouse.x,mouse.y);
        ctx.strokeStyle='rgba(208,214,249,'+((1-d/155)*.32)+')';ctx.lineWidth=.8;ctx.stroke();
        s.x-=dx*.0025;s.y-=dy*.0025;
      }
      var c=Math.min(cols-1,Math.max(0,s.x/CELL|0)),r=Math.min(rows-1,Math.max(0,s.y/CELL|0)),k=r*cols+c;
      (cells[k]||(cells[k]=[])).push(i);s._c=c;s._r=r;
    }
    for(i=0;i<stars.length;i++){
      s=stars[i];
      for(var rr=Math.max(0,s._r-1);rr<=Math.min(rows-1,s._r+1);rr++)for(var cc=Math.max(0,s._c-1);cc<=Math.min(cols-1,s._c+1);cc++){
        var cell=cells[rr*cols+cc];if(!cell)continue;
        for(var q=0;q<cell.length;q++){var j=cell[q];if(j<=i)continue;var s2=stars[j],pd=Math.hypot(s.x-s2.x,s.y-s2.y);
          if(pd<75){ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s2.x,s2.y);ctx.strokeStyle='rgba(208,214,249,'+((1-pd/75)*.14)+')';ctx.lineWidth=.6;ctx.stroke()}}
      }
      ctx.beginPath();ctx.arc(s.x,s.y,s.r+s.glow*1.4,0,6.2832);
      ctx.fillStyle='rgba(255,255,255,'+(s.glow>0?Math.min(1,s.alpha+s.glow):s.alpha)+')';ctx.fill();
    }
    for(i=bursts.length-1;i>=0;i--){
      var b=bursts[i];b.radius+=3.2;b.alpha-=.025;
      if(b.alpha<=0){bursts.splice(i,1);continue}
      ctx.beginPath();ctx.arc(b.x,b.y,b.radius,0,6.2832);ctx.strokeStyle='rgba(208,214,249,'+b.alpha+')';ctx.lineWidth=1.2;ctx.stroke();
    }
  }
  function tick(){if(paused){running=false;return}frame();requestAnimationFrame(tick)}
  function setPause(v){paused=!!v;if(!paused&&!running){running=true;requestAnimationFrame(tick)}}
  frame();running=true;requestAnimationFrame(tick);
  window.__fxPause=setPause;
  addEventListener('film:open',function(){setPause(true)});
  addEventListener('film:close',function(){setPause(false)});
})();

/* ---------- Interactive layer ---------- */
(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
  var bar=document.createElement('div');bar.className='fx-progress';document.body.appendChild(bar);
  function prog(){var h=document.documentElement.scrollHeight-innerHeight;bar.style.transform='scaleX('+(h>0?Math.min(1,scrollY/h):0)+')'}
  addEventListener('scroll',prog,{passive:true});addEventListener('resize',prog);prog();
  if(fine&&!reduce){
    var halo=document.createElement('div');halo.className='fx-halo';document.body.appendChild(halo);
    var tx=0,ty=0,hx=0,hy=0;
    addEventListener('pointermove',function(e){tx=e.clientX;ty=e.clientY;halo.classList.add('on');
      halo.classList.toggle('hot',!!e.target.closest('a,button,input,select,summary,label,.stage,#trk,.member-card,.article-card,.hall-card,.pill'))},{passive:true});
    document.documentElement.addEventListener('pointerleave',function(){halo.classList.remove('on')});
    addEventListener('pointerdown',function(){halo.classList.add('down')});addEventListener('pointerup',function(){halo.classList.remove('down')});
    (function follow(){hx+=(tx-hx)*.2;hy+=(ty-hy)*.2;halo.style.transform='translate('+hx+'px,'+hy+'px)';requestAnimationFrame(follow)})();

    var last=null;
    function reset(c){if(c)c.style.transform=''}
    document.addEventListener('pointermove',function(e){
      var card=e.target.closest('.article-card,.member-card,.hall-card');
      if(last&&last!==card)reset(last);last=card;
      if(card){
        var r=card.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
        card.style.setProperty('--mx',x+'px');card.style.setProperty('--my',y+'px');
        var lift=card.classList.contains('article-card')?-6:-4;
        card.style.transform='perspective(900px) rotateX('+((.5-y/r.height)*7).toFixed(2)+'deg) rotateY('+((x/r.width-.5)*7).toFixed(2)+'deg) translateY('+lift+'px)';
      }
      document.querySelectorAll('.explore-btn,.spin').forEach(function(b){
        var r=b.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,d=Math.hypot(e.clientX-cx,e.clientY-cy),reach=Math.max(r.width,r.height);
        b.style.translate=d<reach?((e.clientX-cx)*.18).toFixed(1)+'px '+((e.clientY-cy)*.18).toFixed(1)+'px':'0px 0px';
      });
    },{passive:true});
    document.documentElement.addEventListener('pointerleave',function(){reset(last);last=null});
  }
  if(!reduce){
    var c=document.createElement('canvas');c.className='fx-shoot';c.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:1;pointer-events:none';document.body.appendChild(c);
    var x=c.getContext('2d'),W,H,streaks=[],next=2500;
    function size(){W=c.width=innerWidth;H=c.height=innerHeight}addEventListener('resize',size);size();
    var lt=performance.now();
    (function loop(t){
      var dt=t-lt;lt=t;next-=dt;
      var idle=document.hidden||document.documentElement.classList.contains('film-open');
      if(next<=0&&!idle){var a=(22+Math.random()*16)*Math.PI/180;streaks.push({x:Math.random()*W*.8,y:Math.random()*H*.45,vx:Math.cos(a)*(11+Math.random()*5),vy:Math.sin(a)*(11+Math.random()*5),life:1});next=5000+Math.random()*7000}
      if(streaks.length||loop.dirty){
        x.clearRect(0,0,W,H);
        for(var i=streaks.length-1;i>=0;i--){
          var s=streaks[i];s.x+=s.vx;s.y+=s.vy;s.life-=.016;
          if(s.life<=0){streaks.splice(i,1);continue}
          var g=x.createLinearGradient(s.x,s.y,s.x-s.vx*9,s.y-s.vy*9);g.addColorStop(0,'rgba(255,255,255,'+s.life+')');g.addColorStop(1,'rgba(208,214,249,0)');
          x.strokeStyle=g;x.lineWidth=1.6;x.beginPath();x.moveTo(s.x,s.y);x.lineTo(s.x-s.vx*9,s.y-s.vy*9);x.stroke();
        }
        loop.dirty=streaks.length>0;
      }
      requestAnimationFrame(loop);
    })(lt);
  }
})();



/* ===== Intro film ===== */
(function(){try{
(function(){
const $=id=>document.getElementById(id),F=$('film'),cv=$('fc'),cx=cv.getContext('2d'),cap=$('fcap'),ct=$('fct'),dots=$('fdots');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ez=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
const rnd=s=>()=>(s=(s*1664525+1013904223)>>>0)/4294967296,R=rnd(11);
const ST=Array.from({length:240},()=>({x:R(),y:R(),z:R(),s:.6+R()*1.6}));
let W,H,i=0,t0=0,open=false,raf=0;
function size(){const r=window.devicePixelRatio||1;W=innerWidth;H=innerHeight;cv.width=W*r;cv.height=H*r;cx.setTransform(r,0,0,r,0,0)}
const bg=()=>{cx.fillStyle='#000000';cx.fillRect(0,0,W,H)},txt=(t,x,y,f,c,a)=>{cx.font=f;cx.fillStyle=c;cx.textAlign=a||'center';cx.fillText(t,x,y)};
const box=()=>{const w=Math.min(W*.82,780),h=w*.5;return{w,h,x:(W-w)/2,y:H*.2}};
function field(b,fr){cx.fillStyle='#050913';cx.fillRect(b.x,b.y,b.w,b.h);const r=rnd(5);cx.fillStyle='#dfe6ff';for(let k=0;k<130;k++){cx.beginPath();cx.arc(b.x+r()*b.w,b.y+r()*b.h,.8+r()*1.8,0,7);cx.fill()}}
const CAP=[
'In 2025, NASA’s SPHEREx began mapping the entire sky every six months, in 102 infrared colors. More than a billion objects.',
'One old trick still finds things nobody has named: photograph the same sky twice and flip between the pictures. Whatever jumps is close to us. That is how Pluto was found.',
'SPHEREx splits infrared light into 102 channels: six detectors, 17 channels each. Your eyes see none of it.',
'A SPHEREx pixel covers 6.15 arcseconds. Even the fastest-moving stars drift only a pixel or two across the whole mission.',
'The challenge gives WISE 0855’s position as it was in 2010. It has since moved about 130 arcseconds, over twenty pixels. Cut a small field where the catalog says, and you miss it.',
'So we align every frame, subtract one epoch from another, and look for the pair: light where it was, dark where it is.',
'Nine real SPHEREx images, five challenge targets, and a viewer that labels what is real and what is simulated. Pixels in this demo are simulated.'];
const TTL=['The sky','The old trick','102 colors','The pixel','The coordinate trap','The difference','Your turn'];
const DET=[[.75,1.09],[1.1,1.62],[1.63,2.41],[2.42,3.82],[3.83,4.41],[4.42,5]],HUE=['#8fa8ff','#4cc9f0','#7ee081','#f2d45c','#f29b5c','#ef6f8e'];
function grid(x0,y0,c,n,m){cx.strokeStyle='rgba(255,255,255,.13)';cx.lineWidth=1;for(let a=0;a<=n;a++){cx.beginPath();cx.moveTo(x0+a*c,y0);cx.lineTo(x0+a*c,y0+m*c);cx.stroke()}for(let a=0;a<=m;a++){cx.beginPath();cx.moveTo(x0,y0+a*c);cx.lineTo(x0+n*c,y0+a*c);cx.stroke()}}
function glow(x,y,r,col){const g=cx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=g;cx.beginPath();cx.arc(x,y,r,0,7);cx.fill()}
const SC=[
{d:7500,f:(p)=>{for(const s of ST){const u=(s.z+p*.45*s.s)%1,x=W/2+(s.x-.5)*W*u*3,y=H/2+(s.y-.5)*H*u*3;cx.fillStyle=`rgba(225,232,255,${u})`;cx.beginPath();cx.arc(x,y,s.s*u*1.5,0,7);cx.fill()}
 const n=Math.round(1e9*ez(cl(p*1.3)));txt(n.toLocaleString('en-US')+'+',W/2,H*.46,"400 clamp(2rem,8vw,5.5rem) Bellefair,serif",'#fff');txt('OBJECTS  ·  102 COLORS  ·  EVERY 6 MONTHS',W/2,H*.46+Math.min(60,H*.07),"400 clamp(.9rem,2vw,1.3rem) 'Barlow Condensed',sans-serif",'#D0D6F9')}},
{d:8500,f:(p,t)=>{const b=box();field(b);const fr=reduce?1:Math.floor(t/450)%2,A={x:b.x+b.w*.42,y:b.y+b.h*.5},B={x:A.x+b.w*.07,y:A.y+b.h*.06},m=fr?B:A;
 cx.fillStyle='#dfe6ff';cx.beginPath();cx.arc(m.x,m.y,2.6,0,7);cx.fill();txt('FRAME '+(fr?'B':'A'),b.x+12,b.y+22,"700 14px 'Barlow Condensed',sans-serif",'#D0D6F9','left');
 if(p>.55||reduce){const a=reduce?1:ez(cl((p-.55)/.25));cx.globalAlpha=a;cx.strokeStyle='#ffffff';cx.lineWidth=2;[A,B].forEach(q=>{cx.beginPath();cx.arc(q.x,q.y,13,0,7);cx.stroke()});cx.beginPath();cx.moveTo(A.x,A.y);cx.lineTo(B.x,B.y);cx.stroke();txt('it moved',(A.x+B.x)/2,A.y-24,"700 16px 'Barlow Condensed',sans-serif",'#ffffff');cx.globalAlpha=1}}},
{d:9000,f:(p)=>{const L0=.4,L1=5.1,x0=W*.1,w=W*.8,y=H*.36,h=54,X=l=>x0+(l-L0)/(L1-L0)*w,lam=L0+(L1-L0)*cl(p*1.1);
 cx.fillStyle='rgba(255,255,255,.06)';cx.fillRect(x0,y,X(.75)-x0,h);txt('NOT RECORDED',(x0+X(.75))/2,y+h/2+5,"700 12px 'Barlow Condensed',sans-serif",'rgba(255,255,255,.4)');
 DET.forEach((d,k)=>{const on=lam>=d[0];cx.globalAlpha=on?1:.22;cx.fillStyle=HUE[k];cx.fillRect(X(d[0]),y,X(d[1])-X(d[0]),h);cx.globalAlpha=1;txt('D'+(k+1),(X(d[0])+X(d[1]))/2,y+h/2+5,"700 15px 'Barlow Condensed',sans-serif",'#05080f');
  if(lam>=d[0]&&lam<=d[1]){cx.strokeStyle='rgba(5,8,15,.55)';for(let c=1;c<17;c++){const xx=X(d[0])+(X(d[1])-X(d[0]))*c/17;cx.beginPath();cx.moveTo(xx,y+h-14);cx.lineTo(xx,y+h);cx.stroke()}}});
 cx.fillStyle='#fff';cx.fillRect(X(lam)-1.5,y-12,3,h+24);txt(lam.toFixed(2)+' µm',X(lam),y-20,"700 16px 'Barlow Condensed',sans-serif",'#fff');
 txt('0.4 µm',x0,y+h+26,"400 13px 'Barlow',sans-serif",'rgba(208,214,249,.72)','left');txt('5.1 µm',x0+w,y+h+26,"400 13px 'Barlow',sans-serif",'rgba(208,214,249,.72)','right')}},
{d:8000,f:(p)=>{const n=14,m=6,c=Math.min(W/(n+3),52),x0=(W-n*c)/2,y0=H*.24;grid(x0,y0,c,n,m);const t=ez(cl(p*1.1)),px=x0+(2.5+2*t)*c,py=y0+3*c;
 cx.strokeStyle='rgba(95,212,196,.6)';cx.lineWidth=2;cx.beginPath();cx.moveTo(x0+2.5*c,py);cx.lineTo(px,py);cx.stroke();glow(px,py,c*.9,'rgba(255,255,255,.95)');
 txt('1 pixel = 6.15″',x0+n*c/2,y0+m*c+30,"700 18px 'Barlow Condensed',sans-serif",'#D0D6F9');txt('drift over the mission: about '+(2*t).toFixed(1)+' pixels',x0+n*c/2,y0-14,"400 15px 'Barlow',sans-serif",'rgba(208,214,249,.72)')}},
{d:11000,f:(p)=>{const n=28,m=6,c=Math.min(W/(n+2),34),x0=(W-n*c)/2,y0=H*.3;grid(x0,y0,c,n,m);const yr=2010.34+16.5*ez(cl(p*1.1)),off=(yr-2010.34)*8.1237/6.15,ox=x0+2.5*c,oy=y0+4.5*c;
 const bx=Math.min(14.63,2.5+14.63),bw=29.26*c;cx.setLineDash([6,5]);cx.strokeStyle='#D0D6F9';cx.lineWidth=2;cx.strokeRect(ox-14.63*c,oy-14.63*c,bw,bw);cx.setLineDash([]);
 cx.beginPath();cx.arc(ox,oy,9,0,7);cx.stroke();txt('2010 coordinates',ox,oy+32,"700 14px 'Barlow Condensed',sans-serif",'#D0D6F9');
 const px=ox+off*c,py=oy-(yr-2010.34)*.6732/6.15*c,out=off>14.63;cx.strokeStyle='rgba(95,212,196,.5)';cx.beginPath();cx.moveTo(ox,oy);cx.lineTo(px,py);cx.stroke();glow(px,py,c*.8,out?'rgba(255,123,102,.95)':'rgba(95,212,196,.95)');
 txt(yr.toFixed(0),W/2,y0-30,"400 clamp(2rem,6vw,3.6rem) Bellefair,serif",'#fff');txt('cutout half-width 90″',ox+14.63*c-6,y0+m*c+30,"700 14px 'Barlow Condensed',sans-serif",'#D0D6F9','right');
 if(out)txt('MISSED  ·  '+(off*6.15).toFixed(0)+'″ = '+off.toFixed(0)+' pixels away',px,py+34,"700 16px 'Barlow Condensed',sans-serif",'#ff7b66')}},
{d:9500,f:(p)=>{const w=Math.min(W*.27,300),g=Math.min(W*.03,30),x0=(W-3*w-2*g)/2,y0=H*.24,r=rnd(9);const S=Array.from({length:7},()=>[r(),r()]);
 const panel=(k,lab,mv,al)=>{const x=x0+k*(w+g);cx.globalAlpha=al;cx.fillStyle='#050913';cx.fillRect(x,y0,w,w);S.forEach(s=>{cx.fillStyle=k<2?'#dfe6ff':'rgba(255,255,255,.04)';cx.beginPath();cx.arc(x+s[0]*w,y0+s[1]*w,3,0,7);cx.fill()});
  if(k<2){cx.fillStyle='#fff';cx.beginPath();cx.arc(x+w*(.45+mv*.09),y0+w*.5,3,0,7);cx.fill()}else{const q=x+w*.45,yy=y0+w*.5;glow(q,yy,w*.08,'rgba(255,123,102,.95)');glow(q+w*.09,yy,w*.08,'rgba(95,180,255,.95)')}
  txt(lab,x+w/2,y0+w+26,"700 15px 'Barlow Condensed',sans-serif",'#D0D6F9');cx.globalAlpha=1};
 panel(0,'EPOCH 1',0,1);panel(1,'EPOCH 2',1,ez(cl(p*3)));panel(2,'EPOCH 2 − EPOCH 1',0,reduce?1:ez(cl((p-.45)*2.5)));
 if(p>.7||reduce)txt('fixed stars vanish · the mover leaves a pair',W/2,y0+w+64,"400 16px 'Barlow',sans-serif",'rgba(208,214,249,.72)')}},
{d:6000,f:(p,t)=>{const cxm=W/2,cym=H*.42,rr=Math.min(W,H)*.2;for(let k=0;k<9;k++){const a=(reduce?0:t/5200)+k*Math.PI*2/9,x=cxm+Math.cos(a)*rr*1.5,y=cym+Math.sin(a)*rr*.55,z=.6+.4*Math.sin(a);
 glow(x,y,26*z,`rgba(${k%2?'208,214,249':'255,255,255'},.9)`)}txt('Pick your destination',cxm,cym+8,"400 clamp(1.6rem,5vw,3rem) Bellefair,serif",'#fff')}}];

/* ---- new scenes ---- */
const NIR={d:9000,f:(p)=>{const b=box(),sw=b.x+b.w*(1-ez(cl(p*1.15))),r=rnd(21),DU=[[.28,.5,.2],[.55,.38,.16],[.72,.62,.2],[.45,.72,.14]];
 cx.fillStyle='#050913';cx.fillRect(b.x,b.y,b.w,b.h);
 for(let k=0;k<120;k++){const x=b.x+r()*b.w,y=b.y+r()*b.h;cx.fillStyle='rgba(223,230,255,'+(.5+r()*.5)+')';cx.beginPath();cx.arc(x,y,.7+r()*1.7,0,7);cx.fill()}
 const dust=a=>DU.forEach(d=>{const X=b.x+d[0]*b.w,Y=b.y+d[1]*b.h,g=cx.createRadialGradient(X,Y,0,X,Y,d[2]*b.w);g.addColorStop(0,'rgba(110,64,36,'+a+')');g.addColorStop(.7,'rgba(110,64,36,'+a*.8+')');g.addColorStop(1,'rgba(110,64,36,0)');cx.fillStyle=g;cx.fillRect(b.x,b.y,b.w,b.h)});
 cx.save();cx.beginPath();cx.rect(b.x,b.y,sw-b.x,b.h);cx.clip();dust(.97);cx.restore();
 cx.save();cx.beginPath();cx.rect(sw,b.y,b.x+b.w-sw,b.h);cx.clip();dust(.12);cx.restore();
 cx.fillStyle='#D0D6F9';cx.fillRect(sw-1,b.y,2,b.h);
 txt('VISIBLE LIGHT',b.x+12,b.y+22,"700 14px 'Barlow Condensed',sans-serif",'rgba(208,214,249,.72)','left');txt('INFRARED',b.x+b.w-12,b.y+22,"700 14px 'Barlow Condensed',sans-serif",'#D0D6F9','right')}};
const NQ={d:9500,f:(p)=>{const it=[['ORIGIN','how the universe began'],['GALAXIES','how galaxies grew'],['ICE','water where planets form']],w=Math.min(W*.28,300),g=W*.03,x0=(W-3*w-2*g)/2,y=H*.34,now=reduce?0:performance.now();
 it.forEach((q,k)=>{const al=ez(cl((p-k*.22)*3)),X=x0+k*(w+g)+w/2,col=['#8d97d9','#D0D6F9','#ffffff'][k];cx.globalAlpha=al;glow(X,y,w*.32*(.8+.2*Math.sin(now/700+k)),col);cx.strokeStyle=col;cx.lineWidth=2;cx.beginPath();cx.arc(X,y,w*.2,0,7);cx.stroke();
  txt(q[0],X,y+w*.36,"700 22px 'Barlow Condensed',sans-serif",col);txt(q[1],X,y+w*.36+26,"400 16px 'Barlow',sans-serif",'rgba(208,214,249,.72)');cx.globalAlpha=1})}};
const NP={d:8500,f:(p)=>{const S=['FETCH','ALIGN','SUBTRACT','LINK','MATCH','CANDIDATE'],sub=['small cutouts','one sky grid','epoch − epoch','pairs → track','Gaia · WISE','unnamed?'],n=6,w=Math.min(W*.14,150),g=(W-n*w)/(n+1),y=H*.36;
 S.forEach((q,k)=>{const al=ez(cl(p*1.15*n-k)),x=g+k*(w+g),last=k===n-1;cx.globalAlpha=.2+.8*al;cx.fillStyle=last?'#D0D6F9':'rgba(255,255,255,.08)';cx.strokeStyle=last?'#D0D6F9':'#d0d6f9';cx.lineWidth=1.5;cx.beginPath();cx.rect(x,y,w,w*.7);cx.fill();cx.stroke();
  txt(q,x+w/2,y+w*.33,"700 15px 'Barlow Condensed',sans-serif",last?'#000000':'#fff');txt(sub[k],x+w/2,y+w*.55,"400 12px 'Barlow',sans-serif",last?'#000000':'rgba(208,214,249,.72)');
  if(k<n-1){cx.beginPath();cx.moveTo(x+w+4,y+w*.35);cx.lineTo(x+w+g-4,y+w*.35);cx.strokeStyle='rgba(208,214,249,.5)';cx.stroke()}cx.globalAlpha=1});
 txt('every step in this demo is simulated',W/2,y+w*.7+54,"400 15px 'Barlow',sans-serif",'rgba(208,214,249,.72)')}};
SC.splice(2,0,NIR);CAP.splice(2,0,'Dust clouds hide stars from visible light, but infrared passes through. Cold objects, like brown dwarfs, shine mostly in the infrared. That is why SPHEREx looks there.');TTL.splice(2,0,'Why infrared');
SC.splice(4,0,NQ);CAP.splice(4,0,'SPHEREx was built to ask three questions: how the universe began, how galaxies grew, and how much water ice waits in the clouds where stars and planets form.');TTL.splice(4,0,'Three questions');
SC.splice(8,0,NP);CAP.splice(8,0,'Fetch a small cutout, align it, subtract, link the pairs into a track, then check Gaia and WISE. What nobody has named is a simulated training exercise: candidate. In this demo every step is simulated.');TTL.splice(8,0,'The pipeline');
const CAPA=['في عام 2025 بدأ مرصد سفيريكس التابع لناسا برسم خريطة للسماء كلها كل ستة أشهر، بـ 102 لونًا من الأشعة تحت الحمراء. أكثر من مليار جرم.',
'حيلة قديمة لا تزال تكشف ما لم يُسمَّ بعد: صوّر السماء مرتين وبدّل بين الصورتين. كل ما يقفز قريب منا. هكذا اكتُشف بلوتو.',
'سحب الغبار تحجب النجوم عن الضوء المرئي، لكن الأشعة تحت الحمراء تعبر خلالها. والأجرام الباردة، كالأقزام البنية، تتوهج في الغالب بهذه الأشعة. لذلك يتجه سفيريكس إليها.',
'يقسّم سفيريكس الأشعة تحت الحمراء إلى 102 قناة: ستة كاشفات، في كل منها 17 قناة. وعيناك لا ترى أيًّا منها.',
'بُني سفيريكس ليجيب عن ثلاثة أسئلة: كيف بدأ الكون، وكيف نمت المجرات، وكم من جليد الماء ينتظر في السحب التي تولد فيها النجوم والكواكب.',
'يغطي بكسل سفيريكس 6.15 ثانية قوسية. وحتى أسرع النجوم حركةً لا تنجرف إلا بكسلًا أو اثنين طوال المهمة.',
'يعطي التحدي موضع WISE 0855 كما كان عام 2010. وقد تحرك منذ ذلك الوقت نحو 130 ثانية قوسية، أي أكثر من عشرين بكسلًا. فإن قصصتَ حقلًا صغيرًا حيث يقول الكتالوج فاتك الجرم.',
'لذلك نحاذي كل الإطارات ونطرح حقبة من أخرى، ونبحث عن الزوج: ضوء حيث كان الجرم، وظلام حيث صار.',
'نجلب مقطعًا صغيرًا، نحاذيه، نطرح، نربط الأزواج في مسار، ثم نفحص Gaia وWISE. ما لم يسمّه أحد يصبح مرشحًا. في هذا العرض كل خطوة محاكاة.',
'تسع صور حقيقية من سفيريكس، وخمسة أهداف من التحدي، وعارض يميّز الحقيقي عن المحاكى. البكسلات في هذا العرض محاكاة.'];
const TTLA=['السماء','الحيلة القديمة','لماذا الأشعة تحت الحمراء','102 لون','ثلاثة أسئلة','البكسل','فخ الإحداثيات','الفرق','خط المعالجة','دورك'];
let lang='en',paused=false,pt=0,cc=true,snd=false,au=null;try{lang=localStorage.getItem('sb-lang')==='ar'?'ar':'en'}catch(e){}
const MOB=innerWidth<640,ORD=SC.map((_,k)=>k).filter(k=>!MOB||![2,4,8].includes(k)),SEQ=ORD.map(k=>({...SC[k],cap:[CAP[k],CAPA[k]],ttl:[TTL[k],TTLA[k]]})),TOT=SEQ.reduce((a,q)=>a+q.d,0),AR=()=>lang==='ar';
function sound(on){if(on){if(!au){const A=new (window.AudioContext||window.webkitAudioContext)(),g=A.createGain(),f=A.createBiquadFilter();g.gain.value=0;f.type='lowpass';f.frequency.value=420;[55,82.4,110.3].forEach((fr,k)=>{const o=A.createOscillator();o.type=k?'sine':'triangle';o.frequency.value=fr;o.detune.value=k*7;o.connect(f);o.start()});const l=A.createOscillator(),lg=A.createGain();l.frequency.value=.07;lg.gain.value=90;l.connect(lg);lg.connect(f.frequency);l.start();f.connect(g);g.connect(A.destination);au={A,g}}au.A.resume();au.g.gain.linearRampToValueAtTime(.12,au.A.currentTime+1.5)}else if(au)au.g.gain.linearRampToValueAtTime(0,au.A.currentTime+.6)}
function lab(){const q=SEQ[i];cap.textContent=q.cap[AR()?1:0];ct.textContent=(i+1)+' / '+SEQ.length+'  ·  '+q.ttl[AR()?1:0];cap.dir=ct.dir=AR()?'rtl':'ltr';cap.classList.toggle('ar',AR());$('ftag').textContent=AR()?'رسوم توضيحية: ليست صور سفيريكس الحقيقية.':'Illustrated: generated graphics, not real SPHEREx pixels.';$('fnext').textContent=i===SEQ.length-1?(AR()?'ادخل السماء':'Enter the sky'):(AR()?'التالي ←':'Next →');$('flang').textContent=AR()?'EN':'عربي'}
function show(n){i=cl(n,0,SEQ.length-1);t0=pt=performance.now();lab();[...dots.children].forEach((d,k)=>d.className=k===i?'on':'');$('fback').disabled=i===0}
function setPause(v){if(v)pt=performance.now();else t0+=performance.now()-pt;paused=v;$('fpause').textContent=v?'▶':'II'}
function loop(now){if(!open)return;if(paused)now=pt;const el=now-t0,S=SEQ[i],p=reduce?1:cl(el/S.d);bg();S.f(p,el);const done=SEQ.slice(0,i).reduce((a,q)=>a+q.d,0);$('fprog').firstChild.style.width=(reduce?(i+1)/SEQ.length*100:cl((done+Math.min(el,S.d))/TOT)*100)+'%';
 if(!paused&&!reduce&&el>=S.d&&i<SEQ.length-1)show(i+1);raf=requestAnimationFrame(loop)}
let opener=null,closing=0;
function start(from){size();clearTimeout(closing);open=true;opener=from||null;F.classList.add('on');requestAnimationFrame(()=>F.classList.add('show'));document.documentElement.classList.add('film-open');paused=false;$('fpause').textContent='II';show(0);try{$('fnext').focus({preventScroll:true})}catch(e){}cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);dispatchEvent(new Event('film:open'))}
function close(){if(!open)return;open=false;F.classList.remove('show');document.documentElement.classList.remove('film-open');sound(false);snd=false;$('fsnd').textContent='Sound';$('fsnd').setAttribute('aria-pressed','false');document.body.classList.add('ready');closing=setTimeout(()=>{F.classList.remove('on');cancelAnimationFrame(raf)},reduce?0:520);dispatchEvent(new Event('film:close'));if(opener&&opener.focus)try{opener.focus({preventScroll:true})}catch(e){}}
SEQ.forEach((_,k)=>{const d=document.createElement('i');d.onclick=()=>show(k);dots.appendChild(d)});
$('fnext').onclick=()=>i===SEQ.length-1?close():show(i+1);$('fback').onclick=()=>show(i-1);$('fskip').onclick=close;$('fpause').onclick=()=>setPause(!paused);
$('fcc').onclick=()=>{cc=!cc;cap.style.display=cc?'':'none';$('fcc').setAttribute('aria-pressed',cc)};
$('flang').onclick=()=>{lang=AR()?'en':'ar';try{localStorage.setItem('sb-lang',lang)}catch(e){}lab()};
$('fsnd').onclick=()=>{snd=!snd;sound(snd);$('fsnd').textContent=snd?'Sound on':'Sound';$('fsnd').setAttribute('aria-pressed',snd)};
const rp=document.getElementById('introBtn');if(rp)rp.addEventListener('click',e=>{e.preventDefault();start(rp)});
addEventListener('keydown',e=>{if(!open)return;if(e.key==='Escape')close();else if(e.key==='ArrowRight')show(i+1);else if(e.key==='ArrowLeft')show(i-1);else if(e.key==='p'||(e.key===' '&&document.activeElement===document.body)){e.preventDefault();setPause(!paused)}});
addEventListener('resize',()=>{if(open)size()});
addEventListener('pageshow',e=>{if(e.persisted&&document.body.dataset.page==='home'&&!open)start()});
window.__film={start,close,get i(){return i},get open(){return open},n:SEQ.length};
if(document.body.dataset.page==='home'){const go=()=>start();(document.fonts&&document.fonts.ready?Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))]):Promise.resolve()).then(go)}else document.body.classList.add('ready');
})();

}catch(err){var f=document.getElementById('film');if(f)f.classList.remove('on','show');document.documentElement.classList.remove('film-open');document.body.classList.add('ready');console.error(err)}})();

/* ===== Home ===== */

(function(){
// 2. Multiple Articles Data
    const articles = [
      {
        id: 1,
        category: "Challenge",
        date: "2026 NASA Space Apps Challenge",
        readTime: "3 min read",
        title: "Build a Public Web Tool to Watch the Sky Change",
        image: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=900&q=80",
        excerpt: "Enter a patch of sky and see SPHEREx images play back like a little video, making moving objects easy to spot.",
        content: [
          "The challenge is to create a public-facing web tool that displays SPHEREx images of the sky and makes it easy for anyone to see how they change over time.",
          "Users enter the coordinates of a patch of sky as Right Ascension and declination. The tool then shows a series of images of that patch, so a point of light that shifts between frames stands out.",
          "Nice extras include choosing the field of view, adding or subtracting images from different times, overlaying Gaia or WISE data, showing contamination flags, and accepting coordinates in the URL so the tool can be embedded elsewhere. Try these ideas on the Explore page."
        ]
      },
      {
        id: 2,
        category: "SPHEREx",
        date: "SPHEREx Mission",
        readTime: "4 min read",
        title: "SPHEREx: Mapping the Whole Sky in 102 Infrared Colors",
        image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=80",
        excerpt: "A new all-sky survey, repeated every six months, returns images of more than a billion objects.",
        content: [
          "Since May 2025, SPHEREx has been mapping the whole sky once every six months in 102 bands of near-infrared light.",
          "That makes it especially sensitive to objects rich in hydrogen, water, carbon dioxide, carbon monoxide and many other molecules.",
          "The images cover more than a billion objects, including brown dwarfs, quasars, comets, asteroids, stars, supernovae and galaxies. That is far too much data for any one person, or even one program, to take in, which is why new tools are needed."
        ]
      },
      {
        id: 3,
        category: "Discovery",
        date: "How Discoveries Happen",
        readTime: "4 min read",
        title: "How Moving Dots Become Discoveries",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80",
        excerpt: "From Pluto to brown dwarfs, comparing images taken at different times is one of astronomy’s oldest tricks.",
        content: [
          "Asteroids and comets orbit the Sun, nearby stars drift across the sky as they orbit the Galaxy, and Earth’s own orbit shifts the apparent position of objects close to us.",
          "Pluto was found when an astronomer compared two images of the sky taken at different times and noticed that one point of light had moved.",
          "Today hundreds of thousands of volunteers use the same method through projects like backyardworlds.org, and most known comets and brown dwarfs were found this way. Brown dwarfs are balls of gas too massive to be planets but too small to burn like stars."
        ]
      },
      {
        id: 4,
        category: "Challenge",
        date: "Test Your Tool",
        readTime: "2 min read",
        title: "Five Test Targets for Your Sky Viewer",
        image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80",
        excerpt: "Barnard’s Star, Epsilon Indi B, WISE 0855, RW Aurigae and R Draconis make good checks.",
        content: [
          "The challenge suggests testing your tool on Barnard’s Star, Epsilon Indi B (a pair of brown dwarfs orbiting a star), WISE 0855, and the variable stars RW Aurigae and R Draconis.",
          "WISE 0855 is a fast-moving brown dwarf at Right Ascension 08h55m10.831s and declination -7d14m42.53s, so it is a great test of whether your tool shows motion clearly.",
          "Head to the Explore page to open a sky field and see how the viewer handles each target."
        ]
      }
    ];

    const grid = document.getElementById("articlesGrid");
    const modal = document.getElementById("articleModal");

    function renderArticles(filter = "All") {
      grid.innerHTML = "";
      const filtered = filter === "All" ? articles : articles.filter(a => a.category === filter);

      filtered.forEach(art => {
        const card = document.createElement("article");
        card.className = "article-card";
        card.innerHTML = `
          <div class="article-thumb">
            <img src="${art.image}" alt="${art.title}">
            <span class="article-badge">${art.category}</span>
          </div>
          <div class="article-body">
            <div class="article-meta">${art.date} &bull; ${art.readTime}</div>
            <h3>${art.title}</h3>
            <p class="article-excerpt">${art.excerpt}</p>
            <button class="read-btn">Read Full Article →</button>
          </div>
        `;
        card.querySelector(".read-btn").addEventListener("click", () => openReader(art));
        grid.appendChild(card);
      });
    }

    function openReader(art) {
      document.getElementById("readerImg").src = art.image;
      document.getElementById("readerMeta").textContent = `${art.category} • ${art.date} • ${art.readTime}`;
      document.getElementById("readerTitle").textContent = art.title;
      document.getElementById("readerBody").innerHTML = art.content.map(p => `<p>${p}</p>`).join("");
      modal.classList.add("open");
      document.documentElement.classList.add("modal-open");
      if (window.__fxPause) __fxPause(true);
    }

    function closeReader() {
      modal.classList.remove("open");
      document.documentElement.classList.remove("modal-open");
      if (window.__fxPause && !(window.__film && window.__film.open)) __fxPause(false);
    }
    document.getElementById("closeReader").addEventListener("click", closeReader);
    addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("open")) closeReader(); });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeReader();
    });

    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderArticles(btn.dataset.cat);
      });
    });

    renderArticles();
  
})();
  

/* ===== Explore viewer ===== */
(function(){

const $=id=>document.getElementById(id),lerp=(a,b,t)=>a+(b-a)*t,NE=24,T0=2025.35,T1=2026.85,TR=2026.1,PXS=6.15,OBS=Array.from({length:NE},(_,i)=>T0+(T1-T0)*i/(NE-1));
const BANDS=[[.75,1.09],[1.1,1.62],[1.63,2.41],[2.42,3.82],[3.83,4.41],[4.42,5]],HUE=['#8fa8ff','#4cc9f0','#7ee081','#f2d45c','#f29b5c','#ef6f8e'];
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hash=(a,b)=>Math.floor(a*1000)*73856093^Math.floor(b*1000)*19349663,g=(x,m,s)=>Math.exp(-(((x-m)/s)**2));
function S(c,l){let v;if(c==='Y')v=.03+g(l,4.55,.45)+.1*g(l,1.25,.08);else if(c==='M')v=.9*(1.1/l)**2;else if(c==='T')v=.1+.8*g(l,1.27,.12)+.5*g(l,1.6,.1)+.55*g(l,4.2,.5);
 else if(c==='Mira')v=.3+.5*(l/5)**1.2-.25*g(l,2.75,.2)-.15*g(l,4.3,.15);else if(c==='TT')v=.6+.2*l/5+.2*g(l,3,.4);else v=.2+.7*g(l,3.29,.08)-.15*g(l,3,.15);return Math.max(.02,v)}
const LAM=(d,c)=>{const[a,b]=BANDS[d-1];return a+(c-.5)/17*(b-a)},rel=e=>e<2026.4?'DR1':'QR3';
const SRC='https://spherex.caltech.edu/',DL=(id,fn,ts,k,d,s,t)=>({id,fn,ts,k,d,s,t});
const K7=['medium','large','larger','largest','huge','huger','jpg_original'],K6=['medium','large','larger','largest','huge','jpg_original'],K5=['medium','large','larger','largest','jpg_original'];
const SQ=['320x320','500x500','1024x1024','1280x1280','1600x1600','3000x3000','3000x3000'],WD=['320x180','500x281','1024x576','1280x720','1600x900','3000x1688','4160x2340'],NG=['320x180','500x281','1024x576','1280x720','1600x900','2280x1282'],MS=['320x180','500x281','1024x576','1280x720','953x536'];
const IMG=(s,t)=>['Image',t,'image/'+s],A='spherex20260415a-nasas-spherex-observatory-maps-interstellar-ice-in-milky-way',B='spherex20260415b-nasas-spherex-observatory-maps-stars-and-dust-in-cygnus',SA='spherex20251218a-spherex-all-sky-map-2025',SB='spherex20251218b-spherex-all-sky-map-2025-stars-and-galaxies',SC='spherex20251218c-spherex-all-sky-map-2025-dust-and-gas',NA='spherex20250501a-early-spherex-observations-ngc-1760-at-0-96-microns',NB='spherex20250501b-early-spherex-observations-ngc-1760-at-0-98-microns',NC='spherex20250501c-early-spherex-observations-ngc-1760-at-3-29-microns';
const REL={cyg:[['Article','‘Interstellar Glaciers’: NASA’s SPHEREx Maps Vast Galactic Ice Regions','news/interstellar-glaciers-nasa-s-spherex-maps-vast-galactic-ice-regions'],IMG(A,'NASA’s SPHEREx Observatory Maps Interstellar Ice in Milky Way'),IMG(B,'NASA’s SPHEREx Observatory Maps Stars and Dust in Cygnus')],
sky:[['Article','NASA’s SPHEREx Observatory Completes First Cosmic Map Like No Other','news/nasa-s-spherex-observatory-completes-first-cosmic-map-like-no-other'],IMG(SA,'SPHEREx All Sky Map 2025'),IMG(SB,'SPHEREx All Sky Map 2025: Stars and Galaxies'),IMG(SC,'SPHEREx All Sky Map 2025: Dust and Gas'),['Video','SPHEREx First All-Sky Map - Panorama','video/spherex-first-all-sky-map-panorama'],['Video','SPHEREx First All-Sky Map - Spectrum','video/spherex-first-all-sky-map-spectrum']],
ngc:[['Article','NASA’s SPHEREx Space Telescope Begins Capturing Entire Sky','news/nasa-s-spherex-space-telescope-begins-capturing-entire-sky'],IMG(NA,'NGC 1760 at 0.96 microns'),IMG(NB,'NGC 1760 at 0.98 microns'),IMG(NC,'NGC 1760 at 3.29 microns'),['Video','SPHEREx Scans the Sky','video/spherex-scans-the-sky']]};
const LAUNCH='SPHEREx launched on 11 March 2025. It sees the sky in 102 colors, each a different infrared wavelength that carries its own clues about galaxies, stars, planet-forming regions and other cosmic features.';
const CYGP='RA 20h 30m 32.0s · Dec +40° 17′ 50.2″',NGCP='RA 4h 57m 43.6s · Dec −66° 21′ 5.2″ (J2000)',NGO=['NGC 1760','Nebula › Star Formation','163,000 light years'];
const NGT='SPHEREx is mapping the whole sky in 102 colors of infrared light that people cannot see. NGC 1760 is a star-forming nebula in the neighboring Large Magellanic Cloud galaxy. ',NGQ='The picture uses data from only four pointings of the multispectral detectors, taken while the team prepared for the start of science operations on 1 May 2025; strips from the four observations were assembled into one single-wavelength image.';
const SK0='Mosaic assembled from SPHEREx data gathered between May and December 2025, showing a small selection of the 102 infrared colors. Infrared is invisible to the eye, so the colors are shown in visible ones. ',SKM='The bright feature through the middle is the Milky Way; most points of light above and below it are other galaxies.',SKS='Spectroscopy splits light into its wavelengths. SPHEREx will use it to measure distances to galaxies and map the 3D distribution of hundreds of millions of them. The all-sky spectral map should give new insight into inflation, the dramatic event in the first billionth of a trillionth of a trillionth of a second after the big bang, which subtly shaped how galaxies are spread out.',SKR='To keep files small, the resolution is reduced by a factor of one thousand from the full SPHEREx data. The elliptical projection covers the entire visible sky.',PAH='The prominent red clouds are polycyclic aromatic hydrocarbons (PAHs), dust that is a common ingredient in forming stars and planets and that emits mainly near 3.4 µm. The blue bubbles are hot hydrogen gas, at about 4 µm.',ICE='Other SPHEREx wavelengths reveal water ice, carbon dioxide ice and carbon monoxide ice; with the all-sky view, scientists can map where these building blocks of organic material, essential to life as we know it, lie across the Milky Way.';
const IM=[
{n:'Cygnus: stars and dust',d:'15 Apr 2026',ra:307.633339,dec:40.297291,fv:'5.1° × 5.1°',fd:[5.1,5.1],w:'0.8, 1.63, 2.6 µm',c:'NASA/JPL-Caltech/IPAC/Hora et al.',u:B,h:[75,25],dens:380,
 info:{full:'NASA’s SPHEREx Observatory Maps Stars and Dust in Cygnus',kind:'Observation',iso:'2026-04-15',pos:CYGP,ori:'North is 53.9° left of vertical',obj:['(name not listed)','Nebula › Interstellar Medium'],bands:[['Infrared','800 nm'],['Infrared','1.6 µm'],['Infrared','2.6 µm']],
 txt:['A dusty infrared starfield toward the constellation Cygnus, seen by SPHEREx (Spectro-Photometer for the History of the Universe, Epoch of Reionization, and Ices Explorer).','Three of the 102 wavelengths SPHEREx maps (0.8, 1.63 and 2.6 µm, assigned to blue, green and red) show starlight from deep in the disk of the Milky Way.','Dust clouds grow more transparent at longer wavelengths, so stars behind thicker dust look yellow or red. The very densest clouds stay opaque even in the near infrared and show up as black streaks.',LAUNCH],
 vis:'A square frame packed edge to edge with hundreds of thousands of needle-fine stars, like high-resolution static, over a mottled background of olive-green and rusty-orange cloud texture that resembles tea stains or mineral veins. Most stars are cool white or pale blue. The top and bottom edges lean slightly blue-violet and the centre is a warmer yellow-green. A jagged dark rift of dense dust cuts diagonally from the upper right toward the centre-left, like a shadowed canyon.',
 dl:DL(44,'SPHEREx_Cygnus_Broadband.jpg',1776744276,K7,SQ,['70.4 KB','154 KB','646 KB','1020 KB','1.56 MB','4.79 MB','4.79 MB'],['3000 x 3000','26.1 MB']),rel:REL.cyg}},
{n:'Cygnus X: interstellar ice',d:'15 Apr 2026',ra:307.633339,dec:40.297291,fv:'5.1° × 5.1°',fd:[5.1,5.1],w:'3.0 µm (H₂O ice), 3.3 µm (PAH)',c:'NASA/JPL-Caltech/IPAC/Hora et al.',u:A,h:[205,28],dens:300,
 info:{full:'NASA’s SPHEREx Observatory Maps Interstellar Ice in Milky Way',kind:'Observation',iso:'2026-04-15',pos:CYGP,ori:'North is 53.9° left of vertical',obj:['(name not listed)','Nebula › Interstellar Medium'],bands:[['Infrared','3.0 µm'],['Infrared','3.3 µm']],
 txt:['Chemical signatures of water ice (bright blue) and polycyclic aromatic hydrocarbons, PAHs (orange) in Cygnus X, one of the most active and turbulent star-forming regions of the Milky Way. The image was released on 15 April 2026 together with a study of the observation.','Mapping the chemical signatures of interstellar ices (water, carbon dioxide, carbon monoxide) is a main SPHEREx goal. These molecules are vital to the chemistry that lets life develop. Researchers believe the ice reservoirs on tiny dust grains are where most of the universe’s water forms and is stored, and that the water in Earth’s oceans and the ices in comets and on other planets and moons began in such regions.',LAUNCH],
 vis:'A dark square frame with a near-black background and wispy glowing filaments of copper and burnt orange, shredded at the edges like embers or tangled wool, following the thinner dust clouds. Inside the thickest parts sit sharper, brighter electric-blue veins and clumps, like jagged icebergs on an inky sea; this is the spectral signature of water ice clinging to dust grains. A prominent spine of material runs diagonally from the lower left to the upper right, where orange and blue concentrate. Away from it the clouds break into lacy threads like plant roots or nerve-cell dendrites.',
 dl:DL(43,'SPHEREs_Cygnus_H2O_Ice.jpg',1776743980,K7,SQ,['62.8 KB','113 KB','322 KB','449 KB','623 KB','1.52 MB','1.52 MB'],['3000 x 3000','10.3 MB']),rel:REL.cyg}},
{n:'All-sky map 2025: stars and galaxies',d:'18 Dec 2025',fv:'all sky (elliptical projection)',w:'830 nm, 1.7 µm, 4.8 µm',c:'NASA/JPL-Caltech',u:SB,h:[215],dens:420,span:40,
 info:{full:'SPHEREx All Sky Map 2025: Stars and Galaxies',kind:'Observation',iso:'2025-12-18',pos:'not listed (all-sky map)',ori:'',obj:['Milky Way','Galaxy › Spiral'],bands:[['Infrared','830 nm'],['Infrared','1.7 µm'],['Infrared','4.8 µm']],
 txt:[SK0+'The colors chosen highlight stars at short, medium and long wavelengths, mapped to blue, green and red.',SKM,SKS,SKR],vis:'',
 dl:DL(41,'SPHEREx_StarsRGB.jpg',1766089754,K7,WD,['27.3 KB','46.2 KB','167 KB','263 KB','413 KB','1.35 MB','2.37 MB'],['4160 x 2340','14.3 MB']),rel:REL.sky}},
{n:'All-sky map 2025',d:'18 Dec 2025',fv:'all sky (elliptical projection)',w:'830 nm, 1.7 µm, 4.8 µm, 3.4 µm, 4.0 µm',c:'NASA/JPL-Caltech',u:SA,h:[8,215,120],dens:420,span:40,
 info:{full:'SPHEREx All Sky Map 2025',kind:'Observation',iso:'2025-12-18',pos:'not listed (all-sky map)',ori:'',obj:['Milky Way','Galaxy › Spiral'],bands:[['Infrared','830 nm'],['Infrared','1.7 µm'],['Infrared','4.8 µm'],['Infrared','3.4 µm'],['Infrared','4.0 µm']],
 txt:[SK0+'The colors chosen highlight stars (blue, green and white), hot hydrogen gas (blue) and cosmic dust (red).',SKM,PAH,'This image shows one main use of spectroscopy: identifying the presence of particular chemicals. '+ICE,'Spectroscopy can also measure distances to other galaxies. '+SKS.replace('Spectroscopy splits light into its wavelengths. ',''),SKR],vis:'',
 dl:DL(40,'SPHEREx_StarsRGB_LinesRB.jpg',1766089662,K7,WD,['30.1 KB','46.8 KB','142 KB','214 KB','324 KB','1010 KB','1.71 MB'],['4160 x 2340','11.4 MB']),rel:REL.sky}},
{n:'All-sky map 2025: dust and gas',d:'18 Dec 2025',fv:'all sky (elliptical projection)',w:'dust 3.4 µm (red), hot gas 4.0 µm (blue)',c:'NASA/JPL-Caltech',u:SC,h:[8,215],dens:250,span:40,
 info:{full:'SPHEREx All Sky Map 2025: Dust and Gas',kind:'Observation',iso:'2025-12-18',pos:'not listed (all-sky map)',ori:'',obj:['Milky Way','Galaxy › Spiral'],bands:[['Infrared','3.4 µm'],['Infrared','4.0 µm']],
 txt:['Mosaic assembled from SPHEREx data gathered between May and December 2025, showing just two of the 102 infrared colors, chosen to highlight hot hydrogen gas (blue) and cosmic dust (red). The bright band through the middle is the Milky Way, filled with gas and dust.',PAH,'This image illustrates a main use of spectroscopy: identifying chemicals. '+ICE,SKR],vis:'',
 dl:DL(42,'SPHEREx_LinesRB.jpg',1766089789,K7,WD,['27.4 KB','39.6 KB','94 KB','129 KB','178 KB','446 KB','724 KB'],['4160 x 2340','5.37 MB']),rel:REL.sky}},
{n:'SPHEREx images mosaic (LMC N11)',d:'5 May 2025',ra:74.43167,dec:-66.35144,inf:1,fv:'not listed (NGC 1760 field assumed, 1.3° × 0.7°)',fd:[1.3,.7],w:'0.98 µm (blue), 0.96 µm (green), 3.29 µm (red)',c:'',u:'spherex-images-mosaic',h:[135,25,215],dens:220,
 info:{full:'SPHEREx Images Mosaic',kind:'Artwork',iso:'2025-05-05',pos:'not listed on the page; file name LMC_N11_v2 points to N11 in the Large Magellanic Cloud, so the NGC 1760 position is assumed here',ori:'',obj:['(not listed)','(not listed)'],bands:[],
 txt:['Three-color mosaic of SPHEREx images from channels centered at 0.98 µm (blue), 0.96 µm (green) and 3.29 µm (red). The green areas are ionized regions near a cluster of young stars (blue), traced by the doubly ionized sulfur line; red traces emission from the surrounding dusty PAHs.'],vis:'',
 dl:DL(38,'LMC_N11_v2.jpg',1746469877,K5,MS,['32.6 KB','63.8 KB','167 KB','227 KB','166 KB'],null),rel:[]}},
{n:'NGC 1760 at 3.29 µm',d:'1 May 2025',ra:74.43167,dec:-66.35144,fv:'1.3° × 0.7°',fd:[1.3,.7],w:'3.29 µm (PAH)',c:'NASA/JPL-Caltech',u:NC,h:[25],dens:120,
 info:{full:'Early SPHEREx Observations: NGC 1760 at 3.29 microns',kind:'Observation',iso:'2025-05-01',pos:NGCP,ori:'North is 53.3° right of vertical',obj:NGO,bands:[['Infrared','3.3 µm']],
 txt:[NGT+'At 3.29 µm the image shows the glow of sooty, carbon-based dust particles called polycyclic aromatic hydrocarbons (PAHs).',NGQ],vis:'',
 dl:DL(37,'SPHEREx_D4_3p29.jpg',1746231953,K6,NG,['53.2 KB','98.3 KB','263 KB','355 KB','476 KB','753 KB'],['2280 x 1282','3.64 MB']),rel:REL.ngc}},
{n:'NGC 1760 at 0.96 µm',d:'1 May 2025',ra:74.43167,dec:-66.35144,fv:'1.3° × 0.7°',fd:[1.3,.7],w:'0.96 µm (S III)',c:'NASA/JPL-Caltech',u:NA,h:[135],dens:200,
 info:{full:'Early SPHEREx Observations: NGC 1760 at 0.96 microns',kind:'Observation',iso:'2025-05-01',pos:NGCP,ori:'North is 53.3° right of vertical',obj:NGO,bands:[['Infrared','960 nm']],
 txt:[NGT+'At 0.96 µm the image shows ionized gaseous sulfur (S III), heated by nearby stars until it has lost two electrons.',NGQ+' The grey strip along the top is an area not mapped at this wavelength in the four available pointings.'],vis:'',
 dl:DL(36,'SPHEREx_D1_0p96.jpg',1746231875,K6,NG,['50 KB','94.4 KB','256 KB','349 KB','475 KB','765 KB'],['2280 x 1282','3.98 MB']),rel:REL.ngc}},
{n:'NGC 1760 at 0.98 µm',d:'1 May 2025',ra:74.43167,dec:-66.35144,fv:'1.3° × 0.7° (same field)',fd:[1.3,.7],w:'0.98 µm (stars only)',c:'NASA/JPL-Caltech',u:NB,h:[],dens:260,
 info:{full:'Early SPHEREx Observations: NGC 1760 at 0.98 microns',kind:'Observation',iso:'2025-05-01',pos:NGCP,ori:'North is 53.3° right of vertical',obj:NGO,bands:[['Infrared','980 nm']],
 txt:[NGT+'At 0.98 µm there is very little glow from the nebula’s gas and dust, so only starlight remains.',NGQ],vis:'',
 dl:DL(35,'SPHEREx_D1_0p98.jpg',1746231822,K6,NG,['55.4 KB','107 KB','302 KB','414 KB','566 KB','926 KB'],['2280 x 1282','4.8 MB']),rel:REL.ngc}}];
const TG=[
{n:'Barnard’s Star',ra:269.4521,dec:4.6934,pm:[-.8,10.33],ref:2000,cls:'M',kind:'m',g:1,b:.9,src:'epoch J2000; motion from memory (Hipparcos), verify in SIMBAD'},
{n:'Epsilon Indi B',ra:331.0433,dec:-56.7826,pm:[3.98,-2.47],ref:2000,cls:'T',kind:'m',g:1,b:.6,src:'RA 22h04m10.4s, Dec −56°46′57″ near epoch 2000 (SuperCOSMOS); PM from Wikipedia'},
{n:'WISE 0855',ra:133.79513,dec:-7.24515,pm:[-8.1237,.6732],ref:2010.5,cls:'Y',kind:'m',g:0,b:.5,src:'challenge position, epoch ≈2010.5 (my derivation); PM −8123.7, +673.2 mas/yr'},
{n:'RW Aurigae',ra:76.9563,dec:30.4014,pm:[.004,-.027],ref:2000,cls:'TT',kind:'v',P:.2,g:1,b:.9,src:'05h07m49.5s +30°24′05″; irregular T Tauri dimmings'},
{n:'R Draconis',ra:248.1667,dec:66.7547,pm:[0,0],ref:2000,cls:'Mira',kind:'v',P:.67,g:1,b:.9,src:'16h32m40s +66°45′17″; Mira, ~246 day period'}];
function mk(s){const f={...s},r=rng(hash(s.ra||3,s.dec||5)+s.n.length);f.span=s.span||(s.fd?Math.min(40,Math.max(1,Math.max(...s.fd)*3600/600)):1);f.fmax=600*f.span;f.fv0=Math.min(f.fmax,s.fd?Math.round(Math.max(...s.fd)*3600):240);
 f.stars=Array.from({length:f.dens||220},()=>({x:(r()-.5)*1400,y:(r()-.5)*1400,f:Math.pow(r(),3)}));
 f.blobs=(f.h||(f.pm?[]:[200,25])).flatMap(h=>Array.from({length:3},()=>({x:(r()-.5)*600,y:(r()-.5)*600,r:100+r()*220,h})));
 if(!f.pm){const a=r()*6.28,m=60+r()*60;f.pm=[m*Math.cos(a),m*Math.sin(a)];f.ref=TR;f.kind='m';f.cls='M';f.g=0;f.b=.6;f.sim=1}
 f.dem=f.ra==null;if(f.dem){f.ra=0;f.dec=0}
 f.crf=Math.cos(f.dec*Math.PI/180)||1;f.cra=f.ra+f.pm[0]*(TR-f.ref)/3600/f.crf;f.cde=f.dec+f.pm[1]*(TR-f.ref)/3600;
 f.hot=Array.from({length:6},()=>[(r()-.5)*1.8,(r()-.5)*1.8]);f.obj=[{id:'T',st:f.g?'Known (Gaia)':'Not in Gaia',pm:[-f.pm[0],f.pm[1]],x0:0,y0:0,b:f.b},
 {id:'K',st:'Known (Gaia)',pm:[1.2,-.9],x0:-70,y0:45,b:.5},{id:'U',st:'simulated training exercise: unmatched candidate',pm:[7,-4],x0:55,y0:-60,b:.45}];if(f.dem||s.noU)f.obj=f.obj.filter(b=>b.id!=='U');return f}
const IMF=IM.map(mk),TGF=TG.map(mk);
function sky(c,F,k,o){const ep=OBS[k],W=c.width,x=c.getContext('2d'),q=W/o.fov,X=v=>W/2+(v-o.ox)*q,Y=v=>W/2-(v-o.oy)*q,s=Math.min(2.2,Math.max(.5,q)),sf=1+.12*(o.det-3)+.02*(o.ch-9);
 x.fillStyle='#04060d';x.fillRect(0,0,W,W);
 const sp=F.span;F.blobs.forEach(b=>{const r=x.createRadialGradient(X(b.x*sp),Y(b.y*sp),0,X(b.x*sp),Y(b.y*sp),b.r*sp*q);r.addColorStop(0,`hsla(${b.h},90%,58%,.5)`);r.addColorStop(1,`hsla(${b.h},90%,50%,0)`);x.fillStyle=r;x.fillRect(0,0,W,W)});
 const dot=(px,py,r,cl)=>{const d=x.createRadialGradient(px,py,0,px,py,r);d.addColorStop(0,cl);d.addColorStop(1,'rgba(255,230,160,0)');x.fillStyle=d;x.fillRect(px-r,py-r,2*r,2*r)};
 F.stars.forEach(t=>{const px=X(t.x*sp),py=Y(t.y*sp);if(px<-30||py<-30||px>W+30||py>W+30)return;dot(px,py,(1.6+t.f*5)*s,`rgba(255,245,230,${Math.min(1,(.45+t.f*.55)*sf)})`)});
 const bs=o.cat?F.ref:TR,P=(b,t)=>b.id==='T'?[(t-bs)*b.pm[0],(t-bs)*b.pm[1]]:[b.x0+(t-TR)*b.pm[0],b.y0+(t-TR)*b.pm[1]],lam=LAM(o.det,o.ch);
 const br=b=>b.id==='T'?F.b*S(F.cls,lam)*(F.kind==='v'?1+.6*Math.sin(6.283*(ep-T0)/(F.P||1)):1):b.b*.8;
 const cl={T:'255,209,102',K:'125,249,255',U:'255,120,200'};
 F.obj.forEach(b=>{if(!o.full&&b.id!=='T'&&!(o.dets))return;const p=P(b,ep),px=X(p[0]),py=Y(p[1]);
  if(o.trail&&(b.id==='T'||o.dets&&b.id==='U'))OBS.slice(0,k).forEach(e=>{const t=P(b,e);dot(X(t[0]),Y(t[1]),3*s,`rgba(${o.dets?cl[b.id]:cl.T},.45)`)});
  dot(px,py,(4+8*Math.min(1.3,br(b)))*s,`rgba(${o.dets?cl[b.id]:cl.T},1)`);
  if(o.mark&&b.id==='T'||o.dets){x.strokeStyle=`rgb(${cl[b.id]})`;x.lineWidth=1.5;x.setLineDash([4,4]);x.beginPath();x.arc(px,py,12*s+6,0,6.3);x.stroke();x.setLineDash([]);if(o.dets){x.fillStyle=`rgb(${cl[b.id]})`;x.font='12px Barlow,sans-serif';x.fillText(b.id==='T'?'target':b.id==='K'?'known':'simulated',px+14*s+4,py-8)}}
  if(o.gaia&&(b.id==='K'||b.id==='T'&&F.g)){x.strokeStyle='#4cc9f0';x.lineWidth=1.5;x.beginPath();x.arc(px,py,9*s+10,0,6.3);x.stroke()}
  if(o.wise&&b.id!=='U'){x.strokeStyle='#f29b5c';x.lineWidth=1.5;x.strokeRect(px-8*s-6,py-8*s-6,16*s+12,16*s+12)}});
 F.hot.forEach(h=>{const px=X(h[0]*140),py=Y(h[1]*140);x.fillStyle='rgba(255,255,255,.55)';x.fillRect(px-1,py-1,3,3);if(o.mask){x.strokeStyle='#c77dff';x.lineWidth=1.5;x.strokeRect(px-5,py-5,10,10)}});
 if(o.mask&&k%5===2){x.strokeStyle='#4cc9f0';x.beginPath();x.arc(W*.3,W*.72,12,0,6.3);x.stroke();x.fillStyle='#4cc9f0';x.font='11px Barlow,sans-serif';x.fillText('GHOST',W*.3+14,W*.72)}
 if(o.mask&&k%7===3){x.strokeStyle='#ff4d6d';x.lineWidth=2;x.beginPath();x.moveTo(W*.1,W*.2);x.lineTo(W*.9,W*.34);x.stroke();x.fillStyle='#ff4d6d';x.fillText('STREAK',W*.1,W*.2-6)}
 x.fillStyle='rgba(8,9,18,.72)';x.fillRect(6,6,W>400?230:150,22);x.fillStyle='#e6f6ff';x.font='600 12px Barlow,sans-serif';x.fillText(`${ep.toFixed(2)} · D${o.det} ch${o.ch} · ${rel(ep)}`,12,21)}
/* carousel */
const ring=$('ring'),N=9,SN=40;let R=400,a=0,spin=false,vel=0,drag=null,moved=0,lt=0,shown=-1,hit=null;
IMF.forEach((F,i)=>{const c=document.createElement('div');c.className='card';c.dataset.i=i;c.style.setProperty('--i',i);
 ['f','b'].forEach(s=>{const f=document.createElement('div');f.className='face '+s;f.innerHTML=`<canvas width="200" height="200"></canvas><b>${F.n}</b><small>${F.d}</small><em>#${i+1}</em>`;sky(f.firstChild,F,12,{ox:0,oy:0,fov:420*F.span,det:2,ch:7});c.append(f)});ring.append(c)});
const cards=[...ring.children];
function size(){R=ring.offsetWidth*1.12/(2*Math.tan(Math.PI/N));ring.style.setProperty('--R',R+'px')}
function apply(){ring.style.transform=`translateZ(${-R}px) rotateX(-10deg) rotateY(${a}deg)`;cards.forEach((c,i)=>c.style.setProperty('--o',(.3+.7*(Math.cos((i*SN+a)*Math.PI/180)+1)/2).toFixed(2)));
 const i=((Math.round(-a/SN)%N)+N)%N;if(i!==shown){shown=i;const F=IMF[i];$('sel').innerHTML=`<b>#${i+1} ${F.n}</b><small>${F.d} · ${F.dem?'position not listed on the source page':`RA ${F.ra.toFixed(4)}°  Dec ${F.dec.toFixed(4)}°${F.inf?' (assumed)':''}`} · FOV ${F.fv}<br>${F.w} · Credit ${F.c}<br><a href="https://spherex.caltech.edu/image/${F.u}" target="_blank" rel="noopener">Open the real image page ↗</a> · click the card to open the viewer</small>`}}
function loop(t){if(document.body.dataset.page!=='explore'){lt=t;requestAnimationFrame(loop);return}const dt=Math.min(.05,(t-lt)/1000||0);lt=t;if(!drag){if(spin){vel+=(16-vel)*.05;a-=vel*dt}else{vel=0;a+=(Math.round(a/SN)*SN-a)*.12}}apply();if(M&&M.play&&!$('md').hidden&&M.tab==='view'&&t-pl>1000/+$('spd').value){pl=t;M.k=(M.k+1)%NE;render()}requestAnimationFrame(loop)}
let pl=0;const st=$('st');
st.onpointerdown=e=>{drag={x:e.clientX,a0:a};moved=0;hit=e.target.closest('.card')};
addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;moved=Math.max(moved,Math.abs(dx));a=drag.a0+dx*.3});
addEventListener('pointerup',()=>{if(drag&&moved<6&&hit)openM(IMF[+hit.dataset.i],'i'+hit.dataset.i);drag=null;hit=null});
st.onkeydown=e=>{if(e.key==='ArrowLeft')a+=SN;else if(e.key==='ArrowRight')a-=SN;else if(e.key==='Enter')openM(IMF[shown],'i'+shown);else return;e.preventDefault();spin=false;$('sp').textContent='SPIN ORBIT'};
$('sp').onclick=()=>{spin=!spin;$('sp').textContent=spin?'STOP ORBIT':'SPIN ORBIT'};
TGF.forEach((F,i)=>{const b=document.createElement('button');b.textContent=F.n;b.onclick=()=>openM(F,'t'+i);$('chips').append(b)});
/* viewer */
let M=null,ft=null,bt=null;const TABS=[['info','About'],['view','View'],['cmp','Compare'],['dis','Discover'],['spec','Spectrum'],['q','Quality']];
TABS.forEach(([k,l])=>{const b=document.createElement('button');b.textContent=l;b.dataset.t=k;b.onclick=()=>{M.tab=k;render()};$('tabs').append(b)});
for(let d=1;d<=6;d++)$('sd').add(new Option(`D${d} (${BANDS[d-1][0]}–${BANDS[d-1][1]} µm)`,d));for(let c=1;c<=17;c++)$('sc').add(new Option(c,c));
OBS.forEach((e,i)=>{const t=new Date(Date.UTC(Math.floor(e),0,1)+(e%1)*365.25*864e5).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});$('ea').add(new Option(`${t} (${rel(e)})`,i));$('eb').add(new Option(`${t} (${rel(e)})`,i))});
const toD=y=>new Date(Date.UTC(Math.floor(y),0,1)+(y%1)*365.25*864e5),iso=y=>toD(y).toISOString().slice(0,10),pretty=y=>toD(y).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
const fromIso=v=>{const d=new Date(v+'T00:00:00Z'),y=d.getUTCFullYear();return y+(d-Date.UTC(y,0,1))/(365.25*864e5)},nearK=y=>OBS.reduce((b,e,i)=>Math.abs(e-y)<Math.abs(OBS[b]-y)?i:b,0);
const ob=()=>({ox:M.ox,oy:M.oy,fov:M.fov,det:M.det,ch:M.ch,trail:$('tr').checked,mark:$('mkc').checked,cat:$('cat').checked,gaia:$('gaia').checked,wise:$('wise').checked,dets:$('dets').checked,mask:$('mask').checked});
const REALT={'Barnard’s Star':{ra:269.452075,dec:4.693364,det:'d2'},'Epsilon Indi B':{ra:331.044147,dec:-56.782844,det:'d6'},'WISE 0855':{ra:133.795129,dec:-7.245147,det:'d6'},'RW Aurigae':{ra:76.956375,dec:30.401389,det:'d2'},'R Draconis':{ra:248.167625,dec:66.755,det:'d3'}};
/* real SPHEREx DR1 frames from cache/index.json */
let RC=null,rcP=null;const normName=s=>String(s).toLowerCase().replace(/[’‘`]/g,"'").replace(/\s+/g,' ').trim(),CHAL=['wise 0855',"barnard's star",'epsilon indi b','rw aurigae','r draconis'];
function loadReal(){if(!rcP)rcP=fetch('cache/index.json').then(r=>r.json()).then(j=>{RC=j;return j}).catch(()=>{RC={targets:[]};return RC});return rcP}
function frList(t,kind){const d=(t&&t[kind])||{};for(const k of Object.keys(d))if(d[k]&&d[k].length)return{det:k,list:d[k]};return null}
async function setupReal(F){
 M.realState='loading';M.realSet=null;M.realMode='passes';$('realDiffWrap').hidden=true;
 const j=await loadReal();if(!M||M.F!==F)return;
 const t=CHAL.includes(normName(F.n))?(RC.targets||[]).find(x=>normName(x.name)===normName(F.n)):null;
 const has=t&&frList(t,'detectors');
 if(!has){M.realState=t?'processing':'none';
  if(t)$('mm').textContent='simulated training exercise: illustrated sky, not real SPHEREx pixels. real frames for this target are still processing.';
  render();return}
 const det=has.det,passes=t.detectors[det],diffs=(t.differences&&t.differences[det])||[];
 const jm=u=>fetch(u).then(r=>r.json()).catch(()=>({})),im=src=>new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src});
 const [P,D]=await Promise.all([Promise.all(passes.map(f=>Promise.all([im(f.png),jm(f.json)]))),Promise.all(diffs.map(f=>Promise.all([im(f.png),jm(f.json)])))]);
 if(!M||M.F!==F)return;
 M.realSet={det,passes:P.map(([img,meta])=>({img,meta})).filter(f=>f.img),diffs:D.map(([img,meta])=>({img,meta})).filter(f=>f.img)};
 M.realState=M.realSet.passes.length?'ready':'processing';
 if(M.realState==='ready'){$('mm').textContent=`Real SPHEREx DR1 data · detector ${det} · survey-pass coadds`;$('realDiffWrap').hidden=!M.realSet.diffs.length;$('realDiff').checked=false}
 else $('mm').textContent='simulated training exercise: illustrated sky, not real SPHEREx pixels. real frames for this target are still processing.';
 render()}
function drawReal(){
 const rs=M.realSet,list=M.realMode==='diff'?rs.diffs:rs.passes,c=$('big'),x=c.getContext('2d'),W=c.width;
 x.fillStyle='#04060d';x.fillRect(0,0,W,W);
 const i=list.length?M.k%list.length:0,f=list[i];
 if(f&&f.img){const s=Math.min(W/f.img.naturalWidth,W/f.img.naturalHeight),w=f.img.naturalWidth*s,h=f.img.naturalHeight*s;x.drawImage(f.img,(W-w)/2,(W-h)/2,w,h)}
 else{x.fillStyle='#D0D6F9';x.font='14px Barlow,sans-serif';x.fillText('loading real frame...',20,W/2)}
 const meta=(f&&f.meta)||{},txt=M.realMode==='diff'?`real spherex dr1 data: difference, ${meta.epoch_label||''}`:`real spherex dr1 data: ${meta.epoch_label||''}, ${meta.visit_count||'?'} visits`;
 x.fillStyle='rgba(8,9,18,.72)';x.fillRect(6,6,Math.min(W-12,Math.max(230,txt.length*6.6+16)),22);x.fillStyle='#e6f6ff';x.font='600 12px Barlow,sans-serif';x.fillText(txt,12,21)}
function openM(F,src,init){M={F,src,k:12,ox:0,oy:0,fov:F.fv0||240,det:2,ch:7,tab:F.info?'info':'view',play:false,saved:[],...(init||{})};M.fov=Math.max(60,Math.min(F.fmax,M.fov));$('fov').max=F.fmax;$('fov').step=Math.max(10,Math.round(F.fmax/400));document.querySelectorAll('#tabs button').forEach(b=>b.hidden=b.dataset.t==='info'&&!F.info);$('dets').checked=false;$('mt').textContent=F.n;
 $('mm').textContent=F.sim?'Simulated field with a simulated mover (position not from a catalog)':F.dem?'Position not listed on the source page: demo field':(F.src||`${F.d} · FOV ${F.fv} · ${F.w}`);
 const rt=REALT[F.n],rl=$('realLink');
 if(rl)rl.href=rt?`index.html?ra=${rt.ra}&dec=${rt.dec}&fov=5&det=${rt.det}&mode=blink`:`index.html?ra=${F.ra!=null?F.ra:0}&dec=${F.dec!=null?F.dec:0}&fov=5`;
 $('md').hidden=false;$('pl').textContent='Play';$('x').focus();$('ea').value=4;$('eb').value=19;
 clearInterval(ft);const pg=$('pg');pg.hidden=false;let n=0;ft=setInterval(()=>{n++;const fail=n===9?2:0;$('pf').style.width=Math.min(100,n/NE*100)+'%';$('pt').textContent=fail?'2 cutouts failed, retrying…':`Fetching cutouts ${Math.min(n,NE)}/${NE}`;if(n>=NE){clearInterval(ft);pg.hidden=true}},45);render();setupReal(F)}
function closeM(){$('md').hidden=true;clearInterval(ft);clearInterval(bt);try{history.replaceState(null,'','#explore')}catch(e){}st.focus()}
function render(){const F=M.F,e=OBS[M.k];if(M.tab==='info'&&!F.info)M.tab='view';const t=M.tab,can=!hasU(F)||M.tries>0;$('dets').disabled=!can;$('dets').parentElement.title=can?'':'Try to find the unmatched source first (Discover tab)';if(!can)$('dets').checked=false;if($('dets').checked&&hasU(F))M.shown=1;document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
 ['info','view','cmp','dis','spec','q'].forEach(k=>$('p-'+k).hidden=k!==t);$('big').hidden=t==='cmp';$('cmpw').hidden=t!=='cmp';$('sd').value=M.det;$('sc').value=M.ch;
 const cos=F.crf,cr=F.cra-M.ox/3600/cos,cd=F.cde+M.oy/3600;$('co').textContent=F.dem?'demo field':`RA ${cr.toFixed(4)}°  Dec ${cd.toFixed(4)}°`;$('fv').textContent=`${(M.fov/60).toFixed(1)}′ (${Math.round(M.fov)}″${M.fov>=3600?' = '+(M.fov/3600).toFixed(2)+'°':''})`;$('ob').textContent=`${pretty(e)} · ${rel(e)}`;$('fov').value=M.fov;$('dt').value=iso(e);
 const p=M.k/(NE-1);$('rk').style.left=p*100+'%';$('fill').style.width=p*100+'%';$('trk').setAttribute('aria-valuenow',M.k+1);
 const drawBig=()=>{if(M.realState==='ready'&&M.realSet)drawReal();else sky($('big'),F,M.k,{...ob(),full:t==='dis'?1:0})};
 if(t==='cmp')cmp();else{drawBig();if(t==='dis'&&M.pk)cross()}
 if(t==='info')info();if(t==='dis')dis();if(t==='spec')spec();if(t==='q')qual();wr()}

function info(){const F=M.F,I=F.info,dl=I.dl,U=(a,x)=>`${SRC}system/avm_images/binaries/${dl.id}/${a}/${x||dl.fn}?${dl.ts}`,L=(p,t)=>`<a href="${SRC}${p}" target="_blank" rel="noopener">${t}</a>`;
 $('p-info').innerHTML=`<img src="${U(dl.k[1])}" alt="${I.full}" style="width:100%;border-radius:8px;background:#04060d" onerror="this.remove()"><small>The real image loads when your browser can reach spherex.caltech.edu. The canvas on the left is always a simulated sky.</small><h3>${I.full}</h3>
 <dl><dt>Entry</dt><dd>${I.kind} · ${F.d}</dd><dt>Credit</dt><dd>${F.c||'not listed on the page'}</dd><dt>Object</dt><dd>${I.obj[0]}</dd><dt>Type</dt><dd>${I.obj[1]}</dd>${I.obj[2]?`<dt>Distance</dt><dd>${I.obj[2]}</dd>`:''}<dt>Position</dt><dd>${I.pos}</dd><dt>Field of view</dt><dd>${F.fv}</dd><dt>Orientation</dt><dd>${I.ori||'not listed'}</dd><dt>Wavelengths</dt><dd>${F.w}</dd></dl>
 ${I.bands.length?`<table><tr><th>Band</th><th>Wavelength</th><th>Telescope</th></tr>${I.bands.map(b=>`<tr><td>${b[0]}</td><td>${b[1]}</td><td>SPHEREx</td></tr>`).join('')}</table>`:'<small>This page has no colour-mapping table; wavelengths come from its description.</small>'}
 ${I.txt.map(t=>`<p style="margin:0">${t}</p>`).join('')}
 ${I.vis?`<details><summary>Visual description</summary><p>${I.vis}</p></details>`:''}
 <b>Downloads</b><ul>${dl.k.map((k,i)=>`<li><a href="${U(k)}" target="_blank" rel="noopener">JPG ${dl.d[i]} (${dl.s[i]})</a></li>`).join('')}${dl.t?`<li><a href="${U('original',dl.fn.replace('.jpg','.tif'))}" target="_blank" rel="noopener">TIF ${dl.t[0]} (${dl.t[1]})</a></li>`:''}</ul>
 ${I.rel.length?`<b>Related media</b><ul style="columns:1">${I.rel.map(r=>`<li>${r[0]}: ${L(r[2],r[1])}</li>`).join('')}</ul>`:''}
 <div class="row" style="justify-content:flex-start"><button id="jd2">See the sky on ${F.d}</button>${L('image/'+F.u,'Open the real page ↗')}</div>`;
 $('jd2').onclick=()=>{M.k=nearK(fromIso(I.iso));M.tab='view';render()}}
function cmp(){const F=M.F,A=+$('ea').value,B=+$('eb').value,o=ob();o.fov=Math.min(M.fov,400);const ca=$('ca'),cb=$('cb'),cr=$('cr'),m=document.querySelector('input[name=md]:checked').value,chB=$('chb').checked?(M.ch%17)+1:M.ch;
 clearInterval(bt);sky(ca,F,A,o);sky(cb,F,B,{...o,ch:chB});cr.hidden=!(m==='diff'||m==='sum');cb.hidden=m==='blink';
 if(m==='blink'){let s=0;bt=setInterval(()=>{s^=1;sky(ca,F,s?B:A,{...o,ch:s?chB:M.ch})},600)}
 if(m==='diff'||m==='sum'){const a=ca.getContext('2d').getImageData(0,0,300,300),b=cb.getContext('2d').getImageData(0,0,300,300),r=cr.getContext('2d'),im=r.createImageData(300,300);
  for(let i=0;i<a.data.length;i+=4){const la=(a.data[i]+a.data[i+1]+a.data[i+2])/3,lb=(b.data[i]+b.data[i+1]+b.data[i+2])/3;
   if(m==='sum'){const v=Math.min(255,la+lb);im.data.set([v,v,v*.9,255],i)}else{const d=Math.max(-1,Math.min(1,(la-lb)/60)),c=d<0?[70,160,255]:[255,170,60];im.data.set([lerp(14,c[0],Math.abs(d)),lerp(16,c[1],Math.abs(d)),lerp(32,c[2],Math.abs(d)),255],i)}}r.putImageData(im,0,0)}
 const ok=(c,t)=>`<div class="${c?'ok':'warn'}">${c?'✓':'⚠'} ${t}</div>`;
 $('cmpq').innerHTML=ok(true,'Same detector D'+M.det)+ok(!$('chb').checked,$('chb').checked?'Different wavelength channels: differences may be spectral, not motion':'Same wavelength channel ch'+M.ch)+ok(rel(OBS[A])===rel(OBS[B]),rel(OBS[A])===rel(OBS[B])?'Same release ('+rel(OBS[A])+')':'Different releases: check calibration before trusting the difference')+ok(true,'Same TAN/WCS grid and zodi model subtracted')}
function dets(){const F=M.F,e=OBS[M.k];return F.obj.map(b=>{const mv=Math.hypot(...b.pm)*(T1-T0),pa=Math.round((Math.atan2(-b.pm[0],b.pm[1])*180/Math.PI+360)%360),va=b.id==='T'&&F.kind==='v'?'±60% (variable)':b.id==='T'?'<5%':'<8%';
 const x=b.id==='T'?0:b.x0+(e-TR)*b.pm[0],y=b.id==='T'?0:b.y0+(e-TR)*b.pm[1];return{id:b.id,ra:(F.cra-x/3600/F.crf).toFixed(4),de:(F.cde+y/3600).toFixed(4),mv:mv.toFixed(1),px:(mv/PXS).toFixed(1),pa,va,st:b.st,bright:(b.id==='T'?F.b:b.b).toFixed(2)}})}
function dis(){const d=dets(),F=M.F,U=hasU(F),can=!U||M.tries>0,seen=!U||M.shown;$('dtx').hidden=!U;$('dno').hidden=U;$('dno').innerHTML=U?'':'<b>Nothing to find in this field.</b> It has no moving source that is missing from the catalogs (the all-sky maps are demo fields). You can still click anywhere to see what is at that spot.';$('dh').hidden=can;$('run').hidden=!can;$('sv').hidden=!U||!M.shown;$('ex').hidden=!seen;$('dtab').innerHTML=!M.ran?'':`<table><tr><th>ID</th><th>RA / Dec (now)</th><th>Motion over baseline</th><th>Brightness</th><th>Match</th></tr>${d.map(r=>`<tr><td>${r.id}</td><td>${r.ra}, ${r.de}</td><td>${r.mv}″ (${r.px} px), PA ${r.pa}°</td><td>${r.bright} · ${r.va}</td><td class="${/unmatched|not in/i.test(r.st)?'warn':'ok'}">${r.st}</td></tr>`).join('')}</table>`;
 try{M.saved=JSON.parse(localStorage.getItem('spxc')||'[]')}catch(e){}$('saved').innerHTML=M.saved.length?`<b>simulated training exercise: saved candidates</b><br>${M.saved.map(s=>`${esc(s.name||s.id)} · ${esc(s.n)} at ${s.ra}, ${s.de} (${esc(s.st)})`).join('<br>')}`:''}
$('run').onclick=()=>{$('dets').checked=true;M.ran=1;M.shown=1;render()};
$('sv').onclick=()=>{const u=dets().find(r=>r.id==='U');const v={n:M.F.n,...u};M.saved.push(v);try{localStorage.setItem('spxc',JSON.stringify(M.saved))}catch(e){}dis()};
$('ex').onclick=()=>{const d=dets(),t=$('rep');t.hidden=false;t.value=`simulated training exercise: SPHEREx candidate report\nField: ${M.F.n}\nEpoch: ${pretty(OBS[M.k])} (${rel(OBS[M.k])})\n`+d.map(r=>`${r.id}: ${r.ra}, ${r.de}; moved ${r.mv}″; ${r.st}`).join('\n');t.select();try{navigator.clipboard.writeText(t.value)}catch(e){}};
function spec(){const c=$('spc'),x=c.getContext('2d'),W=c.width,H=c.height,F=M.F,co=$('co4').checked,sig=co?.03:.08,X=l=>34+(W-46)*(l-.75)/4.25,Y=v=>H-26-(H-44)*v/1.25,r=rng(7);
 x.fillStyle='#0b0c14';x.fillRect(0,0,W,H);x.strokeStyle='#2b3050';x.fillStyle='#9aa0bf';x.font='11px Barlow,sans-serif';[1,2,3,4,5].forEach(l=>{x.beginPath();x.moveTo(X(l),8);x.lineTo(X(l),H-26);x.stroke();x.fillText(l+' µm',X(l)-10,H-10)});
 const draw=(k,cl)=>{const vr=F.kind==='v'?1+.6*Math.sin(6.283*(OBS[k]-T0)/(F.P||1)):1;for(let d=1;d<=6;d++)for(let c2=1;c2<=17;c2++){const l=LAM(d,c2),v=F.b*S(F.cls,l)*vr+(r()+r()+r()-1.5)*sig;x.fillStyle=cl||HUE[d-1];x.globalAlpha=d===M.det&&c2===M.ch?1:.8;x.beginPath();x.arc(X(l),Y(v),d===M.det&&c2===M.ch?5:2.5,0,6.3);x.fill()}};
 draw(M.k);if($('ovb').checked)draw(+$('eb').value,'#ffffff');x.globalAlpha=1;x.fillStyle='#e6f6ff';x.fillText('flux (arbitrary) vs wavelength; 102 points = 6 detectors × 17 channels',34,14);
 $('spn').textContent=`Model shape (${F.cls}) plus simulated noise, not measured data. ${co?'Co-adding lowers the noise.':'Tick co-add to see the S/N improve.'} Selected: D${M.det} ch${M.ch} = ${LAM(M.det,M.ch).toFixed(2)} µm.`}
const FL=[['TRANSIENT',1,'cosmic-ray-like hit'],['OVERFLOW',2,'near saturation'],['NONFUNC',64,'dead pixel'],['DICHROIC',128,'unusable, bands 3–4 overlap'],['HOT',1024,'noisy pixel'],['COLD',2048,'unresponsive pixel'],['PERSIST',131072,'persistent charge'],['CROSSTALK',1048576,''],['SOURCE',2097152,'known source'],['GHOST',4194304,''],['STREAK',33554432,'']];
function qual(){const e=OBS[M.k],k=M.k,l=LAM(M.det,M.ch),n=(M.k*37+M.det*11)%9;
 $('qm').innerHTML=[['Observation',`${Math.floor(e)}W${String(Math.min(52,Math.floor((e%1)*52)+1)).padStart(2,'0')}_2B_${String(100+k*37).padStart(4,'0')}_1`],['Detector',`D${M.det}`],['Wavelength',`${l.toFixed(2)} µm`],['Epoch',`${e.toFixed(3)} (MJD ${Math.round(51544+(e-2000)*365.25)})`],['Release',rel(e)],['Pixel scale',PXS+'″'],['Flagged pixels',(1.2+n*.4).toFixed(1)+'%'],['Fit quality (fit_ql)',(1+n*.04).toFixed(2)],['Background',(.4+n*.03).toFixed(2)+' MJy/sr (sim)'],['Zodi','model subtracted']].map(r=>`<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('');
 $('qf').innerHTML=`<small>Real flag names and bit values from IRSA’s spectrophotometry help:</small><table>${FL.map(f=>`<tr><td>${f[0]}</td><td>${f[1]}</td><td>${f[2]}</td></tr>`).join('')}</table>`}
['tr','mkc','cat','gaia','wise','dets','mask','co4','ovb','chb'].forEach(k=>$(k).onchange=()=>render());
$('realDiff').onchange=()=>{if(M&&M.realSet){M.realMode=$('realDiff').checked?'diff':'passes';render()}};
['ea','eb','sd','sc'].forEach(k=>$(k).onchange=()=>{if(k==='sd')M.det=+$(k).value;if(k==='sc')M.ch=+$(k).value;render()});document.querySelectorAll('input[name=md]').forEach(r=>r.onchange=render);
$('fov').oninput=e=>{M.fov=+e.target.value;render()};$('zi').onclick=()=>{M.fov=Math.max(60,M.fov/1.4);render()};$('zo').onclick=()=>{M.fov=Math.min(M.F.fmax,M.fov*1.4);render()};$('rs').onclick=()=>{M.ox=M.oy=0;M.fov=M.F.fv0||240;render()};
$('pl').onclick=()=>{M.play=!M.play;$('pl').textContent=M.play?'Pause':'Play'};
$('go2').onclick=()=>{const v=$('dt').value;if(!v)return;const y=fromIso(v);M.k=nearK(y);render()};
$('sh').onclick=()=>{const b=$('sh');try{navigator.clipboard.writeText(location.href).then(()=>b.textContent='Link copied',()=>b.textContent='Copy failed: use the address bar')}catch(e){b.textContent='Copy failed: use the address bar'}setTimeout(()=>b.textContent='Copy share link',1800)};
$('x').onclick=closeM;$('md').onclick=e=>{if(e.target.id==='md')closeM()};addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('md').hidden)closeM()});
const big=$('big');let pd=null;big.onpointerdown=e=>{pd={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY};big.setPointerCapture(e.pointerId)};
big.onpointermove=e=>{if(!pd)return;const f=M.fov/big.getBoundingClientRect().width;M.ox-=(e.clientX-pd.x)*f;M.oy+=(e.clientY-pd.y)*f;pd={...pd,x:e.clientX,y:e.clientY};render()};big.onpointerup=e=>{const w=pd;pd=null;if(w&&M.tab==='dis'&&Math.hypot(e.clientX-w.sx,e.clientY-w.sy)<5)pick(e)};
big.onwheel=e=>{e.preventDefault();M.fov=Math.max(60,Math.min(M.F.fmax,M.fov*Math.exp(e.deltaY*.001)));render()};
const trk=$('trk');let td=false;OBS.forEach(e=>{const d=document.createElement('i');d.className='tk';d.style.left=(e-T0)/(T1-T0)*100+'%';trk.append(d)});
const dv=document.createElement('i');dv.className='dv';dv.style.left=(2026.4-T0)/(T1-T0)*100+'%';trk.append(dv);
const fx=cx=>{const r=trk.getBoundingClientRect();return Math.round(Math.max(0,Math.min(1,(cx-r.left)/r.width))*(NE-1))};
trk.onpointerdown=e=>{td=true;trk.setPointerCapture(e.pointerId);M.k=fx(e.clientX);render()};trk.onpointermove=e=>{if(td){M.k=fx(e.clientX);render()}};trk.onpointerup=()=>{td=false};
trk.onkeydown=e=>{if(e.key==='ArrowRight')M.k=Math.min(NE-1,M.k+1);else if(e.key==='ArrowLeft')M.k=Math.max(0,M.k-1);else return;e.preventDefault();render()};
/* discover: click anywhere */
const hasU=F=>F.obj.some(b=>b.id==='U'),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function cross(){const W=big.width,q=W/M.fov,x=big.getContext('2d'),px=W/2+(M.pk[0]-M.ox)*q,py=W/2-(M.pk[1]-M.oy)*q;x.strokeStyle='#fff';x.lineWidth=1.5;x.beginPath();x.arc(px,py,14,0,6.3);x.moveTo(px-22,py);x.lineTo(px-8,py);x.moveTo(px+8,py);x.lineTo(px+22,py);x.moveTo(px,py-22);x.lineTo(px,py-8);x.moveTo(px,py+8);x.lineTo(px,py+22);x.stroke()}
function pick(e){const F=M.F,r=big.getBoundingClientRect(),W=big.width,q=W/M.fov,sx=M.ox+((e.clientX-r.left)/r.width*W-W/2)/q,sy=M.oy-((e.clientY-r.top)/r.height*W-W/2)/q,ep=OBS[M.k],bs=$('cat').checked?F.ref:TR;
 const P=b=>b.id==='T'?[(ep-bs)*b.pm[0],(ep-bs)*b.pm[1]]:[b.x0+(ep-TR)*b.pm[0],b.y0+(ep-TR)*b.pm[1]];let best=null,bd=12/q;
 F.obj.forEach(b=>{const p=P(b),d=Math.hypot(p[0]-sx,p[1]-sy);if(d<bd){bd=d;best={b}}});
 if(!best)F.stars.forEach((t,i)=>{const d=Math.hypot(t.x-sx,t.y-sy);if(d<bd&&t.f>.03){bd=d;best={t,i}}});
 const c0=$('cat').checked?[F.ra,F.dec]:[F.cra,F.cde],ra=(c0[0]-sx/3600/F.crf+360)%360,de=c0[1]+sy/3600,pos=F.dem?'demo field':`RA ${ra.toFixed(5)}°, Dec ${de.toFixed(5)}°`;M.pk=[sx,sy];M.tries=(M.tries||0)+1;let h;
 if(!best)h=`<b>Nothing detected here</b><br>${pos}<br><small>Only background noise within about ${Math.round(12/q)}″. The Compare tab’s A − B view helps reveal faint movers.</small>`;
 else if(best.t)h=`<b>Known catalog star</b> (simulated entry SIM-${best.i+1})<br>${pos}<br><small>Matches a Gaia/WISE source within one pixel (6.15″). Brightness ${best.t.f.toFixed(2)} (arbitrary).</small>`;
 else{const b=best.b,nm=M.named&&M.named[b.id];
  if(b.id==='T'&&!F.sim)h=`<b>Known: ${esc(F.n)}</b><br>${pos}<br><small>${esc(F.src||'')}</small>`;
  else if(b.id==='K')h=`<b>Known high-proper-motion star</b> (Gaia match, simulated)<br>${pos}`;
  else if(nm)h=`<b>simulated training exercise: your candidate: ${esc(nm)}</b><br>${pos}<br><small>Saved on this device only.</small>`;
  else if(M.shown||$('dets').checked)h=`<b>simulated training exercise: detected, but it matches nothing in Gaia or WISE</b><br>${pos}<br><small>duplicates were already shown to you, so this is not counted as your own find. Use Save if you want to keep it.</small>`;else{h=`<b>Detected, but it matches nothing in Gaia or WISE</b><br>${pos}`;setTimeout(()=>celebrate(F,b,ra,de),250)}}
 $('pick').innerHTML=h;render()}
let cel=null;
function confetti(cv){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const W=cv.width=innerWidth,H=cv.height=innerHeight,x=cv.getContext('2d'),r=rng(Date.now()%9999),C=['#22e5ff','#ffd166','#ff78c8','#7ee081','#8fa8ff'],P=Array.from({length:140},()=>({x:W/2,y:H*.4,vx:(r()-.5)*14,vy:-r()*14-3,c:C[r()*5|0],s:4+r()*5,a:r()*6}));let f=0;
 (function tk(){x.clearRect(0,0,W,H);P.forEach(p=>{p.vy+=.35;p.x+=p.vx;p.y+=p.vy;p.a+=.2;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6);x.restore()});if(++f<150)requestAnimationFrame(tk);else x.clearRect(0,0,W,H)})()}
function celebrate(F,b,ra,de){if(!cel){cel=document.createElement('div');cel.id='cele';cel.className='sx-base';cel.hidden=true;cel.setAttribute('role','dialog');cel.setAttribute('aria-modal','true');cel.setAttribute('aria-labelledby','ch3');
 cel.innerHTML='<canvas></canvas><div class="cc"><h3 id="ch3">🎉 Congratulations!</h3><p id="cmsg"></p><label>simulated training exercise: name your candidate<input type="text" id="cnm" maxlength="40" style="width:100%"></label><div class="row"><button class="go" id="csv">Save name</button><button id="ckp">Keep exploring</button></div><small>A real discovery needs more observations and a report to the right body (for example the Minor Planet Center for asteroids and comets) before it gets an official name.</small></div>';
 document.getElementById('view-explore').append(cel);cel.onkeydown=e=>{if(e.key==='Escape'){e.stopPropagation();cel.hidden=true}};$('ckp').onclick=()=>{cel.hidden=true}}
 $('cmsg').textContent=`The source at RA ${ra.toFixed(4)}°, Dec ${de.toFixed(4)}° moves between observations and has no match in the (simulated) Gaia and WISE catalogs. That makes it a simulated training exercise: candidate, not yet a confirmed discovery.`;
 $('cnm').value='SPX-'+(Math.abs(hash(ra,de))%9000+1000);cel.hidden=false;confetti(cel.firstChild);$('cnm').focus();$('cnm').select();
 $('csv').onclick=()=>{const nm=$('cnm').value.trim().slice(0,40);if(!nm){$('cnm').focus();return}M.named=M.named||{};M.named[b.id]=nm;M.saved.push({n:F.n,id:b.id,ra:ra.toFixed(4),de:de.toFixed(4),st:'simulated training exercise: named candidate',name:nm});try{localStorage.setItem('spxc',JSON.stringify(M.saved))}catch(e){}cel.hidden=true;$('pick').innerHTML=`<b>Saved: ${esc(nm)}</b><br><small>Listed below. Stored on this device only.</small>`;dis()}}
/* search, url, validation */
function pa(s,h){s=s.trim();if(/[:hms]/i.test(s)){const p=s.replace(/[hms°'"]/gi,' ').replace(/:/g,' ').trim().split(/\s+/).map(Number);if(p.some(isNaN))return NaN;const sg=/^-/.test(s)?-1:1;return sg*(Math.abs(p[0])+(p[1]||0)/60+(p[2]||0)/3600)*(h?15:1)}return s===''?NaN:+s}
$('f').onsubmit=e=>{e.preventDefault();const r=pa($('ra').value,true),d=pa($('dec').value,false),fv=+$('fv0').value*+$('fu').value,er=$('err'),dv=$('dt0').value;er.textContent='';
 if(isNaN(r)||r<0||r>=360)return er.textContent='RA must be a number between 0 and 360 degrees, or hh:mm:ss.';if(isNaN(d)||d<-90||d>90)return er.textContent='Dec must be between −90 and +90 degrees, or dd:mm:ss.';if(isNaN(fv)||fv<60||fv>21600)return er.textContent='Field of view must be between 60″ (1′) and 21600″ (6°).';
 const k=dv?nearK(fromIso(dv)):12,cs=Math.cos(d*Math.PI/180)||1,all=[...TGF.map((F,i)=>[F,'t'+i]),...IMF.map((F,i)=>[F,'i'+i])].filter(x=>!x[0].dem);
 let m=all.find(([F])=>[[F.ra,F.dec],[F.cra,F.cde]].some(([a,b])=>Math.hypot((a-r)*F.crf,b-d)<.05));
 const cov=IMF.map((F,i)=>[F,i]).filter(([F])=>F.fd&&!F.dem&&Math.abs(F.ra-r)*cs<Math.max(...F.fd)/2&&Math.abs(F.dec-d)<Math.max(...F.fd)/2);
 if(!m&&cov.length)m=[cov[0][0],'i'+cov[0][1]];
 if(m)openM(m[0],m[1],{fov:fv,k,tab:'view',ox:(m[0].cra-r)*3600*m[0].crf,oy:(d-m[0].cde)*3600});else openM(mk({n:'Simulated field',ra:r,dec:d,span:Math.max(1,fv*2/600)}),'g',{fov:fv,k,tab:'view'});
 $('mm').textContent+=' · '+[dv&&`epoch ${pretty(OBS[k])} (nearest to your date)`,cov.length&&`inside the footprint of ${cov.map(c=>c[0].n).join('; ')}`,'the three all-sky maps cover every position'].filter(Boolean).join(' · ')};
function wr(){try{history.replaceState(null,'','#explore?'+new URLSearchParams({s:M.src,k:M.k,tab:M.tab,fov:M.fov,det:M.det,ch:M.ch,ra:M.F.ra.toFixed(4),dec:M.F.dec.toFixed(4)}))}catch(e){}}
function rd(){const p=new URLSearchParams(location.hash.split('?')[1]||'');if(!p.get('s'))return;const s=p.get('s');let F;if(s[0]==='i')F=IMF[+s.slice(1)];else if(s[0]==='t')F=TGF[+s.slice(1)];else F=mk({n:'Simulated field',ra:+p.get('ra'),dec:+p.get('dec'),span:Math.max(1,(+p.get('fov')||240)*2/600)});
 if(F)openM(F,s,{k:Math.max(0,Math.min(NE-1,+p.get('k')||12)),tab:p.get('tab')||(F.info?'info':'view'),fov:+p.get('fov')||F.fv0||240,det:+p.get('det')||2,ch:+p.get('ch')||7})}
$('val').innerHTML=`<table><tr><th>Target</th><th>Catalog position (epoch)</th><th>Motion</th><th>Offset by 2026.1</th><th>In a 240″ field centred on the catalog position?</th></tr>${TGF.map(F=>{const m=Math.hypot(...F.pm),off=m*(TR-F.ref);return`<tr><td>${F.n}</td><td>${F.ra.toFixed(4)}°, ${F.dec.toFixed(4)}° (${F.ref})</td><td>${m.toFixed(3)}″/yr</td><td>${off.toFixed(0)}″</td><td class="${off<120?'ok':'warn'}">${off<120?'yes':'NO: recentre on the propagated position'}</td></tr>`}).join('')}</table><small>Why it matters: SPHEREx observes in 2025–2026, so the cutout must be centred where the object is now, not where the catalog says it was.</small>`;
addEventListener('resize',size);size();spin=!matchMedia('(prefers-reduced-motion: reduce)').matches;$('sp').textContent=spin?'STOP ORBIT':'SPIN ORBIT';requestAnimationFrame(loop);
window.__exploreShow=function(){size();rd()};
window.__exploreLeave=function(){if(cel)cel.hidden=true;if(!$("md").hidden){$("md").hidden=true;clearInterval(ft);clearInterval(bt)}};
})();

/* ===== Explore: modal sync ===== */

(function(){var md=document.getElementById('md');if(!md||!window.MutationObserver)return;
function sync(){var o=!md.hidden;document.documentElement.classList.toggle('modal-open',o);
if(window.__fxPause)__fxPause(o||!!(window.__film&&window.__film.open))}
new MutationObserver(sync).observe(md,{attributes:true,attributeFilter:['hidden']});sync()})();
  

/* ===== Museum halls ===== */

(function(){
const TGF=[{id:'t0',pm:[-.8,10.33]},null,{id:'t2',pm:[-8.1237,.6732]}],IMF=[null,{id:'i1'}];
const openM=(F,_,o)=>window.__go('#explore?s='+F.id+'&tab='+o.tab);

const $=id=>document.getElementById(id),cv=$('hcv'),cx=cv.getContext('2d'),W=640,H=280,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,cl=(x,a,b)=>Math.max(a,Math.min(b,x));
cv.width=W*2;cv.height=H*2;cx.scale(2,2);
const T=(x,y,t,f,c,a)=>{cx.font=f;cx.fillStyle=c;cx.textAlign=a||'left';cx.fillText(t,x,y)},CF="700 12px 'Barlow Condensed',sans-serif",BF="400 12px 'Barlow',sans-serif";
const pl=(l,K)=>1/(Math.pow(l,5)*(Math.exp(14388/(l*K))-1)),st={T:5772,Tc:5772,ice:[1,1,1],ic:[1,1,1],yr:16,yc:0};
const px=(F)=>Math.hypot(F.pm[0],F.pm[1])/6.15;
const ctl=$('hctl'),mkR=(lab,min,max,v,cb)=>{const l=document.createElement('label');l.textContent=lab+' ';const r=document.createElement('input');r.type='range';r.min=min;r.max=max;r.value=v;r.oninput=()=>cb(+r.value);l.append(r);ctl.append(l);return r},mkB=(t,cb)=>{const b=document.createElement('button');b.textContent=t;b.onclick=cb;ctl.append(b);return b};
const AX=(x0,x1,y1,ticks,lx)=>{cx.strokeStyle='rgba(208,214,249,.4)';cx.beginPath();cx.moveTo(x0,y1);cx.lineTo(x1,y1);cx.stroke();ticks.forEach(l=>{T(lx(l),y1+16,l+' µm',BF,'rgba(208,214,249,.72)','center')})};
const HL=[
{n:'Infrared Universe',tag:'Why does SPHEREx look in the infrared?',
 t:'Everything with a temperature glows. Hot things peak in visible light, cold things peak in the infrared. Move the temperature and watch the glow slide. Your eyes cover about 0.4 to 0.7 µm. SPHEREx covers 0.75 to 5 µm.',
 note:'Physics: blackbody (Planck) curve and Wien’s law, peak wavelength in µm = 2898 ÷ temperature in K. Temperatures for the presets are approximate.',btn:'Open WISE 0855 in the Spectrum tool',act:()=>openM(TGF[2],'h',{tab:'spec'}),
 init(){mkR('Temperature (K)',100,6000,st.T,v=>{st.T=v;rd()});[['Sun',5772],['Red dwarf ≈3,200',3200],['Warm brown dwarf ≈1,000',1000],['Cold brown dwarf ≈285',285]].forEach(([l,v])=>mkB(l,()=>{st.T=v;ctl.querySelector('input').value=v;rd()}));rd()},
 draw(){st.Tc+=(st.T-st.Tc)*(reduce?1:.12);const K=st.Tc,x0=46,x1=W-14,y0=24,y1=H-40,lx=l=>x0+Math.log(l/.3)/Math.log(20/.3)*(x1-x0);
  cx.fillStyle='rgba(255,255,255,.16)';cx.fillRect(lx(.4),y0,lx(.7)-lx(.4),y1-y0);cx.fillStyle='rgba(208,214,249,.12)';cx.fillRect(lx(.75),y0,lx(5)-lx(.75),y1-y0);
  T(lx(.53),y0+12,'EYE',CF,'#ffffff','center');T((lx(.75)+lx(5))/2,y0+12,'SPHEREx 0.75–5 µm',CF,'#D0D6F9','center');
  const pk=2898/K,mx=pl(pk,K);cx.beginPath();for(let k=0;k<=240;k++){const l=.3*Math.pow(20/.3,k/240),y=y1-pl(l,K)/mx*(y1-y0-28);k?cx.lineTo(lx(l),y):cx.moveTo(lx(l),y)}cx.strokeStyle='#fff';cx.lineWidth=2.5;cx.stroke();
  if(pk>=.3&&pk<=20){cx.strokeStyle='#D0D6F9';cx.setLineDash([4,4]);cx.beginPath();cx.moveTo(lx(pk),y0+20);cx.lineTo(lx(pk),y1);cx.stroke();cx.setLineDash([])}AX(x0,x1,y1,[.5,1,2,5,10],lx)}},
{n:'Dust and Ices',tag:'How can light reveal frozen water?',
 t:'Cold clouds hide ices on dust grains. Each ice absorbs light at a particular infrared wavelength and leaves a dip in the spectrum. SPHEREx samples 0.75 to 5 µm in 102 channels, which is how it can map water, carbon dioxide and carbon monoxide ices.',
 note:'Schematic. The three dip positions (3.0, 4.27 and 4.67 µm) are the known ice absorption bands. The shapes, depths and continuum are illustrative, not data.',btn:'Open the Cygnus X ice image in the Spectrum tool',act:()=>openM(IMF[1],'h',{tab:'spec'}),
 init(){[['H₂O ice',0],['CO₂ ice',1],['CO ice',2]].forEach(([l,k])=>{const lb=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.checked=true;c.onchange=()=>{st.ice[k]=c.checked?1:0};lb.append(c,l);ctl.append(lb)});$('hrd').textContent='Switch an ice off and watch its dip fill in.'},
 draw(){const x0=46,x1=W-14,y0=24,y1=H-40,lx=l=>x0+(l-2.5)/2.7*(x1-x0),D=[[3.0,.3,.45,'H₂O  3.0 µm'],[4.27,.09,.5,'CO₂  4.27 µm'],[4.67,.07,.38,'CO  4.67 µm']];
  st.ic=st.ic.map((v,k)=>v+(st.ice[k]-v)*(reduce?1:.1));cx.beginPath();for(let k=0;k<=260;k++){const l=2.5+2.7*k/260;let v=.72-.1*(l-2.5);D.forEach((d,j)=>v-=d[2]*st.ic[j]*Math.exp(-Math.pow((l-d[0])/d[1],2)));const y=y1-v*(y1-y0-10);k?cx.lineTo(lx(l),y):cx.moveTo(lx(l),y)}cx.strokeStyle='#fff';cx.lineWidth=2.5;cx.stroke();
  D.forEach((d,j)=>{cx.globalAlpha=.3+.7*st.ic[j];T(lx(d[0]),y0+16+j*14,d[3],CF,['#8fa8ff','#D0D6F9','#ffffff'][j],'center');cx.strokeStyle='rgba(208,214,249,.3)';cx.beginPath();cx.moveTo(lx(d[0]),y0+22+j*14);cx.lineTo(lx(d[0]),y1);cx.stroke();cx.globalAlpha=1});AX(x0,x1,y1,[2.5,3,3.5,4,4.5,5],lx)}},
{n:'Moving Stars',tag:'How far does a star drift?',
 t:'Nearby stars slowly slide across the sky. A SPHEREx pixel is 6.15 arcseconds wide, so even fast movers cross only a pixel or two in a year or so. Over sixteen years, a coordinate copied from a 2010 catalog can be many pixels off.',
 note:'Proper motions are the values this page uses for its targets; verify them in SIMBAD. The 90″ half-width is the demo cutout from the intro film.',btn:'Compare epochs for WISE 0855',act:()=>openM(TGF[2],'h',{tab:'cmp'}),
 init(){mkR('Years since 2010',0,16,st.yr,v=>{st.yr=v;rd()});rd()},
 draw(){st.yc+=(st.yr-st.yc)*(reduce?1:.12);const y=st.yc,c=(W-40)/32,x0=20,B=[[TGF[0],'Barnard’s Star','#D0D6F9'],[TGF[2],'WISE 0855','#ffffff']];
  B.forEach(([F,n,col],k)=>{const yy=70+k*95,d=px(F)*y;cx.strokeStyle='rgba(255,255,255,.14)';for(let a=0;a<=32;a++){cx.beginPath();cx.moveTo(x0+a*c,yy);cx.lineTo(x0+a*c,yy+22);cx.stroke()}
   cx.fillStyle=col;cx.globalAlpha=.25;cx.fillRect(x0,yy+8,Math.min(d,32)*c,6);cx.globalAlpha=1;cx.beginPath();cx.arc(x0+Math.min(d,32)*c,yy+11,6,0,7);cx.fill();
   T(x0,yy-10,n+'  ·  '+d.toFixed(1)+' pixels',"700 15px 'Barlow Condensed',sans-serif",col);
   if(k===1){const e=14.63*c+x0;cx.setLineDash([5,4]);cx.strokeStyle='#D0D6F9';cx.beginPath();cx.moveTo(e,yy-4);cx.lineTo(e,yy+30);cx.stroke();cx.setLineDash([]);T(e+6,yy+42,'demo cutout edge (90″)',BF,'#D0D6F9');if(d>14.63)T(x0+c*Math.min(d,32)+10,yy+11,'MISSED',CF,'#ff7b66')}});
  T(W/2,H-12,'each tick = 1 SPHEREx pixel (6.15″)',BF,'rgba(208,214,249,.72)','center')}},
{n:'Discovery',tag:'How does a candidate become a result?',
 t:'Astronomers align the frames, subtract one epoch from another, link residual pairs into a track, and check catalogs such as Gaia and WISE. Whatever is left is only a candidate. It becomes a result after independent validation.',
 note:'This describes the workflow of the Discover tab, which in this demo runs on simulated pixels.',btn:'Open Discover on WISE 0855',act:()=>openM(TGF[2],'h',{tab:'dis'}),
 init(){$('hrd').textContent='A candidate is not yet a discovery.'},
 draw(now){const S=['Fetch cutouts around the target','Align them on one sky grid','Subtract one epoch from another','Link residual pairs into a track','Match with Gaia and WISE: unmatched means candidate'],a=reduce?S.length:Math.floor((now/1500)%(S.length+2));
  S.forEach((q,k)=>{const on=k<=a;cx.globalAlpha=on?1:.25;cx.fillStyle=k===S.length-1?'#D0D6F9':'#d0d6f9';cx.beginPath();cx.arc(40,44+k*42,13,0,7);cx.fill();T(40,49+k*42,k+1,"700 15px 'Barlow Condensed',sans-serif",'#04060c','center');T(68,50+k*42,q,"400 17px 'Barlow',sans-serif",'#fff');cx.globalAlpha=1})}}];
let cur=-1,raf=0,t0=0,opener=null;const rd=()=>{const K=st.T,pk=2898/K;$('hrd').textContent=`Peak at ${pk.toFixed(2)} µm. `+(pk<.75?'Bluer than SPHEREx sees; it observes the red tail of this glow.':pk<=5?'Inside the SPHEREx range.':'Beyond 5 µm; SPHEREx sees the short-wavelength side of this glow.');if(cur===2)$('hrd').textContent=`After ${st.yr} years: Barnard’s Star ${(px(TGF[0])*st.yr).toFixed(1)} px, WISE 0855 ${(px(TGF[2])*st.yr).toFixed(1)} px.`};
function loop(now){if(cur<0)return;cx.fillStyle='#04060c';cx.fillRect(0,0,W,H);HL[cur].draw(now-t0);raf=requestAnimationFrame(loop)}
function openH(k){cur=k;const h=HL[k];ctl.innerHTML='';$('hrd').textContent='';$('hhe').textContent='HALL 0'+(k+1);$('hht').textContent=h.n;$('htx').textContent=h.t;$('hnote').textContent=h.note;$('hgo').textContent=h.btn;$('hgo').onclick=()=>{closeH(true);h.act()};cv.setAttribute('aria-label',h.tag);h.init();$('hall').classList.add('on');document.documentElement.classList.add('modal-open');if(window.__fxPause)__fxPause(true);t0=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);$('hx').focus()}
function closeH(skipFocus){cur=-1;cancelAnimationFrame(raf);$('hall').classList.remove('on');document.documentElement.classList.remove('modal-open');if(window.__fxPause&&!(window.__film&&window.__film.open))__fxPause(false);if(!skipFocus&&opener)opener.focus()}
document.querySelectorAll('.hall-card').forEach((b,k)=>{b.onclick=()=>{opener=b;openH(k)}});
$('hx').onclick=()=>closeH();$('hall').addEventListener('click',e=>{if(e.target.id==='hall')closeH()});addEventListener('keydown',e=>{if(e.key==='Escape'&&cur>=0)closeH()});
})();
  

/* ===== Team ===== */
(function(){

const members = [
      { role: "Graphic Design", name: "Mohsen Muhammed", img: "member1.png" },
      { role: "Researcher", name: "Salma Khaled", img: "member2.png" },
      { role: "Web Front-end", name: "Yosef Shamsaldeen", img: "member3.png" },
      { role: "Researcher", name: "Mostafa Ahmed", img: "member4.png" },
      { role: "Data engineer, Research, Project lead", name: "Elsayed Elmandoh", img: "member5.png" },
      { role: "Coding and Development", name: "Hazem Imam", img: "member6.png" }
    ];

    const fallbackSvg = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260"><rect width="400" height="260" fill="#090c18"/><circle cx="200" cy="100" r="42" fill="#1d2542"/><path d="M120 230c0-44 36-75 80-75s80 31 80 75" fill="#1d2542"/></svg>');

    const grid = document.getElementById("teamGrid");
    members.forEach(m => {
      const card = document.createElement("div");
      card.className = "member-card";
      card.innerHTML = `
        <div class="photo-box"><img src="${m.img}" onerror="this.src='${fallbackSvg}'" alt="${m.name}"></div>
        <div class="card-body">
          <div class="role">${m.role}</div>
          <h2 class="name">${m.name}</h2>
        </div>
      `;
      grid.appendChild(card);
    });

})();

/* ===== Router ===== */

(function(){
  var TITLES={home:'NASA Space Apps | Planet X - Home',explore:'NASA Space Apps | Planet X - Explore',museum:'NASA Space Apps | Planet X - Museum Halls',team:'NASA Space Apps | Planet X - Team'};
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,cur=null,tok=0,wrap=document.getElementById('views');
  function parse(){var r=location.hash.replace(/^#/,'').split('?')[0];return TITLES[r]?r:'home'}
  function closeOverlays(){
    var h=document.getElementById('hall');if(h)h.classList.remove('on');
    var m=document.getElementById('articleModal');if(m)m.classList.remove('open');
    if(window.__exploreLeave)__exploreLeave();
    document.documentElement.classList.remove('modal-open');
    if(window.__fxPause&&!(window.__film&&window.__film.open))__fxPause(false);
  }
  function apply(r){
    if(cur)closeOverlays();
    document.querySelectorAll('.view').forEach(function(v){v.classList.toggle('active',v.id==='view-'+r)});
    document.body.dataset.page=r;document.title=TITLES[r];
    document.querySelectorAll('nav a[href^="#"]').forEach(function(a){
      var on=a.getAttribute('href')==='#'+r;a.classList.toggle('active',on);
      if(on){a.setAttribute('aria-current','page');try{a.scrollIntoView({inline:'center',block:'nearest'})}catch(e){}}else a.removeAttribute('aria-current')});
    scrollTo({top:0,behavior:'instant'});cur=r;
    if(r==='explore'&&window.__exploreShow)__exploreShow();
    dispatchEvent(new Event('resize'));
  }
  function show(r){
    if(r===cur){if(r==='explore'&&window.__exploreShow)__exploreShow();return}
    var t=++tok;
    if(cur===null||reduce){apply(r);return}
    wrap.classList.add('leaving');
    setTimeout(function(){if(t!==tok)return;apply(r);requestAnimationFrame(function(){wrap.classList.remove('leaving')})},250);
  }
  addEventListener('hashchange',function(){show(parse())});
  window.__go=function(h){if(location.hash===h)show(parse());else location.hash=h};
  document.addEventListener('click',function(e){
    var s=e.target.closest&&e.target.closest('[data-scroll]');
    if(s){e.preventDefault();var el=document.getElementById(s.getAttribute('data-scroll'));if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}
  });
  apply(parse());
})();

