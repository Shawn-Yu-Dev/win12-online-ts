import { $ } from '../core/dom';
import { apps } from '../core/app-registry';
import { lang, isTauriApp } from '../core/i18n';

// 控制面板 电量监测
export interface BatteryStatus {
  level: number;
  charging: boolean;
  addEventListener?: (type: 'levelchange', listener: () => void) => void;
}

export function setBatteryTooltip(title: string): void {
  const el = $('.a.dock.control')[0];
  if (el) {
    el.setAttribute('win12_title', title);
    el.setAttribute('title', title);
    el.setAttribute('aria-label', title);
  }
}

export function getBatteryTooltip(level: number, charging: boolean): string {
  const percent = Math.round(level * 100);
  const chargingText = charging ? lang('，正在充电', 'battery.charging') : '';
  return `${lang('电量：', 'battery.level')}${percent}%${chargingText}`;
}

export function setBatteryUnavailableTooltip(): void {
  setBatteryTooltip(lang('无法获取电量', 'battery.unavailable'));
}

export function initBatteryMonitor(): void {
  const nav = navigator as Navigator & {
    getBattery?: () => Promise<BatteryStatus>;
  };
  if (!isTauriApp() && nav.getBattery) {
    nav
      .getBattery()
      .then((battery: BatteryStatus) => {
        // 检查 battery 对象和 level 属性是否存在且有效
        if (
          battery &&
          typeof battery.level === 'number' &&
          !isNaN(battery.level)
        ) {
          const batteryLevel = Math.max(0, Math.min(1, battery.level)); // 确保在 0-1 范围内
          const batteryWidth = 18 * batteryLevel + 5;

          setBatteryTooltip(getBatteryTooltip(batteryLevel, battery.charging));

          const pathElement = $('.a.dock.control>svg>path')[0];
          if (pathElement) {
            pathElement.outerHTML = `<path
                    d="M 4 7 C 2.3550302 7 1 8.3550302 1 10 L 1 19 C 1 20.64497 2.3550302 22 4 22 L 24 22 C 25.64497 22 27 20.64497 27 19 L 27 10 C 27 8.3550302 25.64497 7 24 7 L 4 7 z M 4 9 L 24 9 C 24.56503 9 25 9.4349698 25 10 L 25 19 C 25 19.56503 24.56503 20 24 20 L 4 20 C 3.4349698 20 3 19.56503 3 19 L 3 10 C 3 9.4349698 3.4349698 9 4 9 z M 5 11 L 5 18 L ${batteryWidth} 18 L ${batteryWidth} 11 L 5 11 z M 28 12 L 28 17 L 29 17 C 29.552 17 30 16.552 30 16 L 30 13 C 30 12.448 29.552 12 29 12 L 28 12 z"
            id="path2" fill="#000000"
        />`;

            // 检查 addEventListener 是否存在
            if (
              battery.addEventListener &&
              typeof battery.addEventListener === 'function'
            ) {
              battery.addEventListener('levelchange', () => {
                if (
                  battery &&
                  typeof battery.level === 'number' &&
                  !isNaN(battery.level)
                ) {
                  const updatedLevel = Math.max(0, Math.min(1, battery.level));
                  const updatedWidth = 18 * updatedLevel + 5;

                  setBatteryTooltip(
                    getBatteryTooltip(updatedLevel, battery.charging),
                  );

                  const updatedPathElement = $('.a.dock.control>svg>path')[0];
                  if (updatedPathElement) {
                    updatedPathElement.outerHTML = `<path
                                    d="M 4 7 C 2.3550302 7 1 8.3550302 1 10 L 1 19 C 1 20.64497 2.3550302 22 4 22 L 24 22 C 25.64497 22 27 20.64497 27 19 L 27 10 C 27 8.3550302 25.64497 7 24 7 L 4 7 z M 4 9 L 24 9 C 24.56503 9 25 9.4349698 25 10 L 25 19 C 25 19.56503 24.56503 20 24 20 L 4 20 C 3.4349698 20 3 19.56503 3 19 L 3 10 C 3 9.4349698 3.4349698 9 4 9 z M 5 11 L 5 18 L ${updatedWidth} 18 L ${updatedWidth} 11 L 5 11 z M 28 12 L 28 17 L 29 17 C 29.552 17 30 16.552 30 16 L 30 13 C 30 12.448 29.552 12 29 12 L 28 12 z"
                id="path2" fill="#000000"
            />`;
                  }
                }
              });
            }
          }
        } else {
          setBatteryUnavailableTooltip();
        }
      })
      .catch((error: unknown) => {
        // 静默处理错误，电池 API 在某些浏览器中不可用是正常的
        console.log('电池 API 不可用：', error);
        setBatteryUnavailableTooltip();
      });
  } else if (!isTauriApp()) {
    setBatteryUnavailableTooltip();
  }
}

export function initCpuTimer(): void {
  if (localStorage.getItem('cpuRunningTime')) {
    apps.taskmgr.cpuRunningTime = localStorage.getItem('cpuRunningTime');
  }
  window.setInterval(() => {
    apps.taskmgr.cpuRunningTime++;
    localStorage.setItem('cpuRunningTime', apps.taskmgr.cpuRunningTime);
  }, 1000);
}
