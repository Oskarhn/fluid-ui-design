import { control, controls, listen, scope, motion } from './shared.mjs';

const clamp = value => Math.min(1, Math.max(0, value));
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function collapseIcon(root, { signal, options = {} }) {
  const id = scope(root);
  root.innerHTML = `
    <div class="swipe-scene">
      <div class="swipe-phone">
        <div class="swipe-status"><b>09:44</b><i></i><span><em></em><em></em></span></div>
        <div class="swipe-track" id="${id}-swipe" tabindex="0" role="slider" aria-label="Drag sidebar horizontally"
          aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="Closed"
          aria-orientation="horizontal">
          <div class="swipe-rail" aria-hidden="true"></div>
          <div class="swipe-page" aria-hidden="true">
            <div class="swipe-icon"><i></i><i></i><i></i></div>
            <div class="swipe-wave"><i></i><i></i><i></i><i></i><i></i></div>
          </div>
        </div>
      </div>
    </div>
  `;
  const scene = control(root, '.swipe-scene');
  const track = control(root, '.swipe-track');
  if (options.backplate) {
    scene.style.backgroundImage = 'url(' + JSON.stringify(options.backplate) + ')';
    scene.dataset.backplate = '';
  }
  let progress = 0;
  let gesture;
  let settleTo = 0;
  let frame;
  function set(position) {
    progress = clamp(position);
    scene.style.setProperty('--swipe', progress);
    track.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    track.setAttribute('aria-valuetext', progress === 0 ? 'Closed' : progress === 1 ? 'Open' : 'Partially open');
  }
  function settle(target) {
    cancelAnimationFrame(frame);
    settleTo = target;
    if (reducedMotion()) { set(target); return; }
    const start = performance.now();
    const from = progress;
    function spring(now) {
      const time = (now - start) / 390;
      if (time >= 1 || signal.aborted) { set(target); return; }
      const rest = Math.exp(-6.7 * time) * (1 + 6.7 * time);
      set(target + (from - target) * rest);
      frame = requestAnimationFrame(spring);
    }
    frame = requestAnimationFrame(spring);
  }
  listen(track, 'pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || gesture) return;
    cancelAnimationFrame(frame);
    track.setPointerCapture(event.pointerId);
    track.dataset.pointer = '';
    track.focus({ preventScroll: true });
    gesture = { id: event.pointerId, x: event.clientX, start: progress,
      max: track.clientWidth * .73, last: event.clientX, time: event.timeStamp, speed: 0, moved: false };
  }, signal);
  listen(track, 'pointermove', event => {
    if (gesture?.id !== event.pointerId) return;
    const delta = event.clientX - gesture.x;
    if (!gesture.moved && Math.abs(delta) < 3) return;
    gesture.moved = true;
    track.dataset.dragging = '';
    const elapsed = event.timeStamp - gesture.time;
    if (elapsed > 0) gesture.speed = (event.clientX - gesture.last) / elapsed;
    gesture.last = event.clientX;
    gesture.time = event.timeStamp;
    set(gesture.start + delta / Math.max(1, gesture.max));
  }, signal);
  function finish(event, cancelled) {
    if (gesture?.id !== event.pointerId) return;
    const released = gesture;
    gesture = null;
    delete track.dataset.dragging;
    if (cancelled || !released.moved) { settle(settleTo); return; }
    const recent = event.timeStamp - released.time < 95;
    const projected = progress + (recent ? released.speed * .16 : 0);
    settle(projected >= .5 ? 1 : 0);
  }
  listen(track, 'pointerup', event => finish(event, false), signal);
  listen(track, 'pointercancel', event => finish(event, true), signal);
  listen(track, 'lostpointercapture', event => finish(event, true), signal);
  listen(track, 'blur', () => { delete track.dataset.pointer; }, signal);
  listen(track, 'keydown', event => {
    delete track.dataset.pointer;
    const values = { Home: 0, Escape: 0, End: 1, ArrowLeft: progress - .15, ArrowRight: progress + .15 };
    if (!Object.hasOwn(values, event.key)) return;
    event.preventDefault();
    settle(clamp(values[event.key]));
  }, signal);
  signal.addEventListener('abort', () => cancelAnimationFrame(frame), { once: true });
  set(0);
}

const actions = [
  ['↗', 'Chase overdue'],
  ['◐', 'Offer a plan'],
  ['＋', 'New invoice'],
  ['▣', 'Ask the agent']
];

export function quickActions(root, { signal, options = {} }) {
  const id = scope(root);
  root.innerHTML = `
    <div class="action-scene">
      <div class="action-dashboard" aria-hidden="true">
        <div class="action-nav"><span>Customers</span><span>⌕ &nbsp; Search</span><span class="action-avatars"><i>MO</i><i>AK</i><i>JS</i></span></div>
        <div class="action-filters"><span>7D &nbsp; <b>30D</b> &nbsp; 90D &nbsp; YTD</span><span>▣ Nov 1 – Nov 30</span><strong>↗ Export</strong></div>
        <div class="action-widgets"><div class="action-mini"></div><div class="action-amount"><small>Promises to pay</small><p>$96.3k <em>14 customers</em></p><div></div><small>9 kept &nbsp; 2 due today &nbsp; 3 upcoming</small></div>
          <div class="action-lagoon"></div><div class="action-terrain"><small>Settlement field</small></div></div>
      </div>
      <div class="action-glass" aria-hidden="true"></div>
      <button type="button" class="action-trigger" aria-label="Quick actions" aria-expanded="false" aria-controls="${id}-tiles"><span aria-hidden="true">+</span></button>
      <div class="action-tiles" id="${id}-tiles" hidden></div>
      <output class="action-message" role="status"></output>
    </div>
  `;
  const scene = control(root, '.action-scene');
  const trigger = control(root, '.action-trigger');
  const tiles = control(root, '.action-tiles');
  const message = control(root, '.action-message');
  if (options.backplate) {
    const plate = control(root, '.action-dashboard');
    plate.replaceChildren();
    plate.style.backgroundImage = 'url(' + JSON.stringify(options.backplate) + ')';
    scene.dataset.backplate = '';
  }
  const buttons = (options.actions || actions).map(([icon, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    const mark = document.createElement('i');
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = icon;
    const words = document.createElement('span');
    words.textContent = label;
    button.append(mark, words);
    listen(button, 'click', () => {
      message.textContent = label;
      close();
    }, signal);
    return button;
  });
  tiles.append(...buttons);
  let revision = 0;
  function open() {
    revision++;
    tiles.hidden = false;
    tiles.inert = false;
    scene.dataset.open = '';
    trigger.setAttribute('aria-expanded', 'true');
    control(trigger, 'span').textContent = '×';
    buttons.forEach((button, i) => {
      for (const anim of button.getAnimations()) anim.cancel();
      motion(button, [
        {opacity: 0, transform: 'translate(-4px,-12px) scale(.92)', filter: 'blur(6px)'},
        {opacity: 1, transform: 'none', filter: 'blur(0)'}
      ], { duration: 310, delay: i * 34, easing: 'cubic-bezier(.22,.7,.18,1)', fill: 'backwards' }, signal);
    });
  }
  function close() {
    const closing = ++revision;
    tiles.inert = true;
    trigger.setAttribute('aria-expanded', 'false');
    control(trigger, 'span').textContent = '+';
    delete scene.dataset.open;
    trigger.focus({preventScroll:true});
    if (reducedMotion()) { tiles.hidden = true; return; }
    const fold = motion(tiles, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-7px)' }],
      {duration: 165, easing:'ease-in'}, signal);
    fold?.finished.then(() => {
      if (revision === closing && !signal.aborted) tiles.hidden = true;
    }, () => {});
  }
  listen(trigger, 'click', () => {
    if (trigger.getAttribute('aria-expanded') === 'true') close();
    else {
      for (const animation of tiles.getAnimations()) animation.cancel();
      message.textContent = '';
      open();
    }
  }, signal);
  listen(scene, 'keydown', event => {
    if (event.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') close();
  }, signal);
}
