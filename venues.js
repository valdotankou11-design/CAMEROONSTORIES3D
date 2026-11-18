'use strict';
// =====================================================================
//  LIEUX DE VIE : hôpital, maquis, cabaret, boutique de mode, maisons variées
//  Chaque lieu a ses actions (s'asseoir, boire, danser, jouer…) et ses fonctions.
// =====================================================================
(function(){
const F=EX.F;
const rr=F.rr,clp=F.clp,fmt=F.fmt;
window.VENUE_SPOTS={};window.SPOT_HANDLERS={};window.VENUE_NAMES={};window.VENUE_DOOR={};
window.EXTRA_LIGHT_TYPES=new Set();
const once={};
const guardV=(l,fn)=>function(){try{return fn.apply(this,arguments);}catch(e){if(!once[l]){once[l]=1;console.error('[VENUES '+l+']',e);}}};
const built={};
const dummy=[];

function reg(type,ix,iz,W,D,obs,spots,name,door,light){
  INTERIORS[type]={ix:ix,iz:iz,w:W,d:D,obs:obs};
  VENUE_SPOTS[type]=spots;VENUE_NAMES[type]=name;VENUE_DOOR[type]=door;if(light!==false)EXTRA_LIGHT_TYPES.add(type);
}
function ob(obs,x,z,w,d){obs.push([x-w/2,z-d/2,x+w/2,z+d/2]);}
function npc(g,type,x,z,face,shirt,skin,role,name,line){
  const m=buildHuman(shirt,skin,role||'student');m.position.set(x,0.16,z);m.rotation.y=face||0;g.add(m);
  interiorNPCs.push({type:type,m:m,x:x,z:z,h:face||0,name:name,line:line});return m;
}
function floorTile(g,ix,iz,W,D,mat){const f=new THREE.Mesh(new THREE.BoxGeometry(W-1,0.1,D-1),mat);f.position.set(ix,0.18,iz);f.receiveShadow=true;g.add(f);return f;}
function stool(g,x,z,col){F.B3(g,0.01,0.01,0.01,F.M.black,x,0,z);const s=cyl(0.2,0.2,0.07,12,col||F.M.leather,x,0.92,z,g);cyl(0.025,0.025,0.72,6,F.M.chrome,x,0.55,z,g);cyl(0.17,0.17,0.03,10,F.M.chrome,x,0.22,z,g);}
function bottleRow(g,x,y,z,w,rot){
  for(let i=0;i<Math.round(w/0.2);i++)cyl(0.04,0.04,0.28,6,[F.M.green,F.M.red,mt(0x35210f,0.5,0.1),F.M.gold,mt(0xe5e7eb,0.4,0.2)][i%5],x-w/2+0.12+i*0.2,y,z,g);
}

// =====================================================================
//  HÔPITAL
// =====================================================================
function buildHospital(){
  if(built.hospital)return;
  const ix=15000,iz=8000,W=32,D=24,obs=[];
  const g=buildRoomShell(ix,iz,W,D,0xdfe7ee,0xe8f1f8,0xf8fafc);
  F.setFY(0.23);ACT.begin('hospital',{x:ix,z:iz-D/2+1});
  const tile=new THREE.MeshStandardMaterial({color:0xf1f5f9,roughness:0.25,metalness:0.1});floorTile(g,ix,iz,W,D,tile);
  for(let k=0;k<5;k++)F.B3(g,6,0.05,0.4,F.EMI(0xffffff),ix-12+k*6,5.2,iz-4);
  F.B3(g,W-1,0.2,0.1,mt(0x0ea5e9,0.5,0),ix,1.6,iz-D/2+0.3);
  // accueil
  F.B3(g,6.4,1.1,1.3,F.M.white,ix-9,0.8,iz-8);F.B3(g,6.6,0.07,1.5,F.MARBLE_S,ix-9,1.4,iz-8);ob(obs,ix-9,iz-8,6.6,1.6);
  // salle d'attente (chairs 'sit' phone)
  for(let i=0;i<6;i++)F.chair(g,ix-11+i*1.15,iz+3.0,Math.PI,mt(0x0ea5e9,0.8,0),'phone');
  ob(obs,ix-8.2,iz+3,7.2,0.9);
  for(let i=0;i<3;i++)F.chair(g,ix-10+i*1.15,iz+6.5,0,mt(0x0ea5e9,0.8,0),'phone');
  ob(obs,ix-8.8,iz+6.5,3.8,0.9);
  F.B3(g,2.2,1.3,0.1,F.EMI(0x1e3a5f),ix-8,2.6,iz+D/2-0.35);
  // salle de soins : lits
  for(let i=0;i<3;i++){F.bed(g,ix+8+i*0.0,iz-6+i*4.2,Math.PI/2,1.0,2.0,false);ob(obs,ix+8,iz-6+i*4.2,2.4,1.5);F.B3(g,0.05,2.2,3.2,mt(0x93c5fd,0.9,0),ix+5.8,1.2,iz-6+i*4.2+2.1);}
  F.plant(g,ix+14,iz+9,1.6);F.plant(g,ix-14.5,iz+9,1.4);
  // distributeur
  F.B3(g,1.1,2.1,0.9,F.M.black,ix+14.5,1.2,iz+2);F.B3(g,0.8,1.2,0.05,F.EMI(0x7dd3fc),ix+14.5,1.5,iz+1.52);ob(obs,ix+14.5,iz+2,1.3,1.1);
  // médecin
  F.B3(g,2.4,0.8,1.0,F.M.white,ix+2,0.55,iz-7.3);ob(obs,ix+2,iz-7.3,2.6,1.2);
  // croix murale
  F.B3(g,1.6,0.4,0.1,F.EMI(0xdc2626),ix,3.4,iz-D/2+0.4);F.B3(g,0.4,1.6,0.1,F.EMI(0xdc2626),ix,3.4,iz-D/2+0.4);
  ACT.end();F.setFY(0.18);
  const spots=[
    {x:ix+2,z:iz-6,r:3.3,label:'🩺 Se faire soigner · 300 FCFA',key:'heal'},
    {x:ix+14.5,z:iz+3.2,r:2.2,label:'🥤 Distributeur · 100 FCFA',key:'vend'}
  ];
  reg('hospital',ix,iz,W,D,obs,spots,'HÔPITAL GÉNÉRAL','🏥 Hôpital Général');
  if(window.DECORATE)DECORATE('hospital',g,INTERIORS.hospital);if(window.POPULATE)POPULATE('hospital',g,INTERIORS.hospital);
  built.hospital=1;
}
SPOT_HANDLERS.heal=()=>{
  if(P.cash<300){showToast('Il te faut 300 FCFA.');return;}
  if(P.hp>=100&&P.armor>=100){showToast('🩺 Tu es en parfaite santé !');return;}
  P.cash-=300;P.hp=100;P.armor=Math.max(P.armor,60);writeSave();
  playTone(660,0.25,'sine',0.05);setTimeout(()=>playTone(880,0.3,'sine',0.05),180);popEmoji(P.m,'💚',2);showToast('🩺 Soigné ! Santé 100 %, armure rechargée.');
};
SPOT_HANDLERS.vend=()=>{
  if(P.cash<100){showToast('Il te faut 100 FCFA.');return;}
  if(P.hp>=100){showToast('Tu n’as pas soif.');return;}
  P.cash-=100;P.hp=Math.min(100,P.hp+10);writeSave();playTone(600,0.15,'sine',0.04);popEmoji(P.m,'😋',1.6);showToast('🥤 +10 santé');
};

// =====================================================================
//  MAQUIS « CHEZ TONTON »
// =====================================================================
let maquisTiles=[],maquisT=0,musT=0,musStep=0;
function buildMaquis(){
  if(built.maquis)return;
  const ix=16000,iz=8000,W=36,D=24,obs=[];
  const g=buildRoomShell(ix,iz,W,D,0x6b4423,0xb45309,0x3b2412);
  F.setFY(0.23);ACT.begin('maquis',null);
  floorTile(g,ix,iz,W,D,F.PARQ_D);
  F.B3(g,W-1,0.4,0.1,mt(0xdc2626,0.8,0),ix,2.2,iz-D/2+0.3);
  signPlane(g,dummy,'CHEZ TONTON|Bière fraîche · Poisson braisé','#7f1d1d','#fde68a',9,2.2,ix-8,4.1,iz-D/2+0.3,0,true);
  // comptoir + tabourets
  const bx0=ix-6;
  F.B3(g,19,1.15,1.2,F.M.walnut,bx0,0.8,iz-8);F.B3(g,19.4,0.09,1.5,F.M.oak,bx0,1.4,iz-8);ob(obs,bx0,iz-8,19.4,1.6);
  for(let i=0;i<7;i++){const sx=bx0-7.5+i*2.5;stool(g,sx,iz-6.6);ACT.reg('maquis',{kind:'bar',x:sx,z:iz-6.6,face:Math.PI,seatY:0.98,cost:150,label:'🍺 Commander une bière',type:'maquis'});}
  F.B3(g,19,2.6,0.4,F.M.walnut,bx0,2.2,iz-D/2+0.8);
  for(let r=0;r<3;r++)bottleRow(g,bx0,1.7+r*0.7,iz-D/2+1.1,17);
  for(let k=0;k<3;k++)F.B3(g,0.8,0.5,0.6,mt(0xdc2626,0.7,0),ix+13+k*0.0,0.45+k*0.5,iz-10+0);
  // tables + chaises (manger)
  for(let t=0;t<4;t++){
    const tx=ix+5+(t%2)*6,tz=iz+1+Math.floor(t/2)*5.5;
    cyl(0.75,0.75,0.07,16,mt(0xdc2626,0.6,0),tx,0.98,tz,g);cyl(0.07,0.07,0.8,6,F.M.chrome,tx,0.55,tz,g);ob(obs,tx,tz,1.5,1.5);
    for(let c=0;c<3;c++){const a=c/3*6.28+0.4;F.chair(g,tx+Math.sin(a)*1.1,tz+Math.cos(a)*1.1,a+Math.PI,mt(0xf5f5f4,0.8,0),'eat');}
  }
  // piste de danse lumineuse
  maquisTiles=[];
  for(let i=0;i<4;i++)for(let j=0;j<3;j++){const m=new THREE.MeshBasicMaterial({color:0xff00aa});maquisTiles.push({m:m,i:i,j:j});const t=new THREE.Mesh(new THREE.BoxGeometry(1.9,0.05,1.9),m);t.position.set(ix-14+i*2,0.22,iz+3+j*2);g.add(t);}
  for(let k=0;k<3;k++)ACT.reg('maquis',{kind:'dance',x:ix-13+k*2.2,z:iz+5,face:0,type:'maquis',label:'💃 Danser sur la piste'});
  // jukebox
  const jb=F.B3(g,1.3,2.0,0.8,mt(0x7f1d1d,0.4,0.3),ix+W/2-1.4,1.2,iz+4);F.B3(g,1.0,0.8,0.05,F.EMI(0xfde047),ix+W/2-1.45,1.6,iz+3.55);ob(obs,ix+W/2-1.4,iz+4,1.5,1.0);
  // billard & fléchettes
  F.billiard(g,ix-11,iz-1.5,0);ob(obs,ix-11,iz-1.5,3.4,2.2);
  const board=cyl(0.45,0.45,0.08,20,0x111827,ix+W/2-0.5,2.1,iz-3,g);board.rotation.z=Math.PI/2;cyl(0.28,0.28,0.09,20,0xdc2626,ix+W/2-0.45,2.1,iz-3,g).rotation.z=Math.PI/2;cyl(0.1,0.1,0.1,12,0x16a34a,ix+W/2-0.42,2.1,iz-3,g).rotation.z=Math.PI/2;
  ACT.reg('maquis',{kind:'dart',x:ix+W/2-3.6,z:iz-3,face:Math.PI/2,type:'maquis',floorY:0.23,label:'🎯 Jouer aux fléchettes'});
  F.B3(g,2.6,1.5,0.1,F.EMI(0x14532d),ix-W/2+0.5,3.0,iz+4);   // télé foot
  F.plant(g,ix+16,iz+10,1.5);F.plant(g,ix-16.5,iz+10,1.5);
  for(let k=0;k<8;k++){const b=new THREE.Mesh(new THREE.SphereGeometry(0.12,6,5),new THREE.MeshBasicMaterial({color:[0xfde047,0xf97316,0x22c55e,0xef4444][k%4]}));b.position.set(ix-15+k*4.3,4.4,iz+2);g.add(b);}
  ACT.end();F.setFY(0.18);
  const spots=[{x:ix+W/2-2.6,z:iz+4,r:2.4,label:'🎶 Jukebox : changer de musique',key:'juke'}];
  reg('maquis',ix,iz,W,D,obs,spots,'MAQUIS CHEZ TONTON','🍺 Maquis Chez Tonton');
  if(window.DECORATE)DECORATE('maquis',g,INTERIORS.maquis);if(window.POPULATE)POPULATE('maquis',g,INTERIORS.maquis);
  built.maquis=1;
}
SPOT_HANDLERS.juke=()=>{
  radioIdx=(radioIdx+1)%RADIOS.length;
  showToast('🎶 '+RADIOS[radioIdx].name);playTone(700,0.1,'square',0.04);
};
function maquisTick(dt){
  maquisT+=dt;
  for(const t of maquisTiles){t.m.color.setHSL(((maquisT*0.25)+(t.i+t.j)*0.11)%1,1,0.5);}
  musT-=dt;
  if(musT<=0){
    musT=0.27;musStep=(musStep+1)%8;
    const bass=[98,98,130.8,98,110,110,146.8,110];
    if(musStep%4===0)playTone(62,0.14,'sine',0.045);
    if(musStep%2===0)playTone(bass[musStep]*0.5,0.22,'sawtooth',0.018);
    if(musStep%2===1)playTone(5200,0.02,'square',0.006);
    if(musStep===3||musStep===7)playTone([392,440,523,587][(Math.random()*4)|0],0.18,'triangle',0.02);
  }
}

// =====================================================================
//  CABARET « LE MOULIN DORÉ » (spectacle, pas de contenu explicite)
// =====================================================================
let dancers=[],beams=[],ball=null,cabT=0,tipBurst=0,cabMus=0,cabStep=0;
function buildCabaret(){
  if(built.cabaret)return;
  const ix=17000,iz=8000,W=46,D=32,obs=[];
  const g=buildRoomShell(ix,iz,W,D,0x14091c,0x2a1030,0x07040a);
  F.setFY(0.23);ACT.begin('cabaret',{x:ix,z:iz-12});
  floorTile(g,ix,iz,W,D,new THREE.MeshStandardMaterial({color:0x1d1226,roughness:0.25,metalness:0.4}));
  // scène
  F.B3(g,20,0.7,8,mt(0x2a1a2e,0.2,0.6),ix,0.55,iz-12);ob(obs,ix,iz-12,20.4,8.4);
  F.B3(g,4,0.6,8,mt(0x2a1a2e,0.2,0.6),ix,0.5,iz-6.4);ob(obs,ix,iz-6.4,4.2,8.2);
  for(let k=0;k<22;k++)F.B3(g,0.9,0.04,0.9,F.EMI(0x000000),ix-9.5+(k%11)*1.9,0.92,iz-14+Math.floor(k/11)*3.4);
  F.curtains(g,ix,0.2,iz-D/2+0.7,0,20,5.2,F.M.red);
  signPlane(g,dummy,'LE MOULIN DORÉ','#12060f','#fbbf24',9,1.8,ix,6.6,iz-D/2+0.4,0,true);
  // danseuses : costumes à paillettes (spectacle chorégraphié)
  dancers=[];
  const cols=[0xfbbf24,0xec4899,0x8b5cf6,0x06b6d4],skins=[0x7b5438,0x6f4e37,0x8b5a3c,0x5b3a29];
  for(let i=0;i<4;i++){
    const m=npc(g,'cabaret',ix-6+i*4,iz-12.5,0,cols[i],skins[i],'student','Danseuse','Le spectacle commence ! Offrez un pourboire pour les encourager.');
    m.position.y=0.9;
    const u=m.userData;
    const plume=new THREE.Group();for(let k=0;k<5;k++){const f=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.5,5),mt(cols[(i+k)%4],0.7,0));f.position.set((k-2)*0.07,0.32,0);f.rotation.z=(k-2)*0.2;plume.add(f);}
    plume.position.set(0,0.2,0);u.head.add(plume);
    const skirt=cyl(0.2,0.42,0.38,14,cols[i],0,0.82,0,m);
    dancers.push({m:m,u:u,ph:i*0.9,bx:ix-6+i*4});
  }
  // lumières
  beams=[];
  for(let i=0;i<6;i++){
    const pv=new THREE.Group();pv.position.set(ix-10+i*4,5.3,iz-8);
    const mat=new THREE.MeshBasicMaterial({color:0xff00aa,transparent:true,opacity:0.16,side:THREE.DoubleSide,depthWrite:false});
    const cone=new THREE.Mesh(new THREE.ConeGeometry(1.4,9,16,1,true),mat);cone.position.y=-4.5;pv.add(cone);g.add(pv);beams.push({pv:pv,mat:mat,i:i});
  }
  ball=new THREE.Mesh(new THREE.SphereGeometry(0.6,14,10),mt(0xe5e7eb,0.05,1));ball.position.set(ix,4.6,iz+2);g.add(ball);cyl(0.02,0.02,0.8,4,0xcbd5e1,ix,5.1,iz+2,g);
  // tables du public : 'sit' show
  for(let t=0;t<5;t++){
    const tx=ix-14+t*7,tz=iz-2.5;
    cyl(0.7,0.7,0.07,16,F.M.black,tx,0.98,tz,g);cyl(0.06,0.06,0.8,6,F.M.gold,tx,0.55,tz,g);ob(obs,tx,tz,1.5,1.5);
    for(const s of[-1,1])F.chair(g,tx+s*0.95,tz+0.5,Math.PI,F.M.red,'show');
    F.B3(g,0.14,0.2,0.14,F.EMI(0xfde68a),tx,1.12,tz);
  }
  // loges VIP (canapés) + bar
  for(let v=0;v<2;v++){F.sofa(g,ix+W/2-2.6,iz+2+v*7,-Math.PI/2,3.2,F.M.red,mt(0xb91c1c,0.9,0));ob(obs,ix+W/2-2.6,iz+2+v*7,1.2,3.4);F.cTable(g,ix+W/2-5,iz+2+v*7,1.0,1.0,0.5);}
  F.B3(g,14,1.15,1.2,F.M.black,ix-8,0.8,iz+D/2-3);F.B3(g,14.4,0.09,1.5,F.MARBLE_S,ix-8,1.4,iz+D/2-3);ob(obs,ix-8,iz+D/2-3,14.4,1.6);
  for(let i=0;i<5;i++){const sx=ix-13+i*2.5;stool(g,sx,iz+D/2-4.6,F.M.red);ACT.reg('cabaret',{kind:'bar',x:sx,z:iz+D/2-4.6,face:0,seatY:0.98,cost:250,label:'🍸 Commander un cocktail',type:'cabaret',focus:null});}
  // piste de danse
  for(let k=0;k<4;k++)ACT.reg('cabaret',{kind:'dance',x:ix-4+k*2.6,z:iz+8,face:Math.PI,type:'cabaret',label:'💃 Danser devant la scène',focus:null});
  F.plant(g,ix-21,iz+13,1.8);F.plant(g,ix+21,iz+13,1.8);
  F.chandelier(g,ix-10,4.6,iz+6,1.2);F.chandelier(g,ix+10,4.6,iz+6,1.2);
  ACT.end();F.setFY(0.18);
  const spots=[
    {x:ix,z:iz-7.6,r:4.6,label:'💸 Offrir un pourboire aux artistes · 200 FCFA',key:'tip'},
    {x:ix+W/2-5.6,z:iz+5,r:3.0,label:'🍾 Champagne en loge VIP · 500 FCFA',key:'champ'}
  ];
  reg('cabaret',ix,iz,W,D,obs,spots,'LE MOULIN DORÉ · CABARET','💃 Le Moulin Doré (cabaret)');
  if(window.DECORATE)DECORATE('cabaret',g,INTERIORS.cabaret);if(window.POPULATE)POPULATE('cabaret',g,INTERIORS.cabaret);
  built.cabaret=1;
}
SPOT_HANDLERS.tip=()=>{
  if(P.cash<200){showToast('Il te faut 200 FCFA.');return;}
  P.cash-=200;writeSave();tipBurst=3;playTone(1000,0.12,'sine',0.04);
  for(const d of dancers)popEmoji(d.m,'❤️',2.2,2.4);
  showToast('👏 Les artistes te remercient avec un numéro spécial !');
};
SPOT_HANDLERS.champ=()=>{
  if(P.cash<500){showToast('Il te faut 500 FCFA.');return;}
  P.cash-=500;P.hp=Math.min(100,P.hp+20);writeSave();playTone(500,0.3,'sine',0.04);popEmoji(P.m,'🥂',2);showToast('🍾 Santé ! +20 santé');
};
function cabaretTick(dt){
  cabT+=dt;
  const burst=tipBurst>0;tipBurst=Math.max(0,tipBurst-dt);
  dancers.forEach((d,i)=>{
    const u=d.u,t=cabT*3.2+d.ph,s=Math.sin(t),c=Math.cos(t);
    const form=Math.sin(cabT*0.35+d.ph)*1.4;
    d.m.position.x=d.bx+form;d.m.position.y=0.9+Math.abs(s)*0.06;
    d.m.rotation.y=Math.sin(cabT*0.5+i)*0.4+(burst?Math.sin(cabT*6)*0.4:0);
    u.armL.rotation.x=-2.4+s*0.5;u.armR.rotation.x=-2.4-s*0.5;u.armL.rotation.z=0.8;u.armR.rotation.z=-0.8;
    u.elbowL.rotation.x=-0.5;u.elbowR.rotation.x=-0.5;
    u.legL.rotation.x=Math.max(0,s)*0.9-0.1;u.legR.rotation.x=Math.max(0,-s)*0.9-0.1;
    u.kneeL.rotation.x=Math.max(0,-s)*0.7;u.kneeR.rotation.x=Math.max(0,s)*0.7;
    u.torso.rotation.z=s*0.12;u.head.rotation.z=-s*0.08;u.torso.rotation.y=c*0.25;
    if(burst){u.armR.rotation.x=-2.8;u.armL.rotation.x=-2.8;u.torso.rotation.y=Math.sin(cabT*8+i)*0.5;}
    u.gun.visible=false;
  });
  beams.forEach(b=>{b.pv.rotation.z=Math.sin(cabT*0.9+b.i)*0.6;b.pv.rotation.x=Math.cos(cabT*0.7+b.i*1.3)*0.5;b.mat.color.setHSL((cabT*0.12+b.i*0.17)%1,1,0.55);});
  if(ball)ball.rotation.y+=dt*1.2;
  cabMus-=dt;
  if(cabMus<=0){
    cabMus=0.234;cabStep=(cabStep+1)%16;
    const bass=[55,55,82.4,55,65.4,55,82.4,98,55,55,82.4,55,73.4,65.4,82.4,110];
    if(cabStep%4===0)playTone(58,0.15,'sine',0.05);
    if(cabStep%2===0)playTone(bass[cabStep],0.2,'sawtooth',0.02);
    if(cabStep%2===1)playTone(6200,0.02,'square',0.006);
    if(cabStep%8===4)playTone(196,0.12,'triangle',0.03);
    if(cabStep%4===2)playTone([523,659,784,880][(Math.random()*4)|0],0.12,'square',0.012);
  }
}

// =====================================================================
//  BOUTIQUE « STYLE AVENUE » : tenues & accessoires
// =====================================================================
const OUTFITS=[
  {n:'Wax bleu roi',c:0x1d4ed8,p:300},{n:'Boubou doré',c:0xd4af37,p:800},{n:'Costume noir',c:0x111827,p:1500},
  {n:'Veste cuir bordeaux',c:0x9b1c31,p:1200},{n:'Maillot des Lions',c:0x16a34a,p:400},{n:'Blanc immaculé',c:0xf8fafc,p:600},
  {n:'Rose fluo',c:0xec4899,p:500},{n:'Violet royal',c:0x7c3aed,p:700}
];
const ACCS=[{k:'cap',n:'🧢 Casquette',p:150},{k:'glasses',n:'🕶️ Lunettes de soleil',p:200},{k:'chain',n:'⛓️ Chaîne en or',p:900}];
function addAccessories(m,acc){
  const u=m.userData;acc=acc||{};
  if(acc.cap){const c=new THREE.Group();F.B3(c,0.44,0.13,0.44,mt(0x111827,0.8,0),0,0.2,0.02);F.B3(c,0.36,0.03,0.22,mt(0x111827,0.8,0),0,0.14,0.27);u.head.add(c);}
  if(acc.glasses){const c=new THREE.Group();F.B3(c,0.36,0.08,0.04,mt(0x050505,0.2,0.5),0,0.035,0.205);F.B3(c,0.02,0.02,0.2,mt(0x050505,0.2,0.5),0.19,0.04,0.1);F.B3(c,0.02,0.02,0.2,mt(0x050505,0.2,0.5),-0.19,0.04,0.1);u.head.add(c);}
  if(acc.chain){const t=new THREE.Mesh(new THREE.TorusGeometry(0.17,0.018,6,16),F.M.gold);t.position.set(0,1.46,0.12);t.rotation.x=Math.PI/2.4;u.torso.add(t);}
}
function applyOutfit(){
  const o=SAVE.outfit;if(!o)return;
  const old=P.m,nm=buildHuman(o.shirt,0x7b5438,'player');
  nm.position.copy(old.position);nm.rotation.copy(old.rotation);nm.visible=old.visible;
  scene.remove(old);P.m=nm;addAccessories(nm,o.acc);
}
function outfitMenu(){
  const o=SAVE.outfit||{shirt:0xe11d48,acc:{}};
  const hex=c=>'#'+c.toString(16).padStart(6,'0');
  F.openModal(`<h2>👕 Style Avenue</h2><div class="sub">Change de look pour tes vidéos ! Solde : ${fmt(P.cash)} FCFA</div>
    <b style="font-size:12px;color:#94a3b8">TENUES</b>
    ${OUTFITS.map((t,i)=>`<div class="row"><div><b><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${hex(t.c)};border:1px solid #fff;vertical-align:middle;margin-right:6px"></span>${t.n}</b></div>${o.shirt===t.c?'<button class="sec" disabled>Portée</button>':`<button data-o="${i}" ${P.cash>=t.p?'':'disabled'}>${fmt(t.p)} F</button>`}</div>`).join('')}
    <b style="font-size:12px;color:#94a3b8">ACCESSOIRES</b>
    ${ACCS.map((a,i)=>`<div class="row"><div><b>${a.n}</b></div>${(o.acc&&o.acc[a.k])?'<button class="sec" data-a="'+i+'">Retirer</button>':`<button data-a="${i}" ${P.cash>=a.p?'':'disabled'}>${fmt(a.p)} F</button>`}</div>`).join('')}
    <div class="foot"><button class="sec" id="ex-no">Fermer</button></div>`,
    c=>{
      c.querySelector('#ex-no').onclick=F.closeModal;
      c.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{const t=OUTFITS[+b.dataset.o];if(P.cash<t.p)return;P.cash-=t.p;SAVE.outfit=SAVE.outfit||{shirt:t.c,acc:{}};SAVE.outfit.shirt=t.c;SAVE.outfit.acc=SAVE.outfit.acc||{};writeSave();applyOutfit();playTone(880,0.2,'sine',0.05);showToast('👕 '+t.n+' · ça te va bien !');outfitMenu();});
      c.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{
        const a=ACCS[+b.dataset.a];SAVE.outfit=SAVE.outfit||{shirt:0xe11d48,acc:{}};SAVE.outfit.acc=SAVE.outfit.acc||{};
        if(SAVE.outfit.acc[a.k]){SAVE.outfit.acc[a.k]=0;}
        else{if(P.cash<a.p)return;P.cash-=a.p;SAVE.outfit.acc[a.k]=1;}
        writeSave();applyOutfit();playTone(700,0.15,'sine',0.05);outfitMenu();});
    });
}
function buildBoutique(){
  if(built.boutique)return;
  const ix=18000,iz=8000,W=32,D=22,obs=[];
  const g=buildRoomShell(ix,iz,W,D,0xd6c7a1,0xf5efe0,0xfaf7f0);
  F.setFY(0.23);ACT.begin('boutique',null);
  floorTile(g,ix,iz,W,D,F.PARQ);
  // portants de vêtements
  for(let r=0;r<2;r++)for(let k=0;k<4;k++){
    const x=ix-11+k*4,z=iz-6+r*0;
    if(r===1)continue;
    cyl(0.03,0.03,1.5,6,F.M.chrome,x,0.95,z,g);F.B3(g,3,0.04,0.04,F.M.chrome,x,1.65,z);
    for(let c=0;c<9;c++)F.B3(g,0.06,1.0,0.4,mt([0x1d4ed8,0xd4af37,0x111827,0x9b1c31,0x16a34a,0xf8fafc,0xec4899,0x7c3aed][c%8],0.85,0),x-1.3+c*0.33,1.15,z);
    ob(obs,x,z,3.2,0.8);
  }
  for(let k=0;k<3;k++){const sx=ix+4+k*4;F.B3(g,1.4,2.6,0.5,F.M.walnut,sx,1.5,iz-D/2+0.6);for(let r=0;r<4;r++)F.B3(g,1.2,0.12,0.4,mt([0xd4af37,0x1d4ed8,0x9b1c31][k],0.7,0),sx,0.7+r*0.55,iz-D/2+0.7);ob(obs,sx,iz-D/2+0.7,1.5,0.8);}
  // mannequins sur podiums
  for(let k=0;k<4;k++){
    const mx=ix-10+k*6.5,mz=iz+2;
    cyl(0.9,1.0,0.3,16,F.M.white,mx,0.3,mz,g);
    const m=buildHuman(OUTFITS[(k*2)%8].c,0x7b5438,'student');m.position.set(mx,0.45,mz);m.rotation.y=Math.PI;m.userData.gun.visible=false;g.add(m);
    ob(obs,mx,mz,2,2);
  }
  // miroirs
  for(let k=0;k<2;k++){const mxx=ix-8+k*16;F.B3(g,2.4,3.0,0.1,mt(0xdbeafe,0.04,0.95),mxx,1.8,iz+D/2-1.0);F.B3(g,2.6,3.2,0.06,F.M.gold,mxx,1.8,iz+D/2-0.95);
    ACT.reg('boutique',{kind:'pose',x:mxx,z:iz+D/2-3,face:Math.PI,type:'boutique',floorY:0.23,label:'🪞 Essayer des poses'});}
  // comptoir
  F.B3(g,6,1.1,1.2,F.M.white,ix+10,0.8,iz+7);F.B3(g,6.2,0.07,1.4,F.MARBLE_S,ix+10,1.4,iz+7);ob(obs,ix+10,iz+7,6.2,1.5);
  F.chandelier(g,ix,4.6,iz,1.5);F.plant(g,ix-14,iz+9,1.5);
  ACT.end();F.setFY(0.18);
  const spots=[{x:ix+10,z:iz+3.8,r:3.2,label:'👕 Voir les tenues & accessoires',key:'wardrobe'}];
  reg('boutique',ix,iz,W,D,obs,spots,'STYLE AVENUE · MODE','🛍️ Mvog Mall · Style Avenue');
  if(window.DECORATE)DECORATE('boutique',g,INTERIORS.boutique);if(window.POPULATE)POPULATE('boutique',g,INTERIORS.boutique);
  built.boutique=1;
}
SPOT_HANDLERS.wardrobe=()=>outfitMenu();

// =====================================================================
//  MAISONS VARIÉES (appartement moderne / maison cosy)
// =====================================================================
function buildHome(type){
  if(built[type])return;
  const modern=type==='home2';
  const ix=modern?19000:19400,iz=8000,W=26,D=20,obs=[];
  const g=buildRoomShell(ix,iz,W,D,modern?0xc9b79c:0xb08968,modern?0xf3efe6:0xe8d8c3,0xfaf7f0);
  F.setFY(0.23);ACT.begin(type,{x:ix,z:iz-D/2+0.8});
  floorTile(g,ix,iz,W,D,modern?F.PARQ:F.PARQ_D);
  const hx=ix,hz=iz;
  if(modern){
    F.kitchen(g,ix-7,iz-D/2+1.0,7);ob(obs,ix-7,iz-D/2+1,7.2,1.2);
    F.island(g,ix-7,iz-4.2,0,3.6);ob(obs,ix-7,iz-4.2,4,1.4);
    F.diningSet(g,ix-7,iz+3.8,0,4,F.M.oak);ob(obs,ix-7,iz+3.8,2.8,2);F.chandelier(g,ix-7,3.9,iz+3.8,0.9);
    F.rug(g,ix+3,iz+1,6.4,4.6,'#e8dcc3','#7a3b2e');
    F.sofa(g,ix+3,iz+3.2,Math.PI,3.8,F.M.navy,F.M.cream);ob(obs,ix+3,iz+3.2,4,1.1);
    F.armchair(g,ix+6.4,iz+0.6,-Math.PI/2,F.M.beige);
    F.cTable(g,ix+3,iz+1,1.8,1.0,0.42);
    F.tvWall(g,ix+3,iz-D/2+0.4,0,5.4,true);ob(obs,ix+3,iz-D/2+0.5,5.6,0.7);
    F.bed(g,ix+9.8,iz-6.4,Math.PI/2,1.8,2.1,false);ob(obs,ix+9.5,iz-6.4,2.5,3.6);
    F.wardrobe(g,ix+12.4,iz-1.2,-Math.PI/2,3.6);ob(obs,ix+12.5,iz-1.2,0.8,3.6);
    F.B3(g,1.2,2.4,0.1,mt(0xdbeafe,0.04,0.95),ix+7.5,1.5,iz+D/2-0.4);
    ACT.reg(type,{kind:'pose',x:ix+7.5,z:iz+D/2-2.2,face:Math.PI,type:type,floorY:0.23,label:'🪞 Poser devant le miroir'});
    F.plant(g,ix+11.5,iz+8,1.6);F.lampFloor(g,ix+0.2,iz+4.6);
  }else{
    F.kitchen(g,ix+6,iz-D/2+1.0,6);ob(obs,ix+6,iz-D/2+1,6.2,1.2);
    F.diningSet(g,ix+6,iz-3.4,0,4,F.M.walnut);ob(obs,ix+6,iz-3.4,2.8,2);F.chandelier(g,ix+6,3.9,iz-3.4,0.9);
    F.rug(g,ix-5,iz+1,7,5,'#d9cdb5','#22364f');
    F.sofa(g,ix-5,iz+3.6,Math.PI,4.2,F.M.red,mt(0xb91c1c,0.9,0));ob(obs,ix-5,iz+3.6,4.4,1.1);
    F.sofa(g,ix-8.6,iz+0.8,Math.PI/2,2.6,F.M.red,mt(0xb91c1c,0.9,0));ob(obs,ix-8.6,iz+0.8,1.1,2.8);
    F.cTable(g,ix-5,iz+1,1.8,1.0,0.42);
    F.tvWall(g,ix-5,iz-D/2+0.4,0,5.4,true);ob(obs,ix-5,iz-D/2+0.5,5.6,0.7);
    F.bed(g,ix+9.6,iz+5.4,Math.PI,1.6,2.1,false);ob(obs,ix+9.6,iz+5.4,2.4,3);
    F.wardrobe(g,ix-12.5,iz-6,Math.PI/2,3.2);ob(obs,ix-12.4,iz-6,0.8,3.2);
    F.billiard(g,ix+6,iz+6,0);ob(obs,ix+6,iz+6,3.2,2.2);
    F.plant(g,ix+11.5,iz-8,1.6);F.plant(g,ix-11.5,iz+8,1.4);F.lampFloor(g,ix-9.4,iz+4.6);
    ACT.reg(type,{kind:'dance',variant:'slow',x:ix+1,z:iz-4,face:Math.PI,type:type,floorY:0.23,label:'💃 Danser dans le salon'});
  }
  ACT.end();F.setFY(0.18);
  const bedPos=modern?{x:ix+9.8,z:iz-4.4}:{x:ix+9.6,z:iz+3.2};
  const spots=[
    {x:bedPos.x-0.4,z:bedPos.z,r:2.6,label:'😴 Dormir (choisir l’heure du réveil)',key:'bed'},
    {x:modern?ix-5.5:ix+8.2,z:iz-D/2+3,r:2.4,label:'🧊 Se servir (frigo · soigne)',key:'fridge'}
  ];
  reg(type,ix,iz,W,D,obs,spots,modern?'APPARTEMENT MODERNE':'MAISON COSY','🏠 Maison');
  if(window.DECORATE)DECORATE(type,g,INTERIORS[type]);if(window.POPULATE)POPULATE(type,g,INTERIORS[type]);
  built[type]=1;
}

// ---------- canapé de la villa d'origine : on peut s'y asseoir aussi
(function(){
  try{
    if(typeof IX_VILLA!=='undefined'){
      for(const dx of[-2.6,-1.2,0.2])ACT.reg('villa',{kind:'sofa',x:IX_VILLA-1.2+dx,z:IZ_VILLA-3.3,face:0,seatY:0.62,focus:{x:IX_VILLA-1.2,z:IZ_VILLA+1.6},type:'villa',floorY:0.15});
    }
  }catch(e){}
})();

// =====================================================================
//  BRANCHEMENTS : entrée dans les lieux, cartes, boucle de jeu
// =====================================================================
const _eiV=enterInterior;
enterInterior=function(type,doorObj){
  if(window.EX_BAN&&EX_BAN[type]&&EX_BAN[type]>performance.now()/1000){showToast('La sécurité t’interdit l’entrée pour le moment.');return;}
  try{
    if(type==='villa'&&doorObj){
      const h=(Math.floor(Math.abs(doorObj.x)*7.3+Math.abs(doorObj.z)*3.7))%3;
      if(h===1){buildHome('home2');type='home2';}else if(h===2){buildHome('home3');type='home3';}
    }else if(type==='hospital')buildHospital();
    else if(type==='maquis')buildMaquis();
    else if(type==='cabaret')buildCabaret();
    else if(type==='boutique')buildBoutique();
    if(EXTRA_LIGHT_TYPES.has(type))EX.ensureLights();
  }catch(e){console.error('[VENUES intérieur]',e);showToast('Ce lieu est indisponible.');return;}
  const r=_eiV.call(this,type,doorObj);
  const msg={hospital:'🏥 Hôpital Général : parle au docteur.',maquis:'🍺 Bienvenue Chez Tonton ! Installe-toi au comptoir.',cabaret:'💃 Le Moulin Doré : le spectacle commence !',boutique:'🛍️ Style Avenue : change de look !',home2:'🏠 Appartement : fais comme chez toi.',home3:'🏠 Maison cosy : installe-toi.'}[type];
  if(msg)showToast(msg);
  return r;
};
const venueTick=guardV('tick',function(dt){
  if(!interiorType||S!=='play')return;
  if(interiorType==='maquis')maquisTick(dt);
  else if(interiorType==='cabaret')cabaretTick(dt);
});
const _updV=update;
update=function(dt){
  _updV(dt);
  venueTick(dt);
  if(!EX._outfitDone&&S==='play'&&SAVE.outfit){EX._outfitDone=1;try{applyOutfit();}catch(e){console.error(e);}}
};

// ---------- carte : nouveaux lieux
(function(){
  const sprites=[];
  const add=(e,n,x,z,col,ly,h)=>{const p={k:'ex',e:e,n:n,x:x,z:z,col:col,ly:ly,big:1};POI_ALL.push(p);sprites.push({p:p,h:h||20,s:null});};
  add('🏥','Hôpital Général',10*CS+40,CS+44.5,'#22d3ee',-16,24);
  add('🍺','Maquis Chez Tonton',10*CS+40,7*CS+34.4,'#f59e0b',17,16);
  add('💃','Le Moulin Doré',11*CS+40,7*CS+47.5,'#f472b6',17,20);
  add('🛍️','Mvog Mall',12*CS+40,7*CS+48.6,'#a855f7',-16,22);
  add('🏙️','Centre d’affaires',11*CS+40,4*CS+40,'#94a3b8',-16,120);
  add('🏭','Zone industrielle',11*CS+40,9*CS+40,'#a8a29e',-16,20);
  add('🎓','Université',2*CS+40,11*CS+40,'#60a5fa',-16,30);
  add('⚽','Terrain de foot',5*CS+40,11*CS+40,'#4ade80',-16,16);
  for(const o of sprites){o.s=makeEmojiSprite(o.p.e,6,false);o.s.renderOrder=5;o.s.position.set(o.p.x,o.h,o.p.z);scene.add(o.s);}
  const _u3=update;
  update=function(dt){
    _u3(dt);
    for(const o of sprites){
      const d=Math.hypot(P.x-o.p.x,P.z-o.p.z),vis=!interiorType&&d>16&&d<190&&S==='play';
      o.s.visible=vis;if(vis){const k=clp(d*0.05,2.4,8);o.s.scale.set(k,k,1);}
    }
  };
  const lg=document.getElementById('map-legend');
  if(lg)lg.innerHTML+='<span>🏥 Hôpital</span><span>🍺💃 Maquis · Cabaret</span><span>🛍️ Mall (mode)</span><span>🏙️ Affaires</span><span>🏭 Industrie</span><span>🎓 Campus</span>';
})();
console.log('[VENUES] chargé : hôpital, maquis, cabaret, boutique, maisons.');
})();
