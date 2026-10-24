import { $, page } from '../core/dom';
import { apps } from '../core/app-registry';
import { state } from '../core/state';
import { lang } from '../core/i18n';
import { taskmgrTasks } from '../data/tasks';
import { geticon, syncTaskbarLayout } from './taskbar';
import { showcm } from './context-menu';
import { showdescp, hidedescp } from './tooltip';
import { icon } from '../data/app-icons';
import { showwin, minwin, focwin } from '../core/windows';
import { shownotice } from './notices';

export function pinapp(id, name, command) {
  if ($('#startmenu-r>.pinned>.apps>.a.sm-app.' + id).length) return;
  // 注意：command 本身已经带了 hide_startmenu()（见 cms 的 smapp 项），
  // 原写法在属性外多写了一段 ;hide_startmenu();' —— 是无效的多余标记，渲染结果不变。
  $('#startmenu-r>.pinned>.apps').append(
    `<a class='a sm-app enable ${id}' onclick='${command}' oncontextmenu='return showcm(event,\"smapp\",[\"${id}\",\"${name}\"])'><img src='icon/${geticon(id)}'><p>${name}</p></a>`,
  );
}

// 应用方法

export function openapp(name, bypassPreOpenNotice = false) {
  if (name == 'macos' && !bypassPreOpenNotice) {
    shownotice('macos-web');
    return;
  }
  if (
    taskmgrTasks.findIndex((elt) => elt.link == name) > -1 &&
    apps.taskmgr.tasks.findIndex((elt) => elt.link == name) == -1
  ) {
    apps.taskmgr.tasks.splice(
      apps.taskmgr.tasks.length,
      0,
      taskmgrTasks.find((elt) => elt.link == name),
    );
  }
  if ($('#taskbar>.' + name).length != 0) {
    if ($('.window.' + name).hasClass('min')) {
      minwin(name);
    }
    focwin(name);
    return;
  }
  $('.window.' + name).addClass('load');
  showwin(name);
  $('#taskbar').append(
    `<a class="${name}" onclick="taskbarclick('${name}\')" win12_title="${$(`.window.${name}>.titbar>p`).text()}" onmouseenter="showdescp(event)" onmouseleave="hidedescp(event)" oncontextmenu="return showcm(event, 'taskbar', '${name}')"><img src="icon/${icon[name] || name + '.svg'}"></a>`,
  );
  syncTaskbarLayout();
  $('#taskbar>.' + name).addClass('foc');
  setTimeout(() => {
    syncTaskbarLayout();
  }, 0);
  let tmp = name.replace(/\-(\w)/g, function (all, letter) {
    return letter.toUpperCase();
  });
  if (apps[tmp].load && !apps[tmp].loaded) {
    apps[tmp].loaded = true;
    apps[tmp].load();
    apps[tmp].init();
    $('.window.' + name).removeClass('load');
    return;
  }
  apps[tmp].init();
  setTimeout(
    () => {
      $('.window.' + name).removeClass('load');
    },
    Number($('.window.' + name + '>.loadback').attr('data-delay')) || 500,
  );
}

// 开始菜单一类

//打开任务栏按钮对应的 widget

// 为啥管这个东西叫 widget?? from stsc
export function openDockWidget(name) {
  if (name == 'start-menu') {
    //打开开始菜单
    if ($('#start-menu').hasClass('show')) {
      hide_startmenu();
    } else {
      $('#start-btn').addClass('show');
      if ($('#search-win').hasClass('show')) {
        $('#search-btn').removeClass('show');
        $('#search-win').removeClass('show');
        setTimeout(() => {
          $('#search-win').removeClass('show-begin');
        }, 200);
        hide_widgets();
      }
      if ($('#widgets').hasClass('show')) hide_widgets();
      $('#start-menu').addClass('show-begin');
      setTimeout(() => {
        $('#start-menu').addClass('show');
      }, 0);
    }
  } else if (name == 'search-win') {
    //打开搜索框
    if ($('#search-win').hasClass('show')) {
      $('#search-btn').removeClass('show');
      $('#search-win').removeClass('show');
      setTimeout(() => {
        $('#search-win').removeClass('show-begin');
      }, 200);
    } else {
      $('#search-btn').addClass('show');
      if ($('#start-menu').hasClass('show')) hide_startmenu();
      if ($('#widgets').hasClass('show')) hide_widgets();
      $('#search-win').addClass('show-begin');
      setTimeout(() => {
        $('#search-win').addClass('show');
      }, 0);
      $('#search-input').focus();
    }
  } else if (name == 'widgets') {
    //打开小组件
    if ($('#widgets').hasClass('show')) {
      hide_widgets();
    } else {
      $('#widgets-btn').addClass('show');
      if ($('#search-win').hasClass('show')) {
        $('#search-btn').removeClass('show');
        $('#search-win').removeClass('show');
        setTimeout(() => {
          $('#search-win').removeClass('show-begin');
        }, 200);
      }
      if ($('#start-menu').hasClass('show')) hide_startmenu();
      $('#widgets').addClass('show-begin');
      setTimeout(() => {
        $('#widgets').addClass('show');
      }, 0);
      $('#widgets-input').focus();
    }
  } else if (name == 'control') {
    //打开控制
    if ($('#control').hasClass('show')) {
      $('#control').removeClass('show');
      setTimeout(() => {
        $('#control').removeClass('show-begin');
      }, 200);
    } else {
      if ($('#datebox').hasClass('show')) {
        $('.dock.date').removeClass('show');
        $('#datebox').removeClass('show');
        setTimeout(() => {
          $('#datebox').removeClass('show-begin');
        }, 200);
      }
      $('#control').css('left', $('.a.dock.control').position().left - 123);
      $('#control').addClass('show-begin');
      setTimeout(() => {
        $('#control').addClass('show');
      }, 0);
    }
  } else if (name == 'datebox') {
    //打开时间框
    if ($('#datebox').hasClass('show')) {
      $('.dock.date').removeClass('show');
      $('#datebox').removeClass('show');
      setTimeout(() => {
        $('#datebox').removeClass('show-begin');
      }, 200);
    } else {
      if ($('#control').hasClass('show')) {
        $('#control').removeClass('show');
        setTimeout(() => {
          $('#control').removeClass('show-begin');
        }, 200);
      }
      $('.dock.date').addClass('show');
      $('#datebox').css('left', $('.a.dock.date').position().left - 125);
      $('#datebox').addClass('show-begin');
      setTimeout(() => {
        $('#datebox').addClass('show');
      }, 0);
    }
  } else {
    console.error('openDockWidget() 传递的 name 不正确！');
  }
}

export function removeEdgeSaveUrl(classname) {
  $('.' + classname).remove();
}

export function hide_startmenu() {
  $('#start-menu').removeClass('show');
  $('#start-btn').removeClass('show');
  setTimeout(() => {
    $('#start-menu').removeClass('show-begin');
  }, 200);
}
export function hide_search() {
  $('#search-win').removeClass('show');
  $('#search-btn').removeClass('show');
  setTimeout(() => {
    $('#search-win').removeClass('show-begin');
  }, 200);
}
export function hide_widgets() {
  $('#widgets').removeClass('show');
  $('#widgets-btn').removeClass('show');
  setTimeout(() => {
    $('#widgets').removeClass('show-begin');
  }, 200);
}
const FLY_HIDDEN_LIST_KEY = 'control_status_fly_hidden_list';
export function controlStatus(this: HTMLElement, name) {
  if (this.classList.contains('active')) {
    this.classList.remove('active');
    if (name == 'wifi') {
      state.wifi = false;
    }
    if (name == 'fly') {
      state.flyMode = false;
      if (localStorage.getItem(FLY_HIDDEN_LIST_KEY)) {
        const flyHiddenData = JSON.parse(
          localStorage.getItem(FLY_HIDDEN_LIST_KEY),
        );
        const flyHiddenList = Array.isArray(flyHiddenData) ? flyHiddenData : [];
        flyHiddenList.forEach((item) => {
          const dom = $(`#control .${item} .icon`);
          if (!dom.hasClass('active')) {
            dom.addClass('active');
          }
        });
        localStorage.removeItem(FLY_HIDDEN_LIST_KEY);
      }
    }
  } else if (!this.classList.contains('active')) {
    this.classList.add('active');
    if (name == 'wifi') {
      state.wifi = true;
    }
    if (name == 'fly') {
      state.flyMode = true;
      const hiddenList = ['btn1', 'btn2', 'btn5'];
      const hiddenDiffList = [];
      hiddenList.forEach((item) => {
        const dom = $(`#control .${item} .icon`);
        if (dom.hasClass('active')) {
          dom.removeClass('active');
          hiddenDiffList.push(item);
        }
      });
      localStorage.setItem(FLY_HIDDEN_LIST_KEY, JSON.stringify(hiddenDiffList));
    }
  }
  if (name == 'dark') {
    $('html').toggleClass('night');
    if ($('html').hasClass('night')) {
      setTimeout(() => {
        alert('别看屏幕了，去休息眼睛吧~');
      }, 200);
    }
  }
}
export function dragBrightness(e) {
  const container = $('#control>.cont>.bottom>.brightness>.range-container')[0];
  const after = $(
    '#control>.cont>.bottom>.brightness>.range-container>.after',
  )[0];
  const slider = $(
    '#control>.cont>.bottom>.brightness>.range-container>.slider-btn',
  )[0];
  const viewport = container.getBoundingClientRect().left;
  const width = Number(
    window.getComputedStyle(container, null).width.split('px')[0],
  );
  move(e);
  page.onmousemove = move;
  page.ontouchmove = move;
  container.classList.add('active');
  function move(e) {
    let clientX;
    if (e.type.match('mouse')) {
      clientX = e.clientX;
    } else if (e.type.match('touch')) {
      clientX = e.touches[0].clientX;
    }
    var _offset = clientX - viewport;

    const limit = 2; // 亮度条件限制

    if (_offset < 0) {
      _offset = 0;
    } else if (_offset > limit * width) {
      _offset = limit * width;
    }
    slider.style.marginLeft = _offset + 'px';
    after.style.left = _offset + 'px';
    after.style.width = width - _offset + 'px';
    if (_offset / width > 0.3 && _offset / width < limit) {
      page.style.filter = `brightness(${_offset / width})`;
    } else if (_offset / width < limit) {
      page.style.filter = 'brightness(0.3)';
    } else {
      page.style.filter = `brightness(${limit})`;
    }
  }
  function up() {
    container.classList.remove('active');
    page.onmouseup = null;
    page.ontouchend = null;
    page.ontouchcancel = null;
    page.onmousemove = null;
    page.ontouchmove = null;
  }
  page.onmouseup = up;
  page.ontouchend = up;
  page.ontouchcancel = up;
}
