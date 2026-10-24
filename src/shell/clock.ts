import { $ } from '../core/dom';
import { langcode } from '../core/i18n';

const now = new Date();

const dateText =
  {
    'zh-CN': `星期${['日', '一', '二', '三', '四', '五', '六'][now.getDay()]}, ${now.getFullYear()}年${(now.getMonth() + 1).toString().padStart(2, '0')}月${now.getDate().toString().padStart(2, '0')}日`,
    'zh-TW': `星期${['日', '一', '二', '三', '四', '五', '六'][now.getDay()]}, ${now.getFullYear()}年${(now.getMonth() + 1).toString().padStart(2, '0')}月${now.getDate().toString().padStart(2, '0')}日`,
    en: `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()]}, ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()]} ${now.getDate().toString().padStart(2, '0')}, ${now.getFullYear()}`,
  }[langcode] || '';

function loadtime(): void {
  const d = new Date();
  const time = d.toLocaleTimeString();
  $('#startmenu-r>.row1>.tool>.time').text(time);
  $('.dock.date>.time').text(time);
  $('#datebox>.tit>.time').text(time);
  $('.settingTime').text(time);
}

function renderCalendar(): void {
  const d = new Date();
  const today = d.getDate();
  const start = 7 - ((d.getDate() - d.getDay()) % 7) + 1;
  const daysum = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const body = $('#datebox>.cont>.body')[0];
  for (let i = 1; i < start; i++) body.innerHTML += '<span></span>';
  for (let i = 1; i <= daysum; i++) {
    body.innerHTML += i == today ? `<p class="today">${i}</p>` : `<p>${i}</p>`;
  }
}

export function initClock(): void {
  $('#startmenu-r>.row1>.tool>.date').text(dateText);
  $('.dock.date>.date').text(
    `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`,
  );
  $('#datebox>.tit>.date').text(dateText);
  loadtime();
  renderCalendar();
  setTimeout(() => {
    loadtime();
    setInterval(loadtime, 1000);
  }, 1000 - now.getMilliseconds());
}

export { dateText, loadtime };
