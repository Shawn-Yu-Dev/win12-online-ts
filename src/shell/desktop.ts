import { $, page } from '../core/dom';
import { state } from '../core/state';
import { lang, getAboutAppTitle } from '../core/i18n';
import { setData } from '../core/utils';
import { isTouchEvent } from '../core/windows';
import { openapp } from './launcher';
import { showcm, addMenu } from './context-menu';
import { shownotice } from './notices';

export function saveDesktop(): void {
  const data = {
    desktop: JSON.stringify(state.desktopItems),
    topmost: JSON.stringify(state.topmost),
    sys_setting: JSON.stringify(state.sysSettings),
    root_class: $(':root').attr('class'),
  };

  Object.entries(data).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
}
//global
const parentEl = $('#desktop')[0];
const cell = 83; // 单位尺寸
const gap = 10; // 单位间隔
const padding = 20; // 偏移
// 原本这三个是 const，只在脚本执行期算一次，窗口 resize 后吸附网格就失效了。
// 改成每次拖拽开始时重算（不放在 mousemove 里，避免逐帧触发 layout）。
let parentRect: DOMRect, cols: number, rows: number;
export function refreshDesktopGrid(): void {
  parentRect = parentEl.getBoundingClientRect();
  cols = Math.max(
    1,
    Math.floor((parentRect.width - padding * 2 + gap) / (cell + gap)),
  );
  rows = Math.max(
    1,
    Math.floor((parentRect.height - padding * 2 + gap) / (cell + gap)),
  );
}
refreshDesktopGrid();

export function desktopMove(
  elt: HTMLElement,
  e: MouseEvent | TouchEvent,
): void {
  if (!state.editMode) return; // 编辑模式有效
  refreshDesktopGrid(); // 桌面尺寸可能已变，重算吸附网格
  // 阻止桌面响应
  try {
    e.stopPropagation();
  } catch (err) {}
  try {
    e.preventDefault();
  } catch (err) {}
  let rect = elt.getBoundingClientRect();
  let deltaLeft =
    (isTouchEvent(e) ? e.touches[0].clientX : e.clientX) - rect.left;
  let deltaTop =
    (isTouchEvent(e) ? e.touches[0].clientY : e.clientY) - rect.top;
  elt.style.position = 'fixed';
  elt.style.width = `${rect.width}px`;
  elt.style.height = `${rect.height}px`;
  elt.classList.add('moving');
  elt.classList.add('notrans');

  function moving(ev: MouseEvent | TouchEvent): void {
    let clientX = isTouchEvent(ev) ? ev.touches[0].clientX : ev.clientX;
    let clientY = isTouchEvent(ev) ? ev.touches[0].clientY : ev.clientY;

    let leftPx = clientX - deltaLeft;
    let topPx = clientY - deltaTop;
    // 与网格对齐
    //const parentRect = $('#desktop')[0].getBoundingClientRect();
    //const cell = 83; // 单位尺寸
    //const gap = 10; // 单位间隔
    //const padding = 20; // 偏移
    let relLeft = leftPx - parentRect.left - padding;
    let relTop = topPx - parentRect.top - padding;
    //const cols = Math.max(1, Math.floor((parentRect.width - padding * 2 + gap) / (cell + gap)));
    //const rows = Math.max(1, Math.floor((parentRect.height - padding * 2 + gap) / (cell + gap)));
    let col = Math.round(relLeft / (cell + gap));
    let row = Math.round(relTop / (cell + gap)); //近似是第几格
    if (col < 0) col = 0;
    if (col >= cols) col = cols - 1;
    if (row < 0) row = 0;
    if (row >= rows) row = rows - 1;
    const snapLeft = parentRect.left + padding + col * (cell + gap);
    const snapTop = parentRect.top + padding + row * (cell + gap);
    elt.style.left = `${snapLeft}px`;
    elt.style.top = `${snapTop}px`;
  }

  function up() {
    elt.classList.remove('notrans');
    elt.classList.remove('moving');
    document.body.style.userSelect = '';
    // 将固定坐标转换为相对于桌面的绝对位置
    //const parentRect = $('#desktop')[0].getBoundingClientRect();
    const left = parseFloat(elt.style.left || '0') - parentRect.left;
    const top = parseFloat(elt.style.top || '0') - parentRect.top;
    elt.style.position = 'absolute';
    elt.style.left = `${left}px`;
    // 存储网格坐标
    elt.setAttribute('data-grid-left', elt.style.left);
    elt.setAttribute('data-grid-top', elt.style.top);
    elt.style.top = `${top}px`;
    page.onmousemove = null;
    page.ontouchmove = null;
    page.onmouseup = null;
    page.ontouchend = null;
    page.ontouchcancel = null;
  }

  moving(e);
  // 不要出现选择框
  document.body.style.userSelect = 'none';
  page.onmousemove = moving;
  page.ontouchmove = moving;
  page.onmouseup = up;
  page.ontouchend = up;
  page.ontouchcancel = up;
}

export function attachDesktopDrag(): void {
  const parent = $('#desktop')[0] as HTMLElement;
  if (!parent) return;
  const children = (Array.from(parent.children) as HTMLElement[]).filter(
    (n) => n.tagName.toLowerCase() === 'div' || n.tagName.toLowerCase() === 'a',
  );
  children.forEach((ch) => {
    if (ch.dataset.desktopDragBound === 'true') return;
    ch.dataset.desktopDragBound = 'true';
    ch.ondragstart = () => false;
    const originalMouseDown = ch.onmousedown;
    const originalTouchStart = ch.ontouchstart;
    const touchFallback = ch.onclick || ch.ondblclick;
    ch.onmousedown = (e) => {
      if (!state.editMode) {
        return originalMouseDown ? originalMouseDown.call(ch, e) : undefined;
      }
      //防止桌面响应
      try {
        e.stopPropagation();
      } catch (err) {}
      try {
        e.preventDefault();
      } catch (err) {}
      desktopMove(ch, e);
      return false;
    };
    ch.ontouchstart = (e) => {
      if (!state.editMode) {
        if (originalTouchStart) return originalTouchStart.call(ch, e);
        // Some desktop Chromium builds do not expose ontouchstart as a
        // compiled DOM property even when the inline attribute exists.
        // Reuse the icon's normal click/double-click action in that case.
        if (touchFallback) {
          try {
            e.preventDefault();
          } catch (err) {}
          return touchFallback.call(ch, e);
        }
        return undefined;
      }
      try {
        e.stopPropagation();
      } catch (err) {}
      try {
        e.preventDefault();
      } catch (err) {}
      desktopMove(ch, e);
      return false;
    };
  });
}
export function readStoredArray<T = string>(key: string): T[] | null {
  const value = localStorage.getItem(key);
  if (value === null) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as T[];
  } catch (e) {}
  localStorage.removeItem(key);
  return null;
}
export function setIcon(): void {
  // return;
  let storedDesktop = readStoredArray<string>('desktop');
  if (storedDesktop === null) {
    storedDesktop = [];
    setData('desktop', '[]');
  }
  if (storedDesktop !== null) {
    $('#desktop')[0].innerHTML =
      `<div ondblclick="openapp('explorer');" ontouchstart="openapp('explorer');" oncontextmenu="return showcm(event,'desktop.icon',['explorer',-1]);" appname="explorer">
        <img src="apps/icons/explorer/thispc.svg">
        <p>${lang('此电脑', 'explorer.thispc')}</p>
    </div>
    <div class="b" ondblclick="openapp('setting');" ontouchstart="openapp('setting');" oncontextmenu="return showcm(event,'desktop.icon',['setting',-1]);" appname="setting">
        <img src="icon/setting.svg">
        <p>${lang('设置', 'setting.name')}</p>
    </div>
    <div class="b" ondblclick="openapp('about');" ontouchstart="openapp('about');" oncontextmenu="return showcm(event,'desktop.icon',['about',-1]);" appname="about">
        <img src="icon/about.svg">
        <p>${getAboutAppTitle()}</p>
    </div>
    <div class="b" ondblclick="openapp('edge');" ontouchstart="openapp('edge');" oncontextmenu="return showcm(event,'desktop.icon',['edge',-1]);" appname="edge">
        <img src="icon/edge.svg">
        <p>Microsoft Edge</p>
    </div>
    <div class="b" ondblclick="shownotice('feedback');" ontouchstart="shownotice('feedback');">
        <img src="icon/feedback.svg">
        <p>${lang('反馈中心', 'feedback.name')}</p>
    </div>
    <span class="selection">
    </span>
    <p style="background-color: rgba(11,45,14,0);z-index:1;position: absolute;top:0px;left:0px;height:100%;width:100%" oncontextmenu="return showcm(event,'desktop');"></p>`;
    state.desktopItems = storedDesktop;
    state.desktopItems.forEach((item) => {
      $('#desktop')[0].innerHTML += item;
    });
    addMenu();
  }
  const storedTopmost = readStoredArray<string>('topmost');
  if (storedTopmost !== null) {
    state.topmost = storedTopmost;
    if (state.topmost.includes('taskmgr')) {
      ($('#tsk-setting-topmost')[0] as HTMLInputElement).checked = true;
    }
  }
  const storedSystemSettings = readStoredArray<number>('sys_setting');
  if (storedSystemSettings !== null) {
    var sysSettingBack = storedSystemSettings;
    if (/^(1|0)+$/.test(sysSettingBack.join('')) /* 只含有 0 和 1 */) {
      state.sysSettings = sysSettingBack;
      for (var i = 0; i < state.sysSettings.length; i++) {
        document
          .getElementById('sys_setting_' + (i + 1))
          ?.setAttribute(
            'class',
            'a checkbox' + (state.sysSettings[i] ? ' checked' : ''),
          ); //设置class属性
        if (i == 5) {
          state.useMusic = state.sysSettings[i] ? true : false;
        }
        if (i == 6) {
          state.useMicVoice = state.sysSettings[i] ? true : false;
        }
      }
    }
  }
  if (localStorage.getItem('root_class')) {
    $(':root')[0].className =
      localStorage.getItem('root_class') + ' ' + (state.isDark ? 'dark' : '');
  }

  const root = $(':root');
  const cornerSupported = CSS.supports('corner-shape', 'squircle');
  const $cornerToggle = $('#sys_setting_1');
  const $cornerHint = $('#toggle-corner-squ>.corner-disabled-hint');
  if (!cornerSupported) {
    state.sysSettings[0] = 0;
    $cornerToggle.removeClass('checked').addClass('disabled');
    $cornerToggle.removeAttr('onclick');
    root.removeClass('corner_squ');
    const message = lang('浏览器不支持', 'setting.psnl.round-unav');
    if ($cornerHint.length) {
      $cornerHint.text(message);
    } else {
      $('#toggle-corner-squ').append(
        `<span class="corner-disabled-hint">${message}</span>`,
      );
    }
    saveDesktop();
  } else {
    $cornerHint.remove();
    if (state.sysSettings[0]) {
      root.addClass('corner_squ');
    } else {
      root.removeClass('corner_squ');
    }
  }
  attachDesktopDrag();
}
