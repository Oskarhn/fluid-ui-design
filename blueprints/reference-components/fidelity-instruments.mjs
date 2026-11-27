import { control, controls, listen, scope, selectorKeys } from './shared.mjs';

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const interpolate = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);

function animator(target, paint, signal) {
  let inView = false;
  let frame;
  let previous;
  let time = 0;
  function tick(now) {
    if (signal.aborted || !inView || document.hidden) { frame = undefined; previous = undefined; return; }
    if (previous === undefined || now - previous >= 28) {
      const delta = previous === undefined ? 0 : Math.min((now - previous) / 1000, .095);
      previous = now;
      time += delta;
      paint(time, delta);
    }
    frame = reducedMotion() ? undefined : requestAnimationFrame(tick);
  }
  function start() {
    if (!frame && inView && !signal.aborted && !document.hidden) frame = requestAnimationFrame(tick);
  }
  const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; start(); });
  observer.observe(target);
  listen(document, 'visibilitychange', start, signal);
  signal.addEventListener('abort', () => { observer.disconnect(); cancelAnimationFrame(frame); }, { once: true });
  return () => paint(time, 0);
}

function generator(seed) {
  let value = seed;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const datasets = [
  { label: 'All patients', counts: [12480,8960,7310,5842], colors: [[133,23,49],[174,139,65]], shape:[.91,.48,.33,.24,.24] },
  { label: 'In-clinic', counts: [3869,2957,2485,2103], colors: [[114,9,33],[181,45,86]], shape:[.92,.52,.43,.31,.31] },
  { label: 'Telehealth', counts: [2246,1523,1316,993], colors: [[90,28,174],[183,85,177]], shape:[.91,.41,.31,.22,.22] }
];
const formatted = new Intl.NumberFormat('en-US');

export function conversionFunnel(root, { signal }) {
  const id = scope(root);
  root.innerHTML = `
    <div class="funnel-stage">
      <div class="funnel-board">
        <header class="funnel-header"><div class="funnel-selector" role="tablist" aria-label="Patient type"></div>
          <div class="funnel-filter"><span>◈ &nbsp; Patient flow</span><label>Range <select aria-label="Reporting period"><option>Last 30 days</option><option>Last 90 days</option></select></label><label>Department <select aria-label="Department"><option>All departments</option><option>Primary care</option><option>Specialty care</option></select></label></div></header>
        <div class="funnel-readings" id="${id}-flow" role="tabpanel" tabindex="0"></div>
        <div class="funnel-drawing"><canvas width="700" height="320" aria-hidden="true"></canvas>
          <div class="funnel-total"><span>Conversion rate</span><output aria-live="polite">46.8%</output><small>of activated patients</small></div></div>
        <p class="funnel-caption">Patient journey · sample data</p>
      </div>
    </div>
  `;
  const bar = control(root, '.funnel-selector');
  const readings = control(root, '.funnel-readings');
  const total = control(root, 'output');
  const range = control(root, '[aria-label="Reporting period"]');
  const department = control(root, '[aria-label="Department"]');
  const canvas = control(root, 'canvas');
  const context = canvas.getContext('2d');
  const actions = datasets.map(({ label }, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.id = id + '-type-' + i;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', readings.id);
    listen(button, 'click', () => select(i), signal);
    return button;
  });
  bar.append(...actions);
  selectorKeys(bar, actions, select, signal);
  const read = ['Activated', 'Reached', 'Engaged', 'Converted'].map(label => {
    const unit = document.createElement('div');
    const name = document.createElement('span');
    name.textContent = label;
    const count = document.createElement('strong');
    const ratio = document.createElement('small');
    unit.append(name, count, ratio);
    readings.append(unit);
    return {count, ratio};
  });
  const random = generator(617);
  const sparks = Array.from({ length: 800 }, () => ({
    along: random(), cross: (random() - .5) * 1.95,
    stride: .032 + random() * .12, light: .16 + random() * .46, size: .8 + random() * 5
  }));
  let selected = 0;
  let shape = [...datasets[0].shape];
  let colors = datasets[0].colors.map(col => [...col]);
  let paintOnce;
  function select(index) {
    selected = index;
    const dataset = datasets[index];
    const counts = dataset.counts.map((value, stage) => {
      const period = range.selectedIndex ? 2.65 - stage * .068 : 1;
      const cohort = department.selectedIndex === 1 ? .72 - stage * .034
        : department.selectedIndex === 2 ? .41 + stage * .023 : 1;
      return Math.round(value * period * cohort);
    });
    actions.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
    readings.setAttribute('aria-labelledby', actions[index].id);
    read.forEach(({ count, ratio }, i) => {
      count.textContent = formatted.format(counts[i]);
      ratio.textContent = (100 * counts[i] / counts[0]).toFixed(1) + '%';
    });
    total.textContent = (100 * counts[3] / counts[0]).toFixed(1) + '%';
    if (reducedMotion()) {
      shape = [...dataset.shape];
      colors = dataset.colors.map(c => [...c]);
    }
    paintOnce?.();
  }
  listen(range, 'change', () => select(selected), signal);
  listen(department, 'change', () => select(selected), signal);
  const draw = (time, delta) => {
    if (!context) return;
    const next = datasets[selected];
    const blend = 1 - Math.exp(-delta * 11);
    shape = shape.map((v, i) => interpolate(v, next.shape[i], blend));
    colors = colors.map((color, i) => color.map((v, j) => interpolate(v, next.colors[i][j], blend)));
    const { width: w, height: h } = canvas;
    const center = h * .49;
    function extent(fraction) {
      const index = Math.min(3, Math.floor(fraction * 4));
      const position = clamp((fraction * 4 - index) * 1.45, 0, 1);
      return interpolate(shape[index], shape[index + 1], smooth(position)) * h * .43;
    }
    const contour = new Path2D();
    for (let x = 0; x <= 80; x++) contour.lineTo(w * x / 80, center - extent(x / 80));
    for (let x = 80; x >= 0; x--) contour.lineTo(w * x / 80, center + extent(x / 80));
    contour.closePath();
    function shade(position, alpha) {
      const rgb = colors[0].map((v, i) => Math.round(interpolate(v, colors[1][i], position)));
      return 'rgba(' + rgb.join(',') + ',' + alpha + ')';
    }
    context.clearRect(0, 0, w, h);
    const field = context.createLinearGradient(0, 0, w, 0);
    field.addColorStop(0, shade(0, .69));
    field.addColorStop(1, shade(1, .54));
    context.save();
    context.shadowColor = shade(.35, .88);
    context.shadowBlur = 15;
    context.fillStyle = field;
    context.fill(contour);
    context.restore();
    context.save();
    context.clip(contour);
    const pulse = (time * .49) % 1.4 - .2;
    const sweep = context.createLinearGradient((pulse - .095) * w, 0, (pulse + .15) * w, 0);
    sweep.addColorStop(0, 'transparent');
    sweep.addColorStop(.37, 'rgba(255,245,205,.65)');
    sweep.addColorStop(.55, 'rgba(255,224,199,.18)');
    sweep.addColorStop(1, 'transparent');
    context.fillStyle = sweep;
    if (!reducedMotion()) context.fillRect(0, 0, w, h);
    for (const particle of sparks) {
      const phase = (particle.along + time * particle.stride) % 1;
      const x = phase * w;
      const y = center + extent(phase) * particle.cross + Math.sin(time * 1.7 + particle.along * 17) * 1.5;
      const highlight = Math.max(0, 1 - Math.abs(phase - pulse) * 11);
      context.fillStyle = 'rgba(255,221,184,' + (particle.light * (.46 + highlight * .6)) + ')';
      context.fillRect(x, y, 1.1 + particle.size * (1 + highlight), .65 + highlight);
    }
    context.strokeStyle = 'rgba(255,241,203,.56)';
    context.lineWidth = 2.1;
    for (const x of [.25,.5,.75,.995]) {
      context.beginPath(); context.moveTo(w * x, 0); context.lineTo(w * x, h); context.stroke();
    }
    context.restore();
    context.lineWidth = 2.3;
    context.strokeStyle = shade(.67,.85);
    context.stroke(contour);
    context.lineWidth = 1;
    context.strokeStyle = 'rgba(255,222,186,.35)';
    context.stroke(contour);
  };
  paintOnce = animator(canvas, draw, signal);
  select(0);
}

const palette = [
  [0, 0,0,0], [.08, 10,0,0], [.27, 82,4,4],
  [.46, 180,17,4], [.62, 247,57,15], [.78, 255,140,48],
  [.90, 255,216,116], [1, 255,251,220]
];
const flameColors = new Uint8ClampedArray(256 * 4);
{
  let band = 0;
  for (let i = 0; i < 256; i++) {
    const strength = i / 255;
    while (strength > palette[band + 1][0] && band < palette.length - 2) band++;
    const start = palette[band], end = palette[band + 1];
    const part = (strength - start[0]) / (end[0] - start[0]);
    for (let pixel = 1; pixel < 4; pixel++) flameColors[i * 4 + pixel - 1] = interpolate(start[pixel], end[pixel], part);
    flameColors[i * 4 + 3] = 255;
  }
}
const heatHash = (x, y) => {
  const hash = Math.imul(x | 0, 1597334677) ^ Math.imul(y | 0, 3812015801);
  return (Math.imul(hash ^ hash >>> 16, 2246822519) >>> 0) / 4294967296;
};
function turbulence(x, y) {
  const i = Math.floor(x), j = Math.floor(y);
  const fx = smooth(x - i), fy = smooth(y - j);
  return interpolate(interpolate(heatHash(i, j), heatHash(i+1, j), fx),
    interpolate(heatHash(i,j+1), heatHash(i+1,j+1), fx), fy);
}

export function burnMeter(root, { signal }) {
  root.innerHTML = `
    <div class="energy-stage">
      <div class="energy-phone">
        <div class="energy-status"><span>9:41</span><span aria-hidden="true">▴ ◒ ▰</span></div>
        <div class="energy-screen">
          <div class="energy-history"><div><small>Duration</small><time>04:35</time></div><div><strong>♥</strong> <output data-heart>178</output><small>Zone 4 · Threshold</small></div></div>
          <div class="energy-scale" aria-hidden="true"><span>600</span><span>500</span><span>400</span><span>300</span><span>200</span></div>
          <canvas width="140" height="119" aria-hidden="true"></canvas>
          <div class="energy-reading"><output data-energy>95</output><small>KCAL</small></div>
        </div>
        <div class="energy-modes" aria-label="Sample workout">
          <button type="button" aria-pressed="false">Walk</button><button type="button" aria-pressed="true">Run</button><button type="button" aria-pressed="false">Cycle</button>
        </div>
        <div class="energy-controls">
          <button type="button" aria-label="Reset workout">≡</button><button class="energy-stop" type="button" aria-label="Pause">Ⅱ</button><span aria-hidden="true">•</span>
        </div>
        <div class="energy-indicator" aria-hidden="true"></div>
      </div>
    </div>
  `;
  const canvas = control(root, 'canvas');
  const ctx = canvas.getContext('2d');
  const grid = ctx?.createImageData(canvas.width, canvas.height);
  const stop = control(root, '.energy-stop');
  const clock = control(root, 'time');
  const energy = control(root, '[data-energy]');
  const heart = control(root, '[data-heart]');
  const choices = controls(root, '.energy-modes button');
  let seconds = 0, t = 0, paused = false, mode = 1, calories = 95, heat = .62;
  const levels = [.31,.83,.61];
  const rate = () => levels[mode] * (.69 + .22 * Math.sin(t * .86) + .09 * Math.sin(t * 1.77));
  function setMode(index) {
    mode = index;
    choices.forEach((item, i) => item.setAttribute('aria-pressed', String(i === index)));
    draw();
  }
  choices.forEach((item, i) => listen(item, 'click', () => setMode(i), signal));
  function draw() {
    const duration = 275 + Math.floor(seconds);
    clock.textContent = String(Math.floor(duration / 60)).padStart(2,'0') + ':' + String(duration % 60).padStart(2,'0');
    energy.textContent = String(Math.floor(calories));
    canvas.dataset.heat = heat.toFixed(3);
    heart.textContent = String(Math.round([122,177,149][mode] + Math.sin(t * .66) * 4));
    if (!ctx) return;
    const { width, height } = canvas;
    for (let j = 0; j < width; j++) {
      const x = j / width;
      const shape = .13 + heat * (.47
        + .22 * turbulence(x * 3.1, t * .58 + 8)
        + .13 * turbulence(x * 9 + 12, t * .97));
      for (let y = 0; y < height; y++) {
        const rise = 1 - y / (height - 1);
        const detail = turbulence(x * 9 + rise, rise * 6 - t * 2.55);
        const wisps = turbulence(x * 20 + 3, rise * 8 - t * 3.1);
        const temperature = 1 - rise / (shape + .12 * detail) + (wisps - .46) * .13;
        const grain = (heatHash(j + (t * 36 | 0), y) - .5) * .025;
        const look = clamp(Math.round((temperature + grain) * 255), 0, 255) * 4;
        const index = (y * width + j) * 4;
        grid.data.set(flameColors.subarray(look, look + 4), index);
      }
    }
    ctx.putImageData(grid, 0, 0);
  }
  const update = animator(canvas, (elapsed, delta) => {
    if (paused) return;
    t += delta;
    seconds += delta * 5;
    const intensity = rate();
    calories += intensity * delta * 7.4;
    heat += (intensity - heat) * (1 - Math.exp(-delta * 2.4));
    draw();
  }, signal);
  listen(stop, 'click', () => {
    paused = !paused;
    stop.setAttribute('aria-label', paused ? 'Resume' : 'Pause');
    stop.textContent = paused ? '▶' : 'Ⅱ';
    canvas.toggleAttribute('data-paused', paused);
    if (!paused) update();
  }, signal);
  listen(control(root, '[aria-label="Reset workout"]'), 'click', () => { seconds = 0; t = 0; calories = 95; heat = .62; draw(); }, signal);
  draw();
}
