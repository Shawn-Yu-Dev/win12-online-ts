import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(
  new URL('../../src/core/redirect.ts', import.meta.url),
  'utf8',
);
const javascript = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { resolveEntryRedirect } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`
);

test('the default entry is the boot animation', () => {
  assert.equal(resolveEntryRedirect(''), './boot.html');
  assert.equal(resolveEntryRedirect('?foo=bar'), './boot.html');
  assert.equal(resolveEntryRedirect('?to=boot'), './boot.html');
});

test('?to=desktop skips the boot animation', () => {
  assert.equal(resolveEntryRedirect('?to=desktop'), './desktop.html');
  assert.equal(resolveEntryRedirect('?to=DESKTOP'), './boot.html');
});

test('the fork never redirects visitors back to the upstream site', () => {
  for (const search of ['', '?to=desktop', '?from=pages']) {
    assert.equal(resolveEntryRedirect(search).startsWith('http'), false);
  }
});
