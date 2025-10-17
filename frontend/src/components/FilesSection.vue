<template>
  <div class="files-section">
    <div class="file-header">
      <h3 class="section-title">Files</h3>
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

      <!-- Layout Settings -->
      <div class="layout-settings">
        <h4 class="settings-group-title">Layout</h4>

        <div class="keyboard-layout-settings">
          <!-- キーボード構造選択 -->
          <div class="format-selector">
            <button class="format-nav-btn" @click="cycleKeyboard(-1)">‹</button>
            <div class="format-current">
              <span class="format-name">{{ selectedKeyboard }}</span>
            </div>
            <button class="format-nav-btn" @click="cycleKeyboard(1)">›</button>
          </div>

          <!-- 言語選択 -->
          <div class="format-selector">
            <button class="format-nav-btn" @click="cycleLanguage(-1)">‹</button>
            <div class="format-current">
              <span class="format-name">{{ getLanguageName(settingsStore.keyboardLanguage) }}</span>
            </div>
            <button class="format-nav-btn" @click="cycleLanguage(1)">›</button>
          </div>
        </div>

        <!-- Convert Vial Tool -->
        <div class="convert-section">
          <div class="convert-tool">
            <div class="convert-tool-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
              <span>Convert Vial</span>
            </div>
            <!-- 変換対象言語選択 -->
            <div class="format-selector convert-target">
              <button class="format-nav-btn" @click="cycleTargetLanguage(-1)">‹</button>
              <div class="format-current">
                <span class="format-name">{{ getLanguageName(targetLanguage) }}</span>
              </div>
              <button class="format-nav-btn" @click="cycleTargetLanguage(1)">›</button>
            </div>

            <!-- 変換ボタン -->
            <div class="convert-button-container convert-action">
              <button
                class="convert-btn-full"
                :disabled="!canConvert"
                @click="handleConvert"
              >
                Convert
              </button>
            </div>

            <div v-if="convertStatus" class="convert-status" :class="convertStatus.type">
              {{ convertStatus.message }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FileUpload from './FileUpload.vue'
import FileHistory from './FileHistory.vue'
import { useVialStore } from '../stores/vial'
import { useSettingsStore } from '../stores/settings'
import { useImagesStore } from '../stores/images'
import { keyboardStructures } from '../utils/keyboardConfig'

const vialStore = useVialStore()
const settingsStore = useSettingsStore()
const imagesStore = useImagesStore()

// Convert Vial 関連の状態
const isConverting = ref(false)
const convertStatus = ref<{type: 'success' | 'error', message: string} | null>(null)
const targetLanguage = ref(settingsStore.keyboardLanguage === 'japanese' ? 'english' : 'japanese')

// Computed properties
const hasSelectedFile = computed(() => vialStore.selectedVialId && vialStore.selectedVialId !== 'sample')

const selectedKeyboard = computed(() => {
  const structure = keyboardStructures.find(s => s.id === settingsStore.keyboardStructure)
  return structure ? structure.displayName : ''
})

const canConvert = computed(() => {
  return vialStore.currentVial &&
         settingsStore.keyboardLanguage !== targetLanguage.value &&
         !isConverting.value
})

// Methods
const getLanguageName = (languageId: string) => {
  switch (languageId) {
    case 'japanese': return 'Japanese'
    case 'english': return 'English'
    default: return 'Japanese'
  }
}

const cycleKeyboard = (direction: number) => {
  const keyboards = keyboardStructures
  const currentIndex = keyboards.findIndex(k => k.id === settingsStore.keyboardStructure)
  let newIndex = (currentIndex + direction + keyboards.length) % keyboards.length
  settingsStore.setKeyboardStructure(keyboards[newIndex].id)
  imagesStore.generatePreviewImages()
}

const cycleLanguage = (direction: number) => {
  const languages = ['japanese', 'english']
  const currentIndex = languages.indexOf(settingsStore.keyboardLanguage)
  const newIndex = (currentIndex + direction + languages.length) % languages.length
  settingsStore.setKeyboardLanguage(languages[newIndex])
  imagesStore.generatePreviewImages()
}

const cycleTargetLanguage = (direction: number) => {
  const languages = ['japanese', 'english']
  const currentIndex = languages.indexOf(targetLanguage.value)
  const newIndex = (currentIndex + direction + languages.length) % languages.length
  targetLanguage.value = languages[newIndex]
}

const downloadSelectedFile = async () => {
  if (vialStore.selectedVialId && vialStore.selectedVialId !== 'sample') {
    try {
      vialStore.downloadConfig()
    } catch (error) {
      console.error('Failed to download file:', error)
    }
  }
}

const deleteSelectedFile = async () => {
  if (vialStore.selectedVialId && vialStore.selectedVialId !== 'sample') {
    try {
      await vialStore.removeVialData(vialStore.selectedVialId)
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }
}

const handleConvert = async () => {
  if (!canConvert.value) return

  isConverting.value = true
  convertStatus.value = null

  try {
    const message = await vialStore.convertLanguage(settingsStore.keyboardLanguage, targetLanguage.value)
    convertStatus.value = { type: 'success', message }

  } catch (error) {
    console.error('Convert error:', error)
    const errorMessage = error instanceof Error ? error.message : '不明なエラー'
    convertStatus.value = { type: 'error', message: `変換エラー: ${errorMessage}` }
  }

  isConverting.value = false

  setTimeout(() => {
    convertStatus.value = null
  }, 3000)
}
</script>

<style scoped lang="scss">
.files-section {
  margin-bottom: 30px;
}

.file-header {
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

.layout-settings {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;

  .keyboard-layout-settings {
    margin-bottom: 10px;
  }

  .format-selector {
    display: flex;
    align-items: center;
    gap: 2px;
    background: #f8f9fa;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 2px;
    margin-bottom: 8px;
    box-sizing: border-box;
    max-width: 170px;
    overflow: hidden;
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
  }

  .format-current {
    flex: 1;
    text-align: center;
    min-width: 0;
  }

  .format-name {
    font-size: 10px;
    color: #495057;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .convert-section {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid #e9ecef;
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

.convert-tool {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  background: #fafbfc;
  box-sizing: border-box;
  max-width: 170px;
  position: relative;
  margin-top: 10px;
}

.convert-tool-title {
  position: absolute;
  top: -8px;
  left: 12px;
  background: #fafbfc;
  padding: 0 4px;
  font-size: 9px;
  font-weight: 600;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 3px;

  svg {
    color: #6c757d;
  }
}

.convert-target {
  max-width: 154px;
}

.convert-action {
  max-width: 154px;
}

.convert-btn-full {
  width: 100%;
  padding: 6px 12px;
  background: #007bff;
  border: none;
  border-radius: 3px;
  color: white;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  box-sizing: border-box;
  text-align: center;

  &:hover:not(:disabled) {
    background: #0056b3;
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.convert-status {
  padding: 4px 6px;
  border-radius: 3px;
  font-size: 8px;
  text-align: center;
  max-width: 154px;
  word-wrap: break-word;
  box-sizing: border-box;

  &.success {
    color: #28a745;
    background: #d4edda;
    border: 1px solid #28a745;
  }

  &.error {
    color: #dc3545;
    background: #f8d7da;
    border: 1px solid #dc3545;
  }
}
</style>
