import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettingsStore } from './settings'
import { useUiStore } from './ui'
import { useVialStore, type VialData } from './vial'
import type { ParsedVial } from '../utils/types'
import { embedMetadataToPng, type PngMetadata } from '../utils/pngMetadata'
import { VialDataProcessor } from '../utils/vialDataProcessor'

// 型定義
interface GeneratedComponent {
  canvas: HTMLCanvasElement;
  type: 'layer' | 'combo' | 'header' | 'combined';
  name: string;
}

interface RenderSettings {
  outputFormat?: string;
  quality?: 'high' | 'low';
  colorMode?: 'dark' | 'light';
  [key: string]: unknown;
}

export interface GeneratedImage {
  id: string
  layer?: number
  format?: 'separated' | 'vertical' | 'rectangular'
  dataUrl?: string
  url?: string  
  type: 'layer' | 'header' | 'combo' | 'combined'
  timestamp?: Date
  filename?: string
  size?: number
  canvas?: HTMLCanvasElement
  settings?: {
    keySize: number
    fontSize: number
    spacing: number
    showLabels: boolean
    darkMode: boolean
    language: string
  }
}

export const useImagesStore = defineStore('images', () => {
  const previewImages = ref<GeneratedImage[]>([])  // 現在表示中の画像
  const nextPreviewImages = ref<GeneratedImage[]>([])  // 生成中の次世代画像
  const outputImages = ref<GeneratedImage[]>([])   // 最終出力用画像
  const isGenerating = ref(false)
  const generationProgress = ref(0)
  const generationError = ref<string | null>(null)
  
  // 後方互換性のため（既存コードがimages.valueを参照）
  const images = computed(() => previewImages.value)
  
  // 現在のフォーマットの画像のみ取得
  const getImagesByFormat = (format: 'separated' | 'vertical' | 'rectangular') => {
    return computed(() => images.value.filter(img => img.format === format))
  }
  
  // レイヤー別画像取得
  const getImagesByLayer = (layer: number) => {
    return computed(() => images.value.filter(img => img.layer === layer))
  }
  
  // 画像を追加
  const addImage = (image: Omit<GeneratedImage, 'timestamp'>) => {
    const newImage: GeneratedImage = {
      timestamp: new Date(),
      ...image
    }
    
    // 既存の同じIDの画像を削除
    const existingIndex = images.value.findIndex(img => img.id === image.id)
    if (existingIndex > -1) {
      images.value.splice(existingIndex, 1)
    }
    
    images.value.push(newImage)
  }

  // 次世代配列に画像を追加（二重バッファリング用）
  const addImageToNext = (image: Omit<GeneratedImage, 'timestamp'>) => {
    const newImage: GeneratedImage = {
      timestamp: new Date(),
      ...image
    }
    
    // 既存の同じIDの画像を削除
    const existingIndex = nextPreviewImages.value.findIndex(img => img.id === image.id)
    if (existingIndex > -1) {
      nextPreviewImages.value.splice(existingIndex, 1)
    }
    
    nextPreviewImages.value.push(newImage)
  }

  // 次世代画像を現在の画像に切り替え
  const swapToNextImages = () => {
    previewImages.value = [...nextPreviewImages.value]
    nextPreviewImages.value = []
  }
  
  // 画像を削除
  const removeImage = (id: string) => {
    const index = images.value.findIndex(img => img.id === id)
    if (index > -1) {
      images.value.splice(index, 1)
    }
  }
  
  // 全画像をクリア
  const clearImages = () => {
    previewImages.value = []
  }
  
  // 出力画像をクリア
  const clearOutputImages = () => {
    outputImages.value = []
  }
  
  // フォーマット別画像をクリア
  const clearImagesByFormat = (format: 'separated' | 'vertical' | 'rectangular') => {
    images.value = images.value.filter(img => img.format !== format)
  }
  
  // 生成状態を設定
  const setGenerating = (generating: boolean) => {
    isGenerating.value = generating
    if (generating) {
      generationProgress.value = 0
      generationError.value = null
    }
  }
  
  // 生成プログレスを設定
  const setProgress = (progress: number) => {
    generationProgress.value = Math.max(0, Math.min(100, progress))
  }
  
  // 生成エラーを設定
  const setGenerationError = (error: string | null) => {
    generationError.value = error
  }
  
  // コンテンツをデコードするヘルパー関数（base64とプレーンテキストに対応）
  const decodeVialContent = (content: string): string => {
    // Base64エンコードされている場合
    if (content.startsWith('data:')) {
      const base64Content = content.replace(/^data:.*base64,/, '')
      return atob(base64Content)
    }
    // プレーンテキストの場合（convertLanguageで生成されたファイル）
    return content
  }

  // プレビュー画像を生成
  const generatePreviewImages = async () => {
    const vialStore = useVialStore()
    const settingsStore = useSettingsStore()
    
    // Replace RulesとConfigを設定
    VialDataProcessor.setReplaceRules(settingsStore.replaceRules)
    if (vialStore.currentVial) {
      VialDataProcessor.setConfig(vialStore.currentVial)
    }
    
    const selectedVial = vialStore.currentVial
    const parsedVial = vialStore.currentParsedVial
    const fileId = vialStore.selectedVialId
    
    console.log('🎯 generatePreviewImages called')
    console.log('🔍 selectedVial:', selectedVial)
    console.log('🔍 parsedVial:', parsedVial)
    console.log('🔍 fileId:', fileId)
    console.log('🔧 Replace Rules set:', settingsStore.replaceRules)
    
    if (!fileId) {
      console.log('🚫 No file selected, skipping image generation')
      return
    }
    
    try {
      setGenerating(true)
      setGenerationError(null)
      
      if (parsedVial) {
        // ParsedVialが利用可能な場合（新方式・常にこのパスを使用）
        console.log('🚀 Using ParsedVial-based generation (high performance)')
        await generateVialImagesFromParsed(parsedVial, fileId)
      } else if (fileId === 'sample') {
        // サンプルファイルの場合のみ従来処理（ParsedVialを作成してから新方式を使用）
        console.log('📁 Sample file: creating ParsedVial first, then using new generation')
        try {
          const response = await fetch('/data/yivu40-250907.vil')
          if (!response.ok) {
            throw new Error(`Failed to load sample file: ${response.status}`)
          }
          const sampleFileContent = await response.text()
          const sampleConfig = JSON.parse(sampleFileContent)
          
          // サンプルファイルからもParsedVialを作成
          const { ParsedVialProcessor } = await import('../utils/parsedVialProcessor')
          const sampleParsedVial = ParsedVialProcessor.parseVialConfig(sampleConfig, 'sample')
          
          // ParsedVialベース生成を使用
          await generateVialImagesFromParsed(sampleParsedVial, 'sample')
        } catch (error) {
          console.error('Failed to load sample VIL file:', error)
          throw error
        }
      } else if (selectedVial) {
        // ParsedVialがない場合：その場で作成してから新方式を使用
        console.log('🔄 No ParsedVial available - creating ParsedVial on-the-fly and using new generation')
        try {
          const fileContent = decodeVialContent(selectedVial.content)
          const vialConfig = JSON.parse(fileContent)
          
          // その場でParsedVialを作成
          const { ParsedVialProcessor } = await import('../utils/parsedVialProcessor')
          const onTheFlyParsedVial = ParsedVialProcessor.parseVialConfig(vialConfig, fileId)
          
          // ParsedVialベース生成を使用
          await generateVialImagesFromParsed(onTheFlyParsedVial, fileId)
        } catch (error) {
          console.error('Failed to create ParsedVial on-the-fly:', error)
          throw error
        }
      } else {
        console.log('❌ No VIL file data available')
        throw new Error('VILファイルデータが利用できません。')
      }
      
      setGenerating(false)
    } catch (error) {
      console.error('Preview generation failed:', error)
      setGenerationError(error instanceof Error ? error.message : '画像生成に失敗しました')
      setGenerating(false)
    }
  }

  // ParsedVialから直接画像を生成（新方式・高性能）
  const generateVialImagesFromParsed = async (parsedVial: ParsedVial, fileName: string, quality: 'low' | 'high' = 'low') => {
    try {
      const settingsStore = useSettingsStore()
      const uiStore = useUiStore()
      
      console.log('🚀 ImagesStore: generateVialImagesFromParsed called for:', fileName)
      console.log('📄 ParsedVial layers:', parsedVial.layers.length)
      console.log('📄 ParsedVial combos:', parsedVial.combos.length)
      console.log('📄 ParsedVial tapDances:', parsedVial.tapDances.length)
      
      // ParsedVialのメソッドを直接使用
      const renderOptions = {
        theme: settingsStore.enableDarkMode ? 'dark' : 'light' as 'dark' | 'light',
        backgroundColor: undefined,
        highlightComboKeys: settingsStore.highlightEnabled,
        highlightSubtextKeys: settingsStore.highlightEnabled,
        showComboMarkers: settingsStore.highlightEnabled,
        showTextColors: settingsStore.highlightEnabled,
        showComboInfo: settingsStore.showCombos,
        changeKeyColors: settingsStore.highlightEnabled,
        changeEmptyKeyColors: true  // 空白ボタンの背景色は常に変更
      }
      
      const qualityScale = quality === 'high' ? 1.0 : 0.5
      
      // 指定レイヤー範囲のキャンバスを生成（全レイヤー）
      const layerStart = 0
      const layerEnd = parsedVial.layers.length - 1
      const canvases: HTMLCanvasElement[] = []
      const layerNumbers: number[] = []
      
      for (let layerIndex = layerStart; layerIndex <= layerEnd; layerIndex++) {
        const canvas = parsedVial.generateLayerCanvas(layerIndex, renderOptions, qualityScale)
        canvases.push(canvas)
        layerNumbers.push(layerIndex)
      }
      
      const result = { canvases, layerNumbers }
      
      console.log('🎯 Generated components directly from ParsedVial:', result.canvases.length, 'canvases')
      
      // 二重バッファリング: 次世代配列をクリア
      if (quality === 'low') {
        nextPreviewImages.value = []
      } else {
        // 最終出力画像: 既存のhigh品質画像のみクリア  
        outputImages.value = outputImages.value.filter(img => !img.id.includes('-high'))
      }
      
      // レイヤー画像を次世代配列に追加
      result.canvases.forEach((canvas, index) => {
        const layerIndex = result.layerNumbers[index]
        const dataURL = canvas.toDataURL('image/png', quality === 'high' ? 1.0 : 0.7)
        if (quality === 'low') {
          addImageToNext({
            id: `parsed-layer-${layerIndex}-${quality}`,
            layer: layerIndex,
            dataUrl: dataURL,
            type: 'layer'
          })
        } else {
          addImage({
            id: `parsed-layer-${layerIndex}-${quality}`,
            layer: layerIndex,
            dataUrl: dataURL,
            type: 'layer'
          })
        }
      })
      
      // ParsedVialからコンボ情報とヘッダー情報も生成
      // 現在は簡易的にParsedVialからJSON変換して従来方式を使用
      if (settingsStore.showHeader || settingsStore.showCombos) {
        const originalVialConfig = parsedVial.original
        const fileContent = JSON.stringify(originalVialConfig, null, 2)
        
        // ParsedVialのメソッドを使用してコンポーネントを生成
        const qualityScale = quality === 'high' ? 1.0 : 0.5
        
        // ヘッダー画像を生成（1x, 2x, 3x） - ファイル名をラベルとして渡す
        const vialStore = useVialStore();
        const label = settingsStore.outputLabel || vialStore.selectedFileName || '';
        console.log('🏷️ Header label info:', {
          outputLabel: settingsStore.outputLabel,
          selectedFileName: vialStore.selectedFileName,
          finalLabel: label
        });
        const headerCanvases = parsedVial.generateLayoutHeaderCanvas(renderOptions, qualityScale, label)
        
        // コンボリスト画像を生成（1x, 2x, 3x）
        console.log('🎯 Combo debug info:', {
          combosCount: parsedVial.combos.length,
          combos: parsedVial.combos,
          showCombos: settingsStore.showCombos
        });
        const comboCanvases = parsedVial.generateComboListCanvas(renderOptions, qualityScale)
        console.log('🎯 Generated combo canvases:', comboCanvases.length)
        
        // 個別コンボ画像を生成（1x, 2x, 3x）
        const comboImages: HTMLCanvasElement[][] = []
        for (const combo of parsedVial.combos) {
          const comboCanvases = await combo.generateComboImage(renderOptions, qualityScale)
          comboImages.push(comboCanvases)
        }
        
        const additionalComponents = {
          headerImages: headerCanvases,
          comboListImages: comboCanvases,
          comboImages: comboImages.flat()
        }
        console.log('🎯 Additional components:', {
          headerImagesCount: headerCanvases.length,
          comboListImagesCount: comboCanvases.length,
          comboImagesCount: comboImages.flat().length
        })
        
        // ヘッダー画像を追加（1x, 2x, 3x幅）
        if (settingsStore.showHeader) {
          additionalComponents.headerImages.forEach((headerCanvas, index) => {
            const width = index + 1
            const headerURL = headerCanvas.toDataURL('image/png', quality === 'high' ? 1.0 : 0.7)
            if (quality === 'low') {
              addImageToNext({
                id: `parsed-header-${width}x-${quality}`,
                layer: -1,
                url: headerURL,
                type: 'header'
              })
            } else {
              addImage({
                id: `parsed-header-${width}x-${quality}`,
                layer: -1,
                url: headerURL,
                type: 'header'
              })
            }
          })
        }
        
        // コンボリスト画像を追加（1x, 2x, 3x幅）
        console.log('🎯 Combo list check:', {
          showCombos: settingsStore.showCombos,
          hasComboListImages: !!additionalComponents.comboListImages[0],
          comboListImagesLength: additionalComponents.comboListImages.length
        });
        if (settingsStore.showCombos) {
          additionalComponents.comboListImages.forEach((comboCanvas, index) => {
            const width = index + 1
            const comboURL = comboCanvas.toDataURL('image/png', quality === 'high' ? 1.0 : 0.7)
            if (quality === 'low') {
              addImageToNext({
                id: `parsed-combo-${width}x-${quality}`,
                layer: -2,
                url: comboURL,
                type: 'combo'
              })
            } else {
              addImage({
                id: `parsed-combo-${width}x-${quality}`,
                layer: -2,
                url: comboURL,
                type: 'combo'
              })
            }
          })
          
          // 個別コンボ画像を追加（各コンボの1x, 2x, 3x）
          additionalComponents.comboImages.forEach((comboCanvas, index) => {
            const comboIndex = Math.floor(index / 3)
            const width = (index % 3) + 1
            const comboURL = comboCanvas.toDataURL('image/png', quality === 'high' ? 1.0 : 0.7)
            if (quality === 'low') {
              addImageToNext({
                id: `parsed-combo-${comboIndex}-${width}x-${quality}`,
                layer: -2,
                url: comboURL,
                type: 'combo'
              })
            } else {
              addImage({
                id: `parsed-combo-${comboIndex}-${width}x-${quality}`,
                layer: -2,
                url: comboURL,
                type: 'combo'
              })
            }
          })
        }
      }
      
      // 低品質画像（プレビュー）の場合、一括切り替え
      if (quality === 'low') {
        swapToNextImages()
        console.log('✅ Double-buffered image swap completed, total images:', previewImages.value.length)
      }
      
      console.log('✅ ParsedVial image generation completed, total images:', images.value.length)
      
    } catch (error) {
      console.error('ParsedVial image generation failed:', error)
      throw error
    }
  }

  // 画像をダウンロード
  const downloadImage = (imageId: string, filename?: string) => {
    const image = images.value.find(img => img.id === imageId)
    if (!image) {
      throw new Error('画像が見つかりません')
    }
    
    const link = document.createElement('a')
    link.href = image.dataUrl
    link.download = filename || `keyboard_layer${image.layer}_${image.format}_ytvil.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  // 全画像をZIPでダウンロード
  const downloadAllImages = async (format: 'separated' | 'vertical' | 'rectangular') => {
    const formatImages = images.value.filter(img => img.format === format)
    if (formatImages.length === 0) {
      throw new Error('ダウンロード可能な画像がありません')
    }
    
    // JSZipを使用してZIPファイルを作成
    const JSZip = await import('jszip')
    const zip = new JSZip.default()
    
    for (const image of formatImages) {
      const response = await fetch(image.dataUrl)
      const blob = await response.blob()
      zip.file(`layer${image.layer}_${format}_ytvil.png`, blob)
    }
    
    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `keyboard_images_${format}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }
  
  // 画像URL取得メソッド
  const getLayerImageUrl = (layer: number): string => {
    const layerImage = images.value.find(img => 
      img.layer === layer && img.type === 'layer'
    )
    return layerImage ? (layerImage.dataUrl || layerImage.url || '') : ''
  }
  

  const getHeaderImageUrl = (): string => {
    const settingsStore = useSettingsStore()
    const uiStore = useUiStore()
    const displayColumns = uiStore.activeTab === 'select' 
      ? settingsStore.selectDisplayColumns
      : settingsStore.previewDisplayColumns
    
    console.log('🔍 Header image selection:')
    console.log('   Display columns:', displayColumns)
    console.log('   Available header images:', 
      images.value.filter(img => img.type === 'header').map(img => img.id)
    )
    
    const headerImage = images.value.find(img => 
      img.type === 'header' && img.id.includes(`header-${displayColumns}x`)
    )
    const fallback = images.value.find(img => 
      img.type === 'header' && img.id.includes('header-1x')
    )
    const result = headerImage || fallback
    
    console.log('   Selected header:', result?.id || 'none')
    return result ? (result.dataUrl || result.url || '') : ''
  }
  
  const getComboImageUrl = (): string => {
    const settingsStore = useSettingsStore()
    const uiStore = useUiStore()
    const displayColumns = uiStore.activeTab === 'select' 
      ? settingsStore.selectDisplayColumns
      : settingsStore.previewDisplayColumns
    
    console.log('🔍 Combo image selection:')
    console.log('   Display columns:', displayColumns)
    console.log('   Available combo images:', 
      images.value.filter(img => img.type === 'combo').map(img => img.id)
    )
    
    const comboImage = images.value.find(img => 
      img.type === 'combo' && (
        img.id.includes(`combo-${displayColumns}x`) || 
        img.id.includes(`parsed-combo-${displayColumns}x`)  // 新しいParsedVial形式
      )
    )
    const fallback = images.value.find(img => 
      img.type === 'combo' && (
        img.id.includes('combo-1x') || 
        img.id.includes('parsed-combo-1x')  // 新しいParsedVial形式
      )
    )
    const result = comboImage || fallback
    
    console.log('   Selected combo:', result?.id || 'none')
    return result ? (result.dataUrl || result.url || '') : ''
  }

  
  // 結合キャンバス生成 (App.vueのgenerateCombinedImageと同等の実装)
  // メタデータ埋め込み対応のDataURL生成
  const createMetadataEmbeddedDataUrl = async (canvas: HTMLCanvasElement, vilContent?: string): Promise<string> => {
    const originalDataUrl = canvas.toDataURL('image/png', 1.0)
    
    try {
      const vialStore = useVialStore()
      const settingsStore = useSettingsStore()
      
      // VIL設定と生成設定を取得
      let vilConfigData = vilContent || ''
      if (!vilConfigData && vialStore.currentVial?.content) {
        vilConfigData = decodeVialContent(vialStore.currentVial.content)
      }
      
      const metadata: PngMetadata = {
        vilConfig: vilConfigData,
        settings: JSON.stringify({
          outputFormat: settingsStore.outputFormat,
          theme: settingsStore.enableDarkMode ? 'dark' : 'light',
          showHeader: settingsStore.showHeader,
          showCombos: settingsStore.showCombos,
          highlightEnabled: settingsStore.highlightEnabled,
          layerSelection: settingsStore.layerSelection,
          replaceRules: settingsStore.replaceRules
        }),
        timestamp: new Date().toISOString(),
        generator: 'YTomo Vial Keyboard Image Generator'
      }
      
      // メタデータを埋め込み
      const embeddedDataUrl = embedMetadataToPng(originalDataUrl, metadata)
      console.log('📋 Metadata embedded with VIL config length:', vilConfigData.length)
      return embeddedDataUrl
    } catch (error) {
      console.warn('Failed to embed metadata during generation:', error)
      return originalDataUrl
    }
  }

  // 圧縮タイムスタンプ生成（36進数）
  const generateCompactTimestamp = (): string => {
    const now = new Date()
    // Unix timestampを36進数に変換（秒単位）
    const unixTimestamp = Math.floor(now.getTime() / 1000)
    return unixTimestamp.toString(36).toUpperCase()
  }

  // ファイル名生成
  const generateFileName = (type: string, layerIndex?: number): string => {
    const vialStore = useVialStore()
    
    let originalName: string
    if (vialStore.selectedVialId === 'sample') {
      originalName = 'sample'
    } else if (vialStore.currentVial?.name) {
      originalName = vialStore.currentVial.name.replace(/\.vil$/, '')
    } else if (vialStore.selectedVialId) {
      originalName = vialStore.selectedVialId.replace(/\.vil$/, '')
    } else {
      originalName = 'keyboard'
    }
    
    const shortName = originalName.slice(0, 10) // 最大10文字
    const timestamp = generateCompactTimestamp() // 圧縮されたタイムスタンプ
    
    if (layerIndex !== undefined) {
      return `ytomo-vial-kb-${shortName}-L${layerIndex}-${timestamp}_ytvil.png`
    } else if (type.includes('combined') || type.includes('vertical') || type.includes('rectangular')) {
      return `ytomo-vial-kb-${shortName}-${timestamp}_ytvil.png`
    } else {
      return `ytomo-vial-kb-${shortName}-${type}-${timestamp}_ytvil.png`
    }
  }

  // 結合画像生成（App.vueから移動）
  const generateCombinedImage = async (
    layerComponents: {canvas: HTMLCanvasElement, type: string}[],
    headerComponent: {canvas: HTMLCanvasElement} | null,
    comboComponent: {canvas: HTMLCanvasElement} | null,
    settings: {showHeader?: boolean, showCombos?: boolean, outputFormat?: string, enableDarkMode?: boolean}
  ): Promise<HTMLCanvasElement> => {
    const { KEYBOARD_CONSTANTS } = await import('../constants/keyboard')
    const margin = KEYBOARD_CONSTANTS.margin
    let totalWidth = 0
    let totalHeight = 0
    
    // 各コンポーネントのサイズを取得
    const components = []
    
    if (settings.outputFormat === 'rectangular') {
      // 長方形配置：ヘッダー + レイヤーをグリッド配置 + コンボ情報
      const imageWidth = layerComponents[0]?.canvas.width || 0
      const imageHeight = layerComponents[0]?.canvas.height || 0
      
      // 枚数に応じた列数を決定
      let gridCols: number
      if (layerComponents.length >= 5) {
        gridCols = 3
      } else if (layerComponents.length >= 2) {
        gridCols = 2
      } else {
        gridCols = 1
      }
      
      const gridRows = Math.ceil(layerComponents.length / gridCols)
      const gridWidth = imageWidth * gridCols
      
      totalWidth = gridWidth
      totalHeight = 0
      
      if (headerComponent && settings.showHeader) {
        components.push({ canvas: headerComponent.canvas, type: 'header' })
        totalHeight += headerComponent.canvas.height
      }
      
      // レイヤーグリッドの高さ
      if (layerComponents.length > 0) {
        totalHeight += imageHeight * gridRows
        layerComponents.forEach((comp) => {
          components.push({ canvas: comp.canvas, type: 'layer' })
        })
      }
      
      if (comboComponent && settings.showCombos) {
        components.push({ canvas: comboComponent.canvas, type: 'combo' })
        totalHeight += comboComponent.canvas.height
      }
    } else {
      // 縦結合：ヘッダー → 全レイヤー縦並び → コンボ情報
      let maxWidth = 0
      totalHeight = 0
      
      if (headerComponent && settings.showHeader) {
        components.push({ canvas: headerComponent.canvas, type: 'header' })
        maxWidth = Math.max(maxWidth, headerComponent.canvas.width)
        totalHeight += headerComponent.canvas.height
      }
      
      layerComponents.forEach((comp) => {
        components.push({ canvas: comp.canvas, type: 'layer' })
        maxWidth = Math.max(maxWidth, comp.canvas.width)
        totalHeight += comp.canvas.height
      })
      
      if (comboComponent && settings.showCombos) {
        components.push({ canvas: comboComponent.canvas, type: 'combo' })
        maxWidth = Math.max(maxWidth, comboComponent.canvas.width)
        totalHeight += comboComponent.canvas.height
      }
      
      totalWidth = maxWidth
    }
    
    // 結合キャンバスを作成
    const combinedCanvas = document.createElement('canvas')
    combinedCanvas.width = totalWidth + margin * 2
    combinedCanvas.height = totalHeight + margin * 2
    
    const ctx = combinedCanvas.getContext('2d')!
    
    // 背景を塗りつぶし
    ctx.fillStyle = settings.enableDarkMode ? '#1c1c20' : '#f5f5f5'
    ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height)
    
    // コンポーネントを配置
    let currentY = margin
    
    if (settings.outputFormat === 'rectangular') {
      // 長方形配置：ヘッダー → グリッド配置 → コンボ情報
      const imageWidth = layerComponents[0]?.canvas.width || 0
      const imageHeight = layerComponents[0]?.canvas.height || 0
      
      // 枚数に応じた列数を決定
      let gridCols: number
      if (layerComponents.length >= 5) {
        gridCols = 3
      } else if (layerComponents.length >= 2) {
        gridCols = 2
      } else {
        gridCols = 1
      }
      
      // ヘッダーを先に描画
      const headerComp = components.find(comp => comp.type === 'header')
      if (headerComp) {
        const centerX = (totalWidth - headerComp.canvas.width) / 2 + margin
        ctx.drawImage(headerComp.canvas, centerX, currentY)
        currentY += headerComp.canvas.height
      }
      
      // レイヤーをグリッド配置
      const layerCanvases = components.filter(comp => comp.type === 'layer').map(comp => comp.canvas)
      for (let i = 0; i < layerCanvases.length; i++) {
        const canvas = layerCanvases[i]
        const col = i % gridCols
        const row = Math.floor(i / gridCols)
        const x = margin + col * imageWidth
        const y = currentY + row * imageHeight
        ctx.drawImage(canvas, x, y)
      }
      
      // レイヤーグリッドの高さ分だけY座標を更新
      if (layerCanvases.length > 0) {
        const gridRows = Math.ceil(layerCanvases.length / gridCols)
        currentY += imageHeight * gridRows
      }
      
      // コンボを最後に描画
      const comboComp = components.find(comp => comp.type === 'combo')
      if (comboComp) {
        const centerX = (totalWidth - comboComp.canvas.width) / 2 + margin
        ctx.drawImage(comboComp.canvas, centerX, currentY)
      }
    } else {
      // 縦結合：全て縦並び、中央水平揃え
      components.forEach(comp => {
        const centerX = (totalWidth - comp.canvas.width) / 2 + margin
        ctx.drawImage(comp.canvas, centerX, currentY)
        currentY += comp.canvas.height
      })
    }
    
    return combinedCanvas
  }

  // ParsedVialベースの簡易結合画像生成（レイヤーのみ）
  const generateSimpleCombinedCanvas = async (
    canvases: HTMLCanvasElement[],
    outputFormat: string,
    enableDarkMode: boolean
  ): Promise<HTMLCanvasElement> => {
    const { KEYBOARD_CONSTANTS } = await import('../constants/keyboard')
    const margin = KEYBOARD_CONSTANTS.margin
    
    let totalWidth = 0
    let totalHeight = 0
    
    if (outputFormat === 'rectangular') {
      // 長方形配置：レイヤーをグリッド配置
      const imageWidth = canvases[0]?.width || 0
      const imageHeight = canvases[0]?.height || 0
      
      // 枚数に応じた列数を決定
      let gridCols: number
      if (canvases.length >= 5) {
        gridCols = 3
      } else if (canvases.length >= 2) {
        gridCols = 2
      } else {
        gridCols = 1
      }
      
      const gridRows = Math.ceil(canvases.length / gridCols)
      totalWidth = imageWidth * gridCols
      totalHeight = imageHeight * gridRows
    } else {
      // 縦結合：全レイヤー縦並び
      let maxWidth = 0
      totalHeight = 0
      
      canvases.forEach((canvas) => {
        maxWidth = Math.max(maxWidth, canvas.width)
        totalHeight += canvas.height
      })
      
      totalWidth = maxWidth
    }
    
    // 結合キャンバスを作成
    const combinedCanvas = document.createElement('canvas')
    combinedCanvas.width = totalWidth + margin * 2
    combinedCanvas.height = totalHeight + margin * 2
    
    const ctx = combinedCanvas.getContext('2d')!
    
    // 背景を塗りつぶし
    ctx.fillStyle = enableDarkMode ? '#1c1c20' : '#f5f5f5'
    ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height)
    
    if (outputFormat === 'rectangular') {
      // 長方形配置：グリッド配置
      const imageWidth = canvases[0]?.width || 0
      const imageHeight = canvases[0]?.height || 0
      
      // 枚数に応じた列数を決定
      let gridCols: number
      if (canvases.length >= 5) {
        gridCols = 3
      } else if (canvases.length >= 2) {
        gridCols = 2
      } else {
        gridCols = 1
      }
      
      // レイヤーをグリッド配置
      for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i]
        const col = i % gridCols
        const row = Math.floor(i / gridCols)
        const x = margin + col * imageWidth
        const y = margin + row * imageHeight
        ctx.drawImage(canvas, x, y)
      }
    } else {
      // 縦結合：全て縦並び、中央水平揃え
      let currentY = margin
      canvases.forEach((canvas) => {
        const centerX = (totalWidth - canvas.width) / 2 + margin
        ctx.drawImage(canvas, centerX, currentY)
        currentY += canvas.height
      })
    }
    
    return combinedCanvas
  }

  // ParsedVialベースの高度な結合画像生成（レイヤー、ヘッダー、コンボ含む）
  const generateAdvancedCombinedCanvas = async (
    layerCanvases: HTMLCanvasElement[],
    headerCanvas: HTMLCanvasElement | null,
    comboCanvas: HTMLCanvasElement | null,
    outputFormat: string,
    enableDarkMode: boolean
  ): Promise<HTMLCanvasElement> => {
    const { KEYBOARD_CONSTANTS } = await import('../constants/keyboard')
    const margin = KEYBOARD_CONSTANTS.margin
    
    let totalWidth = 0
    let totalHeight = 0
    
    // 各コンポーネントのサイズを計算
    const components = []
    
    if (outputFormat === 'rectangular') {
      // 長方形配置：ヘッダー + レイヤーをグリッド配置 + コンボ情報
      const imageWidth = layerCanvases[0]?.width || 0
      const imageHeight = layerCanvases[0]?.height || 0
      
      // 枚数に応じた列数を決定
      let gridCols: number
      if (layerCanvases.length >= 5) {
        gridCols = 3
      } else if (layerCanvases.length >= 2) {
        gridCols = 2
      } else {
        gridCols = 1
      }
      
      const gridRows = Math.ceil(layerCanvases.length / gridCols)
      const gridWidth = imageWidth * gridCols
      
      totalWidth = gridWidth
      totalHeight = 0
      
      if (headerCanvas) {
        components.push({ canvas: headerCanvas, type: 'header' })
        totalHeight += headerCanvas.height
      }
      
      // レイヤーグリッドの高さ
      if (layerCanvases.length > 0) {
        totalHeight += imageHeight * gridRows
        layerCanvases.forEach((canvas) => {
          components.push({ canvas, type: 'layer' })
        })
      }
      
      if (comboCanvas) {
        components.push({ canvas: comboCanvas, type: 'combo' })
        totalHeight += comboCanvas.height
      }
    } else {
      // 縦結合：ヘッダー → 全レイヤー縦並び → コンボ情報
      let maxWidth = 0
      totalHeight = 0
      
      if (headerCanvas) {
        components.push({ canvas: headerCanvas, type: 'header' })
        maxWidth = Math.max(maxWidth, headerCanvas.width)
        totalHeight += headerCanvas.height
      }
      
      layerCanvases.forEach((canvas) => {
        components.push({ canvas, type: 'layer' })
        maxWidth = Math.max(maxWidth, canvas.width)
        totalHeight += canvas.height
      })
      
      if (comboCanvas) {
        components.push({ canvas: comboCanvas, type: 'combo' })
        maxWidth = Math.max(maxWidth, comboCanvas.width)
        totalHeight += comboCanvas.height
      }
      
      totalWidth = maxWidth
    }
    
    // 結合キャンバスを作成
    const combinedCanvas = document.createElement('canvas')
    combinedCanvas.width = totalWidth + margin * 2
    combinedCanvas.height = totalHeight + margin * 2
    
    const ctx = combinedCanvas.getContext('2d')!
    
    // 背景を塗りつぶし
    ctx.fillStyle = enableDarkMode ? '#1c1c20' : '#f5f5f5'
    ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height)
    
    // コンポーネントを配置
    let currentY = margin
    
    if (outputFormat === 'rectangular') {
      // 長方形配置：ヘッダー → グリッド配置 → コンボ情報
      const imageWidth = layerCanvases[0]?.width || 0
      const imageHeight = layerCanvases[0]?.height || 0
      
      // 枚数に応じた列数を決定
      let gridCols: number
      if (layerCanvases.length >= 5) {
        gridCols = 3
      } else if (layerCanvases.length >= 2) {
        gridCols = 2
      } else {
        gridCols = 1
      }
      
      // ヘッダーを先に描画
      const headerComp = components.find(comp => comp.type === 'header')
      if (headerComp) {
        const centerX = (totalWidth - headerComp.canvas.width) / 2 + margin
        ctx.drawImage(headerComp.canvas, centerX, currentY)
        currentY += headerComp.canvas.height
      }
      
      // レイヤーをグリッド配置
      for (let i = 0; i < layerCanvases.length; i++) {
        const canvas = layerCanvases[i]
        const col = i % gridCols
        const row = Math.floor(i / gridCols)
        const x = margin + col * imageWidth
        const y = currentY + row * imageHeight
        ctx.drawImage(canvas, x, y)
      }
      
      // レイヤーグリッドの高さ分だけY座標を更新
      if (layerCanvases.length > 0) {
        const gridRows = Math.ceil(layerCanvases.length / gridCols)
        currentY += imageHeight * gridRows
      }
      
      // コンボを最後に描画
      const comboComp = components.find(comp => comp.type === 'combo')
      if (comboComp) {
        const centerX = (totalWidth - comboComp.canvas.width) / 2 + margin
        ctx.drawImage(comboComp.canvas, centerX, currentY)
      }
    } else {
      // 縦結合：全て縦並び、中央水平揃え
      components.forEach(comp => {
        const centerX = (totalWidth - comp.canvas.width) / 2 + margin
        ctx.drawImage(comp.canvas, centerX, currentY)
        currentY += comp.canvas.height
      })
    }
    
    return combinedCanvas
  }

  // 最終出力画像生成（App.vueのhandleGenerateの代替）
  const generateFinalOutputImages = async () => {
    const vialStore = useVialStore()
    const settingsStore = useSettingsStore()
    const uiStore = useUiStore()
    
    // Replace RulesとConfigを設定
    VialDataProcessor.setReplaceRules(settingsStore.replaceRules)
    if (vialStore.currentVial) {
      VialDataProcessor.setConfig(vialStore.currentVial)
    }
    
    if (!vialStore.selectedVialId) return
    
    try {
      uiStore.isGenerating = true
      uiStore.error = null
      
      const parsedVial = vialStore.currentParsedVial
      
      if (parsedVial) {
        // ParsedVialが利用可能な場合（新方式・高性能・常にこのパスを使用）
        console.log('🚀 Using ParsedVial-based final generation (ultra high performance)')
        await generateFinalOutputFromParsed(parsedVial)
      } else if (vialStore.selectedVialId === 'sample') {
        // サンプルファイルの場合のみ、ParsedVialを作成してから新方式を使用
        console.log('📁 Sample file: creating ParsedVial for final output generation')
        try {
          const response = await fetch('/data/yivu40-250907.vil')
          if (!response.ok) {
            throw new Error(`Failed to load sample file: ${response.status}`)
          }
          const sampleFileContent = await response.text()
          const sampleConfig = JSON.parse(sampleFileContent)
          
          // サンプルファイルからもParsedVialを作成
          const { ParsedVialProcessor } = await import('../utils/parsedVialProcessor')
          const sampleParsedVial = ParsedVialProcessor.parseVialConfig(sampleConfig, 'sample')
          
          // ParsedVialベース生成を使用
          await generateFinalOutputFromParsed(sampleParsedVial)
        } catch (error) {
          console.error('Failed to load sample VIL file for final output:', error)
          throw error
        }
      } else if (vialStore.currentVial) {
        // ParsedVialがない場合：その場で作成してから新方式を使用
        console.log('🔄 No ParsedVial available for final output - creating ParsedVial on-the-fly')
        try {
          const fileContent = decodeVialContent(vialStore.currentVial.content)
          const vialConfig = JSON.parse(fileContent)
          
          // その場でParsedVialを作成
          const { ParsedVialProcessor } = await import('../utils/parsedVialProcessor')
          const onTheFlyParsedVial = ParsedVialProcessor.parseVialConfig(vialConfig, vialStore.selectedFileName)
          
          // ParsedVialベース生成を使用
          await generateFinalOutputFromParsed(onTheFlyParsedVial)
        } catch (error) {
          console.error('Failed to create ParsedVial on-the-fly for final output:', error)
          throw error
        }
      } else {
        console.log('❌ No VIL file data available for final output')
        throw new Error('VILファイルデータが利用できません。')
      }
      
    } catch (err) {
      uiStore.error = err instanceof Error ? err.message : 'Generation failed'
      console.error('Final generation error:', err)
      // エラー時は適当な画像を表示しない - outputImagesをクリア
      outputImages.value = []
      uiStore.isGenerated = false
    } finally {
      uiStore.isGenerating = false
    }
  }

  // ParsedVialから最終出力画像を生成（新方式・高性能）
  const generateFinalOutputFromParsed = async (parsedVial: ParsedVial) => {
    const settingsStore = useSettingsStore()
    const uiStore = useUiStore()
    const vialStore = useVialStore()
    
    try {
      console.log('🚀 generateFinalOutputFromParsed: Using ParsedVial with', parsedVial.layers.length, 'layers')
    
    // 選択されたレイヤーのみ処理
    const selectedLayerIndices = Object.entries(settingsStore.layerSelection)
      .filter(([_, selected]) => selected)
      .map(([layer, _]) => parseInt(layer))
    
    const renderOptions = {
      theme: settingsStore.enableDarkMode ? 'dark' : 'light' as 'dark' | 'light',
      backgroundColor: undefined,
      highlightComboKeys: settingsStore.highlightEnabled,
      highlightSubtextKeys: settingsStore.highlightEnabled,
      showComboMarkers: settingsStore.highlightEnabled,
      showTextColors: settingsStore.highlightEnabled,
      showComboInfo: settingsStore.showCombos,
      changeKeyColors: settingsStore.highlightEnabled
    }
    
    const qualityScale = 1.0 // 高品質固定
    
    // 選択されたレイヤーのキャンバスを生成
    const canvases: HTMLCanvasElement[] = []
    const layerNumbers: number[] = []
    
    for (const layerIndex of selectedLayerIndices) {
      const canvas = parsedVial.generateLayerCanvas(layerIndex, renderOptions, qualityScale)
      canvases.push(canvas)
      layerNumbers.push(layerIndex)
    }
    
    const result = { canvases, layerNumbers }
    
    const selectedCanvases = result.canvases
    
    console.log('🎯 Generated', selectedCanvases.length, 'selected canvases from ParsedVial')
    
    const finalOutputImages: GeneratedImage[] = []
    
    if (settingsStore.outputFormat === 'separated') {
      // separated: 各レイヤーを個別出力
      selectedCanvases.forEach((canvas, index) => {
        const layerIndex = selectedLayerIndices[index]
        const filename = generateFileName('layer', layerIndex)
        finalOutputImages.push({
          id: `final-parsed-layer-${layerIndex}`,
          filename,
          type: 'layer',
          layer: layerIndex,
          format: settingsStore.outputFormat,
          url: canvas.toDataURL('image/png'),
          size: canvas.width * canvas.height * 4,
          timestamp: new Date(),
          canvas: canvas
        })
      })
    } else {
      // vertical/rectangular: 結合画像を生成
      // ParsedVialからヘッダーとコンボも生成
      let headerCanvas: HTMLCanvasElement | null = null
      let comboCanvas: HTMLCanvasElement | null = null
      
      if (settingsStore.showHeader || settingsStore.showCombos) {
        // SettingsStoreのpreviewDisplayColumnsを使用
        const displayColumns = settingsStore.previewDisplayColumns

        // ParsedVialのメソッドを使用してコンポーネントを生成
        const qualityScale = 1.0 // high quality
        
        if (settingsStore.showHeader) {
          const vialStore = useVialStore();
          const label = settingsStore.outputLabel || vialStore.selectedFileName || '';
          const headerCanvases = parsedVial.generateLayoutHeaderCanvas(renderOptions, qualityScale, label)
          headerCanvas = headerCanvases[displayColumns - 1] || null // 1x, 2x, 3xのインデックス調整
        }
        
        if (settingsStore.showCombos) {
          const comboCanvases = parsedVial.generateComboListCanvas(renderOptions, qualityScale)
          // ヘッダー情報と同様に、displayColumnsをそのまま使用
          comboCanvas = comboCanvases[displayColumns - 1] || null // 1x, 2x, 3xのインデックス調整
        }
      }
      
      const combinedCanvas = await generateAdvancedCombinedCanvas(
        selectedCanvases,
        headerCanvas,
        comboCanvas,
        settingsStore.outputFormat,
        settingsStore.enableDarkMode
      )
      
      const fileContent = vialStore.currentVial?.content ? decodeVialContent(vialStore.currentVial.content) : ''
      const filename = generateFileName(`${settingsStore.outputFormat}-combined`)
      
      finalOutputImages.push({
        id: 'final-parsed-combined',
        filename,
        type: 'combined',
        layer: 0,
        format: settingsStore.outputFormat,
        url: await createMetadataEmbeddedDataUrl(combinedCanvas, fileContent),
        size: combinedCanvas.width * combinedCanvas.height * 4,
        timestamp: new Date(),
        canvas: combinedCanvas
      })
    }
    
    // outputImagesに結果を保存
    outputImages.value = finalOutputImages
    uiStore.isGenerated = true
    uiStore.setActiveTab('output')
    
    } catch (err) {
      uiStore.error = err instanceof Error ? err.message : 'Generation failed'
      console.error('ParsedVial generation error:', err)
      // エラー時は適当な画像を表示しない - outputImagesをクリア
      outputImages.value = []
      uiStore.isGenerated = false
    }
  }


  return {
    images,
    outputImages,
    isGenerating,
    generationProgress,
    generationError,
    getImagesByFormat,
    getImagesByLayer,
    addImage,
    addImageToNext,
    swapToNextImages,
    removeImage,
    clearImages,
    clearOutputImages,
    clearImagesByFormat,
    setGenerating,
    setProgress,
    setGenerationError,
    generatePreviewImages,
    generateFinalOutputImages,
    downloadImage,
    downloadAllImages,
    getLayerImageUrl,
    getHeaderImageUrl,
    getComboImageUrl
  }
})