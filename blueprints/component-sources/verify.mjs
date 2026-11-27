import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { serveLibrary } from '../reference-components/test-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const read = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const types = ['uiverse', 'forgeui', 'uilora'];
const all = Object.fromEntries(await Promise.all(types.map(async name => [name, await read('./catalogs/' + name + '.json')])));
const chunks = new Map();
const checkout = process.argv[2];
let archived = 0;
let matchedSource = 0;
for (const name of types) {
  const ids = new Set();
  for (const entry of all[name].entries) {
    assert.ok(entry.title && entry.category && entry.format && Array.isArray(entry.tags), entry.id);
    assert.equal(ids.has(entry.id), false, 'Duplicate ' + entry.id);
    ids.add(entry.id);
    if (entry.access === 'premium') assert.equal(entry.bundle, undefined);
    if (!entry.bundle) continue;
    if (name === 'uiverse') {
      if (!chunks.has(entry.bundle)) chunks.set(entry.bundle, await read('./' + entry.bundle));
      const original = chunks.get(entry.bundle)[entry.key];
      assert.equal(typeof original, 'string', entry.id);
      if (checkout) {
        const category = entry.id.split(':')[1];
        const expected = await readFile(resolve(checkout, category, entry.filename), 'utf8');
        assert.equal(original, expected, entry.id);
        matchedSource++;
      }
      archived++;
    } else {
      let payload;
      try { payload = await read('./' + entry.bundle); }
      catch (error) {
        if (error.code === 'ENOENT' && !checkout) continue;
        throw error;
      }
      assert.ok(payload.files.some(file => typeof file.path === 'string' && file.content.trim()), entry.id);
      if (entry.registry) assert.equal(payload.registry, entry.registry);
      archived++;
    }
  }
}

const byId = (source, id) => all[source].entries.find(entry => entry.id === id);
const buttonEntry = all.uiverse.entries.find(entry => entry.filename === '0x-Sarthak_hungry-penguin-30.html');
const twEntry = all.uiverse.entries.find(entry => entry.format === 'Tailwind');
const forge = byId('forgeui', 'forgeui:accordion-01');
const lora = byId('uilora', 'uilora:apple-glass-nav');
const native = byId('uilora', 'uilora:page:mobile/components/buttons/hero-button');
const premium = all.uilora.entries.find(entry => entry.access === 'premium');
assert.ok(buttonEntry && twEntry && forge && lora && native && premium);

const host = await serveLibrary();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const base = host.origin + '/blueprints/component-sources/index.html';
const checks = [];
try {
  for (const width of [1280, 390]) {
    const ctx = await browser.newContext({
      viewport: { width, height: 890 }, hasTouch: width === 390, reducedMotion: width === 390 ? 'reduce' : 'no-preference',
      permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true
    });
    const blocked = [];
    await ctx.route('**/*', route => {
      if (route.request().url().startsWith(host.origin + '/')) return route.continue();
      blocked.push(route.request().url());
      return route.abort();
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(6500);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.waitForFunction(() => document.querySelector('#source').options.length === 4);
    assert.equal(await page.locator('#results button').count(), 28);
    const before = await page.locator('#results button').first().getAttribute('data-id');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    assert.notEqual(await page.locator('#results button').first().getAttribute('data-id'), before);
    await page.getByRole('button', { name: 'Previous', exact: true }).click();
    assert.equal(await page.locator('#results button').first().getAttribute('data-id'), before);
    checks.push('catalog-paging:'+width);

    await page.getByLabel('Source', { exact: true }).selectOption('uiverse');
    await page.getByLabel('Category', { exact: true }).selectOption('Buttons');
    await page.getByRole('searchbox').fill('hungry penguin 30');
    await page.locator('#entry-title').filter({ hasText: buttonEntry.title }).waitFor();
    const copy = page.getByRole('button', { name: 'Copy code' });
    await copy.waitFor();
    await page.frameLocator('#stage').getByRole('button', { name: /Contact Us/i }).waitFor();
    assert.equal(await page.locator('#stage').getAttribute('sandbox'), '');
    assert.match(await page.locator('#stage').getAttribute('srcdoc'), /default-src 'none'/);
    await copy.click();
    const pasted = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(pasted, /From Uiverse\.io by 0x-Sarthak/);
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download file' }).click();
    assert.equal((await downloaded).suggestedFilename(), buttonEntry.filename);
    await page.getByRole('button', { name: 'Dark preview' }).click();
    await page.waitForFunction(() => document.querySelector('#stage').srcdoc.includes('#172338'));
    checks.push('css-preview-copy-download:'+width);

    async function open(entry, mode) {
      await page.goto(base + '?view=' + mode + '#' + encodeURIComponent(entry.id));
      await page.locator('#entry-title').filter({ hasText: entry.title }).waitFor();
    }
    await open(twEntry,'tailwind');
    await page.waitForFunction(() => !document.querySelector('#preview').hidden && document.querySelector('#stage').srcdoc.length > 15000);
    assert.match(await page.getByLabel('Code', { exact:true }).inputValue(), /class=/);
    if (width === 390) assert.match(await page.locator('#stage').getAttribute('srcdoc'), /animation-duration:0s/);
    checks.push('tailwind-offline:'+width);

    for (const entry of [forge, lora]) {
      await open(entry,entry.id.split(':')[0]);
      if (checkout) {
        await page.waitForFunction(() => document.querySelector('#entry-status').textContent.startsWith('Local source for use'));
        assert.match(await page.getByLabel('Code',{exact:true}).inputValue(), /import|export|function/);
        assert.ok(await page.locator('#registry').isVisible());
      } else {
        await page.waitForFunction(() => /^Local source/.test(document.querySelector('#entry-status').textContent));
      }
      assert.ok(await page.locator('#preview').isHidden());
    }
    checks.push('forgeui-and-uilora-source:'+width);

    await open(native,'mobile-source');
    if (checkout) {
      await page.waitForFunction(() => document.querySelector('#entry-status').textContent.startsWith('Local source for use'));
      assert.match(await page.getByLabel('Code',{exact:true}).inputValue(), /^import React/);
      await page.getByLabel('Source file',{exact:true}).selectOption({ label: 'usage.tsx' });
      assert.match(await page.getByLabel('Code',{exact:true}).inputValue(), /(?:import|export).*React|react-native/);
    }
    assert.match(await page.locator('#entry-meta').textContent(), /React Native/);
    checks.push('uilora-native-source:'+width);

    if (checkout) {
      const advisory = byId('uilora', 'uilora:card-wizard');
      await open(advisory,'variant-advisory');
      const sourceFile = page.getByLabel('Source file',{exact:true});
      await sourceFile.selectOption({ label: 'card-wizard.jsx' });
      assert.match(await page.locator('#code-note').textContent(), /syntax error/);
      await sourceFile.selectOption({ label: 'card-wizard.tsx' });
      assert.ok(await page.locator('#code-note').isHidden());
      checks.push('uilora-variant-advisory:'+width);
    }

    await open(premium,'premium');
    assert.match(await page.locator('#entry-status').textContent(), /^Premium reference/);
    assert.equal(await page.locator('#registry').isHidden(), true);
    await page.getByRole('searchbox').fill('nothing-matches-7412854');
    assert.match(await page.locator('#result-count').textContent(), /No matching/);
    assert.equal(await page.locator('.detail').isHidden(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    assert.deepEqual(errors, []);
    assert.deepEqual(blocked, []);
    checks.push('premium-and-empty-state:'+width);
    await ctx.close();
  }
  console.log(JSON.stringify({ entries: Object.values(all).reduce((sum, data) => sum + data.entries.length, 0),
    archived, matchedSource, browserChecks: checks }, null, 2));
} finally {
  await browser.close();
  await host.close();
}
