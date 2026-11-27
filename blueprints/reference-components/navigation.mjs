import { choose, control, controls, listen, motion, scope, selectorKeys, text } from './shared.mjs';

const easing = 'cubic-bezier(.22,.75,.23,1)';

export function collapseIcon(root, { signal }) {
  root.innerHTML = `
    <div class="phone-case icon-phone">
      <div class="phone-bar"><span>09:44</span><span aria-hidden="true" class="island"></span><span>●●</span></div>
      <div class="rail-page">
        <nav class="phone-drawer" aria-label="Workspace" hidden>
          <button type="button">Notes</button><button type="button">Archive</button><button type="button">Settings</button>
        </nav>
        <div class="phone-screen">
          <button class="icon-trigger" aria-expanded="false" type="button" aria-label="Open sidebar">
            <span class="bar"></span><span class="bar"></span>
          </button>
          <h3>Notes</h3>
        </div>
      </div>
    `;
  const frame = control(root, '.rail-page');
  const trigger = control(root, '.icon-trigger');
  const panel = control(root, 'nav');
  const heading = control(root, 'h3');
  panel.id = scope(root) + '-sidebar';
  trigger.setAttribute('aria-controls', panel.id);
  function setOpen(value) {
    if (value) panel.hidden = false;
    frame.toggleAttribute('data-open', value);
    trigger.setAttribute('aria-expanded', String(value));
    trigger.setAttribute('aria-label', value ? 'Close sidebar' : 'Open sidebar');
    panel.inert = !value;
    if (!value) trigger.focus();
  }
  listen(trigger, 'click', () => setOpen(trigger.getAttribute('aria-expanded') === 'false'), signal);
  listen(frame, 'keydown', event => { if (event.key === 'Escape' && frame.hasAttribute('data-open')) setOpen(false); }, signal);
  controls(panel, 'button').forEach(item => listen(item, 'click', () => {
    heading.textContent = item.textContent;
    setOpen(false);
  }, signal));
}

export function quickActions(root, { signal }) {
  root.innerHTML = `
    <div class="quick-shell">
      <div class="quick-background"><h3>Today</h3><p>Review your time and upcoming work.</p><div></div><div></div></div>
      <button class="quick-trigger" type="button" aria-expanded="false">Quick actions</button>
      <div class="quick-panel" hidden><button type="button"><b>↗</b> Choose reminder</button><button type="button"><b>◫</b> Open a plan</button><button type="button"><b>＋</b> New invoice</button><button type="button"><b>✎</b> Add request</button></div>
      <p class="quick-status" role="status"></p>
    </div>
  `;
  const shell = control(root, '.quick-shell');
  const trigger = control(root, '.quick-trigger');
  const panel = control(root, '.quick-panel');
  const buttons = controls(panel, 'button');
  const feedback = control(root, '.quick-status');
  panel.id = scope(root) + '-actions';
  trigger.setAttribute('aria-controls', panel.id);
  function setOpen(value) {
    trigger.setAttribute('aria-expanded', String(value));
    shell.toggleAttribute('data-open', value);
    panel.hidden = !value;
    if (value) {
      buttons.forEach((button, index) => motion(button, [
        { transform: 'translateY(-10px) scale(.94)', opacity: 0 }, { transform: 'none', opacity: 1 }
      ], { duration: 320, delay: index * 42, easing, fill: 'backwards' }, signal));
    } else {
      trigger.focus();
    }
  }
  listen(trigger, 'click', () => setOpen(panel.hidden), signal);
  listen(shell, 'keydown', event => { if (event.key === 'Escape' && !panel.hidden) setOpen(false); }, signal);
  buttons.forEach(button => listen(button, 'click', () => {
    feedback.textContent = button.lastChild.textContent.trim() + ' selected';
    setOpen(false);
  }, signal));
}

export function floatingNav(root, { signal }) {
  root.innerHTML = `
    <div class="floating-field">
      <nav class="floating-menu" aria-label="Studio navigation">
        <div class="floating-trigger">
          <button class="nav-toggle" type="button" aria-expanded="false"><span aria-hidden="true">≡</span> Menu</button>
          <button class="theme-toggle" type="button" aria-pressed="false">Dark</button>
        </div>
        <div class="floating-collapse"><div class="floating-inner" inert>
          <button type="button">About</button><button type="button">Projects</button><button type="button">Resources</button><button type="button">Contact</button>
        </div></div>
      </nav>
      <output class="float-status" aria-live="polite"></output>
    </div>
  `;
  const field = control(root, '.floating-field');
  const nav = control(root, 'nav');
  const trigger = control(root, '.nav-toggle');
  const theme = control(root, '.theme-toggle');
  const inner = control(root, '.floating-inner');
  inner.id = scope(root) + '-links';
  trigger.setAttribute('aria-controls', inner.id);
  function toggle(value, returnFocus = false) {
    inner.inert = !value;
    nav.toggleAttribute('data-open', value);
    trigger.setAttribute('aria-expanded', String(value));
    if (returnFocus) trigger.focus();
  }
  listen(trigger, 'click', () => toggle(inner.inert), signal);
  listen(theme, 'click', () => {
    const dark = field.toggleAttribute('data-dark');
    theme.setAttribute('aria-pressed', String(dark));
    theme.textContent = dark ? 'Light' : 'Dark';
  }, signal);
  listen(nav, 'keydown', event => { if (event.key === 'Escape' && !inner.inert) toggle(false, true); }, signal);
  controls(inner, 'button').forEach(button => {
    const label = button.textContent;
    const line = text('span', label, 'roll-line');
    const duplicate = text('span', label, 'roll-line');
    duplicate.setAttribute('aria-hidden', 'true');
    const mask = document.createElement('span');
    mask.className = 'roll-label';
    mask.append(line, duplicate);
    button.replaceChildren(mask);
    listen(button, 'click', () => {
      control(root, 'output').textContent = label;
      toggle(false, true);
    }, signal);
  });
}

const toolGroups = [
  ['Layout', ['Grid', 'Spacing', 'Alignment']],
  ['Type', ['Headings', 'Body', 'Measure']],
  ['Media', ['Crop', 'Caption', 'Playback']],
  ['Export', ['PNG', 'PDF', 'Web']]
];

export function toolFolders(root, { signal }) {
  const wrap = document.createElement('div');
  wrap.className = 'folder-set';
  const detail = document.createElement('div');
  detail.className = 'folder-tools';
  const status = text('output', '', 'tool-status');
  status.setAttribute('aria-live', 'polite');
  detail.id = scope(root) + '-tools';
  detail.hidden = true;
  const folders = toolGroups.map(([name], index) => {
    const button = text('button', name, 'folder');
    button.type = 'button';
    button.style.setProperty('--folder-color', ['#5533d3', '#3344c7', '#6642c2', '#2769c5'][index]);
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', detail.id);
    listen(button, 'click', () => select(index), signal);
    return button;
  });
  let opened = -1;
  function select(index) {
    const previous = opened;
    opened = opened === index ? -1 : index;
    choose(folders, opened, 'aria-expanded');
    detail.hidden = opened < 0;
    if (opened < 0) return;
    const buttons = toolGroups[opened][1].map((tool, i) => {
      const button = text('button', tool);
      button.type = 'button';
      listen(button, 'click', () => { status.textContent = tool + ' selected'; }, signal);
      motion(button, [{ transform: 'translateY(15px)' }, { transform: 'none' }],
        { duration: 270, delay: i * 40, easing, fill: 'backwards' }, signal);
      return button;
    });
    detail.replaceChildren(...buttons);
    if (previous !== opened) status.textContent = '';
  }
  listen(wrap, 'keydown', event => {
    if (event.key !== 'Escape' || opened < 0) return;
    const current = opened;
    select(current);
    folders[current].focus();
  }, signal);
  wrap.append(...folders, detail, status);
  root.append(wrap);
}

export function editorPalette(root, { signal }) {
  root.innerHTML = `
    <div class="editor-phone">
      <div class="editor-canvas" data-crop="false" data-rotate="false"><strong>Form and field</strong><div></div></div>
      <div class="editor-tools" hidden aria-label="Edit tools">
        <button type="button" aria-pressed="false">Crop</button><button type="button" aria-pressed="false">Rotate</button>
        <button type="button" aria-pressed="false">Tone</button><button type="button">Undo</button>
      </div>
      <output role="status"></output><button class="palette-trigger" type="button" aria-expanded="false">Edit</button>
    </div>
  `;
  const panel = control(root, '.editor-tools');
  const trigger = control(root, '.palette-trigger');
  const canvas = control(root, '.editor-canvas');
  const active = controls(panel, 'button[aria-pressed]');
  panel.id = scope(root) + '-tools';
  trigger.setAttribute('aria-controls', panel.id);
  const keys = ['crop', 'rotate', 'tone'];
  const applied = [false, false, false];
  const history = [];
  function update(label) {
    active.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(applied[index]));
      canvas.dataset[keys[index]] = String(applied[index]);
    });
    control(root, 'output').textContent = label;
  }
  function open(value) {
    panel.hidden = !value;
    trigger.setAttribute('aria-expanded', String(value));
    trigger.textContent = value ? 'Close tools' : 'Edit';
    if (value) {
      active.forEach((button, i) => motion(button, [{ transform: 'scale(.7)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 240, delay: i * 45, easing, fill: 'backwards' }, signal));
    } else trigger.focus();
  }
  active.forEach((button, index) => listen(button, 'click', () => {
    history.push(index);
    applied[index] = !applied[index];
    update(button.textContent + (applied[index] ? ' applied' : ' removed'));
  }, signal));
  listen(control(panel, 'button:last-child'), 'click', () => {
    const last = history.pop();
    if (last === undefined) return;
    applied[last] = !applied[last];
    update('Undid last edit');
  }, signal);
  listen(trigger, 'click', () => open(panel.hidden), signal);
  listen(root, 'keydown', event => { if (event.key === 'Escape' && !panel.hidden) open(false); }, signal);
}
