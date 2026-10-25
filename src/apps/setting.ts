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

interface ThemeContentEntry {
  type?: string;
  name: string;
  url: string;
  path: string;
}

interface ThemeInfo {
  bg: string;
  color1?: string;
  color2?: string;
  href?: string;
}

interface AppUpdateInfo {
  current_version?: string;
  latest_version?: string;
  published_at?: string;
  latest_name?: string;
  update_available?: boolean;
  release_url?: string;
}

const setting = {
  init: () => {
    $('#win-setting>.menu>list>a.home')[0].click();
    apps.setting.syncLanguageSelect();
    $(
      '#win-setting>.page>.cnt.update>.setting-list>div:last-child>.alr>a.checkbox',
    )[
      localStorage.getItem('autoUpdate') == 'true' ? 'addClass' : 'removeClass'
    ]('checked');
    apps.setting.checkUpdate();
    // 加载已保存的蓝屏颜色
    var savedColor = getPanicColor();
    $('div.dp.advanced>div>input.panic-inp').val(savedColor);
    $('div.dp.advanced>div>.color.panic-color').css(
      'background-color',
      savedColor,
    );
  },
  page: (name: string) => {
    $('#win-setting>.page>.cnt.' + name).scrollTop(0);
    $('#win-setting>.page>.cnt.show').removeClass('show');
    $('#win-setting>.page>.cnt.' + name).addClass('show');
    $('#win-setting>.menu>list>a.check').removeClass('check');
    $('#win-setting>.menu>list>a.' + name).addClass('check');
    if (name === 'time') apps.setting.timePanel('overview');
  },
  timePanel: (name: string) => {
    const $time = $('#win-setting>.page>.cnt.time');
    $time.find('.time-panel.show').removeClass('show');
    $time.find('.time-panel.' + name).addClass('show');
    $time.scrollTop(0);
  },
  changeLanguage: (code: string) => {
    localStorage.setItem('lang', code);
    window.location.reload();
  },
  syncLanguageSelect: () => {
    const savedLanguage = localStorage.getItem('lang');
    const language = savedLanguage === 'en-US' ? 'en' : savedLanguage || 'auto';
    $('#win-setting .languageSelect').val(language);
  },
  theme_get: () => {
    $('#set-theme')
      .html(`<loading><svg width="30px" height="30px" viewBox="0 0 16 16">
            <circle cx="8px" cy="8px" r="7px" style="stroke:#7f7f7f50;fill:none;stroke-width:3px;"></circle>
            <circle cx="8px" cy="8px" r="7px" style="stroke:#2983cc;stroke-width:3px;"></circle></svg></loading>`);
    // 实时获取主题
    api('repos/tjy-gitnub/win12-theme/contents').then((res) => {
      res.json().then((cs) => {
        console.log(cs);
        cs.forEach((c: ThemeContentEntry) => {
          if (c.type == 'dir') {
            api(c.url, true).then((res) => {
              res.json().then((cnt) => {
                $('#set-theme').html('');
                cnt.forEach((cn: ThemeContentEntry) => {
                  if (cn.name == 'theme.json') {
                    $.getJSON(
                      'https://tjy-gitnub.github.io/win12-theme/' + cn.path,
                    ).then((inf: ThemeInfo) => {
                      // let infjs = inf;
                      if ($('#set-theme>loading').length)
                        $('#set-theme').html('');
                      $('#set-theme').append(
                        `<a class="a act" onclick="apps.setting.theme_set('${c.name}')" style="background-image:url('https://tjy-gitnub.github.io/win12-theme/${c.name}/view.jpg')">${c.name}</a>`,
                      );
                    });
                  }
                });
              });
            });
          }
        });
      });
    });
  },
  theme_set: (infp: string) => {
    api('repos/tjy-gitnub/win12-theme/contents/' + infp).then((res) => {
      res.json().then((cnt) => {
        // console.log('https://api.github.com/repos/tjy-gitnub/win12-theme/contents/' + infp);
        cnt.forEach((cn: ThemeContentEntry) => {
          if (cn.name == 'theme.json') {
            $.getJSON(
              'https://tjy-gitnub.github.io/win12-theme/' + cn.path,
            ).then((inf: ThemeInfo) => {
              let infjs = inf;
              cnt.forEach((fbg: ThemeContentEntry) => {
                console.log(fbg, infjs);
                if (fbg.name == infjs.bg) {
                  $(':root').css(
                    '--bgul',
                    `url('https://tjy-gitnub.github.io/win12-theme/${fbg.path}')`,
                  );
                  $(':root').css('--theme-1', infjs.color1);
                  $(':root').css('--theme-2', infjs.color2);
                  $(':root').css('--href', infjs.href);
                  // $('#set-theme').append(`<a class="a act" onclick="apps.setting.theme_set(\`(${inf})\`)" style="background-image:url('https://tjy-gitnub.github.io/win12-theme/${fbg.path}')">${c.name}</a>`);
                }
              });
            });
          }
        });
      });
    });
  },
  checkUpdate: async (manual = false) => {
    const $update = $('#win-setting>.page>.cnt.update');
    const $notice = $update.find('.update-main .notice');
    const $detail = $update.find('.update-main .detail');
    const $button = $update.find('.update-check');
    const $release = $update.find('.update-release');

    $release.addClass('disabled').removeAttr('onclick');

    if (!(window.win12Native && window.win12Native.isTauri())) {
      $notice.text('仅 Tauri App 可用');
      $detail.text('Windows 更新需要桌面版调用 GitHub 发布接口。');
      $button.addClass('disabled');
      return;
    }

    $button.addClass('disabled').text('正在检查...');
    $notice.text('正在检查更新...');
    $detail.text('正在连接 GitHub');

    try {
      const result =
        (await window.win12Native.checkAppUpdate()) as AppUpdateInfo;
      const currentVersion = result.current_version || '未知版本';
      const latestVersion = result.latest_version || '未知版本';
      const publishedAt = result.published_at
        ? new Date(result.published_at).toLocaleString()
        : '';
      const releaseText = result.latest_name || latestVersion;

      if (result.update_available) {
        $notice.text('有可用更新');
        $detail.text(
          `当前版本 ${currentVersion}，最新版本 ${latestVersion}${publishedAt ? `，发布于 ${publishedAt}` : ''}`,
        );
        $release
          .removeClass('disabled')
          .attr(
            'onclick',
            `window.open(${JSON.stringify(result.release_url)}, '_blank')`,
          )
          .find('div>p:first-child')
          .text(`获取 ${releaseText}`);
        $release
          .find('div>p:last-child')
          .text('打开 GitHub 最新发布页下载安装包');
      } else {
        $notice.text('你使用的是最新版本');
        $detail.text(
          `当前版本 ${currentVersion}，GitHub 最新版本 ${latestVersion}`,
        );
        $release.find('div>p:first-child').text('下载完整内容');
        $release.find('div>p:last-child').text('当前没有比本机更新的版本');
      }
    } catch (e) {
      $notice.text('无法检查更新');
      $detail.text(String(e));
    } finally {
      $button.removeClass('disabled').text(manual ? '重新检查' : '检查更新');
    }
  },
} as unknown as AppDefinition;

export default setting;
