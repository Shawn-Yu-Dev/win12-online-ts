import type { AppDefinition } from '../core/app-types';
import { $, page } from '../core/dom';
import { apps } from '../core/app-registry';
import { state } from '../core/state';
import {
  lang,
  isTauriApp,
  getAboutAppTitle,
  updateAboutAppEntrypoints,
} from '../core/i18n';
import { api, server, pages } from '../core/api';
import {
  setData,
  decodeHtml,
  calcTimeString,
  getPanicColor,
  setPanicColor,
} from '../core/utils';
import { showcm } from '../shell/context-menu';
import { showdp, hidedp } from '../shell/dropdown';
import { shownotice, closenotice } from '../shell/notices';
import {
  openapp,
  openDockWidget,
  hide_startmenu,
  hide_search,
  hide_widgets,
  pinapp,
  dragBrightness,
} from '../shell/launcher';
import {
  showwin,
  hidewin,
  maxwin,
  minwin,
  focwin,
  taskbarclick,
  resizewin,
} from '../core/windows';
import { createHistoryStack, createWebapp } from './shared';
import { m_tab } from '../features/tab';
import { widgets } from '../features/widgets';
import { runcmd } from '../scripts/terminal';
import { resolveEdgeAddressInput } from '../scripts/edge-address';
import { add_save } from '../scripts/edge-bookmarks';
import { getLunar } from '../scripts/lunar';
import { terminalEggs } from '../scripts/terminal-eggs';
import { taskmgrTasks } from '../data/tasks';
import { icon, nomax, nomin } from '../data/app-icons';
import { nts } from '../data/notices';
import { cms } from '../data/context-menus';
import { dps } from '../data/dock-panels';
import { geticon } from '../shell/taskbar';
import { closeVideo } from '../core/video';
import { toggletheme } from '../shell/theme';
import { setIcon, saveDesktop } from '../shell/desktop';

const edge = {
  init: () => {
    $('#win-edge>iframe').remove();
    apps.edge.titleRequests.clear();
    apps.edge.tabs = [];
    apps.edge.len = 0;
    apps.edge.newtab();
  },
  tabs: [],
  now: null,
  len: 0,
  titleRequests: new Map(),
  reloadElt:
    '<loading class="reloading"><svg viewBox="0 0 16 16"><circle cx="8px" cy="8px" r="5px"></circle><circle cx="8px" cy="8px" r="5px"></circle></svg></loading>',
  max: false,
  fuls: false,
  b1: false,
  b2: false,
  b3: false,
  newtab: () => {
    m_tab.newtab('edge', '新建标签页');
    apps.edge.initHistory(apps.edge.tabs[apps.edge.tabs.length - 1][0]);
    apps.edge.pushHistory(
      apps.edge.tabs[apps.edge.tabs.length - 1][0],
      'mainpage.html',
    );
    $('#win-edge').append(
      `<iframe src="mainpage.html" frameborder="0" class="${apps.edge.tabs[apps.edge.tabs.length - 1][0]}">`,
    );
    $('#win-edge>.tool>input.url').focus();
    $('#win-edge>iframe')[apps.edge.tabs.length - 1].onload = function (
      this: HTMLIFrameElement,
    ) {
      this.contentDocument.querySelector('input').onkeyup = function (e) {
        if (e.keyCode == 13 && $(this).val() != '') {
          apps.edge.goto($(this).val());
        }
      };
      this.contentDocument.querySelector('svg').onclick = () => {
        if ($(this.contentDocument.querySelector('input')).val() != '') {
          apps.edge.goto($(this.contentDocument.querySelector('input')).val());
        }
      };
    };
    m_tab.tab('edge', apps.edge.tabs.length - 1);
    apps.edge.checkHistory(apps.edge.tabs[apps.edge.now][0]);
  },
  fullscreen: () => {
    if (!apps.edge.max) {
      maxwin('edge');
      apps.edge.max = !apps.edge.max;
    }
    document.getElementById('fuls-edge').style.display = 'none';
    document.getElementById('edge-max').style.display = 'none';
    document.getElementById('fuls-edge-exit').style.display = '';
    document.getElementById('over-bar').style.display = '';
    $('.edge>.titbar').hide();
    $('.edge>.content>.tool').hide();
    apps.edge.fuls = !apps.edge.fuls;
  },
  exitfullscreen: () => {
    if (apps.edge.max) {
      maxwin('edge');
      apps.edge.max = !apps.edge.max;
    }
    document.getElementById('fuls-edge').style.display = '';
    document.getElementById('edge-max').style.display = '';
    document.getElementById('fuls-edge-exit').style.display = 'none';
    document.getElementById('over-bar').style.display = 'none';
    $('.edge>.titbar').show();
    $('.edge>.content>.tool').show();
    apps.edge.fuls = !apps.edge.fuls;
  },
  in_div(id: string, event: MouseEvent) {
    var div = document.getElementById(id);
    var x = event.clientX;
    var y = event.clientY;
    var divx1 = div.offsetLeft;
    var divy1 = div.offsetTop;
    var divx2 = div.offsetLeft + div.offsetWidth;
    var divy2 = div.offsetTop + div.offsetHeight;
    if (x < divx1 || x > divx2 || y < divy1 || y > divy2) {
      //如果离开，则执行。。
      return false;
    } else {
      //如检播到，则执行。。
      return true;
    }
  },
  settab: (t: readonly [string | number, string], i: number) => {
    if ($('.window.edge>.titbar>.tabs>.tab.' + t[0] + '>.reloading')[0]) {
      return `<div class="tab ${t[0]}" onclick="m_tab.tab('edge',${i})" oncontextmenu="showcm(event,'edge.tab',${i});stop(event);return false" onmousedown="m_tab.moving('edge',this,event,${i});stop(event);disableIframes();" ontouchstart="m_tab.moving('edge',this,event,${i});stop(event);disableIframes();">${apps.edge.reloadElt}<p>${t[1]}</p><span class="clbtn bi bi-x" onclick="m_tab.close('edge',${i})"></span></div>`;
    } else {
      return `<div class="tab ${t[0]}" onclick="m_tab.tab('edge',${i})" oncontextmenu="showcm(event,'edge.tab',${i});stop(event);return false" onmousedown="m_tab.moving('edge',this,event,${i});stop(event);disableIframes();" ontouchstart="m_tab.moving('edge',this,event,${i});stop(event);disableIframes();"><p>${t[1]}</p><span class="clbtn bi bi-x" onclick="m_tab.close('edge',${i})"></span></div>`;
    }
  },
  tab: (c: number) => {
    $('#win-edge>iframe.show').removeClass('show');
    $('#win-edge>iframe.' + apps.edge.tabs[c][0]).addClass('show');
    $('#win-edge>.tool>input.url').val(
      $('#win-edge>iframe.' + apps.edge.tabs[c][0]).attr('src') ==
        'mainpage.html'
        ? ''
        : $('#win-edge>iframe.' + apps.edge.tabs[c][0]).attr('src'),
    );
    $('#win-edge>.tool>input.rename').removeClass('show');
    apps.edge.checkHistory(apps.edge.tabs[apps.edge.now][0]);
  },
  c_rename: (c: number) => {
    m_tab.tab('edge', c);
    $('#win-edge>.tool>input.rename').val(apps.edge.tabs[apps.edge.now][1]);
    $('#win-edge>.tool>input.rename').addClass('show');
    setTimeout(() => {
      $('#win-edge>.tool>input.rename').focus();
    }, 300);
  },
  reload: () => {
    if (state.wifi == false) {
      $('#win-edge>iframe.show').attr(
        'src',
        'data/disconnected' + (state.isDark ? '_dark' : '') + '.html',
      );
    } else {
      $('#win-edge>iframe.show').attr(
        'src',
        $('#win-edge>iframe.show').attr('src'),
      );
      if (
        !$(
          '.window.edge>.titbar>.tabs>.tab.' +
            apps.edge.tabs[apps.edge.now][0] +
            '>.reloading',
        )[0]
      ) {
        $(
          '.window.edge>.titbar>.tabs>.tab.' + apps.edge.tabs[apps.edge.now][0],
        )[0].insertAdjacentHTML('afterbegin', apps.edge.reloadElt);
        $('#win-edge>iframe.' + apps.edge.tabs[apps.edge.now][0])[0].onload =
          function (this: HTMLIFrameElement) {
            $(
              '.window.edge>.titbar>.tabs>.tab.' + this.classList[0],
            )[0].removeChild(
              $(
                '.window.edge>.titbar>.tabs>.tab.' +
                  this.classList[0] +
                  '>.reloading',
              )[0],
            );
          };
      }
    }
  },
  getTitle: async (url: string, tabId: string | number) => {
    const requestToken = {};
    apps.edge.titleRequests.set(tabId, requestToken);
    try {
      const response = await fetch(
        server + pages['get-title'] + `?url=${encodeURIComponent(url)}`,
      );
      if (!response.ok) return;
      const text = await response.text();
      if (apps.edge.titleRequests.get(tabId) !== requestToken) return;
      const tabIndex = apps.edge.tabs.findIndex(
        (tab: readonly [string | number, string]) => tab[0] === tabId,
      );
      if (tabIndex < 0) return;
      apps.edge.tabs[tabIndex][1] = text;
      m_tab.settabs('edge');
      const currentTab = apps.edge.tabs[apps.edge.now];
      if (currentTab) {
        $('.window.edge>.titbar>.tabs>.tab.' + currentTab[0]).addClass('show');
      }
    } catch (error) {
      console.warn('Unable to load page title:', error);
    }
  },
  goto: (u: unknown, clear = true) => {
    const currentTab = apps.edge.tabs[apps.edge.now];
    if (!currentTab) return;
    const requestedValue = String(u == null ? '' : u).trim();
    const resolvedInput = resolveEdgeAddressInput(requestedValue);
    if (resolvedInput.type === 'empty') return;
    const tabId = currentTab[0];
    // Invalidate any slower title request from the previous navigation.
    apps.edge.titleRequests.set(tabId, {});
    if (state.wifi == false) {
      m_tab.rename('edge', requestedValue);
      $('#win-edge>iframe.' + tabId).attr(
        'src',
        'data/disconnected' + (state.isDark ? '_dark' : '') + '.html',
      );
      $('#win-edge>.tool>input.url').val(requestedValue);
    } else {
      $('#win-edge>iframe.show').attr('src', resolvedInput.url);
      m_tab.rename(
        'edge',
        resolvedInput.type === 'search'
          ? requestedValue
          : resolvedInput.url === 'mainpage.html'
            ? '新建标签页'
            : resolvedInput.url,
      );
      if (
        !$(
          '.window.edge>.titbar>.tabs>.tab.' +
            apps.edge.tabs[apps.edge.now][0] +
            '>.reloading',
        )[0]
      ) {
        $(
          '.window.edge>.titbar>.tabs>.tab.' + apps.edge.tabs[apps.edge.now][0],
        )[0].insertAdjacentHTML('afterbegin', apps.edge.reloadElt);
      }
      $('#win-edge>iframe.' + apps.edge.tabs[apps.edge.now][0])[0].onload =
        function (this: HTMLIFrameElement) {
          $(
            '.window.edge>.titbar>.tabs>.tab.' + this.classList[0],
          )[0].removeChild(
            $(
              '.window.edge>.titbar>.tabs>.tab.' +
                this.classList[0] +
                '>.reloading',
            )[0],
          );
        };
      apps.edge.getTitle($('#win-edge>iframe.' + tabId).attr('src'), tabId);
      if (clear) {
        apps.edge.delHistory(tabId);
        apps.edge.pushHistory(
          tabId,
          $('#win-edge>iframe.' + tabId).attr('src'),
        );
      }
      apps.edge.checkHistory(tabId);
    }
  },
} as unknown as AppDefinition;

export default edge;
