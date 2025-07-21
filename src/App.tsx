import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileDropZone } from './components/FileDropZone'
import { FileItem } from './components/FileItem'
import { ConversionPanel } from './components/ConversionPanel'
import TitleBar from './components/TitleBar'
import { FileItem as FileItemType, ConversionOptions } from './types'
import { getFileExtension } from './utils/formats'

function App() {
  const [files, setFiles] = useState<FileItemType[]>([])
  const [isConverting, setIsConverting] = useState(false)
  const [options, setOptions] = useState<ConversionOptions>({
    outputDirectory: '',
    targetFormat: '',
    quality: 80,
    compression: false,
  })

  useEffect(() => {
    console.log('App mounted, checking electronAPI...')
    console.log('window.electronAPI:', window.electronAPI)

    // 等待一下再检查，有时候 preload 脚本需要时间
    setTimeout(() => {
      console.log('After timeout, window.electronAPI:', window.electronAPI)
    }, 1000)
  }, [])

  const handleFilesSelected = useCallback(async (selectedFiles: File[] | string[]) => {
    console.log('handleFilesSelected called with:', selectedFiles)
    console.log('window.electronAPI:', window.electronAPI)

    if (!window.electronAPI) {
      console.error('window.electronAPI is not available')
      return
    }

    let filePaths: string[]

    if (typeof selectedFiles[0] === 'string') {
      // 来自electron文件选择器
      filePaths = selectedFiles as string[]
    } else {
      // 来自拖拽（在Electron中，File对象可能有path属性）
      filePaths = (selectedFiles as File[]).map(f => (f as any).path || f.name)
    }

    const newFiles: FileItemType[] = []

    for (const filePath of filePaths) {
      const fileInfo = await window.electronAPI.getFileInfo(filePath)
      if (fileInfo) {
        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: fileInfo.name,
          path: fileInfo.path,
          size: fileInfo.size,
          type: fileInfo.type,
          status: 'pending',
          progress: 0,
          targetFormat: options.targetFormat || undefined,
        })
      }
    }

    setFiles(prev => [...prev, ...newFiles])
  }, [options.targetFormat])

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
  }, [])

  const handleFormatChange = useCallback((id: string, format: string) => {
    setFiles(prev => prev.map(file =>
      file.id === id ? { ...file, targetFormat: format } : file
    ))
  }, [])

  const handleStartConversion = useCallback(async () => {
    if (!window.electronAPI) return

    setIsConverting(true)

    // 设置进度监听
    window.electronAPI.onConversionProgress(({ filePath, progress }) => {
      setFiles(prev => prev.map(f =>
        f.path === filePath ? { ...f, progress } : f
      ))
    })

    for (const file of files) {
      if (file.status !== 'pending') continue

      // 更新状态为转换中
      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: 'converting', progress: 0 } : f
      ))

      try {
        // 调用转换API
        const result = await window.electronAPI.convertFile(
          file.path,
          options.outputDirectory,
          file.targetFormat || options.targetFormat
        )

        // 调试：打印转换结果
        console.log('前端收到转换结果:', result)
        console.log('转换是否成功:', result.success)
        console.log('输出路径:', result.outputPath)
        if (result.error) {
          console.log('转换错误:', result.error)
        }

        // 更新最终状态
        setFiles(prev => prev.map(f =>
          f.id === file.id ? {
            ...f,
            status: result.success ? 'completed' : 'error',
            progress: 100,
            outputPath: result.outputPath,
          } : f
        ))

        if (!result.success && result.error) {
          console.error('Conversion error:', result.error)
        }

      } catch (error) {
        console.error('Conversion error:', error)
        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, status: 'error', progress: 0 } : f
        ))
      }
    }

    setIsConverting(false)
  }, [files, options])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 自定义标题栏 */}
      <TitleBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：文件上传和列表 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 文件拖拽区域 */}
            {files.length === 0 && (
              <FileDropZone onFilesSelected={handleFilesSelected} />
            )}

            {/* 文件列表 */}
            {files.length > 0 && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    文件列表 ({files.length})
                  </h2>
                  <FileDropZone
                    onFilesSelected={handleFilesSelected}
                    className="!p-2 !border-1 text-xs"
                  />
                </div>

                <div className="space-y-3">
                  <AnimatePresence>
                    {files.map((file) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        onRemove={handleRemoveFile}
                        onFormatChange={handleFormatChange}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </div>

          {/* 右侧：转换设置面板 */}
          <div className="lg:col-span-1">
            <ConversionPanel
              options={options}
              onOptionsChange={setOptions}
              onStartConversion={handleStartConversion}
              isConverting={isConverting}
              fileCount={files.filter(f => f.status === 'pending').length}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
