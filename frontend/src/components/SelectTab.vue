<template>
  <div class="select-tab">
    <div class="layers-display">
      <div :class="getLayersLayoutClass()">
        <div 
          v-for="layer in getOrderedLayers()"
          :key="layer"
          :class="['layer-item', { 'layer-selected': layerSelection[layer] }]"
          @click="toggleLayer(layer, !layerSelection[layer])"
        >
          <img 
            :src="getLayerImageUrl(layer)"
            :alt="`Layer ${layer}`"
            class="layer-preview"
            @error="handleImageError"
          />
          <div v-if="!getLayerImageUrl(layer)" class="layer-placeholder">
            <div class="placeholder-text">Layer {{ layer }}</div>
          </div>
        </div>
      </div>
      
      <!-- Combo section as image - directly within layers-display -->
      <div v-if="showCombos && (outputFormat === 'vertical' || outputFormat === 'horizontal')" class="combos-image-section">
        <img 
          :src="getComboImageUrl()"
          alt="Combo information"
          class="combo-image"
          @error="handleComboImageError"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface LayerSelection {
  [layerId: number]: boolean
}

const props = defineProps<{
  selectedFile: string
  layerSelection: LayerSelection
  outputFormat?: 'separated' | 'vertical' | 'horizontal'
  theme?: 'light' | 'dark'
}>()

const emit = defineEmits<{
  layerSelectionChanged: [selection: LayerSelection]
}>()

// Available layers (0-3 for most keyboards)
const availableLayers = [0, 1, 2, 3]

// Show combos in the layout (like in the design image)
const showCombos = ref(true)

// Sample combo data (like shown in design)
const sampleCombos = ref([
  { id: 1, number: '#0', keys: ['MO(1)', 'SPACE'], result: 'J' },
  { id: 2, number: '#1', keys: ['MO(1)', 'SPACE'], result: 'F' },
  { id: 3, number: '#2', keys: ['Esc', 'Caps', 'F'], result: '#2' },
  { id: 4, number: '#3', keys: ['KANA', 'Caps', 'D'], result: '#3' }
])

const toggleLayer = (layer: number, selected: boolean) => {
  const newSelection = {
    ...props.layerSelection,
    [layer]: selected
  }
  emit('layerSelectionChanged', newSelection)
}

const getLayersLayoutClass = (): string => {
  const format = props.outputFormat || 'separated'
  
  if (format === 'vertical') {
    return 'layers-vertical'
  } else if (format === 'horizontal') {
    return 'layers-horizontal'
  }
  return 'layers-separated'
}

const getOrderedLayers = () => {
  if (props.outputFormat === 'horizontal') {
    // horizontal配置: [L0左上, L1左下, L2右上, L3右下] の順序
    return [0, 2, 1, 3]
  }
  // vertical, separated: 通常順序
  return [0, 1, 2, 3]
}

const getLayerImageUrl = (layer: number): string => {
  if (props.selectedFile === 'sample') {
    return `/images/sample/keyboard_layout_layer${layer}_modular.png`
  }
  return ''
}

const getComboImageUrl = (): string => {
  if (props.selectedFile === 'sample') {
    return `/images/sample/combo_info_${props.theme || 'dark'}.png`
  }
  return ''
}

const handleImageError = (event: Event) => {
  console.warn('Failed to load layer image')
}

const handleComboImageError = (event: Event) => {
  console.warn('Failed to load combo image')
}
</script>

<style scoped>
.select-tab {
  height: 100%;
  padding: 20px;
  background: #f5f5f5;
}

.layers-display {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 0;
  min-height: auto;
}

.layers-separated {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 15px;
  width: fit-content;
  margin: 0 auto;
}

.layers-vertical {
  display: flex;
  flex-direction: column;
  gap: 0;
  align-items: center;
  width: fit-content;
  margin: 0 auto;
}

.layers-horizontal {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 0;
  width: fit-content;
  margin: 0 auto;
}

.layer-item {
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.layer-item:not(.layer-selected) {
  opacity: 0.4;
  filter: grayscale(0.7);
}

.layer-item:not(.layer-selected):hover {
  opacity: 0.6;
  filter: grayscale(0.5);
}

.layer-item.layer-selected {
  opacity: 1;
  filter: none;
  box-shadow: 0 0 0 3px #007bff;
}

.layer-item.layer-selected:hover {
  box-shadow: 0 0 0 3px #0056b3;
}


.layer-preview {
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
}

.layer-placeholder {
  color: #999;
  font-size: 11px;
}


.combos-image-section {
  text-align: center;
}

.combo-image {
  max-width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .select-tab {
    padding: 10px;
  }
  
  .layers-display {
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