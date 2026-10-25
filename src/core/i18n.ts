import $ from 'jquery';
import { langc } from '../data/languages';
import '../vendor/jquery.i18n.properties';

export function i18nOrNull(key?: string | null): string | null {
  if (!key) return null;
  const value = $.i18n.prop(key);
  if (value === undefined || value === null) return null;
  if (value === '[' + key + ']') return null;
  return value;
}

function applyTranslations(): void {
  $('[data-i18n]').each(function () {
    const value = i18nOrNull($(this).data('i18n'));
    if (value !== null) $(this).html(value);
  });
  $('[data-i18n-attr]').each(function () {
    const value = i18nOrNull($(this).data('i18n-key'));
    if (value !== null) $(this).attr($(this).data('i18n-attr'), value);
  });
  updateAboutAppEntrypoints();
}

export function loadlang(code: string): void {
  $.i18n.properties({
    name: 'lang',
    path: 'lang/lang/',
    language: code,
    mode: 'map',
    callback: applyTranslations,
  });
}

function getDeviceLanguage(): string {
  const browserLanguage = navigator.language || '';
  return langc[browserLanguage] || langc[browserLanguage.toLowerCase()] || 'en';
}

const savedLanguage = localStorage.getItem('lang');
if (
  savedLanguage == 'hans' ||
  savedLanguage == 'zh_cn' ||
  savedLanguage == 'zh-cn' ||
  savedLanguage == 'en-US'
) {
  localStorage.setItem('lang', savedLanguage === 'en-US' ? 'en' : 'zh-CN');
}

export let langcode: string =
  localStorage.getItem('lang') || getDeviceLanguage();
if (langcode == 'auto') langcode = getDeviceLanguage();

document.documentElement.lang = langcode;

export let lang: (text: string, id?: string) => string =
  langcode == 'zh-CN'
    ? (text) => text
    : (text, id) => {
        const translated = i18nOrNull(id);
        return translated === null ? text : translated;
      };

const loginLanguageBox = $('#loginback>.langselect');
const storedLanguage = localStorage.getItem('lang');
if (storedLanguage == 'auto' || storedLanguage == null) {
  loginLanguageBox.children('.def').addClass('selected');
} else if (
  document.querySelectorAll('#loginback>.langselect>.' + langcode).length != 0
) {
  loginLanguageBox.children('.' + langcode).addClass('selected');
} else {
  loginLanguageBox.children('.en').addClass('selected');
}

if (langcode != 'zh-CN') loadlang(langcode);

export function isTauriApp(): boolean {
  const native = window.win12Native;
  return !!(
    (native && native.isTauri && native.isTauri()) ||
    (window.__TAURI__ && window.__TAURI__.core)
  );
}

export function getAboutAppTitle(): string {
  if (!isTauriApp()) return lang('关于 Win12 网页版', 'about.name');
  if (langcode == 'en') return 'About Win12-desktop';
  if (langcode == 'zh-TW') return '關於 Win12-desktop';
  return '关于 Win12-desktop';
}

export function updateAboutAppEntrypoints(): void {
  $('.about-app-title').text(getAboutAppTitle());
}

updateAboutAppEntrypoints();
