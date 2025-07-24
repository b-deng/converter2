import * as fs from 'fs'
import * as path from 'path'
import { spawn } from 'child_process'
import sharp from 'sharp'
import * as mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import { PDFDocument, rgb } from 'pdf-lib'

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
          // 图片转PDF：使用pdf-lib创建PDF文档
          return await this.convertImageToPdf(inputPath, outputPath, onProgress)
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

  private async convertImageToPdf(
    inputPath: string,
    outputPath: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    try {
      onProgress?.(30)
      
      // 创建新的PDF文档
      const pdfDoc = await PDFDocument.create()
      
      // 读取图片文件
      const imageBytes = await fs.promises.readFile(inputPath)
      onProgress?.(50)
      
      // 根据文件扩展名确定图片类型
      const ext = path.extname(inputPath).toLowerCase()
      let image
      
      if (ext === '.png') {
        image = await pdfDoc.embedPng(imageBytes)
      } else if (ext === '.jpg' || ext === '.jpeg') {
        image = await pdfDoc.embedJpg(imageBytes)
      } else {
        // 对于其他格式，先用Sharp转换为PNG
        const pngBuffer = await sharp(inputPath).png().toBuffer()
        image = await pdfDoc.embedPng(pngBuffer)
      }
      
      onProgress?.(70)
      
      // 获取图片尺寸
      const { width, height } = image.scale(1)
      
      // 添加页面并插入图片
      const page = pdfDoc.addPage([width, height])
      page.drawImage(image, {
        x: 0,
        y: 0,
        width,
        height,
      })
      
      onProgress?.(90)
      
      // 保存PDF
      const pdfBytes = await pdfDoc.save()
      await fs.promises.writeFile(outputPath, pdfBytes)
      
      onProgress?.(100)
      
      return {
        success: true,
        outputPath
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '图片转PDF失败'
      }
    }
  }

  private async convertDocumentToPdf(
    inputPath: string,
    outputPath: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    try {
      onProgress?.(30)
      
      // 使用mammoth将DOCX转换为HTML
      const result = await mammoth.convertToHtml({ path: inputPath })
      onProgress?.(50)
      
      // 创建PDF文档
      const doc = new jsPDF()
      
      // 简单的HTML到PDF转换（这里使用基础文本处理）
      // 注意：这是一个简化的实现，复杂的HTML可能需要更强大的库
      const textContent = result.value.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n').trim()
      
      onProgress?.(70)
      
      // 将文本添加到PDF
      const lines = doc.splitTextToSize(textContent, 180) // 180mm宽度
      doc.text(lines, 10, 10)
      
      onProgress?.(90)
      
      // 保存PDF
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      await fs.promises.writeFile(outputPath, pdfBuffer)
      
      onProgress?.(100)
      
      return {
        success: true,
        outputPath
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '文档转PDF失败'
      }
    }
  }

  private async convertTextToPdf(
    textContent: string,
    outputPath: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    try {
      onProgress?.(60)
      
      // 创建PDF文档
      const doc = new jsPDF()
      
      // 设置字体和大小
      doc.setFontSize(12)
      
      // 将文本分割成适合页面宽度的行
      const lines = doc.splitTextToSize(textContent, 180) // 180mm宽度
      
      onProgress?.(80)
      
      // 添加文本到PDF，处理分页
      let yPosition = 20
      const lineHeight = 7
      const pageHeight = 280 // A4页面高度约280mm
      
      for (let i = 0; i < lines.length; i++) {
        if (yPosition > pageHeight - 20) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(lines[i], 10, yPosition)
        yPosition += lineHeight
      }
      
      onProgress?.(90)
      
      // 保存PDF
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      await fs.promises.writeFile(outputPath, pdfBuffer)
      
      onProgress?.(100)
      
      return {
        success: true,
        outputPath
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '文本转PDF失败'
      }
    }
  }

  private async convertSpreadsheetToPdf(
    workbook: any,
    outputPath: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    try {
      onProgress?.(60)
      
      // 创建PDF文档
      const doc = new jsPDF()
      
      // 获取第一个工作表
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // 将工作表转换为二维数组
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      onProgress?.(70)
      
      // 设置字体和大小
      doc.setFontSize(10)
      
      let yPosition = 20
      const lineHeight = 6
      const pageHeight = 280
      const colWidth = 30 // 列宽
      
      // 添加表格数据到PDF
      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex] as any[]
        
        if (yPosition > pageHeight - 20) {
          doc.addPage()
          yPosition = 20
        }
        
        // 绘制行数据
        let xPosition = 10
        for (let colIndex = 0; colIndex < Math.min(row.length, 6); colIndex++) { // 最多6列
          const cellValue = String(row[colIndex] || '')
          const truncatedValue = cellValue.length > 15 ? cellValue.substring(0, 15) + '...' : cellValue
          doc.text(truncatedValue, xPosition, yPosition)
          xPosition += colWidth
        }
        
        yPosition += lineHeight
      }
      
      onProgress?.(90)
      
      // 保存PDF
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      await fs.promises.writeFile(outputPath, pdfBuffer)
      
      onProgress?.(100)
      
      return {
        success: true,
        outputPath
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '表格转PDF失败'
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
      } else if (targetFormat === 'pdf') {
        // 将Word文档转换为PDF
        return await this.convertDocumentToPdf(inputPath, outputPath, onProgress)
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
        return await this.convertPDFToDocxWithExecutable(inputPath, outputPath, onProgress)
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

  private logToFile(message: string, data?: any): void {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}\n`
    
    try {
      // 确定日志文件路径
      const isDev = process.env.NODE_ENV === 'development'
      let logPath: string
      
      if (isDev) {
        logPath = path.join(process.cwd(), 'conversion-debug.log')
      } else {
        // 生产环境使用用户数据目录
        const userDataPath = process.env.APPDATA || process.env.HOME || process.cwd()
        logPath = path.join(userDataPath, 'conversion-debug.log')
      }
      
      fs.appendFileSync(logPath, logEntry)
    } catch (error) {
      console.error('日志写入失败:', error)
    }
  }

  private async convertPDFToDocxWithExecutable(
    inputPath: string,
    outputPath: string,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    const { spawn } = await import('child_process')
    
    return new Promise((resolve) => {
      this.logToFile('PDF到DOCX转换开始', {
        inputPath,
        outputPath,
        nodeEnv: process.env.NODE_ENV,
        cwd: process.cwd(),
        execPath: process.execPath
      })

      onProgress?.(20)

      // 确定Python可执行文件路径
      let executablePath: string
      const isDev = process.env.NODE_ENV === 'development'

      if (isDev) {
        // 开发环境：使用构建的可执行文件
        executablePath = path.join(process.cwd(), 'python-dist', 'pdf_to_docx.exe')
      } else {
        // 生产环境：从extraResources中获取可执行文件
        executablePath = path.join(process.resourcesPath, 'python-dist', 'pdf_to_docx.exe')
      }

      this.logToFile('Python可执行文件路径信息', {
        isDev,
        executablePath,
        executableExists: fs.existsSync(executablePath),
        inputExists: fs.existsSync(inputPath),
        resourcesPath: process.resourcesPath,
        execPath: process.execPath
      })

      // 确保输出目录存在
      const outputDir = path.dirname(outputPath)
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      onProgress?.(40)

      // 检查可执行文件是否存在
      if (!fs.existsSync(executablePath)) {
        this.logToFile('Python可执行文件未找到', {
          executablePath,
          suggestion: '可执行文件不存在，请检查构建配置'
        })
        return resolve({
          success: false,
          error: `PDF转换组件未找到。请重新安装应用程序。`
        })
      }

      this.logToFile('直接调用Python可执行文件', {
        executablePath,
        inputPath,
        outputPath,
        executableDir: path.dirname(executablePath)
      })

      // 直接调用可执行文件
      const pythonProcess = spawn(executablePath, [inputPath, outputPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(executablePath)
      })

      let stdout = ''
      let stderr = ''

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
        this.logToFile('Python进程stdout', { data: data.toString() })
      })

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
        this.logToFile('Python进程stderr', { data: data.toString() })
      })

      pythonProcess.on('error', (error: any) => {
        this.logToFile('Python进程启动错误', {
          error: error.message,
          code: error.code,
          executablePath
        })
        
        return resolve({
          success: false,
          error: `PDF转换失败: ${error.message}`
        })
      })

      pythonProcess.on('close', (code) => {
        onProgress?.(80)
        
        this.logToFile('Python进程完成', {
          exitCode: code,
          stdout,
          stderr,
          outputExists: fs.existsSync(outputPath)
        })

        if (code === 0) {
          // 检查输出文件是否存在
          if (fs.existsSync(outputPath)) {
            onProgress?.(100)
            resolve({
              success: true,
              outputPath
            })
          } else {
            resolve({
              success: false,
              error: '转换完成但输出文件未找到'
            })
          }
        } else {
          // 尝试从stdout解析JSON错误信息
          let errorMessage = `转换失败 (退出码: ${code})`
          
          try {
            // 查找JSON输出行
            const lines = stdout.split('\n')
            const jsonLine = lines.find(line => line.trim().startsWith('{'))
            
            if (jsonLine) {
              const result = JSON.parse(jsonLine.trim())
              if (result.error) {
                errorMessage = result.error
              }
            }
          } catch (parseError) {
            // 如果无法解析JSON，使用stderr作为错误信息
            if (stderr.trim()) {
              errorMessage = stderr.trim()
            }
          }
          
          resolve({
            success: false,
            error: errorMessage
          })
        }
      })
    })
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
      
      // 根据输入文件类型读取数据
      const inputExt = path.extname(inputPath).toLowerCase().slice(1)
      let workbook
      
      if (inputExt === 'csv') {
        // 读取CSV文件并转换为工作簿
        const csvContent = await fs.promises.readFile(inputPath, 'utf8')
        const worksheet = XLSX.utils.aoa_to_sheet(
          csvContent.split('\n').map(row => row.split(','))
        )
        workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
      } else {
        // 读取Excel文件
        workbook = XLSX.readFile(inputPath)
      }
      
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
      } else if (targetFormat === 'pdf') {
        // 转换为PDF
        return await this.convertSpreadsheetToPdf(workbook, outputPath, onProgress)
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
          // 文本到PDF转换
          return await this.convertTextToPdf(textContent, outputPath, onProgress)
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
