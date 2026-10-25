import { $ } from '../core/dom';
import { apps } from '../core/app-registry';

export interface HistoryStack {
  history: Record<number, string[]>;
  historypt: Record<number, number>;
  initHistory(tab: number): void;
  pushHistory(tab: number, url: string): void;
  topHistory(tab: number): string;
  popHistory(tab: number): string;
  incHistory(tab: number): string;
  delHistory(tab: number): void;
  historyIsEmpty(tab: number): boolean;
  historyIsFull(tab: number): boolean;
  checkHistory(tab: number): void;
  back(tab: number): void;
  front(tab: number): void;
}

interface HistoryApp extends HistoryStack {
  goto(url: string, load?: boolean): void;
}

export function createHistoryStack(
  appName: string,
  backSel: string,
  frontSel: string,
): HistoryStack {
  const self = () => apps[appName] as unknown as HistoryApp;
  return {
    history: [],
    historypt: [],
    initHistory: (tab) => {
      const a = self();
      a.history[tab] = [];
      a.historypt[tab] = -1;
    },
    pushHistory: (tab, u) => {
      const a = self();
      a.history[tab].push(u);
      a.historypt[tab]++;
    },
    topHistory: (tab) => {
      const a = self();
      return a.history[tab][a.historypt[tab]];
    },
    popHistory: (tab) => {
      const a = self();
      a.historypt[tab]--;
      return a.history[tab][a.historypt[tab]];
    },
    incHistory: (tab) => {
      const a = self();
      a.historypt[tab]++;
      return a.history[tab][a.historypt[tab]];
    },
    delHistory: (tab) => {
      const a = self();
      a.history[tab].splice(
        a.historypt[tab] + 1,
        a.history[tab].length - 1 - a.historypt[tab],
      );
    },
    historyIsEmpty: (tab) => self().historypt[tab] <= 0,
    historyIsFull: (tab) => {
      const a = self();
      return a.historypt[tab] >= a.history[tab].length - 1;
    },
    checkHistory: (tab) => {
      const a = self();
      $(backSel)[a.historyIsEmpty(tab) ? 'addClass' : 'removeClass'](
        'disabled',
      );
      $(frontSel)[a.historyIsFull(tab) ? 'addClass' : 'removeClass'](
        'disabled',
      );
    },
    back: (tab) => {
      const a = self();
      a.goto(a.popHistory(tab), false);
      a.checkHistory(tab);
    },
    front: (tab) => {
      const a = self();
      a.goto(a.incHistory(tab), false);
      a.checkHistory(tab);
    },
  };
}

export function createWebapp(id: string, src: string) {
  return {
    init: (): void => {},
    load: () => {
      const container = document.getElementById('win-' + id);
      if (!container || container.querySelector(':scope > iframe')) return;
      container.insertAdjacentHTML(
        'afterbegin',
        `<iframe src="${src}" frameborder="0" style="width: 100%; height: 100%;" loading="lazy"></iframe>`,
      );
    },
  };
}
