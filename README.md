<p align="center">
    <img src="./icon/windows12.svg" width="100" height="100">
</p>

<h1 align="center">Win12 Online (TypeScript)</h1>

<p align="center">
  <strong><a href="https://github.com/win12-online/win12">Win12 Online</a> 的 TypeScript + Vite 重构版</strong>
</p>

<p align="center">
  <a href="https://github.com/Shawn-Yu-Dev/win12-online-ts/actions/workflows/deploy-pages.yml"><img src="https://img.shields.io/github/actions/workflow/status/Shawn-Yu-Dev/win12-online-ts/deploy-pages.yml?label=Pages" alt="Pages"/></a>
  <a href="https://github.com/Shawn-Yu-Dev/win12-online-ts/actions/workflows/code-check.yaml"><img src="https://img.shields.io/github/actions/workflow/status/Shawn-Yu-Dev/win12-online-ts/code-check.yaml?label=CI" alt="CI"/></a>
  <a href="https://github.com/Shawn-Yu-Dev/win12-online-ts"><img src="https://img.shields.io/github/stars/Shawn-Yu-Dev/win12-online-ts.svg" alt="Stars"/></a>
  <a href="https://github.com/win12-online/win12"><img src="https://img.shields.io/github/stars/win12-online/win12.svg?label=upstream" alt="Upstream stars"/></a>
  <img src="https://img.shields.io/badge/license-EPL--2.0-blue.svg" alt="License"/>
</p>

<p align="center">
  <a href="#在线体验">在线体验</a> ·
  <a href="#功能概览">功能概览</a> ·
  <a href="#快速开始">快速开始</a> ·
  <a href="#迁移进度">迁移进度</a> ·
  <a href="https://github.com/win12-online/win12">原项目</a>
</p>

---

## 项目说明

本仓库把 **[Win12 Online](https://github.com/win12-online/win12)** 的桌面 Shell、窗口系统、应用逻辑与数据层重构为 **TypeScript ES Module**，并使用 **Vite** 做多入口构建。

| 项目       | 说明                                                             |
| ---------- | ---------------------------------------------------------------- |
| **原项目** | [win12-online/win12](https://github.com/win12-online/win12)      |
| **本仓库** | TypeScript + Vite 重构版，目标是更好的可维护性、类型约束与工程化 |
| **关系**   | 基于原项目的资源、界面与交互进行重构，**不是官方 fork**          |
| **状态**   | 核心功能已迁移；仍在持续对齐上游、补充测试与收紧类型             |

> [!IMPORTANT]
> 原项目功能更完整、更新更及时。想要稳定体验请优先访问：
> **https://win12-online.github.io/win12/boot.html**

### 为什么做这个重构

- **类型约束**：窗口、应用、数据表逐步改为 TypeScript，降低全局变量耦合带来的隐式错误。
- **现代构建**：Vite 负责多页面打包、按需加载与资源哈希，`desktop.html` 不再手工维护脚本顺序。
- **模块边界**：`core` / `shell` / `apps` / `features` / `data` / `scripts` / `entries` 分层清晰。
- **可测试**：把地址栏解析、`.properties` 解析、Service Worker 缓存策略、超时桥接等逻辑抽成可单测模块。
- **保留资产**：继续复用上游的 HTML、CSS、图标、媒体与语言包，视觉与交互尽量保持一致。

---

## 在线体验

### 本仓库（TypeScript 重构版）

启用 GitHub Pages 后访问：

- **演示地址**：<https://shawn-yu-dev.github.io/win12-online-ts/>
- 根路径会进入开机动画；也可以直接访问：
  - `boot.html`：开机动画 → 桌面
  - `desktop.html`：直接进入桌面
  - `index.html?to=desktop`：跳过开机动画
  - `bios.html`：BIOS 设置页（开机时按 `F2` 也可进入）
  - `games/minesweeper.html`：扫雷

> [!NOTE]
> 如果 Pages 返回 404，请确认仓库 **Settings → Pages → Source** 已选择 **GitHub Actions**。

### 原项目（推荐完整体验）

- 在线体验：<https://win12-online.github.io/win12/boot.html>
- 桌面版（Tauri）：<https://github.com/win12-online/win12-desktop>

---

## 功能概览

### 桌面 Shell

- 开机动画、BIOS 设置、蓝屏与关机/重启页面
- 登录层、本地密码（Tauri）、启动提示与模态焦点管理
- 桌面图标、拖拽吸附网格、右键菜单、快捷键
- 窗口打开/关闭/最大化/最小化/还原/拖拽/缩放/层级管理
- 任务栏、开始菜单、搜索、小组件、任务栏悬停预览
- 深浅色主题、主题色、WebGL 背景特效、壁纸
- 通知对话框、工具提示、下拉面板、语音输入状态
- 中英繁三语界面（`.properties` 语言包 + 缺键回退）
- PWA manifest 与 Service Worker 缓存/更新策略

### 内置应用（30 个窗口 / 31 个注册模块）

| 类别       | 应用                                                                                    |
| ---------- | --------------------------------------------------------------------------------------- |
| 系统与工具 | 设置、任务管理器、终端、运行、搜索、关于、WinVer、Windows 12 介绍、Windows 安全中心     |
| 文件与浏览 | 文件资源管理器、Edge、Microsoft Store、VS Code / macOS / Bilibili / Copilot 等 Web 应用 |
| 创作与办公 | 记事本、Word、代码编辑器、Python 编辑器、白板、图片查看器、媒体播放器、PDF 查看器、相机 |
| 娱乐       | 扫雷、计算器、新闻/农历小组件、终端彩蛋（matrix / snow / dance / starwars）             |
| 运行环境   | Python（Pyodide）、WSA 入口、Windows 12 演示页                                          |

### 数据与系统能力

- **虚拟文件系统**：Explorer 内置目录树、驱动器与本地目录挂载（File System Access API）
- **标签页系统**：Edge / Explorer 多标签、拖拽排序、历史前进后退
- **代码与文档**：Ace 编辑器、Markdown 预览、Python 运行、字体预览
- **性能面板**：CPU / 内存 / 磁盘 / 网络 / GPU 图表（Chart.js）
- **Tauri 桥接**：电量、登录密码、设置持久化、桌面版更新检查（Web 端自动降级）

---

## 迁移进度

### 已完成

| 上游文件 / 模块                     | 本仓库实现                                                        |
| ----------------------------------- | ----------------------------------------------------------------- |
| `desktop.js`（Shell 主逻辑）        | `src/shell/*`、`src/core/*`、`src/globals.ts`                     |
| `module/window.js`                  | `src/core/windows.ts`                                             |
| `module/widget.js`                  | `src/features/widgets.ts`                                         |
| `module/tab.js`                     | `src/features/tab.ts`                                             |
| `module/nowPlaying.js`              | `src/features/nowPlaying.ts`                                      |
| `module/apps.js`                    | `src/apps/*.ts`（按应用拆分）                                     |
| `module/shared.js`                  | `src/apps/shared.ts`                                              |
| `data/*.js`                         | `src/data/*.ts`                                                   |
| `scripts/boot_kernel.js`            | `src/entries/boot.ts`                                             |
| `scripts/bios_kernel.js`            | `src/entries/bios.ts`                                             |
| `scripts/i18n-boot.js`              | `src/core/i18n.ts`                                                |
| `scripts/jquery.i18n.properties.js` | `src/vendor/jquery.i18n.properties.ts` + `src/core/properties.ts` |
| `scripts/edge-address.js`           | `src/scripts/edge-address.ts`                                     |
| `scripts/edge-bookmarks.js`         | `src/scripts/edge-bookmarks.ts`                                   |
| `scripts/calculator_kernel.js`      | `src/scripts/calculator.ts`                                       |
| `scripts/lunar.js`                  | `src/scripts/lunar.ts`                                            |
| `scripts/mount-windows.js`          | `src/shell/mount-windows.ts`                                      |
| `scripts/news.js`                   | `src/scripts/news.ts`                                             |
| `scripts/startup.js`                | `src/shell/startup.ts`                                            |
| `scripts/terminal.js` / `-eggs.js`  | `src/scripts/terminal.ts` / `terminal-eggs.ts`                    |
| `scripts/utils.js`                  | `src/core/utils.ts`                                               |
| `scripts/webgl.js`                  | `src/scripts/webgl.ts`                                            |
| `sw.js`                             | `src/entries/service-worker.ts`（构建为 `dist/sw.js`）            |
| `tauri/*.js`                        | `src/tauri/*.ts`                                                  |

### 当前差异与限制

- **必须通过 HTTP(S) 访问**：改用 ES Module 后，直接双击 `dist/*.html`（`file://`）会被浏览器 CORS 拦截；请使用 `npm run dev`、`npm run preview` 或静态服务器。
- **CDN 依赖**：Pyodide、Ace、Chart.js、marked、DOMPurify 仍从 CDN 加载；离线或网络受限时相关应用会降级。
- **Tauri 专属能力**：本地密码、电量、自动更新检查在普通浏览器中不可用或仅显示提示。
- **类型严格度**：`tsconfig` 目前仍是宽松模式（`strict: false`），但已启用 `noImplicitThis` 并持续收紧；应用注册表保留索引签名。
- **移动端**：沿用上游移动端适配，竖屏会显示旋转提示，但整体仍以桌面浏览器为主。
- **视觉一致性**：HTML/CSS 资源继承自上游，重构优先保证行为一致，不承诺逐像素对齐每个上游版本。

---

## 技术栈

| 项目   | 选型                                                       |
| ------ | ---------------------------------------------------------- |
| 语言   | TypeScript 5.9                                             |
| 构建   | Vite 7（多入口、资源哈希、Service Worker 输出）            |
| 运行时 | 原生 DOM + jQuery 3.7（部分历史逻辑仍在迁移）              |
| 测试   | Node.js 内置 `node:test` + Playwright smoke                |
| 格式化 | Prettier 3                                                 |
| 部署   | GitHub Pages（GitHub Actions）/ 任意静态托管               |
| 许可证 | EPL-2.0（代码） + CC BY-SA 4.0 / CC0（媒体与文字，见上游） |

---

## 快速开始

### 环境要求

- Node.js **20+**（CI 使用 Node 24）
- npm 10+
- 可选：Chromium（运行 Playwright smoke 测试）

### 安装与开发

```bash
git clone --recurse-submodules https://github.com/Shawn-Yu-Dev/win12-online-ts.git
cd win12-online-ts
npm install

npm run dev          # 开发服务器，默认 http://localhost:5173
npm run typecheck    # TypeScript 类型检查
npm run build        # 类型检查 + 构建 + 拷贝静态资源到 dist/
npm run preview      # 预览 dist/
```

> 语言包位于 `lang` 子模块。若克隆时忘记 `--recurse-submodules`，执行：
>
> ```bash
> git submodule update --init --recursive
> ```

### 测试

```bash
npm test             # 单元测试：地址栏解析、属性文件解析、超时、SW 缓存、入口跳转
npm run check        # 格式检查 + 类型检查 + 单元测试
npm run format       # 自动格式化

# Playwright smoke（先启动 dev 或 preview）
npx playwright install chromium
npm run dev
BASE_URL=http://localhost:5173 npm run test:smoke
```

Smoke 测试会验证：30 个窗口挂载、开机遮罩退出、启动提示、计算器、文件资源管理器、Edge、任务栏以及扫雷交互。

### 构建产物

```bash
npm run build
ls dist
```

`dist/` 包含多页面入口、`assets/` 哈希资源、`sw.js`、语言包、图标、字体与静态页面，可直接部署到任意静态服务器。

---

## 目录结构

```text
src/
├── core/        # DOM、i18n、窗口、状态、可访问性、纯工具（properties/async/redirect）
├── shell/       # 桌面、任务栏、开始菜单、通知、登录、主题、启动流程
├── apps/        # 31 个应用模块 + 注册表 + 共享实现
├── features/    # 小组件、标签页、Now Playing
├── scripts/     # 终端、扫雷/计算器、Edge 地址栏、农历、新闻、WebGL 等
├── data/        # 图标、右键菜单、通知、任务栏面板、窗口模板、任务表
├── entries/     # 多页面入口：desktop/boot/bios/bluescreen/index/mainpage/404/SW
├── tauri/       # Tauri 桥接与电量
├── vendor/      # 第三方 jQuery i18n 插件的 ES Module 封装
└── types/       # 全局类型声明

apps/            # 上游静态应用资源（样式、图标）
styles/          # 设计令牌
desktop.html     # 桌面壳层 HTML（由 src/main.ts 驱动）
boot.html / bios.html / bluescreen.html / index.html / mainpage.html / 404.html
games/           # 扫雷页面
tests/           # 单元测试与 Playwright smoke
scripts/         # 构建辅助（静态资源拷贝）
```

### 启动流程

```text
index.html ──> boot.html ──(F2)──> bios.html
     │              │
     └───────> desktop.html ──> src/main.ts
                                   │
        installJQueryGlobal → registerAllApps → installGlobals
                                   │
        initDom / shell / features / apps.webapps.init
                                   │
                               win12Start()
```

`desktop.html` 现在只保留一个 `<script type="module" src="/src/main.ts">`，脚本顺序由依赖图决定；开发者约定与全局函数说明仍保留在文件顶部注释中。

---

## 部署

### GitHub Pages（推荐）

仓库已包含 `.github/workflows/deploy-pages.yml`：

1. 推送到 `main` 或手动触发 **Deploy GitHub Pages**。
2. 工作流会安装依赖、运行类型检查与单元测试、构建 `dist/`、上传并部署。
3. 在仓库 **Settings → Pages** 选择 **GitHub Actions**。

Vite `base` 设置为 `./`，因此部署在子路径（如 `/win12-online-ts/`）也能正常工作。

### 其他静态托管

```bash
npm run build
# 将 dist/ 上传到 Netlify / Vercel / Cloudflare Pages / Nginx
```

Service Worker 需要 HTTPS（`localhost` 除外）。

---

## 开发约定

- 应用实现放在 `src/apps/<app>.ts`，并在 `src/apps/index.ts` 注册。
- 应用窗口 HTML 模板集中在 `src/data/window-templates.ts`。
- 需要暴露给内联 `onclick` 的全局函数统一在 `src/globals.ts` 安装。
- 新增纯逻辑优先抽成无 DOM 依赖的模块，并补 `tests/unit/*.test.mjs`。
- 提交前运行 `npm run check`（Prettier + TypeScript + 单元测试）。

### 添加一个应用（简版）

1. 在 `src/apps/` 新建模块并导出应用对象（`init` / `page` 等）。
2. 在 `src/data/window-templates.ts` 添加对应 `.window.<name>` 模板。
3. 在 `src/apps/index.ts` 的 `registerApps({...})` 中注册。
4. 如需开始菜单入口，修改 `desktop.html` 的 `#startmenu-l>list`。
5. 如需图标映射，修改 `src/data/app-icons.ts`。

---

## 贡献与反馈

- 上游问题与功能讨论：<https://github.com/win12-online/win12/issues>
- 本仓库重构问题：<https://github.com/Shawn-Yu-Dev/win12-online-ts/issues>
- 提交 PR 前请阅读 `CONTRIBUTING.md` 与 `CODE_OF_CONDUCT.md`，并保持 Prettier 格式。

---

## 致谢

本项目基于并致敬 **[win12-online/win12](https://github.com/win12-online/win12)** 及其贡献者（tjy-gitnub、NB-group、782 等，完整名单见上游仓库）。

界面、图标、媒体、语言包等资源来自上游；TypeScript 重构层由本仓库维护。使用、修改或分发时请保留原作者信息与项目链接，并遵守相应许可证。

---

## 开源协议

- **源代码**：Eclipse Public License 2.0（EPL-2.0），见 `LICENSE`
- **媒体文件与文字内容**：CC BY-SA 4.0（另有声明除外），部分语言包为 CC0，详见 `LICENSE-CC` 与上游 README
- 本项目与 Microsoft Corporation 无任何隶属、赞助或授权关系；“Windows”等商标归 Microsoft 所有，仅用于说明性目的。

---

## 相关链接

| 资源           | 链接                                              |
| -------------- | ------------------------------------------------- |
| 本仓库         | <https://github.com/Shawn-Yu-Dev/win12-online-ts> |
| 本仓库演示     | <https://shawn-yu-dev.github.io/win12-online-ts/> |
| 原项目         | <https://github.com/win12-online/win12>           |
| 原项目在线体验 | <https://win12-online.github.io/win12/boot.html>  |
| 原项目桌面版   | <https://github.com/win12-online/win12-desktop>   |
| 语言包仓库     | <https://github.com/win12-online/win12-locales>   |
