export type PropertyMap = Record<string, string>;

const CONTINUATION_INDENT = /^[ \t\f]+/;
const UNICODE_ESCAPE = /\\u.{4}/gi;

function countTrailingBackslashes(line: string): number {
  let count = 0;
  for (let i = line.length - 1; i >= 0 && line[i] === '\\'; i--) count++;
  return count;
}

function findSeparator(line: string): number {
  let escaped = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '\\') {
      escaped = !escaped;
      continue;
    }
    if (!escaped && (char === '=' || char === ':')) return i;
    escaped = false;
  }
  return -1;
}

function unescapeUnicode(match: string): string {
  const code = Number.parseInt(match.slice(2), 16);
  if (!Number.isFinite(code) || code < 0 || code >= 0x10000) return '';
  return String.fromCharCode(code);
}

export function decodePropertyValue(value: string): string {
  return value.replace(UNICODE_ESCAPE, unescapeUnicode);
}

function decodePropertyName(name: string): string {
  try {
    return decodeURI(name).trim();
  } catch {
    return name.trim();
  }
}

export function parseProperties(data: string): PropertyMap {
  const map: PropertyMap = {};
  const lines = data.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let trailing = countTrailingBackslashes(line);

    while (trailing % 2 === 1) {
      line = line.slice(0, -1);
      if (++i >= lines.length) break;
      line += lines[i].replace(CONTINUATION_INDENT, '');
      trailing = countTrailingBackslashes(line);
    }

    line = line.trim();
    if (!line || line[0] === '#' || line[0] === '!') continue;

    const separator = findSeparator(line);
    const name = decodePropertyName(
      separator === -1 ? line : line.slice(0, separator),
    );
    const value = separator === -1 ? '' : line.slice(separator + 1).trim();

    map[name] = decodePropertyValue(value);
  }

  return map;
}
