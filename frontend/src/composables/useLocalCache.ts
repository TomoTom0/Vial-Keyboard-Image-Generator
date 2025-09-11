import { ref, computed } from 'vue'

// 画像生成設定の型
interface ImageSettings {
  theme: 'dark' | 'light'
  format: 'vertical' | 'horizontal' | 'individual'
  showComboInfo: boolean
}

interface CachedImage {
  id: string
  filename: string
  url: string
  size: number
  timestamp: Date
  settings: {
    theme: 'dark' | 'light'
    format: 'vertical' | 'horizontal' | 'individual'
    showComboInfo: boolean
  }
}

interface CacheEntry {
  images: CachedImage[]
  timestamp: Date
  fileHash: string
  originalFilename: string
}

// JSONから取得される生データの型（Date型がstring型になっている）
interface RawCacheEntry {
  images: Array<{
    id: string
    filename: string
    url: string
    size: number
    timestamp: string
    settings: {
      theme: 'dark' | 'light'
      format: 'vertical' | 'horizontal' | 'individual'
      showComboInfo: boolean
    }
  }>
  timestamp: string
  fileHash: string
  originalFilename: string
}

export function useLocalCache() {
  const cacheEntries = ref<CacheEntry[]>([])
  const maxCacheEntries = 10
  const cacheExpiryHours = 24

  // キャッシュサイズを計算
  const cacheSize = computed(() => {
    return cacheEntries.value.reduce((total, entry) => {
      return total + entry.images.reduce((sum, img) => sum + img.size, 0)
    }, 0)
  })

  // キャッシュエントリ数
  const cacheCount = computed(() => cacheEntries.value.length)

  // 最新のキャッシュエントリ
  const latestCache = computed(() => {
    if (cacheEntries.value.length === 0) return null
    return cacheEntries.value.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    )
  })

  /**
   * ローカルストレージからキャッシュを読み込み
   */
  const loadCache = (): void => {
    try {
      const cached = localStorage.getItem('vial-image-cache')
      if (!cached) return

      const parsed: RawCacheEntry[] = JSON.parse(cached)
      
      // 期限切れのエントリを除外
      const now = new Date()
      const validEntries = parsed.filter(entry => {
        const entryTime = new Date(entry.timestamp)
        const hoursAgo = (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60)
        return hoursAgo < cacheExpiryHours
      })

      cacheEntries.value = validEntries.map(entry => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
        images: entry.images.map(img => ({
          ...img,
          timestamp: new Date(img.timestamp)
        }))
      }))

      console.log(`📦 Loaded ${cacheEntries.value.length} cache entries from localStorage`)

    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error)
      cacheEntries.value = []
    }
  }

  /**
   * ローカルストレージにキャッシュを保存
   */
  const saveCache = (): void => {
    try {
      localStorage.setItem('vial-image-cache', JSON.stringify(cacheEntries.value))
      console.log(`💾 Saved ${cacheEntries.value.length} cache entries to localStorage`)
    } catch (error) {
      console.error('Failed to save cache to localStorage:', error)
    }
  }

  /**
   * ファイルハッシュを生成（簡易版）
   */
  const generateFileHash = async (file: File): Promise<string> => {
    // ファイルの基本情報からハッシュを生成
    const hashInput = `${file.name}-${file.size}-${file.lastModified}`
    
    // 簡易ハッシュ生成（実際のプロダクションではより堅牢な実装が必要）
    let hash = 0
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 32bit整数に変換
    }
    
    return Math.abs(hash).toString(36)
  }

  /**
   * キャッシュから画像を検索
   */
  const getCachedImages = async (file: File, settings: ImageSettings): Promise<CachedImage[] | null> => {
    const fileHash = await generateFileHash(file)
    
    const entry = cacheEntries.value.find(entry => 
      entry.fileHash === fileHash && 
      JSON.stringify(entry.images[0]?.settings) === JSON.stringify(settings)
    )

    if (entry) {
      console.log(`🎯 Cache hit for ${file.name}`)
      return entry.images
    }

    console.log(`❌ Cache miss for ${file.name}`)
    return null
  }

  /**
   * 画像をキャッシュに保存
   */
  const cacheImages = async (
    file: File, 
    images: CachedImage[], 
    settings: ImageSettings
  ): Promise<void> => {
    const fileHash = await generateFileHash(file)
    
    const cachedImages: CachedImage[] = images.map(img => ({
      id: img.id,
      filename: img.filename,
      url: img.url,
      size: img.size,
      timestamp: new Date(img.timestamp),
      settings
    }))

    const newEntry: CacheEntry = {
      images: cachedImages,
      timestamp: new Date(),
      fileHash,
      originalFilename: file.name
    }

    // 同じファイルハッシュの既存エントリを削除
    cacheEntries.value = cacheEntries.value.filter(entry => entry.fileHash !== fileHash)

    // 新しいエントリを先頭に追加
    cacheEntries.value.unshift(newEntry)

    // 最大エントリ数を超えた場合、古いものを削除
    if (cacheEntries.value.length > maxCacheEntries) {
      cacheEntries.value = cacheEntries.value.slice(0, maxCacheEntries)
    }

    saveCache()
    console.log(`✅ Cached ${images.length} images for ${file.name}`)
  }

  /**
   * 特定のキャッシュエントリを削除
   */
  const removeCacheEntry = (fileHash: string): void => {
    const initialLength = cacheEntries.value.length
    cacheEntries.value = cacheEntries.value.filter(entry => entry.fileHash !== fileHash)
    
    if (cacheEntries.value.length < initialLength) {
      saveCache()
      console.log(`🗑️ Removed cache entry: ${fileHash}`)
    }
  }

  /**
   * 全キャッシュをクリア
   */
  const clearCache = (): void => {
    cacheEntries.value = []
    try {
      localStorage.removeItem('vial-image-cache')
      console.log('🧹 Cleared all cache')
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  /**
   * 期限切れキャッシュをクリーンアップ
   */
  const cleanupExpiredCache = (): void => {
    const now = new Date()
    const initialLength = cacheEntries.value.length
    
    cacheEntries.value = cacheEntries.value.filter(entry => {
      const hoursAgo = (now.getTime() - entry.timestamp.getTime()) / (1000 * 60 * 60)
      return hoursAgo < cacheExpiryHours
    })

    if (cacheEntries.value.length < initialLength) {
      saveCache()
      console.log(`🧹 Cleaned up ${initialLength - cacheEntries.value.length} expired cache entries`)
    }
  }

  /**
   * キャッシュ統計を取得
   */
  const getCacheStats = () => {
    const totalImages = cacheEntries.value.reduce((sum, entry) => sum + entry.images.length, 0)
    const oldestEntry = cacheEntries.value.length > 0 
      ? cacheEntries.value.reduce((oldest, current) => 
          current.timestamp < oldest.timestamp ? current : oldest
        )
      : null

    return {
      entryCount: cacheEntries.value.length,
      totalImages,
      totalSize: cacheSize.value,
      oldestEntry: oldestEntry ? {
        filename: oldestEntry.originalFilename,
        timestamp: oldestEntry.timestamp
      } : null
    }
  }

  /**
   * ファイルサイズをフォーマット
   */
  const formatCacheSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    // State
    cacheEntries,
    cacheSize,
    cacheCount,
    latestCache,

    // Methods
    loadCache,
    saveCache,
    getCachedImages,
    cacheImages,
    removeCacheEntry,
    clearCache,
    cleanupExpiredCache,
    getCacheStats,
    formatCacheSize
  }
}