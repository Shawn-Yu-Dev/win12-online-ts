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

const search = {
  rand: [
    { name: '农夫山泉瓶盖简介.txt', bi: 'text', ty: '文本文档' },
    { name: '瓶盖构造图.png', bi: 'image', ty: 'PNG 文件' },
    { name: '瓶盖结构说明.docx', bi: 'richtext', ty: 'Microsoft Word 文档' },
    { name: '可口可乐瓶盖.jpg', bi: 'image', ty: 'JPG 文件' },
    {
      name: '可口可乐瓶盖历史.pptx',
      bi: 'slides',
      ty: 'Microsoft Powerpoint 演示文稿',
    },
    {
      name: '瓶盖质量统计分析.xlsx',
      bi: 'ruled',
      ty: 'Microsoft Excel 工作表',
    },
    { name: '农夫山泉瓶盖.svg', bi: 'image', ty: 'SVG 文件' },
    { name: '瓶盖介绍.doc', bi: 'richtext', ty: 'Microsoft Word 文档' },
  ],
  search: (le: number) => {
    if (le > 0) {
      $('#search-win>.ans>.list>list').html(
        `<a class="a" onclick="apps.search.showdetail(${le % 8})"><i class="bi bi-file-earmark-${apps.search.rand[le % 8].bi}"></i> ${
          apps.search.rand[le % 8].name
        }</a><a class="a" onclick="apps.search.showdetail(${(le + 3) % 8})"><i class="bi bi-file-earmark-${apps.search.rand[(le + 3) % 8].bi}"></i> ${apps.search.rand[(le + 3) % 8].name}</a>`,
      );
      apps.search.showdetail(le % 8);
    } else {
      $('#search-win>.ans>.list>list').html(
        `<p class="text">推荐</p>
					<a onclick="openapp('setting');$('#search-btn').removeClass('show');
					$('#search-win').removeClass('show');
					setTimeout(() => {
						$('#search-win').removeClass('show-begin');
					}, 200);">
						<img src="icon/setting.svg"><p>设置</p></a>
					<a onclick="openapp('about');$('#search-btn').removeClass('show');
					$('#search-win').removeClass('show');
					setTimeout(() => {
						$('#search-win').removeClass('show-begin');
					}, 200);">
						<img src="icon/about.svg"><p>${getAboutAppTitle()}</p></a>`,
      );
      $('#search-win>.ans>.view').removeClass('show');
    }
  },
  showdetail: (i: number) => {
    $('#search-win>.ans>.view').addClass('show');
    let inf = apps.search.rand[i];
    $('#search-win>.ans>.view>.fname>.bi').attr(
      'class',
      'bi bi-file-earmark-' + inf.bi,
    );
    $('#search-win>.ans>.view>.fname>.name').text(inf.name);
    $('#search-win>.ans>.view>.fname>.type').text(inf.ty);
  },
} as unknown as AppDefinition;

export default search;
