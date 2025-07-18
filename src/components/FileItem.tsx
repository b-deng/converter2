import React from 'react'
import { motion } from 'framer-motion'
import { FileText, X } from 'lucide-react'
import { FileItem as FileItemType } from '../types'
import { getFormatInfo, formatFileSize } from '../utils/formats'
import { CircularProgress } from './CircularProgress'
import { SuccessAnimation } from './SuccessAnimation'
import { ErrorAnimation } from './ErrorAnimation'

interface FileItemProps {
  file: FileItemType
  onRemove: (id: string) => void
  onFormatChange: (id: string, format: string) => void
}

export const FileItem: React.FC<FileItemProps> = ({ file, onRemove, onFormatChange }) => {
  const formatInfo = getFormatInfo(file.type)

  const getStatusIcon = () => {
    switch (file.status) {
      case 'pending':
        return <FileText className="w-5 h-5 text-gray-500" />
      case 'converting':
        return <CircularProgress progress={file.progress} size={20} strokeWidth={2} />
      case 'completed':
        return <SuccessAnimation className="w-5 h-5" />
      case 'error':
        return <ErrorAnimation className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (file.status) {
      case 'pending':
        return 'border-gray-200'
      case 'converting':
        return 'border-primary-200 bg-primary-50'
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200'
    }
  }

  return (
    <motion.div
      className={`file-item ${getStatusColor()}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {getStatusIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{formatInfo.icon}</span>
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </h4>
            </div>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)} • {file.type.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {file.status === 'pending' && (
            <select
              value={file.targetFormat || ''}
              onChange={(e) => onFormatChange(file.id, e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
              title="选择输出格式"
              aria-label="选择输出格式"
            >
              <option value="">选择格式</option>
              <option value="pdf">PDF</option>
              <option value="docx">Word</option>
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
            </select>
          )}

          <button
            type="button"
            onClick={() => onRemove(file.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="删除文件"
            aria-label="删除文件"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {file.status === 'converting' && (
        <motion.div
          className="mt-3 flex items-center space-x-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CircularProgress progress={file.progress} size={24} strokeWidth={2} />
          <div className="flex-1">
            <div className="text-xs text-gray-600 mb-1">转换中...</div>
            <div className="progress-bar">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${file.progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>
          <span className="text-xs font-medium text-primary-600">{Math.round(file.progress)}%</span>
        </motion.div>
      )}

      {file.status === 'completed' && file.outputPath && (
        <motion.div
          className="mt-2 text-xs text-green-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ✓ 转换完成：{file.outputPath}
        </motion.div>
      )}

      {file.status === 'error' && (
        <motion.div
          className="mt-2 text-xs text-red-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ✗ 转换失败，请重试
        </motion.div>
      )}
    </motion.div>
  )
}
