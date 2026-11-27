export async function openArchiveAtlas(stage, spec, preference, signal) {
  async function decode(src) {
    const image=new Image();
    image.src=src;await image.decode();return image;
  }
  const images=await Promise.all([
    ...spec.clips.map(async clip=>({...clip,image:await decode(clip.src)})),
    spec.rest?decode(spec.rest):null
  ]);
  if(signal.aborted)return;
  const still=images.pop(),clips=images;
  const canvas=document.createElement('canvas');
  canvas.className='archive-canvas';canvas.width=spec.width;canvas.height=spec.height;
  canvas.setAttribute('aria-hidden','true');
  const context=canvas.getContext('2d',{alpha:false});
  if(!context)throw Error('Archive artwork needs Canvas 2D');
  stage.prepend(canvas);
  stage.dataset.renderer='texture';
  const anchors=spec.hits??[];
  const names=[...stage.querySelectorAll('.archive-tabs button')].map(b=>b.getAttribute('aria-label'));
  const lifts=anchors.map(()=>0);
  const cut=spec.cardClips??Object.fromEntries(anchors.map((_,index)=>[index,index+1]));
  let openTarget=0,opening=0,active=-1,pointed=-1,frame=0,last=0;
  function stamp(clipIndex,progress) {
    const clip=clips[clipIndex];
    const index=Math.round(Math.min(1,Math.max(0,progress))*(clip.frames-1));
    const x=index%clip.columns*spec.width,y=Math.floor(index/clip.columns)*spec.height;
    context.drawImage(clip.image,x,y,spec.width,spec.height,0,0,spec.width,spec.height);
  }
  function target(value,goal,speed,dt) {
    if(preference.matches)return goal;
    const adjusted=value+(goal-value)*(1-Math.exp(-speed*dt));
    return Math.abs(adjusted-goal)<.004?goal:adjusted;
  }
  function drawTab(index,lift) {
    const [x,y,w,h]=anchors[index].map((length,axis)=>length*(axis%2?spec.height:spec.width));
    if(still&&active!==index){
      const top=(1.18*h)*lift;
      context.save();
      context.shadowColor='#0b0c0b35';context.shadowBlur=lift*10;
      context.drawImage(still,x/spec.width*still.width,y/spec.height*still.height,
        w/spec.width*still.width,h/spec.height*still.height,x,y-top,w,h);
      context.restore();
      return;
    }
    const width=spec.width*.45,height=spec.height*.34;
    context.save();
    context.globalAlpha=Math.min(1,lift*3);
    context.translate(x+w/2,y+h/2);
    context.scale(.25+.75*lift,.25+.75*lift);
    context.translate(-width*.51,-height*lift*.92);
    context.fillStyle='#f4f2e9';
    context.shadowColor='#1a1c1955';context.shadowBlur=13*lift;
    context.beginPath();context.roundRect(0,0,width,height,4);context.fill();
    context.shadowBlur=0;
    context.fillStyle='#292c29';context.font='600 '+Math.round(width*.10)+'px Arial,sans-serif';
    context.fillText(names[index],width*.08,height*.39,width*.84);
    context.strokeStyle='#b7b8ab';context.beginPath();context.moveTo(width*.08,height*.77);context.lineTo(width*.92,height*.77);context.stroke();
    context.restore();
  }
  function paint(now) {
    frame=0;
    if(signal.aborted)return;
    const dt=last?Math.min(.065,(now-last)/1000):.02;last=now;
    opening=target(opening,openTarget,11,dt);
    let moving=opening!==openTarget;
    for(let i=0;i<lifts.length;i++){
      const goal=!openTarget?0:active===i?1:active<0&&pointed===i?.23:0;
      lifts[i]=target(lifts[i],goal,i===active?12:21,dt);
      moving||=lifts[i]!==goal;
    }
    let recorded=-1;
    for (const i of Object.keys(cut).map(Number)) {
      if(cut[i]===undefined||!clips[cut[i]]||lifts[i]<.25)continue;
      if(recorded<0||lifts[i]>lifts[recorded])recorded=i;
    }
    if(opening!==1)stamp(0,opening);
    else if(recorded>=0)stamp(cut[recorded],lifts[recorded]);
    else{
      if(still)context.drawImage(still,0,0,spec.width,spec.height);else stamp(0,1);
      lifts.forEach((lift,index)=>{if(lift>.004)drawTab(index,lift);});
    }
    stage.style.setProperty('--archive-travel',opening);
    stage.style.setProperty('--archive-lift',Math.max(0,...lifts));
    if(moving)schedule();else last=0;
  }
  function schedule(){if(!frame&&!signal.aborted)frame=requestAnimationFrame(paint);}
  stamp(0,0);
  return {
    open(value){openTarget=value?1:0;schedule();},
    select(index){active=index;pointed=-1;schedule();},
    hover(index){pointed=preference.matches?-1:index;schedule();},
    dispose(){cancelAnimationFrame(frame);}
  };
}
