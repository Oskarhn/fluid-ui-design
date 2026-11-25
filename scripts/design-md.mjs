#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { Browser } from './lib/cdp.mjs';
import { normalizeExtractedStyles } from '../vendor/web-platform/design-md-chrome/lib/normalize.mjs';
import { generateDesignMarkdown } from '../vendor/web-platform/design-md-chrome/lib/generate-design-md.mjs';
import { generateSkillMarkdown } from '../vendor/web-platform/design-md-chrome/lib/generate-skill-md.mjs';
import { validateMarkdownOutput } from '../vendor/web-platform/design-md-chrome/lib/validate.mjs';

const usage = 'usage: node design-md.mjs <http(s)://page> [--out NEW_DIRECTORY] [--width PIXELS] [--height PIXELS] [--mode both|design|skill]';
const extractor = new URL('../vendor/web-platform/design-md-chrome/content-script.js', import.meta.url);

function dimension(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 200 || number > 3840) throw new Error('Viewport dimensions must be integers from 200 through 3840.');
  return number;
}

async function extract(url, viewport) {
  const browser = await Browser.launch(viewport);
  try {
    const page = await browser.newPage(viewport);
    await page.goto(url.href, { timeoutMs: 18000, settleMs: 700 });
    const { frameTree } = await page.send('Page.getFrameTree');
    const { executionContextId } = await page.send('Page.createIsolatedWorld', {
      frameId: frameTree.frame.id,
      worldName: 'fluid-ui-typeui'
    });
    const extensionScript = readFileSync(extractor, 'utf8');
    // Adapt the extension's message port without modifying the visited page's Chrome globals.
    const expression = `(() => {
      let listener;
      const chrome = {runtime:{onMessage:{addListener(callback){ listener = callback; }}}};
      ${extensionScript}
      let response;
      listener({type:'TYPEUI_EXTRACT_STYLES'}, null, result => { response = result; });
      return { response, status:performance.getEntriesByType('navigation')[0]?.responseStatus };
    })()`;
    const evaluated = await page.send('Runtime.evaluate', {
      expression, contextId: executionContextId, returnByValue: true
    });
    const { response, status } = evaluated.result?.value ?? {};
    if (evaluated.exceptionDetails || !response?.ok) throw new Error(response?.error || 'TypeUI could not read the rendered page.');
    if (status >= 400 || !/^https?:\/\//.test(response.payload.source.url)) {
      throw new Error('The reference page did not return a usable web document' + (status ? ' (HTTP ' + status + ').' : '.'));
    }
    if (!response.payload.sampledElements) throw new Error('TypeUI found no visible elements.');
    return response.payload;
  } finally {
    await browser.close();
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      help: { type: 'boolean', short: 'h' },
      out: { type: 'string' },
      width: { type: 'string', default: '1440' },
      height: { type: 'string', default: '900' },
      mode: { type: 'string', default: 'both' }
    }
  });
  if (values.help) {
    console.log(usage);
    return;
  }
  if (positionals.length !== 1 || !['both', 'design', 'skill'].includes(values.mode)) throw new Error(usage);
  const url = new URL(positionals[0]);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Use an HTTP or HTTPS address without embedded credentials.');
  }
  const viewport = { width: dimension(values.width), height: dimension(values.height) };
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const output = resolve(values.out || join('.taste-skill', 'typeui', url.hostname.replace(/[^\w.-]/g, '-') + '-' + stamp));
  mkdirSync(resolve(output, '..'), { recursive: true });
  mkdirSync(output); // A new directory protects any existing DESIGN.md or SKILL.md.

  const payload = await extract(url, viewport);
  const normalized = normalizeExtractedStyles(payload);
  const validation = {};
  if (values.mode !== 'skill') {
    const design = generateDesignMarkdown({ normalized });
    validation.design = validateMarkdownOutput('design', design);
    writeFileSync(join(output, 'DESIGN.md'), design);
  }
  if (values.mode !== 'design') {
    const skill = generateSkillMarkdown({ normalized });
    validation.skill = validateMarkdownOutput('skill', skill);
    writeFileSync(join(output, 'SKILL.md'), skill);
  }
  writeFileSync(join(output, 'report.json'), JSON.stringify({ viewport, normalized, validation }, null, 2) + '\n');
  console.log('TypeUI sampled', payload.sampledElements, 'visible nodes. Results:', output);
  if (Object.values(validation).some(result => result.errors?.length)) process.exitCode = 1;
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
