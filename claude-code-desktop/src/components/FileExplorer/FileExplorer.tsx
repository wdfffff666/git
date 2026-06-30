import React, { useState, useEffect, useCallback } from 'react'
import { FileItem } from '../../types/electron'

interface FileExplorerProps {
  workspacePath: string
}

// 获取文件图标
function getFileIcon(item: FileItem): string {
  if (item.isDirectory) return '📁'

  const ext = item.extension
  switch (ext) {
    case '.ts': return '🔷'
    case '.tsx': return '⚛️'
    case '.js': return '🟨'
    case '.jsx': return '⚛️'
    case '.py': return '🐍'
    case '.css':
    case '.scss':
    case '.less': return '🎨'
    case '.html': return '🌐'
    case '.json': return '📋'
    case '.md': return '📝'
    case '.gitignore':
    case '.git': return '🔧'
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.gif':
    case '.svg': return '🖼'
    case '.exe':
    case '.dll': return '⚙️'
    case '.zip':
    case '.tar':
    case '.gz': return '📦'
    default: return '📄'
  }
}

export default function FileExplorer({ workspacePath }: FileExplorerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')

  // 加载文件树
  const loadFiles = useCallback(async (path: string) => {
    if (!path || !window.electronAPI) return

    setLoading(true)
    try {
      const result = await window.electronAPI.readDirRecursive(path, 2)
      if (result.success && result.items) {
        setFiles(result.items)
      }
    } catch (error) {
      console.error('加载文件失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (workspacePath) {
      loadFiles(workspacePath)
      setSelectedFile(null)
      setFileContent('')
    } else {
      setFiles([])
    }
  }, [workspacePath, loadFiles])

  // 切换文件夹展开/收起
  const toggleDir = (dirPath: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(dirPath)) {
        next.delete(dirPath)
      } else {
        next.add(dirPath)
      }
      return next
    })
  }

  // 点击文件查看内容
  const handleFileClick = async (item: FileItem) => {
    if (item.isDirectory) {
      toggleDir(item.path)
    } else {
      setSelectedFile(item.path)
      if (window.electronAPI) {
        const result = await window.electronAPI.readFile(item.path)
        if (result.success) {
          setFileContent(result.content || '')
        }
      }
    }
  }

  // 渲染文件树节点
  const renderTreeItem = (item: FileItem, depth: number = 0) => {
    const isExpanded = expandedDirs.has(item.path)
    const isSelected = selectedFile === item.path
    const paddingLeft = 16 + depth * 16

    return (
      <React.Fragment key={item.path}>
        <div
          className={`file-tree-item ${isSelected ? 'active' : ''}`}
          style={{ paddingLeft }}
          onClick={() => handleFileClick(item)}
        >
          <span className="icon">{getFileIcon(item)}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.name}
          </span>
        </div>

        {/* 子项 */}
        {item.isDirectory && isExpanded && item.children && (
          item.children.map(child => renderTreeItem(child, depth + 1))
        )}
      </React.Fragment>
    )
  }

  if (!workspacePath) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
        请先选择一个工作区文件夹
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center' }}>
        <div className="typing-indicator" style={{ justifyContent: 'center' }}>
          <span /><span /><span />
        </div>
        <div style={{ marginTop: 8, fontSize: 13 }}>加载文件树...</div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 文件列表 */}
      <div className="file-tree" style={{ flex: 1 }}>
        {files.length === 0 ? (
          <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            文件夹为空
          </div>
        ) : (
          files.map(item => renderTreeItem(item))
        )}
      </div>

      {/* 文件预览 */}
      {selectedFile && fileContent && (
        <div style={{
          borderTop: '1px solid var(--border-color)',
          maxHeight: 300,
          overflow: 'auto',
          background: 'var(--code-bg)'
        }}>
          <div style={{
            padding: '6px 12px',
            fontSize: 11,
            color: 'var(--text-muted)',
            background: 'var(--bg-tertiary)',
            position: 'sticky',
            top: 0
          }}>
            📄 {selectedFile.split(/[/\\]/).pop()}
          </div>
          <pre style={{
            margin: 0,
            padding: 12,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {fileContent.substring(0, 5000)}
            {fileContent.length > 5000 && '\n\n... (内容过长，已截断)'}
          </pre>
        </div>
      )}
    </div>
  )
}
