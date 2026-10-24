#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const dirs = ['apps', 'fonts', 'icon', 'img', 'media', 'pwa'];
const files = [
  'bg.svg',
  'bg-dark.svg',
  'bootstrap-icons.css',
  'base.css',
  'desktop.css',
  'reload.html',
  'shutdown.html',
];

mkdirSync(dist, { recursive: true });
for (const dir of dirs) {
  const from = resolve(root, dir);
  if (existsSync(from)) cpSync(from, resolve(dist, dir), { recursive: true });
}
const data = resolve(root, 'data');
if (existsSync(data)) {
  cpSync(data, resolve(dist, 'data'), {
    recursive: true,
    filter: (source) => extname(source) === '' || extname(source) === '.html',
  });
}
const languages = resolve(root, 'lang/lang');
if (existsSync(languages)) {
  cpSync(languages, resolve(dist, 'lang/lang'), {
    recursive: true,
    filter: (source) =>
      extname(source) === '' || extname(source) === '.properties',
  });
}
for (const file of files) {
  const from = resolve(root, file);
  if (existsSync(from)) cpSync(from, resolve(dist, file));
}
