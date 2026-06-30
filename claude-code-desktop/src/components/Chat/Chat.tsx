import React, { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { ChatMessage } from '../../services/claude'

interface ChatProps {
  messages: ChatMessage[]
  isStreaming: boolean
  streamingText: string
  onSendMessage: (content: string) => void
  onClearChat: () => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  workspacePath: string
  apiConnected: boolean
}

const QUICK_ACTIONS = [
  { label: '📖 解释代码', prompt: '请帮我解释一下当前项目的代码结构' },
  { label: '🐛 调试代码', prompt: '帮我分析下面这段代码可能存在的 bug：' },
  { label: '✨ 优化代码', prompt: '帮我优化以下代码的性能和可读性：' },
  { label: '📝 生成文档', prompt: '请为以下代码生成注释和文档：' },
  { label: '🔧 写新功能', prompt: '请帮我实现一个新功能：' },
  { label: '📂 分析项目', prompt: '请分析当前项目的文件结构和架构' }
]

export default function Chat({ messages, isStreaming, streamingText, onSendMessage, onClearChat, messagesEndRef, workspacePath, apiConnected }: ChatProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  // 发送消息
  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return
    onSendMessage(input)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input, isStreaming, onSendMessage])

  // 键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  // 快捷操作
  const handleQuickAction = useCallback((prompt: string) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }, [])

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`

    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="chat-container">
      {/* 消息列表 */}
      <div className="chat-messages">
        {messages.length === 0 && !isStreaming ? (
          <div className="chat-welcome">
            <h1>Claude Code</h1>
            <p>
              你的 AI 编程助手桌面版。可以帮你编写代码、分析项目、
              调试错误、执行命令等。支持中文对话，让编程更高效。
            </p>
            <div className="quick-actions">
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  className="quick-action-btn"
                  onClick={() => handleQuickAction(action.prompt)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className={`message-avatar ${msg.role}`}>
                  {msg.role === 'user' ? '你' : 'C'}
                </div>
                <div className="message-content">
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                  <div className="message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}

            {/* 流式响应 */}
            {isStreaming && streamingText && (
              <div className="message assistant">
                <div className="message-avatar assistant">C</div>
                <div className="message-content">
                  <ReactMarkdown>{streamingText}</ReactMarkdown>
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}

            {isStreaming && !streamingText && (
              <div className="message assistant">
                <div className="message-avatar assistant">C</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <div className="chat-input-box">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                apiConnected
                  ? '输入消息，Enter 发送，Shift+Enter 换行...'
                  : '请先在设置中配置 API 密钥...'
              }
              rows={1}
              disabled={!apiConnected}
            />
            <button
              className={`send-btn ${isStreaming ? 'sending' : ''}`}
              onClick={handleSend}
              disabled={!input.trim() || isStreaming || !apiConnected}
              title="发送消息"
            >
              {isStreaming ? '■' : '↑'}
            </button>
          </div>
          <div className="chat-input-info">
            Claude Code 桌面汉化版 v1.0 | 模型: Claude Sonnet 4.6
            {workspacePath && ` | 工作区: ${workspacePath.split(/[/\\]/).pop()}`}
          </div>
        </div>
      </div>
    </div>
  )
}
