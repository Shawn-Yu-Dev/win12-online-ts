// @ts-nocheck
import type { AppDefinition } from '../core/app-types';
import { $, page } from '../core/dom';
import { apps } from '../core/app-registry';
import { state } from '../core/state';
import {
  lang,
  isTauriApp,
  getAboutAppTitle,
  updateAboutAppEntrypoints,
} from '../core/i18n';
import { api, server, pages } from '../core/api';
import {
  setData,
  decodeHtml,
  calcTimeString,
  getPanicColor,
  setPanicColor,
} from '../core/utils';
import { showcm } from '../shell/context-menu';
import { showdp, hidedp } from '../shell/dropdown';
import { shownotice, closenotice } from '../shell/notices';
import {
  openapp,
  openDockWidget,
  hide_startmenu,
  hide_search,
  hide_widgets,
  pinapp,
  dragBrightness,
} from '../shell/launcher';
import {
  showwin,
  hidewin,
  maxwin,
  minwin,
  focwin,
  taskbarclick,
  resizewin,
} from '../core/windows';
import { createHistoryStack, createWebapp } from './shared';
import { m_tab } from '../features/tab';
import { widgets } from '../features/widgets';
import { runcmd } from '../scripts/terminal';
import { resolveEdgeAddressInput } from '../scripts/edge-address';
import { add_save } from '../scripts/edge-bookmarks';
import { getLunar } from '../scripts/lunar';
import { terminalEggs } from '../scripts/terminal-eggs';
import { taskmgrTasks } from '../data/tasks';
import { icon, nomax, nomin } from '../data/app-icons';
import { nts } from '../data/notices';
import { cms } from '../data/context-menus';
import { dps } from '../data/dock-panels';
import { geticon } from '../shell/taskbar';
import { closeVideo } from '../core/video';
import { toggletheme } from '../shell/theme';
import { setIcon, saveDesktop } from '../shell/desktop';

const explorer = {
  mounts: {},
  nextDriveLetter: 'E',
  fsApiSupported: 'showDirectoryPicker' in window,
  deleteKeyBound: false,
  pendingCreateNames: new Map(),
  init: () => {
    apps.explorer.tabs = [];
    apps.explorer.len = 0;
    apps.explorer.newtab();
    // apps.explorer.reset();
    apps.explorer.Process_Of_Select = '';
    apps.explorer.is_use = 0; //千万不要删除它，它依托 bug 运行
    apps.explorer.is_use2 = 0; //千万不要删除它，它依托 bug 运行
    apps.explorer.old_name = '';
    apps.explorer.clipboard = null;
    if (!apps.explorer.fsApiSupported) $('#explorer-mount-btn').hide();
    if (!apps.explorer.deleteKeyBound) {
      document.addEventListener('keydown', function (event) {
        const focusedWindow = $('.window.foc.show')[0];
        const target = event.target;
        const isEditing =
          target &&
          (target.isContentEditable ||
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
        if (
          event.key === 'Delete' &&
          !event.defaultPrevented &&
          !event.isComposing &&
          !isEditing &&
          focusedWindow &&
          focusedWindow.classList.contains('explorer') &&
          apps.explorer.Process_Of_Select
        ) {
          event.preventDefault();
          apps.explorer.del(apps.explorer.Process_Of_Select);
        }
      });
      apps.explorer.deleteKeyBound = true;
    }
  },
  mountDrive: async () => {
    if (!apps.explorer.fsApiSupported) {
      shownotice('fs-api-unsupported');
      return;
    }
    try {
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });
      document.body.style.cursor = 'wait';
      const letter = apps.explorer.nextDriveLetter + ':';
      apps.explorer.nextDriveLetter = String.fromCharCode(
        apps.explorer.nextDriveLetter.charCodeAt(0) + 1,
      );
      apps.explorer.mounts[letter] = dirHandle;
      apps.explorer.path.folder[letter] = {
        folder: {},
        file: [],
        _mounted: true,
        _handle: dirHandle,
      };
      if (!apps.explorer.tabs[apps.explorer.now][2].length)
        apps.explorer.reset();
      document.body.style.cursor = '';
    } catch (e) {
      document.body.style.cursor = '';
      if (e.name !== 'AbortError') shownotice('fs-mount-error');
    }
  },
  openMountedFile: async (path) => {
    var pathl = path.split('/');
    var fileName = pathl[pathl.length - 1];
    var ext = fileName.split('.').pop().toLowerCase();
    let tmp = apps.explorer.path;
    for (let i = 0; i < pathl.length - 1; i++) {
      tmp = tmp['folder'][pathl[i]];
    }
    var fileObj = tmp['file'].find((f) => f.name === fileName);
    if (!fileObj || !fileObj._mounted || !fileObj._handle) return;
    try {
      const file = await fileObj._handle.getFile();
      const codeExts = [
        'js',
        'ts',
        'jsx',
        'tsx',
        'css',
        'scss',
        'less',
        'html',
        'htm',
        'xml',
        'json',
        'yaml',
        'yml',
        'py',
        'java',
        'c',
        'cpp',
        'h',
        'cs',
        'go',
        'rs',
        'rb',
        'php',
        'sh',
        'bat',
        'ps1',
        'sql',
        'svg',
      ];
      const notepadExts = ['txt', 'log', 'md', 'csv', 'ini', 'cfg'];
      if (codeExts.includes(ext)) {
        const text = await file.text();
        apps.codeEditor.open(text, fileName, fileObj._handle);
      } else if (notepadExts.includes(ext)) {
        const text = await file.text();
        apps.notepad._mountedFileHandle = fileObj._handle;
        apps.notepad._dirty = false;
        apps.notepad._loading = true;
        if ($('#taskbar>.notepad').length != 0) {
          $('#win-notepad>.text-box')[0].innerText = text;
          if ($('.window.notepad').hasClass('min')) minwin('notepad');
          focwin('notepad');
          requestAnimationFrame(() => {
            apps.notepad._loading = false;
          });
        } else {
          apps.notepad._pendingContent = text;
          openapp('notepad');
        }
        $('.window.notepad>.titbar>p').text(fileName);
        apps.notepad.setMdMode(ext === 'md');
      } else if (
        ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'ico'].includes(ext)
      ) {
        const url = URL.createObjectURL(file);
        apps.imgviewer.open(url, fileName);
      } else if (
        ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(ext)
      ) {
        const url = URL.createObjectURL(file);
        apps.mediaplayer.open(url, fileName, 'video');
      } else if (
        ['mp3', 'wav', 'flac', 'ogg', 'aac', 'wma', 'm4a'].includes(ext)
      ) {
        const url = URL.createObjectURL(file);
        apps.mediaplayer.open(url, fileName, 'audio');
      } else if (ext === 'pdf') {
        const url = URL.createObjectURL(file);
        apps.pdfviewer.open(url, fileName);
      } else {
        shownotice('unsupported-file-type');
      }
    } catch (e) {
      shownotice('file-read-error');
    }
  },
  unmountDrive: (letter) => {
    delete apps.explorer.mounts[letter];
    delete apps.explorer.path.folder[letter];
    if (!apps.explorer.tabs[apps.explorer.now][2].length) apps.explorer.reset();
    else if (apps.explorer.tabs[apps.explorer.now][2].startsWith(letter))
      apps.explorer.reset();
  },
  populateFromHandle: async (dirHandle, targetObj) => {
    targetObj.folder = {};
    targetObj.file = [];
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'directory') {
        targetObj.folder[entry.name] = {
          folder: {},
          file: [],
          _mounted: true,
          _handle: entry,
        };
      } else {
        const ext = entry.name.split('.').pop().toLowerCase();
        let ico = 'icon/files/none.png';
        if (['txt', 'log', 'md', 'csv', 'ini', 'cfg'].includes(ext))
          ico = 'icon/files/txt.png';
        else if (
          [
            'js',
            'ts',
            'jsx',
            'tsx',
            'css',
            'scss',
            'less',
            'html',
            'htm',
            'xml',
            'json',
            'yaml',
            'yml',
            'py',
            'java',
            'c',
            'cpp',
            'h',
            'cs',
            'go',
            'rs',
            'rb',
            'php',
            'sh',
            'bat',
            'ps1',
            'sql',
          ].includes(ext)
        )
          ico = 'icon/files/txt.png';
        else if (
          [
            'png',
            'jpg',
            'bmp',
            'jpeg',
            'gif',
            'webp',
            'svg',
            'ico',
            'tiff',
          ].includes(ext)
        )
          ico = 'icon/files/picture.png';
        else if (['doc', 'docx', 'rtf', 'odt'].includes(ext))
          ico = 'icon/files/word.png';
        else if (['xls', 'xlsx', 'ods'].includes(ext))
          ico = 'icon/files/excel.png';
        else if (['ppt', 'pptx', 'odp'].includes(ext))
          ico = 'icon/files/ppt.png';
        else if (
          ['mp3', 'wav', 'flac', 'ogg', 'aac', 'wma', 'm4a'].includes(ext)
        )
          ico = 'icon/files/music.png';
        else if (
          ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'webm', 'flv'].includes(ext)
        )
          ico = 'icon/files/vidio.png';
        else if (['exe', 'msi'].includes(ext)) ico = 'icon/files/exefile.png';
        else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext))
          ico = 'icon/files/none.png';
        else if ('pdf' === ext) ico = 'icon/files/pdf.svg';
        targetObj.file.push({
          name: entry.name,
          ico: ico,
          command: '',
          _handle: entry,
          _mounted: true,
        });
      }
    }
  },
  tabs: [],
  now: null,
  len: 0,
  newtab: (path = '') => {
    m_tab.newtab('explorer', '');
    apps.explorer.tabs[apps.explorer.tabs.length - 1][2] = path;
    apps.explorer.initHistory(
      apps.explorer.tabs[apps.explorer.tabs.length - 1][0],
    );
    apps.explorer.checkHistory(
      apps.explorer.tabs[apps.explorer.tabs.length - 1][0],
    );
    m_tab.tab('explorer', apps.explorer.tabs.length - 1);
    // }
  },
  settab: (t, i) => {
    return `
                <div class="tab ${t[0]}" onclick="m_tab.tab('explorer',${i})"
                oncontextmenu="showcm(event,'explorer.tab',${i});stop(event);return false"
                onmousedown="
                    if(event.button==1){m_tab.close('explorer',${i});stop(event);}
                    else{m_tab.moving('explorer',this,event,${i});stop(event);disableIframes();}"
                ontouchstart="m_tab.moving('explorer',this,event,${i});stop(event);disableIframes();">
                    <p>${t[1]}</p>
                    <span class="clbtn bi bi-x" onclick="m_tab.close('explorer',${i});stop(event);"></span>
                </div>`;
  },
  tab: (c, load = true) => {
    if (load) {
      console.log(c);
      if (!apps.explorer.tabs[c][2].length) apps.explorer.reset();
      else apps.explorer.goto(apps.explorer.tabs[c][2]);
    }
    apps.explorer.checkHistory(apps.explorer.tabs[c][0]);
  },
  reset: (clear = true) => {
    let resetHtml = `<style>#win-explorer>.page>.main>.content>.view>.class{margin: 5px 0 0 10px;display: flex;}
            #win-explorer>.page>.main>.content>.view>.class>img{width: 20px;height: 20px;margin-top: 3px;margin-right: 5px;filter:brightness(0.9);}
            #win-explorer>.page>.main>.content>.view>.group{display: flex;flex-wrap: wrap;padding: 10px 20px;}
            #win-explorer>.page>.main>.content>.view>.group>.item{width: 280px;margin: 5px;height:80px;
    box-shadow: 0 1px 2px var(--s3d);
                background: radial-gradient(circle, var(--card),var(--card));border-radius: 10px;display: flex;}
            #win-explorer>.page>.main>.content>.view>.group>.item:hover{background-color: var(--hover);}

            #win-explorer>.page>.main>.content>.view>.group>.item>img{width: 55px;height: 55px;margin-top: 18px;margin-left: 10px;}
            #win-explorer>.page>.main>.content>.view>.group>.item>div{flex-grow: 1;padding: 5px 5px 0 0;}
            #win-explorer>.page>.main>.content>.view>.group>.item>div>.bar{width: calc(100% - 10px);height: 8px;border-radius: 10px;
                background-color: var(--hover-b);margin: 5px 5px;}
            #win-explorer>.page>.main>.content>.view>.group>.item>div>.bar>.content{height: 100%;background-image: linear-gradient(90deg, var(--theme-1), var(--theme-2));
                border-radius: 10px;}
            #win-explorer>.page>.main>.content>.view>.group>.item>div>.info{color: #959595;font-size: 14px;}</style>
            <p class="class"><img src="apps/icons/explorer/disk.svg"> 设备和驱动器</p><div class="group">
            <a class="a item act" ondblclick="apps.explorer.goto('C:')" ontouchend="apps.explorer.goto('C:')" oncontextmenu="showcm(event,'explorer.folder','C:');return stop(event);">
            <img src="apps/icons/explorer/diskwin.svg"><div><p class="name">本地磁盘 (C:)</p>
            <div class="bar"><div class="content" style="width: 88%;"></div>
            </div><p class="info">32.6 GB 可用，共 143 GB</p></div></a><a class="a item act" ondblclick="apps.explorer.goto('D:')" ontouchend="apps.explorer.goto('D:')"
            oncontextmenu="showcm(event,'explorer.folder','D:');return stop(event);">
            <img src="apps/icons/explorer/disk.svg"><div><p class="name">本地磁盘 (D:)</p><div class="bar"><div class="content" style="width: 15%;"></div>
            </div><p class="info">185.3 GB 可用，共 216 GB</p></div></a>`;
    for (let letter in apps.explorer.mounts) {
      const handle = apps.explorer.mounts[letter];
      resetHtml += `<a class="a item act" ondblclick="apps.explorer.goto('${letter}')" ontouchend="apps.explorer.goto('${letter}')" oncontextmenu="showcm(event,'explorer.mounted','${letter}');return stop(event);">
                <img src="apps/icons/explorer/disk.svg"><div><p class="name">${handle.name} (${letter})</p>
                <div class="bar"><div class="content" style="width: 0%;"></div>
                </div><p class="info">本地文件夹</p></div></a>`;
    }
    resetHtml += `</div>`;
    $('#win-explorer>.page>.main>.content>.view')[0].innerHTML = resetHtml;
    $('#win-explorer>.path>.tit')[0].innerHTML =
      '<div class="icon" style="background-image: url(\'./apps/icons/explorer/thispc.svg\')"></div><div class="path"><div class="text" onclick="apps.explorer.reset()">此电脑</div><div class="arrow">&gt;</div></div>';
    // if(rename){
    m_tab.rename(
      'explorer',
      '<img src="./apps/icons/explorer/thispc.svg"> 此电脑',
    );
    apps.explorer.tabs[apps.explorer.now][2] = '';
    if (clear) {
      apps.explorer.delHistory(apps.explorer.tabs[apps.explorer.now][0]);
      apps.explorer.pushHistory(
        apps.explorer.tabs[apps.explorer.now][0],
        '此电脑',
      );
    }
    // }
  },
  select: (path, id) => {
    var elements = document.querySelectorAll(
      '#win-explorer > .main > .content > .view > .select',
    );
    for (var i = 0; i < elements.length; i++) {
      elements[i].classList.remove('select');
    }
    apps.explorer.Process_Of_Select = path;
    var element = document.getElementById(id);
    element.classList.add('select');
    apps.explorer.is_use += 1;
  },
  copy_or_cut: (path, operate) => {
    //operate 只能为 copy 或 cut
    var pathl = path.split('/');
    var name = pathl[pathl.length - 1];
    pathl.pop();
    let files = apps.explorer.getPath();
    let tmp = null;
    pathl.forEach((name) => {
      if (tmp !== null) {
        tmp = tmp['folder'][name];
      } else {
        tmp = files['folder'][name];
      }
    });

    if (Object.keys(tmp['folder']).includes(name)) {
      apps.explorer.clipboard = ['folder', [name], tmp['folder'][name]];
      if (operate == 'cut') {
        delete tmp['folder'][name];
      }
    } else {
      for (var i = 0; i < tmp['file'].length; i++) {
        if (tmp['file'][i]['name'] == name) {
          apps.explorer.clipboard = ['file', tmp['file'][i]];
          if (operate == 'cut') {
            tmp['file'].splice(i, 1); // Use splice instead of delete
          }
          break;
        }
      }
    }
    apps.explorer.pushLocalStoragePath(files, true);
  },
  paste: (path) => {
    if (!apps.explorer.clipboard) {
      return;
    }
    var pathl = path.split('/');
    let files = apps.explorer.getPath();
    let tmp = null;
    pathl.forEach((name) => {
      if (tmp !== null) {
        tmp = tmp['folder'][name];
      } else {
        tmp = files['folder'][name];
      }
    });

    var clipboard = apps.explorer.clipboard;
    if (clipboard[0] == 'file') {
      // Check for duplicate file name
      if (tmp['file'] != null && tmp['folder'] != null) {
        if (
          tmp['file'].some((file) => file.name === clipboard[1].name) &&
          tmp['folder'][clipboard[1][0]]
        ) {
          shownotice('duplication file name');
          return;
        }
      } else if (tmp['file'] == null && tmp['folder'] != null) {
        if (tmp['folder'][clipboard[1][0]]) {
          shownotice('duplication file name');
          return;
        } else {
          tmp['file'] = [];
        }
      } else if (tmp['file'] != null && tmp['folder'] == null) {
        if (tmp['file'].some((file) => file.name === clipboard[1].name)) {
          shownotice('duplication file name');
          return;
        }
      }
      tmp['file'].push({ ...clipboard[1] }); // Create a copy of the file object
    } else {
      // Check for duplicate folder name
      if (tmp['folder'][clipboard[1][0]]) {
        shownotice('duplication file name');
        return;
      }
      tmp['folder'][clipboard[1][0]] = JSON.parse(JSON.stringify(clipboard[2])); // Deep copy the folder
    }
    apps.explorer.goto(path);
    apps.explorer.pushLocalStoragePath(files, true);
  },
  del_select: () => {
    if (
      apps.explorer.is_use >= 1 &&
      apps.explorer.is_use2 != apps.explorer.is_use
    ) {
      apps.explorer.is_use2 = apps.explorer.is_use;
      return;
    }
    var elements = document.querySelectorAll(
      '#win-explorer>.page>.main>.content>.view>.change',
    );
    console.log(elements);
    for (var i = 0; i < elements.length; i++) {
      var name_1, icon_;
      elements[i].classList.remove('change');
      let aTag = elements[i];
      var on = apps.explorer.old_name;
      let inputTag = aTag.querySelector('#new_name');
      var pathl = $('#win-explorer>.path>.tit')[0].dataset.path.split('/');
      var isMountedRename = !!apps.explorer.mounts[pathl[0]];
      let files = isMountedRename
        ? apps.explorer.path
        : apps.explorer.getPath();
      let tmp = files;
      pathl.forEach((name) => {
        if (tmp !== null) {
          tmp = tmp['folder'][name];
        } else {
          tmp = files['folder'][name];
        }
      });
      if (
        inputTag.value == '' ||
        apps.explorer.traverseDirectory(tmp, inputTag.value) ||
        on == inputTag.value
      ) {
        if (
          apps.explorer.traverseDirectory(tmp, inputTag.value) &&
          on != inputTag.value
        ) {
          shownotice('duplication file name');
        }
        var element = document.getElementById('new_name');
        element.parentNode.removeChild(element);
        aTag.innerHTML += on;
        continue;
      }
      name_1 = inputTag.value.split('.');
      if (name_1[0].indexOf('/') > -1)
        alert('恭喜你发现了这个 bug,但是太懒了不想修 qwq');
      console.log(name_1);
      if (name_1[1] == 'txt') {
        icon_ = 'icon/files/txt.png';
      } else if (
        name_1[1] == 'png' ||
        name_1[1] == 'jpg' ||
        name_1[1] == 'bmp'
      ) {
        icon_ = 'icon/files/picture.png';
      } else {
        icon_ = 'icon/files/none.png';
      }
      //这边可以适配更多的文件类型

      aTag.innerHTML += inputTag.value;
      for (var j = 0; j < tmp['file'].length; j++) {
        if (tmp['file'][j]['name'] == on) {
          const fileEntry = tmp['file'][j];
          fileEntry['name'] = inputTag.value;
          fileEntry['ico'] = icon_;
          if (isMountedRename && tmp._handle) {
            (async () => {
              try {
                const oldHandle = await tmp._handle.getFileHandle(on);
                const file = await oldHandle.getFile();
                const newHandle = await tmp._handle.getFileHandle(
                  inputTag.value,
                  { create: true },
                );
                const writable = await newHandle.createWritable();
                await writable.write(await file.arrayBuffer());
                await writable.close();
                await tmp._handle.removeEntry(on);
                fileEntry._handle = newHandle;
              } catch (e) {
                console.warn('Rename on mounted FS failed:', e);
              }
            })();
          }
        }
      }
      const keys = Object.keys(tmp['folder']);
      for (var i = 0; i < keys.length; i++) {
        if (keys[i] == on) {
          keys[i] = inputTag.value;
          tmp['folder'][inputTag.value] = tmp['folder'][on];
          delete tmp['folder'][on];
        }
      }
      element = document.getElementById('new_name');
      element.parentNode.removeChild(element);
      if (isMountedRename) {
        apps.explorer._gotoSync(pathl.join('/'), false);
      } else {
        apps.explorer.pushLocalStoragePath(files, true);
      }
    }
    apps.explorer.is_use2 = apps.explorer.is_use;
    elements = document.querySelectorAll(
      '#win-explorer>.page>.main>.content>.view>.select',
    );
    for (var i = 0; i < elements.length; i++) {
      elements[i].classList.remove('select');
    }
    apps.explorer.Process_Of_Select = '';
  },
  goto: (path, clear = true) => {
    if (path == '此电脑') {
      apps.explorer.reset(clear);
      return null;
    }
    var pathl = path.split('/');
    if (apps.explorer.mounts[pathl[0]]) {
      return apps.explorer._gotoAsync(path, clear, !clear);
    }
    return apps.explorer._gotoSync(path, clear);
  },
  _gotoAsync: async (path, clear, forceRefresh = false) => {
    $('#win-explorer>.page>.main>.content>.view')[0].innerHTML =
      '<p class="info" style="opacity:0.6;">加载中...</p>';
    var pathl = path.split('/');
    let tmp = apps.explorer.path;
    try {
      for (let i = 0; i < pathl.length; i++) {
        tmp = tmp['folder'][pathl[i]];
        const needLoad =
          Object.keys(tmp.folder).length === 0 && tmp.file.length === 0;
        if (
          tmp._mounted &&
          tmp._handle &&
          (needLoad || (forceRefresh && i === pathl.length - 1))
        ) {
          await apps.explorer.populateFromHandle(tmp._handle, tmp);
        }
      }
      apps.explorer._gotoSync(path, clear);
    } catch (e) {
      $('#win-explorer>.page>.main>.content>.view')[0].innerHTML =
        '<p class="info">无法读取此文件夹。</p>';
    }
  },
  _gotoSync: (path, clear = true) => {
    apps.explorer.Process_Of_Select = '';
    $('#win-explorer>.page>.main>.content>.view')[0].innerHTML = '';
    var pathl = path.split('/');
    var pathqwq = '';
    var index_ = 0;
    let tmp = apps.explorer.mounts[pathl[0]]
      ? apps.explorer.path
      : apps.explorer.getPath();
    if (path == '此电脑') {
      apps.explorer.reset(clear);
      return null;
    }
    $('#win-explorer>.path>.tit')[0].dataset.path = path;
    $('#win-explorer>.path>.tit>.path')[0].innerHTML =
      '<div class="text" onclick="apps.explorer.reset()">此电脑</div><div class="arrow">&gt;</div>';
    $('#win-explorer>.path>.tit>.icon')[0].style.marginTop = '0px';
    if (pathl[pathl.length - 1] == 'C:') {
      $('#win-explorer>.path>.tit>.icon')[0].style.backgroundImage =
        'url("apps/icons/explorer/diskwin.svg")';
      $('#win-explorer>.path>.tit>.icon')[0].style.marginTop = '2.5px';
      m_tab.rename(
        'explorer',
        '<img src="./apps/icons/explorer/diskwin.svg" style="margin-top:2.5px">' +
          pathl[pathl.length - 1],
      );
    } else if (pathl[pathl.length - 1] == 'D:') {
      $('#win-explorer>.path>.tit>.icon')[0].style.backgroundImage =
        'url("apps/icons/explorer/disk.svg")';
      m_tab.rename(
        'explorer',
        '<img src="./apps/icons/explorer/disk.svg">' + pathl[pathl.length - 1],
      );
    } else if (apps.explorer.mounts[pathl[pathl.length - 1]]) {
      $('#win-explorer>.path>.tit>.icon')[0].style.backgroundImage =
        'url("apps/icons/explorer/disk.svg")';
      m_tab.rename(
        'explorer',
        '<img src="./apps/icons/explorer/disk.svg">' + pathl[pathl.length - 1],
      );
    } else {
      $('#win-explorer>.path>.tit>.icon')[0].style.backgroundImage =
        'url("apps/icons/explorer/folder.svg")';
      m_tab.rename(
        'explorer',
        '<img src="./apps/icons/explorer/folder.svg">' +
          pathl[pathl.length - 1],
      );
    }
    // if(rename){
    apps.explorer.tabs[apps.explorer.now][2] = path;
    // }
    pathl.forEach((name) => {
      pathqwq += name;
      $('#win-explorer>.path>.tit>.path')[0].innerHTML +=
        `<div class="text" onclick="apps.explorer.goto('${pathqwq}')">${name}</div><div class="arrow">&gt;</div>`;
      tmp = tmp['folder'][name];
      pathqwq += '/';
    });
    var path_ = path;
    if (Object.keys(tmp['folder']) == 0 && tmp['file'].length == 0) {
      $('#win-explorer>.page>.main>.content>.view')[0].innerHTML =
        '<p class="info">此文件夹为空。</p>';
    } else {
      let ht = '';
      for (let folder in tmp['folder']) {
        ht += `<a class="a item files" id="file${index_}" onclick="apps.explorer.select('${path}/${folder}','file${index_}');" ondblclick="apps.explorer.goto('${path}/${folder}')" ontouchend="apps.explorer.goto('${path}/${folder}')" oncontextmenu="showcm(event,'explorer.folder','${path}/${folder}');return stop(event);">
                        <img src="apps/icons/explorer/folder.svg">${folder}</a>`;
        index_ += 1;
      }
      if (tmp['file']) {
        tmp['file'].forEach((file) => {
          let cmd = file['command'];
          if (file._mounted && file._handle) {
            cmd = `apps.explorer.openMountedFile('${path_}/${file['name']}')`;
          }
          ht += `<a class="a item file" id="file${index_}" onclick="apps.explorer.select('${path_}/${file['name']}','file${index_}');" ondblclick="${cmd}" ontouchend="${cmd}" oncontextmenu="showcm(event,'explorer.file','${path_}/${file['name']}');return stop(event);">
                            <img src="${file['ico']}">${file['name']}</a>`;
          index_ += 1;
        });
      }
      $('#win-explorer>.page>.main>.content>.view')[0].innerHTML = ht;
    }
    if (pathl.length == 1) {
      $('#win-explorer>.path>.goback').attr('onclick', 'apps.explorer.reset()');
    } else {
      $('#win-explorer>.path>.goback').attr(
        'onclick',
        `apps.explorer.goto('${path.substring(0, path.length - pathl[pathl.length - 1].length - 1)}')`,
      );
    }

    if (clear) {
      apps.explorer.delHistory(apps.explorer.tabs[apps.explorer.now][0]);
      apps.explorer.pushHistory(
        apps.explorer.tabs[apps.explorer.now][0],
        $('#win-explorer>.path>.tit')[0].dataset.path,
      );
    }
    apps.explorer.checkHistory(apps.explorer.tabs[apps.explorer.now][0]);
  },
  add: async (path, name_, type = 'file', command = '', icon = '') => {
    //type 为文件类型，只有文件夹 files 和文件 file
    const pathl = path.split('/').filter(Boolean);
    const isMounted = !!apps.explorer.mounts[pathl[0]];
    const files = isMounted ? apps.explorer.path : apps.explorer.getPath();
    let tmp = files;

    for (const name of pathl) {
      if (
        !tmp ||
        !tmp.folder ||
        !Object.prototype.hasOwnProperty.call(tmp.folder, name)
      ) {
        shownotice('file-write-error');
        return false;
      }
      tmp = tmp.folder[name];
    }

    tmp.folder ??= {};
    tmp.file ??= [];

    let finalName = name_;
    let counter = 1;
    let baseName = name_;
    let extension = '';
    if (type === 'file' && name_.includes('.')) {
      const lastDotIndex = name_.lastIndexOf('.');
      baseName = name_.substring(0, lastDotIndex);
      extension = name_.substring(lastDotIndex);
    }
    let reservedNames = apps.explorer.pendingCreateNames.get(path);
    if (!reservedNames) {
      reservedNames = new Set();
      apps.explorer.pendingCreateNames.set(path, reservedNames);
    }
    while (
      apps.explorer.traverseDirectory(tmp, finalName) ||
      reservedNames.has(finalName)
    ) {
      finalName = `${baseName} (${counter})${extension}`;
      counter += 1;
    }
    reservedNames.add(finalName);

    try {
      if (type === 'files') {
        const folderEntry = { folder: {}, file: [] };
        if (isMounted) {
          if (!tmp._handle)
            throw new Error('Mounted directory handle is missing');
          folderEntry._handle = await tmp._handle.getDirectoryHandle(
            finalName,
            { create: true },
          );
          folderEntry._mounted = true;
        }
        tmp.folder[finalName] = folderEntry;
      } else {
        const extensionName = finalName.includes('.')
          ? finalName.split('.').pop().toLowerCase()
          : '';
        let icon_ = 'icon/files/none.png';
        if (extensionName === 'txt') {
          icon_ = 'icon/files/txt.png';
          if (command === '') command = "openapp('notepad')";
        } else if (['png', 'jpg', 'bmp'].includes(extensionName)) {
          icon_ = 'icon/files/picture.png';
        }
        if (icon !== '') icon_ = icon;

        const fileEntry = { name: finalName, ico: icon_, command: command };
        if (isMounted) {
          if (!tmp._handle)
            throw new Error('Mounted directory handle is missing');
          fileEntry._handle = await tmp._handle.getFileHandle(finalName, {
            create: true,
          });
          fileEntry._mounted = true;
          fileEntry.command = '';
        }
        tmp.file.push(fileEntry);
      }
    } catch (error) {
      reservedNames.delete(finalName);
      if (reservedNames.size === 0)
        apps.explorer.pendingCreateNames.delete(path);
      console.warn('Create file or folder failed:', error);
      shownotice('file-write-error');
      return false;
    }
    reservedNames.delete(finalName);
    if (reservedNames.size === 0) apps.explorer.pendingCreateNames.delete(path);

    if (!isMounted) apps.explorer.pushLocalStoragePath(files, false);
    await apps.explorer.goto(path);
    apps.explorer.rename(path + '/' + finalName);
    return true;
  },
  rename: (path) => {
    var pathl = path.split('/');
    var name = pathl[pathl.length - 1];
    const isMounted = !!apps.explorer.mounts[pathl[0]];
    apps.explorer.old_name = name;
    pathl.pop();
    let files = isMounted ? apps.explorer.path : apps.explorer.getPath();
    let tmp = files;
    pathl.forEach((name) => {
      if (tmp !== null) {
        tmp = tmp['folder'][name];
      } else {
        tmp = files['folder'][name];
      }
    });
    let element = document.querySelector('#' + apps.explorer.get_file_id(name));
    if (!element) return false;
    let img = element.querySelector('img').outerHTML;
    element.innerHTML = img;
    let input = document.createElement('input');
    // input.style.cssText = '';
    input.id = 'new_name';
    input.className = 'input';
    input.value = apps.explorer.old_name;
    element.appendChild(input);
    setTimeout(() => {
      $('#new_name').focus();
      $('#new_name').select();
    }, 200);

    element.classList.add('change');
    var input_ = document.getElementById('new_name');
    input_.addEventListener('keyup', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        apps.explorer.del_select();
      }
    });
    if (!isMounted) apps.explorer.pushLocalStoragePath(files, false);
    return true;
  },
  get_file_id: (name) => {
    //只能找到已经打开了的文件夹的元素 id
    var elements = document.getElementsByClassName('item');
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      if (element.innerText == name) {
        return element.id;
      }
    }
  },
  del: (path) => {
    if (!path) return false;
    var pathl = path.split('/');
    var name = pathl[pathl.length - 1];
    var isMounted = !!apps.explorer.mounts[pathl[0]];
    pathl.pop();
    let files = isMounted ? apps.explorer.path : apps.explorer.getPath();
    let tmp = files;
    for (const parentName of pathl) {
      if (!tmp || !tmp.folder || !tmp.folder[parentName]) return false;
      tmp = tmp.folder[parentName];
    }
    if (!tmp || !tmp.file || !tmp.folder) return false;
    let tmp_file = tmp['file'];
    console.log(tmp_file);
    console.log(tmp);
    for (var i = 0; i < tmp_file.length; i++) {
      if (tmp_file[i]['name'] == name) {
        tmp_file.splice(i, 1);
      }
    }
    let tmp_files = tmp['folder'];
    delete tmp_files[name];
    if (isMounted && tmp._handle) {
      tmp._handle
        .removeEntry(name, { recursive: true })
        .catch(() => shownotice('file-write-error'));
    }
    apps.explorer.history.forEach((item) => {
      while (item.includes(path)) {
        item.splice(
          item.findIndex((elt) => {
            return elt == path;
          }),
          1,
        );
      }
    });
    if (!isMounted) apps.explorer.pushLocalStoragePath(files, false);
    apps.explorer.goto(pathl.join('/'));
    return true;
  },
  pushLocalStoragePath: (path, isRefresh = false) => {
    const pathStr = JSON.stringify(path);
    localStorage.setItem('files_path', pathStr);
    if ((isRefresh ?? false) == true) {
      apps.explorer.goto($('#win-explorer>.path>.tit')[0].dataset.path, false);
    }
  },
  normalizePathTree: (node, seen = new Set()) => {
    if (
      !node ||
      typeof node !== 'object' ||
      Array.isArray(node) ||
      seen.has(node)
    ) {
      return false;
    }
    seen.add(node);
    if (node.folder === undefined) node.folder = {};
    if (node.file === undefined) node.file = [];
    if (
      !node.folder ||
      typeof node.folder !== 'object' ||
      Array.isArray(node.folder) ||
      !Array.isArray(node.file)
    ) {
      return false;
    }
    for (const file of node.file) {
      if (
        !file ||
        typeof file !== 'object' ||
        Array.isArray(file) ||
        typeof file.name !== 'string'
      ) {
        return false;
      }
    }
    for (const child of Object.values(node.folder)) {
      if (!apps.explorer.normalizePathTree(child, seen)) return false;
    }
    return true;
  },
  getPath: () => {
    const filesPath = localStorage.getItem('files_path');
    if (filesPath !== null) {
      try {
        const parsed = JSON.parse(filesPath);
        if (apps.explorer.normalizePathTree(parsed)) return parsed;
      } catch (error) {
        console.warn('Invalid explorer state; resetting it:', error);
      }
      localStorage.removeItem('files_path');
    }
    apps.explorer.normalizePathTree(apps.explorer.path);
    apps.explorer.pushLocalStoragePath(apps.explorer.path);
    return apps.explorer.path;
  },
  traverseDirectory(dir, name) {
    if (dir['file'] == null || dir['folder'] == null) return false;
    console.log(name);
    for (var i = 0; i < dir['file'].length; i++) {
      if (dir['file'][i]['name'] == name) {
        return true;
      }
    }
    const keys = Object.keys(dir['folder']);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] == name) {
        return true;
      }
    }
    return false;
  },

  // 原本的开发规范不让格式化、展开
  // 但现在统一引入了Prettier，所以可以全部格式化

  // 给我看蒙了这东西，写的是啥
  path: {
    folder: {
      'C:': {
        folder: {
          'Program Files': {
            folder: {
              WindowsApps: { folder: {}, file: [] },
              Microsoft: { folder: {}, file: [] },
            },
            file: [
              {
                name: 'about.exe',
                ico: 'icon/about.svg',
                command: "openapp('about')",
              },
              {
                name: 'setting.exe',
                ico: 'icon/setting.svg',
                command: "openapp('setting')",
              },
            ],
          },
          'Program Files (x86)': {
            folder: {
              Microsoft: {
                folder: {
                  Edge: {
                    folder: {
                      Application: {
                        folder: { SetupMetrics: { folder: {}, file: [] } },
                        file: [
                          {
                            name: 'msedge.exe',
                            ico: 'icon/edge.svg',
                            command: "openapp('edge')",
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
          Windows: {
            folder: {
              Boot: { folder: {}, file: [] },
              System: { folder: {}, file: [] },
              SysWOW64: { folder: {}, file: [] },
              System32: {
                folder: {},
                file: [
                  {
                    name: 'calc.exe',
                    ico: 'icon/calc.svg',
                    command: "openapp('calc')",
                  },
                  {
                    name: 'cmd.exe',
                    ico: 'icon/terminal.svg',
                    command: "openapp('terminal')",
                  },
                  {
                    name: 'notepad.exe',
                    ico: 'icon/notepad.svg',
                    command: "openapp('notepad')",
                  },
                  {
                    name: 'taskmgr.exe',
                    ico: 'icon/taskmgr.png',
                    command: "openapp('taskmgr')",
                  },
                  {
                    name: 'winver.exe',
                    ico: 'icon/about.svg',
                    command: "openapp('winver')",
                  },
                ],
              },
            },
            file: [
              {
                name: 'explorer.exe',
                ico: 'icon/explorer.svg',
                command: 'apps.explorer.newtab()',
              },
              {
                name: 'notepad.exe',
                ico: 'icon/notepad.svg',
                command: "openapp('notepad')",
              },
              {
                name: 'py.exe',
                ico: 'icon/python.svg',
                command: "openapp('python')",
              },
            ],
          },
          用户: {
            folder: {
              Administrator: {
                folder: {
                  推荐的项目: {
                    folder: {},
                    file: [
                      {
                        name: '瓶盖介绍.doc',
                        ico: 'icon/files/word.png',
                        command: "openapp('word');apps.word.edit()",
                      },
                      {
                        name: '瓶盖质量统计分析.xlsx',
                        ico: 'icon/files/excel.png',
                        command: '',
                      },
                    ],
                  },
                  文档: {
                    folder: {
                      IISExpress: { folder: {}, file: [] },
                      PowerToys: { folder: {}, file: [] },
                    },
                    file: [
                      {
                        name: '瓶盖介绍.doc',
                        ico: 'icon/files/word.png',
                        command: '',
                      },
                      {
                        name: '瓶盖质量统计分析.xlsx',
                        ico: 'icon/files/excel.png',
                        command: '',
                      },
                    ],
                  },
                  图片: {
                    folder: {
                      本机照片: { folder: {}, file: [] },
                      屏幕截图: { folder: {}, file: [] },
                    },
                    file: [
                      {
                        name: '瓶盖构造图.png',
                        ico: 'icon/files/img.png',
                        command: '',
                      },
                      {
                        name: '可口可乐瓶盖.jpg',
                        ico: 'icon/files/img.png',
                        command: '',
                      },
                    ],
                  },
                  AppData: {
                    folder: {
                      Local: {
                        folder: {
                          Microsoft: {
                            folder: {
                              Windows: {
                                folder: {
                                  Fonts: {},
                                  TaskManager: {},
                                  Themes: {},
                                  Shell: {},
                                  应用程序快捷方式: {},
                                },
                              },
                            },
                          },
                          Programs: {
                            folder: {
                              Python: {
                                folder: {
                                  Python311: {
                                    folder: {
                                      DLLs: {},
                                      Doc: {},
                                      include: {},
                                      Lib: {
                                        folder: {
                                          'site-packages': {},
                                          tkinter: {},
                                        },
                                      },
                                      libs: {},
                                      Script: {},
                                      share: {},
                                      tcl: {},
                                      Tools: {},
                                    },
                                    file: [
                                      {
                                        name: 'python.exe',
                                        ico: 'icon/python.png',
                                        command: "openapp('python')",
                                      },
                                    ],
                                  },
                                },
                              },
                            },
                          },
                          Temp: { folder: {} },
                        },
                      },
                      LocalLow: {
                        folder: { Microsoft: { folder: { Windows: {} } } },
                      },
                      Roaming: {
                        folder: {
                          Microsoft: {
                            folder: {
                              Windows: {
                                folder: {
                                  '「开始」菜单': {
                                    folder: { 程序: { folder: {} } },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    file: [],
                  },
                  音乐: { folder: { 录音机: { folder: {}, file: [] } } },
                },
              },
              公用: {
                folder: {
                  公用文档: {
                    folder: {
                      IISExpress: { folder: {}, file: [] },
                      PowerToys: { folder: {}, file: [] },
                    },
                    file: [],
                  },
                  公用图片: {
                    folder: {
                      本机照片: { folder: {}, file: [] },
                      屏幕截图: { folder: {}, file: [] },
                    },
                    file: [],
                  },
                  公用音乐: { folder: { 录音机: { folder: {}, file: [] } } },
                },
              },
            },
          },
        },
        file: [],
      },
      'D:': {
        folder: { Microsoft: { folder: {}, file: [] } },
        file: [
          {
            name: '瓶盖结构说明.docx',
            ico: 'icon/files/word.png',
            command: '',
          },
          {
            name: '可口可乐瓶盖历史.pptx',
            ico: 'icon/files/ppt.png',
            command: '',
          },
        ],
      },
    },
  },
} as unknown as AppDefinition;

export default explorer;
