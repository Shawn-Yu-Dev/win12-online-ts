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

const mediaplayer = {
  _blobUrl: null,
  init: () => {},
  open: (url: string, name: string, type: string) => {
    openapp('mediaplayer');
    apps.mediaplayer._blobUrl = url;
    $('.window.mediaplayer>.titbar>p').text(
      name || lang('媒体播放器', 'mediaplayer.name'),
    );
    if (type === 'video') {
      (
        $('#mediaplayer-video').attr('src', url).show()[0] as HTMLVideoElement
      ).load();
      ($('#mediaplayer-audio').hide()[0] as HTMLAudioElement).pause();
      $('.window.mediaplayer>.titbar>img').attr('src', 'icon/files/vidio.png');
    } else {
      (
        $('#mediaplayer-audio').attr('src', url).show()[0] as HTMLAudioElement
      ).load();
      ($('#mediaplayer-video').hide()[0] as HTMLVideoElement).pause();
      $('.window.mediaplayer>.titbar>img').attr('src', 'icon/files/music.png');
    }
  },
  close: () => {
    ($('#mediaplayer-video')[0] as HTMLVideoElement).pause();
    ($('#mediaplayer-audio')[0] as HTMLAudioElement).pause();
    if (apps.mediaplayer._blobUrl) {
      URL.revokeObjectURL(apps.mediaplayer._blobUrl);
      apps.mediaplayer._blobUrl = null;
    }
    hidewin('mediaplayer');
  },
} as unknown as AppDefinition;

export default mediaplayer;
