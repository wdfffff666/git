import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 对话框
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  selectFile: (filters?: { name: string; extensions: string[] }[]) =>
    ipcRenderer.invoke('dialog:selectFile', filters),

  // 文件操作
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('file:write', filePath, content),
  createFile: (filePath: string, content?: string) => ipcRenderer.invoke('file:create', filePath, content),
  deleteFile: (filePath: string) => ipcRenderer.invoke('file:delete', filePath),
  listDir: (dirPath: string) => ipcRenderer.invoke('file:listDir', dirPath),
  readDirRecursive: (dirPath: string, depth?: number) => ipcRenderer.invoke('file:readDirRecursive', dirPath, depth),
  getFileStat: (filePath: string) => ipcRenderer.invoke('file:stat', filePath),

  // 命令行
  execCommand: (command: string, cwd?: string) => ipcRenderer.invoke('shell:exec', command, cwd),
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),

  // 设置
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSetting: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),

  // 应用
  getVersion: () => ipcRenderer.invoke('app:version'),
  getPath: (name: string) => ipcRenderer.invoke('app:getPath', name)
})
