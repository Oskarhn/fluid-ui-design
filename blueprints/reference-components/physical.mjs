import { control, controls, listen, motion, text, timer } from './shared.mjs';

const spring = 'cubic-bezier(.24,1.32,.35,1)';

export { fileDrawer } from './fidelity-archive.mjs';

export function taskChecks(root, { signal }) {
  root.innerHTML = `
    <div class="check-panel"><header><h3>This week</h3><span></span></header>
      <label><input type="checkbox"><span>Renew library card</span></label>
      <label><input type="checkbox"><span>Send workshop notes</span></label>
      <label><input type="checkbox"><span>Print proofs</span></label>
      <label><input type="checkbox"><span>Book the studio</span></label>
      <output role="status"></output><button type="button">Clear checkmarks</button>
    </div>
  `;
  const checks = controls(root, 'input');
  const output = control(root, 'output');
  function count() { output.textContent = checks.filter(input => input.checked).length + ' of ' + checks.length + ' complete'; }
  checks.forEach(input => listen(input, 'change', () => {
    count();
    if (input.checked) motion(input, [{ transform: 'scale(.82)' }, { transform: 'scale(1.16)' }, { transform: 'none' }],
      { duration: 270, easing: spring }, signal);
  }, signal));
  listen(control(root, 'button'), 'click', () => { checks.forEach(input => { input.checked = false; }); count(); }, signal);
  count();
}

export function stackingLoader(root, { signal }) {
  root.innerHTML = `
    <div class="stacking-study">
      <div class="stacking-scene" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <output role="status">Ready to prepare files</output>
      <div class="action-row"><button type="button" data-start>Prepare files</button><button type="button" data-stop disabled>Cancel</button></div>
    </div>
  `;
  const stack = control(root, '.stacking-scene');
  const levels = controls(stack, 'i');
  const output = control(root, 'output');
  const start = control(root, '[data-start]');
  const stop = control(root, '[data-stop]');
  let running;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function finish(message) {
    running?.abort();
    running = null;
    stop.disabled = true;
    start.disabled = false;
    stack.removeAttribute('data-loading');
    stack.setAttribute('aria-busy', 'false');
    output.textContent = message;
  }
  listen(start, 'click', () => {
    if (running) return;
    running = new AbortController();
    const task = running.signal;
    stack.setAttribute('data-loading', '');
    stack.setAttribute('aria-busy', 'true');
    output.textContent = 'Preparing four sample files';
    stop.disabled = false;
    start.disabled = true;
    levels.forEach((level, index) => motion(level, [
      { translate: '0 -57px', opacity: 0 }, { translate: '0 0', opacity: 1 }
    ], {duration: 420, delay: index * 145, fill: 'backwards', easing: spring}, task));
    timer(() => finish('Files prepared'), reduced() ? 700 : 1450, task);
  }, signal);
  listen(stop, 'click', () => finish('Preparation cancelled'), signal);
  signal.addEventListener('abort', () => running?.abort(), { once: true });
}

export function copyConfirmation(root, { signal }) {
  const value = 'ref_7H2D8Q3C';
  root.innerHTML = `
    <div class="copy-study"><span>Reference ID</span><button type="button"><code></code><span aria-hidden="true">▢</span></button><p role="status"></p></div>
  `;
  const button = control(root, 'button');
  const code = control(root, 'code');
  const icon = control(root, 'button span');
  const status = control(root, '[role=status]');
  code.textContent = value;
  button.setAttribute('aria-label', 'Copy reference ID ' + value);
  let cancel;
  listen(button, 'click', async () => {
    cancel?.();
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      if (!signal.aborted) status.textContent = 'Clipboard unavailable. Select the reference ID to copy it.';
      return;
    }
    if (signal.aborted) return;
    button.dataset.copied = '';
    code.textContent = 'Copied';
    icon.textContent = '✓';
    status.textContent = 'Reference ID copied';
    motion(code, [{ opacity: .2, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 220 }, signal);
    cancel = timer(() => {
      delete button.dataset.copied;
      code.textContent = value;
      icon.textContent = '▢';
      status.textContent = '';
    }, 1600, signal);
  }, signal);
}

const notices = [
  ['Paper', 'Your proofs arrived', 'The revised pages are ready to view.'],
  ['Wind', 'Workshop moved indoors', 'The starting time stays the same.'],
  ['Clay', 'A new material sample', 'Open the archive to find the reference.']
];

export function notificationStack(root, { signal }) {
  const shell = document.createElement('div');
  shell.className = 'notice-study';
  const stack = document.createElement('div');
  stack.className = 'notice-stack';
  const status = text('p', '', 'notice-status');
  status.setAttribute('role', 'status');
  const restart = text('button', 'Reset stack');
  restart.type = 'button';
  const cards = notices.map(([material, title, description], index) => {
    const article = document.createElement('article');
    article.className = 'notice';
    article.style.setProperty('--material', ['#aa9980', '#5784a1', '#b06643'][index]);
    const swatch = text('div', material, 'notice-swatch');
    swatch.setAttribute('aria-hidden', 'true');
    const info = document.createElement('div');
    info.append(text('h3', title), text('p', description));
    const dismiss = text('button', '×', 'notice-dismiss');
    dismiss.type = 'button';
    dismiss.setAttribute('aria-label', 'Dismiss ' + title);
    listen(dismiss, 'click', () => remove(index), signal);
    article.append(swatch, info, dismiss);
    return article;
  });
  let index = 0;
  let removing;
  function render() {
    cards.forEach((card, i) => {
      card.hidden = i < index;
      card.inert = i !== index;
      card.style.setProperty('--depth', i - index);
      card.style.zIndex = cards.length - i;
    });
    status.textContent = index === cards.length ? 'You’re all caught up' : notices[index][1];
  }
  function remove(i) {
    if (i !== index || removing) return;
    cards[i].inert = true;
    const animation = motion(cards[i], [
      { opacity: 1, transform: 'translateY(0) scale(1)' },
      { opacity: 0, transform: 'translateY(-38px) rotate(-4deg) scale(.95)' }
    ], { duration: 320, easing: 'ease-in', fill: 'forwards' }, signal);
    function advance() {
      animation?.cancel();
      if (signal.aborted || index !== i) return;
      removing = null;
      index++;
      render();
      (control(cards[index] ?? shell, '.notice-dismiss') && index < cards.length ? control(cards[index], 'button') : restart).focus();
    }
    if (animation) {
      removing = animation;
      animation.finished.then(advance, () => {});
    } else advance();
  }
  listen(restart, 'click', () => {
    removing?.cancel();
    removing = null;
    index = 0;
    render();
  }, signal);
  stack.append(...cards);
  shell.append(stack, status, restart);
  root.append(shell);
  render();
}
