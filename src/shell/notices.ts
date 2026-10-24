import { $ } from '../core/dom';
import { focusHighestBlockingLayer } from '../core/accessibility';
import { nts } from '../data/notices';

let noticePreviousFocus: HTMLElement | null = null;
let noticeOpenTimer: ReturnType<typeof setTimeout> | null = null;
let noticeCloseTimer: ReturnType<typeof setTimeout> | null = null;
let noticeInertElements: HTMLElement[] = [];

export function dismissTransientOverlaysForModal() {
  // These layers normally close via blur/mouseleave, but making their parent
  // inert can suppress that event.  Leaving a higher-z-index inert overlay
  // visible would recreate a "visible but unclickable" surface above modal.
  $('#cm, #dp, #descp').removeClass('show show-begin');
  $('#taskbar-preview').removeClass('show');
  $('[data-descp]').attr('data-descp', 'hide');
}

export function getNoticeFocusable() {
  return [
    ...document.querySelectorAll(
      '#notice button:not([disabled]), #notice a[href], #notice input:not([disabled]), ' +
        '#notice textarea:not([disabled]), #notice select:not([disabled]), #notice [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((element) => getComputedStyle(element).display !== 'none');
}

export function handleNoticeKeydown(event) {
  if (!$('#notice-back').hasClass('show')) return;
  if (
    (event.key === 'Enter' || event.key === ' ') &&
    event.target.matches('#notice a[role="button"]')
  ) {
    event.preventDefault();
    event.target.click();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = getNoticeFocusable();
  if (!focusable.length) {
    event.preventDefault();
    document.getElementById('notice').focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!document.getElementById('notice').contains(document.activeElement)) {
    event.preventDefault();
    ((event.shiftKey ? last : first) as HTMLElement).focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    (last as HTMLElement).focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    (first as HTMLElement).focus();
  }
}
export function shownotice(name) {
  clearTimeout(noticeOpenTimer);
  clearTimeout(noticeCloseTimer);
  dismissTransientOverlaysForModal();
  const noticeBack = document.getElementById('notice-back');
  noticeBack.inert = false;
  const wasOpen = $('#notice-back').hasClass('show');
  if (!wasOpen) {
    noticePreviousFocus = document.activeElement as HTMLElement;
    noticeInertElements = ([...document.body.children] as HTMLElement[]).filter(
      (element) => element !== noticeBack && !element.inert,
    );
    noticeInertElements.forEach((element) => {
      element.inert = true;
    });
  }
  $('#notice>.cnt').html(nts[name].cnt);
  let tmp = '';
  nts[name].btn.forEach((btn) => {
    tmp += `<button type="button" class="a btn ${btn.type}" onclick="${btn.js}">${btn.text}</button>`;
  });
  $('#notice>.btns').html(tmp);
  const notice = document.getElementById('notice');
  const title = notice.querySelector('.cnt>.tit');
  notice.setAttribute('role', 'dialog');
  notice.setAttribute('aria-modal', 'true');
  notice.setAttribute('tabindex', '-1');
  if (title) {
    title.id = 'notice-title';
    notice.setAttribute('aria-labelledby', title.id);
  } else {
    notice.removeAttribute('aria-labelledby');
  }
  $('#notice a:not([href])').attr({ role: 'button', tabindex: '0' });
  $('#notice-back').attr('aria-hidden', 'false').addClass('show');
  noticeOpenTimer = setTimeout(() => {
    noticeOpenTimer = null;
    $('#notice').addClass('show');
    const focusable = getNoticeFocusable();
    ((focusable[0] || notice) as HTMLElement).focus();
  }, 200);
}
export function closenotice() {
  clearTimeout(noticeOpenTimer);
  noticeOpenTimer = null;
  $('#notice').removeClass('show');
  clearTimeout(noticeCloseTimer);
  noticeCloseTimer = setTimeout(() => {
    noticeCloseTimer = null;
    $('#notice-back').removeClass('show');
    const noticeBack = document.getElementById('notice-back');
    const notice = document.getElementById('notice');
    if (notice.contains(document.activeElement))
      (document.activeElement as HTMLElement).blur();
    noticeBack.inert = true;
    noticeInertElements.forEach((element) => {
      element.inert = false;
    });
    noticeInertElements = [];
    if (noticePreviousFocus && noticePreviousFocus.isConnected)
      noticePreviousFocus!.focus();
    noticePreviousFocus = null;
    $('#notice-back').attr('aria-hidden', 'true');
    focusHighestBlockingLayer();
  }, 200);
}

export function initNotices(): void {
  document.addEventListener('keydown', handleNoticeKeydown);
}
