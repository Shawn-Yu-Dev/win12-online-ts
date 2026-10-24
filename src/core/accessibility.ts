import { byId } from './dom';

export function isVisibleBlockingLayer(
  element: Element | null | undefined,
): boolean {
  if (!element) return false;
  const style = getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    element.getClientRects().length > 0
  );
}

export function getHighestBlockingLayer(): HTMLElement | null {
  const noticeBack = byId('notice-back');
  if (noticeBack && noticeBack.classList.contains('show')) return noticeBack;
  for (const id of ['loadback', 'orientation-warning', 'loginback']) {
    const element = byId(id);
    if (isVisibleBlockingLayer(element)) return element;
  }
  return null;
}

export function getBlockingLayerFocusable(
  layer: HTMLElement | null,
): HTMLElement[] {
  if (!layer) return [];
  return [
    ...layer.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), a[href], select:not([disabled]), ' +
        'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter(isVisibleBlockingLayer);
}

export function focusHighestBlockingLayer(): void {
  const layer = getHighestBlockingLayer();
  if (!layer || layer.id === 'notice-back' || layer.id === 'loadback') return;
  const focusable = getBlockingLayerFocusable(layer);
  (focusable[0] || layer).focus({ preventScroll: true });
}

export function handleBlockingLayerKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Tab') return;
  const layer = getHighestBlockingLayer();
  if (!layer || layer.id === 'notice-back') return;
  if (layer.id === 'loadback') {
    event.preventDefault();
    return;
  }
  const focusable = getBlockingLayerFocusable(layer);
  if (!focusable.length) {
    event.preventDefault();
    layer.focus({ preventScroll: true });
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!layer.contains(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus({ preventScroll: true });
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
}

function handleBlockingLayerFocus(event: FocusEvent): void {
  const layer = getHighestBlockingLayer();
  if (!layer || layer.id === 'notice-back' || layer.id === 'loadback') return;
  if (!layer.contains(event.target as Node)) focusHighestBlockingLayer();
}

export function initAccessibility(): void {
  document.addEventListener('keydown', handleBlockingLayerKeydown, true);
  document.addEventListener('focusin', handleBlockingLayerFocus, true);
}
