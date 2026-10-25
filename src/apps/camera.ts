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

const camera = {
  requestGeneration: 0,
  deviceLostTimer: null,
  init: (): void => {
    if (!localStorage.getItem('camera')) {
      showwin('camera-notice');
      return;
    }
    if (localStorage.getItem('camera')) {
      const requestGeneration = ++apps.camera.requestGeneration;
      apps.camera.streaming = false;
      apps.camera.stopStream();
      apps.camera.hideError();
      apps.camera.video = $('#win-camera video')[0];
      const video = apps.camera.video;
      apps.camera.canvas = $('#win-camera canvas')[0];
      apps.camera.context = apps.camera.canvas.getContext('2d');
      apps.camera.context.fillStyle = '#aaa';
      apps.camera.downloadLink = $('#win-camera a')[0];
      // apps.camera.control = document.querySelector('#win-camera>.control')
      if (
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia != 'function'
      ) {
        if (requestGeneration === apps.camera.requestGeneration) {
          apps.camera.showError();
        }
        return;
      }
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream: MediaStream) => {
          if (requestGeneration !== apps.camera.requestGeneration) {
            stream
              .getTracks()
              .forEach((track: MediaStreamTrack) => track.stop());
            return;
          }
          video.srcObject = stream;
          apps.camera.watchTracks(stream, requestGeneration);
          const playing = video.play();
          if (playing && typeof playing.catch == 'function')
            playing.catch(() => {});
        })
        .catch(() => {
          if (requestGeneration === apps.camera.requestGeneration) {
            apps.camera.showError();
          }
        });
      apps.camera.video.addEventListener('canplay', () => {
        if (!apps.camera.streaming) {
          apps.camera.aspectRatio =
            apps.camera.video.videoWidth / apps.camera.video.videoHeight;
          apps.camera.canvas.width = apps.camera.video.videoWidth;
          apps.camera.canvas.height = apps.camera.video.videoHeight;
          apps.camera.windowResizeObserver = new ResizeObserver(
            apps.camera.resize,
          );
          apps.camera.windowResizeObserver.observe($('.window.camera')[0], {
            box: 'border-box',
          });
          apps.camera.streaming = true;
        }
      });
    } else {
      hidewin('camera');
    }
  },
  stopStream: () => {
    clearTimeout(apps.camera.deviceLostTimer);
    apps.camera.deviceLostTimer = null;
    const video = apps.camera.video;
    const stream = video && video.srcObject;
    if (stream) {
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
    if (video) video.srcObject = null;
  },
  markDeviceLost: (requestGeneration: number) => {
    if (requestGeneration !== apps.camera.requestGeneration) return;
    apps.camera.streaming = false;
    const video = apps.camera.video;
    if (video) video.srcObject = null;
    apps.camera.showError();
  },
  watchTracks: (stream: MediaStream, requestGeneration: number) => {
    const tracks =
      typeof stream.getVideoTracks == 'function' ? stream.getVideoTracks() : [];
    tracks.forEach((track: MediaStreamTrack) => {
      track.addEventListener('ended', () => {
        apps.camera.markDeviceLost(requestGeneration);
      });
      track.addEventListener('mute', () => {
        if (requestGeneration !== apps.camera.requestGeneration) return;
        clearTimeout(apps.camera.deviceLostTimer);
        apps.camera.deviceLostTimer = setTimeout(() => {
          apps.camera.markDeviceLost(requestGeneration);
        }, 3000);
      });
      track.addEventListener('unmute', () => {
        if (requestGeneration !== apps.camera.requestGeneration) return;
        clearTimeout(apps.camera.deviceLostTimer);
        apps.camera.deviceLostTimer = null;
        apps.camera.hideError();
      });
    });
  },
  hideError: () => {
    $('#win-camera>.error').removeClass('show');
  },
  showError: () => {
    $('#win-camera>.error').addClass('show');
  },
  clearCanvas: () => {
    apps.camera.context.fillRect(
      0,
      0,
      apps.camera.canvas.width,
      apps.camera.canvas.height,
    );
  },
  takePhoto: () => {
    if (!apps.camera.streaming) {
      apps.camera.showError();
      return;
    }
    apps.camera.context.drawImage(
      apps.camera.video,
      0,
      0,
      apps.camera.canvas.width,
      apps.camera.canvas.height,
    );
    apps.camera.downloadLink.href = apps.camera.canvas.toDataURL('image/png');
    apps.camera.downloadLink.download = 'photo.png';
    apps.camera.downloadLink.click();
  },
  notice: () => {
    if (!localStorage.getItem('camera')) {
      showwin('camera-notice');
    } else {
      openapp('camera');
    }
  },
  resize: () => {
    let w = $('#win-camera')[0].offsetWidth,
      h = $('#win-camera')[0].offsetHeight;
    if (w / apps.camera.aspectRatio <= h) {
      if (!$('#win-camera').hasClass('v')) {
        $('#win-camera').removeClass('h');
        $('#win-camera').addClass('v');
      }
    } else if (w / apps.camera.aspectRatio >= h) {
      if (!$('#win-camera').hasClass('h')) {
        $('#win-camera').removeClass('v');
        $('#win-camera').addClass('h');
      }
    }
  },
  remove: () => {
    apps.camera.requestGeneration += 1;
    const video = apps.camera.video;
    const stream = video && video.srcObject;
    if (stream) {
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
    if (video) video.srcObject = null;
    if (apps.camera.windowResizeObserver) {
      apps.camera.windowResizeObserver.disconnect();
      apps.camera.windowResizeObserver = null;
    }
  },
} as unknown as AppDefinition;

export default camera;
