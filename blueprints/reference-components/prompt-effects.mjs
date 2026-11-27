import { control, controls, listen, motion, timer } from './shared.mjs';

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
  listen(video, 'play', () => { button.textContent = 'Pause background'; }, signal);
  listen(video, 'pause', () => { button.textContent = 'Play background'; }, signal);
  listen(button, 'click', async () => {
    if (!video.paused) { video.pause(); return; }
    try { await video.play(); }
    catch { if (!signal.aborted) status.textContent = 'The video is unavailable.'; }
  }, signal);
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => !entry.isIntersecting)) video.pause();
  });
  observer.observe(video);
  signal.addEventListener('abort', () => { video.pause(); observer.disconnect(); }, { once: true });
}

export function unmaskTrail(root, { signal }) {
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
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function draw(now) {
    frame = 0;
    if (!brush || signal.aborted) return;
    strokes = strokes.filter(point => point.pinned || now - point.time < lifespan);
    brush.globalCompositeOperation = 'source-over';
    brush.fillStyle = '#dae5e0';
    brush.fillRect(0, 0, canvas.width, canvas.height);
    brush.strokeStyle = '#6b8b7e35';
    const step = Math.max(12, canvas.width / 23);
    for (let x = step; x < canvas.width; x += step) {
      brush.beginPath();
      brush.moveTo(x, 0);
      brush.lineTo(x - canvas.width / 4, canvas.height);
      brush.stroke();
    }
    brush.globalCompositeOperation = 'destination-out';
    for (const point of strokes) {
      const age = point.pinned ? 0 : (now - point.time) / lifespan;
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;
      const radius = canvas.width * (.13 - .06 * age);
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
    strokes = value ? [{ x: .5, y: .5, time: performance.now(), pinned: true }] : [];
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

export function glassTransfer(root, { signal }) {
  root.innerHTML = `
    <div class="glass-stage">
      <div class="glass-view">
        <div class="glass-shards" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="glass-copy"><h3>Material in motion</h3><p>Reflection changes with the viewing angle.</p><button type="button" data-open-paper>Read material notes</button></div>
      </div>
      <div class="glass-paper" hidden>
        <h3 tabindex="-1">Material notes</h3><p><strong>Transmission.</strong> Light travelling through a surface.</p>
        <p><strong>Roughness.</strong> How widely a surface scatters the reflected light.</p>
        <button type="button" data-close-paper>Back to material</button>
      </div>
    </div>
  `;
  const stage = control(root, '.glass-stage');
  const view = control(root, '.glass-view');
  const paper = control(root, '.glass-paper');
  const shards = controls(root, '.glass-shards i');
  const copy = control(root, '.glass-copy');
  const open = control(root, '[data-open-paper]');
  const back = control(root, '[data-close-paper]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const vectors = [[-63, -35], [5, -56], [75, -20], [-41, 48], [60, 65]];
  let pending;
  function move(event) {
    if (reduced.matches || view.inert) return;
    const box = stage.getBoundingClientRect();
    const dx = (event.clientX - box.left) / box.width - .5;
    const dy = (event.clientY - box.top) / box.height - .5;
    view.style.setProperty('--tilt-x', (-dy * 9) + 'deg');
    view.style.setProperty('--tilt-y', (dx * 11) + 'deg');
  }
  function restoreTilt() {
    view.style.removeProperty('--tilt-x');
    view.style.removeProperty('--tilt-y');
  }
  function animateShards(opening) {
    shards.forEach((shard, index) => {
      for (const animation of shard.getAnimations()) animation.cancel();
      const [x, y] = vectors[index];
      const origin = { transform: 'none', opacity: 1 };
      const departed = { transform: `translate3d(${x}px,${y}px,50px) rotate(${index * 8 - 15}deg)`, opacity: 0 };
      motion(shard, opening ? [origin, departed] : [departed, origin],
        { duration: 720, delay: index * 32, fill: opening ? 'forwards' : 'backwards',
          easing: opening ? 'cubic-bezier(.7,.02,.9,.5)' : 'cubic-bezier(.2,.8,.25,1.13)' }, signal);
    });
    for (const animation of copy.getAnimations()) animation.cancel();
    const origin = { transform: 'none', opacity: 1 };
    const departed = { transform: 'translate3d(-45px,-24px,40px) rotate(-8deg)', opacity: 0 };
    motion(copy, opening ? [origin, departed] : [departed, origin],
      { duration: 560, fill: opening ? 'forwards' : 'backwards', easing: 'cubic-bezier(.25,.76,.24,1)' }, signal);
  }
  listen(stage, 'pointermove', move, signal);
  listen(stage, 'pointerleave', restoreTilt, signal);
  listen(open, 'click', () => {
    view.inert = true;
    restoreTilt();
    animateShards(true);
    pending = timer(() => {
      view.hidden = true;
      paper.hidden = false;
      control(paper, 'h3').focus();
    }, reduced.matches ? 0 : 850, signal);
  }, signal);
  listen(back, 'click', () => {
    pending?.();
    paper.hidden = true;
    view.hidden = false;
    view.inert = false;
    animateShards(false);
    open.focus();
  }, signal);
}
