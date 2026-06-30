import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { exec, spawn } from 'child_process'

let mainWindow: BrowserWindow | null = null

// 判断是否为开发环境 (Vite dev server 模式)
const isDev = process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL
// Vite 开发服务器 URL
const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    title: 'Claude Code 桌面版',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false  // 允许跨域请求（中转服务需要）
    },
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#1a1b26'
  })

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    // 开发模式：连接 Vite 热更新服务器
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    // 生产模式：加载构建后的文件
    const htmlPath = path.join(__dirname, '../dist/index.html')
    console.log('Loading HTML from:', htmlPath)
    mainWindow.loadFile(htmlPath).catch(err => {
      console.error('Failed to load HTML:', err)
    })
  }

  // 捕获渲染进程的 console 输出到终端
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levels = ['VERBOSE', 'INFO', 'WARN', 'ERROR']
    console.log(`[RENDERER ${levels[level] || 'LOG'}] ${message}`)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ==================== IPC 处理器 ====================

// 选择文件夹
ipcMain.handle('dialog:selectDirectory', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  return result.canceled ? null : result.filePaths[0]
})

// 选择文件
ipcMain.handle('dialog:selectFile', async (_event, filters?: { name: string; extensions: string[] }[]) => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [{ name: '所有文件', extensions: ['*'] }]
  })
  return result.canceled ? null : result.filePaths[0]
})

// 读取文件内容
ipcMain.handle('file:read', async (_event, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return { success: true, content }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// 写入文件
ipcMain.handle('file:write', async (_event, filePath: string, content: string) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// 创建文件
ipcMain.handle('file:create', async (_event, filePath: string, content: string = '') => {
  try {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, content, 'utf-8')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// 删除文件/文件夹
ipcMain.handle('file:delete', async (_event, filePath: string) => {
  try {
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      fs.rmSync(filePath, { recursive: true })
    } else {
      fs.unlinkSync(filePath)
    }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// 列出目录内容
ipcMain.handle('file:listDir', async (_event, dirPath: string) => {
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true })
    return {
      success: true,
      items: items.map(item => ({
        name: item.name,
        path: path.join(dirPath, item.name),
        isDirectory: item.isDirectory(),
        isFile: item.isFile(),
        extension: path.extname(item.name).toLowerCase()
      }))
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// 获取文件信息
ipcMain.handle('file:stat', async (_event, filePath: string) => {
  try {
    const stat = fs.statSync(filePath)
    return {
      success: true,
      stat: {
        size: stat.size,
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile(),
        modifiedAt: stat.mtime.toISOString(),
        createdAt: stat.birthtime.toISOString()
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// 递归列出目录（用于文件树）
ipcMain.handle('file:readDirRecursive', async (_event, dirPath: string, depth: number = 3) => {
  try {
    const result: any[] = []

    function readRecursive(currentPath: string, currentDepth: number) {
      if (currentDepth > depth) return

      try {
        const items = fs.readdirSync(currentPath, { withFileTypes: true })

        for (const item of items) {
          // 跳过隐藏文件和 node_modules
          if (item.name.startsWith('.') || item.name === 'node_modules' || item.name === '__pycache__') {
            continue
          }

          const fullPath = path.join(currentPath, item.name)
          const entry: any = {
            name: item.name,
            path: fullPath,
            isDirectory: item.isDirectory(),
            isFile: item.isFile(),
            extension: path.extname(item.name).toLowerCase()
          }

          if (item.isDirectory() && currentDepth < depth) {
            entry.children = readRecursive(fullPath, currentDepth + 1)
          }

          result.push(entry)
        }
      } catch (e) {
        // 权限不足时跳过
      }

      return result
    }

    readRecursive(dirPath, 0)
    return { success: true, items: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// 执行命令
ipcMain.handle('shell:exec', async (_event, command: string, cwd?: string) => {
  return new Promise((resolve) => {
    exec(command, { cwd: cwd || process.cwd(), maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        exitCode: error?.code || 0
      })
    })
  })
})

// 打开外部链接
ipcMain.handle('shell:openExternal', async (_event, url: string) => {
  await shell.openExternal(url)
})

// 读取/写入设置
const settingsPath = path.join(app.getPath('userData'), 'settings.json')

ipcMain.handle('settings:get', async () => {
  try {
    if (fs.existsSync(settingsPath)) {
      const content = fs.readFileSync(settingsPath, 'utf-8')
      return { success: true, settings: JSON.parse(content) }
    }
    return { success: true, settings: {} }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('settings:set', async (_event, key: string, value: any) => {
  try {
    let settings: any = {}
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    }
    settings[key] = value
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// 获取应用版本
ipcMain.handle('app:version', () => {
  return app.getVersion()
})

// 获取用户数据路径
ipcMain.handle('app:getPath', (_event, name: string) => {
  return app.getPath(name as any)
})
