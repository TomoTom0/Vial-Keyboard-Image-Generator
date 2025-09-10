<template>
  <div class="select-tab">
    <div class="image-container">
      <!-- Header image -->
      <div v-if="outputFormat !== 'separated'"
           :class="['header-image-section', { 'header-disabled': !props.showHeader }]"
           @click="toggleHeader">
        <img 
          :src="getHeaderImageUrl()"
          alt="Layout header"
          class="header-image"
          @error="handleHeaderImageError"
        />
      </div>
      
      <!-- Layers grid -->
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
      
      <!-- Combo section -->
      <div v-if="outputFormat !== 'separated'"
           :class="['combos-image-section', { 'combos-disabled': !props.showCombos }]"
           @click="toggleCombos">
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

const emit = defineEmits<{
  layerSelectionChanged: [selection: LayerSelection]
  comboToggled: [enabled: boolean]
  headerToggled: [enabled: boolean]
}>()

// Available layers
const availableLayers = LAYERS.AVAILABLE

const toggleLayer = (layer: number, selected: boolean) => {
  const newSelection = {
    ...props.layerSelection,
    [layer]: selected
  }
  emit('layerSelectionChanged', newSelection)
}

const toggleCombos = () => {
  const newState = !props.showCombos
  emit('comboToggled', newState)
}

const toggleHeader = () => {
  const newState = !props.showHeader
  emit('headerToggled', newState)
}

const getLayersLayoutClass = (): string => {
  const format = props.outputFormat || 'separated'
  
  if (format === 'vertical') {
    return 'layers-vertical'
  } else if (format === 'rectangular') {
    // SelectTabでは全レイヤー（6層）を3列で表示: L0,L1,L2 / L3,L4,L5
    return 'layers-rectangular-3col'
  }
  return 'layers-separated'
}

const getContentLayoutClass = (): string => {
  const format = props.outputFormat || 'separated'
  
  if (format === 'vertical') {
    return 'content-vertical'
  } else if (format === 'horizontal') {
    return 'content-horizontal'
  }
  return 'content-separated'
}

const getOrderedLayers = () => {
  return LAYERS.DISPLAY_ORDER
}

const getLayerImageUrl = (layer: number): string => {
  if (props.selectedFile === 'sample') {
    // サンプルファイルの場合は静的画像
    return `/assets/sample/keyboard/dark/0-0/layer${layer}-low.png`
  } else if (props.selectedFile && props.generatedImages) {
    // 生成された画像から該当するレイヤーを探す
    const layerImage = props.generatedImages.find(img => 
      img.type === 'layer' && img.layer === layer
    )
    
    // Canvas要素が存在する場合は、Data URLに変換
    if (layerImage?.canvas) {
      return layerImage.canvas.toDataURL()
    }
    
    return layerImage ? layerImage.url : ''
  }
  return ''
}

const getComboImageUrl = (): string => {
  if (props.selectedFile === 'sample') {
    return `/assets/sample/keyboard/dark/0-0/combo-normal-low.png`
  } else if (props.selectedFile && props.generatedImages) {
    // 生成された画像からコンボ画像を探す
    const comboImage = props.generatedImages.find(img => 
      img.type === 'combined' || (img.type === 'combo' as any)
    )
    
    // Canvas要素が存在する場合は、Data URLに変換
    if (comboImage?.canvas) {
      return comboImage.canvas.toDataURL()
    }
    
    return comboImage ? comboImage.url : ''
  }
  return ''
}

const getHeaderImageUrl = (): string => {
  // ヘッダー画像は現在利用不可
  return ''
}

const handleImageError = (event: Event) => {
  console.warn('Failed to load layer image')
}

const handleComboImageError = (event: Event) => {
  console.warn('Failed to load combo image')
}

const handleHeaderImageError = (event: Event) => {
  console.warn('Failed to load header image')
}
</script>

<style scoped lang="scss">
@use '../styles/layout.scss' as layout;

// Variables
$primary-color: #007bff;
$primary-hover: #0056b3;
$border-color: #dee2e6;
$transition-duration: 0.2s;
$background-light: #f5f5f5;

.select-tab {
  height: auto;
  min-height: 0;
  padding: 10px;
  background: $background-light;
}

.image-container {
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

// Mixin for common image styles
@mixin image-base {
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  transition: all $transition-duration;
  
  // ウィンドウサイズ基準の共通倍率を適用
  transform: scale(var(--image-scale));
  transform-origin: center;
}


.header-image {
  @include image-base;
  border-radius: 8px 8px 0 0;
}

.combo-image {
  @include image-base;
  border-radius: 0 0 8px 8px;
}

.layer-preview {
  @include image-base;
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





.layer-placeholder {
  color: #999;
  font-size: 11px;
}


// 非選択/無効状態の共通スタイル
@mixin inactive-state {
  opacity: 0.3;
  filter: grayscale(1) brightness(0.7);

  &:hover {
    opacity: 0.5;
    filter: grayscale(0.8) brightness(0.8);
  }
}

// 選択/有効状態の共通スタイル
@mixin active-state {
  opacity: 1;
  filter: none;

  img {
    outline-color: $primary-color;
  }

  &:hover img {
    outline-color: $primary-hover;
  }
}

// 共通のインタラクション要素mixin
@mixin interactive-element {
  cursor: pointer;
  transition: all $transition-duration;

  // 共通の画像アウトラインスタイル
  img {
    outline: 2px solid $border-color;
    outline-offset: -2px;
  }
}

// レイヤーアイテム
.layer-item {
  @include interactive-element;
  position: relative;

  &:not(.layer-selected) {
    @include inactive-state;
  }

  &.layer-selected {
    @include active-state;
  }
}

// ヘッダーとコンボセクション
.header-image-section,
.combos-image-section {
  @include interactive-element;
  width: 100%;

  &.header-disabled,
  &.combos-disabled {
    @include inactive-state;
  }

  &:not(.header-disabled):not(.combos-disabled) {
    @include active-state;
  }
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