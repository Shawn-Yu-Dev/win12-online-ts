import { $ } from '../core/dom';

// 悬停提示
export function showdescp(e: MouseEvent): void {
  if ($('#notice-back').hasClass('show')) return;
  $(e.target).attr('data-descp', 'waiting');
  setTimeout(() => {
    if (
      $('#notice-back').hasClass('show') ||
      $(e.target).attr('data-descp') == 'hide'
    ) {
      return;
    }
    $(e.target).attr('data-descp', 'show');
    $('#descp').css('left', e.clientX + 15);
    $('#descp').css('top', e.clientY + 20);
    $('#descp').text($(e.target).attr('win12_title'));
    $('#descp').addClass('show-begin');
    setTimeout(() => {
      if (
        e.clientY + $('#descp')[0].offsetHeight + 20 >=
        $('html')[0].offsetHeight
      ) {
        $('#descp').css('top', e.clientY - $('#descp')[0].offsetHeight - 10);
      }
      if (
        e.clientX + $('#descp')[0].offsetWidth + 15 >=
        $('html')[0].offsetWidth
      ) {
        $('#descp').css('left', e.clientX - $('#descp')[0].offsetWidth - 10);
      }
      $('#descp').addClass('show');
    }, 100);
  }, 500);
}
export function hidedescp(e: MouseEvent): void {
  $('#descp').removeClass('show');
  $(e.target).attr('data-descp', 'hide');
  setTimeout(() => {
    $('#descp').removeClass('show-begin');
  }, 100);
}

export function initTooltips(): void {
  document.querySelectorAll('*[win12_title]:not(.notip)').forEach((element) => {
    element.addEventListener('mouseenter', showdescp);
    element.addEventListener('mouseleave', hidedescp);
  });
}
