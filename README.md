# Claude Code 桌面汉化版

> 🚀 AI 编程助手桌面应用 — 基于 Electron + React + TypeScript

## 功能特性

- 💬 **中文对话界面** — 完整的汉化 UI，与 Claude 用中文交流
- 📝 **代码编辑** — 内置代码编辑器，支持语法高亮和行号显示
- 📂 **文件浏览** — 侧边栏文件树，浏览和管理项目文件
- 🔧 **命令行执行** — 直接在应用中执行终端命令
- 🎨 **暗色主题** — 护眼的深色界面设计
- ⚡ **流式响应** — 实时显示 Claude 的回答
- 💾 **本地存储** — API 密钥和设置安全保存在本地

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Windows / macOS / Linux

### 安装

```bash
# 进入项目目录
cd claude-code-desktop

# 安装依赖
npm install

# 开发模式运行
npm run electron:dev

# 打包为 Windows 安装程序
npm run build:win
```

### 配置

1. 启动应用后，点击右上角 ⚙️ 图标打开设置
2. 输入你的 Anthropic API Key（从 https://console.anthropic.com/ 获取）
3. 选择 Claude 模型（推荐 Sonnet 4.6）
4. 选择工作区文件夹
5. 保存设置，开始使用！

## 项目结构

```
claude-code-desktop/
├── electron/
│   ├── main.ts          # Electron 主进程
│   └── preload.ts       # 预加载脚本（安全桥梁）
├── src/
│   ├── components/
│   │   ├── Chat/        # 聊天界面
│   │   ├── Sidebar/     # 侧边栏
│   │   ├── FileExplorer/# 文件浏览器
│   │   ├── CodeEditor/  # 代码编辑器
│   │   └── Settings/    # 设置面板
│   ├── services/
│   │   └── claude.ts    # Claude API 封装
│   ├── types/           # TypeScript 类型定义
│   ├── styles/          # 全局样式
│   ├── App.tsx          # 主应用组件
│   └── main.tsx         # React 入口
├── public/
│   └── icon.svg         # 应用图标
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 技术栈

| 技术 | 用途 |
|------|------|
| Electron 33 | 桌面应用框架 |
| React 18 | UI 框架 |
| TypeScript 5 | 类型安全 |
| Vite 6 | 构建工具 |
| Anthropic SDK | Claude API |
| React Markdown | 消息渲染 |
| CSS Variables | 主题系统 |

## 快捷键

| 按键 | 功能 |
|------|------|
| `Enter` | 发送消息 |
| `Shift + Enter` | 换行 |
| `Ctrl + S` | 保存文件 |
| `Tab` | 代码缩进 |

## 许可

MIT License
