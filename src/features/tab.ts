import { $, page } from '../core/dom';
import { apps } from '../core/app-registry';
import { hidewin, focwin, isTouchEvent } from '../core/windows';

export type TabEntry = [string | number, string];

interface TabApp {
  tabs: TabEntry[];
  len: number;
  now: number;
  settab(tab: TabEntry, index: number): string;
  tab(index: number, load?: boolean): void;
}

function tabApp(name: string): TabApp {
  return apps[name] as TabApp;
}

export const m_tab = {
  closing: new WeakSet<TabEntry>(),
  newtab: (appn: string, n: string): void => {
    let app = tabApp(appn);
    app.tabs.push([app.len++, n]);
    m_tab.settabs(appn);
  },
  settabs: (appn: string): void => {
    let app = tabApp(appn);
    let html = '';
    for (let i = 0; i < app.tabs.length; i++) {
      const t = app.tabs[i];
      html += app.settab(t, i);
    }
    $(`.window.${appn}>.titbar>.tabs`)[0].innerHTML = html;
    $(`.window.${appn}>.titbar>.tabs`)[0].innerHTML +=
      `<a class="new bi bi-plus" onclick="apps.${appn}.newtab()"></a>`;
    // $(`.window.${appn}>.titbar>.tabs>.tab.`+app.tabs[app.now][0]).addClass('show');
  },
  moving: (
    appn: string,
    t: HTMLElement,
    ev: MouseEvent | TouchEvent,
    np: number,
  ): void => {
    let app = tabApp(appn);
    let deltaLeft = 0,
      pos = np;
    if (isTouchEvent(ev)) {
      deltaLeft = ev.touches[0].clientX;
    } else {
      deltaLeft = ev.clientX;
    }
    function move_f(this: HTMLElement, e: MouseEvent | TouchEvent): void {
      let x = 0;
      if (isTouchEvent(e)) {
        x = e.touches[0].clientX;
      } else {
        x = e.clientX;
      }
      $(this).css('transform', `translateX(${x - deltaLeft}px)`);
      pos = Math.floor(
        (this.offsetLeft + x - deltaLeft - 36 + this.offsetWidth / 2) /
          this.offsetWidth,
      );
      if (pos > app.tabs.length - 1) {
        pos = app.tabs.length - 1;
      }
      $(`.window.${appn}>.titbar>.tabs>.tab.left`).removeClass('left');
      $(`.window.${appn}>.titbar>.tabs>.tab.right`).removeClass('right');
      if (np < pos) {
        for (let i = np + 1; i <= pos; i++) {
          const ta = app.tabs[i];
          if (ta) {
            $(`.window.${appn}>.titbar>.tabs>.tab.` + ta[0]).addClass('left');
          }
        }
      } else if (np > pos) {
        for (let i = pos; i < np; i++) {
          const ta = app.tabs[i];
          if (ta) {
            $(`.window.${appn}>.titbar>.tabs>.tab.${ta[0]}`).addClass('right');
          }
        }
      }
    }
    page.onmousemove = move_f.bind(t);
    page.ontouchmove = move_f.bind(t);

    function up_f(this: HTMLElement, e: MouseEvent | TouchEvent): void {
      page.onmousemove = null;
      page.onmouseup = null;
      page.ontouchmove = null;
      page.ontouchend = null;
      page.ontouchcancel = null;
      // let x;
      // if (e.type.match('mouse')) {
      //     x = e.clientX;
      // }else if (e.type.match('touch')) {
      //     x = e.touches[0].clientX
      // }
      // pos = Math.floor((this.offsetLeft + x - deltaLeft - 36 + (this.offsetWidth / 2)) / this.offsetWidth);
      if (pos > app.tabs.length - 1) {
        pos = app.tabs.length - 1;
      }
      if (pos == np || pos > app.tabs.length || pos < 0) {
        $(this).css('transform', 'none');
        $(this).removeClass('moving');
        $(`.window.${appn}>.titbar>.tabs>.tab.left`).removeClass('left');
        $(`.window.${appn}>.titbar>.tabs>.tab.right`).removeClass('right');
      } else {
        app.tabs.splice(np < pos ? pos + 1 : pos, 0, app.tabs[np]);
        app.tabs.splice(np < pos ? np : np + 1, 1);
        m_tab.settabs(appn);
        // console.log('pos:',pos);
        m_tab.tab(appn, pos);
      }
    }
    page.onmouseup = up_f.bind(t);
    page.ontouchend = up_f.bind(t);
    page.ontouchcancel = up_f.bind(t);
    $(t).addClass('moving');
  },
  close: (appn: string, c: number): void => {
    let app = tabApp(appn);
    const tab = app.tabs[c];
    if (!tab || m_tab.closing.has(tab)) {
      return;
    }
    const tabId = tab[0];
    m_tab.closing.add(tab);
    $(`.window.${appn}>.titbar>.tabs>.tab.${tabId}`).addClass('close');
    for (let i = c + 1; i < app.tabs.length; i++) {
      const _id = app.tabs[i][0];
      $(`.window.${appn}>.titbar>.tabs>.tab.${_id}`).addClass('left');
    }
    setTimeout(() => {
      const currentIndex = app.tabs.findIndex(
        (current: TabEntry) => current[0] == tabId,
      );
      if (currentIndex < 0 || app.tabs[currentIndex] !== tab) {
        m_tab.closing.delete(tab);
        return;
      }
      $(`#win-${appn}>iframe.${tabId}`).remove();
      app.tabs.splice(currentIndex, 1);
      m_tab.closing.delete(tab);
      m_tab.settabs(appn);
      if (app.tabs.length == 0) {
        hidewin(appn);
      } else {
        m_tab.tab(appn, app.tabs.length - 1);
      }
    }, 200);
  },
  tab: (appn: string, c: number, load = true): void => {
    focwin(appn);
    let app = tabApp(appn);
    app.now = c;
    app.tab(c, load);
    $(`.window.${appn}>.titbar>.tabs>.tab.show`).removeClass('show');
    $(`.window.${appn}>.titbar>.tabs>.tab.${app.tabs[c][0]}`).addClass('show');
  },
  rename: (appn: string, n: string): void => {
    let app = tabApp(appn);
    app.tabs[app.now][1] = n;
    m_tab.settabs(appn);
    m_tab.tab(appn, app.now, false);
  },
};
