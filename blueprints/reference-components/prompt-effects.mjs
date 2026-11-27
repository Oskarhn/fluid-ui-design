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

export { glassTransfer } from './fidelity-glass.mjs';
