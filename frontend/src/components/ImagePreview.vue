<template>
  <div class="preview">
    <!-- 生成中 -->
    <div v-if="isGenerating" class="state generating">
      <div class="spinner"></div>
      <div>Generating images...</div>
      <div class="progress">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <!-- エラー -->
    <div v-else-if="error" class="state error">
      <div class="message">{{ error }}</div>
      <button @click="$emit('retry')" class="retry-btn">Retry</button>
    </div>

    <!-- 画像表示 -->
    <div v-else-if="images.length > 0" class="images">
      <div class="header">
        <span>{{ images.length }} images</span>
        <div class="header-controls">
          <div class="view-toggle" v-if="images.some(img => img.previewUrl)">
            <label class="toggle-label">
              <input type="checkbox" v-model="showPreview" />
              <span>Preview Mode</span>
            </label>
          </div>
          <button @click="downloadAll" class="download-all">Download All</button>
        </div>
      </div>

      <div class="grid">
        <div v-for="image in images" :key="image.id" class="image-item">
          <img
            :src="getImageUrl(image)"
            :alt="image.filename"
            class="image"
            @click="showModal(image)"
          />
          <div class="info">
            <div class="filename">{{ image.filename }}</div>
            <div class="meta">
              {{ getImageTypeText(image) }} • {{ formatFileSize(getCurrentImageSize(image)) }}
              <span v-if="showPreview && image.previewUrl" class="preview-indicator">• Preview</span>
            </div>
          </div>
          <div class="actions">
            <button @click="downloadImage(image)" class="btn-download">↓</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状態 -->
    <div v-else class="state empty">
      <div class="message">No images generated yet</div>
    </div>

    <!-- モーダル -->
    <div v-if="selectedImage" class="modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <span>{{ selectedImage.filename }}</span>
          <button @click="closeModal" class="close">×</button>
        </div>
        <img :src="getImageUrl(selectedImage)" class="modal-image" />
        <div class="modal-actions">
          <button @click="downloadImage(selectedImage)" class="modal-btn">Download</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface GeneratedImage {
  id: string
  filename: string
  type: 'combined' | 'layer'
  layer?: number
  format: string
  url: string
  previewUrl?: string
  size: number
  previewSize?: number
  timestamp: Date
}

const props = defineProps<{
  images: GeneratedImage[]
  isGenerating: boolean
  error: string | null
  progress: number
}>()

const emit = defineEmits<{
  retry: []
  imageDownloaded: [image: GeneratedImage]
}>()

const expandedImage = ref<string | null>(null)
const selectedImage = ref<GeneratedImage | null>(null)
const showPreview = ref<boolean>(true)

// 画像タイプのテキスト表示
const getImageTypeText = (image: GeneratedImage): string => {
  if (image.type === 'combined') {
    return '結合画像'
  } else if (image.type === 'layer') {
    return `レイヤー ${image.layer}`
  }
  return '画像'
}

// 画像URLを取得（プレビュー/フル切り替え対応）
const getImageUrl = (image: GeneratedImage): string => {
  const targetUrl = (showPreview.value && image.previewUrl) ? image.previewUrl : image.url
  
  // 開発環境では相対パスを絶対パスに変換
  if (targetUrl.startsWith('/api/')) {
    return `http://localhost:3001${targetUrl}`
  }
  return targetUrl
}

// 現在表示中の画像サイズを取得
const getCurrentImageSize = (image: GeneratedImage): number => {
  return (showPreview.value && image.previewSize) ? image.previewSize : image.size
}

// ファイルサイズフォーマット
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 日時フォーマット
const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 画像の拡大表示切り替え
const toggleImageExpand = (imageId: string) => {
  if (expandedImage.value === imageId) {
    expandedImage.value = null
  } else {
    expandedImage.value = imageId
  }
}

// 単一画像ダウンロード
const downloadImage = (image: GeneratedImage) => {
  try {
    const link = document.createElement('a')
    link.href = getImageUrl(image)
    link.download = image.filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    emit('imageDownloaded', image)
    console.log('Downloaded:', image.filename)
  } catch (error) {
    console.error('Download failed:', error)
  }
}

// 全画像ダウンロード
const downloadAll = async () => {
  console.log('Downloading all images...')
  
  // 簡単な実装：各画像を順次ダウンロード
  for (const image of props.images) {
    await new Promise(resolve => setTimeout(resolve, 500)) // 500ms待機
    downloadImage(image)
  }
}

// 画像リンクをクリップボードにコピー
const copyImageLink = async (image: GeneratedImage) => {
  try {
    const url = getImageUrl(image)
    await navigator.clipboard.writeText(url)
    console.log('Copied to clipboard:', url)
    // TODO: トースト通知を表示
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

// 画像共有
const shareImages = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Vial Keyboard Images',
        text: '生成されたキーボード画像',
        url: window.location.href
      })
    } catch (error) {
      console.log('Share canceled or failed:', error)
    }
  } else {
    // Web Share API がサポートされていない場合
    copyImageLink(props.images[0])
  }
}

// 画像詳細表示  
const showModal = (image: GeneratedImage) => {
  selectedImage.value = image
}

// モーダルを閉じる
const closeModal = () => {
  selectedImage.value = null
}

// 画像読み込み成功
const onImageLoad = (image: GeneratedImage) => {
  console.log('Image loaded:', image.filename)
}

// 画像読み込み失敗
const onImageError = (image: GeneratedImage) => {
  console.error('Image load failed:', image.filename)
}
</script>

<style scoped>
.preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.generating .spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e9ecef;
  border-top: 3px solid #0d6efd;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress {
  width: 200px;
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  margin-top: 1rem;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #0d6efd;
  transition: width 0.3s ease;
}

.error .message {
  color: #dc3545;
  margin-bottom: 1rem;
}

.retry-btn {
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.images {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 1rem;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6c757d;
  cursor: pointer;
}

.download-all {
  background: #198754;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  flex: 1;
}

.image-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.image-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.image {
  width: 100%;
  height: auto;
  cursor: pointer;
  display: block;
}

.info {
  padding: 0.75rem;
}

.filename {
  font-weight: 500;
  font-size: 0.9rem;
  color: #212529;
  margin-bottom: 0.25rem;
  word-break: break-all;
}

.meta {
  font-size: 0.8rem;
  color: #6c757d;
}

.preview-indicator {
  color: #0d6efd;
  font-weight: 500;
}

.actions {
  padding: 0 0.75rem 0.75rem;
}

.btn-download {
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-image {
  width: 100%;
  height: auto;
  display: block;
}

.modal-actions {
  padding: 1rem;
  border-top: 1px solid #e9ecef;
  text-align: center;
}

.modal-btn {
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
}
</style>