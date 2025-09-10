// ブラウザ対応版の画像生成機能
export interface GeneratedImage {
  id: string
  filename: string
  type: 'combined' | 'layer'
  layer?: number
  format: string
  url: string  // Blob URLまたはData URL
  size: number
  timestamp: Date
}

export interface GenerationOptions {
  theme: 'dark' | 'light'
  format: 'vertical' | 'horizontal' | 'individual'
  layerRange?: {
    start: number
    end: number
  }
  showComboInfo?: boolean
}

export class BrowserImageGenerator {
  /**
   * Vilファイルの内容から画像を生成
   * @param fileContent Vilファイルの内容（Base64またはバイナリ文字列）
   * @param filename 元のファイル名
   * @param options 生成オプション
   * @returns 生成された画像の配列
   */
  static async generateFromContent(
    fileContent: string,
    filename: string,
    options: GenerationOptions
  ): Promise<GeneratedImage[]> {
    console.log('🎨 ブラウザ内で画像生成を開始します')
    
    try {
      // 1. Vilファイルをパース（TODO: 実装）
      const vialConfig = await this.parseVialFile(fileContent)
      
      // 2. Canvas要素を作成
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Canvas context を作成できません')
      }
      
      // 3. 画像生成
      const images: GeneratedImage[] = []
      const timestamp = new Date()
      
      // レイヤー画像を生成
      if (options.format === 'individual' || options.format === 'vertical') {
        const layers = options.layerRange 
          ? Array.from({ length: options.layerRange.end - options.layerRange.start + 1 }, (_, i) => i + options.layerRange!.start)
          : [0, 1, 2, 3, 4, 5]
        
        for (const layerIndex of layers) {
          const layerImage = await this.generateLayerImage(canvas, ctx, vialConfig, layerIndex, options)
          if (layerImage) {
            images.push({
              id: `layer-${layerIndex}-${Date.now()}`,
              filename: `${filename.replace('.vil', '')}_layer${layerIndex}_${options.theme}.png`,
              type: 'layer',
              layer: layerIndex,
              format: options.format,
              url: layerImage.url,
              size: layerImage.size,
              timestamp
            })
          }
        }
      }
      
      // コンボ情報画像を生成
      if (options.showComboInfo) {
        const comboImage = await this.generateComboImage(canvas, ctx, vialConfig, options)
        if (comboImage) {
          images.push({
            id: `combo-${Date.now()}`,
            filename: `${filename.replace('.vil', '')}_combo_${options.theme}.png`,
            type: 'combined',
            format: options.format,
            url: comboImage.url,
            size: comboImage.size,
            timestamp
          })
        }
      }
      
      console.log(`✅ 画像生成完了: ${images.length}個の画像を生成しました`)
      return images
      
    } catch (error) {
      console.error('❌ 画像生成中にエラーが発生:', error)
      throw error
    }
  }
  
  /**
   * Vilファイルをパース
   */
  private static async parseVialFile(content: string): Promise<any> {
    // TODO: 既存のVialParserを使用してパース
    // 現在はダミーデータを返す
    return {
      layers: Array(6).fill(null).map((_, i) => ({
        id: i,
        keys: []
      })),
      combos: []
    }
  }
  
  /**
   * レイヤー画像を生成
   */
  private static async generateLayerImage(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    vialConfig: any,
    layerIndex: number,
    options: GenerationOptions
  ): Promise<{ url: string; size: number } | null> {
    
    // キャンバスサイズを設定
    canvas.width = 800
    canvas.height = 300
    
    // 背景を描画
    ctx.fillStyle = options.theme === 'dark' ? '#1a1a1a' : '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // レイヤー情報を描画（ダミー実装）
    ctx.fillStyle = options.theme === 'dark' ? '#ffffff' : '#000000'
    ctx.font = '20px Arial'
    ctx.fillText(`Layer ${layerIndex}`, 50, 50)
    
    // TODO: 実際のキーレイアウトを描画
    
    // Blob URLを生成
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          resolve({ url, size: blob.size })
        } else {
          resolve(null)
        }
      }, 'image/png')
    })
  }
  
  /**
   * コンボ情報画像を生成
   */
  private static async generateComboImage(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    vialConfig: any,
    options: GenerationOptions
  ): Promise<{ url: string; size: number } | null> {
    
    // キャンバスサイズを設定
    canvas.width = 800
    canvas.height = 200
    
    // 背景を描画
    ctx.fillStyle = options.theme === 'dark' ? '#1a1a1a' : '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // コンボ情報を描画（ダミー実装）
    ctx.fillStyle = options.theme === 'dark' ? '#ffffff' : '#000000'
    ctx.font = '16px Arial'
    ctx.fillText('Combo Information', 50, 50)
    
    // TODO: 実際のコンボ情報を描画
    
    // Blob URLを生成
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          resolve({ url, size: blob.size })
        } else {
          resolve(null)
        }
      }, 'image/png')
    })
  }
  
  /**
   * 生成された画像のリソースをクリーンアップ
   */
  static cleanupImageUrls(images: GeneratedImage[]): void {
    images.forEach(image => {
      if (image.url.startsWith('blob:')) {
        URL.revokeObjectURL(image.url)
      }
    })
  }
}