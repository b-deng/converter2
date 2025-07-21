export interface FileItem {
  id: string
  name: string
  path: string
  size: number
  type: string
  status: 'pending' | 'converting' | 'completed' | 'error'
  progress: number
  outputPath?: string
  targetFormat?: string
}

export interface ConversionOptions {
  outputDirectory: string
  targetFormat: string
  quality?: number
  compression?: boolean
}

export type SupportedFormat = 
  | 'pdf' | 'docx' | 'doc' | 'txt' | 'rtf'
  | 'jpg' | 'jpeg' | 'png' | 'gif' | 'bmp' | 'svg' | 'webp' | 'ico'
  | 'xlsx' | 'xls' | 'csv'
  | 'pptx' | 'ppt'
  | 'mp4' | 'avi' | 'mov' | 'wmv'
  | 'mp3' | 'wav' | 'flac' | 'aac'

export interface FormatGroup {
  name: string
  icon: string
  formats: SupportedFormat[]
  color: string
}
