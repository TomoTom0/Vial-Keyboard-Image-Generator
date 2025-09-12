<template>
  <div class="format-selector">
    <div class="format-controls">
      <button 
        class="nav-btn"
        @click="previousFormat"
        :disabled="currentIndex === 0"
      >
        ←
      </button>
      
      <div class="format-display">
        <div class="format-image">
          <img 
            :src="getCurrentFormat().image" 
            :alt="getCurrentFormat().name"
            class="keyboard-preview"
          />
        </div>
        <div class="format-name">{{ getCurrentFormat().name }}</div>
      </div>
      
      <button 
        class="nav-btn"
        @click="nextFormat"
        :disabled="currentIndex === formats.length - 1"
      >
        →
      </button>
    </div>
    
    <div class="format-indicators">
      <div 
        v-for="(format, index) in formats"
        :key="format.id"
        :class="['indicator', { 'active': index === currentIndex }]"
        @click="selectFormat(index)"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface KeyboardFormat {
  id: string
  name: string
  image: string
  description: string
}

const props = defineProps<{
  currentFormat: string
}>()

const emit = defineEmits<{
  formatChanged: [format: string]
}>()

// Available formats
const formats: KeyboardFormat[] = [
  {
    id: 'default',
    name: 'Standard Layout',
    image: '/images/keyboard-layouts/standard.png',
    description: 'Standard keyboard layout'
  }
  // Add more formats as they become available
]

const currentIndex = ref(0)

const getCurrentFormat = () => {
  return formats[currentIndex.value] || formats[0]
}

const previousFormat = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    emit('formatChanged', getCurrentFormat().id)
  }
}

const nextFormat = () => {
  if (currentIndex.value < formats.length - 1) {
    currentIndex.value++
    emit('formatChanged', getCurrentFormat().id)
  }
}

const selectFormat = (index: number) => {
  currentIndex.value = index
  emit('formatChanged', getCurrentFormat().id)
}

// Watch for external format changes
watch(() => props.currentFormat, (newFormat) => {
  const index = formats.findIndex(f => f.id === newFormat)
  if (index >= 0) {
    currentIndex.value = index
  }
})
</script>

<style scoped lang="scss">
.format-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.format-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-btn {
  background: white;
  border: 1px solid #ced4da;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.nav-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #adb5bd;
}

.nav-btn:disabled {
  background: #f8f9fa;
  color: #ced4da;
  cursor: not-allowed;
}

.format-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.format-image {
  width: 200px;
  height: 100px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.keyboard-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.format-name {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  text-align: center;
}

.format-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ced4da;
  cursor: pointer;
  transition: all 0.2s;
}

.indicator.active {
  background: #0d6efd;
}

.indicator:hover {
  background: #adb5bd;
}

.indicator.active:hover {
  background: #0b5ed7;
}

/* Show placeholder when no image available */
.keyboard-preview[src=""],
.keyboard-preview:not([src]) {
  display: none;
}

.format-image:has(.keyboard-preview[src=""]),
.format-image:has(.keyboard-preview:not([src])) {
  position: relative;
}

.format-image:has(.keyboard-preview[src=""]):before,
.format-image:has(.keyboard-preview:not([src])):before {
  content: "⌨️";
  font-size: 1.5rem;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>