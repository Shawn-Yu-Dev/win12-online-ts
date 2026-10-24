import { apps, registerApps } from '../core/app-registry';
import { createHistoryStack } from './shared';
import about from './about';
import bilibili from './bilibili';
import calc from './calc';
import camera from './camera';
import codeEditor from './codeEditor';
import copilot from './copilot';
import defender from './defender';
import edge from './edge';
import explorer from './explorer';
import imgviewer from './imgviewer';
import macos from './macos';
import mediaplayer from './mediaplayer';
import minesweeper from './minesweeper';
import msstore from './msstore';
import notepad from './notepad';
import notepadFonts from './notepadFonts';
import pdfviewer from './pdfviewer';
import python from './python';
import pythonEditor from './pythonEditor';
import run from './run';
import search from './search';
import setting from './setting';
import taskmgr from './taskmgr';
import terminal from './terminal';
import vscode from './vscode';
import webapps from './webapps';
import whiteboard from './whiteboard';
import windows12 from './windows12';
import winver from './winver';
import word from './word';
import wsa from './wsa';

export function registerAllApps(): void {
  registerApps({
    about,
    bilibili,
    calc,
    camera,
    codeEditor,
    copilot,
    defender,
    edge,
    explorer,
    imgviewer,
    macos,
    mediaplayer,
    minesweeper,
    msstore,
    notepad,
    notepadFonts,
    pdfviewer,
    python,
    pythonEditor,
    run,
    search,
    setting,
    taskmgr,
    terminal,
    vscode,
    webapps,
    whiteboard,
    windows12,
    winver,
    word,
    wsa,
  });
  Object.assign(
    apps.explorer,
    createHistoryStack(
      'explorer',
      '#win-explorer>.path>.back',
      '#win-explorer>.path>.front',
    ),
  );
  Object.assign(
    apps.edge,
    createHistoryStack(
      'edge',
      '#win-edge>.tool>.back',
      '#win-edge>.tool>.front',
    ),
  );
}

export {
  about,
  bilibili,
  calc,
  camera,
  codeEditor,
  copilot,
  defender,
  edge,
  explorer,
  imgviewer,
  macos,
  mediaplayer,
  minesweeper,
  msstore,
  notepad,
  notepadFonts,
  pdfviewer,
  python,
  pythonEditor,
  run,
  search,
  setting,
  taskmgr,
  terminal,
  vscode,
  webapps,
  whiteboard,
  windows12,
  winver,
  word,
  wsa,
};
