<template>
  <div class="settings">
    <div class="setting-group">
      <label class="label">Theme</label>
      <div class="options">
        <label class="option">
          <input type="radio" value="dark" v-model="settings.theme" @change="updateSettings" />
          <span>Dark</span>
        </label>
        <label class="option">
          <input type="radio" value="light" v-model="settings.theme" @change="updateSettings" />
          <span>Light</span>
        </label>
      </div>
    </div>

    <div class="setting-group">
      <label class="label">Format</label>
      <div class="options">
        <label class="option">
          <input type="radio" value="vertical" v-model="settings.format" @change="updateSettings" />
          <span>Vertical</span>
        </label>
        <label class="option">
          <input type="radio" value="horizontal" v-model="settings.format" @change="updateSettings" />
          <span>Horizontal</span>
        </label>
        <label class="option">
          <input type="radio" value="individual" v-model="settings.format" @change="updateSettings" />
          <span>Individual</span>
        </label>
      </div>
    </div>

    <div class="setting-group">
      <label class="label">Layers</label>
      <div class="layer-range">
        <select v-model="settings.layerRange.start" @change="updateSettings">
          <option :value="0">0</option>
          <option :value="1">1</option>
          <option :value="2">2</option>
          <option :value="3">3</option>
        </select>
        <span>-</span>
        <select v-model="settings.layerRange.end" @change="updateSettings">
          <option :value="0">0</option>
          <option :value="1">1</option>
          <option :value="2">2</option>
          <option :value="3">3</option>
        </select>
      </div>
    </div>

    <div class="setting-group">
      <label class="checkbox-option">
        <input type="checkbox" v-model="settings.showComboInfo" @change="updateSettings" />
        <span>Show combos</span>
      </label>
    </div>

    <button
      class="generate-btn"
      :disabled="!canGenerate"
      @click="handleGenerate"
    >
      Generate
    </button>
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

<style scoped lang="scss">
.settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-group {
  /* margin-bottom: 1rem; */
}

.label {
  display: block;
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
}

.layer-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.layer-range select {
  padding: 0.375rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: white;
  font-size: 0.95rem;
}

.layer-range span {
  color: #6c757d;
}

.generate-btn {
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 0.5rem;
}

.generate-btn:hover:not(:disabled) {
  background: #0b5ed7;
}

.generate-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}
</style>