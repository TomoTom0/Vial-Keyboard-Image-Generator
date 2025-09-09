<script setup lang="ts">
import { ref, onMounted } from 'vue'
import FileUpload from './components/FileUpload.vue'
import GenerateSettings from './components/GenerateSettings.vue'
import ImagePreview from './components/ImagePreview.vue'
import { useFileUpload } from './composables/useFileUpload'
import { useImageGeneration, type GenerationOptions } from './composables/useImageGeneration'

// Composables
const {
  currentFile,
  hasFile,
  fileInfo,
  setFile,
  clearFile,
  validateFile
} = useFileUpload()

const {
  images,
  isGenerating,
  error,
  progress,
  generateImages,
  clearError,
  testApiConnection
} = useImageGeneration()

// Settings
const currentSettings = ref<GenerationOptions>({
  theme: 'dark',
  format: 'vertical',
  layerRange: { start: 0, end: 3 },
  showComboInfo: true
})

const uploadError = ref<string | null>(null)

// ファイル選択処理
const handleFileSelected = (file: File) => {
  uploadError.value = null
  
  const validationError = validateFile(file)
  if (validationError) {
    uploadError.value = validationError
    return
  }
  
  setFile(file)
  console.log('📁 File selected:', file.name)
}

// ファイル選択エラー処理
const handleFileError = (message: string) => {
  uploadError.value = message
}

// 設定変更処理
const handleSettingsChanged = (settings: GenerationOptions) => {
  currentSettings.value = settings
  console.log('⚙️ Settings changed:', settings)
}

// 画像生成処理
const handleGenerate = async (settings: GenerationOptions) => {
  if (!currentFile.value) {
    uploadError.value = 'ファイルが選択されていません'
    return
  }

  try {
    clearError()
    uploadError.value = null
    
    await generateImages(currentFile.value.file, settings)
    
    console.log('✅ Generation completed successfully')
  } catch (err) {
    console.error('❌ Generation failed:', err)
  }
}

// 再試行処理
const handleRetry = () => {
  if (currentFile.value) {
    handleGenerate(currentSettings.value)
  }
}

// 画像ダウンロード処理
const handleImageDownloaded = (image: any) => {
  console.log('💾 Image downloaded:', image.filename)
}

// API接続テスト
const checkApiConnection = async () => {
  try {
    await testApiConnection()
  } catch (err) {
    console.warn('API接続に問題があります:', err)
  }
}

// 初期化
onMounted(() => {
  checkApiConnection()
})
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>Vial Image Generator</h1>
    </header>

    <main class="main">
      <div class="sidebar">
        <FileUpload
          @file-selected="handleFileSelected"
          @error="handleFileError"
        />
        <div v-if="uploadError" class="error">{{ uploadError }}</div>
        
        <GenerateSettings
          :can-generate="hasFile && !isGenerating"
          :is-generating="isGenerating"
          @settings-changed="handleSettingsChanged"
          @generate="handleGenerate"
        />
      </div>

      <div class="content">
        <ImagePreview
          :images="images"
          :is-generating="isGenerating"
          :error="error"
          :progress="progress"
          @retry="handleRetry"
          @image-downloaded="handleImageDownloaded"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

.header {
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 1rem 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
}

.main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 320px;
  background: white;
  border-right: 1px solid #e9ecef;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  background: #f8f9fa;
}

.error {
  padding: 0.75rem;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  color: #721c24;
  font-size: 0.875rem;
}
</style>
