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
    <!-- ヘッダー -->
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">
          ⌨️ Vial Keyboard Image Generator
        </h1>
        <p class="app-description">
          Vial設定ファイルからキーボードレイアウト画像を生成
        </p>
      </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="app-main">
      <div class="main-content">
        
        <!-- アップロードセクション -->
        <section class="upload-section">
          <div class="section-header">
            <h2>📁 ファイルアップロード</h2>
          </div>
          <FileUpload
            @file-selected="handleFileSelected"
            @error="handleFileError"
          />
          <div v-if="uploadError" class="upload-error">
            ⚠️ {{ uploadError }}
          </div>
        </section>

        <!-- 設定セクション -->
        <section class="settings-section" :class="{ disabled: !hasFile }">
          <div class="section-header">
            <h2>⚙️ 生成設定</h2>
          </div>
          <GenerateSettings
            :can-generate="hasFile && !isGenerating"
            :is-generating="isGenerating"
            @settings-changed="handleSettingsChanged"
            @generate="handleGenerate"
          />
        </section>

        <!-- プレビューセクション -->
        <section class="preview-section">
          <div class="section-header">
            <h2>🖼️ プレビュー</h2>
          </div>
          <ImagePreview
            :images="images"
            :is-generating="isGenerating"
            :error="error"
            :progress="progress"
            @retry="handleRetry"
            @image-downloaded="handleImageDownloaded"
          />
        </section>

      </div>
    </main>

    <!-- フッター -->
    <footer class="app-footer">
      <div class="footer-content">
        <p>&copy; 2024 Vial Keyboard Image Generator</p>
        <div class="footer-links">
          <a href="https://github.com/vial-kb/vial-gui" target="_blank">Vial GUI</a>
          <a href="https://get.vial.today/" target="_blank">Vial</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* ヘッダー */
.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 2rem 1rem;
  text-align: center;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
}

.app-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-description {
  font-size: 1.1rem;
  color: #718096;
  margin: 0;
}

/* メインコンテンツ */
.app-main {
  flex: 1;
  padding: 2rem 1rem;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

/* セクション */
.upload-section,
.settings-section,
.preview-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: opacity 0.3s ease;
}

.settings-section.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.section-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.section-header h2 {
  font-size: 1.8rem;
  color: #2d3748;
  margin: 0;
  font-weight: 600;
}

/* エラー表示 */
.upload-error {
  margin-top: 1rem;
  padding: 1rem;
  background: #fed7d7;
  border: 1px solid #fc8181;
  border-radius: 8px;
  color: #c53030;
  text-align: center;
  font-weight: 500;
}

/* フッター */
.app-footer {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1.5rem 1rem;
  text-align: center;
}

.footer-content {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.footer-content p {
  margin: 0;
  color: #718096;
  font-size: 0.9rem;
}

.footer-links {
  display: flex;
  gap: 1rem;
}

.footer-links a {
  color: #4299e1;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: #3182ce;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .app-title {
    font-size: 2rem;
  }
  
  .app-description {
    font-size: 1rem;
  }
  
  .main-content {
    gap: 2rem;
  }
  
  .upload-section,
  .settings-section,
  .preview-section {
    padding: 1.5rem;
  }
  
  .section-header h2 {
    font-size: 1.5rem;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 1.5rem 1rem;
  }
  
  .app-main {
    padding: 1.5rem 1rem;
  }
  
  .upload-section,
  .settings-section,
  .preview-section {
    padding: 1.25rem;
    margin: 0 -0.25rem;
  }
}

/* アニメーション */
.upload-section,
.settings-section,
.preview-section {
  animation: fadeInUp 0.6s ease-out;
}

.settings-section {
  animation-delay: 0.1s;
}

.preview-section {
  animation-delay: 0.2s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* スクロールバー */
:deep(.main-content) {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 transparent;
}

:deep(.main-content::-webkit-scrollbar) {
  width: 8px;
}

:deep(.main-content::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.main-content::-webkit-scrollbar-thumb) {
  background-color: #cbd5e0;
  border-radius: 4px;
}

:deep(.main-content::-webkit-scrollbar-thumb:hover) {
  background-color: #a0aec0;
}
</style>
