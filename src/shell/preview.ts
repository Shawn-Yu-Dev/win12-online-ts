import { $ } from '../core/dom';

// 任务栏悬停预览窗口 by @fzlzjerry

let previewTimeout: ReturnType<typeof setTimeout> | undefined;

export function showTaskbarPreview(
  name: string,
  event: { currentTarget: EventTarget | null },
): void {
  clearTimeout(previewTimeout);

  const preview = document.getElementById('taskbar-preview');
  if (!preview) {
    const previewEl = document.createElement('div');
    previewEl.id = 'taskbar-preview';
    previewEl.innerHTML = `
            <div class="preview-title">
                <img src="" alt="">
                <span></span>
            </div>
            <div class="preview-content">
                <div class="preview-window"></div>
            </div>
        `;
    document.body.appendChild(previewEl);
  }

  const win = $(`.window.${name}`);
  const previewBox = $('#taskbar-preview');
  if (!win.length || win.hasClass('min')) {
    previewBox.removeClass('show');
    previewBox.find('.preview-title img').attr('src', '');
    previewBox.find('.preview-title span').text('');
    previewBox.find('.preview-content .preview-window').empty();
    return;
  }
  if (win.length) {
    const preview = previewBox;
    const taskbarItem = $(event.currentTarget as HTMLElement);
    const itemRect = taskbarItem[0].getBoundingClientRect();

    // Set window title and icon
    const titleImg = win.find('.titbar img.icon').attr('src');
    const title =
      win.find('.titbar p').text() || win.find('.titbar span').text();

    preview.find('.preview-title img').attr('src', titleImg);
    preview.find('.preview-title span').text(title);

    // Create simplified window preview
    const previewWindow = preview.find('.preview-content .preview-window');
    previewWindow.empty();

    // Clone important window elements for preview
    const content = win.find('.content').clone();
    content.find('script').remove(); // Remove any scripts
    content.find('iframe').remove(); // Remove iframes

    // Scale down the content
    content.css({
      transform: 'scale(0.2)',
      transformOrigin: 'top left',
      width: '500%', // 1/0.2 = 5
      height: '500%',
    });

    previewWindow.append(content);
    preview.addClass('show');

    // Set preview position
    console.log(content[0].offsetWidth * 0.2);
    preview.css({
      left: itemRect.left - (content[0].offsetWidth * 0.2) / 2,
      bottom: '60px',
    });
  }
}

export function hideTaskbarPreview(): void {
  previewTimeout = setTimeout(() => {
    $('#taskbar-preview').removeClass('show');
  }, 200);
}

// Add hover events to taskbar items
$(document).on('mouseenter', '#taskbar>a', function (this: HTMLElement, e) {
  const name = this.className.split(' ')[0];
  showTaskbarPreview(name, e);
});

$(document).on('mouseleave', '#taskbar>a', function () {
  hideTaskbarPreview();
});

// Add hover events to preview
$(document).on('mouseenter', '#taskbar-preview', function () {
  clearTimeout(previewTimeout);
});

$(document).on('mouseleave', '#taskbar-preview', function () {
  hideTaskbarPreview();
});

export function initTaskbarPreview(): void {
  $(document).on('mouseenter', '#taskbar>a', function (this: HTMLElement, e) {
    const name = this.className.split(' ')[0];
    showTaskbarPreview(name, e);
  });
  $(document).on('mouseleave', '#taskbar>a', hideTaskbarPreview);
  $(document).on('mouseenter', '#taskbar-preview', () =>
    clearTimeout(previewTimeout),
  );
  $(document).on('mouseleave', '#taskbar-preview', hideTaskbarPreview);
}
