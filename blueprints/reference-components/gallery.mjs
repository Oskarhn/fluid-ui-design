import { catalog, components } from './catalog.mjs';

const find = document.getElementById('find');
const collection = document.getElementById('collection');
const results = document.getElementById('results');
const preview = document.getElementById('preview');
const heading = document.getElementById('component-name');
const reference = document.getElementById('reference-source');
const source = document.getElementById('component-source');
const replay = document.getElementById('reference-replay');
const reset = document.getElementById('reset');
const entryInfo = document.getElementById('component-info');
const byId = new Map(catalog.map(entry => [entry.id, entry]));
const mode = new URLSearchParams(location.search);
document.body.toggleAttribute('data-demo-mode', mode.has('demo'));
let privateAssets = {};
let websiteIds = new Set();
if (mode.has('reference-assets')) {
  try {
    const [result,websiteData] = await Promise.all([fetch('./private-reference/manifest.json'),fetch('./private-reference/websites.json')]);
    if (result.ok) privateAssets = await result.json();
    if (websiteData.ok) websiteIds=new Set((await websiteData.json()).map(record=>record.id));
  } catch {}
}
let current;
let session;

function render(entry) {
  session?.abort();
  session = new AbortController();
  current = entry;
  const { mount, file } = components[entry.component];
  preview.replaceChildren();
  delete preview.dataset.scope;
  preview.dataset.reference = entry.id;
  heading.textContent = entry.title;
  entryInfo.textContent = entry.description;
  reference.href = entry.url;
  reference.textContent = entry.referenceLabel ?? 'Original reference';
  replay.hidden=!websiteIds.has(entry.id);
  if(!replay.hidden)replay.href='./compare-fidelity.html#'+entry.id;
  source.href = './' + file;
  mount(preview, { signal: session.signal, options: { ...entry.options, ...privateAssets[entry.id] } });
  renderList();
}

function renderList() {
  const terms = find.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = catalog.filter(entry => (!collection.value || entry.collection === collection.value)
    && terms.every(term => (entry.title + ' ' + entry.description + ' ' + entry.id).toLowerCase().includes(term)));
  results.replaceChildren();
  if (!matches.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No matching components.';
    results.append(empty);
    return;
  }
  for (const entry of matches) {
    const link = document.createElement('a');
    link.href = '#' + entry.id;
    link.textContent = entry.title;
    if (entry === current) link.setAttribute('aria-current', 'true');
    link.addEventListener('click', () => {
      render(entry);
      heading.focus({preventScroll: true});
      if (matchMedia('(max-width: 760px)').matches) heading.scrollIntoView();
    });
    results.append(link);
  }
}

for (const name of new Set(catalog.map(entry => entry.collection))) collection.add(new Option(name));
function readHash() {
  const entry = byId.get(location.hash.slice(1)) ?? catalog[0];
  if (entry !== current) render(entry);
}
window.addEventListener('hashchange', readHash);
find.addEventListener('input', renderList);
collection.addEventListener('change', renderList);
reset.addEventListener('click', () => render(current));
readHash();
