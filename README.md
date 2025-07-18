# File Converter

一个现代化、简洁、美观的文件转换工具，支持多种文件格式互转。

## 特性

- 🎨 **现代化UI** - 简洁美观的用户界面，支持拖拽上传
- 🚀 **快速转换** - 高效的文件转换引擎
- 📱 **跨平台** - 支持 Windows、macOS、Linux
- 🎭 **酷炫动画** - 流畅的转换进度动画和状态反馈
- 📄 **多格式支持** - 支持文档、图片、表格等多种格式

## 支持的格式

### 文档
- PDF ↔ Word (docx/doc)
- Word → 纯文本 (txt)
- Word → HTML

### 图片
- JPG/JPEG ↔ PNG ↔ WebP
- 支持 GIF、BMP、SVG 等格式
- 图片质量和压缩设置

### 表格
- Excel (xlsx/xls) ↔ CSV
- Excel → JSON

## 开发

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建应用
```bash
# 构建所有平台
npm run build:all

# 构建特定平台
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

### VS Code 调试
项目已配置好 VS Code 调试环境，可以直接按 F5 或点击"运行和调试"按钮启动调试。

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS
- **动画**: Framer Motion
- **桌面**: Electron
- **构建**: Vite + electron-builder
- **转换引擎**: Sharp (图片)、Mammoth (Word)、XLSX (表格)

## 许可证

ISC License

## 贡献

欢迎提交 Issue 和 Pull Request！
