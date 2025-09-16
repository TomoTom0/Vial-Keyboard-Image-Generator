<template>
  <div v-if="isOpen" class="zoom-modal-overlay" @click="closeModal">
    <div class="zoom-modal-container" @click.stop>
      <!-- メインズーム表示エリア -->
      <div class="zoom-main-area">
        <div
          class="zoom-image-wrapper"
          @mousedown="startImageDrag"
          @wheel.prevent="handleWheel"
        >
          <!-- SVGコンテンツがある場合：SVG要素として表示（高品質） -->
          <div
            v-if="combinedSVGContent"
            ref="zoomImageRef"
            class="zoom-image svg-container"
            :style="zoomImageStyle"
            v-html="combinedSVGContent"
          ></div>

          <!-- PNG結合画像がある場合：img要素で表示 -->
          <img
            v-else-if="combinedImageUrl"
            ref="zoomImageRef"
            :src="combinedImageUrl"
            :alt="title"
            class="zoom-image"
            :style="zoomImageStyle"
            @load="handleZoomImageLoad"
          />

          <!-- 最終フォールバック：元の画像を表示 -->
          <img
            v-else
            ref="zoomImageRef"
            :src="props.imageUrl"
            :alt="title"
            class="zoom-image"
            :style="zoomImageStyle"
            @load="handleZoomImageLoad"
          />

          <!-- オーバーレイコントロール -->
          <div class="overlay-controls">
            <!-- 左上: ズーム倍率変更 -->
            <div class="zoom-level-controls">
              <button class="zoom-btn" @click="zoomOut" :disabled="zoomLevel <= 0.5">
                <span class="btn-icon">−</span>
              </button>
              <button class="zoom-btn" @click="zoomIn" :disabled="zoomLevel >= 5">
                <span class="btn-icon">+</span>
              </button>
            </div>

            <!-- 右上: 閉じるボタン -->
            <button class="close-btn" @click="closeModal">&times;</button>
          </div>
        </div>

        <!-- 下部: 小さな全体像とズーム先表示（オーバーレイ） -->
        <div class="overview-container">
        <div class="overview-image-wrapper">
          <!-- 画像の代わりに適切な大きさのプレースホルダー -->
          <div
            class="overview-placeholder"
            @mousedown="startTargetDrag"
            title="クリックでズーム位置を移動"
          ></div>
          <!-- ズーム先表示枠 -->
          <div
            class="zoom-target-box"
            :style="zoomTargetBoxStyle"
            @mousedown="startTargetDrag"
          ></div>
        </div>
        </div>
      </div>
    </div>
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
}>()

// ストア
const imagesStore = useImagesStore()
const settingsStore = useSettingsStore()
const vialStore = useVialStore()

// DOM参照
const overviewImageRef = ref<HTMLImageElement>()
const zoomImageRef = ref<HTMLImageElement>()

// ズーム・パン状態
const zoomLevel = ref(1) // デフォルトを1倍に設定（等倍表示）
const panX = ref(0)
const panY = ref(0)
const targetX = ref(0.5) // 0-1の範囲でズーム先の位置
const targetY = ref(0.5)

// 画像サイズ
const overviewImageSize = ref({ width: 0, height: 0 })
const isDragging = ref(false)
const isTargetDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, panX: 0, panY: 0 })

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
      handleZoomImageLoad()
      // オーバービュー画像のサイズ調整も実行
      setTimeout(() => handleOverviewImageLoad(), 100)
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
      handleZoomImageLoad()
      // オーバービュー画像のサイズ調整も実行
      setTimeout(() => handleOverviewImageLoad(), 100)
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
    const parsedVial = ParsedVialProcessor.parseVialConfig(currentVial.config, currentVial.name)

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
      language: settingsStore.language
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

// ズーム対象ボックスのスタイル（実際のコンテナサイズを測定）
const zoomTargetBoxStyle = computed(() => {
  // モーダルが閉じている場合は何も表示しない
  if (!props.isOpen) {
    return { display: 'none' }
  }

  // nextTickでDOM要素が利用可能になるまで待つ
  const container = document.querySelector('.zoom-image-wrapper') as HTMLElement
  const placeholder = document.querySelector('.overview-placeholder') as HTMLElement

  if (!container || !placeholder) {
    // DOM要素がまだ利用可能でない場合のフォールバック
    const boxSize = 15  // 15%固定
    const left = Math.max(0, Math.min(100 - boxSize, targetX.value * 100 - boxSize / 2))
    const top = Math.max(0, Math.min(100 - boxSize, targetY.value * 100 - boxSize / 2))
    return {
      left: `${left}%`,
      top: `${top}%`,
      width: `${boxSize}%`,
      height: `${boxSize}%`,
    }
  }

  const containerRect = container.getBoundingClientRect()
  const placeholderRect = placeholder.getBoundingClientRect()


  // 小さい正方形のボックス
  const boxSize = 15  // 15%の固定サイズ
  const boxWidthPercent = boxSize
  const boxHeightPercent = boxSize

  // 移動可能範囲を計算（ボックスが枠内に収まるように）
  const maxCenterX = (100 - boxWidthPercent) / 100
  const maxCenterY = (100 - boxHeightPercent) / 100
  const minCenterX = boxWidthPercent / 200  // ボックス幅の半分をパーセントで
  const minCenterY = boxHeightPercent / 200  // ボックス高さの半分をパーセントで

  // targetX, targetYを移動可能範囲内に制限
  const constrainedX = Math.max(minCenterX, Math.min(maxCenterX + minCenterX, targetX.value))
  const constrainedY = Math.max(minCenterY, Math.min(maxCenterY + minCenterY, targetY.value))

  // ボックスの左上角の位置を計算
  const left = constrainedX * 100 - boxWidthPercent / 2
  const top = constrainedY * 100 - boxHeightPercent / 2


  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${boxWidthPercent}%`,
    height: `${boxHeightPercent}%`,
  }
})

// 画像のサイズとコンテナのサイズ
const imageSize = ref({ width: 0, height: 0 })
const containerSize = ref({ width: 0, height: 0 })

// パン制限を計算
const getPanLimits = () => {
  if (!imageSize.value.width || !imageSize.value.height || !containerSize.value.width || !containerSize.value.height) {
    return { maxX: Infinity, maxY: Infinity, minX: -Infinity, minY: -Infinity }
  }

  const scaledImageWidth = imageSize.value.width * zoomLevel.value
  const scaledImageHeight = imageSize.value.height * zoomLevel.value

  // ズーム先位置を画像のピクセル座標に変換
  const targetPixelX = targetX.value * imageSize.value.width
  const targetPixelY = targetY.value * imageSize.value.height

  // コンテナの中心座標
  const containerCenterX = containerSize.value.width / 2
  const containerCenterY = containerSize.value.height / 2

  // ズーム先をコンテナ中心に持ってくるための基本移動量
  const baseTranslateX = containerCenterX - (targetPixelX * zoomLevel.value)
  const baseTranslateY = containerCenterY - (targetPixelY * zoomLevel.value)

  // 画像の端がコンテナ内に収まるパン制限を計算
  const minTranslateX = containerSize.value.width - scaledImageWidth
  const maxTranslateX = 0
  const minTranslateY = containerSize.value.height - scaledImageHeight
  const maxTranslateY = 0

  // パンできる範囲を計算
  const maxPanX = maxTranslateX - baseTranslateX
  const minPanX = minTranslateX - baseTranslateX
  const maxPanY = maxTranslateY - baseTranslateY
  const minPanY = minTranslateY - baseTranslateY

  return {
    maxX: Math.max(maxPanX, minPanX),
    minX: Math.min(maxPanX, minPanX),
    maxY: Math.max(maxPanY, minPanY),
    minY: Math.min(maxPanY, minPanY)
  }
}

// ズーム画像のスタイル
const zoomImageStyle = computed(() => {
  // コンテナのサイズと画像サイズが分からない場合のフォールバック
  if (!imageSize.value.width || !imageSize.value.height || !containerSize.value.width || !containerSize.value.height) {
    return {
      transform: `translate(-50%, -50%) scale(${zoomLevel.value})`,
      transformOrigin: 'center',
      position: 'absolute',
      top: '50%',
      left: '50%'
    }
  }

  // ズーム先位置を画像の実際のピクセル座標に変換
  const targetPixelX = targetX.value * imageSize.value.width
  const targetPixelY = targetY.value * imageSize.value.height

  // ズーム先をコンテナの中央に配置するための変換を計算
  const centerX = containerSize.value.width / 2
  const centerY = containerSize.value.height / 2

  // 変換の順序: 1) スケール 2) ズーム先を中央に移動 3) パン調整
  const translateX = centerX - (targetPixelX * zoomLevel.value) + panX.value
  const translateY = centerY - (targetPixelY * zoomLevel.value) + panY.value

  // デバッグ用（必要時のみ有効化）
  //   targetX: targetX.value,
  //   targetY: targetY.value,
  //   targetPixelX,
  //   targetPixelY,
  //   centerX,
  //   centerY,
  //   translateX,
  //   translateY,
  //   zoomLevel: zoomLevel.value,
  //   panX: panX.value,
  //   panY: panY.value
  // })

  return {
    transform: `translate(${translateX}px, ${translateY}px) scale(${zoomLevel.value})`,
    transformOrigin: '0 0',
    position: 'absolute',
    top: '0',
    left: '0'
  }
})

// ズーム操作
const zoomIn = () => {
  if (zoomLevel.value < 5) {
    zoomLevel.value = Math.min(5, zoomLevel.value + 0.25)
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.25)
    // ズームアウト時はパン位置をリセット
    if (zoomLevel.value <= 1) {
      panX.value = 0
      panY.value = 0
    }
  }
}

// パン位置をリセット
const resetPan = () => {
  panX.value = 0
  panY.value = 0
  targetX.value = 0.5
  targetY.value = 0.5
}

// ズームと位置をリセット
const resetZoom = () => {
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
  targetX.value = 0.5
  targetY.value = 0.5
}

// ホイールズーム
const handleWheel = (event: WheelEvent) => {
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.max(0.5, Math.min(5, zoomLevel.value + delta))
  zoomLevel.value = newZoom
}

// ズーム先ボックスのドラッグ
const startTargetDrag = (event: MouseEvent) => {
  isTargetDragging.value = true

  // 即座に位置を更新（クリック位置に移動）
  const placeholder = document.querySelector('.overview-placeholder') as HTMLElement
  const container = document.querySelector('.zoom-image-wrapper') as HTMLElement

  if (placeholder && container) {
    const placeholderRect = placeholder.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    let x = (event.clientX - placeholderRect.left) / placeholderRect.width
    let y = (event.clientY - placeholderRect.top) / placeholderRect.height

    // 小さい正方形ボックス
    const boxSize = 0.15  // 15%
    const boxWidthRatio = boxSize
    const boxHeightRatio = boxSize

    const marginX = boxWidthRatio / 2
    const marginY = boxHeightRatio / 2

    // 移動可能範囲内に制限
    x = Math.max(marginX, Math.min(1 - marginX, x))
    y = Math.max(marginY, Math.min(1 - marginY, y))

    targetX.value = x
    targetY.value = y
    panX.value = 0
    panY.value = 0

  }

  event.preventDefault()
  event.stopPropagation()
}

// ズーム画像のドラッグ
const startImageDrag = (event: MouseEvent) => {
  if (zoomLevel.value <= 1) return

  isDragging.value = true
  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    panX: panX.value,
    panY: panY.value
  }
  event.preventDefault()
}

// マウス移動ハンドラ
const handleMouseMove = (event: MouseEvent) => {
  if (isTargetDragging.value) {
    // プレースホルダー内でのドラッグ処理
    const placeholder = document.querySelector('.overview-placeholder') as HTMLElement
    if (placeholder) {
      const rect = placeholder.getBoundingClientRect()

      // マウス位置を0-1の範囲に正規化
      let x = (event.clientX - rect.left) / rect.width
      let y = (event.clientY - rect.top) / rect.height

      // 小さい正方形ボックス
      const boxSize = 0.15  // 15%
      const marginX = boxSize / 2
      const marginY = boxSize / 2

      // 移動可能範囲内に制限
      x = Math.max(marginX, Math.min(1 - marginX, x))
      y = Math.max(marginY, Math.min(1 - marginY, y))

      targetX.value = x
      targetY.value = y


      // パン位置をリセット（新しい位置の基準点として）
      panX.value = 0
      panY.value = 0
    }
  } else if (isDragging.value) {
    // パン操作
    const deltaX = event.clientX - dragStart.value.x
    const deltaY = event.clientY - dragStart.value.y
    const newPanX = dragStart.value.panX + deltaX
    const newPanY = dragStart.value.panY + deltaY

    // パン制限を適用
    const limits = getPanLimits()
    panX.value = Math.max(limits.minX, Math.min(limits.maxX, newPanX))
    panY.value = Math.max(limits.minY, Math.min(limits.maxY, newPanY))
  }
}

// マウスアップハンドラ
const handleMouseUp = () => {
  if (isTargetDragging.value) {
  }
  isDragging.value = false
  isTargetDragging.value = false
}

// 画像読み込み完了
const handleOverviewImageLoad = () => {
  if (overviewImageRef.value) {
    // 画像の実際のサイズを取得
    let naturalWidth: number
    let naturalHeight: number

    if (combinedSVGContent.value && overviewImageRef.value.querySelector && overviewImageRef.value.querySelector('svg')) {
      // SVGの場合
      const svgElement = overviewImageRef.value.querySelector('svg') as SVGElement
      naturalWidth = parseInt(svgElement.getAttribute('width') || '400')
      naturalHeight = parseInt(svgElement.getAttribute('height') || '200')
    } else if (overviewImageRef.value instanceof HTMLImageElement) {
      // 通常の画像の場合
      naturalWidth = overviewImageRef.value.naturalWidth
      naturalHeight = overviewImageRef.value.naturalHeight
    } else {
      return
    }

    overviewImageSize.value = { width: naturalWidth, height: naturalHeight }

    // コンテナサイズを取得
    const container = overviewImageRef.value.parentElement
    if (!container) return

    const containerWidth = container.clientWidth - 20 // padding考慮
    const containerHeight = container.clientHeight - 20 // padding考慮


    // 画像をコンテナに収めるための倍率を計算
    const scaleX = containerWidth / naturalWidth
    const scaleY = containerHeight / naturalHeight
    const scale = Math.min(scaleX, scaleY, 1) // 1を超えて拡大はしない

    // 計算された倍率を適用
    if (combinedSVGContent.value && overviewImageRef.value.querySelector && overviewImageRef.value.querySelector('svg')) {
      // SVGの場合、SVG要素に直接サイズを設定
      const svgElement = overviewImageRef.value.querySelector('svg') as SVGElement
      svgElement.style.width = `${naturalWidth * scale}px`
      svgElement.style.height = `${naturalHeight * scale}px`

      // コンテナ自体のサイズも設定
      overviewImageRef.value.style.width = `${naturalWidth * scale}px`
      overviewImageRef.value.style.height = `${naturalHeight * scale}px`
    } else if (overviewImageRef.value instanceof HTMLImageElement) {
      // 通常のimg要素の場合
      overviewImageRef.value.style.width = `${naturalWidth * scale}px`
      overviewImageRef.value.style.height = `${naturalHeight * scale}px`
    }
  }
}

// ズーム画像読み込み完了
const handleZoomImageLoad = () => {
  if (zoomImageRef.value) {
    // SVGコンテナの場合
    if (combinedSVGContent.value && zoomImageRef.value.querySelector && zoomImageRef.value.querySelector('svg')) {
      const svgElement = zoomImageRef.value.querySelector('svg') as SVGElement
      const width = parseInt(svgElement.getAttribute('width') || '400')
      const height = parseInt(svgElement.getAttribute('height') || '200')

      imageSize.value = { width, height }

      //   width,
      //   height,
      //   containerSize: containerSize.value
      // })
    }
    // 通常の画像の場合
    else if (zoomImageRef.value instanceof HTMLImageElement) {
      imageSize.value = {
        width: zoomImageRef.value.naturalWidth,
        height: zoomImageRef.value.naturalHeight
      }

      //   naturalWidth: zoomImageRef.value.naturalWidth,
      //   naturalHeight: zoomImageRef.value.naturalHeight,
      //   containerSize: containerSize.value
      // })
    }

    // 画像読み込み後にコンテナサイズを更新
    nextTick(() => {
      updateContainerSize()
      // 初期位置を確認用にログ出力
      //   targetX: targetX.value,
      //   targetY: targetY.value,
      //   imageSize: imageSize.value,
      //   containerSize: containerSize.value
      // })
    })
  }
}

// コンテナサイズの更新
const updateContainerSize = () => {
  if (zoomImageRef.value?.parentElement) {
    const container = zoomImageRef.value.parentElement
    containerSize.value = {
      width: container.clientWidth,
      height: container.clientHeight
    }
  }
}

// モーダルを閉じる
const closeModal = () => {
  emit('close')
  // 状態をリセット
  zoomLevel.value = 1 // 等倍にリセット
  panX.value = 0
  panY.value = 0
  targetX.value = 0.5
  targetY.value = 0.5
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

// DOM要素のサイズ測定を強制更新
const updateElementSizes = () => {
  const container = document.querySelector('.zoom-image-wrapper') as HTMLElement
  const placeholder = document.querySelector('.overview-placeholder') as HTMLElement

  if (container && placeholder) {
    // computedを再実行させるためにtriggerRefを使う代わりに、値を変更する
    targetX.value = targetX.value // 強制再計算
  }
}

// モーダルが開かれた時の初期化
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    zoomLevel.value = 1 // 等倍で開始
    panX.value = 0
    panY.value = 0
    targetX.value = 0.5
    targetY.value = 0.5

    // 結合画像を生成
    await updateCombinedImageUrl()

    // コンテナサイズを更新
    nextTick(() => {
      updateContainerSize()
      updateElementSizes()
    })
  }
})

// レイヤー選択状態が変わった時に結合画像を更新
watch(() => settingsStore.layerSelection, async () => {
  if (props.isOpen) {
    await updateCombinedImageUrl()
  }
}, { deep: true })
</script>

<style scoped lang="scss">
.zoom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-modal-container {
  width: 95vw;
  height: 95vh;
  background: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.zoom-main-area {
  flex: 1;
  position: relative; /* オーバーレイのため */
}

.zoom-image-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  background: #f8f9fa;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.zoom-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform-origin: 0 0;
  transition: transform 0.1s ease-out;
  max-width: none;
  max-height: none;

  &.svg-container {
    // SVGコンテナ用のスタイル
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  }
}

.overlay-controls {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  pointer-events: none;
}

.zoom-level-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: all;
}

.zoom-btn {
  background: rgba(0, 123, 255, 0.8);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  backdrop-filter: blur(4px);

  &:hover:not(:disabled) {
    background: rgba(0, 123, 255, 1);
    transform: scale(1.05);
  }

  &:disabled {
    background: rgba(108, 117, 125, 0.8);
    cursor: not-allowed;
    transform: none;
  }
}

.close-btn {
  background: rgba(220, 53, 69, 0.8);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
  pointer-events: all;

  &:hover {
    background: rgba(220, 53, 69, 1);
    transform: scale(1.05);
  }
}

.overview-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  padding: 12px;
  background: rgba(248, 249, 250, 0.95);
  backdrop-filter: blur(4px);
  border-top: 1px solid rgba(238, 238, 238, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.overview-image-wrapper {
  position: relative;
  width: 300px;
  min-width: 300px;
  height: 100%;
  max-width: 90vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 4px;
  overflow: visible;    /* 見切れを防ぐ */
  border: 1px solid #ddd;
}

.overview-image {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;

  &.svg-container {
    // SVGコンテナ用のスタイル
    width: auto !important;
    height: auto !important;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
      display: block;
      width: auto !important;
      height: auto !important;
    }
  }
}

.btn-icon {
  color: white !important;
  font-size: 18px;
  font-weight: bold;
  display: block;
}

.overview-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: crosshair;
  user-select: none;
}

.overview-placeholder:hover {
  background: #e8e8e8;
}

.zoom-target-box {
  position: absolute;
  border: 2px solid #007bff;
  background: rgba(0, 123, 255, 0.3);
  cursor: move;
  pointer-events: auto;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5);
  z-index: 100;
  min-width: 20px;
  min-height: 20px;
  aspect-ratio: 1;
}

.zoom-target-box:hover {
  background: rgba(0, 123, 255, 0.4);
  border-color: #0056b3;
}

@media (max-width: 768px) {
  .zoom-modal-container {
    width: 98vw;
    height: 98vh;
  }

  .overlay-controls {
    padding: 12px;
  }

  .zoom-btn {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .close-btn {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .overview-container {
    height: 80px;
    padding: 8px;
    background: rgba(248, 249, 250, 0.98);
  }
}
</style>