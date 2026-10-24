import { $ } from '../core/dom';
import { icon } from '../data/app-icons';

export function geticon(name: string): string {
  return icon[name] || name + '.svg';
}

export function syncTaskbarLayout(): void {
  const count = $('#taskbar>a').length;
  $('#taskbar').attr('count', count);
  $('#taskbar').css('display', count == 0 ? 'none' : 'flex');
  $('#taskbar').css('width', 4 + count * (34 + 4));
}
