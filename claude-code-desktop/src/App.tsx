import React, { useState, useEffect, useCallback, useRef } from 'react'
import Chat from './components/Chat/Chat'
import Sidebar from './components/Sidebar/Sidebar'
import Settings from './components/Settings/Settings'
import { ChatMessage, createClaudeClient, DEFAULT_SYSTEM_PROMPT, FILE_TOOLS } from './services/claude'

export interface AppSettings {
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  systemPrompt: string
  workspacePath: string
  baseURL: string        // CC Switch / 中转服务端点
  useProxy: boolean       // 是否启用自定义端点
}

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  model: 'claude-sonnet-4-6',
  maxTokens: 8192,
  temperature: 0.7,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  workspacePath: '',
  baseURL: '',
  useProxy: false
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [apiConnected, setApiConnected] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [workspacePath, setWorkspacePath] = useState<string>('')
  const [showFileExplorer, setShowFileExplorer] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 加载设置
  useEffect(() => {
    async function loadSettings() {
      if (window.electronAPI) {
        const result = await window.electronAPI.getSettings()
        if (result.success && result.settings) {
          const merged = { ...DEFAULT_SETTINGS, ...result.settings }
          setSettings(merged)
          setApiConnected(!!merged.apiKey)
          if (merged.workspacePath) {
            setWorkspacePath(merged.workspacePath)
          }
        }
      }
    }
    loadSettings()
  }, [])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // 保存设置
  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    setSettings(newSettings)
    setApiConnected(!!newSettings.apiKey)
    if (window.electronAPI) {
      await window.electronAPI.setSetting('apiKey', newSettings.apiKey)
      await window.electronAPI.setSetting('model', newSettings.model)
      await window.electronAPI.setSetting('maxTokens', newSettings.maxTokens)
      await window.electronAPI.setSetting('temperature', newSettings.temperature)
      await window.electronAPI.setSetting('systemPrompt', newSettings.systemPrompt)
      await window.electronAPI.setSetting('workspacePath', newSettings.workspacePath)
      await window.electronAPI.setSetting('baseURL', newSettings.baseURL)
      await window.electronAPI.setSetting('useProxy', newSettings.useProxy)
    }
    if (newSettings.workspacePath) {
      setWorkspacePath(newSettings.workspacePath)
    }
  }, [])

  // 发送消息
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setIsStreaming(true)
    setStreamingText('')

    try {
      const claude = createClaudeClient({
        apiKey: settings.apiKey,
        model: settings.model,
        maxTokens: settings.maxTokens,
        temperature: settings.temperature,
        systemPrompt: settings.systemPrompt,
        baseURL: settings.baseURL,
        useProxy: settings.useProxy
      })

      const conversationMessages = [...messages, userMessage].map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

      let fullResponse = ''

      // 使用工具调用
      const response = await claude.sendMessageWithTools(
        conversationMessages,
        FILE_TOOLS,
        (text) => {
          fullResponse = text
          setStreamingText(text)
        },
        async (toolName, input) => {
          if (window.electronAPI) {
            switch (toolName) {
              case 'read_file': {
                const result = await window.electronAPI.readFile(input.filePath)
                return result.success ? result.content! : `读取文件失败: ${result.error}`
              }
              case 'write_file': {
                const result = await window.electronAPI.writeFile(input.filePath, input.content)
                return result.success ? '文件写入成功' : `写入文件失败: ${result.error}`
              }
              case 'list_directory': {
                const result = await window.electronAPI.listDir(input.dirPath)
                if (result.success && result.items) {
                  return result.items.map(item =>
                    `${item.isDirectory ? '📁' : '📄'} ${item.name}`
                  ).join('\n')
                }
                return `列出目录失败: ${result.error}`
              }
              case 'execute_command': {
                const result = await window.electronAPI.execCommand(
                  input.command,
                  input.cwd || workspacePath || undefined
                )
                return `退出码: ${result.exitCode}\n${result.stdout || '(无输出)'}\n${result.stderr ? '错误输出:\n' + result.stderr : ''}`
              }
              default:
                return `未知工具: ${toolName}`
            }
          }
          return '工具不可用（非桌面环境）'
        }
      )

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response || fullResponse,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, assistantMessage])
      setStreamingText('')
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ **错误**: ${error.message}\n\n> 请检查 API 密钥是否正确，以及网络连接是否正常。您可以在设置中更新 API 密钥。`,
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMessage])
      setStreamingText('')
    } finally {
      setIsStreaming(false)
    }
  }, [messages, isStreaming, settings, workspacePath])

  // 清空对话
  const handleClearChat = useCallback(() => {
    setMessages([])
    setStreamingText('')
  }, [])

  // 选择工作区
  const handleSelectWorkspace = useCallback(async () => {
    if (window.electronAPI) {
      const dir = await window.electronAPI.selectDirectory()
      if (dir) {
        setWorkspacePath(dir)
        const newSettings = { ...settings, workspacePath: dir }
        setSettings(newSettings)
        await window.electronAPI.setSetting('workspacePath', dir)
      }
    }
  }, [settings])

  return (
    <div className="app-container">
      <Sidebar
        collapsed={sidebarCollapsed}
        workspacePath={workspacePath}
        messages={messages}
        onSelectWorkspace={handleSelectWorkspace}
        onClearChat={handleClearChat}
        onToggleFileExplorer={() => setShowFileExplorer(!showFileExplorer)}
        showFileExplorer={showFileExplorer}
      />

      <div className="main-content">
        {/* 顶部栏 */}
        <div className="topbar">
          <button
            className="topbar-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {sidebarCollapsed ? '☰' : '✕'}
          </button>

          <span className="topbar-title">
            Claude Code 桌面版
            {workspacePath && ` — ${workspacePath.split(/[/\\]/).pop()}`}
          </span>

          <div className="status-indicator" style={{ padding: 0, marginRight: 8 }}>
            <span className={`status-dot ${apiConnected ? 'connected' : isStreaming ? 'loading' : 'error'}`} />
            <span>{apiConnected ? '已连接' : '未配置 API'}</span>
          </div>

          <button
            className={`topbar-btn ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="设置"
          >
            ⚙
          </button>
        </div>

        {/* 聊天区 */}
        <Chat
          messages={messages}
          isStreaming={isStreaming}
          streamingText={streamingText}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          messagesEndRef={messagesEndRef}
          workspacePath={workspacePath}
          apiConnected={apiConnected}
        />
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <Settings
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
