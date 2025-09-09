<template>
  <div class="image-preview-container">
    <!-- 生成中の状態 -->
    <div v-if="isGenerating" class="generating-state">
      <div class="loading-spinner"></div>
      <h3>画像を生成中...</h3>
      <p>しばらくお待ちください</p>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <!-- エラー状態 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <h3>エラーが発生しました</h3>
      <p class="error-message">{{ error }}</p>
      <button @click="$emit('retry')" class="retry-button">
        🔄 再試行
      </button>
    </div>

    <!-- 画像表示状態 -->
    <div v-else-if="images.length > 0" class="images-display">
      <div class="preview-header">
        <h3>生成された画像 ({{ images.length }}枚)</h3>
        <div class="header-actions">
          <button @click="downloadAll" class="download-all-button">
            📦 全てダウンロード
          </button>
          <button @click="shareImages" class="share-button">
            🔗 共有
          </button>
        </div>
      </div>

      <!-- 画像グリッド -->
      <div class="images-grid">
        <div
          v-for="image in images"
          :key="image.id"
          class="image-card"
          :class="{ 'expanded': expandedImage === image.id }"
        >
          <div class="image-header">
            <h4 class="image-title">{{ image.filename }}</h4>
            <div class="image-meta">
              <span class="image-type">{{ getImageTypeText(image) }}</span>
              <span class="image-size">{{ formatFileSize(image.size) }}</span>
            </div>
          </div>

          <div class="image-content" @click="toggleImageExpand(image.id)">
            <img
              :src="getImageUrl(image)"
              :alt="image.filename"
              class="preview-image"
              @load="onImageLoad(image)"
              @error="onImageError(image)"
            />
            <div class="image-overlay">
              <div class="overlay-actions">
                <button class="overlay-button" title="拡大表示">
                  🔍
                </button>
              </div>
            </div>
          </div>

          <div class="image-actions">
            <button
              @click="downloadImage(image)"
              class="action-button primary"
            >
              💾 ダウンロード
            </button>
            <button
              @click="copyImageLink(image)"
              class="action-button secondary"
            >
              📋 リンクをコピー
            </button>
            <button
              @click="showImageInfo(image)"
              class="action-button secondary"
            >
              ℹ️ 詳細
            </button>
          </div>
        </div>
      </div>

      <!-- 画像詳細モーダル -->
      <div v-if="selectedImage" class="image-modal" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ selectedImage.filename }}</h3>
            <button @click="closeModal" class="close-button">❌</button>
          </div>
          <div class="modal-body">
            <img
              :src="getImageUrl(selectedImage)"
              :alt="selectedImage.filename"
              class="modal-image"
            />
            <div class="image-details">
              <div class="detail-item">
                <strong>ファイル名:</strong> {{ selectedImage.filename }}
              </div>
              <div class="detail-item">
                <strong>タイプ:</strong> {{ getImageTypeText(selectedImage) }}
              </div>
              <div class="detail-item">
                <strong>サイズ:</strong> {{ formatFileSize(selectedImage.size) }}
              </div>
              <div class="detail-item">
                <strong>作成日時:</strong> {{ formatDateTime(selectedImage.timestamp) }}
              </div>
              <div v-if="selectedImage.layer !== undefined" class="detail-item">
                <strong>レイヤー:</strong> {{ selectedImage.layer }}
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="downloadImage(selectedImage)" class="modal-button primary">
              💾 ダウンロード
            </button>
            <button @click="copyImageLink(selectedImage)" class="modal-button secondary">
              📋 リンクをコピー
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 初期状態 -->
    <div v-else class="empty-state">
      <div class="empty-icon">🖼️</div>
      <h3>画像をプレビューする準備ができました</h3>
      <p>ファイルをアップロードして画像を生成してください</p>
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
  size: number
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

// 画像タイプのテキスト表示
const getImageTypeText = (image: GeneratedImage): string => {
  if (image.type === 'combined') {
    return '結合画像'
  } else if (image.type === 'layer') {
    return `レイヤー ${image.layer}`
  }
  return '画像'
}

// 画像URLを取得
const getImageUrl = (image: GeneratedImage): string => {
  // 開発環境では相対パスを絶対パスに変換
  if (image.url.startsWith('/api/')) {
    return `http://localhost:3001${image.url}`
  }
  return image.url
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
const showImageInfo = (image: GeneratedImage) => {
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
.image-preview-container {
  width: 100%;
  max-width: 1200px;
}

/* 生成中状態 */
.generating-state {
  text-align: center;
  padding: 3rem 1rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #4299e1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress-bar {
  width: 100%;
  max-width: 300px;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  margin: 1rem auto 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4299e1, #3182ce);
  transition: width 0.3s ease;
}

/* エラー状態 */
.error-state {
  text-align: center;
  padding: 3rem 1rem;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-message {
  color: #e53e3e;
  margin-bottom: 1.5rem;
}

.retry-button {
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-weight: 500;
}

/* 空状態 */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #718096;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* 画像表示 */
.images-display {
  width: 100%;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.preview-header h3 {
  color: #2d3748;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.download-all-button,
.share-button {
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.download-all-button:hover,
.share-button:hover {
  background: #3182ce;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.image-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.image-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.image-header {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.image-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
  word-break: break-all;
}

.image-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #718096;
}

.image-content {
  position: relative;
  cursor: pointer;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.3s ease;
}

.image-content:hover .preview-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-content:hover .image-overlay {
  opacity: 1;
}

.overlay-actions {
  display: flex;
  gap: 0.5rem;
}

.overlay-button {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background-color 0.2s;
}

.overlay-button:hover {
  background: white;
}

.image-actions {
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-button {
  flex: 1;
  min-width: 80px;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.action-button.primary {
  background: #4299e1;
  color: white;
}

.action-button.primary:hover {
  background: #3182ce;
}

.action-button.secondary {
  background: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.action-button.secondary:hover {
  background: #edf2f7;
}

/* モーダル */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
}

.modal-image {
  width: 100%;
  height: auto;
  margin-bottom: 1rem;
  border-radius: 8px;
}

.image-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  font-size: 0.9rem;
  color: #4a5568;
}

.modal-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.modal-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.modal-button.primary {
  background: #4299e1;
  color: white;
}

.modal-button.secondary {
  background: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

@media (max-width: 768px) {
  .images-grid {
    grid-template-columns: 1fr;
  }
  
  .preview-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .modal-content {
    max-width: 95vw;
    max-height: 95vh;
  }
}
</style>