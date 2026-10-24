export interface ShellState {
  runCmd: string;
  autoUpdate: boolean;
  fontWindow: boolean;
  editMode: boolean;
  wifi: boolean;
  flyMode: boolean;
  useMusic: boolean;
  useMicVoice: boolean;
  isDark: boolean;
  topmost: string[];
  sysSettings: number[];
  desktopItems: string[];
  theme: 'light' | 'dark';
  shutdownTasks: ReturnType<typeof setTimeout>[];
}

export const state: ShellState = {
  runCmd: '',
  autoUpdate: true,
  fontWindow: false,
  editMode: false,
  wifi: true,
  flyMode: false,
  useMusic: true,
  useMicVoice: true,
  isDark: false,
  topmost: [],
  sysSettings: [1, 1, 1, 0, 1, 1, 1],
  desktopItems: [],
  theme: 'light',
  shutdownTasks: [],
};
