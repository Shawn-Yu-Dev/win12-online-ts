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

const notepad = {
  _pendingContent: null,
  _mountedFileHandle: null,
  _keyBound: false,
  _isMd: false,
  _previewing: false,
  _dirty: false,
  _loading: false,
  _markDirty: () => {
    if (
      !apps.notepad._dirty &&
      apps.notepad._mountedFileHandle &&
      !apps.notepad._loading
    ) {
      apps.notepad._dirty = true;
      var p = $('.window.notepad>.titbar>p');
      if (!p.text().startsWith('* ')) p.text('* ' + p.text());
    }
  },
  init: () => {
    apps.notepad._resetPreview();
    apps.notepad._dirty = false;
    apps.notepad._loading = true;
    $('#win-notepad>.text-box').addClass('down');
    setTimeout(() => {
      if (apps.notepad._pendingContent !== null) {
        $('#win-notepad>.text-box')[0].innerText = apps.notepad._pendingContent;
        apps.notepad._pendingContent = null;
      } else {
        $('#win-notepad>.text-box')[0].innerText = '';
        apps.notepad._mountedFileHandle = null;
      }
      $('#win-notepad>.text-box').removeClass('down');
      requestAnimationFrame(() => {
        apps.notepad._loading = false;
      });
    }, 200);
    if (!apps.notepad._keyBound) {
      apps.notepad._keyBound = true;
      $('#win-notepad>.text-box').on('input', apps.notepad._markDirty);
      document.addEventListener('keydown', function (e) {
        if (
          e.ctrlKey &&
          e.key === 's' &&
          $('.window.foc')[0]?.classList.contains('notepad')
        ) {
          e.preventDefault();
          apps.notepad.saveMounted();
        }
      });
    }
  },
  _resetPreview: () => {
    apps.notepad._isMd = false;
    apps.notepad._previewing = false;
    $('#notepad-md-toggle')
      .hide()
      .removeClass('active')
      .html('<i class="bi bi-eye"></i> 预览');
    $('#notepad-md-preview').hide();
    $('#win-notepad>.text-box').show();
  },
  setMdMode: (enabled) => {
    apps.notepad._resetPreview();
    apps.notepad._isMd = enabled;
    if (enabled) {
      $('#notepad-md-toggle').show();
    }
  },
  togglePreview: () => {
    apps.notepad._previewing = !apps.notepad._previewing;
    if (apps.notepad._previewing) {
      var text = $('#win-notepad>.text-box')[0].innerText;
      var html = marked.parse(text);
      $('#notepad-md-preview')
        .html(
          typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : html,
        )
        .show();
      $('#win-notepad>.text-box').hide();
      $('#notepad-md-toggle')
        .addClass('active')
        .html('<i class="bi bi-pencil"></i> 编辑');
    } else {
      $('#notepad-md-preview').hide();
      $('#win-notepad>.text-box').show();
      $('#notepad-md-toggle')
        .removeClass('active')
        .html('<i class="bi bi-eye"></i> 预览');
    }
  },
  saveMounted: async () => {
    if (!apps.notepad._mountedFileHandle) return;
    try {
      const writable = await apps.notepad._mountedFileHandle.createWritable();
      await writable.write($('#win-notepad>.text-box')[0].innerText);
      await writable.close();
      apps.notepad._dirty = false;
      var p = $('.window.notepad>.titbar>p');
      p.text(p.text().replace(/^\* /, ''));
      p.css('opacity', '0.5');
      setTimeout(() => p.css('opacity', ''), 300);
    } catch (e) {
      shownotice('file-write-error');
    }
  },
  close: () => {
    if (apps.notepad._dirty && apps.notepad._mountedFileHandle) {
      shownotice('unsaved-notepad');
      return;
    }
    apps.notepad._forceClose();
  },
  _forceClose: () => {
    apps.notepad._dirty = false;
    apps.notepad._mountedFileHandle = null;
    hidewin('notepad');
    hidewin('notepad-fonts', 'configs');
  },
} as unknown as AppDefinition;

export default notepad;
