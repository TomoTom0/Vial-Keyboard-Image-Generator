<template>
  <div class="output-tab">
    <div class="tab-header">
      <h3>Generated Images</h3>
      <p class="header-description">
        Your final keyboard layout images are ready for download.
      </p>
    </div>
    
    <div class="output-content">
      <!-- Generated images -->
      <div v-if="outputImages.length > 0" class="output-section">
        <div class="output-stats">
          <div class="stat-item">
            <div class="stat-value">{{ outputImages.length }}</div>
            <div class="stat-label">Images Generated</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ getTotalFileSize() }}</div>
            <div class="stat-label">Total Size</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ getGenerationTime() }}</div>
            <div class="stat-label">Generated</div>
          </div>
        </div>
        
        <div class="images-grid">
          <div 
            v-for="image in outputImages"
            :key="image.id"
            class="image-item"
          >
            <div class="image-container">
              <img 
                :src="getImageUrl(image)"
                :alt="image.filename"
                class="output-image"
                @click="showImageModal(image)"
              />
              <div class="image-actions">
                <button 
                  class="action-btn preview-btn"
                  @click="showImageModal(image)"
                  title="Preview"
                >
                  👁️
                </button>
                <button 
                  class="action-btn download-btn"
                  @click="downloadSingle(image)"
                  title="Download"
                >
                  ⬇️
                </button>
              </div>
            </div>
            <div class="image-info">
              <div class="image-filename">{{ image.filename }}</div>
              <div class="image-meta">
                {{ getImageTypeText(image) }} • {{ formatFileSize(getCurrentImageSize(image)) }}
                <span v-if="image.previewUrl && showPreview" class="preview-indicator">• Preview</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty state -->
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">No Images Generated</div>
        <div class="empty-description">
          Go to the Preview tab and click "Generate Final Images" to create your keyboard layout images.
        </div>
      </div>
    </div>
    
    <!-- Download actions -->
    <div class="action-area" v-if="outputImages.length > 0">
      <div class="download-options">
        <label class="preview-toggle">
          <input type="checkbox" v-model="showPreview" />
          <span>Preview Mode</span>
        </label>
      </div>
      
      <div class="download-buttons">
        <button 
          class="download-btn individual"
          @click="downloadIndividual"
        >
          Download Individual
        </button>
        <button 
          class="download-btn zip"
          @click="downloadZip"
        >
          Download as ZIP
        </button>
      </div>
    </div>
    
    <!-- Image modal -->
    <div v-if="selectedImage" class="image-modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>{{ selectedImage.filename }}</h4>
          <div class="modal-actions">
            <button 
              class="modal-btn download"
              @click="downloadSingle(selectedImage)"
            >
              Download
            </button>
            <button class="close-btn" @click="closeModal">×</button>
          </div>
        </div>
        <div class="modal-image">
          <img 
            :src="getImageUrl(selectedImage)"
            :alt="selectedImage.filename"
          />
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
  outputImages: GeneratedImage[]
}>()

const emit = defineEmits<{
  download: [format: 'individual' | 'zip']
}>()

const selectedImage = ref<GeneratedImage | null>(null)
const showPreview = ref(true)

const getImageUrl = (image: GeneratedImage): string => {
  const targetUrl = (showPreview.value && image.previewUrl) ? image.previewUrl : image.url
  
  if (targetUrl.startsWith('/api/')) {
    return `http://localhost:3001${targetUrl}`
  }
  return targetUrl
}

const getCurrentImageSize = (image: GeneratedImage): number => {
  return (showPreview.value && image.previewSize) ? image.previewSize : image.size
}

const getImageTypeText = (image: GeneratedImage): string => {
  if (image.type === 'combined') {
    return 'Combined'
  } else if (image.type === 'layer') {
    return `Layer ${image.layer}`
  }
  return 'Image'
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getTotalFileSize = (): string => {
  const total = props.outputImages.reduce((sum, img) => {
    return sum + getCurrentImageSize(img)
  }, 0)
  return formatFileSize(total)
}

const getGenerationTime = (): string => {
  if (props.outputImages.length === 0) return 'N/A'
  
  const latest = props.outputImages.reduce((latest, img) => {
    return img.timestamp > latest ? img.timestamp : latest
  }, props.outputImages[0].timestamp)
  
  const now = new Date()
  const diff = now.getTime() - latest.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

const showImageModal = (image: GeneratedImage) => {
  selectedImage.value = image
}

const closeModal = () => {
  selectedImage.value = null
}

const downloadSingle = (image: GeneratedImage) => {
  try {
    const link = document.createElement('a')
    link.href = getImageUrl(image)
    link.download = image.filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log('Downloaded:', image.filename)
  } catch (error) {
    console.error('Download failed:', error)
  }
}

const downloadIndividual = () => {
  emit('download', 'individual')
}

const downloadZip = () => {
  emit('download', 'zip')
}
</script>

<style scoped>
.output-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.tab-header h3 {
  margin: 0 0 0.5rem 0;
  color: #212529;
  font-size: 1.25rem;
}

.header-description {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.output-content {
  flex: 1;
}

/* Stats */
.output-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #0d6efd;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Images grid */
.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.image-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.image-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.image-container {
  position: relative;
  aspect-ratio: 16/10;
  background: #f8f9fa;
  overflow: hidden;
}

.output-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
}

.image-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-item:hover .image-actions {
  opacity: 1;
}

.action-btn {
  background: rgba(0,0,0,0.7);
  color: white;
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: rgba(0,0,0,0.9);
}

.image-info {
  padding: 1rem;
}

.image-filename {
  font-weight: 500;
  color: #212529;
  margin-bottom: 0.25rem;
  word-break: break-all;
}

.image-meta {
  font-size: 0.8rem;
  color: #6c757d;
}

.preview-indicator {
  color: #0d6efd;
  font-weight: 500;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 1rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #495057;
}

.empty-description {
  color: #6c757d;
  max-width: 400px;
}

/* Action area */
.action-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
}

.download-options {
  display: flex;
  align-items: center;
}

.preview-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6c757d;
  cursor: pointer;
}

.download-buttons {
  display: flex;
  gap: 1rem;
}

.download-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.download-btn.individual {
  background: #0d6efd;
  color: white;
}

.download-btn.individual:hover {
  background: #0b5ed7;
}

.download-btn.zip {
  background: #198754;
  color: white;
}

.download-btn.zip:hover {
  background: #157347;
}

/* Modal */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h4 {
  margin: 0;
  color: #212529;
  flex: 1;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-btn {
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-image {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: #f8f9fa;
  padding: 1rem;
}

.modal-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #0d6efd;
}

@media (max-width: 768px) {
  .images-grid {
    grid-template-columns: 1fr;
  }
  
  .action-area {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .download-buttons {
    justify-content: center;
  }
  
  .image-modal {
    padding: 1rem;
  }
}
</style>