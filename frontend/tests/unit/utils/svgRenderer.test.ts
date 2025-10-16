import { describe, it, expect, beforeEach } from 'vitest'
import { SVGRenderer } from '@/utils/svgRenderer'

describe('SVGRenderer', () => {
  let renderer: SVGRenderer

  beforeEach(() => {
    renderer = new SVGRenderer(800, 600)
  })

  describe('初期化', () => {
    it('幅と高さを指定してレンダラーを作成できる', () => {
      expect(renderer).toBeDefined()
      expect(renderer.fillStyle).toBe('#000000')
      expect(renderer.strokeStyle).toBe('#000000')
    })
  })

  describe('Canvas API互換プロパティ', () => {
    it('fillStyleを設定・取得できる', () => {
      renderer.fillStyle = '#FF0000'
      expect(renderer.fillStyle).toBe('#FF0000')
    })

    it('strokeStyleを設定・取得できる', () => {
      renderer.strokeStyle = '#00FF00'
      expect(renderer.strokeStyle).toBe('#00FF00')
    })

    it('lineWidthを設定・取得できる', () => {
      renderer.lineWidth = 3
      expect(renderer.lineWidth).toBe(3)
    })

    it('fontを設定・取得できる', () => {
      renderer.font = '24px Arial'
      expect(renderer.font).toBe('24px Arial')
    })

    it('textAlignを設定・取得できる', () => {
      renderer.textAlign = 'center'
      expect(renderer.textAlign).toBe('center')
    })

    it('textBaselineを設定・取得できる', () => {
      renderer.textBaseline = 'middle'
      expect(renderer.textBaseline).toBe('middle')
    })
  })

  describe('fillRect', () => {
    it('塗りつぶし矩形のSVG要素を生成する', () => {
      renderer.fillStyle = '#FF0000'
      renderer.fillRect(10, 20, 100, 50)

      const svg = renderer.toSVG()

      expect(svg).toContain('<rect')
      expect(svg).toContain('x="10"')
      expect(svg).toContain('y="20"')
      expect(svg).toContain('width="100"')
      expect(svg).toContain('height="50"')
      expect(svg).toContain('fill="#FF0000"')
    })
  })

  describe('strokeRect', () => {
    it('枠線矩形のSVG要素を生成する', () => {
      renderer.strokeStyle = '#0000FF'
      renderer.lineWidth = 2
      renderer.strokeRect(15, 25, 80, 40)

      const svg = renderer.toSVG()

      expect(svg).toContain('<rect')
      expect(svg).toContain('x="15"')
      expect(svg).toContain('y="25"')
      expect(svg).toContain('width="80"')
      expect(svg).toContain('height="40"')
      expect(svg).toContain('stroke="#0000FF"')
      expect(svg).toContain('stroke-width="2"')
      expect(svg).toContain('fill="none"')
    })
  })

  describe('パス描画', () => {
    it('beginPath, moveTo, lineTo, fillでパスを描画できる', () => {
      renderer.fillStyle = '#00FF00'
      renderer.beginPath()
      renderer.moveTo(10, 10)
      renderer.lineTo(50, 10)
      renderer.lineTo(30, 50)
      renderer.fill()

      const svg = renderer.toSVG()

      expect(svg).toContain('<path')
      expect(svg).toContain('d="M 10 10 L 50 10 L 30 50"')
      expect(svg).toContain('fill="#00FF00"')
    })

    it('beginPath, moveTo, lineTo, closePath, fillで閉じたパスを描画できる', () => {
      renderer.fillStyle = '#FF00FF'
      renderer.beginPath()
      renderer.moveTo(10, 10)
      renderer.lineTo(50, 10)
      renderer.lineTo(30, 50)
      renderer.closePath()
      renderer.fill()

      const svg = renderer.toSVG()

      expect(svg).toContain('<path')
      expect(svg).toContain('d="M 10 10 L 50 10 L 30 50 Z"')
      expect(svg).toContain('fill="#FF00FF"')
    })

    it('stroke()でパスをストロークできる', () => {
      renderer.strokeStyle = '#FFFF00'
      renderer.lineWidth = 3
      renderer.beginPath()
      renderer.moveTo(20, 20)
      renderer.lineTo(60, 20)
      renderer.stroke()

      const svg = renderer.toSVG()

      expect(svg).toContain('<path')
      expect(svg).toContain('d="M 20 20 L 60 20"')
      expect(svg).toContain('stroke="#FFFF00"')
      expect(svg).toContain('stroke-width="3"')
      expect(svg).toContain('fill="none"')
    })
  })

  describe('fillText', () => {
    it('テキストのSVG要素を生成する', () => {
      renderer.fillStyle = '#000000'
      renderer.font = '16px Arial'
      renderer.fillText('Hello', 100, 50)

      const svg = renderer.toSVG()

      expect(svg).toContain('<text')
      expect(svg).toContain('x="100"')
      expect(svg).toContain('y="50"')
      expect(svg).toContain('font-family="Arial"')
      expect(svg).toContain('font-size="16"')
      expect(svg).toContain('fill="#000000"')
      expect(svg).toContain('>Hello</text>')
    })

    it('textAlign=centerでtext-anchor=middleを設定する', () => {
      renderer.textAlign = 'center'
      renderer.fillText('Center', 100, 50)

      const svg = renderer.toSVG()

      expect(svg).toContain('text-anchor="middle"')
    })

    it('textAlign=rightでtext-anchor=endを設定する', () => {
      renderer.textAlign = 'right'
      renderer.fillText('Right', 100, 50)

      const svg = renderer.toSVG()

      expect(svg).toContain('text-anchor="end"')
    })

    it('textBaseline=middleでdominant-baseline=middleを設定する', () => {
      renderer.textBaseline = 'middle'
      renderer.fillText('Middle', 100, 50)

      const svg = renderer.toSVG()

      expect(svg).toContain('dominant-baseline="middle"')
    })

    it('特殊文字をエスケープする', () => {
      renderer.fillText('<>&"\' test', 100, 50)

      const svg = renderer.toSVG()

      expect(svg).toContain('&lt;&gt;&amp;&quot;&#39; test')
    })
  })

  describe('VILデータメタデータ', () => {
    it('setVilDataでVILデータをBase64エンコードして設定する', () => {
      const vilData = JSON.stringify({ name: 'Test Keyboard' })
      renderer.setVilData(vilData)

      const svg = renderer.toSVG()

      expect(svg).toContain('<metadata>')
      expect(svg).toContain('<vil-keyboard-data encoding="base64">')
      expect(svg).toContain('</vil-keyboard-data>')
      expect(svg).toContain('</metadata>')
    })

    it('VILデータなしの場合はメタデータセクションを含まない', () => {
      const svg = renderer.toSVG()

      expect(svg).not.toContain('<metadata>')
      expect(svg).not.toContain('<vil-keyboard-data')
    })
  })

  describe('extractVilDataFromSVG', () => {
    it('SVGからVILデータを抽出できる', () => {
      const vilData = JSON.stringify({ name: 'Test Keyboard', layout: [] })
      renderer.setVilData(vilData)
      const svg = renderer.toSVG()

      const extracted = SVGRenderer.extractVilDataFromSVG(svg)

      expect(extracted).toBe(vilData)
    })

    it('VILデータがないSVGでnullを返す', () => {
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
</svg>`

      const extracted = SVGRenderer.extractVilDataFromSVG(svg)

      expect(extracted).toBeNull()
    })

    it('無効なSVGでnullを返す', () => {
      const invalidSVG = 'This is not an SVG'

      const extracted = SVGRenderer.extractVilDataFromSVG(invalidSVG)

      expect(extracted).toBeNull()
    })
  })

  describe('toSVG', () => {
    it('完全なSVG文字列を生成する', () => {
      renderer.fillStyle = '#FF0000'
      renderer.fillRect(10, 10, 100, 50)

      const svg = renderer.toSVG()

      expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(svg).toContain('<svg')
      expect(svg).toContain('width="800"')
      expect(svg).toContain('height="600"')
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
      expect(svg).toContain('</svg>')
    })

    it('複数の要素を含むSVGを生成する', () => {
      renderer.fillStyle = '#FF0000'
      renderer.fillRect(10, 10, 50, 50)

      renderer.strokeStyle = '#0000FF'
      renderer.strokeRect(70, 10, 50, 50)

      renderer.fillStyle = '#000000'
      renderer.fillText('Test', 10, 80)

      const svg = renderer.toSVG()

      // 全ての要素が含まれている
      expect(svg.match(/<rect/g)?.length).toBe(2)
      expect(svg.match(/<text/g)?.length).toBe(1)
    })
  })

  describe('clear', () => {
    it('全ての要素とVILデータをクリアする', () => {
      renderer.fillStyle = '#FF0000'
      renderer.fillRect(10, 10, 100, 50)
      renderer.setVilData(JSON.stringify({ name: 'Test' }))

      renderer.clear()

      const svg = renderer.toSVG()

      // SVGヘッダーとフッターのみ
      expect(svg).not.toContain('<rect')
      expect(svg).not.toContain('<metadata>')
    })
  })

  describe('Canvas API互換性', () => {
    it('Canvas描画と同じ順序で要素を生成する', () => {
      // 背景
      renderer.fillStyle = '#FFFFFF'
      renderer.fillRect(0, 0, 800, 600)

      // ボタン
      renderer.fillStyle = '#333333'
      renderer.fillRect(10, 10, 100, 100)

      // テキスト
      renderer.fillStyle = '#FFFFFF'
      renderer.fillText('A', 60, 60)

      const svg = renderer.toSVG()

      // 要素が正しい順序で含まれている
      const fillRectIndex = svg.indexOf('fill="#333333"')
      const textIndex = svg.indexOf('>A</text>')

      expect(fillRectIndex).toBeGreaterThan(-1)
      expect(textIndex).toBeGreaterThan(fillRectIndex)
    })
  })
})
