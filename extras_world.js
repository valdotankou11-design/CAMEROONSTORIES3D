'use strict';
// =====================================================================
//  EXTRAS MONDE : eau vivante, domaines de luxe, aéroport, agence, complexe sportif, avions
//  (chargé après world.js, avant game.js)
// =====================================================================
const _rn=(a,b)=>a+Math.random()*(b-a);
const _cl=(v,a,b)=>Math.max(a,Math.min(b,v));
function _cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function _tex(c,rx,ry){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rx)t.repeat.set(rx,ry||rx);return t;}

// ---------- textures procédurales (marbre, parquet, tapis, tableaux, herbe, terrains)
const TX={};
TX.marble=(rx)=>{
  const c=_cv(256,256),x=c.getContext('2d');
  x.fillStyle='#ece8e1';x.fillRect(0,0,256,256);
  for(let i=0;i<26;i++){x.strokeStyle=`rgba(${110+Math.random()*50|0},${105+Math.random()*50|0},${100+Math.random()*50|0},${0.12+Math.random()*0.18})`;x.lineWidth=0.6+Math.random()*1.8;x.beginPath();let px=Math.random()*256,py=Math.random()*256;x.moveTo(px,py);for(let k=0;k<6;k++){px+=_rn(-50,50);py+=_rn(-50,50);x.lineTo(px,py);}x.stroke();}
  x.strokeStyle='rgba(60,55,50,0.28)';x.lineWidth=2;x.strokeRect(0,0,256,256);
  return _tex(c,rx||6);
};
TX.parquet=(rx,col)=>{
  const c=_cv(256,256),x=c.getContext('2d'),base=col||[150,98,56];
  for(let r=0;r<8;r++)for(let k=0;k<4;k++){const v=_rn(-18,18);x.fillStyle=`rgb(${base[0]+v|0},${base[1]+v*0.7|0},${base[2]+v*0.5|0})`;x.fillRect(k*64+(r%2?32:0)-32,r*32,62,30);x.fillRect(k*64+(r%2?32:0)+32,r*32,62,30);}
  x.strokeStyle='rgba(30,18,8,0.35)';x.lineWidth=1.2;for(let r=0;r<=8;r++){x.beginPath();x.moveTo(0,r*32);x.lineTo(256,r*32);x.stroke();}
  return _tex(c,rx||6);
};
TX.rug=(c1,c2)=>{
  const c=_cv(256,256),x=c.getContext('2d');x.fillStyle=c1;x.fillRect(0,0,256,256);
  for(let i=0;i<6;i++){x.strokeStyle=i%2?c2:'rgba(255,255,255,0.55)';x.lineWidth=i%2?8:3;x.strokeRect(14+i*17,14+i*17,228-i*34,228-i*34);}
  x.fillStyle=c2;x.beginPath();x.moveTo(128,80);x.lineTo(176,128);x.lineTo(128,176);x.lineTo(80,128);x.fill();
  return _tex(c,1);
};
TX.art=(seed)=>{
  const c=_cv(128,160),x=c.getContext('2d'),pal=[['#0f172a','#f59e0b','#ef4444','#e2e8f0'],['#f1f5f9','#0ea5e9','#1e293b','#facc15'],['#7f1d1d','#fde68a','#111827','#f97316'],['#064e3b','#a7f3d0','#fcd34d','#0f172a']][seed%4];
  x.fillStyle=pal[0];x.fillRect(0,0,128,160);
  for(let i=0;i<7;i++){x.fillStyle=pal[1+i%3];x.globalAlpha=0.55+Math.random()*0.4;x.beginPath();x.arc(_rn(10,118),_rn(10,150),_rn(10,44),0,6.3);x.fill();}
  x.globalAlpha=1;x.strokeStyle=pal[3];x.lineWidth=3;x.beginPath();x.moveTo(0,_rn(30,130));x.bezierCurveTo(40,_rn(0,160),90,_rn(0,160),128,_rn(30,130));x.stroke();
  return new THREE.CanvasTexture(c);
};
TX.grass=(rx)=>{
  const c=_cv(128,128),x=c.getContext('2d');x.fillStyle='#2f7d3f';x.fillRect(0,0,128,128);
  for(let i=0;i<500;i++){x.fillStyle=`rgba(${30+Math.random()*40|0},${100+Math.random()*70|0},${40+Math.random()*30|0},0.55)`;x.fillRect(Math.random()*128,Math.random()*128,2,3);}
  return _tex(c,rx||8);
};
TX.wood=(rx,col)=>TX.parquet(rx,col||[120,76,44]);
TX.basket=()=>{   // demi-terrain de basket
  const c=_cv(512,512),x=c.getContext('2d');
  x.fillStyle='#c98a4b';x.fillRect(0,0,512,512);
  for(let i=0;i<16;i++){x.fillStyle=`rgba(80,40,10,${0.04+Math.random()*0.05})`;x.fillRect(i*32,0,30,512);}
  x.fillStyle='#b91c1c';x.fillRect(176,0,160,230);   // raquette
  x.strokeStyle='#fff';x.lineWidth=5;x.strokeRect(4,4,504,504);x.strokeRect(176,4,160,230);
  x.beginPath();x.arc(256,234,60,0,Math.PI);x.stroke();
  x.beginPath();x.arc(256,60,230,0.12*Math.PI,0.88*Math.PI);x.stroke();   // ligne à 3 points
  x.beginPath();x.moveTo(26,4);x.lineTo(26,95);x.moveTo(486,4);x.lineTo(486,95);x.stroke();
  x.beginPath();x.arc(256,60,18,0,6.3);x.stroke();
  return new THREE.CanvasTexture(c);
};
TX.tennis=()=>{
  const c=_cv(512,1024),x=c.getContext('2d');
  x.fillStyle='#2b6cb0';x.fillRect(0,0,512,1024);x.fillStyle='#2f855a';x.fillRect(40,60,432,904);
  x.strokeStyle='#fff';x.lineWidth=5;x.strokeRect(70,120,372,784);x.strokeRect(112,120,288,784);
  x.beginPath();x.moveTo(112,300);x.lineTo(400,300);x.moveTo(112,724);x.lineTo(400,724);x.moveTo(256,300);x.lineTo(256,724);x.moveTo(256,120);x.lineTo(256,134);x.moveTo(256,904);x.lineTo(256,890);x.stroke();
  return new THREE.CanvasTexture(c);
};
TX.pitch=()=>{
  const c=_cv(512,512),x=c.getContext('2d');
  for(let i=0;i<8;i++){x.fillStyle=i%2?'#2e8b3d':'#2a7e37';x.fillRect(0,i*64,512,64);}
  x.strokeStyle='#fff';x.lineWidth=4;x.strokeRect(20,20,472,472);x.strokeRect(150,20,212,90);x.strokeRect(200,20,112,38);
  x.beginPath();x.arc(256,110,32,0.2*Math.PI,0.8*Math.PI);x.stroke();
  return new THREE.CanvasTexture(c);
};
TX.sign=(txt,bg,fg)=>{
  const c=_cv(512,96),x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,512,96);
  x.strokeStyle=fg;x.lineWidth=4;x.strokeRect(5,5,502,86);
  x.fillStyle=fg;x.font='bold 40px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(txt,256,50);
  return new THREE.CanvasTexture(c);
};
function _signBoard(G,txt,bg,fg,w,h,x,y,z,ry){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:TX.sign(txt,bg,fg)}));
  m.position.set(x,y,z);m.rotation.y=ry||0;G.add(m);return m;
}

// ---------- EAU VIVANTE : vagues + ondulations (lac, piscines)
const WATERS=[],RIPPLES=[];
function addRipple(x,z,amp){RIPPLES.push({x,z,t:0,amp:amp||0.3});if(RIPPLES.length>9)RIPPLES.shift();}
function makeWater(G,lx,lz,w,d,y,seg,col,ds2,ox,oz,op){
  const geo=new THREE.PlaneGeometry(w,d,seg,seg);geo.rotateX(-Math.PI/2);
  const mat=new THREE.MeshStandardMaterial({color:col,roughness:0.1,metalness:0.4,transparent:true,opacity:op||0.82});
  const m=new THREE.Mesh(geo,mat);m.position.set(lx,y,lz);m.receiveShadow=true;G.add(m);
  if(ds2)ds2.push(geo,mat);
  const rec={x:(ox||0)+lx,z:(oz||0)+lz,w,d,y,mesh:m,geo,seg,G,base:Float32Array.from(geo.attributes.position.array)};
  WATERS.push(rec);return rec;
}
function makeLakeWater(G,ox,oz,ds2){makeWater(G,40,40,46,46,0.1,44,0x1c86c5,ds2,ox,oz,0.8);}
function waveH(wx,wz,t){return Math.sin(wx*0.35+t*1.3)*0.05+Math.sin(wz*0.5-t*1.7)*0.04+Math.sin((wx+wz)*0.22+t*0.9)*0.05;}
function waterAt(x,z){
  for(const r of WATERS)if(r.G.parent&&Math.abs(x-r.x)<r.w/2&&Math.abs(z-r.z)<r.d/2)return r;
  return null;
}
let _wf=0;
function updateWaters(dt,t,px,pz){
  for(let i=RIPPLES.length-1;i>=0;i--){RIPPLES[i].t+=dt;if(RIPPLES[i].t>4.5)RIPPLES.splice(i,1);}
  _wf++;
  for(let q=WATERS.length-1;q>=0;q--){
    const r=WATERS[q];
    if(!r.G.parent){WATERS.splice(q,1);continue;}
    if(Math.hypot(r.x-px,r.z-pz)>r.w*0.5+150)continue;
    const pos=r.geo.attributes.position.array,base=r.base,n=pos.length/3;
    for(let i=0;i<n;i++){
      const wx=r.x+base[i*3],wz=r.z+base[i*3+2];
      let h=waveH(wx,wz,t);
      for(const rp of RIPPLES){
        const e=Math.hypot(wx-rp.x,wz-rp.z)-rp.t*3.4;
        if(e>-2.2&&e<2.2)h+=rp.amp*Math.exp(-rp.t*0.8)*Math.cos(e*3.2)*Math.exp(-e*e*0.9);
      }
      pos[i*3+1]=h;
    }
    r.geo.attributes.position.needsUpdate=true;
    if(_wf%2===0)r.geo.computeVertexNormals();
  }
}

// ---------- MODÈLE D'AVION (prop / jet)
function buildPlaneMesh(kind){
  const jet=kind==='jet',g=new THREE.Group();
  const body=mt(jet?0xd5dde8:0xf8fafc,0.4,0.3),acc=mt(jet?0x1d4ed8:0xdc2626,0.5,0.2),dark=mt(0x1f2937,0.6,0.4);
  const glass=new THREE.MeshStandardMaterial({color:0x1e3a5f,roughness:0.05,metalness:0.8,transparent:true,opacity:0.8});
  const len=jet?8.4:6.2,fy=1.45;
  const fus=new THREE.Mesh(new THREE.CylinderGeometry(jet?0.7:0.62,0.3,len,16),body);fus.rotation.x=Math.PI/2;fus.position.set(0,fy,0);fus.castShadow=true;g.add(fus);
  const nose=new THREE.Mesh(new THREE.ConeGeometry(jet?0.7:0.62,jet?1.8:1.2,16),acc);nose.rotation.x=Math.PI/2;nose.position.set(0,fy,len/2+(jet?0.9:0.6));nose.castShadow=true;g.add(nose);
  const cock=new THREE.Mesh(new THREE.SphereGeometry(0.6,12,8),glass);cock.scale.set(0.9,0.7,1.5);cock.position.set(0,fy+0.42,len*0.2);g.add(cock);
  if(jet){
    for(const s of[-1,1]){const w=bx(5.2,0.12,1.9,body,s*3.1,fy-0.35,-0.5,g);w.rotation.y=-s*0.42;bx(0.6,0.5,0.1,acc,s*5.4,fy-0.05,-1.7,g);
      const eng=new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.3,1.8,12),dark);eng.rotation.x=Math.PI/2;eng.position.set(s*1.7,fy-0.7,-0.6);g.add(eng);}
    bx(0.12,2.0,1.6,acc,0,fy+1.3,-len/2+0.5,g);bx(3.8,0.1,1.0,body,0,fy+0.2,-len/2+0.4,g);
  }else{
    bx(10.6,0.13,1.7,body,0,fy+0.55,0.3,g);
    for(const s of[-1,1]){bx(0.8,0.14,1.7,acc,s*5.1,fy+0.55,0.3,g);bx(0.08,0.8,0.1,body,s*1.6,fy+0.1,0.3,g).rotation.z=-s*0.7;}
    bx(0.12,1.7,1.4,acc,0,fy+1.0,-len/2+0.4,g);bx(3.6,0.1,0.95,body,0,fy+0.15,-len/2+0.35,g);
    const prop=new THREE.Group();prop.position.set(0,fy,len/2+1.28);
    bx(0.16,2.3,0.14,dark,0,0,0,prop);bx(2.3,0.16,0.14,dark,0,0,0,prop);
    const sp=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.45,10),acc);sp.rotation.x=Math.PI/2;sp.position.z=0.2;prop.add(sp);
    g.add(prop);g.userData.prop=prop;
  }
  for(const s of[-1,1])bx(0.03,0.26,len*0.3,glass,s*(jet?0.69:0.62),fy+0.1,len*0.05,g);
  // train d'atterrissage
  for(const[gx,gz]of[[-1.0,0.9],[1.0,0.9],[0,len/2-0.4]]){
    cyl(0.05,0.05,fy-0.25,6,dark,gx,(fy-0.25)/2+0.25,gz,g);
    const wh=cyl(0.26,0.26,0.16,12,0x111111,gx,0.26,gz,g);wh.rotation.z=Math.PI/2;
  }
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  g.userData.kind=kind;
  return g;
}

// ---------- DOMAINES DE LUXE : TABLE ET EXTÉRIEURS
const ESTATES=[null,
  {n:1,name:'Studio Moderne',zone:'Bastos',price:8000,acc:0x38bdf8,feat:['Salon-cuisine ouvert','Chambre avec lit king-size','Petite piscine','Coffre-fort']},
  {n:2,name:'Villa Familiale',zone:'Bastos',price:30000,acc:0x22c55e,feat:['Salon, cuisine et salle à manger','Chambre parentale','Piscine','Terrasse et jardin']},
  {n:3,name:'Villa Contemporaine',zone:'Bastos',price:90000,acc:0xf59e0b,feat:['Verrières et marbre','Salle de sport privée','Grande piscine','Bar & cheminée']},
  {n:4,name:'Manoir Néoclassique',zone:'Bastos',price:250000,acc:0xa855f7,feat:['Colonnade et fontaine','🏀 Terrain de basket','Cinéma maison','Billard & piano']},
  {n:5,name:'Palais Royal',zone:'Bastos',price:700000,acc:0xfacc15,feat:['🎾 Court de tennis','🏀 Terrain de basket','Héliport & salle de cinéma','Suite royale, cave à vin, spa']}
];
const ESTATE_AT={'7,0':1,'8,0':2,'9,0':3,'9,1':4,'9,2':5};
const ESTATE_POS={};   // coordonnées monde de la porte, remplies à la création
for(const k in ESTATE_AT){const t=ESTATE_AT[k],c=k.split(',');ESTATE_POS[t]={x:+c[0]*80+40,z:+c[1]*80+72.5};}
const AIRPORT={x0:8,x1:232,z0:9,z1:71,gx:40,hole:220};   // zone aéroport (coordonnées monde)

function _pad(G,ds,ds2,ox,oz,lx,lz,acc,type){
  const pad=new THREE.Mesh(new THREE.RingGeometry(0.95,1.35,28),new THREE.MeshBasicMaterial({color:acc,side:THREE.DoubleSide,transparent:true,opacity:0.85}));
  pad.rotation.x=-Math.PI/2;pad.position.set(lx,0.3,lz);G.add(pad);ds2.push(pad.geometry,pad.material);
  ds.push({x:ox+lx,z:oz+lz,type});
}
function _wall(G,bs,ox,oz,x0,z0,x1,z1,h,col,th){
  const w=Math.abs(x1-x0)||th,d=Math.abs(z1-z0)||th,cx=(x0+x1)/2,cz=(z0+z1)/2;
  bx(w,h,d,col,cx,h/2,cz,G);bs.push([ox+cx-w/2,oz+cz-d/2,ox+cx+w/2,oz+cz+d/2]);
}
function _column(G,x,z,h,r,col){cyl(r,r,h,14,col,x,h/2+0.3,z,G);cyl(r*1.35,r*1.35,0.3,14,col,x,0.45,z,G);cyl(r*1.35,r*1.35,0.3,14,col,x,h+0.2,z,G);}

function estateExterior(t,G,bs,ds,ds2,ox,oz){
  const E=ESTATES[t],lawn=new THREE.MeshStandardMaterial({map:TX.grass(6),roughness:0.95});
  const m=new THREE.Mesh(new THREE.BoxGeometry(62,0.3,62),lawn);m.position.set(40,0.15,40);m.receiveShadow=true;G.add(m);ds2.push(m.geometry);
  const wallC=t>=4?0xf3efe6:0xe9e5dc;
  _wall(G,bs,ox,oz,10,10,70,10.5,2.5,wallC,0.5);_wall(G,bs,ox,oz,10,10,10.5,70,2.5,wallC,0.5);_wall(G,bs,ox,oz,70,10,70.5,70,2.5,wallC,0.5);
  _wall(G,bs,ox,oz,10,70,34,70.5,2.5,wallC,0.5);_wall(G,bs,ox,oz,46,70,70,70.5,2.5,wallC,0.5);
  for(const px of[34,46]){bx(1.3,3.6,1.3,wallC,px,1.8,70.2,G);cyl(0.38,0.38,0.5,10,mt(0xfef08a,0.2,0),px,3.9,70.2,G);}
  if(t>=3){for(let k=0;k<6;k++){const gx=35+k*2;bx(0.08,2.8,0.08,mt(0xd4af37,0.3,0.9),gx,1.5,70.2,G);}}
  bx(12,0.1,2.4,mt(0x9ca3af,0.9,0),40,0.32,66,G);
  const white=0xf8f6f0;
  if(t===1){
    bx(22,5,12,white,40,2.8,25,G);bx(24,0.45,14,0x1f2937,40,5.5,25,G);
    bx(13,3.6,0.15,mt(0x7dd3fc,0.08,0.7),37,2.3,31.1,G);bx(3,4.6,0.16,mt(0x8b5a2b,0.7,0.1),49,2.6,31.1,G);
    for(let k=0;k<9;k++)bx(0.18,4.8,0.26,mt(0x92602f,0.7,0),30+k*0.5,2.7,31.3,G);
    bx(8,0.2,5,mt(0x7dd3fc,0.1,0.5),40,0.4,50,G);
  }else if(t===2){
    bx(26,7.5,14,0xf2e5d0,40,4,24,G);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(21,5,4),mt(0xb4532a,0.8,0));roof.rotation.y=Math.PI/4;roof.scale.set(1,1,0.62);roof.position.set(40,10.4,24);roof.castShadow=true;G.add(roof);ds2.push(roof.geometry);
    for(let k=0;k<4;k++)bx(2.2,2.6,0.15,mt(0x7dd3fc,0.1,0.6),30+k*6.2,5.2,31.1,G);
    bx(7,3.4,6,0xe2d6bf,22,1.9,29,G);bx(8,0.3,3,0x78350f,40,3.2,33,G);
    bx(3,4.5,0.2,mt(0x6b3f1d,0.7,0.1),40,2.6,31.1,G);
  }else if(t===3){
    bx(34,4.4,16,white,38,2.4,26,G);bx(22,4,13,0x2b2f36,44,6.7,25,G);bx(36,0.5,18,0x1f2937,38,4.8,26,G);bx(24,0.5,15,0x1f2937,44,8.9,25,G);
    bx(26,3.2,0.15,mt(0x7dd3fc,0.05,0.75),36,2.3,34.1,G);bx(16,3.2,0.15,mt(0x7dd3fc,0.05,0.75),44,6.7,31.6,G);
    for(let k=0;k<12;k++)bx(0.2,4.2,0.3,mt(0x8b5a2b,0.65,0),24+k*0.45,2.4,34.2,G);
    bx(10,0.25,6,mt(0x38bdf8,0.1,0.5),30,0.45,50,G);
  }else if(t===4){
    bx(40,10,16,0xf4ead2,40,5.3,24,G);bx(14,12,5,0xf4ead2,40,6.3,33.5,G);
    const ped=new THREE.Mesh(new THREE.ConeGeometry(8.5,3,3),mt(0xf4ead2,0.7,0.1));ped.rotation.set(0,Math.PI/2,0);ped.scale.set(0.45,1,1);ped.position.set(40,13.3,34);ped.rotation.z=0;G.add(ped);ds2.push(ped.geometry);
    for(let k=0;k<6;k++)_column(G,34.4+k*2.24,35.7,9,0.52,white);
    for(const sx of[-1,1]){bx(10,9,14,0xeadfc4,40+sx*25,4.8,25,G);bx(11,0.7,15,mt(0x8a5a2b,0.7,0.1),40+sx*25,9.6,25,G);}
    for(let k=0;k<5;k++){bx(2.2,3,0.15,mt(0x7dd3fc,0.1,0.6),24+k*8,6.2,32.1,G);}
    for(let k=0;k<10;k++)bx(0.5,1.2,0.5,white,16+k*4.2,10.6,17,G);
    cyl(3.6,3.9,0.7,22,0xd6d3cc,40,0.65,52,G);cyl(1.2,1.5,2.4,14,0xe5e7eb,40,1.9,52,G);cyl(2.1,2.1,0.35,18,mt(0x38bdf8,0.1,0.5),40,1.1,52,G);
    const hedge=mt(0x1f6b34,0.95,0);for(const sx of[-1,1])bx(8,1.3,1.1,hedge,40+sx*12,0.95,45,G);
  }else{
    bx(52,12,18,0xfaf3e0,40,6.3,22,G);bx(18,16,8,0xfaf3e0,40,8.2,33,G);
    const dome=new THREE.Mesh(new THREE.SphereGeometry(7,22,12,0,Math.PI*2,0,Math.PI/2),mt(0xd4af37,0.25,0.85));dome.position.set(40,17,26);dome.castShadow=true;G.add(dome);ds2.push(dome.geometry);
    for(const sx of[-1,1]){bx(8,18,12,0xf4ead2,40+sx*29,9.3,22,G);const tp=new THREE.Mesh(new THREE.ConeGeometry(6.2,5,4),mt(0xd4af37,0.3,0.8));tp.rotation.y=Math.PI/4;tp.position.set(40+sx*29,20.8,22);G.add(tp);ds2.push(tp.geometry);}
    for(let k=0;k<10;k++)_column(G,22.5+k*3.9,32.5,11,0.62,0xfffaf0);
    bx(40,0.7,2,mt(0xd4af37,0.3,0.85),40,12.6,32.6,G);
    for(const sx of[-1,1]){cyl(3.4,3.8,0.8,22,0xe5e7eb,40+sx*14,0.7,50,G);cyl(0.7,1.1,2.8,12,0xe5e7eb,40+sx*14,2.3,50,G);cyl(2.4,2.4,0.4,18,mt(0x38bdf8,0.1,0.5),40+sx*14,1.2,50,G);}
    cyl(5,5,0.12,30,0x374151,62,0.35,56,G);bx(0.5,0.14,3.2,0xfde047,60.4,0.42,56,G);bx(0.5,0.14,3.2,0xfde047,63.6,0.42,56,G);bx(3.2,0.14,0.5,0xfde047,62,0.42,56,G);
    for(let k=0;k<6;k++){cyl(0.1,0.1,3.4,6,0x111827,36+(k%2?5:-5)*0+ (k<3?30-k*0:30),1.9,40+k*4,G);}
  }
  bx(3.4,0.5,0.2,mt(E.acc,0.4,0.3),40,4.4,70.4,G);
  _pad(G,ds,ds2,ox,oz,40,72.6,E.acc,'estate'+t);
}

function airportChunk(cx,G,bs,ds,ds2,ox,oz){
  const asph=mt(0x2a2d33,0.95,0.02),apron=mt(0x3a3e46,0.95,0.02),white=mt(0xf1f5f9,0.6,0),yel=mt(0xfacc15,0.6,0);
  bx(80,0.14,20,asph,40,0.07,24,G);                       // piste
  for(let k=0;k<8;k++)bx(5,0.03,0.5,white,5+k*10,0.16,24,G);
  bx(80,0.03,0.3,white,40,0.16,14.2,G);bx(80,0.03,0.3,white,40,0.16,33.8,G);
  if(cx===0)for(let k=0;k<7;k++)bx(6,0.03,0.7,white,9,0.16,15.5+k*2.6,G);
  if(cx===2)for(let k=0;k<7;k++)bx(6,0.03,0.7,white,71,0.16,15.5+k*2.6,G);
  bx(80,0.12,12,apron,40,0.06,41,G);bx(80,0.03,0.25,yel,40,0.14,41,G);   // aire de stationnement
  for(let k=0;k<8;k++)bx(0.5,0.4,0.5,mt(0x3b82f6,0.4,0),5+k*10,0.3,35.5,G);   // balises
  bx(80,0.2,18,0x5b616b,40,0.1,62,G);
  // clôture nord et sud (hors routes)
  const fence=(x0,x1,z)=>{
    for(let x=x0;x<=x1;x+=2){bx(0.1,2.2,0.1,0x4b5563,x,1.1,z,G);}
    bx(x1-x0,0.06,0.04,0x9ca3af,(x0+x1)/2,2.0,z,G);bx(x1-x0,0.06,0.04,0x9ca3af,(x0+x1)/2,1.0,z,G);
    bs.push([ox+x0,oz+z-0.15,ox+x1,oz+z+0.15]);
  };
  fence(9,71,9);
  if(cx===0){fence(9,34,71);fence(46,71,71);}
  else if(cx===2){fence(9,56,71);fence(64,71,71);}   // trou dans le grillage
  else fence(9,71,71);
  if(cx===0){
    bx(44,9,16,0xe5e7eb,38,4.6,58,G);bx(46,0.8,18,0x334155,38,9.4,58,G);
    bx(40,5,0.2,mt(0x7dd3fc,0.05,0.75),38,3.6,49.9,G);bx(46,0.5,5,0x1e3a8a,38,5.9,48,G);
    _signBoard(G,'AÉROPORT INTERNATIONAL','#0f2a5e','#fde047',16,3,38,7.6,49.7,0);
    bs.push([ox+16,oz+50,ox+60,oz+66]);
    cyl(2.1,2.6,18,14,0xf1f5f9,12,9.3,58,G);cyl(3.6,3.0,3.4,14,mt(0x1e3a5f,0.1,0.6),12,19.7,58,G);cyl(4,4,0.6,14,0x334155,12,21.7,58,G);
    cyl(0.1,0.1,3,6,0xef4444,12,23.4,58,G);bs.push([ox+9.5,oz+55.5,ox+14.5,oz+60.5]);
    // portail et barrière
    bx(0.5,4,0.5,0x334155,34,2,71,G);bx(0.5,4,0.5,0x334155,46,2,71,G);bx(12,0.7,0.4,0x1e3a8a,40,4.2,71,G);
    bx(5.5,0.22,0.22,0xef4444,37.5,1.2,71,G);bx(1.2,0.22,0.22,0xf8fafc,40.7,1.2,71,G);
    bx(2,2.4,2,0xe5e7eb,30,1.2,68,G);   // guérite
    for(let k=0;k<6;k++)bx(2.4,0.04,5,white,6+k*3,0.14,76,G);
  }else if(cx===1){
    for(const hx of[22,56]){
      bx(24,8,18,0x9ca3af,hx,4.3,58,G);bx(26,0.6,20,0x4b5563,hx,8.6,58,G);
      bx(14,6.5,0.3,0x1f2937,hx,3.4,48.9,G);bs.push([ox+hx-12,oz+49,ox+hx+12,oz+67]);
    }
    for(const tx of[40]){cyl(2.2,2.2,5,14,0xd1d5db,tx,2.8,64,G);bs.push([ox+37.8,oz+61.8,ox+42.2,oz+66.2]);}
  }else{
    bx(6,3,6,0x6b7280,12,1.6,62,G);bs.push([ox+9,oz+59,ox+15,oz+65]);
    cyl(0.08,0.08,7,6,0x374151,60,3.6,38,G);bx(1.6,0.5,0.1,0xf97316,61,6.7,38,G);
  }
}

function agencyChunk(G,bs,ds,ds2,ox,oz){
  bx(62,0.3,62,mt(0x9aa0a8,0.9,0),40,0.15,40,G);
  bx(44,13,26,0x1b2437,40,6.8,30,G);bx(46,0.8,28,0xd4af37,40,13.4,30,G);
  bx(30,8,0.2,mt(0x7dd3fc,0.04,0.8),40,5,43.1,G);
  for(let k=0;k<5;k++)_column(G,22+k*9,44.5,10,0.5,0xf1f5f9);
  _signBoard(G,'PRESTIGE IMMOBILIER','#101827','#fcd34d',18,3.4,40,11.8,43.4,0);
  bs.push([ox+18,oz+17,ox+62,oz+43]);
  for(let k=0;k<6;k++){bx(2.8,0.05,5.4,0xf8fafc,14+k*10.4,0.32,58,G);}
  for(const px of[16,64]){cyl(0.08,0.08,4.8,6,0x111827,px,2.7,48,G);bx(0.5,0.5,0.5,mt(0xfef08a,0.2,0),px,5.2,48,G);}
  _pad(G,ds,ds2,ox,oz,40,48.5,0xfcd34d,'agency');
}
function sportsChunk(G,bs,ds,ds2,ox,oz){
  bx(62,0.3,62,mt(0x8b95a3,0.9,0),40,0.15,40,G);
  cyl(21,23,10,30,mt(0x334155,0.7,0.2),40,5.3,32,G);cyl(22.4,22.4,1.2,30,mt(0xef4444,0.5,0.2),40,10.6,32,G);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(21,24,10,0,Math.PI*2,0,Math.PI/4),mt(0xe5e7eb,0.4,0.3));dome.position.set(40,11,32);G.add(dome);ds2.push(dome.geometry);
  for(let k=0;k<12;k++){const a=k/12*Math.PI*2;bx(0.5,10,0.5,0xf1f5f9,40+Math.cos(a)*23,5.3,32+Math.sin(a)*23,G);}
  bx(16,5,0.3,mt(0x7dd3fc,0.05,0.8),40,2.8,54.6,G);
  _signBoard(G,'COMPLEXE SPORTIF ARENA','#111827','#fb923c',17,3,40,7.4,55.2,0);
  for(const[bxx,bc]of[[22,0xf97316],[58,0x38bdf8]])bx(3,5,0.2,bc,bxx,7.5,55.4,G);
  bs.push([ox+18,oz+10,ox+62,oz+54]);
  _pad(G,ds,ds2,ox,oz,40,58.5,0xfb923c,'sports');
}

function EXTRAS_CHUNK(cx,cz,G,bs,ds,ds2,ox,oz){
  const k=cx+','+cz;
  if(ESTATE_AT[k]){estateExterior(ESTATE_AT[k],G,bs,ds,ds2,ox,oz);return true;}
  if(cz===0&&cx<=2){airportChunk(cx,G,bs,ds,ds2,ox,oz);return true;}
  if(k==='4,1'){agencyChunk(G,bs,ds,ds2,ox,oz);return true;}
  if(k==='2,1'){sportsChunk(G,bs,ds,ds2,ox,oz);return true;}
  return false;
}
