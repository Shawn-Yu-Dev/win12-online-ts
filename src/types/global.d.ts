export {};

import type { Calculator } from '../scripts/calculator';

declare global {
  interface Window {
    appCalculator?: Calculator;
    widgetCalculator?: Calculator;
    openapp?: (name: string, bypassPreOpenNotice?: boolean) => void;
    updateDock?: () => void;
    __nowPlayingWidgetMenuDotsInstalled?: boolean;
    toBIOS?: () => void;
  }

  interface JQueryI18nSettings {
    name?: string;
    language?: string;
    path?: string;
    namespace?: string | null;
    mode?: string;
    cache?: boolean;
    debug?: boolean;
    encoding?: string;
    async?: boolean;
    callback?: (() => void) | null;
    [key: string]: unknown;
  }

  interface JQueryI18nStatic {
    map: Record<string, Record<string, string>>;
    prop(key: string): string | undefined;
    properties(settings: JQueryI18nSettings): void;
  }

  interface JQueryStatic {
    i18n: JQueryI18nStatic;
  }

  /** Minimal surface of the `big.js` style constructor loaded by the page. */
  interface BigNumber {
    plus(value: BigNumber | string | number): BigNumber;
    minus(value: BigNumber | string | number): BigNumber;
    times(value: BigNumber | string | number): BigNumber;
    div(value: BigNumber | string | number): BigNumber;
    toString(): string;
  }

  interface AceSession {
    setMode(mode: string): void;
    getMode(): { $id?: string };
    getUseSoftTabs(): boolean;
    getTabSize(): number;
    setUseWrapMode(wrap: boolean): void;
  }

  interface AceEditor {
    setTheme(theme: string): void;
    setOptions(options: Record<string, unknown>): void;
    commands: { addCommand(command: unknown): void };
    gotoLine(line: number, column?: number, animate?: boolean): void;
    on(event: string, callback: () => void): void;
    selection: { on(event: string, callback: () => void): void };
    getCursorPosition(): { row: number; column: number };
    getSelectedText(): string;
    session: AceSession;
    setValue(value: string, cursorPos?: number): void;
    getValue(): string;
    setFontSize(size: number): void;
  }

  interface AceStatic {
    require(module: string): unknown;
    edit(id: string): AceEditor;
  }

  const Big: (value: string | number) => BigNumber;
  const Chart: new (
    context: CanvasRenderingContext2D,
    config: Record<string, unknown>,
  ) => unknown;
  const marked: { parse(text: string): string };
  const DOMPurify: { sanitize(html: string): string };
  const loadPyodide:
    undefined | (() => Promise<{ runPython(code: string): unknown }>);
  const ace: AceStatic;
}
