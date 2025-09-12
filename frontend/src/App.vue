<script setup lang="ts">
import { onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import FileUpload from './components/FileUpload.vue'
import FileHistory from './components/FileHistory.vue'
import SelectTab from './components/SelectTab.vue'
import PreviewTab from './components/PreviewTab.vue'
import OutputTab from './components/OutputTab.vue'
import AdvancedSettings from './components/AdvancedSettings.vue'
import Toast from './components/Toast.vue'
import { useVialStore } from './stores/vial'
import { useSettingsStore } from './stores/settings'
import { useUiStore } from './stores/ui'
import { useImagesStore } from './stores/images'
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





const updateOutputFormat = (format: 'separated' | 'vertical' | 'rectangular') => {
  settingsStore.outputFormat = format
  generatePreviewImages()
}

const toggleHighlight = () => {
  settingsStore.highlightEnabled = !settingsStore.highlightEnabled
  debouncedGeneratePreview()
}

const toggleCombos = () => {
  settingsStore.showCombos = !settingsStore.showCombos
  debouncedGeneratePreview()
}

// Tab navigation
const handleTabChanged = (tab: 'select' | 'preview' | 'output') => {
  // Outputタブは画像生成完了後のみ選択可能
  if (tab === 'output' && !uiStore.isGenerated) {
    return
  }
  uiStore.setActiveTab(tab)
}

// Control panel tab handling
const handleControlPanelTabChanged = (tab: 'layout' | 'upload' | 'format') => {
  uiStore.setControlPanelTab(tab)
}

// Preview generation (delegated to ImagesStore)
const generatePreviewImages = async () => {
  await imagesStore.generatePreviewImages(
    vialStore.selectedVialId || 'sample', 
    vialStore.currentVial
  )
}

// サンプル画像のオーバーレイ表示は常にCorne v4（キーボード構造の表示）
const layoutTitle = computed(() => {
  return 'Corne v4'
})

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
              <div class="layout-title-overlay">{{ layoutTitle }}</div>
            </div>
          </div>
        </div>
        
        <div class="panel-section upload-section">
          <div class="file-grid">
            <FileUpload />
            <FileHistory />
          </div>
        </div>
        
        <div class="panel-section format-section">
          <div class="format-buttons">
            <button :class="['format-btn', { active: settingsStore.outputFormat === 'separated' }]" @click="updateOutputFormat('separated')">
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
            <button :class="['format-btn', { active: settingsStore.outputFormat === 'vertical' }]" @click="updateOutputFormat('vertical')">
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
            <button :class="['format-btn', { active: settingsStore.outputFormat === 'rectangular' }]" @click="updateOutputFormat('rectangular')">
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
            <button :class="['highlight-toggle-btn', { active: settingsStore.highlightEnabled }]" @click="toggleHighlight">
              Highlight {{ settingsStore.highlightEnabled ? 'on' : 'off' }}
            </button>
            <button 
              :class="['theme-toggle-btn', { active: settingsStore.enableDarkMode }]" 
              @click="settingsStore.toggleDarkMode(!settingsStore.enableDarkMode); debouncedGeneratePreview()"
            >
              {{ settingsStore.enableDarkMode ? 'Dark' : 'Light' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- モバイル表示（タブ切り替え） -->
      <div class="control-panel-mobile">
        <div class="control-tab-buttons">
          <button :class="['control-tab-btn', { active: uiStore.controlPanelTab === 'upload' }]" @click="handleControlPanelTabChanged('upload')">
            Files
          </button>
          <button :class="['control-tab-btn', { active: uiStore.controlPanelTab === 'format' }]" @click="handleControlPanelTabChanged('format')">
            Settings
          </button>
          <button :class="['control-tab-btn', { active: uiStore.controlPanelTab === 'layout' }]" @click="handleControlPanelTabChanged('layout')">
            Layout
          </button>
        </div>
        
        <div class="control-tab-content">
          <div v-show="uiStore.controlPanelTab === 'layout'" class="panel-section layout-section">
            <div class="layout-preview">
              <div class="layout-sample-small">
                <img src="/assets/sample/keyboard/dark/0-0/layer0-low.png" alt="Layout sample" class="sample-image" />
                <div class="layout-title-overlay">{{ layoutTitle }}</div>
              </div>
            </div>
          </div>
          
          <div v-show="uiStore.controlPanelTab === 'upload'" class="panel-section upload-section">
            <div class="file-grid">
              <FileUpload />
              <FileHistory />
            </div>
          </div>
          
          <div v-show="uiStore.controlPanelTab === 'format'" class="panel-section format-section">
            <div class="format-buttons">
              <button :class="['format-btn', { active: settingsStore.outputFormat === 'separated' }]" @click="updateOutputFormat('separated')">
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
              <button :class="['format-btn', { active: settingsStore.outputFormat === 'vertical' }]" @click="updateOutputFormat('vertical')">
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
              <button :class="['format-btn', { active: settingsStore.outputFormat === 'rectangular' }]" @click="updateOutputFormat('rectangular')">
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
              <button :class="['highlight-toggle-btn', { active: settingsStore.highlightEnabled }]" @click="toggleHighlight">
                Highlight {{ settingsStore.highlightEnabled ? 'on' : 'off' }}
              </button>
              <button 
                :class="['theme-toggle-btn', { active: settingsStore.enableDarkMode }]" 
                @click="settingsStore.toggleDarkMode(!settingsStore.enableDarkMode); debouncedGeneratePreview()"
              >
                {{ settingsStore.enableDarkMode ? 'Dark' : 'Light' }}
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
            <button :class="['tab-btn', { active: uiStore.activeTab === 'select' }]" @click="handleTabChanged('select')">Select</button>
            <button :class="['tab-btn', { active: uiStore.activeTab === 'preview' }]" @click="handleTabChanged('preview')">Preview</button>
            <button :class="['tab-btn', { active: uiStore.activeTab === 'output', disabled: !uiStore.isGenerated }]" @click="handleTabChanged('output')" :disabled="!uiStore.isGenerated">Output</button>
          </div>
        </div>
      </div>
      
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
      
      <!-- 詳細設定領域 -->
      <AdvancedSettings />
    </main>
  </div>

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
    grid-template-columns: 1fr 1fr;
    gap: 6px;
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
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 8px;
  align-items: start;
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