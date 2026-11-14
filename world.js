'use strict';
const PI=Math.PI,R=Math.random,cl=(v,a,b)=>Math.max(a,Math.min(b,v)),rn=(a,b)=>a+R()*(b-a);
const hs=(a,b)=>((a*73856093)^(b*19349663))>>>0;
const angd=(a,b)=>{let d=a-b;while(d>PI)d-=2*PI;while(d<-PI)d+=2*PI;return d};
const CS=80,NB=10,WS=CS*NB,IX=5000,IZ=5000;
const MON_X=4*CS+40,MON_Z=4*CS+40;
const SHOP_X=3*CS+24,SHOP_Z=3*CS+33;
const GAS_X=2*CS+25,GAS_Z=4*CS+25;

const touch=matchMedia('(pointer:coarse)').matches;
if(touch)document.body.classList.add('t');

const ren=new THREE.WebGLRenderer({antialias:!touch,powerPreference:'high-performance'});
ren.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
document.body.prepend(ren.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8ecae6);
scene.fog=new THREE.FogExp2(0x8ecae6,0.0046);
const cam=new THREE.PerspectiveCamera(62,1,0.3,240);

const hemi=new THREE.HemisphereLight(0xfff8e7,0x64748b,0.92);
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffeed4,0.98);
sun.position.set(60,120,50);
scene.add(sun);

function onResize(){ren.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();}
onResize();addEventListener('resize',onResize);

// ===== MATÉRIAUX & TEXTURES RÉALISTES (AVEC ÉCLAIRAGE NOCTURNE DES IMMEUBLES)
const MC={},GC={},mt=(c,r=0.82,m=0.08)=>MC[c+'_'+r+'_'+m]||(MC[c+'_'+r+'_'+m]=new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m}));
function bx(w,h,d,c,x,y,z,p){
  const k=w+'_'+h+'_'+d,m=new THREE.Mesh(GC[k]||(GC[k]=new THREE.BoxGeometry(w,h,d)),typeof c==='object'?c:mt(c));
  m.position.set(x,y,z);(p||scene).add(m);return m;
}
function cyl(rt,rb,h,seg,c,x,y,z,p){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),typeof c==='object'?c:mt(c));
  m.position.set(x,y,z);(p||scene).add(m);return m;
}
function makeTex(fn,w,h){
  const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'));
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
}

// Façade d'immeuble jour + carte émissive nocturne pour que la ville brille la nuit
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

// Texture de route bitumée avec marquage jaune, bandes blanches et passages piétons
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

// ===== PERSONNAGES ANATOMIQUES ARTICULÉS
function buildHuman(shirtCol,skinCol,role){
  const g=new THREE.Group(),u={};
  const pants=role==='cop'?0x1e293b:role==='bir'?0x2d4a22:0x334155;

  bx(0.52,0.22,0.3,pants,0,0.88,0,g);
  bx(0.54,0.06,0.32,0x111111,0,0.97,0,g);

  const legL=new THREE.Group();legL.position.set(-0.15,0.86,0);
  cyl(0.115,0.09,0.76,10,pants,0,-0.38,0,legL);
  bx(0.16,0.12,0.29,0x111111,0,-0.8,0.05,legL);
  g.add(legL);u.legL=legL;

  const legR=new THREE.Group();legR.position.set(0.15,0.86,0);
  cyl(0.115,0.09,0.76,10,pants,0,-0.38,0,legR);
  bx(0.16,0.12,0.29,0x111111,0,-0.8,0.05,legR);
  g.add(legR);u.legR=legR;

  cyl(0.28,0.23,0.68,12,shirtCol,0,1.32,0,g);
  if(role==='cop'||role==='bir')bx(0.54,0.48,0.36,role==='bir'?0x1a2e16:0x0f172a,0,1.35,0,g);
  cyl(0.09,0.1,0.14,10,skinCol,0,1.72,0,g);

  const head=new THREE.Mesh(new THREE.SphereGeometry(0.21,14,12),mt(skinCol,0.65));
  head.position.set(0,1.94,0);g.add(head);
  bx(0.045,0.035,0.03,0x111111,-0.07,1.96,0.195,g);
  bx(0.045,0.035,0.03,0x111111,0.07,1.96,0.195,g);

  if(role==='bir'||role==='cop'){
    cyl(0.22,0.22,0.11,12,role==='bir'?0xb91c1c:0x0f172a,0,2.08,0,g);
    bx(0.24,0.04,0.18,0x0f172a,0,2.04,0.16,g);
  }else if(role==='mama'){
    const scarf=new THREE.Mesh(new THREE.SphereGeometry(0.225,12,10),mt(0xe91e63,0.7));
    scarf.position.set(0,1.99,-0.02);g.add(scarf);
  }else{
    const hair=new THREE.Mesh(new THREE.SphereGeometry(0.215,12,10,0,PI*2,0,PI*0.58),mt(0x14110f,0.85));
    hair.position.set(0,1.96,-0.01);g.add(hair);
  }

  const armL=new THREE.Group();armL.position.set(-0.34,1.58,0);
  cyl(0.082,0.07,0.32,8,shirtCol,0,-0.16,0,armL);
  cyl(0.068,0.058,0.34,8,skinCol,0,-0.46,0,armL);
  g.add(armL);u.armL=armL;

  const armR=new THREE.Group();armR.position.set(0.34,1.58,0);
  cyl(0.082,0.07,0.32,8,shirtCol,0,-0.16,0,armR);
  cyl(0.068,0.058,0.34,8,skinCol,0,-0.46,0,armR);
  const gun=new THREE.Group();gun.position.set(0,-0.62,0.14);
  bx(0.07,0.11,0.44,0x18181b,0,0.04,0.14,gun);
  bx(0.065,0.14,0.08,0x27272a,0,-0.05,-0.02,gun);
  // Laser rouge de visée attaché au canon
  const laser=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,26,6),new THREE.MeshBasicMaterial({color:0xff1744,transparent:true,opacity:0.75}));
  laser.rotation.x=PI/2;laser.position.set(0,0.04,13.2);laser.visible=false;
  gun.add(laser);u.laser=laser;
  gun.visible=false;
  armR.add(gun);u.armR=armR;u.gun=gun;
  g.add(armR);

  g.userData=u;scene.add(g);return g;
}

function swingLimbs(g,t,amp){
  const u=g.userData,s=Math.sin(t)*amp;
  u.legL.rotation.x=s;
  u.legR.rotation.x=-s;
  u.armL.rotation.x=-s*0.85;
  u.armR.rotation.x=u.gun.visible?-1.35:s*0.85;
}

// ===== VÉHICULES 3D HAUTE FINITION (CARROSSERIE SCULPTÉE, VITRES INCLINÉES, PHARES, FEUX STOP)
const beamMat=new THREE.MeshBasicMaterial({color:0xfef9c3,transparent:true,opacity:0.16,depthWrite:false,side:THREE.DoubleSide});
const lampGlowMat=new THREE.MeshBasicMaterial({color:0xfef08a,transparent:true,opacity:0.16,depthWrite:false,side:THREE.DoubleSide});

function buildVehicle(col,type){
  const g=new THREE.Group();
  const bodyMat=new THREE.MeshStandardMaterial({color:col,roughness:0.24,metalness:0.5});
  const glassMat=new THREE.MeshStandardMaterial({color:0x0b132b,roughness:0.08,metalness:0.88});
  const chromeMat=new THREE.MeshStandardMaterial({color:0xe2e8f0,roughness:0.2,metalness:0.85});

  if(type==='moto'){
    bx(0.42,0.46,1.85,bodyMat,0,0.72,0,g);
    bx(0.38,0.22,0.65,0x111111,0,0.96,-0.25,g);
    const w1=cyl(0.38,0.38,0.18,16,0x111111,0,0.38,0.74,g);w1.rotation.z=PI/2;
    const w2=cyl(0.38,0.38,0.18,16,0x111111,0,0.38,-0.74,g);w2.rotation.z=PI/2;
    bx(0.92,0.07,0.1,chromeMat,0,1.16,0.58,g);
    bx(0.22,0.22,0.08,new THREE.MeshBasicMaterial({color:0xfef9c3}),0,1.02,0.94,g);
    const b1=new THREE.Mesh(new THREE.ConeGeometry(1.8,9,12,1,true),beamMat);
    b1.rotation.x=-PI/2;b1.position.set(0,0.65,5.4);g.add(b1);
    g.userData.beams=[b1];
    scene.add(g);return g;
  }

  // Châssis & bas de caisse profilés
  bx(2.16,0.42,4.78,0x111827,0,0.44,0,g);
  bx(2.22,0.56,4.84,bodyMat,0,0.86,0,g);
  // Capot avant sculpté & coffre arrière
  bx(2.08,0.16,1.45,bodyMat,0,1.16,1.56,g);
  bx(2.08,0.14,1.05,bodyMat,0,1.15,-1.76,g);

  // Habitacle avec pare-brise incliné, vitres latérales et toit
  const cabin=bx(1.94,0.64,2.24,glassMat,0,1.48,-0.12,g);
  cabin.scale.set(0.96,1,1);
  bx(1.92,0.11,2.08,bodyMat,0,1.84,-0.12,g);
  // Montants de toit peints
  for(const sx of[-0.92,0.92])for(const sz of[-0.12])bx(0.08,0.64,0.16,bodyMat,sx,1.48,sz,g);

  // Rétroviseurs, pare-chocs chromés, calandre & plaques
  bx(0.24,0.13,0.15,bodyMat,-1.22,1.26,0.78,g);
  bx(0.24,0.13,0.15,bodyMat,1.22,1.26,0.78,g);
  bx(2.26,0.2,0.22,chromeMat,0,0.56,2.42,g);
  bx(2.26,0.2,0.22,chromeMat,0,0.56,-2.42,g);
  bx(1.02,0.24,0.08,0x0f172a,0,0.84,2.43,g);
  bx(0.58,0.14,0.05,0xf8fafc,0,0.62,2.54,g);
  bx(0.58,0.14,0.05,0xfacc15,0,0.62,-2.54,g);

  // 4 Roues larges avec jantes alliage
  for(const[wx,wz]of[[-1.1,1.48],[1.1,1.48],[-1.1,-1.48],[1.1,-1.48]]){
    const tire=cyl(0.45,0.45,0.3,18,0x0f172a,wx,0.45,wz,g);tire.rotation.z=PI/2;
    const rim=cyl(0.27,0.27,0.32,12,chromeMat,wx,0.45,wz,g);rim.rotation.z=PI/2;
  }

  // Phares avant lumineux + faisceaux projetés sur la route + feux stop dynamiques
  const hlMat=new THREE.MeshBasicMaterial({color:0xfef9c3});
  const brakeMat=new THREE.MeshBasicMaterial({color:0x991b1b});
  g.userData.brakeMat=brakeMat;
  g.userData.beams=[];
  for(const x of[-0.74,0.74]){
    bx(0.46,0.19,0.08,hlMat,x,0.92,2.43,g);
    bx(0.48,0.2,0.08,brakeMat,x,0.92,-2.43,g);
    const beam=new THREE.Mesh(new THREE.ConeGeometry(2.2,11,14,1,true),beamMat);
    beam.rotation.x=-PI/2;beam.position.set(x,0.55,7.8);g.add(beam);
    g.userData.beams.push(beam);
  }

  if(type==='taxi'){
    bx(2.25,0.15,4.86,0x111111,0,0.94,0,g);
    bx(0.92,0.22,0.34,0x111111,0,1.98,-0.1,g);
    bx(0.84,0.16,0.36,new THREE.MeshBasicMaterial({color:0xfacc15}),0,1.98,-0.1,g);
  }else if(type==='cop'){
    bx(2.25,0.22,4.86,0x1d4ed8,0,0.9,0,g);
    g.userData.l1=bx(0.76,0.2,0.36,new THREE.MeshBasicMaterial({color:0xff1744}),-0.42,1.98,-0.1,g);
    g.userData.l2=bx(0.76,0.2,0.36,new THREE.MeshBasicMaterial({color:0x2979ff}),0.42,1.98,-0.1,g);
  }else if(type==='vip'){
    // Aileron sport + double échappement
    bx(2.14,0.08,0.35,0x111111,0,1.38,-2.18,g);
    bx(0.12,0.22,0.18,0x111111,-0.82,1.26,-2.18,g);
    bx(0.12,0.22,0.18,0x111111,0.82,1.26,-2.18,g);
  }
  scene.add(g);return g;
}

// ===== GÉNÉRATION DES QUARTIERS AVEC ÉCLAIRAGE NOCTURNE RICHESSE VISUELLE
const chunks={},pend=[],PALETTE=[0xf1f5f9,0xfde68a,0xe2e8f0,0xfed7aa,0xdbeafe,0xfecdd3];
const buildingMats=[];

function createChunk(cx,cz){
  const G=new THREE.Group(),bs=[],ds=[],ds2=[],ox=cx*CS,oz=cz*CS;
  G.position.set(ox,0,oz);
  const gr=new THREE.Mesh(PG,roadMat);gr.rotation.x=-PI/2;gr.position.set(40,0,40);G.add(gr);
  bx(62,0.26,62,0x94a3b8,40,0.13,40,G);

  // Lampadaires urbains avec halo lumineux au sol pour éclairer la ville la nuit
  for(const[lx,lz]of[[11,11],[69,11],[11,69],[69,69]]){
    cyl(0.11,0.16,6.4,8,0x334155,lx,3.2,lz,G);
    bx(0.85,0.18,0.34,new THREE.MeshBasicMaterial({color:0xfef08a}),lx+(lx<40?0.35:-0.35),6.35,lz,G);
    const cone=new THREE.Mesh(new THREE.ConeGeometry(4.8,6.2,12,1,true),lampGlowMat);
    cone.position.set(lx+(lx<40?0.35:-0.35),3.1,lz);G.add(cone);ds2.push(cone.geometry);
  }

  // Place du Monument de la Réunification (chunk 4,4)
  if(cx===4&&cz===4){
    bx(56,0.34,56,0x9a4b26,40,0.17,40,G);
    bx(48,0.4,48,0xe2e8f0,40,0.2,40,G);
    for(let k=0;k<9;k++){
      const r=8.5-k*0.65;
      const seg=cyl(r*0.85,r,3.2,16,k%2?0xd97706:0xf59e0b,40,1.8+k*3.1,40,G);
      seg.rotation.y=k*0.3;
    }
    cyl(0.4,1.8,5,12,new THREE.MeshBasicMaterial({color:0xfcd116}),40,30.5,40,G);
    bs.push([ox+34,oz+34,ox+46,oz+46]);
    scene.add(G);chunks[cx+','+cz]={G,bs,ds,ds2};return;
  }

  // Station-Service & Garage Réparation (chunk 2,4) avec auvent lumineux
  if(cx===2&&cz===4){
    bx(28,0.34,24,0x475569,25,0.17,25,G);
    bx(20,0.6,14,0xdc2626,25,6.2,25,G);
    bx(20.4,0.3,14.4,new THREE.MeshBasicMaterial({color:0xfacc15}),25,6.6,25,G);
    for(const px of[17,33])for(const pz of[20,30])cyl(0.35,0.35,6,10,0xf8fafc,px,3,pz,G);
    bx(1.4,2.4,1.0,0xef4444,21,1.3,25,G);
    bx(1.4,2.4,1.0,0x2563eb,29,1.3,25,G);
    scene.add(G);chunks[cx+','+cz]={G,bs,ds,ds2};return;
  }

  for(let i=0;i<4;i++){
    const h=hs(cx*11+i,cz*17+i*5),lx=25+(i%2)*30,lz=25+(i>>1)*30,t=h%10,col=PALETTE[h%PALETTE.length];
    if(cx===3&&cz===3&&i===0){
      bx(20,7.5,16,0x1e293b,lx,3.75,lz,G);
      bx(20.6,1.2,16.6,new THREE.MeshBasicMaterial({color:0xfacc15}),lx,7.8,lz,G);
      bx(13,1.5,0.4,new THREE.MeshBasicMaterial({color:0x00e676}),lx,5.8,lz+8.2,G);
      bx(3.2,3.8,0.4,0xff4081,lx,1.9,lz+8.2,G);
      bs.push([ox+lx-10,oz+lz-8,ox+lx+10,oz+lz+8]);
      continue;
    }
    if(t<3){
      bx(25,0.34,25,0x8d4925,lx,0.17,lz,G);
      bx(22,0.38,22,0x2e7d32,lx,0.19,lz,G);
      for(let j=0;j<4;j++){
        const tx=lx-7+(j%2)*14+((h>>j)&3)-1,tz=lz-7+(j>>1)*14;
        cyl(0.28,0.42,4.2,8,0x5d4037,tx,2.2,tz,G);
        const crown=new THREE.Mesh(new THREE.DodecahedronGeometry(2.6,1),mt(0x1b5e20,0.85));
        crown.position.set(tx,5.0,tz);G.add(crown);ds2.push(crown.geometry);
      }
    }else{
      const isHouse=t<6,w=isHouse?15:21+h%4,d=isHouse?13:21+(h>>3)%4,ht=isHouse?7.2:16+(h>>4)%24;
      const tx=facadeTex.clone();tx.needsUpdate=true;tx.repeat.set(w/10,ht/10);
      const em=windowGlowTex.clone();em.needsUpdate=true;em.repeat.set(w/10,ht/10);
      const sm=new THREE.MeshStandardMaterial({
        map:tx,emissiveMap:em,emissive:new THREE.Color(0xffd166),emissiveIntensity:0.15,
        color:col,roughness:0.72
      });
      const rm=mt(isHouse?0x881337:0x334155,0.85);
      ds.push(tx,em,sm);buildingMats.push(sm);
      const m=bx(w,ht,d,sm,lx,ht/2,lz,G);m.material=[sm,sm,rm,rm,sm,sm];
      bx(w+0.8,0.7,d+0.8,0x334155,lx,ht+0.35,lz,G);
      bs.push([ox+lx-w/2,oz+lz-d/2,ox+lx+w/2,oz+lz+d/2]);
      if(isHouse){
        const roof=new THREE.Mesh(new THREE.ConeGeometry(11.8,4.6,4),mt(0x881337,0.8));
        roof.rotation.y=PI/4;roof.position.set(lx,ht+2.6,lz);G.add(roof);ds2.push(roof.geometry);
        bx(2.2,3.4,0.35,0xb91c1c,lx,1.7,lz+d/2+0.18,G);
        bx(0.8,0.8,0.8,new THREE.MeshBasicMaterial({color:0xfacc15}),lx,4.4,lz+d/2+0.45,G);
        ds.push({x:ox+lx,z:oz+lz+d/2+1.8});
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
