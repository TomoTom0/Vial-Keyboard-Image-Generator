import { ref, computed } from 'vue'

export interface UploadedFile {
  file: File
  id: string
  timestamp: Date
}

export function useFileUpload() {
  const currentFile = ref<UploadedFile | null>(null)
  const isUploading = ref(false)
  const uploadError = ref<string | null>(null)
  const uploadProgress = ref(0)

  // 現在のファイルがあるかどうか
  const hasFile = computed(() => currentFile.value !== null)

  // ファイル情報
  const fileInfo = computed(() => {
    if (!currentFile.value) return null
    
    const file = currentFile.value.file
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    }
  })

  /**
   * ファイルを設定
   */
  const setFile = (file: File) => {
    uploadError.value = null
    currentFile.value = {
      file,
      id: generateFileId(),
      timestamp: new Date()
    }
  }

  /**
   * ファイルをクリア
   */
  const clearFile = () => {
    currentFile.value = null
    uploadError.value = null
    uploadProgress.value = 0
    isUploading.value = false
  }

  /**
   * ファイルをAPIにアップロード
   */
  const uploadFile = async (options: {
    theme?: 'dark' | 'light'
    format?: 'vertical' | 'horizontal' | 'individual'
    layerRange?: { start: number; end: number }
    showComboInfo?: boolean
  } = {}) => {
    if (!currentFile.value) {
      throw new Error('アップロードするファイルがありません')
    }

    isUploading.value = true
    uploadError.value = null
    uploadProgress.value = 0

    try {
      const formData = new FormData()
      formData.append('file', currentFile.value.file)
      formData.append('theme', options.theme || 'dark')
      formData.append('format', options.format || 'vertical')
      formData.append('showComboInfo', String(options.showComboInfo || false))
      
      if (options.layerRange) {
        formData.append('layerRange', JSON.stringify(options.layerRange))
      }

      // アップロード進捗をシミュレート
      const progressInterval = setInterval(() => {
        if (uploadProgress.value < 90) {
          uploadProgress.value += 10
        }
      }, 100)

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      uploadProgress.value = 100

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'アップロードに失敗しました')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '画像生成に失敗しました')
      }

      return result.images

    } catch (error) {
      uploadError.value = error instanceof Error ? error.message : '不明なエラーが発生しました'
      throw error
    } finally {
      isUploading.value = false
    }
  }

  /**
   * ファイルの妥当性を検証
   */
  const validateFile = (file: File): string | null => {
    // ファイル形式チェック
    if (!file.name.toLowerCase().endsWith('.vil')) {
      return '.vilファイルのみアップロード可能です'
    }

    // ファイルサイズチェック（10MB）
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return 'ファイルサイズは10MB以下にしてください'
    }

    return null
  }

  /**
   * ファイルIDを生成
   */
  const generateFileId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * ファイルサイズをフォーマット
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    // State
    currentFile,
    isUploading,
    uploadError,
    uploadProgress,

    // Computed
    hasFile,
    fileInfo,

    // Methods
    setFile,
    clearFile,
    uploadFile,
    validateFile,
    formatFileSize
  }
}