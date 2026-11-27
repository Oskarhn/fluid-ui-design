import { control, controls, listen, motion, scope, timer } from './shared.mjs';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v,min,max) => Math.max(min,Math.min(max,v));

export function copyConfirmation(root, { signal, options = {} }) {
  const value = options.value ?? 'con_ij4wyajc4wl9r1x6';
  root.innerHTML = `
    <div class="id-copy">
      <label>⌗ &nbsp; ID</label>
      <button type="button">
        <span class="id-track"><span class="id-value"></span><span class="id-done" aria-hidden="true">Copied!</span></span>
        <span class="id-copy-icon" aria-hidden="true"><i></i><i></i></span>
        <span class="id-check" aria-hidden="true"></span>
      </button>
      <span class="a11y-only" role="status"></span>
    </div>`;
  const button = control(root,'button');
  const text = control(root,'.id-value');
  const status = control(root,'[role=status]');
  button.setAttribute('aria-label','Copy reference ID '+value);
  text.textContent = value;
  let request=0, clear;
  function confirm() {
    button.dataset.copied='';
    status.textContent='Reference ID copied';
    clear?.();
    clear=timer(() => {
      delete button.dataset.copied;
      status.textContent='';
    }, 1650, signal);
  }
  listen(button,'click', async () => {
    const revision=++request;
    try {await navigator.clipboard.writeText(value);}
    catch {
      if (!signal.aborted && revision===request) status.textContent='Clipboard unavailable';
      return;
    }
    if (!signal.aborted && revision===request) confirm();
  }, signal);
}

function paintSpeaker(canvas) {
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  ctx.scale(3,3);ctx.fillStyle='#333735';ctx.strokeStyle='#333735';ctx.lineCap='round';ctx.lineWidth=1.15;
  ctx.beginPath();ctx.moveTo(1.4,6);ctx.lineTo(4.1,6);ctx.lineTo(7.4,3.1);ctx.lineTo(7.4,12.9);ctx.lineTo(4.1,10);ctx.lineTo(1.4,10);ctx.closePath();ctx.fill();
  ctx.beginPath();
  if(canvas.hasAttribute('data-muted')){ctx.moveTo(9,6.1);ctx.lineTo(13,9.9);ctx.moveTo(13,6.1);ctx.lineTo(9,9.9);}
  else for(const radius of [3.7,6]){ctx.moveTo(7+radius*.75,8-radius*.66);ctx.arc(7,8,radius,-.72,.72);}
  ctx.stroke();
}

export function volumeElastic(root, { signal }) {
  const id=scope(root);
  root.innerHTML=`
    <div class="elastic-demo">
      <canvas class="elastic-speaker" width="48" height="48" data-muted aria-hidden="true"></canvas>
      <div class="elastic-track"><canvas aria-hidden="true"></canvas>
        <input id="${id}-volume" type="range" min="0" max="100" value="47" aria-label="Volume">
        <div class="elastic-thumb" aria-hidden="true"><span>47</span></div>
    </div><canvas class="elastic-speaker" width="48" height="48" aria-hidden="true"></canvas>
    </div>`;
  const track=control(root,'.elastic-track');
  const input=control(root,'input');
  const thumb=control(root,'.elastic-thumb');
  const label=control(thumb,'span');
  const canvas=control(track,'canvas'),ctx=canvas.getContext('2d');
  for (const speaker of controls(root,'.elastic-speaker')) paintSpeaker(speaker);
  let frame=0,last=0,current=0,velocity=0,desired=0,gesture=null;
  const split = () => Number(input.value)/100;
  function draw() {
    const w=track.clientWidth,h=track.clientHeight;
    const scale=Math.min(devicePixelRatio,2);
    if (!ctx || !w || !h) return;
    if (canvas.width!==Math.round(w*scale) || canvas.height!==Math.round(h*scale)){
      canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
    }
    const inset=8, x=inset+(w-inset*2)*split(),y=h/2+current;
    thumb.style.left=x+'px';thumb.style.top=y+'px';
    label.textContent=input.value;
    ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,w,h);
    ctx.lineWidth=2.4;ctx.lineCap='round';
    const mid = h/2;
    ctx.beginPath();ctx.strokeStyle='#e39331';ctx.moveTo(inset,mid);
    ctx.bezierCurveTo(x*.44,mid,x-14,y,x,y);ctx.stroke();
    ctx.beginPath();ctx.strokeStyle='#d6dad8';ctx.moveTo(x,y);
    ctx.bezierCurveTo(x+14,y,x+(w-x)*.52,mid,w-inset,mid);ctx.stroke();
    for(let i=0;i<=10;i++){
      const mark=inset+(w-inset*2)*i/10;
      const fall=Math.max(0,1-Math.abs(mark-x)/(w*.24));
      ctx.fillStyle=i/10<=split()?'#d79a55':'#aeb6b0';
      ctx.beginPath();ctx.arc(mark,mid+12+current*fall*.39,i%5===0?1.2:.85,0,Math.PI*2);ctx.fill();
    }
  }
  function tick(now) {
    frame=0;
    const dt=last?Math.min(.03,(now-last)/1000):.016;last=now;
    if(reduce()){current=desired;velocity=0;}
    else {velocity+=(185*(desired-current)-20*velocity)*dt;current+=velocity*dt;}
    draw();
    if (Math.abs(current-desired)>.08||Math.abs(velocity)>.14) run();
    else last=0;
  }
  function run(){if(!frame&&!signal.aborted)frame=requestAnimationFrame(tick);}
  const resize=new ResizeObserver(draw);resize.observe(track);
  listen(input,'input',draw,signal);
  listen(input,'pointerdown',e=>{
    if(e.button!==0||!e.isPrimary)return;
    gesture={id:e.pointerId,origin:e.clientY};
    input.setPointerCapture(e.pointerId);
    track.dataset.active='';
  },signal);
  listen(input,'pointermove',e=>{
    if (gesture?.id!==e.pointerId) return;
    const box=track.getBoundingClientRect();
    const x=clamp((e.clientX-box.left-8)/(box.width-16),0,1);
    input.value=Math.round(x*100);
    desired=clamp((e.clientY-gesture.origin)*.93,-42,42);
    if(!reduce()){current=desired;velocity=0;}
    draw();
  },signal);
  function release(e) {
    if(gesture?.id!==e.pointerId) return;
    gesture=null;desired=0;delete track.dataset.active;run();
  }
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>listen(input,type,release,signal));
  signal.addEventListener('abort',()=>{resize.disconnect();cancelAnimationFrame(frame);},{once:true});
  draw();
}

export function couponDissolve(root, { signal }) {
  root.innerHTML=`
    <div class="coupon-stage">
      <div class="coupon-phone"><div class="coupon-header">Coupons</div><div class="coupon-choices">
        <button type="button" data-rate=".7">MOCHEO <small>70%</small></button>
        <button type="button" data-rate=".45">MOCHEO <small>45%</small></button>
        <button type="button" data-rate=".2">MOCHEO <small>20%</small></button>
      </div>
      <div class="coupon-delivery"><h3>Delivery</h3><small>Home · Studio address</small></div>
      <label class="coupon-row"><input type="radio" name="service" checked> Standard <span>Free</span></label>
      <label class="coupon-row"><input type="radio" name="service" value="express"> Express <span>£12.00</span></label>
      <div class="coupon-total"><div><small>Total</small><output aria-live="polite">£134.00</output><span class="coupon-saving" hidden></span></div><button type="button" class="coupon-reset">Reset</button></div>
      <canvas aria-hidden="true"></canvas></div>
    </div>`;
  const coupons=controls(root,'[data-rate]');
  const phone=control(root,'.coupon-phone');
  const canvas=control(phone,'canvas'),ctx=canvas.getContext('2d');
  const total=control(phone,'output');
  const radio=controls(root,'input');
  let rate=0,frame=0;
  const currency = new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'});
  function update() {
    total.textContent=currency.format(134*(1-rate) + (radio[1].checked?12:0));
    const note=control(phone,'.coupon-saving');
    note.hidden=!rate;
    note.textContent=rate?'MOCHEO · '+currency.format(134*rate)+' saved':'';
  }
  function dissolve(button) {
    cancelAnimationFrame(frame);
    if (reduce()||!ctx){update();return;}
    const rect=phone.getBoundingClientRect(),a=button.getBoundingClientRect(),b=total.getBoundingClientRect();
    const dpr=Math.min(devicePixelRatio,2);
    canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const particles=Array.from({length:145},(_,i)=>({
      x:a.left-rect.left+((i*53)%101)/100*a.width,
      y:a.top-rect.top+((i*29)%61)/60*a.height,
      phase:(i%29)/190, dx:Math.sin(i*2.4)*31, dy:Math.cos(i*3.8)*26
    }));
    const start=performance.now();
    const ends=[b.left-rect.left+b.width/2,b.top-rect.top+b.height/2];
    let applied=false;
    function paint(now) {
      const time=clamp((now-start)/770,0,1);
      ctx.clearRect(0,0,rect.width,rect.height);
      ctx.fillStyle='#e7dbea';
      for (const p of particles) {
        const t=clamp((time-p.phase)/(1-p.phase),0,1);
        const shift=Math.sin(t*Math.PI);
        ctx.globalAlpha=(1-t)*.75;
        const turn=Math.sin(t*7+p.phase*37)*16*shift;
        ctx.fillRect(p.x+(ends[0]-p.x)*t+shift*p.dx+turn,p.y+(ends[1]-p.y)*t+shift*p.dy,1.1,1.1);
      }
      if (!applied&&time>.79){applied=true;update();}
      if (time<1&&!signal.aborted)frame=requestAnimationFrame(paint);
      else ctx.clearRect(0,0,rect.width,rect.height);
    }
    frame=requestAnimationFrame(paint);
  }
  coupons.forEach(button=>listen(button,'click',()=>{
    rate=Number(button.dataset.rate);
    dissolve(button);
    coupons.forEach(item=>{
      item.disabled=true;
      item.classList.toggle('coupon-used',item===button);
    });
  },signal));
  radio.forEach(item=>listen(item,'change',update,signal));
  listen(control(root,'.coupon-reset'),'click',()=>{
    cancelAnimationFrame(frame);ctx?.clearRect(0,0,canvas.width,canvas.height);
    coupons.forEach(item=>{item.disabled=false;item.classList.remove('coupon-used');});
    rate=0;radio[0].checked=true;update();
  },signal);
  signal.addEventListener('abort',()=>cancelAnimationFrame(frame),{once:true});
}

export function circularDownload(root, { signal, options = {} }) {
  root.innerHTML=`
    <div class="download-ring-stage">
      <div class="download-pane">
        <header><div><span data-caption>Restoring</span><small data-count>0 of 2,481 photos</small></div><button type="button" data-minimize aria-label="Minimize restoring progress" aria-expanded="true">↙</button></header>
        <div class="download-dial"><canvas width="320" height="320" aria-hidden="true"></canvas><output role="status">00</output><span class="download-percent" aria-hidden="true">%</span></div>
        <div class="download-details"><div><strong data-bytes>0.0 GB</strong><span>Downloaded</span></div><div><strong data-rate>Idle</strong><span>Speed</span></div><div><strong data-remain>—</strong><span>Remaining</span></div></div>
        <div class="download-actions"><button type="button" data-start>Start</button><button type="button" data-cancel disabled aria-label="Cancel download">Cancel</button></div>
      </div>
    </div>`;
  const stage=control(root,'.download-ring-stage');
  if (options.backplate) stage.style.backgroundImage='url('+JSON.stringify(options.backplate)+')';
  const pane=control(root,'.download-pane'), dial=control(root,'.download-dial');
  const output=control(root,'output'), ctx=control(dial,'canvas').getContext('2d');
  const rate=control(root,'[data-rate]'), bytes=control(root,'[data-bytes]'), remain=control(root,'[data-remain]');
  const caption=control(root,'[data-caption]'), count=control(root,'[data-count]');
  const go=control(root,'[data-start]'), cancel=control(root,'[data-cancel]'), minimize=control(root,'[data-minimize]');
  const duration=5400, capacity=8.7;
  let frame=0,start,progress=0;
  function paint(completed=false){
    if(!ctx)return;
    ctx.clearRect(0,0,320,320);
    for(let i=0;i<120;i++){
      const angle=i/120*Math.PI*2-Math.PI/2;
      const lit=i/120<=progress;
      ctx.fillStyle=lit?'#fff0ce':'#e9cc8561';ctx.beginPath();
      ctx.arc(160+Math.cos(angle)*142,160+Math.sin(angle)*142,lit?2.9:2.55,0,Math.PI*2);
      ctx.fill();
    }
    if(!completed)return;
    const grid=['00000000001','00000000010','00000000100','00000001000','10000010000','01000100000','00101000000','00010000000'];
    ctx.fillStyle='#fff4dc';
    grid.forEach((line,y)=>[...line].forEach((dot,x)=>{
      if(dot!=='1')return;
      ctx.beginPath();ctx.arc(104+x*10,123+y*10,4,0,Math.PI*2);ctx.fill();
    }));
  }
  function status(completed=false,cancelled=false){
    dial.toggleAttribute('data-complete',completed);
    output.textContent=completed?'✓':String(Math.floor(progress*100)).padStart(2,'0');
    bytes.textContent=(capacity*progress).toFixed(1)+' GB';
    rate.textContent=completed||cancelled||!progress?(cancelled?'Cancelled':'Idle'):(95+Math.round(18*Math.sin(progress*14)))+' MB/s';
    remain.textContent=completed?'0:00':cancelled||!progress?'—':'0:'+String(Math.ceil((1-progress)*duration/1000)).padStart(2,'0');
    count.textContent=Math.floor(2481*progress).toLocaleString('en-US')+' of 2,481 photos';
    caption.textContent=completed?'Restore complete':'Restoring';
    paint(completed);
  }
  function end(completed){
    clearTimeout(frame);cancelAnimationFrame(frame);
    progress=completed?1:0;
    go.disabled=false;cancel.disabled=true;go.textContent='Restart';
    status(completed,!completed);
  }
  function tick(time){
    const raw=clamp((time-start)/duration,0,1);
    progress=raw<.86?raw:.86+(1-Math.pow(1-(raw-.86)/.14,2))*.14;
    status();
    if(raw===1)end(true);
    else frame=requestAnimationFrame(tick);
  }
  listen(go,'click',()=>{
    clearTimeout(frame);cancelAnimationFrame(frame);start=performance.now();progress=0;
    go.disabled=true;cancel.disabled=false;status();
    if(reduce())frame=setTimeout(()=>end(true),340);
    else frame=requestAnimationFrame(tick);
  },signal);
  listen(cancel,'click',()=>end(false),signal);
  listen(minimize,'click',()=>{
    const smaller=pane.toggleAttribute('data-minimized');
    minimize.textContent=smaller?'↗':'↙';
    minimize.setAttribute('aria-label',smaller?'Expand restoring progress':'Minimize restoring progress');
    minimize.setAttribute('aria-expanded',String(!smaller));
  },signal);
  signal.addEventListener('abort',()=>{clearTimeout(frame);cancelAnimationFrame(frame);},{once:true});
  status();
}
