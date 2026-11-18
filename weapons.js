'use strict';
// =====================================================================
//  ARMES : sélection fiable (ordre fixe), roue d'armes, ZOOM PERSISTANT (bouton VISER
//  = on/off), niveaux de zoom par arme, lunette de sniper, portée selon l'arme.
// =====================================================================
(function(){
const WPN=window.WPN={};
const ORDER=['fist','pistol','smg','shotgun','rifle','sniper'];
const META={fist:{e:'👊'},pistol:{e:'🔫'},smg:{e:'🔫'},shotgun:{e:'💥'},rifle:{e:'🎯'},sniper:{e:'🔭'}};
// portée (en mètres) et niveaux de zoom disponibles pour chaque arme
Object.assign(WEAPONS.pistol,{range:95,zoom:[1.3]});
Object.assign(WEAPONS.smg,{range:105,zoom:[1.4]});
Object.assign(WEAPONS.shotgun,{range:50,zoom:[1.2]});
Object.assign(WEAPONS.rifle,{range:190,zoom:[1.8,3]});
Object.assign(WEAPONS.sniper,{range:430,zoom:[4,8,12]});
const $w=id=>document.getElementById(id);
const AIM=WPN.AIM={on:false,lvl:0,prevRaw:false};

// ---------- sélection des armes
function owned(){
  const set=new Set(SAVE.weapons||[]);set.add('fist');
  return ORDER.filter(id=>set.has(id)&&WEAPONS[id]);
}
function normalize(){
  const list=owned();
  const cur=SAVE.curWeapon;
  const changed=list.length!==SAVE.weapons.length||list.some((id,i)=>SAVE.weapons[i]!==id);
  if(changed)SAVE.weapons=list.slice();
  if(!list.includes(cur)){SAVE.curWeapon=list[list.length-1]||'fist';updateWeaponHUD();}
}
WPN.owned=owned;
WPN.select=function(id,quiet){
  normalize();
  if(!owned().includes(id)){showToast('Tu ne possèdes pas cette arme.');return false;}
  if(SAVE.curWeapon===id)return true;
  SAVE.curWeapon=id;P.reloadTimer=0;AIM.lvl=0;updateWeaponHUD();
  if(!quiet)showToast(WEAPONS[id].melee?'Mains nues (corps à corps)':'Arme équipée : '+WEAPONS[id].name);
  if(typeof playTone==='function')playTone(420,0.06,'square',0.03);
  return true;
};
function cycle(dir){
  initAudio();normalize();
  const list=owned();
  if(list.length<2){showToast('Tu n’as qu’une arme. Achète-en à l’Armurerie.');return;}
  const i=list.indexOf(SAVE.curWeapon);
  WPN.select(list[(i+(dir||1)+list.length)%list.length]);
}
window.switchWeapon=cycle;
WPN.cycle=cycle;
WPN.selectDigit=function(n){const id=ORDER[n];if(id)WPN.select(id);};

// ---------- ROUE D'ARMES (s'ouvre en touchant la boîte d'arme ; ne reste pas à l'écran)
const css=document.createElement('style');
css.textContent=`
#wpn-wheel{position:fixed;left:50%;bottom:calc(120px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:46;display:none;gap:8px;padding:8px;background:rgba(5,8,14,0.85);border:1px solid rgba(255,255,255,0.2);border-radius:16px;backdrop-filter:blur(4px);max-width:96vw;overflow-x:auto}
#wpn-wheel button{font-family:inherit;min-width:74px;border-radius:12px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.06);color:#e2e8f0;padding:8px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px}
#wpn-wheel button.on{background:#fde047;color:#111827;border-color:#fde047}
#wpn-wheel button .e{font-size:22px;line-height:1}
#wpn-wheel button .n{font-size:10px;font-weight:800;letter-spacing:.2px}
#wpn-wheel button .a{font-size:10px;opacity:.8}
#zoom-ui{position:fixed;right:calc(14px + env(safe-area-inset-right,0px));top:50%;transform:translateY(-50%);z-index:20;display:none;flex-direction:column;gap:8px;align-items:center}
#zoom-ui button{width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,0.35);background:rgba(5,8,14,0.72);color:#fff;font-size:22px;font-weight:800;cursor:pointer;touch-action:none}
#zoom-ui .lv{font-size:12px;font-weight:800;color:#fde047;background:rgba(5,8,14,0.72);border-radius:999px;padding:3px 9px}
#scope-ov{position:fixed;inset:0;z-index:6;pointer-events:none;display:none}
#scope-ov.full{background:radial-gradient(circle at 50% 50%,transparent 0,transparent 31%,rgba(0,0,0,0.6) 32%,#000 47%)}
#scope-ov.half{background:radial-gradient(circle at 50% 50%,transparent 0,transparent 45%,rgba(0,0,0,0.5) 85%)}
#scope-ov .h,#scope-ov .v{position:absolute;background:rgba(0,0,0,0.85)}
#scope-ov .h{left:18%;right:18%;top:50%;height:1px}
#scope-ov .v{top:18%;bottom:18%;left:50%;width:1px}
#scope-ov .t{position:absolute;left:50%;bottom:17%;transform:translateX(-50%);font-size:12px;font-weight:800;color:#fde047;text-shadow:0 1px 3px #000;letter-spacing:.5px;white-space:nowrap}
#aim-chip{position:fixed;left:50%;transform:translateX(-50%);top:calc(104px + env(safe-area-inset-top,0px));z-index:19;display:none;background:rgba(5,8,14,0.72);border:1px solid rgba(255,255,255,0.25);border-radius:999px;padding:3px 11px;font-size:11px;font-weight:800;color:#fde047;pointer-events:none}
`;
document.head.appendChild(css);
const wheel=document.createElement('div');wheel.id='wpn-wheel';document.body.appendChild(wheel);
const zoomUi=document.createElement('div');zoomUi.id='zoom-ui';zoomUi.innerHTML='<button id="zoom-in">＋</button><div class="lv" id="zoom-lv">x1</div><button id="zoom-out">－</button>';document.body.appendChild(zoomUi);
const scope=document.createElement('div');scope.id='scope-ov';scope.innerHTML='<div class="h"></div><div class="v"></div><div class="t" id="scope-t"></div>';document.body.appendChild(scope);
const chip=document.createElement('div');chip.id='aim-chip';chip.textContent='🔍 Zoom actif — touche VISER pour quitter';document.body.appendChild(chip);

function renderWheel(){
  normalize();
  wheel.innerHTML=owned().map(id=>{
    const w=WEAPONS[id],mag=SAVE.mag?SAVE.mag[id]||0:0,res=w.infiniteReserve?'∞':(SAVE.reserve?SAVE.reserve[id]||0:0);
    return `<button data-w="${id}" class="${SAVE.curWeapon===id?'on':''}"><span class="e">${META[id].e}</span><span class="n">${w.name.replace('Fusil ','').replace('Mitraillette ','')}</span><span class="a">${w.melee?'—':mag+' / '+res}</span></button>`;
  }).join('');
  wheel.querySelectorAll('button').forEach(b=>{b.onclick=e=>{e.stopPropagation();WPN.select(b.dataset.w);wheel.style.display='none';};});
}
function toggleWheel(){
  if(wheel.style.display==='flex'){wheel.style.display='none';return;}
  renderWheel();wheel.style.display='flex';
}
WPN.wheel=toggleWheel;
const wbox=$w('weapon-box');
if(wbox){wbox.onclick=null;wbox.onpointerdown=e=>{e.stopPropagation();toggleWheel();};}
window.addEventListener('pointerdown',e=>{if(wheel.style.display==='flex'&&!wheel.contains(e.target)&&e.target!==wbox&&!(wbox&&wbox.contains(e.target)))wheel.style.display='none';},true);

// ---------- ZOOM
function lvls(){const w=WEAPONS[SAVE.curWeapon];return w&&w.zoom?w.zoom:[1];}
function curZoom(){const l=lvls();return l[Math.min(AIM.lvl,l.length-1)];}
WPN.zoomStep=function(d){
  if(!AIM.on)return;
  const l=lvls();if(l.length<2)return;
  AIM.lvl=Math.max(0,Math.min(l.length-1,AIM.lvl+d));
  if(typeof playTone==='function')playTone(900,0.04,'square',0.02);
};
$w('zoom-in').onpointerdown=e=>{e.stopPropagation();WPN.zoomStep(1);};
$w('zoom-out').onpointerdown=e=>{e.stopPropagation();WPN.zoomStep(-1);};
window.addEventListener('wheel',e=>{if(AIM.on){WPN.zoomStep(e.deltaY<0?1:-1);}},{passive:true});
WPN.camParams=function(isAiming){
  if(!isAiming)return null;
  const w=WEAPONS[SAVE.curWeapon];if(!w||w.melee)return null;
  const z=curZoom();
  const fov=2*Math.atan(Math.tan(31*Math.PI/180)/z)*180/Math.PI;
  return{D:z>=3?0.35:(z>=1.8?1.4:3.2),shoulder:z>=3?0:(z>=1.8?0.35:0.65),fov:fov,z:z,scoped:z>=3};
};
WPN.sens=function(){
  if(!AIM.on)return 1;
  const w=WEAPONS[SAVE.curWeapon];if(!w||w.melee)return 1;
  return Math.max(0.12,1/curZoom());
};

// ---------- entrée : VISER devient un interrupteur (le zoom reste tant qu'on ne l'annule pas)
const _gi=getInput;
getInput=function(){
  const i=_gi.apply(this,arguments);
  const raw=!!i.aim;
  if(raw&&!AIM.prevRaw){
    if(!(P.car||P.enteringCar||interiorType||S!=='play'))AIM.on=!AIM.on;
    if(AIM.on)AIM.lvl=Math.min(AIM.lvl,lvls().length-1);
  }
  AIM.prevRaw=raw;
  if(P.car||P.enteringCar||interiorType||S!=='play'||P.hp<=0)AIM.on=false;
  i.aim=AIM.on;
  return i;
};

// ---------- affichages (lunette, boutons de zoom, pastille)
let lastFar=240,lastScoped=false;
function post(dt){
  const w=WEAPONS[SAVE.curWeapon];
  const aiming=AIM.on&&w&&!w.melee&&S==='play';
  const AP=aiming?WPN.camParams(true):null;
  const scoped=!!(AP&&AP.scoped);
  // lunette
  if(AP&&AP.z>=1.8){
    scope.style.display='block';
    scope.className=AP.z>=6?'full':(AP.z>=3?'half':'');
    $w('scope-t').textContent=AP.z>=3?('x'+AP.z+' · '+distText()):'';
  }else scope.style.display='none';
  zoomUi.style.display=(AIM.on&&w&&!w.melee&&lvls().length>1&&S==='play')?'flex':'none';
  if(zoomUi.style.display==='flex')$w('zoom-lv').textContent='x'+curZoom();
  chip.style.display=(AIM.on&&w&&!w.melee&&!scoped&&S==='play')?'block':'none';
  // portée de vue : on voit loin avec la lunette
  const far=scoped?1400:240;
  if(far!==lastFar){cam.far=far;cam.updateProjectionMatrix();lastFar=far;}
  if(scoped){scene.fog.density*=0.28;if(P.m)P.m.visible=false;}
  lastScoped=scoped;
}
function distText(){
  try{
    const a=getCrosshairAimData();
    const d=Math.round(Math.hypot(a.hitPoint.x-cam.position.x,a.hitPoint.z-cam.position.z));
    return a.targetObj?('cible '+d+' m'):(d+' m');
  }catch(e){return '';}
}
let nT=0;
const _u=update;
update=function(dt){
  _u(dt);
  try{post(dt);}catch(e){}
  nT-=dt;if(nT<=0){nT=1;try{normalize();}catch(e){}}
};
window.addEventListener('keydown',e=>{
  if(e.code.startsWith('Digit')){const n=parseInt(e.code.replace('Digit',''),10)-1;if(n>=0&&n<ORDER.length)WPN.selectDigit(n);}
  if(e.code==='Equal'||e.code==='NumpadAdd')WPN.zoomStep(1);
  if(e.code==='Minus'||e.code==='NumpadSubtract')WPN.zoomStep(-1);
});
normalize();
console.log('[ARMES] chargé : roue d’armes, zoom persistant, lunette, portées.');
})();
