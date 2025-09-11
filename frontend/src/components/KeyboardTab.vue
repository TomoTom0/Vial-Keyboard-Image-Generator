<template>
  <div class="keyboard-tab">
    <div class="keyboard-layout-settings">
      <div class="layout-select-group">
        <label for="keyboard-layout">Layout:</label>
        <select 
          id="keyboard-layout" 
          v-model="selectedLayout" 
          @change="handleLayoutChange"
          class="layout-dropdown"
        >
          <option value="japanese">Japanese</option>
          <option value="english">English</option>
        </select>
      </div>
    </div>
    
    <div class="convert-section">
      <div class="convert-row">
        <div class="convert-group">
          <label>Convert to:</label>
          <select v-model="targetLanguage" class="select-input">
            <option value="japanese">Japanese</option>
            <option value="english">English</option>
          </select>
        </div>
        
        <button 
          class="convert-btn"
          :disabled="!canConvert"
          :class="{ 'converting': isConverting }"
          @click="handleConvert"
        >
          <span v-if="isConverting">Converting...</span>
          <span v-else>Convert</span>
        </button>
        
        <div v-if="convertStatus" class="convert-status" :class="convertStatus.type">
          {{ convertStatus.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getCurrentKeyboardLanguage } from '../utils/keyboardConfig'
import { useVialStore } from '../stores/vial'
import { useSettingsStore } from '../stores/settings'
import { useImagesStore } from '../stores/images'

const props = defineProps<{
  selectedFile?: string | null
}>()

const selectedLayout = ref<string>('japanese')
const targetLanguage = ref<string>('english')
const isConverting = ref(false)
const convertStatus = ref<{type: 'success' | 'error', message: string} | null>(null)

// 現在の設定から初期値を読み込み
onMounted(() => {
  const currentLanguage = getCurrentKeyboardLanguage()
  selectedLayout.value = currentLanguage.id
  targetLanguage.value = currentLanguage.id === 'japanese' ? 'english' : 'japanese'
})

const canConvert = computed(() => {
  const currentLanguage = getCurrentKeyboardLanguage()
  return vialStore.currentVial && 
         currentLanguage.id !== targetLanguage.value && 
         !isConverting.value
})

const vialStore = useVialStore()
const settingsStore = useSettingsStore()
const imagesStore = useImagesStore()

const handleLayoutChange = () => {
  console.log('Keyboard layout changed to:', selectedLayout.value)
  settingsStore.setKeyboardLanguage(selectedLayout.value)
  
  // 画像を再生成（sampleファイルでも言語変更の効果を確認するため）
  console.log('🔄 Current selectedVialId:', vialStore.selectedVialId)
  console.log('🔄 Regenerating preview images due to keyboard language change')
  imagesStore.generatePreviewImages()
}

const handleConvert = async () => {
  if (!canConvert.value) return
  
  isConverting.value = true
  convertStatus.value = null
  
  try {
    const currentLanguage = getCurrentKeyboardLanguage()
    const message = await vialStore.convertLanguage(currentLanguage.id, targetLanguage.value)
    convertStatus.value = { type: 'success', message }
    
  } catch (error) {
    console.error('Convert error:', error)
    const errorMessage = error instanceof Error ? error.message : '不明なエラー'
    convertStatus.value = { type: 'error', message: `変換エラー: ${errorMessage}` }
  }
  
  isConverting.value = false
  
  // 3秒後にメッセージをクリア
  setTimeout(() => {
    convertStatus.value = null
  }, 3000)
}
</script>

<style scoped lang="scss">
.keyboard-tab {
  padding: 20px 0;
}

.layout-select-group {
  display: flex;
  align-items: center;
  gap: 12px;

  label {
    font-size: 14px;
    font-weight: 500;
    color: #555;
    min-width: 50px;
  }

  .layout-dropdown {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    background: white;
    color: #333;
    cursor: pointer;
    min-width: 120px;
    
    &:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
    }
    
    option {
      color: #333;
      background: white;
    }
  }
}

.convert-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.convert-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.convert-group {
  display: flex;
  align-items: center;
  gap: 8px;
  
  label {
    font-size: 14px;
    font-weight: 500;
    color: #666;
    min-width: 30px;
  }
  
  .select-input {
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
    background: white;
    color: #333;
    min-width: 90px;
    
    &:focus {
      outline: none;
      border-color: #007bff;
    }
  }
}

.convert-btn {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  color: white;
  background: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover:not(:disabled) {
    background: #0056b3;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  &.converting {
    background: #28a745;
  }
}

.convert-status {
  margin-top: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  
  &.success {
    color: #28a745;
    background: #d4edda;
    border: 1px solid #28a745;
  }
  
  &.error {
    color: #dc3545;
    background: #f8d7da;
    border: 1px solid #dc3545;
  }
}
</style>