<template>
  <div class="file-upload-container">
    <div
      class="upload-area"
      :class="{ 'drag-over': isDragOver, 'has-file': uploadedFile }"
      @drop="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".vil"
        @change="handleFileSelect"
        class="file-input"
        hidden
      />
      
      <div v-if="!uploadedFile" class="upload-placeholder">
        <div class="upload-icon">📁</div>
        <p class="upload-text">
          <strong>クリックしてファイルを選択</strong><br>
          または<br>
          <strong>.vilファイルをドラッグ&ドロップ</strong>
        </p>
        <p class="upload-hint">
          最大ファイルサイズ: 10MB
        </p>
      </div>

      <div v-else class="file-info">
        <div class="file-icon">✅</div>
        <div class="file-details">
          <p class="file-name">{{ uploadedFile.name }}</p>
          <p class="file-size">{{ formatFileSize(uploadedFile.size) }}</p>
        </div>
        <button 
          @click.stop="removeFile"
          class="remove-button"
          title="ファイルを削除"
        >
          ❌
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      ⚠️ {{ error }}
    </div>

    <div v-if="uploadProgress > 0 && uploadProgress < 100" class="progress-bar">
      <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
      <span class="progress-text">{{ uploadProgress }}%</span>
    </div>

    <!-- 最近使用したファイル -->
    <div v-if="recentFiles.length > 0" class="recent-files">
      <h3>最近使用したファイル</h3>
      <div class="recent-files-list">
        <div
          v-for="file in recentFiles"
          :key="file.id"
          class="recent-file-item"
          @click="selectRecentFile(file)"
        >
          <span class="recent-file-name">{{ file.name }}</span>
          <span class="recent-file-date">{{ formatDate(file.timestamp) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface RecentFile {
  id: string
  name: string
  timestamp: Date
  data?: string
}

const emit = defineEmits<{
  fileSelected: [file: File]
  error: [message: string]
}>()

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
const handleFile = (file: File) => {
  error.value = ''
  
  // ファイル形式チェック
  if (!file.name.toLowerCase().endsWith('.vil')) {
    error.value = '.vilファイルのみアップロード可能です'
    return
  }
  
  // ファイルサイズチェック（10MB）
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'ファイルサイズは10MB以下にしてください'
    return
  }
  
  uploadedFile.value = file
  
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
  
  // 最近使用したファイルに追加
  addToRecentFiles(file)
  
  // 親コンポーネントにファイルを通知
  emit('fileSelected', file)
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
      recentFiles.value = parsed.map((f: any) => ({
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

<style scoped>
.file-upload-container {
  width: 100%;
  max-width: 600px;
}

.upload-area {
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8fafc;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: #4299e1;
  background: #ebf8ff;
}

.upload-area.drag-over {
  border-color: #4299e1;
  background: #ebf8ff;
  transform: scale(1.02);
}

.upload-area.has-file {
  border-color: #48bb78;
  background: #f0fff4;
  cursor: default;
}

.upload-placeholder {
  width: 100%;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-text {
  font-size: 1.1rem;
  color: #4a5568;
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.upload-hint {
  font-size: 0.9rem;
  color: #718096;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.file-icon {
  font-size: 2rem;
}

.file-details {
  flex: 1;
  text-align: left;
}

.file-name {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.file-size {
  font-size: 0.9rem;
  color: #718096;
  margin: 0;
}

.remove-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.remove-button:hover {
  background: rgba(255, 0, 0, 0.1);
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fed7d7;
  border: 1px solid #fc8181;
  border-radius: 6px;
  color: #c53030;
  font-size: 0.9rem;
}

.progress-bar {
  margin-top: 1rem;
  position: relative;
  height: 24px;
  background: #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4299e1, #3182ce);
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  font-weight: 600;
  color: #2d3748;
}

.recent-files {
  margin-top: 2rem;
}

.recent-files h3 {
  font-size: 1.1rem;
  color: #4a5568;
  margin-bottom: 1rem;
}

.recent-files-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recent-file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.recent-file-item:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
}

.recent-file-name {
  font-weight: 500;
  color: #2d3748;
}

.recent-file-date {
  font-size: 0.8rem;
  color: #718096;
}

@media (max-width: 640px) {
  .upload-area {
    padding: 1.5rem;
    min-height: 150px;
  }
  
  .upload-text {
    font-size: 1rem;
  }
  
  .upload-icon {
    font-size: 2.5rem;
  }
}
</style>