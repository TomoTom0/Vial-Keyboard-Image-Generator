<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import FileUpload from './components/FileUpload.vue'
import FileHistory from './components/FileHistory.vue'
import SelectTab from './components/SelectTab.vue'
import PreviewTab from './components/PreviewTab.vue'
import OutputTab from './components/OutputTab.vue'
import AdvancedSettings, { type ReplaceRule } from './components/AdvancedSettings.vue'
import { useFileUpload } from './composables/useFileUpload'
import { useImageGeneration, type GenerationOptions } from './composables/useImageGeneration'
import { KEYBOARD_CONSTANTS } from './constants/keyboard'

// Types
interface RecentFile {
  id: string
  name: string
  timestamp: Date
  content: string // ファイル内容をBase64で保存
  type: string    // ファイルのMIMEタイプ
}

interface AdvancedSettings {
  highlightEnabled: boolean
  showCombos: boolean
  showHeader: boolean
  outputFormat: 'separated' | 'vertical' | 'rectangular'
}

interface LayerSelection {
  [layerId: number]: boolean
}

// URLハッシュから初期タブを取得（hashモード形式: /#/tab）
function getInitialTabFromHash(): 'select' | 'preview' | 'output' {
  const hash = window.location.hash
  // /#/select, /#/preview, /#/output の形式をチェック
  if (hash.startsWith('#/')) {
    const path = hash.substring(2) // '#/'を除去
    if (path === 'select' || path === 'preview' || path === 'output') {
      return path
    }
  }
  return 'preview' // デフォルト
}

// URLハッシュを更新（hashモード形式: /#/tab）
function updateHash(tab: 'select' | 'preview' | 'output') {
  window.location.hash = `#/${tab}`
}

// Core state
const currentTab = ref<'select' | 'preview' | 'output'>(getInitialTabFromHash())
const currentFormat = ref<string>('default')
const currentTheme = ref<'light' | 'dark'>('dark')
// 選択ファイルをlocalStorageから復元、なければデフォルト値
const savedSelectedFile = localStorage.getItem('vial-keyboard-selectedFile') || 'sample'
const selectedFile = ref<string>(savedSelectedFile)
const selectedDisplayFile = ref<string>('sample')
const recentFiles = ref<RecentFile[]>([])

// 置換ルール設定
const replaceRules = ref<ReplaceRule[]>([])

// 置換ルールのキャッシュ保存・ロード
const saveReplaceRulesToCache = () => {
  localStorage.setItem('vial-keyboard-replaceRules', JSON.stringify(replaceRules.value))
}

const loadReplaceRulesFromCache = () => {
  const cached = localStorage.getItem('vial-keyboard-replaceRules')
  if (cached) {
    try {
      const rules = JSON.parse(cached)
      if (Array.isArray(rules)) {
        replaceRules.value = rules
      }
    } catch (e) {
      console.warn('Failed to load replace rules from cache:', e)
    }
  }
}

// 高度な設定のキャッシュ保存・ロード
const saveAdvancedSettingsToCache = () => {
  localStorage.setItem('vial-keyboard-advancedSettings', JSON.stringify(advancedSettings.value))
}

const loadAdvancedSettingsFromCache = () => {
  const cached = localStorage.getItem('vial-keyboard-advancedSettings')
  if (cached) {
    try {
      const settings = JSON.parse(cached)
      if (settings && typeof settings === 'object') {
        // 既存の設定をマージして不足分を補完
        advancedSettings.value = {
          ...advancedSettings.value,
          ...settings
        }
      }
    } catch (e) {
      console.warn('Failed to load advanced settings from cache:', e)
    }
  }
}

// Control panel tab state for responsive design
const controlPanelTab = ref<'layout' | 'upload' | 'format'>('upload') // 初期はファイルタブ

// ファイル選択状態に応じてタブを自動切り替え
const updateControlPanelTab = () => {
  if (!selectedFile.value || selectedFile.value === 'sample') {
    controlPanelTab.value = 'upload' // ファイル未選択時はファイルタブ
  } else {
    controlPanelTab.value = 'format' // ファイル選択済みは設定タブ
  }
}

// Settings
const advancedSettings = ref<AdvancedSettings>({
  highlightEnabled: false,
  showCombos: true,
  showHeader: true,
  outputFormat: 'separated'
})

const layerSelection = ref<LayerSelection>({
  0: true,
  1: true,
  2: true,
  3: true,
  4: false,
  5: false
})

// Preview and output data
const previewImages = ref<any[]>([])
const outputImages = ref<any[]>([])
const isGenerating = ref(false)
const isGenerated = ref(false)
const error = ref<string | null>(null)

// Canvas generation cache to prevent unnecessary regeneration
const canvasCache = new Map<string, any[]>()
let generateTimeout: NodeJS.Timeout | null = null

const generateCacheKey = (fileName: string, theme: string, showCombos: boolean, highlightEnabled: boolean, tab?: string, layerSelection?: string, replaceRules?: ReplaceRule[], outputFormat?: string) => {
  if (!fileName || typeof fileName !== 'string') {
    throw new Error('Invalid fileName for cache key generation')
  }
  const rulesHash = replaceRules && Array.isArray(replaceRules) 
    ? JSON.stringify(replaceRules.filter(r => r && typeof r === 'object' && r.enabled && r.from !== '' && r.to !== '')) 
    : 'none'
  return `${fileName}-${theme}-${showCombos}-${highlightEnabled}-${tab || 'none'}-${layerSelection || 'none'}-${rulesHash}-${outputFormat || 'none'}`
}

// 結合画像を生成する関数
const generateCombinedImage = (
  layerComponents: any[],
  headerComponent: any,
  comboComponent: any,
  settings: any
): HTMLCanvasElement => {
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
  ctx.fillStyle = currentTheme.value === 'dark' ? '#1c1c20' : '#f5f5f5'
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

// Debounced preview generation to prevent excessive regeneration
const debouncedGeneratePreview = () => {
  console.log('🔄 Setting changed, regenerating in 100ms...')
  if (generateTimeout) {
    clearTimeout(generateTimeout)
  }
  generateTimeout = setTimeout(() => {
    console.log('⏰ Timeout reached, starting generation')
    generatePreviewImages()
  }, 100) // 100ms delay
}

// Composables
const {
  hasFile,
  setFile,
  validateFile
} = useFileUpload()

const {
  images,
  generateImages,
  generateImagesFromContent,
  clearError
} = useImageGeneration()

// Computed
const availableFiles = computed(() => {
  const files = ['sample']
  if (selectedFile.value && selectedFile.value !== 'sample') {
    files.push(selectedFile.value)
  }
  recentFiles.value.forEach(file => {
    if (!files.includes(file.name)) {
      files.push(file.name)
    }
  })
  return files
})

// ファイル内容を読み込む関数
const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file) // Base64形式で読み込み
  })
}

// Base64からFileオブジェクトを作成する関数
const createFileFromBase64 = (content: string, name: string, type: string): File => {
  const byteCharacters = atob(content.split(',')[1])
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new File([byteArray], name, { type })
}

// File handling
const handleFileSelected = async (file: File) => {
  const validationError = validateFile(file)
  if (validationError) {
    error.value = validationError
    return
  }
  
  try {
    // ファイル内容を読み込み
    const content = await readFileContent(file)
    
    selectedFile.value = file.name
    setFile(file)
    
    await addToRecentFiles(file, content)
    selectedDisplayFile.value = file.name
    generatePreviewImages()
    
    console.log('📁 File selected:', file.name)
  } catch (err) {
    error.value = 'ファイルの読み込みに失敗しました'
    console.error('File reading error:', err)
  }
}

const handleFileHistorySelected = async (recentFile: RecentFile) => {
  // recentFileのnullチェック
  if (!recentFile || !recentFile.name || typeof recentFile.name !== 'string') {
    console.error('Invalid recentFile passed to handleFileHistorySelected:', recentFile)
    error.value = 'Invalid file selection'
    return
  }
  
  // サンプルが渡された場合は選択解除
  if (recentFile.name === 'sample') {
    selectedFile.value = 'sample'
    selectedDisplayFile.value = 'sample'
    generatePreviewImages()
    return
  }
  
  selectedFile.value = recentFile.name
  selectedDisplayFile.value = recentFile.name
  
  try {
    // 共通のgeneratePreviewImagesを使用
    generatePreviewImages()
    
    console.log('📁 履歴ファイル選択完了:', recentFile.name)
  } catch (err) {
    error.value = '履歴ファイルの処理に失敗しました'
    console.error('History file processing error:', err)
  }
}

const handleFileDownload = (recentFile: RecentFile) => {
  // Base64データからファイルをダウンロード
  const link = document.createElement('a')
  link.href = recentFile.content
  link.download = recentFile.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleFileDelete = (recentFile: RecentFile) => {
  const index = recentFiles.value.findIndex(f => f.id === recentFile.id)
  if (index > -1) {
    recentFiles.value.splice(index, 1)
    saveRecentFiles()
    
    // 削除されたファイルが現在選択されている場合、サンプルに戻す
    if (selectedFile.value === recentFile.name) {
      selectedFile.value = 'sample'
      selectedDisplayFile.value = 'sample'
    }
  }
}

const addToRecentFiles = async (file: File, content: string) => {
  const newFile: RecentFile = {
    id: Date.now().toString(),
    name: file.name,
    timestamp: new Date(),
    content,
    type: file.type
  }
  
  recentFiles.value = recentFiles.value.filter(f => f.name !== file.name)
  recentFiles.value.unshift(newFile)
  
  if (recentFiles.value.length > 5) {
    recentFiles.value = recentFiles.value.slice(0, 5)
  }
  
  saveRecentFiles()
}

// Format and theme handling
const handleFormatChanged = (format: string) => {
  currentFormat.value = format
  generatePreviewImages()
}

const handleThemeChanged = (theme: 'light' | 'dark') => {
  currentTheme.value = theme
  debouncedGeneratePreview()
}

const handleAdvancedSettingsChanged = (settings: AdvancedSettings) => {
  advancedSettings.value = settings
  debouncedGeneratePreview()
}

const updateOutputFormat = (format: 'separated' | 'vertical' | 'rectangular') => {
  advancedSettings.value.outputFormat = format
  generatePreviewImages()
}

const toggleHighlight = () => {
  advancedSettings.value.highlightEnabled = !advancedSettings.value.highlightEnabled
  debouncedGeneratePreview()
}

const toggleCombos = () => {
  advancedSettings.value.showCombos = !advancedSettings.value.showCombos
  debouncedGeneratePreview()
}

const getFormatExplanationImage = (): string => {
  const format = advancedSettings.value.outputFormat
  return `/images/explanations/format-${format}.png`
}

// Tab navigation
const handleTabChanged = (tab: 'select' | 'preview' | 'output') => {
  // Outputタブは画像生成完了後のみ選択可能
  if (tab === 'output' && !isGenerated.value) {
    return
  }
  currentTab.value = tab
}

const handleDisplayFileChanged = (fileName: string) => {
  selectedDisplayFile.value = fileName
  generatePreviewImages()
}

// Control panel tab handling
const handleControlPanelTabChanged = (tab: 'layout' | 'upload' | 'format') => {
  controlPanelTab.value = tab
}

// Layer selection
const handleLayerSelectionChanged = (selection: LayerSelection) => {
  console.log('🔄 Layer selection changed:', selection)
  layerSelection.value = selection
  generatePreviewImages()
}

const handleComboToggled = (enabled: boolean) => {
  advancedSettings.value.showCombos = enabled
  debouncedGeneratePreview()
}

const handleHeaderToggled = (enabled: boolean) => {
  advancedSettings.value.showHeader = enabled
  generatePreviewImages()
}

// 置換ルール変更時の処理
const handleReplaceRulesChanged = (rules: ReplaceRule[]) => {
  replaceRules.value = rules
  // キャッシュに保存
  saveReplaceRulesToCache()
  // ルールが変更されたらプレビュー画像を再生成
  generatePreviewImages()
}

// Preview generation
const generatePreviewImages = async () => {
  try {
    isGenerating.value = true
    error.value = null
    
    console.log('🔍 Debug: selectedDisplayFile.value =', selectedDisplayFile.value)
    console.log('🔍 Debug: selectedFile.value =', selectedFile.value)
    
    if (selectedDisplayFile.value === 'sample') {
      // サンプルファイルの場合 - 静的画像を使用
      const sampleImages: any[] = []
      for (let layer = 0; layer <= 3; layer++) {
        sampleImages.push({
          id: `sample-layer-${layer}`,
          layer,
          url: `/images/sample/keyboard_layout_layer${layer}_modular.png`,
          type: 'layer'
        })
      }
      previewImages.value = sampleImages
    } else if (selectedFile.value && selectedFile.value !== 'sample') {
      // selectedFile.valueの型チェック
      if (typeof selectedFile.value !== 'string') {
        console.error('selectedFile.value is not a string:', selectedFile.value)
        throw new Error('Invalid file selection')
      }
      
      // キャッシュキーを生成（レイヤー選択状態も含める）
      const layerSelectionKey = Object.entries(layerSelection.value)
        .filter(([_, selected]) => selected)
        .map(([layer, _]) => layer)
        .sort()
        .join(',')
      
      const cacheKey = generateCacheKey(
        selectedFile.value, 
        currentTheme.value,
        advancedSettings.value.showCombos,
        advancedSettings.value.highlightEnabled,
        currentTab.value,
        layerSelectionKey,
        replaceRules.value || [],
        advancedSettings.value.outputFormat
      )
      
      console.log('🔑 Cache key:', cacheKey)
      
      // キャッシュから検索
      if (canvasCache.has(cacheKey)) {
        console.log('✨ Using cached images')
        previewImages.value = canvasCache.get(cacheKey)!
        return
      } else {
        console.log('🏭 Generating new images for cache key:', cacheKey)
      }
      
      // キャッシュにない場合は新規生成
      // 現在のファイルコンテンツを取得
      const recentFile = recentFiles.value.find(f => f && f.name === selectedFile.value)
      if (!recentFile) throw new Error('ファイルが見つかりません')
      if (!recentFile.content || typeof recentFile.content !== 'string') {
        throw new Error('ファイルコンテンツが無効です')
      }
      const base64Content = recentFile.content.replace(/^data:.*base64,/, '')
      const fileContent = atob(base64Content)
      
      const generatedImages = await generatePreviewImagesForContent(fileContent, selectedFile.value)
      
      // キャッシュに保存（最新5件のみ保持）
      canvasCache.set(cacheKey, generatedImages)
      if (canvasCache.size > 5) {
        const firstKey = canvasCache.keys().next().value
        canvasCache.delete(firstKey)
      }
      
      // Vue.jsのリアクティブ更新を筢実にするため、新しい配列を作成
      previewImages.value = [...generatedImages]
      console.log('🖼️ Updated previewImages array with', generatedImages.length, 'images')
    }
    
  } catch (err) {
    console.error('Preview generation failed:', err)
    error.value = err instanceof Error ? err.message : 'Preview generation failed'
    // エラー時は適当な画像を表示しない - previewImagesをクリア
    previewImages.value = []
  } finally {
    isGenerating.value = false
  }
}

const generatePreviewImagesForContent = async (fileContent: string, fileName: string) => {
  try {
    
    // ブラウザ版の関数を使用
    const { BrowserComponentBatchGenerator } = await import('./utils/browserComponentBatchGenerator')
    
    
    const components = await BrowserComponentBatchGenerator.generateAllComponents(
      fileContent,
      {
        configPath: fileName,
        colorMode: currentTheme.value,
        comboHighlight: advancedSettings.value.showCombos,
        subtextHighlight: advancedSettings.value.highlightEnabled,
        quality: 'low', // プレビューは低品質
        replaceRules: replaceRules.value || []
      }
    )
    
    // レイヤー数に応じた適切なコンポーネントを選択
    const layerComponents = components.filter(comp => comp.type === 'layer')
    const layerCount = layerComponents.length
    
    console.log('🎯 Generated components:', components.map(c => ({ name: c.name, type: c.type })))
    
    // タブに応じて列数決定のロジックを変更
    console.log('🏷️ Current tab:', currentTab.value)
    console.log('🏷️ Layer count:', layerCount)
    let displayColumns: number
    if (currentTab.value === 'select') {
      // セレクトタブでは全体レイヤー数で判断
      if (layerCount >= 5) {
        displayColumns = 3
      } else if (layerCount >= 2) {
        displayColumns = 2
      } else {
        displayColumns = 1
      }
      console.log('📊 Select tab - Total layer count:', layerCount, 'Display columns:', displayColumns)
    } else {
      // プレビュータブでは出力フォーマットに応じて判断
      console.log('🔍 Raw layerSelection.value:', layerSelection.value)
      console.log('🔍 Output format:', advancedSettings.value.outputFormat)
      
      if (advancedSettings.value.outputFormat === 'vertical') {
        // 垂直結合では常に1列幅
        displayColumns = 1
        console.log('✅ Vertical format - Setting 1 column')
      } else if (advancedSettings.value.outputFormat === 'rectangular') {
        // 長方形結合では選択レイヤー数に応じて決定
        const selectedLayers = Object.entries(layerSelection.value)
          .filter(([_, selected]) => selected)
          .map(([layer, _]) => parseInt(layer))
        
        console.log('🔍 Filtered selectedLayers:', selectedLayers, 'Length:', selectedLayers.length)
        
        if (selectedLayers.length >= 5) {
          displayColumns = 3
          console.log('✅ Rectangular format - Setting 3 columns (>=5 layers)')
        } else if (selectedLayers.length >= 2) {
          displayColumns = 2
          console.log('✅ Rectangular format - Setting 2 columns (2-4 layers)')
        } else {
          displayColumns = 1
          console.log('✅ Rectangular format - Setting 1 column (<=1 layers)')
        }
      } else {
        // separatedの場合は1列
        displayColumns = 1
        console.log('✅ Separated format - Setting 1 column')
      }
      console.log('📊 Preview tab - Display columns:', displayColumns)
    }
    
    // 適切な幅のコンポーネントを選択（quality付きの名前）
    const searchHeaderName = `header-${displayColumns}x-low`
    const searchComboName = `combo-${displayColumns}x-low`
    console.log('🔍 Searching for header:', searchHeaderName, 'combo:', searchComboName)
    console.log('🔍 Available components:', components.map(c => c.name))
    
    let headerComponent = components.find(comp => comp.name.includes(searchHeaderName))
    let comboComponent = components.find(comp => comp.name.includes(searchComboName))
    
    // フォールバック処理：見つからない場合は1x幅を使用
    if (!headerComponent) {
      console.log('⚠️ Header component not found, falling back to 1x')
      headerComponent = components.find(comp => comp.name.includes('header-1x-low'))
    }
    if (!comboComponent) {
      console.log('⚠️ Combo component not found, falling back to 1x')
      comboComponent = components.find(comp => comp.name.includes('combo-1x-low'))
    }
    
    console.log('🏷️ Found header:', headerComponent?.name, 'Found combo:', comboComponent?.name)
    
    // プレビュー用画像配列を構築
    const previewImages = []
    
    // 列数に応じた適切な幅のヘッダーを追加
    // すべての幅のヘッダー情報を追加
    console.log('🔍 Available headers:', components.filter(comp => comp.type === 'header').map(comp => comp.name))
    for (let width = 1; width <= 3; width++) {
      const headerComp = components.find(comp => comp.name.includes(`header-${width}x-low`))
      if (headerComp) {
        const headerURL = headerComp.canvas.toDataURL('image/png', 0.7)
        previewImages.push({
          id: `browser-header-${width}x`,
          layer: -1,
          url: headerURL,
          type: 'header' as const
        })
        console.log(`🏷️ Added header-${width}x to preview images`)
      } else {
        console.log(`⚠️ Header-${width}x not found`)
      }
    }
    
    // レイヤー画像追加
    layerComponents.forEach((comp, index) => {
      const dataURL = comp.canvas.toDataURL('image/png', 0.7)
      if (index === 0) {
        console.log('🖼️ First layer data URL preview:', dataURL.substring(0, 100) + '...')
      }
      previewImages.push({
        id: `browser-layer-${index}`,
        layer: index,
        url: dataURL,
        type: 'layer' as const
      })
    })
    
    // すべての幅のコンボ情報を追加
    console.log('🔍 Available combos:', components.filter(comp => comp.type === 'combo').map(comp => comp.name))
    for (let width = 1; width <= 3; width++) {
      const comboComp = components.find(comp => comp.name.includes(`combo-${width}x-low`))
      if (comboComp) {
        const comboURL = comboComp.canvas.toDataURL('image/png', 0.7)
        previewImages.push({
          id: `browser-combo-${width}x`,
          layer: -2,
          url: comboURL,
          type: 'combo' as const
        })
        console.log(`🤼 Added combo-${width}x to preview images`)
      } else {
        console.log(`⚠️ Combo-${width}x not found`)
      }
    }
    
    return previewImages
    
  } catch (error) {
    console.error('ブラウザ内画像生成でエラー:', error)
    throw error
  }
}

const getSelectedLayerRange = () => {
  const selectedLayers = Object.entries(layerSelection.value)
    .filter(([_, selected]) => selected)
    .map(([layer, _]) => parseInt(layer))
  
  if (selectedLayers.length === 0) return { start: 0, end: 0 }
  
  return {
    start: Math.min(...selectedLayers),
    end: Math.max(...selectedLayers)
  }
}

// Final generation
const handleGenerate = async () => {
  if (!selectedFile.value || selectedFile.value === 'sample') return
  
  try {
    isGenerating.value = true
    error.value = null
    
    // ファイル内容を読み取り（recentFilesから取得）
    const recentFile = recentFiles.value.find(f => f.name === selectedFile.value)
    if (!recentFile) throw new Error('ファイルが見つかりません')
    const base64Content = recentFile.content.replace(/^data:.*base64,/, '')
    const fileContent = atob(base64Content)
    
    // ブラウザ版で高品質Canvas画像を生成
    const { BrowserComponentBatchGenerator } = await import('./utils/browserComponentBatchGenerator')
    
    const components = await BrowserComponentBatchGenerator.generateAllComponents(
      fileContent,
      {
        configPath: selectedFile.value,
        colorMode: currentTheme.value,
        comboHighlight: advancedSettings.value.showCombos,
        subtextHighlight: advancedSettings.value.highlightEnabled,
        quality: 'high', // 最終出力は高品質
        replaceRules: replaceRules.value || []
      }
    )
    
    // 選択されたレイヤーのみフィルタリング
    const layerComponents = components.filter(comp => comp.type === 'layer')
    const selectedLayerComponents = layerComponents.filter((_, index) => layerSelection.value[index])
    
    // フォーマットに応じてヘッダーとコンボコンポーネントを取得
    let headerComponent, comboComponent
    if (advancedSettings.value.outputFormat === 'vertical') {
      // 垂直結合では常に1x幅を使用
      headerComponent = components.find(comp => comp.type === 'header' && comp.name.includes('header-1x'))
      comboComponent = components.find(comp => comp.type === 'combo' && comp.name.includes('combo-1x'))
    } else if (advancedSettings.value.outputFormat === 'rectangular') {
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
    
    const finalOutputImages = []
    
    // 簡略化されたファイル名形式: 元ファイル名-タイムスタンプ
    const generateFileName = (type: string, layerIndex?: number) => {
      if (!selectedFile.value || typeof selectedFile.value !== 'string') {
        throw new Error('Invalid selectedFile for filename generation')
      }
      const originalName = selectedFile.value.replace(/\.vil$/, '')
      const shortName = originalName.slice(0, 12) // 文字数を少し増やす
      const timestamp = new Date().toISOString().slice(11, 16).replace(/[-:T]/g, '') // HHMM のみ
      
      if (layerIndex !== undefined) {
        return `${shortName}-L${layerIndex}-${timestamp}.png`
      } else if (type.includes('combined') || type.includes('vertical') || type.includes('rectangular')) {
        return `${shortName}-${timestamp}.png`
      } else {
        return `${shortName}-${type}-${timestamp}.png`
      }
    }
    
    if (advancedSettings.value.outputFormat === 'separated') {
      // separated: 各コンポーネントを個別に出力
      if (headerComponent && advancedSettings.value.showHeader) {
        const filename = generateFileName('header')
        finalOutputImages.push({
          id: 'final-header',
          filename,
          type: 'combined' as const,
          format: advancedSettings.value.outputFormat,
          url: headerComponent.canvas.toDataURL('image/png', 1.0),
          size: headerComponent.canvas.width * headerComponent.canvas.height * 4,
          timestamp: new Date(),
          canvas: headerComponent.canvas
        })
      }
      
      selectedLayerComponents.forEach((comp, index) => {
        const filename = generateFileName('layer', index)
        finalOutputImages.push({
          id: `final-layer-${index}`,
          filename,
          type: 'layer' as const,
          layer: index,
          format: advancedSettings.value.outputFormat,
          url: comp.canvas.toDataURL('image/png', 1.0),
          size: comp.canvas.width * comp.canvas.height * 4,
          timestamp: new Date(),
          canvas: comp.canvas
        })
      })
      
      if (comboComponent && advancedSettings.value.showCombos) {
        const filename = generateFileName('combo')
        finalOutputImages.push({
          id: 'final-combo',
          filename,
          type: 'combined' as const,
          format: advancedSettings.value.outputFormat,
          url: comboComponent.canvas.toDataURL('image/png', 1.0),
          size: comboComponent.canvas.width * comboComponent.canvas.height * 4,
          timestamp: new Date(),
          canvas: comboComponent.canvas
        })
      }
    } else {
      // vertical/horizontal: 結合画像を生成
      console.log('🔍 Generate - Advanced settings:', advancedSettings.value)
      console.log('🔍 Generate - Header component:', headerComponent?.name)
      console.log('🔍 Generate - Combo component:', comboComponent?.name)
      console.log('🔍 Generate - Show combos:', advancedSettings.value.showCombos)
      
      const combinedCanvas = generateCombinedImage(
        selectedLayerComponents,
        headerComponent,
        comboComponent,
        advancedSettings.value
      )
      
      const filename = generateFileName(`${advancedSettings.value.outputFormat}-combined`)
      finalOutputImages.push({
        id: 'final-combined',
        filename,
        type: 'combined' as const,
        format: advancedSettings.value.outputFormat,
        url: combinedCanvas.toDataURL('image/png', 1.0),
        size: combinedCanvas.width * combinedCanvas.height * 4,
        timestamp: new Date(),
        canvas: combinedCanvas
      })
    }
    
    outputImages.value = finalOutputImages
    isGenerated.value = true
    currentTab.value = 'output'
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Generation failed'
    console.error('Final generation error:', err)
    // エラー時は適当な画像を表示しない - outputImagesをクリア
    outputImages.value = []
    isGenerated.value = false
  } finally {
    isGenerating.value = false
  }
}

// Download handling
const handleDownload = (format: 'individual' | 'zip') => {
  if (format === 'zip') {
    console.log('Downloading as ZIP...')
  } else {
    outputImages.value.forEach(image => {
      const link = document.createElement('a')
      link.href = image.url
      link.download = image.filename
      link.click()
    })
  }
}

// Error handling
const handleError = (message: string) => {
  error.value = message
}

// Local storage
const saveRecentFiles = () => {
  try {
    const toSave = recentFiles.value.map(f => ({
      id: f.id,
      name: f.name,
      timestamp: f.timestamp.toISOString(),
      content: f.content,
      type: f.type
    }))
    localStorage.setItem('vial-recent-files', JSON.stringify(toSave))
  } catch (err) {
    console.warn('Failed to save recent files:', err)
  }
}

const loadRecentFiles = () => {
  try {
    const saved = localStorage.getItem('vial-recent-files')
    if (saved) {
      const parsed = JSON.parse(saved)
      recentFiles.value = parsed.map((f: any) => ({
        ...f,
        timestamp: new Date(f.timestamp)
      }))
    }
  } catch (err) {
    console.warn('Failed to load recent files:', err)
  }
}

// ファイル復元時の表示ファイル同期
const syncDisplayFileAfterLoad = () => {
  if (selectedFile.value && selectedFile.value !== 'sample') {
    // 選択されたファイルがrecentFilesに存在するかチェック
    const fileExists = recentFiles.value.some(f => f.name === selectedFile.value)
    if (fileExists) {
      selectedDisplayFile.value = selectedFile.value
      console.log('📁 Restored file selection:', selectedFile.value)
    } else {
      // ファイルが存在しない場合はサンプルに戻す
      selectedFile.value = 'sample'
      selectedDisplayFile.value = 'sample'
      console.log('📁 File not found, falling back to sample')
    }
  }
}

// Initialization
// タブ変更時にハッシュを更新
watch(currentTab, (newTab) => {
  updateHash(newTab)
})

// ファイル選択状態に応じてコントロールパネルタブを自動切り替え
watch(selectedFile, () => {
  updateControlPanelTab()
}, { immediate: true })

// 選択ファイルの変更をlocalStorageに保存
watch(selectedFile, (newFile) => {
  localStorage.setItem('vial-keyboard-selectedFile', newFile)
})

// 高度な設定の変更をlocalStorageに保存し、画像を再生成
watch(advancedSettings, () => {
  saveAdvancedSettingsToCache()
  // フォーマット変更時は画像を再生成
  generatePreviewImages()
}, { deep: true })

// ハッシュ変更を監視してタブを同期
const handleHashChange = () => {
  const newTab = getInitialTabFromHash()
  if (newTab !== currentTab.value) {
    currentTab.value = newTab
  }
}

onMounted(() => {
  loadRecentFiles()
  loadReplaceRulesFromCache()
  loadAdvancedSettingsFromCache()
  
  // ファイル復元後の表示同期
  syncDisplayFileAfterLoad()
  
  // ハッシュ変更イベントを監視
  window.addEventListener('hashchange', handleHashChange)
  
  // 設定ロード後に適切な画像を生成
  nextTick(() => {
    generatePreviewImages()
  })
})

// Cleanup on unmount
onUnmounted(() => {
  if (generateTimeout) {
    clearTimeout(generateTimeout)
  }
  canvasCache.clear()
  
  // ハッシュ変更イベントリスナーを削除
  window.removeEventListener('hashchange', handleHashChange)
})
</script>

<template>
  <div class="app">
    <!-- ページヘッダー -->
    <header class="page-header">
      <h1 class="page-title">YTomo Vial Keyboard Image Generator</h1>
    </header>
    
    <!-- 上部コントロールパネル -->
    <section class="control-panel">
      <!-- デスクトップ表示（横幅十分） -->
      <div class="control-panel-desktop">
        <div class="panel-section layout-section">
          <div class="layout-preview">
            <div class="layout-sample-small">
              <img src="/assets/sample/keyboard/dark/0-0/layer0-low.png" alt="Layout sample" class="sample-image" />
              <div class="layout-title-overlay">Corne v4</div>
            </div>
          </div>
        </div>
        
        <div class="panel-section upload-section">
          <div class="file-grid">
            <FileUpload
              @file-selected="handleFileSelected"
              @error="handleError"
            />
            <FileHistory
              :recent-files="recentFiles"
              :selected-file="selectedFile"
              @file-selected="handleFileHistorySelected"
              @file-downloaded="handleFileDownload"
              @file-deleted="handleFileDelete"
            />
          </div>
        </div>
        
        <div class="panel-section format-section">
          <div class="format-buttons">
            <button :class="['format-btn', { active: advancedSettings.outputFormat === 'separated' }]" @click="updateOutputFormat('separated')">
              <span class="format-label">Separated</span>
              <div class="format-diagram">
                <div class="diagram-separated">
                  <div class="layer-individual">L0</div>
                  <div class="layer-individual">L1</div>
                  <div class="layer-individual">L2</div>
                  <div class="layer-individual">L3</div>
                </div>
              </div>
            </button>
            <button :class="['format-btn', { active: advancedSettings.outputFormat === 'vertical' }]" @click="updateOutputFormat('vertical')">
              <span class="format-label">Vertical</span>
              <div class="format-diagram">
                <div class="diagram-vertical">
                  <div class="layer-stack">
                    <div class="layer-box">L0</div>
                    <div class="layer-box">L1</div>
                    <div class="layer-box">L2</div>
                    <div class="layer-box">L3</div>
                  </div>
                  <div class="combo-box">Combos</div>
                </div>
              </div>
            </button>
            <button :class="['format-btn', { active: advancedSettings.outputFormat === 'rectangular' }]" @click="updateOutputFormat('rectangular')">
              <span class="format-label">Rectangular</span>
              <div class="format-diagram">
                <div class="diagram-horizontal">
                  <div class="horizontal-grid">
                    <div class="layer-box">L0</div>
                    <div class="layer-box">L2</div>
                    <div class="layer-box">L1</div>
                    <div class="layer-box">L3</div>
                  </div>
                  <div class="combo-box">Combos</div>
                </div>
              </div>
            </button>
          </div>
          <div class="control-buttons-section">
            <button :class="['highlight-toggle-btn', { active: advancedSettings.highlightEnabled }]" @click="toggleHighlight">
              Highlight {{ advancedSettings.highlightEnabled ? 'on' : 'off' }}
            </button>
            <button 
              :class="['theme-toggle-btn', { active: currentTheme === 'dark' }]" 
              @click="currentTheme = currentTheme === 'dark' ? 'light' : 'dark'; debouncedGeneratePreview()"
            >
              {{ currentTheme === 'dark' ? 'Dark' : 'Light' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- モバイル表示（タブ切り替え） -->
      <div class="control-panel-mobile">
        <div class="control-tab-buttons">
          <button :class="['control-tab-btn', { active: controlPanelTab === 'upload' }]" @click="handleControlPanelTabChanged('upload')">
            Files
          </button>
          <button :class="['control-tab-btn', { active: controlPanelTab === 'format' }]" @click="handleControlPanelTabChanged('format')">
            Settings
          </button>
          <button :class="['control-tab-btn', { active: controlPanelTab === 'layout' }]" @click="handleControlPanelTabChanged('layout')">
            Layout
          </button>
        </div>
        
        <div class="control-tab-content">
          <div v-show="controlPanelTab === 'layout'" class="panel-section layout-section">
            <div class="layout-preview">
              <div class="layout-sample-small">
                <img src="/assets/sample/keyboard/dark/0-0/layer0-low.png" alt="Layout sample" class="sample-image" />
                <div class="layout-title-overlay">Corne v4</div>
              </div>
            </div>
          </div>
          
          <div v-show="controlPanelTab === 'upload'" class="panel-section upload-section">
            <div class="file-grid">
              <FileUpload
                @file-selected="handleFileSelected"
                @error="handleError"
              />
              <FileHistory
                :recent-files="recentFiles"
                :selected-file="selectedFile"
                @file-selected="handleFileHistorySelected"
                @file-downloaded="handleFileDownload"
                @file-deleted="handleFileDelete"
              />
            </div>
          </div>
          
          <div v-show="controlPanelTab === 'format'" class="panel-section format-section">
            <div class="format-buttons">
              <button :class="['format-btn', { active: advancedSettings.outputFormat === 'separated' }]" @click="updateOutputFormat('separated')">
                <span class="format-label">Separated</span>
                <div class="format-diagram">
                  <div class="diagram-separated">
                    <div class="layer-individual">L0</div>
                    <div class="layer-individual">L1</div>
                    <div class="layer-individual">L2</div>
                    <div class="layer-individual">L3</div>
                  </div>
                </div>
              </button>
              <button :class="['format-btn', { active: advancedSettings.outputFormat === 'vertical' }]" @click="updateOutputFormat('vertical')">
                <span class="format-label">Vertical</span>
                <div class="format-diagram">
                  <div class="diagram-vertical">
                    <div class="layer-stack">
                      <div class="layer-box">L0</div>
                      <div class="layer-box">L1</div>
                      <div class="layer-box">L2</div>
                      <div class="layer-box">L3</div>
                    </div>
                    <div class="combo-box">Combos</div>
                  </div>
                </div>
              </button>
              <button :class="['format-btn', { active: advancedSettings.outputFormat === 'rectangular' }]" @click="updateOutputFormat('rectangular')">
                <span class="format-label">Rectangular</span>
                <div class="format-diagram">
                  <div class="diagram-horizontal">
                    <div class="horizontal-grid">
                      <div class="layer-box">L0</div>
                      <div class="layer-box">L2</div>
                      <div class="layer-box">L1</div>
                      <div class="layer-box">L3</div>
                    </div>
                    <div class="combo-box">Combos</div>
                  </div>
                </div>
              </button>
            </div>
            <div class="control-buttons-section">
              <button :class="['highlight-toggle-btn', { active: advancedSettings.highlightEnabled }]" @click="toggleHighlight">
                Highlight {{ advancedSettings.highlightEnabled ? 'on' : 'off' }}
              </button>
              <button 
                :class="['theme-toggle-btn', { active: currentTheme === 'dark' }]" 
                @click="currentTheme = currentTheme === 'dark' ? 'light' : 'dark'; debouncedGeneratePreview()"
              >
                {{ currentTheme === 'dark' ? 'Dark' : 'Light' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- メインワークエリア -->
    <main class="workspace">
      <div class="workspace-header">
        <div class="workspace-nav">
          <div class="tab-buttons">
            <button :class="['tab-btn', { active: currentTab === 'select' }]" @click="handleTabChanged('select')">Select</button>
            <button :class="['tab-btn', { active: currentTab === 'preview' }]" @click="handleTabChanged('preview')">Preview</button>
            <button :class="['tab-btn', { active: currentTab === 'output', disabled: !isGenerated }]" @click="handleTabChanged('output')" :disabled="!isGenerated">Output</button>
          </div>
        </div>
      </div>
      
      <div class="workspace-content">
        <div v-if="error" class="error-toast">
          {{ error }}
          <button @click="error = null" class="error-close">&times;</button>
        </div>
        
        <SelectTab
          v-show="currentTab === 'select'"
          :selected-file="selectedDisplayFile"
          :layer-selection="layerSelection"
          :output-format="advancedSettings.outputFormat"
          :theme="currentTheme"
          :highlight-enabled="advancedSettings.highlightEnabled"
          :show-combos="advancedSettings.showCombos"
          :show-header="advancedSettings.showHeader"
          :generated-images="previewImages"
          @layer-selection-changed="handleLayerSelectionChanged"
          @combo-toggled="handleComboToggled"
          @header-toggled="handleHeaderToggled"
        />
        
        <PreviewTab
          v-show="currentTab === 'preview'"
          :selected-file="selectedDisplayFile"
          :layer-selection="layerSelection"
          :output-format="advancedSettings.outputFormat"
          :theme="currentTheme"
          :highlight-enabled="advancedSettings.highlightEnabled"
          :show-combos="advancedSettings.showCombos"
          :show-header="advancedSettings.showHeader"
          :generated-images="previewImages"
          @generate="handleGenerate"
        />
        
        <OutputTab
          v-show="currentTab === 'output'"
          :output-images="outputImages"
          :output-format="advancedSettings.outputFormat"
          @download="handleDownload"
        />
      </div>
      
      <!-- 詳細設定領域 -->
      <AdvancedSettings
        :replace-rules="replaceRules"
        @rules-changed="handleReplaceRulesChanged"
      />
    </main>
  </div>
</template>

<style scoped>
/* 基本レイアウト */
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  color: #333333;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}

/* ページヘッダー */
.page-header {
  background: linear-gradient(135deg, #007bff, #0056b3);
  border-bottom: 2px solid #004085;
  padding: 16px 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 上部コントロールパネル */
.control-panel {
  background: #ffffff;
  border-bottom: 1px solid #dee2e6;
  padding: 20px;
}

.control-panel-desktop {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  align-items: stretch;
}

.control-panel-desktop .layout-section {
  order: 3;
}

.control-panel-desktop .upload-section {
  order: 1;
}

.control-panel-desktop .format-section {
  order: 2;
}

.control-panel-mobile {
  display: none;
}

.control-tab-buttons {
  display: flex;
  justify-content: center;
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 15px;
}

.control-tab-btn {
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  flex: 0 0 auto;
}

.control-tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.control-tab-btn:hover:not(.active) {
  color: #374151;
  background: #f3f4f6;
}

.control-tab-content {
  height: 160px;
  
  .panel-section {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-sizing: border-box;
  }
}

/* タブレット・モバイル対応 */
@media (max-width: 1200px) and (min-width: 1101px) {
  .control-panel-desktop {
    display: none;
  }
  
  .control-panel-mobile {
    display: flex;
  }
}

@media (max-width: 1100px) {
  .control-panel-desktop {
    display: none;
  }
  
  .control-panel-mobile {
    display: block;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 12px 15px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .control-panel {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 10px;
  }
  
  .panel-section {
    padding: 12px;
  }
  
  .file-grid {
    grid-template-columns: 1fr;
    gap: 3px;
  }
}

@media (max-width: 480px) {
  .control-panel {
    padding: 8px;
  }
  
  .panel-section {
    padding: 10px;
    gap: 8px;
  }
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 10px;
  background: #ffffff;
  color: #212529;
  height: 100%;
  box-sizing: border-box;
}

.upload-section {
  min-height: 80px;
}

.file-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.layout-section {
  text-align: center;
}

.layout-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #212529;
}


.layout-preview {
  margin: 8px 0;
}

.layout-sample-small {
  width: 100%;
  max-width: 320px;
  height: 100px;
  border: 1px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 12px;
  color: #666;
  background: #f9f9f9;
  overflow: hidden;
  position: relative;
}

.layout-title-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.1);
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 24px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

@media (max-width: 768px) {
  .layout-sample-small {
    height: 80px;
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .layout-sample-small {
    height: 60px;
    font-size: 10px;
  }
}

.sample-image {
  width: 100%;
  height: 100%;
  max-width: 400px;
  object-fit: contain;
}

.format-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #212529;
}

.format-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 5px;
  margin-bottom: 3px;
}

@media (max-width: 480px) {
  .format-buttons {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

.control-buttons-section {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  margin-top: 2px;
}

.highlight-toggle-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  color: #212529;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;
  flex: 1;
  max-width: 120px;
}

.highlight-toggle-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.theme-toggle-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  color: #212529;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;
  flex: 1;
  max-width: 120px;
}

.theme-toggle-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.format-btn {
  padding: 8px 6px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  cursor: pointer;
  font-size: 10px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 60px;
}

.format-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.format-label {
  font-weight: 600;
  text-align: center;
}

.format-diagram {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.diagram-separated {
  display: flex;
  gap: 3px;
}

.layer-individual {
  width: 12px;
  height: 10px;
  background: #e0e0e0;
  border: 1px solid #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5px;
  font-weight: bold;
  color: #333;
}

.diagram-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.diagram-vertical .layer-stack {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.diagram-horizontal {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.horizontal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1px;
}

.layer-box {
  width: 16px;
  height: 12px;
  background: #e0e0e0;
  border: 1px solid #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6px;
  font-weight: bold;
  color: #333;
}

.combo-box {
  width: 36px;
  height: 8px;
  background: #333;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5px;
  font-weight: bold;
  border-radius: 1px;
}

.highlight-section {
  text-align: left;
}

.highlight-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #212529;
}

.highlight-buttons {
  display: flex;
  flex-direction: row;
  gap: 8px;
  justify-content: center;
}

.highlight-btn {
  padding: 8px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  flex: 1;
}

.highlight-btn.active {
  border-color: #007bff;
  background: #f0f8ff;
}

.highlight-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.highlight-label {
  font-size: 10px;
  font-weight: 500;
  color: #333;
  text-align: center;
}

.highlight-diagram {
  display: flex;
  gap: 2px;
}

.key-box {
  width: 20px;
  height: 16px;
  background: #f5f5f5;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: bold;
  line-height: 1;
  border-radius: 2px;
}

.key-box.combo-highlight {
  background: #2d3446;
  border-color: #41497e;
  color: #9cdcfe;
  position: relative;
}

.key-box.subtext-highlight {
  background: #e3f2fd;
  border-color: #90caf9;
  color: #1976d2;
}

.combo-marker {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-top: 6px solid #ff6b6b;
}

.key-box small {
  font-size: 6px;
  color: #666;
}

.key-box.combo-highlight small {
  color: #9cdcfe;
}

.key-box.subtext-highlight small {
  color: #1976d2;
}



/* メインワークエリア */
.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.workspace-header {
  background: #ffffff;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #dee2e6;
}

.workspace-nav {
  flex: 1;
}

.tab-buttons {
  display: flex;
  border-bottom: 1px solid #dee2e6;
  margin: 10px 0 15px 0;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  flex: 1;
}

.tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.tab-btn:hover:not(.active):not(:disabled) {
  color: #374151;
  background: #f3f4f6;
}

.tab-btn:disabled,
.tab-btn.disabled {
  background: transparent;
  color: #9ca3af;
  cursor: not-allowed;
  border-bottom-color: transparent;
  opacity: 0.6;
  
  &:hover {
    background: transparent;
    color: #9ca3af;
    border-bottom-color: transparent;
  }
}

.workspace-controls {
  flex-shrink: 0;
}

.dropdown-btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background: white;
  color: #212529;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
}

.workspace-content {
  flex: 1;
  position: relative;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
}

/* エラートースト */
.error-toast {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 50;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px 16px;
  color: #991b1b;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 400px;
}

.error-close {
  background: none;
  border: none;
  color: #991b1b;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
}

/* ワークスペースエリア */
.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.workspace-header {
  background: #ffffff;
  border-bottom: 1px solid #dee2e6;
  padding: 0 20px;
}

.workspace-nav {
  display: flex;
  justify-content: center;
}

.tab-content {
  flex: 1;
}

/* ワークスペース レスポンシブ */
@media (max-width: 768px) {
  .workspace-header {
    padding: 0 10px;
    min-height: 50px;
  }
  
  .tab-btn {
    padding: 12px 16px 10px 16px;
    font-size: 13px;
    min-height: 44px;
    box-sizing: border-box;
  }
}

@media (max-width: 480px) {
  .workspace-header {
    padding: 0 5px;
    min-height: 48px;
  }
  
  .tab-btn {
    padding: 10px 12px 8px 12px;
    font-size: 12px;
    min-height: 40px;
    box-sizing: border-box;
  }
  
  .tab-buttons {
    width: 100%;
    justify-content: center;
  }
}

</style>