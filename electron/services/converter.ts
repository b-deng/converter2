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
    console.log('PDF转换调试: ===== 开始PDF转换 =====')
    console.log('PDF转换调试: 输入路径:', inputPath)
    console.log('PDF转换调试: 输出路径:', outputPath)
    console.log('PDF转换调试: 目标格式:', targetFormat)
    
    try {
      console.log('PDF转换调试: 步骤1 - 开始动态导入库')
      onProgress?.(20)
      
      // 动态导入 PDF 库
      const pdfParse = await import('pdf-parse')
      const officegen = await import('officegen')
      console.log('PDF转换调试: 步骤1 - 库导入成功')
      
      console.log('PDF转换调试: 步骤2 - 开始读取PDF文件')
      // 读取 PDF 文件
      const pdfBuffer = await fs.promises.readFile(inputPath)
      console.log('PDF转换调试: 步骤2 - PDF文件读取成功，大小:', pdfBuffer.length, 'bytes')
      onProgress?.(40)
      
      console.log('PDF转换调试: 步骤3 - 开始解析PDF内容')
      // 使用 pdf-parse 提取文本
      const pdfData = await pdfParse.default(pdfBuffer)
      console.log('PDF转换调试: 步骤3 - PDF解析成功，提取文本长度:', pdfData.text?.length || 0)
      onProgress?.(60)
      
      if (targetFormat === 'docx') {
        // 确保输出目录存在
        const outputDir = path.dirname(outputPath)
        console.log('PDF转换调试: 输出目录:', outputDir)
        console.log('PDF转换调试: 输出路径:', outputPath)
        
        if (!fs.existsSync(outputDir)) {
          console.log('PDF转换调试: 创建输出目录')
          fs.mkdirSync(outputDir, { recursive: true })
        }
        
        try {
          // 使用 officegen 创建 docx 文件
          const docx = officegen.default('docx')
          
          // 正确的 officegen API 使用方式
          // 添加文本内容到 docx
          const pObj = docx.createP()
          pObj.addText(pdfData.text || '无法提取文本内容')
          
          onProgress?.(80)
          
          // 保存文件
          return new Promise((resolve) => {
            const output = fs.createWriteStream(outputPath)
            
            output.on('error', (error) => {
              console.error('PDF转换调试: 文件流错误:', error)
              resolve({
                success: false,
                error: error.message
              })
            })
            
            output.on('close', () => {
              console.log('PDF转换调试: 文件写入完成，输出路径:', outputPath)
              onProgress?.(100)
              resolve({
                success: true,
                outputPath
              })
            })
            
            output.on('finish', () => {
              console.log('PDF转换调试: 文件流完成')
            })
            
            try {
              console.log('PDF转换调试: 开始生成 docx 文件')
              docx.generate(output)
            } catch (generateError) {
              console.error('PDF转换调试: officegen 生成错误:', generateError)
              resolve({
                success: false,
                error: generateError instanceof Error ? generateError.message : 'officegen 生成失败'
              })
            }
          })
        } catch (error) {
          console.error('PDF转换调试: officegen 创建错误:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : 'officegen 创建失败'
          }
        }
      } else if (targetFormat === 'txt') {
        // 确保输出目录存在
        const outputDir = path.dirname(outputPath)
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true })
        }
        
        // 保存为文本文件
        await fs.promises.writeFile(outputPath, pdfData.text, 'utf8')
        onProgress?.(100)
        
        return {
          success: true,
          outputPath
        }
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

  // 获取支持的转换格式
  getSupportedFormats(inputFormat: string): string[] {
    switch (inputFormat.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return ['jpg', 'png', 'webp', 'pdf']
      
      case 'docx':
      case 'doc':
        return ['txt', 'html']
      
      case 'pdf':
        return ['docx', 'txt']
      
      case 'xlsx':
      case 'xls':
        return ['csv', 'json']
      
      case 'csv':
        return ['xlsx', 'json']
      
      default:
        return []
    }
  }
}
