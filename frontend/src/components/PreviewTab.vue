<template>
  <div class="preview-tab">
    <div class="preview-container">
      <!-- Header image -->
      <img v-if="showHeader && outputFormat !== 'separated'"
        :src="getHeaderImageUrl()"
        alt="Layout header"
        class="preview-header-image"
      />
      
      <!-- Layers grid -->
      <div :class="getLayersLayoutClass()">
        <div 
          v-for="layer in getOrderedLayers()"
          :key="layer"
          v-show="layerSelection[layer]"
          class="layer-item"
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
      
      <!-- Combo section -->
      <img v-if="showCombos && outputFormat !== 'separated'"
        :src="getComboImageUrl()"
        alt="Combo information"
        class="preview-combo-image"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { LAYERS } from '../constants/layout'

interface LayerSelection {
  [layerId: number]: boolean
}

const props = defineProps<{
  selectedFile: string
  layerSelection: LayerSelection
  outputFormat?: 'separated' | 'vertical' | 'rectangular'
  theme?: 'light' | 'dark'
  highlightEnabled?: boolean
  showCombos?: boolean
  showHeader?: boolean
}>()

const getOrderedLayers = () => {
  return LAYERS.DISPLAY_ORDER
}

const getLayersLayoutClass = (): string => {
  const format = props.outputFormat || 'separated'
  
  if (format === 'vertical') {
    return 'layers-vertical'
  } else if (format === 'rectangular') {
    // レイヤー数に応じてグリッド列数を決定
    const selectedCount = Object.values(props.layerSelection).filter(Boolean).length
    return selectedCount <= 4 ? 'layers-rectangular-2col' : 'layers-rectangular-3col'
  }
  return 'layers-separated'
}

const getLayerImageUrl = (layer: number): string => {
  if (props.selectedFile === 'sample') {
    const theme = props.theme || 'dark'
    const highlight = props.highlightEnabled ? '1-1' : '0-0'
    return `/assets/sample/keyboard/${theme}/${highlight}/layer${layer}-low.png`
  }
  return ''
}

const getHeaderImageUrl = (): string => {
  if (props.selectedFile === 'sample') {
    const theme = props.theme || 'dark'
    const highlight = props.highlightEnabled ? '1-1' : '0-0'
    
    let headerSize = '1x'
    if (props.outputFormat === 'vertical') {
      headerSize = '1x'
    } else if (props.outputFormat === 'rectangular') {
      headerSize = '3x'
    } else {
      headerSize = '2x'
    }
    
    return `/assets/sample/keyboard/${theme}/${highlight}/header-${headerSize}-low.png`
  }
  return ''
}

const getComboImageUrl = (): string => {
  if (props.selectedFile === 'sample') {
    const theme = props.theme || 'dark'
    const highlight = props.highlightEnabled ? '1-1' : '0-0'
    const comboType = (props.outputFormat === 'rectangular') ? 'wide' : 'normal'
    return `/assets/sample/keyboard/${theme}/${highlight}/combo-${comboType}-low.png`
  }
  return ''
}

const handleImageError = (event: Event) => {
  console.warn('Failed to load layer image')
}

const emit = defineEmits<{
  generate: []
}>()
</script>

<style scoped lang="scss">
@import '../styles/layout.scss';

// Variables
$primary-color: #007bff;
$border-color: #dee2e6;
$background-light: #f5f5f5;
$transition-duration: 0.2s;

.preview-tab {
  height: 100%;
  padding: 10px;
  background: $background-light;
}

.preview-container {
  background: white;
  border: 1px solid $border-color;
  border-radius: 8px;
  padding: 15px;
  margin: 5px auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 98%;
  max-height: 80vh;
  width: fit-content;
  transition: all 0.3s ease-in-out;
}

// Common image styles
@mixin preview-image-base {
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
  margin: 0;
  padding: 0;
  border: none;
  box-sizing: border-box;
  transition: all $transition-duration;
}

.preview-header-image {
  @include preview-image-base;
  border-radius: 8px 8px 0 0;
}

.preview-combo-image {
  @include preview-image-base;
  border-radius: 0 0 8px 8px;
}

.preview-layer-image {
  @include preview-image-base;
}

.layers-separated {
  @include layers-grid-3x2-separated;
  padding: 0;
  margin: 10px;
}

.layers-vertical {
  @include layers-vertical-layout;
}

.layers-rectangular-2col {
  @include layers-grid-2col;
}

.layers-rectangular-3col {
  @include layers-grid-3x2;
}

.layer-item {
  transition: all $transition-duration;
  position: relative;
}

.layer-preview {
  @include preview-image-base;
}

.layer-placeholder {
  color: #999;
  font-size: 11px;
}

@media (max-width: 768px) {
  .preview-tab {
    padding: 10px;
  }
  
  .preview-container {
    max-width: 98%;
  }
}
</style>