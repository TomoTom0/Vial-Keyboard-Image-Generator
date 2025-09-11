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
          <!-- separatedの場合の一括ダウンロードボタン -->
          <div class="bulk-download-section">
            <button 
              class="bulk-download-btn"
              @click="downloadAllAsZip"
            >
              Download All Images (ZIP)
            </button>
          </div>
        </div>
        
        <!-- separated以外の場合は従来通り個別ダウンロードボタン付き -->
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
            <div class="download-section">
              <button 
                class="download-btn"
                @click="downloadSingle(image)"
              >
                Download {{ getImageFilename(image) }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-message">
          <h4>No Images Generated</h4>
          <p>Click the Generate button on the Preview tab to create your keyboard layout images.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useImagesStore } from '../stores/images'
import { useSettingsStore } from '../stores/settings'

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

// Store から取得するcomputed値
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
  if (image.type === 'header') return 'keyboard-header.png'
  if (image.type === 'combo') return 'keyboard-combo.png'
  if (image.type === 'layer') return `keyboard-layer-${image.layer}.png`
  return `keyboard-${image.id}.png`
}

const downloadSingle = (image: GeneratedImage) => {
  try {
    const link = document.createElement('a')
    const imageUrl = getImageUrl(image)
    const filename = getImageFilename(image)
    
    link.href = imageUrl
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log('Downloaded:', filename)
  } catch (error) {
    console.error('Download failed:', error)
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
    link.download = 'keyboard-layout-images.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    
    console.log('ZIP download completed')
  } catch (error) {
    console.error('ZIP download failed:', error)
  }
}
</script>

<style scoped lang="scss">
.output-tab {
  height: auto;
  min-height: 0;
  padding: 10px;
  background: #f5f5f5;
}

.preview-container {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 15px;
  margin: 5px auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: calc(100vw - 20px);
  width: fit-content;
  transition: all 0.3s ease-in-out;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
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
</style>