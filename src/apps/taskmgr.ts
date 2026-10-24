// @ts-nocheck
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

const taskmgr = {
  sortType: 'cpu',
  sortOrder: 'up-down',
  tasks: structuredClone(taskmgrTasks),
  cpu: 0,
  cpuChart: null,
  cpuBg: null,
  memory: 0,
  memoryChart: null,
  memoryBg: null,
  memory2Elt: null,
  cpuRunningTime: 0,
  disk: 0,
  diskChart: null,
  diskBg: null,
  disk2Chart: null,
  disk2Bg: null,
  diskSpeed: {
    read: 0,
    write: 0,
  },
  wifi: {
    receive: 0,
    send: 0,
  },
  wifiChart: null,
  wifiBg: null,
  gpu: {
    d3: 0,
    copy: 0,
    videod: 0,
    videop: 0,
    usage: 0,
  },
  gpuChart: [null, null, null, null],
  gpuBg: [null, null, null, null],
  gpu2Chart: [null, null],
  gpu2Bg: [null, null],
  gpuMemory: {
    private: 0,
    public: 0,
  },
  gpu3Chart: null,
  processList: [],
  handle: 0,
  foldHide: false,
  delay: 0,
  paused: false,
  pauseKeyBound: false,
  remove: () => {
    apps.taskmgr.paused = false;
    apps.taskmgr.loaded = false;
    window.clearInterval(apps.taskmgr.handle);
    if (apps.taskmgr.preLoaded == true) {
      apps.taskmgr.preLoaded = false;
      apps.taskmgr.load(false);
    } else {
      apps.taskmgr.preLoaded = false;
    }
  },
  init: () => {
    apps.taskmgr.bindPauseKey();
    window.setTimeout(() => {
      $('#win-taskmgr>.menu>list.focs>a')[0].click();
    }, 200);
  },
  bindPauseKey: () => {
    if (apps.taskmgr.pauseKeyBound) {
      return;
    }

    apps.taskmgr._pauseKeyDownHandler = (event) => {
      if (event.key == 'Control' && $('.window.taskmgr.foc')[0]) {
        apps.taskmgr.paused = true;
      }
    };
    apps.taskmgr._pauseKeyUpHandler = (event) => {
      if (event.key == 'Control') {
        apps.taskmgr.paused = false;
      }
    };
    apps.taskmgr._pauseBlurHandler = () => {
      apps.taskmgr.paused = false;
    };

    document.addEventListener('keydown', apps.taskmgr._pauseKeyDownHandler);
    document.addEventListener('keyup', apps.taskmgr._pauseKeyUpHandler);
    window.addEventListener('blur', apps.taskmgr._pauseBlurHandler);
    apps.taskmgr.pauseKeyBound = true;
  },
  fold: () => {
    if (!apps.taskmgr.foldHide) {
      window.setTimeout(() => {
        $('#win-taskmgr>.menu>.focs>a>p').hide();
      }, 50);
      $('#win-taskmgr')[0].style.gridTemplateColumns = '78px auto';
    } else {
      window.setTimeout(() => {
        $('#win-taskmgr>.menu>.focs>a>p').show();
      }, 100);
      $('#win-taskmgr')[0].style.gridTemplateColumns = '320px auto';
    }
    apps.taskmgr.foldHide = !apps.taskmgr.foldHide;
  },
  load: (init_all = true) => {
    if (init_all == true) {
      const performance = $(
        '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph',
      )[0];
      performance.$$(
        '.graph-cpu>.information>.left>div:nth-child(3)>.value',
      )[0].innerText = apps.taskmgr.tasks.length;

      apps.taskmgr.cpuChart = performance.$$('.graph-cpu>.graph>.chart')[0];
      apps.taskmgr.cpuBg = performance.$$('.graph-cpu>.graph>.bg')[0];
      apps.taskmgr.cpuBg.innerHTML = '<g class="col"></g><g class="row"></g>';
      apps.taskmgr.cpuChart.innerHTML =
        '<path d="M 6000 1000" stroke="#2983cc" stroke-width="3px" fill="#2983cc22" />';

      apps.taskmgr.memoryChart = performance.$$(
        '.graph-memory>.graph>.chart',
      )[0];
      apps.taskmgr.memoryBg = performance.$$('.graph-memory>.graph>.bg')[0];
      apps.taskmgr.memoryBg.innerHTML =
        '<g class="col"></g><g class="row"></g>';
      apps.taskmgr.memoryChart.innerHTML =
        '<path d="M 6000 1000" stroke="#660099" stroke-width="3px" fill="#66009922" />';

      apps.taskmgr.memory2Elt = performance.$$(
        '.graph-memory>.graph2>.chart',
      )[0];

      apps.taskmgr.diskChart = performance.$$('.graph-disk>.graph>.chart')[0];
      apps.taskmgr.diskBg = performance.$$('.graph-disk>.graph>.bg')[0];
      apps.taskmgr.diskBg.innerHTML = '<g class="col"></g><g class="row"></g>';
      apps.taskmgr.diskChart.innerHTML =
        '<path d="M 6000 1000" stroke="#008000" stroke-width="3px" fill="#00800022" />';

      apps.taskmgr.disk2Chart = performance.$$('.graph-disk>.graph2>.chart')[0];
      apps.taskmgr.disk2Bg = performance.$$('.graph-disk>.graph2>.bg')[0];
      apps.taskmgr.disk2Bg.innerHTML = '<g class="col"></g><g class="row"></g>';
      apps.taskmgr.disk2Chart.innerHTML =
        '<path d="M 6000 1000" stroke="#008000" stroke-width="3px" fill="#00800022" /><path d="M 6000 1000" stroke="#008000" stroke-width="3px" fill="none" stroke-dasharray="15, 15" />';

      apps.taskmgr.wifiChart = performance.$$('.graph-wifi>.graph>.chart')[0];
      apps.taskmgr.wifiBg = performance.$$('.graph-wifi>.graph>.bg')[0];
      apps.taskmgr.wifiChart.innerHTML =
        '<path d="M 6000 1000" stroke="#8e5829" stroke-width="3px" fill="#8e582922" /><path d="M 6000 1000" stroke="#8e5829" stroke-width="3px" fill="none" stroke-dasharray="10, 10" />';
      apps.taskmgr.wifiBg.innerHTML = '<g class="col"></g><g class="row"></g>';

      apps.taskmgr.gpu3Chart = performance.$$('.graph-gpu>.graphs>svg')[0];
      apps.taskmgr.gpu3Chart.innerHTML =
        '<path d="M 6000 1000" stroke="#2983cc" stroke-width="3px" fill="#2983cc22" />';

      for (var i = 1; i <= 4; i++) {
        apps.taskmgr.gpuChart[i - 1] = performance.$$(
          '.graph-gpu>.graphs>.graph' + i + '>.chart>.chart',
        )[0];
        apps.taskmgr.gpuChart[i - 1].innerHTML =
          '<path d="M 6000 1000" stroke-width="3px" stroke="#2983cc" fill="#2983cc22" />';
        apps.taskmgr.gpuBg[i - 1] = performance.$$(
          '.graph-gpu>.graphs>.graph' + i + '>.chart>.bg',
        )[0];
        apps.taskmgr.gpuBg[i - 1].innerHTML =
          '<g class="col"></g><g class="row"></g>';
      }
      for (var i = 1; i <= 2; i++) {
        apps.taskmgr.gpu2Chart[i - 1] = performance.$$(
          '.graph-gpu>.gpu2-' + i + '>.chart',
        )[0];
        apps.taskmgr.gpu2Bg[i - 1] = performance.$$(
          '.graph-gpu>.gpu2-' + i + '>.bg',
        )[0];
        apps.taskmgr.gpu2Bg[i - 1].innerHTML =
          '<g class="col"></g><g class="row"></g>';
        apps.taskmgr.gpu2Chart[i - 1].innerHTML =
          '<path d="M 6000 1000" stroke-width="3px" stroke="#2983cc" fill="#2983cc22" />';
      }
    }

    if (apps.taskmgr.preLoaded != true && apps.taskmgr.loaded != true) {
      apps.taskmgr.gpuMemory.private = Number((Math.random() * 4).toFixed(2));
      apps.taskmgr.gpuMemory.public = Number((Math.random() * 4).toFixed(2));
      apps.taskmgr.generateProcesses();
      apps.taskmgr.sort();
      apps.taskmgr.loadProcesses();
      apps.taskmgr.performanceLoad();
    }

    if (init_all == true) {
      apps.taskmgr.gpuMemory.private = Number((Math.random() * 4).toFixed(2));
      apps.taskmgr.gpuMemory.public = Number((Math.random() * 4).toFixed(2));
      apps.taskmgr.loadProcesses();
      apps.taskmgr.generateProcesses();
      apps.taskmgr.sort();
      apps.taskmgr.performanceLoad();
      apps.taskmgr.drawGrids();
      apps.taskmgr.handle = window.setInterval(() => {
        if (apps.taskmgr.paused) {
          return;
        }
        apps.taskmgr.loadProcesses();
        apps.taskmgr.generateProcesses();
        apps.taskmgr.sort();
        apps.taskmgr.performanceLoad();
        apps.taskmgr.loadGraph();
        apps.taskmgr.gridLine();
        apps.taskmgr.memory2Elt.style.width = apps.taskmgr.memory + '%';
      }, 1000);
    } else if (apps.taskmgr.loaded != true && apps.taskmgr.preLoaded != true) {
      apps.taskmgr.handle = window.setInterval(() => {
        if (apps.taskmgr.paused) {
          return;
        }
        apps.taskmgr.loadProcesses();
        apps.taskmgr.generateProcesses();
        apps.taskmgr.sort();
        apps.taskmgr.performanceLoad();
      }, 1000);
    }
  },
  page: (name) => {
    $('#win-taskmgr>.main>.cnt.' + name).scrollTop(0);
    $('#win-taskmgr>.main>.cnt.show').removeClass('show');
    $('#win-taskmgr>.main>.cnt.' + name).addClass('show');
    $('#win-taskmgr>.menu>list.focs>a.check').removeClass('check');
    $('#win-taskmgr>.menu>list.focs>a.' + name).addClass('check');
    if (!(name == 'processes' || name == '404')) {
      document.getElementById('tsk-search').style.display = 'none';
    } else {
      document.getElementById('tsk-search').style.display = '';
    }
  },
  graph: (name) => {
    $('#win-setting>.page>.cnt.' + name).scrollTop(0);
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.show',
    ).removeClass('show');
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.' +
        name,
    ).addClass('show');
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.select-menu>.check',
    ).removeClass('check');
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.select-menu>.' + name,
    ).addClass('check');
  },
  generateProcesses: () => {
    let processList = [];
    let max = 100 / apps.taskmgr.tasks.length;
    let cpusum = 0,
      memorysum = 0,
      disksum = 0,
      diskUsing =
        Number(Math.random()) >
        0.7; /*, color = window.getComputedStyle(page, null).getPropertyValue('--href')*/
    var search_len = 0;
    for (const elt of apps.taskmgr.tasks) {
      let cpu = Number((Math.random() * max).toFixed(1)),
        memory =
          apps.taskmgr.memory != 0
            ? apps.taskmgr.memory / apps.taskmgr.tasks.length +
              Number(((Math.random() - 0.5) / 5).toFixed(1))
            : Number((Math.random() * max).toFixed(1)),
        disk =
          Number((Math.random() * max).toFixed(1)) > max / 1.2 && diskUsing
            ? max * Number(Math.random().toFixed(1))
            : 0;
      cpusum = Number((cpusum + cpu).toFixed(1));
      memorysum = Number((memorysum + memory).toFixed(1));
      disksum = Number((disksum + disk).toFixed(1));
      if (
        document.getElementById('tsk-search').value != '' &&
        document.getElementById('tsk-search').style.display == '' &&
        !elt.name
          .toLowerCase()
          .includes(document.getElementById('tsk-search').value.toLowerCase())
      ) {
        continue;
      }
      processList.splice(processList.length, 0, {
        name: elt.name,
        icon: elt.icon || '',
        system: elt.system,
        cpu: cpu,
        memory: memory,
        disk: disk,
      });
      search_len++;
    }
    if (search_len == 0) {
      apps.taskmgr.page('404');
    } else {
      if (
        $('#tsk-search').val() != '' &&
        $('#tsk-search')[0].style.display == ''
      ) {
        apps.taskmgr.page('processes');
      }
    }
    apps.taskmgr.cpu = cpusum;
    apps.taskmgr.memory = memorysum;
    apps.taskmgr.disk = disksum;
    apps.taskmgr.processList = processList;
  },
  loadProcesses: (processList = apps.taskmgr.processList) => {
    const processContainer = $(
      '#win-taskmgr>.main>.cnt.processes tbody.view',
    )[0];
    const values = $('#win-taskmgr>.main>.cnt.processes thead>tr>th>.value');
    const cpu = values[0],
      memory = values[1],
      disk = values[2];
    let selected;
    if (
      $(
        '#win-taskmgr>.main>.cnt.processes tbody.view>tr.select>td:first-child>.text',
      )[0]
    ) {
      selected = $(
        '#win-taskmgr>.main>.cnt.processes tbody.view>tr.select>td:first-child>.text',
      )[0].innerText;
    }
    let max = 100 / apps.taskmgr.tasks.length;
    processContainer.innerHTML = '';
    for (const elt of processList) {
      const newElt = document.createElement('tr');
      newElt.classList.add('notrans');
      newElt.innerHTML = `<td><div class="text"><div class="icon" style="background-image: url('${elt.icon ? elt.icon : ''}');"></div>${elt.name}</div></td><td style="text-align: right;background-color: color-mix(in srgb, var(--theme-2) ${elt.cpu >= max / 1.3 ? '75%' : '50%'}, transparent);">${elt.cpu.toFixed(1)}%</td><td style="text-align: right;background-color: color-mix(in srgb, var(--theme-2) ${elt.memory >= max / 1 ? '75%' : '50%'}, transparent);">${elt.memory.toFixed(1)}%</td><td style="text-align: right;background-color: color-mix(in srgb, var(--theme-2) ${elt.disk >= max / 1.3 ? '75%' : '50%'}, transparent);">${elt.disk.toFixed(1)}%</td><td>${['非常低', '非常低', '非常低', '低', '中'][Math.floor(Math.random() * 5)]}</td>`;
      if (elt.name == selected) {
        newElt.classList.add('select');
      }
      processContainer.appendChild(newElt);
      newElt.onclick = function () {
        apps.taskmgr.selectProcess(this);
      };
      newElt.oncontextmenu = function (e) {
        return showcm(e, 'taskmgr.processes', elt.name);
      };
      window.setTimeout(() => {
        newElt.classList.remove('notrans');
      }, 100);
    }
    cpu.innerText = apps.taskmgr.cpu.toFixed(1) + '%';
    memory.innerText = apps.taskmgr.memory.toFixed(1) + '%';
    disk.innerText = apps.taskmgr.disk.toFixed(1) + '%';
  },
  sort: (
    processList = apps.taskmgr.processList,
    type = apps.taskmgr.sortType,
    order = apps.taskmgr.sortOrder,
  ) => {
    processList.sort((a, b) => {
      if (a[type] > b[type]) {
        return order == 'up-down' ? -1 : 1;
      } else if (a[type] <= b[type]) {
        return order == 'up-down' ? 1 : -1;
      }
    });
    apps.taskmgr.processList = processList;
  },
  performanceLoad: () => {
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.graph-cpu>.information>.left>div:nth-child(1)>.value',
    )[0].innerText = `${apps.taskmgr.cpu.toFixed(1)}%`;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.graph-cpu>.information>.left>div:nth-child(2)>.value',
    )[0].innerText = `${((3200 / 100) * apps.taskmgr.cpu).toFixed(1)} GHz`;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.graph-cpu>.information>.left>div:nth-child(4)>.value',
    )[0].innerText =
      `${apps.taskmgr.tasks.length * (5 + Math.floor(Math.random() * 5))}`;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.graph-cpu>.information>.left>div:nth-child(5)>.value',
    )[0].innerText =
      `${apps.taskmgr.tasks.length * (10 + Math.floor(Math.random() * 20))}`;
    let sec = apps.taskmgr.cpuRunningTime;
    let min = Math.floor(sec / 60);
    sec %= 60;
    let hour = Math.floor(min / 60);
    min %= 60;
    let day = Math.floor(hour / 24);
    hour %= 24;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.graph-cpu>.information>.left>div:nth-child(6)>.value',
    )[0].innerText =
      `${day}:${String(hour).length < 2 ? '0' : ''}${hour}:${String(min).length < 2 ? '0' : ''}${min}:${String(sec).length < 2 ? '0' : ''}${sec}`;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.select-menu>.graph-cpu>.right>.data>.value1',
    )[0].innerText = `${apps.taskmgr.cpu.toFixed(1)}%`;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.select-menu>.graph-cpu>.right>.data>.value2',
    )[0].innerText = `${((3200 / 100) * apps.taskmgr.cpu).toFixed(1)}GHz`;

    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.graph-memory>.information>.left>div:nth-child(1)>.value',
    )[0].innerText = `${apps.taskmgr.memory.toFixed(1)} GB (0 MB)`;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.graph-memory>.information>.left>div:nth-child(2)>.value',
    )[0].innerText = `${(100 - apps.taskmgr.memory).toFixed(1)} GB`;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.graph-memory>.information>.left>div:nth-child(3)>.value',
    )[0].innerText = `${(apps.taskmgr.memory - 2).toFixed(1)} / 100 GB`;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.graph-memory>.information>.left>div:nth-child(4)>.value',
    )[0].innerText = `${(apps.taskmgr.memory / 2).toFixed(2)} GB`;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.select-menu>.graph-memory>.right>.data>.value1',
    )[0].innerText = `${apps.taskmgr.memory.toFixed(1)} / 100 GB`;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.select-menu>.graph-memory>.right>.data>.value2',
    )[0].innerText = `${apps.taskmgr.memory.toFixed(1)}%`;

    apps.taskmgr.diskSpeed.read =
      apps.taskmgr.disk != 0 ? (Math.random() * 100).toFixed(2) : 0;
    apps.taskmgr.diskSpeed.write =
      apps.taskmgr.disk != 0 ? (Math.random() * 100).toFixed(2) : 0;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.graph-disk>.information>.left>div:nth-child(1)>.value',
    )[0].innerText = `${apps.taskmgr.disk}%`;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.graph-disk>.information>.left>div:nth-child(2)>.value',
    )[0].innerText =
      `${apps.taskmgr.disk != 0 ? Math.random().toFixed(2) : 0} 毫秒`;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.graph-disk>.information>.left>div:nth-child(3)>.value',
    )[0].innerText =
      `${apps.taskmgr.diskSpeed.read} ${apps.taskmgr.disk != 0 ? 'MB/秒' : 'KB/秒'}`;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.graph-disk>.information>.left>div:nth-child(4)>.value',
    )[0].innerText =
      `${apps.taskmgr.diskSpeed.write} ${apps.taskmgr.disk != 0 ? 'MB/秒' : 'KB/秒'}`;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.select-menu>.graph-disk>.right>.data>.value2',
    )[0].innerText = `${apps.taskmgr.disk}%`;

    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.select-menu>.graph-gpu>.right>.data>.value2',
    )[0].innerText = `${apps.taskmgr.gpu.usage.toFixed(1)}%`;

    apps.taskmgr.gpu.d3 = Number((Math.random() * 15).toFixed(2));
    apps.taskmgr.gpu.copy = Number((Math.random() * 15).toFixed(2));
    apps.taskmgr.gpu.videop = Number((Math.random() * 15).toFixed(2));
    apps.taskmgr.gpu.videod = Number((Math.random() * 15).toFixed(2));
    apps.taskmgr.gpu.usage = Number(
      (
        (apps.taskmgr.gpu.d3 +
          apps.taskmgr.gpu.copy +
          apps.taskmgr.gpu.videop +
          apps.taskmgr.gpu.videod) /
        4
      ).toFixed(1),
    );

    apps.taskmgr.wifi.receive = Number((Math.random() * 100).toFixed(2));
    apps.taskmgr.wifi.send = Number((Math.random() * 100).toFixed(2));
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.graph-wifi>.information>.left>div:nth-child(1)>.value',
    )[0].innerText = `${apps.taskmgr.wifi.send.toFixed(2)} Mbps`;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.performance-graph>.graph-wifi>.information>.left>div:nth-child(2)>.value',
    )[0].innerText = `${apps.taskmgr.wifi.receive.toFixed(2)} Mbps`;
    $(
      '#win-taskmgr>.main>.cnt.performance>.content>.select-menu>.graph-wifi>.right>.data>.value2',
    )[0].innerText =
      `发送： ${apps.taskmgr.wifi.send} 接收： ${apps.taskmgr.wifi.receive} Mbps`;
  },
  drawGraph: (chart, data, nth = 0) => {
    var path = $(chart.querySelectorAll('path')[nth]).attr('d');
    path = path.replace(/ L 6000 1000$/, '');
    var pathl = path.split(' ');
    var newPath = '';
    var sum = 0,
      head = 0;
    for (var i = 0; i < pathl.length; i += 3) {
      const arg = pathl[i];
      if (arg == 'M' && Number(pathl[i + 1]) > 0) {
        pathl[i + 1] = Number(pathl[i + 1]) - 100;
        pathl[i + 2] = pathl[i + 2];
      } else if (arg == 'M' && Number(pathl[i + 1]) <= 0) {
        pathl[i + 1] = 0;
        pathl[i + 2] = 1000;
      } else if (arg == 'L') {
        if (sum == 0) {
          head = i;
        } else if (sum >= 60) {
          pathl.splice(head, 3);
          sum--;
          i -= 3;
        }
        pathl[i + 1] = Number(pathl[i + 1]) - 100;
        sum++;
      }
    }
    pathl.push('L', '6000', 1000 - data, 'L', '6000', '1000');
    window.setTimeout(() => {
      $(chart.querySelectorAll('path')[nth]).attr('d', '');
      for (const arg of pathl) {
        if (!(arg === '')) {
          newPath += arg + ' ';
        }
      }
      newPath = newPath.substring(0, newPath.length - 1);
      $(chart.querySelectorAll('path')[nth]).attr('d', newPath);
    }, apps.taskmgr.delay);
  },
  loadGraph: () => {
    apps.taskmgr.drawGraph(apps.taskmgr.cpuChart, apps.taskmgr.cpu * 10);
    apps.taskmgr.drawGraph(apps.taskmgr.memoryChart, apps.taskmgr.memory * 10);
    apps.taskmgr.drawGraph(apps.taskmgr.diskChart, apps.taskmgr.disk * 10);
    apps.taskmgr.drawGraph(
      apps.taskmgr.disk2Chart,
      apps.taskmgr.diskSpeed.read * 10,
      0,
    );
    apps.taskmgr.drawGraph(
      apps.taskmgr.disk2Chart,
      apps.taskmgr.diskSpeed.write * 10,
      1,
    );
    apps.taskmgr.drawGraph(
      apps.taskmgr.wifiChart,
      apps.taskmgr.wifi.receive * 10,
      0,
    );
    apps.taskmgr.drawGraph(
      apps.taskmgr.wifiChart,
      apps.taskmgr.wifi.send * 10,
      1,
    );
    for (var i = 0; i < 4; i++) {
      apps.taskmgr.drawGraph(
        apps.taskmgr.gpuChart[i],
        apps.taskmgr.gpu[['d3', 'copy', 'videop', 'videod'][i]] * 10,
      );
    }
    for (var i = 0; i < 2; i++) {
      apps.taskmgr.drawGraph(
        apps.taskmgr.gpu2Chart[i],
        apps.taskmgr.gpuMemory[['private', 'public'][i]] *
          (i == 1 ? 1000 / 32 : 1000 / 16),
      );
    }
    apps.taskmgr.drawGraph(apps.taskmgr.gpu3Chart, apps.taskmgr.gpu.usage * 10);
    const menu = $(
      '#win-taskmgr>.main>.cnt.performance>.content>.select-menu',
    )[0];
    menu.$$('.graph-cpu svg')[0].innerHTML = apps.taskmgr.cpuChart.innerHTML;
    menu.$$('.graph-memory svg')[0].innerHTML =
      apps.taskmgr.memoryChart.innerHTML;
    menu.$$('.graph-disk svg')[0].innerHTML = apps.taskmgr.diskChart.innerHTML;
    menu.$$('.graph-wifi svg')[0].innerHTML = apps.taskmgr.wifiChart.innerHTML;
    menu.$$('.graph-gpu svg')[0].innerHTML = apps.taskmgr.gpu3Chart.innerHTML;
  },
  changeSort: (elt, type) => {
    for (const _elt of $('#win-taskmgr>.main>.cnt.processes thead>tr>th>i')) {
      _elt.className = 'bi';
    }
    if (apps.taskmgr.sortOrder == 'up-down' && apps.taskmgr.sortType == type) {
      elt.className = 'bi bi-chevron-up';
      apps.taskmgr.sortOrder = 'down-up';
      apps.taskmgr.sort(apps.taskmgr.processList, type, 'down-up');
    } else {
      elt.className = 'bi bi-chevron-down';
      apps.taskmgr.sortOrder = 'up-down';
      apps.taskmgr.sortType = type;
      apps.taskmgr.sort(apps.taskmgr.processList, type, 'up-down');
    }
  },
  gridLine: () => {
    apps.taskmgr.changeGrids(apps.taskmgr.memoryBg);
    apps.taskmgr.changeGrids(apps.taskmgr.cpuBg);
    apps.taskmgr.changeGrids(apps.taskmgr.diskBg);
    apps.taskmgr.changeGrids(apps.taskmgr.disk2Bg);
    apps.taskmgr.changeGrids(apps.taskmgr.wifiBg);
    apps.taskmgr.gpuBg.forEach(function (chart) {
      apps.taskmgr.changeGrids(chart);
    });
    apps.taskmgr.gpu2Bg.forEach(function (chart) {
      apps.taskmgr.changeGrids(chart);
    });
  },
  selectProcess: (elt) => {
    $('#win-taskmgr>.main>.cnt.processes tbody.view>.select').removeClass(
      'select',
    );
    $(elt).addClass('select');
  },
  taskkill: (name) => {
    if (name == 'System') {
      window.location = 'bluescreen.html';
    } else if (name == 'Windows Logon Process') {
      window.location.reload();
    } else {
      apps.taskmgr.tasks.splice(
        apps.taskmgr.tasks.findIndex((elt) => elt.name == name),
        1,
      );
      if (taskmgrTasks.find((elt) => elt.name == name).link != null) {
        hidewin(taskmgrTasks.find((elt) => elt.name == name).link);
      }
    }
  },
  initgrids: (chart) => {
    const column = chart.querySelector('g.col'),
      row = chart.querySelector('g.row');
    for (var i = 0; i <= 20; i++) {
      column.innerHTML += `<path d="M ${i * 300} 0 L ${i * 300} 1000 Z" stroke="#aeaeae" fill="none" />`;
    }
    for (var i = 0; i <= 10; i++) {
      row.innerHTML += `<path d="M 0 ${i * 100} L 6000 ${i * 100} Z" stroke="#aeaeae" fill="none" />`;
    }
  },
  drawGrids: () => {
    apps.taskmgr.initgrids(apps.taskmgr.cpuBg);
    apps.taskmgr.initgrids(apps.taskmgr.diskBg);
    apps.taskmgr.initgrids(apps.taskmgr.memoryBg);
    apps.taskmgr.initgrids(apps.taskmgr.disk2Bg);
    apps.taskmgr.initgrids(apps.taskmgr.wifiBg);
    for (var i = 0; i < 4; i++) {
      apps.taskmgr.initgrids(apps.taskmgr.gpuBg[i]);
    }
    for (var i = 0; i < 2; i++) {
      apps.taskmgr.initgrids(apps.taskmgr.gpu2Bg[i]);
    }
  },
  changeGrids: (chart) => {
    const grid = chart.querySelectorAll('g.col>path');
    for (const elt of grid) {
      let path = $(elt).attr('d').split(' ');
      for (var i = 0; i < path.length; i++) {
        if (path[i] == 'M' || path[i] == 'L') {
          var cur = Number(path[i + 1]);
          cur -= 100;
          if (cur < 0) {
            cur = 300 - -cur + 6000;
          }
          path[i + 1] = String(cur);
        }
      }
      $(elt).attr('d', '');
      let tmp = '';
      for (const comp of path) {
        tmp += comp + ' ';
      }
      $(elt).attr('d', tmp);
      console.log($(elt).attr('d'));
    }
  },
} as unknown as AppDefinition;

export default taskmgr;
