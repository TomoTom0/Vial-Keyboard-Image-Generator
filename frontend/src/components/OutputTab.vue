<template>
  <div class="output-tab">
    <div class="preview-container">
      <!-- Generated images -->
      <div v-if="outputImages.length > 0">
        <!-- separatedの場合は画像のみ表示、個別ダウンロードボタンなし -->
        <div v-if="outputFormat === 'separated'">
          <div 
            v-for="image in outputImages"
            :key="image.id"
            class="output-section"
          >
            <img 
              :src="getImageUrl(image)"
              :alt="getImageAlt(image)"
              class="output-image"
            />
          </div>
        </div>
        
        <!-- separated以外の場合は画像のみ表示 -->
        <div v-else>
          <div 
            v-for="image in outputImages"
            :key="image.id"
            class="output-section"
          >
            <img 
              :src="getImageUrl(image)"
              :alt="getImageAlt(image)"
              class="output-image"
            />
          </div>
        </div>
        
        <!-- ファイル名表示（画像の下） -->
        <div v-if="outputImages.length > 0" class="filename-section">
          <div class="filename-display">{{ getDownloadFilename() }}</div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-message">
          <h4>No Images Generated</h4>
          <p>Click the Generate button on the Preview tab to create your keyboard layout images.</p>
        </div>
      </div>
      
      <!-- Navigation buttons -->
      <div class="navigation-buttons">
        <button class="back-btn" @click="goBackToPreview">
          Back
        </button>
        
        <div class="right-button-area">
          <button 
            v-if="outputImages.length > 0" 
            class="download-btn-fixed" 
            @click="downloadAllAsZip"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useImagesStore } from '../stores/images'
import { useSettingsStore } from '../stores/settings'
import { useVialStore } from '../stores/vial'
import { useUiStore } from '../stores/ui'
import { embedMetadataToPng } from '../utils/pngMetadata'

interface GeneratedImage {
  id: string
  layer: number
  format?: 'separated' | 'vertical' | 'horizontal'
  dataUrl?: string
  url?: string  
  type: 'layer' | 'header' | 'combo'
  timestamp?: Date
  settings?: {
    keySize: number
    fontSize: number
    spacing: number
    showLabels: boolean
    darkMode: boolean
    language: string
  }
}

const imagesStore = useImagesStore()
const settingsStore = useSettingsStore()
const vialStore = useVialStore()
const uiStore = useUiStore()

// Store から取得するcomputed値 - generateFinalOutputImagesが設定したoutputImagesを使用
const outputImages = computed(() => imagesStore.outputImages)
const outputFormat = computed(() => settingsStore.outputFormat)

const getImageUrl = (image: GeneratedImage): string => {
  return image.dataUrl || image.url || ''
}

const getImageAlt = (image: GeneratedImage): string => {
  if (image.type === 'header') return 'Header'
  if (image.type === 'combo') return 'Combo'
  if (image.type === 'layer') return `Layer ${image.layer}`
  return image.id
}

const getImageFilename = (image: GeneratedImage): string => {
  // 生成時に設定されたfilenameがあればそれを使用
  if (image.filename) {
    return image.filename
  }
  
  // フォールバック（後方互換性のため）
  if (image.type === 'header') return 'keyboard-header.ytvil.png'
  if (image.type === 'combo') return 'keyboard-combo.ytvil.png'
  if (image.type === 'layer') return `keyboard-layer-${image.layer}.ytvil.png`
  return `keyboard-${image.id}.ytvil.png`
}

const getDownloadFilename = (): string => {
  if (outputFormat.value === 'separated') {
    // separatedフォーマットの場合はZIPファイル名（既存の命名規則に従う）
    if (outputImages.value.length > 0) {
      const firstImage = outputImages.value[0]
      const firstImageName = getImageFilename(firstImage)
      // 既存ファイル名からベース部分を抽出してZIP名を生成
      const baseName = firstImageName.replace(/-(L\d+|header|combo)-.*\.ytvil\.png$/, '')
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '').replace(/\./g, '')
      return `${baseName}-all-${timestamp}.ytvil.zip`
    }
    return 'ytomo-vial-kb-all.ytvil.zip'
  } else {
    // separated以外の場合は最初の画像のファイル名
    return outputImages.value.length > 0 ? getImageFilename(outputImages.value[0]) : ''
  }
}

const downloadSingle = (image: GeneratedImage) => {
  try {
    // 画像生成時に既にメタデータが埋め込まれているため、そのまま使用
    const downloadUrl = getImageUrl(image)
    const filename = getImageFilename(image)
    
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('❌ Download failed:', error)
  }
}

const downloadAllAsZip = async () => {
  try {
    // 動的にJSZipをインポート
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    // 各画像をZIPに追加
    for (const image of outputImages.value) {
      try {
        const imageUrl = getImageUrl(image)
        const filename = getImageFilename(image)
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        zip.file(filename, blob)
      } catch (error) {
        const filename = getImageFilename(image)
        console.warn(`Failed to add ${filename} to ZIP:`, error)
      }
    }
    
    // ZIPファイルを生成してダウンロード
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(zipBlob)
    link.download = getDownloadFilename()
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    
    console.log('ZIP download completed')
  } catch (error) {
    console.error('ZIP download failed:', error)
  }
}

// Previewタブに戻る
const goBackToPreview = () => {
  uiStore.setActiveTab('preview')
}
</script>

<style scoped lang="scss">
.output-tab {
  height: auto;
  min-height: 0;
  padding: 10px;
  background: #f5f5f5;
  overflow: visible;
}

.preview-container {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 15px;
  margin: 5px auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  min-height: 400px;
  max-width: calc(100vw - 40px);
  width: fit-content;
  transition: all 0.3s ease-in-out;
  box-sizing: border-box;
  overflow: visible;
}

.output-section {
  margin-bottom: 40px;
  text-align: center;
}

.output-image {
  max-width: 100%;
  max-height: 600px;
  height: auto;
  border: 2px solid var(--border-light);
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  object-fit: contain;
}

.download-section {
  margin-top: 20px;
}

.download-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.download-btn:hover {
  background: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.empty-message h4 {
  margin: 0 0 10px 0;
  color: var(--text-primary);
  font-size: 18px;
}

.empty-message p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.bulk-download-section {
  margin-top: 30px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #dee2e6;
}

.bulk-download-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(40, 167, 69, 0.2);

  &:hover {
    background: #218838;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

// Navigation buttons styles
.navigation-buttons {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #5a6268;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
}

.download-btn-fixed {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2);

  &:hover {
    background: #218838;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

.filename-section {
  text-align: center;
  margin: 30px 0 50px 0;
}

.filename-display {
  font-size: 14px;
  color: #495057;
  font-weight: 500;
  padding: 8px 16px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  display: inline-block;
  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.button-spacer {
  width: 96px; // Downloadボタンと同じ幅
  height: 40px; // Downloadボタンと同じ高さ
}
</style>