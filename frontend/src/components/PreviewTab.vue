<template>
  <div class="preview-tab">
    <div class="preview-container">
      <!-- Header image -->
      <img v-if="showHeader && outputFormat !== 'separated' && imagesStore.getHeaderImageUrl()"
        :src="imagesStore.getHeaderImageUrl()"
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
            v-if="imagesStore.getLayerImageUrl(layer)"
            :src="imagesStore.getLayerImageUrl(layer)"
            :alt="`Layer ${layer}`"
            class="layer-preview"
            @error="handleImageError"
          />
        </div>
      </div>
      
      <!-- Combo section -->
      <img v-if="showCombos && outputFormat !== 'separated' && imagesStore.getComboImageUrl()"
        :src="imagesStore.getComboImageUrl()"
        alt="Combo information"
        class="preview-combo-image"
      />
      
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
const layerSelection = computed(() => settingsStore.layerSelection)
const showHeader = computed(() => settingsStore.showHeader)
const showCombos = computed(() => settingsStore.showCombos)
const generatedImages = computed(() => imagesStore.images)

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

const getOrderedLayers = () => {
  return LAYERS.DISPLAY_ORDER
}


const getLayersLayoutClass = (): string => {
  const format = outputFormat.value || 'separated'
  
  if (format === 'vertical') {
    return 'layers-vertical'
  } else if (format === 'rectangular') {
    // レイヤー数に応じてグリッド列数を決定
    const selectedCount = Object.values(layerSelection.value).filter(Boolean).length
    return selectedCount <= 4 ? 'layers-rectangular-2col' : 'layers-rectangular-3col'
  } else if (format === 'separated') {
    // separatedの場合は有効なレイヤー数と画面幅に応じて列数を決定
    const selectedCount = Object.values(layerSelection.value).filter(Boolean).length
    if (selectedCount <= 1 || screenWidth.value < 600) {
      return 'layers-separated-1col'
    } else if (selectedCount <= 4 || screenWidth.value < 900) {
      return 'layers-separated-2col' 
    } else {
      return 'layers-separated-3col'
    }
  }
  return 'layers-separated'
}


const handleImageError = (event: Event) => {
  console.warn('Failed to load layer image')
}

const handleGenerate = async () => {
  try {
    // ImagesStoreの最終出力生成メソッドを呼び出し
    await imagesStore.generateFinalOutputImages()
  } catch (error) {
    console.error('❌ Generate failed:', error)
  }
}
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
  --image-scale: clamp(1.0, 3.5vw, 2.5);
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
  margin: 0 auto;
  align-self: center;
}

.preview-combo-image {
  @include preview-image-base;
  border-radius: 0 0 8px 8px;
  margin: 0 auto;
  align-self: center;
}

.preview-layer-image {
  @include preview-image-base;
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

.layer-item {
  transition: all $transition-duration;
  position: relative;
}

.layer-preview {
  @include preview-image-base;
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


@media (max-width: 768px) {
  .preview-tab {
    padding: 10px;
  }
  
  .preview-container {
    max-width: calc(100vw - 60px);
    align-items: center;
    
    // 小画面では画像スケールを調整
    --image-scale: clamp(0.8, 2.5vw, 1.5);
  }
  
  
}
</style>