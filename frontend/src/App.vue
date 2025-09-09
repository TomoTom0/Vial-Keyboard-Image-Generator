<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import FileUpload from './components/FileUpload.vue'
import FileHistory from './components/FileHistory.vue'
import ColorModeSelector from './components/ColorModeSelector.vue'
import SelectTab from './components/SelectTab.vue'
import PreviewTab from './components/PreviewTab.vue'
import OutputTab from './components/OutputTab.vue'
import { useFileUpload } from './composables/useFileUpload'
import { useImageGeneration, type GenerationOptions } from './composables/useImageGeneration'

// Types
interface RecentFile {
  id: string
  name: string
  timestamp: Date
  file?: File
}

interface AdvancedSettings {
  highlightComboKeys: boolean
  highlightSubtextKeys: boolean
  outputFormat: 'separated' | 'vertical' | 'horizontal'
}

interface LayerSelection {
  [layerId: number]: boolean
}

// Core state
const currentTab = ref<'select' | 'preview' | 'output'>('preview')
const currentFormat = ref<string>('default')
const currentTheme = ref<'light' | 'dark'>('dark')
const selectedFile = ref<File | null>(null)
const selectedDisplayFile = ref<string>('sample')
const recentFiles = ref<RecentFile[]>([])

// Settings
const advancedSettings = ref<AdvancedSettings>({
  highlightComboKeys: false,
  highlightSubtextKeys: false,
  outputFormat: 'separated'
})

const layerSelection = ref<LayerSelection>({
  0: true,
  1: true,
  2: true,
  3: true
})

// Preview and output data
const previewImages = ref<any[]>([])
const outputImages = ref<any[]>([])
const isGenerating = ref(false)
const error = ref<string | null>(null)

// Composables
const {
  currentFile,
  hasFile,
  setFile,
  validateFile
} = useFileUpload()

const {
  images,
  generateImages,
  clearError
} = useImageGeneration()

// Computed
const availableFiles = computed(() => {
  const files = ['sample']
  if (selectedFile.value) {
    files.push(selectedFile.value.name)
  }
  recentFiles.value.forEach(file => {
    if (!files.includes(file.name)) {
      files.push(file.name)
    }
  })
  return files
})

// File handling
const handleFileSelected = (file: File) => {
  const validationError = validateFile(file)
  if (validationError) {
    error.value = validationError
    return
  }
  
  selectedFile.value = file
  setFile(file)
  
  addToRecentFiles(file)
  selectedDisplayFile.value = file.name
  generatePreviewImages()
  
  console.log('📁 File selected:', file.name)
}

const handleFileHistorySelected = (recentFile: RecentFile) => {
  if (recentFile.file) {
    selectedFile.value = recentFile.file
    setFile(recentFile.file)
    selectedDisplayFile.value = recentFile.name
    generatePreviewImages()
  }
}

const addToRecentFiles = (file: File) => {
  const newFile: RecentFile = {
    id: Date.now().toString(),
    name: file.name,
    timestamp: new Date(),
    file: file
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
  generatePreviewImages()
}

const handleAdvancedSettingsChanged = (settings: AdvancedSettings) => {
  advancedSettings.value = settings
  generatePreviewImages()
}

const updateOutputFormat = (format: 'separated' | 'vertical' | 'horizontal') => {
  advancedSettings.value.outputFormat = format
  generatePreviewImages()
}

const toggleComboHighlight = () => {
  advancedSettings.value.highlightComboKeys = !advancedSettings.value.highlightComboKeys
  generatePreviewImages()
}

const toggleSubtextHighlight = () => {
  advancedSettings.value.highlightSubtextKeys = !advancedSettings.value.highlightSubtextKeys
  generatePreviewImages()
}

const getFormatExplanationImage = (): string => {
  const format = advancedSettings.value.outputFormat
  return `/images/explanations/format-${format}.png`
}

// Tab navigation
const handleTabChanged = (tab: 'select' | 'preview' | 'output') => {
  currentTab.value = tab
}

const handleDisplayFileChanged = (fileName: string) => {
  selectedDisplayFile.value = fileName
  generatePreviewImages()
}

// Layer selection
const handleLayerSelectionChanged = (selection: LayerSelection) => {
  layerSelection.value = selection
  generatePreviewImages()
}

// Preview generation
const generatePreviewImages = async () => {
  try {
    isGenerating.value = true
    error.value = null
    
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
    } else if (selectedFile.value) {
      // アップロードされたファイルの場合
      // TODO: クライアントサイドで.vilファイルを処理
      previewImages.value = await generatePreviewImagesForFile(selectedFile.value)
    }
    
  } catch (err) {
    console.error('Preview generation failed:', err)
    error.value = err instanceof Error ? err.message : 'Preview generation failed'
  } finally {
    isGenerating.value = false
  }
}

const generatePreviewImagesForFile = async (file: File) => {
  // TODO: クライアントサイドで.vilファイルを解析してCanvasで描画
  // 今はプレースホルダーを返す
  return [
    {
      id: 'uploaded-layer-0',
      layer: 0,
      url: '', // 空のURLでプレースホルダー表示
      type: 'layer'
    }
  ]
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
  if (!selectedFile.value) return
  
  try {
    isGenerating.value = true
    error.value = null
    
    const options: GenerationOptions = {
      theme: currentTheme.value,
      format: advancedSettings.value.outputFormat as any,
      layerRange: getSelectedLayerRange(),
      showComboInfo: advancedSettings.value.highlightComboKeys,
      imageOptions: {
        generatePreview: true,
        previewMaxWidth: 400,
        previewQuality: 0.7,
        fullQuality: 1.0,
        fullFormat: 'png'
      }
    }
    
    await generateImages(selectedFile.value, options)
    outputImages.value = images.value
    currentTab.value = 'output'
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Generation failed'
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
      timestamp: f.timestamp.toISOString()
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

// Initialization
onMounted(() => {
  loadRecentFiles()
  // 初期表示時にサンプルのプレビューを生成
  generatePreviewImages()
})
</script>

<template>
  <div class="app">
    <!-- 上部コントロールパネル -->
    <header class="control-panel">
      <div class="panel-section upload-section">
        <FileUpload
          @file-selected="handleFileSelected"
          @error="handleError"
        />
        <FileHistory
          :recent-files="recentFiles"
          :selected-file="selectedFile"
          @file-selected="handleFileHistorySelected"
        />
      </div>
      
      <div class="panel-section layout-section">
        <div class="layout-title">layout title</div>
        <div class="layout-preview">
          <div class="layout-sample-small">
            <span>layout sample small image</span>
          </div>
        </div>
        <ColorModeSelector
          :current-theme="currentTheme"
          @theme-changed="handleThemeChanged"
        />
      </div>
      
      <div class="panel-section format-section">
        <div class="format-title">Format</div>
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
          <button :class="['format-btn', { active: advancedSettings.outputFormat === 'horizontal' }]" @click="updateOutputFormat('horizontal')">
            <span class="format-label">Horizontal</span>
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
        <div class="highlight-section">
          <div class="highlight-title">Highlight</div>
          <div class="highlight-buttons">
            <button :class="['highlight-btn', { active: advancedSettings.highlightComboKeys }]" @click="toggleComboHighlight">
              <div class="highlight-content">
                <span class="highlight-label">Combo Input</span>
                <div class="highlight-diagram">
                  <div class="key-box combo-highlight">
                    <div class="combo-marker"></div>
                    J
                  </div>
                  <div class="key-box">K</div>
                  <div class="key-box combo-highlight">
                    <div class="combo-marker"></div>
                    L
                  </div>
                </div>
              </div>
            </button>
            <button :class="['highlight-btn', { active: advancedSettings.highlightSubtextKeys }]" @click="toggleSubtextHighlight">
              <div class="highlight-content">
                <span class="highlight-label">Has Subtext</span>
                <div class="highlight-diagram">
                  <div class="key-box subtext-highlight">A<br><small>α</small></div>
                  <div class="key-box">S</div>
                  <div class="key-box subtext-highlight">D<br><small>δ</small></div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- メインワークエリア -->
    <main class="workspace">
      <div class="workspace-header">
        <div class="workspace-nav">
          <div class="tab-buttons">
            <button :class="['tab-btn', { active: currentTab === 'select' }]" @click="currentTab = 'select'">Select</button>
            <button :class="['tab-btn', { active: currentTab === 'preview' }]" @click="currentTab = 'preview'">Preview</button>
            <button :class="['tab-btn', { active: currentTab === 'output' }]" @click="currentTab = 'output'">Output</button>
          </div>
        </div>
        <div class="workspace-controls">
          <button class="dropdown-btn">Dropdown button ▼</button>
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
          @layer-selection-changed="handleLayerSelectionChanged"
        />
        
        <PreviewTab
          v-show="currentTab === 'preview'"
          :preview-images="previewImages"
          :is-generating="isGenerating"
          :output-format="advancedSettings.outputFormat"
          :theme="currentTheme"
          @generate="handleGenerate"
        />
        
        <OutputTab
          v-show="currentTab === 'output'"
          :output-images="outputImages"
          @download="handleDownload"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 基本レイアウト */
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  color: #333333;
}

/* 上部コントロールパネル */
.control-panel {
  background: #ffffff;
  border-bottom: 1px solid #dee2e6;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 15px;
  background: #ffffff;
  color: #212529;
}

.upload-section {
  min-height: 200px;
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
  margin: 15px 0;
}

.layout-sample-small {
  width: 200px;
  height: 100px;
  border: 1px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 12px;
  color: #666;
  background: #f9f9f9;
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
  margin-bottom: 15px;
}

.format-btn {
  padding: 8px 6px;
  border: 1px solid #ddd;
  background: white;
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
  gap: 0;
}

.tab-btn {
  padding: 8px 20px;
  border: 1px solid #ccc;
  background: #f9f9f9;
  color: #212529;
  cursor: pointer;
  font-size: 14px;
  margin-right: -1px;
}

.tab-btn:first-child {
  border-radius: 4px 0 0 4px;
}

.tab-btn:last-child {
  border-radius: 0 4px 4px 0;
}

.tab-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
  z-index: 1;
  position: relative;
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
  overflow: auto;
  background: #f5f5f5;
  padding: 0;
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

</style>