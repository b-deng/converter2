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

// 生产环境日志记录
const logToFile = (message: string, data?: any) => {
  const logMessage = `[${new Date().toISOString()}] ${message}`
  console.log(logMessage, data || '')
  
  // 在生产环境中，将日志写入文件
  if (!isDev) {
    try {
      const logPath = path.join(app.getPath('userData'), 'conversion.log')
      const logEntry = `${logMessage} ${data ? JSON.stringify(data, null, 2) : ''}\n`
      fs.appendFileSync(logPath, logEntry)
    } catch (error) {
      console.error('无法写入日志文件:', error)
    }
  }
}

// 简化的生产环境诊断功能
const runSimpleDiagnostic = () => {
  if (!isDev) {
    logToFile('=== 生产环境基础诊断 ===')
    logToFile('环境信息', {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      electronVersion: process.versions.electron,
      nodeEnv: process.env.NODE_ENV,
      cwd: process.cwd(),
      execPath: process.execPath,
      argv: process.argv
    })
    
    // 检查关键文件路径
    const criticalPaths = [
      path.join(process.cwd(), 'scripts', 'pdf_to_docx.py'),
      path.join(__dirname, '..', 'scripts', 'pdf_to_docx.py'),
      path.join(process.resourcesPath, 'app', 'scripts', 'pdf_to_docx.py')
    ]
    
    criticalPaths.forEach(filePath => {
      const exists = fs.existsSync(filePath)
      logToFile(`文件检查: ${filePath}`, { exists })
    })
    
    logToFile('=== 诊断完成 ===')
  }
}

// 获取图标路径 - 最终版本（使用硬编码绝对路径）
function getIconPath(): string {
  // 使用项目根目录的绝对路径，最可靠
  const projectRoot = process.cwd()
  
  // 优先使用 ICO 格式（Windows 最佳兼容性）
  const icoPath = path.join(projectRoot, 'build', 'icon.ico')
  const pngPath = path.join(projectRoot, 'public', 'icon.png')
  
  console.log('🎯 精转数智 - 应用图标加载')
  console.log('项目根目录:', projectRoot)
  console.log('ICO图标路径:', icoPath)
  console.log('PNG备用路径:', pngPath)
  
  if (fs.existsSync(icoPath)) {
    console.log('✅ 使用ICO图标:', icoPath)
    return icoPath
  } else if (fs.existsSync(pngPath)) {
    console.log('✅ 使用PNG图标:', pngPath)
    return pngPath
  } else {
    console.warn('⚠️ 图标文件不存在，使用默认图标')
    // 返回一个存在的路径或让Electron使用默认图标
    return ''
  }
}

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
    frame: false, // 隐藏默认窗口框架
    titleBarStyle: 'hidden', // 隐藏标题栏
    show: false,
    backgroundColor: '#ffffff',
    title: '精转数智', // 更改应用标题
    icon: getIconPath(), // 使用动态解析的图标路径
    // 额外的图标相关配置
    ...(process.platform === 'win32' && {
      skipTaskbar: false,
      autoHideMenuBar: true,
    }),
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

app.whenReady().then(async () => {
  createWindow()
  
  // 在生产环境中自动运行诊断
  if (!isDev) {
    logToFile('应用启动 - 开始生产环境诊断')
    runSimpleDiagnostic()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC 处理程序
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Documents', extensions: ['pdf', 'docx', 'doc', 'txt'] },
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'] },
      { name: 'Spreadsheets', extensions: ['xlsx', 'xls', 'csv'] }
    ]
  })
  return result.filePaths
})

ipcMain.handle('select-output-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  })

  return result.filePaths[0]
})

// 窗口控制 IPC 处理器
ipcMain.handle('window-minimize', () => {
  const window = BrowserWindow.getFocusedWindow()
  if (window) window.minimize()
})

ipcMain.handle('window-maximize', () => {
  const window = BrowserWindow.getFocusedWindow()
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize()
    } else {
      window.maximize()
    }
  }
})

ipcMain.handle('window-close', () => {
  const window = BrowserWindow.getFocusedWindow()
  if (window) window.close()
})

ipcMain.handle('window-is-maximized', () => {
  const window = BrowserWindow.getFocusedWindow()
  return window ? window.isMaximized() : false
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
