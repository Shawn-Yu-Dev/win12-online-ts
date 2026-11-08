import { $ } from '../core/dom';
import { bindWindowTaskbar } from '../core/windows';
import { geticon } from '../data/app-icons';
import { getTaskbarLayout } from './taskbar-layout';
import { showTaskbarPreview, hideTaskbarPreview } from './preview';

export { geticon } from '../data/app-icons';

// 任务栏模块：唯一拥有任务栏 DOM 的模块，其他模块只能通过这里的接口操作任务栏

export function syncTaskbarLayout(): void {
  const count = $('#taskbar>a').length;
  const layout = getTaskbarLayout(count);
  $('#taskbar').attr('count', count);
  $('#taskbar').css('display', layout.display);
  $('#taskbar').css('width', layout.width);
}

export function hasTaskbarItem(name: string): boolean {
  return $('#taskbar>.' + name).length > 0;
}

export function addTaskbarItem(name: string): void {
  $('#taskbar').append(
    `<a class="${name}" onclick="taskbarclick('${name}')" win12_title="${$(`.window.${name}>.titbar>p`).text()}" onmouseenter="showdescp(event)" onmouseleave="hidedescp(event)" oncontextmenu="return showcm(event, 'taskbar', '${name}')"><img src="icon/${geticon(name)}"></a>`,
  );
  syncTaskbarLayout();
  $('#taskbar>.' + name).addClass('foc');
  setTimeout(() => {
    syncTaskbarLayout();
  }, 0);
}

export function removeTaskbarItem(name: string): void {
  $('#taskbar>.' + name).remove();
  syncTaskbarLayout();
  setTimeout(() => {
    syncTaskbarLayout();
  }, 80);
}

export function setTaskbarItemMinimized(
  name: string,
  minimized: boolean,
): void {
  $('#taskbar>.' + name).toggleClass('min', minimized);
}

export function setTaskbarItemFocused(name: string, focused: boolean): void {
  $('#taskbar>.' + name).toggleClass('foc', focused);
}

export function clearTaskbarFocus(): void {
  $('#taskbar>.foc').removeClass('foc');
}

export function isInTaskbar(el: Element): boolean {
  return !!el.closest('#taskbar');
}

export function initTaskbar(): void {
  bindWindowTaskbar({
    has: hasTaskbarItem,
    remove: removeTaskbarItem,
    setMinimized: setTaskbarItemMinimized,
    setFocused: setTaskbarItemFocused,
    clearFocus: clearTaskbarFocus,
  });
  $(document).on('mouseenter', '#taskbar>a', function (this: HTMLElement, e) {
    const name = this.className.split(' ')[0];
    showTaskbarPreview(name, e);
  });
  $(document).on('mouseleave', '#taskbar>a', hideTaskbarPreview);
}
