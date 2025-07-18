# 使用说明

## 快速开始

### 1. 开发模式
```bash
npm run dev
```
这将同时启动 Vite 开发服务器和 Electron 应用。

### 2. VS Code 调试
- 打开 VS Code
- 按 F5 或点击"运行和调试"
- 选择"Debug Full App"配置
- 应用将在调试模式下启动

### 3. 构建应用
```bash
# 构建当前平台
npm run build:app

# 构建特定平台
npm run build:win     # Windows
npm run build:mac     # macOS  
npm run build:linux   # Linux

# 构建所有平台
npm run build:all
```

## 功能特性

### 文件上传
- **拖拽上传**: 直接将文件拖拽到上传区域
- **点击选择**: 点击"选择文件"按钮浏览文件
- **多文件支持**: 可同时选择多个文件进行批量转换

### 支持的转换

#### 图片转换
- JPG/JPEG → PNG, WebP, PDF
- PNG → JPG, WebP, PDF  
- WebP → JPG, PNG, PDF
- GIF, BMP → 其他图片格式

#### 文档转换
- Word (docx/doc) → 纯文本 (txt)
- Word (docx/doc) → HTML
- 未来将支持 PDF 转换

#### 表格转换
- Excel (xlsx/xls) → CSV
- Excel (xlsx/xls) → JSON
- CSV → Excel (未来支持)

### 转换设置
- **输出目录**: 选择转换后文件的保存位置
- **默认格式**: 设置批量转换的默认输出格式
- **图片质量**: 调整 JPG/WebP 的压缩质量
- **启用压缩**: 减小输出文件大小

### 动画效果
- **拖拽动画**: 文件拖拽时的视觉反馈
- **进度动画**: 圆形进度条和线性进度条
- **状态动画**: 成功/失败状态的动画反馈
- **文件列表**: 流畅的添加/删除动画

## 项目结构

```
converter/
├── src/                    # React 前端代码
│   ├── components/         # React 组件
│   ├── types/             # TypeScript 类型定义
│   ├── utils/             # 工具函数
│   └── App.tsx            # 主应用组件
├── electron/              # Electron 主进程代码
│   ├── services/          # 转换服务
│   ├── main.ts           # 主进程入口
│   └── preload.ts        # 预加载脚本
├── build/                 # 构建资源
├── .vscode/              # VS Code 配置
└── dist/                 # 构建输出
```

## 故障排除

### 常见问题

1. **构建失败**
   - 确保 Node.js 版本 >= 16
   - 删除 node_modules 重新安装: `rm -rf node_modules && npm install`

2. **转换失败**
   - 检查输入文件是否损坏
   - 确保有足够的磁盘空间
   - 检查输出目录权限

3. **调试问题**
   - 确保已运行 `npm run build:electron-dev`
   - 检查 VS Code 是否安装了必要的扩展

### 性能优化
- 大文件转换时建议关闭其他应用
- 批量转换时建议分批处理
- SSD 硬盘可显著提升转换速度
