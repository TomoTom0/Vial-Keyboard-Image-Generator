<template>
  <div class="preferences-tab">
    <div class="preferences-header">
      <h3 class="preferences-title">Preferences</h3>
    </div>

    <div class="preferences-content">
      <!-- Import TSV Section -->
      <div class="import-section">
        <h4 class="import-section-title">Import TSV</h4>

        <!-- Physical Layout -->
        <div class="upload-group">
          <h5 class="upload-group-title">Physical Layout</h5>
          <div class="upload-controls">
            <input
              type="file"
              ref="keyboardFileInput"
              accept=".tsv"
              @change="handleKeyboardUpload"
              style="display: none;"
            />
            <button class="upload-btn file-tab-style" @click="triggerKeyboardUpload">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17,8 12,3 7,8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span class="upload-text">TSV</span>
            </button>
            <button class="help-btn" @click="showKeyboardHelp" title="Show format help">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </button>
          </div>

          <!-- アップロード済みキーボードリスト -->
          <div v-if="uploadedKeyboards.length > 0" class="uploaded-list">
            <div class="uploaded-title">Uploaded:</div>
            <div v-for="keyboard in uploadedKeyboards" :key="keyboard.name" class="uploaded-item">
              <span class="uploaded-name">{{ keyboard.name }}</span>
              <button class="remove-btn" @click="removeKeyboard(keyboard.name)" title="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Language Keymap -->
        <div class="upload-group">
          <h5 class="upload-group-title">Language Keymap</h5>
          <div class="upload-controls">
            <input
              type="file"
              ref="languageFileInput"
              accept=".tsv"
              @change="handleLanguageUpload"
              style="display: none;"
            />
            <button class="upload-btn file-tab-style" @click="triggerLanguageUpload">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17,8 12,3 7,8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span class="upload-text">TSV</span>
            </button>
            <button class="help-btn" @click="showLanguageHelp" title="Show format help">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </button>
          </div>

          <!-- アップロード済み言語リスト -->
          <div v-if="uploadedLanguages.length > 0" class="uploaded-list">
            <div class="uploaded-title">Uploaded:</div>
            <div v-for="language in uploadedLanguages" :key="language.name" class="uploaded-item">
              <span class="uploaded-name">{{ language.name }}</span>
              <button class="remove-btn" @click="removeLanguage(language.name)" title="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ヘルプダイアログ -->
    <div v-if="showHelp" class="help-overlay" @click="closeHelp">
      <div class="help-dialog" @click.stop>
        <div class="help-header">
          <h3>{{ helpTitle }}</h3>
          <button class="help-close" @click="closeHelp">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="help-content">
          <div v-html="helpContent"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUiStore } from '../stores/ui'
import { useSettingsStore } from '../stores/settings'

const uiStore = useUiStore()
const settingsStore = useSettingsStore()

// File input refs
const keyboardFileInput = ref<HTMLInputElement>()
const languageFileInput = ref<HTMLInputElement>()

// Local state for uploaded files (sessionStorage for cache persistence)
const uploadedKeyboards = ref<Array<{ name: string, data: any }>>([])
const uploadedLanguages = ref<Array<{ name: string, data: any }>>([])

// Help dialog state
const showHelp = ref(false)
const helpTitle = ref('')
const helpContent = ref('')

// TSVアップロード機能
const triggerKeyboardUpload = () => {
  keyboardFileInput.value?.click()
}

const triggerLanguageUpload = () => {
  languageFileInput.value?.click()
}

const handleKeyboardUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const parsedData = parseTSV(text)

    // ファイル名から拡張子を除去
    const name = file.name.replace(/\.tsv$/, '')

    // キーボードデータを保存
    const keyboardData = {
      name,
      data: parsedData
    }

    // 既存の同名ファイルがあれば上書き
    const existingIndex = uploadedKeyboards.value.findIndex(kb => kb.name === name)
    if (existingIndex >= 0) {
      uploadedKeyboards.value[existingIndex] = keyboardData
    } else {
      uploadedKeyboards.value.push(keyboardData)
    }

    // セッションストレージに保存
    saveToSessionStorage()

    console.log('Keyboard layout uploaded:', name)
    console.log('Parsed data:', parsedData)

    // 成功通知
    uiStore.addToast({
      type: 'success',
      title: 'Keyboard Layout Uploaded',
      message: `Successfully uploaded ${file.name}`
    })
  } catch (error) {
    console.error('Failed to upload keyboard layout:', error)
    uiStore.addToast({
      type: 'error',
      title: 'Upload Failed',
      message: 'Failed to upload keyboard layout file'
    })
  }

  // Clear input
  if (input) input.value = ''
}

const handleLanguageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const parsedData = parseTSV(text)

    // ファイル名から拡張子を除去
    const name = file.name.replace(/\.tsv$/, '')

    // 言語データを保存
    const languageData = {
      name,
      data: parsedData
    }

    // 既存の同名ファイルがあれば上書き
    const existingIndex = uploadedLanguages.value.findIndex(lang => lang.name === name)
    if (existingIndex >= 0) {
      uploadedLanguages.value[existingIndex] = languageData
    } else {
      uploadedLanguages.value.push(languageData)
    }

    // セッションストレージに保存
    saveToSessionStorage()

    console.log('Language keymap uploaded:', name)
    console.log('Parsed data:', parsedData)

    // 成功通知
    uiStore.addToast({
      type: 'success',
      title: 'Language Keymap Uploaded',
      message: `Successfully uploaded ${file.name}`
    })
  } catch (error) {
    console.error('Failed to upload language keymap:', error)
    uiStore.addToast({
      type: 'error',
      title: 'Upload Failed',
      message: 'Failed to upload language keymap file'
    })
  }

  // Clear input
  if (input) input.value = ''
}

// TSVパース関数
const parseTSV = (text: string) => {
  const lines = text.trim().split('\n')
  const headers = lines[0].split('\t')
  const data = lines.slice(1).map(line => {
    const values = line.split('\t')
    const row: any = {}
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || ''
    })
    return row
  })
  return { headers, data }
}

// 削除機能
const removeKeyboard = (name: string) => {
  uploadedKeyboards.value = uploadedKeyboards.value.filter(kb => kb.name !== name)
  saveToSessionStorage()

  uiStore.addToast({
    type: 'info',
    title: 'Keyboard Removed',
    message: `Removed keyboard layout: ${name}`
  })
}

const removeLanguage = (name: string) => {
  uploadedLanguages.value = uploadedLanguages.value.filter(lang => lang.name !== name)
  saveToSessionStorage()

  uiStore.addToast({
    type: 'info',
    title: 'Language Removed',
    message: `Removed language keymap: ${name}`
  })
}

// セッションストレージ保存・復元
const saveToSessionStorage = () => {
  sessionStorage.setItem('uploadedKeyboards', JSON.stringify(uploadedKeyboards.value))
  sessionStorage.setItem('uploadedLanguages', JSON.stringify(uploadedLanguages.value))
}

const loadFromSessionStorage = () => {
  try {
    const savedKeyboards = sessionStorage.getItem('uploadedKeyboards')
    const savedLanguages = sessionStorage.getItem('uploadedLanguages')

    if (savedKeyboards) {
      uploadedKeyboards.value = JSON.parse(savedKeyboards)
    }
    if (savedLanguages) {
      uploadedLanguages.value = JSON.parse(savedLanguages)
    }
  } catch (error) {
    console.error('Failed to load from session storage:', error)
  }
}

// ヘルプ機能
const showKeyboardHelp = () => {
  helpTitle.value = 'Keyboard Layout TSV Format'
  helpContent.value = `
    <h4>Required Columns:</h4>
    <ul>
      <li><strong>vial_row</strong>: Row position in VIL file (0-based)</li>
      <li><strong>vial_col</strong>: Column position in VIL file (0-based)</li>
      <li><strong>layout_row</strong>: Logical row position for display</li>
      <li><strong>layout_col</strong>: Logical column position for display</li>
      <li><strong>canvas_x</strong>: X coordinate on canvas (pixels)</li>
      <li><strong>canvas_y</strong>: Y coordinate on canvas (pixels)</li>
      <li><strong>canvas_width</strong>: Key width (pixels)</li>
      <li><strong>canvas_height</strong>: Key height (pixels)</li>
      <li><strong>canvas_rotation</strong>: Key rotation angle (usually 0.0)</li>
      <li><strong>description</strong>: Key description</li>
    </ul>
    <h4>Example:</h4>
    <pre>vial_row	vial_col	layout_row	layout_col	canvas_x	canvas_y	canvas_width	canvas_height	canvas_rotation	description
0	0	0	0	20.0	20.0	78	60	0.0	Left top row - Key 1
0	1	0	1	102.0	20.0	78	60	0.0	Left top row - Key 2</pre>
  `
  showHelp.value = true
}

const showLanguageHelp = () => {
  helpTitle.value = 'Language Keymap TSV Format'
  helpContent.value = `
    <h4>Required Columns:</h4>
    <ul>
      <li><strong>keycode</strong>: QMK keycode (e.g., KC_Q, KC_SCLN)</li>
      <li><strong>display</strong>: Character displayed normally</li>
      <li><strong>shift_display</strong>: Character displayed with Shift</li>
      <li><strong>description</strong>: Key description</li>
    </ul>
    <h4>Example:</h4>
    <pre>keycode	display	shift_display	description
KC_Q	q	Q	Letter Q
KC_W	w	W	Letter W
KC_SCLN	;	:	Semicolon/Colon</pre>
    <h4>Note:</h4>
    <p>Only language-specific characters need to be defined. Common keys are automatically loaded from common.tsv.</p>
  `
  showHelp.value = true
}

const closeHelp = () => {
  showHelp.value = false
}

// 初期化時にセッションストレージから復元
loadFromSessionStorage()
</script>

<style scoped lang="scss">
.preferences-tab {
  padding: 0;
  height: auto;
}

.preferences-header {
  background: #f8f9fa;
  margin: -20px -20px 15px -20px;
  padding: 12px 20px;
  border-bottom: 1px solid #e9ecef;
}

.preferences-title {
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

.preferences-content {
  padding: 0;
  max-width: 170px;
  box-sizing: border-box;
  overflow: hidden;
}

.import-section {
  margin-bottom: 20px;
}

.import-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  padding: 6px 0 3px 0;
  border-bottom: 1px solid #e9ecef;
}

.upload-group {
  margin-bottom: 15px;
  padding: 0;
  box-sizing: border-box;
  max-width: 170px;
  overflow: hidden;

  &:last-child {
    margin-bottom: 0;
  }
}

.upload-group-title {
  font-size: 13px;
  font-weight: 600;
  color: #495057;
  margin: 0 0 8px 0;
  padding: 0;
}

.upload-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: #007bff;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #0056b3;
  }

  svg {
    flex-shrink: 0;
  }

  &.file-tab-style {
    background: #ffffff;
    border: 1px solid #ddd;
    color: #333;
    font-size: 12px;
    padding: 6px 12px;
    min-height: 36px;

    &:hover {
      background: #f8f9fa;
      border-color: #007bff;
      color: #007bff;
    }
  }
}

.upload-text {
  font-weight: 600;
  font-size: 12px;
}

.help-btn {
  background: none;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 6px;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;

  &:hover {
    background: #f8f9fa;
    border-color: #007bff;
    color: #007bff;
  }
}

.upload-hint {
  font-size: 11px;
  color: #6c757d;
  text-align: center;
  font-style: italic;
}

.uploaded-list {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #dee2e6;
}

.uploaded-title {
  font-size: 12px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 6px;
}

.uploaded-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.uploaded-name {
  flex: 1;
  color: #495057;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 2px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: #f8d7da;
  }
}

/* ヘルプダイアログ */
.help-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.help-dialog {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  max-height: 80vh;
  width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
}

.help-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #6c757d;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #e9ecef;
    color: #333;
  }
}

.help-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  ul {
    margin: 0 0 16px 0;
    padding-left: 20px;

    li {
      margin-bottom: 6px;
      font-size: 13px;
      line-height: 1.4;

      strong {
        color: #007bff;
        font-weight: 600;
      }
    }
  }

  pre {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 12px;
    font-size: 11px;
    overflow-x: auto;
    margin: 8px 0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  p {
    margin: 8px 0;
    font-size: 13px;
    line-height: 1.4;
    color: #6c757d;
  }
}
</style>