import { $ } from '../core/dom';
import { dps } from '../data/dock-panels';

export let dpt: unknown = null;
export let isOnDp = false;

/** Play the short Windows background jingle. */
export function playWindowsBackground(): void {
  const audio = new Audio('./media/Windows Background.wav');
  audio.play();
}

export function showdp(e, cl, arg) {
  if ($('#dp').hasClass('show-begin')) {
    $('#dp').removeClass('show');
    setTimeout(() => {
      $('#dp').removeClass('show-begin');
    }, 200);
    if (e != dpt) {
      setTimeout(() => {
        showdp(e, cl, arg);
      }, 400);
    }
    return;
  }
  // dpt = e;
  const off = $(e).offset();
  $('#dp').css('left', off.left);
  $('#dp').css('top', off.top + e.offsetHeight);
  let h = '';
  dps[cl].forEach((item) => {
    if (typeof item == 'function') {
      let ret = item(arg);
      if (ret == 'null') {
        return true;
      }
      h += `<a class="a" onclick="${ret[1]}">${ret[0]}</a>\n`;
    } else if (typeof item == 'string') {
      h += item + '\n';
    } else {
      h += `<a class="a" onclick="${item[1]}">${item[0]}</a>\n`;
    }
  });
  $('#dp>list')[0].innerHTML = h;
  $('#dp').addClass('show-begin');
  setTimeout(() => {
    $('#dp').addClass('show');
  }, 0);
  setTimeout(() => {
    if (
      off.top + e.offsetHeight + $('#dp')[0].offsetHeight >
      $('html')[0].offsetHeight
    ) {
      $('#dp').css('top', off.top - $('#dp')[0].offsetHeight);
    }
    if (off.left + $('#dp')[0].offsetWidth > $('html')[0].offsetWidth) {
      $('#dp').css(
        'left',
        $('html')[0].offsetWidth - $('#dp')[0].offsetWidth - 5,
      );
    }
  }, 200);
}
export function hidedp(force = false) {
  setTimeout(() => {
    if (isOnDp && !force) {
      return;
    }
    $('#dp').removeClass('show');
    setTimeout(() => {
      $('#dp').removeClass('show-begin');
    }, 200);
  }, 100);
}

export function initDropdown(): void {
  const dp = $('#dp')[0];
  dp.onmouseover = () => {
    isOnDp = true;
  };
  dp.onmouseleave = () => {
    isOnDp = false;
    hidedp();
  };
}
