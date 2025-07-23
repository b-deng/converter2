import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { spawn } from 'child_process'

/**
 * 生产环境诊断脚本
 * 用于检查生产环境与开发环境的差异
 */
class ProductionDiagnostic {
  constructor() {
    this.logPath = path.join(app.getPath('userData'), 'diagnostic.log')
    this.log('=== 生产环境诊断开始 ===')
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`
    
    console.log(logEntry)
    
    try {
      fs.appendFileSync(this.logPath, logEntry)
    } catch (error) {
      console.error('无法写入诊断日志:', error)
    }
  }

  async diagnose() {
    // 1. 环境信息
    this.log('1. 环境信息检查', {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeEnv: process.env.NODE_ENV,
      cwd: process.cwd(),
      execPath: process.execPath,
      argv: process.argv,
      userDataPath: app.getPath('userData'),
      appPath: app.getAppPath()
    })

    // 2. 文件路径检查
    await this.checkFilePaths()

    // 3. Python 环境检查
    await this.checkPythonEnvironment()

    // 4. 权限检查
    await this.checkPermissions()

    // 5. 依赖检查
    await this.checkDependencies()

    this.log('=== 生产环境诊断完成 ===')
    this.log(`诊断日志已保存到: ${this.logPath}`)
  }

  async checkFilePaths() {
    this.log('2. 文件路径检查')
    
    const pathsToCheck = [
      path.join(process.cwd(), 'scripts', 'pdf_to_docx.py'),
      path.join(app.getAppPath(), 'scripts', 'pdf_to_docx.py'),
      path.join(__dirname, '..', 'scripts', 'pdf_to_docx.py'),
      path.join(process.resourcesPath, 'app', 'scripts', 'pdf_to_docx.py'),
      path.join(process.resourcesPath, 'scripts', 'pdf_to_docx.py')
    ]

    for (const filePath of pathsToCheck) {
      const exists = fs.existsSync(filePath)
      this.log(`文件检查: ${filePath}`, { exists })
      
      if (exists) {
        try {
          const stats = fs.statSync(filePath)
          this.log(`文件详情: ${filePath}`, {
            size: stats.size,
            modified: stats.mtime,
            isFile: stats.isFile()
          })
        } catch (error) {
          this.log(`文件详情获取失败: ${filePath}`, { error: error.message })
        }
      }
    }
  }

  async checkPythonEnvironment() {
    this.log('3. Python 环境检查')
    
    return new Promise((resolve) => {
      const python = spawn('python', ['--version'], { stdio: ['pipe', 'pipe', 'pipe'] })
      
      let stdout = ''
      let stderr = ''
      
      python.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      python.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
      python.on('close', (code) => {
        this.log('Python 版本检查', {
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        })
        
        if (code === 0) {
          // 检查 pdf2docx 库
          this.checkPythonLibrary('pdf2docx', resolve)
        } else {
          resolve()
        }
      })
      
      python.on('error', (error) => {
        this.log('Python 启动失败', { error: error.message })
        resolve()
      })
    })
  }

  checkPythonLibrary(libraryName, callback) {
    const python = spawn('python', ['-c', `import ${libraryName}; print('${libraryName} 可用')`], {
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    let stdout = ''
    let stderr = ''
    
    python.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    python.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    python.on('close', (code) => {
      this.log(`Python 库检查: ${libraryName}`, {
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        available: code === 0
      })
      callback()
    })
  }

  async checkPermissions() {
    this.log('4. 权限检查')
    
    const testPaths = [
      app.getPath('userData'),
      app.getPath('temp'),
      process.cwd()
    ]

    for (const testPath of testPaths) {
      try {
        const testFile = path.join(testPath, 'permission_test.txt')
        fs.writeFileSync(testFile, 'test')
        fs.unlinkSync(testFile)
        this.log(`权限检查通过: ${testPath}`)
      } catch (error) {
        this.log(`权限检查失败: ${testPath}`, { error: error.message })
      }
    }
  }

  async checkDependencies() {
    this.log('5. 依赖检查')
    
    const dependencies = [
      'sharp',
      'mammoth',
      'xlsx',
      'pdf-parse'
    ]

    for (const dep of dependencies) {
      try {
        require.resolve(dep)
        this.log(`依赖检查通过: ${dep}`)
      } catch (error) {
        this.log(`依赖检查失败: ${dep}`, { error: error.message })
      }
    }
  }
}

// 导出诊断类
export default ProductionDiagnostic
export { ProductionDiagnostic }

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const diagnostic = new ProductionDiagnostic()
  diagnostic.diagnose().catch(console.error)
}
