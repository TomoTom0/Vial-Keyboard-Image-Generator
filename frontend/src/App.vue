<script setup lang="ts">
import { onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import Sidebar from './components/Sidebar.vue'
import SelectTab from './components/SelectTab.vue'
import PreviewTab from './components/PreviewTab.vue'
import OutputTab from './components/OutputTab.vue'
import Toast from './components/Toast.vue'
import { useVialStore } from './stores/vial'
import { useSettingsStore } from './stores/settings'
import { useUiStore } from './stores/ui'
import { useImagesStore } from './stores/images'
import type { ReplaceRule } from './utils/types'

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

// Store instances
const vialStore = useVialStore()
const settingsStore = useSettingsStore()
const uiStore = useUiStore()
const imagesStore = useImagesStore()

// 現在の言語表示を取得
const getCurrentLanguageDisplay = (): string => {
  const language = settingsStore.keyboardLanguage
  switch (language) {
    case 'japanese':
      return 'Japanese'
    case 'english':
      return 'English'
    default:
      return 'Japanese'
  }
}

// Debounced preview generation
let generateTimeout: NodeJS.Timeout | null = null
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








// Tab navigation
const handleTabChanged = (tab: 'select' | 'preview' | 'output') => {
  // Outputタブは画像生成完了後のみ選択可能
  if (tab === 'output' && !uiStore.isGenerated) {
    return
  }
  uiStore.setActiveTab(tab)
}


// Preview generation (delegated to ImagesStore)
const generatePreviewImages = async () => {
  await imagesStore.generatePreviewImages(
    vialStore.selectedVialId || 'sample', 
    vialStore.currentVial
  )
}


// ファイル操作関数
const hasSelectedFile = computed(() => {
  return vialStore.selectedVialId && vialStore.selectedVialId !== 'sample'
})


// ナビゲーション状態管理はUiStoreで行う
const switchNavSection = (section: 'files' | 'generate' | 'settings') => {
  uiStore.setSidebarSection(section)
}

const downloadSelectedFile = () => {
  if (!hasSelectedFile.value) return
  
  const selectedFile = vialStore.vialFiles.find(f => f.id === vialStore.selectedVialId)
  if (selectedFile) {
    const jsonString = JSON.stringify(selectedFile.config, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = selectedFile.name.endsWith('.vil') ? selectedFile.name : `${selectedFile.name}.vil`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

const deleteSelectedFile = () => {
  if (!hasSelectedFile.value) return
  
  if (confirm('Are you sure you want to delete this file?')) {
    vialStore.removeVialData(vialStore.selectedVialId!)
    vialStore.selectVial('sample')
  }
}

// Generate セクション関数

const getFormatName = () => {
  const format = settingsStore.outputFormat
  switch (format) {
    case 'separated': return 'Separated'
    case 'vertical': return 'Vertical'
    case 'rectangular': return 'Rectangular'
    default: return 'Separated'
  }
}

const cycleFormat = (direction: number) => {
  settingsStore.cycleOutputFormat(direction)
  debouncedGeneratePreview()
}


const toggleDarkMode = () => {
  settingsStore.toggleDarkMode(!settingsStore.enableDarkMode)
  debouncedGeneratePreview()
}

const switchTab = (tab: 'select' | 'preview') => {
  uiStore.setActiveTab(tab)
}

// ハイライト切り替え（矢印ナビ用）
const cycleHighlight = (direction: number) => {
  settingsStore.toggleHighlight()
  debouncedGeneratePreview()
}

// カラーモード切り替え（矢印ナビ用）
const cycleDarkMode = (direction: number) => {
  settingsStore.toggleDarkMode(!settingsStore.enableDarkMode)
  debouncedGeneratePreview()
}



// Initialization
// タブ変更時にハッシュを更新
watch(() => uiStore.activeTab, (newTab) => {
  updateHash(newTab)
})


// 選択されたVILファイルの変更時に画像を再生成
watch(() => vialStore.selectedVialId, (newId) => {
  if (newId) {
    generatePreviewImages()
  }
})

// 高度な設定の変更をlocalStorageに保存し、画像を再生成
watch(() => settingsStore.outputFormat, () => {
  generatePreviewImages()
})



// ハッシュ変更を監視してタブを同期
const handleHashChange = () => {
  const newTab = getInitialTabFromHash()
  if (newTab !== uiStore.activeTab) {
    uiStore.setActiveTab(newTab)
  }
}

onMounted(() => {
  // Piniaのpersist pluginで自動ロードされるため、手動初期化は不要
  
  // Piniaのpersist機能により自動復元されるため、手動読み込み削除
  
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
  
  // ハッシュ変更イベントリスナーを削除
  window.removeEventListener('hashchange', handleHashChange)
})
</script>

<template>
  <div class="app">
    <!-- ページヘッダー -->
    <header class="page-header" :class="{ 'sample-mode': !vialStore.selectedVialId || vialStore.selectedVialId === 'sample' }">
      <div class="header-filename">
        <div class="filename-text">{{ vialStore.selectedFileName || 'sample' }}</div>
        <div class="language-text">{{ getCurrentLanguageDisplay() }}</div>
      </div>
      <h1 class="page-title">YTomo Vial Keyboard Image Generator</h1>
      <div class="header-spacer"></div>
    </header>
    
    <!-- メインレイアウトエリア -->
    <div class="main-layout">
      <!-- サイドバー -->
      <Sidebar />
    
    
      <!-- メインコンテンツエリア -->
      <div class="main-content">
        <!-- メインワークエリア -->
        <main class="workspace">
      
      <div class="workspace-content">
        <div v-if="uiStore.error" class="error-toast">
          {{ uiStore.error }}
          <button @click="uiStore.setError(null)" class="error-close">&times;</button>
        </div>
        
        <!-- ワークスペース上部のコントロール -->
        <div class="workspace-controls">
          <!-- タブ選択 -->
          <div class="workspace-tab-selector">
            <button 
              class="workspace-tab-btn" 
              :class="{ active: uiStore.activeTab === 'select' }"
              @click="uiStore.setActiveTab('select')"
            >
              Select
            </button>
            <button 
              class="workspace-tab-btn" 
              :class="{ active: uiStore.activeTab === 'preview' }"
              @click="uiStore.setActiveTab('preview')"
            >
              Preview
            </button>
          </div>
          
          <!-- Generateボタン -->
          <div class="workspace-generate">
            <button 
              class="workspace-generate-btn"
              :disabled="selectedFile === 'sample'"
              @click="imagesStore.generateFinalOutputImages"
            >
              Generate
            </button>
          </div>
        </div>
        
        <SelectTab
          v-show="uiStore.activeTab === 'select'"
        />
        
        <PreviewTab
          v-show="uiStore.activeTab === 'preview'"
        />
        
        <OutputTab
          v-show="uiStore.activeTab === 'output'"
        />
      </div>
      
        </main>
      </div> <!-- main-content end -->
    </div> <!-- main-layout end -->
  </div> <!-- app end -->

  <!-- トースト通知 -->
  <Toast
    v-for="toast in uiStore.toasts"
    :key="toast.id"
    :type="toast.type"
    :title="toast.title"
    :message="toast.message"
    @close="uiStore.removeToast(toast.id)"
  />
</template>

<style scoped lang="scss">
/* 基本レイアウト */
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column; /* ヘッダーを上部に配置 */
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  color: #333333;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}

/* ページヘッダー */
.page-header {
  background: linear-gradient(135deg, #007bff 0%, #004085 100%);
  padding: 12px 20px;
  border-bottom: 1px solid #dee2e6;
  position: relative;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-header.sample-mode {
  background: linear-gradient(135deg, #6c757d 0%, #007bff 30%, #004085 100%);
}

.header-filename {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 60px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.filename-text {
  font-weight: 600;
  font-size: 16px;
}

.language-text {
  font-weight: 400;
  font-size: 11px;
  opacity: 0.8;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.header-spacer {
  min-width: 60px;
}

/* メインレイアウトエリア */
.main-layout {
  display: flex;
  flex-direction: row; /* サイドバーとメインコンテンツを横並びに */
  flex: 1;
}


/* メインコンテンツエリア */
.main-content {
  flex: 1; /* 残りの幅を使用 */
  display: flex;
  flex-direction: column;
  height: auto;
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
  font-size: 12px;
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
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 12px;
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
  background: #f5f5f5;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
}

/* ワークスペース上部のコントロール */
.workspace-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  margin: 0;
}

.workspace-tab-selector {
  display: flex;
  gap: 0;
}

.workspace-tab-btn {
  background: none;
  border: none;
  font-size: 14px;
  font-weight: bold;
  color: #495057;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 2px;
  transition: background 0.2s;
  min-width: 50px;
  height: 32px;
  flex: 1;

  &:hover {
    background: #e9ecef;
  }

  &.active {
    background: #007bff;
    color: white;
  }
}

.workspace-generate {
  display: flex;
  align-items: center;
}

.workspace-generate-btn {
  padding: 8px 12px;
  background: #28a745;
  border: none;
  border-radius: 3px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  box-sizing: border-box;
  text-align: center;

  &:hover:not(:disabled) {
    background: #218838;
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
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
  .page-header {
    padding: 10px 15px;
  }
  
  .page-title {
    font-size: 20px;
    position: static;
    transform: none;
    text-align: right;
    flex: 1;
  }
  
  .header-filename {
    font-size: 14px;
    padding: 4px 8px;
  }
  
  .header-spacer {
    display: none;
  }
  
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
  .page-header {
    padding: 8px 10px;
  }
  
  .page-title {
    font-size: 18px;
    position: static;
    transform: none;
    text-align: right;
    flex: 1;
  }
  
  .header-filename {
    font-size: 12px;
    padding: 3px 6px;
  }
  
  .header-spacer {
    display: none;
  }
  
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