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
          :class="['layer-item', { 'layer-selected': settingsStore.layerSelection[layer] }]"
          @click="toggleLayer(layer, !settingsStore.layerSelection[layer])"
        >
          <template v-if="imagesStore.getLayerImageUrl(layer)">
            <div class="layer-image-container">
              <img
                :src="imagesStore.getLayerImageUrl(layer)"
                :alt="`Layer ${layer}`"
                :class="['layer-preview', { 'image-loaded': imageLoadedStates[layer] }]"
                loading="eager"
                @load="handleImageLoad(layer)"
                @loadstart="handleImageLoadStart(layer)"
                @error="handleImageError"
              />
              <!-- ズームボタン（最初のレイヤーのみ） -->
              <button
                v-if="layer === 0"
                class="zoom-btn"
                @click.stop="openZoomModal(imagesStore.getLayerImageUrl(layer), `Layer ${layer}`)"
                title="拡大表示"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="21 21l-4.35-4.35"/>
                  <line x1="8" y1="11" x2="14" y2="11"/>
                  <line x1="11" y1="8" x2="11" y2="14"/>
                </svg>
              </button>
            </div>
          </template>
          <template v-else>
            <div class="layer-placeholder">
              <!-- プレースホルダーを非表示にして、画像読み込み時の見切り感を軽減 -->
            </div>
          </template>
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

    <!-- ズームモーダル -->
    <ImageZoomModal
      :is-open="isZoomModalOpen"
      :image-url="zoomImageUrl"
      :title="zoomImageTitle"
      @close="closeZoomModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { LAYERS } from '../constants/layout'
import { useVialStore } from '../stores/vial'
import { useSettingsStore } from '../stores/settings'
import { useImagesStore } from '../stores/images'
import ImageZoomModal from './ImageZoomModal.vue'

interface LayerSelection {
  [layerId: number]: boolean
}

const vialStore = useVialStore()
const settingsStore = useSettingsStore()
const imagesStore = useImagesStore()

// Store から取得するcomputed値（計算が必要なもののみ）
const generatedImages = computed(() => imagesStore.images)
const outputFormat = computed(() => settingsStore.outputFormat)

// Available layers
const availableLayers = LAYERS.AVAILABLE

// 画像読み込み状態管理
const imageLoadingStates = ref<{[key: number]: boolean}>({})
const imageLoadedStates = ref<{[key: number]: boolean}>({})

// ズームモーダル状態
const isZoomModalOpen = ref(false)
const zoomImageUrl = ref('')
const zoomImageTitle = ref('')

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
    ...settingsStore.layerSelection,
    [layer]: selected
  }
}

const toggleCombos = () => {
  settingsStore.showCombos = !settingsStore.showCombos
}

const toggleHeader = () => {
  settingsStore.showHeader = !settingsStore.showHeader
}

// ズーム機能
const openZoomModal = (imageUrl: string, title: string) => {
  zoomImageUrl.value = imageUrl
  zoomImageTitle.value = title
  isZoomModalOpen.value = true
}

const closeZoomModal = () => {
  isZoomModalOpen.value = false
  zoomImageUrl.value = ''
  zoomImageTitle.value = ''
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



// 画像読み込みイベントハンドラー
const handleImageLoad = (layer: number) => {
  imageLoadedStates.value[layer] = true
  imageLoadingStates.value[layer] = false
}

const handleImageLoadStart = (layer: number) => {
  imageLoadingStates.value[layer] = true
  imageLoadedStates.value[layer] = false
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
$border-color: #dee2e6;
$background-light: #f5f5f5;
$transition-duration: 0.2s;

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
  max-width: calc(100vw - 290px); // サイドバー250px + 余白40px
  width: 100%;
  transition: all 0.3s ease-in-out;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  
}

// Mixin for common image styles
@mixin image-base {
  width: auto;
  height: auto;
  max-width: 100%;
  object-fit: contain;
  display: block;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  transition: all $transition-duration;
}

.layer-image-container {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
}

.layer-image-container {
  .zoom-btn {
    position: absolute;
    bottom: 8px;
    left: 8px;
    background-color: rgba(0, 123, 255, 0.8);
    color: white;
    border: none;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(0, 123, 255, 0.3);
    z-index: 10;
    opacity: 0.8;

    svg {
      width: 10px !important;
      height: 10px !important;
      min-width: 10px;
      min-height: 10px;
      display: block;
    }

    &:hover {
      background-color: rgba(0, 86, 179, 0.9);
      transform: scale(1.05);
      box-shadow: 0 3px 10px rgba(0, 123, 255, 0.4);
      opacity: 1;
    }

    &:active {
      transform: scale(0.95);
      background-color: #004494;
    }
  }
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
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  
  &.image-loaded {
    opacity: 1;
  }
}



.layers-separated {
  @include layout.layers-grid-3x2-separated;
  padding: 0;
  margin: 10px auto;
  display: grid;
  justify-self: center;
}

.layers-separated-1col {
  @include layout.layers-grid-1col-separated;
  padding: 0;
  margin: 10px auto;
  display: grid;
  justify-self: center;
}

.layers-separated-2col {
  @include layout.layers-grid-2col-separated;
  padding: 0;
  margin: 10px auto;
  display: grid;
  justify-self: center;
  
  @media (min-width: 1400px) {
    margin: 15px;
    gap: 15px;
  }
  
  @media (min-width: 1800px) {
    margin: 20px;
    gap: 20px;
  }
}

.layers-separated-3col {
  @include layout.layers-grid-3x2-separated;
  padding: 0;
  margin: 10px auto;
  display: grid;
  justify-self: center;
  
  @media (min-width: 1400px) {
    margin: 15px;
    gap: 15px;
  }
  
  @media (min-width: 1800px) {
    margin: 20px;
    gap: 20px;
  }
}

.layers-vertical {
  @include layout.layers-vertical-layout;
}

.layers-rectangular-2col {
  @include layout.layers-grid-2col;
  margin: 0 auto;
  display: grid;
  justify-self: center;
}

.layers-rectangular-3col {
  @include layout.layers-grid-3x2;
  margin: 0 auto;
  display: grid;
  justify-self: center;
}





.layer-placeholder {
  color: transparent;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 60px;
  width: 100%;
  background: #f5f5f5;
  border-radius: 8px;
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
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

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
  width: fit-content;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;

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
  
  .image-container {
    max-width: calc(100vw - 80px); // 折りたたみサイドバー40px + 余白40px
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