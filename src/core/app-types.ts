/**
 * Lifecycle hooks implemented by app modules.
 *
 * `init` is called every time the window is opened. `load` is called once,
 * before `init`, the first time the app is opened. `remove` is called after the
 * window has been closed.
 */
export type AppInit = () => void;
export type AppLoad = (initAll?: boolean) => void;
export type AppRemove = () => void;

/**
 * Shape of an application registered in {@link AppRegistry}.
 *
 * App modules are migrated from the original JavaScript code and still expose
 * additional state and helper members which are reached through
 * `apps.<name>.<member>`. Those members are typed by each module eventually;
 * until then the index signature below keeps the legacy dynamic access working.
 */
export interface AppDefinition {
  init?: AppInit;
  load?: AppLoad;
  remove?: AppRemove;
  loaded?: boolean;
  /** Legacy dynamic app members (state, helpers); kept permissive on purpose. */
  [key: string]: any;
}

export type AppRegistry = Record<string, AppDefinition>;

/**
 * Payload passed to a context-menu callback. Its shape depends on the menu:
 * most menus receive a string, some receive a tuple or a numeric index.
 */
export type ContextMenuArg =
  | string
  | number
  | null
  | undefined
  | readonly (string | number | null | undefined)[];

export type ContextMenuResult = string | [string, string];

export type ContextMenuEntry =
  string | [string, string] | ((arg: ContextMenuArg) => ContextMenuResult);

export interface NoticeButton {
  type: string;
  text: string;
  js: string;
}

export interface NoticeDefinition {
  cnt: string;
  btn: NoticeButton[];
}
