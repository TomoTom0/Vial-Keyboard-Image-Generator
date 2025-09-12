import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettingsStore } from './settings'
import { useUiStore } from './ui'
import { useVialStore, type VialData } from './vial'
import { embedMetadataToPng, type PngMetadata } from '../utils/pngMetadata'

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
  format?: 'separated' | 'vertical' | 'horizontal'
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
  const previewImages = ref<GeneratedImage[]>([])  // プレビュー用画像
  const outputImages = ref<GeneratedImage[]>([])   // 最終出力用画像
  const isGenerating = ref(false)
  const generationProgress = ref(0)
  const generationError = ref<string | null>(null)
  
  // 後方互換性のため（既存コードがimages.valueを参照）
  const images = computed(() => previewImages.value)
  
  // 現在のフォーマットの画像のみ取得
  const getImagesByFormat = (format: 'separated' | 'vertical' | 'horizontal') => {
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
  const clearImagesByFormat = (format: 'separated' | 'vertical' | 'horizontal') => {
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
  
  // コンテンツをデコードするヘルパー関数（base64のみ対応）
  const decodeVialContent = (content: string): string => {
    const base64Content = content.replace(/^data:.*base64,/, '')
    return atob(base64Content)
  }

  // プレビュー画像を生成
  const generatePreviewImages = async () => {
    const vialStore = useVialStore()
    
    const selectedVial = vialStore.currentVial
    const fileId = vialStore.selectedVialId
    
    console.log('🎯 generatePreviewImages called')
    console.log('🔍 selectedVial:', selectedVial)
    console.log('🔍 fileId:', fileId)
    
    if (!fileId) {
      console.log('🚫 No file selected, skipping image generation')
      return
    }
    
    try {
      setGenerating(true)
      setGenerationError(null)
      
      if (fileId === 'sample') {
        // サンプルファイルの場合
        try {
          const response = await fetch('/data/yivu40-250907.vil')
          if (!response.ok) {
            throw new Error(`Failed to load sample file: ${response.status}`)
          }
          const sampleFileContent = await response.text()
          const base64Content = btoa(sampleFileContent)
          await generateVialImages({ content: `data:application/octet-stream;base64,${base64Content}` }, 'sample')
        } catch (error) {
          console.error('Failed to load sample VIL file:', error)
          throw error
        }
      } else if (selectedVial) {
        // VILファイルの場合
        await generateVialImages(selectedVial, fileId)
      } else {
        console.log('⚠️ No VIL file selected for image generation')
      }
      
      setGenerating(false)
    } catch (error) {
      console.error('Preview generation failed:', error)
      setGenerationError(error instanceof Error ? error.message : '画像生成に失敗しました')
      setGenerating(false)
    }
  }
  
  // VILファイルから画像を生成する実装
  const generateVialImages = async (vialData: VialData, fileName: string, quality: 'low' | 'high' = 'low') => {
    try {
      const settingsStore = useSettingsStore()
      const uiStore = useUiStore()
      
      // VIALデータからファイル内容を取得
      let fileContent: string
      if (vialData && vialData.content) {
        fileContent = decodeVialContent(vialData.content)
      } else {
        console.error('🔍 Invalid vialData:', vialData)
        console.error('🔍 Missing content property - data was not properly persisted')
        throw new Error('VIL file content is missing - data was not properly saved')
      }
      
      console.log('🔍 VialData type:', typeof vialData)
      console.log('🔍 VialData keys:', vialData && typeof vialData === 'object' ? Object.keys(vialData) : 'N/A')
      console.log('🔍 VialData.config exists:', !!(vialData && vialData.config))
      
      console.log('🚀 ImagesStore: generateVialImages called for:', fileName)
      console.log('📄 File content length:', fileContent.length)
      console.log('📄 File content preview:', fileContent.substring(0, 200) + '...')
      
      // Parse and validate the file content
      let parsedConfig: VialConfig
      try {
        parsedConfig = JSON.parse(fileContent)
        console.log('✅ JSON parse successful')
        console.log('📄 Parsed config keys:', Object.keys(parsedConfig))
        console.log('📄 Layout present:', !!parsedConfig.layout)
        console.log('📄 Layout length:', parsedConfig.layout?.length)
      } catch (parseError) {
        console.error('❌ JSON parse failed:', parseError)
        throw new Error('Invalid JSON format in VIL file')
      }
      
      // ブラウザ版の関数を使用
      const { BrowserComponentBatchGenerator } = await import('../utils/browserComponentBatchGenerator')
      
      // 適切なファイル名を取得（unixtimeではなく実際のファイル名）
      const displayName = vialData.name || fileName
      
      console.log('📄 Sending fileContent to generator, length:', fileContent.length)
      console.log('📄 FileContent preview:', fileContent.substring(0, 200) + '...')
      
      const components = await BrowserComponentBatchGenerator.generateAllComponents(
        fileContent,
        {
          configPath: displayName,
          colorMode: settingsStore.enableDarkMode ? 'dark' : 'light',
          comboHighlight: settingsStore.showCombos,
          subtextHighlight: settingsStore.highlightEnabled,
          quality,
          replaceRules: settingsStore.replaceRules || [],
          keyboardLanguage: settingsStore.keyboardLanguage,
          outputLabel: settingsStore.outputLabel
        }
      )
      
      // レイヤー数に応じた適切なコンポーネントを選択
      const layerComponents = components.filter(comp => comp.type === 'layer')
      const layerCount = layerComponents.length
      
      console.log('🎯 Generated components:', components.map(c => ({ name: c.name, type: c.type })))
      console.log('🏷️ Current tab:', uiStore.activeTab)
      console.log('🏷️ Layer count:', layerCount)
      
      // タブに応じて列数決定のロジック
      let displayColumns: number
      if (uiStore.activeTab === 'select') {
        // セレクトタブでは全体レイヤー数で判断
        if (layerCount >= 5) {
          displayColumns = 3
        } else if (layerCount >= 2) {
          displayColumns = 2
        } else {
          displayColumns = 1
        }
      } else {
        // プレビュータブでは出力フォーマットに応じて判断
        if (settingsStore.outputFormat === 'vertical') {
          displayColumns = 1
        } else if (settingsStore.outputFormat === 'rectangular') {
          // 長方形結合では選択レイヤー数に応じて決定
          const selectedLayers = Object.entries(settingsStore.layerSelection)
            .filter(([_, selected]) => selected)
            .map(([layer, _]) => parseInt(layer))
          
          if (selectedLayers.length >= 5) {
            displayColumns = 3
          } else if (selectedLayers.length >= 2) {
            displayColumns = 2
          } else {
            displayColumns = 1
          }
        } else {
          // separatedの場合は1列
          displayColumns = 1
        }
      }
      
      console.log('📊 Display columns:', displayColumns)
      
      // 品質に応じて画像をクリア
      if (quality === 'low') {
        // プレビュー画像: 既存のlow品質画像のみクリア
        previewImages.value = previewImages.value.filter(img => !img.id.includes('-low'))
      } else {
        // 最終出力画像: 既存のhigh品質画像のみクリア  
        outputImages.value = outputImages.value.filter(img => !img.id.includes('-high'))
      }
      
      // すべての幅のヘッダー情報を追加
      for (let width = 1; width <= 3; width++) {
        const headerComp = components.find(comp => comp.name.includes(`header-${width}x-${quality}`))
        if (headerComp) {
          const headerURL = headerComp.canvas.toDataURL('image/png', quality === 'high' ? 1.0 : 0.7)
          addImage({
            id: `browser-header-${width}x-${quality}`,
            layer: -1,
            url: headerURL,
            type: 'header'
          })
        }
      }
      
      // レイヤー画像追加
      layerComponents.forEach((comp, index) => {
        const dataURL = comp.canvas.toDataURL('image/png', quality === 'high' ? 1.0 : 0.7)
        addImage({
          id: `browser-layer-${index}-${quality}`,
          layer: index,
          dataUrl: dataURL,
          type: 'layer'
        })
      })
      
      // すべての幅のコンボ情報を追加
      for (let width = 1; width <= 3; width++) {
        const comboComp = components.find(comp => comp.name.includes(`combo-${width}x-${quality}`))
        if (comboComp) {
          const comboURL = comboComp.canvas.toDataURL('image/png', quality === 'high' ? 1.0 : 0.7)
          addImage({
            id: `browser-combo-${width}x-${quality}`,
            layer: -2,
            url: comboURL,
            type: 'combo'
          })
        }
      }
      
      console.log('✅ VIL image generation completed, total images:', images.value.length)
      
    } catch (error) {
      console.error('VIL image generation failed:', error)
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
    link.download = filename || `keyboard_layer${image.layer}_${image.format}.ytvil.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  // 全画像をZIPでダウンロード
  const downloadAllImages = async (format: 'separated' | 'vertical' | 'horizontal') => {
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
      zip.file(`layer${image.layer}_${format}.ytvil.png`, blob)
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
  
  // 適切な列数を計算する関数（統一ロジック）
  const calculateDisplayColumns = (
    outputFormat?: string, 
    selectedLayerComponents?: GeneratedComponent[], 
    forOutputGeneration: boolean = false
  ): number => {
    const settingsStore = useSettingsStore()
    const uiStore = useUiStore()
    const format = outputFormat || settingsStore.outputFormat
    
    console.log('🔍 calculateDisplayColumns called:')
    console.log('   format:', format)
    console.log('   activeTab:', uiStore.activeTab)
    console.log('   forOutputGeneration:', forOutputGeneration)
    console.log('   layerSelection:', settingsStore.layerSelection)
    
    if (format === 'vertical') {
      console.log('   → vertical format: returning 1')
      return 1
    } else if (format === 'rectangular') {
      if (forOutputGeneration && selectedLayerComponents) {
        // 出力生成時：選択されたレイヤー数で判断
        console.log('   → output generation with', selectedLayerComponents.length, 'components')
        if (selectedLayerComponents.length >= 5) return 3
        if (selectedLayerComponents.length >= 2) return 2
        return 1
      } else if (uiStore.activeTab === 'select') {
        // SelectTabでは全レイヤー数で判断
        const allLayerCount = images.value.filter(img => img.type === 'layer').length
        console.log('   → select tab with', allLayerCount, 'total layers')
        if (allLayerCount >= 5) return 3
        if (allLayerCount >= 2) return 2
        return 1
      } else {
        // PreviewTabでは選択レイヤー数で判断
        const selectedCount = Object.values(settingsStore.layerSelection).filter(Boolean).length
        console.log('   → preview tab with', selectedCount, 'selected layers')
        if (selectedCount >= 5) return 3
        if (selectedCount >= 2) return 2
        return 1
      }
    } else { // separated
      // separatedの場合もプレビュータブでは実際の表示列数を考慮
      if (uiStore.activeTab === 'preview') {
        const selectedCount = Object.values(settingsStore.layerSelection).filter(Boolean).length
        console.log('   → separated format, preview tab with', selectedCount, 'selected layers')
        // 画面幅も考慮（PreviewTab.vueのロジックと合わせる）
        if (typeof window !== 'undefined') {
          const screenWidth = window.innerWidth
          console.log('   → screen width:', screenWidth)
          if (selectedCount <= 1 || screenWidth < 600) {
            console.log('   → returning 1 column')
            return 1
          } else if (selectedCount <= 4 || screenWidth < 900) {
            console.log('   → returning 2 columns')
            return 2
          } else {
            console.log('   → returning 3 columns')
            return 3
          }
        }
        // フォールバック
        console.log('   → fallback logic')
        if (selectedCount >= 5) return 3
        if (selectedCount >= 2) return 2
      }
      console.log('   → default: returning 1')
      return 1
    }
  }

  const getHeaderImageUrl = (): string => {
    const displayColumns = calculateDisplayColumns()
    console.log('🔍 Header image selection:')
    console.log('   Display columns:', displayColumns)
    console.log('   Available header images:', 
      images.value.filter(img => img.type === 'header').map(img => img.id)
    )
    
    const headerImage = images.value.find(img => 
      img.type === 'header' && (
        img.id.includes(`header-${displayColumns}x`) || 
        img.id.includes(`browser-header-${displayColumns}x`)
      )
    )
    const fallback = images.value.find(img => 
      img.type === 'header' && (
        img.id.includes('header-1x') || 
        img.id.includes('browser-header-1x')
      )
    )
    const result = headerImage || fallback
    
    console.log('   Selected header:', result?.id || 'none')
    return result ? (result.dataUrl || result.url || '') : ''
  }
  
  const getComboImageUrl = (): string => {
    const displayColumns = calculateDisplayColumns()
    console.log('🔍 Combo image selection:')
    console.log('   Display columns:', displayColumns)
    console.log('   Available combo images:', 
      images.value.filter(img => img.type === 'combo').map(img => img.id)
    )
    
    const comboImage = images.value.find(img => 
      img.type === 'combo' && (
        img.id.includes(`combo-${displayColumns}x`) || 
        img.id.includes(`browser-combo-${displayColumns}x`)
      )
    )
    const fallback = images.value.find(img => 
      img.type === 'combo' && (
        img.id.includes('combo-1x') || 
        img.id.includes('browser-combo-1x')
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
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '').replace(/\./g, '') // YYYYMMDDHHMMSS
    
    if (layerIndex !== undefined) {
      return `ytomo-vial-kb-${shortName}-L${layerIndex}-${timestamp}.ytvil.png`
    } else if (type.includes('combined') || type.includes('vertical') || type.includes('rectangular')) {
      return `ytomo-vial-kb-${shortName}-${timestamp}.ytvil.png`
    } else {
      return `ytomo-vial-kb-${shortName}-${type}-${timestamp}.ytvil.png`
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

  // 最終出力画像生成（App.vueのhandleGenerateの代替）
  const generateFinalOutputImages = async () => {
    const vialStore = useVialStore()
    const settingsStore = useSettingsStore()
    const uiStore = useUiStore()
    
    if (!vialStore.selectedVialId) return
    
    try {
      uiStore.isGenerating = true
      uiStore.error = null
      
      // ファイル内容を読み取り（currentVialから取得）
      let fileContent: string
      if (vialStore.selectedVialId === 'sample') {
        // サンプルファイルの場合
        try {
          const response = await fetch('/data/yivu40-250907.vil')
          if (!response.ok) {
            throw new Error(`Failed to load sample file: ${response.status}`)
          }
          const sampleFileContent = await response.text()
          fileContent = sampleFileContent
        } catch (error) {
          console.error('Failed to load sample VIL file:', error)
          throw error
        }
      } else if (vialStore.currentVial && vialStore.currentVial.content) {
        fileContent = decodeVialContent(vialStore.currentVial.content)
      } else {
        throw new Error('VIL file content not available')
      }
      
      // ブラウザ版で高品質Canvas画像を生成
      const { BrowserComponentBatchGenerator } = await import('../utils/browserComponentBatchGenerator')
      
      // 実際のファイル名を取得
      let displayName: string
      if (vialStore.selectedVialId === 'sample') {
        displayName = 'sample'
      } else if (vialStore.currentVial?.name) {
        displayName = vialStore.currentVial.name
      } else {
        displayName = 'keyboard'
      }
      
      const components = await BrowserComponentBatchGenerator.generateAllComponents(
        fileContent,
        {
          configPath: displayName,
          colorMode: settingsStore.enableDarkMode ? 'dark' : 'light',
          comboHighlight: settingsStore.showCombos,
          subtextHighlight: settingsStore.highlightEnabled,
          quality: 'high', // 最終出力は高品質
          replaceRules: settingsStore.replaceRules || [],
          outputFormat: settingsStore.outputFormat,
          showHeader: settingsStore.showHeader,
          showCombos: settingsStore.showCombos,
          outputLabel: settingsStore.outputLabel
        }
      )
      
      // 選択されたレイヤーのみフィルタリング
      const layerComponents = components.filter(comp => comp.type === 'layer')
      const selectedLayerComponents = layerComponents.filter((_, index) => settingsStore.layerSelection[index])
      
      // フォーマットに応じてヘッダーとコンボコンポーネントを取得
      let headerComponent, comboComponent
      if (settingsStore.outputFormat === 'vertical') {
        // 垂直結合では常に1x幅を使用
        headerComponent = components.find(comp => comp.type === 'header' && comp.name.includes('header-1x'))
        comboComponent = components.find(comp => comp.type === 'combo' && comp.name.includes('combo-1x'))
      } else if (settingsStore.outputFormat === 'rectangular') {
        // 長方形結合では選択レイヤー数に応じた幅を使用
        let displayColumns: number
        if (selectedLayerComponents.length >= 5) {
          displayColumns = 3
        } else if (selectedLayerComponents.length >= 2) {
          displayColumns = 2
        } else {
          displayColumns = 1
        }
        headerComponent = components.find(comp => comp.type === 'header' && comp.name.includes(`header-${displayColumns}x`))
        comboComponent = components.find(comp => comp.type === 'combo' && comp.name.includes(`combo-${displayColumns}x`))
      } else {
        // separatedの場合は選択レイヤー数に応じた幅を使用
        let displayColumns: number
        if (selectedLayerComponents.length >= 5) {
          displayColumns = 3
        } else if (selectedLayerComponents.length >= 2) {
          displayColumns = 2
        } else {
          displayColumns = 1
        }
        headerComponent = components.find(comp => comp.type === 'header' && comp.name.includes(`header-${displayColumns}x`))
        comboComponent = components.find(comp => comp.type === 'combo' && comp.name.includes(`combo-${displayColumns}x`))
      }
      
      const finalOutputImages: GeneratedImage[] = []
      
      if (settingsStore.outputFormat === 'separated') {
        // separated: 各コンポーネントを個別に出力
        if (headerComponent && settingsStore.showHeader) {
          const filename = generateFileName('header')
          finalOutputImages.push({
            id: 'final-header',
            filename,
            type: 'header',
            format: settingsStore.outputFormat,
            url: await createMetadataEmbeddedDataUrl(headerComponent.canvas, fileContent),
            size: headerComponent.canvas.width * headerComponent.canvas.height * 4,
            timestamp: new Date(),
            canvas: headerComponent.canvas
          })
        }
        
        for (let index = 0; index < selectedLayerComponents.length; index++) {
          const comp = selectedLayerComponents[index]
          const filename = generateFileName('layer', index)
          finalOutputImages.push({
            id: `final-layer-${index}`,
            filename,
            type: 'layer',
            layer: index,
            format: settingsStore.outputFormat,
            url: await createMetadataEmbeddedDataUrl(comp.canvas, fileContent),
            size: comp.canvas.width * comp.canvas.height * 4,
            timestamp: new Date(),
            canvas: comp.canvas
          })
        }
        
        if (comboComponent && settingsStore.showCombos) {
          const filename = generateFileName('combo')
          finalOutputImages.push({
            id: 'final-combo',
            filename,
            type: 'combo',
            format: settingsStore.outputFormat,
            url: await createMetadataEmbeddedDataUrl(comboComponent.canvas, fileContent),
            size: comboComponent.canvas.width * comboComponent.canvas.height * 4,
            timestamp: new Date(),
            canvas: comboComponent.canvas
          })
        }
      } else {
        // vertical/horizontal: 結合画像を生成
        console.log('🔍 Generate - Advanced settings:', settingsStore)
        console.log('🔍 Generate - Header component:', headerComponent?.name)
        console.log('🔍 Generate - Combo component:', comboComponent?.name)
        console.log('🔍 Generate - Show combos:', settingsStore.showCombos)
        
        const combinedCanvas = await generateCombinedImage(
          selectedLayerComponents,
          headerComponent,
          comboComponent,
          settingsStore
        )
        
        const filename = generateFileName(`${settingsStore.outputFormat}-combined`)
        finalOutputImages.push({
          id: 'final-combined',
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
      console.error('Final generation error:', err)
      // エラー時は適当な画像を表示しない - outputImagesをクリア
      outputImages.value = []
      uiStore.isGenerated = false
    } finally {
      uiStore.isGenerating = false
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