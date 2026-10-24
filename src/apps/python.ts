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

const python = {
  codeCache: '',
  prompt: '>>> ',
  indent: false,
  loadPromise: null,
  loadError: '',
  showLoadError: () => {
    const output = $('#win-python>pre.text-cmd')[0];
    if (
      !output ||
      !apps.python.loadError ||
      output.querySelector('.python-load-error')
    )
      return;
    const message = document.createElement('div');
    message.className = 'python-load-error';
    message.textContent = apps.python.loadError;
    output.appendChild(message);
  },
  load: () => {
    if (apps.python.loadPromise) return apps.python.loadPromise;
    apps.python.loadError = '';
    apps.python.loadPromise = (async function () {
      try {
        // The shell now starts before optional CDN scripts finish.
        // Give the async Pyodide loader time to arrive when Python is
        // opened immediately, while still ending in a visible error
        // instead of an unhandled rejection when the CDN is offline.
        const deadline = Date.now() + 15000;
        while (typeof loadPyodide != 'function' && Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        if (typeof loadPyodide != 'function') {
          throw new Error('Pyodide loader is unavailable');
        }
        let runtimeTimeout;
        try {
          apps.python.pyodide = await Promise.race([
            loadPyodide(),
            new Promise((_, reject) => {
              runtimeTimeout = setTimeout(
                () => reject(new Error('Pyodide runtime load timed out')),
                30000,
              );
            }),
          ]);
        } finally {
          clearTimeout(runtimeTimeout);
        }
        apps.python.pyodide.runPython(`
import sys
import io
`);
      } catch (error) {
        apps.python.loaded = false;
        apps.python.loadError =
          'Python 运行环境加载失败 / Python runtime unavailable.';
        apps.python.showLoadError();
        console.warn('Unable to load Python runtime:', error);
      } finally {
        apps.python.loadPromise = null;
      }
    })();
    return apps.python.loadPromise;
  },
  init: () => {
    $('#win-python').html(`
        <pre>
Python 3.11.2  [MSC v.1912 64 bit (AMD64)] :: Anaconda, Inc. on win32
Type "help", "copyright", "credits" or "license" for more information.
        </pre>
        <pre class="text-cmd"></pre>
        <pre style="display: flex;"><span class='prompt'>>>> </span><input type="text" onkeyup="if (event.keyCode == 13) { apps.python.run(); }"></pre>`);
    apps.python.showLoadError();
  },
  run: () => {
    if (apps.python.pyodide) {
      const input = $('#win-python>pre>input');
      const _code = input.val();
      if (_code == 'exit()') {
        hidewin('python');
        input.val('');
      } else {
        const elt = $('#win-python>pre.text-cmd')[0];
        const lastChar = _code[_code.length - 1];
        var newD = document.createElement('div');
        newD.innerText = `${apps.python.prompt}${_code}`;
        elt.appendChild(newD);
        if (
          lastChar != ':' &&
          lastChar != '\\' &&
          (!apps.python.indent || _code == '')
        ) {
          apps.python.prompt = '>>> ';
          apps.python.codeCache += _code;
          apps.python.indent = false;
          const code = apps.python.codeCache;
          apps.python.codeCache = '';
          apps.python.pyodide.runPython('sys.stdout = io.StringIO()');
          try {
            const result = String(apps.python.pyodide.runPython(code));
            if (apps.python.pyodide.runPython('sys.stdout.getvalue()')) {
              var newD = document.createElement('div');
              newD.innerText = `${apps.python.pyodide.runPython('sys.stdout.getvalue()')}`;
              elt.appendChild(newD);
            }
            if (result && result != 'undefined') {
              var newD = document.createElement('div');
              if (result == 'false') {
                newD.innerText = 'False';
              } else if (result == 'true') {
                newD.innerText = 'True';
              } else {
                newD.innerText = result;
              }
              elt.appendChild(newD);
            }
          } catch (err) {
            var newD = document.createElement('div');
            newD.innerText = `${err.message}`;
            elt.appendChild(newD);
          }
        } else {
          apps.python.prompt = '... ';
          if (lastChar == ':') {
            apps.python.indent = true;
          }
          apps.python.codeCache += _code + '\n';
        }
        input.val('');

        // 自动聚焦
        input.blur();
        input.focus();

        $('#win-python .prompt')[0].innerText = apps.python.prompt;
      }
    }
  },
} as unknown as AppDefinition;

export default python;
