#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const usage = 'Usage: node compare-lighthouse.mjs <before-directory> <after-directory>';
const throttlingLabels = {
  simulate: 'simulated network and CPU throttling',
  devtools: 'DevTools network and CPU throttling',
  provided: 'externally configured network and CPU settings',
};
const metrics = [
  ['Performance score (/100)', report => (report.categories?.performance?.score ?? NaN) * 100, 1],
  ['Largest Contentful Paint (ms)', report => audit(report, 'largest-contentful-paint'), 0],
  ['Total Blocking Time (ms)', report => audit(report, 'total-blocking-time'), 0],
  ['Cumulative Layout Shift', report => audit(report, 'cumulative-layout-shift'), 3],
  ['Transfer size (KiB)', report => audit(report, 'total-byte-weight') / 1024, 1],
];

function audit(report, id) {
  return report.audits?.[id]?.numericValue ?? NaN;
}

function settingsKey(report) {
  const settings = report.configSettings;
  return {
    version: report.lighthouseVersion,
    browser: report.environment?.hostUserAgent || report.userAgent,
    formFactor: settings.formFactor,
    throttlingMethod: settings.throttlingMethod,
    throttling: settings.throttling,
    screen: settings.screenEmulation,
    storageReset: !settings.disableStorageReset,
    onlyCategories: settings.onlyCategories ?? null,
  };
}

function readRuns(directory) {
  const files = readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
    .map(entry => join(directory, entry.name))
    .sort();
  if (!files.length) throw new Error('No Lighthouse JSON reports found in ' + directory);
  return files.map(file => {
    let report;
    try {
      report = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
    } catch (error) {
      throw new Error(file + ' could not be read: ' + error.message);
    }
    if (!report?.lighthouseVersion || !report.requestedUrl || !report.configSettings?.formFactor
      || !report.configSettings.throttlingMethod) {
      throw new Error(file + ' does not contain a Lighthouse navigation report.');
    }
    if (report.runtimeError) {
      throw new Error(file + ' did not complete: ' + (report.runtimeError.code || 'navigation error'));
    }
    const settings = settingsKey(report);
    if (!settings.browser) throw new Error(file + ' does not identify the browser.');
    const values = metrics.map(([label, read]) => {
      const value = read(report);
      if (!Number.isFinite(value) || value < 0) throw new Error(file + ' is missing a valid ' + label);
      return value;
    });
    const finalUrl = report.finalDisplayedUrl ?? report.finalUrl ?? report.requestedUrl;
    return { file, url: report.requestedUrl, finalUrl, settings, values };
  });
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const center = Math.floor(sorted.length / 2);
  return (sorted[center] + sorted[Math.floor((sorted.length - 1) / 2)]) / 2;
}

function compare(before, after) {
  const settings = before[0].settings;
  for (const runs of [before, after]) {
    for (const run of runs) {
      if (run.url !== runs[0].url || run.finalUrl !== runs[0].finalUrl) {
        throw new Error(run.file + ' navigated to a different URL in the same group.');
      }
      if (!isDeepStrictEqual(run.settings, settings)) {
        throw new Error(run.file + ' uses different Lighthouse, Chrome, or test settings.');
      }
    }
  }
  const rows = metrics.map(([label, , precision], i) => {
    const first = Number(median(before.map(run => run.values[i])).toFixed(precision));
    const last = Number(median(after.map(run => run.values[i])).toFixed(precision));
    const delta = Number((last - first).toFixed(precision));
    return '| ' + label + ' | ' + first + ' | ' + last + ' | ' + (delta > 0 ? '+' : '') + delta + ' |';
  });
  const throttling = throttlingLabels[settings.throttlingMethod] ?? settings.throttlingMethod;
  return [
    '# Lighthouse before and after',
    '',
    '- Lighthouse ' + settings.version + ' on the ' + settings.formFactor + ' profile with ' + throttling + '.',
    '- Storage reset ' + (settings.storageReset ? 'enabled.' : 'disabled.'),
    '- Before (' + before.length + ' runs) ' + before[0].url,
    '- After (' + after.length + ' runs) ' + after[0].url,
    '',
    '| Metric | Before median | After median | Difference |',
    '| --- | ---: | ---: | ---: |',
    ...rows,
    '',
    'These are navigation lab results. TBT measures blocking during startup.',
  ].join('\n');
}

const args = process.argv.slice(2);
if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
  console.log(usage);
} else if (args.length !== 2 || args.some(arg => arg.startsWith('--'))) {
  console.error(usage);
  process.exitCode = 2;
} else {
  try {
    console.log(compare(readRuns(args[0]), readRuns(args[1])));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
