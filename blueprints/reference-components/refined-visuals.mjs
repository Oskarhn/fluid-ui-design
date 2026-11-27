import { control, controls, listen, motion, timer, scope } from './shared.mjs';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v,min,max) => Math.min(max,Math.max(min,v));

function lensPoster(image) {
  const board=document.createElement('canvas');
  board.width=1536;board.height=1472;
  const ctx=board.getContext('2d');
  ctx.scale(2,2);
  ctx.fillStyle='#f4f3f2';ctx.fillRect(0,0,768,736);
  const palette=[['#06121d','#215c9c','#d99868'],['#141828','#6b4bd8','#da95c8'],
    ['#09162d','#2f90da','#e5c29d'],['#111a1c','#ca4631','#f1b298'],['#050d2c','#153e9f','#dee4db']];
  const x1=54,y1=32,w=128,h=151;
  for(let n=0;n<20;n++) {
    const x=x1+n%5*132,y=y1+Math.floor(n/5)*169;
    ctx.fillStyle='#faf7f2';ctx.beginPath();ctx.roundRect(x,y,w,h,9);ctx.fill();
    const colors=palette[(n+Math.floor(n/5))%5];
    const gradient=ctx.createLinearGradient(x,y,x+w,y+96);
    colors.forEach((color,i)=>gradient.addColorStop(i*.5,color));
    ctx.save();ctx.beginPath();
    if ([2,3,4,15,16,17].includes(n))ctx.ellipse(x+w/2,y+51,58,48,0,0,Math.PI*2);
    else ctx.roundRect(x,y,w,108,7);
    ctx.clip();ctx.fillStyle=gradient;ctx.fillRect(x,y,w,112);
    if(image) {
      const sample=(n*3)%5;
      ctx.drawImage(image,151+sample*115,95+(Math.floor(n/5)%4)*149,96,64,x,y,w,109);
    }
    ctx.fillStyle='#ffffffde';ctx.font='10px Arial';ctx.fillText('Obscura',x+8,y+17);ctx.restore();
    ctx.fillStyle='#43423e';ctx.font='8px Arial';ctx.fillText(['Chromatic study','Incident light','Color field','Optical surface','Reflected tone'][n%5],x+8,y+126);
  }
  return board;
}

export function glassLens(root,{signal,options={}}) {
  root.innerHTML=`<div class="lens-study"><div class="lens-stage"><canvas tabindex="0" aria-label="Move the glass lens with the pointer or arrow keys"></canvas></div>
  <div class="lens-controls"><button type="button">Center lens</button><button type="button" data-lens aria-pressed="true">Refraction</button><output role="status">Lens centered</output></div></div>`;
  const view=control(root,'canvas'), stage=control(root,'.lens-stage');
  const gl=view.getContext('webgl',{antialias:false,alpha:false});
  const toggle=control(root,'[data-lens]'), msg=control(root,'output');
  let poster=lensPoster(), center=[.5,.5], on=true, render;
  if(gl) {
    const shader=(type,source)=>{
      const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    const vs=shader(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec2 uv; void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}');
    const fs=shader(gl.FRAGMENT_SHADER,`
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D picture;
      uniform vec2 center;
      uniform float aspect;
      uniform float active;
      void main(){
        vec2 point=vec2(uv.x,1.-uv.y);
        vec2 d=(point-center)*vec2(aspect,1.);
        float r=length(d)/.44;
        float inside=(1.-smoothstep(.996,1.003,r))*active;
        float curvature=(1.-r*r)*.15*inside;
        float rim=smoothstep(.78,.996,r)*inside;
        vec2 ref=center+(point-center)*(1.-curvature+rim*.026);
        vec2 gap=(point-center)*(.008+rim*.032)*inside;
        vec3 col=vec3(texture2D(picture,ref+gap).r,texture2D(picture,ref).g,texture2D(picture,ref-gap).b);
        float sheen=(.46+.32*sin(atan(d.y,d.x)*2.0))*rim;
        col=mix(col,vec3(.95,.98,1.),sheen*.26);
        col-=rim*.075;
        gl_FragColor=vec4(col,1.);
      }`);
    const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.useProgram(program);
    const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const uniforms=Object.fromEntries(['center','aspect','active'].map(key=>[key,gl.getUniformLocation(program,key)]));
    let uploaded;
    render=()=>{
      if(signal.aborted)return;
      const dpr=Math.min(2.5,Math.max(1.5,devicePixelRatio)),w=Math.round(stage.clientWidth*dpr),h=Math.round(stage.clientHeight*dpr);
      if(!w||!h)return;
      if(view.width!==w||view.height!==h){view.width=w;view.height=h;}
      gl.viewport(0,0,w,h);
      if(uploaded!==poster){ gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,poster);uploaded=poster; }
      gl.uniform2fv(uniforms.center,center);gl.uniform1f(uniforms.aspect,w/h);
      gl.uniform1f(uniforms.active,on?1:0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    };
    signal.addEventListener('abort',()=>{gl.deleteTexture(texture);gl.deleteBuffer(buf);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);},{once:true});
  } else {
    const ctx=view.getContext('2d');
    render=()=>{
      if(!ctx)return;
      view.width=stage.clientWidth;view.height=stage.clientHeight;
      ctx.drawImage(poster,0,0,view.width,view.height);
      if(!on)return;
      const x=center[0]*view.width,y=center[1]*view.height;
      ctx.save();ctx.beginPath();ctx.arc(x,y,view.height*.41,0,Math.PI*2);ctx.clip();
      ctx.translate(x,y);ctx.scale(1.12,1.12);ctx.translate(-x,-y);
      ctx.drawImage(poster,0,0,view.width,view.height);ctx.restore();
    };
  }
  if(options.swatchPhoto){
    const image=new Image();image.src=options.swatchPhoto;
    image.decode().then(()=>{if(!signal.aborted){poster=lensPoster(image);render();}}).catch(()=>{});
  }
  function move(x,y){center=[clamp(x,.05,.95),clamp(y,.06,.94)];render();}
  listen(view,'pointermove',e=>{
    if(e.pointerType==='touch'&&!e.buttons)return;
    const b=view.getBoundingClientRect();move((e.clientX-b.left)/b.width,(e.clientY-b.top)/b.height);
  },signal);
  listen(view,'keydown',e=>{
    const dir={ArrowLeft:[-.05,0],ArrowRight:[.05,0],ArrowUp:[0,-.05],ArrowDown:[0,.05]}[e.key];
    if(dir){e.preventDefault();move(center[0]+dir[0],center[1]+dir[1]);}
  },signal);
  listen(control(root,'button'),'click',()=>{move(.5,.5);msg.textContent='Lens centered';},signal);
  listen(toggle,'click',()=>{on=!on;toggle.setAttribute('aria-pressed',String(on));msg.textContent=on?'Refraction active':'Flat board';render();},signal);
  const ro=new ResizeObserver(render);ro.observe(stage);
  signal.addEventListener('abort',()=>ro.disconnect(),{once:true});
  render();
}

export function movingIconCopy(root,{signal}) {
  root.innerHTML=`
    <div class="icon-copy-stage"><div class="icon-palette" data-selected="0">
      <div class="icon-sheen" aria-hidden="true"></div>
      <button type="button" aria-pressed="true" aria-label="Symbol A">✳</button>
      <button type="button" aria-pressed="false" aria-label="Symbol B">◈</button>
      <button type="button" aria-pressed="false" aria-label="Symbol C">◎</button>
      <button type="button" class="icon-copy-button">Copy</button>
    </div><output role="status" class="a11y-only"></output></div>`;
  const shell=control(root,'.icon-palette'),keys=controls(root,'[aria-pressed]');
  const copy=control(root,'.icon-copy-button'),status=control(root,'output');
  let selected=0, reset, revision=0;
  keys.forEach((button,i)=>{
    function focus(){shell.style.setProperty('--icon-position',i);}
    listen(button,'pointerenter',focus,signal);listen(button,'focus',focus,signal);
    listen(button,'pointerleave',()=>shell.style.setProperty('--icon-position',selected),signal);
    listen(button,'click',()=>{
      selected=i; focus();
      keys.forEach((entry,j)=>entry.setAttribute('aria-pressed',String(i===j)));
      wave(button);
      writeIcon();
    },signal);
  });
  function wave(key){
    if(reduce())return;
    const box=shell.getBoundingClientRect(),origin=key.getBoundingClientRect();
    for(let ring=0;ring<3;ring++){
      const pulse=document.createElement('i');pulse.className='icon-copy-wave';pulse.setAttribute('aria-hidden','true');
      pulse.style.left=(origin.left-box.left+origin.width/2)+'px';
      pulse.style.top=(origin.top-box.top+origin.height/2)+'px';
      shell.append(pulse);
      const travel=pulse.animate([{transform:'scale(.65)',opacity:.8},{transform:'scale(2.5)',opacity:0}],
        {delay:ring*64,duration:480,easing:'cubic-bezier(.18,.75,.31,1)',fill:'both'});
      travel.finished.then(()=>pulse.remove(),()=>pulse.remove());
    }
  }
  async function writeIcon(){
    const operation=++revision;
    try{await navigator.clipboard.writeText(keys[selected].textContent);}
    catch{if(!signal.aborted)status.textContent='Clipboard unavailable';return;}
    if(signal.aborted||operation!==revision)return;
    shell.dataset.confirmed='';copy.textContent='Copied';status.textContent='Symbol copied';
    reset?.();
    reset=timer(()=>{delete shell.dataset.confirmed;copy.textContent='Copy';status.textContent='';},1200,signal);
  }
  listen(copy,'click',writeIcon,signal);
}

export function standingSkyline(root,{signal}) {
  root.innerHTML=`<div class="calendar-stage"><div class="calendar-board">
    <header><div><b data-total></b><span>guests seated, Oct 2025 – Oct 2026</span></div>
    <div class="calendar-modes"><button type="button" aria-pressed="true">The book</button><button type="button" aria-pressed="false">Skyline</button></div></header>
    <div class="calendar-totals"></div>
    <canvas aria-label="Sample restaurant activity across a year" role="img"></canvas>
    <footer><span>Closed</span><span>Under 80</span><span>80–119</span><span>120–169</span><span>170+</span></footer>
    <output class="a11y-only" role="status">Calendar grid</output>
  </div></div>`;
  const canvas=control(root,'canvas'),ctx=canvas.getContext('2d');
  const modes=controls(root,'button'),status=control(root,'output');
  const months=['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct'];
  const dates=Array.from({length:364},(_,day)=>{
    const weekday=day%7,week=Math.floor(day/7);
    if(weekday===0||(weekday===1&&week<15))return 0;
    if(weekday===6)return 134+(week%2?18:-18);
    if(weekday===5&&week%9===0)return week===0?184:171+week%11;
    return Math.round(55+(Math.sin(day*1.27)+1)*19+(day*17%61)*.47);
  });
  const total=dates.reduce((a,b)=>a+b,0);
  let adjust=28875-total;
  for(let i=0;adjust!==0;i=(i+1)%dates.length){
    if(i%7===6||dates[i]<35||dates[i]>=164)continue;
    const step=Math.sign(adjust);dates[i]+=step;adjust-=step;
  }
  const number=v=>v.toLocaleString('en-US');
  control(root,'[data-total]').textContent=number(dates.reduce((a,b)=>a+b,0));
  const saturday=dates.filter((_,day)=>day%7===6);
  const stats=[['Nights open',dates.filter(Boolean).length],['Biggest night',Math.max(...dates)],['Full-house nights',dates.filter(n=>n>=170).length],
    ['Average Saturday',Math.round(saturday.reduce((a,b)=>a+b,0)/saturday.length)]];
  stats.forEach(([label,value])=>{
    const div=document.createElement('div'), caption=document.createElement('span'),heading=document.createElement('strong');
    caption.textContent=label;heading.textContent=number(value);div.append(caption,heading);control(root,'.calendar-totals').append(div);
  });
  let animated=0,from=0,target=0,frame=0,start=0;
  const colors=[['#edf3ef','#d8e3dc','#cbdcd2'],['#c2dacb','#9dbda7','#8eaf99'],['#8ebba4','#65a586','#5b9277'],['#5daf8c','#258765','#297651'],['#f08a63','#d85f41','#a24430']];
  function draw() {
    if(!ctx)return;
    const w=canvas.clientWidth,h=canvas.clientHeight,s=Math.min(devicePixelRatio,2);
    if(!w||!h)return;
    if(canvas.width!==Math.round(w*s)||canvas.height!==Math.round(h*s)){canvas.width=Math.round(w*s);canvas.height=Math.round(h*s);}
    ctx.setTransform(s,0,0,s,0,0);ctx.clearRect(0,0,w,h);
    const blend=animated,dx=w/60;
    const mix=(a,b)=>a+(b-a)*blend;
    function polygon(points,color){ctx.beginPath();points.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
    for(let row=6;row>=0;row--){
      for(let week=0;week<52;week++){
        const i=week*7+row,v=dates[i];
        const group=v>=170?4:v>=120?3:v>=80?2:v?1:0;
        const p=colors[group];
        const x=mix(w*.055+week*dx,w*.062+week*w/61+row*w/166),y=mix(h*.28+row*dx,h*.51+week*h*.0068-row*h*.021);
        const offsetX=mix(0,w/163),offsetY=mix(dx-1,-h*.024);
        const x2=x+mix(dx-1,w/63),y2=y+mix(0,h*.0086);
        const up=blend*(v?Math.max(2,v/192*h*.35):0);
        const top=[[x,y-up],[x2,y2-up],[x2+offsetX,y2+offsetY-up],[x+offsetX,y+offsetY-up]];
        if(up>.2){
          polygon([top[0],top[1],[x2,y2],[x,y]],p[1]);
          polygon([top[1],top[2],[x2+offsetX,y2+offsetY],[x2,y2]],p[2]);
        }
        polygon(top,p[0]);
      }
    }
    ctx.fillStyle='#68756e';ctx.font='10px system-ui';
    months.forEach((m,i)=>{if(i%2===0||w>565)ctx.fillText(m,w*.055+i*w*.071,mix(h*.28+dx*7+15,h*.61+i*h*.023));});
  }
  function tick(now) {
    const time=reduce()?1:clamp((now-start)/1160,0,1);
    animated=from+(target-from)*(.5-.5*Math.cos(Math.PI*time));
    draw();if(time<1&&!signal.aborted)frame=requestAnimationFrame(tick);
  }
  modes.forEach((button,i)=>listen(button,'click',()=>{
    cancelAnimationFrame(frame);from=animated;target=i;start=performance.now();
    modes.forEach((m,j)=>m.setAttribute('aria-pressed',String(i===j)));
    status.textContent=i?'Activity skyline':'Calendar grid';
    frame=requestAnimationFrame(tick);
  },signal));
  const resize=new ResizeObserver(draw);resize.observe(canvas);draw();
  signal.addEventListener('abort',()=>{resize.disconnect();cancelAnimationFrame(frame);},{once:true});
}
