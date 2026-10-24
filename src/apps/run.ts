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

const run = {
  init: () => {
    $('#win-run>.open>input').val(state.runCmd); //在 windows 中，运行输入的内容会被保留
    window.setTimeout(() => {
      $('#win-run>.open>input').focus();
      $('#win-run>.open>input').select();
    }, 300);
  },
  run: (cmd) => {
    if (!runcmd(cmd)) {
      if (cmd != '') {
        try {
          cmd = cmd.replace(/\/$/, '');
          var pathl = cmd.split('/');
          let tmp = apps.explorer.getPath();
          let valid = true;
          pathl.forEach((name) => {
            if (Object.prototype.hasOwnProperty.call(tmp['folder'], name)) {
              tmp = tmp['folder'][name];
            } else {
              valid = false;
              return false;
            }
          });
          if (valid == true) {
            state.runCmd = cmd;
            openapp('explorer');
            window.setTimeout(() => {
              apps.explorer.goto(cmd);
            }, 300);
          } else {
            nts['Can-not-open-file'] = {
              cnt:
                '<p class="tit">' +
                cmd +
                `</p>
                                <p>Windows 找不到文件 '` +
                cmd +
                "'。请确定文件名是否正确后，再试一次。</p> ",
              btn: [
                {
                  type: 'main',
                  text: '确定',
                  js: "closenotice();showwin('run');$('#win-run>.open>input').select();",
                },
                {
                  type: 'cancel',
                  text: '在 Micrsoft Edge 中搜索',
                  js:
                    "closenotice();openapp('edge');window.setTimeout(() => {apps.edge.newtab();apps.edge.goto('https://www.bing.com/search?q=" +
                    encodeURIComponent(cmd) +
                    "');}, 300);",
                },
              ],
            };
            shownotice('Can-not-open-file');
          }
        } catch {
          nts['Can-not-open-file'] = {
            cnt:
              '<p class="tit">' +
              cmd +
              `</p>
                            <p>Windows 找不到文件 '` +
              cmd +
              "'。请确定文件名是否正确后，再试一次。</p> ",
            btn: [
              {
                type: 'main',
                text: '确定',
                js: "closenotice();showwin('run');$('#win-run>.open>input').select();",
              },
              {
                type: 'cancel',
                text: '在 Micrsoft Edge 中搜索',
                js:
                  "closenotice();openapp('edge');window.setTimeout(() => {apps.edge.newtab();apps.edge.goto('https://www.bing.com/search?q=" +
                  encodeURIComponent(cmd) +
                  "');}, 300);",
              },
            ],
          };
          shownotice('Can-not-open-file');
        }
      }
    }
  },
} as unknown as AppDefinition;

export default run;
