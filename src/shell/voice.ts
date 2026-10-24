import { $ } from '../core/dom';
import { state } from '../core/state';
import { shownotice } from './notices';

let voiceBall: HTMLElement;
let nbFlag = true;
let pos1 = 0,
  pos2 = 0,
  pos3 = 0,
  pos4 = 0;
let isDragging = false;

export function dragMouseDown(e) {
  e.preventDefault();
  pos3 = e.clientX;
  pos4 = e.clientY;
  document.addEventListener('pointermove', elementDrag);
  isDragging = false;
}

export function elementDrag(e) {
  e.preventDefault();
  pos1 = pos3 - e.clientX;
  pos2 = pos4 - e.clientY;
  pos3 = e.clientX;
  pos4 = e.clientY;
  voiceBall.style.top = voiceBall.offsetTop - pos2 + 'px';
  voiceBall.style.left = voiceBall.offsetLeft - pos1 + 'px';
  isDragging = true;
}

export function stopDrag() {
  document.removeEventListener('pointermove', elementDrag);
  if (!isDragging) {
    startSpeechRecognition();
  }
}

export function insertTextAtCursor(text) {
  let range, selection;

  if (window.getSelection) {
    selection = window.getSelection();
    if (!selection) return;

    if (selection.rangeCount) {
      range = selection.getRangeAt(0);

      if (
        (range.commonAncestorContainer.parentNode as HTMLElement)
          ?.isContentEditable
      ) {
        range.collapse(false);
        var textNode = document.createTextNode(text);
        range.insertNode(textNode);

        range.setEndAfter(textNode);
        range.setStartAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        const el = document.activeElement as HTMLInputElement;
        const start = el.selectionStart ?? 0;
        const value = el.value;
        el.value =
          value.slice(0, start) + text + value.slice(el.selectionEnd ?? start);
        el.selectionStart = el.selectionEnd = start + text.length;
      }
    }
  }
}

export function startSpeechRecognition() {
  const Recognition =
    (window as any).webkitSpeechRecognition ||
    (window as any).SpeechRecognition;
  const recognition = new Recognition();
  recognition.lang = 'zh-CN';

  if (nbFlag) {
    shownotice('recognition');
    nbFlag = false;
  } else {
    recognition.onresult = function (event) {
      var result = event.results[0][0].transcript;
      insertTextAtCursor(result);
    };

    recognition.start();
  }
}

export function updateVoiceBallStatus() {
  document
    .getElementById('voiceBall')
    .style.setProperty('display', state.useMicVoice ? 'block' : 'none');
}

export function decodeHtml(s) {
  $('#translater').text(s);
  return $('#translater').html().replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');
}
export function msgDoneOperate() {
  $('#copilot>.inputbox').removeClass('disable');
  setTimeout(() => {
    $('#copilot>.inputbox>.input').focus();
  }, 100); // 延迟 0.1s 以避免与 blur 方法冲突
}

export function initVoice(): void {
  voiceBall = document.getElementById('voiceBall') as HTMLElement;
  voiceBall.addEventListener('pointerdown', dragMouseDown);
  voiceBall.addEventListener('pointerup', stopDrag);
}
