<template>
  <div class="output-tab">
    <div class="preview-container">
      <!-- Generated images -->
      <div v-if="outputImages.length > 0">
        <!-- separatedの場合は画像のみ表示、個別ダウンロードボタンなし -->
        <div v-if="settingsStore.outputFormat === 'separated'">
          <div 
            v-for="image in outputImages"
            :key="image.id"
            class="output-section"
          >
            <div class="image-container">
              <img 
                :src="getImageUrl(image)"
                :alt="getImageAlt(image)"
                class="output-image"
              />
              <div class="filename-overlay">{{ getDownloadFilename() }}</div>
              <button 
                class="download-overlay-btn"
                @click="downloadAllAsZip"
                title="Download"
              >
                Download
              </button>
            </div>
          </div>
        </div>
        
        <!-- separated以外の場合は画像のみ表示 -->
        <div v-else>
          <div 
            v-for="image in outputImages"
            :key="image.id"
            class="output-section"
          >
            <div class="image-container">
              <img 
                :src="getImageUrl(image)"
                :alt="getImageAlt(image)"
                class="output-image"
              />
              <div class="filename-overlay">{{ getDownloadFilename() }}</div>
              <button 
                class="download-overlay-btn"
                @click="downloadAllAsZip"
                title="Download"
              >
                Download
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
  if (image.type === 'header') return 'keyboard-header_ytvil.png'
  if (image.type === 'combo') return 'keyboard-combo_ytvil.png'
  if (image.type === 'layer') return `keyboard-layer-${image.layer}_ytvil.png`
  return `keyboard-${image.id}_ytvil.png`
}

// 圧縮タイムスタンプ生成（36進数）
const generateCompactTimestamp = (): string => {
  const now = new Date()
  // Unix timestampを36進数に変換（秒単位）
  const unixTimestamp = Math.floor(now.getTime() / 1000)
  return unixTimestamp.toString(36).toUpperCase()
}

// VILファイルの内容を取得
const getVilFileContent = (): string | null => {
  if (vialStore.selectedVialId === 'sample') {
    // サンプルファイルの場合は含めない
    return null
  }
  
  if (vialStore.currentVial?.content) {
    // Base64デコードしてテキスト内容を取得
    try {
      if (vialStore.currentVial.content.startsWith('data:')) {
        const base64Content = vialStore.currentVial.content.split(',')[1]
        return atob(base64Content)
      }
      return vialStore.currentVial.content
    } catch (error) {
      console.warn('Failed to decode VIL content:', error)
      return null
    }
  }
  
  return null
}

// VILファイル名を取得
const getVilFilename = (): string => {
  if (vialStore.currentVial?.name) {
    return vialStore.currentVial.name.endsWith('.vil') 
      ? vialStore.currentVial.name 
      : `${vialStore.currentVial.name}.vil`
  }
  return 'keyboard.vil'
}

const getDownloadFilename = (): string => {
  if (settingsStore.outputFormat === 'separated') {
    // separatedフォーマットの場合はZIPファイル名（既存の命名規則に従う）
    if (outputImages.value.length > 0) {
      const firstImage = outputImages.value[0]
      const firstImageName = getImageFilename(firstImage)
      // 既存ファイル名からベース部分を抽出してZIP名を生成
      const baseName = firstImageName.replace(/-(L\d+|header|combo)-.*_ytvil\.png$/, '')
      const timestamp = generateCompactTimestamp()
      return `${baseName}-all-${timestamp}_ytvil.zip`
    }
    return 'ytomo-vial-kb-all_ytvil.zip'
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
    
    // separatedフォーマットの場合、VILファイルも追加
    if (settingsStore.outputFormat === 'separated') {
      try {
        const vilContent = getVilFileContent()
        if (vilContent) {
          const vilFilename = getVilFilename()
          zip.file(vilFilename, vilContent)
        }
      } catch (error) {
        console.warn('Failed to add VIL file to ZIP:', error)
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
  // 画像倍率設定
  --image-scale: clamp(0.7, 2.5vw, 1.3);
  min-height: 400px;
  max-width: calc(100vw - 290px); // サイドバー250px + 余白40px
  width: 100%;
  transition: all 0.3s ease-in-out;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: visible;
  
  // サイドバー折りたたみ時の対応
  @media (max-width: 768px) {
    max-width: calc(100vw - 80px); // 折りたたみサイドバー40px + 余白40px
  }
}

.output-section {
  margin-bottom: 40px;
  text-align: center;
}

.output-image {
  max-height: 600px;
  height: auto;
  border: 2px solid var(--border-light);
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  object-fit: contain;
  transition: transform 0.2s;
  // 適応的スケール適用
  transform: scale(var(--image-scale, 1));
  transform-origin: center;
  // 横幅制限を削除してはみ出しを許可
  min-width: fit-content;
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

// Download overlay button styles
.download-overlay-btn {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(40, 167, 69, 0.9);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  
  &:hover {
    background: rgba(33, 136, 56, 0.95);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

.image-container {
  position: relative;
  display: inline-block;
}

.filename-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  pointer-events: none;
  backdrop-filter: blur(2px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

</style>