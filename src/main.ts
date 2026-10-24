import './shell/mount-windows';
import './core/i18n';
import { installJQueryGlobal } from './core/dom';

import { initDom } from './core/dom';
import { initAccessibility } from './core/accessibility';
import { initContextMenu } from './shell/context-menu';
import { initDropdown } from './shell/dropdown';
import { initTooltips } from './shell/tooltip';
import { initNotices } from './shell/notices';
import { initVoice } from './shell/voice';
import { initClock } from './shell/clock';
import { initTheme } from './shell/theme';
import { initWindowDrag } from './core/windows';
import { initBatteryMonitor, initCpuTimer } from './shell/hardware';
import { initOrientation } from './shell/orientation';
import { initTaskbarPreview } from './shell/preview';
import { initStartup, win12Start } from './shell/startup';
import { initNowPlaying } from './features/nowPlaying';
import { registerAllApps } from './apps';
import { installGlobals } from './globals';
import { initTauriBattery } from './tauri/battery';
import { win12WebGL } from './scripts/webgl';

installJQueryGlobal();
registerAllApps();
installGlobals();

initDom();
initAccessibility();
initContextMenu();
initDropdown();
initTooltips();
initNotices();
initVoice();
initClock();
initTheme();
initWindowDrag();
initBatteryMonitor();
initCpuTimer();
initOrientation();
initTaskbarPreview();
initNowPlaying();
initStartup();
initTauriBattery();
win12WebGL.init();

setTimeout(() => {
  const svg = document.getElementById('loadbacksvg');
  const loading = document.getElementById('loadbackloading');
  if (svg) svg.style.opacity = '1';
  if (loading) loading.style.opacity = '1';
}, 100);

win12Start();
