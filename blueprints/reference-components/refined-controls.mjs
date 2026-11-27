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

export function volumeElastic(root, { signal }) {
  const id=scope(root);
  root.innerHTML=`
    <div class="elastic-demo">
      <span class="elastic-muted" aria-hidden="true">◖×</span>
      <div class="elastic-track"><canvas aria-hidden="true"></canvas>
        <input id="${id}-volume" type="range" min="0" max="100" value="47" aria-label="Volume">
        <div class="elastic-thumb" aria-hidden="true"><span>47</span></div>
      </div><span class="elastic-max" aria-hidden="true">◖))</span>
    </div>`;
  const track=control(root,'.elastic-track');
  const input=control(root,'input');
  const thumb=control(root,'.elastic-thumb');
  const label=control(thumb,'span');
  const canvas=control(root,'canvas'),ctx=canvas.getContext('2d');
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
    desired=clamp((e.clientY-gesture.origin)*.72,-30,30);
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
      <div class="coupon-total"><div><small>Total</small><output aria-live="polite">£134.00</output></div><button type="button" class="coupon-reset">Reset</button></div>
      <canvas aria-hidden="true"></canvas></div>
    </div>`;
  const coupons=controls(root,'[data-rate]');
  const phone=control(root,'.coupon-phone');
  const canvas=control(phone,'canvas'),ctx=canvas.getContext('2d');
  const total=control(phone,'output');
  const radio=controls(root,'input');
  let rate=0,frame=0;
  const currency = new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'});
  function update() {total.textContent=currency.format(134*(1-rate) + (radio[1].checked?12:0));}
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
        ctx.fillRect(p.x+(ends[0]-p.x)*t+shift*p.dx,p.y+(ends[1]-p.y)*t+shift*p.dy,1.3,1.3);
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
        <header><span>Download</span><button type="button" data-cancel disabled aria-label="Cancel download">×</button></header>
        <div class="download-dial"><div class="download-rim"></div><output role="status">00</output></div>
        <div class="download-details"><span>STUDIO FILE</span><span data-rate>Ready</span><span>18.7 MB</span></div>
        <button type="button" data-start>Start</button>
      </div>
    </div>`;
  const stage=control(root,'.download-ring-stage');
  if (options.backplate) stage.style.backgroundImage='url('+JSON.stringify(options.backplate)+')';
  const dial=control(root,'.download-dial'), output=control(root,'output');
  const rate=control(root,'[data-rate]');
  const go=control(root,'[data-start]'), cancel=control(root,'[data-cancel]');
  let frame=0, start;
  const duration=4400;
  function end(completed) {
    cancelAnimationFrame(frame);
    go.disabled=false;cancel.disabled=true;
    output.textContent=completed?'✓':'00';
    rate.textContent=completed?'Complete':'Cancelled';
    go.textContent='Restart';
    if(!completed)dial.style.setProperty('--travel','0%');
  }
  function tick(time) {
    const raw=clamp((time-start)/duration,0,1);
    const progress=raw<.85?raw:.85+(1-Math.pow(1-(raw-.85)/.15,2))*.15;
    dial.style.setProperty('--travel',100*progress+'%');
    const value=String(Math.floor(progress*100)).padStart(2,'0');
    if(output.textContent!==value)output.textContent=value;
    if(raw===1)end(true);
    else frame=requestAnimationFrame(tick);
  }
  listen(go,'click',()=>{
    cancelAnimationFrame(frame);start=performance.now();
    go.disabled=true;cancel.disabled=false;
    output.textContent='00';rate.textContent='Downloading';
    dial.style.setProperty('--travel','0%');
    if (reduce()) frame=setTimeout(()=>{dial.style.setProperty('--travel','100%');end(true);},340);
    else frame=requestAnimationFrame(tick);
  },signal);
  listen(cancel,'click',()=>{clearTimeout(frame);end(false);},signal);
  signal.addEventListener('abort',()=>{clearTimeout(frame);cancelAnimationFrame(frame);},{once:true});
}
