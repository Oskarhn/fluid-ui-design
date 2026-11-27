import { choose, control, controls, listen, motion, scope, selectorKeys, tabs, text, timer } from './shared.mjs';

const ease = 'cubic-bezier(.22,.76,.25,1)';
const demoLoops = ['window', 'arches', 'water', 'light'];
const previewAsset = (name, extension) => new URL('../../media/preview-loops/' + name + extension, import.meta.url).href;

export function lightSwitch(root, { signal, options = {} }) {
  root.innerHTML = `
    <div class="lights-stage">
      <div class="lights-rail"><button type="button" aria-label="Toggle lights" aria-pressed="false"><span aria-hidden="true" class="light-orb">☼</span></button></div>
      <div class="lights-city" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
      <div class="lights-plane" aria-hidden="true">✈</div><output aria-live="polite">Daylight</output>
    </div>
  `;
  const stage = control(root, '.lights-stage');
  const button = control(root, 'button');
  const mark = control(root, '.light-orb');
  const plane = control(root, '.lights-plane');
  if (options.sourceFrames?.[0]) {
    const photo = new Image();
    photo.alt = '';
    photo.className = 'lights-real';
    photo.src = options.sourceFrames[0];
    stage.dataset.source = '';
    stage.prepend(photo);
  }
  let flight;
  const marks = ['V', '◈', '◉', '◎', '☼'];
  function restoreMark() {
    mark.textContent = '☼';
    button.removeAttribute('data-spinning');
  }
  let hoverTimers = [];
  listen(button, 'pointerenter', event => {
    if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    button.setAttribute('data-spinning', '');
    hoverTimers = [...marks, ...marks].map((symbol, i) => timer(() => {
      mark.textContent = symbol;
    }, i * 250, signal));
    hoverTimers.push(timer(restoreMark, 2500, signal));
  }, signal);
  listen(button, 'pointerleave', () => { hoverTimers.forEach(cancel => cancel()); restoreMark(); }, signal);
  listen(button, 'click', () => {
    const night = stage.toggleAttribute('data-night');
    button.setAttribute('aria-pressed', String(night));
    control(root, 'output').textContent = night ? 'Lights dimmed' : 'Daylight restored';
    flight?.cancel();
    if (night) {
      const width = stage.clientWidth;
      flight = motion(plane, [
        { transform: 'translate(0,0) rotate(-6deg)', opacity: 0 },
        { transform: 'translateX(-18px) rotate(-6deg)', opacity: 1 },
        { transform: `translate(${-width * .23}px,-13px) rotate(4deg)`, opacity: 1 },
        { transform: `translate(${-width * .35}px,14px) rotate(8deg)` },
        { transform: `translate(${-width * .48}px,29px) rotate(10deg)` },
        { transform: `translate(${-width * .58}px,49px) rotate(8deg)` },
        { transform: `translate(${-width * .67}px,56px) rotate(5deg)` },
        { transform: `translate(${-width * .73}px,70px) rotate(3deg)`, opacity: .45 },
        { transform: `translate(${-width * .79}px,77px) rotate(0)`, opacity: 0 }
      ], { duration: 12000, easing: 'ease-out' }, signal);
    }
  }, signal);
}

export function stageExplorer(root, { signal, options }) {
  const { stages, label = 'Product stages', scroll = false, intro = false } = options;
  const shell = document.createElement('div');
  shell.className = 'stage-explorer';
  const change = text('output', '', 'stage-feedback');
  change.setAttribute('aria-live', 'polite');
  const panels = stages.map(([name, detail], index) => {
    const scene = document.createElement('div');
    scene.className = 'stage-scene';
    scene.dataset.variant = index;
    scene.append(text('h3', name), text('p', detail));
    const image = options.sourceFrames?.[index % options.sourceFrames.length];
    if (image) {
      const frame = new Image();
      frame.alt = '';
      frame.className = 'stage-reference';
      frame.src = image;
      frame.loading = 'lazy';
      scene.append(frame);
    }
    const choices = options.stageChoices?.[index];
    if (choices?.length) {
      const list = document.createElement('fieldset');
      list.className = 'stage-choices';
      list.append(text('legend','Include in this view'));
      for (const [label, enabled] of choices) {
        const row = document.createElement('label');
        const check = document.createElement('input');
        check.type='checkbox';check.checked=enabled;
        listen(check,'change',()=>{change.textContent=label+(check.checked?' included':' removed');},signal);
        row.append(check,document.createTextNode(label));list.append(row);
      }
      scene.append(list);
    }
    if (scroll) {
      const layers = document.createElement('div');
      layers.className = 'stage-orbit';
      layers.setAttribute('aria-hidden', 'true');
      layers.append(document.createElement('i'), document.createElement('i'), document.createElement('i'));
      const scroller = document.createElement('div');
      scroller.className = 'stage-scroller';
      scroller.tabIndex = 0;
      scroller.setAttribute('aria-label', 'Scroll through ' + name);
      scroller.append(layers, text('span', 'Scroll to move through this chapter'), document.createElement('div'));
      let queued = false;
      listen(scroller, 'scroll', () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          if (signal.aborted || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
          const distance = scroller.scrollHeight - scroller.clientHeight;
          const progress=distance?scroller.scrollTop/distance:0;
          layers.style.setProperty('--turn', (progress * 58) + 'deg');
          scene.style.setProperty('--chapter-y', -progress*8+'%');
        });
      }, signal);
      scene.append(scroller);
    }
    return scene;
  });
  function route(index) {
    change.textContent = stages[index][0] + ' selected';
    motion(panels[index], [{ transform: 'translateY(12px)' }, { transform: 'none' }],
      { duration: 390, easing: ease }, signal);
  }
  if (intro) {
    const cover = document.createElement('div');
    cover.className = 'stage-cover';
    const skip = text('button', 'Skip intro');
    skip.type = 'button';
    cover.append(text('p', 'Archive collection'), skip);
    shell.hidden = true;
    listen(skip, 'click', () => {
      cover.hidden = true;
      shell.hidden = false;
      control(shell, '[role=tab]').focus();
    }, signal);
    root.append(cover);
  }
  tabs(shell, stages.map(([name]) => name), panels, { signal, label, onSelect: route });
  shell.append(change);
  root.append(shell);
}

export function mediaIndex(root, { signal, options }) {
  const { items, title, backdrop = false } = options;
  const view = document.createElement('div');
  view.className = backdrop ? 'media-browser media-backdrop' : 'media-browser';
  const list = document.createElement('div');
  list.className = 'media-choices';
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.playsInline = true;
  video.muted = true;
  video.loop = true;
  video.setAttribute('aria-label', 'Sample preview footage');
  const caption = text('p', '', 'media-caption');
  const play = text('button', 'Play preview');
  play.type = 'button';
  const status = text('p', '', 'media-status');
  status.setAttribute('role', 'status');
  const heading = text('h3', title);
  const back = text('button','Previous preview');
  const next = text('button','Next preview');
  const sourceNote = text('small','','media-provenance');
  const playback = document.createElement('div');
  playback.className='media-playback';
  back.type=next.type='button';
  playback.append(back,play,next);
  let current = 0;
  const sources = items.map((item, index) => {
    if (typeof item !== 'string') return item;
    const demo = demoLoops[index % demoLoops.length];
    return { label: item, src: previewAsset(demo, '.mp4'), poster: previewAsset(demo, '.jpg') };
  });
  const choices = sources.map(({ label }, index) => {
    const button = text('button', label);
    button.type = 'button';
    listen(button, 'click', () => select(index), signal);
    return button;
  });
  const detail = document.createElement('div');
  detail.className = 'media-detail';
  function select(index) {
    current=(index+sources.length)%sources.length;
    choose(choices, current);
    const { label, src, poster, capture } = sources[current];
    caption.textContent = label;
    sourceNote.textContent = capture ? 'Original site recording' : '';
    video.pause();
    video.src = src;
    if (poster) video.poster = poster;
    else video.removeAttribute('poster');
    motion(caption, [{ transform: 'translateY(80%)' }, { transform: 'none' }],
      { duration: 330, easing: ease }, signal);
    status.textContent = '';
  }
  listen(play, 'click', async () => {
    if (!video.paused) { video.pause(); return; }
    try {
      await video.play();
    } catch { if (!signal.aborted) status.textContent = 'Preview could not be played.'; }
  }, signal);
  listen(back,'click',()=>select(current-1),signal);
  listen(next,'click',()=>select(current+1),signal);
  listen(video, 'play', () => { play.textContent = 'Pause preview'; }, signal);
  listen(video, 'pause', () => { play.textContent = 'Play preview'; }, signal);
  signal.addEventListener('abort', () => video.pause(), { once: true });
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => !entry.isIntersecting)) video.pause();
  });
  observer.observe(video);
  signal.addEventListener('abort', () => observer.disconnect(), { once: true });
  list.append(...choices);
  detail.append(video, caption, playback, sourceNote, status);
  view.append(heading, list, detail);
  root.append(view);
  select(0);
}

export function billingSwitch(root, { signal, options = {} }) {
  const id = scope(root);
  root.innerHTML = `
    <div class="billing-study">
      <h3>Choose delivery</h3>
      <fieldset><legend>Billing interval</legend>
        <label><input type="radio" name="${id}-billing" value="monthly" checked>Monthly service</label>
        <label><input type="radio" name="${id}-billing" value="install">One-time setup</label>
      </fieldset>
      <div class="bill-detail" aria-live="polite"><p></p><ul></ul></div>
    </div>
  `;
  const states = {
    monthly: ['Ongoing support', ['Updates and testing', 'Monthly review', 'Ongoing changes']],
    install: ['Delivered as a handoff', ['Initial setup', 'Documentation', 'Handoff call']]
  };
  const background = options.sourceFrames?.[0] ? new Image() : null;
  if (background) {background.alt='';background.className='billing-reference';control(root,'.billing-study').append(background);}
  function select(key) {
    const [label, items] = states[key];
    const detail = control(root, '.bill-detail');
    control(detail, 'p').textContent = label;
    control(detail, 'ul').replaceChildren(...items.map(item => text('li', item)));
    if(background) background.src=options.sourceFrames[key==='monthly'?0:1]||options.sourceFrames[0];
    motion(detail, [{ transform: 'translateY(10px)' }, { transform: 'none' }],
      { duration: 280, easing: ease }, signal);
  }
  controls(root, 'input').forEach(radio => listen(radio, 'change', () => select(radio.value), signal));
  select('monthly');
}

export function ingredientCard(root, { signal, options = {} }) {
  const id = scope(root);
  root.innerHTML = `
    <div class="ingredient-study">
      <div class="burger-drawing" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <h3>House burger</h3>
      <button class="ingredient-toggle" type="button" aria-expanded="false" aria-controls="${id}-ingredients">Ingredients</button>
      <div class="ingredient-grid"><div id="${id}-ingredients" inert><ul><li>Toasted bun</li><li>Pickles and onion</li><li>Grilled patty</li><li>House sauce</li></ul></div></div>
    </div>
  `;
  const frame = control(root, '.ingredient-study');
  const trigger = control(root, 'button');
  const content = control(root, '.ingredient-grid > div');
  if (options.foodPhoto) {
    const image = new Image();image.alt='';image.src=options.foodPhoto;image.className='ingredient-photo';
    control(root,'.burger-drawing').replaceWith(image);
  }
  listen(trigger, 'click', () => {
    const open = frame.toggleAttribute('data-open');
    content.inert = !open;
    trigger.setAttribute('aria-expanded', String(open));
  }, signal);
}

export function fontSpecimen(root, { signal, options = {} }) {
  const id = scope(root);
  root.innerHTML = `
    <div class="specimen">
      <div class="specimen-preview"><p>One chapter before the ferry.</p><span>Between the islands, the water sounded like paper turning.</span></div>
      <label for="${id}-face">Typeface</label><select id="${id}-face"><option>Serif</option><option>Sans</option><option>Monospace</option></select>
      <label for="${id}-weight">Weight <output>450</output></label><input id="${id}-weight" aria-label="Weight" type="range" min="200" max="850" step="10" value="450">
      <button type="button" class="specimen-theme" aria-pressed="false">Reading contrast</button>
    </div>
  `;
  const preview = control(root, '.specimen-preview');
  const face = control(root, 'select');
  const weight = control(root, 'input');
  const contrast = control(root, 'button');
  if (options.text) control(preview, 'p').textContent = options.text;
  function change() {
    preview.style.fontFamily = ['Georgia, serif', 'system-ui, sans-serif', 'monospace'][face.selectedIndex];
    preview.style.fontWeight = weight.value;
    control(root, 'output').textContent = weight.value;
  }
  listen(face, 'change', change, signal);
  listen(weight, 'input', change, signal);
  listen(contrast, 'click', () => contrast.setAttribute('aria-pressed', String(preview.toggleAttribute('data-contrast'))), signal);
  change();
}

export function profileDeck(root, { signal, options }) {
  const deck = document.createElement('div');
  deck.className = 'profile-deck';
  const panel = document.createElement('div');
  panel.className = 'profile-slots';
  const status = text('output', '');
  status.setAttribute('aria-live', 'polite');
  const colors = options.colors ?? ['#c6d9c3', '#dad1f4', '#f2c59c'];
  const profiles = options.names.map((name, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'profile-slot';
    card.style.setProperty('--panel-color', colors[index]);
    card.setAttribute('aria-label', name);
    const src=options.sourceFrames?.[index];
    if(src){const image=new Image();image.alt='';image.src=src;image.className='profile-image';card.append(image);}
    card.append(text('strong', name), text('small', options.details[index]), document.createElement('span'));
    listen(card, 'click', () => select(index), signal);
    return card;
  });
  const actions = document.createElement('div');
  actions.className = 'profile-actions';
  const controlsList = options.names.map((name, index) => {
    const button = text('button', name);
    button.type = 'button';
    listen(button, 'click', () => select(index), signal);
    return button;
  });
  function select(index) {
    profiles.forEach((card, position) => {
      const difference = (position - index + profiles.length) % profiles.length;
      card.dataset.place = difference;
      card.setAttribute('aria-pressed', String(position === index));
    });
    choose(controlsList, index);
    status.textContent = options.names[index] + ' selected';
  }
  actions.append(...controlsList);
  panel.append(...profiles);
  deck.append(panel, actions, status);
  root.append(deck);
  selectorKeys(actions, controlsList, select, signal);
  select(0);
}

export function catalogSearch(root, { signal, options }) {
  const id = scope(root);
  root.innerHTML = `
    <div class="search-study">
      <label for="${id}-search">Search collection</label>
      <div class="search-row"><input id="${id}-search" type="search" autocomplete="off"><button type="button" data-clear>Clear</button></div>
      <div class="filter-buttons" aria-label="Categories"></div><label class="catalog-sort">Sort <select><option>Source order</option><option>Name</option></select></label>
      <p class="results-status" aria-live="polite"></p><ul class="search-results"></ul>
      <dialog aria-label="Preview"><h3></h3><p></p><form method="dialog"><button type="submit">Close preview</button></form></dialog>
    </div>
  `;
  const input = control(root, 'input');
  const list = control(root, 'ul');
  const dialog = control(root, 'dialog');
  const filter = control(root, '.filter-buttons');
  const sorting = control(root, '.catalog-sort select');
  const categories = ['All', ...new Set(options.items.map(([, group]) => group))];
  let active = 'All';
  const cards = options.items.map(([name, group, summary], index) => {
    const row = document.createElement('li');
    const button = text('button', name);
    button.type = 'button';
    if(options.sourceFrames?.[index]) {
      const photo=new Image();photo.alt='';photo.src=options.sourceFrames[index];photo.className='catalog-image';
      row.append(photo);
    }
    listen(button, 'click', () => {
      control(dialog, 'h3').textContent = name;
      control(dialog, 'p').textContent = summary;
      dialog.showModal();
    }, signal);
    row.append(button, text('span', group));
    return { name, group, row };
  });
  const filters = categories.map((name, i) => {
    const button = text('button', name);
    button.type = 'button';
    listen(button, 'click', () => {
      active = name;
      choose(filters, i);
      update();
    }, signal);
    return button;
  });
  function update() {
    const query = input.value.trim().toLowerCase();
    const matches = cards.filter(item => (active === 'All' || item.group === active)
      && (item.name + ' ' + item.group).toLowerCase().includes(query));
    if(sorting.selectedIndex)matches.sort((a,b)=>a.name.localeCompare(b.name));
    list.replaceChildren(...matches.map(item => item.row));
    control(root, '.results-status').textContent = matches.length
      ? matches.length + (matches.length === 1 ? ' result' : ' results') : 'No matches';
  }
  listen(input, 'input', update, signal);
  listen(sorting,'change',update,signal);
  listen(control(root, '[data-clear]'), 'click', () => { input.value = ''; update(); input.focus(); }, signal);
  filter.append(...filters);
  choose(filters, 0);
  update();
}

export function motionSurface(root, { signal, options = {} }) {
  const field = document.createElement('div');
  field.className = 'motion-field';
  const screen = document.createElement('div');
  screen.className = 'motion-screen';
  screen.dataset.shape = options.shape ?? 'bands';
  screen.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 5; i++) screen.append(document.createElement('i'));
  let sourceVideo;
  if(options.sourceMotion){
    sourceVideo=document.createElement('video');
    sourceVideo.src=options.sourceMotion;sourceVideo.muted=true;sourceVideo.loop=true;sourceVideo.playsInline=true;
    if(options.sourceFrames?.[0])sourceVideo.poster=options.sourceFrames[0];
    screen.dataset.source='';screen.prepend(sourceVideo);
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)sourceVideo.play().catch(()=>{});
    signal.addEventListener('abort',()=>sourceVideo.pause(),{once:true});
  }
  const button = text('button', 'Pause motion');
  button.type = 'button';
  button.setAttribute('aria-pressed', 'false');
  const next = text('button', 'Center reveal');
  next.type = 'button';
  function point(x, y) { screen.style.setProperty('--spot-x', x + '%'); screen.style.setProperty('--spot-y', y + '%'); }
  listen(screen, 'pointermove', event => {
    if (screen.hasAttribute('data-paused')) return;
    const region = screen.getBoundingClientRect();
    point((event.clientX - region.left) / region.width * 100, (event.clientY - region.top) / region.height * 100);
  }, signal);
  listen(button, 'click', () => {
    const paused = screen.toggleAttribute('data-paused');
    button.setAttribute('aria-pressed', String(paused));
    button.textContent = paused ? 'Resume motion' : 'Pause motion';
    if(sourceVideo){if(paused)sourceVideo.pause();else sourceVideo.play().catch(()=>{});}
  }, signal);
  listen(next, 'click', () => point(50, 50), signal);
  const row = document.createElement('div');
  row.className = 'action-row';
  row.append(button, next);
  field.append(screen, row);
  root.append(field);
}
export function photoQuestions(root,{signal,options={}}){
  const list=document.createElement('section');
  list.className='photo-faq';
  const title=text('h3','Frequently asked questions');
  list.append(title);
  const questions=[
    ['How is Sundrop different from Apple Photos?','This demo shows the question and answer as a disclosure, with one open answer at a time.'],
    ['Are my family photos private?','The privacy information appears in place. A visitor can collapse it before reading another answer.'],
    ['Where can I review the collection?','Use the gallery link to see the original product site and its full guidance.']
  ];
  const rows=questions.map(([name,answer])=>{
    const details=document.createElement('details');
    details.append(text('summary',name),text('p',answer));
    listen(details,'toggle',()=>{
      if(details.open)for(const other of rows)if(other!==details)other.open=false;
    },signal);
    list.append(details);return details;
  });
  if(options.sourceFrames?.[0]){
    const photo=new Image();photo.src=options.sourceFrames[0];photo.alt='';photo.className='photo-faq-source';list.prepend(photo);
  }
  root.append(list);
}

export function mailWorkspace(root,{signal,options={}}){
  const id=scope(root);
  root.innerHTML=`
    <div class="mail-workspace" data-sidebar="open">
      <header><button type="button" aria-controls="${id}-mail-nav" aria-expanded="true">Collapse sidebar</button><span>Workspace</span></header>
      <div class="mail-workspace-body">
        <nav id="${id}-mail-nav" aria-label="Mail views">
          <button type="button" aria-pressed="true">Emails</button><button type="button" aria-pressed="false">Loops</button><button type="button" aria-pressed="false">Activity</button>
        </nav>
        <article class="mail-preview"><h3></h3><p></p><output class="a11y-only" role="status"></output></article>
      </div>
    </div>`;
  const shell=control(root,'.mail-workspace'),nav=control(root,'nav'),toggle=control(root,'header button');
  const rows=controls(nav,'button'),pane=control(root,'.mail-preview');
  const focused=[
    ['Emails','Emails to review before the next meeting.'],
    ['Loops','Follow threads that are still open.'],
    ['Activity','See changes since the last visit.']
  ];
  let thumb;
  if(options.sourceFrames?.[0]){thumb=new Image();thumb.alt='';thumb.className='mail-snapshot';pane.append(thumb);}
  function change(i){
    choose(rows,i);
    control(pane,'h3').textContent=focused[i][0];
    control(pane,'p').textContent=focused[i][1];
    control(pane,'output').textContent=focused[i][0]+' selected';
    if(thumb)thumb.src=options.sourceFrames?.[i]||options.sourceFrames[0];
    motion(pane,[{transform:'translateX(14px)'},{transform:'none'}],{duration:330,easing:ease},signal);
  }
  rows.forEach((button,i)=>listen(button,'click',()=>change(i),signal));
  listen(toggle,'click',()=>{
    const open=shell.dataset.sidebar!=='open';
    shell.dataset.sidebar=open?'open':'closed';
    nav.inert=!open;
    toggle.textContent=open?'Collapse sidebar':'Expand sidebar';
    toggle.setAttribute('aria-expanded',String(open));
  },signal);
  change(0);
}
