# Go Learning App / 围棋学习应用

*An interactive, front-end Go (Weiqi/Baduk) learning playground with real-time visual aids.*
*一个带有实时视觉辅助功能的交互式前端围棋（Weiqi/Baduk）学习平台。*

This project helps newcomers understand the fundamentals of Go by visualising liberties, territory influence and status changes directly on the board. Everything runs in the browser – no back-end services are required – which makes the app easy to deploy and share.  
本项目通过在棋盘上直观展示气、势力范围与状态变化，帮助初学者理解围棋基础。应用完全运行在浏览器中，无需后端服务，因而易于部署与分享。

## Table of Contents / 目录

1. [Features 功能特色](#features-功能特色)
2. [Quick Start 快速开始](#quick-start-快速开始)
3. [Project Structure 项目结构](#project-structure-项目结构)
4. [Development Guide 开发指南](#development-guide-开发指南)
5. [Roadmap 路线图](#roadmap-路线图)
6. [Contributing 参与贡献](#contributing-参与贡献)
7. [Community Standards 社区守则](#community-standards-社区守则)
8. [License 许可证](#license-许可证)

## Features (功能特色)

### Core Gameplay (核心对弈体验)

- **Live liberty heatmap** – highlight every group’s liberties with translucent overlays.  
  **实时气数热图**——通过半透明覆盖高亮每个棋组的剩余气。
- **Multiple board sizes** – switch seamlessly between 9×9, 13×13, and 19×19 boards without refreshing the page.  
  **多种棋盘尺寸**——在不刷新页面的情况下无缝切换 9×9、13×13、19×19 棋盘。
- **Full Go rules** – automatic captures, ko detection, suicide move prevention, and alternating turn order.  
  **完整围棋规则实现**——自动提子、检测劫争、防止自杀落子，并保持轮流下棋。

### Learning Helpers (学习辅助)

- **Influence & territory estimation** – see which areas each player controls using an influence algorithm.  
  **势力与地盘估算**——基于势力算法展示每位玩家控制的区域。
- **Life & death alerts** – get visual cues for endangered groups (liberties ≤ 1).  
  **生死警示**——当棋组濒临死亡（气数 ≤ 1）时给出视觉提示。
- **Move numbering & tutorials** – optional move counters and built-in guides for foundational Go concepts.  
  **步骤编号与教程**——提供可选的着手编号以及内置的基础围棋概念教程。

### Experience & UI (体验与界面)

- **Action sidebar** – quick toggles for liberties, influence layers, hints, and board sizing.  
  **操作侧栏**——快速切换气数、势力层、提示以及棋盘尺寸。
- **Responsive layout** – the interface stays usable on desktops, tablets, and large mobile screens.  
  **响应式布局**——界面可适配桌面、平板与大型手机屏幕。
- **Pure front-end** – deploy to any static hosting provider (GitHub Pages, Vercel, Netlify, etc.).  
  **纯前端实现**——可部署到 GitHub Pages、Vercel、Netlify 等任意静态托管平台。

## Quick Start (快速开始)

> **Requirements**  
> **环境要求**
>
> - Node.js **20.19.0** or newer (Vite 7 requires this minimum)  
>   Node.js **20.19.0** 或更高版本（Vite 7 的最低要求）
> - npm **10.x** (bundled with Node 20)  
>   npm **10.x**（随 Node 20 一同提供）

```bash
# Install dependencies
npm install

# Start a local dev server (http://localhost:5173)
npm run dev

# Build the production bundle
npm run build

# Preview the production build locally
npm run preview
```

The generated static assets in `dist/` can be hosted on any static site provider.  
`dist/` 目录下生成的静态资源可以托管到任意静态网站服务提供商。

## Project Structure (项目结构)

```
go-learning-app/
├── public/
├── src/
│   ├── components/
│   │   ├── GoBoard.vue          # Core board + interactions
│   │   ├── TerritoryOverlay.vue # Liberties & territory visualisation
│   │   ├── GameControls.vue     # Sidebar controls
│   │   └── Tutorial.vue         # Built-in learning content
│   ├── composables/             # Reusable logic (liberties, influence)
│   ├── stores/                  # Pinia store managing game state
│   ├── types/                   # Shared TS typings
│   └── utils/                   # Go rule implementation helpers
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
└── vite.config.ts
```

Use this structure to locate UI components, shared logic, and configuration files at a glance.  
借助该结构可以快速定位界面组件、共享逻辑与配置文件。

## Development Guide (开发指南)

- **TypeScript first** – keep new code typed; extend shared types in `src/types` where necessary.  
  **优先使用 TypeScript**——为新代码补充类型；必要时在 `src/types` 中扩展共享类型定义。
- **Pinia actions** – mutate game state via actions defined in `src/stores/game.ts`.  
  **使用 Pinia actions**——通过 `src/stores/game.ts` 中的 actions 修改游戏状态。
- **Manual QA checklist**:  
  **手动测试清单**：
  - Liberties, highlights, and hints update after every move.  
    每步落子后应刷新气数、提示与高亮效果。
  - Switching board sizes preserves layout and recomputes overlays.  
    切换棋盘尺寸时保持布局并重新计算覆盖层。
  - Sidebar controls remain aligned and responsive.  
    侧栏控件需保持对齐并适配不同尺寸。
- **Tooling** – add ESLint/Prettier or Vitest as needed before large refactors.  
  **工具链**——在大规模重构前视需要加入 ESLint/Prettier 或 Vitest。

## Roadmap (路线图)

- [ ] Unit coverage for key rule helpers (capture, ko, suicide prevention).  
      为关键规则辅助函数（提子、劫争、自杀判断）补充单元测试覆盖率。
- [ ] Automated visual regression test for liberty/territory overlays.  
      为气与势力覆盖层构建自动化视觉回归测试。
- [ ] Internationalisation (English/中文 UI switch).  
      国际化（提供英文/中文界面切换）。
- [ ] Progressive Web App mode for offline demos.  
      提供离线演示的渐进式 Web 应用模式。

Found something missing? Open an issue or discussion with your idea.  
有新的想法或遗漏？欢迎提交 Issue 或发起讨论。

## Contributing (参与贡献)

Contributions are welcome! Start with [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, coding standards, and pull-request guidance. Please search existing issues first and keep discussions respectful.  
欢迎贡献！请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)，了解环境配置、编码规范与提 PR 的指南。提交前请先搜索现有 Issue，并保持友好、尊重的交流氛围。

## Community Standards (社区守则)

We adhere to the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to help maintain a friendly, inclusive community.  
我们遵循 [Contributor Covenant 行为准则](./CODE_OF_CONDUCT.md)；参与项目即表示同意共同维护友好、包容的社区环境。

## License (许可证)

This project is released under the [MIT License](./LICENSE).  
本项目基于 [MIT 许可证](./LICENSE) 开源发布。
