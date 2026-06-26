import fs from "node:fs";
import path from "node:path";

const dir = new URL(".", import.meta.url).pathname;

function writeJson(name, data) {
  fs.writeFileSync(path.join(dir, name), `${JSON.stringify(data, null, 2)}\n`);
}

const initCode = String.raw`
(function(){
  var w=dimensionContext.width,h=dimensionContext.height;
  var ground=Math.max(64,Math.min(92,h*0.15));
  return Object.assign({}, state, {
    grind:{
      x:w*0.22,y:h-ground-42,vy:0,w:28,h:42,
      frame:0,score:0,cups:0,best:0,speed:4.2,
      started:false,over:false,lastJump:false,lastHelp:false,lastClick:false,
      pulse:0,shake:0,message:'CLICK / SPACE TO START'
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
  var w=dimensionContext.width,h=dimensionContext.height;
  var ground=Math.max(64,Math.min(92,h*0.15));
  var floor=h-ground;
  if(!state.grind){
    state.grind={x:w*0.22,y:floor-42,vy:0,w:28,h:42,frame:0,score:0,cups:0,best:0,speed:4.2,started:false,over:false,message:'CLICK / SPACE TO START'};
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
  var down=!!(k[' ']||k.space||k.arrowup||k.w||click);
  var help=!!k.h;
  if(help&&!g.lastHelp) state.grindHelp=!state.grindHelp;
  if(k.escape) state.grindHelp=false;

  function sound(freq,dur,type,gain){
    try{
      if(typeof window==='undefined') return;
      var ac=window.__gladeCoffeeAudio||(window.__gladeCoffeeAudio=new (window.AudioContext||window.webkitAudioContext)());
      if(ac.state==='suspended') ac.resume();
      var o=ac.createOscillator(), gn=ac.createGain();
      o.type=type||'square';
      o.frequency.value=freq;
      gn.gain.setValueAtTime(gain||0.045,ac.currentTime);
      gn.gain.exponentialRampToValueAtTime(0.0001,ac.currentTime+dur);
      o.connect(gn); gn.connect(ac.destination);
      o.start(); o.stop(ac.currentTime+dur);
    }catch(e){}
  }

  function reset(){
    g.x=w*0.22; g.y=floor-g.h; g.vy=0; g.frame=0; g.score=0; g.cups=0; g.speed=4.2; g.started=true; g.over=false; g.pulse=0; g.shake=0; g.message='';
    state.grindObstacles=[]; state.grindCoffee=[]; state.grindParticles=[];
    sound(440,0.08,'square',0.04); sound(660,0.12,'triangle',0.035);
  }

  if(down&&!g.lastJump){
    if(!g.started||g.over){ reset(); }
    else if(g.y>=floor-g.h-2){ g.vy=-10.4; sound(300,0.07,'square',0.035); }
  }
  g.lastJump=down; g.lastHelp=help;

  if(!g.started||g.over){ state.grind=g; return state; }

  g.frame++;
  g.speed=Math.min(9.5,4.2+g.score*0.025+g.cups*0.015);
  g.vy+=0.62;
  g.y+=g.vy;
  if(g.y>floor-g.h){ g.y=floor-g.h; g.vy=0; }
  if(g.pulse>0) g.pulse*=0.86;
  if(g.shake>0) g.shake*=0.82;

  var labels=['JIRA','MEET','CI','PAGER','MERGE','SCOPE','EMAIL','ONCALL'];
  if(g.frame%78===0){
    var kind=labels[Math.floor(Math.random()*labels.length)];
    var tall=34+Math.random()*34;
    obs.push({x:w+40,y:floor-tall,w:34+Math.random()*26,h:tall,label:kind,hit:false});
  }
  if(g.frame%105===34){
    cups.push({x:w+40,y:floor-94-Math.random()*90,r:12,got:false,bob:Math.random()*6.28});
  }

  for(var i=0;i<obs.length;i++) obs[i].x-=g.speed;
  for(var c=0;c<cups.length;c++){ cups[c].x-=g.speed*1.03; cups[c].bob+=0.1; }
  while(obs.length&&obs[0].x+obs[0].w<-40) obs.shift();
  while(cups.length&&cups[0].x<-40) cups.shift();

  function rects(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
  var player={x:g.x-4,y:g.y,w:g.w+8,h:g.h};
  for(var j=0;j<obs.length;j++){
    var o=obs[j];
    if(!o.hit&&rects(player,o)){
      o.hit=true; g.over=true; g.best=Math.max(g.best,g.score); g.message='PROD INCIDENT'; g.shake=12;
      sound(110,0.18,'sawtooth',0.06);
    }
    if(!o.scored&&o.x+o.w<g.x){o.scored=true; g.score+=5;}
  }
  for(var q=0;q<cups.length;q++){
    var cup=cups[q];
    var dx=(g.x+g.w/2)-cup.x,dy=(g.y+g.h/2)-(cup.y+Math.sin(cup.bob)*5);
    if(!cup.got&&Math.sqrt(dx*dx+dy*dy)<28){
      cup.got=true; g.cups++; g.score+=25; g.pulse=1;
      sound(720,0.06,'triangle',0.045); sound(980,0.08,'sine',0.035);
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
  var c=drawingContext,w=dimensionContext.width,h=dimensionContext.height;
  var g=state.grind||{x:w*.22,y:h*.75,w:28,h:42,score:0,cups:0,started:false,over:false,message:'CLICK / SPACE TO START'};
  var obs=state.grindObstacles||[], cups=state.grindCoffee||[], parts=state.grindParticles||[];
  var ground=Math.max(64,Math.min(92,h*0.15)), floor=h-ground;
  var t=(g.frame||0)/60;
  var shake=g.shake||0;
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

  function roundRect(x,y,rw,rh,rr){c.beginPath();c.moveTo(x+rr,y);c.lineTo(x+rw-rr,y);c.quadraticCurveTo(x+rw,y,x+rw,y+rr);c.lineTo(x+rw,y+rh-rr);c.quadraticCurveTo(x+rw,y+rh,x+rw-rr,y+rh);c.lineTo(x+rr,y+rh);c.quadraticCurveTo(x,y+rh,x,y+rh-rr);c.lineTo(x,y+rr);c.quadraticCurveTo(x,y,x+rr,y);c.closePath();}

  c.textAlign='center'; c.textBaseline='middle';
  for(var i=0;i<obs.length;i++){
    var o=obs[i];
    var grd=c.createLinearGradient(o.x,o.y,o.x,o.y+o.h);
    grd.addColorStop(0,'#ff497f'); grd.addColorStop(1,'#5d1733');
    c.fillStyle=grd; roundRect(o.x,o.y,o.w,o.h,7); c.fill();
    c.strokeStyle='rgba(255,205,225,.75)'; c.lineWidth=2; c.stroke();
    c.fillStyle='rgba(0,0,0,.55)'; roundRect(o.x+5,o.y+7,o.w-10,20,4); c.fill();
    c.fillStyle='#fff5f8'; c.font='10px monospace'; c.fillText(o.label,o.x+o.w/2,o.y+18);
    if(o.label==='CI'){c.fillStyle='#ffec5d'; c.fillRect(o.x+10,o.y+o.h-12,o.w-20,4);}
  }

  for(var j=0;j<cups.length;j++){
    var cup=cups[j], yy=cup.y+Math.sin(cup.bob)*5;
    c.save(); c.translate(cup.x,yy);
    c.fillStyle='rgba(255,220,112,.22)'; c.beginPath(); c.arc(0,0,24,0,Math.PI*2); c.fill();
    c.fillStyle='#f6d06c'; roundRect(-11,-8,20,20,4); c.fill();
    c.strokeStyle='#fff4c2'; c.lineWidth=2; c.stroke();
    c.beginPath(); c.arc(11,1,7,-Math.PI/2,Math.PI/2); c.stroke();
    c.strokeStyle='rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(-4,-16); c.bezierCurveTo(-8,-24,8,-24,4,-32); c.stroke();
    c.restore();
  }

  for(var p=0;p<parts.length;p++){
    var pr=parts[p]; c.globalAlpha=Math.max(0,pr.life/28); c.fillStyle=pr.color; c.fillRect(pr.x,pr.y,3,3); c.globalAlpha=1;
  }

  c.save(); c.translate(g.x,g.y);
  if((g.pulse||0)>0){c.fillStyle='rgba(111,255,224,'+(0.25*g.pulse)+')'; c.beginPath(); c.arc(14,20,42*g.pulse,0,Math.PI*2); c.fill();}
  var run=Math.sin((g.frame||0)*.35);
  c.strokeStyle='#111'; c.lineWidth=5; c.lineCap='round';
  c.beginPath(); c.moveTo(10,40); c.lineTo(6+run*7,52); c.moveTo(18,40); c.lineTo(25-run*7,52); c.stroke();
  c.strokeStyle='#68ffe5'; c.lineWidth=4;
  c.beginPath(); c.moveTo(8,22); c.lineTo(0,31+run*4); c.moveTo(20,22); c.lineTo(31,29-run*4); c.stroke();
  c.fillStyle='#202642'; roundRect(2,12,24,31,7); c.fill();
  c.fillStyle='#6fffe0'; roundRect(5,15,18,14,4); c.fill();
  c.fillStyle='#05070d'; c.font='9px monospace'; c.fillText('</>',14,22);
  c.fillStyle='#ffd28a'; c.beginPath(); c.arc(14,6,10,0,Math.PI*2); c.fill();
  c.fillStyle='#21190d'; c.fillRect(5,-2,18,6);
  c.fillStyle='#fff'; c.beginPath(); c.arc(11,5,2,0,Math.PI*2); c.arc(18,5,2,0,Math.PI*2); c.fill();
  c.restore();

  c.save();
  c.textAlign='left'; c.textBaseline='alphabetic';
  c.fillStyle='rgba(0,0,0,.42)'; roundRect(12,12,244,54,8); c.fill();
  c.fillStyle='#b8fff2'; c.font='15px monospace'; c.fillText('DEV GRIND COFFEE RUN',24,34);
  c.fillStyle='#fff1a8'; c.font='14px monospace'; c.fillText('score '+(g.score||0)+'   coffee '+(g.cups||0)+'   best '+(g.best||0),24,55);
  c.textAlign='right'; c.fillStyle='rgba(255,255,255,.64)'; c.font='12px monospace'; c.fillText('SPACE/CLICK jump  H help',w-18,28);
  c.restore();

  if(!g.started||g.over||state.grindHelp){
    c.save();
    c.fillStyle='rgba(3,5,12,.78)'; c.fillRect(0,0,w,h);
    c.strokeStyle='rgba(112,255,226,.88)'; c.lineWidth=3; roundRect(w*.16,h*.22,w*.68,h*.42,12); c.stroke();
    c.fillStyle='#f7fff9'; c.textAlign='center'; c.font='24px monospace'; c.fillText(g.over?'PROD INCIDENT':'DEV GRIND COFFEE RUN',w/2,h*.30);
    c.font='15px monospace'; c.fillStyle='#b8fff2';
    c.fillText('jump the 9-5 sludge: Jira, meetings, CI, pager duty',w/2,h*.38);
    c.fillText('collect coffee to power up and keep the sprint alive',w/2,h*.43);
    c.fillStyle='#fff1a8'; c.fillText('click / space to '+(g.over?'restart':'start')+' + enable tiny synth bleeps',w/2,h*.51);
    c.fillStyle='rgba(255,255,255,.58)'; c.font='12px monospace'; c.fillText('not a productivity app. absolutely a coping mechanism.',w/2,h*.58);
    c.restore();
  }

  c.restore();
})();
`;

writeJson("init.json", {
  id: "glade-dev-grind-coffee-init",
  name: "Dev Grind Coffee Init",
  description: "Initialize the software engineer coffee runner state",
  phase: "getDefaultState",
  code: initCode.trim()
});

writeJson("update.json", {
  id: "glade-dev-grind-coffee-update",
  name: "Dev Grind Coffee Update",
  description: "Runner controls, collisions, coffee pickups, and click-gated audio bleeps",
  phase: "update",
  code: updateCode.trim()
});

writeJson("render.json", {
  id: "glade-dev-grind-coffee-render",
  name: "Dev Grind Coffee Render",
  description: "Render the cyberpunk office runner game scene",
  phase: "render",
  code: renderCode.trim()
});

writeJson("cart.json", {
  id: "glade-dev-grind-coffee-runner",
  name: "Dev Grind Coffee Runner",
  description: "A playable cyberart runner where a software engineer dodges 9-5 dev obstacles and powers up on coffee. Click or press space to begin.",
  frameRate: 60,
  modules: [
    { moduleId: "glade-dev-grind-coffee-init", version: 1 },
    { moduleId: "glade-dev-grind-coffee-update", version: 1 },
    { moduleId: "glade-dev-grind-coffee-render", version: 1 }
  ]
});

console.log("Wrote dev-grind-coffee-runner cart JSON");
