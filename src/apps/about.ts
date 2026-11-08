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

interface GitHubContributor {
  login: string;
  html_url: string;
  avatar_url: string;
  contributions: number;
}

const about = {
  repo: () => {
    return isTauriApp()
      ? 'win12-online/win12-desktop'
      : 'Shawn-Yu-Dev/win12-online-ts';
  },
  contentSuffix: () => {
    return isTauriApp() ? 'tauri' : 'web';
  },
  init: () => {
    updateAboutAppEntrypoints();
    apps.about.page('about');
    if (!$(apps.about.contributorsSelector() + '>.a').length) apps.about.get();
    if (!$(apps.about.starSelector()).html().includes('刷新'))
      apps.about.get_star();
    if (isTauriApp() && !$('#ReleaseShowDesktop>details').length)
      apps.about.get_releases();
  },
  page: (name: string) => {
    const suffix = apps.about.contentSuffix();
    $('#win-about>.cnt').removeClass('show');
    $(`#win-about>.${name}-${suffix}`).addClass('show');
    $('.about-menu>a').removeClass('check');
    $(`.about-menu>.${name}`).addClass('check');
  },
  contributorsSelector: () => {
    return isTauriApp() ? '#contri-desktop' : '#contri';
  },
  starSelector: () => {
    return isTauriApp() ? '#StarShowDesktop' : '#StarShow';
  },
  run_loading: (expr: string) => {
    $(expr).html(`<loading><svg width="30px" height="30px" viewBox="0 0 16 16">
            <circle cx="8px" cy="8px" r="7px" style="stroke:#7f7f7f50;fill:none;stroke-width:3px;"></circle>
            <circle cx="8px" cy="8px" r="7px" style="stroke:#2983cc;stroke-width:3px;"></circle></svg></loading>`);
  },
  escape_html: (text: string) => {
    return String(text || '').replace(
      /[&<>"']/g,
      (ch) =>
        ({
          '&': '&' + 'amp;',
          '<': '&' + 'lt;',
          '>': '&' + 'gt;',
          '"': '&' + 'quot;',
          "'": '&#39;',
        })[ch],
    );
  },
  render_release_body: (body: string) => {
    const text = body || '此发行版没有填写发行日志。';
    if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
      const html = marked.parse(text);
      return DOMPurify.sanitize(html);
    }
    return apps.about.escape_html(text).replace(/\n/g, '<br>');
  },
  get_releases: () => {
    apps.about.run_loading('#ReleaseShowDesktop');
    fetch('https://api.github.com/repos/win12-online/win12-desktop/releases')
      .then((response) => response.json())
      .then((releases) => {
        setTimeout(() => {
          $('#ReleaseShowDesktop').html('');
          if (!Array.isArray(releases) || releases.length == 0) {
            $('#ReleaseShowDesktop').html(
              '<p>&emsp;&emsp;暂无发行版发行日志。</p><a class="button" onclick="apps.about.get_releases()"><i class="bi bi-arrow-clockwise"></i> 刷新</a>',
            );
            return;
          }
          releases.forEach((release, index) => {
            const title = apps.about.escape_html(
              release.name || release.tag_name || '未命名发行版',
            );
            const tag = release.tag_name
              ? `<span>${apps.about.escape_html(release.tag_name)}</span> `
              : '';
            const date = release.published_at
              ? ` ${apps.about.escape_html(new Date(release.published_at).toLocaleDateString())}`
              : '';
            const body = apps.about.render_release_body(release.body);
            $('#ReleaseShowDesktop').append(
              `<details ${index == 0 ? 'open' : ''}><summary>${tag}${title}${date}</summary><div class="release-body">${body}</div></details>`,
            );
          });
          $('#ReleaseShowDesktop').append(
            '<a onclick="window.open(\'https://github.com/win12-online/win12-desktop/releases\',\'_blank\');" win12_title="https://github.com/win12-online/win12-desktop/releases" class="a jump" style="text-align: center;">更多</a>',
          );
        }, 200);
      })
      .catch((error) => {
        console.error('获取发行版发行日志时出错：', error);
        $('#ReleaseShowDesktop').html(
          '<div style="display: flex;"><p>&emsp;&emsp;哎呀！出错了！</p>&emsp;<a class="button" onclick="apps.about.get_releases()"><i class="bi bi-arrow-clockwise"></i> 重试</a></div>',
        );
      });
  },
  get: () => {
    const selector = apps.about.contributorsSelector();
    apps.about.run_loading(selector);
    // 实时获取项目贡献者
    $.get(
      `https://api.github.com/repos/${apps.about.repo()}/contributors?per_page=100`,
    ).then((cs) => {
      setTimeout(() => {
        $(selector).html('');
        cs.forEach((c: GitHubContributor) => {
          $(selector).append(
            `<a class="a" title="${c['login']}" onclick="window.open('${c['html_url']}','_blank');"><img class="avatar" src="${c['avatar_url']}" alt="${c['login']}"><span class="info"><p class="name">${c['login']}</p><p class="cbs">贡献 <span class="num">${c['contributions']}</span></p></span></a>`,
          );
        });
        $(selector).append(
          '<a class="button" onclick="apps.about.get()"><i class="bi bi-arrow-clockwise"></i> 刷新</a>',
        );
      }, 200);
    });
  },
  get_star: () => {
    const selector = apps.about.starSelector();
    apps.about.run_loading(selector);
    fetch(`https://api.github.com/repos/${apps.about.repo()}`)
      .then((response) => response.json())
      .then((data) => {
        setTimeout(() => {
          const starCount = data.stargazers_count;
          if (starCount === undefined) {
            apps.about.get_star_fail(selector);
            return;
          }
          $(selector).html(
            '<div style="display: flex;"><p>&emsp;&emsp;Star 数量：' +
              starCount +
              ' (实时数据)</p>&emsp;<a class="button" onclick="apps.about.get_star()"><i class="bi bi-arrow-clockwise"></i> 刷新</a></div>',
          );
        }, 200);
      })
      .catch((error) => {
        console.error('获取 star 数量时出错：', error);
        apps.about.get_star_fail(selector);
      });
  },

  get_star_fail: (selector: string) => {
    setTimeout(() => {
      $(selector).html(
        '<div style="display: flex;"><p>&emsp;&emsp;Star 数量：获取失败</p>&emsp;<a class="button" onclick="apps.about.get_star()"><i class="bi bi-arrow-clockwise"></i> 重试</a></div>',
      );
    }, 200);
  },
} as unknown as AppDefinition;

export default about;
