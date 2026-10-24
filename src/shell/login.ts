import { $ } from '../core/dom';
import { withTimeout } from '../core/async';
import { state } from '../core/state';
import { shownotice } from './notices';

let loginPasswordHasPassword = false;
let loginPasswordStatus = 'pending';
let loginFinishing = false;
let startupNoticeShown = false;
export const LOGIN_BRIDGE_TIMEOUT_MS = 8000;

export function showStartupNoticeOnce() {
  if (startupNoticeShown) return;
  startupNoticeShown = true;
  shownotice('about');
}

function withLoginBridgeTimeout<T>(
  promise: PromiseLike<T> | T,
  message: string,
): Promise<T> {
  return withTimeout(promise, LOGIN_BRIDGE_TIMEOUT_MS, message);
}

export function isNativeLoginEnvironment() {
  try {
    if (
      window.win12Native &&
      typeof window.win12Native.isTauri == 'function' &&
      window.win12Native.isTauri()
    )
      return true;
  } catch (e) {}
  return !!(window.__TAURI__ && window.__TAURI__.core);
}

export function requireLoginBridge(method) {
  if (!window.win12Native || typeof window.win12Native[method] != 'function') {
    throw new Error('本地密码服务尚未就绪');
  }
  return window.win12Native;
}

export function win12FinishLogin() {
  if (loginFinishing) return;
  loginFinishing = true;
  setLoginError('');
  $('#login').prop('disabled', true);
  $('#login-password').prop('disabled', true);
  $('#login').css('opacity', '0');
  $('#login-password').css('opacity', '0');
  $('#login-error').css('opacity', '0');
  $('#login-welc').css('opacity', '1');
  setTimeout(() => {
    $('#loginback').addClass('close');
    setTimeout(() => {
      $('#loginback').css('opacity', '0');
    }, 500);
    setTimeout(() => {
      $('#loginback').css('display', 'none');
      showStartupNoticeOnce();
    }, 2000);
    if (state.useMusic) {
      (
        document.querySelector('audio#startup-music') as HTMLAudioElement
      ).play();
    }
  }, 2000);
}

export function setLoginError(text) {
  $('#login-error').text(text);
}

export async function initLoginPassword() {
  const isNative = isNativeLoginEnvironment();
  if (
    isNative &&
    new URL(location.href).searchParams.get('skip_login') !== '1'
  ) {
    loginPasswordStatus = 'pending';
    $('#loginback').addClass('tauri-password');
    $('#login-password').prop('disabled', true);
    setLoginError('正在读取本地密码状态');
    try {
      const status = await withLoginBridgeTimeout(
        requireLoginBridge('getLoginPasswordStatus').getLoginPasswordStatus(),
        '读取本地密码状态超时',
      );
      if (!status || typeof status.has_password != 'boolean') {
        throw new Error('本地密码状态响应无效');
      }
      loginPasswordHasPassword = status.has_password;
      loginPasswordStatus = loginPasswordHasPassword
        ? 'has-password'
        : 'no-password';
      if (loginPasswordHasPassword) {
        $('#loginback').addClass('tauri-password');
        $('#login-password')
          .prop('disabled', false)
          .attr('placeholder', '密码');
        setLoginError('');
        $('#login-password').focus();
      } else {
        $('#loginback').removeClass('tauri-password');
      }
    } catch (e) {
      loginPasswordStatus = 'error';
      setLoginError('无法读取本地密码状态');
    } finally {
      $('#login').css('pointer-events', 'auto');
    }
  } else {
    loginPasswordStatus = 'not-required';
  }
}

export async function win12LoginSubmit() {
  if (!isNativeLoginEnvironment()) {
    win12FinishLogin();
    return;
  }

  if (loginPasswordStatus == 'pending') {
    setLoginError('正在读取本地密码状态');
    return;
  }
  if (loginPasswordStatus == 'error') {
    await initLoginPassword();
    if (loginPasswordStatus == 'error' || loginPasswordStatus == 'pending')
      return;
  }
  if (
    loginPasswordStatus == 'no-password' ||
    loginPasswordStatus == 'not-required'
  ) {
    win12FinishLogin();
    return;
  }
  if (loginPasswordStatus != 'has-password') return;

  const password = $('#login-password').val();
  if (!password) {
    setLoginError('请输入密码');
    $('#login-password').focus();
    return;
  }

  $('#login').css('pointer-events', 'none');
  setLoginError('正在验证');

  try {
    const result = await withLoginBridgeTimeout(
      requireLoginBridge('verifyLoginPassword').verifyLoginPassword(password),
      '验证密码超时',
    );
    if (
      result &&
      !Array.isArray(result) &&
      typeof result == 'object' &&
      result.ok === true
    ) {
      $('#login-password').val('');
      win12FinishLogin();
      return;
    }
    setLoginError('密码错误');
    $('#login-password').val('').focus();
  } catch (e) {
    setLoginError(String(e));
  } finally {
    $('#login').css('pointer-events', 'auto');
  }
}

export async function win12RefreshPasswordSettingStatus() {
  if (!isNativeLoginEnvironment()) {
    $('#setting-password-status').text('仅 Tauri App 可用');
    $('#setting-password-current').hide();
    $('#setting-password-new').prop('disabled', true);
    $('#setting-password-submit').addClass('disabled');
    return;
  }

  try {
    const status = await withLoginBridgeTimeout(
      requireLoginBridge('getLoginPasswordStatus').getLoginPasswordStatus(),
      '读取本地密码状态超时',
    );
    if (!status || typeof status.has_password != 'boolean') {
      throw new Error('本地密码状态响应无效');
    }
    loginPasswordHasPassword = status.has_password;
    loginPasswordStatus = loginPasswordHasPassword
      ? 'has-password'
      : 'no-password';
    $('#setting-password-status').text(
      loginPasswordHasPassword ? '已设置密码' : '未设置密码',
    );
    $('#setting-password-current')[
      loginPasswordHasPassword ? 'show' : 'hide'
    ]();
    $('#setting-password-current').val('');
    $('#setting-password-new').val('').prop('disabled', false);
    $('#setting-password-new').attr(
      'placeholder',
      loginPasswordHasPassword ? '新密码（留空清除密码）' : '新密码',
    );
    $('#setting-password-submit').removeClass('disabled');
  } catch (e) {
    loginPasswordStatus = 'error';
    $('#setting-password-status').text(String(e));
    $('#setting-password-new').prop('disabled', true);
    $('#setting-password-submit').addClass('disabled');
  }
}

export async function win12SetLoginPassword() {
  if (!isNativeLoginEnvironment()) {
    $('#setting-password-status').text('仅 Tauri App 可用');
    return;
  }
  if (
    loginPasswordStatus != 'has-password' &&
    loginPasswordStatus != 'no-password'
  ) {
    $('#setting-password-status').text('请先重新读取密码状态');
    await win12RefreshPasswordSettingStatus();
    return;
  }

  const currentPassword = $('#setting-password-current').val();
  const newPassword = $('#setting-password-new').val();
  if (!loginPasswordHasPassword && !newPassword) {
    $('#setting-password-status').text('请输入新密码');
    $('#setting-password-new').focus();
    return;
  }
  if (loginPasswordHasPassword && !currentPassword) {
    $('#setting-password-status').text('请输入当前密码');
    $('#setting-password-current').focus();
    return;
  }

  $('#setting-password-submit').addClass('disabled');
  const clearingPassword = loginPasswordHasPassword && !newPassword;
  $('#setting-password-status').text(
    clearingPassword ? '正在清除' : '正在保存',
  );

  try {
    await withLoginBridgeTimeout(
      requireLoginBridge('setLoginPassword').setLoginPassword(
        loginPasswordHasPassword ? currentPassword : null,
        newPassword,
      ),
      '保存本地密码超时',
    );
    await win12RefreshPasswordSettingStatus();
    $('#setting-password-status').text(
      clearingPassword ? '密码已清空' : '密码已保存',
    );
  } catch (e) {
    $('#setting-password-status').text(String(e));
  } finally {
    $('#setting-password-submit').removeClass('disabled');
  }
}

export function toggleLoginLanguage() {
  const $box = $('#login-language-box');
  const $button = $('.language-dock');
  if ($box.hasClass('show')) {
    $box.removeClass('show');
    $button.attr('aria-expanded', 'false');
    setTimeout(() => $box.removeClass('show-begin'), 300);
  } else {
    $box.addClass('show-begin');
    $button.attr('aria-expanded', 'true');
    setTimeout(() => $box.addClass('show'), 0);
  }
}
