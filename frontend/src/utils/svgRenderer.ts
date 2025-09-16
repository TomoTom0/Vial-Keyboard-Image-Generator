// Canvas API互換のSVGレンダラー
export class SVGRenderer {
  private elements: string[] = []
  private currentFillStyle: string = '#000000'
  private currentStrokeStyle: string = '#000000'
  private currentLineWidth: number = 1
  private currentFont: string = '16px Arial'
  private currentTextAlign: string = 'start'
  private currentTextBaseline: string = 'alphabetic'
  private vilData: string | null = null

  constructor(private width: number, private height: number) {}

  // Canvas API互換プロパティ
  set fillStyle(value: string) {
    this.currentFillStyle = value
  }

  get fillStyle(): string {
    return this.currentFillStyle
  }

  set strokeStyle(value: string) {
    this.currentStrokeStyle = value
  }

  get strokeStyle(): string {
    return this.currentStrokeStyle
  }

  set lineWidth(value: number) {
    this.currentLineWidth = value
  }

  get lineWidth(): number {
    return this.currentLineWidth
  }

  set font(value: string) {
    this.currentFont = value
  }

  get font(): string {
    return this.currentFont
  }

  set textAlign(value: string) {
    this.currentTextAlign = value
  }

  get textAlign(): string {
    return this.currentTextAlign
  }

  set textBaseline(value: string) {
    this.currentTextBaseline = value
  }

  get textBaseline(): string {
    return this.currentTextBaseline
  }

  // Canvas API互換メソッド
  fillRect(x: number, y: number, width: number, height: number): void {
    const rect = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${this.currentFillStyle}" />`
    this.elements.push(rect)
  }

  strokeRect(x: number, y: number, width: number, height: number): void {
    const rect = `<rect x="${x}" y="${y}" width="${width}" height="${height}" stroke="${this.currentStrokeStyle}" stroke-width="${this.currentLineWidth}" fill="none" />`
    this.elements.push(rect)
  }

  private pathCommands: string[] = []

  beginPath(): void {
    this.pathCommands = []
  }

  moveTo(x: number, y: number): void {
    this.pathCommands.push(`M ${x} ${y}`)
  }

  lineTo(x: number, y: number): void {
    this.pathCommands.push(`L ${x} ${y}`)
  }

  closePath(): void {
    this.pathCommands.push('Z')
  }

  fill(): void {
    if (this.pathCommands.length > 0) {
      const pathData = this.pathCommands.join(' ')
      const path = `<path d="${pathData}" fill="${this.currentFillStyle}" />`
      this.elements.push(path)
      this.pathCommands = []
    }
  }

  stroke(): void {
    if (this.pathCommands.length > 0) {
      const pathData = this.pathCommands.join(' ')
      const path = `<path d="${pathData}" stroke="${this.currentStrokeStyle}" stroke-width="${this.currentLineWidth}" fill="none" />`
      this.elements.push(path)
      this.pathCommands = []
    }
  }

  fillText(text: string, x: number, y: number): void {
    // フォント設定をパース
    const fontMatch = this.currentFont.match(/(\d+)px\s+(.+)/)
    const fontSize = fontMatch ? fontMatch[1] : '16'
    const fontFamily = fontMatch ? fontMatch[2] : 'Arial'

    // text-anchorを設定
    let textAnchor = 'start'
    if (this.currentTextAlign === 'center') {
      textAnchor = 'middle'
    } else if (this.currentTextAlign === 'right') {
      textAnchor = 'end'
    }

    // dominant-baselineを設定
    let dominantBaseline = 'auto'
    if (this.currentTextBaseline === 'middle') {
      dominantBaseline = 'middle'
    } else if (this.currentTextBaseline === 'top') {
      dominantBaseline = 'text-before-edge'
    } else if (this.currentTextBaseline === 'bottom') {
      dominantBaseline = 'text-after-edge'
    }

    // テキストをエスケープ
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

    const textElement = `<text x="${x}" y="${y}" font-family="${fontFamily}" font-size="${fontSize}" fill="${this.currentFillStyle}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${escapedText}</text>`
    this.elements.push(textElement)
  }

  // VILデータを設定
  setVilData(vilContent: string): void {
    // Base64エンコードしてSVGに埋め込み可能にする
    this.vilData = btoa(unescape(encodeURIComponent(vilContent)))
  }

  // SVG文字列を生成（VILデータメタデータ付き）
  toSVG(): string {
    const svgHeader = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">`

    let metadataSection = ''
    if (this.vilData) {
      metadataSection = `
  <metadata>
    <vil-keyboard-data encoding="base64">${this.vilData}</vil-keyboard-data>
  </metadata>`
    }

    const svgFooter = `</svg>`

    return svgHeader + metadataSection + '\n' + this.elements.join('\n') + '\n' + svgFooter
  }

  // リセット
  clear(): void {
    this.elements = []
    this.pathCommands = []
    this.vilData = null
  }

  // SVGからVILデータを抽出する静的メソッド
  static extractVilDataFromSVG(svgContent: string): string | null {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(svgContent, 'image/svg+xml')
      const vilElement = doc.querySelector('vil-keyboard-data')

      if (vilElement && vilElement.getAttribute('encoding') === 'base64') {
        const base64Data = vilElement.textContent?.trim()
        if (base64Data) {
          // Base64デコードしてJSON文字列を復元
          return decodeURIComponent(escape(atob(base64Data)))
        }
      }
      return null
    } catch (error) {
      console.error('Failed to extract VIL data from SVG:', error)
      return null
    }
  }
}