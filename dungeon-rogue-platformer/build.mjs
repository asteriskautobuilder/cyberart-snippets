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
      atkTimer:0,invuln:0,onGround:false,shake:0,message:'Choose a class',
      className:'',weaponName:'',weaponTier:1,weaponKind:'',weaponRange:52,
      stats:{attack:1,defense:1,dexterity:1,intelligence:1,wisdom:1,luck:1,hp:1},
      buffs:{},last:{},audioReady:false,musicTick:0,musicStep:0
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
    {name:'Warrior',color:'#e85d75',hp:132,stats:{attack:3,defense:3,dexterity:1,intelligence:0,wisdom:1,luck:1,hp:3},weapons:[['Iron Cleaver','melee',58,16,28],['Bulwark Axe','melee',48,22,38]]},
    {name:'Mage',color:'#8f7bff',hp:82,stats:{attack:1,defense:0,dexterity:1,intelligence:4,wisdom:3,luck:1,hp:0},weapons:[['Ember Wand','magic',260,12,24],['Frost Sigil','magic',220,10,18]]},
    {name:'Archer',color:'#6ce89a',hp:96,stats:{attack:2,defense:1,dexterity:4,intelligence:0,wisdom:1,luck:2,hp:1},weapons:[['Yew Bow','arrow',300,11,18],['Twin Knives','melee',45,9,14]]},
    {name:'Monk',color:'#f0d36b',hp:108,stats:{attack:2,defense:2,dexterity:3,intelligence:0,wisdom:4,luck:1,hp:2},weapons:[['Prayer Staff','melee',66,13,22],['Chi Palm','magic',190,9,16]]}
  ];
  var stats=['attack','defense','dexterity','intelligence','wisdom','luck','hp'];
  var powerDefs=[
    ['heart','HP +35','#ff5577'],['shield','invincible','#9ee8ff'],['haste','speed','#fff06a'],['spring','jump','#7dff9e'],['fury','attack','#ff8a4c'],
    ['focus','fast attacks','#b58cff'],['tome','bonus xp','#f5e1a1'],['clover','luck','#55ffa9'],['clock','slow foes','#76d7ff'],['bomb','nova','#ffce48'],
    ['magnet','magnet','#f7a8ff'],['vamp','lifesteal','#d24dff'],['regen','regen','#77ffbe'],['armor','defense','#b6c5d6'],['lantern','reveal','#ffd87a']
  ];
  var floorNames=['Crypt of Rust','Fungal Aqueduct','Ashen Library','Clockwork Catacomb','Obsidian Choir'];
  function keyName(v){if(v==null)return '';if(typeof v==='object')v=v.key||v.code||v.name||v.value||'';return String(v).toLowerCase().replace(/^key/,'').replace(/^arrow/,'arrow').replace(/[^a-z0-9 ]/g,'');}
  function markKey(o,key){if(!key)return;o[key]=true;if(key==='arrowleft'||key==='left')o.left=true;if(key==='arrowright'||key==='right')o.right=true;if(key==='arrowup'||key==='up')o.up=true;if(key==='arrowdown'||key==='down')o.down=true;if(key===' '||key==='space'||key==='spacebar')o.space=true;if(key==='enter'||key==='return')o.enter=true;}
  function kset(){var o={};try{var km=keyboardManager;if(!km)return o;var lists=[];if(km.getPressedKeys)lists.push(km.getPressedKeys());if(km.getKeysDown)lists.push(km.getKeysDown());if(km.pressedKeys)lists.push(km.pressedKeys);if(km.keysDown)lists.push(km.keysDown);if(km.keys)lists.push(km.keys);for(var l=0;l<lists.length;l++){var a=lists[l]||[];if(!Array.isArray(a)&&typeof a==='object')a=Object.keys(a).filter(function(k){return !!lists[l][k];});for(var i=0;i<a.length;i++)markKey(o,keyName(a[i]));}var names=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Up','Down','Left','Right','w','a','s','d','j','x','z','Enter','Return','Space',' '];for(var n=0;n<names.length;n++){var raw=names[n],down=false;if(km.isKeyDown)down=down||!!km.isKeyDown(raw);if(km.isPressed)down=down||!!km.isPressed(raw);if(km.isKeyPressed)down=down||!!km.isKeyPressed(raw);if(km.getKey)down=down||!!km.getKey(raw);if(down)markKey(o,keyName(raw));}}catch(e){}return o;}
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
      down=!!(pointerManager.isDown||pointerManager.pointerDown||pointerManager.down||pointerManager.pressed||(p&&(p.isDown||p.down||p.pressed)));
      if(pointerManager.isPointerDown) down=!!pointerManager.isPointerDown();
      if(pointerManager.isPressed) down=!!pointerManager.isPressed();
      return down?normPoint(p):null;
    }catch(e){return null;}}
  var k=kset(),click=normPoint(pointerManager&&pointerManager.consumeClick?pointerManager.consumeClick():null),held=heldPointer(),controlPoint=held||click;
  function hitPt(pt,rx,ry,rw,rh){return pt&&pt.x>=rx&&pt.x<=rx+rw&&pt.y>=ry&&pt.y<=ry+rh;}
  function hit(rx,ry,rw,rh){return hitPt(click,rx,ry,rw,rh);}
  var left=!!(k.arrowleft||k.left||k.a||hitPt(controlPoint,0,H-140,150,140));
  var right=!!(k.arrowright||k.right||k.d||hitPt(controlPoint,150,H-140,170,140));
  var jump=!!(k[' ']||k.space||k.spacebar||k.arrowup||k.up||k.w||hitPt(controlPoint,W-320,H-140,150,140));
  var attack=!!(k.j||k.x||k.z||k.enter||hitPt(controlPoint,W-160,H-140,160,140));
  var up=!!(k.arrowup||k.up||k.w),down=!!(k.arrowdown||k.down||k.s),confirm=!!(k.enter||k.return||k[' ']||k.space||k.spacebar),back=!!(k.escape||k.esc);

  function snd(freq,dur,type,gain){try{var root=(typeof window!=='undefined')?window:globalThis,Ctx=root.AudioContext||root.webkitAudioContext;if(!Ctx)return;var ac=root.__drpAudio||(root.__drpAudio=new Ctx());if(ac.state==='suspended')ac.resume();var o=ac.createOscillator(),gn=ac.createGain();o.type=type||'square';o.frequency.value=freq;gn.gain.setValueAtTime(gain||0.035,ac.currentTime);gn.gain.exponentialRampToValueAtTime(0.0001,ac.currentTime+dur);o.connect(gn);gn.connect(ac.destination);o.start();o.stop(ac.currentTime+dur);g.audioReady=true;}catch(e){}}
  function sfx(n){if(n==='hit'){snd(92,.16,'sawtooth',.06);snd(54,.22,'square',.03);}else if(n==='atk'){snd(220,.05,'square',.035);snd(440,.05,'triangle',.02);}else if(n==='drop'){snd(620,.06,'triangle',.035);snd(920,.08,'sine',.025);}else if(n==='level'){snd(330,.07,'square',.04);snd(660,.1,'triangle',.04);snd(990,.12,'sine',.025);}else if(n==='select'){snd(300,.04,'square',.025);}else if(n==='boss'){snd(80,.26,'sawtooth',.08);}}
  function music(){if(!g.audioReady||g.screen!=='play')return;g.musicTick--;if(g.musicTick>0)return;g.musicTick=12;var bass=[55,55,82,65,55,98,82,65],lead=[220,247,196,165,220,294,247,196];var step=g.musicStep++%8;snd(bass[step],.08,'square',.018);if(step%2===0)snd(lead[step],.055,'triangle',.012);}
  function rnd(a,b){return a+Math.random()*(b-a);}
  function rect(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
  function puff(x,y,col,n){for(var i=0;i<(n||8);i++)parts.push({x:x,y:y,vx:rnd(-2.8,2.8),vy:rnd(-4,1.5),life:24+Math.random()*18,c:col||'#fff'});}
  function applyClass(){var c=classes[g.classIndex],w=c.weapons[g.weaponIndex];g.className=c.name;g.weaponName=w[0];g.weaponKind=w[1];g.weaponRange=w[2];g.stats={};for(var key in c.stats)g.stats[key]=c.stats[key];g.maxHp=c.hp+g.stats.hp*8;g.hp=g.maxHp;g.weaponTier=1;g.xp=0;g.nextXp=35;g.statPoints=0;}
  function levelLength(){return 2600+g.level*360;}
  function makeLevel(){
    en.length=0;pr.length=0;drops.length=0;parts.length=0;plats.length=0;haz.length=0;
    g.worldX=80;g.cameraX=0;g.y=FLOOR-g.hei;g.vy=0;g.hp=Math.min(g.maxHp,g.hp+24+g.stats.wisdom*3);g.invuln=260;g.grace=260;g.buffs={};g.message=floorNames[g.level-1]||'Deep Floor';
    var len=levelLength();
    for(var x=420;x<len-260;x+=280+Math.floor(Math.random()*150)){
      var y=350-Math.floor(Math.random()*115),ww=110+Math.floor(Math.random()*100);
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
  function start(){g.classIndex=Math.max(0,Math.min(classes.length-1,g.classIndex|0));g.weaponIndex=Math.max(0,Math.min(1,g.weaponIndex|0));applyClass();g.level=1;g.screen='play';g.dead=false;g.won=false;g.last={};makeLevel();sfx('select');}
  function chooseMenu(max){if(up&&!g.last.up){g.menuIndex=(g.menuIndex+max-1)%max;sfx('select');}if(down&&!g.last.down){g.menuIndex=(g.menuIndex+1)%max;sfx('select');}}
  function clickedClass(){if(!click)return -1;for(var i=0;i<classes.length;i++){var y=206+i*48;if(hit(150,y-26,660,36))return i;}return -1;}
  function clickedWeapon(){if(!click)return -1;for(var i=0;i<2;i++){var y=250+i*58;if(hit(250,y-31,460,42))return i;}return -1;}
  function clickedStat(){if(!click)return -1;for(var i=0;i<stats.length;i++){var y=170+i*38;if(hit(236,y-24,488,30))return i;}return -1;}

  g.frame++; music();
  for(var bn in g.buffs){if(g.buffs[bn]>0)g.buffs[bn]--;else delete g.buffs[bn];}
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
  if(jump&&!g.last.jump&&g.onGround){g.vy=-jumpPow;g.onGround=false;snd(250,.05,'square',.025);}
  g.vy+=GRAV; g.y+=g.vy; g.onGround=false;
  if(g.y+g.hei>=FLOOR){g.y=FLOOR-g.hei;g.vy=0;g.onGround=true;}
  for(var p=0;p<plats.length;p++){var pl=plats[p];if(g.vy>=0&&g.worldX+g.wid>pl.x&&g.worldX<pl.x+pl.w&&g.y+g.hei>pl.y&&g.y+g.hei<pl.y+24){g.y=pl.y-g.hei;g.vy=0;g.onGround=true;}}
  g.cameraX=Math.max(g.cameraX,Math.min(g.worldX-210,levelLength()-W+70));
  if(left||right||jump||attack)g.grace=Math.min(g.grace||0,90);
  if(g.grace>0)g.grace--;
  if(g.invuln>0)g.invuln--; if(g.shake>0)g.shake*=.84;
  if(g.atkTimer>0)g.atkTimer--;
  if(attack&&!g.last.attack&&g.atkTimer<=0){
    var cls=classes[g.classIndex],wp=cls.weapons[g.weaponIndex],cool=Math.max(12,wp[4]-g.stats.dexterity*1.5-(g.buffs.focus?7:0));
    g.atkTimer=cool;sfx('atk');
    var dmg=wp[3]+g.weaponTier*4+g.stats.attack*3+Math.floor(g.stats.intelligence*(g.weaponKind==='magic'?3:0));
    if(g.buffs.fury)dmg+=9;
    if(Math.random()<.05+g.stats.luck*.018){dmg*=2;puff(g.worldX+g.wid/2,g.y+20,'#fff06a',10);}
    if(g.weaponKind==='melee'){pr.push({team:'p',kind:'slash',x:g.worldX+(g.face>0?g.wid:-g.weaponRange),y:g.y+10,w:g.weaponRange,h:38,life:8,dmg:dmg,dir:g.face});}
    else{pr.push({team:'p',kind:g.weaponKind,x:g.worldX+g.wid/2,y:g.y+20,w:14,h:8,vx:g.face*(g.weaponKind==='arrow'?9:7),vy:0,life:70,dmg:dmg,dir:g.face});}
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
      for(var ei=0;ei<en.length;ei++){var ee=en[ei];if(ee.dead||ee.gate)continue;if(rect(a,ee)){ee.hp-=a.dmg;puff(ee.x+ee.w/2,ee.y+20,'#ffe07a',5);if(g.buffs.vamp)g.hp=Math.min(g.maxHp,g.hp+2);if(a.kind!=='slash')a.life=0;if(ee.hp<=0){ee.dead=true;dropAt(ee.x,ee.y,ee);puff(ee.x+ee.w/2,ee.y+ee.h/2,ee.boss?'#f0d36b':'#ba8cff',20);if(ee.boss){g.screen='win';g.message='The Obsidian Choir goes quiet.';}}}}
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
    var themes=[['#111528','#1b1d35','#5c2c33'],['#081b17','#12372e','#284a38'],['#171222','#34223a','#7d4f3f'],['#10151e','#2d3141','#4e6073'],['#090711','#20112c','#5d1742']];
    var th=themes[(g.level||1)-1]||themes[0],bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,th[0]);bg.addColorStop(.5,th[1]);bg.addColorStop(1,th[2]);c.fillStyle=bg;c.fillRect(0,0,W,H);
    var cam=g.cameraX||0;c.save();c.translate(-(cam*.25%260),0);for(var i=-1;i<6;i++){c.fillStyle='rgba(0,0,0,.22)';c.fillRect(i*260,155+(i%2)*28,110,315);c.fillStyle='rgba(132,255,223,.08)';for(var wy=178;wy<420;wy+=32)c.fillRect(i*260+28,wy,9,14);}c.restore();
    c.save();c.translate(-cam,0);c.fillStyle='#181018';c.fillRect(cam,FLOOR,W+40,H-FLOOR);c.strokeStyle='rgba(255,255,255,.14)';for(var x=Math.floor(cam/48)*48;x<cam+W+60;x+=48){c.beginPath();c.moveTo(x,FLOOR+16);c.lineTo(x+28,FLOOR+16);c.stroke();}
    for(var p=0;p<plats.length;p++){var pl=plats[p];c.fillStyle='rgba(52,42,59,.95)';rr(pl.x,pl.y,pl.w,pl.h,4);c.fill();c.fillStyle='rgba(139,255,224,.25)';c.fillRect(pl.x,pl.y,pl.w,3);}
    for(var h=0;h<haz.length;h++){var hz=haz[h];c.fillStyle='#5b1022';c.fillRect(hz.x,hz.y+10,hz.w,10);c.fillStyle='#e9d5a3';for(var sx=0;sx<hz.w;sx+=13){c.beginPath();c.moveTo(hz.x+sx,hz.y+10);c.lineTo(hz.x+sx+7,hz.y-12);c.lineTo(hz.x+sx+14,hz.y+10);c.fill();}}
    c.restore();
  }
  function drawEnemy(e){
    if(e.dead)return;var x=e.x-(g.cameraX||0),y=e.y;c.save();c.translate(x,y);var col={rat:'#8b6b5c',slime:'#55cc77',bat:'#6f68b8',skel:'#d9d2bd',cult:'#a65dff',archer:'#67d48a',knight:'#b7beca',wisp:'#79ddff',boss:'#ff4f9c'}[e.type]||'#fff';
    c.fillStyle=col;if(e.type==='boss'){rr(0,0,e.w,e.h,16);c.fill();c.fillStyle='#090711';c.fillRect(18,26,18,16);c.fillRect(60,26,18,16);c.fillStyle='#f6d06c';c.fillRect(22,76,52,9);}
    else if(e.type==='bat'){c.beginPath();c.moveTo(0,16);c.lineTo(18,0);c.lineTo(34,16);c.lineTo(18,28);c.fill();}
    else if(e.type==='slime'||e.type==='wisp'){c.beginPath();c.ellipse(e.w/2,e.h/2,e.w/2,e.h/2,0,0,Math.PI*2);c.fill();}
    else{rr(0,0,e.w,e.h,7);c.fill();c.fillStyle='rgba(0,0,0,.45)';c.fillRect(7,12,e.w-14,9);}
    c.fillStyle='rgba(0,0,0,.65)';c.fillRect(0,-9,e.w,5);c.fillStyle='#ff607e';c.fillRect(0,-9,e.w*Math.max(0,e.hp/e.max),5);c.restore();
  }
  function drawPlayer(){
    var x=g.worldX-(g.cameraX||0),y=g.y,cls=classes[g.classIndex]||classes[0];c.save();c.translate(x,y);if(g.invuln>0&&Math.floor(g.frame/5)%2===0)c.globalAlpha=.45;
    c.fillStyle=cls.color;rr(0,10,g.wid||34,g.hei-8,8);c.fill();c.fillStyle='#f6d2a2';c.beginPath();c.arc(17,8,12,0,Math.PI*2);c.fill();c.fillStyle='#10121f';c.fillRect(7,2,20,6);c.fillStyle='#fff';c.fillRect(12,8,4,3);c.fillRect(22,8,4,3);
    c.strokeStyle='#e8f8ff';c.lineWidth=4;c.lineCap='round';var f=g.face||1;c.beginPath();c.moveTo(17,32);c.lineTo(17+f*28,24);c.stroke();c.strokeStyle='#1b1028';c.beginPath();c.moveTo(10,52);c.lineTo(3,66);c.moveTo(24,52);c.lineTo(34,66);c.stroke();c.restore();
  }
  function drawWorld(){
    c.save();if(g.shake>0)c.translate((Math.random()-.5)*g.shake,(Math.random()-.5)*g.shake);background();
    c.save();c.translate(-(g.cameraX||0),0);
    for(var i=0;i<drops.length;i++){var d=drops[i];c.save();c.translate(d.x,d.y);c.fillStyle=d.color||'#fff';c.beginPath();c.arc(12,12,13,0,Math.PI*2);c.fill();c.fillStyle='#07101d';c.font='9px monospace';c.textAlign='center';c.fillText(d.kind==='xp'?'XP':d.kind==='weapon'?'W':d.kind==='upgrade'?'+':'*',12,15);c.restore();}
    for(var q=0;q<pr.length;q++){var a=pr[q];c.fillStyle=a.team==='p'?'#fff06a':'#ff5577';if(a.kind==='slash'){c.globalAlpha=.45;c.fillRect(a.x,a.y,a.w,a.h);c.globalAlpha=1;}else{rr(a.x,a.y,a.w,a.h,5);c.fill();}}
    for(var r=0;r<parts.length;r++){var p=parts[r];c.globalAlpha=Math.max(0,p.life/40);c.fillStyle=p.c;c.fillRect(p.x,p.y,3,3);c.globalAlpha=1;}
    c.restore();for(var e=0;e<en.length;e++)drawEnemy(en[e]);drawPlayer();c.restore();
  }
  function hud(){panel(14,12,320,70);txt('DUNGEON RELIC ROGUE',28,36,17,'#dffdf5');txt((levelNames[(g.level||1)-1]||'Dungeon')+'  '+g.level+'/'+g.maxLevel,28,60,12,'#f0d36b');panel(350,12,250,70);var hpw=132;c.fillStyle='rgba(0,0,0,.55)';c.fillRect(368,24,hpw,10);c.fillStyle='#ff5577';c.fillRect(368,24,hpw*Math.max(0,g.hp/g.maxHp),10);txt('HP '+Math.ceil(g.hp)+'/'+g.maxHp,512,34,10,'#ffdce3');var xpPct=g.xp/g.nextXp;c.fillStyle='rgba(0,0,0,.55)';c.fillRect(368,46,hpw,8);c.fillStyle='#8ef7ff';c.fillRect(368,46,hpw*Math.min(1,xpPct),8);txt('XP '+g.xp+'/'+g.nextXp,512,55,10,'#c8fbff');txt((g.className||'')+' / '+(g.weaponName||''),368,72,10,'#fff');panel(632,12,314,70);txt('MOVE  A/D or ARROWS',650,34,10,'#d9e8ff');txt('JUMP  W/SPACE/UP',650,52,10,'#d9e8ff');txt('ATTACK  J/X/Z or CLICK',650,70,10,'#d9e8ff');if(g.grace>0)txt('SAFE '+Math.ceil(g.grace/60),W/2,112,15,'#8ef7ff','center');txt(g.audioReady?'audio armed':'audio arms on attack',W-20,104,9,g.audioReady?'#8ef7ff':'#ffd87a','right');}
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
  id: "glade-dungeon-relic-rogue-v5",
  name: "Dungeon Relic Rogue V5",
  description: "A first-interaction stability pass for the NES-flavored roguelike platformer: robust keyboard menu input, wrapped class-select text, normalized pointer input, safe starts, cleaner HUD, reliable class/weapon selection, five dungeon floors, XP/stat leveling, class drops, powerups, and the Obsidian Choir boss.",
  frameRate: 60,
  modules: [
    { moduleId: "glade-dungeon-rogue-init", version: 3 },
    { moduleId: "glade-dungeon-rogue-update", version: 5 },
    { moduleId: "glade-dungeon-rogue-render", version: 4 }
  ]
});
