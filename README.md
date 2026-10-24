<p align="center">
    <img src="./icon/windows12.svg" width="100" height="100">
</p>

<h1 align="center">Win12 Online (TypeScript)</h1>

<p align="center">
  <strong>这是 <a href="https://github.com/win12-online/win12">Win12 Online</a> 的 TypeScript 重构版本</strong>
</p>

<p align="center">
  <a href="https://github.com/Shawn-Yu-Dev/win12-online-ts/actions"><img src="https://img.shields.io/github/actions/workflow/status/Shawn-Yu-Dev/win12-online-ts/deploy-pages.yml?label=Pages" alt="Pages"/></a>
  <a href="https://github.com/Shawn-Yu-Dev/win12-online-ts"><img src="https://img.shields.io/github/stars/Shawn-Yu-Dev/win12-online-ts.svg" alt="Stars"/></a>
  <a href="https://github.com/win12-online/win12"><img src="https://img.shields.io/github/stars/win12-online/win12.svg?label=original%20stars" alt="Original stars"/></a>
  <img src="https://img.shields.io/badge/license-EPL--2.0-blue.svg" alt="License"/>
</p>

<p align="center">
  <a href="#在线体验">在线体验</a> ·
  <a href="https://github.com/win12-online/win12">原项目仓库</a> ·
  <a href="#开发">本地开发</a>
</p>

---

## 项目说明

本仓库是对开源项目 **[Win12 Online](https://github.com/win12-online/win12)** 的 **TypeScript + Vite 重构实验**。

| 项目       | 说明                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| **原项目** | [win12-online/win12](https://github.com/win12-online/win12) — 成熟的网页版 Windows 12 模拟器（约 7k+ stars） |
| **本仓库** | 使用 TypeScript、Vite 重新组织与类型化桌面 Shell，目标是提升可维护性与工程化                                 |
| **关系**   | 基于原项目资源与思路进行重构，**不是官方 fork**，目前仍在早期阶段                                            |

> [!IMPORTANT]
> 想要完整、稳定的在线体验，请优先使用原项目：
>
> **在线体验**：https://win12-online.github.io/win12/boot.html
>
> **原仓库**：https://github.com/win12-online/win12

### 本仓库目标

- 用 TypeScript 为桌面 Shell 与核心逻辑提供类型约束
- 使用 Vite 做现代构建与多入口打包
- 逐步模块化（`src/core`、`src/shell`、`src/apps`、`src/features` 等）
- 保留原项目的 UI 资源、交互体验与开源协议（EPL-2.0）

### 当前状态

- 工程脚手架已搭建（Vite + TypeScript + 基础测试）
- 代码结构开始模块化，但**功能完整度仍低于原项目**
- 仍部分依赖 jQuery，类型检查目前为宽松模式（`strict: false`）
- 适合关注「重构过程」或二次开发，不适合作为生产级替代品

---

## 在线体验

### 本仓库（TypeScript 重构版）

启用 GitHub Pages 后访问：

- **演示地址**：https://shawn-yu-dev.github.io/win12-online-ts/
- 入口建议从 `boot.html` 或 `desktop.html` 进入（与原项目一致）

> 首次启用 Pages 后，可能需要几分钟才会生效。若 404，请确认仓库 Settings → Pages 已选择 **GitHub Actions** 作为发布源。

### 原项目（推荐完整体验）

- 在线体验：https://win12-online.github.io/win12/boot.html
- 桌面客户端：[win12-desktop](https://github.com/win12-online/win12-desktop)（基于 Tauri）

---

## 技术栈

- **构建**：Vite 7
- **语言**：TypeScript 5.9
- **运行时依赖**：jQuery（迁移中）
- **测试**：Node 内置 test + Playwright（smoke）
- **协议**：Eclipse Public License 2.0（与原项目一致）

---

## 开发

```bash
# 克隆（如有 submodule，请带上）
git clone --recurse-submodules https://github.com/Shawn-Yu-Dev/win12-online-ts.git
cd win12-online-ts

# 安装依赖
npm install

# 本地开发
npm run dev

# 类型检查
npm run typecheck

# 构建
npm run build

# 预览构建结果
npm run preview
```

开发服务器默认端口：`5173`。

---

## 目录结构（简要）

```
src/
  core/       # 核心逻辑
  shell/      # 桌面 Shell
  apps/       # 应用相关
  features/   # 功能模块
  entries/    # 入口（含 service worker）
  types/      # 类型定义
apps/         # 静态应用资源（继承自原项目）
styles/       # 样式
desktop.html / boot.html / ...  # 多页面入口
```

---

## 原项目与致谢

本项目基于并致敬：

- **原仓库**：[win12-online/win12](https://github.com/win12-online/win12)
- **维护组织**：[win12-online](https://github.com/win12-online)
- **早期核心贡献者**：tjy-gitnub、NB-group、782 等（详见原仓库 Contributors）

请遵守原项目的开源声明与附加条款。使用、修改或分发时，请保留原作者信息与项目链接。

---

## 开源协议

- 源代码：**EPL-2.0**
- 部分媒体与文字内容遵循原项目的 CC BY-SA 4.0 / CC0 约定

详见仓库内 `LICENSE` 与原项目 README 中的开源声明。

---

## 相关链接

| 资源                   | 链接                                            |
| ---------------------- | ----------------------------------------------- |
| 本仓库                 | https://github.com/Shawn-Yu-Dev/win12-online-ts |
| 原项目                 | https://github.com/win12-online/win12           |
| 原项目在线体验         | https://win12-online.github.io/win12/boot.html  |
| 原项目桌面版           | https://github.com/win12-online/win12-desktop   |
| 本仓库 Pages（启用后） | https://shawn-yu-dev.github.io/win12-online-ts/ |
