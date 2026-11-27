import { choose, control, controls, listen, motion, scope, selectorKeys, text, timer } from './shared.mjs';

const ease = 'cubic-bezier(.18,.81,.25,1)';

const funnelData = [
  { label: 'Current month', counts: [1200, 840, 486, 286], colors: ['#ef5556', '#d99a50'] },
  { label: 'First half', counts: [760, 505, 361, 203], colors: ['#a77bff', '#584aff'] },
  { label: 'Second half', counts: [440, 352, 201, 128], colors: ['#ec6b55', '#ffbc6d'] }
];

export function conversionFunnel(root, { signal }) {
  root.innerHTML = `
    <div class="funnel-instrument">
      <header><h3>Patient funnel</h3><select aria-label="Reporting period"></select></header>
      <div class="funnel-stats" aria-label="Example stage totals"></div>
      <div class="funnel-body"><div class="funnel-shape" aria-hidden="true"><div></div><div></div><div></div><div></div></div>
      <div><output aria-live="polite"></output><small>Visit to booking</small></div></div>
    </div>
  `;
  const select = control(root, 'select');
  const shape = control(root, '.funnel-shape');
  const segments = controls(shape, 'div');
  const stats = control(root, '.funnel-stats');
  const labels = ['Visits', 'Started', 'Qualified', 'Booked'];
  const rows = labels.map(label => {
    const row = document.createElement('div');
    const value = text('strong', '');
    row.append(text('span', label), value);
    stats.append(row);
    return value;
  });
  funnelData.forEach(item => select.add(new Option(item.label)));
  function apply(index) {
    const { counts, colors } = funnelData[index];
    rows.forEach((value, i) => { value.textContent = counts[i].toLocaleString('en-US'); });
    segments.forEach((segment, i) => {
      const height = Math.max(12, Math.round(counts[i] / counts[0] * 94));
      const next = i < 3 ? Math.max(12, Math.round(counts[i + 1] / counts[0] * 94)) : height;
      segment.style.setProperty('--left', ((100 - height) / 2) + '%');
      segment.style.setProperty('--right', ((100 - next) / 2) + '%');
    });
    shape.style.setProperty('--from', colors[0]);
    shape.style.setProperty('--to', colors[1]);
    control(root, 'output').textContent = ((counts.at(-1) / counts[0]) * 100).toFixed(1) + '%';
    motion(shape, [{ filter: 'brightness(1.55)' }, { filter: 'brightness(1)' }], {duration: 460, easing: ease}, signal);
  }
  listen(select, 'change', () => apply(select.selectedIndex), signal);
  apply(0);
}

export function burnMeter(root, { signal }) {
  root.innerHTML = `
    <div class="burn-meter">
      <header><h3>Energy</h3><small>Session preview</small></header>
      <div class="burn-display"><span class="burn-grid"></span><div class="burn-glow"></div><output aria-live="polite"></output></div>
      <label>Intensity <input type="range" min="0" max="100" value="40"></label>
      <button type="button" aria-pressed="false">Pause</button>
    </div>
  `;
  const meter = control(root, '.burn-meter');
  const input = control(root, 'input');
  const output = control(root, 'output');
  const pause = control(root, 'button');
  function update() {
    const intensity = Number(input.value);
    meter.style.setProperty('--energy', 12 + intensity * .68 + '%');
    output.textContent = intensity + ' / 100';
  }
  listen(input, 'input', update, signal);
  listen(pause, 'click', () => {
    const paused = meter.toggleAttribute('data-paused');
    pause.setAttribute('aria-pressed', String(paused));
    pause.textContent = paused ? 'Resume' : 'Pause';
  }, signal);
  update();
}

export function featureCards(root, { signal }) {
  const board = document.createElement('div');
  board.className = 'feature-cards';
  const labels = ['Productive days', 'Spending patterns', 'Busiest hours'];
  const cards = labels.map((label, i) => {
    const card = text('button', label, 'feature-card');
    card.type = 'button';
    const illustration = document.createElement('span');
    illustration.className = 'feature-figure shape-' + i;
    illustration.setAttribute('aria-hidden', 'true');
    for (let stroke = 0; stroke < 5; stroke++) illustration.append(document.createElement('i'));
    card.append(illustration);
    listen(card, 'click', () => activate(i), signal);
    listen(card, 'pointerenter', event => { if (event.pointerType === 'mouse') activate(i); }, signal);
    return card;
  });
  function activate(index) {
    choose(cards, index);
    cards.forEach((card, j) => { card.tabIndex = index === j ? 0 : -1; });
  }
  selectorKeys(board, cards, activate, signal);
  board.append(...cards);
  root.append(board);
  activate(0);
}

export function layeredSteps(root, { signal }) {
  root.innerHTML = `
    <div class="layer-demo">
      <div class="layer-scene" aria-hidden="true"><i></i><i></i><i></i></div>
      <h3></h3><p aria-live="polite"></p>
      <div class="action-row"><button type="button" data-back>Back</button><button type="button" data-next>Continue</button></div>
    </div>
  `;
  const planes = controls(root, '.layer-scene i');
  const next = control(root, '[data-next]');
  const back = control(root, '[data-back]');
  const steps = ['Connect a workspace', 'Set your preferences', 'Review your setup'];
  let index = 0;
  function render() {
    planes.forEach((plane, i) => {
      plane.toggleAttribute('data-active', i === index);
      plane.toggleAttribute('data-done', i < index);
    });
    control(root, 'h3').textContent = steps[index];
    control(root, 'p').textContent = 'Step ' + (index + 1) + ' of ' + steps.length;
    back.disabled = index === 0;
    next.disabled = index === steps.length - 1;
  }
  listen(back, 'click', () => { if (index > 0) { index--; render(); } }, signal);
  listen(next, 'click', () => { if (index < steps.length - 1) { index++; render(); } }, signal);
  render();
}

export function validationCode(root, { signal }) {
  const id = scope(root);
  root.innerHTML = `
    <form class="code-form">
      <label for="${id}-code">Validation code</label>
      <div class="code-line"><input id="${id}-code" name="code" type="text" inputmode="numeric" autocomplete="off" aria-describedby="${id}-hint ${id}-message">
        <div class="code-cells" aria-hidden="true"><span></span><span></span><span></span><i>–</i><span></span><span></span><span></span></div></div>
      <p id="${id}-hint">Demo code 374918</p>
      <p id="${id}-message" role="status"></p>
      <div class="action-row"><button type="submit">Validate</button><button type="reset">Reset</button></div>
    </form>
  `;
  const form = control(root, 'form');
  const input = control(root, 'input');
  const status = control(root, '[role=status]');
  const cells = controls(root, '.code-cells span');
  const resetStatus = () => {
    input.removeAttribute('aria-invalid');
    form.dataset.state = '';
    status.textContent = '';
    update();
  };
  function update() {
    input.value = input.value.replace(/\D/g, '').slice(0, 6);
    cells.forEach((cell, i) => {
      cell.textContent = input.value[i] ?? '0';
      cell.toggleAttribute('data-entered', i < input.value.length);
      cell.toggleAttribute('data-caret', i === Math.min(5, input.selectionStart ?? input.value.length));
    });
  }
  listen(input, 'input', resetStatus, signal);
  listen(input, 'keyup', update, signal);
  listen(input, 'click', update, signal);
  listen(form, 'submit', event => {
    event.preventDefault();
    const correct = input.value === '374918';
    form.dataset.state = correct ? 'valid' : 'invalid';
    input.setAttribute('aria-invalid', String(!correct));
    status.textContent = correct ? 'Code verified' : 'Incorrect validation code';
    if (!correct) {
      motion(control(root, '.code-cells'), [
        { transform: 'translateX(0)' }, { transform: 'translateX(-5px)' },
        { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }
      ], { duration: 270, easing: ease }, signal);
      input.focus();
      input.select();
    }
  }, signal);
  listen(form, 'reset', () => timer(resetStatus, 0, signal), signal);
  update();
}
