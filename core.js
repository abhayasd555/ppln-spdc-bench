// Shared by simulator.html and bench.html: MgO:PPLN physics, canvas plotting and downloads.
(function(){
// ---------- physics ----------
const SM={e:{a:[5.756,0.0983,0.2020,189.32,12.52,1.32e-2],b:[2.860e-6,4.700e-8,6.113e-8,1.516e-4]},
          o:{a:[5.653,0.1185,0.2091,89.61,10.85,1.97e-2],b:[7.941e-7,3.134e-8,-4.641e-9,-2.188e-6]}};
function nidx(lam,T,pol){const s=SM[pol],a=s.a,b=s.b,f=(T-24.5)*(T+570.82),l2=lam*lam,a3=a[2]+b[2]*f;
  return Math.sqrt(a[0]+b[0]*f+(a[1]+b[1]*f)/(l2-a3*a3)+(a[3]+b[3]*f)/(l2-a[4]*a[4])-a[5]*l2);}
function ngrp(lam,T,pol){const h=1e-4;return nidx(lam,T,pol)-lam*(nidx(lam+h,T,pol)-nidx(lam-h,T,pol))/(2*h);}
const AL=1.54e-5,BE=5.3e-9;
const perT=(L0,T)=>{const d=T-25;return L0*(1+AL*d+BE*d*d);};
// [pump, signal, idler]; Type-II has two signal/idler assignments
const POL={0:['e','e','e'],1:['e','o','o'],'2eo':['o','e','o'],'2oe':['o','o','e']};
const polOf=(type,t2)=>POL[type===2?'2'+t2:type];
const polTag=p=>p[1]+p[2]+p[0]; // signal·idler·pump, e.g. eoo
const DIJ={0:[25.3,'d₃₃'],1:[4.85,'d₃₁'],2:[4.85,'d₃₁']};
const TP=2*Math.PI, C_GHZ=299792.458;
// wavenumbers ss, si in µm⁻¹
function kmis(ss,si,T,p){const sp=ss+si;return TP*(nidx(1/sp,T,p[0])*sp-nidx(1/ss,T,p[1])*ss-nidx(1/si,T,p[2])*si);}
function dk(ss,si,T,P){return kmis(ss,si,T,P.pol)-P.sgn*TP*P.m/perT(P.L0,T);}
const sinc=x=>Math.abs(x)<1e-9?1:Math.sin(x)/x;
function bisect(f,a,b,fa){for(let k=0;k<60;k++){const m=(a+b)/2,fm=f(m);if(fa*fm<=0){b=m}else{a=m;fa=fm}}return (a+b)/2;}

// ---------- plotting ----------
function tok(){const cs=getComputedStyle(document.documentElement),g=k=>cs.getPropertyValue(k).trim();
  return{ink:g('--ink'),muted:g('--muted'),line:g('--line'),grid:g('--grid'),panel:g('--panel'),pump:g('--pump'),sig:g('--sig'),idl:g('--idl'),map:['--map0','--map1','--map2','--map3'].map(g)};}
let XS=0;const setScale=s=>{XS=s;};
function prep(cv){const dpr=XS||window.devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight,W=Math.max(1,Math.round(w*dpr)),H=Math.max(1,Math.round(h*dpr));
  if(cv.width!==W)cv.width=W;if(cv.height!==H)cv.height=H;const ctx=cv.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return{ctx,w,h};}
function ticks(lo,hi,n){if(!(hi>lo)){hi=lo+1;}const s0=(hi-lo)/n,mag=Math.pow(10,Math.floor(Math.log10(s0))),q=s0/mag,step=(q<1.5?1:q<3?2:q<7?5:10)*mag,t=[];
  for(let v=Math.ceil(lo/step)*step;v<=hi+step*1e-6;v+=step)t.push(v);return{t,step};}
function tf(v,step){const d=Math.max(0,Math.min(4,-Math.floor(Math.log10(step)+1e-9)));return (Math.abs(v)<step*1e-6?0:v).toFixed(d);}
const SYS='-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
const MONO='11px '+SYS;
function frame(ctx,C,r,x0,x1,y0,y1,o){
  const X=v=>r.x+(v-x0)/(x1-x0)*r.w,Y=v=>r.y+r.h-(v-y0)/(y1-y0)*r.h;
  const tx=ticks(x0,x1,o.nx||5),ty=ticks(y0,y1,o.ny||4);
  ctx.font=MONO;ctx.lineWidth=1;
  if(!o.nogrid){ctx.strokeStyle=C.grid;ctx.beginPath();
    tx.t.forEach(v=>{const p=Math.round(X(v))+.5;ctx.moveTo(p,r.y);ctx.lineTo(p,r.y+r.h);});
    ty.t.forEach(v=>{const p=Math.round(Y(v))+.5;ctx.moveTo(r.x,p);ctx.lineTo(r.x+r.w,p);});ctx.stroke();}
  ctx.strokeStyle=C.line;ctx.strokeRect(Math.round(r.x)+.5,Math.round(r.y)+.5,Math.round(r.w),Math.round(r.h));
  ctx.fillStyle=C.muted;ctx.textAlign='center';ctx.textBaseline='top';
  if(!o.nox){let lastX=-1e9;tx.t.forEach(v=>{const s=tf(v,tx.step),p=X(v),wd=ctx.measureText(s).width;if(p-wd/2>lastX+6){ctx.fillText(s,p,r.y+r.h+5);lastX=p+wd/2;}});}
  if(!o.noy){ctx.textAlign='right';ctx.textBaseline='middle';ty.t.forEach(v=>ctx.fillText(tf(v,ty.step),r.x-6,Y(v)));}
  ctx.font='500 11.5px '+SYS;ctx.textAlign='center';ctx.textBaseline='top';
  if(o.xl)ctx.fillText(o.xl,r.x+r.w/2,r.y+r.h+21);
  if(o.yl){ctx.save();ctx.translate(o.ylx??12,r.y+r.h/2);ctx.rotate(-Math.PI/2);ctx.textBaseline='middle';ctx.fillText(o.yl,0,0);ctx.restore();}
  return{X,Y,x0,x1,y0,y1};
}
function path(ctx,M,xs,ys,col,lw,dash,r){ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.setLineDash(dash||[]);ctx.beginPath();
  for(let i=0;i<xs.length;i++){const a=M.X(xs[i]),b=M.Y(ys[i]);i?ctx.lineTo(a,b):ctx.moveTo(a,b);}ctx.stroke();ctx.restore();}
function dots(ctx,M,xs,ys,col,rad,r){ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();ctx.fillStyle=col;
  for(let i=0;i<xs.length;i++){ctx.beginPath();ctx.arc(M.X(xs[i]),M.Y(ys[i]),rad,0,TP);ctx.fill();}ctx.restore();}
function vline(ctx,M,r,x,col,dash){if(x<Math.min(M.x0,M.x1))return;const p=M.X(x);if(p<r.x||p>r.x+r.w)return;ctx.save();ctx.strokeStyle=col;ctx.setLineDash(dash||[]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p,r.y);ctx.lineTo(p,r.y+r.h);ctx.stroke();ctx.restore();}
function hline(ctx,M,r,y,col,dash){const p=M.Y(y);if(p<r.y||p>r.y+r.h)return;ctx.save();ctx.strokeStyle=col;ctx.setLineDash(dash||[]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(r.x,p);ctx.lineTo(r.x+r.w,p);ctx.stroke();ctx.restore();}
function rng(a){let lo=Infinity,hi=-Infinity;for(const v of a){if(v<lo)lo=v;if(v>hi)hi=v;}return[lo,hi];}
function note(ctx,C,r,t){ctx.fillStyle=C.muted;ctx.font='13px '+SYS;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(t,r.x+r.w/2,r.y+r.h/2);}
function hex(c){c=c.replace('#','');if(c.length===3)c=c.split('').map(x=>x+x).join('');const n=parseInt(c,16);return[(n>>16)&255,(n>>8)&255,n&255];}
function cmapOf(C){const stops=C.map.map(hex);return v=>{const t=Math.min(1,Math.max(0,v))*3,k=Math.min(2,Math.floor(t)),f=t-k,a=stops[k],b=stops[k+1];return[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f];};}
// paint an nx×ny map into rect r; col(i) gives [r,g,b] for flat index i, row 0 drawn at the top
function paint(ctx,r,nx,ny,col){const off=document.createElement('canvas');off.width=nx;off.height=ny;const oc=off.getContext('2d'),img=oc.createImageData(nx,ny);
  for(let i=0;i<nx*ny;i++){const c=col(i);img.data[4*i]=c[0];img.data[4*i+1]=c[1];img.data[4*i+2]=c[2];img.data[4*i+3]=255;}
  oc.putImageData(img,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(off,r.x,r.y,r.w,r.h);}

// ---------- downloads ----------
let DLCAP=null;
try{if(window.claude&&typeof window.claude.use==='function')window.claude.use('downloads').then(d=>{DLCAP=d;}).catch(()=>{});}catch(e){}
async function saveFile(name,blob,msgEl){
  if(DLCAP){try{await DLCAP.save({filename:name,data:blob});}catch(e){if(e&&e.code!=='declined'&&msgEl)msgEl.textContent='Download unavailable here ('+(e.code||'error')+').';}return;}
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
}
// re-render one figure's canvas at 3× with its title, legend and a parameter footer
function figPNG(o){
  const cv=o.cv,C=tok(),fig=cv.closest('figure'),S=3;
  XS=S;o.draw(C);XS=0;
  const w=cv.clientWidth,h=cv.clientHeight,top=58,bot=34,pad=20,out=document.createElement('canvas');
  out.width=(w+2*pad)*S;out.height=(h+top+bot)*S;const g=out.getContext('2d');g.scale(S,S);
  g.fillStyle=C.panel;g.fillRect(0,0,w+2*pad,h+top+bot);
  g.fillStyle=C.ink;g.font='600 17px '+SYS;g.textBaseline='alphabetic';g.textAlign='left';g.fillText(o.title,pad,30);
  let x=pad;g.font='12px '+SYS;
  fig.querySelectorAll('.lg span').forEach(sp=>{const i=sp.querySelector('i'),t=sp.textContent.trim();
    if(i){g.fillStyle=getComputedStyle(i).backgroundColor;g.fillRect(x,43,14,3);x+=20;}
    g.fillStyle=C.muted;g.fillText(t,x,48);x+=g.measureText(t).width+16;});
  g.drawImage(cv,pad,top,w,h);
  g.fillStyle=C.muted;g.font='11px '+SYS;g.fillText(o.foot,pad,top+h+22);
  g.textAlign='right';g.fillText('PPLN SPDC Bench',w+pad,top+h+22);
  o.redraw();
  return new Promise(res=>out.toBlob(b=>res([o.name,b]),'image/png'));
}
// tile [name, blob] PNGs into a grid of `cols` columns
async function gridPNG(imgs,cols){
  const bm=await Promise.all(imgs.map(([,b])=>createImageBitmap(b))),cw=Math.max(...bm.map(x=>x.width)),ch=Math.max(...bm.map(x=>x.height)),g=24*3,rows=Math.ceil(bm.length/cols);
  const out=document.createElement('canvas');out.width=cols*cw+(cols+1)*g;out.height=rows*ch+(rows+1)*g;const o=out.getContext('2d');
  o.fillStyle=tok().panel;o.fillRect(0,0,out.width,out.height);
  bm.forEach((b,i)=>o.drawImage(b,g+(i%cols)*(cw+g),g+Math.floor(i/cols)*(ch+g)));
  return new Promise(res=>out.toBlob(res,'image/png'));
}

window.PPLN={SM,nidx,ngrp,perT,POL,polOf,polTag,DIJ,TP,C_GHZ,kmis,dk,sinc,bisect,
  tok,setScale,prep,ticks,tf,SYS,frame,path,dots,vline,hline,rng,note,hex,cmapOf,paint,saveFile,figPNG,gridPNG};
})();
