#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../vendor/web-platform/modern-web-guidance/skills/modern-web-guidance/modern-web.mjs', import.meta.url));
const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], { stdio: 'inherit' });
if (result.error) {
  console.error('Could not start Modern Web Guidance:', result.error.message);
}
process.exitCode = result.status ?? 1;
