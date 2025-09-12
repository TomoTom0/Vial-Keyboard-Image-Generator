<template>
  <div class="file-upload">
    <div
      class="upload-zone"
      :class="{ 
        'drag-active': isDragOver, 
        'has-file': uploadedFile,
        'upload-error': error 
      }"
      @drop="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".vil,.ytvil.png,.png"
        @change="handleFileSelect"
        hidden
      />
      
      <div v-if="!uploadedFile" class="upload-content">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17,8 12,3 7,8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>

      <div v-else class="file-preview">
        <div class="file-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        </div>
        <div class="file-details">
          <div class="file-name">{{ uploadedFile.name }}</div>
          <div class="file-size">{{ formatFileSize(uploadedFile.size) }}</div>
        </div>
        <button @click.stop="removeFile" class="remove-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useVialStore } from '../stores/vial'
import { useUiStore } from '../stores/ui'
import { useSettingsStore } from '../stores/settings'
import { extractMetadataFromPng } from '../utils/pngMetadata'

const vialStore = useVialStore()
const uiStore = useUiStore()
const settingsStore = useSettingsStore()


const fileInput = ref<HTMLInputElement>()
const uploadedFile = ref<File | null>(null)
const isDragOver = ref(false)
const error = ref('')
const uploadProgress = ref(0)
const recentFiles = ref<RecentFile[]>([])

// ドラッグ&ドロップ処理
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = true
}

const handleDragEnter = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  // 要素の境界を完全に出た場合のみfalseにする
  if (!e.currentTarget || !(e.currentTarget as Element).contains(e.relatedTarget as Node)) {
    isDragOver.value = false
  }
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
  
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    handleFile(files[0])
  }
}

// ファイル選択処理
const triggerFileInput = () => {
  if (uploadedFile.value) return // ファイルが既に選択されている場合は無効
  fileInput.value?.click()
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    handleFile(files[0])
  }
}

// ファイル処理
const handleFile = async (file: File) => {
  error.value = ''
  
  const fileName = file.name.toLowerCase()
  const isVilFile = fileName.endsWith('.vil')
  const isYtvilPng = fileName.endsWith('.ytvil.png')
  
  // ファイル形式チェック
  if (!isVilFile && !isYtvilPng) {
    error.value = '.vilまたは.ytvil.pngファイルのみアップロード可能です'
    return
  }
  
  // ファイルサイズチェック（10MB）
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'ファイルサイズは10MB以下にしてください'
    return
  }
  
  uploadedFile.value = file
  
  // .ytvil.pngファイルの場合はメタデータを読み込み
  if (isYtvilPng) {
    try {
      await handleYtvilPngFile(file)
    } catch (err) {
      console.error('Failed to process ytvil.png file:', err)
      error.value = 'メタデータの読み込みに失敗しました'
      return
    }
  }
  
  // プログレスバー表示（デモ）
  uploadProgress.value = 0
  const interval = setInterval(() => {
    uploadProgress.value += 10
    if (uploadProgress.value >= 100) {
      clearInterval(interval)
      setTimeout(() => {
        uploadProgress.value = 0
      }, 1000)
    }
  }, 50)
  
  // 通常のVILファイルの場合のみパース処理
  if (isVilFile) {
    parseAndSaveVilFile(file)
    // 最近使用したファイルに追加（レガシー）
    addToRecentFiles(file)
  }
}

// ytvil.pngファイルの処理（メタデータを読み込み）
const handleYtvilPngFile = async (file: File) => {
  // PNGファイルをDataURLとして読み込み
  const dataUrl = await readFileAsDataURL(file)
  
  // メタデータを抽出
  const metadata = extractMetadataFromPng(dataUrl)
  
  if (!metadata || !metadata.vilConfig) {
    throw new Error('No VIL configuration found in PNG metadata')
  }
  
  // VIL設定を復元
  const vilConfig = JSON.parse(metadata.vilConfig)
  
  // ファイル名から.ytvil.pngを除去し、ytomo-vial-kb-プレフィックスがあれば除去して.vilに変更
  let originalName = file.name.replace(/\.ytvil\.png$/, '')
  
  // ytomo-vial-kb-{ファイル名}-{日時}形式の場合、プレフィックスと日時部分を除去
  if (originalName.startsWith('ytomo-vial-kb-')) {
    // ytomo-vial-kb-を除去
    originalName = originalName.replace(/^ytomo-vial-kb-/, '')
    // 末尾のタイムスタンプ部分（-YYYYMMDDHHMMSS）があれば除去
    originalName = originalName.replace(/-\d{14}$/, '')
  }
  
  // .vil拡張子を追加
  originalName = originalName + '.vil'
  
  // VialStoreにVIL設定を保存
  const base64Content = `data:application/octet-stream;base64,${btoa(metadata.vilConfig)}`
  const newId = vialStore.addVialData(originalName, vilConfig, base64Content)
  
  // 埋め込まれた設定を復元
  if (metadata.settings) {
    try {
      const savedSettings = JSON.parse(metadata.settings)
      console.log('⚙️ Restoring settings from metadata:', savedSettings)
      
      // 設定を復元
      settingsStore.outputFormat = savedSettings.outputFormat || 'vertical'
      settingsStore.toggleDarkMode(savedSettings.theme === 'dark')
      settingsStore.showHeader = savedSettings.showHeader ?? true
      settingsStore.showCombos = savedSettings.showCombos ?? true
      settingsStore.highlightEnabled = savedSettings.highlightEnabled ?? true
      
      if (savedSettings.layerSelection) {
        settingsStore.layerSelection = savedSettings.layerSelection
      }
      
      if (savedSettings.replaceRules) {
        settingsStore.replaceRules = savedSettings.replaceRules
      }
      
      // 成功メッセージを表示
      uiStore.showToast('success', 'Settings Restored', 'VIL configuration and settings have been restored from PNG metadata')
      
    } catch (err) {
      console.warn('Failed to restore settings from metadata:', err)
    }
  }
  
  // ファイルを選択状態にする
  vialStore.selectedVialId = newId
  
  // 成功メッセージ
  uiStore.showToast('success', 'PNG Import Complete', `Imported VIL configuration from ${file.name}`)
}

// ファイルをDataURLとして読み込む
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// VILファイルをパースしてstoreに保存
const parseAndSaveVilFile = async (file: File) => {
  try {
    const fileContent = await file.text()
    const vilConfig = JSON.parse(fileContent)
    
    // VialStoreに保存（base64形式で統一）
    const base64Content = `data:application/octet-stream;base64,${btoa(fileContent)}`
    const newId = vialStore.addVialData(file.name, vilConfig, base64Content)
    
    // 追加したファイルを自動選択
    vialStore.selectVial(newId)
    
  } catch (error) {
    console.error('Failed to parse VIL file:', error)
    uiStore.showError('VILファイルの解析に失敗しました')
  }
}

// ファイル削除
const removeFile = () => {
  uploadedFile.value = null
  error.value = ''
  uploadProgress.value = 0
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// ファイルアップロード後のリセット（外部から呼び出し可能）
const reset = () => {
  removeFile()
}

// 親コンポーネントからアクセス可能にする
defineExpose({
  reset
})

// ユーティリティ関数
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 最近使用したファイル管理
const addToRecentFiles = (file: File) => {
  const recentFile: RecentFile = {
    id: Date.now().toString(),
    name: file.name,
    timestamp: new Date()
  }
  
  // 既存のファイルがある場合は削除
  const existingIndex = recentFiles.value.findIndex(f => f.name === file.name)
  if (existingIndex > -1) {
    recentFiles.value.splice(existingIndex, 1)
  }
  
  // 先頭に追加
  recentFiles.value.unshift(recentFile)
  
  // 最大5件まで保持
  if (recentFiles.value.length > 5) {
    recentFiles.value = recentFiles.value.slice(0, 5)
  }
  
  // ローカルストレージに保存
  saveRecentFiles()
}

const selectRecentFile = (recentFile: RecentFile) => {
  // 実際の実装では、ここでファイルデータを復元する
  console.log('Recent file selected:', recentFile.name)
}

const saveRecentFiles = () => {
  try {
    localStorage.setItem('vial-recent-files', JSON.stringify(recentFiles.value))
  } catch (error) {
    console.warn('Failed to save recent files:', error)
  }
}

const loadRecentFiles = () => {
  try {
    const saved = localStorage.getItem('vial-recent-files')
    if (saved) {
      const parsed = JSON.parse(saved)
      recentFiles.value = parsed.map((f: {name: string, timestamp: string}) => ({
        ...f,
        timestamp: new Date(f.timestamp)
      }))
    }
  } catch (error) {
    console.warn('Failed to load recent files:', error)
    recentFiles.value = []
  }
}

onMounted(() => {
  loadRecentFiles()
})
</script>

<style scoped lang="scss">
.file-upload {
  display: contents;
}

.upload-zone {
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 6px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafbfc;
  height: 36px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  flex: 1;
  min-width: 0;
}

.upload-zone:hover {
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.upload-zone.drag-active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #3b82f6;
}

.upload-zone.has-file {
  border-color: #10b981;
  background: #f0fdf4;
  color: #10b981;
}

.upload-zone.upload-error {
  border-color: #ef4444;
  background: #fef2f2;
  color: #ef4444;
}

.upload-content {
  display: flex;
  align-items: center;
  gap: 0;
}

.upload-icon {
  color: #6b7280;
  transition: color 0.2s;
}

.upload-zone:hover .upload-icon {
  color: #4b5563;
}

.upload-zone.drag-active .upload-icon {
  color: #3b82f6;
}

.upload-text {
  text-align: center;
}

.primary-text {
  font-size: 12px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 2px;
}

.secondary-text {
  font-size: 10px;
  color: #6b7280;
  font-style: italic;
}


.file-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 0;
}

.file-icon {
  color: #10b981;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  text-align: left;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #111827;
  font-size: 13px;
  margin-bottom: 0;
  word-break: break-all;
  line-height: 1.2;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 10px;
  color: #6b7280;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  color: #6b7280;
  transition: all 0.2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #f3f4f6;
  color: #ef4444;
}

@media (max-width: 768px) {
  .upload-zone {
    padding: 8px 12px;
    height: 50px;
    font-size: 11px;
  }
  
  .primary-text {
    font-size: 13px;
  }
  
  .file-name {
    font-size: 12px;
  }
}
</style>