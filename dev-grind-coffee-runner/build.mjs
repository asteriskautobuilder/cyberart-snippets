import fs from "node:fs";
import path from "node:path";

const dir = new URL(".", import.meta.url).pathname;

function writeJson(name, data) {
  fs.writeFileSync(path.join(dir, name), `${JSON.stringify(data, null, 2)}\n`);
}

const initCode = String.raw`
(function(){
  var w=960,h=540;
  var ground=88;
  return Object.assign({}, state, {
    grind:{
      x:138,y:h-ground-64,vy:0,w:44,h:64,jumpsLeft:2,
      frame:0,score:0,cups:0,best:0,speed:5.1,nextObstacle:58,nextCoffee:92,
      started:false,over:false,lastJump:false,lastHelp:false,audioReady:false,
      pulse:0,shake:0,message:'CLICK / SPACE TO START',deathReason:''
    },
    grindObstacles:[],
    grindCoffee:[],
    grindParticles:[],
    grindKeys:{},
    grindHelp:false
  });
})();
`;

const updateCode = String.raw`
(function(){
  var w=960,h=540;
  var ground=88;
  var floor=h-ground;
  if(!state.grind){
    state.grind={x:138,y:floor-64,vy:0,w:44,h:64,jumpsLeft:2,frame:0,score:0,cups:0,best:0,speed:5.1,nextObstacle:58,nextCoffee:92,started:false,over:false,message:'CLICK / SPACE TO START',deathReason:''};
  }
  if(!state.grindObstacles) state.grindObstacles=[];
  if(!state.grindCoffee) state.grindCoffee=[];
  if(!state.grindParticles) state.grindParticles=[];
  var g=state.grind, obs=state.grindObstacles, cups=state.grindCoffee, parts=state.grindParticles;

  function pressed(){
    var set={};
    if(keyboardManager&&keyboardManager.getPressedKeys){
      var a=keyboardManager.getPressedKeys();
      for(var i=0;i<a.length;i++) set[String(a[i]).toLowerCase()]=true;
    }
    return set;
  }
  var k=pressed();
  var click=null;
  if(pointerManager&&pointerManager.consumeClick) click=pointerManager.consumeClick();
  var down=!!(k[' ']||k.space||k.arrowup||k.w||k.x||click);
  var help=!!k.h;
  if(help&&!g.lastHelp) state.grindHelp=!state.grindHelp;
  if(k.escape) state.grindHelp=false;

  function sound(freq,dur,type,gain){
    try{
      var root=(typeof window!=='undefined')?window:globalThis;
      var Ctx=root.AudioContext||root.webkitAudioContext;
      if(!Ctx) return;
      var ac=root.__gladeCoffeeAudio||(root.__gladeCoffeeAudio=new Ctx());
      if(ac.state==='suspended') ac.resume();
      var o=ac.createOscillator(), gn=ac.createGain();
      o.type=type||'square';
      o.frequency.value=freq;
      gn.gain.setValueAtTime(gain||0.045,ac.currentTime);
      gn.gain.exponentialRampToValueAtTime(0.0001,ac.currentTime+dur);
      o.connect(gn); gn.connect(ac.destination);
      o.start(); o.stop(ac.currentTime+dur);
      g.audioReady=true;
    }catch(e){}
  }
  function blip(kind){
    if(kind==='start'){ sound(196,0.05,'square',0.05); sound(392,0.08,'triangle',0.045); sound(784,0.11,'sine',0.03); }
    else if(kind==='jump'){ sound(g.jumpsLeft>0?360:280,0.055,'square',0.038); }
    else if(kind==='coffee'){ sound(740,0.05,'triangle',0.05); sound(1180,0.09,'sine',0.04); }
    else if(kind==='hit'){ sound(88,0.22,'sawtooth',0.07); sound(54,0.28,'square',0.035); }
  }

  function reset(){
    g.x=138; g.y=floor-g.h; g.vy=0; g.jumpsLeft=2; g.frame=0; g.score=0; g.cups=0; g.speed=5.1; g.nextObstacle=52; g.nextCoffee=88; g.started=true; g.over=false; g.pulse=0; g.shake=0; g.message=''; g.deathReason='';
    state.grindObstacles=[]; state.grindCoffee=[]; state.grindParticles=[];
    blip('start');
  }

  if(down&&!g.lastJump){
    if(!g.started||g.over){ reset(); }
    else if(g.jumpsLeft>0){
      g.vy=(g.jumpsLeft===2)?-13.6:-11.2;
      g.jumpsLeft--;
      g.pulse=Math.max(g.pulse,.45);
      blip('jump');
      for(var jp=0;jp<7;jp++) parts.push({x:g.x+g.w*.35,y:g.y+g.h,vx:-3+Math.random()*2,vy:1+Math.random()*2,life:18,color:g.jumpsLeft?'#6fffe0':'#fff1a8'});
    }
  }
  g.lastJump=down; g.lastHelp=help;

  if(!g.started||g.over){ state.grind=g; return state; }

  g.frame++;
  g.speed=Math.min(9.5,4.2+g.score*0.025+g.cups*0.015);
  g.vy+=0.62;
  g.y+=g.vy;
  if(g.y>floor-g.h){ g.y=floor-g.h; g.vy=0; g.jumpsLeft=2; }
  if(g.pulse>0) g.pulse*=0.86;
  if(g.shake>0) g.shake*=0.82;

  var specs=[
    {label:'JIRA',type:'box',w:48,h:46},
    {label:'MEET',type:'tower',w:54,h:58},
    {label:'CI',type:'low',w:78,h:30},
    {label:'PAGER',type:'float',w:46,h:42,y:floor-132},
    {label:'MERGE',type:'gate',w:58,h:72},
    {label:'EMAIL',type:'stack',w:42,h:86},
    {label:'SCOPE',type:'wide',w:96,h:38},
    {label:'ONCALL',type:'tower',w:60,h:64}
  ];
  g.nextObstacle--;
  if(g.nextObstacle<=0){
    var s=specs[Math.floor(Math.random()*specs.length)];
    var oy=s.y||floor-s.h;
    obs.push({x:w+70,y:oy,w:s.w,h:s.h,label:s.label,type:s.type,hit:false});
    g.nextObstacle=74+Math.floor(Math.random()*38)-Math.min(18,Math.floor(g.score/45));
  }
  g.nextCoffee--;
  if(g.nextCoffee<=0){
    var lanes=[floor-70,floor-112,floor-154,floor-196];
    var lane=lanes[Math.floor(Math.random()*lanes.length)];
    cups.push({x:w+74,y:lane,r:18,got:false,bob:Math.random()*6.28});
    g.nextCoffee=84+Math.floor(Math.random()*62);
  }

  for(var i=0;i<obs.length;i++) obs[i].x-=g.speed;
  for(var c=0;c<cups.length;c++){ cups[c].x-=g.speed*1.03; cups[c].bob+=0.1; }
  while(obs.length&&obs[0].x+obs[0].w<-40) obs.shift();
  while(cups.length&&cups[0].x<-40) cups.shift();

  function rects(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
  var player={x:g.x+7,y:g.y+5,w:g.w-13,h:g.h-8};
  for(var j=0;j<obs.length;j++){
    var o=obs[j];
    if(!o.hit&&rects(player,o)){
      o.hit=true; g.over=true; g.best=Math.max(g.best,g.score); g.message='PROD INCIDENT'; g.deathReason=o.label+' got you'; g.shake=10;
      blip('hit');
    }
    if(!o.scored&&o.x+o.w<g.x){o.scored=true; g.score+=5;}
  }
  for(var q=0;q<cups.length;q++){
    var cup=cups[q];
    var dx=(g.x+g.w/2)-cup.x,dy=(g.y+g.h/2)-(cup.y+Math.sin(cup.bob)*5);
    if(!cup.got&&Math.sqrt(dx*dx+dy*dy)<44){
      cup.got=true; g.cups++; g.score+=25; g.pulse=1;
      blip('coffee');
      for(var p=0;p<9;p++) parts.push({x:cup.x,y:cup.y,vx:-2+Math.random()*4,vy:-3+Math.random()*2,life:28,color:p%2?'#f8d27a':'#6fffe0'});
    }
  }
  for(var m=cups.length-1;m>=0;m--) if(cups[m].got) cups.splice(m,1);
  for(var n=0;n<parts.length;n++){ parts[n].x+=parts[n].vx; parts[n].y+=parts[n].vy; parts[n].vy+=0.12; parts[n].life--; }
  for(var r=parts.length-1;r>=0;r--) if(parts[r].life<=0) parts.splice(r,1);

  state.grind=g; state.grindObstacles=obs; state.grindCoffee=cups; state.grindParticles=parts;
  return state;
})();
`;

const renderCode = String.raw`
(function(){
  var c=drawingContext,cw=dimensionContext.width,ch=dimensionContext.height;
  var w=960,h=540;
  var scale=Math.min(cw/w,ch/h);
  var ox=(cw-w*scale)/2,oy=(ch-h*scale)/2;
  var g=state.grind||{x:138,y:388,w:44,h:64,score:0,cups:0,started:false,over:false,message:'CLICK / SPACE TO START'};
  var obs=state.grindObstacles||[], cups=state.grindCoffee||[], parts=state.grindParticles||[];
  var ground=88, floor=h-ground;
  var t=(g.frame||0)/60;
  var shake=g.shake||0;
  c.save();
  c.fillStyle='#050914'; c.fillRect(0,0,cw,ch);
  c.translate(ox,oy); c.scale(scale,scale);

  function roundRect(x,y,rw,rh,rr){c.beginPath();c.moveTo(x+rr,y);c.lineTo(x+rw-rr,y);c.quadraticCurveTo(x+rw,y,x+rw,y+rr);c.lineTo(x+rw,y+rh-rr);c.quadraticCurveTo(x+rw,y+rh,x+rw-rr,y+rh);c.lineTo(x+rr,y+rh);c.quadraticCurveTo(x,y+rh,x,y+rh-rr);c.lineTo(x,y+rr);c.quadraticCurveTo(x,y,x+rr,y);c.closePath();}

  function drawWorld(){
  c.save();
  if(shake>0) c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);

  var bg=c.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,'#10152f'); bg.addColorStop(.45,'#16214a'); bg.addColorStop(1,'#07101d');
  c.fillStyle=bg; c.fillRect(0,0,w,h);

  c.save();
  c.globalAlpha=.34;
  for(var gx=-(t*36%80);gx<w;gx+=80){
    c.strokeStyle='rgba(98,255,220,.26)'; c.lineWidth=1;
    c.beginPath(); c.moveTo(gx,0); c.lineTo(gx-120,h); c.stroke();
  }
  for(var gy=80;gy<floor;gy+=42){
    c.strokeStyle='rgba(255,110,220,.12)'; c.beginPath(); c.moveTo(0,gy); c.lineTo(w,gy+Math.sin(t+gy)*8); c.stroke();
  }
  c.restore();

  for(var b=0;b<14;b++){
    var x=(b*113-(t*28*(b%3+1))%(w+120))-60;
    var y=floor-40-(b%5)*34;
    c.fillStyle='rgba(20,28,55,.65)';
    c.fillRect(x,y,48+((b*17)%50),floor-y);
    c.fillStyle='rgba(113,255,222,.16)';
    for(var wx=8;wx<46;wx+=14) for(var wy=8;wy<floor-y-8;wy+=18) if((wx+wy+b)%3===0)c.fillRect(x+wx,y+wy,5,7);
  }

  c.fillStyle='#131313'; c.fillRect(0,floor,w,ground);
  c.fillStyle='rgba(78,255,218,.9)'; c.fillRect(0,floor,w,3);
  c.strokeStyle='rgba(255,255,255,.10)';
  for(var lx=-(t*240%60);lx<w;lx+=60){ c.beginPath(); c.moveTo(lx,floor+20); c.lineTo(lx+28,floor+20); c.stroke(); }

  c.textAlign='center'; c.textBaseline='middle';
  for(var i=0;i<obs.length;i++){
    var o=obs[i];
    var grd=c.createLinearGradient(o.x,o.y,o.x,o.y+o.h);
    grd.addColorStop(0,'#ff497f'); grd.addColorStop(1,'#5d1733');
    c.fillStyle=grd; roundRect(o.x,o.y,o.w,o.h,7); c.fill();
    c.strokeStyle='rgba(255,205,225,.75)'; c.lineWidth=2; c.stroke();
    c.fillStyle='rgba(0,0,0,.55)'; roundRect(o.x+5,o.y+7,o.w-10,20,4); c.fill();
    c.fillStyle='#fff5f8'; c.font='13px monospace'; c.fillText(o.label,o.x+o.w/2,o.y+18);
    if(o.type==='low'){c.fillStyle='#ffec5d'; c.fillRect(o.x+10,o.y+o.h-11,o.w-20,4);}
    if(o.type==='float'){c.strokeStyle='rgba(255,241,168,.35)'; c.beginPath(); c.moveTo(o.x+o.w/2,o.y+o.h); c.lineTo(o.x+o.w/2,floor); c.stroke();}
  }

  for(var j=0;j<cups.length;j++){
    var cup=cups[j], yy=cup.y+Math.sin(cup.bob)*5;
    c.save(); c.translate(cup.x,yy);
    c.fillStyle='rgba(255,220,112,.25)'; c.beginPath(); c.arc(0,0,32,0,Math.PI*2); c.fill();
    c.fillStyle='#f6d06c'; roundRect(-15,-12,27,27,6); c.fill();
    c.strokeStyle='#fff4c2'; c.lineWidth=2; c.stroke();
    c.beginPath(); c.arc(14,1,9,-Math.PI/2,Math.PI/2); c.stroke();
    c.strokeStyle='rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(-5,-20); c.bezierCurveTo(-10,-30,10,-30,5,-42); c.stroke();
    c.restore();
  }

  for(var p=0;p<parts.length;p++){
    var pr=parts[p]; c.globalAlpha=Math.max(0,pr.life/28); c.fillStyle=pr.color; c.fillRect(pr.x,pr.y,3,3); c.globalAlpha=1;
  }

  c.save(); c.translate(g.x,g.y);
  if((g.pulse||0)>0){c.fillStyle='rgba(111,255,224,'+(0.25*g.pulse)+')'; c.beginPath(); c.arc(14,20,42*g.pulse,0,Math.PI*2); c.fill();}
  var run=Math.sin((g.frame||0)*.35);
  c.strokeStyle='#111'; c.lineWidth=5; c.lineCap='round';
  c.beginPath(); c.moveTo(16,48); c.lineTo(6+run*10,66); c.moveTo(30,48); c.lineTo(43-run*10,66); c.stroke();
  c.strokeStyle='#68ffe5'; c.lineWidth=4;
  c.beginPath(); c.moveTo(13,26); c.lineTo(0,39+run*5); c.moveTo(31,26); c.lineTo(49,36-run*5); c.stroke();
  c.fillStyle='#202642'; roundRect(4,15,36,42,9); c.fill();
  c.fillStyle='#6fffe0'; roundRect(8,20,28,19,5); c.fill();
  c.fillStyle='#05070d'; c.font='13px monospace'; c.fillText('</>',22,30);
  c.fillStyle='#ffd28a'; c.beginPath(); c.arc(22,7,14,0,Math.PI*2); c.fill();
  c.fillStyle='#21190d'; c.fillRect(9,-3,26,8);
  c.fillStyle='#fff'; c.beginPath(); c.arc(17,7,2.7,0,Math.PI*2); c.arc(27,7,2.7,0,Math.PI*2); c.fill();
  c.fillStyle='rgba(255,241,168,.9)';
  for(var jmp=0;jmp<(g.jumpsLeft||0);jmp++){ c.fillRect(8+jmp*14,62,10,4); }
  c.restore();
  c.restore();
  }

  drawWorld();

  c.save();
  c.save();
  c.textAlign='left'; c.textBaseline='alphabetic';
  c.fillStyle='rgba(0,0,0,.54)'; roundRect(16,14,348,66,8); c.fill();
  c.fillStyle='#b8fff2'; c.font='20px monospace'; c.fillText('DEV GRIND COFFEE RUN V2',30,42);
  c.fillStyle='#fff1a8'; c.font='17px monospace'; c.fillText('score '+(g.score||0)+'   coffee '+(g.cups||0)+'   best '+(g.best||0),30,67);
  c.textAlign='right'; c.fillStyle='rgba(255,255,255,.74)'; c.font='15px monospace'; c.fillText('SPACE/CLICK jump + double jump   H help',w-20,34);
  c.fillStyle=(g.audioReady?'#6fffe0':'#ffec8b'); c.font='13px monospace'; c.fillText(g.audioReady?'audio armed':'click once for audio',w-20,58);
  c.restore();

  if(!g.started||g.over||state.grindHelp){
    c.save();
    c.fillStyle='rgba(3,5,12,.78)'; c.fillRect(0,0,w,h);
    c.fillStyle='rgba(8,16,34,.96)'; roundRect(w*.16,h*.17,w*.68,h*.54,14); c.fill();
    c.strokeStyle='rgba(112,255,226,.88)'; c.lineWidth=3; roundRect(w*.16,h*.17,w*.68,h*.54,14); c.stroke();
    c.fillStyle='#f7fff9'; c.textAlign='center'; c.font='24px monospace'; c.fillText(g.over?'PROD INCIDENT':'DEV GRIND COFFEE RUN',w/2,h*.30);
    c.font='15px monospace'; c.fillStyle='#b8fff2';
    c.fillText('jump and double-jump the 9-5 sludge',w/2,h*.38);
    c.fillText('coffee lanes are reachable now. allegedly.',w/2,h*.43);
    if(g.over&&g.deathReason){ c.fillStyle='#ffb1ca'; c.fillText(g.deathReason,w/2,h*.49); }
    c.fillStyle='#fff1a8'; c.fillText('click / space to '+(g.over?'restart':'start')+' + enable synth bleeps',w/2,h*.56);
    c.fillStyle='rgba(255,255,255,.68)'; c.font='12px monospace'; c.fillText('two jump pips under the engineer show remaining jumps',w/2,h*.64);
    c.restore();
  }

  c.restore();
  c.restore();
})();
`;

writeJson("init.json", {
  id: "glade-dev-grind-coffee-init",
  name: "Dev Grind Coffee Init V2",
  description: "Initialize the larger double-jump software engineer coffee runner state",
  phase: "getDefaultState",
  code: initCode.trim()
});

writeJson("update.json", {
  id: "glade-dev-grind-coffee-update",
  name: "Dev Grind Coffee Update V2",
  description: "Double-jump controls, friendlier collisions, reachable coffee, and click-gated audio bleeps",
  phase: "update",
  code: updateCode.trim()
});

writeJson("render.json", {
  id: "glade-dev-grind-coffee-render",
  name: "Dev Grind Coffee Render V2",
  description: "Render the scaled cyberpunk office runner game scene with stable HUD",
  phase: "render",
  code: renderCode.trim()
});

writeJson("cart.json", {
  id: "glade-dev-grind-coffee-runner-v2",
  name: "Dev Grind Coffee Runner V2",
  description: "A playable cyberart runner where a software engineer dodges 9-5 dev obstacles, double-jumps, and powers up on reachable coffee. Click or press space to begin.",
  frameRate: 60,
  modules: [
    { moduleId: "glade-dev-grind-coffee-init", version: 2 },
    { moduleId: "glade-dev-grind-coffee-update", version: 2 },
    { moduleId: "glade-dev-grind-coffee-render", version: 2 }
  ]
});

console.log("Wrote dev-grind-coffee-runner cart JSON");
