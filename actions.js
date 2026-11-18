'use strict';
// =====================================================================
//  ACTIONS DE LA VIE QUOTIDIENNE : s'asseoir, cuisiner, boire, danser, jouer du piano…
//  Chaque action lance une animation qui se répète + une caméra de cinéma
//  jusqu'à ce que tu te lèves (joystick, bouton ou touche action).
//  Mode photo (touche P) : cache toute l'interface pour capturer / filmer.
// =====================================================================
(function(){
const ACT=window.ACT={anchors:{},cur:null,focus:null,active:null,drunkUntil:0};
const $a=id=>document.getElementById(id);
const clampA=(v,a,b)=>Math.max(a,Math.min(b,v));
const once={};
const guardA=(label,fn)=>function(){try{return fn.apply(this,arguments);}catch(e){if(!once[label]){once[label]=1;console.error('[ACTIONS '+label+']',e);}try{if(ACT.active)stop(true);}catch(_){}}};
const now=()=>performance.now()/1000;

// ---------- DÉFINITION DES ACTIONS
const KINDS={
  sit:{label:'🪑 S’asseoir',stand:false},
  sofa:{label:'🛋️ Se détendre sur le canapé'},
  fire:{label:'🔥 S’asseoir devant la cheminée'},
  bar:{label:'🍺 Siroter une bière au comptoir'},
  cook:{label:'🍳 Cuisiner',stand:true},
  dance:{label:'💃 Danser',stand:true},
  piano:{label:'🎹 Jouer du piano'},
  lie:{label:'🛌 S’allonger'},
  lounge:{label:'🏖️ Bronzer sur le transat'},
  curl:{label:'💪 Faire des haltères',stand:true},
  pose:{label:'🪞 Se regarder dans le miroir',stand:true},
  cue:{label:'🎱 Jouer au billard',stand:true},
  dart:{label:'🎯 Jouer aux fléchettes',stand:true}
};

// ---------- REGISTRE D'ANCRES
ACT.reg=function(type,a){
  (ACT.anchors[type]=ACT.anchors[type]||[]).push(a);return a;
};
ACT.clear=function(type){ACT.anchors[type]=[];};
ACT.begin=function(type,focus){ACT.cur=type;ACT.focus=focus||null;ACT.clear(type);};
ACT.end=function(){ACT.cur=null;ACT.focus=null;};
// coordonnées monde d'un point local à un groupe de meubles (chaîne de groupes via userData.T)
function wpos(g,lx,lz,lf){
  let X=lx,Z=lz,F=lf||0;
  for(let q=g;q&&q.userData&&q.userData.T;q=q.userData.T.parG){
    const T=q.userData.T,c=Math.cos(T.ry),s=Math.sin(T.ry);
    const nx=T.x+X*c+Z*s,nz=T.z-X*s+Z*c;X=nx;Z=nz;F+=T.ry;
  }
  return{x:X,z:Z,face:F};
}
ACT.wpos=wpos;
ACT.regLocal=function(g,kind,lx,lz,lf,o){
  if(!ACT.cur)return null;
  const p=wpos(g,lx,lz,lf);
  const a=Object.assign({kind:kind,x:p.x,z:p.z,face:p.face,type:ACT.cur,focus:ACT.focus},o||{});
  return ACT.reg(ACT.cur,a);
};

// ---------- MÉMOIRE DE SESSION
let SS=null;
const DEF={'armL.z':0.05,'armR.z':-0.05};
const CH=['armL.x','armL.z','armR.x','armR.z','elbowL.x','elbowR.x','legL.x','legL.z','legR.x','legR.z','kneeL.x','kneeR.x','torso.x','torso.y','torso.z','head.x','head.y','head.z','yaw','body.x'];
function T(n,v){SS.tg[n]=v;}
const snd=function(){if(SS&&!SS.mute&&typeof playTone==='function')playTone.apply(null,arguments);};
function phase(t,durs){
  const tot=durs.reduce((a,b)=>a+b,0);let u=t%tot;
  for(let i=0;i<durs.length;i++){if(u<durs[i])return{i:i,k:u/durs[i],u:u};u-=durs[i];}
  return{i:0,k:0,u:0};
}
function sitBase(lean){T('legL.x',-1.5);T('legR.x',-1.5);T('kneeL.x',1.5);T('kneeR.x',1.5);T('legL.z',0.05);T('legR.z',-0.05);T('torso.x',lean||0);}
function focusYaw(A){
  if(!A.focus||!SS)return 0;
  const dx=A.focus.x-A.x,dz=A.focus.z-A.z;let d=Math.atan2(dx,dz)-A.face;
  while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;
  return clampA(d,-0.9,0.9);
}

// ---------- POSES (cibles ; le lissage se fait dans apply)
const POSES={
  guard(t,A){
    T('armL.x',-0.8);T('elbowL.x',-2.0);T('armL.z',-0.35);T('armR.x',-0.8);T('elbowR.x',-2.0);T('armR.z',0.35);
    T('legL.z',0.15);T('legR.z',-0.15);T('head.y',Math.sin(t*0.4)*0.6);T('head.x',0);
    if(phase(t,[12,1.6]).i===1){T('armL.x',-1.5);T('elbowL.x',-1.6);T('armL.z',0.1);T('head.x',0.5);T('head.y',0);}
  },
  talk(t,A){
    T('armR.x',-0.6+Math.sin(t*2.3)*0.3);T('elbowR.x',-1.1+Math.sin(t*3.1)*0.3);T('armL.x',-0.3+Math.sin(t*1.7)*0.12);T('elbowL.x',-0.6);
    T('head.y',Math.sin(t*0.8)*0.18);T('head.x',Math.sin(t*2.6)*0.05);T('torso.y',Math.sin(t*0.7)*0.08);T('legL.z',0.08);T('legR.z',-0.08);
  },
  write(t,A){
    T('armL.x',-1.1);T('elbowL.x',-1.3);T('armR.x',-1.0);T('elbowR.x',-1.4+Math.sin(t*8)*0.05);T('head.x',0.35);T('torso.x',0.08);
    if(phase(t,[7,1.5]).i===1){T('head.x',-0.05);T('head.y',0.4);}
  },
  serve(t,A){
    const p=phase(t,[8,3]);
    if(p.i===0){T('armL.x',-1.0+Math.sin(t*3)*0.1);T('armR.x',-1.0-Math.sin(t*3)*0.1);T('elbowL.x',-1.2);T('elbowR.x',-1.2);T('head.x',0.3);T('head.y',Math.sin(t*0.5)*0.5);}
    else{T('armR.x',-1.6);T('elbowR.x',-0.6);T('armL.x',-0.9);T('elbowL.x',-1.1);T('head.x',0.25);T('head.y',0);}
    T('legL.z',0.1);T('legR.z',-0.1);
  },
  mop(t,A){
    T('torso.x',0.3);T('armL.x',-0.7+Math.sin(t*2)*0.3);T('armR.x',-0.7+Math.sin(t*2)*0.3);T('elbowL.x',-0.5);T('elbowR.x',-0.5);T('head.x',0.3);
    T('legL.x',Math.sin(t*1.6)*0.3);T('legR.x',-Math.sin(t*1.6)*0.3);SS.slide=Math.sin(t*0.5)*A.range;
  },
  browse(t,A){
    const p=phase(t,[4,2,3]);
    T('legL.z',0.1);T('legR.z',-0.1);T('head.y',p.i===0?-0.5:0.2);T('head.x',0.15);
    if(p.i===0){T('armR.x',-0.9+Math.sin(t*3)*0.2);T('armR.z',-0.5);T('elbowR.x',-0.7);T('armL.x',-0.3);}
    else if(p.i===1){T('armR.x',-1.4);T('elbowR.x',-1.6);T('armR.z',-0.1);T('armL.x',-0.8);T('elbowL.x',-1.0);}
    else{T('armR.x',-0.4);T('elbowR.x',-0.6);T('armL.x',-0.3);}
  },
  mc(t,A){
    T('armR.x',-1.3);T('elbowR.x',-2.0);T('armR.z',-0.1);T('armL.x',-0.6+Math.sin(t*1.8)*0.5);T('armL.z',0.5+Math.sin(t*1.4)*0.3);T('elbowL.x',-0.6);
    T('head.y',Math.sin(t*0.6)*0.6);T('head.x',-0.05);SS.slide=Math.sin(t*0.35)*A.range;
  },
  type(t,A){
    T('armL.x',-1.0+Math.sin(t*9)*0.05);T('armR.x',-1.0-Math.sin(t*9)*0.05);T('elbowL.x',-0.7);T('elbowR.x',-0.7);T('head.x',0.3);T('head.y',Math.sin(t*0.3)*0.25);
  },
  carry(t,A){
    T('armL.x',-1.2);T('armR.x',-1.2);T('elbowL.x',-0.9);T('elbowR.x',-0.9);T('armL.z',0.15);T('armR.z',-0.15);T('head.x',0.05);T('torso.x',-0.05);
  },
  cower(t,A){
    T('legL.x',-0.9);T('legR.x',-0.9);T('kneeL.x',1.5);T('kneeR.x',1.5);T('torso.x',0.55);T('armL.x',-2.8);T('armR.x',-2.8);T('elbowL.x',-1.6);T('elbowR.x',-1.6);T('head.x',0.5);
    T('torso.z',Math.sin(t*30)*0.03);SS.bounce=-0.28;
  },
  sit(t,A){
    sitBase(0.05);
    const look=Math.sin(t*0.35)*0.45,v=A.variant||'lap';
    T('head.x',0.04+Math.sin(t*0.9)*0.03);T('head.y',look);
    if(v==='phone'){
      const p=phase(t,[8,3]);
      if(p.i===0){T('armR.x',-1.15);T('elbowR.x',-1.55+Math.sin(t*5)*0.04);T('armL.x',-0.9);T('elbowL.x',-1.4);T('head.x',0.38);T('head.y',0);}
      else{T('armL.x',-0.5);T('elbowL.x',-1.1);T('armR.x',-0.5);T('elbowR.x',-1.1);}
    }else if(v==='eat'){
      const a=0.5+0.5*Math.sin(t*1.9-1.57);
      T('armR.x',-1.1);T('elbowR.x',-0.8-1.3*a);T('armL.x',-0.9);T('elbowL.x',-0.9);T('head.x',0.1+0.25*a);T('head.y',Math.sin(t*0.3)*0.2);
    }else if(v==='show'){
      const fy=focusYaw(A),p=phase(t,[8,2.6]);
      T('head.y',fy+Math.sin(t*0.5)*0.08);T('head.x',0.02);T('armL.x',-0.5);T('elbowL.x',-1.1);T('armR.x',-0.5);T('elbowR.x',-1.1);
      if(p.i===1){T('armL.x',-1.3);T('armR.x',-1.3);T('armL.z',0.1);T('armR.z',-0.1);T('elbowL.x',-1.7+Math.sin(t*14)*0.35);T('elbowR.x',-1.7+Math.sin(t*14+0.6)*0.35);
        if(!SS.cl||t-SS.cl>0.22){SS.cl=t;snd(900+Math.random()*300,0.03,'square',0.012);}}
    }else{
      T('armL.x',-0.5);T('elbowL.x',-1.0);T('armR.x',-0.5);T('elbowR.x',-1.0);
      if(phase(t,[10,1.2]).i===1){T('head.y',0);T('torso.x',0.0);T('armL.z',0.4);T('armR.z',-0.4);}
    }
  },
  sofa(t,A){
    sitBase(-0.2);
    T('armL.z',1.25);T('armL.x',-0.2);T('armR.z',-1.25);T('armR.x',-0.2);T('elbowL.x',-0.3);T('elbowR.x',-0.3);
    T('head.y',focusYaw(A)*0.6+Math.sin(t*0.4)*0.2);T('head.x',-0.04);
    const p=phase(t,[7,4,3]);
    if(p.i===1){T('armR.z',-0.25);T('armR.x',-1.55);T('elbowR.x',-1.9);T('head.x',-0.12);}
    else if(p.i===2){T('head.x',-0.2+Math.sin(t*10)*0.06);T('torso.x',-0.24+Math.sin(t*10)*0.03);}
  },
  fire(t,A){
    sitBase(0.05);
    const p=phase(t,[6,6]);
    T('head.y',focusYaw(A)*0.5);
    if(p.i===0){T('armL.x',-1.35);T('armR.x',-1.35);T('armL.z',0.25);T('armR.z',-0.25);T('elbowL.x',-0.35);T('elbowR.x',-0.35);T('head.x',0.04+Math.sin(t*2.4)*0.02);}
    else{T('armL.x',-0.6);T('elbowL.x',-1.1);T('armR.x',-0.6);T('elbowR.x',-1.1);T('head.x',0.1);T('head.y',Math.sin(t*0.5)*0.25);}
  },
  bar(t,A){
    T('legL.x',-1.15);T('legR.x',-1.3);T('kneeL.x',0.75);T('kneeR.x',0.95);T('torso.x',0.1);
    T('armL.x',-0.95);T('elbowL.x',-0.8);T('armL.z',0.12);
    const p=phase(t,[1.5,3,2,2.5]);
    if(p.i===0){T('armR.x',-0.85);T('elbowR.x',-1.45);}
    else if(p.i===1){T('armR.x',-1.7);T('elbowR.x',-2.15);T('head.x',-0.28);
      if(SS.lastDrink!==Math.floor(t/8.99)){SS.lastDrink=Math.floor(t/8.99);SS.drinks=(SS.drinks||0)+1;snd(260,0.14,'sine',0.03,180);
        if(SS.drinks===3&&!SS.actor){ACT.drunkUntil=now()+75;if(typeof showToast==='function')showToast('🍻 Trois bières… tout tourne un peu !');}}}
    else if(p.i===2){T('armR.x',-0.6);T('elbowR.x',-1.3);T('head.y',Math.sin(p.k*3.2)*0.8);}
    else{T('armR.x',-0.7+Math.sin(t*4)*0.25);T('elbowR.x',-1.0);T('head.y',Math.sin(t*1.3)*0.3);}
  },
  cook(t,A){
    T('torso.x',0.2);T('head.x',0.38);T('legL.z',0.08);T('legR.z',-0.08);
    const p=phase(t,[6,6,3]);SS.cookPh=p.i;
    if(p.i===0){T('armL.x',-1.15);T('elbowL.x',-0.7);T('armR.x',-0.95+Math.sin(t*10)*0.1);T('elbowR.x',-1.0-0.45*(0.5+0.5*Math.sin(t*10)));
      const c=Math.sin(t*10);if(c>0.9&&(!SS.ch2||t-SS.ch2>0.3)){SS.ch2=t;snd(380,0.03,'square',0.03);}}
    else if(p.i===1){T('armR.x',-1.2+Math.cos(t*3.5)*0.15);T('armR.z',-0.1+Math.sin(t*3.5)*0.2);T('elbowR.x',-0.8);T('armL.x',-0.5);T('armL.z',0.5);T('elbowL.x',-1.2);T('head.x',0.3);}
    else{T('armR.x',-1.6);T('elbowR.x',-1.85);T('head.x',-0.05);T('armL.x',-0.4);T('armL.z',0.4);T('elbowL.x',-1.2);}
  },
  dance(t,A){
    const sp=A.variant==='slow'?3.2:5,am=A.variant==='slow'?0.6:1,b=Math.sin(t*sp);
    T('torso.z',b*0.14*am);T('torso.y',Math.sin(t*sp*0.5)*0.4*am);T('head.z',-b*0.08*am);
    T('armL.x',-2.6*am+Math.sin(t*sp)*0.4);T('armR.x',-2.6*am+Math.sin(t*sp+Math.PI)*0.4);T('armL.z',0.5);T('armR.z',-0.5);T('elbowL.x',-0.4);T('elbowR.x',-0.4);
    T('legL.x',Math.sin(t*sp)*0.45*am);T('legR.x',-Math.sin(t*sp)*0.45*am);T('kneeL.x',Math.max(0,-Math.sin(t*sp))*0.9*am);T('kneeR.x',Math.max(0,Math.sin(t*sp))*0.9*am);
    SS.bounce=Math.abs(b)*0.07*am;
    const u=t%12;T('yaw',u>10.2?(u-10.2)/1.8*Math.PI*2:0);
  },
  piano(t,A){
    sitBase(0.12);
    T('armL.x',-1.2+Math.sin(t*7)*0.07);T('armR.x',-1.2+Math.sin(t*7+1.7)*0.07);T('elbowL.x',-0.55);T('elbowR.x',-0.55);T('armL.z',0.2);T('armR.z',-0.2);
    T('torso.x',0.12+Math.sin(t*1.3)*0.06);T('head.x',0.15+Math.sin(t*0.9)*0.1);T('head.z',Math.sin(t*1.3)*0.08);
    if(!SS.ln||t-SS.ln>0.28){SS.ln=t;const sc=[261.6,293.7,329.6,392,440,523.3,587.3];snd(sc[(Math.random()*sc.length)|0],0.55,'sine',0.032);}
  },
  lie(t,A){
    T('body.x',-Math.PI/2);T('armL.x',-2.5);T('armL.z',0.9);T('armR.x',-2.5);T('armR.z',-0.9);T('elbowL.x',-1.8);T('elbowR.x',-1.8);
    T('legL.x',-0.1);T('legR.x',-0.05+Math.sin(t*0.4)*0.04);T('head.x',0.1);T('head.y',Math.sin(t*0.3)*0.2);SS.bounce=Math.sin(t*1.6)*0.01;
  },
  lounge(t,A){
    T('body.x',-1.25);T('armL.x',-2.5);T('armL.z',0.9);T('elbowL.x',-1.8);T('legL.x',-0.1);T('legR.x',-0.05);T('head.x',0.05);
    const p=phase(t,[5,3,2]);
    if(p.i===1){T('armR.x',-1.7);T('armR.z',-0.2);T('elbowR.x',-2.1);T('head.x',-0.15);}
    else{T('armR.x',-1.0);T('armR.z',-0.4);T('elbowR.x',-1.1);}
    SS.bounce=Math.sin(t*1.6)*0.01;
  },
  curl(t,A){
    const s=0.5+0.5*Math.sin(t*2.6),s2=0.5+0.5*Math.sin(t*2.6+Math.PI);
    T('armL.x',-0.1);T('armR.x',-0.1);T('armL.z',0.15);T('armR.z',-0.15);T('elbowL.x',-(0.1+1.9*s));T('elbowR.x',-(0.1+1.9*s2));
    T('torso.x',0.05);T('torso.y',Math.sin(t*1.3)*0.05);T('legL.z',0.1);T('legR.z',-0.1);T('head.x',-0.05);
    SS.bounce=0.01*Math.sin(t*5.2);
  },
  pose(t,A){
    const p=phase(t,[4,4,4,4]);
    T('legL.z',0.12);T('legR.z',-0.12);T('head.x',-0.04);
    if(p.i===0){T('armL.z',0.9);T('elbowL.x',-1.6);T('armR.z',-0.9);T('elbowR.x',-1.6);T('yaw',0);T('head.y',0);}
    else if(p.i===1){T('armL.x',-1.6);T('elbowL.x',-2.2);T('armL.z',0.7);T('armR.z',-0.9);T('elbowR.x',-1.6);T('yaw',0.5);T('head.y',-0.3);}
    else if(p.i===2){T('armR.x',-1.4);T('elbowR.x',-2.0);T('armR.z',-0.2);T('yaw',0);T('head.y',0.1);}
    else{T('armL.z',0.9);T('elbowL.x',-1.6);T('armR.z',-0.9);T('elbowR.x',-1.6);T('yaw',-0.5);T('head.y',0.3);}
  },
  cue(t,A){
    T('torso.x',0.85);T('legL.z',0.2);T('legR.z',-0.2);T('legL.x',0.25);T('legR.x',-0.35);
    T('armL.x',-1.5);T('elbowL.x',-0.2);T('armR.x',-0.9+Math.sin(t*3)*0.35);T('elbowR.x',-0.7+Math.sin(t*3)*0.35);T('head.x',-0.5);
    if(Math.sin(t*3)>0.97&&(!SS.hit||t-SS.hit>1)){SS.hit=t;snd(1100,0.04,'square',0.03);}
  },
  dart(t,A){
    const p=phase(t,[2.2,0.5,1.2]);
    T('yaw',0.7);T('legL.z',0.15);T('legR.z',-0.15);
    if(p.i===0){T('armR.x',-2.2);T('elbowR.x',-1.8);T('armL.x',-0.4);T('torso.x',-0.05);T('head.y',-0.2);}
    else if(p.i===1){T('armR.x',-1.3);T('elbowR.x',-0.1);T('torso.x',0.12);}
    else{T('armR.x',-0.6);T('elbowR.x',-0.6);T('head.y',0.2);}
    if(p.i===1&&!SS.thr){SS.thr=1;snd(700,0.05,'square',0.03);}if(p.i===0)SS.thr=0;
  }
};

// ---------- ACCESSOIRES TENUS EN MAIN
function bottle(){
  const g=new THREE.Group();
  const amber=mt(0x8a4b12,0.3,0.1);
  const b1=cyl(0.04,0.04,0.17,10,amber,0,-0.09,0,g),b2=cyl(0.018,0.036,0.1,10,amber,0,-0.23,0,g),cap=cyl(0.02,0.02,0.02,8,0xd4af37,0,-0.29,0,g);
  bx(0.082,0.07,0.082,0xfef3c7,0,-0.09,0,g).scale.set(1,1,1);
  return g;
}
function mug(col){const g=new THREE.Group();cyl(0.045,0.04,0.09,10,col||0xf8fafc,0,-0.05,0,g);bx(0.015,0.05,0.04,col||0xf8fafc,0.055,-0.05,0,g);return g;}
function glassProp(){const g=new THREE.Group();cyl(0.04,0.02,0.1,10,new THREE.MeshStandardMaterial({color:0xfecdd3,transparent:true,opacity:0.7}),0,-0.06,0,g);cyl(0.012,0.012,0.08,6,0xe5e7eb,0,-0.14,0,g);return g;}
function phoneProp(){const g=new THREE.Group();bx(0.07,0.01,0.13,0x0b1220,0,-0.02,0.04,g);bx(0.062,0.004,0.11,0x38bdf8,0,-0.0,0.04,g);return g;}
function forkProp(){const g=new THREE.Group();cyl(0.008,0.008,0.18,5,0xcbd5e1,0,-0.1,0,g);bx(0.04,0.04,0.008,0xcbd5e1,0,-0.2,0,g);return g;}
function dumbbell(){const g=new THREE.Group();const c=cyl(0.012,0.012,0.2,6,0x9ca3af,0,-0.04,0,g);c.rotation.z=Math.PI/2;for(const s of[-1,1])cyl(0.06,0.06,0.04,10,0x111827,s*0.09,-0.04,0,g).rotation.z=Math.PI/2;return g;}
function cueProp(){const g=new THREE.Group();const c=cyl(0.012,0.02,1.4,6,0xb98a55,0,-0.04,0.6,g);c.rotation.x=Math.PI/2;return g;}
function dartProp(){const g=new THREE.Group();const c=cyl(0.006,0.006,0.12,5,0xdc2626,0,-0.04,0.06,g);c.rotation.x=Math.PI/2;bx(0.03,0.03,0.01,0xfacc15,0,-0.04,-0.01,g);return g;}
function knifeSpoon(){
  const g=new THREE.Group();
  const k=new THREE.Group();bx(0.012,0.012,0.16,0xcbd5e1,0,-0.04,0.1,k);bx(0.02,0.02,0.1,0x3b2412,0,-0.04,-0.02,k);g.add(k);
  const s=new THREE.Group();cyl(0.01,0.01,0.2,5,0xcbd5e1,0,-0.1,0.02,s);const sp=new THREE.Mesh(new THREE.SphereGeometry(0.035,8,6),mt(0xcbd5e1,0.3,0.8));sp.scale.set(1,0.4,1);sp.position.set(0,-0.22,0.02);s.add(sp);g.add(s);
  g.userData.k=k;g.userData.s=s;return g;
}
function addHandProp(u,hand,g,rx){
  const el=hand==='R'?u.elbowR:u.elbowL;g.position.set(0,-0.36,0.03);if(rx)g.rotation.x=rx;el.add(g);SS.props.push({g:g,par:el});return g;
}
function addWorldProp(g,x,y,z,ry){g.position.set(x,y,z);g.rotation.y=ry||0;scene.add(g);SS.props.push({g:g,par:scene});return g;}
function makeProps(A,rig){
  const u=(rig||P.m).userData,k=A.kind,v=A.variant,fx=Math.sin(A.face),fz=Math.cos(A.face),rx=-Math.cos(A.face),rz=Math.sin(A.face);
  if(k==='bar'){addHandProp(u,'R',bottle());}
  else if(k==='sofa'||k==='fire'||(k==='sit'&&v==='lap')){addHandProp(u,'R',mug(0xf8fafc));}
  else if(k==='sit'&&v==='phone'){addHandProp(u,'R',phoneProp());}
  else if(k==='sit'&&v==='eat'){addHandProp(u,'R',forkProp());}
  else if(k==='lounge'){addHandProp(u,'R',glassProp());}
  else if(k==='curl'){addHandProp(u,'L',dumbbell());addHandProp(u,'R',dumbbell());}
  else if(k==='cue'){const c=cueProp();addHandProp(u,'R',c);}
  else if(k==='dart'){addHandProp(u,'R',dartProp());}
  else if(k==='mc'){const mic=new THREE.Group();cyl(0.012,0.012,0.14,6,0x111827,0,-0.08,0,mic);const hd=new THREE.Mesh(new THREE.SphereGeometry(0.035,8,6),mt(0xcbd5e1,0.3,0.8));hd.position.y=-0.16;mic.add(hd);addHandProp(u,'R',mic);}
  else if(k==='write'){const cb=new THREE.Group();bx(0.22,0.01,0.3,0xb98a55,0,-0.02,0.05,cb);bx(0.2,0.012,0.27,0xf8fafc,0,0,0.05,cb);addHandProp(u,'L',cb);}
  else if(k==='carry'){const box=new THREE.Group();bx(0.34,0.26,0.34,0xb98a55,0,0.42,0.38,box);u.torso.add(box);SS.props.push({g:box,par:u.torso});}
  else if(k==='cook'){
    const ks=knifeSpoon();addHandProp(u,'R',ks);SS.ks=ks;
    const y=(A.surfY||1.0)+0.02,px=A.x+fx*0.55,pz=A.z+fz*0.55;
    const board=new THREE.Group();bx(0.5,0.03,0.32,0xb98a55,0,0,0,board);for(let i=0;i<4;i++)bx(0.07,0.07,0.07,[0xdc2626,0x16a34a,0xf59e0b,0xfef3c7][i],-0.15+i*0.1,0.06,0.02,board);addWorldProp(board,px+rx*0.15,y,pz+rz*0.15,A.face);
    const pot=new THREE.Group();cyl(0.14,0.13,0.14,14,0x374151,0,0.08,0,pot);cyl(0.015,0.015,0.2,6,0x111827,0.2,0.1,0,pot).rotation.z=Math.PI/2;addWorldProp(pot,px-rx*0.45,y,pz-rz*0.45,0);
    SS.potPos={x:px-rx*0.45,y:y+0.2,z:pz-rz*0.45};
  }
}
function removeProps(){for(const p of SS.props){try{p.par.remove(p.g);}catch(e){}}SS.props=[];}

// ---------- ANIMATION : application sur le squelette
function applyRig(dt,rig){
  const u=(rig||P.m).userData,k=Math.min(1,dt*7);
  for(const c of CH){
    if(SS.tg[c]===undefined)SS.tg[c]=DEF[c]||0;
    if(SS.ch[c]===undefined)SS.ch[c]=DEF[c]||0;
    SS.ch[c]+=(SS.tg[c]-SS.ch[c])*k;
  }
  const c=SS.ch;
  u.armL.rotation.x=c['armL.x'];u.armL.rotation.z=c['armL.z'];u.armR.rotation.x=c['armR.x'];u.armR.rotation.z=c['armR.z'];
  u.elbowL.rotation.x=c['elbowL.x'];u.elbowR.rotation.x=c['elbowR.x'];
  if(!SS.walk){
    u.legL.rotation.x=c['legL.x'];u.legL.rotation.z=c['legL.z'];u.legR.rotation.x=c['legR.x'];u.legR.rotation.z=c['legR.z'];
    u.kneeL.rotation.x=c['kneeL.x'];u.kneeR.rotation.x=c['kneeR.x'];
  }
  u.torso.rotation.x=c['torso.x'];u.torso.rotation.y=c['torso.y'];u.torso.rotation.z=c['torso.z'];
  u.torso.position.z=-0.88*Math.sin(c['torso.x']);u.torso.position.y=0;u.torso.position.x=0;
  u.head.rotation.x=c['head.x'];u.head.rotation.y=c['head.y']+(SS.look||0);u.head.rotation.z=c['head.z'];
  u.gun.visible=false;
}
function resetRig(rig){
  const u=(rig||P.m).userData;
  for(const o of[u.torso,u.head,u.legL,u.legR,u.kneeL,u.kneeR,u.armL,u.armR,u.elbowL,u.elbowR]){o.rotation.set(0,0,0);}
  u.torso.position.set(0,0,0);(rig||P.m).rotation.x=0;(rig||P.m).rotation.z=0;
}

// ---------- DÉMARRAGE / ARRÊT
function nearAnchor(){
  if(P.car||P.enteringCar)return null;
  const list=interiorType?(ACT.anchors[interiorType]||[]):(typeof WORLD_ANCHORS!=='undefined'?WORLD_ANCHORS:[]);
  let best=null,bd=1.55;
  for(const a of list){if(a.taken)continue;const d=Math.hypot(P.x-a.x,P.z-a.z);if(d<bd){bd=d;best=a;}}
  return best;
}
ACT.near=nearAnchor;
function labelOf(a){
  const K=KINDS[a.kind]||{label:'Interagir'};
  let l=a.label||K.label;if(a.cost)l+=' · '+a.cost+' F';return l;
}
function start(a){
  if(SS)return;
  if(a.cost&&P.cash<a.cost){showToast('Il te faut '+a.cost+' FCFA.');return;}
  if(a.cost){P.cash-=a.cost;writeSave();}
  SS={a:a,t:0,ch:{},tg:{},props:[],shot:0,shotT:0,pos:new THREE.Vector3(cam.position.x,cam.position.y,cam.position.z),look:new THREE.Vector3(P.x,1.2,P.z),
     type:interiorType,x:P.x,z:P.z,raw:0,dyT:P.m.position.y,bounce:0,drinks:0};
  ACT.active=SS;
  const K=KINDS[a.kind]||{};
  SS.stand=!!K.stand;
  makeProps(a);
  document.body.classList.add('cutscene');
  const u=$a('sit-ui');if(u)u.style.display='flex';
  snd(520,0.08,'sine',0.03);
}
function insideObs(cfg,x,z){
  if(!cfg)return false;
  if(Math.abs(x-cfg.ix)>cfg.w/2-0.8||Math.abs(z-cfg.iz)>cfg.d/2-0.8)return true;
  for(const o of cfg.obs||[])if(x>o[0]-0.5&&x<o[2]+0.5&&z>o[1]-0.5&&z<o[3]+0.5)return true;
  return false;
}
function stop(silent){
  if(!SS)return;
  const a=SS.a;removeProps();
  // se relever à côté du meuble
  const cfg=interiorType?INTERIORS[interiorType]:null;
  const f=Math.atan2(Math.sin(a.face),Math.cos(a.face));
  const cands=[0,1.57,-1.57,3.14,0.7,-0.7].map(o=>[a.x+Math.sin(f+o)*1.05,a.z+Math.cos(f+o)*1.05]);
  let pick=cands.find(c=>!insideObs(cfg,c[0],c[1]))||cands[0];
  P.x=pick[0];P.z=pick[1];P.h=f;
  resetRig();
  document.body.classList.remove('cutscene');
  const u=$a('sit-ui');if(u)u.style.display='none';
  cam.fov=60;cam.updateProjectionMatrix();cam.rotation.z=0;
  SS=null;ACT.active=null;
}
ACT.stop=stop;

// ---------- CAMÉRA DE CINÉMA
const SHOTS=[
  {a:0.55,d:2.7,h:1.3,l:1.15,f:42},
  {a:-1.25,d:2.4,h:1.2,l:1.1,f:40},
  {a:0.15,d:1.9,h:0.85,l:1.35,f:36},
  {a:Math.PI-0.35,d:2.2,h:1.65,l:1.2,f:48,fo:true},
  {a:2.3,d:2.7,h:1.45,l:1.2,f:44},
  {a:1.05,d:3.1,h:1.9,l:1.0,f:50}
];
function cinema(dt){
  const A=SS.a,sh=SHOTS[SS.shot%SHOTS.length];
  SS.shotT+=dt;if(SS.shotT>5){SS.shotT=0;SS.shot++;}
  const base=A.face+sh.a+(SS.shot>=SHOTS.length?0.15:0)+Math.sin(SS.t*0.15)*0.1;
  const lie=A.kind==='lie'||A.kind==='lounge';
  const px=P.m.position.x,pz=P.m.position.z,py=P.m.position.y;
  let dist=sh.d*(lie?1.15:1);
  let tx=px+Math.sin(base)*dist,tz=pz+Math.cos(base)*dist,ty=py+(lie?0.8:sh.h)*(SS.stand?1.05:1)-(SS.stand?0:0.1);
  const cfg=SS.type?INTERIORS[SS.type]:null;
  if(cfg){
    for(let k=0;k<4;k++){
      const bad=Math.abs(tx-cfg.ix)>cfg.w/2-0.7||Math.abs(tz-cfg.iz)>cfg.d/2-0.7||(cfg.obs||[]).some(o=>tx>o[0]&&tx<o[2]&&tz>o[1]&&tz<o[3]);
      if(!bad)break;
      dist*=0.72;tx=px+Math.sin(base)*dist;tz=pz+Math.cos(base)*dist;
    }
    ty=Math.min(ty,4.2);
  }
  const k=Math.min(1,dt*2.2);
  SS.pos.x+=(tx-SS.pos.x)*k;SS.pos.y+=(ty-SS.pos.y)*k;SS.pos.z+=(tz-SS.pos.z)*k;
  let lx=px,lz=pz;
  if(sh.fo&&A.focus){lx=px+(A.focus.x-px)*0.55;lz=pz+(A.focus.z-pz)*0.55;}
  const ly=py+(lie?0.4:sh.l);
  SS.look.x+=(lx-SS.look.x)*k;SS.look.y+=(ly-SS.look.y)*k;SS.look.z+=(lz-SS.look.z)*k;
  cam.position.set(SS.pos.x+Math.sin(SS.t*0.9)*0.012,SS.pos.y+Math.sin(SS.t*1.3)*0.01,SS.pos.z+Math.cos(SS.t*0.8)*0.012);
  cam.fov+=(sh.f-cam.fov)*Math.min(1,dt*2);cam.updateProjectionMatrix();
  cam.lookAt(SS.look);
  if(ACT.drunkUntil>now())cam.rotation.z=Math.sin(SS.t*1.4)*0.05;
}


function poseStep(dt,mesh){
    const a=SS.a,K=a.kind,pose=POSES[K==='fire'?'fire':K];
    SS.bounce=0;SS.slide=0;
    if(pose)pose(SS.t,a);
    const standing=!!SS.stand;
    // hauteur & position
    const floorY=a.floorY!==undefined?a.floorY:0.16;
    const ty=standing?floorY:((a.seatY!==undefined?a.seatY:0.5)-0.86+0.03);
    let tyy=ty;
    if(K==='lie'||K==='lounge'){tyy=(a.seatY||0.6)+0.1;}
    SS.dyT+=(tyy+SS.bounce-SS.dyT)*Math.min(1,dt*6);
    applyRig(dt,mesh);
    const m=mesh;
    if(m===P.m)m.visible=true;
    const bk=SS.ch['body.x'];m.rotation.x=bk;
    const f=Math.sin(a.face),g=Math.cos(a.face);
    const off=(K==='lie'||K==='lounge')?(-bk/(Math.PI/2))*0.9:0;
    const rxv=Math.cos(a.face),rzv=-Math.sin(a.face),sl=(SS.slide||0),fo=(SS.fwdOff||0);
    const bx0=a.x+f*(off+fo)+rxv*sl,bz0=a.z+g*(off+fo)+rzv*sl;
    const k=Math.min(1,dt*5);
    SS.x+=(bx0-SS.x)*k;SS.z+=(bz0-SS.z)*k;
    m.position.set(SS.x,SS.dyT,SS.z);
    m.rotation.y=a.face+SS.ch['yaw'];
    // accessoires animés
    if(SS.ks){const ph=SS.cookPh||0;SS.ks.userData.k.visible=ph===0;SS.ks.userData.s.visible=ph!==0;}
    if(SS.potPos&&SS.cookPh===1&&Math.random()<dt*14&&typeof trs!=='undefined'){trs.push({m:bx(0.1,0.1,0.1,0xf1f5f9,SS.potPos.x+(Math.random()-0.5)*0.1,SS.potPos.y,SS.potPos.z+(Math.random()-0.5)*0.1),t:0.7,gr:1});}
    if(ACT.fireMats&&ACT.fireMats.length){const fl=0.5+0.5*Math.sin(SS.t*11)*Math.sin(SS.t*7.3);for(const fm of ACT.fireMats)fm.color.setRGB(1,0.35+0.35*fl,0.05+0.1*fl);}
}


// ---------- API ACTEURS (figurants animés avec le même moteur d'animations)
ACT.newSession=function(a,mesh,opts){
  const sess={a:a,t:Math.random()*30,ch:{},tg:{},props:[],shot:0,shotT:0,type:a.type,x:mesh.position.x,z:mesh.position.z,raw:0,dyT:mesh.position.y,bounce:0,drinks:0,actor:true,mute:true,
    stand:!!(KINDS[a.kind]&&KINDS[a.kind].stand)||['guard','talk','write','serve','mop','browse','mc','type','carry','cower'].indexOf(a.kind)>=0};
  const prev=SS;SS=sess;try{makeProps(a,mesh);}finally{SS=prev;}
  return sess;
};
ACT.stepActor=function(sess,mesh,dt){
  const prev=SS;SS=sess;
  try{
    sess.t+=dt;
    const k=sess.a.kind;
    poseStep(dt,mesh);
  }finally{SS=prev;}
};
ACT.endSession=function(sess,mesh){const prev=SS;SS=sess;try{removeProps();}finally{SS=prev;}resetRig(mesh);};
ACT.setKind=function(sess,mesh,kind,variant){
  if(sess.a.kind===kind&&sess.a.variant===variant)return;
  const prev=SS;SS=sess;try{removeProps();sess.tg={};sess.a=Object.assign({},sess.a,{kind:kind,variant:variant});sess.stand=!!(KINDS[kind]&&KINDS[kind].stand)||['guard','talk','write','serve','mop','browse','mc','type','carry','cower'].indexOf(kind)>=0;makeProps(sess.a,mesh);}finally{SS=prev;}
};

// ---------- BOUCLE
let _gi=getInput;
getInput=function(){
  const i=_gi.apply(this,arguments);
  if(SS){
    SS.raw=Math.max(Math.abs(i.x||0),Math.abs(i.y||0));
    const z=Object.assign({},i);for(const k in z)if(typeof z[k]==='number')z[k]=0;else if(typeof z[k]==='boolean')z[k]=false;
    return z;
  }
  return i;
};
let fireT=0;
const postReal=guardA('post',function(dt){
  if(typeof EX==='undefined')return;
  if(ACT.fireMats&&ACT.fireMats.length&&interiorType){const tt=now(),fl=0.5+0.5*Math.sin(tt*11)*Math.sin(tt*7.3);for(const fm of ACT.fireMats)fm.color.setRGB(1,0.35+0.35*fl,0.05+0.1*fl);}
  if(SS){
    if(P.car||interiorType!==SS.type||EX.isModal()){stop(true);return;}
    SS.t+=dt;
    if(SS.t>0.7&&SS.raw>0.55){stop();return;}
    poseStep(dt,P.m);
    P.x=SS.a.x;P.z=SS.a.z;
    cinema(dt);
    return;
  }
  // pas assis : invite d'action
  if(ACT.drunkUntil>now()&&typeof cam!=='undefined')cam.rotation.z=Math.sin(now()*1.4)*0.04;
  if(S!=='play')return;
  const a=nearAnchor();
  if(a&&!(typeof EX!=='undefined'&&EX.isModal())){
    // un « spot » plus proche (frigo, coffre…) garde la priorité
    let spotCloser=false;
    if(EX.dbg&&EX.dbg.nearSpot){const sp=EX.dbg.nearSpot();if(sp&&Math.hypot(P.x-sp.x,P.z-sp.z)<Math.hypot(P.x-a.x,P.z-a.z))spotCloser=true;}
    if(!spotCloser){
      const cpe=$a('ctx-prompt'),lbl=$a('act-label');
      if(cpe){cpe.textContent=labelOf(a)+' — '+(typeof touch!=='undefined'&&touch?'Interagir':'E');cpe.style.display='block';}
      if(lbl)lbl.textContent='INTERAGIR';
    }
  }
});

const _updA=update;
update=function(dt){
  _updA(dt);
  postReal(dt);
};
const _dsaA=doSmartAction;
doSmartAction=function(){
  if(SS){stop();return;}
  if(typeof EX!=='undefined'&&EX.isModal&&EX.isModal())return;
  if(SS===null&&!P.car&&!P.enteringCar){
    const a=nearAnchor();
    if(a){
      let spotCloser=false;
      if(EX&&EX.dbg&&EX.dbg.nearSpot){const sp=EX.dbg.nearSpot();if(sp&&Math.hypot(P.x-sp.x,P.z-sp.z)<Math.hypot(P.x-a.x,P.z-a.z))spotCloser=true;}
      if(!spotCloser){start(a);return;}
    }
  }
  return _dsaA.apply(this,arguments);
};

// ---------- INTERFACE : boutons « Se lever » / « Plan suivant » + MODE PHOTO
const css=document.createElement('style');
css.textContent=`
#sit-ui{position:fixed;left:50%;bottom:calc(22px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:42;display:none;gap:10px;align-items:center}
#sit-ui button{font-family:inherit;font-weight:800;font-size:13px;border-radius:999px;border:1px solid rgba(255,255,255,0.3);background:rgba(5,8,14,0.7);color:#fff;padding:10px 16px;cursor:pointer;backdrop-filter:blur(3px)}
#sit-ui button.up{background:#fde047;color:#111827;border-color:#fde047}
#sit-hint{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(74px + env(safe-area-inset-bottom,0px));z-index:42;font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:.4px;display:none}
body.cutscene #sit-hint{display:block}
#photo-exit{position:fixed;top:calc(10px + env(safe-area-inset-top,0px));right:calc(10px + env(safe-area-inset-right,0px));z-index:200;display:none;opacity:.25;background:rgba(0,0,0,0.5);color:#fff;border:1px solid rgba(255,255,255,0.3);border-radius:999px;padding:6px 10px;font-size:12px;cursor:pointer;font-family:inherit}
body.photo>*:not(canvas):not(#photo-exit){display:none!important}
body.photo #photo-exit{display:block!important}
`;
document.head.appendChild(css);
const ui=document.createElement('div');ui.id='sit-ui';
ui.innerHTML='<button class="up" id="sit-up">⬆ Se lever</button><button id="sit-cam">🎬 Plan suivant</button>';
document.body.appendChild(ui);
const hint=document.createElement('div');hint.id='sit-hint';hint.textContent='Pousse le joystick pour te lever';document.body.appendChild(hint);
const pe=document.createElement('button');pe.id='photo-exit';pe.textContent='📸 Quitter le mode photo';document.body.appendChild(pe);
$a('sit-up').onclick=()=>{if(SS)stop();};
$a('sit-cam').onclick=()=>{if(SS){SS.shot++;SS.shotT=0;}};
function togglePhoto(){document.body.classList.toggle('photo');}
pe.onclick=togglePhoto;
ACT.photo=togglePhoto;
window.addEventListener('keydown',e=>{if(e.code==='KeyP'&&!e.repeat)togglePhoto();if(e.code==='KeyV'&&SS&&!e.repeat){SS.shot++;SS.shotT=0;}});
(function(){
  const row=document.getElementById('btn-how');
  if(row&&row.parentNode){const b=document.createElement('button');b.className='bt ghost';b.textContent='📸 MODE PHOTO';b.onclick=()=>{togglePhoto();};row.parentNode.appendChild(b);}
})();
console.log('[ACTIONS] chargé : asseoir, cuisiner, boire, danser, piano, bronzer, haltères… + mode photo (P).');
})();
