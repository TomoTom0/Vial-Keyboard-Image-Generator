import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * ウィンドウサイズに応じた共通倍率システム
 * PNG/SVG両方に対応するレスポンシブスケール
 */
export function useResponsiveScale() {
  // ウィンドウサイズを監視
  const windowWidth = ref(window.innerWidth)
  const windowHeight = ref(window.innerHeight)

  // コンテンツ用レスポンシブ倍率計算（ヘッダー画像幅基準）
  const contentScale = computed(() => {
    const sidebarWidth = 250
    const marginWidth = 100
    const containerPadding = 30 // padding 15px * 2
    const contentMargin = 40 // 追加マージン

    const availableWidth = windowWidth.value - sidebarWidth - marginWidth - containerPadding - contentMargin
    const headerImageWidth = 1200 // 想定ヘッダー画像幅

    // 基本倍率をヘッダー画像が利用可能領域に収まる比率で計算
    let baseScale = availableWidth / headerImageWidth

    // 適切な最小・最大倍率に制限
    const minScale = 0.4  // 最小40%
    const maxScale = 1.2  // 最大120%

    baseScale = Math.min(maxScale, Math.max(minScale, baseScale))

    return baseScale
  })

  // 従来のブレークポイントベース倍率（互換性のため保持）
  const responsiveScale = computed(() => {
    const width = windowWidth.value

    // より大きな倍率に調整
    if (width >= 1400) return 1.2      // デスクトップ大
    if (width >= 1200) return 1.1      // デスクトップ
    if (width >= 992) return 1.0       // タブレット横
    if (width >= 768) return 0.9       // タブレット縦
    if (width >= 576) return 0.8       // スマホ横
    return 0.7                         // スマホ縦
  })

  // カスタムスケール計算（特定用途向け）
  const getCustomScale = (baseScale: number = 1.0, minScale: number = 0.3, maxScale: number = 2.0) => {
    return computed(() => {
      const scale = responsiveScale.value * baseScale
      return Math.min(maxScale, Math.max(minScale, scale))
    })
  }

  // ウィンドウリサイズハンドラ
  const handleResize = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }

  // ライフサイクルフック
  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  return {
    windowWidth: readonly(windowWidth),
    windowHeight: readonly(windowHeight),
    responsiveScale: readonly(responsiveScale),
    contentScale: readonly(contentScale),
    getCustomScale
  }
}

// readonly helper（Vue 3.4以前の互換性）
function readonly<T>(ref: any): any {
  return computed(() => ref.value)
}