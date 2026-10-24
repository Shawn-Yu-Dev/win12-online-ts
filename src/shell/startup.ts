import { $ } from '../core/dom';
import { apps } from '../core/app-registry';
import { state } from '../core/state';
import { api } from '../core/api';
import { isTauriApp } from '../core/i18n';
import {
  focusHighestBlockingLayer,
  getHighestBlockingLayer,
} from '../core/accessibility';
import { setIcon } from './desktop';
import { setWebGLMode, loadWebGLMode } from './theme';
import { updateVoiceBallStatus } from './voice';
import { nomax } from '../data/app-icons';
import { checkOrientation } from './orientation';
import { initLoginPassword, showStartupNoticeOnce } from './login';
import { openapp } from './launcher';
import { openDockWidget } from './launcher';

let win12Started = false;
export function win12Start() {
  if (win12Started) return;
  win12Started = true;
  setTimeout(() => {
    $('#loadback').addClass('hide');
  }, 500);
  setTimeout(() => {
    $('#loadback').css('display', 'none');
    if (new URL(location.href).searchParams.get('skip_login') === '1') {
      showStartupNoticeOnce();
    } else {
      focusHighestBlockingLayer();
    }
  }, 750);
  apps.webapps.init();
  initLoginPassword();
  //getdata
  if (localStorage.getItem('theme') == 'dark') {
    $(':root').addClass('dark');
    $('.dock.theme').addClass('dk');
    $('.window.whiteboard>.titbar>p').text('Blackboard');
    state.isDark = true;
  } else {
    $(':root').removeClass('dark');
    $('.dock.theme').removeClass('dk');
    $('.window.whiteboard>.titbar>p').text('Whiteboard');
    state.isDark = false;
  }
  // 桌面版：从 Tauri settings.json 同步 panic-color 到 localStorage
  if (
    window.win12Native &&
    window.win12Native.isTauri &&
    window.win12Native.isTauri()
  ) {
    (async function () {
      try {
        var json = await window.win12Native.readSettings();
        if (json) {
          var settings = JSON.parse(json);
          if (settings['panic-color']) {
            localStorage.setItem('panic-color', settings['panic-color']);
          }
          if (['off', 'partial', 'full'].includes(settings.webgl)) {
            localStorage.setItem('webgl-mode', settings.webgl);
            setWebGLMode(settings.webgl, { silent: true });
          }
        }
      } catch (e) {
        console.error('Failed to load settings from Tauri:', e);
      }
    })();
  }
  setTimeout(loadWebGLMode, 0);
  if (localStorage.getItem('color1')) {
    $(':root').css('--theme-1', localStorage.getItem('color1'));
    $(':root').css('--theme-2', localStorage.getItem('color2'));
  }
  setIcon(); //加载桌面图标
  // 所以这个东西为啥要在开机的时候加载？
  // 不应该在 python.init 里面吗？
  //     (async function () {
  //         apps.python.pyodide = await loadPyodide();
  //         apps.python.pyodide.runPython(`
  // import sys
  // import io
  // `);
  //     })();
  // apps.pythonEditor.load();
  // apps.notepadFonts.load();
  // apps.whiteboard.load();
  document.querySelectorAll('.window').forEach((w) => {
    let qw = $(w),
      wc = w.classList[1];
    // window: onmousedown="focwin('explorer')" ontouchstart="focwin('explorer')"
    qw.attr('onmousedown', `focwin('${wc}')`);
    qw.attr('ontouchstart', `focwin('${wc}')`);
    // titbar: oncontextmenu="return showcm(event,'titbar','edge')" ondblclick="maxwin('edge')"
    qw = $(`.window.${wc}>.titbar`);
    qw.attr('oncontextmenu', `return showcm(event,'titbar','${wc}')`);
    if (!(wc in nomax)) {
      qw.attr('ondblclick', `maxwin('${wc}')`);
    }
    // icon: onclick="return showcm(event,'titbar','explorer')"
    qw = $(`.window.${wc}>.titbar>.icon`);
    qw.attr(
      'onclick',
      `let os=$(this).offset();stop(event);return showcm({clientX:os.left-5,clientY:os.top+this.offsetHeight+3},'titbar','${wc}')`,
    );
    qw.mousedown(stop);
    $(`.window.${wc}>.titbar>div>.wbtg`).mousedown(stop);
  });
  document.querySelectorAll('.window>div.resize-bar').forEach((w) => {
    for (const n of [
      'top',
      'bottom',
      'left',
      'right',
      'top-right',
      'top-left',
      'bottom-right',
      'bottom-left',
    ]) {
      w.insertAdjacentHTML(
        'afterbegin',
        `<div class="resize-knob ${n}" onmousedown="resizewin(this.parentElement.parentElement, '${n}', this)"></div>`,
      );
    }
  });
  $.getJSON('https://tjy-gitnub.github.io/win12-theme/def.json').then((j) => {
    if (j.sp) {
      $(':root').css('--bgul', j.bg);
      if (j.spth) {
        $(':root').css('--theme-1', j.th1);
        $(':root').css('--theme-2', j.th2);
        $(':root').css('--href', j.href);
      }
      if (j.death) {
        $('html').css('filter', 'saturate(0)');
      }
    }
  });
  updateVoiceBallStatus();
  // loadlang();
  checkOrientation();
}
window.addEventListener('load', win12Start, { once: true });
export function checkUpdate() {
  const sha = localStorage.getItem('sha');
  api('repos/win12-online/win12/commits').then((res) => {
    res.json().then((json) => {
      if (sha != json[0].sha && sha) {
        localStorage.setItem('update', 'true');
        sendToSw({
          head: 'update',
        });
      }
      localStorage.setItem('sha', json[0].sha);
    });
  });
}

export function initAutoUpdate(): void {
  if (localStorage.getItem('autoUpdate') == undefined) {
    localStorage.setItem('autoUpdate', 'true');
  } else {
    // 原写法是 state.autoUpdate == 'true'，拿布尔变量去比字符串，恒为 false。
    // 后果：desktop.html 的「自动更新」开关基于错误的初值取反，第一次点击取消勾选无效。
    state.autoUpdate = localStorage.getItem('autoUpdate') == 'true';
  }
}
export const urlParams = new URL(location.href).searchParams;

// About 是模态框，会把背景设为 inert。正常路径在 win12FinishLogin() 隐藏
// 登录层后打开；skip_login 路径由 win12Start() 在启动遮罩隐藏后打开。
// PWA 应用
export function initPwa(): void {
  if (
    !location.href.match(
      /((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])(?::(?:[0-9]|[1-9][0-9]{1,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))/,
    ) &&
    !location.href.match('localhost') &&
    !urlParams.get('develop')
  ) {
    navigator.serviceWorker
      .register('sw.js', { updateViaCache: 'none', scope: './' })
      .then((reg) => {
        reg.update();

        reg.addEventListener('updatefound', () => {
          // 正在安装的新的 SW
          const newWorker = reg.installing;
          console.log('dsk-发现更新');
          // newWorker.state;
          // // "installing" - 安装事件被触发，但还没完成
          // // "installed"  - 安装完成
          // // "activating" - 激活事件被触发，但还没完成
          // // "activated"  - 激活成功
          // // "redundant"  - 废弃，可能是因为安装失败，或者是被一个新版本覆盖
        });
      });
    // navigator.serviceWorker.controller.postMessage({
    //     head: 'is_update'
    // });
    // navigator.serviceWorker.addEventListener('message', function (e) {
    // checkUpdate();

    if (localStorage.getItem('autoUpdate') == 'true') {
      checkUpdate();
    }
    if (localStorage.getItem('update') == 'true') {
      $('.msg.update>.main>.tit').html(
        '<i class="bi bi-stars" style="background-image: linear-gradient(100deg, var(--theme-1), var(--theme-2));-webkit-background-clip: text;-webkit-text-fill-color: transparent;text-shadow:3px 3px 5px var(--shadow);filter:saturate(200%) brightness(0.9);"></i> ' +
          $('#win-about>.cnt.update>div>details:first-child>summary').text(),
      );
      $('.msg.update>.main>.cont').html(
        $('#win-about>.cnt.update>div>details:first-child>p').html(),
      );
      $('#loadbackupdate').css('display', 'block');
      localStorage.setItem('update', 'false');
      $('.msg.update').addClass('show');
    }
  }
}
export function sendToSw(msg) {
  // 首次加载时 controller 可能尚未就绪（checkUpdate 会在注册完成前调用本函数）
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;
  navigator.serviceWorker.controller.postMessage(msg);
}

export function setupGlobalKey() {
  $(document).keydown(function (event) {
    if (getHighestBlockingLayer()) {
      if (event.keyCode == 116) event.preventDefault();
      return;
    }
    if (event.keyCode == 116 /*F5 被按下 (刷新)*/) {
      event.preventDefault(); /*取消默认刷新行为*/
      $('#desktop').css('opacity', '0');
      setTimeout(() => {
        $('#desktop').css('opacity', '1');
      }, 100);
      setIcon();
      return;
    }

    // 激活键：Meta / Meta + Ctrl / Alt
    if ((event.metaKey && !event.altKey) || (!event.metaKey && event.altKey)) {
      //按下激活键 + E，打开文件资源管理器（此电脑）
      if ((event.key || '').toLowerCase() == 'e') {
        event.preventDefault();
        if (!event.repeat) {
          openapp('explorer');
          apps.explorer.reset();
        }
        return;
      }
      //按下激活键 + I，打开设置
      if ((event.key || '').toLowerCase() == 'i') {
        event.preventDefault();
        if (!event.repeat) {
          openapp('setting');
        }
        return;
      }
    }

    //按下徽标键
    if (event.metaKey && event.ctrlKey) {
      //打开或关闭开始菜单
      openDockWidget('start-menu');
    }
  });
}

/** Startup work that used to live in the classic desktop.js entry. */
export function initStartup(): void {
  initAutoUpdate();
  initPwa();
  setupGlobalKey();
  if (urlParams.get('skip_login') !== '1') {
    $('#loginback').css('opacity', '1');
    $('#loginback').css('display', 'flex');
  }
}
