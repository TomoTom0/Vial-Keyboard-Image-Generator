import { ref, computed } from 'vue'

export interface GeneratedImage {
  id: string
  filename: string
  type: 'combined' | 'layer'
  layer?: number
  format: string
  url: string
  size: number
  timestamp: Date
}

export interface GenerationOptions {
  theme: 'dark' | 'light'
  format: 'vertical' | 'horizontal' | 'individual'
  layerRange?: {
    start: number
    end: number
  }
  showComboInfo?: boolean
}

export function useImageGeneration() {
  const images = ref<GeneratedImage[]>([])
  const isGenerating = ref(false)
  const error = ref<string | null>(null)
  const progress = ref(0)

  // 生成中かどうか
  const hasImages = computed(() => images.value.length > 0)

  // 最新の生成結果
  const latestGeneration = computed(() => {
    if (images.value.length === 0) return null
    
    const latest = images.value.reduce((latest, current) => {
      return current.timestamp > latest.timestamp ? current : latest
    })
    
    return {
      timestamp: latest.timestamp,
      count: images.value.filter(img => 
        img.timestamp.getTime() === latest.timestamp.getTime()
      ).length
    }
  })

  /**
   * 画像生成を実行
   */
  const generateImages = async (file: File, options: GenerationOptions) => {
    if (isGenerating.value) {
      throw new Error('既に生成処理が実行中です')
    }

    isGenerating.value = true
    error.value = null
    progress.value = 0

    try {
      // FormDataを作成
      const formData = new FormData()
      formData.append('file', file)
      formData.append('theme', options.theme)
      formData.append('format', options.format)
      formData.append('showComboInfo', String(options.showComboInfo || false))
      
      if (options.layerRange) {
        formData.append('layerRange', JSON.stringify(options.layerRange))
      }

      // 進捗をシミュレート
      const progressInterval = setInterval(() => {
        if (progress.value < 90) {
          progress.value += Math.random() * 15
          if (progress.value > 90) progress.value = 90
        }
      }, 200)

      console.log('🚀 Starting image generation...')
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      progress.value = 95

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      progress.value = 100

      if (!result.success) {
        throw new Error(result.error || '画像生成に失敗しました')
      }

      // 生成された画像を追加
      const newImages: GeneratedImage[] = result.images.map((img: any) => ({
        ...img,
        timestamp: new Date(img.timestamp)
      }))

      // キャッシュされた結果かどうかをログ出力
      if (result.cached) {
        console.log('📦 Used cached result')
      } else {
        console.log('✨ Generated new images')
      }

      images.value = newImages
      console.log(`✅ Generation completed: ${newImages.length} images`)

      return newImages

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '画像生成中に不明なエラーが発生しました'
      error.value = errorMessage
      console.error('❌ Generation failed:', errorMessage)
      throw err
    } finally {
      isGenerating.value = false
      // 進捗を少し残してからリセット
      setTimeout(() => {
        progress.value = 0
      }, 1000)
    }
  }

  /**
   * 画像をクリア
   */
  const clearImages = () => {
    images.value = []
    error.value = null
    progress.value = 0
  }

  /**
   * 特定の画像を削除
   */
  const removeImage = (imageId: string) => {
    images.value = images.value.filter(img => img.id !== imageId)
  }

  /**
   * エラーをクリア
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * 画像をタイプ別にグループ化
   */
  const getImagesByType = () => {
    const combined = images.value.filter(img => img.type === 'combined')
    const layers = images.value.filter(img => img.type === 'layer')
      .sort((a, b) => (a.layer || 0) - (b.layer || 0))
    
    return { combined, layers }
  }

  /**
   * 画像の統計情報を取得
   */
  const getImageStats = computed(() => {
    const totalSize = images.value.reduce((sum, img) => sum + img.size, 0)
    const typeCount = {
      combined: images.value.filter(img => img.type === 'combined').length,
      layer: images.value.filter(img => img.type === 'layer').length
    }

    return {
      count: images.value.length,
      totalSize,
      typeCount,
      averageSize: images.value.length > 0 ? totalSize / images.value.length : 0
    }
  })

  /**
   * 画像のダウンロード統計を管理
   */
  const downloadStats = ref({
    total: 0,
    recent: [] as { imageId: string; timestamp: Date }[]
  })

  const trackDownload = (imageId: string) => {
    downloadStats.value.total++
    downloadStats.value.recent.unshift({
      imageId,
      timestamp: new Date()
    })

    // 最新10件のみ保持
    if (downloadStats.value.recent.length > 10) {
      downloadStats.value.recent = downloadStats.value.recent.slice(0, 10)
    }
  }

  /**
   * API接続テスト
   */
  const testApiConnection = async () => {
    try {
      const response = await fetch('/api/info')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const info = await response.json()
      console.log('✅ API connection test successful:', info)
      return info
    } catch (err) {
      console.error('❌ API connection test failed:', err)
      throw err
    }
  }

  return {
    // State
    images,
    isGenerating,
    error,
    progress,
    downloadStats,

    // Computed
    hasImages,
    latestGeneration,
    imageStats: getImageStats,

    // Methods
    generateImages,
    clearImages,
    removeImage,
    clearError,
    getImagesByType,
    trackDownload,
    testApiConnection
  }
}