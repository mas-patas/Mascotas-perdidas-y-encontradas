#!/usr/bin/env node
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const repoRoot = path.resolve(__dirname, '..');
const srcDir = path.join(repoRoot, 'src');

const itemsToMove = [
  'App.tsx',
  'index.tsx',
  'types.ts',
  'constants.ts',
  'config.ts',
  'sw.js',
  'manifest.json',
  'components',
  'contexts',
  'hooks',
  'services',
  'utils',
  'data'
];

if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir);
  console.log('Created src/');
}

for (const name of itemsToMove) {
  const srcPath = path.join(repoRoot, name);
  const destPath = path.join(srcDir, name);
  if (!fs.existsSync(srcPath)) {
    console.warn(`Skipping ${name}: not found at repository root`);
    continue;
  }
  if (fs.existsSync(destPath)) {
    console.warn(`Skipping ${name}: already exists in src/`);
    continue;
  }

  try {
    fs.renameSync(srcPath, destPath);
    console.log(`Moved ${name} -> src/${name}`);
  } catch (err) {
    console.error(`Failed to move ${name}:`, err && err.message ? err.message : err);
  }
}

console.log('Move complete. Please review changes and run your build/dev server.');
