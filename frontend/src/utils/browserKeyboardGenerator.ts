// ブラウザ対応版Vial Keyboard Image Generator
import type { VialConfig, RenderOptions, KeyPosition, KeyLabel, ComboInfo } from './types'
import { getThemeColors } from './types'
import { Utils } from './utils'
import { Parser } from './parser'
import { KEYBOARD_CONSTANTS } from '../constants/keyboard'

export interface GenerationOptions {
  layerRange?: { start: number; end: number }
  renderOptions?: RenderOptions
  quality?: 'high' | 'low'
}

export interface GenerationResult {
  canvases: HTMLCanvasElement[]
  layerNumbers: number[]
  combinedCanvas?: HTMLCanvasElement
}

export class BrowserVialKeyboardImageGenerator {
  // 共通定数を使用
  private get keyWidth() { return KEYBOARD_CONSTANTS.keyWidth }
  private get keyHeight() { return KEYBOARD_CONSTANTS.keyHeight }
  private get keyGap() { return KEYBOARD_CONSTANTS.keyGap }
  private get unitX() { return KEYBOARD_CONSTANTS.unitX }
  private get unitY() { return KEYBOARD_CONSTANTS.unitY }
  private get margin() { return KEYBOARD_CONSTANTS.margin }

  // メイン関数：ファイルデータとオプションを受け取って全canvasを返す
  public generateAllLayerCanvases(
    vilFileContent: string,
    options: GenerationOptions = {}
  ): GenerationResult {
    // Vial設定をパース
    const config = this.parseVialConfig(vilFileContent)
    
    // オプションの設定
    const layerStart = options.layerRange?.start || 0
    const layerEnd = options.layerRange?.end || Math.min(3, config.layout.length - 1)
    const quality = options.quality || 'high'
    const scale = quality === 'low' ? 0.5 : 1.0
    
    console.log(`レイヤー生成開始: ${layerStart} から ${layerEnd}まで (品質: ${quality}, スケール: ${scale})`)
    
    const canvases: HTMLCanvasElement[] = []
    const layerNumbers: number[] = []
    
    // 各レイヤーのcanvasを生成
    for (let layer = layerStart; layer <= layerEnd; layer++) {
      if (layer < config.layout.length) {
        const canvas = this.generateKeyboardLayer(config, layer, options.renderOptions || {}, scale)
        canvases.push(canvas)
        layerNumbers.push(layer)
      }
    }
    
    console.log(`生成完了: ${canvases.length}個のcanvasを生成`)
    
    return {
      canvases,
      layerNumbers
    }
  }

  // 単一レイヤーのcanvasを生成
  private generateKeyboardLayer(
    config: VialConfig,
    layerIndex: number,
    options: RenderOptions,
    scale: number = 1.0
  ): HTMLCanvasElement {
    console.log(`レイヤー${layerIndex}の生成開始 (スケール: ${scale})`)
    
    // Combo情報を解析
    const combos = Parser.parseComboInfo(config)
    
    // 画像サイズを計算（スケールを適用）
    const contentWidth = this.unitX * 14.0 + 30.0 + this.keyWidth
    const contentHeight = this.unitY * 3.0 + this.keyHeight
    const imgWidth = Math.ceil((contentWidth + this.margin * 2) * scale)
    const imgHeight = Math.ceil((contentHeight + this.margin * 2) * scale)

    // ブラウザのCanvasを作成
    const canvas = document.createElement('canvas')
    canvas.width = imgWidth
    canvas.height = imgHeight
    const ctx = canvas.getContext('2d')!

    // スケール調整
    if (scale !== 1.0) {
      ctx.scale(scale, scale)
    }

    // テーマ色を取得
    const colors = getThemeColors(options.theme)
    
    // 背景を塗りつぶし
    ctx.fillStyle = options.backgroundColor || colors.background
    ctx.fillRect(0, 0, imgWidth / scale, imgHeight / scale)

    // キー配置情報を取得
    const positions = Utils.getKeyPositions(this.keyWidth, this.keyHeight, this.keyGap, this.margin)

    // 指定されたレイヤーのキーを描画
    if (config.layout.length > layerIndex) {
      const layer = config.layout[layerIndex]

      for (let rowIdx = 0; rowIdx < positions.length; rowIdx++) {
        for (let colIdx = 0; colIdx < positions[rowIdx].length; colIdx++) {
          const pos = positions[rowIdx][colIdx]
          if (!pos) continue

          const keycode = layer[rowIdx]?.[colIdx] || -1
          const label = Parser.keycodeToLabel(keycode, config)

          // キーを描画（Combo情報付き）
          const stringKeycode = String(keycode)
          Renderer.drawKey(ctx, pos, label, stringKeycode, combos, options)
          Renderer.drawText(ctx, pos, label, stringKeycode, combos, options)
        }
      }
    }

    // レイヤー番号を装飾付きで左下に表示
    Renderer.drawLayerNumber(ctx, layerIndex, canvas.width / scale, canvas.height / scale, options)

    console.log(`レイヤー${layerIndex}の生成完了: ${imgWidth}x${imgHeight}`)
    return canvas
  }

  // Vial設定をJSONとしてパース
  private parseVialConfig(vilFileContent: string): VialConfig {
    try {
      return JSON.parse(vilFileContent)
    } catch (error) {
      throw new Error(`Vial設定ファイルの解析に失敗しました: ${error}`)
    }
  }
}