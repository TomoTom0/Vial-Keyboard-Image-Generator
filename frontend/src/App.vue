<script setup lang="ts">
import { onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import FileUpload from './components/FileUpload.vue'
import FileHistory from './components/FileHistory.vue'
import SelectTab from './components/SelectTab.vue'
import PreviewTab from './components/PreviewTab.vue'
import OutputTab from './components/OutputTab.vue'
import KeyboardTab from './components/KeyboardTab.vue'
import ReplaceTab from './components/ReplaceTab.vue'
import Toast from './components/Toast.vue'
import { useVialStore } from './stores/vial'
import { useSettingsStore } from './stores/settings'
import { useUiStore } from './stores/ui'
import { useImagesStore } from './stores/images'
import type { ReplaceRule } from './utils/types'
import { getCurrentKeyboardLanguage, setCurrentKeyboardLanguage } from './utils/keyboardConfig'

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
const selectedFile = computed(() => vialStore.selectedVialId)

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


const handleGenerate = async () => {
  await imagesStore.generateFinalOutputImages()
}

// Replace Rules変更ハンドラー
const handleReplaceRulesChanged = (rules: ReplaceRule[]) => {
  console.log('🔄 Replace rules changed:', rules)
  settingsStore.setReplaceRules(rules)
  
  // プレビュー画像を再生成
  if (vialStore.selectedVialId && vialStore.selectedVialId !== 'sample') {
    console.log('🔄 Regenerating preview images due to replace rules change')
    debouncedGeneratePreview()
  }
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
      <div class="header-filename">{{ vialStore.selectedFileName || 'sample' }}</div>
      <h1 class="page-title">YTomo Vial Keyboard Image Generator</h1>
      <div class="header-spacer"></div>
    </header>
    
    <!-- メインレイアウトエリア -->
    <div class="main-layout">
      <!-- サイドバー -->
      <aside class="sidebar">
      <!-- 細長い左側領域 -->
      <div class="sidebar-narrow">
        <div class="nav-items">
          <div 
            :class="['nav-item', { active: uiStore.sidebarSection === 'files' }]" 
            title="Files"
            @click="switchNavSection('files')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </div>
          <div 
            :class="['nav-item', { active: uiStore.sidebarSection === 'generate' }]" 
            title="Generate & Settings"
            @click="switchNavSection('generate')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
            </svg>
          </div>
          <div 
            :class="['nav-item', { active: uiStore.sidebarSection === 'settings' }]" 
            title="Settings"
            @click="switchNavSection('settings')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <!-- メインサイドバーコンテンツ -->
      <div class="sidebar-main">
        <div class="sidebar-content">
          <!-- ファイル領域（Files選択時のみ表示） -->
          <div v-show="uiStore.sidebarSection === 'files'" class="sidebar-section file-section">
            <div class="file-header">
              <h3 class="sidebar-section-title">
                Files
                <span class="selected-file-name">{{ selectedFileName }}</span>
              </h3>
            </div>
            
            <!-- ファイル領域のメインコンテンツ -->
            <div class="file-controls">
              <div class="file-actions-row">
                <FileUpload />
                <button 
                  class="action-btn download-btn" 
                  :disabled="!hasSelectedFile"
                  @click="downloadSelectedFile"
                  title="Download selected file"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
                <button 
                  class="action-btn delete-btn" 
                  :disabled="!hasSelectedFile"
                  @click="deleteSelectedFile"
                  title="Delete selected file"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </button>
              </div>
              <FileHistory />
            </div>
          </div>
          
          <!-- 画像生成・設定領域（Generate選択時のみ表示） -->
          <div v-show="uiStore.sidebarSection === 'generate'" class="sidebar-section generate-section">
            <div class="generate-header">
              <h3 class="sidebar-section-title">Generate</h3>
            </div>
            <div class="generate-controls">
            <!-- フォーマット選択 -->
            <div class="format-selector">
              <button class="format-nav-btn" @click="cycleFormat(-1)">‹</button>
              <div class="format-current">
                <div class="format-icon">
                  <svg v-if="settingsStore.outputFormat === 'separated'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="6" height="6"/>
                    <rect x="15" y="3" width="6" height="6"/>
                    <rect x="3" y="15" width="6" height="6"/>
                    <rect x="15" y="15" width="6" height="6"/>
                  </svg>
                  <svg v-else-if="settingsStore.outputFormat === 'vertical'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="6" y="2" width="12" height="4"/>
                    <rect x="6" y="8" width="12" height="4"/>
                    <rect x="6" y="14" width="12" height="4"/>
                    <rect x="6" y="20" width="12" height="2"/>
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="6" width="8" height="4"/>
                    <rect x="14" y="6" width="8" height="4"/>
                    <rect x="2" y="12" width="8" height="4"/>
                    <rect x="14" y="12" width="8" height="4"/>
                  </svg>
                </div>
                <span class="format-name">{{ getFormatName() }}</span>
              </div>
              <button class="format-nav-btn" @click="cycleFormat(1)">›</button>
            </div>

            <!-- ハイライト設定 -->
            <div class="format-selector">
              <button class="format-nav-btn" @click="cycleHighlight(-1)">‹</button>
              <div class="format-current">
                <span class="format-name">Highlight {{ settingsStore.highlightEnabled ? 'ON' : 'OFF' }}</span>
              </div>
              <button class="format-nav-btn" @click="cycleHighlight(1)">›</button>
            </div>
            <!-- カラーモード設定 -->
            <div class="format-selector">
              <button class="format-nav-btn" @click="cycleDarkMode(-1)">‹</button>
              <div class="format-current">
                <span class="format-name">{{ settingsStore.enableDarkMode ? 'Dark' : 'Light' }}</span>
              </div>
              <button class="format-nav-btn" @click="cycleDarkMode(1)">›</button>
            </div>

            <!-- Label入力欄 -->
            <div class="label-input-container">
              <label class="label-input-label">Label</label>
              <input 
                type="text"
                class="label-input"
                v-model="settingsStore.outputLabel"
                :placeholder="vialStore.selectedFileName || 'sample'"
              />
            </div>
            
            <!-- タブ選択 -->
            <div class="format-selector">
              <button 
                class="format-nav-btn tab-button" 
                :class="{ active: uiStore.activeTab === 'select' }"
                @click="uiStore.setActiveTab('select')"
              >
                Select
              </button>
              <button 
                class="format-nav-btn tab-button" 
                :class="{ active: uiStore.activeTab === 'preview' }"
                @click="uiStore.setActiveTab('preview')"
              >
                Preview
              </button>
            </div>
            
            <!-- Generateボタン -->
            <div class="generate-button-container">
              <button 
                class="generate-btn-full"
                :disabled="selectedFile === 'sample'"
                @click="handleGenerate"
              >
                Generate
              </button>
            </div>
            </div>
          </div>
          
          <!-- 詳細設定領域（Settings選択時のみ表示） -->
          <div v-show="uiStore.sidebarSection === 'settings'" class="sidebar-section settings-section">
            <div class="settings-header">
              <h3 class="sidebar-section-title">Settings</h3>
            </div>
            <div class="settings-content">
              <!-- Layout設定 -->
              <div class="settings-group">
                <h4 class="settings-group-title">Layout</h4>
                <KeyboardTab :selected-file="vialStore.selectedVialId" />
              </div>
              
              <!-- Replace設定 -->
              <div class="settings-group">
                <h4 class="settings-group-title">Replace Rules</h4>
                <ReplaceTab 
                  :replace-rules="settingsStore.replaceRules"
                  @rules-changed="handleReplaceRulesChanged"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
    
      <!-- メインコンテンツエリア -->
      <div class="main-content">
        <!-- メインワークエリア -->
        <main class="workspace">
      
      <div class="workspace-content">
        <div v-if="uiStore.error" class="error-toast">
          {{ uiStore.error }}
          <button @click="uiStore.setError(null)" class="error-close">&times;</button>
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

/* サイドバー */
.sidebar {
  width: 250px;
  height: auto;
  background: #ffffff;
  border-right: 1px solid #e0e0e0;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0; /* サイドバーの幅を固定 */
  display: flex;
  flex-direction: row;
}

/* 細長い左側領域 */
.sidebar-narrow {
  width: 40px;
  height: 100%; /* サイドバー全体の高さを使用 */
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  flex-shrink: 0;
}

/* ナビゲーションアイテム */
.nav-items {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  gap: 5px;
}

.nav-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6c757d;
  position: relative;
}

.nav-item:hover {
  background: #e9ecef;
  color: #495057;
}

.nav-item.active {
  background: #007bff;
  color: #ffffff;
}

.nav-item.active:hover {
  background: #0056b3;
}

/* メインサイドバーコンテンツ */
.sidebar-main {
  flex: 1;
  height: auto;
}

.sidebar-content {
  padding: 20px;
  height: auto;
}

.sidebar-section {
  margin-bottom: 30px;
}

.file-header,
.generate-header,
.settings-header {
  background: #f8f9fa;
  margin: -20px -20px 15px -20px;
  padding: 12px 20px;
  border-bottom: 1px solid #e9ecef;
}

.sidebar-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
  padding-bottom: 0;
  border-bottom: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-header .sidebar-section-title,
.generate-header .sidebar-section-title,
.settings-header .sidebar-section-title {
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
}

.selected-file-name {
  font-size: 14px;
  font-weight: 400;
  color: #666;
  background: #f8f9fa;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.file-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-actions-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  padding: 8px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
  color: #333;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #007bff;
  color: #007bff;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8f9fa;
  color: #999;
}

.download-btn:hover:not(:disabled) {
  background: #e3f2fd;
  border-color: #2196f3;
  color: #2196f3;
}

.delete-btn:hover:not(:disabled) {
  background: #ffebee;
  border-color: #f44336;
  color: #f44336;
}

/* Generate section styles */
.generate-section {
  margin-bottom: 0;
}

/* Settings section styles */
.settings-section {
  margin-bottom: 0;
}

.settings-header {
  background: #f8f9fa;
  margin: -20px -20px 15px -20px;
  padding: 12px 20px;
  border-bottom: 1px solid #e9ecef;
}

.settings-content {
  padding: 0;
  max-width: 170px; /* ナビ部分40px + サイドバーパディング左右40px(20px×2)を除いた実際の利用可能幅 */
  box-sizing: border-box;
  overflow: hidden;
}

.settings-group {
  margin-bottom: 15px;
  padding: 0;
  box-sizing: border-box;
  max-width: 170px;
  overflow: hidden;
}

.settings-group:last-child {
  margin-bottom: 0;
}

.settings-group-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  padding: 6px 0 3px 0;
  border-bottom: 1px solid #e9ecef;
}

.generate-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: -20px -20px 0 -20px;
  padding: 10px 8px;
  box-sizing: border-box;
  overflow: hidden;
  max-width: 210px; /* ナビ部分40pxを除いた実際の利用可能幅 */
}

/* Format selector */
.format-selector {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 3px;
  padding: 3px;
  gap: 1px;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
}

.format-nav-btn {
  background: none;
  border: none;
  font-size: 14px;
  font-weight: bold;
  color: #495057;
  cursor: pointer;
  padding: 1px;
  border-radius: 2px;
  transition: background 0.2s;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #e9ecef;
  }

  &.active {
    background: #007bff;
    color: white;
  }

  // タブボタンの場合は幅を自動調整
  &.tab-button {
    width: auto;
    padding: 8px 12px;
    min-width: 50px;
    height: 32px;
    flex: 1;
  }
}

.format-current {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  justify-content: center;
  min-width: 0;
}

.format-icon {
  color: #007bff;
  flex-shrink: 0;
}

.format-icon svg {
  width: 12px;
  height: 12px;
}

.format-name {
  font-weight: 500;
  font-size: 12px;
  color: #495057;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}



/* Label input container */
.label-input-container {
  margin-top: 15px;
  max-width: 210px;
  position: relative;
}

.label-input-label {
  display: block;
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.label-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  color: black;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.label-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
}

.label-input::placeholder {
  color: #9ca3af;
}

/* Generate button container */
.generate-button-container {
  display: flex;
  width: 100%;
  max-width: 210px;
  box-sizing: border-box;
}

.generate-btn-full {
  width: 100%;
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
}

.generate-btn-full:hover:not(:disabled) {
  background: #218838;
}

.generate-btn-full:disabled {
  background: #6c757d;
  cursor: not-allowed;
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