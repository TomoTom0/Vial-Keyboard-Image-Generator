<template>
  <div class="keyboard-tab">
    <div class="keyboard-layout-settings">
      <!-- キーボードレイアウト選択 -->
      <div class="format-selector">
        <button class="format-nav-btn" @click="cycleKeyboard(-1)">‹</button>
        <div class="format-current">
          <span class="format-name">{{ selectedKeyboard }}</span>
        </div>
        <button class="format-nav-btn" @click="cycleKeyboard(1)">›</button>
      </div>
      
      <!-- 言語選択 -->
      <div class="format-selector">
        <button class="format-nav-btn" @click="cycleLanguage(-1)">‹</button>
        <div class="format-current">
          <span class="format-name">{{ getLanguageName(selectedLayout) }}</span>
        </div>
        <button class="format-nav-btn" @click="cycleLanguage(1)">›</button>
      </div>
    </div>
    
    <div class="convert-section">
      <div class="convert-tool">
        <div class="convert-tool-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <span>Convert Vial</span>
        </div>
        <!-- 変換対象言語選択 -->
        <div class="format-selector convert-target">
          <button class="format-nav-btn" @click="cycleTargetLanguage(-1)">‹</button>
          <div class="format-current">
            <span class="format-name">{{ getLanguageName(targetLanguage) }}</span>
          </div>
          <button class="format-nav-btn" @click="cycleTargetLanguage(1)">›</button>
        </div>
        
        <!-- 変換ボタン -->
        <div class="convert-button-container convert-action">
          <button 
            class="convert-btn-full"
            :disabled="!canConvert"
            @click="handleConvert"
          >
            Convert
          </button>
        </div>
        
        <div v-if="convertStatus" class="convert-status" :class="convertStatus.type">
          {{ convertStatus.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVialStore } from '../stores/vial'
import { useSettingsStore } from '../stores/settings'
import { useImagesStore } from '../stores/images'

const props = defineProps<{
  selectedFile?: string | null
}>()

const selectedKeyboard = ref<string>('Corne v4')
const isConverting = ref(false)
const convertStatus = ref<{type: 'success' | 'error', message: string} | null>(null)

// storeの値を直接使用
const selectedLayout = computed(() => settingsStore.keyboardLanguage)
const targetLanguage = computed(() => settingsStore.keyboardLanguage === 'japanese' ? 'english' : 'japanese')


const canConvert = computed(() => {
  return vialStore.currentVial && 
         settingsStore.keyboardLanguage !== targetLanguage.value && 
         !isConverting.value
})

const vialStore = useVialStore()
const settingsStore = useSettingsStore()
const imagesStore = useImagesStore()

const handleLayoutChange = () => {
  console.log('Keyboard layout changed to:', selectedLayout.value)
  
  // 画像を再生成（sampleファイルでも言語変更の効果を確認するため）
  console.log('🔄 Current selectedVialId:', vialStore.selectedVialId)
  console.log('🔄 Regenerating preview images due to keyboard language change')
  
  // 画像を強制的にクリアしてから再生成
  imagesStore.clearImages()
  setTimeout(() => {
    imagesStore.generatePreviewImages()
  }, 50)
}

// 言語名を取得
const getLanguageName = (languageId: string) => {
  switch (languageId) {
    case 'japanese': return 'Japanese'
    case 'english': return 'English'
    default: return 'Japanese'
  }
}

// キーボードレイアウトを循環切り替え
const cycleKeyboard = (direction: number) => {
  const keyboards = ['Corne v4']
  const currentIndex = keyboards.indexOf(selectedKeyboard.value)
  let newIndex = (currentIndex + direction) % keyboards.length
  if (newIndex < 0) newIndex = keyboards.length - 1
  selectedKeyboard.value = keyboards[newIndex]
  // 将来的にキーボードタイプが変更された際の処理をここに追加
}

// レイアウト言語を循環切り替え
const cycleLanguage = (direction: number) => {
  const languages = ['japanese', 'english']
  const currentIndex = languages.indexOf(selectedLayout.value)
  let newIndex = (currentIndex + direction) % languages.length
  if (newIndex < 0) newIndex = languages.length - 1
  settingsStore.setKeyboardLanguage(languages[newIndex])
  handleLayoutChange()
}

// 変換対象言語を循環切り替え
const cycleTargetLanguage = (direction: number) => {
  const languages = ['japanese', 'english']
  const currentIndex = languages.indexOf(targetLanguage.value)
  let newIndex = (currentIndex + direction) % languages.length
  if (newIndex < 0) newIndex = languages.length - 1
  targetLanguage.value = languages[newIndex]
}

const handleConvert = async () => {
  if (!canConvert.value) return
  
  isConverting.value = true
  convertStatus.value = null
  
  try {
    const message = await vialStore.convertLanguage(settingsStore.keyboardLanguage, targetLanguage.value)
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
  padding: 0;
}

.keyboard-layout-settings {
  margin-bottom: 10px;
}

/* Generateブロックと同じスタイルを使用 */
.format-selector {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 2px;
  margin-bottom: 8px;
  box-sizing: border-box;
  max-width: 170px;
  overflow: hidden;
}

.format-nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  color: #666;
  font-size: 12px;
  font-weight: bold;
  border-radius: 2px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #e9ecef;
    color: #495057;
  }
}

.format-current {
  flex: 1;
  text-align: center;
  min-width: 0;
}

.format-name {
  font-size: 10px;
  color: #495057;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.convert-section {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #e9ecef;
}

.convert-tool {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  background: #fafbfc;
  box-sizing: border-box;
  max-width: 170px;
  position: relative;
}

.convert-tool-title {
  position: absolute;
  top: -8px;
  left: 12px;
  background: #fafbfc;
  padding: 0 4px;
  font-size: 9px;
  font-weight: 600;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 3px;
  
  svg {
    color: #6c757d;
  }
}

.convert-button-container {
  display: flex;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 8px;
}

.convert-target {
  max-width: 154px; /* convert-toolのパディングを考慮した幅制限 */
}

.convert-action {
  max-width: 154px; /* convert-toolのパディングを考慮した幅制限 */
}

.convert-btn-full {
  width: 100%;
  padding: 6px 12px;
  background: #007bff;
  border: none;
  border-radius: 3px;
  color: white;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  box-sizing: border-box;
  text-align: center;
  
  &:hover:not(:disabled) {
    background: #0056b3;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    opacity: 0.6;
  }
}


.convert-status {
  padding: 4px 6px;
  border-radius: 3px;
  font-size: 8px;
  text-align: center;
  max-width: 154px;
  word-wrap: break-word;
  box-sizing: border-box;
  
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