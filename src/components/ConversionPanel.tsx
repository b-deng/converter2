import React from 'react'
import { motion } from 'framer-motion'
import { Settings, FolderOpen, Play } from 'lucide-react'
import { ConversionOptions } from '../types'

interface ConversionPanelProps {
  options: ConversionOptions
  onOptionsChange: (options: ConversionOptions) => void
  onStartConversion: () => void
  isConverting: boolean
  fileCount: number
}

export const ConversionPanel: React.FC<ConversionPanelProps> = ({
  options,
  onOptionsChange,
  onStartConversion,
  isConverting,
  fileCount,
}) => {
  const handleOutputDirectorySelect = async () => {
    if (window.electronAPI) {
      try {
        const directory = await window.electronAPI.selectOutputDirectory()
        if (directory) {
          onOptionsChange({ ...options, outputDirectory: directory })
        }
      } catch (error) {
        console.error('Error selecting output directory:', error)
      }
    }
  }

  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">转换设置</h3>
      </div>
      
      <div className="space-y-4">
        {/* 输出目录选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            输出目录
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={options.outputDirectory}
              readOnly
              placeholder="选择输出目录..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
            />
            <button
              onClick={handleOutputDirectorySelect}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center space-x-1"
            >
              <FolderOpen className="w-4 h-4" />
              <span>浏览</span>
            </button>
          </div>
        </div>
        
        {/* 默认输出格式 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            默认输出格式
          </label>
          <select
            value={options.targetFormat}
            onChange={(e) => onOptionsChange({ ...options, targetFormat: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">请选择格式</option>
            <optgroup label="文档">
              <option value="pdf">PDF</option>
              <option value="docx">Word (.docx)</option>
              <option value="txt">文本 (.txt)</option>
            </optgroup>
            <optgroup label="图片">
              <option value="jpg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </optgroup>
            <optgroup label="其他">
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="pptx">PowerPoint (.pptx)</option>
            </optgroup>
          </select>
        </div>
        
        {/* 质量设置 */}
        {(options.targetFormat === 'jpg' || options.targetFormat === 'webp') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图片质量: {options.quality || 80}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={options.quality || 80}
              onChange={(e) => onOptionsChange({ ...options, quality: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        )}
        
        {/* 压缩选项 */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="compression"
            checked={options.compression || false}
            onChange={(e) => onOptionsChange({ ...options, compression: e.target.checked })}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="compression" className="text-sm text-gray-700">
            启用压缩（减小文件大小）
          </label>
        </div>
      </div>
      
      {/* 开始转换按钮 */}
      <motion.button
        onClick={onStartConversion}
        disabled={isConverting || fileCount === 0 || !options.outputDirectory}
        className={`w-full mt-6 px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${
          isConverting || fileCount === 0 || !options.outputDirectory
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
        }`}
        whileHover={!isConverting && fileCount > 0 && options.outputDirectory ? { scale: 1.02 } : {}}
        whileTap={!isConverting && fileCount > 0 && options.outputDirectory ? { scale: 0.98 } : {}}
      >
        {isConverting ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Play className="w-5 h-5" />
            </motion.div>
            <span>转换中...</span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            <span>开始转换 ({fileCount} 个文件)</span>
          </>
        )}
      </motion.button>
    </motion.div>
  )
}
