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

const notepadFonts = {
  sizes: {
    初号: '56',
    小初: '48',
    一号: '34.7',
    小一: '32',
    二号: '29.3',
    小二: '24',
    三号: '21.3',
    小三: '20',
    四号: '18.7',
    小四: '16',
    五号: '14',
    小五: '12',
  },
  styles: {
    正常: '',
    粗体: 'font-weight: bold;',
    斜体: 'font-style: italic;',
    粗偏斜体: 'font-weight: bold; font-style: italic;',
  },
  load: () => {
    apps.notepadFonts.fontvalues = $(
      '#win-notepad-font>.row>#win-notepad-font-type>.value-box>.option',
    );
    apps.notepadFonts.sizevalues = $(
      '#win-notepad-font>.row>#win-notepad-font-size>.value-box>.option',
    );
    apps.notepadFonts.stylevalues = $(
      '#win-notepad-font>.row>#win-notepad-font-style>.value-box>.option',
    );
    apps.notepadFonts.typeinput = $(
      '#win-notepad-font>.row>#win-notepad-font-type>input[type=text]',
    )[0];
    apps.notepadFonts.sizeinput = $(
      '#win-notepad-font>.row>#win-notepad-font-size>input[type=text]',
    )[0];
    apps.notepadFonts.styleinput = $(
      '#win-notepad-font>.row>#win-notepad-font-style>input[type=text]',
    )[0];
    apps.notepadFonts.previewBox = $('#win-notepad-font>.preview>.preview-box');
    apps.notepadFonts.textBox = $('.notepad>#win-notepad>.text-box');

    for (const elt of apps.notepadFonts.fontvalues) {
      elt.onclick = function () {
        apps.notepadFonts.typeinput.value = this.innerText;
        apps.notepadFonts.preview();
      };
      elt.setAttribute('style', `font-family: ${elt.innerText};`);
    }

    for (const elt of apps.notepadFonts.sizevalues) {
      elt.onclick = function () {
        apps.notepadFonts.sizeinput.value = this.innerText;
        apps.notepadFonts.preview();
      };
    }

    for (const elt of apps.notepadFonts.stylevalues) {
      elt.onclick = function () {
        apps.notepadFonts.styleinput.value = this.innerText;
        apps.notepadFonts.preview();
      };
      elt.setAttribute('style', apps.notepadFonts.styles[elt.innerText]);
    }

    apps.notepadFonts.sizeinput.addEventListener(
      'keyup',
      apps.notepadFonts.preview,
    );
    apps.notepadFonts.typeinput.addEventListener(
      'keyup',
      apps.notepadFonts.preview,
    );
  },
  preview: () => {
    var fontsize = 0;
    var fontstyle;
    if (!apps.notepadFonts.sizeinput.value.match(/^[0-9]*$/)) {
      if (
        apps.notepadFonts.sizes[apps.notepadFonts.sizeinput.value] != undefined
      ) {
        fontsize = apps.notepadFonts.sizes[apps.notepadFonts.sizeinput.value];
      }
    } else if (apps.notepadFonts.sizeinput.value.match(/^[0-9]*$/)) {
      fontsize = apps.notepadFonts.sizeinput.value;
    }
    if (
      apps.notepadFonts.styles[apps.notepadFonts.styleinput.value] != undefined
    ) {
      fontstyle = apps.notepadFonts.styles[apps.notepadFonts.styleinput.value];
    } else if (
      apps.notepadFonts.styles[apps.notepadFonts.styleinput.value] == undefined
    ) {
      fontstyle = apps.notepadFonts.styles['正常'];
    }
    apps.notepadFonts.previewBox.attr(
      'style',
      `font-family: ${apps.notepadFonts.typeinput.value} !important; font-size: ${fontsize}px !important;${fontstyle}`,
    );
  },
  commitFont: () => {
    const styles = window.getComputedStyle(
      apps.notepadFonts.previewBox[0],
      null,
    );
    apps.notepadFonts.textBox.attr(
      'style',
      `font-family: ${styles.fontFamily} !important; font-size: ${styles.fontSize} !important; font-weight: ${styles.fontWeight} !important; font-style: ${styles.fontStyle} !important;`,
    );
    hidewin('notepad-fonts', 'configs');
  },
  reset: () => {
    const styles = window.getComputedStyle(apps.notepadFonts.textBox[0], null);
    apps.notepadFonts.typeinput.value = styles.fontFamily.split(', ')[0];
    var fontsize = styles.fontSize.split('px')[0];
    var fontweight = styles.fontWeight;
    var fontstyle = styles.fontStyle;
    if (fontweight == '700' && fontstyle == 'normal') {
      apps.notepadFonts.styleinput.value = '粗体';
    } else if (fontweight == '400' && fontstyle == 'italic') {
      apps.notepadFonts.styleinput = '斜体';
    } else if (fontweight == '700' && fontstyle == 'italic') {
      apps.notepadFonts.styleinput.value = '粗偏斜体';
    } else if (fontweight == '400' && fontstyle == 'normal') {
      apps.notepadFonts.styleinput.value = '正常';
    }
    for (const [key, value] of Object.entries(apps.notepadFonts.sizes)) {
      if (value == fontsize) {
        fontsize = key;
        break;
      }
    }
    apps.notepadFonts.sizeinput.value = fontsize;
  },
} as unknown as AppDefinition;

export default notepadFonts;
