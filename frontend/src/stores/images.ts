import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettingsStore } from './settings'
import { useUiStore } from './ui'
import { useVialStore, type VialData } from './vial'

export interface GeneratedImage {
  id: string
  layer: number
  format?: 'separated' | 'vertical' | 'horizontal'
  dataUrl?: string
  url?: string  
  type: 'layer' | 'header' | 'combo'
  timestamp?: Date
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
          keyboardLanguage: settingsStore.keyboardLanguage
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
    link.download = filename || `keyboard_layer${image.layer}_${image.format}.png`
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
      zip.file(`layer${image.layer}_${format}.png`, blob)
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
    selectedLayerComponents?: any[], 
    forOutputGeneration: boolean = false
  ): number => {
    const settingsStore = useSettingsStore()
    const uiStore = useUiStore()
    const format = outputFormat || settingsStore.outputFormat
    
    if (format === 'vertical') {
      return 1
    } else if (format === 'rectangular') {
      if (forOutputGeneration && selectedLayerComponents) {
        // 出力生成時：選択されたレイヤー数で判断
        if (selectedLayerComponents.length >= 5) return 3
        if (selectedLayerComponents.length >= 2) return 2
        return 1
      } else if (uiStore.activeTab === 'select') {
        // SelectTabでは全レイヤー数で判断
        const allLayerCount = images.value.filter(img => img.type === 'layer').length
        if (allLayerCount >= 5) return 3
        if (allLayerCount >= 2) return 2
        return 1
      } else {
        // PreviewTabでは選択レイヤー数で判断
        const selectedCount = Object.values(settingsStore.layerSelection).filter(Boolean).length
        if (selectedCount >= 5) return 3
        if (selectedCount >= 2) return 2
        return 1
      }
    } else { // separated
      return 1
    }
  }

  const getHeaderImageUrl = (): string => {
    const displayColumns = calculateDisplayColumns()
    
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
    
    console.log(`🔍 ImagesStore: getHeaderImageUrl - displayColumns: ${displayColumns}, found: ${result?.id}`)
    return result ? (result.dataUrl || result.url || '') : ''
  }
  
  const getComboImageUrl = (): string => {
    const displayColumns = calculateDisplayColumns()
    
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
    
    console.log(`🔍 ImagesStore: getComboImageUrl - displayColumns: ${displayColumns}, found: ${result?.id}`)
    return result ? (result.dataUrl || result.url || '') : ''
  }

  // 最終出力用の結合画像生成
  const generateFinalOutput = async () => {
    const vialStore = useVialStore()
    const uiStore = useUiStore()
    const settingsStore = useSettingsStore()
    
    if (!vialStore.selectedVialId || vialStore.selectedVialId === 'sample') {
      console.log('⚠️ Final output generation skipped: no VIL file selected')
      return
    }
    
    try {
      setGenerating(true)
      setGenerationError(null)
      uiStore.isGenerated = false
      clearOutputImages()
      
      console.log('🚀 Starting final output generation for:', vialStore.selectedVialId)
      console.log('📋 Output format:', settingsStore.outputFormat)
      console.log('🎛️ Selected layers:', settingsStore.layerSelection)
      
      // 1. 高品質コンポーネント生成
      const { BrowserComponentBatchGenerator } = await import('../utils/browserComponentBatchGenerator')
      
      let fileContent: string
      if (vialStore.currentVial && vialStore.currentVial.content) {
        fileContent = decodeVialContent(vialStore.currentVial.content)
      } else {
        throw new Error('VIL file content not available')
      }
      
      // 適切なファイル名を取得（unixtimeではなく実際のファイル名）
      const displayName = vialStore.currentVial.name || vialStore.selectedVialId
      
      const components = await BrowserComponentBatchGenerator.generateAllComponents(
        fileContent,
        {
          configPath: displayName,
          colorMode: settingsStore.enableDarkMode ? 'dark' : 'light',
          comboHighlight: settingsStore.showCombos,
          subtextHighlight: settingsStore.highlightEnabled,
          quality: 'high',
          replaceRules: settingsStore.replaceRules || [],
          keyboardLanguage: settingsStore.keyboardLanguage
        }
      )
      
      // 2. 選択されたレイヤーとコンポーネントをフィルタリング
      const allLayerComponents = components.filter(comp => comp.type === 'layer')
      const selectedLayerComponents = allLayerComponents.filter((_, index) => 
        settingsStore.layerSelection[index]
      )
      
      // 3. 適切な列数を計算（統一関数を使用）
      const displayColumns = calculateDisplayColumns(
        settingsStore.outputFormat, 
        selectedLayerComponents, 
        true
      )
      
      console.log(`🔧 Final output generation - displayColumns: ${displayColumns}, format: ${settingsStore.outputFormat}`)
      
      // 4. フォーマットに応じて結合画像を生成
      if (settingsStore.outputFormat === 'separated') {
        // separated: 各コンポーネントを個別に出力
        let componentIndex = 0
        
        // ヘッダー（適切な幅を選択）
        if (settingsStore.showHeader) {
          const headerComp = components.find(comp => comp.name.includes(`header-${displayColumns}x-high`))
          if (headerComp) {
            outputImages.value.push({
              id: `output-header-${componentIndex++}`,
              layer: -1,
              type: 'header',
              dataUrl: headerComp.canvas.toDataURL('image/png', 1.0)
            })
          }
        }
        
        // レイヤー
        selectedLayerComponents.forEach((comp, index) => {
          outputImages.value.push({
            id: `output-layer-${componentIndex++}`,
            layer: index,
            type: 'layer',
            dataUrl: comp.canvas.toDataURL('image/png', 1.0)
          })
        })
        
        // コンボ（適切な幅を選択）
        if (settingsStore.showCombos) {
          const comboComp = components.find(comp => comp.name.includes(`combo-${displayColumns}x-high`))
          if (comboComp) {
            outputImages.value.push({
              id: `output-combo-${componentIndex++}`,
              layer: -2,
              type: 'combo',
              dataUrl: comboComp.canvas.toDataURL('image/png', 1.0)
            })
          }
        }
      } else {
        // vertical/rectangular: 結合画像を生成
        const combinedCanvas = await generateCombinedCanvas(
          components,
          selectedLayerComponents,
          settingsStore
        )
        
        outputImages.value.push({
          id: 'output-combined',
          layer: 0,
          type: 'layer',
          dataUrl: combinedCanvas.toDataURL('image/png', 1.0)
        })
      }
      
      console.log('✅ Final output generation completed, output images:', outputImages.value.length)
      setGenerating(false)
      uiStore.isGenerated = true
      
      // OutputTabに自動遷移
      uiStore.activeTab = 'output'
      
    } catch (error) {
      console.error('❌ Final output generation failed:', error)
      setGenerationError(error instanceof Error ? error.message : '最終出力生成に失敗しました')
      setGenerating(false)
      uiStore.isGenerated = false
    }
  }
  
  // 結合キャンバス生成 (App.vueのgenerateCombinedImageと同等の実装)
  const generateCombinedCanvas = async (
    components: any[], 
    selectedLayerComponents: any[], 
    settings: any
  ): Promise<HTMLCanvasElement> => {
    const { KEYBOARD_CONSTANTS } = await import('../constants/keyboard')
    const margin = KEYBOARD_CONSTANTS.margin
    let totalWidth = 0
    let totalHeight = 0
    
    // 適切な列数を計算（統一関数を使用）
    const displayColumns = calculateDisplayColumns(
      settings.outputFormat, 
      selectedLayerComponents, 
      true
    )
    
    // ヘッダーとコンボコンポーネントを適切な幅で取得
    const headerComponent = settings.showHeader ? 
      components.find((comp: any) => comp.name.includes(`header-${displayColumns}x-high`)) : null
    const comboComponent = settings.showCombos ? 
      components.find((comp: any) => comp.name.includes(`combo-${displayColumns}x-high`)) : null
    
    // 各コンポーネントのサイズを取得
    const componentList = []
    
    if (settings.outputFormat === 'rectangular') {
      // 長方形配置：ヘッダー + レイヤーをグリッド配置 + コンボ情報
      const imageWidth = selectedLayerComponents[0]?.canvas.width || 0
      const imageHeight = selectedLayerComponents[0]?.canvas.height || 0
      
      // 枚数に応じた列数を決定
      let gridCols: number
      if (selectedLayerComponents.length >= 5) {
        gridCols = 3
      } else if (selectedLayerComponents.length >= 2) {
        gridCols = 2
      } else {
        gridCols = 1
      }
      
      const gridRows = Math.ceil(selectedLayerComponents.length / gridCols)
      const gridWidth = imageWidth * gridCols
      
      totalWidth = gridWidth
      totalHeight = 0
      
      if (headerComponent && settings.showHeader) {
        componentList.push({ canvas: headerComponent.canvas, type: 'header' })
        totalHeight += headerComponent.canvas.height
      }
      
      // レイヤーグリッドの高さ
      if (selectedLayerComponents.length > 0) {
        totalHeight += imageHeight * gridRows
        selectedLayerComponents.forEach((comp: any) => {
          componentList.push({ canvas: comp.canvas, type: 'layer' })
        })
      }
      
      if (comboComponent && settings.showCombos) {
        componentList.push({ canvas: comboComponent.canvas, type: 'combo' })
        totalHeight += comboComponent.canvas.height
      }
    } else {
      // 縦結合：ヘッダー → 全レイヤー縦並び → コンボ情報
      let maxWidth = 0
      totalHeight = 0
      
      if (headerComponent && settings.showHeader) {
        componentList.push({ canvas: headerComponent.canvas, type: 'header' })
        maxWidth = Math.max(maxWidth, headerComponent.canvas.width)
        totalHeight += headerComponent.canvas.height
      }
      
      selectedLayerComponents.forEach((comp: any) => {
        componentList.push({ canvas: comp.canvas, type: 'layer' })
        maxWidth = Math.max(maxWidth, comp.canvas.width)
        totalHeight += comp.canvas.height
      })
      
      if (comboComponent && settings.showCombos) {
        componentList.push({ canvas: comboComponent.canvas, type: 'combo' })
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
      const imageWidth = selectedLayerComponents[0]?.canvas.width || 0
      const imageHeight = selectedLayerComponents[0]?.canvas.height || 0
      
      // 枚数に応じた列数を決定
      let gridCols: number
      if (selectedLayerComponents.length >= 5) {
        gridCols = 3
      } else if (selectedLayerComponents.length >= 2) {
        gridCols = 2
      } else {
        gridCols = 1
      }
      
      // ヘッダーを先に描画
      const headerComp = componentList.find(comp => comp.type === 'header')
      if (headerComp) {
        const centerX = (totalWidth - headerComp.canvas.width) / 2 + margin
        ctx.drawImage(headerComp.canvas, centerX, currentY)
        currentY += headerComp.canvas.height
      }
      
      // レイヤーをグリッド配置
      const layerCanvases = componentList.filter(comp => comp.type === 'layer').map(comp => comp.canvas)
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
      const comboComp = componentList.find(comp => comp.type === 'combo')
      if (comboComp) {
        const centerX = (totalWidth - comboComp.canvas.width) / 2 + margin
        ctx.drawImage(comboComp.canvas, centerX, currentY)
      }
    } else {
      // 縦結合：全て縦並び、中央水平揃え
      componentList.forEach(comp => {
        const centerX = (totalWidth - comp.canvas.width) / 2 + margin
        ctx.drawImage(comp.canvas, centerX, currentY)
        currentY += comp.canvas.height
      })
    }
    
    return combinedCanvas
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
    generateFinalOutput,
    downloadImage,
    downloadAllImages,
    getLayerImageUrl,
    getHeaderImageUrl,
    getComboImageUrl
  }
})