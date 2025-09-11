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
            v-if="getLayerImageUrl(layer)"
            :src="getLayerImageUrl(layer)"
            :alt="`Layer ${layer}`"
            class="layer-preview"
            @error="handleImageError"
          />
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
import { ref, onMounted, onUnmounted } from 'vue'
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
  const format = props.outputFormat || 'separated'
  
  if (format === 'vertical') {
    return 'layers-vertical'
  } else if (format === 'rectangular') {
    // レイヤー数に応じてグリッド列数を決定
    const selectedCount = Object.values(props.layerSelection).filter(Boolean).length
    return selectedCount <= 4 ? 'layers-rectangular-2col' : 'layers-rectangular-3col'
  } else if (format === 'separated') {
    // separatedの場合は有効なレイヤー数と画面幅に応じて列数を決定
    const selectedCount = Object.values(props.layerSelection).filter(Boolean).length
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

const getLayerImageUrl = (layer: number): string => {
  if (props.selectedFile === 'sample') {
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

const getHeaderImageUrl = (): string => {
  if (props.selectedFile === 'sample') {
    return `/assets/sample/keyboard/dark/0-0/header-normal-low.png`
  } else if (props.selectedFile && props.generatedImages) {
    // プレビュータブ用の適切な幅を計算（選択レイヤー数ベース）
    let displayColumns = 1
    if (props.outputFormat === 'vertical') {
      displayColumns = 1
    } else if (props.outputFormat === 'rectangular') {
      const selectedCount = Object.values(props.layerSelection).filter(Boolean).length
      if (selectedCount >= 5) {
        displayColumns = 3
      } else if (selectedCount >= 2) {
        displayColumns = 2
      } else {
        displayColumns = 1
      }
    } else { // separated
      displayColumns = 1
    }
    
    // 適切な幅のヘッダー画像を探す
    const targetHeader = props.generatedImages.find(img => 
      img.type === 'header' && (
        img.id.includes(`header-${displayColumns}x`) || 
        img.id.includes(`browser-header-${displayColumns}x`)
      )
    )
    const fallbackHeader = props.generatedImages.find(img => 
      img.type === 'header' && (
        img.id.includes('header-1x') || 
        img.id.includes('browser-header-1x')
      )
    )
    const headerImage = targetHeader || fallbackHeader
    console.log(`🔍 PreviewTab: Available images:`, props.generatedImages.map(img => img.id))
    console.log(`🔍 PreviewTab: Looking for header-${displayColumns}x (${Object.values(props.layerSelection).filter(Boolean).length} selected), found:`, headerImage?.id)
    return headerImage ? headerImage.url : ''
  }
  return ''
}

const getComboImageUrl = (): string => {
  if (props.selectedFile === 'sample') {
    return `/assets/sample/keyboard/dark/0-0/combo-normal-low.png`
  } else if (props.selectedFile && props.generatedImages) {
    // プレビュータブ用の適切な幅を計算（選択レイヤー数ベース）
    let displayColumns = 1
    if (props.outputFormat === 'vertical') {
      displayColumns = 1
    } else if (props.outputFormat === 'rectangular') {
      const selectedCount = Object.values(props.layerSelection).filter(Boolean).length
      if (selectedCount >= 5) {
        displayColumns = 3
      } else if (selectedCount >= 2) {
        displayColumns = 2
      } else {
        displayColumns = 1
      }
    } else { // separated
      displayColumns = 1
    }
    
    // 適切な幅のコンボ画像を探す
    const targetCombo = props.generatedImages.find(img => 
      img.type === 'combo' && (
        img.id.includes(`combo-${displayColumns}x`) || 
        img.id.includes(`browser-combo-${displayColumns}x`)
      )
    )
    const fallbackCombo = props.generatedImages.find(img => 
      img.type === 'combo' && (
        img.id.includes('combo-1x') || 
        img.id.includes('browser-combo-1x')
      )
    )
    const comboImage = targetCombo || fallbackCombo
    console.log(`🔍 PreviewTab: Looking for combo-${displayColumns}x (${Object.values(props.layerSelection).filter(Boolean).length} selected), found:`, comboImage?.id)
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
  max-width: calc(100vw - 20px);
  width: fit-content;
  transition: all 0.3s ease-in-out;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
  
  // ウィンドウサイズ基準の共通画像倍率（余裕がある場合はより大きく）
  --image-scale: clamp(0.8, 2.5vw, 2.0);
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
  transform-origin: top left;
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