'use strict';
const $=id=>document.getElementById(id);

// ===== SAUVEGARDE LOCALE (LOCALSTORAGE)
const SAVE_KEY='cameroun_stories_payback_v4';
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

// ===== SCÉNARIO & MISSIONS
const STORY_MISSIONS=[
  {title:'Chapitre 1 : Taxi Clando Express',tx:MON_X,tz:MON_Z-16,time:60,reward:450,wantedOnStart:0,
   dialog:'Le Patron : "Bienvenue à Yaoundé ! Monte dans ta voiture ou un Taxi Jaune et rejoins le Monument de la Réunification !"'},
  {title:'Chapitre 2 : Colis Urgent de Mvog-Mbi',tx:2*CS+8,tz:6*CS+8,time:65,reward:650,wantedOnStart:1,
   dialog:'Contact Mvog-Mbi : "La police surveille l’axe ! Livre ce colis au quartier Nord avant la fin du chrono !"'},
  {title:'Chapitre 3 : Convoi VIP Ministériel',tx:7*CS+8,tz:4*CS+8,time:60,reward:850,wantedOnStart:2,
   dialog:'Agent Sécurité : "Sème les patrouilles et rejoins la planque sécurisée à l’Est !"'},
  {title:'Chapitre 4 : Nettoyer le Carrefour',type:'combat',count:4,tx:4*CS+8,tz:3*CS+8,time:80,reward:1100,wantedOnStart:1,
   dialog:'Chef de Quartier : "4 bandits armés bloquent le carrefour ! Neutralise-les tous !"'},
  {title:'Chapitre 5 : Le Grand Coup de Yaoundé',tx:3*CS+18,tz:3*CS+12,time:75,reward:2000,wantedOnStart:3,
   dialog:'Le Patron : "Alerte maximale ! Ramène le butin à ta base de départ !"'}
];

const NPC_PROFILES=[
  {role:'taximan',name:'Moussa · Taximan Jaune',shirt:0xfacc15,skin:0x6f4e37,
   lines:['Chef, le carburant a bougé mais le jaune assure toujours !','Attention aux contrôles vers le Boulevard du 20 Mai.','Passe à la station-service si ta voiture fume !']},
  {role:'benskin',name:'Kevin · Pilote Benskin',shirt:0xf97316,skin:0x5c3c24,
   lines:['Pousse-toi frère, j’ai un client pressé pour Bastos !','La moto passe partout même dans les embouteillages !']},
  {role:'mama',name:'Maman Pauline · Bayam-Sellam',shirt:0xec4899,skin:0x7b5438,
   lines:['Mon fils, passe prendre un bon Ndolé à la boutique si tu es blessé !','Que Dieu te garde dans cette ville.']},
  {role:'student',name:'Brice · Étudiant Ngoa-Ekellé',shirt:0x3b82f6,skin:0x8d5524,
   lines:['Si tu as des étoiles, planque-toi dans une maison ou va à la boutique !','On développe le futur numérique du Cameroun ici !']}
];

// ===== ÉTAT DU JEU & CYCLE JOUR / NUIT
let S='menu',inside=0,ret={x:0,z:0},tm=0,dayTime=14.0,cars=[],peds=[],enemies=[],copsOnFoot=[],trs=[],stars=0,wT=0,msgT=0,dT=0,cid=0,cy=0,cp=0.36,zs=0,bubbleT=0;
const P={x:3*CS+18,z:3*CS+12,h:0,vy:0,y:0,hp:100,armor:50,stamina:100,car:null,cash:500,cd:0,inv:0,wk:0,m:buildHuman(0xff4081,0x7b5438,'player')};

const beacon=new THREE.Group();
const bRing=new THREE.Mesh(new THREE.CylinderGeometry(2.8,2.8,0.3,20,1,true),new THREE.MeshBasicMaterial({color:0x00e676,side:THREE.DoubleSide,transparent:true,opacity:0.8}));
bRing.position.y=0.2;beacon.add(bRing);
const bBeam=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,22,12),new THREE.MeshBasicMaterial({color:0x00e676,transparent:true,opacity:0.22}));
bBeam.position.y=11;beacon.add(bBeam);
scene.add(beacon);

let activeMission=null,missionTimeLeft=0,enemiesLeft=0;
function setupMission(){
  for(const e of enemies)scene.remove(e.m);
  enemies=[];
  const m=STORY_MISSIONS[SAVE.missionIdx];
  if(m){
    activeMission=Object.assign({},m);missionTimeLeft=m.time;
    beacon.position.set(m.tx,0,m.tz);
    bRing.material.color.setHex(0xffd54f);bBeam.material.color.setHex(0xffd54f);
    $('obj-banner').textContent=`🎯 ${m.title}`;
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
    activeMission={title:'Course Taxi Libre',tx:gx,tz:gz,time:50,reward:350};
    missionTimeLeft=50;beacon.position.set(gx,0,gz);
    bRing.material.color.setHex(0x00e676);bBeam.material.color.setHex(0x00e676);
    $('obj-banner').textContent='🚖 Course Taxi Libre : Rejoins le point vert';
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
const KB={},B={fire:0,run:0,gas:0,brake:0},jv={m:0,x:0,y:0};
let runTapTime=0;

addEventListener('keydown',e=>{
  KB[e.code]=1;
  if(e.code==='KeyE'||e.code==='Enter')doSmartAction();
  if(e.code==='Tab'){e.preventDefault();switchWeapon();}
  if(e.code==='KeyR')cycleRadio();
  if(e.code==='KeyH'&&P.car)playHorn();
  if(e.code==='KeyC'&&!P.car)doJump();
  if(e.code==='Escape'||e.code==='KeyP')togglePause();
  if(e.code.startsWith('Arrow')||e.code==='Space')e.preventDefault();
});
addEventListener('keyup',e=>KB[e.code]=0);
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
    run:KB.ShiftLeft||KB.ShiftRight||B.run,
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
function lookCam(dx,dy){cy-=dx*0.0065;cp=cl(cp+dy*0.0045,0.1,1.05);}
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
      // Appui court (< 220ms) sur le bouton Courir déclenche un Saut / Esquive (logique Payback 2)
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
  peds.push({m,x,z,h:rn(0,6.3),t:rn(1,4),fl:0,dead:0,wk:0,hp:35,profile:prof,lineIdx:R()*prof.lines.length|0,chatCd:0});
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

// ===== BOUTON D'ACTION INTELLIGENT UNIQUE (VOITURE / PORTE / BOUTIQUE / DIALOGUE)
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
    const line=npc.fl>0?'Laisse-moi tranquille !':npc.profile.lines[npc.lineIdx%npc.profile.lines.length];
    npc.lineIdx++;
    showNpcBubble(npc.profile.name,line,4.5);
    playTone(520,0.12,'sine');
  }
}

function fireWeapon(){
  const wep=SAVE.curWeapon;
  if(P.cd>0)return;
  P.cd=wep==='smg'?0.1:wep==='rifle'?0.16:0.28;
  const dmg=wep==='rifle'?45:wep==='smg'?18:30;
  let a=P.car?P.car.h:P.h;
  const ox=P.x,oz=P.z;
  const targets=inside?[]:peds.filter(p=>!p.dead).concat(enemies).concat(copsOnFoot).concat(cars.filter(c=>c.kind!=='me'));
  let bt=null,bd=58;
  for(const t of targets){
    const dx=t.x-ox,dz=t.z-oz,d=Math.hypot(dx,dz);
    if(d<bd&&Math.abs(angd(Math.atan2(dx,dz),a))<0.85){
      const fx=dx/d,fz=dz/d;
      if(rayWall(ox,oz,fx,fz,d)>=d-0.5){bd=d;bt=t;}
    }
  }
  if(bt){a=Math.atan2(bt.x-ox,bt.z-oz);if(!P.car)P.h=a;}
  const fx=Math.sin(a),fz=Math.cos(a);
  let hd=inside?12:rayWall(ox,oz,fx,fz,55);
  let hit=null;
  for(const t of targets){
    const dx=t.x-ox,dz=t.z-oz,f=dx*fx+dz*fz,s=Math.abs(dx*fz-dz*fx);
    if(f>0&&f<hd&&s<(t.vType?2.1:1.15)){hd=f;hit=t;}
  }
  const m=bx(0.09,0.09,1,wep==='rifle'?0xff3d00:wep==='smg'?0xff9100:0xffe58a,ox+fx*hd/2,1.35,oz+fz*hd/2);
  m.scale.z=Math.max(0.5,hd);m.rotation.y=a;trs.push({m,t:0.06});
  const sp=bx(0.32,0.32,0.32,0xffab00,ox+fx*hd,1.35,oz+fz*hd);trs.push({m:sp,t:0.1});
  playGunshot(wep);

  if(!inside)for(const p of peds)if(!p.dead&&Math.hypot(p.x-ox,p.z-oz)<45)p.fl=5;
  if(hit){
    hit.hp-=dmg;
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
  }
}

// ===== CONDUITE & MARCHE ARRIÈRE FLUIDE STYLE PAYBACK 2
function drivePlayerCar(c,dt,i){
  const maxSpd=c.vType==='moto'?38:c.vType==='vip'?37:33;

  // 1. Direction : Joystick gauche (axe X) ou touches Gauche/Droite braquent directement la voiture
  const steerInput=cl(-i.x,-1,1);

  // 2. Accélération (▲) et Frein / Marche arrière automatique (▼)
  if(i.gas){
    c.revLock=0;
    if(c.v<-0.5)c.v+=36*dt; // Sortie rapide de marche arrière
    else c.v+=22*dt;
  }else if(i.brake){
    if(c.v>1.2&&!c.revLock){
      // Freinage puissant tant que la voiture avance
      c.v=Math.max(0,c.v-42*dt);
      if(c.v<=1.2)c.revLock=1; // Passe instantanément en marche arrière dès l'arrêt
    }else{
      // Marche arrière fluide et réactive !
      c.revLock=1;
      c.v-=18*dt;
    }
  }else{
    // Roue libre : décélération naturelle
    c.revLock=0;
    c.v-=c.v*Math.min(1,1.35*dt);
    if(Math.abs(c.v)<0.15)c.v=0;
  }

  c.v=cl(c.v,-15,maxSpd);

  // 3. Braquage : fonctionne même à très basse vitesse pour manœuvrer facilement en marche arrière
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
    c.m.userData.l1.material=mt(fl?0xff1744:0x4a0007);
    c.m.userData.l2.material=mt(!fl?0x2979ff:0x00194a);
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

  if(pl){
    dayTime=(dayTime+dt*0.04)%24;
    const isNight=dayTime<6||dayTime>19;
    const skyCol=isNight?0x0b132b:(dayTime>17.5?0xf97316:0x8ecae6);
    scene.background.lerp(new THREE.Color(skyCol),dt*0.5);
    scene.fog.color.copy(scene.background);
    hemi.intensity=isNight?0.35:0.88;
    sun.intensity=isNight?0.22:0.95;
  }

  if(!inside&&S!=='pause'&&S!=='shop'){
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

    if(P.car){
      drivePlayerCar(P.car,dt,i);
      P.x=P.car.x;P.z=P.car.z;P.h=P.car.h;
      // Caméra suit la voiture en marche avant, et regarde en arrière si on recule !
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
      const sprinting=i.run&&P.stamina>4&&m>0.1;
      if(sprinting)P.stamina=Math.max(0,P.stamina-22*dt);
      else P.stamina=Math.min(100,P.stamina+16*dt);

      if(m>0.05){
        const fwdX=Math.sin(cy),fwdZ=Math.cos(cy);
        const rgtX=-Math.cos(cy),rgtZ=Math.sin(cy);
        const wx=fwdX*(-i.y)+rgtX*i.x;
        const wz=fwdZ*(-i.y)+rgtZ*i.x;
        const th=Math.atan2(wx,wz);
        const sp=(sprinting?10.2:5.2)*Math.min(1,m);
        P.h-=angd(P.h,th)*Math.min(1,dt*14);
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

    if(i.fire)fireWeapon();

    beacon.visible=!inside&&!!activeMission;
    bRing.rotation.y+=dt*2.4;
    if(!inside&&activeMission){
      missionTimeLeft-=dt;
      const dist=Math.hypot(P.x-activeMission.tx,P.z-activeMission.tz);
      if(missionTimeLeft<=0){showToast('⏰ Temps écoulé ! Mission recommencée.');setupMission();}
      else if(activeMission.type==='combat'){
        if(enemiesLeft<=0){
          P.cash+=activeMission.reward;SAVE.missionIdx++;writeSave();
          showToast(`🏆 Mission accomplie ! +${activeMission.reward} FCFA`);playTone(880,0.4,'sine',0.07);setupMission();
        }
      }else if(dist<5.2){
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

  if(!inside&&S!=='pause'&&S!=='shop'){
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
          const bm=bx(0.09,0.09,1,0xff1744,cp.x+fx*d/2,1.35,cp.z+fz*d/2);
          bm.scale.z=d;bm.rotation.y=cp.h;trs.push({m:bm,t:0.08});
          playGunshot('pistol');
          if(R()<0.52){if(P.car)P.car.hp-=7;else damagePlayer(cp.isBir?12:9);}
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
        const txt=p.fl>0?'Au secours !':p.profile.lines[p.lineIdx%p.profile.lines.length];
        p.lineIdx++;showNpcBubble(p.profile.name,txt,3.8);
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
          const bm=bx(0.09,0.09,1,0xff3d00,e.x+fx*d/2,1.35,e.z+fz*d/2);
          bm.scale.z=d;bm.rotation.y=e.h;trs.push({m:bm,t:0.08});
          playGunshot('pistol');
          if(R()<0.5)damagePlayer(10);
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

  // ===== CAMÉRA ANTI-COLLISION
  let D=inside?4.5:P.car?(P.car.vType==='moto'?8.5:10.8):6.6;
  if(S==='menu'){cy+=dt*0.22;D=15;}
  const sv=P.car?Math.abs(P.car.v)/35:0;
  zs+=(sv-zs)*dt*2;cam.fov=62+zs*13;cam.updateProjectionMatrix();

  const dirX=-Math.sin(cy)*Math.cos(cp),dirZ=-Math.cos(cy)*Math.cos(cp);
  const hLen=Math.hypot(dirX,dirZ)||1;
  let safeD=D;
  if(!inside&&S!=='menu'){
    const wallD=rayWall(P.x,P.z,dirX/hLen,dirZ/hLen,D*hLen);
    safeD=Math.max(1.8,(wallD-0.9)/hLen);
  }
  let cx=P.x+dirX*safeD,cz=P.z+dirZ*safeD,ch=1.8+P.y+safeD*Math.sin(cp);
  if(inside){cx=cl(cx,IX-7.4,IX+7.4);cz=cl(cz,IZ-6.4,IZ+6.4);ch=Math.min(ch,4.2);}
  cam.position.set(cx,ch,cz);cam.lookAt(P.x,P.car?1.2:1.65+P.y,P.z);

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

  // Icône dynamique du bouton d'action intelligent à pied
  const ab=document.querySelector('#controls-foot .t-act');
  if(ab){
    const ic=inside?'🚪':distShop<4.8?'🛒':findNearestCar(5.5)?'🚗':nearDoor()?'🏠':findNearestNPC(6.0)?'💬':'🚗';
    if(ab.textContent!==ic)ab.textContent=ic;
  }
  drawRadar();
}

const rCtx=$('radar').getContext('2d');
function drawRadar(){
  const W=112,H=112,CX=W/2,CY=H/2,SC=0.45;
  rCtx.clearRect(0,0,W,H);
  rCtx.save();
  rCtx.beginPath();rCtx.arc(CX,CY,52,0,PI*2);rCtx.clip();
  rCtx.fillStyle='#0d1526';rCtx.fillRect(0,0,W,H);

  if(!inside){
    rCtx.translate(CX,CY);rCtx.rotate(cy);
    rCtx.strokeStyle='#334155';rCtx.lineWidth=5;
    const gx0=Math.floor((P.x-130)/CS)*CS,gz0=Math.floor((P.z-130)/CS)*CS;
    for(let x=gx0;x<=P.x+130;x+=CS){if(x>=0&&x<=WS){rCtx.beginPath();rCtx.moveTo((x-P.x)*SC,-130*SC);rCtx.lineTo((x-P.x)*SC,130*SC);rCtx.stroke();}}
    for(let z=gz0;z<=P.z+130;z+=CS){if(z>=0&&z<=WS){rCtx.beginPath();rCtx.moveTo(-130*SC,(z-P.z)*SC);rCtx.lineTo(130*SC,(z-P.z)*SC);rCtx.stroke();}}

    rCtx.fillStyle='#38bdf8';rCtx.fillRect((SHOP_X-P.x)*SC-3,(SHOP_Z-P.z)*SC-3,6,6);
    rCtx.fillStyle='#fb923c';rCtx.fillRect((GAS_X-P.x)*SC-3,(GAS_Z-P.z)*SC-3,6,6);

    for(const c of cars){
      if(c===P.car)continue;
      rCtx.fillStyle=c.kind==='cop'?(Math.sin(tm*14)>0?'#ff1744':'#2979ff'):c.vType==='taxi'?'#facc15':'#94a3b8';
      rCtx.fillRect((c.x-P.x)*SC-2,(c.z-P.z)*SC-2,4,4);
    }
    for(const cp of copsOnFoot){
      rCtx.fillStyle='#2979ff';rCtx.beginPath();rCtx.arc((cp.x-P.x)*SC,(cp.z-P.z)*SC,3,0,PI*2);rCtx.fill();
    }
    if(activeMission){
      let bx=(activeMission.tx-P.x)*SC,bz=(activeMission.tz-P.z)*SC;
      const bd=Math.hypot(bx,bz);
      if(bd>44){bx*=44/bd;bz*=44/bd;}
      rCtx.fillStyle=SAVE.missionIdx<STORY_MISSIONS.length?'#ffd54f':'#00e676';
      rCtx.beginPath();rCtx.arc(bx,bz,4.5,0,PI*2);rCtx.fill();
    }
  }
  rCtx.restore();
  rCtx.fillStyle='#ff4081';
  rCtx.beginPath();rCtx.moveTo(CX,CY-5.5);rCtx.lineTo(CX+4,CY+4.5);rCtx.lineTo(CX-4,CY+4.5);rCtx.closePath();rCtx.fill();
}

function startGame(){
  for(const c of cars)scene.remove(c.m);
  for(const p of peds)scene.remove(p.m);
  clearCopsOnFoot();
  cars=[];peds=[];stars=0;inside=0;
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

