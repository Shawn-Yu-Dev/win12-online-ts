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

const imgviewer = {
  _blobUrl: null,
  _scale: 1,
  _rotate: 0,
  init: () => {},
  open: (url, name) => {
    openapp('imgviewer');
    apps.imgviewer._blobUrl = url;
    apps.imgviewer._scale = 1;
    apps.imgviewer._rotate = 0;
    apps.imgviewer._applyTransform();
    $('#win-imgviewer .preview-img').attr('src', url);
    $('.window.imgviewer>.titbar>p').text(
      name || lang('图片查看器', 'imgviewer.name'),
    );
  },
  close: () => {
    if (apps.imgviewer._blobUrl) {
      URL.revokeObjectURL(apps.imgviewer._blobUrl);
      apps.imgviewer._blobUrl = null;
    }
    hidewin('imgviewer');
  },
  zoomIn: () => {
    apps.imgviewer._scale = Math.min(apps.imgviewer._scale * 1.25, 10);
    apps.imgviewer._applyTransform();
  },
  zoomOut: () => {
    apps.imgviewer._scale = Math.max(apps.imgviewer._scale / 1.25, 0.1);
    apps.imgviewer._applyTransform();
  },
  rotateRight: () => {
    apps.imgviewer._rotate = (apps.imgviewer._rotate + 90) % 360;
    apps.imgviewer._applyTransform();
  },
  resetView: () => {
    apps.imgviewer._scale = 1;
    apps.imgviewer._rotate = 0;
    apps.imgviewer._applyTransform();
  },
  _applyTransform: () => {
    $('#win-imgviewer .preview-img').css(
      'transform',
      `scale(${apps.imgviewer._scale}) rotate(${apps.imgviewer._rotate}deg)`,
    );
  },
} as unknown as AppDefinition;

export default imgviewer;
