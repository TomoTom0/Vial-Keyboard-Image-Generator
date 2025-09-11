import { ref } from 'vue'

// APIレスポンスの画像データ構造
interface ApiImageData {
  id?: string
  filename: string
  type: 'combined' | 'layer'
  layer?: number
  url: string
  size?: number
  timestamp?: string | number
}

export interface PreviewOptions {
  theme: 'light' | 'dark'
  format: 'individual' | 'vertical' | 'horizontal'
  layerRange: { start: number; end: number }
  showComboInfo: boolean
}

export interface PreviewImage {
  id: string
  layer: number
  type: string
  url: string
  size: number
  timestamp: Date
  temporary: boolean
}

export function usePreviewGeneration() {
  const isGenerating = ref(false)
  const error = ref<string | null>(null)
  const previewImages = ref<PreviewImage[]>([])

  const generatePreview = async (file: File, options: PreviewOptions): Promise<PreviewImage[]> => {
    isGenerating.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('theme', options.theme)
      formData.append('format', options.format)
      formData.append('layerRange', JSON.stringify(options.layerRange))
      formData.append('showComboInfo', options.showComboInfo.toString())
      formData.append('fileLabel', file.name)

      const response = await fetch('/api/preview/generate', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Preview generation failed')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Preview generation failed')
      }

      const images = data.images.map((img: ApiImageData) => ({
        ...img,
        timestamp: new Date(img.timestamp)
      }))

      previewImages.value = images
      return images

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      error.value = errorMessage
      console.error('Preview generation failed:', err)
      throw err
    } finally {
      isGenerating.value = false
    }
  }

  const generateSamplePreview = async (theme: 'light' | 'dark', format: string): Promise<PreviewImage[]> => {
    isGenerating.value = true
    error.value = null

    try {
      const response = await fetch(`/api/preview/sample/${theme}/${format}`, {
        method: 'GET'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Sample preview generation failed')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Sample preview generation failed')
      }

      const images = data.images.map((img: ApiImageData) => ({
        ...img,
        timestamp: new Date(img.timestamp)
      }))

      previewImages.value = images
      return images

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      error.value = errorMessage
      console.error('Sample preview generation failed:', err)
      throw err
    } finally {
      isGenerating.value = false
    }
  }

  const clearPreviews = () => {
    previewImages.value = []
    error.value = null
  }

  const clearError = () => {
    error.value = null
  }

  const cleanupPreviewCache = async (): Promise<void> => {
    try {
      const response = await fetch('/api/preview/cache/cleanup', {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Cache cleanup failed')
      }

      console.log('Preview cache cleaned up successfully')
    } catch (err) {
      console.error('Preview cache cleanup failed:', err)
    }
  }

  return {
    isGenerating,
    error,
    previewImages,
    generatePreview,
    generateSamplePreview,
    clearPreviews,
    clearError,
    cleanupPreviewCache
  }
}