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
      
      <!-- Generate button -->
      <div class="generate-section">
        <button 
          class="generate-button"
          :disabled="selectedFile === 'sample'"
          @click="handleGenerate"
        >
          Generate
        </button>
      </div>
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
  generatedImages?: any[]
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
    return `/assets/sample/keyboard/dark/0-0/layer${layer}-low.png`
  } else if (props.selectedFile && props.generatedImages) {
    // 生成された画像から該当するレイヤーを探す
    const layerImage = props.generatedImages.find(img => 
      img.type === 'layer' && img.layer === layer
    )
    return layerImage ? layerImage.url : ''
  }
  return ''
}

const getHeaderImageUrl = (): string => {
  // ヘッダー画像は現在利用不可
  return ''
}

const getComboImageUrl = (): string => {
  if (props.selectedFile === 'sample') {
    return `/assets/sample/keyboard/dark/0-0/combo-normal-low.png`
  } else if (props.selectedFile && props.generatedImages) {
    // 生成された画像からコンボ画像を探す
    const comboImage = props.generatedImages.find(img => 
      img.type === 'combined' && img.filename.includes('combo')
    )
    return comboImage ? comboImage.url : ''
  }
  return ''
}

const handleImageError = (event: Event) => {
  console.warn('Failed to load layer image')
}

const handleGenerate = () => {
  emit('generate')
}

const emit = defineEmits<{
  generate: []
}>()
</script>

<style scoped lang="scss">
@use '../styles/layout.scss' as layout;

// Variables
$primary-color: #007bff;
$primary-hover: #0056b3;
$border-color: #dee2e6;
$background-light: #f5f5f5;
$transition-duration: 0.2s;

.preview-tab {
  height: auto;
  min-height: 0;
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
  
  // ウィンドウサイズ基準の共通画像倍率
  --image-scale: clamp(2.5, 5vw, 4.5);
}

// Common image styles
@mixin preview-image-base {
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  margin: 0;
  padding: 0;
  border: none;
  box-sizing: border-box;
  transition: all $transition-duration;
  
  // ウィンドウサイズ基準の共通倍率を適用
  transform: scale(var(--image-scale));
  transform-origin: center;
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
  @include layout.layers-grid-3x2-separated;
  padding: 0;
  margin: 10px;
}

.layers-vertical {
  @include layout.layers-vertical-layout;
}

.layers-rectangular-2col {
  @include layout.layers-grid-2col;
}

.layers-rectangular-3col {
  @include layout.layers-grid-3x2;
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

.generate-section {
  margin-top: 15px;
  text-align: center;
}

.generate-button {
  background: $primary-color;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-duration;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);

  &:hover {
    background: $primary-hover;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
  }

  &:disabled {
    background: #ccc;
    color: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;

    &:hover {
      background: #ccc;
      transform: none;
      box-shadow: none;
    }
  }
}

@media (max-width: 768px) {
  .preview-tab {
    padding: 10px;
  }
  
  .preview-container {
    max-width: 98%;
  }
  
  .generate-button {
    padding: 10px 20px;
    font-size: 13px;
  }
}
</style>