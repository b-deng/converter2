import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 构建脚本：将 Python 脚本打包为独立可执行文件
 * 使用 PyInstaller 将 pdf_to_docx.py 编译为 .exe 文件
 */

const SCRIPT_DIR = path.join(__dirname, 'scripts');
const BUILD_DIR = path.join(__dirname, 'python-build');
const DIST_DIR = path.join(__dirname, 'python-dist');

console.log('🚀 开始构建 Python 可执行文件...');

// 检查 Python 脚本是否存在
const pythonScript = path.join(SCRIPT_DIR, 'pdf_to_docx.py');
if (!fs.existsSync(pythonScript)) {
  console.error('❌ Python 脚本不存在:', pythonScript);
  process.exit(1);
}

// 创建构建目录
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

try {
  // 检查 PyInstaller 是否已安装
  console.log('📦 检查 PyInstaller...');
  try {
    execSync('pyinstaller --version', { stdio: 'pipe' });
    console.log('✅ PyInstaller 已安装');
  } catch (error) {
    console.log('📥 安装 PyInstaller...');
    execSync('pip install pyinstaller', { stdio: 'inherit' });
  }

  // 检查 pdf2docx 是否已安装
  console.log('📦 检查 pdf2docx...');
  try {
    execSync('python -c "import pdf2docx"', { stdio: 'pipe' });
    console.log('✅ pdf2docx 已安装');
  } catch (error) {
    console.log('📥 安装 pdf2docx...');
    execSync('pip install pdf2docx', { stdio: 'inherit' });
  }

  // 使用 PyInstaller 构建可执行文件
  console.log('🔨 使用 PyInstaller 构建可执行文件...');
  const pyinstallerCmd = [
    'pyinstaller',
    '--onefile',                    // 生成单个可执行文件
    '--clean',                      // 清理临时文件
    '--noconfirm',                  // 不询问覆盖
    `--distpath="${DIST_DIR}"`,     // 输出目录
    `--workpath="${BUILD_DIR}"`,    // 工作目录
    '--console',                    // 控制台应用
    '--name=pdf_to_docx',          // 可执行文件名
    pythonScript
  ].join(' ');

  console.log('执行命令:', pyinstallerCmd);
  execSync(pyinstallerCmd, { stdio: 'inherit', cwd: __dirname });

  // 检查生成的可执行文件
  const exeFile = path.join(DIST_DIR, 'pdf_to_docx.exe');
  if (fs.existsSync(exeFile)) {
    const stats = fs.statSync(exeFile);
    console.log(`✅ 构建成功! 可执行文件: ${exeFile}`);
    console.log(`📊 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // 测试可执行文件
    console.log('🧪 测试可执行文件...');
    try {
      const testOutput = execSync(`"${exeFile}" --help`, { 
        stdio: 'pipe', 
        encoding: 'utf8',
        timeout: 10000 
      });
      console.log('✅ 可执行文件测试通过');
    } catch (testError) {
      console.log('⚠️  可执行文件测试失败，但文件已生成');
    }
  } else {
    console.error('❌ 构建失败: 未找到生成的可执行文件');
    process.exit(1);
  }

  console.log('🎉 Python 可执行文件构建完成!');
  console.log('📁 输出目录:', DIST_DIR);

} catch (error) {
  console.error('❌ 构建过程中出现错误:', error.message);
  process.exit(1);
}
