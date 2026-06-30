export interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
  extension: string
  children?: FileItem[]
}

export interface FileResult {
  success: boolean
  content?: string
  error?: string
}

export interface DirResult {
  success: boolean
  items?: FileItem[]
  error?: string
}

export interface CommandResult {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number
}

export interface SettingsResult {
  success: boolean
  settings: Record<string, any>
  error?: string
}

export interface ElectronAPI {
  selectDirectory: () => Promise<string | null>
  selectFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>
  readFile: (filePath: string) => Promise<FileResult>
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
  createFile: (filePath: string, content?: string) => Promise<{ success: boolean; error?: string }>
  deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
  listDir: (dirPath: string) => Promise<DirResult>
  readDirRecursive: (dirPath: string, depth?: number) => Promise<DirResult>
  getFileStat: (filePath: string) => Promise<{ success: boolean; stat?: any; error?: string }>
  execCommand: (command: string, cwd?: string) => Promise<CommandResult>
  openExternal: (url: string) => Promise<void>
  getSettings: () => Promise<SettingsResult>
  setSetting: (key: string, value: any) => Promise<{ success: boolean; error?: string }>
  getVersion: () => Promise<string>
  getPath: (name: string) => Promise<string>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
