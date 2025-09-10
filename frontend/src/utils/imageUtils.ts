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
  selectedLayers?: { [layerId: number]: boolean }
): string {
  if (!generatedImages || generatedImages.length === 0) {
    return ''
  }

  // 表示列数を計算
  let displayColumns: number
  
  if (useAllLayers) {
    // SelectTab: 全レイヤー数（6層）ベースでフォーマットに応じて計算
    const allLayerCount = 6
    displayColumns = outputFormat === 'vertical' ? 1 : 
                     outputFormat === 'rectangular' ? Math.min(3, Math.max(1, Math.ceil(allLayerCount / 2))) :
                     Math.min(3, Math.max(1, Math.ceil(allLayerCount / 2)))
  } else {
    // PreviewTab: 有効レイヤー数ベース
    const selectedCount = selectedLayers ? Object.values(selectedLayers).filter(Boolean).length : 0
    displayColumns = outputFormat === 'vertical' ? 1 : 
                     outputFormat === 'rectangular' ? Math.min(2, Math.max(1, Math.ceil(selectedCount / 2))) :
                     Math.min(3, Math.max(1, Math.ceil(selectedCount / 2)))
  }

  // 生成された画像から適切な幅の画像を探す
  const targetImage = generatedImages.find(img => 
    img.type === type && img.id.includes(`browser-${type}-${displayColumns}x`)
  )
  
  // 見つからない場合は1x幅をフォールバック
  const fallbackImage = generatedImages.find(img => 
    img.type === type && img.id.includes(`browser-${type}-1x`)
  )
  
  const selectedImage = targetImage || fallbackImage
  
  // Canvas要素が存在する場合は、Data URLに変換
  if (selectedImage?.canvas) {
    return selectedImage.canvas.toDataURL()
  }
  
  return selectedImage ? selectedImage.url : ''
}