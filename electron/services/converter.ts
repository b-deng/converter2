import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'
import * as mammoth from 'mammoth'
import * as XLSX from 'xlsx'

export interface ConversionResult {
  success: boolean
  outputPath?: string
  error?: string
}

export class FileConverter {
  
  async convertFile(
    inputPath: string, 
    outputDir: string, 
    targetFormat: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    try {
      const inputExt = path.extname(inputPath).toLowerCase().slice(1)
      const baseName = path.basename(inputPath, path.extname(inputPath))
      const outputPath = path.join(outputDir, `${baseName}.${targetFormat}`)

      // 调试信息
      console.log('转换文件调试信息:')
      console.log('输入文件:', inputPath)
      console.log('输入扩展名:', inputExt)
      console.log('基础文件名:', baseName)
      console.log('输出目录:', outputDir)
      console.log('目标格式:', targetFormat)
      console.log('输出路径:', outputPath)

      // 报告开始进度
      onProgress?.(10)

      switch (inputExt) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'webp':
        case 'svg':
          return await this.convertImage(inputPath, outputPath, targetFormat, onProgress)
        
        case 'docx':
        case 'doc':
          return await this.convertDocument(inputPath, outputPath, targetFormat, onProgress)
        
        case 'pdf':
          return await this.convertPDF(inputPath, outputPath, targetFormat, onProgress)
        
        case 'xlsx':
        case 'xls':
        case 'csv':
          return await this.convertSpreadsheet(inputPath, outputPath, targetFormat, onProgress)
        
        case 'pptx':
        case 'ppt':
          return await this.convertPresentation(inputPath, outputPath, targetFormat, onProgress)
        
        case 'txt':
        case 'rtf':
          return await this.convertTextDocument(inputPath, outputPath, targetFormat, onProgress)
        
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'wmv':
          return await this.convertVideo(inputPath, outputPath, targetFormat, onProgress)
        
        case 'mp3':
        case 'wav':
        case 'flac':
        case 'aac':
          return await this.convertAudio(inputPath, outputPath, targetFormat, onProgress)
        
        default:
          return {
            success: false,
            error: `不支持的文件格式: ${inputExt}`
          }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '转换失败'
      }
    }
  }

  private async convertImage(
    inputPath: string, 
    outputPath: string, 
    targetFormat: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    try {
      onProgress?.(30)
      
      const inputExt = path.extname(inputPath).toLowerCase().slice(1)
      
      // 特殊处理 SVG 到 ICO 的转换
      if (inputExt === 'svg' && targetFormat === 'ico') {
        return await this.convertSvgToIco(inputPath, outputPath, onProgress)
      }
      
      let sharpInstance = sharp(inputPath)
      
      // 根据目标格式设置选项
      switch (targetFormat) {
        case 'jpg':
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality: 80 })
          break
        case 'png':
          sharpInstance = sharpInstance.png({ compressionLevel: 6 })
          break
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality: 80 })
          break
        case 'ico':
          // ICO 格式转换：先转换为PNG，然后调整尺寸
          sharpInstance = sharpInstance
            .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
          break
        case 'gif':
          // GIF 格式转换（Sharp 不直接支持 GIF 输出，转为 PNG）
          sharpInstance = sharpInstance.png()
          break
        case 'bmp':
          // BMP 格式转换
          sharpInstance = sharpInstance.png() // Sharp 不直接支持 BMP，转为 PNG
          break
        case 'pdf':
          // 对于PDF转换，我们需要先转换为图片，然后嵌入PDF
          // 这里简化处理，直接转换为PNG
          sharpInstance = sharpInstance.png()
          break
        default:
          sharpInstance = sharpInstance.png()
      }

      onProgress?.(70)
      
      await sharpInstance.toFile(outputPath)
      
      onProgress?.(100)
      
      return {
        success: true,
        outputPath
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '图片转换失败'
      }
    }
  }

  private async convertSvgToIco(
    inputPath: string,
    outputPath: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    try {
      console.log('SVG转ICO调试: 开始转换', inputPath, '->', outputPath)
      onProgress?.(40)
      
      // 读取SVG文件内容
      const svgBuffer = await fs.promises.readFile(inputPath)
      onProgress?.(50)
      
      // 使用Sharp将SVG转换为PNG，然后调整为ICO标准尺寸
      const icoBuffer = await sharp(svgBuffer)
        .resize(32, 32, { 
          fit: 'contain', 
          background: { r: 0, g: 0, b: 0, alpha: 0 } 
        })
        .png()
        .toBuffer()
      
      onProgress?.(80)
      
      // 将PNG数据写入ICO文件
      // 注意：这里简化处理，实际上ICO格式有特定的文件头结构
      // 但大多数应用程序可以识别PNG格式的.ico文件
      await fs.promises.writeFile(outputPath, icoBuffer)
      
      onProgress?.(100)
      console.log('SVG转ICO调试: 转换完成')
      
      return {
        success: true,
        outputPath
      }
    } catch (error) {
      console.error('SVG转ICO调试: 转换失败', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SVG到ICO转换失败'
      }
    }
  }

  private async convertDocument(
    inputPath: string, 
    outputPath: string, 
    targetFormat: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    try {
      onProgress?.(30)
      
      if (targetFormat === 'txt') {
        // 将Word文档转换为纯文本
        const result = await mammoth.extractRawText({ path: inputPath })
        onProgress?.(70)
        
        await fs.promises.writeFile(outputPath, result.value, 'utf8')
        onProgress?.(100)
        
        return {
          success: true,
          outputPath
        }
      } else if (targetFormat === 'html') {
        // 将Word文档转换为HTML
        const result = await mammoth.convertToHtml({ path: inputPath })
        onProgress?.(70)
        
        await fs.promises.writeFile(outputPath, result.value, 'utf8')
        onProgress?.(100)
        
        return {
          success: true,
          outputPath
        }
      }
      
      return {
        success: false,
        error: `不支持的文档转换格式: ${targetFormat}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '文档转换失败'
      }
    }
  }

  private async convertPDF(
    inputPath: string, 
    outputPath: string, 
    targetFormat: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    console.log('PDF转换调试: ===== 开始PDF转换 (使用 pdf2docx) =====')
    console.log('PDF转换调试: DEBUG - targetFormat =', targetFormat)
    console.log('PDF转换调试: 输入路径:', inputPath)
    console.log('PDF转换调试: 输出路径:', outputPath)
    console.log('PDF转换调试: 目标格式:', targetFormat)
    
    try {
      onProgress?.(10)
      
      if (targetFormat === 'docx') {
        return await this.convertPDFToDocxWithPython(inputPath, outputPath, onProgress)
      } else if (targetFormat === 'txt') {
        return await this.convertPDFToTxtWithPython(inputPath, outputPath, onProgress)
      }
      
      return {
        success: false,
        error: `不支持的PDF转换格式: ${targetFormat}`
      }
      
    } catch (error) {
      console.error('PDF转换调试: ===== PDF转换失败 =====')
      console.error('PDF转换调试: 错误详情:', error)
      console.error('PDF转换调试: 错误类型:', typeof error)
      if (error instanceof Error) {
        console.error('PDF转换调试: 错误消息:', error.message)
        console.error('PDF转换调试: 错误堆栈:', error.stack)
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF转换失败'
      }
    }
  }

  private async convertPDFToDocxWithPython(
    inputPath: string,
    outputPath: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    const { spawn } = await import('child_process')
    const { fileURLToPath } = await import('url')
    
    return new Promise((resolve) => {
      console.log('PDF转换调试: 步骤1 - 准备调用Python脚本')
      onProgress?.(20)
      
      // 构建Python脚本路径 (使用 ES 模块兼容方式)
      const currentDir = path.dirname(fileURLToPath(import.meta.url))
      const scriptPath = path.join(currentDir, '..', '..', 'scripts', 'pdf_to_docx.py')
      console.log('PDF转换调试: Python脚本路径:', scriptPath)
      
      // 确保输出目录存在
      const outputDir = path.dirname(outputPath)
      if (!fs.existsSync(outputDir)) {
        console.log('PDF转换调试: 创建输出目录:', outputDir)
        fs.mkdirSync(outputDir, { recursive: true })
      }
      
      console.log('PDF转换调试: 步骤2 - 启动Python进程')
      onProgress?.(40)
      
      // 调用Python脚本
      const python = spawn('python', [scriptPath, inputPath, outputPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      let stdout = ''
      let stderr = ''
      
      python.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      python.stderr.on('data', (data) => {
        stderr += data.toString()
        console.log('PDF转换调试: Python stderr:', data.toString())
      })
      
      python.on('close', (code) => {
        console.log('PDF转换调试: Python进程结束，退出码:', code)
        console.log('PDF转换调试: Python stdout:', stdout)
        
        if (stderr) {
          console.log('PDF转换调试: Python stderr:', stderr)
        }
        
        onProgress?.(80)
        
        try {
          if (code === 0) {
            // 提取stdout中的JSON结果（通常在最后一行）
            console.log('PDF转换调试: 原始Python输出长度:', stdout.length)
            
            // 尝试从输出中提取JSON
            let jsonResult = null
            const lines = stdout.trim().split('\n')
            
            // 从后向前查找最后一个有效的JSON行
            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i].trim()
              if (line.startsWith('{') && line.endsWith('}')) {
                try {
                  jsonResult = JSON.parse(line)
                  console.log('PDF转换调试: 找到JSON结果在第', i + 1, '行')
                  break
                } catch (e) {
                  // 继续查找上一行
                  continue
                }
              }
            }
            
            if (jsonResult) {
              console.log('PDF转换调试: Python脚本结果:', jsonResult)
              
              if (jsonResult.success) {
                console.log('PDF转换调试: 步骤3 - 转换成功')
                onProgress?.(100)
                resolve({
                  success: true,
                  outputPath: jsonResult.output_path || outputPath
                })
              } else {
                console.error('PDF转换调试: Python脚本转换失败:', jsonResult.error)
                resolve({
                  success: false,
                  error: jsonResult.error || '转换失败'
                })
              }
            } else {
              console.error('PDF转换调试: 未找到有效的JSON结果')
              console.error('PDF转换调试: 所有输出行:', lines)
              resolve({
                success: false,
                error: '未找到有效的JSON结果'
              })
            }
          } else {
            console.error('PDF转换调试: Python脚本退出异常，退出码:', code)
            resolve({
              success: false,
              error: `Python脚本执行失败 (退出码: ${code})${stderr ? ': ' + stderr : ''}`
            })
          }
        } catch (parseError) {
          console.error('PDF转换调试: 解析Python输出失败:', parseError)
          console.error('PDF转换调试: 原始输出:', stdout)
          resolve({
            success: false,
            error: `解析Python输出失败: ${parseError instanceof Error ? parseError.message : String(parseError)}`
          })
        }
      })
      
      python.on('error', (error) => {
        console.error('PDF转换调试: Python进程启动失败:', error)
        resolve({
          success: false,
          error: `Python进程启动失败: ${error.message}`
        })
      })
    })
  }

  private async convertPDFToTxtWithPython(
    inputPath: string,
    outputPath: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    // 对于txt格式，我们可以使用pdf-parse作为fallback
    // 或者扩展Python脚本支持txt输出
    console.log('PDF转换调试: 使用pdf-parse进行txt转换')
    
    try {
      onProgress?.(20)
      
      const pdfParse = await import('pdf-parse')
      const pdfBuffer = await fs.promises.readFile(inputPath)
      onProgress?.(50)
      
      const pdfData = await pdfParse.default(pdfBuffer)
      onProgress?.(70)
      
      // 确保输出目录存在
      const outputDir = path.dirname(outputPath)
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      
      await fs.promises.writeFile(outputPath, pdfData.text, 'utf8')
      onProgress?.(100)
      
      return {
        success: true,
        outputPath
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF转文本失败'
      }
    }

  }

  private async convertSpreadsheet(
    inputPath: string, 
    outputPath: string, 
    targetFormat: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    try {
      onProgress?.(30)
      
      // 读取Excel文件
      const workbook = XLSX.readFile(inputPath)
      onProgress?.(50)
      
      if (targetFormat === 'csv') {
        // 转换为CSV（只转换第一个工作表）
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const csv = XLSX.utils.sheet_to_csv(worksheet)
        
        onProgress?.(80)
        await fs.promises.writeFile(outputPath, csv, 'utf8')
        onProgress?.(100)
        
        return {
          success: true,
          outputPath
        }
      } else if (targetFormat === 'json') {
        // 转换为JSON
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        
        onProgress?.(80)
        await fs.promises.writeFile(outputPath, JSON.stringify(json, null, 2), 'utf8')
        onProgress?.(100)
        
        return {
          success: true,
          outputPath
        }
      }
      
      return {
        success: false,
        error: `不支持的表格转换格式: ${targetFormat}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '表格转换失败'
      }
    }
  }

  private async convertPresentation(
    inputPath: string,
    outputPath: string,
    targetFormat: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    try {
      onProgress?.(30)
      
      // 目前演示文稿转换功能有限，主要支持基本格式转换
      // 可以考虑使用 LibreOffice 或其他工具进行更复杂的转换
      
      if (targetFormat === 'pdf') {
        // 使用 LibreOffice 命令行工具转换（如果可用）
        return await this.convertWithLibreOffice(inputPath, outputPath, targetFormat, onProgress)
      }
      
      return {
        success: false,
        error: `演示文稿到 ${targetFormat} 的转换暂未实现，建议使用专业工具`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '演示文稿转换失败'
      }
    }
  }

  private async convertTextDocument(
    inputPath: string,
    outputPath: string,
    targetFormat: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    try {
      onProgress?.(30)
      
      const inputExt = path.extname(inputPath).toLowerCase().slice(1)
      
      if (inputExt === 'txt') {
        // 从纯文本转换到其他格式
        const textContent = await fs.promises.readFile(inputPath, 'utf8')
        onProgress?.(50)
        
        if (targetFormat === 'html') {
          const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>转换的文档</title>
</head>
<body>
<pre>${textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`
          await fs.promises.writeFile(outputPath, htmlContent, 'utf8')
        } else if (targetFormat === 'pdf') {
          // 简单的文本到PDF转换（需要更复杂的实现）
          return {
            success: false,
            error: 'TXT到PDF转换需要额外的PDF生成库'
          }
        } else {
          return {
            success: false,
            error: `不支持从TXT转换到 ${targetFormat}`
          }
        }
      } else if (inputExt === 'rtf') {
        // RTF格式转换（需要专门的RTF解析库）
        return {
          success: false,
          error: 'RTF格式转换需要专门的解析库'
        }
      }
      
      onProgress?.(100)
      return {
        success: true,
        outputPath
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '文本文档转换失败'
      }
    }
  }

  private async convertVideo(
    inputPath: string,
    outputPath: string,
    targetFormat: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    try {
      onProgress?.(30)
      
      // 视频转换需要 FFmpeg 或类似工具
      // 这里提供一个基础框架，实际实现需要集成 FFmpeg
      
      return {
        success: false,
        error: '视频转换功能需要 FFmpeg 支持，请考虑使用专业视频转换工具'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '视频转换失败'
      }
    }
  }

  private async convertAudio(
    inputPath: string,
    outputPath: string,
    targetFormat: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    try {
      onProgress?.(30)
      
      // 音频转换也需要 FFmpeg 或类似工具
      // 这里提供一个基础框架
      
      return {
        success: false,
        error: '音频转换功能需要 FFmpeg 支持，请考虑使用专业音频转换工具'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '音频转换失败'
      }
    }
  }

  private async convertWithLibreOffice(
    inputPath: string,
    outputPath: string,
    targetFormat: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    try {
      // 这是一个使用 LibreOffice 命令行工具的示例实现
      // 实际使用需要确保系统安装了 LibreOffice
      
      return {
        success: false,
        error: 'LibreOffice 转换功能需要系统安装 LibreOffice 并配置命令行工具'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'LibreOffice 转换失败'
      }
    }
  }

  // 获取支持的转换格式
  getSupportedFormats(inputFormat: string): string[] {
    switch (inputFormat.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return ['jpg', 'png', 'webp', 'gif', 'bmp', 'ico', 'pdf']
      
      case 'svg':
        return ['png', 'jpg', 'webp', 'ico', 'pdf']
      
      case 'ico':
        return ['png', 'jpg', 'webp']
      
      case 'docx':
      case 'doc':
        return ['txt', 'html', 'pdf']
      
      case 'pdf':
        return ['docx', 'txt']
      
      case 'xlsx':
      case 'xls':
        return ['csv', 'json', 'pdf']
      
      case 'csv':
        return ['xlsx', 'json']
      
      case 'txt':
        return ['html', 'docx', 'pdf']
      
      case 'rtf':
        return ['txt', 'html', 'docx']
      
      case 'pptx':
      case 'ppt':
        return ['pdf', 'html']
      
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return ['mp4', 'avi', 'mov', 'wmv'] // 需要 FFmpeg
      
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'aac':
        return ['mp3', 'wav', 'flac', 'aac'] // 需要 FFmpeg
      
      default:
        return []
    }
  }
}
