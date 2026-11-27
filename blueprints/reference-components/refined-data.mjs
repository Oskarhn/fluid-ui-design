import { control, controls, listen, motion, scope, timer } from './shared.mjs';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v,min,max) => Math.min(max,Math.max(min,v));

export function caffeineCurve(root,{signal}) {
  root.innerHTML=`
    <div class="curve-stage"><header><b>CAFFEINE</b><small>3 CUPS · 285 MG · HALF-LIFE 5H</small></header>
      <div class="curve-area"><canvas aria-hidden="true"></canvas><output aria-live="polite"></output><input type="range" min="0" max="100" value="8" aria-label="Scrub caffeine curve"></div>
      <div class="dose-row"><button type="button" aria-pressed="true">08:00</button><button type="button" aria-pressed="false">10:30</button><button type="button" aria-pressed="false">13:10</button></div>
      <div class="curve-footer">LAST CUP BY <span>10:45</span></div>
    </div>`;
  const c=control(root,'canvas'),ctx=c.getContext('2d');
  const note=control(root,'output');
  const scrub=control(root,'input');
  const buttons=controls(root,'button');
  const day=60*24, windowMinutes=day, times=[120,270,430].map(minutes=>minutes/windowMinutes);
  const amounts=[75,105,105];
  let selected=0,sweep=times[0],target=sweep,frame=0;
  function signalAt(t,i) {
    const since=(t-times[i])*windowMinutes;
    return since<0?0:Math.min(since/18,1)*Math.pow(.5,since/300)*amounts[i];
  }
  const activeDose=t=>times.reduce((acc,_,i)=>acc+signalAt(t,i),0);
  function render() {
    if(!ctx)return;
    const w=c.clientWidth,h=c.clientHeight,dpr=Math.min(devicePixelRatio,2);
    if(!w||!h)return;
    if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const start=w*.072, width=w*.87, floor=h*.82, height=h*.59;
    const cell=Math.max(2.6,w/137),dot=cell*.33;
    for(let column=0;column<=Math.floor(width/cell);column++){
      const x=start+column*cell,t=(x-start)/width,dose=activeDose(t);
      const activeRows=Math.floor(dose/220*height/cell);
      const highlight=Math.max(0,1-Math.abs(t-sweep)*35);
      for(let row=0;row<=Math.floor(height/cell);row++){
        const lit=row<=activeRows;
        const alpha=lit?(.27+.67*(row/(activeRows||1))):.075;
        ctx.fillStyle=highlight>.18&&lit?'rgba(109,163,253,'+(.48+highlight*.47)+')':'rgba(183,187,183,'+alpha+')';
        ctx.beginPath();ctx.arc(x,floor-row*cell,dot,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.font='10px ui-monospace, monospace';ctx.textBaseline='top';ctx.fillStyle='#a4aaa8';ctx.textAlign='center';
    ['06','12','18','00','06'].forEach((time,i)=>ctx.fillText(time,start+width*i/4,floor+11));
    function guide(t,label,align){
      const x=start+width*t;
      ctx.strokeStyle='#aeb8ac60';ctx.beginPath();ctx.moveTo(x,h*.22);ctx.lineTo(x,floor);ctx.stroke();
      ctx.fillStyle='#c5cbc4';ctx.textAlign=align;ctx.fillText(label,x+(align==='left'?5:-5),h*.14);
    }
    if(w>335){guide((430+18)/windowMinutes,'PEAK '+Math.round(activeDose((430+18)/windowMinutes))+' MG','left');guide(1020/windowMinutes,'BED 23:00','right');}
    const x=start+sweep*width;
    ctx.strokeStyle='#8aadff';ctx.beginPath();ctx.moveTo(x,h*.21);ctx.lineTo(x,floor+1);ctx.stroke();
    ctx.fillStyle='#a9c3ff';ctx.beginPath();ctx.arc(x,floor-activeDose(sweep)/220*height,3.7,0,Math.PI*2);ctx.fill();
    note.style.left=clamp(7+sweep*87,7,71)+'%';
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
    const quantity=activeDose(target);
    const totalMinutes=(360+Math.round(target*windowMinutes))%day;
    buttons.forEach(b=>b.setAttribute('aria-pressed','false'));
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
      <section class="credit-form"><h3>Add credits</h3><p>This week your agents used <strong>84 credits a day.</strong> At that pace the monthly credits run out on <strong>Oct 30</strong>, before they reset on <strong>Nov 1.</strong></p>
        <div class="credit-usage"><span>Used in October</span><b>1,321 <span>of 2,000</span></b></div><div class="credit-spectrum"></div>
        <div class="credit-key"><span>Support <b>702</b></span><span>Code review <b>389</b></span><span>Research <b>230</b></span><span>Left <b>679</b></span></div>
        <fieldset><legend class="a11y-only">Amount to preview</legend>
          <label><input type="radio" name="${id}-credits" value="500"><span>500 credits<small>About 6 days</small></span><b>$10</b></label>
          <label><input type="radio" name="${id}-credits" checked value="1000"><span>1,000 credits<small>About 12 days, past the reset</small></span><b>$20</b></label>
          <label><input type="radio" name="${id}-credits" value="2500"><span>2,500 credits<small>About a month</small></span><b>$45</b></label>
        </fieldset><div class="credit-actions"><button type="button" data-credit-reset>Cancel</button><button type="button" data-credit-add>Add 1,000 · $20</button></div><output role="status" class="a11y-only"></output>
      </section></div></div>`;
  const series=[
    ['Support replies',270,'41 per day on average',[41,41,38,41,34,42,33],'#e657b0',50,'dots'],
    ['Code review',216,'82 more than last month',[19,45,78,112,147,180,216],'#649ff8',240,'line'],
    ['Research',102,'11 Notion pages',[8,12,18,14,19,17,14],'#ed8a42',20,'bars']
  ];
  const numbers=[];
  for(const [name,total,info,points,ink,max,kind] of series){
    const row=document.createElement('article');row.className='credit-row';row.style.setProperty('--accent',ink);
    const text=document.createElement('div');text.className='credit-series';
    const title=document.createElement('span');title.className='credit-series-name';title.textContent=name;
    const reading=document.createElement('strong');reading.textContent=total;numbers.push(reading);
    const unit=document.createElement('span');unit.textContent=' credits';unit.className='credit-unit';
    const value=document.createElement('div');value.append(reading,unit);
    const detail=document.createElement('small');detail.textContent=info;
    text.append(title,value,detail);
    const chart=document.createElement('canvas');chart.className='credit-sparks';chart.width=320;chart.height=204;
    chart.setAttribute('aria-label',name+' daily trend');
    const ctx=chart.getContext('2d');
    if(ctx){
      ctx.scale(2,2);
      ctx.font='9px Arial';ctx.fillStyle='#858087';
      ctx.textAlign='right';ctx.fillText(String(max),13,15);ctx.fillText(String(max/2),13,50);ctx.fillText('0',13,85);
      ctx.textAlign='center';
      const samples=points.map((n,i)=>[27+i*19,83-(n/max)*70]);
      ctx.strokeStyle='#48414b';ctx.beginPath();ctx.moveTo(17,83);ctx.lineTo(150,83);ctx.stroke();
      ctx.fillStyle='#767078';['T','F','S','S','M','T','W'].forEach((day,i)=>ctx.fillText(day,samples[i][0],98));
      if(kind==='line'){
        const plot=new Path2D();
        samples.forEach(([x,y],i)=>plot[i?'lineTo':'moveTo'](x,y));
        ctx.strokeStyle=ink;ctx.lineWidth=1.5;ctx.stroke(plot);
        plot.lineTo(samples.at(-1)[0],83);plot.lineTo(samples[0][0],83);plot.closePath();
        ctx.fillStyle='#649ff830';ctx.fill(plot);
      }
      for(const [x,y] of samples){
        ctx.fillStyle=ink;
        if(kind==='bars'){ctx.beginPath();ctx.roundRect(x-4,y,8,83-y,[2,2,0,0]);ctx.fill();}
        else{
          if(kind==='dots'){ctx.strokeStyle='#a3467880';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,83);ctx.stroke();}
          ctx.beginPath();ctx.arc(x,y,kind==='dots'?3.1:1.8,0,Math.PI*2);ctx.fill();
        }
      }
    }
    row.append(text,chart);control(root,'.credit-charts').append(row);
  }
  const form=control(root,'.credit-form'),status=control(root,'output'),amount=control(root,'[data-credit-add]');
  let animation=0;
  function selection(){
    const count=Number(control(form,'input:checked').value);
    return [count,{500:10,1000:20,2500:45}[count]];
  }
  function update(){
    const [count,price]=selection();
    amount.textContent='Add '+count.toLocaleString('en-US')+' · $'+price;
  }
  listen(form,'change',update,signal);
  listen(control(root,'[data-credit-reset]'),'click',()=>{
    cancelAnimationFrame(animation);
    controls(form,'input')[1].checked=true;
    numbers[0].textContent='270';status.textContent='Preview reset';update();
  },signal);
  listen(amount,'click',()=>{
    const [count]=selection(),from=Number(numbers[0].textContent.replace(/,/g,'')),goal=270+count,start=performance.now();
    cancelAnimationFrame(animation);
    function roll(now){
      const t=reduce()?1:clamp((now-start)/630,0,1);
      numbers[0].textContent=Math.round(from+(goal-from)*(1-Math.pow(1-t,3))).toLocaleString('en-US');
      if(t<1&&!signal.aborted)animation=requestAnimationFrame(roll);
    }
    animation=requestAnimationFrame(roll);
    status.textContent='Preview balance '+goal.toLocaleString('en-US')+' credits';
  },signal);
  signal.addEventListener('abort',()=>cancelAnimationFrame(animation),{once:true});
}

export function contextTreemap(root,{signal}){
  root.innerHTML=`
    <div class="context-stage"><header><b>▥ &nbsp; Context</b><select aria-label="Context scenario"><option>Checkout fixer</option><option>Test runner</option></select><span class="context-count"></span></header>
    <div class="context-map-frame"><div class="context-used"></div><div class="context-free"><b>Free</b><span></span></div></div>
    <div class="context-time"><label>Token usage <input type="range" min="0" max="100" value="55" aria-label="Token usage"></label><button type="button" data-context-play>Play sample</button><button type="button" data-context-reset>Reset view</button></div>
    <output aria-live="polite">Select a context block</output></div>`;
  const groups=[
    [['System prompt',5.2,'system'],['Tool definitions',14.8,'tools'],['checkout.ts',8.2,'file'],['payment.ts',17.6,'file']],
    [['Project',9.4,'project'],['Chat',19.7,'chat'],['Test run · 20×',22.4,'result'],['stripe.ts (mock)',11.8,'file']]
  ];
  const grid=control(root,'.context-used'), range=control(root,'input'),scenario=control(root,'select');
  const free=control(root,'.context-free'),read=control(root,'.context-count'),msg=control(root,'output');
  const detail=document.createElement('aside');detail.className='context-detail';detail.hidden=true;grid.after(detail);
  const tiles=groups.map(items=>{
    const group=document.createElement('section');
    const list=items.map(([title,weight,kind])=>{
      const tile=document.createElement('button');tile.type='button';tile.dataset.kind=kind;
      tile.textContent=title;
      const amount=document.createElement('small');tile.append(amount);
      listen(tile,'click',()=>{
        controls(grid,'button').forEach(other=>other.setAttribute('aria-pressed',String(other===tile)));
        msg.textContent=title+' · '+amount.textContent+' tokens';
        detail.hidden=false;detail.replaceChildren();
        const heading=document.createElement('strong');heading.textContent=title;
        const stat=document.createElement('span');stat.textContent=amount.textContent+' · '+kind;
        detail.append(heading,stat);
      },signal);
      group.append(tile);return {tile,amount,weight,kind};
    });
    grid.append(group);return {group,list};
  });
  let frame=0;
  function update(){
    const usage=Number(range.value)/100;
    const capacity=scenario.selectedIndex===0?200:160;
    const used=capacity*usage;
    const ratio=usage/.55;
    grid.style.setProperty('--context-used',used/(capacity||1));
    free.style.setProperty('--context-free',1-usage);
    read.textContent=Math.round(used)+'k / '+capacity+'k · '+Math.round(usage*100)+'%';
    control(free,'span').textContent=(capacity-used).toFixed(1)+'k';
    const scale=used/(tiles.flatMap(group=>group.list).reduce((n,entry)=>n+entry.weight,0)||1);
    tiles.forEach(({group,list},groupIndex)=>{
      group.style.flexGrow=String(list.reduce((n,x)=>n+x.weight*(groupIndex?(.65+ratio*.35):1),0));
      const weights=list.map(({weight,kind})=>weight*((kind==='chat'||kind==='result')?.45+usage:1.14-usage*.16));
      group.style.gridTemplateRows=[weights[0],weights[1],weights[2]+weights[3]].map(weight=>weight+'fr').join(' ');
      list.forEach(({tile,amount,weight},index)=>{
        tile.style.gridColumn=index===2||index===3?'span 1':'span 2';
        amount.textContent=(weight*scale).toFixed(1)+'k';
      });
    });
  }
  listen(range,'input',()=>{cancelAnimationFrame(frame);update();},signal);
  listen(scenario,'change',update,signal);
  listen(control(root,'[data-context-reset]'),'click',()=>{
    cancelAnimationFrame(frame);range.value='55';detail.hidden=true;msg.textContent='Select a context block';update();
    controls(grid,'button').forEach(tile=>tile.setAttribute('aria-pressed','false'));
  },signal);
  listen(control(root,'[data-context-play]'),'click',()=>{
    cancelAnimationFrame(frame);const start=performance.now();
    function run(now){
      const t=reduce()?1:clamp((now-start)/3100,0,1);
      range.value=String(Math.floor(28+67*t));update();
      if(t<1&&!signal.aborted)frame=requestAnimationFrame(run);
    }
    frame=requestAnimationFrame(run);
  },signal);
  signal.addEventListener('abort',()=>cancelAnimationFrame(frame),{once:true});
  update();
}

export function agentTimeline(root,{signal}) {
  root.innerHTML=`
    <div class="agents-stage"><section class="agent-log">
      <div class="agent-task"><span aria-hidden="true"></span><b>Collect fee data</b><small>4s</small></div>
      <div class="agent-task branching" data-detail><span aria-hidden="true"></span><details><summary>Compare validators</summary><div class="agent-children"><p>Ranked 40 validators</p><p>Scoring commission</p></div></details><small>4s</small></div>
      <div class="agent-task"><span aria-hidden="true"></span><b>Draft the report</b><small></small></div>
      <div class="agent-task"><span aria-hidden="true"></span><b>Check every number</b><small></small></div>
      <div class="agent-task"><span aria-hidden="true"></span><b>Send to team</b><small class="agent-gate">Asks first</small></div>
      <output role="status" class="a11y-only">Ready</output>
    </section><button class="agent-start" type="button">Run sample</button></div>`;
  const tasks=controls(root,'.agent-task'),output=control(root,'output'),button=control(root,'button');
  const disclosure=control(root,'details');
  let timers=[];
  function stop(){timers.forEach(cancel=>cancel());timers=[];}
  function resize(open){
    const tops=tasks.map(task=>task.getBoundingClientRect().top);
    disclosure.open=open;
    requestAnimationFrame(()=>{
      if(signal.aborted)return;
      tasks.forEach((task,i)=>{
        const delta=tops[i]-task.getBoundingClientRect().top;
        if(Math.abs(delta)>1)motion(task,[{transform:'translateY('+delta+'px)'},{transform:'none'}],{duration:330,easing:'cubic-bezier(.2,.75,.3,1)'},signal);
      });
    });
  }
  listen(control(disclosure,'summary'),'click',event=>{event.preventDefault();resize(!disclosure.open);},signal);
  listen(button,'click',()=>{
    stop();tasks.forEach(task=>delete task.dataset.state);
    resize(false);button.disabled=true;
    tasks.slice(0,-1).forEach((task,i)=>timers.push(timer(()=>{
      if(i)tasks[i-1].dataset.state='done';
      task.dataset.state='running';
      if(i===1)resize(true);
      if(i===2)resize(false);
      output.textContent=(control(task,'summary,b')?.textContent??'Running')+'…';
    },i*(reduce()?65:690),signal)));
    timers.push(timer(()=>{
      tasks[3].dataset.state='done';tasks[4].dataset.state='gated';
      button.disabled=false;output.textContent='Sample complete';
    },reduce()?280:2840,signal));
  },signal);
  signal.addEventListener('abort',stop,{once:true});
}

export function connectionFlow(root,{signal}) {
  function bars(values,accent) {
    return '<div aria-hidden="true" class="power-bars" style="--bars:'+accent+'">'+values.map(value=>'<i style="--bar:'+value+'%"></i>').join('')+'</div>';
  }
  root.innerHTML=`
    <div class="connections-stage">
      <div class="connection-network"><canvas aria-hidden="true"></canvas>
        <article data-node="0" aria-label="Solar roof"><header><b>Solar roof</b><small>14 panels</small></header>
          <div class="power-body"><small>OUTPUT</small><dl><div><dt>Power</dt><dd>4.2 kW</dd></div><div><dt>Sunlight</dt><dd>812 W/m²</dd></div></dl>
          <small>TODAY <b>18.6 kWh</b></small>${bars([9,16,18,28,32,38,55,65,74,92,69,55,39],'#658de9')}</div>
        </article>
        <article data-node="1" aria-label="Home battery"><header><b>Home battery</b><small>13.5 kWh</small></header>
          <div class="power-body"><small>MODE</small><div class="power-modes"><button type="button" aria-pressed="false">Store</button><button type="button" aria-pressed="true">Pass on</button><button type="button" aria-pressed="false">Hold</button></div>
          <small>CHARGE <b data-power-charge>71%</b></small><div class="power-charge" aria-hidden="true">${Array.from({length:14},()=>'<i></i>').join('')}</div><small data-power-status>Ready</small></div>
        </article>
        <article data-node="2" aria-label="Car charger"><header><b>Car charger</b><small>Garage</small></header>
          <div class="power-body power-car"><div class="power-bolt">ϟ</div><strong data-power-read>0.0</strong><span> kW</span>
          <p data-car-status>Waiting for power</p>${bars([12,17,24,30,34,40,42,49,47,51,46,52,55,60,63,65,61,58,56,56],'#8196df')}</div>
          <footer><span>Not charging</span><span>Idle</span></footer>
        </article>
      </div>
      <button type="button" class="connection-run">▷ Send power</button><output role="status" class="a11y-only">Ready</output>
    </div>`;
  const canvas=control(root,'canvas'),ctx=canvas.getContext('2d');
  const network=control(root,'.connection-network'),nodes=controls(network,'article');
  const output=control(root,'output'),charge=control(root,'[data-power-charge]');
  const read=control(root,'[data-power-read]'),car=control(root,'[data-car-status]'),battery=control(root,'[data-power-status]');
  const modes=controls(root,'.power-modes button'),ticks=controls(root,'.power-charge i');
  let frame=0,start,active=-1,mode=1,percentage=71,phase=-1;
  function draw() {
    const bounds=network.getBoundingClientRect();
    const {width:w,height:h}=bounds,dpr=Math.min(devicePixelRatio,2);
    if(!ctx||!w||!h)return;
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const positions=nodes.map(node=>node.getBoundingClientRect());
    for(let i=0;i<2;i++){
      const a=positions[i],b=positions[i+1],x0=a.right-bounds.left,x1=b.left-bounds.left,
        y0=a.top+a.height*.51-bounds.top,y1=b.top+b.height*.51-bounds.top;
      const gap=x1-x0;
      function point(t) {
        const inv=1-t;
        return [inv*inv*inv*x0+3*inv*inv*t*(x0+gap*.78)+3*inv*t*t*(x1-gap*.76)+t*t*t*x1,
          inv*inv*inv*y0+3*inv*inv*t*y0+3*inv*t*t*y1+t*t*t*y1];
      }
      ctx.beginPath();ctx.moveTo(x0,y0);ctx.bezierCurveTo(x0+gap*.78,y0,x1-gap*.76,y1,x1,y1);
      ctx.strokeStyle='#6f82e377';ctx.lineWidth=5.1;ctx.shadowColor='#546cea';ctx.shadowBlur=17;ctx.stroke();
      ctx.strokeStyle='#c4cbffb5';ctx.lineWidth=1.45;ctx.shadowBlur=4;ctx.stroke();
      const progress=phase*2-i;
      if(progress>=0&&progress<=1){
        ctx.beginPath();ctx.moveTo(...point(Math.max(0,progress-.15)));
        for(let n=1;n<=16;n++)ctx.lineTo(...point(Math.max(0,progress-.15+n/16*.15)));
        ctx.lineWidth=3.5;ctx.strokeStyle='#f6f0ff';ctx.shadowColor='#a9b0ff';ctx.shadowBlur=13;ctx.stroke();
        ctx.beginPath();ctx.arc(...point(progress),3,0,Math.PI*2);ctx.fillStyle='#f4f5ff';ctx.fill();
      }
      ctx.shadowBlur=0;
    }
  }
  function activate(i){active=i;nodes.forEach((n,j)=>n.toggleAttribute('data-powered',i===j));}
  function setCharge(){
    charge.textContent=percentage+'%';
    ticks.forEach((tick,i)=>tick.toggleAttribute('data-on',100*(i+1)/ticks.length<=percentage));
  }
  function finish(){
    phase=-1;draw();
    if(mode===0){percentage=Math.min(100,percentage+4);setCharge();battery.textContent='Power stored';output.textContent='Power stored in battery';return;}
    if(mode===2){battery.textContent='Holding charge';output.textContent='Battery holding charge';return;}
    activate(2);read.textContent='7.4';car.textContent='Charging';battery.textContent='Passing on';
    output.textContent='Power arrived at car charger';
  }
  function tick(now){
    const t=clamp((now-start)/1820,0,1);
    phase=mode===1?t:t*.5;
    draw();
    const node=Math.min(mode===1?2:1,Math.floor(t*2.6));
    if(node!==active)activate(node);
    if(t<1&&!signal.aborted)frame=requestAnimationFrame(tick);else finish();
  }
  listen(control(root,'.connection-run'),'click',()=>{
    cancelAnimationFrame(frame);activate(0);read.textContent='0.0';car.textContent='Waiting for power';output.textContent='Sending power';
    if(reduce()){finish();return;}
    start=performance.now();frame=requestAnimationFrame(tick);
  },signal);
  modes.forEach((button,i)=>listen(button,'click',()=>{
    cancelAnimationFrame(frame);phase=-1;mode=i;
    modes.forEach((entry,j)=>entry.setAttribute('aria-pressed',String(i===j)));
    read.textContent='0.0';car.textContent='Waiting for power';battery.textContent='Ready';activate(-1);draw();
  },signal));
  const size=new ResizeObserver(draw);size.observe(network);
  signal.addEventListener('abort',()=>{size.disconnect();cancelAnimationFrame(frame);},{once:true});
  setCharge();draw();
}
