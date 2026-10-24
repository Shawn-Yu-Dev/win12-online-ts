import { $ } from '../core/dom';
import { state } from '../core/state';
import { setData } from '../core/utils';

// 个性化主题
export function toggletheme() {
  $('.dock.theme').toggleClass('dk');
  // var darkControl = $(`#control .btn4 .icon`)
  $(':root').toggleClass('dark');
  if ($(':root').hasClass('dark')) {
    $('.window.whiteboard>.titbar>p').text('Blackboard');
    setData('theme', 'dark');
    state.isDark = true;
    // darkControl.addClass('active')
  } else {
    $('.window.whiteboard>.titbar>p').text('Whiteboard');
    setData('theme', 'light');
    state.isDark = false;
    // darkControl.removeClass('active')
  }
}

export function initTheme(): void {
  // Only set theme based on system preference if no user preference is stored
  if (localStorage.getItem('theme') === null) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      //是深色
      $('.dock.theme').toggleClass('dk');
      $(':root').toggleClass('dark');
      $('.window.whiteboard>.titbar>p').text('Blackboard');
      localStorage.setItem('theme', 'dark');
      state.isDark = true;
    } else {
      // 不是深色
      $('.window.whiteboard>.titbar>p').text('Whiteboard');
      localStorage.setItem('theme', 'light');
    }
  }
}

export const WEBGL_MODES = ['off', 'partial', 'full'];
export const WEBGL_MODE_TEXT = { off: '关闭', partial: '部分', full: '全部' };

/**
 * Reflect the mode that is ACTUALLY rendering in the settings control.
 * win12WebGL.apply() may fall back to 'off' (no WebGL support, context
 * refused, shader failure), and leaving the requested mode highlighted would
 * tell the user something is on when it is not.
 * @param {string} requested mode the user asked for
 * @param {string} actual mode that is running
 */
export function paintWebGLMode(requested, actual) {
  const selector = document.getElementById('webgl-mode');
  if (selector) {
    // Modes are displayed directly by the segmented control.
    selector
      .querySelectorAll<HTMLElement>('[role="radio"]')
      .forEach((option) => {
        const on = option.dataset.value === actual;
        option.classList.toggle('selected', on);
        option.setAttribute('aria-checked', on ? 'true' : 'false');
        option.tabIndex = on ? 0 : -1;
      });
  }
  const hint = document.getElementById('webgl-mode-hint');
  if (!hint) return;
  if (requested !== actual) {
    hint.textContent = `此设备无法启用 WebGL，已回退为「${WEBGL_MODE_TEXT[actual]}」渲染。`;
    hint.classList.add('warn');
  } else {
    hint.textContent =
      actual === 'off'
        ? '当前使用普通 DOM 渲染。'
        : `WebGL 已启用（${WEBGL_MODE_TEXT[actual]}）。`;
    hint.classList.remove('warn');
  }
}

// Settings file writes are serialised: two quick toggles used to race in a
// read-modify-write and could drop the other setting.
let webglSettingsWrite = Promise.resolve();

export function saveWebGLModeToNative(mode) {
  const native = window.win12Native;
  if (!native || !native.isTauri || !native.isTauri()) return;
  webglSettingsWrite = webglSettingsWrite
    .then(() => native.readSettings())
    .then((json) => {
      const settings = json ? JSON.parse(json) : {};
      if (settings.webgl === mode) return undefined; // already saved
      settings.webgl = mode;
      return native.writeSettings(settings);
    })
    .catch((e) => console.error('Failed to save WebGL setting:', e));
}

/**
 * Apply a WebGL mode.
 * @param {string} mode requested mode
 * @param {{silent?: boolean}} [opts] silent: apply without writing settings
 * @returns {string} the mode that is actually running
 */
export function setWebGLMode(mode, opts: any = {}) {
  if (!WEBGL_MODES.includes(mode)) mode = 'off';
  const actual = window.win12WebGL ? window.win12WebGL.apply(mode) : mode;
  paintWebGLMode(mode, actual);
  if (!(opts && opts.silent)) saveWebGLModeToNative(mode);
  return actual;
}

export function loadWebGLMode() {
  // Boot: apply exactly once, and do not write the settings file back on
  // every launch (that is also a read-modify-write race with the Tauri
  // settings sync that runs around the same time).
  const mode = localStorage.getItem('webgl-mode') || 'off';
  setWebGLMode(mode, { silent: true });
}

// Arrow keys move the segmented control; the options are radios, so the
// checked one is the tab stop (roving tabindex).
document.addEventListener('keydown', (event) => {
  const box =
    event.target instanceof Element
      ? event.target.closest('#webgl-mode')
      : null;
  if (!box) return;
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  const options = [...box.querySelectorAll('[role="radio"]')];
  const current = options.findIndex((o) => o.classList.contains('selected'));
  const step = event.key === 'ArrowRight' ? 1 : -1;
  const next = options[
    Math.max(0, Math.min(options.length - 1, current + step))
  ] as HTMLElement;
  if (!next || next === options[current]) return;
  event.preventDefault();
  setWebGLMode(next.dataset.value);
  next.focus();
});

// Rendering can fall back while running (context lost, repeated frame errors).
document.addEventListener('win12:webgl-fallback', () => {
  const actual = window.win12WebGL ? window.win12WebGL.getMode() : 'off';
  paintWebGLMode(localStorage.getItem('webgl-mode') || 'off', actual);
});
