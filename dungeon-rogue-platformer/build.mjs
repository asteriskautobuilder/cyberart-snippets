import fs from "node:fs";
import path from "node:path";

const dir = new URL(".", import.meta.url).pathname;

function writeJson(name, data) {
  fs.writeFileSync(path.join(dir, name), `${JSON.stringify(data, null, 2)}\n`);
}

const initCode = String.raw`
(function(){
  return Object.assign({}, state, {
    drp:{
      w:960,h:540,screen:'class',frame:0,menuIndex:0,classIndex:0,weaponIndex:0,
      level:1,maxLevel:5,worldX:80,cameraX:0,y:330,vy:0,wid:34,hei:52,face:1,
      hp:100,maxHp:100,xp:0,nextXp:35,statPoints:0,dead:false,won:false,grace:0,
      atkTimer:0,atkAnim:0,atkSeq:0,invuln:0,onGround:false,onPlatformIndex:-1,dropTimer:0,dropPlatformIndex:-1,jumpsLeft:0,maxJumps:2,shake:0,message:'Choose a class',
      onRope:false,ropeIndex:-1,ropeGrabCd:0,dashTimer:0,dashCd:0,dashDir:0,lastTapLeft:0,lastTapRight:0,
      className:'',weaponName:'',weaponTier:1,weaponKind:'',weaponRange:52,
      attackStyle:'cleaver',levelTitle:0,levelTitleText:'',transitionTimer:0,transitionFrom:0,transitionTo:0,transitionText:'',levelHeal:0,damageFlash:0,
      stats:{attack:1,defense:1,dexterity:1,intelligence:1,wisdom:1,luck:1,hp:1},
      buffs:{},last:{},audioReady:false,audioBlocked:false,audioArmed:false,musicTick:0,musicStep:0,musicBar:0,
      exitX:0,exitY:0,exitW:0,exitH:0,exitOpen:false
    },
    drpEnemies:[],drpProjectiles:[],drpDrops:[],drpParticles:[],drpPlatforms:[],drpHazards:[],drpPits:[],drpRopes:[]
  });
})();
`;

const updateCode = String.raw`
(function(){
  var W=960,H=540,FLOOR=468,GRAV=0.72;
  if(!state.drp){state.drp={w:W,h:H,screen:'class',frame:0,menuIndex:0,classIndex:0,weaponIndex:0,level:1,maxLevel:5,worldX:80,cameraX:0,y:330,vy:0,wid:34,hei:52,face:1,hp:100,maxHp:100,xp:0,nextXp:35,statPoints:0,stats:{attack:1,defense:1,dexterity:1,intelligence:1,wisdom:1,luck:1,hp:1},buffs:{},last:{},transitionTimer:0,transitionFrom:0,transitionTo:0,transitionText:'',levelHeal:0,damageFlash:0};}
  if(!state.drpEnemies) state.drpEnemies=[];
  if(!state.drpProjectiles) state.drpProjectiles=[];
  if(!state.drpDrops) state.drpDrops=[];
  if(!state.drpParticles) state.drpParticles=[];
  if(!state.drpPlatforms) state.drpPlatforms=[];
  if(!state.drpHazards) state.drpHazards=[];
  if(!state.drpPits) state.drpPits=[];
  if(!state.drpRopes) state.drpRopes=[];
  var g=state.drp,en=state.drpEnemies,pr=state.drpProjectiles,drops=state.drpDrops,parts=state.drpParticles,plats=state.drpPlatforms,haz=state.drpHazards,pits=state.drpPits,ropes=state.drpRopes;
  function saneNum(v,d){return typeof v==='number'&&isFinite(v)?v:d;}
  g.atkTimer=saneNum(g.atkTimer,0);g.atkAnim=saneNum(g.atkAnim,0);g.atkSeq=saneNum(g.atkSeq,0);
  g.musicTick=saneNum(g.musicTick,0);g.musicStep=saneNum(g.musicStep,0);g.musicBar=saneNum(g.musicBar,0);g.musicNotes=saneNum(g.musicNotes,0);
  g.invuln=saneNum(g.invuln,0);g.grace=saneNum(g.grace,0);g.shake=saneNum(g.shake,0);g.levelTitle=saneNum(g.levelTitle,0);g.transitionTimer=saneNum(g.transitionTimer,0);g.transitionFrom=saneNum(g.transitionFrom,0);g.transitionTo=saneNum(g.transitionTo,0);g.levelHeal=saneNum(g.levelHeal,0);g.damageFlash=saneNum(g.damageFlash,0);
  g.maxJumps=saneNum(g.maxJumps,2);g.jumpsLeft=saneNum(g.jumpsLeft,0);g.weaponTier=saneNum(g.weaponTier,1);g.weaponRange=saneNum(g.weaponRange,52);
  g.dropTimer=saneNum(g.dropTimer,0);g.dropPlatformIndex=saneNum(g.dropPlatformIndex,-1);g.onPlatformIndex=saneNum(g.onPlatformIndex,-1);
  g.ropeIndex=saneNum(g.ropeIndex,-1);g.ropeGrabCd=saneNum(g.ropeGrabCd,0);g.dashTimer=saneNum(g.dashTimer,0);g.dashCd=saneNum(g.dashCd,0);g.dashDir=saneNum(g.dashDir,0);g.lastTapLeft=saneNum(g.lastTapLeft,0);g.lastTapRight=saneNum(g.lastTapRight,0);g.onRope=!!g.onRope;
  if(!g.last)g.last={};if(!g.buffs)g.buffs={};if(!g.stats)g.stats={attack:1,defense:1,dexterity:1,intelligence:1,wisdom:1,luck:1,hp:1};

  var classes=[
    {name:'Warrior',color:'#e85d75',hp:132,stats:{attack:3,defense:3,dexterity:1,intelligence:0,wisdom:1,luck:1,hp:3},weapons:[['Iron Cleaver','melee',64,17,24,'cleaver'],['Bulwark Axe','melee',54,24,34,'axe']]},
    {name:'Mage',color:'#8f7bff',hp:82,stats:{attack:1,defense:0,dexterity:1,intelligence:4,wisdom:3,luck:1,hp:0},weapons:[['Ember Wand','magic',280,12,21,'ember'],['Frost Sigil','magic',238,10,19,'frost']]},
    {name:'Archer',color:'#6ce89a',hp:96,stats:{attack:2,defense:1,dexterity:4,intelligence:0,wisdom:1,luck:2,hp:1},weapons:[['Yew Bow','arrow',330,12,17,'arrow'],['Twin Knives','melee',48,10,12,'knives']]},
    {name:'Monk',color:'#f0d36b',hp:108,stats:{attack:2,defense:2,dexterity:3,intelligence:0,wisdom:4,luck:1,hp:2},weapons:[['Prayer Staff','melee',76,13,19,'staff'],['Chi Palm','magic',205,9,14,'chi']]}
  ];
  var stats=['attack','defense','dexterity','intelligence','wisdom','luck','hp'];
  var powerDefs=[
    ['heart','HP +35','#ff5577'],['shield','invincible','#9ee8ff'],['haste','speed','#fff06a'],['spring','jump','#7dff9e'],['fury','attack','#ff8a4c'],
    ['focus','fast attacks','#b58cff'],['tome','bonus xp','#f5e1a1'],['clover','luck','#55ffa9'],['clock','slow foes','#76d7ff'],['bomb','nova','#ffce48'],
    ['magnet','magnet','#f7a8ff'],['vamp','lifesteal','#d24dff'],['regen','regen','#77ffbe'],['armor','defense','#b6c5d6'],['lantern','reveal','#ffd87a']
  ];
  var floorNames=['Crypt of Rust','Fungal Aqueduct','Ashen Library','Clockwork Catacomb','Obsidian Choir'];
  function keyName(v){if(v==null)return '';if(typeof v==='object')v=v.key||v.code||v.name||v.value||'';return String(v).toLowerCase();}
  function markKey(o,v){var raw=keyName(v);if(!raw)return;o[raw]=true;var key=raw.replace(/[^a-z0-9]/g,'');if(raw===' '||key==='space'||key==='spacebar')o.space=true;if(key==='arrowleft'||key==='left')o.left=true;if(key==='arrowright'||key==='right')o.right=true;if(key==='arrowup'||key==='up')o.up=true;if(key==='arrowdown'||key==='down')o.down=true;if(key==='keys'||key==='s')o.light=true;if(key==='keyd'||key==='d')o.heavy=true;if(key==='enter'||key==='return')o.enter=true;if(key==='escape'||key==='esc')o.escape=true;}
  function addKeys(o,src){
    if(!src)return;
    if(Array.isArray(src)){for(var i=0;i<src.length;i++)markKey(o,keyName(src[i]));return;}
    if(typeof Set!=='undefined'&&src instanceof Set){src.forEach(function(v){markKey(o,keyName(v));});return;}
    if(typeof Map!=='undefined'&&src instanceof Map){src.forEach(function(v,k){if(v)markKey(o,keyName(k));});return;}
    if(typeof src==='object'){for(var k in src){if(src[k])markKey(o,keyName(k));}}
  }
  function unlockAudioNow(){
    try{var root=(typeof window!=='undefined')?window:globalThis,Ctx=root.AudioContext||root.webkitAudioContext;if(!root||!Ctx)return null;var ac=root.__drpAudio||(root.__drpAudio=new Ctx());root.__drpAudioGesture=true;if(ac.state==='suspended'&&ac.resume){var p=ac.resume();if(p&&p.then)p.then(function(){root.__drpAudioUnlocked=true;}).catch(function(){root.__drpAudioBlocked=true;});}
      if(!root.__drpAudioPrimed){root.__drpAudioPrimed=true;try{var o=ac.createOscillator(),gn=ac.createGain();gn.gain.setValueAtTime(0.00001,ac.currentTime);o.connect(gn);gn.connect(ac.destination);o.start();o.stop(ac.currentTime+.03);}catch(e){}}
      if(ac.state!=='suspended')root.__drpAudioUnlocked=true;return ac;}catch(e){try{((typeof window!=='undefined')?window:globalThis).__drpAudioBlocked=true;}catch(_){}return null;}
  }
  function installKeyFallback(){
    try{var root=(typeof window!=='undefined')?window:globalThis;if(!root)return;if(!root.__drpKeyFallback)root.__drpKeyFallback={down:{},pressed:{}};
      if(root.__drpInputFallbackInstalled)return;root.__drpInputFallbackInstalled=true;
      var store=root.__drpKeyFallback;
      function setKey(e,isDown){var names=[keyName(e&&e.key),keyName(e&&e.code)];for(var i=0;i<names.length;i++){var n=names[i];if(!n)continue;store.down[n]=isDown;if(isDown)store.pressed[n]=(store.pressed[n]||0)+1;}}
      var down=function(e){setKey(e,true);unlockAudioNow();};
      var up=function(e){setKey(e,false);};
      var gesture=function(){unlockAudioNow();};
      if(root.addEventListener){root.addEventListener('keydown',down,true);root.addEventListener('keyup',up,true);root.addEventListener('pointerdown',gesture,true);root.addEventListener('mousedown',gesture,true);root.addEventListener('touchstart',gesture,true);root.addEventListener('blur',function(){root.__drpKeyFallback={down:{},pressed:{}};store=root.__drpKeyFallback;});}
    }catch(e){}
  }
  function kset(){var o={};installKeyFallback();try{var root=(typeof window!=='undefined')?window:globalThis,fb=root&&root.__drpKeyFallback;if(fb){if(fb.down||fb.pressed){addKeys(o,fb.down);for(var pk in fb.pressed){if(fb.pressed[pk]>0){var clean=String(pk).toLowerCase().replace(/[^a-z0-9]/g,'');markKey(o,pk);if(clean==='s'||clean==='keys')o.lightPressed=true;if(clean==='d'||clean==='keyd')o.heavyPressed=true;if(clean==='space'||clean==='spacebar')o.jumpPressed=true;fb.pressed[pk]--;if(fb.pressed[pk]<=0)delete fb.pressed[pk];}}}else addKeys(o,fb);}}catch(e){}
    try{var km=keyboardManager;if(!km)return o;var lists=[];if(km.getPressedKeys)lists.push(km.getPressedKeys());if(km.getKeysDown)lists.push(km.getKeysDown());if(km.getHeldKeys)lists.push(km.getHeldKeys());if(km.pressedKeys)lists.push(km.pressedKeys);if(km.keysDown)lists.push(km.keysDown);if(km.heldKeys)lists.push(km.heldKeys);if(km.downKeys)lists.push(km.downKeys);if(km.keys)lists.push(km.keys);if(km.keyStates)lists.push(km.keyStates);for(var l=0;l<lists.length;l++)addKeys(o,lists[l]);var names=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Up','Down','Left','Right','KeyS','KeyD','s','d','Enter','Return','Space',' '];for(var n=0;n<names.length;n++){var raw=names[n],down=false;if(km.isKeyDown)down=down||!!km.isKeyDown(raw);if(km.isDown)down=down||!!km.isDown(raw);if(km.isPressed)down=down||!!km.isPressed(raw);if(km.isKeyPressed)down=down||!!km.isKeyPressed(raw);if(km.getKey)down=down||!!km.getKey(raw);if(down)markKey(o,keyName(raw));}}catch(e){}return o;}
  function normPoint(p){
    if(!p)return null;var x=typeof p.x==='number'?p.x:(typeof p.clientX==='number'?p.clientX:NaN),y=typeof p.y==='number'?p.y:(typeof p.clientY==='number'?p.clientY:NaN);
    if(!isFinite(x)||!isFinite(y))return null;
    try{if(typeof dimensionContext!=='undefined'&&dimensionContext&&dimensionContext.width&&dimensionContext.height&&(dimensionContext.width!==W||dimensionContext.height!==H)){var sc=Math.min(dimensionContext.width/W,dimensionContext.height/H),ox=(dimensionContext.width-W*sc)/2,oy=(dimensionContext.height-H*sc)/2;x=(x-ox)/sc;y=(y-oy)/sc;}}catch(e){}
    return {x:x,y:y};
  }
  function heldPointer(){
    if(!pointerManager)return null;try{
      var p=null,down=false;
      if(pointerManager.getPointer) p=pointerManager.getPointer();
      else if(pointerManager.getPointerPosition) p=pointerManager.getPointerPosition();
      else p=pointerManager.pointer||pointerManager.current||pointerManager.position||pointerManager.mouse||null;
      function truth(obj,name){var v=obj&&obj[name];if(typeof v==='function'){try{return !!v.call(obj);}catch(e){return false;}}return !!v;}
      down=!!(truth(pointerManager,'isDown')||truth(pointerManager,'pointerDown')||truth(pointerManager,'down')||truth(pointerManager,'pressed')||(p&&(truth(p,'isDown')||truth(p,'down')||truth(p,'pressed'))));
      if(pointerManager.isPointerDown) down=!!pointerManager.isPointerDown();
      if(pointerManager.isPressed) down=!!pointerManager.isPressed();
      return down?normPoint(p):null;
    }catch(e){return null;}}
  var k=kset(),click=normPoint(pointerManager&&pointerManager.consumeClick?pointerManager.consumeClick():null),held=heldPointer();
  function hitPt(pt,rx,ry,rw,rh){return pt&&pt.x>=rx&&pt.x<=rx+rw&&pt.y>=ry&&pt.y<=ry+rh;}
  function hit(rx,ry,rw,rh){return hitPt(click,rx,ry,rw,rh);}
  var left=!!(k.arrowleft||k.left);
  var right=!!(k.arrowright||k.right);
  var jump=!!(k.space||k.spacebar);
  var aimPoint=click||(g.screen==='play'?held:null);
  var aimClick=aimPoint&&g.screen==='play';
  var lightAttack=!!k.light,heavyAttack=!!k.heavy,lightPressed=!!k.lightPressed,heavyPressed=!!k.heavyPressed,attack=!!(lightAttack||heavyAttack||lightPressed||heavyPressed||aimClick),attackEdge=!!(lightPressed||heavyPressed||(attack&&!g.last.attack)),attackHeavy=!!((heavyAttack||heavyPressed)&&!(lightAttack||lightPressed));
  var up=!!(k.arrowup||k.up),down=!!(k.arrowdown||k.down),confirm=!!(k.enter||k.return||k.space||k.spacebar),back=!!(k.escape||k.esc);

  function armAudio(){try{var root=(typeof window!=='undefined')?window:globalThis,Ctx=root.AudioContext||root.webkitAudioContext;if(!Ctx){g.audioBlocked=true;return null;}var ac=root.__drpAudio||unlockAudioNow()||(root.__drpAudio=new Ctx());g.audioArmed=true;if(root.__drpAudioGesture&&ac.state==='suspended'&&ac.resume){var p=ac.resume();if(p&&p.then)p.then(function(){root.__drpAudioUnlocked=true;}).catch(function(){root.__drpAudioBlocked=true;});}
    g.audioReady=ac.state!=='suspended'||!!root.__drpAudioUnlocked;g.audioBlocked=!!root.__drpAudioBlocked&&!g.audioReady;return ac;}catch(e){g.audioBlocked=true;return null;}}
  function audioLive(ac){try{var root=(typeof window!=='undefined')?window:globalThis;return !!ac&&(ac.state!=='suspended'||!!root.__drpAudioUnlocked);}catch(e){return !!ac&&g.audioReady;}}
  function snd(freq,dur,type,gain){try{var ac=armAudio();if(!audioLive(ac))return;g.audioReady=true;g.audioBlocked=false;var o=ac.createOscillator(),gn=ac.createGain();o.type=type||'square';o.frequency.value=freq;gn.gain.setValueAtTime(gain||0.035,ac.currentTime);gn.gain.exponentialRampToValueAtTime(0.0001,ac.currentTime+dur);o.connect(gn);gn.connect(ac.destination);o.start();o.stop(ac.currentTime+dur);}catch(e){g.audioBlocked=true;}}
  function sfx(n){if(n==='hit'){snd(92,.16,'sawtooth',.06);snd(54,.22,'square',.03);}else if(n==='impact'){snd(132,.04,'square',.025);}else if(n==='dash'){snd(170,.035,'square',.028);snd(430,.045,'triangle',.018);}else if(n==='rope'){snd(280,.04,'triangle',.02);snd(190,.05,'square',.014);}else if(n==='cleaver'){snd(180,.05,'sawtooth',.045);snd(82,.08,'square',.025);}else if(n==='axe'){snd(120,.08,'sawtooth',.055);snd(64,.13,'square',.035);}else if(n==='knives'){snd(420,.035,'triangle',.035);snd(520,.04,'triangle',.025);}else if(n==='staff'){snd(260,.06,'square',.035);snd(180,.08,'triangle',.02);}else if(n==='ember'){snd(330,.05,'sawtooth',.035);snd(660,.06,'triangle',.02);}else if(n==='frost'){snd(520,.07,'sine',.03);snd(880,.05,'triangle',.018);}else if(n==='arrow'){snd(360,.035,'triangle',.03);snd(160,.05,'square',.012);}else if(n==='chi'){snd(240,.045,'sine',.035);snd(720,.08,'triangle',.022);}else if(n==='atk'){snd(220,.05,'square',.035);snd(440,.05,'triangle',.02);}else if(n==='drop'){snd(620,.06,'triangle',.035);snd(920,.08,'sine',.025);}else if(n==='level'){snd(330,.07,'square',.04);snd(660,.1,'triangle',.04);snd(990,.12,'sine',.025);}else if(n==='select'){snd(300,.04,'square',.025);}else if(n==='boss'){snd(80,.26,'sawtooth',.08);}}
  function note(ac,freq,dur,type,gain,delay){try{if(!freq)return;var t=ac.currentTime+(delay||0),o=ac.createOscillator(),gn=ac.createGain();o.type=type||'square';o.frequency.setValueAtTime(freq,t);gn.gain.setValueAtTime(0.0001,t);gn.gain.exponentialRampToValueAtTime(gain||0.02,t+.015);gn.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(gn);gn.connect(ac.destination);o.start(t);o.stop(t+dur+.03);g.musicNotes=(g.musicNotes||0)+1;}catch(e){}}
  function music(){if(g.screen!=='play')return;if(g.audioArmed&&!g.audioReady)armAudio();if(!g.audioReady)return;var ac=armAudio();if(!audioLive(ac))return;g.musicTick--;if(g.musicTick>0)return;g.musicTick=9;var lead=[220,0,247,294,0,247,196,0,165,196,220,0,247,196,165,0],bass=[55,0,55,0,49,0,49,0,65,0,62,0,55,0,73,0],step=g.musicStep++%16;g.musicBar=Math.floor(g.musicStep/16);note(ac,lead[step],.16,'triangle',.018,0);if(step%2===0)note(ac,bass[step],.18,'square',.018,0);if(step%4===0)note(ac,82,.07,'sine',.03,0);if(step%4===2)note(ac,440,.025,'triangle',.008,0);}
  function rnd(a,b){return a+Math.random()*(b-a);}
  function rect(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
  function puff(x,y,col,n){for(var i=0;i<(n||8);i++)parts.push({x:x,y:y,vx:rnd(-2.8,2.8),vy:rnd(-4,1.5),life:24+Math.random()*18,c:col||'#fff'});}
  function applyClass(){var c=classes[g.classIndex],w=c.weapons[g.weaponIndex];g.className=c.name;g.weaponName=w[0];g.weaponKind=w[1];g.weaponRange=w[2];g.attackStyle=w[5]||w[1];g.stats={};for(var key in c.stats)g.stats[key]=c.stats[key];g.maxHp=c.hp+g.stats.hp*8;g.hp=g.maxHp;g.weaponTier=1;g.xp=0;g.nextXp=35;g.statPoints=0;g.maxJumps=2;g.jumpsLeft=2;}
  var floorProfiles=[
    {label:'rust_intro',length:4300,sectionStep:650,pitGap:680,pitChance:.62,ropeTarget:3,enemyPlatformChance:.5,sections:['shelf','stack','bridge','high'],firewheels:0,enemyBonus:1},
    {label:'fungal_aqueduct',length:5050,sectionStep:720,pitGap:600,pitChance:.72,ropeTarget:4,enemyPlatformChance:.56,sections:['bridge','stack','shelf','high','block'],firewheels:1,enemyBonus:3},
    {label:'ashen_library',length:5700,sectionStep:620,pitGap:720,pitChance:.55,ropeTarget:5,enemyPlatformChance:.66,sections:['stack','block','high','stack','shelf'],firewheels:1,enemyBonus:4},
    {label:'clockwork_catacomb',length:6350,sectionStep:760,pitGap:660,pitChance:.62,ropeTarget:4,enemyPlatformChance:.62,sections:['block','high','bridge','stack'],firewheels:2,enemyBonus:5},
    {label:'obsidian_choir',length:6900,sectionStep:680,pitGap:620,pitChance:.68,ropeTarget:6,enemyPlatformChance:.7,sections:['stack','high','block','bridge','stack'],firewheels:2,enemyBonus:7}
  ];
  function levelProfile(){return floorProfiles[Math.max(0,Math.min(floorProfiles.length-1,(g.level||1)-1))]||floorProfiles[0];}
  function levelLength(){return levelProfile().length;}
  function enemyBase(type){return {rat:[28,9,36,24],slime:[42,12,38,30],bat:[30,10,34,28],skel:[56,16,36,48],cult:[46,13,34,46],archer:[44,15,34,46],knight:[92,22,42,54],wisp:[36,14,30,34],boss:[360,28,96,118]}[type]||[40,10,34,34];}
  function isFlyer(type){return type==='bat'||type==='wisp';}
  function pitAt(x,w){
    var left=x+4,right=x+w-4;
    for(var i=0;i<pits.length;i++){var p=pits[i];if(right>p.x&&left<p.x+p.w)return p;}
    return null;
  }
  function floorBlocked(x,w){
    return !!pitAt(x,w);
  }
  function nearestSafeFloorX(seed,w,idx){
    var min=120,max=levelLength()-180,step=44+(idx||0)*5,base=Math.min(max,Math.max(min,seed));
    if(!floorBlocked(base,w))return base;
    for(var n=1;n<38;n++){
      var a=Math.min(max,base+step*n);if(!floorBlocked(a,w))return a;
      var b=Math.max(min,base-step*n);if(!floorBlocked(b,w))return b;
    }
    return 120;
  }
  function surfaceForDrop(x,w,preferredY,e){
    var cx=x+w/2,pl=null;
    if(e&&e.groundY&&e.groundY<FLOOR&&e.platformW){
      pl={x:e.platformX,y:e.groundY,w:e.platformW,h:18};
    }else pl=platformFor(x,w,preferredY);
    if(pl&&cx>=pl.x+8&&cx<=pl.x+pl.w-8)return {x:Math.max(pl.x+8,Math.min(pl.x+pl.w-w-8,x)),y:pl.y,platform:true};
    var fx=nearestSafeFloorX(x,w,0);
    return {x:fx,y:FLOOR,platform:false};
  }
  function recoverFromPit(){
    var fx=nearestSafeFloorX(g.worldX,g.wid,0);
    if(g.invuln<=0&&(g.grace||0)<=0)damage(16+g.level*4);
    if(g.screen==='dead')return;
    g.worldX=fx;g.y=FLOOR-g.hei;g.vy=0;g.onGround=true;g.onPlatformIndex=-1;g.onRope=false;g.ropeIndex=-1;g.dashTimer=0;g.jumpsLeft=g.maxJumps||2;g.invuln=Math.max(g.invuln||0,70);g.shake=12;puff(g.worldX+g.wid/2,FLOOR-8,'#8ef7ff',14);
  }
  function pitSpaceBlocked(x,w,y,h){
    var r={x:x+4,y:y,w:Math.max(2,w-8),h:h};
    for(var i=0;i<pits.length;i++){if(rect(r,pits[i]))return true;}
    return false;
  }
  function circleRect(cx,cy,cr,r){
    var nx=Math.max(r.x,Math.min(cx,r.x+r.w)),ny=Math.max(r.y,Math.min(cy,r.y+r.h)),dx=cx-nx,dy=cy-ny;
    return dx*dx+dy*dy<=cr*cr;
  }
  function platformFor(x,w,preferredY){
    var best=null,bestDy=9999,cx=x+w/2;
    for(var i=0;i<plats.length;i++){
      var p=plats[i];if(cx<p.x+16||cx>p.x+p.w-16||w>p.w-20)continue;
      var dy=preferredY==null?0:Math.abs(p.y-preferredY);
      if(dy<bestDy){best=p;bestDy=dy;}
    }
    return best;
  }
  function clearFloorX(seed,w,idx){
    var min=620,max=levelLength()-260,step=58+(idx||0)*7,base=Math.min(max,Math.max(min,seed));
    if(!floorBlocked(base,w))return base;
    for(var n=1;n<24;n++){
      var a=Math.min(max,base+step*n);if(!floorBlocked(a,w))return a;
      var b=Math.max(min,base-step*n);if(!floorBlocked(b,w))return b;
    }
    return base;
  }
  function makeGroundSpawn(type,seedX,idx){
    var prof=levelProfile(),base=enemyBase(type),w=base[2],h=base[3],x=seedX,pl=null,tryPlat=type!=='rat'&&type!=='slime'&&Math.random()<(prof.enemyPlatformChance||.42);
    if(tryPlat&&plats.length){
      var start=Math.floor(Math.random()*plats.length);
      for(var pass=0;pass<2&&!pl;pass++){
        for(var i=0;i<plats.length;i++){
          var p=plats[(start+i)%plats.length],tag=p.tag||'',prefer=tag==='high'||tag==='stack'||tag==='block'||p.y<310;
          if(pass===0&&!prefer)continue;
          if(p.x>420&&p.x+p.w<levelLength()-180&&p.w>w+34){pl=p;x=p.x+18+Math.random()*Math.max(8,p.w-w-36);break;}
        }
      }
    }
    if(!pl){
      x=clearFloorX(x,w,idx);
    }
    var gy=pl?pl.y:FLOOR;
    return {x:x,y:gy-h,groundY:gy,platformX:pl?pl.x:0,platformW:pl?pl.w:0};
  }
  function makeEnemySpawn(type,seedX,idx){
    var base=enemyBase(type),w=base[2],h=base[3];
    if(isFlyer(type)){
      var lane=235+Math.random()*110,pl=platformFor(seedX,w,lane);
      if(pl&&Math.random()<.55)lane=pl.y-74-Math.random()*42;
      lane=Math.max(132,Math.min(FLOOR-h-58,lane));
      return {x:seedX,y:lane,groundY:0,platformX:0,platformW:0,homeY:lane};
    }
    return makeGroundSpawn(type,seedX,idx);
  }
  function groundMoveSafe(e,nextX){
    if(e.boss)return !floorBlocked(nextX,e.w);
    if(e.groundY&&e.groundY<FLOOR){
      var left=e.platformX||nextX,right=left+(e.platformW||0);
      return nextX+5>=left&&nextX+e.w-5<=right;
    }
    return !floorBlocked(nextX,e.w);
  }
  function moveGround(e,dx){
    if(!dx)return;
    var nx=e.x+dx;
    if(groundMoveSafe(e,nx))e.x=nx;
    else{e.dir=dx>0?-1:1;e.jump=Math.max(e.jump||0,24);e.vx=0;}
  }
  function clearHazardSweep(r){
    if(r.x<600||r.x+r.w>g.exitX-230)return false;
    for(var i=0;i<pits.length;i++){var p=pits[i],pad=28;if(rect({x:r.x-pad,y:r.y-pad,w:r.w+pad*2,h:r.h+pad*2},p))return false;}
    for(var j=0;j<plats.length;j++){
      var pl=plats[j],landing={x:pl.x+12,y:pl.y-16,w:pl.w-24,h:pl.h+34},overlap=Math.min(r.x+r.w,landing.x+landing.w)-Math.max(r.x,landing.x);
      if(rect(r,landing)&&overlap>landing.w*.78)return false;
    }
    return true;
  }
  function addFirewheel(seedX,idx){
    if(g.level<2)return false;
    var radius=52+Math.min(24,g.level*5)+Math.floor(Math.random()*10),ball=10+(g.level>=4?2:0),count=3+(g.level>=4?1:0);
    for(var tryN=0;tryN<8;tryN++){
      var base=seedX+tryN*170+(tryN%2?-85:0),cx=clearFloorX(base,Math.max(96,radius*2+36),idx+tryN)+radius+34,cy=FLOOR-86-Math.floor(Math.random()*22);
      var sweep={x:cx-radius-ball-14,y:cy-radius-ball-14,w:(radius+ball+14)*2,h:(radius+ball+14)*2};
      if(!clearHazardSweep(sweep))continue;
      haz.push({type:'firewheel',cx:cx,cy:cy,x:sweep.x,y:sweep.y,w:sweep.w,h:sweep.h,radius:radius,ball:ball,count:count,speed:(idx%2?-.034:.03)+g.level*.002*(idx%2?-1:1),phase:Math.random()*Math.PI*2,dmg:13+g.level*3});
      return true;
    }
    return false;
  }
  function makeLevel(){
    en.length=0;pr.length=0;drops.length=0;parts.length=0;plats.length=0;haz.length=0;pits.length=0;ropes.length=0;
    g.worldX=80;g.cameraX=0;g.y=FLOOR-g.hei;g.vy=0;g.onRope=false;g.ropeIndex=-1;g.ropeGrabCd=0;g.dashTimer=0;g.dashCd=0;g.invuln=260;g.grace=260;g.jumpsLeft=g.maxJumps||2;g.buffs={};g.message=floorNames[g.level-1]||'Deep Floor';g.levelTitle=190;g.levelTitleText=g.message;
    var prof=levelProfile(),len=levelLength();
    g.exitX=len-112;g.exitY=FLOOR-96;g.exitW=68;g.exitH=96;g.exitOpen=g.level<g.maxLevel;
    function ropeClear(rx,top,bottom){
      if(rx<190||rx>g.exitX-130||bottom-top<74)return false;
      if(pitAt(rx-12,24)&&bottom>FLOOR-20)return false;
      for(var h=0;h<haz.length;h++){var hz=haz[h],pad=34;if(hz.type==='firewheel'&&rx>hz.x-pad&&rx<hz.x+hz.w+pad&&bottom>hz.y-pad&&top<hz.y+hz.h+pad)return false;}
      for(var r=0;r<ropes.length;r++)if(Math.abs(ropes[r].x-rx)<170)return false;
      return true;
    }
    function addRopeAt(rx,top,bottom,tag){
      top=Math.max(76,Math.floor(top));bottom=Math.min(FLOOR-10,Math.floor(bottom));
      if(ropeClear(rx,top,bottom))ropes.push({x:Math.floor(rx),y:top,h:bottom-top,w:12,bottomY:bottom,tag:tag||'platform'});
    }
    function pitOverlap(x,w){
      for(var i=0;i<pits.length;i++){var p=pits[i];if(x+w>p.x+6&&x<p.x+p.w-6)return true;}
      return false;
    }
    function addPit(seedX,idx){
      var pw=92+Math.floor(Math.random()*(g.level>=4?110:78)),x=Math.min(len-610,Math.max(700,seedX+Math.floor(Math.random()*90)-35));
      if(x<620||x+pw>g.exitX-250)return false;
      for(var i=0;i<pits.length;i++)if(Math.abs((pits[i].x+pits[i].w/2)-(x+pw/2))<310)return false;
      pits.push({x:x,y:FLOOR,w:pw,h:H-FLOOR,type:'pit',tag:prof.label});
      if(Math.random()<.86)haz.push({x:x+14,y:FLOOR+26,w:Math.max(34,pw-28),h:28,type:'spikes',pit:true});
      return true;
    }
    function addPlat(x,y,w,h,large,tag){
      x=Math.floor(Math.max(260,Math.min(g.exitX-150,x)));w=Math.floor(w);y=Math.floor(y);h=h||18;
      if(x+w>g.exitX-90)w=Math.max(86,g.exitX-90-x);
      if(w<76)return null;
      if((tag==='shelf'||tag==='block')&&pitOverlap(x,w))return null;
      var pl={x:x,y:y,w:w,h:h,semi:true,drop:true,large:!!large,tag:tag||''};
      plats.push(pl);return pl;
    }
    function addStack(cx,tiers,baseY,tag){
      var last=null;
      for(var t=0;t<tiers;t++){
        var w=(t===0?230:Math.max(126,208-t*28))+Math.floor(Math.random()*36),y=baseY-t*(58+Math.floor(Math.random()*8)),x=cx-w/2+(t%2?34:-18);
        last=addPlat(x,y,w,t===0?26:18,t===0,tag||'stack');
      }
      if(tiers>2&&last)addRopeAt(last.x+Math.min(last.w-34,Math.max(34,last.w*.55)),last.y-104,FLOOR-10,'stack');
    }
    function addSection(kind,x,idx){
      var jitter=Math.floor(Math.random()*95)-38;
      if(kind==='shelf'){
        addPlat(x+jitter,402-Math.floor(Math.random()*28),270+Math.floor(Math.random()*90),30,true,'shelf');
        if(Math.random()<.45)addPlat(x+jitter+80,310-Math.floor(Math.random()*28),150+Math.floor(Math.random()*70),18,false,'high');
      }else if(kind==='stack'){
        addStack(x+110+jitter,2+(idx+g.level)%2+(g.level>=3&&Math.random()<.5?1:0),386-Math.floor(Math.random()*24),'stack');
      }else if(kind==='high'){
        var pl=addPlat(x+jitter,238+Math.floor(Math.random()*58),230+Math.floor(Math.random()*100),18,false,'high');
        if(pl)addRopeAt(pl.x+pl.w*.5,pl.y-112,FLOOR-10,'high');
        if(Math.random()<.62)addPlat(x+jitter+210,354+Math.floor(Math.random()*28),150+Math.floor(Math.random()*50),18,false,'step');
      }else if(kind==='bridge'){
        var pit=null;for(var p=0;p<pits.length;p++){if(Math.abs(pits[p].x-x)<260){pit=pits[p];break;}}
        if(pit)addPlat(pit.x-36,326-Math.floor(Math.random()*44),pit.w+96,18,false,'bridge');
        else addPlat(x+jitter,334-Math.floor(Math.random()*40),220+Math.floor(Math.random()*90),18,false,'bridge');
      }else{
        var b=addPlat(x+jitter,390-Math.floor(Math.random()*36),330+Math.floor(Math.random()*110),34,true,'block');
        if(b&&Math.random()<.72)addPlat(b.x+46,b.y-88,170+Math.floor(Math.random()*80),18,false,'high');
      }
    }
    for(var px=760,pi=0;px<len-560;px+=prof.pitGap+Math.floor(Math.random()*210),pi++){
      if(Math.random()<prof.pitChance)addPit(px,pi);
    }
    addPlat(286,374,190,20,false,'starter');
    for(var sx=560,si=0;sx<len-560;sx+=prof.sectionStep+Math.floor(Math.random()*170)-60,si++){
      addSection(prof.sections[si%prof.sections.length],sx,si);
    }
    addPlat(g.exitX-360,392,245,30,true,'exit_shelf');
    if(plats.length)addRopeAt(300,166,FLOOR-10,'starter');
    for(var rp=0;rp<plats.length&&ropes.length<(prof.ropeTarget||Math.min(5,2+Math.floor(g.level/2)));rp++){
      var plr=plats[(rp*3+g.level)%plats.length],rx=plr.x+Math.max(34,Math.min(plr.w-34,plr.w*(.35+.25*((rp+g.level)%2))));
      var bottom=FLOOR-10;
      for(var lp=0;lp<plats.length;lp++){var low=plats[lp];if(low.y>plr.y+54&&rx>low.x+18&&rx<low.x+low.w-18)bottom=Math.min(bottom,low.y-8);}
      addRopeAt(rx,plr.y-112,bottom,'platform');
    }
    var firewheels=prof.firewheels;
    for(var fw=0;fw<firewheels;fw++)addFirewheel(900+fw*(620+Math.random()*180)+g.level*80,fw);
    var types=['rat','slime','bat','skel','cult','archer','knight','wisp'];
    for(var e=0;e<8+g.level*3+(prof.enemyBonus||0);e++){
      var t=types[Math.min(types.length-1,Math.floor(Math.random()*(3+g.level)))];
      spawnEnemy(t,980+e*(270+Math.random()*150),false,e);
    }
    if(g.level>=g.maxLevel) spawnEnemy('boss',len-360,true,0);
  }
  function recoverForLevel(){
    var missing=Math.max(0,g.maxHp-g.hp),base=Math.ceil(g.maxHp*.35),catchup=Math.ceil(missing*.55),wisdom=28+(g.stats.wisdom||0)*5;
    var heal=Math.min(missing,Math.max(base,catchup,wisdom));g.hp=Math.min(g.maxHp,g.hp+heal);g.levelHeal=heal;return heal;
  }
  function beginTransition(){
    var from=g.level;g.level++;makeLevel();recoverForLevel();g.screen='transition';g.transitionTimer=140;g.transitionFrom=from;g.transitionTo=g.level;g.transitionText=g.message;g.last={};sfx('level');
  }
  function spawnEnemy(type,x,boss,idx){
    var base=enemyBase(type),sp=boss?makeGroundSpawn(type,x,idx||0):makeEnemySpawn(type,x,idx||0);
    var hp=base[0]+g.level*10+(boss?120:0),dmg=base[1]+g.level*2;
    en.push({type:type,move:isFlyer(type)?'fly':'ground',x:sp.x,y:sp.y,w:base[2],h:base[3],vx:0,vy:0,hp:hp,max:hp,dmg:dmg,boss:!!boss,timer:Math.random()*80,jump:0,dir:-1,cd:40+Math.random()*50,xp:(boss?220:14+g.level*6),groundY:sp.groundY||FLOOR,platformX:sp.platformX||0,platformW:sp.platformW||0,homeY:sp.homeY||sp.y});
  }
  function start(){armAudio();g.classIndex=Math.max(0,Math.min(classes.length-1,g.classIndex|0));g.weaponIndex=Math.max(0,Math.min(1,g.weaponIndex|0));applyClass();g.level=1;g.screen='play';g.dead=false;g.won=false;g.last={};g.musicTick=1;makeLevel();sfx('select');}
  function chooseMenu(max){if(up&&!g.last.up){armAudio();g.menuIndex=(g.menuIndex+max-1)%max;sfx('select');}if(down&&!g.last.down){armAudio();g.menuIndex=(g.menuIndex+1)%max;sfx('select');}}
  function clickedClass(){if(!click)return -1;for(var i=0;i<classes.length;i++){var y=206+i*48;if(hit(150,y-26,660,36))return i;}return -1;}
  function clickedWeapon(){if(!click)return -1;for(var i=0;i<2;i++){var y=250+i*58;if(hit(250,y-31,460,42))return i;}return -1;}
  function clickedStat(){if(!click)return -1;for(var i=0;i<stats.length;i++){var y=170+i*38;if(hit(236,y-24,488,30))return i;}return -1;}

  g.frame++;
  if(g.screen==='transition'){g.transitionTimer--;if(g.transitionTimer<=0){g.screen='play';g.transitionTimer=0;g.last={};}return state;}
  for(var bn in g.buffs){if(g.buffs[bn]>0)g.buffs[bn]--;else delete g.buffs[bn];}
  if(click||held||left||right||jump||attack||confirm||up||down)armAudio();
  music();
  if(g.screen==='class'){chooseMenu(classes.length);var cc=clickedClass();if(cc>=0){g.menuIndex=cc;g.classIndex=cc;g.screen='weapon';g.menuIndex=0;sfx('select');}else{g.classIndex=g.menuIndex;if(confirm&&!g.last.confirm){g.screen='weapon';g.menuIndex=0;sfx('select');}}g.last={up:up,down:down,confirm:confirm};return state;}
  if(g.screen==='weapon'){chooseMenu(2);var cw=clickedWeapon();if(cw>=0){g.weaponIndex=cw;start();}else{g.weaponIndex=g.menuIndex;if(back&&!g.last.back){g.screen='class';g.menuIndex=g.classIndex;}if(confirm&&!g.last.confirm)start();}g.last={up:up,down:down,confirm:confirm,back:back};return state;}
  if(g.screen==='levelup'){
    chooseMenu(stats.length);var cs=clickedStat();if(cs>=0)g.menuIndex=cs;if((cs>=0)||confirm&&!g.last.confirm){var st=stats[g.menuIndex];g.stats[st]++;g.statPoints--;if(st==='hp'){g.maxHp+=12;g.hp+=12;}sfx('level');if(g.statPoints<=0)g.screen='play';}
    g.last={up:up,down:down,confirm:confirm};return state;
  }
  if(g.screen==='dead'||g.screen==='win'){if(click||confirm&&!g.last.confirm){g.screen='class';g.menuIndex=0;g.classIndex=0;g.weaponIndex=0;g.className='';g.weaponName='';g.transitionTimer=0;g.transitionFrom=0;g.transitionTo=0;g.transitionText='';g.levelHeal=0;g.onRope=false;g.ropeIndex=-1;g.dashTimer=0;en.length=0;pr.length=0;drops.length=0;parts.length=0;plats.length=0;haz.length=0;pits.length=0;ropes.length=0;}g.last={confirm:confirm};return state;}
  if(g.screen!=='play'){return state;}

  function ropeForPlayer(){
    var cx=g.worldX+g.wid/2,py=g.y+4,pb=g.y+g.hei-3,best=-1,bestDx=9999;
    for(var i=0;i<ropes.length;i++){
      var r=ropes[i],dx=Math.abs(cx-r.x),top=r.y-8,bottom=(r.bottomY||(r.y+r.h))+10;
      if(dx<20&&pb>top&&py<bottom&&dx<bestDx){best=i;bestDx=dx;}
    }
    return best;
  }
  var speed=3.1+g.stats.dexterity*.22+(g.buffs.haste?2.2:0),jumpPow=13.2+g.stats.dexterity*.16+(g.buffs.spring?3.2:0);
  if(g.ropeGrabCd>0)g.ropeGrabCd--; if(g.dashCd>0)g.dashCd--; if(g.lastTapLeft>0)g.lastTapLeft--; if(g.lastTapRight>0)g.lastTapRight--;
  var leftTap=left&&!g.last.left,rightTap=right&&!g.last.right;
  if(!g.onRope&&g.dashCd<=0&&g.dashTimer<=0){
    if(leftTap&&g.lastTapLeft>0){g.dashTimer=9;g.dashCd=46;g.dashDir=-1;g.face=-1;g.lastTapLeft=0;puff(g.worldX+g.wid/2,g.y+g.hei-8,'#8ef7ff',9);sfx('dash');}
    else if(rightTap&&g.lastTapRight>0){g.dashTimer=9;g.dashCd=46;g.dashDir=1;g.face=1;g.lastTapRight=0;puff(g.worldX+g.wid/2,g.y+g.hei-8,'#8ef7ff',9);sfx('dash');}
  }
  if(leftTap)g.lastTapLeft=16;if(rightTap)g.lastTapRight=16;
  var ropeIdx=ropeForPlayer();
  if(!g.onRope&&ropeIdx>=0&&g.ropeGrabCd<=0&&(up||down)){g.onRope=true;g.ropeIndex=ropeIdx;g.vy=0;g.onGround=false;g.onPlatformIndex=-1;sfx('rope');}
  if(g.onRope&&(g.ropeIndex<0||g.ropeIndex>=ropes.length)) {g.onRope=false;g.ropeIndex=-1;}
  var ropeJumped=false;
  if(g.onRope){
    var rr=ropes[g.ropeIndex],centerX=rr.x-g.wid/2,topY=rr.y-8,bottomY=(rr.bottomY||(rr.y+rr.h))-g.hei+6,climb=3.15+g.stats.dexterity*.08;
    g.worldX+=(centerX-g.worldX)*.38; if(left)g.face=-1;if(right)g.face=1;
    if(up)g.y-=climb;if(down)g.y+=climb;g.y=Math.max(topY,Math.min(bottomY,g.y));g.vy=0;g.onGround=false;g.onPlatformIndex=-1;g.jumpsLeft=g.maxJumps||2;g.dashTimer=0;
    if(jump&&!g.last.jump){var dir=left?-1:right?1:g.face||1;g.onRope=false;g.ropeIndex=-1;g.ropeGrabCd=16;g.vy=-jumpPow*.94;g.worldX+=dir*7;g.face=dir;g.jumpsLeft=Math.max(0,(g.maxJumps||2)-1);ropeJumped=true;puff(g.worldX+g.wid/2,g.y+g.hei-6,'#f0d36b',8);snd(330,.05,'triangle',.025);}
    else if(g.y>=bottomY-1&&down){g.onRope=false;g.ropeIndex=-1;g.ropeGrabCd=8;}
  }
  if(!g.onRope){
    if(g.dashTimer>0){var dashSpeed=10.6+Math.min(2.4,g.stats.dexterity*.18);g.worldX+=(g.dashDir||g.face||1)*dashSpeed;g.dashTimer--;if(g.frame%2===0)parts.push({x:g.worldX+(g.dashDir>0?0:g.wid),y:g.y+18,vx:-(g.dashDir||1)*1.2,vy:rnd(-.7,.7),life:18,c:'#8ef7ff'});}
    if(left){g.worldX-=speed;g.face=-1;} if(right){g.worldX+=speed;g.face=1;}
  }
  var minX=Math.max(20,g.cameraX-40); if(g.worldX<minX)g.worldX=minX;
  if(g.dropTimer>0)g.dropTimer--;
  if(!g.onRope){
    if(!ropeJumped&&jump&&!g.last.jump&&down&&g.onGround&&g.onPlatformIndex>=0){g.dropTimer=18;g.dropPlatformIndex=g.onPlatformIndex;g.y+=5;g.vy=2.2;g.onGround=false;g.onPlatformIndex=-1;puff(g.worldX+g.wid/2,g.y+g.hei-4,'#8ef7ff',5);}
    else if(!ropeJumped&&jump&&!g.last.jump&&(g.onGround||(g.jumpsLeft||0)>0)){var air=!g.onGround;g.vy=air?-jumpPow*.92:-jumpPow;g.onGround=false;g.onPlatformIndex=-1;g.jumpsLeft=Math.max(0,(g.jumpsLeft||1)-1);puff(g.worldX+g.wid/2,g.y+g.hei-4,air?'#8ef7ff':'#f0d36b',air?8:5);snd(air?520:250,.05,air?'triangle':'square',.025);}
    g.vy+=GRAV; g.y+=g.vy; g.onGround=false;g.onPlatformIndex=-1;
    if(g.y+g.hei>=FLOOR&&!floorBlocked(g.worldX,g.wid)){g.y=FLOOR-g.hei;g.vy=0;g.onGround=true;g.onPlatformIndex=-1;g.jumpsLeft=g.maxJumps||2;}
    for(var p=0;p<plats.length;p++){var pl=plats[p];if(g.dropTimer>0&&g.dropPlatformIndex===p)continue;if(g.vy>=0&&g.worldX+g.wid>pl.x&&g.worldX<pl.x+pl.w&&g.y+g.hei>pl.y&&g.y+g.hei<pl.y+Math.max(24,pl.h+8)){g.y=pl.y-g.hei;g.vy=0;g.onGround=true;g.onPlatformIndex=p;g.jumpsLeft=g.maxJumps||2;}}
  }
  g.cameraX=Math.max(g.cameraX,Math.min(g.worldX-210,levelLength()-W+70));
  if(left||right||jump||attack||g.dashTimer>0||g.onRope)g.grace=Math.min(g.grace||0,90);
  if(g.grace>0)g.grace--; if(g.levelTitle>0)g.levelTitle--;
  if(g.invuln>0)g.invuln--; if(g.shake>0)g.shake*=.84; if(g.damageFlash>0)g.damageFlash--;
  if(g.atkTimer>0)g.atkTimer--; if(g.atkAnim>0)g.atkAnim--;
  if(attack&&g.atkTimer<=0){
    g.attackEntered=(g.attackEntered||0)+1;
    var cls=classes[g.classIndex],wp=cls.weapons[g.weaponIndex],cool=Math.max(12,wp[4]-g.stats.dexterity*1.5-(g.buffs.focus?7:0));
    if(attackHeavy)cool=Math.ceil(cool*1.35);
    var style=wp[5]||g.weaponKind;g.atkTimer=cool;g.atkAnim=attackHeavy?24:18;g.attackStyle=style;g.attackHeavy=attackHeavy;g.atkSeq=(g.atkSeq||0)+1;sfx(style);
    if(aimPoint&&g.screen==='play'){var targetX=(g.cameraX||0)+aimPoint.x;if(Math.abs(targetX-g.worldX)>6)g.face=targetX>g.worldX?1:-1;}
    var dmg=wp[3]+g.weaponTier*4+g.stats.attack*3+Math.floor(g.stats.intelligence*(g.weaponKind==='magic'?3:0));
    if(attackHeavy)dmg=Math.ceil(dmg*1.55+5);
    if(g.buffs.fury)dmg+=9;
    if(Math.random()<.05+g.stats.luck*.018){dmg*=2;puff(g.worldX+g.wid/2,g.y+20,'#fff06a',10);}
    if(g.weaponKind==='melee'){
      var range=g.weaponRange,hh=style==='axe'?54:style==='staff'?34:style==='knives'?28:42,yy=g.y+(style==='axe'?-2:style==='staff'?18:12),xx=g.worldX+(g.face>0?g.wid-2:-range+2);
      if(attackHeavy){range=Math.ceil(range*1.35);hh=Math.ceil(hh*1.25);yy-=6;xx=g.worldX+(g.face>0?g.wid-2:-range+2);}
      pr.push({team:'p',kind:'slash',style:style,x:xx,y:yy,w:range,h:hh,life:attackHeavy?28:(style==='knives'?16:22),dmg:dmg,dir:g.face,heavy:attackHeavy,hitIds:{}});
      if(style==='knives')pr.push({team:'p',kind:'slash',style:'knives2',x:xx,y:g.y+30,w:range-8,h:attackHeavy?32:24,life:attackHeavy?24:16,dmg:Math.ceil(dmg*.7),dir:g.face,heavy:attackHeavy,hitIds:{}});
    }
    else{var spd=g.weaponKind==='arrow'?10.2:style==='chi'?6.9:7.6;if(attackHeavy)spd*=.88;var vx=g.face*spd,vy=0;if(aimPoint){var ax=(g.cameraX||0)+aimPoint.x-(g.worldX+g.wid/2),ay=aimPoint.y-(g.y+20),dist=Math.max(1,Math.sqrt(ax*ax+ay*ay));vx=ax/dist*spd;vy=ay/dist*spd;}var kw=g.weaponKind==='arrow'?34:style==='frost'?26:style==='chi'?30:24,kh=g.weaponKind==='arrow'?12:style==='chi'?24:18;if(attackHeavy){kw=Math.ceil(kw*1.45);kh=Math.ceil(kh*1.45);}pr.push({team:'p',kind:g.weaponKind,style:style,x:g.worldX+g.wid/2,y:g.y+20,w:kw,h:kh,vx:vx,vy:vy,life:g.weaponKind==='arrow'?82:96,dmg:dmg,dir:g.face,heavy:attackHeavy});}
  }
  g.last={jump:jump,attack:attack,up:up,down:down,confirm:confirm,left:left,right:right};

  var slow=g.buffs.clock?.48:1, enemySleep=(g.grace||0)>0;
  for(var i=0;i<en.length;i++){
    var e=en[i]; if(e.dead)continue; if(enemySleep){e.cd=Math.max(e.cd,36);continue;} e.timer+=slow; e.cd-=slow; var px=g.worldX-e.x;if(Math.abs(px)>2)e.dir=px>0?1:-1;
    if(e.move==='fly'){
      var targetY=e.type==='bat'?g.y+8:e.homeY,baseY=e.homeY||e.y,bob=Math.sin(e.timer*(e.type==='bat' ? .12 : .065))*(e.type==='bat'?28:15);
      if(e.type==='bat'&&Math.abs(px)<520)baseY+=(targetY-baseY)*.045*slow;
      e.homeY=Math.max(118,Math.min(FLOOR-e.h-52,baseY));
      e.x+=(px>0?1:-1)*(e.type==='bat'?1.85+g.level*.11:.72+g.level*.04)*slow;
      e.y+=(e.homeY+bob-e.y)*(e.type==='bat' ? .12 : .06)*slow;
      e.vy=0;
    }
    else if(e.type==='slime'){if(e.jump<=0&&Math.abs(px)<340){e.vy=-8-Math.random()*3;e.jump=72;moveGround(e,(px>0?1:-1)*(1.05+g.level*.05)*slow);}else if(e.jump>42){moveGround(e,e.dir*.45*slow);} e.jump-=slow;}
    else if(e.type==='rat'){moveGround(e,(px>0?1:-1)*(1.7+g.level*.08)*slow);}
    else if(e.type==='skel'||e.type==='knight'||e.type==='boss'){if(Math.abs(px)<420)moveGround(e,(px>0?1:-1)*(e.boss?1.05:1.15)*slow);}
    if((e.type==='cult'||e.type==='archer'||e.type==='wisp'||e.boss)&&e.cd<=0&&Math.abs(px)<620){e.cd=e.boss?42:84-Math.min(30,g.level*4);var sp=e.type==='archer'?6.8:4.8;pr.push({team:'e',kind:e.type==='archer'?'bolt':'fire',x:e.x+e.w/2,y:e.y+18,w:13,h:9,vx:(px>0?1:-1)*sp,vy:e.boss?rnd(-1.2,1.2):0,life:120,dmg:e.dmg,dir:px>0?1:-1});}
    if(e.move!=='fly'){e.vy=(e.vy||0)+GRAV; e.y+=e.vy; var gy=e.groundY||FLOOR;if(e.y+e.h>=gy){e.y=gy-e.h;e.vy=0;}}
  }
  for(var hi=0;hi<haz.length;hi++){
    var hz=haz[hi],plr={x:g.worldX+6,y:g.y+6,w:g.wid-12,h:g.hei-8};
    if(g.invuln>0)continue;
    if(hz.type==='firewheel'){
      var hitFire=false,ct=hz.count||3,rad=hz.radius||58,ball=hz.ball||10,spin=(g.frame||0)*(hz.speed||.03)+(hz.phase||0);
      for(var fb=0;fb<ct;fb++){var a=spin+fb*Math.PI*2/ct,bx=hz.cx+Math.cos(a)*rad,by=hz.cy+Math.sin(a)*rad;if(circleRect(bx,by,ball,plr)){hitFire=true;break;}}
      if(hitFire)damage(hz.dmg||13+g.level*3);
    }else if(rect(plr,hz))damage(12+g.level*3);
  }
  if(g.y>FLOOR+70||pitSpaceBlocked(g.worldX,g.wid,g.y+10,g.hei-12))recoverFromPit();
  function damage(d){if(g.invuln>0||(g.grace||0)>0)return;var red=Math.min(.65,(g.stats.defense+(g.buffs.armor?5:0))*.055);var hit=Math.max(1,Math.floor(d*(1-red)));g.hp-=hit;g.invuln=g.buffs.shield?90:56;g.damageFlash=18;g.shake=9;sfx('hit');puff(g.worldX+g.wid/2,g.y+20,'#ff5577',12);if(g.hp<=0){g.hp=0;g.screen='dead';g.message='The dungeon keeps your bones.';}}
  function gainXp(v){v=Math.floor(v*(1+g.stats.wisdom*.05+(g.buffs.tome?.55:0)));g.xp+=v;while(g.xp>=g.nextXp){g.xp-=g.nextXp;g.nextXp=Math.floor(g.nextXp*1.34+18);g.statPoints++;g.screen='levelup';sfx('level');}}
  function dropAt(x,y,e){
    var surf=surfaceForDrop(x,24,y,e),dy=surf.y-24;
    var chance=.35+g.stats.luck*.035;if(e.boss)chance=1;if(Math.random()<chance){var roll=Math.random(),kind='power';if(roll<.2)kind='weapon';else if(roll<.34)kind='upgrade';var pwr=powerDefs[Math.floor(Math.random()*powerDefs.length)];drops.push({x:surf.x,y:dy,w:24,h:24,kind:kind,power:pwr[0],color:pwr[2],label:kind==='weapon'?'weapon':kind==='upgrade'?'upgrade':pwr[0],life:900});}
    var xpSurf=surfaceForDrop(x+10,18,y-10,e);drops.push({x:xpSurf.x,y:xpSurf.y-18,w:18,h:18,kind:'xp',label:'xp',color:'#8ef7ff',xp:e.xp,life:900});
  }
  for(var pi=pr.length-1;pi>=0;pi--){
    var a=pr[pi];a.life--; if(a.kind!=='slash'){a.x+=a.vx||0;a.y+=a.vy||0;}
    if(a.life<=0){pr.splice(pi,1);continue;}
    if(a.team==='p'){
      for(var ei=0;ei<en.length;ei++){var ee=en[ei];if(ee.dead)continue;if(rect(a,ee)){if(a.kind==='slash'){a.hitIds=a.hitIds||{};if(a.hitIds[ei])continue;a.hitIds[ei]=true;}ee.hp-=a.dmg;sfx('impact');puff(ee.x+ee.w/2,ee.y+20,a.style==='frost'?'#b9f6ff':a.style==='ember'?'#ff9b45':a.style==='chi'?'#fff06a':'#ffe07a',a.heavy?12:7);if(g.buffs.vamp)g.hp=Math.min(g.maxHp,g.hp+2);if(a.kind!=='slash')a.life=0;if(ee.hp<=0){ee.dead=true;dropAt(ee.x,ee.y,ee);puff(ee.x+ee.w/2,ee.y+ee.h/2,ee.boss?'#f0d36b':'#ba8cff',20);if(ee.boss){g.screen='win';g.message='The Obsidian Choir goes quiet.';}}}}
    } else if(g.invuln<=0&&rect(a,{x:g.worldX+6,y:g.y+6,w:g.wid-12,h:g.hei-8})){damage(a.dmg);a.life=0;}
  }
  for(var ei2=0;ei2<en.length;ei2++){var eo=en[ei2];if(!eo.dead&&g.invuln<=0&&rect({x:g.worldX+6,y:g.y+6,w:g.wid-12,h:g.hei-8},eo))damage(eo.dmg);}
  for(var dd=drops.length-1;dd>=0;dd--){var d=drops[dd];d.life--;if(g.buffs.magnet){var dx=g.worldX-d.x,dy=g.y-d.y,dist=Math.max(1,Math.sqrt(dx*dx+dy*dy));if(dist<260){d.x+=dx/dist*5;d.y+=dy/dist*5;}}if(rect({x:g.worldX-4,y:g.y-4,w:g.wid+8,h:g.hei+8},d)){if(d.kind==='xp')gainXp(d.xp);else if(d.kind==='weapon'){g.weaponTier++;g.weaponName=(g.weaponTier%2?classes[g.classIndex].weapons[0][0]:classes[g.classIndex].weapons[1][0])+' +'+g.weaponTier;sfx('drop');}else if(d.kind==='upgrade'){g.weaponTier++;sfx('drop');}else{applyPower(d.power);sfx('drop');}drops.splice(dd,1);}else if(d.life<=0)drops.splice(dd,1);}
  function applyPower(p){if(p==='heart')g.hp=Math.min(g.maxHp,g.hp+35+g.stats.wisdom*4);else if(p==='bomb'){for(var i=0;i<en.length;i++)if(!en[i].dead&&Math.abs(en[i].x-g.worldX)<360){en[i].hp-=70;if(en[i].hp<=0){en[i].dead=true;dropAt(en[i].x,en[i].y,en[i]);}}g.shake=12;}else{var dur=360+g.stats.wisdom*24;g.buffs[p]=dur;}}
  if(g.buffs.regen&&g.frame%45===0)g.hp=Math.min(g.maxHp,g.hp+3+g.stats.wisdom);
  for(var pa=0;pa<parts.length;pa++){var pp=parts[pa];pp.x+=pp.vx;pp.y+=pp.vy;pp.vy+=.15;pp.life--;}for(var pp2=parts.length-1;pp2>=0;pp2--)if(parts[pp2].life<=0)parts.splice(pp2,1);
  if(g.exitOpen&&g.worldX+g.wid>g.exitX+18&&g.level<g.maxLevel)beginTransition();

  try{var rootDbg=(typeof window!=='undefined')?window:globalThis,dbgProf=levelProfile();rootDbg.__drpDebug={screen:g.screen,frame:g.frame,worldX:Math.round(g.worldX||0),level:g.level||1,profile:dbgProf.label||'',length:levelLength(),keys:k,left:left,right:right,jump:jump,down:down,dropTimer:g.dropTimer||0,onPlatformIndex:g.onPlatformIndex,onRope:!!g.onRope,ropeIndex:g.ropeIndex||0,ropeGrabCd:g.ropeGrabCd||0,dashTimer:g.dashTimer||0,dashCd:g.dashCd||0,dashDir:g.dashDir||0,lastTapLeft:g.lastTapLeft||0,lastTapRight:g.lastTapRight||0,lightAttack:lightAttack,heavyAttack:heavyAttack,lightPressed:lightPressed,heavyPressed:heavyPressed,attack:attack,attackEdge:attackEdge,attackHeavy:attackHeavy,lastAttack:!!(g.last&&g.last.attack),attackEntered:g.attackEntered||0,atkSeq:g.atkSeq||0,atkAnim:g.atkAnim||0,atkTimer:g.atkTimer||0,projectiles:pr.length,pits:pits.map(function(p){return {x:Math.round(p.x),w:Math.round(p.w),tag:p.tag||''};}),hazards:haz.map(function(h){return h.type==='firewheel'?{type:h.type,cx:Math.round(h.cx),cy:Math.round(h.cy),radius:Math.round(h.radius),count:h.count}:{type:h.type,x:Math.round(h.x),w:Math.round(h.w)};}),ropes:ropes.map(function(r){return {x:Math.round(r.x),y:Math.round(r.y),h:Math.round(r.h),tag:r.tag||''};}),drops:drops.map(function(d){return {kind:d.kind,x:Math.round(d.x),y:Math.round(d.y)};}),platforms:plats.map(function(p){return {x:Math.round(p.x),y:Math.round(p.y),w:Math.round(p.w),large:!!p.large,tag:p.tag||''};}),enemies:en.map(function(e){return {type:e.type,move:e.move||'ground',x:Math.round(e.x),y:Math.round(e.y),groundY:Math.round(e.groundY||FLOOR),platform:!!(e.platformW&&e.groundY<FLOOR),hp:Math.round(e.hp),dead:!!e.dead};}),musicStep:g.musicStep||0,musicNotes:g.musicNotes||0,audioReady:!!g.audioReady,audioBlocked:!!g.audioBlocked,exitOpen:!!g.exitOpen,transitionTimer:g.transitionTimer||0,levelHeal:g.levelHeal||0};}catch(e){}
  state.drp=g;state.drpEnemies=en;state.drpProjectiles=pr;state.drpDrops=drops;state.drpParticles=parts;state.drpPlatforms=plats;state.drpHazards=haz;state.drpPits=pits;state.drpRopes=ropes;return state;
})();
`;

const renderCode = String.raw`
(function(){
  var c=drawingContext,cw=dimensionContext.width,ch=dimensionContext.height,W=960,H=540,FLOOR=468;
  var g=state.drp||{screen:'class',frame:0,classIndex:0,menuIndex:0,level:1,stats:{},hp:100,maxHp:100};
  var en=state.drpEnemies||[],pr=state.drpProjectiles||[],drops=state.drpDrops||[],parts=state.drpParticles||[],plats=state.drpPlatforms||[],haz=state.drpHazards||[],pits=state.drpPits||[],ropes=state.drpRopes||[];
  var scale=Math.min(cw/W,ch/H),ox=(cw-W*scale)/2,oy=(ch-H*scale)/2,t=(g.frame||0)/60;
  var classes=[
    {name:'Warrior',color:'#e85d75',desc:'frontline bruiser: defense, heavy melee, forgiving HP',weapons:['Iron Cleaver','Bulwark Axe']},
    {name:'Mage',color:'#8f7bff',desc:'fragile caster: intelligence scales bolts and elemental control',weapons:['Ember Wand','Frost Sigil']},
    {name:'Archer',color:'#6ce89a',desc:'mobile striker: dexterity, crits, long lines of fire',weapons:['Yew Bow','Twin Knives']},
    {name:'Monk',color:'#f0d36b',desc:'balanced mystic: wisdom extends buffs, sustain, chi shots',weapons:['Prayer Staff','Chi Palm']}
  ];
  var stats=['attack','defense','dexterity','intelligence','wisdom','luck','hp'];
  var statText={attack:'more weapon damage',defense:'reduces incoming damage',dexterity:'move, jump, attack speed',intelligence:'boosts magic/projectiles',wisdom:'more XP, healing, buff time',luck:'crits and better drops',hp:'raises max health'};
  var levelNames=['Crypt of Rust','Fungal Aqueduct','Ashen Library','Clockwork Catacomb','Obsidian Choir'];
  function rr(x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}
  function txt(s,x,y,size,col,align){c.fillStyle=col||'#fff';c.font=size+'px monospace';c.textAlign=align||'left';c.textBaseline='alphabetic';c.fillText(s,x,y);}
  function panel(x,y,w,h){c.fillStyle='rgba(5,8,18,.88)';rr(x,y,w,h,10);c.fill();c.strokeStyle='rgba(139,255,224,.75)';c.lineWidth=2;rr(x,y,w,h,10);c.stroke();}
  function px(x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  c.save();c.imageSmoothingEnabled=false;c.fillStyle='#02040b';c.fillRect(0,0,cw,ch);c.translate(ox,oy);c.scale(scale,scale);
  function background(){
    var themes=[['#100d18','#181326','#352338'],['#071915','#102a22','#1e4032'],['#18101d','#2c1830','#51332c'],['#0d1219','#202735','#35475c'],['#08060d','#1b0d25','#411333']];
    var th=themes[(g.level||1)-1]||themes[0],bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,th[0]);bg.addColorStop(.5,th[1]);bg.addColorStop(1,th[2]);c.fillStyle=bg;c.fillRect(0,0,W,H);
    var cam=g.cameraX||0;
    c.save();c.translate(-(cam*.22%192),0);
    for(var i=-1;i<7;i++){
      var bx=i*192;c.fillStyle='rgba(0,0,0,.26)';c.fillRect(bx,118,192,350);
      c.strokeStyle='rgba(175,213,198,.13)';c.lineWidth=2;for(var by=136;by<452;by+=42){c.beginPath();c.moveTo(bx,by);c.lineTo(bx+192,by);c.stroke();}
      for(var ax=28;ax<180;ax+=56){px(bx+ax-18,222,36,112,'rgba(0,0,0,.34)');px(bx+ax-12,210,24,12,'rgba(0,0,0,.34)');px(bx+ax-6,198,12,12,'rgba(0,0,0,.34)');px(bx+ax-18,334,36,4,'rgba(132,255,223,.08)');}
      c.fillStyle='rgba(255,218,122,.10)';c.fillRect(bx+20,398,9,28);c.fillRect(bx+164,372,9,30);
    }
    c.restore();
    c.save();c.translate(-cam,0);c.fillStyle='#130d14';c.fillRect(cam,FLOOR,W+40,H-FLOOR);
    for(var pit=0;pit<pits.length;pit++){var pt=pits[pit];px(pt.x,FLOOR,pt.w,H-FLOOR,'#030208');px(pt.x-6,FLOOR-8,8,12,'#2c1d27');px(pt.x+pt.w-2,FLOOR-8,8,12,'#2c1d27');for(var py=FLOOR+18;py<H;py+=28)px(pt.x+8,py,pt.w-16,2,'rgba(142,247,255,.08)');}
    c.strokeStyle='rgba(205,192,177,.18)';for(var x=Math.floor(cam/48)*48;x<cam+W+60;x+=48){var skip=false;for(var pp=0;pp<pits.length;pp++){if(x+48>pits[pp].x&&x<pits[pp].x+pits[pp].w){skip=true;break;}}if(skip)continue;c.beginPath();c.moveTo(x,FLOOR+16);c.lineTo(x+28,FLOOR+16);c.stroke();c.beginPath();c.moveTo(x,FLOOR+42);c.lineTo(x+48,FLOOR+42);c.stroke();}
    for(var r=0;r<ropes.length;r++){var rp=ropes[r],bottom=rp.bottomY||(rp.y+rp.h);px(rp.x-12,rp.y-8,24,7,'#3d2b2f');px(rp.x-4,rp.y-13,8,10,'#826044');for(var ry=rp.y;ry<bottom;ry+=12){px(rp.x-5,ry,4,10,'#b8874f');px(rp.x+1,ry+4,4,10,'#d2a06b');px(rp.x-1,ry,2,12,'#5c3d2c');}px(rp.x-7,bottom-2,14,4,'#7a5438');}
    for(var p=0;p<plats.length;p++){var pl=plats[p],face=pl.large?'rgba(62,52,67,.98)':'rgba(52,42,59,.95)';px(pl.x,pl.y,pl.w,pl.h,face);px(pl.x,pl.y,pl.w,5,'rgba(139,255,224,.34)');for(var bs=0;bs<pl.w;bs+=28){px(pl.x+bs,pl.y+9,18,2,'rgba(205,192,177,.15)');if(pl.large)px(pl.x+bs+3,pl.y+17,12,4,'rgba(8,6,14,.26)');}}
    for(var h=0;h<haz.length;h++){var hz=haz[h];if(hz.type==='firewheel'){var ct=hz.count||3,rad=hz.radius||58,ball=hz.ball||10,spin=(g.frame||0)*(hz.speed||.03)+(hz.phase||0);px(hz.cx-7,hz.cy-7,14,14,'#1d1010');px(hz.cx-4,hz.cy-4,8,8,'#6b2819');for(var fb=0;fb<ct;fb++){var a=spin+fb*Math.PI*2/ct,ca=Math.cos(a),sa=Math.sin(a);for(var seg=1;seg<=3;seg++){var rr=rad*seg/4;px(hz.cx+ca*rr-3,hz.cy+sa*rr-3,6,6,seg%2?'#5b3526':'#b85c28');}var bx=hz.cx+ca*rad,by=hz.cy+sa*rad;px(bx-ball,by-ball,ball*2,ball*2,'#b82020');px(bx-ball+3,by-ball+2,ball*2-5,ball*2-5,'#ff6b1d');px(bx-4,by-ball-2,8,8,'#ffe15a');px(bx-2,by-3,5,6,'#fff4b0');}}else{px(hz.x,hz.y+10,hz.w,12,'#5b1022');px(hz.x,hz.y+21,hz.w,4,'#210714');for(var sx=0;sx<hz.w;sx+=14){px(hz.x+sx+2,hz.y+2,10,8,'#e9d5a3');px(hz.x+sx+4,hz.y-6,6,8,'#f8ebc0');px(hz.x+sx+6,hz.y-12,2,6,'#fff6d8');}}}
    c.restore();
  }
  function drawEnemy(e){
    if(e.dead)return;var x=e.x-(g.cameraX||0),y=e.y,dir=e.dir||-1,step=Math.floor((e.timer||0)/10)%2;c.save();c.translate(x,y);if(dir<0){c.translate(e.w,0);c.scale(-1,1);}var col={rat:'#8b6b5c',slime:'#55cc77',bat:'#6f68b8',skel:'#d9d2bd',cult:'#a65dff',archer:'#67d48a',knight:'#b7beca',wisp:'#79ddff',boss:'#ff4f9c'}[e.type]||'#fff';
    if(e.move==='fly'){c.restore();c.save();c.translate(x,0);c.globalAlpha=.2;px(3,(e.groundY||FLOOR)-5,e.w-6,4,'#05040a');c.globalAlpha=1;c.restore();c.save();c.translate(x,y);if(dir<0){c.translate(e.w,0);c.scale(-1,1);}}
    if(e.type==='boss'){px(8,12,80,92,'#37112b');px(18,2,16,22,'#ff4f9c');px(40,0,16,26,'#ff4f9c');px(62,2,16,22,'#ff4f9c');px(22,44,16,16,'#090711');px(58,44,16,16,'#090711');px(22,88,52,10,'#f6d06c');px(46,-20,6,38,'#f0d36b');}
    else if(e.type==='rat'){px(4,10,26,12,'#6f4f45');px(12,4,18,10,'#8b6b5c');px(28,8,8,8,'#8b6b5c');px(31,7,3,3,'#f0d36b');px(0,18,10,4,'#c49a7a');px(8,22+step*2,6,4,'#3b2722');px(24,22-step*2,6,4,'#3b2722');}
    else if(e.type==='bat'){var flap=Math.floor((e.timer||0)/6)%2,wy=flap?6:14;px(12,10,12,14,'#30295d');px(0,wy,14,8,'#4b4284');px(24,wy,14,8,'#4b4284');px(4,wy-6,9,6,'#30295d');px(25,wy-6,9,6,'#30295d');px(15,14,3,3,'#b7a8ff');px(21,14,3,3,'#b7a8ff');}
    else if(e.type==='slime'){px(4,12,30,14,'#55cc77');px(8,6,22,8,'#77e095');px(12,8,8,4,'#d2ffcd');px(25,15,4,4,'#102216');}
    else if(e.type==='wisp'){px(7,4,18,26,'rgba(121,221,255,.42)');px(11,0,10,34,'#79ddff');px(13,13,3,3,'#fff');px(20,13,3,3,'#fff');}
    else if(e.type==='skel'){px(11,2,14,14,'#d9d2bd');px(15,16,8,20,'#d9d2bd');px(5,25,8,5,'#d9d2bd');px(24,25,8,5,'#d9d2bd');px(9,38+step*2,7,8,'#d9d2bd');px(22,38-step*2,7,8,'#d9d2bd');px(14,7,3,3,'#101018');px(22,7,3,3,'#101018');}
    else if(e.type==='cult'){px(5,10,24,36,'#2a1238');px(9,0,16,16,'#a65dff');px(13,20,4,4,'#ffd87a');px(21,20,4,4,'#ffd87a');px(2,38,30,7,'#13091c');}
    else if(e.type==='archer'){px(6,10,22,34,'#1d422b');px(9,3,16,9,'#67d48a');px(26,16,4,25,'#c69c5c');px(28,16,10,3,'#e8f8ff');px(10,40+step*2,6,6,'#0e2116');px(22,40-step*2,6,6,'#0e2116');}
    else if(e.type==='knight'){px(5,4,32,48,'#7f8793');px(10,14,22,7,'#252b34');px(8,29,26,5,'#d4dce7');px(34,24,12,24,'#9aa7b8');px(12,48+step*2,8,6,'#333a44');px(26,48-step*2,8,6,'#333a44');}
    else{px(0,0,e.w,e.h,col);px(7,12,e.w-14,9,'rgba(0,0,0,.45)');}
    c.fillStyle='rgba(0,0,0,.65)';c.fillRect(0,-9,e.w,5);c.fillStyle='#ff607e';c.fillRect(0,-9,e.w*Math.max(0,e.hp/e.max),5);c.restore();
  }
  function drawPlayer(){
    var x=g.worldX-(g.cameraX||0),y=g.y,cls=classes[g.classIndex]||classes[0],name=cls.name,kind=g.weaponKind||'melee',style=g.attackStyle||kind,air=!g.onGround&&!g.onRope;c.save();if((g.dashTimer||0)>0){c.globalAlpha=.22;px(x-(g.dashDir||g.face||1)*22,y+6,34,46,'#8ef7ff');c.globalAlpha=.14;px(x-(g.dashDir||g.face||1)*42,y+10,34,38,'#8ef7ff');c.globalAlpha=1;}c.translate(x,y);if(g.invuln>0&&Math.floor(g.frame/5)%2===0)c.globalAlpha=.45;
    var f=g.face||1,atk=Math.max(0,g.atkAnim||0),swing=atk>0?Math.sin((1-atk/18)*Math.PI):0,leg=g.onRope?0:(air?(g.vy<0?-6:6):((Math.floor((g.frame||0)/8)%2)?5:-5));
    if(f<0){c.translate(34,0);c.scale(-1,1);}
    px(6,18,22,34,name==='Warrior'?'#5f1f2f':name==='Mage'?'#4c3a92':name==='Archer'?'#183823':'#5d4c22');px(9,22,16,28,cls.color);
    if(name==='Mage'){px(6,4,22,8,'#d8c7ff');px(10,-6,14,10,'#d8c7ff');}
    else if(name==='Archer'){px(5,10,24,8,'#244d31');px(8,5,18,6,'#244d31');}
    else if(name==='Warrior'){px(6,16,22,6,'#b9c0c9');}
    else{px(7,17,20,4,'#f8e6a0');px(5,34,4,12,'#f8e6a0');px(25,34,4,12,'#f8e6a0');}
    px(8,0,18,16,'#f2c994');px(11,7,4,3,'#101018');px(22,7,4,3,'#101018');
    px(8,52,7,12+leg*.25,'#1b1028');px(22,52,7,12-leg*.25,'#1b1028');if(g.onRope){px(2,24,7,19,'#f2c994');px(25,24,7,19,'#f2c994');px(15,14,4,45,'rgba(184,135,79,.72)');}else{px(4,30,7,16,'#f2c994');px(25,30,7,16,'#f2c994');}
    c.save();c.translate(28,24-Math.floor(swing*8));
    if(kind==='arrow'){px(-6,-14,4,34,'#8b5a2b');px(-9,-10,3,24,'#d9c99b');px(0,0,32+12*swing,3,'#e8f8ff');px(28+12*swing,-3,8,9,'#e8f8ff');}
    else if(kind==='magic'){var mc=style==='chi'?'#fff06a':style==='frost'?'#d6fbff':'#ff7a33';px(-8,10,5,26,style==='chi'?'#f0d36b':style==='frost'?'#b9f6ff':'#ff9b45');px(8+12*swing,-16,12,12,mc);px(12+12*swing,-20,4,4,'#fff');}
    else if(style==='knives'){px(0,2,26+8*swing,4,'#d9d7c9');px(2,13,24+8*swing,4,'#d9d7c9');}
    else if(style==='staff'){px(-6,18,40+12*swing,5,'#b8874f');px(32+12*swing,14,10,10,'#f0d36b');}
    else{px(-2,10,32+12*swing,5,'#9aa7b8');px(26+12*swing,2,14,18,style==='axe'?'#cfd7e4':'#d7dde8');}
    c.restore();c.restore();
  }
  function drawExit(){
    if(!g.exitOpen||!g.exitX)return;var x=g.exitX,y=g.exitY||372,w=g.exitW||68,h=g.exitH||96,glow=Math.floor((Math.sin((g.frame||0)/18)+1)*12);c.save();c.translate(x,y);
    px(-8,h-8,w+16,8,'#2f2239');px(0,12,w,h-12,'#25162e');px(8,22,w-16,h-22,'#090711');px(0,0,w,16,'#6b4f8f');px(8,-8,w-16,12,'#8e6bc4');
    px(14,30,8,8,'#1fe0c4');px(w-22,30,8,8,'#1fe0c4');px(w-16,54,5,5,'#f0d36b');px(20,68+glow*.05,w-40,4,'#8ef7ff');
    c.globalAlpha=.16;px(4,18,w-8,h-22,'#8ef7ff');c.globalAlpha=1;txt('EXIT',w/2,h+18,12,'#8ef7ff','center');c.restore();
  }
  function drawWorld(){
    c.save();if(g.shake>0)c.translate((Math.random()-.5)*g.shake,(Math.random()-.5)*g.shake);background();
    c.save();c.translate(-(g.cameraX||0),0);
    drawExit();
    for(var i=0;i<drops.length;i++){var d=drops[i];c.save();c.translate(d.x,d.y);c.fillStyle=d.color||'#fff';c.beginPath();c.arc(12,12,13,0,Math.PI*2);c.fill();c.fillStyle='#07101d';c.font='9px monospace';c.textAlign='center';c.fillText(d.kind==='xp'?'XP':d.kind==='weapon'?'W':d.kind==='upgrade'?'+':'*',12,15);c.restore();}
    for(var q=0;q<pr.length;q++){var a=pr[q];c.save();c.translate(a.x,a.y);if(a.kind==='slash'){var life=Math.max(0,Math.min(1,a.life/22)),col=a.style==='axe'?'#d7dde8':a.style==='staff'?'#f0d36b':a.style==='knives'||a.style==='knives2'?'#d9d7c9':'#fff4c8';c.globalAlpha=.35+.45*life;var yy=a.dir>0?0:0;if(a.dir>0){px(0,a.h-12,a.w*.45,10,col);px(a.w*.3,a.h*.45,a.w*.45,10,col);px(a.w*.62,8,a.w*.34,10,col);}else{px(a.w*.55,a.h-12,a.w*.45,10,col);px(a.w*.25,a.h*.45,a.w*.45,10,col);px(4,8,a.w*.34,10,col);}c.globalAlpha=.16;px(0,0,a.w,a.h,col);c.globalAlpha=1;}else if(a.kind==='arrow'){var ang=Math.atan2(a.vy||0,a.vx||1);c.rotate(ang);px(-10,-2,28,4,'#e8f8ff');px(14,-6,10,12,'#e8f8ff');px(-13,-5,5,10,'#8b5a2b');}else if(a.style==='ember'){px(2,2,a.w-4,a.h-4,'#ff7a33');px(7,5,8,8,'#ffe060');px(0,7,4,4,'#ffb24b');}else if(a.style==='frost'){px(0,a.h/2-2,a.w,4,'#b9f6ff');px(a.w/2-2,0,4,a.h,'#d6fbff');px(4,4,a.w-8,a.h-8,'rgba(185,246,255,.35)');}else if(a.style==='chi'){px(3,3,a.w-6,a.h-6,'#fff06a');px(7,7,a.w-14,a.h-14,'#ffffff');}else{px(0,0,a.w,a.h,a.team==='p'?'#fff06a':'#ff5577');}c.restore();}
    for(var r=0;r<parts.length;r++){var p=parts[r];c.globalAlpha=Math.max(0,p.life/40);c.fillStyle=p.c;c.fillRect(p.x,p.y,3,3);c.globalAlpha=1;}
    c.restore();for(var e=0;e<en.length;e++)drawEnemy(en[e]);drawPlayer();c.restore();
  }
  function hud(){panel(14,12,252,62);var hpw=128;c.fillStyle='rgba(0,0,0,.55)';c.fillRect(32,26,hpw,10);c.fillStyle='#ff5577';c.fillRect(32,26,hpw*Math.max(0,g.hp/g.maxHp),10);txt('HP '+Math.ceil(g.hp)+'/'+g.maxHp,172,36,10,'#ffdce3');var xpPct=g.xp/g.nextXp;c.fillStyle='rgba(0,0,0,.55)';c.fillRect(32,48,hpw,8);c.fillStyle='#8ef7ff';c.fillRect(32,48,hpw*Math.min(1,xpPct),8);txt('XP '+g.xp+'/'+g.nextXp,172,57,10,'#c8fbff');panel(W-292,12,278,70);txt((g.weaponName||'relic')+'  +'+(g.weaponTier||1),W-276,34,12,'#fff');var dashPct=1-Math.min(1,(g.dashCd||0)/46);c.fillStyle='rgba(0,0,0,.55)';c.fillRect(W-276,48,88,6);c.fillStyle=(g.dashCd||0)>0?'#6b7898':'#8ef7ff';c.fillRect(W-276,48,88*dashPct,6);txt((g.onRope?'rope':'dash'),W-180,55,9,g.onRope?'#f0d36b':'#c8fbff');var aud=g.audioReady?'music on':g.audioBlocked?'audio blocked':'press for music';txt(aud,W-28,70,9,g.audioReady?'#8ef7ff':g.audioBlocked?'#ffb0b0':'#ffd87a','right');if(g.grace>0)txt('SAFE '+Math.ceil(g.grace/60),W/2,92,14,'#8ef7ff','center');if(g.levelTitle>0){var a=Math.min(1,g.levelTitle/40);c.globalAlpha=a;panel(270,94,420,86);txt('FLOOR '+(g.level||1),W/2,126,14,'#8ef7ff','center');txt(g.levelTitleText||levelNames[(g.level||1)-1]||'Deep Floor',W/2,158,24,'#f0d36b','center');c.globalAlpha=1;}if(g.damageFlash>0){c.globalAlpha=Math.min(.42,g.damageFlash/30);c.strokeStyle='#ff5577';c.lineWidth=12;c.strokeRect(6,6,W-12,H-12);c.globalAlpha=1;}}
  function transition(){drawWorld();c.fillStyle='rgba(0,0,0,.78)';c.fillRect(0,0,W,H);c.fillStyle='rgba(25,44,56,.82)';c.fillRect(0,0,W,86);c.fillRect(0,H-70,W,70);panel(210,118,540,260);txt('DESCENT',W/2,164,15,'#8ef7ff','center');txt('FLOOR '+(g.transitionTo||g.level||1),W/2,214,34,'#f6f2ff','center');txt(g.transitionText||levelNames[(g.level||1)-1]||'Deep Floor',W/2,258,24,'#f0d36b','center');txt('Recovered +'+Math.ceil(g.levelHeal||0)+' HP',W/2,308,17,'#7dff9e','center');txt('Safe entry window active',W/2,342,13,'#8ef7ff','center');}
  function wrap(s,x,y,maxW,lineH,size,col,align){c.fillStyle=col||'#fff';c.font=size+'px monospace';c.textAlign=align||'left';c.textBaseline='alphabetic';var words=String(s).split(' '),line='';for(var i=0;i<words.length;i++){var test=line?line+' '+words[i]:words[i];if(c.measureText(test).width>maxW&&line){c.fillText(line,x,y);line=words[i];y+=lineH;}else line=test;}if(line)c.fillText(line,x,y);return y;}
  function menu(){
    var cls=classes[g.classIndex]||classes[0];background();panel(80,68,800,398);txt('DUNGEON RELIC ROGUE',W/2,116,30,'#f6f2ff','center');wrap('A roguelike platformer under a dead mountain. Choose a class, take a relic weapon, clear five floors, silence the Obsidian Choir.',W/2,146,730,18,13,'#c8d6e8','center');
    if(g.screen==='class'){for(var i=0;i<classes.length;i++){var y=206+i*48,sel=i===g.menuIndex;c.fillStyle=sel?'rgba(142,247,255,.22)':'rgba(255,255,255,.05)';rr(150,y-26,660,36,7);c.fill();txt((sel?'> ':'  ')+classes[i].name,182,y,18,classes[i].color);txt(classes[i].desc,350,y,12,'#cbd7e6');}txt('ARROWS + ENTER/CLICK    SPACE jump, S light, D heavy, double-tap dash, UP climbs ropes',W/2,438,12,'#ffd87a','center');}
    if(g.screen==='weapon'){txt(cls.name+' starting weapon',W/2,194,20,cls.color,'center');for(var j=0;j<2;j++){var yy=250+j*58,ss=j===g.menuIndex;c.fillStyle=ss?'rgba(142,247,255,.22)':'rgba(255,255,255,.05)';rr(250,yy-31,460,42,8);c.fill();txt((ss?'> ':'  ')+cls.weapons[j],W/2,yy,18,'#fff','center');}txt('ESC back   ENTER/CLICK start',W/2,410,13,'#ffd87a','center');}
  }
  function levelUp(){drawWorld();c.fillStyle='rgba(0,0,0,.72)';c.fillRect(0,0,W,H);panel(190,74,580,398);txt('LEVEL UP: choose a stat',W/2,122,24,'#fff','center');for(var i=0;i<stats.length;i++){var st=stats[i],y=170+i*38,sel=i===g.menuIndex;c.fillStyle=sel?'rgba(240,211,107,.23)':'rgba(255,255,255,.05)';rr(236,y-24,488,30,6);c.fill();txt((sel?'> ':'  ')+st.toUpperCase()+'  '+(g.stats[st]||0),258,y,16,'#f0d36b');txt(statText[st],456,y,12,'#cdd8e5');}txt('points: '+g.statPoints,W/2,455,14,'#8ef7ff','center');}
  if(g.screen==='class'||g.screen==='weapon')menu();else if(g.screen==='levelup')levelUp();else if(g.screen==='transition')transition();else{drawWorld();hud();if(g.screen==='dead'||g.screen==='win'){c.fillStyle='rgba(0,0,0,.72)';c.fillRect(0,0,W,H);panel(210,150,540,210);txt(g.screen==='win'?'VICTORY':'YOU DIED',W/2,205,28,g.screen==='win'?'#f0d36b':'#ff5577','center');txt(g.message||'',W/2,248,15,'#e9efff','center');txt('ENTER / CLICK to return to class select',W/2,303,14,'#8ef7ff','center');}}
  c.restore();
})();
`;

writeJson("init.json", {
  id: "glade-dungeon-rogue-init",
  name: "Dungeon Relic Rogue Init",
  description: "Initialize class selection, ropes, dash, and roguelike platformer state",
  phase: "getDefaultState",
  code: initCode.trim()
});

writeJson("update.json", {
  id: "glade-dungeon-rogue-update",
  name: "Dungeon Relic Rogue Update",
  description: "Class combat, profile-driven longer vertical floors, climbable ropes, dash, pits, XP/stat leveling, boss, and NES synth audio",
  phase: "update",
  code: updateCode.trim()
});

writeJson("render.json", {
  id: "glade-dungeon-rogue-render",
  name: "Dungeon Relic Rogue Render",
  description: "Render scaled dungeon roguelike platformer with ropes, dash feedback, pits, semi-solid blocks, stable HUD, and menus",
  phase: "render",
  code: renderCode.trim()
});

writeJson("cart.json", {
  id: "glade-dungeon-relic-rogue-v17",
  name: "Dungeon Relic Rogue V17",
  description: "A level-generation pass for the NES-flavored roguelike platformer: longer profile-driven floors with distinct vertical character, stacked/high platform encounters, raised block structures, ropes, pits, hazards, classes, relic weapons, XP/stat leveling, recovery transitions, and the Obsidian Choir boss.",
  frameRate: 60,
  modules: [
    { moduleId: "glade-dungeon-rogue-init", version: 8 },
    { moduleId: "glade-dungeon-rogue-update", version: 17 },
    { moduleId: "glade-dungeon-rogue-render", version: 13 }
  ]
});
