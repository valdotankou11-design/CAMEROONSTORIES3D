'use strict';
const PI=Math.PI,R=Math.random,cl=(v,a,b)=>Math.max(a,Math.min(b,v)),rn=(a,b)=>a+R()*(b-a);
const hs=(a,b)=>((a*73856093)^(b*19349663))>>>0;
const angd=(a,b)=>{let d=a-b;while(d>PI)d-=2*PI;while(d<-PI)d+=2*PI;return d};
const CS=80,NB=10,WS=CS*NB;
// Coordonnées des intérieurs isolés
const IX_VILLA=5000,IZ_VILLA=5000;
const IX_GYM=5200,IZ_GYM=5000;
const IX_RESTO=5400,IZ_RESTO=5000;
const IX_ARMORY=5600,IZ_ARMORY=5000;

// Lieux emblématiques de Yaoundé
const MON_X=4*CS+40,MON_Z=4*CS+40;
const SHOP_X=3*CS+25,SHOP_Z=3*CS+34.5;
const GYM_X=3*CS+55,GYM_Z=3*CS+34.5;
const RESTO_X=4*CS+25,RESTO_Z=3*CS+34.5;
const GAS_X=2*CS+25,GAS_Z=4*CS+25;
const LAKE_X=6*CS+40,LAKE_Z=5*CS+40;

const touch=matchMedia('(pointer:coarse)').matches;
if(touch)document.body.classList.add('t');

const ren=new THREE.WebGLRenderer({antialias:!touch,powerPreference:'high-performance'});
ren.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
ren.shadowMap.enabled=true;ren.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(ren.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8ecae6);
scene.fog=new THREE.FogExp2(0x8ecae6,0.0044);
const cam=new THREE.PerspectiveCamera(62,1,0.3,240);

const hemi=new THREE.HemisphereLight(0xfff8e7,0x64748b,0.92);
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffeed4,0.98);
sun.position.set(60,120,50);
sun.castShadow=true;sun.shadow.mapSize.set(touch?1024:2048,touch?1024:2048);
const SH=60;Object.assign(sun.shadow.camera,{left:-SH,right:SH,top:SH,bottom:-SH,near:10,far:320});
sun.shadow.bias=-0.0007;sun.shadow.normalBias=0.06;
scene.add(sun);scene.add(sun.target);

function onResize(){ren.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();}
onResize();addEventListener('resize',onResize);

// ===== HAUTEUR EXACTE DU SOL
function getGroundY(x,z,interiorType=null){
  if(interiorType)return 0.15;
  const cx=Math.floor(x/CS),cz=Math.floor(z/CS);
  const lx=((x%CS)+CS)%CS,lz=((z%CS)+CS)%CS;
  if(cx===4&&cz===4&&lx>=16&&lx<=64&&lz>=16&&lz<=64)return 0.40;
  if(lx>=9&&lx<=71&&lz>=9&&lz<=71)return 0.26;
  return 0.0;
}

// ===== MATÉRIAUX & TEXTURES
const MC={},GC={},mt=(c,r=0.82,m=0.08)=>MC[c+'_'+r+'_'+m]||(MC[c+'_'+r+'_'+m]=new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m}));
function bx(w,h,d,c,x,y,z,p){
  const k=w+'_'+h+'_'+d,m=new THREE.Mesh(GC[k]||(GC[k]=new THREE.BoxGeometry(w,h,d)),typeof c==='object'?c:mt(c));
  m.position.set(x,y,z);m.castShadow=Math.max(w,h,d)>0.5;m.receiveShadow=true;(p||scene).add(m);return m;
}
function cyl(rt,rb,h,seg,c,x,y,z,p){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),typeof c==='object'?c:mt(c));
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;(p||scene).add(m);return m;
}
function makeTex(fn,w,h){
  const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'));
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}

const facadeTex=makeTex(x=>{
  x.fillStyle='#e5e7eb';x.fillRect(0,0,128,128);
  x.fillStyle='#cbd5e1';x.fillRect(0,58,128,6);x.fillRect(0,122,128,6);
  for(let row=0;row<2;row++){
    for(let col=0;col<2;col++){
      const wx=14+col*58,wy=10+row*64;
      x.fillStyle='#1e293b';x.fillRect(wx-2,wy-2,44,40);
      const g=x.createLinearGradient(wx,wy,wx+40,wy+36);
      g.addColorStop(0,'#1e3a5f');g.addColorStop(0.5,'#3b82f6');g.addColorStop(1,'#0f172a');
      x.fillStyle=g;x.fillRect(wx,wy,40,36);
      x.fillStyle='rgba(255,255,255,0.24)';
      x.beginPath();x.moveTo(wx,wy);x.lineTo(wx+22,wy);x.lineTo(wx,wy+28);x.fill();
      x.fillStyle='#334155';x.fillRect(wx+19,wy,2,36);
    }
  }
},128,128);

const windowGlowTex=makeTex(x=>{
  x.fillStyle='#000000';x.fillRect(0,0,128,128);
  const cols=['#fde047','#fed7aa','#bae6fd','#fef08a'];
  for(let row=0;row<2;row++){
    for(let col=0;col<2;col++){
      const wx=14+col*58,wy=10+row*64;
      x.fillStyle=cols[(row*2+col)%cols.length];
      x.fillRect(wx+2,wy+2,16,32);
      x.fillRect(wx+22,wy+2,16,32);
    }
  }
},128,128);

const roadTex=makeTex(x=>{
  x.fillStyle='#2a2e35';x.fillRect(0,0,256,256);
  for(let i=0;i<1100;i++){
    x.fillStyle=R()<0.5?'#21242a':'#343942';
    x.fillRect(R()*256,R()*256,2,2);
  }
  x.fillStyle='#facc15';
  for(let i=28;i<228;i+=24){x.fillRect(i,126,13,3);x.fillRect(126,i,3,13);}
  x.fillStyle='rgba(255,255,255,0.62)';
  x.fillRect(24,0,2,256);x.fillRect(230,0,2,256);
  x.fillRect(0,24,256,2);x.fillRect(0,230,256,2);
  x.fillStyle='#f1f5f9';
  for(let k=30;k<94;k+=10){
    x.fillRect(k,6,5,14);x.fillRect(256-k-5,6,5,14);
    x.fillRect(k,236,5,14);x.fillRect(256-k-5,236,5,14);
    x.fillRect(6,k,14,5);x.fillRect(6,256-k-5,14,5);
    x.fillRect(236,k,14,5);x.fillRect(236,256-k-5,14,5);
  }
},256,256);
roadTex.wrapS=roadTex.wrapT=THREE.ClampToEdgeWrapping;
const roadMat=new THREE.MeshStandardMaterial({map:roadTex,roughness:0.88});
const PG=new THREE.PlaneGeometry(CS,CS);

// ===== PERSONNAGES ARTICULÉS BIOMÉCANIQUES
function buildHuman(shirtCol,skinCol,role){
  const g=new THREE.Group(),u={};
  const pants=role==='cop'?0x1e293b:role==='bir'?0x2d4a22:role==='gym'?0x111827:0x334155;

  const torso=new THREE.Group();
  bx(0.50,0.22,0.28,pants,0,0.88,0,torso);
  bx(0.52,0.06,0.30,0x111111,0,0.97,0,torso);
  cyl(0.27,0.22,0.68,12,shirtCol,0,1.32,0,torso);
  if(role==='cop'||role==='bir')bx(0.53,0.48,0.35,role==='bir'?0x1a2e16:0x0f172a,0,1.35,0,torso);
  if(role==='chef')bx(0.48,0.75,0.32,0xf8fafc,0,1.18,0.02,torso);
  cyl(0.085,0.095,0.14,10,skinCol,0,1.72,0,torso);
  // poitrine, épaules et col : silhouette moins "tube"
  const chest=new THREE.Mesh(new THREE.SphereGeometry(0.30,14,10),mt(shirtCol,0.8));
  chest.scale.set(1,0.78,0.62);chest.position.set(0,1.50,0);chest.castShadow=true;torso.add(chest);
  for(const sx of[-0.33,0.33]){const sh=new THREE.Mesh(new THREE.SphereGeometry(0.095,10,8),mt(shirtCol,0.8));sh.position.set(sx,1.58,0);sh.castShadow=true;torso.add(sh);}

  const headGrp=new THREE.Group();headGrp.position.set(0,1.94,0);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.205,14,12),mt(skinCol,0.65));
  headGrp.add(head);
  bx(0.042,0.032,0.03,0x111111,-0.068,0.02,0.19,headGrp);
  bx(0.042,0.032,0.03,0x111111,0.068,0.02,0.19,headGrp);
  bx(0.075,0.014,0.02,0x111111,-0.068,0.075,0.195,headGrp);   // sourcils
  bx(0.075,0.014,0.02,0x111111,0.068,0.075,0.195,headGrp);
  bx(0.045,0.06,0.05,mt(skinCol,0.7),0,-0.02,0.205,headGrp);   // nez
  bx(0.085,0.014,0.02,0x5b2b2b,0,-0.095,0.188,headGrp);        // bouche
  for(const ex of[-0.205,0.205]){const ear=new THREE.Mesh(new THREE.SphereGeometry(0.04,8,6),mt(skinCol,0.7));ear.position.set(ex,0,0);ear.scale.set(0.5,1,0.8);headGrp.add(ear);}

  if(role==='bir'||role==='cop'){
    cyl(0.215,0.215,0.11,12,role==='bir'?0xb91c1c:0x0f172a,0,0.14,0,headGrp);
    bx(0.23,0.04,0.18,0x0f172a,0,0.10,0.15,headGrp);
  }else if(role==='chef'){
    cyl(0.22,0.20,0.24,12,0xf8fafc,0,0.22,0,headGrp);
  }else if(role==='mama'){
    const scarf=new THREE.Mesh(new THREE.SphereGeometry(0.22,12,10),mt(0xe91e63,0.7));
    scarf.position.set(0,0.05,-0.02);headGrp.add(scarf);
  }else{
    const hair=new THREE.Mesh(new THREE.SphereGeometry(0.21,12,10,0,PI*2,0,PI*0.58),mt(0x14110f,0.85));
    hair.position.set(0,0.02,-0.01);headGrp.add(hair);
  }
  torso.add(headGrp);u.head=headGrp;

  const armL=new THREE.Group();armL.position.set(-0.33,1.58,0);
  cyl(0.08,0.068,0.30,8,shirtCol,0,-0.15,0,armL);
  const elbowL=new THREE.Group();elbowL.position.set(0,-0.30,0);
  cyl(0.065,0.055,0.32,8,skinCol,0,-0.16,0,elbowL);
  {const hd=new THREE.Mesh(new THREE.SphereGeometry(0.062,8,6),mt(skinCol,0.7));hd.position.set(0,-0.34,0);elbowL.add(hd);}
  armL.add(elbowL);torso.add(armL);u.armL=armL;u.elbowL=elbowL;

  const armR=new THREE.Group();armR.position.set(0.33,1.58,0);
  cyl(0.08,0.068,0.30,8,shirtCol,0,-0.15,0,armR);
  const elbowR=new THREE.Group();elbowR.position.set(0,-0.30,0);
  cyl(0.065,0.055,0.32,8,skinCol,0,-0.16,0,elbowR);
  const gun=new THREE.Group();gun.position.set(0,-0.30,0.12);
  bx(0.065,0.10,0.44,0x18181b,0,0.03,0.14,gun);
  bx(0.06,0.13,0.08,0x27272a,0,-0.05,-0.02,gun);
  const laser=new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.01,26,6),new THREE.MeshBasicMaterial({color:0xef4444,transparent:true,opacity:0.75}));
  laser.rotation.x=PI/2;laser.position.set(0,0.03,13.2);laser.visible=false;
  gun.add(laser);u.laser=laser;
  gun.visible=false;
  {const hd=new THREE.Mesh(new THREE.SphereGeometry(0.062,8,6),mt(skinCol,0.7));hd.position.set(0,-0.34,0);elbowR.add(hd);}
  elbowR.add(gun);armR.add(elbowR);torso.add(armR);u.armR=armR;u.elbowR=elbowR;u.gun=gun;

  g.add(torso);u.torso=torso;

  const legL=new THREE.Group();legL.position.set(-0.14,0.86,0);
  cyl(0.11,0.092,0.42,10,pants,0,-0.21,0,legL);
  const kneeL=new THREE.Group();kneeL.position.set(0,-0.42,0);
  cyl(0.09,0.078,0.36,10,pants,0,-0.18,0,kneeL);
  bx(0.15,0.10,0.28,0x111111,0,-0.39,0.05,kneeL);
  legL.add(kneeL);g.add(legL);u.legL=legL;u.kneeL=kneeL;

  const legR=new THREE.Group();legR.position.set(0.14,0.86,0);
  cyl(0.11,0.092,0.42,10,pants,0,-0.21,0,legR);
  const kneeR=new THREE.Group();kneeR.position.set(0,-0.42,0);
  cyl(0.09,0.078,0.36,10,pants,0,-0.18,0,kneeR);
  bx(0.15,0.10,0.28,0x111111,0,-0.39,0.05,kneeR);
  legR.add(kneeR);g.add(legR);u.legR=legR;u.kneeR=kneeR;

  if(role!=='player'&&role!=='cop'&&role!=='bir')g.scale.setScalar(0.94+R()*0.12);
  g.traverse(o=>{if(o.isMesh&&o.material!==u.laser.material)o.castShadow=true;});
  g.userData=u;scene.add(g);return g;
}

function swingLimbs(g,t,amp,isRunning=false,mode='walk',actionTimer=0,comboStep=0){
  const u=g.userData;
  if(mode==='talk'){
    const g1=Math.sin(t*1.1),g2=Math.cos(t*0.85);
    u.torso.rotation.y=g1*0.14;
    u.torso.position.y=Math.abs(Math.sin(t*0.6))*0.03;
    u.head.rotation.x=Math.sin(t*1.5)*0.11;
    u.head.rotation.y=g2*0.16;
    u.armR.rotation.x=-0.65+g1*0.42;
    u.armR.rotation.z=-0.18;
    u.elbowR.rotation.x=-0.75+Math.sin(t*1.6)*0.35;
    u.armL.rotation.x=-0.45-g2*0.35;
    u.armL.rotation.z=0.18;
    u.elbowL.rotation.x=-0.65+Math.cos(t*1.3)*0.3;
    u.legL.rotation.x=0;u.legR.rotation.x=0;
    if(u.kneeL)u.kneeL.rotation.x=0;
    if(u.kneeR)u.kneeR.rotation.x=0;
    return;
  }
  if(mode==='punch'){
    // Enchaînement réaliste de 3 coups de poing (Jab gauche, Direct droit, Crochet)
    const ext=Math.sin(cl(1-(actionTimer/0.36),0,1)*PI);
    u.torso.rotation.x=0.12*ext;
    if(comboStep===0){
      u.torso.rotation.y=0.38*ext;
      u.armL.rotation.x=-1.65*ext;u.armL.rotation.z=0.05;
      u.elbowL.rotation.x=-0.15;
      u.armR.rotation.x=-1.05;u.armR.rotation.z=-0.15;
      u.elbowR.rotation.x=-1.45;
    }else if(comboStep===1){
      u.torso.rotation.y=-0.42*ext;
      u.armR.rotation.x=-1.7*ext;u.armR.rotation.z=-0.05;
      u.elbowR.rotation.x=-0.12;
      u.armL.rotation.x=-1.05;u.armL.rotation.z=0.15;
      u.elbowL.rotation.x=-1.45;
    }else{
      u.torso.rotation.y=-0.52*ext;
      u.armR.rotation.x=-1.95*ext;u.armR.rotation.z=0.38*ext;
      u.elbowR.rotation.x=-0.45;
      u.armL.rotation.x=-1.15;u.elbowL.rotation.x=-1.5;
    }
    return;
  }
  if(mode==='guard'){
    // Garde de boxe mains nues
    u.torso.rotation.y=0.24;
    u.torso.rotation.x=0.06;
    u.armL.rotation.x=-1.15;u.armL.rotation.z=0.12;u.elbowL.rotation.x=-1.5;
    u.armR.rotation.x=-1.05;u.armR.rotation.z=-0.12;u.elbowR.rotation.x=-1.55;
    return;
  }
  if(mode==='reload'){
    u.armR.rotation.x=-0.95;
    u.elbowR.rotation.x=-0.55;
    u.armL.rotation.x=-1.05+Math.sin(actionTimer*14)*0.35;
    u.elbowL.rotation.x=-0.85;
    return;
  }

  // Marche / Course / Repos mains libres ou armé
  const s=Math.sin(t)*amp;
  u.legL.rotation.x=s;
  u.legR.rotation.x=-s;
  if(u.kneeL&&u.kneeR){
    u.kneeL.rotation.x=Math.max(0,-Math.sin(t)*amp*0.95);
    u.kneeR.rotation.x=Math.max(0,Math.sin(t)*amp*0.95);
  }
  u.torso.position.y=Math.abs(Math.sin(t))*amp*0.07+Math.sin(t*0.4)*0.015;
  u.torso.rotation.x=isRunning?0.15:amp*0.05;
  u.torso.rotation.y=Math.sin(t)*amp*0.12;
  u.head.rotation.x=0;u.head.rotation.y=-Math.sin(t)*amp*0.12;
  u.torso.position.x=Math.sin(t)*amp*0.025;
  u.armL.rotation.z=0.05;u.armR.rotation.z=-0.05;
  u.armL.rotation.x=-s*0.88;
  u.elbowL.rotation.x=-0.18-Math.max(0,s)*0.35;
  if(u.gun.visible){
    u.armR.rotation.x=-1.32;
    u.elbowR.rotation.x=-0.12;
  }else{
    u.armR.rotation.x=s*0.88;
    u.elbowR.rotation.x=-0.18-Math.max(0,-s)*0.35;
  }
}

// ===== VÉHICULES AUTOMOBILES RÉALISTES (VITRES 360° COHÉRENTES & CASSABLES, ROUES BRAQUABLES)
// Matériaux partagés : allumés seulement la nuit / au crépuscule (pilotés dans game.js)
const headlightMat=new THREE.MeshBasicMaterial({color:0x8b8f7a});
const lampBulbMat=new THREE.MeshBasicMaterial({color:0x6b6f66});
const SIG={};
for(const ax of['x','z']){SIG[ax]={r:new THREE.MeshBasicMaterial({color:0x3b0a0a}),y:new THREE.MeshBasicMaterial({color:0x3b2f0a}),g:new THREE.MeshBasicMaterial({color:0x0a3b17})};}
function addSignalHead(G,lx,lz,ax,sign){
  const m=SIG[ax];
  if(ax==='x'){
    bx(0.22,1.2,0.5,0x0b0f17,lx+0.3*sign,5.0,lz,G);
    bx(0.06,0.26,0.26,m.r,lx+0.43*sign,5.38,lz,G);bx(0.06,0.26,0.26,m.y,lx+0.43*sign,5.0,lz,G);bx(0.06,0.26,0.26,m.g,lx+0.43*sign,4.62,lz,G);
  }else{
    bx(0.5,1.2,0.22,0x0b0f17,lx,5.0,lz+0.3*sign,G);
    bx(0.26,0.26,0.06,m.r,lx,5.38,lz+0.43*sign,G);bx(0.26,0.26,0.06,m.y,lx,5.0,lz+0.43*sign,G);bx(0.26,0.26,0.06,m.g,lx,4.62,lz+0.43*sign,G);
  }
}
const beamMat=new THREE.MeshBasicMaterial({color:0xfef9c3,transparent:true,opacity:0.16,depthWrite:false,side:THREE.DoubleSide});
const lampGlowMat=new THREE.MeshBasicMaterial({color:0xfef08a,transparent:true,opacity:0.16,depthWrite:false,side:THREE.DoubleSide});

function buildVehicle(col,type){
  const g=new THREE.Group();
  const bodyMat=new THREE.MeshStandardMaterial({color:col,roughness:0.22,metalness:0.55});
  const glassMat=new THREE.MeshStandardMaterial({color:0x0f172a,roughness:0.08,metalness:0.6,transparent:true,opacity:0.38,depthWrite:false});
  const chromeMat=new THREE.MeshStandardMaterial({color:0xe2e8f0,roughness:0.2,metalness:0.85});
  const trimMat=new THREE.MeshStandardMaterial({color:0x111827,roughness:0.7});
  g.userData.bodyMat=bodyMat;

  if(type==='moto'){
    const w1=cyl(0.4,0.4,0.18,18,0x0f172a,0,0.4,0.88,g);w1.rotation.z=PI/2;
    const r1=cyl(0.24,0.24,0.2,12,chromeMat,0,0.4,0.88,g);r1.rotation.z=PI/2;
    const w2=cyl(0.4,0.4,0.22,18,0x0f172a,0,0.4,-0.86,g);w2.rotation.z=PI/2;
    const r2=cyl(0.24,0.24,0.24,12,chromeMat,0,0.4,-0.86,g);r2.rotation.z=PI/2;
    g.userData.wheels=[w1,w2];

    for(const fx of[-0.14,0.14]){
      const fork=cyl(0.038,0.038,0.92,8,chromeMat,fx,0.82,0.68,g);
      fork.rotation.x=-0.46;
    }
    bx(0.30,0.36,0.66,0x1e293b,0,0.64,0.02,g);
    const frameBar=cyl(0.042,0.042,0.95,8,0x334155,0,0.86,0.22,g);frameBar.rotation.x=0.85;
    const tank=new THREE.Mesh(new THREE.SphereGeometry(0.27,12,10),bodyMat);
    tank.scale.set(0.85,0.75,1.45);tank.position.set(0,1.02,0.22);g.add(tank);
    const cowl=new THREE.Mesh(new THREE.ConeGeometry(0.27,0.60,4),bodyMat);
    cowl.rotation.x=PI/2;cowl.rotation.y=PI/4;cowl.position.set(0,1.05,0.68);g.add(cowl);
    bx(0.34,0.15,0.76,0x111827,0,0.92,-0.36,g);
    const exhaust=cyl(0.052,0.042,0.85,10,chromeMat,0.24,0.56,-0.55,g);exhaust.rotation.x=PI/2-0.25;
    bx(0.88,0.05,0.06,chromeMat,0,1.22,0.52,g);
    bx(0.2,0.2,0.08,headlightMat,0,1.06,0.96,g);
    const b1=new THREE.Mesh(new THREE.ConeGeometry(1.8,9,12,1,true),beamMat);
    b1.rotation.x=-PI/2;b1.position.set(0,0.65,5.4);g.add(b1);
    g.userData.beams=[b1];g.userData.windows=[];
    scene.add(g);return g;
  }

  bx(2.04,0.22,4.84,trimMat,0,0.42,0,g);
  bx(2.14,0.54,2.30,bodyMat,0,0.79,-0.08,g);
  const hood=bx(2.08,0.46,1.42,bodyMat,0,0.76,1.72,g);
  hood.rotation.x=0.05;
  bx(2.08,0.50,1.16,bodyMat,0,0.78,-1.78,g);

  const windows=[];
  const frontGlass=bx(1.78,0.76,0.07,glassMat,0,1.36,0.92,g);
  frontGlass.rotation.x=-0.56;windows.push(frontGlass);
  const rearGlass=bx(1.76,0.78,0.07,glassMat,0,1.36,-1.18,g);
  rearGlass.rotation.x=0.58;windows.push(rearGlass);
  const sideGlassL=bx(0.06,0.58,1.72,glassMat,-0.94,1.36,-0.13,g);
  const sideGlassR=bx(0.06,0.58,1.72,glassMat,0.94,1.36,-0.13,g);
  windows.push(sideGlassL,sideGlassR);
  g.userData.windows=windows;

  // ===== INTÉRIEUR : sièges, tableau de bord, volant (visibles à travers les vitres)
  const seatMat=mt(0x1f2937,0.9,0.05),dashMat=mt(0x0b0f17,0.6,0.1);
  bx(0.55,0.66,0.14,seatMat,-0.45,1.40,-0.42,g);   // dossier conducteur
  bx(0.55,0.66,0.14,seatMat,0.45,1.40,-0.42,g);    // dossier passager
  bx(0.5,0.14,0.14,seatMat,-0.45,1.78,-0.42,g);    // appuie-tête
  bx(0.5,0.14,0.14,seatMat,0.45,1.78,-0.42,g);
  bx(1.72,0.60,0.14,seatMat,0,1.36,-1.05,g);       // banquette arrière
  bx(1.80,0.22,0.34,dashMat,0,1.14,0.74,g);        // tableau de bord
  bx(0.40,0.16,0.10,dashMat,-0.45,1.30,0.72,g);    // combiné d'instruments
  const swTilt=new THREE.Group();swTilt.position.set(-0.45,1.18,0.52);swTilt.rotation.x=-0.95;
  const swSpin=new THREE.Group();swTilt.add(swSpin);
  const swRing=new THREE.Mesh(new THREE.TorusGeometry(0.17,0.026,8,18),dashMat);swSpin.add(swRing);
  bx(0.32,0.03,0.03,dashMat,0,0,0,swSpin);bx(0.03,0.17,0.03,dashMat,0,-0.08,0,swSpin);
  g.add(swTilt);g.userData.steerWheel=swSpin;

  bx(1.86,0.09,1.76,bodyMat,0,1.69,-0.13,g);
  for(const sx of[-0.91,0.91]){
    const pilA=bx(0.08,0.74,0.09,bodyMat,sx,1.36,0.91,g);pilA.rotation.x=-0.56;
    bx(0.08,0.62,0.11,trimMat,sx,1.36,-0.13,g);
    const pilC=bx(0.08,0.76,0.10,bodyMat,sx,1.36,-1.17,g);pilC.rotation.x=0.58;
  }

  bx(2.18,0.18,0.22,chromeMat,0,0.52,2.45,g);
  bx(2.18,0.18,0.22,chromeMat,0,0.52,-2.42,g);
  bx(1.06,0.24,0.08,trimMat,0,0.76,2.44,g);
  bx(0.98,0.04,0.09,chromeMat,0,0.80,2.44,g);
  bx(0.98,0.04,0.09,chromeMat,0,0.72,2.44,g);
  bx(0.24,0.12,0.15,bodyMat,-1.16,1.12,0.72,g);
  bx(0.24,0.12,0.15,bodyMat,1.16,1.12,0.72,g);
  bx(0.56,0.13,0.04,0xf8fafc,0,0.56,2.56,g);
  bx(0.56,0.13,0.04,0xfacc15,0,0.56,-2.53,g);

  const doorL=new THREE.Group();
  doorL.position.set(-1.06,0.79,0.55);
  bx(0.08,0.54,1.24,bodyMat,0,0,-0.62,doorL);
  bx(0.10,0.05,0.22,chromeMat,-0.02,0.16,-1.02,doorL);
  g.add(doorL);g.userData.doorL=doorL;
  const doorR=new THREE.Group();
  doorR.position.set(1.06,0.79,0.55);
  bx(0.08,0.54,1.24,bodyMat,0,0,-0.62,doorR);
  bx(0.10,0.05,0.22,chromeMat,0.02,0.16,-1.02,doorR);
  g.add(doorR);g.userData.doorR=doorR;

  g.userData.wheels=[];g.userData.steerPivots=[];
  for(const[wx,wz,isFront]of[[-1.04,1.48,true],[1.04,1.48,true],[-1.04,-1.48,false],[1.04,-1.48,false]]){
    const pivot=new THREE.Group();pivot.position.set(wx,0.44,wz);
    const wheelMesh=new THREE.Group();
    const tire=cyl(0.44,0.44,0.28,18,0x0f172a,0,0,0,wheelMesh);tire.rotation.z=PI/2;
    const rim=cyl(0.27,0.27,0.30,12,chromeMat,0,0,0,wheelMesh);rim.rotation.z=PI/2;
    bx(0.31,0.44,0.06,trimMat,0,0,0,wheelMesh);
    bx(0.31,0.06,0.44,trimMat,0,0,0,wheelMesh);
    pivot.add(wheelMesh);g.add(pivot);
    g.userData.wheels.push(wheelMesh);
    if(isFront)g.userData.steerPivots.push(pivot);
  }

  const hlMat=headlightMat;
  const brakeMat=new THREE.MeshBasicMaterial({color:0x7f1d1d});
  g.userData.brakeMat=brakeMat;
  g.userData.beams=[];
  for(const x of[-0.74,0.74]){
    bx(0.42,0.16,0.08,hlMat,x,0.82,2.44,g);
    bx(0.44,0.17,0.08,brakeMat,x,0.88,-2.37,g);
    const beam=new THREE.Mesh(new THREE.ConeGeometry(2.2,11,14,1,true),beamMat);
    beam.rotation.x=-PI/2;beam.position.set(x,0.55,7.8);g.add(beam);
    g.userData.beams.push(beam);
  }

  if(type==='suv'){
    bx(1.72,0.05,1.7,chromeMat,0,1.76,-0.13,g);                        // galerie de toit
    bx(0.05,0.12,1.7,chromeMat,-0.84,1.80,-0.13,g);bx(0.05,0.12,1.7,chromeMat,0.84,1.80,-0.13,g);
    bx(1.9,0.12,0.12,chromeMat,0,0.58,2.54,g);                          // pare-buffle
    const spare=cyl(0.4,0.4,0.2,14,0x0f172a,0,1.02,-2.56,g);spare.rotation.x=PI/2;
    const hub=cyl(0.24,0.24,0.22,10,chromeMat,0,1.02,-2.56,g);hub.rotation.x=PI/2;
  }
  if(type==='van'){
    bx(2.12,1.0,1.3,bodyMat,0,1.55,-1.7,g);                                   // caisse haute (minibus)
    bx(2.14,0.22,2.2,0x16a34a,0,1.2,-1.3,g);                                   // bande verte
    bx(0.04,0.5,0.9,glassMat,-1.07,1.65,-1.7,g);bx(0.04,0.5,0.9,glassMat,1.07,1.65,-1.7,g);
    bx(1.9,0.08,1.4,chromeMat,0,2.12,-1.7,g);                                  // galerie
  }
  if(type==='pickup'){
    for(const sx of[-1.0,1.0])bx(0.1,0.38,1.4,bodyMat,sx,1.22,-1.78,g);       // ridelles
    bx(2.0,0.38,0.08,bodyMat,0,1.22,-2.44,g);                                  // hayon
    bx(1.4,0.55,0.9,0x92400e,0,1.18,-1.8,g);                                   // chargement
    bx(1.0,0.4,0.6,0xd97706,0.2,1.65,-1.9,g);
  }
  if(type==='taxi'){
    bx(2.16,0.13,4.86,trimMat,0,0.82,0,g);
    bx(0.84,0.18,0.30,trimMat,0,1.82,-0.13,g);
    bx(0.76,0.14,0.32,new THREE.MeshBasicMaterial({color:0xfacc15}),0,1.82,-0.13,g);
  }else if(type==='cop'){
    bx(2.16,0.18,4.86,0x1d4ed8,0,0.80,0,g);
    g.userData.l1=bx(0.72,0.16,0.32,new THREE.MeshBasicMaterial({color:0xef4444}),-0.38,1.82,-0.13,g);
    g.userData.l2=bx(0.72,0.16,0.32,new THREE.MeshBasicMaterial({color:0x3b82f6}),0.38,1.82,-0.13,g);
  }else if(type==='vip'){
    bx(2.04,0.07,0.30,trimMat,0,1.16,-2.22,g);
    bx(0.10,0.16,0.16,trimMat,-0.78,1.08,-2.22,g);
    bx(0.10,0.16,0.16,trimMat,0.78,1.08,-2.22,g);
  }
  scene.add(g);return g;
}

// ===== PORTE D'ENTRÉE NATURELLE EN BOIS MOULURÉ
function buildNaturalDoor(G,lx,lz,dHalf,accentCol,interiorType,ox,oz,ds,ds2,enterableDoors){
  const pz=lz+dHalf;
  bx(3.2,0.14,1.2,0xcbd5e1,lx,0.33,pz+0.6,G);
  bx(2.8,0.14,0.7,0xe2e8f0,lx,0.47,pz+0.35,G);
  bx(2.4,3.4,0.28,0x451a03,lx,2.15,pz+0.06,G);
  bx(2.0,3.15,0.22,0x78350f,lx,2.05,pz+0.12,G);
  bx(1.4,1.1,0.25,0x92400e,lx,2.75,pz+0.13,G);
  bx(1.4,1.1,0.25,0x92400e,lx,1.42,pz+0.13,G);
  bx(1.9,0.45,0.24,new THREE.MeshStandardMaterial({color:0xbae6fd,emissive:0xfef08a,emissiveIntensity:0.35}),lx,3.42,pz+0.12,G);
  bx(0.12,0.32,0.14,new THREE.MeshStandardMaterial({color:0xfacc15,metalness:0.85,roughness:0.2}),lx+0.72,1.85,pz+0.26,G);
  bx(3.4,0.42,0.18,0x0f172a,lx,4.15,pz+0.2,G);
  bx(3.2,0.08,0.20,new THREE.MeshBasicMaterial({color:accentCol}),lx,3.96,pz+0.22,G);

  const pad=new THREE.Mesh(new THREE.RingGeometry(0.95,1.35,28),new THREE.MeshBasicMaterial({color:accentCol,side:THREE.DoubleSide,transparent:true,opacity:0.78}));
  pad.rotation.x=-PI/2;pad.position.set(lx,0.28,pz+1.8);G.add(pad);ds2.push(pad.geometry);

  const doorObj={x:ox+lx,z:oz+pz+1.8,type:interiorType};
  ds.push(doorObj);enterableDoors.push(doorObj);
}

// ===== GÉNÉRATION DE LA VILLE
const chunks={},pend=[],PALETTE=[0xf1f5f9,0xfde68a,0xe2e8f0,0xfed7aa,0xdbeafe,0xfecdd3];
const buildingMats=[],enterableDoors=[],buildingWindows=[];

function addTree(G,tx,tz,ds2,isPalm=false){
  if(isPalm){
    cyl(0.16,0.26,5.8,8,0x6d4c41,tx,3.1,tz,G);
    for(let a=0;a<5;a++){
      const frond=new THREE.Mesh(new THREE.ConeGeometry(1.7,2.4,6),mt(0x15803d,0.8));
      frond.position.set(tx+Math.cos(a*1.25)*0.6,6.1,tz+Math.sin(a*1.25)*0.6);
      frond.rotation.z=0.35;frond.rotation.y=a*1.25;G.add(frond);ds2.push(frond.geometry);
    }
  }else{
    cyl(0.24,0.38,4.0,8,0x5d4037,tx,2.2,tz,G);
    const crown=new THREE.Mesh(new THREE.DodecahedronGeometry(2.4,1),mt(0x1b5e20,0.85));
    crown.position.set(tx,4.9,tz);G.add(crown);ds2.push(crown.geometry);
  }
}

function createChunk(cx,cz){
  const G=new THREE.Group(),bs=[],ds=[],ds2=[],ox=cx*CS,oz=cz*CS;
  G.position.set(ox,0,oz);
  const gr=new THREE.Mesh(PG,roadMat);gr.rotation.x=-PI/2;gr.position.set(40,0,40);gr.receiveShadow=true;G.add(gr);
  bx(62,0.26,62,0x94a3b8,40,0.13,40,G);

  for(const[lx,lz]of[[11,11],[69,11],[11,69],[69,69]]){
    cyl(0.11,0.16,6.4,8,0x334155,lx,3.4,lz,G);
    addSignalHead(G,lx,lz,'x',lx<40?1:-1);addSignalHead(G,lx,lz,'z',lz<40?1:-1);
    bx(0.85,0.18,0.34,lampBulbMat,lx+(lx<40?0.35:-0.35),6.55,lz,G);
    const cone=new THREE.Mesh(new THREE.ConeGeometry(4.8,6.2,12,1,true),lampGlowMat);
    cone.position.set(lx+(lx<40?0.35:-0.35),3.3,lz);G.add(cone);ds2.push(cone.geometry);
  }
  addTree(G,11,40,ds2,true);
  addTree(G,69,40,ds2,true);
  addTree(G,40,11,ds2,false);

  if(typeof EXTRAS_CHUNK==='function'&&EXTRAS_CHUNK(cx,cz,G,bs,ds,ds2,ox,oz)){
    scene.add(G);chunks[cx+','+cz]={G,bs,ds,ds2};return;
  }
  if(cx===6&&cz===5){
    gr.visible=false;   // le lac a un vrai fond : on retire la dalle de route
    const gm=mt(0x2e7d32,0.95,0);
    bx(58,2,6,gm,40,-0.72,14,G);bx(58,2,6,gm,40,-0.72,66,G);bx(6,2,46,gm,14,-0.72,40,G);bx(6,2,46,gm,66,-0.72,40,G);
    bx(70,2,9,gm,40,-0.72,4.5,G);bx(70,2,9,gm,40,-0.72,75.5,G);bx(9,2,70,gm,4.5,-0.72,40,G);bx(9,2,70,gm,75.5,-0.72,40,G);
    bx(46,0.2,46,0xc9b57c,40,-1.6,40,G);bx(46,0.1,46,0x3b6e8a,40,-1.45,40,G);
    if(typeof makeLakeWater==='function')makeLakeWater(G,ox,oz,ds2);
    for(const[tx,tz]of[[14,14],[66,14],[14,66],[66,66]])addTree(G,tx,tz,ds2,true);
    scene.add(G);chunks[cx+','+cz]={G,bs,ds,ds2};return;
  }

  if(cx===4&&cz===4){
    bx(56,0.34,56,0x9a4b26,40,0.17,40,G);
    bx(48,0.4,48,0xe2e8f0,40,0.2,40,G);
    for(let k=0;k<9;k++){
      const r=8.5-k*0.65;
      const seg=cyl(r*0.85,r,3.2,16,k%2?0xd97706:0xf59e0b,40,2.0+k*3.1,40,G);
      seg.rotation.y=k*0.3;
    }
    cyl(0.4,1.8,5,12,new THREE.MeshBasicMaterial({color:0xfcd116}),40,30.7,40,G);
    for(const[tx,tz]of[[14,14],[66,14],[14,66],[66,66]])addTree(G,tx,tz,ds2,true);
    bs.push([ox+34,oz+34,ox+46,oz+46]);
    scene.add(G);chunks[cx+','+cz]={G,bs,ds,ds2};return;
  }

  if(cx===2&&cz===4){
    bx(28,0.34,24,0x475569,25,0.17,25,G);
    bx(20,0.6,14,0xdc2626,25,6.4,25,G);
    bx(20.4,0.3,14.4,new THREE.MeshBasicMaterial({color:0xfacc15}),25,6.8,25,G);
    for(const px of[17,33])for(const pz of[20,30])cyl(0.35,0.35,6,10,0xf8fafc,px,3.2,pz,G);
    bx(1.4,2.4,1.0,0xef4444,21,1.5,25,G);
    bx(1.4,2.4,1.0,0x2563eb,29,1.5,25,G);
    addTree(G,55,55,ds2,false);
    scene.add(G);chunks[cx+','+cz]={G,bs,ds,ds2};return;
  }

  if(cx===5&&cz===3){   // MARCHÉ
    bx(60,0.3,60,0x8b6b4a,40,0.15,40,G);
    const awn=[0xdc2626,0x2563eb,0x16a34a,0xea580c,0xfacc15,0xa855f7];
    for(let r=0;r<3;r++)for(let k=0;k<4;k++){
      const sx=16+k*16,sz=18+r*22,ac=awn[(r*4+k)%awn.length];
      for(const[px,pz]of[[-3,-2],[3,-2],[-3,2],[3,2]])cyl(0.1,0.1,3,6,0x5d4037,sx+px,1.6,sz+pz,G);
      bx(7.4,0.18,5.2,ac,sx,3.2,sz,G);
      bx(5.4,0.9,2.2,0x78350f,sx,0.75,sz,G);
      for(let q=0;q<3;q++)bx(0.7,0.55,0.7,[0xf97316,0x84cc16,0xef4444][q],sx-1.8+q*1.8,1.45,sz,G);
      bs.push([ox+sx-3.2,oz+sz-1.3,ox+sx+3.2,oz+sz+1.3]);
    }
    scene.add(G);chunks[cx+','+cz]={G,bs,ds,ds2};return;
  }
  if((cx===1&&cz===2)||(cx===7&&cz===7)||(cx===2&&cz===7)){   // QUARTIER POPULAIRE
    bx(60,0.3,60,0x7c5b3b,40,0.15,40,G);
    for(let r=0;r<3;r++)for(let k=0;k<3;k++){
      const hh=hs(cx*7+r,cz*13+k),hx=17+k*23,hz=17+r*23,wd=8+hh%4,dp=7+(hh>>>3)%3,ht=3.2+(hh>>>5)%2*0.6;
      const wall=[0xd6b98c,0xbfa27a,0xe7c9a0,0xa7c4b5][hh%4];
      bx(wd,ht,dp,wall,hx,ht/2+0.3,hz,G);
      const roof=bx(wd+1,0.2,dp+1,0x9a3412,hx,ht+0.5,hz,G);roof.rotation.z=0.1;   // toit en tôle
      bx(1.2,2.1,0.12,0x1f2937,hx,1.35,hz+dp/2+0.06,G);
      bx(1.0,0.9,0.12,0x38bdf8,hx+2.4,2.0,hz+dp/2+0.06,G);
      bs.push([ox+hx-wd/2,oz+hz-dp/2,ox+hx+wd/2,oz+hz+dp/2]);
    }
    addTree(G,8,40,ds2,true);addTree(G,72,40,ds2,true);
    scene.add(G);chunks[cx+','+cz]={G,bs,ds,ds2};return;
  }

  for(let i=0;i<4;i++){
    const h=hs(cx*11+i,cz*17+i*5),lx=25+(i%2)*30,lz=25+(i>>1)*30,t=h%10,col=PALETTE[h%PALETTE.length];

    if(cx===3&&cz===3&&i===0){
      bx(20,8.2,16,0x1e293b,lx,4.36,lz,G);
      bx(20.6,0.8,16.6,0x0f172a,lx,8.6,lz,G);
      const winPane=bx(6.4,2.2,0.15,new THREE.MeshStandardMaterial({color:0x38bdf8,transparent:true,opacity:0.55,roughness:0.1}),lx-5.2,2.1,lz+8.05,G);
      const winObj={mesh:winPane,x:ox+lx-5.2,z:oz+lz+8.05,broken:false};
      ds.push(winObj);buildingWindows.push(winObj);

      buildNaturalDoor(G,lx,lz,8.0,0x38bdf8,'armory',ox,oz,ds,ds2,enterableDoors);
      bs.push([ox+lx-10,oz+lz-8,ox+lx+10,oz+lz+8]);
      continue;
    }

    if(cx===3&&cz===3&&i===1){
      bx(20,8.6,16,0x312e81,lx,4.56,lz,G);
      bx(20.6,0.8,16.6,0x1e1b4b,lx,9.0,lz,G);
      const winPane=bx(6.4,2.2,0.15,new THREE.MeshStandardMaterial({color:0xa855f7,transparent:true,opacity:0.55,roughness:0.1}),lx+5.2,2.1,lz+8.05,G);
      const winObj={mesh:winPane,x:ox+lx+5.2,z:oz+lz+8.05,broken:false};
      ds.push(winObj);buildingWindows.push(winObj);

      buildNaturalDoor(G,lx,lz,8.0,0xa855f7,'gym',ox,oz,ds,ds2,enterableDoors);
      bs.push([ox+lx-10,oz+lz-8,ox+lx+10,oz+lz+8]);
      continue;
    }

    if(cx===4&&cz===3&&i===0){
      bx(20,7.8,16,0x9a3412,lx,4.16,lz,G);
      bx(20.6,0.8,16.6,0x431407,lx,8.2,lz,G);
      const winPane=bx(6.4,2.2,0.15,new THREE.MeshStandardMaterial({color:0xfb923c,transparent:true,opacity:0.55,roughness:0.1}),lx-5.2,2.1,lz+8.05,G);
      const winObj={mesh:winPane,x:ox+lx-5.2,z:oz+lz+8.05,broken:false};
      ds.push(winObj);buildingWindows.push(winObj);

      buildNaturalDoor(G,lx,lz,8.0,0xf97316,'restaurant',ox,oz,ds,ds2,enterableDoors);
      bs.push([ox+lx-10,oz+lz-8,ox+lx+10,oz+lz+8]);
      continue;
    }

    if(t<3){
      bx(25,0.34,25,0x8d4925,lx,0.17,lz,G);
      bx(22,0.38,22,0x2e7d32,lx,0.19,lz,G);
      for(let j=0;j<4;j++){
        const tx=lx-7+(j%2)*14+((h>>j)&3)-1,tz=lz-7+(j>>1)*14;
        addTree(G,tx,tz,ds2,j%2===0);
      }
    }else{
      const isHouse=t<6,w=isHouse?15:21+h%4,d=isHouse?13:21+(h>>>3)%4,ht=isHouse?7.2:16+(h>>>4)%24;
      const tx=facadeTex.clone();tx.needsUpdate=true;tx.repeat.set(w/10,ht/10);
      const em=windowGlowTex.clone();em.needsUpdate=true;em.repeat.set(w/10,ht/10);
      const sm=new THREE.MeshStandardMaterial({
        map:tx,emissiveMap:em,emissive:new THREE.Color(0xffd166),emissiveIntensity:0.15,
        color:col,roughness:0.72
      });
      const rm=mt(isHouse?0x881337:0x334155,0.85);
      ds.push(tx,em,sm);buildingMats.push(sm);
      const m=bx(w,ht,d,sm,lx,ht/2+0.26,lz,G);m.material=[sm,sm,rm,rm,sm,sm];
      bx(w+0.8,0.7,d+0.8,0x334155,lx,ht+0.61,lz,G);
      if(!isHouse){
        bx(3,1.6,3,0x64748b,lx-w/4,ht+1.7,lz-d/4,G);                       // local technique
        cyl(0.07,0.07,4.5,6,0x94a3b8,lx+w/4,ht+3,lz+d/4,G);               // antenne
        bx(w*0.7,0.18,1.4,[0xdc2626,0x2563eb,0x16a34a,0xea580c][h%4],lx,3.6,lz+d/2+0.7,G);  // auvent boutique
      }
      bs.push([ox+lx-w/2,oz+lz-d/2,ox+lx+w/2,oz+lz+d/2]);
      if(isHouse){
        const roof=new THREE.Mesh(new THREE.ConeGeometry(11.8,4.6,4),mt(0x881337,0.8));
        roof.rotation.y=PI/4;roof.position.set(lx,ht+2.86,lz);G.add(roof);ds2.push(roof.geometry);
        const winPane=bx(3.2,1.8,0.14,new THREE.MeshStandardMaterial({color:0x38bdf8,transparent:true,opacity:0.55,roughness:0.1}),lx-4.2,2.2,lz+d/2+0.05,G);
        const winObj={mesh:winPane,x:ox+lx-4.2,z:oz+lz+d/2+0.05,broken:false};
        ds.push(winObj);buildingWindows.push(winObj);

        buildNaturalDoor(G,lx,lz,d/2,0x14b8a6,'villa',ox,oz,ds,ds2,enterableDoors);
      }
    }
  }
  scene.add(G);chunks[cx+','+cz]={G,bs,ds,ds2};
}

function removeChunk(k){
  const c=chunks[k];scene.remove(c.G);
  for(const o of c.ds){
    const idx=buildingMats.indexOf(o);
    if(idx>=0)buildingMats.splice(idx,1);
    const dIdx=enterableDoors.indexOf(o);
    if(dIdx>=0)enterableDoors.splice(dIdx,1);
    const wIdx=buildingWindows.indexOf(o);
    if(wIdx>=0)buildingWindows.splice(wIdx,1);
    if(o.dispose)o.dispose();
  }
  for(const g of c.ds2)g.dispose();
  delete chunks[k];
}
function streamChunks(all,px,pz){
  const pc=cl(Math.floor(px/CS),0,NB-1),pz2=cl(Math.floor(pz/CS),0,NB-1);
  for(const k in chunks){const[a,b]=k.split(',').map(Number);if(Math.abs(a-pc)>2||Math.abs(b-pz2)>2)removeChunk(k);}
  pend.length=0;
  for(let r=0;r<=2;r++)for(let a=pc-r;a<=pc+r;a++)for(let b=pz2-r;b<=pz2+r;b++)
    if(a>=0&&b>=0&&a<NB&&b<NB&&!chunks[a+','+b]&&Math.max(Math.abs(a-pc),Math.abs(b-pz2))===r)pend.push([a,b]);
  if(all)while(pend.length){const p=pend.shift();createChunk(p[0],p[1]);}
}
function hitBuilding(e,r){
  let h=0;const a=Math.floor(e.x/CS),b=Math.floor(e.z/CS);
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){
    const c=chunks[(a+i)+','+(b+j)];if(!c)continue;
    for(const q of c.bs){
      const x=cl(e.x,q[0],q[2]),z=cl(e.z,q[1],q[3]),dx=e.x-x,dz=e.z-z,d2=dx*dx+dz*dz;
      if(d2<r*r){if(d2>1e-6){const d=Math.sqrt(d2);e.x+=dx/d*(r-d);e.z+=dz/d*(r-d);}else e.x+=r;h=1;}
    }
  }
  if(typeof VENDORS!=='undefined')for(const v of VENDORS){
    const dx=e.x-v.x,dz=e.z-v.z,d2=dx*dx+dz*dz,rr=r+1.2;
    if(d2<rr*rr&&d2>1e-6){const d=Math.sqrt(d2);e.x+=dx/d*(rr-d);e.z+=dz/d*(rr-d);h=1;}
  }
  e.x=cl(e.x,3,WS-3);e.z=cl(e.z,3,WS-3);return h;
}
function rayWall(ox,oz,fx,fz,maxD){
  let best=maxD;const a=Math.floor(ox/CS),b=Math.floor(oz/CS);
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){
    const c=chunks[(a+i)+','+(b+j)];if(!c)continue;
    for(const q of c.bs){
      let tmin=0,tmax=best;
      if(Math.abs(fx)<1e-6){if(ox<q[0]||ox>q[2])continue;}
      else{let t1=(q[0]-ox)/fx,t2=(q[2]-ox)/fx;if(t1>t2)[t1,t2]=[t2,t1];tmin=Math.max(tmin,t1);tmax=Math.min(tmax,t2);if(tmin>tmax)continue;}
      if(Math.abs(fz)<1e-6){if(oz<q[1]||oz>q[3])continue;}
      else{let t1=(q[1]-oz)/fz,t2=(q[3]-oz)/fz;if(t1>t2)[t1,t2]=[t2,t1];tmin=Math.max(tmin,t1);tmax=Math.min(tmax,t2);if(tmin>tmax)continue;}
      if(tmin<best)best=tmin;
    }
  }
  return best;
}
