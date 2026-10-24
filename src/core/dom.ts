import jquery from 'jquery';

export const $: any = jquery;

declare global {
  interface HTMLElement {
    $$(selector: string): NodeListOf<HTMLElement>;
  }
}

if (!HTMLElement.prototype.$$) {
  HTMLElement.prototype.$$ = function (selector: string) {
    return (this as HTMLElement).querySelectorAll<HTMLElement>(selector);
  };
}

export const page = $('html')[0] as HTMLElement;

export function stop(e: Event): false {
  e.stopPropagation();
  return false;
}

export function byId<T extends HTMLElement = HTMLElement>(
  id: string,
): T | null {
  return document.getElementById(id) as T | null;
}

export function installJQueryGlobal(): void {
  const w = window as unknown as Record<string, unknown>;
  w.$ = $;
  w.jQuery = $;
}

export function disableIframes(): void {
  $('iframe:not(.nochanges)').css('pointer-events', 'none');
  $('iframe:not(.nochanges)').css('touch-action', 'none');
}

export function enableIframes(): void {
  $('iframe:not(.nochanges)').css('pointer-events', 'auto');
  $('iframe:not(.nochanges)').css('touch-action', 'auto');
}

export function initDom(): void {
  page.addEventListener('mousedown', disableIframes);
  page.addEventListener('touchstart', disableIframes);
  page.addEventListener('mouseup', enableIframes);
  page.addEventListener('touchend', enableIframes);
  page.addEventListener('touchcancel', enableIframes);

  page.addEventListener('click', (event) => {
    if (
      $('#start-menu').hasClass('show') &&
      !$(event.target).closest('#start-menu').length
    ) {
      hideStartMenu();
    }
    if (
      $('#search-win').hasClass('show') &&
      !$(event.target).closest('#search-win').length
    ) {
      hideSearch();
    }
  });

  document.querySelectorAll<HTMLElement>('list.focs').forEach((li) => {
    li.addEventListener('click', () => {
      const marker = li.$$('span.focs')[0];
      const active = li.$$('a.check')[0];
      const links = li.$$('a');
      if (!marker || !active) return;
      if (marker.dataset.type == 'abs') {
        $(marker).addClass('cl');
        $(marker).css(
          'top',
          active.getBoundingClientRect().top -
            li.parentElement!.getBoundingClientRect().top +
            'px',
        );
        setTimeout(() => $(marker).removeClass('cl'), 500);
      } else {
        $(marker).addClass('cl');
        $(marker).css(
          'top',
          active.offsetTop - links[links.length - 1].offsetTop,
        );
        $(marker).css('left', active.offsetLeft - li.offsetLeft);
        setTimeout(() => $(marker).removeClass('cl'), 500);
      }
    });
  });

  $('img').on('dragstart', () => false);
  $('html').on('contextmenu', () => false);
}

let hideStartMenu = () => {};
let hideSearch = () => {};

export function setMenuHiders(start: () => void, search: () => void): void {
  hideStartMenu = start;
  hideSearch = search;
}
