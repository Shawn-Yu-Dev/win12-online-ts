import { $, stop } from '../core/dom';
import { cms } from '../data/context-menus';
import { state } from '../core/state';

// 给桌面上的图标加右键菜单
export function addMenu() {
  var parentDiv = $('#desktop')[0];
  // 必须是直接子 div：与 CSS 的 #desktop>div 一致，且用户自建项本身就是顶层 <div class="b">。
  // 原写法是 '#div'（id 选择器），永远匹配 0 个元素，整个循环从不执行。
  var childDivs = parentDiv.$$(':scope>div');

  for (var i = 0; i < childDivs.length; i++) {
    if (i <= 4) {
      //win12内置的5个图标不添加
      continue;
    }
    let div = childDivs[i];
    div.setAttribute('iconIndex', i - 5);
    div.addEventListener(
      'contextmenu',
      (event) => {
        if (div.getAttribute('appname') != undefined) {
          return showcm(event, 'desktop.icon', [
            div.getAttribute('appname'),
            div.getAttribute('iconIndex'),
          ]);
        }
        return false;
      },
      true,
    );
  }
}
var topmost = [];
var sys_setting = [1, 1, 1, 0, 1, 1, 1];
var use_music = true;
var use_mic_voice = true;

// 右键菜单
/* 参考 desktop.html 开头信息
    每个标识对应一个列表，每一项为一个右键菜单中显示的项，可以有以下形式：
1. 'text', 文本信息
2. ['text','script'], 分别为显示内容，点击执行的代码
3. arg => {
        ...
        return ...
    }
    形参 arg 为 showcm() 方法第三个位置的用以传参的参数内容，
    返回内容或为 'null' 表示跳过此项，或参考条目 2 的格式
*/

// 渲染右键菜单。原先这段逻辑在 showcm 里被完整复制了两遍（「已有菜单打开」与
// 「直接打开」两条路径），除缩进外只有一处差别，而那处差别是个 bug：
// 已打开路径写的是 `ret = item(arg)`（未声明），desktop.js 是 'use strict'，
// 于是「在已有菜单打开时再右键一个函数型菜单项」必抛 ReferenceError。
// 受影响的是 cms 里四个函数型条目：desktop.icon / smapp / smlapp / explorer.file。
// 同路径还有一句 `arg.event = e`，全仓库无人读取，且 arg 可能为 null，一并移除。
export function renderContextMenu(e, cl, arg) {
  $('#cm').css('left', e.clientX);
  $('#cm').css('top', e.clientY);
  let h = '';
  cms[cl].forEach((item) => {
    if (typeof item == 'function') {
      let ret = item(arg);
      if (ret == 'null') {
        return true;
      }
      h += `<a class="a" onmousedown="${ret[1]}">${ret[0]}</a>\n`;
    } else if (typeof item == 'string') {
      h += item + '\n';
    } else {
      h += `<a class="a" onmousedown="${item[1]}">${item[0]}</a>\n`;
    }
  });
  $('#cm>list')[0].innerHTML = h;
  $('#cm').addClass('show-begin');
  $('#cm>.foc').focus();
  // .foc 是用来模拟焦点的，将焦点放在右键菜单上
  setTimeout(() => {
    $('#cm').addClass('show');
  }, 0);
  setTimeout(() => {
    if (e.clientY + $('#cm')[0].offsetHeight > $('html')[0].offsetHeight) {
      $('#cm').css('top', e.clientY - $('#cm')[0].offsetHeight);
    }
    if (e.clientX + $('#cm')[0].offsetWidth > $('html')[0].offsetWidth) {
      $('#cm').css(
        'left',
        $('html')[0].offsetWidth - $('#cm')[0].offsetWidth - 5,
      );
    }
  }, 200);
}

export function showcm(e, cl, arg) {
  // 已有菜单打开时，等它收起再重绘（原逻辑的 200ms 延时保持不变）
  if ($('#cm').hasClass('show-begin')) {
    setTimeout(() => {
      renderContextMenu(e, cl, arg);
    }, 200);
    return;
  }
  renderContextMenu(e, cl, arg);
}
export function initContextMenu(): void {
  $('#cm>.foc').on('blur', (event) => {
    const parent = event.currentTarget.parentNode as HTMLElement;
    $(parent).removeClass('show');
    setTimeout(() => $(parent).removeClass('show-begin'), 200);
  });

  $('input,textarea,*[contenteditable=true]').on('contextmenu', (e) => {
    stop(e);
    return true;
  });
}
