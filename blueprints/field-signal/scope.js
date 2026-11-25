const plot = document.querySelector('.plot');
const canvas = plot.querySelector('canvas');
const ctx = canvas.getContext('2d');
const controls = document.querySelector('#hardware');
const action = document.querySelector('#sweep');
const roller = document.querySelector('#roll');
const actionLabel = action.querySelector('.play-label');
const screenState = document.querySelector('#screen-state');
const screenMode = document.querySelector('#screen-mode');
const announcement = document.querySelector('#announcement');
const modeButtons = [...document.querySelectorAll('[data-wave]')];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const weights = [1, 0, 0];
const waves = [
  {name: 'Sine', sample: x => x},
  {name: 'Triangle', sample: x => 2 * Math.asin(x) / Math.PI},
  {name: 'Square', sample: x => Math.tanh(x * 31)}
];
const duration = 1450;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const config = {
  gain: {min: 0, max: 100, value: 42, visual: 42, velocity: 0, unit: 'percent', key: 2},
  frequency: {min: 4, max: 32, value: 12, visual: 12, velocity: 0, unit: 'hertz', key: 1}
};
let mode = 0;
let elapsed = 0;
let afterglow = 0;
let playback = 'ready';
let frame = 0;
let last = 0;
let width = 0;
let height = 0;
let grid;
let phase = 0;
let live = false;
let startup = 1;

function resize() {
  const rect = plot.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  if (!width || !height) return;
  const scale = Math.min(devicePixelRatio, 2);
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
  grid = document.createElement('canvas');
  grid.width = canvas.width;
  grid.height = canvas.height;
  const backdrop = grid.getContext('2d');
  backdrop.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
  const x = width - 1;
  const y = height - 1;
  backdrop.lineWidth = 1;
  backdrop.strokeStyle = '#4a55465c';
  backdrop.strokeRect(.5, .5, x, y);
  for (let i = 1; i < 16; i++) {
    const a = Math.round(x * i / 16) + .5;
    const b = Math.round(y * i / 16) + .5;
    backdrop.strokeStyle = i === 8 ? '#96a18078' : i % 4 === 0 ? '#64725982' : '#64725926';
    backdrop.beginPath();
    backdrop.moveTo(a, 1);
    backdrop.lineTo(a, i % 4 === 0 ? y : 6);
    if (i % 4 !== 0) {
      backdrop.moveTo(a, y);
      backdrop.lineTo(a, y - 5);
      backdrop.moveTo(a, y * .5 - 4);
      backdrop.lineTo(a, y * .5 + 4);
    }
    backdrop.moveTo(1, b);
    backdrop.lineTo(i % 4 === 0 ? x : 6, b);
    if (i % 4 !== 0) {
      backdrop.moveTo(x - 6, b);
      backdrop.lineTo(x, b);
    }
    backdrop.stroke();
  }
  draw();
}

function trace(x) {
  const time = x / width * .2;
  const level = Math.sin(time * 2 * Math.PI * config.frequency.visual + phase);
  const sample = weights.reduce((sum, weight, i) => sum + weight * waves[i].sample(level), 0);
  const open = 1 - Math.pow(1 - startup, 3);
  return height * .5 - sample * open * (config.gain.visual / 100) * height * .46;
}
function stroke(path, color, weight) {
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  ctx.stroke(path);
}
function draw() {
  if (!width || !height) return;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(grid, 0, 0, width, height);
  const current = new Path2D();
  const samples = Math.ceil(width);
  for (let i = 0; i <= samples; i++) {
    const x = width * i / samples;
    if (i === 0) current.moveTo(x, trace(x));
    else current.lineTo(x, trace(x));
  }
  const active = playback === 'running' || playback === 'paused';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  stroke(current, active ? '#a7c38680' : '#c6e89232', active ? 1.2 : 5);
  if (!active) {
    stroke(current, '#dbffab', 1.8);
    if (afterglow > 0) stroke(current, 'rgba(235,255,182,' + afterglow.toFixed(3) + ')', 3.2);
    return;
  }

  const cursor = clamp(elapsed / duration, 0, 1) * width;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, cursor + 1, height);
  ctx.clip();
  stroke(current, '#ccff8d35', 7);
  stroke(current, '#dfffad', 2);
  ctx.restore();

  const tail = Math.min(cursor, 53);
  if (tail > 1) {
    const gradient = ctx.createLinearGradient(cursor - tail, 0, cursor, 0);
    gradient.addColorStop(0, '#a1e58100');
    gradient.addColorStop(1, '#a1e5812e');
    ctx.fillStyle = gradient;
    ctx.fillRect(cursor - tail, 1, tail, height - 2);
  }
  const rail = new Path2D();
  rail.moveTo(cursor, 0);
  rail.lineTo(cursor, height);
  stroke(rail, '#d4f7ad9e', 1.1);
  ctx.beginPath();
  ctx.arc(cursor, trace(cursor), 3.1, 0, Math.PI * 2);
  ctx.fillStyle = '#e6ffc4';
  ctx.fill();
}

function updateName() {
  const wave = waves[mode].name;
  screenMode.textContent = wave;
  plot.setAttribute('aria-label', wave + ' signal. ' + config.frequency.value + ' hertz. ' + config.gain.value + ' percent gain.');
}
function charge(name) {
  const knob = config[name];
  const turn = (knob.visual - knob.min) / (knob.max - knob.min);
  knob.node.style.setProperty('--angle', (-135 + 270 * turn).toFixed(2) + 'deg');
}
function setValue(name, requested, drag = false) {
  const knob = config[name];
  const position = clamp(requested, knob.min, knob.max);
  const value = Math.round(position);
  if (value !== knob.value) {
    knob.value = value;
    knob.output.value = String(value);
    knob.node.setAttribute('aria-valuenow', String(value));
    knob.node.setAttribute('aria-valuetext', value + ' ' + knob.unit);
    updateName();
  }
  if (reduce.matches) {
    knob.visual = value;
    knob.velocity = 0;
    charge(name);
    draw();
    return;
  }
  if (drag) {
    knob.visual = position;
    knob.velocity = 0;
  }
  wake();
}
function attach(name, knob) {
  const group = document.querySelector('[data-knob=' + name + ']');
  knob.node = group.querySelector('.dial');
  knob.output = document.querySelector('#' + name + '-output');
  let gesture;
  knob.node.addEventListener('pointerdown', event => {
    if (gesture || event.button !== 0) return;
    knob.node.focus({preventScroll: true});
    knob.node.setPointerCapture(event.pointerId);
    knob.node.dataset.dragging = '';
    gesture = {id: event.pointerId, x: event.clientX, y: event.clientY, value: knob.visual};
    knob.grabbed = true;
  });
  knob.node.addEventListener('pointermove', event => {
    if (event.pointerId !== gesture?.id) return;
    const travel = (event.clientX - gesture.x) * .65 - (event.clientY - gesture.y);
    setValue(name, gesture.value + travel * ((knob.max - knob.min) / 130), true);
  });
  function release(event) {
    if (event.pointerId !== gesture?.id) return;
    gesture = undefined;
    knob.grabbed = false;
    delete knob.node.dataset.dragging;
    if (knob.visual !== knob.value) wake();
  }
  for (const type of ['pointerup','pointercancel','lostpointercapture']) knob.node.addEventListener(type, release);
  knob.node.addEventListener('keydown', event => {
    const adjustment = {ArrowUp: knob.key, ArrowRight: knob.key, ArrowDown: -knob.key, ArrowLeft: -knob.key, PageUp: knob.key * 5, PageDown: -knob.key * 5};
    const next = event.key === 'Home' ? knob.min : event.key === 'End' ? knob.max : knob.value + adjustment[event.key];
    if (!Number.isFinite(next)) return;
    event.preventDefault();
    setValue(name, next);
  });
  for (const button of group.querySelectorAll('[data-delta]')) {
    button.addEventListener('click', () => setValue(name, knob.value + knob.key * Number(button.dataset.delta)));
  }
  charge(name);
}
function response(knob, dt) {
  if (knob.grabbed) return false;
  const displacement = knob.visual - knob.value;
  const omega = 23;
  const slope = knob.velocity + omega * displacement;
  const decay = Math.exp(-omega * dt);
  knob.visual = knob.value + (displacement + slope * dt) * decay;
  knob.velocity = (knob.velocity - omega * slope * dt) * decay;
  if (Math.abs(knob.visual - knob.value) < .045 && Math.abs(knob.velocity) < .07) {
    knob.visual = knob.value;
    knob.velocity = 0;
  }
  return knob.velocity !== 0 || knob.visual !== knob.value;
}

function setPlayback(state) {
  playback = state;
  action.dataset.state = state;
  actionLabel.textContent = state === 'running' ? 'Pause' : state === 'paused' ? 'Resume' : 'Sweep';
  if (state === 'ready') screenState.textContent = live ? 'ROLLING' : 'READY';
  if (state === 'paused') screenState.textContent = 'HOLD';
  if (state === 'captured') screenState.textContent = 'CAPTURED';
}
function finish() {
  setPlayback('captured');
  afterglow = reduce.matches ? 0 : .78;
  announcement.textContent = 'Sweep captured.';
}
function wake() {
  if (frame) return;
  last = performance.now();
  frame = requestAnimationFrame(tick);
}
function tick(now) {
  const dt = clamp((now - last) / 1000, 0, .05);
  last = now;
  let moving = false;
  for (const [name, knob] of Object.entries(config)) {
    moving = response(knob, dt) || moving;
    charge(name);
  }
  const mix = 1 - Math.exp(-16 * dt);
  for (let i = 0; i < weights.length; i++) {
    const target = Number(i === mode);
    weights[i] += (target - weights[i]) * mix;
    if (Math.abs(target - weights[i]) < .001) weights[i] = target;
    else moving = true;
  }
  if (playback === 'running') {
    elapsed = Math.min(duration, elapsed + dt * 1000);
    const clock = String(Math.round(elapsed / duration * 200)).padStart(3, '0');
    if (screenState.textContent !== clock + ' ms') screenState.textContent = clock + ' ms';
    if (elapsed === duration) finish();
    else moving = true;
  }
  if (afterglow) {
    afterglow = Math.max(0, afterglow - dt * 2);
    moving = true;
  }
  if (startup < 1) {
    startup = Math.min(1, startup + dt / .72);
    moving = true;
  }
  if (live) {
    phase = (phase - dt * 3.1) % (Math.PI * 2);
    moving = true;
  }
  draw();
  frame = moving ? requestAnimationFrame(tick) : 0;
}

if (ctx) {
  for (const [name, knob] of Object.entries(config)) attach(name, knob);
  modeButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      mode = index;
      modeButtons.forEach((other, i) => other.setAttribute('aria-pressed', String(i === mode)));
      updateName();
      if (reduce.matches) {
        for (let i = 0; i < weights.length; i++) weights[i] = Number(i === mode);
        draw();
      } else wake();
    });
  });
  action.addEventListener('click', () => {
    live = false;
    roller.setAttribute('aria-pressed', 'false');
    if (reduce.matches) {
      finish();
      draw();
    } else if (playback === 'running') {
      setPlayback('paused');
      announcement.textContent = 'Sweep paused.';
    } else {
      if (playback !== 'paused') elapsed = 0;
      afterglow = 0;
      screenState.textContent = String(Math.round(elapsed / duration * 200)).padStart(3, '0') + ' ms';
      setPlayback('running');
      announcement.textContent = 'Sweep running.';
      wake();
    }
  });
  roller.addEventListener('click', () => {
    if (reduce.matches) {
      announcement.textContent = 'Signal remains still with reduced motion enabled.';
      return;
    }
    live = !live;
    roller.setAttribute('aria-pressed', String(live));
    setPlayback('ready');
    if (live) wake();
  });
  reduce.addEventListener('change', () => {
    if (!reduce.matches) return;
    cancelAnimationFrame(frame);
    frame = 0;
    live = false;
    startup = 1;
    roller.setAttribute('aria-pressed', 'false');
    if (playback === 'ready') setPlayback('ready');
    for (const [name, knob] of Object.entries(config)) {
      knob.visual = knob.value;
      knob.velocity = 0;
      charge(name);
    }
    for (let i = 0; i < weights.length; i++) weights[i] = Number(i === mode);
    if (playback === 'paused' || playback === 'running') finish();
    afterglow = 0;
    draw();
  });
  resize();
  new ResizeObserver(resize).observe(plot);
  plot.classList.add('ready');
  controls.disabled = false;
  action.disabled = false;
  setPlayback('ready');
  if (!reduce.matches) {
    startup = .18;
    wake();
  }
}
