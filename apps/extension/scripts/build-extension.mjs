/**
 * Build extension → apps/extension/dist/
 */
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const extRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: extRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run('node', ['scripts/write-placeholder-icons.mjs']);
run('npx', ['vite', 'build']);

const workerSrc = path.join(
  extRoot,
  'node_modules',
  'pdfjs-dist',
  'legacy',
  'build',
  'pdf.worker.min.mjs',
);
const workerDest = path.join(extRoot, 'dist', 'pdf.worker.min.mjs');
if (!fs.existsSync(workerSrc)) {
  console.error('[build-extension] missing pdf.worker.min.mjs at', workerSrc);
  process.exit(1);
}
fs.copyFileSync(workerSrc, workerDest);
console.log('[build-extension] copied pdf.worker.min.mjs → dist/');

console.log('\n[build-extension] done: apps/extension/dist/');
