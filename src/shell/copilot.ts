import { $ } from '../core/dom';
import { apps } from '../core/app-registry';
import { openapp } from './launcher';
import { shownotice } from './notices';
import { toggletheme } from './theme';
import { decodeHtml } from '../core/utils';
import { msgDoneOperate } from './voice';

export const copilot = {
  history: [
    {
      role: 'system',
      content: `请使用中文对话。你一个是 ai 助手，名叫 AI Copilot，由云智 API 提供支持。
你可以在回答中发送对系统的一些指令。指令一并放在回答的最后。
多条指令用换行隔开。系统收到指令后会执行，且对用户隐藏回答后的指令。
你不能在对用户说的话的中间中提到、引用指令。绝不能要求用户执行指令。
1.指令"{openapp appid}";用来打开某个应用，用在下文"应用的功能介绍"中匹配的 id 代替其中的"appid"
2.指令"{openurl url}";用来在 Microsoft Edge 浏览器中打开某个 URL，其中用 URL 地址代替"url"。当用户想要搜索某内容，请用 bing 搜索
3.指令"{feedback copilot}";打开 ai 助手反馈界面，用于用户想对 ai 助手的功能提出反馈时帮助他打开
4.指令"{feedback win12}";打开反馈中心，当用户希望对除 ai 助手外的其他系统功能发送反馈时，帮他打开反馈中心
5.指令"{settheme theme}";用于切换系统的深色、浅色模式，区别于主题。用"light"表浅色，"dark"表深色，来替换其中的"theme"
如下是应用的功能介绍。
1.设置:id 为 setting;在个性化页面中可以设置系统的主题，主题色，是否启用动画、阴影、圆角、云母 mica 效果和为所有窗口开启亚克力透明效果。
2.关于 win12 网页版:id 为 about;简介页面有关于本项目的介绍说明与贡献者信息，更新记录页面有本项目的各版本更新记录。
3.Microsoft Edge 浏览器:id 为 edge;一个浏览器。因为浏览器跨域的限制，部分网页会显示"拒绝连接"而无法访问。
4.计算器:id 为 calc;
5.文件资源管理器:id 为 explorer;
6.任务管理器:id 为 taskmgr;
7.cmd 终端:id 为 terminal;
8.记事本:id 为 notepad;
9.python:id 为 python;
仅有以下关于此项目的信息。
1.Windows 12 网页版是一个开源项目，由谭景元原创，使用 Html,css,js，在网络上模拟、创新操作系统
2.项目的 Github 地址是 https://github.com/tjy-gitnub/win12
3.此项目使用 EPL v2.0 开源许可
当用户询问更多项目信息时，帮助他打开"关于 win12 网页版"应用。
比如这时用户说"请打开计算器"，你会回答什么？`,
    },
    {
      role: 'assistant',
      content: '好的呢，现在我就帮您打开计算器。\n{openapp calc}',
    },
    {
      role: 'system',
      content: '很好。现在开始与用户对话。',
    },
    {
      role: 'assistant',
      content: '欢迎使用 Windows 12 Copilot AI 助手，有什么可以帮您？',
    },
  ],
  init: () => {
    $('#copilot>.chat').html('');
    $('#copilot>.chat')
      .append(`<div class="line system"><p class="text">本 AI 助手基于 Deepseek v4 pro 模型，目前支持以下操作：<br>
        1.打开除 webapp 外大多应用<br>
        2.在浏览器中打开链接、搜索<br>
        3.发送对系统、AI 助手的反馈<br>
        4.切换颜色主题<br>
        需注意，根据相关法律法规，我们不向欧盟用户提供服务。</p></div>`);
    setTimeout(() => {
      $('#copilot>.chat').append(
        `<div class="line ai"><p class="text">欢迎使用 Windows 12，有什么可以帮您？</p></div>`,
      );
      $('#copilot>.inputbox').removeClass('disable');
      $('#copilot>.chat').scrollTop($('#copilot>.chat')[0].scrollHeight);
    }, 200);
  },
  send: (t, showusr = true, role = 'user') => {
    // 输入验证
    if (t.length == 0) {
      $('#copilot>.chat').append(
        '<div class="line system"><p class="text">请发一些有意义的东西</p></div>',
      );
      $('#copilot>.chat').scrollTop($('#copilot>.chat')[0].scrollHeight);
      msgDoneOperate();
      return;
    }

    $('#copilot>.inputbox').addClass('disable');

    // 敏感词过滤
    $.ajax({
      url: `https://yunzhiapi.cn/vip/win12/mgwbgl.php?msg=${encodeURIComponent(t)}`,
      method: 'GET',
      success: function (filteredText) {
        if (filteredText !== t) {
          triggerBlockAction();
          return;
        }
        proceedSend();
      },
      error: function () {
        proceedSend();
      },
    });

    /*  ollama/llama-guard safety check - commented out to prevent unavailability issues
        function proceedToSecondLayer() {
            $.ajax({
                url: 'llama-guard-api.freedom-323.workers.dev',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    model: 'llama-guard3:1b',
                    messages: [{ role: 'user', content: t }],
                    stream: false
                }),
                success: function (response) {
                    if (response && response.message && response.message.content.includes('unsafe')) {
                        triggerBlockAction();
                        return;
                    }
                    proceedSend();
                },
                error: function () {
                    $('#copilot>.chat').append(`<div class="line system"><p class="text">安全检查服务暂时不可用，请稍后再试。</p></div>`);
                    $('#copilot>.chat').scrollTop($('#copilot>.chat').scrollHeight);
                    msgDoneOperate();
                }
            });
        }
        */

    function triggerBlockAction() {
      $('#copilot>.chat').append(
        `<div class="line system"><p class="text">针对这个问题我无法为你提供相应解答。你可以尝试提供其他话题，我会尽力为你提供支持和解答。</p></div>`,
      );
      $('#copilot>.chat').scrollTop($('#copilot>.chat').scrollHeight);
      msgDoneOperate();
    }

    function proceedSend() {
      // 显示用户消息
      if (showusr) {
        $('#copilot>.chat').append(
          `<div class="line user"><p class="text">${t}</p></div>`,
        );
      }
      copilot.history.push({ role: role, content: t });
      $('#copilot>.chat').scrollTop($('#copilot>.chat')[0].scrollHeight);
      // 存储 uid
      const uid =
        localStorage.getItem('copilot_uid') ||
        (() => {
          const newUid = Math.floor(100000 + Math.random() * 900000); // 生成 100000-999999 的随机六位数
          localStorage.setItem('copilot_uid', newUid.toString());
          return newUid;
        })();
      // 构建 API 请求 URL
      const encodedQuestion = encodeURIComponent(t);
      const apiUrl = `https://yunzhiapi.cn/vip/win12/deepseek-v4-pro/index.php?question=${encodedQuestion}&system=${encodeURIComponent(copilot.history[0].content)}&uid=${uid}`;

      // API 请求
      $.ajax({
        url: apiUrl,
        method: 'GET',
        success: function (responseText) {
          msgDoneOperate();

          // 处理特殊命令
          let rt = responseText;
          let r = [];
          if (/{.+}/.test(rt)) {
            r = rt.match(/{.+?}/g) || [];
          }

          if (r.length) {
            for (const i of r) {
              if (/{openapp .+?}/.test(i)) {
                let t = i.match(/(?<={openapp ).+(?=})/)[0];
                if ($('.window.' + t).length) {
                  openapp(t);
                  rt = rt.replace(
                    i,
                    `<div class="action"><p class="tit">打开应用</p><p class="detail">${$(`.window.${t}>.titbar>p`).text()}</p></div>`,
                  );
                } else {
                  rt = rt.replace(
                    i,
                    `<div class="action"><p class="tit">打开应用</p><p class="detail">${t} <span style="color:red">(AI 理解力较差，见谅)</span></p></div>`,
                  );
                }
              } else if (/{openurl .+?}/.test(i)) {
                const t = i.match(/(?<={openurl ).+(?=})/)[0];
                openapp('edge');
                apps.edge.newtab();
                apps.edge.goto(t);
                rt = rt.replace(
                  i,
                  `<div class="action"><p class="tit">打开 URL</p><p class="detail">${decodeHtml(t)}</p></div>`,
                );
              } else if (/{feedback win12}/.test(i)) {
                shownotice('feedback');
                rt = rt.replace(
                  i,
                  '<div class="action"><p class="tit">反馈</p><p class="detail">关于 Windows 12 网页版</p></div>',
                );
              } else if (/{feedback copilot}/.test(i)) {
                shownotice('feedback-copilot');
                rt = rt.replace(
                  i,
                  '<div class="action"><p class="tit">反馈</p><p class="detail">关于 Windows 12 Copilot</p></div>',
                );
              } else if (/{settheme .+?}/.test(i)) {
                const t = i.match(/(?<={settheme ).+(?=})/)[0];
                if (
                  (t == 'light' && $(':root').hasClass('dark')) ||
                  (t == 'dark' && !$(':root').hasClass('dark'))
                ) {
                  toggletheme();
                }
                if (t != 'light' && t != 'dark')
                  rt = rt.replace(
                    i,
                    `<div class="action"><p class="tit">切换外观模式</p><p class="detail">${t} 模式 <span style="color:red">(AI 理解力较差，见谅)</span></p></div>`,
                  );
                else
                  rt = rt.replace(
                    i,
                    `<div class="action"><p class="tit">切换外观模式</p><p class="detail">${t == 'dark' ? '深色' : '浅色'} 模式</p></div>`,
                  );
              }
            }
            $('#copilot>.chat').append(
              `<div class="line ai"><div class="text">${rt}</div></div>`,
            );
          } else {
            $('#copilot>.chat').append(
              `<div class="line ai"><p class="text">${decodeHtml(rt)}</p></div>`,
            );
          }

          copilot.history.push({ role: 'assistant', content: responseText });
          $('#copilot>.chat').scrollTop($('#copilot>.chat')[0].scrollHeight);
          msgDoneOperate();
        },
        error: function (error) {
          console.log(error);
          $('#copilot>.chat').append(
            '<div class="line system"><p class="text">发生错误，请查看控制台输出或重试</p></div>',
          );
          $('#copilot>.chat').scrollTop($('#copilot>.chat')[0].scrollHeight);
          msgDoneOperate();
        },
      });
    }
  },
  ana: (resp) => {},
};
