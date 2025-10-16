<template>
  <div class="generate-section">
    <div class="generate-header">
      <h3 class="section-title">Generate</h3>
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
            <button class="format-nav-btn" @click="cycleDarkMode()">‹</button>
            <div class="format-current">
              <span class="format-name">{{ darkModeDisplayName }}</span>
            </div>
            <button class="format-nav-btn" @click="cycleDarkMode()">›</button>
          </div>
        </div>
      </div>

      <!-- イメージフォーマット設定 -->
      <div class="format-selector">
        <div class="format-group">
          <label class="format-label">Image Format</label>
          <div class="format-nav">
            <button class="format-nav-btn" @click="cycleImageFormat(-1)">‹</button>
            <div class="format-current">
              <span class="format-name">{{ imageFormatDisplayName }}</span>
            </div>
            <button class="format-nav-btn" @click="cycleImageFormat(1)">›</button>
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
          @click="imagesStore.generateFinalOutputImages"
        >
          Generate
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useVialStore } from '../stores/vial'
import { useSettingsStore } from '../stores/settings'
import { useUiStore } from '../stores/ui'
import { useImagesStore } from '../stores/images'

const vialStore = useVialStore()
const settingsStore = useSettingsStore()
const uiStore = useUiStore()
const imagesStore = useImagesStore()

// Debounced preview generation
let generateTimeout: NodeJS.Timeout | null = null
const debouncedGeneratePreview = () => {
  if (generateTimeout) {
    clearTimeout(generateTimeout)
  }
  generateTimeout = setTimeout(() => {
    generatePreviewImages()
  }, 100)
}

const generatePreviewImages = async () => {
  await imagesStore.generatePreviewImages()
}

// Computed properties
const selectedFile = computed(() => vialStore.selectedVialId || 'sample')

const formatDisplayName = computed(() => {
  const formats = {
    separated: 'Separated',
    vertical: 'Vertical',
    rectangular: 'Rectangular'
  }
  return formats[settingsStore.outputFormat] || 'Separated'
})

const highlightDisplayName = computed(() => {
  const levels = {
    10: 'OFF',
    20: 'WEAK',
    30: 'STRONG'
  }
  return levels[settingsStore.highlightLevel] || 'STRONG'
})

const darkModeDisplayName = computed(() => {
  return settingsStore.enableDarkMode ? 'Dark' : 'Light'
})

const imageFormatDisplayName = computed(() => {
  return settingsStore.imageFormat.toUpperCase()
})

// Methods
const cycleFormat = (direction: number) => {
  const formats = ['separated', 'vertical', 'rectangular'] as const
  const currentIndex = formats.indexOf(settingsStore.outputFormat)
  const newIndex = (currentIndex + direction + formats.length) % formats.length
  settingsStore.outputFormat = formats[newIndex]
  debouncedGeneratePreview()
}

const cycleHighlight = (direction: number) => {
  const levels = [10, 20, 30] as const
  const currentIndex = levels.indexOf(settingsStore.highlightLevel)
  const newIndex = (currentIndex + direction + levels.length) % levels.length
  settingsStore.highlightLevel = levels[newIndex]
  debouncedGeneratePreview()
}

const cycleDarkMode = () => {
  settingsStore.enableDarkMode = !settingsStore.enableDarkMode
  debouncedGeneratePreview()
}

const cycleImageFormat = (direction: number) => {
  settingsStore.cycleImageFormat(direction)
  debouncedGeneratePreview()
}
</script>

<style scoped lang="scss">
.generate-section {
  margin-bottom: 0;
}

.generate-header {
  background: #f8f9fa;
  margin: -20px -20px 15px -20px;
  padding: 12px 20px;
  border-bottom: 1px solid #e9ecef;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #007bff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.generate-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: -20px -20px 0 -20px;
  padding: 10px 8px;
  box-sizing: border-box;
  overflow: hidden;
  max-width: 210px;
}

.format-selector {
  display: flex;
  align-items: center;
  gap: 2px;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;

  &:not(:has(.format-group)) {
    background: #f8f9fa;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 2px;
  }
}

.format-nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  color: #666;
  font-size: 12px;
  font-weight: bold;
  border-radius: 2px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #e9ecef;
    color: #495057;
  }

  &.active {
    background: #007bff;
    color: white;
  }

  &.tab-button {
    width: auto;
    padding: 8px 12px;
    min-width: 50px;
    height: 32px;
    flex: 1;
  }
}

.format-current {
  flex: 1;
  text-align: center;
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
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 2px;
  gap: 2px;
  box-sizing: border-box;
}

.format-name {
  font-size: 10px;
  color: #495057;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

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
