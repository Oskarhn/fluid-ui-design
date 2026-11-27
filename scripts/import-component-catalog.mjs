import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const [, , checkoutArg, source = 'all', cacheMode] = process.argv;
const reuse = cacheMode === '--reuse';
if (!checkoutArg || !['all', 'uiverse', 'forgeui', 'uilora'].includes(source)) {
  throw Error('Pass the official Galaxy checkout and optionally all, uiverse, forgeui or uilora.');
}
const checkout = resolve(checkoutArg);
const output = fileURLToPath(new URL('../blueprints/component-sources/', import.meta.url));
const local = resolve(output, 'private-source');
const forge = 'https://www.forgeui.com';
const lora = 'https://www.uilora.com';
const title = value => value.replace(/[-_]+/g, ' ').replace(/\b[A-Za-z]/, letter => letter.toUpperCase());
const slug = /^[\w.-]+$/;
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function save(relative, value) {
  const file = resolve(output, relative);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value) + '\n', 'utf8');
}

async function read(url, format = 'json') {
  for (let attempt = 0; attempt < 2; attempt++) {
    let response;
    try {
      response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(25000) });
    } catch (error) {
      if (attempt === 1) throw error;
      await sleep(750);
      continue;
    }
    if (response.ok) return response[format]();
    if (response.status >= 500 && attempt === 0) {
      await sleep(750);
      continue;
    }
    if (response.status === 429 && attempt === 0) {
      const wait = Number(response.headers.get('retry-after') ?? 10);
      if (Number.isFinite(wait) && wait >= 0 && wait <= 30) {
        await sleep(1000 * wait);
        continue;
      }
    }
    const error = Error('HTTP ' + response.status);
    error.status = response.status;
    throw error;
  }
}

async function batch(items, action) {
  let index = 0;
  let limited = false;
  const failures = [];
  await Promise.all(Array.from({ length: 5 }, async () => {
    while (!limited && index < items.length) {
      const item = items[index++];
      try { await action(item); }
      catch (error) {
        failures.push([item.name ?? item.url ?? item, error.message]);
        if (error.status === 429) limited = true;
      }
    }
  }));
  return { failures, limited, untried: items.length - index };
}

function sitemap(text, origin) {
  return [...new Set([...text.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map(match => match[1]))]
    .filter(url => new URL(url).origin === origin);
}

function repo(...args) {
  return execFileSync('git', ['-C', checkout, ...args], { encoding: 'utf8' });
}
if (source === 'all' || source === 'uiverse') {
  const revision = repo('rev-parse', 'HEAD').trim();
  const mit = await readFile(resolve(checkout, 'LICENSE'), 'utf8');
  if (!mit.includes('Copyright (c) 2023 Uiverse.io') || !mit.includes('MIT License')) throw Error('Expected the Galaxy MIT notice.');
  const galaxyFiles = repo('ls-files', '-z').split('\0').filter(path => /^[\w-]+\/[\w.-]+\.html$/.test(path));
  if (!galaxyFiles.length) throw Error('The Galaxy checkout has no HTML snippets.');

  const galaxy = [];
  for (let start = 0; start < galaxyFiles.length; start += 120) {
    const source = 'uiverse/' + String(Math.floor(start / 120) + 1).padStart(2, '0') + '.json';
    const content = {};
    for (const path of galaxyFiles.slice(start, start + 120)) {
      const code = await readFile(resolve(checkout, path), 'utf8');
      const [group, file] = path.split('/');
      const base = file.replace(/\.html$/, '');
      const author = code.match(/From Uiverse\.io by\s+([\w-]+)/i)?.[1] ?? base.split('_')[0];
      const name = base.startsWith(author + '_') ? base.slice(author.length + 1) : base.slice(base.indexOf('_') + 1);
      const tags = code.match(/Tags:\s*([^*\r\n]+)/i)?.[1]?.split(',').map(value => value.trim()).filter(Boolean) ?? [];
      const format = /<style[\s>]/i.test(code) ? 'HTML + CSS' : 'Tailwind';
      content[base] = code;
      galaxy.push({ id: 'uiverse:' + group + ':' + base, title: title(name), category: title(group), author,
        url: 'https://uiverse.io/' + encodeURIComponent(author) + '/' + encodeURIComponent(name),
        format, tags, key: base, bundle: source, filename: file, access: 'mirrored', license: 'MIT' });
    }
    await save(source, content);
  }
  await writeFile(resolve(output, 'uiverse/LICENSE.md'), mit, 'utf8');
  await save('catalogs/uiverse.json', {
    label: 'Uiverse', project: 'https://github.com/uiverse-io/galaxy', revision,
    entries: galaxy, license: 'MIT'
  });
  console.log('Uiverse MIT archive', galaxy.length);
}

await mkdir(local, { recursive: true });
if (source === 'all' || source === 'forgeui') {
  const forgeUrls = sitemap(await read(forge + '/sitemap.xml', 'text'), forge);
  const examplePages = forgeUrls.filter(url => /^\/(?:components\/(?!introduction$)[\w-]+|blocks\/[\w-]+|templates)$/.test(new URL(url).pathname));
  const forgeSources = new Map();
  const forgePages = [];
  const forgePagesReport = await batch(examplePages, async url => {
    const path = new URL(url).pathname;
    const parts = path.split('/').filter(Boolean);
    const section = parts[0] === 'components' ? title(parts[1]) : parts[0] === 'blocks' ? 'Blocks' : 'Templates';
    const html = await read(url, 'text');
    const ids = [...new Set([...html.matchAll(/https:\/\/www\.forgeui\.com\/r\/([\w-]+)\.json/g)].map(match => match[1]))];
    if (!ids.length && parts[0] !== 'components') {
      forgePages.push({ id: 'forgeui:page:' + path, title: title(parts.at(-1)), category: section,
        url, format: 'React', tags: [], access: 'reference', license: 'Project use' });
    }
    for (const name of ids) {
      if (!forgeSources.has(name)) forgeSources.set(name, { name, category: section, url });
    }
  });
  const forgeEntries = [];
  const forgeCodeReport = await batch([...forgeSources.values()], async item => {
    const registry = forge + '/r/' + item.name + '.json';
    const payload = await read(registry);
    if (payload.name !== item.name || !Array.isArray(payload.files) || !payload.files.some(file => typeof file.content === 'string')) {
      throw Error('No matching published code files');
    }
    const files = payload.files.filter(file => typeof file.path === 'string' && typeof file.content === 'string')
      .map(({ path, content }) => ({ path, content }));
    await save('private-source/forgeui/' + item.name + '.json', {
      files, dependencies: payload.dependencies ?? [], registryDependencies: payload.registryDependencies ?? [], registry
    });
    forgeEntries.push({ id: 'forgeui:' + item.name, title: payload.title || title(item.name), category: item.category,
      url: item.url, registry, bundle: 'private-source/forgeui/' + item.name + '.json',
      format: 'React / shadcn', tags: [], access: 'project-code', license: 'Project use' });
  });
  const forgeSuccess = new Set(forgeEntries.map(entry => entry.id.slice(8)));
  for (const item of forgeSources.values()) {
    if (!forgeSuccess.has(item.name)) {
      forgeEntries.push({ id: 'forgeui:' + item.name, title: title(item.name), category: item.category,
        url: item.url, format: 'React / shadcn', tags: [], access: 'reference', license: 'Project use' });
    }
  }
  await save('catalogs/forgeui.json', {
    label: 'ForgeUI', project: forge + '/components/introduction', pagesChecked: examplePages.length - forgePagesReport.failures.length - forgePagesReport.untried,
    entries: [...forgeEntries, ...forgePages].sort((a, b) => a.id.localeCompare(b.id))
  });
  console.log('ForgeUI', JSON.stringify({ registry: forgeSources.size, localCode: forgeSuccess.size, references: forgePages.length,
    pageGaps: forgePagesReport, codeGaps: forgeCodeReport }));
}

if (source === 'all' || source === 'uilora') {
  const loraRegistry = await read(lora + '/r/registry.json');
  const loraUrls = sitemap(await read(lora + '/sitemap.xml', 'text'), lora)
    .filter(url => /^\/get-started\/(?:web|mobile)\/(?:components|templates)\/[\w/-]+$/.test(new URL(url).pathname));
  const bySlug = new Map();
  for (const url of loraUrls) {
    const name = new URL(url).pathname.split('/').at(-1);
    const matches = bySlug.get(name) ?? [];
    matches.push(url);
    bySlug.set(name, matches);
  }
  const usedPages = new Set();
  const localLora = new Set();
  const byUrl = new Map();
  for (const item of loraRegistry.components) {
    if (!slug.test(item.name)) continue;
    const url = new URL(item.url, lora + '/');
    if (url.origin !== lora || !/^\/r\/[\w/-]+\.json$/.test(url.pathname) || url.search) continue;
    if (!byUrl.has(url.href)) byUrl.set(url.href, { ...item, registry: url.href, group: url.pathname.split('/').at(-2) });
  }
  const loraItems = [...byUrl.values()];
  const counts = new Map();
  for (const item of loraItems) counts.set(item.name, (counts.get(item.name) ?? 0) + 1);
  const key = item => counts.get(item.name) > 1 ? item.name + '--' + item.group : item.name;
  const free = loraItems.filter(item => !item.isPremium && item.installType === 'cli');
  const loraCodeReport = await batch(free, async item => {
    const relative = 'private-source/uilora/' + key(item) + '.json';
    if (reuse) {
      for (const existing of new Set([relative, 'private-source/uilora/' + item.name + '.json'])) {
        let cached;
        try { cached = JSON.parse(await readFile(resolve(output, existing), 'utf8')); } catch { continue; }
        if (cached.registry === item.registry && cached.files?.length) {
          if (existing !== relative) await save(relative, cached);
          localLora.add(item.registry);
          return;
        }
      }
    }
    const payload = await read(item.registry);
    if (payload.isPremium || ![payload.code?.tsx, payload.code?.jsx].some(code => typeof code === 'string' && code.trim())) {
      throw Error('No free code in the published entry');
    }
    const files = Object.entries(payload.code).filter(([, content]) => typeof content === 'string' && content.trim())
      .map(([format, content]) => ({ path: item.name + '.' + format, content }));
    await save(relative, { files, dependencies: payload.dependencies ?? item.dependencies ?? [], registry: item.registry });
    localLora.add(item.registry);
  });
  const lou = [];
  for (const item of loraItems) {
    const pages = bySlug.get(item.name) ?? [];
    const exact = pages.find(page => page.includes('/' + item.group + '/'));
    const matched = exact ?? (counts.get(item.name) === 1 ? pages.find(page => page.includes('/web/')) ?? pages[0] : undefined);
    const url = matched ?? lora + '/get-started/web/components';
    if (matched) usedPages.add(matched);
    lou.push({ id: 'uilora:' + key(item), title: item.title || title(item.name), category: item.category || 'Components',
      url, format: url.includes('/mobile/') ? 'React Native' : 'React / Next.js',
      tags: counts.get(item.name) > 1 ? [item.group] : [], access: item.isPremium ? 'premium' : localLora.has(item.registry) ? 'project-code' : 'reference',
      bundle: localLora.has(item.registry) ? 'private-source/uilora/' + key(item) + '.json' : undefined,
      registry: item.isPremium ? undefined : item.registry,
      command: counts.get(item.name) === 1 ? 'npx uilora@1.0.6 add ' + item.name : undefined, license: 'Project use' });
  }
  for (const url of loraUrls) {
    if (usedPages.has(url)) continue;
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    const mobile = parts[1] === 'mobile';
    let bundle;
    if (mobile) {
      const candidate = 'private-source/uilora/mobile-' + parts.at(-1) + '.json';
      try {
        const payload = JSON.parse(await readFile(resolve(output, candidate), 'utf8'));
        if (payload.registry === url && payload.files?.some(file => typeof file.content === 'string' && file.content.trim())) {
          bundle = candidate;
        }
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    lou.push({ id: 'uilora:page:' + parts.slice(1).join('/'), title: title(parts.at(-1)), category: title(parts[3] ?? parts[2]),
      url, format: mobile ? 'React Native' : 'React / Next.js', bundle,
      tags: [], access: bundle ? 'project-code' : 'reference', license: 'Project use' });
  }
  await save('catalogs/uilora.json', {
    label: 'Uilora', project: lora + '/r/registry.json', registryEntries: loraItems.length,
    documentationRoutes: loraUrls.length, entries: lou.sort((a, b) => a.id.localeCompare(b.id))
  });
  console.log('Uilora', JSON.stringify({ registry: loraItems.length, documentation: loraUrls.length,
    localCode: localLora.size, premium: loraRegistry.components.filter(item => item.isPremium).length, codeGaps: loraCodeReport }));
}
