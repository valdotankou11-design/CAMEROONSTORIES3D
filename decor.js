'use strict';
// =====================================================================
//  DÉCOR DE LUXE POUR LES LIEUX : papiers peints & boiseries, plinthes et corniches,
//  fenêtres, luminaires, signalétique, équipements (monitoring, perfusions, miroirs, néons…)
// =====================================================================
(function(){
const F=EX.F,B3=F.B3,M=F.M,EMI=F.EMI;
const rr=(a,b)=>a+Math.random()*(b-a);
const memo={};
function canvasTex(key,w,h,draw){
  if(memo[key])return memo[key];
  const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return memo[key]=t;
}
function wallTex(style){
  return canvasTex('wall_'+style,256,256,(x,w,h)=>{
    if(style==='clinic'){
      x.fillStyle='#eef5f9';x.fillRect(0,0,w,h);x.fillStyle='#8ecae6';x.fillRect(0,158,w,h-158);x.fillStyle='#ffffff';x.fillRect(0,152,w,7);
      x.fillStyle='rgba(0,0,0,0.05)';for(let i=0;i<8;i++)x.fillRect(i*32,0,1,152);
    }else if(style==='maquis'){
      for(let i=0;i<8;i++){x.fillStyle=['#b45309','#c2410c','#a16207','#9a3412'][i%4];x.fillRect(i*32,0,32,172);}
      x.fillStyle='#3b2412';x.fillRect(0,172,w,84);for(let i=0;i<4;i++){x.strokeStyle='#5b3a1d';x.lineWidth=3;x.strokeRect(i*64+4,180,56,68);}
      x.fillStyle='#fde68a';x.fillRect(0,168,w,5);
    }else if(style==='club'){
      x.fillStyle='#2b0f35';x.fillRect(0,0,w,h);
      for(let r=0;r<6;r++)for(let k=0;k<4;k++){x.fillStyle='rgba(251,191,36,0.16)';x.beginPath();x.moveTo(k*64+32,r*48+4);x.lineTo(k*64+58,r*48+26);x.lineTo(k*64+32,r*48+46);x.lineTo(k*64+6,r*48+26);x.closePath();x.fill();}
      x.fillStyle='#d4af37';for(let k=0;k<5;k++)x.fillRect(k*64-1,0,2,h);x.fillRect(0,176,w,4);
    }else if(style==='shop'){
      x.fillStyle='#f3ecdc';x.fillRect(0,0,w,h);x.fillStyle='rgba(120,90,50,0.07)';for(let i=0;i<16;i++)x.fillRect(i*16,0,8,h);
      x.fillStyle='#b9975b';x.fillRect(0,40,w,4);x.fillStyle='#8a6a3a';x.fillRect(0,214,w,42);x.fillStyle='#d6b98c';x.fillRect(0,210,w,5);
    }else if(style==='home'){
      x.fillStyle='#efe6d4';x.fillRect(0,0,w,h);x.fillStyle='rgba(150,110,70,0.12)';
      for(let r=0;r<8;r++)for(let k=0;k<8;k++){x.beginPath();x.arc(k*32+16+(r%2)*16,r*32+16,5,0,6.3);x.fill();}
      x.fillStyle='#caa97a';x.fillRect(0,206,w,50);x.fillStyle='#fff7e6';x.fillRect(0,202,w,5);
    }else{
      x.fillStyle='#ddd';x.fillRect(0,0,w,h);
    }
  });
}
function ecgTex(){
  return canvasTex('ecg',128,64,(x,w,h)=>{
    x.fillStyle='#03120a';x.fillRect(0,0,w,h);x.strokeStyle='#22ff7a';x.lineWidth=2;x.beginPath();x.moveTo(0,40);
    for(let k=0;k<3;k++){const o=k*42;x.lineTo(o+6,40);x.lineTo(o+10,34);x.lineTo(o+14,40);x.lineTo(o+18,40);x.lineTo(o+20,50);x.lineTo(o+23,10);x.lineTo(o+27,46);x.lineTo(o+30,40);x.lineTo(o+36,40);x.lineTo(o+40,36);x.lineTo(o+42,40);}
    x.stroke();
  });
}
function shell(g,ix,iz,W,D,style,o){
  o=o||{};
  const tex=wallTex(style),H=4.7,y=0.2+H/2;
  const plane=(w,x,z,ry)=>{
    const t=tex.clone();t.needsUpdate=true;t.repeat.set(Math.max(1,Math.round(w/4)),1);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,H),new THREE.MeshStandardMaterial({map:t,roughness:0.85}));
    m.position.set(x,y,z);m.rotation.y=ry;m.receiveShadow=true;g.add(m);
  };
  plane(W-0.6,ix,iz-D/2+0.22,0);plane(W-0.6,ix,iz+D/2-0.22,Math.PI);plane(D-0.6,ix-W/2+0.22,iz,Math.PI/2);plane(D-0.6,ix+W/2-0.22,iz,-Math.PI/2);
  const trim=o.trim||M.white,gold=o.gold?M.gold:trim;
  // plinthes & corniches
  for(const s of[-1,1]){
    B3(g,W-0.5,0.2,0.08,trim,ix,0.32,iz+s*(D/2-0.24));B3(g,0.08,0.2,D-0.5,trim,ix+s*(W/2-0.24),0.32,iz);
    B3(g,W-0.5,0.2,0.14,gold,ix,4.85,iz+s*(D/2-0.27));B3(g,0.14,0.2,D-0.5,gold,ix+s*(W/2-0.27),4.85,iz);
  }
  // luminaires de plafond
  const n=Math.max(2,Math.round(W/6)),m=Math.max(1,Math.round(D/8));
  for(let i=0;i<n;i++)for(let j=0;j<m;j++){
    const lx=ix-W/2+(i+0.5)*W/n,lz=iz-D/2+(j+0.5)*D/m;
    B3(g,o.round?0.9:2.0,0.06,o.round?0.9:0.5,EMI(o.lightCol||0xfff7e0),lx,5.32,lz);
  }
  // fenêtres sur le mur est et ouest
  if(o.windows!==false){
    const nw=Math.max(2,Math.round(D/6));
    for(const s of[-1,1])for(let k=0;k<nw;k++){
      const wz=iz-D/2+(k+0.5)*D/nw,wx=ix+s*(W/2-0.25);
      B3(g,0.06,2.2,1.9,M.white,wx,2.6,wz);
      const glass=new THREE.Mesh(new THREE.PlaneGeometry(1.7,2.0),new THREE.MeshBasicMaterial({color:o.sky||0xaad4ff}));
      glass.position.set(wx-s*0.04,2.6,wz);glass.rotation.y=-s*Math.PI/2;g.add(glass);
      B3(g,0.07,2.2,0.06,M.white,wx-s*0.01,2.6,wz);B3(g,0.07,0.06,1.9,M.white,wx-s*0.01,2.6,wz);
      if(o.curtains)F.curtains(g,wx-s*0.2,0.3,wz,-s*Math.PI/2,2.2,3.6,o.curtains);
    }
  }
}
const DECOR={
  hospital(g,c){
    const ix=c.ix,iz=c.iz;
    shell(g,ix,iz,32,24,'clinic',{sky:0xbfe3ff,trim:M.white});
    // moniteurs, perfusions, rideaux
    for(let i=0;i<3;i++){
      const bz=iz-6+i*4.2;
      B3(g,0.5,0.4,0.06,M.black,ix+10.7,2.2,bz);
      const scr=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.3),new THREE.MeshBasicMaterial({map:ecgTex()}));scr.position.set(ix+10.67,2.2,bz);scr.rotation.y=-Math.PI/2;g.add(scr);
      cyl(0.025,0.025,2.0,6,M.chrome,ix+6.1,1.2,bz+1.2,g);B3(g,0.14,0.3,0.06,mt(0xe0f2fe,0.2,0),ix+6.1,2.1,bz+1.2);
      for(let k=0;k<4;k++)B3(g,0.5,0.04,0.04,M.chrome,ix+6.1,0.25,bz+1.2).rotation.y=k*0.78;
    }
    // fauteuils roulants
    for(const [wx,wz] of [[ix-13.8,iz+0.5],[ix-13.8,iz+2.2]]){
      B3(g,0.5,0.06,0.5,M.black,wx,0.65,wz);B3(g,0.5,0.5,0.06,M.black,wx-0.2,0.95,wz);
      for(const s of[-1,1])cyl(0.28,0.28,0.04,12,M.chrome,wx,0.38,wz+s*0.3,g).rotation.x=Math.PI/2;
    }
    // boîte à radios, horloge, signalétique
    B3(g,2.6,1.4,0.08,EMI(0xdbeafe),ix-15.7,2.5,iz-3);
    const clk=cyl(0.35,0.35,0.05,20,M.white,ix-15.7,3.8,iz+6,g);clk.rotation.z=Math.PI/2;B3(g,0.04,0.3,0.03,M.black,ix-15.62,3.9,iz+6);B3(g,0.04,0.03,0.22,M.black,ix-15.62,3.8,iz+6.1);
    signPlane(g,[],'URGENCES →','#b91c1c','#ffffff',4,1,ix+4,3.9,iz-D()+0.3,0,true);
    signPlane(g,[],'SALLE D’ATTENTE','#0e7490','#ffffff',4.4,1,ix-8,3.9,iz+11.7,Math.PI,true);
    signPlane(g,[],'PHARMACIE','#15803d','#ffffff',3.2,0.9,ix-15.7+0.1,3.9,iz-7,Math.PI/2,true);
    // lignes de couleur au sol
    B3(g,0.2,0.04,16,EMI(0x38bdf8),ix-2,0.25,iz+1);B3(g,0.2,0.04,16,EMI(0x22c55e),ix-1.5,0.25,iz+1);
    // extincteurs & désinfectant
    for(const [x,z] of [[ix+15.5,iz-8],[ix-15.5,iz+10]]){B3(g,0.3,0.7,0.3,mt(0xdc2626,0.5,0.1),x,0.7,z);}
    cyl(0.04,0.04,1.1,6,M.chrome,ix-11,0.75,iz+8.5,g);B3(g,0.14,0.22,0.1,mt(0x93c5fd,0.3,0),ix-11,1.35,iz+8.5);
    function D(){return 24/2;}
  },
  maquis(g,c){
    const ix=c.ix,iz=c.iz;
    shell(g,ix,iz,36,24,'maquis',{sky:0xffd9a0,trim:mt(0x3b2412,0.8,0),lightCol:0xffe0a0,round:true});
    // miroir derrière le comptoir + néons
    B3(g,16,2.0,0.05,mt(0xdbeafe,0.04,0.95),ix-6,3.0,iz-11.55);
    signPlane(g,[],'BIÈRE FRAÎCHE','#0b1220','#38bdf8',4.4,1.1,ix+8,4.0,iz-11.7,0,true);
    signPlane(g,[],'OUVERT 7J/7','#0b1220','#f472b6',3.2,0.9,ix-15,4.0,iz-11.7,0,true);
    // fanions et écharpes de supporters
    for(let k=0;k<20;k++)B3(g,0.3,0.32,0.02,EMI([0x16a34a,0xdc2626,0xfacc15][k%3]),ix-17+k*1.75,4.3,iz+0.5+Math.sin(k)*0.1);
    // caisses de bière & fûts
    for(let r=0;r<2;r++)for(let k=0;k<3;k++)B3(g,0.6,0.35,0.4,mt(0xdc2626,0.7,0),ix+15+r*0.0,0.4+k*0.36,iz-10.4+r*0.5);
    for(let k=0;k<3;k++)cyl(0.3,0.3,0.7,12,M.steel,ix+9+k*0.7,0.55,iz-11,g);
    // haut-parleurs & ventilateurs
    for(const sx of[-1,1])B3(g,0.5,0.9,0.4,M.black,ix+sx*17,3.2,iz+10.5);
    for(const fx of[-8,8]){cyl(0.04,0.04,0.5,6,M.black,ix+fx,5.1,iz+1,g);for(let b=0;b<4;b++){const bl=B3(g,1.4,0.03,0.2,mt(0x3b2412,0.8,0),ix+fx,4.85,iz+1);bl.rotation.y=b*Math.PI/4;}}
    // affiches
    for(let k=0;k<3;k++)F.artFrame(g,ix-12+k*3.2,3.0,iz+11.55,Math.PI,1.1,1.4,k+1);
  },
  cabaret(g,c){
    const ix=c.ix,iz=c.iz;
    shell(g,ix,iz,46,32,'club',{sky:0x14091c,trim:mt(0x1a0b22,0.6,0.2),gold:true,lightCol:0xff7ad9,windows:false});
    // colonnes dorées, miroirs
    for(const x of[-18,-6,6,18]){cyl(0.45,0.5,5.0,16,M.gold,ix+x,2.7,iz+7,g);}
    for(const s of[-1,1])for(let k=0;k<4;k++)B3(g,0.06,3.2,3.4,mt(0xdbeafe,0.04,0.95),ix+s*(23-0.35),2.4,iz-8+k*5.6);
    // écran LED derrière la scène
    const led=new THREE.Mesh(new THREE.PlaneGeometry(18,4.4),new THREE.MeshBasicMaterial({color:0x7a1fff}));led.position.set(ix,3.5,iz-15.5);g.add(led);
    window.CABARET_LED=led.material;
    // étoiles au plafond
    for(let k=0;k<80;k++)B3(g,0.07,0.04,0.07,EMI(0xfff3b0),ix-22+Math.random()*44,5.3,iz-15+Math.random()*30);
    // bougies de table & cordons de velours
    for(let k=0;k<8;k++){cyl(0.04,0.04,0.7,6,M.gold,ix-7.5+k*2.1,0.6,iz-7.2,g);}
    B3(g,15,0.08,0.08,mt(0x991b1b,0.8,0),ix,0.95,iz-7.2);
    // lignes lumineuses au sol
    B3(g,0.12,0.04,10,EMI(0xff2bd6),ix-9,0.25,iz+5);B3(g,0.12,0.04,10,EMI(0x22d3ee),ix+9,0.25,iz+5);
    F.plant(g,ix-21,iz-12,1.6);F.plant(g,ix+21,iz-12,1.6);
  },
  boutique(g,c){
    const ix=c.ix,iz=c.iz;
    shell(g,ix,iz,32,22,'shop',{sky:0xcfe8ff,trim:M.white,curtains:M.cream});
    // mur de chaussures, chapeaux, sacs
    for(let r=0;r<4;r++)for(let k=0;k<10;k++)B3(g,0.34,0.16,0.14,mt([0x111827,0xdc2626,0xf8fafc,0xd4af37,0x1d4ed8][(r+k)%5],0.5,0.1),ix-15.2,0.7+r*0.55,iz-3+k*0.45).rotation.y=Math.PI/2;
    for(let k=0;k<5;k++){cyl(0.22,0.26,0.12,10,mt([0x111827,0xd4af37,0xdc2626][k%3],0.7,0),ix-15.2,3.2,iz-3+k*0.9,g);}
    for(let k=0;k<4;k++)B3(g,0.4,0.5,0.22,mt([0xdc2626,0x2563eb,0xf59e0b,0x111827][k],0.6,0.1),ix+4+k*0.7,0.5,iz-10.2);
    // cabines d'essayage avec rideaux
    for(let k=0;k<2;k++){const cx=ix-11+k*3;B3(g,2.4,3.4,0.08,M.walnut,cx,1.9,iz+10.6);F.curtains(g,cx,0.3,iz+10.45,Math.PI,2.0,3.2,mt([0x7c3aed,0xdc2626][k],0.9,0));}
    // spots lumineux
    for(let k=0;k<5;k++){const sp=new THREE.Mesh(new THREE.ConeGeometry(0.9,2.6,12,1,true),new THREE.MeshBasicMaterial({color:0xfff2c8,transparent:true,opacity:0.1,side:THREE.DoubleSide,depthWrite:false}));sp.position.set(ix-10+k*5,4.1,iz-1);g.add(sp);}
    signPlane(g,[],'NOUVELLE COLLECTION','#111827','#fcd34d',6,1.2,ix,4.0,iz-D()+0.3,0,true);
    function D(){return 22/2;}
  },
  home2(g,c){
    const ix=c.ix,iz=c.iz;
    shell(g,ix,iz,26,20,'home',{sky:0xbfe0ff,trim:M.white,curtains:M.cream});
    for(let k=0;k<3;k++)F.artFrame(g,ix-8+k*5,2.9,iz+9.7,Math.PI,1.3,1.7,k);
    B3(g,3,0.1,0.5,M.walnut,ix+11.2,1.6,iz+6);for(let k=0;k<8;k++)B3(g,0.07,0.35,0.28,mt([0xdc2626,0x1d4ed8,0x16a34a,0xf59e0b][k%4],0.8,0),ix+10.4+k*0.1,1.8,iz+6);
  },
  home3(g,c){
    const ix=c.ix,iz=c.iz;
    shell(g,ix,iz,26,20,'home',{sky:0xffe0b0,trim:mt(0x7a4a24,0.7,0),curtains:mt(0xb91c1c,0.9,0)});
    for(let k=0;k<4;k++)F.artFrame(g,ix-9+k*4,3.0,iz+9.7,Math.PI,1.1,1.5,k+2);
    B3(g,0.5,1.8,2.4,M.walnut,ix+12.4,1.05,iz-3);for(let r=0;r<4;r++)for(let k=0;k<6;k++)B3(g,0.3,0.32,0.1,mt([0x1d4ed8,0x9b1c31,0xd4af37][(r+k)%3],0.8,0),ix+12.3,0.45+r*0.42,iz-4+k*0.36);
  },
  agency(g,c){shell(g,c.ix,c.iz,28,20,'shop',{sky:0xcfe8ff,trim:M.white,gold:true});},
  sports(g,c){shell(g,c.ix,c.iz,48,30,'clinic',{sky:0xcfe8ff,trim:M.white,lightCol:0xf0f8ff});}
};
window.DECORATE=function(type,g,cfg){
  try{if(DECOR[type])DECOR[type](g,cfg);}catch(e){console.error('[DÉCOR '+type+']',e);}
};
// animation : l'écran LED du cabaret change de couleur
const _u=update;
update=function(dt){
  _u(dt);
  if(window.CABARET_LED&&interiorType==='cabaret'){const t=performance.now()/1000;CABARET_LED.color.setHSL((t*0.08)%1,0.9,0.5+0.08*Math.sin(t*3));}
};
console.log('[DÉCOR] chargé.');
})();
