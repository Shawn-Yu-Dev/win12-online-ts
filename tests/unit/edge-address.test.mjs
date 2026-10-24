import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(
  new URL('../../src/scripts/edge-address.ts', import.meta.url),
  'utf8',
);
const javascript = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { resolveEdgeAddressInput } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`
);

test('empty address stays empty', () => {
  assert.deepEqual(resolveEdgeAddressInput('  '), { type: 'empty', url: '' });
});

test('hostnames and host-port input navigate over HTTP', () => {
  assert.deepEqual(resolveEdgeAddressInput('example.com/path'), {
    type: 'navigate',
    url: 'http://example.com/path',
  });
  assert.deepEqual(resolveEdgeAddressInput('localhost:5173'), {
    type: 'navigate',
    url: 'http://localhost:5173',
  });
});

test('explicit HTTP URLs are preserved', () => {
  assert.deepEqual(resolveEdgeAddressInput('https://example.com/a'), {
    type: 'navigate',
    url: 'https://example.com/a',
  });
});

test('search text and unsupported schemes become Bing searches', () => {
  assert.deepEqual(resolveEdgeAddressInput('hello win12'), {
    type: 'search',
    url: 'https://bing.com/search?q=hello%20win12',
  });
  assert.equal(resolveEdgeAddressInput('javascript:alert(1)').type, 'search');
  assert.equal(resolveEdgeAddressInput('ftp://example.com').type, 'search');
});

test('credential-bearing URLs are not navigated', () => {
  assert.equal(
    resolveEdgeAddressInput('https://user:password@example.com').type,
    'search',
  );
});
