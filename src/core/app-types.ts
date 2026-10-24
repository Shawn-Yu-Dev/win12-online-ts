export interface AppDefinition {
  init?: (...args: any[]) => any;
  load?: (...args: any[]) => any;
  remove?: (...args: any[]) => any;
  loaded?: boolean;
  [key: string]: any;
}

export type AppRegistry = Record<string, AppDefinition>;

export type ContextMenuEntry =
  string | [string, string] | ((arg: any) => string | [string, string]);

export interface NoticeButton {
  type: string;
  text: string;
  js: string;
}

export interface NoticeDefinition {
  cnt: string;
  btn: NoticeButton[];
}
