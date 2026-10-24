import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(
  new URL('../../src/core/async.ts', import.meta.url),
  'utf8',
);
const javascript = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { withTimeout } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`
);

test('resolves values before the deadline', async () => {
  assert.equal(await withTimeout(Promise.resolve(42), 100, 'timeout'), 42);
  assert.equal(await withTimeout('plain', 100, 'timeout'), 'plain');
});

test('propagates the original rejection', async () => {
  const error = new Error('bridge failed');
  await assert.rejects(withTimeout(Promise.reject(error), 100, 'timeout'), {
    message: 'bridge failed',
  });
});

test('rejects with the supplied message after the deadline', async () => {
  const never = new Promise(() => {});
  await assert.rejects(withTimeout(never, 10, 'bridge timed out'), {
    message: 'bridge timed out',
  });
});

test('clears the timer once the promise settles', async () => {
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  let createdId;
  let clearedId;

  globalThis.setTimeout = (callback, delay, ...args) => {
    createdId = originalSetTimeout(callback, delay, ...args);
    return createdId;
  };
  globalThis.clearTimeout = (id) => {
    clearedId = id;
    return originalClearTimeout(id);
  };

  try {
    await withTimeout(Promise.resolve('done'), 60_000, 'never fires');
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }

  assert.notEqual(createdId, undefined);
  assert.equal(clearedId, createdId);
});
