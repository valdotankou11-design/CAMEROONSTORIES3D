'use strict';
// =====================================================================
//  FILET DE SÉCURITÉ & PERFORMANCES
//  · une erreur ne fige plus le jeu · valeurs invalides corrigées
//  · les blocs autour du joueur sont chargés IMMÉDIATEMENT (plus de trous, plus de murs fantômes)
//  · pas de traversée de murs quand le jeu ralentit (sous-étapes de physique)
//  · sol de secours infini · perte du contexte WebGL gérée · réglage de qualité
// =====================================================================
(function(){
  let bad=0,logged=0,last={x:P.x,z:P.z};
  window.QUALITY=window.QUALITY||{water:true,rain:true};

  // ---------- sol de secours : jamais de « trou » visible, même au bord de la carte
  const farG=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000),new THREE.MeshBasicMaterial({color:0x3d4637}));
  farG.rotation.x=-Math.PI/2;farG.position.y=-0.35;farG.frustumCulled=false;scene.add(farG);

  // ---------- qualité graphique
  const QL={high:{shadow:true,pr:2,r:2,water:true,rain:true},medium:{shadow:true,pr:1.5,r:2,water:true,rain:true},low:{shadow:false,pr:1,r:1,water:false,rain:false}};
  let appliedQ=null;
  function levelName(){
    const q=(SAVE.set&&SAVE.set.q)||'auto';
    if(q!=='auto')return q;
    return touch?'medium':'high';
  }
  function applyQuality(){
    const name=levelName(),Q=QL[name];
    const q=(SAVE.set&&SAVE.set.q)||'auto';
    // sur téléphone, l'ombre est coupée par défaut en mode Auto (plus fluide, jamais d'écran noir)
    const shadow=(q==='auto'&&touch)?false:Q.shadow;
    try{
      sun.castShadow=shadow;
      ren.setPixelRatio(Math.min(window.devicePixelRatio||1,Q.pr));ren.setSize(innerWidth,innerHeight);
      CHUNK_R=Q.r;QUALITY.water=Q.water;QUALITY.rain=Q.rain;
    }catch(e){console.warn('[QUALITÉ]',e);}
    appliedQ=(SAVE.set&&SAVE.set.q)||'auto';
    syncQ();
  }
  function syncQ(){
    const box=document.getElementById('chips-q');if(!box)return;
    for(const b of box.children)b.classList.toggle('on',b.dataset.v===((SAVE.set&&SAVE.set.q)||'auto'));
  }
  (function(){
    const box=document.getElementById('chips-q');
    if(box)box.onclick=e=>{const b=e.target.closest('button');if(!b)return;SAVE.set.q=b.dataset.v;writeSave();applyQuality();showToast('Qualité : '+b.textContent);};
  })();

  // ---------- chargement immédiat des blocs autour du joueur
  function ensureNear(){
    if(interiorType||(S!=='play'&&S!=='cutscene'))return;
    const probes=[[P.x,P.z]],c=P.car;
    if(c&&!c.isPlane){const sp=Math.abs(c.v)*0.7*(c.v<0?-1:1);probes.push([P.x+Math.sin(c.h)*sp,P.z+Math.cos(c.h)*sp]);}
    let made=0;
    for(const pr of probes){
      const a=Math.floor(pr[0]/CS),b=Math.floor(pr[1]/CS);
      for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){
        const cx=a+i,cz=b+j;
        if(cx<0||cz<0||cx>=NB||cz>=NB||chunks[cx+','+cz])continue;
        if(made>=3)return;
        createChunk(cx,cz);made++;
      }
    }
  }

  function recover(){
    try{if(window.ACT&&ACT.active)ACT.stop(true);}catch(e){}
    try{if(window.EX&&EX.isModal&&EX.isModal())EX.F.closeModal();}catch(e){}
    try{interiorType=null;P.car=null;P.enteringCar=null;P.x=3*CS+18;P.z=3*CS+12;P.y=0;P.vy=0;P.hp=Math.max(P.hp||0,60);S='play';document.body.classList.remove('cutscene');}catch(e){}
    try{showToast('Le jeu s’est remis d’une erreur.');}catch(e){}
  }
  function sanitize(){
    if(!isFinite(P.x)||!isFinite(P.z)){P.x=last.x;P.z=last.z;P.y=0;P.vy=0;}
    else if(!interiorType){last.x=P.x;last.z=P.z;}
    if(!isFinite(P.y)||!isFinite(P.vy)){P.y=0;P.vy=0;}
    if(!isFinite(P.hp))P.hp=100;
    if(!isFinite(P.cash))P.cash=0;
    for(const c of cars){
      if(!isFinite(c.x+c.z+c.v+c.h)){try{scene.remove(c.m);}catch(e){}c.dead=1;if(P.car===c){P.car=null;P.m.visible=true;}}
    }
    for(const arr of[peds,enemies,copsOnFoot]){
      for(const p of arr){if(!isFinite(p.x+p.z)){try{scene.remove(p.m);}catch(e){}p.dead=1;p.rm=1;p.x=0;p.z=0;}}
    }
    farG.position.x=Math.round(P.x/200)*200;farG.position.z=Math.round(P.z/200)*200;farG.visible=!interiorType;
  }
  const _u=update;
  update=function(dt){
    if(!(dt>0))dt=0.016;
    dt=Math.min(dt,0.1);
    if(appliedQ!==((SAVE.set&&SAVE.set.q)||'auto'))applyQuality();
    try{ensureNear();}catch(e){if(logged++<6)console.error('[SÉCURITÉ] chargement des blocs :',e);}
    // sous-étapes : évite de traverser les murs quand le jeu ralentit
    const n=dt>0.034?Math.min(3,Math.ceil(dt/0.0334)):1;
    for(let k=0;k<n;k++){
      try{_u(dt/n);bad=Math.max(0,bad-0.02);}
      catch(e){
        bad++;if(logged++<6)console.error('[SÉCURITÉ] erreur de frame récupérée :',e);
        if(bad>40){bad=0;recover();}
        break;
      }
    }
    try{sanitize();}catch(e){}
  };

  // ---------- perte du contexte WebGL (écran noir) : on baisse la qualité et on prévient
  try{
    ren.domElement.addEventListener('webglcontextlost',e=>{
      e.preventDefault();
      try{SAVE.set.q='low';writeSave();applyQuality();showToast('Graphismes interrompus : qualité réduite pour éviter l’écran noir.');}catch(_){}
    },false);
    ren.domElement.addEventListener('webglcontextrestored',()=>{try{showToast('Graphismes rétablis.');streamChunks(true,P.x,P.z);}catch(_){}},false);
  }catch(e){}
  window.addEventListener('error',e=>{if(logged++<6)console.warn('[SÉCURITÉ] erreur globale :',e.message);});
  window.addEventListener('unhandledrejection',e=>{if(logged++<6)console.warn('[SÉCURITÉ] promesse rejetée :',e.reason);});
  applyQuality();
})();
