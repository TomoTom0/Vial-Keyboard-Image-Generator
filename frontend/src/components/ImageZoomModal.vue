<template>
  <!-- ルーペダイアログのみ表示（元画像は表示しない） -->
  <div
    v-if="isOpen"
    class="loupe-dialog"
    :style="loupeDialogStyle"
    @mousedown="startLoupeDrag"
  >
    <!-- ルーペ内部の拡大表示 -->
    <div class="loupe-content">
      <!-- ルーペ内に表示する拡大画像 -->
      <div class="loupe-magnifier" :style="loupeContentStyle">
        <!-- SVGコンテンツの拡大表示 -->
        <div
          v-if="combinedSVGContent"
          class="loupe-image svg-container"
          v-html="combinedSVGContent"
        ></div>
        <!-- PNG画像の拡大表示 -->
        <img
          v-else-if="combinedImageUrl"
          :src="combinedImageUrl"
          :alt="title"
          class="loupe-image"
        />
        <!-- フォールバック画像の拡大表示 -->
        <img
          v-else
          :src="props.imageUrl"
          :alt="title"
          class="loupe-image"
        />
      </div>
    </div>

    <!-- 倍率変更ボタン（左上） -->
    <div class="zoom-controls">
      <button class="zoom-btn-control" @click="zoomOut" title="縮小">-</button>
      <button class="zoom-btn-control" @click="zoomIn" title="拡大">+</button>
    </div>

    <!-- 閉じるボタン（右上に小さく半透明） -->
    <button class="close-btn" @click="closeModal">&times;</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useImagesStore } from '../stores/images'
import { useSettingsStore } from '../stores/settings'
import { useVialStore } from '../stores/vial'

interface Props {
  isOpen: boolean
  imageUrl: string
  title: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  gridSectionChange: [section: number]
}>()

// ストア
const imagesStore = useImagesStore()
const settingsStore = useSettingsStore()
const vialStore = useVialStore()

// DOM参照（不要になったため削除）
// const imageContainer = ref<HTMLElement>()
// const baseImageRef = ref<HTMLImageElement>()

// ルーペ状態
const zoomLevel = ref(1) // 基本倍率（1倍から開始）
const loupeX = ref(100) // ルーペのX座標（ピクセル）
const loupeY = ref(100) // ルーペのY座標（ピクセル）

// 画像サイズ
const imageSize = ref({ width: 0, height: 0 })
const containerSize = ref({ width: 0, height: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, loupeX: 0, loupeY: 0 })

// 結合キャンバス状態
const combinedImageUrl = ref('')
const combinedSVGContent = ref('')
const isGeneratingCombined = ref(false)


// 画像URLからキャンバスに読み込み
const loadImageToCanvas = (imageUrl: string): Promise<HTMLCanvasElement | null> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(canvas)
    }

    img.onerror = () => {
      resolve(null)
    }

    img.src = imageUrl
  })
}

// 結合画像URLを生成（ズーム表示では常にSVG使用）
const updateCombinedImageUrl = async () => {
  // 常にSVGを最初に試行
  const svgContent = await generateSVGFromVialStore()
  if (svgContent) {
    combinedSVGContent.value = svgContent
    combinedImageUrl.value = '' // SVG表示時はPNG URLをクリア

    // SVGからサイズ情報を抽出
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml')
    const svgElement = svgDoc.documentElement
    const width = parseInt(svgElement.getAttribute('width') || '400')
    const height = parseInt(svgElement.getAttribute('height') || '200')

    // 画像サイズを設定
    imageSize.value = { width, height }


    // SVGコンテンツ更新後にサイズを再計算
    nextTick(() => {
      updateContainerSize()
    })
    return
  }

  // SVG生成に失敗した場合のみキャンバス結合を使用
  const combinedCanvas = await generatePreviewStyleCombinedCanvas()
  if (combinedCanvas) {
    combinedImageUrl.value = combinedCanvas.toDataURL('image/png', 1.0)
    combinedSVGContent.value = ''

    // 画像サイズを設定
    imageSize.value = { width: combinedCanvas.width, height: combinedCanvas.height }


    // 画像更新後にサイズを再計算
    nextTick(() => {
      updateContainerSize()
    })
  } else {
    // 最終フォールバック：元の画像を使用
    combinedImageUrl.value = props.imageUrl
    combinedSVGContent.value = ''
  }
}

// PreviewTabと同様の結合方式（ヘッダー + レイヤー + コンボを縦に配置）
const generatePreviewStyleCombinedCanvas = async (): Promise<HTMLCanvasElement | null> => {
  try {
    isGeneratingCombined.value = true

    const components: { canvas: HTMLCanvasElement, type: string }[] = []
    let maxWidth = 0
    let totalHeight = 0

    // SVGフォーマットの場合でもキャンバス結合を実行（ズーム用）

    // ヘッダー画像を追加
    if (settingsStore.showHeader && settingsStore.outputFormat !== 'separated') {
      const headerUrl = imagesStore.getHeaderImageUrl()
      if (headerUrl) {
        const headerCanvas = await loadImageToCanvas(headerUrl)
        if (headerCanvas) {
          components.push({ canvas: headerCanvas, type: 'header' })
          maxWidth = Math.max(maxWidth, headerCanvas.width)
          totalHeight += headerCanvas.height
        }
      }
    }

    // 選択されたレイヤーを縦に配置
    const selectedLayers = Object.entries(settingsStore.layerSelection)
      .filter(([_, selected]) => selected)
      .map(([layer, _]) => parseInt(layer))
      .sort((a, b) => a - b)


    for (const layer of selectedLayers) {
      const layerUrl = imagesStore.getLayerImageUrl(layer)
      if (layerUrl) {
        const layerCanvas = await loadImageToCanvas(layerUrl)
        if (layerCanvas) {
          components.push({ canvas: layerCanvas, type: 'layer' })
          maxWidth = Math.max(maxWidth, layerCanvas.width)
          totalHeight += layerCanvas.height
        } else {
        }
      }
    }


    // コンボ画像を追加
    if (settingsStore.showCombos && settingsStore.outputFormat !== 'separated') {
      const comboUrl = imagesStore.getComboImageUrl()
      if (comboUrl) {
        const comboCanvas = await loadImageToCanvas(comboUrl)
        if (comboCanvas) {
          components.push({ canvas: comboCanvas, type: 'combo' })
          maxWidth = Math.max(maxWidth, comboCanvas.width)
          totalHeight += comboCanvas.height
        }
      }
    }

    if (components.length === 0) {
      return null
    }

    // 結合キャンバスを作成
    const combinedCanvas = document.createElement('canvas')
    combinedCanvas.width = maxWidth
    combinedCanvas.height = totalHeight
    const ctx = combinedCanvas.getContext('2d')!

    // 背景を設定
    ctx.fillStyle = settingsStore.enableDarkMode ? '#1c1c20' : '#f5f5f5'
    ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height)

    // コンポーネントを縦に配置
    let currentY = 0
    for (const component of components) {
      const centerX = (maxWidth - component.canvas.width) / 2
      ctx.drawImage(component.canvas, centerX, currentY)
      currentY += component.canvas.height
    }

    return combinedCanvas
  } catch (error) {
    return null
  } finally {
    isGeneratingCombined.value = false
  }
}

// SVG画像用の結合キャンバス生成
const generateSVGCombinedCanvas = async (): Promise<HTMLCanvasElement | null> => {
  try {
    const components: { canvas: HTMLCanvasElement, type: string }[] = []
    let maxWidth = 0
    let totalHeight = 0

    // ヘッダー画像を追加（SVG）
    if (settingsStore.showHeader && settingsStore.outputFormat !== 'separated') {
      const headerUrl = imagesStore.getHeaderImageUrl()
      if (headerUrl) {
        const headerCanvas = await loadSVGToCanvas(headerUrl)
        if (headerCanvas) {
          components.push({ canvas: headerCanvas, type: 'header' })
          maxWidth = Math.max(maxWidth, headerCanvas.width)
          totalHeight += headerCanvas.height
        }
      }
    }

    // 選択されたレイヤーを縦に配置（SVG）
    const selectedLayers = Object.entries(settingsStore.layerSelection)
      .filter(([_, selected]) => selected)
      .map(([layer, _]) => parseInt(layer))
      .sort((a, b) => a - b)

    for (const layer of selectedLayers) {
      const layerUrl = imagesStore.getLayerImageUrl(layer)
      if (layerUrl) {
        const layerCanvas = await loadSVGToCanvas(layerUrl)
        if (layerCanvas) {
          components.push({ canvas: layerCanvas, type: 'layer' })
          maxWidth = Math.max(maxWidth, layerCanvas.width)
          totalHeight += layerCanvas.height
        }
      }
    }

    // コンボ画像を追加（SVG）
    if (settingsStore.showCombos && settingsStore.outputFormat !== 'separated') {
      const comboUrl = imagesStore.getComboImageUrl()
      if (comboUrl) {
        const comboCanvas = await loadSVGToCanvas(comboUrl)
        if (comboCanvas) {
          components.push({ canvas: comboCanvas, type: 'combo' })
          maxWidth = Math.max(maxWidth, comboCanvas.width)
          totalHeight += comboCanvas.height
        }
      }
    }

    if (components.length === 0) {
      return null
    }

    // 結合キャンバスを作成（高解像度）
    const scale = 2 // SVGの高解像度化
    const combinedCanvas = document.createElement('canvas')
    combinedCanvas.width = maxWidth * scale
    combinedCanvas.height = totalHeight * scale
    const ctx = combinedCanvas.getContext('2d')!
    ctx.scale(scale, scale)

    // 背景を設定
    ctx.fillStyle = settingsStore.enableDarkMode ? '#1c1c20' : '#f5f5f5'
    ctx.fillRect(0, 0, maxWidth, totalHeight)

    // コンポーネントを縦に配置
    let currentY = 0
    for (const component of components) {
      const centerX = (maxWidth - component.canvas.width) / 2
      ctx.drawImage(component.canvas, centerX, currentY)
      currentY += component.canvas.height
    }

    return combinedCanvas
  } catch (error) {
    return null
  }
}

// VialストアからSVGを直接生成（ズーム専用）
const generateSVGFromVialStore = async (): Promise<string | null> => {
  try {

    const currentVial = vialStore.currentVial
    if (!currentVial) {
      return null
    }

    // VialConfigからParsedVialを動的に生成
    const { ParsedVialProcessor } = await import('../utils/parsedVialProcessor')
    const parsedVial = ParsedVialProcessor.parseVialConfig(currentVial.config, settingsStore.keyboardStructure, currentVial.name)

    if (!parsedVial) {
      return null
    }

    const svgContents: string[] = []
    let totalHeight = 0
    let maxWidth = 0

    // レンダーオプションを設定（ダークモード対応）
    const renderOptions = {
      keySize: settingsStore.keySize,
      fontSize: settingsStore.fontSize,
      spacing: settingsStore.spacing,
      showLabels: settingsStore.showLabels,
      theme: settingsStore.enableDarkMode ? 'dark' : 'light', // サブテキスト色用
      language: settingsStore.language,
      highlightLevel: settingsStore.highlightLevel
    }
    const qualityScale = 1.0

    // ヘッダーSVGを追加
    if (settingsStore.showHeader && settingsStore.outputFormat !== 'separated') {
      const label = settingsStore.outputLabel || vialStore.selectedFileName || ''
      const headerSVGs = parsedVial.generateLayoutHeaderSVG(renderOptions, qualityScale, label)
      if (headerSVGs.length > 0) {
        const headerSvg = headerSVGs[0]
        const { content, width, height } = parseSVGContent(headerSvg)
        svgContents.push(`<g transform="translate(${Math.max(0, (maxWidth - width) / 2)}, ${totalHeight})">${content}</g>`)
        maxWidth = Math.max(maxWidth, width)
        totalHeight += height
      }
    }

    // レイヤーSVGを追加
    const selectedLayers = Object.entries(settingsStore.layerSelection)
      .filter(([_, selected]) => selected)
      .map(([layer, _]) => parseInt(layer))
      .sort((a, b) => a - b)

    for (const layer of selectedLayers) {
      const layerSvg = parsedVial.generateLayerSVG(layer, renderOptions, qualityScale)
      if (layerSvg) {
        const { content, width, height } = parseSVGContent(layerSvg)
        svgContents.push(`<g transform="translate(${Math.max(0, (maxWidth - width) / 2)}, ${totalHeight})">${content}</g>`)
        maxWidth = Math.max(maxWidth, width)
        totalHeight += height
      }
    }

    // コンボSVGを追加
    if (settingsStore.showCombos && settingsStore.outputFormat !== 'separated') {
      const comboSVGs = await parsedVial.generateComboListSVG(renderOptions, qualityScale)
      if (comboSVGs.length > 0) {
        const comboSvg = comboSVGs[0]
        const { content, width, height } = parseSVGContent(comboSvg)
        svgContents.push(`<g transform="translate(${Math.max(0, (maxWidth - width) / 2)}, ${totalHeight})">${content}</g>`)
        maxWidth = Math.max(maxWidth, width)
        totalHeight += height
      }
    }

    if (svgContents.length === 0) {
      return null
    }

    // 結合されたSVGを生成
    const backgroundColor = settingsStore.enableDarkMode ? '#1c1c20' : '#f5f5f5'

    const result = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${maxWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
<rect width="${maxWidth}" height="${totalHeight}" fill="${backgroundColor}"/>
${svgContents.join('\n')}
</svg>`

    return result
  } catch (error) {
    return null
  }
}

// SVG内容を直接結合（既存の画像URL経由、フォールバック用）
const generateSVGCombinedContent = async (): Promise<string | null> => {
  try {
    const svgContents: string[] = []
    let totalHeight = 0
    let maxWidth = 0

    // ヘッダーSVGを追加
    if (settingsStore.showHeader && settingsStore.outputFormat !== 'separated') {
      const headerUrl = imagesStore.getHeaderImageUrl()
      if (headerUrl) {
        const svgContent = await fetchSVGContent(headerUrl)
        if (svgContent) {
          const { content, width, height } = parseSVGContent(svgContent)
          svgContents.push(`<g transform="translate(${Math.max(0, (maxWidth - width) / 2)}, ${totalHeight})">${content}</g>`)
          maxWidth = Math.max(maxWidth, width)
          totalHeight += height
        }
      }
    }

    // レイヤーSVGを追加
    const selectedLayers = Object.entries(settingsStore.layerSelection)
      .filter(([_, selected]) => selected)
      .map(([layer, _]) => parseInt(layer))
      .sort((a, b) => a - b)

    for (const layer of selectedLayers) {
      const layerUrl = imagesStore.getLayerImageUrl(layer)
      if (layerUrl) {
        const svgContent = await fetchSVGContent(layerUrl)
        if (svgContent) {
          const { content, width, height } = parseSVGContent(svgContent)
          svgContents.push(`<g transform="translate(${Math.max(0, (maxWidth - width) / 2)}, ${totalHeight})">${content}</g>`)
          maxWidth = Math.max(maxWidth, width)
          totalHeight += height
        }
      }
    }

    // コンボSVGを追加
    if (settingsStore.showCombos && settingsStore.outputFormat !== 'separated') {
      const comboUrl = imagesStore.getComboImageUrl()
      if (comboUrl) {
        const svgContent = await fetchSVGContent(comboUrl)
        if (svgContent) {
          const { content, width, height } = parseSVGContent(svgContent)
          svgContents.push(`<g transform="translate(${Math.max(0, (maxWidth - width) / 2)}, ${totalHeight})">${content}</g>`)
          maxWidth = Math.max(maxWidth, width)
          totalHeight += height
        }
      }
    }

    if (svgContents.length === 0) {
      return null
    }

    // 結合されたSVGを生成
    const backgroundColor = settingsStore.enableDarkMode ? '#1c1c20' : '#f5f5f5'

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${maxWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
<rect width="${maxWidth}" height="${totalHeight}" fill="${backgroundColor}"/>
${svgContents.join('\n')}
</svg>`
  } catch (error) {
    return null
  }
}

// SVG内容を取得
const fetchSVGContent = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    return await response.text()
  } catch (error) {
    return null
  }
}

// SVGコンテンツを解析
const parseSVGContent = (svgContent: string) => {
  const widthMatch = svgContent.match(/width="(\d+)"/)
  const heightMatch = svgContent.match(/height="(\d+)"/)
  const width = widthMatch ? parseInt(widthMatch[1]) : 400
  const height = heightMatch ? parseInt(heightMatch[1]) : 200

  // SVGタグ内のコンテンツを抽出
  const content = svgContent.replace(/<\?xml[^>]*\?>/, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')

  return { content, width, height }
}

// SVG画像をキャンバスに読み込み（高解像度対応）
const loadSVGToCanvas = (svgUrl: string): Promise<HTMLCanvasElement | null> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const scale = 2 // SVGの高解像度化
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)
      resolve(canvas)
    }

    img.onerror = () => {
      resolve(null)
    }

    img.src = svgUrl
  })
}

// ルーペダイアログの位置とサイズ（レスポンシブ対応）
const loupeDialogStyle = computed(() => {
  // 画面サイズの30-80%を使用
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight

  // サイズをレスポンシブに計算
  const minWidth = Math.max(200, screenWidth * 0.3)
  const maxWidth = screenWidth * 0.8
  const minHeight = Math.max(150, screenHeight * 0.3)
  const maxHeight = screenHeight * 0.8

  // サイズを決定（中間値を使用）
  const width = Math.min(maxWidth, Math.max(minWidth, screenWidth * 0.5))
  const height = Math.min(maxHeight, Math.max(minHeight, screenHeight * 0.5))

  return {
    position: 'fixed',
    left: `${loupeX.value}px`,
    top: `${loupeY.value}px`,
    width: `${width}px`,
    height: `${height}px`,
    zIndex: 1000
  }
})

// ルーペの位置に対応する9分割グリッドのセクションを計算
const getCurrentGridSection = () => {
  const loupeStyle = loupeDialogStyle.value
  const loupeWidth = parseFloat(loupeStyle.width as string)
  const loupeHeight = parseFloat(loupeStyle.height as string)

  const loupeCenterX = loupeX.value + loupeWidth / 2
  const loupeCenterY = loupeY.value + loupeHeight / 2

  const minCenterX = loupeWidth / 2
  const maxCenterX = window.innerWidth - loupeWidth / 2
  const minCenterY = loupeHeight / 2
  const maxCenterY = window.innerHeight - loupeHeight / 2

  const normalizedX = (loupeCenterX - minCenterX) / (maxCenterX - minCenterX)
  const normalizedY = (loupeCenterY - minCenterY) / (maxCenterY - minCenterY)

  const clampedX = Math.max(0, Math.min(1, normalizedX))
  const clampedY = Math.max(0, Math.min(1, normalizedY))

  // 3x3グリッドのセクションを計算 (0-8)
  const gridX = Math.min(2, Math.max(0, Math.floor(clampedX * 3)))
  const gridY = Math.min(2, Math.max(0, Math.floor(clampedY * 3)))
  const gridSection = gridY * 3 + gridX

  return gridSection
}

// 現在のグリッドセクション
const currentGridSection = computed(() => getCurrentGridSection())

// ルーペ内部コンテンツのスタイル（拡大表示の位置調整）
const loupeContentStyle = computed(() => {
  if (!imageSize.value.width || !imageSize.value.height) {
    return {
      transform: `scale(${zoomLevel.value})`,
      transformOrigin: '0 0'
    }
  }

  // ルーペのサイズを取得
  const loupeStyle = loupeDialogStyle.value
  const loupeWidth = parseFloat(loupeStyle.width as string)
  const loupeHeight = parseFloat(loupeStyle.height as string)

  // ルーペの中心位置
  const loupeCenterX = loupeX.value + loupeWidth / 2
  const loupeCenterY = loupeY.value + loupeHeight / 2

  // 画面全体でのルーペ移動可能範囲を計算
  const maxLoupeX = window.innerWidth - loupeWidth
  const maxLoupeY = window.innerHeight - loupeHeight

  // ルーペ中心の移動可能範囲
  const minCenterX = loupeWidth / 2
  const maxCenterX = window.innerWidth - loupeWidth / 2
  const minCenterY = loupeHeight / 2
  const maxCenterY = window.innerHeight - loupeHeight / 2

  // ルーペ中心位置を0-1の範囲に正規化（画像全体をカバーするように）
  const normalizedX = (loupeCenterX - minCenterX) / (maxCenterX - minCenterX)
  const normalizedY = (loupeCenterY - minCenterY) / (maxCenterY - minCenterY)

  // 正規化された位置を0-1の範囲に制限
  const clampedX = Math.max(0, Math.min(1, normalizedX))
  const clampedY = Math.max(0, Math.min(1, normalizedY))

  // 元画像の該当部分のピクセル座標
  const sourcePixelX = clampedX * imageSize.value.width
  const sourcePixelY = clampedY * imageSize.value.height

  // ルーペ内でそのポイントを中心にするためのオフセット
  const offsetX = (loupeWidth / 2) - (sourcePixelX * zoomLevel.value)
  const offsetY = (loupeHeight / 2) - (sourcePixelY * zoomLevel.value)

  return {
    transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoomLevel.value})`,
    transformOrigin: '0 0'
  }
})


// ズーム操作（不要になったため削除）
// const zoomIn = () => { ... }
// const zoomOut = () => { ... }

// ルーペ位置をリセット
const resetLoupePosition = () => {
  loupeX.value = 100
  loupeY.value = 100
}

// 倍率変更（1.5倍単位）
const zoomIn = () => {
  zoomLevel.value = zoomLevel.value * 1.5
}

const zoomOut = () => {
  zoomLevel.value = zoomLevel.value / 1.5
}

// ホイールズーム（不要になったため削除）
// const handleWheel = (event: WheelEvent) => { ... }

// ルーペダイアログのドラッグ開始
const startLoupeDrag = (event: MouseEvent) => {
  isDragging.value = true
  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    loupeX: loupeX.value,
    loupeY: loupeY.value
  }
  event.preventDefault()
  event.stopPropagation()
}


// マウス移動ハンドラ
const handleMouseMove = (event: MouseEvent) => {
  if (isDragging.value) {
    // ルーペダイアログの移動
    const deltaX = event.clientX - dragStart.value.x
    const deltaY = event.clientY - dragStart.value.y

    const newLoupeX = dragStart.value.loupeX + deltaX
    const newLoupeY = dragStart.value.loupeY + deltaY

    // ルーペの現在サイズを取得
    const loupeStyle = loupeDialogStyle.value
    const loupeWidth = parseFloat(loupeStyle.width as string)
    const loupeHeight = parseFloat(loupeStyle.height as string)

    // 画面内に収まるように制限
    const maxX = window.innerWidth - loupeWidth
    const maxY = window.innerHeight - loupeHeight

    loupeX.value = Math.max(0, Math.min(maxX, newLoupeX))
    loupeY.value = Math.max(0, Math.min(maxY, newLoupeY))
  }
}

// マウスアップハンドラ
const handleMouseUp = () => {
  isDragging.value = false
}

// 画像サイズの初期化（combinedImageUrlが更新された時に呼ばれる）
const initializeImageSize = () => {
  if (combinedSVGContent.value) {
    // SVGからサイズを抽出
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(combinedSVGContent.value, 'image/svg+xml')
    const svgElement = svgDoc.documentElement
    const width = parseInt(svgElement.getAttribute('width') || '400')
    const height = parseInt(svgElement.getAttribute('height') || '200')
    imageSize.value = { width, height }
  } else if (combinedImageUrl.value) {
    // 画像のサイズを取得
    const img = new Image()
    img.onload = () => {
      imageSize.value = { width: img.naturalWidth, height: img.naturalHeight }
    }
    img.src = combinedImageUrl.value
  }
}


// コンテナサイズの更新（画面サイズベース）
const updateContainerSize = () => {
  containerSize.value = {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

// ルーペを閉じる
const closeModal = () => {
  emit('close')
}

// キーボードイベント
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.isOpen) return

  if (event.key === 'Escape') {
    closeModal()
  }
}

// ウィンドウリサイズハンドラ
const handleResize = () => {
  updateContainerSize()
}

// イベントリスナーの設定
onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleResize)
})


// ルーペが開かれた時の初期化
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    // 結合画像を生成
    await updateCombinedImageUrl()

    // サイズを更新
    updateContainerSize()
    initializeImageSize()
  }
})

// レイヤー選択状態が変わった時に結合画像を更新
watch(() => settingsStore.layerSelection, async () => {
  if (props.isOpen) {
    await updateCombinedImageUrl()
    initializeImageSize()
  }
}, { deep: true })

// グリッドセクションが変わったときに親コンポーネントに通知
watch(currentGridSection, (newSection) => {
  if (props.isOpen) {
    emit('gridSectionChange', newSection)
  }
})
</script>

<style scoped lang="scss">
.image-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f8f9fa;
}

.base-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;

  &.svg-container {
    // SVGコンテナ用のスタイル
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  }
}

.loupe-dialog {
  border: 1px solid #007bff;
  background: white;
  border-radius: 6px;
  overflow: hidden;
  cursor: move;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 100px;
  min-height: 80px;
  opacity: 0.85;

  &:hover {
    border-color: #0056b3;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.loupe-content {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f8f9fa;
  border-radius: 6px;
}

.loupe-magnifier {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
}

.loupe-image {
  display: block;
  transform-origin: 0 0;

  &.svg-container {
    svg {
      display: block;
    }
  }
}

// 倍率変更コントロール
.zoom-controls {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  padding: 4px 6px;
  z-index: 10;
  backdrop-filter: blur(2px);
}

.zoom-btn-control {
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  width: 20px;
  height: 20px;
  border-radius: 2px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
  }

  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
}


.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(220, 53, 69, 0.7);
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
  backdrop-filter: blur(2px);

  &:hover {
    background: rgba(220, 53, 69, 0.9);
    transform: scale(1.1);
  }
}


.btn-icon {
  color: white !important;
  font-size: 14px;
  font-weight: bold;
  display: block;
}

@media (max-width: 768px) {
  .loupe-dialog {
    border-width: 1px;
  }

  .close-btn {
    width: 20px;
    height: 20px;
    font-size: 14px;
    top: 6px;
    right: 6px;
  }
}
</style>