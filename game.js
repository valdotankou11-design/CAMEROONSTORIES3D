'use strict';
const $=id=>document.getElementById(id);

// ===== CATALOGUE DES ARMES (MAINS NUES PAR DÉFAUT + ARMES À FEU)
const WEAPONS={
  fist:{name:'Mains nues',melee:true,cd:0.36,dmg:22,range:2.4},
  pistol:{name:'Pistolet 9mm',magSize:12,cd:0.25,dmg:32,spd:135,pellets:1,spread:0.01,infiniteReserve:true},
  smg:{name:'Mitraillette Uzi',magSize:30,cd:0.095,dmg:19,spd:130,pellets:1,spread:0.045,infiniteReserve:false},
  shotgun:{name:'Fusil à Pompe',magSize:8,cd:0.65,dmg:24,spd:115,pellets:5,spread:0.11,infiniteReserve:false},
  rifle:{name:'Fusil AK-47',magSize:30,cd:0.145,dmg:44,spd:160,pellets:1,spread:0.02,infiniteReserve:false},
  sniper:{name:'Fusil Sniper M24',magSize:5,cd:0.85,dmg:120,spd:210,pellets:1,spread:0.002,infiniteReserve:false}
};

// ===== SAUVEGARDE LOCALE (DÉMARRE MAINS NUES AVEC LE PISTOLET DANS L'INVENTAIRE)
const SAVE_KEY='cameroun_stories_studio_v8';
const defaultSave=()=>({
  cash:650,hp:100,armor:50,maxStamina:100,missionIdx:0,
  weapons:['fist','pistol'],curWeapon:'fist',
  mag:{pistol:12,smg:30,shotgun:8,rifle:30,sniper:5},
  reserve:{smg:90,shotgun:24,rifle:90,sniper:15},
  px:3*CS+18,pz:3*CS+12,
  set:{time:'auto',wx:'auto',q:'auto'},
  own:{},rent:{},stats:{}
});
let SAVE=defaultSave();
function loadSave(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(raw){
      const parsed=JSON.parse(raw);
      SAVE=Object.assign(defaultSave(),parsed);
      SAVE.set=Object.assign({time:'auto',wx:'auto',q:'auto'},parsed.set||{});
      SAVE.own=Object.assign({},parsed.own||{});SAVE.rent=Object.assign({},parsed.rent||{});SAVE.stats=Object.assign({},parsed.stats||{});
      if(!SAVE.weapons.includes('fist'))SAVE.weapons.unshift('fist');
      SAVE.mag=Object.assign(defaultSave().mag,parsed.mag||{});
      SAVE.reserve=Object.assign(defaultSave().reserve,parsed.reserve||{});
    }
  }catch(e){}
  updateSaveUI();
}
function writeSave(){
  try{
    SAVE.cash=Math.round(P.cash);SAVE.hp=Math.round(P.hp);SAVE.armor=Math.round(P.armor);
    if(!interiorType){SAVE.px=Math.round(P.x*10)/10;SAVE.pz=Math.round(P.z*10)/10;}
    localStorage.setItem(SAVE_KEY,JSON.stringify(SAVE));
    updateSaveUI();
  }catch(e){}
}
function updateSaveUI(){
  const m=STORY_MISSIONS[SAVE.missionIdx];
  $('save-summary').innerHTML=`Profil : <b>${SAVE.cash} FCFA</b> · ${m?m.title:'Mode Libre Yaoundé'}`;
  if(typeof syncChips==='function')syncChips();
}

// ===== AUDIO PROCÉDURAL (TIRS, COUPS DE POING, RECHARGEMENT, BRIS DE VITRE, RADIO)
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
  if(wep==='shotgun'){playTone(220,0.18,'sawtooth',0.09,40);playTone(95,0.22,'square',0.07,28);}
  else if(wep==='sniper'){playTone(620,0.22,'sawtooth',0.09,50);playTone(140,0.2,'square',0.06,30);}
  else{
    const f=wep==='rifle'?460:wep==='smg'?530:380;
    playTone(f,wep==='smg'?0.06:0.11,'sawtooth',0.06,60);
    playTone(135,0.09,'square',0.04,35);
  }
}
function playPunchSound(hit=false){
  if(hit){
    playTone(105,0.13,'triangle',0.09,32);
    playTone(65,0.15,'sine',0.08,28);
  }else{
    playTone(210,0.08,'sine',0.035,75);
  }
}
function playGlassShatter(){
  for(let k=0;k<4;k++)setTimeout(()=>playTone(1600+R()*1400,0.09,'triangle',0.045,420),k*28);
}
function playReloadSound(){
  playTone(520,0.07,'square',0.04,320);
  setTimeout(()=>playTone(760,0.09,'square',0.05,940),260);
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

// ===== CONSTRUCTION DES 4 INTÉRIEURS VIVANTS (VILLA, SALLE DE SPORT, RESTAURANT, ARMURERIE)
const interiorNPCs=[];
const INTERIORS={
  villa:{ix:IX_VILLA,iz:IZ_VILLA,w:18,d:16,obs:[]},
  gym:{ix:IX_GYM,iz:IZ_GYM,w:20,d:18,obs:[]},
  restaurant:{ix:IX_RESTO,iz:IZ_RESTO,w:20,d:18,obs:[]},
  armory:{ix:IX_ARMORY,iz:IZ_ARMORY,w:18,d:16,obs:[]}
};

function buildRoomShell(ix,iz,w,d,floorCol,wallCol,ceilCol){
  const g=new THREE.Group();scene.add(g);
  bx(w,0.3,d,floorCol,ix,0,iz,g);
  bx(w,5.4,0.4,wallCol,ix,2.7,iz-d/2,g);
  bx(w,5.4,0.4,wallCol,ix,2.7,iz+d/2,g);
  bx(0.4,5.4,d,wallCol,ix-w/2,2.7,iz,g);
  bx(0.4,5.4,d,wallCol,ix+w/2,2.7,iz,g);
  bx(w,0.3,d,ceilCol,ix,5.4,iz,g);
  cyl(0.08,0.08,0.8,8,0x334155,ix,5.0,iz,g);
  cyl(0.65,0.45,0.25,12,new THREE.MeshBasicMaterial({color:0xfef08a}),ix,4.55,iz,g);
  bx(2.2,3.4,0.25,0x78350f,ix,1.85,iz+d/2-0.25,g);
  bx(2.5,0.25,0.35,new THREE.MeshBasicMaterial({color:0x22c55e}),ix,3.7,iz+d/2-0.25,g);
  return g;
}

// 1. VILLA RÉSIDENTIELLE
const villaGrp=buildRoomShell(IX_VILLA,IZ_VILLA,18,16,0xd4a373,0xfefae0,0xf8fafc);
bx(7.2,0.04,5.4,0x991b1b,IX_VILLA-1.2,0.17,IZ_VILLA-1.2,villaGrp);
bx(4.4,0.55,1.5,0x1e3a8a,IX_VILLA-1.2,0.42,IZ_VILLA-3.4,villaGrp);
bx(4.4,0.75,0.35,0x172554,IX_VILLA-1.2,0.95,IZ_VILLA-4.0,villaGrp);
bx(2.4,0.45,1.2,0x78350f,IX_VILLA-1.2,0.38,IZ_VILLA-1.2,villaGrp);
bx(3.4,0.7,0.9,0x451a03,IX_VILLA-1.2,0.5,IZ_VILLA+1.6,villaGrp);
bx(2.6,1.45,0.14,0x0f172a,IX_VILLA-1.2,1.65,IZ_VILLA+1.6,villaGrp);
bx(2.4,1.25,0.16,new THREE.MeshBasicMaterial({color:0x0284c7}),IX_VILLA-1.2,1.65,IZ_VILLA+1.62,villaGrp);
bx(3.6,0.55,4.2,0x7f1d1d,IX_VILLA+5.8,0.42,IZ_VILLA-4.5,villaGrp);
bx(3.4,0.22,3.9,0xf8fafc,IX_VILLA+5.8,0.75,IZ_VILLA-4.5,villaGrp);
const roomCash=bx(0.95,0.32,0.55,0x22c55e,IX_VILLA-1.2,0.82,IZ_VILLA-1.2,villaGrp);
const roomMed=bx(0.7,0.45,0.7,0xef4444,IX_VILLA+5.8,1.08,IZ_VILLA-4.5,villaGrp);
INTERIORS.villa.obs=[
  [IX_VILLA-3.5,IZ_VILLA-4.2,IX_VILLA+1.1,IZ_VILLA-2.6],
  [IX_VILLA-2.4,IZ_VILLA-1.8,IX_VILLA+0.0,IZ_VILLA-0.6],
  [IX_VILLA-2.9,IZ_VILLA+1.1,IX_VILLA+0.5,IZ_VILLA+2.1],
  [IX_VILLA+4.0,IZ_VILLA-6.6,IX_VILLA+7.6,IZ_VILLA-2.4]
];
const villaResident=buildHuman(0xec4899,0x7b5438,'mama');
interiorNPCs.push({type:'villa',m:villaResident,x:IX_VILLA+2.5,z:IZ_VILLA-1.5,h:-PI/2,name:'Tante Clarisse · Résidente',line:'Fais comme chez toi mon fils ! Il y a du cash sur la table basse.'});

// 2. SALLE DE SPORT & BOXE
const gymGrp=buildRoomShell(IX_GYM,IZ_GYM,20,18,0x1e293b,0x334155,0x0f172a);
bx(8.0,0.06,8.0,0x1d4ed8,IX_GYM-2.5,0.18,IZ_GYM-1.5,gymGrp);
cyl(0.06,0.06,1.6,8,0x94a3b8,IX_GYM-2.5,4.6,IZ_GYM-1.5,gymGrp);
const punchingBag=new THREE.Group();
punchingBag.position.set(IX_GYM-2.5,3.8,IZ_GYM-1.5);
cyl(0.36,0.36,1.65,14,0xdc2626,0,-1.1,0,punchingBag);
cyl(0.38,0.38,0.22,14,0x111827,0,-0.35,0,punchingBag);
cyl(0.38,0.38,0.22,14,0x111827,0,-1.85,0,punchingBag);
gymGrp.add(punchingBag);
bx(3.2,0.55,0.9,0x0f172a,IX_GYM+5.5,0.42,IZ_GYM-4.5,gymGrp);
cyl(0.05,0.05,2.4,8,0xe2e8f0,IX_GYM+5.5,1.25,IZ_GYM-4.5,gymGrp);
bx(3.2,0.55,0.9,0x0f172a,IX_GYM+5.5,0.42,IZ_GYM+0.5,gymGrp);
INTERIORS.gym.obs=[[IX_GYM+3.8,IZ_GYM-5.2,IX_GYM+7.2,IZ_GYM-3.8],[IX_GYM+3.8,IZ_GYM-0.2,IX_GYM+7.2,IZ_GYM+1.2]];
const gymCoach=buildHuman(0xeab308,0x5c3c24,'gym');
interiorNPCs.push({type:'gym',m:gymCoach,x:IX_GYM+2.0,z:IZ_GYM-2.5,h:-PI/3,name:'Coach Samuel · Boxe & Fitness',line:'Frappe le sac de boxe à mains nues pour augmenter ton endurance !'});

// 3. RESTAURANT LE MBOA
const restoGrp=buildRoomShell(IX_RESTO,IZ_RESTO,20,18,0xfef3c7,0x7c2d12,0x451a03);
bx(8.5,1.15,1.4,0x78350f,IX_RESTO,0.72,IZ_RESTO-4.8,restoGrp);
bx(8.7,0.12,1.6,0xfacc15,IX_RESTO,1.32,IZ_RESTO-4.8,restoGrp);
for(const[tx,tz]of[[-5.2,-0.5],[5.2,-0.5],[-5.2,4.2],[5.2,4.2]]){
  cyl(1.1,1.1,0.1,14,0x92400e,IX_RESTO+tx,0.95,IZ_RESTO+tz,restoGrp);
  cyl(0.14,0.14,0.8,8,0x451a03,IX_RESTO+tx,0.55,IZ_RESTO+tz,restoGrp);
}
INTERIORS.restaurant.obs=[[IX_RESTO-4.5,IZ_RESTO-5.6,IX_RESTO+4.5,IZ_RESTO-4.0]];
const restoChef=buildHuman(0xf8fafc,0x6f4e37,'chef');
const restoClient=buildHuman(0x3b82f6,0x8d5524,'student');
interiorNPCs.push(
  {type:'restaurant',m:restoChef,x:IX_RESTO,z:IZ_RESTO-6.4,h:0,name:'Chef Nadine · Restaurant Le Mboa',line:'Bienvenue ! Approche le comptoir et appuie sur MANGER (150 FCFA) pour un bon Ndolé !'},
  {type:'restaurant',m:restoClient,x:IX_RESTO-5.2,z:IZ_RESTO-1.6,h:0,name:'Client · Habitué du Mboa',line:'Le poisson braisé et le Ndolé d’ici te remettent sur pied en 2 secondes !'}
);

// 4. ARMURERIE TACTIQUE
const armoryGrp=buildRoomShell(IX_ARMORY,IZ_ARMORY,18,16,0x1e293b,0x0f172a,0x090d12);
bx(8.0,1.15,1.3,0x334155,IX_ARMORY,0.72,IZ_ARMORY-3.8,armoryGrp);
bx(8.2,0.12,1.5,0x38bdf8,IX_ARMORY,1.32,IZ_ARMORY-3.8,armoryGrp);
for(let r=0;r<4;r++){
  bx(2.2,0.12,0.22,0x090d12,IX_ARMORY-4.5+r*3.0,2.5,IZ_ARMORY-7.6,armoryGrp);
  bx(2.2,0.12,0.22,0x090d12,IX_ARMORY-4.5+r*3.0,1.8,IZ_ARMORY-7.6,armoryGrp);
}
INTERIORS.armory.obs=[[IX_ARMORY-4.2,IZ_ARMORY-4.6,IX_ARMORY+4.2,IZ_ARMORY-3.0]];
const armoryDealer=buildHuman(0x18181b,0x5c3c24,'bir');
interiorNPCs.push({type:'armory',m:armoryDealer,x:IX_ARMORY,z:IZ_ARMORY-5.4,h:0,name:'Sergent Kotto · Armurier',line:'Approche du comptoir et appuie sur ACHETER pour voir mon arsenal !'});

function nearDoor(){
  const a=Math.floor(P.x/CS),b=Math.floor(P.z/CS);let best=null,bd=4.2;
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){
    const c=chunks[(a+i)+','+(b+j)];
    if(c)for(const d of c.ds)if(d.x!==undefined){const k=Math.hypot(d.x-P.x,d.z-P.z);if(k<bd){bd=k;best=d;}}
  }
  return best;
}

// ===== 8 MISSIONS SCÉNARISÉES AVEC CINÉMATIQUE VIVANTE
const STORY_MISSIONS=[
  {
    chapter:'CHAPITRE 1 · DÉBUT À YAOUNDÉ',
    title:'Le Contrat du Monument',
    speaker:'Le Patron · Caïd du Boulevard',
    contactRole:'vip',contactShirt:0xeab308,
    cx:3*CS+22,cz:3*CS+18,
    tx:MON_X,tz:MON_Z-16,time:75,reward:500,wantedOnStart:0,
    briefing:'"Écoute bien. Si tu veux te faire un nom à Yaoundé, commence par livrer cette mallette au Monument de la Réunification avant la fin du chrono."',
    objective:'Conduis jusqu’au Monument de la Réunification.'
  },
  {
    chapter:'CHAPITRE 2 · AXE MVOG-MBI',
    title:'Livraison Sous Surveillance',
    speaker:'Karim · Chef de Gang Mvog-Mbi',
    contactRole:'gang',contactShirt:0xdc2626,
    cx:MON_X+12,cz:MON_Z-12,
    tx:2*CS+14,tz:6*CS+14,time:80,reward:750,wantedOnStart:1,
    briefing:'"Les patrouilles contrôlent les carrefours ce soir. Prends le volant, sème la police et dépose le colis au quartier Sud-Ouest."',
    objective:'Livre le colis à Ngoa-Ekellé malgré la patrouille de police.'
  },
  {
    chapter:'CHAPITRE 3 · NETTOYAGE',
    title:'Embûche au Carrefour',
    speaker:'Commandant Mbarga · Informateur',
    contactRole:'bir',contactShirt:0x15803d,
    cx:2*CS+20,cz:6*CS+10,
    type:'combat',count:4,tx:4*CS+14,tz:3*CS+14,time:95,reward:1100,wantedOnStart:1,
    briefing:'"Un gang rival rackette les taximen au carrefour central. Sors ton arme en haut à droite et neutralise-les tous."',
    objective:'Élimine les 4 gangsters armés au carrefour central.'
  },
  {
    chapter:'CHAPITRE 4 · QUARTIER BASTOS',
    title:'Course Contre la Montre VIP',
    speaker:'Madame Chantal · Femme d’Affaires',
    contactRole:'mama',contactShirt:0xe91e63,
    cx:4*CS+18,cz:3*CS+18,
    tx:7*CS+16,tz:3*CS+16,time:70,reward:1300,wantedOnStart:0,
    briefing:'"J’ai une réunion urgente à Bastos ! Fonce à travers les avenues et dépose-moi devant la résidence sécurisée."',
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
    briefing:'"Ils nous attendent près du Lac Municipal avec des renforts. Passe à l’Armurerie si besoin et nettoie la zone."',
    objective:'Neutralise les 5 hommes armés près du Lac Municipal.'
  },
  {
    chapter:'CHAPITRE 7 · CONVOI EXPRÈS',
    title:'Traversée Nocturne',
    speaker:'Le Patron · Caïd du Boulevard',
    contactRole:'vip',contactShirt:0xeab308,
    cx:6*CS+14,cz:5*CS+10,
    tx:7*CS+18,tz:7*CS+18,time:75,reward:2400,wantedOnStart:2,
    briefing:'"Dernière ligne droite vers Mvog-Mbi Est. La police a déployé des barrages : garde le pied sur l’accélérateur."',
    objective:'Rejoins la planque de Mvog-Mbi Est.'
  },
  {
    chapter:'CHAPITRE 8 · LE GRAND COUP',
    title:'Le Braquage de Yaoundé',
    speaker:'Le Patron · Caïd du Boulevard',
    contactRole:'vip',contactShirt:0xeab308,
    cx:7*CS+14,cz:7*CS+14,
    tx:3*CS+18,tz:3*CS+12,time:90,reward:3500,wantedOnStart:3,
    briefing:'"Les coffres sont pleins ! Toute la police est à nos trousses : ramène le butin à notre base du Centre-Ville !"',
    objective:'Ramène le butin à ta base sous alerte 3 étoiles.'
  },
  {
    chapter:'CHAPITRE 9 · JOUR DE MARCHÉ',
    title:'Marchandise Sensible',
    speaker:'Madame Chantal · Femme d’Affaires',
    contactRole:'mama',contactShirt:0xe91e63,
    cx:5*CS+14,cz:2*CS+14,
    legs:[{x:5*CS+40,z:3*CS+4,label:'Récupère la marchandise au Marché.'},{x:8*CS+14,z:5*CS+14,label:'Livre la marchandise à Mvog-Mbi Est.'}],
    tx:5*CS+40,tz:3*CS+4,time:95,reward:2200,wantedOnStart:0,
    briefing:'"Mes fournisseurs m’attendent au marché. Récupère les colis, puis fonce les livrer à Mvog-Mbi Est avant que mes clients ne s’impatientent."',
    objective:'Récupère la marchandise au Marché.'
  },
  {
    chapter:'CHAPITRE 10 · QUARTIER POPULAIRE',
    title:'Nettoyage des Ruelles',
    speaker:'Commandant Mbarga · Informateur',
    contactRole:'bir',contactShirt:0x15803d,
    cx:3*CS+14,cz:5*CS+14,
    type:'combat',count:6,tx:CS+40,tz:2*CS+4,time:105,reward:2600,wantedOnStart:1,
    briefing:'"Une bande armée s’est installée dans le quartier populaire. Entre par la route et neutralise-les tous. Pense à faire le plein de santé aux stands."',
    objective:'Élimine les 6 hommes armés du quartier populaire.'
  },
  {
    chapter:'CHAPITRE 11 · LA FILATURE',
    title:'Triple Livraison',
    speaker:'L’Ombre · Stratège',
    contactRole:'gang',contactShirt:0x7c3aed,
    cx:6*CS+14,cz:2*CS+14,
    legs:[{x:3*CS,z:2*CS,label:'Passe au premier point de dépôt.'},{x:6*CS,z:3*CS,label:'Direction le deuxième point de dépôt.'},{x:4*CS,z:6*CS,label:'Termine au dernier point de dépôt.'}],
    tx:3*CS,tz:2*CS,time:110,reward:2900,wantedOnStart:2,
    briefing:'"Trois dépôts, trois remises, et la police sur le dos. Enchaîne les points sans te faire prendre."',
    objective:'Passe au premier point de dépôt.'
  },
  {
    chapter:'CHAPITRE 12 · MARCHÉ NOIR',
    title:'Descente au Marché',
    speaker:'Karim · Chef de Gang Mvog-Mbi',
    contactRole:'gang',contactShirt:0xdc2626,
    cx:4*CS+14,cz:5*CS+14,
    type:'combat',count:7,tx:5*CS+40,tz:3*CS+4,time:115,reward:3200,wantedOnStart:2,
    briefing:'"Des rivaux se cachent entre les étals du marché. Ils sont sept. Fais le ménage, vite, avant que la foule ne s’affole."',
    objective:'Neutralise les 7 hommes armés autour du Marché.'
  },
  {
    chapter:'CHAPITRE 13 · EXFILTRATION',
    title:'Triple Évasion',
    speaker:'Le Patron · Caïd du Boulevard',
    contactRole:'vip',contactShirt:0xeab308,
    cx:8*CS+14,cz:3*CS+14,
    legs:[{x:7*CS,z:6*CS,label:'Rejoins la première planque.'},{x:2*CS,z:5*CS,label:'Fonce vers la deuxième planque.'},{x:3*CS+18,z:3*CS+12,label:'Ramène tout à la base du Centre-Ville.'}],
    tx:7*CS,tz:6*CS,time:125,reward:3800,wantedOnStart:3,
    briefing:'"Toute la ville est bouclée. Trois planques, un seul chauffeur : toi. Ne t’arrête pas."',
    objective:'Rejoins la première planque.'
  },
  {
    chapter:'CHAPITRE 14 · LE DERNIER CONTRAT',
    title:'Règne sur Yaoundé',
    speaker:'Le Patron · Caïd du Boulevard',
    contactRole:'vip',contactShirt:0xeab308,
    cx:3*CS+22,cz:3*CS+18,
    type:'combat',count:8,tx:6*CS+14,tz:5*CS+14,time:150,reward:6000,wantedOnStart:3,
    then:{x:3*CS+18,z:3*CS+12,label:'Fuis vers ta base du Centre-Ville !'},
    briefing:'"Huit hommes au Lac, puis la fuite jusqu’à la base. Si tu réussis, la ville est à toi."',
    objective:'Élimine les 8 hommes armés au Lac, puis rejoins ta base.'
  }
];

const NPC_PROFILES=[
  {role:'taximan',name:'Moussa · Taximan Jaune',shirt:0xfacc15,skin:0x6f4e37,
   getReply:(ctx)=>{
     if(ctx.stars>0)return 'Cache-toi vite, la police a ton signalement sur tout le boulevard !';
     if(ctx.inCar&&ctx.carType==='taxi')return 'Le jaune brille ce soir collègue, bonne course !';
     if(ctx.isNight)return 'La nuit à Yaoundé, allume bien tes phares et méfie-toi des carrefours.';
     return 'Rejoins le point doré M pour rencontrer ton contact de mission.';
   }},
  {role:'benskin',name:'Kevin · Pilote Benskin',shirt:0xf97316,skin:0x5c3c24,
   getReply:(ctx)=>{
     if(ctx.hp<50)return 'Tu es blessé ! Passe au Restaurant Le Mboa pour reprendre des forces.';
     if(ctx.inCar&&ctx.carType==='moto')return 'Belle moto ! Rien ne te bloque dans les embouteillages avec ça.';
     return 'Touche la mini-carte en haut à gauche pour ouvrir la carte complète de la ville.';
   }},
  {role:'mama',name:'Maman Pauline · Commerçante',shirt:0xec4899,skin:0x7b5438,
   getReply:(ctx)=>{
     if(ctx.stars>=2)return 'Paie un effacement de casier à l’armurerie avant que le BIR n’arrive !';
     if(ctx.isNight)return 'Les lampadaires sont allumés, rentre prudemment ce soir.';
     return 'Tu peux entrer dans les villas, la salle de sport, le restaurant et l’armurerie.';
   }},
  {role:'student',name:'Brice · Étudiant Ngoa-Ekellé',shirt:0x3b82f6,skin:0x8d5524,
   getReply:(ctx)=>{
     if(ctx.cash>=750)return `Avec ${ctx.cash} FCFA, tu peux t'offrir le Fusil à Pompe ou l'AK-47 à l'armurerie !`;
     return 'Touche Mains nues en haut à droite pour dégainer ton Pistolet 9mm ou rengainer.';
   }}
];

// ===== ÉTAT DU JEU & OBJETS GPS
let S='menu',interiorType=null,ret={x:0,z:0},tm=0,dayTime=14.0,cars=[],peds=[],enemies=[],copsOnFoot=[],bullets=[],trs=[],stars=0,wT=0,msgT=0,dT=0,cid=0,cy=0,cp=0.36,zs=0,bubbleT=0;
let customWaypoint=null;
let legI=0,witCd=0;
let VENDORS=[],radarN=0;
const P={
  x:3*CS+18,z:3*CS+12,h:0,vy:0,y:0,hp:100,armor:50,stamina:100,car:null,cash:650,
  cd:0,inv:0,wk:0,enteringCar:null,reloadTimer:0,punchTimer:0,comboStep:0,bagSwing:0,
  m:buildHuman(0xe11d48,0x7b5438,'player')
};

const beacon=new THREE.Group();
const bRing=new THREE.Mesh(new THREE.CylinderGeometry(2.8,2.8,0.35,24,1,true),new THREE.MeshBasicMaterial({color:0xeab308,side:THREE.DoubleSide,transparent:true,opacity:0.88}));
bRing.position.y=0.2;beacon.add(bRing);
const bBeam=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,24,12),new THREE.MeshBasicMaterial({color:0xeab308,transparent:true,opacity:0.2}));
bBeam.position.y=12;beacon.add(bBeam);
scene.add(beacon);

const gpsArrow=new THREE.Group();
const arrowHead=new THREE.Mesh(new THREE.ConeGeometry(0.15,0.40,4),new THREE.MeshBasicMaterial({color:0xeab308}));
arrowHead.rotation.x=PI/2;arrowHead.position.z=0.21;gpsArrow.add(arrowHead);
const arrowShaft=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.04,0.30),new THREE.MeshBasicMaterial({color:0xeab308}));
arrowShaft.position.z=-0.11;gpsArrow.add(arrowShaft);
scene.add(gpsArrow);

let cutEnd=9,briefShown=false,missionPhase='approach_contact',activeMission=null,missionTimeLeft=0,enemiesLeft=0,contactNPC=null,cutsceneTime=0;

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
    const gy=getGroundY(m.cx,m.cz,null);
    const cm=buildHuman(m.contactShirt,0x6f4e37,m.contactRole);
    cm.position.set(m.cx,gy,m.cz);
    contactNPC={m:cm,x:m.cx,z:m.cz,y:gy,h:0};
    updateMissionCardUI();
  }else{
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
  S='cutscene';cutsceneTime=0;briefShown=false;
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
  const txt=activeMission.briefing||'';
  cutEnd=2.4+Math.max(4.5,txt.length/26)+0.9;
  $('cine-name').textContent=activeMission.speaker||'';
  $('cine-text').textContent='';
  $('cine-sub').style.display='block';
  $('npc-bubble').style.display='none';bubbleT=0;
  playTone(540,0.2,'sine');
}
function showBriefModal(){
  briefShown=true;
  $('cine-sub').style.display='none';
  $('brief-chapter').textContent=activeMission.chapter;
  $('brief-reward').textContent=`+${activeMission.reward} FCFA`;
  $('brief-title').textContent=activeMission.title;
  $('brief-speaker').textContent=activeMission.speaker;
  $('brief-text').textContent=activeMission.briefing;
  $('brief-obj').textContent=`Objectif : ${activeMission.objective}`;
  $('briefing-modal').style.display='flex';
  playTone(620,0.2,'sine');
}
function skipCutscene(){if(S==='cutscene'&&!briefShown)cutsceneTime=cutEnd;}
$('cine-sub').onclick=skipCutscene;

function acceptBriefingMission(){
  $('briefing-modal').style.display='none';$('cine-sub').style.display='none';
  document.body.classList.remove('cutscene');
  S='play';
  missionPhase='active';
  missionTimeLeft=activeMission.time;
  clearContactNPC();
  legI=0;
  if(activeMission.legs){activeMission.tx=activeMission.legs[0].x;activeMission.tz=activeMission.legs[0].z;}
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
  showToast(`Mission lancée : ${activeMission.title}`);
  playTone(720,0.25,'sine');
}

function declineBriefingMission(){
  $('briefing-modal').style.display='none';$('cine-sub').style.display='none';
  document.body.classList.remove('cutscene');
  S='play';
  missionPhase='approach_contact';
  P.x-=Math.sin(P.h)*4.5;P.z-=Math.cos(P.h)*4.5;
}

$('btn-accept-mission').onclick=acceptBriefingMission;
$('btn-decline-mission').onclick=declineBriefingMission;

function getActiveTarget(){
  if(typeof act!=='undefined'&&act)return{tx:act.pts[act.i].x,tz:act.pts[act.i].z,isCustom:false,isContact:false};
  if(customWaypoint)return{tx:customWaypoint.x,tz:customWaypoint.z,isCustom:true};
  if(!activeMission)return null;
  if(missionPhase==='approach_contact')return{tx:activeMission.cx,tz:activeMission.cz,isCustom:false,isContact:true};
  return{tx:activeMission.tx,tz:activeMission.tz,isCustom:false,isContact:false};
}

function updateMissionCardUI(){
  if(!activeMission)return;
  const isContact=missionPhase==='approach_contact';
  $('mc-badge').textContent=isContact?'CONTACT MISSION (M)':activeMission.chapter;
  $('mc-timer').textContent=isContact?'EN ATTENTE':`${Math.max(0,Math.ceil(missionTimeLeft))}s`;
  $('mc-title').textContent=activeMission.title;
  $('mc-desc').textContent=isContact?`Rejoins ${activeMission.speaker} au repère doré M.`:activeMission.objective;
  $('mc-reward').textContent=`+${activeMission.reward} FCFA`;
}

function showToast(txt){const el=$('toast');el.textContent=txt;el.classList.add('show');msgT=3.2;}
function showNpcBubble(name,txt,dur=4.5){$('npc-name').textContent=name;$('npc-text').textContent=txt;$('npc-bubble').style.display='block';bubbleT=dur;}

function updateControlUI(){
  $('speedo').style.display=P.car?'block':'none';
  if(!touch)return;
  $('controls-foot').style.display=P.car?'none':'block';
  $('controls-car').style.display=P.car?'block':'none';
}

// ===== GRANDE CARTE DE YAOUNDÉ
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
  customWaypoint=null;drawBigMap();showToast('Repère GPS effacé');
};
$('big-map').addEventListener('pointerdown',e=>{
  const rect=$('big-map').getBoundingClientRect();
  const wx=((e.clientX-rect.left)/rect.width)*WS;
  const wz=((e.clientY-rect.top)/rect.height)*WS;
  let snap=null,sd=20*WS/rect.width;
  for(const p of POI_ALL){if(p.act&&act)continue;const d=Math.hypot(p.x-wx,p.z-wz);if(d<sd){sd=d;snap=p;}}
  customWaypoint=snap?{x:snap.x,z:snap.z}:{x:cl(wx,10,WS-10),z:cl(wz,10,WS-10)};
  const dist=Math.round(Math.hypot(customWaypoint.x-P.x,customWaypoint.z-P.z));
  $('map-cursor-info').textContent=`${snap?snap.e+' '+snap.n+' · ':''}Repère GPS actif · Distance : ${dist} mètres`;
  playTone(680,0.15,'sine');
  drawBigMap();
  showToast(snap?`GPS → ${snap.e} ${snap.n} (${dist} m)`:`Repère GPS placé (${dist} m)`);
});

function drawBigMap(){
  const cv=$('big-map'),ctx=cv.getContext('2d'),W=cv.width,H=cv.height,S2=W/WS;
  ctx.fillStyle='#0b101b';ctx.fillRect(0,0,W,H);

  const zones=[
    {x:0,z:0,w:4*CS,h:4*CS,col:'rgba(30,58,138,0.26)',name:'QUARTIER TSINGA'},
    {x:4*CS,z:0,w:6*CS,h:4*CS,col:'rgba(6,95,70,0.26)',name:'QUARTIER BASTOS'},
    {x:0,z:4*CS,w:4*CS,h:6*CS,col:'rgba(120,53,15,0.24)',name:'NGOA-EKELLÉ · UNIVERSITÉ'},
    {x:4*CS,z:4*CS,w:6*CS,h:6*CS,col:'rgba(88,28,135,0.22)',name:'MVOG-MBI · CENTRE SUD'}
  ];
  if(typeof EXTRA_ZONES!=='undefined')for(const z of EXTRA_ZONES)zones.push(z);
  for(const z of zones){
    ctx.fillStyle=z.col;
    ctx.fillRect(z.x*S2,z.z*S2,z.w*S2,z.h*S2);
  }

  ctx.fillStyle='#151e2e';
  for(let cx=0;cx<NB;cx++)for(let cz=0;cz<NB;cz++){
    ctx.fillRect(cx*CS*S2+4,cz*CS*S2+4,CS*S2-8,CS*S2-8);
  }

  ctx.fillStyle='#0284c7';
  ctx.beginPath();ctx.arc(LAKE_X*S2,LAKE_Z*S2,24*S2,0,PI*2);ctx.fill();
  ctx.strokeStyle='#0284c7';ctx.lineWidth=7;
  ctx.beginPath();ctx.moveTo(LAKE_X*S2,0);ctx.lineTo(LAKE_X*S2,H);ctx.stroke();

  for(let i=0;i<=NB;i++){
    const p=i*CS*S2;
    const isMain=(i===3||i===4||i===7);
    ctx.strokeStyle=isMain?'#94a3b8':'#475569';
    ctx.lineWidth=isMain?6.5:3.5;
    ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,H);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,p);ctx.lineTo(W,p);ctx.stroke();
  }

  ctx.textAlign='center';
  for(const z of zones){
    ctx.fillStyle='rgba(255,255,255,0.22)';ctx.font='800 12px sans-serif';
    ctx.fillText(z.name,(z.x+z.w/2)*S2,(z.z+z.h/2)*S2);
  }
  ctx.fillStyle='#f8fafc';ctx.font='bold 10px sans-serif';
  ctx.fillText('BOULEVARD DU 20 MAI',2.2*CS*S2,3*CS*S2-6);
  ctx.fillText('AVENUE KENNEDY',5.5*CS*S2,4*CS*S2-6);
  ctx.fillText('MONUMENT RÉUNIFICATION',MON_X*S2,MON_Z*S2-11);
  ctx.fillText('LAC MUNICIPAL',LAKE_X*S2,LAKE_Z*S2+24);

  ctx.fillStyle='rgba(20,184,166,0.55)';
  for(const v of VILLAS){ctx.beginPath();ctx.arc(v[0]*S2,v[1]*S2,1.8,0,PI*2);ctx.fill();}
  for(const p of POI_ALL){
    if(p.act&&act)continue;
    mapIcon(ctx,p.x*S2,p.z*S2,(p.sp&&p.sp.locked)?'🔒':p.e,p.col,p.big?11:8.5);
  }
  ctx.textAlign='center';ctx.font='700 9.5px sans-serif';ctx.lineWidth=3;ctx.strokeStyle='rgba(5,8,14,0.9)';
  for(const p of POI_ALL){
    if(!p.big||(p.act&&act))continue;
    ctx.strokeText(p.n,p.x*S2,p.z*S2+p.ly);ctx.fillStyle='#f8fafc';ctx.fillText(p.n,p.x*S2,p.z*S2+p.ly);
  }

  for(const c of cars)if(c.kind==='cop'){
    ctx.fillStyle='#3b82f6';ctx.beginPath();ctx.arc(c.x*S2,c.z*S2,5,0,PI*2);ctx.fill();
  }

  const tgt=getActiveTarget();
  if(tgt){
    ctx.save();
    ctx.strokeStyle=tgt.isCustom?'#22c55e':'#eab308';
    ctx.lineWidth=3;ctx.setLineDash([8,5]);
    ctx.beginPath();ctx.moveTo(P.x*S2,P.z*S2);ctx.lineTo(tgt.tx*S2,tgt.tz*S2);ctx.stroke();
    ctx.restore();

    ctx.fillStyle=tgt.isCustom?'#22c55e':'#eab308';
    ctx.beginPath();ctx.arc(tgt.tx*S2,tgt.tz*S2,8.5,0,PI*2);ctx.fill();
    ctx.fillStyle='#000';ctx.font='900 10px sans-serif';
    ctx.fillText(tgt.isCustom?'GPS':tgt.isContact?'M':'★',tgt.tx*S2,tgt.tz*S2+3.5);
  }

  ctx.save();
  ctx.translate(P.x*S2,P.z*S2);
  ctx.rotate(-cy);
  ctx.fillStyle='rgba(239,68,68,0.28)';
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-15,26);ctx.lineTo(15,26);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ef4444';ctx.beginPath();ctx.arc(0,0,6.5,0,PI*2);ctx.fill();
  ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
  ctx.restore();
}

// ===== ARMURERIE, SÉLECTION D'ARMES & RECHARGEMENT
function openShop(){S='shop';$('shop-modal').style.display='flex';}
function closeShop(){S='play';$('shop-modal').style.display='none';}
window.buyItem=function(id){
  initAudio();
  if(id==='heal'&&P.cash>=150){P.cash-=150;P.hp=100;showToast('Santé restaurée à 100%');playTone(660,0.25,'sine');}
  else if(id==='armor'&&P.cash>=300){P.cash-=300;P.armor=100;showToast('Gilet pare-balles Kevlar équipé');playTone(580,0.25,'sine');}
  else if(id==='ammo'&&P.cash>=150){
    P.cash-=150;
    SAVE.reserve.smg+=120;SAVE.reserve.shotgun+=32;SAVE.reserve.rifle+=120;SAVE.reserve.sniper+=20;
    updateWeaponHUD();showToast('Caisse de munitions récupérée');playReloadSound();
  }else if(id==='clear'&&P.cash>=400){P.cash-=400;stars=0;clearCopsOnFoot();showToast('Casier judiciaire effacé');playTone(520,0.3,'sine');}
  else if(WEAPONS[id]&&!WEAPONS[id].melee){
    const prices={smg:450,shotgun:750,rifle:1100,sniper:1600};
    const cost=prices[id];
    if(P.cash<cost){showToast('Fonds insuffisants');playTone(160,0.2,'sawtooth');return;}
    P.cash-=cost;
    if(!SAVE.weapons.includes(id))SAVE.weapons.push(id);
    SAVE.curWeapon=id;
    SAVE.mag[id]=WEAPONS[id].magSize;
    SAVE.reserve[id]=(SAVE.reserve[id]||0)+WEAPONS[id].magSize*3;
    updateWeaponHUD();showToast(`${WEAPONS[id].name} acquis et équipé`);playReloadSound();
  }else{showToast('Fonds insuffisants');playTone(160,0.2,'sawtooth');return;}
  writeSave();
};

window.switchWeapon=function(){
  initAudio();
  if(SAVE.weapons.length<2){showToast('Tu n’as qu’une arme. Achète-en à l’Armurerie.');return;}
  P.reloadTimer=0;
  const idx=(SAVE.weapons.indexOf(SAVE.curWeapon)+1)%SAVE.weapons.length;
  SAVE.curWeapon=SAVE.weapons[idx];
  updateWeaponHUD();
  showToast(WEAPONS[SAVE.curWeapon].melee?'Mains nues (Combat au corps à corps)':`Arme équipée : ${WEAPONS[SAVE.curWeapon].name}`);
};

function reloadWeapon(){
  const id=SAVE.curWeapon,w=WEAPONS[id];
  if(w.melee||P.reloadTimer>0)return;
  const cur=SAVE.mag[id]||0;
  if(cur>=w.magSize)return;
  if(!w.infiniteReserve&&(SAVE.reserve[id]||0)<=0){
    showToast('Plus de munitions en réserve ! Passe à l’Armurerie.');
    playTone(180,0.12,'square');
    return;
  }
  P.reloadTimer=1.1;
  playReloadSound();
  updateWeaponHUD();
}

function finishReload(){
  const id=SAVE.curWeapon,w=WEAPONS[id];
  if(w.melee)return;
  const need=w.magSize-(SAVE.mag[id]||0);
  if(w.infiniteReserve){
    SAVE.mag[id]=w.magSize;
  }else{
    const take=Math.min(need,SAVE.reserve[id]||0);
    SAVE.mag[id]=(SAVE.mag[id]||0)+take;
    SAVE.reserve[id]-=take;
  }
  updateWeaponHUD();
}

function updateWeaponHUD(){
  const id=SAVE.curWeapon,w=WEAPONS[id];
  $('weapon-name').textContent=w.name;
  const isUnarmed=!!w.melee;
  if(isUnarmed){
    $('ammo-count').textContent='POINGS';
  }else if(P.reloadTimer>0){
    $('ammo-count').textContent='RECHARGEMENT...';
  }else{
    const cur=SAVE.mag[id]||0;
    const res=w.infiniteReserve?'∞':(SAVE.reserve[id]||0);
    $('ammo-count').textContent=`${cur} / ${res}`;
  }
  const rBtn=$('btn-reload-touch');
  if(rBtn)rBtn.style.display=isUnarmed?'none':'flex';
  const iFist=$('icon-fist'),iGun=$('icon-gun');
  if(iFist&&iGun){
    iFist.style.display=isUnarmed?'block':'none';
    iGun.style.display=isUnarmed?'none':'block';
  }
  P.m.userData.gun.visible=!P.car&&!isUnarmed&&P.punchTimer<=0;
}

// ===== ENTRÉES CLAVIER, SOURIS & TACTILE
const KB={},B={fire:0,aim:0,run:0,gas:0,brake:0},jv={m:0,x:0,y:0};
let runTapTime=0;

addEventListener('keydown',e=>{
  KB[e.code]=1;
  if(e.code==='KeyE'||e.code==='Enter'){if(S==='cutscene'){if(briefShown)acceptBriefingMission();else skipCutscene();}else doSmartAction();}
  if(e.code==='KeyR')reloadWeapon();
  if(e.code==='KeyM'){if(S==='map')closeBigMap();else openBigMap();}
  if(e.code==='Tab'||e.code==='KeyQ'){e.preventDefault();switchWeapon();}
  if(e.code.startsWith('Digit')){
    const n=parseInt(e.code.replace('Digit',''),10)-1;
    if(!window.WPN&&SAVE.weapons[n]){SAVE.curWeapon=SAVE.weapons[n];P.reloadTimer=0;updateWeaponHUD();showToast(WEAPONS[SAVE.curWeapon].name);}
  }
  if(e.code==='KeyT')cycleRadio();
  if(e.code==='KeyH'&&P.car)playHorn();
  if(e.code==='KeyC'&&!P.car)doJump();
  if(e.code==='Escape'||e.code==='KeyP'){if(S==='map')closeBigMap();else togglePause();}
  if(e.code.startsWith('Arrow')||e.code==='Space')e.preventDefault();
});
addEventListener('keyup',e=>KB[e.code]=0);
ren.domElement.addEventListener('mousedown',e=>{
  if(S!=='play')return;
  if(e.button===0)B.fire=1;
  if(e.button===2)B.aim=1;
});
addEventListener('mouseup',e=>{
  if(e.button===0)B.fire=0;
  if(e.button===2)B.aim=0;
});
addEventListener('contextmenu',e=>e.preventDefault());

function cycleRadio(){
  initAudio();radioIdx=(radioIdx+1)%RADIOS.length;
  showToast('Station : '+RADIOS[radioIdx].name);
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
  jo=[e.clientX,e.clientY];jb.style.cssText='display:block;left:'+(jo[0]-55)+'px;top:'+(jo[1]-55)+'px';
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
function lookCam(dx,dy){const k=(window.WPN&&WPN.sens)?WPN.sens():1;cy-=dx*0.0065*k;cp=cl(cp+dy*0.0045*k,0.08,1.05);}
lz.onpointerdown=e=>{lid=e.pointerId;lz.setPointerCapture(e.pointerId);lp=[e.clientX,e.clientY];};
lz.onpointermove=e=>{if(e.pointerId!==lid)return;lookCam(e.clientX-lp[0],e.clientY-lp[1]);lp=[e.clientX,e.clientY];};
lz.onpointerup=lz.onpointercancel=()=>{lid=null};
ren.domElement.onpointermove=e=>{if(e.buttons&2||e.buttons&4)lookCam(e.movementX,e.movementY);};

document.querySelectorAll('.tbtn').forEach(b=>{
  const k=b.dataset.k;
  b.onpointerdown=e=>{
    e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('on');
    if(k==='act')doSmartAction();
    else if(k==='weapon')switchWeapon();
    else if(k==='reload')reloadWeapon();
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
$('weapon-box').onpointerdown=e=>{e.stopPropagation();switchWeapon();};
$('btn-how').onclick=()=>{const h=$('how');h.style.display=h.style.display==='block'?'none':'block';};
$('btn-pause').onclick=togglePause;
$('btn-radio').onclick=cycleRadio;

// BOUTON NOUVELLE PARTIE : RÉINITIALISE ET LANCE IMMÉDIATEMENT LA NOUVELLE PARTIE
$('btn-reset').onclick=()=>{
  initAudio();
  localStorage.removeItem(SAVE_KEY);
  SAVE=defaultSave();
  writeSave();
  startGame();
  showToast('Nouvelle partie démarrée');
};

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
  if(S==='play'){S='pause';$('btn-play').textContent='REPRENDRE';$('menu').style.display='flex';writeSave();}
  else if(S==='pause'){S='play';$('menu').style.display='none';}
}

// ===== BRIS DE VITRES

// ===== IMPACTS & COLLISIONS ENTRE PERSONNAGES
function knock(t,fx,fz,f){t.kx=(t.kx||0)+fx*f;t.kz=(t.kz||0)+fz*f;t.stag=0.5;if(t.m&&t!==P)popEmoji(t.m,'😡',1.4);if(t!==P&&peds.includes(t))witnessCrime(t.x,t.z);}
function witnessCrime(x,z){
  if(witCd>0)return;witCd=2.5;
  let n=0;
  for(const q of peds){
    if(n>=3)break;
    if(q.dead||q.fl>0||q.call>0||q.film>0||Math.hypot(q.x-x,q.z-z)>22)continue;
    if(R()<0.5){q.call=3.2;popEmoji(q.m,'📞',3.2);}else{q.film=4.2;popEmoji(q.m,'📱',4.2);}
    n++;
  }
}
function resolveBodies(dt){
  const B=[];
  if(!P.car&&!P.enteringCar)B.push(P);
  for(const p of peds)if(!p.dead)B.push(p);
  for(const c of copsOnFoot)B.push(c);
  for(const e of enemies)if(!e.dead)B.push(e);
  if(contactNPC)B.push(contactNPC);
  for(const b of B){
    if(b.kx||b.kz){b.x+=b.kx*dt;b.z+=b.kz*dt;const f=Math.max(0,1-dt*6);b.kx*=f;b.kz*=f;if(Math.abs(b.kx)+Math.abs(b.kz)<0.05)b.kx=b.kz=0;}
    if(b.stag>0)b.stag-=dt;
  }
  for(let a=0;a<B.length;a++)for(let b=a+1;b<B.length;b++){
    const A=B[a],C=B[b],dx=C.x-A.x,dz=C.z-A.z,d=Math.hypot(dx,dz),min=0.82;
    if(d<min){
      const nx=d>1e-4?dx/d:1,nz=d>1e-4?dz/d:0,o=min-d;
      const wa=A===contactNPC?0:(C===contactNPC?1:0.5),wc=1-wa;
      A.x-=nx*o*wa;A.z-=nz*o*wa;C.x+=nx*o*wc;C.z+=nz*o*wc;
    }
  }
  if(!interiorType)for(const b of B)if(b!==contactNPC&&b!==P)hitBuilding(b,0.55);
}

// ===== FEUX DE SIGNALISATION (cycle 22 s)
function sigState(ax){
  const t=tm%22;
  if(ax==='x')return t<8?'g':(t<10?'y':'r');
  return t<11?'r':(t<19?'g':(t<21?'y':'r'));
}
function updateSignals(){
  for(const ax of['x','z']){
    const st=sigState(ax),m=SIG[ax];
    m.r.color.setHex(st==='r'?0xff2a2a:0x3b0a0a);
    m.y.color.setHex(st==='y'?0xffc21a:0x3b2f0a);
    m.g.color.setHex(st==='g'?0x2bff6b:0x0a3b17);
  }
}

// ===== CIEL : couleur selon l'heure + étoiles
const SKYK=[[0,0x0b1226],[5,0x172447],[6.2,0xf59e6b],[7.8,0x8ecae6],[17,0x8ecae6],[18.2,0xf97316],[19.4,0x2a2f55],[20.8,0x0b1226],[24,0x0b1226]];
const _c1=new THREE.Color(),_c2=new THREE.Color();
function skyAt(t,out){
  for(let i=0;i<SKYK.length-1;i++){
    const a=SKYK[i],b=SKYK[i+1];
    if(t>=a[0]&&t<=b[0]){_c1.setHex(a[1]);_c2.setHex(b[1]);return out.copy(_c1).lerp(_c2,(t-a[0])/(b[0]-a[0]||1));}
  }
  return out.setHex(0x8ecae6);
}
const starGeo=new THREE.BufferGeometry(),starPos=[];
for(let i=0;i<260;i++){const a=R()*PI*2,e=0.15+R()*1.2,r=190;starPos.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r);}
starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));
const starMat=new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false});
const starPts=new THREE.Points(starGeo,starMat);starPts.frustumCulled=false;scene.add(starPts);

// ===== BARRAGES DE POLICE & HÉLICOPTÈRE (niveaux 3 à 5)
let rbT=6,heli=null,heliT=0;
function spawnRoadblock(){
  const h=P.car?P.car.h:P.h;
  const tx=P.x+Math.sin(h)*105,tz=P.z+Math.cos(h)*105;
  if(tx<20||tz<20||tx>WS-20||tz>WS-20)return;
  const rx=Math.round(tx/CS)*CS,rz=Math.round(tz/CS)*CS;
  const alongX=Math.abs(tx-rx)<Math.abs(tz-rz); // route verticale (le long de z) si on est proche d'une ligne x
  const offs=[-5.6,0,5.6];
  for(const o of offs){
    const x=alongX?rx+o:tx+0,z=alongX?tz:rz+o;
    const c=spawnVehicle('cop',x,z,0);
    c.h=alongX?PI/2:0;c.hasDriver=false;c.rb=1;c.v=0;
  }
  const bx0=alongX?rx:tx,bz0=alongX?tz:rz,bh=Math.atan2(P.x-bx0,P.z-bz0);
  for(const o of[-3.5,3.5]){
    if(copsOnFoot.length>=6)break;
    const px=bx0+(alongX?o:0)+Math.sin(bh)*4,pz=bz0+(alongX?0:o)+Math.cos(bh)*4;
    const cm=buildHuman(0x1e3a8a,0x6f4e37,'cop');cm.userData.gun.visible=true;
    copsOnFoot.push({m:cm,x:px,z:pz,h:0,hp:50,cd:rn(0.4,1.2),wk:0,isBir:false,hold:true});
  }
  showToast('Barrage de police devant !');
}
function buildHeli(){
  const g=new THREE.Group();
  bx(1.7,1.5,3.6,0x0f172a,0,0,0,g);
  bx(1.5,0.7,1.4,new THREE.MeshStandardMaterial({color:0x38bdf8,transparent:true,opacity:0.6}),0,0.2,1.55,g);
  bx(0.35,0.35,3.6,0x1e293b,0,0.3,-3.2,g);
  bx(0.1,1.2,0.5,0x1e293b,0,0.9,-4.8,g);
  bx(0.2,0.55,0.2,0x1e293b,0,0.95,0,g);
  const rotor=new THREE.Group();rotor.position.y=1.25;
  bx(9,0.06,0.28,0x94a3b8,0,0,0,rotor);bx(0.28,0.06,9,0x94a3b8,0,0,0,rotor);g.add(rotor);
  const l1=bx(0.3,0.2,0.3,new THREE.MeshBasicMaterial({color:0xef4444}),0.9,-0.8,0,g);
  const l2=bx(0.3,0.2,0.3,new THREE.MeshBasicMaterial({color:0x3b82f6}),-0.9,-0.8,0,g);
  const bg=new THREE.CylinderGeometry(3.4,0.25,1,16,1,true);bg.rotateX(PI/2);bg.translate(0,0,0.5);
  const beam=new THREE.Mesh(bg,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.12,depthWrite:false,side:THREE.DoubleSide}));
  const bgroup=new THREE.Group();bgroup.add(beam);scene.add(bgroup);
  scene.add(g);
  return{m:g,rotor,l1,l2,beam:bgroup,bm:beam,ang:R()*6.28,cd:1.5,x:P.x+30,z:P.z,y:34};
}
function updateHeli(dt){
  const want=stars>=4&&S==='play'&&!interiorType;
  if(want&&!heli){heli=buildHeli();showToast('Hélicoptère de la police en approche !');}
  if(!want&&heli){scene.remove(heli.m);scene.remove(heli.beam);heli=null;return;}
  if(!heli)return;
  heli.ang+=dt*0.55;
  const tx=P.x+Math.cos(heli.ang)*22,tz=P.z+Math.sin(heli.ang)*22,k=Math.min(1,dt*1.8);
  const ox=heli.x,oz=heli.z;
  heli.x+=(tx-heli.x)*k;heli.z+=(tz-heli.z)*k;
  heli.m.position.set(heli.x,heli.y+Math.sin(tm*1.3)*0.8,heli.z);
  heli.m.rotation.y=Math.atan2(heli.x-ox,heli.z-oz)||heli.m.rotation.y;
  heli.m.rotation.z=0.12;
  heli.rotor.rotation.y+=dt*40;
  const fl=Math.sin(tm*12)>0;heli.l1.material.color.setHex(fl?0xef4444:0x450a0a);heli.l2.material.color.setHex(!fl?0x3b82f6:0x172554);
  const gy=getGroundY(P.x,P.z,null),pp=new THREE.Vector3(P.x,gy+1,P.z);
  heli.beam.position.copy(heli.m.position);heli.beam.lookAt(pp);
  heli.bm.scale.z=heli.m.position.distanceTo(pp);
  heliT-=dt;if(heliT<=0){heliT=0.2;if(Math.hypot(heli.x-P.x,heli.z-P.z)<90)playTone(65,0.09,'square',0.02);}
  heli.cd-=dt;
  if(heli.cd<=0&&S==='play'){
    heli.cd=rn(1.0,1.6);
    const dir=new THREE.Vector3(P.x-heli.x+rn(-2.5,2.5),gy+1.2-heli.m.position.y,P.z-heli.z+rn(-2.5,2.5)).normalize();
    spawnBullet(heli.x,heli.m.position.y-1,heli.z,dir,90,7,false,0xef4444);
    playGunshot('pistol');
  }
}

// ===== ACTIVITÉS SECONDAIRES : COURSE DE RUE, LIVRAISON EXPRESS, COURSE DE TAXI
const ACT_SPOTS=[
  {id:'race',x:CS+14,z:CS+14,name:'Course de rue',col:0xf97316,cd:0,unlock:1},
  {id:'deliv',x:4*CS+14,z:2*CS+14,name:'Livraison express',col:0x22d3ee,cd:0,unlock:0},
  {id:'taxi',x:6*CS+14,z:3*CS+14,name:'Course de taxi',col:0xfacc15,cd:0,unlock:2},
  {id:'bounty',x:8*CS+14,z:2*CS+14,name:'Chasse aux primes',col:0xef4444,cd:0,unlock:4}
];
let act=null,actRing=null,actPax=null;
function makeSpotMarker(col){
  const g=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.4,0.3,24,1,true),new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide,transparent:true,opacity:0.85}));
  ring.position.y=0.2;g.add(ring);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,18,10),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.22}));
  beam.position.y=9;g.add(beam);return g;
}
for(const sp of ACT_SPOTS){sp.m=makeSpotMarker(sp.col);sp.m.position.set(sp.x,getGroundY(sp.x,sp.z,null),sp.z);scene.add(sp.m);}
actRing=makeSpotMarker(0xffffff);actRing.visible=false;scene.add(actRing);

function actSetTarget(pt){
  actRing.visible=true;actRing.position.set(pt.x,getGroundY(pt.x,pt.z,null),pt.z);
  actRing.children.forEach(o=>o.material.color.setHex(act.col));
}
function startActivity(sp){
  if((sp.id==='race'||sp.id==='taxi')&&!P.car){sp.cd=4;showToast(sp.id==='race'?'Il te faut un véhicule pour la course de rue.':'Il te faut un véhicule pour la course de taxi.');return;}
  if(missionPhase==='briefing'||S!=='play')return;
  initAudio();
  if(sp.id==='race'){
    const g=[[2,1],[3,1],[3,2],[2,2],[1,2],[1,1]];
    act={id:'race',col:0xf97316,title:'COURSE DE RUE',pts:g.map(a=>({x:a[0]*CS,z:a[1]*CS})),i:0,t:85,reward:700,need:true};
    showToast('Course lancée ! Traverse tous les points avant la fin du chrono.');
  }else if(sp.id==='deliv'){
    act={id:'deliv',col:0x22d3ee,title:'LIVRAISON EXPRESS',pts:[{x:2*CS+14,z:6*CS+14}],i:0,t:100,reward:480,need:false};
    showToast('Colis récupéré ! Livre-le au point bleu.');
  }else if(sp.id==='bounty'){
    if(activeMission&&missionPhase==='active'&&activeMission.type==='combat'){sp.cd=6;showToast('Termine d’abord ton contrat en cours.');return;}
    const n=Math.min(8,3+Math.floor(SAVE.missionIdx/2)),pt={x:8*CS,z:2*CS};
    act={id:'bounty',col:0xef4444,title:'CHASSE AUX PRIMES',pts:[pt],i:0,t:100,reward:300*n,need:false,bounty:true};
    enemiesLeft=n;
    for(let k=0;k<n;k++){
      const em=buildHuman(0x18181b,0x6f4e37,'bir');em.userData.gun.visible=true;
      enemies.push({m:em,x:pt.x+rn(-10,10),z:pt.z+rn(-10,10),h:0,hp:55,cd:rn(0.5,1.5),wk:0});
    }
    addCrime(1);
    showToast(`Prime lancée : neutralise ${n} cibles !`);
  }else{
    const dst=[{x:1*CS+14,z:5*CS+14},{x:7*CS+14,z:1*CS+14},{x:8*CS+14,z:6*CS+14}][R()*3|0];
    act={id:'taxi',col:0xfacc15,title:'COURSE DE TAXI',pts:[dst],i:0,t:90,reward:520,need:true};
    const pm=buildHuman(0x7c3aed,0x6f4e37,'student');pm.position.set(sp.x+1.5,getGroundY(sp.x,sp.z,null),sp.z);scene.add(pm);
    actPax=pm;setTimeout(()=>{if(actPax===pm){scene.remove(pm);actPax=null;}},1800);
    showToast('Client à bord ! Dépose-le au point jaune.');
  }
  for(const q of ACT_SPOTS)q.m.visible=false;
  actSetTarget(act.pts[0]);
  $('act-card').style.display='block';
  playTone(560,0.2,'sine');
}
function endActivity(ok){
  if(!act)return;
  if(act.bounty&&!ok){for(const e of enemies)scene.remove(e.m);enemies=[];enemiesLeft=0;}
  if(ok){
    const bonus=act.id==='taxi'?Math.floor(act.t*3):0;
    P.cash+=act.reward+bonus;writeSave();
    showToast(`${act.title} réussie · +${act.reward+bonus} FCFA`);playTone(880,0.3,'sine');
  }else{showToast(`${act.title} échouée`);playTone(150,0.3,'sawtooth');}
  act=null;actRing.visible=false;$('act-card').style.display='none';
  for(const q of ACT_SPOTS){q.m.visible=true;q.cd=20;}
}
function updateActivities(dt){
  for(const sp of ACT_SPOTS){
    sp.cd=Math.max(0,sp.cd-dt);
    sp.m.rotation.y+=dt;
    sp.locked=SAVE.missionIdx<sp.unlock;
    if(sp._l!==sp.locked){sp._l=sp.locked;sp.m.children.forEach(o=>o.material.color.setHex(sp.locked?0x64748b:sp.col));}
    const near=!act&&sp.cd<=0&&S==='play'&&!interiorType&&!P.enteringCar&&Math.hypot(P.x-sp.x,P.z-sp.z)<(P.car?5.5:3.2);
    if(!near)continue;
    if(sp.locked){sp.cd=7;showToast(`🔒 ${sp.name} : débloquée après le chapitre ${sp.unlock}`);continue;}
    startActivity(sp);
  }
  if(!act)return;
  if(S!=='play')return;
  act.t-=dt;
  const pt=act.pts[act.i],d=Math.hypot(P.x-pt.x,P.z-pt.z);
  $('act-title').textContent=act.title;
  $('act-info').textContent=act.id==='race'?`Point ${act.i+1}/${act.pts.length} · ${Math.ceil(act.t)}s`:`${Math.round(d)} m · ${Math.ceil(act.t)}s`;
  if(act.need&&!P.car&&!P.enteringCar){act.out=(act.out||0)+dt;if(act.out>8){endActivity(false);return;}}else act.out=0;
  if(act.bounty){
    $('act-title').textContent=act.title;$('act-info').textContent=`Cibles : ${Math.max(0,enemiesLeft)} · ${Math.ceil(act.t)}s`;
    if(enemiesLeft<=0){endActivity(true);return;}
    if(act.t<=0)endActivity(false);
    return;
  }
  const r=act.id==='race'?9:6;
  const stopped=act.id!=='taxi'||(P.car&&Math.abs(P.car.v)<5);
  if(d<r&&stopped){
    act.i++;
    if(act.i>=act.pts.length){endActivity(true);return;}
    actSetTarget(act.pts[act.i]);playTone(700,0.12,'sine');
  }
  if(act.t<=0)endActivity(false);
}

// ===== AMBIANCE SONORE : MOTEUR (selon la vitesse) ET SIRÈNES DE POLICE
let engO=null,engG=null,engF=null,sirO=null,sirG=null;
function ensureEngineAudio(){
  if(!AC||engO)return;
  try{
    engO=AC.createOscillator();engO.type='sawtooth';engF=AC.createBiquadFilter();engF.type='lowpass';engF.frequency.value=380;
    engG=AC.createGain();engG.gain.value=0;engO.connect(engF);engF.connect(engG);engG.connect(AC.destination);engO.start();
    sirO=AC.createOscillator();sirO.type='triangle';sirG=AC.createGain();sirG.gain.value=0;sirO.connect(sirG);sirG.connect(AC.destination);sirO.start();
  }catch(e){engO=null;}
}
function updateAmbientAudio(){
  if(!AC)return;ensureEngineAudio();ensureRain();
  if(rainG)rainG.gain.setTargetAtTime(S==='play'?Math.min(1,wxB.rain)*(interiorType?0.008:0.03):0,AC.currentTime,0.3);
  if(!engO)return;
  const t=AC.currentTime,c=P.car;
  if(c&&S==='play'){
    const sp=Math.abs(c.v),mx=c.vType==='moto'?38:35;
    engO.frequency.setTargetAtTime((c.vType==='moto'?70:48)+sp*(c.vType==='moto'?5.5:4),t,0.08);
    engF.frequency.setTargetAtTime(260+sp*22,t,0.1);
    engG.gain.setTargetAtTime(0.018+Math.min(1,sp/mx)*0.03,t,0.1);
  }else engG.gain.setTargetAtTime(0,t,0.15);
  let near=0;
  if(stars>0&&S==='play')for(const o of cars)if(o.kind==='cop'&&o.hasDriver){const d=Math.hypot(o.x-P.x,o.z-P.z);if(d<110)near=Math.max(near,1-d/110);}
  if(heli)near=Math.max(near,0.5);
  sirO.frequency.setTargetAtTime(Math.sin(tm*5.2)>0?760:980,t,0.02);
  sirG.gain.setTargetAtTime(near*0.035,t,0.12);
}

// ===== ÉMOJIS (sprites) : icônes dans le monde et réactions des personnages
const EMO_TEX={};
function emoTex(e){
  if(EMO_TEX[e])return EMO_TEX[e];
  const cv=document.createElement('canvas');cv.width=cv.height=96;
  const x=cv.getContext('2d');
  x.font='70px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  x.textAlign='center';x.textBaseline='middle';x.fillText(e,48,52);
  return EMO_TEX[e]=new THREE.CanvasTexture(cv);
}
function makeEmojiSprite(e,size,depthTest){
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:emoTex(e),transparent:true,depthTest:!!depthTest,fog:false}));
  sp.scale.set(size,size,1);return sp;
}
let emoPops=[];
function popEmoji(parent,e,dur=1.6,y=2.7){
  if(!parent||emoPops.length>14)return;
  const old=emoPops.find(o=>o.parent===parent);
  if(old){old.parent.remove(old.s);old.s.material.dispose();emoPops.splice(emoPops.indexOf(old),1);}
  const sp=makeEmojiSprite(e,1.05,false);sp.position.set(0,y,0);sp.renderOrder=6;parent.add(sp);
  emoPops.push({s:sp,t:dur,dur,parent});
}
function updateEmojiPops(dt){
  for(let i=emoPops.length-1;i>=0;i--){
    const o=emoPops[i];o.t-=dt;o.s.position.y+=dt*0.35;
    o.s.material.opacity=Math.min(1,o.t/0.4);
    if(o.t<=0){o.parent.remove(o.s);o.s.material.dispose();emoPops.splice(i,1);}
  }
}

// ===== STANDS DE RUE : glaces, soya, jus frais (soignent le joueur)
const VTYPES={
  ice:{e:'🍦',n:'Glacier',price:150,hp:20,st:35,col:0xf9a8d4,top:0xfb7185},
  soya:{e:'🍢',n:'Soya grillé',price:200,hp:40,st:15,col:0x92400e,top:0xea580c},
  juice:{e:'🥤',n:'Jus frais',price:100,hp:8,st:100,col:0x16a34a,top:0xfacc15}
};
const VSPOTS=[['ice',250.5,200],['soya',360,170.5],['juice',170.5,280],['ice',410.5,360],['soya',280,410.5],['juice',90.5,280],
  ['ice',410.5,280],['soya',600,250.5],['juice',650.5,440],['ice',520,330.5],['soya',120,170.5],['ice',280,284]];
function buildVendor(t,x,z){
  const T=VTYPES[t],g=new THREE.Group();
  bx(1.9,1.0,1.1,T.col,0,0.5,0,g);
  bx(2.0,0.1,1.2,0xf1f5f9,0,1.05,0,g);
  bx(1.9,0.42,0.08,0x111827,0,1.4,0.56,g);
  cyl(0.05,0.05,2.3,6,0x6b7280,0,2.15,-0.45,g);
  const um=new THREE.Mesh(new THREE.ConeGeometry(1.75,0.65,14),mt(T.top,0.7));um.position.set(0,3.1,-0.45);um.castShadow=true;g.add(um);
  for(let i=0;i<3;i++)bx(0.28,0.34,0.28,[0xfef3c7,0xfda4af,0xa7f3d0][i],-0.55+i*0.55,1.27,0.05,g);
  const vm=buildHuman(0xfde047,0x6f4e37,'student');vm.position.set(0,0,-0.95);g.add(vm);
  const gy=getGroundY(x,z,null),cx0=Math.floor(x/CS)*CS+40,cz0=Math.floor(z/CS)*CS+40;
  g.position.set(x,gy,z);g.rotation.y=Math.atan2(cx0-x,cz0-z);
  scene.add(g);
  const spr=makeEmojiSprite(T.e,2.0,true);spr.position.set(x,gy+4.6,z);scene.add(spr);
  return{t:t,x:x,z:z,g:g,spr:spr,cd:0};
}
for(const v of VSPOTS)VENDORS.push(buildVendor(v[0],v[1],v[2]));
function nearVendor(){
  let best=null,bd=3.7;
  for(const v of VENDORS){const d=Math.hypot(v.x-P.x,v.z-P.z);if(d<bd){bd=d;best=v;}}
  return best;
}
const vendorOpen=()=>dayTime>=6&&dayTime<20;
function buyFromVendor(v){
  const T=VTYPES[v.t];
  if(v.cd>0)return;
  if(!vendorOpen()){showToast(`🌙 ${T.n} : stand fermé la nuit (ouvert de 6h à 20h)`);v.cd=2;return;}
  if(P.hp>=100&&P.stamina>=(SAVE.maxStamina||100)-1){showToast(`${T.e} Tu n'as pas besoin de ça pour l'instant`);return;}
  if(P.cash<T.price){showToast(`${T.e} ${T.n} : il te faut ${T.price} FCFA`);return;}
  P.cash-=T.price;v.cd=2;
  P.hp=Math.min(100,P.hp+T.hp);P.stamina=Math.min(SAVE.maxStamina||100,P.stamina+T.st);
  writeSave();playTone(660,0.18,'sine');
  popEmoji(P.m,'😋',1.8);popEmoji(v.g.children[v.g.children.length-1],'😄',1.6,2.4);
  showToast(`${T.e} ${T.n} · -${T.price} FCFA · +${T.hp} santé`);
}

// ===== POINTS D'INTÉRÊT : positions fixes pour la carte, le radar et les icônes 3D
const VILLAS=[[25,273],[25,353],[25,433],[55,433],[25,463],[55,673],[25,783],[55,783],[105,33],[135,33],[135,63],[135,273],[135,353],[105,513],[135,513],[135,543],[135,703],[215,33],[185,193],[215,303],[215,463],[215,513],[185,673],[215,673],[215,753],[215,783],[295,33],[265,113],[265,143],[295,143],[265,193],[295,303],[295,353],[265,383],[295,383],[265,593],[265,673],[295,673],[295,753],[375,33],[375,63],[345,113],[375,113],[345,223],[375,273],[345,303],[345,463],[375,463],[345,543],[375,593],[375,623],[375,703],[375,753],[425,33],[455,33],[425,63],[425,223],[455,223],[425,383],[455,463],[455,593],[455,623],[425,673],[455,703],[425,753],[455,753],[455,783],[535,63],[535,143],[535,273],[535,353],[535,543],[535,623],[535,703],[505,753],[535,753],[585,33],[615,33],[585,63],[585,113],[585,193],[615,193],[585,223],[615,223],[615,353],[615,383],[585,433],[585,463],[585,513],[615,543],[585,673],[615,703],[585,753],[615,753],[615,783],[695,113],[665,143],[665,273],[665,383],[695,463],[665,513],[665,543],[665,593],[695,593],[665,623],[695,753],[665,783],[745,63],[745,193],[775,223],[745,353],[775,353],[745,513],[775,593],[745,673],[775,703]];
const POIS=[
  {k:'armory',e:'🔫',n:'Armurerie',x:265,z:275,col:'#38bdf8',ly:-16,big:1},
  {k:'gym',e:'🥊',n:'Salle de boxe',x:295,z:275,col:'#a855f7',ly:18,big:1},
  {k:'resto',e:'🍽️',n:'Restaurant Le Mboa',x:345,z:275,col:'#f97316',ly:-16,big:1},
  {k:'gas',e:'⛽',n:'Station-service',x:GAS_X,z:GAS_Z,col:'#fb923c',ly:17,big:1},
  {k:'mon',e:'🏛️',n:'Monument',x:MON_X,z:MON_Z,col:'#94a3b8',ly:17,big:1},
  {k:'lake',e:'🌊',n:'Lac municipal',x:LAKE_X,z:LAKE_Z,col:'#0284c7',ly:-17,big:1},
  {k:'market',e:'🛒',n:'Marché',x:5*CS+40,z:3*CS+40,col:'#eab308',ly:17,big:1},
  {k:'slum',e:'🏘️',n:'Quartier populaire',x:CS+40,z:2*CS+40,col:'#b45309',ly:17,big:1},
  {k:'slum',e:'🏘️',n:'Quartier populaire',x:7*CS+40,z:7*CS+40,col:'#b45309',ly:17,big:1},
  {k:'slum',e:'🏘️',n:'Quartier populaire',x:2*CS+40,z:7*CS+40,col:'#b45309',ly:17,big:1}
];
const POI_ALL=POIS.concat(
  ACT_SPOTS.map((a,i)=>({k:'act',sp:a,e:['🏁','📦','🚕','🎯'][i],n:a.name,x:a.x,z:a.z,col:'#'+a.col.toString(16).padStart(6,'0'),ly:-16,big:1,act:1})),
  VENDORS.map(v=>({k:'vend',e:VTYPES[v.t].e,n:VTYPES[v.t].n,x:v.x,z:v.z,col:'#f472b6',ly:0,big:0}))
);
const poiSprites=[];
for(const p of POIS)if(p.big&&p.k!=='lake'&&p.k!=='slum'){
  const sp=makeEmojiSprite(p.e,6,false);sp.renderOrder=5;sp.position.set(p.x,p.k==='mon'?26:15,p.z);scene.add(sp);poiSprites.push({s:sp,p});
}
function updatePoiSprites(){
  for(const o of poiSprites){
    const d=Math.hypot(P.x-o.p.x,P.z-o.p.z),vis=!interiorType&&d>16&&d<175;
    o.s.visible=vis;if(vis){const k=cl(d*0.05,2.4,8);o.s.scale.set(k,k,1);}
  }
  const vOpen=vendorOpen();
  for(const v of VENDORS){v.spr.material.opacity=vOpen?1:0.35;v.cd=Math.max(0,v.cd-1/60);v.spr.position.y=getGroundY(v.x,v.z,null)+4.6+Math.sin(tm*2+v.x)*0.12;}
}
function fillMapLegend(){
  const el=$('map-legend');if(!el)return;
  el.innerHTML='<span>🔴 Toi</span><span>🟡 M Mission</span><span>🟢 Repère GPS</span><span>🔫 Armurerie</span><span>🥊 Salle de boxe</span><span>🍽️ Restaurant</span><span>⛽ Station (répare)</span><span>🍦🍢🥤 Stands (soignent)</span><span>🏁📦🚕 Activités</span><span>🛒 Marché</span><span>🏘️ Quartiers populaires</span><span>🏛️ Monument</span><span>• Maisons</span><span>Touche une icône : GPS</span>';
}
fillMapLegend();
function mapIcon(ctx,x,y,e,col,r){
  ctx.fillStyle='rgba(8,12,20,0.88)';ctx.beginPath();ctx.arc(x,y,r,0,PI*2);ctx.fill();
  ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke();
  ctx.font=`${Math.round(r*1.2)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText(e,x,y+1);ctx.textBaseline='alphabetic';
}

// ===== MÉTÉO (pluie, brume, orage) ET HEURE RÉGLABLES
const WXT={clear:{rain:0,fog:0.0044,dark:0},rain:{rain:1,fog:0.0075,dark:0.4},fog:{rain:0,fog:0.017,dark:0.25},storm:{rain:1.7,fog:0.010,dark:0.62}};
const TPRESET={morning:7.6,noon:13,evening:18.3,night:23.2};
let wxCur='clear',wxAutoT=90,lightT=8,flash=0;
const wxB={rain:0,fog:0.0044,dark:0};
const _cg=new THREE.Color(0x6b7480),_cw=new THREE.Color(0xffffff);
const RAIN_N=1000,rainPos=new Float32Array(RAIN_N*6),rainSeed=[];
for(let i=0;i<RAIN_N;i++)rainSeed.push({x:rn(-40,40),y:rn(0,32),z:rn(-40,40)});
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
const rainMat=new THREE.LineBasicMaterial({color:0xb7cbe6,transparent:true,opacity:0.4,fog:false});
const rainObj=new THREE.LineSegments(rainGeo,rainMat);rainObj.frustumCulled=false;rainObj.visible=false;scene.add(rainObj);
function updateWeather(dt){
  const sel=SAVE.set.wx;
  if(sel==='auto'){wxAutoT-=dt;if(wxAutoT<=0){wxAutoT=rn(130,280);const r=R();wxCur=r<0.55?'clear':r<0.78?'rain':r<0.9?'fog':'storm';}}
  const cur=sel==='auto'?wxCur:sel,T=WXT[cur]||WXT.clear,k=Math.min(1,dt*0.35);
  wxB.rain+=(T.rain-wxB.rain)*k;wxB.fog+=(T.fog-wxB.fog)*k;wxB.dark+=(T.dark-wxB.dark)*k;
  scene.background.lerp(_cg,wxB.dark);
  scene.fog.color.copy(scene.background);scene.fog.density=wxB.fog;
  hemi.intensity*=1-wxB.dark*0.35;sun.intensity*=1-wxB.dark*0.75;
  starMat.opacity*=1-wxB.dark;
  if(cur==='storm'&&wxB.rain>1){
    lightT-=dt;
    if(lightT<=0){lightT=rn(5,14);flash=1;setTimeout(()=>{playTone(55,0.9,'sawtooth',0.07);},rn(300,1200));}
  }
  if(flash>0){flash=Math.max(0,flash-dt*3);hemi.intensity+=flash*1.6;scene.background.lerp(_cw,flash*0.5);}
  const on=wxB.rain>0.05&&!(window.QUALITY&&window.QUALITY.rain===false);
  rainObj.visible=on&&(!interiorType||/^estate/.test(interiorType));
  if(on){
    const n=Math.min(RAIN_N,Math.floor(RAIN_N*Math.min(1,wxB.rain*0.65)));
    rainGeo.setDrawRange(0,n*2);
    rainObj.position.set(P.x,getGroundY(P.x,P.z,null),P.z);
    for(let i=0;i<n;i++){
      const d=rainSeed[i];d.y-=36*dt;
      if(d.y<0){d.y+=32;d.x=rn(-40,40);d.z=rn(-40,40);}
      const o=i*6;rainPos[o]=d.x;rainPos[o+1]=d.y;rainPos[o+2]=d.z;rainPos[o+3]=d.x-0.15;rainPos[o+4]=d.y-0.9;rainPos[o+5]=d.z;
    }
    rainGeo.attributes.position.needsUpdate=true;
    rainMat.opacity=0.28+0.18*Math.min(1,wxB.rain);
  }
  roadMat.roughness=0.88-0.45*Math.min(1,wxB.rain);
}
let rainG=null;
function ensureRain(){
  if(!AC||rainG)return;
  try{
    const buf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const src=AC.createBufferSource();src.buffer=buf;src.loop=true;
    const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=1800;
    rainG=AC.createGain();rainG.gain.value=0;src.connect(f);f.connect(rainG);rainG.connect(AC.destination);src.start();
  }catch(e){rainG=null;}
}
function syncChips(){
  for(const pr of[['chips-time','time'],['chips-wx','wx']]){
    const box=$(pr[0]);if(!box)continue;
    for(const b of box.children)b.classList.toggle('on',b.dataset.v===SAVE.set[pr[1]]);
  }
}
for(const pr of[['chips-time','time'],['chips-wx','wx']]){
  const box=$(pr[0]);
  if(box)box.onclick=e=>{
    const b=e.target.closest('button');if(!b)return;
    SAVE.set[pr[1]]=b.dataset.v;writeSave();syncChips();playTone(520,0.08,'sine');
  };
}

function spawnGlassShards(wx,wy,wz,count=10){
  playGlassShatter();
  for(let k=0;k<count;k++){
    const sh=bx(0.14,0.14,0.03,0xbae6fd,wx+rn(-0.5,0.5),wy+rn(-0.3,0.4),wz+rn(-0.5,0.5));
    trs.push({m:sh,t:0.65,vy:rn(1.5,4.2),vx:rn(-2.5,2.5),vz:rn(-2.5,2.5)});
  }
}

function shatterCarWindows(c){
  if(c.windowsBroken||!c.m.userData.windows||!c.m.userData.windows.length)return;
  c.windowsBroken=true;
  spawnGlassShards(c.x,1.4,c.z,14);
  for(const w of c.m.userData.windows){
    w.visible=false;
  }
}

// ===== VÉHICULES, COLLISIONS SOLIDES & CARJACKING ANIMÉ
const HD=[PI/2,0,-PI/2,PI];
function spawnVehicle(kind,x,z,d){
  let vType='civ',col=0xffffff;
  if(kind==='cop'){vType='cop';col=0xf8fafc;}
  else if(kind==='me'){vType='vip';col=0xe11d48;}
  else{
    const r=R();
    if(r<0.44){vType='taxi';col=0xfacc15;}
    else if(r<0.64){vType='moto';col=0xdc2626;}
    else{const rr=R();vType=rr<0.2?'suv':rr<0.35?'pickup':rr<0.5?'van':'civ';col=[0x2563eb,0xdc2626,0x16a34a,0xf8fafc,0x475569,0xea580c][R()*6|0];}
  }
  const maxHp=kind==='cop'?150:vType==='moto'?60:vType==='vip'?160:120;
  const m=buildVehicle(col,vType);m.rotation.order='YXZ';
  let riderMesh=null; // le conducteur est créé / retiré par syncDriver()
  const c={
    m,x,z,h:HD[d],v:0,d,kind,vType,hasDriver:(kind!=='me'),riderMesh,
    hp:maxHp,maxHp,id:++cid,turned:0,rev:0,st:0,bt:0,deployed:0,smokeT:0,revLock:0,
    wheelSpin:0,steerAngle:0,windowsBroken:false
  };
  cars.push(c);return c;
}


// ===== CONDUCTEUR ASSIS (visible à travers les vitres, disparaît si on le sort)
function makeSeated(c,asPlayer){
  let prof;
  if(asPlayer)prof={shirt:0xe11d48,skin:0x7b5438,role:'player'};
  else if(c.kind==='cop')prof={shirt:0x1e3a8a,skin:0x6f4e37,role:'cop',name:'Agent Police',getReply:()=>'Halte ! Vol de véhicule !'};
  else if(c.vType==='moto')prof=NPC_PROFILES[0]&&{shirt:0xf97316,skin:0x6f4e37,role:'benskin',name:NPC_PROFILES[0].name,getReply:NPC_PROFILES[0].getReply};
  else prof=c.riderProf||NPC_PROFILES[R()*NPC_PROFILES.length|0];
  c.riderProf=asPlayer?c.riderProf:prof;
  const m=buildHuman(prof.shirt,prof.skin,prof.role),u=m.userData;
  if(c.vType==='moto'){
    m.position.set(0,0.42,-0.18);
    u.legL.rotation.x=-0.85;u.legR.rotation.x=-0.85;u.armL.rotation.x=-1.05;u.armR.rotation.x=-1.05;
  }else{
    m.scale.setScalar(0.62);m.position.set(-0.45,0.317,0.1);
    u.legL.rotation.x=-1.45;u.legR.rotation.x=-1.45;u.kneeL.rotation.x=1.5;u.kneeR.rotation.x=1.5;
    u.armL.rotation.x=-1.0;u.armR.rotation.x=-1.0;u.elbowL.rotation.x=-0.45;u.elbowR.rotation.x=-0.45;
  }
  c.m.add(m);c.riderMesh=m;c.riderIsPlayer=!!asPlayer;
}
function syncDriver(c){
  const ec=P.enteringCar;
  const seatedNow=(c===P.car)||(ec&&ec.car===c&&ec.seated);
  const want=c.hasDriver||seatedNow;
  if(want&&c.riderMesh&&c.riderIsPlayer!==!!seatedNow&&!c.hasDriver){c.m.remove(c.riderMesh);c.riderMesh=null;}
  if(want&&!c.riderMesh)makeSeated(c,!!seatedNow&&!c.hasDriver);
  else if(!want&&c.riderMesh){c.m.remove(c.riderMesh);c.riderMesh=null;}
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

function startEnterCarAnimation(c){
  if(P.enteringCar||P.car)return;
  c.v=0;
  const moto=c.vType==='moto';
  const dx=P.x-c.x,dz=P.z-c.z,ch=Math.cos(c.h),sh=Math.sin(c.h);
  const lx=ch*dx-sh*dz,lz=sh*dx+ch*dz;
  let side=(!moto&&lx>0)?'R':'L',wps=null;
  if(side==='R'&&c.hasDriver){
    // le conducteur est côté gauche : je contourne la voiture pour atteindre sa portière
    side='L';const zz=lz>=0?3.5:-3.5;
    const pt=(a,b)=>({x:c.x+ch*a+sh*b,z:c.z-sh*a+ch*b});
    wps=[pt(2.6,zz),pt(-2.6,zz)];
  }
  P.enteringCar={car:c,phase:'walk',timer:0,pulled:false,side,wps,wpi:0};
}

function updateEnterCarAnimation(dt){
  const ec=P.enteringCar;
  if(!ec)return;
  const c=ec.car;
  if(!c||c.dead){if(ec.dm){scene.remove(ec.dm);}P.enteringCar=null;return;}
  c.v=0;
  const moto=c.vType==='moto';
  const R_=ec.side==='R';
  const doorOffset=moto?-1.1:(R_?1.62:-1.62);
  const tx=c.x+Math.cos(c.h)*doorOffset;
  const tz=c.z-Math.sin(c.h)*doorOffset;
  const door=R_?c.m.userData.doorR:c.m.userData.doorL,dsign=R_?-1:1;
  const setDoor=a=>{if(door)door.rotation.y=dsign*a;};
  const seatL=moto?{x:0,z:-0.18}:{x:-0.45,z:0.1};
  const seatW={x:c.x+Math.cos(c.h)*seatL.x+Math.sin(c.h)*seatL.z,z:c.z-Math.sin(c.h)*seatL.x+Math.cos(c.h)*seatL.z};
  const U=P.m.userData;
  const ease=k=>k*k*(3-2*k);
  const OPEN=0.8,GRAB=0.7,PULL=1.1,BOARD=1.0;

  if(ec.phase==='walk'){
    let gx=tx,gz=tz,thr=0.35;
    if(ec.wps&&ec.wpi<ec.wps.length){gx=ec.wps[ec.wpi].x;gz=ec.wps[ec.wpi].z;thr=0.9;}
    const dx=gx-P.x,dz=gz-P.z,dist=Math.hypot(dx,dz);
    P.h=Math.atan2(dx,dz);
    if(dist>thr){
      const step=Math.min(dist,5.2*dt);
      P.x+=(dx/dist)*step;P.z+=(dz/dist)*step;
      P.wk+=dt*11;
      swingLimbs(P.m,P.wk,0.48,false,'walk');
      resolvePersonCarCollisions(P,0.62,c);
    }else if(ec.wps&&ec.wpi<ec.wps.length){ec.wpi++;}
    else{
      ec.phase='open';ec.timer=0;ec.px=P.x;ec.pz=P.z;
      P.h=c.h+(R_?-PI/2:PI/2);
    }
  }else if(ec.phase==='open'){
    // 1) j'ouvre la portière : le bras va à la poignée
    ec.timer+=dt;
    const k=ease(cl(ec.timer/OPEN,0,1));
    swingLimbs(P.m,0,0,false,'walk');
    U.armR.rotation.x=-1.35*k;U.elbowR.rotation.x=-0.25;U.armL.rotation.x=0.15;
    U.torso.rotation.x=0.1*k;
    setDoor(1.15*k);
    if(ec.timer>=OPEN){
      if(c.hasDriver&&c.riderMesh){ec.phase='grab';ec.timer=0;playTone(190,0.12,'square',0.04);popEmoji(c.riderMesh,'😨',2.4,3.4);}
      else{ec.phase='board';ec.timer=0;}
    }
  }else if(ec.phase==='grab'){
    // 2) j'attrape le conducteur par le col, il panique sur son siège
    ec.timer+=dt;
    const k=ease(cl(ec.timer/GRAB,0,1)),dm=c.riderMesh;
    setDoor(1.15);
    swingLimbs(P.m,0,0,false,'walk');
    U.armR.rotation.x=-1.7;U.armL.rotation.x=-1.55;U.elbowR.rotation.x=-0.35;U.elbowL.rotation.x=-0.35;
    U.torso.rotation.x=0.3+0.25*k;
    P.x=ec.px+(seatW.x-ec.px)*0.22*k;P.z=ec.pz+(seatW.z-ec.pz)*0.22*k;
    if(dm){
      const du=dm.userData;
      du.head.rotation.y=-0.9*k;
      du.armL.rotation.x=-2.0*k+Math.sin(tm*30)*0.2*k;du.armR.rotation.x=-2.0*k-Math.sin(tm*30)*0.2*k;
      du.armL.rotation.z=0.5*k;du.armR.rotation.z=-0.5*k;
      dm.rotation.z=Math.sin(tm*22)*0.05*k;
    }
    if(ec.timer>=GRAB&&dm){
      // il quitte son siège
      scene.add(dm);c.m.remove(dm);
      ec.dm=dm;ec.prof=c.riderProf||NPC_PROFILES[0];ec.s0=dm.scale.x;
      c.riderMesh=null;c.hasDriver=false;
      ec.from={x:seatW.x,z:seatW.z,y:dm.position.y};
      ec.to={x:tx-Math.cos(c.h)*1.1,z:tz+Math.sin(c.h)*1.1};
      ec.px=P.x;ec.pz=P.z;
      dm.userData.head.rotation.y=0;
      addCrime(c.kind==='cop'?2:1);witnessCrime(c.x,c.z);
      playTone(240,0.2,'sawtooth');
      showToast(moto?'Pilote délogé · Moto prise':'Conducteur extrait du véhicule');
      ec.phase='pull';ec.timer=0;
    }
  }else if(ec.phase==='pull'){
    // 3) je le tire dehors : il tombe sur la chaussée
    ec.timer+=dt;
    const k=ease(cl(ec.timer/PULL,0,1)),dm=ec.dm,du=dm.userData;
    const gy=getGroundY(ec.to.x,ec.to.z,null);
    dm.position.set(ec.from.x+(ec.to.x-ec.from.x)*k,gy+ec.from.y*(1-k)+Math.sin(k*PI)*0.3,ec.from.z+(ec.to.z-ec.from.z)*k);
    dm.scale.setScalar(ec.s0+(1-ec.s0)*k);
    dm.rotation.y=c.h-(PI/2)*k;
    dm.rotation.z=Math.sin(Math.min(1,k*1.15)*PI)*1.1*(1-k*0.2);
    du.armL.rotation.z=1.2*Math.sin(k*PI);du.armR.rotation.z=-1.2*Math.sin(k*PI);
    du.armL.rotation.x=-2.0*(1-k);du.armR.rotation.x=-2.0*(1-k);
    du.legL.rotation.x=-1.45*(1-k)+0.3*k;du.legR.rotation.x=-1.45*(1-k)-0.3*k;
    du.kneeL.rotation.x=1.5*(1-k);du.kneeR.rotation.x=1.5*(1-k);
    // je recule en le tirant
    P.x=ec.px+(tx-ec.px)*k*0.6;P.z=ec.pz+(tz-ec.pz)*k*0.6;
    U.armR.rotation.x=-1.7+k*1.2;U.armL.rotation.x=-1.55+k*1.1;
    U.torso.rotation.x=0.55-0.4*k;U.torso.rotation.y=-0.3*Math.sin(k*PI);
    setDoor(1.15);
    if(k>=1){
      dm.rotation.z=0;
      peds.push({m:dm,x:ec.to.x,z:ec.to.z,h:c.h-PI/2,t:5,fl:6,dead:0,wk:0,hp:35,profile:ec.prof,chatCd:5,stag:0.5});
      ec.dm=null;ec.phase='board';ec.timer=0;ec.px=P.x;ec.pz=P.z;
      U.torso.rotation.y=0;
    }
  }else if(ec.phase==='board'){
    // 4) je monte, je m'assois, je ferme la portière
    ec.timer+=dt;
    P.wk+=dt*8;
    swingLimbs(P.m,P.wk,0.35,false,'walk');
    const k=ease(cl(ec.timer/(BOARD*0.6),0,1));
    P.x=ec.px+(seatW.x-ec.px)*k;P.z=ec.pz+(seatW.z-ec.pz)*k;
    P.h=Math.atan2(seatW.x-P.x,seatW.z-P.z)||P.h;
    if(ec.timer>BOARD*0.5&&!ec.seated){ec.seated=true;P.m.visible=false;}
    setDoor(Math.max(0,1.15*(1-Math.max(0,ec.timer-BOARD*0.5)/(BOARD*0.45))));
    if(ec.timer>=BOARD){
      setDoor(0);
      playTone(150,0.09,'square',0.05);
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
  showToast(isBir?'Intervention d’élite BIR en cours':'Patrouille de police déployée');
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
  for(const q of peds)if(!q.dead&&q!==p&&Math.hypot(q.x-p.x,q.z-p.z)<18){q.fl=Math.max(q.fl||0,4);popEmoji(q.m,'😱',1.8);}
  playTone(190,0.22,'sawtooth',0.05);addCrime(1);witnessCrime(p.x,p.z);
  const loot=rn(25,85)|0;P.cash+=loot;showToast(`+${loot} FCFA récupérés`);
}
function explodeCar(c){
  const m=bx(3.8,3.8,3.8,0xff6d00,c.x,1.6,c.z);
  trs.push({m,t:0.55,gr:1});playTone(75,0.6,'sawtooth',0.09,25);
  if(P.car===c){P.car=null;P.m.visible=true;updateControlUI();damagePlayer(40);}
  else if(Math.hypot(c.x-P.x,c.z-P.z)<8)damagePlayer(25);
  c.dead=1;scene.remove(c.m);
}

// ===== INTERACTIONS INTELLIGENTES
function enterInterior(type,doorObj){
  interiorType=type;
  ret={x:doorObj.x,z:doorObj.z+1.6};
  const cfg=INTERIORS[type];
  P.x=cfg.ix;P.z=cfg.iz+cfg.d/2-2.2;P.h=PI;cy=PI;
  if(type==='villa'){roomCash.visible=true;roomMed.visible=true;}
  const labels={
    villa:'Villa résidentielle : récupère le cash et les soins.',
    gym:'Salle de Sport : frappe le sac de boxe pour t’entraîner.',
    restaurant:'Restaurant Le Mboa : approche le comptoir pour commander.',
    armory:'Armurerie Tactique : approche le comptoir pour t’équiper.'
  };
  if(labels[type])showToast(labels[type]);
}

function trainOnPunchingBag(){
  P.bagSwing=1.2;
  SAVE.maxStamina=Math.min(160,(SAVE.maxStamina||100)+5);
  P.stamina=SAVE.maxStamina;
  playPunchSound(true);
  showToast(`Entraînement boxe · Endurance max : ${SAVE.maxStamina}`);
  writeSave();
}

function doSmartAction(){
  if(S==='shop'){closeShop();return;}
  if(S!=='play'||P.enteringCar)return;

  if(interiorType){
    const cfg=INTERIORS[interiorType];
    if(Math.hypot(P.x-cfg.ix,P.z-(cfg.iz+cfg.d/2-1.2))<3.2){
      interiorType=null;P.x=ret.x;P.z=ret.z;streamChunks(1,P.x,P.z);return;
    }
    if(interiorType==='gym'&&Math.hypot(P.x-(IX_GYM-2.5),P.z-(IZ_GYM-1.5))<2.8){
      P.punchTimer=0.36;P.comboStep=(P.comboStep+1)%3;
      trainOnPunchingBag();return;
    }
    if(interiorType==='restaurant'&&Math.hypot(P.x-IX_RESTO,P.z-(IZ_RESTO-3.2))<3.2){
      if(P.cash>=150){
        P.cash-=150;P.hp=100;P.stamina=SAVE.maxStamina||100;
        showNpcBubble('Chef Nadine · Le Mboa','Bon appétit ! Ton Ndolé royal te remet à 100% de forme.',4);
        playTone(620,0.25,'sine');writeSave();
      }else showToast('Il te faut 150 FCFA pour commander un plat.');
      return;
    }
    if(interiorType==='armory'&&Math.hypot(P.x-IX_ARMORY,P.z-(IZ_ARMORY-2.2))<3.2){
      openShop();return;
    }
    for(const npc of interiorNPCs){
      if(npc.type===interiorType&&Math.hypot(P.x-npc.x,P.z-npc.z)<4.0){
        npc.h=Math.atan2(P.x-npc.x,P.z-npc.z);
        showNpcBubble(npc.name,npc.line,4.5);
        playTone(520,0.12,'sine');return;
      }
    }
    return;
  }

  if(P.car){
    const c=P.car,s=Math.sin(c.h),k=Math.cos(c.h);
    P.x=c.x-k*2.8;P.z=c.z+s*2.8;hitBuilding(P,0.6);
    P.car=null;c.v=0;c.kind='me';c.hasDriver=false;P.m.visible=true;updateWeaponHUD();updateControlUI();return;
  }

  const vdn=nearVendor();
  if(vdn){buyFromVendor(vdn);return;}

  const bestCar=findNearestCar(5.8);
  if(bestCar){
    startEnterCarAnimation(bestCar);return;
  }

  const d=nearDoor();
  if(d){
    enterInterior(d.type||'villa',d);return;
  }

  const npc=findNearestNPC(6.0);
  if(npc){
    npc.h=Math.atan2(P.x-npc.x,P.z-npc.z);npc.t=4;
    const line=npc.fl>0?'Laisse-moi tranquille !':getAgentReply(npc);
    showNpcBubble(npc.profile.name,line,4.5);
    playTone(520,0.12,'sine');
  }
}

// ===== COMBAT MAINS NUES (COUPS DE POING) & BALISTIQUE MULTI-ARMES
const raycaster=new THREE.Raycaster();
const crosshairNDC=new THREE.Vector2(0,0.08);

function performMeleeAttack(){
  const w=WEAPONS.fist;
  if(P.cd>0||P.car)return;
  P.cd=w.cd;
  P.punchTimer=0.36;
  const isFinisher=(P.comboStep===2);
  const dmg=isFinisher?36:w.dmg;
  P.comboStep=(P.comboStep+1)%3;

  // Légère avancée dynamique lors du coup de poing
  const fx=Math.sin(P.h),fz=Math.cos(P.h);
  P.x+=fx*0.32;P.z+=fz*0.32;
  if(interiorType){
    const cfg=INTERIORS[interiorType];
    P.x=cl(P.x,cfg.ix-cfg.w/2+0.8,cfg.ix+cfg.w/2-0.8);
    P.z=cl(P.z,cfg.iz-cfg.d/2+0.8,cfg.iz+cfg.d/2-0.8);
    // Frappe directe sur le sac de frappe de la salle de sport
    if(interiorType==='gym'&&Math.hypot(P.x-(IX_GYM-2.5),P.z-(IZ_GYM-1.5))<2.5){
      trainOnPunchingBag();return;
    }
  }else{
    hitBuilding(P,0.62);
    resolvePersonCarCollisions(P,0.68);
  }

  let landed=false;
  const gy=getGroundY(P.x,P.z,interiorType);

  // 1. Cibles humaines à portée de poing
  if(!interiorType){
    const targets=enemies.filter(e=>!e.dead).concat(copsOnFoot).concat(peds.filter(p=>!p.dead));
    for(const t of targets){
      const dx=t.x-P.x,dz=t.z-P.z,dist=Math.hypot(dx,dz);
      if(dist<=w.range){
        const dot=(dx/(dist||1))*fx+(dz/(dist||1))*fz;
        if(dot>0.3){
          landed=true;
          t.hp-=dmg;
          knock(t,fx,fz,isFinisher?12:7);
          hitBuilding(t,0.62);
          const sp=bx(0.22,0.22,0.22,0xfef08a,t.x,gy+1.35,t.z);trs.push({m:sp,t:0.1});
          if(t.profile){
            t.fl=6;
            if(t.hp<=0)killPed(t);
            else addCrime(1);
          }else if(copsOnFoot.includes(t)){
            addCrime(2);
            if(t.hp<=0){scene.remove(t.m);copsOnFoot=copsOnFoot.filter(x=>x!==t);P.cash+=50;}
          }else if(t.hp<=0&&!t.dead){
            t.dead=1;scene.remove(t.m);enemiesLeft--;
            showToast(`Cible K.O. · Restants : ${Math.max(0,enemiesLeft)}`);
          }
          break;
        }
      }
    }
  }

  // 2. Coups de poing sur les véhicules ou vitrines proches
  if(!landed&&!interiorType){
    for(const c of cars){
      const dx=c.x-P.x,dz=c.z-P.z,dist=Math.hypot(dx,dz);
      if(dist<3.1){
        const dot=(dx/(dist||1))*fx+(dz/(dist||1))*fz;
        if(dot>0.35){
          landed=true;
          c.hp-=8;
          if(isFinisher)shatterCarWindows(c);
          addCrime(c.kind==='cop'?2:1);
          if(c.hp<=0)explodeCar(c);
          break;
        }
      }
    }
  }

  if(!landed&&!interiorType){
    for(const bw of buildingWindows){
      if(!bw.broken&&Math.hypot(bw.x-P.x,bw.z-P.z)<2.3){
        bw.broken=true;bw.mesh.visible=false;
        spawnGlassShards(bw.x,2.2,bw.z,12);
        landed=true;break;
      }
    }
  }

  playPunchSound(landed);
}

function getCrosshairAimData(){
  raycaster.setFromCamera(crosshairNDC,cam);
  const ro=raycaster.ray.origin,rd=raycaster.ray.direction;

  let bestDist=(WEAPONS[SAVE.curWeapon]&&WEAPONS[SAVE.curWeapon].range)||75;
  let targetObj=null;

  if(!interiorType){
    const hLen=Math.hypot(rd.x,rd.z);
    if(hLen>0.01){
      const wDist=rayWall(ro.x,ro.z,rd.x/hLen,rd.z/hLen,bestDist*hLen)/hLen;
      if(wDist<bestDist)bestDist=wDist;
    }
  }

  const candidates=cars.filter(c=>c!==P.car)
    .concat(interiorType?[]:enemies.filter(e=>!e.dead))
    .concat(interiorType?[]:copsOnFoot)
    .concat(interiorType?[]:peds.filter(p=>!p.dead));

  for(const obj of candidates){
    const gy=getGroundY(obj.x,obj.z,interiorType);
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

function spawnBullet(ox,oy,oz,dirVec,speed,dmg,fromPlayer,col=0xfef08a,lifeT=0.85){
  const g=new THREE.Group();
  const slug=new THREE.Mesh(new THREE.SphereGeometry(0.06,6,6),new THREE.MeshBasicMaterial({color:0xffffff}));
  const trail=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.004,1.25,6),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.88}));
  trail.rotation.x=PI/2;trail.position.z=-0.62;
  g.add(slug,trail);
  g.position.set(ox,oy,oz);
  g.lookAt(ox+dirVec.x,oy+dirVec.y,oz+dirVec.z);
  scene.add(g);
  bullets.push({
    m:g,x:ox,y:oy,z:oz,
    vx:dirVec.x*speed,vy:dirVec.y*speed,vz:dirVec.z*speed,
    life:lifeT,fromPlayer,dmg
  });
}

const clampLife=v=>Math.max(0.6,Math.min(3.2,v));
function fireWeapon(aimData){
  const id=SAVE.curWeapon,w=WEAPONS[id];
  if(w.melee){
    performMeleeAttack();
    return;
  }
  if(P.cd>0||P.reloadTimer>0)return;
  witnessCrime(P.x,P.z);
  if((SAVE.mag[id]||0)<=0){
    reloadWeapon();return;
  }

  SAVE.mag[id]--;
  P.cd=w.cd;
  updateWeaponHUD();

  const hp=aimData.hitPoint;
  const aimYaw=Math.atan2(hp.x-P.x,hp.z-P.z);
  if(!P.car)P.h=aimYaw;

  const gy=getGroundY(P.x,P.z,interiorType);
  const muzzleX=P.x+Math.sin(aimYaw)*0.85+Math.cos(aimYaw)*0.25;
  const muzzleZ=P.z+Math.cos(aimYaw)*0.85-Math.sin(aimYaw)*0.25;
  const muzzleY=gy+(P.car?1.35:1.45)+P.y;

  const baseDir=new THREE.Vector3(hp.x-muzzleX,hp.y-muzzleY,hp.z-muzzleZ).normalize();

  const flash=new THREE.Mesh(new THREE.SphereGeometry(0.18,6,6),new THREE.MeshBasicMaterial({color:0xffab00}));
  flash.position.set(muzzleX,muzzleY,muzzleZ);scene.add(flash);
  trs.push({m:flash,t:0.045});

  const col=id==='rifle'?0xef4444:id==='sniper'?0x38bdf8:id==='smg'?0xf97316:0xfef08a;
  for(let p=0;p<w.pellets;p++){
    const d=baseDir.clone();
    d.x+=rn(-w.spread,w.spread);
    d.y+=rn(-w.spread*0.6,w.spread*0.6);
    d.z+=rn(-w.spread,w.spread);
    d.normalize();
    spawnBullet(muzzleX,muzzleY,muzzleZ,d,w.spd,w.dmg,true,col,clampLife((w.range||110)/w.spd+0.12));
  }
  playGunshot(id);

  if((SAVE.mag[id]||0)===0)setTimeout(reloadWeapon,120);
  if(!interiorType)for(const p of peds)if(!p.dead&&Math.hypot(p.x-P.x,p.z-P.z)<45)p.fl=5;
}

function updateBullets(dt){
  for(const b of bullets){
    b.life-=dt;
    if(b.life<=0){b.dead=1;scene.remove(b.m);continue;}
    const stepX=b.vx*dt,stepY=b.vy*dt,stepZ=b.vz*dt;
    const stepDist=Math.hypot(stepX,stepY,stepZ);
    const fx=stepX/(stepDist||1),fz=stepZ/(stepDist||1);

    if(!interiorType){
      for(const bw of buildingWindows){
        if(!bw.broken&&Math.hypot(bw.x-b.x,bw.z-b.z)<1.8&&b.y<3.4){
          bw.broken=true;bw.mesh.visible=false;
          spawnGlassShards(bw.x,2.2,bw.z,12);
        }
      }
      if(rayWall(b.x,b.z,fx,fz,stepDist)<stepDist){
        const sp=bx(0.18,0.18,0.18,0xfef08a,b.x,b.y,b.z);trs.push({m:sp,t:0.08});
        b.dead=1;scene.remove(b.m);continue;
      }
    }

    b.x+=stepX;b.y+=stepY;b.z+=stepZ;
    b.m.position.set(b.x,b.y,b.z);
    if(b.y<=0.02){b.dead=1;scene.remove(b.m);continue;}

    if(b.fromPlayer){
      let hit=null;
      for(const c of cars){
        if(c===P.car)continue;
        const gy=getGroundY(c.x,c.z,null);
        if(Math.hypot(c.x-b.x,c.z-b.z)<(c.vType==='moto'?1.2:2.2)&&Math.abs(b.y-(gy+1.0))<1.3){hit=c;break;}
      }
      if(!hit&&!interiorType){
        for(const t of enemies.concat(copsOnFoot).concat(peds.filter(p=>!p.dead))){
          if(t.dead)continue;
          const gy=getGroundY(t.x,t.z,null);
          if(Math.hypot(t.x-b.x,t.z-b.z)<0.95&&Math.abs(b.y-(gy+1.1))<1.2){hit=t;break;}
        }
      }
      if(hit){
        const sp=bx(0.22,0.22,0.22,hit.vType?0xf97316:0xef4444,b.x,b.y,b.z);trs.push({m:sp,t:0.09});
        hit.hp-=b.dmg;
        if(hit.vType===undefined){const bl=Math.hypot(b.vx,b.vz)||1;knock(hit,b.vx/bl,b.vz/bl,2.6);hit.alert=8;}
        if(hit.vType!==undefined){
          if(b.y>1.08)shatterCarWindows(hit);
          addCrime(hit.kind==='cop'?2:1);
          if(hit.hp<=0)explodeCar(hit);
        }else if(hit.profile){
          if(hit.hp<=0)killPed(hit);
        }else if(copsOnFoot.includes(hit)){
          addCrime(2);
          if(hit.hp<=0){scene.remove(hit.m);copsOnFoot=copsOnFoot.filter(x=>x!==hit);P.cash+=50;}
        }else if(hit.hp<=0&&!hit.dead){
          hit.dead=1;scene.remove(hit.m);enemiesLeft--;
          showToast(`Cible neutralisée · Restants : ${Math.max(0,enemiesLeft)}`);
        }
        b.dead=1;scene.remove(b.m);
      }
    }else{
      const gy=getGroundY(P.x,P.z,interiorType);
      if(P.car&&Math.hypot(P.car.x-b.x,P.car.z-b.z)<2.2){
        P.car.hp-=b.dmg;if(R()<0.3)shatterCarWindows(P.car);b.dead=1;scene.remove(b.m);
      }else if(!P.car&&Math.hypot(P.x-b.x,P.z-b.z)<0.95&&Math.abs(b.y-(gy+P.y+1.1))<1.2){
        damagePlayer(b.dmg);b.dead=1;scene.remove(b.m);
      }
    }
  }
  bullets=bullets.filter(b=>!b.dead);
}

// ===== CONDUITE, ROUES BRAQUABLES & MARCHE ARRIÈRE
const DMGC=new THREE.Color(0x1c1917);
function animateCarWheels(c,dt){
  syncDriver(c);
  if(c.m.userData.steerWheel)c.m.userData.steerWheel.rotation.z=-c.steerAngle*3.2;
  if(c.riderMesh&&c.vType!=='moto'&&!(P.enteringCar&&P.enteringCar.car===c)){
    const ru=c.riderMesh.userData,st=c.steerAngle||0;
    ru.armL.rotation.z=0.05+st*0.6;ru.armR.rotation.z=-0.05+st*0.6;
    ru.head.rotation.y=-st*0.9;ru.torso.rotation.z=-st*0.12;
  }
  {
    if(c.lv===undefined)c.lv=c.v;
    const acc=(c.v-c.lv)/Math.max(dt,1e-3);c.lv=c.v;
    const tp=cl(-acc*0.0028,-0.06,0.07);
    c.pitch=(c.pitch||0)+(tp-(c.pitch||0))*Math.min(1,dt*6);
    c.m.rotation.x=c.pitch;
    if(c.vType!=='moto'){
      const tr=cl(c.steerAngle*cl(c.v/28,-1,1)*0.22,-0.09,0.09);
      c.roll=(c.roll||0)+(tr-(c.roll||0))*Math.min(1,dt*6);
      c.m.rotation.z=c.roll;
    }
    const bm=c.m.userData.bodyMat;
    if(bm){
      const dmg=1-c.hp/c.maxHp;
      if(Math.abs(dmg-(c.dmgShown||0))>0.04){
        c.dmgShown=dmg;if(!c.baseCol)c.baseCol=bm.color.clone();
        bm.color.copy(c.baseCol).lerp(DMGC,Math.min(0.75,dmg*0.9));bm.roughness=0.22+dmg*0.5;
      }
    }
  }
  if(!c.m.userData.wheels)return;
  c.wheelSpin+=c.v*dt*2.2;
  for(const w of c.m.userData.wheels)w.rotation.x=c.wheelSpin;
  if(c.m.userData.steerPivots){
    for(const p of c.m.userData.steerPivots)p.rotation.y=c.steerAngle;
  }
}

function drivePlayerCar(c,dt,i){
  const maxSpd=c.vType==='moto'?38:c.vType==='vip'?37:33;
  const steerInput=cl(-i.x,-1,1);
  c.steerAngle+=(steerInput*0.42-c.steerAngle)*Math.min(1,dt*12);

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
  if(i.brake&&c.v>14&&c.vType!=='moto'){
    c.skT=(c.skT||0)-dt;
    if(c.skT<=0){c.skT=0.05;for(const sx of[-1.04,1.04]){
      const wx=c.x+Math.cos(c.h)*sx-Math.sin(c.h)*1.48,wz=c.z-Math.sin(c.h)*sx-Math.cos(c.h)*1.48;
      trs.push({m:bx(0.4,0.4,0.4,0xcbd5e1,wx,0.35,wz),t:0.5,gr:1});}}
  }
  const turnFactor=cl(Math.abs(c.v)/3.2,0.22,1);
  const dir=c.v>=-0.05?1:-1;
  c.h+=steerInput*(c.vType==='moto'?3.2:2.65)*turnFactor*dir*dt;

  if(c.vType==='moto'){
    c.m.rotation.z+=(-steerInput*0.32*turnFactor-c.m.rotation.z)*Math.min(1,dt*10);
  }

  c.x+=Math.sin(c.h)*c.v*dt;
  c.z+=Math.cos(c.h)*c.v*dt;

  if(hitBuilding(c,c.vType==='moto'?1.2:2.1)){
    if(Math.abs(c.v)>12){c.hp-=Math.abs(c.v)*0.32;shatterCarWindows(c);playTone(105,0.14,'sawtooth');}
    c.v*=-0.2;
  }
}

function isBlocked(c){
  const fx=Math.sin(c.h),fz=Math.cos(c.h);
  const ck=(o,fl,sl)=>{const dx=o.x-c.x,dz=o.z-c.z,f=dx*fx+dz*fz,s=Math.abs(dx*fz-dz*fx);return f>1&&f<fl&&s<sl;};
  for(const o of cars)if(o!==c&&ck(o,10,2.8))return 1;
  if(!P.car&&!interiorType&&ck(P,9,2))return 1;
  for(const p of peds)if(!p.dead&&ck(p,8,1.8))return 1;
  return 0;
}

function updateAICar(c,dt){
  const chase=c.kind==='cop'&&stars>0&&S==='play';
  if(c.kind==='cop'&&c.m.userData.l1){
    const fl=Math.sin(tm*15)>0;
    c.m.userData.l1.material.color.setHex(fl?0xef4444:0x450a0a);
    c.m.userData.l2.material.color.setHex(!fl?0x3b82f6:0x172554);
  }
  let tv=null;
  if(c.kind==='me'||!c.hasDriver)c.v-=c.v*Math.min(1,2*dt);
  else if(c.rev>0){c.rev-=dt;c.v=-6;c.h+=dt*2;}
  else if(chase){
    const dist=Math.hypot(P.x-c.x,P.z-c.z);
    const diff=angd(c.h,Math.atan2(P.x-c.x,P.z-c.z));
    c.h-=diff*Math.min(1,dt*2.9);
    c.steerAngle=cl(-diff*0.5,-0.4,0.4);
    if(dist<15){
      tv=0;
      if(Math.abs(c.v)<3)deployCopsFromCar(c);
    }else tv=26;
  }else{
    const ix=Math.round(c.x/CS)*CS,iz=Math.round(c.z/CS)*CS,inI=Math.abs(c.x-ix)<9&&Math.abs(c.z-iz)<9;
    const diff=angd(c.h,HD[c.d]);
    c.h-=diff*Math.min(1,dt*6);
    c.steerAngle=cl(-diff*0.6,-0.35,0.35);
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
    if(!inI){
      const ax=c.d%2===0?'x':'z',pos=ax==='x'?c.x:c.z,fw=(c.d===0||c.d===1)?1:-1;
      const ahead=fw>0?(Math.ceil(pos/CS+1e-6)*CS-pos):(pos-Math.floor(pos/CS-1e-6)*CS);
      const st=sigState(ax);
      if(ahead<30&&ahead>9.5&&(st==='r'||(st==='y'&&ahead>16)))tv=Math.min(tv,Math.max(0,(ahead-11)*1.1));
    }
  }
  if(tv!==null){
    if(!chase&&isBlocked(c)){c.bt+=dt;if(c.bt<3)tv=0;if(c.bt>1.4&&Math.hypot(c.x-P.x,c.z-P.z)<45&&((c.honk=(c.honk||0)-dt)<=0)){c.honk=rn(3,5);playHorn();}}else c.bt=0;
    c.v+=(tv-c.v)*Math.min(1,dt*2.5);
  }
  c.x+=Math.sin(c.h)*c.v*dt;c.z+=Math.cos(c.h)*c.v*dt;
  if(hitBuilding(c,2.0)&&c.kind!=='me'){c.v*=0.3;c.st+=dt;if(c.st>0.6){c.rev=0.9;c.st=0;}}
}

// ===== BOUCLE PRINCIPALE
let slowF=0,qStep=0;
function update(dt){
  tm+=dt;
  if(qStep<4&&S==='play'){
    if(dt>0.045)slowF++;else slowF=Math.max(0,slowF-1);
    if(slowF>120){
      slowF=0;qStep++;
      window.QUALITY=window.QUALITY||{water:true,rain:true};
      if(qStep===1){sun.castShadow=false;showToast('Ombres désactivées pour garder la fluidité');}
      else if(qStep===2){ren.setPixelRatio(1);ren.setSize(innerWidth,innerHeight);showToast('Résolution réduite pour plus de fluidité');}
      else if(qStep===3){CHUNK_R=1;QUALITY.water=false;showToast('Distance d’affichage réduite');}
      else{QUALITY.rain=false;showToast('Effets de pluie désactivés');}
    }
  }
  const i=getInput(),pl=S==='play';
  const curWep=WEAPONS[SAVE.curWeapon];
  const isUnarmed=!!curWep.melee;
  const isAiming=pl&&!P.car&&!P.enteringCar&&!!i.aim;
  const maxStam=SAVE.maxStamina||100;

  if(pl){
    if(SAVE.set.time==='auto')dayTime=(dayTime+dt*0.045)%24;else dayTime=TPRESET[SAVE.set.time]||14;
    const isNight=dayTime<6||dayTime>19;
    const isDusk=(dayTime>=17.5&&dayTime<=19)||(dayTime>=6&&dayTime<=7.2);
    skyAt(dayTime,scene.background);
    scene.fog.color.copy(scene.background);
    const sAng=(dayTime-6)/12*PI,elev=Math.sin(sAng);
    const sunUp=Math.max(0,elev);
    hemi.intensity=0.5+0.45*sunUp;
    sun.intensity=isNight?0.32:(0.25+0.85*Math.min(1,sunUp*1.6));
    sun.color.setHex(isNight?0x8fa8ff:(sunUp<0.3?0xffb070:0xffeed4));
    const sdx=Math.cos(sAng)*90,sdy=isNight?90:Math.max(25,Math.abs(elev)*120),sdz=40;
    sun.position.set(P.x+sdx,sdy,P.z+sdz);sun.target.position.set(P.x,0,P.z);
    starMat.opacity+=((isNight?0.95:(isDusk?0.25:0))-starMat.opacity)*dt*1.5;
    starPts.position.set(cam.position.x,0,cam.position.z);
    updateSignals();
    updateWeather(dt);
    const glowTarget=isNight?0.85:(isDusk?0.4:0);
    for(const m of buildingMats)m.emissiveIntensity+=(glowTarget-m.emissiveIntensity)*dt*2;
    beamMat.opacity=isNight?0.24:(isDusk?0.14:0);
    const lit=isNight?0xfef9c3:(isDusk?0xd9d29a:0x8b8f7a);
    headlightMat.color.setHex(lit);lampBulbMat.color.setHex(isNight?0xfef08a:(isDusk?0xcdbf72:0x6b6f66));
    lampGlowMat.opacity=isNight?0.22:(isDusk?0.12:0.0);
  }

  if(!interiorType&&S!=='pause'&&S!=='shop'&&S!=='map'){
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

  if(S==='cutscene'&&contactNPC){
    cutsceneTime+=dt;
    const cdx=P.x-contactNPC.x,cdz=P.z-contactNPC.z,cd=Math.hypot(cdx,cdz)||1;
    contactNPC.h=Math.atan2(cdx,cdz);P.h=contactNPC.h+PI;
    if(cutsceneTime<2.4&&cd>2.2){
      // le contact s'avance vers le joueur
      const stp=Math.min(cd-2.2,3.4*dt);
      contactNPC.x+=cdx/cd*stp;contactNPC.z+=cdz/cd*stp;
      swingLimbs(contactNPC.m,cutsceneTime*9,0.5,false,'walk');
      swingLimbs(P.m,0,0,false,'walk');
    }else{
      swingLimbs(P.m,cutsceneTime*2.6,0,false,'talk');
      swingLimbs(contactNPC.m,cutsceneTime*3.8,0,false,'talk');
      // sous-titres qui s'écrivent
      if(!briefShown){
        const n=Math.floor(Math.max(0,cutsceneTime-2.4)*30);
        $('cine-text').textContent=(activeMission.briefing||'').slice(0,n);
      }
    }
    if(!briefShown&&cutsceneTime>=cutEnd)showBriefModal();
  }

  for(const npc of interiorNPCs){
    npc.m.position.set(npc.x,0.15,npc.z);
    npc.m.rotation.y=npc.h;
    swingLimbs(npc.m,tm*2.2,0,false,'talk');
  }
  if(P.bagSwing>0){
    P.bagSwing=Math.max(0,P.bagSwing-dt*1.8);
    punchingBag.rotation.x=Math.sin(tm*16)*P.bagSwing*0.45;
  }else punchingBag.rotation.x=0;

  if(pl){
    P.cd=Math.max(0,P.cd-dt);P.inv=Math.max(0,P.inv-dt);
    if(P.punchTimer>0)P.punchTimer=Math.max(0,P.punchTimer-dt);
    if(P.reloadTimer>0){
      P.reloadTimer-=dt;
      if(P.reloadTimer<=0){P.reloadTimer=0;finishReload();}
    }
    if(P.y>0||P.vy>0){P.y+=P.vy*dt;P.vy-=18*dt;if(P.y<=0){P.y=0;P.vy=0;}}

    const aimData=getCrosshairAimData();
    P.m.userData.laser.visible=!isUnarmed&&isAiming&&P.reloadTimer<=0;

    // Réticule masqué lorsque mains nues (sauf en garde de boxe), actif avec arme à feu
    const chEl=$('crosshair');
    chEl.style.display=(isUnarmed&&!isAiming)?'none':'block';
    chEl.classList.toggle('aiming',!isUnarmed&&isAiming);
    chEl.classList.toggle('guard',isUnarmed&&isAiming);
    chEl.classList.toggle('locked',!isUnarmed&&!!aimData.targetObj);

    if(P.enteringCar){
      updateEnterCarAnimation(dt);
    }else if(P.car){
      drivePlayerCar(P.car,dt,i);
      P.x=P.car.x;P.z=P.car.z;P.h=P.car.h;
      if(!lid){
        const targetCamH=P.car.v<-1.5?P.car.h+PI:P.car.h;
        cy-=angd(cy,targetCamH)*Math.min(1,dt*2.2);
      }
      P.stamina=Math.min(maxStam,P.stamina+15*dt);
      if(Math.hypot(P.x-GAS_X,P.z-GAS_Z)<12&&P.car.hp<P.car.maxHp){
        P.car.hp=Math.min(P.car.maxHp,P.car.hp+35*dt);
        if(R()<0.08)showToast('Station-service : Réparation du véhicule...');
      }
    }else{
      const m=Math.hypot(i.x,i.y);
      const sprinting=i.run&&!isAiming&&P.stamina>4&&m>0.1;
      if(sprinting)P.stamina=Math.max(0,P.stamina-20*dt);
      else P.stamina=Math.min(maxStam,P.stamina+16*dt);

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
        if(!isAiming&&(!i.fire||isUnarmed))P.h-=angd(P.h,th)*Math.min(1,dt*14);
        P.x+=Math.sin(th)*sp*dt;P.z+=Math.cos(th)*sp*dt;
        P.wk+=dt*sp*1.9;
      }
      if(interiorType){
        const cfg=INTERIORS[interiorType];
        P.x=cl(P.x,cfg.ix-cfg.w/2+0.8,cfg.ix+cfg.w/2-0.8);
        P.z=cl(P.z,cfg.iz-cfg.d/2+0.8,cfg.iz+cfg.d/2-0.8);
        for(const q of cfg.obs){
          const x=cl(P.x,q[0],q[2]),z=cl(P.z,q[1],q[3]),dx=P.x-x,dz=P.z-z,d2=dx*dx+dz*dz;
          if(d2<0.36){const d=Math.sqrt(d2)||0.01;P.x+=dx/d*(0.6-d);P.z+=dz/d*(0.6-d);}
        }
        if(interiorType==='villa'){
          if(roomCash.visible&&Math.hypot(P.x-roomCash.position.x,P.z-roomCash.position.z)<2.1){
            roomCash.visible=false;P.cash+=150;writeSave();showToast('+150 FCFA récupérés');playTone(840,0.22,'sine');
          }
          if(roomMed.visible&&Math.hypot(P.x-roomMed.position.x,P.z-roomMed.position.z)<2.1){
            roomMed.visible=false;P.hp=Math.min(100,P.hp+50);writeSave();showToast('+50 Santé');playTone(620,0.25,'sine');
          }
        }
      }else{
        hitBuilding(P,0.62);
        resolvePersonCarCollisions(P,0.68);
      }
    }

    if(i.fire&&!P.enteringCar)fireWeapon(aimData);
    updateBullets(dt);

    const tgt=getActiveTarget();
    beacon.visible=!interiorType&&!!tgt;
    bRing.rotation.y+=dt*2.4;
    if(tgt){
      const bGy=getGroundY(tgt.tx,tgt.tz,null);
      beacon.position.set(tgt.tx,bGy,tgt.tz);
      bRing.material.color.setHex(tgt.isCustom?0x22c55e:0xeab308);
      bBeam.material.color.setHex(tgt.isCustom?0x22c55e:0xeab308);

      const pGy=getGroundY(P.x,P.z,interiorType);
      gpsArrow.visible=!interiorType;
      gpsArrow.position.set(P.x,pGy+(P.car?3.1:3.25+P.y)+Math.sin(tm*4)*0.08,P.z);
      gpsArrow.rotation.y=Math.atan2(tgt.tx-P.x,tgt.tz-P.z);
    }else gpsArrow.visible=false;

    if(customWaypoint&&Math.hypot(P.x-customWaypoint.x,P.z-customWaypoint.z)<6){
      customWaypoint=null;showToast('Arrivé au repère GPS');playTone(760,0.2,'sine');
    }

    if(!interiorType&&activeMission){
      if(missionPhase==='approach_contact'){
        const distC=Math.hypot(P.x-activeMission.cx,P.z-activeMission.cz);
        $('mc-dist').textContent=`Contact : ${Math.round(distC)} m`;
        if(distC<4.2)triggerMissionBriefing();
      }else if(missionPhase==='active'){
        missionTimeLeft-=dt;
        const dist=Math.hypot(P.x-activeMission.tx,P.z-activeMission.tz);
        $('mc-timer').textContent=`${Math.max(0,Math.ceil(missionTimeLeft))}s`;
        $('mc-dist').textContent=activeMission.type==='combat'?`Cibles : ${Math.max(0,enemiesLeft)}`:`Distance : ${Math.round(dist)} m`;
        if(missionTimeLeft<=0){showToast('Temps écoulé · Retourne voir le contact');prepareNextMission();}
        else if(activeMission.type==='combat'){
          if(enemiesLeft<=0){
            if(activeMission.then){
              const th=activeMission.then;
              activeMission.type=null;activeMission.tx=th.x;activeMission.tz=th.z;activeMission.objective=th.label;activeMission.then=null;
              missionTimeLeft+=25;addCrime(Math.max(stars,3));
              showToast('Cibles éliminées ! Fuis vers la base (+25 s)');playTone(880,0.3,'sine');updateMissionCardUI();
            }else{
              P.cash+=activeMission.reward;SAVE.missionIdx++;writeSave();
              showToast(`Contrat réussi · +${activeMission.reward} FCFA`);playTone(880,0.4,'sine',0.07);prepareNextMission();
            }
          }
        }else if(dist<5.5){
          if(activeMission.legs&&legI<activeMission.legs.length-1){
            legI++;const L=activeMission.legs[legI];
            activeMission.tx=L.x;activeMission.tz=L.z;activeMission.objective=L.label;
            showToast(`Étape ${legI+1}/${activeMission.legs.length} validée`);playTone(760,0.2,'sine');updateMissionCardUI();
          }else{
            P.cash+=activeMission.reward;if(SAVE.missionIdx<STORY_MISSIONS.length)SAVE.missionIdx++;writeSave();
            showToast(`Contrat réussi · +${activeMission.reward} FCFA`);playTone(880,0.4,'sine',0.07);prepareNextMission();
          }
        }
      }
    }

    if(!interiorType){
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
      interiorType=null;P.x=3*CS+18;P.z=3*CS+12;P.hp=100;P.inv=2;P.cash=Math.max(0,P.cash-150);
      stars=0;S='play';$('wasted').style.display='none';streamChunks(true,P.x,P.z);writeSave();
      showToast('Hôpital Central de Yaoundé · -150 FCFA');
    }
  }

  if(!interiorType&&S!=='pause'&&S!=='shop'&&S!=='map'){
    for(const c of cars){
      if(c!==P.car&&(!P.enteringCar||P.enteringCar.car!==c))updateAICar(c,dt);
      if(c===P.car||(Math.abs(c.x-P.x)<150&&Math.abs(c.z-P.z)<150))animateCarWheels(c,dt);
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
          if(dv>13){shatterCarWindows(p);shatterCarWindows(q);}
          if(P.car===p||P.car===q){playTone(115,0.12,'sawtooth');if(p.kind==='cop'||q.kind==='cop')addCrime(2);}
        }
        const avg=(p.v+q.v)*0.35;
        p.v=avg;q.v=avg;
      }
    }
    for(const c of cars)if(c.hp<=0&&!c.dead)explodeCar(c);
    cars=cars.filter(c=>!c.dead);
    if(P.car&&P.car.dead){P.car=null;updateControlUI();}
    P.m.visible=!P.car&&!(P.enteringCar&&P.enteringCar.seated);

    for(const cp of copsOnFoot){
      const d=Math.hypot(P.x-cp.x,P.z-cp.z);
      cp.h=Math.atan2(P.x-cp.x,P.z-cp.z);
      if(d>10&&d<68&&!cp.hold){
        cp.x+=Math.sin(cp.h)*4.8*dt;cp.z+=Math.cos(cp.h)*4.8*dt;cp.wk+=dt*9.5;
        hitBuilding(cp,0.62);resolvePersonCarCollisions(cp,0.65);
      }
      cp.cd-=dt;
      if(d<40&&cp.cd<=0&&S==='play'){
        cp.cd=cp.isBir?0.95:1.35;
        const fx=(P.x-cp.x)/d,fz=(P.z-cp.z)/d;
        if(rayWall(cp.x,cp.z,fx,fz,d)>=d-0.6){
          const gy=getGroundY(cp.x,cp.z,null);
          const dirV=new THREE.Vector3(P.x-cp.x,0,P.z-cp.z).normalize();
          spawnBullet(cp.x+fx*0.8,gy+1.35,cp.z+fz*0.8,dirV,95,cp.isBir?11:8,false,0xef4444);
          playGunshot('pistol');
        }
      }
      const cGy=getGroundY(cp.x,cp.z,null);
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
      if(p.fl>0){p.fl-=dt;p.h=Math.atan2(p.x-P.x,p.z-P.z);p.cross=null;if(!p.emoOn){p.emoOn=1;popEmoji(p.m,'😱',1.5);}}
      else{
        p.emoOn=0;
        if(p.call>0||p.film>0){
          p.h=Math.atan2(P.x-p.x,P.z-p.z);
          if(p.call>0){p.call-=dt;if(p.call<=0&&!p.dead){addCrime(Math.max(1,stars));wT=Math.max(wT,14);showToast('📞 Un témoin a appelé la police !');}}
          if(p.film>0){p.film-=dt;if(stars>0)wT=Math.min(22,wT+dt*0.8);}
        }
        if(!p.greeted&&!P.car&&Math.hypot(p.x-P.x,p.z-P.z)<5&&R()<0.015){p.greeted=1;popEmoji(p.m,R()<0.5?'👋':'😊',1.5);}
        const plx=((p.x%CS)+CS)%CS,plz=((p.z%CS)+CS)%CS;
        const onRoad=plx<9||plx>71||plz<9||plz>71;
        if(p.cross){
          p.h=p.cross.h;
          if(onRoad)p.cross.on=1;else if(p.cross.on)p.cross=null;
        }else if(onRoad){
          p.h=Math.atan2(40-plx,40-plz);   // revient sur le trottoir
        }else{
          p.t-=dt;if(p.t<0){p.t=rn(1.5,4.5);p.h+=rn(-1.3,1.3);}
          p.xT=(p.xT||rn(1,4))-dt;
          if(p.xT<=0){
            p.xT=rn(3,7);
            const okA=(plz>=9&&plz<=30)||(plz>=50&&plz<=71),okB=(plx>=9&&plx<=30)||(plx>=50&&plx<=71);
            let ch=null;
            if(plx<12&&okA)ch=-PI/2;else if(plx>68&&okA)ch=PI/2;
            else if(plz<12&&okB)ch=PI;else if(plz>68&&okB)ch=0;
            if(ch!==null&&R()<0.55&&!cars.some(c=>Math.abs(c.v)>2&&Math.hypot(c.x-p.x,c.z-p.z)<16)){
              const nx=p.x+Math.sin(ch)*22,nz=p.z+Math.cos(ch)*22;
              if(nx>8&&nz>8&&nx<WS-8&&nz<WS-8)p.cross={h:ch,on:0};
            }
          }
        }
      }
      const sp=(p.call>0||p.film>0)?0:(p.fl>0?7.4:(p.cross?2.9:2.1));
      p.x+=Math.sin(p.h)*sp*dt;p.z+=Math.cos(p.h)*sp*dt;p.wk+=dt*sp*2;
      if(hitBuilding(p,0.62))p.h+=PI*rn(0.6,1.4);
      resolvePersonCarCollisions(p,0.65);
      p.hitCd=Math.max(0,(p.hitCd||0)-dt);
      for(const c of cars){
        const dd=Math.hypot(c.x-p.x,c.z-p.z),av=Math.abs(c.v);
        if(av>3&&dd<2.4&&p.hitCd<=0){
          if(av>10){knock(p,Math.sin(c.h)*Math.sign(c.v),Math.cos(c.h)*Math.sign(c.v),9);killPed(p);}
          else{p.hp-=av*2.5;p.hitCd=0.8;p.fl=5;knock(p,Math.sin(c.h)*Math.sign(c.v),Math.cos(c.h)*Math.sign(c.v),av*0.8);playTone(150,0.1,'square',0.04);if(c.kind==='me')addCrime(1);if(p.hp<=0)killPed(p);}
          break;
        }
      }
    }
    peds=peds.filter(p=>!p.rm);

    for(const e of enemies){
      if(e.dead)continue;
      const d=Math.hypot(P.x-e.x,P.z-e.z);
      e.h=Math.atan2(P.x-e.x,P.z-e.z);
      e.alert=Math.max(0,(e.alert||0)-dt);
      if(d>12&&(d<45||e.alert>0)){e.x+=Math.sin(e.h)*3.6*dt;e.z+=Math.cos(e.h)*3.6*dt;e.wk+=dt*7.5;hitBuilding(e,0.62);resolvePersonCarCollisions(e,0.65);}
      e.cd-=dt;
      if(d<38&&e.cd<=0&&S==='play'){
        e.cd=1.4;
        const fx=(P.x-e.x)/d,fz=(P.z-e.z)/d;
        if(rayWall(e.x,e.z,fx,fz,d)>=d-0.6){
          const gy=getGroundY(e.x,e.z,null);
          const dirV=new THREE.Vector3(P.x-e.x+rn(-1,1)*d*0.025,0,P.z-e.z+rn(-1,1)*d*0.025).normalize();
          spawnBullet(e.x+fx*0.8,gy+1.35,e.z+fz*0.8,dirV,95,10,false,0xf97316,0.6);
          playGunshot('pistol');
        }
      }
      const eGy=getGroundY(e.x,e.z,null);
      e.m.position.set(e.x,eGy,e.z);e.m.rotation.y=e.h;swingLimbs(e.m,e.wk,0.45,false);
    }
  }

  if(!interiorType&&S!=='pause'&&S!=='shop'&&S!=='map'){
    resolveBodies(dt);
    updateAmbientAudio();
    updateActivities(dt);
    rbT-=dt;
    if(stars>=3&&S==='play'&&rbT<=0&&!cars.some(c=>c.rb)){rbT=28;spawnRoadblock();}
    if(stars===0)for(const c of cars)if(c.rb&&Math.hypot(c.x-P.x,c.z-P.z)>50){scene.remove(c.m);c.dead=1;}
    updateHeli(dt);
    if(P.car&&S==='play'){
      const c=P.car,ix=Math.round(c.x/CS)*CS,iz=Math.round(c.z/CS)*CS,inI=Math.abs(c.x-ix)<7&&Math.abs(c.z-iz)<7;
      if(inI&&!c.redDone){
        c.redDone=1;
        const ax=Math.abs(Math.sin(c.h))>Math.abs(Math.cos(c.h))?'x':'z';
        if(sigState(ax)==='r'&&Math.abs(c.v)>6&&cars.some(o=>o.kind==='cop'&&o.hasDriver&&Math.hypot(o.x-c.x,o.z-c.z)<45)){addCrime(1);showToast('Feu rouge grillé devant la police !');}
      }else if(!inI)c.redDone=0;
    }
  }
  if(heli&&stars<4){scene.remove(heli.m);scene.remove(heli.beam);heli=null;}
  for(const p of peds){
    const gy=getGroundY(p.x,p.z,null);
    p.m.position.set(p.x,p.dead?gy+0.35:gy,p.z);
    if(!p.dead){
      p.m.rotation.y=p.h;swingLimbs(p.m,p.wk,0.45,p.fl>0);
      if(p.stag>0){const k=Math.min(1,p.stag*2);p.m.rotation.x=-0.4*k;const u=p.m.userData;u.armL.rotation.x=-2.1*k;u.armR.rotation.x=-1.9*k;u.head.rotation.x=-0.3*k;}
      else p.m.rotation.x=0;
    }
  }
  for(const c of cars){
    const gy=getGroundY(c.x,c.z,null);
    c.m.position.set(c.x,gy,c.z);c.m.rotation.y=c.h;
  }
  if(contactNPC){
    contactNPC.m.position.set(contactNPC.x,contactNPC.y,contactNPC.z);
    contactNPC.m.rotation.y=contactNPC.h;
  }
  const playerGy=getGroundY(P.x,P.z,interiorType);
  P.m.position.set(P.x,playerGy+P.y,P.z);
  P.m.rotation.y=P.h;
  P.m.userData.gun.visible=!P.car&&!isUnarmed&&P.punchTimer<=0;

  if(S!=='cutscene'&&!P.enteringCar){
    const isMoving=!P.car&&(Math.hypot(i.x,i.y)>0.05||!!P.enteringCar);
    const animMode=P.punchTimer>0?'punch':(isUnarmed&&isAiming)?'guard':P.reloadTimer>0?'reload':'walk';
    const actT=P.punchTimer>0?P.punchTimer:tm;
    swingLimbs(P.m,P.wk,isMoving?0.48:0.04,i.run&&!isAiming,animMode,actT,P.comboStep);
  }
  for(const t of trs){
    t.t-=dt;
    if(t.gr)t.m.scale.setScalar(1+(0.55-t.t)*5);
    if(t.vy!==undefined){t.m.position.x+=t.vx*dt;t.m.position.y+=t.vy*dt;t.m.position.z+=t.vz*dt;t.vy-=12*dt;}
    if(t.t<=0){scene.remove(t.m);t.d=1;}
  }
  trs=trs.filter(t=>!t.d);

  // ===== CAMÉRA
  if(S==='cutscene'&&contactNPC){
    if(cutsceneTime<2.4){
      const mx=(P.x+contactNPC.x)/2,mz=(P.z+contactNPC.z)/2,ang=Math.atan2(P.x-contactNPC.x,P.z-contactNPC.z)+PI/2+cutsceneTime*0.18;
      cam.fov+=(52-cam.fov)*Math.min(1,dt*6);cam.updateProjectionMatrix();
      cam.position.set(mx+Math.sin(ang)*7.5,playerGy+2.3,mz+Math.cos(ang)*7.5);
      cam.lookAt(mx,playerGy+1.4,mz);
    }else{
      const shot=Math.floor((cutsceneTime-2.4)/3)%2;
      const focus=shot===0?contactNPC:P;
      const other=shot===0?P:contactNPC;
      const dirAng=Math.atan2(other.x-focus.x,other.z-focus.z)+0.45;
      cam.fov+=(46-cam.fov)*Math.min(1,dt*6);
      cam.updateProjectionMatrix();
      cam.position.set(focus.x+Math.sin(dirAng)*2.6,playerGy+1.65,focus.z+Math.cos(dirAng)*2.6);
      cam.lookAt(focus.x,playerGy+1.52,focus.z);
    }
  }else{
    const AP=(isAiming&&window.WPN)?WPN.camParams(true):null;
    let D=interiorType?4.5:P.car?(P.car.vType==='moto'?8.5:10.8):(isAiming?(AP?AP.D:3.4):6.6);
    if(S==='menu'){cy+=dt*0.22;D=15;}
    const sv=P.car?Math.abs(P.car.v)/35:0;
    zs+=(sv-zs)*dt*2;
    const zoomFov=AP?AP.fov:(isAiming?46:(62+zs*13));
    cam.fov+=(zoomFov-cam.fov)*Math.min(1,dt*10);
    cam.updateProjectionMatrix();

    const dirX=-Math.sin(cy)*Math.cos(cp),dirZ=-Math.cos(cy)*Math.cos(cp);
    const hLen=Math.hypot(dirX,dirZ)||1;
    let safeD=D;
    if(!interiorType&&S!=='menu'){
      const wallD=rayWall(P.x,P.z,dirX/hLen,dirZ/hLen,D*hLen);
      safeD=Math.max(AP?0.3:1.6,Math.min(D,(wallD-0.9)/hLen));
    }
    const shoulder=isAiming?(AP?AP.shoulder:0.65):0;
    const sx=-Math.cos(cy)*shoulder,sz=Math.sin(cy)*shoulder;
    let cx=P.x+sx+dirX*safeD,cz=P.z+sz+dirZ*safeD,ch=(isAiming?1.68:1.8)+playerGy+P.y+safeD*Math.sin(cp);
    if(interiorType){
      const cfg=INTERIORS[interiorType];
      cx=cl(cx,cfg.ix-cfg.w/2+0.6,cfg.ix+cfg.w/2-0.6);
      cz=cl(cz,cfg.iz-cfg.d/2+0.6,cfg.iz+cfg.d/2-0.6);
      ch=Math.min(ch,4.6);
    }
    cam.position.set(cx,ch,cz);
    cam.lookAt(P.x+sx+Math.sin(cy)*6,P.car?playerGy+1.2:playerGy+1.58+P.y,P.z+sz+Math.cos(cy)*6);
  }

  // ===== HUD & RADAR
  $('hp-bar').style.width=cl(P.hp,0,100)+'%';
  $('ar-bar').style.width=cl(P.armor,0,100)+'%';
  $('st-bar').style.width=cl((P.stamina/maxStam)*100,0,100)+'%';
  $('stars').textContent='★'.repeat(stars)+'☆'.repeat(5-stars);
  $('wanted-box').classList.toggle('active',stars>0);
  $('wanted-label').textContent=stars>0?`ALERTE NIVEAU ${stars}`:'INDICE DE RECHERCHE';
  $('cash').textContent=P.cash+' FCFA';
  const hh=Math.floor(dayTime),mm=Math.floor((dayTime-hh)*60);
  $('clock-tag').textContent=`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;

  if(P.car){
    const kmh=Math.round(Math.abs(P.car.v)*3.6);
    $('speed-val').textContent=(P.car.v<-0.5?'R ':'')+kmh;
    const pct=cl((P.car.hp/P.car.maxHp)*100,0,100);
    $('car-hp-bar').style.width=pct+'%';
    $('car-hp-bar').style.background=pct<35?'#ef4444':pct<65?'#f97316':'#22c55e';
  }

  const distMon=Math.hypot(P.x-MON_X,P.z-MON_Z);
  const distGas=Math.hypot(P.x-GAS_X,P.z-GAS_Z);
  const intNames={villa:'INTÉRIEUR · VILLA',gym:'INTÉRIEUR · SALLE DE SPORT',restaurant:'INTÉRIEUR · RESTAURANT LE MBOA',armory:'INTÉRIEUR · ARMURERIE'};
  $('zone-tag').textContent=interiorType?(intNames[interiorType]||(window.EX&&EX.intName?EX.intName(interiorType):'INTÉRIEUR')):distMon<55?'MONUMENT RÉUNIFICATION':distGas<25?'STATION-SERVICE':((window.zoneNameExt&&zoneNameExt(P.x,P.z))||(P.z>4*CS&&P.x<4*CS?'NGOA-EKELLÉ':P.x>=4*CS&&P.z<4*CS?'QUARTIER BASTOS':(P.x>=4*CS&&P.z>=4*CS?'MVOG-MBI':'TSINGA · BD 20 MAI')));

  updateEmojiPops(dt);
  witCd=Math.max(0,witCd-dt);
  if(msgT>0){msgT-=dt;if(msgT<=0)$('toast').classList.remove('show');}
  if(bubbleT>0){bubbleT-=dt;if(bubbleT<=0)$('npc-bubble').style.display='none';}

  const actLbl=$('act-label');
  if(actLbl){
    let lbl='ACTION';
    if(interiorType){
      const cfg=INTERIORS[interiorType];
      if(Math.hypot(P.x-cfg.ix,P.z-(cfg.iz+cfg.d/2-1.2))<3.2)lbl='SORTIR';
      else if(interiorType==='gym'&&Math.hypot(P.x-(IX_GYM-2.5),P.z-(IZ_GYM-1.5))<2.8)lbl='BOXER';
      else if(interiorType==='restaurant'&&Math.hypot(P.x-IX_RESTO,P.z-(IZ_RESTO-3.2))<3.2)lbl='MANGER';
      else if(interiorType==='armory'&&Math.hypot(P.x-IX_ARMORY,P.z-(IZ_ARMORY-2.2))<3.2)lbl='ACHETER';
      else lbl='PARLER';
    }else if(nearVendor())lbl='ACHETER';
    else if(findNearestCar(5.8))lbl='ENTRER';
    else if(nearDoor())lbl='ENTRER';
    else if(findNearestNPC(6.0))lbl='PARLER';
    if(actLbl.textContent!==lbl)actLbl.textContent=lbl;
    let pp='';
    if(S==='play'&&!interiorType&&!P.car&&!P.enteringCar){
      const nv=nearVendor();
      if(nv){const T=VTYPES[nv.t];pp=vendorOpen()?`${T.e} ${T.n} · ${T.price} FCFA — ${touch?'Interagir':'E'}`:`🌙 ${T.n} · fermé la nuit`;}
      else{
        const ncar=findNearestCar(5.8);
        if(ncar)pp=ncar.hasDriver?`🚗 Voler le véhicule — ${touch?'Interagir':'E'}`:`🚗 Monter dans le véhicule — ${touch?'Interagir':'E'}`;
        else{const nd=nearDoor();if(nd)pp=`${({armory:'🔫 Armurerie',gym:'🥊 Salle de boxe',restaurant:'🍽️ Restaurant',villa:'🏠 Maison'})[nd.type||'villa']||(window.EX&&EX.doorName?EX.doorName(nd.type):'🚪 Porte')} — entrer (${touch?'Interagir':'E'})`;}
      }
    }
    const cpe=$('ctx-prompt');
    if(cpe&&cpe.textContent!==pp){cpe.textContent=pp;cpe.style.display=pp?'block':'none';}
    updatePoiSprites();
    {
      const gd=$('gps-dist'),tg=(S==='play'&&!interiorType)?getActiveTarget():null;
      if(tg){
        const dm=Math.round(Math.hypot(tg.tx-P.x,tg.tz-P.z)),txt=`📍 ${dm>=1000?(dm/1000).toFixed(1)+' km':dm+' m'}`;
        if(gd.textContent!==txt)gd.textContent=txt;gd.style.display='block';
      }else if(gd.style.display!=='none')gd.style.display='none';
    }
  }
  if(((radarN++)&1)===0)drawRadar();
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
  rCtx.fillStyle='#0c121e';rCtx.fillRect(0,0,W,H);

  if(!interiorType){
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

    rCtx.fillStyle='rgba(20,184,166,0.8)';
    for(const v of VILLAS){const pv=worldToRadar(v[0],v[1],SC);if(Math.abs(pv.x)<54&&Math.abs(pv.y)<54&&Math.hypot(pv.x,pv.y)<56){rCtx.fillRect(CX+pv.x-1.5,CY+pv.y-1.5,3,3);}}
    rCtx.textAlign='center';rCtx.textBaseline='middle';rCtx.font='11px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    for(const p of POI_ALL){
      if(p.act&&act)continue;
      const q=worldToRadar(p.x,p.z,SC);let qx=q.x,qy=q.y;const bd=Math.hypot(qx,qy);
      if(bd>52){if(!p.big)continue;qx*=50/bd;qy*=50/bd;rCtx.globalAlpha=0.65;}
      rCtx.fillText((p.sp&&p.sp.locked)?'🔒':p.e,CX+qx,CY+qy);rCtx.globalAlpha=1;
    }
    rCtx.textBaseline='alphabetic';

    for(const c of cars){
      if(c===P.car)continue;
      const pc=worldToRadar(c.x,c.z,SC);
      rCtx.fillStyle=c.kind==='cop'?(Math.sin(tm*14)>0?'#ef4444':'#3b82f6'):c.vType==='taxi'?'#facc15':'#94a3b8';
      rCtx.fillRect(CX+pc.x-2,CY+pc.y-2,4,4);
    }
    for(const cp of copsOnFoot){
      const pcp=worldToRadar(cp.x,cp.z,SC);
      rCtx.fillStyle='#3b82f6';rCtx.beginPath();rCtx.arc(CX+pcp.x,CY+pcp.y,3,0,PI*2);rCtx.fill();
    }

    const tgt=getActiveTarget();
    if(tgt){
      const pt=worldToRadar(tgt.tx,tgt.tz,SC);
      let tx=pt.x,ty=pt.y;
      const bd=Math.hypot(tx,ty);
      if(bd>48){tx*=48/bd;ty*=48/bd;}
      rCtx.save();
      rCtx.strokeStyle=tgt.isCustom?'#22c55e':'#eab308';
      rCtx.lineWidth=2.5;rCtx.setLineDash([4,3]);
      rCtx.beginPath();rCtx.moveTo(CX,CY);rCtx.lineTo(CX+tx,CY+ty);rCtx.stroke();
      rCtx.restore();

      rCtx.fillStyle=tgt.isCustom?'#22c55e':'#eab308';
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
  rCtx.fillStyle='#ef4444';
  rCtx.beginPath();rCtx.moveTo(0,-6.5);rCtx.lineTo(4.5,5);rCtx.lineTo(-4.5,5);rCtx.closePath();rCtx.fill();
  rCtx.restore();
}

function startGame(){
  for(const c of cars)scene.remove(c.m);
  for(const p of peds)scene.remove(p.m);
  for(const b of bullets)scene.remove(b.m);
  clearCopsOnFoot();clearContactNPC();
  cars=[];peds=[];bullets=[];stars=0;interiorType=null;
  P.x=SAVE.px;P.z=SAVE.pz;P.h=0;P.y=0;P.vy=0;P.hp=SAVE.hp;P.armor=SAVE.armor;P.stamina=SAVE.maxStamina||100;P.cash=SAVE.cash;
  P.car=null;P.enteringCar=null;P.reloadTimer=0;P.punchTimer=0;P.comboStep=0;P.inv=1;
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
