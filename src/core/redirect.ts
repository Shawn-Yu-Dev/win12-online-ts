export function resolveEntryRedirect(search: string): string {
  const target = new URLSearchParams(search).get('to');
  return target === 'desktop' ? './desktop.html' : './boot.html';
}
