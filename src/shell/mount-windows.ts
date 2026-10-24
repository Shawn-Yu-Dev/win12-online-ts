import { windowMarkup } from '../data/window-templates';

const host = document.getElementById('window-mount');
if (host) {
  host.insertAdjacentHTML('beforebegin', windowMarkup);
  host.remove();
} else {
  console.error('mount-windows: 找不到 #window-mount 占位元素');
}
