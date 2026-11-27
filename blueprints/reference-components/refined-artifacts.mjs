import { control, controls, listen, motion, scope, selectorKeys, timer } from './shared.mjs';

const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease='cubic-bezier(.18,.78,.23,1)';

export function tripCards(root,{signal,options={}}){
  root.innerHTML=`
    <div class="trip-stage"><div class="trip-stack">
      <button type="button" data-flight aria-expanded="false">✈ <b>Flight</b><span>SFO → HND · 11:50</span></button>
      <div class="trip-hero"><div class="trip-date"><small>NOV</small><b>20</b><small>FRI</small></div><h3>Autumn in Japan</h3></div>
      <div class="trip-sheet" hidden></div>
      <button type="button" data-budget aria-expanded="false">▤ <b>Budget</b><span>$3,300 / $3,800</span></button>
      <button type="button" data-stays aria-expanded="false">◫ <b>Stays</b><span>6 nights · 4 hotels</span></button>
      <button type="button" data-route aria-expanded="false">⇄ <b>Route</b><span>Tokyo → Hakone → Kyoto</span></button>
    </div></div>`;
  const stage=control(root,'.trip-stack'), hero=control(root,'.trip-hero'),sheet=control(root,'.trip-sheet');
  if(options.cover)hero.style.backgroundImage='linear-gradient(transparent 46%,#001b32b2),url('+JSON.stringify(options.cover)+')';
  const rows=controls(stage,'button');
  const parts=[
    ['Flight','SFO → HND','San Francisco · 11:50','Tokyo Haneda · 16:10 +1','Direct · 11 h 20 min'],
    ['Budget','Trip budget','Transport · $1,350','Stay · $1,560','Meals · $390'],
    ['Stays','Accommodation','Tokyo · 3 nights','Kyoto · 3 nights','4 hotels'],
    ['Route','Journey','Tokyo · Start','Hakone · Stopover','Kyoto · Final stop']
  ];
  let picked=-1;
  function choose(i){
    const previous=new Map([hero,...rows].map(el=>[el,el.getBoundingClientRect()]));
    picked=picked===i?-1:i;
    rows.forEach((button,index)=>button.setAttribute('aria-expanded',String(index===picked)));
    hero.classList.toggle('trip-slice',picked!==-1);
    stage.toggleAttribute('data-detail',picked!==-1);
    sheet.hidden=picked===-1;
    if(picked>=0){
      const remainder=[...rows].reverse().filter((_,index)=>rows.length-1-index!==picked);
      stage.replaceChildren(...remainder,rows[picked],sheet,hero);
    }else{
      stage.replaceChildren(rows[0],hero,sheet,...rows.slice(1));
    }
    rows[i].focus({preventScroll:true});
    for(const [node,old] of previous){
      node.getAnimations().forEach(animation=>animation.cancel());
      const current=node.getBoundingClientRect(),shift=old.top-current.top;
      if(Math.abs(shift)>1)motion(node,[{translate:'0 '+shift+'px'},{translate:'0 0'}],{duration:550,easing:ease},signal);
    }
    if(picked<0)return;
    sheet.replaceChildren(...parts[picked].map((value,index)=>{
      const node=document.createElement(index===1?'strong':index===0?'small':'p');node.textContent=value;return node;
    }));
    if(picked===0){
      const route=document.createElement('div');route.className='trip-flightpath';route.setAttribute('aria-hidden','true');
      const plane=document.createElement('span');plane.textContent='✈';route.append(plane);sheet.insertBefore(route,sheet.lastElementChild);
      motion(plane,[{transform:'translate(0,13px) rotate(-19deg)'},{transform:'translate(22%,1px) rotate(-10deg)',offset:.25},
        {transform:'translate(43%,-4px) rotate(0)',offset:.5},{transform:'translate(67%,0) rotate(9deg)',offset:.76},
        {transform:'translate(86%,11px) rotate(13deg)'}],{duration:1600,delay:250,easing:'ease-in-out',fill:'both'},signal);
    }
    motion(sheet,[{transform:'translateY(-14px) scale(.92,.65)',opacity:.25,filter:'blur(3px)'},{transform:'none',opacity:1,filter:'none'}],{duration:550,easing:ease},signal);
  }
  rows.forEach((button,i)=>listen(button,'click',()=>choose(i),signal));
  listen(stage,'keydown',e=>{if(e.key==='Escape'&&picked>=0){const old=picked;choose(old);rows[old].focus();}},signal);
}

export function routeCommute(root,{signal}){
  root.innerHTML=`
    <div class="commute-stage"><div class="commute-card"><header><b>Work</b><small>550 Mission St</small></header>
      <div class="commute-choices"><button type="button" aria-pressed="true">▰ Drive</button><button type="button" aria-pressed="false">▣ Transit</button><button type="button" aria-pressed="false">♟ Walk</button><button type="button" aria-pressed="false">◉ Bike</button></div>
      <div class="commute-read"><div><output aria-live="polite">16</output><small>min</small></div><div><small>Arrive</small><b data-arrival>8:56 AM</b></div></div>
      <div class="commute-route" data-route="drive"><i></i></div><p data-directions>via Howard St · 2.8 mi</p>
    </div></div>`;
  const board=control(root,'.commute-card'), buttons=controls(root,'button'),value=control(root,'output'),arrive=control(root,'[data-arrival]');
  const stripe=control(root,'.commute-route'),route=control(root,'[data-directions]');
  const data=[['drive','16','8:56 AM','via Howard St · 2.8 mi'],['transit','21','9:01 AM','BART · 16th St to Montgomery'],
    ['walk','49','9:29 AM','via Valencia St · 2.4 mi'],['bike','15','8:55 AM','Bike lane · 2.3 mi']];
  function select(i){
    const [mode,time,eta,hint]=data[i];
    buttons.forEach((item,p)=>item.setAttribute('aria-pressed',String(p===i)));
    const previous=value.textContent;
    value.replaceChildren();
    const runner=document.createElement('span'),ghost=document.createElement('span');
    runner.className='commute-digit';runner.textContent=time;
    ghost.className='commute-ghost';ghost.setAttribute('aria-hidden','true');ghost.dataset.value=previous;
    value.append(runner,ghost);arrive.textContent=eta;stripe.dataset.route=mode;route.textContent=hint;
    motion(ghost,[{transform:'translateY(0)',opacity:1},{transform:'translateY(-105%)',opacity:0}],{duration:350,fill:'forwards',easing:ease},signal);
    motion(runner,[{transform:'translateY(105%)',opacity:.55},{transform:'none',opacity:1}],{duration:420,easing:ease},signal);
    for(const element of [stripe]){
      for(const animation of element.getAnimations()) animation.cancel();
      motion(element,element===stripe?[{transform:'scaleX(.34)'},{transform:'none'}]:[{transform:'translateY(9px)',opacity:.26},{transform:'none',opacity:1}],
        {duration:390,easing:ease},signal);
    }
  }
  buttons.forEach((button,i)=>listen(button,'click',()=>select(i),signal));
  selectorKeys(board,buttons,select,signal);
}

export function studioCopier(root,{signal,options={}}){
  root.innerHTML=`
    <div class="copier-stage"><div class="printer" data-mode="idle">
      <div class="printer-chute"></div>
      <div class="printer-case">
        <div class="printer-bed"><div class="printer-paper printer-original" aria-hidden="true"></div><div class="scan-beam"></div></div>
        <div class="printer-lid" aria-hidden="true"></div>
        <div class="printer-body"><output aria-live="polite">PLACE ORIGINAL</output><button type="button" class="print-action" aria-label="Make copy" disabled></button></div>
      </div>
      <button type="button" class="printer-paper printer-feed" aria-label="Place workshop ticket"></button>
      <button type="button" class="printer-paper printer-page" aria-label="Take copy" hidden></button>
    </div><div class="printer-actions"><button type="button" data-reset>Reset</button></div></div>`;
  const machine=control(root,'.printer'),bed=control(root,'.printer-bed');
  const feed=control(root,'.printer-feed'),copy=control(root,'.print-action'),status=control(root,'output');
  const original=control(root,'.printer-original'),ticket=control(root,'.printer-page');
  const reset=control(root,'[data-reset]');
  const paperTitle=options.paperTitle??'Studio archive';
  const paperText=options.paperText??'workshop ticket';
  for(const paper of [feed,original,ticket]){
    const label=document.createElement('small'),line=document.createElement('strong');
    label.textContent=paperTitle;line.textContent=paperText;
    paper.append(label,line);
  }
  const phases={idle:'PLACE ORIGINAL',placing:'DROP',ready:'READY',scan:'COPYING',print:'PRINTING',complete:'TAKE COPY',taken:'COPY TAKEN'};
  let cancel,drag,skipClick=false,feedMotion;
  function state(value){
    machine.dataset.mode=value;
    status.textContent=phases[value];
    copy.disabled=value!=='ready';
  }
  function accept() {
    if(!['idle','placing'].includes(machine.dataset.mode))return;
    state('ready');
    feed.hidden=true;
    if(document.activeElement===feed)copy.focus({preventScroll:true});
  }
  function take() {
    if(machine.dataset.mode!=='complete')return;
    state('taken');ticket.blur();
  }
  function dragPaper(paper,area,canPick,acceptDrop,onDrag){
    listen(paper,'pointerdown',event=>{
      if(event.button!==0||!event.isPrimary||!canPick())return;
      skipClick=false;
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,paper,moved:false};
      paper.setPointerCapture(event.pointerId);
    },signal);
    listen(paper,'pointermove',event=>{
      if(drag?.id!==event.pointerId||drag.paper!==paper)return;
      const x=event.clientX-drag.x,y=event.clientY-drag.y;
      if(!drag.moved&&Math.hypot(x,y)<5)return;
      if(!drag.moved){drag.moved=true;paper.setAttribute('data-dragging','');onDrag?.();}
      paper.style.translate=x+'px '+y+'px';
    },signal);
    function finish(event,cancelled){
      if(drag?.id!==event.pointerId||drag.paper!==paper)return;
      const previous=drag;drag=null;
      paper.removeAttribute('data-dragging');
      const from=paper.style.translate;
      paper.style.translate='';
      if(!previous.moved)return;
      skipClick=!cancelled;
      const rect=area.getBoundingClientRect();
      const inside=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;
      if(!cancelled&&acceptDrop(inside))return;
      if(paper===feed)state('idle');
      motion(paper,[{translate:from},{translate:'0 0'}],{duration:320,easing:ease},signal);
    }
    listen(paper,'pointerup',event=>finish(event,false),signal);
    listen(paper,'pointercancel',event=>finish(event,true),signal);
  }
  function handleClick(action){
    return event=>{
      if(skipClick&&event.detail){skipClick=false;return;}
      action();
    };
  }
  dragPaper(feed,bed,()=>machine.dataset.mode==='idle',inside=>{
    if(inside)accept();
    return inside;
  },()=>state('placing'));
  dragPaper(ticket,control(root,'.printer-chute'),()=>machine.dataset.mode==='complete',inside=>{
    if(!inside)take();
    return !inside;
  });
  listen(feed,'click',handleClick(accept),signal);
  listen(ticket,'click',handleClick(take),signal);
  listen(copy,'click',()=>{
    if(machine.dataset.mode!=='ready')return;
    reset.focus({preventScroll:true});
    if(reduce()){
      state('complete');ticket.hidden=false;return;
    }
    state('scan');
    cancel=timer(()=>{
      state('print');ticket.hidden=false;
      feedMotion=motion(ticket,[{translate:'0 -105%'},{translate:'0 -75%',offset:.25},{translate:'0 0'}],
        {duration:1090,easing:'linear'},signal);
      cancel=timer(()=>state('complete'),1100,signal);
    },1380,signal);
  },signal);
  listen(reset,'click',()=>{
    cancel?.();feedMotion?.cancel();ticket.hidden=true;feed.hidden=false;
    if(drag){
      drag.paper.style.translate='';drag.paper.removeAttribute('data-dragging');drag=null;
    }
    skipClick=false;state('idle');
  },signal);
}

export function logoBuild(root,{signal,options={}}){
  root.innerHTML=`
    <div class="brand-intro"><div class="brand-tiles"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="brand-arrival" hidden><div class="brand-photo"></div><nav class="band-nav" aria-label="Artist"><strong data-brand></strong><a href="#album">Music</a><a href="#tour">Tour</a><a href="#film">Videos</a><a href="#presave">Store</a><a href="#presave">Listen</a></nav><div class="band-copy" id="album"><p>The new album. Out 14 November.</p><h3 data-album></h3><p>Ten songs written between midnight and morning, recorded live in one room in Lisbon.</p><button type="button" data-preview>Pre-save</button><button type="button" data-film>Watch the video</button></div><div class="band-tour" hidden><strong>Tour dates</strong><span>Lisbon</span><span>Berlin</span><span>London</span><span>Tokyo</span></div></div>
      <div class="brand-actions"><button type="button" data-start>Play intro</button><button type="button" data-reset disabled>Replay</button></div>
      <output role="status" class="a11y-only">Ready</output>
    </div>`;
  const box=control(root,'.brand-intro'), logo=control(root,'.brand-tiles'),arrival=control(root,'.brand-arrival');
  const play=control(root,'[data-start]'),reset=control(root,'[data-reset]'),msg=control(root,'output');
  if(options.photo)control(root,'.brand-photo').style.backgroundImage='url('+JSON.stringify(options.photo)+')';
  let intro,reel;
  function film(url,container) {
    const video=document.createElement('video');video.src=url;video.loop=true;video.muted=true;video.playsInline=true;
    container.append(video);signal.addEventListener('abort',()=>video.pause(),{once:true});return video;
  }
  if(options.intro){intro=film(options.intro,logo);logo.dataset.film='';}
  if(options.reel)reel=film(options.reel,control(root,'.brand-photo'));
  control(root,'[data-brand]').textContent=options.brandName||'Artist';
  control(root,'[data-album]').textContent=options.albumTitle||'Afterglow';
  const filmButton=control(root,'[data-film]');
  listen(filmButton,'click',async()=>{
    if(!reel){msg.textContent='Video unavailable in this preview';return;}
    if(reel.paused){await reel.play().catch(()=>{});filmButton.textContent='Pause video';}
    else{reel.pause();filmButton.textContent='Watch the video';}
  },signal);
  const save=control(root,'[data-preview]'),tour=control(root,'.band-tour');
  listen(save,'click',()=>{const saved=save.textContent==='Pre-save';save.textContent=saved?'Saved':'Pre-save';msg.textContent=saved?'Saved in preview':'Removed from preview';},signal);
  listen(control(root,'.band-nav'),'click',event=>{
    const link=event.target.closest('a');if(!link)return;
    event.preventDefault();
    if(link.hash==='#tour'){tour.hidden=!tour.hidden;return;}
    if(link.hash==='#film'){filmButton.click();return;}
    if(link.hash==='#presave'){save.focus();return;}
    control(root,'.band-copy h3').scrollIntoView({block:'nearest'});
  },signal);
  let cancel;
  function run(){
    cancel?.();play.disabled=true;reset.disabled=true;arrival.hidden=true;logo.hidden=false;
    box.dataset.running='';msg.textContent='Loading studio';
    reel?.pause();
    if(intro){intro.currentTime=0;intro.play().catch(()=>{});}
    cancel=timer(()=>{
      delete box.dataset.running;logo.hidden=true;arrival.hidden=false;reset.disabled=false;play.disabled=false;
      msg.textContent='Studio ready';
      intro?.pause();
      if(reel&&!reduce())reel.play().then(()=>{filmButton.textContent='Pause video';},()=>{});
    },reduce()?180:intro?3550:1920,signal);
  }
  listen(play,'click',run,signal);listen(reset,'click',run,signal);
}

export function colorPass(root,{signal,options={}}){
  root.innerHTML=`
    <div class="color-pass"><div class="color-scene"><div class="color-phone">
      <header><b>09:41</b><span class="color-island"></span><span aria-hidden="true">◒ ▰</span></header>
      <div class="color-items" aria-hidden="true"><i><b class="pass-bag"></b></i><i><b class="pass-headset"></b></i><i><b class="pass-bottle"></b></i></div>
      <canvas class="color-runner" width="288" height="138" aria-hidden="true"></canvas>
      <div class="color-caption">Preparing your coloring page</div><canvas class="color-wipe" width="288" height="628" aria-hidden="true"></canvas><output role="status" class="a11y-only">Ready to restore color</output>
    </div></div><div class="action-row"><button type="button" data-start>Start color pass</button><button type="button" data-cancel disabled>Cancel</button></div></div>`;
  const phone=control(root,'.color-phone'),tiles=controls(root,'.color-items i'),msg=control(root,'output');
  const start=control(root,'[data-start]'),stop=control(root,'[data-cancel]');
  const canvas=control(root,'.color-runner'),ctx=canvas.getContext('2d');
  const wipe=control(root,'.color-wipe').getContext('2d');
  const artwork=(options.iconSets??[options.icons??[]]).map(set=>set.map(src=>{
    const image=new Image();image.src=src;image.alt='';return image;
  }));
  let frame=0,current=-1;
  function setBatch(index){
    if(current===index)return;
    current=index;
    phone.dataset.batch=String(index+1);
    tiles.forEach((tile,i)=>{
      tile.removeAttribute('data-color');
      const image=artwork[index]?.[i];
      if(image){
        tile.dataset.source='';
        tile.replaceChildren(image);
      }
    });
  }
  function render(progress){
    if(!ctx)return;
    ctx.clearRect(0,0,288,138);
    const stride=progress*16*Math.PI, swing=Math.sin(stride);
    ctx.save();
    ctx.translate(-24+progress*337,46+Math.abs(swing)*13);
    ctx.lineCap='round';ctx.lineJoin='round';
    function stroke(ink,weight,points){
      ctx.beginPath();ctx.lineWidth=weight;ctx.strokeStyle=ink;
      points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
      ctx.stroke();
    }
    const outline='#222727';
    function segment(ink,weight,points){
      stroke(outline,weight+3,points);stroke(ink,weight,points);
    }
    function limb(phase,ink){
      const step=Math.sin(phase),lift=Math.cos(phase);
      const knee=[step*14,28-4*lift],ankle=[step*20-4,43-11*Math.max(0,lift)];
      segment(ink,7,[[0,12],knee,ankle]);
      segment('#f2ead6',6,[ankle,[ankle[0]+8,ankle[1]-1]]);
    }
    function disc(x,y,rx,ry,angle,ink){
      ctx.beginPath();ctx.ellipse(x,y,rx,ry,angle,0,2*Math.PI);
      ctx.fillStyle=ink;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=outline;ctx.stroke();
    }
    limb(stride+Math.PI,'#3d5458');
    segment('#bf8157',5,[[1,-7],[swing*10-7,1],[swing*12+6,-6]]);
    segment('#d7b36c',8,[[-10,-10],[-9,7]]);
    segment('#538477',18,[[0,9],[3,-9]]);
    stroke('#e3d3a2',2,[[-2,3],[8,2]]);
    limb(stride,'#58727b');
    segment('#d79e70',5,[[6,-9],[-swing*11-4,0],[-swing*12+9,-6]]);
    disc(10,-22,8,10,-.22,'#dca97b');
    disc(7,-28,10,6,-.30,'#a5c485');
    stroke('#425849',2,[[1,-25],[10,-27],[17,-27]]);
    stroke(outline,2,[[14,-21],[14,-20]]);
    ctx.restore();
  }
  function paintPage(progress){
    if(!wipe)return;
    wipe.clearRect(0,0,288,628);
    const edge=-102+progress*845;
    wipe.fillStyle='#0860df';
    wipe.beginPath();
    wipe.moveTo(0,0);wipe.lineTo(288,0);wipe.lineTo(288,edge+75);
    wipe.bezierCurveTo(215,edge+65,126,edge+47,83,edge+1);
    wipe.bezierCurveTo(47,edge-26,17,edge-17,0,edge-30);
    wipe.closePath();wipe.fill();
    if(progress===1)return;
    const x=290-progress*237,y=edge+9;
    wipe.save();wipe.translate(x,y);wipe.rotate(-.38);
    wipe.lineWidth=3;wipe.strokeStyle='#222329';
    wipe.fillStyle='#ee5439';wipe.beginPath();wipe.roundRect(-17,-12,34,44,6);wipe.fill();wipe.stroke();
    wipe.fillStyle='#e9e3d6';wipe.beginPath();wipe.roundRect(-13,-25,26,17,[8,8,2,2]);wipe.fill();wipe.stroke();
    wipe.fillStyle='#5a5f60';wipe.fillRect(-5,-27,10,4);
    wipe.restore();
  }
  function done(message){
    cancelAnimationFrame(frame);ctx?.clearRect(0,0,288,138);
    delete phone.dataset.running;delete phone.dataset.wiping;msg.textContent=message;start.disabled=false;stop.disabled=true;
  }
  listen(start,'click',()=>{
    current=-1;setBatch(0);phone.dataset.running='';wipe?.clearRect(0,0,288,628);
    start.disabled=true;stop.disabled=false;msg.textContent='Restoring color…';
    if(reduce()){
      setBatch(artwork.length-1);tiles.forEach(tile=>tile.dataset.color='');paintPage(1);done('Color restored');return;
    }
    const began=performance.now(),travel=3100,interval=4100;
    function run(now){
      const elapsed=now-began;
      const index=Math.min(artwork.length-1,Math.floor(elapsed/interval));
      const fraction=Math.min(1,(elapsed-index*interval)/travel);
      setBatch(index);
      if(fraction<1)render(fraction);else ctx?.clearRect(0,0,288,138);
      tiles.forEach((tile,i)=>tile.toggleAttribute('data-color',fraction>=[.17,.45,.76][i]));
      const paint=Math.max(0,(elapsed-index*interval-travel)/440);
      if(index===artwork.length-1&&paint>0){
        phone.dataset.wiping='';
        paintPage(Math.min(1,paint));
        if(paint>=1){done('Color restored');return;}
      }
      frame=requestAnimationFrame(run);
    }
    frame=requestAnimationFrame(run);
  },signal);
  listen(stop,'click',()=>{wipe?.clearRect(0,0,288,628);done('Color pass cancelled');},signal);
  signal.addEventListener('abort',()=>cancelAnimationFrame(frame),{once:true});
  setBatch(0);
}
