import { $ } from '../core/dom';
import {
  focusHighestBlockingLayer,
  getHighestBlockingLayer,
  isVisibleBlockingLayer,
} from '../core/accessibility';

export function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

let orientationDismissed = false;
let orientationPreviousFocus = null;

export function checkOrientation() {
  if (orientationDismissed) return;
  const container = document.getElementById('orientation-warning');
  const isPortrait = window.matchMedia('(orientation: portrait)').matches;
  if (isMobileDevice() && isPortrait) {
    const wasVisible = isVisibleBlockingLayer(container);
    if (
      !wasVisible &&
      document.activeElement &&
      document.activeElement !== document.body
    ) {
      orientationPreviousFocus = document.activeElement;
    }
    container.style.display = 'flex';
    if (!wasVisible && getHighestBlockingLayer() === container) {
      focusHighestBlockingLayer();
    }
  } else {
    container.style.display = 'none';
  }
}

export function dismissOrientation() {
  orientationDismissed = true;
  document.getElementById('orientation-warning').style.display = 'none';
  if (
    orientationPreviousFocus &&
    orientationPreviousFocus.isConnected &&
    isVisibleBlockingLayer(orientationPreviousFocus) &&
    !orientationPreviousFocus.closest('#notice-back[inert]')
  ) {
    orientationPreviousFocus.focus({ preventScroll: true });
  }
  orientationPreviousFocus = null;
  focusHighestBlockingLayer();
}

// 监听屏幕方向变化
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);

export function initOrientation(): void {
  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
}
