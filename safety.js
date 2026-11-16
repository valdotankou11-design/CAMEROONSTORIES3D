'use strict';
// =====================================================================
//  FILET DE SÉCURITÉ : une erreur ne fige plus le jeu, les valeurs invalides (NaN)
//  sont corrigées, et le jeu se remet tout seul en cas de problème répété.
// =====================================================================
(function(){
  let bad=0,logged=0,last={x:P.x,z:P.z};
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
  }
  const _u=update;
  update=function(dt){
    try{_u(dt);bad=Math.max(0,bad-0.02);}
    catch(e){
      bad++;if(logged++<6)console.error('[SÉCURITÉ] erreur de frame récupérée :',e);
      if(bad>40){bad=0;recover();}
    }
    try{sanitize();}catch(e){}
  };
  window.addEventListener('error',e=>{if(logged++<6)console.warn('[SÉCURITÉ] erreur globale :',e.message);});
  window.addEventListener('unhandledrejection',e=>{if(logged++<6)console.warn('[SÉCURITÉ] promesse rejetée :',e.reason);});
})();
