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
      <button type="button" data-stays aria-expanded="false">◫ <b>Stays</b><span>Tokyo · Kyoto</span></button>
    </div></div>`;
  const stage=control(root,'.trip-stack'), hero=control(root,'.trip-hero'),sheet=control(root,'.trip-sheet');
  if(options.cover)hero.style.backgroundImage='linear-gradient(transparent 46%,#001b32b2),url('+JSON.stringify(options.cover)+')';
  const rows=controls(stage,'button');
  const parts=[
    ['Flight','SFO → HND','San Francisco · 11:50','Tokyo Haneda · 16:10 +1','Direct · 11 h 20 min'],
    ['Budget','Trip budget','Transport · $1,350','Stay · $1,560','Meals · $390'],
    ['Stays','Travel plans','Tokyo · 3 nights','Kyoto · 4 nights','Haneda · Return']
  ];
  let picked=-1;
  function choose(i){
    picked=picked===i?-1:i;
    rows.forEach((button,index)=>button.setAttribute('aria-expanded',String(index===picked)));
    hero.classList.toggle('trip-slice',picked!==-1);
    sheet.hidden=picked===-1;
    if(picked<0)return;
    sheet.replaceChildren(...parts[picked].map((value,index)=>{
      const node=document.createElement(index===1?'strong':index===0?'small':'p');node.textContent=value;return node;
    }));
    if(picked===0){
      const route=document.createElement('div');route.className='trip-flightpath';route.setAttribute('aria-hidden','true');
      const plane=document.createElement('span');plane.textContent='✈';route.append(plane);sheet.insertBefore(route,sheet.lastElementChild);
      motion(plane,[{transform:'translate(0,13px) rotate(-19deg)'},{transform:'translate(43%,0)'},{transform:'translate(86%,10px) rotate(10deg)'}],
        {duration:900,easing:'cubic-bezier(.16,.71,.26,1)',fill:'both'},signal);
    }
    motion(sheet,[{transform:'translateY(-10px) scale(.95)',opacity:.3},{transform:'none',opacity:1}],{duration:420,easing:ease},signal);
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
      <div class="printer-bed"><span>workshop ticket</span><div class="scan-beam"></div></div>
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
    machine.dataset.mode='scan';copy.disabled=true;status.textContent='COPYING';
    cancel=timer(()=>{
      machine.dataset.mode='complete';status.textContent='COPY READY';ticket.hidden=false;
      motion(ticket,[{transform:'translateY(-86%)'},{transform:'translateY(0)'}],{duration:620,easing:ease},signal);
    },reduce()?140:940,signal);
  },signal);
  listen(control(root,'[data-reset]'),'click',()=>{
    cancel?.();delete machine.dataset.mode;status.textContent='INSERT CARD';copy.disabled=true;ticket.hidden=true;
  },signal);
}

export function logoBuild(root,{signal,options={}}){
  root.innerHTML=`
    <div class="brand-intro"><div class="brand-tiles"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="brand-arrival" hidden><div><h3>Afterglow</h3><p>Light and movement after dark.</p><button type="button" data-preview>Explore gallery</button><button type="button" data-film>Play film</button></div><div class="brand-photo"></div></div>
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
  const filmButton=control(root,'[data-film]');
  listen(filmButton,'click',async()=>{
    if(!reel){msg.textContent='Opening the studio gallery';arrival.toggleAttribute('data-expanded');return;}
    if(reel.paused){await reel.play().catch(()=>{});filmButton.textContent='Pause film';}
    else{reel.pause();filmButton.textContent='Play film';}
  },signal);
  listen(control(root,'[data-preview]'),'click',()=>{arrival.toggleAttribute('data-expanded');msg.textContent='Gallery preview';},signal);
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
      if(reel&&!reduce()){reel.play().catch(()=>{});filmButton.textContent='Pause film';}
    },reduce()?180:intro?3550:1920,signal);
  }
  listen(play,'click',run,signal);listen(reset,'click',run,signal);
}

export function colorPass(root,{signal,options={}}){
  root.innerHTML=`
    <div class="color-pass"><div class="color-phone">
      <div class="color-island"></div><div class="color-items"><i><b class="pass-bag"></b></i><i><b class="pass-headset"></b></i><i><b class="pass-bottle"></b></i></div>
      <div class="color-runner" aria-hidden="true"><i class="runner-head"></i><b class="runner-body"></b><span class="runner-arm"></span><span class="runner-leg"></span><span class="runner-leg next"></span></div><output role="status">Ready to restore color</output>
    </div><div class="action-row"><button type="button" data-start>Start color pass</button><button type="button" data-cancel disabled>Cancel</button></div></div>`;
  const phone=control(root,'.color-phone'),tiles=controls(root,'.color-items i'), msg=control(root,'output');
  tiles.forEach((tile,i)=>{
    if(!options.icons?.[i])return;
    const art=new Image();art.src=options.icons[i];art.alt='';tile.dataset.source='';tile.replaceChildren(art);
  });
  const start=control(root,'[data-start]'), stop=control(root,'[data-cancel]');
  let timers=[];
  function clear(){timers.forEach(cancel=>cancel());timers=[];}
  function done(status){delete phone.dataset.running;msg.textContent=status;start.disabled=false;stop.disabled=true;}
  listen(start,'click',()=>{
    clear();tiles.forEach(el=>el.removeAttribute('data-color'));phone.dataset.running='';start.disabled=true;stop.disabled=false;
    msg.textContent='Restoring color…';
    tiles.forEach((tile,i)=>timers.push(timer(()=>tile.dataset.color='',reduce()?i*55:430+i*460,signal)));
    timers.push(timer(()=>done('Color restored'),reduce()?225:1840,signal));
  },signal);
  listen(stop,'click',()=>{clear();done('Color pass cancelled');},signal);
}
