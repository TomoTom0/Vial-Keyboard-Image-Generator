<template>
  <div class="generate-settings">
    <h2>画像生成設定</h2>
    
    <div class="settings-grid">
      <!-- テーマ選択 -->
      <div class="setting-group">
        <label class="setting-label">テーマ</label>
        <div class="theme-options">
          <label class="radio-option">
            <input
              type="radio"
              :value="'dark'"
              v-model="settings.theme"
              @change="updateSettings"
            />
            <span class="radio-text">
              🌙 ダークモード
            </span>
          </label>
          <label class="radio-option">
            <input
              type="radio"
              :value="'light'"
              v-model="settings.theme"
              @change="updateSettings"
            />
            <span class="radio-text">
              ☀️ ライトモード
            </span>
          </label>
        </div>
      </div>

      <!-- 出力形式選択 -->
      <div class="setting-group">
        <label class="setting-label">出力形式</label>
        <div class="format-options">
          <label class="radio-option">
            <input
              type="radio"
              :value="'vertical'"
              v-model="settings.format"
              @change="updateSettings"
            />
            <span class="radio-text">
              📱 縦並び
            </span>
          </label>
          <label class="radio-option">
            <input
              type="radio"
              :value="'horizontal'"
              v-model="settings.format"
              @change="updateSettings"
            />
            <span class="radio-text">
              💻 横並び
            </span>
          </label>
          <label class="radio-option">
            <input
              type="radio"
              :value="'individual'"
              v-model="settings.format"
              @change="updateSettings"
            />
            <span class="radio-text">
              🔢 個別レイヤー
            </span>
          </label>
        </div>
      </div>

      <!-- レイヤー範囲設定 -->
      <div class="setting-group">
        <label class="setting-label">レイヤー範囲</label>
        <div class="layer-range">
          <div class="range-inputs">
            <div class="range-input">
              <label for="layer-start">開始</label>
              <select
                id="layer-start"
                v-model="settings.layerRange.start"
                @change="updateSettings"
              >
                <option :value="0">レイヤー 0</option>
                <option :value="1">レイヤー 1</option>
                <option :value="2">レイヤー 2</option>
                <option :value="3">レイヤー 3</option>
              </select>
            </div>
            <span class="range-separator">〜</span>
            <div class="range-input">
              <label for="layer-end">終了</label>
              <select
                id="layer-end"
                v-model="settings.layerRange.end"
                @change="updateSettings"
              >
                <option :value="0">レイヤー 0</option>
                <option :value="1">レイヤー 1</option>
                <option :value="2">レイヤー 2</option>
                <option :value="3">レイヤー 3</option>
              </select>
            </div>
          </div>
          <p class="layer-hint">
            生成するレイヤーの範囲を指定してください
          </p>
        </div>
      </div>

      <!-- コンボ情報表示 -->
      <div class="setting-group">
        <label class="setting-label">追加オプション</label>
        <div class="checkbox-options">
          <label class="checkbox-option">
            <input
              type="checkbox"
              v-model="settings.showComboInfo"
              @change="updateSettings"
            />
            <span class="checkbox-text">
              🎯 コンボ情報を表示
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- プレビュー -->
    <div class="settings-preview">
      <h3>設定プレビュー</h3>
      <div class="preview-card">
        <div class="preview-item">
          <span class="preview-label">テーマ:</span>
          <span class="preview-value">{{ themeText }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">出力形式:</span>
          <span class="preview-value">{{ formatText }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">レイヤー:</span>
          <span class="preview-value">{{ layerRangeText }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">コンボ情報:</span>
          <span class="preview-value">{{ settings.showComboInfo ? '表示' : '非表示' }}</span>
        </div>
      </div>
    </div>

    <!-- 生成ボタン -->
    <div class="generate-action">
      <button
        class="generate-button"
        :disabled="!canGenerate || isGenerating"
        @click="handleGenerate"
      >
        <span v-if="isGenerating">🔄 生成中...</span>
        <span v-else>✨ 画像を生成</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface GenerateSettings {
  theme: 'dark' | 'light'
  format: 'vertical' | 'horizontal' | 'individual'
  layerRange: {
    start: number
    end: number
  }
  showComboInfo: boolean
}

const props = defineProps<{
  canGenerate: boolean
  isGenerating: boolean
}>()

const emit = defineEmits<{
  generate: [settings: GenerateSettings]
  settingsChanged: [settings: GenerateSettings]
}>()

const settings = ref<GenerateSettings>({
  theme: 'dark',
  format: 'vertical',
  layerRange: {
    start: 0,
    end: 3
  },
  showComboInfo: true
})

// テキスト表示用の computed
const themeText = computed(() => {
  return settings.value.theme === 'dark' ? 'ダークモード' : 'ライトモード'
})

const formatText = computed(() => {
  const formatMap = {
    vertical: '縦並び',
    horizontal: '横並び',
    individual: '個別レイヤー'
  }
  return formatMap[settings.value.format]
})

const layerRangeText = computed(() => {
  const { start, end } = settings.value.layerRange
  if (start === end) {
    return `レイヤー ${start}`
  }
  return `レイヤー ${start} 〜 ${end}`
})

// 設定更新処理
const updateSettings = () => {
  // レイヤー範囲の妥当性チェック
  if (settings.value.layerRange.start > settings.value.layerRange.end) {
    settings.value.layerRange.end = settings.value.layerRange.start
  }

  // 設定をローカルストレージに保存
  saveSettings()
  
  // 親コンポーネントに設定変更を通知
  emit('settingsChanged', { ...settings.value })
}

// 生成実行
const handleGenerate = () => {
  if (props.canGenerate && !props.isGenerating) {
    emit('generate', { ...settings.value })
  }
}

// 設定の保存
const saveSettings = () => {
  try {
    localStorage.setItem('vial-generate-settings', JSON.stringify(settings.value))
  } catch (error) {
    console.warn('Failed to save settings:', error)
  }
}

// 設定の読み込み
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('vial-generate-settings')
    if (saved) {
      const parsed = JSON.parse(saved) as GenerateSettings
      
      // 設定の妥当性チェック
      if (parsed.theme && ['dark', 'light'].includes(parsed.theme)) {
        settings.value.theme = parsed.theme
      }
      
      if (parsed.format && ['vertical', 'horizontal', 'individual'].includes(parsed.format)) {
        settings.value.format = parsed.format
      }
      
      if (parsed.layerRange && 
          typeof parsed.layerRange.start === 'number' && 
          typeof parsed.layerRange.end === 'number' &&
          parsed.layerRange.start >= 0 && parsed.layerRange.start <= 3 &&
          parsed.layerRange.end >= 0 && parsed.layerRange.end <= 3 &&
          parsed.layerRange.start <= parsed.layerRange.end) {
        settings.value.layerRange = parsed.layerRange
      }
      
      if (typeof parsed.showComboInfo === 'boolean') {
        settings.value.showComboInfo = parsed.showComboInfo
      }
    }
  } catch (error) {
    console.warn('Failed to load settings:', error)
  }
}

onMounted(() => {
  loadSettings()
  // 初期設定を親に通知
  emit('settingsChanged', { ...settings.value })
})
</script>

<style scoped>
.generate-settings {
  width: 100%;
  max-width: 500px;
}

.generate-settings h2 {
  font-size: 1.5rem;
  color: #2d3748;
  margin-bottom: 1.5rem;
  text-align: center;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-group {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
}

.setting-label {
  display: block;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.theme-options,
.format-options,
.checkbox-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-option,
.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.radio-option:hover,
.checkbox-option:hover {
  background: #edf2f7;
}

.radio-text,
.checkbox-text {
  font-size: 0.95rem;
  color: #2d3748;
}

input[type="radio"],
input[type="checkbox"] {
  margin: 0;
}

.layer-range {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.range-input {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.range-input label {
  font-size: 0.85rem;
  color: #718096;
}

.range-input select {
  padding: 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  background: white;
  font-size: 0.9rem;
}

.range-separator {
  color: #a0aec0;
  font-weight: bold;
  margin-top: 1.25rem;
}

.layer-hint {
  font-size: 0.85rem;
  color: #718096;
  margin: 0;
}

.settings-preview {
  margin-top: 2rem;
}

.settings-preview h3 {
  font-size: 1.2rem;
  color: #4a5568;
  margin-bottom: 1rem;
}

.preview-card {
  background: #edf2f7;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-label {
  font-weight: 500;
  color: #4a5568;
}

.preview-value {
  color: #2d3748;
  font-weight: 600;
}

.generate-action {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

.generate-button {
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.generate-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #3182ce, #2c5282);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.generate-button:disabled {
  background: #a0aec0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@media (max-width: 640px) {
  .range-inputs {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .range-separator {
    margin: 0;
    align-self: center;
  }
  
  .preview-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>