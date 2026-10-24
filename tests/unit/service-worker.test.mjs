import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(
  new URL('../../src/entries/service-worker.ts', import.meta.url),
  'utf8',
);
const javascript = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

let sequence = 0;

function createResponse(url, status) {
  return {
    url,
    status,
    ok: status >= 200 && status < 300,
    clone() {
      return createResponse(url, status);
    },
  };
}

function createHarness({ initialUrls = [], fetchResponses = [] } = {}) {
  const listeners = {};
  const entries = new Map(
    initialUrls.map((url) => [url, createResponse(url, 200)]),
  );
  const state = {
    deleteCalls: [],
    fetchCalls: [],
    putCalls: [],
  };
  const queue = [...fetchResponses];

  const cache = {
    keys() {
      return Promise.resolve(
        [...entries.keys()].map((url) => ({ url, method: 'GET' })),
      );
    },
    put(request, response) {
      state.putCalls.push({ request, response });
      entries.set(request.url, response);
      return Promise.resolve();
    },
    delete(request) {
      state.deleteCalls.push(request.url);
      entries.delete(request.url);
      return Promise.resolve(true);
    },
  };

  const harness = {
    cache,
    caches: {
      keys: () => Promise.resolve(['def']),
      open: () => Promise.resolve(cache),
      match: (request) => Promise.resolve(entries.get(request.url)),
    },
    entries,
    fetch(request) {
      state.fetchCalls.push(request.url);
      const next = queue.shift();
      if (next instanceof Error) return Promise.reject(next);
      return Promise.resolve(next || createResponse(request.url, 200));
    },
    listeners,
    state,
  };

  return harness;
}

async function loadWorker(harness) {
  globalThis.self = {
    addEventListener(type, listener) {
      harness.listeners[type] = listener;
    },
  };
  globalThis.caches = harness.caches;
  globalThis.fetch = harness.fetch;
  const unique = `${javascript}\n// harness ${sequence++}`;
  return import(
    `data:text/javascript;base64,${Buffer.from(unique).toString('base64')}`
  );
}

async function dispatchFetch(worker, harness, { url, method = 'GET' }) {
  let responsePromise;
  harness.listeners.fetch({
    request: { url, method },
    respondWith(promise) {
      responsePromise = Promise.resolve(promise);
    },
  });
  return responsePromise;
}

test('protected paths survive cache refreshes', async () => {
  const harness = createHarness();
  const worker = await loadWorker(harness);

  const cases = [
    ['https://example.com/fonts/dos.ttf', true],
    ['https://example.com/img/bg.svg', true],
    ['https://example.com/apps/icons/setting/home.png', true],
    ['https://example.com/bootstrap-icons.css', true],
    ['https://example.com/desktop.html', false],
    ['https://example.com/assets/desktop-123.js', false],
    ['https://example.com/games/minesweeper.html', false],
    ['not-a-url', false],
  ];

  for (const [url, expected] of cases) {
    assert.equal(worker.isProtected(url), expected, url);
  }

  assert.deepEqual(worker.protectedPaths, [
    '/fonts/',
    '/img/',
    '/apps/icons/',
    '/bootstrap-icons.css',
  ]);
});

test('activate keeps protected assets and removes mutable ones', async () => {
  const protectedUrl = 'https://example.com/fonts/dos.ttf';
  const mutableUrl = 'https://example.com/assets/desktop-123.js';
  const harness = createHarness({ initialUrls: [protectedUrl, mutableUrl] });
  const worker = await loadWorker(harness);

  let work;
  harness.listeners.activate({
    waitUntil(promise) {
      work = promise;
    },
  });

  assert.equal(typeof work?.then, 'function');
  await work;
  assert.deepEqual(harness.state.deleteCalls, [mutableUrl]);
  assert.equal(harness.entries.has(protectedUrl), true);
  assert.equal(harness.entries.has(mutableUrl), false);
});

test('forced updates clear protected assets too', async () => {
  const protectedUrl = 'https://example.com/fonts/dos.ttf';
  const harness = createHarness({ initialUrls: [protectedUrl] });
  const worker = await loadWorker(harness);

  await worker.updateCache(true);
  assert.equal(harness.entries.has(protectedUrl), false);

  harness.entries.set(protectedUrl, createResponse(protectedUrl, 200));
  let work;
  harness.listeners.message({
    data: { head: 'update', force: true },
    waitUntil(promise) {
      work = promise;
    },
  });
  await work;
  assert.equal(harness.entries.has(protectedUrl), false);
});

test('successful GET responses are cached and served cache-first', async () => {
  const resource = 'https://example.com/assets/app.js';
  const harness = createHarness({
    fetchResponses: [
      createResponse(resource, 404),
      createResponse(resource, 200),
    ],
  });
  const worker = await loadWorker(harness);

  assert.equal(
    (await dispatchFetch(worker, harness, { url: resource })).status,
    404,
  );
  assert.equal(harness.entries.has(resource), false);

  assert.equal(
    (await dispatchFetch(worker, harness, { url: resource })).status,
    200,
  );
  assert.equal(harness.entries.has(resource), true);
  assert.equal(
    (await dispatchFetch(worker, harness, { url: resource })).status,
    200,
  );
  assert.equal(harness.state.fetchCalls.length, 2);
});

test('failed responses are never cached', async () => {
  const resource = 'https://example.com/assets/unavailable.js';
  const harness = createHarness({
    fetchResponses: [createResponse(resource, 503)],
  });
  const worker = await loadWorker(harness);

  assert.equal(
    (await dispatchFetch(worker, harness, { url: resource })).status,
    503,
  );
  assert.equal(harness.entries.has(resource), false);
});

test('dynamic hosts always bypass the cache', async () => {
  const dynamic = 'https://api.github.com/repos/win12-online/win12';
  const harness = createHarness({
    initialUrls: [dynamic],
    fetchResponses: [createResponse(dynamic, 200)],
  });
  const worker = await loadWorker(harness);

  assert.equal(worker.isDynamicRequest(new URL(dynamic)), true);
  await dispatchFetch(worker, harness, { url: dynamic });
  assert.equal(harness.state.fetchCalls.length, 1);
});

test('non-GET and non-HTTP requests are ignored', async () => {
  const harness = createHarness();
  const worker = await loadWorker(harness);

  let called = false;
  harness.listeners.fetch({
    request: { url: 'https://example.com/api', method: 'POST' },
    respondWith() {
      called = true;
    },
  });
  harness.listeners.fetch({
    request: { url: 'file:///tmp/app.js', method: 'GET' },
    respondWith() {
      called = true;
    },
  });

  assert.equal(called, false);
});

test('message events require the update header', async () => {
  const protectedUrl = 'https://example.com/fonts/dos.ttf';
  const harness = createHarness({ initialUrls: [protectedUrl] });
  const worker = await loadWorker(harness);

  harness.listeners.message({ data: { head: 'other', force: true } });
  assert.deepEqual(harness.state.deleteCalls, []);

  let work;
  harness.listeners.message({
    data: { head: 'update', force: false },
    waitUntil(promise) {
      work = promise;
    },
  });
  await work;
  assert.deepEqual(harness.state.deleteCalls, []);
  assert.equal(harness.entries.has(protectedUrl), true);
});
