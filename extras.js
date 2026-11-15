'use strict';
// =====================================================================
//  EXTRAS : domaines de luxe (achat, sommeil, loisirs), agence, complexe sportif,
//  mini-jeux (basket, tennis, penalty), aéroport & avions, jetpack, eau vivante,
//  journal / statistiques, route mouillée, rythme de la ville, radio d'ambiance.
// =====================================================================
(function(){
const EXS=window.EX={};
const _once={};
function guard(label,fn){return function(){try{return fn.apply(this,arguments);}catch(e){if(!_once[label]){_once[label]=1;console.error('[EXTRAS '+label+']',e);}}};}
const rr=(a,b)=>a+Math.random()*(b-a);
const clp=(v,a,b)=>Math.max(a,Math.min(b,v));
const $e=id=>document.getElementById(id);
const fmt=n=>Math.round(n).toLocaleString('fr-FR').replace(/\u202f/g,' ');

// ---------- sauvegarde étendue
SAVE.own=SAVE.own||{};SAVE.stats=SAVE.stats||{};SAVE.rent=SAVE.rent||{};
function ensureSave(){
  if(!SAVE.own)SAVE.own={};
  if(!SAVE.stats)SAVE.stats={};
  if(!SAVE.rent)SAVE.rent={};
  const d={kills:0,playSec:0,earned:0,dist:0,sportW:0,sportL:0,sleeps:0,flights:0,maxAlt:0,crimes:0,swim:0};
  for(const k in d)if(typeof SAVE.stats[k]!=='number')SAVE.stats[k]=d[k];
}
ensureSave();
const stat=(k,v)=>{ensureSave();SAVE.stats[k]+=v===undefined?1:v;};

// ---------- interface : CSS + fenêtres
const css=document.createElement('style');
css.textContent=`
#ex-modal{position:fixed;inset:0;z-index:60;background:rgba(3,6,12,0.78);backdrop-filter:blur(3px);display:none;align-items:center;justify-content:center;padding:14px}
#ex-card{width:min(560px,94vw);max-height:92vh;overflow:auto;background:linear-gradient(160deg,#111827,#0b1220);border:1px solid rgba(255,255,255,0.16);border-radius:14px;padding:16px 16px 12px;color:#e2e8f0;font-family:inherit;box-shadow:0 20px 60px rgba(0,0,0,0.6)}
#ex-card h2{margin:0 0 4px;font-size:17px;letter-spacing:.4px;color:#fde047}
#ex-card .sub{font-size:11px;color:#94a3b8;margin-bottom:10px}
#ex-card .row{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:8px 10px;margin:6px 0;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08)}
#ex-card .row b{font-size:13px}
#ex-card .row small{display:block;font-size:10.5px;color:#94a3b8;margin-top:2px;line-height:1.35}
#ex-card button{font-family:inherit;font-weight:800;font-size:12px;border-radius:9px;border:0;padding:8px 12px;cursor:pointer;background:#fde047;color:#111827}
#ex-card button.sec{background:rgba(255,255,255,0.1);color:#e2e8f0}
#ex-card button:disabled{opacity:.45;cursor:not-allowed}
#ex-card .foot{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}
#ex-card .stats{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#ex-card .stats div{background:rgba(255,255,255,0.05);border-radius:8px;padding:7px 9px;font-size:11px}
#ex-card .stats b{display:block;font-size:14px;color:#fde047}
#ex-fade{position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:70;transition:opacity 1.1s;display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:26px;letter-spacing:6px}
#mg-hud{position:fixed;left:0;right:0;top:calc(10px + env(safe-area-inset-top,0px));z-index:30;display:none;text-align:center;pointer-events:none;color:#fff;font-weight:800}
#mg-hud .sc{display:inline-block;background:rgba(5,8,14,0.78);border:1px solid rgba(255,255,255,0.2);border-radius:999px;padding:6px 16px;font-size:15px;letter-spacing:.6px}
#mg-hud .msg{margin-top:6px;font-size:13px;color:#fde047;text-shadow:0 1px 3px #000}
#mg-hud .bar{width:min(240px,60vw);height:9px;background:rgba(255,255,255,0.15);border-radius:6px;margin:6px auto 0;overflow:hidden}
#mg-hud .bar i{display:block;height:100%;width:0;background:#22c55e}
#mg-quit{position:fixed;right:calc(12px + env(safe-area-inset-right,0px));top:calc(56px + env(safe-area-inset-top,0px));z-index:31;display:none;background:rgba(5,8,14,0.8);border:1px solid rgba(255,255,255,0.25);color:#fff;border-radius:9px;padding:7px 11px;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit}
#ex-pill{position:fixed;left:50%;transform:translateX(-50%);top:calc(74px + env(safe-area-inset-top,0px));z-index:9;display:none;background:rgba(5,8,14,0.78);border:1px solid rgba(255,255,255,0.2);border-radius:999px;padding:4px 12px;font-size:12px;font-weight:800;color:#e2e8f0;pointer-events:none}
#jet-btn{position:fixed;right:calc(236px + env(safe-area-inset-right,0px));bottom:calc(30px + env(safe-area-inset-bottom,0px));z-index:9;width:54px;height:54px;border-radius:50%;background:rgba(5,8,14,0.7);border:2px solid #f97316;color:#fff;font-size:24px;display:none;touch-action:none;cursor:pointer}
#jet-btn.on{background:#f97316}
`;
document.head.appendChild(css);
const modalEl=document.createElement('div');modalEl.id='ex-modal';modalEl.innerHTML='<div id="ex-card"></div>';document.body.appendChild(modalEl);
const fadeEl=document.createElement('div');fadeEl.id='ex-fade';document.body.appendChild(fadeEl);
const mgHud=document.createElement('div');mgHud.id='mg-hud';mgHud.innerHTML='<div class="sc" id="mg-sc"></div><div class="msg" id="mg-msg"></div><div class="bar" id="mg-bar" style="display:none"><i></i></div>';document.body.appendChild(mgHud);
const mgQuit=document.createElement('button');mgQuit.id='mg-quit';mgQuit.textContent='✕ Quitter';document.body.appendChild(mgQuit);
const pill=document.createElement('div');pill.id='ex-pill';document.body.appendChild(pill);
const jetBtn=document.createElement('button');jetBtn.id='jet-btn';jetBtn.textContent='🚀';document.body.appendChild(jetBtn);

let modalOpen=false,modalOnClose=null;
function openModal(html,wire,onClose){
  $e('ex-card').innerHTML=html;modalEl.style.display='flex';modalOpen=true;modalOnClose=onClose||null;
  if(wire)wire($e('ex-card'));
}
function closeModal(){modalEl.style.display='none';modalOpen=false;const f=modalOnClose;modalOnClose=null;if(f)f();}
modalEl.addEventListener('pointerdown',e=>{if(e.target===modalEl)closeModal();});
EXS.isModal=()=>modalOpen;
function fadeTo(black,text,ms){
  return new Promise(res=>{
    fadeEl.textContent=text||'';fadeEl.style.opacity=black?'1':'0';setTimeout(res,ms||1100);
  });
}

// =====================================================================
//  BIBLIOTHÈQUE DE MOBILIER DE LUXE (formes composées + textures procédurales)
// =====================================================================
const MARBLE=new THREE.MeshStandardMaterial({map:TX.marble(5),roughness:0.22,metalness:0.12});
const MARBLE_S=new THREE.MeshStandardMaterial({map:TX.marble(1),roughness:0.18,metalness:0.15});
const PARQ=new THREE.MeshStandardMaterial({map:TX.parquet(7),roughness:0.5,metalness:0.05});
const PARQ_D=new THREE.MeshStandardMaterial({map:TX.parquet(7,[78,48,28]),roughness:0.45,metalness:0.08});
const GLASSM=new THREE.MeshStandardMaterial({color:0xbfe3f5,transparent:true,opacity:0.28,roughness:0.04,metalness:0.7,depthWrite:false});
const M={
  white:mt(0xf4f1ea,0.6,0.05),cream:mt(0xe9dcc3,0.8,0),grey:mt(0x6b7280,0.95,0),greyL:mt(0x9ca3af,0.95,0),beige:mt(0xd9c7a7,0.95,0),navy:mt(0x1e2a44,0.9,0),
  leather:mt(0x3b2a20,0.5,0.1),black:mt(0x0d1117,0.35,0.35),gold:mt(0xd4af37,0.25,0.9),chrome:mt(0xcbd5e1,0.2,0.9),
  wood:mt(0x8a5a2b,0.6,0.1),walnut:mt(0x4a2c17,0.55,0.1),oak:mt(0xb98a55,0.6,0.05),steel:mt(0xb8c1cc,0.3,0.8),
  green:mt(0x2f7d3f,0.9,0),greenD:mt(0x1f5f31,0.9,0),pot:mt(0x9a5b36,0.8,0),red:mt(0x9b1c31,0.9,0),teal:mt(0x0f766e,0.9,0),
  tile:mt(0xbfe8f5,0.35,0.1),stone:mt(0xd6d0c4,0.85,0),feltG:mt(0x14683a,0.95,0)
};
const EMI=c=>new THREE.MeshBasicMaterial({color:c});
const GLOW=EMI(0xfff3c4),GLOWC=EMI(0xfff9e6);
function G3(P,x,y,z,ry){const g=new THREE.Group();g.position.set(x,y||0,z);g.rotation.y=ry||0;P.add(g);return g;}
const B3=(g,w,h,d,m,x,y,z)=>bx(w,h,d,m,x,y,z,g);

function sofa(P,x,z,ry,len,fab,fab2){
  const g=G3(P,x,0,z,ry);fab=fab||M.grey;fab2=fab2||M.greyL;
  B3(g,len,0.26,1.0,fab,0,0.33,0);B3(g,len,0.7,0.26,fab,0,0.86,-0.44);
  const n=Math.max(2,Math.round(len/0.85)),cw=(len-0.5)/n;
  for(let i=0;i<n;i++){const xi=-len/2+0.25+cw*(i+0.5);B3(g,cw-0.04,0.2,0.84,fab2,xi,0.56,0.06);const bk=B3(g,cw-0.06,0.5,0.2,fab2,xi,0.98,-0.3);bk.rotation.x=-0.16;}
  for(const s of[-1,1]){B3(g,0.26,0.56,0.98,fab,s*(len/2-0.13),0.55,0.02);const r=cyl(0.13,0.13,0.98,12,fab,s*(len/2-0.13),0.84,0.02,g);r.rotation.x=Math.PI/2;
    for(const lz of[-0.4,0.4])cyl(0.04,0.03,0.18,6,M.gold,s*(len/2-0.15),0.09,lz,g);}
  return g;
}
function armchair(P,x,z,ry,fab){const g=sofa(P,x,z,ry,1.15,fab||M.beige,M.cream);return g;}
function cTable(P,x,z,w,d,h,top,leg){
  const g=G3(P,x,0,z,0);B3(g,w,0.07,d,top||MARBLE_S,0,h,0);
  for(const sx of[-1,1])for(const sz of[-1,1])cyl(0.025,0.02,h,6,leg||M.gold,sx*(w/2-0.1),h/2,sz*(d/2-0.1),g);
  B3(g,w-0.3,0.03,d-0.3,M.gold,0,h*0.35,0);return g;
}
function chair(P,x,z,ry,fab){
  const g=G3(P,x,0,z,ry);B3(g,0.5,0.07,0.5,fab||M.leather,0,0.48,0);
  const bk=B3(g,0.5,0.62,0.07,fab||M.leather,0,0.82,-0.24);bk.rotation.x=-0.08;
  for(const sx of[-1,1])for(const sz of[-1,1])cyl(0.022,0.018,0.48,6,M.gold,sx*0.21,0.24,sz*0.21,g);return g;
}
function diningSet(P,x,z,ry,n,top){
  const g=G3(P,x,0,z,ry);const L=Math.max(2.2,n*0.5);
  B3(g,L,0.08,1.1,top||M.walnut,0,0.76,0);B3(g,L-0.6,0.62,0.5,M.walnut,0,0.4,0);
  for(const s of[-1,1])for(let i=0;i<n/2;i++)chair(g,-L/2+0.45+i*(L-0.9)/Math.max(1,n/2-1||1),s*0.82,s>0?Math.PI:0,M.leather);
  for(let i=0;i<2;i++){cyl(0.012,0.012,1.4,4,M.black,-L/4+i*L/2,2.6,0,g);const sh=cyl(0.1,0.3,0.34,14,M.black,-L/4+i*L/2,1.85,0,g);B3(g,0.2,0.04,0.2,GLOW,-L/4+i*L/2,1.7,0);}
  return g;
}
function plant(P,x,z,s){
  const g=G3(P,x,0,z,rr(0,6));s=s||1;cyl(0.28*s,0.2*s,0.5*s,12,M.pot,0,0.25*s,0,g);
  cyl(0.26*s,0.26*s,0.04,12,mt(0x2b1d12,1,0),0,0.5*s,0,g);
  for(let i=0;i<9;i++){const l=new THREE.Mesh(new THREE.SphereGeometry(0.3*s,8,6),i%2?M.green:M.greenD);const a=i/9*6.28,r=0.18*s;l.scale.set(0.35,1.5,0.18);l.position.set(Math.cos(a)*r,0.95*s,Math.sin(a)*r);l.rotation.set(Math.sin(a)*0.5,0,-Math.cos(a)*0.5);l.castShadow=true;g.add(l);}
  return g;
}
function palm(P,x,z,h){
  const g=G3(P,x,0,z,rr(0,6));h=h||6;const t=cyl(0.2,0.32,h,8,mt(0x7a5a3a,0.9,0),0,h/2,0,g);t.rotation.z=rr(-0.07,0.07);
  for(let i=0;i<9;i++){const l=B3(g,0.5,0.06,3.0,i%2?M.green:M.greenD,0,h+0.1,0);l.position.set(Math.sin(i/9*6.28)*1.4,h+0.1-Math.abs(Math.sin(i))*0.3,Math.cos(i/9*6.28)*1.4);l.rotation.y=i/9*6.28;l.rotation.x=0.4;}
  return g;
}
function lampFloor(P,x,z,h){const g=G3(P,x,0,z,0);cyl(0.18,0.2,0.04,12,M.gold,0,0.02,0,g);cyl(0.02,0.02,h||1.6,6,M.gold,0,(h||1.6)/2,0,g);const sh=cyl(0.2,0.3,0.34,14,M.cream,0,(h||1.6)+0.1,0,g);B3(g,0.12,0.2,0.12,GLOW,0,(h||1.6)+0.05,0);return g;}
function chandelier(P,x,y,z,s){
  const g=G3(P,x,y,z,0);s=s||1;cyl(0.015,0.015,0.9,4,M.gold,0,0.55,0,g);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(0.55*s,0.03,6,22),M.gold);ring.rotation.x=Math.PI/2;g.add(ring);
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(0.3*s,0.025,6,18),M.gold);ring2.rotation.x=Math.PI/2;ring2.position.y=0.25;g.add(ring2);
  for(let i=0;i<14;i++){const a=i/14*6.28;const c=B3(g,0.05,0.28,0.05,GLOWC,Math.cos(a)*0.55*s,-0.14,Math.sin(a)*0.55*s);c.rotation.y=a;
    if(i%2===0){const c2=B3(g,0.04,0.2,0.04,GLOWC,Math.cos(a)*0.3*s,0.12,Math.sin(a)*0.3*s);}}
  const core=new THREE.Mesh(new THREE.SphereGeometry(0.16*s,10,8),GLOW);core.position.y=0.05;g.add(core);return g;
}
function artFrame(P,x,y,z,ry,w,h,seed){
  const g=G3(P,x,y,z,ry);B3(g,w+0.12,h+0.12,0.06,M.gold,0,0,0);
  const art=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:TX.art(seed),roughness:0.7}));art.position.z=0.04;g.add(art);return g;
}
function curtains(P,x,y,z,ry,w,h,col){
  const g=G3(P,x,y,z,ry);const n=Math.round(w/0.35);
  for(let i=0;i<n;i++){const c=B3(g,0.3,h,0.1+(i%2)*0.08,col||M.cream,-w/2+0.17+i*(w/n),h/2,(i%2)*0.04);}
  B3(g,w+0.2,0.06,0.1,M.gold,0,h+0.05,0);return g;
}
function rug(P,x,z,w,d,c1,c2,ry){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({map:TX.rug(c1,c2),roughness:1}));
  m.rotation.x=-Math.PI/2;m.rotation.z=ry||0;m.position.set(x,0.19,z);m.receiveShadow=true;P.add(m);return m;
}
function bed(P,x,z,ry,w,len,lux){
  const g=G3(P,x,0,z,ry);
  B3(g,w+0.2,0.35,len+0.2,M.walnut,0,0.28,0);B3(g,w,0.3,len,M.white,0,0.6,0);
  B3(g,w+0.02,0.1,len*0.62,lux?M.navy:M.teal,0,0.78,len*0.2);B3(g,w+0.06,0.14,0.5,lux?M.gold:M.cream,0,0.8,-len*0.08);
  const hb=B3(g,w+0.5,1.35,0.18,M.leather,0,1.0,-len/2-0.05);
  for(let i=0;i<7;i++)B3(g,(w+0.3)/7-0.04,1.15,0.06,M.leather,-w/2-0.05+i*((w+0.3)/7)+0.1,1.0,-len/2+0.07);
  for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.SphereGeometry(0.28,10,8),M.white);p.scale.set(1.1,0.5,0.8);p.position.set(s*w*0.22,0.82,-len/2+0.45);p.castShadow=true;g.add(p);
    B3(g,0.5,0.5,0.45,M.walnut,s*(w/2+0.55),0.25,-len/2+0.3);B3(g,0.1,0.22,0.1,GLOW,s*(w/2+0.55),0.7,-len/2+0.3);cyl(0.14,0.12,0.2,10,M.gold,s*(w/2+0.55),0.58,-len/2+0.3,g);}
  return g;
}
function wardrobe(P,x,z,ry,w){
  const g=G3(P,x,0,z,ry);B3(g,w,2.6,0.7,M.walnut,0,1.3,0);
  const n=Math.max(2,Math.round(w/0.9));for(let i=0;i<n;i++){B3(g,w/n-0.06,2.4,0.05,M.oak,-w/2+(i+0.5)*(w/n),1.3,0.36);B3(g,0.04,0.3,0.05,M.gold,-w/2+(i+0.5)*(w/n)+0.18,1.3,0.4);}
  return g;
}
function tvWall(P,x,z,ry,w,fire){
  const g=G3(P,x,0,z,ry);B3(g,w,2.9,0.22,M.stone,0,1.45,0);B3(g,w,0.12,0.5,M.gold,0,0.25,0.15);
  B3(g,w*0.9,0.45,0.5,M.walnut,0,0.28,0.2);
  const tv=B3(g,Math.min(2.8,w*0.62),1.55,0.07,M.black,0,1.75,0.16);
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(2.8,w*0.62)-0.1,1.45),new THREE.MeshBasicMaterial({color:0x0b1b2e}));scr.position.set(0,1.75,0.205);g.add(scr);g.userData.screen=scr;
  if(fire){B3(g,1.5,0.7,0.2,M.black,-w*0.3,0.8,0.2);for(let i=0;i<4;i++)B3(g,0.32,0.18,0.1,EMI(i%2?0xff7a1a:0xff4a0a),-w*0.3-0.4+i*0.26,0.62+(i%2)*0.08,0.28);}
  return g;
}
function kitchen(P,x,z,w){
  const g=G3(P,x,0,z,0);
  B3(g,w,0.9,0.7,M.walnut,0,0.45,-0.05);B3(g,w+0.06,0.06,0.8,MARBLE_S,0,0.92,0);B3(g,w,0.9,0.4,M.oak,0,2.3,-0.2);
  for(let i=0;i<Math.round(w/0.7);i++)B3(g,0.04,0.28,0.04,M.gold,-w/2+0.4+i*0.7,0.78,0.34);
  B3(g,0.9,1.9,0.75,M.steel,w/2-0.5,1.0,0.0);B3(g,0.04,0.6,0.05,M.chrome,w/2-0.1,1.1,0.4);
  B3(g,0.8,0.45,0.5,M.black,-w/2+1.2,1.55,0);for(const b of[-0.2,0.2])B3(g,0.14,0.03,0.14,EMI(0xff5533),-w/2+1.2+b,0.96,0.05);
  return g;
}
function island(P,x,z,ry,w){
  const g=G3(P,x,0,z,ry);B3(g,w,0.9,1.1,M.walnut,0,0.45,0);B3(g,w+0.1,0.07,1.25,MARBLE_S,0,0.93,0);B3(g,0.07,0.93,1.25,MARBLE_S,w/2+0.05,0.46,0);
  for(let i=0;i<Math.round(w/0.9);i++){cyl(0.2,0.2,0.07,12,M.leather,-w/2+0.5+i*0.9,0.7,0.95,g);cyl(0.025,0.025,0.7,6,M.chrome,-w/2+0.5+i*0.9,0.35,0.95,g);}
  return g;
}
function jacuzzi(P,x,z,r){
  const g=G3(P,x,0,z,0);cyl(r,r,0.7,22,M.stone,0,0.35,0,g);
  const w=cyl(r-0.15,r-0.15,0.05,22,EMI(0x4fc3f7),0,0.7,0,g);g.userData.water=w;
  for(let i=0;i<6;i++){const a=i/6*6.28;B3(g,0.12,0.04,0.12,EMI(0xffffff),Math.cos(a)*(r-0.5),0.74,Math.sin(a)*(r-0.5));}
  return g;
}
function piano(P,x,z,ry){
  const g=G3(P,x,0,z,ry);B3(g,1.5,0.3,1.9,M.black,0,0.9,0);const lid=B3(g,1.5,0.05,1.8,M.black,0,1.35,-0.05);lid.rotation.z=0.0;
  B3(g,1.4,0.05,0.4,M.white,0,1.0,0.95);for(let i=0;i<14;i++)B3(g,0.04,0.04,0.38,M.black,-0.6+i*0.092,1.04,0.95);
  for(const[lx,lz]of[[-0.6,0.8],[0.6,0.8],[0,-0.8]])cyl(0.06,0.05,0.8,8,M.black,lx,0.4,lz,g);B3(g,0.9,0.06,0.45,M.black,0,0.52,1.55);return g;
}
function billiard(P,x,z,ry){
  const g=G3(P,x,0,z,ry);B3(g,2.6,0.28,1.4,M.walnut,0,0.9,0);B3(g,2.3,0.04,1.1,M.feltG,0,1.06,0);
  for(const[lx,lz]of[[-1.1,-0.5],[1.1,-0.5],[-1.1,0.5],[1.1,0.5]])cyl(0.11,0.09,0.8,8,M.walnut,lx,0.4,lz,g);
  for(let i=0;i<6;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(0.045,8,6),EMI([0xef4444,0xfacc15,0x2563eb,0x111111,0xffffff,0x16a34a][i]));b.position.set(0.3+(i%3)*0.1,1.12,-0.2+(i>>1)*0.1);g.add(b);}
  B3(g,3.4,0.05,0.05,M.oak,0,1.6,1.1);
  return g;
}
function sculpture(P,x,z,y){
  const g=G3(P,x,0,z,0);cyl(0.5,0.6,0.9,16,M.stone,0,0.45,0,g);
  for(let i=0;i<5;i++){const b=B3(g,0.5-i*0.06,0.5,0.5-i*0.06,M.gold,0,1.1+i*0.5,0);b.rotation.y=i*0.7;b.rotation.z=i*0.18;}
  return g;
}
function wineBar(P,x,z,ry,w){
  const g=G3(P,x,0,z,ry);B3(g,w,0.95,0.7,M.walnut,0,0.48,0);B3(g,w+0.06,0.06,0.8,MARBLE_S,0,0.97,0);B3(g,w,2.4,0.3,M.walnut,0,1.5,-0.32);
  for(let r=0;r<4;r++)for(let i=0;i<Math.round(w/0.18);i++){const b=cyl(0.04,0.04,0.3,6,[M.green,M.red,mt(0x35210f,0.5,0.1),M.gold][(r+i)%4],-w/2+0.15+i*0.18,1.0+r*0.42,-0.25,g);b.rotation.x=Math.PI/2;}
  B3(g,w,0.03,0.32,EMI(0xffd9a0),0,2.62,-0.3);
  return g;
}
function gymSet(P,x,z,ry){
  const g=G3(P,x,0,z,ry);
  B3(g,0.8,0.18,2.0,M.black,-1.8,0.3,0);B3(g,0.7,1.0,0.08,M.black,-1.8,1.2,0.9);B3(g,0.55,0.12,0.4,EMI(0x38bdf8),-1.8,1.65,0.88);
  for(const s of[-1,1])B3(g,0.05,0.9,0.05,M.chrome,-1.8+s*0.32,0.9,0.9);
  B3(g,0.6,0.15,1.8,M.leather,0.4,0.55,0);B3(g,0.06,1.1,0.06,M.chrome,0.1,0.9,-0.5);B3(g,0.06,1.1,0.06,M.chrome,0.7,0.9,-0.5);B3(g,0.7,0.05,0.05,M.chrome,0.4,1.4,-0.5);
  B3(g,2.2,0.7,0.35,M.black,2.1,0.4,-0.5);for(let i=0;i<5;i++){const d=B3(g,0.4,0.3,0.3,M.steel,1.35+i*0.4,0.88,-0.5);}
  B3(g,6,2.4,0.05,mt(0xcfe8f5,0.05,0.9),0,1.4,-1.7);
  return g;
}
function cinemaSet(P,x,z,ry){
  const g=G3(P,x,0,z,ry);B3(g,5,2.7,0.15,EMI(0xe8eefc),0,1.85,-2.9);B3(g,5.3,0.12,0.25,M.gold,0,3.25,-2.88);
  for(const r of[0,1])for(let i=0;i<4;i++){const c=G3(g,-1.8+i*1.2,r*0.5,r*1.7+0.4,0);B3(c,0.9,0.35,0.9,M.red,0,0.4,0);B3(c,0.9,0.8,0.2,M.red,0,0.9,-0.4);B3(c,0.16,0.5,0.9,M.red,-0.5,0.55,0);B3(c,0.16,0.5,0.9,M.red,0.5,0.55,0);}
  for(let i=0;i<5;i++)B3(g,0.5,2.4,0.1,M.walnut,-2.3+i*1.15,1.6,-2.95);
  return g;
}
function hoopDecor(P,x,z,ry){
  const g=G3(P,x,0,z,ry);cyl(0.08,0.1,3.4,8,M.steel,0,1.7,-0.6,g);B3(g,1.8,1.05,0.06,mt(0xf1f5f9,0.3,0.1),0,3.3,0);
  B3(g,0.6,0.45,0.04,mt(0xdc2626,0.5,0),0,3.15,0.03);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.23,0.022,6,16),mt(0xf97316,0.4,0.4));rim.rotation.x=Math.PI/2;rim.position.set(0,3.05,0.3);g.add(rim);
  const net=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.12,0.42,10,1,true),new THREE.MeshBasicMaterial({color:0xf8fafc,wireframe:true,side:THREE.DoubleSide}));net.position.set(0,2.84,0.3);g.add(net);
  return g;
}
function lounger(P,x,z,ry){const g=G3(P,x,0,z,ry);B3(g,0.7,0.12,1.6,M.white,0,0.38,0);const b=B3(g,0.7,0.1,0.7,M.white,0,0.62,-0.7);b.rotation.x=0.7;for(const s of[-1,1])for(const t of[-1,1])cyl(0.03,0.03,0.38,6,M.chrome,s*0.3,0.19,t*0.7,g);return g;}
function parasol(P,x,z,col){const g=G3(P,x,0,z,0);cyl(0.04,0.05,2.6,6,M.chrome,0,1.3,0,g);const c=new THREE.Mesh(new THREE.ConeGeometry(1.5,0.6,12),mt(col||0xf8fafc,0.8,0));c.position.y=2.65;c.castShadow=true;g.add(c);return g;}

// =====================================================================
//  INTÉRIEURS DES DOMAINES (construits à la demande)
// =====================================================================
const EST_DIM=[null,{W:32,D:30,HD:13},{W:42,D:36,HD:15},{W:54,D:44,HD:16},{W:66,D:56,HD:18},{W:82,D:68,HD:20}];
const estateBuilt={};
function estIX(t){return 8000+t*400;}
const EST_IZ=8000;

function buildEstate(t){
  if(estateBuilt[t])return estateBuilt[t];
  const dim=EST_DIM[t],W=dim.W,D=dim.D,HD=dim.HD,ix=estIX(t),iz=EST_IZ;
  const root=new THREE.Group();scene.add(root);
  const obs=[],spots=[];
  const ob=(x,z,w,d)=>obs.push([x-w/2,z-d/2,x+w/2,z+d/2]);
  const hx0=ix-W/2+2,hx1=ix+W/2-2,hz0=iz-D/2+2,hz1=hz0+HD,HW=hx1-hx0,hcx=(hx0+hx1)/2;
  const luxe=t>=3,top=t>=4;
  const wallM=mt(t>=4?0xf3ece0:0xf5f1ea,0.8,0),wallH=4.4;

  // --- jardin avec bassin
  const PW=[0,6,8,14,16,20][t],PD=[0,3,4,5,6,7][t];
  const px=ix-W*(t>=4?0.26:0.2),pz=hz1+(D-HD-4)*0.45;
  const lawn=new THREE.MeshStandardMaterial({map:TX.grass(8),roughness:0.95});
  const sl=(x0,z0,x1,z1)=>{if(x1-x0<0.01||z1-z0<0.01)return;const m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,0.3,z1-z0),lawn);m.position.set((x0+x1)/2,-0.01,(z0+z1)/2);m.receiveShadow=true;root.add(m);};
  const hxl=px-PW/2-0.5,hxr=px+PW/2+0.5,hzt=pz-PD/2-0.5,hzb=pz+PD/2+0.5,lx0=ix-W/2,lx1=ix+W/2,lz0=iz-D/2,lz1=iz+D/2;
  sl(lx0,lz0,lx1,hzt);sl(lx0,hzb,lx1,lz1);sl(lx0,hzt,hxl,hzb);sl(hxr,hzt,lx1,hzb);
  B3(root,PW+1,0.14,PD+1,M.stone,px,0.1,pz);   // margelle (sous le bassin)
  B3(root,PW,0.2,PD,M.tile,px,-1.5,pz);
  for(const s of[-1,1]){B3(root,PW,1.6,0.12,M.tile,px,-0.7,pz+s*PD/2);B3(root,0.12,1.6,PD,M.tile,px+s*PW/2,-0.7,pz);}
  const pool=makeWater(root,px,pz,PW,PD,0.0,Math.max(12,Math.round(PW*1.6)),0x39b6e5,null,0,0,0.78);
  pool.pool=true;EXS.pools=EXS.pools||[];
  // margelle visible autour
  B3(root,PW+1.4,0.16,0.5,M.stone,px,0.12,hzt-0.25);B3(root,PW+1.4,0.16,0.5,M.stone,px,0.12,hzb+0.25);B3(root,0.5,0.16,PD+1,M.stone,hxl-0.25,0.12,pz);B3(root,0.5,0.16,PD+1,M.stone,hxr+0.25,0.12,pz);
  // échelle chromée
  for(const s of[-0.3,0.3]){cyl(0.025,0.025,0.9,6,M.chrome,px+PW/2-0.6+s*0,0.45,pz+PD/2+0.5+s,root);}
  for(let i=0;i<Math.min(4,Math.floor(PW/3));i++){lounger(root,px-PW/2+1.5+i*2.2,hzb+1.6,0);}
  parasol(root,px+PW/2-1.5,hzb+2.2);
  ob(px,hzb+1.6,PW,2.2);   // transats : pas de collision sur le bassin

  // --- sol de la maison + murs
  const floorM=luxe?MARBLE:PARQ;
  const fl=new THREE.Mesh(new THREE.BoxGeometry(HW,0.16,HD),floorM);fl.position.set(hcx,0.1,hz0+HD/2);fl.receiveShadow=true;root.add(fl);
  const doorW=Math.min(7,HW*0.22),dxl=hcx-doorW/2,dxr=hcx+doorW/2;
  B3(root,HW+0.4,wallH,0.4,wallM,hcx,wallH/2,hz0-0.2);ob(hcx,hz0-0.2,HW+0.6,0.6);
  B3(root,0.4,wallH,HD+0.4,wallM,hx0-0.2,wallH/2,hz0+HD/2);ob(hx0-0.2,hz0+HD/2,0.6,HD+0.6);
  B3(root,0.4,wallH,HD+0.4,wallM,hx1+0.2,wallH/2,hz0+HD/2);ob(hx1+0.2,hz0+HD/2,0.6,HD+0.6);
  // façade vitrée avec ouverture centrale
  for(const[a,b]of[[hx0,dxl],[dxr,hx1]]){
    const w=b-a,cx=(a+b)/2;B3(root,w,wallH,0.12,GLASSM,cx,wallH/2,hz1);
    for(let k=0;k<=Math.round(w/2.2);k++)B3(root,0.1,wallH,0.18,M.black,a+k*(w/Math.max(1,Math.round(w/2.2))),wallH/2,hz1);
    B3(root,w,0.12,0.2,M.black,cx,wallH,hz1);ob(cx,hz1,w,0.5);
    curtains(root,cx,0.2,hz1-0.4,0,w*0.92,4.0,t>=4?M.cream:M.greyL);
  }
  B3(root,doorW,0.14,0.2,M.black,hcx,wallH,hz1);
  // plinthes
  B3(root,HW,0.18,0.06,M.gold,hcx,0.27,hz0+0.04);

  // --- cuisine & salle à manger (gauche)
  const kw=Math.min(6.5,HW*0.26),kx=hx0+kw/2+0.4;
  kitchen(root,kx,hz0+0.55,kw);ob(kx,hz0+0.55,kw,0.9);
  island(root,kx,hz0+3.4,0,Math.min(3.4,kw*0.7));ob(kx,hz0+3.4,Math.min(3.4,kw*0.7)+0.4,1.3);
  spots.push({x:kx+kw/2-0.5,z:hz0+1.8,r:2.2,label:'🧊 Se servir (frigo · soigne)',key:'fridge'});
  const dsx=hx0+kw+3.0;
  if(HW>26){diningSet(root,dsx+1.0,hz0+HD*0.52,0,t>=4?8:6,t>=3?M.walnut:M.oak);ob(dsx+1.0,hz0+HD*0.52,3.6,2.0);chandelier(root,dsx+1.0,3.9,hz0+HD*0.52,1);}
  else{diningSet(root,kx,hz0+HD*0.7,0,4,M.oak);ob(kx,hz0+HD*0.7,2.4,1.6);}

  // --- salon (centre)
  const lvx=hcx+(HW>26?2:0),lvz=hz0+HD*0.58;
  rug(root,lvx,lvz,7.4,5.4,t>=4?'#e8dcc3':'#d9cdb5','#7a3b2e');
  sofa(root,lvx,lvz+1.9,Math.PI,4.0,t>=3?M.navy:M.grey,t>=3?M.cream:M.greyL);ob(lvx,lvz+1.9,4.2,1.1);
  sofa(root,lvx-3.2,lvz,Math.PI/2,2.6,t>=3?M.navy:M.grey,t>=3?M.cream:M.greyL);ob(lvx-3.2,lvz,1.1,2.8);
  armchair(root,lvx+3.2,lvz,-Math.PI/2,M.beige);ob(lvx+3.2,lvz,1.1,1.3);
  cTable(root,lvx,lvz,2.0,1.1,0.42);
  tvWall(root,lvx,hz0+0.4,0,Math.min(6,HW*0.36),luxe);ob(lvx,hz0+0.55,Math.min(6,HW*0.36),0.7);
  spots.push({x:lvx,z:hz0+3.0,r:2.6,label:'📺 Regarder la télé (détente)',key:'tv'});
  chandelier(root,lvx,3.7,lvz,t>=4?1.5:1.1);
  lampFloor(root,lvx-4.6,lvz+2.4);lampFloor(root,lvx+4.6,lvz+2.4);
  plant(root,lvx-4.8,hz0+1.0,1.5);plant(root,lvx+4.8,hz0+1.0,1.3);
  artFrame(root,lvx-5.4,2.2,hz0+0.25,0,1.4,1.8,t);artFrame(root,lvx+5.4,2.2,hz0+0.25,0,1.4,1.8,t+1);
  if(t>=3){cTable(root,hx0+HW*0.42,hz1-1.3,3.2,0.6,0.72,M.walnut,M.black);}
  // --- chambre (droite)
  const bx0=hx1-4.2;
  bed(root,bx0,hz0+3.0,0,t>=3?2.0:1.6,2.2,t>=3);ob(bx0,hz0+3.2,3.6,2.8);
  spots.push({x:bx0,z:hz0+5.2,r:2.8,label:'🛏️ Se coucher et dormir',key:'bed'});
  wardrobe(root,hx1-0.5,hz0+HD*0.62,-Math.PI/2,Math.min(4.2,HD*0.5));ob(hx1-0.6,hz0+HD*0.62,0.9,Math.min(4.2,HD*0.5));
  rug(root,bx0,hz0+4.8,3.8,2.4,'#cfc4ad','#22364f');
  B3(root,3.0,0.09,0.9,M.walnut,bx0-2.4,0.9,hz1-0.9);B3(root,0.9,0.7,0.05,mt(0xcfe8f5,0.05,0.9),bx0-2.4,1.6,hz1-1.3);
  artFrame(root,bx0,2.6,hz0+0.25,0,2.2,1.2,t+2);
  // coffre-fort
  const sf=B3(root,0.8,1.0,0.7,M.black,hx1-0.8,0.5,hz0+0.7);B3(root,0.22,0.22,0.06,M.gold,hx1-0.8,0.55,hz0+1.07);
  ob(hx1-0.8,hz0+0.7,0.9,0.8);spots.push({x:hx1-1.2,z:hz0+1.8,r:2.2,label:'💰 Coffre-fort (loyers)',key:'safe'});
  // --- options haut de gamme
  if(t>=3){
    jacuzzi(root,hx1-3.3,hz0+HD-2.8,1.3);ob(hx1-3.3,hz0+HD-2.8,2.8,2.8);spots.push({x:hx1-3.3,z:hz0+HD-4.6,r:2.4,label:'🛁 Jacuzzi (récupère l’armure)',key:'spa'});
    gymSet(root,hx0+HW*0.22,hz1-3.0,0);ob(hx0+HW*0.22,hz1-2.8,7.0,2.6);spots.push({x:hx0+HW*0.22,z:hz1-5.0,r:3.2,label:'🏋️ Séance de sport (endurance +)',key:'gym'});
    wineBar(root,hx0+3.2,hz1-0.9,Math.PI,4.2);ob(hx0+3.2,hz1-1.2,4.4,0.9);
  }
  if(t>=4){
    billiard(root,hx0+HW*0.5,hz1-3.0,0);ob(hx0+HW*0.5,hz1-3.0,3.0,1.7);
    piano(root,hx1-HW*0.14,hz1-5.0,-Math.PI/2);ob(hx1-HW*0.14,hz1-5.0,1.7,2.0);
    cinemaSet(root,hx0+HW*0.62,hz0+HD*0.9,0);spots.push({x:hx0+HW*0.62,z:hz0+HD*0.9+1.5,r:3.2,label:'🎬 Séance de cinéma (détente)',key:'cinema'});
    chandelier(root,hx0+HW*0.62,3.9,hz0+HD*0.5,1.1);
  }
  if(t>=5){
    sculpture(root,hx0+HW*0.45,hz1-1.6);ob(hx0+HW*0.45,hz1-1.6,1.3,1.3);
    for(const sx of[-1,1])for(let k=0;k<2;k++){cyl(0.5,0.55,wallH,14,M.white,hcx+sx*(HW*0.18+k*3.4),wallH/2,hz0+HD*0.35,root);ob(hcx+sx*(HW*0.18+k*3.4),hz0+HD*0.35,1.1,1.1);}
    chandelier(root,hcx,4.1,hz0+HD*0.35,2.0);
  }
  // --- jardin : terrains
  const gz0=hz1+2.5,gdepth=D-HD-5;
  if(t>=4){
    const cxp=t>=5?ix-2:ix+W*0.22,czp=gz0+gdepth*0.5;
    const ct=new THREE.Mesh(new THREE.PlaneGeometry(14,15),new THREE.MeshStandardMaterial({map:TX.basket(),roughness:0.6}));ct.rotation.x=-Math.PI/2;ct.position.set(cxp,0.17,czp);ct.receiveShadow=true;root.add(ct);
    hoopDecor(root,cxp,czp-6.6,0);hoopDecor(root,cxp,czp+6.6,Math.PI);
    ob(cxp,czp-7.2,2.2,0.6);ob(cxp,czp+7.2,2.2,0.6);
    spots.push({x:cxp,z:czp,r:3.4,label:'🏀 Jouer au basket (1 contre 1)',key:'basket'});
  }
  if(t>=5){
    const cxp=ix+W*0.28,czp=gz0+gdepth*0.5,ctt=new THREE.Mesh(new THREE.PlaneGeometry(11,24),new THREE.MeshStandardMaterial({map:TX.tennis(),roughness:0.7}));
    ctt.rotation.x=-Math.PI/2;ctt.position.set(cxp,0.17,czp);ctt.receiveShadow=true;root.add(ctt);
    B3(root,11,0.9,0.06,EMI(0xe5e7eb),cxp,0.5,czp);for(const s of[-1,1])B3(root,0.1,1.1,0.1,M.black,cxp+s*5.6,0.6,czp);
    for(const s of[-1,1])for(let k=0;k<9;k++)B3(root,0.04,2.8,0.04,M.black,cxp+s*6.6,1.4,czp-11+k*2.75);
    spots.push({x:cxp+4.2,z:czp+2.5,r:3.6,label:'🎾 Jouer au tennis',key:'tennis'});
    // héliport
    cyl(5.2,5.2,0.14,28,0x374151,ix-W/2+7,0.2,iz+D/2-8,root);B3(root,0.6,0.16,3.6,EMI(0xfde047),ix-W/2+5.6,0.26,iz+D/2-8);B3(root,0.6,0.16,3.6,EMI(0xfde047),ix-W/2+8.4,0.26,iz+D/2-8);B3(root,2.8,0.16,0.6,EMI(0xfde047),ix-W/2+7,0.26,iz+D/2-8);
  }
  // palmiers et haies périphériques
  for(let k=0;k<Math.round(W/9);k++){palm(root,lx0+3+k*(W-6)/Math.max(1,Math.round(W/9)-1),lz0+1.2+rr(0,0.8),t>=4?8:6);}
  for(let k=0;k<Math.round(D/12);k++){palm(root,lx0+1.2,hz1+4+k*10,6.5);palm(root,lx1-1.2,hz1+4+k*10,6.5);}
  // murs d'enceinte et portail de sortie
  const perim=(x,z,w,d)=>{B3(root,w,2.6,d,wallM,x,1.3,z);};
  perim(ix,lz0-0.3,W+0.8,0.6);perim(lx0-0.3,iz,0.6,D);perim(lx1+0.3,iz,0.6,D);
  perim((lx0+ix-3)/2,lz1+0.3,(ix-3)-lx0,0.6);perim((lx1+ix+3)/2,lz1+0.3,lx1-(ix+3),0.6);
  for(const s of[-1,1]){B3(root,1.0,3.4,1.0,wallM,ix+s*3,1.7,lz1+0.3);B3(root,0.5,0.5,0.5,GLOW,ix+s*3,3.65,lz1+0.3);}
  B3(root,7,0.5,0.7,M.gold,ix,3.5,lz1+0.3);
  const sgn=new THREE.Mesh(new THREE.PlaneGeometry(4,0.7),new THREE.MeshBasicMaterial({map:TX.sign('SORTIE',"#101827","#fde047")}));sgn.position.set(ix,2.8,lz1-0.1);sgn.rotation.y=Math.PI;root.add(sgn);
  root.traverse(o=>{if(o.isMesh){o.castShadow=o.castShadow||false;o.receiveShadow=true;}});
  const cfg={ix:ix,iz:iz,w:W,d:D,obs:obs};
  INTERIORS['estate'+t]=cfg;
  estateBuilt[t]={root,cfg,spots,pool,tv:null};
  return estateBuilt[t];
}

// =====================================================================
//  ÉCONOMIE : achat, loyers, sommeil, interactions dans les domaines
// =====================================================================
const estateOf=type=>(type&&/^estate\d$/.test(type))?+type.slice(6):0;
EXS.intName=type=>{
  const t=estateOf(type);
  if(t)return 'DOMAINE · '+ESTATES[t].name.toUpperCase();
  if(type==='agency')return 'PRESTIGE IMMOBILIER';
  if(type==='sports')return 'COMPLEXE SPORTIF ARENA';
  return 'INTÉRIEUR';
};
const RENT_SEC=540,RENT_RATE=0.03;   // 1 « jour » = 9 minutes de jeu ; 3 % du prix par jour
function buyEstate(t){
  const E=ESTATES[t];
  if(SAVE.own[t])return false;
  if(P.cash<E.price){showToast(`Il te manque ${fmt(E.price-P.cash)} FCFA`);return false;}
  P.cash-=E.price;SAVE.own[t]=1;SAVE.rent[t]={last:SAVE.stats.playSec};
  writeSave();playTone(880,0.4,'sine',0.07);setTimeout(()=>playTone(1175,0.4,'sine',0.06),160);
  showToast(`🏡 ${E.name} est à toi ! Dors, joue, nage…`);
  refreshPoiEmojis();
  return true;
}
function offerProperty(t){
  const E=ESTATES[t],can=P.cash>=E.price;
  openModal(`<h2>🏷️ ${E.name}</h2><div class="sub">Domaine ${t}/5 · ${E.zone} · Prix : <b style="color:#fde047">${fmt(E.price)} FCFA</b> · Tu as ${fmt(P.cash)} FCFA</div>
    ${E.feat.map(f=>`<div class="row"><b>${f}</b></div>`).join('')}
    <div class="sub" style="margin-top:8px">Loyers : ${Math.round(E.price*RENT_RATE)} FCFA par jour de jeu, à récupérer dans le coffre-fort.</div>
    <div class="foot"><button class="sec" id="ex-no">Pas maintenant</button><button id="ex-yes" ${can?'':'disabled'}>${can?'Acheter · '+fmt(E.price)+' FCFA':'Il manque '+fmt(E.price-P.cash)+' FCFA'}</button></div>`,
    c=>{c.querySelector('#ex-no').onclick=closeModal;
        c.querySelector('#ex-yes').onclick=()=>{if(buyEstate(t)){closeModal();}};});
}
function collectRent(t){
  const r=SAVE.rent[t]||(SAVE.rent[t]={last:SAVE.stats.playSec}),E=ESTATES[t];
  const days=Math.min(5,Math.floor((SAVE.stats.playSec-r.last)/RENT_SEC));
  if(days<=0){const left=Math.ceil(RENT_SEC-(SAVE.stats.playSec-r.last));showToast(`💰 Le coffre est vide. Prochain loyer dans ${Math.floor(left/60)} min ${left%60} s.`);return;}
  const gain=Math.round(days*E.price*RENT_RATE);P.cash+=gain;r.last+=days*RENT_SEC;stat('earned',gain);writeSave();
  playTone(880,0.3,'sine');showToast(`💰 Loyers encaissés : +${fmt(gain)} FCFA (${days} jour${days>1?'s':''})`);
}
function hourLabel(h){h=Math.floor(h);return h>=5&&h<11?'le matin':h>=11&&h<17?'l’après-midi':h>=17&&h<21?'en soirée':'en pleine nuit';}
function sleepMenu(){
  const h=dayTime,hh=String(Math.floor(h)).padStart(2,'0')+':'+String(Math.floor((h%1)*60)).padStart(2,'0');
  const opts=[['🌅','Dormir jusqu’au matin','réveil à 07:00',7],['😴','Faire une sieste','+ 3 heures',(h+3)%24],['🌇','Dormir jusqu’au soir','réveil à 18:00',18]];
  openModal(`<h2>🛏️ Se coucher et dormir</h2><div class="sub">Il est ${hh}. Dormir te rend toute ta santé, ton endurance, et fait oublier ta cavale à la police.</div>
    ${opts.map((o,i)=>`<div class="row"><div><b>${o[0]} ${o[1]}</b><small>${o[2]}</small></div><button data-i="${i}">Dormir</button></div>`).join('')}
    <div class="foot"><button class="sec" id="ex-no">Rester debout</button></div>`,
    c=>{c.querySelector('#ex-no').onclick=closeModal;c.querySelectorAll('button[data-i]').forEach(b=>b.onclick=()=>doSleep(opts[+b.dataset.i][3]));});
}
async function doSleep(target){
  closeModal();
  await fadeTo(true,'💤  Zzz…',1300);
  if(SAVE.set.time!=='auto'){SAVE.set.time='auto';showToast('Heure remise en mode automatique.');}
  dayTime=target;
  P.hp=100;P.armor=Math.max(P.armor,60);P.stamina=SAVE.maxStamina||100;stars=0;wT=0;
  stat('sleeps');writeSave();
  await fadeTo(true,'',700);
  fadeTo(false,'',100);
  const hh=String(Math.floor(dayTime)).padStart(2,'0')+':'+String(Math.floor((dayTime%1)*60)).padStart(2,'0');
  showToast(`☀️ Tu te réveilles ${hourLabel(dayTime)} (${hh}). Pleine forme !`);
}
const spotCd={};
function useSpot(s){
  const t=estateOf(interiorType);
  const cd=key=>{if((spotCd[key]||0)>tmNow()){showToast('Patiente un instant…');return true;}spotCd[key]=tmNow()+6;return false;};
  switch(s.key){
    case 'fridge':if(cd('f'))return;P.hp=Math.min(100,P.hp+30);playTone(600,0.15,'sine');showToast('🧊 Tu te sers à manger : +30 santé');break;
    case 'bed':sleepMenu();break;
    case 'safe':collectRent(t);break;
    case 'tv':{
      const e=estateBuilt[t];let scr=null;e.root.traverse(o=>{if(o.userData&&o.userData.screen)scr=o.userData.screen;});
      if(scr){e.tvOn=!e.tvOn;scr.material.color.setHex(e.tvOn?0x3b82f6:0x0b1b2e);}
      showToast(e&&e.tvOn?'📺 Journal télévisé allumé.':'📺 Télé éteinte.');break;}
    case 'spa':if(cd('s'))return;P.armor=Math.min(100,P.armor+40);P.hp=Math.min(100,P.hp+25);playTone(420,0.3,'sine');showToast('🛁 Le jacuzzi te détend : +40 armure, +25 santé');break;
    case 'gym':if(cd('g'))return;SAVE.maxStamina=Math.min(180,(SAVE.maxStamina||100)+3);P.stamina=SAVE.maxStamina;if(typeof playPunchSound==='function')playPunchSound(true);writeSave();showToast(`🏋️ Séance terminée · Endurance max : ${SAVE.maxStamina}`);break;
    case 'cinema':{
      if(cd('c'))return;
      fadeTo(true,'🎬',900).then(()=>{if(SAVE.set.time==='auto')dayTime=(dayTime+2)%24;P.hp=Math.min(100,P.hp+10);fadeTo(false,'',100);showToast('🎬 Film terminé. Tu es bien reposé (+2 h).');});break;}
    case 'basket':sportMenu('basket',true);break;
    case 'tennis':sportMenu('tennis',true);break;
    case 'catalog':openCatalog();break;
    case 'sp_basket':sportMenu('basket',false);break;
    case 'sp_tennis':sportMenu('tennis',false);break;
    case 'sp_pen':sportMenu('penalty',false);break;
  }
}
const tmNow=()=>performance.now()/1000;

// =====================================================================
//  AGENCE « PRESTIGE IMMOBILIER » + BOUTIQUE DE LUXE
// =====================================================================
let agency=null;
function buildAgency(){
  if(agency)return agency;
  const ix=11000,iz=8000,W=28,D=20,g=buildRoomShell(ix,iz,W,D,0xe5e7eb,0x1f2a3d,0x0b1220);
  const fl=new THREE.Mesh(new THREE.BoxGeometry(W-1,0.1,D-1),MARBLE);fl.position.set(ix,0.18,iz);fl.receiveShadow=true;g.add(fl);
  const obs=[];
  B3(g,9,1.1,1.6,M.walnut,ix,0.6,iz-4.2);B3(g,9.2,0.08,1.8,MARBLE_S,ix,1.2,iz-4.2);B3(g,3.6,0.5,0.06,EMI(0xfcd34d),ix,0.9,iz-3.35);obs.push([ix-4.6,iz-5.1,ix+4.6,iz-3.3]);
  const agent=buildHuman(0x111827,0x7b5438,'vip');agent.position.set(ix,0,iz-5.6);g.add(agent);
  interiorNPCs.push({type:'agency',m:agent,x:ix,z:iz-5.6,h:0,name:'M. Atangana · Agent immobilier',line:'Bienvenue chez Prestige ! Des domaines d’exception, un jetpack, un pass VIP aéroport… à vous de voir.'});
  for(let i=0;i<5;i++){
    const E=ESTATES[i+1],c=document.createElement('canvas');c.width=256;c.height=320;const x=c.getContext('2d');
    const gr=x.createLinearGradient(0,0,0,320);gr.addColorStop(0,'#1f2a44');gr.addColorStop(1,'#0b1220');x.fillStyle=gr;x.fillRect(0,0,256,320);
    x.fillStyle='#'+E.acc.toString(16).padStart(6,'0');x.fillRect(0,0,256,10);x.font='bold 40px sans-serif';x.textAlign='center';x.fillText('🏰🏡🏠🏘️🏰'[i]||'🏡',128,92);
    x.fillStyle='#fff';x.font='bold 22px sans-serif';x.fillText(E.name,128,140);x.font='16px sans-serif';x.fillStyle='#cbd5e1';x.fillText('Domaine '+(i+1)+'/5',128,168);
    x.fillStyle='#fde047';x.font='bold 24px sans-serif';x.fillText(fmt(E.price)+' F',128,228);
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.75),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));pl.position.set(ix-9+i*4.5,2.6,iz-D/2+0.3);g.add(pl);
    B3(g,2.4,2.95,0.05,M.gold,ix-9+i*4.5,2.6,iz-D/2+0.26);
  }
  for(const[sx,sp]of[[-8,'🚀'],[8,'🎫']]){cyl(0.9,1.0,0.5,18,M.stone,ix+sx,0.4,iz+3,g);cyl(0.7,0.7,0.06,18,EMI(0xfcd34d),ix+sx,0.68,iz+3,g);obs.push([ix+sx-1,iz+2,ix+sx+1,iz+4]);}
  if(typeof makeEmojiSprite==='function'){for(const[sx,sp]of[[-8,'🚀'],[8,'🎫']]){const s=makeEmojiSprite(sp,1.8,true);s.position.set(ix+sx,1.9,iz+3);g.add(s);}}
  chandelier(g,ix,4.5,iz,1.8);chandelier(g,ix-8,4.6,iz+2,1.2);chandelier(g,ix+8,4.6,iz+2,1.2);
  plant(g,ix-12,iz-8,1.6);plant(g,ix+12,iz-8,1.6);
  INTERIORS.agency={ix:ix,iz:iz,w:W,d:D,obs:obs};
  agency={g,spots:[{x:ix,z:iz-2.6,r:4.2,label:'🏢 Parler à l’agent (catalogue)',key:'catalog'},{x:ix-8,z:iz+3,r:2.6,label:'🚀 Boutique de luxe',key:'catalog'},{x:ix+8,z:iz+3,r:2.6,label:'🎫 Boutique de luxe',key:'catalog'}]};
  return agency;
}
function openCatalog(){
  const rows=ESTATES.slice(1).map(E=>{
    const own=!!SAVE.own[E.n];
    return `<div class="row"><div><b>${E.n===5?'👑':E.n>=3?'✨':'🏡'} ${E.name}</b><small>${E.feat.join(' · ')}</small></div>
      ${own?`<button class="sec" data-gps="${E.n}">📍 GPS</button>`:`<button data-buy="${E.n}" ${P.cash>=E.price?'':'disabled'}>${fmt(E.price)} F</button>`}</div>`;
  }).join('');
  const goods=[
    {k:'jet',e:'🚀',n:'Jetpack de poche',d:'Maintiens 🚀 ou C pour voler. Carburant limité, se recharge au sol.',p:150000,own:!!SAVE.jet},
    {k:'pass',e:'🎫',n:'Pass VIP Aéroport',d:'Accès à l’aéroport sans alerte. (Voler un avion reste un crime.)',p:40000,own:!!SAVE.pass}
  ].map(o=>`<div class="row"><div><b>${o.e} ${o.n}</b><small>${o.d}</small></div>${o.own?'<button class="sec" disabled>Possédé</button>':`<button data-good="${o.k}" data-p="${o.p}" ${P.cash>=o.p?'':'disabled'}>${fmt(o.p)} F</button>`}</div>`).join('');
  openModal(`<h2>🏢 Prestige Immobilier</h2><div class="sub">Solde : ${fmt(P.cash)} FCFA · Tes domaines te rapportent des loyers.</div><b style="font-size:12px;color:#94a3b8">DOMAINES</b>${rows}<b style="font-size:12px;color:#94a3b8">BOUTIQUE DE LUXE</b>${goods}<div class="foot"><button class="sec" id="ex-no">Fermer</button></div>`,
  c=>{
    c.querySelector('#ex-no').onclick=closeModal;
    c.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{if(buyEstate(+b.dataset.buy))openCatalog();});
    c.querySelectorAll('[data-gps]').forEach(b=>b.onclick=()=>{const p=ESTATE_POS[+b.dataset.gps];customWaypoint={x:p.x,z:p.z};showToast('📍 GPS vers '+ESTATES[+b.dataset.gps].name);closeModal();});
    c.querySelectorAll('[data-good]').forEach(b=>b.onclick=()=>{
      const p=+b.dataset.p;if(P.cash<p)return;P.cash-=p;
      if(b.dataset.good==='jet'){SAVE.jet=1;showToast('🚀 Jetpack acheté ! Maintiens 🚀 (ou C) pour voler.');}else{SAVE.pass=1;showToast('🎫 Pass VIP activé : l’aéroport est ouvert pour toi.');}
      writeSave();playTone(880,0.3,'sine');refreshJetBtn();openCatalog();
    });
  });
}

// =====================================================================
//  COMPLEXE SPORTIF « ARENA » (salles payantes)
// =====================================================================
let sportsHall=null;
function buildSports(){
  if(sportsHall)return sportsHall;
  const ix=12000,iz=8000,W=48,D=30,g=buildRoomShell(ix,iz,W,D,0x1f2937,0x334155,0x0b1220);
  const fl=new THREE.Mesh(new THREE.BoxGeometry(W-1,0.1,D-1),PARQ_D);fl.position.set(ix,0.18,iz);fl.receiveShadow=true;g.add(fl);
  const obs=[];
  const stand=(sx,kind,txt,col)=>{
    B3(g,12,0.05,10,mt(col,0.7,0),ix+sx,0.22,iz-1);
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(8,1.4),new THREE.MeshBasicMaterial({map:TX.sign(txt,'#0b1220','#fde047')}));sg.position.set(ix+sx,4.0,iz-D/2+0.3);g.add(sg);
    chandelier(g,ix+sx,4.7,iz-1,1.4);
  };
  stand(-15,'basket','🏀 BASKET · 200 F',0x7c2d12);stand(0,'tennis','🎾 TENNIS · 300 F',0x14532d);stand(15,'pen','⚽ PENALTY · 150 F',0x166534);
  hoopDecor(g,ix-15,iz-5.5,0);
  B3(g,10,0.9,0.06,EMI(0xe5e7eb),ix,0.7,iz-1);for(const s of[-1,1])B3(g,0.1,1.1,0.1,M.black,ix+s*5.1,0.7,iz-1);
  B3(g,5.4,0.2,0.2,M.white,ix+15,2.4,iz-5.8);for(const s of[-1,1])B3(g,0.2,2.4,0.2,M.white,ix+15+s*2.7,1.2,iz-5.8);
  for(let i=0;i<10;i++)B3(g,5.4,0.03,0.03,EMI(0xf8fafc),ix+15,0.3+i*0.22,iz-6.0);
  const coach=buildHuman(0x0ea5e9,0x6f4e37,'student');coach.position.set(ix,0,iz+3);g.add(coach);
  interiorNPCs.push({type:'sports',m:coach,x:ix,z:iz+3,h:Math.PI,name:'Coach Eto’o · Arena',line:'Choisis ton sport : approche une station et appuie sur INTERAGIR. On joue pour de vrai ici !'});
  for(let i=0;i<8;i++)B3(g,2.4,0.5,0.8,M.leather,ix-20+i*5.6,0.45,iz+D/2-4);
  plant(g,ix-22,iz+11,1.5);plant(g,ix+22,iz+11,1.5);
  INTERIORS.sports={ix:ix,iz:iz,w:W,d:D,obs:obs};
  sportsHall={g,spots:[
    {x:ix-15,z:iz+2,r:4.5,label:'🏀 Basket 1v1 · 200 FCFA',key:'sp_basket'},
    {x:ix,z:iz+2,r:4.5,label:'🎾 Tennis · 300 FCFA',key:'sp_tennis'},
    {x:ix+15,z:iz+2,r:4.5,label:'⚽ Tirs au but · 150 FCFA',key:'sp_pen'}]};
  return sportsHall;
}
function currentSpots(){
  const t=estateOf(interiorType);
  if(t&&estateBuilt[t])return estateBuilt[t].spots;
  if(interiorType==='agency'&&agency)return agency.spots;
  if(interiorType==='sports'&&sportsHall)return sportsHall.spots;
  return null;
}
function nearSpot(){
  const sp=currentSpots();if(!sp)return null;
  let best=null,bd=1e9;
  for(const s of sp){const d=Math.hypot(P.x-s.x,P.z-s.z);if(d<s.r&&d<bd){bd=d;best=s;}}
  return best;
}

// =====================================================================
//  MINI-JEUX SPORTIFS : BASKET 1v1, TENNIS, TIRS AU BUT (contre une IA)
// =====================================================================
const MG={active:null};
const randn=()=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
const arenaCache={};
function hudScore(t){$e('mg-sc').textContent=t;}
let _msgT=0;
function hudMsg(t,sec){$e('mg-msg').textContent=t||'';_msgT=sec||0;}
function hudBar(f,col){const b=$e('mg-bar');if(f===null){b.style.display='none';return;}b.style.display='block';const i=b.firstChild;i.style.width=Math.round(clp(f,0,1)*100)+'%';i.style.background=col||(f>0.78?'#22c55e':f>0.45?'#facc15':'#ef4444');}
function athlete(shirt,skin,scale){
  const m=buildHuman(shirt,skin,'student');m.scale.setScalar(scale||1);return m;
}
function addRacket(m){
  const u=m.userData,r=new THREE.Group();
  cyl(0.018,0.018,0.34,6,M.black,0,-0.2,0.08,r);
  const hd=new THREE.Mesh(new THREE.TorusGeometry(0.15,0.015,6,14),M.red);hd.scale.set(0.8,1,1);hd.position.set(0,-0.46,0.08);r.add(hd);
  const st=new THREE.Mesh(new THREE.CircleGeometry(0.14,12),new THREE.MeshBasicMaterial({color:0xf5f5f5,transparent:true,opacity:0.4,side:THREE.DoubleSide}));st.scale.set(0.8,1,1);st.position.set(0,-0.46,0.08);r.add(st);
  u.elbowR.add(r);return r;
}
const gm=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.5});

function mkBall(r,col){const b=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),new THREE.MeshStandardMaterial({color:col,roughness:0.6}));b.castShadow=true;scene.add(b);return b;}

// ---------------------------------------------------------------- BASKET
const BA={x:14000,z:14000};
function basketArena(){
  if(arenaCache.basket)return;
  const g=new THREE.Group();scene.add(g);
  B3(g,60,0.2,60,mt(0x16202e,0.9,0),BA.x,-0.12,BA.z);
  const ct=new THREE.Mesh(new THREE.PlaneGeometry(15,15),new THREE.MeshStandardMaterial({map:TX.basket(),roughness:0.55}));ct.rotation.x=-Math.PI/2;ct.position.set(BA.x,0.02,BA.z);ct.receiveShadow=true;g.add(ct);
  B3(g,17,0.3,17,PARQ_D,BA.x,-0.06,BA.z);
  const hoop=(zz,ry)=>{const h=hoopDecor(g,BA.x,BA.z+zz,ry);return h;};
  hoopDecor(g,BA.x,BA.z-6.3,0);
  for(let i=0;i<14;i++){B3(g,3,0.4+i*0.35,0.6,mt(i%2?0x1e3a5f:0x7c2d12,0.9,0),BA.x-8.9-i*0.0,0.2+i*0.35,BA.z-8.5+i*1.2);}
  for(const s of[-1,1])B3(g,0.4,7,16,mt(0x1f2937,0.9,0),BA.x+s*9,3.5,BA.z);
  B3(g,18,7,0.4,mt(0x1f2937,0.9,0),BA.x,3.5,BA.z+8.3);B3(g,18,7,0.4,mt(0x1f2937,0.9,0),BA.x,3.5,BA.z-8.6);
  for(let k=0;k<4;k++)chandelier(g,BA.x-5+k*3.4,6.2,BA.z-2,1.2);
  arenaCache.basket=g;
}
class Basket{
  constructor(o){
    this.o=o;basketArena();this.kind='basket';
    this.pl={x:0,z:3,wk:0,h:Math.PI,m:athlete(0xdc2626,0x7b5438)};this.ai={x:0,z:-1.5,wk:0,h:0,m:athlete(0x2563eb,0x6f4e37)};
    this.ball=mkBall(0.12,0xea6a1f);
    this.b={x:0,y:1,z:3,vx:0,vy:0,vz:0,st:'held',own:'pl',shooter:null,shot3:false,t:0,freeT:0};
    this.score={pl:0,ai:0};this.t=0;this.pause=0.8;this.charge=0;this.charging=false;this.pfire=false;this.paim=false;
    this.aiShoot=rr(1.1,2.2);this.stealT=1;this.aiGoal={x:0,z:-3};this.aiPick=0;this.pCd=0;this.over=false;this.shootAnim=0;
    this.rim={x:0,y:3.05,z:-5.9};this.diff=o.diff||0;
    hudScore('Toi 0 – 0 IA');hudMsg('Tiens FEU puis relâche au sommet de la jauge pour tirer. VISER : voler le ballon.',5);
    this.cam=new THREE.Vector3(BA.x,6.8,BA.z+9);
  }
  dist(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
  reset(poss){
    this.pl.x=0;this.pl.z=poss==='pl'?3.2:-0.5;this.ai.x=0;this.ai.z=poss==='ai'?3.2:-0.5;
    this.b.st='held';this.b.own=poss;this.b.shooter=null;this.pause=1.5;this.charge=0;this.charging=false;hudBar(null);
  }
  shoot(who,quality){
    const s=who==='pl'?this.pl:this.ai,b=this.b,o=this.rim;
    const dr=this.dist(s,{x:o.x,z:o.z+0.0});
    const opp=who==='pl'?this.ai:this.pl;
    const defNear=this.dist(s,opp)<1.5;
    let sig=(0.06+dr*0.024)*(1.65-quality)*(defNear?1.55:1);
    sig*=who==='ai'?[1.5,1.0,0.62][this.diff]:[0.85,1,1.15][this.diff];
    const T=clp(0.78+dr*0.07,0.95,1.5),x0=s.x,y0=2.15,z0=s.z;
    const tx=o.x+randn()*sig,tz=o.z+randn()*sig*0.9;
    b.x=x0;b.y=y0;b.z=z0;
    b.vx=(tx-x0)/T;b.vz=(tz-z0)/T;b.vy=(o.y-y0+0.5*9.8*T*T)/T;
    b.st='free';b.shooter=who;b.shot3=dr>6.7;b.freeT=0;b.prev=y0;b.t=0;this.shootAnim=0.5;this.lastShotWho=who;
    playTone(300,0.1,'sine',0.03,500);
  }
  scoreBasket(who){
    const pts=this.b.shot3?3:2;this.score[who]+=pts;
    hudScore(`Toi ${this.score.pl} – ${this.score.ai} IA`);hudMsg(who==='pl'?`🏀 PANIER ! +${pts}`:`Panier de l’IA +${pts}`,1.6);
    playTone(880,0.25,'sine',0.06);
    if(this.score.pl>=11||this.score.ai>=11){this.over=true;this.finish(this.score.pl>this.score.ai);return;}
    this.b.st='dead';setTimeout(()=>{if(MG.active===this)this.reset(who==='pl'?'ai':'pl');},1300);this.pause=2;
  }
  update(dt,i){
    this.t+=dt;if(this.over)return;
    const pl=this.pl,ai=this.ai,b=this.b;
    const fireEdgeDown=i.fire&&!this.pfire,fireEdgeUp=!i.fire&&this.pfire,aimEdge=i.aim&&!this.paim;
    this.pfire=!!i.fire;this.paim=!!i.aim;
    if(_msgT>0){_msgT-=dt;if(_msgT<=0)hudMsg('');}
    this.pCd=Math.max(0,this.pCd-dt);this.shootAnim=Math.max(0,this.shootAnim-dt);
    if(this.pause>0){this.pause-=dt;}
    const active=this.pause<=0&&b.st!=='dead';
    // joueur
    let mx=i.x,mz=i.y,mm=Math.hypot(mx,mz);
    const spd=(i.run?6.0:4.5);
    if(active||this.pause<1.0){
      if(mm>0.1){mx/=mm;mz/=mm;pl.x+=mx*spd*dt*Math.min(1,mm);pl.z+=mz*spd*dt*Math.min(1,mm);pl.h=Math.atan2(mx,mz);pl.wk+=dt*spd*1.6;}
    }
    pl.x=clp(pl.x,-7,7);pl.z=clp(pl.z,-6,8);
    const hasP=b.st==='held'&&b.own==='pl',hasA=b.st==='held'&&b.own==='ai';
    if(hasP&&active){
      if(fireEdgeDown){this.charging=true;this.charge=0;}
      if(this.charging){this.charge+=dt;const mtr=Math.abs(Math.sin(this.charge*3.6));hudBar(mtr);this.mtr=mtr;pl.h=Math.atan2(this.rim.x-pl.x,this.rim.z-pl.z);}
      if(this.charging&&fireEdgeUp){this.charging=false;hudBar(null);this.shoot('pl',this.mtr||0.4);}
    }else if(!hasP){this.charging=false;hudBar(null);}
    // vol de balle par le joueur
    if(hasA&&aimEdge&&this.dist(pl,ai)<1.6&&this.pCd<=0){this.pCd=0.8;if(Math.random()<0.5+0.1*(1-this.diff*0.5)){b.own='pl';hudMsg('Ballon volé !',1);playTone(520,0.1,'square',0.04);}else hudMsg('Raté !',0.8);}
    // IA
    if(active){
      const toward=(tx,tz,sp)=>{const dx=tx-ai.x,dz=tz-ai.z,d=Math.hypot(dx,dz);if(d>0.12){ai.x+=dx/d*Math.min(d,sp*dt);ai.z+=dz/d*Math.min(d,sp*dt);ai.h=Math.atan2(dx,dz);ai.wk+=dt*sp*1.6;}};
      const sp=3.9+this.diff*0.55;
      if(hasA){
        this.aiPick-=dt;if(this.aiPick<=0){this.aiPick=rr(1.3,2.4);const a=rr(0,Math.PI)+Math.PI;const r=this.diff===0?rr(2.0,4.0):rr(3.4,6.2);this.aiGoal={x:clp(Math.cos(a)*r*0.9,-5.5,5.5),z:clp(this.rim.z+Math.abs(Math.sin(a))*r+1,-5,5)};}
        let gx=this.aiGoal.x,gz=this.aiGoal.z;
        if(this.dist(ai,pl)<1.3){const px=ai.x-pl.x,pz=ai.z-pl.z,pd=Math.hypot(px,pz)||1;gx=ai.x+px/pd*2+(-pz/pd)*1.5;gz=ai.z+pz/pd*2+(px/pd)*1.5;}
        toward(gx,gz,sp);
        this.aiShoot-=dt;
        const dr=this.dist(ai,this.rim);
        if(this.aiShoot<=0&&dr<7.4){this.shoot('ai',rr(0.35,0.95));this.aiShoot=rr(1.4,2.6)/(1+this.diff*0.15);}
        else if(this.aiShoot<=0)this.aiShoot=0.3;
      }else if(hasP){
        const dx=this.rim.x-pl.x,dz=this.rim.z-pl.z,d=Math.hypot(dx,dz)||1;
        toward(pl.x+dx/d*1.1,pl.z+dz/d*1.1,sp+0.3);
        if(this.dist(ai,pl)<1.25){this.stealT-=dt;if(this.stealT<=0){this.stealT=rr(0.7,1.3)/(0.7+this.diff*0.5);if(Math.random()<[0.16,0.26,0.4][this.diff]&&!this.charging){b.own='ai';hudMsg('Ballon perdu !',1);playTone(200,0.15,'square',0.04);}}}
      }else if(b.st==='free'&&b.shooter==='pl'){toward(this.rim.x+rr(-0.5,0.5),this.rim.z+1.5,sp);}
      else if(b.st==='free'){toward(b.x,b.z,sp);}
    }
    ai.x=clp(ai.x,-7,7);ai.z=clp(ai.z,-6,8);
    // balle
    if(b.st==='held'){
      const h=b.own==='pl'?pl:ai;
      const dribble=0.18+Math.abs(Math.sin(this.t*7+(b.own==='ai'?1:0)))*0.85;
      b.x=h.x+Math.sin(h.h)*0.42;b.z=h.z+Math.cos(h.h)*0.42;b.y=this.charging&&b.own==='pl'?2.2:dribble;
    }else if(b.st==='free'){
      b.freeT+=dt;b.prev=b.y;
      b.vy-=9.8*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
      if(b.y<0.12){b.y=0.12;b.vy=Math.abs(b.vy)*0.72;b.vx*=0.93;b.vz*=0.93;if(b.vy<1.0)b.vy=0;}
      if(b.z<-6.35&&b.vz<0&&Math.abs(b.x)<0.95&&b.y>2.75&&b.y<4.0){b.z=-6.35;b.vz=-b.vz*0.5;}
      const rx=b.x-this.rim.x,rz=b.z-this.rim.z,rd=Math.hypot(rx,rz);
      if(b.vy<0&&b.prev>3.05&&b.y<=3.05&&rd<0.22&&b.shooter){this.scoreBasket(b.shooter);}
      else if(Math.abs(rd-0.24)<0.09&&Math.abs(b.y-3.05)<0.1){b.vy=Math.abs(b.vy)*0.45;b.vx+=rr(-1.4,1.4);b.vz+=rr(-0.8,1.6);playTone(700,0.05,'square',0.03);}
      if(Math.abs(b.x)>8.4){b.x=clp(b.x,-8.4,8.4);b.vx*=-0.5;}if(b.z>8.6||b.z<-7.4){b.z=clp(b.z,-7.4,8.6);b.vz*=-0.5;}
      // récupération
      if(b.st==='free'&&b.freeT>0.7&&b.y<2.0){
        const dp=this.dist(pl,b),da=this.dist(ai,b);
        if(Math.min(dp,da)<0.85){b.own=dp<=da?'pl':'ai';b.st='held';b.shooter=null;}
      }
      if(b.st==='free'&&b.freeT>6){b.own=this.dist(pl,b)<this.dist(ai,b)?'pl':'ai';b.st='held';}
    }
    this.draw(dt);
  }
  draw(dt){
    const pl=this.pl,ai=this.ai,b=this.b;
    for(const[a,isP]of[[pl,1],[ai,0]]){
      a.m.position.set(BA.x+a.x,0,BA.z+a.z);a.m.rotation.y=a.h;
      const moving=isP?(Math.hypot(this.pfire?0:0)||1):1;
      swingLimbs(a.m,a.wk,0.5,false,'walk');
      const sh=(isP&&this.charging)||(this.shootAnim>0&&this.lastShotWho===(isP?'pl':'ai'));
      if(sh){a.m.userData.armL.rotation.x=-2.7;a.m.userData.armR.rotation.x=-2.7;a.m.position.y=sh?Math.max(0,Math.sin(this.shootAnim*6))*0.35:0;}
    }
    this.ball.position.set(BA.x+b.x,b.y,BA.z+b.z);
    const cxx=BA.x+(pl.x+ai.x)*0.15,tz=BA.z+(pl.z+ai.z)*0.25;
    this.cam.set(cxx,6.6,BA.z+9.2+pl.z*0.1);
    cam.position.lerp(this.cam,Math.min(1,dt*3));cam.fov=54;cam.updateProjectionMatrix();
    cam.lookAt(BA.x+(pl.x+ai.x)*0.2,1.4,BA.z-1.4);
  }
  dispose(){scene.remove(this.pl.m);scene.remove(this.ai.m);scene.remove(this.ball);}
  finish(win,forfeit){endMG(this,win,forfeit);}
}

// ---------------------------------------------------------------- TENNIS
const TE={x:14000,z:15000};
function tennisArena(){
  if(arenaCache.tennis)return;
  const g=new THREE.Group();scene.add(g);
  B3(g,70,0.2,80,mt(0x2f5d3a,0.95,0),TE.x,-0.12,TE.z);
  const ct=new THREE.Mesh(new THREE.PlaneGeometry(11,24),new THREE.MeshStandardMaterial({map:TX.tennis(),roughness:0.7}));ct.rotation.x=-Math.PI/2;ct.position.set(TE.x,0.02,TE.z);ct.receiveShadow=true;g.add(ct);
  B3(g,11.2,0.9,0.05,EMI(0xe5e7eb),TE.x,0.47,TE.z);B3(g,11.2,0.06,0.07,EMI(0xffffff),TE.x,0.93,TE.z);
  for(const s of[-1,1])B3(g,0.1,1.1,0.1,M.black,TE.x+s*5.6,0.56,TE.z);
  B3(g,0.6,0.5,2.0,M.green,TE.x-8,0.5,TE.z);B3(g,0.12,2.2,0.12,M.chrome,TE.x-8,1.4,TE.z-3);   // chaise d'arbitre
  for(const s of[-1,1])for(let k=0;k<12;k++)B3(g,0.3,0.7+(k%3)*0.1,2.2,mt(0x1e3a5f,0.9,0),TE.x+s*9.5,0.5,TE.z-12+k*2.2);
  for(const s of[-1,1])B3(g,0.4,3,26,mt(0x14532d,0.9,0),TE.x+s*8.6,1.5,TE.z);
  B3(g,18,3,0.4,mt(0x14532d,0.9,0),TE.x,1.5,TE.z-13);B3(g,18,3,0.4,mt(0x14532d,0.9,0),TE.x,1.5,TE.z+13);
  arenaCache.tennis=g;
}
const TEN_PTS=['0','15','30','40'];
class Tennis{
  constructor(o){
    this.o=o;tennisArena();this.kind='tennis';this.diff=o.diff||0;
    this.pl={x:0,z:10.5,wk:0,h:Math.PI,m:athlete(0xf8fafc,0x7b5438)};this.ai={x:0,z:-10.5,wk:0,h:0,m:athlete(0xfacc15,0x6f4e37)};
    addRacket(this.pl.m);addRacket(this.ai.m);
    this.ball=mkBall(0.12,0xd8f23a);
    this.b={x:0,y:1,z:10,vx:0,vy:0,vz:0};this.pts=[0,0];this.games=[0,0];this.server='pl';this.state='serve';this.t=0;this.pause=1.0;
    this.last=null;this.bounces=0;this.serveStage=0;this.fault=0;this.swing={pl:0,ai:0};this.hitBuf=0;this.pfire=false;this.over=false;this.rallyT=0;this.serveT=0;this.aiRe=0;this.aiTarget=0;this.firstBounceChecked=false;
    this.cam=new THREE.Vector3(TE.x,8.2,TE.z+19.5);
    this.setupServe();this.refreshHud();hudMsg('FEU : servir / frapper. Joystick : viser. VISER : lob.',5);
  }
  refreshHud(){
    const [a,b]=this.pts;let s;
    if(a>=3&&b>=3){s=a===b?'40-40':(a>b?'Av.Toi':'Av.IA');}else s=`${TEN_PTS[Math.min(3,a)]}-${TEN_PTS[Math.min(3,b)]}`;
    hudScore(`Jeux ${this.games[0]}–${this.games[1]}  ·  ${s}`);
  }
  setupServe(){
    this.state='serve';this.serveStage=0;this.fault=0;this.last=null;this.bounces=0;this.serveT=0;
    const s=this.server==='pl'?this.pl:this.ai;
    const side=((this.pts[0]+this.pts[1])%2===0)?1:-1;
    s.x=side*1.6;s.z=this.server==='pl'?10.8:-10.8;
    const o=this.server==='pl'?this.ai:this.pl;o.x=-side*1.5;o.z=this.server==='pl'?-10.5:10.5;
    this.b.x=s.x+0.3;this.b.y=1.1;this.b.z=s.z+(this.server==='pl'?-0.4:0.4);this.b.vx=this.b.vy=this.b.vz=0;
    this.serveSide=side;this.serveDelay=this.server==='ai'?rr(1.0,1.6):0;
  }
  point(winner,why){
    this.pts[winner==='pl'?0:1]++;
    const [a,b]=this.pts;let gameWin=null;
    if(a>=4&&a-b>=2)gameWin='pl';else if(b>=4&&b-a>=2)gameWin='ai';
    hudMsg((winner==='pl'?'Point pour toi · ':'Point IA · ')+why,1.6);
    this.state='over';this.pause=1.7;playTone(winner==='pl'?780:300,0.2,'sine',0.05);
    if(gameWin){
      this.games[gameWin==='pl'?0:1]++;this.pts=[0,0];this.server=this.server==='pl'?'ai':'pl';
      hudMsg(gameWin==='pl'?'JEU pour toi !':'Jeu pour l’IA',2);
      if(this.games[0]>=3||this.games[1]>=3){this.over=true;this.refreshHud();setTimeout(()=>{if(MG.active===this)this.finish(this.games[0]>this.games[1]);},1600);return;}
    }
    this.refreshHud();
  }
  // lance la balle depuis (x,y,z) pour qu'elle retombe en (tx,tz) en T secondes
  launch(x,y,z,tx,tz,T,netOk){
    const b=this.b;b.x=x;b.y=y;b.z=z;b.vx=(tx-x)/T;b.vz=(tz-z)/T;b.vy=(0.12-y+0.5*9.8*T*T)/T;
    const tn=T*(0-z)/((tz-z)||1);
    if(tn>0&&tn<T){const yn=y+b.vy*tn-0.5*9.8*tn*tn;if(yn<1.05&&netOk){b.vy+=(1.12-yn)/tn;}}
  }
  hitBall(who,aimX,lob){
    const b=this.b,s=who==='pl'?this.pl:this.ai,dir=who==='pl'?-1:1;
    const reach=Math.hypot(b.x-s.x,b.z-s.z);
    let sig=0.28+reach*0.22;
    sig*=who==='ai'?[1.55,1.1,0.7][this.diff]:[0.8,1,1.15][this.diff];
    const tx=clp(aimX*3.6+randn()*sig,-5.2,5.2),depth=(lob?rr(6.5,8.6):rr(4.6,8.0));
    const tz=dir*(depth+randn()*sig*0.9);
    const T=lob?1.55:clp(0.82+Math.abs(tz-b.z)/30,0.88,1.25);
    this.launch(b.x,Math.max(0.5,b.y),b.z,tx,tz,T,Math.random()>0.05+sig*0.04);
    this.last=who;this.bounces=0;this.swing[who]=0.28;this.state='rally';this.rallyT=0;
    playTone(who==='pl'?520:430,0.07,'square',0.05);
  }
  serveHit(who){
    const s=who==='pl'?this.pl:this.ai,dir=who==='pl'?-1:1,sd=this.serveSide;
    const tx=-sd*rr(1.2,3.4)*(who==='pl'?1:1),tz=dir*rr(2.6,4.7);
    const faultCh=[0.07,0.14,0.2][this.diff]*(who==='ai'?1:0.6);
    let ttx=tx,ttz=tz;
    if(Math.random()<faultCh){ttz=dir*rr(5.6,7.2);}
    this.launch(s.x,2.4,s.z,ttx,ttz,0.78,true);
    this.last=who;this.bounces=0;this.serveStage=2;this.state='rally';this.rallyT=0;this.swing[who]=0.3;playTone(660,0.1,'sawtooth',0.04);
    this.firstServe=true;
  }
  update(dt,i){
    this.t+=dt;if(this.over)return;
    const pl=this.pl,ai=this.ai,b=this.b;
    if(_msgT>0){_msgT-=dt;if(_msgT<=0)hudMsg('');}
    const fe=i.fire&&!this.pfire;this.pfire=!!i.fire;
    if(fe)this.hitBuf=0.22;this.hitBuf=Math.max(0,this.hitBuf-dt);
    this.swing.pl=Math.max(0,this.swing.pl-dt);this.swing.ai=Math.max(0,this.swing.ai-dt);
    // déplacement joueur
    const spd=i.run?8.6:6.8;
    if(this.state!=='over'){
      pl.x=clp(pl.x+i.x*spd*dt,-5.2,5.2);pl.z=clp(pl.z+i.y*spd*0.7*dt,7.2,13);
      if(Math.hypot(i.x,i.y)>0.1){pl.wk+=dt*spd*1.5;}
    }
    pl.h=Math.PI;ai.h=0;
    // IA
    if(this.state==='rally'||this.state==='serve'){
      const sp=5.6+this.diff*0.9;
      let tx=0;
      if(this.state==='rally'&&b.vz<0&&this.last==='pl'){
        const tt=Math.max(0,(ai.z-b.z)/(b.vz||-1));this.aiTarget=clp(b.x+b.vx*tt*0.92+this.aiNoise(),-5.2,5.2);
      }else if(this.state==='serve'||this.last==='ai'){this.aiTarget=ai.x*0.9;}
      tx=this.aiTarget;
      const dx=tx-ai.x;ai.x+=clp(dx,-sp*dt,sp*dt);
      if(Math.abs(dx)>0.3)ai.wk+=dt*sp*1.5;
      ai.z+=clp((-10.5-ai.z),-3*dt,3*dt);
    }
    if(this.state==='serve'){
      this.serveT+=dt;
      if(this.server==='pl'){
        hudMsg(this.serveStage===0&&this.serveT>0.5?'Appuie sur FEU pour servir':'',0);
        if(this.serveStage===0&&fe&&this.serveT>0.4){this.serveStage=1;this.tossT=0;b.vy=5.3;b.vx=b.vz=0;}
        if(this.serveStage===1){this.tossT+=dt;b.vy-=9.8*dt;b.y+=b.vy*dt;b.x=pl.x+0.3;b.z=pl.z-0.3;if(this.tossT>0.52)this.serveHit('pl');}
        else if(this.serveStage===0){b.x=pl.x+0.3;b.y=1.1+Math.sin(this.t*4)*0.05;b.z=pl.z-0.4;}
      }else{
        this.serveDelay-=dt;
        if(this.serveStage===0&&this.serveDelay<=0){this.serveStage=1;this.tossT=0;b.vy=5.3;b.vx=b.vz=0;}
        if(this.serveStage===1){this.tossT+=dt;b.vy-=9.8*dt;b.y+=b.vy*dt;b.x=ai.x+0.3;b.z=ai.z+0.3;if(this.tossT>0.52)this.serveHit('ai');}
        else{b.x=ai.x+0.3;b.y=1.1;b.z=ai.z+0.4;}
      }
    }else if(this.state==='rally'){
      this.rallyT+=dt;
      b.vy-=9.8*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;const pz=b.z;b.z+=b.vz*dt;
      // filet
      if((pz<0&&b.z>=0||pz>0&&b.z<=0)&&b.y<0.914&&this.state==='rally'){
        this.state='over';const loser=this.last;this.point(loser==='pl'?'ai':'pl','dans le filet');b.vx=b.vz=0;
      }
      // rebond
      if(this.state==='rally'&&b.y<=0.12&&b.vy<0){
        b.y=0.12;b.vy=-b.vy*0.74;b.vx*=0.9;b.vz*=0.9;
        const side=b.z<0?'ai':'pl',inb=Math.abs(b.x)<=4.1&&Math.abs(b.z)<=9.25;
        const lastOwn=(this.last==='pl'&&side==='pl')||(this.last==='ai'&&side==='ai');
        playTone(260,0.05,'sine',0.03);
        if(this.firstServe){
          this.firstServe=false;
          const inBox=inb&&Math.abs(b.z)<=5.2&&!lastOwn;
          if(!inBox){
            this.fault++;
            if(this.fault>=2){this.point(this.last==='pl'?'ai':'pl','double faute');}
            else{hudMsg('Faute ! Deuxième service',1.4);this.state='serve';this.serveStage=0;this.serveT=-0.3;this.serveDelay=0.8;const s=this.server==='pl'?pl:ai;this.b.x=s.x+0.3;this.b.y=1.1;this.b.z=s.z+(this.server==='pl'?-0.4:0.4);this.b.vx=this.b.vy=this.b.vz=0;}
            this.draw(dt);return;
          }
          this.bounces=1;
        }else if(!inb){this.point(this.last==='pl'?'ai':'pl','balle sortie');}
        else if(lastOwn){this.point(this.last==='pl'?'ai':'pl','balle courte');}
        else{this.bounces++;if(this.bounces>=2){this.point(this.last,this.last==='pl'?'l’IA n’a pas renvoyé':'tu n’as pas renvoyé');}}
      }
      // frappe joueur
      if(this.state==='rally'&&this.last==='ai'&&this.bounces<=1&&this.hitBuf>0&&b.vz>0&&b.y<2.7&&b.y>0.12){
        const d=Math.hypot(b.x-pl.x,b.z-pl.z);
        if(d<2.3){this.hitBall('pl',i.x,!!i.aim);this.hitBuf=0;this.aiNoiseV=rr(-1,1);}
      }
      // frappe IA
      if(this.state==='rally'&&this.last==='pl'&&b.vz<0&&b.z<ai.z+1.8&&b.y<2.7&&this.bounces>=1||(this.state==='rally'&&this.last==='pl'&&b.vz<0&&b.z<ai.z+0.9&&b.y<2.6)){
        const d=Math.hypot(b.x-ai.x,b.z-ai.z);
        const chance=d<1.0?0.96:d<1.8?[0.55,0.72,0.88][this.diff]:0.0;
        if(d<2.2&&Math.random()<chance*dt*14){this.hitBall('ai',clp(-pl.x*0.2+rr(-1,1),-1,1),Math.random()<0.1);}
      }
      if(this.state==='rally'&&(Math.abs(b.z)>16||Math.abs(b.x)>12||this.rallyT>14)){this.point(this.bounces>0?this.last:(this.last==='pl'?'ai':'pl'),'fin de l’échange');}
    }else if(this.state==='over'){
      this.pause-=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.vy-=9.8*dt;b.y=Math.max(0.12,b.y+b.vy*dt);if(b.y<=0.12)b.vy=Math.abs(b.vy)*0.5;
      if(this.pause<=0&&!this.over)this.setupServe();
    }
    this.draw(dt);
  }
  aiNoise(){return (this.aiNoiseV||0)*[1.0,0.6,0.3][this.diff];}
  draw(dt){
    const pl=this.pl,ai=this.ai,b=this.b;
    for(const[a,k]of[[pl,'pl'],[ai,'ai']]){
      a.m.position.set(TE.x+a.x,0,TE.z+a.z);a.m.rotation.y=a.h;
      swingLimbs(a.m,a.wk,0.4,false,'walk');
      if(this.swing[k]>0){const f=1-this.swing[k]/0.3;a.m.userData.armR.rotation.x=-2.4+f*2.2;a.m.userData.armR.rotation.z=-0.3;a.m.rotation.y=a.h+(k==='pl'?-1:1)*0.5*(1-f);}
    }
    this.ball.position.set(TE.x+b.x,b.y,TE.z+b.z);
    this.cam.set(TE.x+pl.x*0.35,8.0,TE.z+19.2);cam.position.lerp(this.cam,Math.min(1,dt*3));cam.fov=52;cam.updateProjectionMatrix();
    cam.lookAt(TE.x+pl.x*0.15,0.5,TE.z-2.5);
  }
  dispose(){scene.remove(this.pl.m);scene.remove(this.ai.m);scene.remove(this.ball);}
  finish(win,forfeit){endMG(this,win,forfeit);}
}

// ---------------------------------------------------------------- TIRS AU BUT
const PE={x:14000,z:16000};
function penaltyArena(){
  if(arenaCache.pen)return;
  const g=new THREE.Group();scene.add(g);
  const pt=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({map:TX.pitch(),roughness:0.95}));pt.rotation.x=-Math.PI/2;pt.position.set(PE.x,0.01,PE.z-4);pt.receiveShadow=true;g.add(pt);
  B3(g,80,0.2,80,mt(0x1f5f31,0.95,0),PE.x,-0.12,PE.z);
  const gz=PE.z-7;
  for(const s of[-1,1])B3(g,0.14,2.45,0.14,M.white,PE.x+s*3.3,1.22,gz);
  B3(g,6.8,0.14,0.14,M.white,PE.x,2.42,gz);
  for(let k=-6;k<=6;k++)B3(g,0.02,2.4,1.6,EMI(0xe5e7eb),PE.x+k*0.5,1.2,gz-0.85);
  B3(g,6.6,2.4,0.02,EMI(0xe5e7eb),PE.x,1.2,gz-1.65);
  for(let s=-1;s<=1;s+=2)for(let k=0;k<10;k++)B3(g,0.4,0.7+(k%2)*0.2,2.0,mt(k%2?0x1d4ed8:0xdc2626,0.9,0),PE.x+s*10+s*(k*0.2),0.4,PE.z-12+k*2.2);
  for(let k=0;k<3;k++)chandelier(g,PE.x-8+k*8,9,PE.z-4,1.3);
  arenaCache.pen=g;
}
class Penalty{
  constructor(o){
    this.o=o;penaltyArena();this.kind='penalty';this.diff=o.diff||0;
    this.sh=athlete(0xdc2626,0x7b5438);this.kp=athlete(0x16a34a,0x6f4e37);
    this.ball=mkBall(0.13,0xffffff);
    this.round=0;this.sc=[0,0];this.turn='pl';this.phase='aim';this.t=0;this.ph=0;this.aimX=0;this.aimY=1.0;this.power=0;this.charging=false;this.pfire=false;this.over=false;
    this.tgt={x:0,y:1};this.flight=0;this.res='';this.dive={x:0,y:0.5,t:0};this.kdx=0;this.kdy=0;this.kT=0;this.aiTgt=null;this.pDive={x:0,y:0.5};this.lastFire=-9;
    this.gz=PE.z-7;this.spot=PE.z+2.5;this.cam=new THREE.Vector3(PE.x,1.9,PE.z+6.8);
    this.reticle=new THREE.Mesh(new THREE.RingGeometry(0.16,0.24,18),new THREE.MeshBasicMaterial({color:0xfde047,side:THREE.DoubleSide,transparent:true,opacity:0.9}));scene.add(this.reticle);
    this.startRound();
  }
  hud(){hudScore(`⚽ Toi ${this.sc[0]} – ${this.sc[1]} IA · Tir ${Math.min(5,Math.floor(this.round/2)+1)}/5 · ${this.turn==='pl'?'Tu tires':'Tu gardes'}`);}
  startRound(){
    this.phase=this.turn==='pl'?'aim':'defend';this.t=0;this.charging=false;this.power=0;hudBar(null);
    this.ball.position.set(PE.x,0.13,this.spot);
    this.kp.position.set(PE.x,0,this.gz+0.3);this.kp.rotation.set(0,0,0);this.kp.rotation.y=0;
    this.sh.position.set(PE.x-1.2,0,this.spot+1.8);this.sh.rotation.y=Math.PI;
    this.kdx=0;this.kdy=0;this.kT=0;this.dive.t=0;this.aimX=0;this.aimY=1.0;this.pDive={x:0,y:0.5};
    this.hud();
    if(this.turn==='ai'){this.aiTgt={x:rr(-2.7,2.7),y:rr(0.2,2.1)};hudMsg('Choisis ton plongeon (joystick) et appuie sur FEU juste au tir !',3);}
    else hudMsg('Vise (joystick), maintiens FEU, relâche vers 70 % de puissance.',3);
  }
  resolve(tx,ty,keeperX,keeperY,dived,shooter){
    const inFrame=Math.abs(tx)<=3.15&&ty>=0&&ty<=2.35;
    let r='';
    if(!inFrame)r=(Math.abs(Math.abs(tx)-3.3)<0.25||Math.abs(ty-2.42)<0.2)?'poteau !':'à côté !';
    else if(dived){
      const cover=Math.abs(keeperX-tx)<1.05&&(Math.abs(keeperY-ty)<0.95);
      if(cover&&Math.random()<0.92)r='arrêt !';else r='but !';
    }else{r=Math.abs(tx)<0.55&&Math.abs(ty-1.0)<0.6?'arrêt !':'but !';}
    return r;
  }
  update(dt,i){
    this.t+=dt;if(this.over)return;
    if(_msgT>0){_msgT-=dt;if(_msgT<=0)hudMsg('');}
    const fe=i.fire&&!this.pfire,fu=!i.fire&&this.pfire;this.pfire=!!i.fire;
    if(i.fire)this.lastFire=this.t;
    this.sh.position.x+= (PE.x-1.2-this.sh.position.x)*dt*0;
    if(this.phase==='aim'){
      this.aimX=clp(this.aimX+i.x*3.4*dt,-3.4,3.4);this.aimY=clp(this.aimY-i.y*2.2*dt,0.1,2.6);
      this.reticle.visible=true;this.reticle.position.set(PE.x+this.aimX,this.aimY,this.gz+0.05);
      if(fe){this.charging=true;this.power=0;this.pt=0;}
      if(this.charging){this.pt+=dt;this.power=Math.abs(Math.sin(this.pt*2.1));hudBar(this.power);}
      if(this.charging&&fu){
        this.charging=false;hudBar(null);
        const err=0.2+Math.abs(this.power-0.72)*1.5;const k=[0.75,1,1.25][this.diff];
        this.tgt={x:this.aimX+randn()*err*k,y:this.aimY+randn()*err*0.6*k};
        // gardien IA : lit le tir avec une probabilité dépendante de la difficulté
        const read=[0.25,0.42,0.6][this.diff];
        let gx=Math.random()<read?Math.sign(this.tgt.x)*rr(1.2,2.4):[-2.1,0,2.1][R3()];
        let gy=Math.random()<read?(this.tgt.y>1.2?1.7:0.5):(Math.random()<0.5?0.5:1.7);
        this.dive={x:gx,y:gy,t:0};this.kdx=gx;this.kdy=gy;this.phase='fly';this.flight=0;this.reticle.visible=false;playTone(220,0.12,'square',0.06);
        this.diving=true;
      }
    }else if(this.phase==='defend'){
      this.pDive.x=clp(i.x*2.5,-2.6,2.6);this.pDive.y=i.y<-0.35?1.7:0.5;
      if(this.t>1.5&&!this.shot){this.shot=true;this.tgt=this.aiTgt;this.phase='fly';this.flight=0;
        const pressed=(this.t-this.lastFire)<0.4;
        this.dive={x:pressed?this.pDive.x:0,y:pressed?this.pDive.y:0.9,t:0};this.diving=pressed;this.kdx=this.dive.x;this.kdy=this.dive.y;playTone(220,0.12,'square',0.06);}
    }else if(this.phase==='fly'){
      this.flight+=dt;const f=clp(this.flight/0.55,0,1);
      const bx0=PE.x,bz0=this.spot,bx1=PE.x+this.tgt.x,bz1=this.gz,by1=this.tgt.y;
      this.ball.position.set(bx0+(bx1-bx0)*f,0.13+(by1-0.13)*f+Math.sin(f*Math.PI)*0.55,bz0+(bz1-bz0)*f);
      if(this.diving){this.dive.t=clp(this.flight/0.4,0,1);}
      if(this.flight>=0.55){
        const shooter=this.turn,res=this.resolve(this.tgt.x,this.tgt.y,this.dive.x,this.dive.y,this.diving,shooter);
        const goal=res==='but !';
        if(goal)this.sc[shooter==='pl'?0:1]++;
        hudMsg((goal?'⚽ ':'🧤 ')+(goal?'BUT !':res.toUpperCase()),1.6);playTone(goal?880:260,0.3,'sine',0.06);
        this.phase='result';this.t=0;this.shot=false;
      }
    }else if(this.phase==='result'){
      if(this.t>1.8){
        this.round++;this.turn=this.turn==='pl'?'ai':'pl';
        const done=Math.floor(this.round/2),a=this.sc[0],b=this.sc[1];
        if(this.round%2===0){   // manche complète
          const rem=5-done;
          if(done>=5&&a!==b){this.over=true;this.finish(a>b);return;}
          if(done<5&&(a>b+rem||b>a+rem)){this.over=true;this.finish(a>b);return;}
        }else if(Math.floor(this.round/2)<5){
          const remPl=5-Math.ceil(this.round/2),remAi=5-Math.floor(this.round/2);
          if(a>b+remAi){this.over=true;this.finish(true);return;}
          if(b>a+remPl){this.over=true;this.finish(false);return;}
        }
        this.startRound();
      }
    }
    this.draw(dt);
  }
  draw(dt){
    const kp=this.kp,sh=this.sh;
    // gardien : plongeon
    const t=this.diving&&this.phase==='fly'?this.dive.t:(this.phase==='result'?1:0);
    if(this.phase==='result'||this.phase==='fly'){
      const e=this.diving?t:0;kp.position.set(PE.x+this.kdx*e,this.kdy>1.2?0.35*e:0,this.gz+0.3);kp.rotation.z=-Math.sign(this.kdx||1)*1.2*e*(Math.abs(this.kdx)>0.6?1:0.2);
      kp.userData.armL.rotation.x=-2.6*e;kp.userData.armR.rotation.x=-2.6*e;
    }else{kp.position.set(PE.x+Math.sin(this.t*3)*0.35,0,this.gz+0.3);kp.rotation.z=0;swingLimbs(kp,this.t*3,0.2,false,'walk');}
    if(this.phase==='aim'||this.phase==='defend'){sh.position.set(PE.x-1.2,0,this.spot+1.6);sh.rotation.y=Math.PI;}
    else if(this.phase==='fly'){const f=clp(this.flight/0.25,0,1);sh.position.set(PE.x-1.2+1.1*f,0,this.spot+1.6-1.5*f);swingLimbs(sh,this.flight*10,0.6,true,'walk');}
    cam.position.lerp(this.cam,Math.min(1,dt*3));cam.fov=50;cam.updateProjectionMatrix();cam.lookAt(PE.x,1.3,this.gz);
  }
  dispose(){scene.remove(this.sh);scene.remove(this.kp);scene.remove(this.ball);scene.remove(this.reticle);}
  finish(win,forfeit){endMG(this,win,forfeit);}
}
const R3=()=>Math.floor(Math.random()*3);

// ---------------------------------------------------------------- GESTION COMMUNE
const SPORT_INFO={
  basket:{t:'🏀 Basket 1 contre 1',fee:200,win:500,d:'Premier à 11 points. Maintiens FEU, relâche au sommet de la jauge. VISER : voler le ballon.'},
  tennis:{t:'🎾 Tennis',fee:300,win:700,d:'Premier à 3 jeux. FEU : servir / frapper quand la balle est proche. Joystick : viser. VISER : lob.'},
  penalty:{t:'⚽ Tirs au but',fee:150,win:350,d:'5 tirs chacun. Tir : joystick pour viser, maintiens FEU et relâche vers 70 %. Défense : joystick + FEU au moment du tir.'}
};
function sportMenu(kind,home){
  const I=SPORT_INFO[kind],fee=home?0:I.fee;
  const rows=[['😊','Facile',1,0],['😐','Normal',1.6,1],['🔥','Pro',2.6,2]];
  openModal(`<h2>${I.t}</h2><div class="sub">${I.d}</div>
    <div class="sub">${home?'Entraînement dans ton domaine : gratuit, sans gain.':`Mise : <b style="color:#fde047">${fee} FCFA</b> · Tu as ${fmt(P.cash)} FCFA`}</div>
    ${rows.map(r=>`<div class="row"><div><b>${r[0]} ${r[1]}</b><small>${home?'Pour le plaisir':'Gain : '+fmt(Math.round(I.win*r[2]))+' FCFA'}</small></div><button data-d="${r[3]}" ${P.cash>=fee?'':'disabled'}>Jouer</button></div>`).join('')}
    <div class="foot"><button class="sec" id="ex-no">Plus tard</button></div>`,
    c=>{c.querySelector('#ex-no').onclick=closeModal;c.querySelectorAll('button[data-d]').forEach(b=>b.onclick=()=>{
      const d=+b.dataset.d;closeModal();startMG(kind,{diff:d,fee:fee,prize:home?0:Math.round(I.win*rows[d][2]),home});});});
}
function startMG(kind,o){
  if(MG.active)return;
  if(P.cash<o.fee){showToast('Pas assez d’argent.');return;}
  P.cash-=o.fee;writeSave();
  P.m.visible=false;
  MG.active=kind==='basket'?new Basket(o):kind==='tennis'?new Tennis(o):new Penalty(o);
  MG.opts=o;MG.kindName=kind;
  mgHud.style.display='block';mgQuit.style.display='block';
  cam.position.set(MG.active.cam.x,MG.active.cam.y,MG.active.cam.z);
}
function endMG(g,win,forfeit){
  if(MG.active!==g)return;
  MG.active=null;g.dispose();mgHud.style.display='none';mgQuit.style.display='none';hudBar(null);hudMsg('');
  P.m.visible=!P.car;
  const o=MG.opts||{};
  if(forfeit){showToast('Match abandonné.');stat('sportL');writeSave();return;}
  if(win){stat('sportW');if(o.prize){P.cash+=o.prize;stat('earned',o.prize);}playTone(880,0.4,'sine',0.07);}else{stat('sportL');playTone(220,0.4,'sawtooth',0.05);}
  writeSave();
  openModal(`<h2>${win?'🏆 Victoire !':'😔 Défaite'}</h2><div class="sub">${win?(o.prize?`Tu empoches <b style="color:#fde047">${fmt(o.prize)} FCFA</b>.`:'Belle victoire à l’entraînement !'):'L’IA était plus forte cette fois.'}</div>
    <div class="foot"><button class="sec" id="ex-no">Terminer</button><button id="ex-again">Rejouer</button></div>`,
    c=>{c.querySelector('#ex-no').onclick=closeModal;c.querySelector('#ex-again').onclick=()=>{closeModal();sportMenu(MG.kindName,!!o.home);};});
}
mgQuit.onclick=()=>{if(MG.active)MG.active.finish(false,true);};

// =====================================================================
//  AÉROPORT : avions garés, sécurité, vol (arcade) · JETPACK · EAU VIVANTE
// =====================================================================
const planes=[];
const PLANE_SPOTS=[{x:62,z:41,k:'prop'},{x:102,z:41,k:'prop'},{x:142,z:41,k:'prop'},{x:190,z:41,k:'jet'}];
function mkPlane(sp){
  const m=buildPlaneMesh(sp.k);m.rotation.order='YXZ';m.position.set(sp.x,0,sp.z);m.rotation.y=Math.PI/2;scene.add(m);
  const p={isPlane:true,jet:sp.k==='jet',x:sp.x,z:sp.z,y:0,vy:0,h:Math.PI/2,v:0,pitch:0,roll:0,thr:0,hp:100,maxHp:100,vType:'plane',kind:'me',hasDriver:false,steerAngle:0,m:m,dead:0,home:sp,lv:0,revLock:0,smokeT:0};
  planes.push(p);return p;
}
for(const sp of PLANE_SPOTS)mkPlane(sp);
function nearPlane(){
  let best=null,bd=7.5;
  for(const p of planes){if(p.dead)continue;const d=Math.hypot(p.x-P.x,p.z-P.z);if(d<bd&&p.y<1){bd=d;best=p;}}
  return best;
}
function inAirport(x,z){return x>AIRPORT.x0&&x<AIRPORT.x1&&z>AIRPORT.z0&&z<AIRPORT.z1;}
let secT=0,secCd=0;
function airportSecurity(dt){
  if(SAVE.pass||interiorType||S!=='play')return;
  secCd=Math.max(0,secCd-dt);
  const px=P.car&&P.car.isPlane?P.car.x:P.x,pz=P.car&&P.car.isPlane?P.car.z:P.z;
  if(inAirport(px,pz)&&secCd<=0&&(!P.car||!P.car.isPlane||P.car.y<2)){
    secCd=40;addCrime(2);showToast('🚨 Zone interdite ! La sécurité de l’aéroport intervient.');
    for(let k=0;k<2&&copsOnFoot.length<6;k++){
      const cm=buildHuman(0x1e293b,0x6f4e37,'cop');cm.userData.gun.visible=true;
      copsOnFoot.push({m:cm,x:px+rr(-12,12),z:pz+rr(-8,8),h:0,hp:50,cd:rr(0.6,1.4),wk:0,isBir:false});
    }
  }
}
function boardPlane(p){
  if(P.car||P.enteringCar)return;
  if(!SAVE.pass&&inAirport(p.x,p.z)){addCrime(3);showToast('✈️ Avion volé ! Alerte maximale !');}
  else showToast('✈️ À bord. Gaz : bouton accélérer · Manche : joystick · Décolle vers 110 km/h.');
  P.car=p;P.m.visible=false;P.y=0;P.vy=0;p.thr=0.0;p.lv=p.v;
  updateControlUI();playTone(220,0.2,'square',0.05);
}
function crashPlane(c){
  showToast('💥 Crash !');
  const hx=c.x,hz=c.z;
  planes.splice(planes.indexOf(c),1);
  const home=c.home;
  explodeCar(c);damagePlayer(70);
  setTimeout(()=>mkPlane(home),90000);
}
function flyPlane(c,dt,i){
  const thrUp=B.gas||KB.ShiftLeft||KB.ShiftRight,thrDn=B.brake||KB.KeyX||KB.ControlLeft;
  c.thr=clp(c.thr+(thrUp?0.55:0)*dt-(thrDn?0.7:0)*dt,0,1);
  const stall=c.jet?38:27,rotV=c.jet?44:31;
  const acc=c.thr*(c.jet?28:19)-c.v*(c.jet?0.27:0.25)-(c.y<0.2?1.6:0)-Math.sin(c.pitch)*9.8*0.55;
  c.v=Math.max(0,c.v+acc*dt);
  const grounded=c.y<=0.06&&c.vy<=0.2;
  let vs=0;
  if(grounded){
    c.roll+=(0-c.roll)*Math.min(1,dt*6);
    if(c.v>0.6)c.h+=-i.x*0.85*Math.min(1,c.v/9)*dt*(c.v>rotV?0.4:1);
    const rot=c.v>rotV;
    const target=rot?clp(i.y,0,1)*0.5:0;
    c.pitch+=(target-c.pitch)*Math.min(1,dt*3.5);
    if(rot&&c.pitch>0.13){c.vy=1.2;c.y=0.1;}
  }
  if(!grounded){
    const stalled=c.v<stall*0.82;
    c.pitch+=(i.y*0.85)*dt;
    if(Math.abs(i.y)<0.12)c.pitch+=(0-c.pitch)*dt*0.28;
    if(stalled)c.pitch-=0.55*dt;
    c.pitch=clp(c.pitch,-0.85,0.85);
    c.roll+=(i.x*0.8-c.roll)*Math.min(1,dt*2.6);
    c.h+=-c.roll*1.15*dt*clp(c.v/45,0.25,1.3);
    vs=c.v*Math.sin(c.pitch)-(c.v<stall?(stall-c.v)*0.75:0);
    c.vy=vs;c.y+=vs*dt;
    if(c.y>300){c.y=300;}
    if(c.y<=0){
      const hard=vs<-7.5||Math.abs(c.roll)>0.4||c.pitch<-0.3;
      if(hard){crashPlane(c);return;}
      c.y=0;c.vy=0;c.pitch*=0.4;c.roll=0;
      if(c.v>8)showToast('🛬 Atterrissage réussi !');
    }
  }
  const nx=c.x+Math.sin(c.h)*c.v*Math.cos(c.pitch)*dt,nz=c.z+Math.cos(c.h)*c.v*Math.cos(c.pitch)*dt;
  const tmp={x:nx,z:nz};
  if(c.y<42){
    const hit=hitBuilding(tmp,c.jet?3.0:2.4);
    if(hit&&Math.hypot(tmp.x-nx,tmp.z-nz)>0.05){
      if(c.y>1.2){crashPlane(c);return;}
      c.v*=0.6;
    }
  }
  c.x=tmp.x;c.z=tmp.z;
  c.m.position.set(c.x,c.y,c.z);c.m.rotation.set(-c.pitch,c.h,c.roll);
  const pr=c.m.userData.prop;if(pr)pr.rotation.z+=dt*(8+c.thr*70);
  if(c.y>SAVE.stats.maxAlt)SAVE.stats.maxAlt=Math.round(c.y);
  c.steerAngle=-c.roll*0.5;
}
function flightCamera(dt){
  const c=P.car;if(!c||!c.isPlane||S!=='play')return;
  const back=13+c.v*0.1,tx=c.x-Math.sin(c.h)*back,tz=c.z-Math.cos(c.h)*back,ty=c.y+4.6-c.pitch*5;
  const k=Math.min(1,dt*5);
  cam.position.x+=(tx-cam.position.x)*k;cam.position.y+=(ty-cam.position.y)*k;cam.position.z+=(tz-cam.position.z)*k;
  cam.fov+=(68-cam.fov)*Math.min(1,dt*4);cam.updateProjectionMatrix();
  cam.lookAt(c.x+Math.sin(c.h)*12,c.y+1.2+c.pitch*9,c.z+Math.cos(c.h)*12);
  pill.style.display='block';
  pill.textContent=`✈️ ${Math.round(c.v*3.6)} km/h · ${Math.round(c.y)} m · gaz ${Math.round(c.thr*100)}%${c.y<=0.1&&c.v<2?' · Sortir : ACTION':''}`;
}

// ---------- JETPACK
let jetFuel=100,jetHeld=false,jetFx=0,flying=false;
function refreshJetBtn(){jetBtn.style.display=(SAVE.jet&&S==='play'&&!interiorType&&!P.car&&!P.enteringCar&&!MG.active)?'block':'none';}
jetBtn.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();jetHeld=true;jetBtn.classList.add('on');try{jetBtn.setPointerCapture(e.pointerId);}catch(_){}});
const jetUp=()=>{jetHeld=false;jetBtn.classList.remove('on');};
jetBtn.addEventListener('pointerup',jetUp);jetBtn.addEventListener('pointercancel',jetUp);jetBtn.addEventListener('lostpointercapture',jetUp);
function jetPre(dt){
  if(!SAVE.jet||interiorType||P.car||P.enteringCar||S!=='play'){flying=false;return;}
  const thrust=(jetHeld||KB.KeyC)&&jetFuel>0;
  if(thrust){
    P.vy=clp(P.vy+44*dt,-6,9.5);jetFuel=Math.max(0,jetFuel-24*dt);flying=true;
    jetFx-=dt;if(jetFx<=0){jetFx=0.045;trs.push({m:bx(0.3,0.3,0.3,rr(0,1)>0.5?0xfb923c:0xfde047,P.x+rr(-0.15,0.15),getGroundY(P.x,P.z,null)+P.y+0.1,P.z+rr(-0.15,0.15)),t:0.3,gr:1});}
    if(Math.random()<0.06)playTone(110,0.12,'sawtooth',0.03);
  }
  if(P.y<=0.05&&!thrust){jetFuel=Math.min(100,jetFuel+34*dt);flying=false;}
  if(P.y>70){P.y=70;if(P.vy>0)P.vy=0;}
}
function jetPost(dt,px,pz){
  if(!SAVE.jet||interiorType||P.car)return;
  if(P.y>0.5){P.x=px+(P.x-px)*1.55;P.z=pz+(P.z-pz)*1.55;hitBuilding(P,0.6);}
}
function jetHud(){
  if(!SAVE.jet||P.car||interiorType||S!=='play'){return;}
  if(P.y>0.3||jetFuel<99){pill.style.display='block';pill.textContent=`🚀 Carburant ${Math.round(jetFuel)}% · ${Math.round(P.y)} m`;}
}

// ---------- EAU : NAGE, ONDULATIONS, VOITURES DANS L'EAU
let swimming=false,swimRipT=0,swimDrown=0;
function waterPost(dt,px,pz){
  const w=(!P.car&&!interiorType||estateOf(interiorType))&&!P.car?waterAt(P.x,P.z):null;
  const now=!!w&&P.y<0.6;
  if(now){
    if(!swimming){
      swimming=true;addRipple(P.x,P.z,0.55);setTimeout(()=>addRipple(P.x,P.z,0.35),120);
      for(let k=0;k<9;k++)trs.push({m:bx(0.12,0.12,0.12,0xdbeafe,P.x+rr(-0.5,0.5),w.y+0.2,P.z+rr(-0.5,0.5)),t:0.5,gr:0});
      playTone(180,0.25,'sawtooth',0.05,40);showToast('🏊 Tu nages !');
    }
    const mv=Math.hypot(P.x-px,P.z-pz);
    P.x=px+(P.x-px)*0.55;P.z=pz+(P.z-pz)*0.55;
    swimRipT-=dt;if(swimRipT<=0&&mv>0.002){swimRipT=0.32;addRipple(P.x,P.z,0.2);}
    const bob=waveH(P.x,P.z,tm);
    P.m.position.y=w.y-0.62+bob;P.m.rotation.x=mv>0.002?1.05:0.5;
    const u=P.m.userData;u.armL.rotation.x=Math.sin(tm*6)*2.0;u.armR.rotation.x=-Math.sin(tm*6)*2.0;u.legL.rotation.x=Math.sin(tm*9)*0.6;u.legR.rotation.x=-Math.sin(tm*9)*0.6;
    P.stamina=Math.max(0,P.stamina-5*dt);stat('swim',dt);
    if(P.stamina<=0){swimDrown+=dt;P.hp-=4*dt;if(swimDrown>2){swimDrown=0;showToast('😮‍💨 Tu manques d’air ! Sors de l’eau !');}}
  }else if(swimming){
    swimming=false;P.m.rotation.x=0;
    addRipple(P.x,P.z,0.25);showToast('Tu sors de l’eau.');
  }
  // voitures dans l'eau
  for(const c of cars){
    if(c.dead||c.isPlane)continue;
    const cw=waterAt(c.x,c.z);
    if(cw){
      if(Math.abs(c.v)>0.5){c.v*=Math.max(0,1-1.1*dt);c.wakeT=(c.wakeT||0)-dt;if(c.wakeT<=0){c.wakeT=0.28;addRipple(c.x,c.z,0.4);}}
      c.hp-=(c===P.car?6:3)*dt;c.m.position.y=cw.y-0.55+waveH(c.x,c.z,tm);
      if(c===P.car&&!c.inW){c.inW=1;addRipple(c.x,c.z,0.7);showToast('💦 La voiture prend l’eau !');}
    }else c.inW=0;
  }
}

// =====================================================================
//  JOURNAL & STATISTIQUES · ROUTE MOUILLÉE · RYTHME DE LA VILLE · RADIO D'AMBIANCE
// =====================================================================
function openJournal(){
  const st=SAVE.stats,done=SAVE.missionIdx|0,total=STORY_MISSIONS.length;
  const hm=s=>Math.floor(s/3600)+' h '+String(Math.floor(s%3600/60)).padStart(2,'0');
  const rows=STORY_MISSIONS.map((m,i)=>`<div class="row"><div><b>${i<done?'✅':i===done?'🎯':'🔒'} ${m.chapter||('Chapitre '+(i+1))}</b><small>${m.title}${i===done?' · en cours':''}${i<done?' · terminé':''}</small></div><small>${fmt(m.reward)} F</small></div>`).join('');
  const owned=ESTATES.slice(1).filter(E=>SAVE.own[E.n]).map(E=>E.name);
  openModal(`<h2>📖 Journal & statistiques</h2><div class="sub">Progression : ${Math.min(done,total)}/${total} contrats · Argent : ${fmt(P.cash)} FCFA</div>
    <div class="stats">
      <div>Temps de jeu<b>${hm(st.playSec)}</b></div><div>Argent gagné<b>${fmt(st.earned)} F</b></div>
      <div>Distance parcourue<b>${st.dist.toFixed(1)} km</b></div><div>Ennemis neutralisés<b>${st.kills}</b></div>
      <div>Victoires / défaites sport<b>${st.sportW} / ${st.sportL}</b></div><div>Nuits dormies<b>${st.sleeps}</b></div>
      <div>Altitude record<b>${st.maxAlt} m</b></div><div>Temps passé à nager<b>${Math.round(st.swim)} s</b></div>
    </div>
    <div class="sub" style="margin-top:10px"><b>🏡 Propriétés :</b> ${owned.length?owned.join(' · '):'aucune pour l’instant'}${SAVE.jet?' · 🚀 Jetpack':''}${SAVE.pass?' · 🎫 Pass VIP':''}</div>
    <b style="font-size:12px;color:#94a3b8">CONTRATS</b>${rows}
    <div class="foot"><button class="sec" id="ex-no">Fermer</button></div>`,c=>{c.querySelector('#ex-no').onclick=closeModal;});
}

function wetGrip(dt){
  const c=P.car;if(!c||c.isPlane||S!=='play'||typeof wxB==='undefined')return;
  const r=Math.min(1,wxB.rain);
  if(r>0.25&&Math.abs(c.v)>12){
    const s=-c.steerAngle*c.v*0.18*r*dt;
    c.x+=Math.cos(c.h)*s;c.z-=Math.sin(c.h)*s;
    if(Math.abs(s)>0.02){c.skT=(c.skT||0)-dt;if(c.skT<=0){c.skT=0.12;for(const sx of[-1.04,1.04])trs.push({m:bx(0.3,0.3,0.3,0xcbd5e1,c.x+Math.cos(c.h)*sx-Math.sin(c.h)*1.4,0.3,c.z-Math.sin(c.h)*sx-Math.cos(c.h)*1.4),t:0.4,gr:1});}}
  }
}
let rhy=0;
function rhythm(dt){
  rhy-=dt;if(rhy>0)return;rhy=2;
  if(S!=='play'||interiorType||MG.active)return;
  const h=dayTime,night=h>=22||h<5,rush=(h>=7&&h<9.5)||(h>=17&&h<19.5);
  const wantPeds=night?5:(rush?16:12),wantCars=night?7:(rush?17:12);
  if(peds.length>wantPeds){const p=peds.find(q=>!q.dead&&Math.hypot(q.x-P.x,q.z-P.z)>45);if(p){scene.remove(p.m);p.rm=1;peds.splice(peds.indexOf(p),1);}}
  if(cars.length<wantCars&&Math.random()<0.6)autoSpawnTraffic('civ');
}
let manualRadio=-999,moodT=0;
const _cr=cycleRadio;
cycleRadio=function(){manualRadio=tmNow();return _cr.apply(this,arguments);};
function moodRadio(dt){
  moodT-=dt;if(moodT>0)return;moodT=4;
  if(tmNow()-manualRadio<90||S!=='play'||!RADIOS[radioIdx].notes.length)return;
  const night=dayTime>=22||dayTime<5;
  const want=stars>=2?1:((typeof wxB!=='undefined'&&wxB.rain>0.5)||night?2:0);
  if(want!==radioIdx){radioIdx=want;showToast('📻 '+RADIOS[radioIdx].name+(stars>=2?' · ambiance poursuite':''));}
}

// =====================================================================
//  CARTE / RADAR / REPÈRES 3D
// =====================================================================
const exSprites=[];
function refreshPoiEmojis(){if(EXS.pois)for(const t in EXS.pois)EXS.pois[t].e=SAVE.own[t]?'🏡':'🏷️';}
function setupMap(){
  const special=new Set(['7,0','8,0','9,0','9,1','9,2','0,0','1,0','2,0','4,1','2,1']);
  for(let i=VILLAS.length-1;i>=0;i--){const v=VILLAS[i];if(special.has(Math.floor(v[0]/CS)+','+Math.floor(v[1]/CS)))VILLAS.splice(i,1);}
  const add=(e,n,x,z,col,ly,h)=>{const p={k:'ex',e,n,x,z,col,ly,big:1};POI_ALL.push(p);exSprites.push({p,e:e,s:null,h:h||20});return p;};
  add('✈️','Aéroport',120,40,'#38bdf8',17,26);
  add('🏢','Prestige Immobilier',4*CS+40,CS+48.5,'#fcd34d',-16,20);
  add('🏟️','Complexe Arena',2*CS+40,CS+58.5,'#fb923c',17,20);
  EXS.pois={};
  for(let t=1;t<=5;t++){const E=ESTATES[t],p=add('🏷️',E.name,ESTATE_POS[t].x,ESTATE_POS[t].z,'#'+E.acc.toString(16).padStart(6,'0'),t%2?17:-16,t>=4?24:16);EXS.pois[t]=p;}
  refreshPoiEmojis();
  for(const o of exSprites){o.e=o.p.e;o.s=makeEmojiSprite(o.p.e,6,false);o.s.renderOrder=5;o.s.position.set(o.p.x,o.h,o.p.z);scene.add(o.s);}
  const lg=$e('map-legend');
  if(lg)lg.innerHTML+='<span>✈️ Aéroport (avions)</span><span>🏢 Agence immobilière</span><span>🏟️ Arena (sports)</span><span>🏷️/🏡 Domaines</span>';
}
function updateExSprites(){
  for(const o of exSprites){
    const d=Math.hypot(P.x-o.p.x,P.z-o.p.z),vis=!interiorType&&d>16&&d<175&&S==='play';
    o.s.visible=vis;
    if(vis){const k=clp(d*0.05,2.4,8);o.s.scale.set(k,k,1);if(o.e!==o.p.e){o.e=o.p.e;o.s.material.map=emoTex(o.p.e);o.s.material.needsUpdate=true;}}
  }
}
EXS.doorName=type=>{
  const t=estateOf(type);
  if(t)return (SAVE.own[t]?'🏡 ':'🏷️ ')+ESTATES[t].name+(SAVE.own[t]?'':' · '+fmt(ESTATES[t].price)+' F');
  if(type==='agency')return '🏢 Prestige Immobilier';
  if(type==='sports')return '🏟️ Complexe Arena';
  return '🚪 Porte';
};

// =====================================================================
//  LUMIÈRES D'INTÉRIEUR (2 points constants)
// =====================================================================
let pls=null;
function ensureLights(){if(pls)return;pls=[new THREE.PointLight(0xffe2b8,0,32,1.4),new THREE.PointLight(0xffd9a0,0,32,1.4)];pls.forEach(l=>scene.add(l));}
function lightsUpdate(){
  if(!pls)return;
  const mine=interiorType&&(estateOf(interiorType)||interiorType==='agency'||interiorType==='sports');
  if(mine){pls[0].intensity=1.0;pls[0].position.set(P.x,3.4,P.z-1.5);pls[1].intensity=0.8;pls[1].position.set(P.x+6,3.5,P.z+5);}
  else{pls[0].intensity=0;pls[1].intensity=0;}
}
function spotsPrompt(){
  if(!interiorType||S!=='play'||MG.active)return;
  const s=nearSpot();if(!s)return;
  const cpe=$e('ctx-prompt'),lbl=$e('act-label');
  if(cpe){cpe.textContent=s.label+' — '+(touch?'Interagir':'E');cpe.style.display='block';}
  if(lbl)lbl.textContent='INTERAGIR';
}

// =====================================================================
//  BRANCHEMENTS DANS LA BOUCLE DE JEU
// =====================================================================
const _update=update;
const gPre=guard('pre',dt=>{jetPre(dt);});
const gPost=guard('post',(dt,px,pz)=>{
  pill.style.display='none';
  if(S==='play'||S==='cutscene')stat('playSec',dt);
  if(S==='play'){
    const mv=Math.hypot(P.x-px,P.z-pz);if(mv<30)SAVE.stats.dist+=mv/1000;
    jetPost(dt,px,pz);waterPost(dt,px,pz);wetGrip(dt);airportSecurity(dt);rhythm(dt);moodRadio(dt);
    flightCamera(dt);jetHud();
    if(swimming)pill.style.display='none';
  }
  updateWaters(dt,tm,P.x,P.z);lightsUpdate();updateExSprites();spotsPrompt();refreshJetBtn();
  if(Math.floor(tm)%20===0&&!EXS._sv){EXS._sv=1;writeSave();}else if(Math.floor(tm)%20!==0)EXS._sv=0;
});
update=function(dt){
  ensureSave();
  if(modalOpen)return;
  if(MG.active){
    try{MG.active.update(dt,getInput());}
    catch(e){console.error('[EXTRAS minijeu]',e);try{const g=MG.active;MG.active=null;g.dispose();}catch(_){}mgHud.style.display='none';mgQuit.style.display='none';P.m.visible=!P.car;showToast('Le mini-jeu a rencontré un problème.');}
    return;
  }
  const px=P.x,pz=P.z;
  gPre(dt);
  _update(dt);
  gPost(dt,px,pz);
};

const _dpc=drivePlayerCar;
drivePlayerCar=function(c,dt,i){
  if(c&&c.isPlane){flyPlane(c,dt,i);return;}
  return _dpc.apply(this,arguments);
};
const _ei=enterInterior;
enterInterior=function(type,doorObj){
  const t=estateOf(type);
  try{
    if(t){if(!SAVE.own[t]){offerProperty(t);return;}buildEstate(t);ensureLights();}
    else if(type==='agency'){buildAgency();ensureLights();}
    else if(type==='sports'){buildSports();ensureLights();}
  }catch(e){console.error('[EXTRAS intérieur]',e);showToast('Cet intérieur est indisponible.');return;}
  _ei.call(this,type,doorObj);
  if(t)showToast(`🏡 Bienvenue chez toi · ${ESTATES[t].name}`);
  else if(type==='agency')showToast('🏢 Prestige Immobilier : parle à l’agent.');
  else if(type==='sports')showToast('🏟️ Arena : approche une station pour jouer.');
};
const _dsa=doSmartAction;
doSmartAction=function(){
  if(modalOpen)return;
  if(MG.active){MG.active.finish(false,true);return;}
  if(S==='play'){
    if(P.car&&P.car.isPlane){
      if(P.car.y>0.6||P.car.v>9){showToast('Tu ne peux pas sortir en vol ou à pleine vitesse.');return;}
    }else if(!P.car&&!interiorType&&!P.enteringCar){
      const pl=nearPlane();if(pl){boardPlane(pl);return;}
    }else if(interiorType){
      const cfg=INTERIORS[interiorType];
      const nearExit=cfg&&Math.hypot(P.x-cfg.ix,P.z-(cfg.iz+cfg.d/2-1.2))<3.2;
      if(!nearExit){const s=nearSpot();if(s){useSpot(s);return;}}
    }
  }
  return _dsa.apply(this,arguments);
};
const _kp=killPed;
killPed=function(p){if(p&&!p.dead)stat('kills');return _kp.apply(this,arguments);};
window.addEventListener('keydown',e=>{if(e.code==='KeyJ'&&!e.repeat&&S!=='menu'&&!MG.active){if(modalOpen)closeModal();else openJournal();}});
(function(){
  const row=$e('btn-how');
  if(row&&row.parentNode){const b=document.createElement('button');b.className='bt ghost';b.textContent='📖 JOURNAL';b.onclick=()=>openJournal();row.parentNode.appendChild(b);}
})();
setupMap();
EXS.open=openJournal;
EXS.dbg={buildEstate,buildAgency,buildSports,startMG,MG,planes,boardPlane,flyPlane,openJournal,openCatalog,offerProperty,sleepMenu,sportMenu,useSpot,nearSpot,currentSpots,waterPost,updateWaters,jetPre,setJet:v=>{jetHeld=v;},getPlane:i=>planes[i]};
console.log('[EXTRAS] chargé : domaines, agence, arena, aéroport, jetpack, eau, journal.');

})();
