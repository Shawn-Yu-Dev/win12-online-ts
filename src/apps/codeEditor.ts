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

const codeEditor = {
  editor: null,
  _fileHandle: null,
  _dirty: false,
  _loading: false,
  _wrap: false,
  _fontSize: 15,
  _modeMap: {
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    css: 'css',
    scss: 'scss',
    less: 'less',
    html: 'html',
    htm: 'html',
    xml: 'xml',
    svg: 'svg',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    py: 'python',
    java: 'java',
    c: 'c_cpp',
    cpp: 'c_cpp',
    h: 'c_cpp',
    cs: 'csharp',
    go: 'golang',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    sh: 'sh',
    bat: 'batchfile',
    ps1: 'powershell',
    sql: 'sql',
    md: 'markdown',
    r: 'r',
    lua: 'lua',
    swift: 'swift',
    kt: 'kotlin',
    dart: 'dart',
    toml: 'toml',
    ini: 'ini',
    dockerfile: 'dockerfile',
    makefile: 'makefile',
  },
  _modeLabelMap: {
    javascript: 'JavaScript',
    jsx: 'JSX',
    typescript: 'TypeScript',
    tsx: 'TSX',
    css: 'CSS',
    scss: 'SCSS',
    less: 'Less',
    html: 'HTML',
    xml: 'XML',
    svg: 'SVG',
    json: 'JSON',
    yaml: 'YAML',
    python: 'Python',
    java: 'Java',
    c_cpp: 'C/C++',
    csharp: 'C#',
    golang: 'Go',
    rust: 'Rust',
    ruby: 'Ruby',
    php: 'PHP',
    sh: 'Shell',
    batchfile: 'Batch',
    powershell: 'PowerShell',
    sql: 'SQL',
    markdown: 'Markdown',
    r: 'R',
    lua: 'Lua',
    swift: 'Swift',
    kotlin: 'Kotlin',
    dart: 'Dart',
    toml: 'TOML',
    ini: 'INI',
    text: 'Text',
  },
  init: () => {
    return null;
  },
  load: () => {
    ace.require('ace/ext/language_tools');
    var ed = ace.edit('code-ace-editor');
    apps.codeEditor.editor = ed;
    ed.setTheme('ace/theme/vibrant_ink');
    ed.setOptions({
      enableBasicAutocompletion: true,
      enableSnippets: true,
      showPrintMargin: false,
      enableLiveAutocompletion: true,
      fontSize: 15,
      tabSize: 4,
      useSoftTabs: true,
      scrollPastEnd: 0.5,
    });
    ed.commands.addCommand({
      name: 'save',
      bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
      exec: () => apps.codeEditor.save(),
    });
    ed.commands.addCommand({
      name: 'gotoline',
      bindKey: { win: 'Ctrl-G', mac: 'Command-G' },
      exec: () => {
        var line = prompt('跳转到行：');
        if (line) ed.gotoLine(parseInt(line), 0, true);
      },
    });
    ed.on('change', () => {
      if (
        !apps.codeEditor._dirty &&
        apps.codeEditor._fileHandle &&
        !apps.codeEditor._loading
      ) {
        apps.codeEditor._dirty = true;
        var p = $('.window.code-editor>.titbar>p');
        if (!p.text().startsWith('* ')) p.text('* ' + p.text());
      }
    });
    ed.selection.on('changeCursor', () => apps.codeEditor._updateStatus());
    ed.on('changeSession', () => apps.codeEditor._updateStatus());
  },
  _updateStatus: () => {
    var ed = apps.codeEditor.editor;
    if (!ed) return;
    var cursor = ed.getCursorPosition();
    $('#code-status-cursor').text(
      '行 ' + (cursor.row + 1) + ', 列 ' + (cursor.column + 1),
    );
    var sel = ed.getSelectedText();
    if (sel.length > 0) {
      $('#code-status-cursor').text(
        '行 ' +
          (cursor.row + 1) +
          ', 列 ' +
          (cursor.column + 1) +
          ' (已选 ' +
          sel.length +
          ' 字符)',
      );
    }
    var modePath = ed.session.getMode().$id || '';
    var modeName = modePath.split('/').pop();
    $('#code-status-lang').text(
      apps.codeEditor._modeLabelMap[modeName] || modeName || 'Text',
    );
    var tab = ed.session.getUseSoftTabs() ? '空格' : 'Tab';
    $('#code-status-tab').text(tab + ': ' + ed.session.getTabSize());
  },
  open: (text, fileName, fileHandle) => {
    apps.codeEditor._fileHandle = fileHandle || null;
    apps.codeEditor._dirty = false;
    openapp('code-editor');
    if (!apps.codeEditor.editor) {
      shownotice('file-read-error');
      return;
    }
    var ext = fileName.split('.').pop().toLowerCase();
    var mode = apps.codeEditor._modeMap[ext] || 'text';
    apps.codeEditor._loading = true;
    apps.codeEditor.editor.session.setMode('ace/mode/' + mode);
    apps.codeEditor.editor.setValue(text, -1);
    apps.codeEditor._loading = false;
    apps.codeEditor._dirty = false;
    $('.window.code-editor>.titbar>p').text(fileName);
    apps.codeEditor._updateStatus();
  },
  save: async () => {
    if (!apps.codeEditor._fileHandle) return;
    try {
      const writable = await apps.codeEditor._fileHandle.createWritable();
      await writable.write(apps.codeEditor.editor.getValue());
      await writable.close();
      apps.codeEditor._dirty = false;
      var p = $('.window.code-editor>.titbar>p');
      p.text(p.text().replace(/^\* /, ''));
      p.css('opacity', '0.5');
      setTimeout(() => p.css('opacity', ''), 300);
    } catch (e) {
      shownotice('file-write-error');
    }
  },
  setTheme: (theme) => {
    if (apps.codeEditor.editor) apps.codeEditor.editor.setTheme(theme);
  },
  toggleWrap: () => {
    apps.codeEditor._wrap = !apps.codeEditor._wrap;
    if (apps.codeEditor.editor)
      apps.codeEditor.editor.session.setUseWrapMode(apps.codeEditor._wrap);
    $('#code-wrap-btn').toggleClass('active', apps.codeEditor._wrap);
  },
  changeFontSize: (delta) => {
    apps.codeEditor._fontSize = Math.max(
      10,
      Math.min(30, apps.codeEditor._fontSize + delta),
    );
    if (apps.codeEditor.editor)
      apps.codeEditor.editor.setFontSize(apps.codeEditor._fontSize);
  },
  close: () => {
    if (apps.codeEditor._dirty && apps.codeEditor._fileHandle) {
      shownotice('unsaved-code-editor');
      return;
    }
    apps.codeEditor._forceClose();
  },
  _forceClose: () => {
    apps.codeEditor._dirty = false;
    apps.codeEditor._fileHandle = null;
    hidewin('code-editor');
  },
} as unknown as AppDefinition;

export default codeEditor;
