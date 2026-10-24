import { updateAboutAppEntrypoints } from '../core/i18n';

export interface LoginPasswordStatus {
  has_password: boolean;
}

export interface BatteryInfo {
  percent?: number;
  charging?: boolean;
}

type TauriInvoke = (
  command: string,
  args?: Record<string, unknown>,
) => Promise<any>;

interface TauriGlobal {
  core?: { invoke: TauriInvoke };
  event?: {
    listen: (
      event: string,
      handler: (event: any) => void,
    ) => Promise<() => void>;
  };
}

declare global {
  interface Window {
    __TAURI__?: TauriGlobal;
    win12Native?: any;
    win12WebGL?: any;
  }
}

const tauri = () => window.__TAURI__;

export const win12Native = {
  isTauri(): boolean {
    return !!(tauri() && tauri()!.core);
  },
  async getBatteryInfo(): Promise<BatteryInfo | null> {
    if (!this.isTauri()) return null;
    return tauri()!.core!.invoke('get_battery_info');
  },
  async getLoginPasswordStatus(): Promise<LoginPasswordStatus | null> {
    if (!this.isTauri()) return null;
    return tauri()!.core!.invoke('get_login_password_status');
  },
  async verifyLoginPassword(password: string): Promise<{ ok: boolean }> {
    if (!this.isTauri()) return { ok: true };
    return tauri()!.core!.invoke('verify_login_password', { password });
  },
  async setLoginPassword(
    currentPassword: string | null,
    newPassword: string,
  ): Promise<unknown> {
    if (!this.isTauri()) return null;
    return tauri()!.core!.invoke('set_login_password', {
      currentPassword,
      newPassword,
    });
  },
  async checkAppUpdate(): Promise<any> {
    if (!this.isTauri()) throw new Error('Windows 更新仅在 Tauri App 中可用');
    return tauri()!.core!.invoke('check_app_update');
  },
  async readSettings(): Promise<string | null> {
    if (!this.isTauri()) return null;
    return tauri()!.core!.invoke('read_settings');
  },
  async writeSettings(settings: unknown): Promise<boolean> {
    if (!this.isTauri()) return false;
    await tauri()!.core!.invoke('write_settings', {
      json: JSON.stringify(settings),
    });
    return true;
  },
  async pingHost(
    host: string,
    ipv6 = false,
    onOutput: ((text: string) => void) | null = null,
  ): Promise<void> {
    if (!this.isTauri()) throw new Error('ping/ping6 仅在 桌面版 中支持使用');
    if (!tauri()!.event || !tauri()!.event!.listen) {
      throw new Error('Tauri event API is unavailable');
    }

    const requestId = `ping-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let resolveFinished!: (value: any) => void;
    const finished = new Promise((resolve) => {
      resolveFinished = resolve;
    });

    const unlisten = await tauri()!.event!.listen(
      'win12://ping-output',
      (event: any) => {
        const payload = event.payload || {};
        if (payload.request_id !== requestId) return;
        if (payload.text && onOutput) onOutput(payload.text);
        if (payload.done) resolveFinished(payload);
      },
    );

    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('ping 超时')), 35000);
    });

    try {
      await tauri()!.core!.invoke('ping_host', { host, ipv6, requestId });
      await Promise.race([finished, timeout]);
    } finally {
      unlisten();
    }
  },
};

window.win12Native = win12Native;

updateAboutAppEntrypoints();
