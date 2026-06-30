import React, { useState, useEffect, useCallback } from 'react'
import FileExplorer from '../FileExplorer/FileExplorer'
import { ChatMessage } from '../../services/claude'

interface SidebarProps {
  collapsed: boolean
  workspacePath: string
  messages: ChatMessage[]
  onSelectWorkspace: () => void
  onClearChat: () => void
  onToggleFileExplorer: () => void
  showFileExplorer: boolean
}

export default function Sidebar({
  collapsed,
  workspacePath,
  messages,
  onSelectWorkspace,
  onClearChat,
  onToggleFileExplorer,
  showFileExplorer
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'history'>('files')

  // 对话历史分组
  const conversationGroups = messages.reduce((groups, msg) => {
    if (msg.role === 'user') {
      const date = new Date(msg.timestamp).toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      })
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    }
    return groups
  }, {} as Record<string, ChatMessage[]>)

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {!collapsed && (
        <>
          {/* 头部 */}
          <div className="sidebar-header">
            <h2>
              <span className="logo-icon">🟣</span>
              Claude Code
            </h2>
          </div>

          {/* 工作区选择 */}
          <div className="sidebar-section">
            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={onSelectWorkspace}
            >
              📁 {workspacePath ? '切换工作区' : '选择工作区'}
            </button>
            {workspacePath && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                {workspacePath}
              </div>
            )}
          </div>

          {/* Tab 切换 */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
            <button
              className="topbar-btn"
              onClick={() => setActiveTab('files')}
              style={{
                flex: 1,
                borderRadius: 0,
                borderBottom: activeTab === 'files' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                padding: '10px 0',
                fontSize: 13
              }}
            >
              📂 文件浏览
            </button>
            <button
              className="topbar-btn"
              onClick={() => setActiveTab('history')}
              style={{
                flex: 1,
                borderRadius: 0,
                borderBottom: activeTab === 'history' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                padding: '10px 0',
                fontSize: 13
              }}
            >
              💬 对话历史
            </button>
          </div>

          {/* 内容区 */}
          {activeTab === 'files' ? (
            <FileExplorer workspacePath={workspacePath} />
          ) : (
            <div className="file-tree">
              {Object.keys(conversationGroups).length === 0 ? (
                <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
                  暂无对话历史
                </div>
              ) : (
                Object.entries(conversationGroups).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="sidebar-section-title" style={{ padding: '8px 16px' }}>
                      {date}
                    </div>
                    {msgs.map((msg, i) => (
                      <div key={i} className="file-tree-item" title={msg.content}>
                        <span style={{ flexShrink: 0 }}>💬</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {msg.content.substring(0, 40)}{msg.content.length > 40 ? '...' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {/* 底部操作 */}
          <div style={{ padding: 12, borderTop: '1px solid var(--border-color)' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
              onClick={onClearChat}
              disabled={messages.length === 0}
            >
              🗑 清空对话
            </button>
          </div>
        </>
      )}
    </div>
  )
}
