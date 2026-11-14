'use strict';
const $=id=>document.getElementById(id);

// ===== SAUVEGARDE LOCALE (LOCALSTORAGE)
const SAVE_KEY='cameroun_stories_payback_v5';
const defaultSave=()=>({
  cash:500,hp:100,armor:50,missionIdx:0,weapons:['pistol'],curWeapon:'pistol',
  px:3*CS+18,pz:3*CS+12
});
let SAVE=defaultSave();
function loadSave(){
  try{const raw=localStorage.getItem(SAVE_KEY);if(raw)SAVE=Object.assign(defaultSave(),JSON.parse(raw));}catch(e){}
  updateSaveUI();
}
function writeSave(){
  try{
    SAVE.cash=Math.round(P.cash);SAVE.hp=Math.round(P.hp);SAVE.armor=Math.round(P.armor);
    if(!inside){SAVE.px=Math.round(P.x*10)/10;SAVE.pz=Math.round(P.z*10)/10;}
    localStorage.setItem(SAVE_KEY,JSON.stringify(SAVE));
    updateSaveUI();
  }catch(e){}
}
function updateSaveUI(){
  const m=STORY_MISSIONS[SAVE.missionIdx];
  $('save-summary').innerHTML=`💾 <b>Sauvegarde :</b> ${SAVE.cash} FCFA · ${m?m.title:'Mode Libre Taxi'}`;
}

// ===== MOTEUR AUDIO PROCÉDURAL & RADIO FM
let AC=null,radioIdx=0,radioTimer=0,radioStep=0;
const RADIOS=[
  {name:'CRTV FM · Makossa',tempo:0.24,notes:[261.6,329.6,392.0,329.6,440.0,392.0,329.6,293.7]},
  {name:'Yaoundé Hit · Bikutsi',tempo:0.17,notes:[349.2,440.0,523.3,440.0,392.0,493.9,523.3,392.0]},
  {name:'Douala Vibe · Afro',tempo:0.22,notes:[220.0,261.6,329.6,293.7,261.6,329.6,392.0,329.6]},
  {name:'Radio Éteinte',tempo:1,notes:[]}
];
function initAudio(){
  if(!AC)try{AC=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}
  if(AC&&AC.state==='suspended')AC.resume();
}
function playTone(freq,dur,type='sine',vol=0.05,slide=0){
  if(!AC)return;
  try{
    const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;
    o.type=type;o.frequency.setValueAtTime(freq,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(25,slide),t+dur);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+dur);
  }catch(e){}
}
function playGunshot(wep){
  const f=wep==='rifle'?460:wep==='smg'?530:380;
  playTone(f,wep==='smg'?0.06:0.11,'sawtooth',0.06,60);
  playTone(135,0.09,'square',0.04,35);
}
function playHorn(){
  playTone(440,0.14,'sawtooth',0.045);
  setTimeout(()=>playTone(554,0.18,'sawtooth',0.045),110);
}
function updateRadio(dt){
  const r=RADIOS[radioIdx];
  if(!AC||!r.notes.length||S!=='play')return;
  radioTimer-=dt;
  if(radioTimer<=0){
    radioTimer=r.tempo;
    const f=r.notes[radioStep%r.notes.length];
    playTone(f,r.tempo*0.85,'triangle',0.015);
    if(radioStep%4===0)playTone(f*0.5,r.tempo*0.9,'sine',0.022);
    radioStep++;
  }
}

// ===== INTÉRIEUR VILLA
const room=new THREE.Group();scene.add(room);
bx(16,0.3,14,0xd4a373,IX,0,IZ,room);
for(const[w,d,x,z]of[[16,0.5,0,-7],[16,0.5,0,7],[0.5,14,-8,0],[0.5,14,8,0]])bx(w,5,d,0xfaedcd,IX+x,2.5,IZ+z,room);
bx(16,0.3,14,0xe5e5e5,IX,5,IZ,room);
const roomObs=[[IX-5.5,IZ-4,IX-2.5,IZ-2],[IX+2,IZ-5.8,IX+6,IZ-4.2],[IX+4.3,IZ-1,IX+6.7,IZ+3]];
bx(3,1,2,0x7f4f24,IX-4,0.6,IZ-3,room);
bx(4,1,1.6,0x1d3557,IX+4,0.5,IZ-5,room);
bx(2.4,0.8,4,0x9e2a2b,IX+5.5,0.5,IZ+1,room);
bx(2,3.6,0.3,0xd32f2f,IX,1.8,IZ+6.8,room);
const roomCash=bx(0.95,0.35,0.55,0x00e676,IX-4,1.3,IZ-3,room);
const roomMed=bx(0.7,0.45,0.7,0xff1744,IX+4,1.25,IZ-5,room);

function nearDoor(){
  const a=Math.floor(P.x/CS),b=Math.floor(P.z/CS);let best=null,bd=4;
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){
    const c=chunks[(a+i)+','+(b+j)];
    if(c)for(const d of c.ds)if(d.x!==undefined){const k=Math.hypot(d.x-P.x,d.z-P.z);if(k<bd){bd=k;best=d;}}
  }
  return best;
}

// ===== SCÉNARIO & AGENTS IA PNJ AVEC PERSONNALITÉS CONTEXTUELLES
const STORY_MISSIONS=[
  {title:'Chapitre 1 : Taxi Clando Express',tx:MON_X,tz:MON_Z-16,time:65,reward:450,wantedOnStart:0,
   dialog:'Le Patron : "Bienvenue à Yaoundé ! Suis le tracé GPS doré jusqu’au Monument de la Réunification !"'},
  {title:'Chapitre 2 : Colis Urgent de Mvog-Mbi',tx:2*CS+8,tz:6*CS+8,time:70,reward:650,wantedOnStart:1,
   dialog:'Contact Mvog-Mbi : "La police surveille l’axe ! Livre ce colis au quartier Nord avant la fin du chrono !"'},
  {title:'Chapitre 3 : Convoi VIP Ministériel',tx:7*CS+8,tz:4*CS+8,time:65,reward:850,wantedOnStart:2,
   dialog:'Agent Sécurité : "Sème les patrouilles et rejoins la planque sécurisée à l’Est !"'},
  {title:'Chapitre 4 : Nettoyer le Carrefour',type:'combat',count:4,tx:4*CS+8,tz:3*CS+8,time:85,reward:1100,wantedOnStart:1,
   dialog:'Chef de Quartier : "4 bandits armés bloquent le carrefour ! Vise avec 🎯 et neutralise-les !"'},
  {title:'Chapitre 5 : Le Grand Coup de Yaoundé',tx:3*CS+18,tz:3*CS+12,time:80,reward:2000,wantedOnStart:3,
   dialog:'Le Patron : "Alerte maximale ! Ramène le butin à ta base de départ !"'}
];

const NPC_PROFILES=[
  {role:'taximan',name:'Moussa · Taximan Jaune (IA)',shirt:0xfacc15,skin:0x6f4e37,
   getReply:(ctx)=>{
     if(ctx.stars>0)return 'Chef, cache-toi vite ! La police a ton signalement sur tout le boulevard !';
     if(ctx.inCar&&ctx.carType==='taxi')return 'Ah mon collègue ! Le jaune brille ce soir, bonne course !';
     if(ctx.isNight)return 'La nuit à Yaoundé, allume bien tes phares et méfie-toi des carrefours.';
     return 'Bienvenue chef ! Suis la flèche GPS au-dessus de toi pour trouver ta destination.';
   }},
  {role:'benskin',name:'Kevin · Pilote Benskin (IA)',shirt:0xf97316,skin:0x5c3c24,
   getReply:(ctx)=>{
     if(ctx.hp<50)return 'Tu es blessé frère ! Va vite manger un Ndolé à la boutique bleue sur la carte.';
     if(ctx.inCar&&ctx.carType==='moto')return 'Belle moto ! Rien ne peut te bloquer dans les embouteillages avec ça.';
     return 'Si tu veux voir toute la ville, touche le radar en haut à gauche !';
   }},
  {role:'mama',name:'Maman Pauline · Bayam-Sellam (IA)',shirt:0xec4899,skin:0x7b5438,
   getReply:(ctx)=>{
     if(ctx.stars>=2)return 'Seigneur ! Rends-toi au commissariat ou paie un arrangement à la boutique !';
     if(ctx.isNight)return 'Mon fils, les lampadaires sont allumés, rentre prudemment ce soir.';
     return 'Que Dieu bénisse ta route mon enfant ! Passe à ma boutique si tu as besoin de soins.';
   }},
  {role:'student',name:'Brice · Étudiant Ngoa-Ekellé (IA)',shirt:0x3b82f6,skin:0x8d5524,
   getReply:(ctx)=>{
     if(ctx.cash>=1000)return `Tu as déjà ${ctx.cash} FCFA ! Va acheter l'AK-47 à l'armurerie !`;
     return 'Astuce : maintiens 🎯 pour viser au laser avant de tirer tes balles !';
   }}
];

// ===== ÉTAT DU JEU, BALLES BALISTIQUES & REPÈRE GPS
let S='menu',inside=0,ret={x:0,z:0},tm=0,dayTime=14.0,cars=[],peds=[],enemies=[],copsOnFoot=[],bullets=[],trs=[],stars=0,wT=0,msgT=0,dT=0,cid=0,cy=0,cp=0.36,zs=0,bubbleT=0;
let customWaypoint=null;
const P={x:3*CS+18,z:3*CS+12,h:0,vy:0,y:0,hp:100,armor:50,stamina:100,car:null,cash:500,cd:0,inv:0,wk:0,m:buildHuman(0xff4081,0x7b5438,'player')};

// Balise 3D destination + Flèche GPS flottante au-dessus du joueur/véhicule
const beacon=new THREE.Group();
const bRing=new THREE.Mesh(new THREE.CylinderGeometry(3.0,3.0,0.35,24,1,true),new THREE.MeshBasicMaterial({color:0xffd54f,side:THREE.DoubleSide,transparent:true,opacity:0.85}));
bRing.position.y=0.2;beacon.add(bRing);
const bBeam=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,26,12),new THREE.MeshBasicMaterial({color:0xffd54f,transparent:true,opacity:0.25}));
bBeam.position.y=13;beacon.add(bBeam);
scene.add(beacon);

const gpsArrow=new THREE.Group();
const arrowCone=new THREE.Mesh(new THREE.ConeGeometry(0.32,0.85,4),new THREE.MeshBasicMaterial({color:0xffd54f}));
arrowCone.rotation.x=PI/2;arrowCone.position.z=0.35;gpsArrow.add(arrowCone);
const arrowTail=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.12,0.55),new THREE.MeshBasicMaterial({color:0x00e676}));
arrowTail.position.z=-0.25;gpsArrow.add(arrowTail);
scene.add(gpsArrow);

let activeMission=null,missionTimeLeft=0,enemiesLeft=0;
function getActiveTarget(){
  if(customWaypoint)return{tx:customWaypoint.x,tz:customWaypoint.z,isCustom:true};
  if(activeMission)return{tx:activeMission.tx,tz:activeMission.tz,isCustom:false};
  return null;
}
function setupMission(){
  for(const e of enemies)scene.remove(e.m);
  enemies=[];
  const m=STORY_MISSIONS[SAVE.missionIdx];
  if(m){
    activeMission=Object.assign({},m);missionTimeLeft=m.time;
    bRing.material.color.setHex(0xffd54f);bBeam.material.color.setHex(0xffd54f);
    showNpcBubble('Briefing Mission',m.dialog,6);
    if(m.wantedOnStart)addCrime(m.wantedOnStart);
    if(m.type==='combat'){
      enemiesLeft=m.count;
      for(let k=0;k<m.count;k++){
        const ex=m.tx+rn(-10,10),ez=m.tz+rn(-10,10);
        const em=buildHuman(0x18181b,0x6f4e37,'bir');em.userData.gun.visible=true;
        enemies.push({m:em,x:ex,z:ez,h:0,hp:55,cd:rn(0.5,1.5),wk:0});
      }
    }
  }else{
    const gx=cl((Math.floor(P.x/CS)+(R()<0.5?1:-1)*2),1,NB-2)*CS+8;
    const gz=cl((Math.floor(P.z/CS)+(R()<0.5?1:-1)*2),1,NB-2)*CS+8;
    activeMission={title:'Course Taxi Libre',tx:gx,tz:gz,time:55,reward:350};
    missionTimeLeft=55;
    bRing.material.color.setHex(0x00e676);bBeam.material.color.setHex(0x00e676);
  }
}

function showToast(txt){const el=$('toast');el.textContent=txt;el.classList.add('show');msgT=3.2;}
function showNpcBubble(name,txt,dur=4.5){$('npc-name').textContent=name;$('npc-text').textContent=txt;$('npc-bubble').style.display='block';bubbleT=dur;}

function updateControlUI(){
  $('speedo').style.display=P.car?'block':'none';
  if(!touch)return;
  $('controls-foot').style.display=P.car?'none':'block';
  $('controls-car').style.display=P.car?'block':'none';
}

// ===== GRANDE CARTE DE LA VILLE INTERACTIVE
let prevStateBeforeMap='play';
window.openBigMap=function(){
  if(S!=='play')return;
  prevStateBeforeMap=S;S='map';
  $('big-map-modal').style.display='flex';
  drawBigMap();
};
window.closeBigMap=function(){
  if(S==='map'){S=prevStateBeforeMap;$('big-map-modal').style.display='none';}
};
window.clearCustomWaypoint=function(){
  customWaypoint=null;drawBigMap();showToast('Repère GPS personnalisé effacé');
};
$('big-map').addEventListener('pointerdown',e=>{
  const rect=$('big-map').getBoundingClientRect();
  const wx=((e.clientX-rect.left)/rect.width)*WS;
  const wz=((e.clientY-rect.top)/rect.height)*WS;
  customWaypoint={x:cl(wx,10,WS-10),z:cl(wz,10,WS-10)};
  playTone(680,0.15,'sine');
  drawBigMap();
  showToast('📍 Repère GPS placé sur la carte !');
});

function drawBigMap(){
  const cv=$('big-map'),ctx=cv.getContext('2d'),W=cv.width,H=cv.height,S2=W/WS;
  ctx.fillStyle='#0b1220';ctx.fillRect(0,0,W,H);

  // Blocs de quartiers
  ctx.fillStyle='#162033';
  for(let cx=0;cx<NB;cx++)for(let cz=0;cz<NB;cz++){
    ctx.fillRect(cx*CS*S2+4,cz*CS*S2+4,CS*S2-8,CS*S2-8);
  }
  // Réseau routier complet
  ctx.strokeStyle='#475569';ctx.lineWidth=5;
  for(let i=0;i<=NB;i++){
    const p=i*CS*S2;
    ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,H);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,p);ctx.lineTo(W,p);ctx.stroke();
  }
  // Noms des quartiers & lieux clés
  ctx.fillStyle='rgba(226,232,240,0.75)';ctx.font='bold 11px sans-serif';ctx.textAlign='center';
  ctx.fillText('BOULEVARD DU 20 MAI',2.5*CS*S2,2.5*CS*S2);
  ctx.fillText('MONUMENT RÉUNIFICATION',MON_X*S2,MON_Z*S2-12);
  ctx.fillText('QUARTIER BASTOS',7*CS*S2,3*CS*S2);
  ctx.fillText('NGOA-EKELLÉ',3*CS*S2,7.5*CS*S2);
  ctx.fillText('MVOG-MBI',7.5*CS*S2,7.5*CS*S2);

  // Boutique & Station-Service
  ctx.fillStyle='#38bdf8';ctx.beginPath();ctx.arc(SHOP_X*S2,SHOP_Z*S2,6,0,PI*2);ctx.fill();
  ctx.fillStyle='#fb923c';ctx.beginPath();ctx.arc(GAS_X*S2,GAS_Z*S2,6,0,PI*2);ctx.fill();

  // Police
  for(const c of cars)if(c.kind==='cop'){
    ctx.fillStyle='#2979ff';ctx.beginPath();ctx.arc(c.x*S2,c.z*S2,5,0,PI*2);ctx.fill();
  }

  // Traçabilité GPS vers la mission et repère personnalisé
  const tgt=getActiveTarget();
  if(tgt){
    ctx.save();
    ctx.strokeStyle=tgt.isCustom?'#00e676':'#ffd54f';
    ctx.lineWidth=3;ctx.setLineDash([7,5]);
    ctx.beginPath();ctx.moveTo(P.x*S2,P.z*S2);ctx.lineTo(tgt.tx*S2,tgt.tz*S2);ctx.stroke();
    ctx.restore();
  }
  if(activeMission){
    ctx.fillStyle='#ffd54f';ctx.beginPath();ctx.arc(activeMission.tx*S2,activeMission.tz*S2,7,0,PI*2);ctx.fill();
  }
  if(customWaypoint){
    ctx.fillStyle='#00e676';ctx.beginPath();ctx.arc(customWaypoint.x*S2,customWaypoint.z*S2,7,0,PI*2);ctx.fill();
  }

  // Position du joueur avec cône de vision
  ctx.save();
  ctx.translate(P.x*S2,P.z*S2);
  ctx.rotate(-cy);
  ctx.fillStyle='rgba(255,64,129,0.28)';
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-14,24);ctx.lineTo(14,24);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ff4081';ctx.beginPath();ctx.arc(0,0,6,0,PI*2);ctx.fill();
  ctx.restore();
}

// ===== BOUTIQUE & ARMURERIE
function openShop(){S='shop';$('shop-modal').style.display='flex';}
function closeShop(){S='play';$('shop-modal').style.display='none';}
window.buyItem=function(id){
  initAudio();
  if(id==='heal'&&P.cash>=150){P.cash-=150;P.hp=100;showToast('🍲 Ndolé dégusté ! Santé à 100%');playTone(660,0.25,'sine');}
  else if(id==='armor'&&P.cash>=300){P.cash-=300;P.armor=100;showToast('🦺 Gilet pare-balles équipé !');playTone(580,0.25,'sine');}
  else if(id==='smg'&&P.cash>=600){
    P.cash-=600;if(!SAVE.weapons.includes('smg'))SAVE.weapons.push('smg');
    SAVE.curWeapon='smg';updateWeaponHUD();showToast('🔥 Mitraillette Uzi débloquée !');playTone(780,0.3,'sawtooth');
  }else if(id==='rifle'&&P.cash>=1200){
    P.cash-=1200;if(!SAVE.weapons.includes('rifle'))SAVE.weapons.push('rifle');
    SAVE.curWeapon='rifle';updateWeaponHUD();showToast('🎯 Fusil AK-47 débloqué !');playTone(840,0.35,'sawtooth');
  }else if(id==='clear'&&P.cash>=400){P.cash-=400;stars=0;clearCopsOnFoot();showToast('🕶️ Dossier classé ! 0 étoile.');playTone(520,0.3,'sine');}
  else if(id==='repair'&&P.cash>=200){
    const targetCar=P.car||cars.find(c=>Math.hypot(c.x-P.x,c.z-P.z)<8);
    if(!targetCar){showToast('❌ Approche un véhicule à réparer !');return;}
    P.cash-=200;targetCar.hp=targetCar.maxHp;showToast('🔧 Véhicule remis à neuf à 100% !');playTone(700,0.25,'sine');
  }else{showToast('❌ Pas assez de FCFA !');playTone(160,0.2,'sawtooth');return;}
  writeSave();
};
window.switchWeapon=function(){
  if(SAVE.weapons.length<2){showToast('Débloque de nouvelles armes à la boutique !');return;}
  const idx=(SAVE.weapons.indexOf(SAVE.curWeapon)+1)%SAVE.weapons.length;
  SAVE.curWeapon=SAVE.weapons[idx];
  updateWeaponHUD();
  const names={pistol:'🔫 Pistolet 9mm ↻',smg:'🔥 Mitraillette Uzi ↻',rifle:'🎯 Fusil AK-47 ↻'};
  showToast('Arme équipée : '+names[SAVE.curWeapon]);
};
function updateWeaponHUD(){
  const names={pistol:'🔫 Pistolet 9mm ↻',smg:'🔥 Mitraillette Uzi ↻',rifle:'🎯 Fusil AK-47 ↻'};
  $('weapon-info').textContent=names[SAVE.curWeapon]||'🔫 Pistolet 9mm ↻';
  P.m.userData.gun.visible=!P.car;
}

// ===== ENTRÉES CLAVIER & TACTILE STYLE PAYBACK 2
const KB={},B={fire:0,aim:0,run:0,gas:0,brake:0},jv={m:0,x:0,y:0};
let runTapTime=0;

addEventListener('keydown',e=>{
  KB[e.code]=1;
  if(e.code==='KeyE'||e.code==='Enter')doSmartAction();
  if(e.code==='KeyM'){if(S==='map')closeBigMap();else openBigMap();}
  if(e.code==='Tab'){e.preventDefault();switchWeapon();}
  if(e.code==='KeyR')cycleRadio();
  if(e.code==='KeyH'&&P.car)playHorn();
  if(e.code==='KeyC'&&!P.car)doJump();
  if(e.code==='Escape'||e.code==='KeyP'){if(S==='map')closeBigMap();else togglePause();}
  if(e.code.startsWith('Arrow')||e.code==='Space')e.preventDefault();
});
addEventListener('keyup',e=>KB[e.code]=0);
addEventListener('mousedown',e=>{if(e.button===2&&S==='play')B.aim=1;});
addEventListener('mouseup',e=>{if(e.button===2)B.aim=0;});
addEventListener('contextmenu',e=>e.preventDefault());

function cycleRadio(){
  initAudio();radioIdx=(radioIdx+1)%RADIOS.length;
  $('radio-badge').textContent='📻 '+RADIOS[radioIdx].name;
  showToast('📻 '+RADIOS[radioIdx].name);
}
function doJump(){
  if(!P.car&&P.y<=0.01&&S==='play'){P.vy=6.8;playTone(300,0.12,'sine',0.03,450);}
}
function getInput(){
  let x=(KB.KeyD||KB.ArrowRight?1:0)-(KB.KeyA||KB.ArrowLeft?1:0);
  let y=(KB.KeyS||KB.ArrowDown?1:0)-(KB.KeyW||KB.ArrowUp?1:0);
  if(jv.m){x=jv.x;y=jv.y;}
  if(Math.hypot(x,y)<0.14)x=y=0;
  return{
    x,y,
    fire:KB.Space||KB.KeyF||B.fire,
    aim:KB.KeyQ||KB.ShiftRight||B.aim,
    run:KB.ShiftLeft||B.run,
    gas:KB.KeyW||KB.ArrowUp||B.gas,
    brake:KB.KeyS||KB.ArrowDown||B.brake
  };
}
const jz=$('jz'),jb=$('jb'),jk=$('jk'),lz=$('lz');let jid=null,jo=[0,0],lid=null,lp=[0,0];
jz.onpointerdown=e=>{
  e.preventDefault();jid=e.pointerId;jz.setPointerCapture(e.pointerId);
  jo=[e.clientX,e.clientY];jb.style.cssText='display:block;left:'+(jo[0]-56)+'px;top:'+(jo[1]-56)+'px';
  jv.m=1;jv.x=jv.y=0;jk.style.transform='none';
};
jz.onpointermove=e=>{
  if(e.pointerId!==jid)return;
  let dx=e.clientX-jo[0],dy=e.clientY-jo[1],d=Math.hypot(dx,dy),m=50;
  if(d>m){dx*=m/d;dy*=m/d;}
  jv.x=dx/m;jv.y=dy/m;jk.style.transform='translate('+dx+'px,'+dy+'px)';
};
jz.onpointerup=jz.onpointercancel=e=>{
  if(e.pointerId!==jid)return;jid=null;jv.m=0;jv.x=jv.y=0;jb.style.display='none';
};
function lookCam(dx,dy){cy-=dx*0.0065;cp=cl(cp+dy*0.0045,0.08,1.05);}
lz.onpointerdown=e=>{lid=e.pointerId;lz.setPointerCapture(e.pointerId);lp=[e.clientX,e.clientY];};
lz.onpointermove=e=>{if(e.pointerId!==lid)return;lookCam(e.clientX-lp[0],e.clientY-lp[1]);lp=[e.clientX,e.clientY];};
lz.onpointerup=lz.onpointercancel=()=>{lid=null};
ren.domElement.onpointermove=e=>{if(e.buttons&1)lookCam(e.movementX,e.movementY);};

document.querySelectorAll('.tbtn').forEach(b=>{
  const k=b.dataset.k;
  b.onpointerdown=e=>{
    e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('on');
    if(k==='act')doSmartAction();
    else if(k==='run'){B.run=1;runTapTime=performance.now();}
    else B[k]=1;
  };
  b.onpointerup=b.onpointercancel=()=>{
    b.classList.remove('on');
    if(k==='run'){
      B.run=0;
      if(performance.now()-runTapTime<220)doJump();
    }else if(k in B)B[k]=0;
  };
});
$('btn-how').onclick=()=>{const h=$('how');h.style.display=h.style.display==='block'?'none':'block';};
$('btn-pause').onclick=togglePause;
$('btn-radio').onclick=cycleRadio;
$('btn-reset').onclick=()=>{localStorage.removeItem(SAVE_KEY);SAVE=defaultSave();updateSaveUI();showToast('🗑️ Sauvegarde réinitialisée !');};
$('btn-play').onclick=()=>{
  initAudio();
  if(S==='pause'){S='play';$('menu').style.display='none';return;}
  try{
    document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen()
      .then(()=>screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})).catch(()=>{});
  }catch(e){}
  startGame();
};
function togglePause(){
  if(S==='play'){S='pause';$('btn-play').textContent='▶ REPRENDRE';$('menu').style.display='flex';writeSave();}
  else if(S==='pause'){S='play';$('menu').style.display='none';}
}

// ===== VÉHICULES, COLLISIONS SOLIDES & DÉPLOIEMENT POLICE / BIR
const HD=[PI/2,0,-PI/2,PI];
function spawnVehicle(kind,x,z,d){
  let vType='civ',col=0xffffff;
  if(kind==='cop'){vType='cop';col=0xf8fafc;}
  else if(kind==='me'){vType='vip';col=0xff4081;}
  else{
    const r=R();
    if(r<0.44){vType='taxi';col=0xfacc15;}
    else if(r<0.64){vType='moto';col=0xdc2626;}
    else{vType='civ';col=[0x2563eb,0xdc2626,0x16a34a,0xf8fafc,0x7c3aed,0xea580c][R()*6|0];}
  }
  const maxHp=kind==='cop'?150:vType==='moto'?60:vType==='vip'?160:120;
  const c={
    m:buildVehicle(col,vType),x,z,h:HD[d],v:0,d,kind,vType,
    hp:maxHp,maxHp,id:++cid,turned:0,rev:0,st:0,bt:0,deployed:0,smokeT:0,revLock:0
  };
  cars.push(c);return c;
}
function autoSpawnTraffic(kind){
  const d=R()*4|0,ev=d%2===0,a=Math.round((ev?P.z:P.x)+rn(-115,115));
  let r=Math.round(a/CS)*CS;if(r<0||r>WS)return;
  const along=(ev?P.x:P.z)+rn(-135,135);if(along<12||along>WS-12)return;
  const near=Math.round(along/CS)*CS;if(Math.abs(along-near)<14)return;
  const lane=r+[4,-4,-4,4][d];
  const x=ev?along:lane,z=ev?lane:along;
  const dp=Math.hypot(x-P.x,z-P.z);
  if(dp<50||dp>145||cars.some(c=>Math.hypot(c.x-x,c.z-z)<12))return;
  spawnVehicle(kind,x,z,d);
}
function autoSpawnNPC(){
  const x=P.x+rn(-95,95),z=P.z+rn(-95,95),dp=Math.hypot(x-P.x,z-P.z);
  if(dp<22||x<5||z<5||x>WS-5||z>WS-5)return;
  const t={x,z};if(hitBuilding(t,0.7))return;
  const prof=NPC_PROFILES[R()*NPC_PROFILES.length|0];
  const m=buildHuman(prof.shirt,prof.skin,prof.role);
  peds.push({m,x,z,h:rn(0,6.3),t:rn(1,4),fl:0,dead:0,wk:0,hp:35,profile:prof,chatCd:0});
}

function getAgentReply(npc){
  const isNight=dayTime<6||dayTime>19;
  return npc.profile.getReply({
    stars,hp:P.hp,cash:P.cash,isNight,
    inCar:!!P.car,carType:P.car?P.car.vType:null
  });
}

function resolvePersonCarCollisions(person,rad=0.65){
  for(const c of cars){
    if(c===P.car)continue;
    const dx=person.x-c.x,dz=person.z-c.z;
    const ch=Math.cos(-c.h),sh=Math.sin(-c.h);
    const lx=dx*ch-dz*sh;
    const lz=dx*sh+dz*ch;
    const hw=(c.vType==='moto'?0.55:1.25)+rad;
    const hl=(c.vType==='moto'?1.15:2.45)+rad;
    if(Math.abs(lx)<hw&&Math.abs(lz)<hl){
      const ox=hw-Math.abs(lx),oz=hl-Math.abs(lz);
      let plx=0,plz=0;
      if(ox<oz)plx=(lx>=0?1:-1)*ox;
      else plz=(lz>=0?1:-1)*oz;
      const wch=Math.cos(c.h),wsh=Math.sin(c.h);
      person.x+=plx*wch-plz*wsh;
      person.z+=plx*wsh+plz*wch;
    }
  }
}

function deployCopsFromCar(c){
  if(c.deployed||copsOnFoot.length>=6)return;
  c.deployed=1;
  const isBir=stars>=3;
  for(const side of[-1,1]){
    const cx=c.x+Math.cos(c.h)*2.2*side;
    const cz=c.z-Math.sin(c.h)*2.2*side;
    const cm=buildHuman(isBir?0x2d4a22:0x1e3a8a,0x6f4e37,isBir?'bir':'cop');
    cm.userData.gun.visible=true;
    copsOnFoot.push({m:cm,x:cx,z:cz,h:0,hp:isBir?70:45,cd:rn(0.5,1.3),wk:0,isBir});
  }
  showToast(isBir?'🚨 Intervention d’élite BIR en cours !':'🚨 La police descend de véhicule et encercle la zone !');
}
function clearCopsOnFoot(){
  for(const cp of copsOnFoot)scene.remove(cp.m);
  copsOnFoot=[];
}

function findNearestNPC(maxD=5.5){
  let best=null,bd=maxD;
  for(const p of peds){if(!p.dead){const d=Math.hypot(p.x-P.x,p.z-P.z);if(d<bd){bd=d;best=p;}}}
  return best;
}
function findNearestCar(maxD=5.5){
  let best=null,bd=maxD;
  for(const c of cars){const k=Math.hypot(c.x-P.x,c.z-P.z);if(k<bd){bd=k;best=c;}}
  return best;
}

function addCrime(n){stars=Math.min(5,Math.max(stars,n));wT=16;}
function damagePlayer(amt){
  if(P.inv>0)return;
  if(P.armor>0){const abs=Math.min(P.armor,amt*0.7);P.armor-=abs;amt-=abs;}
  P.hp-=amt;P.inv=0.45;playTone(130,0.15,'sawtooth');
}
function killPed(p){
  if(p.dead)return;
  p.dead=1;p.t=0;p.m.rotation.x=-PI/2;p.m.position.y=0.35;
  playTone(190,0.22,'sawtooth',0.05);addCrime(1);
  const loot=rn(25,85)|0;P.cash+=loot;showToast(`+${loot} FCFA récupérés`);
}
function explodeCar(c){
  const m=bx(3.8,3.8,3.8,0xff6d00,c.x,1.6,c.z);
  trs.push({m,t:0.55,gr:1});playTone(75,0.6,'sawtooth',0.09,25);
  if(P.car===c){P.car=null;P.m.visible=true;updateControlUI();damagePlayer(40);}
  else if(Math.hypot(c.x-P.x,c.z-P.z)<8)damagePlayer(25);
  c.dead=1;scene.remove(c.m);
}

// ===== BOUTON D'ACTION INTELLIGENT UNIQUE
function doSmartAction(){
  if(S==='shop'){closeShop();return;}
  if(S!=='play')return;
  if(inside){
    if(Math.hypot(P.x-IX,P.z-(IZ+6))<4.5){inside=0;P.x=ret.x;P.z=ret.z;streamChunks(1,P.x,P.z);}
    return;
  }
  if(P.car){
    const c=P.car,s=Math.sin(c.h),k=Math.cos(c.h);
    P.x=c.x-k*3.0;P.z=c.z+s*3.0;hitBuilding(P,0.6);
    P.car=null;c.v=0;c.kind='me';P.m.visible=true;updateWeaponHUD();updateControlUI();return;
  }
  if(Math.hypot(P.x-SHOP_X,P.z-SHOP_Z)<4.8){openShop();return;}
  const bestCar=findNearestCar(5.5);
  if(bestCar){
    if(bestCar.kind!=='me'){addCrime(bestCar.kind==='cop'?2:1);showToast(bestCar.vType==='taxi'?'Taxi Jaune pris !':bestCar.vType==='moto'?'Moto Benskin prise !':'Véhicule emprunté !');}
    bestCar.kind='me';bestCar.v=0;bestCar.revLock=0;P.car=bestCar;P.m.visible=false;updateControlUI();playHorn();return;
  }
  const d=nearDoor();
  if(d){
    inside=1;ret={x:d.x,z:d.z+1.6};P.x=IX;P.z=IZ+4.5;P.h=PI;cy=PI;
    roomCash.visible=true;roomMed.visible=true;
    showToast('Maison visitée : récupère le cash et les soins !');return;
  }
  const npc=findNearestNPC(6.0);
  if(npc){
    npc.h=Math.atan2(P.x-npc.x,P.z-npc.z);npc.t=4;
    const line=npc.fl>0?'Laisse-moi tranquille !':getAgentReply(npc);
    showNpcBubble(npc.profile.name,line,4.5);
    playTone(520,0.12,'sine');
  }
}

// ===== SYSTÈME DE VISÉE & VRAIES BALLES BALISTIQUES PHYSIQUES
function findAimTarget(aimAngle,maxDist=62,cone=0.45){
  if(inside)return null;
  const targets=peds.filter(p=>!p.dead).concat(enemies).concat(copsOnFoot).concat(cars.filter(c=>c.kind!=='me'));
  let bt=null,bd=maxDist;
  for(const t of targets){
    const dx=t.x-P.x,dz=t.z-P.z,d=Math.hypot(dx,dz);
    if(d<bd&&Math.abs(angd(Math.atan2(dx,dz),aimAngle))<cone){
      const fx=dx/d,fz=dz/d;
      if(rayWall(P.x,P.z,fx,fz,d)>=d-0.5){bd=d;bt=t;}
    }
  }
  return bt;
}

function spawnBullet(ox,oy,oz,yaw,pitch,speed,dmg,fromPlayer,col=0xfef08a){
  const g=new THREE.Group();
  // Ogive métallique + traînée balistique fine
  const slug=new THREE.Mesh(new THREE.SphereGeometry(0.065,6,6),new THREE.MeshBasicMaterial({color:0xffffff}));
  const trail=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.006,1.35,6),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.88}));
  trail.rotation.x=PI/2;trail.position.z=-0.68;
  g.add(slug,trail);
  g.position.set(ox,oy,oz);
  g.rotation.set(-pitch,yaw,0);
  scene.add(g);
  const cosP=Math.cos(pitch);
  bullets.push({
    m:g,x:ox,y:oy,z:oz,
    vx:Math.sin(yaw)*cosP*speed,
    vy:Math.sin(pitch)*speed,
    vz:Math.cos(yaw)*cosP*speed,
    life:0.85,fromPlayer,dmg
  });
}

function fireWeapon(isAiming){
  const wep=SAVE.curWeapon;
  if(P.cd>0)return;
  P.cd=wep==='smg'?0.095:wep==='rifle'?0.15:0.25;
  const dmg=wep==='rifle'?45:wep==='smg'?19:32;
  const spd=wep==='rifle'?155:130;

  let aimYaw=isAiming?cy:(P.car?cy:P.h);
  const locked=findAimTarget(aimYaw,62,isAiming?0.24:0.55);
  let pitch=0;
  if(locked){
    aimYaw=Math.atan2(locked.x-P.x,locked.z-P.z);
    const d=Math.max(1,Math.hypot(locked.x-P.x,locked.z-P.z));
    pitch=Math.atan2((locked.vType?0.9:1.25)-1.42,d);
  }
  if(!P.car)P.h=aimYaw;

  // Point de sortie exact au bout du canon
  const muzzleX=P.x+Math.sin(aimYaw)*0.85+Math.cos(aimYaw)*0.28;
  const muzzleZ=P.z+Math.cos(aimYaw)*0.85-Math.sin(aimYaw)*0.28;
  const muzzleY=(P.car?1.35:1.45)+P.y;

  // Flash de canon bref
  const flash=new THREE.Mesh(new THREE.SphereGeometry(0.18,6,6),new THREE.MeshBasicMaterial({color:0xffab00}));
  flash.position.set(muzzleX,muzzleY,muzzleZ);scene.add(flash);
  trs.push({m:flash,t:0.045});

  const col=wep==='rifle'?0xff5252:wep==='smg'?0xffab40:0xfef08a;
  spawnBullet(muzzleX,muzzleY,muzzleZ,aimYaw,pitch,spd,dmg,true,col);
  playGunshot(wep);

  if(!inside)for(const p of peds)if(!p.dead&&Math.hypot(p.x-P.x,p.z-P.z)<45)p.fl=5;
}

function updateBullets(dt){
  for(const b of bullets){
    b.life-=dt;
    if(b.life<=0){b.dead=1;scene.remove(b.m);continue;}
    const stepX=b.vx*dt,stepY=b.vy*dt,stepZ=b.vz*dt;
    const stepDist=Math.hypot(stepX,stepY,stepZ);
    const fx=stepX/(stepDist||1),fz=stepZ/(stepDist||1);

    // Impact sur un mur ou bâtiment
    if(!inside&&rayWall(b.x,b.z,fx,fz,stepDist)<stepDist){
      const sp=bx(0.2,0.2,0.2,0xfef08a,b.x,b.y,b.z);trs.push({m:sp,t:0.08});
      b.dead=1;scene.remove(b.m);continue;
    }

    b.x+=stepX;b.y+=stepY;b.z+=stepZ;
    b.m.position.set(b.x,b.y,b.z);
    if(b.y<=0.05){b.dead=1;scene.remove(b.m);continue;}

    if(b.fromPlayer){
      // Vérifie impact sur voitures, ennemis, policiers ou PNJ
      let hit=null;
      for(const c of cars){
        if(c===P.car)continue;
        if(Math.hypot(c.x-b.x,c.z-b.z)<(c.vType==='moto'?1.2:2.2)&&b.y<2.1){hit=c;break;}
      }
      if(!hit&&!inside){
        for(const t of enemies.concat(copsOnFoot).concat(peds.filter(p=>!p.dead))){
          if(t.dead)continue;
          if(Math.hypot(t.x-b.x,t.z-b.z)<0.95&&b.y<2.15){hit=t;break;}
        }
      }
      if(hit){
        const sp=bx(0.24,0.24,0.24,hit.vType?0xff9100:0xff1744,b.x,b.y,b.z);trs.push({m:sp,t:0.09});
        hit.hp-=b.dmg;
        if(hit.vType!==undefined){
          addCrime(hit.kind==='cop'?2:1);
          if(hit.hp<=0)explodeCar(hit);
        }else if(hit.profile){
          if(hit.hp<=0)killPed(hit);
        }else if(copsOnFoot.includes(hit)){
          addCrime(2);
          if(hit.hp<=0){scene.remove(hit.m);copsOnFoot=copsOnFoot.filter(x=>x!==hit);P.cash+=50;}
        }else if(hit.hp<=0&&!hit.dead){
          hit.dead=1;scene.remove(hit.m);enemiesLeft--;
          showToast(`Bandit neutralisé ! Restants : ${Math.max(0,enemiesLeft)}`);
        }
        b.dead=1;scene.remove(b.m);
      }
    }else{
      // Balle ennemie / police vers le joueur
      if(P.car&&Math.hypot(P.car.x-b.x,P.car.z-b.z)<2.2){
        P.car.hp-=b.dmg;b.dead=1;scene.remove(b.m);
      }else if(!P.car&&Math.hypot(P.x-b.x,P.z-b.z)<0.95){
        damagePlayer(b.dmg);b.dead=1;scene.remove(b.m);
      }
    }
  }
  bullets=bullets.filter(b=>!b.dead);
}

// ===== CONDUITE & MARCHE ARRIÈRE FLUIDE STYLE PAYBACK 2
function drivePlayerCar(c,dt,i){
  const maxSpd=c.vType==='moto'?38:c.vType==='vip'?37:33;
  const steerInput=cl(-i.x,-1,1);

  if(c.m.userData.brakeMat){
    c.m.userData.brakeMat.color.setHex(i.brake?0xff1744:0x7f1d1d);
  }

  if(i.gas){
    c.revLock=0;
    if(c.v<-0.5)c.v+=36*dt;
    else c.v+=22*dt;
  }else if(i.brake){
    if(c.v>1.2&&!c.revLock){
      c.v=Math.max(0,c.v-42*dt);
      if(c.v<=1.2)c.revLock=1;
    }else{
      c.revLock=1;
      c.v-=18*dt;
    }
  }else{
    c.revLock=0;
    c.v-=c.v*Math.min(1,1.35*dt);
    if(Math.abs(c.v)<0.15)c.v=0;
  }

  c.v=cl(c.v,-15,maxSpd);
  const turnFactor=cl(Math.abs(c.v)/3.2,0.22,1);
  const dir=c.v>=-0.05?1:-1;
  c.h+=steerInput*(c.vType==='moto'?3.2:2.65)*turnFactor*dir*dt;

  c.x+=Math.sin(c.h)*c.v*dt;
  c.z+=Math.cos(c.h)*c.v*dt;

  if(hitBuilding(c,c.vType==='moto'?1.2:2.1)){
    if(Math.abs(c.v)>11){c.hp-=Math.abs(c.v)*0.32;playTone(105,0.14,'sawtooth');}
    c.v*=-0.2;
  }
}

function isBlocked(c){
  const fx=Math.sin(c.h),fz=Math.cos(c.h);
  const ck=(o,fl,sl)=>{const dx=o.x-c.x,dz=o.z-c.z,f=dx*fx+dz*fz,s=Math.abs(dx*fz-dz*fx);return f>1&&f<fl&&s<sl;};
  for(const o of cars)if(o!==c&&ck(o,10,2.8))return 1;
  if(!P.car&&!inside&&ck(P,9,2))return 1;
  for(const p of peds)if(!p.dead&&ck(p,8,1.8))return 1;
  return 0;
}

function updateAICar(c,dt){
  const chase=c.kind==='cop'&&stars>0&&S==='play';
  if(c.kind==='cop'&&c.m.userData.l1){
    const fl=Math.sin(tm*15)>0;
    c.m.userData.l1.material.color.setHex(fl?0xff1744:0x4a0007);
    c.m.userData.l2.material.color.setHex(!fl?0x2979ff:0x00194a);
  }
  let tv=null;
  if(c.kind==='me')c.v-=c.v*Math.min(1,2*dt);
  else if(c.rev>0){c.rev-=dt;c.v=-6;c.h+=dt*2;}
  else if(chase){
    const dist=Math.hypot(P.x-c.x,P.z-c.z);
    c.h-=angd(c.h,Math.atan2(P.x-c.x,P.z-c.z))*Math.min(1,dt*2.9);
    if(dist<15){
      tv=0;
      if(Math.abs(c.v)<3)deployCopsFromCar(c);
    }else tv=26;
  }else{
    const ix=Math.round(c.x/CS)*CS,iz=Math.round(c.z/CS)*CS,inI=Math.abs(c.x-ix)<9&&Math.abs(c.z-iz)<9;
    c.h-=angd(c.h,HD[c.d])*Math.min(1,dt*6);
    if(inI){
      if(!c.turned){
        c.turned=1;
        const o=[0,1,2,3].filter(d=>{const ni=ix/CS+[1,0,-1,0][d],nj=iz/CS+[0,1,0,-1][d];return d!==(c.d+2)%4&&ni>=0&&nj>=0&&ni<=NB&&nj<=NB;});
        c.d=R()<0.5&&o.includes(c.d)?c.d:o[R()*o.length|0];
      }
    }else{
      c.turned=0;
      const k=Math.min(1,dt*4),L=[iz+4,ix-4,iz-4,ix+4][c.d];
      if(c.d%2===0)c.z+=(L-c.z)*k;else c.x+=(L-c.x)*k;
    }
    tv=c.kind==='cop'?12:c.vType==='moto'?15:c.vType==='taxi'?12:9+(c.id%4);
  }
  if(tv!==null){
    if(!chase&&isBlocked(c)){c.bt+=dt;if(c.bt<3)tv=0;}else c.bt=0;
    c.v+=(tv-c.v)*Math.min(1,dt*2.5);
  }
  c.x+=Math.sin(c.h)*c.v*dt;c.z+=Math.cos(c.h)*c.v*dt;
  if(hitBuilding(c,2.0)&&c.kind!=='me'){c.v*=0.3;c.st+=dt;if(c.st>0.6){c.rev=0.9;c.st=0;}}
}

// ===== BOUCLE PRINCIPALE
function update(dt){
  tm+=dt;updateRadio(dt);
  const i=getInput(),pl=S==='play';
  const isAiming=pl&&!P.car&&!!i.aim;

  // Cycle Jour / Crépuscule / Nuit lumineux
  if(pl){
    dayTime=(dayTime+dt*0.045)%24;
    const isNight=dayTime<6||dayTime>19;
    const isDusk=(dayTime>=17.5&&dayTime<=19)||(dayTime>=6&&dayTime<=7.2);
    const skyCol=isNight?0x111d38:(isDusk?0xf97316:0x8ecae6);
    scene.background.lerp(new THREE.Color(skyCol),dt*0.6);
    scene.fog.color.copy(scene.background);
    hemi.intensity=isNight?0.58:0.92;
    sun.intensity=isNight?0.38:0.98;
    const glowTarget=isNight?0.85:(isDusk?0.45:0.1);
    for(const m of buildingMats)m.emissiveIntensity+=(glowTarget-m.emissiveIntensity)*dt*2;
    beamMat.opacity=isNight?0.24:(isDusk?0.16:0.05);
    lampGlowMat.opacity=isNight?0.22:(isDusk?0.12:0.0);
  }

  if(!inside&&S!=='pause'&&S!=='shop'&&S!=='map'){
    streamChunks(false,P.x,P.z);
    if(pend.length)createChunk(...pend.shift());
    if(cars.filter(c=>c.kind==='civ').length<12)autoSpawnTraffic('civ');
    const cn=cars.filter(c=>c.kind==='cop').length;
    if(stars&&cn<Math.min(4,stars+1))autoSpawnTraffic('cop');
    if(peds.length<18)autoSpawnNPC();
    for(const c of cars)if(c.kind!=='me'&&c!==P.car&&Math.hypot(c.x-P.x,c.z-P.z)>205){scene.remove(c.m);c.dead=1;}
    for(const p of peds)if(Math.hypot(p.x-P.x,p.z-P.z)>180){scene.remove(p.m);p.rm=1;}
    cars=cars.filter(c=>!c.dead);peds=peds.filter(p=>!p.rm);
  }

  if(pl){
    P.cd=Math.max(0,P.cd-dt);P.inv=Math.max(0,P.inv-dt);
    if(P.y>0||P.vy>0){P.y+=P.vy*dt;P.vy-=18*dt;if(P.y<=0){P.y=0;P.vy=0;}}

    // Mise à jour viseur laser & réticule dynamique
    P.m.userData.laser.visible=isAiming;
    const chEl=$('crosshair');
    chEl.classList.toggle('aiming',isAiming);
    const aimYaw=isAiming?cy:(P.car?cy:P.h);
    const lockedTarget=findAimTarget(aimYaw,62,isAiming?0.24:0.55);
    chEl.classList.toggle('locked',!!lockedTarget);

    if(P.car){
      drivePlayerCar(P.car,dt,i);
      P.x=P.car.x;P.z=P.car.z;P.h=P.car.h;
      if(!lid){
        const targetCamH=P.car.v<-1.5?P.car.h+PI:P.car.h;
        cy-=angd(cy,targetCamH)*Math.min(1,dt*2.2);
      }
      P.stamina=Math.min(100,P.stamina+15*dt);
      if(Math.hypot(P.x-GAS_X,P.z-GAS_Z)<12&&P.car.hp<P.car.maxHp){
        P.car.hp=Math.min(P.car.maxHp,P.car.hp+35*dt);
        if(R()<0.08)showToast('⛽ Station-service : Réparation du véhicule...');
      }
    }else{
      const m=Math.hypot(i.x,i.y);
      const sprinting=i.run&&!isAiming&&P.stamina>4&&m>0.1;
      if(sprinting)P.stamina=Math.max(0,P.stamina-22*dt);
      else P.stamina=Math.min(100,P.stamina+16*dt);

      if(isAiming)P.h-=angd(P.h,cy)*Math.min(1,dt*18);

      if(m>0.05){
        const fwdX=Math.sin(cy),fwdZ=Math.cos(cy);
        const rgtX=-Math.cos(cy),rgtZ=Math.sin(cy);
        const wx=fwdX*(-i.y)+rgtX*i.x;
        const wz=fwdZ*(-i.y)+rgtZ*i.x;
        const th=Math.atan2(wx,wz);
        const sp=(isAiming?3.4:sprinting?10.2:5.2)*Math.min(1,m);
        if(!isAiming)P.h-=angd(P.h,th)*Math.min(1,dt*14);
        P.x+=Math.sin(th)*sp*dt;P.z+=Math.cos(th)*sp*dt;
        P.wk+=dt*sp*1.9;
      }
      if(inside){
        P.x=cl(P.x,IX-7.2,IX+7.2);P.z=cl(P.z,IZ-6.2,IZ+6.2);
        for(const q of roomObs){
          const x=cl(P.x,q[0],q[2]),z=cl(P.z,q[1],q[3]),dx=P.x-x,dz=P.z-z,d2=dx*dx+dz*dz;
          if(d2<0.36){const d=Math.sqrt(d2)||0.01;P.x+=dx/d*(0.6-d);P.z+=dz/d*(0.6-d);}
        }
        if(roomCash.visible&&Math.hypot(P.x-roomCash.position.x,P.z-roomCash.position.z)<1.9){
          roomCash.visible=false;P.cash+=120;writeSave();showToast('+120 FCFA trouvés !');playTone(840,0.22,'sine');
        }
        if(roomMed.visible&&Math.hypot(P.x-roomMed.position.x,P.z-roomMed.position.z)<1.9){
          roomMed.visible=false;P.hp=Math.min(100,P.hp+50);writeSave();showToast('+50 Santé !');playTone(620,0.25,'sine');
        }
      }else{
        hitBuilding(P,0.6);
        resolvePersonCarCollisions(P,0.65);
      }
    }

    if(i.fire)fireWeapon(isAiming);
    updateBullets(dt);

    // Balise 3D & Flèche GPS flottante au-dessus du joueur
    const tgt=getActiveTarget();
    beacon.visible=!inside&&!!tgt;
    bRing.rotation.y+=dt*2.4;
    if(tgt){
      beacon.position.set(tgt.tx,0,tgt.tz);
      bRing.material.color.setHex(tgt.isCustom?0x00e676:0xffd54f);
      bBeam.material.color.setHex(tgt.isCustom?0x00e676:0xffd54f);
      gpsArrow.visible=!inside;
      gpsArrow.position.set(P.x,(P.car?2.65:2.55+P.y)+Math.sin(tm*5)*0.1,P.z);
      gpsArrow.rotation.y=Math.atan2(tgt.tx-P.x,tgt.tz-P.z);
    }else gpsArrow.visible=false;

    if(customWaypoint&&Math.hypot(P.x-customWaypoint.x,P.z-customWaypoint.z)<6){
      customWaypoint=null;showToast('📍 Tu es arrivé à ton repère GPS !');playTone(760,0.2,'sine');
    }

    if(!inside&&activeMission){
      missionTimeLeft-=dt;
      const dist=Math.hypot(P.x-activeMission.tx,P.z-activeMission.tz);
      $('obj-banner').textContent=`🎯 ${activeMission.title} · 📍 ${Math.round(dist)}m`;
      if(missionTimeLeft<=0){showToast('⏰ Temps écoulé ! Mission recommencée.');setupMission();}
      else if(activeMission.type==='combat'){
        if(enemiesLeft<=0){
          P.cash+=activeMission.reward;SAVE.missionIdx++;writeSave();
          showToast(`🏆 Mission accomplie ! +${activeMission.reward} FCFA`);playTone(880,0.4,'sine',0.07);setupMission();
        }
      }else if(dist<5.5){
        P.cash+=activeMission.reward;if(SAVE.missionIdx<STORY_MISSIONS.length)SAVE.missionIdx++;writeSave();
        showToast(`🏆 Objectif atteint ! +${activeMission.reward} FCFA`);playTone(880,0.4,'sine',0.07);setupMission();
      }
    }

    if(!inside){
      for(const c of cars)if(c!==P.car&&!P.car&&Math.abs(c.v)>7&&Math.hypot(c.x-P.x,c.z-P.z)<2.3)damagePlayer(Math.abs(c.v)*1.1);
      if(stars>0){
        wT-=dt*(cars.some(c=>c.kind==='cop'&&Math.hypot(c.x-P.x,c.z-P.z)<48)||copsOnFoot.length>0?1:2.4);
        if(wT<=0){stars--;wT=12;if(stars===0)clearCopsOnFoot();}
      }else P.hp=Math.min(100,P.hp+0.9*dt);
    }

    if(P.hp<=0){
      S='dead';dT=3;if(P.car){P.car.kind='me';P.car=null;updateControlUI();}
      P.m.visible=true;$('wasted').style.display='flex';clearCopsOnFoot();
    }
  }

  if(S==='dead'){
    dT-=dt;
    if(dT<=0){
      inside=0;P.x=3*CS+18;P.z=3*CS+12;P.hp=100;P.inv=2;P.cash=Math.max(0,P.cash-150);
      stars=0;S='play';$('wasted').style.display='none';streamChunks(true,P.x,P.z);writeSave();
      showToast('🏥 Hôpital Central de Yaoundé : -150 FCFA');
    }
  }

  if(!inside&&S!=='pause'&&S!=='shop'&&S!=='map'){
    for(const c of cars){
      if(c!==P.car)updateAICar(c,dt);
      if(c.hp<c.maxHp*0.45){
        c.smokeT-=dt;
        if(c.smokeT<=0){
          c.smokeT=0.14;
          const sm=bx(0.5,0.5,0.5,0x334155,c.x+Math.sin(c.h)*1.5,1.3,c.z+Math.cos(c.h)*1.5);
          trs.push({m:sm,t:0.45,gr:1});
        }
      }
    }
    for(let a=0;a<cars.length;a++)for(let b=a+1;b<cars.length;b++){
      const p=cars[a],q=cars[b],d=Math.hypot(p.x-q.x,p.z-q.z);
      if(d<4.3&&d>0.01){
        const nx=(p.x-q.x)/d,nz=(p.z-q.z)/d,o=(4.3-d)*0.52,dv=Math.abs(p.v-q.v);
        p.x+=nx*o;p.z+=nz*o;q.x-=nx*o;q.z-=nz*o;
        if(dv>8){
          p.hp-=dv*0.42;q.hp-=dv*0.42;
          if(P.car===p||P.car===q){playTone(115,0.12,'sawtooth');if(p.kind==='cop'||q.kind==='cop')addCrime(2);}
        }
        const avg=(p.v+q.v)*0.35;
        p.v=avg;q.v=avg;
      }
    }
    for(const c of cars)if(c.hp<=0&&!c.dead)explodeCar(c);
    cars=cars.filter(c=>!c.dead);
    if(P.car&&P.car.dead){P.car=null;updateControlUI();}
    P.m.visible=!P.car;

    for(const cp of copsOnFoot){
      const d=Math.hypot(P.x-cp.x,P.z-cp.z);
      cp.h=Math.atan2(P.x-cp.x,P.z-cp.z);
      if(d>10&&d<68){
        cp.x+=Math.sin(cp.h)*4.8*dt;cp.z+=Math.cos(cp.h)*4.8*dt;cp.wk+=dt*9.5;
        hitBuilding(cp,0.6);resolvePersonCarCollisions(cp,0.6);
      }
      cp.cd-=dt;
      if(d<40&&cp.cd<=0&&S==='play'){
        cp.cd=cp.isBir?0.95:1.35;
        const fx=(P.x-cp.x)/d,fz=(P.z-cp.z)/d;
        if(rayWall(cp.x,cp.z,fx,fz,d)>=d-0.6){
          spawnBullet(cp.x+fx*0.8,1.35,cp.z+fz*0.8,cp.h+rn(-0.08,0.08),0,95,cp.isBir?11:8,false,0xff1744);
          playGunshot('pistol');
        }
      }
      cp.m.position.set(cp.x,0,cp.z);cp.m.rotation.y=cp.h;swingLimbs(cp.m,cp.wk,0.45);
    }

    for(const p of peds){
      if(p.dead){p.t+=dt;if(p.t>9){scene.remove(p.m);p.rm=1;}continue;}
      const distP=Math.hypot(p.x-P.x,p.z-P.z);
      p.chatCd=Math.max(0,p.chatCd-dt);
      if(distP<5.5&&p.chatCd<=0&&bubbleT<=0&&R()<0.015){
        p.chatCd=25;
        const txt=p.fl>0?'Au secours !':getAgentReply(p);
        showNpcBubble(p.profile.name,txt,3.8);
      }
      if(p.fl>0){p.fl-=dt;p.h=Math.atan2(p.x-P.x,p.z-P.z);}
      else{p.t-=dt;if(p.t<0){p.t=rn(1.5,4.5);p.h+=rn(-1.3,1.3);}}
      const sp=p.fl>0?7.4:2.1;
      p.x+=Math.sin(p.h)*sp*dt;p.z+=Math.cos(p.h)*sp*dt;p.wk+=dt*sp*2;
      if(hitBuilding(p,0.6))p.h+=PI*rn(0.6,1.4);
      resolvePersonCarCollisions(p,0.6);
      for(const c of cars)if(Math.abs(c.v)>7&&Math.hypot(c.x-p.x,c.z-p.z)<2.2){killPed(p);break;}
    }
    peds=peds.filter(p=>!p.rm);

    for(const e of enemies){
      if(e.dead)continue;
      const d=Math.hypot(P.x-e.x,P.z-e.z);
      e.h=Math.atan2(P.x-e.x,P.z-e.z);
      if(d>12&&d<45){e.x+=Math.sin(e.h)*3.6*dt;e.z+=Math.cos(e.h)*3.6*dt;e.wk+=dt*7.5;hitBuilding(e,0.6);}
      e.cd-=dt;
      if(d<38&&e.cd<=0&&S==='play'){
        e.cd=1.4;
        const fx=(P.x-e.x)/d,fz=(P.z-e.z)/d;
        if(rayWall(e.x,e.z,fx,fz,d)>=d-0.6){
          spawnBullet(e.x+fx*0.8,1.35,e.z+fz*0.8,e.h+rn(-0.08,0.08),0,95,10,false,0xff3d00);
          playGunshot('pistol');
        }
      }
      e.m.position.set(e.x,0,e.z);e.m.rotation.y=e.h;swingLimbs(e.m,e.wk,0.45);
    }
  }

  for(const p of peds){p.m.position.set(p.x,p.dead?0.35:0,p.z);if(!p.dead){p.m.rotation.y=p.h;swingLimbs(p.m,p.wk,0.45);}}
  for(const c of cars){c.m.position.set(c.x,0,c.z);c.m.rotation.y=c.h;}
  P.m.position.set(P.x,P.y,P.z);P.m.rotation.y=P.h;swingLimbs(P.m,P.wk,0.48);
  for(const t of trs){t.t-=dt;if(t.gr)t.m.scale.setScalar(1+(0.55-t.t)*5);if(t.t<=0){scene.remove(t.m);t.d=1;}}
  trs=trs.filter(t=>!t.d);

  // ===== CAMÉRA ANTI-COLLISION + ZOOM ÉPAULE EN VISÉE (🎯)
  let D=inside?4.5:P.car?(P.car.vType==='moto'?8.5:10.8):(isAiming?3.4:6.6);
  if(S==='menu'){cy+=dt*0.22;D=15;}
  const sv=P.car?Math.abs(P.car.v)/35:0;
  zs+=(sv-zs)*dt*2;
  const targetFov=isAiming?46:(62+zs*13);
  cam.fov+=(targetFov-cam.fov)*Math.min(1,dt*10);
  cam.updateProjectionMatrix();

  const dirX=-Math.sin(cy)*Math.cos(cp),dirZ=-Math.cos(cy)*Math.cos(cp);
  const hLen=Math.hypot(dirX,dirZ)||1;
  let safeD=D;
  if(!inside&&S!=='menu'){
    const wallD=rayWall(P.x,P.z,dirX/hLen,dirZ/hLen,D*hLen);
    safeD=Math.max(1.6,(wallD-0.9)/hLen);
  }
  // Décalage épaule droite quand on vise
  const shoulder=isAiming?0.65:0;
  const sx=-Math.cos(cy)*shoulder,sz=Math.sin(cy)*shoulder;
  let cx=P.x+sx+dirX*safeD,cz=P.z+sz+dirZ*safeD,ch=(isAiming?1.68:1.8)+P.y+safeD*Math.sin(cp);
  if(inside){cx=cl(cx,IX-7.4,IX+7.4);cz=cl(cz,IZ-6.4,IZ+6.4);ch=Math.min(ch,4.2);}
  cam.position.set(cx,ch,cz);
  cam.lookAt(P.x+sx+Math.sin(cy)*6,P.car?1.2:1.58+P.y,P.z+sz+Math.cos(cy)*6);

  // ===== HUD & RADAR
  $('hp-bar').style.width=cl(P.hp,0,100)+'%';
  $('ar-bar').style.width=cl(P.armor,0,100)+'%';
  $('st-bar').style.width=cl(P.stamina,0,100)+'%';
  $('stars').textContent='★'.repeat(stars)+'☆'.repeat(5-stars);
  $('cash').textContent=P.cash+' FCFA';
  $('mission-timer').textContent=activeMission?`⏱ ${Math.max(0,Math.ceil(missionTimeLeft))}s · +${activeMission.reward} FCFA`:'';
  const hh=Math.floor(dayTime),mm=Math.floor((dayTime-hh)*60);
  $('clock-tag').textContent=`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;

  if(P.car){
    const kmh=Math.round(Math.abs(P.car.v)*3.6);
    $('speed-val').textContent=(P.car.v<-0.5?'R ':'')+kmh;
    const pct=cl((P.car.hp/P.car.maxHp)*100,0,100);
    $('car-hp-bar').style.width=pct+'%';
    $('car-hp-bar').style.background=pct<35?'#ff1744':pct<65?'#ff9100':'#00e676';
  }

  const distMon=Math.hypot(P.x-MON_X,P.z-MON_Z);
  const distShop=Math.hypot(P.x-SHOP_X,P.z-SHOP_Z);
  const distGas=Math.hypot(P.x-GAS_X,P.z-GAS_Z);
  $('zone-tag').textContent=inside?'🏠 INTÉRIEUR VILLA':distMon<55?'🏛️ MONUMENT RÉUNIFICATION':distShop<25?'🛒 BOUTIQUE QUARTIER':distGas<25?'⛽ STATION-SERVICE':P.z>5*CS?'🎓 NGOA-EKELLÉ':P.x>5*CS?'🌴 BASTOS':'📍 BOULEVARD DU 20 MAI';

  if(msgT>0){msgT-=dt;if(msgT<=0)$('toast').classList.remove('show');}
  if(bubbleT>0){bubbleT-=dt;if(bubbleT<=0)$('npc-bubble').style.display='none';}

  const ab=document.querySelector('#controls-foot .t-act');
  if(ab){
    const ic=inside?'🚪':distShop<4.8?'🛒':findNearestCar(5.5)?'🚗':nearDoor()?'🏠':findNearestNPC(6.0)?'💬':'🚗';
    if(ab.textContent!==ic)ab.textContent=ic;
  }
  drawRadar();
}

// ===== RADAR 100 % SYNCHRONISÉ AVEC CAMÉRA & TRACÉ GPS
const rCtx=$('radar').getContext('2d');
function worldToRadar(wx,wz,SC){
  const dx=wx-P.x,dz=wz-P.z;
  return{
    x:(-dx*Math.cos(cy)+dz*Math.sin(cy))*SC,
    y:(-dx*Math.sin(cy)-dz*Math.cos(cy))*SC
  };
}

function drawRadar(){
  const W=124,H=124,CX=W/2,CY=H/2,SC=0.46;
  rCtx.clearRect(0,0,W,H);
  rCtx.save();
  rCtx.beginPath();rCtx.arc(CX,CY,58,0,PI*2);rCtx.clip();
  rCtx.fillStyle='#0d1526';rCtx.fillRect(0,0,W,H);

  if(!inside){
    // Grille des rues synchronisée
    rCtx.strokeStyle='#334155';rCtx.lineWidth=4.5;
    const gx0=Math.floor((P.x-140)/CS)*CS,gz0=Math.floor((P.z-140)/CS)*CS;
    for(let x=gx0;x<=P.x+140;x+=CS){
      if(x>=0&&x<=WS){
        const p1=worldToRadar(x,P.z-140,SC),p2=worldToRadar(x,P.z+140,SC);
        rCtx.beginPath();rCtx.moveTo(CX+p1.x,CY+p1.y);rCtx.lineTo(CX+p2.x,CY+p2.y);rCtx.stroke();
      }
    }
    for(let z=gz0;z<=P.z+140;z+=CS){
      if(z>=0&&z<=WS){
        const p1=worldToRadar(P.x-140,z,SC),p2=worldToRadar(P.x+140,z,SC);
        rCtx.beginPath();rCtx.moveTo(CX+p1.x,CY+p1.y);rCtx.lineTo(CX+p2.x,CY+p2.y);rCtx.stroke();
      }
    }

    // Boutique & Station-service
    const ps=worldToRadar(SHOP_X,SHOP_Z,SC);
    rCtx.fillStyle='#38bdf8';rCtx.fillRect(CX+ps.x-3,CY+ps.y-3,6,6);
    const pg=worldToRadar(GAS_X,GAS_Z,SC);
    rCtx.fillStyle='#fb923c';rCtx.fillRect(CX+pg.x-3,CY+pg.y-3,6,6);

    // Voitures & Policiers
    for(const c of cars){
      if(c===P.car)continue;
      const pc=worldToRadar(c.x,c.z,SC);
      rCtx.fillStyle=c.kind==='cop'?(Math.sin(tm*14)>0?'#ff1744':'#2979ff'):c.vType==='taxi'?'#facc15':'#94a3b8';
      rCtx.fillRect(CX+pc.x-2,CY+pc.y-2,4,4);
    }
    for(const cp of copsOnFoot){
      const pcp=worldToRadar(cp.x,cp.z,SC);
      rCtx.fillStyle='#2979ff';rCtx.beginPath();rCtx.arc(CX+pcp.x,CY+pcp.y,3,0,PI*2);rCtx.fill();
    }

    // Tracé GPS lumineux + Point d'objectif ancré sur le bord du radar
    const tgt=getActiveTarget();
    if(tgt){
      const pt=worldToRadar(tgt.tx,tgt.tz,SC);
      let tx=pt.x,ty=pt.y;
      const bd=Math.hypot(tx,ty);
      if(bd>49){tx*=49/bd;ty*=49/bd;}
      rCtx.save();
      rCtx.strokeStyle=tgt.isCustom?'#00e676':'#ffd54f';
      rCtx.lineWidth=2.5;rCtx.setLineDash([4,3]);
      rCtx.beginPath();rCtx.moveTo(CX,CY);rCtx.lineTo(CX+tx,CY+ty);rCtx.stroke();
      rCtx.restore();

      rCtx.fillStyle=tgt.isCustom?'#00e676':'#ffd54f';
      rCtx.beginPath();rCtx.arc(CX+tx,CY+ty,5,0,PI*2);rCtx.fill();
    }
  }
  rCtx.restore();

  // Flèche du joueur orientée selon l'angle relatif entre le joueur et la caméra
  const relH=angd(cy,P.h);
  rCtx.save();
  rCtx.translate(CX,CY);
  rCtx.rotate(relH);
  rCtx.fillStyle='#ff4081';
  rCtx.beginPath();rCtx.moveTo(0,-6.5);rCtx.lineTo(4.5,5);rCtx.lineTo(-4.5,5);rCtx.closePath();rCtx.fill();
  rCtx.restore();
}

function startGame(){
  for(const c of cars)scene.remove(c.m);
  for(const p of peds)scene.remove(p.m);
  for(const b of bullets)scene.remove(b.m);
  clearCopsOnFoot();
  cars=[];peds=[];bullets=[];stars=0;inside=0;
  P.x=SAVE.px;P.z=SAVE.pz;P.h=0;P.y=0;P.vy=0;P.hp=SAVE.hp;P.armor=SAVE.armor;P.stamina=100;P.cash=SAVE.cash;P.car=null;P.inv=1;
  P.m.visible=true;cy=0;
  updateWeaponHUD();updateControlUI();
  streamChunks(true,P.x,P.z);
  spawnVehicle('me',P.x+4,P.z-6,0);
  setupMission();
  for(let i=0;i<35;i++){if(cars.length<12)autoSpawnTraffic('civ');if(peds.length<18)autoSpawnNPC();}
  S='play';$('menu').style.display='none';
}

loadSave();
streamChunks(true,P.x,P.z);
for(let i=0;i<40;i++){if(cars.length<12)autoSpawnTraffic('civ');if(peds.length<18)autoSpawnNPC();}
let last=0;
function loop(t){
  requestAnimationFrame(loop);
  const dt=Math.min(0.05,(t-last)/1000||0);last=t;
  const port=touch&&innerHeight>innerWidth&&!document.body.classList.contains('force');
  if(!port)update(dt);
  ren.render(scene,cam);
}
requestAnimationFrame(loop);
