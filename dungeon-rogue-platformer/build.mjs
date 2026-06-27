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
      atkTimer:0,atkSeq:0,invuln:0,onGround:false,jumpsLeft:0,maxJumps:2,shake:0,message:'Choose a class',
      className:'',weaponName:'',weaponTier:1,weaponKind:'',weaponRange:52,
      attackStyle:'cleaver',levelTitle:0,levelTitleText:'',
      stats:{attack:1,defense:1,dexterity:1,intelligence:1,wisdom:1,luck:1,hp:1},
      buffs:{},last:{},audioReady:false,audioBlocked:false,audioArmed:false,musicTick:0,musicStep:0,musicBar:0
    },
    drpEnemies:[],drpProjectiles:[],drpDrops:[],drpParticles:[],drpPlatforms:[],drpHazards:[]
  });
})();
`;

const updateCode = String.raw`
(function(){
  var W=960,H=540,FLOOR=468,GRAV=0.72;
  if(!state.drp){state.drp={w:W,h:H,screen:'class',frame:0,menuIndex:0,classIndex:0,weaponIndex:0,level:1,maxLevel:5,worldX:80,cameraX:0,y:330,vy:0,wid:34,hei:52,face:1,hp:100,maxHp:100,xp:0,nextXp:35,statPoints:0,stats:{attack:1,defense:1,dexterity:1,intelligence:1,wisdom:1,luck:1,hp:1},buffs:{},last:{}};}
  if(!state.drpEnemies) state.drpEnemies=[];
  if(!state.drpProjectiles) state.drpProjectiles=[];
  if(!state.drpDrops) state.drpDrops=[];
  if(!state.drpParticles) state.drpParticles=[];
  if(!state.drpPlatforms) state.drpPlatforms=[];
  if(!state.drpHazards) state.drpHazards=[];
  var g=state.drp,en=state.drpEnemies,pr=state.drpProjectiles,drops=state.drpDrops,parts=state.drpParticles,plats=state.drpPlatforms,haz=state.drpHazards;

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
  function markKey(o,v){var raw=keyName(v);if(!raw)return;o[raw]=true;var key=raw.replace(/[^a-z0-9]/g,'');if(raw===' '||key==='space'||key==='spacebar')o.space=true;if(key==='arrowleft'||key==='left'||key==='keya'||key==='a')o.left=o.a=true;if(key==='arrowright'||key==='right'||key==='keyd'||key==='d')o.right=o.d=true;if(key==='arrowup'||key==='up'||key==='keyw'||key==='w')o.up=o.w=true;if(key==='arrowdown'||key==='down'||key==='keys'||key==='s')o.down=o.s=true;if(key==='keyj'||key==='j')o.j=true;if(key==='keyx'||key==='x')o.x=true;if(key==='keyz'||key==='z')o.z=true;if(key==='enter'||key==='return')o.enter=true;if(key==='escape'||key==='esc')o.escape=true;}
  function addKeys(o,src){
    if(!src)return;
    if(Array.isArray(src)){for(var i=0;i<src.length;i++)markKey(o,keyName(src[i]));return;}
    if(typeof Set!=='undefined'&&src instanceof Set){src.forEach(function(v){markKey(o,keyName(v));});return;}
    if(typeof Map!=='undefined'&&src instanceof Map){src.forEach(function(v,k){if(v)markKey(o,keyName(k));});return;}
    if(typeof src==='object'){for(var k in src){if(src[k])markKey(o,keyName(k));}}
  }
  function installKeyFallback(){
    try{var root=(typeof window!=='undefined')?window:globalThis;if(!root||root.__drpKeyFallback)return;root.__drpKeyFallback={};
      var down=function(e){root.__drpKeyFallback[keyName(e.key)]=true;root.__drpKeyFallback[keyName(e.code)]=true;};
      var up=function(e){root.__drpKeyFallback[keyName(e.key)]=false;root.__drpKeyFallback[keyName(e.code)]=false;};
      if(root.addEventListener){root.addEventListener('keydown',down);root.addEventListener('keyup',up);root.addEventListener('blur',function(){root.__drpKeyFallback={};});}
    }catch(e){}
  }
  function kset(){var o={};installKeyFallback();try{var root=(typeof window!=='undefined')?window:globalThis;if(root&&root.__drpKeyFallback)addKeys(o,root.__drpKeyFallback);}catch(e){}
    try{var km=keyboardManager;if(!km)return o;var lists=[];if(km.getPressedKeys)lists.push(km.getPressedKeys());if(km.getKeysDown)lists.push(km.getKeysDown());if(km.getHeldKeys)lists.push(km.getHeldKeys());if(km.pressedKeys)lists.push(km.pressedKeys);if(km.keysDown)lists.push(km.keysDown);if(km.heldKeys)lists.push(km.heldKeys);if(km.downKeys)lists.push(km.downKeys);if(km.keys)lists.push(km.keys);if(km.keyStates)lists.push(km.keyStates);for(var l=0;l<lists.length;l++)addKeys(o,lists[l]);var names=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Up','Down','Left','Right','KeyW','KeyA','KeyS','KeyD','KeyJ','KeyX','KeyZ','w','a','s','d','j','x','z','Enter','Return','Space',' '];for(var n=0;n<names.length;n++){var raw=names[n],down=false;if(km.isKeyDown)down=down||!!km.isKeyDown(raw);if(km.isDown)down=down||!!km.isDown(raw);if(km.isPressed)down=down||!!km.isPressed(raw);if(km.isKeyPressed)down=down||!!km.isKeyPressed(raw);if(km.getKey)down=down||!!km.getKey(raw);if(down)markKey(o,keyName(raw));}}catch(e){}return o;}
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
  var left=!!(k.arrowleft||k.left||k.a||hitPt(held,0,H-140,150,140));
  var right=!!(k.arrowright||k.right||k.d||hitPt(held,150,H-140,170,140));
  var jump=!!(k.space||k.spacebar||k.arrowup||k.up||k.w||hitPt(held,W-320,H-140,150,140));
  var aimClick=click&&g.screen==='play';
  var attack=!!(k.j||k.x||k.z||k.enter||hitPt(held,W-160,H-140,160,140)||aimClick);
  var up=!!(k.arrowup||k.up||k.w),down=!!(k.arrowdown||k.down||k.s),confirm=!!(k.enter||k.return||k.space||k.spacebar),back=!!(k.escape||k.esc);

  function armAudio(){try{var root=(typeof window!=='undefined')?window:globalThis,Ctx=root.AudioContext||root.webkitAudioContext;if(!Ctx){g.audioBlocked=true;return null;}var ac=root.__drpAudio||(root.__drpAudio=new Ctx());g.audioArmed=true;if(ac.state==='suspended'&&ac.resume){var p=ac.resume();if(p&&p.then)p.then(function(){root.__drpAudioUnlocked=true;}).catch(function(){g.audioBlocked=true;});}
    if(!root.__drpAudioPrimed){root.__drpAudioPrimed=true;try{var o=ac.createOscillator(),gn=ac.createGain();gn.gain.setValueAtTime(0.00001,ac.currentTime);o.connect(gn);gn.connect(ac.destination);o.start();o.stop(ac.currentTime+.03);}catch(e){}}
    g.audioReady=ac.state!=='suspended'||!!root.__drpAudioUnlocked;g.audioBlocked=!g.audioReady;return ac;}catch(e){g.audioBlocked=true;return null;}}
  function audioLive(ac){try{var root=(typeof window!=='undefined')?window:globalThis;return !!ac&&(ac.state!=='suspended'||!!root.__drpAudioUnlocked);}catch(e){return !!ac&&g.audioReady;}}
  function snd(freq,dur,type,gain){try{var ac=armAudio();if(!audioLive(ac))return;g.audioReady=true;g.audioBlocked=false;var o=ac.createOscillator(),gn=ac.createGain();o.type=type||'square';o.frequency.value=freq;gn.gain.setValueAtTime(gain||0.035,ac.currentTime);gn.gain.exponentialRampToValueAtTime(0.0001,ac.currentTime+dur);o.connect(gn);gn.connect(ac.destination);o.start();o.stop(ac.currentTime+dur);}catch(e){g.audioBlocked=true;}}
  function sfx(n){if(n==='hit'){snd(92,.16,'sawtooth',.06);snd(54,.22,'square',.03);}else if(n==='impact'){snd(132,.04,'square',.025);}else if(n==='cleaver'){snd(180,.05,'sawtooth',.045);snd(82,.08,'square',.025);}else if(n==='axe'){snd(120,.08,'sawtooth',.055);snd(64,.13,'square',.035);}else if(n==='knives'){snd(420,.035,'triangle',.035);snd(520,.04,'triangle',.025);}else if(n==='staff'){snd(260,.06,'square',.035);snd(180,.08,'triangle',.02);}else if(n==='ember'){snd(330,.05,'sawtooth',.035);snd(660,.06,'triangle',.02);}else if(n==='frost'){snd(520,.07,'sine',.03);snd(880,.05,'triangle',.018);}else if(n==='arrow'){snd(360,.035,'triangle',.03);snd(160,.05,'square',.012);}else if(n==='chi'){snd(240,.045,'sine',.035);snd(720,.08,'triangle',.022);}else if(n==='atk'){snd(220,.05,'square',.035);snd(440,.05,'triangle',.02);}else if(n==='drop'){snd(620,.06,'triangle',.035);snd(920,.08,'sine',.025);}else if(n==='level'){snd(330,.07,'square',.04);snd(660,.1,'triangle',.04);snd(990,.12,'sine',.025);}else if(n==='select'){snd(300,.04,'square',.025);}else if(n==='boss'){snd(80,.26,'sawtooth',.08);}}
  function music(){if(g.screen!=='play')return;if(g.audioArmed&&!g.audioReady)armAudio();if(!g.audioReady)return;g.musicTick--;if(g.musicTick>0)return;g.musicTick=8;var bass=[55,55,82,65,55,98,82,65,49,49,73,61,49,92,73,61],lead=[220,247,196,165,220,294,247,196,196,247,294,330,294,247,196,165],step=g.musicStep++%16;g.musicBar=Math.floor(g.musicStep/16);snd(bass[step],.10,'square',.018);if(step%2===0)snd(lead[step],.07,'triangle',.012);if(step%4===0)snd(110,.18,'sawtooth',.008);}
  function rnd(a,b){return a+Math.random()*(b-a);}
  function rect(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
  function puff(x,y,col,n){for(var i=0;i<(n||8);i++)parts.push({x:x,y:y,vx:rnd(-2.8,2.8),vy:rnd(-4,1.5),life:24+Math.random()*18,c:col||'#fff'});}
  function applyClass(){var c=classes[g.classIndex],w=c.weapons[g.weaponIndex];g.className=c.name;g.weaponName=w[0];g.weaponKind=w[1];g.weaponRange=w[2];g.attackStyle=w[5]||w[1];g.stats={};for(var key in c.stats)g.stats[key]=c.stats[key];g.maxHp=c.hp+g.stats.hp*8;g.hp=g.maxHp;g.weaponTier=1;g.xp=0;g.nextXp=35;g.statPoints=0;g.maxJumps=2;g.jumpsLeft=2;}
  function levelLength(){return 2600+g.level*360;}
  function makeLevel(){
    en.length=0;pr.length=0;drops.length=0;parts.length=0;plats.length=0;haz.length=0;
    g.worldX=80;g.cameraX=0;g.y=FLOOR-g.hei;g.vy=0;g.hp=Math.min(g.maxHp,g.hp+24+g.stats.wisdom*3);g.invuln=260;g.grace=260;g.jumpsLeft=g.maxJumps||2;g.buffs={};g.message=floorNames[g.level-1]||'Deep Floor';g.levelTitle=190;g.levelTitleText=g.message;
    var len=levelLength();
    for(var x=420;x<len-260;x+=280+Math.floor(Math.random()*150)){
      var y=358-Math.floor(Math.random()*84),ww=124+Math.floor(Math.random()*96);
      plats.push({x:x,y:y,w:ww,h:18});
      if(x>760&&Math.random()<.45)haz.push({x:x+ww+60,y:FLOOR-20,w:54+Math.random()*70,h:20,type:'spikes'});
    }
    var types=['rat','slime','bat','skel','cult','archer','knight','wisp'];
    for(var e=0;e<7+g.level*3;e++){
      var t=types[Math.min(types.length-1,Math.floor(Math.random()*(3+g.level)))];
      spawnEnemy(t,1040+e*(230+Math.random()*130),false);
    }
    if(g.level>=g.maxLevel) spawnEnemy('boss',len-360,true);
    else en.push({type:'gate',x:len-110,y:FLOOR-82,w:54,h:82,hp:999,max:999,gate:true});
  }
  function spawnEnemy(type,x,boss){
    var base={rat:[28,9,36,24],slime:[42,12,38,30],bat:[30,10,34,28],skel:[56,16,36,48],cult:[46,13,34,46],archer:[44,15,34,46],knight:[92,22,42,54],wisp:[36,14,30,34],boss:[360,28,96,118]}[type]||[40,10,34,34];
    var hp=base[0]+g.level*10+(boss?120:0),dmg=base[1]+g.level*2;
    en.push({type:type,x:x,y:FLOOR-base[3],w:base[2],h:base[3],vx:0,vy:0,hp:hp,max:hp,dmg:dmg,boss:!!boss,timer:Math.random()*80,jump:0,dir:-1,cd:40+Math.random()*50,xp:(boss?220:14+g.level*6)});
  }
  function start(){armAudio();g.classIndex=Math.max(0,Math.min(classes.length-1,g.classIndex|0));g.weaponIndex=Math.max(0,Math.min(1,g.weaponIndex|0));applyClass();g.level=1;g.screen='play';g.dead=false;g.won=false;g.last={};g.musicTick=1;makeLevel();sfx('select');}
  function chooseMenu(max){if(up&&!g.last.up){armAudio();g.menuIndex=(g.menuIndex+max-1)%max;sfx('select');}if(down&&!g.last.down){armAudio();g.menuIndex=(g.menuIndex+1)%max;sfx('select');}}
  function clickedClass(){if(!click)return -1;for(var i=0;i<classes.length;i++){var y=206+i*48;if(hit(150,y-26,660,36))return i;}return -1;}
  function clickedWeapon(){if(!click)return -1;for(var i=0;i<2;i++){var y=250+i*58;if(hit(250,y-31,460,42))return i;}return -1;}
  function clickedStat(){if(!click)return -1;for(var i=0;i<stats.length;i++){var y=170+i*38;if(hit(236,y-24,488,30))return i;}return -1;}

  g.frame++;
  for(var bn in g.buffs){if(g.buffs[bn]>0)g.buffs[bn]--;else delete g.buffs[bn];}
  if(click||held||left||right||jump||attack||confirm||up||down)armAudio();
  music();
  if(g.screen==='class'){chooseMenu(classes.length);var cc=clickedClass();if(cc>=0){g.menuIndex=cc;g.classIndex=cc;g.screen='weapon';g.menuIndex=0;sfx('select');}else{g.classIndex=g.menuIndex;if(confirm&&!g.last.confirm){g.screen='weapon';g.menuIndex=0;sfx('select');}}g.last={up:up,down:down,confirm:confirm};return state;}
  if(g.screen==='weapon'){chooseMenu(2);var cw=clickedWeapon();if(cw>=0){g.weaponIndex=cw;start();}else{g.weaponIndex=g.menuIndex;if(back&&!g.last.back){g.screen='class';g.menuIndex=g.classIndex;}if(confirm&&!g.last.confirm)start();}g.last={up:up,down:down,confirm:confirm,back:back};return state;}
  if(g.screen==='levelup'){
    chooseMenu(stats.length);var cs=clickedStat();if(cs>=0)g.menuIndex=cs;if((cs>=0)||confirm&&!g.last.confirm){var st=stats[g.menuIndex];g.stats[st]++;g.statPoints--;if(st==='hp'){g.maxHp+=12;g.hp+=12;}sfx('level');if(g.statPoints<=0)g.screen='play';}
    g.last={up:up,down:down,confirm:confirm};return state;
  }
  if(g.screen==='dead'||g.screen==='win'){if(click||confirm&&!g.last.confirm){g.screen='class';g.menuIndex=0;g.classIndex=0;g.weaponIndex=0;g.className='';g.weaponName='';en.length=0;pr.length=0;drops.length=0;parts.length=0;plats.length=0;haz.length=0;}g.last={confirm:confirm};return state;}
  if(g.screen!=='play'){return state;}

  var speed=3.1+g.stats.dexterity*.22+(g.buffs.haste?2.2:0),jumpPow=13.2+g.stats.dexterity*.16+(g.buffs.spring?3.2:0);
  if(left){g.worldX-=speed;g.face=-1;} if(right){g.worldX+=speed;g.face=1;}
  var minX=Math.max(20,g.cameraX-40); if(g.worldX<minX)g.worldX=minX;
  if(jump&&!g.last.jump&&(g.onGround||(g.jumpsLeft||0)>0)){var air=!g.onGround;g.vy=air?-jumpPow*.92:-jumpPow;g.onGround=false;g.jumpsLeft=Math.max(0,(g.jumpsLeft||1)-1);puff(g.worldX+g.wid/2,g.y+g.hei-4,air?'#8ef7ff':'#f0d36b',air?8:5);snd(air?520:250,.05,air?'triangle':'square',.025);}
  g.vy+=GRAV; g.y+=g.vy; g.onGround=false;
  if(g.y+g.hei>=FLOOR){g.y=FLOOR-g.hei;g.vy=0;g.onGround=true;g.jumpsLeft=g.maxJumps||2;}
  for(var p=0;p<plats.length;p++){var pl=plats[p];if(g.vy>=0&&g.worldX+g.wid>pl.x&&g.worldX<pl.x+pl.w&&g.y+g.hei>pl.y&&g.y+g.hei<pl.y+24){g.y=pl.y-g.hei;g.vy=0;g.onGround=true;g.jumpsLeft=g.maxJumps||2;}}
  g.cameraX=Math.max(g.cameraX,Math.min(g.worldX-210,levelLength()-W+70));
  if(left||right||jump||attack)g.grace=Math.min(g.grace||0,90);
  if(g.grace>0)g.grace--; if(g.levelTitle>0)g.levelTitle--;
  if(g.invuln>0)g.invuln--; if(g.shake>0)g.shake*=.84;
  if(g.atkTimer>0)g.atkTimer--;
  if(attack&&!g.last.attack&&g.atkTimer<=0){
    var cls=classes[g.classIndex],wp=cls.weapons[g.weaponIndex],cool=Math.max(12,wp[4]-g.stats.dexterity*1.5-(g.buffs.focus?7:0));
    var style=wp[5]||g.weaponKind;g.atkTimer=cool;g.attackStyle=style;g.atkSeq=(g.atkSeq||0)+1;sfx(style);
    if(click&&g.screen==='play'){var targetX=(g.cameraX||0)+click.x;if(Math.abs(targetX-g.worldX)>6)g.face=targetX>g.worldX?1:-1;}
    var dmg=wp[3]+g.weaponTier*4+g.stats.attack*3+Math.floor(g.stats.intelligence*(g.weaponKind==='magic'?3:0));
    if(g.buffs.fury)dmg+=9;
    if(Math.random()<.05+g.stats.luck*.018){dmg*=2;puff(g.worldX+g.wid/2,g.y+20,'#fff06a',10);}
    if(g.weaponKind==='melee'){
      var range=g.weaponRange,hh=style==='axe'?54:style==='staff'?34:style==='knives'?28:42,yy=g.y+(style==='axe'?-2:style==='staff'?18:12),xx=g.worldX+(g.face>0?g.wid-2:-range+2);
      pr.push({team:'p',kind:'slash',style:style,x:xx,y:yy,w:range,h:hh,life:style==='knives'?7:10,dmg:dmg,dir:g.face,hitIds:{}});
      if(style==='knives')pr.push({team:'p',kind:'slash',style:'knives2',x:xx,y:g.y+30,w:range-8,h:24,life:7,dmg:Math.ceil(dmg*.7),dir:g.face,hitIds:{}});
    }
    else{var spd=g.weaponKind==='arrow'?10.2:style==='chi'?6.9:7.6,vx=g.face*spd,vy=0;if(click){var ax=(g.cameraX||0)+click.x-(g.worldX+g.wid/2),ay=click.y-(g.y+20),dist=Math.max(1,Math.sqrt(ax*ax+ay*ay));vx=ax/dist*spd;vy=ay/dist*spd;}var kw=g.weaponKind==='arrow'?26:style==='frost'?18:style==='chi'?22:16,kh=g.weaponKind==='arrow'?10:style==='chi'?18:12;pr.push({team:'p',kind:g.weaponKind,style:style,x:g.worldX+g.wid/2,y:g.y+20,w:kw,h:kh,vx:vx,vy:vy,life:g.weaponKind==='arrow'?70:86,dmg:dmg,dir:g.face});}
  }
  g.last={jump:jump,attack:attack,up:up,down:down,confirm:confirm};

  var slow=g.buffs.clock?.48:1, enemySleep=(g.grace||0)>0;
  for(var i=0;i<en.length;i++){
    var e=en[i]; if(e.dead||e.gate)continue; if(enemySleep){e.cd=Math.max(e.cd,36);continue;} e.timer+=slow; e.cd-=slow; var px=g.worldX-e.x;
    if(e.type==='bat'||e.type==='wisp'){e.y+=Math.sin(e.timer*.08)*1.7; e.x+=(px>0?1:-1)*(1.2+g.level*.08)*slow;}
    else if(e.type==='slime'){if(e.jump<=0&&Math.abs(px)<320){e.vy=-8-Math.random()*3;e.jump=80;} e.jump-=slow;}
    else if(e.type==='rat'){e.x+=(px>0?1:-1)*(1.7+g.level*.08)*slow;}
    else if(e.type==='skel'||e.type==='knight'||e.type==='boss'){if(Math.abs(px)<420)e.x+=(px>0?1:-1)*(e.boss?1.05:1.15)*slow;}
    if((e.type==='cult'||e.type==='archer'||e.type==='wisp'||e.boss)&&e.cd<=0&&Math.abs(px)<620){e.cd=e.boss?42:84-Math.min(30,g.level*4);var sp=e.type==='archer'?6.8:4.8;pr.push({team:'e',kind:e.type==='archer'?'bolt':'fire',x:e.x+e.w/2,y:e.y+18,w:13,h:9,vx:(px>0?1:-1)*sp,vy:e.boss?rnd(-1.2,1.2):0,life:120,dmg:e.dmg,dir:px>0?1:-1});}
    e.vy=(e.vy||0)+GRAV; e.y+=e.vy; if(e.y+e.h>=FLOOR){e.y=FLOOR-e.h;e.vy=0;}
  }
  for(var hi=0;hi<haz.length;hi++){var hz=haz[hi];if(g.invuln<=0&&rect({x:g.worldX+6,y:g.y+6,w:g.wid-12,h:g.hei-8},hz)){damage(12+g.level*3);}}
  function damage(d){if(g.invuln>0||(g.grace||0)>0)return;var red=Math.min(.65,(g.stats.defense+(g.buffs.armor?5:0))*.055);var hit=Math.max(1,Math.floor(d*(1-red)));g.hp-=hit;g.invuln=g.buffs.shield?90:38;g.shake=9;sfx('hit');puff(g.worldX+g.wid/2,g.y+20,'#ff5577',12);if(g.hp<=0){g.hp=0;g.screen='dead';g.message='The dungeon keeps your bones.';}}
  function gainXp(v){v=Math.floor(v*(1+g.stats.wisdom*.05+(g.buffs.tome?.55:0)));g.xp+=v;while(g.xp>=g.nextXp){g.xp-=g.nextXp;g.nextXp=Math.floor(g.nextXp*1.34+18);g.statPoints++;g.screen='levelup';sfx('level');}}
  function dropAt(x,y,e){
    var chance=.35+g.stats.luck*.035;if(e.boss)chance=1;if(Math.random()<chance){var roll=Math.random(),kind='power';if(roll<.2)kind='weapon';else if(roll<.34)kind='upgrade';var pwr=powerDefs[Math.floor(Math.random()*powerDefs.length)];drops.push({x:x,y:y,w:24,h:24,kind:kind,power:pwr[0],color:pwr[2],label:kind==='weapon'?'weapon':kind==='upgrade'?'upgrade':pwr[0],life:900});}
    drops.push({x:x+10,y:y-10,w:18,h:18,kind:'xp',label:'xp',color:'#8ef7ff',xp:e.xp,life:900});
  }
  for(var pi=pr.length-1;pi>=0;pi--){
    var a=pr[pi];a.life--; if(a.kind!=='slash'){a.x+=a.vx||0;a.y+=a.vy||0;}
    if(a.life<=0){pr.splice(pi,1);continue;}
    if(a.team==='p'){
      for(var ei=0;ei<en.length;ei++){var ee=en[ei];if(ee.dead||ee.gate)continue;if(rect(a,ee)){if(a.kind==='slash'){a.hitIds=a.hitIds||{};if(a.hitIds[ei])continue;a.hitIds[ei]=true;}ee.hp-=a.dmg;sfx('impact');puff(ee.x+ee.w/2,ee.y+20,a.style==='frost'?'#b9f6ff':a.style==='ember'?'#ff9b45':a.style==='chi'?'#fff06a':'#ffe07a',7);if(g.buffs.vamp)g.hp=Math.min(g.maxHp,g.hp+2);if(a.kind!=='slash')a.life=0;if(ee.hp<=0){ee.dead=true;dropAt(ee.x,ee.y,ee);puff(ee.x+ee.w/2,ee.y+ee.h/2,ee.boss?'#f0d36b':'#ba8cff',20);if(ee.boss){g.screen='win';g.message='The Obsidian Choir goes quiet.';}}}}
    } else if(g.invuln<=0&&rect(a,{x:g.worldX+6,y:g.y+6,w:g.wid-12,h:g.hei-8})){damage(a.dmg);a.life=0;}
  }
  for(var ei2=0;ei2<en.length;ei2++){var eo=en[ei2];if(!eo.dead&&!eo.gate&&g.invuln<=0&&rect({x:g.worldX+6,y:g.y+6,w:g.wid-12,h:g.hei-8},eo))damage(eo.dmg);}
  for(var dd=drops.length-1;dd>=0;dd--){var d=drops[dd];d.life--;if(g.buffs.magnet){var dx=g.worldX-d.x,dy=g.y-d.y,dist=Math.max(1,Math.sqrt(dx*dx+dy*dy));if(dist<260){d.x+=dx/dist*5;d.y+=dy/dist*5;}}if(rect({x:g.worldX-4,y:g.y-4,w:g.wid+8,h:g.hei+8},d)){if(d.kind==='xp')gainXp(d.xp);else if(d.kind==='weapon'){g.weaponTier++;g.weaponName=(g.weaponTier%2?classes[g.classIndex].weapons[0][0]:classes[g.classIndex].weapons[1][0])+' +'+g.weaponTier;sfx('drop');}else if(d.kind==='upgrade'){g.weaponTier++;sfx('drop');}else{applyPower(d.power);sfx('drop');}drops.splice(dd,1);}else if(d.life<=0)drops.splice(dd,1);}
  function applyPower(p){if(p==='heart')g.hp=Math.min(g.maxHp,g.hp+35+g.stats.wisdom*4);else if(p==='bomb'){for(var i=0;i<en.length;i++)if(!en[i].dead&&Math.abs(en[i].x-g.worldX)<360){en[i].hp-=70;if(en[i].hp<=0){en[i].dead=true;dropAt(en[i].x,en[i].y,en[i]);}}g.shake=12;}else{var dur=360+g.stats.wisdom*24;g.buffs[p]=dur;}}
  if(g.buffs.regen&&g.frame%45===0)g.hp=Math.min(g.maxHp,g.hp+3+g.stats.wisdom);
  for(var pa=0;pa<parts.length;pa++){var pp=parts[pa];pp.x+=pp.vx;pp.y+=pp.vy;pp.vy+=.15;pp.life--;}for(var pp2=parts.length-1;pp2>=0;pp2--)if(parts[pp2].life<=0)parts.splice(pp2,1);
  var end=levelLength()-120;if(g.worldX>end&&g.level<g.maxLevel){g.level++;makeLevel();sfx('level');}

  state.drp=g;state.drpEnemies=en;state.drpProjectiles=pr;state.drpDrops=drops;state.drpParticles=parts;state.drpPlatforms=plats;state.drpHazards=haz;return state;
})();
`;

const renderCode = String.raw`
(function(){
  var c=drawingContext,cw=dimensionContext.width,ch=dimensionContext.height,W=960,H=540,FLOOR=468;
  var g=state.drp||{screen:'class',frame:0,classIndex:0,menuIndex:0,level:1,stats:{},hp:100,maxHp:100};
  var en=state.drpEnemies||[],pr=state.drpProjectiles||[],drops=state.drpDrops||[],parts=state.drpParticles||[],plats=state.drpPlatforms||[],haz=state.drpHazards||[];
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
  c.save();c.fillStyle='#02040b';c.fillRect(0,0,cw,ch);c.translate(ox,oy);c.scale(scale,scale);
  function background(){
    var themes=[['#100d18','#181326','#352338'],['#071915','#102a22','#1e4032'],['#18101d','#2c1830','#51332c'],['#0d1219','#202735','#35475c'],['#08060d','#1b0d25','#411333']];
    var th=themes[(g.level||1)-1]||themes[0],bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,th[0]);bg.addColorStop(.5,th[1]);bg.addColorStop(1,th[2]);c.fillStyle=bg;c.fillRect(0,0,W,H);
    var cam=g.cameraX||0;
    c.save();c.translate(-(cam*.22%192),0);
    for(var i=-1;i<7;i++){
      var bx=i*192;c.fillStyle='rgba(0,0,0,.26)';c.fillRect(bx,118,192,350);
      c.strokeStyle='rgba(175,213,198,.13)';c.lineWidth=2;for(var by=136;by<452;by+=42){c.beginPath();c.moveTo(bx,by);c.lineTo(bx+192,by);c.stroke();}
      for(var ax=28;ax<180;ax+=56){c.fillStyle='rgba(0,0,0,.34)';c.beginPath();c.arc(bx+ax,230,18,Math.PI,0);c.lineTo(bx+ax+18,334);c.lineTo(bx+ax-18,334);c.closePath();c.fill();c.strokeStyle='rgba(132,255,223,.08)';c.stroke();}
      c.fillStyle='rgba(255,218,122,.10)';c.fillRect(bx+20,398,9,28);c.fillRect(bx+164,372,9,30);
    }
    c.restore();
    c.save();c.translate(-cam,0);c.fillStyle='#130d14';c.fillRect(cam,FLOOR,W+40,H-FLOOR);c.strokeStyle='rgba(205,192,177,.18)';for(var x=Math.floor(cam/48)*48;x<cam+W+60;x+=48){c.beginPath();c.moveTo(x,FLOOR+16);c.lineTo(x+28,FLOOR+16);c.stroke();c.beginPath();c.moveTo(x,FLOOR+42);c.lineTo(x+48,FLOOR+42);c.stroke();}
    for(var p=0;p<plats.length;p++){var pl=plats[p];c.fillStyle='rgba(52,42,59,.95)';rr(pl.x,pl.y,pl.w,pl.h,4);c.fill();c.fillStyle='rgba(139,255,224,.25)';c.fillRect(pl.x,pl.y,pl.w,3);}
    for(var h=0;h<haz.length;h++){var hz=haz[h];c.fillStyle='#5b1022';c.fillRect(hz.x,hz.y+10,hz.w,10);c.fillStyle='#e9d5a3';for(var sx=0;sx<hz.w;sx+=13){c.beginPath();c.moveTo(hz.x+sx,hz.y+10);c.lineTo(hz.x+sx+7,hz.y-12);c.lineTo(hz.x+sx+14,hz.y+10);c.fill();}}
    c.restore();
  }
  function drawEnemy(e){
    if(e.dead)return;var x=e.x-(g.cameraX||0),y=e.y;c.save();c.translate(x,y);var col={rat:'#8b6b5c',slime:'#55cc77',bat:'#6f68b8',skel:'#d9d2bd',cult:'#a65dff',archer:'#67d48a',knight:'#b7beca',wisp:'#79ddff',boss:'#ff4f9c'}[e.type]||'#fff';
    c.fillStyle=col;if(e.type==='boss'){c.fillStyle='#37112b';rr(0,8,e.w,e.h-8,18);c.fill();c.fillStyle='#ff4f9c';c.beginPath();c.moveTo(10,26);c.lineTo(28,0);c.lineTo(45,28);c.lineTo(62,0);c.lineTo(86,28);c.lineTo(76,48);c.lineTo(20,48);c.closePath();c.fill();c.fillStyle='#090711';c.fillRect(18,42,18,16);c.fillRect(60,42,18,16);c.fillStyle='#f6d06c';c.fillRect(22,86,52,9);c.strokeStyle='#f0d36b';c.lineWidth=4;c.beginPath();c.moveTo(48,18);c.lineTo(48,-20);c.stroke();}
    else if(e.type==='rat'){c.fillStyle='#6f4f45';c.beginPath();c.ellipse(e.w/2,e.h/2,e.w/2,12,0,0,Math.PI*2);c.fill();c.strokeStyle='#c49a7a';c.lineWidth=3;c.beginPath();c.moveTo(2,18);c.quadraticCurveTo(-18,28,-4,34);c.stroke();c.fillStyle='#f0d36b';c.fillRect(e.w-8,9,3,3);}
    else if(e.type==='bat'){c.fillStyle='#30295d';c.beginPath();c.moveTo(0,18);c.lineTo(12,2);c.lineTo(18,16);c.lineTo(28,2);c.lineTo(34,18);c.lineTo(22,26);c.lineTo(17,20);c.lineTo(12,26);c.closePath();c.fill();c.fillStyle='#b7a8ff';c.fillRect(14,15,3,3);c.fillRect(20,15,3,3);}
    else if(e.type==='slime'){c.fillStyle='rgba(85,204,119,.92)';c.beginPath();c.ellipse(e.w/2,e.h/2+4,e.w/2,16,0,0,Math.PI*2);c.fill();c.fillStyle='rgba(210,255,205,.55)';c.beginPath();c.arc(14,11,5,0,Math.PI*2);c.fill();c.fillStyle='#102216';c.fillRect(24,15,4,4);}
    else if(e.type==='wisp'){c.fillStyle='rgba(121,221,255,.35)';c.beginPath();c.arc(e.w/2,e.h/2,21,0,Math.PI*2);c.fill();c.fillStyle='#79ddff';c.beginPath();c.moveTo(e.w/2,0);c.quadraticCurveTo(e.w,18,e.w/2,e.h);c.quadraticCurveTo(0,18,e.w/2,0);c.fill();c.fillStyle='#fff';c.fillRect(12,15,3,3);c.fillRect(20,15,3,3);}
    else if(e.type==='skel'){c.fillStyle='#d9d2bd';c.fillRect(11,2,14,14);c.fillRect(15,16,7,22);c.strokeStyle='#d9d2bd';c.lineWidth=4;c.beginPath();c.moveTo(15,24);c.lineTo(3,34);c.moveTo(22,24);c.lineTo(34,34);c.moveTo(16,38);c.lineTo(8,48);c.moveTo(22,38);c.lineTo(30,48);c.stroke();c.fillStyle='#101018';c.fillRect(14,7,3,3);c.fillRect(22,7,3,3);}
    else if(e.type==='cult'){c.fillStyle='#2a1238';rr(4,7,e.w-8,e.h-7,10);c.fill();c.fillStyle='#a65dff';c.beginPath();c.moveTo(e.w/2,-5);c.lineTo(e.w-2,18);c.lineTo(2,18);c.closePath();c.fill();c.fillStyle='#ffd87a';c.fillRect(13,20,4,4);c.fillRect(21,20,4,4);}
    else if(e.type==='archer'){c.fillStyle='#1d422b';rr(5,9,e.w-10,e.h-9,7);c.fill();c.strokeStyle='#c69c5c';c.lineWidth=3;c.beginPath();c.arc(26,24,14,-1.1,1.1);c.stroke();c.strokeStyle='#e8f8ff';c.lineWidth=2;c.beginPath();c.moveTo(12,24);c.lineTo(34,21);c.stroke();}
    else if(e.type==='knight'){c.fillStyle='#7f8793';rr(4,4,e.w-8,e.h-4,8);c.fill();c.fillStyle='#252b34';c.fillRect(9,14,e.w-18,7);c.fillStyle='#d4dce7';c.fillRect(8,29,e.w-16,5);c.strokeStyle='#9aa7b8';c.lineWidth=4;c.beginPath();c.moveTo(e.w-2,18);c.lineTo(e.w+13,38);c.stroke();}
    else{rr(0,0,e.w,e.h,7);c.fill();c.fillStyle='rgba(0,0,0,.45)';c.fillRect(7,12,e.w-14,9);}
    c.fillStyle='rgba(0,0,0,.65)';c.fillRect(0,-9,e.w,5);c.fillStyle='#ff607e';c.fillRect(0,-9,e.w*Math.max(0,e.hp/e.max),5);c.restore();
  }
  function drawPlayer(){
    var x=g.worldX-(g.cameraX||0),y=g.y,cls=classes[g.classIndex]||classes[0],name=cls.name,kind=g.weaponKind||'melee',style=g.attackStyle||kind,air=!g.onGround;c.save();c.translate(x,y);if(g.invuln>0&&Math.floor(g.frame/5)%2===0)c.globalAlpha=.45;
    var f=g.face||1,atk=Math.max(0,g.atkTimer||0),swing=atk>0?Math.sin(Math.min(1,atk/14)*Math.PI):0,run=(g.frame||0)*.22,leg=air?(g.vy<0?-8:8):Math.sin(run)*6;
    c.lineCap='round';c.lineJoin='round';
    if(name==='Warrior'){c.fillStyle='#5f1f2f';rr(2,14,30,38,5);c.fill();c.fillStyle=cls.color;rr(5,20,24,30,4);c.fill();c.fillStyle='#b9c0c9';c.fillRect(5,18,24,7);}
    else if(name==='Mage'){c.fillStyle='rgba(143,123,255,.28)';c.beginPath();c.moveTo(17,-2);c.lineTo(36,52);c.lineTo(-2,52);c.closePath();c.fill();c.fillStyle=cls.color;rr(5,18,24,34,9);c.fill();c.fillStyle='#d8c7ff';c.beginPath();c.moveTo(17,-14);c.lineTo(30,5);c.lineTo(4,5);c.closePath();c.fill();}
    else if(name==='Archer'){c.fillStyle='#183823';rr(2,17,30,34,5);c.fill();c.fillStyle=cls.color;rr(6,22,22,28,5);c.fill();c.fillStyle='#244d31';c.beginPath();c.moveTo(4,16);c.lineTo(17,5);c.lineTo(30,16);c.closePath();c.fill();}
    else{c.fillStyle='#5d4c22';rr(4,15,26,37,10);c.fill();c.fillStyle=cls.color;rr(7,21,20,29,8);c.fill();c.strokeStyle='#f8e6a0';c.lineWidth=2;c.beginPath();c.arc(17,35,15,0,Math.PI*2);c.stroke();}
    c.fillStyle='#f2c994';c.beginPath();c.arc(17,8,11,0,Math.PI*2);c.fill();
    c.fillStyle=name==='Mage'?'#efe7ff':name==='Archer'?'#eaffd9':name==='Warrior'?'#ffe1db':'#fff0ba';c.fillRect(10,7,4,3);c.fillRect(22,7,4,3);
    c.strokeStyle='#1b1028';c.lineWidth=6;c.beginPath();c.moveTo(10,52);c.lineTo(6+leg*.35,66-leg*.25);c.moveTo(24,52);c.lineTo(30-leg*.35,66+leg*.18);c.stroke();
    c.strokeStyle='#f2c994';c.lineWidth=5;c.beginPath();c.moveTo(8,30);c.lineTo(17+f*(12+swing*7),28-swing*7+(air?-4:0));c.moveTo(26,30);c.lineTo(17+f*(20+swing*9),25-swing*8+(air?-5:0));c.stroke();
    c.save();c.translate(17+f*18,25-swing*8);c.scale(f,1);
    if(kind==='arrow'){c.strokeStyle='#8b5a2b';c.lineWidth=3;c.beginPath();c.arc(0,3,18,-1.2,1.2);c.stroke();c.strokeStyle='#d9c99b';c.lineWidth=1.5;c.beginPath();c.moveTo(-7,-13);c.lineTo(-7,18);c.stroke();c.strokeStyle='#e8f8ff';c.lineWidth=2;c.beginPath();c.moveTo(-8,3);c.lineTo(28+swing*9,0);c.stroke();c.fillStyle='#e8f8ff';c.beginPath();c.moveTo(28+swing*9,0);c.lineTo(19+swing*9,-4);c.lineTo(20+swing*9,4);c.fill();}
    else if(kind==='magic'){c.strokeStyle=style==='chi'?'#f0d36b':style==='frost'?'#b9f6ff':'#ff9b45';c.lineWidth=4;c.beginPath();c.moveTo(-10,18);c.lineTo(15+swing*8,-16);c.stroke();c.fillStyle=style==='chi'?'#fff06a':style==='frost'?'#d6fbff':'#ff7a33';c.beginPath();c.arc(17+swing*8,-18,5+swing*4,0,Math.PI*2);c.fill();}
    else if(style==='knives'){c.strokeStyle='#d9d7c9';c.lineWidth=4;c.beginPath();c.moveTo(-5,6);c.lineTo(18+swing*7,-5);c.moveTo(-3,18);c.lineTo(20+swing*7,8);c.stroke();}
    else if(style==='staff'){c.strokeStyle='#b8874f';c.lineWidth=5;c.beginPath();c.moveTo(-14,22);c.lineTo(28+swing*10,-18);c.stroke();c.fillStyle='#f0d36b';c.beginPath();c.arc(30+swing*10,-20,6,0,Math.PI*2);c.fill();}
    else{c.strokeStyle='#9aa7b8';c.lineWidth=5;c.beginPath();c.moveTo(-7,12);c.lineTo(22+swing*9,-13);c.stroke();c.fillStyle=style==='axe'?'#cfd7e4':'#d7dde8';c.beginPath();if(style==='axe'){c.moveTo(18+swing*9,-22);c.lineTo(38+swing*9,-11);c.lineTo(28+swing*9,8);c.lineTo(12+swing*9,-8);}else{c.moveTo(21+swing*9,-17);c.lineTo(34+swing*9,-8);c.lineTo(25+swing*9,1);c.lineTo(16+swing*9,-8);}c.closePath();c.fill();}
    c.restore();c.restore();
  }
  function drawWorld(){
    c.save();if(g.shake>0)c.translate((Math.random()-.5)*g.shake,(Math.random()-.5)*g.shake);background();
    c.save();c.translate(-(g.cameraX||0),0);
    for(var i=0;i<drops.length;i++){var d=drops[i];c.save();c.translate(d.x,d.y);c.fillStyle=d.color||'#fff';c.beginPath();c.arc(12,12,13,0,Math.PI*2);c.fill();c.fillStyle='#07101d';c.font='9px monospace';c.textAlign='center';c.fillText(d.kind==='xp'?'XP':d.kind==='weapon'?'W':d.kind==='upgrade'?'+':'*',12,15);c.restore();}
    for(var q=0;q<pr.length;q++){var a=pr[q];c.save();c.translate(a.x,a.y);c.fillStyle=a.team==='p'?'#fff06a':'#ff5577';if(a.kind==='slash'){var life=Math.max(0,Math.min(1,a.life/10));c.globalAlpha=.35+.35*life;c.strokeStyle=a.style==='axe'?'#d7dde8':a.style==='staff'?'#f0d36b':a.style==='knives'||a.style==='knives2'?'#d9d7c9':'#fff4c8';c.lineWidth=a.style==='axe'?13:a.style==='staff'?8:a.style==='knives'||a.style==='knives2'?5:10;c.beginPath();if(a.dir>0){c.moveTo(4,a.h*.75);c.quadraticCurveTo(a.w*.58,-10,a.w-4,a.h*.25);}else{c.moveTo(a.w-4,a.h*.75);c.quadraticCurveTo(a.w*.42,-10,4,a.h*.25);}c.stroke();c.globalAlpha=.12;c.fillRect(0,0,a.w,a.h);c.globalAlpha=1;}else if(a.kind==='arrow'){var ang=Math.atan2(a.vy||0,a.vx||1);c.rotate(ang);c.strokeStyle='#e8f8ff';c.lineWidth=2;c.beginPath();c.moveTo(-10,0);c.lineTo(18,0);c.stroke();c.fillStyle='#e8f8ff';c.beginPath();c.moveTo(18,0);c.lineTo(8,-5);c.lineTo(9,5);c.fill();}else if(a.style==='ember'){c.fillStyle='#ff7a33';c.beginPath();c.arc(a.w/2,a.h/2,9,0,Math.PI*2);c.fill();c.fillStyle='rgba(255,220,96,.8)';c.beginPath();c.arc(a.w/2-2,a.h/2-2,4,0,Math.PI*2);c.fill();}else if(a.style==='frost'){c.strokeStyle='#b9f6ff';c.lineWidth=3;c.beginPath();c.moveTo(0,a.h/2);c.lineTo(a.w,a.h/2);c.moveTo(a.w/2,0);c.lineTo(a.w/2,a.h);c.stroke();}else if(a.style==='chi'){c.fillStyle='rgba(255,240,106,.82)';c.beginPath();c.arc(a.w/2,a.h/2,10,0,Math.PI*2);c.fill();c.strokeStyle='#fff';c.stroke();}else{rr(0,0,a.w,a.h,5);c.fill();}c.restore();}
    for(var r=0;r<parts.length;r++){var p=parts[r];c.globalAlpha=Math.max(0,p.life/40);c.fillStyle=p.c;c.fillRect(p.x,p.y,3,3);c.globalAlpha=1;}
    c.restore();for(var e=0;e<en.length;e++)drawEnemy(en[e]);drawPlayer();c.restore();
  }
  function hud(){panel(14,12,252,62);var hpw=128;c.fillStyle='rgba(0,0,0,.55)';c.fillRect(32,26,hpw,10);c.fillStyle='#ff5577';c.fillRect(32,26,hpw*Math.max(0,g.hp/g.maxHp),10);txt('HP '+Math.ceil(g.hp)+'/'+g.maxHp,172,36,10,'#ffdce3');var xpPct=g.xp/g.nextXp;c.fillStyle='rgba(0,0,0,.55)';c.fillRect(32,48,hpw,8);c.fillStyle='#8ef7ff';c.fillRect(32,48,hpw*Math.min(1,xpPct),8);txt('XP '+g.xp+'/'+g.nextXp,172,57,10,'#c8fbff');panel(W-292,12,278,56);txt((g.weaponName||'relic')+'  +'+(g.weaponTier||1),W-276,34,12,'#fff');var aud=g.audioReady?'music on':g.audioBlocked?'audio blocked':'press for music';txt(aud,W-28,56,9,g.audioReady?'#8ef7ff':g.audioBlocked?'#ffb0b0':'#ffd87a','right');if(g.grace>0)txt('SAFE '+Math.ceil(g.grace/60),W/2,92,14,'#8ef7ff','center');if(g.levelTitle>0){var a=Math.min(1,g.levelTitle/40);c.globalAlpha=a;panel(270,94,420,86);txt('FLOOR '+(g.level||1),W/2,126,14,'#8ef7ff','center');txt(g.levelTitleText||levelNames[(g.level||1)-1]||'Deep Floor',W/2,158,24,'#f0d36b','center');c.globalAlpha=1;}}
  function wrap(s,x,y,maxW,lineH,size,col,align){c.fillStyle=col||'#fff';c.font=size+'px monospace';c.textAlign=align||'left';c.textBaseline='alphabetic';var words=String(s).split(' '),line='';for(var i=0;i<words.length;i++){var test=line?line+' '+words[i]:words[i];if(c.measureText(test).width>maxW&&line){c.fillText(line,x,y);line=words[i];y+=lineH;}else line=test;}if(line)c.fillText(line,x,y);return y;}
  function menu(){
    var cls=classes[g.classIndex]||classes[0];background();panel(80,68,800,398);txt('DUNGEON RELIC ROGUE',W/2,116,30,'#f6f2ff','center');wrap('A roguelike platformer under a dead mountain. Choose a class, take a relic weapon, clear five floors, silence the Obsidian Choir.',W/2,146,730,18,13,'#c8d6e8','center');
    if(g.screen==='class'){for(var i=0;i<classes.length;i++){var y=206+i*48,sel=i===g.menuIndex;c.fillStyle=sel?'rgba(142,247,255,.22)':'rgba(255,255,255,.05)';rr(150,y-26,660,36,7);c.fill();txt((sel?'> ':'  ')+classes[i].name,182,y,18,classes[i].color);txt(classes[i].desc,350,y,12,'#cbd7e6');}txt('UP/DOWN + ENTER/CLICK',W/2,438,13,'#ffd87a','center');}
    if(g.screen==='weapon'){txt(cls.name+' starting weapon',W/2,194,20,cls.color,'center');for(var j=0;j<2;j++){var yy=250+j*58,ss=j===g.menuIndex;c.fillStyle=ss?'rgba(142,247,255,.22)':'rgba(255,255,255,.05)';rr(250,yy-31,460,42,8);c.fill();txt((ss?'> ':'  ')+cls.weapons[j],W/2,yy,18,'#fff','center');}txt('ESC back   ENTER/CLICK start',W/2,410,13,'#ffd87a','center');}
  }
  function levelUp(){drawWorld();c.fillStyle='rgba(0,0,0,.72)';c.fillRect(0,0,W,H);panel(190,74,580,398);txt('LEVEL UP: choose a stat',W/2,122,24,'#fff','center');for(var i=0;i<stats.length;i++){var st=stats[i],y=170+i*38,sel=i===g.menuIndex;c.fillStyle=sel?'rgba(240,211,107,.23)':'rgba(255,255,255,.05)';rr(236,y-24,488,30,6);c.fill();txt((sel?'> ':'  ')+st.toUpperCase()+'  '+(g.stats[st]||0),258,y,16,'#f0d36b');txt(statText[st],456,y,12,'#cdd8e5');}txt('points: '+g.statPoints,W/2,455,14,'#8ef7ff','center');}
  if(g.screen==='class'||g.screen==='weapon')menu();else if(g.screen==='levelup')levelUp();else{drawWorld();hud();if(g.screen==='dead'||g.screen==='win'){c.fillStyle='rgba(0,0,0,.72)';c.fillRect(0,0,W,H);panel(210,150,540,210);txt(g.screen==='win'?'VICTORY':'YOU DIED',W/2,205,28,g.screen==='win'?'#f0d36b':'#ff5577','center');txt(g.message||'',W/2,248,15,'#e9efff','center');txt('ENTER / CLICK to return to class select',W/2,303,14,'#8ef7ff','center');}}
  c.restore();
})();
`;

writeJson("init.json", {
  id: "glade-dungeon-rogue-init",
  name: "Dungeon Relic Rogue Init",
  description: "Initialize class selection and roguelike platformer state",
  phase: "getDefaultState",
  code: initCode.trim()
});

writeJson("update.json", {
  id: "glade-dungeon-rogue-update",
  name: "Dungeon Relic Rogue Update",
  description: "Class weapons, combat, XP/stat leveling, drops, powerups, floors, boss, and NES synth audio",
  phase: "update",
  code: updateCode.trim()
});

writeJson("render.json", {
  id: "glade-dungeon-rogue-render",
  name: "Dungeon Relic Rogue Render",
  description: "Render scaled dungeon roguelike platformer with stable HUD and menus",
  phase: "render",
  code: renderCode.trim()
});

writeJson("cart.json", {
  id: "glade-dungeon-relic-rogue-v9",
  name: "Dungeon Relic Rogue V9",
  description: "A combat and audio repair pass for the NES-flavored roguelike platformer: no bottom touch HUD boxes, double jump, jump animation, transient floor title cards, robust user-gesture music arming, visible J/X/Z/click attacks, weapon-specific hitboxes and SFX, richer enemy sprites, dungeon masonry backgrounds, XP/stat leveling, drops, powerups, and the Obsidian Choir boss.",
  frameRate: 60,
  modules: [
    { moduleId: "glade-dungeon-rogue-init", version: 4 },
    { moduleId: "glade-dungeon-rogue-update", version: 9 },
    { moduleId: "glade-dungeon-rogue-render", version: 7 }
  ]
});
