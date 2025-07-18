import React, { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FolderOpen } from 'lucide-react'

interface FileDropZoneProps {
  onFilesSelected: (files: File[] | string[]) => void
  className?: string
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({ onFilesSelected, className = '' }) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFilesSelected(files)
    }
  }, [onFilesSelected])

  const handleFileSelect = useCallback(async () => {
    console.log('handleFileSelect called')
    console.log('window.electronAPI:', window.electronAPI)

    if (window.electronAPI) {
      try {
        console.log('Calling selectFiles...')
        const filePaths = await window.electronAPI.selectFiles()
        console.log('Selected files:', filePaths)
        if (filePaths.length > 0) {
          onFilesSelected(filePaths)
        }
      } catch (error) {
        console.error('Error selecting files:', error)
      }
    } else {
      console.error('window.electronAPI is not available')
    }
  }, [onFilesSelected])

  return (
    <motion.div
      className={`drag-area ${isDragOver ? 'drag-over' : ''} ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex flex-col items-center space-y-4"
        animate={isDragOver ? { scale: 1.05 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className={`p-4 rounded-full ${isDragOver ? 'bg-primary-100' : 'bg-gray-100'}`}
          animate={isDragOver ? {
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          } : {
            rotate: 0,
            scale: 1
          }}
          transition={{
            duration: isDragOver ? 0.6 : 0.3,
            repeat: isDragOver ? Infinity : 0,
            repeatType: "reverse"
          }}
        >
          <motion.div
            animate={isDragOver ? { y: [-2, 2, -2] } : { y: 0 }}
            transition={{
              duration: 1,
              repeat: isDragOver ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            <Upload
              className={`w-8 h-8 ${isDragOver ? 'text-primary-600' : 'text-gray-500'}`}
            />
          </motion.div>
        </motion.div>

        <div className="text-center">
          <h3 className={`text-lg font-semibold ${isDragOver ? 'text-primary-700' : 'text-gray-700'}`}>
            {isDragOver ? '释放文件开始转换' : '拖拽文件到这里'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            支持多种格式：PDF、Word、Excel、PPT、图片等
          </p>
        </div>

        <motion.button
          onClick={handleFileSelect}
          className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FolderOpen className="w-4 h-4" />
          <span>选择文件</span>
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
