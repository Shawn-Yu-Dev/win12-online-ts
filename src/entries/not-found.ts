const browserLanguage = navigator.language || (navigator as any).userLanguage;
const translations: Record<string, Record<string, string>> = {
  'zh-CN': {
    title: '404 Not Found - Windows 12 网页版',
    info: '我们找不到您所请求的资源。',
    home: '返回主页',
  },
};
const messages = browserLanguage ? translations[browserLanguage] : undefined;

if (messages) {
  document.documentElement.lang = browserLanguage;
  for (const [id, text] of Object.entries(messages)) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  }
}
