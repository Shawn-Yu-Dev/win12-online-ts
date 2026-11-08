import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(
  new URL('../../src/shell/taskbar-layout.ts', import.meta.url),
  'utf8',
);
const javascript = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { getTaskbarLayout } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`
);

test('an empty taskbar is hidden with only its padding width', () => {
  assert.deepEqual(getTaskbarLayout(0), { display: 'none', width: 4 });
});

test('the taskbar grows by one 34px button plus 4px gap per item', () => {
  assert.deepEqual(getTaskbarLayout(1), { display: 'flex', width: 42 });
  assert.deepEqual(getTaskbarLayout(3), { display: 'flex', width: 118 });
});
