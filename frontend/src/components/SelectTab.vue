<template>
  <div class="select-tab">
    <div class="image-container">
      <!-- Header image -->
      <div v-if="outputFormat !== 'separated' && imagesStore.getHeaderImageUrl()"
           :class="['header-image-section', { 'header-disabled': !settingsStore.showHeader }]"
           @click="toggleHeader">
        <img 
          :src="imagesStore.getHeaderImageUrl()"
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
            v-if="imagesStore.getLayerImageUrl(layer)"
            :src="imagesStore.getLayerImageUrl(layer)"
            :alt="`Layer ${layer}`"
            class="layer-preview"
            @error="handleImageError"
          />
          <div v-else class="layer-placeholder">
            <div class="placeholder-text">Layer {{ layer }}</div>
          </div>
        </div>
      </div>
      
      <!-- Combo section -->
      <div v-if="outputFormat !== 'separated' && imagesStore.getComboImageUrl()"
           :class="['combos-image-section', { 'combos-disabled': !settingsStore.showCombos }]"
           @click="toggleCombos">
        <img 
          :src="imagesStore.getComboImageUrl()"
          alt="Combo information"
          class="combo-image"
          @error="handleComboImageError"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { LAYERS } from '../constants/layout'
import { useVialStore } from '../stores/vial'
import { useSettingsStore } from '../stores/settings'
import { useImagesStore } from '../stores/images'

interface LayerSelection {
  [layerId: number]: boolean
}

const vialStore = useVialStore()
const settingsStore = useSettingsStore()
const imagesStore = useImagesStore()

// Store から取得するcomputed値
const selectedFile = computed(() => vialStore.selectedVialId)
const outputFormat = computed(() => settingsStore.outputFormat)
const generatedImages = computed(() => imagesStore.images)
const layerSelection = computed(() => settingsStore.layerSelection)

// Available layers
const availableLayers = LAYERS.AVAILABLE

// 画面幅を監視してレイアウト変更をトリガー
const screenWidth = ref(window.innerWidth)

const updateScreenWidth = () => {
  screenWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', updateScreenWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenWidth)
})

const toggleLayer = (layer: number, selected: boolean) => {
  settingsStore.layerSelection = {
    ...layerSelection.value,
    [layer]: selected
  }
}

const toggleCombos = () => {
  settingsStore.showCombos = !settingsStore.showCombos
}

const toggleHeader = () => {
  settingsStore.showHeader = !settingsStore.showHeader
}

const getLayersLayoutClass = (): string => {
  const format = settingsStore.outputFormat || 'separated'
  
  if (format === 'vertical') {
    return 'layers-vertical'
  } else if (format === 'rectangular') {
    // SelectTabでは全レイヤー（6層）を3列で表示: L0,L1,L2 / L3,L4,L5
    return 'layers-rectangular-3col'
  } else if (format === 'separated') {
    // separatedの場合は画面幅に応じて動的に列数を決定
    if (screenWidth.value < 600) {
      return 'layers-separated-1col'
    } else if (screenWidth.value < 900) {
      return 'layers-separated-2col' 
    } else {
      return 'layers-separated-3col'
    }
  }
  return 'layers-separated'
}

const getContentLayoutClass = (): string => {
  const format = outputFormat.value || 'separated'
  
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
  max-width: calc(100vw - 60px);
  width: 100%;
  transition: all 0.3s ease-in-out;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  // ウィンドウサイズ基準の共通画像倍率（余裕がある場合はより大きく）
  --image-scale: clamp(0.4, 2vw, 1.2);
  
  // 内部コンテンツの最小幅を確保（画像がスケールされた状態での適切な表示のため）
  > * {
    min-width: max-content;
  }
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

.layers-separated-1col {
  @include layout.layers-grid-1col-separated;
  padding: 0;
  margin: 10px;
}

.layers-separated-2col {
  @include layout.layers-grid-2col-separated;
  padding: 0;
  margin: 10px;
}

.layers-separated-3col {
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
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 60px;
  width: 100%;
}

.placeholder-text {
  text-align: center;
  width: 100%;
  display: block;
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