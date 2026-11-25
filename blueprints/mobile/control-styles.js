'use strict';

const root = document.documentElement;
const range = document.querySelector('#level');
const readout = document.querySelector('#level-readout');
const status = document.querySelector('#adjust-status');
const dial = document.querySelector('.dial');
const curve = document.querySelector('.waveform');
const ink = curve.getContext('2d');
const presets = [...document.querySelectorAll('[data-value]')];
const styles = [...document.querySelectorAll('[data-style-choice]')];
const clamp = value => Math.min(100, Math.max(0, value));
let drag;

function drawInkMark() {
  const pen = document.querySelector('.ink-mark').getContext('2d');
  if (!pen) return;
  pen.strokeStyle = '#2832a0';
  pen.lineCap = 'round';
  pen.lineJoin = 'round';
  pen.lineWidth = 5;
  pen.beginPath();
  pen.moveTo(75, 99);
  pen.bezierCurveTo(83, 83, 83, 74, 75, 66);
  pen.bezierCurveTo(61, 55, 58, 36, 66, 18);
  pen.bezierCurveTo(70, 9, 78, 13, 77, 23);
  pen.bezierCurveTo(73, 39, 76, 54, 88, 56);
  pen.bezierCurveTo(101, 57, 108, 41, 108, 23);
  pen.bezierCurveTo(109, 12, 119, 12, 120, 23);
  pen.bezierCurveTo(124, 48, 112, 63, 101, 72);
  pen.bezierCurveTo(90, 82, 91, 92, 90, 101);
  pen.stroke();
  pen.lineWidth = 3.5;
  for (const [x, y, dx, dy] of [[51, 38, -14, -7], [48, 54, -13, 3], [135, 32, 17, -10], [139, 48, 12, 3], [90, 15, 2, -8]]) {
    pen.beginPath();
    pen.moveTo(x, y);
    pen.quadraticCurveTo(x + dx * .54, y + dy * .75 + 2, x + dx, y + dy);
    pen.stroke();
  }
}

function drawSignal() {
  if (!ink) return;
  const { width, height } = curve;
  const mid = height / 2;
  const css = getComputedStyle(root);
  const value = range.valueAsNumber;
  const handDrawn = root.dataset.style === 'ink';
  ink.clearRect(0, 0, width, height);
  ink.strokeStyle = css.getPropertyValue('--grid-line').trim();
  ink.lineWidth = 1;
  for (let row = 0; row <= 4; row++) {
    ink.beginPath();
    ink.moveTo(14, 22 + row * (height - 44) / 4);
    ink.lineTo(width - 14, 22 + row * (height - 44) / 4);
    ink.stroke();
  }
  ink.strokeStyle = css.getPropertyValue('--signal').trim();
  ink.lineCap = 'round';
  ink.lineJoin = 'round';
  ink.lineWidth = 4;
  ink.beginPath();
  for (let x = 14; x <= width - 14; x += 3) {
    const u = (x - 14) / (width - 28);
    const envelope = Math.sin(Math.PI * u) ** 1.6;
    const signal = Math.sin(u * 46) + .27 * Math.sin(u * 94);
    const pencil = handDrawn ? Math.sin(x * .71) * (value / 80) : 0;
    const y = mid + envelope * (signal * value * .72 + pencil);
    if (x === 14) ink.moveTo(x, y);
    else ink.lineTo(x, y);
  }
  ink.stroke();
}

function setLevel(value, announce = false) {
  const level = Math.round(clamp(value));
  range.value = String(level);
  range.setAttribute('aria-valuetext', level + ' percent');
  readout.value = level + '%';
  if (announce) status.textContent = 'Output ' + level + ' percent';
  dial.style.setProperty('--sweep', (level * 2.7) + 'deg');
  dial.style.setProperty('--turn', (-135 + level * 2.7) + 'deg');
  for (const preset of presets) {
    preset.setAttribute('aria-pressed', String(Number(preset.dataset.value) === level));
  }
  drawSignal();
}

function chooseStyle(value, updateUrl = false) {
  if (!styles.some(option => option.dataset.styleChoice === value)) return;
  root.dataset.style = value;
  for (const option of styles) {
    option.setAttribute('aria-pressed', String(option.dataset.styleChoice === value));
  }
  if (updateUrl) history.replaceState(null, '', '#' + value);
  drawSignal();
}

function angle(event) {
  const frame = dial.getBoundingClientRect();
  const x = event.clientX - (frame.x + frame.width / 2);
  const y = event.clientY - (frame.y + frame.height / 2);
  if (Math.hypot(x, y) < 10) return null;
  return Math.atan2(x, -y) * (180 / Math.PI);
}

dial.addEventListener('pointerdown', event => {
  if (drag || event.button !== 0 || !event.isPrimary) return;
  const startAngle = angle(event);
  if (startAngle === null) return;
  dial.setPointerCapture(event.pointerId);
  drag = { id: event.pointerId, angle: startAngle, value: range.valueAsNumber, start: range.valueAsNumber };
  dial.dataset.held = 'true';
});

dial.addEventListener('pointermove', event => {
  if (!drag || drag.id !== event.pointerId) return;
  const current = angle(event);
  if (current === null) return;
  const delta = (current - drag.angle + 540) % 360 - 180;
  drag.angle = current;
  drag.value = clamp(drag.value + delta / 2.7);
  setLevel(drag.value);
});

function endGesture(event) {
  if (!drag || drag.id !== event.pointerId) return;
  if (event.type === 'pointercancel') setLevel(drag.start);
  delete dial.dataset.held;
  drag = null;
}
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  dial.addEventListener(type, endGesture);
}

range.addEventListener('input', () => setLevel(range.valueAsNumber));
for (const button of document.querySelectorAll('[data-step]')) {
  button.addEventListener('click', () => setLevel(range.valueAsNumber + Number(button.dataset.step), true));
}
for (const button of presets) {
  button.addEventListener('click', () => setLevel(Number(button.dataset.value), true));
}
for (const button of styles) {
  button.addEventListener('click', () => chooseStyle(button.dataset.styleChoice, true));
}
chooseStyle(location.hash.slice(1) || 'instrument');
setLevel(range.valueAsNumber);
drawInkMark();
