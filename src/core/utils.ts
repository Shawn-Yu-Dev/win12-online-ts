import $ from 'jquery';

export function setData(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function decodeHtml(s: string): string {
  $('#translater').text(s);
  return ($('#translater').html() || '')
    .replace(/\n/g, '<br>')
    .replace(/ /g, '&nbsp;');
}

export function calcTimeString(second: number): string {
  let result = '';
  const days = Math.floor(second / (24 * 60 * 60));
  const hours = Math.floor((second % (24 * 60 * 60)) / 3600);
  const minutes = Math.floor((second % 3600) / 60);
  const seconds = second % 60;
  if (days > 0) result += ' ' + days + ' 天';
  if (hours > 0) result += ' ' + hours + ' 小时';
  if (minutes > 0) result += ' ' + minutes + ' 分钟';
  if (seconds > 0) result += ' ' + seconds + ' 秒';
  return result === '' ? ' 0 秒' : result;
}

export function getPanicColor(): string {
  return localStorage.getItem('panic-color') || '#136fca';
}

export async function setPanicColor(color: string): Promise<void> {
  const native = window.win12Native;
  if (native && native.isTauri && native.isTauri()) {
    try {
      const json = await native.readSettings();
      const settings = json ? JSON.parse(json) : {};
      settings['panic-color'] = color;
      await native.writeSettings(settings);
    } catch (e) {
      console.error('Failed to save panic color to Tauri settings:', e);
    }
  }
  localStorage.setItem('panic-color', color);
}
