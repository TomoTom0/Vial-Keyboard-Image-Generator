<template>
  <div class="preview-tab">
    <div class="preview-container">
      <!-- Header image -->
      <img v-if="settingsStore.showHeader && settingsStore.outputFormat !== 'separated' && imagesStore.getHeaderImageUrl()"
        :src="imagesStore.getHeaderImageUrl()"
        alt="Layout header"
        class="preview-header-image"
      />

      <!-- Layers grid -->
      <div :class="getLayersLayoutClass()">
        <div
          v-for="layer in getOrderedLayers()"
          :key="layer"
          v-show="settingsStore.layerSelection[layer]"
          class="layer-item"
        >
          <img
            v-if="imagesStore.getLayerImageUrl(layer)"
            :src="imagesStore.getLayerImageUrl(layer)"
            :alt="`Layer ${layer}`"
            :class="['layer-preview', { 'image-loaded': imageLoadedStates[layer] }]"
            loading="eager"
            @load="handleImageLoad(layer)"
            @loadstart="handleImageLoadStart(layer)"
            @error="handleImageError"
          />
        </div>
      </div>

      <!-- Combo section -->
      <img v-if="settingsStore.showCombos && settingsStore.outputFormat !== 'separated' && imagesStore.getComboImageUrl()"
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

// Store から取得するcomputed値（計算が必要なもののみ）
const generatedImages = computed(() => imagesStore.images)

// 画像読み込み状態管理
const imageLoadingStates = ref<{[key: number]: boolean}>({})
const imageLoadedStates = ref<{[key: number]: boolean}>({})

// 画面幅の監視（separatedレイアウト用）
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
  const format = settingsStore.outputFormat || 'separated'
  
  if (format === 'vertical') {
    return 'layers-vertical'
  } else if (format === 'rectangular') {
    // レイヤー数に応じてグリッド列数を決定
    const selectedCount = Object.values(settingsStore.layerSelection).filter(Boolean).length
    return selectedCount <= 4 ? 'layers-rectangular-2col' : 'layers-rectangular-3col'
  } else if (format === 'separated') {
    // separatedの場合は有効なレイヤー数と画面幅に応じて列数を決定
    const selectedCount = Object.values(settingsStore.layerSelection).filter(Boolean).length
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
  max-width: calc(100vw - 290px); // サイドバー250px + 余白40px
  width: 100%;
  transition: all 0.3s ease-in-out;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  
}

.preview-header-image {
  @include preview-image-base;
  border-radius: 8px 8px 0 0;
  margin: 0 auto;
  align-self: center;
  max-width: 100%;
  height: auto;
}

.preview-combo-image {
  @include preview-image-base;
  border-radius: 0 0 8px 8px;
  margin: 0 auto;
  align-self: center;
  max-width: 100%;
  height: auto;
}

.preview-layer-image {
  @include preview-image-base;
}

.layers-separated {
  @include layout.layers-grid-3x2-separated;
  padding: 0;
  margin: 10px auto;
  display: grid;
  justify-self: center;


  // 大きな画面でより大きな間隔
  @media (min-width: 1400px) {
    margin: 15px;
    gap: 15px;
  }

  @media (min-width: 1800px) {
    margin: 20px;
    gap: 20px;
  }
}

.layers-separated-1col {
  @include layout.layers-grid-1col-separated;
  padding: 0;
  margin: 10px auto;
  display: grid;
  justify-self: center;
  max-width: 100%;

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
  max-width: 100%;

}

.layers-rectangular-2col {
  @include layout.layers-grid-2col;
  margin: 0 auto;
  display: grid;
  justify-self: center;
  max-width: 100%;

}

.layers-rectangular-3col {
  @include layout.layers-grid-3x2;
  margin: 0 auto;
  display: grid;
  justify-self: center;
  max-width: 100%;

}

.layer-item {
  transition: all $transition-duration;
  position: relative;


  // 基本レイアウト調整
  width: fit-content;
  height: fit-content;
}

.layer-preview {
  @include preview-image-base;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  max-width: 100%;
  height: auto;

  &.image-loaded {
    opacity: 1;
  }
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


@media (max-width: 768px) {
  .preview-tab {
    padding: 10px;
  }
  
  .preview-container {
    max-width: calc(100vw - 80px); // 折りたたみサイドバー40px + 余白40px
    align-items: center;
    
  }
  
  
}
</style>