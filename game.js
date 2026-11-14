'use strict';
const $=id=>document.getElementById(id);

// ===== SAUVEGARDE LOCALE
const SAVE_KEY='cameroun_stories_yaounde_v6';
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
  $('save-summary').innerHTML=`💾 <b>Sauvegarde :</b> ${SAVE.cash} FCFA · ${m?m.title:'Mode Libre Yaoundé'}`;
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

// ===== INTÉRIEUR VILLA LUXE DÉTAILLÉ (SOL À Y = +0.15m)
const room=new THREE.Group();scene.add(room);
bx(18,0.3,16,0xd4a373,IX,0,IZ,room);
// Tapis central & carrelage décoratif
bx(7.2,0.04,5.4,0x991b1b,IX-1.2,0.17,IZ-1.2,room);
bx(6.6,0.05,4.8,0xfef3c7,IX-1.2,0.175,IZ-1.2,room);
for(const[w,d,x,z]of[[18,0.5,0,-8],[18,0.5,0,8],[0.5,16,-9,0],[0.5,16,9,0]])bx(w,5.4,d,0xfefae0,IX+x,2.7,IZ+z,room);
bx(18,0.3,16,0xf8fafc,IX,5.4,IZ,room);
// Lustre lumineux au plafond
cyl(0.08,0.08,0.9,8,0x334155,IX,4.9,IZ,room);
cyl(0.65,0.45,0.28,12,new THREE.MeshBasicMaterial({color:0xfef08a}),IX,4.45,IZ,room);

// Canapé d'angle avec coussins & accoudoirs + Table basse vitrée + Meuble TV & Écran plat
bx(4.4,0.55,1.5,0x1e3a8a,IX-1.2,0.42,IZ-3.4,room);
bx(4.4,0.75,0.35,0x172554,IX-1.2,0.95,IZ-4.0,room);
bx(0.35,0.65,1.5,0x172554,IX-3.3,0.62,IZ-3.4,room);
bx(0.35,0.65,1.5,0x172554,IX+0.9,0.62,IZ-3.4,room);
bx(2.4,0.45,1.2,0x78350f,IX-1.2,0.38,IZ-1.2,room);
bx(2.2,0.06,1.0,0x38bdf8,IX-1.2,0.62,IZ-1.2,room);
// Meuble TV + Téléviseur LED
bx(3.4,0.7,0.9,0x451a03,IX-1.2,0.5,IZ+1.6,room);
bx(2.6,1.45,0.14,0x0f172a,IX-1.2,1.65,IZ+1.6,room);
bx(2.4,1.25,0.16,new THREE.MeshBasicMaterial({color:0x0284c7}),IX-1.2,1.65,IZ+1.62,room);

// Lit double avec oreillers & table de nuit à droite
bx(3.6,0.55,4.2,0x7f1d1d,IX+5.8,0.42,IZ-4.5,room);
bx(3.4,0.22,3.9,0xf8fafc,IX+5.8,0.75,IZ-4.5,room);
bx(1.1,0.18,0.65,0x38bdf8,IX+4.9,0.92,IZ-5.9,room);
bx(1.1,0.18,0.65,0x38bdf8,IX+6.7,0.92,IZ-5.9,room);

// Table à manger & chaises + Plantes vertes d'intérieur
bx(2.8,0.14,1.8,0x92400e,IX-5.8,1.05,IZ+3.2,room);
for(const[lx,lz]of[[-7.0,2.5],[-4.6,2.5],[-7.0,3.9],[-4.6,3.9]])cyl(0.08,0.08,0.9,6,0x451a03,IX+lx,0.6,IZ+lz,room);
for(const[px,pz]of[[-7.8,-6.8],[7.8,6.8]]){
  cyl(0.38,0.28,0.65,10,0xb45309,IX+px,0.48,IZ+pz,room);
  const pl=new THREE.Mesh(new THREE.DodecahedronGeometry(0.65,1),mt(0x15803d,0.8));
  pl.position.set(IX+px,1.15,IZ+pz);room.add(pl);
}

// Porte de sortie lumineuse
bx(2.2,3.8,0.3,0xd32f2f,IX,2.05,IZ+7.8,room);
bx(2.6,0.35,0.4,new THREE.MeshBasicMaterial({color:0x00e676}),IX,4.1,IZ+7.7,room);

const roomObs=[
  [IX-3.5,IZ-4.2,IX+1.1,IZ-2.6],
  [IX-2.4,IZ-1.8,IX+0.0,IZ-0.6],
  [IX-2.9,IZ+1.1,IX+0.5,IZ+2.1],
  [IX+4.0,IZ-6.6,IX+7.6,IZ-2.4],
  [IX-7.2,IZ+2.3,IX-4.4,IZ+4.1]
];
const roomCash=bx(0.95,0.32,0.55,0x00e676,IX-1.2,0.82,IZ-1.2,room);
const roomMed=bx(0.7,0.45,0.7,0xff1744,IX-5.8,1.35,IZ+3.2,room);

function nearDoor(){
  const a=Math.floor(P.x/CS),b=Math.floor(P.z/CS);let best=null,bd=4.2;
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){
    const c=chunks[(a+i)+','+(b+j)];
    if(c)for(const d of c.ds)if(d.x!==undefined){const k=Math.hypot(d.x-P.x,d.z-P.z);if(k<bd){bd=k;best=d;}}
  }
  return best;
}

// ===== 8 MISSIONS SCÉNARISÉES AVEC CONTACTS & CINÉMATIQUE FAÇON GTA
const STORY_MISSIONS=[
  {
    chapter:'CHAPITRE 1 · DÉBUT À YAOUNDÉ',
    title:'Le Contrat du Monument',
    speaker:'Le Patron · Caïd du Boulevard',
    contactRole:'vip',contactShirt:0xfacc15,
    cx:3*CS+22,cz:3*CS+18,
    tx:MON_X,tz:MON_Z-16,time:75,reward:500,wantedOnStart:0,
    briefing:'"Écoute bien petit. Si tu veux te faire un nom à Yaoundé, commence par livrer cette mallette au Monument de la Réunification sans abîmer la caisse."',
    objective:'Conduis jusqu’au Monument de la Réunification avant la fin du chrono.'
  },
  {
    chapter:'CHAPITRE 2 · AXE MVOG-MBI',
    title:'Livraison Sous Surveillance',
    speaker:'Karim · Chef de Gang Mvog-Mbi',
    contactRole:'gang',contactShirt:0xdc2626,
    cx:MON_X+12,cz:MON_Z-12,
    tx:2*CS+14,tz:6*CS+14,time:80,reward:750,wantedOnStart:1,
    briefing:'"Les flics contrôlent tous les grands carrefours ce soir. Prends le volant, sème les patrouilles et dépose le colis au quartier Sud-Ouest !"',
    objective:'Livre le colis à Ngoa-Ekellé malgré la patrouille de police.'
  },
  {
    chapter:'CHAPITRE 3 · NETTOYAGE',
    title:'Embûche au Carrefour',
    speaker:'Commandant Mbarga · Informateur',
    contactRole:'bir',contactShirt:0x15803d,
    cx:2*CS+20,cz:6*CS+10,
    type:'combat',count:4,tx:4*CS+14,tz:3*CS+14,time:95,reward:1100,wantedOnStart:1,
    briefing:'"Un gang rival rackette les taximen au carrefour central. Utilise ton viseur laser 🎯 pour les neutraliser proprement."',
    objective:'Élimine les 4 gangsters armés au carrefour central.'
  },
  {
    chapter:'CHAPITRE 4 · QUARTIER BASTOS',
    title:'Course Contre la Montre VIP',
    speaker:'Madame Chantal · Femme d’Affaires',
    contactRole:'mama',contactShirt:0xe91e63,
    cx:4*CS+18,cz:3*CS+18,
    tx:7*CS+16,tz:3*CS+16,time:70,reward:1300,wantedOnStart:0,
    briefing:'"J’ai une réunion diplomatique urgente à Bastos ! Fonce à travers les avenues et dépose-moi devant la résidence sécurisée."',
    objective:'Rejoins la résidence VIP de Bastos dans le temps imparti.'
  },
  {
    chapter:'CHAPITRE 5 · ALERTE ROUGE',
    title:'Évasion Haute Tension',
    speaker:'L’Ombre · Stratège',
    contactRole:'gang',contactShirt:0x7c3aed,
    cx:7*CS+12,cz:3*CS+22,
    tx:2*CS+25,tz:4*CS+25,time:85,reward:1650,wantedOnStart:2,
    briefing:'"La brigade d’intervention a repéré notre plaque ! Rejoins le garage de la station-service pour maquiller le véhicule."',
    objective:'Échappe à la police et rejoins la station-service.'
  },
  {
    chapter:'CHAPITRE 6 · LAC MUNICIPAL',
    title:'Règlement de Comptes au Lac',
    speaker:'Karim · Chef de Gang Mvog-Mbi',
    contactRole:'gang',contactShirt:0xdc2626,
    cx:2*CS+20,cz:4*CS+20,
    type:'combat',count:5,tx:6*CS+14,tz:5*CS+14,time:105,reward:2000,wantedOnStart:1,
    briefing:'"Ils nous attendent près du Lac Municipal avec des renforts. Prends un gilet pare-balles à la boutique si besoin et nettoie la zone."',
    objective:'Neutralise les 5 hommes armés près du Lac Municipal.'
  },
  {
    chapter:'CHAPITRE 7 · CONVOI EXPRÈS',
    title:'Traversée Nocturne',
    speaker:'Le Patron · Caïd du Boulevard',
    contactRole:'vip',contactShirt:0xfacc15,
    cx:6*CS+14,cz:5*CS+10,
    tx:7*CS+18,tz:7*CS+18,time:75,reward:2400,wantedOnStart:2,
    briefing:'"Dernière ligne droite vers Mvog-Mbi Est. La police a déployé des barrages : garde le pied sur l’accélérateur !"',
    objective:'Rejoins la planque de Mvog-Mbi Est.'
  },
  {
    chapter:'CHAPITRE 8 · LE GRAND COUP',
    title:'Le Braquage de Yaoundé',
    speaker:'Le Patron · Caïd du Boulevard',
    contactRole:'vip',contactShirt:0xfacc15,
    cx:7*CS+14,cz:7*CS+14,
    tx:3*CS+18,tz:3*CS+12,time:90,reward:3500,wantedOnStart:3,
    briefing:'"Les coffres sont pleins ! Toute la police de la ville est à nos trousses : ramène le butin à notre base du Centre-Ville !"',
    objective:'Ramène le butin à ta base sous alerte 3 étoiles.'
  }
];

const NPC_PROFILES=[
  {role:'taximan',name:'Moussa · Taximan Jaune (IA)',shirt:0xfacc15,skin:0x6f4e37,
   getReply:(ctx)=>{
     if(ctx.stars>0)return 'Chef, cache-toi vite ! La police a ton signalement sur tout le boulevard !';
     if(ctx.inCar&&ctx.carType==='taxi')return 'Ah mon collègue ! Le jaune brille ce soir, bonne course !';
     if(ctx.isNight)return 'La nuit à Yaoundé, allume bien tes phares et méfie-toi des carrefours.';
     return 'Bienvenue chef ! Rejoins l’anneau doré M pour parler au contact de mission.';
   }},
  {role:'benskin',name:'Kevin · Pilote Benskin (IA)',shirt:0xf97316,skin:0x5c3c24,
   getReply:(ctx)=>{
     if(ctx.hp<50)return 'Tu es blessé frère ! Va vite manger un Ndolé à la boutique bleue sur la carte.';
     if(ctx.inCar&&ctx.carType==='moto')return 'Belle moto ! Rien ne peut te bloquer dans les embouteillages avec ça.';
     return 'Touche le radar en haut à gauche pour voir toute la carte structurée de Yaoundé !';
   }},
  {role:'mama',name:'Maman Pauline · Bayam-Sellam (IA)',shirt:0xec4899,skin:0x7b5438,
   getReply:(ctx)=>{
     if(ctx.stars>=2)return 'Seigneur ! Rends-toi au commissariat ou paie un arrangement à la boutique !';
     if(ctx.isNight)return 'Mon fils, les lampadaires sont allumés, rentre prudemment ce soir.';
     return 'Que Dieu bénisse ta route mon enfant ! Les maisons avec le halo vert sont visitables.';
   }},
  {role:'student',name:'Brice · Étudiant Ngoa-Ekellé (IA)',shirt:0x3b82f6,skin:0x8d5524,
   getReply:(ctx)=>{
     if(ctx.cash>=1000)return `Tu as déjà ${ctx.cash} FCFA ! Va acheter l'AK-47 à l'armurerie !`;
     return 'Astuce : la balle part toujours exactement là où pointe le réticule central !';
   }}
];

// ===== ÉTAT DU JEU & OBJETS GPS
let S='menu',inside=0,ret={x:0,z:0},tm=0,dayTime=14.0,cars=[],peds=[],enemies=[],copsOnFoot=[],bullets=[],trs=[],stars=0,wT=0,msgT=0,dT=0,cid=0,cy=0,cp=0.36,zs=0,bubbleT=0;
let customWaypoint=null;
const P={x:3*CS+18,z:3*CS+12,h:0,vy:0,y:0,hp:100,armor:50,stamina:100,car:null,cash:500,cd:0,inv:0,wk:0,enteringCar:null,m:buildHuman(0xff4081,0x7b5438,'player')};

// Balise destination 3D
const beacon=new THREE.Group();
const bRing=new THREE.Mesh(new THREE.CylinderGeometry(2.8,2.8,0.35,24,1,true),new THREE.MeshBasicMaterial({color:0xffd54f,side:THREE.DoubleSide,transparent:true,opacity:0.88}));
bRing.position.y=0.2;beacon.add(bRing);
const bBeam=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,24,12),new THREE.MeshBasicMaterial({color:0xffd54f,transparent:true,opacity:0.22}));
bBeam.position.y=12;beacon.add(bBeam);
scene.add(beacon);

// Flèche GPS fine, élégante, couleur unique dorée, placée bien au-dessus de la tête
const gpsArrow=new THREE.Group();
const arrowHead=new THREE.Mesh(new THREE.ConeGeometry(0.16,0.42,4),new THREE.MeshBasicMaterial({color:0xffd54f}));
arrowHead.rotation.x=PI/2;arrowHead.position.z=0.22;gpsArrow.add(arrowHead);
const arrowShaft=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.05,0.32),new THREE.MeshBasicMaterial({color:0xffd54f}));
arrowShaft.position.z=-0.12;gpsArrow.add(arrowShaft);
scene.add(gpsArrow);

// État des missions : 'approach_contact' -> 'briefing' -> 'active'
let missionPhase='approach_contact',activeMission=null,missionTimeLeft=0,enemiesLeft=0,contactNPC=null,cutsceneTime=0;

function clearContactNPC(){
  if(contactNPC){scene.remove(contactNPC.m);contactNPC=null;}
}

function prepareNextMission(){
  for(const e of enemies)scene.remove(e.m);
  enemies=[];clearContactNPC();
  const m=STORY_MISSIONS[SAVE.missionIdx];
  if(m){
    activeMission=Object.assign({},m);
    missionPhase='approach_contact';
    const gy=getGroundY(m.cx,m.cz,false);
    const cm=buildHuman(m.contactShirt,0x6f4e37,m.contactRole);
    cm.position.set(m.cx,gy,m.cz);
    contactNPC={m:cm,x:m.cx,z:m.cz,y:gy,h:0};
    updateMissionCardUI();
  }else{
    // Mode libre après la fin de l'histoire
    const gx=cl((Math.floor(P.x/CS)+(R()<0.5?1:-1)*2),1,NB-2)*CS+12;
    const gz=cl((Math.floor(P.z/CS)+(R()<0.5?1:-1)*2),1,NB-2)*CS+12;
    activeMission={chapter:'MODE LIBRE',title:'Course Express Yaoundé',tx:gx,tz:gz,time:60,reward:450,objective:'Rejoins la destination indiquée par le GPS.'};
    missionTimeLeft=60;missionPhase='active';
    updateMissionCardUI();
  }
}

function triggerMissionBriefing(){
  if(!activeMission||missionPhase!=='approach_contact')return;
  missionPhase='briefing';
  S='cutscene';cutsceneTime=0;
  document.body.classList.add('cutscene');
  if(P.car){
    const c=P.car,s=Math.sin(c.h),k=Math.cos(c.h);
    P.x=c.x-k*2.8;P.z=c.z+s*2.8;hitBuilding(P,0.6);
    P.car=null;c.v=0;c.kind='me';P.m.visible=true;updateWeaponHUD();updateControlUI();
  }
  if(contactNPC){
    P.h=Math.atan2(contactNPC.x-P.x,contactNPC.z-P.z);
    contactNPC.h=Math.atan2(P.x-contactNPC.x,P.z-contactNPC.z);
  }
  $('brief-chapter').textContent=activeMission.chapter;
  $('brief-reward').textContent=`💰 +${activeMission.reward} FCFA`;
  $('brief-title').textContent=activeMission.title;
  $('brief-speaker').textContent=`🗣️ ${activeMission.speaker}`;
  $('brief-text').textContent=activeMission.briefing;
  $('brief-obj').textContent=`🎯 ${activeMission.objective}`;
  $('briefing-modal').style.display='flex';
  playTone(540,0.2,'sine');
}

function acceptBriefingMission(){
  $('briefing-modal').style.display='none';
  document.body.classList.remove('cutscene');
  S='play';
  missionPhase='active';
  missionTimeLeft=activeMission.time;
  clearContactNPC();
  if(activeMission.wantedOnStart)addCrime(activeMission.wantedOnStart);
  if(activeMission.type==='combat'){
    enemiesLeft=activeMission.count;
    for(let k=0;k<activeMission.count;k++){
      const ex=activeMission.tx+rn(-10,10),ez=activeMission.tz+rn(-10,10);
      const em=buildHuman(0x18181b,0x6f4e37,'bir');em.userData.gun.visible=true;
      enemies.push({m:em,x:ex,z:ez,h:0,hp:55,cd:rn(0.5,1.5),wk:0});
    }
  }
  updateMissionCardUI();
  showToast(`🎬 Mission lancée : ${activeMission.title}`);
  playTone(720,0.25,'sine');
}

function declineBriefingMission(){
  $('briefing-modal').style.display='none';
  document.body.classList.remove('cutscene');
  S='play';
  missionPhase='approach_contact';
  // Éloigne légèrement le joueur pour ne pas redéclencher immédiatement
  P.x-=Math.sin(P.h)*4.5;P.z-=Math.cos(P.h)*4.5;
}

$('btn-accept-mission').onclick=acceptBriefingMission;
$('btn-decline-mission').onclick=declineBriefingMission;

function getActiveTarget(){
  if(customWaypoint)return{tx:customWaypoint.x,tz:customWaypoint.z,isCustom:true};
  if(!activeMission)return null;
  if(missionPhase==='approach_contact')return{tx:activeMission.cx,tz:activeMission.cz,isCustom:false,isContact:true};
  return{tx:activeMission.tx,tz:activeMission.tz,isCustom:false,isContact:false};
}

function updateMissionCardUI(){
  if(!activeMission)return;
  const isContact=missionPhase==='approach_contact';
  $('mc-badge').textContent=isContact?'CONTACT MISSION (M)':activeMission.chapter;
  $('mc-timer').textContent=isContact?'EN ATTENTE':`⏱ ${Math.max(0,Math.ceil(missionTimeLeft))}s`;
  $('mc-title').textContent=activeMission.title;
  $('mc-desc').textContent=isContact?`Rejoins ${activeMission.speaker} au point doré M.`:activeMission.objective;
  $('mc-reward').textContent=`💰 +${activeMission.reward} FCFA`;
}

function showToast(txt){const el=$('toast');el.textContent=txt;el.classList.add('show');msgT=3.2;}
function showNpcBubble(name,txt,dur=4.5){$('npc-name').textContent=name;$('npc-text').textContent=txt;$('npc-bubble').style.display='block';bubbleT=dur;}

function updateControlUI(){
  $('speedo').style.display=P.car?'block':'none';
  if(!touch)return;
  $('controls-foot').style.display=P.car?'none':'block';
  $('controls-car').style.display=P.car?'block':'none';
}

// ===== GRANDE CARTE STRUCTURÉE DE YAOUNDÉ
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
  const dist=Math.round(Math.hypot(customWaypoint.x-P.x,customWaypoint.z-P.z));
  $('map-cursor-info').textContent=`📍 Repère GPS actif · Distance : ${dist} mètres`;
  playTone(680,0.15,'sine');
  drawBigMap();
  showToast(`📍 Repère GPS placé (${dist}m)`);
});

function drawBigMap(){
  const cv=$('big-map'),ctx=cv.getContext('2d'),W=cv.width,H=cv.height,S2=W/WS;
  ctx.fillStyle='#0b1220';ctx.fillRect(0,0,W,H);

  // Zones territoriales & quartiers colorés de Yaoundé
  const zones=[
    {x:0,z:0,w:4*CS,h:4*CS,col:'rgba(30,58,138,0.28)',name:'QUARTIER TSINGA'},
    {x:4*CS,z:0,w:6*CS,h:4*CS,col:'rgba(6,95,70,0.28)',name:'QUARTIER BASTOS'},
    {x:0,z:4*CS,w:4*CS,h:6*CS,col:'rgba(120,53,15,0.26)',name:'NGOA-EKELLÉ · UNIVERSITÉ'},
    {x:4*CS,z:4*CS,w:6*CS,h:6*CS,col:'rgba(88,28,135,0.24)',name:'MVOG-MBI · CENTRE SUD'}
  ];
  for(const z of zones){
    ctx.fillStyle=z.col;
    ctx.fillRect(z.x*S2,z.z*S2,z.w*S2,z.h*S2);
  }

  // Blocs urbains
  ctx.fillStyle='#162136';
  for(let cx=0;cx<NB;cx++)for(let cz=0;cz<NB;cz++){
    ctx.fillRect(cx*CS*S2+4,cz*CS*S2+4,CS*S2-8,CS*S2-8);
  }

  // Lac Municipal & Fleuve Mfoundi
  ctx.fillStyle='#0284c7';
  ctx.beginPath();ctx.arc(LAKE_X*S2,LAKE_Z*S2,24*S2,0,PI*2);ctx.fill();
  ctx.strokeStyle='#0284c7';ctx.lineWidth=7;
  ctx.beginPath();ctx.moveTo(LAKE_X*S2,0);ctx.lineTo(LAKE_X*S2,H);ctx.stroke();

  // Parc Bois Sainte-Anastasie
  ctx.fillStyle='#15803d';
  ctx.fillRect((3*CS+12)*S2,(4*CS+12)*S2,56*S2,56*S2);

  // Réseau routier structuré (Avenues principales & rues secondaires)
  for(let i=0;i<=NB;i++){
    const p=i*CS*S2;
    const isMain=(i===3||i===4||i===7);
    ctx.strokeStyle=isMain?'#94a3b8':'#475569';
    ctx.lineWidth=isMain?6.5:3.5;
    ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,H);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,p);ctx.lineTo(W,p);ctx.stroke();
  }

  // Noms officiels des quartiers, avenues et lieux stratégiques
  ctx.textAlign='center';
  for(const z of zones){
    ctx.fillStyle='rgba(255,255,255,0.22)';ctx.font='900 12px sans-serif';
    ctx.fillText(z.name,(z.x+z.w/2)*S2,(z.z+z.h/2)*S2);
  }
  ctx.fillStyle='#f8fafc';ctx.font='bold 10px sans-serif';
  ctx.fillText('BOULEVARD DU 20 MAI',2.2*CS*S2,3*CS*S2-6);
  ctx.fillText('AVENUE KENNEDY',5.5*CS*S2,4*CS*S2-6);
  ctx.fillText('🏛️ MONUMENT RÉUNIFICATION',MON_X*S2,MON_Z*S2-11);
  ctx.fillText('💧 LAC MUNICIPAL',LAKE_X*S2,LAKE_Z*S2+24);
  ctx.fillText('🌳 BOIS STE-ANASTASIE',(3.5*CS)*S2,(4.5*CS)*S2);

  // Maisons visitables autour du joueur
  ctx.fillStyle='#2dd4bf';
  for(const d of enterableDoors){
    ctx.fillRect(d.x*S2-3,d.z*S2-3,6,6);
  }

  // Boutique & Station-Service
  ctx.fillStyle='#38bdf8';ctx.beginPath();ctx.arc(SHOP_X*S2,SHOP_Z*S2,6.5,0,PI*2);ctx.fill();
  ctx.fillStyle='#fb923c';ctx.beginPath();ctx.arc(GAS_X*S2,GAS_Z*S2,6.5,0,PI*2);ctx.fill();

  // Police
  for(const c of cars)if(c.kind==='cop'){
    ctx.fillStyle='#2979ff';ctx.beginPath();ctx.arc(c.x*S2,c.z*S2,5,0,PI*2);ctx.fill();
  }

  // Traçabilité GPS
  const tgt=getActiveTarget();
  if(tgt){
    ctx.save();
    ctx.strokeStyle=tgt.isCustom?'#00e676':'#ffd54f';
    ctx.lineWidth=3.5;ctx.setLineDash([8,5]);
    ctx.beginPath();ctx.moveTo(P.x*S2,P.z*S2);ctx.lineTo(tgt.tx*S2,tgt.tz*S2);ctx.stroke();
    ctx.restore();

    ctx.fillStyle=tgt.isCustom?'#00e676':'#ffd54f';
    ctx.beginPath();ctx.arc(tgt.tx*S2,tgt.tz*S2,8.5,0,PI*2);ctx.fill();
    ctx.fillStyle='#000';ctx.font='900 10px sans-serif';
    ctx.fillText(tgt.isCustom?'GPS':tgt.isContact?'M':'★',tgt.tx*S2,tgt.tz*S2+3.5);
  }

  // Position du joueur
  ctx.save();
  ctx.translate(P.x*S2,P.z*S2);
  ctx.rotate(-cy);
  ctx.fillStyle='rgba(255,64,129,0.3)';
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-15,26);ctx.lineTo(15,26);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ff4081';ctx.beginPath();ctx.arc(0,0,6.5,0,PI*2);ctx.fill();
  ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
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

// ===== ENTRÉES CLAVIER & TACTILE
const KB={},B={fire:0,aim:0,run:0,gas:0,brake:0},jv={m:0,x:0,y:0};
let runTapTime=0;

addEventListener('keydown',e=>{
  KB[e.code]=1;
  if(e.code==='KeyE'||e.code==='Enter'){if(S==='cutscene')acceptBriefingMission();else doSmartAction();}
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
  showToast('📻 '+RADIOS[radioIdx].name);
}
function doJump(){
  if(!P.car&&P.y<=0.01&&S==='play'&&!P.enteringCar){P.vy=6.8;playTone(300,0.12,'sine',0.03,450);}
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

// ===== VÉHICULES, PILOTES DE MOTOS, COLLISIONS SOLIDES & CARJACKING ANIMÉ
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
  const m=buildVehicle(col,vType);
  // Ajouter un vrai pilote assis sur les motos en circulation !
  let riderMesh=null;
  if(vType==='moto'&&kind!=='me'){
    riderMesh=buildHuman(0xf97316,0x6f4e37,'benskin');
    riderMesh.position.set(0,0.42,-0.18);
    riderMesh.userData.legL.rotation.x=-0.85;
    riderMesh.userData.legR.rotation.x=-0.85;
    riderMesh.userData.armL.rotation.x=-1.05;
    riderMesh.userData.armR.rotation.x=-1.05;
    m.add(riderMesh);
  }
  const c={
    m,x,z,h:HD[d],v:0,d,kind,vType,hasDriver:(kind!=='me'),riderMesh,
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

// Collision physique stricte : empêche totalement de traverser les voitures !
function resolvePersonCarCollisions(person,rad=0.68,ignoreCar=null){
  for(const c of cars){
    if(c===P.car||c===ignoreCar)continue;
    const dx=person.x-c.x,dz=person.z-c.z;
    const ch=Math.cos(-c.h),sh=Math.sin(-c.h);
    const lx=dx*ch-dz*sh;
    const lz=dx*sh+dz*ch;
    const hw=(c.vType==='moto'?0.62:1.26)+rad;
    const hl=(c.vType==='moto'?1.22:2.52)+rad;
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

// Animation d'ouverture de porte & extraction du conducteur (Carjacking)
function startEnterCarAnimation(c){
  if(P.enteringCar||P.car)return;
  c.v=0;
  P.enteringCar={car:c,phase:'walk',timer:0,pulled:false};
}

function updateEnterCarAnimation(dt){
  const ec=P.enteringCar;
  if(!ec)return;
  const c=ec.car;
  if(!c||c.dead){P.enteringCar=null;return;}
  c.v=0;
  // Position de la poignée conducteur (côté gauche du véhicule)
  const doorOffset=c.vType==='moto'?-1.1:-1.62;
  const tx=c.x+Math.cos(c.h)*doorOffset;
  const tz=c.z-Math.sin(c.h)*doorOffset;

  if(ec.phase==='walk'){
    const dx=tx-P.x,dz=tz-P.z,dist=Math.hypot(dx,dz);
    P.h=Math.atan2(dx,dz);
    if(dist>0.35){
      const step=Math.min(dist,6.5*dt);
      P.x+=(dx/dist)*step;P.z+=(dz/dist)*step;
      P.wk+=dt*13;
      resolvePersonCarCollisions(P,0.62,c);
    }else{
      ec.phase='open';ec.timer=0;
      P.h=c.h+PI/2;
    }
  }else if(ec.phase==='open'){
    ec.timer+=dt;
    // Ouverture fluide de la portière conducteur
    if(c.m.userData.doorL){
      c.m.userData.doorL.rotation.y=-Math.min(1.15,ec.timer*3.6);
    }
    // Extraction du conducteur PNJ hors du véhicule !
    if(c.hasDriver&&!ec.pulled&&ec.timer>0.18){
      ec.pulled=true;c.hasDriver=false;
      if(c.riderMesh){c.m.remove(c.riderMesh);c.riderMesh=null;}
      const prof=c.kind==='cop'?{role:'cop',name:'Agent Police',shirt:0x1e3a8a,skin:0x6f4e37,getReply:()=>'Halte ! Vol de véhicule !'}:NPC_PROFILES[0];
      const dm=buildHuman(prof.shirt,prof.skin,prof.role);
      const ex=tx-Math.cos(c.h)*0.9,ez=tz+Math.sin(c.h)*0.9;
      peds.push({m:dm,x:ex,z:ez,h:c.h-PI/2,t:5,fl:6,dead:0,wk:0,hp:35,profile:prof,chatCd:5});
      addCrime(c.kind==='cop'?2:1);
      playTone(240,0.18,'sawtooth');
      showToast(c.vType==='moto'?'🏍️ Pilote délogé ! Moto prise !':'🚗 Conducteur extrait du véhicule !');
    }
    if(ec.timer>=0.52){
      ec.phase='board';ec.timer=0;
    }
  }else if(ec.phase==='board'){
    ec.timer+=dt;
    P.x+=(c.x-P.x)*Math.min(1,dt*10);
    P.z+=(c.z-P.z)*Math.min(1,dt*10);
    if(c.m.userData.doorL){
      c.m.userData.doorL.rotation.y=-Math.max(0,1.15*(1-ec.timer*4));
    }
    if(ec.timer>=0.28){
      if(c.m.userData.doorL)c.m.userData.doorL.rotation.y=0;
      c.kind='me';c.revLock=0;
      P.car=c;P.m.visible=false;P.enteringCar=null;
      updateControlUI();playHorn();
    }
  }
}

function deployCopsFromCar(c){
  if(c.deployed||copsOnFoot.length>=6)return;
  c.deployed=1;c.hasDriver=false;
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
function findNearestCar(maxD=5.8){
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
  p.dead=1;p.t=0;p.m.rotation.x=-PI/2;
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
  if(S!=='play'||P.enteringCar)return;
  if(inside){
    if(Math.hypot(P.x-IX,P.z-(IZ+7))<4.8){inside=0;P.x=ret.x;P.z=ret.z;streamChunks(1,P.x,P.z);}
    return;
  }
  if(P.car){
    const c=P.car,s=Math.sin(c.h),k=Math.cos(c.h);
    P.x=c.x-k*2.8;P.z=c.z+s*2.8;hitBuilding(P,0.6);
    P.car=null;c.v=0;c.kind='me';c.hasDriver=false;P.m.visible=true;updateWeaponHUD();updateControlUI();return;
  }
  if(Math.hypot(P.x-SHOP_X,P.z-SHOP_Z)<4.8){openShop();return;}
  const bestCar=findNearestCar(5.8);
  if(bestCar){
    startEnterCarAnimation(bestCar);
    return;
  }
  const d=nearDoor();
  if(d){
    inside=1;ret={x:d.x,z:d.z+1.6};P.x=IX;P.z=IZ+5.5;P.h=PI;cy=PI;
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

// ===== SYSTÈME DE VISÉE RAYCAST 3D EXACT SUR LE VISEUR CENTRAL
const raycaster=new THREE.Raycaster();
const crosshairNDC=new THREE.Vector2(0,0.08); // Correspond exactement à left:50%, top:46%

function getCrosshairAimData(){
  raycaster.setFromCamera(crosshairNDC,cam);
  const ro=raycaster.ray.origin,rd=raycaster.ray.direction;

  // Point par défaut loin devant le réticule (à 75m)
  let bestDist=75;
  let targetObj=null;

  // Vérifier intersection avec les murs des bâtiments
  if(!inside){
    const hLen=Math.hypot(rd.x,rd.z);
    if(hLen>0.01){
      const wDist=rayWall(ro.x,ro.z,rd.x/hLen,rd.z/hLen,bestDist*hLen)/hLen;
      if(wDist<bestDist)bestDist=wDist;
    }
  }

  // Vérifier intersection précise avec les voitures, policiers, ennemis et PNJ
  const candidates=cars.filter(c=>c!==P.car)
    .concat(inside?[]:enemies.filter(e=>!e.dead))
    .concat(inside?[]:copsOnFoot)
    .concat(inside?[]:peds.filter(p=>!p.dead));

  for(const obj of candidates){
    const gy=getGroundY(obj.x,obj.z,inside);
    const center=new THREE.Vector3(obj.x,gy+(obj.vType!==undefined?0.95:1.15),obj.z);
    const radius=obj.vType!==undefined?(obj.vType==='moto'?1.15:2.25):0.85;
    const toCenter=center.clone().sub(ro);
    const tProj=toCenter.dot(rd);
    if(tProj>1.5&&tProj<bestDist){
      const closestPt=ro.clone().addScaledVector(rd,tProj);
      if(closestPt.distanceTo(center)<=radius){
        bestDist=tProj;
        targetObj=obj;
      }
    }
  }

  const hitPoint=ro.clone().addScaledVector(rd,bestDist);
  return{hitPoint,targetObj};
}

function spawnBullet(ox,oy,oz,dirVec,speed,dmg,fromPlayer,col=0xfef08a){
  const g=new THREE.Group();
  const slug=new THREE.Mesh(new THREE.SphereGeometry(0.065,6,6),new THREE.MeshBasicMaterial({color:0xffffff}));
  const trail=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.005,1.3,6),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.88}));
  trail.rotation.x=PI/2;trail.position.z=-0.65;
  g.add(slug,trail);
  g.position.set(ox,oy,oz);
  g.lookAt(ox+dirVec.x,oy+dirVec.y,oz+dirVec.z);
  scene.add(g);
  bullets.push({
    m:g,x:ox,y:oy,z:oz,
    vx:dirVec.x*speed,
    vy:dirVec.y*speed,
    vz:dirVec.z*speed,
    life:0.85,fromPlayer,dmg
  });
}

function fireWeapon(aimData){
  const wep=SAVE.curWeapon;
  if(P.cd>0)return;
  P.cd=wep==='smg'?0.095:wep==='rifle'?0.15:0.25;
  const dmg=wep==='rifle'?45:wep==='smg'?19:32;
  const spd=wep==='rifle'?160:135;

  const hp=aimData.hitPoint;
  const aimYaw=Math.atan2(hp.x-P.x,hp.z-P.z);
  // Le personnage se retourne toujours exactement vers le point ciblé par le viseur !
  if(!P.car)P.h=aimYaw;

  const gy=getGroundY(P.x,P.z,inside);
  const muzzleX=P.x+Math.sin(aimYaw)*0.85+Math.cos(aimYaw)*0.25;
  const muzzleZ=P.z+Math.cos(aimYaw)*0.85-Math.sin(aimYaw)*0.25;
  const muzzleY=gy+(P.car?1.35:1.45)+P.y;

  const dirVec=new THREE.Vector3(hp.x-muzzleX,hp.y-muzzleY,hp.z-muzzleZ).normalize();

  const flash=new THREE.Mesh(new THREE.SphereGeometry(0.18,6,6),new THREE.MeshBasicMaterial({color:0xffab00}));
  flash.position.set(muzzleX,muzzleY,muzzleZ);scene.add(flash);
  trs.push({m:flash,t:0.045});

  const col=wep==='rifle'?0xff5252:wep==='smg'?0xffab40:0xfef08a;
  spawnBullet(muzzleX,muzzleY,muzzleZ,dirVec,spd,dmg,true,col);
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

    if(!inside&&rayWall(b.x,b.z,fx,fz,stepDist)<stepDist){
      const sp=bx(0.2,0.2,0.2,0xfef08a,b.x,b.y,b.z);trs.push({m:sp,t:0.08});
      b.dead=1;scene.remove(b.m);continue;
    }

    b.x+=stepX;b.y+=stepY;b.z+=stepZ;
    b.m.position.set(b.x,b.y,b.z);
    if(b.y<=0.02){b.dead=1;scene.remove(b.m);continue;}

    if(b.fromPlayer){
      let hit=null;
      for(const c of cars){
        if(c===P.car)continue;
        const gy=getGroundY(c.x,c.z,false);
        if(Math.hypot(c.x-b.x,c.z-b.z)<(c.vType==='moto'?1.2:2.2)&&Math.abs(b.y-(gy+1.0))<1.3){hit=c;break;}
      }
      if(!hit&&!inside){
        for(const t of enemies.concat(copsOnFoot).concat(peds.filter(p=>!p.dead))){
          if(t.dead)continue;
          const gy=getGroundY(t.x,t.z,false);
          if(Math.hypot(t.x-b.x,t.z-b.z)<0.95&&Math.abs(b.y-(gy+1.1))<1.2){hit=t;break;}
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
      const gy=getGroundY(P.x,P.z,inside);
      if(P.car&&Math.hypot(P.car.x-b.x,P.car.z-b.z)<2.2){
        P.car.hp-=b.dmg;b.dead=1;scene.remove(b.m);
      }else if(!P.car&&Math.hypot(P.x-b.x,P.z-b.z)<0.95&&Math.abs(b.y-(gy+P.y+1.1))<1.2){
        damagePlayer(b.dmg);b.dead=1;scene.remove(b.m);
      }
    }
  }
  bullets=bullets.filter(b=>!b.dead);
}

// ===== CONDUITE & MARCHE ARRIÈRE FLUIDE
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

  // Inclinaison réaliste de la moto dans les virages
  if(c.vType==='moto'){
    c.m.rotation.z+=(-steerInput*0.32*turnFactor-c.m.rotation.z)*Math.min(1,dt*10);
  }

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
  if(c.kind==='me'||!c.hasDriver)c.v-=c.v*Math.min(1,2*dt);
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
  const isAiming=pl&&!P.car&&!P.enteringCar&&!!i.aim;

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
    for(const c of cars)if(c.kind!=='me'&&c!==P.car&&(!P.enteringCar||P.enteringCar.car!==c)&&Math.hypot(c.x-P.x,c.z-P.z)>205){scene.remove(c.m);c.dead=1;}
    for(const p of peds)if(Math.hypot(p.x-P.x,p.z-P.z)>180){scene.remove(p.m);p.rm=1;}
    cars=cars.filter(c=>!c.dead);peds=peds.filter(p=>!p.rm);
  }

  // Animation cinématique de dialogue façon GTA
  if(S==='cutscene'&&contactNPC){
    cutsceneTime+=dt;
    swingLimbs(P.m,cutsceneTime*2.5,0.08,false);
    swingLimbs(contactNPC.m,cutsceneTime*4.2,0.22,false);
  }

  if(pl){
    P.cd=Math.max(0,P.cd-dt);P.inv=Math.max(0,P.inv-dt);
    if(P.y>0||P.vy>0){P.y+=P.vy*dt;P.vy-=18*dt;if(P.y<=0){P.y=0;P.vy=0;}}

    // Raycast exact du viseur central
    const aimData=getCrosshairAimData();
    P.m.userData.laser.visible=isAiming;
    const chEl=$('crosshair');
    chEl.classList.toggle('aiming',isAiming);
    chEl.classList.toggle('locked',!!aimData.targetObj);

    if(P.enteringCar){
      updateEnterCarAnimation(dt);
    }else if(P.car){
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

      if(isAiming){
        const aimYaw=Math.atan2(aimData.hitPoint.x-P.x,aimData.hitPoint.z-P.z);
        P.h-=angd(P.h,aimYaw)*Math.min(1,dt*22);
      }

      if(m>0.05){
        const fwdX=Math.sin(cy),fwdZ=Math.cos(cy);
        const rgtX=-Math.cos(cy),rgtZ=Math.sin(cy);
        const wx=fwdX*(-i.y)+rgtX*i.x;
        const wz=fwdZ*(-i.y)+rgtZ*i.x;
        const th=Math.atan2(wx,wz);
        const sp=(isAiming?3.4:sprinting?10.4:5.3)*Math.min(1,m);
        if(!isAiming&&!i.fire)P.h-=angd(P.h,th)*Math.min(1,dt*14);
        P.x+=Math.sin(th)*sp*dt;P.z+=Math.cos(th)*sp*dt;
        P.wk+=dt*sp*1.9;
      }
      if(inside){
        P.x=cl(P.x,IX-8.2,IX+8.2);P.z=cl(P.z,IZ-7.2,IZ+7.2);
        for(const q of roomObs){
          const x=cl(P.x,q[0],q[2]),z=cl(P.z,q[1],q[3]),dx=P.x-x,dz=P.z-z,d2=dx*dx+dz*dz;
          if(d2<0.36){const d=Math.sqrt(d2)||0.01;P.x+=dx/d*(0.6-d);P.z+=dz/d*(0.6-d);}
        }
        if(roomCash.visible&&Math.hypot(P.x-roomCash.position.x,P.z-roomCash.position.z)<2.1){
          roomCash.visible=false;P.cash+=150;writeSave();showToast('+150 FCFA trouvés dans la villa !');playTone(840,0.22,'sine');
        }
        if(roomMed.visible&&Math.hypot(P.x-roomMed.position.x,P.z-roomMed.position.z)<2.1){
          roomMed.visible=false;P.hp=Math.min(100,P.hp+50);writeSave();showToast('+50 Santé !');playTone(620,0.25,'sine');
        }
      }else{
        hitBuilding(P,0.62);
        resolvePersonCarCollisions(P,0.68);
      }
    }

    if(i.fire&&!P.enteringCar)fireWeapon(aimData);
    updateBullets(dt);

    // Balise 3D & Flèche GPS fine au-dessus de la tête
    const tgt=getActiveTarget();
    beacon.visible=!inside&&!!tgt;
    bRing.rotation.y+=dt*2.4;
    if(tgt){
      const bGy=getGroundY(tgt.tx,tgt.tz,false);
      beacon.position.set(tgt.tx,bGy,tgt.tz);
      bRing.material.color.setHex(tgt.isCustom?0x00e676:0xffd54f);
      bBeam.material.color.setHex(tgt.isCustom?0x00e676:0xffd54f);

      const pGy=getGroundY(P.x,P.z,inside);
      gpsArrow.visible=!inside;
      gpsArrow.position.set(P.x,pGy+(P.car?3.1:3.25+P.y)+Math.sin(tm*4)*0.08,P.z);
      gpsArrow.rotation.y=Math.atan2(tgt.tx-P.x,tgt.tz-P.z);
    }else gpsArrow.visible=false;

    if(customWaypoint&&Math.hypot(P.x-customWaypoint.x,P.z-customWaypoint.z)<6){
      customWaypoint=null;showToast('📍 Tu es arrivé à ton repère GPS !');playTone(760,0.2,'sine');
    }

    // Progression des missions & déclenchement cinématique au contact
    if(!inside&&activeMission){
      if(missionPhase==='approach_contact'){
        const distC=Math.hypot(P.x-activeMission.cx,P.z-activeMission.cz);
        $('mc-dist').textContent=`📍 Contact à ${Math.round(distC)} m`;
        if(distC<4.2)triggerMissionBriefing();
      }else if(missionPhase==='active'){
        missionTimeLeft-=dt;
        const dist=Math.hypot(P.x-activeMission.tx,P.z-activeMission.tz);
        $('mc-timer').textContent=`⏱ ${Math.max(0,Math.ceil(missionTimeLeft))}s`;
        $('mc-dist').textContent=activeMission.type==='combat'?`🎯 Restants : ${Math.max(0,enemiesLeft)}`:`📍 Objectif à ${Math.round(dist)} m`;
        if(missionTimeLeft<=0){showToast('⏰ Temps écoulé ! Retourne voir le contact.');prepareNextMission();}
        else if(activeMission.type==='combat'){
          if(enemiesLeft<=0){
            P.cash+=activeMission.reward;SAVE.missionIdx++;writeSave();
            showToast(`🏆 Mission accomplie ! +${activeMission.reward} FCFA`);playTone(880,0.4,'sine',0.07);prepareNextMission();
          }
        }else if(dist<5.5){
          P.cash+=activeMission.reward;if(SAVE.missionIdx<STORY_MISSIONS.length)SAVE.missionIdx++;writeSave();
          showToast(`🏆 Objectif atteint ! +${activeMission.reward} FCFA`);playTone(880,0.4,'sine',0.07);prepareNextMission();
        }
      }
    }

    if(!inside){
      for(const c of cars)if(c!==P.car&&!P.car&&!P.enteringCar&&Math.abs(c.v)>7&&Math.hypot(c.x-P.x,c.z-P.z)<2.3)damagePlayer(Math.abs(c.v)*1.1);
      if(stars>0){
        wT-=dt*(cars.some(c=>c.kind==='cop'&&Math.hypot(c.x-P.x,c.z-P.z)<48)||copsOnFoot.length>0?1:2.4);
        if(wT<=0){stars--;wT=12;if(stars===0)clearCopsOnFoot();}
      }else P.hp=Math.min(100,P.hp+0.9*dt);
    }

    if(P.hp<=0){
      S='dead';dT=3;P.enteringCar=null;if(P.car){P.car.kind='me';P.car=null;updateControlUI();}
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
      if(c!==P.car&&(!P.enteringCar||P.enteringCar.car!==c))updateAICar(c,dt);
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
      if(d<4.4&&d>0.01){
        const nx=(p.x-q.x)/d,nz=(p.z-q.z)/d,o=(4.4-d)*0.52,dv=Math.abs(p.v-q.v);
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
        hitBuilding(cp,0.62);resolvePersonCarCollisions(cp,0.65);
      }
      cp.cd-=dt;
      if(d<40&&cp.cd<=0&&S==='play'){
        cp.cd=cp.isBir?0.95:1.35;
        const fx=(P.x-cp.x)/d,fz=(P.z-cp.z)/d;
        if(rayWall(cp.x,cp.z,fx,fz,d)>=d-0.6){
          const gy=getGroundY(cp.x,cp.z,false);
          const dirV=new THREE.Vector3(P.x-cp.x,0,P.z-cp.z).normalize();
          spawnBullet(cp.x+fx*0.8,gy+1.35,cp.z+fz*0.8,dirV,95,cp.isBir?11:8,false,0xff1744);
          playGunshot('pistol');
        }
      }
      const cGy=getGroundY(cp.x,cp.z,false);
      cp.m.position.set(cp.x,cGy,cp.z);cp.m.rotation.y=cp.h;swingLimbs(cp.m,cp.wk,0.45,true);
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
      if(hitBuilding(p,0.62))p.h+=PI*rn(0.6,1.4);
      resolvePersonCarCollisions(p,0.65);
      for(const c of cars)if(Math.abs(c.v)>7&&Math.hypot(c.x-p.x,c.z-p.z)<2.2){killPed(p);break;}
    }
    peds=peds.filter(p=>!p.rm);

    for(const e of enemies){
      if(e.dead)continue;
      const d=Math.hypot(P.x-e.x,P.z-e.z);
      e.h=Math.atan2(P.x-e.x,P.z-e.z);
      if(d>12&&d<45){e.x+=Math.sin(e.h)*3.6*dt;e.z+=Math.cos(e.h)*3.6*dt;e.wk+=dt*7.5;hitBuilding(e,0.62);resolvePersonCarCollisions(e,0.65);}
      e.cd-=dt;
      if(d<38&&e.cd<=0&&S==='play'){
        e.cd=1.4;
        const fx=(P.x-e.x)/d,fz=(P.z-e.z)/d;
        if(rayWall(e.x,e.z,fx,fz,d)>=d-0.6){
          const gy=getGroundY(e.x,e.z,false);
          const dirV=new THREE.Vector3(P.x-e.x,0,P.z-e.z).normalize();
          spawnBullet(e.x+fx*0.8,gy+1.35,e.z+fz*0.8,dirV,95,10,false,0xff3d00);
          playGunshot('pistol');
        }
      }
      const eGy=getGroundY(e.x,e.z,false);
      e.m.position.set(e.x,eGy,e.z);e.m.rotation.y=e.h;swingLimbs(e.m,e.wk,0.45,false);
    }
  }

  // Positionnement vertical exact sur le trottoir / route / intérieur pour toutes les entités
  for(const p of peds){
    const gy=getGroundY(p.x,p.z,false);
    p.m.position.set(p.x,p.dead?gy+0.35:gy,p.z);
    if(!p.dead){p.m.rotation.y=p.h;swingLimbs(p.m,p.wk,0.45,p.fl>0);}
  }
  for(const c of cars){
    const gy=getGroundY(c.x,c.z,false);
    c.m.position.set(c.x,gy,c.z);c.m.rotation.y=c.h;
  }
  if(contactNPC){
    contactNPC.m.position.set(contactNPC.x,contactNPC.y,contactNPC.z);
    contactNPC.m.rotation.y=contactNPC.h;
  }
  const playerGy=getGroundY(P.x,P.z,inside);
  P.m.position.set(P.x,playerGy+P.y,P.z);
  P.m.rotation.y=P.h;
  if(S!=='cutscene'){
    const isMoving=!P.car&&(Math.hypot(i.x,i.y)>0.05||!!P.enteringCar);
    swingLimbs(P.m,P.wk,isMoving?0.48:0.04,i.run&&!isAiming);
  }
  for(const t of trs){t.t-=dt;if(t.gr)t.m.scale.setScalar(1+(0.55-t.t)*5);if(t.t<=0){scene.remove(t.m);t.d=1;}}
  trs=trs.filter(t=>!t.d);

  // ===== CAMÉRA (CINÉMATIQUE BRIEFING, ZOOM ÉPAULE EN VISÉE, OU CONDUITE)
  if(S==='cutscene'&&contactNPC){
    const midX=(P.x+contactNPC.x)*0.5,midZ=(P.z+contactNPC.z)*0.5;
    const ang=Math.atan2(contactNPC.x-P.x,contactNPC.z-P.z)+PI/2;
    cam.fov+=(50-cam.fov)*Math.min(1,dt*6);
    cam.updateProjectionMatrix();
    cam.position.set(midX+Math.sin(ang)*3.8,playerGy+1.85,midZ+Math.cos(ang)*3.8);
    cam.lookAt(midX,playerGy+1.45,midZ);
  }else{
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
    const shoulder=isAiming?0.65:0;
    const sx=-Math.cos(cy)*shoulder,sz=Math.sin(cy)*shoulder;
    let cx=P.x+sx+dirX*safeD,cz=P.z+sz+dirZ*safeD,ch=(isAiming?1.68:1.8)+playerGy+P.y+safeD*Math.sin(cp);
    if(inside){cx=cl(cx,IX-8.4,IX+8.4);cz=cl(cz,IZ-7.4,IZ+7.4);ch=Math.min(ch,4.6);}
    cam.position.set(cx,ch,cz);
    cam.lookAt(P.x+sx+Math.sin(cy)*6,P.car?playerGy+1.2:playerGy+1.58+P.y,P.z+sz+Math.cos(cy)*6);
  }

  // ===== HUD & RADAR
  $('hp-bar').style.width=cl(P.hp,0,100)+'%';
  $('ar-bar').style.width=cl(P.armor,0,100)+'%';
  $('st-bar').style.width=cl(P.stamina,0,100)+'%';
  $('stars').textContent='★'.repeat(stars)+'☆'.repeat(5-stars);
  $('wanted-box').classList.toggle('active',stars>0);
  $('wanted-label').textContent=stars>0?`ALERTE NIVEAU ${stars}`:'ZONE CALME';
  $('cash').textContent=P.cash+' FCFA';
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
  $('zone-tag').textContent=inside?'🏠 INTÉRIEUR VILLA':distMon<55?'🏛️ MONUMENT RÉUNIFICATION':distShop<25?'🛒 ARMURERIE & SHOP':distGas<25?'⛽ STATION-SERVICE':P.z>4*CS&&P.x<4*CS?'🎓 NGOA-EKELLÉ':P.x>=4*CS&&P.z<4*CS?'🌴 QUARTIER BASTOS':P.x>=4*CS&&P.z>=4*CS?'🏙️ MVOG-MBI':'📍 TSINGA · BD 20 MAI';

  if(msgT>0){msgT-=dt;if(msgT<=0)$('toast').classList.remove('show');}
  if(bubbleT>0){bubbleT-=dt;if(bubbleT<=0)$('npc-bubble').style.display='none';}

  const ab=document.querySelector('#controls-foot .t-act');
  if(ab){
    const ic=inside?'🚪':distShop<4.8?'🛒':findNearestCar(5.8)?'🚗':nearDoor()?'🏠':findNearestNPC(6.0)?'💬':'🚗';
    if(ab.textContent!==ic)ab.textContent=ic;
  }
  drawRadar();
}

// ===== RADAR SYNCHRONISÉ
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

    // Maisons visitables proches
    rCtx.fillStyle='#2dd4bf';
    for(const d of enterableDoors){
      const pd=worldToRadar(d.x,d.z,SC);
      if(Math.hypot(pd.x,pd.y)<56)rCtx.fillRect(CX+pd.x-2,CY+pd.y-2,4,4);
    }

    const ps=worldToRadar(SHOP_X,SHOP_Z,SC);
    rCtx.fillStyle='#38bdf8';rCtx.fillRect(CX+ps.x-3,CY+ps.y-3,6,6);
    const pg=worldToRadar(GAS_X,GAS_Z,SC);
    rCtx.fillStyle='#fb923c';rCtx.fillRect(CX+pg.x-3,CY+pg.y-3,6,6);

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

    const tgt=getActiveTarget();
    if(tgt){
      const pt=worldToRadar(tgt.tx,tgt.tz,SC);
      let tx=pt.x,ty=pt.y;
      const bd=Math.hypot(tx,ty);
      if(bd>48){tx*=48/bd;ty*=48/bd;}
      rCtx.save();
      rCtx.strokeStyle=tgt.isCustom?'#00e676':'#ffd54f';
      rCtx.lineWidth=2.5;rCtx.setLineDash([4,3]);
      rCtx.beginPath();rCtx.moveTo(CX,CY);rCtx.lineTo(CX+tx,CY+ty);rCtx.stroke();
      rCtx.restore();

      rCtx.fillStyle=tgt.isCustom?'#00e676':'#ffd54f';
      rCtx.beginPath();rCtx.arc(CX+tx,CY+ty,6.5,0,PI*2);rCtx.fill();
      if(tgt.isContact){
        rCtx.fillStyle='#000';rCtx.font='900 8px sans-serif';rCtx.textAlign='center';
        rCtx.fillText('M',CX+tx,CY+ty+2.8);
      }
    }
  }
  rCtx.restore();

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
  clearCopsOnFoot();clearContactNPC();
  cars=[];peds=[];bullets=[];stars=0;inside=0;
  P.x=SAVE.px;P.z=SAVE.pz;P.h=0;P.y=0;P.vy=0;P.hp=SAVE.hp;P.armor=SAVE.armor;P.stamina=100;P.cash=SAVE.cash;P.car=null;P.enteringCar=null;P.inv=1;
  P.m.visible=true;cy=0;
  updateWeaponHUD();updateControlUI();
  streamChunks(true,P.x,P.z);
  spawnVehicle('me',P.x+4,P.z-6,0);
  prepareNextMission();
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

