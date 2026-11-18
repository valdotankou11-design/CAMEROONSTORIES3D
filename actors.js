'use strict';
// =====================================================================
//  HABITANTS : chaque lieu est peuplé de personnages avec un MÉTIER, une PERSONNALITÉ,
//  une routine (ils marchent, travaillent, discutent) et des réactions (peur, alerte).
//  Ils réutilisent le moteur d'animations des actions (même qualité que le joueur).
// =====================================================================
(function(){
const ACTORS=window.ACTORS=[];
const rr=(a,b)=>a+Math.random()*(b-a);
const clp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pick=a=>a[(Math.random()*a.length)|0];
const SKINS=[0x7b5438,0x6f4e37,0x8b5a3c,0x5b3a29,0x9a6a45,0xb07a50,0x4a2f1f];
const once={};
const gA=(l,fn)=>function(){try{return fn.apply(this,arguments);}catch(e){if(!once[l]){once[l]=1;console.error('[HABITANTS '+l+']',e);}}};
const GROUPS={};   // groupes d'intérieur (retirés de la scène quand on n'y est pas)
const BAN={};      // lieux dont on est banni (sécurité)
window.EX_BAN=BAN;

// ---------- PERSONNALITÉS ET DIALOGUES
const JOBS={
  nurse:{label:'Infirmière',lines:['Bonjour ! Prenez place, le docteur va vous recevoir.','Ici on soigne tout le monde, sans exception.','N’oubliez pas de boire beaucoup d’eau.','Les urgences sont au fond, à droite.']},
  doctor:{label:'Médecin',lines:['Ça va aller. Du repos et vous serez comme neuf.','La consultation, c’est 300 FCFA. Parlez-moi, je vous soigne.','Je n’ai pas le temps de bavarder, j’ai des patients.']},
  patient:{label:'Patient',lines:['Aïe… Je suis ici depuis ce matin.','Si vous avez un jus, je ne dis pas non…','Les infirmières sont gentilles, mais il faut patienter.']},
  waiting:{label:'Patient',lines:['Ça fait deux heures que j’attends…','Vous avez vu le match hier soir ?','Je suis juste venu pour un contrôle.']},
  janitor:{label:'Agent d’entretien',lines:['Attention, le sol est mouillé !','On ne s’arrête jamais de nettoyer ici.','Regarde où tu marches, mon frère.']},
  guard:{label:'Agent de sécurité',lines:['Circulez. Pas d’armes ici.','Tout est calme, gardons-le comme ça.','Je vous ai à l’œil.']},
  visitor:{label:'Visiteur',lines:['Je rends visite à mon oncle. Il va mieux, Dieu merci.','Ils ont dit qu’il sortira demain.']},
  bartender:{label:'Patron du maquis',lines:['Une bière bien fraîche ? Installe-toi au comptoir !','Ici c’est chez Tonton : on mange, on rit, on danse.','Le poisson braisé, le meilleur de Yaoundé !']},
  regular:{label:'Habitué',lines:['Tonton, remets-moi ça !','Ce foot va me tuer, je te jure.','Assieds-toi, la vie est courte.','Le Makossa, ça ne s’écoute pas : ça se danse !']},
  diner:{label:'Client',lines:['Le poisson braisé est incroyable aujourd’hui.','Ne me dérange pas, je mange.','Tu veux goûter ? Non ? Tant pis pour toi !']},
  clubber:{label:'Danseur',lines:['Viens danser, ne reste pas planté là !','Ce rythme, c’est la vie !','La piste est à nous ce soir !']},
  pool:{label:'Joueur de billard',lines:['Silence, je me concentre sur ce coup.','Je mène huit à zéro, tu veux jouer ?']},
  darts:{label:'Joueur de fléchettes',lines:['Dans le mille… ou presque.','Touche pas à mes fléchettes !']},
  waitress:{label:'Serveuse',lines:['Je passe avec le plateau, laisse-moi passer !','Une commande pour la table trois !']},
  host:{label:'Maître de cérémonie',lines:['Mesdames et messieurs, bienvenue au Moulin Doré !','Un tonnerre d’applaudissements pour nos artistes !']},
  bouncer:{label:'Videur',lines:['Tenue correcte exigée.','Pas de bagarre ici, ou tu sors.','Bonne soirée, amuse-toi bien.']},
  audience:{label:'Spectateur',lines:['Magnifique spectacle !','Chut, ça va commencer…','Ces costumes… Quelle élégance !']},
  vip:{label:'Invité VIP',lines:['Champagne ! La soirée est pour nous.','On ne parle pas affaires ce soir.']},
  cashier:{label:'Vendeuse',lines:['Bienvenue chez Style Avenue !','Cette tenue vous irait à merveille.','On accepte les billets, pas les promesses.']},
  shopper:{label:'Cliente',lines:['Je cherche quelque chose pour un mariage.','C’est un peu cher, non ?','Cette couleur te va bien, tu devrais l’acheter.']},
  resident:{label:'Résident',lines:['Fais comme chez toi.','Tu as faim ? Il y a du ndolé sur le feu.','Le match va bientôt commencer.']},
  chef:{label:'Chef cuisinier',lines:['À votre service ! Le dîner sera servi bientôt.','Pas de visite en cuisine, s’il vous plaît.']},
  maid:{label:'Gouvernante',lines:['Bonjour ! Je termine le ménage.','Tout est propre, comme chaque jour.']},
  butler:{label:'Majordome',lines:['Bienvenue chez vous. Puis-je vous servir quelque chose ?','Votre bain est prêt.']},
  trainer:{label:'Coach sportif',lines:['Allez, encore dix répétitions !','Le sport, c’est la clé de tout.']},
  pianist:{label:'Pianiste',lines:['Une petite mélodie pour votre soirée ?']},
  student:{label:'Étudiant',lines:['Je révise pour l’examen de demain…','La bibliothèque est fermée, quelle galère !','Tu connais un bon plan pour les stages ?']},
  office:{label:'Cadre',lines:['Je suis en retard pour ma réunion !','Les affaires, c’est la vie.','Pas le temps, mon agenda est plein.']},
  worker:{label:'Ouvrier',lines:['Les conteneurs n’attendent pas.','Besoin de main-d’œuvre ? Parle au chef.','Tout doit partir avant midi.']},
  footballer:{label:'Footballeur',lines:['Passe-moi le ballon !','On joue chaque soir ici.','Tu veux faire une partie ?']},
  referee:{label:'Arbitre',lines:['Hors-jeu ! Je l’ai vu !','Jouez, jouez !']},
  smoker:{label:'Noctambule',lines:['La nuit commence à peine.','Le cabaret est complet, mais pas pour moi…']},
  queue:{label:'Client en attente',lines:['On attend depuis une heure, mais ça vaut le coup.','Le spectacle est paraît-il extraordinaire.']}
};
const TRAITS={
  friendly:['Bonjour mon ami ! ','Ah, un visage souriant ! ','Salut, toi ! '],
  grumpy:['Hmm. ','Qu’est-ce que tu veux ? ','Encore toi… '],
  jolly:['Haha ! ','Quelle belle journée ! ','Écoute bien : '],
  shy:['Euh… ','Excuse-moi… ','…Oui ? ']
};
function personality(){const k=pick(Object.keys(TRAITS));return k;}
function speak(a){
  const J=JOBS[a.job]||{label:'',lines:['…']};
  let line=pick(J.lines);
  if(a.job!=='guard'&&a.job!=='bouncer'&&typeof stars!=='undefined'&&stars>0&&Math.random()<0.5)line='La police te cherche… fais attention à toi !';
  else if(a.job!=='guard'&&a.job!=='bouncer'&&SAVE.curWeapon&&SAVE.curWeapon!=='fist'&&Math.random()<0.4)line='Range ton arme, s’il te plaît !';
  else if(Math.random()<0.5)line=pick(TRAITS[a.trait])+line;
  return line;
}
function talkTo(a){
  const J=JOBS[a.job]||{label:''};
  showNpcBubble(a.name+(J.label?' · '+J.label:''),speak(a),4.8);
  playTone(520,0.1,'sine',0.03);
  a.talkT=4.5;
  if(a.trait==='friendly'||a.trait==='jolly')popEmoji(a.m,Math.random()<0.5?'😊':'👋',1.6);
  else if(a.trait==='grumpy')popEmoji(a.m,'😒',1.6);
}

// ---------- ACCESSOIRES DE MÉTIER
function dress(m,acc){
  const u=m.userData,W=0xf8fafc;
  const add=(par,w,h,d,c,x,y,z)=>bx(w,h,d,c,x,y,z,par);
  for(const k of acc||[]){
    if(k==='nursecap'){add(u.head,0.36,0.1,0.3,W,0,0.2,0.02);add(u.head,0.05,0.1,0.02,0xdc2626,0,0.2,0.18);add(u.head,0.1,0.03,0.02,0xdc2626,0,0.2,0.18);}
    else if(k==='stetho'){const t=new THREE.Mesh(new THREE.TorusGeometry(0.16,0.015,6,14),mt(0x111827,0.5,0.4));t.position.set(0,1.5,0.1);t.rotation.x=Math.PI/2.3;u.torso.add(t);}
    else if(k==='hardhat'){const h=new THREE.Mesh(new THREE.SphereGeometry(0.23,10,6,0,Math.PI*2,0,Math.PI/2),mt(0xfacc15,0.5,0.1));h.position.set(0,0.1,0);u.head.add(h);add(u.head,0.4,0.03,0.12,0xfacc15,0,0.1,0.2);}
    else if(k==='tie'){add(u.torso,0.07,0.5,0.03,0xb91c1c,0,1.38,0.19);add(u.torso,0.2,0.08,0.03,0xffffff,0,1.62,0.18);}
    else if(k==='backpack'){add(u.torso,0.36,0.5,0.2,0x2563eb,0,1.35,-0.24);add(u.torso,0.3,0.2,0.05,0x1d4ed8,0,1.2,-0.36);}
    else if(k==='apron'){add(u.torso,0.4,0.55,0.03,W,0,1.0,0.2);}
    else if(k==='chefhat'){const c=cyl(0.17,0.2,0.34,12,W,0,0.35,0,u.head);}
    else if(k==='guardcap'){add(u.head,0.42,0.12,0.42,0x1e293b,0,0.2,0.02);add(u.head,0.34,0.03,0.2,0x111827,0,0.14,0.27);}
    else if(k==='sunglasses'){add(u.head,0.36,0.07,0.04,0x050505,0,0.035,0.205);}
    else if(k==='vest'){add(u.torso,0.5,0.55,0.34,0xf97316,0,1.35,0);add(u.torso,0.52,0.06,0.36,0xe5e7eb,0,1.22,0);}
    else if(k==='scarf'){add(u.torso,0.42,0.12,0.3,0xef4444,0,1.66,0.02);}
    else if(k==='briefcase'){add(u.elbowR,0.34,0.24,0.08,0x3f2a1b,0,-0.46,0.02);}
  }
}

// ---------- CRÉATION
function mkActor(def){
  const m=buildHuman(def.shirt||0x2563eb,def.skin||pick(SKINS),def.role||'student');
  m.scale.setScalar(def.scale||1);m.userData.gun.visible=false;
  if(def.acc)dress(m,def.acc);
  const fy=def.floorY!==undefined?def.floorY:0.23;
  if(def.parent)def.parent.add(m);
  const anchor={kind:def.kind||'talk',variant:def.variant,x:def.x,z:def.z,face:def.face||0,seatY:def.seatY,floorY:fy,focus:def.focus||null,range:def.range||2,surfY:def.surfY,type:def.type||'world'};
  m.position.set(def.x,fy,def.z);m.rotation.y=anchor.face;
  const A={def:def,m:m,anchor:anchor,sess:null,route:def.route||null,ri:0,wait:rr(0,3),state:def.route?'stay':'pose',wk:rr(0,6),face:anchor.face,name:def.name||'Habitant',job:def.job||'resident',trait:def.trait||personality(),
    type:def.type||null,zone:def.zone||null,cower:0,greeted:false,talkT:0,speed:def.speed||1.15,walkKind:def.walkKind||'talk',look:0,alert:0};
  A.sess=ACT.newSession(anchor,m);
  if(def.anc)def.anc.taken=true;
  ACTORS.push(A);return A;
}
function killActor(A){
  try{ACT.endSession(A.sess,A.m);}catch(e){}
  if(A.m.parent)A.m.parent.remove(A.m);
  if(A.def.anc)A.def.anc.taken=false;
  const i=ACTORS.indexOf(A);if(i>=0)ACTORS.splice(i,1);
}

// ---------- MISE À JOUR
function yawTo(from,tx,tz){return Math.atan2(tx-from.x,tz-from.z);}
function updateActor(A,dt){
  const m=A.m,anc=A.anchor,S0=A.sess;
  const px=m.getWorldPosition?null:null;
  const mx=anc.x,mz=anc.z;
  const dxp=P.x-(A.state==='walk'?m.position.x:mx),dzp=P.z-(A.state==='walk'?m.position.z:mz),dist=Math.hypot(dxp,dzp);
  // peur / alerte
  if(A.cower>0){
    A.cower-=dt;
    if(A.curKind!=='cower'){A.curKind='cower';A.savedKind=anc.kind;A.savedVar=anc.variant;ACT.setKind(S0,m,'cower');popEmoji(m,'😱',2.4);S0.walk=false;}
    ACT.stepActor(S0,m,dt);
    if(A.cower<=0){A.curKind=null;ACT.setKind(S0,m,A.savedKind,A.savedVar);}
    return;
  }
  if(A.alert>0){A.alert-=dt;S0.look=clp(yawTo(m.position,P.x,P.z)-(anc.face),-1.2,1.2);}
  // routine
  if(A.route){
    const w=A.route[A.ri];
    if(A.state==='walk'){
      const dx=w.x-m.position.x,dz=w.z-m.position.z,d=Math.hypot(dx,dz);
      if(d<0.18){
        A.state='stay';A.wait=w.wait||3;anc.x=w.x;anc.z=w.z;anc.face=w.face!==undefined?w.face:A.face;anc.range=w.range||2;anc.floorY=w.floorY!==undefined?w.floorY:anc.floorY;
        S0.walk=false;ACT.setKind(S0,m,w.kind||'talk',w.variant);S0.x=w.x;S0.z=w.z;
      }else{
        const st=Math.min(d,A.speed*dt);m.position.x+=dx/d*st;m.position.z+=dz/d*st;
        const want=Math.atan2(dx,dz);let df=want-A.face;while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;A.face+=df*Math.min(1,dt*6);
        A.wk+=dt*A.speed*5.2;
        swingLimbs(m,A.wk,0.42,false,'walk');
        S0.walk=true;anc.x=m.position.x;anc.z=m.position.z;anc.face=A.face;S0.x=m.position.x;S0.z=m.position.z;
        ACT.stepActor(S0,m,dt);
        return;
      }
    }else{
      A.wait-=dt;
      if(A.wait<=0){A.ri=(A.ri+1)%A.route.length;A.state='walk';A.curKind=null;ACT.setKind(S0,m,A.walkKind);S0.walk=true;}
    }
  }
  // regard vers le joueur quand il s'approche
  let tgt=0;
  if(dist<6&&A.talkT<=0&&A.alert<=0){
    const yaw=Math.atan2(dxp,dzp)-(anc.face+(S0.ch['yaw']||0));let d=yaw;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;tgt=clp(d,-0.9,0.9);
    if(!A.greeted&&dist<4.2){A.greeted=true;if(A.trait==='friendly'&&Math.random()<0.6)popEmoji(m,'👋',1.5);}
  }else if(dist>9)A.greeted=false;
  if(A.talkT>0){A.talkT-=dt;const yaw=Math.atan2(dxp,dzp)-(anc.face+(S0.ch['yaw']||0));let d=yaw;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;tgt=clp(d,-1.1,1.1);}
  S0.look+=(tgt-S0.look)*Math.min(1,dt*4);
  ACT.stepActor(S0,m,dt);
}
let fearCd=0;
function actorsFear(x,z){
  const ctx=interiorType||null;
  let alertedGuard=null;
  for(const A of ACTORS){
    if((A.type||null)!==(A.type?ctx:null)&&A.type)continue;
    if(!A.type&&ctx)continue;
    const mx=A.state==='walk'?A.m.position.x:A.anchor.x,mz=A.state==='walk'?A.m.position.z:A.anchor.z;
    if(Math.hypot(mx-x,mz-z)>(A.type?40:26))continue;
    if(A.job==='guard'||A.job==='bouncer'){A.alert=5;if(!alertedGuard)alertedGuard=A;popEmoji(A.m,'⚠️',2);}
    else if(A.cower<=0&&Math.random()<0.85)A.cower=rr(5,9);
  }
  if(alertedGuard&&ctx&&fearCd<=0&&(SAVE.curWeapon!=='fist')){
    fearCd=20;addCrime(2);showToast('🚨 La sécurité : « Pas d’armes ici ! »');
    setTimeout(()=>{if(interiorType===ctx){BAN[ctx]=performance.now()/1000+120;try{ejectPlayer();}catch(e){}showToast('Tu es banni de ce lieu pendant 2 minutes.');}},2200);
  }
}
function ejectPlayer(){
  if(!interiorType)return;
  if(window.ACT&&ACT.active)ACT.stop(true);
  interiorType=null;P.x=ret.x;P.z=ret.z+1.8;P.y=0;P.vy=0;
  try{streamChunks(true,P.x,P.z);}catch(e){}
}
const _wc=witnessCrime;
witnessCrime=function(x,z){_wc.apply(this,arguments);try{actorsFear(x,z);}catch(e){}};

// ---------- GROUPES D'INTÉRIEUR : hors de la scène tant qu'on n'y est pas
window.ACTORS_API={
  registerGroup:function(type,g){GROUPS[type]=g;if(interiorType!==type&&g.parent)g.parent.remove(g);},
  ban:BAN
};
function syncGroups(){
  for(const t in GROUPS){
    const g=GROUPS[t];
    if(interiorType===t){if(!g.parent)scene.add(g);}
    else if(g.parent)g.parent.remove(g);
  }
}

// ---------- POPULATIONS D'INTÉRIEURS (données)
function shirtFor(job){
  const P_={nurse:[0xf8fafc,0x38bdf8],doctor:[0xf8fafc],patient:[0x93c5fd,0xa5b4fc],waiting:[0x2563eb,0x16a34a,0xf97316,0x7c3aed,0xec4899],janitor:[0x15803d],guard:[0x1e293b],visitor:[0xfacc15,0x22c55e,0xef4444],
    bartender:[0xf97316],regular:[0x0ea5e9,0x16a34a,0xf59e0b,0x7c3aed],diner:[0xef4444,0xfacc15,0x2563eb,0x10b981],clubber:[0xec4899,0xf59e0b,0x8b5cf6,0x06b6d4],pool:[0x1d4ed8,0x9ca3af],darts:[0xdc2626],
    waitress:[0xf8fafc,0xdc2626],host:[0x111827],bouncer:[0x111827],audience:[0xe11d48,0x2563eb,0x16a34a,0xa855f7,0x0ea5e9],vip:[0xd4af37,0x111827],cashier:[0x111827,0xec4899],shopper:[0xec4899,0x16a34a,0xf59e0b,0x2563eb],
    resident:[0xf59e0b,0x16a34a,0xe11d48],chef:[0xf8fafc],maid:[0x0ea5e9],butler:[0x111827],trainer:[0xdc2626],pianist:[0x111827],student:[0x2563eb,0xef4444,0x16a34a,0xf59e0b],office:[0x1f2937,0x334155,0x1e3a8a],worker:[0xf97316,0x2563eb],footballer:[0xdc2626,0x2563eb],referee:[0x111827],smoker:[0x7c3aed,0xdc2626],queue:[0xec4899,0x2563eb,0x16a34a,0xf59e0b]};
  return pick(P_[job]||[0x2563eb]);
}
const NAMES={m:['Paul','Samuel','Jean','Eric','Joseph','Patrice','Blaise','Hervé','Cyrille','Alain','Michel','Armand'],f:['Marie','Aïcha','Clarisse','Nadège','Estelle','Sandrine','Bernadette','Prisca','Larissa','Carine','Édith','Mireille']};
const nameFor=()=>pick(Math.random()<0.5?NAMES.m:NAMES.f);
function mk(type,g,job,kind,x,z,face,o){
  o=o||{};
  return mkActor(Object.assign({parent:g,type:type,job:job,kind:kind,x:x,z:z,face:face,shirt:shirtFor(job),name:nameFor(),floorY:0.23},o));
}
function fillAnchors(type,g,kind,n,job,o,filter){
  const list=(ACT.anchors[type]||[]).filter(a=>a.kind===kind&&!a.taken&&(!filter||filter(a)));
  list.sort(()=>Math.random()-0.5);
  let c=0;
  for(const a of list){
    if(c>=n)break;
    const o2=Object.assign({anc:a,kind:a.kind,variant:a.variant,seatY:a.seatY,floorY:a.floorY!==undefined?a.floorY:0.23,surfY:a.surfY,focus:a.focus},o||{});
    mk(type,g,job,a.kind,a.x,a.z,a.face,o2);c++;
  }
  return c;
}
const ROUTE=(pts)=>pts.map(p=>({x:p[0],z:p[1],wait:p[2]||3,kind:p[3]||'talk',face:p[4],variant:p[5],range:p[6],floorY:p[7]}));

const POP={
  hospital(g,c){
    const ix=c.ix,iz=c.iz,T='hospital';
    mk(T,g,'nurse','type',ix-9,iz-9.3,0,{name:'Infirmière Ngo',acc:['nursecap'],trait:'friendly'});
    mk(T,g,'doctor','write',ix+2,iz-5.9,Math.PI,{name:'Dr Mballa',acc:['stetho'],route:ROUTE([[ix+2,iz-5.9,8,'write',Math.PI],[ix+5.4,iz-6,6,'write',Math.PI/2],[ix+5.4,iz-1.8,6,'write',Math.PI/2],[ix+5.4,iz+2.4,5,'talk',Math.PI/2],[ix+0.5,iz+1.5,4,'talk',0]]),walkKind:'write',speed:1.2,trait:'jolly'});
    mk(T,g,'nurse','write',ix-3,iz-5,0,{name:'Infirmière Essomba',acc:['nursecap'],route:ROUTE([[ix-3,iz-5,5,'write',0],[ix+3.2,iz+1.5,6,'write',Math.PI/2],[ix+3.2,iz+6.2,4,'talk',Math.PI],[ix-1.5,iz+8.2,5,'write',Math.PI],[ix-4.5,iz+1.5,4,'talk',0]]),walkKind:'write',speed:1.3});
    mk(T,g,'nurse','carry',ix+0.8,iz-2.8,0,{name:'Infirmière Atangana',acc:['nursecap'],route:ROUTE([[ix-7,iz-6.2,3,'type',0],[ix-1,iz-2.6,2,'write',Math.PI/2],[ix+4.8,iz-2.6,5,'write',Math.PI/2],[ix+1,iz+2,2,'talk',0]]),walkKind:'carry',speed:1.4,trait:'shy'});
    fillAnchors(T,g,'lie',3,'patient',{trait:'shy'});
    fillAnchors(T,g,'sit',5,'waiting',{});
    mk(T,g,'janitor','mop',ix-1,iz+9,0,{name:'Agent Ondoa',acc:['vest'],range:3.2,trait:'grumpy'});
    mk(T,g,'guard','guard',ix+3.8,iz+9.6,Math.PI,{name:'Agent Biya',acc:['guardcap'],trait:'grumpy'});
    mk(T,g,'visitor','talk',ix-2,iz+4.5,Math.PI/2,{name:'Visiteur Fouda'});
    mk(T,g,'visitor','talk',ix-0.6,iz+4.5,-Math.PI/2,{name:'Visiteuse Abena',trait:'friendly'});
  },
  maquis(g,c){
    const ix=c.ix,iz=c.iz,T='maquis';
    mk(T,g,'bartender','serve',ix-6,iz-9.6,0,{name:'Tonton Jacques',acc:['apron'],trait:'jolly'});
    fillAnchors(T,g,'bar',5,'regular',{},a=>true);
    fillAnchors(T,g,'sit',6,'diner',{});
    fillAnchors(T,g,'dance',2,'clubber',{variant:'club'});
    fillAnchors(T,g,'cue',1,'pool',{});
    mk(T,g,'pool','talk',ix-9.1,iz-3.4,Math.PI,{name:'Gaston',trait:'jolly'});
    fillAnchors(T,g,'dart',1,'darts',{});
    mk(T,g,'waitress','carry',ix-2,iz-6.2,0,{name:'Serveuse Mireille',acc:['apron'],route:ROUTE([[ix-2,iz-6,2,'serve',0],[ix+3.4,iz+3.6,3,'serve',Math.PI/2],[ix+8.6,iz+3.6,3,'serve',Math.PI],[ix+8.6,iz+8.6,3,'serve',Math.PI],[ix+2.6,iz+5.2,2,'carry',-Math.PI/2]]),walkKind:'carry',speed:1.4,trait:'friendly'});
  },
  cabaret(g,c){
    const ix=c.ix,iz=c.iz,T='cabaret';
    mk(T,g,'host','mc',ix,iz-8.2,0,{name:'Monsieur Loyal',floorY:0.95,range:5,route:null,trait:'jolly',acc:['sunglasses']});
    mk(T,g,'bartender','serve',ix-8,iz+14.3,Math.PI,{name:'Barman Rodrigue',acc:['apron'],trait:'friendly'});
    mk(T,g,'bouncer','guard',ix+5,iz+13.4,Math.PI,{name:'Videur Mama Africa',acc:['sunglasses'],trait:'grumpy',scale:1.08});
    fillAnchors(T,g,'sit',8,'audience',{});
    fillAnchors(T,g,'sofa',4,'vip',{},a=>a.x>ix+10);
    fillAnchors(T,g,'bar',3,'regular',{});
    fillAnchors(T,g,'dance',3,'clubber',{variant:'club'});
    mk(T,g,'waitress','carry',ix-6,iz+11.8,Math.PI,{name:'Serveuse Prisca',acc:['apron'],route:ROUTE([[ix-6,iz+11.6,2,'serve',Math.PI],[ix-12,iz+1.2,3,'serve',0],[ix-5,iz+1.2,3,'serve',0],[ix+2,iz+1.2,3,'serve',0],[ix+9,iz+1.2,3,'serve',0]]),walkKind:'carry',speed:1.4});
  },
  boutique(g,c){
    const ix=c.ix,iz=c.iz,T='boutique';
    mk(T,g,'cashier','type',ix+10,iz+8.7,Math.PI,{name:'Vendeuse Chantal',trait:'friendly'});
    mk(T,g,'shopper','browse',ix-11,iz-4.4,0,{name:'Cliente Aminata',route:ROUTE([[ix-11,iz-4.4,6,'browse',Math.PI],[ix-6,iz-4.4,6,'browse',Math.PI],[ix-1,iz-4.4,5,'browse',Math.PI],[ix-4,iz+5,4,'talk',0]]),walkKind:'talk'});
    mk(T,g,'shopper','browse',ix+4,iz-8.4,0,{name:'Client Ibrahim',route:ROUTE([[ix+4,iz-8.2,6,'browse',-Math.PI/2*0],[ix+8,iz-8.2,6,'browse',0],[ix+12,iz-8.2,6,'browse',0],[ix+7,iz+1,4,'talk',Math.PI]]),walkKind:'talk',speed:1.0});
    fillAnchors(T,g,'pose',1,'shopper',{});
    mk(T,g,'shopper','talk',ix+1.5,iz+5.5,Math.PI/2,{name:'Cliente Rosine'});
    mk(T,g,'shopper','talk',ix+2.9,iz+5.5,-Math.PI/2,{name:'Cliente Esther',trait:'jolly'});
  },
  home2(g,c){
    const T='home2';
    fillAnchors(T,g,'cook',1,'resident',{acc:['apron'],name:'Maman Colette',trait:'friendly'});
    fillAnchors(T,g,'sofa',1,'resident',{name:'Papa Jérôme'});
  },
  home3(g,c){
    const T='home3';
    fillAnchors(T,g,'cook',1,'resident',{acc:['apron'],name:'Tantine Rose',trait:'jolly'});
    fillAnchors(T,g,'sofa',1,'resident',{name:'Oncle Basile'});
    fillAnchors(T,g,'cue',1,'resident',{name:'Cousin Yannick',trait:'jolly'});
  }
};
function popEstate(t,g,c){
  const T='estate'+t,ix=c.ix,iz=c.iz,W=c.w,D=c.d;
  if(t>=2)mk(T,g,'maid','mop',ix-W*0.12,iz-D/2+10.5,0,{name:'Gouvernante Solange',acc:['apron'],range:3,floorY:0.23,trait:'friendly'});
  if(t>=3)fillAnchors(T,g,'cook',1,'chef',{acc:['chefhat','apron'],name:'Chef Dieudonné',trait:'jolly'});
  if(t>=4){
    mk(T,g,'butler','talk',ix,iz-D/2+14,0,{name:'Majordome Édouard',acc:['tie'],route:ROUTE([[ix,iz-D/2+13.5,6,'talk',0],[ix-5,iz-D/2+8,4,'talk',Math.PI/2],[ix+6,iz-D/2+8,4,'talk',-Math.PI/2]]),speed:1.0,trait:'shy'});
    mk(T,g,'guard','guard',ix+5,iz+D/2-2.6,Math.PI,{name:'Garde Mvondo',acc:['guardcap','sunglasses'],floorY:0.15});
    fillAnchors(T,g,'piano',1,'pianist',{name:'Pianiste Léopold',acc:['tie']});
  }
  if(t>=5){
    mk(T,g,'guard','guard',ix-5,iz+D/2-2.6,Math.PI,{name:'Garde Ateba',acc:['guardcap','sunglasses'],floorY:0.15});
    fillAnchors(T,g,'curl',1,'trainer',{name:'Coach Rodrigue',trait:'jolly'});
    fillAnchors(T,g,'lounge',1,'resident',{name:'Invitée Stéphanie',floorY:0});
  }
}
window.POPULATE=function(type,g,cfg){
  if(!g)return;
  if(ACTORS_API)ACTORS_API.registerGroup(type,g);
  try{
    if(POP[type])POP[type](g,cfg);
    else if(/^estate\d$/.test(type))popEstate(+type.slice(6),g,cfg);
  }catch(e){console.error('[HABITANTS peuplement '+type+']',e);}
  if(interiorType!==type&&g.parent)g.parent.remove(g);
};

// ---------- POPULATIONS DU MONDE EXTÉRIEUR (créées à l'approche, retirées au loin)
const ZONES=[];
function zone(id,x,z,r,build){ZONES.push({id:id,x:x,z:z,r:r,build:build,on:false,list:[]});}
const CSZ=80;
function W(cx,cz,lx,lz){return [cx*CSZ+lx,cz*CSZ+lz];}
function wa(zn,job,kind,x,z,face,o){
  const A=mkActor(Object.assign({zone:zn.id,type:null,job:job,kind:kind,x:x,z:z,face:face||0,shirt:shirtFor(job),name:nameFor(),floorY:0.3},o||{}));
  A.m.parent||scene.add(A.m);zn.list.push(A);return A;
}
const R_=(pts,k,fy)=>pts.map(p=>({x:p[0],z:p[1],wait:p[2]||2,kind:p[3]||k||'talk',face:p[4],floorY:fy===undefined?0.3:fy}));
// stade de quartier : match de foot
const foot={ball:null,players:[],holder:null,t:0,flight:null};
zone('foot',5*CSZ+40,11*CSZ+40,190,zn=>{
  const cx=5*CSZ+40,cz=11*CSZ+40;
  for(let i=0;i<10;i++){
    const team=i<5?0:1,col=team?0x2563eb:0xdc2626,row=i%5;
    const bx0=cx+(row-2)*9,bz0=cz+(team?-10:10)+(row%2?4:-4);
    const A=wa(zn,'footballer','talk',bx0,bz0,team?0:Math.PI,{shirt:col,floorY:0.34,name:'Joueur '+nameFor(),acc:team?[]:[]});
    A.fb={team:team,bx:bx0,bz:bz0,x:bx0,z:bz0,kick:0};A.state='foot';
    foot.players.push(A);
  }
  wa(zn,'referee','talk',cx+14,cz,-Math.PI/2,{shirt:0x111827,name:'Arbitre Tchoumi',floorY:0.34});
  const ball=new THREE.Mesh(new THREE.SphereGeometry(0.18,10,8),mt(0xffffff,0.5,0));ball.position.set(cx,0.5,cz);scene.add(ball);foot.ball=ball;foot.holder=foot.players[2];foot.t=0;foot.flight=null;
  zn.list.push({m:ball,isBall:true});
  for(let k=0;k<3;k++)wa(zn,'student','sit',cx-18+k*6.5,cz+30,Math.PI,{kind:'sit',variant:k%2?'phone':'lap',seatY:0.7,floorY:0.3,name:'Spectateur '+nameFor()});
});
function footUpdate(zn,dt){
  const cx=5*CSZ+40,cz=11*CSZ+40;
  foot.t+=dt;
  const h=foot.holder;if(!h||!h.fb)return;
  if(foot.flight){
    const f=foot.flight;f.t+=dt;const k=Math.min(1,f.t/f.T);
    foot.ball.position.set(f.x0+(f.x1-f.x0)*k,0.4+Math.sin(k*Math.PI)*1.1,f.z0+(f.z1-f.z0)*k);
    if(k>=1){foot.holder=f.to;foot.flight=null;foot.t=0;}
  }else{
    // le porteur dribble vers le but adverse
    const gz=h.fb.team?cz+26:cz-26;
    const dx=cx-h.fb.x,dz=gz-h.fb.z,d=Math.hypot(dx,dz)||1;
    h.fb.x+=dx/d*2.6*dt*0.6;h.fb.z+=dz/d*2.6*dt;
    foot.ball.position.set(h.fb.x+Math.sin(h.face)*0.5,0.22+Math.abs(Math.sin(foot.t*9))*0.12,h.fb.z+Math.cos(h.face)*0.5);
    if(foot.t>rr(1.6,3)){
      const mates=foot.players.filter(p=>p!==h&&Math.random()<0.6);const to=mates.length?pick(mates):foot.players[0];
      foot.flight={t:0,T:0.9,x0:foot.ball.position.x,z0:foot.ball.position.z,x1:to.fb.x,z1:to.fb.z,to:to};h.fb.kick=0.35;
    }
  }
}
function footPlayersMove(zn,dt){
  const cx=5*CSZ+40,cz=11*CSZ+40,bp=foot.ball.position;
  for(const A of zn.list){
    if(!A.fb)continue;const f=A.fb,m=A.m;
    // zone de jeu : suit le ballon avec retenue
    let tx=f.bx+(bp.x-cx)*0.35,tz=f.bz+(bp.z-cz)*0.45;
    if(foot.holder===A){tx=f.x;tz=f.z;}
    const dx=tx-f.x,dz=tz-f.z,d=Math.hypot(dx,dz);
    if(foot.holder!==A&&d>0.3){f.x+=dx/d*Math.min(d,2.8*dt);f.z+=dz/d*Math.min(d,2.8*dt);}
    const moving=foot.holder===A||d>0.5;
    A.face=Math.atan2(bp.x-f.x,bp.z-f.z)*(moving?0.6:1)+(moving?Math.atan2(dx,dz)*0.4:0);
    m.position.set(f.x,0.34,f.z);m.rotation.y=A.face;
    A.wk+=dt*(moving?7:0);
    swingLimbs(m,A.wk,moving?0.7:0.1,moving,'walk');
    f.kick=Math.max(0,f.kick-dt);if(f.kick>0){m.userData.legR.rotation.x=-1.1;m.userData.kneeR.rotation.x=0.2;}
  }
}
zone('uni',2*CSZ+40,11*CSZ+40,180,zn=>{
  const cx=2*CSZ,cz=11*CSZ;
  for(let k=0;k<3;k++)wa(zn,'student','sit',cx+26+k*5.6,cz+50,Math.PI,{kind:'sit',variant:k%2?'phone':'lap',seatY:0.78,floorY:0.3,acc:k%2?['backpack']:[]});
  wa(zn,'student','talk',cx+14,cz+56,Math.PI/2,{acc:['backpack']});wa(zn,'student','talk',cx+15.4,cz+56,-Math.PI/2,{trait:'jolly'});
  for(let k=0;k<3;k++)wa(zn,'student','carry',cx+14+k*10,cz+56,0,{acc:['backpack'],route:R_([[cx+12+k*6,cz+58,2,'carry'],[cx+68-k*8,cz+58,3,'talk',Math.PI/2],[cx+12+k*6,cz+58,2,'carry']],'carry'),walkKind:'carry',speed:1.2+k*0.1});
  wa(zn,'guard','guard',cx+40,cz+36.5,0,{acc:['guardcap']});
});
for(const [cx,cz] of [[10,3],[11,3],[10,4],[11,4],[10,5],[11,5],[12,4]]){
  zone('biz'+cx+'_'+cz,cx*CSZ+40,cz*CSZ+40,150,zn=>{
    const ox=cx*CSZ,oz=cz*CSZ;
    for(let k=0;k<2;k++){
      wa(zn,'office','carry',ox+40,oz+16+k*8,0,{acc:['tie','briefcase'],route:R_([[ox+40,oz+14+k*6,2,'talk'],[ox+40,oz+66-k*6,3,'talk',0],[ox+40,oz+14+k*6,2,'talk']]),walkKind:'talk',speed:1.3+k*0.2});
      wa(zn,'office','talk',ox+14+k*4,oz+40,0,{acc:['tie'],route:R_([[ox+14+k*4,oz+40,2,'talk'],[ox+66-k*4,oz+40,4,'talk',Math.PI/2],[ox+14+k*4,oz+40,2,'talk']]),walkKind:'talk',speed:1.25});
    }
    wa(zn,'office','talk',ox+43,oz+37,Math.PI/2,{acc:['tie']});wa(zn,'office','talk',ox+44.3,oz+37,-Math.PI/2,{shirt:0x7c3aed,trait:'jolly'});
  });
}
zone('hospfront',10*CSZ+40,1*CSZ+44,140,zn=>{
  const ox=10*CSZ,oz=CSZ;
  wa(zn,'nurse','talk',ox+32,oz+47,Math.PI/2,{acc:['nursecap']});wa(zn,'doctor','talk',ox+33.4,oz+47,-Math.PI/2,{acc:['stetho']});
  wa(zn,'guard','guard',ox+48,oz+47,Math.PI,{acc:['guardcap']});
  wa(zn,'patient','sit',ox+14,oz+44,Math.PI,{kind:'sit',variant:'phone',seatY:0.6,floorY:0.3});
});
for(const [cx,cz] of [[10,9],[11,9],[12,9],[13,9],[10,10],[11,10],[12,10],[13,10]]){
  const hh=(((cx*13)^(cz*7))>>>0);
  zone('ind'+cx+'_'+cz,cx*CSZ+40,cz*CSZ+40,160,zn=>{
    const ox=cx*CSZ,oz=cz*CSZ;
    wa(zn,'worker','carry',ox+10,oz+30,0,{acc:['hardhat','vest'],route:R_([[ox+10,oz+30,2,'carry'],[ox+70,oz+30,3,'talk',Math.PI/2],[ox+10,oz+30,2,'carry']],'carry'),walkKind:'carry',speed:1.2});
    wa(zn,'worker','talk',ox+30,oz+36,0,{acc:['hardhat','vest']});wa(zn,'worker','talk',ox+31.4,oz+36,Math.PI,{acc:['hardhat','vest'],shirt:0x2563eb});
    wa(zn,'guard','guard',ox+40,oz+74,Math.PI,{acc:['guardcap']});
  });
}
zone('night',11*CSZ+40,7*CSZ+45,190,zn=>{
  const ox=11*CSZ,oz=7*CSZ,mx=10*CSZ,mz=7*CSZ,hx=12*CSZ,hz=7*CSZ;
  wa(zn,'bouncer','guard',ox+35.5,oz+41,0,{acc:['sunglasses'],scale:1.08,floorY:0.3});wa(zn,'bouncer','guard',ox+44.5,oz+41,0,{acc:['sunglasses'],scale:1.08,trait:'grumpy'});
  for(let k=0;k<5;k++)wa(zn,'queue','talk',ox+40+(k%2)*1.1,oz+52+k*1.8,Math.PI,{kind:k%2?'sit':'talk',variant:'phone'});
  wa(zn,'smoker','talk',ox+24,oz+44,0,{});wa(zn,'smoker','talk',ox+25.5,oz+44,Math.PI/2*-1,{trait:'friendly'});
  for(let t=0;t<4;t++){const tx=mx+18+t*11,tz=mz+42+(t%2)*7;wa(zn,'diner','bar',tx+1.1,tz,-Math.PI/2,{kind:'sit',variant:'eat',seatY:0.55,floorY:0.3,name:'Client '+nameFor()});}
  for(let k=0;k<3;k++)wa(zn,'shopper','carry',hx+14+k*12,hz+54,0,{acc:[],route:R_([[hx+12+k*10,hz+54,2,'carry'],[hx+68-k*8,hz+54,3,'talk',Math.PI/2],[hx+12+k*10,hz+54,2,'carry']],'carry'),walkKind:'carry',speed:1.1});
});
zone('airport',120,40,200,zn=>{
  wa(zn,'guard','guard',40,69,Math.PI,{acc:['guardcap'],trait:'grumpy',floorY:0.15});
  for(const px of[62,102,142])wa(zn,'worker','talk',px+3.5,38,-Math.PI/2,{acc:['hardhat','vest'],floorY:0.14});
  wa(zn,'worker','carry',90,38,0,{acc:['hardhat','vest'],route:R_([[80,45,3,'carry'],[160,45,3,'talk',Math.PI/2],[80,45,2,'carry']],'carry',0.14),walkKind:'carry',speed:1.3,floorY:0.14});
});
function zonesUpdate(){
  if(interiorType){for(const zn of ZONES)if(zn.on)despawn(zn);return;}
  for(const zn of ZONES){
    const d=Math.hypot(P.x-zn.x,P.z-zn.z);
    if(!zn.on&&d<zn.r&&zn.list.length===0){zn.on=true;try{zn.build(zn);}catch(e){console.error('[HABITANTS zone '+zn.id+']',e);}}
    else if(zn.on&&d>zn.r+90)despawn(zn);
  }
}
function despawn(zn){
  for(const A of zn.list.slice()){if(A.isBall){scene.remove(A.m);}else killActor(A);}
  zn.list=[];zn.on=false;
}

// ---------- BOUCLE
let sync=0,zT=0;
const _u=update;
update=function(dt){
  _u(dt);
  syncGroups();
  fearCd=Math.max(0,fearCd-dt);
  zT-=dt;if(zT<=0){zT=0.8;try{zonesUpdate();}catch(e){}}
  const near=interiorType?null:true;
  for(const A of ACTORS){
    if(A.isBall)continue;
    if(A.type){if(A.type!==interiorType)continue;}
    else{if(interiorType)continue;
      const mx=A.state==='walk'?A.m.position.x:A.anchor.x,mz=A.state==='walk'?A.m.position.z:A.anchor.z;
      if(Math.abs(mx-P.x)>130||Math.abs(mz-P.z)>130){continue;}
    }
    if(A.state==='foot')continue;
    gA('actor',updateActor)(A,dt);
  }
  for(const zn of ZONES)if(zn.on&&zn.id==='foot'){footUpdate(zn,dt);footPlayersMove(zn,dt);}
  // invite « Parler à… »
  try{
    if(S==='play'&&!P.car&&!P.enteringCar&&!(window.ACT&&ACT.active)&&!(EX.isModal&&EX.isModal())){
      const a=nearest(3.2);
      if(a&&!ACT.near()&&!(EX.dbg&&EX.dbg.nearSpot&&EX.dbg.nearSpot())){
        const cpe=document.getElementById('ctx-prompt'),lbl=document.getElementById('act-label');
        const J=JOBS[a.job]||{label:''};
        if(cpe){cpe.textContent='💬 Parler à '+a.name+(J.label?' ('+J.label+')':'')+' — '+(typeof touch!=='undefined'&&touch?'Interagir':'E');cpe.style.display='block';}
        if(lbl)lbl.textContent='PARLER';
      }
    }
  }catch(e){}
};
function nearest(r){
  let best=null,bd=r;
  for(const A of ACTORS){
    if(A.isBall||A.state==='foot')continue;
    if(A.type){if(A.type!==interiorType)continue;}else if(interiorType)continue;
    const mx=A.state==='walk'?A.m.position.x:A.anchor.x,mz=A.state==='walk'?A.m.position.z:A.anchor.z;
    const d=Math.hypot(mx-P.x,mz-P.z);if(d<bd){bd=d;best=A;}
  }
  return best;
}
const _dsa=doSmartAction;
doSmartAction=function(){
  if(!(window.ACT&&ACT.active)&&!(EX.isModal&&EX.isModal())&&S==='play'&&!P.car&&!P.enteringCar){
    const a=nearest(3.2);
    if(a&&!ACT.near()&&!(EX.dbg&&EX.dbg.nearSpot&&EX.dbg.nearSpot())){talkTo(a);return;}
  }
  return _dsa.apply(this,arguments);
};
window.ACTORS_API.nearest=nearest;window.ACTORS_API.ejectPlayer=ejectPlayer;window.ACTORS_API.talkTo=talkTo;window.ACTORS_API.POP=POP;
console.log('[HABITANTS] chargé : métiers, personnalités, routines, réactions.');
})();
