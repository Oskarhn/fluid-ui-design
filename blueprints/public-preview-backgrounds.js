'use strict';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const toolbar = document.querySelector('.controls');
const options = [...toolbar.querySelectorAll('[data-scene]')];
const playback = document.querySelector('#playback');
const description = document.querySelector('#scene-description');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const W = 960;
const H = 540;
const TAU = Math.PI * 2;

function vertical(top, bottom, y, height) {
  const color = ctx.createLinearGradient(0, y, 0, y + height);
  color.addColorStop(0, top);
  color.addColorStop(1, bottom);
  ctx.fillStyle = color;
  ctx.fillRect(0, y, W, height);
}

function ridge(color, baseline, amp, frequency, phase) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 8) {
    const u = x * frequency;
    const y = baseline + amp * (Math.sin(u + phase) + .42 * Math.cos(2 * u + 2 * phase));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
}

function movingLandscape(phase) {
  vertical('#263d56', '#c38976', 0, H);
  ridge('#5c637a', 251, 38, .007, phase);
  ridge('#3b4d61', 288, 37, .009, 2 * phase + 1.3);
  ridge('#233949', 344, 31, .011, 3 * phase + 2.1);
  ctx.strokeStyle = '#101c21';
  ctx.lineWidth = 91;
  ctx.strokeRect(3, 3, W - 6, H - 6);
  ctx.fillStyle = '#16252a';
  ctx.fillRect(226, 40, 25, 460);
  ctx.fillStyle = '#75928e';
  ctx.fillRect(249, 49, 4, 442);
}

function windowLight(phase) {
  vertical('#192726', '#2a3126', 0, H);
  const lit = ctx.createRadialGradient(720, 76, 10, 720, 76, 510);
  lit.addColorStop(0, '#d59a4e');
  lit.addColorStop(.58, '#7465404f');
  lit.addColorStop(1, '#87975d00');
  ctx.fillStyle = lit;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 6; i++) {
    const origin = 644 + i * 41;
    const shift = 33 * Math.sin(phase + i * .35);
    const wash = ctx.createLinearGradient(origin, 90, origin - 380 + shift, H);
    wash.addColorStop(0, '#ffe3a750');
    wash.addColorStop(.8, '#ffa6581b');
    wash.addColorStop(1, '#ffa65802');
    ctx.fillStyle = wash;
    ctx.beginPath();
    ctx.moveTo(origin, 93);
    ctx.lineTo(origin + 17, 93);
    ctx.lineTo(origin - 241 + shift, H);
    ctx.lineTo(origin - 451 + shift, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#c5a269';
  for (let i = 0; i < 39; i++) {
    const x = 464 + (i * 67 % 440) + 14 * Math.sin(phase + i);
    const y = 105 + (i * 43 % 340) + 11 * Math.cos(phase * 2 + i);
    ctx.globalAlpha = .17 + (i % 5) * .08;
    ctx.fillRect(x, y, i % 3 === 0 ? 3 : 1, 2);
  }
  ctx.globalAlpha = 1;
}

function waterReflection(phase) {
  vertical('#182c4a', '#8d6381', 0, H);
  const glow = ctx.createRadialGradient(705, 187, 15, 705, 187, 270);
  glow.addColorStop(0, '#ffcc9f');
  glow.addColorStop(.26, '#cd887570');
  glow.addColorStop(1, '#6b518900');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 310);
  ridge('#30384f', 252, 24, .008, 2);
  ridge('#27354c', 282, 17, .016, 1);
  vertical('#394c64', '#162235', 287, 253);
  const shine = ctx.createLinearGradient(510, 0, 870, 0);
  shine.addColorStop(0, '#e1a89b00');
  shine.addColorStop(.57, '#ffc49f84');
  shine.addColorStop(1, '#cc83ab00');
  ctx.strokeStyle = shine;
  for (let line = 0; line < 37; line++) {
    const y = 298 + line * 6.7;
    const center = 694 + 18 * Math.sin(line * .9 + phase);
    const width = 18 + line * 3 + 14 * Math.cos(phase + line);
    ctx.lineWidth = line % 5 === 0 ? 2.5 : 1;
    ctx.beginPath();
    ctx.moveTo(center - width, y);
    ctx.lineTo(center + width, y + Math.sin(line) * 3);
    ctx.stroke();
  }
}

function layeredArches(phase) {
  vertical('#1c3129', '#0e201c', 0, H);
  ctx.fillStyle = '#859571';
  ctx.fillRect(593, 136, 241, 325);
  const sway = Math.sin(phase) * 8;
  for (let layer = 6; layer >= 0; layer--) {
    const radius = 49 + (6 - layer) * 54;
    const x = 670 + (6 - layer) * (sway - 24);
    const y = 279 + (6 - layer) * 8;
    ctx.strokeStyle = ['#22382e', '#293e30', '#344936', '#435741', '#53654a', '#667756', '#798766'][layer];
    ctx.lineWidth = 25 + (6 - layer) * 5;
    ctx.beginPath();
    ctx.moveTo(x - radius, H + 28);
    ctx.lineTo(x - radius, y);
    ctx.arc(x, y, radius, Math.PI, TAU);
    ctx.lineTo(x + radius, H + 28);
    ctx.stroke();
  }
  ctx.fillStyle = '#cfd3a8';
  for (let i = 0; i < 27; i++) {
    const x = 438 + (i * 53 % 438) + 3 * sway * Math.cos(i);
    const y = 168 + (i * 61 % 360) + 5 * Math.cos(i + phase);
    ctx.globalAlpha = .1 + (i % 6) * .06;
    ctx.beginPath();
    ctx.ellipse(x, y, i % 5 + 2, 1.6, i, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

const scenes = {
  window: [movingLandscape, 'A fixed opening frames two moving horizons.'],
  light: [windowLight, 'A fixed aperture casts light across a quiet room.'],
  water: [waterReflection, 'A stable shoreline separates the light from its broken reflection.'],
  arches: [layeredArches, 'Overlapping arches give a slow lateral shift a sense of depth.'],
};

function renderBackground(name, phase) {
  scenes[name][0](phase);
  const shade = ctx.createLinearGradient(0, 0, 620, 0);
  shade.addColorStop(0, '#111d20d1');
  shade.addColorStop(.55, '#111d2047');
  shade.addColorStop(1, '#111d2000');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
}

if (ctx) {
  let scene = 'window';
  let active = false;
  let inView = true;
  let frame;
  let previous;
  let phase = 0;

  function tick(now) {
    if (previous !== undefined) phase = (phase + TAU * Math.min(65, now - previous) / 8000) % TAU;
    previous = now;
    renderBackground(scene, phase);
    frame = requestAnimationFrame(tick);
  }

  function syncMotion() {
    cancelAnimationFrame(frame);
    previous = undefined;
    if (active && inView && !document.hidden && !reduce.matches) frame = requestAnimationFrame(tick);
  }

  function applyPreference() {
    if (reduce.matches && document.activeElement === playback) {
      options.find(option => option.dataset.scene === scene)?.focus();
    }
    playback.hidden = reduce.matches;
    if (reduce.matches) active = false;
    playback.setAttribute('aria-pressed', String(active));
    syncMotion();
  }

  for (const option of options) {
    option.addEventListener('click', () => {
      scene = option.dataset.scene;
      phase = 0;
      for (const button of options) button.setAttribute('aria-pressed', String(button === option));
      description.textContent = scenes[scene][1];
      renderBackground(scene, phase);
    });
  }
  playback.addEventListener('click', () => {
    active = !active;
    playback.setAttribute('aria-pressed', String(active));
    syncMotion();
  });
  reduce.addEventListener('change', applyPreference);
  document.addEventListener('visibilitychange', syncMotion);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncMotion();
  }).observe(canvas);
  toolbar.hidden = false;
  applyPreference();
  renderBackground(scene, phase);
}
