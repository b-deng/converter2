const { contextBridge, ipcRenderer } = require('electron')

console.log('Preload script started')

// 定义类型接口
interface FileInfo {
  name: string
  size: number
  type: string
  path: string
}

interface ConversionResult {
  success: boolean
  outputPath?: string
  error?: string
}

// 定义 API 对象
const electronAPI = {
  selectFiles: (): Promise<string[]> => {
    console.log('selectFiles called')
    return ipcRenderer.invoke('select-files')
  },
  selectOutputDirectory: (): Promise<string> => {
    console.log('selectOutputDirectory called')
    return ipcRenderer.invoke('select-output-directory')
  },
  convertFile: (filePath: string, outputDir: string, targetFormat: string): Promise<ConversionResult> => {
    console.log('convertFile called', { filePath, outputDir, targetFormat })
    return ipcRenderer.invoke('convert-file', filePath, outputDir, targetFormat)
  },
  getSupportedFormats: (inputFormat: string): Promise<string[]> => {
    console.log('getSupportedFormats called', inputFormat)
    return ipcRenderer.invoke('get-supported-formats', inputFormat)
  },
  getFileInfo: (filePath: string): Promise<FileInfo | null> => {
    console.log('getFileInfo called', filePath)
    return ipcRenderer.invoke('get-file-info', filePath)
  },
  onConversionProgress: (callback: (data: { filePath: string; progress: number }) => void): void => {
    console.log('onConversionProgress called')
    ipcRenderer.on('conversion-progress', (event: any, data: any) => callback(data))
  },
}

console.log('Preload script running, exposing electronAPI:', electronAPI)

// 暴露 API 到渲染进程
try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  console.log('electronAPI exposed to main world successfully')
} catch (error) {
  console.error('Failed to expose electronAPI:', error)
}

// 验证 API 是否已暴露
setTimeout(() => {
  console.log('Checking if electronAPI is available on window after timeout')
}, 1000)
