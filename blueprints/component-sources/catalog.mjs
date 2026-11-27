import { frameContent, trackReducedMotion } from './preview.mjs';

const find = id => document.getElementById(id);
const kinds = {
  uiverse: { label: 'Uiverse', host: 'uiverse.io', terms: './uiverse/LICENSE.md', termsLabel: 'MIT license' },
  forgeui: { label: 'ForgeUI', host: 'www.forgeui.com', terms: 'https://www.forgeui.com/components/introduction', termsLabel: 'Usage guide' },
  uilora: { label: 'Uilora', host: 'www.uilora.com', terms: 'https://www.uilora.com/terms', termsLabel: 'Terms' }
};
const labels = { mirrored: 'MIT source', 'project-code': 'Local project source', premium: 'Premium reference', reference: 'Reference page' };
const query = find('query'), source = find('source'), category = find('category'), access = find('access');
const list = find('results'), detail = document.querySelector('.detail'), heading = find('entry-title'), status = find('entry-status');
const stage = find('stage'), theme = find('theme'), files = find('file'), code = find('code');
const bundles = new Map();
const pageSize = 28;
let all = [];
let selected, activeFiles, markup;
let page = 0, selection = 0, rendering = 0;

async function json(path) {
  const response = await fetch(path);
  if (!response.ok) throw Error('HTTP ' + response.status);
  return response.json();
}

function bundle(path) {
  if (!/^(?:uiverse\/\d{2,3}|private-source\/(?:uilora|forgeui)\/[\w.-]+)\.json$/.test(path)) {
    throw Error('Unexpected source path');
  }
  if (!bundles.has(path)) {
    if (bundles.size >= 6) bundles.delete(bundles.keys().next().value);
    bundles.set(path, json('./' + path).catch(error => { bundles.delete(path); throw error; }));
  }
  return bundles.get(path);
}

function sourceUrl(value, entry) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && url.hostname === kinds[entry.kind].host && !url.username && !url.password) return url.href;
  } catch {}
  return '#';
}

function categories() {
  const current = category.value;
  const names = [...new Set(all.filter(item => !source.value || item.kind === source.value).map(item => item.category))].sort();
  category.replaceChildren(new Option('All categories', ''), ...names.map(name => new Option(name, name)));
  if (names.includes(current)) category.value = current;
}

function search() {
  const words = query.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return all.filter(entry => (!source.value || entry.kind === source.value)
    && (!category.value || entry.category === category.value)
    && (!access.value || (access.value === 'available' ? Boolean(entry.bundle) : entry.access === access.value))
    && words.every(word => entry.search.includes(word)));
}

function markSelected() {
  for (const button of list.querySelectorAll('button')) {
    if (button.dataset.id === selected?.id) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  }
}

function render() {
  const results = search();
  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  page = Math.min(page, pageCount - 1);
  list.replaceChildren();
  for (const entry of results.slice(page * pageSize, (page + 1) * pageSize)) {
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.id = entry.id;
    const name = document.createElement('strong');
    const description = document.createElement('span');
    name.textContent = entry.title;
    description.textContent = [kinds[entry.kind].label, entry.category, labels[entry.access]].join(' / ');
    button.append(name, description);
    row.append(button);
    list.append(row);
  }
  markSelected();
  find('result-count').textContent = results.length ? results.length.toLocaleString('en') + ' components' : 'No matching components.';
  find('paging').hidden = pageCount < 2;
  find('page').textContent = (page + 1) + ' of ' + pageCount;
  find('previous').disabled = page === 0;
  find('next').disabled = page >= pageCount - 1;
  return results;
}

function currentFile() {
  return activeFiles?.[Number(files.value)];
}

function showFile() {
  const file = currentFile();
  code.value = file?.content ?? '';
  find('code-note').textContent = typeof file?.note === 'string' ? file.note : '';
  find('code-note').hidden = !find('code-note').textContent;
}

function showCode(items) {
  activeFiles = items;
  files.replaceChildren(...items.map((item, index) => new Option(item.path, index)));
  find('code-panel').hidden = false;
  showFile();
}

async function preview() {
  if (!markup || selected?.kind !== 'uiverse') return;
  const attempt = ++rendering;
  try {
    const frame = await frameContent(markup, selected.format, theme.getAttribute('aria-pressed') === 'true');
    if (attempt !== rendering) return;
    stage.title = selected.title + ' preview';
    stage.srcdoc = frame;
    find('preview').hidden = false;
  } catch {
    if (attempt === rendering) status.textContent = 'Local preview styles are unavailable. View this example on Uiverse.';
  }
}

async function show(entry, focused = false) {
  const revision = ++selection;
  ++rendering;
  selected = entry;
  markup = activeFiles = null;
  detail.hidden = false;
  stage.removeAttribute('srcdoc');
  for (const id of ['preview', 'code-panel', 'dependencies']) find(id).hidden = true;
  heading.textContent = entry.title;
  find('entry-meta').textContent = [kinds[entry.kind].label, entry.category, entry.format, entry.author, entry.license].filter(Boolean).join(' / ');
  find('original').href = sourceUrl(entry.url, entry);
  find('license').href = kinds[entry.kind].terms;
  find('license').textContent = kinds[entry.kind].termsLabel;
  find('registry').hidden = !entry.registry;
  if (entry.registry) find('registry').href = sourceUrl(entry.registry, entry);
  markSelected();
  if (focused) {
    history.replaceState(null, '', '#' + encodeURIComponent(entry.id));
    heading.focus({ preventScroll: false });
  }
  const install = entry.command ? [{ path: 'Install command', content: entry.command }] : [];
  if (!entry.bundle) {
    status.textContent = entry.access === 'premium' ? 'Premium reference. Open the original to check your access.' : 'Open the original to see the published example.';
    if (install.length) showCode(install);
    return;
  }
  status.textContent = 'Loading source';
  try {
    const data = await bundle(entry.bundle);
    if (selection !== revision) return;
    if (entry.kind === 'uiverse') {
      if (typeof data[entry.key] !== 'string') throw Error('Source unavailable');
      markup = data[entry.key];
      showCode([{ path: entry.filename, content: markup }]);
      status.textContent = 'Source archived under MIT. Keep the license notice when reusing it.';
      await preview();
    } else {
      const items = data.files.filter(file => typeof file.path === 'string' && typeof file.content === 'string');
      if (!items.length) throw Error('Source unavailable');
      showCode([...items, ...install]);
      const dependencies = [...(data.dependencies ?? []), ...(data.registryDependencies ?? [])].filter(name => typeof name === 'string');
      find('dependencies').textContent = dependencies.length ? 'Depends on ' + dependencies.join(', ') : '';
      find('dependencies').hidden = !dependencies.length;
      status.textContent = 'Local source for use in a project. The live preview is on the original site.';
    }
  } catch {
    if (selection !== revision) return;
    status.textContent = 'Local source is unavailable here. Open the original or follow its install command.';
    if (install.length) showCode(install);
  }
}

function filtersChanged() {
  page = 0;
  const results = render();
  if (results.length && !results.includes(selected)) show(results[0]);
  if (!results.length) {
    ++selection;
    ++rendering;
    selected = null;
    detail.hidden = true;
    stage.removeAttribute('srcdoc');
  }
}

find('filters').addEventListener('submit', event => event.preventDefault());
query.addEventListener('input', filtersChanged);
source.addEventListener('change', () => { categories(); filtersChanged(); });
category.addEventListener('change', filtersChanged);
access.addEventListener('change', filtersChanged);
find('previous').addEventListener('click', () => { page--; render(); list.scrollTop = 0; });
find('next').addEventListener('click', () => { page++; render(); list.scrollTop = 0; });
list.addEventListener('click', event => {
  const id = event.target.closest('button[data-id]')?.dataset.id;
  const entry = all.find(item => item.id === id);
  if (entry) show(entry, true);
});
theme.addEventListener('click', () => {
  theme.setAttribute('aria-pressed', String(theme.getAttribute('aria-pressed') !== 'true'));
  preview();
});
find('reset').addEventListener('click', preview);
trackReducedMotion(preview);
files.addEventListener('change', showFile);
find('copy').addEventListener('click', async () => {
  const active = selection;
  try {
    await navigator.clipboard.writeText(code.value);
    if (active === selection) status.textContent = 'Copied to clipboard.';
  } catch {
    if (active === selection) {
      code.focus();
      code.select();
      status.textContent = 'Code selected. Use your keyboard to copy it.';
    }
  }
});
find('download').addEventListener('click', () => {
  const file = currentFile();
  if (!file) return;
  const name = file.path.split('/').at(-1).replace(/[^a-zA-Z0-9_.-]/g, '-') || 'source.txt';
  const address = URL.createObjectURL(new Blob([file.content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = address;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(address), 500);
});

try {
  const sets = await Promise.all(Object.keys(kinds).map(async kind => [kind, await json('./catalogs/' + kind + '.json')]));
  all = sets.flatMap(([kind, data]) => data.entries.map(entry => ({ ...entry, kind,
    search: [entry.title, entry.author, entry.category, entry.format, kinds[kind].label, ...entry.tags].filter(Boolean).join(' ').toLowerCase()
  })));
  for (const [kind, data] of sets) source.add(new Option(data.label + ' (' + data.entries.length.toLocaleString('en') + ')', kind));
  find('coverage').textContent = sets.map(([, data]) => data.label + ' ' + data.entries.length.toLocaleString('en')).join(' / ');
  let hash = '';
  try { hash = decodeURIComponent(location.hash.slice(1)); } catch {}
  const requested = all.find(entry => entry.id === hash);
  if (requested) source.value = requested.kind;
  categories();
  const results = render();
  if (requested || results.length) await show(requested ?? results[0]);
} catch {
  find('result-count').textContent = 'The catalog could not be loaded. Start the library server and reload this page.';
}
