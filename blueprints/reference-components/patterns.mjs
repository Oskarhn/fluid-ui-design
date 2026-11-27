import { choose, control, controls, listen, motion, scope, selectorKeys, text, timer } from './shared.mjs';

export function journeyModes(root, { signal }) {
  root.innerHTML = '<div class="commute"><h3>Station to studio</h3><div class="route"><i></i></div><output aria-live="polite"></output><div class="profile-actions"></div></div>';
  const modes = [['Drive', 18, 'solid'], ['Transit', 27, 'double'], ['Walk', 42, 'dotted'], ['Bike', 20, 'dashed']];
  const actions = control(root, '.profile-actions');
  const route = control(root, '.route');
  const buttons = modes.map(([name], index) => {
    const button = text('button', name);
    button.type = 'button';
    listen(button, 'click', () => update(index), signal);
    return button;
  });
  function update(index) {
    const [name, minutes, edge] = modes[index];
    choose(buttons, index);
    control(root, 'output').textContent = name + ' · ' + minutes + ' min';
    route.style.setProperty('--route-style', edge);
    route.style.setProperty('--distance', (46 + minutes) + '%');
    motion(control(route, 'i'), [{opacity: 0.25, scale: '.6 1'}, {opacity: 1, scale: '1'}], {duration: 440}, signal);
  }
  actions.append(...buttons);
  selectorKeys(actions, buttons, update, signal);
  update(0);
}

export function desktopCopier(root, { signal }) {
  root.innerHTML = `
    <div class="copier-demo">
      <div class="copier" data-mode="empty">
        <div class="copier-lid" aria-hidden="true"></div>
        <span class="copier-bed">Glass bed</span><output role="status">Place a card on the glass</output>
        <div class="copier-output" hidden>Workshop ticket <small>Copy</small></div>
      </div>
      <div class="action-row">
        <button class="copier-card" type="button">Place workshop ticket</button>
        <button class="copy-start" type="button" disabled>Make copy</button>
        <button class="copy-reset" type="button">Reset</button>
      </div>
    </div>
  `;
  const printer = control(root, '.copier');
  const card = control(root, '.copier-card');
  const start = control(root, '.copy-start');
  const output = control(root, '.copier-output');
  const status = control(root, '[role=status]');
  let pending;
  function place() {
    if (printer.dataset.mode !== 'empty') return;
    printer.dataset.mode = 'ready';
    status.textContent = 'Ready';
    start.disabled = false;
  }
  let drag;
  listen(card, 'pointerdown', event => {
    if (event.button !== 0 || printer.dataset.mode !== 'empty') return;
    drag = [event.clientX, event.clientY];
    card.setPointerCapture(event.pointerId);
  }, signal);
  listen(card, 'pointermove', event => {
    if (drag) card.style.translate = (event.clientX - drag[0]) + 'px ' + (event.clientY - drag[1]) + 'px';
  }, signal);
  function finish(event) {
    if (!drag) return;
    card.style.translate = '';
    drag = null;
    if (event.type !== 'pointerup') return;
    const bed = control(root, '.copier-bed').getBoundingClientRect();
    if (event.clientX >= bed.left && event.clientX <= bed.right && event.clientY >= bed.top && event.clientY <= bed.bottom) place();
  }
  listen(card, 'pointerup', finish, signal);
  listen(card, 'pointercancel', finish, signal);
  listen(card, 'click', event => {
    const p = card.getBoundingClientRect();
    if (event.detail === 0 || (event.clientX >= p.left && event.clientX <= p.right && event.clientY >= p.top && event.clientY <= p.bottom)) place();
  }, signal);
  listen(start, 'click', () => {
    if (printer.dataset.mode !== 'ready') return;
    printer.dataset.mode = 'working';
    start.disabled = true;
    status.textContent = 'Copying…';
    pending = timer(() => {
      printer.dataset.mode = 'complete';
      output.hidden = false;
      status.textContent = 'Copy ready';
      motion(output, [{ translate: '0 -43px', opacity: 0 }, { translate: 'none', opacity: 1 }], { duration: 440 }, signal);
    }, 950, signal);
  }, signal);
  listen(control(root, '.copy-reset'), 'click', () => {
    pending?.();
    printer.dataset.mode = 'empty';
    start.disabled = true;
    output.hidden = true;
    status.textContent = 'Place a card on the glass';
  }, signal);
}

export function downloadProgress(root, { signal }) {
  root.innerHTML = `
    <div class="download-study">
      <h3>Sample download</h3>
      <progress aria-label="Sample processing progress" max="100" value="0"></progress><output role="status">Ready</output>
      <div class="action-row"><button type="button" data-start>Start</button><button type="button" data-cancel disabled>Cancel</button></div>
    </div>
  `;
  let stopTimer;
  let running = false;
  const status = control(root, '[role=status]');
  const progress = control(root, 'progress');
  const start = control(root, '[data-start]');
  const stop = control(root, '[data-cancel]');
  function complete(message) {
    running = false;
    stopTimer?.();
    stop.disabled = true;
    start.disabled = false;
    status.textContent = message;
  }
  function step() {
    if (!running || signal.aborted) return;
    progress.value += 20;
    if (progress.value >= progress.max) { complete('Finished'); return; }
    status.textContent = progress.value + '%';
    stopTimer = timer(step, 270, signal);
  }
  listen(start, 'click', () => {
    if (running) return;
    running = true;
    progress.value = 0;
    stop.disabled = false;
    start.disabled = true;
    status.textContent = 'Starting…';
    stopTimer = timer(step, 270, signal);
  }, signal);
  listen(stop, 'click', () => complete('Cancelled'), signal);
}

export function metricPlot(root, { signal, options }) {
  const id = scope(root);
  root.innerHTML = `
    <div class="metric-plot">
      <h3></h3><div class="metric-readings"><output aria-live="polite"></output><span class="metric-period"></span></div>
      <div class="metric-bars" aria-hidden="true"></div>
      <label for="${id}-metric">Explore readings</label><input id="${id}-metric" type="range" min="0" step="1" value="0">
    </div>
  `;
  const values = options.values;
  const chart = control(root, '.metric-bars');
  const range = control(root, 'input');
  control(root, 'h3').textContent = options.title;
  range.max = values.length - 1;
  const max = Math.max(...values);
  const bars = values.map(value => {
    const bar = document.createElement('span');
    bar.style.setProperty('--metric-height', (12 + (value / max) * 82) + '%');
    return bar;
  });
  function update() {
    const index = Number(range.value);
    bars.forEach((bar, i) => bar.toggleAttribute('data-active', i === index));
    control(root, 'output').textContent = values[index] + ' ' + options.unit;
    control(root, '.metric-period').textContent = options.period + ' ' + (index + 1);
    range.setAttribute('aria-valuetext', values[index] + ' ' + options.unit + ', ' + options.period.toLowerCase() + ' ' + (index + 1));
  }
  listen(range, 'input', update, signal);
  chart.append(...bars);
  update();
}

export function connectedList(root, { signal, options }) {
  const list = document.createElement('div');
  list.className = 'connections';
  const group = document.createElement('div');
  group.className = 'connection-buttons';
  const links = document.createElement('ul');
  links.className = 'connection-list';
  links.setAttribute('aria-live', 'polite');
  const nodes = options.nodes;
  const buttons = Object.keys(nodes).map((key, index) => {
    const button = text('button', key);
    button.type = 'button';
    listen(button, 'click', () => update(index), signal);
    return button;
  });
  function update(index) {
    choose(buttons, index);
    links.replaceChildren(...nodes[buttons[index].textContent].map(label => text('li', label)));
    motion(links, [{ transform: 'translateX(-10px)', opacity: .5 }, { transform: 'none', opacity: 1 }],
      {duration: 260}, signal);
  }
  group.append(...buttons);
  list.append(group, links);
  root.append(list);
  selectorKeys(group, buttons, update, signal);
  update(0);
}

export function flipCalendar(root, { signal }) {
  root.innerHTML = `
    <div class="calendar-study">
      <div class="calendar-page"><p></p><output aria-live="polite"></output></div>
      <div class="action-row"><button type="button" data-prev>Previous day</button><button type="button" data-next>Next day</button></div>
    </div>
  `;
  let day = Date.UTC(2026, 10, 27);
  const format = new Intl.DateTimeFormat('en', {weekday: 'long', month: 'long', timeZone:'UTC'});
  const number = new Intl.DateTimeFormat('en', { day:'numeric', timeZone:'UTC' });
  const sheet = control(root, '.calendar-page');
  let animation;
  function render() {
    control(sheet, 'p').textContent = format.format(day);
    control(sheet, 'output').textContent = number.format(day);
  }
  function turn(delta) {
    day += delta * 86400000;
    render();
    animation?.cancel();
    animation = motion(sheet, [{rotate: 'x ' + (delta * -48) + 'deg'}, {rotate: 'x 0deg'}],
      { duration: 360, easing: 'cubic-bezier(.22,.8,.3,1)' }, signal);
  }
  listen(control(root, '[data-prev]'), 'click', () => turn(-1), signal);
  listen(control(root, '[data-next]'), 'click', () => turn(1), signal);
  render();
}

export function deviceShowcase(root, { signal }) {
  root.innerHTML = `
    <div class="device-study"><div class="device-model" aria-hidden="true"><div class="device-keyboard"></div><div class="device-lid"><span>◆</span></div></div>
      <output aria-live="polite"></output><div class="profile-actions"></div>
    </div>
  `;
  const labels = ['Lid', 'Inside', 'Unboxing', 'Final look'];
  const actions = control(root, '.profile-actions');
  const model = control(root, '.device-model');
  const output = control(root, 'output');
  let animation;
  const buttons = labels.map((label, index) => {
    const button = text('button', label);
    button.type = 'button';
    listen(button, 'click', () => show(index), signal);
    return button;
  });
  function show(index) {
    choose(buttons, index);
    model.dataset.view = index;
    animation?.cancel();
    if (index === 2) animation = motion(model, [{ transform: 'translateY(40px) rotateX(-18deg) scale(.76)' },
      { transform: 'none' }], { duration: 580, easing: 'cubic-bezier(.22,.7,.18,1)' }, signal);
    output.textContent = labels[index] + ' selected';
  }
  actions.append(...buttons);
  selectorKeys(actions, buttons, show, signal);
  show(0);
}

export function canvasLogin(root, { signal }) {
  const id = scope(root);
  root.innerHTML = `
    <div class="local-access">
      <div class="access-art" aria-hidden="true"><i></i><i></i><i></i></div>
      <div><h3>Preview workspace</h3><label for="${id}-alias">Display name</label><input id="${id}-alias" type="text" autocomplete="off" maxlength="40">
      <button type="button">Preview entry animation</button><output role="status"></output></div>
    </div>
  `;
  const input = control(root, 'input');
  const art = control(root, '.access-art');
  const status = control(root, 'output');
  listen(control(root, 'button'), 'click', () => {
    const name = input.value.trim();
    if (!name) { status.textContent = 'Enter a demo name'; input.focus(); return; }
    status.textContent = 'Preview ready for ' + name;
    motion(art, [{ transform: 'perspective(280px) rotateY(-24deg)' }, { transform: 'none' }], { duration: 580 }, signal);
  }, signal);
}
