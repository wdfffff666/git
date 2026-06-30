# Claude Code 桌面汉化版 🟣

> 🚀 AI 编程助手桌面应用 — 基于 Electron + React + TypeScript 构建

## 功能特性

- 💬 **中文对话界面** — 完整的汉化 UI，与 Claude 用中文交流
- 📝 **代码编辑** — 内置代码编辑器，支持语法高亮和行号显示
- 📂 **文件浏览** — 侧边栏文件树，浏览和管理项目文件
- 🔧 **命令行执行** — 直接在应用中执行终端命令
- 🔄 **中转服务支持** — 支持 CC Switch / 自定义 API 端点
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
# 克隆项目
git clone https://github.com/wdfffff666/git.git
cd git

# 安装依赖
npm install

# 构建并启动
npm run build
npx electron .

# 或一键启动（Windows）
双击 launch.bat
```

### 配置

1. 启动应用后，点击右上角 ⚙️ 图标打开设置
2. 输入 API Key（支持 Anthropic 官方 Key 或中转服务 Key）
3. 如使用中转服务，勾选「启用中转服务」并填入 API 端点
4. 选择工作区文件夹
5. 保存设置，开始使用！

## 项目结构

```
├── electron/
│   ├── main.ts          # Electron 主进程（IPC、文件系统、命令行）
│   └── preload.ts       # 预加载脚本（安全桥接）
├── src/
│   ├── components/
│   │   ├── Chat/        # 💬 聊天界面（流式响应）
│   │   ├── Sidebar/     # 📂 侧边栏
│   │   ├── FileExplorer/# 📁 文件浏览器
│   │   ├── CodeEditor/  # 📝 代码编辑器
│   │   └── Settings/    # ⚙️ 设置面板
│   ├── services/
│   │   └── claude.ts    # Claude API 封装
│   ├── types/           # TypeScript 类型
│   ├── styles/          # 全局样式
│   ├── App.tsx          # 主应用组件
│   └── main.tsx         # React 入口
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 技术栈

| 技术 | 用途 |
|------|------|
| Electron 33 | 桌面应用框架 |
| React 18 | UI 框架 |
| TypeScript 5 | 类型安全 |
| Vite 6 | 构建工具 |
| Anthropic SDK | Claude API |

## 快捷键

| 按键 | 功能 |
|------|------|
| `Enter` | 发送消息 |
| `Shift + Enter` | 换行 |
| `Ctrl + S` | 保存文件 |
| `Tab` | 代码缩进 |

## 许可

MIT License
