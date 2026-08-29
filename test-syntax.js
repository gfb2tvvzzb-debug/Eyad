#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join } from 'path';

const files = [
  'server/admin.js',
  'server/app.js',
  'server/auth.js',
  'server/assignments.js',
  'server/db.js',
];

let hasErrors = false;

for (const file of files) {
  try {
    const source = readFileSync(join('.', file), 'utf8');
    new Function(source);
    console.log(`✓ ${file}`);
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
    hasErrors = true;
  }
}

process.exit(hasErrors ? 1 : 0);
