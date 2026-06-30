# 🏠 家庭 AI 服务器

> 基于 Ollama + FastAPI 的私有化 AI 服务，数据 100% 本地运行，断网可用。

---

## 📋 项目概述

将一台普通 Windows 电脑改造为家庭 AI 服务器，部署 3 个本地大语言模型，提供对话、图像识别、代码生成三大功能，通过 Web 仪表盘在家中任意设备访问。

---

## 🏗 系统架构

```
浏览器 (电脑/手机/平板)
    │
├── dashboard.html    前端仪表盘 (对话/识图/代码)
    │
    ▼
FastAPI :8000         后端 API 服务
    │
    ├── /chat         文本对话
    ├── /vision       图像识别
    ├── /code         代码生成
    └── /models       模型列表
    │
    ▼
Ollama :11434        本地模型推理
    ├── qwen2.5:3b        通用对话模型 (1.9GB)
    ├── qwen2-vl:2b       图像识别模型 (2.3GB)
    └── qwen2.5-coder:3b  代码生成模型 (1.9GB)
```

---

## 🚀 快速启动

### 前置条件

- Ollama 运行中（任务栏羊驼图标）
- Python 3.12+

### 启动后端

```bash
cd server
pip install -r requirements.txt
python main.py
```

### 打开前端

浏览器打开 `dashboard.html`，或从其他设备访问 `http://你的电脑IP:8000/docs`

---

## 📁 项目结构

```
.
├── README.md              ← 本文档
├── dashboard.html          ← 前端仪表盘（三合一）
├── server/
│   ├── main.py            ← FastAPI 后端
│   └── requirements.txt   ← Python 依赖
└── .gitignore
```

---

## 🔧 技术栈

| 层 | 技术 | 说明 |
|-----|------|------|
| 模型推理 | Ollama | 本地大模型运行时 |
| 后端 | FastAPI (Python) | RESTful API 服务 |
| 前端 | HTML/CSS/JS | 纯静态，无框架依赖 |
| 模型 | Qwen2.5 / Qwen2-VL | 阿里通义千问系列 |

---

## 📊 部署的模型

| 模型 | 类型 | 大小 | 用途 |
|------|------|------|------|
| Qwen2.5 3B | 对话 | 1.9GB | 通用问答、文本处理 |
| Qwen2-VL 2B | 视觉 | 2.3GB | 图像内容识别 |
| Qwen2.5-Coder 3B | 代码 | 1.9GB | 代码生成与解释 |

---

## 🔒 隐私

所有数据处理在本地完成，不上传至任何云端服务。断网状态下仍可正常使用。

---

## 👤 作者

计算机专业学生 | 2026年7月

*从零基础到完整 AI 服务——动手是最好的学习方式。*
