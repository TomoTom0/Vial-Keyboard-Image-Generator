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
      // 進捗をシミュレート
      const progressInterval = setInterval(() => {
        if (progress.value < 90) {
          progress.value += Math.random() * 15
          if (progress.value > 90) progress.value = 90
        }
      }, 200)

      console.log('🚀 バックエンドAPI経由で画像生成を開始...')
      
      // FormDataを作成してバックエンドに送信
      const formData = new FormData()
      formData.append('file', file)
      formData.append('theme', options.theme)
      formData.append('format', options.format)
      if (options.layerRange) {
        formData.append('layerStart', options.layerRange.start.toString())
        formData.append('layerEnd', options.layerRange.end.toString())
      }
      if (options.showComboInfo !== undefined) {
        formData.append('showComboInfo', options.showComboInfo.toString())
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const result = await response.json()
      clearInterval(progressInterval)
      progress.value = 95

      // レスポンスをGeneratedImage形式に変換
      const newImages: GeneratedImage[] = result.images.map((img: any) => ({
        id: img.id || `${img.type}-${img.layer || 0}-${Date.now()}`,
        filename: img.filename,
        type: img.type,
        layer: img.layer,
        format: options.format,
        url: img.url,
        size: img.size || 0,
        timestamp: new Date(img.timestamp || Date.now())
      }))

      progress.value = 100

      images.value = newImages
      console.log(`✅ 画像生成完了: ${newImages.length}個の画像を生成しました`)

      return newImages

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '画像生成中に不明なエラーが発生しました'
      error.value = errorMessage
      console.error('❌ 画像生成に失敗:', errorMessage)
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
   * ファイル履歴から画像生成を実行（コンテンツから直接）
   */
  const generateImagesFromContent = async (content: string, filename: string, options: GenerationOptions) => {
    if (isGenerating.value) {
      throw new Error('既に生成処理が実行中です')
    }

    isGenerating.value = true
    error.value = null
    progress.value = 0

    try {
      // 進捗をシミュレート
      const progressInterval = setInterval(() => {
        if (progress.value < 90) {
          progress.value += Math.random() * 15
          if (progress.value > 90) progress.value = 90
        }
      }, 200)

      console.log('🚀 バックエンドAPI経由で画像生成を開始... (履歴から)')
      
      // Base64コンテンツからBlobを作成
      const byteCharacters = atob(content.split(',')[1])
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/json' })
      const file = new File([blob], filename, { type: 'application/json' })

      // FormDataを作成してバックエンドに送信
      const formData = new FormData()
      formData.append('file', file)
      formData.append('theme', options.theme)
      formData.append('format', options.format)
      if (options.layerRange) {
        formData.append('layerStart', options.layerRange.start.toString())
        formData.append('layerEnd', options.layerRange.end.toString())
      }
      if (options.showComboInfo !== undefined) {
        formData.append('showComboInfo', options.showComboInfo.toString())
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const result = await response.json()
      clearInterval(progressInterval)
      progress.value = 95

      // レスポンスをGeneratedImage形式に変換
      const newImages: GeneratedImage[] = result.images.map((img: any) => ({
        id: img.id || `${img.type}-${img.layer || 0}-${Date.now()}`,
        filename: img.filename,
        type: img.type,
        layer: img.layer,
        format: options.format,
        url: img.url,
        size: img.size || 0,
        timestamp: new Date(img.timestamp || Date.now())
      }))
      
      progress.value = 100
      images.value = newImages
      console.log(`✅ 画像生成完了: ${newImages.length}個の画像を生成しました`)

      return newImages
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '画像生成中に不明なエラーが発生しました'
      error.value = errorMessage
      console.error('❌ 画像生成に失敗:', errorMessage)
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
   * ファイルをData URLとして読み取り
   */
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
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
    generateImagesFromContent,
    clearImages,
    removeImage,
    clearError,
    getImagesByType,
    trackDownload,
    testApiConnection
  }
}