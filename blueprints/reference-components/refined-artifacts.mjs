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

export function studioCopier(root,{signal}){
  root.innerHTML=`
    <div class="copier-stage"><div class="printer">
      <div class="printer-back"></div><div class="printer-lid"></div>
      <div class="printer-bed"><span>Workshop ticket</span><div class="scan-beam"></div></div>
      <div class="printer-body"><output aria-live="polite">INSERT CARD</output><button type="button" class="print-action" aria-label="Make copy" disabled></button></div>
      <div class="printer-chute"><div class="printer-page" hidden><small>STUDIO • COPY</small><b>Workshop ticket</b><span>Verified print</span></div></div>
    </div><div class="printer-actions"><button type="button">Place workshop ticket</button><button type="button" data-reset>Reset</button></div></div>`;
  const machine=control(root,'.printer'),slide=control(root,'.printer-bed');
  const insert=control(root,'.printer-actions button'),copy=control(root,'.print-action'),status=control(root,'output');
  const ticket=control(root,'.printer-page');
  let cancel,drag;
  function loaded(){if(machine.dataset.mode)return;machine.dataset.mode='ready';status.textContent='READY';copy.disabled=false;}
  listen(insert,'pointerdown',event=>{
    if(event.button!==0||machine.dataset.mode)return;
    drag={x:event.clientX,y:event.clientY};insert.setPointerCapture(event.pointerId);
  },signal);
  listen(insert,'pointermove',event=>{
    if(drag)insert.style.translate=(event.clientX-drag.x)+'px '+(event.clientY-drag.y)+'px';
  },signal);
  listen(insert,'pointerup',event=>{
    if(!drag)return;
    insert.style.translate='';const rect=slide.getBoundingClientRect();
    if(event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom)loaded();
    drag=null;
  },signal);
  listen(insert,'pointercancel',()=>{drag=null;insert.style.translate='';},signal);
  listen(insert,'click',loaded,signal);
  listen(copy,'click',()=>{
    if(machine.dataset.mode!=='ready')return;
    machine.dataset.mode='scan';copy.disabled=true;status.textContent='SCANNING';
    cancel=timer(()=>{
      machine.dataset.mode='print';status.textContent='PRINTING';ticket.hidden=false;
      motion(ticket,[{transform:'translateY(-105%)'},{transform:'translateY(-29%)',offset:.72},{transform:'translateY(0)'}],
        {duration:reduce()?0:860,easing:'linear'},signal);
      cancel=timer(()=>{machine.dataset.mode='complete';status.textContent='COPY READY';},reduce()?0:870,signal);
    },reduce()?140:1100,signal);
  },signal);
  listen(control(root,'[data-reset]'),'click',()=>{
    cancel?.();ticket.getAnimations().forEach(animation=>animation.cancel());delete machine.dataset.mode;status.textContent='INSERT CARD';copy.disabled=true;ticket.hidden=true;
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
    <div class="color-pass"><div class="color-phone">
      <div class="color-island"></div><div class="color-items"><i><b class="pass-bag"></b></i><i><b class="pass-headset"></b></i><i><b class="pass-bottle"></b></i></div>
      <canvas class="color-runner" width="520" height="108" aria-hidden="true"></canvas><output role="status">Ready to restore color</output>
    </div><div class="action-row"><button type="button" data-start>Start color pass</button><button type="button" data-cancel disabled>Cancel</button></div></div>`;
  const phone=control(root,'.color-phone'),tiles=controls(root,'.color-items i'), msg=control(root,'output');
  tiles.forEach((tile,i)=>{
    if(!options.icons?.[i])return;
    const art=new Image();art.src=options.icons[i];art.alt='';tile.dataset.source='';tile.replaceChildren(art);
  });
  const start=control(root,'[data-start]'), stop=control(root,'[data-cancel]');
  const canvas=control(root,'.color-runner'),ctx=canvas.getContext('2d');
  let frame=0;
  function render(progress){
    if(!ctx)return;
    ctx.clearRect(0,0,520,108);
    const stride=progress*14*Math.PI, swing=Math.sin(stride);
    ctx.save();
    ctx.translate(27+progress*466,49+Math.abs(swing)*-5);
    ctx.lineCap='round';ctx.lineJoin='round';
    function stroke(color,width,coords){
      ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;
      coords.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
    }
    function limb(phase,color){
      const stance=Math.cos(phase),lead=Math.sin(phase);
      const knee=[lead*19,35-stance*4],ankle=[lead*33-5,52-Math.max(0,stance)*13];
      stroke(color,10,[[0,13],knee,ankle]);
      stroke('#27535b',7,[ankle,[ankle[0]+10,ankle[1]-1]]);
    }
    limb(stride+Math.PI,'#3a4c56');
    stroke('#cadacf',7,[[0,-12],[swing*12-10,-1],[swing*17+6,-8]]);
    stroke('#2b5660',20,[[0,11],[3,-10]]);
    stroke('#c8e4c9',3,[[-4,5],[5,5]]);
    limb(stride,'#253a43');
    stroke('#b27759',7,[[4,-11],[-swing*13-7,-2],[-swing*13+8,-11]]);
    ctx.fillStyle='#ba8262';ctx.beginPath();ctx.ellipse(10,-25,8.4,10.5,-.28,0,2*Math.PI);ctx.fill();
    stroke('#333333',9,[[3,-30],[9,-34],[16,-31]]);
    stroke('#57997b',3,[[5,-28],[18,-27]]);
    ctx.restore();
  }
  function clear(){cancelAnimationFrame(frame);}
  function done(status){delete phone.dataset.running;ctx?.clearRect(0,0,520,108);msg.textContent=status;start.disabled=false;stop.disabled=true;}
  listen(start,'click',()=>{
    clear();tiles.forEach(el=>el.removeAttribute('data-color'));phone.dataset.running='';start.disabled=true;stop.disabled=false;
    msg.textContent='Restoring color…';
    if(reduce()){
      tiles.forEach(tile=>tile.dataset.color='');done('Color restored');return;
    }
    const began=performance.now(), duration=2280;
    function tick(now){
      if(signal.aborted)return;
      const progress=Math.min(1,(now-began)/duration);
      render(progress);
      tiles.forEach((tile,i)=>tile.toggleAttribute('data-color',progress>=.19+i*.29));
      if(progress>=1)done('Color restored');
      else frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
  },signal);
  listen(stop,'click',()=>{clear();done('Color pass cancelled');},signal);
  signal.addEventListener('abort',clear,{once:true});
}
