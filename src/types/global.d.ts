export {};

declare global {
  interface Window {
    __TAURI__?: any;
    win12Native?: any;
    win12WebGL?: any;
    appCalculator?: any;
    widgetCalculator?: any;
    openapp?: any;
    [key: string]: any;
  }

  interface Navigator {
    getBattery?: () => Promise<any>;
  }

  interface JQueryStatic {
    i18n: any;
  }

  const Big: any;
  const Chart: any;
  const marked: any;
  const DOMPurify: any;
  const loadPyodide: any;
  const ace: any;
  const webkitSpeechRecognition: any;
  const SpeechRecognition: any;
}
