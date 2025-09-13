// 画像選択ユーティリティ関数

interface GeneratedImage {
  id: string
  filename: string
  type: 'combined' | 'layer' | 'header' | 'combo'
  layer?: number
  format: string
  url: string
  size: number
  timestamp: Date
  canvas?: HTMLCanvasElement
}

/**
 * 適切な幅のcanvas画像URLを取得する共通関数
 * @param type - 画像タイプ ('header' | 'combo')
 * @param generatedImages - 生成された画像配列
 * @param outputFormat - 出力フォーマット
 * @param useAllLayers - 全レイヤー数を使用するか（SelectTab用）
 * @param selectedLayers - 選択されたレイヤー（PreviewTab用）
 * @returns 画像URL
 */
export function getCanvasImageUrl(
  type: 'header' | 'combo',
  generatedImages: GeneratedImage[],
  outputFormat: 'separated' | 'vertical' | 'rectangular',
  useAllLayers: boolean,
  selectedLayers?: { [layerId: number]: boolean },
  displayColumns?: number  // 新しいパラメータを追加
): string {
  if (!generatedImages || generatedImages.length === 0) {
    console.log(`🔍 getCanvasImageUrl: No images available for type ${type}`)
    return ''
  }
  
  console.log(`🔍 getCanvasImageUrl: Looking for ${type} images from`, generatedImages.map(img => ({id: img.id, type: img.type})))

  // displayColumnsが指定されていない場合のフォールバック計算
  if (displayColumns === undefined) {
    if (useAllLayers) {
      // SelectTab: 全レイヤー数（6層）ベースでフォーマットに応じて計算
      const allLayerCount = 6
      displayColumns = outputFormat === 'vertical' ? 1 : 
                       outputFormat === 'rectangular' ? 3 :
                       3
    } else {
      // PreviewTab: 有効レイヤー数ベース
      const selectedCount = selectedLayers ? Object.values(selectedLayers).filter(Boolean).length : 0
      displayColumns = outputFormat === 'vertical' ? 1 : 
                       selectedCount >= 5 ? 3 :
                       selectedCount >= 2 ? 2 :
                       1
    }
  }

  // 生成された画像から適切な幅の画像を探す
  const targetImage = generatedImages.find(img => 
    img.type === type && (
      img.id.includes(`browser-${type}-${displayColumns}x`) ||
      img.id.includes(`${type}-${displayColumns}x`)
    )
  )
  
  // 見つからない場合は1x幅をフォールバック
  const fallbackImage = generatedImages.find(img => 
    img.type === type && (
      img.id.includes(`browser-${type}-1x`) ||
      img.id.includes(`${type}-1x`)
    )
  )
  
  const selectedImage = targetImage || fallbackImage
  
  console.log(`🔍 getCanvasImageUrl: Selected image for ${type}-${displayColumns}x:`, selectedImage?.id || 'Not found')
  
  // Canvas要素が存在する場合は、Data URLに変換
  if (selectedImage?.canvas) {
    return selectedImage.canvas.toDataURL()
  }
  
  return selectedImage ? selectedImage.url : ''
}