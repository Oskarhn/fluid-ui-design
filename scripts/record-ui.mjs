#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { Browser, sleep } from './lib/cdp.mjs';

const usage = 'usage: node record-ui.mjs <http(s)://page> --plan PLAN.json --out NEW_DIRECTORY';
const supportedKeys = { Escape: 27, Tab: 9, Enter: 13, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Space: 32 };
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    help: { type: 'boolean', short: 'h' },
    plan: { type: 'string' },
    out: { type: 'string' }
  }
});

function validatePlan(plan) {
  const bounded = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;
  const { viewport = {}, watch = [], steps } = plan ?? {};
  const { width = 1440, height = 900, mobile = false } = viewport;
  if (!bounded(width, 240, 3840) || !bounded(height, 240, 2160) || typeof mobile !== 'boolean') {
    throw new Error('Set a valid viewport width, height, and optional mobile flag.');
  }
  const selector = text => typeof text === 'string' && text.trim() && text.length <= 400;
  if (!Array.isArray(watch) || watch.length > 12 || watch.some(item => !selector(item))) {
    throw new Error('watch must be a list of up to 12 CSS selectors.');
  }
  if (!Array.isArray(steps) || steps.length < 1 || steps.length > 16) {
    throw new Error('The plan needs 1–16 interaction steps.');
  }
  for (const [index, step] of steps.entries()) {
    const valid = step && ((['click', 'hover'].includes(step.action) && selector(step.selector))
      || (step.action === 'wheel' && bounded(step.delta, -3600, 3600) && step.delta !== 0)
      || (step.action === 'key' && Object.hasOwn(supportedKeys, step.key)));
    if (!valid || (step.label !== undefined && !selector(step.label))) {
      throw new Error('Invalid step ' + (index + 1) + '. Use click, hover, wheel, or a supported key.');
    }
  }
  return { viewport: { width, height, mobile }, watch, steps };
}

function observe(selectors) {
  const read = el => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      display: style.display, visibility: style.visibility, opacity: style.opacity,
      transform: style.transform, clipPath: style.clipPath,
      foreground: style.color, background: style.backgroundColor, font: style.fontFamily,
      rect: [rect.x, rect.y, rect.width, rect.height].map(value => Math.round(value * 10) / 10),
      expanded: el.getAttribute('aria-expanded'), pressed: el.getAttribute('aria-pressed'),
      selected: el.getAttribute('aria-selected'), open: el.hasAttribute('open'),
      text: el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100)
    };
  };
  return {
    scroll: [scrollX, scrollY],
    focus: document.activeElement?.id || document.activeElement?.tagName,
    watched: Object.fromEntries(selectors.map(selector => {
      const matches = document.querySelectorAll(selector);
      return [selector, matches.length === 1 ? read(matches[0]) : { matches: matches.length }];
    })),
    animations: document.getAnimations().slice(0, 30).map(animation => {
      const effect = animation.effect;
      const sampled = effect?.getComputedTiming();
      return {
        name: animation.animationName || animation.transitionProperty || animation.id || null,
        target: effect?.target?.id || effect?.target?.tagName || null,
        currentTime: animation.currentTime,
        duration: sampled?.duration,
        easing: sampled?.easing,
        progress: sampled?.progress
      };
    })
  };
}

function pointForSelector(selector) {
  const elements = document.querySelectorAll(selector);
  if (elements.length !== 1) throw new Error('Expected exactly one target, got ' + elements.length + ': ' + selector);
  const target = elements[0];
  target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
  const rect = target.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const hit = document.elementFromPoint(x, y);
  if (!rect.width || !rect.height || !hit || !target.contains(hit)) throw new Error('The target is hidden or covered: ' + selector);
  return { x, y };
}

async function act(page, step, target) {
  if (step.action === 'wheel') {
    await page.wheel(step.delta, { pauseMs: 16 });
    return;
  }
  if (step.action === 'key') {
    const key = step.key === 'Space' ? ' ' : step.key;
    const event = { key, code: step.key, windowsVirtualKeyCode: supportedKeys[step.key] };
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', ...event });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', ...event });
    return;
  }
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...target });
  if (step.action === 'click') {
    const event = { ...target, button: 'left', clickCount: 1 };
    await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...event });
    await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...event });
  }
}

async function run() {
  if (values.help) {
    console.log(usage);
    return;
  }
  if (positionals.length !== 1 || !values.plan || !values.out) throw new Error(usage);
  const url = new URL(positionals[0]);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Use an HTTP or HTTPS URL without embedded credentials.');
  }
  const plan = validatePlan(JSON.parse(readFileSync(values.plan, 'utf8').replace(/^\uFEFF/, '')));
  const dest = resolve(values.out);
  mkdirSync(dirname(dest), { recursive: true });
  mkdirSync(dest);
  const browser = await Browser.launch(plan.viewport);
  const report = { requested: url.href, viewport: plan.viewport, steps: [] };
  try {
    const page = await browser.newPage(plan.viewport);
    await page.goto(url.href, { timeoutMs: 15000, settleMs: 450 });
    report.landed = await page.eval(() => location.href);
    if (new URL(report.landed).origin !== url.origin) throw new Error('The requested page redirected to another origin.');
    report.baseline = await page.eval(observe, plan.watch);
    await page.screenshot({ path: join(dest, 'initial.jpg') });
    for (const [index, step] of plan.steps.entries()) {
      const result = { step, samples: [] };
      report.steps.push(result);
      try {
        const target = step.selector ? await page.eval(pointForSelector, step.selector) : undefined;
        result.before = await page.eval(observe, plan.watch);
        const started = performance.now();
        await act(page, step, target);
        for (const delay of [0, 90, 260, 800]) {
          await sleep(Math.max(0, delay - (performance.now() - started)));
          const when = Math.round(performance.now() - started);
          if (new URL(await page.eval(() => location.href)).origin !== url.origin) {
            result.error = 'The action left the reference origin.';
            break;
          }
          const state = await page.eval(observe, plan.watch);
          result.samples.push({ msAfterInputStart: when, ...state });
          if (delay === 90 || delay === 800) {
            const name = String(index + 1).padStart(2, '0') + '-' + delay + 'ms.jpg';
            await page.screenshot({ path: join(dest, name) });
            result.samples.at(-1).screenshot = name;
          }
        }
        if (result.error) break;
      } catch (error) {
        result.error = error.message;
      }
    }
  } finally {
    writeFileSync(join(dest, 'interaction-report.json'), JSON.stringify(report, null, 2) + '\n');
    await browser.close();
  }
  console.log('Interaction evidence saved to ' + dest);
  if (report.steps.some(step => step.error)) process.exitCode = 1;
}

run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
