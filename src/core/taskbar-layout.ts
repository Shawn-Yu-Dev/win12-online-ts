import { $ } from './dom';

export function syncTaskbarLayout(): void {
  const count = $('#taskbar>a').length;
  $('#taskbar').attr('count', count);
  $('#taskbar').css('display', count == 0 ? 'none' : 'flex');
  $('#taskbar').css('width', 4 + count * (34 + 4));
}
