import { control, controls, listen, motion, scope, timer } from './shared.mjs';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v,min,max) => Math.min(max,Math.max(min,v));

export function caffeineCurve(root,{signal}) {
  root.innerHTML=`
    <div class="curve-stage"><header><b>CAFFEINE</b><small>Estimated active dose · sample</small></header>
      <div class="curve-area"><canvas aria-hidden="true"></canvas><output aria-live="polite"></output><input type="range" min="0" max="100" value="15" aria-label="Scrub caffeine curve"></div>
      <div class="dose-row"><button type="button" aria-pressed="true">08:00</button><button type="button" aria-pressed="false">10:30</button><button type="button" aria-pressed="false">13:10</button></div>
      <div class="curve-footer">TOTAL DOSE <span>252 mg</span></div>
    </div>`;
  const c=control(root,'canvas'),ctx=c.getContext('2d');
  const note=control(root,'output');
  const scrub=control(root,'input');
  const buttons=controls(root,'button');
  const times=[.15,.35,.58], amounts=[65,82,105];
  let selected=0,sweep=times[0],target=sweep,frame=0;
  function signalAt(t,i) {
    const distance=t-times[i];
    return distance<0 ? 0 : (1-Math.exp(-distance*125))*Math.exp(-distance*4.6)*amounts[i];
  }
  function render() {
    if(!ctx)return;
    const w=c.clientWidth,h=c.clientHeight,dpr=Math.min(devicePixelRatio,2);
    if(!w||!h)return;
    if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const inset=w*.05,width=w*.89,baseline=h*.88,height=h*.65;
    const positions = Array.from({length:133},(_,k)=>{
      const t=k/132;
      const sum=times.reduce((acc,_,i)=>acc+signalAt(t,i),0);
      return {x:inset+t*width, y:baseline-sum/188*height,t};
    });
    ctx.strokeStyle='#27282a';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(inset,baseline);ctx.lineTo(w*.94,baseline);ctx.stroke();
    // Parallel traces give the sampled curve the short, layered depth seen in the recording.
    for(let depth=25;depth>=0;depth--){
      const section=depth/25;
      ctx.fillStyle='rgba(171,179,188,'+(.72*(1-section)) + ')';
      const pixel=Math.max(1,w/290);
      positions.forEach(({x,y},k)=>{
        if ((k+depth*3)%4===0) return;
        ctx.fillRect(Math.round((x-depth*.61)/pixel)*pixel,Math.round((y+depth*.63)/pixel)*pixel,pixel,pixel);
      });
    }
    for(const {x,y,t} of positions) {
      const strength=Math.max(0,1-Math.abs(t-sweep-.019)*21);
      if(!strength)continue;
      const shade=ctx.createLinearGradient(x,y,x,baseline);
      shade.addColorStop(0,'rgba(103,161,255,'+strength*.88+')');
      shade.addColorStop(1,'rgba(46,100,204,0)');
      ctx.fillStyle=shade;
      const size=Math.max(1,w/245);
      for(let offset=0;offset<baseline-y;offset+=size*2.4)ctx.fillRect(x,y+offset,size*1.2,size);
    }
    const x=inset+(sweep+.055)*width;
    ctx.strokeStyle='#9ea6ae5a';ctx.beginPath();ctx.moveTo(x,h*.16);ctx.lineTo(x,baseline);ctx.stroke();
    ctx.fillStyle='#afbed3';
    times.forEach((t,i)=>{
      ctx.beginPath();ctx.arc(inset+t*width,baseline+4,i===selected?3.2:2.1,0,Math.PI*2);
      ctx.fillStyle=i===selected?'#79a8ff':'#676e77';ctx.fill();
    });
    note.style.left=clamp(8+(sweep+.055)*90,6,73)+'%';
  }
  function tick() {
    frame=0;sweep=reduce()?target:sweep+(target-sweep)*.22;
    if(Math.abs(target-sweep)<.001){sweep=target;render();return;}
    render();schedule();
  }
  function schedule(){if(!frame&&!signal.aborted)frame=requestAnimationFrame(tick);}
  function activate(i) {
    selected=i;target=times[i];buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
    scrub.value=String(Math.round(target*100));
    note.textContent=amounts[i]+' mg · '+buttons[i].textContent;
    schedule();
  }
  buttons.forEach((b,i)=>listen(b,'click',()=>activate(i),signal));
  listen(scrub,'input',()=>{
    target=Number(scrub.value)/100;
    const quantity=times.reduce((sum,_,i)=>sum+signalAt(target,i),0);
    const totalMinutes=360+Math.round(target*840);
    const time=String(Math.floor(totalMinutes/60)).padStart(2,'0')+':'+String(totalMinutes%60).padStart(2,'0');
    note.textContent=Math.round(quantity)+' mg · '+time;
    scrub.setAttribute('aria-valuetext',note.textContent);
    schedule();
  },signal);
  const resize=new ResizeObserver(render);resize.observe(c);
  signal.addEventListener('abort',()=>{resize.disconnect();cancelAnimationFrame(frame);},{once:true});
  activate(0);
}

export function creditConsole(root,{signal}) {
  const id=scope(root);
  root.innerHTML=`
    <div class="credits-stage"><div class="credits-board">
      <section class="credit-charts" aria-label="Sample credit usage"></section>
      <section class="credit-form"><h3>Add credits</h3><p>Preview a change to your studio balance.</p><div class="credit-spectrum"></div>
        <fieldset><legend>Amount to preview</legend>
          <label><input type="radio" name="${id}-credits" checked value="100"> 100 credits</label>
          <label><input type="radio" name="${id}-credits" value="500"> 500 credits</label>
          <label><input type="radio" name="${id}-credits" value="1000"> 1,000 credits</label>
        </fieldset><button type="button">Preview credits</button><output role="status"></output>
      </section></div></div>`;
  const models=[
    ['Agent usage',270,[42,49,39,66,55,69,63],'#bb6394'],
    ['Workspace',216,[17,21,34,42,48,65,79],'#5d8fd4'],
    ['Scheduled runs',102,[34,52,77,53,72,56,45],'#cb8549']
  ];
  const nums=[];
  const area=control(root,'.credit-charts');
  for (const [name,base,data,color] of models) {
    const row=document.createElement('div');
    row.className='credit-row';
    const labels=document.createElement('div');
    const title=document.createElement('small');
    title.textContent=name;
    const output=document.createElement('strong');
    output.textContent=base;nums.push(output);
    labels.append(title,output);
    const chart=document.createElement(name==='Workspace'?'canvas':'div');
    chart.className='credit-sparks';
    chart.style.setProperty('--accent',color);
    if(chart instanceof HTMLCanvasElement){
      chart.width=220;chart.height=66;
      const ctx=chart.getContext('2d');
      if(ctx){
        ctx.beginPath();data.forEach((value,i)=>ctx[i?'lineTo':'moveTo'](7+i*34,63-value*.66));
        ctx.strokeStyle='#76abf4';ctx.lineWidth=2.5;ctx.stroke();ctx.lineTo(211,65);ctx.lineTo(7,65);ctx.closePath();
        const ink=ctx.createLinearGradient(0,0,0,66);ink.addColorStop(0,'#689ee3a0');ink.addColorStop(1,'#689ee300');ctx.fillStyle=ink;ctx.fill();
      }
    }else for (const value of data) {
      const bar=document.createElement('i');
      bar.style.height=value+'%';chart.append(bar);
    }
    row.append(labels,chart);area.append(row);
  }
  const msg=control(root,'output');
  let anim=0;
  listen(control(root,'button'),'click',()=>{
    const amount=Number(control(root,'input:checked').value);
    cancelAnimationFrame(anim);
    const from=Number(nums[0].textContent.replace(/,/g,'')),target=models[0][1]+amount;
    const start=performance.now();
    function tick(now){
      const t=reduce()?1:clamp((now-start)/630,0,1);
      nums[0].textContent=Math.round(from+(target-from)*(1-Math.pow(1-t,3))).toLocaleString('en-US');
      if(t<1&&!signal.aborted)anim=requestAnimationFrame(tick);
    }
    anim=requestAnimationFrame(tick);
    msg.textContent='Preview balance '+target.toLocaleString('en-US')+' credits';
  },signal);
  signal.addEventListener('abort',()=>cancelAnimationFrame(anim),{once:true});
}

export function contextTreemap(root,{signal}) {
  root.innerHTML=`
    <div class="context-stage"><header><b>◈ &nbsp; Context</b><span>Computer room</span><button type="button">Reset view</button></header>
      <div class="context-columns"></div><output aria-live="polite">Select a context block</output></div>`;
  const blocks=[
    ['System','3.2k', [['Configuration','1.2k'],['Tool instructions','1.4k'],['Memory','0.6k']]],
    ['Conversation','5.1k', [['Prompt','2.1k'],['Project notes','1.6k'],['Current task','1.4k']]],
    ['Agent','2.6k', [['Clock','0.5k'],['Tool results','1.3k'],['Draft','0.8k']]],
    ['Free','1.1k', [['Available','1.1k']]]
  ];
  const grid=control(root,'.context-columns'),msg=control(root,'output');
  const summary=document.createElement('aside');summary.className='context-detail';summary.hidden=true;grid.after(summary);
  const cols=blocks.map(([label,count,entries],index)=>{
    const section=document.createElement('section');
    section.dataset.index=index;
    const title=document.createElement('h3');title.textContent=label;
    const number=document.createElement('span');number.textContent=count;title.append(number);
    section.append(title);
    entries.forEach(([name,value])=>{
      const tile=document.createElement('button');
      tile.type='button';tile.textContent=name;
      const count=document.createElement('small');count.textContent=value;tile.append(count);
      tile.style.setProperty('--weight',parseFloat(value));
      listen(tile,'click',()=>{
        grid.dataset.focus=index;
        controls(grid,'button').forEach(el=>el.setAttribute('aria-pressed',String(el===tile)));
        msg.textContent=label+' / '+name+' · '+value+' tokens';
        summary.hidden=false;
        summary.replaceChildren();
        const title=document.createElement('strong');title.textContent=name;
        const meta=document.createElement('span');meta.textContent=value+' tokens • '+label;
        summary.append(title,meta);
      },signal);
      section.append(tile);
    });
    return section;
  });
  grid.append(...cols);
  listen(control(root,'button'),'click',()=>{
    delete grid.dataset.focus;
    controls(grid,'button').forEach(el=>el.setAttribute('aria-pressed','false'));
    msg.textContent='Select a context block';
    summary.hidden=true;
  },signal);
}

export function agentTimeline(root,{signal}) {
  root.innerHTML=`
    <div class="agents-stage"><section class="agent-log">
      <div class="agent-task"><span aria-hidden="true"></span><b>Collect live data</b><small>1s</small></div>
      <div class="agent-task" data-detail><span aria-hidden="true"></span><details><summary>Compare validators</summary><p>Researcher checked both response sets.</p></details><small>2s</small></div>
      <div class="agent-task" data-detail><span aria-hidden="true"></span><details><summary>Review correlations</summary><p>Reviewer read the three matching signals.</p></details><small>3s</small></div>
      <div class="agent-task"><span aria-hidden="true"></span><b>Send to agent</b><small>Auto</small></div>
      <output role="status">Ready</output><button type="button">Run sample</button>
    </section></div>`;
  const tasks=controls(root,'.agent-task'),output=control(root,'output'),button=control(root,'button');
  for(const disclosure of controls(root,'summary')) listen(disclosure,'click',()=>{
    const original=tasks.map(task=>task.getBoundingClientRect().top);
    requestAnimationFrame(()=>{
      if(signal.aborted)return;
      tasks.forEach((task,i)=>{
        const distance=original[i]-task.getBoundingClientRect().top;
        if(Math.abs(distance)>1)motion(task,[{transform:'translateY('+distance+'px)'},{transform:'none'}],{duration:310,easing:'cubic-bezier(.2,.75,.3,1)'},signal);
      });
    });
  },signal);
  let timers=[];
  function stop() {timers.forEach(cancel=>cancel());timers=[];}
  listen(button,'click',()=>{
    stop();
    tasks.forEach(task=>delete task.dataset.state);
    button.disabled=true;
    tasks.forEach((task,i)=>{
      const delay=i*(reduce()?65:430);
      timers.push(timer(()=>{
        if(i)tasks[i-1].dataset.state='done';
        task.dataset.state='running';
        output.textContent=(control(task,'summary,b')?.textContent ?? 'Running')+'…';
      },delay,signal));
    });
    timers.push(timer(()=>{
      tasks.at(-1).dataset.state='done';button.disabled=false;output.textContent='Sample complete';
    },reduce()?300:1740,signal));
  },signal);
  signal.addEventListener('abort',stop,{once:true});
}

export function connectionFlow(root,{signal}) {
  root.innerHTML=`
    <div class="connections-stage">
      <div class="connection-network"><canvas aria-hidden="true"></canvas>
        <button type="button" data-node="0">Source <span>12.8</span><i aria-hidden="true"></i></button>
        <button type="button" data-node="1">Filter <span>0.6</span><i aria-hidden="true"></i></button>
        <button type="button" data-node="2">Preview <span>0.9</span><i aria-hidden="true"></i></button>
      </div>
      <button type="button" class="connection-run">Send a pulse</button><output role="status">Ready</output>
    </div>`;
  const canvas=control(root,'canvas'),ctx=canvas.getContext('2d');
  const network=control(root,'.connection-network'),nodes=controls(network,'button');
  const output=control(root,'output');
  let frame=0,start, active=0;
  function draw(phase=-1) {
    const bounds=network.getBoundingClientRect();
    const {width:w,height:h}=bounds,dpr=Math.min(devicePixelRatio,2);
    if(!ctx||!w||!h)return;
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const boxes=nodes.map(node=>node.getBoundingClientRect());
    for(let i=0;i<2;i++){
      const a=boxes[i],b=boxes[i+1], x0=a.right-bounds.left,x1=b.left-bounds.left,
        y0=a.top+a.height*.52-bounds.top,y1=b.top+b.height*.52-bounds.top;
      function point(t) {
        const gap=x1-x0,inv=1-t;
        return [inv*inv*inv*x0+3*inv*inv*t*(x0+gap*.77)+3*inv*t*t*(x1-gap*.76)+t*t*t*x1,
          inv*inv*inv*y0+3*inv*inv*t*y0+3*inv*t*t*y1+t*t*t*y1];
      }
      ctx.beginPath();ctx.moveTo(x0,y0);ctx.bezierCurveTo(x0+(x1-x0)*.77,y0,x1-(x1-x0)*.76,y1,x1,y1);
      ctx.strokeStyle='#9788d3';ctx.lineWidth=1.6;ctx.shadowColor='#aa8de6';ctx.shadowBlur=12;ctx.stroke();
      const progress=phase*2-i;
      if(progress>=0&&progress<=1) {
        ctx.beginPath();ctx.moveTo(...point(Math.max(0,progress-.16)));
        for(let n=1;n<=12;n++)ctx.lineTo(...point(Math.max(0,progress-.16+n/12*.16)));
        ctx.lineWidth=3.3;ctx.strokeStyle='#f3a3ee';ctx.shadowColor='#f684ef';ctx.shadowBlur=13;ctx.stroke();
      }
      ctx.shadowBlur=0;
    }
  }
  function tick(now) {
    const t=clamp((now-start)/1470,0,1);
    draw(t);
    const node=Math.min(2,Math.floor(t*2.5));
    if(node!==active)activate(node);
    if(t<1&&!signal.aborted)frame=requestAnimationFrame(tick);
    else {draw();output.textContent='Pulse arrived at Preview';}
  }
  function activate(i){active=i;nodes.forEach((n,j)=>n.setAttribute('aria-pressed',String(i===j)));}
  listen(control(root,'.connection-run'),'click',()=>{
    cancelAnimationFrame(frame);activate(0);
    output.textContent='Sending pulse';
    if(reduce()){activate(2);output.textContent='Pulse arrived at Preview';return;}
    start=performance.now();frame=requestAnimationFrame(tick);
  },signal);
  nodes.forEach((node,i)=>listen(node,'click',()=>{activate(i);output.textContent=node.firstChild.textContent.trim()+' selected';},signal));
  const size=new ResizeObserver(()=>draw());size.observe(network);
  signal.addEventListener('abort',()=>{size.disconnect();cancelAnimationFrame(frame);},{once:true});
  activate(0);draw();
}
