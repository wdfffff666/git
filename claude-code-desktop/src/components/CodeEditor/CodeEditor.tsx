import React, { useState, useEffect, useCallback } from 'react'

interface CodeEditorProps {
  filePath?: string
  content?: string
  onSave?: (filePath: string, content: string) => void
  onClose?: () => void
}

// 简单的语法高亮映射
const HIGHLIGHT_RULES: { pattern: RegExp; className: string }[] = [
  { pattern: /(\/\/.*$)|(#.*$)/gm, className: 'comment' },
  { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, className: 'string' },
  { pattern: /\b(import|export|from|const|let|var|function|class|extends|return|if|else|for|while|do|switch|case|break|continue|new|this|super|try|catch|finally|throw|async|await|yield|typeof|instanceof|in|of|default|static|get|set|public|private|protected|interface|type|enum|implements|abstract)\b/g, className: 'keyword' },
  { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, className: 'boolean' },
  { pattern: /\b(\d+\.?\d*)\b/g, className: 'number' },
  { pattern: /(\b[A-Z][a-zA-Z0-9]*\b)/g, className: 'type' },
  { pattern: /(\b[a-zA-Z_$][a-zA-Z0-9_$]*\s*\()/g, className: 'function' },
]

export default function CodeEditor({ filePath, content: initialContent = '', onSave, onClose }: CodeEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isDirty, setIsDirty] = useState(false)
  const [lineCount, setLineCount] = useState(1)

  useEffect(() => {
    setContent(initialContent)
    setIsDirty(false)
  }, [filePath, initialContent])

  useEffect(() => {
    setLineCount(content.split('\n').length)
  }, [content])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setIsDirty(true)
  }, [])

  const handleSave = useCallback(() => {
    if (filePath && onSave) {
      onSave(filePath, content)
      setIsDirty(false)
    }
  }, [filePath, content, onSave])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl+S 保存
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    }
    // Tab 缩进
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.target as HTMLTextAreaElement
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + '  ' + content.substring(end)
      setContent(newContent)
      setIsDirty(true)
      // 恢复光标位置
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }, [content, handleSave])

  if (!filePath) {
    return (
      <div className="code-editor-container">
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 14
        }}>
          📂 从左侧文件浏览器中选择一个文件来编辑
        </div>
      </div>
    )
  }

  const fileName = filePath.split(/[/\\]/).pop() || filePath

  return (
    <div className="code-editor-container">
      {/* 头部 */}
      <div className="code-editor-header">
        <span>📄 {fileName}</span>
        {isDirty && <span style={{ color: 'var(--warning)', fontSize: 12 }}>● 未保存</span>}
        <div style={{ flex: 1 }} />
        <button className="btn btn-secondary btn-sm" onClick={handleSave} disabled={!isDirty}>
          💾 保存
        </button>
        {onClose && (
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕ 关闭
          </button>
        )}
      </div>

      {/* 编辑器 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 行号 */}
        <div style={{
          padding: '12px 0',
          background: 'var(--bg-tertiary)',
          borderRight: '1px solid var(--border-color)',
          color: 'var(--text-muted)',
          fontSize: 13,
          fontFamily: 'var(--font-mono)',
          textAlign: 'right',
          userSelect: 'none',
          overflow: 'hidden',
          minWidth: 48
        }}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} style={{ padding: '0 12px', lineHeight: '21px' }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* 代码编辑区 */}
        <textarea
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: 'var(--code-bg)',
            color: 'var(--text-primary)',
            border: 'none',
            padding: 12,
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            lineHeight: '21px',
            resize: 'none',
            outline: 'none',
            tabSize: 2,
            whiteSpace: 'pre',
            overflowWrap: 'normal',
            overflow: 'auto'
          }}
          spellCheck={false}
          placeholder="在此编辑代码..."
        />
      </div>

      {/* 底部状态栏 */}
      <div style={{
        padding: '4px 12px',
        background: 'var(--bg-tertiary)',
        borderTop: '1px solid var(--border-color)',
        fontSize: 12,
        color: 'var(--text-muted)',
        display: 'flex',
        gap: 16
      }}>
        <span>行: {lineCount}</span>
        <span>字符: {content.length}</span>
        <span>{filePath}</span>
      </div>
    </div>
  )
}
