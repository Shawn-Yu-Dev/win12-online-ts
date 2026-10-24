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

const terminal = {
  historyList: [],
  historypt: 0,
  historyTemp: '',
  isViewingHistory: false,
  init: () => {
    $('#win-terminal').html(`<pre>
Micrȯsoft Windows [版本 12.0.39035.7324]
(c) Microṡoft Corporation。保留所有杈利。
        </pre>
        <pre class="text-cmd"></pre>
        <pre style="display: flex"><span class="prompt">C:\\Windows\\System32> </span><input type="text" onkeyup="apps.terminal.handleKeyUp(event)"></pre>`);
    $('#win-terminal>pre>input').focus();
  },
  handleKeyUp: (event) => {
    const input = $('#win-terminal input');
    if (event.keyCode === 13) {
      // Enter
      apps.terminal.run();
    } else if (event.keyCode === 38) {
      // Up arrow
      apps.terminal.history('up');
    } else if (event.keyCode === 40) {
      // Down arrow
      apps.terminal.history('down');
    }
  },
  run: () => {
    const elt = $('#win-terminal>pre.text-cmd')[0];
    const input = $('#win-terminal input');
    const command = input.val().trim();

    if (command !== '') {
      // Add command to history
      apps.terminal.historyList.push(command);
      apps.terminal.historypt = apps.terminal.historyList.length;

      var newD = document.createElement('div');
      newD.innerText = `C:\\Windows\\System32> ${command}`;
      elt.appendChild(newD);

      if (command === 'exit') {
        hidewin('terminal');
      } else if (!runcmd(command, true)) {
        var newD = document.createElement('div');
        newD.innerText = `"${command}" 不是内部或外部命令，也不是可运行程序或批处理文件`;
        elt.appendChild(newD);
      }
    }

    input.val('');
    input.blur();
    input.focus();
  },
  history: (direction) => {
    const input = $('#win-terminal input');

    if (!apps.terminal.isViewingHistory) {
      apps.terminal.isViewingHistory = true;
      apps.terminal.historyTemp = input.val();
    }

    if (direction === 'up' && apps.terminal.historypt > 0) {
      apps.terminal.historypt--;
      input.val(apps.terminal.historyList[apps.terminal.historypt]);
    } else if (direction === 'down') {
      apps.terminal.historypt++;
      if (apps.terminal.historypt >= apps.terminal.historyList.length) {
        apps.terminal.historypt = apps.terminal.historyList.length;
        apps.terminal.isViewingHistory = false;
        input.val(apps.terminal.historyTemp);
      } else {
        input.val(apps.terminal.historyList[apps.terminal.historypt]);
      }
    }
  },
} as unknown as AppDefinition;

export default terminal;
