import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(
  new URL('../../src/core/properties.ts', import.meta.url),
  'utf8',
);
const javascript = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { parseProperties } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`
);

const englishPath = new URL(
  '../../lang/lang/lang_en.properties',
  import.meta.url,
);
const hasLocales = existsSync(englishPath);

test('values may contain escaped delimiters', () => {
  const map = parseProperties(
    [
      '# comment=ignored',
      '! comment:ignored',
      'embedded=alpha\\=beta:gamma',
      'colon.key:colon\\=value',
    ].join('\n'),
  );

  assert.equal(map.embedded, 'alpha\\=beta:gamma');
  assert.equal(map['colon.key'], 'colon\\=value');
  assert.equal(Object.hasOwn(map, '# comment'), false);
});

test('odd trailing backslashes continue a logical line', () => {
  const map = parseProperties(
    [
      'continued=first\\',
      '    second\\=part\\',
      '\tthird',
      'even=two\\\\',
      'next=separate',
    ].join('\n'),
  );

  assert.equal(map.continued, 'firstsecond\\=partthird');
  assert.equal(map.even, 'two\\\\');
  assert.equal(map.next, 'separate');
});

test('unicode escapes are decoded once', () => {
  const map = parseProperties('greeting=\\u4f60\\u597d\\n');
  assert.equal(map.greeting, '你好\\n');
});

test('empty input and comment-only input yield no keys', () => {
  assert.deepEqual(parseProperties(''), {});
  assert.deepEqual(parseProperties('# a\n! b\n   \n'), {});
});

test(
  'the real English bundle keeps every physical key separate',
  { skip: !hasLocales && 'locale submodule is not initialized' },
  async () => {
    const english = await readFile(englishPath, 'utf8');
    const map = parseProperties(english);
    const expectedKeys = english
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(
        (line) => line && line.charAt(0) !== '#' && line.charAt(0) !== '!',
      )
      .map((line) => line.slice(0, line.indexOf('=')).trim())
      .sort();

    assert.deepEqual(Object.keys(map).sort(), expectedKeys);

    for (const key of [
      'nts.fs-mount-error',
      'nts.file-read-error',
      'setting.psnl.round',
      'about.intro.intro.p3',
      'about.intro.others',
    ]) {
      assert.equal(
        Object.hasOwn(map, key),
        true,
        `${key} must not be swallowed by an escaped delimiter`,
      );
    }

    assert.match(map['setting.psnl.theme-dt'], /class\\="a jump"/);
    assert.doesNotMatch(map['setting.psnl.theme-dt'], /setting\.psnl\.round=/);
    assert.match(map['nts.fs-mount-error'], /class\\="tit"/);
  },
);
