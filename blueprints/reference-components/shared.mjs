let nextScope = 0;

export function scope(root) {
  root.dataset.scope ||= 'reference-' + ++nextScope;
  return root.dataset.scope;
}

export function control(root, selector) {
  return root.querySelector(selector);
}

export function controls(root, selector) {
  return [...root.querySelectorAll(selector)];
}

export function listen(target, type, handler, signal) {
  target.addEventListener(type, handler, { signal });
}

export function motion(element, keyframes, options, signal) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || signal.aborted) return;
  const animation = element.animate(keyframes, options);
  const cancel = () => animation.cancel();
  signal.addEventListener('abort', cancel, { once: true });
  animation.finished.catch(() => {}).finally(() => signal.removeEventListener('abort', cancel));
  return animation;
}

export function selectorKeys(group, items, activate, signal) {
  listen(group, 'keydown', event => {
    const current = items.indexOf(document.activeElement);
    if (current < 0) return;
    const motion = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
    const index = event.key === 'Home' ? 0
      : event.key === 'End' ? items.length - 1
      : event.key in motion ? (current + motion[event.key] + items.length) % items.length
      : -1;
    if (index < 0) return;
    event.preventDefault();
    items[index].focus();
    activate(index);
  }, signal);
}

export function choose(items, index, attribute = 'aria-pressed') {
  items.forEach((item, position) => item.setAttribute(attribute, String(position === index)));
}

export function tabs(root, labels, contents, { signal, label = 'Views', onSelect } = {}) {
  const id = scope(root);
  const list = document.createElement('div');
  list.className = 'segmented';
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', label);
  const panels = labels.map((text, index) => {
    const panel = document.createElement('div');
    panel.id = id + '-panel-' + index;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', id + '-tab-' + index);
    panel.tabIndex = 0;
    panel.className = 'tab-content';
    panel.append(contents[index]);
    return panel;
  });
  const items = labels.map((text, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.id = id + '-tab-' + index;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panels[index].id);
    listen(button, 'click', () => activate(index), signal);
    return button;
  });
  function activate(index) {
    choose(items, index, 'aria-selected');
    panels.forEach((panel, position) => { panel.hidden = position !== index; });
    items.forEach((item, position) => { item.tabIndex = position === index ? 0 : -1; });
    onSelect?.(index);
  }
  list.append(...items);
  root.append(list, ...panels);
  selectorKeys(list, items, activate, signal);
  activate(0);
  return { activate, items, panels };
}

export function text(tag, content, className) {
  const element = document.createElement(tag);
  element.textContent = content;
  if (className) element.className = className;
  return element;
}

export function timer(callback, delay, signal) {
  const id = setTimeout(() => {
    signal.removeEventListener('abort', cancel);
    callback();
  }, delay);
  function cancel() {
    clearTimeout(id);
    signal.removeEventListener('abort', cancel);
  }
  signal.addEventListener('abort', cancel, { once: true });
  return cancel;
}
