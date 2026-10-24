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

const pythonEditor = {
  editor: null,
  init: () => {
    return null;
  },
  run: () => {
    let result;
    let output = document.getElementById('output');
    try {
      if (apps.python.pyodide) {
        let code = apps.pythonEditor.editor.getValue();
        apps.python.pyodide.runPython('sys.stdout = io.StringIO()');
        apps.python.pyodide.runPython(code);
        result = apps.python.pyodide.runPython('sys.stdout.getvalue()');
      }
    } catch (e) {
      result = e.message;
    }
    output.innerHTML = result;
  },
  load: () => {
    if (!apps.python.loaded) {
      apps.python.loaded = true;
      apps.python.load();
    }
    ace.require('ace/ext/language_tools');
    apps.pythonEditor.editor = ace.edit('win-python-ace-editor');
    apps.pythonEditor.editor.session.setMode('ace/mode/python');
    apps.pythonEditor.editor.setTheme('ace/theme/vibrant_ink');
    apps.pythonEditor.editor.setOptions({
      enableBasicAutocompletion: true,
      enableSnippets: true,
      showPrintMargin: false,
      enableLiveAutocompletion: true,
    });
  },
} as unknown as AppDefinition;

export default pythonEditor;
