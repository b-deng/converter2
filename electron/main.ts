import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'
import { FileConverter } from './services/converter.js'

// 在ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const converter = new FileConverter()

const isDev = process.env.NODE_ENV === 'development'

function createWindow(): void {
  const preloadPath = path.join(__dirname, 'preload.js')
  console.log('Preload script path:', preloadPath)
  console.log('Preload script exists:', fs.existsSync(preloadPath))
  
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // 开发模式下禁用 web 安全
      preload: preloadPath,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
    backgroundColor: '#ffffff',
  })

  // 窗口准备好后显示，避免闪烁
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // 修复：指向正确的构建输出路径
    mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC handlers
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf'] },
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'] },
      { name: 'Spreadsheets', extensions: ['xls', 'xlsx', 'csv'] },
      { name: 'Presentations', extensions: ['ppt', 'pptx'] },
    ],
  })

  return result.filePaths
})

ipcMain.handle('select-output-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  })

  return result.filePaths[0]
})

ipcMain.handle('convert-file', async (event, filePath: string, outputDir: string, targetFormat: string) => {
  try {
    // 检查输入文件是否存在
    if (!fs.existsSync(filePath)) {
      return { success: false, error: '输入文件不存在' }
    }

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 执行转换
    const result = await converter.convertFile(
      filePath,
      outputDir,
      targetFormat,
      (progress) => {
        // 发送进度更新到渲染进程
        event.sender.send('conversion-progress', { filePath, progress })
      }
    )

    return result
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '转换失败'
    }
  }
})

// 获取支持的转换格式
ipcMain.handle('get-supported-formats', async (event, inputFormat: string) => {
  return converter.getSupportedFormats(inputFormat)
})

// 获取文件信息
ipcMain.handle('get-file-info', async (event, filePath: string) => {
  try {
    const stats = fs.statSync(filePath)
    const ext = path.extname(filePath).toLowerCase().slice(1)

    return {
      name: path.basename(filePath),
      size: stats.size,
      type: ext,
      path: filePath
    }
  } catch (error) {
    return null
  }
})
