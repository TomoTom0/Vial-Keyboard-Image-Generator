<template>
  <div class="file-upload">
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
        hidden
      />
      
      <div v-if="!uploadedFile" class="placeholder">
        <div class="icon">📁</div>
        <div class="text">Drop .vil file or click to select</div>
      </div>

      <div v-else class="file-info">
        <div class="file-details">
          <div class="file-name">{{ uploadedFile.name }}</div>
          <div class="file-size">{{ formatFileSize(uploadedFile.size) }}</div>
        </div>
        <button @click.stop="removeFile" class="remove-btn">×</button>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
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
.file-upload {
  /* No max-width to fill sidebar */
}

.upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #f8f9fa;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: #6c757d;
}

.upload-area.drag-over {
  border-color: #0d6efd;
  background: #e7f1ff;
}

.upload-area.has-file {
  border-color: #198754;
  background: #d1e7dd;
  cursor: default;
}

.placeholder {
  width: 100%;
}

.icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.text {
  font-size: 0.9rem;
  color: #6c757d;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.file-details {
  flex: 1;
  text-align: left;
}

.file-name {
  font-weight: 500;
  color: #212529;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  word-break: break-all;
}

.file-size {
  font-size: 0.8rem;
  color: #6c757d;
  margin: 0;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  color: #dc3545;
  line-height: 1;
}

.remove-btn:hover {
  background: rgba(220, 53, 69, 0.1);
}

.error {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  color: #721c24;
  font-size: 0.875rem;
}
</style>