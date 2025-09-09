<template>
  <div class="preview-tab">
    <div class="main-keyboard-display">
      <img 
        :src="getPreviewImageUrl()"
        alt="Preview keyboard layout"
        class="main-keyboard-image"
      />
    </div>
    
    <!-- Combo section like in the design -->
    <div class="combos-section">
      <div class="combo-header">COMBOS</div>
      <div class="combo-list">
        <div class="combo-item">
          <span class="combo-number">#0</span>
          <div class="combo-keys">
            <span class="combo-key">MO(1)</span>
            <span class="combo-key">SPACE</span>
          </div>
          <span class="combo-result">J</span>
        </div>
        <div class="combo-item">
          <span class="combo-number">#1</span>
          <div class="combo-keys">
            <span class="combo-key">MO(1)</span>
            <span class="combo-key">SPACE</span>
          </div>
          <span class="combo-result">F</span>
        </div>
        <div class="combo-item">
          <span class="combo-number">#2</span>
          <div class="combo-keys">
            <span class="combo-key">Esc</span>
            <span class="combo-key">Caps</span>
            <span class="combo-key">F</span>
          </div>
          <span class="combo-result">#2</span>
        </div>
        <div class="combo-item">
          <span class="combo-number">#3</span>
          <div class="combo-keys">
            <span class="combo-key">KANA</span>
            <span class="combo-key">Caps</span>
            <span class="combo-key">D</span>
          </div>
          <span class="combo-result">#3</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface PreviewImage {
  id: string
  layer: number
  url: string
  type: string
}

const props = defineProps<{
  previewImages: PreviewImage[]
  isGenerating: boolean
  outputFormat?: 'separated' | 'vertical' | 'horizontal'
  theme?: 'light' | 'dark'
}>()

const getPreviewImageUrl = (): string => {
  const format = props.outputFormat || 'separated'
  const theme = props.theme || 'dark'
  
  if (format === 'separated') {
    return `/images/sample/keyboard_layout_layer0_modular.png`
  } else if (format === 'vertical') {
    return `/images/sample/combined_layers_vertical_with_combos_${theme}.png`
  } else if (format === 'horizontal') {
    return `/images/sample/combined_layers_horizontal_with_combos_${theme}.png`
  }
  
  return `/images/sample/keyboard_layout_layer0_modular.png`
}

const emit = defineEmits<{
  generate: []
}>()
</script>

<style scoped>
.preview-tab {
  height: 100%;
  padding: 20px;
  background: #f5f5f5;
}

.main-keyboard-display {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: center;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-keyboard-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.combos-section {
  background: #2d2d2d;
  border-radius: 8px;
  padding: 15px;
  color: white;
}

.combo-header {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #aaa;
}

.combo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.combo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.combo-number {
  background: #555;
  color: white;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
  min-width: 30px;
  text-align: center;
}

.combo-keys {
  display: flex;
  gap: 4px;
  flex: 1;
}

.combo-key {
  background: #666;
  color: white;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-family: monospace;
}

.combo-result {
  background: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
  min-width: 40px;
  text-align: center;
}

@media (max-width: 768px) {
  .preview-tab {
    padding: 10px;
  }
  
  .main-keyboard-display {
    min-height: 300px;
    padding: 15px;
  }
  
  .combo-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
</style>