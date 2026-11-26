#!/usr/bin/env node
import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const input = args.shift();
const usage = 'usage: node url-study.mjs <http(s)://page> [--out NEW_DIRECTORY] [--responsive-shots] [--engine both|designlang|typeui] [--interaction-plan PLAN.json] [--copy-owned-static]';
const fail = (message) => { console.error(message); process.exit(2); };

if (!input || input === '--help' || input === '-h') {
  console.log(usage);
  process.exit(input ? 0 : 2);
}

let url;
try { url = new URL(input); } catch { fail('Provide an absolute HTTP or HTTPS URL.'); }
// ASVS 1.2.2: accept only web navigation schemes and keep credentials out of arguments.
if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
  fail('Use an HTTP or HTTPS address without embedded credentials.');
}

let output;
let responsive = false;
let engine;
let interaction;
let copyOwned = false;
while (args.length) {
  const flag = args.shift();
  if (flag === '--out' && !output && args[0] && !args[0].startsWith('--')) output = args.shift();
  else if (flag === '--responsive-shots' && !responsive) responsive = true;
  else if (flag === '--engine' && !engine && ['both', 'designlang', 'typeui'].includes(args[0])) engine = args.shift();
  else if (flag === '--interaction-plan' && !interaction && args[0] && !args[0].startsWith('--')) interaction = resolve(args.shift());
  else if (flag === '--copy-owned-static' && !copyOwned) copyOwned = true;
  else fail(usage);
}
engine ??= 'both';
if (engine === 'typeui' && responsive) fail('--responsive-shots is a DesignLang option.');
if (interaction && !existsSync(interaction)) fail('The interaction plan could not be found.');

const entry = process.env.DESIGNLANG_ENTRY || join(homedir(), '.local', 'design-tools', 'node_modules', 'designlang', 'bin', 'design-extract.js');
const hasDesignLang = existsSync(entry);
if (engine === 'designlang' && !hasDesignLang) fail('DesignLang is unavailable. Set DESIGNLANG_ENTRY to the installed bin/design-extract.js.');

const stamp = new Date().toISOString().replace(/[^0-9A-Za-z]/g, '-');
const host = url.hostname.replace(/[^0-9A-Za-z.-]/g, '-') || 'page';
const directory = resolve(output || join('.taste-skill', 'url-study', host + '-' + stamp));
if (existsSync(directory)) fail('Choose a new output directory for this capture.');
mkdirSync(directory, { recursive: true });

function run(label, command) {
  const child = spawnSync(process.execPath, command, { stdio: 'inherit' });
  if (child.error) console.error('Could not start ' + label + ':', child.error.message);
  if (child.status !== 0) console.error(label + ' did not complete. Check the capture output at', directory);
  return child.status === 0;
}
let ok = true;
if (engine !== 'typeui' && hasDesignLang) {
  const capture = [resolve(entry), url.href, '--out', directory, '--system-chrome', '--no-history', '--responsive', '--motion-runtime'];
  if (responsive) capture.push('--responsive-shots');
  ok = run('DesignLang', capture);
} else if (engine === 'both') {
  console.warn('DesignLang is unavailable. The bundled TypeUI extraction will still run.');
}
if (engine !== 'designlang') {
  const typeui = fileURLToPath(new URL('./design-md.mjs', import.meta.url));
  ok = run('TypeUI', [typeui, url.href, '--out', join(directory, 'typeui')]) && ok;
}
if (interaction) {
  const recorder = fileURLToPath(new URL('./record-ui.mjs', import.meta.url));
  ok = run('Interaction capture', [recorder, url.href, '--plan', interaction, '--out', join(directory, 'interactions')]) && ok;
}
if (copyOwned) {
  const exporter = fileURLToPath(new URL('./export-static-ui.mjs', import.meta.url));
  ok = run('Static page export', [exporter, url.href, '--owned-design', '--out', join(directory, 'static-export')]) && ok;
}
console.log('URL study written to', directory);
process.exitCode = ok ? 0 : 1;
