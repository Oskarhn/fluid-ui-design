#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { parseArgs } from 'node:util';
import { Browser } from './lib/cdp.mjs';

const usage = 'usage: node export-static-ui.mjs <http(s)://page> --owned-design --out NEW_DIRECTORY';
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    help: { type: 'boolean', short: 'h' },
    'owned-design': { type: 'boolean' },
    out: { type: 'string' }
  }
});
const staticTypes = new Set(['Document', 'Stylesheet', 'Script', 'Image', 'Font', 'Media']);
const maxAssetBytes = 8 * 1024 * 1024;
const maxTotalBytes = 32 * 1024 * 1024;

function filePath(url, type) {
  const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  for (const part of parts) {
    if (part === '.' || part === '..' || /[<>:"/\\|?*\x00-\x1f]|[. ]$/.test(part)
      || /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(part)) {
      throw new Error('Unsafe local path in a resource URL.');
    }
  }
  if (type === 'Document' && (url.pathname.endsWith('/') || !parts.at(-1)?.includes('.'))) {
    parts.push('index.html');
  }
  if (!parts.length) throw new Error('Resource URL has no file name.');
  return parts.join('/');
}

function safeTarget(root, name) {
  const target = resolve(root, name);
  const rel = relative(root, target);
  if (!rel || isAbsolute(rel) || rel === '..' || rel.startsWith('..' + (process.platform === 'win32' ? '\\' : '/'))) {
    throw new Error('Resource path leaves the export directory.');
  }
  return target;
}

async function run() {
  if (values.help) {
    console.log(usage);
    return;
  }
  if (positionals.length !== 1 || !values.out || !values['owned-design']) throw new Error(usage);
  const url = new URL(positionals[0]);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Use an HTTP or HTTPS URL without embedded credentials.');
  }
  const output = resolve(values.out);
  mkdirSync(dirname(output), { recursive: true });
  mkdirSync(output);
  const site = join(output, 'site');
  mkdirSync(site);

  const browser = await Browser.launch();
  const report = { requested: url.href, files: [], skipped: [], entry: null };
  try {
    const page = await browser.newPage();
    const methods = new Map();
    const responses = new Map();
    const complete = new Set();
    browser.on(page.sessionId, 'Network.requestWillBeSent', event => {
      methods.set(event.requestId, event.request.method);
    });
    browser.on(page.sessionId, 'Network.responseReceived', event => {
      if (staticTypes.has(event.type)) responses.set(event.requestId, event);
    });
    browser.on(page.sessionId, 'Network.loadingFinished', event => {
      complete.add(event.requestId);
    });
    await page.send('Network.enable', {
      maxTotalBufferSize: maxTotalBytes + maxAssetBytes,
      maxResourceBufferSize: maxAssetBytes
    });
    const frame = await page.send('Page.getFrameTree');
    await page.goto(url.href, { timeoutMs: 16000, settleMs: 450 });
    const landed = new URL(await page.eval(() => location.href));
    report.landed = landed.href;
    if (landed.origin !== url.origin) throw new Error('The page redirected to another origin.');

    const written = new Map();
    let bytes = 0;
    for (const [id, event] of responses) {
      const resource = new URL(event.response.url);
      if (!['http:', 'https:'].includes(resource.protocol)) continue;
      const isEntry = event.type === 'Document' && event.frameId === frame.frameTree.frame.id;
      if (resource.origin !== landed.origin || methods.get(id) !== 'GET' || (!isEntry && event.type === 'Document')) {
        report.skipped.push({ type: event.type, reason: 'Outside the main same-origin static page' });
        continue;
      }
      if (!complete.has(id) || event.response.status < 200 || event.response.status >= 300 || written.size >= 120) {
        report.skipped.push({ type: event.type, reason: 'Response incomplete or over the resource limit' });
        continue;
      }
      try {
        const name = filePath(resource, event.type);
        const key = name.toLowerCase();
        if (written.has(key)) {
          if (written.get(key) !== resource.href) {
            report.skipped.push({ type: event.type, reason: 'Different URLs resolve to the same output path' });
          }
          continue;
        }
        const response = await page.send('Network.getResponseBody', { requestId: id }, 5000);
        const content = Buffer.from(response.body, response.base64Encoded ? 'base64' : 'utf8');
        if (content.length > maxAssetBytes || bytes + content.length > maxTotalBytes) {
          report.skipped.push({ type: event.type, reason: 'Response exceeds the byte budget' });
          continue;
        }
        const target = safeTarget(site, name);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, content, { flag: 'wx' });
        written.set(key, resource.href);
        bytes += content.length;
        report.files.push({ file: name, type: event.type, bytes: content.length });
        if (isEntry) report.entry = name;
      } catch (error) {
        if (isEntry) throw error;
        report.skipped.push({ type: event.type, reason: error.message });
      }
    }
    if (!report.entry) throw new Error('The main HTML response could not be saved.');
  } finally {
    writeFileSync(join(output, 'export-report.json'), JSON.stringify(report, null, 2) + '\n');
    await browser.close();
  }
  console.log('Static page copied to ' + site + ' with entry ' + report.entry);
}

run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
