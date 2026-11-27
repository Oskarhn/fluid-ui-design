import { control, listen } from './shared.mjs';

const previewMedia = name => new URL('../../media/preview-loops/' + name, import.meta.url).href;

export function videoHero(root, { signal, options = {} }) {
  root.innerHTML = `
    <div class="video-hero">
      <video muted playsinline loop preload="metadata" aria-hidden="true"></video>
      <div class="video-hero-copy"><h3>Objects in daylight</h3><p>Material studies from the studio.</p><button type="button">Play background</button><output role="status"></output></div>
    </div>
  `;
  const video = control(root, 'video');
  const button = control(root, 'button');
  const status = control(root, 'output');
  video.src = options.video ?? previewMedia('light.mp4');
  video.poster = options.poster ?? previewMedia('light.jpg');
  if (options.sourceTitle) {
    control(root,'.video-hero').dataset.source='';
    control(root,'.video-hero-copy h3').textContent=options.sourceTitle;
    control(root,'.video-hero-copy p').textContent='A single scene in motion.';
  }
  listen(video, 'play', () => { button.textContent = 'Pause background'; }, signal);
  listen(video, 'pause', () => { button.textContent = 'Play background'; }, signal);
  let playWhenVisible=Boolean(options.video)&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  listen(button, 'click', async () => {
    if (!video.paused) { playWhenVisible=false;video.pause(); return; }
    playWhenVisible=true;
    try { await video.play(); }
    catch { if (!signal.aborted) status.textContent = 'The video is unavailable.'; }
  }, signal);
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting || entry.intersectionRatio < .25) video.pause();
    else if (playWhenVisible) video.play().catch(()=>{});
  }, {threshold:[0,.25]});
  observer.observe(video);
  signal.addEventListener('abort', () => { video.pause(); observer.disconnect(); }, { once: true });
}

export function unmaskTrail(root, { signal, options = {} }) {
  root.innerHTML = `
    <div class="trail-demo">
      <div class="trail-surface"><div class="trail-layer" aria-hidden="true"></div><canvas aria-hidden="true"></canvas></div>
      <div class="action-row"><button type="button" aria-pressed="false">Reveal sample</button><button type="button">Clear trail</button></div>
    </div>
  `;
  const surface = control(root, '.trail-surface');
  const canvas = control(root, 'canvas');
  const brush = canvas.getContext('2d');
  const toggle = control(root, 'button');
  let strokes = [];
  let frame = 0;
  const lifespan = 630;
  let masked;
  if(options.masked && options.clear) {
    const under=control(root,'.trail-layer');
    const clean=new Image(),front=new Image();
    clean.src=options.clear;
    front.src=options.masked;
    Promise.all([clean.decode(),front.decode()]).then(()=>{
      if(signal.aborted)return;
      surface.dataset.photo='';
      under.style.backgroundImage='url('+JSON.stringify(clean.src)+')';
      masked=front;
      queue();
    }).catch(()=>{});
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function draw(now) {
    frame = 0;
    if (!brush || signal.aborted) return;
    strokes = strokes.filter(point => point.pinned || now - point.time < lifespan);
    brush.globalCompositeOperation = 'source-over';
    brush.clearRect(0,0,canvas.width,canvas.height);
    if(masked){
      const scale=Math.min(canvas.width/masked.naturalWidth,canvas.height/masked.naturalHeight);
      const w=masked.naturalWidth*scale,h=masked.naturalHeight*scale;
      brush.drawImage(masked,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
    } else {
      brush.fillStyle = '#dae5e0';
      brush.fillRect(0, 0, canvas.width, canvas.height);
      brush.strokeStyle = '#6b8b7e35';
      const step = Math.max(12, canvas.width / 23);
      for (let x = step; x < canvas.width; x += step) {
        brush.beginPath();brush.moveTo(x, 0);brush.lineTo(x - canvas.width / 4, canvas.height);brush.stroke();
      }
    }
    for (const point of strokes) {
      const age = point.pinned ? 0 : (now - point.time) / lifespan;
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;
      const radius = canvas.width * (.13 - .06 * age);
      if(masked){
        brush.globalCompositeOperation='source-atop';
        const edge=brush.createRadialGradient(x,y,radius*.55,x,y,radius*1.08);
        edge.addColorStop(0,'transparent');edge.addColorStop(.74,'rgba(191,28,51,'+Math.max(0,.57*(1-age))+')');edge.addColorStop(1,'transparent');
        brush.fillStyle=edge;brush.fillRect(x-radius*1.1,y-radius*1.1,radius*2.2,radius*2.2);
      }
      brush.globalCompositeOperation = 'destination-out';
      const fade = brush.createRadialGradient(x, y, radius * .5, x, y, radius);
      fade.addColorStop(0, 'rgba(0,0,0,' + (1 - age) + ')');
      fade.addColorStop(1, 'transparent');
      brush.fillStyle = fade;
      brush.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    if (strokes.some(point => !point.pinned)) queue();
  }
  function queue() { if (!frame && !signal.aborted) frame = requestAnimationFrame(draw); }
  function setPinned(value) {
    const [x,y]=options.focus??[.5,.5];
    strokes = value ? [{ x, y, time: performance.now(), pinned: true }] : [];
    surface.toggleAttribute('data-reveal', value);
    toggle.setAttribute('aria-pressed', String(value));
    queue();
  }
  const resize = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    const density = Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.max(1, Math.round(width * density));
    canvas.height = Math.max(1, Math.round(height * density));
    queue();
  });
  resize.observe(surface);
  listen(surface, 'pointermove', event => {
    if (!brush || reduced.matches || toggle.getAttribute('aria-pressed') === 'true') return;
    const box = surface.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    strokes.push({ x, y, time: performance.now() });
    if (strokes.length > 30) strokes.shift();
    queue();
  }, signal);
  listen(surface, 'pointerdown', event => { if (event.pointerType === 'touch') setPinned(true); }, signal);
  listen(toggle, 'click', () => setPinned(toggle.getAttribute('aria-pressed') === 'false'), signal);
  listen(control(root, 'button:last-child'), 'click', () => setPinned(false), signal);
  signal.addEventListener('abort', () => { resize.disconnect(); cancelAnimationFrame(frame); }, { once: true });
}

export { glassTransfer } from './fidelity-glass.mjs';
