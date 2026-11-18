'use strict';
// =====================================================================
//  QUARTIERS SUPPLÉMENTAIRES (carte agrandie 14×14) + STYLES DE MAISONS / IMMEUBLES
//  Hôpital · tours d'affaires · vie nocturne (maquis, cabaret, centre commercial)
//  zone industrielle · université · terrain de foot · bancs du lac
// =====================================================================
const EXTRA_ZONES=[
  {x:10*CS,z:0,w:4*CS,h:3*CS,col:'rgba(14,116,144,0.24)',name:'QUARTIER MÉDICAL'},
  {x:10*CS,z:3*CS,w:4*CS,h:3*CS,col:'rgba(71,85,105,0.30)',name:'CENTRE D’AFFAIRES'},
  {x:10*CS,z:6*CS,w:4*CS,h:3*CS,col:'rgba(162,28,175,0.24)',name:'VIE NOCTURNE · MALL'},
  {x:10*CS,z:9*CS,w:4*CS,h:2*CS,col:'rgba(120,113,108,0.34)',name:'ZONE INDUSTRIELLE'},
  {x:10*CS,z:11*CS,w:4*CS,h:3*CS,col:'rgba(21,128,61,0.22)',name:'RÉSIDENTIEL EST'},
  {x:0,z:10*CS,w:10*CS,h:4*CS,col:'rgba(180,83,9,0.22)',name:'RÉSIDENTIEL SUD · CAMPUS'}
];
function zoneNameExt(x,z){
  if(x>=10*CS){
    if(z<3*CS)return 'QUARTIER MÉDICAL';
    if(z<6*CS)return 'CENTRE D’AFFAIRES';
    if(z<9*CS)return 'VIE NOCTURNE · MALL';
    if(z<11*CS)return 'ZONE INDUSTRIELLE';
    return 'RÉSIDENTIEL EST';
  }
  if(z>=10*CS)return (x>2*CS&&x<3*CS)?'CAMPUS UNIVERSITAIRE':'RÉSIDENTIEL SUD';
  return null;
}
const WORLD_ANCHORS=[];
const _hs2=(a,b)=>((a*73856093)^(b*19349663))>>>0;
const _bm=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r===undefined?0.7:r,metalness:m||0});

// ---------- textures de façade vitrée (fenêtres allumées au hasard)
const _winCache={};
function winTex(kind){
  if(_winCache[kind])return _winCache[kind];
  const c=document.createElement('canvas');c.width=128;c.height=256;const x=c.getContext('2d');
  const e=document.createElement('canvas');e.width=128;e.height=256;const y=e.getContext('2d');
  const pal=kind===1?['#2b4a6b','#3f6c91']:kind===2?['#27323f','#394a5c']:['#33506e','#4a7aa3'];
  x.fillStyle=pal[0];x.fillRect(0,0,128,256);y.fillStyle='#000';y.fillRect(0,0,128,256);
  for(let r=0;r<16;r++)for(let k=0;k<8;k++){
    const lit=Math.random()<0.38;
    x.fillStyle=lit?'#e7d9a8':pal[1];x.fillRect(k*16+2,r*16+3,12,10);
    if(lit){y.fillStyle='#ffd980';y.fillRect(k*16+2,r*16+3,12,10);}
  }
  x.strokeStyle='rgba(255,255,255,0.12)';for(let r=0;r<16;r++){x.beginPath();x.moveTo(0,r*16);x.lineTo(128,r*16);x.stroke();}
  const t1=new THREE.CanvasTexture(c),t2=new THREE.CanvasTexture(e);
  t1.wrapS=t1.wrapT=t2.wrapS=t2.wrapT=THREE.RepeatWrapping;
  return _winCache[kind]={t1,t2};
}
function glassMat(kind,w,ht,tint,ds){
  const b=winTex(kind),tx=b.t1.clone(),em=b.t2.clone();tx.needsUpdate=true;em.needsUpdate=true;
  tx.repeat.set(Math.max(1,w/9),Math.max(1,ht/16));em.repeat.copy(tx.repeat);
  const m=new THREE.MeshStandardMaterial({map:tx,emissiveMap:em,emissive:new THREE.Color(0xffd166),emissiveIntensity:0.15,color:tint||0xffffff,roughness:0.3,metalness:0.5});
  ds.push(tx,em,m);if(typeof buildingMats!=='undefined')buildingMats.push(m);return m;
}
function slab(G,ox,oz,bs,x,z,w,d,col){bx(w,0.3,d,col||0x8b95a3,x,0.15,z,G);}
function solid(bs,ox,oz,lx,lz,w,d){bs.push([ox+lx-w/2,oz+lz-d/2,ox+lx+w/2,oz+lz+d/2]);}
const _signCache={};
function signPlane(G,ds2,txt,bg,fg,w,h,x,y,z,ry,glow){
  const key=[txt,bg,fg,w,h].join('~');let t=_signCache[key];
  if(!t){
    const c=document.createElement('canvas');c.width=512;c.height=Math.round(512*h/w);const g=c.getContext('2d');
    g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.strokeStyle=fg;g.lineWidth=6;g.strokeRect(8,8,c.width-16,c.height-16);
    g.fillStyle=fg;g.font='bold '+Math.round(c.height*0.4)+'px sans-serif';g.textAlign='center';g.textBaseline='middle';
    const lines=String(txt).split('|');lines.forEach((l,i)=>g.fillText(l,c.width/2,c.height*(i+1)/(lines.length+1)));
    t=_signCache[key]=new THREE.CanvasTexture(c);
  }
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),glow?new THREE.MeshBasicMaterial({map:t}):new THREE.MeshStandardMaterial({map:t,roughness:0.6}));
  m.position.set(x,y,z);m.rotation.y=ry||0;G.add(m);ds2.push(m.geometry);return m;
}
function pad(G,ds,ds2,ox,oz,lx,lz,col,type){
  const p=new THREE.Mesh(new THREE.RingGeometry(0.95,1.35,28),new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide,transparent:true,opacity:0.85}));
  p.rotation.x=-Math.PI/2;p.position.set(lx,0.3,lz);G.add(p);ds2.push(p.geometry);ds.push({x:ox+lx,z:oz+lz,type});
}
function parkingLines(G,x,z,n,rot){for(let k=0;k<n;k++)bx(0.2,0.04,5,0xf8fafc,x+k*3.2,0.32,z,G);}
function lampPost(G,x,z,h){cyl(0.08,0.1,h||5.5,6,0x334155,x,(h||5.5)/2,z,G);bx(0.7,0.18,0.3,0xfef08a,x,(h||5.5)+0.05,z,G);}

// ---------- TOURS D'AFFAIRES
function tower(G,bs,ds,ds2,ox,oz,lx,lz,w,d,ht,style,tint,kind){
  const gm=glassMat(kind,w,ht,tint,ds),roof=_bm(0x1f2937,0.6,0.3);
  bx(w+3,6,d+3,0x374151,lx,3.3,lz,G);                               // socle commercial
  bx(w+3.2,0.4,d+3.2,0x111827,lx,6.4,lz,G);
  bx(w-0.4,0.12,d-0.4,0x93c5fd,lx,3.2,lz+(d+3)/2+0.02,G).material=_bm(0x93c5fd,0.1,0.8);
  let top=6.5;
  if(style===0){const m=bx(w,ht,d,gm,lx,ht/2+6.5,lz,G);m.material=[gm,gm,roof,roof,gm,gm];top=ht+6.5;}
  else if(style===1){                                              // tour étagée
    let cw=w,cd=d,y=6.5;
    for(let s=0;s<3;s++){const hh=ht/3;const m=bx(cw,hh,cd,gm,lx,y+hh/2,lz,G);m.material=[gm,gm,roof,roof,gm,gm];y+=hh;cw*=0.78;cd*=0.78;}
    top=y;
  }else{                                                           // tours jumelles + passerelle
    const w2=w*0.46;
    for(const s of[-1,1]){const m=bx(w2,ht,d*0.9,gm,lx+s*w*0.27,ht/2+6.5,lz,G);m.material=[gm,gm,roof,roof,gm,gm];}
    bx(w*0.2,2.6,d*0.5,0x93c5fd,lx,ht*0.62+6.5,lz,G);top=ht+6.5;
  }
  bx(w*0.4,1.8,d*0.4,0x475569,lx,top+0.9,lz,G);
  cyl(0.18,0.3,ht>70?16:9,6,0xe5e7eb,lx,top+(ht>70?8:4.5),lz,G);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(0.4,8,6),new THREE.MeshBasicMaterial({color:0xff2a2a}));bulb.position.set(lx,top+(ht>70?16.4:9.2),lz);G.add(bulb);ds2.push(bulb.geometry);
  solid(bs,ox,oz,lx,lz,w+3,d+3);
}
function businessChunk(cx,cz,G,bs,ds,ds2,ox,oz){
  slab(G,ox,oz,bs,40,40,62,62,0x7c8794);
  const hh=_hs2(cx*5+1,cz*11+3);
  const spots=[[22,22],[58,22],[22,58],[58,58]];
  for(let i=0;i<4;i++){
    const h=_hs2(cx*31+i,cz*17+i*3),w=14+h%6,d=14+(h>>>3)%6,ht=44+(h>>>5)%70,style=(h>>>9)%3,kind=(h>>>11)%3;
    tower(G,bs,ds,ds2,ox,oz,spots[i][0],spots[i][1],w,d,ht,style,[0xffffff,0xd9e6f2,0xe3d9c6][(h>>>13)%3],kind);
  }
  for(const[x,z]of[[40,40],[40,12],[12,40],[68,40],[40,68]])lampPost(G,x,z,5.5);
  for(let k=0;k<5;k++){bx(2.2,0.5,0.8,0x78716c,16+k*12,0.55,40.8,G);}  // bancs
}

// ---------- HÔPITAL
function hospitalChunk(G,bs,ds,ds2,ox,oz){
  slab(G,ox,oz,bs,40,40,62,62,0x9aa3ad);
  bx(46,13,22,0xf5f7fa,40,6.8,26,G);bx(48,0.8,24,0xcbd5e1,40,13.6,26,G);bx(46,1.4,22.2,0x0e7490,40,9.5,26,G);
  for(let k=0;k<6;k++)bx(3.4,2.4,0.15,_bm(0x7dd3fc,0.05,0.8),20.5+k*6.3,5.2,37.2,G);
  bx(18,0.5,7,0xe5e7eb,40,6.4,41,G);for(const s of[-1,1])cyl(0.35,0.35,6,10,0xf8fafc,40+s*8,3.2,44,G);
  signPlane(G,ds2,'HÔPITAL GÉNÉRAL|URGENCES 24/24','#ffffff','#b91c1c',12,3.4,40,10.8,37.4,0,false);
  const cr=new THREE.Mesh(new THREE.PlaneGeometry(4,4),new THREE.MeshBasicMaterial({color:0xdc2626}));cr.position.set(40,15.2,37.35);G.add(cr);ds2.push(cr.geometry);
  bx(1.2,3.6,0.1,0xffffff,40,15.2,37.4,G);bx(3.6,1.2,0.1,0xffffff,40,15.2,37.4,G);
  cyl(5,5,0.12,26,0x374151,60,13.9,22,G);bx(0.6,0.14,3.2,0xfde047,58.4,14.0,22,G);bx(0.6,0.14,3.2,0xfde047,61.6,14.0,22,G);bx(3.2,0.14,0.6,0xfde047,60,14.0,22,G);
  for(const ax of[18,26]){bx(2.3,1.8,4.8,0xf8fafc,ax,1.2,56,G);bx(2.32,0.4,4.82,0xdc2626,ax,1.2,56,G);bx(0.5,0.3,0.4,0x3b82f6,ax,2.2,53.8,G);solid(bs,ox,oz,ax,56,2.4,4.9);}
  solid(bs,ox,oz,40,26,46,22);
  parkingLines(G,50,60,5);for(const[x,z]of[[10,42],[70,42]])lampPost(G,x,z);
  pad(G,ds,ds2,ox,oz,40,44.5,0xef4444,'hospital');
}

// ---------- CENTRE COMMERCIAL
function mallChunk(G,bs,ds,ds2,ox,oz){
  slab(G,ox,oz,bs,40,40,62,62,0x8f98a3);
  bx(54,13,30,0xe7e5e4,40,6.8,26,G);bx(56,1,32,0x1e3a8a,40,13.8,26,G);
  for(let k=0;k<6;k++)bx(7,12.6,0.4,[0xf97316,0x14b8a6,0xa855f7,0xef4444,0x22c55e,0x3b82f6][k],17.5+k*9,6.6,41.1,G);
  bx(18,7,0.25,_bm(0x7dd3fc,0.05,0.85),40,4,41.3,G);bx(22,0.7,6,0x1e3a8a,40,7.9,44.2,G);for(const s of[-1,1])cyl(0.4,0.4,7.6,10,0xf1f5f9,40+s*10,4,47,G);
  signPlane(G,ds2,'MVOG MALL|BOUTIQUES · MODE · RESTOS','#0b1220','#fcd34d',16,3.6,40,11.6,41.4,0,true);
  solid(bs,ox,oz,40,26,54,30);
  for(let r=0;r<2;r++)parkingLines(G,14,58+r*8,16);
  for(const[x,z]of[[12,48],[68,48],[40,52]])lampPost(G,x,z);
  pad(G,ds,ds2,ox,oz,40,48.6,0xa855f7,'boutique');
}

// ---------- MAQUIS « CHEZ TONTON »
function maquisChunk(G,bs,ds,ds2,ox,oz){
  slab(G,ox,oz,bs,40,40,62,62,0x7a6a58);
  bx(28,6.4,16,0xd97706,40,3.4,24,G);bx(28.2,2.2,16.2,0xb91c1c,40,6.4,24,G);
  const tin=bx(30,0.2,18,0x9ca3af,40,8.0,24,G);tin.rotation.x=0.14;
  for(let k=0;k<7;k++)bx(0.25,0.15,18,0x6b7280,26+k*4.7,8.2,24,G).rotation.x=0.14;
  signPlane(G,ds2,'MAQUIS CHEZ TONTON|Poisson braisé · Bière fraîche','#7f1d1d','#fde68a',14,3.2,40,5.3,32.15,0,false);
  bx(3,5,0.2,0x3b2412,40,2.7,32.15,G);
  solid(bs,ox,oz,40,24,28,16);
  for(let t=0;t<5;t++){
    const tx=18+t*11,tz=42+(t%2)*7;
    cyl(0.7,0.7,0.06,14,0xdc2626,tx,1.0,tz,G);cyl(0.06,0.06,1.0,6,0x6b7280,tx,0.5,tz,G);
    for(const a of[0,1.57,3.14,4.71])bx(0.45,0.5,0.45,0xe5e7eb,tx+Math.cos(a)*1.1,0.5,tz+Math.sin(a)*1.1,G);
    const um=new THREE.Mesh(new THREE.ConeGeometry(1.7,0.7,12),_bm(0xef4444,0.8));um.position.set(tx,3.0,tz);G.add(um);ds2.push(um.geometry);cyl(0.04,0.04,2.4,6,0x6b7280,tx,1.8,tz,G);
  }
  for(let k=0;k<14;k++){const bb=new THREE.Mesh(new THREE.SphereGeometry(0.14,6,5),new THREE.MeshBasicMaterial({color:[0xfde047,0xf97316,0x22c55e,0xef4444][k%4]}));bb.position.set(12+k*4,4.4+Math.sin(k)*0.25,36);G.add(bb);ds2.push(bb.geometry);}
  cyl(0.7,0.7,0.9,12,0x1f2937,66,0.7,36,G);bx(1.4,0.1,0.8,0x9ca3af,66,1.2,36,G);
  lampPost(G,10,30);lampPost(G,70,30);
  pad(G,ds,ds2,ox,oz,40,34.4,0xf59e0b,'maquis');
}

// ---------- CABARET « LE MOULIN DORÉ »
function cabaretChunk(G,bs,ds,ds2,ox,oz){
  slab(G,ox,oz,bs,40,40,62,62,0x4b4a52);
  bx(38,10.5,24,0x1b1320,40,5.5,26,G);bx(38.4,0.8,24.4,0x7c2d12,40,11.2,26,G);
  for(let k=0;k<8;k++)bx(0.5,10,0.5,0xd4af37,22.5+k*5,5.4,38.2,G);
  signPlane(G,ds2,'LE MOULIN DORÉ|CABARET · SPECTACLE · BAR','#12060f','#fbbf24',17,4.2,40,8.4,38.3,0,true);
  for(let k=0;k<6;k++){const st=new THREE.Mesh(new THREE.SphereGeometry(0.22,6,5),new THREE.MeshBasicMaterial({color:0xfde047}));st.position.set(30.5+k*3.8,6.1+(k%2)*0.5,38.4);G.add(st);ds2.push(st.geometry);}
  bx(8,0.5,5,0x991b1b,40,4.6,41,G);bx(8,2.6,0.2,0x991b1b,40,3.3,43.4,G).rotation.x=-0.2;
  for(let k=0;k<5;k++){cyl(0.08,0.08,1.1,6,0xd4af37,33+k*3.5,0.75,45.2,G);}bx(14,0.12,0.14,0x991b1b,40,1.1,45.2,G);
  for(const s of[-1,1]){const beam=new THREE.Mesh(new THREE.ConeGeometry(2.6,26,14,1,true),new THREE.MeshBasicMaterial({color:s>0?0xa78bfa:0xfb7185,transparent:true,opacity:0.13,side:THREE.DoubleSide,depthWrite:false}));beam.position.set(40+s*18,19,40);beam.rotation.z=s*0.35;G.add(beam);ds2.push(beam.geometry);}
  solid(bs,ox,oz,40,26,38,24);
  for(const[x,z]of[[10,50],[70,50],[40,58]])lampPost(G,x,z);
  pad(G,ds,ds2,ox,oz,40,47.5,0xf472b6,'cabaret');
}

// ---------- ZONE INDUSTRIELLE
const _contCols=[0xdc2626,0x2563eb,0x16a34a,0xf59e0b,0x0891b2,0x7c3aed,0x9a3412];
function industrialChunk(cx,cz,G,bs,ds,ds2,ox,oz){
  slab(G,ox,oz,bs,40,40,62,62,0x6b7078);
  const h=_hs2(cx*13,cz*7);
  if(h%3!==0){
    bx(40,10,22,0x9ca3af,40,5.3,24,G);bx(41,0.6,23,0x4b5563,40,10.6,24,G);
    for(let k=0;k<9;k++)bx(0.4,10,0.3,0x6b7280,22+k*4.5,5.3,35.2,G);
    bx(10,6.5,0.3,0x374151,40,3.5,35.2,G);solid(bs,ox,oz,40,24,40,22);
    cyl(3,3,9,14,0xe5e7eb,10,4.8,52,G);cyl(3,3,9,14,0xe5e7eb,18,4.8,52,G);solid(bs,ox,oz,14,52,12,6.4);
  }
  for(let r=0;r<3;r++)for(let k=0;k<4;k++){
    const st=1+((h>>>(r*4+k))%3),x=16+k*16,z=(h%3!==0?46:20)+r*11;
    if(z>66)continue;
    for(let s=0;s<st;s++)bx(12.2,2.5,2.45,_contCols[(h+r*3+k+s)%_contCols.length],x,1.55+s*2.55,z,G);
    solid(bs,ox,oz,x,z,12.4,2.6);
  }
  
  lampPost(G,10,10,7);lampPost(G,70,70,7);
}
// ---------- UNIVERSITÉ + TERRAIN DE FOOT + PARC
function universityChunk(G,bs,ds,ds2,ox,oz){
  const lawn=new THREE.MeshStandardMaterial({map:TX.grass(6),roughness:0.95});
  const m=new THREE.Mesh(new THREE.BoxGeometry(62,0.3,62),lawn);m.position.set(40,0.15,40);G.add(m);ds2.push(m.geometry);
  bx(54,14,18,0xefe6d2,40,7.3,24,G);bx(56,1,20,0x7c2d12,40,14.5,24,G);
  for(let k=0;k<9;k++)bx(1.2,12,1.2,0xfffaf0,16+k*6,6.3,34,G);
  bx(56,1,3,0xefe6d2,40,12.8,34,G);
  bx(7,28,7,0xe7dcc4,64,14.3,22,G);const tp=new THREE.Mesh(new THREE.ConeGeometry(5.4,6,4),_bm(0x7c2d12,0.8));tp.rotation.y=Math.PI/4;tp.position.set(64,31,22);G.add(tp);ds2.push(tp.geometry);
  signPlane(G,ds2,'UNIVERSITÉ DE YAOUNDÉ|FACULTÉ DES SCIENCES','#1e3a8a','#fde68a',14,3,40,15.2,33.6,0,false);
  const ck=new THREE.Mesh(new THREE.CircleGeometry(2.2,20),new THREE.MeshBasicMaterial({color:0xf8fafc}));ck.position.set(64,24,18.4);ck.rotation.y=Math.PI;G.add(ck);ds2.push(ck.geometry);
  solid(bs,ox,oz,40,24,54,18);solid(bs,ox,oz,64,22,7,7);
  bx(2.4,0.05,26,0xd6d3d1,40,0.32,56,G);for(let k=0;k<6;k++){bx(2.2,0.5,0.8,0x78716c,26+k*5.6,0.6,50,G);}
  for(let k=0;k<7;k++)addTree(G,14+k*8.5,66,ds2,k%2===0);
}
function footballChunk(G,bs,ds,ds2,ox,oz){
  const pt=new THREE.Mesh(new THREE.PlaneGeometry(52,52),new THREE.MeshStandardMaterial({map:TX.pitch(),roughness:0.95}));pt.rotation.x=-Math.PI/2;pt.position.set(40,0.34,40);G.add(pt);ds2.push(pt.geometry);
  bx(62,0.3,62,0x2f6f3a,40,0.15,40,G);
  for(const s of[-1,1]){bx(0.14,2.4,0.14,0xffffff,40-3.4,1.5,40+s*26,G);bx(0.14,2.4,0.14,0xffffff,40+3.4,1.5,40+s*26,G);bx(6.9,0.14,0.14,0xffffff,40,2.7,40+s*26,G);}
  for(let k=0;k<9;k++)bx(2.4,0.6+(k%3)*0.4,1.1,0x1e40af,14+k*6.5,0.7,70,G);
  solid(bs,ox,oz,40,70,62,1.5);
  for(const[x,z]of[[10,10],[70,10],[10,70],[70,70]]){lampPost(G,x,z,9);}
}
function lakeBenches(G,ox,oz){
  const defs=[[14,40,Math.PI/2],[66,40,-Math.PI/2],[40,14,0],[40,66,Math.PI],[22,14,0],[58,66,Math.PI]];
  defs.forEach((d,i)=>{
    const g=new THREE.Group();g.position.set(d[0],0.28,d[1]);g.rotation.y=d[2];G.add(g);
    bx(1.9,0.1,0.55,0x8b5a2b,0,0.5,0,g);const bk=bx(1.9,0.5,0.08,0x8b5a2b,0,0.9,-0.27,g);bk.rotation.x=-0.12;
    for(const s of[-0.8,0.8])bx(0.08,0.5,0.5,0x374151,s,0.25,0,g);
    const wx=ox+d[0],wz=oz+d[1];
    if(!WORLD_ANCHORS.some(a=>Math.abs(a.x-wx)<0.5&&Math.abs(a.z-wz)<0.5))WORLD_ANCHORS.push({kind:'sit',variant:'lap',x:wx,z:wz,face:d[2],seatY:0.28+0.5,label:'🪑 S’asseoir au bord du lac'});
  });
}

// ---------- ROUTEUR DE CHUNKS
function DISTRICT_CHUNK(cx,cz,G,bs,ds,ds2,ox,oz){
  const k=cx+','+cz;
  if(k==='10,1'){hospitalChunk(G,bs,ds,ds2,ox,oz);return true;}
  if(cx>=10&&cx<=12&&cz>=3&&cz<=5){businessChunk(cx,cz,G,bs,ds,ds2,ox,oz);return true;}
  if(k==='10,7'){maquisChunk(G,bs,ds,ds2,ox,oz);return true;}
  if(k==='11,7'){cabaretChunk(G,bs,ds,ds2,ox,oz);return true;}
  if(k==='12,7'){mallChunk(G,bs,ds,ds2,ox,oz);return true;}
  if(cx>=10&&cz>=9&&cz<=10){industrialChunk(cx,cz,G,bs,ds,ds2,ox,oz);return true;}
  if(k==='2,11'){universityChunk(G,bs,ds,ds2,ox,oz);return true;}
  if(k==='5,11'){footballChunk(G,bs,ds,ds2,ox,oz);return true;}
  return false;
}

// ---------- VARIÉTÉ DES MAISONS (toits, balcons, vérandas)
function houseStyle(G,ds2,h,lx,lz,w,d,ht){
  const s=1+(h%5),terra=_bm([0xb4532a,0x7c2d12,0x6b7280,0x3f6212,0x1e3a8a][(h>>>3)%5],0.8),wall=0xf2e5d0;
  const top=ht+0.95;
  if(s===1){                                             // moderne, toit plat, verrière
    bx(w-2,2.6,d-3,_bm(0xe5e7eb,0.6,0.1),lx,top+1.3,lz-0.5,G);
    bx(w-4,1.8,0.15,_bm(0x7dd3fc,0.05,0.8),lx,top+1.4,lz+d/2-1.9,G);
    for(let k=0;k<3;k++){const p=bx(2.4,0.1,1.4,0x1e3a8a,lx-3+k*3,top+2.7,lz-2,G);p.rotation.x=-0.45;}
    cyl(0.9,0.9,1.5,10,0xd1d5db,lx+w/2-2,top+0.75,lz-d/2+2,G);
  }else if(s===2){                                       // toit à deux pentes
    for(const sx of[-1,1]){const r=bx(w/2+0.8,0.25,d+1.4,terra,lx+sx*w/4,top+2.2,lz,G);r.rotation.z=sx*0.5;}
    bx(0.5,2.3,d+0.6,wall,lx,top+1.0,lz,G).visible=true;
    bx(1.2,3.2,1.2,0x9a3412,lx+w/3,top+2.6,lz-d/4,G);
  }else if(s===3){                                       // toit en pavillon + véranda
    const r=new THREE.Mesh(new THREE.ConeGeometry(11.8,4.6,4),terra);r.rotation.y=Math.PI/4;r.position.set(lx,ht+2.86,lz);G.add(r);ds2.push(r.geometry);
    bx(w-3,0.3,2.6,0x78350f,lx,3.6,lz+d/2+1.3,G);
    for(const sx of[-1,1])cyl(0.15,0.15,3.4,8,0xfff7ed,lx+sx*(w/2-2),1.9,lz+d/2+2.4,G);
  }else if(s===4){                                       // terrasse sur le toit
    bx(w-1,0.9,d-1,wall,lx,top+0.45,lz,G);
    for(const sx of[-1,1])bx(0.15,2.4,0.15,0x78350f,lx+sx*(w/2-2),top+2.0,lz+d/2-2,G);
    bx(w-3,0.15,3.2,0x78350f,lx,top+3.2,lz+d/2-2,G);
    const dish=new THREE.Mesh(new THREE.SphereGeometry(0.9,10,6,0,Math.PI*2,0,Math.PI/2),_bm(0xe5e7eb,0.5));dish.rotation.x=0.9;dish.position.set(lx-w/2+2,top+1.6,lz);G.add(dish);ds2.push(dish.geometry);
  }else{                                                 // mansarde + lanterne
    bx(w-2,2.4,d-2,terra,lx,top+1.2,lz,G);bx(w-6,1.8,d-6,terra,lx,top+3.3,lz,G);bx(2,1.2,2,_bm(0xfef08a,0.2),lx,top+4.8,lz,G);
  }
  // balcon à l'étage (avant)
  if(h%2===0){bx(w*0.55,0.2,1.3,0xd6d3d1,lx,ht-1.3,lz+d/2+0.65,G);bx(w*0.55,0.8,0.08,_bm(0xcbd5e1,0.2,0.7),lx,ht-0.8,lz+d/2+1.25,G);}
}
function buildingStyle(G,ds2,h,lx,lz,w,d,ht){
  const k=h%4;
  if(k===0){                                             // balcons étagés
    const n=Math.min(6,Math.floor(ht/4));
    for(let i=1;i<=n;i++)bx(w*0.8,0.18,1.2,0xcbd5e1,lx,i*(ht/(n+1)),lz+d/2+0.6,G);
  }else if(k===1){                                       // bandeau coloré + enseigne verticale
    bx(w+0.3,1.2,d+0.3,[0x0ea5e9,0xf97316,0x22c55e,0xa855f7][(h>>>2)%4],lx,ht*0.62,lz,G);
    bx(0.5,ht*0.35,2,0xfacc15,lx+w/2+0.3,ht*0.4,lz+d/2-1.5,G);
  }else if(k===2){                                       // piliers + château d'eau
    for(let i=-1;i<=1;i+=2)bx(0.9,ht,0.9,0x94a3b8,lx+i*(w/2-0.4),ht/2+0.3,lz+d/2,G);
    cyl(1.6,1.6,2.4,12,0x1e3a8a,lx,ht+2.1,lz,G);
  }else{                                                 // cadre vitré sur le toit + antenne parabolique
    bx(w*0.6,2.4,d*0.6,_bm(0x93c5fd,0.1,0.7),lx,ht+1.9,lz,G);
    const dish=new THREE.Mesh(new THREE.SphereGeometry(1.1,10,6,0,Math.PI*2,0,Math.PI/2),_bm(0xe5e7eb,0.5));dish.rotation.x=0.8;dish.position.set(lx+w/3,ht+1.6,lz-d/3);G.add(dish);ds2.push(dish.geometry);
  }
}
