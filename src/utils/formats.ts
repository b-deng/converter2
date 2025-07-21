import { FormatGroup, SupportedFormat } from '../types'

export const formatGroups: FormatGroup[] = [
  {
    name: '文档',
    icon: '📄',
    formats: ['pdf', 'docx', 'doc', 'txt', 'rtf'],
    color: 'blue',
  },
  {
    name: '图片',
    icon: '🖼️',
    formats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'],
    color: 'green',
  },
  {
    name: '表格',
    icon: '📊',
    formats: ['xlsx', 'xls', 'csv'],
    color: 'emerald',
  },
  {
    name: '演示',
    icon: '📽️',
    formats: ['pptx', 'ppt'],
    color: 'orange',
  },
  {
    name: '视频',
    icon: '🎬',
    formats: ['mp4', 'avi', 'mov', 'wmv'],
    color: 'purple',
  },
  {
    name: '音频',
    icon: '🎵',
    formats: ['mp3', 'wav', 'flac', 'aac'],
    color: 'pink',
  },
]

export const getFormatInfo = (format: string) => {
  for (const group of formatGroups) {
    if (group.formats.includes(format as SupportedFormat)) {
      return {
        group: group.name,
        icon: group.icon,
        color: group.color,
      }
    }
  }
  return {
    group: '其他',
    icon: '📁',
    color: 'gray',
  }
}

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getSupportedFormats = (inputFormat: string): SupportedFormat[] => {
  const input = inputFormat.toLowerCase() as SupportedFormat
  const inputGroup = formatGroups.find(group => group.formats.includes(input))
  
  if (!inputGroup) return []
  
  // 返回同组内的其他格式，以及一些通用转换
  const sameGroupFormats = inputGroup.formats.filter(f => f !== input)
  
  // 添加一些常见的跨格式转换
  const commonConversions: SupportedFormat[] = []
  
  if (inputGroup.name === '文档') {
    commonConversions.push('pdf', 'txt')
  } else if (inputGroup.name === '图片') {
    commonConversions.push('jpg', 'png', 'pdf')
  }
  
  return [...new Set([...sameGroupFormats, ...commonConversions])]
}
