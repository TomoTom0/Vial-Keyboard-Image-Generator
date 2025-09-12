<template>
  <aside class="sidebar">
    <!-- 細長い左側領域 -->
    <div class="sidebar-narrow">
      <div class="nav-items">
        <div 
          :class="['nav-item', { active: uiStore.sidebarSection === 'files' }]" 
          title="Files"
          @click="switchNavSection('files')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div 
          :class="['nav-item', { active: uiStore.sidebarSection === 'generate' }]" 
          title="Generate"
          @click="switchNavSection('generate')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
          </svg>
        </div>
        <div 
          :class="['nav-item', { active: uiStore.sidebarSection === 'settings' }]" 
          title="Settings"
          @click="switchNavSection('settings')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- メインサイドバーコンテンツ -->
    <div class="sidebar-main">
      <div class="sidebar-content">
        
        <!-- ファイル選択領域（Files選択時のみ表示） -->
        <div v-show="uiStore.sidebarSection === 'files'" class="sidebar-section files-section">
          <div class="file-header">
            <h3 class="sidebar-section-title">Files</h3>
          </div>
          
          <div class="file-content">
            <div class="file-upload-section">
              <FileUpload ref="fileUpload" />
              <div class="file-quick-actions">
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
            <div class="format-group">
              <label class="format-label">Output Format</label>
              <div class="format-nav">
                <button class="format-nav-btn" @click="cycleFormat(-1)">‹</button>
                <div class="format-current">
                  <span class="format-name">{{ formatDisplayName }}</span>
                </div>
                <button class="format-nav-btn" @click="cycleFormat(1)">›</button>
              </div>
            </div>
          </div>

          <!-- ハイライト設定 -->
          <div class="format-selector">
            <div class="format-group">
              <label class="format-label">Highlight</label>
              <div class="format-nav">
                <button class="format-nav-btn" @click="cycleHighlight(-1)">‹</button>
                <div class="format-current">
                  <span class="format-name">{{ highlightDisplayName }}</span>
                </div>
                <button class="format-nav-btn" @click="cycleHighlight(1)">›</button>
              </div>
            </div>
          </div>

          <!-- ダークモード設定 -->
          <div class="format-selector">
            <div class="format-group">
              <label class="format-label">Color Mode</label>
              <div class="format-nav">
                <button class="format-nav-btn" @click="cycleDarkMode(-1)">‹</button>
                <div class="format-current">
                  <span class="format-name">{{ darkModeDisplayName }}</span>
                </div>
                <button class="format-nav-btn" @click="cycleDarkMode(1)">›</button>
              </div>
            </div>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FileUpload from './FileUpload.vue'
import FileHistory from './FileHistory.vue'
import KeyboardTab from './KeyboardTab.vue'
import ReplaceTab from './ReplaceTab.vue'
import { useVialStore } from '../stores/vial'
import { useSettingsStore } from '../stores/settings'
import { useUiStore } from '../stores/ui'
import { useImagesStore } from '../stores/images'
import type { ReplaceRule } from '../utils/types'

const vialStore = useVialStore()
const settingsStore = useSettingsStore()
const uiStore = useUiStore()
const imagesStore = useImagesStore()

// Computed properties
const selectedFile = computed(() => vialStore.selectedVialId || 'sample')
const hasSelectedFile = computed(() => vialStore.selectedVialId && vialStore.selectedVialId !== 'sample')

const formatDisplayName = computed(() => {
  const formats = {
    separated: 'Separated',
    vertical: 'Vertical',
    horizontal: 'Horizontal'
  }
  return formats[settingsStore.outputFormat] || 'Separated'
})

const highlightDisplayName = computed(() => {
  return settingsStore.subtextHighlight ? 'ON' : 'OFF'
})

const darkModeDisplayName = computed(() => {
  const modes = {
    light: 'Light',
    dark: 'Dark'
  }
  return modes[settingsStore.colorMode] || 'Light'
})

// Methods
const switchNavSection = (section: 'files' | 'generate' | 'settings') => {
  uiStore.setSidebarSection(section)
}

const cycleFormat = (direction: number) => {
  const formats = ['separated', 'vertical', 'horizontal'] as const
  const currentIndex = formats.indexOf(settingsStore.outputFormat)
  const newIndex = (currentIndex + direction + formats.length) % formats.length
  settingsStore.outputFormat = formats[newIndex]
}

const cycleHighlight = (direction: number) => {
  settingsStore.subtextHighlight = !settingsStore.subtextHighlight
}

const cycleDarkMode = (direction: number) => {
  const modes = ['light', 'dark'] as const
  const currentIndex = modes.indexOf(settingsStore.colorMode)
  const newIndex = (currentIndex + direction + modes.length) % modes.length
  settingsStore.colorMode = modes[newIndex]
}

const handleGenerate = async () => {
  await imagesStore.generateFinalOutputImages()
}

const handleReplaceRulesChanged = (rules: ReplaceRule[]) => {
  settingsStore.setReplaceRules(rules)
}

const downloadSelectedFile = async () => {
  if (vialStore.selectedVialId && vialStore.selectedVialId !== 'sample') {
    try {
      await vialStore.downloadVialFile(vialStore.selectedVialId)
    } catch (error) {
      console.error('Failed to download file:', error)
    }
  }
}

const deleteSelectedFile = async () => {
  if (vialStore.selectedVialId && vialStore.selectedVialId !== 'sample') {
    try {
      await vialStore.deleteVialFile(vialStore.selectedVialId)
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }
}
</script>

<style scoped lang="scss">
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

  &:hover {
    background: #e9ecef;
    color: #495057;
  }

  &.active {
    background: #007bff;
    color: #ffffff;

    &:hover {
      background: #0056b3;
    }
  }
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

  &:hover:not(:disabled) {
    background: #f8f9fa;
    border-color: #007bff;
    color: #007bff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f8f9fa;
    color: #999;
  }

  &.download-btn:hover:not(:disabled) {
    background: #e3f2fd;
    border-color: #2196f3;
    color: #2196f3;
  }

  &.delete-btn:hover:not(:disabled) {
    background: #ffebee;
    border-color: #f44336;
    color: #f44336;
  }
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

  &:last-child {
    margin-bottom: 0;
  }
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

.format-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.format-label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.format-nav {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 3px;
  padding: 3px;
  gap: 1px;
  box-sizing: border-box;
}

.format-icon {
  color: #007bff;
  flex-shrink: 0;

  svg {
    width: 12px;
    height: 12px;
  }
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

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
  }

  &::placeholder {
    color: #9ca3af;
  }
}

/* File upload section */
.file-upload-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

.file-quick-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
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

  &:hover:not(:disabled) {
    background: #218838;
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
}
</style>