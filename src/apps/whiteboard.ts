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

const whiteboard = {
  canvas: null,
  ctx: null,
  windowResizeObserver: null,
  color: 'red',
  init: () => {
    apps.whiteboard.ctx.lineJoin = 'round';
    apps.whiteboard.ctx.lineCap = 'round';
    apps.whiteboard.changeColor(apps.whiteboard.color);
    if ($(':root').hasClass('dark')) {
      $('.window.whiteboard>.titbar>p').text('Blackboard');
    } else {
      $('.window.whiteboard>.titbar>p').text('Whiteboard');
    }
  },
  changeColor: (color) => {
    apps.whiteboard.color = color;
    if (color == 'eraser') {
      apps.whiteboard.ctx.strokeStyle = 'black';
      apps.whiteboard.ctx.lineWidth = 35;
      apps.whiteboard.ctx.globalCompositeOperation = 'destination-out';
    } else {
      apps.whiteboard.ctx.strokeStyle = color;
      apps.whiteboard.ctx.globalCompositeOperation = 'source-over';
      apps.whiteboard.ctx.lineWidth = 8;
    }
  },
  changePen: function () {
    const pens = $('#win-whiteboard>.toolbar>.tools>*');
    for (const elt of pens) {
      elt.classList.remove('active');
    }
    this.classList.add('active');
    apps.whiteboard.changeColor(this.dataset.color);
  },
  load: () => {
    apps.whiteboard.canvas = $('#win-whiteboard>canvas')[0];
    apps.whiteboard.ctx = apps.whiteboard.canvas.getContext('2d');
    apps.whiteboard.windowResizeObserver = new ResizeObserver(
      apps.whiteboard.resize,
    );
    apps.whiteboard.windowResizeObserver.observe($('.window.whiteboard')[0], {
      box: 'border-box',
    });
  },
  resize: () => {
    try {
      const imgData = apps.whiteboard.ctx.getImageData(
        0,
        0,
        apps.whiteboard.canvas.width,
        apps.whiteboard.canvas.height,
      );
      apps.whiteboard.canvas.width = $('#win-whiteboard')[0].clientWidth;
      apps.whiteboard.canvas.height = $('#win-whiteboard')[0].clientHeight;
      apps.whiteboard.ctx.putImageData(imgData, 0, 0);
    } catch {
      apps.whiteboard.canvas.width = $('#win-whiteboard')[0].clientWidth;
      apps.whiteboard.canvas.height = $('#win-whiteboard')[0].clientHeight;
    }
    apps.whiteboard.init();
  },
  draw: (e) => {
    let offsetX,
      offsetY,
      left = $('#win-whiteboard')[0].getBoundingClientRect().left,
      top = $('#win-whiteboard')[0].getBoundingClientRect().top;
    if (e.type.match('mouse')) {
      ((offsetX = e.clientX - left), (offsetY = e.clientY - top));
    } else if (e.type.match('touch')) {
      ((offsetX = e.touches[0].clientX - left),
        (offsetY = e.touches[0].clientY - top));
    }
    apps.whiteboard.ctx.beginPath();
    apps.whiteboard.ctx.moveTo(offsetX, offsetY);
    page.onmousemove = apps.whiteboard.drawing;
    page.ontouchmove = apps.whiteboard.drawing;
    page.onmouseup = apps.whiteboard.up;
    page.ontouchend = apps.whiteboard.up;
    page.ontouchcancel = apps.whiteboard.up;
  },
  drawing: (e) => {
    let offsetX,
      offsetY,
      left = $('#win-whiteboard')[0].getBoundingClientRect().left,
      top = $('#win-whiteboard')[0].getBoundingClientRect().top;
    if (e.type.match('mouse')) {
      ((offsetX = e.clientX - left), (offsetY = e.clientY - top));
    } else if (e.type.match('touch')) {
      ((offsetX = e.touches[0].clientX - left),
        (offsetY = e.touches[0].clientY - top));
    }
    apps.whiteboard.ctx.lineTo(offsetX, offsetY);
    apps.whiteboard.ctx.stroke();
  },
  up: () => {
    apps.whiteboard.ctx.stroke();
    page.onmousemove = null;
    page.ontouchmove = null;
    page.onmouseup = null;
    page.ontouchend = null;
    page.ontouchcancel = null;
  },
  download: () => {
    const url = apps.whiteboard.canvas.toDataURL();
    $('#win-whiteboard>a.download')[0].href = url;
    $('#win-whiteboard>a.download')[0].click();
  },
  saveAs: () => {
    // Show filename input dialog using notice system
    shownotice('whiteboard-saveas');
  },
  doSaveAs: () => {
    // Execute the actual save with the filename from the notice input
    const fileName =
      (
        document.getElementById('whiteboard-filename') as HTMLInputElement
      ).value.trim() || `Whiteboard_${new Date().toISOString().slice(0, 10)}`;

    const url = apps.whiteboard.canvas.toDataURL();
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.png') ? fileName : fileName + '.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    closenotice();
  },
  delete: () => {
    apps.whiteboard.ctx.clearRect(
      0,
      0,
      apps.whiteboard.canvas.width,
      apps.whiteboard.canvas.height,
    );
  },
} as unknown as AppDefinition;

export default whiteboard;
