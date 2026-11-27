export async function openArchiveAtlas(stage, spec, preference, signal) {
  const clips = await Promise.all(spec.clips.map(async clip => {
    const image = new Image();
    image.src = clip.src;
    await image.decode();
    return { ...clip, image };
  }));
  if (signal.aborted) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'archive-canvas';
  canvas.width = spec.width;
  canvas.height = spec.height;
  canvas.setAttribute('aria-hidden','true');
  const context = canvas.getContext('2d', { alpha:false });
  if (!context) throw Error('Archive artwork needs Canvas 2D');
  stage.prepend(canvas);
  stage.dataset.renderer = 'texture';

  let openTarget = 0, opening = 0, active = -1, pointed = -1, showing = -1, lift = 0, frame = 0, last = 0;
  function stamp(clipIndex, progress) {
    const clip = clips[clipIndex];
    const index = Math.min(clip.frames - 1, Math.max(0, Math.round(progress * (clip.frames - 1))));
    const x = index % clip.columns * spec.width;
    const y = Math.floor(index / clip.columns) * spec.height;
    context.drawImage(clip.image, x, y, spec.width, spec.height, 0,0,spec.width,spec.height);
  }
  function step(value, target, amount) {
    return target > value ? Math.min(value+amount,target) : Math.max(value-amount,target);
  }
  function paint(now) {
    frame = 0;
    if (signal.aborted) return;
    const dt = preference.matches ? 1 : last ? Math.min(.055,(now-last)/1000) : .016;
    last = now;
    const goal = openTarget ? (active >= 0 ? active : pointed) : -1;
    const height = active >= 0 ? 1 : goal >= 0 ? (clips[goal+1].hover ?? .14) : 0;
    if (lift && showing !== goal) lift = step(lift,0,dt*2.6);
    if (!lift && showing !== goal) showing = goal;
    if (!lift && (opening < 1 || !openTarget)) opening = step(opening,openTarget,dt*1.65);
    if (opening === 1 && showing >= 0 && showing === goal) lift = step(lift,height,dt*1.36);
    if (showing >= 0 && lift > 0) stamp(showing+1,lift);
    else stamp(0,opening);
    stage.style.setProperty('--archive-travel',opening);
    stage.style.setProperty('--archive-lift',lift);
    if (opening !== openTarget || showing !== goal || (showing >= 0 && lift !== height)) start();
    else last = 0;
  }
  function start() {
    if (!frame && !signal.aborted) frame = requestAnimationFrame(paint);
  }
  stamp(0,0);
  return {
    open(value){openTarget=value ? 1 : 0;start();},
    select(index){active=index;pointed=-1;start();},
    hover(index){pointed=preference.matches ? -1 : index;start();},
    dispose(){cancelAnimationFrame(frame);}
  };
}
