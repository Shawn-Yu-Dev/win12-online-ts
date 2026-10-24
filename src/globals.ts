import { $, page, stop, setMenuHiders } from './core/dom';
import { apps } from './core/app-registry';
import { state } from './core/state';
import {
  lang,
  isTauriApp,
  getAboutAppTitle,
  loadlang,
  updateAboutAppEntrypoints,
} from './core/i18n';
import {
  setData,
  decodeHtml,
  calcTimeString,
  getPanicColor,
  setPanicColor,
} from './core/utils';
import {
  focusHighestBlockingLayer,
  getHighestBlockingLayer,
  isVisibleBlockingLayer,
} from './core/accessibility';
import { showcm, renderContextMenu, addMenu } from './shell/context-menu';
import { showdp, hidedp, playWindowsBackground } from './shell/dropdown';
import { showdescp, hidedescp } from './shell/tooltip';
import { shownotice, closenotice } from './shell/notices';
import {
  openapp,
  openDockWidget,
  removeEdgeSaveUrl,
  hide_startmenu,
  hide_search,
  hide_widgets,
  controlStatus,
  dragBrightness,
  pinapp,
} from './shell/launcher';
import { geticon, syncTaskbarLayout } from './shell/taskbar';
import {
  showwin,
  hidewin,
  maxwin,
  minwin,
  focwin,
  resizewin,
  taskbarclick,
} from './core/windows';
import {
  setIcon,
  saveDesktop,
  attachDesktopDrag,
  desktopMove,
} from './shell/desktop';
import { toggletheme, setWebGLMode, loadWebGLMode } from './shell/theme';
import {
  win12Start,
  sendToSw,
  checkUpdate,
  setupGlobalKey,
} from './shell/startup';
import {
  win12LoginSubmit,
  initLoginPassword,
  win12FinishLogin,
  win12RefreshPasswordSettingStatus,
  win12SetLoginPassword,
  toggleLoginLanguage,
} from './shell/login';
import { checkOrientation, dismissOrientation } from './shell/orientation';
import { showTaskbarPreview, hideTaskbarPreview } from './shell/preview';
import {
  startSpeechRecognition,
  updateVoiceBallStatus,
  insertTextAtCursor,
  msgDoneOperate,
} from './shell/voice';
import { copilot } from './shell/copilot';
import { dateText } from './shell/clock';
import { widgets, editMode, widgetsMove } from './features/widgets';
import { m_tab } from './features/tab';
import { news } from './scripts/news';
import { resolveEdgeAddressInput } from './scripts/edge-address';
import { add_save } from './scripts/edge-bookmarks';
import { getLunar } from './scripts/lunar';
import { runcmd } from './scripts/terminal';
import { terminalEggs } from './scripts/terminal-eggs';
import { win12WebGL } from './scripts/webgl';
import { cms } from './data/context-menus';
import { nts } from './data/notices';
import { dps } from './data/dock-panels';
import { icon, nomax, nomin } from './data/app-icons';
import { taskmgrTasks } from './data/tasks';
import { appCalculator } from './scripts/calculator';
import { server, pages } from './core/api';

function expose(name: string, value: unknown): void {
  (window as any)[name] = value;
}

function defineStateProp(
  name: string,
  get: () => unknown,
  set?: (value: any) => void,
): void {
  Object.defineProperty(window, name, {
    configurable: true,
    enumerable: true,
    get,
    set,
  });
}

export function installGlobals(): void {
  expose('$', $);
  expose('jQuery', $);
  expose('page', page);
  expose('stop', stop);
  expose('apps', apps);

  expose('lang', lang);
  expose('isTauriApp', isTauriApp);
  expose('getAboutAppTitle', getAboutAppTitle);
  expose('loadlang', loadlang);
  expose('updateAboutAppEntrypoints', updateAboutAppEntrypoints);

  expose('setData', setData);
  expose('decodeHtml', decodeHtml);
  expose('calcTimeString', calcTimeString);
  expose('getPanicColor', getPanicColor);
  expose('setPanicColor', setPanicColor);

  expose('showcm', showcm);
  expose('renderContextMenu', renderContextMenu);
  expose('addMenu', addMenu);
  expose('showdp', showdp);
  expose('hidedp', hidedp);
  expose('playWindowsBackground', playWindowsBackground);
  expose('showdescp', showdescp);
  expose('hidedescp', hidedescp);
  expose('shownotice', shownotice);
  expose('closenotice', closenotice);

  expose('openapp', openapp);
  expose('openDockWidget', openDockWidget);
  expose('removeEdgeSaveUrl', removeEdgeSaveUrl);
  expose('hide_startmenu', hide_startmenu);
  expose('hide_search', hide_search);
  expose('hide_widgets', hide_widgets);
  expose('controlStatus', controlStatus);
  expose('dragBrightness', dragBrightness);
  expose('pinapp', pinapp);
  expose('geticon', geticon);
  expose('syncTaskbarLayout', syncTaskbarLayout);

  expose('showwin', showwin);
  expose('hidewin', hidewin);
  expose('maxwin', maxwin);
  expose('minwin', minwin);
  expose('focwin', focwin);
  expose('resizewin', resizewin);
  expose('taskbarclick', taskbarclick);

  expose('setIcon', setIcon);
  expose('saveDesktop', saveDesktop);
  expose('attachDesktopDrag', attachDesktopDrag);
  expose('desktopMove', desktopMove);
  expose('toggletheme', toggletheme);
  expose('setWebGLMode', setWebGLMode);
  expose('loadWebGLMode', loadWebGLMode);

  expose('win12Start', win12Start);
  expose('sendToSw', sendToSw);
  expose('checkUpdate', checkUpdate);
  expose('setupGlobalKey', setupGlobalKey);
  expose('win12LoginSubmit', win12LoginSubmit);
  expose('initLoginPassword', initLoginPassword);
  expose('win12FinishLogin', win12FinishLogin);
  expose(
    'win12RefreshPasswordSettingStatus',
    win12RefreshPasswordSettingStatus,
  );
  expose('win12SetLoginPassword', win12SetLoginPassword);
  expose('toggleLoginLanguage', toggleLoginLanguage);

  expose('checkOrientation', checkOrientation);
  expose('dismissOrientation', dismissOrientation);
  expose('showTaskbarPreview', showTaskbarPreview);
  expose('hideTaskbarPreview', hideTaskbarPreview);
  expose('startSpeechRecognition', startSpeechRecognition);
  expose('updateVoiceBallStatus', updateVoiceBallStatus);
  expose('insertTextAtCursor', insertTextAtCursor);
  expose('msgDoneOperate', msgDoneOperate);
  expose('focusHighestBlockingLayer', focusHighestBlockingLayer);
  expose('getHighestBlockingLayer', getHighestBlockingLayer);
  expose('isVisibleBlockingLayer', isVisibleBlockingLayer);

  expose('copilot', copilot);
  expose('date', dateText);
  expose('widgets', widgets);
  expose('editMode', editMode);
  expose('widgetsMove', widgetsMove);
  expose('m_tab', m_tab);
  expose('news', news);
  expose('resolveEdgeAddressInput', resolveEdgeAddressInput);
  expose('add_save', add_save);
  expose('getLunar', getLunar);
  expose('runcmd', runcmd);
  expose('terminalEggs', terminalEggs);
  expose('win12WebGL', win12WebGL);
  expose('appCalculator', appCalculator);

  expose('cms', cms);
  expose('nts', nts);
  expose('dps', dps);
  expose('icon', icon);
  expose('nomax', nomax);
  expose('nomin', nomin);
  expose('taskmgrTasks', taskmgrTasks);
  expose('server', server);
  expose('pages', pages);

  defineStateProp(
    'run_cmd',
    () => state.runCmd,
    (v) => (state.runCmd = v),
  );
  defineStateProp(
    'autoUpdate',
    () => state.autoUpdate,
    (v) => (state.autoUpdate = v),
  );
  defineStateProp(
    'font_window',
    () => state.fontWindow,
    (v) => (state.fontWindow = v),
  );
  defineStateProp(
    'edit_mode',
    () => state.editMode,
    (v) => (state.editMode = v),
  );
  defineStateProp(
    'isDark',
    () => state.isDark,
    (v) => (state.isDark = v),
  );
  defineStateProp(
    'wifiStatus',
    () => state.wifi,
    (v) => (state.wifi = v),
  );
  defineStateProp(
    'flyStatus',
    () => state.flyMode,
    (v) => (state.flyMode = v),
  );
  defineStateProp(
    'use_music',
    () => state.useMusic,
    (v) => (state.useMusic = v),
  );
  defineStateProp(
    'use_mic_voice',
    () => state.useMicVoice,
    (v) => (state.useMicVoice = v),
  );
  defineStateProp(
    'topmost',
    () => state.topmost,
    (v) => (state.topmost = v),
  );
  defineStateProp(
    'sys_setting',
    () => state.sysSettings,
    (v) => (state.sysSettings = v),
  );
  defineStateProp(
    'desktopItem',
    () => state.desktopItems,
    (v) => (state.desktopItems = v),
  );

  setMenuHiders(hide_startmenu, hide_search);
}
