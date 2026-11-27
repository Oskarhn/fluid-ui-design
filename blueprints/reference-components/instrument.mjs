import { choose, control, controls, listen, motion, scope, selectorKeys, text, timer } from './shared.mjs';

const ease = 'cubic-bezier(.18,.81,.25,1)';

export { conversionFunnel, burnMeter } from './fidelity-instruments.mjs';

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
