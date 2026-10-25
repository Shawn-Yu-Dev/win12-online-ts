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

const defender = {
  init: (): void => {
    return;
  },
  load: () => {
    const chart = ($('#chart')[0] as HTMLCanvasElement).getContext('2d'),
      gradient = chart.createLinearGradient(0, 0, 0, 450);
    gradient.addColorStop(0, 'rgba(0, 199, 214, 0.32)');
    gradient.addColorStop(0.3, 'rgba(0, 199, 214, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 199, 214, 0)');
    var data = {
      labels: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
      datasets: [
        {
          label: '病毒攻击次数',
          backgroundColor: gradient,
          pointBackgroundColor: '#00c7d6',
          borderWidth: 1,
          borderColor: '#0e1a2f',
          data: [60, 45, 80, 30, 35, 55, 25, 80, 40, 50, 80, 50],
        },
      ],
    };
    var options = {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        easing: 'easeInOutQuad',
        duration: 520,
      },
      scales: {
        yAxes: [
          {
            ticks: {
              fontColor: '#5e6a81',
            },
            gridLines: {
              color: 'rgba(200, 200, 200, 0.08)',
              lineWidth: 1,
            },
          },
        ],
        xAxes: [
          {
            ticks: {
              fontColor: '#5e6a81',
            },
          },
        ],
      },
      elements: {
        line: {
          tension: 0.4,
        },
      },
      legend: {
        display: false,
      },
      point: {
        backgroundColor: '#00c7d6',
      },
      tooltips: {
        titleFontFamily: 'Poppins',
        backgroundColor: 'rgba(0,0,0,0.4)',
        titleFontColor: 'white',
        caretSize: 5,
        cornerRadius: 2,
        xPadding: 10,
        yPadding: 10,
      },
    };
    var chartInstance = new Chart(chart, {
      type: 'line',
      data: data,
      options: options,
    });
  },
} as unknown as AppDefinition;

export default defender;
