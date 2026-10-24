import type { AppDefinition, AppRegistry } from './app-types';

export const apps: AppRegistry = {};

export function getApp(name: string): AppDefinition | undefined {
  return apps[name];
}

export function registerApps(registry: AppRegistry): void {
  Object.assign(apps, registry);
}
