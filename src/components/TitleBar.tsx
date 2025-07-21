import React, { useState, useEffect } from 'react'
import './TitleBar.css'

// 扩展 Window 接口以包含 electronAPI
declare global {
  interface Window {
    electronAPI: {
      selectFiles: () => Promise<string[]>
      selectOutputDirectory: () => Promise<string>
      convertFile: (filePath: string, outputDir: string, targetFormat: string) => Promise<any>
      getSupportedFormats: (inputFormat: string) => Promise<string[]>
      getFileInfo: (filePath: string) => Promise<any>
      onConversionProgress: (callback: (data: { filePath: string; progress: number }) => void) => void
      windowMinimize: () => Promise<void>
      windowMaximize: () => Promise<void>
      windowClose: () => Promise<void>
      windowIsMaximized: () => Promise<boolean>
    }
  }
}

const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    // 检查初始状态
    if (window.electronAPI) {
      window.electronAPI.windowIsMaximized().then(setIsMaximized)
    }
  }, [])

  const handleMinimize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.windowMinimize()
    }
  }

  const handleMaximize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.windowMaximize()
      // 更新状态
      const maximized = await window.electronAPI.windowIsMaximized()
      setIsMaximized(maximized)
    }
  }

  const handleClose = async () => {
    if (window.electronAPI) {
      await window.electronAPI.windowClose()
    }
  }

  return (
    <div className="title-bar">
      <div className="title-bar-drag-region">
        <div className="title-bar-title">
          <div className="app-icon-container">
            <span className="app-icon">精</span>
          </div>
          <div className="app-info">
            <span className="app-name">精转数智</span>
          </div>
        </div>
      </div>
      <div className="title-bar-controls">
        <button 
          className="title-bar-button minimize-button" 
          onClick={handleMinimize}
          title="最小化"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="2" y="5" width="8" height="2" fill="currentColor" />
          </svg>
        </button>
        <button 
          className="title-bar-button maximize-button" 
          onClick={handleMaximize}
          title={isMaximized ? "还原" : "最大化"}
        >
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="2" y="2" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1" />
              <rect x="4" y="4" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          )}
        </button>
        <button 
          className="title-bar-button close-button" 
          onClick={handleClose}
          title="关闭"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default TitleBar
